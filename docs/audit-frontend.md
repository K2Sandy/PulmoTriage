# Audit Frontend PulmoTriage (Tugas F0)

Dokumen ini menyajikan hasil audit mendalam terhadap kode `frontend/`, `backend/`, `cloud/`, serta spesifikasi desain pada `docs/desain-figma.md` sebagai landasan pengerjaan antarmuka di branch `frontend-desain`.

---

## 1. Daftar Endpoint Backend dan Cloud
3
### A. Backend Puskesmas (`backend/main.py` & `backend/db.py`)
Berjalan secara luring-pertama (*offline-first*) di komputer Puskesmas (port bawaan 8000).

| Endpoint | Metode | Parameter Masukan | Field Respons Utama | Keterangan & Kompatibilitas |
|---|:---:|---|---|---|
| `/health` | `GET` | - | `status`, `model_version` | Pengecekan kesiapan backend dan model AI. |
| `/analyze` | `POST` | `foto` (UploadFile multipart), `gejala` (str koma), `nama` (str), `umur` (int 0–120), `jenis_kelamin` ("L"/"P"/"") | **Jika Sukses (`status: "ok"`):**<br>- `prob_tb` (float)<br>- `triage` (`category`, `title`, `action`, `ai_level`, `reasons`, `atypical`)<br>- `warnings` (list str)<br>- `heatmap_png` (base64 PNG)<br>- `id` (int SQLite)<br>**Jika Ditolak (`status: "rejected"`):**<br>- `quality.passed: false`<br>- `quality.issues` (`[{"code": "...", "message": "..."}]`) | Alur inferensi AI utama, gerbang kualitas, dan penyimpanan otomatis ke SQLite. Validasi error: HTTP 400 (bukan gambar), HTTP 422 (jenis kelamin / kode gejala salah). |
| `/pemeriksaan` | `GET` | `limit: int = 50` | List of pemeriksaan:<br>`id`, `dibuat_pada`, `nama`, `umur`, `jenis_kelamin`, `gejala`, `prob_tb`, `ai_level`, `kategori`, `atipikal`, `keputusan_dokter`, `ditinjau_pada`, `tersinkron` | Mengambil riwayat pemeriksaan (tanpa kolom berat `heatmap_png`). **Catatan:** Backend belum memiliki filter pencarian query (`q`) maupun filter status di sisi database. |
| `/pemeriksaan/{id}` | `GET` | `id` (path) | Detail pemeriksaan lengkap termasuk `heatmap_png` dan `catatan_dokter` | Dipakai saat dokter membuka kembali rincian pemeriksaan dari riwayat. |
| `/pemeriksaan/{id}/tinjau` | `POST` | `keputusan` (form str: "setuju" / "tidak_setuju"), `catatan` (form str, opsional) | `{"id": id, "keputusan": keputusan}` | Menyimpan konfirmasi telaah dokter dan catatan klinis ke SQLite. **Menerima keputusan dan catatan.** |
| `/pemeriksaan/{id}/rujukan.pdf` | `GET` | `id` (path) | File biner `application/pdf` | Draf surat rujukan. Menghilangkan tanda DRAFT dan memuat putusan dokter jika sudah ditinjau. |
| `/sinkron/status` | `GET` | - | `{"menunggu": int}` | Mengembalikan jumlah baris di SQLite yang bernilai `tersinkron = 0`. |
| `/sinkron` | `POST` | - | `status` ("ok" / "offline" / "ditolak"), `terkirim` (int), `menunggu` (int), `kode` (int jika error) | Memulai pengiriman batch data anonim ke layanan cloud. |

---

### B. Layanan Cloud (`cloud/main.py`)
Berjalan di cloud untuk agregasi Dinas Kesehatan (port bawaan 8001).

| Endpoint | Metode | Parameter Masukan | Field Respons Utama | Keterangan |
|---|:---:|---|---|---|
| `/health` | `GET` | - | `{"status": "ok"}` | Pengecekan server cloud. |
| `/sync` | `POST` | Header `X-API-Key`, Body `puskesmas_id`, list `records` | `{"diterima": int, "duplikat": int}` | Penerima batch data triase anonim. Melewati UID yang sudah ada (idempoten). Menolak jika kunci API salah (HTTP 401). |
| `/dashboard/ringkasan` | `GET` | Query `hari: int = 30` (1..365) | `hari`, `total`, `per_kategori` (MERAH, KUNING, HIJAU), `per_hari` (list tanggal & kategori), `per_puskesmas` (list agregasi per PKM), `ada_data_simulasi` (bool) | Sumber data utama dasbor Dinas Kesehatan. |
| `/demo/seed` | `POST` | Header `X-API-Key`, Query `n = 300` | `{"dibuat": n}` | Mengisi data simulasi untuk keperluan peragaan/demo dasbor. |
| `/demo` | `DELETE` | Header `X-API-Key` | `{"dihapus": int}` | Menghapus seluruh data simulasi dari database cloud. |

---

## 2. Status Komponen Frontend Saat Ini

| Bagian Antarmuka | Status di Repositori | Keterangan |
|---|:---:|---|
| **Struktur Proyek Next.js** | Ada (di branch `langkah-5-7`, belum di `main`) | Menggunakan Next.js 16.4.1 (App Router, Turbopack), React 19. |
| **Form Pasien 1 Layar** | Ada (stand-in awal) | Form monolitik sederhana tanpa pembagian tahapan *wizard*. |
| **Alur Multi-Langkah (Wizard 3 Langkah)** | **Belum Ada** | Belum ada pemisahan Langkah 1 (Data Pasien & Gejala), Langkah 2 (Unggah Citra & Kualitas), dan Langkah 3 (Hasil Analisis). |
| **Komponen Drag-and-Drop & Preview Foto** | **Belum Ada** | Masih memakai input berkas bawaan browser (`<input type="file">`). |
| **Inspeksi Kualitas Citra & Dialog Edukasi** | **Belum Ada** | Hanya menampilkan pesan teks `ul/li` polos jika ditolak. Belum ada modal edukasi perbandingan "Foto Anda vs Contoh yang baik". |
| **Toggle Peta Panas vs Citra Asli** | **Belum Ada** | Hanya menampilkan citra Grad-CAM yang sudah dioverlay base64. |
| **Formulir Tinjauan Dokter Lengkap** | Sebagian | Tombol "Dokter setuju/tidak setuju" sudah ada, namun belum ada textarea "Catatan dokter" terintegrasi dan ringkasan badge tinjauan. |
| **Halaman / Tab Riwayat Pemeriksaan** | **Belum Ada** | Belum ada antarmuka tabel riwayat pasien, filter tab, maupun kolom status sinkronisasi per baris. |
| **Bar Status Sinkronisasi & Toast** | Sebagian | Bar sederhana penampil angka antrean sudah ada. Belum ada toast notifikasi bertema kaca (*glassmorphism*) dan penanganan status "Menyinkronkan...". |
| **Dasbor Dinas Kesehatan** | Ada (versi dasar) | Sudah ada 4 kartu metrik, filter 7/30/90 hari, chart batang div, dan tabel Puskesmas, namun belum mengadopsi token dan tata letak Figma secara presisi. |
| **Token Desain & Font Lokal** | **Belum Ada** | Masih menggunakan font sans-serif bawaan browser dan palet warna standar. |

---

## 3. Analisis Perbedaan Desain Figma vs Backend (Per Layar)

### A. Layar 1: Data Pasien & Gejala Klinis
- **Desain Figma**:
  - Terdapat field "No. Rekam Medis" (`RM-000123`).
  - Terdapat input textarea "Catatan klinis (opsional)".
  - Pemilihan jenis kelamin menggunakan *radio button* bulat kustom (Laki-laki / Perempuan).
  - Gejala TBC disusun dalam 2 kolom checkbox dengan ikon centang khusus.
  - Terdapat pesan peringatan inline: "Umur harus antara 0 dan 120 tahun."
- **Kondisi Backend**:
  - Endpoint `POST /analyze` **hanya** menerima: `foto`, `gejala`, `nama`, `umur`, `jenis_kelamin`.
  - Backend **TIDAK** memiliki kolom `no_rekam_medis` maupun `catatan_klinis_awal`.
  - **Rekomendasi Frontend**:
    - "No. Rekam Medis" dapat digabungkan ke field `nama` (misalnya input format `Nama / No. RM`) atau disimpan di state lokal untuk display.
    - "Catatan klinis awal" yang belum didukung di backend dapat dialihkan agar diisi dokter pada Langkah 3 (Tinjauan Dokter), di mana backend sudah menyediakan `catatan_dokter`.

### B. Layar 2: Unggah Citra & Pemeriksaan Kualitas
- **Desain Figma**:
  - Kolom kiri: Area *drag-and-drop* berkas, preview thumbnail, nama file, ukuran, dimensi piksel, dan tombol "Ganti foto".
  - Kolom kanan: Ringkasan data pasien dari Langkah 1 beserta tombol "Ubah", serta petunjuk "Agar foto bisa dianalisis".
  - Indikator live status pemeriksaan: "Citra rontgen toraks terdeteksi", "Posisi frontal", "Citra terlalu buram", dll.
  - Modal/Kartu penolakan jika citra gagal: "Citra ditolak — mohon ambil ulang" dengan perbandingan visual "Foto Anda vs Contoh yang baik" dan tombol "Unggah Ulang".
- **Kondisi Backend**:
  - Backend mengembalikan kode penolakan spesifik di `hasil.quality.issues`. Kode yang tersedia:
    - `BURAM`: Citra terlalu buram.
    - `BERDERAU`: Citra terlalu berbintik (*noise*).
    - `PENCAHAYAAN`: Citra terlalu gelap atau terlalu terang.
    - `KONTRAS_RENDAH`: Kontras citra terlalu rendah.
    - `BUKAN_RONTGEN`: Citra berwarna terdeteksi.
    - `TIDAK_DIKENALI`: Citra tidak dikenali sebagai rontgen toraks posisi frontal.
    - `SALAH_POSISI`: Citra tampak terputar atau terbalik.
    - `RESOLUSI_RENDAH`: Sisi terpendek < 200 piksel.
  - **Catatan**: Backend **tidak** menyediakan gambar contoh yang baik secara dinamis. Frontend perlu menyematkan gambar referensi SVG/ilustrasi statis di sisi klien untuk panel edukasi perbandingan.

### C. State Error Server
- **Desain Figma**:
  - Banner status error menggunakan warna **fuchsia-800 (`#7A2E8A`)** dengan latar belakang **pink-50 (`#F7EEF8`)**, bukan merah (merah dikhususkan secara ketat untuk triase klinis MERAH).
  - Pesan jelas: "Tidak terhubung ke server PulmoTriage di komputer ini." (tombol "Coba lagi") dan "[nama_file] bukan gambar" (tombol "Pilih file lain").
- **Kondisi Backend**:
  - Mengembalikan status HTTP 400 (`{"detail": "File bukan gambar yang valid"}`) dan gagal fetch (*Network Error*) jika backend belum menyala.
  - Sangat selaras dengan kebutuhan penanganan error desain.

### D. Layar 3: Hasil Analisis, Peta Panas, dan Triase
- **Desain Figma**:
  - Tab pengalih citra: "Peta panas" vs "Asli".
  - Kartu kategori triase dengan badge ikon + teks:
    - **MERAH**: Rujuk segera.
    - **KUNING**: Perlu pemeriksaan lanjutan.
    - **HIJAU**: Tidak ditemukan tanda TBC.
    - **PERIKSA CITRA** (Kuning waspada): Untuk citra atipikal/kurang khas.
  - Tampilan skor numerik (misal `0,87` dengan koma Indonesia) dilengkapi label tingkat skor: **Tinggi** (≥ 0,91), **Sedang** (0,08 – 0,91), **Rendah** (< 0,08).
  - Daftar alasan klinis (*reasons*) dan kotak peringatan (*warnings*).
  - Kotak konfirmasi dokter: radio "Dokter setuju" / "Dokter tidak setuju", input teks "Catatan dokter (opsional)", tombol "Simpan tinjauan", dan tautan "Lihat draf surat rujukan (PDF)".
  - Teks wajib disclaimer permanen: *"Hasil AI adalah alat bantu triase, bukan diagnosis. Keputusan klinis tetap di tangan dokter."*
- **Kondisi Backend**:
  - Backend menyediakan seluruh field yang dibutuhkan: `prob_tb`, `triage.category`, `triage.title`, `triage.action`, `triage.ai_level`, `triage.reasons`, `warnings`, `disclaimer`, `heatmap_png`.
  - Foto asli: Backend hanya mengembalikan `heatmap_png` yang sudah dioverlay. Agar tab "Asli" dapat menampilkan rontgen tanpa heatmap, frontend akan memanfaatkan objek URL dari file asli yang diunggah (`URL.createObjectURL(file)`).

### E. Layar Riwayat Pemeriksaan
- **Desain Figma**:
  - Tabel pemeriksaan lokal dengan pencarian teks ("Cari nama atau nomor").
  - Filter tab: "Semua", "Belum ditinjau", "Menunggu sinkron".
  - Kolom tabel: No., Waktu, Pasien, Kategori (badge), Skor AI, Tinjauan dokter (Setuju / Belum), Sinkron (Tersinkron / Menunggu), Tombol Aksi "Buka".
- **Kondisi Backend**:
  - Endpoint `GET /pemeriksaan` mengembalikan data riwayat dengan field: `id`, `dibuat_pada`, `nama`, `umur`, `jenis_kelamin`, `gejala`, `prob_tb`, `ai_level`, `kategori`, `atipikal`, `keputusan_dokter`, `ditinjau_pada`, `tersinkron`.
  - **Kekurangan Backend**: Backend tidak menyediakan filter server-side (`?filter=...`) maupun search (`?q=...`).
  - **Solusi Frontend**: Filter tab dan pencarian nama/ID dilakukan di memori browser (client-side filtering) atas daftar 50 pemeriksaan terakhir.

### F. Bar Sinkronisasi & Dasbor Dinkes
- **Bar Sinkron**:
  - Tiga status: Menunggu sinkron (`X`), Semua data tersinkron (`0`), dan Menyinkronkan... (animasi loading).
  - Toast mengambang mengonfirmasi keberhasilan atau kegagalan koneksi.
- **Dasbor Dinas Kesehatan**:
  - Desain Figma memuat kartu total, kategori triase, grafik bar mingguan/harian, serta tabel Puskesmas dengan kolom "Sinkron Terakhir".
  - **Kekurangan Cloud API**: Endpoint `/dashboard/ringkasan` mengembalikan agregasi jumlah triase per Puskesmas, namun **belum** memiliki field `sinkron_terakhir` (timestamp) per Puskesmas. Kolom tersebut dapat diisi placeholder estimasi atau nilai waktu terkini.

---

## 4. Status Tailwind CSS & Rekomendasi Pendekatan Styling

- **Status Pemasangan Tailwind**:
  - Di `frontend/package.json` sudah terpasang:
    - `tailwindcss: ^4`
    - `@tailwindcss/turbopack: ^4`
  - Di `frontend/node_modules/` sudah terinstal: `tailwindcss@4.3.3`.
  - Di `frontend/app/globals.css` sudah terkonfigurasi: `@import "tailwindcss";`.
- **Rekomendasi Pendekatan CSS**:
  - Karena Tailwind v4 sudah terpasang secara resmi di dependensi proyek, kita dapat memanfaatkan kelas-kelas utilitas Tailwind (flexbox, grid, spacing, border, positioning) untuk menyusun ulang layout ekspor Figma yang awalnya bertipe koordinat absolut.
  - Untuk token desain khusus (warna non-triase dan status khusus), definisikan variabel CSS di `:root` dalam `globals.css`:
    ```css
    :root {
      --color-status-error: #7A2E8A;
      --color-status-error-bg: #F7EEF8;
      --color-status-info-bg: #E7F3F4;
      --color-status-neutral: #EEF2F2;
    }
    ```
  - **Aturan Ketat Warna**: Warna merah (`#b91c1c`), kuning (`#a16207`), dan hijau (`#15803d`) **HANYA** digunakan untuk badge/status triase pasien. Pesan error dan validasi wajib memakai token error fuchsia (`#7A2E8A`).

---

## 5. Kebutuhan Berkas Font Lokal

Sesuai aturan umum proyek:
> *"Font: next/font/local dari frontend/app/fonts/ (Fraunces untuk judul; Atkinson Hyperlegible Next untuk isi; Atkinson Hyperlegible Mono untuk angka), dengan fallback sistem. DILARANG next/font/google atau CDN. Jika file font tidak ada, berhenti dan beri tahu aku nama file yang dibutuhkan."*

- **Status Saat Ini**:
  - Folder `frontend/app/fonts/` **BELUM ADA**.
  - Tidak ditemukan berkas font `.woff`, `.woff2`, `.ttf`, maupun `.otf` untuk ketiga keluarga font tersebut di dalam seluruh direktori repositori maupun workspace.
- **Daftar Berkas Font yang Dibutuhkan**:
  1. **Fraunces** (Judul & Heading):
     - `Fraunces-VariableFont_opsz,wght.ttf` (atau `Fraunces-Bold.woff2` / `Fraunces-SemiBold.woff2`)
  2. **Atkinson Hyperlegible Next** (Teks Isi & Antarmuka Utama):
     - `AtkinsonHyperlegibleNext-Regular.woff2` (atau `.ttf`)
     - `AtkinsonHyperlegibleNext-Bold.woff2` (atau `.ttf`)
  3. **Atkinson Hyperlegible Mono** (Angka, Kode, Skor AI, Jam):
     - `AtkinsonHyperlegibleMono-Regular.woff2` (atau `.ttf`)
     - `AtkinsonHyperlegibleMono-Bold.woff2` (atau `.ttf`)

---

## 6. Kesimpulan & Langkah Selanjutnya

1. Seluruh spesifikasi endpoint backend dan cloud siap dihubungkan ke UI frontend.
2. Tidak ada perubahan yang dilakukan pada kode backend/cloud milik teman.
3. Penyesuaian arsitektur frontend berikutnya akan merestrukturisasi form monolitik menjadi wizard 3 langkah terpadu, melengkapi tab riwayat lokal dengan client-side filtering, dan menerapkan sistem token visual Figma.
4. Menunggu penyediaan berkas font lokal di `frontend/app/fonts/` sebelum implementasi tipografi final.
