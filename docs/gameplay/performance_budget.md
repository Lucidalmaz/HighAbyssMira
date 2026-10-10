# Performance-Budget für neue Inhalte (verbindlich, Stand 10.10.2026)

Gemessene Ausgangslage (Normalbetrieb, 1584 × 861, 8-GB-Grafikkarte): 30–33 FPS in der Ortsmitte (CPU-gebunden, ≈ 800 Zeichenaufrufe), Ladezeit 70–80 s, Grafikspeicher 6,2–6,4 GB,
JS-Heap 2,6 GB, 644 Shader-Programme, ≈ 3 100 Texturen, ≈ 4 700–7 700 Geometrien. **Jeder weitere Block muss `node app/tools/perf_gate.mjs` bestehen** (docs/gameplay/TESTEN.md).

## Regeln je Objekt

| Größe | Budget | Begründung |
|---|---|---|
| Dreiecke je Kleinrequisite (< 0,5 m) | ≤ 5 000 (Hero-Item ≤ 15 000) | das Spiel zeichnet bis 7 Mio. Dreiecke je Bild an der Kreuzung (inkl. Schattenpässe) |
| Dreiecke je Möbel/Großrequisit | ≤ 20 000 | |
| Dreiecke je Gebäude außen | ≤ 150 000 (die Kapelle „kaplicka“ mit 840 000 ist der schlimmste Fall und gehört vereinfacht) | |
| Materialien je Objekt | ≤ 3 (Props), ≤ 6 (Möbel/Fahrzeuge) | jedes eigene Material ist ein eigener Zeichenaufruf und ein Programm-Kandidat |
| Texturen je Material | ≤ 3 (Farbe, Normal, ORM) | |
| Texturgröße | Kleinrequisite ≤ 1024², Möbel ≤ 2048², nur Hero-Items/Figuren-Gesichter 2048²–4096² | Dichte: ab > 3 000 px/m sind die oberen Mip-Stufen nie sichtbar (siehe vram.js) |
| Texturformat | **KTX2/BC7 Pflicht** (`.ktx.glb` bzw. `.ktx2`); keine rohen PNG/JPG im Spiel, keine großen Canvas-Texturen (> 512²) | rohe 2048²-Bilder kosten 21 MB statt 5 MB, Canvas ist nicht streambar |
| Materialien | **Dedup**: gleiche Parameter = dasselbe Material-Objekt (Fassaden-Muster `ms*Mat`-Cache nutzen); gleicher `customProgramCacheKey` für gleiche Shader-Variante | Programmzahl und Wechselkosten |
| Wiederholte Objekte | **InstancedMesh** (ab 8 gleichen Teilen) statt Einzelmeshes; eine Geometrie, nie `geometry.clone()` je Instanz (Dedup in vram.js fängt das nur nachträglich) | Zeichenaufrufe, Heap |
| Figuren | Skelett ≤ 80 Knochen, Körper + Kopf ≤ 40 000 Dreiecke, Gesichtsteile in möglichst wenig Materialien (heute 20–30 Aufrufe je Figur) | je Figur ≈ 25 Aufrufe + 150 Knochen |
| Schattenwerfer | nur Teile > 0,3 m werfen Schatten; Kleinteile `castShadow = false` | Schattenpass geht durch die ganze Szene |
| Lichter | höchstens 1 Echtlicht je Raum (VLight-Pool der Basis nutzen), nie neue `PointLight` mit Schatten | 18 Lichter im Pool, jedes Programm lädt alle Lichtwerte |

## Regeln je Raum / je Kapitelzone

* Innenraum: **≤ 250 000 Dreiecke und ≤ 120 Zeichenaufrufe** im Raum selbst (Möbel + Dekor), ≤ 60 neue Texturen, ≤ 12 neue Materialien.
* Neue Zone/Raum darf die Programmzahl um höchstens 10 erhöhen (Gate: `programs` ± 8) und **keine** Shader-Neukompilierung nach dem Start erzeugen: Materialien/Figuren, die erst im Spiel
  entstehen, müssen vor dem ersten Zeigen im Verborgenen mit `renderer.compileAsync` übersetzt werden (Shader-Wache in leistung.js macht das für die Spielszene; Sonderszenen wie
  Aufheben-3D/Kino müssen es selbst tun: `inv3d_vorab`, `kino_preload`).
* Hochladen: Alles, was beim Laden entsteht, wird auf die Grafikkarte geladen (Schritt „Texturen hochladen“). Jede 100 MB Texturen = ≈ 1,5 s Ladezeit und 100 MB VRAM. Inhalte, die nur in
  späten Kapiteln gebraucht werden, nach dem Start nachladen (Muster `kino_preload`) und in Zeitscheiben (≤ 4 ms je Bild) aufbauen.
* Zeitscheiben: Jede Schleife über viele Objekte (Suche, Prüfung, Platzierung) läuft als Generator mit Zeitbudget ≤ 4 ms je Bild (Muster `vst_sucher`, `vram_dedupGen`); nie ein Scan über
  alle Interaktionen/Kollider je Zelle.

## Messen vor dem Commit

1. `bash C:\Users\GIGABYTE\_live.sh start normal` (einmal), danach `node app/tools/perf_gate.mjs` (≈ 7 min inkl. Neuladen).
2. Rot = nicht committen/releasen; Ursache suchen. Referenz nur nach bewusster Verbesserung neu schreiben (`--write-baseline`) und die Änderung im Commit begründen.
3. Neue Assets zusätzlich: `perf_gate.mjs` zeigt Dreiecke/Zeichenaufrufe je Messpunkt; für Räume einen eigenen Messpunkt in `PT` (perf_gate.mjs) eintragen, wenn der Block einen neuen Ort hat.
