import React, { useRef, useState } from 'react';
import { Listing } from '../../../types';
import { useI18n } from '../../../i18nContext';
import { ImageUploadError, ImageUploadDiagnosticStep, uploadImageToFreeImageHost } from '../../../utils/imageUpload';
import {
  PHOTO_SLOT_CONFIG,
  SCOOTER_PHOTO_SLOT_CONFIG,
  PhotoSlotConfig,
  PhotoSlotId
} from '../constants';

type UsePhotoStepParams = {
  initialListing?: Listing | null;
  category: string;
  subCategory: string;
  uploadNamingContext?: {
    brand?: string;
    model?: string;
    year?: string;
    color?: string;
  };
};

type PhotoUploadSource = 'camera' | 'gallery' | 'files';

type PhotoUploadDiagnostic = {
  fileName: string;
  fileType: string;
  fileSizeKb: number;
  uploadSizeKb?: number;
  compressed: boolean;
  steps: ImageUploadDiagnosticStep[];
  errorMessage: string;
};

const slugifyPhotoNamePart = (value?: string) => {
  const slug = (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'unknown';
};

const getLocalUploadDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getUploadExtension = (image: Blob | File, fallbackFile: File) => {
  const type = image.type || fallbackFile.type;
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';

  return 'jpg';
};

export const usePhotoStep = ({ initialListing, category, subCategory, uploadNamingContext }: UsePhotoStepParams) => {
  const { tr } = useI18n();
  const isScooterPhotoFlow = category === 'transport' && subCategory === 'scooters';
  const activePhotoSlotConfig = isScooterPhotoFlow ? SCOOTER_PHOTO_SLOT_CONFIG : PHOTO_SLOT_CONFIG;
  const requiredPhotoSlots = activePhotoSlotConfig.filter(slot => slot.required);
  const optionalPhotoSlots = activePhotoSlotConfig.filter(slot => !slot.required);

  // STEP 6: Dropzone upload library with previews
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    initialListing?.images?.length ? initialListing.images : []
  );
  const [photoSlotAssignments, setPhotoSlotAssignments] = useState<Partial<Record<PhotoSlotId, string[]>>>(() => {
    if (!initialListing?.images?.length || !initialListing.photoSlotAssignments) return {};
    return activePhotoSlotConfig.reduce<Partial<Record<PhotoSlotId, string[]>>>((acc, slot) => {
      const assignedImages = (initialListing.photoSlotAssignments?.[slot.id] || [])
        .filter(url => initialListing.images.includes(url))
        .slice(0, slot.maxCount);
      if (assignedImages.length) {
        acc[slot.id] = assignedImages;
      }
      return acc;
    }, {});
  });
  const [realPhotoUrls, setRealPhotoUrls] = useState<string[]>(initialListing?.realPhotoUrls || []);
  const [draggedPhotoSlotId, setDraggedPhotoSlotId] = useState<PhotoSlotId | null>(null);

  const getAssignedPhotoUrls = (slotId: PhotoSlotId) => photoSlotAssignments[slotId] || [];

  const getRemainingPhotoCount = (slot: PhotoSlotConfig) => Math.max(0, slot.maxCount - getAssignedPhotoUrls(slot.id).length);

  const assignPhotoToSlot = (photoUrl: string, slotId: PhotoSlotId | 'extra') => {
    setPhotoSlotAssignments(prev => {
      const next: Partial<Record<PhotoSlotId, string[]>> = {};
      activePhotoSlotConfig.forEach(slot => {
        const urls = (prev[slot.id] || []).filter(url => url !== photoUrl);
        if (urls.length) next[slot.id] = urls;
      });

      if (slotId !== 'extra') {
        const slot = activePhotoSlotConfig.find(item => item.id === slotId);
        if (!slot) return next;
        const currentUrls = next[slotId] || [];
        next[slotId] = [...currentUrls, photoUrl].slice(-slot.maxCount);
      }

      return next;
    });
  };

  const getPhotoSlot = (photoUrl: string) => {
    return activePhotoSlotConfig.find(slot => (photoSlotAssignments[slot.id] || []).includes(photoUrl));
  };

  const requiredPhotoAssignedCount = requiredPhotoSlots.reduce((sum, slot) => sum + getAssignedPhotoUrls(slot.id).length, 0);
  const requiredPhotoTotalCount = requiredPhotoSlots.reduce((sum, slot) => sum + slot.maxCount, 0);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadDiagnostic, setUploadDiagnostic] = useState<PhotoUploadDiagnostic | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraTargetSlotIdRef = useRef<PhotoSlotId | null>(null);

  const assignUploadedPhoto = (photoUrl: string, preferredSlotId?: PhotoSlotId | null) => {
    if (!isScooterPhotoFlow) return;

    setPhotoSlotAssignments(prev => {
      const next: Partial<Record<PhotoSlotId, string[]>> = {};
      activePhotoSlotConfig.forEach(slot => {
        const urls = prev[slot.id] || [];
        if (urls.length) next[slot.id] = urls;
      });

      const preferredSlot = preferredSlotId
        ? requiredPhotoSlots.find(slot => slot.id === preferredSlotId)
        : undefined;
      const nextRequiredSlot = preferredSlot || requiredPhotoSlots.find(slot => (next[slot.id] || []).length < slot.maxCount);
      if (!nextRequiredSlot) return next;

      next[nextRequiredSlot.id] = [...(next[nextRequiredSlot.id] || []), photoUrl].slice(0, nextRequiredSlot.maxCount);
      return next;
    });
  };

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

  const buildSeoPhotoFileName = (image: Blob | File, originalFile: File, batchOffset = 0) => {
    if (!uploadNamingContext) {
      return originalFile.name || `listing-photo-${getLocalUploadDate()}.${getUploadExtension(image, originalFile)}`;
    }

    const sequenceNumber = String(photoUrls.length + batchOffset + 1).padStart(2, '0');
    const nameParts = [
      uploadNamingContext?.brand,
      uploadNamingContext?.model,
      uploadNamingContext?.year,
      uploadNamingContext?.color,
      getLocalUploadDate(),
      sequenceNumber
    ].map(slugifyPhotoNamePart);

    return `${nameParts.join('-')}.${getUploadExtension(image, originalFile)}`;
  };

  const uploadPhotoToStorage = async (file: File, source: PhotoUploadSource = 'files', batchOffset = 0) => {
    setIsUploading(true);
    setUploadError('');
    setUploadDiagnostic(null);
    let uploadableImage: Blob | File = file;
    try {
      uploadableImage = await resizeAndCompressListingImage(file);
      const seoFileName = buildSeoPhotoFileName(uploadableImage, file, batchOffset);
      const uploadedUrl = await uploadImageToFreeImageHost(uploadableImage, {
        fileName: seoFileName,
        fileType: uploadableImage.type || file.type || 'image/jpeg'
      });
      setPhotoUrls(prev => [...prev, uploadedUrl]);
      if (source === 'camera') {
        setRealPhotoUrls(prev => prev.includes(uploadedUrl) ? prev : [...prev, uploadedUrl]);
      }
      assignUploadedPhoto(uploadedUrl, source === 'camera' ? cameraTargetSlotIdRef.current : null);
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
      for (const [index, file] of (files as File[]).entries()) {
        await uploadPhotoToStorage(file, 'files', index);
      }
    }
  };

  const handleFileChoose = async (e: React.ChangeEvent<HTMLInputElement>, source: PhotoUploadSource = 'files') => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files as any).filter((file: any) => file.type.startsWith('image/'));
      for (const [index, file] of (files as File[]).entries()) {
        await uploadPhotoToStorage(file, source, index);
      }
      if (source === 'camera') {
        cameraTargetSlotIdRef.current = null;
      }
      e.target.value = '';
    }
  };

  const openCameraForSlot = (slotId?: PhotoSlotId) => {
    cameraTargetSlotIdRef.current = slotId || null;
    cameraInputRef.current?.click();
  };

  const uploadCameraPhotoForSlot = async (file: File, slotId?: PhotoSlotId | null) => {
    cameraTargetSlotIdRef.current = slotId || null;
    await uploadPhotoToStorage(file, 'camera');
    cameraTargetSlotIdRef.current = null;
  };

  const handleRemovePhoto = (index: number) => {
    const removedUrl = photoUrls[index];
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
    setPhotoSlotAssignments(prev => {
      const next: Partial<Record<PhotoSlotId, string[]>> = {};
      activePhotoSlotConfig.forEach(slot => {
        const urls = (prev[slot.id] || []).filter(url => url !== removedUrl);
        if (urls.length) {
          next[slot.id] = urls;
        }
      });
      return next;
    });
    setRealPhotoUrls(prev => prev.filter(url => url !== removedUrl));
  };

  return {
    photoUrls,
    realPhotoUrls,
    photoSlotAssignments,
    activePhotoSlotConfig,
    requiredPhotoSlots,
    optionalPhotoSlots,
    isScooterPhotoFlow,
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
    cameraInputRef,
    galleryInputRef,
    handleDrag,
    handleDrop,
    handleFileChoose,
    handleCameraChoose: (event: React.ChangeEvent<HTMLInputElement>) => handleFileChoose(event, 'camera'),
    handleGalleryChoose: (event: React.ChangeEvent<HTMLInputElement>) => handleFileChoose(event, 'gallery'),
    openCameraForSlot,
    uploadCameraPhotoForSlot,
    handleRemovePhoto
  };
};
