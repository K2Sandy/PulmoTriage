"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { API } from "../utils/api";

const LisensiContext = createContext(null);

// Status dari backend: belum_ada | tidak_valid | belum_berlaku | aktif | masa_tenggang | kedaluwarsa
export function LisensiProvider({ children }) {
  const [lisensi, setLisensi] = useState(null);
  const [memeriksa, setMemeriksa] = useState(true);
  const [gagal, setGagal] = useState(false);

  const muatUlang = useCallback(async () => {
    try {
      const r = await fetch(`${API}/lisensi`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setLisensi(data);
      setGagal(false);
      return data;
    } catch {
      // Backend belum menyala: biarkan halaman menampilkan pesan error-nya sendiri.
      setGagal(true);
      return null;
    } finally {
      setMemeriksa(false);
    }
  }, []);

  useEffect(() => {
    muatUlang();
  }, [muatUlang]);

  const perluAktivasi = !!lisensi && !lisensi.boleh_periksa;

  return (
    <LisensiContext.Provider value={{ lisensi, gagal, memeriksa, muatUlang, perluAktivasi }}>
      {children}
    </LisensiContext.Provider>
  );
}

// Membungkus isi halaman: bila lisensi belum aktif, pengguna diarahkan ke /aktivasi.
export function LisensiGate({ children }) {
  const { memeriksa, perluAktivasi } = useLisensi();
  const pathname = usePathname();
  const router = useRouter();
  const diHalamanAktivasi = pathname?.startsWith("/aktivasi");

  useEffect(() => {
    if (perluAktivasi && !diHalamanAktivasi) router.replace("/aktivasi/");
  }, [perluAktivasi, diHalamanAktivasi, router]);

  // Jangan tampilkan wizard sekejap sebelum dialihkan ke halaman aktivasi.
  if (memeriksa || (perluAktivasi && !diHalamanAktivasi)) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 text-muted text-sm font-atkinson" aria-live="polite">
        Memeriksa lisensi...
      </div>
    );
  }
  return children;
}

export function useLisensi() {
  const ctx = useContext(LisensiContext);
  if (!ctx) throw new Error("useLisensi harus digunakan di dalam LisensiProvider");
  return ctx;
}
