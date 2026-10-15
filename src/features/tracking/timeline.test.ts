import { describe, expect, it } from 'vitest';
import { canTransition, nextStatus } from '@/services/reports/statusFlow';
import { buildTimeline } from './statusMeta';

const states = (s: Parameters<typeof buildTimeline>[0]) => buildTimeline(s).map((t) => t.state);

describe('timeline status', () => {
  it('menunggu verifikasi: ✓ Dikirim ✓ AI ● Verifikasi ○ ○ ○', () => {
    expect(states('waiting_verification')).toEqual(['done', 'done', 'active', 'pending', 'pending', 'pending']);
  });
  it('selesai: semua done', () => {
    expect(states('completed').every((s) => s === 'done')).toBe(true);
  });
  it('ditolak: berhenti di verifikasi', () => {
    expect(states('rejected')).toEqual(['done', 'done', 'rejected', 'pending', 'pending', 'pending']);
  });
  it('selalu tepat satu tahap aktif selama belum final', () => {
    for (const s of ['submitted', 'ai_validated', 'waiting_verification', 'verified', 'forwarded', 'in_progress'] as const) {
      expect(states(s).filter((x) => x === 'active')).toHaveLength(1);
    }
  });
  it('transisi hanya maju atau ditolak', () => {
    expect(canTransition('waiting_verification', 'verified')).toBe(true);
    expect(canTransition('verified', 'waiting_verification')).toBe(false);
    expect(canTransition('in_progress', 'rejected')).toBe(true);
    expect(canTransition('completed', 'rejected')).toBe(false);
    expect(nextStatus('completed')).toBeNull();
  });
});
