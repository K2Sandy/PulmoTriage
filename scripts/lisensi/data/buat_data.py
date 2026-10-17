"""Membangun data/puskesmas.csv untuk penerbit lisensi. Hanya perlu dijalankan saat memperbarui data.

Sumber (keduanya publik di GitHub):
  - Kode dan nama provinsi/kab/kota: cahyadsn/wilayah, db/wilayah.sql (Kepmendagri No. 300.2.2-2430 Tahun 2025)
  - Daftar Puskesmas: ubunteroz/satu-data, puskesmas.csv (Komdat Kemenkes RI)

Data Puskesmas masih memakai kode kab/kota Papua sebelum pemekaran 2022, jadi kodenya dipindahkan
ke kode baru lewat kecocokan nama kab/kota.

Nomor urut Puskesmas (bagian -NNN di kode lisensi) dibagikan sekali, urut menurut kode Komdat di
dalam tiap kab/kota, lalu DIBEKUKAN di puskesmas.csv. Jangan membangun ulang data setelah lisensi
diterbitkan tanpa memeriksa bahwa nomor lama tidak berubah (skrip ini menolak bila berubah).

    python scripts/lisensi/data/buat_data.py
"""

import csv
import os
import re
import sys
import urllib.request
from collections import defaultdict

DIR = os.path.dirname(os.path.abspath(__file__))
URL_WILAYAH = "https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah.sql"
URL_PKM = "https://raw.githubusercontent.com/ubunteroz/satu-data/main/puskesmas.csv"
URL_WIL_LAMA = "https://raw.githubusercontent.com/ubunteroz/satu-data/main/wilayah_administratif.csv"

NAMA_PROVINSI_PENDEK = {"31": "DKI Jakarta", "34": "DI Yogyakarta"}
TETAP_BESAR = {"I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII",
               "UPT", "UPTD", "DTP", "PKM", "BLUD", "TT", "RI", "NTT", "NTB", "TNI", "POLRI"}


def unduh(url):
    with urllib.request.urlopen(url, timeout=120) as r:
        return r.read().decode("utf-8")


def rapikan(nama):
    """PUSKESMAS KUTA ALAM -> Puskesmas Kuta Alam (angka romawi dan singkatan tetap kapital)."""
    n = re.sub(r"\s+", " ", nama.strip()).lower()
    n = re.sub(r"(^|[\s\-./(])([a-z])", lambda m: m.group(1) + m.group(2).upper(), n)
    return " ".join(k.upper() if k.strip("().,-'").upper() in TETAP_BESAR else k for k in n.split(" "))


def kunci_nama(n):
    n = n.lower()
    n = re.sub(r"^(kabupaten|kab\.?)\s+", "", n)
    return re.sub(r"[^a-z]", "", n)


def main():
    sql = unduh(URL_WILAYAH)
    prov = {k: NAMA_PROVINSI_PENDEK.get(k, n) for k, n in re.findall(r"\('(\d{2})','([^']+)'\)", sql)}
    kab = {k.replace(".", ""): n for k, n in re.findall(r"\('(\d{2}\.\d{2})','([^']+)'\)", sql)}
    print(f"Kepmendagri: {len(prov)} provinsi, {len(kab)} kab/kota")

    lama = {r["kode_kab"]: r["nama_wilayah"] for r in csv.DictReader(unduh(URL_WIL_LAMA).splitlines())
            if r["kode_kab"] not in ("NULL", "") and r["kode_kec"] in ("NULL", "")}
    indeks = {}
    for k, n in kab.items():
        indeks[(k[:1], ("kota" if n.lower().startswith("kota") else "kab") + kunci_nama(re.sub(r"^Kota\s+", "", n, flags=re.I)))] = k

    def kode_baru(k):
        if k in kab:
            return k
        n = lama.get(k, "")
        jenis = "kota" if n.lower().startswith("kota") else "kab"
        return indeks.get((k[:1], jenis + kunci_nama(re.sub(r"^KOTA\s+", "", n, flags=re.I))))

    per_kab = defaultdict(list)
    tak_terpetakan = defaultdict(int)
    for r in csv.DictReader(unduh(URL_PKM).splitlines()):
        k = kode_baru(r["kode_kab"])
        if not k:
            tak_terpetakan[r["kode_kab"]] += 1
            continue
        per_kab[k].append((r["kode_instansi"], rapikan(r["unit_kerja"])))
    if tak_terpetakan:
        sys.exit(f"Kode kab/kota tidak bisa dipetakan: {dict(tak_terpetakan)}")

    keluar = os.path.join(DIR, "puskesmas.csv")
    lama_nomor = {}
    if os.path.exists(keluar):
        with open(keluar, encoding="utf-8", newline="") as f:
            lama_nomor = {r["kode_komdat"]: r["kode_puskesmas"] for r in csv.DictReader(f)}

    baris = []
    for k in sorted(per_kab):
        for i, (komdat, nama) in enumerate(sorted(per_kab[k]), start=1):
            if i > 999:
                sys.exit(f"Lebih dari 999 Puskesmas di {k}")
            pid = f"{k}-{i:03d}"
            if komdat in lama_nomor and lama_nomor[komdat] != pid:
                sys.exit(f"Nomor berubah untuk {nama} ({lama_nomor[komdat]} -> {pid}). Data lama dipertahankan.")
            baris.append({"kode_puskesmas": pid, "kode_wilayah": k, "nomor": i, "nama": nama,
                          "kab_kota": kab[k], "provinsi": prov[k[:2]], "kode_komdat": komdat})

    with open(keluar, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(baris[0]))
        w.writeheader()
        w.writerows(baris)

    with open(os.path.join(DIR, "kab_kota.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["kode_wilayah", "kab_kota", "provinsi"])
        for k in sorted(kab):
            w.writerow([k, kab[k], prov[k[:2]]])

    kosong = [f"{k} {kab[k]}" for k in sorted(kab) if k not in per_kab]
    print(f"{len(baris)} Puskesmas di {len(per_kab)} kab/kota -> {keluar}")
    print(f"Kab/kota tanpa data Puskesmas: {len(kosong)}" + ("".join("\n  " + x for x in kosong)))


if __name__ == "__main__":
    main()
