import { useEffect } from 'react';
import { Logo } from '@/components/layout/Logo';

/** Splash singkat khusus layar HP (sekali per sesi). Ketuk untuk melewati. */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <button type="button" onClick={onDone} aria-label="Lanjutkan" className="min-h-dvh w-full bg-blue-700 text-white flex flex-col items-center justify-center text-center p-8 cursor-pointer animate-fadeIn">
      <Logo tone="dark" size="lg" showText={false} />
      <h1 className="text-4xl font-extrabold tracking-tight mt-5">LAPORIN</h1>
      <p className="text-sm text-blue-100 mt-2">Layanan Pelaporan dan Validasi Infrastruktur</p>
    </button>
  );
}
