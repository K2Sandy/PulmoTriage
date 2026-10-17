; Installer Windows PulmoTriage (aplikasi Puskesmas, luring).
; Dibangun oleh installer/build_installer.sh dengan NSIS (makensis).
; Dipasang per pengguna (tanpa hak admin) ke %LOCALAPPDATA%\Programs\PulmoTriage.

Unicode true
!include "MUI2.nsh"

!ifndef VERSI
  !define VERSI "1.0.0"
!endif
!ifndef SUMBER
  !define SUMBER "build\PulmoTriage"
!endif

Name "PulmoTriage"
OutFile "PulmoTriage-Setup-${VERSI}.exe"
InstallDir "$LOCALAPPDATA\Programs\PulmoTriage"
InstallDirRegKey HKCU "Software\PulmoTriage" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
BrandingText "PulmoTriage ${VERSI}"

VIProductVersion "${VERSI}.0"
VIAddVersionKey "ProductName" "PulmoTriage"
VIAddVersionKey "FileDescription" "Installer PulmoTriage - alat bantu triase TBC"
VIAddVersionKey "FileVersion" "${VERSI}"
VIAddVersionKey "ProductVersion" "${VERSI}"
VIAddVersionKey "LegalCopyright" "Tim Sleber"

!define MUI_ICON "${SUMBER}\pulmotriage.ico"
!define MUI_UNICON "${SUMBER}\pulmotriage.ico"
!define MUI_ABORTWARNING

!define MUI_WELCOMEPAGE_TITLE "Memasang PulmoTriage"
!define MUI_WELCOMEPAGE_TEXT "PulmoTriage adalah alat bantu triase TBC dari rontgen dada dan gejala. Aplikasi berjalan di komputer ini tanpa internet.$\r$\n$\r$\nSiapkan file lisensi Puskesmas (lisensi-xxxx-xxx.json) dari tim PulmoTriage. File itu diminta saat aplikasi pertama kali dibuka.$\r$\n$\r$\nHasil aplikasi adalah alat bantu triase, bukan diagnosis."
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_TITLE "PulmoTriage siap dipakai"
!define MUI_FINISHPAGE_TEXT "Buka PulmoTriage dari ikon di desktop. Saat pertama kali dibuka, pasang file lisensi Puskesmas."
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_FUNCTION BukaPulmoTriage
!define MUI_FINISHPAGE_RUN_TEXT "Buka PulmoTriage sekarang"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Indonesian"

Function BukaPulmoTriage
  SetOutPath "$INSTDIR\app"
  Exec '"$INSTDIR\python\python.exe" "$INSTDIR\app\launcher.py"'
FunctionEnd

Section "PulmoTriage" SecUtama
  SectionIn RO
  ; Versi lama dihapus dulu supaya tidak ada file usang. Data pengguna ada di folder lain, jadi aman.
  RMDir /r "$INSTDIR\app"
  RMDir /r "$INSTDIR\python"

  SetOutPath "$INSTDIR"
  File /r "${SUMBER}\*.*"

  ; Direktori kerja shortcut = folder app (tempat model dan konfigurasi)
  SetOutPath "$INSTDIR\app"
  CreateShortcut "$DESKTOP\PulmoTriage.lnk" "$INSTDIR\python\python.exe" '"$INSTDIR\app\launcher.py"' "$INSTDIR\pulmotriage.ico" 0
  CreateDirectory "$LOCALAPPDATA\PulmoTriage\data"
  CreateDirectory "$SMPROGRAMS\PulmoTriage"
  CreateShortcut "$SMPROGRAMS\PulmoTriage\PulmoTriage.lnk" "$INSTDIR\python\python.exe" '"$INSTDIR\app\launcher.py"' "$INSTDIR\pulmotriage.ico" 0
  CreateShortcut "$SMPROGRAMS\PulmoTriage\Folder data PulmoTriage.lnk" "$LOCALAPPDATA\PulmoTriage\data"
  CreateShortcut "$SMPROGRAMS\PulmoTriage\Hapus PulmoTriage.lnk" "$INSTDIR\uninstall.exe"

  WriteUninstaller "$INSTDIR\uninstall.exe"
  WriteRegStr HKCU "Software\PulmoTriage" "InstallDir" "$INSTDIR"
  !define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\PulmoTriage"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "PulmoTriage"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSI}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "Tim Sleber"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\pulmotriage.ico"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\PulmoTriage.lnk"
  RMDir /r "$SMPROGRAMS\PulmoTriage"
  RMDir /r "$INSTDIR\app"
  RMDir /r "$INSTDIR\python"
  Delete "$INSTDIR\pulmotriage.ico"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\PulmoTriage"
  DeleteRegKey HKCU "Software\PulmoTriage"
  MessageBox MB_OK "PulmoTriage sudah dihapus.$\r$\n$\r$\nData pemeriksaan dan lisensi TIDAK dihapus dan masih ada di:$\r$\n$LOCALAPPDATA\PulmoTriage\data"
SectionEnd
