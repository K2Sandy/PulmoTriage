"""Pemeriksaan lisensi PulmoTriage. Berjalan offline.

File lisensi adalah JSON yang ditandatangani tim dengan kunci rahasia (Ed25519).
Aplikasi hanya menyimpan kunci publik (lisensi_publik.pem), jadi bisa memeriksa
keaslian lisensi tanpa internet, tetapi tidak bisa membuat lisensi baru.
"""

import base64
import json
import os
from datetime import date, datetime, timedelta, timezone

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.serialization import load_pem_public_key

AKAR = os.path.dirname(os.path.abspath(__file__))
KUNCI_PUBLIK = os.environ.get("LISENSI_KUNCI_PUBLIK", os.path.join(AKAR, "lisensi_publik.pem"))
FILE_LISENSI = os.environ.get("LISENSI_FILE", os.path.join(AKAR, "lisensi.json"))
# 0 = aplikasi tetap bisa dipakai tanpa lisensi (untuk pengembangan/demo online).
LISENSI_WAJIB = os.environ.get("LISENSI_WAJIB", "1") != "0"
MASA_TENGGANG_HARI = 30
PERINGATAN_HARI = 30
FIELD_WAJIB = ("puskesmas_id", "nama", "berlaku_mulai", "berlaku_sampai")

WIB = timezone(timedelta(hours=7))


def hari_ini():
    return datetime.now(WIB).date()


def isi_untuk_ditandatangani(data: dict) -> bytes:
    """Bentuk baku isi lisensi (tanpa tanda tangan). Penerbit dan pemeriksa harus sama persis."""
    isi = {k: v for k, v in data.items() if k != "tanda_tangan"}
    return json.dumps(isi, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _muat_kunci():
    try:
        with open(KUNCI_PUBLIK, "rb") as f:
            return load_pem_public_key(f.read())
    except FileNotFoundError:
        return None


def periksa(data: dict, kunci=None, tanggal: date | None = None) -> dict:
    """Memeriksa satu lisensi (dict). Mengembalikan status tanpa melempar error."""
    kunci = kunci or _muat_kunci()
    if kunci is None:
        return {"status": "tidak_valid", "pesan": "Kunci publik lisensi tidak ditemukan di aplikasi."}
    if not isinstance(data, dict) or any(not data.get(k) for k in FIELD_WAJIB) or not data.get("tanda_tangan"):
        return {"status": "tidak_valid", "pesan": "Format file lisensi tidak dikenali."}
    try:
        kunci.verify(base64.b64decode(data["tanda_tangan"]), isi_untuk_ditandatangani(data))
    except (InvalidSignature, ValueError, TypeError):
        return {"status": "tidak_valid", "pesan": "Tanda tangan lisensi tidak cocok. File mungkin diubah atau bukan dari tim PulmoTriage."}

    try:
        mulai = date.fromisoformat(data["berlaku_mulai"])
        sampai = date.fromisoformat(data["berlaku_sampai"])
    except ValueError:
        return {"status": "tidak_valid", "pesan": "Tanggal di dalam lisensi tidak valid."}

    t = tanggal or hari_ini()
    wilayah = ", ".join(x for x in (data.get("kab_kota"), data.get("provinsi")) if x) or data.get("wilayah")
    info = {
        "puskesmas_id": data["puskesmas_id"],
        "nama": data["nama"],
        "provinsi": data.get("provinsi"),
        "kab_kota": data.get("kab_kota"),
        "kode_wilayah": data.get("kode_wilayah"),
        "wilayah": wilayah,
        "berlaku_mulai": data["berlaku_mulai"],
        "berlaku_sampai": data["berlaku_sampai"],
    }
    batas_tenggang = sampai + timedelta(days=MASA_TENGGANG_HARI)
    if t < mulai:
        return {**info, "status": "belum_berlaku", "pesan": f"Lisensi baru berlaku mulai {data['berlaku_mulai']}."}
    if t <= sampai:
        sisa = (sampai - t).days
        pesan = f"Lisensi berakhir dalam {sisa} hari. Hubungi tim untuk perpanjangan." if sisa <= PERINGATAN_HARI else "Lisensi aktif."
        return {**info, "status": "aktif", "sisa_hari": sisa, "pesan": pesan}
    if t <= batas_tenggang:
        sisa = (batas_tenggang - t).days
        return {
            **info,
            "status": "masa_tenggang",
            "sisa_hari": sisa,
            "pesan": f"Lisensi sudah berakhir. Masa tenggang tersisa {sisa} hari; segera pasang lisensi perpanjangan.",
        }
    return {**info, "status": "kedaluwarsa", "pesan": "Lisensi dan masa tenggang sudah berakhir. Pasang lisensi perpanjangan untuk melanjutkan pemeriksaan baru."}


def baca_file() -> dict | None:
    try:
        with open(FILE_LISENSI, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, UnicodeDecodeError):
        return None


def status() -> dict:
    data = baca_file()
    if data is None:
        hasil = {"status": "belum_ada", "pesan": "Lisensi belum dipasang."}
    else:
        hasil = periksa(data)
    hasil["wajib"] = LISENSI_WAJIB
    hasil["boleh_periksa"] = (not LISENSI_WAJIB) or hasil["status"] in ("aktif", "masa_tenggang")
    return hasil


def simpan(isi_file: bytes) -> dict:
    """Memeriksa lalu menyimpan file lisensi yang diunggah. Hanya lisensi asli yang disimpan."""
    try:
        data = json.loads(isi_file.decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return {"status": "tidak_valid", "pesan": "File bukan lisensi PulmoTriage (harus file .json dari tim)."}
    hasil = periksa(data)
    if hasil["status"] == "tidak_valid":
        return hasil
    with open(FILE_LISENSI, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return status()


def hapus():
    try:
        os.remove(FILE_LISENSI)
    except FileNotFoundError:
        pass


def header_sinkron() -> dict:
    """Lisensi dikirim ke cloud sebagai bukti asal data (bukan rahasia)."""
    data = baca_file()
    if data is None:
        return {}
    raw = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return {"X-Lisensi": base64.b64encode(raw).decode()}


def identitas() -> tuple[str | None, str | None]:
    """(puskesmas_id, nama) dari lisensi yang sah, atau (None, None)."""
    s = status()
    if s["status"] in ("aktif", "masa_tenggang", "kedaluwarsa"):
        return s["puskesmas_id"], s["nama"]
    return None, None
