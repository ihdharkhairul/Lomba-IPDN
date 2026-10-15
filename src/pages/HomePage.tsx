import { Archive, ChevronRight, Info, MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapModal } from '@/components/map/MapModal';
import { PhotoImage } from '@/components/ui/PhotoImage';
import { SiteImage } from '@/components/ui/SiteImage';
import { Spinner } from '@/components/ui/Spinner';
import { useCurrentUser } from '@/features/auth/AuthContext';
import { useReportData } from '@/features/reports/ReportDataContext';
import { filterOf } from '@/features/tracking/statusMeta';
import { StatusBadge } from '@/features/tracking/StatusBadge';
import { AI_DISCLAIMER } from '@/services/ai/verdict';
import { firstName, formatDate } from '@/utils/format';

const LEGEND = [
  ['bg-blue-500', 'Diproses', 'Validasi dan verifikasi'],
  ['bg-amber-500', 'Ditindaklanjuti', 'Diteruskan / dikerjakan'],
  ['bg-emerald-500', 'Selesai', 'Jalan sudah diperbaiki'],
  ['bg-red-500', 'Ditolak', 'Tidak dapat diproses'],
];

export function HomePage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { reports, drafts, loading } = useReportData();
  const [mapOpen, setMapOpen] = useState(false);
  const recent = reports.slice(0, 3);
  const stat = (n: number) => (loading ? '–' : n);

  const STATS = [
    ['Total laporan', stat(reports.length)],
    ['Diproses', stat(reports.filter((r) => filterOf(r.status) === 'diproses').length)],
    ['Ditindaklanjuti', stat(reports.filter((r) => filterOf(r.status) === 'ditindaklanjuti').length)],
    ['Selesai', stat(reports.filter((r) => filterOf(r.status) === 'selesai').length)],
  ] as const;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Halo, {firstName(user.name)}</h1>
      <p className="text-slate-500 mt-1">Pantau laporan Anda atau laporkan kerusakan jalan baru.</p>

      <div className="mt-6 grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* CTA utama */}
          <section className="bg-blue-700 text-white rounded-xl overflow-hidden grid sm:grid-cols-[1.2fr_1fr]">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold">Laporkan Kerusakan Jalan</h2>
              <p className="mt-2 text-blue-100 text-sm leading-relaxed">Ambil foto, tandai lokasi dengan GPS, lalu kirim. Tanpa internet pun bisa disimpan sebagai draft.</p>
              <button type="button" onClick={() => navigate('/lapor')} className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-blue-800 font-semibold hover:bg-blue-50 transition-colors cursor-pointer">
                <Plus className="w-4 h-4" aria-hidden="true" />Buat Laporan
              </button>
            </div>
            <SiteImage file="beranda.jpg" alt="Gambar beranda: pelaporan jalan" aspect="aspect-[16/10] sm:aspect-auto" className="hidden sm:block sm:h-full !rounded-none !border-0 !border-l !border-blue-500/50 !bg-blue-800/40 !text-blue-200" />
          </section>

          {/* Ringkasan */}
          <section aria-label="Ringkasan laporan" className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map(([label, n]) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-slate-900">{n}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </section>

          {/* Laporan terbaru */}
          <section aria-labelledby="terbaru">
            <div className="flex items-center justify-between mb-3">
              <h2 id="terbaru" className="font-semibold text-slate-900">Laporan Terbaru</h2>
              {reports.length > 0 && <Link to="/riwayat" className="text-sm text-blue-700 font-semibold hover:underline">Lihat semua</Link>}
            </div>
            {loading ? <Spinner /> : recent.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
                <p className="font-semibold text-slate-700">Belum ada laporan</p>
                <p className="text-sm text-slate-500 mt-1">Laporan pertama Anda akan tampil di sini beserta statusnya.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {recent.map((r, i) => (
                  <li key={r.id}>
                    <Link to={`/laporan/${r.id}`} className="flex gap-4 bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-4 transition-colors">
                      <PhotoImage blob={r.photo} alt={`Foto ${r.category}`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono text-slate-400">#{r.ticketNumber}</span>
                          <StatusBadge status={r.status} />
                        </div>
                        <h3 className="font-semibold text-slate-900 truncate mt-1">{r.category}</h3>
                        <p className="text-sm text-slate-500 truncate flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{r.address ?? 'Alamat belum tersedia'}</span></p>
                        <p className="text-xs text-slate-400 mt-1">{i === 0 ? 'Terakhir · ' : ''}{formatDate(r.createdAt)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sisi kanan */}
        <aside className="space-y-4">
          {drafts.length > 0 && (
            <Link to="/draft" className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors">
              <Archive className="w-5 h-5 text-amber-700 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-amber-900">{drafts.length} draft offline</p><p className="text-xs text-amber-800">Menunggu dikirim</p></div>
              <ChevronRight className="w-4 h-4 text-amber-700" aria-hidden="true" />
            </Link>
          )}

          <button type="button" onClick={() => setMapOpen(true)} className="w-full text-left flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 transition-colors cursor-pointer">
            <MapPin className="w-5 h-5 text-blue-700 shrink-0" aria-hidden="true" />
            <div className="flex-1"><p className="text-sm font-semibold text-slate-900">Peta sebaran</p><p className="text-xs text-slate-500">{reports.length} titik laporan Anda</p></div>
            <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          </button>

          <section className="bg-white border border-slate-200 rounded-xl p-4" aria-label="Arti status laporan">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Arti status laporan</h2>
            <ul className="space-y-2.5 text-sm">
              {LEGEND.map(([dot, t, d]) => (
                <li key={t} className="flex items-start gap-2.5"><span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dot}`} aria-hidden="true" /><span className="text-slate-600"><strong className="text-slate-800">{t}</strong> — {d}</span></li>
              ))}
            </ul>
          </section>

          <div className="flex gap-2.5 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-900">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-700" aria-hidden="true" />
            <p className="leading-relaxed">Foto dicek otomatis sebagai bantuan awal. {AI_DISCLAIMER}</p>
          </div>
        </aside>
      </div>

      <MapModal open={mapOpen} onClose={() => setMapOpen(false)} reports={reports} />
    </div>
  );
}
