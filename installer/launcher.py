"""Peluncur PulmoTriage untuk versi terpasang (installer Windows).

Dijalankan oleh shortcut "PulmoTriage" di desktop:
    python\\python.exe app\\launcher.py

- Data pasien dan lisensi disimpan di %LOCALAPPDATA%\\PulmoTriage\\data,
  terpisah dari program, jadi tidak hilang saat aplikasi diperbarui atau dihapus.
- Server hanya bisa dibuka dari komputer ini (127.0.0.1), tidak dari jaringan.
- Kalau PulmoTriage sudah berjalan, peluncur cukup membuka browser.
"""

import json
import os
import socket
import sys
import threading
import time
import urllib.request
import webbrowser

PORT = int(os.environ.get("PULMOTRIAGE_PORT", "8000"))
URL = f"http://localhost:{PORT}"
AKAR = os.path.dirname(os.path.abspath(__file__))


def siapkan_lingkungan():
    data = os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "PulmoTriage", "data")
    os.makedirs(data, exist_ok=True)
    os.environ.setdefault("PULMOTRIAGE_DB", os.path.join(data, "pulmotriage.db"))
    os.environ.setdefault("LISENSI_FILE", os.path.join(data, "lisensi.json"))
    os.environ.setdefault("CLOUD_URL", "https://pulmotriage-cloud.onrender.com")
    os.environ.setdefault("SINKRON_DETIK", "60")
    return data


def port_terpakai():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", PORT)) == 0


def pulmotriage_hidup():
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/health", timeout=2) as r:
            return "model_version" in json.loads(r.read().decode("utf-8"))
    except Exception:
        return False


def buka_browser_saat_siap():
    for _ in range(120):  # tunggu model selesai dimuat, paling lama sekitar 60 detik
        if pulmotriage_hidup():
            webbrowser.open(URL)
            return
        time.sleep(0.5)
    print("PulmoTriage belum siap. Coba buka", URL, "secara manual.")


def main():
    if os.name == "nt":
        os.system("title PulmoTriage - jangan tutup jendela ini")
    data = siapkan_lingkungan()

    if port_terpakai():
        if pulmotriage_hidup():
            print("PulmoTriage sudah berjalan. Membuka browser...")
            webbrowser.open(URL)
            time.sleep(2)
            return
        print(f"Port {PORT} sedang dipakai program lain. Tutup program itu lalu jalankan PulmoTriage lagi.")
        input("Tekan Enter untuk keluar...")
        sys.exit(1)

    print()
    print("  PulmoTriage - alat bantu triase TBC")
    print("  -----------------------------------")
    print(f"  Alamat aplikasi : {URL}")
    print(f"  Data tersimpan  : {data}")
    print("  Biarkan jendela ini terbuka selama memakai PulmoTriage.")
    print("  Untuk menutup aplikasi, tutup jendela ini.")
    print()

    os.chdir(AKAR)
    sys.path.insert(0, AKAR)
    threading.Thread(target=buka_browser_saat_siap, daemon=True).start()

    import uvicorn

    try:
        uvicorn.run("main:app", host="127.0.0.1", port=PORT, log_level="warning")
    except Exception as e:  # tampilkan error dengan jelas, jangan langsung menutup jendela
        print("\nPulmoTriage berhenti karena galat:", repr(e))
        input("Tekan Enter untuk keluar...")
        raise


if __name__ == "__main__":
    main()
