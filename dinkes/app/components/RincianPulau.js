"use client";

import { NAMA_PULAU, ringkasPerPulau } from "./PetaPulau";

function persen(a, b) {
  return b ? `${((a / b) * 100).toFixed(1).replace(".", ",")}%` : "0,0%";
}

function Angka({ label, nilai, kelas }) {
  return (
    <div className="flex flex-col">
      <span className={`text-[11px] font-bold uppercase tracking-wide ${kelas || "text-muted"}`}>{label}</span>
      <span className="text-ink text-xl font-semibold font-fraunces leading-tight">{nilai}</span>
    </div>
  );
}

// Panel di samping peta: peringkat pulau, atau rincian provinsi → kab/kota → Puskesmas saat pulau dipilih.
export default function RincianPulau({ perPuskesmas, terpilih, onPilih }) {
  const perPulau = ringkasPerPulau(perPuskesmas);

  if (!terpilih) {
    const urut = Object.entries(perPulau).sort((a, b) => b[1].MERAH - a[1].MERAH || b[1].total - a[1].total);
    const maks = Math.max(1, ...urut.map(([, r]) => r.MERAH));
    return (
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-base font-bold text-ink">Per kelompok pulau</h3>
          <p className="text-xs text-muted">Klik pulau di peta atau di daftar ini untuk melihat rincian.</p>
        </div>
        <ul className="flex flex-col gap-1">
          {urut.map(([id, r]) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onPilih(id)}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-bg transition-colors cursor-pointer flex flex-col gap-1"
              >
                <span className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">{NAMA_PULAU[id]}</span>
                  <span className="font-mono text-ink">
                    {r.MERAH} <span className="text-muted">/ {r.total}</span>
                  </span>
                </span>
                <span className="h-1.5 w-full bg-line rounded-full overflow-hidden" aria-hidden="true">
                  <span className="block h-full bg-triage-merah rounded-full" style={{ width: `${(r.MERAH / maks) * 100}%` }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-muted">Angka: hasil MERAH / total pemeriksaan.</p>
      </div>
    );
  }

  const r = perPulau[terpilih];
  const daftar = (perPuskesmas || []).filter((p) => p.pulau === terpilih);
  // Kelompokkan: provinsi → kab/kota → Puskesmas
  const prov = {};
  for (const p of daftar) {
    const kp = p.provinsi || "Provinsi belum tercatat";
    const kk = p.kab_kota || "Kab/kota belum tercatat";
    prov[kp] ??= { MERAH: 0, total: 0, kab: {} };
    prov[kp].MERAH += p.MERAH;
    prov[kp].total += p.total;
    prov[kp].kab[kk] ??= [];
    prov[kp].kab[kk].push(p);
  }
  const urutProv = Object.entries(prov).sort((a, b) => b[1].MERAH - a[1].MERAH || b[1].total - a[1].total);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-bold text-ink">{NAMA_PULAU[terpilih]}</h3>
        <p className="text-xs text-muted">{r.puskesmas} Puskesmas mengirim data</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Angka label="Total" nilai={r.total} />
        <Angka label="Merah" nilai={r.MERAH} kelas="text-text-merah" />
        <Angka label="Kuning" nilai={r.KUNING} kelas="text-text-kuning" />
        <Angka label="Hijau" nilai={r.HIJAU} kelas="text-text-hijau" />
      </div>
      <p className="text-xs text-muted -mt-1">{persen(r.MERAH, r.total)} pemeriksaan berkategori MERAH.</p>

      {urutProv.length === 0 ? (
        <p className="text-sm text-muted">Belum ada Puskesmas di kelompok pulau ini yang mengirim data.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
          {urutProv.map(([namaProv, dp], i) => (
            <details key={namaProv} open={i === 0} className="rounded-lg border border-line bg-surface">
              <summary className="px-3 py-2 cursor-pointer flex items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-ink">{namaProv}</span>
                <span className="font-mono text-xs text-ink">
                  <span className="text-text-merah">{dp.MERAH}</span> / {dp.total}
                </span>
              </summary>
              <div className="px-3 pb-2 flex flex-col gap-2">
                {Object.entries(dp.kab).map(([namaKab, pkm]) => (
                  <div key={namaKab}>
                    <div className="text-xs font-bold text-muted uppercase tracking-wide">{namaKab}</div>
                    <ul className="mt-1 flex flex-col gap-0.5">
                      {pkm.map((p) => (
                        <li key={p.puskesmas_id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-ink truncate">
                            <span className="font-mono text-xs text-muted mr-1.5">{p.puskesmas_id}</span>
                            {p.nama || p.puskesmas_id}
                          </span>
                          <span className="font-mono text-xs shrink-0">
                            <span className="text-text-merah">{p.MERAH}</span> / {p.total}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
