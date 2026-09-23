import { auth } from '../firebase';
import { DEFAULT_LANGUAGE, LanguageCode, LANGUAGES } from '../i18n';
import { translateReviewText } from './aiTranslationClient';

const CACHE_PREFIX = 'bali_base_ai_translation_v2';

const hashText = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index) | 0;
  }
  return Math.abs(hash).toString(36);
};

const getCacheKey = (text: string, language: LanguageCode) =>
  `${CACHE_PREFIX}:${language}:${hashText(text)}:${text.length}`;

export const hasAiTranslationKey = () => Boolean(auth.currentUser);

export const translateDescription = async (text: string, language: LanguageCode) => {
  const sourceText = text.trim();
  if (!sourceText) return text;

  const targetLanguage = LANGUAGES.find(item => item.code === language)?.code || DEFAULT_LANGUAGE;
  const cacheKey = getCacheKey(sourceText, targetLanguage);
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {
    // Translation can still continue without local cache.
  }

  const translated = await translateReviewText(sourceText, targetLanguage);
  if (!translated || translated === sourceText) return text;

  try {
    localStorage.setItem(cacheKey, translated);
  } catch {
    // Ignore cache failures.
  }

  return translated;
};
