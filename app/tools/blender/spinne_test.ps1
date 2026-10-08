# Baut eine Spinnenart (hd) und rendert Vorschauen (3/4, nah). Aufruf: powershell -File spinne_test.ps1 <art> [res] [ansichten] [clip] [bilder]
param([string]$Art, [string]$Res = 'hd', [string]$Views = '34,nah', [string]$Clip = 'walk', [string]$Frames = '5')
$d = "C:\Users\GIGABYTE\HAM_Blender\spinnen"; $t = "C:\Users\GIGABYTE\HighAbyssMira-Repo\app\tools\blender"
& powershell -ExecutionPolicy Bypass -File "$t\blend_run.ps1" "$t\spinnen_bau.py" "$Art $Res $d" "$d\$($Art)_$Res.log" 2.5
Get-Content "$d\$($Art)_$Res.log" | Select-String -Pattern "Bau |FERTIG|Error|rror|Traceback|line \d" | ForEach-Object { $_.Line.Substring(0, [Math]::Min(300, $_.Line.Length)) }
if (Test-Path "$d\$($Art)_$Res.log.err") { Get-Content "$d\$($Art)_$Res.log.err" -Tail 6 }
& powershell -ExecutionPolicy Bypass -File "$t\blend_run.ps1" "$t\vorschau.py" "$d\$($Art)_$Res.glb $d\v_$($Art)_$Res.png $Clip $Frames $Views" "$d\v_$Art.log" 2.5
Get-Content "$d\v_$Art.log" | Select-String "VORSCHAU|Error|rror" | Select-Object -First 8 | ForEach-Object { $_.Line }
