import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo tone="dark" />
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">Layanan Pelaporan dan Validasi Infrastruktur. Laporkan kerusakan jalan berbasis lokasi dan pantau tindak lanjutnya.</p>
        </div>
        <nav aria-label="Tautan situs" className="space-y-2 text-sm">
          <p className="font-semibold text-white mb-1">Jelajahi</p>
          <a href="#cara-kerja" className="block hover:text-white">Cara Kerja</a>
          <a href="#fitur" className="block hover:text-white">Fitur</a>
          <a href="#jenis" className="block hover:text-white">Jenis Kerusakan</a>
        </nav>
        <nav aria-label="Akun" className="space-y-2 text-sm">
          <p className="font-semibold text-white mb-1">Akun</p>
          <Link to="/masuk" className="block hover:text-white">Masuk</Link>
          <Link to="/daftar" className="block hover:text-white">Daftar</Link>
        </nav>
      </div>
      <div className="border-t border-slate-800">
        <p className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-slate-500">Versi prototype — belum terhubung ke sistem resmi instansi. © {new Date().getFullYear()} LAPORIN</p>
      </div>
    </footer>
  );
}
