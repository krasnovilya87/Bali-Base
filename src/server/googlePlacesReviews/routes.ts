import type { Router } from 'express';
import express from 'express';
import { getGooglePlaceReviewsForListing, refreshGooglePlaceReviews } from './service';
import type { GooglePlacesRequestPurpose } from './types';

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

export const createGooglePlacesReviewsRouter = (): Router => {
  const router = express.Router();

  router.post('/maps-link/resolve', async (req, res) => {
    try {
      const { url }: { url?: string } = req.body || {};
      const rawUrl = String(url || '').trim();

      if (!rawUrl || !isAllowedGoogleMapsUrl(rawUrl)) {
        res.status(400).json({ error: 'A Google Maps URL is required' });
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(rawUrl, {
        redirect: 'follow',
        signal: controller.signal
      });
      clearTimeout(timeout);

      const resolvedUrl = response.url || rawUrl;
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

      if (!listingId || !placeId) {
        res.status(400).json({ error: 'listingId and placeId are required' });
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
