import { MapPin, WifiOff } from 'lucide-react';
import type { MapsErrorCode } from '@/services/map/googleMapsLoader';

const MESSAGES: Record<MapsErrorCode, string> = {
  OFFLINE: 'Peta online tidak tersedia saat offline. Koordinat GPS tetap tersimpan.',
  NOT_CONFIGURED: 'Google Maps API key belum dikonfigurasi (VITE_GOOGLE_MAPS_API_KEY).',
  LOAD_FAILED: 'Peta gagal dimuat. Periksa koneksi internet lalu coba lagi.',
  AUTH_FAILED: 'Google Maps menolak API key. Periksa key dan pembatasannya.',
};

interface MapFallbackProps {
  reason: MapsErrorCode | 'NO_POINT';
  className?: string;
}

/** Pengganti peta ketika peta online tidak dapat ditampilkan. Bukan peta palsu: tidak ada marker rekaan. */
export function MapFallback({ reason, className = 'h-44' }: MapFallbackProps) {
  const message = reason === 'NO_POINT' ? 'Belum ada titik lokasi untuk ditampilkan di peta.' : MESSAGES[reason];
  return (
    <div className={`${className} bg-slate-100 flex flex-col items-center justify-center text-center px-6 gap-2`} role="status">
      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
        {reason === 'OFFLINE' ? <WifiOff className="w-5 h-5" aria-hidden="true" /> : <MapPin className="w-5 h-5" aria-hidden="true" />}
      </div>
      <p className="text-xs text-slate-600 leading-relaxed max-w-[260px]">{message}</p>
    </div>
  );
}
