import type { Router } from 'express';
import express from 'express';
import { parseAiSearchQuery } from './service';

export const createAiSearchRouter = (): Router => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';

    if (!query) {
      res.status(400).json({ ok: false, error: 'query is required' });
      return;
    }

    const intent = await parseAiSearchQuery(query);
    res.json({ ok: true, intent });
  });

  return router;
};
