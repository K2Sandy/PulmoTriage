"use client";

import { useEffect, useState } from "react";
import { API } from "../utils/api";

// Pemberitahuan versi baru. Hanya muncul bila komputer sedang online dan ada versi lebih baru.
export default function PembaruanBanner() {
  const [info, setInfo] = useState(null);
  const [tutup, setTutup] = useState(false);

  useEffect(() => {
    let batal = false;
    fetch(`${API}/pembaruan`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!batal && d?.ada_pembaruan) setInfo(d);
      })
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, []);

  if (!info || tutup) return null;

  return (
    <div id="banner-pembaruan" role="status" className="w-full bg-status-info-bg border-b border-primary/30">
      <div className="w-full max-w-[1366px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm font-atkinson">
        <div className="flex items-start gap-2 text-ink flex-1">
          <svg className="size-4 shrink-0 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <p>
            <span className="font-bold">Versi baru PulmoTriage {info.versi_terbaru} tersedia</span>
            <span className="text-muted"> (terpasang: {info.versi_terpasang}). </span>
            {info.catatan && <span>{info.catatan.replace(/[.\s]*$/, "")}. </span>}
            <span className="text-muted">Data pemeriksaan dan lisensi tetap aman saat memperbarui.</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {info.url_unduh && (
            <a
              id="btn-unduh-pembaruan"
              href={info.url_unduh}
              target="_blank"
              rel="noreferrer"
              className="h-9 px-3.5 rounded-[10px] bg-primary text-on-primary font-bold inline-flex items-center hover:brightness-105"
            >
              Unduh pembaruan
            </a>
          )}
          <button
            type="button"
            onClick={() => setTutup(true)}
            className="h-9 px-3 rounded-[10px] text-muted hover:text-ink hover:bg-surface cursor-pointer"
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  );
}
