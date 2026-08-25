import React, { useRef, useState } from 'react';
import { Listing } from '../../../types';
import { useI18n } from '../../../i18nContext';
import { ImageUploadError, ImageUploadDiagnosticStep, uploadImageToFreeImageHost } from '../../../utils/imageUpload';
import {
  PHOTO_SLOT_CONFIG,
  PhotoSlotConfig,
  PhotoSlotId,
  REQUIRED_PHOTO_SLOTS
} from '../constants';

type UsePhotoStepParams = {
  initialListing?: Listing | null;
};

type PhotoUploadDiagnostic = {
  fileName: string;
  fileType: string;
  fileSizeKb: number;
  uploadSizeKb?: number;
  compressed: boolean;
  steps: ImageUploadDiagnosticStep[];
  errorMessage: string;
};

export const usePhotoStep = ({ initialListing }: UsePhotoStepParams) => {
  const { tr } = useI18n();

  // STEP 6: Dropzone upload library with previews
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    initialListing?.images?.length ? initialListing.images : []
  );
  const [photoSlotAssignments, setPhotoSlotAssignments] = useState<Partial<Record<PhotoSlotId, string[]>>>(() => {
    if (!initialListing?.images?.length || !initialListing.photoSlotAssignments) return {};
    return PHOTO_SLOT_CONFIG.reduce<Partial<Record<PhotoSlotId, string[]>>>((acc, slot) => {
      const assignedImages = (initialListing.photoSlotAssignments?.[slot.id] || [])
        .filter(url => initialListing.images.includes(url))
        .slice(0, slot.maxCount);
      if (assignedImages.length) {
        acc[slot.id] = assignedImages;
      }
      return acc;
    }, {});
  });
  const [draggedPhotoSlotId, setDraggedPhotoSlotId] = useState<PhotoSlotId | null>(null);

  const getAssignedPhotoUrls = (slotId: PhotoSlotId) => photoSlotAssignments[slotId] || [];

  const getRemainingPhotoCount = (slot: PhotoSlotConfig) => Math.max(0, slot.maxCount - getAssignedPhotoUrls(slot.id).length);

  const assignPhotoToSlot = (photoUrl: string, slotId: PhotoSlotId | 'extra') => {
    setPhotoSlotAssignments(prev => {
      const next: Partial<Record<PhotoSlotId, string[]>> = {};
      PHOTO_SLOT_CONFIG.forEach(slot => {
        const urls = (prev[slot.id] || []).filter(url => url !== photoUrl);
        if (urls.length) next[slot.id] = urls;
      });

      if (slotId !== 'extra') {
        const slot = PHOTO_SLOT_CONFIG.find(item => item.id === slotId);
        if (!slot) return next;
        const currentUrls = next[slotId] || [];
        next[slotId] = [...currentUrls, photoUrl].slice(-slot.maxCount);
      }

      return next;
    });
  };

  const getPhotoSlot = (photoUrl: string) => {
    return PHOTO_SLOT_CONFIG.find(slot => (photoSlotAssignments[slot.id] || []).includes(photoUrl));
  };

  const requiredPhotoAssignedCount = REQUIRED_PHOTO_SLOTS.reduce((sum, slot) => sum + getAssignedPhotoUrls(slot.id).length, 0);
  const requiredPhotoTotalCount = REQUIRED_PHOTO_SLOTS.reduce((sum, slot) => sum + slot.maxCount, 0);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadDiagnostic, setUploadDiagnostic] = useState<PhotoUploadDiagnostic | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeAndCompressListingImage = (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1200;
          const maxHeight = 900;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.82);
        };
        img.onerror = () => resolve(file);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const uploadPhotoToStorage = async (file: File) => {
    setIsUploading(true);
    setUploadError('');
    setUploadDiagnostic(null);
    let uploadableImage: Blob | File = file;
    try {
      uploadableImage = await resizeAndCompressListingImage(file);
      const uploadedUrl = await uploadImageToFreeImageHost(uploadableImage);
      setPhotoUrls(prev => [...prev, uploadedUrl]);
    } catch (error) {
      const diagnostic: PhotoUploadDiagnostic = {
        fileName: file.name || 'unnamed file',
        fileType: file.type || 'unknown',
        fileSizeKb: Math.round(file.size / 1024),
        uploadSizeKb: Math.round(uploadableImage.size / 1024),
        compressed: uploadableImage !== file,
        steps: error instanceof ImageUploadError ? error.diagnostics : [],
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      console.error('freeimage.host upload failed', diagnostic, error);
      setUploadDiagnostic(diagnostic);
      setUploadError(tr('wizard.photos.loadImageError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files as any).filter((file: any) => file.type.startsWith('image/'));
      for (const file of files as any) {
        await uploadPhotoToStorage(file);
      }
    }
  };

  const handleFileChoose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files as any).filter((file: any) => file.type.startsWith('image/'));
      for (const file of files as any) {
        await uploadPhotoToStorage(file);
      }
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    const removedUrl = photoUrls[index];
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
    setPhotoSlotAssignments(prev => {
      const next: Partial<Record<PhotoSlotId, string[]>> = {};
      PHOTO_SLOT_CONFIG.forEach(slot => {
        const urls = (prev[slot.id] || []).filter(url => url !== removedUrl);
        if (urls.length) {
          next[slot.id] = urls;
        }
      });
      return next;
    });
  };

  return {
    photoUrls,
    photoSlotAssignments,
    draggedPhotoSlotId,
    setDraggedPhotoSlotId,
    getAssignedPhotoUrls,
    getRemainingPhotoCount,
    assignPhotoToSlot,
    getPhotoSlot,
    requiredPhotoAssignedCount,
    requiredPhotoTotalCount,
    isUploading,
    uploadError,
    uploadDiagnostic,
    dragActive,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileChoose,
    handleRemovePhoto
  };
};
