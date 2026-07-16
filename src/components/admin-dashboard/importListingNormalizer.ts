import { Listing } from '../../types';
import { isListingFresh } from '../../utils/listingFreshness';
import { getDefaultDistrictNameSync, getDistrictNamesFromGeoJSONSync } from '../../utils/geo';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop&q=80';

const toText = (value: unknown): string => (typeof value === 'string' ? value : '');

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const hasAny = (text: string, words: string[]) => words.some(word => text.includes(word));

const slugify = (value: string, fallback: string): string => {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || fallback;
};

const inferDistrict = (text: string): string => {
  const lowered = text.toLowerCase();
  return getDistrictNamesFromGeoJSONSync().find(district => lowered.includes(district.toLowerCase())) || getDefaultDistrictNameSync();
};

const inferSubCategory = (text: string): string => {
  if (hasAny(text, ['room', 'private room', 'комнат', 'kamar'])) return 'private_room';
  if (hasAny(text, ['apartment', 'apartments', 'апартамент', 'studio', 'студия'])) return 'private_suite';
  return 'entire_place';
};

const inferPrice = (item: Record<string, any>, text: string): number => {
  const direct =
    item.pricePerDay ??
    item.price_per_day ??
    item.dailyPrice ??
    item.daily_price ??
    item.price ??
    item.Price;
  const directValue = toNumber(direct);
  if (directValue > 0) return directValue;

  const juta = text.match(/(\d+(?:[.,]\d+)?)\s*(?:juta|jt|million|млн)/i);
  if (juta) return Math.round(Number(juta[1].replace(',', '.')) * 1_000_000);

  const idr = text.match(/(?:rp|idr|₨)?\s*(\d[\d.,\s]{4,})\s*(?:idr|rp|ру?п|per day|\/day|сут|день)?/i);
  if (idr) {
    const parsed = Number(idr[1].replace(/[^\d]/g, ''));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const usd = text.match(/\$\s*(\d+(?:[.,]\d+)?)/);
  if (usd) return Math.round(Number(usd[1].replace(',', '.')) * 16_000);

  return 0;
};

const inferBedrooms = (item: Record<string, any>, text: string): number | undefined => {
  const direct = toNumber(item.bedroomsCount ?? item.bedrooms ?? item.bedroom);
  if (direct > 0) return direct;
  const match = text.match(/(\d+)\s*(?:br|bedroom|bedrooms|спальн|спален|kamar tidur)/i);
  return match ? Number(match[1]) : undefined;
};

const inferRoomsTotal = (item: Record<string, any>, bedrooms?: number): number | undefined => {
  const direct = toNumber(item.roomsTotal ?? item.rooms ?? item.rooms_count);
  if (direct > 0) return direct;
  return bedrooms ? bedrooms + 1 : undefined;
};

const inferPoolType = (text: string): Listing['poolType'] => {
  if (hasAny(text, ['no pool', 'без бассейна'])) return 'none';
  if (hasAny(text, ['infinity'])) return 'infinity';
  if (hasAny(text, ['private pool', 'приватный бассейн', 'частный бассейн'])) return 'private';
  if (hasAny(text, ['shared pool', 'общий бассейн'])) return 'shared';
  if (hasAny(text, ['pool', 'бассейн'])) return 'private';
  return 'none';
};

const inferInternetSpeed = (item: Record<string, any>, text: string): number => {
  const direct = toNumber(item.internetSpeed ?? item.wifiSpeed ?? item.internet_speed);
  if (direct > 0) return direct;
  const match = text.match(/(\d{2,4})\s*(?:mbps|mb\/s|мб|мбит)/i);
  return match ? Number(match[1]) : 0;
};

const inferInteriorStyle = (text: string): Listing['interiorStyle'] => {
  if (hasAny(text, ['luxury', 'premium', 'люкс', 'роскош'])) return 'luxury';
  if (hasAny(text, ['modern', 'minimalist', 'современ', 'минимал'])) return 'modern';
  if (hasAny(text, ['bali', 'boho', 'tropical', 'балий', 'бохо'])) return 'bali_style';
  return 'basic';
};

const inferAmenities = (text: string): string[] => {
  const amenities = new Set<string>();
  if (/\bac\b|air ?con|кондиционер/i.test(text)) amenities.add('AC');
  if (/smart ?tv|tv|телевизор/i.test(text)) amenities.add('smart_tv');
  if (/washing|washer|стираль/i.test(text)) amenities.add('washing_machine');
  if (/parking|парков/i.test(text)) amenities.add('parking');
  if (/workspace|desk|рабоч/i.test(text)) amenities.add('workspace');
  if (/spa|massage|спа|массаж/i.test(text)) amenities.add('spa');
  return Array.from(amenities);
};

const inferKitchenType = (text: string): Listing['kitchenType'] => {
  if (hasAny(text, ['no kitchen', 'без кухни'])) return 'none';
  if (hasAny(text, ['equipped kitchen', 'full kitchen', 'полностью оборудованная кухня'])) return 'equipped';
  if (hasAny(text, ['kitchen', 'кухн'])) return 'basic';
  return 'basic';
};

const inferViewType = (text: string): Listing['viewType'] | undefined => {
  if (hasAny(text, ['ocean', 'sea view', 'вид на океан', 'вид на море'])) return 'ocean';
  if (hasAny(text, ['jungle', 'джунг'])) return 'jungle';
  if (hasAny(text, ['rice field', 'rice fields', 'рисов'])) return 'rice_fields';
  if (hasAny(text, ['garden', 'сад'])) return 'garden';
  if (hasAny(text, ['pool view', 'вид на бассейн'])) return 'pool';
  return undefined;
};

const inferDistanceToSea = (item: Record<string, any>, text: string): number | undefined => {
  const direct = toNumber(item.distanceToSeaMinutes ?? item.distance_to_sea_minutes);
  if (direct > 0) return direct;
  const match = text.match(/(\d{1,3})\s*(?:min|мин).{0,20}(?:beach|sea|ocean|пляж|мор)/i);
  return match ? Number(match[1]) : undefined;
};

const normalizeImages = (item: Record<string, any>): string[] => {
  const raw =
    item.images ??
    item.imageUrls ??
    item.image_urls ??
    item.photos ??
    item.photoUrls ??
    item.image ??
    item.photo;

  if (Array.isArray(raw)) {
    const images = raw.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
    return images.length ? images : [DEFAULT_IMAGE];
  }

  if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
  return [DEFAULT_IMAGE];
};

const inferWhatsapp = (item: Record<string, any>, text: string): string => {
  const direct = toText(item.whatsappNumber || item.whatsapp || item.phone || item.phoneNumber || item.contactPhone);
  if (direct) return direct;
  const match = text.match(/(?:\+?62|0)\s?8[\d\s-]{7,15}/);
  return match ? match[0].replace(/\s+/g, '') : '';
};

export function normalizeHousingListingForImport(item: Record<string, any>, index: number): Listing {
  const title = toText(item.title || item.name || item.heading) || `Imported housing listing ${index + 1}`;
  const description = toText(item.description || item.desc || item.details || item.body);
  const joinedText = `${title} ${description} ${toText(item.address)} ${toText(item.location)} ${toText(item.district)}`;
  const searchText = joinedText.toLowerCase();
  const id = toText(item.id || item.documentId || item.slug) || `housing-${slugify(title, String(Date.now()))}-${index + 1}`;
  const bedroomsCount = inferBedrooms(item, searchText);
  const pricePerDay = inferPrice(item, joinedText);
  const district = toText(item.district) || inferDistrict(joinedText);
  const normalizedYearBuilt: Listing['yearBuilt'] =
    item.yearBuilt === 'other' || item.year_built === 'other'
      ? 'other'
      : toNumber(item.yearBuilt ?? item.year_built, new Date().getFullYear());
  const normalizedYearRenovated = toNumber(item.yearRenovated ?? item.year_renovated) || undefined;

  return {
    ...item,
    id,
    ownerId: toText(item.ownerId) || 'json-import',
    category: 'housing',
    subCategory: toText(item.subCategory || item.subcategory) || inferSubCategory(searchText),
    title,
    description,
    district,
    address: toText(item.address || item.location) || district,
    images: normalizeImages(item),
    rating: toNumber(item.rating, 0),
    reviewsCount: toNumber(item.reviewsCount ?? item.reviews_count, 0),
    reviews: Array.isArray(item.reviews) ? item.reviews : [],
    isApproved: typeof item.isApproved === 'boolean' ? item.isApproved : true,
    isNew: isListingFresh({ yearBuilt: normalizedYearBuilt, yearRenovated: normalizedYearRenovated }),
    status: item.status || 'active',
    pricePerDay,
    pricePerMonth: toNumber(item.pricePerMonth ?? item.monthlyPrice ?? item.price_per_month) || undefined,
    bookingComPrice: toNumber(item.bookingComPrice) || undefined,
    competitorPlatform: item.competitorPlatform,
    competitorUrl: toText(item.competitorUrl ?? item.competitor_url ?? item.bookingUrl ?? item.booking_url) || undefined,
    hasDropPrice: Boolean(item.hasDropPrice),
    dropPricePerDay: toNumber(item.dropPricePerDay) || undefined,
    dropPricePerMonth: toNumber(item.dropPricePerMonth) || undefined,
    dropPriceEndsAt: item.dropPriceEndsAt,
    roomsTotal: inferRoomsTotal(item, bedroomsCount),
    bedroomsCount,
    wallMaterial: item.wallMaterial || (hasAny(searchText, ['wood', 'bamboo', 'дерев', 'бамбук']) ? 'wood' : 'concrete'),
    territoryType: item.territoryType || (hasAny(searchText, ['resort']) ? 'resort' : hasAny(searchText, ['shared', 'общ']) ? 'shared' : 'private'),
    densityType: item.densityType,
    bedType: item.bedType,
    bedTypes: item.bedTypes,
    roomType: item.roomType,
    kitchenType: item.kitchenType || inferKitchenType(searchText),
    poolType: item.poolType || inferPoolType(searchText),
    internetSpeed: inferInternetSpeed(item, searchText),
    bathroomType: item.bathroomType || (hasAny(searchText, ['designer bathroom', 'дизайнерская ванная']) ? 'designer' : 'standard'),
    bathroomOptions: item.bathroomOptions,
    amenities: Array.isArray(item.amenities) ? item.amenities : inferAmenities(searchText),
    cleaningFrequency: item.cleaningFrequency,
    viewType: item.viewType || inferViewType(searchText),
    extraOptions: item.extraOptions,
    yearBuilt: normalizedYearBuilt,
    yearRenovated: normalizedYearRenovated,
    distanceToSeaMinutes: inferDistanceToSea(item, searchText),
    interiorStyle: item.interiorStyle || inferInteriorStyle(searchText),
    housingType: item.housingType,
    area: toNumber(item.area ?? item.size ?? item.squareMeters) || undefined,
    whatsappNumber: inferWhatsapp(item, joinedText),
    ownerName: toText(item.ownerName || item.hostName || item.sellerName || item.owner) || 'Bali Base Host',
    ownerAvatar: item.ownerAvatar,
    clicksCount: toNumber(item.clicksCount, 0),
    viewsCount: toNumber(item.viewsCount, 0),
    isPromoTop: item.isPromoTop,
    isPromoPremium: item.isPromoPremium,
    isPromoTurbo: item.isPromoTurbo,
    blockedDates: Array.isArray(item.blockedDates) ? item.blockedDates : [],
    pushedAt: item.pushedAt,
    reachMultiplier: item.reachMultiplier
  };
}
