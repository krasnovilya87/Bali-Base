const FREEIMAGE_UPLOAD_ENDPOINT = 'https://freeimage.host/api/1/upload';
const FREEIMAGE_PROXY_ENDPOINT = '/api/image-upload/freeimage';
const FREEIMAGE_CLOUD_RUN_PROXY_ENDPOINT =
  'https://bali-base-api-516937970438.asia-southeast1.run.app/api/image-upload/freeimage';
const DEFAULT_FREEIMAGE_API_KEY = '6d207e02198a847aa98d0a2a901485a5';

type FreeImageHostResponse = {
  status_code?: number;
  status_txt?: string;
  image?: {
    url?: string;
    display_url?: string;
  };
  error?: {
    message?: string;
  };
};

type FreeImageProxyResponse = {
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

const getFreeImageApiKey = () => {
  const envKey = (import.meta as any).env?.VITE_FREEIMAGE_API_KEY;
  const cleanEnvKey = typeof envKey === 'string' ? envKey.trim() : '';

  return cleanEnvKey && cleanEnvKey !== 'YOUR_FREEIMAGE_API_KEY'
    ? cleanEnvKey
    : DEFAULT_FREEIMAGE_API_KEY;
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

  const uploadedUrl = data?.image?.url || data?.image?.display_url;
  if (response.ok && uploadedUrl) {
    return normalizeImageUrl(uploadedUrl);
  }

  const message = data?.error?.message || data?.status_txt || response.statusText || 'Image upload failed.';
  throw new Error(message);
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

const uploadSourceToFreeImageHost = async (
  source: Blob | string,
  phase: string,
  diagnostics: ImageUploadDiagnosticStep[]
) => {
  const apiKey = getFreeImageApiKey();
  const formData = new FormData();
  formData.append('key', apiKey);
  formData.append('action', 'upload');
  formData.append('format', 'json');
  formData.append('source', source);

  let response: Response;
  try {
    response = await fetch(FREEIMAGE_UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formData
    });
  } catch (error) {
    diagnostics.push({
      phase,
      ok: false,
      message: getErrorMessage(error)
    });
    throw error;
  }

  try {
    const uploadedUrl = await parseFreeImageResponse(response);
    diagnostics.push({
      phase,
      ok: true,
      status: response.status,
      statusText: response.statusText,
      responseType: response.headers.get('content-type') || undefined
    });
    return uploadedUrl;
  } catch (error) {
    diagnostics.push({
      phase,
      ok: false,
      status: response.status,
      statusText: response.statusText,
      responseType: response.headers.get('content-type') || undefined,
      message: getErrorMessage(error)
    });
    throw error;
  }
};

const uploadBase64SourceViaProxy = async (
  source: string,
  diagnostics: ImageUploadDiagnosticStep[],
  metadata?: { fileName?: string; fileType?: string },
  endpoint = FREEIMAGE_PROXY_ENDPOINT,
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

  let data: FreeImageProxyResponse | null = null;
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

export const uploadImageToFreeImageHost = async (
  image: Blob,
  metadata?: { fileName?: string; fileType?: string }
): Promise<string> => {
  const diagnostics: ImageUploadDiagnosticStep[] = [];
  let finalError: unknown = null;

  try {
    const base64Source = await blobToBase64Source(image);
    diagnostics.push({
      phase: 'base64-conversion',
      ok: true,
      message: `${Math.round(base64Source.length / 1024)} KB base64 payload`
    });
    try {
      return await uploadBase64SourceViaProxy(base64Source, diagnostics, metadata);
    } catch (proxyError) {
      finalError = proxyError;
      return await uploadBase64SourceViaProxy(
        base64Source,
        diagnostics,
        metadata,
        FREEIMAGE_CLOUD_RUN_PROXY_ENDPOINT,
        'cloud-run-proxy-upload'
      );
    }
  } catch (proxyError) {
    finalError = proxyError;
  }

  try {
    return await uploadSourceToFreeImageHost(image, 'binary-upload', diagnostics);
  } catch (binaryError) {
    finalError = binaryError;
  }

  try {
    const base64Source = await blobToBase64Source(image);
    return await uploadSourceToFreeImageHost(base64Source, 'base64-upload', diagnostics);
  } catch (base64Error) {
    finalError = base64Error;
  }

  throw new ImageUploadError(getErrorMessage(finalError), diagnostics);
};
