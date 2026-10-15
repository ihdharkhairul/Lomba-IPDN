import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { draftService } from '@/services/reports/draftService';
import { reportService } from '@/services/reports/reportService';
import type { Report, ReportDraft } from '@/types';

interface ReportDataValue {
  /** Laporan terkirim milik user yang sedang login (terbaru dulu). */
  reports: Report[];
  /** Draft offline milik user yang sedang login. */
  drafts: ReportDraft[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ReportDataContext = createContext<ReportDataValue | null>(null);

/**
 * Sumber data tunggal untuk laporan & draft milik user aktif.
 * Menggantikan penumpukan state di App.tsx; data selalu dibaca dari service (IndexedDB),
 * bukan disimpan sebagai salinan di komponen.
 */
export function ReportDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [reports, setReports] = useState<Report[]>([]);
  const [drafts, setDrafts] = useState<ReportDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setReports([]);
      setDrafts([]);
      return;
    }
    try {
      const [r, d] = await Promise.all([reportService.getReports(userId), draftService.getDrafts(userId)]);
      setReports(r);
      setDrafts(d);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membaca data lokal.');
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    setReports([]);
    setDrafts([]);
    if (!userId) return;
    setLoading(true);
    refresh().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, refresh]);

  const value = useMemo(() => ({ reports, drafts, loading, error, refresh }), [reports, drafts, loading, error, refresh]);
  return <ReportDataContext.Provider value={value}>{children}</ReportDataContext.Provider>;
}

export function useReportData(): ReportDataValue {
  const ctx = useContext(ReportDataContext);
  if (!ctx) throw new Error('useReportData harus dipakai di dalam <ReportDataProvider>');
  return ctx;
}
