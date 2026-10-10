# Grafikspeicher (dediziert) des größten Electron-Prozesses in MB – Windows-Zähler „GPU Process Memory“
$ids = @(Get-Process electron -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
$m = 0
(Get-Counter '\GPU Process Memory(*)\Dedicated Usage' -ErrorAction SilentlyContinue).CounterSamples | ForEach-Object {
  if ($_.InstanceName -match '^pid_(\d+)_' -and ($ids -contains [int]$Matches[1])) { $v = [math]::Round($_.CookedValue / 1MB); if ($v -gt $m) { $m = $v } }
}
$m
