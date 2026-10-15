import { ArrowRight, Camera, Check, CheckCircle, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { StepHeader } from '@/components/ui/StepHeader';
import { useObjectUrl } from '@/hooks/useObjectUrl';
import { formatBytes } from '@/utils/format';
import { compressImage, validateImageFile } from '@/utils/image';
import { useReportFlow } from '../ReportFlowContext';

export function PhotoStep() {
  const navigate = useNavigate();
  const flow = useReportFlow();
  const previewUrl = useObjectUrl(flow.photo);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // izinkan memilih file yang sama lagi
    if (!file) return;
    const invalid = validateImageFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      flow.setPhoto(await compressImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Foto tidak dapat diproses.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <StepHeader step={1} title="Foto Kerusakan Jalan" tag="01 / Foto" onBack={() => navigate('/lapor')} />
      <div className="p-5 space-y-4 flex-1">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Ambil Foto Kerusakan</h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Foto yang jelas membantu AI dan petugas menilai jenis dan tingkat kerusakan.</p>
        </div>

        {/* Kamera: capture="environment" membuka kamera belakang di HP. Galeri: pemilih file biasa. */}
        <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={onFile} className="hidden" aria-label="Ambil foto dengan kamera" />
        <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="hidden" aria-label="Pilih foto dari galeri" />

        {error && <Notice tone="error" title="Foto tidak dapat digunakan">{error}</Notice>}

        {!flow.photo ? (
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center text-center bg-slate-50/70">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3"><Camera className="w-8 h-8" aria-hidden="true" /></div>
            <p className="text-xs font-bold text-slate-700">Belum ada foto yang dipilih</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[230px]">Foto langsung dari kamera atau pilih dari galeri. Format JPEG/PNG/WebP, maks. 10 MB.</p>
            <div className="mt-4 flex gap-2 w-full max-w-[280px]">
              <Button size="sm" loading={processing} onClick={() => cameraRef.current?.click()} icon={<Camera className="w-4 h-4" aria-hidden="true" />}>Kamera</Button>
              <Button size="sm" variant="outline" disabled={processing} onClick={() => galleryRef.current?.click()} icon={<ImageIcon className="w-4 h-4" aria-hidden="true" />}>Galeri</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative shadow-md">
            {previewUrl && <img src={previewUrl} alt="Pratinjau foto kerusakan jalan" className="w-full h-60 object-cover" />}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> Foto siap · {formatBytes(flow.photo.size)}
            </div>
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button type="button" onClick={() => cameraRef.current?.click()} className="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer border border-white/20"><Camera className="w-3.5 h-3.5" aria-hidden="true" /> Ganti</button>
              <button type="button" onClick={() => flow.setPhoto(null)} className="px-3 py-1.5 bg-red-600/90 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Hapus</button>
            </div>
          </div>
        )}

        {flow.photo && (
          <button type="button" onClick={() => galleryRef.current?.click()} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">Pilih dari galeri</button>
        )}

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-800 mb-2">Ketentuan Kualitas Foto:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {['Jelas & tidak buram', 'Kerusakan terlihat utuh'].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/70 p-2 rounded-xl border border-emerald-100 font-medium"><Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /><span>{t}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-5 pt-3">
        <Button disabled={!flow.photo || processing} onClick={() => navigate('/lapor/lokasi')} icon={<ArrowRight className="w-4 h-4 order-last" aria-hidden="true" />}>Lanjutkan ke Lokasi</Button>
        {!flow.photo && <p className="text-center text-xs text-amber-700 mt-2 font-medium">* Foto wajib diambil atau dipilih terlebih dahulu</p>}
      </div>
    </div>
  );
}
