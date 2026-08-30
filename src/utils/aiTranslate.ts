import { GoogleGenAI } from '@google/genai';
import { DEFAULT_LANGUAGE, LanguageCode, LANGUAGES } from '../i18n';

const CACHE_PREFIX = 'bali_base_ai_translation_v2';
const MODEL = 'gemini-flash-lite-latest';

let aiClient: GoogleGenAI | null = null;

const getApiKey = () => {
  const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  const runtimeProcess = (globalThis as any).process;
  const injectedKey = runtimeProcess?.env?.GEMINI_API_KEY || '';
  const key = viteKey || injectedKey;
  return key && key !== 'MY_GEMINI_API_KEY' ? key : '';
};

const getAiClient = () => {
  if (aiClient) return aiClient;

  const apiKey = getApiKey();
  if (!apiKey) return null;

  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
};

const getLanguageName = (language: LanguageCode) =>
  LANGUAGES.find(item => item.code === language)?.name || 'English';

const hashText = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index) | 0;
  }
  return Math.abs(hash).toString(36);
};

const getCacheKey = (text: string, language: LanguageCode) =>
  `${CACHE_PREFIX}:${language}:${hashText(text)}:${text.length}`;

export const hasAiTranslationKey = () => Boolean(getApiKey());

const buildPrompt = (sourceText: string, targetLanguage: string) =>
  [
    `Translate the following text into "${targetLanguage}".`,
    'Return ONLY the clean translation, without comments, introductions, labels, quotes, or markdown.',
    'Text to translate:',
    sourceText
  ].join('\n');

const extractGeminiRestText = (payload: any) =>
  payload?.candidates?.[0]?.content?.parts
    ?.map((part: any) => part?.text || '')
    .join('')
    .trim() || '';

const translateWithRestApi = async (prompt: string, apiKey: string) => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 }
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message || response.statusText || 'Gemini REST request failed';
    throw new Error(message);
  }

  return extractGeminiRestText(payload);
};

export const translateDescription = async (text: string, language: LanguageCode) => {
  const sourceText = text.trim();
  if (!sourceText) return text;

  const cacheKey = getCacheKey(sourceText, language);
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {
    // localStorage can be unavailable in private contexts; translation still works.
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[AI translation] Gemini API key is missing.');
    return text;
  }

  const targetLanguage = getLanguageName(language || DEFAULT_LANGUAGE);
  const prompt = buildPrompt(sourceText, targetLanguage);
  console.info('[AI translation] Requesting Gemini translation.', {
    model: MODEL,
    targetLanguage,
    keyPrefix: `${apiKey.slice(0, 6)}...`
  });

  let translated = '';
  try {
    const ai = getAiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { temperature: 0.2 }
      });
      translated = response.text?.trim() || '';
    }
  } catch (error) {
    console.warn('[AI translation] Gemini SDK failed, trying REST fallback.', error);
  }

  if (!translated) {
    try {
      translated = await translateWithRestApi(prompt, apiKey);
    } catch (error) {
      console.error('[AI translation] Gemini REST fallback failed.', error);
      return text;
    }
  }

  if (!translated) return text;

  try {
    localStorage.setItem(cacheKey, translated);
  } catch {
    // Ignore cache failures; the translated text can still be displayed.
  }

  return translated;
};
