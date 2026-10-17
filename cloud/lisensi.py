"""Memeriksa lisensi Puskesmas yang dikirim bersama data sinkron (header X-Lisensi).

Cloud hanya menyimpan kunci publik, sama seperti aplikasi Puskesmas.
Lisensi yang sah membuktikan data datang dari Puskesmas terdaftar, jadi tiap
Puskesmas tidak perlu kunci API bersama.
"""

import base64
import json
import os
from datetime import date, datetime, timedelta, timezone

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.serialization import load_pem_public_key

KUNCI_PUBLIK = os.environ.get(
    "LISENSI_KUNCI_PUBLIK", os.path.join(os.path.dirname(os.path.abspath(__file__)), "lisensi_publik.pem")
)
MASA_TENGGANG_HARI = 30
WIB = timezone(timedelta(hours=7))

try:
    with open(KUNCI_PUBLIK, "rb") as _f:
        _KUNCI = load_pem_public_key(_f.read())
except FileNotFoundError:
    _KUNCI = None


def isi_untuk_ditandatangani(data: dict) -> bytes:
    isi = {k: v for k, v in data.items() if k != "tanda_tangan"}
    return json.dumps(isi, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def periksa_header(nilai: str) -> dict | None:
    """Mengembalikan isi lisensi kalau sah dan belum lewat masa tenggang, selain itu None."""
    if not nilai or _KUNCI is None:
        return None
    try:
        data = json.loads(base64.b64decode(nilai).decode("utf-8"))
        _KUNCI.verify(base64.b64decode(data["tanda_tangan"]), isi_untuk_ditandatangani(data))
        mulai = date.fromisoformat(data["berlaku_mulai"])
        sampai = date.fromisoformat(data["berlaku_sampai"])
    except (InvalidSignature, ValueError, KeyError, TypeError, UnicodeDecodeError):
        return None
    hari_ini = datetime.now(WIB).date()
    if hari_ini < mulai or hari_ini > sampai + timedelta(days=MASA_TENGGANG_HARI):
        return None
    return data


def aktif() -> bool:
    return _KUNCI is not None
