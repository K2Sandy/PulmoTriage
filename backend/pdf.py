import base64
import io
import os
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from pulmotriage_infer import ATYPICAL_TEXT, DISCLAIMER, SYMPTOMS, TRIAGE_TEXT

# Isi nama Puskesmas lewat variabel lingkungan NAMA_FASILITAS, atau ubah teks di sini.
NAMA_FASILITAS = os.environ.get("NAMA_FASILITAS", "Puskesmas (isi nama Puskesmas)")

WARNA = {
    "MERAH": colors.HexColor("#b91c1c"),
    "KUNING": colors.HexColor("#a16207"),
    "HIJAU": colors.HexColor("#15803d"),
}
JK = {"L": "Laki-laki", "P": "Perempuan"}


def buat_pdf(p: dict) -> bytes:
    """p = satu baris tabel pemeriksaan (dict). Mengembalikan isi file PDF."""
    st = getSampleStyleSheet()
    normal = ParagraphStyle("n", parent=st["Normal"], fontSize=10, leading=14)
    kecil = ParagraphStyle("k", parent=normal, fontSize=8, leading=11, textColor=colors.HexColor("#444444"))
    judul = ParagraphStyle("j", parent=st["Title"], fontSize=16, leading=20)

    kategori = p["kategori"]
    judul_hasil, tindakan = ATYPICAL_TEXT if p["atipikal"] else TRIAGE_TEXT[kategori]
    gejala = [SYMPTOMS[k] for k in p["gejala"].split(",") if k in SYMPTOMS]
    ditinjau = p.get("keputusan_dokter")

    doc_io = io.BytesIO()
    doc = SimpleDocTemplate(doc_io, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=1.8 * cm, bottomMargin=1.8 * cm)
    e = []

    e.append(Paragraph(escape(NAMA_FASILITAS), normal))
    e.append(Paragraph("SURAT RUJUKAN" if ditinjau else "SURAT RUJUKAN (DRAFT)", judul))
    e.append(Paragraph(f"Nomor pemeriksaan {p['id']} &nbsp;|&nbsp; Tanggal {escape(p['dibuat_pada'][:10])}", normal))
    e.append(Spacer(1, 10))

    data = [
        ["Nama pasien", escape(p.get("nama") or "-")],
        ["Umur", f"{p['umur']} tahun" if p.get("umur") is not None else "-"],
        ["Jenis kelamin", JK.get(p.get("jenis_kelamin"), "-")],
        ["Gejala", escape(", ".join(gejala)) if gejala else "Tidak ada gejala yang dicentang"],
    ]
    t = Table([[Paragraph(a, normal), Paragraph(b, normal)] for a, b in data], colWidths=[4 * cm, 13 * cm])
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#bbbbbb")), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    e.append(t)
    e.append(Spacer(1, 12))

    warna = WARNA[kategori]
    e.append(Paragraph(f'<font color="{warna.hexval()}" size="14"><b>{kategori}: {escape(judul_hasil)}</b></font>', normal))
    e.append(Paragraph(f"Skor AI (kemungkinan TBC): {p['prob_tb']:.2f}", normal))
    e.append(Paragraph(f"Tindak lanjut: {escape(tindakan)}", normal))
    if p["atipikal"]:
        e.append(Paragraph("Catatan: citra kurang khas, skor dan peta panas kurang dapat dipercaya.", normal))
    e.append(Spacer(1, 8))

    if p.get("heatmap_png"):
        gambar = io.BytesIO(base64.b64decode(p["heatmap_png"]))
        e.append(Image(gambar, width=9 * cm, height=9 * cm, kind="proportional"))
        e.append(Paragraph("Peta panas Grad-CAM: area yang paling membuat AI curiga. Bukan batas lesi.", kecil))
    e.append(Spacer(1, 10))

    if ditinjau:
        arti = "Dokter setuju dengan hasil ini" if ditinjau == "setuju" else "Dokter TIDAK setuju dengan hasil AI"
        e.append(Paragraph(f"<b>Tinjauan dokter:</b> {arti}. {escape(p.get('catatan_dokter') or '')}", normal))
    else:
        e.append(Paragraph('<font color="#b91c1c"><b>DRAFT: belum ditinjau dokter.</b></font>', normal))
    e.append(Spacer(1, 28))
    e.append(Paragraph("Dokter pemeriksa: ______________________ &nbsp;&nbsp; Tanda tangan: ______________", normal))
    e.append(Spacer(1, 16))
    e.append(Paragraph(escape(DISCLAIMER), kecil))
    e.append(Paragraph(f"Dibuat otomatis oleh PulmoTriage, model {escape(p.get('model_version') or '-')}.", kecil))

    doc.build(e)
    return doc_io.getvalue()
