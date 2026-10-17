"use client";

import Link from "next/link";

export default function RiwayatPage() {
  return (
    <main className="w-full max-w-4xl mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-fraunces text-teal-950">Riwayat Pemeriksaan</h1>
          <p className="text-gray-500 text-sm font-atkinson mt-1">
            Data tersimpan di komputer Puskesmas ini secara luring. Nama pasien tidak pernah dikirim ke cloud.
          </p>
        </div>
        <Link
          href="/"
          className="h-10 px-4 rounded-[10px] bg-cyan-700 text-white font-bold text-sm flex items-center gap-2 hover:bg-cyan-800 transition-colors shadow-xs"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Pemeriksaan baru</span>
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-gray-500 shadow-xs">
        <svg className="size-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="font-semibold text-teal-950 text-base">Modul Riwayat Pemeriksaan</p>
        <p className="text-sm text-gray-500 mt-1">
          Halaman riwayat lengkap dengan filter pencarian dan telaah dokter akan diaktifkan pada langkah berikutnya.
        </p>
      </div>
    </main>
  );
}
