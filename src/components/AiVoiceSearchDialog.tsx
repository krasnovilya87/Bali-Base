import { FormEvent, useEffect, useRef, useState } from 'react';
import { AudioLines, CheckCircle2, LoaderCircle, Mic, Send, Square, X } from 'lucide-react';
import { LanguageCode } from '../i18n';
import { useI18n } from '../i18nContext';
import { requestAiVoiceTranscription } from '../utils/aiSearchClient';
import { normalizeVehicleModelSearchQuery } from '../utils/vehicleModelNormalizer';

interface AiVoiceSearchDialogProps {
  activeLanguage: LanguageCode;
  currentL1?: string;
  currentL2?: string[];
  isSearching: boolean;
  onClose: () => void;
  onSubmit: (query: string) => void;
}

export default function AiVoiceSearchDialog({
  activeLanguage,
  currentL1,
  currentL2,
  isSearching,
  onClose,
  onSubmit
}: AiVoiceSearchDialogProps) {
  const { tr } = useI18n();
  const [transcript, setTranscript] = useState('');
  const [submittedMessages, setSubmittedMessages] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState('');
  const [mobileViewport, setMobileViewport] = useState<{ height: number; offsetTop: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<number | null>(null);
  const hasSubmittedRef = useRef(false);

  const clearRecordingTimeout = () => {
    if (recordingTimeoutRef.current !== null) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
  };

  const stopAudioStream = () => {
    audioStreamRef.current?.getTracks().forEach(track => track.stop());
    audioStreamRef.current = null;
  };

  const submitQuery = (value = transcript) => {
    const query = normalizeVehicleModelSearchQuery(value, {
      category: currentL1,
      subCategories: currentL2
    }).query.trim();
    if (!query || isSearching || isTranscribing) return;
    hasSubmittedRef.current = true;
    clearRecordingTimeout();
    mediaRecorderRef.current?.stop();
    stopAudioStream();
    setSubmittedMessages(messages => [...messages, query]);
    setTranscript('');
    onSubmit(query);
  };

  const transcribeAudio = async (audio: Blob) => {
    if (audio.size <= 0) return;
    setIsTranscribing(true);
    setError('');

    try {
      const result = await requestAiVoiceTranscription(audio);
      const normalizedTranscript = normalizeVehicleModelSearchQuery(result.transcript, {
        category: currentL1,
        subCategories: currentL2
      }).query.trim();

      if (normalizedTranscript) {
        setTranscript(normalizedTranscript);
      } else {
        setError(tr('search.voice.empty'));
      }
    } catch {
      setError(tr('search.voice.transcriptionError'));
    } finally {
      setIsTranscribing(false);
    }
  };

  const startListening = async () => {
    if (isSearching || isListening || isTranscribing) return;
    clearRecordingTimeout();
    setError('');
    hasSubmittedRef.current = false;

    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        setError(tr('search.voice.unsupported'));
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType: preferredType });

      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        setIsListening(false);
        mediaRecorderRef.current = null;
        stopAudioStream();
        const audio = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        audioChunksRef.current = [];
        if (audio.size > 0 && !hasSubmittedRef.current) {
          void transcribeAudio(audio);
        }
      };

      recorder.start();
      setIsListening(true);
      recordingTimeoutRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      }, 10000);
    } catch {
      setIsListening(false);
      stopAudioStream();
      setError(tr('search.voice.error'));
    }
  };

  const stopListening = () => {
    clearRecordingTimeout();
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    return () => {
      clearRecordingTimeout();
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      stopAudioStream();
    };
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    let frameId = 0;

    const syncViewport = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        if (!window.matchMedia('(max-width: 639px)').matches) {
          setMobileViewport(null);
          return;
        }

        setMobileViewport({
          height: Math.round(viewport?.height || window.innerHeight),
          offsetTop: Math.round(viewport?.offsetTop || 0)
        });
      });
    };

    syncViewport();
    viewport?.addEventListener('resize', syncViewport);
    viewport?.addEventListener('scroll', syncViewport);
    window.addEventListener('resize', syncViewport);

    return () => {
      window.cancelAnimationFrame(frameId);
      viewport?.removeEventListener('resize', syncViewport);
      viewport?.removeEventListener('scroll', syncViewport);
      window.removeEventListener('resize', syncViewport);
    };
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitQuery();
  };

  return (
    <div
      className="fixed inset-0 z-[640] flex items-stretch justify-center bg-[#0B1714]/65 p-0 backdrop-blur-md sm:items-center sm:p-5"
      style={mobileViewport ? {
        bottom: 'auto',
        height: `${mobileViewport.height}px`,
        top: `${mobileViewport.offsetTop}px`
      } : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={tr('search.voice.title')}
    >
      <form
        onSubmit={handleSubmit}
        className="flex h-full w-full flex-col overflow-hidden bg-white shadow-[0_30px_90px_rgba(11,23,20,0.34)] animate-scale-up sm:h-[min(760px,86vh)] sm:max-h-[86vh] sm:max-w-md sm:rounded-[28px] sm:border sm:border-white/50"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] px-5 pb-4 pt-[calc(env(safe-area-inset-top)+16px)] sm:pt-4">
          <div>
            <h3 className="font-display text-base font-extrabold text-[#1E293B]">
              {tr('search.voice.title')}
            </h3>
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

        <div className="flex min-h-0 flex-1 flex-col px-5 py-5">
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-3xl border border-[#E5E7EB] bg-[#F4F7F6] px-4 py-4">
            {submittedMessages.length > 0 ? (
              <>
                {submittedMessages.map((message, index) => (
                  <div key={`${message}-${index}`} className="ml-auto max-w-[88%] rounded-[22px] bg-[#1E293B] px-4 py-3 text-sm font-semibold leading-relaxed text-white shadow-sm">
                    {message}
                  </div>
                ))}
                {isSearching && (
                  <div className="mr-auto max-w-[88%] rounded-[22px] bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-[#64748B] shadow-sm">
                    {tr('search.voice.searching')}
                  </div>
                )}
              </>
            ) : (
              <div
                className={`m-auto flex w-full max-w-[310px] flex-col items-center rounded-[28px] border px-5 py-6 text-center transition-all duration-300 ${
                  isListening
                    ? 'border-[#FF7A50]/35 bg-[#FFF3EE] shadow-[0_18px_45px_rgba(255,122,80,0.16)]'
                    : isTranscribing
                      ? 'border-[#1E293B]/10 bg-white shadow-sm'
                      : transcript.trim()
                        ? 'border-emerald-200 bg-emerald-50/70'
                        : 'border-transparent bg-transparent'
                }`}
              >
                {isListening ? (
                  <>
                    <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-[#FF7A50]/15 animate-ping" />
                      <span className="absolute inset-2 rounded-full border border-[#FF7A50]/30 bg-white shadow-[0_10px_28px_rgba(255,122,80,0.2)]" />
                      <AudioLines className="relative h-8 w-8 text-[#FF7A50]" strokeWidth={2.2} />
                    </div>
                    <div className="mb-4 flex h-9 items-center justify-center gap-1" aria-hidden="true">
                      {[18, 30, 22, 36, 26, 32, 18].map((height, index) => (
                        <span
                          key={`${height}-${index}`}
                          className="w-1.5 animate-pulse rounded-full bg-[#FF7A50]"
                          style={{
                            height,
                            animationDelay: `${index * 90}ms`,
                            animationDuration: '700ms'
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-base font-extrabold text-[#1E293B]">{tr('search.voice.listening')}</p>
                    <p className="mt-1.5 text-xs font-semibold leading-relaxed text-[#7C6259]">
                      {tr('search.voice.listeningHint')}
                    </p>
                  </>
                ) : isTranscribing ? (
                  <>
                    <LoaderCircle className="mb-4 h-10 w-10 animate-spin text-[#FF7A50]" strokeWidth={2} />
                    <p className="text-sm font-extrabold text-[#1E293B]">{tr('search.voice.transcribing')}</p>
                  </>
                ) : transcript.trim() ? (
                  <>
                    <CheckCircle2 className="mb-3 h-9 w-9 text-emerald-600" strokeWidth={2} />
                    <p className="text-sm font-extrabold text-emerald-900">{tr('search.voice.readyToSearch')}</p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#1E293B] shadow-sm">
                      <Mic className="h-6 w-6" strokeWidth={1.9} />
                    </div>
                    <p className="text-sm font-semibold leading-relaxed text-[#64748B]">{tr('search.voice.ready')}</p>
                  </>
                )}
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-800">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-[#E5E7EB] bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 sm:px-5 sm:pb-5">
          <div className="flex items-end gap-2 rounded-[24px] border border-[#E5E7EB] bg-[#F4F7F6] p-2">
            <div className="relative min-w-0 flex-1">
              <textarea
                ref={textareaRef}
                value={transcript}
                onChange={event => {
                  hasSubmittedRef.current = false;
                  setTranscript(event.target.value);
                }}
                placeholder={tr('search.voice.placeholder')}
                className="min-h-11 max-h-32 w-full resize-none bg-transparent py-2 pl-2 pr-9 text-sm font-semibold leading-relaxed text-[#1E293B] outline-none"
                rows={1}
                autoFocus
              />
              {transcript.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    hasSubmittedRef.current = false;
                    setTranscript('');
                    setError('');
                  }}
                  className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#94A3B8] transition hover:bg-white hover:text-[#1E293B] active:scale-95"
                  title={tr('common.clear')}
                  aria-label={tr('common.clear')}
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  void startListening();
                }
              }}
              disabled={isSearching || isTranscribing}
              aria-pressed={isListening}
              className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-3 text-white transition-all duration-200 active:scale-95 disabled:cursor-wait disabled:opacity-70 ${
                isListening
                  ? 'min-w-[116px] bg-[#FF5F35] shadow-[0_0_0_4px_rgba(255,122,80,0.16),0_10px_24px_rgba(255,95,53,0.3)] hover:bg-[#E94E27]'
                  : 'min-w-[106px] bg-[#1E293B] shadow-sm hover:bg-[#FF7A50]'
              }`}
              title={tr(isListening ? 'search.voice.stopRecording' : 'search.voice.startRecording')}
              aria-label={tr(isListening ? 'search.voice.stopRecording' : 'search.voice.startRecording')}
            >
              {isListening ? (
                <Square className="h-3.5 w-3.5 fill-current" strokeWidth={2} />
              ) : (
                <Mic className="h-4.5 w-4.5" strokeWidth={2} />
              )}
              <span className="text-[11px] font-extrabold leading-none">
                {tr(isListening ? 'search.voice.stopRecording' : 'search.voice.startRecording')}
              </span>
            </button>
            <button
              type="submit"
              disabled={!transcript.trim() || isSearching || isTranscribing}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF7A50] text-white shadow-[0_12px_26px_rgba(255,122,80,0.24)] transition hover:bg-[#E05A30] active:scale-95 disabled:cursor-wait disabled:opacity-60"
              title={tr('search.ai')}
              aria-label={tr('search.ai')}
            >
              <Send className="h-4.5 w-4.5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
