"use client";

function persen(a, b) {
  return b ? `${((a / b) * 100).toFixed(1).replace(".", ",")}%` : "0,0%";
}

function Batang({ label, nilai, total, warna, kelas }) {
  const lebar = total ? (nilai / total) * 100 : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-bold ${kelas}`}>{label}</span>
        <span className="font-mono text-ink">
          {nilai} <span className="text-muted">({persen(nilai, total)})</span>
        </span>
      </div>
      <div className="h-2 w-full bg-line rounded-full overflow-hidden" aria-hidden="true">
        <div className={`h-full rounded-full ${warna}`} style={{ width: `${lebar}%` }} />
      </div>
    </div>
  );
}

// Panel di samping peta: peringkat provinsi, atau rincian satu provinsi saat dipilih.
export default function RincianProvinsi({ perProvinsi, terpilih, onPilih, batas }) {
  const daftar = [...(perProvinsi || [])].sort((a, b) => (b.MERAH ?? -1) - (a.MERAH ?? -1) || b.total - a.total);

  if (!terpilih) {
    const maks = Math.max(1, ...daftar.map((r) => r.MERAH ?? 0));
    return (
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-base font-bold text-ink">Provinsi dengan hasil MERAH terbanyak</h3>
          <p className="text-xs text-muted">Klik provinsi di peta atau di daftar ini untuk melihat rincian.</p>
        </div>
        <ul className="flex flex-col gap-0.5 max-h-[340px] overflow-y-auto pr-1">
          {daftar.map((r) => (
            <li key={r.iso}>
              <button
                type="button"
                onClick={() => onPilih(r.iso)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-bg transition-colors cursor-pointer flex flex-col gap-1"
              >
                <span className="flex items-center justify-between text-sm gap-2">
                  <span className="font-semibold text-ink truncate">{r.provinsi}</span>
                  <span className="font-mono text-ink shrink-0">
                    {r.disamarkan ? <span className="text-xs text-muted">belum cukup</span> : r.MERAH}
                    <span className="text-muted"> / {r.total}</span>
                  </span>
                </span>
                <span className="h-1.5 w-full bg-line rounded-full overflow-hidden" aria-hidden="true">
                  <span className="block h-full bg-triage-merah rounded-full" style={{ width: `${((r.MERAH ?? 0) / maks) * 100}%` }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-muted">Angka: hasil MERAH / total pemeriksaan.</p>
      </div>
    );
  }

  const r = daftar.find((x) => x.iso === terpilih);
  if (!r) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-bold text-ink">Belum ada data</h3>
        <p className="text-sm text-muted">Belum ada Puskesmas pengguna PulmoTriage di provinsi ini yang mengirim data.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-bold text-ink">{r.provinsi}</h3>
        <p className="text-xs text-muted">
          {r.puskesmas} Puskesmas · {r.total} pemeriksaan
        </p>
      </div>
      {r.disamarkan ? (
        <p className="text-sm text-ink bg-bg border border-line rounded-[10px] px-3 py-2">
          Pemeriksaan di provinsi ini masih kurang dari {batas}, jadi rinciannya tidak ditampilkan untuk melindungi
          kelompok kecil.
        </p>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold font-fraunces text-ink">{persen(r.MERAH, r.total)}</span>
            <span className="text-sm text-muted">pemeriksaan berkategori MERAH</span>
          </div>
          <div className="flex flex-col gap-3">
            <Batang label="MERAH" nilai={r.MERAH} total={r.total} warna="bg-triage-merah" kelas="text-text-merah" />
            <Batang label="KUNING" nilai={r.KUNING} total={r.total} warna="bg-triage-kuning" kelas="text-text-kuning" />
            <Batang label="HIJAU" nilai={r.HIJAU} total={r.total} warna="bg-triage-hijau" kelas="text-text-hijau" />
          </div>
        </>
      )}
      <p className="text-[11px] text-muted">
        MERAH = perlu rujukan tes TCM, KUNING = perlu pemeriksaan lanjutan, HIJAU = tidak ditemukan tanda TBC. Ini hasil
        triase AI, bukan diagnosis.
      </p>
    </div>
  );
}
