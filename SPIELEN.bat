@echo off
rem Startet den aktuellen Spielstand direkt aus dem Repo (ohne Release-Paket, ohne Desktop-Kopie).
rem Erster Start nach Aenderungen: baut zuerst (Zusammenbau + KTX-Texturen), dann Spiel.
cd /d "%~dp0app"
call npm run build
if errorlevel 1 (echo BAUFEHLER & pause & exit /b 1)
start "" "node_modules\electron\dist\electron.exe" .
