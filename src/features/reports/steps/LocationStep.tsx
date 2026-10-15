import { Archive, ArrowRight, LocateFixed, MapPin, Save, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { StepHeader } from '@/components/ui/StepHeader';
import { LocationPicker } from '@/components/map/LocationPicker';
import { MapFallback } from '@/components/map/MapFallback';
import { useConnectivity } from '@/hooks/useConnectivity';
import { describeAccuracy, getCurrentLocation } from '@/services/location/geolocation';
import { ADDRESS_PENDING_TEXT, reverseGeocode, type GeocodeResult } from '@/services/map/geocoding';
import { formatAccuracy, formatCoord, formatDateTime } from '@/utils/format';
import { useReportFlow } from '../ReportFlowContext';
import { useSaveDraft } from '../useSaveDraft';

const TONE: Record<string, string> = {
  good: 'bg-emerald-100 text-emerald-800',
  fair: 'bg-amber-100 text-amber-800',
  poor: 'bg-red-100 text-red-800',
  unknown: 'bg-slate-100 text-slate-600',
};

export function LocationStep() {
  const navigate = useNavigate();
  const flow = useReportFlow();
  const { isOnline } = useConnectivity();
  const { save, saving } = useSaveDraft();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geo, setGeo] = useState<GeocodeResult['status'] | 'loading' | null>(null);
  const requestId = useRef(0);

  const { location, address } = flow;
  const setAddress = flow.setAddress;

  // Reverse geocoding saat online; saat offline koordinat tetap disimpan tanpa alamat.
  useEffect(() => {
    if (!location || address || !isOnline) return;
    const id = ++requestId.current;
    setGeo('loading');
    reverseGeocode(location.latitude, location.longitude).then((r) => {
      if (id !== requestId.current) return;
      if (r.status === 'ok') setAddress(r.address);
      setGeo(r.status);
    });
  }, [location, address, isOnline, setAddress]);

  /** Pin digeser / peta diketuk: titik berubah, alamat dicari ulang. */
  function onPick(lat: number, lng: number) {
    flow.setLocation({ latitude: lat, longitude: lng, accuracy: null, timestamp: Date.now(), source: 'manual' }, null);
    setGeo(null);
  }

  async function useMyLocation() {
    setLocating(true);
    setError(null);
    try {
      flow.setLocation(await getCurrentLocation(), null);
      setGeo(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lokasi tidak dapat dibaca.');
    } finally {
      setLocating(false);
    }
  }

  const manual = location?.source === 'manual';
  const accuracy = location ? (manual ? { label: 'Titik disesuaikan manual', tone: 'fair' as const } : describeAccuracy(location.accuracy)) : null;
  const addressText = address
    ? address
    : !location ? 'Belum ada lokasi'
    : geo === 'loading' ? 'Mencari alamat…'
    : geo === 'unconfigured' && isOnline ? 'Alamat tidak dapat dicari (API key peta belum dikonfigurasi). Koordinat tetap tersimpan.'
    : ADDRESS_PENDING_TEXT;

  return (
    <div className="flex-1 flex flex-col">
      <StepHeader step={2} title="Lokasi Kerusakan" tag="02 / Lokasi" onBack={() => navigate('/lapor/foto')} />
      <div className="p-5 space-y-4 flex-1">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Tentukan Titik Lokasi</h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Tekan “Gunakan Lokasi Saya”, lalu geser pin atau ketuk peta bila titiknya belum pas. GPS tetap bekerja tanpa internet.</p>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {!isOnline ? (
            <MapFallback reason="OFFLINE" />
          ) : (
            <LocationPicker value={location ? { lat: location.latitude, lng: location.longitude } : null} onChange={onPick} className="h-72 sm:h-80" />
          )}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-400">Alamat</span>
                <p className="text-xs font-bold text-slate-800 leading-snug flex items-start gap-1"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />{addressText}</p>
              </div>
              {accuracy && <span className={`text-[0.6875rem] px-2 py-0.5 rounded-md font-bold shrink-0 ${TONE[accuracy.tone]}`}>{accuracy.label}</span>}
            </div>
            {location && (
              <dl className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                <div><dt className="text-slate-400 inline">Lat: </dt><dd className="inline font-bold">{formatCoord(location.latitude)}</dd></div>
                <div><dt className="text-slate-400 inline">Long: </dt><dd className="inline font-bold">{formatCoord(location.longitude)}</dd></div>
                <div><dt className="text-slate-400 inline">Akurasi: </dt><dd className="inline font-bold">{manual ? 'manual' : formatAccuracy(location.accuracy)}</dd></div>
                <div><dt className="text-slate-400 inline">Waktu: </dt><dd className="inline font-bold">{formatDateTime(location.timestamp)}</dd></div>
              </dl>
            )}
          </div>
        </div>

        {error && <Notice tone="error" title="Lokasi belum didapat">{error}</Notice>}
        {accuracy?.tone === 'poor' && <Notice tone="warning">Akurasi GPS rendah. Pindah ke area terbuka lalu tekan tombol lagi untuk hasil lebih tepat.</Notice>}

        <Button variant="outline" loading={locating} onClick={() => void useMyLocation()} icon={<LocateFixed className="w-4 h-4" aria-hidden="true" />}>
          {locating ? 'Mencari sinyal GPS…' : location ? 'Perbarui Lokasi Saya' : 'Gunakan Lokasi Saya'}
        </Button>

        {!isOnline && (
          <Notice tone="warning" title="Koneksi internet tidak tersedia" action={
            <Button size="sm" fullWidth loading={saving} disabled={!location} onClick={() => void save()} icon={<Save className="w-3.5 h-3.5" aria-hidden="true" />} className="!bg-amber-600 !text-white hover:!bg-amber-700">Simpan ke Draft Offline</Button>
          }>
            <span className="flex gap-1.5 items-start"><WifiOff className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />Koordinat GPS tetap tersimpan. Simpan sebagai draft dan kirim saat internet kembali.</span>
          </Notice>
        )}
      </div>

      <div className="p-5 pt-3 flex gap-2">
        <Button variant="secondary" fullWidth={false} loading={saving} disabled={!location} onClick={() => void save()} icon={<Archive className="w-4 h-4" aria-hidden="true" />} className="!text-xs">Draft</Button>
        <Button disabled={!location} onClick={() => navigate('/lapor/detail')} icon={<ArrowRight className="w-4 h-4 order-last" aria-hidden="true" />}>Lanjut ke Detail</Button>
      </div>
    </div>
  );
}
