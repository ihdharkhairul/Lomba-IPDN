// @vitest-environment node
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiRouter } from './api';
import { GeminiProvider } from './ai/geminiProvider';
import { MockProvider } from './ai/mockProvider';
import { resolveAiMode } from './ai';

// JPEG minimal (hanya magic bytes yang dicek server) + variasi agar hash berbeda.
const jpeg = (seed = 0) => Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, seed, 0x01, 0x02, 0x03]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const j = async (res: Response): Promise<any> => res.json();
const body = (buf: Buffer, mimeType = 'image/jpeg') => JSON.stringify({ image: buf.toString('base64'), mimeType });

function start(router: express.Router): Promise<{ server: Server; url: string }> {
  const app = express();
  app.use('/api', router);
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve({ server, url: `http://127.0.0.1:${(server.address() as AddressInfo).port}` }));
  });
}
const post = (url: string, payload: string) =>
  fetch(`${url}/api/ai/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });

describe('API /api/ai/analyze (MockProvider)', () => {
  let ctx: { server: Server; url: string };
  beforeAll(async () => {
    ctx = await start(createApiRouter({ provider: new MockProvider(), rateLimitPerMinute: 1000 }));
  });
  afterAll(() => ctx.server.close());

  it('mengembalikan JSON sesuai kontrak & menandai provider mock', async () => {
    const res = await post(ctx.url, body(jpeg()));
    expect(res.status).toBe(200);
    const data = await j(res);
    expect(data.provider).toBe('mock');
    expect(Object.keys(data.analysis).sort()).toEqual(
      ['confidence', 'damageType', 'description', 'isRoadDamage', 'needsManualVerification', 'severity'],
    );
    expect(data.analysis.confidence).toBeGreaterThanOrEqual(0);
    expect(data.analysis.confidence).toBeLessThanOrEqual(1);
    expect(data.analysis.needsManualVerification).toBe(true);
    expect(data.model).toBe('mock-deterministic-v1');
  });

  it('deterministik: foto sama -> hasil sama (tidak ada Math.random)', async () => {
    const a = await j(await post(ctx.url, body(jpeg(7))));
    const b = await j(await post(ctx.url, body(jpeg(7))));
    expect(a.analysis).toEqual(b.analysis);
  });

  it('semua jalur UI dapat dicapai oleh mock (bukan jalan / ragu / berhasil)', async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 80; i++) {
      const { analysis: a } = await j(await post(ctx.url, body(jpeg(i))));
      seen.add(!a.isRoadDamage ? 'not_road' : a.confidence < 0.6 ? 'low' : 'ok');
      if (!a.isRoadDamage) expect(a.damageType).toBeNull();
    }
    expect([...seen].sort()).toEqual(['low', 'not_road', 'ok']);
  });

  it('menolak tipe tidak didukung, isi bukan gambar, base64 rusak, body kosong', async () => {
    expect((await post(ctx.url, body(jpeg(), 'image/gif'))).status).toBe(415);
    expect((await post(ctx.url, body(Buffer.from('bukan gambar sama sekali')))).status).toBe(415);
    expect((await post(ctx.url, JSON.stringify({ image: '***', mimeType: 'image/jpeg' }))).status).toBe(400);
    expect((await post(ctx.url, JSON.stringify({}))).status).toBe(400);
    expect((await post(ctx.url, '{rusak')).status).toBe(400);
  });

  it('menolak foto > 8 MB dengan 413', async () => {
    const big = Buffer.concat([jpeg(), Buffer.alloc(8 * 1024 * 1024 + 10)]);
    const res = await post(ctx.url, body(big));
    expect(res.status).toBe(413);
    expect((await j(res)).error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('health tidak membocorkan API key', async () => {
    const text = await (await fetch(`${ctx.url}/api/health`)).text();
    expect(JSON.parse(text).ai.provider).toBe('mock');
    expect(text.toLowerCase()).not.toContain('apikey');
  });

  it('endpoint tak dikenal -> 404 berformat error', async () => {
    const res = await fetch(`${ctx.url}/api/tidak-ada`);
    expect(res.status).toBe(404);
    expect((await j(res)).error.code).toBe('NOT_FOUND');
  });
});

describe('REAL_AI tanpa GEMINI_API_KEY', () => {
  it('membalas 503 NOT_CONFIGURED (tidak crash, tidak memalsukan hasil)', async () => {
    const ctx = await start(createApiRouter({ provider: new GeminiProvider(undefined, 'gemini-3.5-flash') }));
    const res = await post(ctx.url, body(jpeg()));
    expect(res.status).toBe(503);
    expect((await j(res)).error.code).toBe('NOT_CONFIGURED');
    const health = await j(await fetch(`${ctx.url}/api/health`));
    expect(health.ai.configured).toBe(false);
    ctx.server.close();
  });
});

describe('rate limit', () => {
  it('membalas 429 setelah melewati batas per menit', async () => {
    const ctx = await start(createApiRouter({ provider: new MockProvider(), rateLimitPerMinute: 3 }));
    const codes: number[] = [];
    for (let i = 0; i < 5; i++) codes.push((await post(ctx.url, body(jpeg(i)))).status);
    expect(codes).toEqual([200, 200, 200, 429, 429]);
    ctx.server.close();
  });
});

describe('AI_MODE', () => {
  it('REAL_AI default, MOCK_AI & YOLO dikenali', () => {
    expect(resolveAiMode({})).toBe('REAL_AI');
    expect(resolveAiMode({ AI_MODE: 'mock_ai' })).toBe('MOCK_AI');
    expect(resolveAiMode({ AI_MODE: 'YOLO' })).toBe('YOLO');
    expect(resolveAiMode({ AI_MODE: 'apa-saja' })).toBe('REAL_AI');
  });
});
