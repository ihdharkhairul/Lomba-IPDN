import type { ReportDraft } from '@/types';
import { AiServiceError, analyzePhoto } from '../ai/aiService';
import { getAiVerdict, VERDICT_MESSAGES } from '../ai/verdict';
import { reverseGeocode, type GeocodeResult } from '../map/geocoding';
import { isNetworkAvailable } from '../network';
import { draftService, type DraftService } from '../reports/draftService';
import { reportService, type ReportService } from '../reports/reportService';

export interface SyncDeps {
  analyze: typeof analyzePhoto;
  geocode: (lat: number, lng: number) => Promise<GeocodeResult>;
  reports: ReportService;
  drafts: DraftService;
  isOnline: () => boolean;
}

export interface SyncOutcome {
  /** Jumlah draft yang berhasil menjadi laporan terkirim. */
  submitted: number;
  /** Draft yang butuh diperiksa user (AI belum yakin / bukan jalan / data kurang). */
  needsReview: number;
  /** Draft yang gagal karena masalah sementara & akan dicoba lagi. */
  deferred: number;
  stoppedReason: 'offline' | 'not_configured' | 'rate_limited' | 'network' | null;
}

const defaultDeps: SyncDeps = {
  analyze: analyzePhoto,
  geocode: reverseGeocode,
  reports: reportService,
  drafts: draftService,
  isOnline: isNetworkAvailable,
};

/** Draft siap dikirim hanya bila semua data wajib sudah terisi. */
export function isDraftComplete(
  d: Pick<ReportDraft, 'category' | 'severity' | 'condition' | 'location'>,
): boolean {
  return Boolean(d.category && d.severity && d.condition && d.location);
}

let running: Promise<SyncOutcome> | null = null;

/**
 * Sinkronisasi draft offline -> AI Validation -> laporan terkirim.
 *
 * Aturan: draft hanya otomatis menjadi laporan bila AI yakin bahwa foto adalah kerusakan jalan.
 * Bila tidak, draft ditandai NEEDS_REVIEW agar user memutuskan sendiri (ganti foto / kirim manual).
 * Hanya satu proses sinkronisasi berjalan pada satu waktu.
 */
export function syncPendingDrafts(userId: string, deps: SyncDeps = defaultDeps): Promise<SyncOutcome> {
  if (running) return running;
  running = doSync(userId, deps).finally(() => {
    running = null;
  });
  return running;
}

async function doSync(userId: string, deps: SyncDeps): Promise<SyncOutcome> {
  const outcome: SyncOutcome = { submitted: 0, needsReview: 0, deferred: 0, stoppedReason: null };
  const pending = (await deps.drafts.getDrafts(userId))
    .filter((d) => d.syncStatus === 'PENDING_SYNC')
    .reverse(); // yang paling lama dulu

  for (const draft of pending) {
    if (!deps.isOnline()) {
      outcome.stoppedReason = 'offline';
      break;
    }
    await deps.drafts.setSyncState(draft.id, userId, 'SYNCING', null);

    if (!isDraftComplete(draft)) {
      await deps.drafts.setSyncState(draft.id, userId, 'NEEDS_REVIEW', 'Detail laporan belum lengkap. Lengkapi lalu kirim.');
      outcome.needsReview++;
      continue;
    }

    try {
      let address = draft.address;
      if (!address) {
        const geo = await deps.geocode(draft.location!.latitude, draft.location!.longitude);
        if (geo.status === 'ok') address = geo.address;
      }

      const ai = await deps.analyze(draft.photo);
      const verdict = getAiVerdict(ai);
      if (verdict !== 'ok') {
        await deps.drafts.setSyncState(
          draft.id,
          userId,
          'NEEDS_REVIEW',
          `Validasi AI: ${VERDICT_MESSAGES[verdict]} Periksa atau ambil foto ulang.`,
        );
        outcome.needsReview++;
        continue;
      }

      await deps.reports.createReport({
        userId,
        photo: draft.photo,
        description: draft.description,
        category: draft.category!,
        severity: draft.severity!,
        condition: draft.condition!,
        location: draft.location!,
        address,
        ai,
        fromOfflineDraft: true,
      });
      await deps.drafts.deleteDraft(draft.id, userId);
      outcome.submitted++;
    } catch (err) {
      const message = err instanceof AiServiceError ? err.message : 'Gagal menyinkronkan draft. Akan dicoba lagi.';
      await deps.drafts.setSyncState(draft.id, userId, 'PENDING_SYNC', message);
      outcome.deferred++;
      if (err instanceof AiServiceError) {
        const stop =
          err.code === 'OFFLINE' ? 'offline'
          : err.code === 'NETWORK' || err.code === 'TIMEOUT' ? 'network'
          : err.code === 'NOT_CONFIGURED' ? 'not_configured'
          : err.code === 'RATE_LIMITED' ? 'rate_limited'
          : null;
        if (stop) {
          outcome.stoppedReason = stop;
          break;
        }
      }
    }
  }
  return outcome;
}

/**
 * Melengkapi alamat untuk draft/laporan yang disimpan saat offline (hanya koordinat).
 * Mengembalikan jumlah alamat yang berhasil diperbarui.
 */
export async function backfillMissingAddresses(userId: string, deps: SyncDeps = defaultDeps): Promise<number> {
  let updated = 0;

  const drafts = (await deps.drafts.getDrafts(userId)).filter((d) => !d.address && d.location);
  for (const d of drafts) {
    if (!deps.isOnline()) return updated;
    const geo = await deps.geocode(d.location!.latitude, d.location!.longitude);
    if (geo.status === 'ok') {
      await deps.drafts.updateDraftAddress(d.id, userId, geo.address);
      updated++;
    } else if (geo.status !== 'no_result') return updated; // offline / belum dikonfigurasi / error: berhenti
  }

  const reports = (await deps.reports.getReports(userId)).filter((r) => !r.address);
  for (const r of reports) {
    if (!deps.isOnline()) return updated;
    const geo = await deps.geocode(r.location.latitude, r.location.longitude);
    if (geo.status === 'ok') {
      await deps.reports.updateReportAddress(r.id, userId, geo.address);
      updated++;
    } else if (geo.status !== 'no_result') return updated;
  }
  return updated;
}
