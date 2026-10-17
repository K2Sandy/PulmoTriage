"use client";

import { useSync } from "../context/SyncContext";

export default function Toast() {
  const { toast, tutupToast } = useSync();

  if (!toast) return null;

  return (
    <aside
      id="toast-notification"
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] px-4 py-3.5 bg-surface/95 backdrop-blur-md rounded-xl shadow-[0px_12px_32px_0px_rgba(16,41,44,0.16)] border border-line flex items-center gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
    >
      {/* Icon based on type */}
      <div className="shrink-0 flex items-center justify-center">
        {toast.tipe === "success" && (
          <div className="size-6 rounded-full bg-status-info-bg flex items-center justify-center text-primary">
            <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}

        {toast.tipe === "offline" && (
          <div className="size-6 rounded-full bg-status-neutral flex items-center justify-center text-text-kuning">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"
              />
              <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {toast.tipe === "rejected" && (
          <div className="size-6 rounded-full bg-status-error-bg flex items-center justify-center text-status-error">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Message content */}
      <div id="toast-message" className="flex-1 text-ink text-sm font-normal leading-tight font-atkinson">
        {toast.pesan}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={tutupToast}
        aria-label="Tutup notifikasi"
        className="shrink-0 size-6 flex items-center justify-center text-muted hover:text-ink rounded-md transition-colors cursor-pointer"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </aside>
  );
}
