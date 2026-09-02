import scooterDashboardExample from '../../assets/wizard/scooter-dashboard-example.png';
import scooterFrontLeftExample from '../../assets/wizard/scooter-front-left-example.png';
import scooterFrontRightExample from '../../assets/wizard/scooter-front-right-example.png';
import scooterRearLeftExample from '../../assets/wizard/scooter-rear-left-example.png';
import scooterRearRightExample from '../../assets/wizard/scooter-rear-right-example.png';

export const ROOM_TYPE_LABELS = {
  standard: 'Standard room',
  deluxe: 'Deluxe room',
  super_deluxe: 'Superior room',
  family: 'Family room'
} as const;

export const UNIT_TYPE_OPTIONS = ['type_1', 'type_2', 'type_3', 'type_4'] as const;

export const stripRoomTypeFromTitle = (value: string) =>
  value.replace(/\s+(?:·|В·|Р’В·)\s+(Standard room|Stundart room|Deluxe room|Delux room|Superior room|Family room)$/i, '').trim();

export type PhotoSlotId = string;
export type PhotoSlotConfig = {
  id: PhotoSlotId;
  labelKey: string;
  shortLabelKey: string;
  index: number;
  required: boolean;
  maxCount: number;
  exampleImage?: string;
};

export const PHOTO_SLOT_CONFIG: PhotoSlotConfig[] = [
  { id: 'cover', labelKey: 'wizard.photoSlot.cover', shortLabelKey: 'wizard.photoSlot.coverShort', index: 0, required: true, maxCount: 1 },
  { id: 'bedroom', labelKey: 'wizard.photoSlot.bedroom', shortLabelKey: 'wizard.photoSlot.bedroomShort', index: 1, required: true, maxCount: 2 },
  { id: 'bathroom', labelKey: 'wizard.photoSlot.bathroom', shortLabelKey: 'wizard.photoSlot.bathroomShort', index: 2, required: true, maxCount: 2 },
  { id: 'kitchen', labelKey: 'wizard.photoSlot.kitchen', shortLabelKey: 'wizard.photoSlot.kitchenShort', index: 3, required: false, maxCount: 2 },
  { id: 'territory', labelKey: 'wizard.photoSlot.territory', shortLabelKey: 'wizard.photoSlot.territoryShort', index: 4, required: false, maxCount: 2 },
  { id: 'pool', labelKey: 'wizard.photoSlot.pool', shortLabelKey: 'wizard.photoSlot.poolShort', index: 5, required: false, maxCount: 2 },
  { id: 'view', labelKey: 'wizard.photoSlot.view', shortLabelKey: 'wizard.photoSlot.viewShort', index: 6, required: false, maxCount: 2 },
  { id: 'route', labelKey: 'wizard.photoSlot.route', shortLabelKey: 'wizard.photoSlot.routeShort', index: 7, required: true, maxCount: 2 }
] as const;

export const SCOOTER_PHOTO_SLOT_CONFIG: PhotoSlotConfig[] = [
  { id: 'scooter_front_left', labelKey: 'wizard.photoSlot.scooterFrontLeft', shortLabelKey: 'wizard.photoSlot.scooterFrontLeftShort', index: 0, required: true, maxCount: 1, exampleImage: scooterFrontLeftExample },
  { id: 'scooter_front_right', labelKey: 'wizard.photoSlot.scooterFrontRight', shortLabelKey: 'wizard.photoSlot.scooterFrontRightShort', index: 1, required: true, maxCount: 1, exampleImage: scooterFrontRightExample },
  { id: 'scooter_rear_left', labelKey: 'wizard.photoSlot.scooterRearLeft', shortLabelKey: 'wizard.photoSlot.scooterRearLeftShort', index: 2, required: true, maxCount: 1, exampleImage: scooterRearLeftExample },
  { id: 'scooter_rear_right', labelKey: 'wizard.photoSlot.scooterRearRight', shortLabelKey: 'wizard.photoSlot.scooterRearRightShort', index: 3, required: true, maxCount: 1, exampleImage: scooterRearRightExample },
  { id: 'scooter_dashboard', labelKey: 'wizard.photoSlot.scooterDashboard', shortLabelKey: 'wizard.photoSlot.scooterDashboardShort', index: 4, required: true, maxCount: 1, exampleImage: scooterDashboardExample }
] as const;

export const REQUIRED_PHOTO_SLOTS = PHOTO_SLOT_CONFIG.filter(slot => slot.required);
export const OPTIONAL_PHOTO_SLOTS = PHOTO_SLOT_CONFIG.filter(slot => !slot.required);

export const formatPriceWithSpaces = (val: number | undefined | null) => {
  if (val === undefined || val === null || val === 0) return '';
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
