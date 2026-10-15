import type { GeoPoint } from '@/types';

export type GeolocationErrorCode =
  | 'UNSUPPORTED'
  | 'INSECURE_CONTEXT'
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT';

export class GeolocationError extends Error {
  constructor(
    public readonly code: GeolocationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GeolocationError';
  }
}

/**
 * Membaca posisi dari navigator.geolocation.
 * GPS perangkat TIDAK membutuhkan internet, sehingga fungsi ini tetap bekerja saat offline
 * (selama izin lokasi diberikan dan GPS aktif).
 */
export function getCurrentLocation(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new GeolocationError('UNSUPPORTED', 'Perangkat/peramban ini tidak mendukung GPS.'));
      return;
    }
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      reject(
        new GeolocationError(
          'INSECURE_CONTEXT',
          'GPS hanya dapat dipakai lewat HTTPS atau localhost. Buka aplikasi dengan alamat yang aman.',
        ),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
          timestamp: pos.timestamp || Date.now(),
          source: 'gps',
        }),
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(
              new GeolocationError(
                'PERMISSION_DENIED',
                'Izin lokasi ditolak. Aktifkan izin lokasi untuk LAPORIN di pengaturan peramban/HP, lalu coba lagi.',
              ),
            );
            break;
          case err.TIMEOUT:
            reject(new GeolocationError('TIMEOUT', 'Pencarian sinyal GPS terlalu lama. Pindah ke area terbuka lalu coba lagi.'));
            break;
          default:
            reject(new GeolocationError('POSITION_UNAVAILABLE', 'Lokasi tidak tersedia. Pastikan GPS/Layanan Lokasi aktif.'));
        }
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    );
  });
}

export type AccuracyTone = 'good' | 'fair' | 'poor' | 'unknown';

export function describeAccuracy(meters: number | null): { label: string; tone: AccuracyTone } {
  if (meters == null) return { label: 'Akurasi tidak diketahui', tone: 'unknown' };
  if (meters <= 30) return { label: 'GPS Akurat', tone: 'good' };
  if (meters <= 100) return { label: 'GPS Cukup Akurat', tone: 'fair' };
  return { label: 'GPS Kurang Akurat', tone: 'poor' };
}
