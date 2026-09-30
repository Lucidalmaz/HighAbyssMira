# Arbeitsregeln für alle Helfer (Produktionsphase nach dem Audit vom 29.09.2026)

Qualitätsmaßstab: Master-Prompt des Nutzers (Premium-Horror/Mystery, Realismus statt Effekte, jedes Licht mit Quelle, jedes Geräusch mit Grund, Subtilität, Stille als Werkzeug, getestet = fertig). Spielsprache Deutsch.

Technik
- Nie game/index.html direkt bearbeiten. Quellen: app/mods/_base_source_index.html (Basis) und app/mods/*.js (Module). Danach: cd /c/Users/GIGABYTE/HighAbyssMira-Repo/app && node tools/assemble.js && node build.js
- Neue Module in ORDER in app/tools/assemble.js; genau ein WORLD_MODS.push und ein WORLD_TICK.push je Modul; Spielstand über MOD_SAVE.push([name, holen, setzen]).
- Nie einen //-Kommentar mitten in eine lange Zeile vor weiteren Code setzen (verschluckt den Rest der Zeile).
- Andere arbeiten parallel: NUR das Edit-Werkzeug mit exakten Ersetzungen (Stelle vorher frisch lesen); ganze Dateien nur bei NEUEN Dateien schreiben. Nur die eigenen Dateien/Bereiche anfassen (siehe Auftrag). Nicht committen.
- Keine Lichter zur Laufzeit hinzufügen/entfernen oder .visible von Objekten mit Lichtern umschalten (Shader-Neukompilierung = Ruckler); Lichter beim Laden mit Intensität 0 anlegen.
- ≥ 60 FPS in jedem Moment ist Pflicht; keine Allokationen in Tick-Schleifen.
- Keine selbstgebauten sichtbaren Primitiv-Objekte (Boxen als Möbel usw.), nur echte Assets aus game/assets (Decals/VFX/Partikel sind erlaubt).

Test
- Schritte: JS-Dateien (async IIFE, gibt String zurück) → python /c/Users/GIGABYTE/_steps.py <out.json> name=datei.js … → bash /c/Users/GIGABYTE/_game_run.sh <steps.json> <ausgabeordner> (Ausgabeordner mit eigenem Präfix!). Ergebnisse: <ordner>/steps.json, result.json (Konsole), <schritt>.png. Kontaktbögen: python /c/Users/GIGABYTE/_sheet.py out.png a.png b.png …
- Das Testprofil ist getrennt vom echten Spielstand (--udd). Spielstart-Schritt: siehe /c/Users/GIGABYTE/_wl2.js (erste 3 Zeilen).
- Audit-Berichte: app/story/audit/ (story_bible.md) sowie die Zusammenfassung im Auftrag.
