@echo off
rem High Abyss Mira: sucht Requisiten (Taschenlampen, Batterie, Werkzeug, Steine, Wrack, Totems) in deiner Unreal-Bibliothek
rem und exportiert sie nach game\assets\ue\. Einfach doppelklicken. Dauert je nach Bibliothek 2-10 Minuten.
setlocal
set "HAM_REPO=%~dp0.."
rem --- Unreal-Projekt finden: HAM_UPROJECT setzen oder automatisch suchen
if not defined HAM_UPROJECT for /r "%USERPROFILE%\Documents\Unreal Projects" %%F in (HighAbyssMira.uproject) do if exist "%%F" set "HAM_UPROJECT=%%F"
if not defined HAM_UPROJECT for %%F in ("%~dp0*.uproject") do set "HAM_UPROJECT=%%F"
if not defined HAM_UPROJECT ( echo Unreal-Projekt HighAbyssMira.uproject nicht gefunden. Pfad eintragen: set HAM_UPROJECT=C:\...\HighAbyssMira.uproject & pause & exit /b 1 )
rem --- Unreal Editor finden (neueste 5.x-Version)
if not defined HAM_UE for /d %%D in ("C:\Program Files\Epic Games\UE_5.*") do if exist "%%D\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" set "HAM_UE=%%D\Engine\Binaries\Win64\UnrealEditor-Cmd.exe"
if not defined HAM_UE ( echo UnrealEditor-Cmd.exe nicht gefunden. Pfad eintragen: set HAM_UE=C:\...\UnrealEditor-Cmd.exe & pause & exit /b 1 )
echo Projekt: %HAM_UPROJECT%
echo Editor:  %HAM_UE%
"%HAM_UE%" "%HAM_UPROJECT%" -ExecutePythonScript="%~dp0Scripts\export_props.py" -unattended -nosplash
echo.
type "%~dp0Scripts\export_props_log.txt"
echo.
echo Fertig. Neue Modelle liegen in game\assets\ue\  - danach im Ordner app: npm run build
pause
