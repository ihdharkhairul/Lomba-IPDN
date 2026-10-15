import { config } from '@/config';
import type { AiAnalysis } from '@/types';

export type AiVerdict = 'ok' | 'low_confidence' | 'not_road_damage';

/**
 * Menerjemahkan hasil AI menjadi keputusan alur UI:
 *  - not_road_damage : AI menilai foto bukan kerusakan jalan -> user harus ambil foto ulang
 *  - low_confidence  : AI belum yakin                       -> sarankan foto ulang
 *  - ok              : hasil bisa ditampilkan sebagai rekomendasi
 */
export function getAiVerdict(analysis: AiAnalysis): AiVerdict {
  if (!analysis.isRoadDamage) return 'not_road_damage';
  if (analysis.confidence < config.aiConfidenceThreshold || !analysis.damageType) return 'low_confidence';
  return 'ok';
}

export const VERDICT_MESSAGES: Record<Exclude<AiVerdict, 'ok'>, string> = {
  low_confidence: 'Foto belum dapat dianalisis dengan yakin.',
  not_road_damage: 'Foto tidak menunjukkan kerusakan jalan yang dapat divalidasi.',
};

/** Disclaimer wajib di setiap tampilan hasil AI. */
export const AI_DISCLAIMER = 'Hasil AI merupakan rekomendasi dan tetap perlu diverifikasi petugas.';
