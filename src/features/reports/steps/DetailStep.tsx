import { Archive, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { StepHeader } from '@/components/ui/StepHeader';
import { CATEGORY_OPTIONS, CONDITION_OPTIONS, SEVERITY_OPTIONS } from '@/data/options';
import { DESCRIPTION_MAX_LENGTH } from '@/utils/validation';
import { useReportFlow } from '../ReportFlowContext';
import { useSaveDraft } from '../useSaveDraft';

export function DetailStep() {
  const navigate = useNavigate();
  const flow = useReportFlow();
  const { save, saving } = useSaveDraft();
  const complete = Boolean(flow.category && flow.severity && flow.condition);

  return (
    <div className="flex-1 flex flex-col">
      <StepHeader step={3} title="Detail Kerusakan" tag="03 / Detail" onBack={() => navigate('/lapor/lokasi')} />
      <div className="p-5 space-y-5 flex-1">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Isi Kondisi Kerusakan</h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Informasi ini membantu petugas menyiapkan alat dan material perbaikan.</p>
        </div>

        <fieldset>
          <legend className="block text-xs font-bold text-slate-800 mb-2">Jenis Kerusakan Jalan *</legend>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = flow.category === value;
              return (
                <button key={value} type="button" aria-pressed={active} onClick={() => flow.setCategory(value)}
                  className={`p-3 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer ${active ? 'border-2 border-blue-600 bg-blue-50/70' : 'border border-slate-200 bg-white hover:border-slate-300'}`}>
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}><Icon className="w-4 h-4" aria-hidden="true" /></span>
                  <span className="text-xs font-bold text-slate-800">{label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="block text-xs font-bold text-slate-800 mb-2">Perkiraan Tingkat Keparahan *</legend>
          <div className="grid grid-cols-3 gap-2">
            {SEVERITY_OPTIONS.map((o) => (
              <button key={o.value} type="button" aria-pressed={flow.severity === o.value} onClick={() => flow.setSeverity(o.value)}
                className={`p-2.5 rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${flow.severity === o.value ? o.active : o.idle}`}>{o.value}</button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="block text-xs font-bold text-slate-800 mb-2">Kondisi Kerusakan Saat Ini *</legend>
          <div className="grid grid-cols-2 gap-2">
            {CONDITION_OPTIONS.map((o) => {
              const active = flow.condition === o.value;
              return (
                <button key={o.value} type="button" aria-pressed={active} onClick={() => flow.setCondition(o.value)}
                  className={`p-3 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer ${active ? o.active : 'border border-slate-200 bg-white hover:border-slate-300'}`}>
                  <span className={`w-3 h-3 rounded-full shrink-0 ${o.dot}`} aria-hidden="true" />
                  <span><span className="block text-xs font-bold text-slate-800">{o.value}</span><span className="block text-[0.6875rem] text-slate-500">{o.hint}</span></span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="description" className="block text-xs font-bold text-slate-800 mb-1">Catatan Tambahan (Opsional)</label>
          <textarea id="description" rows={3} maxLength={DESCRIPTION_MAX_LENGTH} value={flow.description} onChange={(e) => flow.setDescription(e.target.value)}
            placeholder="Contoh: Lubang cukup dalam di lajur kiri dekat lampu merah, rawan bagi pengendara motor."
            className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-slate-50 resize-none" />
          <p className="text-[0.6875rem] text-slate-400 text-right">{flow.description.length}/{DESCRIPTION_MAX_LENGTH}</p>
        </div>
      </div>

      <div className="p-5 pt-3 flex gap-2">
        <Button variant="secondary" fullWidth={false} loading={saving} onClick={() => void save()} icon={<Archive className="w-4 h-4" aria-hidden="true" />} className="!text-xs">Draft</Button>
        <Button disabled={!complete} onClick={() => navigate('/lapor/review')} icon={<ArrowRight className="w-4 h-4 order-last" aria-hidden="true" />}>Lanjut ke Review</Button>
      </div>
      {!complete && <p className="text-center text-xs text-amber-700 pb-3 font-medium">* Pilih jenis, tingkat keparahan, dan kondisi kerusakan</p>}
    </div>
  );
}
