const IMAGEKIT_DELIVERY_ORIGIN = 'https://ik.imagekit.io';
const IMAGEKIT_UPLOAD_ENDPOINT = 'https://upload.imagekit.io/api/v1/files/upload';
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;
const UPLOADS_PER_USER_PER_HOUR = 30;
const uploadRateLimits = new Map();
let appCheckJwksCache = { expiresAt: 0, keys: [] };
const ALLOWED_UPLOAD_ORIGINS = new Set([
  'https://balibase.id',
  'https://www.balibase.id',
  'https://bali-base-90ca8.web.app',
  'https://bali-base-90ca8.firebaseapp.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Firebase-AppCheck, X-File-Name, X-File-Type, Range, If-None-Match, If-Modified-Since'
};

const jsonResponse = (payload, status, origin = '*') => new Response(JSON.stringify(payload), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders,
    'Access-Control-Allow-Origin': origin
  }
});

const getUploadOrigin = (request) => {
  const origin = request.headers.get('Origin');
  return origin && ALLOWED_UPLOAD_ORIGINS.has(origin) ? origin : null;
};

const decodeFileName = (value) => {
  if (!value) return 'image';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const sanitizeFileName = (value) => decodeFileName(value)
  .replace(/[\\/\0\r\n]/g, '-')
  .replace(/[^A-Za-z0-9._-]/g, '-')
  .replace(/-+/g, '-')
  .slice(0, 120) || 'image';

const detectImageType = (bytes) => {
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value)) return 'image/png';
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (bytes.length >= 6 && (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a')) return 'image/gif';
  return '';
};

const decodeBase64Prefix = (source) => {
  const cleanSource = source.includes(',') ? source.slice(source.indexOf(',') + 1) : source;
  let decoded;
  try {
    decoded = atob(cleanSource.slice(0, 24));
  } catch {
    return null;
  }
  return {
    cleanSource,
    bytes: Uint8Array.from(decoded, character => character.charCodeAt(0))
  };
};

const decodeBase64Url = (value) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
};

const decodeJwtPart = (value) => JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));

const getAppCheckJwks = async () => {
  const now = Date.now();
  if (appCheckJwksCache.expiresAt > now && appCheckJwksCache.keys.length) {
    return appCheckJwksCache.keys;
  }

  const response = await fetch('https://firebaseappcheck.googleapis.com/v1/jwks');
  if (!response.ok) throw new Error('Could not load Firebase App Check public keys.');
  const payload = await response.json();
  const keys = Array.isArray(payload?.keys) ? payload.keys : [];
  if (!keys.length) throw new Error('Firebase App Check returned no public keys.');
  appCheckJwksCache = { expiresAt: now + 6 * 60 * 60 * 1000, keys };
  return keys;
};

const verifyAppCheckToken = async (request, env) => {
  const token = request.headers.get('X-Firebase-AppCheck') || '';
  if (!token || !env.FIREBASE_PROJECT_NUMBER || !env.FIREBASE_APP_ID) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = decodeJwtPart(encodedHeader);
    const payload = decodeJwtPart(encodedPayload);
    if (header.alg !== 'RS256' || header.typ !== 'JWT' || typeof header.kid !== 'string') return false;

    const jwks = await getAppCheckJwks();
    const jwk = jwks.find(key => key.kid === header.kid && key.alg === 'RS256');
    if (!jwk) return false;
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    );
    const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const nowSeconds = Math.floor(Date.now() / 1000);

    return verified &&
      payload.iss === `https://firebaseappcheck.googleapis.com/${env.FIREBASE_PROJECT_NUMBER}` &&
      audience.includes(`projects/${env.FIREBASE_PROJECT_NUMBER}`) &&
      payload.sub === env.FIREBASE_APP_ID &&
      Number(payload.exp) > nowSeconds;
  } catch {
    return false;
  }
};

const verifyFirebaseUser = async (request, env) => {
  const match = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1] || !env.FIREBASE_WEB_API_KEY) return null;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_WEB_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: match[1] })
    }
  );
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  return payload?.users?.[0]?.localId || null;
};

const consumeUploadQuota = async (userId, env) => {
  if (env.UPLOAD_RATE_LIMITER?.limit) {
    const result = await env.UPLOAD_RATE_LIMITER.limit({ key: userId });
    if (!result.success) return false;
  }

  const now = Date.now();
  const current = uploadRateLimits.get(userId);
  const entry = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + 60 * 60 * 1000 }
    : current;
  entry.count += 1;
  uploadRateLimits.set(userId, entry);
  return entry.count <= UPLOADS_PER_USER_PER_HOUR;
};

const buildPublicImageUrl = (imageKitUrl, incomingUrl) => {
  const sourceUrl = new URL(imageKitUrl);
  return `${incomingUrl.origin}${sourceUrl.pathname}${sourceUrl.search}`;
};

const uploadImage = async (request, env, incomingUrl) => {
  const origin = getUploadOrigin(request);
  if (!origin) {
    return jsonResponse({ ok: false, error: 'Upload origin is not allowed.' }, 403);
  }

  if (!env.IMAGEKIT_PRIVATE_KEY) {
    return jsonResponse({ ok: false, error: 'ImageKit is not configured.' }, 503, origin);
  }

  if (!await verifyAppCheckToken(request, env)) {
    return jsonResponse({ ok: false, error: 'Firebase App Check is required.' }, 401, origin);
  }

  const userId = await verifyFirebaseUser(request, env);
  if (!userId) {
    return jsonResponse({ ok: false, error: 'Authentication is required.' }, 401, origin);
  }
  if (!await consumeUploadQuota(userId, env)) {
    return jsonResponse({ ok: false, error: 'Upload limit reached. Try again later.' }, 429, origin);
  }

  const declaredSize = Number(request.headers.get('Content-Length') || 0);
  if (declaredSize > MAX_UPLOAD_SIZE_BYTES) {
    return jsonResponse({ ok: false, error: 'Image payload is too large.' }, 413, origin);
  }

  const contentType = request.headers.get('Content-Type') || '';
  let file;
  let fileName;
  let detectedFileType;
  let declaredFileType = '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    if (!body?.source || typeof body.source !== 'string') {
      return jsonResponse({ ok: false, error: 'source is required' }, 400, origin);
    }
    if (body.source.length > Math.ceil(MAX_UPLOAD_SIZE_BYTES * 4 / 3) + 4) {
      return jsonResponse({ ok: false, error: 'Image payload is too large.' }, 413, origin);
    }
    const decoded = decodeBase64Prefix(body.source);
    if (!decoded) {
      return jsonResponse({ ok: false, error: 'source must contain valid base64 image data.' }, 400, origin);
    }
    detectedFileType = detectImageType(decoded.bytes);
    declaredFileType = typeof body.fileType === 'string' ? body.fileType : '';
    file = decoded.cleanSource;
    fileName = sanitizeFileName(body.fileName || 'image');
  } else {
    const bytes = await request.arrayBuffer();
    if (!bytes.byteLength) {
      return jsonResponse({ ok: false, error: 'Image payload is empty.' }, 400, origin);
    }
    if (bytes.byteLength > MAX_UPLOAD_SIZE_BYTES) {
      return jsonResponse({ ok: false, error: 'Image payload is too large.' }, 413, origin);
    }
    detectedFileType = detectImageType(new Uint8Array(bytes.slice(0, 16)));
    declaredFileType = request.headers.get('X-File-Type') || '';
    fileName = sanitizeFileName(request.headers.get('X-File-Name'));
    file = new Blob([bytes], { type: detectedFileType || 'application/octet-stream' });
  }

  if (!detectedFileType) {
    return jsonResponse({ ok: false, error: 'Only valid JPEG, PNG, WebP, or GIF images are allowed.' }, 415, origin);
  }

  if (declaredFileType && declaredFileType !== 'application/octet-stream' && declaredFileType !== detectedFileType) {
    return jsonResponse({ ok: false, error: 'The declared file type does not match the image content.' }, 415, origin);
  }

  const formData = new FormData();
  if (typeof file === 'string') {
    formData.append('file', file);
  } else {
    formData.append('file', file, fileName);
  }
  formData.append('fileName', fileName);
  formData.append('useUniqueFileName', 'true');
  formData.append('folder', '/bali-base/user-uploads');

  const upstreamResponse = await fetch(IMAGEKIT_UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${env.IMAGEKIT_PRIVATE_KEY}:`)}`
    },
    body: formData
  });
  const data = await upstreamResponse.json().catch(() => null);

  if (!upstreamResponse.ok || !data?.url) {
    return jsonResponse({
      ok: false,
      error: data?.message || data?.help || upstreamResponse.statusText || 'Image upload failed.'
    }, upstreamResponse.status || 502, origin);
  }

  return jsonResponse({
    ok: true,
    url: buildPublicImageUrl(data.url, incomingUrl)
  }, 200, origin);
};

const withCorsHeaders = (response) => {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([name, value]) => headers.set(name, value));
  headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

  if (response.ok) {
    headers.set('Cache-Control', IMMUTABLE_CACHE_CONTROL);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

export default {
  async fetch(request, env) {
    const incomingUrl = new URL(request.url);

    if (request.method === 'OPTIONS') {
      const origin = getUploadOrigin(request);
      if (incomingUrl.pathname === '/upload' && !origin) {
        return jsonResponse({ ok: false, error: 'Origin is not allowed.' }, 403);
      }
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Origin': origin || '*'
        }
      });
    }

    if (incomingUrl.pathname === '/upload' && request.method === 'POST') {
      return uploadImage(request, env, incomingUrl);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed.', {
        status: 405,
        headers: {
          Allow: 'GET, HEAD, OPTIONS',
          ...corsHeaders
        }
      });
    }

    const upstreamUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, IMAGEKIT_DELIVERY_ORIGIN);
    const upstreamHeaders = new Headers();

    for (const headerName of ['Accept', 'Accept-Encoding', 'Range', 'If-None-Match', 'If-Modified-Since']) {
      const value = request.headers.get(headerName);
      if (value) upstreamHeaders.set(headerName, value);
    }

    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: upstreamHeaders,
      redirect: 'follow',
      cf: {
        cacheEverything: true,
        cacheTtl: 31_536_000
      }
    });

    return withCorsHeaders(upstreamResponse);
  }
};
