"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PETA from "../data/peta-pulau.json";

// Sumber garis pantai: Peta Dasar BAKOSURTANAL (batas provinsi lama), disederhanakan
// dan digabung menjadi lima kelompok pulau. Pulau kecil masuk ke kelompok terdekat.

const METRIK = {
  MERAH: { label: "Hasil MERAH", satuan: "MERAH" },
  total: { label: "Total pemeriksaan", satuan: "pemeriksaan" },
  persen: { label: "% MERAH", satuan: "% MERAH" },
};

// Skala berurutan satu warna (terang → gelap = sedikit → banyak).
const RAMP_TERANG = ["#FBE9E7", "#F2C4BF", "#E3958B", "#D45F52", "#C62828", "#8E1B1B"];

function hexKeRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function warnaRamp(ramp, t) {
  const x = Math.min(1, Math.max(0, t)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(x));
  const f = x - i;
  const a = hexKeRgb(ramp[i]);
  const b = hexKeRgb(ramp[i + 1]);
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

const PENUH = [0, 0, PETA.lebar, PETA.tinggi];

function kotakZoom(p) {
  // Tambah ruang di sekitar pulau dan pertahankan rasio peta.
  const [x, y, w, h] = p.kotak;
  const rasio = PETA.lebar / PETA.tinggi;
  let lw = w * 1.25;
  let lh = h * 1.25;
  if (lw / lh > rasio) lh = lw / rasio;
  else lw = lh * rasio;
  return [x + w / 2 - lw / 2, y + h / 2 - lh / 2, lw, lh];
}

function nilaiMetrik(r, metrik) {
  if (!r || !r.total) return 0;
  if (metrik === "persen") return (r.MERAH / r.total) * 100;
  return r[metrik] || 0;
}

function fmt(n, metrik) {
  if (metrik === "persen") return `${n.toFixed(1).replace(".", ",")}%`;
  return String(n);
}

export function ringkasPerPulau(perPuskesmas) {
  const hasil = {};
  for (const p of PETA.pulau) hasil[p.id] = { total: 0, MERAH: 0, KUNING: 0, HIJAU: 0, puskesmas: 0 };
  for (const r of perPuskesmas || []) {
    const g = hasil[r.pulau];
    if (!g) continue;
    g.total += r.total || 0;
    g.MERAH += r.MERAH || 0;
    g.KUNING += r.KUNING || 0;
    g.HIJAU += r.HIJAU || 0;
    g.puskesmas += 1;
  }
  return hasil;
}

export const NAMA_PULAU = Object.fromEntries(PETA.pulau.map((p) => [p.id, p.nama]));

export default function PetaPulau({ perPuskesmas, terpilih, onPilih }) {
  const [metrik, setMetrik] = useState("MERAH");
  const [vb, setVb] = useState(PENUH);
  const [hover, setHover] = useState(null); // { id, x, y }
  const wadah = useRef(null);
  const vbRef = useRef(PENUH);

  const perPulau = useMemo(() => ringkasPerPulau(perPuskesmas), [perPuskesmas]);
  const tanpaLokasi = useMemo(() => (perPuskesmas || []).filter((r) => !NAMA_PULAU[r.pulau]).length, [perPuskesmas]);
  const maks = useMemo(() => Math.max(0, ...PETA.pulau.map((p) => nilaiMetrik(perPulau[p.id], metrik))), [perPulau, metrik]);
  // Token warna aplikasi saat ini hanya untuk tema terang, jadi skala terang dipakai di semua tema.
  const ramp = RAMP_TERANG;

  // Animasi zoom ke pulau terpilih.
  useEffect(() => {
    const target = terpilih ? kotakZoom(PETA.pulau.find((p) => p.id === terpilih)) : PENUH;
    const awal = vbRef.current;
    const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (kurangiGerak) {
      vbRef.current = target;
      setVb(target);
      return;
    }
    const mulai = performance.now();
    const durasi = 650;
    let id;
    const langkah = (t) => {
      const p = Math.min(1, (t - mulai) / durasi);
      const e = 1 - Math.pow(1 - p, 3);
      const v = awal.map((a, i) => a + (target[i] - a) * e);
      vbRef.current = v;
      setVb(v);
      if (p < 1) id = requestAnimationFrame(langkah);
    };
    id = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(id);
  }, [terpilih]);

  const skala = vb[2] / PETA.lebar; // ukuran teks mengikuti zoom
  const hp = hover && perPulau[hover.id];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Ukuran pada peta" className="inline-flex rounded-[10px] border border-line bg-bg p-1 gap-1">
          {Object.entries(METRIK).map(([k, m]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={metrik === k}
              onClick={() => setMetrik(k)}
              className={`h-8 px-3 rounded-lg text-xs sm:text-sm font-bold font-atkinson transition-colors cursor-pointer ${
                metrik === k ? "bg-surface text-ink shadow-xs" : "text-muted hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {terpilih && (
          <button
            type="button"
            id="btn-kembali-indonesia"
            onClick={() => onPilih(null)}
            className="h-9 px-3 rounded-[10px] border border-primary text-primary text-sm font-bold font-atkinson hover:bg-status-info-bg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Seluruh Indonesia
          </button>
        )}
      </div>

      <div ref={wadah} className="relative w-full rounded-xl bg-bg border border-line overflow-hidden">
        <svg
          viewBox={vb.map((v) => v.toFixed(2)).join(" ")}
          className="w-full h-auto block"
          role="group"
          aria-label="Peta persebaran hasil triase per kelompok pulau"
          onMouseLeave={() => setHover(null)}
        >
          {PETA.pulau.map((p) => {
            const r = perPulau[p.id];
            const v = nilaiMetrik(r, metrik);
            const adaData = r && r.total > 0;
            const isi = adaData ? warnaRamp(ramp, maks > 0 ? v / maks : 0) : "var(--color-line)";
            const redup = terpilih && terpilih !== p.id;
            return (
              <path
                key={p.id}
                d={p.d}
                fill={isi}
                stroke="var(--color-surface)"
                strokeWidth={1.2 * skala}
                strokeLinejoin="round"
                opacity={redup ? 0.25 : 1}
                tabIndex={0}
                role="button"
                aria-label={`${p.nama}: ${r?.MERAH ?? 0} MERAH dari ${r?.total ?? 0} pemeriksaan. Tekan untuk memperbesar.`}
                aria-pressed={terpilih === p.id}
                className="cursor-pointer outline-none transition-opacity duration-300 focus-visible:[stroke:var(--color-ink)]"
                onClick={() => onPilih(terpilih === p.id ? null : p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPilih(terpilih === p.id ? null : p.id);
                  }
                }}
                onMouseMove={(e) => {
                  const k = wadah.current.getBoundingClientRect();
                  setHover({ id: p.id, x: e.clientX - k.left, y: e.clientY - k.top });
                }}
              />
            );
          })}

          {/* Label nama + nilai, dengan lingkar warna latar supaya terbaca di atas warna apa pun */}
          {PETA.pulau.map((p) => {
            if (terpilih && terpilih !== p.id) return null;
            const r = perPulau[p.id];
            const [tx, ty] = terpilih ? [p.kotak[0] + p.kotak[2] / 2, p.kotak[1] - 6 * skala] : p.titik;
            return (
              <g key={`l-${p.id}`} pointerEvents="none" style={{ paintOrder: "stroke" }}>
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  fontSize={13 * skala}
                  fontWeight="700"
                  className="font-atkinson"
                  fill="var(--color-ink)"
                  stroke="var(--color-surface)"
                  strokeWidth={3.5 * skala}
                  strokeLinejoin="round"
                >
                  {p.nama}
                </text>
                <text
                  x={tx}
                  y={ty + 15 * skala}
                  textAnchor="middle"
                  fontSize={12 * skala}
                  className="font-mono"
                  fill="var(--color-ink)"
                  stroke="var(--color-surface)"
                  strokeWidth={3.5 * skala}
                  strokeLinejoin="round"
                >
                  {r && r.total > 0 ? `${fmt(nilaiMetrik(r, metrik), metrik)} ${metrik === "persen" ? "" : METRIK[metrik].satuan}` : "belum ada data"}
                </text>
              </g>
            );
          })}
        </svg>

        {hover && hp && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-20 px-3 py-2 rounded-lg bg-ink text-surface text-xs font-atkinson shadow-lg whitespace-nowrap"
            style={{ left: Math.min(hover.x + 14, (wadah.current?.clientWidth || 0) - 190), top: hover.y + 14 }}
          >
            <div className="font-bold text-sm">{NAMA_PULAU[hover.id]}</div>
            <div className="mt-1 grid grid-cols-[auto_auto] gap-x-3 font-mono">
              <span>MERAH</span>
              <span className="text-right">{hp.MERAH}</span>
              <span>KUNING</span>
              <span className="text-right">{hp.KUNING}</span>
              <span>HIJAU</span>
              <span className="text-right">{hp.HIJAU}</span>
              <span>Total</span>
              <span className="text-right">{hp.total}</span>
              <span>Puskesmas</span>
              <span className="text-right">{hp.puskesmas}</span>
            </div>
            <div className="mt-1 opacity-80">{terpilih === hover.id ? "Klik untuk kembali" : "Klik untuk memperbesar"}</div>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-atkinson text-muted">
        <div className="flex items-center gap-2">
          <span>{METRIK[metrik].label}:</span>
          <span className="font-mono text-ink">0</span>
          <span
            className="h-2.5 w-36 rounded-full border border-line"
            style={{ background: `linear-gradient(to right, ${ramp.join(", ")})` }}
            aria-hidden="true"
          />
          <span className="font-mono text-ink">{fmt(maks, metrik)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-line" style={{ background: "var(--color-line)" }} aria-hidden="true" />
          <span>Belum ada data</span>
        </div>
        {tanpaLokasi > 0 && <span>{tanpaLokasi} Puskesmas tanpa data lokasi tidak tampil di peta</span>}
      </div>
    </div>
  );
}
