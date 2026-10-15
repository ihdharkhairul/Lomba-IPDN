import { CheckCircle, Circle, Loader2, ScanSearch } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { useConnectivity } from '@/hooks/useConnectivity';
import { AiServiceError, analyzePhoto } from '@/services/ai/aiService';
import { useReportFlow } from '../ReportFlowContext';
import { useSaveDraft } from '../useSaveDraft';

/** Memanggil backend /api/ai/analyze (Gemini). Tidak ada timer palsu: layar ini menunggu respons nyata. */
export function AiProcessingStep() {
  const navigate = useNavigate();
  const flow = useReportFlow();
  const { isOnline } = useConnectivity();
  const { save, saving } = useSaveDraft();
  const [error, setError] = useState<AiServiceError | null>(null);
  const [attempt, setAttempt] = useState(0);

  const { photo, ai, setAi } = flow;
  useEffect(() => {
    if (ai) {
      navigate('/lapor/hasil', { replace: true });
      return;
    }
    if (!photo) return;
    const controller = new AbortController();
    setError(null);
    analyzePhoto(photo, { signal: controller.signal })
      .then((result) => {
        setAi(result);
        navigate('/lapor/hasil', { replace: true });
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setError(e instanceof AiServiceError ? e : new AiServiceError('SERVER', 'Terjadi kesalahan tak terduga.'));
      });
    return () => controller.abort();
    // Hanya dijalankan ulang saat user menekan "Coba Lagi".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  if (error) {
    return (
      <div className="flex-1 p-6 flex flex-col justify-center gap-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3"><ScanSearch className="w-6 h-6" aria-hidden="true" /></div>
          <h1 className="text-lg font-extrabold text-slate-900">Validasi AI Belum Berhasil</h1>
        </div>
        <Notice tone="error">{error.message}</Notice>
        <p className="text-xs text-slate-500 text-center">Data laporan Anda aman. Anda dapat mencoba lagi atau menyimpannya sebagai draft untuk dikirim nanti.</p>
        <div className="space-y-2">
          {error.code !== 'BAD_REQUEST' && error.code !== 'NOT_CONFIGURED' && (
            <Button disabled={!isOnline} onClick={() => setAttempt((n) => n + 1)}>Coba Lagi</Button>
          )}
          <Button variant="secondary" loading={saving} onClick={() => void save()}>Simpan sebagai Draft</Button>
          <Button variant="ghost" onClick={() => navigate('/lapor/review', { replace: true })} className="!text-xs">Kembali ke Review</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 sm:p-10" role="status" aria-live="polite">
      <Loader2 className="w-10 h-10 text-blue-700 animate-spin" aria-hidden="true" />
      <h1 className="text-xl font-bold text-slate-900 mt-5">Memeriksa foto…</h1>
      <p className="text-sm text-slate-600 mt-2 max-w-xs leading-relaxed">Foto dikirim ke server untuk dinilai apakah menunjukkan kerusakan jalan. Mohon tunggu sebentar.</p>
      <ul className="w-full max-w-xs mt-6 space-y-3 text-left text-sm">
        <li className="flex items-center gap-3 text-slate-700"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />Foto dan koordinat GPS siap</li>
        <li className="flex items-center gap-3 text-slate-900 font-medium"><Loader2 className="w-4 h-4 text-blue-700 animate-spin shrink-0" aria-hidden="true" />Mengirim dan menganalisis foto</li>
        <li className="flex items-center gap-3 text-slate-400"><Circle className="w-4 h-4 shrink-0" aria-hidden="true" />Menyusun hasil</li>
      </ul>
      <p className="mt-7 text-xs text-slate-500 max-w-xs">Hasil hanya bantuan awal. Keputusan akhir tetap diverifikasi petugas.</p>
    </div>
  );
}
