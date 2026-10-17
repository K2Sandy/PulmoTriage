# Hasil Uji Tugas F3: Layar Hasil (Langkah 3 dari 3)

Tanggal: 17 Oktober 2026  
Branch: `frontend-desain`

## Ringkasan Pengujian

Pengujian dilakukan secara otomatis menggunakan skrip browser headless (Puppeteer / Microsoft Edge) terintegrasi dengan backend PulmoTriage lokal (`http://localhost:8000`).

| No | Skenario Uji | Status | Tangkapan Layar |
|---|---|---|---|
| 1 | **Citra Janggal (KUNING + Peringatan)**: Banner KUNING, ikon peringatan, teks "Periksa citra: pastikan rontgen dada", skor AI `(?)` dengan keterangan "Skor kurang bisa dipercaya untuk citra ini", keterangan citra "Peta panas kurang bisa dipercaya", kartu peringatan tampil. | **LULUS** | `docs/screenshots/f3_kategori_kuning_atipikal.png` |
| 2 | **Tinjauan Dokter (Setuju + Catatan) & Rujukan PDF**: Pilihan "Setuju", input catatan klinis dokter, tombol "Simpan tinjauan" aktif setelah ada pilihan. Setelah disimpan, kartu beralih ke "Tinjauan tersimpan", link PDF berubah menjadi tombol "Buka surat rujukan (PDF)". Pada PDF, teks `SURAT RUJUKAN (DRAFT)` berubah menjadi `SURAT RUJUKAN` (watermark DRAFT hilang) serta keputusan dan catatan dokter tercantum secara lengkap. | **LULUS** | `docs/screenshots/f3_tinjauan_setuju_tersimpan.png` |
| 3 | **Pemeriksaan Baru**: Tombol "Pemeriksaan baru" pada header langkah (stepper) mereset isian dan mengembalikan wizard ke Langkah 1. | **LULUS** | Terverifikasi dalam alur otomatis |
| 4 | **Tinjauan Dokter (Tidak Setuju)**: Pilihan "Tidak setuju", input catatan alternatif, simpan tinjauan berhasil dan menampilkan status "Dokter: Tidak setuju dengan hasil AI". | **LULUS** | `docs/screenshots/f3_tinjauan_tidak_setuju.png` |
| 5 | **Kategori MERAH (Rujuk Segera)**: Banner MERAH (ikon + teks), Anjuran rujuk segera ke TCM, kartu skor AI `0,87` (Tinggi) dengan bilah penuh, daftar alasan klinis lengkap. | **LULUS** | `docs/screenshots/f3_kategori_merah.png` |
| 6 | **Kategori HIJAU (Risiko TBC Rendah)**: Banner HIJAU (ikon + teks), Anjuran tanpa tindak lanjut khusus, kartu skor AI `0,12` (Rendah) dengan bilah proporsional, daftar alasan lengkap. | **LULUS** | `docs/screenshots/f3_kategori_hijau.png` |
| 7 | **Toggle Citra (Peta panas / Asli)**: Berhasil beralih antara tampilan citra heatmap Grad-CAM (`data:image/png;base64`) dan foto rontgen asli pasien. | **LULUS** | Terverifikasi dalam alur otomatis |

---

## Hasil Uji Tugas F4: Dasbor Dinas Kesehatan

Tanggal: 17 Oktober 2026  
Branch: `frontend-desain`

Pengujian dilakukan menggunakan Puppeteer (Microsoft Edge Headless) terintegrasi dengan layanan cloud lokal (`http://localhost:8001`) dan frontend (`http://localhost:3000/dashboard`).

| No | Skenario Uji | Status | Tangkapan Layar |
|---|---|---|---|
| 1 | **Dasbor dengan Data Simulasi (30 Hari)**: Banner "DATA SIMULASI" tampil (berlatar teal gelap dengan ikon peringatan), 4 kartu angka (Total 300, MERAH 21 [7,0%], KUNING 45 [15,0%], HIJAU 234 [78,0%]), grafik batang bertumpuk per hari berskala proporsional, sebaran kategori (progress bar MERAH, KUNING, HIJAU), tabel per Puskesmas terurut dari jumlah MERAH terbanyak (PKM-DEMO-3: 6 MERAH), catatan "Data anonim", dan "Data terakhir: 17 Okt 2026". | **LULUS** | `docs/screenshots/f4_dasbor_simulasi.png` |
| 2 | **Selektor Periode (7 Hari)**: Mengubah dropdown periode ke "7 hari terakhir", memanggil `?hari=7`, angka total dan kategori menghitung ulang secara real-time (Total 79, MERAH 5, KUNING 13, HIJAU 61), grafik batang bertumpuk menyesuaikan interval 7 hari. | **LULUS** | `docs/screenshots/f4_dasbor_periode_7hari.png` |
| 3 | **State Kosong (Hapus Simulasi)**: Memanggil `DELETE /demo` dengan header `x-api-key: dev-key`, saat `total === 0` dasbor menampilkan state kosong yang ramah ("Belum Ada Data Triase", "Tidak ada pemeriksaan tersinkron dalam rentang N hari terakhir") tanpa menampilkan angka palsu. | **LULUS** | `docs/screenshots/f4_dasbor_kosong.png` |
| 4 | **State Error (Cloud Offline)**: Saat koneksi cloud terputus/gagal, dasbor menampilkan banner error fuchsia-800 dengan latar pink-50 (`#F7EEF8` / `#7A2E8A`) dilengkapi tombol "Coba lagi" untuk memuat ulang data. | **LULUS** | `docs/screenshots/f4_dasbor_error.png` |
| 5 | **State Loading**: Menampilkan komponen skeleton loader pada 4 kartu, grafik, sebaran, dan tabel Puskesmas saat data sedang dimuat dari cloud. | **LULUS** | Terverifikasi dalam alur otomatis |

