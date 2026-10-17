import base64
import io
import os
from datetime import date
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from pulmotriage_infer import ATYPICAL_TEXT, DISCLAIMER, SYMPTOMS, TRIAGE_TEXT

# Nama fasilitas di kop surat: diambil dari lisensi. Variabel NAMA_FASILITAS hanya cadangan.
NAMA_FASILITAS = os.environ.get("NAMA_FASILITAS", "Puskesmas")

AKAR = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(AKAR, "assets", "fonts")
LOGO = os.path.join(AKAR, "assets", "logo.png")

# --- Font: Fraunces (judul) dan Atkinson Hyperlegible (isi), sama dengan aplikasi.
# Kalau file font tidak ada, otomatis memakai Helvetica supaya PDF tetap jadi.
def _daftar_font():
    pasangan = {
        "Judul": "FrauncesSemiBold-Regular.ttf",
        "Isi": "AtkinsonHyperlegibleNext-Regular.ttf",
        "Isi-Bold": "AtkinsonHyperlegibleNext-Bold.ttf",
    }
    try:
        for nama, berkas in pasangan.items():
            pdfmetrics.registerFont(TTFont(nama, os.path.join(FONT_DIR, berkas)))
        pdfmetrics.registerFontFamily("Isi", normal="Isi", bold="Isi-Bold", italic="Isi", boldItalic="Isi-Bold")
        return "Judul", "Isi", "Isi-Bold"
    except Exception:
        return "Helvetica-Bold", "Helvetica", "Helvetica-Bold"


F_JUDUL, F_ISI, F_TEBAL = _daftar_font()

# --- Warna: sama dengan token desain aplikasi.
HEX = lambda h: colors.HexColor(h)
PRIMER = HEX("#0B7A85")
INK = HEX("#10292C")
MUTED = HEX("#55706F")
GARIS = HEX("#D5E2E3")
LATAR = HEX("#F3F7F7")
TRIASE = {
    # kategori: (warna latar, warna teks di atasnya)
    "MERAH": (HEX("#C62828"), colors.white),
    "KUNING": (HEX("#F2B705"), HEX("#1F1600")),
    "HIJAU": (HEX("#2E7D32"), colors.white),
}
JK = {"L": "Laki-laki", "P": "Perempuan"}
LEVEL = {"HIGH": "Tinggi", "MID": "Sedang", "LOW": "Rendah"}
BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

LEBAR = A4[0] - 4 * cm  # lebar isi (margin kiri-kanan 2 cm)


def _tanggal(iso):
    try:
        d = date.fromisoformat(iso[:10])
        return f"{d.day} {BULAN[d.month - 1]} {d.year}"
    except Exception:
        return iso[:10]


def _gaya():
    def g(nama, **kw):
        dasar = dict(fontName=F_ISI, fontSize=10, leading=14.5, textColor=INK, alignment=TA_LEFT)
        dasar.update(kw)
        return ParagraphStyle(nama, **dasar)

    return {
        "isi": g("isi"),
        "kecil": g("kecil", fontSize=8.5, leading=12, textColor=MUTED),
        "label": g("label", fontName=F_TEBAL, fontSize=7.5, leading=10, textColor=MUTED),
        "nilai": g("nilai", fontSize=11, leading=15),
        "judul": g("judul", fontName=F_JUDUL, fontSize=24, leading=28),
        "skor": g("skor", fontName=F_JUDUL, fontSize=36, leading=40),
        "bagian": g("bagian", fontName=F_TEBAL, fontSize=7.5, leading=10, textColor=PRIMER),
    }


def _kop_dan_kaki(c, doc):
    """Digambar di setiap halaman: pita atas, logo, nama fasilitas, dan kaki halaman."""
    w, h = A4
    c.saveState()
    c.setFillColor(PRIMER)
    c.rect(0, h - 0.45 * cm, w, 0.45 * cm, stroke=0, fill=1)

    y_logo = h - 0.45 * cm - 1.25 * cm - 0.5 * cm
    try:
        c.drawImage(LOGO, 2 * cm, y_logo, width=1.25 * cm * 336 / 285, height=1.25 * cm, mask="auto", preserveAspectRatio=True)
        x_teks = 2 * cm + 1.25 * cm * 336 / 285 + 0.3 * cm
    except Exception:
        x_teks = 2 * cm
    c.setFillColor(INK)
    c.setFont(F_JUDUL, 14)
    c.drawString(x_teks, y_logo + 0.62 * cm, "PulmoTriage")
    c.setFont(F_ISI, 8)
    c.setFillColor(MUTED)
    c.drawString(x_teks, y_logo + 0.18 * cm, "Triase TBC dari rontgen dada dan gejala")

    c.setFont(F_TEBAL, 10)
    c.setFillColor(INK)
    c.drawRightString(w - 2 * cm, y_logo + 0.62 * cm, doc._fasilitas)
    c.setFont(F_ISI, 8)
    c.setFillColor(MUTED)
    c.drawRightString(w - 2 * cm, y_logo + 0.18 * cm, "Fasilitas pelayanan kesehatan")

    c.setStrokeColor(GARIS)
    c.setLineWidth(0.8)
    c.line(2 * cm, y_logo - 0.3 * cm, w - 2 * cm, y_logo - 0.3 * cm)

    # kaki halaman
    c.setStrokeColor(GARIS)
    c.line(2 * cm, 1.75 * cm, w - 2 * cm, 1.75 * cm)
    c.setFont(F_ISI, 7.5)
    c.setFillColor(MUTED)
    c.drawString(2 * cm, 1.3 * cm, f"Dibuat otomatis oleh PulmoTriage, model {doc._model_version}")
    c.drawRightString(w - 2 * cm, 1.3 * cm, f"Halaman {doc.page}")
    c.restoreState()


def _chip(teks, latar, warna_teks, st):
    s = ParagraphStyle("chip", parent=st["label"], textColor=warna_teks, fontSize=8, leading=10, alignment=1)
    t = Table([[Paragraph(escape(teks), s)]], colWidths=[4.6 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), latar),
                ("ROUNDEDCORNERS", [8, 8, 8, 8]),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def buat_pdf(p: dict, fasilitas: str | None = None) -> bytes:
    """p = satu baris tabel pemeriksaan (dict). fasilitas = nama Puskesmas dari lisensi. Mengembalikan isi file PDF."""
    st = _gaya()
    kategori = p["kategori"]
    latar, teks_di_atas = TRIASE[kategori]
    judul_hasil, tindakan = ATYPICAL_TEXT if p["atipikal"] else TRIAGE_TEXT[kategori]
    gejala = [SYMPTOMS[k] for k in p["gejala"].split(",") if k in SYMPTOMS]
    ditinjau = p.get("keputusan_dokter")

    buf = io.BytesIO()
    doc = BaseDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=3.6 * cm,
        bottomMargin=2.3 * cm,
        title=f"Surat rujukan {p['id']}",
        author="PulmoTriage",
    )
    doc._model_version = p.get("model_version") or "-"
    doc._fasilitas = (fasilitas or NAMA_FASILITAS)[:60]
    doc.addPageTemplates(
        [PageTemplate(id="p", frames=[Frame(doc.leftMargin, doc.bottomMargin, LEBAR, A4[1] - doc.topMargin - doc.bottomMargin, id="f", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], onPage=_kop_dan_kaki)]
    )
    e = []

    # --- Judul + status
    if ditinjau:
        chip = _chip("SUDAH DITINJAU DOKTER", HEX("#E7F3F4"), PRIMER, st)
    else:
        chip = _chip("DRAFT · BELUM DITINJAU", HEX("#F7EEF8"), HEX("#7A2E8A"), st)
    kepala = Table(
        [[Paragraph("Surat Rujukan", st["judul"]), chip]],
        colWidths=[LEBAR - 4.6 * cm, 4.6 * cm],
    )
    kepala.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    e.append(kepala)
    e.append(Paragraph(f"Nomor pemeriksaan {p['id']} &nbsp;·&nbsp; {escape(_tanggal(p['dibuat_pada']))}", st["kecil"]))
    e.append(Spacer(1, 14))

    # --- Data pasien
    def sel(label, nilai):
        return [Paragraph(label.upper(), st["label"]), Paragraph(nilai, st["nilai"])]

    umur = f"{p['umur']} tahun" if p.get("umur") is not None else "-"
    pasien = Table(
        [
            [sel("Nama pasien", escape(p.get("nama") or "-")), sel("Umur", umur), sel("Jenis kelamin", JK.get(p.get("jenis_kelamin"), "-"))],
            [sel("Gejala yang dilaporkan", escape(", ".join(gejala)) if gejala else "Tidak ada gejala yang dicentang"), "", ""],
        ],
        colWidths=[LEBAR * 0.5, LEBAR * 0.25, LEBAR * 0.25],
    )
    pasien.setStyle(
        TableStyle(
            [
                ("SPAN", (0, 1), (2, 1)),
                ("BACKGROUND", (0, 0), (-1, -1), LATAR),
                ("BOX", (0, 0), (-1, -1), 0.8, GARIS),
                ("LINEBELOW", (0, 0), (-1, 0), 0.8, GARIS),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 11),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                ("ROUNDEDCORNERS", [8, 8, 8, 8]),
            ]
        )
    )
    e.append(pasien)
    e.append(Spacer(1, 14))

    # --- Hasil triase (blok warna)
    s_kat = ParagraphStyle("kat", parent=st["label"], textColor=teks_di_atas, fontSize=9, leading=12)
    s_jdl = ParagraphStyle("jdl", parent=st["judul"], textColor=teks_di_atas, fontSize=19, leading=23)
    s_tdk = ParagraphStyle("tdk", parent=st["isi"], textColor=teks_di_atas, fontSize=10.5, leading=15)
    hasil = Table(
        [
            [Paragraph("HASIL TRIASE · " + kategori, s_kat)],
            [Paragraph(escape(judul_hasil), s_jdl)],
            [Paragraph("<b>Tindak lanjut:</b> " + escape(tindakan), s_tdk)],
        ],
        colWidths=[LEBAR],
    )
    hasil.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), latar),
                ("LEFTPADDING", (0, 0), (-1, -1), 14),
                ("RIGHTPADDING", (0, 0), (-1, -1), 14),
                ("TOPPADDING", (0, 0), (0, 0), 12),
                ("BOTTOMPADDING", (0, 0), (0, 0), 2),
                ("TOPPADDING", (0, 1), (-1, -1), 2),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 13),
                ("ROUNDEDCORNERS", [8, 8, 8, 8]),
            ]
        )
    )
    e.append(hasil)
    e.append(Spacer(1, 14))

    # --- Skor AI (kiri) dan peta panas (kanan)
    skor = f"{p['prob_tb']:.2f}".replace(".", ",")
    kiri = [
        Paragraph("SKOR AI", st["bagian"]),
        Paragraph(skor, st["skor"]),
        Paragraph("kemungkinan TBC dari rontgen, skala 0 sampai 1", st["kecil"]),
        Spacer(1, 8),
        Paragraph("TINGKAT RISIKO AI", st["bagian"]),
        Paragraph(LEVEL.get(p["ai_level"], p["ai_level"]), st["nilai"]),
    ]
    if p["atipikal"]:
        kiri += [
            Spacer(1, 8),
            Paragraph("<b>Catatan:</b> citra kurang khas. Skor dan peta panas kurang dapat dipercaya; pastikan ini rontgen dada posisi depan.", st["kecil"]),
        ]
    kanan = []
    if p.get("heatmap_png"):
        try:
            gambar = io.BytesIO(base64.b64decode(p["heatmap_png"]))
            kanan.append(Image(gambar, width=6.4 * cm, height=6.4 * cm, kind="proportional"))
            kanan.append(Spacer(1, 3))
            kanan.append(Paragraph("Peta panas Grad-CAM: area yang paling membuat AI curiga. Bukan batas lesi.", st["kecil"]))
        except Exception:
            kanan.append(Paragraph("Peta panas tidak tersedia.", st["kecil"]))
    else:
        kanan.append(Paragraph("Peta panas tidak tersedia.", st["kecil"]))
    isi = Table([[kiri, kanan]], colWidths=[LEBAR - 7 * cm, 7 * cm])
    isi.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (0, 0), 14),
                ("RIGHTPADDING", (1, 0), (1, 0), 0),
            ]
        )
    )
    e.append(isi)
    e.append(Spacer(1, 14))

    # --- Tinjauan dokter
    if ditinjau:
        arti = "Dokter setuju dengan hasil ini." if ditinjau == "setuju" else "Dokter TIDAK setuju dengan hasil AI."
        catatan = escape(p.get("catatan_dokter") or "")
        teks = f"<b>Tinjauan dokter:</b> {arti}" + (f"<br/>Catatan: {catatan}" if catatan else "")
        warna_kotak, warna_garis = HEX("#E7F3F4"), PRIMER
    else:
        teks = "<b>Draf belum ditinjau dokter.</b> Surat ini perlu ditinjau dan ditandatangani dokter sebelum dipakai sebagai rujukan."
        warna_kotak, warna_garis = HEX("#F7EEF8"), HEX("#7A2E8A")
    tinjau = Table([[Paragraph(teks, st["isi"])]], colWidths=[LEBAR])
    tinjau.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), warna_kotak),
                ("LINEBEFORE", (0, 0), (0, -1), 3, warna_garis),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ]
        )
    )

    # --- Tanda tangan
    garis = "_" * 34
    ttd = Table(
        [
            [Paragraph("Dokter pemeriksa", st["kecil"]), Paragraph("Tanda tangan dan tanggal", st["kecil"])],
            [Spacer(1, 30), Spacer(1, 30)],
            [Paragraph(garis, st["kecil"]), Paragraph(garis, st["kecil"])],
        ],
        colWidths=[LEBAR / 2, LEBAR / 2],
    )
    ttd.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 1)]))

    e.append(KeepTogether([tinjau, Spacer(1, 16), ttd, Spacer(1, 14), Paragraph(escape(DISCLAIMER), st["kecil"])]))

    doc.build(e)
    return buf.getvalue()
