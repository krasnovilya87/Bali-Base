import { Listing } from '../types';

export const isListingVerified = (listing: Listing) => Boolean(listing.isVerified);
