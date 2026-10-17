---
version: alpha
name: PulmoTriage
description: Alat bantu triase TBC dari rontgen dada untuk Puskesmas. Alat kerja, bukan landing page atau portfolio.
colors:
  # Terang (default). Palet P1 Toska Puskesmas
  bg: "#F3F7F7"
  surface: "#FFFFFF"
  ink: "#10292C"
  muted: "#55706F"
  primary: "#0B7A85"
  on-primary: "#FFFFFF"
  line: "#D5E2E3"
  line-strong: "#7A9293"
  # Triase, terang
  triage-merah: "#C62828"
  on-triage-merah: "#FFFFFF"
  triage-kuning: "#F2B705"
  on-triage-kuning: "#1F1600"
  triage-hijau: "#2E7D32"
  on-triage-hijau: "#FFFFFF"
  # Teks triase di atas surface (kuning tidak boleh jadi warna teks)
  text-merah: "#B3261E"
  text-kuning: "#7A5300"
  text-hijau: "#24692A"
  # Status non-triase
  status-error: "#7A2E8A"
  status-error-bg: "#F7EEF8"
  status-info-bg: "#E7F3F4"
  status-neutral: "#EEF2F2"
  # Gelap (night mode)
  dark-bg: "#0D1719"
  dark-surface: "#142225"
  dark-ink: "#E3EEEE"
  dark-muted: "#9DB5B5"
  dark-primary: "#4CC3CD"
  dark-on-primary: "#04211F"
  dark-line: "#27393C"
  dark-line-strong: "#5E7A7D"
  dark-triage-merah: "#F26B6B"
  dark-on-triage-merah: "#1A0505"
  dark-triage-kuning: "#F5C84B"
  dark-on-triage-kuning: "#1A1300"
  dark-triage-hijau: "#57C785"
  dark-on-triage-hijau: "#04170D"
typography:
  display:
    fontFamily: Fraunces
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.02em
  h1:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.01em
  h2:
    fontFamily: Fraunces
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
  h3:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 13px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0.04em
  triage:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 22px
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: 0.02em
  mono:
    fontFamily: Atkinson Hyperlegible Mono
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
  score:
    fontFamily: Atkinson Hyperlegible Mono
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1
rounded:
  sm: 6px
  md: 10px
  lg: 16px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 44px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 44px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 10px 12px
    height: 44px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
  triage-band-merah:
    backgroundColor: "{colors.triage-merah}"
    textColor: "{colors.on-triage-merah}"
    typography: "{typography.triage}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  triage-band-kuning:
    backgroundColor: "{colors.triage-kuning}"
    textColor: "{colors.on-triage-kuning}"
    typography: "{typography.triage}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  triage-band-hijau:
    backgroundColor: "{colors.triage-hijau}"
    textColor: "{colors.on-triage-hijau}"
    typography: "{typography.triage}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  chip:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
---

# PulmoTriage DESIGN.md

Format: F4 (token YAML mengikuti spesifikasi Google Stitch DESIGN.md, ditambah bagian khusus PulmoTriage). Cek dengan:

```
npx @google/design.md lint DESIGN.md
npx @google/design.md export --format css-tailwind DESIGN.md
```

Hasil lint saat dibuat: 0 error. Ada 19 peringatan "orphaned-tokens" untuk token gelap (`dark-*`), garis, dan teks triase. Itu wajar: token tersebut dipakai lewat CSS variable dan mode gelap, bukan lewat komponen di YAML.

## Overview

PulmoTriage membantu petugas Puskesmas memilah pasien terduga TBC dari rontgen dada. Pengguna utama: petugas dan dokter Puskesmas yang sibuk, di laptop sederhana, sering tanpa internet. Pengguna kedua: Dinkes, lewat dasbor.

Arah visual hasil voting tim:

- Palet: P1 Toska Puskesmas (3 dari 3 suara)
- Gaya dasar: S10 Editorial Data. Kertas tenang, garis tipis 1px, judul serif, angka besar, grafik beranotasi.
- Gaya pendamping: S7 Kaca, hanya untuk lapisan yang mengambang (header lengket dengan bar sinkron, pop-up, toast). Tidak dipakai untuk kartu hasil atau tabel.
- Struktur halaman, kartu hasil, dan dasbor: mengikuti wireframe Figma. Wireframe hanya bagian utama; layar dan keadaan lain ditambahkan sesuai kebutuhan aplikasi.

Prinsip:

1. Kategori triase dibaca dalam 2 detik: warna + teks + ikon, selalu bertiga.
2. Satu hal per layar (3 langkah: Data Pasien, Unggah Citra, Hasil).
3. Jujur soal batas AI. Ini alat bantu, bukan diagnosis.
4. Tetap jalan di laptop Puskesmas: efek ringan, font disimpan lokal, tanpa CDN saat dipakai.

## Colors

Toska P1 adalah warna merek dan aksi (tombol, tautan, langkah aktif). Merah, kuning, dan hijau hanya untuk triase. Jangan pakai ketiganya untuk hiasan, tombol biasa, atau status lain.

| Token | Terang | Gelap | Dipakai untuk |
|---|---|---|---|
| bg | #F3F7F7 | #0D1719 | latar halaman |
| surface | #FFFFFF | #142225 | kartu, panel, input |
| ink | #10292C | #E3EEEE | teks utama |
| muted | #55706F | #9DB5B5 | teks pendukung, label |
| primary | #0B7A85 | #4CC3CD | tombol utama, tautan, fokus |
| line | #D5E2E3 | #27393C | garis pemisah (hiasan) |
| line-strong | #7A9293 | #5E7A7D | border input, checkbox, batas yang harus terlihat |

Kontras sudah dicek (WCAG): teks utama di atas 13:1, teks muted di atas 4.9:1, toska di atas surface 5.1:1 (terang) dan 7.8:1 (gelap).

### Semantik triase

| Kategori | Warna isi | Teks di atasnya | Ikon (Lucide) | Bentuk ikon |
|---|---|---|---|---|
| MERAH | triage-merah | on-triage-merah | octagon-alert | segi delapan |
| KUNING | triage-kuning | on-triage-kuning | triangle-alert | segitiga |
| HIJAU | triage-hijau | on-triage-hijau | circle-check | lingkaran |
| Citra janggal | triage-kuning | on-triage-kuning | scan-search | lingkaran + kaca pembesar |

- Bentuk ikon berbeda supaya kategori terbaca walau buta warna atau dicetak hitam-putih.
- Kuning tidak boleh jadi warna teks di atas putih (kontras 1.8:1). Untuk teks kategori di luar pita, pakai text-merah, text-kuning, text-hijau.
- Nama ikon dicek ulang di lucide.dev saat implementasi.

## Typography

Pilihan tipografi seri (T1, T3, T5, T6, T9 masing-masing 1 suara). Keputusan:

- Judul dan angka besar dasbor: Fraunces (dari T5). Ini pasangan resmi gaya S10 yang menang.
- Isi dan UI: Atkinson Hyperlegible Next (dari T3). Huruf I, l, 1 dan O, 0 mudah dibedakan, penting untuk data medis.
- ID, skor, tanggal, angka tabel: Atkinson Hyperlegible Mono (dari T3), dengan `font-variant-numeric: tabular-nums`.
- T6 (neo-brutal) dan T9 (clay) tidak dipakai karena gayanya tidak terpilih. T1 bisa jadi cadangan bila tim mau satu keluarga font saja.

Aturan:

- Ukuran teks minimum 13px, isi 16px.
- Kategori triase ditulis huruf besar (MERAH, KUNING, HIJAU), ukuran token `triage`.
- Font dimuat lewat `next/font/google` supaya disimpan lokal saat build. Aplikasi tidak boleh bergantung pada Google Fonts saat dipakai di Puskesmas.

## Layout

- Desain utama: desktop 1366x768. Tetap rapi di 1280x720 dan 1024 lebar.
- Struktur halaman mengikuti wireframe Figma (layar a sampai d). Posisi elemen di wireframe adalah acuan, ukurannya mengikuti token di sini.
- Grid 12 kolom, gutter 24px, lebar isi maksimum 1200px, tepi kiri-kanan 32px.
- Header lengket 64px: nama aplikasi, kalimat "Alat bantu triase TBC", bar sinkron, pilihan tema, pilihan bahasa.
- Penanda langkah "Langkah 1 dari 3" di bawah header pada alur Puskesmas.
- Hasil (layar c) harus muat tanpa scroll di 1366x768 sampai kategori, anjuran, dan tombol tinjauan. Rincian boleh di bawah lipatan.
- Sediakan ruang untuk teks bahasa Inggris dan Indonesia: tombol dan label tidak berlebar tetap.

## Elevation & Depth

Gaya editorial itu datar. Kedalaman hanya dari dua hal:

1. Garis 1px (line) untuk memisahkan bagian. Bayangan hampir tidak dipakai.
2. Kaca (S7) untuk lapisan mengambang:
   - Header lengket, panel pop-up, toast.
   - Latar kaca: surface dengan opasitas 85% (terang) atau 88% (gelap), `backdrop-filter: blur(12px) saturate(1.2)`. Opasitas setinggi ini menjaga kontras teks.
   - Tepi kaca: garis 1px putih 60% (terang) atau putih 10% (gelap).
   - Lapisan di belakang pop-up: ink 45%.
   - Bila `prefers-reduced-transparency` aktif atau browser tidak mendukung `backdrop-filter`: pakai surface solid.
   - Jangan pakai kaca di atas rontgen, heatmap, tabel, atau kartu hasil.

## Shapes

- Input dan chip kecil: rounded sm (6px). Tombol dan pita triase: md (10px). Kartu dan pop-up: lg (16px).
- Gambar rontgen dan heatmap: rounded md, tanpa bayangan.
- Area klik minimum 44x44px.

## Components

### Tombol

- Utama: toska, satu per layar (Lanjut, Analisis, Simpan tinjauan).
- Sekunder: surface dengan garis primary.
- Saat proses: teks berubah ("Menganalisis..."), tombol nonaktif, ada indikator putar kecil. Tidak bisa ditekan dua kali.

### Input

- Label di atas kotak, bukan placeholder. Border line-strong. Fokus: cincin 2px primary.
- Umur: input angka, "tahun" sebagai teks di luar kotak.
- Gejala: 6 kotak centang dengan label persis seperti brief ("Batuk lebih dari 2 minggu", "Berat badan turun", "Pernah berobat TBC", dll.).

### Kartu hasil (layar c)

Susunan mengikuti wireframe (c). Isinya:

1. Pita kategori: warna + ikon + "MERAH" + judul (`triage.title`).
2. Anjuran (`triage.action`), satu kalimat, teks tebal biasa.
3. Rontgen dengan heatmap (`heatmap_png`), tombol tampil/sembunyi heatmap.
4. Skor AI (`prob_tb`) dalam font mono besar, 2 angka desimal, format sesuai bahasa (0,87 / 0.87).
5. Alasan (`triage.reasons`) dan peringatan (`warnings`) sebagai daftar.
6. Tinjauan dokter: tombol "Setuju" dan "Tidak setuju", kolom catatan opsional, tombol simpan.
7. Disclaimer (`disclaimer`), selalu terlihat, tidak bisa ditutup.

### Pop-up "Citra ditolak" (R2, 3 dari 3 suara)

- Muncul bila `status` = "rejected".
- Panel kaca di tengah. Judul tenang, bukan merah: "Foto belum bisa dianalisis".
- Dua gambar berdampingan: "Foto Anda" (yang baru diunggah) dan "Contoh yang baik" (gambar contoh tetap yang disimpan di aplikasi).
- Di bawahnya daftar `quality.issues`: ikon, masalah, cara memperbaiki.
- Tombol "Unggah ulang" (utama: menutup pop-up dan mengosongkan citra) dan "Tutup" (sekunder).
- Fokus pindah ke pop-up, Esc menutup, fokus kembali ke tombol unggah.

### Citra janggal (A2, 2 dari 2 suara)

- Kartu KUNING dengan pita "Periksa citra" dan ikon scan-search, jadi beda dari KUNING biasa.
- Heatmap ditampilkan pudar (opasitas 35%) dengan label "Heatmap kurang bisa dipercaya".
- Skor diberi tanda "(?)" dan teks "Skor kurang bisa dipercaya untuk citra ini".

### Bar sinkron

- Di header, latar kaca. Isi: "Menunggu sinkron ke cloud: N" dan tombol "Sinkronkan sekarang".
- Hasil sinkron muncul sebagai toast: "Terkirim N data." / "Belum ada koneksi. Data tetap aman di komputer ini." / "Ditolak oleh server cloud."
- Tanggal terakhir sinkron: tanggal saja, tanpa jam.

### Pilihan tema dan bahasa

- Tema: tombol ikon di header dengan tiga pilihan: Terang, Gelap, Ikuti sistem (ikon sun, moon, monitor).
- Bahasa: tombol "ID / EN" di header (ikon languages).
- Detail perilaku ada di bagian Theme & Language.

### Dasbor (layar d, D1, 2 dari 3 suara)

Mengikuti wireframe (d) dengan isi sesuai brief:

- Pita "DATA SIMULASI" di atas, bergaris diagonal, selalu terlihat.
- Empat angka besar (font display): total, MERAH, KUNING, HIJAU, periode 30 hari. Tiap angka MERAH/KUNING/HIJAU memakai ikon kategorinya.
- Grafik batang bertumpuk per hari (merah, kuning, hijau) dengan sumbu dan label langsung, gaya editorial: garis tipis, anotasi kecil pada puncak.
- Tabel per Puskesmas: MERAH, KUNING, HIJAU, total, % MERAH. Angka rata kanan, font mono.

## Screens

| Layar | Keadaan yang harus dibuat |
|---|---|
| (a) Data Pasien | kosong, terisi, error validasi |
| (b) Unggah Citra | kosong, citra terpilih, menganalisis, pop-up ditolak, error (server mati, file bukan gambar) |
| (c) Hasil | MERAH, KUNING, HIJAU, citra janggal, setelah tinjauan tersimpan (pesan + tautan PDF) |
| (d) Dasbor Dinkes | data terisi, data kosong, gagal memuat |
| (e) Daftar Pemeriksaan | opsional, hanya bila brief punya endpoint daftar |

Layar dan keadaan lain boleh ditambah bila aplikasi membutuhkannya.

## Data → UI

Bentuk respons tidak boleh berubah.

| Field | Tampil sebagai |
|---|---|
| status | "rejected" → pop-up ditolak; selain itu → layar hasil |
| prob_tb | Skor AI, 2 desimal, format angka sesuai bahasa |
| triage.category | pita dan ikon kategori |
| triage.title | judul pada pita |
| triage.action | kalimat anjuran |
| triage.reasons[] | daftar alasan |
| triage.atypical | true → tampilan citra janggal (A2) |
| triage.ai_level | ditampilkan sesuai definisi di brief; jangan diubah jadi "akurasi" |
| warnings[] | daftar peringatan di kartu hasil |
| quality.issues[] | daftar masalah di pop-up ditolak |
| heatmap_png | lapisan heatmap di atas rontgen |
| disclaimer | teks disclaimer, selalu terlihat |
| id | dipakai untuk tinjauan dan PDF |

## Honesty rules

- Disclaimer selalu terlihat di kartu hasil dan PDF.
- Jangan pernah menulis "akurasi 100%", "pasti TBC", atau "diagnosis".
- Sebut "Skor AI", bukan "kemungkinan sakit".
- Istilah orang yang meninjau: "dokter", di semua tempat.
- Dasbor dengan data contoh selalu memakai pita "DATA SIMULASI".

## Theme & Language

### Night mode

- Pilihan: Terang, Gelap, Ikuti sistem. Default: Ikuti sistem.
- Pilihan disimpan di perangkat (localStorage, dibungkus try/catch).
- Tema dipasang sebelum halaman tampil supaya tidak berkedip (misalnya dengan next-themes atau skrip kecil di `<head>`).
- Semua warna lewat CSS variable. Mode gelap memakai token `dark-*`.
- Rontgen dan heatmap tidak diubah warnanya di mode gelap.
- PDF selalu versi terang.

### Language switch

- Bahasa: Indonesia (default) dan Inggris.
- Teks antarmuka diterjemahkan di frontend (misalnya next-intl). Atribut `lang` pada `<html>` ikut berubah.
- Angka dan tanggal memakai `Intl` sesuai bahasa (id-ID: 0,87 · en-US: 0.87).
- Kategori di versi Inggris: RED, YELLOW, GREEN.
- Teks dari backend (`triage.title`, `triage.action`, `triage.reasons`, `warnings`, `quality.issues`, `disclaimer`) berbahasa Indonesia. Lihat keputusan di file langkah (Step 6).
- PDF surat rujukan selalu bahasa Indonesia, karena ditujukan ke rumah sakit di Indonesia.

## Motion

- Alur pemeriksaan tenang: transisi 150 sampai 250 ms (fade, geser kecil).
- Satu momen utama di hasil: heatmap muncul perlahan dari atas (600 ms) dan skor menghitung naik.
- Gerak ekspresif (M3, 2 suara) hanya untuk preloader (Step 4) dan halaman sampul bila nanti ada.
- `prefers-reduced-motion`: semua animasi diganti muncul langsung.

## Icons & Imagery

- Ikon: Lucide (`lucide-react`), garis 1.75px. Pilihan ikon seri (I1, I2, I3); Lucide dipilih karena garis tipisnya cocok dengan gaya editorial. Phosphor bisa jadi cadangan.
- Visual utama aplikasi adalah rontgen dan heatmap.
- Foto asli (IL2) hanya bila ada halaman sampul atau tentang, dan diambil sendiri dengan izin. Ikon 3D (IL4) tidak dipakai karena gaya clay tidak terpilih.

## Print / PDF

- Isi minimum surat rujukan mengikuti Permenkes No. 001 Tahun 2012 Pasal 15: identitas pasien, hasil pemeriksaan (anamnesis, pemeriksaan fisik, penunjang), diagnosis kerja, terapi atau tindakan yang sudah diberikan, tujuan rujukan, nama dan tanda tangan tenaga kesehatan.
- Diagnosis kerja diisi dokter, bukan AI.
- Sebelum ditinjau: tanda air "DRAFT". Setelah ditinjau: judul biasa.
- Hitam-putih aman: kategori ditulis dengan teks dan bentuk ikon, bukan warna saja.
- Disclaimer tercetak di bagian bawah.

## Do's and Don'ts

Do:

- Tulis kategori dengan warna, teks, dan ikon sekaligus.
- Ambil teks anjuran, alasan, dan disclaimer dari backend.
- Uji tiap layar di 1366x768, mode terang dan gelap, bahasa ID dan EN.
- Tambah layar atau keadaan yang dibutuhkan walau tidak ada di wireframe.

Don't:

- Pakai merah, kuning, atau hijau untuk hal selain triase.
- Pakai kuning sebagai warna teks di atas latar terang.
- Pasang efek kaca di atas rontgen, heatmap, tabel, atau kartu hasil.
- Memuat font atau ikon dari CDN saat aplikasi dipakai.
- Menyembunyikan disclaimer atau menulis klaim akurasi.

## Lampiran: hasil voting

3 pemilih (kii, jawzy, kaka).

| Kategori | Suara | Dipakai |
|---|---|---|
| Palet | P1 ×3, P3, P10, P12, P16 ×1 | P1 |
| Gaya | S7 ×2, S10 ×2, S3, S13 ×1 | S10 dasar, S7 untuk lapisan mengambang |
| Tipografi | T1, T3, T5, T6, T9 ×1 | Fraunces (T5) + Atkinson Hyperlegible (T3) |
| Struktur | L2 ×3, L5 ×1 | wireframe |
| Kartu hasil | K2 ×2, K3 ×2 | wireframe |
| Ditolak | R2 ×3 | R2 di dalam pop-up |
| Citra janggal | A2 ×2 | A2 |
| Dasbor | D1 ×2, D2, D3 ×1 | wireframe + isi D1 |
| Ikon | I1, I2, I3 ×1 | Lucide (I1) |
| Gerak | M3 ×2, M2 ×1 | M3 untuk preloader/sampul, alur memakai M2 |
| Visual | IL2, IL4 ×1 | IL2 bila ada sampul |
| Format | F4 ×2, F1 ×1 | F4 (sudah termasuk F1) |
