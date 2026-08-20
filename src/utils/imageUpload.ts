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

const uploadSourceToFreeImageHost = async (source: Blob | string) => {
  const apiKey = getFreeImageApiKey();
  const formData = new FormData();
  formData.append('key', apiKey);
  formData.append('action', 'upload');
  formData.append('format', 'json');
  formData.append('source', source);

  const response = await fetch(FREEIMAGE_UPLOAD_ENDPOINT, {
    method: 'POST',
    body: formData
  });

  return parseFreeImageResponse(response);
};

export const uploadImageToFreeImageHost = async (image: Blob): Promise<string> => {
  try {
    return await uploadSourceToFreeImageHost(image);
  } catch (binaryError) {
    try {
      const base64Source = await blobToBase64Source(image);
      return await uploadSourceToFreeImageHost(base64Source);
    } catch (base64Error) {
      throw base64Error instanceof Error ? base64Error : binaryError;
    }
  }
};
