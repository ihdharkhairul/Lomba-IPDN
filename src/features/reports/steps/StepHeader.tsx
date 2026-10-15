import { ArrowLeft } from 'lucide-react';

interface StepHeaderProps {
  step: 1 | 2 | 3 | 4;
  label: string;
  onBack: () => void;
}

const STEP_NAMES = ['Foto', 'Lokasi', 'Detail', 'Review'];

export function StepHeader({ step, label, onBack }: StepHeaderProps) {
  return (
    <div className="sticky top-0 bg-white z-20">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label="Kembali ke langkah sebelumnya" className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-900 text-sm">Langkah {step} dari 4</h1>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        </div>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
          0{step} / {STEP_NAMES[step - 1]}
        </span>
      </div>
      <div className="w-full bg-slate-100 h-1" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={step} aria-label="Progres pelaporan">
        <div className="bg-blue-600 h-1 rounded-r transition-all duration-300" style={{ width: `${step * 25}%` }} />
      </div>
    </div>
  );
}
