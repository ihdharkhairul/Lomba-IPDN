import { ImagePlus } from 'lucide-react';
import { useState } from 'react';

interface SiteImageProps {
  /** Nama file di folder public/images, mis. "hero.jpg" */
  file: string;
  alt: string;
  className?: string;
  /** Kelas aspect ratio Tailwind, mis. "aspect-[4/3]" */
  aspect?: string;
}

/**
 * Slot gambar. Letakkan file di `public/images/<file>` dan gambar langsung muncul.
 * Selama file belum ada, tampil kotak penanda berisi nama file yang diharapkan.
 */
export function SiteImage({ file, alt, className = '', aspect = 'aspect-[4/3]' }: SiteImageProps) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <div
        role="img"
        aria-label={`Tempat gambar: ${alt}`}
        className={`${aspect} ${className} bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 text-center p-4 text-slate-400`}
      >
        <ImagePlus className="w-6 h-6" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-500">{alt}</span>
        <code className="text-[0.6875rem] text-slate-400">public/images/{file}</code>
      </div>
    );
  }
  return <img src={`/images/${file}`} alt={alt} loading="lazy" onError={() => setMissing(true)} className={`${aspect} ${className} object-cover w-full`} />;
}
