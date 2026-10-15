import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type Tone = 'info' | 'success' | 'warning' | 'error';
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastValue {
  showToast: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

const DOT: Record<Tone, string> = {
  info: 'bg-blue-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const showToast = useCallback((message: string, tone: Tone = 'info') => {
    const id = ++counter.current;
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    timers.current.set(
      id,
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timers.current.delete(id);
      }, 3500),
    );
  }, []);

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-3 left-0 right-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="max-w-full bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-2 animate-slideDown"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[t.tone]}`} aria-hidden="true" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus dipakai di dalam <ToastProvider>');
  return ctx;
}
