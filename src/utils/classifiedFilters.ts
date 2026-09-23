import { Listing } from '../types';
import { MARKET_OTHER_BRANDS } from '../config/marketOtherCatalog';

export const CLASSIFIED_CATALOG_SUBCATEGORIES = new Set([
  'phones', 'tablets', 'computers', 'photo_video_gear', 'audio', 'home_appliances', 'electronics_accessories',
  'ads_scooters', 'ads_motorcycles', 'ads_cars', 'bicycles', 'water_transport', 'transport_parts',
  ...Object.keys(MARKET_OTHER_BRANDS)
]);

export const CLASSIFIED_CONDITION_OPTIONS = [
  'new',
  'like_new',
  'good',
  'fair',
  'needs_repair'
] as const;

export const CLASSIFIED_FULFILLMENT_OPTIONS = [
  'pickup',
  'delivery_available',
  'shipping_indonesia'
] as const;

export const CLASSIFIED_AUDIENCE_OPTIONS = [
  'men',
  'women',
  'unisex',
  'kids'
] as const;

export const CLASSIFIED_LEVEL_OPTIONS = [
  'beginner',
  'intermediate',
  'advanced',
  'professional'
] as const;

export const CLASSIFIED_PUBLICATION_PERIOD_OPTIONS = [
  '24h',
  '3d',
  '7d',
  '30d',
  '90d',
  'all'
] as const;

const periodHours: Record<string, number | null> = {
  '24h': 24,
  '3d': 72,
  '7d': 168,
  '30d': 720,
  '90d': 2160,
  all: null
};

export const listingMatchesClassifiedCondition = (listing: Listing, selected: string[] = []) => {
  if (selected.length === 0) return true;
  if (!listing.classifiedCondition) return true;
  return selected.includes(listing.classifiedCondition);
};

export const listingMatchesClassifiedFulfillment = (listing: Listing, selected: string[] = []) => {
  if (selected.length === 0) return true;
  if (!listing.classifiedFulfillment?.length) return true;
  return selected.some(value => listing.classifiedFulfillment?.includes(value));
};

export const listingMatchesClassifiedAudience = (listing: Listing, selected: string[] = []) => {
  if (selected.length === 0) return true;
  if (!listing.classifiedAudience) return true;
  return selected.includes(listing.classifiedAudience);
};

export const listingMatchesClassifiedLevel = (listing: Listing, selected: string[] = []) => {
  if (selected.length === 0) return true;
  if (!listing.classifiedLevel) return true;
  return selected.includes(listing.classifiedLevel);
};

export const listingMatchesClassifiedProductType = (listing: Listing, selected: string[] = []) => {
  if (selected.length === 0) return true;
  if (!listing.classifiedProductType) return true;
  return selected.includes(listing.classifiedProductType);
};

export const listingMatchesClassifiedSpecialAttributes = (
  listing: Listing,
  selectedOptions: Record<string, string[]> = {},
  numberRanges: Record<string, { min?: number; max?: number }> = {},
  textValues: Record<string, string> = {},
  dateRanges: Record<string, { from?: string; to?: string }> = {},
  requirePresent = false
) => {
  const attributes = listing.classifiedAttributes || {};

  for (const [fieldId, selected] of Object.entries(selectedOptions)) {
    if (!selected.length) continue;
    const listingValue = attributes[fieldId];
    if (listingValue === undefined || listingValue === '') {
      if (requirePresent) return false;
      continue;
    }
    if (Array.isArray(listingValue)) {
      if (!listingValue.some(value => selected.includes(String(value)))) return false;
    } else if (!selected.includes(String(listingValue))) {
      return false;
    }
  }

  for (const [fieldId, range] of Object.entries(numberRanges)) {
    if (range.min === undefined && range.max === undefined) continue;
    const listingValue = attributes[fieldId];
    if (listingValue === undefined || listingValue === '') {
      if (requirePresent) return false;
      continue;
    }
    const numericValue = Number(listingValue);
    if (!Number.isFinite(numericValue)) {
      if (requirePresent) return false;
      continue;
    }
    if (range.min !== undefined && numericValue < range.min) return false;
    if (range.max !== undefined && numericValue > range.max) return false;
  }

  for (const [fieldId, query] of Object.entries(textValues)) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) continue;
    const listingValue = attributes[fieldId];
    if (listingValue === undefined || listingValue === '') {
      if (requirePresent) return false;
      continue;
    }
    if (!String(listingValue).toLowerCase().includes(normalizedQuery)) return false;
  }

  for (const [fieldId, range] of Object.entries(dateRanges)) {
    if (!range.from && !range.to) continue;
    const listingValue = attributes[fieldId];
    if (listingValue === undefined || listingValue === '') {
      if (requirePresent) return false;
      continue;
    }
    const value = String(listingValue);
    if (range.from && value < range.from) return false;
    if (range.to && value > range.to) return false;
  }

  return true;
};

export const listingMatchesClassifiedPublicationPeriod = (listing: Listing, period: string) => {
  const hours = periodHours[period] ?? null;
  if (!hours) return true;
  const publishedAt = listing.createdAt || listing.pushedAt;
  if (!publishedAt) return true;
  const timestamp = new Date(publishedAt).getTime();
  if (!Number.isFinite(timestamp)) return true;
  return Date.now() - timestamp <= hours * 60 * 60 * 1000;
};
