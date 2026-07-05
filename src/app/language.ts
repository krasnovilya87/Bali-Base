import { DEFAULT_LANGUAGE, LanguageCode } from '../i18n';

export const getDeviceLanguage = (): LanguageCode => {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;

  const languageMap: Record<string, LanguageCode> = {
    en: 'EN',
    id: 'ID',
    in: 'ID',
    ru: 'RU',
    fr: 'FR',
    de: 'DE'
  };

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
