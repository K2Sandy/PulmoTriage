import os

import httpx

import db

CLOUD_URL = os.environ.get("CLOUD_URL", "http://localhost:8001")
SYNC_API_KEY = os.environ.get("SYNC_API_KEY", "dev-key")
PUSKESMAS_ID = os.environ.get("PUSKESMAS_ID", "PKM-DEMO-LOKAL")


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
    for _ in range(50):  # maksimal 50 kelompok x 200 data
        baris = db.belum_sinkron(200)
        if not baris:
            return {"status": "ok", "terkirim": terkirim, "menunggu": 0}
        try:
            r = httpx.post(
                f"{CLOUD_URL}/sync",
                json={"puskesmas_id": PUSKESMAS_ID, "records": [anonimkan(b) for b in baris]},
                headers={"X-API-Key": SYNC_API_KEY},
                timeout=10,
            )
        except httpx.HTTPError:
            # Tidak ada internet atau cloud mati: data tetap aman di komputer lokal.
            return {"status": "offline", "terkirim": terkirim, "menunggu": db.jumlah_belum_sinkron()}
        if r.status_code != 200:
            return {"status": "ditolak", "kode": r.status_code, "terkirim": terkirim, "menunggu": db.jumlah_belum_sinkron()}
        db.tandai_sinkron([b["id"] for b in baris])
        terkirim += len(baris)
    return {"status": "ok", "terkirim": terkirim, "menunggu": db.jumlah_belum_sinkron()}