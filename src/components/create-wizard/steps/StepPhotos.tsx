import React from 'react';
import { Check, ChevronDown, RefreshCw, Upload } from 'lucide-react';
import { useI18n } from '../../../i18nContext';
import PhotoCategoryPanel from '../PhotoCategoryPanel';
import Del from '../../Del';
import {
  OPTIONAL_PHOTO_SLOTS,
  PHOTO_SLOT_CONFIG,
  PhotoSlotConfig,
  PhotoSlotId,
  REQUIRED_PHOTO_SLOTS
} from '../constants';

type MaybePromise<T> = T | Promise<T>;

type StepPhotosProps = {
  dragActive: boolean;
  handleDrag: (event: React.DragEvent) => void;
  handleDrop: (event: React.DragEvent) => MaybePromise<void>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChoose: (event: React.ChangeEvent<HTMLInputElement>) => MaybePromise<void>;
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
  handleFileChoose,
  isUploading,
  uploadError,
  uploadDiagnostic,
  photoUrls,
  setDraggedPhotoSlotId,
  draggedPhotoSlotId,
  getAssignedPhotoUrls,
  getPhotoSlot,
  assignPhotoToSlot,
  handleRemovePhoto
}) => {
  const { tr } = useI18n();

  return (
    <div className="space-y-4 animate-fade-in">
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
      </div>

      <div className="space-y-2 pt-2">
        {photoUrls.length > 0 && (
          <>
            <PhotoCategoryPanel
              requiredSlots={REQUIRED_PHOTO_SLOTS}
              optionalSlots={OPTIONAL_PHOTO_SLOTS}
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
                    const matchingSlot = PHOTO_SLOT_CONFIG.find(item => item.id === droppedSlotId);
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
                </div>

                <details className="group sm:hidden relative">
                  <summary className="flex min-h-9 w-full list-none items-center justify-between gap-2 rounded-xl border border-[#E5E7EB] bg-white px-2.5 py-2 text-[11px] font-bold text-[#1E293B] marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className="truncate">
                      {slot ? `${slot.index + 1}. ${tr(slot.labelKey)}` : tr('wizard.extraPhoto')}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400 transition group-open:rotate-180" />
                  </summary>

                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 rounded-2xl border border-[#E5E7EB] bg-white p-1.5 shadow-xl">
                    {PHOTO_SLOT_CONFIG.map(item => {
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
