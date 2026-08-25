import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, X } from 'lucide-react';
import BrandWordmark from '../app/components/BrandWordmark';
import { useAuth } from '../auth/AuthContext';
import { getDailyAuthImageUrl } from '../firebase';
import { useI18n } from '../i18nContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

type AuthMode = 'method' | 'email' | 'password';
type EmailAccountState = 'unknown' | 'registered' | 'new';

export default function AuthModal({ isOpen, onClose, reason }: AuthModalProps) {
  const { tr } = useI18n();
  const {
    authDebug,
    authError,
    clearAuthStatus,
    createEmailPasswordUser,
    emailLinkSent,
    getEmailSignInMethods,
    resetPassword,
    signInWithEmailPassword,
    signInWithGoogle,
    user
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>('method');
  const [accountState, setAccountState] = useState<EmailAccountState>('unknown');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dailyImageUrl, setDailyImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    clearAuthStatus();
    setMode('method');
    setAccountState('unknown');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) onClose();
  }, [isOpen, onClose, user]);

  useEffect(() => {
    if (!isOpen || dailyImageUrl) return;
    let isActive = true;

    getDailyAuthImageUrl().then(url => {
      if (isActive) setDailyImageUrl(url);
    });

    return () => {
      isActive = false;
    };
  }, [dailyImageUrl, isOpen]);

  if (!isOpen) return null;

  const privacyLinks = (
    <p className="text-center text-[11px] font-semibold leading-relaxed text-[#9AA19D]">
      <a href="/privacy" className="text-[#7F8782] underline underline-offset-2 transition hover:text-[#C7603F]" target="_blank" rel="noreferrer">
        {tr('auth.privacy')}
      </a>{' '}
      <span className="text-[#C3C7C4]">/</span>{' '}
      <a href="/terms" className="text-[#7F8782] underline underline-offset-2 transition hover:text-[#C7603F]" target="_blank" rel="noreferrer">
        {tr('auth.terms')}
      </a>
    </p>
  );

  const submitGoogle = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueWithEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const methods = await getEmailSignInMethods(email);
      if (methods.includes('google.com')) {
        await signInWithGoogle(true);
        return;
      }
      const isRegistered = methods.length > 0;
      setAccountState(isRegistered ? 'registered' : 'new');
      setMode('password');
      setPassword('');
      setConfirmPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (accountState === 'registered') {
        await signInWithEmailPassword(email, password, true);
      } else {
        await createEmailPasswordUser(email, password, confirmPassword);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendReset = async () => {
    setIsSubmitting(true);
    try {
      await resetPassword(email);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    clearAuthStatus();
    if (mode === 'method') {
      onClose();
      return;
    }
    if (mode === 'email') {
      setMode('method');
      return;
    }
    setMode('email');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#0B1714]/75 px-3 py-4 backdrop-blur-md sm:px-5 sm:py-6">
      <div className="grid h-[min(860px,calc(100vh-32px))] w-full max-w-[1240px] overflow-hidden rounded-[2rem] border border-white/25 bg-[#F8F5EC] shadow-[0_30px_110px_rgba(11,23,20,0.45)] lg:h-[min(780px,calc(100vh-48px))] lg:grid-cols-[minmax(0,3fr)_minmax(330px,1fr)]">
        <div className="relative min-h-[240px] overflow-hidden bg-[#12362F] lg:min-h-0">
          {dailyImageUrl ? (
            <img
              src={dailyImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,202,135,0.42),transparent_30%),radial-gradient(circle_at_78%_36%,rgba(53,142,119,0.52),transparent_36%),linear-gradient(135deg,#0B2F2A_0%,#E6A56D_48%,#155A4E_100%)]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,23,20,0.34),rgba(8,23,20,0.08)_50%,rgba(8,23,20,0.42)),linear-gradient(0deg,rgba(8,23,20,0.48),transparent_45%)]" />
          <div className="absolute bottom-6 left-5 max-w-[680px] pr-6 text-white sm:bottom-9 sm:left-8">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/75">{tr('cover.badge')}</p>
            <div className="mt-4 max-w-full">
              <BrandWordmark label={tr('brand.name')} variant="auth" />
            </div>
            <p className="mt-4 max-w-md text-sm font-semibold leading-relaxed text-white/85 sm:text-base">
              {tr('cover.subtitle')}
            </p>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-col overflow-y-auto bg-[#FFFDF8] p-5 sm:p-7 lg:p-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E5E0D6] bg-white/80 text-[#1E293B] shadow-sm transition hover:border-[#FF7A50] hover:text-[#FF7A50]"
            title={tr('common.close')}
            aria-label={tr('common.close')}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex min-h-full flex-col pt-10 lg:pt-0">
            <div className="my-auto">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#C7603F]">{tr('auth.badge')}</p>
                <h2 className="mt-2 pr-10 text-2xl font-black leading-tight text-[#17231F]">
                  {mode === 'method'
                    ? tr('auth.signUpOrLoginWith')
                    : mode === 'email'
                      ? tr('auth.emailIntro')
                      : accountState === 'registered'
                        ? tr('auth.accountTitle', { email })
                        : tr('auth.createAccountTitle')}
                </h2>
                <p className="mt-3 text-sm font-medium leading-relaxed text-[#68726E]">
                  {reason || tr('auth.defaultReason')}
                </p>
              </div>

              {mode !== 'method' && (
                <button
                  type="button"
                  onClick={goBack}
                  className="mt-6 inline-flex w-fit items-center gap-1.5 text-xs font-extrabold text-[#68726E] transition hover:text-[#C7603F]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>{tr('common.back')}</span>
                </button>
              )}

              {mode === 'method' && (
                <div className="mt-8 space-y-4">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={submitGoogle}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#17231F] px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_16px_38px_rgba(23,35,31,0.22)] transition hover:bg-[#0B1714] disabled:opacity-60"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black leading-none text-[#17231F]">G</span>
                    <span>{tr('auth.google')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('email')}
                    className="w-full rounded-2xl border border-[#B9DED4] bg-[#E8F5EF] px-4 py-3.5 text-sm font-extrabold text-[#2F7D69] transition hover:bg-[#DDF1EB]"
                  >
                    {tr('auth.continueWithEmail')}
                  </button>
                </div>
              )}

              {mode === 'email' && (
                <form onSubmit={continueWithEmail} className="mt-7 rounded-[1.4rem] border border-[#B9DED4] bg-[#E8F5EF] p-4 space-y-3">
                <div className="text-center text-[11px] font-extrabold uppercase tracking-wider text-[#2F7D69]">
                  {tr('auth.emailIntro')}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2F7D69]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={tr('auth.emailPlaceholder')}
                    className="w-full rounded-2xl border border-[#B9DED4] bg-white py-3 pl-10 pr-3 text-sm font-semibold text-[#17231F] outline-none transition focus:border-[#2F7D69]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-[#2F7D69] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#256353] disabled:opacity-60"
                >
                  {tr('auth.continue')}
                </button>
                </form>
              )}

              {mode === 'password' && (
                <form onSubmit={submitPassword} className="mt-7 rounded-[1.4rem] border border-[#B9DED4] bg-[#E8F5EF] p-4 space-y-3">
                <div className="text-center text-[11px] font-extrabold uppercase tracking-wider text-[#2F7D69]">
                  {accountState === 'registered' ? tr('auth.accountTitle', { email }) : tr('auth.createAccountTitle')}
                </div>
                <div className="rounded-2xl bg-white/70 px-3 py-2 text-xs font-bold text-[#17231F] break-all">
                  {email}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2F7D69]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={tr('auth.passwordPlaceholder')}
                    className="w-full rounded-2xl border border-[#B9DED4] bg-white py-3 pl-10 pr-11 text-sm font-semibold text-[#17231F] outline-none transition focus:border-[#2F7D69]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68726E] hover:text-[#2F7D69]"
                    aria-label={showPassword ? tr('auth.hidePassword') : tr('auth.showPassword')}
                    title={showPassword ? tr('auth.hidePassword') : tr('auth.showPassword')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {accountState === 'new' && (
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2F7D69]" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder={tr('auth.confirmPasswordPlaceholder')}
                      className="w-full rounded-2xl border border-[#B9DED4] bg-white py-3 pl-10 pr-11 text-sm font-semibold text-[#17231F] outline-none transition focus:border-[#2F7D69]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68726E] hover:text-[#2F7D69]"
                      aria-label={showConfirmPassword ? tr('auth.hidePassword') : tr('auth.showPassword')}
                      title={showConfirmPassword ? tr('auth.hidePassword') : tr('auth.showPassword')}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                )}
                {accountState === 'registered' && (
                  <button
                    type="button"
                    onClick={sendReset}
                    disabled={isSubmitting}
                    className="text-xs font-extrabold text-[#C7603F] underline disabled:opacity-60"
                  >
                    {tr('auth.forgotPassword')}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-[#2F7D69] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#256353] disabled:opacity-60"
                >
                  {accountState === 'registered' ? tr('auth.signIn') : tr('auth.signUp')}
                </button>
                </form>
              )}

              {(authError || emailLinkSent) && (
                <div className={`mt-4 rounded-2xl px-4 py-3 text-xs font-bold ${authError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  <div>{authError || tr('auth.passwordResetSent')}</div>
                  {authError && authDebug && (
                    <div className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-white/70 px-3 py-2 font-mono text-[10px] font-semibold leading-relaxed text-red-900">
                      {authDebug}
                    </div>
                  )}
                </div>
              )}

              {authDebug && (
                <div className="mt-4 whitespace-pre-wrap break-words rounded-2xl border border-[#E5E0D6] bg-white/70 px-4 py-3 font-mono text-[10px] font-semibold leading-relaxed text-[#68726E]">
                  {authDebug}
                </div>
              )}
            </div>

            <div className="mt-8 pb-1">
              {privacyLinks}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
