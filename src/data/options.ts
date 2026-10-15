import { Activity, AlertTriangle, CircleDot, Layers, type LucideIcon } from 'lucide-react';
import type { ConditionType, DamageCategory, SeverityLevel } from '@/types';

export const CATEGORY_OPTIONS: { value: DamageCategory; label: string; icon: LucideIcon }[] = [
  { value: 'Jalan Berlubang', label: 'Jalan Berlubang', icon: CircleDot },
  { value: 'Jalan Retak (Buaya)', label: 'Jalan Retak', icon: Activity },
  { value: 'Jalan Rusak Berat / Amblas', label: 'Rusak Berat / Amblas', icon: AlertTriangle },
  { value: 'Kerusakan Permukaan / Mengelupas', label: 'Permukaan Lepas', icon: Layers },
];

export const SEVERITY_OPTIONS: { value: SeverityLevel; active: string; idle: string }[] = [
  { value: 'Ringan', active: 'border-2 border-emerald-500 bg-emerald-50 text-emerald-800', idle: 'border border-slate-200 text-slate-700 hover:border-emerald-300' },
  { value: 'Sedang', active: 'border-2 border-amber-500 bg-amber-50 text-amber-900', idle: 'border border-slate-200 text-slate-700 hover:border-amber-300' },
  { value: 'Berat', active: 'border-2 border-red-500 bg-red-50 text-red-900', idle: 'border border-slate-200 text-slate-700 hover:border-red-300' },
];

export const SEVERITY_BADGE: Record<SeverityLevel, string> = {
  Ringan: 'bg-emerald-100 text-emerald-800',
  Sedang: 'bg-amber-100 text-amber-800',
  Berat: 'bg-red-100 text-red-800',
};

export const CONDITION_OPTIONS: { value: ConditionType; hint: string; dot: string; active: string }[] = [
  { value: 'Masih Terjadi', hint: 'Membahayakan lalu lintas', dot: 'bg-red-600', active: 'border-2 border-red-500 bg-red-50/80' },
  { value: 'Sudah Ditambal', hint: 'Namun belum rata', dot: 'bg-slate-400', active: 'border-2 border-blue-600 bg-blue-50/80' },
];
