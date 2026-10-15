import { describe, expect, it, vi } from 'vitest';
import { reverseGeocodeNominatim } from './nominatim';

const res = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response;

describe('reverse geocoding Nominatim (gratis)', () => {
  it('mengembalikan alamat & memakai koordinat yang benar', async () => {
    const f = vi.fn(async () => res({ display_name: 'Jl. Asia Afrika, Bandung' }));
    const r = await reverseGeocodeNominatim(-6.974123, 107.630567, f as unknown as typeof fetch);
    expect(r).toEqual({ status: 'ok', address: 'Jl. Asia Afrika, Bandung' });
    const url = String((f.mock.calls[0] as unknown[])[0]);
    expect(url).toContain('lat=-6.974123');
    expect(url).toContain('lon=107.630567');
  });
  it('tanpa hasil -> no_result; HTTP error / jaringan putus -> error (tidak melempar)', async () => {
    expect((await reverseGeocodeNominatim(0, 0, (async () => res({ error: 'Unable to geocode' })) as unknown as typeof fetch)).status).toBe('no_result');
    expect((await reverseGeocodeNominatim(0, 0, (async () => res({}, false)) as unknown as typeof fetch)).status).toBe('error');
    expect((await reverseGeocodeNominatim(0, 0, (async () => { throw new Error('putus'); }) as unknown as typeof fetch)).status).toBe('error');
  }, 15_000);
});
