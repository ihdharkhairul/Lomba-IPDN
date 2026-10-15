import { ShieldAlert } from 'lucide-react';

interface LogoProps {
  /** light = teks gelap (latar putih), dark = teks putih (latar biru) */
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ tone = 'light', size = 'md', showText = true }: LogoProps) {
  const box = size === 'lg' ? 'w-16 h-16 rounded-lg' : size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl';
  const icon = size === 'lg' ? 'w-9 h-9' : size === 'sm' ? 'w-4.5 h-4.5' : 'w-5.5 h-5.5';
  const text = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-lg';
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`${box} bg-blue-700 text-white flex items-center justify-center shrink-0 ${tone === 'dark' ? 'ring-2 ring-white/40' : ''}`} aria-hidden="true">
        <ShieldAlert className={icon} />
      </span>
      {showText && <span className={`${text} font-extrabold tracking-tight ${tone === 'dark' ? 'text-white' : 'text-slate-900'}`}>LAPORIN</span>}
    </span>
  );
}
