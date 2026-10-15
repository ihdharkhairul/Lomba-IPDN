import { Activity, CheckCheck, Home } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Spinner } from '@/components/ui/Spinner';
import { StatusBadge } from '@/features/tracking/StatusBadge';
import { formatDateTime, formatPercent } from '@/utils/format';
import { useReportData } from '../ReportDataContext';

export function SuccessStep() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reports, loading } = useReportData();
  const report = reports.find((r) => r.id === id);

  if (!report) {
    if (loading) return <Spinner />;
    return (
      <div className="p-6 flex flex-col justify-center gap-3">
        <Notice tone="error">Laporan tidak ditemukan.</Notice>
        <Link to="/beranda" className="text-center text-xs font-bold text-blue-600">Kembali ke Beranda</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <div className="pt-4 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4"><CheckCheck className="w-10 h-10 stroke-[2.5]" aria-hidden="true" /></div>
        <h1 className="text-2xl font-black text-slate-900 mb-1">Laporan Berhasil Dikirim!</h1>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">Terima kasih telah membantu menjaga keselamatan jalan. Laporan Anda kini menunggu verifikasi petugas.</p>

        <dl className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mt-6 text-left space-y-2.5 text-xs">
          <div className="flex justify-between pb-2 border-b border-slate-200"><dt className="text-slate-500">Nomor Laporan</dt><dd className="font-mono font-bold text-blue-600">#{report.ticketNumber}</dd></div>
          <div className="flex justify-between pb-2 border-b border-slate-200"><dt className="text-slate-500">Waktu Pengiriman</dt><dd className="font-semibold text-slate-800">{formatDateTime(report.createdAt)}</dd></div>
          <div className="flex justify-between gap-3 pb-2 border-b border-slate-200"><dt className="text-slate-500">Kategori</dt><dd className="font-semibold text-slate-800 text-right">{report.category}{report.ai.provider === 'mock' ? ' (demo)' : ` (AI ${formatPercent(report.ai.confidence)})`}</dd></div>
          <div className="flex justify-between items-center"><dt className="text-slate-500">Status</dt><dd><StatusBadge status={report.status} /></dd></div>
        </dl>
      </div>

      <div className="w-full flex flex-col gap-2.5 pt-6">
        <Button onClick={() => navigate(`/laporan/${report.id}`, { replace: true })} icon={<Activity className="w-4 h-4" aria-hidden="true" />}>Lihat Status &amp; Tracking Laporan</Button>
        <Button variant="secondary" onClick={() => navigate('/beranda', { replace: true })} icon={<Home className="w-4 h-4" aria-hidden="true" />} className="!text-xs">Kembali ke Beranda</Button>
      </div>
    </div>
  );
}
