export const ROOM_TYPE_LABELS = {
  standard: 'Stundart room',
  deluxe: 'Delux room',
  super_deluxe: 'Superior room',
  family: 'Family room'
} as const;

export const stripRoomTypeFromTitle = (value: string) =>
  value.replace(/\s+·\s+(Stundart room|Delux room|Superior room|Family room)$/i, '').trim();

export const PHOTO_SLOT_CONFIG = [
  { id: 'cover', label: 'Главное фото', shortLabel: 'Главное', index: 0, required: true, maxCount: 1 },
  { id: 'bedroom', label: 'Спальня', shortLabel: 'Спальня', index: 1, required: true, maxCount: 2 },
  { id: 'bathroom', label: 'Санузел', shortLabel: 'Санузел', index: 2, required: true, maxCount: 2 },
  { id: 'kitchen', label: 'Кухня', shortLabel: 'Кухня', index: 3, required: false, maxCount: 2 },
  { id: 'territory', label: 'Территория', shortLabel: 'Территория', index: 4, required: false, maxCount: 2 },
  { id: 'pool', label: 'Бассейн', shortLabel: 'Бассейн', index: 5, required: false, maxCount: 2 },
  { id: 'view', label: 'Вид', shortLabel: 'Вид', index: 6, required: false, maxCount: 2 },
  { id: 'route', label: 'Путь от парковки до номера', shortLabel: 'Путь от парковки', index: 7, required: true, maxCount: 2 }
] as const;

export type PhotoSlotId = typeof PHOTO_SLOT_CONFIG[number]['id'];
export type PhotoSlotConfig = typeof PHOTO_SLOT_CONFIG[number];

export const REQUIRED_PHOTO_SLOTS = PHOTO_SLOT_CONFIG.filter(slot => slot.required);
export const OPTIONAL_PHOTO_SLOTS = PHOTO_SLOT_CONFIG.filter(slot => !slot.required);

export const formatPriceWithSpaces = (val: number | undefined | null) => {
  if (val === undefined || val === null || val === 0) return '';
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
