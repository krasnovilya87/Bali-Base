import { DEFAULT_LANGUAGE, LanguageCode } from '../i18n';

export const LANGUAGE_STORAGE_KEY = 'bali_base_language';

export const getDeviceLanguage = (): LanguageCode => {
  const languageMap: Record<string, LanguageCode> = {
    en: 'EN',
    id: 'ID',
    in: 'ID',
    ru: 'RU',
    fr: 'FR',
    de: 'DE'
  };

  if (typeof window !== 'undefined') {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
    if (savedLanguage && Object.values(languageMap).includes(savedLanguage)) {
      return savedLanguage;
    }
  }

  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;

  const deviceLanguages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const locale of deviceLanguages) {
    const baseLanguage = locale?.split('-')[0]?.toLowerCase();
    if (baseLanguage && languageMap[baseLanguage]) {
      return languageMap[baseLanguage];
    }
  }

  return DEFAULT_LANGUAGE;
};
