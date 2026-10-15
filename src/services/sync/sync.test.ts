// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { AiServiceError } from '../ai/aiService';
import { draftService } from '../reports/draftService';
import { reportService } from '../reports/reportService';
import { backfillMissingAddresses, syncPendingDrafts, type SyncDeps } from './syncService';
import type { AiValidation, GeoPoint } from '@/types';

const geo: GeoPoint = { latitude: -6.974123, longitude: 107.630567, accuracy: 12, timestamp: Date.now() };
const aiOk: AiValidation = { isRoadDamage: true, damageType: 'Jalan Berlubang', severity: 'Sedang', confidence: 0.91, description: 'Lubang.', needsManualVerification: true, provider: 'gemini', model: 'x', analyzedAt: new Date().toISOString() };
const photo = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])], { type: 'image/jpeg' });

const complete = (userId: string) => ({
  userId, photo: photo(), description: 'Lubang besar', category: 'Jalan Berlubang' as const,
  severity: 'Sedang' as const, condition: 'Masih Terjadi' as const, location: geo, address: null,
});

function deps(over: Partial<SyncDeps> = {}): SyncDeps {
  return {
    analyze: vi.fn(async () => aiOk),
    geocode: vi.fn(async () => ({ status: 'ok' as const, address: 'Jl. Contoh No. 1, Bandung' })),
    reports: reportService,
    drafts: draftService,
    isOnline: () => true,
    ...over,
  };
}

describe('draft offline -> sinkronisasi', () => {
  it('draft menyimpan koordinat, akurasi, timestamp & berstatus PENDING_SYNC', async () => {
    const d = await draftService.saveDraft({ ...complete('u1') });
    expect(d.syncStatus).toBe('PENDING_SYNC');
    expect(d.location).toMatchObject({ latitude: -6.974123, longitude: 107.630567, accuracy: 12 });
    expect(d.photo.size).toBeGreaterThan(0);
  });

  it('online + AI yakin: draft menjadi laporan terkirim (waiting_verification), draft dihapus, alamat terisi', async () => {
    await draftService.saveDraft({ ...complete('u1') });
    const d = deps();
    const out = await syncPendingDrafts('u1', d);
    expect(out).toMatchObject({ submitted: 1, needsReview: 0, deferred: 0, stoppedReason: null });

    expect(await draftService.getDrafts('u1')).toHaveLength(0);
    const [r] = await reportService.getReports('u1');
    expect(r.status).toBe('waiting_verification');
    expect(r.statusHistory.map((e) => e.status)).toEqual(['submitted', 'ai_validated', 'waiting_verification']);
    expect(r.fromOfflineDraft).toBe(true);
    expect(r.address).toBe('Jl. Contoh No. 1, Bandung');
    expect(r.ticketNumber).toMatch(/^LAP-\d{4}-\d{5}$/);
  });

  it('offline: tidak ada yang dikirim, draft tetap aman', async () => {
    await draftService.saveDraft({ ...complete('u1') });
    const d = deps({ isOnline: () => false });
    const out = await syncPendingDrafts('u1', d);
    expect(out.stoppedReason).toBe('offline');
    expect(d.analyze).not.toHaveBeenCalled();
    expect((await draftService.getDrafts('u1'))[0].syncStatus).toBe('PENDING_SYNC');
    expect(await reportService.getReports('u1')).toHaveLength(0);
  });

  it('AI menilai bukan jalan / ragu: TIDAK otomatis terkirim, ditandai NEEDS_REVIEW', async () => {
    await draftService.saveDraft({ ...complete('u1') });
    await syncPendingDrafts('u1', deps({ analyze: vi.fn(async () => ({ ...aiOk, isRoadDamage: false, damageType: null, severity: null, confidence: 0.12 })) }));
    const [draft] = await draftService.getDrafts('u1');
    expect(draft.syncStatus).toBe('NEEDS_REVIEW');
    expect(draft.syncMessage).toMatch(/tidak menunjukkan kerusakan jalan/);
    expect(await reportService.getReports('u1')).toHaveLength(0);

    await draftService.saveDraft({ ...complete('u1'), id: draft.id });
    await syncPendingDrafts('u1', deps({ analyze: vi.fn(async () => ({ ...aiOk, confidence: 0.4 })) }));
    expect((await draftService.getDrafts('u1'))[0].syncMessage).toMatch(/belum dapat dianalisis dengan yakin/);
  });

  it('gagal jaringan: draft kembali PENDING_SYNC dengan pesan, proses berhenti', async () => {
    await draftService.saveDraft({ ...complete('u1') });
    const out = await syncPendingDrafts('u1', deps({ analyze: vi.fn(async () => { throw new AiServiceError('NETWORK', 'Tidak dapat terhubung ke server.'); }) }));
    expect(out).toMatchObject({ submitted: 0, deferred: 1, stoppedReason: 'network' });
    const [draft] = await draftService.getDrafts('u1');
    expect(draft.syncStatus).toBe('PENDING_SYNC');
    expect(draft.syncMessage).toMatch(/terhubung/);
  });

  it('draft belum lengkap -> NEEDS_REVIEW tanpa memanggil AI', async () => {
    await draftService.saveDraft({ ...complete('u1'), category: null });
    const d = deps();
    const out = await syncPendingDrafts('u1', d);
    expect(out.needsReview).toBe(1);
    expect(d.analyze).not.toHaveBeenCalled();
  });

  it('data terisolasi per pengguna', async () => {
    const draft = await draftService.saveDraft({ ...complete('u1') });
    expect(await draftService.getDrafts('u2')).toHaveLength(0);
    expect(await draftService.getDraftById(draft.id, 'u2')).toBeNull();
    await syncPendingDrafts('u1', deps());
    const [r] = await reportService.getReports('u1');
    expect(await reportService.getReportById(r.id, 'u2')).toBeNull();
    expect(await reportService.getReports('u2')).toHaveLength(0);
  });

  it('alamat yang kosong saat offline dilengkapi (reverse geocoding) saat online', async () => {
    const draft = await draftService.saveDraft({ ...complete('u1') });
    const n = await backfillMissingAddresses('u1', deps());
    expect(n).toBe(1);
    expect((await draftService.getDraftById(draft.id, 'u1'))?.address).toBe('Jl. Contoh No. 1, Bandung');
  });

  it('backfill berhenti tanpa error bila geocoding belum dikonfigurasi', async () => {
    await draftService.saveDraft({ ...complete('u1') });
    const n = await backfillMissingAddresses('u1', deps({ geocode: vi.fn(async () => ({ status: 'unconfigured' as const })) }));
    expect(n).toBe(0);
    expect((await draftService.getDrafts('u1'))[0].address).toBeNull(); // koordinat tetap tersimpan
  });

  it('status laporan hanya boleh maju', async () => {
    await draftService.saveDraft({ ...complete('u1') });
    await syncPendingDrafts('u1', deps());
    const [r] = await reportService.getReports('u1');
    const v = await reportService.updateReportStatus(r.id, 'u1', 'verified');
    expect(v.status).toBe('verified');
    await expect(reportService.updateReportStatus(r.id, 'u1', 'waiting_verification')).rejects.toThrow();
  });
});
