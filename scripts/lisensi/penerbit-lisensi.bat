@echo off
setlocal
title Penerbit Lisensi PulmoTriage
cd /d "%~dp0"

rem Cari Python yang punya tkinter + cryptography: venv backend dulu, lalu Python terpasang.
set "PY="
for %%P in ("..\..\backend\.venv\Scripts\python.exe" "..\..\backend\venv\Scripts\python.exe") do (
  if not defined PY if exist %%P (
    %%P -c "import tkinter, cryptography" >nul 2>&1 && set "PY=%%~P"
  )
)
if not defined PY (
  py -3.11 -c "import tkinter, cryptography" >nul 2>&1 && set "PY=py -3.11"
)
if not defined PY (
  python -c "import tkinter, cryptography" >nul 2>&1 && set "PY=python"
)
if not defined PY (
  echo.
  echo  Python dengan paket "cryptography" belum ditemukan.
  echo  Pasang dengan:  py -3.11 -m pip install cryptography
  echo.
  pause
  exit /b 1
)

%PY% penerbit_lisensi_gui.py
if errorlevel 1 pause
