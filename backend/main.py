import base64
import io

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from pulmotriage_infer import SYMPTOMS, PulmoTriage, load_image, overlay_heatmap

app = FastAPI(title="PulmoTriage API", version="0.1")

# Izinkan halaman web (frontend) memanggil API ini dari alamat lain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model dimuat SATU KALI saat server menyala, bukan setiap ada permintaan.
engine = PulmoTriage("pulmotriage.onnx", "pulmotriage_config.json")


@app.get("/health")
def health():
    return {"status": "ok", "model_version": engine.cfg.get("model_version")}


@app.post("/analyze")
async def analyze(foto: UploadFile = File(...), gejala: str = Form("")):
    # 1. Baca foto yang dikirim frontend
    try:
        img = load_image(io.BytesIO(await foto.read()))
    except Exception:
        raise HTTPException(status_code=400, detail="File bukan gambar yang valid")

    # 2. "batuk_2minggu,demam" -> ["batuk_2minggu", "demam"]
    keys = [g.strip() for g in gejala.split(",") if g.strip()]
    salah = [k for k in keys if k not in SYMPTOMS]
    if salah:
        raise HTTPException(status_code=422, detail=f"Kode gejala tidak dikenal: {salah}. Yang valid: {list(SYMPTOMS)}")

    # 3. Jalankan model (gerbang kualitas + skor + triase)
    hasil, cam = engine.analyze(img, keys)

    # 4. Kalau lolos, buat gambar heatmap dan kirim sebagai teks base64
    if cam is not None:
        heat = overlay_heatmap(img, cam, strength=hasil["heatmap_strength"])
        buf = io.BytesIO()
        heat.save(buf, format="PNG")
        hasil["heatmap_png"] = base64.b64encode(buf.getvalue()).decode()
    return hasil