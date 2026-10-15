import type {
  ConditionType,
  DamageCategory,
  GeoPoint,
  ReportDraft,
  SeverityLevel,
  SyncStatus,
} from '@/types';
import { uid } from '@/utils/id';
import { dbDelete, dbGet, dbGetAllByIndex, dbPut } from '../storage/db';

export interface SaveDraftInput {
  /** Bila diisi & sudah ada, draft diperbarui (bukan dibuat baru). */
  id?: string;
  userId: string;
  photo: Blob;
  description: string;
  category: DamageCategory | null;
  severity: SeverityLevel | null;
  condition: ConditionType | null;
  location: GeoPoint | null;
  address: string | null;
}

/** Penyimpanan draft LOKAL (offline). Draft tidak pernah dianggap laporan sampai berhasil dikirim. */
export interface DraftService {
  saveDraft(input: SaveDraftInput): Promise<ReportDraft>;
  getDrafts(userId: string): Promise<ReportDraft[]>;
  getDraftById(id: string, userId: string): Promise<ReportDraft | null>;
  setSyncState(id: string, userId: string, syncStatus: SyncStatus, syncMessage: string | null): Promise<ReportDraft | null>;
  updateDraftAddress(id: string, userId: string, address: string): Promise<ReportDraft | null>;
  deleteDraft(id: string, userId: string): Promise<void>;
}

export class LocalDraftService implements DraftService {
  async saveDraft(input: SaveDraftInput): Promise<ReportDraft> {
    const now = new Date().toISOString();
    const existing = input.id ? await this.getDraftById(input.id, input.userId) : null;
    const draft: ReportDraft = {
      id: existing?.id ?? uid(),
      userId: input.userId,
      photo: input.photo,
      description: input.description,
      category: input.category,
      severity: input.severity,
      condition: input.condition,
      location: input.location,
      address: input.address,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      // Setiap kali disimpan ulang, draft kembali antre untuk disinkronkan.
      syncStatus: 'PENDING_SYNC',
      syncMessage: null,
    };
    await dbPut('drafts', draft);
    return draft;
  }

  async getDrafts(userId: string): Promise<ReportDraft[]> {
    const rows = await dbGetAllByIndex<ReportDraft>('drafts', 'userId', userId);
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getDraftById(id: string, userId: string): Promise<ReportDraft | null> {
    const row = await dbGet<ReportDraft>('drafts', id);
    return row && row.userId === userId ? row : null;
  }

  async setSyncState(
    id: string,
    userId: string,
    syncStatus: SyncStatus,
    syncMessage: string | null,
  ): Promise<ReportDraft | null> {
    const draft = await this.getDraftById(id, userId);
    if (!draft) return null;
    const updated: ReportDraft = { ...draft, syncStatus, syncMessage };
    await dbPut('drafts', updated);
    return updated;
  }

  async updateDraftAddress(id: string, userId: string, address: string): Promise<ReportDraft | null> {
    const draft = await this.getDraftById(id, userId);
    if (!draft) return null;
    const updated: ReportDraft = { ...draft, address };
    await dbPut('drafts', updated);
    return updated;
  }

  async deleteDraft(id: string, userId: string): Promise<void> {
    const draft = await this.getDraftById(id, userId);
    if (draft) await dbDelete('drafts', id);
  }
}

export const draftService: DraftService = new LocalDraftService();
