import baseFirebaseConfig from '../../firebase-applet-config.json';

const runtimeEnv = (import.meta as any).env ?? {};
const processEnv = typeof process !== 'undefined' ? process.env : undefined;

const firebaseApiKey =
  runtimeEnv.VITE_FIREBASE_API_KEY ||
  runtimeEnv.FIREBASE_API_KEY ||
  processEnv?.VITE_FIREBASE_API_KEY ||
  processEnv?.FIREBASE_API_KEY ||
  (globalThis as any).FIREBASE_API_KEY ||
  '';

export default {
  ...baseFirebaseConfig,
  apiKey: firebaseApiKey
};
