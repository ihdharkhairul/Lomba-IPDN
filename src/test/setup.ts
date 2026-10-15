import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { resetDatabaseForTests } from '@/services/storage/db';

// jsdom tidak selalu menyediakan crypto.subtle (dipakai PBKDF2) -> pakai milik Node.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

afterEach(async () => {
  cleanup(); // vitest tanpa globals -> RTL tidak auto-cleanup
  await resetDatabaseForTests();
  if (typeof localStorage !== 'undefined') localStorage.clear();
  if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
});
