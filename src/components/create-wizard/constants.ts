import scooterDashboardExample from '../../assets/images/other/wizard/scooter/scooter-dashboard-example.png';
import scooterFrontLeftExample from '../../assets/images/other/wizard/scooter/scooter-front-left-example.png';
import scooterFrontRightExample from '../../assets/images/other/wizard/scooter/scooter-front-right-example.png';
import scooterRearLeftExample from '../../assets/images/other/wizard/scooter/scooter-rear-left-example.png';
import scooterRearRightExample from '../../assets/images/other/wizard/scooter/scooter-rear-right-example.png';
import scooterDashboardCloseOutline from '../../assets/images/other/wizard/scooter/scooter-outline-dashboard-close.png';
import scooterDashboardWideOutline from '../../assets/images/other/wizard/scooter/scooter-outline-dashboard-wide.png';
import scooterFrontOutline from '../../assets/images/other/wizard/scooter/scooter-outline-front.png';
import scooterRearOutline from '../../assets/images/other/wizard/scooter/scooter-outline-rear.png';
import carFrontLeftOutline from '../../assets/images/other/wizard/car/car-front-left.svg';
import carFrontOutline from '../../assets/images/other/wizard/car/car-front.svg';
import carFrontRightOutline from '../../assets/images/other/wizard/car/car-front-right.svg';
import carRearLeftOutline from '../../assets/images/other/wizard/car/car-rear-left.svg';
import carRearOutline from '../../assets/images/other/wizard/car/car-rear.svg';
import carRearRightOutline from '../../assets/images/other/wizard/car/car-rear-right.svg';
import carDashboardOutline from '../../assets/images/other/wizard/car/car-dashboard.svg';
import carRearSeatsOutline from '../../assets/images/other/wizard/car/car-rear-seats.svg';
import carTrunkOutline from '../../assets/images/other/wizard/car/car-trunk.svg';
import motorcycleFrontLeftOutline from '../../assets/images/other/wizard/motorcycle/motorcycle-front-left.svg';
import motorcycleFrontRightOutline from '../../assets/images/other/wizard/motorcycle/motorcycle-front-right.svg';
import motorcycleRearLeftOutline from '../../assets/images/other/wizard/motorcycle/motorcycle-rear-left.svg';
import motorcycleRearRightOutline from '../../assets/images/other/wizard/motorcycle/motorcycle-rear-right.svg';
import motorcycleSeatTopOutline from '../../assets/images/other/wizard/motorcycle/motorcycle-seat-top.svg';
import motorcycleDashboardWideOutline from '../../assets/images/other/wizard/motorcycle/motorcycle-dashboard-wide.svg';
import motorcycleDashboardCloseOutline from '../../assets/images/other/wizard/motorcycle/motorcycle-dashboard-close.svg';

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
  cameraOverlayImage?: string;
  cameraOverlayMirror?: boolean;
  cameraOverlayGrid?: {
    columns: number;
    rows: number;
    column: number;
    row: number;
  };
};

export const getPhotoSlotOverlayBackgroundStyle = (slot: PhotoSlotConfig) => {
  const grid = slot.cameraOverlayGrid;
  if (!slot.cameraOverlayImage || !grid) return undefined;

  const x = grid.columns > 1 ? (grid.column / (grid.columns - 1)) * 100 : 0;
  const y = grid.rows > 1 ? (grid.row / (grid.rows - 1)) * 100 : 0;

  return {
    backgroundImage: `url(${slot.cameraOverlayImage})`,
    backgroundSize: `${grid.columns * 100}% ${grid.rows * 100}%`,
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat' as const
  };
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
  { id: 'scooter_front_right', labelKey: 'wizard.photoSlot.scooterFrontRight', shortLabelKey: 'wizard.photoSlot.scooterFrontRightShort', index: 0, required: true, maxCount: 1, exampleImage: scooterFrontRightExample, cameraOverlayImage: scooterFrontOutline, cameraOverlayMirror: true },
  { id: 'scooter_front_left', labelKey: 'wizard.photoSlot.scooterFrontLeft', shortLabelKey: 'wizard.photoSlot.scooterFrontLeftShort', index: 1, required: true, maxCount: 1, exampleImage: scooterFrontLeftExample, cameraOverlayImage: scooterFrontOutline },
  { id: 'scooter_rear_left', labelKey: 'wizard.photoSlot.scooterRearLeft', shortLabelKey: 'wizard.photoSlot.scooterRearLeftShort', index: 2, required: true, maxCount: 1, exampleImage: scooterRearLeftExample, cameraOverlayImage: scooterRearOutline },
  { id: 'scooter_rear_right', labelKey: 'wizard.photoSlot.scooterRearRight', shortLabelKey: 'wizard.photoSlot.scooterRearRightShort', index: 3, required: true, maxCount: 1, exampleImage: scooterRearRightExample, cameraOverlayImage: scooterRearOutline, cameraOverlayMirror: true },
  { id: 'scooter_dashboard_wide', labelKey: 'wizard.photoSlot.scooterDashboardWide', shortLabelKey: 'wizard.photoSlot.scooterDashboardWideShort', index: 4, required: true, maxCount: 1, exampleImage: scooterDashboardExample, cameraOverlayImage: scooterDashboardWideOutline },
  { id: 'scooter_dashboard_close', labelKey: 'wizard.photoSlot.scooterDashboardClose', shortLabelKey: 'wizard.photoSlot.scooterDashboardCloseShort', index: 5, required: true, maxCount: 1, exampleImage: scooterDashboardExample, cameraOverlayImage: scooterDashboardCloseOutline }
] as const;

export const CAR_PHOTO_SLOT_CONFIG: PhotoSlotConfig[] = [
  { id: 'car_front_left', labelKey: 'wizard.photoSlot.carFrontLeft', shortLabelKey: 'wizard.photoSlot.carFrontLeftShort', index: 0, required: true, maxCount: 1, cameraOverlayImage: carFrontLeftOutline },
  { id: 'car_front', labelKey: 'wizard.photoSlot.carFront', shortLabelKey: 'wizard.photoSlot.carFrontShort', index: 1, required: true, maxCount: 1, cameraOverlayImage: carFrontOutline },
  { id: 'car_front_right', labelKey: 'wizard.photoSlot.carFrontRight', shortLabelKey: 'wizard.photoSlot.carFrontRightShort', index: 2, required: true, maxCount: 1, cameraOverlayImage: carFrontRightOutline },
  { id: 'car_rear_left', labelKey: 'wizard.photoSlot.carRearLeft', shortLabelKey: 'wizard.photoSlot.carRearLeftShort', index: 3, required: true, maxCount: 1, cameraOverlayImage: carRearLeftOutline },
  { id: 'car_rear', labelKey: 'wizard.photoSlot.carRear', shortLabelKey: 'wizard.photoSlot.carRearShort', index: 4, required: true, maxCount: 1, cameraOverlayImage: carRearOutline },
  { id: 'car_rear_right', labelKey: 'wizard.photoSlot.carRearRight', shortLabelKey: 'wizard.photoSlot.carRearRightShort', index: 5, required: true, maxCount: 1, cameraOverlayImage: carRearRightOutline },
  { id: 'car_dashboard', labelKey: 'wizard.photoSlot.carDashboard', shortLabelKey: 'wizard.photoSlot.carDashboardShort', index: 6, required: true, maxCount: 1, cameraOverlayImage: carDashboardOutline },
  { id: 'car_rear_seats', labelKey: 'wizard.photoSlot.carRearSeats', shortLabelKey: 'wizard.photoSlot.carRearSeatsShort', index: 7, required: true, maxCount: 1, cameraOverlayImage: carRearSeatsOutline },
  { id: 'car_trunk', labelKey: 'wizard.photoSlot.carTrunk', shortLabelKey: 'wizard.photoSlot.carTrunkShort', index: 8, required: true, maxCount: 1, cameraOverlayImage: carTrunkOutline }
] as const;

export const MOTORCYCLE_PHOTO_SLOT_CONFIG: PhotoSlotConfig[] = [
  { id: 'motorcycle_front_right', labelKey: 'wizard.photoSlot.scooterFrontRight', shortLabelKey: 'wizard.photoSlot.scooterFrontRightShort', index: 0, required: true, maxCount: 1, cameraOverlayImage: motorcycleFrontRightOutline },
  { id: 'motorcycle_front_left', labelKey: 'wizard.photoSlot.scooterFrontLeft', shortLabelKey: 'wizard.photoSlot.scooterFrontLeftShort', index: 1, required: true, maxCount: 1, cameraOverlayImage: motorcycleFrontLeftOutline },
  { id: 'motorcycle_rear_left', labelKey: 'wizard.photoSlot.scooterRearLeft', shortLabelKey: 'wizard.photoSlot.scooterRearLeftShort', index: 2, required: true, maxCount: 1, cameraOverlayImage: motorcycleRearLeftOutline },
  { id: 'motorcycle_rear_right', labelKey: 'wizard.photoSlot.scooterRearRight', shortLabelKey: 'wizard.photoSlot.scooterRearRightShort', index: 3, required: true, maxCount: 1, cameraOverlayImage: motorcycleRearRightOutline },
  { id: 'motorcycle_seat_top', labelKey: 'wizard.photoSlot.motorcycleSeatTop', shortLabelKey: 'wizard.photoSlot.motorcycleSeatTopShort', index: 4, required: true, maxCount: 1, cameraOverlayImage: motorcycleSeatTopOutline },
  { id: 'motorcycle_dashboard_wide', labelKey: 'wizard.photoSlot.scooterDashboardWide', shortLabelKey: 'wizard.photoSlot.scooterDashboardWideShort', index: 5, required: true, maxCount: 1, cameraOverlayImage: motorcycleDashboardWideOutline },
  { id: 'motorcycle_dashboard_close', labelKey: 'wizard.photoSlot.scooterDashboardClose', shortLabelKey: 'wizard.photoSlot.scooterDashboardCloseShort', index: 6, required: true, maxCount: 1, cameraOverlayImage: motorcycleDashboardCloseOutline }
] as const;

export const REQUIRED_PHOTO_SLOTS = PHOTO_SLOT_CONFIG.filter(slot => slot.required);
export const OPTIONAL_PHOTO_SLOTS = PHOTO_SLOT_CONFIG.filter(slot => !slot.required);

export const formatPriceWithSpaces = (val: number | undefined | null) => {
  if (val === undefined || val === null || val === 0) return '';
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
