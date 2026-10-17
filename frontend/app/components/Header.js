"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SyncBar from "./SyncBar";
import ThemeToggle from "./ThemeToggle";
import LisensiChip from "./LisensiChip";
import { useLisensi } from "../context/LisensiContext";

export default function Header() {
  const pathname = usePathname();
  const { lisensi, perluAktivasi } = useLisensi();
  const isRiwayat = pathname.startsWith("/riwayat");
  const isAktivasi = pathname.startsWith("/aktivasi");
  const isPemeriksaan = !isRiwayat && !isAktivasi;
  // Sebelum lisensi aktif, navigasi dan sinkron disembunyikan.
  const tampilkanMenu = !perluAktivasi;

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/95 backdrop-blur-md border-b border-line">
      <div className="w-full max-w-[1366px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Brand Group + Nav Tabs (Attached with ~14px gap) */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Logo icon + brand name */}
            <Link href="/" className="flex items-center gap-2 text-inherit no-underline">
              <img
                src="/logo.png"
                alt="PulmoTriage"
                width={32}
                height={32}
                className="size-8 rounded-lg shrink-0 object-contain shadow-xs"
              />
              <span className="text-ink text-xl font-semibold font-fraunces tracking-tight">
                PulmoTriage
              </span>
            </Link>

            {/* Subtitle separator */}
            <div className="h-4 w-px bg-line mx-1.5 sm:mx-2" />
            <span id="header-subtitle" className="text-muted text-xs sm:text-sm font-normal font-atkinson">
              {lisensi?.boleh_periksa && lisensi?.nama ? lisensi.nama : "Alat bantu triase TBC"}
            </span>
          </div>

          {/* Navigation Tabs (Attached after subtitle with ~14px gap) */}
          {tampilkanMenu && (
            <nav aria-label="Navigasi Utama" className="flex items-center gap-1.5 shrink-0 ml-0.5">
              {/* Tab Pemeriksaan Baru */}
              <Link
                href="/"
                className={`h-10 px-3.5 rounded-[10px] flex items-center gap-1.5 text-sm font-bold font-atkinson transition-all ${
                  isPemeriksaan
                    ? "bg-status-info-bg text-primary shadow-xs"
                    : "text-muted hover:text-ink hover:bg-bg"
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
                    ? "bg-status-info-bg text-primary shadow-xs"
                    : "text-muted hover:text-ink hover:bg-bg"
                }`}
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Riwayat</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Right side: Sync Bar + Theme Toggle (Note: Tombol "ID" sengaja tidak ditampilkan sesuai aturan) */}
        <div className="shrink-0 flex items-center gap-2">
          {tampilkanMenu && <SyncBar />}
          <LisensiChip />

          <ThemeToggle />

          {/* Tombol Bahasa ID */}
          <button
            type="button"
            id="btn-language-toggle"
            aria-label="Pilihan bahasa: Indonesia"
            className="h-10 px-3 rounded-[10px] border border-line-strong hover:bg-bg text-ink flex items-center gap-1.5 text-xs font-bold font-atkinson transition-colors cursor-pointer"
          >
            <svg className="size-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>ID</span>
          </button>
        </div>
      </div>
    </header>
  );
}
