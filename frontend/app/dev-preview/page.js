"use client";

import { notFound } from "next/navigation";
import { useState } from "react";
import CategoryBadge from "../components/CategoryBadge";
import Button from "../components/Button";
import QualityModal from "../components/QualityModal";

export default function DevPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const [modalOpen, setModalOpen] = useState(false);

  const qualityCodes = [
    { code: "BURAM", label: "Buram" },
    { code: "BERDERAU", label: "Berderau" },
    { code: "PENCAHAYAAN", label: "Pencahayaan" },
    { code: "KONTRAS_RENDAH", label: "Kontras Rendah" },
    { code: "BUKAN_RONTGEN", label: "Bukan Rontgen" },
    { code: "TIDAK_DIKENALI", label: "Tidak Dikenali" },
    { code: "SALAH_POSISI", label: "Salah Posisi" },
    { code: "RESOLUSI_RENDAH", label: "Resolusi Rendah" },
  ];

  return (
    <div className="w-full max-w-[1200px] mx-auto p-6 flex flex-col gap-10">
      <div className="border-b border-line pb-4">
        <h1 className="text-3xl font-semibold font-fraunces text-ink">
          Komponen &amp; Token Dev Preview (e2)
        </h1>
        <p className="text-muted text-sm font-atkinson mt-1">
          Halaman pratinjau komponen desain untuk pengujian token dan komponen.
        </p>
      </div>

      {/* 1. Token Status Non-Triase */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wide font-atkinson">
          Token status non-triase
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-[10px] bg-status-error border border-line shrink-0" />
            <div>
              <div className="text-sm font-semibold font-mono text-ink">status-error #7A2E8A</div>
              <div className="text-xs text-muted font-atkinson">teks/ikon/garis error</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-[10px] bg-status-error-bg border border-line shrink-0" />
            <div>
              <div className="text-sm font-semibold font-mono text-ink">status-error-bg #F7EEF8</div>
              <div className="text-xs text-muted font-atkinson">latar banner error</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-[10px] bg-status-info-bg border border-line shrink-0" />
            <div>
              <div className="text-sm font-semibold font-mono text-ink">status-info-bg #E7F3F4</div>
              <div className="text-xs text-muted font-atkinson">latar info, nav aktif</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-[10px] bg-status-neutral border border-line shrink-0" />
            <div>
              <div className="text-sm font-semibold font-mono text-ink">status-neutral #EEF2F2</div>
              <div className="text-xs text-muted font-atkinson">disclaimer, neutral</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Semua Varian Toast */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wide font-atkinson">
          Varian Toast Sinkron
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          {/* Success */}
          <div className="w-80 px-4 py-3.5 glass-surface rounded-xl border border-line flex items-center gap-3 shadow-md">
            <svg className="size-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-normal text-ink font-atkinson flex-1">
              Terkirim <span className="font-mono font-medium">3</span> data.
            </span>
          </div>

          {/* Offline / Warning */}
          <div className="w-80 px-4 py-3.5 glass-surface rounded-xl border border-line flex items-center gap-3 shadow-md">
            <svg className="size-5 text-triage-kuning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-normal text-ink font-atkinson flex-1">
              Mode luring. Data tersimpan lokal.
            </span>
          </div>

          {/* Error */}
          <div className="w-80 px-4 py-3.5 glass-surface rounded-xl border border-line flex items-center gap-3 shadow-md">
            <svg className="size-5 text-status-error shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-sm font-normal text-ink font-atkinson flex-1">
              Gagal menyinkronkan data.
            </span>
          </div>
        </div>
      </section>

      {/* 3. Tiga Bar Sinkron */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wide font-atkinson">
          Tiga Bar Sinkron
        </h2>
        <div className="flex flex-col gap-3">
          {/* Semua tersinkron */}
          <div className="h-12 pl-3.5 pr-2 glass-surface rounded-full shadow-xs inline-flex items-center gap-3 max-w-fit">
            <svg className="size-4 text-triage-hijau" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-ink">Semua data tersinkron</span>
              <span className="text-[11px] text-muted">Sinkron terakhir: 15 Okt 2026</span>
            </div>
            <button type="button" className="h-8 px-3.5 rounded-full text-xs font-bold bg-surface border border-primary text-primary">
              Sinkronkan sekarang
            </button>
          </div>

          {/* Menunggu sinkron */}
          <div className="h-12 pl-3.5 pr-2 glass-surface rounded-full shadow-xs inline-flex items-center gap-3 max-w-fit">
            <svg className="size-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-ink">Menunggu sinkron ke cloud: 3</span>
              <span className="text-[11px] text-muted">Sinkron terakhir: 15 Okt 2026</span>
            </div>
            <button type="button" className="h-8 px-3.5 rounded-full text-xs font-bold bg-surface border border-primary text-primary">
              Sinkronkan sekarang
            </button>
          </div>

          {/* Sedang menyinkronkan */}
          <div className="h-12 pl-3.5 pr-2 glass-surface rounded-full shadow-xs inline-flex items-center gap-3 max-w-fit">
            <svg className="size-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-ink">Menyinkronkan ke cloud...</span>
              <span className="text-[11px] text-muted">Mohon tunggu sejenak...</span>
            </div>
            <button type="button" disabled className="h-8 px-3.5 rounded-full text-xs font-bold bg-bg border border-line text-muted/60">
              Menyinkronkan...
            </button>
          </div>
        </div>
      </section>

      {/* 4. Category Badges */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wide font-atkinson">
          Badge Kategori Triase
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <CategoryBadge category="MERAH" variant="solid" />
          <CategoryBadge category="KUNING" variant="solid" />
          <CategoryBadge category="HIJAU" variant="solid" />
          <CategoryBadge category="MERAH" variant="light" />
          <CategoryBadge category="KUNING" variant="light" />
          <CategoryBadge category="HIJAU" variant="light" />
        </div>
      </section>

      {/* 5. Empat Tombol */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wide font-atkinson">
          Empat Varian Tombol
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </section>

      {/* 6. Ikon Kode Kualitas */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wide font-atkinson">
            Ikon Kode Kualitas
          </h2>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Buka Dialog Kualitas (b4)
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {qualityCodes.map((item) => (
            <div key={item.code} className="p-3 bg-surface border border-line rounded-xl flex items-center gap-3">
              <div className="size-8 rounded-full bg-bg text-ink flex items-center justify-center shrink-0">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-ink">{item.code}</div>
                <div className="text-xs text-muted font-atkinson">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <QualityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        issues={["SALAH_POSISI", "PENCAHAYAAN", "BERDERAU"]}
      />
    </div>
  );
}
