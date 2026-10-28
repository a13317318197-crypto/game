@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-site.ps1"
if errorlevel 1 (
  echo.
  echo 网站未能启动，请查看上方错误信息。
  pause
)
endlocal
