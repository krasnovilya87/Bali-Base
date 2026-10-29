import express, { type Router } from 'express';
import { rateLimit, requireAdmin, requireAuth } from '../security';
import { addChannel, getStatus, removeChannel, startImport } from './service';

export const createTelegramImportRouter = (): Router => {
  const router = express.Router();
  router.use(requireAuth, requireAdmin);
  const writeLimit = rateLimit({ scope: 'admin-telegram-import', windowMs: 10 * 60 * 1000, max: 60 });

  router.get('/', async (_req, res) => {
    res.json({ ok: true, ...(await getStatus()) });
  });

  router.post('/channels', writeLimit, async (req, res) => {
    try {
      const channels = await addChannel(typeof req.body?.channel === 'string' ? req.body.channel : '');
      res.json({ ok: true, channels });
    } catch (error: any) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.delete('/channels/:channel', writeLimit, async (req, res) => {
    res.json({ ok: true, channels: await removeChannel(req.params.channel) });
  });

  router.post('/run', writeLimit, async (_req, res) => {
    try {
      const started = await startImport();
      res.status(started ? 202 : 409).json(started ? { ok: true } : { ok: false, error: 'Import is already running.' });
    } catch (error: any) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  return router;
};
