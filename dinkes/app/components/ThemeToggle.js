"use client";

import { useState, useEffect, useRef } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("system");
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Load initial theme from localStorage safely
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      } else {
        setTheme("system");
        document.documentElement.setAttribute("data-theme", "system");
      }
    } catch {
      // Fallback if localStorage is inaccessible
      setTheme("system");
    }
  }, []);

  // Close dropdown on click outside or Esc
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function pilihTema(key) {
    setTheme(key);
    setIsOpen(false);
    try {
      localStorage.setItem("theme", key);
      document.documentElement.setAttribute("data-theme", key);
    } catch {
      // Ignore if localStorage unavailable
    }
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        id="btn-theme-toggle"
        type="button"
        aria-label="Pilihan tema"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="size-10 rounded-[10px] bg-surface border border-line flex items-center justify-center text-muted hover:text-ink hover:bg-bg transition-colors cursor-pointer shadow-xs"
        title="Pilihan tema"
      >
        <svg
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="btn-theme-toggle"
          className="absolute right-0 mt-2 w-44 rounded-xl bg-surface border border-line shadow-glass py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1 text-[11px] font-bold text-muted uppercase tracking-wider font-atkinson border-b border-line mb-1">
            Pilihan Tema
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => pilihTema("light")}
            className={`w-full text-left px-3.5 py-2 text-sm font-atkinson flex items-center justify-between cursor-pointer transition-colors ${
              theme === "light"
                ? "bg-status-info-bg text-primary font-bold"
                : "text-ink hover:bg-bg"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="size-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
              <span>Terang</span>
            </span>
            {theme === "light" && (
              <svg className="size-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => pilihTema("dark")}
            className={`w-full text-left px-3.5 py-2 text-sm font-atkinson flex items-center justify-between cursor-pointer transition-colors ${
              theme === "dark"
                ? "bg-status-info-bg text-primary font-bold"
                : "text-ink hover:bg-bg"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="size-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
              <span>Gelap</span>
            </span>
            {theme === "dark" && (
              <svg className="size-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => pilihTema("system")}
            className={`w-full text-left px-3.5 py-2 text-sm font-atkinson flex items-center justify-between cursor-pointer transition-colors ${
              theme === "system"
                ? "bg-status-info-bg text-primary font-bold"
                : "text-ink hover:bg-bg"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="size-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Ikuti sistem</span>
            </span>
            {theme === "system" && (
              <svg className="size-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
