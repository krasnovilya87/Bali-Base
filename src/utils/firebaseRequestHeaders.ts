import { auth, getCurrentAppCheckToken } from '../firebase';

type FirebaseRequestHeaderOptions = {
  authError?: string;
  contentType?: string;
  requireAuth?: boolean;
};

export const getFirebaseRequestHeaders = async ({
  authError = 'Sign in is required.',
  contentType,
  requireAuth = true
}: FirebaseRequestHeaderOptions = {}) => {
  const idToken = await auth.currentUser?.getIdToken();
  if (requireAuth && !idToken) throw new Error(authError);

  let appCheckToken = '';
  try {
    appCheckToken = await getCurrentAppCheckToken();
  } catch (error) {
    if ((import.meta as any).env?.PROD) {
      throw new Error('Firebase App Check token could not be obtained.', { cause: error });
    }
    console.warn('[Firebase App Check] Continuing without a token in development.', error);
  }
  if (!appCheckToken && (import.meta as any).env?.PROD) {
    throw new Error('Firebase App Check is not configured for this production build.');
  }

  return {
    ...(contentType ? { 'Content-Type': contentType } : {}),
    ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    ...(appCheckToken ? { 'X-Firebase-AppCheck': appCheckToken } : {})
  };
};
