import type { Router } from 'express';
import express from 'express';
import { getGooglePlaceReviewsForListing, refreshGooglePlaceReviews } from './service';
import type { GooglePlacesRequestPurpose } from './types';
import { adminDb } from '../firebaseAdmin';
import { getAuthenticatedUser, isAdminToken, rateLimit, requireAuth } from '../security';

const LISTING_COLLECTIONS = ['housing_for_rent_listing', 'transport_for_rent', 'listings'];
const MAX_MAPS_URL_LENGTH = 2_048;

const readListingOwner = async (listingId: string) => {
  for (const collectionName of LISTING_COLLECTIONS) {
    const snapshot = await adminDb.collection(collectionName).doc(listingId).get();
    if (snapshot.exists) return snapshot.data()?.ownerId as string | undefined;
  }
  return undefined;
};

const isAllowedGoogleMapsUrl = (value: string) => {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return host === 'maps.app.goo.gl' ||
      host === 'goo.gl' ||
      host.endsWith('.google.com') ||
      host.endsWith('.google.co.id') ||
      host === 'google.com' ||
      host === 'google.co.id';
  } catch {
    return false;
  }
};

const parseGoogleMapsUrl = (value: string) => {
  try {
    const url = new URL(value);
    const placeId = url.searchParams.get('query_place_id') || url.searchParams.get('place_id') || '';
    const queryValue = url.searchParams.get('query') || url.searchParams.get('q') || '';
    const placeMatch = url.pathname.match(/\/place\/([^/]+)/i);
    const searchText = queryValue && !/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(queryValue.trim())
      ? queryValue.trim()
      : placeMatch
        ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim()
        : '';

    return { placeId, searchText };
  } catch {
    return { placeId: '', searchText: '' };
  }
};

const resolveAllowedGoogleMapsUrl = async (rawUrl: string) => {
  let currentUrl = rawUrl;

  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    if (!isAllowedGoogleMapsUrl(currentUrl)) {
      throw new Error('Google Maps redirected to a disallowed host.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let response: Response;
    try {
      response = await fetch(currentUrl, {
        redirect: 'manual',
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status < 300 || response.status >= 400) {
      return response.url || currentUrl;
    }

    const location = response.headers.get('location');
    if (!location) throw new Error('Google Maps returned an invalid redirect.');
    currentUrl = new URL(location, currentUrl).toString();
  }

  throw new Error('Google Maps returned too many redirects.');
};

export const createGooglePlacesReviewsRouter = (): Router => {
  const router = express.Router();

  router.use(requireAuth);
  router.use(rateLimit({ scope: 'google-places', windowMs: 10 * 60 * 1000, max: 30 }));

  router.post('/maps-link/resolve', async (req, res) => {
    try {
      const { url }: { url?: string } = req.body || {};
      const rawUrl = String(url || '').trim();

      if (!rawUrl || rawUrl.length > MAX_MAPS_URL_LENGTH || !isAllowedGoogleMapsUrl(rawUrl)) {
        res.status(400).json({ error: 'A Google Maps URL is required' });
        return;
      }

      const resolvedUrl = await resolveAllowedGoogleMapsUrl(rawUrl);
      const parsed = parseGoogleMapsUrl(resolvedUrl);

      res.json({
        resolvedUrl,
        ...parsed
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  router.post('/reviews/refresh', async (req, res) => {
    try {
      const {
        listingId,
        placeId,
        purpose = 'manual'
      }: {
        listingId?: string;
        placeId?: string;
        purpose?: GooglePlacesRequestPurpose;
      } = req.body || {};

      if (!listingId || !placeId || listingId.length > 128 || placeId.length > 256) {
        res.status(400).json({ error: 'listingId and placeId are required' });
        return;
      }

      if (purpose !== 'listing_create' && purpose !== 'listing_update') {
        res.status(400).json({ error: 'purpose must be listing_create or listing_update' });
        return;
      }

      const authUser = getAuthenticatedUser(res);
      const ownerId = await readListingOwner(listingId);
      if (!authUser || !ownerId || (ownerId !== authUser.uid && !isAdminToken(authUser))) {
        res.status(403).json({ error: 'You cannot refresh reviews for this listing.' });
        return;
      }

      const result = await refreshGooglePlaceReviews({ listingId, placeId, purpose });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  router.get('/reviews/:listingId', async (req, res) => {
    try {
      const result = await getGooglePlaceReviewsForListing({
        listingId: req.params.listingId,
        placeId: typeof req.query.placeId === 'string' ? req.query.placeId : undefined,
        purpose: 'background'
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  return router;
};
