import type { TranslationParams } from './types';

export const formatTranslation = (template: string, params?: TranslationParams) => {
  if (!params) return template;

  return Object.entries(params).reduce(
    (value, [paramKey, paramValue]) => value.replaceAll(`{${paramKey}}`, String(paramValue)),
    template
  );
};
