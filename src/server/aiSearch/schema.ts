export type AiSearchCategory = 'housing' | 'transport' | 'services' | 'investments' | 'ads' | 'afisha' | 'life' | 'useful' | 'unknown';

export type AiSearchIntent = {
  category: AiSearchCategory;
  subCategory: string | null;
  district: string | null;
  priceMin: number | null;
  priceMax: number | null;
  housingType: string[];
  roomsMin: number | null;
  areaMin: number | null;
  interiorStyle: string[];
  territoryType: string[];
  densityType: string[];
  bedType: string[];
  kitchenType: string[];
  poolType: string[];
  internetSpeedMin: number | null;
  bathroomOptions: string[];
  amenities: string[];
  cleaningFrequency: string[];
  viewType: string[];
  extraOptions: string[];
  distanceToSeaMax: number | null;
  searchText: string | null;
  confidence: number;
};

export type ValidatedAiSearchIntent = AiSearchIntent & {
  supported: boolean;
  shouldFallback: boolean;
  reason?: string;
};

export const EMPTY_AI_SEARCH_INTENT: AiSearchIntent = {
  category: 'unknown',
  subCategory: null,
  district: null,
  priceMin: null,
  priceMax: null,
  housingType: [],
  roomsMin: null,
  areaMin: null,
  interiorStyle: [],
  territoryType: [],
  densityType: [],
  bedType: [],
  kitchenType: [],
  poolType: [],
  internetSpeedMin: null,
  bathroomOptions: [],
  amenities: [],
  cleaningFrequency: [],
  viewType: [],
  extraOptions: [],
  distanceToSeaMax: null,
  searchText: null,
  confidence: 0
};

export const HOUSING_AI_SEARCH_SCHEMA = {
  category: ['housing', 'transport', 'services', 'investments', 'ads', 'afisha', 'life', 'useful', 'unknown'],
  subCategory: ['entire_place', 'private_suite', 'private_room'],
  districts: ['Canggu', 'Ubud', 'Seminyak', 'Kuta', 'Sanur', 'Uluwatu', 'Nusa Dua', 'Jimbaran', 'Amed', 'Kintamani', 'Lovina', 'Gili Trawangan', 'Gili Meno', 'Gili Air', 'Nusa Penida'],
  housingType: [
    'Privet Villa (must pool)',
    'House (no pool)',
    'Bungalow (standalone unit)',
    'Apartment Complex (privet unit)',
    'Guesthouse (privet room, shared property)',
    'Home stay (Host on-site)',
    'Hotel (privet room)',
    'Villa / House (privet room)',
    'Apartment (privet room)'
  ],
  interiorStyle: ['basic', 'bali_style', 'modern', 'luxury'],
  territoryType: ['private', 'shared', 'resort'],
  densityType: ['cozy', 'medium', 'large'],
  bedType: ['queen_size', 'king_size', 'single_1', 'single_2'],
  kitchenType: ['basic', 'equipped', 'private_basic', 'private_equipped', 'none'],
  poolType: ['shared', 'private', 'infinity'],
  bathroomOptions: ['hot_water', 'tropical_shower', 'double_sink', 'bathtub', 'garden_view', 'sauna_hammam'],
  amenities: ['AC', 'cold_AC', 'hair_dryer', 'washing_machine', 'smart_tv', 'workspace', 'yoga', 'room_fridge', 'water_cooler', 'parking'],
  cleaningFrequency: ['once_week', '2_times_week', '3_times_week', 'daily'],
  viewType: ['rice_fields', 'garden', 'pool', 'ocean', 'jungle'],
  extraOptions: ['pets_allowed', 'quiet_location', 'all_bills_included', 'airport_transfer_included', 'airport_transfer_paid', 'breakfast_included', 'breakfast_paid', 'nanny', 'chef']
} as const;

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value));
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^\d.]/g, ''));
    if (Number.isFinite(parsed)) return Math.max(0, Math.round(parsed));
  }
  return null;
};

const toConfidence = (value: unknown) => {
  const number = toFiniteNumber(value);
  if (number === null) return 0;
  return Math.max(0, Math.min(number > 1 ? number / 100 : number, 1));
};

const normalizeString = (value: unknown) => typeof value === 'string' ? value.trim() : '';

const pickEnum = <T extends readonly string[]>(value: unknown, allowed: T): T[number] | null => {
  const text = normalizeString(value);
  return allowed.includes(text as T[number]) ? text as T[number] : null;
};

const pickEnumList = <T extends readonly string[]>(value: unknown, allowed: T): T[number][] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .map(item => pickEnum(item, allowed))
    .filter((item): item is T[number] => Boolean(item))
    .filter(item => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
};

export const validateAiSearchIntent = (raw: unknown): ValidatedAiSearchIntent => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...EMPTY_AI_SEARCH_INTENT, supported: false, shouldFallback: true, reason: 'invalid_json' };
  }

  const source = raw as Record<string, unknown>;
  const category = pickEnum(source.category, HOUSING_AI_SEARCH_SCHEMA.category) || 'unknown';
  const supported = category === 'housing';
  const confidence = toConfidence(source.confidence);
  const searchText = normalizeString(source.searchText).slice(0, 120) || null;

  const intent: ValidatedAiSearchIntent = {
    category,
    supported,
    shouldFallback: !supported || confidence < 0.45,
    subCategory: supported ? pickEnum(source.subCategory, HOUSING_AI_SEARCH_SCHEMA.subCategory) : null,
    district: supported ? pickEnum(source.district, HOUSING_AI_SEARCH_SCHEMA.districts) : null,
    priceMin: supported ? toFiniteNumber(source.priceMin) : null,
    priceMax: supported ? toFiniteNumber(source.priceMax) : null,
    housingType: supported ? pickEnumList(source.housingType, HOUSING_AI_SEARCH_SCHEMA.housingType) : [],
    roomsMin: supported ? toFiniteNumber(source.roomsMin) : null,
    areaMin: supported ? toFiniteNumber(source.areaMin) : null,
    interiorStyle: supported ? pickEnumList(source.interiorStyle, HOUSING_AI_SEARCH_SCHEMA.interiorStyle) : [],
    territoryType: supported ? pickEnumList(source.territoryType, HOUSING_AI_SEARCH_SCHEMA.territoryType) : [],
    densityType: supported ? pickEnumList(source.densityType, HOUSING_AI_SEARCH_SCHEMA.densityType) : [],
    bedType: supported ? pickEnumList(source.bedType, HOUSING_AI_SEARCH_SCHEMA.bedType) : [],
    kitchenType: supported ? pickEnumList(source.kitchenType, HOUSING_AI_SEARCH_SCHEMA.kitchenType) : [],
    poolType: supported ? pickEnumList(source.poolType, HOUSING_AI_SEARCH_SCHEMA.poolType) : [],
    internetSpeedMin: supported ? toFiniteNumber(source.internetSpeedMin) : null,
    bathroomOptions: supported ? pickEnumList(source.bathroomOptions, HOUSING_AI_SEARCH_SCHEMA.bathroomOptions) : [],
    amenities: supported ? pickEnumList(source.amenities, HOUSING_AI_SEARCH_SCHEMA.amenities) : [],
    cleaningFrequency: supported ? pickEnumList(source.cleaningFrequency, HOUSING_AI_SEARCH_SCHEMA.cleaningFrequency) : [],
    viewType: supported ? pickEnumList(source.viewType, HOUSING_AI_SEARCH_SCHEMA.viewType) : [],
    extraOptions: supported ? pickEnumList(source.extraOptions, HOUSING_AI_SEARCH_SCHEMA.extraOptions) : [],
    distanceToSeaMax: supported ? toFiniteNumber(source.distanceToSeaMax) : null,
    searchText,
    confidence
  };

  const hasAnyFilter = Boolean(
    intent.subCategory ||
    intent.district ||
    intent.priceMin !== null ||
    intent.priceMax !== null ||
    intent.roomsMin !== null ||
    intent.areaMin !== null ||
    intent.internetSpeedMin !== null ||
    intent.distanceToSeaMax !== null ||
    intent.housingType.length ||
    intent.interiorStyle.length ||
    intent.territoryType.length ||
    intent.densityType.length ||
    intent.bedType.length ||
    intent.kitchenType.length ||
    intent.poolType.length ||
    intent.bathroomOptions.length ||
    intent.amenities.length ||
    intent.cleaningFrequency.length ||
    intent.viewType.length ||
    intent.extraOptions.length ||
    intent.searchText
  );

  return {
    ...intent,
    shouldFallback: !supported || confidence < 0.45 || !hasAnyFilter,
    reason: supported ? undefined : 'unsupported_category'
  };
};
