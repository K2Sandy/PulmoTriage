"use client";

import { useState, useRef, useEffect } from "react";
import { useSync } from "./context/SyncContext";
import Stepper from "./components/Stepper";
import QualityModal from "./components/QualityModal";
import Button from "./components/Button";
import CategoryBadge from "./components/CategoryBadge";
import TriageRibbon from "./components/TriageRibbon";
import CheckboxCard from "./components/CheckboxCard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const GEJALA = [
  { key: "batuk_2minggu", label: "Batuk lebih dari 2 minggu" },
  { key: "demam", label: "Demam" },
  { key: "berat_badan_turun", label: "Berat badan turun" },
  { key: "keringat_malam", label: "Keringat malam" },
  { key: "kontak_serumah", label: "Kontak serumah dengan pasien TBC" },
  { key: "riwayat_pengobatan", label: "Pernah berobat TBC" },
];

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
  const [modalQualityOpen, setModalQualityOpen] = useState(false);

  // Step 3 State
  const [tabFoto, setTabFoto] = useState("heatmap"); // "heatmap" | "asli"
  const [pilihanTinjauan, setPilihanTinjauan] = useState(null); // "setuju" | "tidak_setuju"
  const [catatanDokter, setCatatanDokter] = useState("");
  const [tinjauanTersimpan, setTinjauanTersimpan] = useState(null);
  const [savingTinjauan, setSavingTinjauan] = useState(false);

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
      setPilihanTinjauan(null);
      setCatatanDokter("");
      setTinjauanTersimpan(null);
      setTabFoto("heatmap");

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

  // Doctor Review Handler
  async function simpanTinjauan() {
    if (!pilihanTinjauan || !hasil || !hasil.id || savingTinjauan) return;
    setSavingTinjauan(true);
    try {
      const f = new FormData();
      f.append("keputusan", pilihanTinjauan);
      f.append("catatan", catatanDokter.trim());
      const r = await fetch(`${API}/pemeriksaan/${hasil.id}/tinjau`, {
        method: "POST",
        body: f,
      });
      if (!r.ok) throw new Error("Gagal menyimpan tinjauan");
      setTinjauanTersimpan({
        keputusan: pilihanTinjauan,
        catatan: catatanDokter.trim(),
        tanggal: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Gagal simpan tinjauan:", err);
      alert("Tinjauan dokter GAGAL disimpan. Silakan coba lagi.");
    } finally {
      setSavingTinjauan(false);
    }
  }

  function resetSemuaPemeriksaan() {
    kosongkanForm();
    setFile(null);
    setFilePreview(null);
    setFileMeta({ size: "", dimensions: "" });
    setInvalidFileError(null);
    setHasil(null);
    setPilihanTinjauan(null);
    setCatatanDokter("");
    setTinjauanTersimpan(null);
    setSavingTinjauan(false);
    setTabFoto("heatmap");
    setServerError(false);
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(null, "", "/");
    }
    setStep(1);
  }

  function formatTanggalIndo(isoString) {
    const d = isoString ? new Date(isoString) : new Date();
    const bulan = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatTanggalJam(isoString) {
    const d = isoString ? new Date(isoString) : new Date();
    const tanggal = formatTanggalIndo(isoString);
    const jam = String(d.getHours()).padStart(2, "0");
    const mnt = String(d.getMinutes()).padStart(2, "0");
    return `${tanggal}, ${jam}:${mnt}`;
  }

  // Load examination detail if ?id= is present in URL query
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get("id");
      if (queryId) {
        fetch(`${API}/pemeriksaan/${queryId}`)
          .then((r) => {
            if (!r.ok) throw new Error("Pemeriksaan tidak ditemukan");
            return r.json();
          })
          .then((data) => {
            if (data && data.id) {
              const mappedHasil = {
                id: data.id,
                uid: data.uid,
                status: "ok",
                dibuat_pada: data.dibuat_pada,
                prob_tb: data.prob_tb,
                model_version: data.model_version,
                heatmap_png: data.heatmap_png,
                triage: {
                  category: data.kategori,
                  ai_level: data.ai_level,
                  atypical: Boolean(data.atipikal),
                  title:
                    data.kategori === "MERAH"
                      ? "Rujuk segera"
                      : data.kategori === "KUNING"
                      ? "Evaluasi klinis & rontgen ulang"
                      : "Risiko TBC rendah",
                  recommendation:
                    data.kategori === "MERAH"
                      ? "Rujuk segera ke fasilitas rujukan TCM / RSUD terdekat."
                      : data.kategori === "KUNING"
                      ? "Lakukan evaluasi klinis lanjutan atau pemeriksaan dahak jika bergejala."
                      : "Edukasi kesehatan umum, tidak memerlukan rujukan rontgen lanjutan saat ini.",
                  reasons: data.gejala
                    ? data.gejala
                        .split(",")
                        .filter(Boolean)
                        .map((k) => GEJALA.find((g) => g.key === k)?.label || k)
                    : [],
                },
              };
              setHasil(mappedHasil);
              setNama(data.nama ? data.nama.replace(/\s*\(fiktif\)$/, "") : "");
              setUmur(data.umur != null ? String(data.umur) : "");
              setJk(data.jenis_kelamin || "");
              setGejala(data.gejala ? data.gejala.split(",").filter(Boolean) : []);
              if (data.keputusan_dokter) {
                setPilihanTinjauan(data.keputusan_dokter);
                setCatatanDokter(data.catatan_dokter || "");
                setTinjauanTersimpan({
                  keputusan: data.keputusan_dokter,
                  catatan: data.catatan_dokter || "",
                  tanggal: data.ditinjau_pada,
                });
              } else {
                setPilihanTinjauan(null);
                setCatatanDokter("");
                setTinjauanTersimpan(null);
              }
              setStep(3);
            }
          })
          .catch((err) => console.error("Gagal memuat detail pemeriksaan:", err));
      }
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3-Step Stepper Navigation */}
      <Stepper
        currentStep={step}
        onStepClick={(targetStep) => {
          if (targetStep < step) setStep(targetStep);
        }}
        onReset={resetSemuaPemeriksaan}
      />

      <main className="w-full max-w-[1200px] px-4 sm:px-6 py-6 flex flex-col items-start gap-5">
        {/* Pernyataan Wajib Disclaimer */}
        <aside
          role="note"
          aria-label="Pernyataan hukum dan batas tanggung jawab AI"
          className="w-full rounded-xl border border-line bg-status-neutral px-4 py-3 text-xs sm:text-sm text-ink flex items-center gap-3 shadow-xs"
        >
          <svg className="size-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
            <section className="w-full p-6 bg-white rounded-2xl border border-line shadow-xs flex flex-col gap-7">
              {/* Patient Fields */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-ink text-2xl font-semibold font-fraunces leading-7">
                    Data Pasien
                  </h1>
                  <span className="px-2.5 py-0.5 bg-status-neutral rounded-full border border-line text-muted text-xs font-bold font-atkinson tracking-wide">
                    Opsional
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Nama Pasien */}
                  <div className="md:col-span-6 flex flex-col gap-1.5">
                    <label htmlFor="input-nama" className="text-ink text-base font-bold font-atkinson">
                      Nama pasien
                    </label>
                    <input
                      id="input-nama"
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Siti Rahma (fiktif)"
                      className="w-full h-11 px-3.5 bg-white rounded-md border border-line-strong text-ink text-base font-normal font-atkinson focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Umur */}
                  <div className="md:col-span-3 flex flex-col gap-1.5">
                    <label htmlFor="input-umur" className="text-ink text-base font-bold font-atkinson">
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
                        className={`w-28 h-11 px-3 bg-white rounded-md text-ink text-base font-medium font-mono focus:outline-none transition-all ${
                          umurError
                            ? "outline outline-2 outline-offset-[-2px] outline-status-error border-transparent"
                            : "border border-line-strong focus:border-primary"
                        }`}
                      />
                      <span className="text-ink text-base font-normal font-atkinson">
                        tahun
                      </span>
                    </div>

                    {/* Inline Error for Age */}
                    {umurError && (
                      <div id="error-umur-pesan" className="pt-1 flex items-center gap-1.5 text-status-error animate-in fade-in">
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
                    <span className="text-ink text-base font-bold font-atkinson">
                      Jenis kelamin
                    </span>
                    <div className="w-full sm:w-64 h-11 rounded-[10px] border border-line-strong flex overflow-hidden bg-white">
                      <button
                        type="button"
                        id="btn-jk-l"
                        onClick={() => setJk(jk === "L" ? "" : "L")}
                        className={`flex-1 h-full flex items-center justify-center font-atkinson text-base transition-colors border-r border-line-strong cursor-pointer ${
                          jk === "L"
                            ? "bg-primary text-white font-bold"
                            : "text-ink font-normal hover:bg-bg"
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
                            ? "bg-primary text-white font-bold"
                            : "text-ink font-normal hover:bg-bg"
                        }`}
                      >
                        Perempuan
                      </button>
                    </div>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="px-3.5 py-3 bg-status-info-bg rounded-[10px] flex items-center gap-2.5 border border-line mt-1">
                  <svg className="size-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-ink text-sm font-normal font-atkinson leading-tight">
                    Nama dan umur hanya tersimpan di komputer Puskesmas ini. Yang dikirim ke dasbor Dinas Kesehatan hanya data tanpa nama.
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-line" />

              {/* Gejala TBC Cards */}
              <div className="flex flex-col gap-3.5">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-ink text-2xl font-semibold font-fraunces leading-7">
                    Gejala TBC
                  </h2>
                  <span className="text-muted text-sm font-normal font-atkinson">
                    Centang semua yang dialami pasien
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {GEJALA.map(({ key, label }) => (
                    <CheckboxCard
                      key={key}
                      id={`gejala-${key}`}
                      label={label}
                      checked={gejala.includes(key)}
                      onChange={() => toggleGejala(key)}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Bottom Actions for Step 1 */}
            <div className="w-full flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                id="btn-kosongkan-form"
                onClick={kosongkanForm}
                className="h-11 px-5 bg-white rounded-[10px] border border-primary text-primary hover:bg-status-info-bg text-base font-bold font-atkinson transition-colors cursor-pointer"
              >
                Kosongkan form
              </button>
              <button
                type="button"
                id="btn-lanjut-step1"
                onClick={lanjutKeStep2}
                className="h-11 px-6 bg-primary hover:bg-primary/90 text-white rounded-[10px] text-base font-bold font-atkinson flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
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
                className="w-full px-4 py-3.5 bg-status-error-bg rounded-[10px] border border-status-error flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="size-5 text-status-error shrink-0 mt-0.5">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="9" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className="text-ink text-base font-atkinson leading-snug">
                    <strong className="font-bold">Tidak terhubung ke server PulmoTriage di komputer ini.</strong>{" "}
                    Pastikan aplikasi server sudah dijalankan, lalu coba lagi. Isian Anda tidak hilang.
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-coba-lagi"
                  onClick={jalankanAnalisis}
                  disabled={loading}
                  className="h-8 px-3.5 bg-white rounded-[10px] border border-primary text-primary hover:bg-status-info-bg text-sm font-bold font-atkinson shrink-0 self-end sm:self-center cursor-pointer transition-colors"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {/* Title */}
            <div className="flex items-baseline gap-3">
              <h1 className="text-ink text-2xl font-semibold font-fraunces leading-7">
                Unggah rontgen dada
              </h1>
              <span className="text-muted text-sm font-normal font-atkinson">
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
                  <div className="w-full h-96 bg-white rounded-2xl border-2 border-status-error flex flex-col justify-center items-center p-6 text-center gap-3">
                    <div className="size-16 bg-status-error-bg rounded-full flex justify-center items-center text-status-error">
                      <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div id="file-error-nama" className="text-ink text-lg font-bold font-atkinson">
                      {invalidFileError.name} bukan gambar
                    </div>
                    <div className="text-muted text-base font-normal font-atkinson">
                      Pilih file JPG atau PNG berisi rontgen dada.
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        id="btn-pilih-file-lain"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-11 px-5 bg-white rounded-[10px] border border-primary text-primary hover:bg-status-info-bg text-base font-bold font-atkinson flex items-center gap-2 cursor-pointer transition-colors"
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
                  <div className="w-full min-h-96 p-5 bg-white rounded-2xl border border-line flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-xs">
                    {/* Thumbnail Box */}
                    <div className="w-full sm:w-72 h-80 sm:h-96 relative bg-black rounded-[10px] flex items-center justify-center overflow-hidden shrink-0 border border-line/20">
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
                          className="absolute inset-x-0 bottom-0 py-3 px-4 bg-ink/80 backdrop-blur-xs flex items-center gap-2.5 text-white animate-in fade-in"
                        >
                          <svg className="size-4 animate-spin text-primary shrink-0" fill="none" viewBox="0 0 24 24">
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
                      <span className="text-muted text-xs font-bold font-atkinson uppercase tracking-wide">
                        Foto terpilih
                      </span>
                      <span id="preview-nama-file" className="text-ink text-base font-bold font-mono break-all">
                        {file.name}
                      </span>
                      <span id="preview-meta-file" className="text-muted text-sm font-normal font-atkinson">
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
                              ? "bg-line text-muted cursor-not-allowed"
                              : "bg-white border border-primary text-primary hover:bg-status-info-bg cursor-pointer shadow-xs"
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
                        ? "border-primary bg-status-info-bg scale-[0.99]"
                        : "border-line-strong hover:border-primary hover:bg-bg/50"
                    }`}
                  >
                    <div className="size-16 bg-status-info-bg rounded-full flex justify-center items-center text-primary">
                      <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <div className="text-center text-ink text-lg font-bold font-atkinson">
                      Seret foto rontgen dada ke sini
                    </div>
                    <div className="text-center text-muted text-base font-normal font-atkinson">
                      atau
                    </div>
                    <button
                      type="button"
                      id="btn-pilih-file"
                      className="h-11 px-5 bg-white rounded-[10px] border border-primary text-primary font-bold text-base font-atkinson shadow-xs pointer-events-none"
                    >
                      Pilih file
                    </button>
                    <div className="text-center text-muted text-sm font-normal font-atkinson pt-1">
                      JPG atau PNG · file digital atau foto film di viewer box
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Ringkasan Langkah 1 & Tips Foto */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                {/* Ringkasan Langkah 1 Card */}
                <div className="w-full p-5 bg-white rounded-2xl border border-line flex flex-col gap-3 shadow-xs">
                  <div className="w-full flex items-center justify-between">
                    <span className="text-muted text-xs font-bold font-atkinson uppercase tracking-wide">
                      Ringkasan langkah 1
                    </span>
                    <button
                      type="button"
                      id="btn-ubah-langkah-1"
                      onClick={() => setStep(1)}
                      className="text-primary text-sm font-bold font-atkinson hover:underline cursor-pointer"
                    >
                      Ubah
                    </button>
                  </div>

                  <div className="text-base font-atkinson leading-snug">
                    <strong className="text-ink font-bold">
                      {nama.trim() || "Tanpa nama"}
                    </strong>{" "}
                    <span className="text-muted font-normal">
                      · {umur ? `${umur} tahun` : "-"} · {jk === "L" ? "Laki-laki" : jk === "P" ? "Perempuan" : "-"}
                    </span>
                  </div>

                  {/* Symptoms Summary */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    {gejala.length > 0 ? (
                      gejala.map((gKey) => {
                        const item = GEJALA.find((g) => g.key === gKey);
                        return (
                          <div key={gKey} className="flex items-center gap-2 text-ink text-base font-normal font-atkinson">
                            <svg className="size-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{item?.label || gKey}</span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-muted text-sm italic font-atkinson">
                        Tidak ada gejala yang dipilih
                      </span>
                    )}
                  </div>
                </div>

                {/* Tips Foto Card */}
                <div className="w-full p-5 bg-white rounded-2xl border border-line flex flex-col gap-2.5 shadow-xs">
                  <span className="text-muted text-xs font-bold font-atkinson uppercase tracking-wide">
                    Agar foto bisa dianalisis
                  </span>
                  <ul className="flex flex-col gap-2 pl-4 list-disc text-ink text-base font-normal font-atkinson leading-snug marker:text-ink">
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
                className="h-11 px-5 rounded-[10px] text-primary hover:bg-status-info-bg text-base font-bold font-atkinson flex items-center gap-2 transition-colors cursor-pointer"
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
                    ? "bg-line text-muted cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer"
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
          <div className="w-full flex flex-col lg:flex-row items-start gap-6 animate-in fade-in duration-200">
            {/* Kolom Kiri: Ringkasan pasien, Gambar (Peta panas / Asli), Keterangan */}
            <div className="w-full lg:w-80 flex flex-col items-start gap-2.5 shrink-0">
              {/* Ringkasan Pasien */}
              <div id="ringkasan-pasien-hasil" className="w-full text-sm font-atkinson leading-5 break-words">
                <span className="text-ink font-bold">
                  {nama.trim() || "Tanpa nama"}
                </span>{" "}
                <span className="text-muted font-normal">
                  · {umur ? `${umur} th` : "-"} · {jk === "L" ? "L" : jk === "P" ? "P" : "-"} · No.{" "}
                  <span className="font-mono font-medium text-muted">
                    {String(hasil.id || 1).padStart(4, "0")}
                  </span>{" "}
                  · {formatTanggalIndo(hasil.dibuat_pada)}
                </span>
              </div>

              {/* Wadah Citra */}
              <div className="w-full h-96 bg-black rounded-[10px] flex items-center justify-center overflow-hidden border border-line/20 shadow-xs relative">
                {tabFoto === "heatmap" && hasil.heatmap_png ? (
                  <img
                    id="img-hasil-rontgen"
                    src={`data:image/png;base64,${hasil.heatmap_png}`}
                    alt="Peta panas Grad-CAM"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    id="img-hasil-rontgen"
                    src={filePreview}
                    alt="Foto asli rontgen"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Toggle Segmented: Peta panas / Asli + Keterangan */}
              <div className="w-full flex items-center justify-between gap-2.5">
                <div className="w-44 h-9 rounded-[10px] border border-line-strong flex overflow-hidden bg-white shrink-0">
                  <button
                    type="button"
                    id="btn-toggle-peta-panas"
                    onClick={() => setTabFoto("heatmap")}
                    className={`flex-1 h-full flex items-center justify-center gap-1.5 font-atkinson text-sm transition-colors border-r border-line-strong cursor-pointer ${
                      tabFoto === "heatmap"
                        ? "bg-primary text-white font-bold"
                        : "text-ink font-normal hover:bg-bg"
                    }`}
                  >
                    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Peta panas</span>
                  </button>
                  <button
                    type="button"
                    id="btn-toggle-foto-asli"
                    onClick={() => setTabFoto("asli")}
                    className={`flex-1 h-full flex items-center justify-center font-atkinson text-sm transition-colors cursor-pointer ${
                      tabFoto === "asli"
                        ? "bg-primary text-white font-bold"
                        : "text-ink font-normal hover:bg-bg"
                    }`}
                  >
                    <span>Asli</span>
                  </button>
                </div>

                <div
                  id="keterangan-peta-panas"
                  className="flex-1 text-right text-muted text-xs font-normal font-atkinson leading-4"
                >
                  {hasil.triage.atypical
                    ? "Peta panas kurang bisa dipercaya"
                    : "Area paling berpengaruh pada skor AI"}
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Banner Triase, Anjuran, Pernyataan Wajib, Skor AI & Alasan, Tinjauan Dokter */}
            <div className="flex-1 w-full flex flex-col items-start gap-3.5">
              {/* Banner Kategori Triase */}
              <TriageRibbon
                id="banner-hasil-triase"
                category={hasil.triage.category}
                title={
                  hasil.triage.atypical
                    ? "Periksa citra: pastikan rontgen dada"
                    : hasil.triage.title ||
                      (hasil.triage.category === "MERAH"
                        ? "Rujuk segera"
                        : hasil.triage.category === "KUNING"
                        ? "Perlu pemeriksaan lanjutan"
                        : "Tidak ditemukan tanda TBC")
                }
                isAtypical={hasil.triage.atypical}
              />

              {/* Anjuran */}
              <div className="w-full flex flex-col">
                <span className="text-muted text-xs font-bold font-atkinson uppercase tracking-wide">
                  Anjuran
                </span>
                <div
                  id="teks-anjuran-triase"
                  className="pt-1 text-ink text-lg font-bold font-atkinson leading-6"
                >
                  {hasil.triage.action}
                </div>
              </div>

              {/* Pernyataan Wajib Alat Bantu */}
              <div className="w-full px-3.5 py-2.5 bg-status-neutral rounded-[10px] border border-line flex items-center gap-2.5">
                <svg className="size-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-muted text-xs font-normal font-atkinson leading-5">
                  Hasil AI adalah alat bantu triase, bukan diagnosis. Keputusan klinis tetap di tangan dokter.
                </p>
              </div>

              {/* Bagian Grid: Skor AI & Alasan (Kiri) vs Tinjauan Dokter (Kanan) */}
              <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-5 items-start pt-1">
                {/* Subkolom Kiri: Kartu Skor AI, Alasan, Peringatan */}
                <div className="md:col-span-7 flex flex-col gap-3">
                  {/* Kartu Skor AI */}
                  <div className="w-full p-4 bg-white rounded-2xl border border-line flex flex-col shadow-xs">
                    <div className="w-full flex justify-between items-center">
                      <span className="text-muted text-xs font-bold font-atkinson uppercase tracking-wide">
                        Skor AI
                      </span>
                      <div className="h-6 px-2.5 bg-status-neutral rounded-full border border-line flex items-center">
                        <span className="text-muted text-xs font-bold font-atkinson tracking-wide">
                          Tingkat skor:{" "}
                          {(() => {
                            const lvl = String(hasil.triage.ai_level || "").toLowerCase();
                            if (lvl === "high" || lvl === "tinggi") return "Tinggi";
                            if (lvl === "mid" || lvl === "sedang") return "Sedang";
                            return "Rendah";
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Nilai Skor */}
                    <div className="pt-1.5 flex flex-col">
                      {hasil.triage.atypical ? (
                        <>
                          <div className="flex items-baseline gap-2">
                            <span
                              id="nilai-skor-ai"
                              className="text-ink text-4xl font-semibold font-mono leading-10"
                            >
                              {hasil.prob_tb.toFixed(2).replace(".", ",")}
                            </span>
                            <span
                              id="tanda-skor-atipikal"
                              className="text-muted text-3xl font-normal font-mono leading-none"
                            >
                              (?)
                            </span>
                          </div>
                          <span
                            id="keterangan-skor-atipikal"
                            className="text-muted text-sm font-normal font-atkinson pt-0.5"
                          >
                            Skor kurang bisa dipercaya untuk citra ini
                          </span>
                        </>
                      ) : (
                        <span
                          id="nilai-skor-ai"
                          className="text-ink text-4xl font-semibold font-mono leading-10"
                        >
                          {hasil.prob_tb.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>

                    {/* Bilah 0 - 1 */}
                    <div className="w-full pt-2.5">
                      <div className="w-full h-2 bg-line rounded-full overflow-hidden relative">
                        <div
                          id="bilah-skor-ai"
                          className={`h-full rounded-full transition-all duration-300 ${
                            hasil.triage.atypical ? "bg-line-strong" : "bg-ink"
                          }`}
                          style={{
                            width: `${Math.min(Math.max(hasil.prob_tb * 100, 0), 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-full pt-1 flex justify-between items-center text-muted text-xs font-medium font-mono">
                      <span>0</span>
                      <span>0,5</span>
                      <span>1</span>
                    </div>
                  </div>

                  {/* Daftar Alasan */}
                  <div className="w-full flex flex-col">
                    <span className="text-muted text-xs font-bold font-atkinson uppercase tracking-wide">
                      Alasan
                    </span>
                    <div id="daftar-alasan-triase" className="pt-1.5 flex flex-col gap-1">
                      {hasil.triage.reasons &&
                        hasil.triage.reasons.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-ink text-base font-normal font-atkinson leading-5"
                          >
                            <span className="text-ink shrink-0 leading-5 select-none">•</span>
                            <span>{r}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Peringatan (Jika Ada) */}
                  {hasil.warnings && hasil.warnings.length > 0 && (
                    <div className="w-full flex flex-col gap-1.5">
                      <span className="text-muted text-xs font-bold font-atkinson uppercase tracking-wide">
                        Peringatan
                      </span>
                      <div id="daftar-peringatan-triase" className="flex flex-col gap-2">
                        {hasil.warnings.map((w, i) => (
                          <div
                            key={i}
                            className="w-full px-3 py-2 bg-status-neutral rounded-[10px] border border-line flex items-start gap-2.5"
                          >
                            <svg className="size-4 text-ink shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="9" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span className="text-ink text-sm font-normal font-atkinson leading-5">
                              {w}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subkolom Kanan: Kartu Tinjauan Dokter */}
                <div className="md:col-span-5 flex flex-col">
                  {!tinjauanTersimpan ? (
                    /* State A: Tinjauan Belum Disimpan */
                    <div className="w-full p-5 bg-white rounded-2xl border border-line flex flex-col gap-3 shadow-xs">
                      <h3 className="text-ink text-xl font-bold font-atkinson leading-6">
                        Tinjauan dokter
                      </h3>
                      <p className="text-muted text-base font-normal font-atkinson leading-5">
                        Apakah dokter setuju dengan hasil AI?
                      </p>

                      {/* Segmented Control Setuju / Tidak Setuju */}
                      <div className="w-full h-11 rounded-[10px] border border-line-strong flex overflow-hidden bg-white">
                        <button
                          type="button"
                          id="btn-tinjau-setuju"
                          onClick={() => setPilihanTinjauan("setuju")}
                          className={`flex-1 h-full border-r border-line-strong flex items-center justify-center gap-2 font-atkinson text-base transition-colors cursor-pointer ${
                            pilihanTinjauan === "setuju"
                              ? "bg-primary text-white font-bold"
                              : "text-ink font-normal hover:bg-bg"
                          }`}
                        >
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Setuju</span>
                        </button>
                        <button
                          type="button"
                          id="btn-tinjau-tidak-setuju"
                          onClick={() => setPilihanTinjauan("tidak_setuju")}
                          className={`flex-1 h-full flex items-center justify-center gap-2 font-atkinson text-base transition-colors cursor-pointer ${
                            pilihanTinjauan === "tidak_setuju"
                              ? "bg-primary text-white font-bold"
                              : "text-ink font-normal hover:bg-bg"
                          }`}
                        >
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Tidak setuju</span>
                        </button>
                      </div>

                      {/* Catatan Dokter (Opsional) */}
                      <div className="flex flex-col gap-1.5 pt-1">
                        <label htmlFor="input-catatan-dokter" className="text-sm font-atkinson">
                          <span className="text-ink font-bold">Catatan dokter </span>
                          <span className="text-muted font-normal">(opsional)</span>
                        </label>
                        <textarea
                          id="input-catatan-dokter"
                          value={catatanDokter}
                          onChange={(e) => setCatatanDokter(e.target.value)}
                          placeholder="Tulis catatan klinis tambahan..."
                          className="w-full h-14 p-2.5 bg-white rounded-md border border-line-strong text-ink text-sm font-atkinson focus:border-primary focus:outline-none resize-none"
                        />
                      </div>

                      {/* Tombol Simpan Tinjauan */}
                      <button
                        type="button"
                        id="btn-simpan-tinjauan"
                        disabled={!pilihanTinjauan || savingTinjauan}
                        onClick={simpanTinjauan}
                        className={`w-full h-11 px-5 rounded-[10px] text-base font-bold font-atkinson flex items-center justify-center transition-all ${
                          !pilihanTinjauan || savingTinjauan
                            ? "bg-line text-muted cursor-not-allowed"
                            : "bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-xs"
                        }`}
                      >
                        {savingTinjauan ? "Menyimpan..." : "Simpan tinjauan"}
                      </button>

                      {/* Tautan Draf Surat Rujukan (PDF) */}
                      <a
                        id="link-draf-rujukan-pdf"
                        href={`${API}/pemeriksaan/${hasil.id}/rujukan.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/90 hover:underline text-sm font-bold font-atkinson pt-1"
                      >
                        <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Lihat draf surat rujukan (PDF)</span>
                      </a>
                    </div>
                  ) : (
                    /* State B: Tinjauan Tersimpan */
                    <div className="w-full p-5 bg-white rounded-2xl border border-primary flex flex-col gap-3 shadow-xs animate-in fade-in">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 bg-primary rounded-full flex items-center justify-center text-white shrink-0">
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h3 className="text-ink text-xl font-bold font-atkinson leading-6">
                          Tinjauan tersimpan
                        </h3>
                      </div>

                      <div id="teks-status-tinjauan" className="text-ink text-base font-normal font-atkinson">
                        Dokter:{" "}
                        <strong className="font-bold">
                          {tinjauanTersimpan.keputusan === "setuju" ? "Setuju" : "Tidak setuju"}
                        </strong>{" "}
                        dengan hasil AI
                      </div>

                      {tinjauanTersimpan.catatan ? (
                        <div
                          id="kotak-catatan-dokter-tersimpan"
                          className="w-full px-3 py-2.5 bg-status-neutral rounded-[10px] border border-line flex flex-col gap-0.5"
                        >
                          <span className="text-muted text-xs font-bold font-atkinson uppercase tracking-wide">
                            Catatan dokter
                          </span>
                          <span className="text-ink text-sm font-normal font-atkinson leading-5 whitespace-pre-wrap">
                            {tinjauanTersimpan.catatan}
                          </span>
                        </div>
                      ) : null}

                      <div className="text-muted text-sm font-medium font-mono">
                        {formatTanggalJam(tinjauanTersimpan.tanggal)}
                      </div>

                      <a
                        id="btn-buka-surat-rujukan"
                        href={`${API}/pemeriksaan/${hasil.id}/rujukan.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full h-11 px-5 bg-primary hover:bg-primary/90 text-white rounded-[10px] flex items-center justify-center gap-2 text-base font-bold font-atkinson transition-colors shadow-xs cursor-pointer"
                      >
                        <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Buka surat rujukan (PDF)</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
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
