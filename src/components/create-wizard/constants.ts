export const ROOM_TYPE_LABELS = {
  standard: 'Standard room',
  deluxe: 'Deluxe room',
  super_deluxe: 'Superior room',
  family: 'Family room'
} as const;

export const UNIT_TYPE_OPTIONS = ['type_1', 'type_2', 'type_3', 'type_4'] as const;

export const stripRoomTypeFromTitle = (value: string) =>
  value.replace(/\s+(?:·|В·|Р’В·)\s+(Standard room|Stundart room|Deluxe room|Delux room|Superior room|Family room)$/i, '').trim();

export const PHOTO_SLOT_CONFIG = [
  { id: 'cover', labelKey: 'wizard.photoSlot.cover', shortLabelKey: 'wizard.photoSlot.coverShort', index: 0, required: true, maxCount: 1 },
  { id: 'bedroom', labelKey: 'wizard.photoSlot.bedroom', shortLabelKey: 'wizard.photoSlot.bedroomShort', index: 1, required: true, maxCount: 2 },
  { id: 'bathroom', labelKey: 'wizard.photoSlot.bathroom', shortLabelKey: 'wizard.photoSlot.bathroomShort', index: 2, required: true, maxCount: 2 },
  { id: 'kitchen', labelKey: 'wizard.photoSlot.kitchen', shortLabelKey: 'wizard.photoSlot.kitchenShort', index: 3, required: false, maxCount: 2 },
  { id: 'territory', labelKey: 'wizard.photoSlot.territory', shortLabelKey: 'wizard.photoSlot.territoryShort', index: 4, required: false, maxCount: 2 },
  { id: 'pool', labelKey: 'wizard.photoSlot.pool', shortLabelKey: 'wizard.photoSlot.poolShort', index: 5, required: false, maxCount: 2 },
  { id: 'view', labelKey: 'wizard.photoSlot.view', shortLabelKey: 'wizard.photoSlot.viewShort', index: 6, required: false, maxCount: 2 },
  { id: 'route', labelKey: 'wizard.photoSlot.route', shortLabelKey: 'wizard.photoSlot.routeShort', index: 7, required: true, maxCount: 2 }
] as const;

export type PhotoSlotId = typeof PHOTO_SLOT_CONFIG[number]['id'];
export type PhotoSlotConfig = typeof PHOTO_SLOT_CONFIG[number];

export const REQUIRED_PHOTO_SLOTS = PHOTO_SLOT_CONFIG.filter(slot => slot.required);
export const OPTIONAL_PHOTO_SLOTS = PHOTO_SLOT_CONFIG.filter(slot => !slot.required);

export const formatPriceWithSpaces = (val: number | undefined | null) => {
  if (val === undefined || val === null || val === 0) return '';
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
