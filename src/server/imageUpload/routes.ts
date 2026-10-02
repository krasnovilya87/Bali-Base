import type { Router } from 'express';
import express from 'express';

const IMAGEKIT_UPLOAD_ENDPOINT = 'https://upload.imagekit.io/api/v1/files/upload';
const DEFAULT_IMAGEKIT_URL_ENDPOINT = 'https://media.balibase.id';
const MAX_BASE64_SOURCE_LENGTH = 20 * 1024 * 1024;

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

export const createImageUploadRouter = (): Router => {
  const router = express.Router();

  router.post('/imagekit', express.raw({ type: 'application/octet-stream', limit: '15mb' }), async (req, res) => {
    try {
      const isBinaryUpload = Buffer.isBuffer(req.body);
      const body = isBinaryUpload ? {} : (req.body || {});
      const source = isBinaryUpload ? req.body : body.source;
      const encodedFileName = isBinaryUpload ? req.header('x-file-name') : body.fileName;
      const fileName = encodedFileName
        ? decodeURIComponent(encodedFileName)
        : 'image';
      const fileType = isBinaryUpload
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

      const privateKey = getImageKitPrivateKey();
      const formData = new FormData();
      if (isBinaryUpload) {
        formData.append('file', new Blob([source], { type: fileType }), fileName);
      } else {
        formData.append('file', source);
      }
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
  });

  return router;
};
