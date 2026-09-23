export type ClassifiedSizingKind = 'apparel' | 'footwear';
export type ClassifiedSizingGender = 'men' | 'women' | 'boy' | 'girl';
export type ClassifiedApparelSize = 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl' | 'xxxl';
export type ClassifiedApparelFit = 'slim' | 'regular' | 'oversized';

export const CLASSIFIED_SIZING_GENDERS: ClassifiedSizingGender[] = ['men', 'women', 'boy', 'girl'];
export const CLASSIFIED_APPAREL_SIZES: ClassifiedApparelSize[] = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
export const CLASSIFIED_APPAREL_FITS: ClassifiedApparelFit[] = ['slim', 'regular', 'oversized'];

export const CLASSIFIED_SIZING_FIELD_IDS = {
  gender: 'classified_sizing_gender',
  apparelSize: 'classified_apparel_size',
  apparelFit: 'classified_apparel_fit',
  footLength: 'classified_foot_length_cm'
} as const;

export const LEGACY_CLASSIFIED_SIZE_FIELD_IDS = new Set([
  'surf_wear_size',
  'swimwear_size',
  'martial_gi_size',
  'diving_size',
  'football_shoe_size',
  'volleyball_shoe_size',
  'running_shoe_size',
  'trek_shoe_size'
]);

const apparelSubCategories = new Set(['mens_clothing', 'womens_clothing', 'kids_clothing']);
const footwearSubCategories = new Set(['shoes']);

const apparelProducts: Record<string, string[]> = {
  surfing: ['wetsuit', 'rashguard', 'poncho'],
  padel: ['clothing'],
  tennis: ['clothing'],
  swimming: ['swimwear', 'racing_suit'],
  martial_arts: ['gi', 'uniform'],
  diving: ['wetsuit'],
  football: ['uniform'],
  volleyball: ['uniform'],
  running: ['clothing'],
  trekking_hiking: ['clothing', 'raincoat']
};

const footwearProducts: Record<string, string[]> = {
  padel: ['shoes'],
  tennis: ['shoes'],
  football: ['boots'],
  badminton: ['shoes'],
  volleyball: ['shoes'],
  running: ['shoes'],
  trekking_hiking: ['shoes'],
  golf: ['shoes']
};

export const getClassifiedSizingKind = (
  subCategory: string,
  productType: string
): ClassifiedSizingKind | null => {
  if (apparelSubCategories.has(subCategory)) return 'apparel';
  if (footwearSubCategories.has(subCategory)) return 'footwear';
  if (apparelProducts[subCategory]?.includes(productType)) return 'apparel';
  if (footwearProducts[subCategory]?.includes(productType)) return 'footwear';
  return null;
};

type ApparelConversion = {
  eu: string;
  us: string;
  uk: string;
  ru: string;
  asia: string;
  body: string;
};

const menConversions: Record<ClassifiedApparelSize, ApparelConversion> = {
  xs: { eu: '44', us: '34', uk: '34', ru: '44', asia: 'S', body: '82-87 cm' },
  s: { eu: '46', us: '36', uk: '36', ru: '46', asia: 'M', body: '88-94 cm' },
  m: { eu: '48-50', us: '38-40', uk: '38-40', ru: '48-50', asia: 'L', body: '95-102 cm' },
  l: { eu: '52-54', us: '42-44', uk: '42-44', ru: '52-54', asia: 'XL', body: '103-111 cm' },
  xl: { eu: '56', us: '46', uk: '46', ru: '56', asia: 'XXL', body: '112-121 cm' },
  xxl: { eu: '58-60', us: '48-50', uk: '48-50', ru: '58-60', asia: 'XXXL', body: '122-132 cm' },
  xxxl: { eu: '62', us: '52', uk: '52', ru: '62', asia: '4XL', body: '133-144 cm' }
};

const womenConversions: Record<ClassifiedApparelSize, ApparelConversion> = {
  xs: { eu: '32-34', us: '0-2', uk: '4-6', ru: '40-42', asia: 'S', body: '76-82 cm' },
  s: { eu: '36', us: '4-6', uk: '8-10', ru: '44', asia: 'M', body: '83-88 cm' },
  m: { eu: '38-40', us: '8-10', uk: '12-14', ru: '46-48', asia: 'L', body: '89-96 cm' },
  l: { eu: '42', us: '12-14', uk: '16-18', ru: '50', asia: 'XL', body: '97-104 cm' },
  xl: { eu: '44-46', us: '16-18', uk: '20-22', ru: '52-54', asia: 'XXL', body: '105-116 cm' },
  xxl: { eu: '48-50', us: '20-22', uk: '24-26', ru: '56-58', asia: 'XXXL', body: '117-128 cm' },
  xxxl: { eu: '52', us: '24', uk: '28', ru: '60', asia: '4XL', body: '129-136 cm' }
};

const youthConversions: Record<ClassifiedApparelSize, ApparelConversion> = {
  xs: { eu: '116-122', us: '6-7', uk: '6-7', ru: '116-122', asia: '120', body: '116-122 cm' },
  s: { eu: '128-134', us: '8-9', uk: '8-9', ru: '128-134', asia: '130', body: '128-134 cm' },
  m: { eu: '140-146', us: '10-12', uk: '10-12', ru: '140-146', asia: '140-150', body: '140-146 cm' },
  l: { eu: '152-158', us: '14-16', uk: '14-16', ru: '152-158', asia: '160', body: '152-158 cm' },
  xl: { eu: '164-170', us: '18-20', uk: '18-20', ru: '164-170', asia: '170', body: '164-170 cm' },
  xxl: { eu: '176', us: '22', uk: '22', ru: '176', asia: '180', body: '171-176 cm' },
  xxxl: { eu: '182', us: '24', uk: '24', ru: '182', asia: '190', body: '177-182 cm' }
};

export const getApparelSizeConversion = (
  gender: ClassifiedSizingGender,
  size: ClassifiedApparelSize
) => {
  if (gender === 'men') return menConversions[size];
  if (gender === 'women') return womenConversions[size];
  return youthConversions[size];
};

type AdultShoeRow = {
  foot: number;
  eu: string;
  uk: string;
  usMen: string;
  usWomen: string;
};

const adultShoeRows: AdultShoeRow[] = [
  { foot: 22.1, eu: '36', uk: '3.5', usMen: '4', usWomen: '5' },
  { foot: 22.5, eu: '36 2/3', uk: '4', usMen: '4.5', usWomen: '5.5' },
  { foot: 22.9, eu: '37 1/3', uk: '4.5', usMen: '5', usWomen: '6' },
  { foot: 23.3, eu: '38', uk: '5', usMen: '5.5', usWomen: '6.5' },
  { foot: 23.8, eu: '38 2/3', uk: '5.5', usMen: '6', usWomen: '7' },
  { foot: 24.2, eu: '39 1/3', uk: '6', usMen: '6.5', usWomen: '7.5' },
  { foot: 24.6, eu: '40', uk: '6.5', usMen: '7', usWomen: '8' },
  { foot: 25, eu: '40 2/3', uk: '7', usMen: '7.5', usWomen: '8.5' },
  { foot: 25.5, eu: '41 1/3', uk: '7.5', usMen: '8', usWomen: '9' },
  { foot: 25.9, eu: '42', uk: '8', usMen: '8.5', usWomen: '9.5' },
  { foot: 26.3, eu: '42 2/3', uk: '8.5', usMen: '9', usWomen: '10' },
  { foot: 26.7, eu: '43 1/3', uk: '9', usMen: '9.5', usWomen: '10.5' },
  { foot: 27.1, eu: '44', uk: '9.5', usMen: '10', usWomen: '11' },
  { foot: 27.6, eu: '44 2/3', uk: '10', usMen: '10.5', usWomen: '11.5' },
  { foot: 28, eu: '45 1/3', uk: '10.5', usMen: '11', usWomen: '12' },
  { foot: 28.4, eu: '46', uk: '11', usMen: '11.5', usWomen: '12.5' },
  { foot: 28.8, eu: '46 2/3', uk: '11.5', usMen: '12', usWomen: '13' },
  { foot: 29.3, eu: '47 1/3', uk: '12', usMen: '12.5', usWomen: '13.5' },
  { foot: 29.7, eu: '48', uk: '12.5', usMen: '13', usWomen: '14' },
  { foot: 30.1, eu: '48 2/3', uk: '13', usMen: '13.5', usWomen: '14.5' },
  { foot: 30.5, eu: '49 1/3', uk: '13.5', usMen: '14', usWomen: '15' },
  { foot: 31, eu: '50', uk: '14', usMen: '14.5', usWomen: '15.5' },
  { foot: 31.8, eu: '51 1/3', uk: '15', usMen: '16', usWomen: '17' },
  { foot: 32.6, eu: '52 2/3', uk: '16', usMen: '17', usWomen: '18' },
  { foot: 33.5, eu: '53 1/3', uk: '17', usMen: '18', usWomen: '19' },
  { foot: 34.3, eu: '54 2/3', uk: '18', usMen: '19', usWomen: '20' },
  { foot: 35.2, eu: '55 2/3', uk: '19', usMen: '20', usWomen: '21' }
];

const nearestAdultShoeRow = (footLength: number) => adultShoeRows.reduce((nearest, row) => (
  Math.abs(row.foot - footLength) < Math.abs(nearest.foot - footLength) ? row : nearest
));

const formatHalf = (value: number) => {
  const rounded = Math.round(value * 2) / 2;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const formatYouthSize = (rawValue: number, suffix: string) => {
  const rounded = Math.round(rawValue * 2) / 2;
  if (rounded <= 13.5) return `${formatHalf(rounded)}K`;
  return `${formatHalf(rounded - 13)}${suffix}`;
};

export const getShoeLengthRange = (gender?: ClassifiedSizingGender) => (
  gender === 'boy' || gender === 'girl'
    ? { min: 14, max: 25, initial: 19.5 }
    : { min: 22, max: 35, initial: 26 }
);

export const getShoeSizeConversion = (gender: ClassifiedSizingGender, footLength: number) => {
  const millimeters = Math.round(footLength * 10);
  if (gender === 'boy' || gender === 'girl') {
    const eu = formatHalf(footLength * 1.5 + 2.75);
    const ukRaw = footLength / 2.54 * 3 - 9.5;
    return {
      mondopoint: String(millimeters),
      eu,
      us: formatYouthSize(ukRaw + 1, 'Y'),
      uk: formatYouthSize(ukRaw, ''),
      ru: eu,
      jp: footLength.toFixed(1),
      cn: String(millimeters),
      kr: String(millimeters)
    };
  }

  const row = nearestAdultShoeRow(footLength);
  return {
    mondopoint: String(millimeters),
    eu: row.eu,
    us: gender === 'women' ? row.usWomen : row.usMen,
    uk: row.uk,
    ru: row.eu,
    jp: footLength.toFixed(1),
    cn: String(millimeters),
    kr: String(millimeters)
  };
};
