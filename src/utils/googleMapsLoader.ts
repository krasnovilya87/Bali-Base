const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com/maps/api/js';

let googleMapsLoadPromise: Promise<void> | null = null;

const getExistingGoogleMapsScript = () =>
  document.querySelector<HTMLScriptElement>(`script[src*="${GOOGLE_MAPS_API_URL}"]`);

const waitForGoogleMaps = (predicate: () => boolean, timeoutMs = 10000) => new Promise<void>((resolve, reject) => {
  const startedAt = Date.now();
  const check = () => {
    if (predicate()) {
      resolve();
      return;
    }

    if (Date.now() - startedAt > timeoutMs) {
      reject(new Error('Google Maps JavaScript API did not become available'));
      return;
    }

    window.setTimeout(check, 150);
  };

  check();
});

export const loadGoogleMapsScript = (
  apiKey: string,
  libraries: string[] = ['places']
) => {
  const googleGlobal = (globalThis as any).google;
  if (googleGlobal?.maps) return Promise.resolve();
  if (!apiKey || typeof document === 'undefined') {
    return Promise.reject(new Error('Google Maps API key is missing'));
  }
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  const existingScript = getExistingGoogleMapsScript();
  if (existingScript) {
    googleMapsLoadPromise = waitForGoogleMaps(() => Boolean((globalThis as any).google?.maps));
    return googleMapsLoadPromise;
  }

  googleMapsLoadPromise = new Promise<void>((resolve, reject) => {
    const callbackName = `__baliBaseGoogleMapsReady_${Date.now()}`;
    (globalThis as any)[callbackName] = () => {
      delete (globalThis as any)[callbackName];
      resolve();
    };

    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: apiKey,
      v: 'weekly',
      libraries: libraries.join(','),
      callback: callbackName
    });
    script.src = `${GOOGLE_MAPS_API_URL}?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps JavaScript API'));
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
};

export const ensureGoogleMapsLibraries = async (
  apiKey: string,
  libraries: string[] = ['places']
) => {
  await loadGoogleMapsScript(apiKey, libraries);

  const maps = (globalThis as any).google?.maps;
  if (!maps) throw new Error('Google Maps JavaScript API is not available');

  if (maps.importLibrary) {
    await Promise.all(
      libraries
        .filter(library => library && !maps[library])
        .map(library => maps.importLibrary(library))
    );
  }

  return maps;
};
