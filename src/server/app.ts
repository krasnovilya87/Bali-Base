import './env';
import express from 'express';
import { createAiSearchRouter } from './aiSearch';
import { createAiModerationRouter } from './aiModeration';
import { createAiTranslationRouter } from './aiTranslation';
import { createGooglePlacesReviewsRouter } from './googlePlacesReviews';
import { createImageUploadRouter } from './imageUpload';
import { createAdminRouter } from './admin';
import { requireAppCheck } from './security';

const app = express();
const port = Number(process.env.PORT || 3001);
const allowedOrigins = new Set([
  'https://balibase.id',
  'https://www.balibase.id',
  ...(process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:3000', 'http://127.0.0.1:3000'])
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Firebase-AppCheck, X-File-Name, X-File-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(self)');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

  if (origin && !allowedOrigins.has(origin)) {
    res.status(403).json({ ok: false, error: 'Origin is not allowed.' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

app.use(express.json({ limit: '25mb' }));
app.use('/api/ai-search', requireAppCheck, createAiSearchRouter());
app.use('/api/ai', requireAppCheck, createAiTranslationRouter(), createAiModerationRouter());
app.use('/api/google-places', requireAppCheck, createGooglePlacesReviewsRouter());
app.use('/api/image-upload', requireAppCheck, createImageUploadRouter());
app.use('/api/admin', requireAppCheck, createAdminRouter());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Bali Base API server is listening on :${port}`);
});
