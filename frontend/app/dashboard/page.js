"use client";

import { useEffect, useState } from "react";

// Alamat layanan cloud. Saat deploy, diganti lewat NEXT_PUBLIC_CLOUD_URL.
const CLOUD = process.env.NEXT_PUBLIC_CLOUD_URL || "http://localhost:8001";

const KATEGORI = [
  ["MERAH", "bg-red-600", "text-red-700", "border-red-200 bg-red-50/50"],
  ["KUNING", "bg-yellow-500", "text-yellow-700", "border-yellow-200 bg-yellow-50/50"],
  ["HIJAU", "bg-green-600", "text-green-700", "border-green-200 bg-green-50/50"],
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [hari, setHari] = useState(30);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    fetch(`${CLOUD}/dashboard/ringkasan?hari=${hari}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Tidak bisa terhubung ke layanan cloud."));
  }, [hari]);

  if (error) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <div className="rounded-xl border border-[#7A2E8A]/30 bg-[#F7EEF8] p-4 text-[#7A2E8A] text-sm">
          <strong>Koneksi Gagal:</strong> {error}
        </div>
      </main>
    );
  }

  if (!data) return <main className="p-6 max-w-4xl mx-auto text-gray-500">Memuat dasbor...</main>;

  const maks = Math.max(1, ...data.per_hari.map((d) => d.MERAH + d.KUNING + d.HIJAU));

  return (
    <main className="mx-auto max-w-5xl w-full py-4 space-y-6">
      {/* Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-fraunces text-teal-950">Ringkasan Dasbor Wilayah</h1>
          <p className="text-gray-500 text-sm font-atkinson mt-0.5">
            Agregasi data triase TBC dari Puskesmas. Data bersifat anonim tanpa identitas pribadi dan tanpa citra.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 self-start sm:self-auto bg-white px-3 py-1.5 rounded-[10px] border border-zinc-200 shadow-xs">
          <span>Periode:</span>
          <select
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm bg-white focus:outline-none focus:border-cyan-700 cursor-pointer"
            value={hari}
            onChange={(e) => setHari(Number(e.target.value))}
          >
            <option value={7}>7 hari terakhir</option>
            <option value={30}>30 hari terakhir</option>
            <option value={90}>90 hari terakhir</option>
          </select>
        </label>
      </div>

      {/* Warning Box SIMULASI (Wajib Ada) */}
      {data.ada_data_simulasi && (
        <div className="rounded-xl border border-yellow-400 bg-yellow-50 p-4 text-yellow-900 text-sm flex items-start gap-3 shadow-xs">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-bold">Perhatian: Mode Simulasi Aktif</p>
            <p className="mt-0.5">
              Sebagian data adalah SIMULASI untuk demo, bukan data pasien nyata.
            </p>
          </div>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Pemeriksaan</div>
          <div className="text-3xl font-bold text-teal-950 font-mono mt-1">{data.total}</div>
        </div>
        {KATEGORI.map(([k, , teks, styleCard]) => (
          <div key={k} className={`rounded-xl border p-4 shadow-xs ${styleCard}`}>
            <div className="text-xs font-bold uppercase tracking-wide text-gray-600">{k}</div>
            <div className={`text-3xl font-bold font-mono mt-1 ${teks}`}>{data.per_kategori[k]}</div>
          </div>
        ))}
      </div>

      {/* Daily Barchart */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
        <h2 className="text-base font-bold text-teal-950 font-fraunces mb-1">Pemeriksaan per hari</h2>
        <p className="text-xs text-gray-500 mb-4">Volume hasil triase per tanggal dalam rentang periode yang dipilih.</p>
        <div className="flex h-44 items-end gap-1.5 rounded-lg border border-zinc-100 bg-gray-50/50 p-3 overflow-x-auto">
          {data.per_hari.map((d) => (
            <div
              key={d.tanggal}
              className="flex h-full flex-1 min-w-[8px] flex-col-reverse group relative"
              title={`${d.tanggal}: Total ${d.MERAH + d.KUNING + d.HIJAU} (Merah: ${d.MERAH}, Kuning: ${d.KUNING}, Hijau: ${d.HIJAU})`}
            >
              {KATEGORI.map(([k, warna]) => (
                <div key={k} className={`${warna} transition-all`} style={{ height: `${(d[k] / maks) * 100}%` }} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-600 inline-block"></span> Merah
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-yellow-500 inline-block"></span> Kuning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-green-600 inline-block"></span> Hijau
          </span>
        </div>
      </div>

      {/* Puskesmas Table */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs overflow-hidden">
        <h2 className="text-base font-bold text-teal-950 font-fraunces mb-1">Per Puskesmas</h2>
        <p className="text-xs text-gray-500 mb-4">Daftar fasilitas kesehatan yang telah menyinkronkan data triase.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider border-b border-zinc-200">
              <tr>
                <th className="py-2.5 px-3">Puskesmas</th>
                <th className="py-2.5 px-3">Total</th>
                <th className="py-2.5 px-3">MERAH</th>
                <th className="py-2.5 px-3">KUNING</th>
                <th className="py-2.5 px-3">HIJAU</th>
                <th className="py-2.5 px-3">% MERAH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-atkinson">
              {data.per_puskesmas.map((p) => (
                <tr key={p.puskesmas_id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-teal-950">{p.puskesmas_id}</td>
                  <td className="py-2.5 px-3 font-mono">{p.total}</td>
                  <td className="py-2.5 px-3 font-mono text-red-700 font-bold">{p.MERAH}</td>
                  <td className="py-2.5 px-3 font-mono text-yellow-700">{p.KUNING}</td>
                  <td className="py-2.5 px-3 font-mono text-green-700">{p.HIJAU}</td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    {((p.MERAH / p.total) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
