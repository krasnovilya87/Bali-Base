import { FilterState, Listing } from '../types';
import { getInvestmentFields } from '../config/investmentSpecial';

export const listingMatchesInvestmentFilters = (listing: Listing, filters: FilterState) => {
  const attributes = listing.investmentAttributes || {};

  if (filters.investmentSubtypes?.length) {
    const subtype = String(attributes.investment_subtype || '');
    if (!filters.investmentSubtypes.includes(subtype)) return false;
  }

  const options = filters.investmentOptions || {};
  for (const [fieldId, selected] of Object.entries(options)) {
    if (!selected.length) continue;
    const value = attributes[fieldId];
    const values = Array.isArray(value) ? value.map(String) : [String(value ?? '')];
    if (!selected.some(item => values.includes(item))) return false;
  }

  const ranges = filters.investmentNumberRanges || {};
  for (const [fieldId, range] of Object.entries(ranges)) {
    const value = Number(attributes[fieldId]);
    if (!Number.isFinite(value)) return false;
    if (range.min !== undefined && value < range.min) return false;
    if (range.max !== undefined && value > range.max) return false;
  }

  const text = filters.investmentText || {};
  for (const [fieldId, query] of Object.entries(text)) {
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
