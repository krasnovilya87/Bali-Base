import type { Router } from 'express';
import express from 'express';
import { LanguageCode } from '../../i18n';
import { translateTextWithGemini } from './service';

const LANGUAGE_CODES = new Set<LanguageCode>(['EN', 'ID', 'RU', 'FR', 'DE']);

export const createAiTranslationRouter = (): Router => {
  const router = express.Router();

  router.post('/translate', async (req, res) => {
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

      if (!language || !LANGUAGE_CODES.has(language)) {
        res.status(400).json({ error: 'language is required' });
        return;
      }

      const result = await translateTextWithGemini(text, language);
      res.json({ ok: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      res.status(status).json({ ok: false, error: message });
    }
  });

  return router;
};
