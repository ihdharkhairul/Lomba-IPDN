import express, { Router, type ErrorRequestHandler } from 'express';
import type { AnalyzeResponseBody, ApiErrorBody, HealthResponseBody } from '../shared/ai';
import { createProviderFromEnv, resolveAiMode, type AiProvider } from './ai';
import { AiProviderError } from './ai/types';
import { createRateLimiter } from './rateLimit';
import { validateAnalyzeBody } from './validation';

export interface ApiOptions {
  /** Inject provider (dipakai di test). Default: dipilih dari env AI_MODE. */
  provider?: AiProvider;
  rateLimitPerMinute?: number;
}

export function createApiRouter(options: ApiOptions = {}): Router {
  const provider = options.provider ?? createProviderFromEnv();
  const limit = options.rateLimitPerMinute ?? (Number(process.env.AI_RATE_LIMIT_PER_MINUTE) || 20);
  const router = Router();

  router.get('/health', (_req, res) => {
    const body: HealthResponseBody = {
      status: 'ok',
      ai: {
        mode: resolveAiMode(),
        provider: provider.name,
        model: provider.model,
        configured: provider.isConfigured(),
      },
    };
    res.json(body);
  });

  // Foto dikirim sebagai base64 dalam JSON (maks ~8 MB setelah decode).
  router.post(
    '/ai/analyze',
    createRateLimiter(limit),
    express.json({ limit: '12mb' }),
    async (req, res) => {
      const checked = validateAnalyzeBody(req.body);
      if (!checked.ok) {
        res.status(checked.status).json(checked.body);
        return;
      }

      try {
        const analysis = await provider.analyze({
          imageBase64: checked.base64,
          mimeType: checked.mimeType,
          imageBytes: checked.bytes,
        });
        const body: AnalyzeResponseBody = {
          analysis,
          provider: provider.name,
          model: provider.model,
          analyzedAt: new Date().toISOString(),
        };
        res.json(body);
      } catch (err) {
        if (err instanceof AiProviderError) {
          const body: ApiErrorBody = { error: { code: err.code, message: err.message } };
          res.status(err.httpStatus).json(body);
          return;
        }
        console.error('[api] error tak terduga pada /ai/analyze', err);
        const body: ApiErrorBody = { error: { code: 'INTERNAL', message: 'Terjadi kesalahan pada server.' } };
        res.status(500).json(body);
      }
    },
  );

  router.use((_req, res) => {
    const body: ApiErrorBody = { error: { code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan.' } };
    res.status(404).json(body);
  });

  // Error dari body-parser (JSON rusak / terlalu besar) -> format error yang konsisten.
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const type = (err as { type?: string }).type;
    if (type === 'entity.too.large') {
      const body: ApiErrorBody = { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Ukuran foto terlalu besar (maksimal 8 MB).' } };
      res.status(413).json(body);
      return;
    }
    if (type === 'entity.parse.failed') {
      const body: ApiErrorBody = { error: { code: 'INVALID_REQUEST', message: 'Body JSON tidak valid.' } };
      res.status(400).json(body);
      return;
    }
    console.error('[api] error', err);
    const body: ApiErrorBody = { error: { code: 'INTERNAL', message: 'Terjadi kesalahan pada server.' } };
    res.status(500).json(body);
  };
  router.use(errorHandler);

  return router;
}
