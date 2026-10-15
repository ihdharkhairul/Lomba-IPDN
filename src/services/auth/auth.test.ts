import { describe, expect, it } from 'vitest';
import { AuthError } from './types';
import { LocalAuthProvider } from './localAuthProvider';

const input = { name: 'Budi Pratama', email: 'Budi@Example.com', phone: '0812-3456-7890', password: 'rahasia123' };

describe('LocalAuthProvider', () => {
  it('register menyimpan sesi & menormalkan email/HP', async () => {
    const auth = new LocalAuthProvider();
    const user = await auth.register(input);
    expect(user.email).toBe('budi@example.com');
    expect(user.phone).toBe('081234567890');
    expect((await new LocalAuthProvider().getSessionUser())?.id).toBe(user.id); // sesi bertahan
  });

  it('tidak pernah menyimpan password asli', async () => {
    await new LocalAuthProvider().register(input);
    const dump = JSON.stringify(Array.from(localStorage as unknown as Iterable<string>));
    expect(dump).not.toContain('rahasia123');
    const { dbGetOneByIndex } = await import('../storage/db');
    const stored = await dbGetOneByIndex<Record<string, unknown>>('users', 'email', 'budi@example.com');
    expect(JSON.stringify(stored)).not.toContain('rahasia123');
    expect(stored?.passwordHash).toBeTruthy();
  });

  it('menolak email / HP ganda', async () => {
    const auth = new LocalAuthProvider();
    await auth.register(input);
    await expect(auth.register({ ...input, phone: '0899 1111 2222' })).rejects.toMatchObject({ code: 'EMAIL_TAKEN' });
    await expect(auth.register({ ...input, email: 'lain@example.com' })).rejects.toMatchObject({ code: 'PHONE_TAKEN' });
  });

  it('login dengan email atau nomor HP; password salah ditolak', async () => {
    const auth = new LocalAuthProvider();
    await auth.register(input);
    await auth.logout();
    expect(await auth.getSessionUser()).toBeNull();

    expect((await auth.login('budi@example.com', 'rahasia123')).name).toBe('Budi Pratama');
    await auth.logout();
    expect((await auth.login('+62 812 3456 7890', 'rahasia123')).name).toBe('Budi Pratama');
    await auth.logout();

    await expect(auth.login('budi@example.com', 'salah1234')).rejects.toBeInstanceOf(AuthError);
    await expect(auth.login('tidakada@example.com', 'rahasia123')).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(await auth.getSessionUser()).toBeNull();
  });

  it('sesi kedaluwarsa dihapus', async () => {
    const auth = new LocalAuthProvider();
    await auth.register(input);
    const s = JSON.parse(localStorage.getItem('laporin.session')!);
    localStorage.setItem('laporin.session', JSON.stringify({ ...s, expiresAt: Date.now() - 1000 }));
    expect(await auth.getSessionUser()).toBeNull();
    expect(localStorage.getItem('laporin.session')).toBeNull();
  });

  it('reset password butuh email + HP yang cocok', async () => {
    const auth = new LocalAuthProvider();
    await auth.register(input);
    await expect(auth.resetPassword({ email: 'budi@example.com', phone: '0811 0000 0000', newPassword: 'baru12345' })).rejects.toMatchObject({ code: 'VERIFICATION_FAILED' });
    await auth.resetPassword({ email: 'budi@example.com', phone: '081234567890', newPassword: 'baru12345' });
    await expect(auth.login('budi@example.com', 'rahasia123')).rejects.toBeInstanceOf(AuthError);
    expect((await auth.login('budi@example.com', 'baru12345')).email).toBe('budi@example.com');
  });
});
