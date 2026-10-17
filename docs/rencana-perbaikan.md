# Rencana Perbaikan Tampilan (Tugas P0)

Dokumen ini disusun berdasarkan hasil validasi visual di `docs/laporan-validasi.md`, inspeksi citra referensi `docs/ref/*.png`, token desain di `docs/DESIGN.md`, spesifikasi geometri di `docs/desain-figma.md`, dan hasil audit alat uji `scripts/bandingkan.py` serta `scripts/audit-warna.py`.

---

## 1. Peringkat Layar Berdasarkan Persentase Perbedaan Piksel

Daftar berikut diurutkan dari persentase deviasi tertinggi hingga terendah. Untuk layar yang memuat citra rontgen atau peta panas (heatmap Grad-CAM), dicantumkan nilai sebelum dan sesudah area placeholder ditutup menggunakan opsi `--abaikan`:

| Peringkat | Kode Layar Referensi | Dimensi (2x) | % Beda Awal | % Beda (Masked) | Area Placeholder yang Diabaikan (`--abaikan x,y,w,h`) |
|:---:|:---|:---:|:---:|:---:|:---|
| 1 | `b4-unggah_popup-ditolak.png` | 2732×1536 | **78.38%** | 78.38% | — *(Seluruh layar tertutup backdrop overlay modal)* |
| 2 | `c5-hasil_tinjauan-tersimpan.png` | 2732×1536 | **36.09%** | **20.16%** | `166,300,1034,951` *(Wadah citra rontgen/heatmap kiri)* |
| 3 | `c4-hasil_citra-janggal.png` | 2732×1536 | **35.17%** | **19.12%** | `166,300,1034,951` *(Wadah citra rontgen/heatmap kiri)* |
| 4 | `c2-hasil_kuning.png` | 2732×1536 | **34.71%** | **18.71%** | `166,300,1034,951` *(Wadah citra rontgen/heatmap kiri)* |
| 5 | `c1-hasil_merah.png` | 2732×1536 | **34.36%** | **18.43%** | `166,300,1034,951` *(Wadah citra rontgen/heatmap kiri)* |
| 6 | `c3-hasil_hijau.png` | 2732×1536 | **34.30%** | **18.31%** | `166,300,1034,951` *(Wadah citra rontgen/heatmap kiri)* |
| 7 | `a2-pasien_terisi.png` | 2732×1536 | **31.45%** | 31.45% | — |
| 8 | `a3-pasien_error-validasi.png` | 2732×1536 | **31.36%** | 31.36% | — |
| 9 | `d1-dasbor_terisi.png` | 2732×2300 | **25.94%** | 25.94% | — |
| 10 | `a1-pasien_kosong.png` | 2732×1536 | **23.08%** | 23.08% | — |
| 11 | `b3-unggah_menganalisis.png` | 2732×1536 | **21.49%** | **8.82%** | `168,315,1632,883` *(Wadah pratinjau citra rontgen)* |
| 12 | `b5-unggah_error-server.png` | 2732×1536 | **21.24%** | 21.24% | — |
| 13 | `b2-unggah_citra-terpilih.png` | 2732×1536 | **19.78%** | **8.44%** | `168,315,1632,883` *(Wadah pratinjau citra rontgen)* |
| 14 | `d3-dasbor_gagal-memuat.png` | 2732×1536 | **15.39%** | 15.39% | — |
| 15 | `e1-riwayat_pemeriksaan.png` | 2732×1536 | **14.04%** | 14.04% | — |
| 16 | `b6-unggah_error-bukan-gambar.png` | 2732×1536 | **10.91%** | 10.91% | — |
| 17 | `b1-unggah_kosong.png` | 2732×1536 | **9.43%** | 9.43% | — |
| 18 | `d2-dasbor_kosong.png` | 2732×1536 | **8.75%** | 8.75% | — |
| 19 | `e2-riwayat_komponen-token.png` | 2732×2160 | **8.48%** | 8.48% | — |

---

## 2. Pengelompokan Penyebab Perbedaan (Kategori A – G)

### A. Warna & Token Desain
- **Temuan**: Masih ditemukan penggunaan kelas palet bawaan Tailwind (seperti `border-slate-400`, `bg-gray-100`, `border-zinc-200`, `text-gray-500`) dan hex literal inline non-token.
- **Dampak**: Warna border input, bayangan latar kartu, dan garis pembatas memiliki sedikit perbedaan saturasi/luminansi dibanding token DESIGN.md (`--color-teal-950`, `--color-status-neutral`, `--color-border`).
- **Layar Terdampak**: `a1`, `a2`, `a3`, `b1`, `b2`, `b5`, `c1`–`c5`, `d1`, `e1`.
- **Solusi**: Bersihkan seluruh kelas bawaan Tailwind dan gantikan secara seragam dengan variabel token CSS di `globals.css`.

### B. Font dan Rentang Bobot (Weight)
- **Temuan**: Berdasarkan inspeksi `fontTools`, berkas TTF bersifat variabel (`fvar` wght `200..800` pada Atkinson Next/Mono, dan `100..900` pada Fraunces). Namun pada `frontend/app/layout.js`, pemanggilan `localFont` belum menyertakan opsi rentang bobot (`weight: "100 900"` atau `"200 800"`), sehingga browser menyuntikkan `@font-face` dengan bobot kosong (`font-weight: ""`) yang menyebabkan variasi rendering teks tebal/medium. Selain itu font Geist default masih ter-inject.
- **Dampak**: Ketebalan glyph font judul dan label antarmuka berbeda 1–2 piksel pada rasterisasi teks di seluruh layar.
- **Layar Terdampak**: **Global (semua 19 layar)**.
- **Solusi**: Tambahkan deklarasi `weight` variabel pada `localFont` di `layout.js` dan hapus injeksi font Geist.

### C. Spasi, Ukuran, dan Tata Letak (Spacing & Layout)
- **Temuan**:
  - Citra referensi Figma diekspor dari tata letak posisi absolut statis (`left-[..px] top-[..px]`), sedangkan frontend menggunakan Flexbox/CSS Grid responsif.
  - Terjadi deviasi margin vertikal minor:
    - Form pasien (`a1`–`a3`): Jarak celah antar kolom (`gap-6` vs `gap-3.5`) dan padding dalam kartu ringkasan.
    - Wadah citra rontgen (`c1`–`c5`): Tinggi wadah citra saat ini adalah `h-96` (384px), sedangkan pada mockup Figma berkisar antara 400–440px.
    - Dasbor (`d1`): Lebar kolom Puskesmas dan tinggi kartu statistik ringkasan.
- **Dampak**: Bounding box kartu bergeser vertikal beberapa piksel yang terakumulasi ke bagian bawah halaman.
- **Layar Terdampak**: `a1`, `a2`, `a3`, `b2`, `b3`, `c1`–`c5`, `d1`, `e1`.
- **Solusi**: Sesuaikan padding, margin, dan gap pada kontainer utama agar posisi elemen kartu sejajar presisi dengan referensi Figma.

### D. Ikon Vektor
- **Temuan**:
  - Bentuk geometri ikon kategori (`octagon-alert`, `triangle-alert`, `circle-check`, `scan-search`) sudah benar secara morfologis.
  - Perbedaan piksel minor timbul dari ketebalan garis (`strokeWidth: 2` vs `2.5`) dan ukuran kotak ikon (`size-4` vs `size-3.5`).
- **Dampak**: Selisih piksel lokal terpusat di dalam kotak ikon.
- **Layar Terdampak**: `a1`, `a2`, `b1`, `c1`–`c4`, `e1`.
- **Solusi**: Samakan `strokeWidth` dan ukuran viewBox ikon dengan acuan referensi.

### E. Komponen Hilang atau Salah Susun
- **Temuan**:
  - Pada `b4-unggah_popup-ditolak.png`, modal penolakan kualitas rontgen di frontend menggunakan backdrop gelap semi-transparan `bg-neutral-900/60` dan dialog tengah, sedangkan di Figma mockup posisi kartu penolakan berada tepat di atas area dropzone dengan latar semi-terang.
  - Pada header stepper, garis penghubung antar nomor langkah (*step connectors*) memiliki ketebalan dan warna yang sedikit berbeda.
- **Dampak**: Persentase beda sangat tinggi pada `b4` (78.38%).
- **Layar Terdampak**: `b4`, `a1`–`c5` (stepper).
- **Solusi**: Selaraskan posisi, lebar, dan opacity backdrop `QualityModal` agar menyerupai tampilan referensi.

### F. Teks & Format Representasi
- **Temuan**:
  - Penulisan angka desimal skor AI: format standar Indonesia menggunakan koma (`0,87` bukan `0.87`).
  - Label unit usia: `"45 tahun"` vs `"45 th"`.
  - Teks disclaimer di footer: redaksi dan ukuran font catatan privasi luring.
- **Dampak**: Selisih piksel pada karakter teks tertentu.
- **Layar Terdampak**: `a2`, `c1`–`c5`, `e1`.
- **Solusi**: Samakan redaksi string teks statis dan fungsi format angka dengan citra referensi PNG.

### G. State Dinamis & Penanganan Interaksi
- **Temuan**:
  - Layar `b3` (menganalisis) memerlukan animasi spinner dan status disabled yang stabil saat tangkapan layar diambil.
  - Layar `b5` dan `d3` (server error) memerlukan trigger simulasi jaringan offline yang konsisten.
  - Layar `d2` (dasbor kosong) memerlukan endpoint pembersihan data simulasi (`DELETE /demo`).
- **Dampak**: Layar-layar ini memiliki dependensi state pengujian.
- **Layar Terdampak**: `b3`, `b4`, `b5`, `d2`, `d3`.
- **Solusi**: Pertahankan skrip otomatisasi Puppeteer yang sudah terbukti andal mengontrol state-state ini secara deterministik.

---

## 3. Faktor Penyebab Global (Global Drivers)

Empat faktor berikut bersifat **sistemik** dan memengaruhi hampir seluruh layar secara bersamaan:

1. **Konfigurasi Font Variabel di `layout.js`**:
   - Deklarasi `@font-face` tanpa rentang bobot menyebabkan mesin peramban melakukan faux-bolding atau fallback antialiasing yang berbeda dengan Figma.
   - Perbaikan deklarasi bobot `weight: "100 900"` (Fraunces) dan `weight: "200 800"` (Atkinson) akan secara otomatis menurunkan deviasi piksel di seluruh teks antarmuka.

2. **Konsistensi Token Palet Warna CSS Variables**:
   - Penggantian seragam dari kelas utilitas Tailwind ad-hoc (`slate-400`, `zinc-200`, `gray-100`) ke variabel CSS token (`--color-border`, `--color-teal-950`, dll.) akan menghilangkan selisih warna pada seluruh batas kotak dan latar belakang.

3. **Placeholder Citra Rontgen Dinamis vs Statis**:
   - Citra rontgen nyata di frontend vs placeholder silang Figma menyumbang deviasi ~16% pada layar Langkah 2 dan 3.
   - Opsi `--abaikan` pada `scripts/bandingkan.py` berhasil mengisolasi deviasi ini secara objektif.

4. **Sistem Spasi Vertikal Header & Kontainer Utama**:
   - Standarisasi tinggi header sticky (64px) dan padding kontainer `max-w-[1200px]` menjadi jangkar acuan posisi seluruh kartu di bawahnya.

---

## 4. Rencana Langkah Kerja Perbaikan (Tugas Mendatang)

Perbaikan tampilan akan dilakukan secara terfokus per grup layar dengan siklus iterasi (maksimal 3 putaran verifikasi per tugas):

1. **Fondasi Global**:
   - Deklarasikan rentang bobot variabel pada `localFont` di `frontend/app/layout.js`.
   - Bersihkan font Geist bawaan yang tidak terpakai.
   - Petakan token CSS variables lengkap di `frontend/app/globals.css`.

2. **Langkah 1 (Data Pasien: `a1`, `a2`, `a3`)**:
   - Sesuaikan spasi kolom formulir, border input (`border-slate-400` → token border), dan badge gejala.
   - Target deviasi: turun ke bawah 15%.

3. **Langkah 2 (Unggah Citra: `b1`, `b2`, `b3`, `b4`, `b5`, `b6`)**:
   - Sesuaikan tinggi wadah dropzone rontgen dan styling kartu preview.
   - Redesain backdrop dan posisi dialog modal `b4`.
   - Target deviasi: turun ke bawah 10% (dengan `--abaikan` untuk area citra).

4. **Langkah 3 (Layar Hasil: `c1`, `c2`, `c3`, `c4`, `c5`)**:
   - Selaraskan tinggi wadah citra rontgen kiri, banner kategori triase, dan kartu tinjauan dokter.
   - Target deviasi: turun ke bawah 12% (dengan `--abaikan` untuk area citra).

5. **Dasbor Dinkes & Riwayat (`d1`, `d2`, `d3`, `e1`)**:
   - Sesuaikan spasi tabel riwayat, badge status sinkron, dan layout kartu grafik dasbor.
   - Target deviasi: turun ke bawah 10%.

---

## 5. Hasil Verifikasi Tugas P1: Token dan Font (Global)

Pada tahap P1, dilakukan standardisasi token warna DESIGN.md sebagai CSS variables di `globals.css`, pemetaan ke Tailwind `@theme inline`, penghapusan seluruh kelas palet Tailwind bawaan dan hex non-token di `frontend/`, serta aktivasi `@font-face` lokal dengan rentang bobot variabel (`weight: "100 900"` untuk Fraunces, `"200 800"` untuk Atkinson Next dan Mono).

### Audit Kepatuhan Token (`scripts/audit-warna.py`)
- **Kelas Palet Bawaan Tailwind Terdeteksi**: **0 kemunculan** (Nol temuan, target terpenuhi).
- **Hex Literal Non-Token Terdeteksi**: **0 kemunculan** (Nol temuan, target terpenuhi).

### Verifikasi Tipografi Computed Style
- **Judul `<h1>`**: Font Fraunces semibold (`fontFamily: "fraunces, Georgia, serif"`, `fontWeight: "600"`).
- **Badge & Label Kategori**: Atkinson Next extrabold (`fontFamily: "atkinsonNext, sans-serif"`, `fontWeight: "800"`).
- **Angka & Skor**: Atkinson Mono (`fontFamily: "atkinsonMono, monospace"`, `fontFeatureSettings: "\"lnum\", \"tnum\""` / tabular-nums).

### Evaluasi Perbandingan Piksel Sebelum vs Sesudah P1 (`scripts/bandingkan.py`)

| No. | Layar Referensi | % Sebelum (Raw) | % Sebelum (Masked) | % Sesudah P1 (Raw) | % Sesudah P1 (Masked) | Selisih | Catatan P1 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---|
| 1 | `a1-pasien_kosong.png` | 23.08% | 23.08% | **23.07%** | 23.07% | -0.01% | Token warna latar, border line, dan font Fraunces aktif |
| 2 | `a2-pasien_terisi.png` | 31.45% | 31.45% | **35.97%** | 35.97% | +4.52% | Perubahan metrik rendering font variabel vs teks fallback |
| 3 | `a3-pasien_error-validasi.png` | 31.36% | 31.36% | **34.08%** | 34.08% | +2.72% | Banner error kini memakai token `status-error` / `status-error-bg` |
| 4 | `b1-unggah_kosong.png` | 9.43% | 9.43% | **9.66%** | 9.66% | +0.23% | Dropzone border line-strong & token primary |
| 5 | `b2-unggah_citra-terpilih.png` | 19.78% | 8.44% | **20.17%** | **8.51%** | +0.07% | Masked area rontgen stabil |
| 6 | `b3-unggah_menganalisis.png` | 21.49% | 8.82% | **21.88%** | **8.91%** | +0.09% | Overlay status ink/80 & token primary |
| 7 | `b4-unggah_popup-ditolak.png` | 78.38% | 78.38% | **78.45%** | 78.45% | +0.07% | Modal quality gate menggunakan token ink/40 & SVG bebas hex |
| 8 | `b5-unggah_error-server.png` | 21.24% | 21.24% | **21.34%** | 21.34% | +0.10% | Banner server error memakai token status-error & status-error-bg |
| 9 | `b6-unggah_error-bukan-gambar.png` | 10.91% | 10.91% | **11.05%** | 11.05% | +0.14% | Border status-error & background status-error-bg |
| 10 | `c1-hasil_merah.png` | 34.36% | 18.43% | **36.96%** | **20.46%** | +2.03% | Banner triage-merah & on-triage-merah |
| 11 | `c2-hasil_kuning.png` | 34.71% | 18.71% | **37.33%** | **20.73%** | +2.02% | Banner triage-kuning & on-triage-kuning |
| 12 | `c3-hasil_hijau.png` | 34.30% | 18.31% | **36.89%** | **20.31%** | +2.00% | Banner triage-hijau & on-triage-hijau |
| 13 | `c4-hasil_citra-janggal.png` | 35.17% | 19.12% | **37.22%** | **20.76%** | +1.64% | Skor atipikal mono dengan tanda `(?)` dan bilah line-strong |
| 14 | `c5-hasil_tinjauan-tersimpan.png` | 36.09% | 20.16% | **39.56%** | **23.06%** | +2.90% | Kartu tinjauan tersimpan border primary |
| 15 | `d1-dasbor_terisi.png` | 25.94% | 25.94% | **25.92%** | 25.92% | -0.02% | Kartu dasbor dan grafik batang bertumpuk token triase |
| 16 | `d2-dasbor_kosong.png` | 8.75% | 8.75% | **8.99%** | 8.99% | +0.24% | State kosong token surface, ink, dan line |
| 17 | `d3-dasbor_gagal-memuat.png` | 15.39% | 15.39% | **15.52%** | 15.52% | +0.13% | Banner gagal memuat dasbor token status-error |
| 18 | `e1-riwayat_pemeriksaan.png` | 14.04% | 14.04% | **14.78%** | 14.78% | +0.74% | Tabel riwayat token border line, ink, dan badge triase |
| 19 | `e2-riwayat_komponen-token.png` | 8.48% | 8.48% | **8.48%** | 8.48% | +0.00% | Audit komponen token stabil |
