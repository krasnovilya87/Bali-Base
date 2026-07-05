import { Listing } from '../types';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

const featurePriority = [
  'housingType',
  'roomType',
  'view',
  'pool',
  'kitchen',
  'locationVibe',
  'parking',
  'workspace',
  'warnings'
] as const;

type SubtitleFeatureKey = typeof featurePriority[number];

const formatHousingType = (listing: Listing, tr: TranslateFn) => {
  const value = listing.housingType || '';
  const normalized = value.toLowerCase();
  const map: Record<string, string> = {
    'Privet Villa (must pool)': tr('listing.subtitle.housingType.villa'),
    'House (no pool)': tr('listing.subtitle.housingType.house'),
    'Bungalow (standalone unit)': tr('listing.subtitle.housingType.bungalow'),
    'Apartment Complex (privet unit)': tr('listing.subtitle.housingType.apartment'),
    'Guesthouse (privet room, shared property)': tr('listing.subtitle.housingType.guesthouse'),
    'Home stay (Host on-site)': tr('listing.subtitle.housingType.homestay'),
    'Hotel (privet room)': tr('listing.subtitle.housingType.hotel')
  };

  if (map[value]) return map[value];
  if (normalized.includes('guesthouse')) return tr('listing.subtitle.housingType.guesthouse');
  if (normalized.includes('home stay') || normalized.includes('homestay')) return tr('listing.subtitle.housingType.homestay');
  if (normalized.includes('hotel')) return tr('listing.subtitle.housingType.hotel');
  if (normalized.includes('apartment')) return tr('listing.subtitle.housingType.apartment');
  if (normalized.includes('bungalow')) return tr('listing.subtitle.housingType.bungalow');
  if (normalized.includes('house')) return tr('listing.subtitle.housingType.house');
  if (normalized.includes('villa')) return tr('listing.subtitle.housingType.villa');

  if (listing.subCategory === 'private_suite') return tr('listing.subtitle.housingType.apartment');
  if (listing.subCategory === 'private_room') return tr('listing.subtitle.housingType.guesthouse');
  return value || tr('listing.subtitle.housingType.place');
};

const formatRoomType = (listing: Listing, tr: TranslateFn) => {
  if (listing.subCategory !== 'private_room' || !listing.roomType) return undefined;
  const map: Record<NonNullable<Listing['roomType']>, string> = {
    standard: tr('listing.subtitle.roomType.standard'),
    deluxe: tr('listing.subtitle.roomType.deluxe'),
    super_deluxe: tr('listing.subtitle.roomType.super_deluxe'),
    family: tr('listing.subtitle.roomType.family')
  };
  return map[listing.roomType];
};

const formatView = (listing: Listing, tr: TranslateFn) => {
  const map: Partial<Record<NonNullable<Listing['viewType']>, string>> = {
    rice_fields: tr('listing.subtitle.view.rice_fields'),
    garden: tr('listing.subtitle.view.garden'),
    pool: tr('listing.subtitle.view.pool'),
    ocean: tr('listing.subtitle.view.ocean'),
    jungle: tr('listing.subtitle.view.jungle')
  };
  return listing.viewType ? map[listing.viewType] : undefined;
};

const formatPool = (listing: Listing, tr: TranslateFn) => {
  if (!listing.poolType || listing.poolType === 'none') return undefined;
  if (listing.poolType === 'infinity') return tr('listing.subtitle.pool.infinity');
  if (listing.poolType === 'private') return tr('listing.subtitle.pool.private');
  if (listing.poolType === 'shared') return tr('listing.subtitle.pool.shared');
  return tr('listing.subtitle.pool.default');
};

const formatKitchen = (listing: Listing, tr: TranslateFn) => {
  if (!listing.kitchenType || listing.kitchenType === 'none') return undefined;
  if (listing.kitchenType === 'private_basic' || listing.kitchenType === 'private_equipped') return tr('listing.subtitle.kitchen.private');
  if (listing.subCategory === 'private_room' || listing.subCategory === 'private_suite') return tr('listing.subtitle.kitchen.shared');
  if (listing.kitchenType === 'equipped') return tr('listing.subtitle.kitchen.equipped');
  return tr('listing.subtitle.kitchen.default');
};

const formatLocationVibe = (listing: Listing, tr: TranslateFn) => {
  if (listing.extraOptions?.includes('quiet_location')) return tr('listing.subtitle.quietArea');
  return undefined;
};

const formatWarning = (listing: Listing, tr: TranslateFn) => {
  if (listing.kitchenType === 'none') return tr('listing.subtitle.noKitchen');
  return undefined;
};

const getFeatureValue = (listing: Listing, feature: SubtitleFeatureKey, tr: TranslateFn) => {
  switch (feature) {
    case 'housingType':
      return formatHousingType(listing, tr);
    case 'roomType':
      return formatRoomType(listing, tr);
    case 'view':
      return formatView(listing, tr);
    case 'pool':
      return formatPool(listing, tr);
    case 'kitchen':
      return formatKitchen(listing, tr);
    case 'locationVibe':
      return formatLocationVibe(listing, tr);
    case 'parking':
      return listing.amenities?.includes('parking') ? tr('listing.subtitle.parking') : undefined;
    case 'workspace':
      return listing.amenities?.includes('workspace') ? tr('listing.subtitle.workspace') : undefined;
    case 'warnings':
      return formatWarning(listing, tr);
  }
};

export const buildListingSubtitle = (listing: Listing, maxParts = 4, tr: TranslateFn = (key) => key) => {
  if (listing.category !== 'housing') {
    return listing.description;
  }

  const parts = featurePriority
    .map(feature => getFeatureValue(listing, feature, tr))
    .filter((value): value is string => Boolean(value));
  const uniqueParts = Array.from(new Set(parts));

  return uniqueParts.slice(0, maxParts).join(' · ');
};

export const stripListingRoomTypeFromTitle = (title: string) => {
  const roomLabels = [
    'Standard room',
    'Stundart room',
    'Deluxe room',
    'Delux room',
    'Superior room',
    'Family room'
  ];
  const escapedLabels = roomLabels.map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const roomTypeSuffixRegex = new RegExp(`\\s*(?:·|В·)\\s*(?:${escapedLabels.join('|')})\\s*$`, 'i');
  return title.replace(roomTypeSuffixRegex, '').trim();
};
