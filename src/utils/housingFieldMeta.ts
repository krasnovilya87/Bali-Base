import { Listing } from '../types';

export type ListingFieldSection = 'characteristics' | 'amenities';
export type ListingFieldValueType = 'string' | 'number' | 'boolean' | 'enum' | 'list';
export type ListingTranslator = (key: string, params?: Record<string, string | number>) => string;

export interface ListingFieldMeta {
  key: string;
  label: string;
  section: ListingFieldSection;
  group: string;
  valueType: ListingFieldValueType;
  icon: string;
  priority: number;
}

export interface ListingDisplayField {
  key: string;
  icon: string;
  label: string;
  value: string;
}

export interface ListingDisplayAmenity {
  key: string;
  name: string;
  config: {
    label: string;
    icon: string;
  };
}

const CORE_AMENITY_KEYS = [
  'cold_AC',
  'hair_dryer',
  'washing_machine',
  'smart_tv',
  'workspace',
  'yoga',
  'Без плесени и запаха',
  'Идеальная сантехника',
  'parking'
];

const PRIVATE_ROOM_AMENITY_KEYS = [
  'room_fridge',
  'water_cooler'
];

export const HOUSING_LISTING_FIELDS: ListingFieldMeta[] = [
  {
    key: 'housingType',
    label: 'Тип объекта',
    section: 'characteristics',
    group: 'Объект',
    valueType: 'enum',
    icon: 'home',
    priority: 10
  },
  {
    key: 'distanceToSeaMinutes',
    label: 'Удаление от моря',
    section: 'characteristics',
    group: 'Локация',
    valueType: 'number',
    icon: 'compass',
    priority: 20
  },
  {
    key: 'area',
    label: 'Площадь',
    section: 'characteristics',
    group: 'Объект',
    valueType: 'number',
    icon: 'ruler',
    priority: 30
  },
  {
    key: 'roomsTotal',
    label: 'Кол. комнат',
    section: 'characteristics',
    group: 'Объект',
    valueType: 'number',
    icon: 'building',
    priority: 40
  },
  {
    key: 'interiorStyle',
    label: 'Интерьер',
    section: 'characteristics',
    group: 'Стиль',
    valueType: 'enum',
    icon: 'palette',
    priority: 50
  },
  {
    key: 'densityType',
    label: 'Плотность комплекса',
    section: 'characteristics',
    group: 'Территория',
    valueType: 'enum',
    icon: 'leaf',
    priority: 60
  },
  {
    key: 'territoryType',
    label: 'Тип территории',
    section: 'characteristics',
    group: 'Территория',
    valueType: 'enum',
    icon: 'fence',
    priority: 70
  },
  {
    key: 'poolType',
    label: 'Бассейн',
    section: 'characteristics',
    group: 'Территория',
    valueType: 'enum',
    icon: 'pool',
    priority: 80
  },
  {
    key: 'viewType',
    label: 'Вид',
    section: 'characteristics',
    group: 'Локация',
    valueType: 'enum',
    icon: 'view',
    priority: 90
  },
  {
    key: 'cleaningFrequency',
    label: 'Уборка',
    section: 'characteristics',
    group: 'Сервис',
    valueType: 'enum',
    icon: 'cleaning',
    priority: 100
  },
  {
    key: 'internetSpeed',
    label: 'Интернет',
    section: 'amenities',
    group: 'Комфорт',
    valueType: 'number',
    icon: 'wifi',
    priority: 10
  },
  {
    key: 'bedTypes',
    label: 'Кровать',
    section: 'amenities',
    group: 'Планировка',
    valueType: 'list',
    icon: 'bed',
    priority: 20
  },
  {
    key: 'kitchenType',
    label: 'Кухня',
    section: 'amenities',
    group: 'Планировка',
    valueType: 'enum',
    icon: 'kitchen',
    priority: 30
  },
  {
    key: 'bathroomOptions',
    label: 'Ванная',
    section: 'amenities',
    group: 'Комфорт',
    valueType: 'list',
    icon: 'bath',
    priority: 40
  },
  {
    key: 'amenities',
    label: 'Удобства и комфорт',
    section: 'amenities',
    group: 'Комфорт',
    valueType: 'list',
    icon: 'comfort',
    priority: 50
  },
  {
    key: 'extraOptions',
    label: 'Преференции',
    section: 'amenities',
    group: 'Сервис',
    valueType: 'list',
    icon: 'sparkles',
    priority: 60
  }
];

const iconMap: Record<string, string> = {
  home: '🏘️',
  compass: '🧭',
  ruler: '📐',
  building: '🏢',
  palette: '🎨',
  leaf: '🍀',
  fence: '🏡',
  pool: '💦',
  view: '🌅',
  cleaning: '🧹',
  wifi: '📶',
  bed: '🛌',
  kitchen: '🍳',
  bath: '🚿',
  comfort: '🛋️',
  sparkles: '✨'
};

const labelMaps = {
  housingType: {
    'Privet Villa (must pool)': 'Villa',
    'House (no pool)': 'House',
    'Bungalow (standalone unit)': 'Bungalow',
    'Apartment Complex (privet unit)': 'Apartment',
    'Guesthouse (privet room, shared property)': 'Guesthouse',
    'Home stay (Host on-site)': 'Homestay',
    'Hotel (privet room)': 'Hotel'
  } as Record<string, string>,
  interiorStyle: {
    basic: 'Basic',
    bali_style: 'Bali style',
    modern: 'Modern',
    luxury: 'Luxury'
  } as Record<string, string>,
  densityType: {
    cozy: 'Cozy, up to 4 rooms',
    medium: 'Medium, 5-10 rooms',
    large: 'Large, 10+ rooms'
  } as Record<string, string>,
  territoryType: {
    private: 'Private',
    shared: 'Shared',
    resort: 'Resort'
  } as Record<string, string>,
  poolType: {
    none: 'No pool',
    shared: 'Shared pool',
    private: 'Private pool',
    infinity: 'Infinity pool'
  } as Record<string, string>,
  viewType: {
    rice_fields: 'Rice fields',
    garden: 'Garden',
    pool: 'Pool',
    ocean: 'Ocean',
    jungle: 'Jungle'
  } as Record<string, string>,
  cleaningFrequency: {
    none: 'Not included',
    '3_times_week': '3 times per week',
    once_week: 'Once per week',
    daily: 'Daily'
  } as Record<string, string>,
  bedTypes: {
    queen_size: 'Queen size',
    king_size: 'King size',
    single_1: '1 single bed',
    single_2: '2 single beds'
  } as Record<string, string>,
  kitchenType: {
    none: 'No kitchen',
    basic: 'Basic kitchen',
    equipped: 'Equipped kitchen',
    private_basic: 'Private basic kitchen',
    private_equipped: 'Private equipped kitchen'
  } as Record<string, string>,
  bathroomOptions: {
    hot_water: 'Hot water',
    tropical_shower: 'Tropical shower',
    double_sink: 'Double sink',
    bathtub: 'Bathtub',
    garden_view: 'Scenic window',
    sauna_hammam: 'Sauna / hammam'
  } as Record<string, string>,
  amenities: {
    AC: 'AC',
    cold_AC: 'Cold AC',
    hair_dryer: 'Hair dryer',
    washing_machine: 'Washing machine',
    smart_tv: 'Smart TV',
    workspace: 'Workspace',
    yoga: 'Yoga area',
    room_fridge: 'In-room fridge',
    water_cooler: 'Water cooler',
    parking: 'Car parking',
    'Без плесени и запаха': 'No mold or smell',
    'Идеальная сантехника': 'Perfect plumbing',
    'No mold or smell': 'No mold or smell',
    'Perfect plumbing': 'Perfect plumbing'
  } as Record<string, string>,
  extraOptions: {
    airport_transfer_included: 'Airport transfer included',
    airport_transfer_paid: 'Paid airport transfer',
    transfer_included: 'Transfer included',
    airport_transfer: 'Paid airport transfer',
    breakfast_included: 'Breakfast included',
    breakfast_paid: 'Paid breakfast',
    pets_allowed: 'Pets allowed',
    quiet_location: 'Quiet location',
    all_bills_included: 'Bills included',
    nanny: 'Nanny',
    chef: 'Private chef'
  } as Record<string, string>
};

const optionIconMaps: Record<string, Record<string, string>> = {
  bedTypes: {
    queen_size: '🛏️',
    king_size: '👑',
    single_1: '🧸',
    single_2: '🛌'
  },
  bathroomOptions: {
    hot_water: '🔥',
    tropical_shower: '🌴',
    double_sink: '🚰',
    bathtub: '🛁',
    garden_view: '🪴',
    sauna_hammam: '🧖'
  },
  amenities: {
    AC: '❄️',
    cold_AC: '🥶',
    hair_dryer: '💨',
    washing_machine: '👕',
    smart_tv: '📺',
    workspace: '💻',
    yoga: '🧘',
    room_fridge: '🧊',
    water_cooler: '💧',
    parking: '🚗',
    'Без плесени и запаха': '🧼',
    'Идеальная сантехника': '🚿',
    'No mold or smell': '🧼',
    'Perfect plumbing': '🚿'
  },
  extraOptions: {
    airport_transfer_included: '✈️',
    airport_transfer_paid: '🚕',
    transfer_included: '✈️',
    airport_transfer: '🚕',
    breakfast_included: '☕',
    breakfast_paid: '🥐',
    pets_allowed: '🐾',
    quiet_location: '🔕',
    all_bills_included: '⚡',
    nanny: '🧸',
    chef: '👨‍🍳'
  }
};

const formatToken = (value: string, map?: Record<string, string>, fieldKey?: string, tr?: ListingTranslator) => {
  const key = fieldKey ? `details.option.${fieldKey}.${value}` : '';
  const translated = key && tr ? tr(key) : '';
  return translated && translated !== key ? translated : map?.[value] || value.replace(/_/g, ' ');
};

const formatPoolBadgeValue = (listing: Listing, tr?: ListingTranslator): string | undefined => {
  if (!listing.poolType) return undefined;
  const badgeKey = `details.option.poolTypeBadge.${listing.poolType}`;
  const translated = tr ? tr(badgeKey) : '';
  return translated && translated !== badgeKey
    ? translated
    : formatToken(listing.poolType, labelMaps.poolType, 'poolType', tr);
};

const formatList = (values: string[] | undefined, map?: Record<string, string>, fieldKey?: string, tr?: ListingTranslator) =>
  (values || []).map(value => formatToken(value, map, fieldKey, tr)).filter(Boolean).join(', ');

const getListValues = (listing: Listing, key: string): string[] => {
  switch (key) {
    case 'bedTypes':
      return listing.bedTypes?.length ? listing.bedTypes : listing.bedType ? [listing.bedType] : [];
    case 'bathroomOptions':
      return listing.bathroomOptions || [];
    case 'amenities':
      return listing.amenities || [];
    case 'extraOptions':
      return listing.extraOptions || [];
    default:
      return [];
  }
};

const normalizeAmenityKey = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'no mold or smell') return 'Без плесени и запаха';
  if (normalized === 'perfect plumbing') return 'Идеальная сантехника';
  return value;
};

const getExpectedAmenityKeys = (listing: Listing) => [
  ...CORE_AMENITY_KEYS,
  ...(listing.subCategory === 'private_room' ? PRIVATE_ROOM_AMENITY_KEYS : [])
];

const getLabelMap = (key: string): Record<string, string> | undefined =>
  key in labelMaps ? labelMaps[key as keyof typeof labelMaps] : undefined;

const buildHousingListItems = (listing: Listing, field: ListingFieldMeta, tr?: ListingTranslator): ListingDisplayAmenity[] =>
  getListValues(listing, field.key).map((value, index) => ({
    key: `${field.key}-${value}-${index}`,
    name: value,
    config: {
      icon: optionIconMaps[field.key]?.[value] || iconMap[field.icon] || field.icon,
      label: field.key === 'bedTypes'
        ? `${tr ? tr('details.bedPrefix') : 'Bed'}\n${formatToken(value, getLabelMap(field.key), field.key, tr)}`
        : formatToken(value, getLabelMap(field.key), field.key, tr)
    }
  }));

const isApartmentListing = (listing: Listing) =>
  listing.housingType === 'Apartment Complex (privet unit)' || (listing.housingType || '').toLowerCase().includes('apartment');

const formatHousingFieldValue = (listing: Listing, field: ListingFieldMeta, tr?: ListingTranslator): string | undefined => {
  switch (field.key) {
    case 'housingType':
      return listing.housingType ? formatToken(listing.housingType, labelMaps.housingType, field.key, tr) : undefined;
    case 'distanceToSeaMinutes':
      return listing.distanceToSeaMinutes !== undefined
        ? (tr ? tr('details.minutes', { count: listing.distanceToSeaMinutes }) : `${listing.distanceToSeaMinutes} min`)
        : undefined;
    case 'area':
      return listing.area ? (tr ? tr('details.areaSqm', { count: listing.area }) : `${listing.area} m²`) : undefined;
    case 'roomsTotal':
      if (listing.subCategory === 'private_room' || isApartmentListing(listing)) return undefined;
      return listing.roomsTotal
        ? (listing.roomsTotal >= 9
          ? (tr ? tr('details.roomsPlus') : '9+ rooms')
          : (tr ? tr('details.roomsShort', { count: listing.roomsTotal }) : `${listing.roomsTotal} rooms`))
        : undefined;
    case 'interiorStyle':
      return listing.interiorStyle ? formatToken(listing.interiorStyle, labelMaps.interiorStyle, field.key, tr) : undefined;
    case 'densityType':
      return listing.densityType ? formatToken(listing.densityType, labelMaps.densityType, field.key, tr) : undefined;
    case 'territoryType':
      return listing.territoryType ? formatToken(listing.territoryType, labelMaps.territoryType, field.key, tr) : undefined;
    case 'poolType':
      return formatPoolBadgeValue(listing, tr);
    case 'viewType':
      return listing.viewType ? formatToken(listing.viewType, labelMaps.viewType, field.key, tr) : undefined;
    case 'cleaningFrequency':
      return listing.cleaningFrequency && listing.cleaningFrequency !== 'none'
        ? formatToken(listing.cleaningFrequency, labelMaps.cleaningFrequency, field.key, tr)
        : undefined;
    case 'internetSpeed':
      return listing.internetSpeed !== undefined
        ? (listing.internetSpeed
          ? (tr ? tr('details.mbps', { count: listing.internetSpeed }) : `${listing.internetSpeed} Mbps`)
          : (tr ? tr('details.noWifi') : 'No WiFi'))
        : undefined;
    case 'bedTypes':
      return formatList(listing.bedTypes?.length ? listing.bedTypes : listing.bedType ? [listing.bedType] : [], labelMaps.bedTypes, field.key, tr);
    case 'kitchenType':
      return listing.kitchenType ? formatToken(listing.kitchenType, labelMaps.kitchenType, field.key, tr) : undefined;
    case 'bathroomOptions':
      return formatList(listing.bathroomOptions, labelMaps.bathroomOptions, field.key, tr);
    case 'amenities':
      return formatList(listing.amenities, labelMaps.amenities, field.key, tr);
    case 'extraOptions':
      return formatList(listing.extraOptions, labelMaps.extraOptions, field.key, tr);
    default:
      return undefined;
  }
};

const housingFieldsBySection = (section: ListingFieldSection) =>
  HOUSING_LISTING_FIELDS
    .filter(field => field.section === section)
    .sort((a, b) => a.priority - b.priority);

export const buildHousingCharacteristics = (listing: Listing, tr?: ListingTranslator): ListingDisplayField[] =>
  housingFieldsBySection('characteristics')
    .map(field => ({
      key: field.key,
      icon: iconMap[field.icon] || field.icon,
      label: tr ? tr(`details.field.${field.key}`) : field.label,
      value: formatHousingFieldValue(listing, field, tr)
    }))
    .filter((field): field is ListingDisplayField => Boolean(field.value));

export const buildHousingAmenities = (listing: Listing, tr?: ListingTranslator): ListingDisplayAmenity[] =>
  housingFieldsBySection('amenities')
    .flatMap(field => {
      if (field.valueType === 'list') {
        return buildHousingListItems(listing, field, tr);
      }

      const value = formatHousingFieldValue(listing, field, tr);
      return value
        ? [{
            key: field.key,
            name: field.key,
            config: {
              icon: iconMap[field.icon] || field.icon,
              label: field.key === 'internetSpeed'
                ? `${tr ? tr('details.field.internetSpeed') : 'Internet'}\n${value}`
                : value
            }
          }]
        : [];
    });

export const buildMissingHousingAmenities = (listing: Listing, tr?: ListingTranslator): ListingDisplayAmenity[] => {
  const selectedAmenities = new Set((listing.amenities || []).map(normalizeAmenityKey));

  return getExpectedAmenityKeys(listing)
    .filter(value => !selectedAmenities.has(value))
    .map(value => ({
      key: `missing-amenity-${value}`,
      name: value,
      config: {
        icon: '',
        label: formatToken(value, labelMaps.amenities, 'amenities', tr)
      }
    }));
};
