import { FormEvent, useEffect, useRef, useState } from 'react';
import { Mic, Search, X } from 'lucide-react';
import { LanguageCode } from '../i18n';
import { useI18n } from '../i18nContext';

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
      };
    };
  };
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface AiVoiceSearchDialogProps {
  activeLanguage: LanguageCode;
  isSearching: boolean;
  onClose: () => void;
  onSubmit: (query: string) => void;
}

const speechLangByUiLanguage: Record<LanguageCode, string> = {
  EN: 'en-US',
  RU: 'ru-RU',
  ID: 'id-ID',
  FR: 'fr-FR',
  DE: 'de-DE'
};

export default function AiVoiceSearchDialog({
  activeLanguage,
  isSearching,
  onClose,
  onSubmit
}: AiVoiceSearchDialogProps) {
  const { tr } = useI18n();
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const autoSubmitTimerRef = useRef<number | null>(null);
  const hasSubmittedRef = useRef(false);

  const clearAutoSubmitTimer = () => {
    if (autoSubmitTimerRef.current !== null) {
      window.clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
  };

  const submitQuery = (value = transcript) => {
    const query = value.trim();
    if (!query || isSearching) return;
    hasSubmittedRef.current = true;
    clearAutoSubmitTimer();
    recognitionRef.current?.stop();
    onSubmit(query);
  };

  const startListening = () => {
    clearAutoSubmitTimer();
    setError('');

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setIsListening(false);
      setError(tr('search.voice.unsupported'));
      return;
    }

    try {
      recognitionRef.current?.abort();
      const recognition = new Recognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = speechLangByUiLanguage[activeLanguage] || 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => {
        setIsListening(false);
        setError(tr('search.voice.error'));
      };
      recognition.onresult = (event) => {
        let nextTranscript = '';
        let finalTranscript = '';

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const text = result[0]?.transcript || '';
          nextTranscript += text;
          if (result.isFinal) finalTranscript += text;
        }

        const cleanTranscript = nextTranscript.trim();
        if (cleanTranscript) setTranscript(cleanTranscript);

        const cleanFinal = finalTranscript.trim();
        if (cleanFinal && !hasSubmittedRef.current) {
          autoSubmitTimerRef.current = window.setTimeout(() => submitQuery(cleanFinal), 650);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setError(tr('search.voice.error'));
    }
  };

  useEffect(() => {
    startListening();

    return () => {
      clearAutoSubmitTimer();
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitQuery();
  };

  return (
    <div
      className="fixed inset-0 z-[640] flex items-end justify-center bg-[#0B1714]/65 px-3 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[calc(env(safe-area-inset-top)+16px)] backdrop-blur-md sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={tr('search.voice.title')}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/50 bg-white shadow-[0_30px_90px_rgba(11,23,20,0.34)] animate-scale-up"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
          <div>
            <h3 className="font-display text-base font-extrabold text-[#1E293B]">
              {tr('search.voice.title')}
            </h3>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-[#64748B]">
              {isListening ? tr('search.voice.listening') : tr('search.voice.ready')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4F7F6] text-[#1E293B] transition hover:text-[#FF7A50] active:scale-95"
            title={tr('common.close')}
            aria-label={tr('common.close')}
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <button
            type="button"
            onClick={startListening}
            disabled={isSearching}
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/70 text-white shadow-[0_18px_38px_rgba(255,122,80,0.28)] transition active:scale-95 disabled:cursor-wait disabled:opacity-70 ${
              isListening ? 'bg-[#FF7A50] animate-pulse' : 'bg-[#1E293B] hover:bg-[#FF7A50]'
            }`}
            title={tr('search.voice.listenAgain')}
            aria-label={tr('search.voice.listenAgain')}
          >
            <Mic className="h-8 w-8" strokeWidth={1.8} />
          </button>

          <input
            value={transcript}
            onChange={event => {
              hasSubmittedRef.current = false;
              setTranscript(event.target.value);
            }}
            placeholder={tr('search.voice.placeholder')}
            className="box-border h-12 w-full rounded-2xl border border-[#E5E7EB] bg-[#F4F7F6] px-4 text-sm font-semibold text-[#1E293B] outline-none transition focus:border-[#FF7A50] focus:ring-2 focus:ring-[#FF7A50]/15"
            autoFocus
          />

          {error && (
            <p className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-800">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={startListening}
              disabled={isSearching}
              className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white px-4 text-xs font-extrabold text-[#1E293B] transition hover:bg-[#F4F7F6] active:scale-95 disabled:cursor-wait disabled:opacity-70"
            >
              {tr('search.voice.listenAgain')}
            </button>
            <button
              type="submit"
              disabled={!transcript.trim() || isSearching}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#FF7A50] px-4 text-xs font-extrabold text-white shadow-[0_12px_26px_rgba(255,122,80,0.24)] transition hover:bg-[#E05A30] active:scale-95 disabled:cursor-wait disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              {isSearching ? tr('search.voice.searching') : tr('search.ai')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
