"""Penerbit Lisensi PulmoTriage (tampilan sederhana, tinggal pilih).

Pilih provinsi -> kabupaten/kota -> Puskesmas -> masa berlaku, lalu klik Terbitkan.
Tidak ada kode atau nama yang diketik, jadi tidak ada salah ketik.

Jalankan dengan klik dua kali penerbit-lisensi.bat, atau:
    python scripts/lisensi/penerbit_lisensi_gui.py

Data:
  data/puskesmas.csv            daftar Puskesmas (Komdat Kemenkes, tahun 2021) + kode lisensi yang sudah dibekukan
  data/puskesmas_tambahan.csv   opsional, untuk Puskesmas yang belum ada di daftar (lihat data/README.md)

Butuh kunci_rahasia.pem di folder ini (hanya ada di laptop tim).
Hasil disimpan di keluaran/lisensi-<KODE>.json, sama seperti versi baris perintah.
"""

import csv
import json
import os
import subprocess
import sys
import tkinter as tk
from collections import defaultdict
from datetime import date, datetime, timedelta
from tkinter import messagebox, ttk

DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, DIR)
import terbitkan_lisensi as tl  # noqa: E402

DATA = os.path.join(DIR, "data", "puskesmas.csv")
TAMBAHAN = os.path.join(DIR, "data", "puskesmas_tambahan.csv")
TEAL = "#0B7A85"
BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
MASA = {"1 tahun": 1, "2 tahun": 2, "3 tahun": 3}


def tgl(d: date) -> str:
    return f"{d.day} {BULAN[d.month - 1]} {d.year}"


def tambah_tahun(awal: date, n: int) -> date:
    try:
        akhir = awal.replace(year=awal.year + n)
    except ValueError:  # 29 Februari
        akhir = date(awal.year + n, 2, 28)
    return akhir - timedelta(days=1)


def muat_data():
    """Kembalikan (daftar Puskesmas, pesan galat). Setiap Puskesmas: dict dengan kode_puskesmas, nama, dst."""
    if not os.path.exists(DATA):
        return [], f"File data tidak ditemukan:\n{DATA}"
    with open(DATA, encoding="utf-8", newline="") as f:
        semua = [dict(r, tambahan=False) for r in csv.DictReader(f)]
    galat = []
    if os.path.exists(TAMBAHAN):
        kab = {r["kode_wilayah"]: (r["kab_kota"], r["provinsi"]) for r in semua}
        dipakai = {r["kode_puskesmas"] for r in semua}
        with open(TAMBAHAN, encoding="utf-8-sig", newline="") as f:
            for i, r in enumerate(csv.DictReader(f), start=2):
                try:
                    kw, nomor, nama = r["kode_wilayah"].strip(), int(r["nomor"]), r["nama"].strip()
                except (KeyError, ValueError, AttributeError):
                    galat.append(f"baris {i}: kolom harus kode_wilayah,nomor,nama")
                    continue
                pid = f"{kw}-{nomor:03d}"
                if kw not in kab:
                    galat.append(f"baris {i}: kode kab/kota {kw} tidak dikenal")
                elif not (1 <= nomor <= 999) or pid in dipakai:
                    galat.append(f"baris {i}: kode {pid} sudah dipakai atau nomor tidak sah")
                elif not nama:
                    galat.append(f"baris {i}: nama kosong")
                else:
                    dipakai.add(pid)
                    semua.append({"kode_puskesmas": pid, "kode_wilayah": kw, "nomor": str(nomor), "nama": nama,
                                  "kab_kota": kab[kw][0], "provinsi": kab[kw][1], "tambahan": True})
    return semua, ("puskesmas_tambahan.csv bermasalah:\n" + "\n".join(galat[:10])) if galat else None


def muat_kunci():
    try:
        with open(tl.RAHASIA, "rb") as f:
            return tl.load_pem_private_key(f.read(), password=None)
    except FileNotFoundError:
        return None


def daftar_terbit():
    """Lisensi di folder keluaran: {kode: data}."""
    hasil = {}
    if os.path.isdir(tl.KELUARAN):
        for nama in os.listdir(tl.KELUARAN):
            if nama.startswith("lisensi-") and nama.endswith(".json"):
                try:
                    with open(os.path.join(tl.KELUARAN, nama), encoding="utf-8") as f:
                        d = json.load(f)
                    hasil[d["puskesmas_id"]] = d
                except (OSError, ValueError, KeyError):
                    continue
    return hasil


class Aplikasi(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Penerbit Lisensi PulmoTriage")
        self.minsize(820, 680)
        self.kunci = muat_kunci()
        self.data, galat_data = muat_data()
        self.per_prov = defaultdict(lambda: defaultdict(list))  # provinsi -> kab_kota -> [pkm]
        self.kode_kab = {}
        for r in self.data:
            self.per_prov[r["provinsi"]][r["kab_kota"]].append(r)
            self.kode_kab[r["kab_kota"]] = r["kode_wilayah"]
        self.urut_prov = sorted(self.per_prov, key=lambda p: min(r["kode_wilayah"] for k in self.per_prov[p].values() for r in k))
        self.terbit = daftar_terbit()

        gaya = ttk.Style(self)
        for t in ("vista", "clam"):
            if t in gaya.theme_names():
                gaya.theme_use(t)
                break
        gaya.configure("Judul.TLabel", font=("Segoe UI", 15, "bold"))
        gaya.configure("Kode.TLabel", font=("Consolas", 13, "bold"), foreground=TEAL)
        gaya.configure("Kecil.TLabel", foreground="#5B6B6E")
        gaya.configure("Merah.TLabel", foreground="#B32B24")
        gaya.configure("Treeview", rowheight=24)

        utama = ttk.Frame(self, padding=16)
        utama.pack(fill="both", expand=True)
        utama.columnconfigure(0, weight=1)
        utama.rowconfigure(2, weight=3)
        utama.rowconfigure(3, weight=2)

        ttk.Label(utama, text="Penerbit Lisensi PulmoTriage", style="Judul.TLabel").grid(row=0, column=0, sticky="w")
        if self.kunci is None:
            info, gaya_info = "Kunci rahasia belum ada di folder ini. Jalankan dulu: python scripts/lisensi/buat_kunci.py", "Merah.TLabel"
        elif not self.data:
            info, gaya_info = galat_data, "Merah.TLabel"
        else:
            info = (f"{len(self.data):,} Puskesmas di {len(self.kode_kab)} kab/kota. Data Puskesmas: Komdat Kemenkes 2021; "
                    "kab/kota: Kepmendagri 2025.").replace(",", ".")
            gaya_info = "Kecil.TLabel"
        ttk.Label(utama, text=info, style=gaya_info, wraplength=760).grid(row=1, column=0, sticky="w", pady=(2, 8))

        self._formulir(utama)
        self._tabel(utama)
        self.muat_tabel()
        if galat_data and self.data:
            self.after(200, lambda: messagebox.showwarning("Data tambahan", galat_data))
        if self.urut_prov:
            self.c_prov.current(0)
            self.ganti_prov()

    # ---------- formulir ----------
    def _formulir(self, induk):
        f = ttk.LabelFrame(induk, text=" Terbitkan lisensi ", padding=12)
        f.grid(row=2, column=0, sticky="nsew")
        f.columnconfigure(1, weight=1)
        f.rowconfigure(3, weight=1)

        ttk.Label(f, text="1. Provinsi").grid(row=0, column=0, sticky="w", padx=(0, 10), pady=4)
        self.c_prov = ttk.Combobox(f, values=self.urut_prov, state="readonly", height=20)
        self.c_prov.grid(row=0, column=1, sticky="ew", pady=4)
        self.c_prov.bind("<<ComboboxSelected>>", lambda _e: self.ganti_prov())

        ttk.Label(f, text="2. Kabupaten/Kota").grid(row=1, column=0, sticky="w", padx=(0, 10), pady=4)
        self.c_kab = ttk.Combobox(f, state="readonly", height=20)
        self.c_kab.grid(row=1, column=1, sticky="ew", pady=4)
        self.c_kab.bind("<<ComboboxSelected>>", lambda _e: self.isi_puskesmas())

        ttk.Label(f, text="3. Puskesmas").grid(row=2, column=0, sticky="nw", padx=(0, 10), pady=4)
        atas = ttk.Frame(f)
        atas.grid(row=2, column=1, sticky="ew", pady=4)
        atas.columnconfigure(1, weight=1)
        ttk.Label(atas, text="Cari (opsional):", style="Kecil.TLabel").grid(row=0, column=0, sticky="w")
        self.v_cari = tk.StringVar()
        self.v_cari.trace_add("write", lambda *_: self.isi_puskesmas())
        ttk.Entry(atas, textvariable=self.v_cari).grid(row=0, column=1, sticky="ew", padx=(6, 0))

        daftar = ttk.Frame(f)
        daftar.grid(row=3, column=1, sticky="nsew")
        daftar.columnconfigure(0, weight=1)
        daftar.rowconfigure(0, weight=1)
        self.t_pkm = ttk.Treeview(daftar, columns=("kode", "nama", "status"), show="headings", selectmode="extended", height=9)
        for k, judul, lebar in [("kode", "Kode", 90), ("nama", "Nama Puskesmas", 300), ("status", "Lisensi", 200)]:
            self.t_pkm.heading(k, text=judul)
            self.t_pkm.column(k, width=lebar, anchor="w", stretch=(k != "kode"))
        self.t_pkm.tag_configure("ada", foreground="#5B6B6E")
        g = ttk.Scrollbar(daftar, orient="vertical", command=self.t_pkm.yview)
        self.t_pkm.configure(yscrollcommand=g.set)
        self.t_pkm.grid(row=0, column=0, sticky="nsew")
        g.grid(row=0, column=1, sticky="ns")
        self.t_pkm.bind("<<TreeviewSelect>>", lambda _e: self.perbarui_ringkasan())
        self.l_jumlah = ttk.Label(f, text="", style="Kecil.TLabel", wraplength=640)
        self.l_jumlah.grid(row=4, column=1, sticky="w", pady=(4, 0))

        ttk.Label(f, text="4. Masa berlaku").grid(row=5, column=0, sticky="w", padx=(0, 10), pady=(10, 4))
        baris = ttk.Frame(f)
        baris.grid(row=5, column=1, sticky="w", pady=(10, 4))
        self.c_masa = ttk.Combobox(baris, values=list(MASA), state="readonly", width=10)
        self.c_masa.current(0)
        self.c_masa.pack(side="left")
        self.c_masa.bind("<<ComboboxSelected>>", lambda _e: self.perbarui_ringkasan())
        self.l_masa = ttk.Label(baris, text="", style="Kecil.TLabel")
        self.l_masa.pack(side="left", padx=(10, 0))

        bawah = ttk.Frame(f)
        bawah.grid(row=6, column=0, columnspan=2, sticky="ew", pady=(12, 0))
        bawah.columnconfigure(0, weight=1)
        self.l_ringkas = ttk.Label(bawah, text="Pilih Puskesmas di daftar.", style="Kode.TLabel")
        self.l_ringkas.grid(row=0, column=0, sticky="w")
        self.b_terbit = ttk.Button(bawah, text="Terbitkan lisensi", command=self.terbitkan)
        self.b_terbit.grid(row=0, column=1, sticky="e")
        self.b_terbit.state(["disabled"])

    # ---------- tabel lisensi yang sudah terbit ----------
    def _tabel(self, induk):
        f = ttk.LabelFrame(induk, text=" Lisensi yang sudah diterbitkan (folder keluaran) ", padding=12)
        f.grid(row=3, column=0, sticky="nsew", pady=(12, 0))
        f.columnconfigure(0, weight=1)
        f.rowconfigure(0, weight=1)
        kolom = [("kode", "Kode", 90), ("nama", "Nama Puskesmas", 220), ("kab", "Kab/Kota", 190),
                 ("sampai", "Berlaku sampai", 110), ("terbit", "Diterbitkan", 130)]
        self.t_terbit = ttk.Treeview(f, columns=[k for k, _, _ in kolom], show="headings", height=5)
        for k, judul, lebar in kolom:
            self.t_terbit.heading(k, text=judul)
            self.t_terbit.column(k, width=lebar, anchor="w")
        g = ttk.Scrollbar(f, orient="vertical", command=self.t_terbit.yview)
        self.t_terbit.configure(yscrollcommand=g.set)
        self.t_terbit.grid(row=0, column=0, sticky="nsew")
        g.grid(row=0, column=1, sticky="ns")
        self.t_terbit.bind("<Double-1>", lambda _e: self.lompat_ke_terpilih())
        tombol = ttk.Frame(f)
        tombol.grid(row=1, column=0, columnspan=2, sticky="ew", pady=(8, 0))
        ttk.Button(tombol, text="Buka folder hasil", command=self.buka_folder).pack(side="left")
        ttk.Label(tombol, text="Klik dua kali baris untuk memilihnya di atas (misalnya untuk perpanjang).",
                  style="Kecil.TLabel").pack(side="right")

    # ---------- alur pilih ----------
    def ganti_prov(self):
        kab = self.per_prov[self.c_prov.get()]
        urut = sorted(kab, key=lambda k: self.kode_kab[k])
        self.c_kab.configure(values=urut)
        self.c_kab.set("")
        if urut:
            self.c_kab.current(0)
        self.isi_puskesmas()

    def isi_puskesmas(self):
        self.t_pkm.delete(*self.t_pkm.get_children())
        daftar = self.per_prov[self.c_prov.get()].get(self.c_kab.get(), [])
        cari = self.v_cari.get().strip().lower()
        tampil = [r for r in daftar if cari in r["nama"].lower() or cari in r["kode_puskesmas"]]
        for r in tampil:
            pid = r["kode_puskesmas"]
            d = self.terbit.get(pid)
            status = f"ada, s.d. {d['berlaku_sampai']}" if d else ""
            if d and d.get("nama") != r["nama"]:
                status += f" (atas nama {d.get('nama')})"
            nama = r["nama"] + ("  [tambahan]" if r["tambahan"] else "")
            self.t_pkm.insert("", "end", iid=pid, values=(pid, nama, status), tags=("ada",) if d else ())
        if not daftar:
            teks = ("Data Puskesmas untuk kab/kota ini tidak ditemukan. Hubungi tim untuk menambahkannya di "
                    "data/puskesmas_tambahan.csv.")
        elif not tampil:
            teks = "Tidak ada yang cocok dengan pencarian."
        else:
            teks = (f"{len(daftar)} Puskesmas di {self.c_kab.get()}. Bisa pilih lebih dari satu (Ctrl/Shift + klik). "
                    "Tidak ada di daftar? Data Puskesmas dari 2021; Puskesmas yang lebih baru perlu ditambahkan "
                    "tim di data/puskesmas_tambahan.csv.")
        self.l_jumlah.configure(text=teks)
        self.perbarui_ringkasan()

    def terpilih(self):
        by_kode = {r["kode_puskesmas"]: r for r in self.data}
        return [by_kode[i] for i in self.t_pkm.selection() if i in by_kode]

    def rentang(self):
        mulai = date.today()
        return mulai, tambah_tahun(mulai, MASA[self.c_masa.get()])

    def perbarui_ringkasan(self):
        mulai, sampai = self.rentang()
        self.l_masa.configure(text=f"{tgl(mulai)} s.d. {tgl(sampai)}")
        pilih = self.terpilih()
        if not pilih:
            self.l_ringkas.configure(text="Pilih Puskesmas di daftar.")
            self.b_terbit.state(["disabled"])
            return
        if len(pilih) == 1:
            self.l_ringkas.configure(text=f"{pilih[0]['kode_puskesmas']}  {pilih[0]['nama']}")
        else:
            self.l_ringkas.configure(text=f"{len(pilih)} Puskesmas dipilih")
        self.b_terbit.state(["!disabled"] if self.kunci is not None else ["disabled"])

    # ---------- terbitkan ----------
    def terbitkan(self):
        pilih = self.terpilih()
        if not pilih or self.kunci is None:
            return
        mulai, sampai = self.rentang()
        sudah = [r for r in pilih if r["kode_puskesmas"] in self.terbit]
        daftar_teks = "\n".join(f"  {r['kode_puskesmas']}  {r['nama']}" for r in pilih[:12])
        if len(pilih) > 12:
            daftar_teks += f"\n  ... dan {len(pilih) - 12} lainnya"
        pesan = (f"Terbitkan {len(pilih)} lisensi?\n\n{daftar_teks}\n\n{pilih[0]['kab_kota']}, {pilih[0]['provinsi']}\n"
                 f"Berlaku {tgl(mulai)} s.d. {tgl(sampai)}")
        if sudah:
            pesan += (f"\n\n{len(sudah)} di antaranya sudah punya lisensi. Lisensi baru menggantikan yang lama dan "
                      "perlu diaktifkan sekali lagi (butuh internet) di komputer Puskesmas. Kalau komputernya sama, "
                      "lepas dulu aktivasi lamanya di layanan cloud (DELETE /lisensi/aktivasi/<kode>).")
        if not messagebox.askyesno("Konfirmasi", pesan):
            return

        gagal = []
        for r in pilih:
            try:
                tl.terbitkan(self.kunci, r["kode_wilayah"], int(r["nomor"]), r["provinsi"], r["kab_kota"], r["nama"],
                             sampai.isoformat(), mulai.isoformat())
            except SystemExit as e:  # terbitkan() memakai sys.exit untuk pesan galat
                gagal.append(f"{r['kode_puskesmas']}: {e.code}")
        self.terbit = daftar_terbit()
        self.muat_tabel(pilih=[r["kode_puskesmas"] for r in pilih])
        kode_terpilih = [r["kode_puskesmas"] for r in pilih]
        self.isi_puskesmas()
        for k in kode_terpilih:
            if self.t_pkm.exists(k):
                self.t_pkm.selection_add(k)
        jadi = len(pilih) - len(gagal)
        if gagal:
            messagebox.showwarning("Sebagian gagal", f"{jadi} lisensi dibuat.\n\nGagal:\n" + "\n".join(gagal[:10]))
        elif messagebox.askyesno("Berhasil", f"{jadi} lisensi dibuat di folder keluaran.\n"
                                             "Kirim file lisensi-<kode>.json ke Puskesmas masing-masing.\n\n"
                                             "Buka foldernya sekarang?"):
            self.buka_folder()

    # ---------- lainnya ----------
    def muat_tabel(self, pilih=None):
        self.t_terbit.delete(*self.t_terbit.get_children())
        for d in sorted(self.terbit.values(), key=lambda d: d.get("diterbitkan", ""), reverse=True):
            terbit = d.get("diterbitkan", "")
            try:
                terbit = datetime.fromisoformat(terbit).strftime("%Y-%m-%d %H:%M")
            except ValueError:
                pass
            self.t_terbit.insert("", "end", iid=d["puskesmas_id"], values=(
                d["puskesmas_id"], d.get("nama", ""), d.get("kab_kota", ""), d.get("berlaku_sampai", ""), terbit))
        for k in pilih or []:
            if self.t_terbit.exists(k):
                self.t_terbit.selection_add(k)
                self.t_terbit.see(k)

    def lompat_ke_terpilih(self):
        sel = self.t_terbit.selection()
        r = next((x for x in self.data if sel and x["kode_puskesmas"] == sel[0]), None)
        if not r:
            messagebox.showinfo("Tidak ada di daftar", "Kode ini tidak ada di data Puskesmas (mungkin lisensi lama "
                                                     "yang diterbitkan manual).")
            return
        self.v_cari.set("")
        self.c_prov.set(r["provinsi"])
        self.ganti_prov()
        self.c_kab.set(r["kab_kota"])
        self.isi_puskesmas()
        self.t_pkm.selection_set(r["kode_puskesmas"])
        self.t_pkm.see(r["kode_puskesmas"])

    def buka_folder(self):
        os.makedirs(tl.KELUARAN, exist_ok=True)
        if sys.platform == "win32":
            os.startfile(tl.KELUARAN)  # noqa: S606
        elif sys.platform == "darwin":
            subprocess.Popen(["open", tl.KELUARAN])
        else:
            subprocess.Popen(["xdg-open", tl.KELUARAN])


if __name__ == "__main__":
    Aplikasi().mainloop()
