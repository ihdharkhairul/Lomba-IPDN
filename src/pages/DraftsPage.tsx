import { Archive, CloudUpload, Loader2, MapPin, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Notice } from '@/components/ui/Notice';
import { PhotoImage } from '@/components/ui/PhotoImage';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useCurrentUser } from '@/features/auth/AuthContext';
import { useReportData } from '@/features/reports/ReportDataContext';
import { useReportFlow } from '@/features/reports/ReportFlowContext';
import { useSync } from '@/features/reports/SyncContext';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useGoBack } from '@/hooks/useGoBack';
import { ADDRESS_PENDING_TEXT } from '@/services/map/geocoding';
import { draftService } from '@/services/reports/draftService';
import { isDraftComplete } from '@/services/sync/syncService';
import type { ReportDraft, SyncStatus } from '@/types';
import { formatBytes, formatCoord, formatDateTime } from '@/utils/format';

const SYNC_LABEL: Record<SyncStatus, { text: string; cls: string }> = {
  PENDING_SYNC: { text: 'Menunggu dikirim', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  SYNCING: { text: 'Mengirim…', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  NEEDS_REVIEW: { text: 'Perlu diperiksa', cls: 'bg-red-100 text-red-800 border-red-200' },
};

export function DraftsPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const goBack = useGoBack('/profil');
  const flow = useReportFlow();
  const { isOnline } = useConnectivity();
  const { drafts, loading, refresh } = useReportData();
  const { pendingCount, isSyncing, syncNow } = useSync();
  const { showToast } = useToast();
  const [toDelete, setToDelete] = useState<ReportDraft | null>(null);

  /** Melanjutkan draft secara interaktif: memuat ke form lalu menuju langkah yang relevan. */
  function resume(d: ReportDraft) {
    flow.loadFromDraft(d);
    if (!d.location) navigate('/lapor/lokasi');
    else if (!isDraftComplete(d)) navigate('/lapor/detail');
    else navigate(isOnline && d.syncStatus !== 'NEEDS_REVIEW' ? '/lapor/validasi' : '/lapor/review');
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await draftService.deleteDraft(toDelete.id, user.id);
      await refresh();
      showToast('Draft dihapus.', 'success');
    } catch {
      showToast('Draft gagal dihapus.', 'error');
    }
    setToDelete(null);
  }

  return (
    <div>
      <PageHeader title="Draft Offline" subtitle="Disimpan di perangkat ini" onBack={goBack} />
      <div className="space-y-4">
        {!isOnline && <Notice tone="warning">Anda sedang offline. Draft akan dikirim setelah internet kembali.</Notice>}
        {isOnline && pendingCount > 0 && (
          <Button loading={isSyncing} onClick={() => void syncNow()} icon={<CloudUpload className="w-4 h-4" aria-hidden="true" />}>Kirim Semua Draft ({pendingCount})</Button>
        )}

        {loading ? <Spinner /> : drafts.length === 0 ? (
          <EmptyState icon={<Archive className="w-8 h-8" />} title="Tidak ada draft" description="Laporan yang disimpan saat offline akan muncul di sini." action={<Button size="sm" onClick={() => navigate('/lapor')}>Buat Laporan</Button>} />
        ) : (
          <ul className="grid md:grid-cols-2 gap-4">
            {drafts.map((d) => {
              const s = SYNC_LABEL[d.syncStatus];
              return (
                <li key={d.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex gap-3">
                    <PhotoImage blob={d.photo} alt="Foto draft" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[0.6875rem] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${s.cls}`}>{d.syncStatus === 'SYNCING' && <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />}{s.text}</span>
                        <span className="text-[0.6875rem] text-slate-400">{formatBytes(d.photo.size)}</span>
                      </div>
                      <h2 className="text-xs font-bold text-slate-900 truncate">{d.category ?? 'Jenis belum dipilih'}</h2>
                      <p className="text-xs text-slate-500 flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" /><span className="break-words">{d.address ?? (d.location ? ADDRESS_PENDING_TEXT : 'Lokasi belum diambil')}</span></p>
                      {d.location && <p className="text-[0.6875rem] font-mono text-slate-400">{formatCoord(d.location.latitude)}, {formatCoord(d.location.longitude)}</p>}
                      <p className="text-[0.6875rem] text-slate-400">Dibuat {formatDateTime(d.createdAt)}</p>
                    </div>
                  </div>
                  {d.syncMessage && <Notice tone={d.syncStatus === 'NEEDS_REVIEW' ? 'warning' : 'info'}>{d.syncMessage}</Notice>}
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <Button size="sm" disabled={d.syncStatus === 'SYNCING'} onClick={() => resume(d)}>
                      {d.syncStatus === 'NEEDS_REVIEW' ? 'Periksa & Perbaiki' : isOnline ? 'Periksa & Kirim' : 'Lanjutkan Edit'}
                    </Button>
                    <Button size="sm" variant="danger" fullWidth={false} aria-label="Hapus draft" onClick={() => setToDelete(d)} icon={<Trash2 className="w-4 h-4" aria-hidden="true" />} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <ConfirmDialog open={Boolean(toDelete)} title="Hapus draft ini?" message="Foto dan data draft akan dihapus permanen dari perangkat ini." confirmLabel="Hapus" onConfirm={() => void confirmDelete()} onCancel={() => setToDelete(null)} />
    </div>
  );
}
