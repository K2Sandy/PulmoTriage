"use client";

import { useUnduh } from "./UnduhContext";

export default function Header() {
  const { url } = useUnduh();
  return (
    <header className="sticky top-0 z-40 w-full bg-surface/95 backdrop-blur-md border-b border-line">
      <div className="w-full max-w-[1200px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
        <a href="#" className="flex items-center gap-2.5 shrink-0 no-underline">
          <img src="/logo.png" alt="" width={32} height={32} className="size-8 rounded-lg object-contain" />
          <span className="text-ink text-xl font-semibold font-fraunces tracking-tight">PulmoTriage</span>
        </a>
        <nav aria-label="Navigasi" className="hidden md:flex items-center gap-1 text-sm font-bold">
          <a href="#tentang" className="px-3 h-10 inline-flex items-center rounded-[10px] text-muted hover:text-ink hover:bg-bg">
            Tentang
          </a>
          <a href="#data" className="px-3 h-10 inline-flex items-center rounded-[10px] text-muted hover:text-ink hover:bg-bg">
            Data persebaran
          </a>
          <a href="#unduh" className="px-3 h-10 inline-flex items-center rounded-[10px] text-muted hover:text-ink hover:bg-bg">
            Unduh
          </a>
        </nav>
        <a
          href={url}
          id="btn-unduh-header"
          className="h-10 px-4 rounded-[10px] bg-primary text-on-primary text-sm font-bold inline-flex items-center gap-2 hover:brightness-105 shrink-0"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Unduh aplikasi</span>
        </a>
      </div>
    </header>
  );
}
