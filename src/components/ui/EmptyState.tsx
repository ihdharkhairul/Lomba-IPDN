import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50">
      {icon && <div className="flex justify-center mb-2 text-slate-400">{icon}</div>}
      <p className="text-xs font-bold text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">{description}</p>}
      {action && <div className="mt-4 max-w-[220px] mx-auto">{action}</div>}
    </div>
  );
}
