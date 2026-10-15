import { Clock, Copy, FastForward, GitCommit, MapPin, ScanSearch } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapView } from '@/components/map/MapView';
import { MapFallback } from '@/components/map/MapFallback';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { PhotoImage } from '@/components/ui/PhotoImage';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { SEVERITY_BADGE } from '@/data/options';
import { useCurrentUser } from '@/features/auth/AuthContext';
import { useReportData } from '@/features/reports/ReportDataContext';
import { StatusBadge } from '@/features/tracking/StatusBadge';
import { STATUS_META, TONE_COLORS } from '@/features/tracking/statusMeta';
import { Timeline } from '@/features/tracking/Timeline';
import { config } from '@/config';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useGoBack } from '@/hooks/useGoBack';
import { AI_DISCLAIMER } from '@/services/ai/verdict';
import { reportService } from '@/services/reports/reportService';
import { nextStatus } from '@/services/reports/statusFlow';
import { ADDRESS_PENDING_TEXT } from '@/services/map/geocoding';
import { formatAccuracy, formatCoord, formatDateTime, formatPercent } from '@/utils/format';

export function TrackingPage() {
  const { id } = useParams();
  const user = useCurrentUser();
  const goBack = useGoBack('/riwayat');
  const { reports, loading, refresh } = useReportData();
  const { isOnline } = useConnectivity();
  const { showToast } = useToast();
  const [advancing, setAdvancing] = useState(false);
  // Hanya laporan milik user aktif yang ada di daftar ini.
  const report = reports.find((r) => r.id === id);

  if (!report) {
    return (
      <div>
        <PageHeader title="Tracking Laporan" onBack={goBack} />
        {loading ? <Spinner /> : <div className="space-y-3 max-w-md"><Notice tone="error">Laporan tidak ditemukan atau bukan milik akun ini.</Notice><Link to="/riwayat" className="block text-center text-xs font-bold text-blue-600">Ke Riwayat</Link></div>}
      </div>
    );
  }

  const next = nextStatus(report.status);
  const tone = STATUS_META[report.status].tone;

  async function copyTicket() {
    try {
      await navigator.clipboard.writeText(report!.ticketNumber);
      showToast(`Nomor laporan ${report!.ticketNumber} disalin.`, 'success');
    } catch {
      showToast('Tidak dapat menyalin. Salin manual nomor laporan.', 'warning');
    }
  }

  async function advance() {
    if (!next) return;
    setAdvancing(true);
    try {
      await reportService.updateReportStatus(report!.id, user.id, next, 'Simulasi petugas (mode demo)');
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal mengubah status.', 'error');
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <div>
      <PageHeader title="Tracking Laporan" subtitle={`#${report.ticketNumber}`} onBack={goBack} right={
        <button type="button" onClick={() => void copyTicket()} aria-label="Salin nomor laporan" className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"><Copy className="w-4 h-4" /></button>
      } />

      <div className="grid lg:grid-cols-2 gap-6 items-start">
       <div className="space-y-5">
        <div className="rounded-xl overflow-hidden border border-slate-200"><PhotoImage blob={report.photo} alt={`Foto ${report.category}`} className="w-full h-48 object-cover" /></div>

        <section className="bg-white p-5 rounded-xl border border-slate-200 space-y-2" aria-label="Ringkasan">
          <div className="flex items-center justify-between gap-2"><StatusBadge status={report.status} /><span className="text-[0.6875rem] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" />{formatDateTime(report.createdAt)}</span></div>
          <h2 className="text-base font-bold text-slate-900">{report.category}</h2>
          <dl className="text-xs space-y-1.5">
            <div className="flex justify-between"><dt className="text-slate-500">Tingkat kerusakan</dt><dd className={`font-bold px-2 rounded-md ${SEVERITY_BADGE[report.severity]}`}>{report.severity}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Kondisi</dt><dd className="font-semibold text-slate-800">{report.condition}</dd></div>
            {report.fromOfflineDraft && <div className="flex justify-between"><dt className="text-slate-500">Asal</dt><dd className="font-semibold text-slate-800">Draft offline</dd></div>}
          </dl>
          {report.description && <p className="text-xs text-slate-600 italic leading-relaxed pt-2 border-t border-slate-200 break-words">“{report.description}”</p>}
        </section>

        <section aria-labelledby="ai-title" className="rounded-xl border border-slate-200 p-4 space-y-2.5">
          <h3 id="ai-title" className="text-sm font-extrabold text-slate-900 flex items-center gap-2"><ScanSearch className="w-4 h-4 text-blue-700" aria-hidden="true" />Hasil Validasi AI {report.ai.provider === 'mock' && <span className="text-[0.6875rem] font-bold text-amber-800 bg-amber-100 px-1.5 rounded">Demo</span>}</h3>
          <dl className="text-xs space-y-1.5">
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Jenis terdeteksi</dt><dd className="font-semibold text-slate-800 text-right">{report.ai.damageType ?? 'Tidak dapat ditentukan'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Tingkat (saran AI)</dt><dd className="font-semibold text-slate-800">{report.ai.severity ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Confidence</dt><dd className="font-semibold text-slate-800">{formatPercent(report.ai.confidence)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Penyedia</dt><dd className="font-mono text-xs text-slate-600">{report.ai.provider} · {report.ai.model}</dd></div>
          </dl>
          <p className="text-xs text-slate-600 leading-relaxed">{report.ai.description}</p>
          <p className="text-xs font-semibold text-blue-800 bg-blue-50 rounded-xl p-2.5">{AI_DISCLAIMER}</p>
        </section>

       </div>
       <div className="space-y-5">
        <section aria-labelledby="timeline-title" className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 id="timeline-title" className="font-extrabold text-slate-900 text-sm mb-3.5 flex items-center gap-2"><GitCommit className="w-4 h-4 text-blue-600" aria-hidden="true" />Progres Penanganan</h3>
          <Timeline report={report} />
        </section>

        <section aria-labelledby="lokasi-title" className="space-y-2">
          <h3 id="lokasi-title" className="font-extrabold text-slate-900 text-sm">Lokasi</h3>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            {!isOnline ? <MapFallback reason="OFFLINE" /> : (
              <MapView className="h-48" markers={[{ id: report.id, lat: report.location.latitude, lng: report.location.longitude, title: report.ticketNumber, color: TONE_COLORS[tone] }]} />
            )}
            <div className="p-3.5 bg-slate-50 space-y-1.5 text-xs">
              <p className="font-semibold text-slate-800 flex gap-1.5"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />{report.address ?? ADDRESS_PENDING_TEXT}</p>
              <dl className="grid grid-cols-2 gap-1.5 font-mono text-xs text-slate-600">
                <div>Lat: <strong>{formatCoord(report.location.latitude)}</strong></div>
                <div>Long: <strong>{formatCoord(report.location.longitude)}</strong></div>
                <div>Akurasi: <strong>{formatAccuracy(report.location.accuracy)}</strong></div>
                <div>GPS: <strong>{formatDateTime(report.location.timestamp)}</strong></div>
              </dl>
            </div>
          </div>
        </section>

        {config.isDemoMode && next && (
          <Notice tone="warning" title="Mode Demo">
            Belum ada dasbor petugas. Tombol ini mensimulasikan petugas mengubah status.
            <div className="mt-2"><Button size="sm" fullWidth={false} loading={advancing} onClick={() => void advance()} icon={<FastForward className="w-3.5 h-3.5" aria-hidden="true" />}>Majukan status → {STATUS_META[next].label}</Button></div>
          </Notice>
        )}
       </div>
      </div>
    </div>
  );
}
