import { GOOGLE_PLACES_REVIEWS_FIELD_MASK } from './config';

type GooglePlacesReviewResponse = {
  id?: string;
  rating?: number;
  userRatingCount?: number;
  reviews?: Array<{
    name?: string;
    relativePublishTimeDescription?: string;
    rating?: number;
    text?: { text?: string; languageCode?: string };
    originalText?: { text?: string; languageCode?: string };
    authorAttribution?: {
      displayName?: string;
      uri?: string;
      photoUri?: string;
    };
    publishTime?: string;
  }>;
};

export const fetchGooglePlaceReviews = async (
  placeId: string,
  apiKey = process.env.GOOGLE_PLACES_API_KEY
): Promise<GooglePlacesReviewResponse> => {
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY is not configured on the server');
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': GOOGLE_PLACES_REVIEWS_FIELD_MASK
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Places API failed: ${response.status} ${body}`);
  }

  return response.json() as Promise<GooglePlacesReviewResponse>;
};
