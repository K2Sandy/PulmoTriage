#!/usr/bin/env python3
"""
scripts/bandingkan.py
Alat perbandingan visual piksel antara tangkapan layar hasil dan referensi.

Penggunaan:
    python scripts/bandingkan.py <hasil.png> <ref.png> [--skala] [--toleransi 12] [--output <path>]
"""

import argparse
import os
import sys
from PIL import Image, ImageDraw
import numpy as np

try:
    import scipy.ndimage
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False


def bandingkan_gambar(hasil_path, ref_path, skala=False, toleransi=12, output_diff=None, abaikan=None):
    if not os.path.exists(hasil_path):
        print(f"Error: Berkas hasil tidak ditemukan: {hasil_path}", file=sys.stderr)
        return None
    if not os.path.exists(ref_path):
        print(f"Error: Berkas ref tidak ditemukan: {ref_path}", file=sys.stderr)
        return None

    img_hasil = Image.open(hasil_path).convert("RGB")
    img_ref = Image.open(ref_path).convert("RGB")

    w_h, h_h = img_hasil.size
    w_r, h_r = img_ref.size

    print(f"--- Perbandingan Visual ---")
    print(f"Hasil : {hasil_path} (Ukuran: {w_h}x{h_h})")
    print(f"Ref   : {ref_path} (Ukuran: {w_r}x{h_r})")

    if (w_h, h_h) != (w_r, h_r):
        if not skala:
            print(f"PERINGATAN: Dimensi gambar berbeda! ({w_h}x{h_h} vs {w_r}x{h_r})")
            print("Sesuai aturan: Tidak me-resize diam-diam. Gunakan opsi '--skala' bila ingin menyesuaikan ukuran.")
            return {
                "status": "dimensi_berbeda",
                "dim_hasil": (w_h, h_h),
                "dim_ref": (w_r, h_r),
                "persen_beda": 100.0,
                "area_terbesar": []
            }
        else:
            print(f"[INFO] Opsi --skala aktif: me-resize hasil ({w_h}x{h_h}) -> ({w_r}x{h_r}) dengan LANCZOS.")
            img_hasil = img_hasil.resize((w_r, h_r), Image.Resampling.LANCZOS)
            w_h, h_h = img_hasil.size

    arr_h = np.array(img_hasil, dtype=np.int16)
    arr_r = np.array(img_ref, dtype=np.int16)

    # Perbedaan kanal absolut
    diff_channels = np.abs(arr_h - arr_r)
    # Mask piksel yang melebihi toleransi pada kanal manapun
    diff_mask = np.any(diff_channels > toleransi, axis=2)

    # Area yang diabaikan (masking placeholder foto rontgen / heatmap)
    ignored_mask = np.zeros_like(diff_mask, dtype=bool)
    ignored_areas = []
    if abaikan:
        for item in abaikan:
            try:
                if isinstance(item, str):
                    ix, iy, iw, ih = [int(p.strip()) for p in item.split(",")]
                else:
                    ix, iy, iw, ih = item
                diff_mask[iy:iy + ih, ix:ix + iw] = False
                ignored_mask[iy:iy + ih, ix:ix + iw] = True
                ignored_areas.append((ix, iy, iw, ih))
                print(f"[INFO] Mengabaikan area: x={ix}, y={iy}, w={iw}, h={ih} ({iw * ih} piksel)")
            except Exception as e:
                print(f"[PERINGATAN] Format --abaikan salah '{item}': {e}", file=sys.stderr)

    total_pixels = diff_mask.size
    num_diff = int(np.count_nonzero(diff_mask))
    persen_beda = (num_diff / total_pixels) * 100.0

    print(f"Toleransi kanal : {toleransi}")
    print(f"Piksel berbeda  : {num_diff} / {total_pixels} ({persen_beda:.2f}%)")

    # Identifikasi 5 area terbesar yang berbeda
    area_terbesar = []
    if HAS_SCIPY and num_diff > 0:
        # Dilasi mask agar piksel-piksel berdekatan terkelompok ke komponen yang sama
        struct = np.ones((9, 9), dtype=bool)
        dilated = scipy.ndimage.binary_dilation(diff_mask, structure=struct)
        labeled, num_features = scipy.ndimage.label(dilated)
        slices = scipy.ndimage.find_objects(labeled)

        components = []
        for s in slices:
            if s is None:
                continue
            slice_mask = diff_mask[s]
            diff_count = int(np.count_nonzero(slice_mask))
            if diff_count > 0:
                y1, y2 = s[0].start, s[0].stop
                x1, x2 = s[1].start, s[1].stop
                components.append({
                    "x1": x1, "y1": y1,
                    "x2": x2, "y2": y2,
                    "w": x2 - x1, "h": y2 - y1,
                    "count": diff_count
                })

        # Urutkan berdasarkan jumlah piksel beda
        components.sort(key=lambda c: c["count"], reverse=True)
        area_terbesar = components[:5]

        print("\n5 Area Terbesar yang Berbeda:")
        for idx, area in enumerate(area_terbesar, 1):
            print(f"  {idx}. [x1={area['x1']}, y1={area['y1']}, x2={area['x2']}, y2={area['y2']}] "
                  f"(lebar={area['w']}, tinggi={area['h']} px, {area['count']} piksel beda)")
    elif num_diff == 0:
        print("\nTidak ada perbedaan piksel yang melebihi toleransi.")

    # Simpan peta selisih (diff map)
    if output_diff is None:
        ref_base = os.path.splitext(os.path.basename(ref_path))[0]
        output_diff = os.path.join("docs", "screenshots", "diff", f"{ref_base}_diff.png")

    os.makedirs(os.path.dirname(output_diff), exist_ok=True)

    # Buat citra diff komposit:
    # Latar abu-abu redup dari gambar ref, piksel beda disorot merah terang / magenta
    gray_ref = np.array(img_ref.convert("L"), dtype=np.uint8)
    diff_vis = np.stack([gray_ref // 2, gray_ref // 2, gray_ref // 2], axis=-1)

    # Beri warna merah magenta pada piksel berbeda
    diff_vis[diff_mask] = [235, 30, 90]

    # Beri highlight biru pada area yang diabaikan
    if np.any(ignored_mask):
        diff_vis[ignored_mask] = (diff_vis[ignored_mask] * 0.4 + np.array([0, 140, 230]) * 0.6).astype(np.uint8)

    out_img = Image.fromarray(diff_vis.astype(np.uint8))
    draw = ImageDraw.Draw(out_img)

    # Gambar batas area yang diabaikan
    for ix, iy, iw, ih in ignored_areas:
        draw.rectangle([ix, iy, ix + iw, iy + ih], outline=(0, 200, 255), width=2)
        draw.text((ix + 6, iy + 6), "[DIABAIKAN]", fill=(0, 200, 255))

    # Gambar kotak pembatas untuk 5 area terbesar
    for idx, area in enumerate(area_terbesar, 1):
        draw.rectangle([area["x1"], area["y1"], area["x2"], area["y2"]], outline=(255, 230, 0), width=3)
        draw.text((area["x1"] + 4, max(0, area["y1"] - 14)), f"#{idx}", fill=(255, 230, 0))

    out_img.save(output_diff)
    print(f"\nPeta selisih disimpan di: {output_diff}")

    return {
        "status": "ok",
        "persen_beda": persen_beda,
        "piksel_beda": num_diff,
        "total_piksel": total_pixels,
        "area_terbesar": area_terbesar,
        "ignored_areas": ignored_areas,
        "output_diff": output_diff
    }


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description="Bandingkan dua gambar PNG dan laporkan perbedaannya.")
    parser.add_argument("hasil", help="Path ke gambar hasil (tangkapan layar)")
    parser.add_argument("ref", help="Path ke gambar referensi")
    parser.add_argument("--skala", action="store_true", help="Izinkan resize gambar hasil jika dimensi berbeda dari ref")
    parser.add_argument("--toleransi", type=int, default=12, help="Toleransi perbedaan warna per kanal (default: 12)")
    parser.add_argument("--output", default=None, help="Path output peta selisih diff")
    parser.add_argument("--abaikan", action="append", default=[], help="Area persegi panjang yang diabaikan: x,y,w,h (bisa diulang)")

    args = parser.parse_args()
    res = bandingkan_gambar(args.hasil, args.ref, skala=args.skala, toleransi=args.toleransi, output_diff=args.output, abaikan=args.abaikan)
    if res is None or res.get("status") != "ok":
        sys.exit(1)


if __name__ == "__main__":
    main()
