import { ClipboardList, Home, Plus, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const ITEM = 'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors';

/** Navigasi bawah khusus layar kecil (HP). Di laptop digantikan navbar atas. */
export function BottomNav() {
  const { pathname } = useLocation();
  const laporActive = pathname.startsWith('/lapor');
  const tab = (active: boolean) => `${ITEM} ${active ? 'text-blue-700' : 'text-slate-500'}`;

  return (
    <nav aria-label="Navigasi bawah" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 flex items-stretch pb-[env(safe-area-inset-bottom)]">
      <NavLink to="/beranda" className={({ isActive }) => tab(isActive)}>
        <Home className="w-5 h-5" aria-hidden="true" /><span className="text-[0.6875rem] font-semibold">Beranda</span>
      </NavLink>
      <NavLink to="/lapor" aria-current={laporActive ? 'page' : undefined} className={tab(laporActive)}>
        <span className="w-9 h-9 -mt-5 rounded-full bg-blue-700 text-white flex items-center justify-center border-4 border-white"><Plus className="w-5 h-5" aria-hidden="true" /></span>
        <span className="text-[0.6875rem] font-semibold">Buat Laporan</span>
      </NavLink>
      <NavLink to="/riwayat" className={({ isActive }) => tab(isActive)}>
        <ClipboardList className="w-5 h-5" aria-hidden="true" /><span className="text-[0.6875rem] font-semibold">Riwayat</span>
      </NavLink>
      <NavLink to="/profil" className={({ isActive }) => tab(isActive)}>
        <User className="w-5 h-5" aria-hidden="true" /><span className="text-[0.6875rem] font-semibold">Profil</span>
      </NavLink>
    </nav>
  );
}
