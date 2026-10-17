PERAN
Kamu adalah engineer yang membangun bagian akhir aplikasi PulmoTriage. Kerjakan secara otomatis dan bertahap, lalu uji sendiri setiap langkah sebelum lanjut.

SUMBER KEBENARAN
Baca seluruh file docs/rencana.md sebelum menulis kode apa pun. File itu berisi kode lengkap yang sudah diuji, urutan langkah, dan batasannya. Salin dan terapkan kode dari dokumen itu. Jangan menulis ulang dari nol, dan jangan mengganti versi paket yang sudah dikunci.

RUANG LINGKUP
Kerjakan HANYA Langkah 4, 5, 6, dan 7 dari dokumen itu, dengan urutan:
  Langkah 4: Draf surat rujukan PDF (backend/pdf.py, potongan A-C di backend/main.py, potongan D-G di frontend/app/page.js)
  Langkah 5: Dasbor Dinkes (folder cloud/ dan frontend/app/dashboard/page.js)
  Langkah 6: Sinkronisasi ke cloud (backend/db.py, backend/sinkron.py, main.py, potongan H-K di page.js)
  Langkah 7: Deploy (Dockerfile, CORS, perintah gcloud dan Vercel)
Langkah 1-3 sudah selesai oleh anggota tim lain. Jangan ubah perilakunya. Hanya tambahkan potongan yang diminta dokumen.

ATURAN KERJA
1. Sebelum mulai, periksa bahwa Langkah 1-3 benar-benar ada dan jalan: backend berjalan di port 8000, frontend di port 3000, dan db.py serta endpoint tinjau dokter sudah ada. Kalau ada yang kurang, berhenti dan laporkan, jangan mengarang.
2. Kerjakan satu langkah sampai selesai dan lulus uji sebelum pindah ke langkah berikutnya. Buat satu commit git per langkah dengan pesan jelas (misalnya "langkah 4: draf rujukan PDF").
3. Setiap file yang diedit harus dibaca dulu. Terapkan potongan kode di posisi yang ditunjuk dokumen ("tambahkan di bawah baris X", "ganti blok Y"). Jangan menimpa seluruh file kecuali dokumen memintanya.
4. Gunakan lingkungan Python terpisah (.venv) di backend/ dan cloud/. Pasang paket dengan pip install -r requirements.txt.
5. Jangan pernah meng-commit: *.db, .venv/, node_modules/, .next/, .env*. Pastikan .gitignore sudah memuatnya.

PENGUJIAN (wajib per langkah, gunakan terminal dan browser)
- Langkah 4: jalankan analisis, buka PDF sebelum klik Dokter setuju (harus ada tulisan merah DRAFT), klik Dokter setuju lalu buka ulang (DRAFT hilang). Uji nama pasien dengan karakter "&".
- Langkah 5: jalankan cloud di port 8001, panggil POST /demo/seed dengan x-api-key dev-key, buka http://localhost:3000/dashboard. Harus tampil kotak kuning SIMULASI, 4 kartu angka, grafik per hari, tabel 5 Puskesmas. Ganti periode ke 7 hari dan pastikan angka berubah.
- Langkah 6: (a) matikan cloud, lakukan analisis, angka "Menunggu sinkron" harus naik, tombol Sinkronkan sekarang harus menampilkan "Belum ada koneksi" dan angka tetap; (b) nyalakan cloud, klik tombol yang sama, harus "Terkirim" dan angka jadi 0; (c) kirim sinkron dua kali dan pastikan tidak ada data ganda; (d) pakai SYNC_API_KEY yang salah dan pastikan hasilnya 401 dengan data lokal tetap aman; (e) PUSKESMAS_ID muncul di tabel dasbor.
- Setelah Langkah 6, jalankan daftar uji tiga skenario di bagian 11 dokumen, dan simpan hasilnya (lulus atau gagal, plus tangkapan layar dari browser) di docs/hasil-uji.md dan docs/screenshots/.
Kalau sebuah uji gagal, perbaiki dan ulangi. Jangan lanjut dengan uji yang masih gagal.

LANGKAH 7 (DEPLOY): BATAS OTOMASI
Siapkan semua yang bisa disiapkan: ubah CORS agar membaca CORS_ORIGINS, buat backend/Dockerfile, cloud/Dockerfile, .dockerignore, dan .gcloudignore, lalu tulis perintah gcloud dan langkah Vercel yang sudah terisi dalam sebuah file docs/deploy.md (dengan placeholder yang jelas untuk nilai rahasia). JANGAN menjalankan gcloud, vercel, atau perintah deploy apa pun yang membutuhkan login, billing, atau kunci rahasia. Hentikan pekerjaan di titik itu dan beri aku daftar langkah manual yang harus kulakukan, beserta nilai yang harus kuisi.

BATAS KEAMANAN DAN KEJUJURAN (JANGAN DILANGGAR)
- Jangan pernah menaruh kunci asli, password, atau DATABASE_URL di file yang di-commit. Pakai variabel lingkungan.
- Dasbor tanpa data nyata harus tetap berlabel SIMULASI. Jangan hapus label itu.
- Jangan menambah fitur di luar dokumen. Jangan menghapus peringatan bahwa hasil AI wajib ditinjau dokter dan bahwa ini alat bantu, bukan diagnosis.
- Jangan mengubah model ONNX atau pulmotriage_infer.py.
- Jika dokumen dan kodenya bertentangan, atau kamu tidak yakin, berhenti dan tanya aku, jangan menebak.

LAPORAN AKHIR
Setelah selesai, beri ringkasan: apa yang selesai per langkah, hasil uji (lulus atau gagal), file yang berubah, masalah yang tersisa, dan daftar tindakan manual untuk deploy.