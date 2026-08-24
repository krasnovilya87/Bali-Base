import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Loader2, LogOut, Mail, Phone, Save, User, X } from 'lucide-react';
import { updateEmail, updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { CURRENCIES, CurrencyKey } from '../app/currency';
import { LANGUAGE_STORAGE_KEY } from '../app/language';
import { LANGUAGES, LanguageCode } from '../i18n';
import { useI18n } from '../i18nContext';
import { uploadImageToFreeImageHost } from '../utils/imageUpload';
import { formatPhoneInput } from '../utils/phone';
import PhoneInput from './PhoneInput';

const CURRENT_USER_PROFILE_KEY = 'bali_base_current_user_profile';
const profileInputClass = 'profile-input-field h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-0 text-sm font-bold text-[#17231F] outline-none transition focus:border-[#2F7D69] sm:h-12 sm:rounded-2xl';

const normalizeProfilePhone = (value: string) => {
  const formatted = formatPhoneInput(value, 'ID');
  return {
    displayValue: formatted.displayValue,
    savedValue: formatted.whatsappNumber || formatted.e164Number || value
  };
};

type ProfileModalProps = {
  activeCurrency: CurrencyKey;
  activeLanguage: LanguageCode;
  listingsCount: number;
  onClose: () => void;
  setActiveCurrency: (currency: CurrencyKey) => void;
  setActiveLanguage: (language: LanguageCode) => void;
};

export default function ProfileModal({
  activeCurrency,
  activeLanguage,
  listingsCount,
  onClose,
  setActiveCurrency,
  setActiveLanguage
}: ProfileModalProps) {
  const { tr } = useI18n();
  const { signOut, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneInput, setPhoneInput] = useState(user?.phoneNumber || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState('');
  const [showCurrencyDrop, setShowCurrencyDrop] = useState(false);
  const [showLanguageDrop, setShowLanguageDrop] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    let isActive = true;
    const userPhone = normalizeProfilePhone(user.phoneNumber || '');
    setDisplayName(user.displayName || '');
    setEmail(user.email || '');
    setPhoneInput(userPhone.displayValue);
    setPhoneNumber(userPhone.savedValue);
    setPhotoURL(user.photoURL || '');
    setIsLoadingProfile(true);

    getDoc(doc(db, 'users', user.uid))
      .then(snapshot => {
        if (!isActive || !snapshot.exists()) return;
        const profile = snapshot.data();
        const savedPhone = typeof profile.contactPhone === 'string' && profile.contactPhone.trim()
          ? profile.contactPhone
          : typeof profile.phoneNumber === 'string'
            ? profile.phoneNumber
            : '';
        const savedEmail = typeof profile.email === 'string' && profile.email.trim()
          ? profile.email
          : user.email || '';
        const savedName = typeof profile.contactName === 'string' && profile.contactName.trim()
          ? profile.contactName
          : typeof profile.displayName === 'string' && profile.displayName.trim()
            ? profile.displayName
            : user.displayName || '';
        const savedPhoto = typeof profile.photoURL === 'string' && profile.photoURL.trim()
          ? profile.photoURL
          : user.photoURL || '';

        setDisplayName(savedName);
        setEmail(savedEmail);
        const formattedPhone = normalizeProfilePhone(savedPhone);
        setPhoneInput(formattedPhone.displayValue);
        setPhoneNumber(formattedPhone.savedValue);
        setPhotoURL(savedPhoto);
      })
      .catch(profileError => {
        console.warn('Failed to load user profile:', profileError);
      })
      .finally(() => {
        if (isActive) setIsLoadingProfile(false);
      });

    return () => {
      isActive = false;
    };
  }, [user]);

  useEffect(() => {
    if (!photoFile) {
      setPreviewURL('');
      return;
    }

    const nextPreviewURL = URL.createObjectURL(photoFile);
    setPreviewURL(nextPreviewURL);
    return () => URL.revokeObjectURL(nextPreviewURL);
  }, [photoFile]);

  const avatarSrc = previewURL || photoURL || '';
  const initials = useMemo(() => {
    const source = displayName || user?.displayName || email || user?.uid || 'B';
    return source.trim().slice(0, 1).toUpperCase() || 'B';
  }, [displayName, email, user?.displayName, user?.uid]);

  const updateLanguage = (language: LanguageCode) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      document.documentElement.lang = language.toLowerCase();
      window.dispatchEvent(new CustomEvent('bali-base-language-updated', { detail: { language } }));
    }
    setActiveLanguage(language);
    setShowLanguageDrop(false);
  };

  const updateCurrency = (currency: CurrencyKey) => {
    setActiveCurrency(currency);
    setShowCurrencyDrop(false);
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const activeUser = auth.currentUser || user;
    if (!activeUser) {
      setError(tr('profile.signInRequired'));
      return;
    }

    setIsSaving(true);
    try {
      let nextPhotoURL = photoURL;
      if (photoFile) {
        nextPhotoURL = await uploadImageToFreeImageHost(photoFile);
      }

      const cleanEmail = email.trim();
      const cleanDisplayName = displayName.trim();
      if (cleanEmail && cleanEmail !== activeUser.email) {
        try {
          await updateEmail(activeUser, cleanEmail);
        } catch (updateEmailError: any) {
          if (updateEmailError?.code === 'auth/requires-recent-login') {
            throw new Error(tr('profile.emailNeedsRecentLogin'));
          }
          throw updateEmailError;
        }
      }

      if (nextPhotoURL !== activeUser.photoURL || cleanDisplayName !== (activeUser.displayName || '')) {
        await updateProfile(activeUser, {
          displayName: cleanDisplayName || null,
          photoURL: nextPhotoURL
        });
      }

      await setDoc(doc(db, 'users', activeUser.uid), {
        uid: activeUser.uid,
        email: cleanEmail || activeUser.email || '',
        displayName: cleanDisplayName || cleanEmail || activeUser.email || 'Bali Base user',
        contactName: cleanDisplayName,
        phoneNumber,
        contactPhone: phoneNumber,
        whatsappNumber: phoneNumber,
        photoURL: nextPhotoURL,
        updatedAt: serverTimestamp()
      }, { merge: true });

      window.localStorage.setItem(CURRENT_USER_PROFILE_KEY, JSON.stringify({
        uid: activeUser.uid,
        displayName: cleanDisplayName,
        email: cleanEmail || activeUser.email || '',
        phoneNumber,
        photoURL: nextPhotoURL
      }));

      setPhotoFile(null);
      setPhotoURL(nextPhotoURL);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : tr('profile.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    setError('');
    setIsSigningOut(true);
    try {
      await signOut();
      onClose();
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : tr('profile.saveError'));
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[610] flex items-end justify-center overflow-y-auto bg-[#0B1714]/70 px-3 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[calc(env(safe-area-inset-top)+16px)] backdrop-blur-md sm:items-center sm:px-5 sm:py-5">
      <form
        onSubmit={saveProfile}
        className="relative max-h-[calc(100dvh-32px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-[520px] overflow-y-auto overscroll-contain rounded-[1.75rem] border border-white/40 bg-[#FFFDF8] shadow-[0_30px_100px_rgba(11,23,20,0.36)] sm:max-h-[calc(100dvh-40px)]"
      >
        <div className="bg-[#17231F] px-5 pb-20 pt-5 text-white sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black leading-tight">{tr('profile.title')}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
              title={tr('common.close')}
              aria-label={tr('common.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="-mt-14 px-5 pb-5 sm:px-7 sm:pb-7">
          <div className="rounded-2xl border border-[#E5E0D6] bg-white p-3.5 shadow-[0_16px_40px_rgba(23,35,31,0.08)] sm:p-4">
            <div className="flex items-stretch gap-3 sm:items-center sm:gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-[130px] w-[130px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#E5E0D6] bg-[#E8F5EF] text-3xl font-black text-[#2F7D69] transition hover:border-[#FF7A50] sm:h-24 sm:w-24"
                title={tr('profile.changePhoto')}
                aria-label={tr('profile.changePhoto')}
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt={tr('profile.photo')} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-[#17231F]/82 py-1.5 text-[10px] font-black uppercase tracking-wide text-white opacity-95">
                  <Camera className="h-3 w-3" />
                  {tr('profile.changePhoto')}
                </span>
              </button>
              <div className="flex min-w-0 flex-1 items-center justify-end">
                <div className="grid shrink-0 grid-cols-2 gap-1.5 sm:flex sm:w-auto sm:items-center">
                  <div className="relative min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCurrencyDrop(value => !value);
                        setShowLanguageDrop(false);
                      }}
                      className="flex h-8 w-14 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-1.5 text-[11px] font-bold uppercase leading-none text-[#1E293B] transition hover:bg-gray-100 sm:h-9 sm:w-auto sm:px-2 sm:text-[12px]"
                      title={tr('nav.currency.title')}
                      aria-label={tr('nav.currency.title')}
                      aria-expanded={showCurrencyDrop}
                    >
                      <span>{activeCurrency}</span>
                    </button>

                    {showCurrencyDrop && (
                      <div className="pu absolute right-0 top-10 z-50 w-28 overflow-hidden rounded-2xl border border-white/50 py-1.5 text-center text-xs shadow-xl animate-fade-in sm:top-11">
                        {Object.keys(CURRENCIES).map(currency => (
                          <button
                            key={currency}
                            type="button"
                            onClick={() => updateCurrency(currency as CurrencyKey)}
                            className={`block w-full py-2 font-bold text-[#1E293B] transition hover:bg-white/70 ${activeCurrency === currency ? 'bg-white/70 text-[#FF7A50]' : ''
                              }`}
                          >
                            {CURRENCIES[currency as CurrencyKey].symbol} {currency}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative min-w-0 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLanguageDrop(value => !value);
                        setShowCurrencyDrop(false);
                      }}
                      className="flex h-8 w-12 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-1.5 text-[11px] font-bold leading-none text-[#1E293B] transition hover:bg-gray-100 sm:h-9 sm:w-auto sm:px-2 sm:text-[12px]"
                      title={tr('nav.language.title')}
                      aria-label={tr('nav.language.title')}
                      aria-expanded={showLanguageDrop}
                    >
                      <span>{activeLanguage}</span>
                    </button>

                    {showLanguageDrop && (
                      <div className="pu absolute right-0 top-10 z-50 w-40 overflow-hidden rounded-2xl border border-white/50 py-1.5 text-xs shadow-xl animate-fade-in sm:top-11 sm:w-32">
                        {LANGUAGES.map(lang => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => updateLanguage(lang.code)}
                            className={`block w-full px-3.5 py-2 text-left font-semibold text-[#1E293B] transition hover:bg-white/70 ${activeLanguage === lang.code ? 'bg-white/70 text-[#FF7A50]' : ''
                              }`}
                          >
                            {lang.nativeName} ({lang.code})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={event => setPhotoFile(event.target.files?.[0] || null)}
              />
            </div>

            <div className="mt-4 space-y-3.5 sm:mt-5 sm:space-y-3">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#68726E]">
                  <User className="h-3.5 w-3.5 text-[#FF7A50]" />
                  {tr('profile.name')}
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={event => setDisplayName(event.target.value)}
                  placeholder={tr('profile.namePlaceholder')}
                  className={profileInputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#68726E]">
                  <Mail className="h-3.5 w-3.5 text-[#FF7A50]" />
                  {tr('profile.email')}
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder={tr('auth.emailPlaceholder')}
                  className={profileInputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#68726E]">
                  <Phone className="h-3.5 w-3.5 text-[#FF7A50]" />
                  {tr('profile.phone')}
                </span>
                <PhoneInput
                  value={phoneInput}
                  onChange={(displayValue, e164Number, _country, whatsappNumber) => {
                    setPhoneInput(displayValue);
                    setPhoneNumber(whatsappNumber || e164Number || displayValue);
                  }}
                  placeholder={tr('profile.phonePlaceholder')}
                  ariaLabel={tr('profile.phone')}
                  defaultCountry="ID"
                  shellClassName="profile-phone-input"
                  className={`${profileInputClass} !h-11 !min-h-11 !rounded-xl !border-[#E5E7EB] !bg-white !py-0 !pl-4 !pr-14 !text-sm !font-bold !text-[#17231F] focus:!border-[#2F7D69] sm:!h-12 sm:!min-h-12 sm:!rounded-2xl`}
                />
              </label>

            </div>

            {(isLoadingProfile || error) && (
              <div className={`mt-4 rounded-2xl px-4 py-3 text-xs font-bold ${error ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500'
                }`}>
                {isLoadingProfile ? tr('profile.loading') : error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving || isLoadingProfile}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2F7D69] px-4 py-3.5 text-sm font-black text-white shadow-[0_16px_34px_rgba(47,125,105,0.22)] transition hover:bg-[#256353] disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{tr('profile.save')}</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#F2C9BC] bg-[#FFF4EF] px-4 py-3.5 text-sm font-black text-[#B9472B] transition hover:border-[#FF7A50] hover:bg-[#FFE8DF] disabled:opacity-60 sm:hidden"
            >
              {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              <span>{tr('nav.logout')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
