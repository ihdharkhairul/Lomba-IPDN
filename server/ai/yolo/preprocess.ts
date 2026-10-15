import type { ContentRect } from './postprocess';

export interface Preprocessed {
  /** Tensor float32 NCHW [1,3,size,size], nilai 0..1, RGB, letterbox (padding abu-abu 114). */
  tensor: Float32Array;
  size: number;
  content: ContentRect;
}

/**
 * Menyiapkan foto untuk YOLO: koreksi orientasi EXIF, lalu
 *  - letterbox (default): perkecil dengan menjaga rasio & tempel di tengah kanvas size×size, atau
 *  - stretch: regangkan langsung ke size×size. Pakai ini bila data latih berupa gambar "Stretch to 640x640"
 *    (mis. dataset Roboflow) agar proporsi saat inferensi sama dengan saat training.
 * Lalu diubah ke tensor CHW ter-normalisasi.
 */
export type ResizeMode = 'letterbox' | 'stretch';

export async function preprocessImage(image: Buffer, size: number, mode: ResizeMode = 'letterbox'): Promise<Preprocessed> {
  const sharp = (await import('sharp')).default;
  const { data, info } = await sharp(image, { failOn: 'none' })
    .rotate()
    .resize({ width: size, height: size, fit: mode === 'stretch' ? 'fill' : 'inside' })
    .removeAlpha()
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const padX = Math.floor((size - w) / 2);
  const padY = Math.floor((size - h) / 2);
  const plane = size * size;
  const tensor = new Float32Array(3 * plane).fill(114 / 255);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = (y * w + x) * info.channels;
      const dst = (y + padY) * size + (x + padX);
      tensor[dst] = data[src] / 255; // R
      tensor[plane + dst] = data[src + 1] / 255; // G
      tensor[2 * plane + dst] = data[src + 2] / 255; // B
    }
  }
  return { tensor, size, content: { x: padX, y: padY, w, h } };
}
