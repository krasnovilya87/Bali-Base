import { useState } from 'react';
import { Listing } from '../../../types';
import { ROOM_TYPE_LABELS } from '../constants';

type RoomType = keyof typeof ROOM_TYPE_LABELS;

type UseTitleStepParams = {
  initialListing?: Listing | null;
};

export const getSeoLengthVerdict = (len: number) => {
  if (len === 0) return { text: 'Поле не заполнено', color: 'text-rose-500' };
  if (len < 15) return { text: 'Слишком коротко для качественного поиска', color: 'text-amber-500' };
  if (len >= 15 && len < 45) return { text: 'Отличный размер заголовка', color: 'text-emerald-500' };
  return { text: 'Довольно длинно, может обрезаться', color: 'text-amber-600' };
};

export const useTitleStep = ({ initialListing }: UseTitleStepParams) => {
  const [title, setTitle] = useState<string>(initialListing?.title || '');
  const [description, setDescription] = useState<string>(initialListing?.description || '');
  const [roomType, setRoomType] = useState<RoomType>(initialListing?.roomType || 'standard');

  return {
    title,
    setTitle,
    description,
    setDescription,
    roomType,
    setRoomType,
    getSeoLengthVerdict
  };
};
