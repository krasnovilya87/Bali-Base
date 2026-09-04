import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, ChevronDown, ImagePlus, QrCode, RefreshCw, ShieldCheck, Upload, X } from 'lucide-react';
import { useI18n } from '../../../i18nContext';
import PhotoCategoryPanel from '../PhotoCategoryPanel';
import Del from '../../Del';
import {
  PhotoSlotConfig,
  PhotoSlotId
} from '../constants';

type MaybePromise<T> = T | Promise<T>;

type StepPhotosProps = {
  dragActive: boolean;
  handleDrag: (event: React.DragEvent) => void;
  handleDrop: (event: React.DragEvent) => MaybePromise<void>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChoose: (event: React.ChangeEvent<HTMLInputElement>) => MaybePromise<void>;
  handleCameraChoose: (event: React.ChangeEvent<HTMLInputElement>) => MaybePromise<void>;
  handleGalleryChoose: (event: React.ChangeEvent<HTMLInputElement>) => MaybePromise<void>;
  openCameraForSlot: (slotId?: PhotoSlotId) => void;
  uploadCameraPhotoForSlot: (file: File, slotId?: PhotoSlotId | null) => MaybePromise<void>;
  isUploading: boolean;
  isPreparingPhotoPreview: boolean;
  uploadError: string;
  uploadDiagnostic: {
    fileName: string;
    fileType: string;
    fileSizeKb: number;
    uploadSizeKb?: number;
    compressed: boolean;
    steps: Array<{
      phase: string;
      ok: boolean;
      status?: number;
      statusText?: string;
      message?: string;
      responseType?: string;
    }>;
    errorMessage: string;
  } | null;
  photoUrls: string[];
  realPhotoUrls: string[];
  photoSlotAssignments: Partial<Record<PhotoSlotId, string[]>>;
  activePhotoSlotConfig: PhotoSlotConfig[];
  requiredPhotoSlots: PhotoSlotConfig[];
  optionalPhotoSlots: PhotoSlotConfig[];
  isScooterPhotoFlow: boolean;
  setDraggedPhotoSlotId: React.Dispatch<React.SetStateAction<PhotoSlotId | null>>;
  draggedPhotoSlotId: PhotoSlotId | null;
  getAssignedPhotoUrls: (slotId: PhotoSlotId) => string[];
  getPhotoSlot: (photoUrl: string) => PhotoSlotConfig | undefined;
  assignPhotoToSlot: (photoUrl: string, slotId: PhotoSlotId | 'extra') => void;
  handleRemovePhoto: (index: number) => void;
};

const StepPhotos: React.FC<StepPhotosProps> = ({
  dragActive,
  handleDrag,
  handleDrop,
  fileInputRef,
  cameraInputRef,
  galleryInputRef,
  handleFileChoose,
  handleCameraChoose,
  handleGalleryChoose,
  openCameraForSlot,
  uploadCameraPhotoForSlot,
  isUploading,
  isPreparingPhotoPreview,
  uploadError,
  uploadDiagnostic,
  photoUrls,
  realPhotoUrls,
  photoSlotAssignments,
  activePhotoSlotConfig,
  requiredPhotoSlots,
  optionalPhotoSlots,
  isScooterPhotoFlow,
  setDraggedPhotoSlotId,
  draggedPhotoSlotId,
  getAssignedPhotoUrls,
  getPhotoSlot,
  assignPhotoToSlot,
  handleRemovePhoto
}) => {
  const { tr } = useI18n();
  const [isPhoneUploadDevice, setIsPhoneUploadDevice] = useState(false);
  const [activeCameraSlotId, setActiveCameraSlotId] = useState<PhotoSlotId | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [captureFeedbackKey, setCaptureFeedbackKey] = useState(0);
  const [extraPhotoNumber, setExtraPhotoNumber] = useState(() => requiredPhotoSlots.length + 1);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const query = window.matchMedia('(pointer: coarse), (hover: none), (max-width: 767px)');
    const update = () => setIsPhoneUploadDevice(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const currentPageUrl = typeof window === 'undefined' ? '' : window.location.href;
  const phoneUploadTargetUrl = currentPageUrl
    ? (() => {
      const url = new URL(currentPageUrl);
      url.searchParams.set('create', '1');
      url.searchParams.set('category', 'transport');
      url.searchParams.set('subcategory', 'scooters');
      url.searchParams.set('step', 'photos');
      return url.toString();
    })()
    : '';
  const phoneUploadQrUrl = currentPageUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(phoneUploadTargetUrl)}`
    : '';
  const nextRequiredSlot = useMemo(
    () => requiredPhotoSlots.find(slot => getAssignedPhotoUrls(slot.id).length < slot.maxCount),
    [requiredPhotoSlots, photoUrls, photoSlotAssignments]
  );
  const activeCameraSlot = useMemo<PhotoSlotConfig | undefined>(
    () => {
      if (!activeCameraSlotId) return undefined;
      if (activeCameraSlotId === 'extra') {
        return {
          id: 'extra',
          labelKey: 'wizard.extraPhoto',
          shortLabelKey: 'wizard.extraPhoto',
          index: requiredPhotoSlots.length,
          required: false,
          maxCount: 999
        };
      }

      return activePhotoSlotConfig.find(slot => slot.id === activeCameraSlotId);
    },
    [activeCameraSlotId, activePhotoSlotConfig, requiredPhotoSlots.length]
  );
  const scooterBikeExampleSlots = requiredPhotoSlots.filter(slot =>
    ['scooter_front_right', 'scooter_front_left', 'scooter_rear_left', 'scooter_rear_right'].includes(slot.id)
  );
  const cameraFrameNumber = activeCameraSlot
    ? activeCameraSlot.id === 'extra'
      ? extraPhotoNumber
      : activeCameraSlot.index + 1
    : 0;

  useEffect(() => {
    if (activeCameraSlotId !== 'extra') return;

    setExtraPhotoNumber(Math.max(requiredPhotoSlots.length + 1, photoUrls.length + 1));
  }, [activeCameraSlotId, photoUrls.length, requiredPhotoSlots.length]);

  useEffect(() => {
    if (!activeCameraSlot) return undefined;

    let isMounted = true;
    setCameraError('');

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError(tr('wizard.photos.cameraUnavailable'));
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            aspectRatio: { ideal: 1 },
            width: { ideal: 1280 },
            height: { ideal: 1280 }
          }
        });

        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        if (isMounted) {
          setCameraError(tr('wizard.photos.cameraUnavailable'));
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      cameraStreamRef.current?.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    };
  }, [activeCameraSlot, tr]);

  const closeScooterCamera = () => {
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    cameraStreamRef.current = null;
    setActiveCameraSlotId(null);
    setCameraError('');
  };

  const openScooterCamera = (slotId?: PhotoSlotId) => {
    const slot = slotId
      ? requiredPhotoSlots.find(item => item.id === slotId)
      : nextRequiredSlot;

    if (!slot) {
      setActiveCameraSlotId('extra');
      return;
    }

    setActiveCameraSlotId(slot.id);
  };

  const captureScooterPhoto = async () => {
    if (!activeCameraSlot || !videoRef.current) return;

    const video = videoRef.current;
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    if (!sourceWidth || !sourceHeight) {
      setCameraError(tr('wizard.photos.cameraUnavailable'));
      return;
    }

    const side = Math.min(sourceWidth, sourceHeight);
    const sourceX = Math.round((sourceWidth - side) / 2);
    const sourceY = Math.round((sourceHeight - side) / 2);
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCameraError(tr('wizard.photos.cameraUnavailable'));
      return;
    }

    ctx.drawImage(video, sourceX, sourceY, side, side, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setCameraError(tr('wizard.photos.cameraUnavailable'));
        return;
      }

      const uploadSlotId = activeCameraSlot.id === 'extra' ? null : activeCameraSlot.id;
      const file = new File([blob], `${activeCameraSlot.id}.jpg`, { type: 'image/jpeg' });
      uploadCameraPhotoForSlot(file, uploadSlotId);
      setCaptureFeedbackKey(prev => prev + 1);

      const nextSlot = requiredPhotoSlots.find(slot =>
        slot.index > activeCameraSlot.index &&
        slot.id !== activeCameraSlot.id &&
        getAssignedPhotoUrls(slot.id).length < slot.maxCount
      ) || requiredPhotoSlots.find(slot =>
        slot.id !== activeCameraSlot.id &&
        getAssignedPhotoUrls(slot.id).length < slot.maxCount
      );

      if (nextSlot) {
        setActiveCameraSlotId(nextSlot.id);
      } else {
        setActiveCameraSlotId('extra');
        setExtraPhotoNumber(prev =>
          activeCameraSlot.id === 'extra'
            ? Math.max(prev + 1, requiredPhotoSlots.length + 1)
            : requiredPhotoSlots.length + 1
        );
      }
    }, 'image/jpeg', 0.9);
  };

  const renderScooterRequiredGuide = (allowSlotActions = false) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {scooterBikeExampleSlots.map(slot => {
        const isDone = getAssignedPhotoUrls(slot.id).length >= slot.maxCount;

        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => allowSlotActions && isPhoneUploadDevice && openScooterCamera(slot.id)}
            aria-label={tr(slot.labelKey)}
            className={`block text-left disabled:opacity-60 ${allowSlotActions && isPhoneUploadDevice ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl border transition ${isDone
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-[#FF7A50]/25 bg-white'
              }`}>
              {slot.exampleImage && (
                <img
                  src={slot.exampleImage}
                  alt={tr(slot.labelKey)}
                  className={`h-full w-full object-contain ${isDone ? 'opacity-45' : 'opacity-100'}`}
                />
              )}
              <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-[11px] font-black text-white backdrop-blur-sm">
                {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : slot.index + 1}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {isScooterPhotoFlow ? (
        <div className="rounded-3xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            onChange={handleCameraChoose}
            className="hidden"
          />
          <input
            type="file"
            multiple
            accept="image/*"
            ref={galleryInputRef}
            onChange={handleGalleryChoose}
            className="hidden"
          />

          {isPhoneUploadDevice ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => openScooterCamera()}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF7A50] px-4 py-3 text-xs font-black text-white shadow-md transition active:scale-[0.99] disabled:opacity-60"
              >
                <Camera className="h-4 w-4" />
                {tr('wizard.photos.takeBikePhoto')}
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#CBD5E1] bg-[#F4F7F6] px-4 py-3 text-xs font-black text-[#1E293B] transition active:scale-[0.99] disabled:opacity-60"
              >
                <ImagePlus className="h-4 w-4" />
                {tr('wizard.photos.uploadFromGallery')}
              </button>
              {isPreparingPhotoPreview && (
                <div className="flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-[#FF7A50]/10 px-3 py-2 text-xs font-black text-[#FF7A50]">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{tr('wizard.photosUploading')}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF7A50]/10 text-[#FF7A50]">
                <QrCode className="h-5 w-5" />
              </div>
              <p className="text-xs font-black text-[#1E293B]">{tr('wizard.photos.continueOnPhone')}</p>
              {phoneUploadQrUrl && (
                <img
                  src={phoneUploadQrUrl}
                  alt={tr('wizard.photos.continueOnPhone')}
                  className="h-36 w-36 rounded-2xl border border-[#E5E7EB] bg-white p-2"
                />
              )}
              <p className="max-w-sm text-[11px] font-semibold leading-relaxed text-[#5F6978]">
                {tr('wizard.photos.phoneOnly')}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition flex flex-col justify-center items-center gap-2 select-none min-h-[140px] ${dragActive
            ? 'border-[#FF7A50] bg-orange-50/50'
            : 'border-gray-200 bg-white hover:border-[#FF7A50]/60'
            }`}
        >
        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChoose}
          className="hidden"
        />

        {isPreparingPhotoPreview || isUploading ? (
          <div className="animate-spin text-[#FF7A50]">
            <RefreshCw className="w-8 h-8" />
          </div>
        ) : (
          <Upload className="w-8 h-8 text-gray-300" />
        )}

        <p className="text-xs text-[#1E293B] font-bold">
          {isPreparingPhotoPreview || isUploading ? tr('wizard.photosUploading') : tr('wizard.photosDrop')}
        </p>
        </div>
      )}

      {activeCameraSlot && (
        <div className="fixed inset-0 z-[620] flex items-center justify-center bg-[#020617]/95 px-4 py-6">
          <div className="w-full max-w-[520px] space-y-4">
            <div className="flex items-center justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{tr(activeCameraSlot.labelKey)}</p>
                <p className="text-[11px] font-semibold text-white/62">{tr('wizard.photos.alignBike')}</p>
              </div>
              <button
                type="button"
                onClick={closeScooterCamera}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-md transition active:scale-95"
                aria-label={tr('common.cancel')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-square overflow-hidden rounded-[28px] border border-white/16 bg-black shadow-2xl">
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                muted
                autoPlay
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_58%,rgba(2,6,23,0.34)_100%)]" />
              {activeCameraSlot.cameraOverlayImage && (
                <img
                  src={activeCameraSlot.cameraOverlayImage}
                  alt=""
                  aria-hidden="true"
                  className={`absolute inset-0 h-full w-full object-contain p-4 opacity-90 drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)] ${activeCameraSlot.cameraOverlayMirror ? '-scale-x-100' : ''}`}
                />
              )}
              {captureFeedbackKey > 0 && (
                <div
                  key={`scooter-camera-flash-${captureFeedbackKey}`}
                  className="pointer-events-none absolute inset-0 bg-white/80 animate-scooter-camera-flash"
                />
              )}
              <div className="pointer-events-none absolute inset-4 rounded-[22px] border border-white/25" />
              <div
                key={`scooter-camera-number-${captureFeedbackKey}-${cameraFrameNumber}`}
                className={`absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white backdrop-blur-sm ${captureFeedbackKey > 0 ? 'bg-[#FF7A50] shadow-[0_0_0_8px_rgba(255,122,80,0.22)] animate-scooter-capture-pop' : 'bg-black/55'}`}
              >
                {cameraFrameNumber}
              </div>
            </div>

            {cameraError && (
              <p className="rounded-2xl bg-rose-500/14 px-4 py-3 text-center text-[11px] font-bold text-rose-100">
                {cameraError}
              </p>
            )}

            <button
              type="button"
              onClick={captureScooterPhoto}
              disabled={Boolean(cameraError)}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF7A50] px-5 py-4 text-sm font-black text-white shadow-[0_18px_36px_rgba(255,122,80,0.24)] transition active:scale-[0.99] disabled:opacity-60"
            >
              <Camera className="h-5 w-5" />
              {tr('wizard.photos.capture')}
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="mt-1 max-w-full space-y-1">
          <span className="text-[9.5px] font-semibold text-rose-500 italic block">
            {uploadError} ({tr('wizard.photos.localPreviewMode')})
          </span>

          {uploadDiagnostic && (
            <div className="mx-auto max-w-full rounded-xl bg-rose-50 px-3 py-2 text-left text-[10px] font-semibold leading-relaxed text-rose-700">
              <div className="truncate">{tr('wizard.photos.diagnosticFile')}: {uploadDiagnostic.fileName}</div>
              <div>
                {tr('wizard.photos.diagnosticType')}: {uploadDiagnostic.fileType}; {tr('wizard.photos.diagnosticSize')}: {uploadDiagnostic.fileSizeKb} KB
                {uploadDiagnostic.uploadSizeKb !== undefined ? `; ${tr('wizard.photos.diagnosticUploadSize')}: ${uploadDiagnostic.uploadSizeKb} KB` : ''}
              </div>
              <div>
                {tr('wizard.photos.diagnosticCompressed')}: {uploadDiagnostic.compressed ? tr('common.yes') : tr('common.no')}
              </div>
              <div className="break-words">
                {tr('wizard.photos.diagnosticError')}: {uploadDiagnostic.errorMessage}
              </div>
              {uploadDiagnostic.steps.length > 0 && (
                <div className="break-words">
                  {tr('wizard.photos.diagnosticSteps')}: {uploadDiagnostic.steps.map(step =>
                    `${step.phase}=${step.ok ? 'ok' : 'failed'}${step.status ? `/${step.status}` : ''}${step.message ? ` (${step.message})` : ''}`
                  ).join(' -> ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 pt-2">
        {photoUrls.length > 0 && (
          <>
            <PhotoCategoryPanel
              requiredSlots={requiredPhotoSlots}
              optionalSlots={optionalPhotoSlots}
              setDraggedPhotoSlotId={setDraggedPhotoSlotId}
            />
            <p className="sm:hidden text-center text-[11px] font-black text-[#1E293B] tracking-wider">
              {tr('wizard.photos.assignCategories')}
            </p>
          </>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {photoUrls.map((url, index) => {
            const slot = getPhotoSlot(url);
            const selectValue = slot ? slot.id : 'extra';

            return (
              <div key={`${url}-${index}`} className="space-y-2">
                <div
                  className={`aspect-video relative rounded-2xl overflow-hidden border group bg-gray-50 opacity-100 transition ${draggedPhotoSlotId ? 'border-[#FF7A50] ring-2 ring-[#FF7A50]/20' : 'border-gray-150'} sm:cursor-copy`}
                  draggable={false}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const droppedSlotId = event.dataTransfer.getData('text/plain') || draggedPhotoSlotId;
                    const matchingSlot = activePhotoSlotConfig.find(item => item.id === droppedSlotId);
                    if (matchingSlot) {
                      assignPhotoToSlot(url, matchingSlot.id);
                    }
                    setDraggedPhotoSlotId(null);
                  }}
                >
                  <img src={url} alt="Uploaded file preview" className="w-full h-full object-cover !opacity-100" referrerPolicy="no-referrer" />

                  <Del
                    title={tr('wizard.photoDeleteTitle')}
                    message={tr('wizard.photoDeleteBody')}
                    confirmLabel={tr('wizard.photoDeleteConfirm')}
                    cancelLabel={tr('common.cancel')}
                    onConfirm={() => handleRemovePhoto(index)}
                    className="absolute top-1.5 right-1.5 z-10 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition cursor-pointer"
                    titleAttr={tr('wizard.photoDelete')}
                  >
                    <span className="text-xs font-bold leading-none">x</span>
                  </Del>

                  <span className={`${slot ? 'bg-[#FF7A50] text-white' : 'bg-black/55 text-white'} absolute bottom-1.5 left-1.5 max-w-[calc(100%-12px)] text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider truncate`}>
                    {slot ? `${slot.index + 1}. ${tr(slot.shortLabelKey)}` : tr('wizard.extraPhoto')}
                  </span>
                  {realPhotoUrls.includes(url) && (
                    <span className="absolute left-1.5 top-1.5 z-10 flex items-center gap-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white shadow">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      {tr('wizard.photos.realPhoto')}
                    </span>
                  )}
                </div>

                <details className="group sm:hidden relative">
                  <summary className="flex min-h-9 w-full list-none items-center justify-between gap-2 rounded-xl border border-[#E5E7EB] bg-white px-2.5 py-2 text-[11px] font-bold text-[#1E293B] marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className="truncate">
                      {slot ? `${slot.index + 1}. ${tr(slot.labelKey)}` : tr('wizard.extraPhoto')}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400 transition group-open:rotate-180" />
                  </summary>

                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 rounded-2xl border border-[#E5E7EB] bg-white p-1.5 shadow-xl">
                    {activePhotoSlotConfig.map(item => {
                      const isRequired = item.required;
                      const isAssigned = getAssignedPhotoUrls(item.id).length > 0;
                      const isSelected = selectValue === item.id;
                      const requiredTextClass = isAssigned ? 'text-[#1E293B]' : 'text-rose-600';

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={(event) => {
                            assignPhotoToSlot(url, item.id);
                            event.currentTarget.closest('details')?.removeAttribute('open');
                          }}
                          className={`flex min-h-9 w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[11px] font-black transition ${isSelected ? 'bg-[#FF7A50]/10' : 'hover:bg-gray-50'} ${isRequired ? requiredTextClass : 'text-[#1E293B]'}`}
                        >
                          {isRequired && (
                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${isAssigned
                              ? 'border-[#1E293B] bg-[#1E293B] text-white'
                              : 'border-rose-500 bg-white text-transparent'
                              }`}>
                              {isAssigned && <Check className="h-3 w-3" strokeWidth={3} />}
                            </span>
                          )}
                          <span className="min-w-0 flex-1 truncate">
                            {item.index + 1}. {tr(item.labelKey)}
                          </span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={(event) => {
                        assignPhotoToSlot(url, 'extra');
                        event.currentTarget.closest('details')?.removeAttribute('open');
                      }}
                      className={`flex min-h-9 w-full items-center rounded-xl px-2 py-1.5 text-left text-[11px] font-black text-[#1E293B] transition ${selectValue === 'extra' ? 'bg-[#FF7A50]/10' : 'hover:bg-gray-50'}`}
                    >
                      <span className="truncate">{tr('wizard.extraPhoto')}</span>
                    </button>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepPhotos;
