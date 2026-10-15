/**
 * Kontrak data yang dipakai bersama oleh frontend (src/) dan backend (server/).
 * Satu sumber kebenaran agar format JSON hasil AI selalu konsisten.
 */

export const DAMAGE_CATEGORIES = [
  'Jalan Berlubang',
  'Jalan Retak (Buaya)',
  'Jalan Rusak Berat / Amblas',
  'Kerusakan Permukaan / Mengelupas',
] as const;
export type DamageCategory = (typeof DAMAGE_CATEGORIES)[number];

export const SEVERITY_LEVELS = ['Ringan', 'Sedang', 'Berat'] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** Batas ukuran foto (setelah di-decode) yang diterima server: 8 MB. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Hasil analisis AI. Bentuknya sama persis dengan contoh JSON pada spesifikasi:
 * - Jika foto bukan kerusakan jalan: isRoadDamage=false, damageType=null, severity=null.
 * - needsManualVerification SELALU true: hasil AI hanyalah rekomendasi.
 */
export interface AiAnalysis {
  isRoadDamage: boolean;
  damageType: DamageCategory | null;
  severity: SeverityLevel | null;
  /** 0..1 */
  confidence: number;
  description: string;
  needsManualVerification: boolean;
}

/** gemini = Google Gemini, yolo = model YOLO lokal (.onnx), hybrid = YOLO lalu Gemini, mock = simulasi (ditandai di UI). */
export type AiProviderName = 'gemini' | 'mock' | 'yolo' | 'hybrid';

export interface AnalyzeRequestBody {
  /** Base64 murni (tanpa prefix data:...). */
  image: string;
  mimeType: AllowedImageType;
}

export interface AnalyzeResponseBody {
  analysis: AiAnalysis;
  provider: AiProviderName;
  model: string;
  analyzedAt: string;
}

export type AiErrorCode =
  | 'INVALID_REQUEST'
  | 'UNSUPPORTED_MEDIA'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'NOT_CONFIGURED'
  | 'NOT_IMPLEMENTED'
  | 'UPSTREAM_ERROR'
  | 'BAD_AI_RESPONSE'
  | 'NOT_FOUND'
  | 'INTERNAL';

export interface ApiErrorBody {
  error: { code: AiErrorCode; message: string };
}

export interface HealthResponseBody {
  status: 'ok';
  ai: {
    mode: string;
    provider: AiProviderName;
    model: string;
    /** true bila provider siap dipakai (mis. GEMINI_API_KEY terisi). Nilai key TIDAK pernah dikirim. */
    configured: boolean;
  };
}
