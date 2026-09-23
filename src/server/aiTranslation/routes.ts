import type { Router } from 'express';
import express from 'express';
import { LanguageCode } from '../../i18n';
import { adminAuth } from '../firebaseAdmin';
import { translateTextWithGemini } from './service';

const LANGUAGE_CODES = new Set<LanguageCode>(['EN', 'ID', 'RU', 'FR', 'DE']);

const getBearerToken = (authorizationHeader?: string) => {
  const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
};

export const createAiTranslationRouter = (): Router => {
  const router = express.Router();

  router.post('/translate', async (req, res) => {
    try {
      const token = getBearerToken(req.headers.authorization);
      if (!token) {
        res.status(401).json({ ok: false, error: 'Sign in is required before AI translation.' });
        return;
      }

      await adminAuth.verifyIdToken(token);
      const {
        text,
        language
      }: {
        text?: string;
        language?: LanguageCode;
      } = req.body || {};

      if (!text?.trim()) {
        res.status(400).json({ error: 'text is required' });
        return;
      }

      if (!language || !LANGUAGE_CODES.has(language)) {
        res.status(400).json({ error: 'language is required' });
        return;
      }

      const result = await translateTextWithGemini(text, language);
      res.json({ ok: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes('GEMINI_API_KEY')
        ? 503
        : message.includes('Firebase') || message.includes('auth')
          ? 401
          : 500;
      res.status(status).json({ ok: false, error: message });
    }
  });

  return router;
};
