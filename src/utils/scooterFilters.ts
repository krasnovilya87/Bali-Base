import { Listing } from '../types';

export const SCOOTER_MODEL_GROUPS = [
  { value: 'all', labelKey: 'filters.transport.modelGroup.all' },
  { value: 'popular', labelKey: 'filters.transport.modelGroup.popular' },
  { value: 'beginner', labelKey: 'filters.transport.modelGroup.beginner' },
  { value: 'couple', labelKey: 'filters.transport.modelGroup.couple' },
  { value: 'retro', labelKey: 'filters.transport.modelGroup.retro' },
  { value: 'maxi', labelKey: 'filters.transport.modelGroup.maxi' },
  { value: 'budget', labelKey: 'filters.transport.modelGroup.budget' }
] as const;

export type ScooterModelGroup = typeof SCOOTER_MODEL_GROUPS[number]['value'];

export const SCOOTER_MODEL_OPTIONS = [
  { value: 'scoopy', label: 'Scoopy' },
  { value: 'nmax', label: 'NMAX' },
  { value: 'nmax_turbo', label: 'NMAX turbo' },
  { value: 'vario_160', label: 'Vario 160' },
  { value: 'honda_pcx', label: 'Honda PCX' },
  { value: 'vario_125', label: 'Vario 125' },
  { value: 'fazzio', label: 'Fazzio' },
  { value: 'beat_110', label: 'Beat 110' },
  { value: 'genio_110', label: 'Genio 110' },
  { value: 'grand_filano_125', label: 'Grand Filano 125' },
  { value: 'freego_125', label: 'FreeGo 125' },
  { value: 'mio_125', label: 'Mio 125' },
  { value: 'vespa_sprint_150', label: 'Vespa Sprint 150' },
  { value: 'vespa_primavera_150', label: 'Vespa Primavera 150' },
  { value: 'xmax', label: 'XMAX' },
  { value: 'adv', label: 'ADV' },
  { value: 'pcx', label: 'PCX' },
  { value: 'aerox_155', label: 'Aerox 155' }
] as const;

export const SCOOTER_MODELS_BY_GROUP: Record<ScooterModelGroup, string[]> = {
  all: SCOOTER_MODEL_OPTIONS.map(model => model.value),
  popular: ['scoopy', 'nmax', 'vario_160', 'honda_pcx'],
  beginner: ['scoopy', 'vario_125', 'vario_160', 'fazzio', 'beat_110', 'genio_110', 'grand_filano_125', 'freego_125', 'mio_125'],
  couple: ['nmax', 'nmax_turbo', 'xmax', 'adv', 'pcx'],
  retro: ['vespa_sprint_150', 'vespa_primavera_150', 'scoopy'],
  maxi: ['nmax', 'nmax_turbo', 'xmax', 'adv', 'pcx', 'aerox_155'],
  budget: ['scoopy', 'vario_125', 'fazzio', 'beat_110', 'genio_110', 'freego_125', 'mio_125']
};

export const SCOOTER_COLOR_OPTIONS = ['black', 'white', 'red', 'blue', 'silver', 'gray', 'green', 'yellow', 'orange', 'brown'];
export const SCOOTER_CONDITION_OPTIONS = ['like_new', 'minor_scratches', 'faded_surf_rack'];
export const SCOOTER_SELLER_TYPE_OPTIONS = ['private', 'company'];

export const getScooterModelsForGroup = (group: ScooterModelGroup) =>
  SCOOTER_MODEL_OPTIONS.filter(model => SCOOTER_MODELS_BY_GROUP[group].includes(model.value));

export const textMatchesToken = (listing: Listing, token: string) => {
  const haystack = `${listing.title} ${listing.description}`.toLowerCase();
  return haystack.includes(token.toLowerCase());
};

export const getListingVehicleModel = (listing: Listing) => {
  const normalizedModel = listing.vehicleModel?.toLowerCase();
  if (normalizedModel) return normalizedModel;

  const model = SCOOTER_MODEL_OPTIONS.find(option => textMatchesToken(listing, option.label));
  return model?.value;
};

export const getListingVehicleColor = (listing: Listing) =>
  listing.vehicleColor?.toLowerCase() || SCOOTER_COLOR_OPTIONS.find(color => textMatchesToken(listing, color));

export const getListingVehicleCondition = (listing: Listing) => {
  if (listing.vehicleCondition) return listing.vehicleCondition;
  const text = `${listing.title} ${listing.description}`.toLowerCase();
  if (/(surf.?rack|серф.?рек|surf.?рек|выцвет|faded|sun.?worn)/.test(text)) return 'faded_surf_rack';
  if (/(царап|scratch)/.test(text)) return 'minor_scratches';
  if (/(как нов|почти нов|идеальн|like new|perfect|mint)/.test(text)) return 'like_new';
  return undefined;
};

export const getListingSellerType = (listing: Listing) => {
  if (listing.sellerType) return listing.sellerType;

  const text = `${listing.ownerName} ${listing.title} ${listing.description}`.toLowerCase();
  if (/(rental|rentals|bike.?rent|wheels|dealer|company|agency|shop|store|garage|fleet|business|broker|аренд|прокат|компан|агентств|дилер|салон)/.test(text)) {
    return 'company';
  }

  return 'private';
};

export const yearMeetsMinimum = (year: Listing['yearBuilt'], minYear: number) =>
  minYear <= 0 || (typeof year === 'number' && year >= minYear);

export const listingOffersFreeDeliveryToDistrict = (listing: Listing, selectedDistricts: string[]) => {
  if (selectedDistricts.length === 0) return true;
  if (listing.freeDeliveryToDistricts) return true;
  if (listing.freeDeliveryDistricts?.some(district => selectedDistricts.includes(district))) return true;

  const text = `${listing.title} ${listing.description}`.toLowerCase();
  const mentionsFreeDelivery = /(free delivery|бесплатн.{0,12}достав|доставк.{0,12}бесплат|gratis delivery|pengiriman gratis)/.test(text);
  if (!mentionsFreeDelivery) return false;

  return selectedDistricts.some(district => text.includes(district.toLowerCase())) || /(all districts|all areas|все район|любой район)/.test(text);
};

export const listingOffersFreeDeliveryToAddress = (listing: Listing) => {
  if (listing.freeDeliveryToAddress || listing.freeDeliveryToDistricts) return true;

  const text = `${listing.title} ${listing.description}`.toLowerCase();
  return /(free delivery|бесплатн.{0,12}достав|доставк.{0,12}бесплат|gratis delivery|pengiriman gratis)/.test(text);
};
