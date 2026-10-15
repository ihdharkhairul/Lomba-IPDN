import { Loader2 } from 'lucide-react';

export function Spinner({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div role="status" className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-500 py-16">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" aria-hidden="true" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
