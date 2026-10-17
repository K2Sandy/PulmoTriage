"""Menerbitkan file lisensi untuk Puskesmas. Dijalankan oleh tim di laptop yang menyimpan kunci rahasia.

Versi pilih-dari-daftar (tanpa mengetik): klik dua kali penerbit-lisensi.bat di folder ini. Disarankan, karena kode
dan nama Puskesmas diambil dari data/puskesmas.csv sehingga tidak bisa salah ketik.

Satu Puskesmas:
    python scripts/lisensi/terbitkan_lisensi.py --kode-wilayah 1171 --nomor 1 --provinsi "Aceh" ^
        --kab-kota "Kota Banda Aceh" --nama "Puskesmas Meuraxa" --sampai 2027-10-31

Banyak Puskesmas sekaligus dari file CSV
(kolom: kode_wilayah,nomor,provinsi,kab_kota,nama,berlaku_mulai,berlaku_sampai):
    python scripts/lisensi/terbitkan_lisensi.py --csv scripts/lisensi/contoh_daftar_puskesmas.csv

Kode Puskesmas dibentuk otomatis: <kode wilayah kab/kota 4 angka>-<nomor urut 3 angka>, misalnya 1171-001.
Kode wilayah mengikuti kode Kemendagri/BPS (2 angka provinsi + 2 angka kab/kota, misalnya 1171 = Kota Banda Aceh).
Dua angka pertama menentukan provinsi di peta portal publik.

Hasil: scripts/lisensi/keluaran/lisensi-<KODE>.json  -> kirim file ini ke Puskesmas.
"""

import argparse
import base64
import csv
import json
import os
import re
import sys
from datetime import date, datetime, timedelta, timezone

from cryptography.hazmat.primitives.serialization import load_pem_private_key

DIR = os.path.dirname(os.path.abspath(__file__))
RAHASIA = os.path.join(DIR, "kunci_rahasia.pem")
KELUARAN = os.path.join(DIR, "keluaran")
WIB = timezone(timedelta(hours=7))


def isi_untuk_ditandatangani(data: dict) -> bytes:
    # Harus sama persis dengan backend/lisensi.py dan cloud/lisensi.py
    isi = {k: v for k, v in data.items() if k != "tanda_tangan"}
    return json.dumps(isi, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def tanggal(teks, nama):
    try:
        return date.fromisoformat(teks).isoformat()
    except (TypeError, ValueError):
        sys.exit(f"{nama} harus berformat TAHUN-BULAN-TANGGAL, misalnya 2027-10-31 (diberi: {teks!r})")


# Dua angka pertama kode wilayah = kode provinsi (Kemendagri). Dipakai untuk memeriksa salah ketik.
KODE_PROVINSI = {
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "21",
    "31", "32", "33", "34", "35", "36", "51", "52", "53",
    "61", "62", "63", "64", "65", "71", "72", "73", "74", "75", "76",
    "81", "82", "91", "92", "93", "94", "95", "96",
}


def terbitkan(kunci, kode_wilayah, nomor, provinsi, kab_kota, nama, sampai, mulai=None):
    kode_wilayah = str(kode_wilayah).strip().replace(".", "")
    if not re.fullmatch(r"\d{4}", kode_wilayah) or kode_wilayah[:2] not in KODE_PROVINSI:
        sys.exit(f"Kode wilayah harus 4 angka kode kab/kota, misalnya 1171 (diberi: {kode_wilayah!r})")
    try:
        nomor = int(nomor)
        assert 1 <= nomor <= 999
    except (ValueError, AssertionError):
        sys.exit(f"Nomor urut Puskesmas harus 1 sampai 999 (diberi: {nomor!r})")
    if not (provinsi or "").strip() or not (kab_kota or "").strip() or not (nama or "").strip():
        sys.exit("Provinsi, kabupaten/kota, dan nama Puskesmas wajib diisi.")
    pid = f"{kode_wilayah}-{nomor:03d}"
    data = {
        "versi": 1,
        "puskesmas_id": pid,
        "nama": nama.strip(),
        "provinsi": provinsi.strip(),
        "kab_kota": kab_kota.strip(),
        "kode_wilayah": kode_wilayah,
        "berlaku_mulai": tanggal(mulai or datetime.now(WIB).date().isoformat(), "Tanggal mulai"),
        "berlaku_sampai": tanggal(sampai, "Tanggal berakhir"),
        "diterbitkan": datetime.now(WIB).isoformat(timespec="seconds"),
    }
    if data["berlaku_sampai"] < data["berlaku_mulai"]:
        sys.exit("Tanggal berakhir tidak boleh sebelum tanggal mulai.")
    data["tanda_tangan"] = base64.b64encode(kunci.sign(isi_untuk_ditandatangani(data))).decode()

    os.makedirs(KELUARAN, exist_ok=True)
    path = os.path.join(KELUARAN, f"lisensi-{pid}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"OK  {pid:<10} {data['nama']:<32} {data['kab_kota']:<24} s.d. {data['berlaku_sampai']}  -> {path}")


def main():
    ap = argparse.ArgumentParser(description="Menerbitkan file lisensi Puskesmas.")
    ap.add_argument("--kode-wilayah", help="Kode kab/kota 4 angka (Kemendagri/BPS), misalnya 1171")
    ap.add_argument("--nomor", help="Nomor urut Puskesmas di kab/kota itu, misalnya 1")
    ap.add_argument("--provinsi", help='Misalnya "Aceh"')
    ap.add_argument("--kab-kota", help='Misalnya "Kota Banda Aceh"')
    ap.add_argument("--nama", help='Nama yang tampil di aplikasi dan surat rujukan, misalnya "Puskesmas Meuraxa"')
    ap.add_argument("--mulai", help="Tanggal mulai (default: hari ini)")
    ap.add_argument("--sampai", help="Tanggal berakhir, misalnya 2027-10-31")
    ap.add_argument("--csv", help="File CSV berisi banyak Puskesmas")
    a = ap.parse_args()

    try:
        with open(RAHASIA, "rb") as f:
            kunci = load_pem_private_key(f.read(), password=None)
    except FileNotFoundError:
        sys.exit("Kunci rahasia belum ada. Jalankan dulu: python scripts/lisensi/buat_kunci.py")

    if a.csv:
        with open(a.csv, encoding="utf-8-sig", newline="") as f:
            for b in csv.DictReader(f):
                terbitkan(kunci, b["kode_wilayah"], b["nomor"], b["provinsi"], b["kab_kota"], b["nama"], b["berlaku_sampai"], b.get("berlaku_mulai") or None)
    elif a.kode_wilayah and a.nomor and a.provinsi and a.kab_kota and a.nama and a.sampai:
        terbitkan(kunci, a.kode_wilayah, a.nomor, a.provinsi, a.kab_kota, a.nama, a.sampai, a.mulai)
    else:
        ap.error("isi --kode-wilayah, --nomor, --provinsi, --kab-kota, --nama, dan --sampai (atau pakai --csv)")


if __name__ == "__main__":
    main()
