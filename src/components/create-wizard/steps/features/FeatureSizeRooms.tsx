import React from 'react';
import Polzunok from '../../../Polzunok';

type FeatureSectionProps = Record<string, any>;

const FeatureSizeRooms: React.FC<FeatureSectionProps> = (props) => {
  const {
    subCategory,
    area,
    setArea,
    roomsTotal,
    setRoomsTotal
  } = props;

  return (
    <>
      {subCategory === 'private_room' ? null : subCategory === 'private_suite' ? (
        <div className="pl p-5 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold font-sans text-[#1E293B] tracking-wider block font-bold">📐 Площадь</span>
            <span className="text-xs font-bold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-lg font-sans">
              {area} м²
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
              <span className="text-left">5 м²</span>
              <span className="text-center">30 м²</span>
              <span className="text-right">55 м²+</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="pl p-5 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold font-sans text-[#1E293B] tracking-wider block font-bold">🏢 Количество комнат</span>
            <span className="text-xs font-bold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-lg font-sans">
              {roomsTotal >= 9 ? '9+ комнат' : roomsTotal === 1 ? '1 комната' : `${roomsTotal} ком.`}
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
              <span className="text-left">1 комната</span>
              <span className="text-center">5 комнат</span>
              <span className="text-right">9+</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeatureSizeRooms;
