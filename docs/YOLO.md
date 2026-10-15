# Menambahkan YOLO ke LAPORIN

LAPORIN sudah punya **mesin** YOLO (server/ai/yoloProvider.ts). Yang belum ada adalah **file modelnya** —
model deteksi kerusakan jalan harus dilatih/disediakan sendiri. Tanpa file itu, `AI_MODE=YOLO` membalas
"File model YOLO belum ada".

> Lisensi: Ultralytics YOLO berlisensi **AGPL-3.0** (gratis untuk non-komersial/riset/open-source; produk
> komersial tertutup butuh Enterprise License berbayar). Model hasil latihan Anda juga terkena. Cek lisensi dataset.

## Mode AI

| `AI_MODE` | Cara kerja |
|---|---|
| `REAL_AI` | Google Gemini saja (default) |
| `YOLO` | Model YOLO lokal saja (tanpa internet, tanpa kuota) |
| `HYBRID` | YOLO dulu → bila lolos, Gemini memeriksa lagi. **Diterima hanya bila keduanya setuju** |
| `MOCK_AI` | Simulasi, tidak melihat foto |

## Langkah 1 — Siapkan dataset

Butuh foto jalan dengan **kotak pembatas (bounding box)** di tiap kerusakan.
- Dataset publik: RDD (Road Damage Detection), mis. RDD2022 — berisi foto dari beberapa negara; kondisi jalan di
  Indonesia berbeda, jadi hasil terbaik biasanya setelah **ditambah foto jalan Indonesia milik sendiri**.
- Memberi label foto sendiri: Roboflow, CVAT, atau LabelImg. Format ekspor: **YOLO**.
- Sertakan juga banyak foto **tanpa kerusakan / bukan jalan** sebagai contoh negatif agar model tidak asal mendeteksi.

## Langkah 2 — Latih model (Python)

```bash
pip install ultralytics
# data.yaml berisi path train/val dan names: [D00, D10, D20, D40]
yolo detect train data=data.yaml model=yolo11n.pt epochs=50 imgsz=640
```
Model `n` (nano) paling ringan dan cocok untuk server kecil. Google Colab bisa dipakai untuk GPU.
Periksa hasil validasi (mAP) sebelum memakainya.

## Langkah 3 — Ekspor ke ONNX

```bash
yolo export model=runs/detect/train/weights/best.pt format=onnx imgsz=640
```
Hasilnya `best.onnx`. Hanya keluaran YOLOv8/YOLO11 standar (`[1, 4+jumlah_kelas, N]`) yang didukung.

## Langkah 4 — Pasang di LAPORIN

1. Salin `best.onnx` ke `models/yolo/best.onnx`.
2. Edit `models/yolo/classes.json`: `names` harus **urut sama dengan `names` di data.yaml**, dan `map` memetakan tiap
   kelas ke salah satu kategori LAPORIN:
   `Jalan Berlubang`, `Jalan Retak (Buaya)`, `Jalan Rusak Berat / Amblas`, `Kerusakan Permukaan / Mengelupas`.
   Kelas yang tidak ada di `map` diabaikan.
3. Di `.env.local`:
   ```
   AI_MODE="YOLO"        # atau "HYBRID" (butuh juga GEMINI_API_KEY)
   ```
4. `npm install` (sekali) lalu restart `npm run dev`.
5. Cek **Profil → Pengaturan → Layanan Validasi AI**: harus *siap dipakai*, atau buka `http://localhost:3000/api/health`.

## Samakan cara resize dengan data latih
Dataset Roboflow biasanya berlabel **"Stretch to 640x640"** (foto diregangkan jadi persegi). Bila model dilatih dari dataset seperti itu,
isi `YOLO_RESIZE="stretch"` di `.env.local` agar foto saat dipakai diproses dengan cara yang sama. Bila Anda melatih dari foto asli,
biarkan `letterbox`. Coba keduanya pada beberapa foto uji bila hasilnya aneh.

## Cara membaca hasilnya
- **confidence** = skor deteksi YOLO (bukan probabilitas terkalibrasi). Ambang "yakin" di aplikasi: 0.6 (`src/config.ts`).
- **tingkat keparahan** = *heuristik* dari luas kotak terhadap foto (≥15% Berat, ≥4% Sedang), bukan keluaran model.
- Hasil tetap rekomendasi untuk diverifikasi petugas.

## Masalah umum
| Pesan | Penyebab |
|---|---|
| "Jumlah kelas model tidak cocok dengan classes.json" | `names` di classes.json tidak sama jumlahnya dengan model |
| "File model tidak dapat dimuat" | Bukan ONNX hasil ekspor YOLOv8/11 |
| Semua foto ditolak | Model belum cukup terlatih / turunkan `YOLO_CONF` (mis. 0.15) |
| Foto non-jalan lolos | Tambah contoh negatif saat training, atau pakai `HYBRID` |

## Catatan
Server memakai `onnxruntime-web` (WASM, CPU). Untuk model nano, 1 foto biasanya hitungan detik atau kurang;
untuk beban besar pertimbangkan GPU / `onnxruntime-node`.
File `server/ai/yolo/__fixtures__/fake-yolov8.onnx` adalah model **palsu** khusus untuk menguji pipeline, bukan model deteksi.
