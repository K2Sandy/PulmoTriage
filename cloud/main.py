import hashlib
import os
import random
from datetime import date, datetime, timedelta, timezone
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Boolean, Column, Date, DateTime, MetaData, String, Table, create_engine, delete, func, insert, select, update

import lisensi
import wilayah

# DATABASE_URL kosong -> pakai file SQLite lokal (untuk belajar dan uji).
# Saat deploy, isi dengan alamat PostgreSQL, misalnya postgresql://user:sandi@host:5432/nama
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///cloud.db")
# Penyedia hosting sering memberi alamat berawalan postgres:// atau postgresql://.
# Library yang kita pasang adalah psycopg v3, jadi awalannya harus postgresql+psycopg://
for _awal in ("postgres://", "postgresql://"):
    if DATABASE_URL.startswith(_awal):
        DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len(_awal):]
API_KEY = os.environ.get("SYNC_API_KEY", "dev-key")
CORS_ORIGINS = [o.strip().rstrip("/") for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]

# Informasi versi terbaru aplikasi Puskesmas, diatur lewat Environment di Render (tanpa ubah kode).
VERSI_TERBARU = os.environ.get("VERSI_TERBARU", "1.1.0")
URL_UNDUH = os.environ.get(
    "URL_UNDUH", "https://github.com/K2Sandy/pulmotriage/releases/latest/download/PulmoTriage-Setup.exe"
)
CATATAN_VERSI = os.environ.get("CATATAN_VERSI", "")
# Angka per provinsi di bawah batas ini tidak dirinci di portal publik (melindungi kelompok kecil).
BATAS_PUBLIK = int(os.environ.get("BATAS_PUBLIK", "10"))

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
# Nama Puskesmas diambil dari lisensi saat sinkron, supaya dasbor Dinkes bisa menampilkan nama.
puskesmas = Table(
    "puskesmas",
    meta,
    Column("puskesmas_id", String(64), primary_key=True),
    Column("nama", String(120), nullable=False),
    Column("provinsi", String(80)),
    Column("kab_kota", String(80)),
    Column("kode_wilayah", String(4)),
    Column("pulau", String(20)),
    Column("lisensi_sampai", Date),
)
# Satu lisensi hanya untuk satu komputer: dicatat saat aktivasi pertama.
aktivasi = Table(
    "aktivasi_lisensi",
    meta,
    Column("id_lisensi", String(32), primary_key=True),
    Column("puskesmas_id", String(64), nullable=False),
    Column("id_mesin", String(64), nullable=False),
    Column("nama_mesin", String(80)),
    Column("diaktifkan", DateTime(timezone=True)),
)


# Lima kelompok pulau untuk peta dasbor. Pulau kecil digabung ke kelompok besar terdekat.
# Ditentukan dari 2 angka pertama kode wilayah (kode provinsi Kemendagri).
def pulau_dari_kode(kode: str | None) -> str | None:
    if not kode or len(kode) < 2 or not kode[:2].isdigit():
        return None
    p = int(kode[:2])
    if 11 <= p <= 21:
        return "sumatera"  # termasuk Kepulauan Riau (21) dan Bangka Belitung (19)
    if 31 <= p <= 53:
        return "jawa_bali_nt"  # Jawa, Bali, NTB, NTT
    if 61 <= p <= 65:
        return "kalimantan"
    if 71 <= p <= 76:
        return "sulawesi"
    if 81 <= p <= 96:
        return "maluku_papua"
    return None
meta.create_all(engine)

app = FastAPI(title="PulmoTriage Cloud", version="0.1")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])


def cek_key(x_api_key: str = Header("")):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="API key salah")


def id_lisensi(data: dict) -> str:
    return hashlib.sha256(str(data.get("tanda_tangan", "")).encode()).hexdigest()[:16]


def cek_pengirim(x_lisensi: str = Header(""), x_mesin: str = Header(""), x_api_key: str = Header("")):
    """Pengirim sah = Puskesmas berlisensi dari komputer tempat lisensi diaktifkan,
    ATAU pemegang API key (untuk pengembangan/demo)."""
    data = lisensi.periksa_header(x_lisensi)
    if data:
        with engine.connect() as c:
            akt = c.execute(select(aktivasi.c.id_mesin).where(aktivasi.c.id_lisensi == id_lisensi(data))).first()
        if akt is None:
            raise HTTPException(status_code=403, detail="Lisensi belum diaktifkan")
        if akt.id_mesin != x_mesin:
            raise HTTPException(status_code=403, detail="Lisensi ini terikat ke komputer lain")
        return data
    if x_api_key and x_api_key == API_KEY:
        return None
    raise HTTPException(status_code=401, detail="Lisensi tidak sah atau sudah berakhir")


class AktivasiMasuk(BaseModel):
    id_mesin: str = Field(min_length=8, max_length=64)
    nama_mesin: str | None = Field(None, max_length=80)


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
    return {"status": "ok", "lisensi": "aktif" if lisensi.aktif() else "kunci publik belum dipasang"}


@app.get("/versi")
def versi():
    """Dibaca aplikasi Puskesmas untuk menampilkan pemberitahuan pembaruan."""
    return {"versi_terbaru": VERSI_TERBARU, "url_unduh": URL_UNDUH, "catatan": CATATAN_VERSI}


@app.post("/lisensi/aktivasi")
def aktivasi_lisensi(masuk: AktivasiMasuk, x_lisensi: str = Header("")):
    """Mengikat satu file lisensi ke satu komputer. Komputer yang sama boleh mengaktifkan ulang (instal ulang)."""
    data = lisensi.periksa_header(x_lisensi)
    if not data:
        raise HTTPException(status_code=401, detail="Lisensi tidak sah atau sudah berakhir")
    lid = id_lisensi(data)
    with engine.begin() as c:
        ada = c.execute(select(aktivasi).where(aktivasi.c.id_lisensi == lid)).first()
        if ada:
            if ada.id_mesin != masuk.id_mesin:
                raise HTTPException(status_code=409, detail={"pesan": "Lisensi sudah dipakai di komputer lain", "nama_mesin": ada.nama_mesin})
            return {"status": "sudah_aktif", "puskesmas_id": data["puskesmas_id"]}
        c.execute(
            insert(aktivasi).values(
                id_lisensi=lid,
                puskesmas_id=data["puskesmas_id"],
                id_mesin=masuk.id_mesin,
                nama_mesin=masuk.nama_mesin,
                diaktifkan=datetime.now(timezone.utc),
            )
        )
    return {"status": "aktif", "puskesmas_id": data["puskesmas_id"]}


@app.get("/lisensi/aktivasi", dependencies=[Depends(cek_key)])
def daftar_aktivasi():
    with engine.connect() as c:
        return [dict(r._mapping) for r in c.execute(select(aktivasi).order_by(aktivasi.c.diaktifkan.desc()))]


@app.delete("/lisensi/aktivasi/{puskesmas_id}", dependencies=[Depends(cek_key)])
def reset_aktivasi(puskesmas_id: str):
    """Untuk tim: melepas ikatan lisensi Puskesmas ini (misalnya komputernya rusak/diganti)."""
    with engine.begin() as c:
        r = c.execute(delete(aktivasi).where(aktivasi.c.puskesmas_id == puskesmas_id))
    return {"dilepas": r.rowcount}


@app.post("/sync")
def sync(data: SyncMasuk, lis: dict | None = Depends(cek_pengirim)):
    if lis:
        # ID Puskesmas selalu diambil dari lisensi, bukan dari isi kiriman.
        data.puskesmas_id = lis["puskesmas_id"]
    uids = [r.uid for r in data.records]
    with engine.begin() as c:
        if lis:
            kode = (lis.get("kode_wilayah") or data.puskesmas_id[:4])[:4]
            baris_pkm = {
                "nama": lis["nama"][:120],
                "provinsi": (lis.get("provinsi") or None),
                "kab_kota": (lis.get("kab_kota") or None),
                "kode_wilayah": kode if kode.isdigit() else None,
                "pulau": pulau_dari_kode(kode),
                "lisensi_sampai": date.fromisoformat(lis["berlaku_sampai"]),
            }
            ada_pkm = c.execute(select(puskesmas.c.puskesmas_id).where(puskesmas.c.puskesmas_id == data.puskesmas_id)).first()
            if ada_pkm:
                c.execute(update(puskesmas).where(puskesmas.c.puskesmas_id == data.puskesmas_id).values(**baris_pkm))
            else:
                c.execute(insert(puskesmas).values(puskesmas_id=data.puskesmas_id, **baris_pkm))
        ada = set(c.execute(select(rekap.c.uid).where(rekap.c.uid.in_(uids))).scalars()) if uids else set()
        baru = [
            {**r.model_dump(), "gejala": ",".join(r.gejala), "puskesmas_id": data.puskesmas_id, "simulasi": False}
            for r in data.records
            if r.uid not in ada
        ]
        if baru:
            c.execute(insert(rekap), baru)
    return {"diterima": len(baru), "duplikat": len(data.records) - len(baru)}


@app.get("/dashboard/ringkasan", dependencies=[Depends(cek_key)])
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
        info_pkm = {
            r.puskesmas_id: r._asdict()
            for r in c.execute(
                select(puskesmas.c.puskesmas_id, puskesmas.c.nama, puskesmas.c.provinsi, puskesmas.c.kab_kota, puskesmas.c.kode_wilayah, puskesmas.c.pulau)
            )
        }
        terakhir = {
            pid: str(tgl)
            for pid, tgl in c.execute(select(rekap.c.puskesmas_id, func.max(rekap.c.tanggal)).where(syarat).group_by(rekap.c.puskesmas_id))
        }

    return {
        "hari": hari,
        "total": sum(per_kategori.values()),
        "per_kategori": per_kategori,
        "per_hari": [{"tanggal": t, **v} for t, v in sorted(per_hari.items())],
        "per_puskesmas": sorted(
            [
                {
                    "puskesmas_id": p,
                    "nama": info_pkm.get(p, {}).get("nama"),
                    "provinsi": info_pkm.get(p, {}).get("provinsi"),
                    "kab_kota": info_pkm.get(p, {}).get("kab_kota"),
                    "kode_wilayah": info_pkm.get(p, {}).get("kode_wilayah"),
                    "pulau": info_pkm.get(p, {}).get("pulau") or pulau_dari_kode(p[:4]),
                    "terakhir": terakhir.get(p),
                    "total": sum(v.values()),
                    **v,
                }
                for p, v in per_pkm.items()
            ],
            key=lambda x: -x["total"],
        ),
        "ada_data_simulasi": ada_simulasi,
    }


@app.get("/publik/ringkasan")
def ringkasan_publik(hari: int = Query(30, ge=1, le=365)):
    """Ringkasan untuk portal publik: hanya agregat nasional dan per provinsi.
    Tidak ada data per Puskesmas. Provinsi dengan pemeriksaan < BATAS_PUBLIK tidak dirinci per kategori."""
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
        info = {r.puskesmas_id: r for r in c.execute(select(puskesmas.c.puskesmas_id, puskesmas.c.provinsi, puskesmas.c.kode_wilayah))}
        per_bidang, pkm_bidang, tanpa_lokasi = {}, {}, 0
        for pid, kat, n in c.execute(
            select(rekap.c.puskesmas_id, rekap.c.kategori, func.count()).where(syarat).group_by(rekap.c.puskesmas_id, rekap.c.kategori)
        ):
            r = info.get(pid)
            iso = wilayah.bidang_peta(r.provinsi if r else None, (r.kode_wilayah if r else None) or pid[:4])
            if not iso:
                tanpa_lokasi += n
                continue
            per_bidang.setdefault(iso, dict(kosong))[kat] += n
            pkm_bidang.setdefault(iso, set()).add(pid)
        ada_simulasi = c.execute(select(func.count()).where(rekap.c.simulasi.is_(True))).scalar() > 0

    per_provinsi = []
    for iso, v in per_bidang.items():
        total = sum(v.values())
        baris = {"iso": iso, "provinsi": wilayah.nama_bidang(iso), "puskesmas": len(pkm_bidang[iso]), "total": total}
        if total >= BATAS_PUBLIK:
            baris.update(v)
            baris["disamarkan"] = False
        else:
            baris.update({"MERAH": None, "KUNING": None, "HIJAU": None, "disamarkan": True})
        per_provinsi.append(baris)
    per_provinsi.sort(key=lambda x: (-(x["MERAH"] or 0), -x["total"]))
    return {
        "hari": hari,
        "total": sum(per_kategori.values()),
        "per_kategori": per_kategori,
        "per_hari": [{"tanggal": t, **v} for t, v in sorted(per_hari.items())],
        "per_provinsi": per_provinsi,
        "jumlah_puskesmas": sum(len(s) for s in pkm_bidang.values()),
        "batas_rincian": BATAS_PUBLIK,
        "tanpa_lokasi": tanpa_lokasi,
        "ada_data_simulasi": ada_simulasi,
    }


# Puskesmas simulasi untuk demo peta. Nama diberi kata "Simulasi" supaya tidak tertukar dengan data nyata.
# Bobot menentukan banyaknya data simulasi; angka MERAH/KUNING/HIJAU diacak, bukan data sungguhan.
PKM_SIMULASI = [
    ("1171-901", "Aceh", "Kota Banda Aceh", 9),
    ("1106-901", "Aceh", "Kabupaten Aceh Besar", 6),
    ("1275-901", "Sumatera Utara", "Kota Medan", 8),
    ("1371-901", "Sumatera Barat", "Kota Padang", 4),
    ("3171-901", "DKI Jakarta", "Kota Jakarta Selatan", 7),
    ("3273-901", "Jawa Barat", "Kota Bandung", 6),
    ("3578-901", "Jawa Timur", "Kota Surabaya", 6),
    ("5171-901", "Bali", "Kota Denpasar", 3),
    ("5371-901", "Nusa Tenggara Timur", "Kota Kupang", 4),
    ("6171-901", "Kalimantan Barat", "Kota Pontianak", 3),
    ("6471-901", "Kalimantan Timur", "Kota Balikpapan", 3),
    ("7371-901", "Sulawesi Selatan", "Kota Makassar", 5),
    ("7171-901", "Sulawesi Utara", "Kota Manado", 2),
    ("8171-901", "Maluku", "Kota Ambon", 2),
    ("9171-901", "Papua", "Kota Jayapura", 3),
    ("1471-901", "Riau", "Kota Pekanbaru", 4),
    ("1671-901", "Sumatera Selatan", "Kota Palembang", 5),
    ("1871-901", "Lampung", "Kota Bandar Lampung", 4),
    ("3374-901", "Jawa Tengah", "Kota Semarang", 6),
    ("3471-901", "DI Yogyakarta", "Kota Yogyakarta", 3),
    ("3671-901", "Banten", "Kota Tangerang", 5),
    ("5271-901", "Nusa Tenggara Barat", "Kota Mataram", 3),
    ("6371-901", "Kalimantan Selatan", "Kota Banjarmasin", 3),
    ("7271-901", "Sulawesi Tengah", "Kota Palu", 2),
]


@app.post("/demo/seed", dependencies=[Depends(cek_key)])
def seed(n: int = Query(300, ge=1, le=5000)):
    """Isi data SIMULASI untuk demo dasbor. Diberi tanda simulasi=true."""
    rnd = random.Random(42)
    hari_ini = date.today()
    ids = [k for k, *_ in PKM_SIMULASI]
    bobot = [w for *_, w in PKM_SIMULASI]
    with engine.begin() as c:
        c.execute(delete(rekap).where(rekap.c.simulasi.is_(True)))
        c.execute(delete(puskesmas).where(puskesmas.c.nama.like("Puskesmas Simulasi%")))
        for kode, prov, kab, _ in PKM_SIMULASI:
            c.execute(
                insert(puskesmas).values(
                    puskesmas_id=kode,
                    nama=f"Puskesmas Simulasi {kab.replace('Kota ', '').replace('Kabupaten ', '')}",
                    provinsi=prov,
                    kab_kota=kab,
                    kode_wilayah=kode[:4],
                    pulau=pulau_dari_kode(kode),
                )
            )
        baris = []
        for i in range(n):
            pkm = rnd.choices(ids, weights=bobot)[0]
            # Proporsi MERAH dibuat berbeda antar Puskesmas (2-14%) supaya gradasi peta terlihat.
            w_merah = 2 + (ids.index(pkm) * 5) % 13
            kat = rnd.choices(["HIJAU", "KUNING", "MERAH"], weights=[86 - w_merah, 14, w_merah])[0]
            level = {"HIJAU": "LOW", "KUNING": rnd.choice(["MID", "LOW"]), "MERAH": rnd.choice(["HIGH", "MID"])}[kat]
            baris.append(
                {
                    "uid": f"demo-{i:06d}",
                    "puskesmas_id": pkm,
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
        c.execute(delete(puskesmas).where(puskesmas.c.nama.like("Puskesmas Simulasi%")))
    return {"dihapus": r.rowcount}