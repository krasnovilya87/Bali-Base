import type { Router } from 'express';
import express from 'express';
import { getGooglePlaceReviewsForListing, refreshGooglePlaceReviews } from './service';
import type { GooglePlacesRequestPurpose } from './types';

export const createGooglePlacesReviewsRouter = (): Router => {
  const router = express.Router();

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
