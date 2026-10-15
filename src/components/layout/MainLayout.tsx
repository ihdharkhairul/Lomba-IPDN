import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { ConnectionBanner } from './ConnectionBanner';

const TAB_ROUTES = ['/beranda', '/riwayat', '/profil'];

/** Layout area privat: header + banner koneksi + konten responsif + navigasi bawah (HP). */
export function MainLayout() {
  const { pathname } = useLocation();
  const showNav = TAB_ROUTES.includes(pathname);
  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />
      <ConnectionBanner />
      <main className={`flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8 ${showNav ? 'pb-24 md:pb-8' : ''}`}>
        <Outlet />
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
