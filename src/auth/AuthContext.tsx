import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  browserLocalPersistence,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { getDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const EMAIL_SIGN_IN_KEY = 'bali_base_email_sign_in';
const CURRENT_USER_PROFILE_KEY = 'bali_base_current_user_profile';
const EMAIL_PROVIDERS_COLLECTION = 'auth_email_providers';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  authError: string;
  authDebug: string;
  emailLinkSent: boolean;
  signInWithGoogle: (termsAccepted: boolean) => Promise<void>;
  sendEmailLink: (email: string, termsAccepted: boolean) => Promise<void>;
  signInWithEmailPassword: (email: string, password: string, termsAccepted: boolean) => Promise<void>;
  createEmailPasswordUser: (email: string, password: string, confirmPassword: string) => Promise<void>;
  getEmailSignInMethods: (email: string) => Promise<string[]>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthStatus: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const actionCodeSettings = () => ({
  url: window.location.href,
  handleCodeInApp: true
});

const rememberTerms = (email: string) => {
  window.localStorage.setItem(EMAIL_SIGN_IN_KEY, JSON.stringify({
    email,
    termsAccepted: true,
    createdAt: new Date().toISOString()
  }));
};

const readRememberedEmail = () => {
  try {
    const raw = window.localStorage.getItem(EMAIL_SIGN_IN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string; termsAccepted?: boolean };
    return parsed.email && parsed.termsAccepted ? parsed.email : null;
  } catch {
    return null;
  }
};

const getEmailProviderKey = (email: string) =>
  email.trim().toLowerCase();

type EmailAuthProviderId = 'google.com' | 'password';
type UserProfileProvider = 'google' | 'email_link';

const upsertEmailProviderIndex = async (user: User, provider: EmailAuthProviderId) => {
  if (!user.email) return;

  await setDoc(doc(db, EMAIL_PROVIDERS_COLLECTION, getEmailProviderKey(user.email)), {
    email: user.email.toLowerCase(),
    providers: [provider],
    primaryProvider: provider,
    uid: user.uid,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

const getEmailProviderId = (provider: UserProfileProvider): EmailAuthProviderId =>
  provider === 'google' ? 'google.com' : 'password';

const upsertUserProfile = async (user: User, provider: UserProfileProvider) => {
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email || 'Bali Base user',
    photoURL: user.photoURL || '',
    provider,
    termsAccepted: true,
    termsAcceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  await upsertEmailProviderIndex(user, getEmailProviderId(provider));
};

const getExistingSessionProvider = (user: User): UserProfileProvider => {
  const providerId = user.providerData[0]?.providerId;
  if (providerId === 'password') return 'email_link';
  return 'google';
};

const safeUpsertUserProfile = async (user: User, provider: UserProfileProvider | 'existing_session') => {
  try {
    await upsertUserProfile(user, provider === 'existing_session' ? getExistingSessionProvider(user) : provider);
  } catch (error) {
    console.warn('User signed in, but profile sync failed:', error);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authDebug, setAuthDebug] = useState('');
  const [emailLinkSent, setEmailLinkSent] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const initializeAuth = async () => {
      setLoading(true);

      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.warn('Firebase Auth persistence setup failed:', error);
        if (isMounted) {
          setAuthDebug(`Persistence setup failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      setAuthDebug(`Auth initialized. projectId=${auth.app.options.projectId || 'unknown'}, authDomain=${auth.app.options.authDomain || 'unknown'}, currentUser=${auth.currentUser ? 'yes' : 'no'}`);

      unsubscribe = onAuthStateChanged(auth, nextUser => {
        if (!isMounted) return;
        setUser(nextUser);
        if (nextUser) {
          window.localStorage.setItem(CURRENT_USER_PROFILE_KEY, JSON.stringify({
            uid: nextUser.uid,
            displayName: nextUser.displayName || '',
            email: nextUser.email || '',
            phoneNumber: nextUser.phoneNumber || '',
            photoURL: nextUser.photoURL || ''
          }));
        } else {
          window.localStorage.removeItem(CURRENT_USER_PROFILE_KEY);
        }
        setLoading(false);
        if (nextUser) {
          setAuthDebug(`Auth state changed. currentUser=${nextUser.email || nextUser.uid}`);
        }
        if (nextUser) {
          safeUpsertUserProfile(nextUser, 'existing_session');
        }
      });
    };

    initializeAuth();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !isSignInWithEmailLink(auth, window.location.href)) return;

    const completeEmailSignIn = async () => {
      setLoading(true);
      setAuthError('');
      try {
        const rememberedEmail = readRememberedEmail();
        const email = rememberedEmail || window.prompt('Please confirm your email address') || '';
        if (!email.trim()) {
          throw new Error('Email is required to complete sign in.');
        }
        const credential = await signInWithEmailLink(auth, email.trim(), window.location.href);
        setUser(credential.user);
        await safeUpsertUserProfile(credential.user, 'email_link');
        window.localStorage.removeItem(EMAIL_SIGN_IN_KEY);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Could not complete email sign in.');
      } finally {
        setLoading(false);
      }
    };

    completeEmailSignIn();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    authError,
    authDebug,
    emailLinkSent,
    signInWithGoogle: async (termsAccepted: boolean) => {
      setAuthError('');
      setEmailLinkSent(false);
      if (!termsAccepted) {
        setAuthError('Please accept the Terms of Use and Privacy Policy.');
        return;
      }

      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        setAuthDebug(`Starting Google popup. projectId=${auth.app.options.projectId || 'unknown'}, authDomain=${auth.app.options.authDomain || 'unknown'}`);
        const credential = await signInWithPopup(auth, provider);
        setUser(credential.user);
        setAuthError('');
        setAuthDebug(`Google popup user: ${credential.user.email || credential.user.uid}`);
        await safeUpsertUserProfile(credential.user, 'google');
      } catch (error) {
        const popupMessage = error instanceof Error ? error.message : 'Could not sign in with Google popup.';
        setAuthError(popupMessage);
        setAuthDebug(`Google popup failed. projectId=${auth.app.options.projectId || 'unknown'}, authDomain=${auth.app.options.authDomain || 'unknown'}, currentUser=${auth.currentUser ? 'yes' : 'no'}`);
      }
    },
    sendEmailLink: async (email: string, termsAccepted: boolean) => {
      setAuthError('');
      setEmailLinkSent(false);
      if (!termsAccepted) {
        setAuthError('Please accept the Terms of Use and Privacy Policy.');
        return;
      }
      if (!email.trim()) {
        setAuthError('Please enter your email address.');
        return;
      }

      try {
        await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings());
        rememberTerms(email.trim());
        setEmailLinkSent(true);
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Could not send the sign-in link.');
      }
    },
    signInWithEmailPassword: async (email: string, password: string, termsAccepted: boolean) => {
      setAuthError('');
      setEmailLinkSent(false);
      const cleanEmail = email.trim();

      if (!termsAccepted) {
        setAuthError('Please accept the Terms of Use and Privacy Policy.');
        return;
      }
      if (!cleanEmail) {
        setAuthError('Please enter your email address.');
        return;
      }
      if (password.length < 6) {
        setAuthError('Password must contain at least 6 characters.');
        return;
      }

      try {
        let credential;
        try {
          credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        } catch (signInError: any) {
          const code = signInError?.code || '';
          if (code !== 'auth/user-not-found' && code !== 'auth/invalid-credential') {
            throw signInError;
          }
          credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        }

        setUser(credential.user);
        setAuthDebug(`Email password user: ${credential.user.email || credential.user.uid}`);
        await safeUpsertUserProfile(credential.user, 'email_link');
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Could not sign in with email and password.');
        setAuthDebug(`Email password sign in failed. projectId=${auth.app.options.projectId || 'unknown'}, authDomain=${auth.app.options.authDomain || 'unknown'}, currentUser=${auth.currentUser ? 'yes' : 'no'}`);
      }
    },
    createEmailPasswordUser: async (email: string, password: string, confirmPassword: string) => {
      setAuthError('');
      setEmailLinkSent(false);
      const cleanEmail = email.trim();

      if (!cleanEmail) {
        setAuthError('Please enter your email address.');
        return;
      }
      if (password.length < 6) {
        setAuthError('Password must contain at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }

      try {
        const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        setUser(credential.user);
        setAuthDebug(`Email password user created: ${credential.user.email || credential.user.uid}`);
        await safeUpsertUserProfile(credential.user, 'email_link');
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Could not create an account.');
        setAuthDebug(`Email password sign up failed. projectId=${auth.app.options.projectId || 'unknown'}, authDomain=${auth.app.options.authDomain || 'unknown'}, currentUser=${auth.currentUser ? 'yes' : 'no'}`);
      }
    },
    getEmailSignInMethods: async (email: string) => {
      setAuthError('');
      setEmailLinkSent(false);
      const cleanEmail = email.trim();
      if (!cleanEmail) {
        setAuthError('Please enter your email address.');
        return [];
      }

      try {
        const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);
        let indexedProviders: string[] = [];

        try {
          const providerSnapshot = await getDoc(doc(db, EMAIL_PROVIDERS_COLLECTION, getEmailProviderKey(cleanEmail)));
          indexedProviders = providerSnapshot.exists()
            ? ((providerSnapshot.data().providers || []) as string[])
            : [];
        } catch (indexError: any) {
          if (indexError?.code === 'permission-denied') {
            indexedProviders = ['google.com'];
            setAuthDebug('Email provider index is not readable yet. Deploy firestore.rules to enable exact provider detection.');
          } else {
            throw indexError;
          }
        }

        return Array.from(new Set([...methods, ...indexedProviders]));
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Could not check this email address.');
        return [];
      }
    },
    resetPassword: async (email: string) => {
      setAuthError('');
      setEmailLinkSent(false);
      const cleanEmail = email.trim();
      if (!cleanEmail) {
        setAuthError('Please enter your email address.');
        return;
      }

      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        setEmailLinkSent(true);
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Could not send a password reset email.');
      }
    },
    signOut: async () => {
      await firebaseSignOut(auth);
    },
    clearAuthStatus: () => {
      setAuthError('');
      setEmailLinkSent(false);
    }
  }), [authDebug, authError, emailLinkSent, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
};
