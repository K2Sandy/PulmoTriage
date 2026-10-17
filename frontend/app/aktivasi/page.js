"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/Button";
import { formatTanggal } from "../components/LisensiChip";
import { useLisensi } from "../context/LisensiContext";
import { API } from "../utils/api";

const TAMPILAN = {
  belum_ada: { judul: "Lisensi belum dipasang", kotak: "bg-bg border-line", teks: "text-ink" },
  tidak_valid: { judul: "Lisensi tidak valid", kotak: "bg-status-error-bg border-status-error/30", teks: "text-status-error" },
  belum_berlaku: { judul: "Lisensi belum berlaku", kotak: "bg-bg border-line-strong", teks: "text-ink" },
  aktif: { judul: "Lisensi aktif", kotak: "bg-status-info-bg border-primary/30", teks: "text-primary" },
  masa_tenggang: { judul: "Masa tenggang", kotak: "bg-surface border-triage-kuning", teks: "text-text-kuning" },
  kedaluwarsa: { judul: "Lisensi berakhir", kotak: "bg-surface border-triage-merah", teks: "text-text-merah" },
};

function Baris({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted text-xs font-bold uppercase tracking-wide">{label}</dt>
      <dd className="text-ink text-sm sm:text-base">{children}</dd>
    </div>
  );
}

export default function AktivasiPage() {
  const { lisensi, gagal, muatUlang } = useLisensi();
  const router = useRouter();
  const inputRef = useRef(null);
  const [mengunggah, setMengunggah] = useState(false);
  const [galat, setGalat] = useState("");
  const [baruDipasang, setBaruDipasang] = useState(false);
  const [seret, setSeret] = useState(false);

  async function pasang(berkas) {
    if (!berkas || mengunggah) return;
    setGalat("");
    setBaruDipasang(false);
    if (!berkas.name.toLowerCase().endsWith(".json")) {
      setGalat("Pilih file lisensi berakhiran .json dari tim PulmoTriage.");
      return;
    }
    setMengunggah(true);
    try {
      const form = new FormData();
      form.append("berkas", berkas);
      const r = await fetch(`${API}/lisensi`, { method: "POST", body: form });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Lisensi ditolak.");
      await muatUlang();
      setBaruDipasang(true);
    } catch (e) {
      setGalat(e.message || "Gagal memasang lisensi.");
    } finally {
      setMengunggah(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (gagal && !lisensi) {
    return (
      <main className="w-full max-w-[720px] mx-auto px-4 py-12">
        <section className="rounded-2xl border border-status-error/30 bg-status-error-bg p-6 text-status-error">
          <h1 className="text-xl font-bold">Layanan PulmoTriage belum berjalan</h1>
          <p className="mt-2 text-sm">
            Jalankan <span className="font-mono">jalankan-pulmotriage.bat</span> di komputer ini, lalu muat ulang halaman.
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => muatUlang()}>
            Coba lagi
          </Button>
        </section>
      </main>
    );
  }

  const status = lisensi?.status || "belum_ada";
  const t = TAMPILAN[status] || TAMPILAN.belum_ada;
  const punyaDetail = lisensi && lisensi.puskesmas_id;

  return (
    <main className="w-full max-w-[760px] mx-auto px-4 py-8 sm:py-12 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="text-primary text-xs font-bold uppercase tracking-wider">Aktivasi</span>
        <h1 className="text-3xl sm:text-4xl font-semibold font-fraunces text-ink leading-tight">
          {lisensi?.boleh_periksa ? "Lisensi Puskesmas" : "Aktifkan PulmoTriage di Puskesmas ini"}
        </h1>
        <p className="text-muted text-sm sm:text-base max-w-[60ch]">
          Pasang file lisensi dari tim PulmoTriage. Lisensi diperiksa langsung di komputer ini, jadi tidak perlu
          internet. Nama Puskesmas dari lisensi akan tampil di aplikasi dan di surat rujukan.
        </p>
      </header>

      {/* Status lisensi saat ini */}
      <section id="status-lisensi" aria-live="polite" className={`rounded-2xl border p-5 sm:p-6 flex flex-col gap-4 ${t.kotak}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className={`text-lg sm:text-xl font-bold ${t.teks}`}>{t.judul}</h2>
            <p className="text-ink text-sm mt-1">
              {status === "belum_ada"
                ? "Minta file lisensi untuk Puskesmas ini kepada tim PulmoTriage atau Dinas Kesehatan, lalu pasang di bawah."
                : status === "aktif" && lisensi.sisa_hari > 30
                ? "Pemeriksaan baru dapat dilakukan di komputer ini."
                : lisensi?.pesan}
            </p>
          </div>
          {baruDipasang && lisensi?.boleh_periksa && (
            <span className="shrink-0 h-7 px-2.5 rounded-md bg-triage-hijau text-on-triage-hijau text-xs font-extrabold inline-flex items-center">
              TERPASANG
            </span>
          )}
        </div>

        {punyaDetail && (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-line">
            <Baris label="Puskesmas">{lisensi.nama}</Baris>
            <Baris label="Kode Puskesmas">
              <span className="font-mono">{lisensi.puskesmas_id}</span>
            </Baris>
            {lisensi.provinsi && <Baris label="Provinsi">{lisensi.provinsi}</Baris>}
            {lisensi.kab_kota && <Baris label="Kabupaten/Kota">{lisensi.kab_kota}</Baris>}
            {!lisensi.provinsi && lisensi.wilayah && <Baris label="Wilayah">{lisensi.wilayah}</Baris>}
            <Baris label="Masa berlaku">
              {formatTanggal(lisensi.berlaku_mulai)} – {formatTanggal(lisensi.berlaku_sampai)}
            </Baris>
          </dl>
        )}
      </section>

      {/* Unggah lisensi */}
      <section className="bg-surface rounded-2xl border border-line p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink">{punyaDetail ? "Ganti atau perpanjang lisensi" : "Pasang file lisensi"}</h2>
          <p className="text-muted text-sm mt-1">
            Contoh nama file: <span className="font-mono">lisensi-1171-001.json</span>
          </p>
        </div>

        <label
          htmlFor="input-lisensi"
          onDragOver={(e) => {
            e.preventDefault();
            setSeret(true);
          }}
          onDragLeave={() => setSeret(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSeret(false);
            pasang(e.dataTransfer.files?.[0]);
          }}
          className={`rounded-xl border-2 border-dashed p-6 sm:p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-colors ${
            seret ? "border-primary bg-status-info-bg" : "border-line-strong hover:bg-bg"
          }`}
        >
          <svg className="size-9 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span className="text-ink text-sm sm:text-base font-bold">
            {mengunggah ? "Memeriksa lisensi..." : "Seret file lisensi ke sini, atau klik untuk memilih"}
          </span>
          <span className="text-muted text-xs">Hanya file .json dari tim PulmoTriage</span>
          <input
            ref={inputRef}
            id="input-lisensi"
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={(e) => pasang(e.target.files?.[0])}
          />
        </label>

        {galat && (
          <p id="galat-lisensi" role="alert" className="text-sm text-status-error bg-status-error-bg border border-status-error/30 rounded-[10px] px-3 py-2">
            {galat}
          </p>
        )}
      </section>

      {lisensi?.boleh_periksa && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-muted text-sm">PulmoTriage siap dipakai. Pemeriksaan berjalan tanpa internet.</p>
          <Button id="btn-mulai-pemeriksaan" size="lg" onClick={() => router.push("/")}>
            Mulai pemeriksaan
          </Button>
        </div>
      )}

      <p className="text-muted text-xs border-t border-line pt-4">
        Lisensi diterbitkan tim PulmoTriage untuk setiap Puskesmas, melalui kerja sama dengan Dinas Kesehatan. Lisensi
        yang berakhir masih bisa dipakai selama 30 hari masa tenggang. Data pemeriksaan yang sudah tersimpan tidak
        pernah terhapus karena lisensi.
      </p>
    </main>
  );
}
