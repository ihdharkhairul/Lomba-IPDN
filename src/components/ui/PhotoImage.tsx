import { ImageOff } from 'lucide-react';
import { useObjectUrl } from '@/hooks/useObjectUrl';

interface PhotoImageProps {
  blob: Blob | null | undefined;
  alt: string;
  className?: string;
}

/** Menampilkan foto yang tersimpan sebagai Blob (IndexedDB). */
export function PhotoImage({ blob, alt, className = '' }: PhotoImageProps) {
  const url = useObjectUrl(blob);
  if (!blob || !url) {
    return (
      <div className={`bg-slate-200 flex items-center justify-center text-slate-400 ${className}`} role="img" aria-label={alt}>
        <ImageOff className="w-5 h-5" aria-hidden="true" />
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} />;
}
