/** Validasi form. Semua fungsi mengembalikan pesan error (string) atau null bila valid. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Email wajib diisi.';
  if (!EMAIL_RE.test(v) || v.length > 254) return 'Format email tidak valid.';
  return null;
}

/**
 * Menormalkan nomor HP Indonesia ke format lokal 08xxxxxxxxxx.
 * Menerima: 0812..., +62812..., 62812..., dengan spasi/strip/titik.
 */
export function normalizePhone(value: string): string | null {
  const cleaned = value.replace(/[\s().-]/g, '');
  const local = /^\+?62/.test(cleaned) ? '0' + cleaned.replace(/^\+?62/, '') : cleaned;
  return /^08[1-9][0-9]{7,11}$/.test(local) ? local : null;
}

export function validatePhone(value: string): string | null {
  if (!value.trim()) return 'Nomor HP wajib diisi.';
  if (!normalizePhone(value)) return 'Nomor HP tidak valid (contoh: 0812 3456 7890).';
  return null;
}

export function validateName(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Nama lengkap wajib diisi.';
  if (v.length < 3) return 'Nama minimal 3 karakter.';
  if (v.length > 80) return 'Nama maksimal 80 karakter.';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Password wajib diisi.';
  if (value.length < 8) return 'Password minimal 8 karakter.';
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) return 'Password harus mengandung huruf dan angka.';
  if (value.length > 128) return 'Password terlalu panjang.';
  return null;
}

export function validatePasswordConfirm(password: string, confirm: string): string | null {
  if (!confirm) return 'Konfirmasi password wajib diisi.';
  if (password !== confirm) return 'Konfirmasi password tidak cocok.';
  return null;
}

/** Identitas login: email atau nomor HP. */
export function validateIdentifier(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Email atau nomor HP wajib diisi.';
  if (v.includes('@')) return validateEmail(v) ? 'Format email tidak valid.' : null;
  return normalizePhone(v) ? null : 'Masukkan email atau nomor HP yang valid.';
}

/** Menghapus karakter kontrol & merapikan spasi pada teks bebas dari pengguna. */
export function sanitizeText(value: string, maxLength: number): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

export const DESCRIPTION_MAX_LENGTH = 500;
