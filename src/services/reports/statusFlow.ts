import type { ReportStatus } from '@/types';

/** Urutan tahap penanganan laporan (tanpa draft & rejected). */
export const STATUS_ORDER: readonly ReportStatus[] = [
  'submitted',
  'ai_validated',
  'waiting_verification',
  'verified',
  'forwarded',
  'in_progress',
  'completed',
] as const;

export function statusRank(status: ReportStatus): number {
  return STATUS_ORDER.indexOf(status);
}

export function isTerminal(status: ReportStatus): boolean {
  return status === 'completed' || status === 'rejected';
}

/** Status berikutnya yang wajar (dipakai simulasi petugas di mode demo). */
export function nextStatus(status: ReportStatus): ReportStatus | null {
  if (isTerminal(status) || status === 'draft') return null;
  return STATUS_ORDER[statusRank(status) + 1] ?? null;
}

/** Perubahan status hanya boleh maju, atau ditolak (rejected) selama belum selesai. */
export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  if (from === to || to === 'draft' || isTerminal(from)) return false;
  if (to === 'rejected') return true;
  return statusRank(to) > statusRank(from);
}
