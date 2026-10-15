import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  sticky?: boolean;
}

export function ScreenHeader({ title, subtitle, onBack, right, sticky = true }: ScreenHeaderProps) {
  return (
    <header
      className={`p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white/95 backdrop-blur-md z-20 ${
        sticky ? 'sticky top-0' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali"
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-bold text-slate-900 text-base truncate">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
  );
}
