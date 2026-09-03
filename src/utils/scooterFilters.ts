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
  popular: ['scoopy', 'nmax', 'vario_160'],
  beginner: ['scoopy', 'vario_125', 'vario_160', 'fazzio', 'beat_110', 'genio_110', 'grand_filano_125', 'freego_125', 'mio_125'],
  couple: ['nmax', 'nmax_turbo', 'xmax', 'adv', 'pcx'],
  retro: ['vespa_sprint_150', 'vespa_primavera_150', 'scoopy'],
  maxi: ['nmax', 'nmax_turbo', 'xmax', 'adv', 'pcx', 'aerox_155'],
  budget: ['scoopy', 'vario_125', 'fazzio', 'beat_110', 'genio_110', 'freego_125', 'mio_125']
};

export const SCOOTER_COLOR_OPTIONS = ['black', 'white', 'red', 'blue', 'gray', 'green', 'yellow', 'orange', 'brown', 'exclusive'];
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

export const getListingVehicleColor = (listing: Listing) => {
  const normalizedColor = listing.vehicleColor?.toLowerCase();
  if (normalizedColor === 'silver') return 'gray';
  if (normalizedColor) return normalizedColor;

  return SCOOTER_COLOR_OPTIONS.find(color => textMatchesToken(listing, color));
};

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

export const listingHasKeyless = (listing: Listing) => {
  if (listing.keyless) return true;

  const text = `${listing.title} ${listing.description}`.toLowerCase();
  return /\b(keyless|smart key|smartkey)\b|без.?ключ|смарт.?ключ/.test(text);
};

export const listingHasAbs = (listing: Listing) => {
  if (listing.abs) return true;

  const text = `${listing.title} ${listing.description}`.toLowerCase();
  return /\b(abs|anti.?lock|anti.?lock braking)\b|антиблок|абс/.test(text);
};

export const listingHasSurfRack = (listing: Listing) => {
  if (listing.surfRack || listing.amenities?.includes('surf_rack')) return true;

  const text = `${listing.title} ${listing.description}`.toLowerCase();
  return /\b(surf.?rack|board.?rack)\b|серф.?рек|креп.{0,12}серф/.test(text);
};

export const listingHasInsurance = (listing: Listing) => {
  if (listing.insurance) return true;

  const text = `${listing.title} ${listing.description}`.toLowerCase();
  return /\b(insurance|insured)\b|страхов/.test(text);
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

export const listingOffersFreeDeliveryToAddress = (listing: Listing, deliveryDistrict?: string) => {
  if (listing.freeDeliveryToAddress) return true;
  if (deliveryDistrict && listing.freeDeliveryDistricts?.length) {
    return listingOffersFreeDeliveryToDistrict(listing, [deliveryDistrict]);
  }
  if (listing.freeDeliveryToDistricts) return true;

  const text = `${listing.title} ${listing.description}`.toLowerCase();
  return /(free delivery|бесплатн.{0,12}достав|доставк.{0,12}бесплат|gratis delivery|pengiriman gratis)/.test(text);
};
