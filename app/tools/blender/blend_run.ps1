# Startet Blender im Hintergrund mit niedriger Priorität und 2 Threads (Rechner misst parallel die Spielleistung).
# Bricht ab, wenn weniger als 3 GB Arbeitsspeicher frei sind, und beendet Blender nach höchstens 5 Minuten.
#   powershell -File blend_run.ps1 <skript.py> "<argumente nach -->" <logdatei> [minGB]
param([string]$Py, [string]$ArgStr, [string]$Log, [double]$MinGB = 3)
# wartet bis zu 8 Minuten auf genug freien Speicher (parallele Spielmessungen geben ihn zeitweise frei)
$t0 = Get-Date
do { $free = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1MB; if ($free -ge $MinGB) { break }; Start-Sleep -Seconds 10 } while (((Get-Date) - $t0).TotalSeconds -lt 480)
if ($free -lt $MinGB) { "ZU WENIG RAM: {0:N1} GB frei" -f $free; exit 2 }
$exe = "$env:LOCALAPPDATA\Microsoft\WindowsApps\blender-launcher.exe"  # Store-Version (signiert); nur ueber den App-Alias startbar
$p = Start-Process -FilePath $exe -ArgumentList "--background --factory-startup --threads 2 --python `"$Py`" -- $ArgStr" -RedirectStandardOutput $Log -RedirectStandardError "$Log.err" -PassThru -WindowStyle Hidden
try { $p.PriorityClass = 'BelowNormal' } catch {}
if (-not $p.WaitForExit(300000)) { try { $p.Kill() } catch {}; "ABBRUCH nach 5 min"; exit 3 }
"Ende, Code {0}, {1:N1} GB frei beim Start" -f $p.ExitCode, $free
