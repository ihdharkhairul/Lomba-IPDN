import { CloudUpload, Loader2, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSync } from '@/features/reports/SyncContext';
import { useConnectivity } from '@/hooks/useConnectivity';

/** Status koneksi perangkat (kecil) untuk header. */
export function ConnectionBadge({ className = '' }: { className?: string }) {
  const { isOnline } = useConnectivity();
  return (
    <span
      role="status"
      className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 border ${isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-300 text-amber-900'} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} aria-hidden="true" />
      <span className="font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
    </span>
  );
}

/**
 * Banner global di layar privat:
 *  - offline  -> menjelaskan bahwa laporan tetap bisa dibuat & disimpan sebagai draft
 *  - online + ada draft menunggu -> "Internet kembali..." + tombol Kirim Sekarang
 */
export function ConnectionBanner() {
  const { isOnline } = useConnectivity();
  const { pendingCount, isSyncing, syncNow } = useSync();

  if (!isOnline) {
    return (
      <div role="status" className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 flex items-center justify-center gap-2 text-xs font-medium">
        <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>
          Anda sedang offline. GPS tetap bekerja dan laporan dapat disimpan sebagai{' '}
          <Link to="/draft" className="font-bold underline">draft</Link>.
        </span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div role="status" className="bg-blue-700 text-white px-4 py-2 flex items-center justify-center gap-4 text-xs">
        <span className="flex items-center gap-2 font-medium">
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" /> : <CloudUpload className="w-4 h-4 shrink-0" aria-hidden="true" />}
          {isSyncing ? 'Mengirim laporan…' : `Internet kembali. Ada ${pendingCount} laporan yang siap dikirim.`}
        </span>
        {!isSyncing && (
          <button
            type="button"
            onClick={() => void syncNow()}
            className="shrink-0 px-3 py-1 bg-white text-blue-700 font-bold rounded-full text-xs cursor-pointer hover:bg-blue-50"
          >
            Kirim Sekarang
          </button>
        )}
      </div>
    );
  }
  return null;
}
