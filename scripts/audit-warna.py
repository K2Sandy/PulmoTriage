#!/usr/bin/env python3
"""
scripts/audit-warna.py
Audit warna dan palet desain:
(a) Ekstraksi ~12 warna dominan per citra referensi di docs/ref/*.png dan pencocokan ke token DESIGN.md.
(b) Pemindaian frontend/ untuk mendeteksi kelas bawaan Tailwind dan hex literal non-token.

Penggunaan:
    python scripts/audit-warna.py [--ref-dir docs/ref] [--design docs/DESIGN.md] [--frontend frontend]
"""

import argparse
import glob
import os
import re
import sys
from PIL import Image
import numpy as np


def hex_to_rgb(hex_str):
    hex_str = hex_str.strip().lstrip("#")
    if len(hex_str) == 3:
        hex_str = "".join([c * 2 for c in hex_str])
    if len(hex_str) >= 6:
        return (
            int(hex_str[0:2], 16),
            int(hex_str[2:4], 16),
            int(hex_str[4:6], 16)
        )
    return (0, 0, 0)


def muat_token_desain(design_path="docs/DESIGN.md"):
    if not os.path.exists(design_path):
        print(f"Peringatan: Berkas desain {design_path} tidak ditemukan.", file=sys.stderr)
        return {}

    tokens = {}
    with open(design_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Ekstrak blok colors dari frontmatter YAML (termasuk baris komentar)
    match = re.search(r"colors:\s*\n((?:\s*(?:#.*|[\w\-]+:\s*\"#[0-9a-fA-F]+\"(?:\s*#.*)?)\r?\n)+)", content)
    if match:
        block = match.group(1)
        for line in block.strip().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            m = re.match(r"([\w\-]+):\s*\"(#[0-9a-fA-F]+)\"", line)
            if m:
                nama, val = m.group(1), m.group(2).upper()
                tokens[nama] = {
                    "hex": val,
                    "rgb": hex_to_rgb(val)
                }

    # Jika parsing frontmatter tidak menemukan token, ambil semua pola token: hex
    if not tokens:
        for m in re.finditer(r"([\w\-]+):\s*\"?(#[0-9a-fA-F]{6})\"?", content):
            nama, val = m.group(1), m.group(2).upper()
            tokens[nama] = {
                "hex": val,
                "rgb": hex_to_rgb(val)
            }

    return tokens


def cocokkan_ke_token(rgb, tokens, toleransi=6):
    """Mencocokkan warna (r, g, b) ke token dengan toleransi per kanal <= toleransi."""
    r, g, b = rgb
    terdekat = None
    selisih_min = float("inf")

    for nama, tok in tokens.items():
        tr, tg, tb = tok["rgb"]
        selisih_kanal = max(abs(r - tr), abs(g - tg), abs(b - tb))
        if selisih_kanal <= toleransi:
            return nama, tok["hex"], selisih_kanal
        if selisih_kanal < selisih_min:
            selisih_min = selisih_kanal
            terdekat = (nama, tok["hex"], selisih_min)

    return None, None, selisih_min


def audit_ref_warna(ref_dir="docs/ref", tokens=None, toleransi=6):
    print("=" * 80)
    print("AUDIT (A): WARNA DOMINAN CITRA REFERENSI vs TOKEN DESIGN.MD")
    print(f"Toleransi kecocokan: {toleransi} per kanal")
    print("=" * 80)

    if not tokens:
        print("Error: Tidak ada token warna yang dimuat.", file=sys.stderr)
        return {}

    ref_files = sorted(glob.glob(os.path.join(ref_dir, "*.png")))
    hasil_audit = {}

    for ref_path in ref_files:
        nama_file = os.path.basename(ref_path)
        # Skip logo jika ada
        if "logo" in nama_file.lower():
            continue

        try:
            im = Image.open(ref_path).convert("RGB")
        except Exception as e:
            print(f"Gagal membuka {nama_file}: {e}")
            continue

        # Kuantisasi ke ~12 warna
        im_quant = im.quantize(colors=12, method=Image.Quantize.MEDIANCUT)
        palette = im_quant.getpalette()[: 12 * 3]
        counts = im_quant.getcolors()

        if not counts:
            continue

        total_pixels = im.width * im.height
        counts.sort(key=lambda x: x[0], reverse=True)

        warna_list = []
        warna_non_token = []

        for count, idx in counts:
            r = palette[idx * 3]
            g = palette[idx * 3 + 1]
            b = palette[idx * 3 + 2]
            rgb = (r, g, b)
            hex_val = f"#{r:02X}{g:02X}{b:02X}"
            persen = (count / total_pixels) * 100.0

            token_nama, token_hex, selisih = cocokkan_ke_token(rgb, tokens, toleransi=toleransi)
            if token_nama:
                status = f"TOKEN: {token_nama} ({token_hex}, diff={selisih})"
            else:
                status = "TIDAK ADA DI TOKEN"
                warna_non_token.append({
                    "hex": hex_val,
                    "rgb": rgb,
                    "persen": persen
                })

            warna_list.append({
                "hex": hex_val,
                "rgb": rgb,
                "persen": persen,
                "token": token_nama,
                "status": status
            })

        hasil_audit[nama_file] = {
            "semua_warna": warna_list,
            "non_token": warna_non_token
        }

        print(f"\n[Ref: {nama_file}] (Ukuran: {im.width}x{im.height})")
        print(f"  Dominan non-token: {len(warna_non_token)} / {len(warna_list)}")
        for idx, w in enumerate(warna_list, 1):
            tanda = "[OK] " if "TOKEN:" in w["status"] else "[X]  "
            print(f"    {tanda} {w['hex']} ({w['persen']:5.1f}% piksel) -> {w['status']}")

    return hasil_audit


def audit_frontend_kode(frontend_dir="frontend", tokens=None):
    print("\n" + "=" * 80)
    print("AUDIT (B): KELAS BAWAAN TAILWIND & HEX NON-TOKEN DI FRONTEND/")
    print("=" * 80)

    pola_tailwind = re.compile(
        r"\b(?:[a-z0-9\-:]+)?(cyan|teal|gray|zinc|slate|red|yellow|green|fuchsia|emerald|pink|stone|neutral)-(\d{2,3})\b"
    )
    pola_hex = re.compile(r"#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")

    token_hex_set = set()
    if tokens:
        for t in tokens.values():
            token_hex_set.add(t["hex"].upper())
            # Tambahkan format 3 digit bila ada
            h = t["hex"].upper().lstrip("#")
            if h[0] == h[1] and h[2] == h[3] and h[4] == h[5]:
                token_hex_set.add(f"#{h[0]}{h[2]}{h[4]}")

    ekstensi = (".js", ".jsx", ".ts", ".tsx", ".css")
    temuan_tailwind = []
    temuan_hex = []

    for root, dirs, files in os.walk(frontend_dir):
        # Abaikan direktori build & dependencies
        dirs[:] = [d for d in dirs if d not in (".next", "node_modules", ".git", "dist", "out")]
        for file in files:
            if file.endswith(ekstensi):
                filepath = os.path.join(root, file)
                rel_path = os.path.relpath(filepath, ".")

                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        lines = f.readlines()
                except Exception:
                    continue

                for line_no, line in enumerate(lines, 1):
                    # Cari kelas tailwind
                    matches_tw = pola_tailwind.findall(line)
                    for warna_kel, shade in matches_tw:
                        temuan_tailwind.append({
                            "file": rel_path,
                            "line": line_no,
                            "match": f"{warna_kel}-{shade}",
                            "content": line.strip()
                        })

                    # Cari hex literal
                    matches_hex = pola_hex.findall(line)
                    for h in matches_hex:
                        h_upper = h.upper()
                        # Standarisasi 3 digit ke 6 digit
                        if len(h_upper) == 4:
                            h_norm = f"#{h_upper[1]*2}{h_upper[2]*2}{h_upper[3]*2}"
                        else:
                            h_norm = h_upper

                        if h_norm not in token_hex_set and h_upper not in token_hex_set:
                            temuan_hex.append({
                                "file": rel_path,
                                "line": line_no,
                                "match": h,
                                "content": line.strip()
                            })

    print(f"\n1. Kelas Palet Bawaan Tailwind Terdeteksi: {len(temuan_tailwind)} kemunculan")
    tw_by_file = {}
    for t in temuan_tailwind:
        tw_by_file.setdefault(t["file"], []).append(t)

    for f_path, items in sorted(tw_by_file.items()):
        print(f"\n  Berkas: {f_path} ({len(items)} kelas)")
        for item in items[:15]:  # tampilkan 15 pertama
            print(f"    Baris {item['line']:4d}: '{item['match']}' -> {item['content'][:80]}")
        if len(items) > 15:
            print(f"    ... dan {len(items) - 15} lainnya.")

    print(f"\n2. Hex Literal Non-Token Terdeteksi: {len(temuan_hex)} kemunculan")
    hex_by_file = {}
    for t in temuan_hex:
        hex_by_file.setdefault(t["file"], []).append(t)

    for f_path, items in sorted(hex_by_file.items()):
        print(f"\n  Berkas: {f_path} ({len(items)} hex literal)")
        for item in items:
            print(f"    Baris {item['line']:4d}: '{item['match']}' -> {item['content'][:80]}")

    return {
        "tailwind": temuan_tailwind,
        "hex": temuan_hex
    }


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description="Audit warna desain dan kode frontend.")
    parser.add_argument("--ref-dir", default="docs/ref", help="Direktori citra referensi PNG")
    parser.add_argument("--design", default="docs/DESIGN.md", help="Path ke berkas DESIGN.md")
    parser.add_argument("--frontend", default="frontend", help="Direktori kode frontend")
    parser.add_argument("--toleransi", type=int, default=6, help="Toleransi perbedaan warna per kanal (default: 6)")

    args = parser.parse_args()

    tokens = muat_token_desain(args.design)
    print(f"Memuat {len(tokens)} token warna dari {args.design}:")
    for k, v in tokens.items():
        print(f"  - {k:22}: {v['hex']} {v['rgb']}")

    res_ref = audit_ref_warna(args.ref_dir, tokens, toleransi=args.toleransi)
    res_code = audit_frontend_kode(args.frontend, tokens)


if __name__ == "__main__":
    main()
