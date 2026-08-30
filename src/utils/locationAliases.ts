export type CanonicalDistrict =
  | 'Canggu'
  | 'Berawa'
  | 'Pererenan'
  | 'Ubud'
  | 'Seminyak'
  | 'Kuta'
  | 'Sanur'
  | 'Uluwatu'
  | 'Nusa Dua'
  | 'Jimbaran'
  | 'Amed'
  | 'Kintamani'
  | 'Lovina'
  | 'Bingin'
  | 'Kerobokan'
  | 'Denpasar'
  | 'Tabanan'
  | 'Seseh';

export const CANONICAL_DISTRICTS: CanonicalDistrict[] = [
  'Canggu',
  'Berawa',
  'Pererenan',
  'Ubud',
  'Seminyak',
  'Kuta',
  'Sanur',
  'Uluwatu',
  'Nusa Dua',
  'Jimbaran',
  'Amed',
  'Kintamani',
  'Lovina',
  'Bingin',
  'Kerobokan',
  'Denpasar',
  'Tabanan',
  'Seseh'
];

const DISTRICT_ALIASES: Record<CanonicalDistrict, string[]> = {
  Canggu: ['canggu', 'cangu', 'чангу', 'чанггу', 'чингу', 'ченгу'],
  Berawa: ['berawa', 'berewa', 'berava', 'берава', 'бирава', 'бераве', 'бираве', 'берава бич', 'бирава бич'],
  Pererenan: ['pererenan', 'переренан'],
  Ubud: ['ubud', 'убуд', 'убуде'],
  Seminyak: ['seminyak', 'семиньяк'],
  Kuta: ['kuta', 'кута'],
  Sanur: ['sanur', 'санур'],
  Uluwatu: ['uluwatu', 'улувату'],
  'Nusa Dua': ['nusa dua', 'нуса дуа'],
  Jimbaran: ['jimbaran', 'jimburan', 'джимбаран'],
  Amed: ['amed', 'амед'],
  Kintamani: ['kintamani', 'кинтамани'],
  Lovina: ['lovina', 'ловина'],
  Bingin: ['bingin', 'бингин'],
  Kerobokan: ['kerobokan', 'керобокан'],
  Denpasar: ['denpasar', 'денпасар'],
  Tabanan: ['tabanan', 'табанан'],
  Seseh: ['seseh', 'сесе', 'сесех']
};

const DISTRICT_PARENT_MAP: Partial<Record<CanonicalDistrict, CanonicalDistrict>> = {
  Berawa: 'Canggu',
  Pererenan: 'Canggu'
};

export const normalizeLocationText = (value: string) =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const resolveDistrictSearch = (value: string) => {
  const normalized = normalizeLocationText(value);
  const matches = CANONICAL_DISTRICTS.filter(district => {
    const aliases = DISTRICT_ALIASES[district] ?? [district];
    return aliases.some(alias => normalized.includes(normalizeLocationText(alias)));
  });

  const expanded = new Set<CanonicalDistrict>();
  matches.forEach(district => {
    expanded.add(district);
    const parent = DISTRICT_PARENT_MAP[district];
    if (parent) expanded.add(parent);
  });

  return Array.from(expanded);
};
