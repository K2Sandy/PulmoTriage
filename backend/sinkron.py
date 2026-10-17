import os

import httpx

import db
import lisensi

CLOUD_URL = os.environ.get("CLOUD_URL", "http://localhost:8001").rstrip("/")
# Puskesmas berlisensi tidak butuh kunci API: lisensinya sendiri yang membuktikan asal data.
# SYNC_API_KEY dan PUSKESMAS_ID hanya dipakai kalau lisensi belum dipasang (pengembangan/demo).
SYNC_API_KEY = os.environ.get("SYNC_API_KEY", "")
PUSKESMAS_ID = os.environ.get("PUSKESMAS_ID", "PKM-DEMO-LOKAL")


def _identitas_dan_header():
    pid, _ = lisensi.identitas()
    header = lisensi.header_sinkron() if pid else {}
    if SYNC_API_KEY:
        header["X-API-Key"] = SYNC_API_KEY
    return pid or PUSKESMAS_ID, header


def kelompok_umur(umur):
    if umur is None:
        return None
    for batas, nama in [(14, "0-14"), (24, "15-24"), (34, "25-34"), (44, "35-44"), (54, "45-54"), (64, "55-64")]:
        if umur <= batas:
            return nama
    return "65+"


def anonimkan(r):
    """Hanya kolom yang aman dikirim. TIDAK ada nama, umur pasti, foto, atau heatmap."""
    return {
        "uid": r["uid"],
        "tanggal": r["dibuat_pada"][:10],
        "kelompok_umur": kelompok_umur(r["umur"]),
        "jenis_kelamin": r["jenis_kelamin"] if r["jenis_kelamin"] in ("L", "P") else None,
        "gejala": [g for g in r["gejala"].split(",") if g],
        "ai_level": r["ai_level"],
        "kategori": r["kategori"],
        "atipikal": bool(r["atipikal"]),
        "model_version": r["model_version"],
    }


def jalankan():
    """Kirim semua data yang belum tersinkron. Aman dipanggil berulang kali."""
    terkirim = 0
    puskesmas_id, header = _identitas_dan_header()
    if not header:
        return {"status": "ditolak", "kode": 401, "pesan": "Lisensi belum dipasang", "terkirim": 0, "menunggu": db.jumlah_belum_sinkron()}
    for _ in range(50):  # maksimal 50 kelompok x 200 data
        baris = db.belum_sinkron(200)
        if not baris:
            return {"status": "ok", "terkirim": terkirim, "menunggu": 0}
        try:
            r = httpx.post(
                f"{CLOUD_URL}/sync",
                json={"puskesmas_id": puskesmas_id, "records": [anonimkan(b) for b in baris]},
                headers=header,
                timeout=30,  # server cloud gratis bisa butuh waktu untuk bangun
            )
        except httpx.HTTPError:
            # Tidak ada internet atau cloud mati: data tetap aman di komputer lokal.
            return {"status": "offline", "terkirim": terkirim, "menunggu": db.jumlah_belum_sinkron()}
        if r.status_code != 200:
            return {"status": "ditolak", "kode": r.status_code, "terkirim": terkirim, "menunggu": db.jumlah_belum_sinkron()}
        db.tandai_sinkron([b["id"] for b in baris])
        terkirim += len(baris)
    return {"status": "ok", "terkirim": terkirim, "menunggu": db.jumlah_belum_sinkron()}