import type { AiProviderName } from '@/types';

/** Nama penganalisis yang ditampilkan ke pengguna. Hanya menyebut YOLO bila benar-benar dipakai. */
export const PROVIDER_LABEL: Record<AiProviderName, string> = {
  gemini: 'Google Gemini',
  yolo: 'Model deteksi YOLO',
  hybrid: 'Model deteksi YOLO + Google Gemini',
  mock: 'Simulasi (demo)',
};
