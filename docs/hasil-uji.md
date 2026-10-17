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
