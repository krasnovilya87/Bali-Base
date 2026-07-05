export type LanguageCode = 'EN' | 'ID' | 'RU' | 'FR' | 'DE';

export type TranslationDictionary = Record<string, string>;

export type TranslationParams = Record<string, string | number>;

export const DEFAULT_LANGUAGE: LanguageCode = 'EN';

export const LANGUAGES: Array<{ code: LanguageCode; name: string; nativeName: string }> = [
  { code: 'EN', name: 'English', nativeName: 'English' },
  { code: 'ID', name: 'Indonesian', nativeName: 'Indonesia' },
  { code: 'RU', name: 'Russian', nativeName: 'Русский' },
  { code: 'FR', name: 'French', nativeName: 'Français' },
  { code: 'DE', name: 'German', nativeName: 'Deutsch' }
];
