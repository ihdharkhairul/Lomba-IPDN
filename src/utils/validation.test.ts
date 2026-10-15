import { describe, expect, it } from 'vitest';
import { normalizePhone, validateEmail, validateIdentifier, validatePassword, validatePasswordConfirm, validatePhone } from './validation';

describe('validasi form', () => {
  it('email', () => {
    expect(validateEmail('')).toMatch(/wajib/);
    expect(validateEmail('bukan-email')).toMatch(/tidak valid/);
    expect(validateEmail('a@b.co')).toBeNull();
  });
  it('nomor HP dinormalkan ke 08…', () => {
    expect(normalizePhone('+62 812-3456-7890')).toBe('081234567890');
    expect(normalizePhone('6281234567890')).toBe('081234567890');
    expect(normalizePhone('0812 3456 7890')).toBe('081234567890');
    expect(normalizePhone('12345')).toBeNull();
    expect(validatePhone('abc')).toMatch(/tidak valid/);
  });
  it('password', () => {
    expect(validatePassword('')).toMatch(/wajib/);
    expect(validatePassword('abc123')).toMatch(/minimal 8/);
    expect(validatePassword('abcdefgh')).toMatch(/huruf dan angka/);
    expect(validatePassword('abcd1234')).toBeNull();
    expect(validatePasswordConfirm('abcd1234', 'abcd12345')).toMatch(/tidak cocok/);
    expect(validatePasswordConfirm('abcd1234', 'abcd1234')).toBeNull();
  });
  it('identifier login: email atau HP', () => {
    expect(validateIdentifier('')).toMatch(/wajib/);
    expect(validateIdentifier('x@y.id')).toBeNull();
    expect(validateIdentifier('081234567890')).toBeNull();
    expect(validateIdentifier('halo')).toMatch(/valid/);
  });
});
