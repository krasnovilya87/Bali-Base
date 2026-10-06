import type { Router } from 'express';
import express from 'express';
import { rateLimit, requireAuth } from '../security';

const IMAGEKIT_UPLOAD_ENDPOINT = 'https://upload.imagekit.io/api/v1/files/upload';
const DEFAULT_IMAGEKIT_URL_ENDPOINT = 'https://media.balibase.id';
const MAX_BASE64_SOURCE_LENGTH = 20 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

type ImageKitResponse = {
  fileId?: string;
  name?: string;
  url?: string;
  thumbnailUrl?: string;
  filePath?: string;
  message?: string;
  help?: string;
};

const getImageKitPrivateKey = () => {
  const envKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const cleanEnvKey = typeof envKey === 'string' ? envKey.trim() : '';

  if (!cleanEnvKey || cleanEnvKey === 'YOUR_IMAGEKIT_PRIVATE_KEY') {
    throw new Error('IMAGEKIT_PRIVATE_KEY is not configured.');
  }

  return cleanEnvKey;
};

const normalizeImageUrl = (url: string) =>
  url.startsWith('http://') ? url.replace('http://', 'https://') : url;

const buildPublicImageUrl = (imageKitUrl: string) => {
  const endpoint = (process.env.IMAGEKIT_URL_ENDPOINT || DEFAULT_IMAGEKIT_URL_ENDPOINT)
    .trim()
    .replace(/\/+$/, '');
  const sourceUrl = new URL(imageKitUrl);

  return `${endpoint}${sourceUrl.pathname}${sourceUrl.search}`;
};

const parseImageKitResponse = async (response: Response) => {
  let data: ImageKitResponse | null = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  const uploadedUrl = data?.url;
  if (response.ok && uploadedUrl) {
    return {
      url: buildPublicImageUrl(normalizeImageUrl(uploadedUrl)),
      data
    };
  }

  const message = data?.message || data?.help || response.statusText || 'Image upload failed.';
  throw new Error(message);
};

const sanitizeFileName = (value: string) => {
  const decoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();
  return decoded
    .replace(/[\\/\0\r\n]/g, '-')
    .replace(/[^A-Za-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120) || 'image';
};

const detectImageType = (buffer: Buffer) => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buffer.length >= 6 && (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')) return 'image/gif';
  return '';
};

export const createImageUploadRouter = (): Router => {
  const router = express.Router();

  router.post(
    '/imagekit',
    requireAuth,
    rateLimit({ scope: 'image-upload', windowMs: 60 * 60 * 1000, max: 30 }),
    express.raw({ type: 'application/octet-stream', limit: '15mb' }),
    async (req, res) => {
    try {
      const isBinaryUpload = Buffer.isBuffer(req.body);
      const body = isBinaryUpload ? {} : (req.body || {});
      const source = isBinaryUpload ? req.body : body.source;
      const encodedFileName = isBinaryUpload ? req.header('x-file-name') : body.fileName;
      const fileName = sanitizeFileName(encodedFileName || 'image');
      const declaredFileType = isBinaryUpload
        ? (req.header('x-file-type') || 'application/octet-stream')
        : body.fileType;

      if (!source || (!isBinaryUpload && typeof source !== 'string')) {
        res.status(400).json({ ok: false, error: 'source is required' });
        return;
      }

      if (!isBinaryUpload && source.length > MAX_BASE64_SOURCE_LENGTH) {
        res.status(413).json({ ok: false, error: 'Image payload is too large.' });
        return;
      }

      const fileBuffer = isBinaryUpload ? source : Buffer.from(source, 'base64');
      if (!fileBuffer.length || fileBuffer.length > MAX_UPLOAD_BYTES) {
        res.status(413).json({ ok: false, error: 'Image payload is too large or empty.' });
        return;
      }

      const detectedFileType = detectImageType(fileBuffer);
      if (!detectedFileType || !ALLOWED_IMAGE_TYPES.has(detectedFileType)) {
        res.status(415).json({ ok: false, error: 'Only valid JPEG, PNG, WebP, or GIF images are allowed.' });
        return;
      }
      if (declaredFileType && declaredFileType !== 'application/octet-stream' && declaredFileType !== detectedFileType) {
        res.status(415).json({ ok: false, error: 'The declared file type does not match the image content.' });
        return;
      }

      const privateKey = getImageKitPrivateKey();
      const formData = new FormData();
      formData.append('file', new Blob([fileBuffer], { type: detectedFileType }), fileName);
      formData.append('fileName', fileName || 'image');
      formData.append('useUniqueFileName', 'true');
      formData.append('folder', '/bali-base/user-uploads');

      const response = await fetch(IMAGEKIT_UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`
        },
        body: formData
      });

      const result = await parseImageKitResponse(response);
      res.json({
        ok: true,
        url: result.url,
        upstream: {
          status: response.status,
          statusText: response.statusText,
          responseType: response.headers.get('content-type') || undefined
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('ImageKit proxy upload failed', {
        fileName: req.body?.fileName,
        fileType: req.body?.fileType,
        error: message
      });
      res.status(502).json({ ok: false, error: message });
    }
  }
  );

  return router;
};
