import { config } from '@/config';
import type { AuthUser } from '@/types';
import { uid } from '@/utils/id';
import {
  normalizePhone,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from '@/utils/validation';
import { dbGet, dbGetOneByIndex, dbPut } from '../storage/db';
import {
  AuthError,
  type AuthProvider,
  type RegisterInput,
  type ResetPasswordInput,
} from './types';

/**
 * ⚠️  PROTOTYPE ONLY.
 *
 * Akun disimpan di IndexedDB perangkat ini saja (tidak ada server). Password di-hash dengan
 * PBKDF2-SHA256 + salt acak, sehingga password asli tidak pernah disimpan. Namun karena
 * semua data ada di sisi klien, ini TIDAK menggantikan autentikasi server untuk produksi
 * (tidak ada sinkronisasi antar-perangkat, tidak ada rate-limit login, tidak ada verifikasi email).
 */

interface StoredUser extends AuthUser {
  passwordHash: string;
  salt: string;
  iterations: number;
}

interface StoredSession {
  userId: string;
  token: string;
  expiresAt: number;
}

const SESSION_KEY = 'laporin.session';
const PBKDF2_ITERATIONS = 120_000;

function toBase64(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function randomBase64(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toBase64(bytes);
}

async function hashPassword(password: string, saltB64: string, iterations: number): Promise<string> {
  if (!crypto?.subtle) {
    throw new AuthError(
      'UNSUPPORTED',
      'Peramban tidak mendukung enkripsi yang dibutuhkan. Buka aplikasi melalui HTTPS atau localhost.',
    );
  }
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64(saltB64), iterations },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

/** Perbandingan waktu-konstan agar tidak membocorkan informasi lewat timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toPublicUser(u: StoredUser): AuthUser {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, createdAt: u.createdAt };
}

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredSession;
    if (!s?.userId || !s?.token || typeof s.expiresAt !== 'number') return null;
    return s;
  } catch {
    return null;
  }
}

function writeSession(userId: string): void {
  const session: StoredSession = {
    userId,
    token: randomBase64(32),
    expiresAt: Date.now() + config.sessionDays * 24 * 60 * 60 * 1000,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

const INVALID_CREDENTIALS_MESSAGE = 'Email/nomor HP atau password salah.';

export class LocalAuthProvider implements AuthProvider {
  readonly kind = 'local-prototype';

  private findByIdentifier(identifier: string): Promise<StoredUser | undefined> {
    const v = identifier.trim();
    if (v.includes('@')) return dbGetOneByIndex<StoredUser>('users', 'email', v.toLowerCase());
    const phone = normalizePhone(v);
    return phone ? dbGetOneByIndex<StoredUser>('users', 'phone', phone) : Promise.resolve(undefined);
  }

  async register(input: RegisterInput): Promise<AuthUser> {
    const nameErr = validateName(input.name);
    if (nameErr) throw new AuthError('VALIDATION', nameErr, 'name');
    const emailErr = validateEmail(input.email);
    if (emailErr) throw new AuthError('VALIDATION', emailErr, 'email');
    const phoneErr = validatePhone(input.phone);
    if (phoneErr) throw new AuthError('VALIDATION', phoneErr, 'phone');
    const pwErr = validatePassword(input.password);
    if (pwErr) throw new AuthError('VALIDATION', pwErr, 'password');

    const email = input.email.trim().toLowerCase();
    const phone = normalizePhone(input.phone)!;

    if (await dbGetOneByIndex<StoredUser>('users', 'email', email)) {
      throw new AuthError('EMAIL_TAKEN', 'Email sudah terdaftar. Silakan masuk.', 'email');
    }
    if (await dbGetOneByIndex<StoredUser>('users', 'phone', phone)) {
      throw new AuthError('PHONE_TAKEN', 'Nomor HP sudah terdaftar. Silakan masuk.', 'phone');
    }

    const salt = randomBase64(16);
    const user: StoredUser = {
      id: uid(),
      name: input.name.trim().replace(/\s+/g, ' '),
      email,
      phone,
      createdAt: new Date().toISOString(),
      salt,
      iterations: PBKDF2_ITERATIONS,
      passwordHash: await hashPassword(input.password, salt, PBKDF2_ITERATIONS),
    };
    await dbPut('users', user);
    writeSession(user.id);
    return toPublicUser(user);
  }

  async login(identifier: string, password: string): Promise<AuthUser> {
    const user = await this.findByIdentifier(identifier);
    if (!user) {
      // Tetap hitung hash agar waktu respons tidak membedakan "user tidak ada" vs "password salah".
      await hashPassword(password, randomBase64(16), PBKDF2_ITERATIONS);
      throw new AuthError('INVALID_CREDENTIALS', INVALID_CREDENTIALS_MESSAGE);
    }
    const hash = await hashPassword(password, user.salt, user.iterations);
    if (!safeEqual(hash, user.passwordHash)) {
      throw new AuthError('INVALID_CREDENTIALS', INVALID_CREDENTIALS_MESSAGE);
    }
    writeSession(user.id);
    return toPublicUser(user);
  }

  async logout(): Promise<void> {
    clearSession();
  }

  async getSessionUser(): Promise<AuthUser | null> {
    const session = readSession();
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      clearSession();
      return null;
    }
    try {
      const user = await dbGet<StoredUser>('users', session.userId);
      if (!user) {
        clearSession();
        return null;
      }
      return toPublicUser(user);
    } catch {
      return null;
    }
  }

  /**
   * Reset password PROTOTYPE: karena tidak ada server email/OTP, identitas diverifikasi
   * dengan mencocokkan email + nomor HP yang terdaftar. Produksi harus memakai tautan/OTP via email/SMS.
   */
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const emailErr = validateEmail(input.email);
    if (emailErr) throw new AuthError('VALIDATION', emailErr, 'email');
    const phoneErr = validatePhone(input.phone);
    if (phoneErr) throw new AuthError('VALIDATION', phoneErr, 'phone');
    const pwErr = validatePassword(input.newPassword);
    if (pwErr) throw new AuthError('VALIDATION', pwErr, 'password');

    const user = await dbGetOneByIndex<StoredUser>('users', 'email', input.email.trim().toLowerCase());
    if (!user || user.phone !== normalizePhone(input.phone)) {
      throw new AuthError('VERIFICATION_FAILED', 'Email dan nomor HP tidak cocok dengan akun yang terdaftar.');
    }
    const salt = randomBase64(16);
    await dbPut('users', {
      ...user,
      salt,
      iterations: PBKDF2_ITERATIONS,
      passwordHash: await hashPassword(input.newPassword, salt, PBKDF2_ITERATIONS),
    } satisfies StoredUser);
    clearSession();
  }
}
