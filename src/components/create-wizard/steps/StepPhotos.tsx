import React, { useEffect, useMemo, useState } from 'react';
import { Camera, Check, ChevronDown, ImagePlus, QrCode, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
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
  isUploading: boolean;
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
  isUploading,
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

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const query = window.matchMedia('(pointer: coarse), (hover: none), (max-width: 767px)');
    const update = () => setIsPhoneUploadDevice(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const currentPageUrl = typeof window === 'undefined' ? '' : window.location.href;
  const phoneUploadQrUrl = currentPageUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(currentPageUrl)}`
    : '';
  const requiredPhotoDone = requiredPhotoSlots.every(slot => getAssignedPhotoUrls(slot.id).length >= slot.maxCount);
  const nextRequiredSlot = useMemo(
    () => requiredPhotoSlots.find(slot => getAssignedPhotoUrls(slot.id).length < slot.maxCount),
    [requiredPhotoSlots, photoUrls, photoSlotAssignments]
  );
  const uploadModeText = requiredPhotoDone ? tr('wizard.photos.scooterExtraReady') : tr('wizard.photos.scooterNextShot', {
    shot: nextRequiredSlot ? tr(nextRequiredSlot.labelKey) : tr('wizard.extraPhoto')
  });

  const renderScooterRequiredGuide = () => (
    <div className="grid gap-3 sm:grid-cols-5">
      {requiredPhotoSlots.map(slot => {
        const isDone = getAssignedPhotoUrls(slot.id).length >= slot.maxCount;

        return (
          <div
            key={slot.id}
            className="space-y-2"
          >
            <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl border transition ${isDone
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-[#FF7A50]/25 bg-[#F4F7F6]'
              }`}>
              {slot.exampleImage && (
                <img
                  src={slot.exampleImage}
                  alt={tr(slot.labelKey)}
                  className={`h-full w-full object-cover ${isDone ? 'opacity-45' : 'opacity-90'}`}
                />
              )}
              <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-[11px] font-black text-white backdrop-blur-sm">
                {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : slot.index + 1}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-black leading-tight text-[#1E293B]">
                {tr(slot.labelKey)}
              </p>
              {isPhoneUploadDevice && (
                <button
                  type="button"
                  onClick={() => openCameraForSlot(slot.id)}
                  disabled={isUploading}
                  className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#FF7A50] px-3 py-2 text-[11px] font-black text-white transition active:scale-[0.99] disabled:opacity-60"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {tr('wizard.photos.takeBikePhoto')}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {isScooterPhotoFlow && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-[#FF7A50]/20 bg-[#FF7A50]/10 px-4 py-3 text-[11px] font-bold leading-relaxed text-[#1E293B]">
            {tr('wizard.photos.realBikeRule')}
          </div>
          {renderScooterRequiredGuide()}
        </div>
      )}

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
              <p className="text-center text-[11px] font-black text-[#1E293B]">
                {isUploading ? tr('wizard.photosUploading') : uploadModeText}
              </p>
              <button
                type="button"
                onClick={() => openCameraForSlot()}
                disabled={isUploading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF7A50] px-4 py-3 text-xs font-black text-white shadow-md transition active:scale-[0.99] disabled:opacity-60"
              >
                {isUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {tr('wizard.photos.takeBikePhoto')}
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isUploading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#CBD5E1] bg-[#F4F7F6] px-4 py-3 text-xs font-black text-[#1E293B] transition active:scale-[0.99] disabled:opacity-60"
              >
                <ImagePlus className="h-4 w-4" />
                {tr('wizard.photos.uploadFromGallery')}
              </button>
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

        {isUploading ? (
          <div className="animate-spin text-[#FF7A50]">
            <RefreshCw className="w-8 h-8" />
          </div>
        ) : (
          <Upload className="w-8 h-8 text-gray-300" />
        )}

        <p className="text-xs text-[#1E293B] font-bold">
          {isUploading ? tr('wizard.photosUploading') : tr('wizard.photosDrop')}
        </p>
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
