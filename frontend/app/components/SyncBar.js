"use client";

import { useSync } from "../context/SyncContext";

export default function SyncBar() {
  const { menunggu, statusSync, sinkronTerakhir, sinkronSekarang } = useSync();

  const isSyncing = statusSync === "syncing";
  const jumlahMenunggu = menunggu ?? 0;
  const isSemuaTersinkron = !isSyncing && jumlahMenunggu === 0;

  return (
    <div
      role="region"
      aria-label="Status sinkronisasi cloud"
      className="h-12 pl-3.5 pr-2 bg-white rounded-full border border-zinc-200 shadow-sm inline-flex items-center gap-3 shrink-0"
    >
      {/* Icon */}
      <div className="size-5 shrink-0 flex items-center justify-center text-gray-500">
        {isSyncing ? (
          <svg className="size-4 animate-spin text-cyan-700" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : isSemuaTersinkron ? (
          <svg className="size-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="size-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"
            />
          </svg>
        )}
      </div>

      {/* Label and Last Sync info */}
      <div className="flex flex-col justify-center">
        <div className="text-teal-950 text-xs sm:text-sm font-bold leading-tight font-atkinson">
          {isSyncing
            ? "Menyinkronkan ke cloud..."
            : isSemuaTersinkron
            ? "Semua data tersinkron"
            : `Menunggu sinkron ke cloud: ${jumlahMenunggu}`}
        </div>
        <div className="text-gray-500 text-[11px] leading-tight font-atkinson">
          {isSyncing ? "Mohon tunggu sejenak..." : `Sinkron terakhir: ${sinkronTerakhir}`}
        </div>
      </div>

      {/* Action Button */}
      <button
        id="btn-sync-now"
        type="button"
        onClick={sinkronSekarang}
        disabled={isSyncing}
        className={`h-8 px-3 rounded-[10px] text-xs sm:text-sm font-bold font-atkinson transition-all flex items-center gap-1.5 ${
          isSyncing
            ? "bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed"
            : "bg-white border border-cyan-700 text-cyan-700 hover:bg-cyan-50 cursor-pointer shadow-xs active:scale-[0.98]"
        }`}
      >
        {isSyncing ? (
          <>
            <svg className="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Menyinkronkan...</span>
          </>
        ) : (
          <>
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Sinkronkan sekarang</span>
          </>
        )}
      </button>
    </div>
  );
}
