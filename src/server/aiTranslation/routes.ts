import type { Router } from 'express';
import express from 'express';
import { LanguageCode } from '../../i18n';
import { rateLimit, requireAuth } from '../security';
import { translateTextWithGemini } from './service';

const LANGUAGE_CODES = new Set<LanguageCode>(['EN', 'ID', 'RU', 'FR', 'DE']);
const MAX_TRANSLATION_TEXT_LENGTH = 5_000;

export const createAiTranslationRouter = (): Router => {
  const router = express.Router();

  router.post('/translate', requireAuth, rateLimit({ scope: 'ai-translation', windowMs: 60 * 60 * 1000, max: 30 }), async (req, res) => {
    try {
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

      if (text.length > MAX_TRANSLATION_TEXT_LENGTH) {
        res.status(413).json({ error: `text must not exceed ${MAX_TRANSLATION_TEXT_LENGTH} characters` });
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
