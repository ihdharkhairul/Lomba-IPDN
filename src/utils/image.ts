import { ALLOWED_IMAGE_TYPES } from '../../shared/ai';
import { config } from '@/config';
import { formatBytes } from './format';

/** Validasi awal file foto (tipe & ukuran). Mengembalikan pesan error atau null. */
export function validateImageFile(file: File): string | null {
  if (file.size === 0) return 'File foto kosong. Silakan pilih foto lain.';

  const type = file.type.toLowerCase();
  if (type === 'image/heic' || type === 'image/heif') {
    return 'Format HEIC/HEIF belum didukung. Ubah pengaturan kamera ke JPEG atau pilih foto lain.';
  }
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)) {
    return 'Format file tidak didukung. Gunakan foto JPEG, PNG, atau WebP.';
  }
  if (file.size > config.maxPhotoInputBytes) {
    return `Ukuran foto terlalu besar (${formatBytes(file.size)}). Maksimal ${formatBytes(config.maxPhotoInputBytes)}.`;
  }
  return null;
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      // 'from-image' menghormati orientasi EXIF dari kamera HP.
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* jatuh ke fallback <img> */
    }
  }
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Foto tidak dapat dibaca. File mungkin rusak.'));
    el.src = url;
  }).finally(() => URL.revokeObjectURL(url));
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => undefined };
}

/**
 * Mengecilkan & mengompres foto menjadi JPEG agar hemat penyimpanan offline (IndexedDB)
 * dan hemat kuota saat dikirim ke server AI.
 */
export async function compressImage(file: File): Promise<Blob> {
  const { source, width, height, close } = await decode(file);
  try {
    const scale = Math.min(1, config.photoMaxDimension / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Peramban tidak mendukung pemrosesan foto.');
    ctx.fillStyle = '#ffffff'; // latar untuk PNG transparan
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(source, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', config.photoJpegQuality),
    );
    if (!blob) throw new Error('Gagal memproses foto. Coba foto lain.');
    return blob;
  } finally {
    close();
  }
}

/** Blob -> base64 murni (tanpa prefix data:). */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error('Foto tidak dapat dibaca.'));
    reader.readAsDataURL(blob);
  });
}
