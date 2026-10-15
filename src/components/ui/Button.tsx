import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'outline';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-blue-700 text-white hover:bg-blue-800',
  accent: 'bg-amber-400 text-slate-950 hover:bg-amber-300',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  outline: 'bg-white border border-blue-700 text-blue-700 hover:bg-blue-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  size?: 'md' | 'sm';
}

export function Button({
  variant = 'primary',
  loading = false,
  icon,
  fullWidth = true,
  size = 'md',
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
        'cursor-pointer',
        size === 'md' ? 'px-4 py-3.5 text-sm' : 'px-3.5 py-2 text-xs rounded-xl',
        fullWidth ? 'w-full' : '',
        isDisabled
          ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed active:scale-100 border-transparent hover:bg-slate-200'
          : VARIANTS[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
