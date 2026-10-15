import { ChevronRight, Info, ListOrdered, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useGoBack } from '@/hooks/useGoBack';
import { useReportFlow } from '../ReportFlowContext';

const STEPS = [
  ['Ambil / Upload Foto', 'Potret kerusakan jalan dengan jelas.'],
  ['Deteksi Lokasi GPS', 'Koordinat akurat (GPS HP tetap bekerja tanpa internet).'],
  ['Isi Detail Kerusakan', 'Pilih jenis, tingkat keparahan & catatan singkat.'],
  ['Review & Validasi AI', 'AI membantu memvalidasi foto sebelum laporan dikirim.'],
];

export function IntroStep() {
  const navigate = useNavigate();
  const goBack = useGoBack('/beranda');
  const flow = useReportFlow();

  function start() {
    flow.reset(); // laporan baru selalu mulai dari form kosong
    navigate('/lapor/foto');
  }

  return (
    <div className="flex-1 flex flex-col">
      <ScreenHeader title="Buat Laporan Baru" subtitle="Layanan Pelaporan Infrastruktur Publik" onBack={goBack} />
      <div className="p-5 space-y-5 flex-1">
        <div className="bg-blue-50/80 rounded-xl p-4 border border-blue-100">
          <h2 className="text-xs font-bold text-blue-900 mb-3.5 flex items-center gap-1.5"><ListOrdered className="w-4 h-4 text-blue-600" aria-hidden="true" />4 Langkah Mudah Pelaporan:</h2>
          <ol className="space-y-3.5">
            {STEPS.map(([title, desc], i) => (
              <li key={title} className="flex items-start gap-3">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${i === 0 ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-800'}`}>{i + 1}</span>
                <div>
                  <p className="text-xs font-bold text-slate-800">{title}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-amber-900"><Info className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />Tips Mengambil Foto:</p>
          <p className="text-xs text-amber-800/90 leading-relaxed">Pastikan cahaya cukup, jangan memotret saat mengemudi, dan utamakan keselamatan Anda di jalan raya.</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><ShieldCheck className="w-5 h-5" aria-hidden="true" /></div>
          <p className="text-xs text-slate-600 leading-snug">Tidak ada internet? Foto, GPS, dan isian tetap bisa disimpan sebagai draft lalu dikirim otomatis saat online.</p>
        </div>
      </div>
      <div className="p-5 pt-2">
        <Button onClick={start} icon={<ChevronRight className="w-5 h-5 order-last" aria-hidden="true" />}>Mulai Laporan Sekarang</Button>
      </div>
    </div>
  );
}
