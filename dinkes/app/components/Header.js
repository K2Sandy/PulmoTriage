"use client";

import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-surface/95 backdrop-blur-md border-b border-line">
      <div className="w-full max-w-[1366px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <img
            src="/logo.png"
            alt="PulmoTriage"
            width={32}
            height={32}
            className="size-8 rounded-lg shrink-0 object-contain shadow-xs"
          />
          <span className="text-ink text-xl font-semibold font-fraunces tracking-tight">PulmoTriage</span>
          <div className="h-4 w-px bg-line mx-1.5 sm:mx-2" />
          <span className="text-muted text-xs sm:text-sm font-normal font-atkinson">Dasbor Dinas Kesehatan</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
