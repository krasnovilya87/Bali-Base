import React from 'react';
import Polzunok from '../../../Polzunok';
import { useI18n } from '../../../../i18nContext';

type FeatureSectionProps = Record<string, any>;

const FeatureSizeRooms: React.FC<FeatureSectionProps> = (props) => {
  const {
    subCategory,
    area,
    setArea,
    roomsTotal,
    setRoomsTotal
  } = props;
  const { tr } = useI18n();
  const roomsLabel = roomsTotal >= 9
    ? tr('wizard.features.rooms.9plus')
    : roomsTotal === 1
      ? tr('wizard.features.rooms.one')
      : tr('wizard.features.rooms.short', { count: roomsTotal });

  return (
    <>
      {subCategory === 'private_room' ? null : subCategory === 'private_suite' ? (
        <div className="pl p-5 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold font-sans text-[#1E293B] tracking-wider block font-bold">📐 {tr('wizard.features.area')}</span>
            <span className="text-xs font-bold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-lg font-sans">
              {tr('wizard.features.areaValue', { count: area })}
            </span>
          </div>

          <div className="pt-2 relative">
            <Polzunok
              min={5}
              max={55}
              step={5}
              value={area}
              onChange={setArea}
            />
            <div className="grid grid-cols-3 text-[10px] text-gray-400 font-sans font-bold mt-1.5 px-0.5">
              <span className="text-left">{tr('wizard.features.areaValue', { count: 5 })}</span>
              <span className="text-center">{tr('wizard.features.areaValue', { count: 30 })}</span>
              <span className="text-right">{tr('wizard.features.areaValuePlus', { count: 55 })}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="pl p-5 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold font-sans text-[#1E293B] tracking-wider block font-bold">🏢 {tr('wizard.features.roomsTotal')}</span>
            <span className="text-xs font-bold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-lg font-sans">
              {roomsLabel}
            </span>
          </div>

          <div className="pt-2 relative">
            <Polzunok
              min={1}
              max={9}
              step={1}
              value={roomsTotal}
              onChange={setRoomsTotal}
            />
            <div className="grid grid-cols-3 text-[10px] text-gray-400 font-sans font-bold mt-1.5 px-0.5">
              <span className="text-left">{tr('wizard.features.rooms.one')}</span>
              <span className="text-center">{tr('wizard.features.rooms.count', { count: 5 })}</span>
              <span className="text-right">9+</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeatureSizeRooms;
