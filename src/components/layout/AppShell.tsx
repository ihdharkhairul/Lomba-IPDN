import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';

/** Pembungkus aplikasi. Layout mengikuti ukuran layar (HP, tablet, laptop) — tanpa bingkai ponsel. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-800">
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}
