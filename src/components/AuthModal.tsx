import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
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
  const [isGoogleLinkedEmail, setIsGoogleLinkedEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    clearAuthStatus();
    setMode('method');
    setAccountState('unknown');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsGoogleLinkedEmail(false);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) onClose();
  }, [isOpen, onClose, user]);

  if (!isOpen) return null;

  const privacyLinks = (
    <p className="text-[11px] leading-relaxed text-[#5F6978]">
      {tr('auth.legalIntro')}{' '}
      <a href="/privacy" className="font-extrabold text-[#FF7A50] underline" target="_blank" rel="noreferrer">
        {tr('auth.privacyRu')}
      </a>{' '}
      {tr('auth.legalAnd')}{' '}
      <a href="/terms" className="font-extrabold text-[#FF7A50] underline" target="_blank" rel="noreferrer">
        {tr('auth.termsRu')}
      </a>.
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
      const isRegistered = methods.length > 0;
      setIsGoogleLinkedEmail(methods.includes('google.com'));
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
    if (mode === 'choice') return;
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
    setIsGoogleLinkedEmail(false);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#E5E7EB]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF7A50]">{tr('auth.badge')}</p>
            <h2 className="mt-1 text-xl font-black text-[#1E293B]">
              {mode === 'method'
                ? tr('auth.signUpOrLoginWith')
                : mode === 'email'
                  ? tr('auth.emailIntro')
                  : accountState === 'registered'
                    ? tr('auth.accountTitle', { email })
                    : tr('auth.createAccountTitle')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5F6978]">
              {reason || tr('auth.defaultReason')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 shrink-0 rounded-full border border-[#E5E7EB] text-[#1E293B] hover:text-[#FF7A50] flex items-center justify-center transition"
            title={tr('common.close')}
            aria-label={tr('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {mode !== 'method' && (
          <button
            type="button"
            onClick={goBack}
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#5F6978] hover:text-[#FF7A50] transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{tr('common.back')}</span>
          </button>
        )}

        {mode === 'method' && (
          <div className="mt-5 space-y-4">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={submitGoogle}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1E293B] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#0F172A] disabled:opacity-60"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-[#1E293B]">G</span>
              <span>{tr('auth.google')}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('email')}
              className="w-full rounded-2xl border border-[#B9DED4] bg-[#ECF8F4] px-4 py-3 text-sm font-extrabold text-[#2F7D69] transition hover:bg-[#DDF1EB]"
            >
              {tr('auth.continueWithEmail')}
            </button>

            <div className="rounded-2xl bg-[#F4F7F6] p-3">
              {privacyLinks}
            </div>
          </div>
        )}

        {mode === 'email' && (
          <form onSubmit={continueWithEmail} className="mt-5 rounded-3xl border border-[#B9DED4] bg-[#ECF8F4] p-4 space-y-3">
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
                className="w-full rounded-2xl border border-[#B9DED4] bg-white py-3 pl-10 pr-3 text-sm font-semibold text-[#1E293B] outline-none transition focus:border-[#2F7D69]"
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
          <form onSubmit={submitPassword} className="mt-5 rounded-3xl border border-[#B9DED4] bg-[#ECF8F4] p-4 space-y-3">
            <div className="text-center text-[11px] font-extrabold uppercase tracking-wider text-[#2F7D69]">
              {accountState === 'registered' ? tr('auth.accountTitle', { email }) : tr('auth.createAccountTitle')}
            </div>
            <div className="rounded-2xl bg-white/70 px-3 py-2 text-xs font-bold text-[#1E293B] break-all">
              {email}
            </div>
            {isGoogleLinkedEmail && (
              <div className="rounded-2xl border border-[#FFD8C9] bg-[#FFF7F2] p-3 space-y-3">
                <p className="text-xs font-bold leading-relaxed text-[#1E293B]">
                  {tr('auth.googleLinkedEmail')}
                </p>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={submitGoogle}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1E293B] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#0F172A] disabled:opacity-60"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-[#1E293B]">G</span>
                  <span>{tr('auth.google')}</span>
                </button>
              </div>
            )}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2F7D69]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={tr('auth.passwordPlaceholder')}
                className="w-full rounded-2xl border border-[#B9DED4] bg-white py-3 pl-10 pr-11 text-sm font-semibold text-[#1E293B] outline-none transition focus:border-[#2F7D69]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6978] hover:text-[#2F7D69]"
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
                  className="w-full rounded-2xl border border-[#B9DED4] bg-white py-3 pl-10 pr-11 text-sm font-semibold text-[#1E293B] outline-none transition focus:border-[#2F7D69]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6978] hover:text-[#2F7D69]"
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
                className="text-xs font-extrabold text-[#FF7A50] underline disabled:opacity-60"
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
            <div className="rounded-2xl bg-white/60 p-3">
              {privacyLinks}
            </div>
          </form>
        )}

        {(authError || emailLinkSent) && (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-xs font-bold ${authError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {authError || tr('auth.passwordResetSent')}
          </div>
        )}
      </div>
    </div>
  );
}
