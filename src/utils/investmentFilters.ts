import { FilterState, Listing } from '../types';
import { getInvestmentFields } from '../config/investmentSpecial';
import { COMPANIES, findCompanyByName } from '../config/companies';

// Developer filter: chips hold company ids, OTHER_DEVELOPER takes a typed name from investmentText.
export const DEVELOPER_FILTER_KEY = 'developer';
export const OTHER_DEVELOPER = '__other__';

// Minutes to the beach from the nearby-spots calculation (same source as the housing filter).
export const getSeaMinutes = (listing: Listing): number | undefined => {
  const beach = listing.nearbySpots?.find(spot => spot.emoji.includes('🏖') || spot.title === 'Пляж');
  return beach?.durationMinutes ?? listing.distanceToSeaMinutes;
};

const matchesDeveloperFilter = (listing: Listing, filters: FilterState) => {
  const selected = filters.investmentOptions?.[DEVELOPER_FILTER_KEY] || [];
  if (!selected.length) return true;

  const company = findCompanyByName(listing.ownerName);
  if (company && selected.includes(company.id)) return true;

  if (!selected.includes(OTHER_DEVELOPER)) return false;
  const query = (filters.investmentText?.[DEVELOPER_FILTER_KEY] || '').trim().toLocaleLowerCase();
  if (query) return (listing.ownerName || '').toLocaleLowerCase().includes(query);
  return !company || !COMPANIES.some(item => item.id === company.id);
};

export const listingMatchesInvestmentFilters = (listing: Listing, filters: FilterState) => {
  const attributes = listing.investmentAttributes || {};

  if (filters.investmentSubtypes?.length) {
    const subtype = String(attributes.investment_subtype || '');
    if (!filters.investmentSubtypes.includes(subtype)) return false;
  }

  if (!matchesDeveloperFilter(listing, filters)) return false;

  const options = filters.investmentOptions || {};
  for (const [fieldId, selected] of Object.entries(options)) {
    if (fieldId === DEVELOPER_FILTER_KEY || !selected.length) continue;
    const value = attributes[fieldId];
    const values = Array.isArray(value) ? value.map(String) : [String(value ?? '')];
    if (!selected.some(item => values.includes(item))) return false;
  }

  const ranges = filters.investmentNumberRanges || {};
  for (const [fieldId, range] of Object.entries(ranges)) {
    const value = fieldId === 'distance_to_sea_minutes' ? Number(getSeaMinutes(listing)) : Number(attributes[fieldId]);
    if (!Number.isFinite(value)) return false;
    if (range.min !== undefined && value < range.min) return false;
    if (range.max !== undefined && value > range.max) return false;
  }

  const text = filters.investmentText || {};
  for (const [fieldId, query] of Object.entries(text)) {
    if (fieldId === DEVELOPER_FILTER_KEY) continue;
    if (query.trim() && !String(attributes[fieldId] || '').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) return false;
  }

  if (filters.investmentPublishedWithin && filters.investmentPublishedWithin !== 'all') {
    const createdAt = listing.createdAt ? Date.parse(listing.createdAt) : NaN;
    const days = Number(filters.investmentPublishedWithin);
    if (!Number.isFinite(createdAt) || createdAt < Date.now() - days * 86400000) return false;
  }

  return true;
};

export const getInvestmentAttributeEntries = (listing: Listing) => {
  const fields = getInvestmentFields(listing.subCategory);
  return fields.flatMap(field => {
    const value = listing.investmentAttributes?.[field.id];
    return value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
      ? []
      : [{ field, value }];
  });
};
