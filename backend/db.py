import os
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone

# Installer menyimpan data di folder pengguna (lihat installer/launcher.py).
DB_PATH = os.environ.get("PULMOTRIAGE_DB", "pulmotriage.db")


def koneksi():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def init_db():
    with koneksi() as c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS pemeriksaan (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uid TEXT NOT NULL UNIQUE,
                dibuat_pada TEXT NOT NULL,
                nama TEXT,
                umur INTEGER,
                jenis_kelamin TEXT,
                gejala TEXT NOT NULL DEFAULT '',
                prob_tb REAL NOT NULL,
                ai_level TEXT NOT NULL,
                kategori TEXT NOT NULL,
                atipikal INTEGER NOT NULL DEFAULT 0,
                model_version TEXT,
                heatmap_png TEXT,
                keputusan_dokter TEXT,
                catatan_dokter TEXT,
                ditinjau_pada TEXT,
                tersinkron INTEGER NOT NULL DEFAULT 0
            )
            """
        )


def sekarang():
    # Waktu WIB (UTC+7), supaya tanggal di PDF dan dasbor sesuai jam Puskesmas.
    return datetime.now(timezone(timedelta(hours=7))).isoformat(timespec="seconds")


def simpan(hasil, nama, umur, jenis_kelamin, gejala):
    with koneksi() as c:
        cur = c.execute(
            """
            INSERT INTO pemeriksaan
              (uid, dibuat_pada, nama, umur, jenis_kelamin, gejala, prob_tb, ai_level,
               kategori, atipikal, model_version, heatmap_png)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()), sekarang(), nama, umur, jenis_kelamin, ",".join(gejala),
                hasil["prob_tb"], hasil["triage"]["ai_level"], hasil["triage"]["category"],
                int(hasil["triage"]["atypical"]), hasil["model_version"], hasil.get("heatmap_png"),
            ),
        )
        return cur.lastrowid


def daftar(limit=50):
    # Tanpa kolom heatmap_png supaya daftar tetap ringan.
    with koneksi() as c:
        rows = c.execute(
            """
            SELECT id, dibuat_pada, nama, umur, jenis_kelamin, gejala, prob_tb, ai_level,
                   kategori, atipikal, keputusan_dokter, ditinjau_pada, tersinkron
            FROM pemeriksaan ORDER BY id DESC LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]


def ambil(id_):
    with koneksi() as c:
        r = c.execute("SELECT * FROM pemeriksaan WHERE id = ?", (id_,)).fetchone()
    return dict(r) if r else None


def tinjau(id_, keputusan, catatan):
    with koneksi() as c:
        cur = c.execute(
            "UPDATE pemeriksaan SET keputusan_dokter = ?, catatan_dokter = ?, ditinjau_pada = ? WHERE id = ?",
            (keputusan, catatan, sekarang(), id_),
        )
        return cur.rowcount > 0

def belum_sinkron(limit=200):
    with koneksi() as c:
        rows = c.execute(
            """
            SELECT id, uid, dibuat_pada, umur, jenis_kelamin, gejala, ai_level, kategori, atipikal, model_version
            FROM pemeriksaan WHERE tersinkron = 0 ORDER BY id LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]


def jumlah_belum_sinkron():
    with koneksi() as c:
        return c.execute("SELECT COUNT(*) FROM pemeriksaan WHERE tersinkron = 0").fetchone()[0]


def tandai_sinkron(ids):
    with koneksi() as c:
        c.executemany("UPDATE pemeriksaan SET tersinkron = 1 WHERE id = ?", [(i,) for i in ids])