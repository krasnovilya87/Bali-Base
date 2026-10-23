import type { Listing } from '../types';

const INVESTMENT_SELLER_TYPES = new Set(['owner', 'agency', 'developer']);

// Label next to the price: investments name the seller (developer/agency/owner) instead of
// "Direct price", and show nothing when the seller type is unknown.
export const getPriceSourceLabelKey = (listing: Pick<Listing, 'category' | 'investmentAttributes'>) => {
  if (listing.category !== 'investments') return 'listing.directPrice';
  const sellerType = String(listing.investmentAttributes?.seller_type || '');
  return INVESTMENT_SELLER_TYPES.has(sellerType) ? `investments.option.${sellerType}` : null;
};
