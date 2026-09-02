import {
  SCOOTER_COLOR_OPTIONS,
  SCOOTER_CONDITION_OPTIONS,
  SCOOTER_MODEL_OPTIONS,
  SCOOTER_SELLER_TYPE_OPTIONS
} from '../../../utils/scooterFilters';

export const SCOOTER_WIZARD_MODEL_OPTIONS = SCOOTER_MODEL_OPTIONS;
export const SCOOTER_WIZARD_COLOR_OPTIONS = SCOOTER_COLOR_OPTIONS;
export const SCOOTER_WIZARD_CONDITION_OPTIONS = SCOOTER_CONDITION_OPTIONS;
export const SCOOTER_WIZARD_SELLER_TYPE_OPTIONS = SCOOTER_SELLER_TYPE_OPTIONS;

export const SCOOTER_WIZARD_COLOR_SWATCHES: Record<string, string> = {
  black: '#111827',
  white: '#FFFFFF',
  red: '#EF4444',
  blue: '#2563EB',
  gray: '#64748B',
  green: '#16A34A',
  yellow: '#FACC15',
  orange: '#F97316',
  brown: '#92400E',
  exclusive: '#A855F7'
};

export const SCOOTER_WIZARD_MODEL_DESCRIPTIONS: Record<string, string> = {
  scoopy: 'A light, friendly and stylish scooter for beginners and relaxed rides through tourist areas. Its retro design looks great in photos, but for longer trips as a couple it is better to choose a more powerful model.',
  vario_160: 'A versatile and dynamic scooter that feels comfortable both in dense traffic and on roads outside town. It suits most riders and makes it easy to explore Bali while keeping handling light and confident.',
  vario_125: 'A compact and economical scooter for beginners and everyday movement around tourist areas. It is easy to handle in traffic and narrow streets, but may feel less comfortable for long trips with two people.',
  fazzio: 'A light city scooter with a modern retro design for calm rides and bright photos. It suits beginners, women and riders who enjoy stylish details, although longer journeys are better on a larger model.',
  beat_110: 'One of the lightest and most economical choices for short rides around town, to the beach or to cafes. It is simple to handle and beginner-friendly, but not designed for especially comfortable long-distance travel.',
  genio_110: 'A compact and calm scooter for beginner riders and easy daily trips without rush. Its modern design looks good in photos, while the small size helps riders feel confident in traffic and on narrow streets.',
  grand_filano_125: 'An elegant retro scooter for riders who care about comfort, style and beautiful photos during the ride. It is ideal for cafes, beaches and tourist areas, and works better than most compact models for relaxed island trips.',
  freego_125: 'A practical and roomy scooter for daily errands, city rides and short routes as a couple. It does not try to draw attention, but offers a comfortable seating position, simple handling and sensible fuel economy.',
  mio_125: 'A light budget scooter for short rides, narrow streets and dense city traffic. It works well for beginners and anyone who needs simple transport, but for longer routes and regular two-person riding it is better to choose a stronger model.',
  vespa_sprint_150: 'A bright and sporty retro scooter for riders who want emotion from both the ride and the bike itself. It looks excellent in photos and suits relaxed trips around Bali, although on rough roads it is less practical than an ADV or NMAX.',
  vespa_primavera_150: 'Elegant Italian classic for romantic rides, stylish outfits and atmospheric photos. It feels comfortable in tourist areas and on calm routes, but for true adventures it is better to choose a more practical scooter.',
  xmax: 'A large and powerful maxi scooter for experienced riders, long-distance travel and maximum comfort when riding as a couple. It is excellent for two people and island-wide trips, but its weight and size can be inconvenient for beginners and heavy traffic.',
  adv: 'An adventure-style scooter for couples, mountain routes and exploring remote corners of the island. It is comfortable for longer two-person rides, while the higher riding position and expressive design create a real sense of adventure.',
  aerox_155: 'A sporty and dynamic scooter for active rides and riders who enjoy expressive design. It works for couples and short trips together, although on longer routes it is less comfortable for the passenger than an NMAX or PCX.',
  nmax: 'A comfortable maxi scooter for daily rides, island trips and relaxing together. It is great for couples: the spacious seat and easy riding position make longer distances comfortable.',
  nmax_turbo: 'A comfortable and dynamic maxi scooter for daily rides, island trips and relaxing together. It is great for couples, with a spacious seat, easy riding position and stronger response for confident longer-distance riding.',
  pcx: 'A smooth and comfortable maxi scooter for couples, daily rides and relaxed island trips. The spacious seat, easy riding position and premium design make it especially pleasant for longer routes together.'
};

export const getScooterModelLabel = (value: string) =>
  SCOOTER_WIZARD_MODEL_OPTIONS.find(model => model.value === value)?.label || '';

export const getScooterModelDescription = (value: string) =>
  SCOOTER_WIZARD_MODEL_DESCRIPTIONS[value] || '';

export const isScooterGeneratedDescription = (value: string) =>
  Object.values(SCOOTER_WIZARD_MODEL_DESCRIPTIONS).includes(value.trim());

export const getScooterWizardYearOptions = (currentYear: number) => [
  ...Array.from({ length: 12 }, (_, index) => String(currentYear - index)),
  'other'
];
