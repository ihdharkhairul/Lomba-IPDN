import { Image as ImageIcon, Info, Send, WifiOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { StepHeader } from '@/components/ui/StepHeader';
import { PhotoImage } from '@/components/ui/PhotoImage';
import { SEVERITY_BADGE } from '@/data/options';
import { useConnectivity } from '@/hooks/useConnectivity';
import { ADDRESS_PENDING_TEXT } from '@/services/map/geocoding';
import { formatCoord } from '@/utils/format';
import { useReportFlow } from '../ReportFlowContext';
import { useSaveDraft } from '../useSaveDraft';

export function ReviewStep() {
  const navigate = useNavigate();
  const flow = useReportFlow();
  const { isOnline } = useConnectivity();
  const { save, saving } = useSaveDraft();
  const { location } = flow;

  return (
    <div className="flex-1 flex flex-col">
      <StepHeader step={4} title="Periksa Ringkasan Laporan" tag="04 / Review" onBack={() => navigate('/lapor/detail')} />
      <div className="p-5 space-y-4 flex-1">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Cek Kebenaran Data</h2>
          <p className="text-xs text-slate-500 mt-0.5">Pastikan semua data sesuai sebelum dikirim. <Link to="/lapor/foto" className="text-blue-600 font-bold">Ubah foto</Link> · <Link to="/lapor/lokasi" className="text-blue-600 font-bold">lokasi</Link> · <Link to="/lapor/detail" className="text-blue-600 font-bold">detail</Link></p>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="h-44 w-full bg-slate-900 relative">
            <PhotoImage blob={flow.photo} alt="Foto kerusakan jalan" className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 text-blue-300" aria-hidden="true" />Foto Kerusakan Jalan</div>
          </div>
          <dl className="p-4 space-y-3 bg-white text-xs">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100"><dt className="text-slate-500">Jenis Kerusakan</dt><dd className="font-bold text-slate-800">{flow.category}</dd></div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100"><dt className="text-slate-500">Tingkat Keparahan</dt><dd className={`font-bold px-2.5 py-0.5 rounded-md ${flow.severity ? SEVERITY_BADGE[flow.severity] : ''}`}>{flow.severity}</dd></div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100"><dt className="text-slate-500">Kondisi</dt><dd className="font-bold text-slate-800">{flow.condition}</dd></div>
            <div>
              <dt className="text-slate-500 mb-1">Lokasi</dt>
              <dd className="font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">{flow.address ?? ADDRESS_PENDING_TEXT}</dd>
              {location && <dd className="flex gap-4 mt-1.5 text-xs font-mono text-slate-500 px-1"><span>Lat: <strong className="text-slate-700">{formatCoord(location.latitude)}</strong></span><span>Long: <strong className="text-slate-700">{formatCoord(location.longitude)}</strong></span></dd>}
            </div>
            <div><dt className="text-slate-500 mb-1">Catatan</dt><dd className="text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200 break-words">{flow.description || 'Tidak ada catatan tambahan.'}</dd></div>
          </dl>
        </div>

        {isOnline ? (
          <Notice tone="info"><span className="flex gap-2 items-start"><Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /><span>Setelah dikirim, foto dicek otomatis sebagai bantuan validasi visual. Hasilnya berupa rekomendasi dan tetap diverifikasi petugas.</span></span></Notice>
        ) : (
          <Notice tone="warning" title="Tidak ada internet"><span className="flex gap-2 items-start"><WifiOff className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /><span>Validasi AI membutuhkan internet. Simpan sebagai draft; laporan dikirim otomatis saat internet kembali.</span></span></Notice>
        )}
      </div>

      <div className="p-5 pt-2 flex flex-col gap-2">
        {isOnline ? (
          <>
            <Button onClick={() => navigate('/lapor/validasi')} icon={<Send className="w-4 h-4" aria-hidden="true" />}>Kirim &amp; Validasi AI</Button>
            <Button variant="ghost" loading={saving} onClick={() => void save()} className="!text-xs !py-2.5">Simpan Sebagai Draft Dulu</Button>
          </>
        ) : (
          <Button loading={saving} onClick={() => void save()} className="!bg-amber-600 hover:!bg-amber-700 !text-white">Simpan sebagai Draft Offline</Button>
        )}
      </div>
    </div>
  );
}
