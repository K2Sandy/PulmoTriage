"use client";

import { useState, useRef, useEffect } from "react";
import { useSync } from "./context/SyncContext";
import Stepper from "./components/Stepper";
import QualityModal from "./components/QualityModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const GEJALA = [
  { key: "batuk_2minggu", label: "Batuk lebih dari 2 minggu" },
  { key: "demam", label: "Demam" },
  { key: "berat_badan_turun", label: "Berat badan turun" },
  { key: "keringat_malam", label: "Keringat malam" },
  { key: "kontak_serumah", label: "Kontak serumah dengan pasien TBC" },
  { key: "riwayat_pengobatan", label: "Pernah berobat TBC" },
];

const WARNA = {
  MERAH: "border-red-600 bg-red-50 text-red-900",
  KUNING: "border-yellow-500 bg-yellow-50 text-yellow-900",
  HIJAU: "border-green-600 bg-green-50 text-green-900",
};

export default function Home() {
  const { cekSinkron } = useSync();

  // Wizard Step (1: Data Pasien, 2: Unggah Citra, 3: Hasil)
  const [step, setStep] = useState(1);

  // Step 1: Patient Data
  const [nama, setNama] = useState("");
  const [umur, setUmur] = useState("");
  const [jk, setJk] = useState("");
  const [gejala, setGejala] = useState([]);
  const [umurError, setUmurError] = useState("");

  // Step 2: Image Upload
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileMeta, setFileMeta] = useState({ size: "", dimensions: "" });
  const [invalidFileError, setInvalidFileError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Analysis / Server State
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [hasil, setHasil] = useState(null);
  const [tinjauan, setTinjauan] = useState("");
  const [modalQualityOpen, setModalQualityOpen] = useState(false);

  // Validate Umur
  function validateUmur(value) {
    if (value === "" || value === null || value === undefined) {
      setUmurError("");
      return true;
    }
    const num = Number(value);
    if (isNaN(num) || num < 0 || num > 120 || !Number.isInteger(num)) {
      setUmurError("Umur harus antara 0 dan 120 tahun.");
      return false;
    }
    setUmurError("");
    return true;
  }

  function handleUmurChange(val) {
    setUmur(val);
    validateUmur(val);
  }

  function toggleGejala(key) {
    setGejala((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function kosongkanForm() {
    setNama("");
    setUmur("");
    setJk("");
    setGejala([]);
    setUmurError("");
  }

  function lanjutKeStep2() {
    if (!validateUmur(umur)) {
      return;
    }
    setStep(2);
  }

  // Handle File Selection
  function prosesFile(selectedFile) {
    if (!selectedFile) return;

    // Check if image
    const isImage =
      selectedFile.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|bmp)$/i.test(selectedFile.name);

    if (!isImage) {
      setFile(null);
      setFilePreview(null);
      setFileMeta({ size: "", dimensions: "" });
      setInvalidFileError({
        name: selectedFile.name,
      });
      return;
    }

    setInvalidFileError(null);
    setFile(selectedFile);
    setServerError(false);

    // Format size
    const bytes = selectedFile.size;
    let sizeStr = "";
    if (bytes >= 1024 * 1024) {
      sizeStr = `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
    } else {
      sizeStr = `${Math.round(bytes / 1024)} KB`;
    }

    // Read preview & dimensions
    const previewUrl = URL.createObjectURL(selectedFile);
    setFilePreview(previewUrl);

    const img = new Image();
    img.onload = () => {
      setFileMeta({
        size: sizeStr,
        dimensions: `${img.naturalWidth} × ${img.naturalHeight}`,
      });
    };
    img.src = previewUrl;
  }

  // Drag and drop handlers
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      prosesFile(e.dataTransfer.files[0]);
    }
  }

  // Submit Analysis
  async function jalankanAnalisis() {
    if (!file || loading) return;

    setLoading(true);
    setServerError(false);

    const form = new FormData();
    form.append("foto", file);
    form.append("gejala", gejala.join(","));
    form.append("nama", nama.trim());
    if (umur !== "") {
      form.append("umur", umur);
    }
    form.append("jenis_kelamin", jk);

    try {
      const res = await fetch(`${API}/analyze`, { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Terjadi kesalahan pada server");
      }

      setHasil(data);

      if (data.status === "rejected") {
        setModalQualityOpen(true);
      } else if (data.status === "ok") {
        cekSinkron();
        setStep(3);
      }
    } catch (err) {
      console.error("Analisis error:", err);
      setServerError(true);
    } finally {
      setLoading(false);
    }
  }

  // Doctor Review
  async function tinjau(keputusan) {
    if (!hasil || !hasil.id) return;
    const f = new FormData();
    f.append("keputusan", keputusan);
    try {
      const r = await fetch(`${API}/pemeriksaan/${hasil.id}/tinjau`, {
        method: "POST",
        body: f,
      });
      if (!r.ok) throw new Error();
      setTinjauan(keputusan);
    } catch {
      alert("Tinjauan dokter GAGAL disimpan. Silakan coba lagi.");
    }
  }

  function resetSemuaPemeriksaan() {
    kosongkanForm();
    setFile(null);
    setFilePreview(null);
    setFileMeta({ size: "", dimensions: "" });
    setInvalidFileError(null);
    setHasil(null);
    setTinjauan("");
    setServerError(false);
    setStep(1);
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3-Step Stepper Navigation */}
      <Stepper
        currentStep={step}
        onStepClick={(targetStep) => {
          if (targetStep < step) setStep(targetStep);
        }}
      />

      <main className="w-full max-w-[1200px] px-4 sm:px-6 py-6 flex flex-col items-start gap-5">
        {/* Pernyataan Wajib Disclaimer */}
        <aside
          role="note"
          aria-label="Pernyataan hukum dan batas tanggung jawab AI"
          className="w-full rounded-xl border border-zinc-200 bg-[var(--color-status-neutral)] px-4 py-3 text-xs sm:text-sm text-teal-950 flex items-center gap-3 shadow-xs"
        >
          <svg className="size-4 shrink-0 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="leading-snug">
            <strong>Pernyataan:</strong> Hasil AI adalah alat bantu triase, bukan diagnosis. Keputusan klinis tetap di tangan dokter.
          </p>
        </aside>

        {/* ------------------------------------------------------------- */}
        {/* LANGKAH 1: DATA PASIEN & GEJALA KLINIS                        */}
        {/* ------------------------------------------------------------- */}
        {step === 1 && (
          <div className="w-full flex flex-col gap-5 animate-in fade-in duration-200">
            <section className="w-full p-6 bg-white rounded-2xl border border-zinc-200 shadow-xs flex flex-col gap-7">
              {/* Patient Fields */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-teal-950 text-2xl font-semibold font-fraunces leading-7">
                    Data Pasien
                  </h1>
                  <span className="px-2.5 py-0.5 bg-gray-100 rounded-full border border-zinc-200 text-gray-500 text-xs font-bold font-atkinson tracking-wide">
                    Opsional
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Nama Pasien */}
                  <div className="md:col-span-6 flex flex-col gap-1.5">
                    <label htmlFor="input-nama" className="text-teal-950 text-base font-bold font-atkinson">
                      Nama pasien
                    </label>
                    <input
                      id="input-nama"
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Siti Rahma (fiktif)"
                      className="w-full h-11 px-3.5 bg-white rounded-md border border-slate-400 text-teal-950 text-base font-normal font-atkinson focus:border-cyan-700 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Umur */}
                  <div className="md:col-span-3 flex flex-col gap-1.5">
                    <label htmlFor="input-umur" className="text-teal-950 text-base font-bold font-atkinson">
                      Umur
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        id="input-umur"
                        type="number"
                        min="0"
                        max="120"
                        value={umur}
                        onChange={(e) => handleUmurChange(e.target.value)}
                        placeholder="45"
                        className={`w-28 h-11 px-3 bg-white rounded-md text-teal-950 text-base font-medium font-mono focus:outline-none transition-all ${
                          umurError
                            ? "outline outline-2 outline-offset-[-2px] outline-[var(--color-status-error)] border-transparent"
                            : "border border-slate-400 focus:border-cyan-700"
                        }`}
                      />
                      <span className="text-teal-950 text-base font-normal font-atkinson">
                        tahun
                      </span>
                    </div>

                    {/* Inline Error for Age */}
                    {umurError && (
                      <div id="error-umur-pesan" className="pt-1 flex items-center gap-1.5 text-[var(--color-status-error)] animate-in fade-in">
                        <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                          <circle cx="12" cy="12" r="9" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span className="text-sm font-bold font-atkinson leading-tight">
                          {umurError}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Jenis Kelamin Segmented Control */}
                  <div className="md:col-span-3 flex flex-col gap-1.5">
                    <span className="text-teal-950 text-base font-bold font-atkinson">
                      Jenis kelamin
                    </span>
                    <div className="w-full sm:w-64 h-11 rounded-[10px] border border-slate-400 flex overflow-hidden bg-white">
                      <button
                        type="button"
                        id="btn-jk-l"
                        onClick={() => setJk(jk === "L" ? "" : "L")}
                        className={`flex-1 h-full flex items-center justify-center font-atkinson text-base transition-colors border-r border-slate-400 cursor-pointer ${
                          jk === "L"
                            ? "bg-cyan-700 text-white font-bold"
                            : "text-teal-950 font-normal hover:bg-gray-50"
                        }`}
                      >
                        Laki-laki
                      </button>
                      <button
                        type="button"
                        id="btn-jk-p"
                        onClick={() => setJk(jk === "P" ? "" : "P")}
                        className={`flex-1 h-full flex items-center justify-center font-atkinson text-base transition-colors cursor-pointer ${
                          jk === "P"
                            ? "bg-cyan-700 text-white font-bold"
                            : "text-teal-950 font-normal hover:bg-gray-50"
                        }`}
                      >
                        Perempuan
                      </button>
                    </div>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="px-3.5 py-3 bg-emerald-50 rounded-[10px] flex items-center gap-2.5 border border-emerald-200/60 mt-1">
                  <svg className="size-4 shrink-0 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-teal-950 text-sm font-normal font-atkinson leading-tight">
                    Nama dan umur hanya tersimpan di komputer Puskesmas ini. Yang dikirim ke dasbor Dinas Kesehatan hanya data tanpa nama.
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-zinc-200" />

              {/* Gejala TBC Cards */}
              <div className="flex flex-col gap-3.5">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-teal-950 text-2xl font-semibold font-fraunces leading-7">
                    Gejala TBC
                  </h2>
                  <span className="text-gray-500 text-sm font-normal font-atkinson">
                    Centang semua yang dialami pasien
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {GEJALA.map(({ key, label }) => {
                    const isChecked = gejala.includes(key);
                    return (
                      <label
                        key={key}
                        className={`h-12 px-3.5 rounded-[10px] border flex items-center gap-3 cursor-pointer transition-all ${
                          isChecked
                            ? "bg-cyan-50/60 border-cyan-700 shadow-xs"
                            : "bg-white border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleGejala(key)}
                          className="sr-only"
                        />
                        {/* Checkbox box */}
                        <div
                          className={`size-5 rounded-[5px] flex items-center justify-center transition-colors shrink-0 ${
                            isChecked
                              ? "bg-cyan-700 border border-cyan-700 text-white"
                              : "bg-white border border-slate-400"
                          }`}
                        >
                          {isChecked && (
                            <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <span className={`text-base font-atkinson select-none ${
                          isChecked ? "text-cyan-900 font-semibold" : "text-teal-950 font-normal"
                        }`}>
                          {label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Bottom Actions for Step 1 */}
            <div className="w-full flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                id="btn-kosongkan-form"
                onClick={kosongkanForm}
                className="h-11 px-5 bg-white rounded-[10px] border border-cyan-700 text-cyan-700 hover:bg-cyan-50 text-base font-bold font-atkinson transition-colors cursor-pointer"
              >
                Kosongkan form
              </button>
              <button
                type="button"
                id="btn-lanjut-step1"
                onClick={lanjutKeStep2}
                className="h-11 px-6 bg-cyan-700 hover:bg-cyan-800 text-white rounded-[10px] text-base font-bold font-atkinson flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <span>Lanjut</span>
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* LANGKAH 2: UNGGAH CITRA & PEMERIKSAAN KUALITAS                */}
        {/* ------------------------------------------------------------- */}
        {step === 2 && (
          <div className="w-full flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Server Error Banner (Pink-50 / Fuchsia-800) */}
            {serverError && (
              <div
                id="banner-server-error"
                role="alert"
                className="w-full px-4 py-3.5 bg-[var(--color-status-error-bg)] rounded-[10px] border border-[var(--color-status-error)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="size-5 text-[var(--color-status-error)] shrink-0 mt-0.5">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="9" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className="text-teal-950 text-base font-atkinson leading-snug">
                    <strong className="font-bold">Tidak terhubung ke server PulmoTriage di komputer ini.</strong>{" "}
                    Pastikan aplikasi server sudah dijalankan, lalu coba lagi. Isian Anda tidak hilang.
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-coba-lagi"
                  onClick={jalankanAnalisis}
                  disabled={loading}
                  className="h-8 px-3.5 bg-white rounded-[10px] border border-cyan-700 text-cyan-700 hover:bg-cyan-50 text-sm font-bold font-atkinson shrink-0 self-end sm:self-center cursor-pointer transition-colors"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {/* Title */}
            <div className="flex items-baseline gap-3">
              <h1 className="text-teal-950 text-2xl font-semibold font-fraunces leading-7">
                Unggah rontgen dada
              </h1>
              <span className="text-gray-500 text-sm font-normal font-atkinson">
                Satu foto posisi depan (PA/AP)
              </span>
            </div>

            {/* Main Step 2 Layout: Left Upload Area, Right Sidebars */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Dropzone / Preview / Invalid file state */}
              <div className="lg:col-span-8 flex flex-col">
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  id="input-file-rontgen"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, .docx, .pdf, *"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      prosesFile(e.target.files[0]);
                    }
                  }}
                />

                {/* State A: File Bukan Gambar */}
                {invalidFileError ? (
                  <div className="w-full h-96 bg-white rounded-2xl border-2 border-[var(--color-status-error)] flex flex-col justify-center items-center p-6 text-center gap-3">
                    <div className="size-16 bg-pink-50 rounded-full flex justify-center items-center text-[var(--color-status-error)]">
                      <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div id="file-error-nama" className="text-teal-950 text-lg font-bold font-atkinson">
                      {invalidFileError.name} bukan gambar
                    </div>
                    <div className="text-gray-500 text-base font-normal font-atkinson">
                      Pilih file JPG atau PNG berisi rontgen dada.
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        id="btn-pilih-file-lain"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-11 px-5 bg-white rounded-[10px] border border-cyan-700 text-cyan-700 hover:bg-cyan-50 text-base font-bold font-atkinson flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>Pilih file lain</span>
                      </button>
                    </div>
                  </div>
                ) : file && filePreview ? (
                  /* State B: Foto Terpilih (Preview + Details) */
                  <div className="w-full min-h-96 p-5 bg-white rounded-2xl border border-zinc-200 flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-xs">
                    {/* Thumbnail Box */}
                    <div className="w-full sm:w-72 h-80 sm:h-96 relative bg-neutral-950 rounded-[10px] flex items-center justify-center overflow-hidden shrink-0 border border-zinc-800">
                      <img
                        id="preview-foto-rontgen"
                        src={filePreview}
                        alt="Pratinjau foto terpilih"
                        className="w-full h-full object-contain"
                      />

                      {/* Loading Analysis Overlay */}
                      {loading && (
                        <div
                          id="overlay-menganalisis"
                          className="absolute inset-x-0 bottom-0 py-3 px-4 bg-teal-950/80 backdrop-blur-xs flex items-center gap-2.5 text-white animate-in fade-in"
                        >
                          <svg className="size-4 animate-spin text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm font-normal font-atkinson">
                            Menganalisis citra. Jangan tutup halaman ini.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Change Button */}
                    <div className="flex-1 flex flex-col items-start gap-2 pt-1 w-full">
                      <span className="text-gray-500 text-xs font-bold font-atkinson uppercase tracking-wide">
                        Foto terpilih
                      </span>
                      <span id="preview-nama-file" className="text-teal-950 text-base font-bold font-mono break-all">
                        {file.name}
                      </span>
                      <span id="preview-meta-file" className="text-gray-500 text-sm font-normal font-atkinson">
                        {fileMeta.size} {fileMeta.dimensions && `· ${fileMeta.dimensions}`}
                      </span>

                      <div className="pt-3">
                        <button
                          type="button"
                          id="btn-ganti-foto"
                          disabled={loading}
                          onClick={() => fileInputRef.current?.click()}
                          className={`h-11 px-5 rounded-[10px] text-base font-bold font-atkinson flex items-center gap-2 transition-colors ${
                            loading
                              ? "bg-zinc-200 text-gray-400 cursor-not-allowed"
                              : "bg-white border border-cyan-700 text-cyan-700 hover:bg-cyan-50 cursor-pointer shadow-xs"
                          }`}
                        >
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Ganti foto</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* State C: Drag & Drop Zone */
                  <div
                    id="area-dropzone-foto"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full h-96 bg-white rounded-2xl border-2 border-dashed flex flex-col justify-center items-center gap-3 p-6 cursor-pointer transition-all ${
                      isDragging
                        ? "border-cyan-700 bg-cyan-50/40 scale-[0.99]"
                        : "border-slate-400 hover:border-cyan-700 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="size-16 bg-emerald-50 rounded-full flex justify-center items-center text-cyan-700">
                      <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <div className="text-center text-teal-950 text-lg font-bold font-atkinson">
                      Seret foto rontgen dada ke sini
                    </div>
                    <div className="text-center text-gray-500 text-base font-normal font-atkinson">
                      atau
                    </div>
                    <button
                      type="button"
                      id="btn-pilih-file"
                      className="h-11 px-5 bg-white rounded-[10px] border border-cyan-700 text-cyan-700 font-bold text-base font-atkinson shadow-xs pointer-events-none"
                    >
                      Pilih file
                    </button>
                    <div className="text-center text-gray-500 text-sm font-normal font-atkinson pt-1">
                      JPG atau PNG · file digital atau foto film di viewer box
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Ringkasan Langkah 1 & Tips Foto */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                {/* Ringkasan Langkah 1 Card */}
                <div className="w-full p-5 bg-white rounded-2xl border border-zinc-200 flex flex-col gap-3 shadow-xs">
                  <div className="w-full flex items-center justify-between">
                    <span className="text-gray-500 text-xs font-bold font-atkinson uppercase tracking-wide">
                      Ringkasan langkah 1
                    </span>
                    <button
                      type="button"
                      id="btn-ubah-langkah-1"
                      onClick={() => setStep(1)}
                      className="text-cyan-700 text-sm font-bold font-atkinson hover:underline cursor-pointer"
                    >
                      Ubah
                    </button>
                  </div>

                  <div className="text-base font-atkinson leading-snug">
                    <strong className="text-teal-950 font-bold">
                      {nama.trim() || "Tanpa nama"}
                    </strong>{" "}
                    <span className="text-gray-500 font-normal">
                      · {umur ? `${umur} tahun` : "-"} · {jk === "L" ? "Laki-laki" : jk === "P" ? "Perempuan" : "-"}
                    </span>
                  </div>

                  {/* Symptoms Summary */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    {gejala.length > 0 ? (
                      gejala.map((gKey) => {
                        const item = GEJALA.find((g) => g.key === gKey);
                        return (
                          <div key={gKey} className="flex items-center gap-2 text-teal-950 text-base font-normal font-atkinson">
                            <svg className="size-4 text-cyan-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{item?.label || gKey}</span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-gray-400 text-sm italic font-atkinson">
                        Tidak ada gejala yang dipilih
                      </span>
                    )}
                  </div>
                </div>

                {/* Tips Foto Card */}
                <div className="w-full p-5 bg-white rounded-2xl border border-zinc-200 flex flex-col gap-2.5 shadow-xs">
                  <span className="text-gray-500 text-xs font-bold font-atkinson uppercase tracking-wide">
                    Agar foto bisa dianalisis
                  </span>
                  <ul className="flex flex-col gap-2 pl-4 list-disc text-teal-950 text-base font-normal font-atkinson leading-snug marker:text-teal-950">
                    <li>File digital asli lebih baik daripada foto layar atau film.</li>
                    <li>Bila memotret film: letakkan di viewer box, kamera tegak lurus, tanpa pantulan.</li>
                    <li>Seluruh area paru masuk bingkai, tidak terbalik atau miring.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Actions for Step 2 */}
            <div className="w-full flex items-center justify-between pt-1">
              <button
                type="button"
                id="btn-kembali-step1"
                onClick={() => setStep(1)}
                className="h-11 px-5 rounded-[10px] text-cyan-700 hover:bg-cyan-50 text-base font-bold font-atkinson flex items-center gap-2 transition-colors cursor-pointer"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Kembali ke data pasien</span>
              </button>

              <button
                type="button"
                id="btn-mulai-analisis"
                disabled={!file || loading}
                onClick={jalankanAnalisis}
                className={`h-11 px-6 rounded-[10px] text-base font-bold font-atkinson flex items-center gap-2 transition-all ${
                  !file || loading
                    ? "bg-zinc-200 text-gray-400 cursor-not-allowed"
                    : "bg-cyan-700 hover:bg-cyan-800 text-white shadow-xs cursor-pointer"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="size-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <span>Analisis</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* LANGKAH 3: HASIL ANALISIS, PETA PANAS, DAN TRIASE            */}
        {/* ------------------------------------------------------------- */}
        {step === 3 && hasil && hasil.status === "ok" && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-teal-950 text-2xl font-semibold font-fraunces leading-7">
                  Hasil Analisis
                </h1>
                <p className="text-gray-500 text-sm font-atkinson mt-0.5">
                  Pemeriksaan telah selesai dianalisis oleh model PulmoTriage.
                </p>
              </div>
              <button
                type="button"
                id="btn-pemeriksaan-baru"
                onClick={resetSemuaPemeriksaan}
                className="h-10 px-4 rounded-[10px] border border-cyan-700 text-cyan-700 hover:bg-cyan-50 font-bold text-sm font-atkinson transition-colors"
              >
                Pemeriksaan Baru
              </button>
            </div>

            {/* Triage Banner */}
            <div className={`w-full rounded-2xl border-2 p-6 shadow-xs ${WARNA[hasil.triage.category]}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="size-4 rounded-full bg-current"></span>
                  <h2 className="text-2xl font-bold font-fraunces tracking-tight">
                    {hasil.triage.category} — {hasil.triage.title}
                  </h2>
                </div>
                <div className="px-3 py-1 bg-white/80 rounded-md border border-current font-mono text-sm font-bold">
                  Skor suspek: {hasil.prob_tb.toFixed(2)}
                </div>
              </div>

              <p className="mt-3 text-base leading-relaxed font-atkinson">
                {hasil.triage.action}
              </p>

              {/* Reasons */}
              <div className="mt-4 pt-4 border-t border-current/20">
                <span className="text-xs font-bold uppercase tracking-wider font-atkinson">
                  Alasan Klinis & Pertimbangan AI:
                </span>
                <ul className="mt-1.5 list-disc pl-5 text-sm space-y-1 font-atkinson">
                  {hasil.triage.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* Warnings */}
              {hasil.warnings && hasil.warnings.length > 0 && (
                <div className="mt-4 space-y-2">
                  {hasil.warnings.map((w, i) => (
                    <div key={i} className="p-3 bg-white/90 rounded-lg border border-amber-300 text-amber-900 text-xs font-medium font-atkinson flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Heatmap Grad-CAM */}
              {hasil.heatmap_png && (
                <div className="mt-6 flex flex-col items-center">
                  <div className="w-full max-w-[560px] bg-neutral-950 rounded-xl overflow-hidden border border-zinc-800 shadow-md">
                    <img
                      src={`data:image/png;base64,${hasil.heatmap_png}`}
                      alt="Peta panas Grad-CAM"
                      className="w-full max-h-[460px] object-contain"
                    />
                  </div>
                  <span className="mt-2 text-xs text-center text-gray-600 font-atkinson italic">
                    Area yang paling memengaruhi keputusan model AI (Grad-CAM)
                  </span>
                </div>
              )}

              {/* Doctor Review Actions */}
              <div className="mt-6 pt-5 border-t border-current/20 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  id="btn-tinjau-setuju"
                  onClick={() => tinjau("setuju")}
                  className="h-10 px-4 rounded-[10px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm font-atkinson shadow-xs transition-colors cursor-pointer"
                >
                  Dokter setuju
                </button>
                <button
                  type="button"
                  id="btn-tinjau-tidak-setuju"
                  onClick={() => tinjau("tidak_setuju")}
                  className="h-10 px-4 rounded-[10px] bg-gray-700 hover:bg-gray-800 text-white font-bold text-sm font-atkinson shadow-xs transition-colors cursor-pointer"
                >
                  Dokter tidak setuju
                </button>
                <a
                  id="link-draf-rujukan-pdf"
                  href={`${API}/pemeriksaan/${hasil.id}/rujukan.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-10 px-4 rounded-[10px] border border-cyan-700 bg-white text-cyan-700 hover:bg-cyan-50 font-bold text-sm font-atkinson flex items-center gap-2 shadow-xs transition-colors"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Buka draf rujukan (PDF)</span>
                </a>
              </div>

              {tinjauan && (
                <div className="mt-3.5 p-3 rounded-lg bg-white/95 border border-current text-sm font-atkinson font-semibold">
                  ✓ Tinjauan tersimpan: {tinjauan === "setuju" ? "Dokter setuju dengan hasil AI" : "Dokter tidak setuju"}. Draf PDF rujukan telah diperbarui.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Quality Gate Rejection Modal */}
      <QualityModal
        isOpen={modalQualityOpen}
        onClose={() => setModalQualityOpen(false)}
        onReupload={() => {
          setModalQualityOpen(false);
          fileInputRef.current?.click();
        }}
        userPhotoUrl={filePreview}
        issues={hasil?.quality?.issues || []}
      />
    </div>
  );
}
