import { describe, expect, it } from 'vitest';
import type { AiAnalysis } from '@/types';
import { getAiVerdict } from './verdict';

const base: AiAnalysis = { isRoadDamage: true, damageType: 'Jalan Berlubang', severity: 'Sedang', confidence: 0.9, description: 'x', needsManualVerification: true };

describe('keputusan validasi AI', () => {
  it('jalan rusak & yakin -> ok', () => expect(getAiVerdict(base)).toBe('ok'));
  it('bukan kerusakan jalan -> ditolak', () => expect(getAiVerdict({ ...base, isRoadDamage: false, damageType: null, severity: null, confidence: 0.12 })).toBe('not_road_damage'));
  it('bukan jalan walau confidence tinggi tetap ditolak', () => expect(getAiVerdict({ ...base, isRoadDamage: false, confidence: 0.95 })).toBe('not_road_damage'));
  it('confidence rendah -> belum yakin', () => expect(getAiVerdict({ ...base, confidence: 0.4 })).toBe('low_confidence'));
  it('jenis kerusakan kosong -> belum yakin', () => expect(getAiVerdict({ ...base, damageType: null })).toBe('low_confidence'));
});
