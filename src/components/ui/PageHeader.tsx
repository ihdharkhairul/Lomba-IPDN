import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}

/** Judul halaman (di luar kartu). */
export function PageHeader({ title, subtitle, onBack, right }: PageHeaderProps) {
  return (
    <header className="mb-5 sm:mb-6 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Kembali" className="mt-0.5 p-2 -ml-2 text-slate-600 hover:bg-slate-200/70 rounded-lg cursor-pointer shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
  );
}
