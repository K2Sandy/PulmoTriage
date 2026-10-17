"use client";

import { useState } from "react";
import { useSync } from "./context/SyncContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const GEJALA = [
  ["batuk_2minggu", "Batuk lebih dari 2 minggu"],
  ["demam", "Demam"],
  ["berat_badan_turun", "Berat badan turun"],
  ["keringat_malam", "Keringat malam"],
  ["kontak_serumah", "Kontak serumah dengan pasien TBC"],
  ["riwayat_pengobatan", "Pernah berobat TBC"],
];

const WARNA = {
  MERAH: "border-red-600 bg-red-50 text-red-900",
  KUNING: "border-yellow-500 bg-yellow-50 text-yellow-900",
  HIJAU: "border-green-600 bg-green-50 text-green-900",
};

export default function Home() {
  const { cekSinkron } = useSync();
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
      cekSinkron();
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
    <main className="mx-auto max-w-3xl w-full py-4">
      {/* Pernyataan Wajib Disclaimer */}
      <div className="mb-6 rounded-xl border border-zinc-200 bg-[var(--color-status-neutral)] p-3.5 text-xs sm:text-sm text-teal-950 flex items-center gap-2.5 shadow-xs">
        <svg className="size-4 shrink-0 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          <strong>Pernyataan:</strong> Hasil AI adalah alat bantu triase, bukan diagnosis. Keputusan klinis tetap di tangan dokter.
        </span>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <h1 className="text-2xl font-bold font-fraunces text-teal-950 mb-1">Pemeriksaan Baru</h1>
        <p className="mb-6 text-gray-500 text-sm font-atkinson">
          Lengkapi data pasien dan unggah foto rontgen dada untuk analisis triase TBC.
        </p>

        <form onSubmit={kirim} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Nama Pasien</label>
              <input
                className="w-full rounded-[10px] border border-zinc-300 p-2.5 text-sm focus:border-cyan-700 focus:outline-none"
                placeholder="Nama pasien (fiktif)"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Umur (tahun)</label>
              <input
                className="w-full rounded-[10px] border border-zinc-300 p-2.5 text-sm font-mono focus:border-cyan-700 focus:outline-none"
                placeholder="0 - 120"
                type="number"
                min="0"
                max="120"
                value={umur}
                onChange={(e) => setUmur(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Jenis Kelamin</label>
              <select
                className="w-full rounded-[10px] border border-zinc-300 p-2.5 text-sm focus:border-cyan-700 focus:outline-none bg-white"
                value={jk}
                onChange={(e) => setJk(e.target.value)}
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Foto Rontgen Dada (PA/AP)</label>
            <input
              type="file"
              accept="image/*"
              className="w-full rounded-[10px] border border-zinc-300 p-2 text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 cursor-pointer"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </div>

          <fieldset className="rounded-[10px] border border-zinc-200 p-4">
            <legend className="px-2 text-xs font-bold text-gray-700 uppercase tracking-wide">
              Gejala Pasien
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {GEJALA.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2.5 py-1 text-sm text-teal-950 cursor-pointer hover:text-cyan-800">
                  <input
                    type="checkbox"
                    className="size-4 rounded text-cyan-700 focus:ring-cyan-600 accent-cyan-700"
                    checked={gejala.includes(key)}
                    onChange={() => toggle(key)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-[10px] bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-sm disabled:opacity-50 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Menganalisis citra...</span>
              </>
            ) : (
              <span>Mulai Analisis Triase</span>
            )}
          </button>
        </form>
      </div>

      {/* Error Banner with status-error token */}
      {error && (
        <div className="mt-6 rounded-xl border border-[#7A2E8A]/30 bg-[#F7EEF8] p-4 text-[#7A2E8A] text-sm flex items-start gap-3 shadow-xs">
          <svg className="size-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-bold">Terjadi Kesalahan</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Rejection Result */}
      {hasil && hasil.status === "rejected" && (
        <div className="mt-6 rounded-xl border border-zinc-300 bg-[var(--color-status-neutral)] p-5 shadow-xs">
          <h2 className="text-lg font-bold text-teal-950 font-fraunces flex items-center gap-2">
            <svg className="size-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Foto belum bisa dianalisis
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Pemeriksaan kualitas citra mendeteksi ketidaksesuaian standar radiologi:
          </p>
          <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
            {hasil.quality.issues.map((i) => (
              <li key={i.code}>
                <strong>{i.code}:</strong> {i.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Result */}
      {hasil && hasil.status === "ok" && (
        <div className={`mt-6 rounded-xl border-2 p-5 shadow-sm ${WARNA[hasil.triage.category]}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-bold font-fraunces">
              {hasil.triage.category}: {hasil.triage.title}
            </h2>
            <span className="font-mono text-sm px-2.5 py-1 rounded-md bg-white/80 font-bold border border-current">
              Skor AI: {hasil.prob_tb.toFixed(2)}
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed">{hasil.triage.action}</p>

          <div className="mt-3 pt-3 border-t border-current/20">
            <p className="text-xs font-bold uppercase tracking-wide">Alasan Klinis & Pertimbangan AI:</p>
            <ul className="mt-1.5 list-disc pl-5 text-sm space-y-0.5">
              {hasil.triage.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {hasil.warnings.map((w, i) => (
            <p key={i} className="mt-3 rounded-lg bg-white/80 p-2.5 text-xs text-amber-900 border border-amber-300 font-medium">
              ⚠️ {w}
            </p>
          ))}

          <div className="mt-4">
            <img
              src={`data:image/png;base64,${hasil.heatmap_png}`}
              alt="Heatmap Grad-CAM di atas rontgen"
              className="w-full max-h-[400px] object-contain rounded-lg border border-black/10 bg-black"
            />
            <p className="mt-1.5 text-center text-xs text-gray-600 italic">
              Peta panas Grad-CAM: visualisasi area yang paling memengaruhi keputusan model AI.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-current/20 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => tinjau("setuju")}
              className="px-4 py-2 rounded-[10px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-colors cursor-pointer shadow-xs"
            >
              Dokter setuju
            </button>
            <button
              type="button"
              onClick={() => tinjau("tidak_setuju")}
              className="px-4 py-2 rounded-[10px] bg-gray-700 hover:bg-gray-800 text-white font-bold text-sm transition-colors cursor-pointer shadow-xs"
            >
              Dokter tidak setuju
            </button>
            <a
              href={`${API}/pemeriksaan/${hasil.id}/rujukan.pdf`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-[10px] border border-cyan-700 bg-white text-cyan-700 hover:bg-cyan-50 font-bold text-sm transition-colors shadow-xs"
            >
              Buka draf rujukan (PDF)
            </a>
          </div>

          {tinjauan && (
            <p className="mt-3 text-xs sm:text-sm font-semibold bg-white/90 p-2.5 rounded-lg border border-current">
              ✓ Tinjauan tersimpan: {tinjauan === "setuju" ? "Dokter setuju dengan hasil AI" : "Dokter tidak setuju"}. Buka ulang PDF rujukan untuk melihat surat bertanda dokter.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
