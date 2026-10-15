import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from './AuthContext';

/** Halaman privat: belum login -> diarahkan ke /masuk (dan kembali setelah login). */
export function RequireAuth() {
  const { status, justLoggedOut } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Spinner label="Memeriksa sesi…" />;
  if (status === 'unauthenticated') {
    return <Navigate to="/masuk" replace state={justLoggedOut ? undefined : { from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Halaman publik (landing/login/daftar): bila sudah login langsung ke Beranda. */
export function RedirectIfAuthenticated() {
  const { status } = useAuth();
  if (status === 'loading') return <Spinner label="Memeriksa sesi…" />;
  if (status === 'authenticated') return <Navigate to="/beranda" replace />;
  return <Outlet />;
}
