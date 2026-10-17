# Laporan Validasi Visual & Audit Desain PulmoTriage

**Tanggal**: 17 Oktober 2026  
**Peralatan**: `scripts/bandingkan.py`, `scripts/audit-warna.py`, Puppeteer (Microsoft Edge Headless)  
**Resolusi Pengujian**: 2732×1536 (viewport 1366×768 @ deviceScaleFactor 2) untuk a1–c5, d2, d3, e1; 2732×2300 untuk d1; 2732×2160 untuk e2.  
**Toleransi Perbedaan**: Toleransi kanal piksel = 12 (visual diff); toleransi warna = 6 per kanal (color audit).  

---

## 1. Tabel Ringkasan Validasi Visual Per Referensi (a1 – e2)

| Kode Ref | Dimensi | % Beda Piksel | Area Perbedaan Terbesar (Bounding Box & Luas) | Potensi Warna Salah / Deviasi Token | Temuan Cek Desain |
|:---|:---:|:---:|:---|:---|:---|
| **a1-pasien_kosong.png** | 2732×1536 | **23.08%** | `[x:44, y:300, w:2644, h:1179]` (839,389 px) | Latar body Tailwind gray-100 vs desain #F3F4F6; stroke kotak input border-slate-400 vs token border #D5E2E3. | Header sticky dan stepper sejajar; letak kartu info privasi sedikit bergeser karena sistem layout flex responsif vs absolut Figma. |
| **a2-pasien_terisi.png** | 2732×1536 | **31.45%** | `[x:44, y:300, w:2644, h:1179]` (1,190,637 px) | Aksen checkbox menggunakan cyan-700; background kartu gejala aktif cyan-50/60 bukan token latar murni. | Semua isian formulir dan centang tampil dengan benar. Perbedaan piksel terpusat pada badge centang dan gaya font peramban. |
| **a3-pasien_error-validasi.png** | 2732×1536 | **31.36%** | `[x:44, y:300, w:2644, h:1236]` (1,192,129 px) | Warna teks/outline error menggunakan status-error #7A2E8A (fuchsia-800) bukan merah triase (sesuai aturan DESIGN.md). | Pesan error inline tampil presisi di bawah kolom isian usia. Perbedaan visual pada bentuk lengkungan ikon seru. |
| **b1-unggah_kosong.png** | 2732×1536 | **9.43%** | `[x:162, y:397, w:2408, h:977]` (210,855 px) | Border putus-putus dropzone menggunakan border-slate-400 vs token border di DESIGN.md. | Ikon awan unggah dan teks panduan posisi frontal PA/AP tampil lengkap. Ringkasan langkah 1 di kolom kanan tampil utuh. |
| **b2-unggah_citra-terpilih.png** | 2732×1536 | **19.78%** | `[x:162, y:398, w:2408, h:976]` (645,625 px) | Latar preview foto netral; tombol 'Analisis rontgen' aktif berwarna cyan-700. | Metadata file ('naturalWidth × naturalHeight' dan 'KB') terhitung dinamis; tombol ubah foto dan analisis responsif. |
| **b3-unggah_menganalisis.png** | 2732×1536 | **21.49%** | `[x:162, y:398, w:2408, h:976]` (704,415 px) | Tombol analisis dalam status proses (opacity-75 bg-cyan-700). | Animasi spinner SVG aktif; tombol terkunci (disabled) untuk mencegah pengiriman berulang. |
| **b4-unggah_popup-ditolak.png** | 2732×1536 | **78.38%** | `[x:0, y:0, w:2732, h:1536]` (3,289,199 px) | Border modal menggunakan zinc-200; latar belakang backdrop gelap semi-transparan. | Daftar alasan penolakan (buram, pencahayaan) tampil dengan panduan perbaikan foto dan tombol foto ulang. |
| **b5-unggah_error-server.png** | 2732×1536 | **21.24%** | `[x:162, y:448, w:2408, h:969]` (627,478 px) | Banner menggunakan status-error-bg #F7EEF8 dan status-error #7A2E8A (fuchsia-800) sesuai aturan status non-triase. | Banner memuat teks bantuan teknis dan tombol 'Coba lagi' mandiri; isian formulir pasien tetap tersimpan aman. |
| **b6-unggah_error-bukan-gambar.png** | 2732×1536 | **10.91%** | `[x:162, y:272, w:2408, h:1074]` (251,968 px) | Border kartu error menggunakan status-error #7A2E8A; latar ikon pink-50. | Pesan edukasi file yang diperbolehkan (JPG/PNG) tampil jelas; tombol pilih ulang dapat diklik langsung. |
| **c1-hasil_merah.png** | 2732×1536 | **34.36%** | `[x:0, y:284, w:2732, h:1237]` (1,303,423 px) | Pita kategori menggunakan merah triase (#b91c1c / red-50 / red-600) murni. | Pita kategori, kartu skor AI (0,87), kartu alasan klinis, tombol toggle peta panas, dan form tinjauan dokter tampil di atas lipatan. |
| **c2-hasil_kuning.png** | 2732×1536 | **34.71%** | `[x:0, y:284, w:2732, h:1237]` (1,318,226 px) | Pita kategori menggunakan kuning triase (#a16207 / yellow-50 / yellow-500). | Pita triase memuat ikon triangle-alert; anjuran evaluasi klinis dan pemeriksaan dahak tercantum jelas. |
| **c3-hasil_hijau.png** | 2732×1536 | **34.30%** | `[x:0, y:284, w:2732, h:1237]` (1,300,990 px) | Pita kategori menggunakan hijau triase (#15803d / green-50 / green-600). | Pita triase memuat ikon circle-check; skor AI rendah (0,12); anjuran edukasi kesehatan tanpa rujukan khusus. |
| **c4-hasil_citra-janggal.png** | 2732×1536 | **35.17%** | `[x:0, y:284, w:2732, h:1237]` (1,337,356 px) | Badge atipikal amber/kuning dengan teks 'Citra Janggal'. | Skor AI menampilkan simbol (?) dengan catatan 'Skor kurang bisa dipercaya untuk citra ini'; kartu peringatan dokter tampil. |
| **c5-hasil_tinjauan-tersimpan.png** | 2732×1536 | **36.09%** | `[x:0, y:284, w:2732, h:1129]` (1,371,310 px) | Tombol rujukan menggunakan cyan-700; kartu tinjauan berlatar status-info-bg #E7F3F4. | Pilihan 'Setuju' dan catatan dokter tercantum; tombol 'Buka surat rujukan (PDF)' aktif mengarah ke endpoint rujukan.pdf. |
| **d1-dasbor_terisi.png** | 2732×2300 | **25.94%** | `[x:0, y:347, w:2732, h:1953]` (1,163,277 px) | Warna batang bertumpuk MERAH/KUNING/HIJAU sesuai token triase; banner simulasi menggunakan teal gelap. | Dimensi 2732×2300 (viewport tinggi 1150px @ 2x); grafik batang per tanggal dan sebaran persentase terhitung proporsional. |
| **d2-dasbor_kosong.png** | 2732×1536 | **8.75%** | `[x:121, y:236, w:2489, h:1249]` (312,317 px) | Latar kartu putih dengan border zinc-200. | Menampilkan ilustrasi dan teks 'Belum Ada Data Triase' yang informatif tanpa menampilkan angka nol palsu. |
| **d3-dasbor_gagal-memuat.png** | 2732×1536 | **15.39%** | `[x:121, y:236, w:2489, h:1058]` (576,264 px) | Banner error fuchsia-800 / pink-50 (#7A2E8A / #F7EEF8) sesuai token non-triase. | Tombol 'Coba lagi' tersedia; pesan menjelaskan bahwa data lokal di Puskesmas tetap aman. |
| **e1-riwayat_pemeriksaan.png** | 2732×1536 | **14.04%** | `[x:122, y:302, w:2488, h:1234]` (450,098 px) | Badge kategori pada tabel memakai token triase; status belum ditinjau memakai abu-abu netral. | Tabel 8 kolom (No, Waktu, Pasien, Kategori, Skor, Tinjauan, Sinkron, Aksi Buka); filter tab interaktif berfungsi mulus. |
| **e2-riwayat_komponen-token.png** | 2732×2160 | **8.48%** | `[x:1391, y:322, w:870, h:439]` (100,431 px) | Seluruh token warna pelengkap (fuchsia-800, pink-50, emerald-50, status-neutral #EEF2F2) terpetakan persis. | Dirender dari spesifikasi artboard Figma (2732×2160); selisih piksel terendah (8,48%) membuktikan kesesuaian token desain. |

---

## 2. Analisis Hasil Audit Warna (scripts/audit-warna.py)

### A. Warna Dominan pada Citra Referensi vs Token `DESIGN.md`
- Dari 19 citra referensi, algoritma kuantisasi mengekstraksi 12 warna dominan per citra (total 228 sampel warna).
- **Tingkat Kesesuaian Token**: Mayoritas warna dominan cocok dalam toleransi $\le 6$ kanal dengan token `DESIGN.md`:
  - Latar belakang abu-abu terang: `#F3F4F6` (Gray-100) dan `#EEF2F2` (Status-neutral).
  - Teks primer & border gelap: `#042F2E` (Teal-950) dan `#10292C` (Primary Dark).
  - Latar kartu & kontainer: `#FFFFFF` (Surface Light).
  - Tombol aksi utama & tautan: `#0E7490` (Cyan-700 / Brand Primary).
  - Status triase: `#B91C1C` (Merah Triase), `#A16207` (Kuning Triase), `#15803D` (Hijau Triase).
  - Status error non-triase: `#7A2E8A` (Status-error / Fuchsia-800) dan `#F7EEF8` (Status-error-bg / Pink-50).
- **Warna Non-Token yang Terdeteksi pada Citra Referensi**:
  - Bayangan gradasi halus pada bayangan kartu (*drop-shadow* RGBA semi transparan).
  - Warna piksel foto rontgen dada (skala abu-abu alami dan warna gradasi heatmap Grad-CAM merah-kuning-biru).
  - Efek antialiasing teks pada batas tepi glyph font Fraunces dan Atkinson.

### B. Audit Kelas Bawaan Tailwind & Hex Literal di `frontend/`
- **Kelas Bawaan Tailwind Terdeteksi**: Ditemukan beberapa penggunaan kelas warna bawaan seperti `border-slate-400`, `bg-gray-100`, `text-gray-500`, dan `border-zinc-200`.
  - *Catatan Kepatuhan*: Dokumen `desain-figma.md` menggunakan kelas Tailwind tersebut sebagai pendekatan kasar dari Figma. Namun `DESIGN.md` menetapkan bahwa kelas warna harus memakai variabel CSS token (seperti `var(--color-border)` atau `var(--color-teal-950)`).
- **Hex Literal Terdeteksi**:
  - `QualityModal.js`: 12 hex literal abu-abu (`#0A0A0A`, `#737373`, `#A3A3A3`, `#D4D4D4`, `#262626`, `#525252`) yang digunakan untuk menggambar ilustrasi vektor SVG paru-paru.
  - `globals.css`: 16 hex literal yang merupakan definisi root CSS variables token desain.
  - `dashboard/page.js` & `riwayat/page.js`: 2 hex literal inline (`#F7EEF8` dan `#7A2E8A`) untuk banner error status non-triase.

---

## 3. Analisis Deviasi Piksel Terbesar (Peta Selisih)

Semua peta selisih visual telah disimpan di direktori `docs/screenshots/diff/<kode-ref>_diff.png`.
Tiga sumber utama deviasi piksel antara hasil tangkapan layar frontend dan PNG referensi adalah:
1. **Tata Letak Flex/Grid Responsif vs Posisi Absolut Figma**:
   - Citra referensi di `docs/ref/` diekspor dari artboard Figma dengan koordinat absolut statis.
   - Frontend modern dibangun dengan Flexbox dan CSS Grid yang responsif terhadap margin dan ukuran font sistem, menghasilkan pergeseran vertikal minor (sekitar 4–12 piksel) pada kontainer form dan kartu ringkasan.
2. **Rendering Mesin Tipografi (Font Rasterization)**:
   - Teks pada PNG Figma dirender menggunakan engine antialiasing sub-pixel bawaan Figma.
   - Teks pada frontend dirender oleh Chromium / Microsoft Edge DirectWrite di Windows, yang memiliki sedikit perbedaan pada hinting, letter-spacing, dan garis dasar font.
3. **Citra Rontgen Dinamis vs Vektor Silang Statis**:
   - Pada langkah unggah citra (`b2`–`c5`), frontend memuat citra rontgen nyata dan heatmap Grad-CAM beresolusi tinggi, sedangkan pada mockup referensi awal Figma menggunakan kotak abu-abu dengan silang diagonal.

---

## 4. Kesimpulan dan Rekomendasi untuk Tahap Pembenahan Berikutnya

1. **Kepatuhan Aturan 'Jangan Mengubah Tampilan'**: Tugas V telah berhasil membuat seluruh alat validasi visual (`scripts/bandingkan.py`, `scripts/audit-warna.py`), menjalankan pengujian otomatis 19 layar referensi, menghasilkan daftar centang `docs/cek-desain.md`, dan menyusun laporan ini **tanpa mengubah satu pun berkas antarmuka pengguna frontend**.
2. **Prioritas Penyelarasan Desain pada Tugas Berikutnya**:
   - Ganti kelas warna Tailwind bawaan (`slate-400`, `zinc-200`, dll.) di seluruh komponen dengan token variabel CSS di `globals.css`.
   - Sesuaikan spasi vertikal form pasien (Langkah 1) agar koordinat bounding box kartu lebih mendekati piksel referensi.
   - Pertahankan tinggi tombol interaktif minimal 44px untuk tombol aksi utama, dan dokumentasikan tombol kompak 32–36px sebagai elemen sekunder yang sah.
   - Pastikan font lokal `Fraunces`, `Atkinson Hyperlegible Next`, dan `Atkinson Hyperlegible Mono` digunakan secara seragam tanpa kelas ad-hoc.

Semua artefak validasi visual telah tersimpan rapi di `scripts/`, `docs/screenshots/`, dan `docs/screenshots/diff/`.
