/**
 * Konfigurasi sisi klien. Hanya variabel berawalan VITE_ yang boleh dibaca di sini
 * dan nilainya ikut ter-bundle ke browser -> jangan taruh rahasia (mis. Gemini key).
 */
const googleKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '').trim();
const requestedProvider = (import.meta.env.VITE_MAP_PROVIDER ?? '').trim().toLowerCase();

export const config = {
  /**
   * Penyedia peta: "osm" = OpenStreetMap (gratis, tanpa key) | "google" = Google Maps (butuh key + billing).
   * Bila VITE_MAP_PROVIDER kosong: pakai Google bila VITE_GOOGLE_MAPS_API_KEY terisi, selain itu OpenStreetMap.
   */
  mapProvider: (requestedProvider === 'google' || requestedProvider === 'osm' ? requestedProvider : googleKey ? 'google' : 'osm') as 'google' | 'osm',
  googleMapsApiKey: googleKey,
  googleMapsMapId: (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? '').trim() || 'DEMO_MAP_ID',
  /** Alat bantu demo (simulasi offline & simulasi status petugas). Mati secara default. */
  isDemoMode: import.meta.env.VITE_DEMO_MODE === 'true',

  /** Foto asli lebih dari ini ditolak sebelum dikompres (10 MB). */
  maxPhotoInputBytes: 10 * 1024 * 1024,
  /** Sisi terpanjang foto setelah dikompres. */
  photoMaxDimension: 1600,
  photoJpegQuality: 0.82,

  /** Di bawah ambang ini hasil AI dianggap "belum yakin". */
  aiConfidenceThreshold: 0.6,
  /**
   * Mode ketat (default AKTIF): laporan hanya bisa dikirim bila AI cukup yakin foto adalah kerusakan jalan.
   * Set VITE_AI_STRICT=false untuk mengizinkan "tetap kirim" pada hasil yang kurang yakin.
   */
  aiStrict: import.meta.env.VITE_AI_STRICT !== 'false',
  aiRequestTimeoutMs: 45_000,

  /** Pusat peta bila belum ada titik (Indonesia). */
  defaultMapCenter: { lat: -2.5, lng: 118 },
  defaultMapZoom: 5,

  sessionDays: 30,
} as const;
