import { Listing } from '../types';

const buildListingMapsQuery = (listing: Listing) =>
  [listing.title, listing.address, listing.district, 'Bali']
    .filter(Boolean)
    .join(' ');

export const getGooglePlaceId = (listing: Listing) =>
  listing.googlePlaceId || listing.placeId || '';

export const buildGoogleMapsReviewsUrl = (listing: Listing) => {
  const placeId = getGooglePlaceId(listing);

  if (placeId) {
    return `https://search.google.com/local/reviews?placeid=${encodeURIComponent(placeId)}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(buildListingMapsQuery(listing))}`;
};

export const buildGoogleMapsWriteReviewUrl = (listing: Listing) => {
  const placeId = getGooglePlaceId(listing);

  if (placeId) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(buildListingMapsQuery(listing))}`;
};
