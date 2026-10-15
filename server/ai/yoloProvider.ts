import fs from 'node:fs';
import path from 'node:path';
import type { AiAnalysis } from '../../shared/ai';
import { loadClassMap, type ClassMap } from './yolo/classes';
import { decodeYoloOutput, nms, toAnalysis } from './yolo/postprocess';
import { preprocessImage, type ResizeMode } from './yolo/preprocess';
import { AiProviderError, type AiProvider, type AnalyzeInput } from './types';

export interface YoloOptions {
  /** Lokasi file model .onnx (hasil `yolo export format=onnx`). */
  modelPath: string;
  /** Lokasi classes.json (nama kelas + pemetaan ke kategori LAPORIN). */
  classesPath: string;
  inputSize: number;
  /** letterbox (jaga rasio) atau stretch (regangkan) — samakan dengan cara data latih diproses. */
  resize?: ResizeMode;
  confThreshold: number;
  iouThreshold: number;
}

type Ort = typeof import('onnxruntime-web');
type Session = Awaited<ReturnType<Ort['InferenceSession']['create']>>;

/**
 * Provider YOLO LOKAL: menjalankan model deteksi objek (.onnx) di server dengan onnxruntime-web (WASM).
 *
 * - Model TIDAK disertakan: Anda perlu melatih / menyediakan model deteksi kerusakan jalan sendiri
 *   (lihat docs/YOLO.md). Tanpa file model, provider ini membalas 503 NOT_CONFIGURED.
 * - Hanya format keluaran YOLOv8 / YOLO11 standar ([1, 4+nc, N]).
 * - Skor "confidence" adalah skor deteksi YOLO, bukan probabilitas terkalibrasi. Tingkat keparahan
 *   adalah heuristik dari luas area terdeteksi. Hasil tetap rekomendasi untuk diverifikasi petugas.
 */
export class YoloProvider implements AiProvider {
  readonly name = 'yolo' as const;
  readonly model: string;
  private classes: ClassMap | null = null;
  private session: Promise<Session> | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly options: YoloOptions) {
    this.model = path.basename(options.modelPath);
  }

  isConfigured(): boolean {
    return fs.existsSync(this.options.modelPath) && fs.existsSync(this.options.classesPath);
  }

  private notConfigured(message: string): AiProviderError {
    return new AiProviderError('NOT_CONFIGURED', message, 503);
  }

  private async getSession(): Promise<Session> {
    if (!fs.existsSync(this.options.modelPath)) {
      throw this.notConfigured(`File model YOLO belum ada. Letakkan model .onnx di "${path.relative(process.cwd(), this.options.modelPath) || this.options.modelPath}" (lihat docs/YOLO.md).`);
    }
    if (!this.session) {
      this.session = (async () => {
        let ort: Ort;
        try {
          ort = await import('onnxruntime-web');
        } catch {
          throw this.notConfigured('Paket onnxruntime-web belum terpasang. Jalankan "npm install".');
        }
        ort.env.wasm.numThreads = 1;
        try {
          return await ort.InferenceSession.create(this.options.modelPath, { executionProviders: ['wasm'] });
        } catch (e) {
          console.error('[yolo] gagal memuat model', e instanceof Error ? e.message : e);
          throw this.notConfigured('File model YOLO tidak dapat dimuat. Pastikan formatnya ONNX hasil ekspor YOLOv8/YOLO11.');
        }
      })();
      this.session.catch(() => (this.session = null)); // izinkan mencoba lagi setelah file diperbaiki
    }
    return this.session;
  }

  async analyze(input: AnalyzeInput): Promise<AiAnalysis> {
    try {
      this.classes ??= loadClassMap(this.options.classesPath);
    } catch (e) {
      throw this.notConfigured(e instanceof Error ? e.message : 'classes.json tidak valid.');
    }
    const classes = this.classes;
    const session = await this.getSession();

    let pre;
    try {
      pre = await preprocessImage(input.imageBytes, this.options.inputSize, this.options.resize ?? 'letterbox');
    } catch {
      throw new AiProviderError('INVALID_REQUEST', 'Foto tidak dapat dibaca. File mungkin rusak.', 400);
    }

    // Satu inferensi pada satu waktu (WASM single-thread).
    const run = this.queue.then(async () => {
      const ort = await import('onnxruntime-web');
      const tensor = new ort.Tensor('float32', pre.tensor, [1, 3, pre.size, pre.size]);
      const out = await session.run({ [session.inputNames[0]]: tensor });
      return out[session.outputNames[0]];
    });
    this.queue = run.catch(() => undefined);

    let output;
    try {
      output = await run;
    } catch (e) {
      console.error('[yolo] inferensi gagal', e instanceof Error ? e.message : e);
      throw new AiProviderError('UPSTREAM_ERROR', 'Model deteksi gagal memproses foto.', 502);
    }

    try {
      const { detections, maxScore } = decodeYoloOutput(output.data as Float32Array, output.dims, classes.names.length, this.options.confThreshold);
      return toAnalysis(nms(detections, this.options.iouThreshold), maxScore, classes, pre.content);
    } catch (e) {
      throw this.notConfigured(e instanceof Error ? e.message : 'Keluaran model tidak dikenali.');
    }
  }
}
