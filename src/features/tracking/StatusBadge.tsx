import type { ReportStatus } from '@/types';
import { STATUS_META, TONE_CLASSES } from './statusMeta';

export function StatusBadge({ status, className = '' }: { status: ReportStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span className={`text-[0.6875rem] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${TONE_CLASSES[meta.tone]} ${className}`}>
      {meta.label}
    </span>
  );
}
