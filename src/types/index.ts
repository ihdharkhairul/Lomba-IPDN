import type {
  AiAnalysis,
  AiProviderName,
  DamageCategory,
  SeverityLevel,
} from '../../shared/ai';

export type { AiAnalysis, AiProviderName, DamageCategory, SeverityLevel };
export { DAMAGE_CATEGORIES, SEVERITY_LEVELS } from '../../shared/ai';

export type ConditionType = 'Masih Terjadi' | 'Sudah Ditambal';

/** Hasil AI + metadata asal hasil (provider/model/waktu). */
export interface AiValidation extends AiAnalysis {
  provider: AiProviderName;
  model: string;
  analyzedAt: string;
}

/** Hasil pembacaan GPS perangkat (navigator.geolocation). */
export interface GeoPoint {
  latitude: number;
  longitude: number;
  /** Akurasi dalam meter (bisa null bila perangkat tidak melaporkannya). */
  accuracy: number | null;
  /** Epoch ms saat GPS membaca posisi. */
  timestamp: number;
  /** gps = dibaca perangkat; manual = pin digeser/diketuk user di peta. */
  source?: 'gps' | 'manual';
}

export type ReportStatus =
  | 'draft'
  | 'submitted'
  | 'ai_validated'
  | 'waiting_verification'
  | 'verified'
  | 'forwarded'
  | 'in_progress'
  | 'completed'
  | 'rejected';

export interface StatusEvent {
  status: ReportStatus;
  at: string;
  note?: string;
}

export type SyncStatus = 'PENDING_SYNC' | 'SYNCING' | 'NEEDS_REVIEW';

/** Draft lokal (IndexedDB). Belum dikirim ke server. */
export interface ReportDraft {
  id: string;
  userId: string;
  photo: Blob;
  description: string;
  category: DamageCategory | null;
  severity: SeverityLevel | null;
  condition: ConditionType | null;
  location: GeoPoint | null;
  /** null = alamat belum diketahui (mis. offline); akan dicari saat online. */
  address: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  /** Pesan hasil sinkronisasi terakhir (mis. alasan perlu diperiksa). */
  syncMessage: string | null;
}

/** Laporan yang sudah dikirim (submitted report). */
export interface Report {
  id: string;
  userId: string;
  ticketNumber: string;
  photo: Blob;
  description: string;
  category: DamageCategory;
  severity: SeverityLevel;
  condition: ConditionType;
  location: GeoPoint;
  address: string | null;
  ai: AiValidation;
  status: ReportStatus;
  statusHistory: StatusEvent[];
  /** true bila laporan ini awalnya draft offline yang disinkronkan. */
  fromOfflineDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** Format lokal 08xxxxxxxxxx */
  phone: string;
  createdAt: string;
}
