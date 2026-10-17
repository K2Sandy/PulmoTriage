"use client";

import Statistik from "./components/Statistik";
import { useUnduh } from "./components/UnduhContext";
import { KONTAK } from "./utils";

const KATEGORI = [
  { nama: "MERAH", arti: "Risiko tinggi. Rujuk untuk tes TCM.", kelas: "bg-triage-merah text-on-triage-merah" },
  { nama: "KUNING", arti: "Perlu pemeriksaan lanjutan oleh dokter.", kelas: "bg-triage-kuning text-on-triage-kuning" },
  { nama: "HIJAU", arti: "Tidak ditemukan tanda TBC.", kelas: "bg-triage-hijau text-on-triage-hijau" },
];

const PENGGUNA = [
  {
    judul: "Puskesmas",
    isi: "Pembacaan awal rontgen dada dalam hitungan detik di komputer biasa, tanpa internet dan tanpa GPU. Lengkap dengan draf surat rujukan.",
  },
  {
    judul: "Klinik dan rumah sakit swasta",
    isi: "Alur yang sama untuk skrining TBC pasien dan pemeriksaan kesehatan karyawan, dengan lisensi per fasilitas.",
  },
  {
    judul: "Masyarakat dan peneliti",
    isi: "Lihat persebaran hasil triase per provinsi di halaman ini. Hanya angka gabungan, tanpa data pribadi pasien.",
  },
];

const LANGKAH = [
  { judul: "Isi data dan gejala", isi: "Petugas mengisi data dasar pasien dan mencentang gejala TBC." },
  { judul: "Unggah rontgen dada", isi: "Gerbang kualitas menolak foto yang buram, terputar, atau bukan rontgen." },
  { judul: "Dapatkan kategori", isi: "Skor AI dan gejala digabung menjadi MERAH, KUNING, atau HIJAU, dengan peta panas." },
  { judul: "Tinjau dan rujuk", isi: "Dokter meninjau hasilnya, lalu mencetak draf surat rujukan bila perlu." },
];

function TombolUnduh({ besar = false }) {
  const { url, versi } = useUnduh();
  return (
    <a
      href={url}
      className={`inline-flex items-center gap-2 rounded-[10px] bg-primary text-on-primary font-bold hover:brightness-105 shadow-xs ${
        besar ? "h-12 px-6 text-base" : "h-11 px-5 text-sm"
      }`}
    >
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span>Unduh untuk Windows{versi ? ` · v${versi}` : ""}</span>
    </a>
  );
}

export default function Beranda() {
  return (
    <main className="w-full flex flex-col">
      {/* Hero */}
      <section id="tentang" className="w-full bg-surface border-b border-line scroll-mt-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
          <div className="flex flex-col gap-5">
            <span className="text-primary text-xs font-bold uppercase tracking-wider">Alat bantu triase TBC</span>
            <h1 className="text-4xl sm:text-5xl font-semibold font-fraunces text-ink leading-[1.08]">
              Triase TBC dari rontgen dada, langsung di fasilitas kesehatan.
            </h1>
            <p className="text-muted text-base sm:text-lg max-w-[56ch]">
              PulmoTriage membaca rontgen dada dan gejala pasien, lalu memilah siapa yang perlu dirujuk lebih dulu. Berjalan di
              komputer biasa, tanpa internet. Keputusan akhir tetap di tangan dokter.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <TombolUnduh besar />
              <a
                href="#data"
                className="h-12 px-5 rounded-[10px] border border-line-strong text-ink font-bold inline-flex items-center hover:bg-bg"
              >
                Lihat data persebaran
              </a>
            </div>
            <p className="text-xs text-muted">Windows 10/11 · sekitar 55 MB · perlu file lisensi dari tim PulmoTriage</p>
          </div>

          <div className="rounded-2xl border border-line bg-bg p-5 sm:p-6 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">Tiga kategori hasil</span>
            {KATEGORI.map((k) => (
              <div key={k.nama} className="flex items-center gap-3 bg-surface rounded-xl border border-line p-3">
                <span className={`h-8 min-w-[84px] px-2.5 rounded-md text-xs font-extrabold inline-flex items-center justify-center ${k.kelas}`}>
                  {k.nama}
                </span>
                <span className="text-sm text-ink">{k.arti}</span>
              </div>
            ))}
            <p className="text-[11px] text-muted">Hasil AI adalah alat bantu triase, bukan diagnosis. Konfirmasi dengan tes TCM.</p>
          </div>
        </div>
      </section>

      {/* Untuk siapa */}
      <section className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-12 flex flex-col gap-6">
        <h2 className="text-2xl sm:text-3xl font-semibold font-fraunces text-ink">Untuk siapa</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PENGGUNA.map((p) => (
            <div key={p.judul} className="bg-surface rounded-2xl border border-line p-5 flex flex-col gap-2">
              <h3 className="text-lg font-bold text-ink">{p.judul}</h3>
              <p className="text-sm text-muted">{p.isi}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cara kerja */}
      <section className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 pb-12 flex flex-col gap-6">
        <h2 className="text-2xl sm:text-3xl font-semibold font-fraunces text-ink">Cara kerja</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LANGKAH.map((l, i) => (
            <li key={l.judul} className="bg-surface rounded-2xl border border-line p-5 flex flex-col gap-2">
              <span className="size-8 rounded-full bg-status-info-bg text-primary font-bold inline-flex items-center justify-center">
                {i + 1}
              </span>
              <h3 className="text-base font-bold text-ink">{l.judul}</h3>
              <p className="text-sm text-muted">{l.isi}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Data publik */}
      <div className="w-full bg-bg border-y border-line">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
          <Statistik />
        </div>
      </div>

      {/* Unduh */}
      <section id="unduh" className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-12 scroll-mt-16">
        <div className="bg-surface rounded-2xl border border-line p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl sm:text-3xl font-semibold font-fraunces text-ink">Pasang PulmoTriage</h2>
            <p className="text-muted">
              Satu installer berisi semua yang dibutuhkan: model AI, tampilan, dan Python. Tidak perlu internet setelah
              lisensi diaktifkan.
            </p>
            <div>
              <TombolUnduh besar />
            </div>
            <p className="text-xs text-muted">
              Windows mungkin menampilkan peringatan SmartScreen karena installer belum ditandatangani. Pilih{" "}
              <span className="font-bold">More info → Run anyway</span>.
            </p>
          </div>
          <ol className="flex flex-col gap-3 text-sm">
            {[
              "Unduh dan jalankan installer. Tidak perlu hak admin.",
              "Buka PulmoTriage dari ikon di desktop.",
              "Pasang file lisensi fasilitas Anda. Aktivasi pertama butuh internet; satu lisensi untuk satu komputer.",
              "Mulai pemeriksaan. Data tersimpan di komputer itu dan dikirim tanpa nama saat ada internet.",
              "Saat ada versi baru, aplikasi menampilkan pemberitahuan dan tautan unduh. Data tidak hilang saat memperbarui.",
            ].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="size-6 shrink-0 rounded-full bg-primary text-on-primary text-xs font-bold inline-flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-ink">{t}</span>
              </li>
            ))}
            <li className="mt-2 text-muted">
              Belum punya lisensi? Lisensi diterbitkan tim PulmoTriage untuk setiap Puskesmas dan klinik.
              {KONTAK && (
                <>
                  {" "}
                  <a href={KONTAK} className="text-primary font-bold hover:underline">
                    Ajukan lisensi
                  </a>
                </>
              )}
            </li>
          </ol>
        </div>
      </section>

      <footer className="w-full border-t border-line bg-surface">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 text-xs text-muted flex flex-col sm:flex-row gap-2 justify-between">
          <span>PulmoTriage oleh Tim Sleber · INFEST XII Hackathon 2026</span>
          <span>Alat bantu triase, bukan alat diagnosis. Model belum divalidasi pada pasien Indonesia.</span>
        </div>
      </footer>
    </main>
  );
}
