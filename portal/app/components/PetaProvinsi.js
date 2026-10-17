"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PETA from "../data/peta-provinsi.json";

// Batas provinsi: Natural Earth (domain publik), 33 provinsi, disederhanakan.
// Provinsi hasil pemekaran digambar di wilayah induknya (lihat cloud/wilayah.py).

export const METRIK = {
  MERAH: { label: "Hasil MERAH", ramp: "merah" },
  persen: { label: "% MERAH", ramp: "merah" },
  total: { label: "Total pemeriksaan", ramp: "teal" },
};

// Skala berurutan satu warna, 7 langkah dari terang (sedikit) ke gelap (banyak).
const RAMP = {
  merah: ["#FDF0EE", "#F8D3CE", "#EFA99F", "#E27B6F", "#D24E43", "#B32B24", "#7F1714"],
  teal: ["#EEF7F7", "#CBE8E9", "#9DD2D5", "#64B5BB", "#2E949C", "#0B7A85", "#06525A"],
};

function hexKeRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function warnaRamp(ramp, t) {
  const x = Math.min(1, Math.max(0, t)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(x));
  const f = x - i;
  const a = hexKeRgb(ramp[i]);
  const b = hexKeRgb(ramp[i + 1]);
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function nilai(r, metrik) {
  if (!r || r.disamarkan || !r.total) return null;
  if (metrik === "persen") return (r.MERAH / r.total) * 100;
  return r[metrik] ?? null;
}

export function fmt(n, metrik) {
  if (n == null) return "-";
  if (metrik === "persen") return `${n.toFixed(1).replace(".", ",")}%`;
  return n.toLocaleString("id-ID");
}

const PENUH = [0, 0, PETA.lebar, PETA.tinggi];

function kotakZoom(p) {
  const [x, y, w0, h0] = p.kotak;
  const rasio = PETA.lebar / PETA.tinggi;
  // Provinsi kecil (misalnya DKI Jakarta) tetap diperbesar secukupnya agar konteksnya terlihat.
  let w = Math.max(w0 * 1.6, 120);
  let h = Math.max(h0 * 1.6, 48);
  if (w / h > rasio) h = w / rasio;
  else w = h * rasio;
  return [x + w0 / 2 - w / 2, y + h0 / 2 - h / 2, w, h];
}

export default function PetaProvinsi({ perProvinsi, terpilih, onPilih, metrik, onMetrik }) {
  const [vb, setVb] = useState(PENUH);
  const [hover, setHover] = useState(null);
  const wadah = useRef(null);
  const vbRef = useRef(PENUH);

  const data = useMemo(() => Object.fromEntries((perProvinsi || []).map((r) => [r.iso, r])), [perProvinsi]);
  const maks = useMemo(() => Math.max(0, ...(perProvinsi || []).map((r) => nilai(r, metrik) ?? 0)), [perProvinsi, metrik]);
  const ramp = RAMP[METRIK[metrik].ramp];

  useEffect(() => {
    const p = PETA.provinsi.find((x) => x.iso === terpilih);
    const target = p ? kotakZoom(p) : PENUH;
    const awal = vbRef.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      vbRef.current = target;
      setVb(target);
      return;
    }
    const mulai = performance.now();
    let id;
    const langkah = (t) => {
      const k = Math.min(1, (t - mulai) / 650);
      const e = 1 - Math.pow(1 - k, 3);
      const v = awal.map((a, i) => a + (target[i] - a) * e);
      vbRef.current = v;
      setVb(v);
      if (k < 1) id = requestAnimationFrame(langkah);
    };
    id = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(id);
  }, [terpilih]);

  const skala = vb[2] / PETA.lebar;
  const hd = hover && data[hover.iso];

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
              onClick={() => onMetrik(k)}
              className={`h-8 px-3 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
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
            className="h-9 px-3 rounded-[10px] border border-primary text-primary text-sm font-bold hover:bg-status-info-bg inline-flex items-center gap-1.5 cursor-pointer"
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
          aria-label="Peta persebaran hasil triase per provinsi"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <pattern id="arsir" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--color-line)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-line-strong)" strokeWidth="1.2" />
            </pattern>
          </defs>
          {PETA.provinsi.map((p) => {
            const r = data[p.iso];
            const v = nilai(r, metrik);
            let isi = "var(--color-line)";
            if (r && r.disamarkan) isi = "url(#arsir)";
            else if (v != null) isi = warnaRamp(ramp, maks > 0 ? v / maks : 0);
            const redup = terpilih && terpilih !== p.iso;
            const label = r
              ? r.disamarkan
                ? `${r.provinsi}: data belum cukup untuk dirinci`
                : `${r.provinsi}: ${r.MERAH} MERAH dari ${r.total} pemeriksaan`
              : "Belum ada data";
            return (
              <path
                key={p.iso}
                d={p.d}
                fill={isi}
                stroke="var(--color-surface)"
                strokeWidth={0.8 * skala}
                strokeLinejoin="round"
                opacity={redup ? 0.3 : 1}
                tabIndex={0}
                role="button"
                aria-label={`${label}. Tekan untuk memperbesar.`}
                aria-pressed={terpilih === p.iso}
                className="cursor-pointer outline-none transition-opacity duration-300 hover:brightness-95"
                onClick={() => onPilih(terpilih === p.iso ? null : p.iso)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPilih(terpilih === p.iso ? null : p.iso);
                  }
                }}
                onMouseMove={(e) => {
                  const k = wadah.current.getBoundingClientRect();
                  setHover({ iso: p.iso, x: e.clientX - k.left, y: e.clientY - k.top });
                }}
              />
            );
          })}
          {/* garis tebal untuk provinsi terpilih */}
          {terpilih &&
            PETA.provinsi
              .filter((p) => p.iso === terpilih)
              .map((p) => (
                <path key="sorot" d={p.d} fill="none" stroke="var(--color-ink)" strokeWidth={1.6 * skala} pointerEvents="none" />
              ))}
        </svg>

        {hover && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-20 px-3 py-2 rounded-lg bg-ink text-surface text-xs shadow-lg whitespace-nowrap"
            style={{ left: Math.min(hover.x + 14, (wadah.current?.clientWidth || 0) - 200), top: hover.y + 14 }}
          >
            {hd ? (
              <>
                <div className="font-bold text-sm">{hd.provinsi}</div>
                {hd.disamarkan ? (
                  <div className="mt-1">{hd.total} pemeriksaan, data belum cukup untuk dirinci</div>
                ) : (
                  <div className="mt-1 grid grid-cols-[auto_auto] gap-x-3 font-mono">
                    <span>MERAH</span>
                    <span className="text-right">{hd.MERAH}</span>
                    <span>KUNING</span>
                    <span className="text-right">{hd.KUNING}</span>
                    <span>HIJAU</span>
                    <span className="text-right">{hd.HIJAU}</span>
                    <span>Total</span>
                    <span className="text-right">{hd.total}</span>
                  </div>
                )}
              </>
            ) : (
              <div>Belum ada data dari provinsi ini</div>
            )}
          </div>
        )}
      </div>

      {/* Legenda gradasi */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span>{METRIK[metrik].label}:</span>
          <span className="font-mono text-ink">0</span>
          <span
            className="h-3 w-44 rounded-full border border-line"
            style={{ background: `linear-gradient(to right, ${ramp.join(", ")})` }}
            aria-hidden="true"
          />
          <span className="font-mono text-ink">{fmt(maks, metrik)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="size-3.5 rounded-sm border border-line" aria-hidden="true">
            <rect width="100%" height="100%" fill="url(#arsir)" />
          </svg>
          <span>Data belum cukup untuk dirinci</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3.5 rounded-sm border border-line" style={{ background: "var(--color-line)" }} aria-hidden="true" />
          <span>Belum ada data</span>
        </div>
      </div>
    </div>
  );
}
