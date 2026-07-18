import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, LanguageCode } from '../../i18n';
import { Review } from '../../types';
import { translateReviewText } from '../../utils/aiTranslationClient';

interface TranslatedReviewTextProps {
  review: Review;
  activeLanguage?: LanguageCode;
  tr: (key: string, params?: Record<string, string | number>) => string;
}

const normalizeText = (value?: string) => (value || '').trim();

const LANGUAGE_NAMES: Record<string, Record<LanguageCode, string>> = {
  en: { EN: 'English', RU: 'английский', ID: 'Inggris', FR: 'anglais', DE: 'Englisch' },
  ru: { EN: 'Russian', RU: 'русский', ID: 'Rusia', FR: 'russe', DE: 'Russisch' },
  id: { EN: 'Indonesian', RU: 'индонезийский', ID: 'Indonesia', FR: 'indonesien', DE: 'Indonesisch' },
  fr: { EN: 'French', RU: 'французский', ID: 'Prancis', FR: 'francais', DE: 'Franzoesisch' },
  de: { EN: 'German', RU: 'немецкий', ID: 'Jerman', FR: 'allemand', DE: 'Deutsch' },
};

const getBrowserLanguage = (): LanguageCode | null => {
  if (typeof navigator === 'undefined') return null;

  const languageMap: Record<string, LanguageCode> = {
    en: 'EN',
    id: 'ID',
    in: 'ID',
    ru: 'RU',
    fr: 'FR',
    de: 'DE',
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

  return null;
};

const getOriginalLanguageLabel = (review: Review, targetLanguage: LanguageCode) => {
  const code = (review.originalLanguageCode || review.textLanguageCode || '').split('-')[0]?.toLowerCase();
  const knownLanguage = code ? LANGUAGE_NAMES[code]?.[targetLanguage] : '';

  if (knownLanguage) return knownLanguage;
  if (targetLanguage !== 'EN' && normalizeText(review.originalText)) return LANGUAGE_NAMES.en[targetLanguage];

  return '';
};

export default function TranslatedReviewText({
  review,
  activeLanguage = DEFAULT_LANGUAGE,
  tr,
}: TranslatedReviewTextProps) {
  const originalText = useMemo(
    () => normalizeText(review.originalText) || normalizeText(review.text),
    [review.originalText, review.text]
  );
  const targetLanguage = getBrowserLanguage() || activeLanguage || DEFAULT_LANGUAGE;
  const [translatedText, setTranslatedText] = useState(originalText);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationAttempted, setTranslationAttempted] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setShowOriginal(false);
    setTranslationAttempted(false);

    if (!originalText) {
      setTranslatedText(originalText);
      setIsTranslating(false);
      console.info('[AI translation] Review translation skipped.', {
        reviewId: review.id,
        hasText: Boolean(originalText),
      });
      return () => {
        isMounted = false;
      };
    }

    setTranslatedText(originalText);
    setIsTranslating(true);
    console.info('[AI translation] Review translation started.', {
      reviewId: review.id,
      targetLanguage,
      hasOriginalText: Boolean(normalizeText(review.originalText)),
      textLength: originalText.length,
    });

    translateReviewText(originalText, targetLanguage)
      .then(result => {
        if (isMounted) {
          const nextText = normalizeText(result) || originalText;
          setTranslatedText(nextText);
          setTranslationAttempted(true);
          console.info('[AI translation] Review translation finished.', {
            reviewId: review.id,
            targetLanguage,
            changed: nextText !== originalText,
          });
        }
      })
      .catch(error => {
        console.warn('[AI translation] Review translation failed.', error);
        if (isMounted) {
          setTranslatedText(originalText);
          setTranslationAttempted(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsTranslating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [originalText, review.id, review.originalText, targetLanguage]);

  const displayText = showOriginal ? originalText : translatedText;
  const originalLanguageLabel = getOriginalLanguageLabel(review, targetLanguage);
  const canToggleOriginal = Boolean(originalText && (isTranslating || translationAttempted || translatedText !== originalText));

  return (
    <div className="space-y-1.5">
      <p className="text-[#1E293B] text-xs sm:text-sm leading-relaxed italic">
        "{isTranslating && !showOriginal ? tr('details.review.translating') : displayText}"
      </p>
      {canToggleOriginal && (
        <button
          type="button"
          onClick={() => setShowOriginal(value => !value)}
          className="text-[10px] font-bold text-[#2F7D69] hover:text-[#FF7A50] transition"
        >
          {showOriginal
            ? tr('details.review.showTranslation')
            : tr(originalLanguageLabel ? 'details.review.showOriginalWithLanguage' : 'details.review.showOriginal', {
              language: originalLanguageLabel,
            })}
        </button>
      )}
    </div>
  );
}
