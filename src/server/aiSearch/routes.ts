import type { Router } from 'express';
import express from 'express';
import { parseAiSearchQuery } from './service';
import {
  deleteListingVector,
  readAiSearchUsageStats,
  searchListingVectors,
  trackFailedAiSearchRequest,
  trackTextAiSearchRequest,
  transcribeAudioWithGroq,
  upsertListingVector
} from './vectorService';
import { getAuthenticatedUser, isAdminToken, rateLimit, requireAdmin, requireAuth } from '../security';
import { adminDb } from '../firebaseAdmin';

const AI_SEARCH_DEBUG = process.env.AI_SEARCH_DEBUG === 'true';
const LISTING_COLLECTIONS = ['housing_for_rent_listing', 'transport_for_rent', 'listings'];

const readStoredListing = async (listingId: string) => {
  for (const collectionName of LISTING_COLLECTIONS) {
    const snapshot = await adminDb.collection(collectionName).doc(listingId).get();
    if (snapshot.exists) return snapshot.data();
  }
  return undefined;
};

const traceAiSearch = (message: string, details?: Record<string, unknown>) => {
  if (!AI_SEARCH_DEBUG) return;
  if (details) {
    console.info(message, details);
  } else {
    console.info(message);
  }
};

export const createAiSearchRouter = (): Router => {
  const router = express.Router();

  router.use(requireAuth);
  router.use(rateLimit({ scope: 'ai-search', windowMs: 10 * 60 * 1000, max: 60 }));

  router.post('/', async (req, res) => {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';

    if (!query || query.length > 240) {
      res.status(400).json({ ok: false, error: 'query is required' });
      return;
    }

    trackTextAiSearchRequest(query).catch(() => undefined);
    const intent = await parseAiSearchQuery(query);
    res.json({ ok: true, intent });
  });

  router.post('/voice', rateLimit({ scope: 'ai-voice', windowMs: 10 * 60 * 1000, max: 5 }), async (req, res) => {
    const startedAt = Date.now();
    traceAiSearch('[AI voice trace] route start', {
      contentType: req.headers['content-type'],
      bodyKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body) : []
    });
    const audio = typeof req.body?.audio === 'string' ? req.body.audio : '';
    const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType : 'audio/webm';
    const topK = Number(req.body?.topK || 10);
    traceAiSearch('[AI voice trace] route body parsed', {
      hasAudio: Boolean(audio),
      audioBase64Length: audio.length,
      mimeType,
      topK
    });

    if (!audio) {
      traceAiSearch('[AI voice trace] route response 400', { elapsedMs: Date.now() - startedAt });
      res.status(400).json({ ok: false, error: 'audio is required' });
      return;
    }

    try {
      traceAiSearch('[AI voice trace] before transcription await');
      const transcript = await transcribeAudioWithGroq({ base64Audio: audio, mimeType });
      traceAiSearch('[AI voice trace] after transcription await', {
        elapsedMs: Date.now() - startedAt,
        transcriptLength: transcript.length
      });
      let matches: Awaited<ReturnType<typeof searchListingVectors>> = [];
      let vectorFallback = false;
      try {
        traceAiSearch('[AI voice trace] before vector search await');
        matches = await searchListingVectors(transcript, topK);
        traceAiSearch('[AI voice trace] after vector search await', {
          elapsedMs: Date.now() - startedAt,
          matches: matches.length
        });
      } catch (vectorError) {
        vectorFallback = true;
        const vectorMessage = vectorError instanceof Error ? vectorError.message : 'AI vector search failed';
        trackFailedAiSearchRequest(vectorMessage).catch(() => undefined);
      }
      traceAiSearch('[AI voice trace] before response json', { elapsedMs: Date.now() - startedAt });
      res.json({
        ok: true,
        transcript,
        listingIds: matches.map(match => match.id),
        matches,
        fallback: vectorFallback
      });
      traceAiSearch('[AI voice trace] after response json', { elapsedMs: Date.now() - startedAt });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI voice search failed';
      traceAiSearch('[AI voice trace] route catch', {
        elapsedMs: Date.now() - startedAt,
        message
      });
      trackFailedAiSearchRequest(message).catch(() => undefined);
      traceAiSearch('[AI voice trace] before fallback response json', { elapsedMs: Date.now() - startedAt });
      res.json({
        ok: true,
        transcript: '',
        listingIds: [],
        matches: [],
        fallback: true,
        reason: message
      });
      traceAiSearch('[AI voice trace] after fallback response json', { elapsedMs: Date.now() - startedAt });
    }
  });

  router.post('/voice/transcribe', rateLimit({ scope: 'ai-transcribe', windowMs: 10 * 60 * 1000, max: 5 }), async (req, res) => {
    const startedAt = Date.now();
    traceAiSearch('[AI voice trace] transcribe route start', {
      contentType: req.headers['content-type'],
      bodyKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body) : []
    });
    const audio = typeof req.body?.audio === 'string' ? req.body.audio : '';
    const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType : 'audio/webm';

    if (!audio) {
      res.status(400).json({ ok: false, error: 'audio is required' });
      return;
    }

    try {
      traceAiSearch('[AI voice trace] transcribe before transcription await');
      const transcript = await transcribeAudioWithGroq({ base64Audio: audio, mimeType });
      traceAiSearch('[AI voice trace] transcribe after transcription await', {
        elapsedMs: Date.now() - startedAt,
        transcriptLength: transcript.length
      });
      res.json({ ok: true, transcript });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI voice transcription failed';
      trackFailedAiSearchRequest(message).catch(() => undefined);
      res.json({
        ok: true,
        transcript: '',
        fallback: true,
        reason: message
      });
    }
  });

  router.post('/vector-search', async (req, res) => {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    const topK = Number(req.body?.topK || 10);

    if (!query || query.length > 240) {
      res.status(400).json({ ok: false, error: 'query is required' });
      return;
    }

    try {
      trackTextAiSearchRequest(query).catch(() => undefined);
      const matches = await searchListingVectors(query, topK);
      res.json({
        ok: true,
        listingIds: matches.map(match => match.id),
        matches
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI vector search failed';
      trackFailedAiSearchRequest(message).catch(() => undefined);
      res.json({
        ok: true,
        listingIds: [],
        matches: [],
        fallback: true,
        reason: message
      });
    }
  });

  router.post('/index-listing', async (req, res) => {
    const listing = req.body?.listing;
    if (!listing?.id || typeof listing.id !== 'string' || listing.id.length > 128) {
      res.status(400).json({ ok: false, error: 'listing is required' });
      return;
    }

    const authUser = getAuthenticatedUser(res);
    const storedListing = await readStoredListing(listing.id);
    if (!authUser || !storedListing || (storedListing.ownerId !== authUser.uid && !isAdminToken(authUser))) {
      res.status(403).json({ ok: false, error: 'You cannot index this listing.' });
      return;
    }

    const listingForIndex = { ...storedListing, id: listing.id };

    try {
      const result = await upsertListingVector(listingForIndex as typeof listing);
      res.json({ ok: true, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI listing indexing failed';
      await trackFailedAiSearchRequest(message);
      res.status(502).json({ ok: false, error: message });
    }
  });

  router.post('/delete-listing', requireAdmin, async (req, res) => {
    const listingId = typeof req.body?.listingId === 'string' ? req.body.listingId.trim() : '';
    if (!listingId) {
      res.status(400).json({ ok: false, error: 'listingId is required' });
      return;
    }

    try {
      const result = await deleteListingVector(listingId);
      res.json({ ok: true, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI listing vector delete failed';
      await trackFailedAiSearchRequest(message);
      res.status(502).json({ ok: false, error: message });
    }
  });

  router.get('/stats', requireAdmin, async (_req, res) => {
    const stats = await readAiSearchUsageStats();
    res.json({ ok: true, stats });
  });

  return router;
};
