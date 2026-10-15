import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

type Tone = 'info' | 'warning' | 'error' | 'success';

const TONES: Record<Tone, { box: string; icon: ReactNode }> = {
  info: { box: 'bg-blue-50 border-blue-200 text-blue-900', icon: <Info className="w-4 h-4 text-blue-600" /> },
  warning: { box: 'bg-amber-50 border-amber-300 text-amber-900', icon: <AlertTriangle className="w-4 h-4 text-amber-600" /> },
  error: { box: 'bg-red-50 border-red-200 text-red-900', icon: <XCircle className="w-4 h-4 text-red-600" /> },
  success: { box: 'bg-emerald-50 border-emerald-200 text-emerald-900', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> },
};

interface NoticeProps {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Kotak informasi/peringatan/error yang konsisten. Error otomatis memakai role="alert". */
export function Notice({ tone = 'info', title, children, action, className = '' }: NoticeProps) {
  const t = TONES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`p-3.5 rounded-lg border flex items-start gap-2.5 ${t.box} ${className}`}
    >
      <span className="shrink-0 mt-0.5" aria-hidden="true">
        {t.icon}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="text-xs font-bold">{title}</p>}
        {children && <div className="text-xs leading-relaxed">{children}</div>}
        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  );
}
