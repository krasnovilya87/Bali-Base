import React, { useRef, useState } from 'react';
import { Listing } from '../../../types';
import { uploadFileToStorage } from '../../../firebase';
import { useI18n } from '../../../i18nContext';
import {
  PHOTO_SLOT_CONFIG,
  PhotoSlotConfig,
  PhotoSlotId,
  REQUIRED_PHOTO_SLOTS
} from '../constants';

type UsePhotoStepParams = {
  initialListing?: Listing | null;
};

export const usePhotoStep = ({ initialListing }: UsePhotoStepParams) => {
  const { tr } = useI18n();

  // STEP 6: Dropzone & ImgBB upload library replica with previews
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    initialListing?.images?.length ? initialListing.images : []
  );
  const [photoSlotAssignments, setPhotoSlotAssignments] = useState<Partial<Record<PhotoSlotId, string[]>>>(() => {
    if (!initialListing?.images?.length) return {};
    return PHOTO_SLOT_CONFIG.reduce<Partial<Record<PhotoSlotId, string[]>>>((acc, slot) => {
      const startIndex = PHOTO_SLOT_CONFIG.slice(0, slot.index).reduce((sum, item) => sum + item.maxCount, 0);
      const assignedImages = initialListing.images.slice(startIndex, startIndex + slot.maxCount);
      if (assignedImages.length) acc[slot.id] = assignedImages;
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
        const urls = (prev[slot.id] || []).filter(url => url !== photoUrl && photoUrls.includes(url));
        if (urls.length) next[slot.id] = urls;
      });

      if (slotId !== 'extra') {
        const slot = PHOTO_SLOT_CONFIG.find(item => item.id === slotId);
        if (!slot) return next;
        const currentUrls = next[slotId] || [];
        next[slotId] = [...currentUrls, photoUrl];
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
    try {
      const envKey = (import.meta as any).env?.VITE_FREEIMAGE_API_KEY;
      const apiKey = (envKey && envKey !== 'YOUR_FREEIMAGE_API_KEY' && envKey.trim() !== '')
        ? envKey
        : '6d207e02198a847aa98d0a2a901485a5';

      console.log('Attempting upload to freeimage.host in binary mode...');

      // Attempt 1: Upload via binary FormData (preferred)
      try {
        const formData = new FormData();
        formData.append('source', file);

        const response = await fetch(`https://freeimage.host/api/1/upload?key=${apiKey}&action=upload`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData && resData.image && (resData.image.url || resData.image.display_url)) {
            let uploadedUrl = resData.image.url || resData.image.display_url;
            if (uploadedUrl.startsWith('http://')) {
              uploadedUrl = uploadedUrl.replace('http://', 'https://');
            }
            console.log('freeimage.host binary upload successful:', uploadedUrl);
            setPhotoUrls(prev => [...prev, uploadedUrl]);
            return;
          }
        }
        console.warn('freeimage.host binary upload returned response, but did not match success schema.');
      } catch (binErr) {
        console.warn('freeimage.host binary upload failed, trying base64 fallback...', binErr);
      }

      // Attempt 2: Upload via Base64 string parameter (alternative)
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const resultStr = reader.result as string;
            const commaIndex = resultStr.indexOf(',');
            if (commaIndex !== -1) {
              resolve(resultStr.substring(commaIndex + 1));
            } else {
              resolve(resultStr);
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        const formData = new FormData();
        formData.append('source', base64Data);

        const response = await fetch(`https://freeimage.host/api/1/upload?key=${apiKey}&action=upload`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData && resData.image && (resData.image.url || resData.image.display_url)) {
            let uploadedUrl = resData.image.url || resData.image.display_url;
            if (uploadedUrl.startsWith('http://')) {
              uploadedUrl = uploadedUrl.replace('http://', 'https://');
            }
            console.log('freeimage.host base64 upload successful:', uploadedUrl);
            setPhotoUrls(prev => [...prev, uploadedUrl]);
            return;
          }
        }
      } catch (b64Err) {
        console.warn('freeimage.host base64 upload failed, trying Firebase Storage fallback...', b64Err);
      }

      // Attempt 3: Firebase Storage fallback (confirmed working, ultra-reliable fallback)
      console.log('Attempting Firebase Storage fallback upload...');
      try {
        const randomToken = Math.random().toString(36).substring(2, 9);
        const cleanName = file.name ? file.name.replace(/[^a-zA-Z0-9.-]/g, '_') : 'photo.jpg';
        const filePath = `listings/${Date.now()}_${randomToken}_${cleanName}`;

        const downloadUrl = await uploadFileToStorage(file, filePath);
        if (downloadUrl) {
          console.log('Firebase Storage fallback upload successful:', downloadUrl);
          setPhotoUrls(prev => [...prev, downloadUrl]);
          return;
        }
      } catch (fbErr: any) {
        console.error('Firebase Storage fallback upload failed:', fbErr);
      }

      // Attempt 4: Local base64 string fallback (no remote server, last resort)
      try {
        const reader = new FileReader();
        const loadPromise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
        });
        reader.readAsDataURL(file);
        const base64Url = await loadPromise;
        setPhotoUrls(prev => [...prev, base64Url]);
      } catch (readerErr) {
        console.error('Local Base64 fallback failed', readerErr);
        setUploadError(tr('wizard.photos.loadImageError'));
      }
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
    dragActive,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileChoose,
    handleRemovePhoto
  };
};
