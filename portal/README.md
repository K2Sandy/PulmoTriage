# PulmoTriage · Portal publik

Situs untuk mengenal PulmoTriage, terbuka untuk siapa saja: Puskesmas, klinik dan rumah sakit swasta, masyarakat,
dan peneliti. Isinya:

- Penjelasan singkat PulmoTriage dan cara kerjanya
- Tombol **Unduh untuk Windows** yang mengarah ke installer terbaru (tautan dan nomor versi diambil dari `GET /versi` di layanan cloud)
- Peta gradasi persebaran hasil triase **per provinsi** (klik untuk memperbesar), grafik harian, dan tabel per provinsi

Portal hanya menampilkan angka gabungan per provinsi dari `GET /publik/ringkasan`. Tidak ada nama, umur, foto, atau
data per Puskesmas. Provinsi dengan pemeriksaan di bawah `BATAS_PUBLIK` (bawaan 10) tidak dirinci per kategori.

```
Aplikasi Puskesmas (luring) ──sinkron berlisensi──► cloud/ (Render + Neon) ◄──baca── portal ini (Vercel)
```

## Menjalankan di laptop

```
cd portal
npm install
npm run dev          # http://localhost:3001
```

Buat `portal/.env.local`:

```
NEXT_PUBLIC_CLOUD_URL=https://pulmotriage-cloud.onrender.com
# opsional: tautan permintaan lisensi
# NEXT_PUBLIC_KONTAK=mailto:tim@contoh.id
```

## Deploy ke Vercel

1. Project → Settings → General → Root Directory: `portal`
2. Environment Variables: `NEXT_PUBLIC_CLOUD_URL` = alamat layanan cloud (opsional `NEXT_PUBLIC_KONTAK`)
3. Deploy, lalu pastikan alamat Vercel ada di `CORS_ORIGINS` layanan cloud (Render)

Batas provinsi: Natural Earth (domain publik), 33 provinsi. Provinsi hasil pemekaran digambar di wilayah provinsi
induknya (lihat `cloud/wilayah.py`).
