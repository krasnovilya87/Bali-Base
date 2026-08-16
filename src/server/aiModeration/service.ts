import { readFileSync } from 'fs';
import { resolve } from 'path';
import { GoogleGenAI } from '@google/genai';
import type { AiModerationCheck, AiModerationResult, Listing } from '../../types';
import { AI_MODERATION_RULES } from '../../utils/aiModerationRules';

const MODEL = 'gemini-flash-lite-latest';
const MIN_DESCRIPTION_LENGTH = 20;

type GooglePlaceCategoryDetails = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  primaryType?: string;
  types?: string[];
};

type PlaceCategorySignal = {
  status: 'match' | 'mismatch' | 'unknown';
  reason?: string;
  placeName?: string;
  placeTypes?: string[];
};

const SUBCATEGORY_LABELS: Record<string, string> = {
  entire_place: 'Entire villa, house, or private place',
  private_suite: 'Private apartment or suite',
  private_room: 'Private room in a shared property or guesthouse'
};

const FRAUD_EVIDENCE_PATTERNS = [
  /\b(prepay|prepayment|advance payment|pay before viewing|deposit before viewing)\b/i,
  /\b(wire transfer|western union|crypto|bitcoin|usdt|bank transfer only)\b/i,
  /\b(guaranteed profit|guaranteed roi|risk free|100% guarantee)\b/i,
  /\b(urgent payment|pay today|only today|limited time payment)\b/i,
  /\b(no viewing|cannot view|owner abroad|keys by courier)\b/i,
  /\b(fake|scam|fraud)\b/i,
  /\b(предоплат|аванс|залог до просмотра|оплата до просмотра)\b/i,
  /\b(крипт|биткоин|usdt|western union|только перевод)\b/i,
  /\b(гарантированн(?:ая|ый|ое)? доход|без риска|100% гарантия)\b/i,
  /\b(срочно оплат|только сегодня|без просмотра|ключи курьером)\b/i
];

const PRICE_ONLY_FRAUD_PATTERNS = [
  /\bprice\b/i,
  /\bcheap\b/i,
  /\blow\b/i,
  /\bunusually low\b/i,
  /\bwarrants verification\b/i,
  /\bцена\b/i,
  /\bдешев/i,
  /\bнизк/i,
  /\bподозрительн/i
];

const HOUSING_ALLOWED_PLACE_TYPES = new Set([
  'lodging',
  'hotel',
  'hostel',
  'bed_and_breakfast',
  'guest_house',
  'motel',
  'resort_hotel',
  'apartment_building',
  'apartment_complex',
  'condominium_complex',
  'housing_complex',
  'real_estate_agency'
]);

const HOUSING_REJECTED_PLACE_TYPES = new Set([
  'store',
  'clothing_store',
  'shoe_store',
  'shopping_mall',
  'market',
  'supermarket',
  'convenience_store',
  'restaurant',
  'cafe',
  'bar',
  'night_club',
  'beauty_salon',
  'hair_care',
  'spa',
  'gym',
  'school',
  'bank',
  'atm',
  'office',
  'car_rental',
  'car_dealer',
  'motorcycle_dealer',
  'tourist_attraction',
  'travel_agency'
]);

const parseDotEnvValue = (value: string) => value.trim().replace(/^['"]|['"]$/g, '');

const getLocalGeminiKey = () => {
  for (const fileName of ['.env.local', '.env']) {
    try {
      const file = readFileSync(resolve(process.cwd(), fileName), 'utf8');
      const line = file
        .split(/\r?\n/)
        .find(item => /^(GEMINI_API_KEY|VITE_GEMINI_API_KEY)=/.test(item.trim()));

      if (line) {
        const [, rawValue = ''] = line.split(/=(.*)/s);
        const value = parseDotEnvValue(rawValue);
        if (value && value !== 'MY_GEMINI_API_KEY') return value;
      }
    } catch {
      // The file is optional.
    }
  }

  return '';
};

const getGeminiApiKey = () => {
  const key = process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    getLocalGeminiKey();

  return key && key !== 'MY_GEMINI_API_KEY' ? key : '';
};

const getGooglePlacesApiKey = () => {
  const key = process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    process.env.VITE_GOOGLE_MAPS_PLATFORM_KEY;

  return key && key !== 'YOUR_API_KEY' ? key : '';
};

const fetchGooglePlaceCategoryDetails = async (
  placeId: string,
  apiKey = getGooglePlacesApiKey()
): Promise<GooglePlaceCategoryDetails | null> => {
  if (!placeId || !apiKey) return null;

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,primaryType,types'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Places category lookup failed: ${response.status} ${body}`);
  }

  return response.json() as Promise<GooglePlaceCategoryDetails>;
};

const readPlaceCategorySignal = async (listing: Listing): Promise<PlaceCategorySignal> => {
  const placeId = listing.googlePlaceId || listing.placeId || '';
  if (!placeId) return { status: 'unknown' };

  try {
    const place = await fetchGooglePlaceCategoryDetails(placeId);
    const placeTypes = Array.from(new Set([
      place?.primaryType,
      ...(place?.types || [])
    ].filter((value): value is string => typeof value === 'string' && Boolean(value))));
    const placeName = place?.displayName?.text || place?.formattedAddress || placeId;

    if (listing.category === 'housing') {
      const hasAllowedType = placeTypes.some(type => HOUSING_ALLOWED_PLACE_TYPES.has(type));
      const hasRejectedType = placeTypes.some(type => HOUSING_REJECTED_PLACE_TYPES.has(type));

      if (hasRejectedType && !hasAllowedType) {
        return {
          status: 'mismatch',
          placeName,
          placeTypes,
          reason: `Google Maps identifies this place as ${placeTypes.join(', ')}, not a housing or lodging object.`
        };
      }

      if (hasAllowedType) {
        return {
          status: 'match',
          placeName,
          placeTypes
        };
      }
    }

    return {
      status: 'unknown',
      placeName,
      placeTypes
    };
  } catch (error) {
    console.warn('[AI moderation] Google place category lookup skipped:', error);
    return { status: 'unknown' };
  }
};

const getSubCategoryLabel = (listing: Listing) =>
  SUBCATEGORY_LABELS[listing.subCategory] || listing.subCategory || 'Unknown subcategory';

const toModerationPayload = (listing: Listing, placeCategorySignal?: PlaceCategorySignal) => {
  const subCategoryLabel = getSubCategoryLabel(listing);

  return {
    title: listing.title,
    description: listing.description,
    category: listing.category,
    categoryLabel: listing.category === 'housing' ? 'Housing' : listing.category,
    subCategory: listing.subCategory,
    subCategoryLabel,
    pricingContext: listing.subCategory === 'private_room'
      ? 'The listed price is for a private room, not for an entire villa or house.'
      : listing.subCategory === 'private_suite'
        ? 'The listed price is for a private apartment or suite, not necessarily an entire villa.'
        : 'The listed price is for the entire place.',
    district: listing.district,
    address: listing.address,
    hasCoordinates: Boolean(listing.locationCoords),
    imagesCount: listing.images?.length || 0,
    imageUrls: (listing.images || []).slice(0, 8),
    pricePerDay: listing.pricePerDay,
    pricePerMonth: listing.pricePerMonth,
    competitorPlatform: listing.competitorPlatform,
    competitorUrl: listing.competitorUrl,
    roomsTotal: listing.roomsTotal,
    bedroomsCount: listing.bedroomsCount,
    housingType: listing.housingType,
    area: listing.area,
    internetSpeed: listing.internetSpeed,
    kitchenType: listing.kitchenType,
    poolType: listing.poolType,
    amenities: listing.amenities,
    extraOptions: listing.extraOptions,
    ownerName: listing.ownerName,
    hasWhatsappNumber: Boolean(listing.whatsappNumber),
    googlePlaceCategory: placeCategorySignal
  };
};

const buildPrompt = (listing: Listing, placeCategorySignal?: PlaceCategorySignal) => [
  'You are an automatic listing moderation assistant for Bali Base, a marketplace for Bali housing and rentals.',
  'Evaluate the listing against every rule. Be conservative for subjective policy risks, but do not fail objective presence checks when the data proves they are present.',
  `Important: missing_description must pass when description has at least ${MIN_DESCRIPTION_LENGTH} non-space characters.`,
  'Important: missing_price must pass when pricePerDay or pricePerMonth is greater than 0.',
  'Important: wrong_category must fail when Google Maps place types clearly describe a different business category than the selected listing category.',
  'For housing listings, clothing stores, shops, cafes, restaurants, salons, offices, gyms, schools, banks, vehicle businesses, and tourist attractions are wrong categories unless Google also identifies lodging or housing types.',
  'Important: evaluate price against subCategoryLabel. A private_room price is NOT an entire villa price.',
  'Important: fraud_signs must fail ONLY when there is explicit scam evidence: requests for prepayment before viewing, off-platform payment pressure, crypto/wire-only payment, impossible guarantees, fake urgency, no viewing, suspicious contact substitution, or clearly deceptive claims.',
  'Do NOT fail fraud_signs only because a price seems low, high, cheap, unusual, or needs verification. Price alone is not fraud.',
  'Do NOT infer "entire villa" from title words when subCategory is private_room. Trust subCategoryLabel and pricingContext.',
  'Return ONLY valid JSON with this shape:',
  '{"summary":"short moderation summary","checks":[{"id":"rule_id","passed":true,"reason":"short reason","severity":"low|medium|high"}]}',
  'Rules:',
  JSON.stringify(AI_MODERATION_RULES.map(rule => ({
    id: rule.id,
    title: rule.promptTitle,
    description: rule.promptDescription
  }))),
  'Listing:',
  JSON.stringify(toModerationPayload(listing, placeCategorySignal))
].join('\n');

const parseModerationJson = (text: string) => {
  const trimmed = text.trim();
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    : trimmed;
  return JSON.parse(jsonText) as {
    summary?: unknown;
    checks?: Array<{
      id?: unknown;
      passed?: unknown;
      reason?: unknown;
      severity?: unknown;
    }>;
  };
};

const normalizeSeverity = (value: unknown): AiModerationCheck['severity'] => {
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  return 'medium';
};

const applyDeterministicChecks = (
  listing: Listing,
  checks: AiModerationCheck[],
  placeCategorySignal?: PlaceCategorySignal
) => {
  const hasDescription = (listing.description || '').trim().length >= MIN_DESCRIPTION_LENGTH;
  const hasPrice = (Number(listing.pricePerDay) || 0) > 0 || (Number(listing.pricePerMonth) || 0) > 0;
  const fraudEvidenceText = [
    listing.title,
    listing.description,
    listing.competitorUrl,
    listing.ownerName
  ].filter(Boolean).join(' ');
  const hasExplicitFraudEvidence = FRAUD_EVIDENCE_PATTERNS.some(pattern => pattern.test(fraudEvidenceText));

  return checks.map(check => {
    if (check.id === 'wrong_category' && placeCategorySignal?.status === 'mismatch') {
      return {
        ...check,
        passed: false,
        reason: placeCategorySignal.reason,
        severity: 'high' as const
      };
    }

    if (check.id === 'missing_description' && hasDescription) {
      return {
        ...check,
        passed: true,
        reason: undefined
      };
    }

    if (check.id === 'missing_price' && hasPrice) {
      return {
        ...check,
        passed: true,
        reason: undefined
      };
    }

    if (check.id === 'fraud_signs' && !check.passed && !hasExplicitFraudEvidence) {
      const reason = check.reason || '';
      const looksPriceOnly = PRICE_ONLY_FRAUD_PATTERNS.some(pattern => pattern.test(reason));
      if (looksPriceOnly || listing.subCategory === 'private_room') {
        return {
          ...check,
          passed: true,
          reason: undefined
        };
      }
    }

    return check;
  });
};

export const moderateListingWithGemini = async (listing: Listing): Promise<AiModerationResult> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const placeCategorySignal = await readPlaceCategorySignal(listing);
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: buildPrompt(listing, placeCategorySignal),
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  });
  const text = response.text?.trim() || '';

  if (!text) {
    throw new Error('Gemini returned an empty moderation result.');
  }

  const parsed = parseModerationJson(text);
  const returnedChecks = new Map((parsed.checks || []).map(check => [String(check.id || ''), check]));
  const aiChecks = AI_MODERATION_RULES.map(rule => {
    const check = returnedChecks.get(rule.id);
    return {
      id: rule.id,
      passed: check?.passed === true,
      reason: typeof check?.reason === 'string' ? check.reason.slice(0, 240) : undefined,
      severity: normalizeSeverity(check?.severity)
    };
  });
  const checks = applyDeterministicChecks(listing, aiChecks, placeCategorySignal);
  const hasFailedChecks = checks.some(check => !check.passed);

  return {
    status: hasFailedChecks ? 'manual_review' : 'passed',
    checkedAt: new Date().toISOString(),
    model: MODEL,
    summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 300) : undefined,
    checks
  };
};
