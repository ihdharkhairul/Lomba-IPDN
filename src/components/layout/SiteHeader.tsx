import { Link } from 'react-router-dom';
import { Logo } from './Logo';

const LINKS = [
  ['#cara-kerja', 'Cara Kerja'],
  ['#fitur', 'Fitur'],
  ['#jenis', 'Jenis Kerusakan'],
  ['#tentang', 'Tentang'],
];

/** Header situs publik (landing). */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" aria-label="LAPORIN — halaman awal"><Logo /></Link>
        <nav aria-label="Navigasi situs" className="hidden md:flex items-center gap-7">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/masuk" className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-blue-700 rounded-lg">Masuk</Link>
          <Link to="/daftar" className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors">Daftar</Link>
        </div>
      </div>
    </header>
  );
}
