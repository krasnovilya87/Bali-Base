import { FilterState } from '../types';
import { findVehicleModelInQuery } from './vehicleModelNormalizer';
import { SCOOTER_COLOR_OPTIONS } from './scooterFilters';
import { normalizeLocationText, resolveDistrictSearch } from './locationAliases';

type LocalAiSearchContext = {
  currentL1: string;
  currentL2: string[];
  filters: FilterState;
  showFavoritesOnly: boolean;
};

export type LocalAiSearchParseResult = {
  matched: boolean;
  currentL1: string;
  currentL2: string[];
  filters: FilterState;
  districtSearch: string[];
  searchText: string;
  unsupportedIntent?: 'buy' | 'sell' | 'list_for_rent';
};

export const hasTransportRentIntent = (value: string) =>
  hasAny(normalizeText(value), [/(аренд|прокат|снять|возьм)/i, /\b(rent|rental|lease|hire)\b/i]);

const SCOOTER_COLOR_ALIASES: Record<string, string[]> = {
  black: ['black', 'черный', 'черная', 'черного', 'чёрный', 'чёрная', 'чёрного', 'hitam'],
  white: ['white', 'белый', 'белая', 'белого', 'putih'],
  red: ['red', 'красный', 'красная', 'красного', 'merah'],
  blue: ['blue', 'синий', 'синяя', 'синего', 'голубой', 'голубая', 'biru'],
  silver: ['silver', 'серебро', 'серебристый', 'серебристая', 'серебряный'],
  gray: ['gray', 'grey', 'серый', 'серая', 'серого', 'abu'],
  green: ['green', 'зеленый', 'зеленая', 'зелёный', 'зелёная', 'hijau'],
  yellow: ['yellow', 'желтый', 'желтая', 'жёлтый', 'жёлтая', 'kuning'],
  orange: ['orange', 'оранжевый', 'оранжевая'],
  brown: ['brown', 'коричневый', 'коричневая', 'coklat']
};

const normalizeText = (value: string) =>
  normalizeLocationText(value);

const removeNoise = (value: string) =>
  value
    .replace(/\b(мне|нужен|нужна|нужно|хочу|надо|найди|покажи|ищу|интересует|пожалуйста|please|find|show|need|want|looking for)\b/giu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hasAny = (value: string, patterns: RegExp[]) => patterns.some(pattern => pattern.test(value));

const parsePriceMax = (value: string) => {
  const millionMatch = value.match(/(?:до|up to|under|max|максимум)?\s*(\d+(?:[.,]\d+)?)\s*(?:млн|миллион|million|m|juta)(?=\s|$)/i);
  if (millionMatch) return Math.round(Number(millionMatch[1].replace(',', '.')) * 1_000_000);

  const thousandMatch = value.match(/(?:до|up to|under|max|максимум)?\s*(\d+(?:[.,]\d+)?)\s*(?:k|тыс|тысяч)(?=\s|$)/i);
  if (thousandMatch) return Math.round(Number(thousandMatch[1].replace(',', '.')) * 1_000);

  return null;
};

const parseDistricts = (value: string) => resolveDistrictSearch(value);

const parseUnsupportedIntent = (value: string): LocalAiSearchParseResult['unsupportedIntent'] => {
  if (hasAny(value, [/(купить|покупк)/i, /\b(buy|purchase)\b/i])) return 'buy';
  if (hasAny(value, [/(продать|продаю)/i, /\b(sell)\b/i])) return 'sell';
  if (hasAny(value, [/(сдать|сдаю|разместить)/i, /\b(list for rent|rent out)\b/i])) return 'list_for_rent';
  return undefined;
};

const parseVehicleColors = (value: string) => {
  const normalized = normalizeText(value);
  return SCOOTER_COLOR_OPTIONS.filter(color => {
    const aliases = SCOOTER_COLOR_ALIASES[color] ?? [color];
    return aliases.some(alias => normalized.includes(normalizeText(alias)));
  });
};

export const parseLocalAiSearchQuery = (
  query: string,
  context: LocalAiSearchContext
): LocalAiSearchParseResult => {
  const normalized = normalizeText(query);
  const cleaned = removeNoise(normalized);
  const unsupportedIntent = parseUnsupportedIntent(normalized);
  const nextFilters: FilterState = {
    ...context.filters,
    favoritesOnly: context.showFavoritesOnly
  };
  const districts = parseDistricts(normalized);
  const priceMax = parsePriceMax(normalized);
  if (priceMax !== null) nextFilters.priceMax = priceMax;

  const modelMatch = findVehicleModelInQuery(normalized, {
    category: 'transport',
    subCategories: ['scooters']
  });
  const isTransportQuery = Boolean(modelMatch.modelValue) ||
    hasAny(normalized, [/(байк|байки|скутер|мопед|мото)/i, /\b(bike|scooter|motorbike|motorcycle)\b/i]);

  if (isTransportQuery) {
    if (modelMatch.modelValue) nextFilters.vehicleModel = [modelMatch.modelValue];
    const vehicleColors = parseVehicleColors(normalized);
    if (vehicleColors.length > 0) nextFilters.vehicleColor = vehicleColors;
    if (hasAny(normalized, [/(как нов|новый|новая|хорош|идеальн|отличн)/i, /\b(like new|good condition|perfect|mint)\b/i])) {
      nextFilters.vehicleCondition = ['like_new'];
    } else if (hasAny(normalized, [/(царап|бу|б у)/i, /\b(scratch|second hand|used)\b/i])) {
      nextFilters.vehicleCondition = ['minor_scratches'];
    }
    if (unsupportedIntent) nextFilters.vehicleModel = ['__unsupported_transport_intent__'];

    return {
      matched: true,
      currentL1: 'transport',
      currentL2: ['scooters'],
      filters: nextFilters,
      districtSearch: districts,
      searchText: '',
      unsupportedIntent
    };
  }

  const isHousingQuery = hasAny(normalized, [/(вилл|дом|апартамент|комнат|жилье|жильё)/i, /\b(villa|house|apartment|room)\b/i]);
  if (isHousingQuery) {
    const nextL2: string[] = [];
    if (hasAny(normalized, [/(вилл)/i, /\b(villa)\b/i])) {
      nextL2.push('entire_place');
      nextFilters.housingType = ['Privet Villa (must pool)'];
    } else if (hasAny(normalized, [/(апартамент|студия)/i, /\b(apartment|studio)\b/i])) {
      nextL2.push('private_suite');
    } else if (hasAny(normalized, [/(комнат)/i, /\b(room)\b/i])) {
      nextL2.push('private_room');
    }

    if (hasAny(normalized, [/(бассейн)/i, /\b(pool)\b/i])) nextFilters.poolType = ['private'];
    if (hasAny(normalized, [/(современ)/i, /\b(modern)\b/i])) nextFilters.interiorStyle = ['modern'];
    if (hasAny(normalized, [/(люкс|роскош)/i, /\b(luxury)\b/i])) nextFilters.interiorStyle = ['luxury'];
    if (hasAny(normalized, [/(тих)/i, /\b(quiet)\b/i])) nextFilters.extraOptions = ['quiet_location'];

    return {
      matched: true,
      currentL1: 'housing',
      currentL2: nextL2.length ? nextL2 : ['entire_place', 'private_suite', 'private_room'],
      filters: nextFilters,
      districtSearch: districts,
      searchText: '',
      unsupportedIntent
    };
  }

  return {
    matched: false,
    currentL1: context.currentL1,
    currentL2: context.currentL2,
    filters: nextFilters,
    districtSearch: districts,
    searchText: cleaned,
    unsupportedIntent
  };
};
