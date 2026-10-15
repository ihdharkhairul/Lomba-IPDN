import { isNetworkAvailable } from '../network';
import type { GeocodeResult } from './geocoding';

/**
 * Reverse geocoding gratis via Nominatim (OpenStreetMap), tanpa API key.
 * Kebijakan penggunaan: maks. 1 permintaan per detik dan bukan untuk beban besar -> cukup untuk prototype.
 * Produksi dengan trafik besar sebaiknya memakai layanan geocoding berbayar / instance sendiri.
 */
const MIN_INTERVAL_MS = 1100;
let nextSlot = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const startAt = Math.max(now, nextSlot);
  nextSlot = startAt + MIN_INTERVAL_MS;
  if (startAt > now) await new Promise((r) => setTimeout(r, startAt - now));
}

export async function reverseGeocodeNominatim(
  latitude: number,
  longitude: number,
  fetchImpl: typeof fetch = fetch,
): Promise<GeocodeResult> {
  if (!isNetworkAvailable()) return { status: 'offline' };
  try {
    await throttle();
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=id&lat=${latitude}&lon=${longitude}`;
    const res = await fetchImpl(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return { status: 'error' };
    const data = (await res.json()) as { display_name?: string; error?: string };
    return data.display_name ? { status: 'ok', address: data.display_name } : { status: 'no_result' };
  } catch {
    return { status: 'error' };
  }
}
