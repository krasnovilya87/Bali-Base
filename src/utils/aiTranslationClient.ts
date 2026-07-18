import { LanguageCode } from '../i18n';

const CACHE_PREFIX = 'bali_base_ai_review_translation_v1';

const hashText = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index) | 0;
  }
  return Math.abs(hash).toString(36);
};

const getCacheKey = (text: string, language: LanguageCode) =>
  `${CACHE_PREFIX}:${language}:${hashText(text)}:${text.length}`;

const getTranslateEndpoint = () => {
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.BALI_BASE_API_URL ||
    '';
  return `${String(apiBaseUrl).replace(/\/$/, '')}/api/ai/translate`;
};

export const translateReviewText = async (text: string, language: LanguageCode) => {
  const sourceText = text.trim();
  if (!sourceText) return text;

  const cacheKey = getCacheKey(sourceText, language);
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {
    // Translation can still continue without local cache.
  }

  const response = await fetch(getTranslateEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: sourceText, language })
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || response.statusText || 'AI translation request failed');
  }

  const translatedText = String(payload.translatedText || '').trim();
  if (!translatedText) {
    throw new Error('AI translation returned empty text');
  }

  try {
    localStorage.setItem(cacheKey, translatedText);
  } catch {
    // Ignore cache failures.
  }

  return translatedText;
};
