import { randomBytes } from 'node:crypto';
import type { Router } from 'express';
import express from 'express';
import { adminAuth, adminDb } from '../firebaseAdmin';

const COLLECTION = 'photo_upload_sessions';
const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_PHOTOS = 30;
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

type PhotoUploadPayload = {
  photoUrls: string[];
  realPhotoUrls: string[];
  photoSlotAssignments: Record<string, string[]>;
};

const isValidSessionId = (value: unknown): value is string =>
  typeof value === 'string' && SESSION_ID_PATTERN.test(value);

const isValidPhotoUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length > 2048) return false;

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

const parsePayload = (body: unknown): PhotoUploadPayload | null => {
  if (!body || typeof body !== 'object') return null;
  const candidate = body as Partial<PhotoUploadPayload>;
  if (!Array.isArray(candidate.photoUrls) || candidate.photoUrls.length < 1 || candidate.photoUrls.length > MAX_PHOTOS) return null;
  if (!candidate.photoUrls.every(isValidPhotoUrl)) return null;

  const uniquePhotoUrls = Array.from(new Set(candidate.photoUrls));
  const realPhotoUrls = Array.isArray(candidate.realPhotoUrls)
    ? Array.from(new Set(candidate.realPhotoUrls.filter(isValidPhotoUrl)))
    : uniquePhotoUrls;
  if (Array.isArray(candidate.realPhotoUrls) && candidate.realPhotoUrls.length > MAX_PHOTOS) return null;
  if (realPhotoUrls.some(url => !uniquePhotoUrls.includes(url))) return null;

  const rawAssignments = candidate.photoSlotAssignments;
  if (!rawAssignments || typeof rawAssignments !== 'object' || Array.isArray(rawAssignments)) return null;
  if (Object.keys(rawAssignments).length > MAX_PHOTOS) return null;

  const photoSlotAssignments: Record<string, string[]> = {};
  for (const [slotId, urls] of Object.entries(rawAssignments)) {
    if (!/^[a-z0-9_-]{1,64}$/.test(slotId) || !Array.isArray(urls)) return null;
    const uniqueUrls = Array.from(new Set(urls));
    if (uniqueUrls.length > MAX_PHOTOS || uniqueUrls.some(url => !uniquePhotoUrls.includes(url))) return null;
    if (uniqueUrls.length) photoSlotAssignments[slotId] = uniqueUrls;
  }

  return {
    photoUrls: uniquePhotoUrls,
    realPhotoUrls,
    photoSlotAssignments
  };
};

const getActiveSession = async (sessionId: string) => {
  const ref = adminDb.collection(COLLECTION).doc(sessionId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return { ref, data: null, expired: false };

  const data = snapshot.data() || {};
  const expiresAtMs = typeof data.expiresAtMs === 'number' ? data.expiresAtMs : 0;
  if (!expiresAtMs || expiresAtMs <= Date.now()) {
    await ref.delete().catch(() => undefined);
    return { ref, data: null, expired: true };
  }

  return { ref, data, expired: false };
};

export const createPhotoUploadSessionsRouter = (): Router => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const authorization = req.header('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    if (!token) {
      res.status(401).json({ ok: false, error: 'Sign in is required.' });
      return;
    }

    try {
      await adminAuth.verifyIdToken(token);
    } catch {
      res.status(401).json({ ok: false, error: 'Could not authorize photo upload session.' });
      return;
    }

    try {
      const sessionId = randomBytes(32).toString('base64url');
      const now = Date.now();
      await adminDb.collection(COLLECTION).doc(sessionId).set({
        status: 'pending',
        createdAtMs: now,
        expiresAtMs: now + SESSION_TTL_MS
      });
      res.status(201).json({ ok: true, sessionId, expiresAtMs: now + SESSION_TTL_MS });
    } catch (error) {
      console.error('Failed to create phone photo upload session', error);
      res.status(500).json({ ok: false, error: 'Could not create photo upload session.' });
    }
  });

  router.get('/:sessionId', async (req, res) => {
    if (!isValidSessionId(req.params.sessionId)) {
      res.status(400).json({ ok: false, error: 'Invalid photo upload session.' });
      return;
    }

    try {
      const { data, expired } = await getActiveSession(req.params.sessionId);
      if (!data) {
        res.status(expired ? 410 : 404).json({ ok: false, error: expired ? 'Photo upload session expired.' : 'Photo upload session not found.' });
        return;
      }

      res.json({
        ok: true,
        status: data.status === 'ready' ? 'ready' : 'pending',
        payload: data.status === 'ready' ? data.payload : undefined,
        expiresAtMs: data.expiresAtMs
      });
    } catch (error) {
      console.error('Failed to read phone photo upload session', error);
      res.status(500).json({ ok: false, error: 'Could not read photo upload session.' });
    }
  });

  router.put('/:sessionId', async (req, res) => {
    if (!isValidSessionId(req.params.sessionId)) {
      res.status(400).json({ ok: false, error: 'Invalid photo upload session.' });
      return;
    }

    const payload = parsePayload(req.body);
    if (!payload) {
      res.status(400).json({ ok: false, error: 'Invalid photo upload payload.' });
      return;
    }

    try {
      const { ref, data, expired } = await getActiveSession(req.params.sessionId);
      if (!data) {
        res.status(expired ? 410 : 404).json({ ok: false, error: expired ? 'Photo upload session expired.' : 'Photo upload session not found.' });
        return;
      }

      await ref.set({
        status: 'ready',
        payload,
        completedAtMs: Date.now()
      }, { merge: true });
      res.json({ ok: true });
    } catch (error) {
      console.error('Failed to complete phone photo upload session', error);
      res.status(500).json({ ok: false, error: 'Could not send photos to the computer.' });
    }
  });

  router.delete('/:sessionId', async (req, res) => {
    if (!isValidSessionId(req.params.sessionId)) {
      res.status(400).json({ ok: false, error: 'Invalid photo upload session.' });
      return;
    }

    try {
      await adminDb.collection(COLLECTION).doc(req.params.sessionId).delete();
      res.status(204).end();
    } catch (error) {
      console.error('Failed to remove phone photo upload session', error);
      res.status(500).json({ ok: false, error: 'Could not close photo upload session.' });
    }
  });

  return router;
};
