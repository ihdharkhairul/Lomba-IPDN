import { Archive, ChevronRight, ClipboardList, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PhotoImage } from '@/components/ui/PhotoImage';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { useReportData } from '@/features/reports/ReportDataContext';
import { filterOf, type HistoryFilter } from '@/features/tracking/statusMeta';
import { StatusBadge } from '@/features/tracking/StatusBadge';
import { formatDate } from '@/utils/format';

const FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'diproses', label: 'Diproses' },
  { key: 'ditindaklanjuti', label: 'Ditindaklanjuti' },
  { key: 'selesai', label: 'Selesai' },
  { key: 'ditolak', label: 'Ditolak' },
];

export function HistoryPage() {
  const navigate = useNavigate();
  const { reports, drafts, loading } = useReportData();
  const [filter, setFilter] = useState<HistoryFilter>('semua');
  const count = (k: HistoryFilter) => (k === 'semua' ? reports.length : reports.filter((r) => filterOf(r.status) === k).length);
  const shown = reports.filter((r) => filter === 'semua' || filterOf(r.status) === filter);

  return (
    <div>
      <PageHeader title="Riwayat Laporan" subtitle="Laporan yang telah Anda ajukan" right={
        <button type="button" onClick={() => navigate('/draft')} className="px-3 py-2 bg-white text-slate-700 rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:border-blue-400 cursor-pointer border border-slate-200 shrink-0"><Archive className="w-3.5 h-3.5" aria-hidden="true" />Draft ({drafts.length})</button>
      } />
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label="Filter status">
          {FILTERS.map(({ key, label }) => (
            <button key={key} role="tab" aria-selected={filter === key} type="button" onClick={() => setFilter(key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${filter === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label} ({count(key)})</button>
          ))}
        </div>

        {loading ? <Spinner /> : reports.length === 0 ? (
          <EmptyState icon={<ClipboardList className="w-8 h-8" />} title="Belum ada laporan" description="Laporan yang Anda kirim akan tampil di sini beserta statusnya." action={<Button size="sm" onClick={() => navigate('/lapor')}>Buat Laporan</Button>} />
        ) : shown.length === 0 ? (
          <EmptyState title="Tidak ada laporan dengan status ini" description="Ubah filter untuk melihat laporan lainnya." />
        ) : (
          <ul className="grid md:grid-cols-2 gap-3">
            {shown.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => navigate(`/laporan/${r.id}`)} className="w-full text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <PhotoImage blob={r.photo} alt={`Foto ${r.category}`} className="w-[72px] h-[72px] rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1 gap-2"><span className="text-[0.6875rem] font-mono text-slate-400">#{r.ticketNumber}</span><StatusBadge status={r.status} /></div>
                      <h2 className="text-xs font-bold text-slate-900 truncate">{r.category}</h2>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 shrink-0" aria-hidden="true" /><span className="truncate">{r.address ?? 'Alamat belum tersedia'}</span></p>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 text-[0.6875rem]"><span className="text-slate-400">{formatDate(r.createdAt)}</span><span className="text-blue-600 font-bold flex items-center gap-0.5">Lihat Tracking<ChevronRight className="w-3 h-3" aria-hidden="true" /></span></div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
