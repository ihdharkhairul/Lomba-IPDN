// @vitest-environment node
import { ApiError } from '@google/genai';
import { describe, expect, it, vi } from 'vitest';
import { GeminiProvider, type GeminiClientLike } from './geminiProvider';

const input = { imageBase64: 'AAAA', mimeType: 'image/jpeg' as const, imageBytes: Buffer.alloc(1) };
const OK = JSON.stringify({ isRoadDamage: true, damageType: 'Jalan Berlubang', severity: 'Sedang', confidence: 0.9, description: 'Lubang.', needsManualVerification: true });
const err = (status: number) => new ApiError({ message: `status ${status}`, status });

function client(steps: Array<string | Error>) {
  const generateContent = vi.fn(async () => {
    const step = steps.shift();
    if (step instanceof Error) throw step;
    return { text: step };
  });
  return { generateContent, client: { models: { generateContent } } as unknown as GeminiClientLike };
}
const make = (c: GeminiClientLike, extra = {}) => new GeminiProvider('KEY', 'model-utama', { client: c, retryDelaysMs: [0, 0], ...extra });

describe('GeminiProvider: ketahanan terhadap error sementara', () => {
  it('503 dua kali lalu berhasil -> hasil dikembalikan (dicoba ulang otomatis)', async () => {
    const c = client([err(503), err(503), OK]);
    const a = await make(c.client).analyze(input);
    expect(a.isRoadDamage).toBe(true);
    expect(c.generateContent).toHaveBeenCalledTimes(3);
  });

  it('503 terus-menerus tanpa model cadangan -> pesan "sedang padat" (503), bukan error umum', async () => {
    const c = client([err(503), err(503), err(503)]);
    await expect(make(c.client).analyze(input)).rejects.toMatchObject({ code: 'UPSTREAM_ERROR', httpStatus: 503, message: expect.stringContaining('sedang padat') });
    expect(c.generateContent).toHaveBeenCalledTimes(3);
  });

  it('503 terus-menerus + model cadangan -> beralih ke cadangan dan berhasil', async () => {
    const c = client([err(503), err(503), err(503), OK]);
    const a = await make(c.client, { fallbackModel: 'model-cadangan' }).analyze(input);
    expect(a.damageType).toBe('Jalan Berlubang');
    const models = c.generateContent.mock.calls.map((x) => (x as unknown as [{ model: string }])[0].model);
    expect(models).toEqual(['model-utama', 'model-utama', 'model-utama', 'model-cadangan']);
  });

  it('key ditolak (403) / model tak ada (404) TIDAK diulang', async () => {
    const c = client([err(403)]);
    await expect(make(c.client).analyze(input)).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
    expect(c.generateContent).toHaveBeenCalledTimes(1);
    const c2 = client([err(404)]);
    await expect(make(c2.client, { fallbackModel: 'x' }).analyze(input)).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
    expect(c2.generateContent).toHaveBeenCalledTimes(1);
  });

  it('kuota (429) tidak diulang & dilaporkan RATE_LIMITED', async () => {
    const c = client([err(429)]);
    await expect(make(c.client).analyze(input)).rejects.toMatchObject({ code: 'RATE_LIMITED', httpStatus: 429 });
    expect(c.generateContent).toHaveBeenCalledTimes(1);
  });
});
