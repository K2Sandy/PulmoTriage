@echo off
setlocal
title PulmoTriage
cd /d "%~dp0backend"

echo.
echo  PulmoTriage - alat bantu triase TBC
echo  -----------------------------------
echo.

if not exist "web\index.html" (
  echo  Tampilan belum dibangun. Jalankan dulu:  cd frontend  lalu  npm run build:offline
  pause
  exit /b 1
)

rem Pakai folder Python yang sudah ada (.venv atau venv). Kalau belum ada, buat .venv.
set "VENV="
if exist ".venv\Scripts\python.exe" set "VENV=.venv"
if not defined VENV if exist "venv\Scripts\python.exe" set "VENV=venv"
if not defined VENV (
  echo  Menyiapkan Python untuk pertama kali...
  py -3.11 -m venv .venv
  if errorlevel 1 (
    echo  Python 3.11 belum terpasang. Pasang dari python.org lalu jalankan lagi.
    pause
    exit /b 1
  )
  set "VENV=.venv"
)

rem Paket hanya dipasang sekali (butuh internet saat itu). Setelah itu aplikasi berjalan luring.
if not exist "%VENV%\pulmotriage-terpasang.txt" (
  echo  Memasang paket. Butuh internet, hanya sekali...
  "%VENV%\Scripts\python.exe" -m pip install -q -r requirements.txt
  if errorlevel 1 (
    echo  Gagal memasang paket. Periksa koneksi internet lalu jalankan lagi.
    pause
    exit /b 1
  )
  echo terpasang> "%VENV%\pulmotriage-terpasang.txt"
)

rem Alamat server cloud Dinkes. Sinkron berjalan otomatis saat ada internet.
if not defined CLOUD_URL set "CLOUD_URL=https://pulmotriage-cloud.onrender.com"
if not defined SINKRON_DETIK set "SINKRON_DETIK=60"

echo  Aplikasi terbuka di http://localhost:8000
echo  Biarkan jendela ini tetap terbuka selama memakai PulmoTriage.
echo.
start "" cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:8000"
rem Hanya bisa dibuka dari komputer ini (127.0.0.1), bukan dari jaringan.
"%VENV%\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000
pause
