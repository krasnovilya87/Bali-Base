import React from 'react';
import { RefreshCw, Upload } from 'lucide-react';
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
          <PhotoCategoryPanel
            requiredSlots={REQUIRED_PHOTO_SLOTS}
            optionalSlots={OPTIONAL_PHOTO_SLOTS}
            setDraggedPhotoSlotId={setDraggedPhotoSlotId}
            getAssignedPhotoUrls={getAssignedPhotoUrls}
          />
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

                <select
                  value={selectValue}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    assignPhotoToSlot(url, nextValue === 'extra' ? 'extra' : nextValue as PhotoSlotId);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="sm:hidden w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-2 text-[11px] font-bold text-[#1E293B] focus:outline-none focus:border-[#FF7A50]"
                >
                  {PHOTO_SLOT_CONFIG.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.index + 1}. {tr(item.labelKey)}
                    </option>
                  ))}
                  <option value="extra">{tr('wizard.extraPhoto')}</option>
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepPhotos;
