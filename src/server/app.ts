import './env';
import express from 'express';
import { createAiSearchRouter } from './aiSearch';
import { createAiModerationRouter } from './aiModeration';
import { createAiTranslationRouter } from './aiTranslation';
import { createGooglePlacesReviewsRouter } from './googlePlacesReviews';
import { createImageUploadRouter } from './imageUpload';
import { createPhotoUploadSessionsRouter } from './photoUploadSessions';

const app = express();
const port = Number(process.env.PORT || 3001);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

app.use(express.json({ limit: '25mb' }));
app.use('/api/ai-search', createAiSearchRouter());
app.use('/api/ai', createAiTranslationRouter());
app.use('/api/ai', createAiModerationRouter());
app.use('/api/google-places', createGooglePlacesReviewsRouter());
app.use('/api/image-upload', createImageUploadRouter());
app.use('/api/photo-upload-sessions', createPhotoUploadSessionsRouter());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Bali Base API server is listening on :${port}`);
});
