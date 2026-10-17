# Daftar Centang Desain (Cek Desain) PulmoTriage

Acuan: `docs/DESIGN.md`, `docs/desain-figma.md`, dan citra referensi `docs/ref/*.png`.  
Tanggal Pengujian: 17 Oktober 2026  
Metode Pengujian: Skrip otomatis Puppeteer (Microsoft Edge Headless) pada `http://localhost:3000`, `http://localhost:8001`, dan pemindaian statis AST/Grep.

---

## 1. Tabel Ringkasan Hasil Cek Desain

| No | Butir Pengujian | Sumber Aturan | Hasil Uji | Keterangan & Nilai Terukur |
|:---|:---|:---|:---:|:---|
| 1 | **Header lengket (sticky) tinggi 64px** | `DESIGN.md` | **LULUS** | `position: sticky`, `top: 0px`, kelas `h-16` (64px) + border 1px (`computedHeight: 65px`), `zIndex: 40`. |
| 2 | **Lebar isi maksimum 1200px** | `DESIGN.md` | **LULUS** | Kontainer `<main>` menggunakan `max-w-[1200px]`, computed width: `1200px` pada viewport 1366px. |
| 3 | **Font hanya Fraunces / Atkinson Next / Mono** | `DESIGN.md` | **PERHATIAN** | Token lokal terdefinisi di CSS (`--font-fraunces`, `--font-atkinson`, `--font-mono`). Namun ditemukan beberapa kelas Tailwind bawaan sisa ekspor Figma (seperti `font-['Inter']`) yang perlu distandarisasi ke font token. |
| 4 | **Ukuran teks < 13px dan tombol < 44px** | `DESIGN.md` & PNG | **TERCATAT** | Teridentifikasi 50 elemen teks < 13px (terbanyak 12px untuk badge, header tabel, dan label) dan 4 tombol < 44px (height 32–36px). *Sesuai aturan: Dicatat untuk disesuaikan pada tugas perbaikan tampilan.* |
| 5 | **Bentuk ikon kategori Lucide** | `DESIGN.md` & PNG | **LULUS** | MERAH = `octagon-alert`, KUNING = `triangle-alert`, HIJAU = `circle-check`, Citra Janggal = `scan-search`. Bentuk vektor SVG identik dengan citra referensi. |
| 6 | **Kategori selalu Warna + Teks + Ikon** | `DESIGN.md` | **LULUS** | Semua elemen kategori (banner hasil, kartu triase, badge riwayat) memuat tiga indikator bersamaan: warna latar/border, teks label kategori, dan ikon simbolis. |
| 7 | **Disclaimer terlihat di layar Hasil** | `DESIGN.md` | **LULUS** | Elemen `<aside role="note">` tampil di Layar Hasil dengan computed `display: flex`, `visibility: visible`, dan teks peringatan triase lengkap. |
| 8 | **Grep kata dilarang ("akurasi 100", "pasti TBC", "Nakes")** | `DESIGN.md` | **LULUS (0 Temuan)** | Pemindaian seluruh berkas `frontend/` menghasilkan 0 kemunculan kata terlarang. Istilah baku yang digunakan adalah "dokter" dan "alat bantu triase". |
| 9 | **Layar Hasil di viewport 1366x660 (tanpa scroll)** | `DESIGN.md` | **LULUS** | Pada viewport 1366×660: Pita kategori (`bottom: 224px`), anjuran klinis (`bottom: 310px`), dan tombol Setuju/Tidak setuju (`bottom: 546px`) semuanya terlihat di atas batas 660px tanpa scroll. |
| 10 | **Tampilan 1366x768 tanpa scroll horizontal** | `DESIGN.md` | **LULUS** | `document.documentElement.scrollWidth (1366px) <= clientWidth (1366px)`. Tidak ada luapan horizontal pada viewport standar. |

---

## 2. Rincian Temuan & Hasil Pengukuran

### 2.1. Header Lengket (Sticky) & Geometri
- **Elemen**: `<header>`
- **Computed Style**:
  - `position`: `sticky`
  - `top`: `0px`
  - `height`: `65px` (terdiri dari 64px area konten `h-16` + 1px garis batas `border-b border-zinc-200`)
  - `z-index`: `40`
  - `background`: `rgba(255, 255, 255, 0.9)` dengan `backdrop-filter: blur(8px)` (kaca)
- **Evaluasi**: Memenuhi spesifikasi header lengket 64px.

### 2.2. Kontainer Utama
- **Elemen**: `<main class="w-full max-w-[1200px] ...">`
- **Computed Style**:
  - `max-width`: `1200px`
  - `width`: `1200px` (terpusat dengan margin auto)
- **Evaluasi**: Presisi sesuai batas 1200px di `DESIGN.md`.

### 2.3. Audit Font (Computed Styles)
Token font lokal didefinisikan pada `frontend/app/layout.js`:
- Judul / Display: `Fraunces`
- Teks Isi / Antarmuka: `Atkinson Hyperlegible Next`
- Angka / Kode / Tabel: `Atkinson Hyperlegible Mono`

**Temuan Sisa Kelas Ekspor Figma**:
- Pada beberapa bagian kode masih terdapat kelas inline mentah seperti `font-['Fraunces']` atau `font-['Inter']` hasil salinan potongan Figma.
- *Rekomendasi tindak lanjut*: Ganti seluruh kelas inline tersebut dengan utilitas standar `font-fraunces`, `font-atkinson`, dan `font-mono`.

### 2.4. Daftar Ukuran Teks < 13px dan Tombol < 44px
Sesuai instruksi tugas, elemen yang memiliki ukuran font di bawah 13px atau tinggi tombol di bawah 44px didaftar tanpa diubah:

#### A. Teks di Bawah 13px (Ukuran 10px – 12px)
| No | Tag | Kelas CSS | Ukuran Font | Teks Cuplikan | Alasan Desain / Catatan |
|:---|:---|:---|:---:|:---|:---|
| 1 | `span` | Nav header | 12px | `"Dasbor"` | Teks label pendukung di header |
| 2 | `div` | `text-[11px] font-atkinson` | 11px | `"Sinkron terakhir: Hari ini"` | Metadata waktu luring pada SyncBar |
| 3 | `span` | `text-xs font-mono font-medium` | 12px | `"26"`, `"15"`, `"0"` | Angka penghitung pada badge filter riwayat |
| 4 | `th` | `text-xs font-bold font-atkinson` | 12px | `"NO."`, `"WAKTU"`, `"PASIEN"`, dll. | Header kolom tabel riwayat (8 kolom) |
| 5 | `span` | `h-6 px-2.5 bg-gray-100 rounded-full` | 12px | `"Belum ditinjau"` | Badge status tinjauan dokter |
| 6 | `span` | `size-5 rounded-full` | 10px | `"!"` | Indikator peringatan sinkronisasi |
| 7 | `p` | `text-xs font-atkinson` | 12px | `"Data anonim: nama & identitas..."` | Catatan privasi medis di kaki halaman |

*(Catatan: Sebagian besar teks 12px ini sesuai dengan citra referensi Figma PNG `docs/ref/*.png`, seperti pada tabel riwayat dan badge pill)*.

#### B. Tombol di Bawah 44px (Tinggi < 44px)
| No | ID Elemen | Kelas CSS | Tinggi Terukur | Teks Tombol | Rekomendasi Penyesuaian |
|:---|:---|:---|:---:|:---|:---|
| 1 | `#btn-sync-now` | `h-8 px-3 rounded-[10px]` | **32px** | `"Sinkronkan sekarang"` | Tombol aksi cepat di SyncBar |
| 2 | `#filter-semua` | `h-9 px-4 rounded-full` | **36px** | `"Semua 26"` | Tab filter riwayat (bentuk kapsul) |
| 3 | `#filter-belum-ditinjau` | `h-9 px-4 rounded-full` | **36px** | `"Belum ditinjau 15"` | Tab filter riwayat |
| 4 | `#filter-menunggu-sinkron` | `h-9 px-4 rounded-full` | **36px** | `"Menunggu sinkron 0"` | Tab filter riwayat |
| 5 | `#btn-coba-lagi` | `h-8 px-3.5 rounded-[10px]` | **32px** | `"Coba lagi"` | Tombol coba ulang pada banner error |

*(Catatan: Tombol utama operasional alur pasien—seperti "Lanjut", "Analisis", "Kosongkan form", "Simpan tinjauan", dan "Buka surat rujukan"—semuanya telah berukuran `h-11` = 44px).*

### 2.5. Ikon Kategori Lucide
- **MERAH (`octagon-alert`)**: Poligon oktagon merah dengan tanda seru vertikal di tengah.
- **KUNING (`triangle-alert`)**: Segitiga sama kaki kuning dengan tanda seru di tengah.
- **HIJAU (`circle-check`)**: Lingkaran hijau dengan lambang centang simetris di tengah.
- **Citra Janggal (`scan-search`)**: Kotak viewfinder sudut putus dengan simbol kaca pembesar / tanda tanya.
- **Hasil**: Bentuk geometri SVG cocok persis dengan ikon pada citra PNG referensi.

### 2.6. Kategori Triple-Indicator (Warna + Teks + Ikon)
- Tidak ada status triase yang hanya mengandalkan warna semata (memenuhi kriteria aksesibilitas WCAG 2.1 untuk pengguna dengan defisiensi penglihatan warna / buta warna).
- Setiap kategori selalu menyertakan nama jelas dalam huruf kapital ("MERAH", "KUNING", "HIJAU") dan ikon bentuk yang berbeda secara morfologis.

### 2.7. Disclaimer Hukum & Medis
- Elemen `<aside role="note" ...>` selalu dirender pada bagian atas Layar Hasil (Langkah 3) dan di kaki tabel Riwayat / Dasbor.
- Latar netral `#EEF2F2`, border halus `#E4E4E7`, teks terbaca jelas dengan kontras tinggi.

### 2.8. Pemindaian Kata Terlarang (Grep Sanitization)
Perintah pemindaian:
```bash
grep -rn "akurasi 100" frontend/
grep -rn "pasti TBC" frontend/
grep -rn "Nakes" frontend/
```
Hasil: **0 temuan**. Aplikasi konsisten menyebut peran pengguna sebagai **"dokter"** dan peran sistem sebagai **"alat bantu triase"**.

### 2.9. Layar Hasil di Viewport 1366x660
Pengujian dilakukan dengan menyetel dimensi viewport browser headless ke `1366 × 660` piksel:
- **Pita Kategori**: Koordinat Y bawah = `224px` (terlihat tanpa scroll).
- **Anjuran Tindakan**: Koordinat Y bawah = `310px` (terlihat tanpa scroll).
- **Tombol Tinjauan Dokter ("Setuju" & "Tidak setuju")**: Koordinat Y bawah = `546px` (terlihat tanpa scroll, sisa margin aman 114px dari batas bawah 660px).
- **Kesimpulan**: Alur keputusan cepat dokter dapat diselesaikan sepenuhnya tanpa perlu menggulir (scroll) layar.

### 2.10. Tampilan 1366x768 Tanpa Scroll Horizontal
- Lebar halaman: `1366px`
- Lebar viewport: `1366px`
- `hasHorizontalScroll`: `false`
- Tidak ada kontainer yang meluap ke luar lebar layar.
