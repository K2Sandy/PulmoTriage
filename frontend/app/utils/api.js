// Alamat backend PulmoTriage.
// - Mode offline (hasil `npm run build:offline`, dibuka di http://localhost:8000):
//   tampilan disajikan oleh backend itu sendiri, jadi cukup alamat relatif ("").
// - Mode pengembangan (`npm run dev` di port 3000): backend di http://localhost:8000,
//   atau alamat lain lewat NEXT_PUBLIC_API_URL di .env.local.
export const API =
  process.env.NEXT_PUBLIC_OFFLINE === "1"
    ? ""
    : process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");
