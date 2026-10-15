import { ScanSearch, FileText, HelpCircle, Map as MapIcon, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { HealthResponseBody } from '../../shared/ai';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import { config } from '@/config';
import { useSync } from '@/features/reports/SyncContext';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useGoBack } from '@/hooks/useGoBack';
import { fetchAiHealth } from '@/services/ai/aiService';
import { isMapsConfigured } from '@/services/map/googleMapsLoader';

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0" aria-hidden="true">{icon}</span>
      <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800">{label}</p><div className="text-xs text-slate-500 mt-0.5">{children}</div></div>
    </div>
  );
}

export function SettingsPage() {
  const goBack = useGoBack('/profil');
  const { isOnline, simulatedOffline, setSimulatedOffline } = useConnectivity();
  const { autoSync, setAutoSync } = useSync();
  const [health, setHealth] = useState<HealthResponseBody | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchAiHealth().then((h) => !cancelled && setHealth(h));
    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Pengaturan" onBack={goBack} />
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          <Row icon={isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />} label="Status Koneksi">
            {isOnline ? 'Online' : 'Offline'} — mengikuti koneksi perangkat{simulatedOffline && ' (disimulasikan)'}.
          </Row>
          <div className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <p id="auto-sync-label" className="text-sm font-semibold text-slate-800">Kirim draft otomatis</p>
              <p className="text-xs text-slate-500 mt-0.5">Draft offline dikirim sendiri saat internet kembali.</p>
            </div>
            <button type="button" role="switch" aria-checked={autoSync} aria-labelledby="auto-sync-label" onClick={() => setAutoSync(!autoSync)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${autoSync ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${autoSync ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          <Row icon={<ScanSearch className="w-4 h-4" />} label="Layanan Validasi AI">
            {health === undefined ? 'Memeriksa…' : health === null ? 'Server tidak dapat dihubungi.' : (
              <>Mode {health.ai.mode} · {health.ai.provider} ({health.ai.model}) · {health.ai.configured ? 'siap dipakai' : 'BELUM dikonfigurasi'}</>
            )}
          </Row>
          <Row icon={<MapIcon className="w-4 h-4" />} label="Peta">{config.mapProvider === 'osm' ? 'OpenStreetMap (gratis, tanpa API key).' : isMapsConfigured() ? 'Google Maps — API key terkonfigurasi.' : 'Google Maps — API key belum dikonfigurasi (VITE_GOOGLE_MAPS_API_KEY).'}</Row>
        </div>

        <details className="bg-white rounded-xl border border-slate-200 p-4 text-xs text-slate-600 leading-relaxed">
          <summary className="font-bold text-slate-800 cursor-pointer flex items-center gap-2 list-none"><HelpCircle className="w-4 h-4 text-blue-600" aria-hidden="true" />Bantuan &amp; FAQ</summary>
          <div className="mt-3 space-y-2.5">
            <p><strong>Apakah AI menentukan keputusan akhir?</strong> Tidak. AI hanya membantu validasi visual; petugas yang memverifikasi.</p>
            <p><strong>Bagaimana jika tidak ada internet?</strong> GPS tetap bekerja. Simpan sebagai draft; laporan dikirim saat internet kembali.</p>
            <p><strong>Foto buram / bukan jalan?</strong> Anda diminta mengambil foto ulang.</p>
          </div>
        </details>

        <details className="bg-white rounded-xl border border-slate-200 p-4 text-xs text-slate-600 leading-relaxed">
          <summary className="font-bold text-slate-800 cursor-pointer flex items-center gap-2 list-none"><FileText className="w-4 h-4 text-blue-600" aria-hidden="true" />Privasi &amp; Data</summary>
          <div className="mt-3 space-y-2.5">
            <p>Pada versi prototype, akun, draft, dan laporan disimpan di perangkat ini (IndexedDB).</p>
            <p>Saat validasi AI, foto dikirim ke server LAPORIN lalu diteruskan ke layanan Google Gemini untuk dianalisis. Lokasi GPS tidak dikirim ke AI.</p>
          </div>
        </details>

        {config.isDemoMode && (
          <Notice tone="warning" title="Mode Demo aktif (VITE_DEMO_MODE)">
            <label className="flex items-center gap-2 mt-1 cursor-pointer text-xs font-semibold">
              <input type="checkbox" checked={simulatedOffline} onChange={(e) => setSimulatedOffline(e.target.checked)} className="w-4 h-4" />
              Simulasikan offline (untuk presentasi)
            </label>
          </Notice>
        )}

        <p className="text-center text-xs text-slate-400">LAPORIN v1.0.0 · Prototype</p>
      </div>
    </div>
  );
}
