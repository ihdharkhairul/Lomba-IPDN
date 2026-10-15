import { CloudUpload, Loader2, WifiOff } from 'lucide-react';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useSync } from '@/features/reports/SyncContext';

/** Penanda kecil Online/Offline (status perangkat yang sebenarnya, bukan toggle). */
export function ConnectionBadge({ className = '' }: { className?: string }) {
  const { isOnline } = useConnectivity();
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        isOnline ? 'bg-emerald-500/15 border-emerald-300/40 text-emerald-50' : 'bg-amber-400/20 border-amber-300/50 text-amber-50'
      } ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} aria-hidden="true" />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}

/** Banner global untuk layar yang sudah login: status offline & ajakan mengirim draft saat internet kembali. */
export function ConnectionBanner() {
  const { isOnline } = useConnectivity();
  const { pendingCount, isSyncing, syncNow } = useSync();

  if (!isOnline) {
    return (
      <div role="status" className="shrink-0 bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 flex items-center gap-2 text-xs font-semibold">
        <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Anda sedang offline. GPS tetap bisa dipakai dan laporan dapat disimpan sebagai draft.</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div role="status" className="shrink-0 bg-blue-50 border-b border-blue-200 text-blue-900 px-4 py-2 flex items-center gap-2 text-xs font-semibold">
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
        <span>Mengirim laporan offline…</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div role="status" className="shrink-0 bg-blue-50 border-b border-blue-200 text-blue-900 px-4 py-2 flex items-center gap-2 text-xs">
        <CloudUpload className="w-3.5 h-3.5 shrink-0 text-blue-600" aria-hidden="true" />
        <span className="flex-1 font-semibold">Internet kembali. Ada {pendingCount} laporan yang siap dikirim.</span>
        <button type="button" onClick={() => void syncNow()} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold cursor-pointer hover:bg-blue-700">
          Kirim Sekarang
        </button>
      </div>
    );
  }
  return null;
}
