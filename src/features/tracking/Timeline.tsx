import { Check, X } from 'lucide-react';
import type { Report } from '@/types';
import { formatDateTime } from '@/utils/format';
import { buildTimeline } from './statusMeta';

const EVENT_FOR_STEP: Record<string, string> = {
  submitted: 'submitted',
  ai: 'ai_validated',
  verify: 'verified',
  forward: 'forwarded',
  progress: 'in_progress',
  done: 'completed',
};

export function Timeline({ report }: { report: Report }) {
  const steps = buildTimeline(report.status);

  return (
    <ol className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {steps.map((step, index) => {
        const event = report.statusHistory.find((e) => e.status === EVENT_FOR_STEP[step.key]);
        const waitingEvent = step.key === 'verify' && step.state === 'active' ? report.statusHistory.find((e) => e.status === 'waiting_verification') : undefined;
        const when = event ?? waitingEvent;
        return (
          <li key={step.key} className={`relative ${step.state === 'pending' ? 'opacity-60' : ''}`} aria-current={step.state === 'active' ? 'step' : undefined}>
            <span
              className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[0.6875rem] font-bold ring-4 ring-white ${
                step.state === 'done'
                  ? 'bg-emerald-600 text-white'
                  : step.state === 'active'
                    ? 'bg-blue-600 text-white animate-pulse'
                    : step.state === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-200 text-slate-500'
              }`}
              aria-hidden="true"
            >
              {step.state === 'done' ? <Check className="w-3 h-3 stroke-[3]" /> : step.state === 'rejected' ? <X className="w-3 h-3 stroke-[3]" /> : step.state === 'active' ? <span className="w-2 h-2 rounded-full bg-white" /> : index + 1}
            </span>
            <div
              className={
                step.state === 'active'
                  ? 'p-3 rounded-lg bg-blue-50/70 border border-blue-200'
                  : step.state === 'rejected'
                    ? 'p-3 rounded-lg bg-red-50 border border-red-200'
                    : ''
              }
            >
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs font-bold ${step.state === 'rejected' ? 'text-red-800' : 'text-slate-800'}`}>
                  {step.state === 'rejected' ? 'Laporan Ditolak Petugas' : step.title}
                </p>
                {step.state === 'active' && (
                  <span className="text-[0.6875rem] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded-full shrink-0">Sedang berjalan</span>
                )}
                {step.state !== 'active' && when && <span className="text-[0.6875rem] text-slate-400 shrink-0">{formatDateTime(when.at)}</span>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {step.state === 'rejected' ? event?.note ?? report.statusHistory.at(-1)?.note ?? 'Laporan tidak dapat ditindaklanjuti.' : step.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
