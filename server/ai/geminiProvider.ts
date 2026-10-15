import { ApiError, GoogleGenAI, Type } from '@google/genai';
import { DAMAGE_CATEGORIES, SEVERITY_LEVELS, type AiAnalysis } from '../../shared/ai';
import { normalizeAnalysis } from './normalize';
import { SYSTEM_PROMPT, USER_PROMPT } from './prompt';
import { AiProviderError, type AiProvider, type AnalyzeInput } from './types';

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isRoadDamage: { type: Type.BOOLEAN },
    damageType: { type: Type.STRING, enum: [...DAMAGE_CATEGORIES], nullable: true },
    severity: { type: Type.STRING, enum: [...SEVERITY_LEVELS], nullable: true },
    confidence: { type: Type.NUMBER },
    description: { type: Type.STRING },
    needsManualVerification: { type: Type.BOOLEAN },
  },
  required: ['isRoadDamage', 'confidence', 'description', 'needsManualVerification'],
};

/** Klien minimal yang dibutuhkan (memudahkan pengujian tanpa memanggil Google). */
export interface GeminiClientLike {
  models: { generateContent: (params: never) => Promise<{ text?: string }> };
}

export interface GeminiOptions {
  /** Model cadangan dipakai bila model utama terus gagal karena Google sedang padat (5xx). */
  fallbackModel?: string;
  /** Jeda antar percobaan ulang pada error sementara. Default: 800 ms lalu 2000 ms (2 kali ulang). */
  retryDelaysMs?: number[];
  client?: GeminiClientLike;
}

/** Error sementara dari sisi Google: aman dicoba ulang. */
const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Provider nyata: Google Gemini (multimodal).
 * API key hanya dibaca di server dan TIDAK pernah dikirim ke frontend.
 *
 * Ketahanan: error sementara (503 "high demand", 500, 502, 504) dicoba ulang otomatis,
 * lalu — bila GEMINI_FALLBACK_MODEL diisi — beralih ke model cadangan.
 */
export class GeminiProvider implements AiProvider {
  readonly name = 'gemini' as const;
  private client: GeminiClientLike | null;
  private readonly fallbackModel?: string;
  private readonly retryDelaysMs: number[];

  constructor(
    private readonly apiKey: string | undefined,
    readonly model: string,
    options: GeminiOptions = {},
  ) {
    this.client = options.client ?? null;
    this.fallbackModel = options.fallbackModel && options.fallbackModel !== model ? options.fallbackModel : undefined;
    this.retryDelaysMs = options.retryDelaysMs ?? [800, 2000];
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim() && this.apiKey !== 'MY_GEMINI_API_KEY');
  }

  private statusOf(err: unknown): number | undefined {
    return err instanceof ApiError ? err.status : undefined;
  }

  private async callModel(model: string, input: AnalyzeInput): Promise<string | undefined> {
    const params = {
      model,
      contents: [
        {
          role: 'user',
          parts: [{ inlineData: { mimeType: input.mimeType, data: input.imageBase64 } }, { text: USER_PROMPT }],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    };
    const response = await this.client!.models.generateContent(params as never);
    return response.text;
  }

  /** Mencoba satu model dengan percobaan ulang pada error sementara. */
  private async callWithRetry(model: string, input: AnalyzeInput): Promise<string | undefined> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.callModel(model, input);
      } catch (err) {
        const status = this.statusOf(err);
        const detail = err instanceof Error ? err.message : String(err);
        console.error(`[gemini] ${model} gagal`, status ?? '(tanpa status)', detail.slice(0, 200));
        if (status !== undefined && RETRYABLE_STATUS.has(status) && attempt < this.retryDelaysMs.length) {
          await sleep(this.retryDelaysMs[attempt]);
          continue;
        }
        throw err;
      }
    }
  }

  async analyze(input: AnalyzeInput): Promise<AiAnalysis> {
    if (!this.isConfigured()) {
      throw new AiProviderError('NOT_CONFIGURED', 'Layanan AI belum dikonfigurasi di server (GEMINI_API_KEY belum diatur).', 503);
    }
    this.client ??= new GoogleGenAI({ apiKey: this.apiKey }) as unknown as GeminiClientLike;

    let text: string | undefined;
    try {
      try {
        text = await this.callWithRetry(this.model, input);
      } catch (err) {
        const status = this.statusOf(err);
        // Google padat terus -> coba model cadangan (bila ada).
        if (this.fallbackModel && status !== undefined && RETRYABLE_STATUS.has(status)) {
          console.warn(`[gemini] beralih ke model cadangan: ${this.fallbackModel}`);
          text = await this.callWithRetry(this.fallbackModel, input);
        } else {
          throw err;
        }
      }
    } catch (err) {
      // Jangan bocorkan detail upstream / key ke klien; detail sudah di log server.
      const status = this.statusOf(err);
      const detail = err instanceof Error ? err.message : String(err);
      if (status === 429) {
        throw new AiProviderError('RATE_LIMITED', 'Kuota layanan AI sedang penuh. Coba lagi sebentar lagi.', 429);
      }
      if (status === 401 || status === 403 || (status === 400 && /api key|api_key|key not valid/i.test(detail))) {
        throw new AiProviderError('NOT_CONFIGURED', 'GEMINI_API_KEY ditolak oleh Google (tidak valid / belum aktif). Periksa key di .env.local lalu restart server.', 503);
      }
      if (status === 404) {
        throw new AiProviderError('NOT_CONFIGURED', `Model AI "${this.model}" tidak tersedia. Periksa GEMINI_MODEL.`, 503);
      }
      if (status !== undefined && RETRYABLE_STATUS.has(status)) {
        throw new AiProviderError('UPSTREAM_ERROR', 'Layanan AI Google sedang padat. Coba lagi beberapa saat lagi.', 503);
      }
      if (status === undefined && /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|ECONNRESET|certificate/i.test(detail)) {
        throw new AiProviderError('UPSTREAM_ERROR', 'Server tidak dapat menjangkau Google (periksa internet/firewall/proxy di komputer server).', 502);
      }
      throw new AiProviderError('UPSTREAM_ERROR', 'Layanan AI mengembalikan error. Lihat log server untuk detailnya.', 502);
    }

    if (!text) {
      throw new AiProviderError('BAD_AI_RESPONSE', 'AI tidak mengembalikan hasil. Coba ambil foto ulang.', 502);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new AiProviderError('BAD_AI_RESPONSE', 'Format jawaban AI tidak valid. Coba lagi.', 502);
    }

    const analysis = normalizeAnalysis(parsed);
    if (!analysis) {
      throw new AiProviderError('BAD_AI_RESPONSE', 'Format jawaban AI tidak valid. Coba lagi.', 502);
    }
    return analysis;
  }
}
