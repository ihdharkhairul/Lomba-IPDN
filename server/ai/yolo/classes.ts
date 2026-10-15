import fs from 'node:fs';
import { DAMAGE_CATEGORIES, type DamageCategory } from '../../../shared/ai';

export interface ClassMap {
  names: string[];
  /** Kategori LAPORIN untuk indeks kelas, atau null bila kelas diabaikan. */
  categoryOf(classIndex: number): DamageCategory | null;
}

/** Membaca & memvalidasi models/yolo/classes.json. Melempar Error berpesan jelas bila salah format. */
export function loadClassMap(filePath: string): ClassMap {
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    throw new Error(`File kelas YOLO tidak dapat dibaca (${filePath}): ${e instanceof Error ? e.message : e}`);
  }
  const obj = raw as { names?: unknown; map?: unknown };
  if (!Array.isArray(obj?.names) || obj.names.length === 0 || !obj.names.every((n) => typeof n === 'string')) {
    throw new Error('classes.json: field "names" harus berupa array nama kelas (string) yang tidak kosong.');
  }
  if (!obj.map || typeof obj.map !== 'object') {
    throw new Error('classes.json: field "map" (nama kelas -> kategori LAPORIN) wajib ada.');
  }
  const names = obj.names as string[];
  const map = obj.map as Record<string, string>;
  for (const [cls, cat] of Object.entries(map)) {
    if (!(DAMAGE_CATEGORIES as readonly string[]).includes(cat)) {
      throw new Error(`classes.json: kategori "${cat}" untuk kelas "${cls}" tidak valid. Pilihan: ${DAMAGE_CATEGORIES.join(' | ')}`);
    }
  }
  return {
    names,
    categoryOf: (i) => {
      const name = names[i];
      return name !== undefined && map[name] ? (map[name] as DamageCategory) : null;
    },
  };
}
