import { auth, getCurrentAppCheckToken } from '../firebase';

type FirebaseRequestHeaderOptions = {
  authError?: string;
  contentType?: string;
};

export const getFirebaseRequestHeaders = async ({
  authError = 'Sign in is required.',
  contentType
}: FirebaseRequestHeaderOptions = {}) => {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error(authError);

  const appCheckToken = await getCurrentAppCheckToken();
  if (!appCheckToken && (import.meta as any).env?.PROD) {
    throw new Error('Firebase App Check is not configured for this production build.');
  }

  return {
    ...(contentType ? { 'Content-Type': contentType } : {}),
    Authorization: `Bearer ${idToken}`,
    ...(appCheckToken ? { 'X-Firebase-AppCheck': appCheckToken } : {})
  };
};
