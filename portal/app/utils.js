export const CLOUD = process.env.NEXT_PUBLIC_CLOUD_URL || "http://localhost:8001";
// Tautan cadangan bila server cloud belum bisa dihubungi. Nilai sebenarnya diambil dari GET /versi di cloud.
export const URL_UNDUH_BAWAAN =
  process.env.NEXT_PUBLIC_URL_UNDUH || "https://github.com/K2Sandy/pulmotriage/releases/latest/download/PulmoTriage-Setup.exe";
// Opsional: kontak untuk permintaan lisensi (mailto:... atau https://wa.me/...). Kosong = tidak ditampilkan.
export const KONTAK = process.env.NEXT_PUBLIC_KONTAK || "";
