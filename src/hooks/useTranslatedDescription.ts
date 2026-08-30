import { useEffect, useState } from 'react';
import { LanguageCode } from '../i18n';
import { hasAiTranslationKey, translateDescription } from '../utils/aiTranslate';

export const useTranslatedDescription = (description: string, language: LanguageCode, enabled = true) => {
  const [translatedDescription, setTranslatedDescription] = useState(description);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    let isActive = true;
    setTranslatedDescription(description);

    if (!enabled || !description.trim() || !hasAiTranslationKey()) {
      setIsTranslating(false);
      return () => {
        isActive = false;
      };
    }

    setIsTranslating(true);
    translateDescription(description, language)
      .then(result => {
        if (isActive) setTranslatedDescription(result);
      })
      .catch(() => {
        if (isActive) setTranslatedDescription(description);
      })
      .finally(() => {
        if (isActive) setIsTranslating(false);
      });

    return () => {
      isActive = false;
    };
  }, [description, enabled, language]);

  return { translatedDescription, isTranslating };
};
