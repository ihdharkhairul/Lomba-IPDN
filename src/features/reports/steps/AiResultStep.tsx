import { Check, Info, RotateCcw, ScanSearch, Send, ShieldQuestion } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { PhotoImage } from '@/components/ui/PhotoImage';
import { config } from '@/config';
import { PROVIDER_LABEL } from '@/services/ai/providerLabel';
import { AI_DISCLAIMER, getAiVerdict, VERDICT_MESSAGES } from '@/services/ai/verdict';
import { formatPercent } from '@/utils/format';
import { useReportFlow } from '../ReportFlowContext';

export function AiResultStep() {
  const navigate = useNavigate();
  const flow = useReportFlow();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ai = flow.ai!; // dijamin oleh <FlowGuard require="ai">
  const verdict = getAiVerdict(ai);
  const differs = verdict === 'ok' && ((ai.damageType && ai.damageType !== flow.category) || (ai.severity && ai.severity !== flow.severity));

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const report = await flow.submitReport();
      navigate(`/lapor/sukses/${report.id}`, { replace: true });
      flow.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laporan gagal disimpan. Coba lagi.');
      setSubmitting(false);
    }
  }

  function retake() {
    flow.setPhoto(null); // juga menghapus hasil AI sebelumnya
    navigate('/lapor/foto', { replace: true });
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h1 className="font-bold text-slate-900 text-base">Hasil Validasi AI</h1>
        {ai.provider === 'mock'
          ? <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">Mode demo</span>
          : <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1"><ScanSearch className="w-3 h-3" aria-hidden="true" />Rekomendasi AI</span>}
      </header>

      <div className="p-5 space-y-4 flex-1">

        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100"><PhotoImage blob={flow.photo} alt="Foto yang divalidasi" className="w-full h-44 object-cover" /></div>

        {verdict === 'not_road_damage' && (
          <Notice tone="error" title={VERDICT_MESSAGES.not_road_damage}>{ai.description} Ambil ulang foto yang menampilkan kerusakan jalan dengan jelas.</Notice>
        )}
        {verdict === 'low_confidence' && (
          <Notice tone="warning" title={VERDICT_MESSAGES.low_confidence}>{ai.description} {config.aiStrict ? 'Laporan hanya dapat dikirim bila foto kerusakan jalan terlihat jelas. Silakan ambil foto ulang.' : 'Anda dapat mengambil foto ulang, atau tetap mengirim agar diperiksa langsung oleh petugas.'}</Notice>
        )}

        {verdict !== 'not_road_damage' && (
          <div className="bg-white text-slate-900 border border-slate-200 rounded-xl p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Analisis AI</p>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3"><dt className="text-[0.6875rem] text-slate-500">Jenis terdeteksi</dt><dd className="font-extrabold mt-0.5">{ai.damageType ?? 'Tidak dapat ditentukan'}</dd></div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3"><dt className="text-[0.6875rem] text-slate-500">Confidence</dt><dd className={`font-extrabold mt-0.5 ${verdict === 'ok' ? 'text-emerald-700' : 'text-amber-700'}`}>{formatPercent(ai.confidence)} <span className="text-[0.6875rem] font-medium text-slate-500">({verdict === 'ok' ? 'cukup' : 'rendah'})</span></dd></div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3"><dt className="text-[0.6875rem] text-slate-500">Tingkat (saran AI)</dt><dd className="font-extrabold mt-0.5">{ai.severity ?? '—'}</dd></div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3"><dt className="text-[0.6875rem] text-slate-500">Verifikasi petugas</dt><dd className="font-extrabold mt-0.5 text-amber-700">Diperlukan</dd></div>
            </dl>
            <p className="text-xs text-slate-600 leading-relaxed">{ai.description}</p>
            <p className="text-xs text-slate-500">Dianalisis oleh: <strong className="text-slate-700">{PROVIDER_LABEL[ai.provider]}</strong></p>
          </div>
        )}

        {differs && (
          <Notice tone="info" title="Berbeda dengan isian Anda" action={
            <Button size="sm" variant="outline" fullWidth={false} onClick={() => { if (ai.damageType) flow.setCategory(ai.damageType); if (ai.severity) flow.setSeverity(ai.severity); }}>Gunakan saran AI</Button>
          }>Anda memilih <strong>{flow.category} / {flow.severity}</strong>, AI menyarankan <strong>{ai.damageType ?? '—'} / {ai.severity ?? '—'}</strong>. Keputusan akhir tetap pada petugas.</Notice>
        )}

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs leading-relaxed"><strong>{AI_DISCLAIMER}</strong></p>
        </div>

        {error && <Notice tone="error">{error}</Notice>}
      </div>

      <div className="p-5 pt-3 space-y-2">
        {verdict === 'ok' && <Button loading={submitting} onClick={() => void submit()} icon={<Check className="w-5 h-5" aria-hidden="true" />}>Kirim Laporan</Button>}
        {verdict === 'low_confidence' && (
          <>
            <Button onClick={retake} icon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}>Ambil Foto Ulang</Button>
            {!config.aiStrict && <Button variant="secondary" loading={submitting} onClick={() => void submit()} icon={<Send className="w-4 h-4" aria-hidden="true" />} className="!text-xs">Tetap Kirim untuk Diperiksa Petugas</Button>}
          </>
        )}
        {verdict === 'not_road_damage' && (
          <>
            <Button onClick={retake} icon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}>Ambil Foto Ulang</Button>
            <Button variant="ghost" onClick={() => navigate('/lapor/review', { replace: true })} icon={<ShieldQuestion className="w-4 h-4" aria-hidden="true" />} className="!text-xs">Kembali ke Review</Button>
          </>
        )}
      </div>
    </div>
  );
}
