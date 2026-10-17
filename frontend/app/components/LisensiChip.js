"use client";

import Link from "next/link";
import { useLisensi } from "../context/LisensiContext";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function formatTanggal(iso) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${parseInt(d, 10)} ${BULAN[parseInt(m, 10) - 1] || m} ${y}`;
}

// Penanda kecil di header: nama Puskesmas dan masa berlaku lisensi. Klik untuk membuka halaman lisensi.
export default function LisensiChip() {
  const { lisensi } = useLisensi();
  if (!lisensi || !lisensi.wajib) return null;

  const s = lisensi.status;
  // Saat lisensi aktif dan masih lama, nama Puskesmas sudah tampil di header; chip hanya muncul bila perlu perhatian.
  if (s === "aktif" && lisensi.sisa_hari > 30) return null;
  let gaya = "border-line-strong text-ink";
  let teks = "Lisensi belum aktif";
  if (s === "aktif") {
    const segera = lisensi.sisa_hari <= 30;
    gaya = segera ? "border-triage-kuning text-text-kuning" : "border-line text-ink";
    teks = segera ? `Berakhir ${lisensi.sisa_hari} hari lagi` : `s.d. ${formatTanggal(lisensi.berlaku_sampai)}`;
  } else if (s === "masa_tenggang") {
    gaya = "border-triage-kuning text-text-kuning";
    teks = `Masa tenggang · ${lisensi.sisa_hari} hari`;
  } else if (s === "kedaluwarsa") {
    gaya = "border-triage-merah text-text-merah";
    teks = "Lisensi berakhir";
  }

  return (
    <Link
      href="/aktivasi/"
      id="chip-lisensi"
      title="Lihat atau ganti lisensi"
      className={`hidden md:flex h-10 px-3 rounded-[10px] border bg-surface hover:bg-bg items-center gap-2 text-xs font-atkinson transition-colors ${gaya}`}
    >
      <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <span className="flex flex-col leading-tight text-left">
        <span>{teks}</span>
      </span>
    </Link>
  );
}
