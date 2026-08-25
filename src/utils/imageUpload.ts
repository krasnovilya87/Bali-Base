const FREEIMAGE_UPLOAD_ENDPOINT = 'https://freeimage.host/api/1/upload';
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

export const uploadImageToFreeImageHost = async (image: Blob): Promise<string> => {
  const diagnostics: ImageUploadDiagnosticStep[] = [];

  try {
    return await uploadSourceToFreeImageHost(image, 'binary-upload', diagnostics);
  } catch (binaryError) {
    try {
      const base64Source = await blobToBase64Source(image);
      diagnostics.push({
        phase: 'base64-conversion',
        ok: true,
        message: `${Math.round(base64Source.length / 1024)} KB base64 payload`
      });
      return await uploadSourceToFreeImageHost(base64Source, 'base64-upload', diagnostics);
    } catch (base64Error) {
      const finalError = base64Error instanceof Error ? base64Error : binaryError;
      throw new ImageUploadError(getErrorMessage(finalError), diagnostics);
    }
  }
};
