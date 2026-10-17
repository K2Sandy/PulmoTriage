#!/usr/bin/env python3
"""
PulmoTriage - offline inference
===============================

Runs fully offline on a normal laptop CPU. Needs only: numpy, Pillow, onnxruntime
(no PyTorch, no GPU, no internet).

Pipeline (same order as in the proposal):
  1. Basic quality gate   - resolution, blur, exposure, contrast, colour
  2. AI model (ONNX)      - P(TB), Grad-CAM map, image embedding (v3: a thin rim of the film is cut off first,
                            see input.border_crop in the config)
  3. Out-of-distribution  - embedding far from the line between the average Normal and
                            the average TB X-ray -> reject (not a chest X-ray).
                            Borderline TB/Normal X-rays lie ON that line, so they pass.
     Orientation check    - small classifier on the embedding -> reject rotated /
                            upside-down films ("salah posisi")
  4. Triage engine        - combines P(TB) with clinical symptoms -> MERAH / KUNING / HIJAU
  5. Heatmap overlay      - PNG so the health worker can verify where the AI looked

Command line:
  python pulmotriage_infer.py --image foto.png --symptoms batuk_2minggu,demam
  python pulmotriage_infer.py --list-symptoms

From Python (e.g. inside FastAPI):
  from pulmotriage_infer import PulmoTriage, load_image, overlay_heatmap
  engine = PulmoTriage("pulmotriage.onnx", "pulmotriage_config.json")
  result, cam = engine.analyze(load_image("foto.png"), symptoms=["batuk_2minggu"])
  overlay_heatmap(img, cam, strength=result["heatmap_strength"]).save("heatmap.png")

The training notebook imports THIS file for preprocessing, so the app and the
training code always prepare images in exactly the same way.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

import warnings

import numpy as np
from PIL import Image, ImageOps

INFER_VERSION = 5   # v3.1 configs (soft OOD band "ood_warn", atypical -> exactly KUNING) need at least this version

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MODEL = os.path.join(HERE, "pulmotriage.onnx")
DEFAULT_CONFIG = os.path.join(HERE, "pulmotriage_config.json")

# Symptom keys used by the app form (labels match the wireframe).
SYMPTOMS = {
    "batuk_2minggu": "Batuk > 2 minggu",
    "demam": "Demam",
    "berat_badan_turun": "Penurunan berat badan",
    "keringat_malam": "Keringat malam",
    "kontak_serumah": "Kontak serumah dengan pasien TBC",
    "riwayat_pengobatan": "Riwayat pengobatan TBC",
}

DISCLAIMER = (
    "Hasil ini adalah alat bantu triase, bukan diagnosis. "
    "Wajib ditinjau dan dikonfirmasi oleh tenaga kesehatan."
)

QUALITY_MESSAGES = {
    "RESOLUSI_RENDAH": "Resolusi citra terlalu kecil. Gunakan berkas atau foto dengan sisi terpendek minimal {min_side} piksel.",
    "BURAM": "Citra terlalu buram. Foto ulang dengan kamera stabil dan fokus pada film rontgen.",
    "BERDERAU": "Citra terlalu berbintik (noise). Foto ulang dengan cahaya cukup dan kamera stabil, atau unggah berkas aslinya.",
    "PENCAHAYAAN": "Citra terlalu gelap atau terlalu terang. Foto film di depan viewer/lightbox dengan cahaya merata.",
    "KONTRAS_RENDAH": "Kontras citra terlalu rendah. Pastikan seluruh film terlihat jelas dan tidak tertutup pantulan cahaya.",
    "BUKAN_RONTGEN": "Citra berwarna terdeteksi. Pastikan yang diunggah adalah rontgen toraks.",
    "TIDAK_DIKENALI": "Citra tidak dikenali sebagai rontgen toraks posisi frontal (PA/AP). Periksa jenis dan posisi citra, lalu unggah ulang.",
    "SALAH_POSISI": "Citra tampak terputar atau terbalik. Pastikan rontgen tegak (puncak paru di bagian atas), lalu unggah ulang.",
}

TRIAGE_TEXT = {
    "MERAH": ("Rujuk segera",
              "Rujuk ke fasilitas rujukan dan lakukan pemeriksaan konfirmasi TCM (tes cepat molekuler)."),
    "KUNING": ("Perlu pemeriksaan lanjutan",
               "Konsultasikan dengan dokter dan lakukan pemeriksaan dahak/TCM sesuai alur program TBC."),
    "HIJAU": ("Tidak ditemukan tanda TBC",
              "Tidak ada tindak lanjut TBC khusus. Edukasi pasien untuk kembali bila gejala muncul atau memburuk."),
}
# v3.1: image accepted but less typical than the training X-rays (soft OOD band). Always KUNING.
ATYPICAL_TEXT = ("Periksa citra: pastikan rontgen dada",
                 "Pastikan citra adalah rontgen dada posisi depan (PA/AP), lalu nilai secara klinis. Bila benar rontgen dada "
                 "dan ada gejala atau faktor risiko, lakukan pemeriksaan dahak/TCM sesuai alur program TBC.")
ATYPICAL_WARNING = ("CITRA_KURANG_KHAS: citra ini kurang mirip rontgen dada yang dipakai melatih AI. "
                    "Skor dan peta panas kurang dapat dipercaya; pastikan citra benar rontgen dada posisi depan.")


# --------------------------------------------------------------------------- #
# Image helpers
# --------------------------------------------------------------------------- #
def load_image(src) -> Image.Image:
    """Open an image file (path or file-like) and apply phone EXIF rotation."""
    img = Image.open(src)
    img = ImageOps.exif_transpose(img)
    img.load()
    return img


def to_gray(img: Image.Image) -> Image.Image:
    """Convert any image to 8-bit grayscale ('L').

    For ordinary 8-bit images this is exactly PIL's convert('L'), which is what
    the model was trained on. 16-bit / float images (exported DICOM) are
    windowed to the 0.5-99.5 percentile range first.
    """
    if img.mode in ("I;16", "I;16B", "I;16L", "I", "F"):
        arr = np.asarray(img, dtype=np.float32)
        lo, hi = np.percentile(arr, [0.5, 99.5])
        arr = np.clip((arr - lo) / max(hi - lo, 1e-6), 0, 1) * 255.0
        return Image.fromarray(arr.astype(np.uint8))
    if img.mode in ("RGBA", "LA", "P", "PA"):
        rgba = img.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, (0, 0, 0, 255))
        img = Image.alpha_composite(bg, rgba).convert("RGB")
    return img.convert("L")


def standardise(gray: Image.Image) -> Image.Image:
    """Per-image contrast stretch (1 % cut-off on each side).

    Hospitals, scanners and phone photos of film all use different exposure /
    windowing. Stretching every image the same way, in training AND in the app,
    makes the model depend less on those global differences.
    """
    return ImageOps.autocontrast(gray, cutoff=1)


def load_gray(path) -> Image.Image:
    """Load a file straight to grayscale (used by the training notebook)."""
    return to_gray(load_image(path))


def crop_border(gray: Image.Image, frac: float) -> Image.Image:
    """Cut `frac` of the width/height off every side (v3 default: border_crop = 0.05 in the config).

    The outer rim of a film mostly holds labels, side markers, black bars and
    framing differences between collections - not lung. Removing it, in training
    AND in the app, takes those away as hints. Very small images are left alone.
    """
    if frac <= 0:
        return gray
    w, h = gray.size
    dx, dy = int(round(w * frac)), int(round(h * frac))
    if w - 2 * dx < 32 or h - 2 * dy < 32:
        return gray
    return gray.crop((dx, dy, w - dx, h - dy))


def preprocess(img: Image.Image, size: int, mean, std, border_crop: float = 0.0) -> np.ndarray:
    """Image -> float32 tensor of shape (1, 3, size, size), ImageNet-normalised.

    Order: grayscale -> cut border (v3) -> contrast stretch -> resize.
    border_crop = 0 reproduces the v1/v2 behaviour exactly.
    """
    g = standardise(crop_border(to_gray(img), border_crop)).resize((size, size), Image.BILINEAR)
    x = np.asarray(g, dtype=np.float32) / 255.0
    x = np.stack([x, x, x], axis=0)
    mean = np.asarray(mean, dtype=np.float32)[:, None, None]
    std = np.asarray(std, dtype=np.float32)[:, None, None]
    x = (x - mean) / std
    return x[None].astype(np.float32)


# --------------------------------------------------------------------------- #
# Quality gate (part 1: cheap checks before the model runs)
# --------------------------------------------------------------------------- #
def quality_metrics(img: Image.Image) -> dict:
    """Measure the things the quality gate checks. Thresholds live in the config."""
    w, h = img.size
    g = np.asarray(to_gray(img).resize((512, 512), Image.BILINEAR), dtype=np.float32)
    lap = g[1:-1, :-2] + g[1:-1, 2:] + g[:-2, 1:-1] + g[2:, 1:-1] - 4.0 * g[1:-1, 1:-1]
    if img.mode in ("L", "LA", "1", "I", "I;16", "I;16B", "I;16L", "F"):
        colour = 0.0
    else:
        rgb = np.asarray(img.convert("RGB").resize((256, 256), Image.BILINEAR), dtype=np.float32) / 255.0
        colour = float(np.mean(rgb.max(axis=2) - rgb.min(axis=2)))
    return {
        "width": int(w),
        "height": int(h),
        "min_side": int(min(w, h)),
        "blur_lapvar": float(lap.var()),
        "mean_intensity": float(g.mean() / 255.0),
        "contrast_std": float(g.std() / 255.0),
        "colourfulness": colour,
    }


def quality_check(m: dict, q: dict) -> list:
    """Return a list of issues [{code, message}]; empty list = passed."""
    issues = []

    def add(code):
        issues.append({"code": code, "message": QUALITY_MESSAGES[code].format(**q)})

    if m["min_side"] < q.get("min_side", 0):
        add("RESOLUSI_RENDAH")
    if m["colourfulness"] > q.get("colour_max", 1.0):
        add("BUKAN_RONTGEN")
    if m["blur_lapvar"] < q.get("blur_lapvar_min", 0.0):
        add("BURAM")
    if m["blur_lapvar"] > q.get("blur_lapvar_max", float("inf")):
        add("BERDERAU")
    if not (q.get("mean_min", 0.0) <= m["mean_intensity"] <= q.get("mean_max", 1.0)):
        add("PENCAHAYAAN")
    if m["contrast_std"] < q.get("contrast_min", 0.0):
        add("KONTRAS_RENDAH")
    return issues


# --------------------------------------------------------------------------- #
# Triage engine
# --------------------------------------------------------------------------- #
def triage(prob_tb: float, symptoms, t_low: float, t_high: float, atypical: bool = False) -> dict:
    """Combine the AI score with clinical symptoms into MERAH / KUNING / HIJAU.

    AI level:   HIGH if p >= t_high, MID if t_low <= p < t_high, LOW otherwise.
                t_low is tuned for high sensitivity, t_high for high specificity.
    Symptomatic: cough > 2 weeks, household contact, previous TB treatment,
                 or at least two of fever / weight loss / night sweats.
    Rules (never downgrade - missing a TB case is worse than over-referral):
        HIGH                 -> MERAH
        MID  + symptomatic   -> MERAH
        MID                  -> KUNING
        LOW  + symptomatic   -> KUNING
        LOW                  -> HIJAU
    atypical=True (v3.1: the image is less typical than 99.5 % of the validation X-rays, but not
    clearly 'not an X-ray') -> always exactly KUNING ("check the image"): never HIJAU, so a real
    but unusual film is still looked at, and never MERAH, because the score of an unusual image
    (e.g. a phone photo of a document) cannot be trusted.
    These are initial rules and must be calibrated with clinicians.
    """
    symptoms = [s for s in (symptoms or []) if s]
    unknown = [s for s in symptoms if s not in SYMPTOMS]
    if unknown:
        raise ValueError(f"Unknown symptom keys {unknown}. Valid keys: {list(SYMPTOMS)}")
    s = set(symptoms)

    if prob_tb >= t_high:
        ai_level = "HIGH"
    elif prob_tb >= t_low:
        ai_level = "MID"
    else:
        ai_level = "LOW"

    general = s & {"demam", "berat_badan_turun", "keringat_malam"}
    key = s & {"batuk_2minggu", "kontak_serumah", "riwayat_pengobatan"}
    symptomatic = bool(key) or len(general) >= 2

    if ai_level == "HIGH":
        category = "MERAH"
    elif ai_level == "MID":
        category = "MERAH" if symptomatic else "KUNING"
    else:
        category = "KUNING" if symptomatic else "HIJAU"
    if atypical:
        category = "KUNING"

    reasons = []
    if ai_level == "HIGH":
        reasons.append(f"Skor AI {prob_tb:.2f} di atas ambang tinggi ({t_high:.2f}).")
    elif ai_level == "MID":
        reasons.append(f"Skor AI {prob_tb:.2f} di zona waspada ({t_low:.2f}-{t_high:.2f}).")
    else:
        reasons.append(f"Skor AI {prob_tb:.2f} di bawah ambang rendah ({t_low:.2f}).")
    for k in symptoms:
        reasons.append(f"Gejala: {SYMPTOMS[k]}.")
    if symptomatic and ai_level != "HIGH" and not atypical:
        reasons.append("Gejala klinis menaikkan kategori triase satu tingkat.")
    if atypical:
        reasons.append("Citra kurang khas dibanding data latih AI, sehingga skor AI kurang dapat dipercaya; "
                       "kategori ditetapkan KUNING dan citra perlu diperiksa tenaga kesehatan.")

    title, action = ATYPICAL_TEXT if atypical else TRIAGE_TEXT[category]
    return {
        "category": category,
        "title": title,
        "action": action,
        "ai_level": ai_level,
        "symptomatic": symptomatic,
        "atypical": bool(atypical),
        "reasons": reasons,
    }


# --------------------------------------------------------------------------- #
# Heatmap overlay
# --------------------------------------------------------------------------- #
def normalise_cam(cam: np.ndarray) -> np.ndarray:
    cam = np.maximum(np.asarray(cam, dtype=np.float32), 0)
    peak = float(cam.max())
    return cam / peak if peak > 1e-8 else np.zeros_like(cam)


def cam_to_frame(cam: np.ndarray, border_crop: float = 0.0, ring: int = 0, out: int = 100,
                 baseline=None) -> np.ndarray:
    """Turn the raw model CAM (h x w grid over the CROPPED image) into a map that lines up with
    the WHOLE image, ready for overlay_heatmap().

    * baseline (v3): the average CAM of Normal validation X-rays. Subtracting it shows where THIS
      image has more TB evidence than a typical Normal X-ray. The AVERAGE pattern seen in every
      image (e.g. the convolution-padding artefact at the edges) cancels out; edge responses that
      are specific to one image do not. Before clipping, the signed difference sums (up to a
      constant factor) to this image's logit minus the average Normal logit; the drawn map
      (clipped, scaled, smoothed) is a visual summary, not an exact decomposition.
    * ring > 0 zeroes the outermost `ring` cells (optional, off by default in v3: hiding the top
      ring could also hide the lung apex, where TB is common).
    * border_crop > 0 places the (smaller) map in the middle of an empty canvas, because the
      model never saw the cut-off rim.
    Returns a float32 array in whole-image coordinates; v1/v2 configs (no crop/ring/baseline) still work.
    """
    c = np.asarray(cam, dtype=np.float32)
    if baseline is not None:
        b = np.asarray(baseline, dtype=np.float32)
        if b.shape == c.shape and np.isfinite(b).all():
            c = c - b
        else:
            warnings.warn(f"heatmap baseline ignored (shape {b.shape} vs map {c.shape}, or non-finite values)")
    c = np.maximum(c, 0)
    if ring > 0 and min(c.shape) > 2 * ring + 1:
        c = c.copy()
        c[:ring], c[-ring:], c[:, :ring], c[:, -ring:] = 0, 0, 0, 0
    if border_crop <= 0:
        return c
    inner = max(2, int(round(out * (1.0 - 2.0 * border_crop))))
    small = np.asarray(Image.fromarray(c).resize((inner, inner), Image.BILINEAR), dtype=np.float32)
    canvas = np.zeros((out, out), dtype=np.float32)
    off = (out - inner) // 2
    canvas[off:off + inner, off:off + inner] = small
    return canvas


def _jet(x: np.ndarray) -> np.ndarray:
    r = np.clip(1.5 - np.abs(4 * x - 3), 0, 1)
    g = np.clip(1.5 - np.abs(4 * x - 2), 0, 1)
    b = np.clip(1.5 - np.abs(4 * x - 1), 0, 1)
    return np.stack([r, g, b], axis=-1)


def heatmap_strength(prob_tb: float, t_low: float, t_high: float) -> float:
    """How strongly to draw the heatmap: faint (0.25) below t_low, full (1.0) from t_high.

    Every CAM is scaled to its own maximum, so even a clearly normal X-ray has a
    'hottest' spot. Fading it by the score stops users reading a low-risk map as a finding.
    """
    if prob_tb >= t_high:
        return 1.0
    if prob_tb <= t_low:
        return 0.25
    return 0.25 + 0.75 * (prob_tb - t_low) / max(t_high - t_low, 1e-8)


def overlay_heatmap(img: Image.Image, cam: np.ndarray, alpha: float = 0.5, max_side: int = 1024,
                    strength: float = 1.0) -> Image.Image:
    """Blend a Grad-CAM map over the X-ray. Cold areas stay see-through.
    strength (0-1) fades the whole map; use heatmap_strength() in the app."""
    base = to_gray(img)
    scale = min(1.0, max_side / max(base.size))
    if scale < 1.0:
        base = base.resize((round(base.width * scale), round(base.height * scale)), Image.BILINEAR)
    cam = normalise_cam(cam)
    up = Image.fromarray(cam.astype(np.float32)).resize(base.size, Image.BILINEAR)
    heat = np.clip(np.asarray(up, dtype=np.float32), 0, 1)
    gray = np.asarray(base, dtype=np.float32)[..., None] / 255.0
    rgb = np.repeat(gray, 3, axis=2)
    w = (alpha * float(strength) * heat)[..., None]
    out = rgb * (1 - w) + _jet(heat) * w
    return Image.fromarray((out * 255).astype(np.uint8))


# --------------------------------------------------------------------------- #
# Engine
# --------------------------------------------------------------------------- #
class PulmoTriage:
    def __init__(self, model_path: str = DEFAULT_MODEL, config_path: str = DEFAULT_CONFIG, providers=None):
        import onnxruntime as ort

        with open(config_path, encoding="utf-8") as f:
            self.cfg = json.load(f)
        need = int(self.cfg.get("infer_min_version", 1))
        if need > INFER_VERSION:
            raise RuntimeError(f"This config needs pulmotriage_infer.py version >= {need}, but this file is version "
                               f"{INFER_VERSION}. Use the pulmotriage_infer.py that came with the model.")
        self.sess = ort.InferenceSession(model_path, providers=providers or ["CPUExecutionProvider"])
        self.input_name = self.sess.get_inputs()[0].name
        inp = self.cfg.get("input_v3") or self.cfg["input"]   # v3 configs use "input_v3" so an old (v2) infer file fails loudly instead of skipping the border cut
        self.size = int(inp["size"])
        self.mean = inp["mean"]
        self.std = inp["std"]
        self.border_crop = float(inp.get("border_crop", 0.0))       # v3+; v1/v2 configs have none
        cam_cfg = self.cfg.get("cam") or {}
        self.cam_ring = int(cam_cfg.get("ring", 0))
        self.cam_baseline = None
        if cam_cfg.get("baseline"):
            try:
                b = np.asarray(cam_cfg["baseline"], dtype=np.float32)   # None/NaN entries -> error or NaN
                self.cam_baseline = b if np.isfinite(b).all() else None
            except (TypeError, ValueError):
                self.cam_baseline = None
            if self.cam_baseline is None:
                warnings.warn("heatmap baseline in the config is unusable; drawing the raw map instead")
        self.q = self.cfg.get("quality_gate", {})
        c = np.asarray(self.q.get("centroids", []), dtype=np.float32)
        self.centroids = c / np.linalg.norm(c, axis=1, keepdims=True) if c.size else None
        seg = self.q.get("ood_segment") or {}
        self.seg_c0 = np.asarray(seg.get("c0", []), dtype=np.float32)
        self.seg_c1 = np.asarray(seg.get("c1", []), dtype=np.float32)
        o = self.q.get("orientation") or {}
        self.orient_coef = np.asarray(o.get("coef", []), dtype=np.float32)
        self.orient_bias = np.asarray(o.get("intercept", []), dtype=np.float32)
        self.orient_min_prob = float(o.get("min_prob", 0.6))
        self.t_low = float(self.cfg["thresholds"]["t_low"])
        self.t_high = float(self.cfg["thresholds"]["t_high"])

    def predict_array(self, x: np.ndarray):
        """x: (N,3,S,S) float32 -> prob (N,), cam (N,h,w), embedding (N,D).
        v3 models return the signed per-cell contribution; v1/v2 models return it already clipped at 0."""
        prob, cam, emb = self.sess.run(None, {self.input_name: x})
        return prob[:, 0], cam, emb

    def ood_score(self, emb: np.ndarray) -> np.ndarray:
        """How far the image is from 'chest X-ray' (0 = typical).

        v2+: distance from the (L2-normalised) embedding to the line SEGMENT between
        the average Normal (c0) and average TB (c1) training embedding. A borderline
        X-ray lies between the two averages, i.e. on the segment, so it is NOT
        penalised; a document, noise or other non-X-ray lies far from it.
        v1 configs (no 'ood_segment'): 1 - cosine similarity to the nearest average.
        """
        e = emb / np.maximum(np.linalg.norm(emb, axis=1, keepdims=True), 1e-8)
        if self.seg_c0.size:
            d = self.seg_c1 - self.seg_c0
            t = np.clip(((e - self.seg_c0) @ d) / max(float(d @ d), 1e-12), 0.0, 1.0)
            return np.linalg.norm(e - (self.seg_c0 + t[:, None] * d), axis=1)
        if self.centroids is None:
            return np.zeros(len(emb), dtype=np.float32)
        return 1.0 - (e @ self.centroids.T).max(axis=1)

    def orientation(self, emb: np.ndarray):
        """Predicted rotation (0/90/180/270 degrees) and its probability, per image."""
        if self.orient_coef.size == 0:
            return np.zeros(len(emb), dtype=int), np.ones(len(emb), dtype=np.float32)
        e = emb / np.maximum(np.linalg.norm(emb, axis=1, keepdims=True), 1e-8)
        z = e @ self.orient_coef.T + self.orient_bias
        z = np.exp(z - z.max(axis=1, keepdims=True))
        pr = z / z.sum(axis=1, keepdims=True)
        return pr.argmax(axis=1), pr.max(axis=1)

    def analyze(self, img: Image.Image, symptoms=()):
        """Full pipeline for one image. Returns (result_dict, cam or None)."""
        metrics = quality_metrics(img)
        issues = quality_check(metrics, self.q)
        result = {
            "model_version": self.cfg.get("model_version", "unknown"),
            "quality": {"passed": not issues, "metrics": metrics, "issues": issues},
        }
        if issues:
            result["status"] = "rejected"
            return result, None

        prob, cam, emb = self.predict_array(preprocess(img, self.size, self.mean, self.std, self.border_crop))
        ood = float(self.ood_score(emb)[0])
        metrics["ood_score"] = ood
        ood_max = self.q.get("ood_max")
        if ood_max is not None and ood > float(ood_max):
            result["quality"]["passed"] = False
            result["quality"]["issues"] = [{"code": "TIDAK_DIKENALI", "message": QUALITY_MESSAGES["TIDAK_DIKENALI"]}]
            result["status"] = "rejected"
            return result, None
        ood_warn = self.q.get("ood_warn")      # v3.1 soft band: unusual but plausible X-ray -> never HIJAU
        atypical = ood_warn is not None and ood > float(ood_warn)
        metrics["atypical"] = bool(atypical)

        k, pk = self.orientation(emb)
        metrics["orientation_deg"] = int(90 * k[0])
        metrics["orientation_prob"] = float(pk[0])
        if k[0] != 0 and pk[0] >= self.orient_min_prob:
            result["quality"]["passed"] = False
            result["quality"]["issues"] = [{"code": "SALAH_POSISI", "message": QUALITY_MESSAGES["SALAH_POSISI"]}]
            result["status"] = "rejected"
            return result, None

        p = float(prob[0])
        strength = heatmap_strength(p, self.t_low, self.t_high)
        result.update(
            status="ok",
            prob_tb=round(p, 4),
            thresholds={"t_low": self.t_low, "t_high": self.t_high},
            heatmap_strength=round(min(strength, 0.25) if atypical else strength, 3),   # faint map for atypical images
            triage=triage(p, symptoms, self.t_low, self.t_high, atypical=atypical),
            warnings=[ATYPICAL_WARNING] if atypical else [],
            disclaimer=DISCLAIMER,
        )
        return result, cam_to_frame(cam[0], self.border_crop, self.cam_ring, baseline=self.cam_baseline)


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def main(argv=None):
    ap = argparse.ArgumentParser(description="PulmoTriage offline TB triage from a chest X-ray image.")
    ap.add_argument("--image", help="Path to the chest X-ray image (PNG/JPG).")
    ap.add_argument("--symptoms", default="", help="Comma-separated symptom keys, e.g. batuk_2minggu,demam")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--config", default=DEFAULT_CONFIG)
    ap.add_argument("--out", default=None, help="Where to save the heatmap PNG (default: <image>_heatmap.png)")
    ap.add_argument("--list-symptoms", action="store_true")
    a = ap.parse_args(argv)

    if a.list_symptoms:
        for k, v in SYMPTOMS.items():
            print(f"{k:22s} {v}")
        return 0
    if not a.image:
        ap.error("--image is required")

    engine = PulmoTriage(a.model, a.config)
    img = load_image(a.image)
    symptoms = [s.strip() for s in a.symptoms.split(",") if s.strip()]
    result, cam = engine.analyze(img, symptoms)
    if cam is not None:
        out = a.out or os.path.splitext(a.image)[0] + "_heatmap.png"
        overlay_heatmap(img, cam, strength=result["heatmap_strength"]).save(out)
        result["heatmap_path"] = out
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
