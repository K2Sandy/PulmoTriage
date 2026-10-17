import base64
import io
import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pdf import buat_pdf

import db
import sinkron
from pulmotriage_infer import SYMPTOMS, PulmoTriage, load_image, overlay_heatmap

SINKRON_DETIK = int(os.environ.get("SINKRON_DETIK", "60"))  # 0 = matikan sinkron otomatis


async def sinkron_berkala():
    while True:
        await asyncio.sleep(SINKRON_DETIK)
        try:
            await asyncio.to_thread(sinkron.jalankan)
        except Exception as e:  # jangan biarkan sinkron otomatis mati diam-diam
            print("Sinkron otomatis gagal:", e)


@asynccontextmanager
async def lifespan(app):
    tugas = asyncio.create_task(sinkron_berkala()) if SINKRON_DETIK > 0 else None
    yield
    if tugas:
        tugas.cancel()


app = FastAPI(title="PulmoTriage API", version="0.4", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = PulmoTriage("pulmotriage.onnx", "pulmotriage_config.json")
db.init_db()  # membuat file pulmotriage.db dan tabelnya kalau belum ada


@app.get("/health")
def health():
    return {"status": "ok", "model_version": engine.cfg.get("model_version")}


@app.post("/analyze")
async def analyze(
    foto: UploadFile = File(...),
    gejala: str = Form(""),
    nama: str = Form(""),
    umur: int | None = Form(None, ge=0, le=120),
    jenis_kelamin: str = Form(""),
):
    try:
        img = load_image(io.BytesIO(await foto.read()))
    except Exception:
        raise HTTPException(status_code=400, detail="File bukan gambar yang valid")

    if jenis_kelamin not in ("", "L", "P"):
        raise HTTPException(status_code=422, detail="jenis_kelamin harus L, P, atau kosong")

    keys = [g.strip() for g in gejala.split(",") if g.strip()]
    salah = [k for k in keys if k not in SYMPTOMS]
    if salah:
        raise HTTPException(status_code=422, detail=f"Kode gejala tidak dikenal: {salah}. Yang valid: {list(SYMPTOMS)}")

    hasil, cam = engine.analyze(img, keys)

    if cam is not None:
        heat = overlay_heatmap(img, cam, strength=hasil["heatmap_strength"])
        buf = io.BytesIO()
        heat.save(buf, format="PNG")
        hasil["heatmap_png"] = base64.b64encode(buf.getvalue()).decode()
        # Hanya hasil yang berhasil dianalisis yang disimpan.
        hasil["id"] = db.simpan(hasil, nama.strip(), umur, jenis_kelamin, keys)
    return hasil


@app.get("/pemeriksaan")
def daftar_pemeriksaan(limit: int = 50):
    return db.daftar(limit)


@app.get("/pemeriksaan/{id_}")
def detail_pemeriksaan(id_: int):
    data = db.ambil(id_)
    if data is None:
        raise HTTPException(status_code=404, detail="Pemeriksaan tidak ditemukan")
    return data


@app.post("/pemeriksaan/{id_}/tinjau")
def tinjau_pemeriksaan(id_: int, keputusan: str = Form(...), catatan: str = Form("")):
    # Dokter wajib meninjau hasil AI: setuju atau tidak setuju.
    if keputusan not in ("setuju", "tidak_setuju"):
        raise HTTPException(status_code=422, detail="keputusan harus 'setuju' atau 'tidak_setuju'")
    if not db.tinjau(id_, keputusan, catatan):
        raise HTTPException(status_code=404, detail="Pemeriksaan tidak ditemukan")
    return {"id": id_, "keputusan": keputusan}

@app.get("/pemeriksaan/{id_}/rujukan.pdf")
def rujukan_pdf(id_: int):
    data = db.ambil(id_)
    if data is None:
        raise HTTPException(status_code=404, detail="Pemeriksaan tidak ditemukan")
    return Response(
        content=buat_pdf(data),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="rujukan-{id_}.pdf"'},
    )

@app.get("/sinkron/status")
def status_sinkron():
    return {"menunggu": db.jumlah_belum_sinkron()}


@app.post("/sinkron")
def sinkron_sekarang():
    return sinkron.jalankan()