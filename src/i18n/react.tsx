import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { t } from './core';
import { loadTranslations } from './loaders';
import { DEFAULT_LANGUAGE, LanguageCode, TranslationParams } from './types';

type I18nContextValue = {
  language: LanguageCode;
  isLoadingLanguage: boolean;
  tr: (key: string, params?: TranslationParams) => string;
};

const I18nContext = createContext<I18nContextValue>({
  language: DEFAULT_LANGUAGE,
  isLoadingLanguage: false,
  tr: (key, params) => t(DEFAULT_LANGUAGE, key, params)
});

export const I18nProvider = ({
  language,
  children
}: {
  language: LanguageCode;
  children: React.ReactNode;
}) => {
  const [loadedLanguage, setLoadedLanguage] = useState(language);
  const [isLoadingLanguage, setIsLoadingLanguage] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingLanguage(true);

    loadTranslations(language)
      .then(() => {
        if (isMounted) setLoadedLanguage(language);
      })
      .finally(() => {
        if (isMounted) setIsLoadingLanguage(false);
      });

    return () => {
      isMounted = false;
    };
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language: loadedLanguage,
      isLoadingLanguage,
      tr: (key, params) => t(loadedLanguage, key, params)
    }),
    [isLoadingLanguage, loadedLanguage]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
