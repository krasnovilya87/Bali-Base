const IMAGEKIT_WORKER_UPLOAD_ENDPOINT = 'https://media.balibase.id/upload';

type ImageKitProxyResponse = {
  ok?: boolean;
  url?: string;
  error?: string;
  upstream?: {
    status?: number;
    statusText?: string;
    responseType?: string;
  };
};

export type ImageUploadDiagnosticStep = {
  phase: string;
  ok: boolean;
  status?: number;
  statusText?: string;
  message?: string;
  responseType?: string;
};

export class ImageUploadError extends Error {
  diagnostics: ImageUploadDiagnosticStep[];

  constructor(message: string, diagnostics: ImageUploadDiagnosticStep[]) {
    super(message);
    this.name = 'ImageUploadError';
    this.diagnostics = diagnostics;
  }
}

const normalizeImageUrl = (url: string) =>
  url.startsWith('http://') ? url.replace('http://', 'https://') : url;

type ImageDimensions = {
  width: number;
  height: number;
};

const getBlobImageDimensions = async (blob: Blob): Promise<ImageDimensions | null> => {
  try {
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  } catch {
    return null;
  }
};

const getRemoteImageDimensions = (url: string) =>
  new Promise<ImageDimensions>((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      image.src = '';
      reject(new Error('Uploaded image verification timed out.'));
    }, 15_000);

    image.onload = () => {
      window.clearTimeout(timeout);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('Uploaded image could not be verified.'));
    };
    image.src = `${url}${url.includes('?') ? '&' : '?'}verify=${Date.now()}`;
  });

const verifyUploadedImage = async (
  url: string,
  expectedDimensions: ImageDimensions | null
) => {
  if (!expectedDimensions) {
    return url;
  }

  const actualDimensions = await getRemoteImageDimensions(url);
  const expectedSides = [expectedDimensions.width, expectedDimensions.height].sort((a, b) => a - b);
  const actualSides = [actualDimensions.width, actualDimensions.height].sort((a, b) => a - b);

  if (actualSides[0] < expectedSides[0] || actualSides[1] < expectedSides[1]) {
    throw new Error(
      `Uploaded image quality check failed: expected ${expectedDimensions.width}x${expectedDimensions.height}, received ${actualDimensions.width}x${actualDimensions.height}.`
    );
  }

  return url;
};

const blobToBase64Source = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const commaIndex = result.indexOf(',');
      resolve(commaIndex === -1 ? result : result.slice(commaIndex + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const uploadBinarySourceViaProxy = async (
  source: Blob,
  diagnostics: ImageUploadDiagnosticStep[],
  metadata?: { fileName?: string; fileType?: string }
) => {
  const phase = 'binary-proxy-upload';
  let response: Response;

  try {
    response = await fetch(IMAGEKIT_WORKER_UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-File-Name': encodeURIComponent(metadata?.fileName || 'image'),
        'X-File-Type': metadata?.fileType || source.type || 'application/octet-stream'
      },
      body: source
    });
  } catch (error) {
    diagnostics.push({ phase, ok: false, message: getErrorMessage(error) });
    throw error;
  }

  const responseType = response.headers.get('content-type') || undefined;
  let data: ImageKitProxyResponse | null = null;
  try {
    data = responseType?.includes('application/json') ? await response.json() : null;
  } catch {
    data = null;
  }

  if (response.ok && data?.url) {
    diagnostics.push({
      phase,
      ok: true,
      status: response.status,
      statusText: response.statusText,
      responseType
    });
    return normalizeImageUrl(data.url);
  }

  const message = data?.error || response.statusText || 'Image upload failed.';
  diagnostics.push({
    phase,
    ok: false,
    status: response.status,
    statusText: response.statusText,
    responseType,
    message
  });
  throw new Error(message);
};

const uploadBase64SourceViaProxy = async (
  source: string,
  diagnostics: ImageUploadDiagnosticStep[],
  metadata?: { fileName?: string; fileType?: string },
  endpoint = IMAGEKIT_WORKER_UPLOAD_ENDPOINT,
  phase = 'proxy-upload'
) => {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source,
        fileName: metadata?.fileName,
        fileType: metadata?.fileType
      })
    });
  } catch (error) {
    diagnostics.push({
      phase,
      ok: false,
      message: getErrorMessage(error)
    });
    throw error;
  }

  let data: ImageKitProxyResponse | null = null;
  const responseType = response.headers.get('content-type') || undefined;
  try {
    data = responseType?.includes('application/json')
      ? await response.json()
      : null;
  } catch {
    data = null;
  }

  if (response.ok && data?.url) {
    diagnostics.push({
      phase,
      ok: true,
      status: response.status,
      statusText: response.statusText,
      responseType
    });
    return normalizeImageUrl(data.url);
  }

  const message = data?.error || (
    responseType?.includes('text/html') ? 'Proxy returned HTML instead of JSON.' : response.statusText
  ) || 'Image upload failed.';
  diagnostics.push({
    phase,
    ok: false,
    status: response.status,
    statusText: response.statusText,
    responseType,
    message
  });
  throw new Error(message);
};

export const uploadImageToImageKit = async (
  image: Blob,
  metadata?: { fileName?: string; fileType?: string }
): Promise<string> => {
  const diagnostics: ImageUploadDiagnosticStep[] = [];
  let finalError: unknown = null;
  const expectedDimensions = await getBlobImageDimensions(image);

  const tryVerifiedUpload = async (upload: () => Promise<string>) => {
    const url = await upload();
    return verifyUploadedImage(url, expectedDimensions);
  };

  try {
    return await tryVerifiedUpload(() =>
      uploadBinarySourceViaProxy(image, diagnostics, metadata)
    );
  } catch (binaryProxyError) {
    finalError = binaryProxyError;
  }

  try {
    const base64Source = await blobToBase64Source(image);
    diagnostics.push({
      phase: 'base64-conversion',
      ok: true,
      message: `${Math.round(base64Source.length / 1024)} KB base64 payload`
    });
    try {
      return await tryVerifiedUpload(() =>
        uploadBase64SourceViaProxy(base64Source, diagnostics, metadata)
      );
    } catch (proxyError) {
      finalError = proxyError;
    }
  } catch (proxyError) {
    finalError = proxyError;
  }

  throw new ImageUploadError(getErrorMessage(finalError), diagnostics);
};
