import en from './locales/en';
import { DEFAULT_LANGUAGE, LanguageCode, TranslationDictionary } from './types';

type LocaleModule = { default: TranslationDictionary };

const localeLoaders: Record<LanguageCode, () => Promise<LocaleModule>> = {
  EN: () => Promise.resolve({ default: en }),
  ID: () => import('./locales/id'),
  RU: () => import('./locales/ru'),
  FR: () => import('./locales/fr'),
  DE: () => import('./locales/de')
};

const loadedTranslations: Record<LanguageCode, TranslationDictionary | undefined> = {
  EN: en,
  ID: undefined,
  RU: undefined,
  FR: undefined,
  DE: undefined
};

const loadingTranslations = new Map<LanguageCode, Promise<TranslationDictionary>>();

export const translations = loadedTranslations as Record<LanguageCode, TranslationDictionary>;

export const getLoadedTranslations = (language: LanguageCode) => loadedTranslations[language];

export const loadTranslations = async (language: LanguageCode) => {
  if (loadedTranslations[language]) {
    return loadedTranslations[language] as TranslationDictionary;
  }

  const existingLoad = loadingTranslations.get(language);
  if (existingLoad) return existingLoad;

  const loader = localeLoaders[language] ?? localeLoaders[DEFAULT_LANGUAGE];
  const load = loader()
    .then((module) => {
      loadedTranslations[language] = module.default;
      loadingTranslations.delete(language);
      return module.default;
    })
    .catch((error) => {
      loadingTranslations.delete(language);
      throw error;
    });

  loadingTranslations.set(language, load);
  return load;
};
