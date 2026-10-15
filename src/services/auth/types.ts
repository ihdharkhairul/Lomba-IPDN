import type { AuthUser } from '@/types';

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface ResetPasswordInput {
  email: string;
  phone: string;
  newPassword: string;
}

export type AuthErrorCode =
  | 'EMAIL_TAKEN'
  | 'PHONE_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'VERIFICATION_FAILED'
  | 'VALIDATION'
  | 'UNSUPPORTED';

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
    /** Nama field form yang bermasalah (bila ada). */
    public readonly field?: 'name' | 'email' | 'phone' | 'password' | 'identifier',
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Abstraksi autentikasi. UI hanya bergantung pada interface ini.
 *
 * Implementasi saat ini: LocalAuthProvider (IndexedDB + PBKDF2) -> HANYA untuk prototype.
 * Untuk produksi, buat implementasi baru (Firebase Auth / Supabase Auth / REST API backend)
 * yang memenuhi interface yang sama lalu ganti di `services/auth/index.ts`.
 */
export interface AuthProvider {
  readonly kind: string;
  register(input: RegisterInput): Promise<AuthUser>;
  /** identifier = email atau nomor HP */
  login(identifier: string, password: string): Promise<AuthUser>;
  logout(): Promise<void>;
  /** Mengembalikan user dari sesi tersimpan, atau null bila belum login / sesi kedaluwarsa. */
  getSessionUser(): Promise<AuthUser | null>;
  resetPassword(input: ResetPasswordInput): Promise<void>;
}
