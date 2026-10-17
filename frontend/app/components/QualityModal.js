"use client";

import { useEffect, useRef } from "react";

const DEFAULT_REASONS = [
  {
    code: "SALAH_POSISI",
    title: "Citra terlihat terputar atau miring.",
    desc: "Foto tegak lurus dengan film, dengan seluruh area paru masuk bingkai.",
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
      </svg>
    ),
  },
  {
    code: "PENCAHAYAAN",
    title: "Citra terlalu gelap.",
    desc: "Nyalakan viewer box dan hindari memotret di ruangan gelap.",
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ),
  },
  {
    code: "BERDERAU",
    title: "Citra terlalu berbintik.",
    desc: "Pakai file digital asli bila ada, atau foto ulang dengan kamera diam.",
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      </svg>
    ),
  },
];

export default function QualityModal({
  isOpen,
  onClose,
  onReupload,
  userPhotoUrl,
  issues = [],
}) {
  const modalRef = useRef(null);

  function handleClose() {
    onClose();
    // Kembalikan fokus ke tombol unggah / pilih file
    setTimeout(() => {
      const uploadBtn =
        document.getElementById("btn-ganti-foto") ||
        document.getElementById("btn-pilih-file") ||
        document.getElementById("btn-mulai-analisis");
      if (uploadBtn) uploadBtn.focus();
    }, 50);
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        handleClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // Pindahkan fokus ke modal
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 50);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-quality-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-[720px] my-6 p-6 sm:p-7 bg-white rounded-2xl shadow-[0px_24px_64px_0px_rgba(16,41,44,0.28)] border border-line flex flex-col gap-5 focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3.5">
          <div className="size-10 bg-status-neutral rounded-full flex justify-center items-center shrink-0 text-ink">
            {/* Ikon gambar-dicoret (ImageOff) */}
            <svg
              className="size-5 text-ink"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="M10.41 10.41a2 2 0 1 1-2.83-2.83" />
              <line x1="13.5" y1="13.5" x2="6" y2="21" />
              <line x1="18" y1="12" x2="21" y2="15" />
              <path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.05-.22 1.41-.59" />
              <path d="M21 15V5a2 2 0 0 0-2-2H9" />
            </svg>
          </div>
          <div className="flex-1">
            <h2
              id="modal-quality-title"
              className="text-ink text-2xl font-semibold font-fraunces leading-tight"
            >
              Foto belum bisa dianalisis
            </h2>
            <p className="mt-1 text-muted text-sm font-normal font-atkinson">
              Foto ini belum memenuhi syarat untuk dibaca AI. Perbaiki sesuai petunjuk, lalu unggah lagi.
            </p>
          </div>
          <button
            type="button"
            id="modal-btn-tutup-x"
            onClick={handleClose}
            aria-label="Tutup dialog"
            className="size-9 rounded-lg flex items-center justify-center text-ink hover:text-muted hover:bg-bg transition-colors cursor-pointer"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Visual Comparison: Foto Anda vs Contoh yang baik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Foto Anda */}
          <div className="flex flex-col gap-1.5">
            <span className="text-muted text-xs font-bold font-atkinson uppercase tracking-wide">
              FOTO ANDA
            </span>
            <div className="w-full h-44 bg-black rounded-xl flex items-center justify-center overflow-hidden border border-line/20">
              <img
                src={userPhotoUrl || "/rontgen_siti.png"}
                alt="Foto pengguna yang ditolak"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Contoh yang baik */}
          <div className="flex flex-col gap-1.5">
            <span className="text-muted text-xs font-bold font-atkinson uppercase tracking-wide">
              CONTOH YANG BAIK
            </span>
            <div className="w-full h-44 bg-black rounded-xl flex items-center justify-center overflow-hidden border border-line/20">
              <img
                src="/rontgen_baik.png"
                alt="Contoh rontgen toraks yang baik"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* 3 Alasan dengan Ikon */}
        <div className="flex flex-col border-t border-line divide-y divide-line">
          {DEFAULT_REASONS.map((item, idx) => (
            <div key={idx} className="py-3 flex items-start gap-3">
              <div className="size-8 rounded-full bg-status-neutral text-ink flex items-center justify-center shrink-0 mt-0.5">
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-ink text-base font-bold font-atkinson">
                  {item.title}
                </span>
                <span className="text-muted text-sm font-normal font-atkinson">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-line">
          <button
            type="button"
            id="modal-btn-tutup"
            onClick={handleClose}
            className="h-11 px-5 rounded-[10px] border border-primary bg-white text-primary hover:bg-status-info-bg font-bold text-base font-atkinson transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            id="modal-btn-unggah-ulang"
            onClick={() => {
              handleClose();
              if (onReupload) onReupload();
            }}
            className="h-11 px-5 rounded-[10px] bg-primary hover:bg-primary/90 text-white font-bold text-base font-atkinson transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Unggah ulang</span>
          </button>
        </div>
      </div>
    </div>
  );
}
