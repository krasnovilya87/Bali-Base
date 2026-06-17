import React from 'react';
import { PhotoSlotConfig, PhotoSlotId } from './constants';

type PhotoCategoryPanelProps = {
  requiredSlots: PhotoSlotConfig[];
  optionalSlots: PhotoSlotConfig[];
  setDraggedPhotoSlotId: (slotId: PhotoSlotId | null) => void;
};

const PhotoCategoryPanel: React.FC<PhotoCategoryPanelProps> = ({
  requiredSlots,
  optionalSlots,
  setDraggedPhotoSlotId
}) => {
  const renderBadge = (slot: PhotoSlotConfig) => {
    return (
      <div
        key={slot.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'copy';
          e.dataTransfer.setData('text/plain', slot.id);
          setDraggedPhotoSlotId(slot.id);
        }}
        onDragEnd={() => setDraggedPhotoSlotId(null)}
        className="flex h-9 min-w-0 flex-1 cursor-grab items-center justify-center rounded-xl bg-[#FF7A50]/10 px-2 text-center text-[#1E293B] transition select-none whitespace-nowrap active:cursor-grabbing hover:bg-[#FF7A50]/15"
      >
        <span className="truncate text-[10px] font-black leading-tight">{slot.label}</span>
      </div>
    );
  };

  return (
    <div className="hidden sm:block space-y-2.5">
      <p className="text-center text-[11px] font-black text-[#1E293B] tracking-wider">
        Назначьте категории для фотографий
      </p>

      <div className="rounded-3xl border border-[#E5E7EB] bg-white p-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3">
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">
              Обязательные фотографии
            </p>
            <div className="flex w-full items-center gap-2 pr-1">
              {requiredSlots.map(renderBadge)}
            </div>
          </div>

          <div className="w-px bg-[#CBD5E1]" />

          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">
              Необязательные фотографии
            </p>
            <div className="flex w-full items-center gap-2 pl-1">
              {optionalSlots.map(renderBadge)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCategoryPanel;
