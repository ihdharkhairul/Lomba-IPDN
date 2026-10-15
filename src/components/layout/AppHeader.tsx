import { Plus } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/AuthContext';
import { useReportData } from '@/features/reports/ReportDataContext';
import { initials } from '@/utils/format';
import { ConnectionBadge } from './ConnectionBanner';
import { Logo } from './Logo';

const link = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`;

/** Header aplikasi setelah login. Di HP hanya logo & status koneksi (menu ada di navigasi bawah). */
export function AppHeader() {
  const user = useCurrentUser();
  const { drafts } = useReportData();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/beranda" aria-label="LAPORIN — Beranda"><Logo /></Link>

        <nav aria-label="Navigasi utama" className="hidden md:flex items-center gap-1">
          <NavLink to="/beranda" className={link}>Beranda</NavLink>
          <NavLink to="/riwayat" className={link}>Riwayat</NavLink>
          <NavLink to="/draft" className={link}>Draft{drafts.length > 0 && <span className="ml-1.5 text-[0.6875rem] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">{drafts.length}</span>}</NavLink>
          <NavLink to="/pengaturan" className={link}>Pengaturan</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <ConnectionBadge />
          <Link to="/lapor" className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors"><Plus className="w-4 h-4" aria-hidden="true" />Buat Laporan</Link>
          <Link to="/profil" aria-label={`Profil ${user.name}`} className="hidden md:flex w-9 h-9 rounded-full bg-slate-200 text-slate-700 text-xs font-bold items-center justify-center hover:bg-slate-300">{initials(user.name)}</Link>
        </div>
      </div>
    </header>
  );
}
