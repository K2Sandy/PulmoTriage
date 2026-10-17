# Panduan demo dan naskah video

Alur ini menunjukkan PulmoTriage dari awal sampai akhir: dari aktivasi lisensi di Puskesmas sampai data muncul di peta portal publik. Durasi video yang disarankan adalah 3–4 menit.

Gunakan **data pasien fiktif** saja. Rontgen untuk demo diambil dari data uji publik.

---

## 1. Persiapan (sebelum merekam)

| | Langkah |
|---|---|
| ☐ | Laptop memakai lisensi uji, misalnya `lisensi-1171-001.json`, hasil `scripts/lisensi/terbitkan_lisensi.py` |
| ☐ | Mulai dari keadaan kosong: tutup aplikasi, lalu hapus `lisensi.json`, `aktivasi.json`, dan `pulmotriage.db` di folder data (shortcut *Folder data PulmoTriage*) |
| ☐ | Lepas aktivasi lama di cloud agar lisensi bisa diaktifkan lagi saat rekaman: `DELETE /lisensi/aktivasi/1171-001` dengan header `X-API-Key` (lewat `/docs`) |
| ☐ | Siapkan 3 file di desktop: satu rontgen TBC, satu rontgen normal, dan satu file lisensi palsu (salinan lisensi asli yang tanggalnya diubah dengan Notepad) |
| ☐ | Buka portal publik (Vercel) di tab lain dan biarkan memuat. Layanan cloud gratis perlu sekitar 1 menit untuk bangun |
| ☐ | Opsional: isi data simulasi di cloud (`/docs` → `POST /demo/seed`) supaya peta dan grafik portal tidak kosong |
| ☐ | Tutup notifikasi dan perbesar jendela browser |

---

## 2. Naskah per adegan

| # | Layar | Yang dilakukan | Narasi (contoh) |
|---|---|---|---|
| 0 | Portal publik | Tunjukkan portal, klik **Unduh untuk Windows** | "Puskesmas atau klinik mengunduh PulmoTriage dari portal kami." |
| 1 | Desktop | Klik ikon *PulmoTriage* | "Setelah dipasang, aplikasi dibuka dari desktop seperti program biasa." |
| 3 | Halaman Aktivasi | Aplikasi langsung membuka halaman aktivasi | "Pertama kali dipakai, Puskesmas memasang file lisensi dari tim kami." |
| 4 | Aktivasi | Seret lisensi palsu, lalu muncul pesan ditolak | "Lisensi ditandatangani digital. File yang diubah, misalnya tanggalnya diperpanjang sendiri, langsung ditolak." |
| 5 | Aktivasi | Seret lisensi asli, muncul "Lisensi aktif" beserta nama Puskesmas dan masa berlaku | "Lisensi asli diaktifkan sekali secara online dan terikat ke komputer ini. File yang sama ditolak di komputer lain." |
| 5b | Wi-Fi | Matikan Wi-Fi sambil terlihat di layar | "Setelah aktif, kami matikan internet: semua pemeriksaan berjalan luring." |
| 6 | Data pasien | Klik "Mulai pemeriksaan", isi nama fiktif, umur, jenis kelamin, centang gejala | "Petugas mengisi data dasar dan gejala. Nama hanya tersimpan di komputer ini." |
| 7 | Unggah citra | Unggah rontgen TBC → "Mulai analisis" | "Petugas mengunggah rontgen dada. Gerbang kualitas memeriksa dulu apakah citranya layak." |
| 8 | Hasil | Tunjukkan MERAH, skor, alasan, lalu geser Peta panas dan Asli | "Hasil keluar dalam beberapa detik, di laptop biasa tanpa GPU. Peta panas menunjukkan area yang membuat AI curiga; ini petunjuk, bukan batas lesi." |
| 9 | Tinjauan dokter | Klik Setuju, isi catatan, lalu Simpan tinjauan | "Keputusan akhir tetap di dokter." |
| 10 | Surat rujukan | Klik "Buka surat rujukan" | "Draf surat rujukan terisi otomatis, lengkap dengan kop Puskesmas, kategori, dan peta panas." |
| 11 | Riwayat | Buka tab Riwayat, tunjukkan status "Menunggu" sinkron | "Semua pemeriksaan tersimpan di komputer ini. Datanya menunggu internet untuk dikirim." |
| 12 | Wi-Fi | Nyalakan Wi-Fi → klik "Sinkronkan sekarang" | "Begitu ada sinyal, hanya data tanpa nama yang dikirim, bersama bukti lisensi Puskesmas." |
| 13 | Portal: peta | Pindah ke tab portal, muat ulang, arahkan kursor ke peta, lalu klik Aceh | "Siapa pun bisa melihat persebaran hasil triase per provinsi. Warna makin gelap berarti makin banyak hasil MERAH. Klik provinsi untuk memperbesar." |
| 13b | Portal: tabel | Gulir ke tabel per provinsi | "Yang tampil hanya angka gabungan per provinsi, tanpa nama atau data per Puskesmas." |
| 14 | Penutup | Kembali ke aplikasi | "PulmoTriage: triase TBC di Puskesmas dan klinik, luring, dengan tinjauan dokter, dan data persebaran yang terbuka untuk publik." |

> [!NOTE]
> Di adegan 12, kalau toast menampilkan "Belum ada koneksi", tunggu sekitar 1 menit (server cloud gratis sedang bangun), lalu klik lagi. Kalau mau aman, buka portal sebelum merekam supaya server sudah bangun.

---

## 3. Kalimat yang harus jujur

- Hasil AI adalah alat bantu triase, **bukan diagnosis**.
- Angka uji (103/103 TBC terdeteksi, 518/525 normal tidak ditandai) adalah **uji internal** pada dataset publik, bukan uji lapangan di Indonesia.
- Peta portal bisa berisi data simulasi (ada penanda DATA SIMULASI).
- Installer belum ditandatangani sertifikat, jadi Windows menampilkan peringatan SmartScreen.
- Peta memakai 33 provinsi Natural Earth; provinsi hasil pemekaran digambar di provinsi induknya.

---

## 4. Mengulang dari awal

```text
1. Tutup jendela hitam "PulmoTriage - jangan tutup jendela ini"
2. Buka Folder data PulmoTriage, hapus lisensi.json, aktivasi.json, dan pulmotriage.db
3. Di /docs layanan cloud: DELETE /lisensi/aktivasi/1171-001 (header x-api-key)
4. Buka lagi PulmoTriage dari desktop
```

Untuk menghapus data uji di portal, buka `/docs` di layanan cloud, lalu jalankan `DELETE /demo` dengan header `x-api-key`. Perintah ini hanya menghapus data simulasi.
