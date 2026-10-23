import type { Listing } from '../types';
import en from '../i18n/locales/en';
import { buildListingShareUrl } from './listingShare';

// Sellers are agencies and developers in Bali, so the WhatsApp message is always English,
// whatever language the visitor's browser uses.
const BEDROOM_SUBTYPES = new Set(['villa', 'house', 'townhouse', 'villa_complex', 'reconstruction']);

const formatNumber = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 1 });

const readNumber = (value: unknown) => {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
};

const getSizeLine = (listing: Listing, subtype: string) => {
  const attributes = listing.investmentAttributes || {};
  if (BEDROOM_SUBTYPES.has(subtype)) {
    const bedrooms = readNumber(attributes.bedrooms) ?? readNumber(listing.bedroomsCount);
    return bedrooms ? `Bedrooms: ${formatNumber(bedrooms)}` : '';
  }
  const area = listing.subCategory === 'land'
    ? readNumber(attributes.land_area)
    : listing.subCategory === 'commercial_real_estate'
      ? readNumber(attributes.premises_area)
      : readNumber(attributes.building_area) ?? readNumber(listing.area);
  return area ? `Area: ${formatNumber(area)} m²` : '';
};

export const buildInvestmentContactMessage = (listing: Listing) => {
  const subtype = String(listing.investmentAttributes?.investment_subtype || '');
  const typeLabel = (en as Record<string, string>)[`investments.option.${subtype}`] || '';
  const price = readNumber(listing.pricePerDay);

  return [
    'Bali Base.',
    'Hello! I am interested in your listing:',
    listing.title,
    typeLabel ? `Type: ${typeLabel}` : '',
    getSizeLine(listing, subtype),
    price ? `Price: IDR ${formatNumber(Math.round(price))}` : '',
    buildListingShareUrl(listing.id)
  ].filter(Boolean).join('\n');
};
