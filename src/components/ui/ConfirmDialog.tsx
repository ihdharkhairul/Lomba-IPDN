import { useEffect, useRef } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-5 animate-fadeIn">
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="bg-white rounded-xl w-full max-w-sm p-5 shadow-2xl animate-scaleIn">
        <h2 id="confirm-title" className="text-sm font-extrabold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{message}</p>
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
          >
            {cancelLabel}
          </button>
          <Button variant="danger" onClick={onConfirm} className="!py-3 !text-xs">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
