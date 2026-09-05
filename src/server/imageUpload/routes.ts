import type { Router } from 'express';
import express from 'express';

const FREEIMAGE_UPLOAD_ENDPOINT = 'https://freeimage.host/api/1/upload';
const DEFAULT_FREEIMAGE_API_KEY = '6d207e02198a847aa98d0a2a901485a5';
const MAX_BASE64_SOURCE_LENGTH = 20 * 1024 * 1024;

type FreeImageHostResponse = {
  status_code?: number;
  status_txt?: string;
  image?: {
    url?: string;
  };
  error?: {
    message?: string;
  };
};

const getFreeImageApiKeys = () => {
  const envKey = process.env.VITE_FREEIMAGE_API_KEY || process.env.FREEIMAGE_API_KEY;
  const cleanEnvKey = typeof envKey === 'string' ? envKey.trim() : '';

  if (!cleanEnvKey || cleanEnvKey === 'YOUR_FREEIMAGE_API_KEY') {
    return [DEFAULT_FREEIMAGE_API_KEY];
  }

  return cleanEnvKey === DEFAULT_FREEIMAGE_API_KEY
    ? [DEFAULT_FREEIMAGE_API_KEY]
    : [cleanEnvKey, DEFAULT_FREEIMAGE_API_KEY];
};

const normalizeImageUrl = (url: string) =>
  url.startsWith('http://') ? url.replace('http://', 'https://') : url;

const parseFreeImageResponse = async (response: Response) => {
  let data: FreeImageHostResponse | null = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // display_url is Free Image Host's medium (500px) rendition, not the
  // original upload. Persist only the direct original URL.
  const uploadedUrl = data?.image?.url;
  if (response.ok && uploadedUrl) {
    return {
      url: normalizeImageUrl(uploadedUrl),
      data
    };
  }

  const message = data?.error?.message || data?.status_txt || response.statusText || 'Image upload failed.';
  throw new Error(message);
};

export const createImageUploadRouter = (): Router => {
  const router = express.Router();

  router.post('/freeimage', async (req, res) => {
    try {
      const {
        source,
        fileName,
        fileType
      }: {
        source?: string;
        fileName?: string;
        fileType?: string;
      } = req.body || {};

      if (!source || typeof source !== 'string') {
        res.status(400).json({ ok: false, error: 'source is required' });
        return;
      }

      if (source.length > MAX_BASE64_SOURCE_LENGTH) {
        res.status(413).json({ ok: false, error: 'Image payload is too large.' });
        return;
      }

      let lastError: unknown = null;
      for (const apiKey of getFreeImageApiKeys()) {
        try {
          const formData = new FormData();
          formData.append('key', apiKey);
          formData.append('action', 'upload');
          formData.append('format', 'json');
          formData.append('source', source);

          const response = await fetch(FREEIMAGE_UPLOAD_ENDPOINT, {
            method: 'POST',
            body: formData
          });

          const result = await parseFreeImageResponse(response);
          res.json({
            ok: true,
            url: result.url,
            upstream: {
              status: response.status,
              statusText: response.statusText,
              responseType: response.headers.get('content-type') || undefined
            }
          });
          return;
        } catch (error) {
          lastError = error;
          const message = error instanceof Error ? error.message : String(error);
          if (!message.toLowerCase().includes('invalid api v1 key')) {
            break;
          }
        }
      }

      throw lastError instanceof Error ? lastError : new Error(String(lastError || 'Image upload failed.'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('freeimage.host proxy upload failed', {
        fileName: req.body?.fileName,
        fileType: req.body?.fileType,
        error: message
      });
      res.status(502).json({ ok: false, error: message });
    }
  });

  return router;
};
