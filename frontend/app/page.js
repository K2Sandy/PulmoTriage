"use client";

import { useState } from "react";

// Alamat backend. Saat deploy nanti, diganti lewat variabel NEXT_PUBLIC_API_URL.
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const GEJALA = [
  ["batuk_2minggu", "Batuk lebih dari 2 minggu"],
  ["demam", "Demam"],
  ["berat_badan_turun", "Berat badan turun"],
  ["keringat_malam", "Keringat malam"],
  ["kontak_serumah", "Kontak serumah dengan pasien TBC"],
  ["riwayat_pengobatan", "Pernah berobat TBC"],
];

// Kelas Tailwind harus ditulis utuh, tidak boleh disusun dari potongan teks.
const WARNA = {
  MERAH: "border-red-600 bg-red-50 text-red-900",
  KUNING: "border-yellow-500 bg-yellow-50 text-yellow-900",
  HIJAU: "border-green-600 bg-green-50 text-green-900",
};

export default function Home() {
  const [file, setFile] = useState(null);
  const [nama, setNama] = useState("");
  const [umur, setUmur] = useState("");
  const [jk, setJk] = useState("");
  const [gejala, setGejala] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState(null);
  const [error, setError] = useState("");
  const [tinjauan, setTinjauan] = useState("");

  function toggle(key) {
    setGejala((g) => (g.includes(key) ? g.filter((k) => k !== key) : [...g, key]));
  }

  async function tinjau(keputusan) {
    const f = new FormData();
    f.append("keputusan", keputusan);
    try {
      const r = await fetch(`${API}/pemeriksaan/${hasil.id}/tinjau`, { method: "POST", body: f });
      if (!r.ok) throw new Error();
      setTinjauan(keputusan);
    } catch {
      setTinjauan("");
      setError("Tinjauan dokter GAGAL disimpan. Coba klik lagi.");
    }
  }

  async function kirim(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setHasil(null);
    setTinjauan("");

    const form = new FormData();
    form.append("foto", file);
    form.append("gejala", gejala.join(","));
    form.append("nama", nama);
    form.append("umur", umur);
    form.append("jenis_kelamin", jk);

    try {
      const res = await fetch(`${API}/analyze`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Terjadi kesalahan");
      setHasil(data);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Tidak bisa terhubung ke server analisis. Pastikan backend menyala."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">PulmoTriage</h1>
      <p className="mb-6 text-gray-600">Alat bantu triase TBC dari rontgen dada. Bukan diagnosis.</p>

      <form onSubmit={kirim} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <input className="rounded border p-2" placeholder="Nama pasien" value={nama} onChange={(e) => setNama(e.target.value)} />
          <input className="rounded border p-2" placeholder="Umur" type="number" min="0" max="120" value={umur} onChange={(e) => setUmur(e.target.value)} />
          <select className="rounded border p-2" value={jk} onChange={(e) => setJk(e.target.value)}>
            <option value="">Jenis kelamin</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block font-medium">Foto rontgen dada</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
        </div>

        <fieldset>
          <legend className="mb-1 font-medium">Gejala pasien</legend>
          {GEJALA.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 py-1">
              <input type="checkbox" checked={gejala.includes(key)} onChange={() => toggle(key)} />
              {label}
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={!file || loading}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Menganalisis..." : "Analisis"}
        </button>
      </form>

      {error && <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-800">{error}</p>}

      {hasil && hasil.status === "rejected" && (
        <div className="mt-6 rounded border-2 border-gray-400 bg-gray-50 p-4">
          <h2 className="font-semibold">Foto belum bisa dianalisis</h2>
          <ul className="list-disc pl-5">
            {hasil.quality.issues.map((i) => (
              <li key={i.code}>{i.message}</li>
            ))}
          </ul>
        </div>
      )}

      {hasil && hasil.status === "ok" && (
        <div className={`mt-6 rounded border-2 p-4 ${WARNA[hasil.triage.category]}`}>
          <h2 className="text-xl font-semibold">
            {hasil.triage.category}: {hasil.triage.title}
          </h2>
          <p className="mt-1">{hasil.triage.action}</p>
          <p className="mt-2 text-sm">Skor AI: {hasil.prob_tb.toFixed(2)}</p>

          <ul className="mt-2 list-disc pl-5 text-sm">
            {hasil.triage.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>

          {hasil.warnings.map((w, i) => (
            <p key={i} className="mt-2 rounded bg-white/70 p-2 text-sm">{w}</p>
          ))}

          <img
            src={`data:image/png;base64,${hasil.heatmap_png}`}
            alt="Heatmap Grad-CAM di atas rontgen"
            className="mt-4 w-full rounded"
          />
          <p className="mt-3 text-xs">{hasil.disclaimer}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => tinjau("setuju")} className="rounded bg-green-700 px-3 py-1 text-white">
              Dokter setuju
            </button>
            <button type="button" onClick={() => tinjau("tidak_setuju")} className="rounded bg-gray-700 px-3 py-1 text-white">
              Dokter tidak setuju
            </button>
            <a
              href={`${API}/pemeriksaan/${hasil.id}/rujukan.pdf`}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-blue-600 bg-white px-3 py-1 text-blue-700"
            >
              Buka draf rujukan (PDF)
            </a>
          </div>
          {tinjauan && <p className="mt-2 text-sm">Tinjauan tersimpan: {tinjauan}. Buka ulang PDF untuk melihatnya.</p>}
        </div>
      )}
    </main>
  );
}
