import React from 'react';
import { useI18n } from '../../i18nContext';
import { getPhotoSlotOverlayBackgroundStyle, PhotoSlotConfig, PhotoSlotId } from './constants';

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
  const { tr } = useI18n();
  const isGuidedVehiclePanel = requiredSlots.length >= 6 && requiredSlots.every(slot => slot.cameraOverlayImage);
  const guidedVehicleGridClass = requiredSlots.length === 9
    ? 'grid-cols-9'
    : requiredSlots.length === 7
      ? 'grid-cols-7'
      : 'grid-cols-6';

  const renderBadge = (slot: PhotoSlotConfig) => (
    <div
      key={slot.id}
      draggable
      aria-label={tr(slot.labelKey)}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', slot.id);
        setDraggedPhotoSlotId(slot.id);
      }}
      onDragEnd={() => setDraggedPhotoSlotId(null)}
      className={`flex min-w-0 flex-1 cursor-grab items-center justify-center rounded-xl bg-[#FF7A50]/10 text-center text-[#1E293B] transition select-none active:cursor-grabbing hover:bg-[#FF7A50]/15 ${slot.cameraOverlayImage ? 'min-h-[72px] px-1.5 py-1' : 'min-h-[52px] px-2.5 py-2'}`}
    >
      {slot.cameraOverlayGrid ? (
        <div
          aria-hidden="true"
          className="h-16 aspect-[3/2] max-w-full bg-white"
          style={getPhotoSlotOverlayBackgroundStyle(slot)}
        />
      ) : slot.cameraOverlayImage ? (
        <img
          src={slot.cameraOverlayImage}
          alt=""
          aria-hidden="true"
          draggable={false}
          className={`h-16 w-full object-contain brightness-0 ${slot.cameraOverlayMirror ? '-scale-x-100' : ''}`}
        />
      ) : (
        <span className="line-clamp-3 text-[8.5px] font-black leading-[1.12] break-words">
          {tr(slot.labelKey)}
        </span>
      )}
    </div>
  );

  return (
    <div className="hidden sm:block space-y-2.5 sticky top-0 bg-[#F4F7F6] z-30 py-2">
      <p className="text-center text-[11px] font-black text-[#1E293B] tracking-wider">
        {tr('wizard.photos.assignCategories')}
      </p>

      <div className="rounded-3xl border border-[#E5E7EB] bg-white p-3">
        {isGuidedVehiclePanel ? (
          <div className={`grid w-full gap-2 ${guidedVehicleGridClass}`}>
            {requiredSlots.map(renderBadge)}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default PhotoCategoryPanel;
