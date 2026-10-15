import { createHash } from 'node:crypto';
import { DAMAGE_CATEGORIES, SEVERITY_LEVELS, type AiAnalysis } from '../../shared/ai';
import type { AiProvider, AnalyzeInput } from './types';

/**
 * Provider SIMULASI untuk development tanpa API key.
 *
 * - Bukan analisis nyata: TIDAK melihat isi foto. Data hasil tetap bertanda provider="mock"
 *   dan UI menampilkan chip kecil "Mode demo".
 * - Deterministik (TANPA Math.random): foto yang sama selalu menghasilkan hasil yang sama,
 *   sehingga semua jalur UI (berhasil / confidence rendah / bukan jalan) bisa diuji berulang.
 */
export class MockProvider implements AiProvider {
  readonly name = 'mock' as const;
  readonly model = 'mock-deterministic-v1';

  isConfigured(): boolean {
    return true;
  }

  async analyze(input: AnalyzeInput): Promise<AiAnalysis> {
    const digest = createHash('sha256').update(input.imageBytes).digest();
    const bucket = digest[0] % 6; // 0..5

    if (bucket === 0) {
      return {
        isRoadDamage: false,
        damageType: null,
        severity: null,
        confidence: 0.12,
        description: 'Foto tidak menunjukkan kerusakan jalan yang dapat dianalisis.',
        needsManualVerification: true,
      };
    }
    if (bucket === 1) {
      return {
        isRoadDamage: true,
        damageType: DAMAGE_CATEGORIES[0],
        severity: SEVERITY_LEVELS[1],
        confidence: 0.41,
        description: 'Foto kurang jelas sehingga kerusakan tidak dapat dipastikan.',
        needsManualVerification: true,
      };
    }
    const category = DAMAGE_CATEGORIES[digest[1] % DAMAGE_CATEGORIES.length];
    const severity = SEVERITY_LEVELS[digest[2] % SEVERITY_LEVELS.length];
    return {
      isRoadDamage: true,
      damageType: category,
      severity,
      confidence: 0.7 + (digest[3] % 25) / 100, // 0.70 - 0.94, deterministik
      description: `Terlihat indikasi "${category}" pada permukaan jalan.`,
      needsManualVerification: true,
    };
  }
}
