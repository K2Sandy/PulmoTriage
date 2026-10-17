"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SyncContext = createContext(null);

export function SyncProvider({ children }) {
  const [menunggu, setMenunggu] = useState(null);
  const [statusSync, setStatusSync] = useState("idle"); // "idle" | "syncing"
  const [sinkronTerakhir, setSinkronTerakhir] = useState("15 Okt 2026");
  const [toast, setToast] = useState(null); // { id, pesan, tipe: "success" | "offline" | "rejected" }

  const cekSinkron = useCallback(() => {
    fetch(`${API}/sinkron/status`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        setMenunggu(d.menunggu);
      })
      .catch(() => {
        // Backend offline
      });
  }, []);

  useEffect(() => {
    cekSinkron();
  }, [cekSinkron]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const tutupToast = useCallback(() => {
    setToast(null);
  }, []);

  const sinkronSekarang = useCallback(async () => {
    if (statusSync === "syncing") return;
    setStatusSync("syncing");

    try {
      const res = await fetch(`${API}/sinkron`, { method: "POST" });
      const data = await res.json();

      if (data.status === "ok") {
        setMenunggu(data.menunggu ?? 0);
        setSinkronTerakhir("Baru saja");
        setToast({
          id: Date.now(),
          pesan: `Terkirim ${data.terkirim} data.`,
          tipe: "success",
        });
      } else if (data.status === "offline") {
        setMenunggu(data.menunggu);
        setToast({
          id: Date.now(),
          pesan: "Belum ada koneksi. Data tetap aman di komputer ini.",
          tipe: "offline",
        });
      } else if (data.status === "ditolak") {
        setMenunggu(data.menunggu);
        setToast({
          id: Date.now(),
          pesan: "Ditolak oleh server cloud.",
          tipe: "rejected",
        });
      } else {
        setToast({
          id: Date.now(),
          pesan: "Ditolak oleh server cloud.",
          tipe: "rejected",
        });
      }
    } catch {
      // Backend error or offline
      setToast({
        id: Date.now(),
        pesan: "Belum ada koneksi. Data tetap aman di komputer ini.",
        tipe: "offline",
      });
    } finally {
      setStatusSync("idle");
      cekSinkron();
    }
  }, [statusSync, cekSinkron]);

  return (
    <SyncContext.Provider
      value={{
        menunggu,
        statusSync,
        sinkronTerakhir,
        sinkronSekarang,
        cekSinkron,
        toast,
        tutupToast,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync harus digunakan di dalam SyncProvider");
  return ctx;
}
