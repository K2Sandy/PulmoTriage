"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatWaktu(isoString) {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const bulan = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];
    const tgl = d.getDate();
    const bln = bulan[d.getMonth()];
    const thn = d.getFullYear();
    const jam = String(d.getHours()).padStart(2, "0");
    const mnt = String(d.getMinutes()).padStart(2, "0");
    return `${tgl} ${bln} ${thn} · ${jam}.${mnt}`;
  } catch {
    return isoString;
  }
}

export default function RiwayatPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cari, setCari] = useState("");
  const [filterTab, setFilterTab] = useState("semua"); // "semua" | "belum_ditinjau" | "menunggu_sinkron"

  const muatRiwayat = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/pemeriksaan?limit=100`);
      if (!res.ok) {
        throw new Error(`Server merespons dengan status ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Gagal mengambil riwayat pemeriksaan:", err);
      setError("Gagal terhubung ke layanan server PulmoTriage lokal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muatRiwayat();
  }, [muatRiwayat]);

  // Hitung jumlah untuk pill filter
  const countBelumDitinjau = useMemo(() => {
    return data.filter((item) => !item.keputusan_dokter).length;
  }, [data]);

  const countMenungguSinkron = useMemo(() => {
    return data.filter((item) => item.tersinkron === 0).length;
  }, [data]);

  // Filter & Search data
  const filteredData = useMemo(() => {
    let result = [...data];

    if (filterTab === "belum_ditinjau") {
      result = result.filter((item) => !item.keputusan_dokter);
    } else if (filterTab === "menunggu_sinkron") {
      result = result.filter((item) => item.tersinkron === 0);
    }

    if (cari.trim()) {
      const q = cari.trim().toLowerCase();
      result = result.filter((item) => {
        const nama = (item.nama || "").toLowerCase();
        const idStr = String(item.id);
        const idPadded = idStr.padStart(4, "0");
        return nama.includes(q) || idStr.includes(q) || idPadded.includes(q);
      });
    }

    return result;
  }, [data, filterTab, cari]);

  return (
    <main className="w-full max-w-[1240px] mx-auto py-2 sm:py-4 flex flex-col gap-5">
      {/* 1. Header: Judul, Catatan Privasi & Input Pencarian */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold font-fraunces text-teal-950 leading-tight">
            Riwayat pemeriksaan
          </h1>
          <p className="text-gray-500 text-xs sm:text-base font-normal font-atkinson mt-1">
            Tersimpan di komputer Puskesmas ini. Nama pasien tidak dikirim ke cloud.
          </p>
        </div>

        {/* Input Pencarian Nama atau Nomor */}
        <div className="w-full md:w-80 h-11 px-3 bg-white rounded-md border border-slate-500 flex items-center gap-2 shadow-xs shrink-0">
          <svg className="size-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <label htmlFor="input-cari" className="sr-only">Cari nama atau nomor</label>
          <input
            id="input-cari"
            type="text"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama atau nomor"
            className="w-full bg-transparent text-teal-950 text-sm sm:text-base font-normal font-atkinson placeholder:text-gray-400 focus:outline-none"
          />
          {cari && (
            <button
              type="button"
              onClick={() => setCari("")}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold px-1"
              title="Bersihkan pencarian"
            >
              ✕
            </button>
          )}
        </div>
      </section>

      {/* 2. Filter Pills: Semua / Belum ditinjau / Menunggu sinkron */}
      <section aria-label="Filter Riwayat" className="flex flex-wrap items-center gap-2">
        {/* Tab Semua */}
        <button
          type="button"
          id="filter-semua"
          onClick={() => setFilterTab("semua")}
          className={`h-9 px-4 rounded-full text-sm font-bold font-atkinson transition-all flex items-center gap-1.5 cursor-pointer ${
            filterTab === "semua"
              ? "bg-teal-950 text-white shadow-xs"
              : "bg-white text-teal-950 border border-zinc-200 hover:bg-gray-50"
          }`}
        >
          <span>Semua</span>
          <span className={`text-xs font-mono font-medium ${filterTab === "semua" ? "text-zinc-300" : "text-gray-500"}`}>
            {data.length}
          </span>
        </button>

        {/* Tab Belum ditinjau */}
        <button
          type="button"
          id="filter-belum-ditinjau"
          onClick={() => setFilterTab("belum_ditinjau")}
          className={`h-9 px-4 rounded-full text-sm font-bold font-atkinson transition-all flex items-center gap-1.5 cursor-pointer ${
            filterTab === "belum_ditinjau"
              ? "bg-teal-950 text-white shadow-xs"
              : "bg-white text-teal-950 border border-zinc-200 hover:bg-gray-50"
          }`}
        >
          <span>Belum ditinjau</span>
          <span className={`text-xs font-mono font-medium ${filterTab === "belum_ditinjau" ? "text-zinc-300" : "text-teal-950"}`}>
            {countBelumDitinjau}
          </span>
        </button>

        {/* Tab Menunggu sinkron */}
        <button
          type="button"
          id="filter-menunggu-sinkron"
          onClick={() => setFilterTab("menunggu_sinkron")}
          className={`h-9 px-4 rounded-full text-sm font-bold font-atkinson transition-all flex items-center gap-1.5 cursor-pointer ${
            filterTab === "menunggu_sinkron"
              ? "bg-teal-950 text-white shadow-xs"
              : "bg-white text-teal-950 border border-zinc-200 hover:bg-gray-50"
          }`}
        >
          <span>Menunggu sinkron</span>
          <span className={`text-xs font-mono font-medium ${filterTab === "menunggu_sinkron" ? "text-zinc-300" : "text-teal-950"}`}>
            {countMenungguSinkron}
          </span>
        </button>
      </section>

      {/* 3. STATE: ERROR BANNER */}
      {error && !loading && (
        <section
          id="state-error"
          aria-live="assertive"
          className="rounded-2xl border border-fuchsia-300 bg-[#F7EEF8] p-5 text-[#7A2E8A] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <svg className="size-5 shrink-0 mt-0.5 text-fuchsia-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold text-sm text-fuchsia-900">Koneksi Gagal</p>
              <p className="text-sm text-fuchsia-800 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={muatRiwayat}
            className="self-start sm:self-auto px-4 py-2 bg-fuchsia-800 hover:bg-fuchsia-900 text-white rounded-lg text-sm font-semibold font-atkinson transition-colors shadow-xs cursor-pointer"
          >
            Coba lagi
          </button>
        </section>
      )}

      {/* 4. STATE: LOADING SKELETON */}
      {loading && (
        <section id="state-loading" aria-label="Memuat Riwayat" className="w-full bg-white rounded-2xl border border-zinc-200 p-6 animate-pulse space-y-4">
          <div className="h-6 w-48 bg-zinc-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-zinc-100 rounded"></div>
            ))}
          </div>
        </section>
      )}

      {/* 5. STATE: RIWAYAT KOSONG (Database belum ada data sama sekali) */}
      {!loading && !error && data.length === 0 && (
        <section
          id="state-kosong"
          className="rounded-2xl border border-zinc-200 bg-white p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs"
        >
          <div className="size-14 rounded-full bg-zinc-100 flex items-center justify-center text-gray-400">
            <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-bold font-fraunces text-teal-950">
            Belum Ada Riwayat Pemeriksaan
          </h2>
          <p className="text-gray-500 text-sm max-w-md font-atkinson">
            Belum ada data pemeriksaan tersimpan di komputer Puskesmas ini. Mulai pemeriksaan baru untuk menambahkan data pasien.
          </p>
          <Link
            href="/"
            className="mt-2 h-10 px-5 rounded-[10px] bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-xs"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Mulai pemeriksaan baru</span>
          </Link>
        </section>
      )}

      {/* 6. TABEL RIWAYAT PEMERIKSAAN */}
      {!loading && !error && data.length > 0 && (
        <section className="bg-white rounded-2xl border border-zinc-200 p-2 sm:p-4 shadow-xs flex flex-col gap-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[960px]">
              <thead>
                <tr className="border-b-2 border-slate-500 text-xs font-bold font-atkinson uppercase tracking-wide text-gray-500">
                  <th className="py-2.5 px-3.5 w-20 text-left">No.</th>
                  <th className="py-2.5 px-3.5 w-44 text-left">Waktu</th>
                  <th className="py-2.5 px-3.5 w-56 text-left">Pasien</th>
                  <th className="py-2.5 px-3.5 w-44 text-left">Kategori</th>
                  <th className="py-2.5 px-3.5 w-24 text-right">Skor AI</th>
                  <th className="py-2.5 px-3.5 w-40 text-left">Tinjauan dokter</th>
                  <th className="py-2.5 px-3.5 w-36 text-left">Sinkron</th>
                  <th className="py-2.5 px-3.5 w-28 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-atkinson">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500 font-atkinson">
                      Tidak ada pemeriksaan yang sesuai dengan pencarian atau filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => {
                    const cleanNama = item.nama
                      ? item.nama.replace(/\s*\(fiktif\)$/, "")
                      : "Tanpa nama";
                    const idPadded = String(item.id).padStart(4, "0");
                    const skorStr = item.atipikal
                      ? "(?)"
                      : item.prob_tb != null
                      ? item.prob_tb.toFixed(2).replace(".", ",")
                      : "-";

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* No. */}
                        <td className="py-3 px-3.5 font-mono font-medium text-teal-950 text-base">
                          {idPadded}
                        </td>

                        {/* Waktu */}
                        <td className="py-3 px-3.5 text-teal-950 text-sm sm:text-base font-normal">
                          {formatWaktu(item.dibuat_pada)}
                        </td>

                        {/* Pasien */}
                        <td className="py-3 px-3.5 text-sm sm:text-base">
                          <span className="text-teal-950 font-normal">{cleanNama} </span>
                          <span className="text-gray-500 font-normal">(fiktif)</span>
                        </td>

                        {/* Kategori Badge */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            {item.kategori === "MERAH" && (
                              <span className="h-7 px-2.5 bg-red-700 text-white rounded-md inline-flex items-center gap-1.5 text-xs font-extrabold tracking-wide">
                                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                MERAH
                              </span>
                            )}
                            {item.kategori === "KUNING" && (
                              <span className="h-7 px-2.5 bg-yellow-500 text-stone-900 rounded-md inline-flex items-center gap-1.5 text-xs font-extrabold tracking-wide">
                                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="8" x2="12" y2="12" />
                                  <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                KUNING
                              </span>
                            )}
                            {item.kategori === "HIJAU" && (
                              <span className="h-7 px-2.5 bg-green-700 text-white rounded-md inline-flex items-center gap-1.5 text-xs font-extrabold tracking-wide">
                                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                HIJAU
                              </span>
                            )}

                            {/* Indikator Atipikal */}
                            {Boolean(item.atipikal) && (
                              <span
                                title="Citra janggal / atipikal"
                                className="size-5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold inline-flex items-center justify-center shrink-0"
                              >
                                !
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Skor AI */}
                        <td className="py-3 px-3.5 text-right font-mono font-medium text-teal-950 text-base">
                          {skorStr}
                        </td>

                        {/* Tinjauan Dokter */}
                        <td className="py-3 px-3.5">
                          {item.keputusan_dokter === "setuju" ? (
                            <div className="inline-flex items-center gap-1.5 text-teal-950 text-sm sm:text-base">
                              <svg className="size-4 text-teal-950 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Setuju</span>
                            </div>
                          ) : item.keputusan_dokter === "tidak_setuju" ? (
                            <div className="inline-flex items-center gap-1.5 text-teal-950 text-sm sm:text-base">
                              <svg className="size-4 text-teal-950 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Tidak setuju</span>
                            </div>
                          ) : (
                            <span className="h-6 px-2.5 bg-gray-100 rounded-full border border-zinc-200 inline-flex items-center text-gray-500 text-xs font-bold tracking-wide">
                              Belum ditinjau
                            </span>
                          )}
                        </td>

                        {/* Sinkron */}
                        <td className="py-3 px-3.5">
                          {item.tersinkron === 1 ? (
                            <div className="inline-flex items-center gap-1.5 text-gray-500 text-sm sm:text-base">
                              <svg className="size-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Tersinkron</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-teal-950 font-bold text-sm sm:text-base">
                              <svg className="size-4 text-teal-950 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>Menunggu</span>
                            </div>
                          )}
                        </td>

                        {/* Tombol Buka */}
                        <td className="py-3 px-3.5 text-right">
                          <Link
                            href={`/?id=${item.id}`}
                            id={`btn-buka-${item.id}`}
                            className="inline-flex items-center gap-1.5 text-cyan-700 font-bold text-sm sm:text-base hover:text-cyan-800 transition-colors"
                          >
                            <span>Buka</span>
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 7. Catatan Privasi & Pernyataan Medis Wajib */}
      <footer className="space-y-3 pt-2">
        {/* Catatan Privasi Data Anonim */}
        <div className="px-4 py-3 bg-white sm:bg-gray-50/80 rounded-[10px] border border-zinc-200 flex items-start gap-2.5 text-xs sm:text-sm font-atkinson text-teal-950">
          <svg className="size-4 shrink-0 text-cyan-700 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <span className="font-semibold">Data anonim:</span> nama &amp; identitas pasien tidak pernah dikirim ke cloud. Versi lomba tanpa login.
          </div>
        </div>

        {/* Pernyataan Wajib Triase */}
        <div className="px-4 py-3 bg-cyan-50/60 rounded-[10px] border border-cyan-200/70 text-cyan-950 text-xs sm:text-sm font-atkinson flex items-start gap-2.5">
          <svg className="size-4 text-cyan-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            <strong>Peringatan Medis:</strong> Hasil AI adalah alat bantu triase, bukan diagnosis. Keputusan klinis tetap di tangan dokter.
          </p>
        </div>
      </footer>
    </main>
  );
}
