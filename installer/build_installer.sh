#!/usr/bin/env bash
# Membangun PulmoTriage-Setup-<versi>.exe (installer Windows) dari folder backend/.
# Jalan di Linux atau WSL. Butuh: python3.11 + pip, curl, unzip, makensis (paket "nsis").
#
#   bash installer/build_installer.sh     # versi diambil dari backend/versi.py
#
# Hasil: installer/dist/PulmoTriage-Setup-<versi>.exe dan salinan bernama tetap
#        installer/dist/PulmoTriage-Setup.exe (untuk diunggah ke GitHub Releases).
#        Jangan di-commit.
set -euo pipefail

PY_VER="3.11.9"
AKAR="$(cd "$(dirname "$0")/.." && pwd)"
VERSI="$(python3.11 -c "import re,sys; print(re.search(r'VERSI\s*=\s*\"([^\"]+)\"', open(sys.argv[1]).read()).group(1))" "$AKAR/backend/versi.py")"
KERJA="$AKAR/installer/build"
CACHE="$AKAR/installer/cache"
SUSUN="$KERJA/PulmoTriage"
DIST="$AKAR/installer/dist"

echo "== PulmoTriage installer $VERSI"
[ -f "$AKAR/backend/web/index.html" ] || { echo "backend/web belum ada. Jalankan dulu: cd frontend && npm run build:offline"; exit 1; }
[ -f "$AKAR/backend/lisensi_publik.pem" ] || { echo "backend/lisensi_publik.pem belum ada. Jalankan scripts/lisensi/buat_kunci.py"; exit 1; }
command -v makensis >/dev/null || { echo "makensis tidak ditemukan. Pasang: sudo apt install nsis"; exit 1; }

rm -rf "$KERJA" && mkdir -p "$SUSUN/python/Lib/site-packages" "$SUSUN/app" "$CACHE" "$DIST"

# 1. Python embeddable untuk Windows (resmi dari python.org)
ZIP="$CACHE/python-$PY_VER-embed-amd64.zip"
[ -f "$ZIP" ] || curl -fsSL -o "$ZIP" "https://www.python.org/ftp/python/$PY_VER/python-$PY_VER-embed-amd64.zip"
unzip -q "$ZIP" -d "$SUSUN/python"
# Aktifkan site-packages dan folder app
cat > "$SUSUN/python/python311._pth" <<PTH
python311.zip
.
Lib\\site-packages
..\\app
import site
PTH

# 2. Paket Python versi Windows (dipasang langsung, tanpa internet di komputer Puskesmas)
REQ="$KERJA/req-win.txt"
sed 's/uvicorn\[standard\]/uvicorn/' "$AKAR/backend/requirements.txt" > "$REQ"
printf 'colorama\npyreadline3\n' >> "$REQ"   # dependensi khusus Windows (marker tidak terbaca saat build di Linux)
python3.11 -m pip install -q --target "$SUSUN/python/Lib/site-packages" \
  --platform win_amd64 --python-version 3.11 --implementation cp --abi cp311 \
  --only-binary=:all: --no-compile -r "$REQ"
rm -rf "$SUSUN/python/Lib/site-packages/bin"

# 3. Runtime Microsoft Visual C++ (dibutuhkan onnxruntime), disalin di samping python.exe
python3.11 -m pip download -q --dest "$CACHE/vc" --platform win_amd64 --python-version 3.11 --only-binary=:all: msvc-runtime
VCW="$(ls "$CACHE"/vc/msvc_runtime-*.whl | head -1)"
unzip -q -o "$VCW" -d "$KERJA/vc"
cp -f "$KERJA"/vc/msvc_runtime-*.data/data/Scripts/*.dll "$SUSUN/python/"

# 4. Aplikasi (backend + tampilan offline)
cd "$AKAR/backend"
cp main.py db.py pdf.py sinkron.py lisensi.py pembaruan.py versi.py pulmotriage_infer.py pulmotriage.onnx \
   pulmotriage_config.json lisensi_publik.pem requirements.txt "$SUSUN/app/"
cp -r assets web "$SUSUN/app/"
cp "$AKAR/installer/launcher.py" "$SUSUN/app/"

# 5. Ikon dari logo
python3.11 - "$AKAR/frontend/public/logo.png" "$SUSUN/pulmotriage.ico" <<'PY'
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGBA")
w, h = im.size
s = max(w, h)
kanvas = Image.new("RGBA", (s, s), (0, 0, 0, 0))
kanvas.paste(im, ((s - w) // 2, (s - h) // 2))
kanvas.save(sys.argv[2], sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
PY

# 6. Bangun installer
cd "$AKAR/installer"
makensis -V2 -DVERSI="$VERSI" -DSUMBER="$SUSUN" pulmotriage.nsi
mv -f "PulmoTriage-Setup-$VERSI.exe" "$DIST/"
cp -f "$DIST/PulmoTriage-Setup-$VERSI.exe" "$DIST/PulmoTriage-Setup.exe"
echo "== Selesai: $DIST/PulmoTriage-Setup-$VERSI.exe ($(du -h "$DIST/PulmoTriage-Setup-$VERSI.exe" | cut -f1))"
