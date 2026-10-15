import type { AiAnalysis, AiErrorCode, AiProviderName, AllowedImageType } from '../../shared/ai';

export interface AnalyzeInput {
  imageBase64: string;
  mimeType: AllowedImageType;
  /** Byte asli gambar (sudah di-decode), dipakai mock provider untuk hasil deterministik. */
  imageBytes: Buffer;
}

/**
 * AI Provider: abstraksi agar mesin analisis dapat diganti tanpa menyentuh UI.
 *
 *   AiProvider
 *   ├── GeminiProvider  (aktif)  -> Google Gemini multimodal
 *   ├── MockProvider    (dev)    -> hasil simulasi deterministik, ditandai "mock"
 *   └── YoloProvider    (belum)  -> tempat model YOLO nyata bila nanti tersedia
 *
 * AI di LAPORIN adalah bantuan validasi visual. Keputusan akhir tetap pada petugas.
 */
export interface AiProvider {
  readonly name: AiProviderName;
  readonly model: string;
  /** false bila konfigurasi (mis. API key) belum lengkap. */
  isConfigured(): boolean;
  analyze(input: AnalyzeInput): Promise<AiAnalysis>;
}

export class AiProviderError extends Error {
  constructor(
    public readonly code: AiErrorCode,
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}
