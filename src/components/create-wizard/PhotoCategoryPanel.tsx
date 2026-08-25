import React from 'react';
import { Check } from 'lucide-react';
import { useI18n } from '../../i18nContext';
import { PhotoSlotConfig, PhotoSlotId } from './constants';

type PhotoCategoryPanelProps = {
  requiredSlots: PhotoSlotConfig[];
  optionalSlots: PhotoSlotConfig[];
  setDraggedPhotoSlotId: (slotId: PhotoSlotId | null) => void;
  getAssignedPhotoUrls: (slotId: PhotoSlotId) => string[];
};

const PhotoCategoryPanel: React.FC<PhotoCategoryPanelProps> = ({
  requiredSlots,
  optionalSlots,
  setDraggedPhotoSlotId,
  getAssignedPhotoUrls
}) => {
  const { tr } = useI18n();

  const renderBadge = (slot: PhotoSlotConfig) => {
    const isAssigned = getAssignedPhotoUrls(slot.id).length > 0;
    const isRequired = slot.required;

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
        className={`flex min-h-[52px] min-w-0 flex-1 cursor-grab items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-center transition select-none active:cursor-grabbing ${isRequired
          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
          : 'bg-[#FF7A50]/10 text-[#1E293B] hover:bg-[#FF7A50]/15'
          }`}
      >
        {isRequired && (
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-black leading-none ${isAssigned
            ? 'border-rose-600 bg-rose-600 text-white'
            : 'border-rose-500 bg-white text-transparent'
            }`}>
            {isAssigned && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
        )}
        <span className="line-clamp-3 text-[8.5px] font-black leading-[1.12] break-words">
          {tr(slot.labelKey)}
        </span>
      </div>
    );
  };

  return (
    <div className="hidden sm:block space-y-2.5 sticky top-0 bg-[#F4F7F6] z-[9999] py-2">
      <p className="text-center text-[11px] font-black text-[#1E293B] tracking-wider">
        {tr('wizard.photos.assignCategories')}
      </p>

      <div className="rounded-3xl border border-[#E5E7EB] bg-white p-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3">
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">
              {tr('wizard.photos.required')}
            </p>
            <div className="flex w-full items-center gap-2 pr-1">
              {requiredSlots.map(renderBadge)}
            </div>
          </div>

          <div className="w-px bg-[#CBD5E1]" />

          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">
              {tr('wizard.photos.optional')}
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
