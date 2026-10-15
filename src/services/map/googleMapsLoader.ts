import { config } from '@/config';
import { isNetworkAvailable } from '../network';

export type MapsErrorCode = 'NOT_CONFIGURED' | 'OFFLINE' | 'LOAD_FAILED' | 'AUTH_FAILED';

export class MapsError extends Error {
  constructor(
    public readonly code: MapsErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'MapsError';
  }
}

export function isMapsConfigured(): boolean {
  return config.googleMapsApiKey.length > 0;
}

interface MapsWindow extends Window {
  google?: { maps?: { importLibrary?: unknown } };
  gm_authFailure?: () => void;
  __laporinMapsReady?: () => void;
}

let loadPromise: Promise<void> | null = null;
let authFailed = false;
const authListeners = new Set<() => void>();

export function onMapsAuthFailure(cb: () => void): () => void {
  authListeners.add(cb);
  if (authFailed) cb();
  return () => authListeners.delete(cb);
}

/**
 * Memuat Google Maps JavaScript API secara dinamis (sekali saja).
 * API key dibaca dari VITE_GOOGLE_MAPS_API_KEY -> wajib dibatasi (HTTP referrer + API restriction)
 * di Google Cloud Console karena key peta memang terlihat di browser.
 */
export async function loadGoogleMaps(): Promise<void> {
  if (!isMapsConfigured()) {
    throw new MapsError('NOT_CONFIGURED', 'Google Maps API key belum dikonfigurasi (VITE_GOOGLE_MAPS_API_KEY).');
  }
  if (!isNetworkAvailable()) {
    throw new MapsError('OFFLINE', 'Peta online tidak tersedia saat offline.');
  }
  const w = window as MapsWindow;
  if (authFailed) throw new MapsError('AUTH_FAILED', 'Google Maps menolak API key. Periksa key dan pembatasannya.');

  if (!w.google?.maps?.importLibrary) {
    loadPromise ??= new Promise<void>((resolve, reject) => {
      w.gm_authFailure = () => {
        authFailed = true;
        authListeners.forEach((cb) => cb());
      };
      w.__laporinMapsReady = () => resolve();
      const script = document.createElement('script');
      script.src =
        'https://maps.googleapis.com/maps/api/js' +
        `?key=${encodeURIComponent(config.googleMapsApiKey)}&loading=async&v=weekly&language=id&region=ID&callback=__laporinMapsReady`;
      script.async = true;
      script.onerror = () => {
        loadPromise = null;
        script.remove();
        reject(new MapsError('LOAD_FAILED', 'Gagal memuat Google Maps. Periksa koneksi internet.'));
      };
      document.head.appendChild(script);
    });
    await loadPromise;
  }

  await Promise.all([
    google.maps.importLibrary('maps'),
    google.maps.importLibrary('marker'),
    google.maps.importLibrary('geocoding'),
  ]);
  if (authFailed) throw new MapsError('AUTH_FAILED', 'Google Maps menolak API key. Periksa key dan pembatasannya.');
}
