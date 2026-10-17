"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SyncBar from "./SyncBar";

export default function Header() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const isRiwayat = pathname.startsWith("/riwayat");
  const isPemeriksaan = !isDashboard && !isRiwayat;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="w-full max-w-[1366px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Brand Group */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Logo icon */}
          <Link href="/" className="flex items-center gap-2.5 text-inherit no-underline">
            <div className="size-8 rounded-lg bg-cyan-700 flex items-center justify-center shrink-0 shadow-xs">
              <svg className="size-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                {/* Stylized lungs / cross icon */}
                <path d="M12 4.5v15M9 7.5C6.5 8 5 10.5 5 13.5c0 3.5 2 6 4 6M15 7.5c2.5.5 4 3 4 6 0 3.5-2 6-4 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              </svg>
            </div>

            {/* Title */}
            <span className="text-teal-950 text-xl font-semibold font-fraunces tracking-tight">
              PulmoTriage
            </span>
          </Link>

          {/* Subtitle / Mode separator */}
          <div className="pl-3 border-l border-zinc-200 flex items-center gap-2">
            <span id="header-subtitle" className="text-gray-500 text-xs sm:text-sm font-normal font-atkinson">
              {isDashboard ? "Dasbor Dinas Kesehatan" : "Alat bantu triase TBC"}
            </span>

            {!isDashboard && (
              <span className="hidden lg:inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-medium font-atkinson border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-600"></span>
                Mode luring · data tersimpan lokal
              </span>
            )}
          </div>
        </div>

        {/* Center Navigation Tabs (Only on Puskesmas pages) */}
        {!isDashboard && (
          <nav aria-label="Navigasi Utama" className="flex items-center gap-1 shrink-0">
            {/* Tab Pemeriksaan Baru */}
            <Link
              href="/"
              className={`h-10 px-3.5 rounded-[10px] flex items-center gap-1.5 text-sm font-bold font-atkinson transition-all ${
                isPemeriksaan
                  ? "bg-cyan-50 text-cyan-700 shadow-xs"
                  : "text-gray-600 hover:text-teal-950 hover:bg-gray-50"
              }`}
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Pemeriksaan baru</span>
            </Link>

            {/* Tab Riwayat */}
            <Link
              href="/riwayat"
              className={`h-10 px-3.5 rounded-[10px] flex items-center gap-1.5 text-sm font-bold font-atkinson transition-all ${
                isRiwayat
                  ? "bg-cyan-50 text-cyan-700 shadow-xs"
                  : "text-gray-600 hover:text-teal-950 hover:bg-gray-50"
              }`}
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Riwayat</span>
            </Link>

            {/* Quick link to Dashboard */}
            <Link
              href="/dashboard"
              className="hidden md:flex h-10 px-3 rounded-[10px] items-center gap-1 text-xs text-gray-500 hover:text-cyan-700 font-atkinson hover:bg-gray-50"
              title="Buka Dasbor Dinkes"
            >
              <span>Dasbor</span>
              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </nav>
        )}

        {/* Right side: Sync Bar (Hidden on Dashboard) */}
        <div className="shrink-0 flex items-center">
          {!isDashboard ? (
            <SyncBar />
          ) : (
            <Link
              href="/"
              className="h-9 px-3 rounded-[10px] border border-cyan-700 text-cyan-700 text-xs sm:text-sm font-bold font-atkinson hover:bg-cyan-50 flex items-center gap-1.5 transition-colors"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Kembali ke Puskesmas</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
