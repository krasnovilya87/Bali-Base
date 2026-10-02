const IMAGEKIT_DELIVERY_ORIGIN = 'https://ik.imagekit.io';
const IMAGEKIT_UPLOAD_ENDPOINT = 'https://upload.imagekit.io/api/v1/files/upload';
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;
const ALLOWED_UPLOAD_ORIGINS = new Set([
  'https://balibase.id',
  'https://www.balibase.id',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-File-Name, X-File-Type, Range, If-None-Match, If-Modified-Since'
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

  const declaredSize = Number(request.headers.get('Content-Length') || 0);
  if (declaredSize > MAX_UPLOAD_SIZE_BYTES) {
    return jsonResponse({ ok: false, error: 'Image payload is too large.' }, 413, origin);
  }

  const contentType = request.headers.get('Content-Type') || '';
  let file;
  let fileName;

  if (contentType.includes('application/json')) {
    const body = await request.json();
    if (!body?.source || typeof body.source !== 'string') {
      return jsonResponse({ ok: false, error: 'source is required' }, 400, origin);
    }
    if (body.source.length > MAX_UPLOAD_SIZE_BYTES * 1.5) {
      return jsonResponse({ ok: false, error: 'Image payload is too large.' }, 413, origin);
    }
    file = body.source;
    fileName = body.fileName || 'image';
  } else {
    const bytes = await request.arrayBuffer();
    if (!bytes.byteLength) {
      return jsonResponse({ ok: false, error: 'Image payload is empty.' }, 400, origin);
    }
    if (bytes.byteLength > MAX_UPLOAD_SIZE_BYTES) {
      return jsonResponse({ ok: false, error: 'Image payload is too large.' }, 413, origin);
    }
    const fileType = request.headers.get('X-File-Type') || 'application/octet-stream';
    fileName = decodeFileName(request.headers.get('X-File-Name'));
    file = new Blob([bytes], { type: fileType });
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
