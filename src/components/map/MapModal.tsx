import { LocateFixed, Map as MapIcon, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Notice } from '@/components/ui/Notice';
import { STATUS_META, TONE_COLORS } from '@/features/tracking/statusMeta';
import { StatusBadge } from '@/features/tracking/StatusBadge';
import { getCurrentLocation } from '@/services/location/geolocation';
import type { Report } from '@/types';
import { formatCoord } from '@/utils/format';
import { MapView } from './MapView';

interface MapModalProps {
  open: boolean;
  onClose: () => void;
  /** Laporan milik user yang ditampilkan sebagai marker. */
  reports: Report[];
}

export function MapModal({ open, onClose, reports }: MapModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [recenter, setRecenter] = useState(0);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markers = useMemo(
    () =>
      reports.map((r) => ({
        id: r.id,
        lat: r.location.latitude,
        lng: r.location.longitude,
        title: `${r.ticketNumber} · ${r.category}`,
        color: TONE_COLORS[STATUS_META[r.status].tone],
      })),
    [reports],
  );
  const selected = reports.find((r) => r.id === selectedId) ?? null;

  if (!open) return null;

  async function locate() {
    setLocating(true);
    setError(null);
    try {
      const p = await getCurrentLocation();
      setMe({ lat: p.latitude, lng: p.longitude });
      setRecenter((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lokasi tidak tersedia.');
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex flex-col justify-end sm:justify-center sm:items-center sm:p-6 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Peta sebaran laporan">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-3xl max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl animate-slideUp">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><MapIcon className="w-4 h-4" aria-hidden="true" /></div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm">Peta Sebaran Laporan Anda</h2>
              <p className="text-[0.6875rem] text-slate-500">{reports.length} titik laporan</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup peta" className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="relative">
          <MapView markers={markers} userLocation={me} selectedId={selectedId} onMarkerClick={setSelectedId} recenterKey={recenter} className="h-72 sm:h-96" />
          <button
            type="button"
            onClick={() => void locate()}
            disabled={locating}
            className="absolute bottom-3 right-3 px-3 py-2 bg-white rounded-xl shadow-lg text-xs font-bold text-blue-600 flex items-center gap-1.5 cursor-pointer hover:bg-blue-50 disabled:opacity-60"
          >
            <LocateFixed className="w-4 h-4" aria-hidden="true" /> {locating ? 'Mencari…' : 'Lokasi Saya'}
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          {error && <Notice tone="error">{error}</Notice>}
          {reports.length === 0 && <p className="text-xs text-slate-500">Belum ada laporan. Titik laporan Anda akan muncul di peta setelah dikirim.</p>}
          {selected && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 truncate">{selected.category}</span>
                <StatusBadge status={selected.status} />
              </div>
              <p className="text-xs text-slate-500">{selected.address ?? 'Alamat belum tersedia'}</p>
              <p className="text-[0.6875rem] font-mono text-slate-400">{formatCoord(selected.location.latitude)}, {formatCoord(selected.location.longitude)}</p>
              <Link to={`/laporan/${selected.id}`} onClick={onClose} className="inline-block text-xs font-bold text-blue-600 hover:underline">Lihat detail & tracking</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
