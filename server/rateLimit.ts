import type { NextFunction, Request, Response } from 'express';
import type { ApiErrorBody } from '../shared/ai';

/**
 * Rate limiter sederhana (in-memory, per IP) untuk melindungi kuota Gemini.
 * Cukup untuk prototype satu instance. Untuk produksi multi-instance gunakan
 * store terpusat (Redis) atau rate limit di API gateway.
 */
export function createRateLimiter(maxPerWindow: number, windowMs = 60_000) {
  const hits = new Map<string, number[]>();

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

    if (recent.length >= maxPerWindow) {
      const retryAfter = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      const body: ApiErrorBody = {
        error: { code: 'RATE_LIMITED', message: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' },
      };
      res.status(429).json(body);
      return;
    }

    recent.push(now);
    hits.set(key, recent);

    // Bersihkan entri lama secara berkala agar Map tidak membesar.
    if (hits.size > 5000) {
      for (const [k, v] of hits) {
        if (v.every((t) => now - t >= windowMs)) hits.delete(k);
      }
    }
    next();
  };
}
