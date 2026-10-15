import {
  DAMAGE_CATEGORIES,
  SEVERITY_LEVELS,
  type AiAnalysis,
  type DamageCategory,
  type SeverityLevel,
} from '../../shared/ai';

/**
 * Memvalidasi & merapikan keluaran model (yang tidak boleh dipercaya begitu saja).
 * Mengembalikan null bila bentuknya tidak bisa dipakai sama sekali.
 */
export function normalizeAnalysis(raw: unknown): AiAnalysis | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  if (typeof r.isRoadDamage !== 'boolean') return null;

  const confidenceNum = typeof r.confidence === 'number' ? r.confidence : Number(r.confidence);
  if (!Number.isFinite(confidenceNum)) return null;
  const confidence = Math.min(1, Math.max(0, confidenceNum));

  const damageType = (DAMAGE_CATEGORIES as readonly string[]).includes(r.damageType as string)
    ? (r.damageType as DamageCategory)
    : null;
  const severity = (SEVERITY_LEVELS as readonly string[]).includes(r.severity as string)
    ? (r.severity as SeverityLevel)
    : null;

  const description =
    typeof r.description === 'string' && r.description.trim()
      ? r.description.trim().slice(0, 500)
      : r.isRoadDamage
        ? 'Terlihat indikasi kerusakan pada permukaan jalan.'
        : 'Foto tidak menunjukkan kerusakan jalan yang dapat dianalisis.';

  if (!r.isRoadDamage) {
    return {
      isRoadDamage: false,
      damageType: null,
      severity: null,
      confidence,
      description,
      needsManualVerification: true,
    };
  }

  return {
    isRoadDamage: true,
    damageType,
    severity,
    confidence,
    description,
    // Kebijakan LAPORIN: hasil AI hanya rekomendasi -> selalu perlu verifikasi petugas.
    needsManualVerification: true,
  };
}
