"use client";

const ISSUE_DETAILS = {
  BURAM: {
    title: "Citra terlalu buram.",
    desc: "Foto ulang dengan kamera stabil dan fokus tajam pada film rontgen.",
  },
  BERDERAU: {
    title: "Citra terlalu berbintik.",
    desc: "Pakai file digital asli bila ada, atau foto ulang dengan kamera diam dan pencahayaan cukup.",
  },
  PENCAHAYAAN: {
    title: "Citra terlalu gelap atau terlalu terang.",
    desc: "Nyalakan viewer box dan hindari memotret di ruangan gelap atau di bawah pantulan lampu.",
  },
  KONTRAS_RENDAH: {
    title: "Kontras citra terlalu rendah.",
    desc: "Pastikan film menempel rata di viewer box dan tidak ada pantulan cahaya luar pada kaca.",
  },
  BUKAN_RONTGEN: {
    title: "Bukan rontgen dada atau berwarna.",
    desc: "Pastikan berkas yang diunggah adalah foto rontgen toraks hitam-putih, bukan foto dokumen atau organ lain.",
  },
  TIDAK_DIKENALI: {
    title: "Citra tidak dikenali sebagai rontgen toraks.",
    desc: "Pastikan posisi frontal (PA/AP) dan seluruh lapang dada dari apex hingga sudut kostofrenikus masuk bingkai.",
  },
  SALAH_POSISI: {
    title: "Citra terlihat terputar atau miring.",
    desc: "Foto tegak lurus dengan film, pastikan puncak paru berada di bagian atas bingkai.",
  },
  RESOLUSI_RENDAH: {
    title: "Resolusi foto terlalu rendah.",
    desc: "Gunakan foto resolusi tinggi dengan sisi terpendek minimal 200 piksel agar detail paru terlihat jelas.",
  },
};

export default function QualityModal({ isOpen, onClose, onReupload, userPhotoUrl, issues = [] }) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-quality-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="w-full max-w-[720px] my-8 p-6 sm:p-7 bg-white rounded-2xl shadow-[0px_24px_64px_0px_rgba(16,41,44,0.28)] border border-zinc-200 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3.5">
          <div className="size-11 bg-gray-100 rounded-full flex justify-center items-center shrink-0 text-teal-950">
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 id="modal-quality-title" className="text-teal-950 text-xl sm:text-2xl font-semibold font-fraunces leading-tight">
              Foto belum bisa dianalisis
            </h2>
            <p className="mt-1 text-gray-500 text-sm sm:text-base font-normal font-atkinson">
              Foto ini belum memenuhi syarat untuk dibaca AI. Perbaiki sesuai petunjuk, lalu unggah lagi.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="size-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Visual Comparison: Foto Anda vs Contoh yang baik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Foto Anda */}
          <div className="flex flex-col gap-1.5">
            <span className="text-gray-500 text-xs font-bold font-atkinson uppercase tracking-wide">
              Foto Anda
            </span>
            <div className="w-full h-44 bg-neutral-950 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-800">
              {userPhotoUrl ? (
                <img
                  src={userPhotoUrl}
                  alt="Foto pengguna yang ditolak"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-gray-500 text-xs font-atkinson">Foto tidak tersedia</span>
              )}
            </div>
          </div>

          {/* Contoh yang baik */}
          <div className="flex flex-col gap-1.5">
            <span className="text-gray-500 text-xs font-bold font-atkinson uppercase tracking-wide">
              Contoh yang baik
            </span>
            <div className="w-full h-44 bg-neutral-950 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-800 p-2">
              {/* Illustrative Normal Chest X-ray SVG */}
              <svg viewBox="0 0 160 180" className="h-full w-auto text-neutral-400 opacity-90" fill="none">
                <rect width="160" height="180" fill="#0A0A0A" rx="4" />
                {/* Spine & mediastinum */}
                <path d="M80 15v150" stroke="#737373" strokeWidth="10" strokeLinecap="round" opacity="0.4" />
                <path d="M74 65c0 15 12 15 12 0s-12-15-12 0z" fill="#A3A3A3" opacity="0.6" />
                {/* Clavicles */}
                <path d="M35 38c20 8 40 4 45 6M125 38c-20 8-40 4-45 6" stroke="#D4D4D4" strokeWidth="3.5" strokeLinecap="round" />
                {/* Left & Right Lung Fields */}
                <path d="M35 50c-15 25-18 65-5 85 10 3 35-10 40-15-8-20-8-55-10-70z" fill="#262626" stroke="#525252" strokeWidth="1.5" />
                <path d="M125 50c15 25 18 65 5 85-10 3-35-10-40-15 8-20 8-55 10-70z" fill="#262626" stroke="#525252" strokeWidth="1.5" />
                {/* Ribs arches */}
                <path d="M40 65c15 5 30 2 34 5M40 85c15 6 30 3 35 6M40 105c15 7 30 4 35 7" stroke="#737373" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
                <path d="M120 65c-15 5-30 2-34 5M120 85c-15 6-30 3-35 6M120 105c-15 7-30 4-35 7" stroke="#737373" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
                {/* Heart silhouette */}
                <path d="M72 100c-8 0-16 10-14 24 2 12 14 16 22 10" fill="#A3A3A3" opacity="0.5" />
                {/* Diaphragm dome */}
                <path d="M22 142c15-10 35-8 50-2M138 142c-15-10-35-8-50-2" stroke="#A3A3A3" strokeWidth="2.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* List of Detected Issues */}
        <div className="flex flex-col border-t border-zinc-200 divide-y divide-zinc-200">
          {issues.map((issue, idx) => {
            const detail = ISSUE_DETAILS[issue.code] || {
              title: issue.message || "Kualitas citra tidak sesuai.",
              desc: "Pastikan foto rontgen jelas, tegak, dan berada dalam pencahayaan yang cukup.",
            };

            return (
              <div key={idx} className="py-3 flex items-start gap-3">
                <div className="size-8 rounded-full bg-pink-50 text-[var(--color-status-error)] flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-teal-950 text-sm sm:text-base font-bold font-atkinson">
                    {detail.title}
                  </span>
                  <span className="text-gray-500 text-xs sm:text-sm font-normal font-atkinson">
                    {detail.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-[10px] border border-cyan-700 bg-white text-cyan-700 hover:bg-cyan-50 font-bold text-sm sm:text-base font-atkinson transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onReupload) onReupload();
            }}
            className="h-11 px-5 rounded-[10px] bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-sm sm:text-base font-atkinson transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Unggah ulang</span>
          </button>
        </div>
      </div>
    </div>
  );
}
