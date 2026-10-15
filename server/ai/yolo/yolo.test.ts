// @vitest-environment node
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import type { AiAnalysis } from '../../../shared/ai';
import { HybridProvider } from '../hybridProvider';
import { YoloProvider } from '../yoloProvider';
import { createProviderFromEnv, resolveAiMode } from '../index';
import type { AiProvider } from '../types';
import { loadClassMap } from './classes';
import { decodeYoloOutput, estimateSeverity, nms, toAnalysis } from './postprocess';

const CLASSES = path.resolve('models/yolo/classes.json');
const FAKE_MODEL = path.resolve('server/ai/yolo/__fixtures__/fake-yolov8.onnx');

describe('dekode keluaran YOLOv8', () => {
  // 2 kelas, 3 anchor, layout [1, 6, 3] (channels-first)
  const first = Float32Array.from([
    /* cx */ 50, 60, 10, /* cy */ 50, 55, 10, /* w */ 20, 20, 5, /* h */ 20, 20, 5,
    /* kelas0 */ 0.9, 0.7, 0.1, /* kelas1 */ 0.1, 0.0, 0.05,
  ]);
  it('mengambil kotak di atas ambang & mengubah cx,cy,w,h -> x1,y1,x2,y2', () => {
    const { detections, maxScore } = decodeYoloOutput(first, [1, 6, 3], 2, 0.25);
    expect(detections).toHaveLength(2);
    expect(detections[0]).toMatchObject({ classIndex: 0, score: expect.closeTo(0.9, 5), x1: 40, y1: 40, x2: 60, y2: 60 });
    expect(maxScore).toBeCloseTo(0.9, 5);
  });
  it('mendukung layout transpos [1, N, 4+nc]', () => {
    const n = 3, c = 6;
    const t = new Float32Array(n * c);
    for (let ch = 0; ch < c; ch++) for (let i = 0; i < n; i++) t[i * c + ch] = first[ch * n + i];
    expect(decodeYoloOutput(t, [1, n, c], 2, 0.25).detections).toHaveLength(2);
  });
  it('menolak model dengan jumlah kelas berbeda dari classes.json (pesan jelas)', () => {
    expect(() => decodeYoloOutput(first, [1, 6, 3], 5, 0.25)).toThrow(/Jumlah kelas model tidak cocok/);
    expect(() => decodeYoloOutput(first, [6, 3], 2, 0.25)).toThrow(/tidak dikenali/);
  });
  it('NMS membuang kotak tumpang tindih sekelas, mempertahankan kelas berbeda', () => {
    const a = { classIndex: 0, score: 0.9, x1: 0, y1: 0, x2: 100, y2: 100 };
    const b = { classIndex: 0, score: 0.6, x1: 5, y1: 5, x2: 105, y2: 105 };
    const c = { classIndex: 1, score: 0.5, x1: 5, y1: 5, x2: 105, y2: 105 };
    expect(nms([b, a, c], 0.45).map((d) => d.score)).toEqual([0.9, 0.5]);
  });
});

describe('pemetaan ke AiAnalysis', () => {
  const classes = loadClassMap(CLASSES);
  const content = { x: 0, y: 0, w: 100, h: 100 };
  it('tanpa deteksi -> bukan kerusakan jalan (nilai null)', () => {
    const a = toAnalysis([], 0.08, classes, content);
    expect(a).toMatchObject({ isRoadDamage: false, damageType: null, severity: null, confidence: 0.08, needsManualVerification: true });
  });
  it('kelas yang tidak ada di map diabaikan', () => {
    const a = toAnalysis([{ classIndex: 99, score: 0.9, x1: 0, y1: 0, x2: 10, y2: 10 }], 0.9, classes, content);
    expect(a.isRoadDamage).toBe(false);
  });
  it('lubang besar -> Berat; keparahan = heuristik luas', () => {
    expect(estimateSeverity('Jalan Berlubang', 0.01)).toBe('Ringan');
    expect(estimateSeverity('Jalan Berlubang', 0.05)).toBe('Sedang');
    expect(estimateSeverity('Jalan Berlubang', 0.2)).toBe('Berat');
    expect(estimateSeverity('Jalan Rusak Berat / Amblas', 0)).toBe('Berat');
  });
  it('classes.json dengan kategori salah ditolak dengan pesan jelas', async () => {
    const fs = await import('node:fs'); const os = await import('node:os');
    const f = path.join(os.tmpdir(), 'bad-classes.json');
    fs.writeFileSync(f, JSON.stringify({ names: ['x'], map: { x: 'Kategori Ngawur' } }));
    expect(() => loadClassMap(f)).toThrow(/tidak valid/);
  });
});

describe('YoloProvider end-to-end (model ONNX PALSU untuk uji pipeline)', () => {
  const opts = { modelPath: FAKE_MODEL, classesPath: CLASSES, inputSize: 640, confThreshold: 0.25, iouThreshold: 0.45 };
  const jpeg = () => sharp({ create: { width: 800, height: 600, channels: 3, background: '#777777' } }).jpeg().toBuffer();

  it('foto asli -> inferensi ONNX -> NMS -> hasil terpetakan', async () => {
    const provider = new YoloProvider(opts);
    expect(provider.isConfigured()).toBe(true);
    const bytes = await jpeg();
    const a = await provider.analyze({ imageBase64: bytes.toString('base64'), mimeType: 'image/jpeg', imageBytes: bytes });
    expect(a.isRoadDamage).toBe(true);
    expect(a.damageType).toBe('Jalan Berlubang'); // kelas D40
    expect(a.confidence).toBe(0.9);
    expect(a.severity).toBe('Sedang'); // kotak 200x100 ≈ 6.5% luas foto
    expect(a.description).toContain('×1'); // kotak ganda dibuang NMS
    expect(a.needsManualVerification).toBe(true);
  }, 30_000);

  it('mode stretch memakai seluruh kanvas sebagai area gambar (rasio luas berbeda dari letterbox)', async () => {
    const bytes = await jpeg();
    const a = await new YoloProvider({ ...opts, resize: 'stretch' }).analyze({ imageBase64: '', mimeType: 'image/jpeg', imageBytes: bytes });
    expect(a.isRoadDamage).toBe(true);
    expect(a.severity).toBe('Sedang'); // 20000 / 409600 ≈ 4.9%
  }, 30_000);

  it('ambang confidence tinggi -> tidak ada deteksi -> ditolak', async () => {
    const provider = new YoloProvider({ ...opts, confThreshold: 0.95 });
    const bytes = await jpeg();
    const a = await provider.analyze({ imageBase64: '', mimeType: 'image/jpeg', imageBytes: bytes });
    expect(a.isRoadDamage).toBe(false);
    expect(a.damageType).toBeNull();
  }, 30_000);

  it('tanpa file model -> NOT_CONFIGURED (503) dengan petunjuk', async () => {
    const provider = new YoloProvider({ ...opts, modelPath: path.resolve('models/yolo/tidak-ada.onnx') });
    expect(provider.isConfigured()).toBe(false);
    await expect(provider.analyze({ imageBase64: '', mimeType: 'image/jpeg', imageBytes: Buffer.from([1]) })).rejects.toMatchObject({
      code: 'NOT_CONFIGURED', httpStatus: 503, message: expect.stringContaining('docs/YOLO.md'),
    });
  });

  it('file rusak bukan gambar -> 400', async () => {
    const provider = new YoloProvider(opts);
    await expect(provider.analyze({ imageBase64: '', mimeType: 'image/jpeg', imageBytes: Buffer.from('bukan gambar') })).rejects.toMatchObject({ httpStatus: 400 });
  }, 30_000);
});

describe('HybridProvider: keduanya harus setuju', () => {
  const ok = (type: AiAnalysis['damageType'], conf: number, sev: AiAnalysis['severity'] = 'Sedang'): AiAnalysis => ({ isRoadDamage: true, damageType: type, severity: sev, confidence: conf, description: `desc-${conf}`, needsManualVerification: true });
  const no = (): AiAnalysis => ({ isRoadDamage: false, damageType: null, severity: null, confidence: 0.1, description: 'bukan jalan', needsManualVerification: true });
  const fake = (name: 'yolo' | 'gemini', r: AiAnalysis | Error): AiProvider & { analyze: ReturnType<typeof vi.fn> } => ({
    name: name as never, model: name, isConfigured: () => true,
    analyze: vi.fn(async () => { if (r instanceof Error) throw r; return r; }),
  });
  const input = { imageBase64: '', mimeType: 'image/jpeg' as const, imageBytes: Buffer.alloc(1) };

  it('YOLO menolak -> Gemini TIDAK dipanggil (hemat kuota)', async () => {
    const g = fake('gemini', ok('Jalan Berlubang', 0.9));
    const r = await new HybridProvider(fake('yolo', no()), g).analyze(input);
    expect(r.isRoadDamage).toBe(false);
    expect(g.analyze).not.toHaveBeenCalled();
  });
  it('YOLO setuju tapi Gemini menolak -> ditolak', async () => {
    const r = await new HybridProvider(fake('yolo', ok('Jalan Berlubang', 0.8)), fake('gemini', no())).analyze(input);
    expect(r).toMatchObject({ isRoadDamage: false, damageType: null, severity: null });
  });
  it('keduanya setuju -> jenis dari YOLO, tingkat & deskripsi dari Gemini, confidence terendah', async () => {
    const r = await new HybridProvider(fake('yolo', ok('Jalan Berlubang', 0.8, 'Ringan')), fake('gemini', ok('Jalan Retak (Buaya)', 0.95, 'Berat'))).analyze(input);
    expect(r).toMatchObject({ isRoadDamage: true, damageType: 'Jalan Berlubang', severity: 'Berat', confidence: 0.8, description: 'desc-0.95' });
  });
  it('error dari salah satu provider diteruskan (tidak diam-diam diterima)', async () => {
    await expect(new HybridProvider(fake('yolo', new Error('boom')), fake('gemini', ok(null, 1))).analyze(input)).rejects.toThrow('boom');
  });
});

describe('pemilihan mode', () => {
  it('AI_MODE mengenali YOLO & HYBRID', () => {
    expect(resolveAiMode({ AI_MODE: 'yolo' })).toBe('YOLO');
    expect(resolveAiMode({ AI_MODE: 'Hybrid' })).toBe('HYBRID');
    expect(createProviderFromEnv({ AI_MODE: 'YOLO' }).name).toBe('yolo');
    expect(createProviderFromEnv({ AI_MODE: 'HYBRID' }).name).toBe('hybrid');
    expect(createProviderFromEnv({ AI_MODE: 'REAL_AI' }).name).toBe('gemini');
  });
});
