import './env';
import express from 'express';
import { createAiModerationRouter } from './aiModeration';
import { createAiTranslationRouter } from './aiTranslation';
import { createGooglePlacesReviewsRouter } from './googlePlacesReviews';

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json({ limit: '1mb' }));
app.use('/api/ai', createAiTranslationRouter());
app.use('/api/ai', createAiModerationRouter());
app.use('/api/google-places', createGooglePlacesReviewsRouter());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Bali Base API server is listening on :${port}`);
});
