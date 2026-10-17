# PulmoTriage · Dasbor Dinas Kesehatan

Aplikasi web terpisah untuk Dinas Kesehatan. Menampilkan ringkasan triase (MERAH, KUNING, HIJAU)
yang dikirim Puskesmas berlisensi ke server cloud (`cloud/`, database PostgreSQL di Neon).
Dasbor tidak pernah terhubung langsung ke komputer Puskesmas dan tidak menerima nama atau foto pasien.

```
Aplikasi Puskesmas (offline) ──sinkron berlisensi──► cloud/ (Render + Neon) ◄──baca── dasbor ini (Vercel)
```

## Menjalankan di laptop

```
cd dinkes
npm install
npm run dev          # http://localhost:3001
```

Buat `dinkes/.env.local`:

```
NEXT_PUBLIC_CLOUD_URL=https://pulmotriage-cloud.onrender.com
```

## Deploy ke Vercel

1. Add New → Project → pilih repo → Root Directory: `dinkes`
2. Environment Variables: `NEXT_PUBLIC_CLOUD_URL` = alamat server cloud
3. Deploy, lalu tambahkan alamat Vercel ke `CORS_ORIGINS` di layanan cloud (Render)
