import type {
  AnalyzeRequestBody,
  AnalyzeResponseBody,
  AllowedImageType,
  ApiErrorBody,
  HealthResponseBody,
} from '../../../shared/ai';
import { ALLOWED_IMAGE_TYPES } from '../../../shared/ai';
import { config } from '@/config';
import type { AiValidation } from '@/types';
import { blobToBase64 } from '@/utils/image';
import { isNetworkAvailable } from '../network';

export type AiClientErrorCode =
  | 'OFFLINE'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'RATE_LIMITED'
  | 'NOT_CONFIGURED'
  | 'NOT_IMPLEMENTED'
  | 'BAD_REQUEST'
  | 'SERVER';

export class AiServiceError extends Error {
  constructor(
    public readonly code: AiClientErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AiServiceError';
  }

  /** Kegagalan sementara: aman dicoba lagi nanti / disimpan sebagai draft. */
  get retryable(): boolean {
    return this.code !== 'BAD_REQUEST' && this.code !== 'ABORTED';
  }
}

function mapServerCode(code: string | undefined): AiClientErrorCode {
  switch (code) {
    case 'RATE_LIMITED':
      return 'RATE_LIMITED';
    case 'NOT_CONFIGURED':
      return 'NOT_CONFIGURED';
    case 'NOT_IMPLEMENTED':
      return 'NOT_IMPLEMENTED';
    case 'INVALID_REQUEST':
    case 'UNSUPPORTED_MEDIA':
    case 'PAYLOAD_TOO_LARGE':
      return 'BAD_REQUEST';
    default:
      return 'SERVER';
  }
}

/**
 * Mengirim foto ke backend (/api/ai/analyze) yang memanggil AI.
 * Frontend TIDAK pernah memegang API key AI.
 * Tidak ada nilai acak: confidence selalu berasal dari server (Gemini atau mock yang ditandai).
 */
export async function analyzePhoto(photo: Blob, options: { signal?: AbortSignal } = {}): Promise<AiValidation> {
  if (!isNetworkAvailable()) {
    throw new AiServiceError('OFFLINE', 'Tidak ada koneksi internet. Validasi AI membutuhkan internet.');
  }

  const mimeType = photo.type as AllowedImageType;
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)) {
    throw new AiServiceError('BAD_REQUEST', 'Format foto tidak didukung untuk validasi AI.');
  }

  const body: AnalyzeRequestBody = { image: await blobToBase64(photo), mimeType };

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, config.aiRequestTimeoutMs);
  const onExternalAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onExternalAbort);

  try {
    let response: Response;
    try {
      response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if (timedOut) throw new AiServiceError('TIMEOUT', 'Validasi AI terlalu lama. Periksa koneksi lalu coba lagi.');
      if (options.signal?.aborted) throw new AiServiceError('ABORTED', 'Validasi dibatalkan.');
      throw new AiServiceError('NETWORK', 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    }

    if (!response.ok) {
      let message = 'Server gagal memproses foto. Coba lagi.';
      let code: string | undefined;
      try {
        const data = (await response.json()) as ApiErrorBody;
        message = data.error?.message ?? message;
        code = data.error?.code;
      } catch {
        /* body bukan JSON */
      }
      throw new AiServiceError(mapServerCode(code), message);
    }

    let data: AnalyzeResponseBody;
    try {
      data = (await response.json()) as AnalyzeResponseBody;
    } catch {
      throw new AiServiceError('SERVER', 'Jawaban server tidak valid.');
    }
    if (!data?.analysis || typeof data.analysis.isRoadDamage !== 'boolean') {
      throw new AiServiceError('SERVER', 'Jawaban server tidak valid.');
    }
    return { ...data.analysis, provider: data.provider, model: data.model, analyzedAt: data.analyzedAt };
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }
}

/** Status layanan AI di server (untuk halaman Pengaturan). Tidak membocorkan API key. */
export async function fetchAiHealth(): Promise<HealthResponseBody | null> {
  if (!isNetworkAvailable()) return null;
  try {
    const res = await fetch('/api/health');
    return res.ok ? ((await res.json()) as HealthResponseBody) : null;
  } catch {
    return null;
  }
}
