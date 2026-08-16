import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Loader2, Mail, Phone, Save, User, X } from 'lucide-react';
import { updateEmail, updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, uploadFileToStorage } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18nContext';
import { formatPhoneInput } from '../utils/phone';
import PhoneInput from './PhoneInput';

const CURRENT_USER_PROFILE_KEY = 'bali_base_current_user_profile';
const profileInputClass = 'profile-input-field h-12 w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-0 text-sm font-bold text-[#17231F] outline-none transition focus:border-[#2F7D69]';

const normalizeProfilePhone = (value: string) => {
  const formatted = formatPhoneInput(value, 'ID');
  return {
    displayValue: formatted.displayValue,
    savedValue: formatted.whatsappNumber || formatted.e164Number || value
  };
};

type ProfileModalProps = {
  listingsCount: number;
  onClose: () => void;
};

export default function ProfileModal({ listingsCount, onClose }: ProfileModalProps) {
  const { tr } = useI18n();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneInput, setPhoneInput] = useState(user?.phoneNumber || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
        const extension = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        nextPhotoURL = await uploadFileToStorage(photoFile, `profiles/${activeUser.uid}/avatar-${Date.now()}.${extension}`);
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

  return (
    <div className="fixed inset-0 z-[610] flex items-center justify-center bg-[#0B1714]/70 px-3 py-5 backdrop-blur-md sm:px-5">
      <form
        onSubmit={saveProfile}
        className="relative w-full max-w-[520px] overflow-hidden rounded-[1.75rem] border border-white/40 bg-[#FFFDF8] shadow-[0_30px_100px_rgba(11,23,20,0.36)]"
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
          <div className="rounded-2xl border border-[#E5E0D6] bg-white p-4 shadow-[0_16px_40px_rgba(23,35,31,0.08)]">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#E5E0D6] bg-[#E8F5EF] text-3xl font-black text-[#2F7D69] transition hover:border-[#FF7A50]"
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
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#2F7D69]/10 px-3 py-1 text-xs font-black text-[#2F7D69]">
                  <User className="h-3.5 w-3.5" />
                  <span>{tr('profile.totalListings', { count: listingsCount })}</span>
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

            <div className="mt-5 space-y-3">
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
                  className={`${profileInputClass} !h-12 !min-h-12 !rounded-2xl !border-[#E5E7EB] !bg-white !py-0 !pl-4 !pr-14 !text-sm !font-bold !text-[#17231F] focus:!border-[#2F7D69]`}
                />
              </label>
            </div>

            {(isLoadingProfile || error) && (
              <div className={`mt-4 rounded-2xl px-4 py-3 text-xs font-bold ${
                error ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500'
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
          </div>
        </div>
      </form>
    </div>
  );
}
