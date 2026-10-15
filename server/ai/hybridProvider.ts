import type { AiAnalysis } from '../../shared/ai';
import type { AiProvider, AnalyzeInput } from './types';

/**
 * HYBRID = dua pemeriksa berurutan:
 *   1) YOLO lokal sebagai penyaring pertama (cepat, tanpa kuota). Bila YOLO tidak menemukan kerusakan -> ditolak
 *      tanpa memanggil Gemini (hemat kuota).
 *   2) Gemini sebagai pemeriksa kedua. Bila Gemini menilai bukan kerusakan jalan -> ditolak.
 * Diterima hanya bila KEDUANYA setuju. Jenis kerusakan dari YOLO, tingkat & deskripsi dari Gemini,
 * confidence = yang terendah dari keduanya.
 *
 * Konsekuensi: aturan ini ketat. Kerusakan yang terlewat oleh YOLO tidak akan sampai ke Gemini.
 */
export class HybridProvider implements AiProvider {
  readonly name = 'hybrid' as const;
  readonly model: string;

  constructor(
    private readonly yolo: AiProvider,
    private readonly gemini: AiProvider,
  ) {
    this.model = `${yolo.model} + ${gemini.model}`;
  }

  isConfigured(): boolean {
    return this.yolo.isConfigured() && this.gemini.isConfigured();
  }

  async analyze(input: AnalyzeInput): Promise<AiAnalysis> {
    const y = await this.yolo.analyze(input);
    if (!y.isRoadDamage) return y;

    const g = await this.gemini.analyze(input);
    if (!g.isRoadDamage) return { ...g, damageType: null, severity: null };

    return {
      isRoadDamage: true,
      damageType: y.damageType ?? g.damageType,
      severity: g.severity ?? y.severity,
      confidence: Math.round(Math.min(y.confidence, g.confidence) * 100) / 100,
      description: g.description,
      needsManualVerification: true,
    };
  }
}
