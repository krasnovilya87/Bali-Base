import { readFileSync } from 'fs';
import { resolve } from 'path';
import { GoogleGenAI } from '@google/genai';
import { LANGUAGES, LanguageCode } from '../../i18n';

const MODEL = 'gemini-flash-lite-latest';
const MAX_TEXT_LENGTH = 4000;

const getLanguageName = (language: LanguageCode) =>
  LANGUAGES.find(item => item.code === language)?.name || 'English';

const parseDotEnvValue = (value: string) => value.trim().replace(/^['"]|['"]$/g, '');

const getLocalGeminiKey = () => {
  for (const fileName of ['.env.local', '.env']) {
    try {
      const file = readFileSync(resolve(process.cwd(), fileName), 'utf8');
      const line = file
        .split(/\r?\n/)
        .find(item => /^(GEMINI_API_KEY|VITE_GEMINI_API_KEY)=/.test(item.trim()));

      if (line) {
        const [, rawValue = ''] = line.split(/=(.*)/s);
        const value = parseDotEnvValue(rawValue);
        if (value && value !== 'MY_GEMINI_API_KEY') return value;
      }
    } catch {
      // The file is optional.
    }
  }

  return '';
};

const getGeminiApiKey = () => {
  const key = process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    getLocalGeminiKey();

  return key && key !== 'MY_GEMINI_API_KEY' ? key : '';
};

const buildPrompt = (sourceText: string, targetLanguage: string) =>
  [
    `Translate the following guest review into "${targetLanguage}".`,
    'Keep the meaning, names, places, tone, and rating context intact.',
    'Return ONLY the translated review text, without comments, labels, quotes, or markdown.',
    'Review:',
    sourceText
  ].join('\n');

export const translateTextWithGemini = async (text: string, language: LanguageCode) => {
  const sourceText = text.trim();
  if (!sourceText) {
    return { translatedText: text, model: MODEL };
  }

  if (sourceText.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text is too long. Maximum length is ${MAX_TEXT_LENGTH} characters.`);
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const targetLanguage = getLanguageName(language);
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: buildPrompt(sourceText, targetLanguage),
    config: { temperature: 0.2 }
  });
  const translatedText = response.text?.trim() || '';

  if (!translatedText) {
    throw new Error('Gemini returned an empty translation.');
  }

  return { translatedText, model: MODEL };
};
