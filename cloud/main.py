import os
import random
from datetime import date, timedelta
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Boolean, Column, Date, MetaData, String, Table, create_engine, delete, func, insert, select

# DATABASE_URL kosong -> pakai file SQLite lokal (untuk belajar dan uji).
# Saat deploy, isi dengan alamat PostgreSQL, misalnya postgresql://user:sandi@host:5432/nama
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///cloud.db")
# Penyedia hosting sering memberi alamat berawalan postgres:// atau postgresql://.
# Library yang kita pasang adalah psycopg v3, jadi awalannya harus postgresql+psycopg://
for _awal in ("postgres://", "postgresql://"):
    if DATABASE_URL.startswith(_awal):
        DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len(_awal):]
API_KEY = os.environ.get("SYNC_API_KEY", "dev-key")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
meta = MetaData()
rekap = Table(
    "rekap_triase",
    meta,
    Column("uid", String(36), primary_key=True),
    Column("puskesmas_id", String(64), nullable=False),
    Column("tanggal", Date, nullable=False),
    Column("kelompok_umur", String(10)),
    Column("jenis_kelamin", String(1)),
    Column("gejala", String(200), nullable=False, default=""),
    Column("ai_level", String(4), nullable=False),
    Column("kategori", String(6), nullable=False),
    Column("atipikal", Boolean, nullable=False, default=False),
    Column("model_version", String(64)),
    Column("simulasi", Boolean, nullable=False, default=False),
)
meta.create_all(engine)

app = FastAPI(title="PulmoTriage Cloud", version="0.1")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])


def cek_key(x_api_key: str = Header("")):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="API key salah")


class Rekap(BaseModel):
    uid: str = Field(min_length=8, max_length=36)
    tanggal: date
    kelompok_umur: str | None = Field(None, max_length=10)
    jenis_kelamin: Literal["L", "P"] | None = None
    gejala: list[Literal["batuk_2minggu", "demam", "berat_badan_turun", "keringat_malam", "kontak_serumah", "riwayat_pengobatan"]] = Field(default=[], max_length=6)
    ai_level: Literal["HIGH", "MID", "LOW"]
    kategori: Literal["MERAH", "KUNING", "HIJAU"]
    atipikal: bool = False
    model_version: str | None = Field(None, max_length=64)


class SyncMasuk(BaseModel):
    puskesmas_id: str = Field(min_length=1, max_length=64)
    records: list[Rekap] = Field(max_length=500)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/sync", dependencies=[Depends(cek_key)])
def sync(data: SyncMasuk):
    uids = [r.uid for r in data.records]
    with engine.begin() as c:
        ada = set(c.execute(select(rekap.c.uid).where(rekap.c.uid.in_(uids))).scalars()) if uids else set()
        baru = [
            {**r.model_dump(), "gejala": ",".join(r.gejala), "puskesmas_id": data.puskesmas_id, "simulasi": False}
            for r in data.records
            if r.uid not in ada
        ]
        if baru:
            c.execute(insert(rekap), baru)
    return {"diterima": len(baru), "duplikat": len(data.records) - len(baru)}


@app.get("/dashboard/ringkasan")
def ringkasan(hari: int = Query(30, ge=1, le=365)):
    batas = date.today() - timedelta(days=hari)
    syarat = rekap.c.tanggal >= batas
    kosong = {"MERAH": 0, "KUNING": 0, "HIJAU": 0}
    with engine.connect() as c:
        per_kategori = dict(kosong)
        for kat, n in c.execute(select(rekap.c.kategori, func.count()).where(syarat).group_by(rekap.c.kategori)):
            per_kategori[kat] = n

        per_hari = {}
        for tgl, kat, n in c.execute(
            select(rekap.c.tanggal, rekap.c.kategori, func.count()).where(syarat).group_by(rekap.c.tanggal, rekap.c.kategori)
        ):
            per_hari.setdefault(str(tgl), dict(kosong))[kat] = n

        per_pkm = {}
        for pkm, kat, n in c.execute(
            select(rekap.c.puskesmas_id, rekap.c.kategori, func.count()).where(syarat).group_by(rekap.c.puskesmas_id, rekap.c.kategori)
        ):
            per_pkm.setdefault(pkm, dict(kosong))[kat] = n

        ada_simulasi = c.execute(select(func.count()).where(rekap.c.simulasi.is_(True))).scalar() > 0

    return {
        "hari": hari,
        "total": sum(per_kategori.values()),
        "per_kategori": per_kategori,
        "per_hari": [{"tanggal": t, **v} for t, v in sorted(per_hari.items())],
        "per_puskesmas": sorted(
            [{"puskesmas_id": p, "total": sum(v.values()), **v} for p, v in per_pkm.items()],
            key=lambda x: -x["total"],
        ),
        "ada_data_simulasi": ada_simulasi,
    }


@app.post("/demo/seed", dependencies=[Depends(cek_key)])
def seed(n: int = 300):
    """Isi data SIMULASI untuk demo dasbor. Diberi tanda simulasi=true."""
    rnd = random.Random(42)
    hari_ini = date.today()
    with engine.begin() as c:
        c.execute(delete(rekap).where(rekap.c.simulasi.is_(True)))
        baris = []
        for i in range(n):
            kat = rnd.choices(["HIJAU", "KUNING", "MERAH"], weights=[80, 14, 6])[0]
            level = {"HIJAU": "LOW", "KUNING": rnd.choice(["MID", "LOW"]), "MERAH": rnd.choice(["HIGH", "MID"])}[kat]
            baris.append(
                {
                    "uid": f"demo-{i:06d}",
                    "puskesmas_id": f"PKM-DEMO-{rnd.randint(1, 5)}",
                    "tanggal": hari_ini - timedelta(days=rnd.randint(0, 29)),
                    "kelompok_umur": rnd.choice(["15-24", "25-34", "35-44", "45-54", "55-64", "65+"]),
                    "jenis_kelamin": rnd.choice(["L", "P"]),
                    "gejala": "batuk_2minggu" if kat != "HIJAU" else "",
                    "ai_level": level,
                    "kategori": kat,
                    "atipikal": False,
                    "model_version": "simulasi",
                    "simulasi": True,
                }
            )
        c.execute(insert(rekap), baris)
    return {"dibuat": n}


@app.delete("/demo", dependencies=[Depends(cek_key)])
def hapus_simulasi():
    with engine.begin() as c:
        r = c.execute(delete(rekap).where(rekap.c.simulasi.is_(True)))
    return {"dihapus": r.rowcount}