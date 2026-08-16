import type { Router } from 'express';
import express from 'express';
import type { Listing } from '../../types';
import { moderateListingWithGemini } from './service';

export const createAiModerationRouter = (): Router => {
  const router = express.Router();

  router.post('/moderate-listing', async (req, res) => {
    try {
      const listing = req.body?.listing as Listing | undefined;

      if (!listing || typeof listing !== 'object') {
        res.status(400).json({ ok: false, error: 'listing is required' });
        return;
      }

      if (!listing.title?.trim() || !listing.category) {
        res.status(400).json({ ok: false, error: 'listing title and category are required' });
        return;
      }

      const result = await moderateListingWithGemini(listing);
      res.json({ ok: true, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      res.status(status).json({ ok: false, error: message });
    }
  });

  return router;
};
