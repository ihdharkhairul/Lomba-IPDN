import { CheckCircle2, ClipboardCheck, MapPin, ScanSearch, Smartphone, Route } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteImage } from '@/components/ui/SiteImage';

const STEPS = [
  ['Laporkan', 'Foto kerusakan jalan, tandai lokasinya dengan GPS, lalu isi detail singkat.'],
  ['AI Membantu Validasi', 'Foto dicek otomatis sebagai bantuan awal untuk menilai jenis kerusakan.'],
  ['Petugas Memverifikasi', 'Petugas memeriksa laporan beserta rekomendasi dari sistem.'],
  ['Laporan Ditindaklanjuti', 'Pantau status laporan sampai perbaikan selesai dikerjakan.'],
];

const FEATURES = [
  { icon: MapPin, title: 'Lokasi GPS', text: 'Koordinat tercatat otomatis dan tetap bisa diambil tanpa internet.' },
  { icon: ScanSearch, title: 'Validasi foto', text: 'Foto dianalisis AI sebagai rekomendasi, bukan keputusan akhir.' },
  { icon: Route, title: 'Pelacakan laporan', text: 'Lihat tahapan penanganan dari dikirim hingga selesai.' },
  { icon: Smartphone, title: 'Bisa dipakai offline', text: 'Simpan sebagai draft saat sinyal hilang, kirim saat internet kembali.' },
];

const KINDS = [
  ['kategori-berlubang.jpg', 'Jalan Berlubang'],
  ['kategori-retak.jpg', 'Jalan Retak'],
  ['kategori-amblas.jpg', 'Rusak Berat / Amblas'],
  ['kategori-permukaan.jpg', 'Permukaan Mengelupas'],
];

/** Halaman publik. Tidak menampilkan data pribadi apa pun. */
export function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-20 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <p className="text-sm font-semibold text-blue-700 mb-3">Pelaporan infrastruktur jalan</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">Laporkan Kerusakan Jalan dengan Mudah</h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">Bantu wujudkan jalan yang lebih aman melalui pelaporan berbasis lokasi dan validasi AI.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/daftar" className="px-6 py-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold transition-colors">Daftar</Link>
              <Link to="/masuk" className="px-6 py-3 rounded-lg bg-white border border-slate-300 hover:border-blue-700 hover:text-blue-700 text-slate-800 font-semibold transition-colors">Masuk</Link>
            </div>
            <ul className="mt-8 space-y-2 text-sm text-slate-600">
              {['Lokasi GPS otomatis', 'Tetap bisa dipakai saat offline', 'Status laporan bisa dipantau'].map((t) => (
                <li key={t} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />{t}</li>
              ))}
            </ul>
          </div>
          <SiteImage file="hero.jpg" alt="Foto utama: kerusakan jalan / petugas di lapangan" aspect="aspect-[4/3]" className="rounded-xl border border-slate-200" />
        </div>
      </section>

      {/* Cara kerja */}
      <section id="cara-kerja" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-6 py-14 lg:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Cara Kerja</h2>
        <p className="mt-2 text-slate-600 max-w-2xl">Empat tahap dari melapor sampai jalan diperbaiki.</p>
        <ol className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="border border-slate-200 rounded-xl p-5 bg-white">
              <span className="w-9 h-9 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center">{i + 1}</span>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Fitur */}
      <section id="fitur" className="scroll-mt-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 lg:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Fitur Utama</h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-5">
                <Icon className="w-6 h-6 text-blue-700" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jenis kerusakan */}
      <section id="jenis" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-6 py-14 lg:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Jenis Kerusakan yang Bisa Dilaporkan</h2>
        <p className="mt-2 text-slate-600 max-w-2xl">Pilih jenis yang paling sesuai saat membuat laporan.</p>
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KINDS.map(([file, label]) => (
            <figure key={file}>
              <SiteImage file={file} alt={label} aspect="aspect-[4/3]" className="rounded-lg border border-slate-200" />
              <figcaption className="mt-2 text-sm font-medium text-slate-800">{label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Tentang */}
      <section id="tentang" className="scroll-mt-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 lg:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <SiteImage file="tentang.jpg" alt="Foto pendukung: proses perbaikan jalan" aspect="aspect-[4/3]" className="rounded-xl border border-slate-200 lg:order-first" />
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Dibantu sistem, diputuskan oleh petugas</h2>
            <p className="mt-3 text-slate-600 leading-relaxed">LAPORIN memakai analisis foto otomatis untuk membantu memilah laporan. Hasilnya hanya rekomendasi dan tetap diverifikasi petugas sebelum ditindaklanjuti.</p>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
              {['Laporan terhubung ke titik koordinat yang jelas', 'Foto yang buram atau bukan jalan diminta diulang', 'Data laporan Anda hanya bisa dilihat oleh akun Anda'].map((t) => (
                <li key={t} className="flex items-start gap-2"><ClipboardCheck className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" aria-hidden="true" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Lihat jalan rusak di sekitar Anda?</h2>
            <p className="text-blue-100 mt-1">Daftar dan buat laporan pertama Anda dalam beberapa menit.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/daftar" className="px-6 py-3 rounded-lg bg-white text-blue-800 font-semibold hover:bg-blue-50">Daftar</Link>
            <Link to="/lapor" className="px-6 py-3 rounded-lg border border-white/50 text-white font-semibold hover:bg-white/10">Buat Laporan</Link>
          </div>
        </div>
      </section>
    </>
  );
}
