import { CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Layar masuk/daftar: dua kolom di laptop, satu kolom di HP. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] bg-white">
      <aside className="hidden lg:flex flex-col justify-between bg-blue-700 text-white p-12">
        <Link to="/" aria-label="Kembali ke halaman awal"><Logo tone="dark" /></Link>
        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-snug">Laporkan kerusakan jalan, pantau sampai selesai.</h2>
          <ul className="mt-6 space-y-3 text-blue-100">
            {['Foto dan lokasi GPS dalam satu laporan', 'Tetap bisa dipakai saat sinyal hilang', 'Status penanganan bisa dilacak'].map((t) => (
              <li key={t} className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />{t}</li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-blue-200">Versi prototype</p>
      </aside>

      <div className="flex flex-col min-h-dvh lg:min-h-0">
        <div className="lg:hidden px-4 h-16 flex items-center border-b border-slate-200">
          <Link to="/" aria-label="Kembali ke halaman awal"><Logo /></Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
          <div className="w-full max-w-md">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{title}</h1>
            <p className="text-slate-600 mt-1.5 mb-6">{subtitle}</p>
            {children}
            {footer && <div className="text-center text-sm text-slate-600 mt-6">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
