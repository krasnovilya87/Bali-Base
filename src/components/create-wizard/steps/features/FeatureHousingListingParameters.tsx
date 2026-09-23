import React from 'react';
import { ROOM_TYPE_LABELS, UNIT_TYPE_OPTIONS } from '../../constants';
import { useI18n } from '../../../../i18nContext';

type RoomType = keyof typeof ROOM_TYPE_LABELS;
type UnitType = typeof UNIT_TYPE_OPTIONS[number];

type Props = {
  subCategory: string;
  roomType: RoomType;
  setRoomType: React.Dispatch<React.SetStateAction<RoomType>>;
  unitType: UnitType | '';
  setUnitType: React.Dispatch<React.SetStateAction<UnitType | ''>>;
  roomCount: number | undefined;
  setRoomCount: React.Dispatch<React.SetStateAction<number | undefined>>;
};

const FeatureHousingListingParameters: React.FC<Props> = ({
  subCategory,
  roomType,
  setRoomType,
  unitType,
  setUnitType,
  roomCount,
  setRoomCount
}) => {
  const { tr } = useI18n();
  const showsUnitTypeAndCount = ['private_suite', 'entire_place'].includes(subCategory);
  const [roomCountInput, setRoomCountInput] = React.useState(roomCount === undefined ? '' : String(roomCount));

  React.useEffect(() => {
    setRoomCountInput(roomCount === undefined ? '' : String(roomCount));
  }, [roomCount]);

  React.useEffect(() => {
    if (subCategory === 'private_room' && roomCount === undefined) setRoomCount(1);
  }, [roomCount, setRoomCount, subCategory]);

  const updateCount = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setRoomCountInput(digitsOnly);
    setRoomCount(digitsOnly ? Math.max(1, Math.min(50, Number(digitsOnly))) : undefined);
  };

  const normalizeCount = () => {
    setRoomCountInput(roomCount === undefined ? '' : String(Math.max(1, Math.min(50, roomCount))));
  };

  return (
    <div className="space-y-4">
      {showsUnitTypeAndCount && (
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-[#1E293B]">{tr('wizard.unitTypeLabel')}</span>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
            {UNIT_TYPE_OPTIONS.map(value => {
              const selected = unitType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUnitType(current => current === value ? '' : value)}
                  aria-pressed={selected}
                  className={`pl pl-interactive min-w-[112px] rounded-xl border-0 px-3 py-3 text-xs font-bold transition active:scale-95 sm:min-w-0 ${selected ? 'selected text-[#1E293B]' : 'text-gray-600'}`}
                >
                  {tr(`wizard.unitType.${value}`)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {subCategory === 'private_room' && (
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-[#1E293B]">{tr('wizard.roomType')}</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.entries(ROOM_TYPE_LABELS) as Array<[RoomType, string]>).map(([value, label]) => {
              const selected = roomType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRoomType(value)}
                  aria-pressed={selected}
                  className={`pl pl-interactive rounded-xl border-0 px-3 py-3 text-xs font-bold transition active:scale-95 ${selected ? 'selected text-[#1E293B]' : 'text-gray-600'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="px-1 py-1 text-[10.5px] leading-relaxed text-gray-400">{tr('wizard.roomTypeNotice')}</p>
        </div>
      )}

      {(showsUnitTypeAndCount || subCategory === 'private_room') && (
        <label className="block space-y-1.5">
          <span className="block text-xs font-semibold text-[#1E293B]">
            {subCategory === 'private_room'
              ? tr('wizard.roomCountByType', { roomType: ROOM_TYPE_LABELS[roomType] })
              : unitType
                ? tr('wizard.unitCountByType', { unitType: tr(`wizard.unitType.${unitType}`) })
                : tr('wizard.unitCount')}
          </span>
          <input
            type="number"
            min={1}
            max={50}
            inputMode="numeric"
            value={roomCountInput}
            onChange={event => updateCount(event.target.value)}
            onBlur={normalizeCount}
            className="w-full rounded-2xl border-0 bg-white px-4 py-3 text-xs font-sans transition-colors duration-150 focus:outline-none focus:ring-0"
          />
        </label>
      )}
    </div>
  );
};

export default FeatureHousingListingParameters;
