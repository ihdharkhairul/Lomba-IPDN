import type {
  AiValidation,
  ConditionType,
  DamageCategory,
  GeoPoint,
  Report,
  ReportStatus,
  SeverityLevel,
} from '@/types';
import { generateTicketNumber, uid } from '@/utils/id';
import { dbGet, dbGetAllByIndex, dbPut } from '../storage/db';
import { canTransition } from './statusFlow';

export interface CreateReportInput {
  userId: string;
  photo: Blob;
  description: string;
  category: DamageCategory;
  severity: SeverityLevel;
  condition: ConditionType;
  location: GeoPoint;
  address: string | null;
  ai: AiValidation;
  fromOfflineDraft?: boolean;
}

/**
 * Kontrak penyimpanan laporan yang SUDAH DIKIRIM (submitted report).
 *
 * UI & sinkronisasi hanya memakai interface ini. Implementasi sekarang
 * (LocalReportService) menyimpan di IndexedDB perangkat sebagai pengganti backend.
 * Untuk produksi, buat `ApiReportService` yang memanggil REST/GraphQL backend dengan
 * method yang sama, lalu ganti ekspor `reportService` di bawah.
 */
export interface ReportService {
  createReport(input: CreateReportInput): Promise<Report>;
  getReports(userId: string): Promise<Report[]>;
  getReportById(id: string, userId: string): Promise<Report | null>;
  updateReportStatus(id: string, userId: string, status: ReportStatus, note?: string): Promise<Report>;
  updateReportAddress(id: string, userId: string, address: string): Promise<Report>;
}

export class LocalReportService implements ReportService {
  async createReport(input: CreateReportInput): Promise<Report> {
    const now = new Date().toISOString();
    const report: Report = {
      id: uid(),
      userId: input.userId,
      ticketNumber: generateTicketNumber(),
      photo: input.photo,
      description: input.description,
      category: input.category,
      severity: input.severity,
      condition: input.condition,
      location: input.location,
      address: input.address,
      ai: input.ai,
      // Laporan masuk antrian verifikasi petugas setelah dikirim & divalidasi AI.
      status: 'waiting_verification',
      statusHistory: [
        { status: 'submitted', at: now },
        { status: 'ai_validated', at: now },
        { status: 'waiting_verification', at: now },
      ],
      fromOfflineDraft: input.fromOfflineDraft ?? false,
      createdAt: now,
      updatedAt: now,
    };
    await dbPut('reports', report);
    return report;
  }

  async getReports(userId: string): Promise<Report[]> {
    const rows = await dbGetAllByIndex<Report>('reports', 'userId', userId);
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getReportById(id: string, userId: string): Promise<Report | null> {
    const row = await dbGet<Report>('reports', id);
    // Pengguna hanya boleh membaca laporan miliknya sendiri.
    return row && row.userId === userId ? row : null;
  }

  async updateReportStatus(id: string, userId: string, status: ReportStatus, note?: string): Promise<Report> {
    const report = await this.getReportById(id, userId);
    if (!report) throw new Error('Laporan tidak ditemukan.');
    if (!canTransition(report.status, status)) {
      throw new Error(`Perubahan status dari "${report.status}" ke "${status}" tidak diizinkan.`);
    }
    const now = new Date().toISOString();
    const updated: Report = {
      ...report,
      status,
      updatedAt: now,
      statusHistory: [...report.statusHistory, { status, at: now, ...(note ? { note } : {}) }],
    };
    await dbPut('reports', updated);
    return updated;
  }

  async updateReportAddress(id: string, userId: string, address: string): Promise<Report> {
    const report = await this.getReportById(id, userId);
    if (!report) throw new Error('Laporan tidak ditemukan.');
    const updated: Report = { ...report, address, updatedAt: new Date().toISOString() };
    await dbPut('reports', updated);
    return updated;
  }
}

export const reportService: ReportService = new LocalReportService();
