"""Membuat pasangan kunci lisensi PulmoTriage. Cukup dijalankan SEKALI oleh tim.

    python scripts/lisensi/buat_kunci.py

Hasil:
  scripts/lisensi/kunci_rahasia.pem  -> RAHASIA. Simpan di laptop tim, jangan di-commit,
                                        jangan dikirim ke siapa pun. Dipakai untuk menerbitkan lisensi.
  backend/lisensi_publik.pem          -> boleh di-commit. Dipakai aplikasi Puskesmas memeriksa lisensi.
  cloud/lisensi_publik.pem            -> boleh di-commit. Dipakai server cloud memeriksa data sinkron.
"""

import argparse
import os
import sys

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

DIR = os.path.dirname(os.path.abspath(__file__))
AKAR = os.path.abspath(os.path.join(DIR, "..", ".."))
RAHASIA = os.path.join(DIR, "kunci_rahasia.pem")
PUBLIK = [os.path.join(AKAR, "backend", "lisensi_publik.pem"), os.path.join(AKAR, "cloud", "lisensi_publik.pem")]


def main():
    ap = argparse.ArgumentParser(description="Membuat pasangan kunci lisensi.")
    ap.add_argument("--paksa", action="store_true", help="Timpa kunci lama. SEMUA lisensi lama jadi tidak berlaku.")
    a = ap.parse_args()

    if os.path.exists(RAHASIA) and not a.paksa:
        sys.exit(
            "Kunci rahasia sudah ada di " + RAHASIA + "\n"
            "Membuat kunci baru akan membatalkan semua lisensi yang sudah diterbitkan.\n"
            "Kalau memang itu yang diinginkan, jalankan lagi dengan --paksa."
        )

    kunci = Ed25519PrivateKey.generate()
    with open(RAHASIA, "wb") as f:
        f.write(kunci.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    publik = kunci.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
    for p in PUBLIK:
        with open(p, "wb") as f:
            f.write(publik)

    print("Kunci rahasia :", RAHASIA, "(JANGAN di-commit / dibagikan)")
    for p in PUBLIK:
        print("Kunci publik  :", p)
    print("\nLangkah berikutnya: commit kedua file lisensi_publik.pem, lalu terbitkan lisensi dengan terbitkan_lisensi.py")


if __name__ == "__main__":
    main()
