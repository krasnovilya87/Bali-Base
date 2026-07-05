import { formatTranslation } from './format';
import { DEFAULT_LANGUAGE, LanguageCode, TranslationParams } from './types';
import { getLoadedTranslations, loadTranslations } from './loaders';

export const t = (language: LanguageCode, key: string, params?: TranslationParams) => {
  const languageDictionary = getLoadedTranslations(language);
  const fallbackDictionary = getLoadedTranslations(DEFAULT_LANGUAGE);
  const template = languageDictionary?.[key] || fallbackDictionary?.[key] || key;

  return formatTranslation(template, params);
};

export const translateAsync = async (
  language: LanguageCode,
  key: string,
  params?: TranslationParams
) => {
  await loadTranslations(language);
  return t(language, key, params);
};
