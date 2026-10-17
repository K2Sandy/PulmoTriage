"""Pemeriksaan lisensi PulmoTriage.

File lisensi adalah JSON yang ditandatangani tim dengan kunci rahasia (Ed25519).
Aplikasi hanya menyimpan kunci publik (lisensi_publik.pem), jadi bisa memeriksa
keaslian lisensi tanpa internet, tetapi tidak bisa membuat lisensi baru.

Sekali pakai: saat dipasang pertama kali, lisensi diaktifkan ke server cloud dan
terikat ke SATU komputer (butuh internet sekali). Lisensi yang sama ditolak di
komputer lain. Setelah aktif, pemeriksaan berjalan tanpa internet.
"""

import base64
import hashlib
import json
import os
import platform
import uuid
from datetime import date, datetime, timedelta, timezone

import httpx

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
FILE_AKTIVASI = os.environ.get("LISENSI_AKTIVASI_FILE", os.path.join(os.path.dirname(FILE_LISENSI), "aktivasi.json"))
# 0 = lewati aktivasi online (khusus pengembangan/uji). Bawaan: aktivasi wajib.
AKTIVASI_WAJIB = os.environ.get("LISENSI_AKTIVASI_ONLINE", "1") != "0"
CLOUD_URL = os.environ.get("CLOUD_URL", "http://localhost:8001").rstrip("/")

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


def id_mesin() -> str:
    """Sidik jari komputer ini (bukan data pribadi): hash dari MachineGuid Windows atau /etc/machine-id."""
    mentah = None
    try:
        import winreg  # hanya ada di Windows

        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Cryptography", 0, winreg.KEY_READ | winreg.KEY_WOW64_64KEY) as k:
            mentah = winreg.QueryValueEx(k, "MachineGuid")[0]
    except Exception:
        for p in ("/etc/machine-id", "/var/lib/dbus/machine-id"):
            try:
                with open(p, encoding="utf-8") as f:
                    mentah = f.read().strip()
                    break
            except OSError:
                pass
    mentah = mentah or str(uuid.getnode())
    return hashlib.sha256(("pulmotriage:" + mentah).encode()).hexdigest()[:24]


def nama_mesin() -> str:
    return (platform.node() or "komputer")[:60]


def id_lisensi(data: dict) -> str:
    """Pengenal unik satu file lisensi (berubah bila lisensi diterbitkan ulang)."""
    return hashlib.sha256(str(data.get("tanda_tangan", "")).encode()).hexdigest()[:16]


def _header_lisensi(data: dict) -> dict:
    raw = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return {"X-Lisensi": base64.b64encode(raw).decode(), "X-Mesin": id_mesin()}


def _baca_aktivasi() -> dict | None:
    try:
        with open(FILE_AKTIVASI, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, UnicodeDecodeError):
        return None


def aktifkan_online(data: dict) -> dict:
    """Mendaftarkan lisensi ke cloud untuk komputer ini. Mengembalikan {ok, pesan}."""
    try:
        r = httpx.post(
            f"{CLOUD_URL}/lisensi/aktivasi",
            headers=_header_lisensi(data),
            json={"id_mesin": id_mesin(), "nama_mesin": nama_mesin()},
            timeout=90,  # server cloud gratis bisa butuh waktu untuk bangun
        )
    except httpx.HTTPError:
        return {"ok": False, "pesan": "Aktivasi pertama butuh internet. Sambungkan komputer ke internet, lalu pasang lisensi lagi."}
    if r.status_code == 200:
        return {"ok": True, "pesan": "Lisensi diaktifkan untuk komputer ini."}
    try:
        detail = r.json().get("detail")
    except ValueError:
        detail = None
    if r.status_code == 409:
        nama = (detail or {}).get("nama_mesin") if isinstance(detail, dict) else None
        lokasi = f" ({nama})" if nama else ""
        return {"ok": False, "pesan": f"Lisensi ini sudah dipakai di komputer lain{lokasi}. Satu lisensi hanya untuk satu komputer. Hubungi tim PulmoTriage untuk memindahkan lisensi."}
    pesan = detail if isinstance(detail, str) else f"Server aktivasi menolak lisensi (kode {r.status_code})."
    return {"ok": False, "pesan": pesan}


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
        if AKTIVASI_WAJIB and hasil["status"] != "tidak_valid":
            akt = _baca_aktivasi()
            if not akt or akt.get("id_lisensi") != id_lisensi(data):
                hasil = {**hasil, "status": "belum_aktif", "pesan": "Lisensi belum diaktifkan di komputer ini. Pasang ulang file lisensi saat ada internet."}
            elif akt.get("id_mesin") != id_mesin():
                hasil = {**hasil, "status": "pindah_komputer", "pesan": "Lisensi ini diaktifkan di komputer lain. Satu lisensi hanya untuk satu komputer."}
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
    if AKTIVASI_WAJIB:
        akt = aktifkan_online(data)
        if not akt["ok"]:
            return {"status": "tidak_valid", "pesan": akt["pesan"]}
        with open(FILE_AKTIVASI, "w", encoding="utf-8") as f:
            json.dump(
                {"id_lisensi": id_lisensi(data), "id_mesin": id_mesin(), "diaktifkan": datetime.now(WIB).isoformat(timespec="seconds")},
                f,
                indent=2,
            )
    with open(FILE_LISENSI, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return status()


def hapus():
    for p in (FILE_LISENSI, FILE_AKTIVASI):
        try:
            os.remove(p)
        except FileNotFoundError:
            pass


def header_sinkron() -> dict:
    """Lisensi dikirim ke cloud sebagai bukti asal data (bukan rahasia)."""
    data = baca_file()
    if data is None:
        return {}
    return _header_lisensi(data)


def identitas() -> tuple[str | None, str | None]:
    """(puskesmas_id, nama) dari lisensi yang sah, atau (None, None)."""
    s = status()
    if s["status"] in ("aktif", "masa_tenggang", "kedaluwarsa"):
        return s["puskesmas_id"], s["nama"]
    return None, None
