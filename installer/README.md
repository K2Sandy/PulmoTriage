# Installer Windows PulmoTriage

`PulmoTriage-Setup-<versi>.exe` memasang aplikasi Puskesmas dalam satu langkah. Python, paket, model, dan tampilan sudah ada di dalamnya, jadi komputer Puskesmas **tidak perlu memasang apa pun**. Internet hanya dibutuhkan sekali, saat mengaktifkan lisensi.

| | |
|---|---|
| Lokasi program | `%LOCALAPPDATA%\Programs\PulmoTriage` (tanpa hak admin) |
| Lokasi data | `%LOCALAPPDATA%\PulmoTriage\data` (`pulmotriage.db`, `lisensi.json`, `aktivasi.json`) |
| Shortcut | Desktop dan Start Menu: *PulmoTriage*, *Folder data PulmoTriage*, *Hapus PulmoTriage* |
| Alamat aplikasi | http://localhost:8000 (hanya dari komputer itu) |
| Sinkron | Otomatis tiap 60 detik ke `https://pulmotriage-cloud.onrender.com` saat ada internet |
| Pembaruan | Saat online, aplikasi memberi tahu bila ada versi baru (dicek ke `GET /versi` di cloud) |

Menghapus aplikasi **tidak** menghapus data pemeriksaan dan lisensi. Memasang versi baru di atas versi lama juga aman: data dan aktivasi lisensi tetap.

## Membangun ulang installer

Jalan di Linux atau WSL (Ubuntu):

```bash
sudo apt install nsis unzip curl python3.11 python3-pip
bash installer/build_installer.sh     # versi diambil dari backend/versi.py
```

Hasilnya `installer/dist/PulmoTriage-Setup-<versi>.exe` dan salinan bernama tetap `installer/dist/PulmoTriage-Setup.exe`. File ini **tidak di-commit** (sekitar 55 MB).

## Merilis versi baru

1. Naikkan `VERSI` di `backend/versi.py`, lalu `cd frontend && npm run build:offline` dan bangun installer.
2. GitHub → Releases → Draft a new release → tag `v<versi>` → unggah **`PulmoTriage-Setup.exe`** (nama harus persis). Portal dan pemberitahuan di aplikasi memakai tautan `releases/latest/download/PulmoTriage-Setup.exe`, jadi selalu menunjuk ke rilis terbaru.
3. Render → layanan cloud → Environment: `VERSI_TERBARU=<versi>` (opsional `CATATAN_VERSI`). Aplikasi yang lebih lama menampilkan pemberitahuan dalam 1 jam saat online.

Sebelum membangun, pastikan `backend/web` sudah diperbarui (`cd frontend && npm run build:offline`) dan `backend/lisensi_publik.pem` ada.

## Catatan

- Installer belum ditandatangani sertifikat (code signing), jadi Windows SmartScreen akan menampilkan peringatan. Klik **More info → Run anyway**.
- Saat pertama kali dibuka, model butuh beberapa detik untuk dimuat sebelum browser terbuka.
- Jendela hitam "PulmoTriage - jangan tutup jendela ini" adalah server aplikasi. Menutupnya berarti menutup aplikasi.
