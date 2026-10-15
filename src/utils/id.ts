/** ID unik. Memakai crypto (bukan Math.random). */
export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Nomor laporan: LAP-<tahun>-<5 digit acak kriptografis>. */
export function generateTicketNumber(date = new Date()): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const n = String(buf[0] % 100000).padStart(5, '0');
  return `LAP-${date.getFullYear()}-${n}`;
}
