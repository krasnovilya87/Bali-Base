import type { Router } from 'express';
import express from 'express';
import type { Listing } from '../../types';
import { getAuthenticatedUser, rateLimit, requireAuth } from '../security';
import { assertAiModerationQuota } from './limits';
import { moderateListingWithGemini } from './service';

const MAX_MODERATION_PAYLOAD_BYTES = 128 * 1024;
const MAX_LISTING_TITLE_LENGTH = 240;
const MAX_LISTING_DESCRIPTION_LENGTH = 20_000;

const getModerationErrorStatus = (message: string) => {
  if (message.includes('Authorization')) return 401;
  if (message.includes('Sign in')) return 401;
  if (message.includes('Firebase') || message.includes('auth')) return 401;
  if (message.includes('429')) return 429;
  if (message.includes('daily') || message.includes('already checked')) return 429;
  if (message.includes('GEMINI_API_KEY')) return 503;
  if (message.includes('Gemini') || message.includes('Google')) return 502;
  return 500;
};

const getModerationErrorMessage = (status: number) => {
  if (status === 401) return 'Sign in is required before AI moderation.';
  if (status === 429) return 'AI moderation limit reached. Review manually.';
  if (status === 503) return 'AI moderation is not configured on the server.';
  if (status === 502) return 'AI moderation provider is temporarily unavailable.';
  return 'AI moderation could not complete.';
};

export const createAiModerationRouter = (): Router => {
  const router = express.Router();

  router.post('/moderate-listing', requireAuth, rateLimit({ scope: 'ai-moderation', windowMs: 60 * 60 * 1000, max: 20 }), async (req, res) => {
    try {
      const decodedToken = getAuthenticatedUser(res);
      if (!decodedToken) throw new Error('Sign in is required.');
      const listing = req.body?.listing as Listing | undefined;

      if (!listing || typeof listing !== 'object') {
        res.status(400).json({ ok: false, error: 'listing is required' });
        return;
      }

      if (!listing.title?.trim() || !listing.category) {
        res.status(400).json({ ok: false, error: 'listing title and category are required' });
        return;
      }

      if (
        listing.title.length > MAX_LISTING_TITLE_LENGTH ||
        (typeof listing.description === 'string' && listing.description.length > MAX_LISTING_DESCRIPTION_LENGTH) ||
        Buffer.byteLength(JSON.stringify(listing), 'utf8') > MAX_MODERATION_PAYLOAD_BYTES
      ) {
        res.status(413).json({ ok: false, error: 'listing payload is too large' });
        return;
      }

      const listingId = typeof listing.id === 'string' && listing.id.trim()
        ? listing.id
        : `${decodedToken.uid}_${listing.title.trim()}_${listing.category}`;
      await assertAiModerationQuota(decodedToken.uid, listingId);
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
