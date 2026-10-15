import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { draftService } from '@/services/reports/draftService';
import { reportService } from '@/services/reports/reportService';
import type {
  AiValidation,
  ConditionType,
  DamageCategory,
  GeoPoint,
  Report,
  ReportDraft,
  SeverityLevel,
} from '@/types';
import { useReportData } from './ReportDataContext';

export interface FlowState {
  /** Terisi bila form ini berasal dari draft yang dilanjutkan. */
  draftId: string | null;
  photo: Blob | null;
  description: string;
  category: DamageCategory | null;
  severity: SeverityLevel | null;
  condition: ConditionType | null;
  location: GeoPoint | null;
  address: string | null;
  ai: AiValidation | null;
}

const EMPTY: FlowState = {
  draftId: null,
  photo: null,
  description: '',
  category: null,
  severity: null,
  condition: null,
  location: null,
  address: null,
  ai: null,
};

export type FlowRequirement = 'photo' | 'location' | 'details' | 'ai';

/** Halaman pertama dalam alur yang masih harus dilengkapi, atau null bila syarat sudah terpenuhi. */
export function firstMissingStep(s: FlowState, upTo: FlowRequirement): string | null {
  if (!s.photo) return '/lapor/foto';
  if (upTo === 'photo') return null;
  if (!s.location) return '/lapor/lokasi';
  if (upTo === 'location') return null;
  if (!s.category || !s.severity || !s.condition) return '/lapor/detail';
  if (upTo === 'details') return null;
  if (!s.ai) return '/lapor/validasi';
  return null;
}

interface ReportFlowValue extends FlowState {
  setPhoto: (blob: Blob | null) => void;
  setDescription: (v: string) => void;
  setCategory: (v: DamageCategory | null) => void;
  setSeverity: (v: SeverityLevel | null) => void;
  setCondition: (v: ConditionType | null) => void;
  setLocation: (point: GeoPoint | null, address?: string | null) => void;
  setAddress: (address: string | null) => void;
  setAi: (ai: AiValidation | null) => void;
  reset: () => void;
  loadFromDraft: (draft: ReportDraft) => void;
  /** Menyimpan form saat ini sebagai draft offline (membuat baru / memperbarui draft yang dilanjutkan). */
  saveAsDraft: () => Promise<ReportDraft>;
  /** Membuat laporan terkirim dari form + hasil AI. Tidak mereset form (pemanggil yang mereset setelah navigasi). */
  submitReport: () => Promise<Report>;
}

const ReportFlowContext = createContext<ReportFlowValue | null>(null);

export function ReportFlowProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { refresh } = useReportData();
  const [state, setState] = useState<FlowState>(EMPTY);

  const patch = useCallback((p: Partial<FlowState>) => setState((s) => ({ ...s, ...p })), []);

  const setPhoto = useCallback((blob: Blob | null) => patch({ photo: blob, ai: null }), [patch]);
  const setLocation = useCallback(
    (point: GeoPoint | null, address: string | null = null) => patch({ location: point, address, ai: null }),
    [patch],
  );

  const reset = useCallback(() => setState(EMPTY), []);

  const loadFromDraft = useCallback((d: ReportDraft) => {
    setState({
      draftId: d.id,
      photo: d.photo,
      description: d.description,
      category: d.category,
      severity: d.severity,
      condition: d.condition,
      location: d.location,
      address: d.address,
      ai: null,
    });
  }, []);

  const saveAsDraft = useCallback(async () => {
    if (!user) throw new Error('Sesi berakhir. Silakan masuk kembali.');
    if (!state.photo) throw new Error('Foto belum dipilih.');
    const draft = await draftService.saveDraft({
      id: state.draftId ?? undefined,
      userId: user.id,
      photo: state.photo,
      description: state.description,
      category: state.category,
      severity: state.severity,
      condition: state.condition,
      location: state.location,
      address: state.address,
    });
    await refresh();
    return draft;
  }, [user, state, refresh]);

  const submitReport = useCallback(async () => {
    if (!user) throw new Error('Sesi berakhir. Silakan masuk kembali.');
    const { photo, category, severity, condition, location, ai } = state;
    if (!photo || !category || !severity || !condition || !location || !ai) {
      throw new Error('Data laporan belum lengkap.');
    }
    const report = await reportService.createReport({
      userId: user.id,
      photo,
      description: state.description,
      category,
      severity,
      condition,
      location,
      address: state.address,
      ai,
      fromOfflineDraft: Boolean(state.draftId),
    });
    if (state.draftId) await draftService.deleteDraft(state.draftId, user.id);
    await refresh();
    return report;
  }, [user, state, refresh]);

  const value = useMemo<ReportFlowValue>(
    () => ({
      ...state,
      setPhoto,
      setDescription: (description) => patch({ description }),
      setCategory: (category) => patch({ category }),
      setSeverity: (severity) => patch({ severity }),
      setCondition: (condition) => patch({ condition }),
      setLocation,
      setAddress: (address) => patch({ address }),
      setAi: (ai) => patch({ ai }),
      reset,
      loadFromDraft,
      saveAsDraft,
      submitReport,
    }),
    [state, setPhoto, setLocation, patch, reset, loadFromDraft, saveAsDraft, submitReport],
  );

  return <ReportFlowContext.Provider value={value}>{children}</ReportFlowContext.Provider>;
}

export function useReportFlow(): ReportFlowValue {
  const ctx = useContext(ReportFlowContext);
  if (!ctx) throw new Error('useReportFlow harus dipakai di dalam <ReportFlowProvider>');
  return ctx;
}

/** Mencegah user melompat ke langkah lanjut (mis. via URL) sebelum langkah sebelumnya terisi. */
export function FlowGuard({ require }: { require: FlowRequirement }) {
  const flow = useReportFlow();
  const redirect = firstMissingStep(flow, require);
  if (redirect) return <Navigate to={redirect} replace />;
  return <Outlet />;
}
