import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  type AllowedImageType,
  type ApiErrorBody,
} from '../shared/ai';

export interface ValidImage {
  ok: true;
  base64: string;
  mimeType: AllowedImageType;
  bytes: Buffer;
}
export interface InvalidRequest {
  ok: false;
  status: number;
  body: ApiErrorBody;
}

function fail(status: number, code: ApiErrorBody['error']['code'], message: string): InvalidRequest {
  return { ok: false, status, body: { error: { code, message } } };
}

/** Cek "magic bytes" agar isi file benar-benar sesuai tipe yang diklaim. */
export function sniffImageType(buf: Buffer): AllowedImageType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

export function validateAnalyzeBody(body: unknown): ValidImage | InvalidRequest {
  if (!body || typeof body !== 'object') {
    return fail(400, 'INVALID_REQUEST', 'Body permintaan tidak valid.');
  }
  const { image, mimeType } = body as Record<string, unknown>;

  if (typeof image !== 'string' || !image) {
    return fail(400, 'INVALID_REQUEST', 'Field "image" (base64) wajib diisi.');
  }
  if (typeof mimeType !== 'string' || !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)) {
    return fail(415, 'UNSUPPORTED_MEDIA', 'Format foto harus JPEG, PNG, atau WebP.');
  }

  // Terima pula format data URL, lalu buang prefix-nya.
  const base64 = image.replace(/^data:[^;]+;base64,/, '');

  // Batas kasar sebelum decode (hemat memori): 4/3 dari batas byte + padding.
  if (base64.length > Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 4) {
    return fail(413, 'PAYLOAD_TOO_LARGE', 'Ukuran foto terlalu besar (maksimal 8 MB).');
  }
  if (!BASE64_RE.test(base64)) {
    return fail(400, 'INVALID_REQUEST', 'Data foto bukan base64 yang valid.');
  }

  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length === 0) return fail(400, 'INVALID_REQUEST', 'Data foto kosong.');
  if (bytes.length > MAX_IMAGE_BYTES) {
    return fail(413, 'PAYLOAD_TOO_LARGE', 'Ukuran foto terlalu besar (maksimal 8 MB).');
  }

  const sniffed = sniffImageType(bytes);
  if (!sniffed || sniffed !== mimeType) {
    return fail(415, 'UNSUPPORTED_MEDIA', 'Isi file tidak sesuai dengan format foto yang valid.');
  }

  return { ok: true, base64, mimeType: sniffed, bytes };
}
