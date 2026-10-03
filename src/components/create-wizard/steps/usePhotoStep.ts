import React, { useRef, useState } from 'react';
import { Listing } from '../../../types';
import { useI18n } from '../../../i18nContext';
import { ImageUploadError, ImageUploadDiagnosticStep, uploadImageToImageKit } from '../../../utils/imageUpload';
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

const MAX_LISTING_PHOTO_SIZE_MB = 15;
const MAX_LISTING_PHOTO_SIZE_BYTES = MAX_LISTING_PHOTO_SIZE_MB * 1024 * 1024;

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
  const isServicePhotoFlow = category === 'services';
  const isUncategorizedPhotoFlow = category === 'afisha' || category === 'life';
  const activePhotoSlotConfig = isScooterPhotoFlow
    ? SCOOTER_PHOTO_SLOT_CONFIG
    : isServicePhotoFlow || isUncategorizedPhotoFlow
      ? []
      : PHOTO_SLOT_CONFIG;
  const requiredPhotoSlots = activePhotoSlotConfig.filter(slot => slot.required);
  const optionalPhotoSlots = activePhotoSlotConfig.filter(slot => !slot.required);

  // STEP 6: Dropzone upload library with previews
  const [photoUrls, setPhotoUrlsState] = useState<string[]>(
    initialListing?.images?.length ? initialListing.images : []
  );
  const photoUrlsRef = useRef(photoUrls);
  const setPhotoUrls = (updater: React.SetStateAction<string[]>) => {
    const next = typeof updater === 'function'
      ? (updater as (value: string[]) => string[])(photoUrlsRef.current)
      : updater;
    photoUrlsRef.current = next;
    setPhotoUrlsState(next);
  };
  const [photoSlotAssignments, setPhotoSlotAssignmentsState] = useState<Partial<Record<PhotoSlotId, string[]>>>(() => {
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
  const photoSlotAssignmentsRef = useRef(photoSlotAssignments);
  const setPhotoSlotAssignments = (updater: React.SetStateAction<Partial<Record<PhotoSlotId, string[]>>>) => {
    const next = typeof updater === 'function'
      ? (updater as (value: Partial<Record<PhotoSlotId, string[]>>) => Partial<Record<PhotoSlotId, string[]>>)(photoSlotAssignmentsRef.current)
      : updater;
    photoSlotAssignmentsRef.current = next;
    setPhotoSlotAssignmentsState(next);
  };
  const [realPhotoUrls, setRealPhotoUrlsState] = useState<string[]>(initialListing?.realPhotoUrls || []);
  const realPhotoUrlsRef = useRef(realPhotoUrls);
  const setRealPhotoUrls = (updater: React.SetStateAction<string[]>) => {
    const next = typeof updater === 'function'
      ? (updater as (value: string[]) => string[])(realPhotoUrlsRef.current)
      : updater;
    realPhotoUrlsRef.current = next;
    setRealPhotoUrlsState(next);
  };
  const [draggedPhotoSlotId, setDraggedPhotoSlotId] = useState<PhotoSlotId | null>(null);
  const uploadSequenceRef = useRef(initialListing?.images?.length || 0);
  const uploadPromisesRef = useRef<Set<Promise<void>>>(new Set());
  const photoErrorsRef = useRef(new Map<string, string>());

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

  const [activeUploadCount, setActiveUploadCount] = useState(0);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadDiagnostic, setUploadDiagnostic] = useState<PhotoUploadDiagnostic | null>(null);
  const [isPreparingPhotoPreview, setIsPreparingPhotoPreview] = useState(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraTargetSlotIdRef = useRef<PhotoSlotId | null>(null);
  const isUploading = activeUploadCount > 0;

  const beginUpload = () => setActiveUploadCount(count => count + 1);
  const endUpload = () => setActiveUploadCount(count => Math.max(0, count - 1));
  const waitForPreviewIndicatorPaint = () =>
    new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
        setTimeout(resolve, 0);
        return;
      }

      window.requestAnimationFrame(() => resolve());
    });
  const trackPhotoUpload = (promise: Promise<void>) => {
    uploadPromisesRef.current.add(promise);
    promise.finally(() => {
      uploadPromisesRef.current.delete(promise);
    });
    return promise;
  };

  const waitForPhotoUploads = async () => {
    while (uploadPromisesRef.current.size > 0) {
      await Promise.allSettled(Array.from(uploadPromisesRef.current));
    }

    const failedPhoto = photoUrlsRef.current.find(url => photoErrorsRef.current.has(url));
    if (failedPhoto) {
      throw new Error(`${tr('wizard.publication.photoFailed')} ${photoErrorsRef.current.get(failedPhoto)}`);
    }
    return {
      photoUrls: photoUrlsRef.current,
      realPhotoUrls: realPhotoUrlsRef.current,
      photoSlotAssignments: photoSlotAssignmentsRef.current
    };
  };

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

  const isPhotoWithinSizeLimit = (file: File) => {
    if (file.size <= MAX_LISTING_PHOTO_SIZE_BYTES) return true;

    setUploadError(tr('wizard.photos.fileTooLarge', { size: MAX_LISTING_PHOTO_SIZE_MB }));
    setUploadDiagnostic(null);
    return false;
  };

  const buildSeoPhotoFileName = (image: Blob | File, originalFile: File, batchOffset = 0, sequenceOverride?: number) => {
    if (!uploadNamingContext) {
      return `${originalFile.name.replace(/\.[^.]+$/, '') || `listing-photo-${getLocalUploadDate()}`}.${getUploadExtension(image, originalFile)}`;
    }

    const sequenceNumber = String(sequenceOverride ?? photoUrls.length + batchOffset + 1).padStart(2, '0');
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

  const uploadPhotoToStorage = (file: File, source: PhotoUploadSource = 'files', batchOffset = 0) => {
    if (!isPhotoWithinSizeLimit(file)) return;

    const preferredSlotId = source === 'camera' ? cameraTargetSlotIdRef.current : null;
    const localPreviewUrl = URL.createObjectURL(file);
    setPhotoUrls(prev => [...prev, localPreviewUrl]);
    if (source === 'camera') {
      setRealPhotoUrls(prev => prev.includes(localPreviewUrl) ? prev : [...prev, localPreviewUrl]);
    }
    assignUploadedPhoto(localPreviewUrl, preferredSlotId);

    return trackPhotoUpload((async () => {
      beginUpload();
      setUploadError('');
      setUploadDiagnostic(null);
      let uploadableImage: Blob | File = file;
      try {
        await waitForPreviewIndicatorPaint();
        const seoFileName = buildSeoPhotoFileName(uploadableImage, file, batchOffset, ++uploadSequenceRef.current);
        const uploadedUrl = await uploadImageToImageKit(uploadableImage, {
          fileName: seoFileName,
          fileType: uploadableImage.type || file.type || 'image/jpeg'
        });
        replacePhotoUrl(localPreviewUrl, uploadedUrl);
        // Keep the final hosted image URL for every upload source. The local
        // object URL is only a temporary preview and must never be published.
        setRealPhotoUrls(prev => prev.includes(uploadedUrl) ? prev : [...prev, uploadedUrl]);
        URL.revokeObjectURL(localPreviewUrl);
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
        console.error('ImageKit upload failed', diagnostic, error);
        photoErrorsRef.current.set(localPreviewUrl, diagnostic.errorMessage);
        // A local object URL is only a temporary preview. Remove it so a
        // failed conversion/upload can never be written to the listing.
        setPhotoUrls(prev => prev.filter(url => url !== localPreviewUrl));
        setRealPhotoUrls(prev => prev.filter(url => url !== localPreviewUrl));
        setPhotoSlotAssignments(prev => {
          const next: Partial<Record<PhotoSlotId, string[]>> = {};
          activePhotoSlotConfig.forEach(slot => {
            const urls = (prev[slot.id] || []).filter(url => url !== localPreviewUrl);
            if (urls.length) next[slot.id] = urls;
          });
          return next;
        });
        setUploadDiagnostic(diagnostic);
      } finally {
        endUpload();
      }
    })());
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
      if (!files.length) return;
      setIsPreparingPhotoPreview(true);
      try {
        await waitForPreviewIndicatorPaint();
        for (const [index, file] of (files as File[]).entries()) {
          void uploadPhotoToStorage(file, 'files', index);
        }
      } finally {
        setIsPreparingPhotoPreview(false);
      }
    }
  };

  const handleFileChoose = async (e: React.ChangeEvent<HTMLInputElement>, source: PhotoUploadSource = 'files') => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files as any).filter((file: any) => file.type.startsWith('image/'));
      if (!files.length) {
        e.target.value = '';
        return;
      }
      setIsPreparingPhotoPreview(true);
      try {
        await waitForPreviewIndicatorPaint();
        for (const [index, file] of (files as File[]).entries()) {
          void uploadPhotoToStorage(file, source, index);
        }
      } finally {
        setIsPreparingPhotoPreview(false);
        if (source === 'camera') {
          cameraTargetSlotIdRef.current = null;
        }
        e.target.value = '';
      }
    }
  };

  const openCameraForSlot = (slotId?: PhotoSlotId) => {
    cameraTargetSlotIdRef.current = slotId || null;
    cameraInputRef.current?.click();
  };

  const replacePhotoUrl = (fromUrl: string, toUrl: string) => {
    setPhotoUrls(prev => prev.map(url => url === fromUrl ? toUrl : url));
    setRealPhotoUrls(prev => prev.map(url => url === fromUrl ? toUrl : url));
    setPhotoSlotAssignments(prev => {
      const next: Partial<Record<PhotoSlotId, string[]>> = {};
      activePhotoSlotConfig.forEach(slot => {
        const urls = (prev[slot.id] || []).map(url => url === fromUrl ? toUrl : url);
        if (urls.length) next[slot.id] = urls;
      });
      return next;
    });
  };

  const uploadCameraPhotoForSlot = async (file: File, slotId?: PhotoSlotId | null) => {
    if (!isPhotoWithinSizeLimit(file)) return;

    setIsPreparingPhotoPreview(true);
    await waitForPreviewIndicatorPaint();
    const localPreviewUrl = URL.createObjectURL(file);
    setPhotoUrls(prev => [...prev, localPreviewUrl]);
    setRealPhotoUrls(prev => prev.includes(localPreviewUrl) ? prev : [...prev, localPreviewUrl]);
    assignUploadedPhoto(localPreviewUrl, slotId);
    setIsPreparingPhotoPreview(false);

    beginUpload();
    setUploadError('');
    setUploadDiagnostic(null);

    void trackPhotoUpload((async () => {
      let uploadableImage: Blob | File = file;
      try {
        await waitForPreviewIndicatorPaint();
        const seoFileName = buildSeoPhotoFileName(uploadableImage, file, 0, ++uploadSequenceRef.current);
        const uploadedUrl = await uploadImageToImageKit(uploadableImage, {
          fileName: seoFileName,
          fileType: uploadableImage.type || file.type || 'image/jpeg'
        });
        replacePhotoUrl(localPreviewUrl, uploadedUrl);
        URL.revokeObjectURL(localPreviewUrl);
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
        console.error('ImageKit upload failed', diagnostic, error);
        photoErrorsRef.current.set(localPreviewUrl, diagnostic.errorMessage);
        setPhotoUrls(prev => prev.filter(url => url !== localPreviewUrl));
        setRealPhotoUrls(prev => prev.filter(url => url !== localPreviewUrl));
        setPhotoSlotAssignments(prev => {
          const next: Partial<Record<PhotoSlotId, string[]>> = {};
          activePhotoSlotConfig.forEach(slot => {
            const urls = (prev[slot.id] || []).filter(url => url !== localPreviewUrl);
            if (urls.length) next[slot.id] = urls;
          });
          return next;
        });
        setUploadDiagnostic(diagnostic);
      } finally {
        endUpload();
      }
    })());
  };

  const handleRemovePhoto = (index: number) => {
    const removedUrl = photoUrls[index];
    photoErrorsRef.current.delete(removedUrl);
    if (removedUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(removedUrl);
    }
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

  const setMainPhoto = (index: number) => {
    const targetUrl = photoUrls[index];
    if (!targetUrl || index === 0) return;

    setPhotoUrls(prev => [targetUrl, ...prev.filter((_, photoIndex) => photoIndex !== index)]);
    setRealPhotoUrls(prev => targetUrl && prev.includes(targetUrl)
      ? [targetUrl, ...prev.filter(url => url !== targetUrl)]
      : prev
    );
  };

  const applyTransferredPhotos = (payload: {
    photoUrls: string[];
    realPhotoUrls: string[];
    photoSlotAssignments: Record<string, string[]>;
  }) => {
    const incomingUrls = Array.from(new Set(payload.photoUrls));
    const incomingUrlSet = new Set(incomingUrls);

    setPhotoUrls(prev => Array.from(new Set([...prev, ...incomingUrls])));
    setRealPhotoUrls(prev => Array.from(new Set([
      ...prev,
      ...payload.realPhotoUrls.filter(url => incomingUrlSet.has(url))
    ])));
    setPhotoSlotAssignments(prev => {
      const next: Partial<Record<PhotoSlotId, string[]>> = {};
      activePhotoSlotConfig.forEach(slot => {
        const currentUrls = (prev[slot.id] || []).filter(url => !incomingUrlSet.has(url));
        const transferredUrls = (payload.photoSlotAssignments[slot.id] || [])
          .filter(url => incomingUrlSet.has(url));
        const combined = [...currentUrls, ...transferredUrls].slice(-slot.maxCount);
        if (combined.length) next[slot.id] = combined;
      });
      return next;
    });
    uploadSequenceRef.current += incomingUrls.length;
  };

  return {
    photoUrls,
    realPhotoUrls,
    photoSlotAssignments,
    activePhotoSlotConfig,
    requiredPhotoSlots,
    optionalPhotoSlots,
    isScooterPhotoFlow,
    isServicePhotoFlow,
    draggedPhotoSlotId,
    setDraggedPhotoSlotId,
    getAssignedPhotoUrls,
    getRemainingPhotoCount,
    assignPhotoToSlot,
    getPhotoSlot,
    requiredPhotoAssignedCount,
    requiredPhotoTotalCount,
    isUploading,
    isPreparingPhotoPreview,
    uploadError,
    uploadDiagnostic,
    waitForPhotoUploads,
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
    applyTransferredPhotos,
    handleRemovePhoto,
    setMainPhoto
  };
};
