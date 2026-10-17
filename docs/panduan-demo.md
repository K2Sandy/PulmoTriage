# Panduan demo dan naskah video

Alur ini menunjukkan PulmoTriage dari awal sampai akhir: dari aktivasi lisensi di Puskesmas sampai data muncul di dasbor Dinas Kesehatan. Durasi video yang disarankan adalah 3–4 menit.

Gunakan **data pasien fiktif** saja. Rontgen untuk demo diambil dari data uji publik.

---

## 1. Persiapan (sebelum merekam)

| | Langkah |
|---|---|
| ☐ | Laptop memakai lisensi uji, misalnya `lisensi-1171-001.json`, hasil `scripts/lisensi/terbitkan_lisensi.py` |
| ☐ | Mulai dari keadaan kosong: hapus `backend/lisensi.json` dan `backend/pulmotriage.db` (riwayat ikut kosong) |
| ☐ | Siapkan 3 file di desktop: satu rontgen TBC, satu rontgen normal, dan satu file lisensi palsu (salinan lisensi asli yang tanggalnya diubah dengan Notepad) |
| ☐ | Buka dasbor Dinkes di tab lain dan biarkan memuat. Layanan cloud gratis perlu sekitar 1 menit untuk bangun |
| ☐ | Opsional: isi data simulasi di cloud (`/docs` → `POST /demo/seed`) supaya grafik dasbor tidak kosong |
| ☐ | Tutup notifikasi, perbesar jendela browser, dan pakai tema terang |

---

## 2. Naskah per adegan

| # | Layar | Yang dilakukan | Narasi (contoh) |
|---|---|---|---|
| 1 | Desktop | Klik dua kali `jalankan-pulmotriage.bat` | "PulmoTriage dipasang di komputer Puskesmas. Satu klik, dan aplikasi terbuka tanpa internet." |
| 2 | Wi-Fi | Matikan Wi-Fi sambil terlihat di layar | "Kami matikan internet untuk menunjukkan semuanya berjalan luring." |
| 3 | Halaman Aktivasi | Aplikasi langsung membuka halaman aktivasi | "Pertama kali dipakai, Puskesmas memasang file lisensi dari tim kami." |
| 4 | Aktivasi | Seret lisensi palsu, lalu muncul pesan ditolak | "Lisensi ditandatangani digital. File yang diubah, misalnya tanggalnya diperpanjang sendiri, langsung ditolak, dan pemeriksaannya tetap tanpa internet." |
| 5 | Aktivasi | Seret lisensi asli, muncul "Lisensi aktif" beserta nama Puskesmas dan masa berlaku | "Lisensi asli diterima. Nama Puskesmas otomatis dipakai di aplikasi dan surat rujukan." |
| 6 | Data pasien | Klik "Mulai pemeriksaan", isi nama fiktif, umur, jenis kelamin, centang gejala | "Petugas mengisi data dasar dan gejala. Nama hanya tersimpan di komputer ini." |
| 7 | Unggah citra | Unggah rontgen TBC → "Mulai analisis" | "Petugas mengunggah rontgen dada. Gerbang kualitas memeriksa dulu apakah citranya layak." |
| 8 | Hasil | Tunjukkan MERAH, skor, alasan, lalu geser Peta panas dan Asli | "Hasil keluar dalam beberapa detik, di laptop biasa tanpa GPU. Peta panas menunjukkan area yang membuat AI curiga; ini petunjuk, bukan batas lesi." |
| 9 | Tinjauan dokter | Klik Setuju, isi catatan, lalu Simpan tinjauan | "Keputusan akhir tetap di dokter." |
| 10 | Surat rujukan | Klik "Buka surat rujukan" | "Draf surat rujukan terisi otomatis, lengkap dengan kop Puskesmas, kategori, dan peta panas." |
| 11 | Riwayat | Buka tab Riwayat, tunjukkan status "Menunggu" sinkron | "Semua pemeriksaan tersimpan di komputer ini. Datanya menunggu internet untuk dikirim." |
| 12 | Wi-Fi | Nyalakan Wi-Fi → klik "Sinkronkan sekarang" | "Begitu ada sinyal, hanya data tanpa nama yang dikirim, bersama bukti lisensi Puskesmas." |
| 13 | Dasbor Dinkes: peta | Pindah ke tab dasbor, muat ulang, arahkan kursor ke peta, lalu klik Sumatera | "Di sisi Dinas Kesehatan, persebaran hasil MERAH terlihat per pulau. Klik pulau untuk memperbesar dan melihat rincian provinsi, kabupaten/kota, dan Puskesmas." |
| 13b | Dasbor Dinkes: tabel | Gulir ke tabel, tunjukkan baris 1171-001 Puskesmas Lamteumen | "Setiap Puskesmas punya kode unik dari lisensinya, jadi data tidak tertukar." |
| 14 | Penutup | Kembali ke aplikasi | "PulmoTriage: triase TBC di Puskesmas, luring, dengan tinjauan dokter dan pemantauan Dinkes." |

> [!NOTE]
> Di adegan 12, kalau toast menampilkan "Belum ada koneksi", tunggu sekitar 1 menit (server cloud gratis sedang bangun), lalu klik lagi. Kalau mau aman, buka dasbor sebelum merekam supaya server sudah bangun.

---

## 3. Kalimat yang harus jujur

- Hasil AI adalah alat bantu triase, **bukan diagnosis**.
- Angka uji (103/103 TBC terdeteksi, 518/525 normal tidak ditandai) adalah **uji internal** pada dataset publik, bukan uji lapangan di Indonesia.
- Dasbor versi lomba **belum memakai login** dan grafiknya bisa berisi data simulasi (ada penanda DATA SIMULASI).
- Aplikasi Puskesmas belum punya installer. Untuk pilot, kami memakai skrip satu klik.

---

## 4. Mengulang dari awal

```text
1. Tutup jendela jalankan-pulmotriage.bat
2. Hapus backend\lisensi.json dan backend\pulmotriage.db
3. Jalankan lagi jalankan-pulmotriage.bat
```

Untuk menghapus data uji di dasbor, buka `/docs` di layanan cloud, lalu jalankan `DELETE /demo` dengan header `x-api-key`. Perintah ini hanya menghapus data simulasi.
