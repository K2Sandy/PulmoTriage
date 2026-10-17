"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

const CLOUD = process.env.NEXT_PUBLIC_CLOUD_URL || "http://localhost:8001";

function formatTanggal(tglStr) {
  if (!tglStr) return "-";
  const parts = tglStr.split("-");
  if (parts.length !== 3) return tglStr;
  const [y, m, d] = parts;
  const bulan = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];
  const bIndex = parseInt(m, 10) - 1;
  return `${parseInt(d, 10)} ${bulan[bIndex] || m} ${y}`;
}

function formatTanggalSingkat(tglStr) {
  if (!tglStr) return "-";
  const parts = tglStr.split("-");
  if (parts.length !== 3) return tglStr;
  const [, m, d] = parts;
  const bulan = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];
  const bIndex = parseInt(m, 10) - 1;
  return `${parseInt(d, 10)} ${bulan[bIndex] || m}`;
}

function formatPersen(n, total) {
  if (!total || total === 0) return "0,0%";
  const p = (n / total) * 100;
  return `${p.toFixed(1).replace(".", ",")}%`;
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [hari, setHari] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeBar, setActiveBar] = useState(null);

  const muatData = useCallback(async (periode) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${CLOUD}/dashboard/ringkasan?hari=${periode}`);
      if (!res.ok) {
        throw new Error(`Server cloud merespons dengan status ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Gagal mengambil ringkasan dasbor:", err);
      setError("Gagal terhubung ke layanan cloud Dinas Kesehatan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muatData(hari);
  }, [hari, muatData]);

  // Urutkan per Puskesmas berdasarkan jumlah MERAH terbanyak
  const puskesmasSorted = useMemo(() => {
    if (!data?.per_puskesmas) return [];
    return [...data.per_puskesmas].sort((a, b) => {
      if (b.MERAH !== a.MERAH) {
        return b.MERAH - a.MERAH;
      }
      return b.total - a.total;
    });
  }, [data?.per_puskesmas]);

  // Cari tanggal terakhir dari data
  const dataTerakhir = useMemo(() => {
    if (!data?.per_hari || data.per_hari.length === 0) return "-";
    const tgls = data.per_hari.map((d) => d.tanggal).filter(Boolean);
    if (tgls.length === 0) return "-";
    tgls.sort();
    return tgls[tgls.length - 1];
  }, [data?.per_hari]);

  // Hitung nilai maks untuk skala grafik batang
  const maksHarian = useMemo(() => {
    if (!data?.per_hari || data.per_hari.length === 0) return 10;
    const totals = data.per_hari.map((d) => (d.MERAH || 0) + (d.KUNING || 0) + (d.HIJAU || 0));
    const maxVal = Math.max(...totals, 0);
    return maxVal > 0 ? Math.ceil(maxVal * 1.15) : 10;
  }, [data?.per_hari]);

  return (
    <main className="w-[1200px] max-w-full mx-auto py-2 sm:py-4 flex flex-col gap-5">
      {/* 1. DATA SIMULASI BANNER (Tampil hanya jika ada_data_simulasi === true) */}
      {data?.ada_data_simulasi && (
        <aside
          id="banner-simulasi"
          aria-label="Pemberitahuan Data Simulasi"
          className="w-full bg-ink text-surface px-4 py-2.5 rounded-xl flex items-center justify-center gap-2.5 shadow-xs border border-line-strong"
        >
          <svg className="size-4 shrink-0 text-triage-kuning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs sm:text-sm font-extrabold font-atkinson tracking-wider uppercase">
            DATA SIMULASI
          </span>
          <span className="text-xs sm:text-sm opacity-90 font-atkinson">
            · angka contoh untuk demo, bukan data pasien sungguhan
          </span>
        </aside>
      )}

      {/* 2. Top Header Controls: Title, Period Selector, & Data Terakhir */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-line">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold font-fraunces text-ink leading-tight">
            Ringkasan triase TBC
          </h1>
          <p className="text-muted text-xs sm:text-sm font-atkinson mt-1">
            Agregasi data triase wilayah Dinkes · {hari} hari terakhir
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selektor Periode (7, 30, 90 hari) */}
          <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-[10px] border border-line shadow-xs">
            <svg className="size-4 text-ink shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <label htmlFor="periode-select" className="sr-only">Pilih Periode Hari</label>
            <select
              id="periode-select"
              value={hari}
              onChange={(e) => setHari(Number(e.target.value))}
              className="bg-transparent text-ink text-sm font-bold font-atkinson focus:outline-none cursor-pointer pr-1"
            >
              <option value={7}>7 hari terakhir</option>
              <option value={30}>30 hari terakhir</option>
              <option value={90}>90 hari terakhir</option>
            </select>
          </div>

          {/* Catatan Data Terakhir */}
          <div className="text-muted text-xs sm:text-sm font-normal font-atkinson shrink-0 bg-surface sm:bg-transparent px-3 py-1.5 sm:px-0 sm:py-0 rounded-[10px] sm:rounded-none border sm:border-0 border-line">
            Data terakhir: <span className="font-mono text-ink font-medium">{formatTanggal(dataTerakhir)}</span>
          </div>
        </div>
      </section>

      {/* 3. STATE: ERROR BANNER (+ Tombol Coba Lagi) */}
      {error && !loading && (
        <section
          id="state-error"
          aria-live="assertive"
          className="rounded-2xl border border-status-error/30 bg-status-error-bg p-5 text-status-error flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <svg className="size-5 shrink-0 mt-0.5 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold text-sm text-status-error">Koneksi Gagal</p>
              <p className="text-sm text-status-error mt-0.5">{error}</p>
            </div>
          </div>
          <button
            id="btn-coba-lagi"
            onClick={() => muatData(hari)}
            className="self-start sm:self-auto px-4 py-2 bg-status-error hover:bg-status-error/90 text-on-primary rounded-lg text-sm font-semibold font-atkinson transition-colors shadow-xs cursor-pointer"
          >
            Coba lagi
          </button>
        </section>
      )}

      {/* 4. STATE: LOADING SKELETON */}
      {loading && (
        <section id="state-loading" aria-label="Memuat Data Dasbor" className="space-y-5 animate-pulse">
          {/* Skeleton 4 Kartu */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-surface rounded-2xl border border-line p-5 flex flex-col justify-between">
                <div className="h-4 w-20 bg-line rounded"></div>
                <div className="h-8 w-24 bg-line rounded"></div>
                <div className="h-3 w-28 bg-bg rounded"></div>
              </div>
            ))}
          </div>

          {/* Skeleton Grafik & Sebaran */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 h-72 bg-surface rounded-2xl border border-line p-6 flex flex-col justify-between">
              <div className="h-5 w-40 bg-line rounded"></div>
              <div className="h-44 bg-bg rounded"></div>
            </div>
            <div className="h-72 bg-surface rounded-2xl border border-line p-6 flex flex-col justify-between">
              <div className="h-5 w-36 bg-line rounded"></div>
              <div className="space-y-4">
                <div className="h-4 bg-bg rounded"></div>
                <div className="h-4 bg-bg rounded"></div>
                <div className="h-4 bg-bg rounded"></div>
              </div>
              <div className="h-3 w-32 bg-bg rounded"></div>
            </div>
          </div>

          {/* Skeleton Tabel */}
          <div className="h-64 bg-surface rounded-2xl border border-line p-6">
            <div className="h-5 w-32 bg-line rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-bg rounded"></div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. STATE: KOSONG (Tanpa Angka Palsu) */}
      {!loading && !error && data && data.total === 0 && (
        <section
          id="state-kosong"
          className="rounded-2xl border border-line bg-surface p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs"
        >
          <div className="size-14 rounded-full bg-bg flex items-center justify-center text-muted">
            <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold font-fraunces text-ink">
            Belum Ada Data Triase
          </h2>
          <p className="text-muted text-sm max-w-md font-atkinson">
            Tidak ada pemeriksaan tersinkron dalam rentang {hari} hari terakhir. Data akan muncul otomatis setelah Puskesmas melakukan sinkronisasi.
          </p>
        </section>
      )}

      {/* 6. KONTEN UTAMA: JIKA ADA DATA */}
      {!loading && !error && data && data.total > 0 && (
        <>
          {/* A. 4 Kartu Angka (Total, MERAH, KUNING, HIJAU) */}
          <section aria-label="Statistik Utama" className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card Total */}
            <div className="px-5 py-4 bg-surface rounded-2xl border border-line flex flex-col justify-start gap-1.5 shadow-xs">
              <div className="text-muted text-xs font-bold font-atkinson uppercase tracking-wide">
                Total
              </div>
              <div className="text-ink text-4xl sm:text-5xl font-semibold font-fraunces leading-tight">
                {data.total}
              </div>
              <div className="text-muted text-xs sm:text-sm font-normal font-atkinson">
                pemeriksaan tersinkron
              </div>
            </div>

            {/* Card MERAH */}
            <div className="px-5 py-4 bg-surface rounded-2xl border border-line flex flex-col justify-start gap-1.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="h-7 px-2.5 bg-triage-merah text-on-triage-merah rounded-md inline-flex items-center gap-1.5 text-xs font-extrabold font-atkinson tracking-wide">
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  MERAH
                </span>
              </div>
              <div className="text-ink text-4xl sm:text-5xl font-semibold font-fraunces leading-tight">
                {data.per_kategori?.MERAH ?? 0}
              </div>
              <div className="text-muted text-xs sm:text-sm font-normal font-atkinson">
                {formatPersen(data.per_kategori?.MERAH || 0, data.total)} dari total
              </div>
            </div>

            {/* Card KUNING */}
            <div className="px-5 py-4 bg-surface rounded-2xl border border-line flex flex-col justify-start gap-1.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="h-7 px-2.5 bg-triage-kuning text-on-triage-kuning rounded-md inline-flex items-center gap-1.5 text-xs font-extrabold font-atkinson tracking-wide">
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  KUNING
                </span>
              </div>
              <div className="text-ink text-4xl sm:text-5xl font-semibold font-fraunces leading-tight">
                {data.per_kategori?.KUNING ?? 0}
              </div>
              <div className="text-muted text-xs sm:text-sm font-normal font-atkinson">
                {formatPersen(data.per_kategori?.KUNING || 0, data.total)} dari total
              </div>
            </div>

            {/* Card HIJAU */}
            <div className="px-5 py-4 bg-surface rounded-2xl border border-line flex flex-col justify-start gap-1.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="h-7 px-2.5 bg-triage-hijau text-on-triage-hijau rounded-md inline-flex items-center gap-1.5 text-xs font-extrabold font-atkinson tracking-wide">
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  HIJAU
                </span>
              </div>
              <div className="text-ink text-4xl sm:text-5xl font-semibold font-fraunces leading-tight">
                {data.per_kategori?.HIJAU ?? 0}
              </div>
              <div className="text-muted text-xs sm:text-sm font-normal font-atkinson">
                {formatPersen(data.per_kategori?.HIJAU || 0, data.total)} dari total
              </div>
            </div>
          </section>

          {/* B. Grafik Batang Bertumpuk & Sebaran Kategori */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. Grafik Batang Bertumpuk Per Hari (Span 2 Cols) */}
            <div className="lg:col-span-2 p-5 sm:p-6 bg-surface rounded-2xl border border-line flex flex-col gap-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold font-atkinson text-ink">
                    Pemeriksaan per hari
                  </h2>
                  <p className="text-xs text-muted font-atkinson">
                    Volume pemeriksaan harian dalam rentang periode yang dipilih
                  </p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3.5 text-xs font-atkinson font-medium text-ink shrink-0">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[2px] bg-triage-merah inline-block"></span>
                    MERAH
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[2px] bg-triage-kuning inline-block"></span>
                    KUNING
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[2px] bg-triage-hijau inline-block"></span>
                    HIJAU
                  </span>
                </div>
              </div>

              {/* Batang Bertumpuk Chart Container */}
              <div className="w-full pt-4">
                {/* Visual Chart with Grid Lines */}
                <div className="relative h-56 w-full flex flex-col justify-between">
                  {/* Grid Lines & Y-Labels */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="w-full flex items-center">
                      <span className="w-8 text-right pr-2 text-xs font-mono text-muted">
                        {maksHarian}
                      </span>
                      <div className="flex-1 border-t border-line"></div>
                    </div>
                    <div className="w-full flex items-center">
                      <span className="w-8 text-right pr-2 text-xs font-mono text-muted">
                        {Math.round(maksHarian / 2)}
                      </span>
                      <div className="flex-1 border-t border-line"></div>
                    </div>
                    <div className="w-full flex items-center">
                      <span className="w-8 text-right pr-2 text-xs font-mono text-muted">
                        0
                      </span>
                      <div className="flex-1 border-t border-line"></div>
                    </div>
                  </div>

                  {/* Columns of Stacked Bars */}
                  <div className="relative pl-10 h-48 mt-2 flex items-end justify-between gap-1 sm:gap-1.5">
                    {data.per_hari?.map((d) => {
                      const totalHari = (d.MERAH || 0) + (d.KUNING || 0) + (d.HIJAU || 0);
                      const tMerah = (d.MERAH || 0);
                      const tKuning = (d.KUNING || 0);
                      const tHijau = (d.HIJAU || 0);

                      // Percent of max height
                      const barHeightPct = maksHarian > 0 ? Math.min(100, Math.max(4, (totalHari / maksHarian) * 100)) : 0;
                      const hMerah = totalHari > 0 ? (tMerah / totalHari) * 100 : 0;
                      const hKuning = totalHari > 0 ? (tKuning / totalHari) * 100 : 0;
                      const hHijau = totalHari > 0 ? (tHijau / totalHari) * 100 : 0;

                      const isHovered = activeBar === d.tanggal;

                      return (
                        <div
                          key={d.tanggal}
                          onMouseEnter={() => setActiveBar(d.tanggal)}
                          onMouseLeave={() => setActiveBar(null)}
                          className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                        >
                          {/* Tooltip on hover */}
                          {isHovered && (
                            <div className="absolute bottom-full mb-2 z-30 px-2.5 py-1.5 bg-ink text-surface text-xs rounded-lg shadow-lg pointer-events-none whitespace-nowrap">
                              <p className="font-bold font-mono">{formatTanggal(d.tanggal)}</p>
                              <p className="text-[11px] text-line">Total: {totalHari}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                                <span className="text-text-merah">M: {tMerah}</span>
                                <span className="text-triage-kuning">K: {tKuning}</span>
                                <span className="text-text-hijau">H: {tHijau}</span>
                              </div>
                            </div>
                          )}

                          {/* Stacked Bar (Bottom: Hijau, Mid: Kuning, Top: Merah) */}
                          <div
                            style={{ height: `${barHeightPct}%` }}
                            className="w-full max-w-[20px] flex flex-col-reverse rounded-t overflow-hidden transition-all duration-200 group-hover:opacity-90"
                          >
                            {tHijau > 0 && (
                              <div
                                style={{ height: `${hHijau}%` }}
                                className="w-full bg-triage-hijau shrink-0"
                              />
                            )}
                            {tKuning > 0 && (
                              <div
                                style={{ height: `${hKuning}%` }}
                                className="w-full bg-triage-kuning shrink-0 border-t border-white"
                              />
                            )}
                            {tMerah > 0 && (
                              <div
                                style={{ height: `${hMerah}%` }}
                                className="w-full bg-triage-merah shrink-0 border-t border-white"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* X-Axis Date Labels */}
                <div className="pl-10 pt-2 flex justify-between text-[11px] font-mono text-muted overflow-hidden">
                  {(() => {
                    const list = data.per_hari || [];
                    if (list.length === 0) return null;
                    if (list.length <= 5) {
                      return list.map((d) => (
                        <span key={d.tanggal}>{formatTanggalSingkat(d.tanggal)}</span>
                      ));
                    }
                    // Tampilkan 5 interval tanggal
                    const indices = [
                      0,
                      Math.floor(list.length * 0.25),
                      Math.floor(list.length * 0.5),
                      Math.floor(list.length * 0.75),
                      list.length - 1,
                    ];
                    return indices.map((idx) => (
                      <span key={list[idx]?.tanggal || idx}>
                        {formatTanggalSingkat(list[idx]?.tanggal)}
                      </span>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* 2. Sebaran Kategori (1 Col) */}
            <div className="p-5 sm:p-6 bg-surface rounded-2xl border border-line flex flex-col justify-between gap-5 shadow-xs">
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-atkinson text-ink">
                  Sebaran kategori
                </h2>
                <p className="text-xs text-muted font-atkinson mt-0.5">
                  Proporsi triase seluruh wilayah
                </p>
              </div>

              {/* Progress bars per category */}
              <div className="space-y-4">
                {/* MERAH */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 font-bold font-atkinson text-text-merah">
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      MERAH
                    </span>
                    <span className="font-mono font-medium text-ink">
                      {formatPersen(data.per_kategori?.MERAH || 0, data.total)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-line rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${data.total > 0 ? ((data.per_kategori?.MERAH || 0) / data.total) * 100 : 0}%`,
                      }}
                      className="h-full bg-triage-merah rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* KUNING */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 font-bold font-atkinson text-text-kuning">
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      KUNING
                    </span>
                    <span className="font-mono font-medium text-ink">
                      {formatPersen(data.per_kategori?.KUNING || 0, data.total)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-line rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${data.total > 0 ? ((data.per_kategori?.KUNING || 0) / data.total) * 100 : 0}%`,
                      }}
                      className="h-full bg-triage-kuning rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* HIJAU */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 font-bold font-atkinson text-text-hijau">
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      HIJAU
                    </span>
                    <span className="font-mono font-medium text-ink">
                      {formatPersen(data.per_kategori?.HIJAU || 0, data.total)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-line rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${data.total > 0 ? ((data.per_kategori?.HIJAU || 0) / data.total) * 100 : 0}%`,
                      }}
                      className="h-full bg-triage-hijau rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>

              {/* Note bottom of card */}
              <div className="pt-2 border-t border-line text-xs text-muted font-atkinson">
                Persen dari {data.total} pemeriksaan, {hari} hari.
              </div>
            </div>
          </section>

          {/* C. Tabel Per Puskesmas (Diurutkan dari MERAH Terbanyak) */}
          <section className="bg-surface rounded-2xl border border-line p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-atkinson text-ink">
                  Per Puskesmas
                </h2>
                <p className="text-xs text-muted font-atkinson">
                  Diurutkan dari jumlah MERAH terbanyak
                </p>
              </div>
              <span className="text-xs font-mono text-muted">
                Total: {puskesmasSorted.length} fasilitas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-line text-xs font-bold font-atkinson uppercase tracking-wide text-muted">
                    <th className="py-3 px-3">Puskesmas</th>
                    <th className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-text-merah">
                        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        MERAH
                      </span>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-text-kuning">
                        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        KUNING
                      </span>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-text-hijau">
                        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        HIJAU
                      </span>
                    </th>
                    <th className="py-3 px-3 text-right text-muted">Total</th>
                    <th className="py-3 px-3 text-right text-muted">% MERAH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-atkinson">
                  {puskesmasSorted.map((p) => {
                    const pctMerah = formatPersen(p.MERAH, p.total);
                    return (
                      <tr key={p.puskesmas_id} className="hover:bg-bg/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-ink">
                          {p.puskesmas_id}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-text-merah">
                          {p.MERAH}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-text-kuning">
                          {p.KUNING}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-text-hijau">
                          {p.HIJAU}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-ink">
                          {p.total}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-ink">
                          {pctMerah}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* 7. Catatan Privasi & Pernyataan Wajib Triase */}
      <footer className="space-y-3 pt-2">
        {/* Catatan Data Anonim */}
        <div className="px-4 py-3 bg-surface sm:bg-bg/80 rounded-[10px] border border-line flex items-start gap-2.5 text-xs sm:text-sm font-atkinson text-ink">
          <svg className="size-4 shrink-0 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <span className="font-semibold">Data anonim:</span> tanpa nama, tanpa umur pasti, tanpa foto. Versi lomba tanpa login.
          </div>
        </div>

        {/* Pernyataan Wajib */}
        <div className="px-4 py-3 bg-status-info-bg rounded-[10px] border border-line text-ink text-xs sm:text-sm font-atkinson flex items-start gap-2.5">
          <svg className="size-4 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
