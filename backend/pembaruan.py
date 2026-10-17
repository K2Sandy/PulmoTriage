"""Memeriksa apakah ada versi baru aplikasi (butuh internet; kalau tidak ada, diam saja)."""

import os
import time

import httpx

from versi import VERSI

CLOUD_URL = os.environ.get("CLOUD_URL", "http://localhost:8001").rstrip("/")
_cache = {"waktu": 0.0, "hasil": None}


def _angka(v: str) -> tuple:
    try:
        return tuple(int(x) for x in v.strip().lstrip("v").split("."))
    except (ValueError, AttributeError):
        return (0,)


def periksa(paksa: bool = False) -> dict:
    sekarang = time.time()
    if not paksa and _cache["hasil"] and sekarang - _cache["waktu"] < 3600:
        return _cache["hasil"]
    hasil = {"versi_terpasang": VERSI, "ada_pembaruan": False, "status": "offline"}
    try:
        r = httpx.get(f"{CLOUD_URL}/versi", timeout=8)
        if r.status_code == 200:
            d = r.json()
            terbaru = str(d.get("versi_terbaru", VERSI))
            hasil = {
                "versi_terpasang": VERSI,
                "versi_terbaru": terbaru,
                "ada_pembaruan": _angka(terbaru) > _angka(VERSI),
                "url_unduh": d.get("url_unduh"),
                "catatan": d.get("catatan") or "",
                "status": "ok",
            }
    except (httpx.HTTPError, ValueError):
        pass
    _cache.update(waktu=sekarang, hasil=hasil)
    return hasil
