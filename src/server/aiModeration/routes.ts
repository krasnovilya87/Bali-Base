import type { Router } from 'express';
import express from 'express';
import type { Listing } from '../../types';
import { moderateListingWithGemini } from './service';

const getModerationErrorStatus = (message: string) => {
  if (message.includes('GEMINI_API_KEY')) return 503;
  if (message.includes('Gemini') || message.includes('Google')) return 502;
  return 500;
};

const getModerationErrorMessage = (status: number) => {
  if (status === 503) return 'AI moderation is not configured on the server.';
  if (status === 502) return 'AI moderation provider is temporarily unavailable.';
  return 'AI moderation could not complete.';
};

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
      const status = getModerationErrorStatus(message);
      console.error('[AI moderation] request failed:', error);
      res.status(status).json({ ok: false, error: getModerationErrorMessage(status) });
    }
  });

  return router;
};
