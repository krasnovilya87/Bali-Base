import type { Listing } from '../types';

const INVESTMENT_SELLER_TYPES = new Set(['owner', 'agency', 'developer']);
// Sections with one fixed price set by the seller: not a daily rate and no booking platform to compare against.
const FIXED_PRICE_CATEGORIES = new Set(['services', 'ads', 'life', 'afisha']);
export const isFixedPriceCategory = (category: string) => FIXED_PRICE_CATEGORIES.has(category);

// Label next to the price: investments name the seller (developer/agency/owner) instead of
// "Direct price", and show nothing when the seller type is unknown.
export const getPriceSourceLabelKey = (listing: Pick<Listing, 'category' | 'investmentAttributes'>) => {
  if (isFixedPriceCategory(listing.category)) return null;
  if (listing.category !== 'investments') return 'listing.directPrice';
  const sellerType = String(listing.investmentAttributes?.seller_type || '');
  return INVESTMENT_SELLER_TYPES.has(sellerType) ? `investments.option.${sellerType}` : null;
};

// Investment units with no published price (stored as 0) show "Price on request" instead of "0".
export const isPriceOnRequest = (listing: Pick<Listing, 'category' | 'pricePerDay'>) =>
  listing.category === 'investments' && !(listing.pricePerDay > 0);
