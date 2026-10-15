import { config } from '@/config';
import { isNetworkAvailable } from '../network';
import { isMapsConfigured, loadGoogleMaps } from './googleMapsLoader';
import { reverseGeocodeNominatim } from './nominatim';

/** Teks yang ditampilkan bila alamat belum bisa dicari (mis. offline). */
export const ADDRESS_PENDING_TEXT = 'Alamat akan diperbarui saat koneksi tersedia.';

export type GeocodeResult =
  | { status: 'ok'; address: string }
  | { status: 'offline' | 'unconfigured' | 'no_result' | 'error' };

/**
 * Reverse geocoding (koordinat -> alamat). Penyedia mengikuti config.mapProvider:
 * OpenStreetMap (Nominatim, gratis) atau Google Geocoder.
 * Tidak pernah melempar error: bila offline / belum dikonfigurasi, hasilnya hanyalah status,
 * sehingga laporan tetap bisa disimpan dengan koordinat saja.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
  if (config.mapProvider === 'osm') return reverseGeocodeNominatim(latitude, longitude);

  if (!isMapsConfigured()) return { status: 'unconfigured' };
  if (!isNetworkAvailable()) return { status: 'offline' };
  try {
    await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();
    const { results } = await geocoder.geocode({ location: { lat: latitude, lng: longitude }, language: 'id' });
    const address = results?.[0]?.formatted_address;
    return address ? { status: 'ok', address } : { status: 'no_result' };
  } catch {
    return { status: 'error' };
  }
}
