import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthContext';
import { useConnectivity } from '@/hooks/useConnectivity';
import { backfillMissingAddresses, syncPendingDrafts } from '@/services/sync/syncService';
import { useReportData } from './ReportDataContext';

interface SyncValue {
  isSyncing: boolean;
  /** Draft yang menunggu dikirim (PENDING_SYNC / SYNCING). */
  pendingCount: number;
  /** Draft yang perlu diperiksa user sebelum bisa dikirim. */
  needsReviewCount: number;
  autoSync: boolean;
  setAutoSync: (value: boolean) => void;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncValue | null>(null);
const AUTO_SYNC_KEY = 'laporin.autoSync';

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isOnline } = useConnectivity();
  const { reports, drafts, loading, refresh } = useReportData();
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSyncState] = useState(() => {
    try {
      return localStorage.getItem(AUTO_SYNC_KEY) !== '0';
    } catch {
      return true;
    }
  });

  const userId = user?.id ?? null;
  const pendingCount = useMemo(() => drafts.filter((d) => d.syncStatus !== 'NEEDS_REVIEW').length, [drafts]);
  const needsReviewCount = useMemo(() => drafts.filter((d) => d.syncStatus === 'NEEDS_REVIEW').length, [drafts]);
  const missingAddressCount = useMemo(
    () => drafts.filter((d) => !d.address && d.location).length + reports.filter((r) => !r.address).length,
    [drafts, reports],
  );

  const setAutoSync = useCallback((value: boolean) => {
    setAutoSyncState(value);
    try {
      localStorage.setItem(AUTO_SYNC_KEY, value ? '1' : '0');
    } catch {
      /* abaikan */
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!userId) return;
    if (!isOnline) {
      showToast('Masih offline. Draft akan dikirim saat internet kembali.', 'warning');
      return;
    }
    setIsSyncing(true);
    try {
      const outcome = await syncPendingDrafts(userId);
      await backfillMissingAddresses(userId).catch(() => 0);
      await refresh();

      if (outcome.submitted > 0) showToast(`${outcome.submitted} laporan berhasil dikirim.`, 'success');
      if (outcome.needsReview > 0) showToast(`${outcome.needsReview} draft perlu diperiksa sebelum dikirim.`, 'warning');
      if (outcome.stoppedReason === 'not_configured') showToast('Layanan AI belum dikonfigurasi di server.', 'error');
      else if (outcome.stoppedReason === 'rate_limited') showToast('Server sedang sibuk. Draft akan dicoba lagi nanti.', 'warning');
      else if (outcome.stoppedReason === 'network') showToast('Server tidak dapat dihubungi. Draft tetap aman di perangkat.', 'warning');
      else if (outcome.submitted === 0 && outcome.needsReview === 0 && outcome.deferred > 0) {
        showToast('Sinkronisasi belum berhasil. Draft tetap aman dan akan dicoba lagi.', 'warning');
      }
    } catch {
      showToast('Sinkronisasi gagal. Draft tetap aman di perangkat.', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [userId, isOnline, refresh, showToast]);

  // Sinkronisasi otomatis: satu kali setiap internet kembali (atau aplikasi dibuka dalam keadaan online).
  const attemptedRef = useRef(false);
  useEffect(() => {
    attemptedRef.current = false;
  }, [userId]);

  useEffect(() => {
    if (!isOnline) {
      attemptedRef.current = false;
      return;
    }
    if (!userId || loading || attemptedRef.current) return;
    if (pendingCount === 0 && missingAddressCount === 0) return;

    attemptedRef.current = true;
    if (autoSync && pendingCount > 0) {
      void syncNow();
    } else if (missingAddressCount > 0) {
      // Reverse geocoding untuk data yang disimpan saat offline.
      void backfillMissingAddresses(userId)
        .then((n) => (n > 0 ? refresh() : undefined))
        .catch(() => undefined);
    }
  }, [isOnline, userId, loading, pendingCount, missingAddressCount, autoSync, syncNow, refresh]);

  const value = useMemo(
    () => ({ isSyncing, pendingCount, needsReviewCount, autoSync, setAutoSync, syncNow }),
    [isSyncing, pendingCount, needsReviewCount, autoSync, setAutoSync, syncNow],
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync harus dipakai di dalam <SyncProvider>');
  return ctx;
}
