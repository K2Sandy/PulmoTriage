#!/usr/bin/env python3
"""
scripts/jalankan_perbandingan.py
Menjalankan perbandingan visual antara semua tangkapan layar di docs/screenshots/
terhadap citra referensi di docs/ref/ menggunakan modul bandingkan.py.
Menyimpan hasil ke scripts/hasil_perbandingan.json.
"""

import glob
import json
import os
import sys
from bandingkan import bandingkan_gambar

REFS = [
    "a1-pasien_kosong.png",
    "a2-pasien_terisi.png",
    "a3-pasien_error-validasi.png",
    "b1-unggah_kosong.png",
    "b2-unggah_citra-terpilih.png",
    "b3-unggah_menganalisis.png",
    "b4-unggah_popup-ditolak.png",
    "b5-unggah_error-server.png",
    "b6-unggah_error-bukan-gambar.png",
    "c1-hasil_merah.png",
    "c2-hasil_kuning.png",
    "c3-hasil_hijau.png",
    "c4-hasil_citra-janggal.png",
    "c5-hasil_tinjauan-tersimpan.png",
    "d1-dasbor_terisi.png",
    "d2-dasbor_kosong.png",
    "d3-dasbor_gagal-memuat.png",
    "e1-riwayat_pemeriksaan.png",
    "e2-riwayat_komponen-token.png",
]

def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    print("=" * 80)
    print("MENJALANKAN PERBANDINGAN VISUAL 19 CITRA REFERENSI")
    print("=" * 80)

    hasil_total = []

    for ref_name in REFS:
        hasil_path = os.path.join("docs", "screenshots", ref_name)
        ref_path = os.path.join("docs", "ref", ref_name)
        diff_path = os.path.join("docs", "screenshots", "diff", f"{os.path.splitext(ref_name)[0]}_diff.png")

        print(f"\n[Membandingkan] {ref_name} ...")
        if not os.path.exists(hasil_path):
            print(f"  Error: Tangkapan layar tidak ditemukan: {hasil_path}")
            continue
        if not os.path.exists(ref_path):
            print(f"  Error: Referensi tidak ditemukan: {ref_path}")
            continue

        res = bandingkan_gambar(hasil_path, ref_path, skala=True, toleransi=12, output_diff=diff_path)
        if res:
            res["ref_name"] = ref_name
            res["hasil_path"] = hasil_path
            res["ref_path"] = ref_path
            hasil_total.append(res)

    out_json = os.path.join("scripts", "hasil_perbandingan.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(hasil_total, f, indent=2)

    print("\n" + "=" * 80)
    print(f"Perbandingan selesai untuk {len(hasil_total)} gambar. Hasil disimpan di {out_json}")
    print("=" * 80)

if __name__ == "__main__":
    main()
