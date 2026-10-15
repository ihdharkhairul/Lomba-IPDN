import type { ReportStatus } from '@/types';
import { statusRank } from '@/services/reports/statusFlow';

export type StatusTone = 'slate' | 'blue' | 'amber' | 'emerald' | 'red';

export const STATUS_META: Record<ReportStatus, { label: string; tone: StatusTone }> = {
  draft: { label: 'Draft', tone: 'slate' },
  submitted: { label: 'Laporan Dikirim', tone: 'blue' },
  ai_validated: { label: 'Divalidasi AI', tone: 'blue' },
  waiting_verification: { label: 'Menunggu Verifikasi Petugas', tone: 'blue' },
  verified: { label: 'Terverifikasi Petugas', tone: 'blue' },
  forwarded: { label: 'Diteruskan', tone: 'amber' },
  in_progress: { label: 'Dalam Penanganan', tone: 'amber' },
  completed: { label: 'Selesai', tone: 'emerald' },
  rejected: { label: 'Ditolak', tone: 'red' },
};

export const TONE_CLASSES: Record<StatusTone, string> = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  red: 'bg-red-100 text-red-800 border-red-200',
};

/** Marker peta berdasarkan nada status. */
export const TONE_COLORS: Record<StatusTone, string> = {
  slate: '#64748b',
  blue: '#2563eb',
  amber: '#f59e0b',
  emerald: '#059669',
  red: '#dc2626',
};

/** Kelompok filter di halaman Riwayat. */
export type HistoryFilter = 'semua' | 'diproses' | 'ditindaklanjuti' | 'selesai' | 'ditolak';

export function filterOf(status: ReportStatus): Exclude<HistoryFilter, 'semua'> {
  if (status === 'completed') return 'selesai';
  if (status === 'rejected') return 'ditolak';
  if (status === 'forwarded' || status === 'in_progress') return 'ditindaklanjuti';
  return 'diproses';
}

export type TimelineState = 'done' | 'active' | 'pending' | 'rejected';

export interface TimelineStep {
  key: string;
  title: string;
  description: string;
  state: TimelineState;
}

/** Tahap timeline & status minimal agar tahap itu dianggap selesai. */
const STEPS: { key: string; title: string; description: string; doneAt: ReportStatus }[] = [
  { key: 'submitted', title: 'Laporan Dikirim', description: 'Laporan berhasil dikirim beserta foto dan koordinat GPS.', doneAt: 'submitted' },
  { key: 'ai', title: 'Validasi AI', description: 'Foto dianalisis AI sebagai bantuan validasi visual.', doneAt: 'ai_validated' },
  { key: 'verify', title: 'Verifikasi Petugas', description: 'Petugas memeriksa laporan dan hasil rekomendasi AI.', doneAt: 'verified' },
  { key: 'forward', title: 'Diteruskan', description: 'Laporan diteruskan ke instansi/unit yang menangani jalan tersebut.', doneAt: 'forwarded' },
  { key: 'progress', title: 'Dalam Penanganan', description: 'Perbaikan jalan sedang dikerjakan di lokasi.', doneAt: 'completed' },
  { key: 'done', title: 'Selesai', description: 'Perbaikan selesai dan jalan kembali aman dilalui.', doneAt: 'completed' },
];

/**
 * Menghitung timeline dari status laporan.
 *   done    -> tahap sudah lewat
 *   active  -> tahap yang sedang berjalan (tepat satu)
 *   pending -> belum dimulai
 *   rejected-> laporan ditolak pada tahap verifikasi
 */
export function buildTimeline(status: ReportStatus): TimelineStep[] {
  if (status === 'rejected') {
    return STEPS.map((s, i) => ({
      key: s.key,
      title: s.title,
      description: s.description,
      state: i < 2 ? 'done' : i === 2 ? 'rejected' : 'pending',
    }));
  }
  const rank = statusRank(status);
  let activeAssigned = false;
  return STEPS.map((s) => {
    const done = rank >= statusRank(s.doneAt);
    let state: TimelineState = 'done';
    if (!done) {
      state = activeAssigned ? 'pending' : 'active';
      activeAssigned = true;
    }
    return { key: s.key, title: s.title, description: s.description, state };
  });
}
