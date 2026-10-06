import { createHash } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getAppCheck } from 'firebase-admin/app-check';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb, firebaseAdminApp } from './firebaseAdmin';

type AuthenticatedResponse = Response & {
  locals: Response['locals'] & { authUser?: DecodedIdToken };
};

const bearerToken = (request: Request) => {
  const match = request.headers.authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
};

export const isAdminToken = (token?: DecodedIdToken) => Boolean(
  token?.admin === true
);

export const requireAuth: RequestHandler = async (request, response, next) => {
  const token = bearerToken(request);
  if (!token) {
    response.status(401).json({ ok: false, error: 'Authentication is required.' });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    (response as AuthenticatedResponse).locals.authUser = decoded;
    next();
  } catch {
    response.status(401).json({ ok: false, error: 'The authentication token is invalid or expired.' });
  }
};

const shouldEnforceAppCheck = () => process.env.APP_CHECK_ENFORCEMENT
  ? process.env.APP_CHECK_ENFORCEMENT === 'true'
  : process.env.NODE_ENV === 'production';

export const requireAppCheck: RequestHandler = async (request, response, next) => {
  const token = request.header('X-Firebase-AppCheck') || '';
  if (!token) {
    if (shouldEnforceAppCheck()) {
      response.status(401).json({ ok: false, error: 'Firebase App Check is required.' });
      return;
    }
    next();
    return;
  }

  try {
    await getAppCheck(firebaseAdminApp).verifyToken(token);
    next();
  } catch {
    response.status(401).json({ ok: false, error: 'The Firebase App Check token is invalid or expired.' });
  }
};

export const requireAdmin: RequestHandler = (request, response, next) => {
  const token = (response as AuthenticatedResponse).locals.authUser;
  if (!isAdminToken(token)) {
    response.status(403).json({ ok: false, error: 'Administrator access is required.' });
    return;
  }
  next();
};

type RateLimitOptions = {
  windowMs: number;
  max: number;
  scope: string;
};

type RateLimitEntry = { count: number; resetAt: number };
const rateLimitEntries = new Map<string, RateLimitEntry>();

const useDurableRateLimits = () => process.env.DURABLE_RATE_LIMITING_ENABLED
  ? process.env.DURABLE_RATE_LIMITING_ENABLED === 'true'
  : process.env.NODE_ENV === 'production';

const consumeMemoryRateLimit = (key: string, now: number, windowMs: number) => {
  const current = rateLimitEntries.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;
  entry.count += 1;
  rateLimitEntries.set(key, entry);

  if (rateLimitEntries.size > 10_000) {
    for (const [storedKey, storedEntry] of rateLimitEntries) {
      if (storedEntry.resetAt <= now) rateLimitEntries.delete(storedKey);
    }
  }

  return entry;
};

const consumeDurableRateLimit = async (key: string, scope: string, now: number, windowMs: number) => {
  const documentId = createHash('sha256').update(key).digest('hex');
  const reference = adminDb.collection('api_rate_limits').doc(documentId);

  return adminDb.runTransaction(async transaction => {
    const snapshot = await transaction.get(reference);
    const current = snapshot.data() as { count?: number; resetAt?: number } | undefined;
    const resetAt = !current?.resetAt || current.resetAt <= now
      ? now + windowMs
      : current.resetAt;
    const count = resetAt === current?.resetAt ? Number(current?.count || 0) + 1 : 1;

    transaction.set(reference, {
      count,
      resetAt,
      scope,
      expiresAt: Timestamp.fromMillis(resetAt + windowMs)
    });

    return { count, resetAt };
  });
};

export const rateLimit = ({ windowMs, max, scope }: RateLimitOptions): RequestHandler => (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const consume = async () => {
    const now = Date.now();
    const userId = (response as AuthenticatedResponse).locals.authUser?.uid;
    const remoteAddress = request.socket.remoteAddress || 'unknown';
    const key = `${scope}:${userId || remoteAddress}`;
    const entry = useDurableRateLimits()
      ? await consumeDurableRateLimit(key, scope, now, windowMs)
      : consumeMemoryRateLimit(key, now, windowMs);

    response.setHeader('RateLimit-Limit', String(max));
    response.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    response.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      response.status(429).json({ ok: false, error: 'Too many requests. Try again later.' });
      return;
    }

    next();
  };

  consume().catch(error => {
    console.error(`[Rate limit] ${scope} failed:`, error);
    response.status(503).json({ ok: false, error: 'Request protection is temporarily unavailable.' });
  });
};

export const getAuthenticatedUser = (response: Response) =>
  (response as AuthenticatedResponse).locals.authUser;
