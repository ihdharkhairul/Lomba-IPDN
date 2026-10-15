import { LocalAuthProvider } from './localAuthProvider';
import type { AuthProvider } from './types';

/**
 * Titik penggantian provider autentikasi.
 * Ganti `new LocalAuthProvider()` dengan FirebaseAuthProvider / SupabaseAuthProvider /
 * ApiAuthProvider (implementasi `AuthProvider`) saat backend produksi tersedia.
 */
export const authProvider: AuthProvider = new LocalAuthProvider();

export * from './types';
