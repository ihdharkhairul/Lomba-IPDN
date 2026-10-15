import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white gap-3">
      <p className="text-5xl font-black text-blue-600">404</p>
      <h1 className="text-lg font-extrabold text-slate-900">Halaman tidak ditemukan</h1>
      <p className="text-xs text-slate-500">Alamat yang Anda buka tidak tersedia.</p>
      <Link to="/" className="mt-2 px-5 py-3 rounded-lg bg-blue-600 text-white text-sm font-bold">Ke Halaman Awal</Link>
    </div>
  );
}
