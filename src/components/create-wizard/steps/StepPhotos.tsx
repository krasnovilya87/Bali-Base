import React from 'react';
import { RefreshCw, Upload } from 'lucide-react';
import PhotoCategoryPanel from '../PhotoCategoryPanel';
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
  photoUrls: string[];
  setDraggedPhotoSlotId: React.Dispatch<React.SetStateAction<PhotoSlotId | null>>;
  draggedPhotoSlotId: PhotoSlotId | null;
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
  photoUrls,
  setDraggedPhotoSlotId,
  draggedPhotoSlotId,
  getPhotoSlot,
  assignPhotoToSlot,
  handleRemovePhoto
}) => (
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
        {isUploading ? 'Загрузка изображений на freeimage.host...' : 'Перетащите сюда фото или кликните для выбора'}
      </p>

      {uploadError && (
        <span className="text-[9.5px] font-semibold text-rose-500 italic mt-1 block">
          {uploadError} (применен локальный режим обзора)
        </span>
      )}
    </div>

    <div className="space-y-2 pt-2">
      {photoUrls.length > 0 && (
        <PhotoCategoryPanel
          requiredSlots={REQUIRED_PHOTO_SLOTS}
          optionalSlots={OPTIONAL_PHOTO_SLOTS}
          setDraggedPhotoSlotId={setDraggedPhotoSlotId}
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
                  const droppedSlotId = (event.dataTransfer.getData('text/plain') || draggedPhotoSlotId) as PhotoSlotId;
                  if (droppedSlotId) {
                    assignPhotoToSlot(url, droppedSlotId);
                  }
                  setDraggedPhotoSlotId(null);
                }}
              >
                <img src={url} alt="Uploaded file preview" className="w-full h-full object-cover !opacity-100" referrerPolicy="no-referrer" />

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemovePhoto(index);
                  }}
                  className="absolute top-1.5 right-1.5 z-10 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition cursor-pointer"
                  title="Удалить фото"
                >
                  <span className="text-xs font-bold leading-none">×</span>
                </button>

                <span className={`${slot ? 'bg-[#FF7A50] text-white' : 'bg-black/55 text-white'} absolute bottom-1.5 left-1.5 max-w-[calc(100%-12px)] text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider truncate`}>
                  {slot ? `${slot.index + 1}. ${slot.shortLabel}` : 'Доп фото'}
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
                    {item.index + 1}. {item.label}
                  </option>
                ))}
                <option value="extra">Доп фото</option>
              </select>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export default StepPhotos;
