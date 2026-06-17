import React from 'react';
import { ROOM_TYPE_LABELS } from '../constants';

type RoomType = keyof typeof ROOM_TYPE_LABELS;

type StepTitleProps = {
  category: string;
  subCategory: string;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  getSeoLengthVerdict: (length: number) => { color: string };
  roomType: RoomType;
  setRoomType: React.Dispatch<React.SetStateAction<RoomType>>;
};

const StepTitle: React.FC<StepTitleProps> = ({
  category,
  subCategory,
  title,
  setTitle,
  description,
  setDescription,
  getSeoLengthVerdict,
  roomType,
  setRoomType
}) => (
  <div className="space-y-4 animate-fade-in">
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <label className="font-semibold block text-[#1E293B]">
          Наименование объекта (как на Google Maps)
        </label>
        <span className={`font-mono font-bold ${getSeoLengthVerdict(title.length).color}`}>
          {title.length} / 60
        </span>
      </div>
      <input
        type="text"
        placeholder="Например: Sunset Villa"
        value={title}
        onChange={event =>
          setTitle(event.target.value.replace(/(^|[\s-])(\p{L})/gu, (_, separator, letter) =>
            separator + letter.toLocaleUpperCase()
          ))
        }
        maxLength={60}
        className="w-full bg-white border-[0.5px] border-[#94A3B8]/40 focus:border-[#FF7A50] rounded-2xl px-4 py-3 text-xs focus:ring-0 focus:outline-none transition-colors duration-150 font-sans"
      />
    </div>

    {category === 'housing' && subCategory === 'private_room' && (
      <div className="space-y-2">
        <label className="font-semibold block text-xs text-[#1E293B]">Тип комнаты:</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.entries(ROOM_TYPE_LABELS) as Array<[RoomType, string]>).map(([value, label]) => {
            const isSelected = roomType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRoomType(value)}
                className={`pl pl-interactive px-3 py-3 rounded-xl border-[0.5px] text-xs font-bold transition active:scale-95 ${
                  isSelected
                    ? 'selected border-[#FF7A50] text-[#E05A30] ring-1 ring-[#FF7A50]/30'
                    : 'border-[#94A3B8]/40 text-gray-600 hover:border-[#FF7A50]/60'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-[10.5px] leading-relaxed text-gray-400 px-1 py-1">
          Для каждого типа комнаты создается отдельное объявление. Запрещено создавать одинаковые объявления.
        </p>
      </div>
    )}

    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <label className="font-semibold block text-[#1E293B]">Описание объекта:</label>
        <span className={`font-mono font-bold ${description.length > 240 ? 'text-rose-500' : 'text-gray-400'}`}>
          {description.length} / 250
        </span>
      </div>
      <textarea
        placeholder="Опишите главные фичи: близость к морю, оптоволоконный интернет, тишина или близость к инфраструктуре..."
        value={description}
        onChange={event => setDescription(event.target.value)}
        maxLength={250}
        rows={3}
        className="w-full bg-white border-[0.5px] border-[#94A3B8]/40 focus:border-[#FF7A50] rounded-2xl px-4 py-3 text-xs focus:ring-0 focus:outline-none transition-colors duration-150 font-sans"
      />
    </div>
  </div>
);

export default StepTitle;
