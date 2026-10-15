import type { AiAnalysis, DamageCategory, SeverityLevel } from '../../../shared/ai';
import type { ClassMap } from './classes';

export interface Detection {
  classIndex: number;
  score: number;
  /** Koordinat piksel pada gambar ber-letterbox (input model). */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Mendekode keluaran YOLOv8/YOLO11 hasil `yolo export format=onnx`:
 *   bentuk [1, 4+nc, N]  (cx, cy, w, h, skor tiap kelas) — atau transposnya [1, N, 4+nc].
 * Model berformat lain (mis. YOLOv5 dengan objectness, atau end-to-end NMS) TIDAK didukung.
 */
export function decodeYoloOutput(
  data: ArrayLike<number>,
  dims: readonly number[],
  numClasses: number,
  confThreshold: number,
): { detections: Detection[]; maxScore: number } {
  if (dims.length !== 3 || dims[0] !== 1) {
    throw new Error(`Bentuk keluaran model tidak dikenali: [${dims.join(', ')}]. Gunakan ekspor ONNX YOLOv8/YOLO11 standar.`);
  }
  const channels = 4 + numClasses;
  let channelsFirst: boolean;
  let n: number;
  if (dims[1] === channels) {
    channelsFirst = true;
    n = dims[2];
  } else if (dims[2] === channels) {
    channelsFirst = false;
    n = dims[1];
  } else {
    throw new Error(
      `Jumlah kelas model tidak cocok dengan classes.json: keluaran [${dims.join(', ')}] ` +
        `sedangkan diharapkan ${channels} kanal (4 + ${numClasses} kelas).`,
    );
  }
  const at = (c: number, i: number) => (channelsFirst ? data[c * n + i] : data[i * channels + c]);

  const detections: Detection[] = [];
  let maxScore = 0;
  for (let i = 0; i < n; i++) {
    let best = -1;
    let bestScore = 0;
    for (let c = 0; c < numClasses; c++) {
      const s = at(4 + c, i);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }
    if (bestScore > maxScore) maxScore = bestScore;
    if (best < 0 || bestScore < confThreshold) continue;
    const cx = at(0, i);
    const cy = at(1, i);
    const w = at(2, i);
    const h = at(3, i);
    detections.push({ classIndex: best, score: bestScore, x1: cx - w / 2, y1: cy - h / 2, x2: cx + w / 2, y2: cy + h / 2 });
  }
  return { detections, maxScore };
}

function iou(a: Detection, b: Detection): number {
  const ix = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1));
  const iy = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
  const inter = ix * iy;
  const union = (a.x2 - a.x1) * (a.y2 - a.y1) + (b.x2 - b.x1) * (b.y2 - b.y1) - inter;
  return union <= 0 ? 0 : inter / union;
}

/** Non-Maximum Suppression per kelas: membuang kotak yang menumpuk pada objek yang sama. */
export function nms(dets: Detection[], iouThreshold: number): Detection[] {
  const sorted = [...dets].sort((a, b) => b.score - a.score);
  const kept: Detection[] = [];
  for (const d of sorted) {
    if (!kept.some((k) => k.classIndex === d.classIndex && iou(k, d) > iouThreshold)) kept.push(d);
  }
  return kept;
}

export interface ContentRect {
  /** Area gambar asli (tanpa padding letterbox) di dalam input model. */
  x: number;
  y: number;
  w: number;
  h: number;
}

function clippedArea(d: Detection, r: ContentRect): number {
  const w = Math.max(0, Math.min(d.x2, r.x + r.w) - Math.max(d.x1, r.x));
  const h = Math.max(0, Math.min(d.y2, r.y + r.h) - Math.max(d.y1, r.y));
  return w * h;
}

/**
 * Tingkat keparahan = HEURISTIK dari luas area terdeteksi (bukan keluaran model):
 * rasio luas kotak terhadap foto: >= 15% Berat, >= 4% Sedang, selain itu Ringan.
 * Kategori "Rusak Berat / Amblas" selalu Berat.
 */
export function estimateSeverity(category: DamageCategory, areaRatio: number): SeverityLevel {
  if (category === 'Jalan Rusak Berat / Amblas' || areaRatio >= 0.15) return 'Berat';
  if (areaRatio >= 0.04) return 'Sedang';
  return 'Ringan';
}

/** Mengubah deteksi YOLO menjadi bentuk AiAnalysis yang sama dengan provider lain. */
export function toAnalysis(detections: Detection[], maxScore: number, classes: ClassMap, content: ContentRect): AiAnalysis {
  const mapped = detections
    .map((d) => ({ d, category: classes.categoryOf(d.classIndex) }))
    .filter((x): x is { d: Detection; category: DamageCategory } => x.category !== null);

  if (mapped.length === 0) {
    return {
      isRoadDamage: false,
      damageType: null,
      severity: null,
      confidence: Math.round(Math.min(maxScore, 1) * 100) / 100,
      description: 'Model deteksi tidak menemukan kerusakan jalan pada foto.',
      needsManualVerification: true,
    };
  }

  const top = mapped.reduce((a, b) => (b.d.score > a.d.score ? b : a));
  const contentArea = Math.max(1, content.w * content.h);
  const areaRatio = Math.min(1, mapped.reduce((sum, x) => sum + clippedArea(x.d, content), 0) / contentArea);

  const counts = new Map<DamageCategory, number>();
  mapped.forEach((x) => counts.set(x.category, (counts.get(x.category) ?? 0) + 1));
  const summary = [...counts].map(([c, n]) => `${c} ×${n}`).join(', ');

  return {
    isRoadDamage: true,
    damageType: top.category,
    severity: estimateSeverity(top.category, areaRatio),
    // Skor deteksi YOLO (bukan probabilitas terkalibrasi).
    confidence: Math.round(Math.min(top.d.score, 1) * 100) / 100,
    description: `Model deteksi menemukan ${mapped.length} area kerusakan: ${summary}.`,
    needsManualVerification: true,
  };
}
