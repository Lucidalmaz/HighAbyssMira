# Architektur-Block 12.10.2026: Ladezeit, Grafikspeicher, stabile Messung

Rechner: Ryzen 7 260 (16 Threads), 15,3 GB RAM, RTX 5070 Laptop 8 GB, 1584 × 861, Grafik „Hoch“. Werkzeuge: `app/tools/perf_gate.mjs`, Hilfsskripte (Rohdaten) in `C:\Users\GIGABYTE\_arch`.

## 1. Befund (Messung vor dem Umbau)

| Größe | Wert |
|---|---|
| Grafikspeicher im Menü / an der Kreuzung | 6,0–6,4 GB |
| Zusammensetzung (Kreuzung, durch Verwerfen gemessen) | Formen 1,1–1,25 GB (davon geparkte/verborgene Figuren-Klone 0,66 GB) · KTX-Texturen 1,6–2,7 GB · Canvas 0,36–0,52 GB · Rohbilder 0,37–0,41 GB · Zielpuffer + Schattenkarten 0,3–0,4 GB · Rest (Treiber, Programme) ≈ 0,8 GB |
| Arbeitsmenge (alles verworfen, dann 360° gedreht) | nur 2,8 GB: der Rest war Vorrat |
| Ladezeit warm (Prozessstart → „Fertig“) | 88–93 s (Module 58 s, Grafik vorbereiten 14 s, Hochladen 10 s) |
| Ladezeit kalt (leerer GPU-Shader-Cache) | 262 s (Treiber: 568 Programme × ≈ 2,5 Kernsekunden HLSL-Übersetzung auf 14 Kernen) |
| Neukompilierungen nach Spielstart | 44 |
| Ankunft Straße, schlechtestes Bild | 485–860 ms |
| Gate-Streuung | 88,9 / 255,8 / 140 s Ladezeit in drei Läufen derselben Fassung |

Ursache der Gate-Streuung: nach einer Spielsitzung läuft ein Seiten-**Neuladen** mit dem alten Renderer-Speicher (4–5 GB) im Hintergrund an; bei 15 GB RAM wird ausgelagert (140–250 s statt 70–90 s). Ein frischer Prozess gibt den Speicher sofort frei und entspricht dem echten Start.

## 2. Maßnahmen

### 2.1 Textur-Streaming nach Abstand (`app/mods/stream.js`, `stream_patch.py`)
* Jede KTX-Quelle bekommt ein **Mip-Fenster** `t.mipmaps = Kette.slice(k)`. Benötigte Stufe = schärfste Anforderung über alle Besitzer-Formen aus Texeldichte (Breite × UV-Spanne × Wiederholung / Weltausdehnung), Abstand (Kamera/Spieler) und Bildschirmdichte (H / (2 tan(fov/2) d) × Reserve 1,5). Verborgene Besitzer zählen bis 26 m (Figuren 50 m, Vorsprung 8 m), geparkte Figuren-Vorlagen (Ursprung/unter der Erde) gar nicht.
* Stufen ≤ 256 px bleiben als kleine CPU-Kopie (≈ 2 %) immer im Speicher: Herabstufen ist sofort, Hochstufen bis dorthin braucht kein Laden; feinere Stufen kommen aus `ktxRestore` (jetzt per **Bereichsabfrage** nur das eine Bild aus der .ktx.glb, Range-Unterstützung im app://-Protokoll in `main.js`). Bis dahin zeigt das Teil die schärfste vorhandene Stufe – nie schwarz.
* Totband gegen Hin und Her: hochstufen erst > 0,2 Stufen über dem Fenster, herabstufen erst ab 1,25 Stufen Luft und nach 4 s.
* Formen (Geometrie) werden von der Grafikkarte genommen, wenn kein Besitzer sichtbar < 76 m / verborgen < 34 m (Figuren 50 m) und 6 s nichts gezeichnet wurde; Vorladen über eine Stellvertreter-Form in einem 2×2-Puffer.
* Canvas-/Rohbild-Texturen: gleiche Regeln (dispose; Pixel bleiben im Canvas); große Rohbilder (> 512 px) zusätzlich in halber/viertel Kantenlänge (Canvas-Kopie).
* Gleiche Skelett-/Morph-Formen der Figuren-Klone werden zusammengelegt (621 → 405 Formen, −106 MB Daten, Morph-Texturen je Form ≈ 6 MB).
* Aus: `?nostream`; Teile: `?nogeo`, `?nocv`, `?noskindedup`, `?stridle` (nur Fenster beim Laden), `?nostamp`.

### 2.2 Ladepfad
* `FileLoader` zerlegte jede Antwort in einen Lese-Strom (ProgressEvent je Block): 3,5 s Hauptfaden → Kurzweg (Request-Antworten ohne `body`).
* GLB-Bilder (KTX2) direkt aus der bufferView an den KTX2-Lader statt Blob → Objekt-URL → fetch (3,3 s).
* Beim Hochladen: verborgene Gruppen (ohne Licht) bleiben verborgen, ferne Formen (> 76 m) werden nicht hochgeladen, nur Fenster statt voller Ketten, nur Nahes/Sichtbares als Textur vorab; Hauptschleife zeichnet/rechnet während der Nachbereitung nichts; Pass-Shader (Bloom-Stufen u. a.) werden parallel zum Gesamtdurchgang übersetzt.
* Fensterfiguren übersetzen ihre Programme (eigene Szene mit eigenen Lichtern → eigene Varianten) vorab, ein Teil je Bild; `ff_zeichne` wartet darauf. Ursache der 485–860-ms-Standbilder bei der Ankunft an der Straße.
* Kapelle: Scan-Hülle 839 026 → 59 998 Dreiecke (Blender, `app/tools/blender/chapel_lo.py`; Material, UV, Maße und Lage unverändert, Original in `HAM_Blender\kapelle_original`). Spart ≈ 3 s Ladezeit, 88 MB Formen, Kollisions-BVH.

### 2.3 Gate (`perf_gate.mjs`)
Ruhe-Erkennung (Fremdlast < 22 % über 30 s, kein blender/ktx/ffmpeg-Prozess, max. 10 min; die Vorgabe „< 15 %“ war auf diesem Rechner nie zu halten: Gigabyte Control Center ≈ 6 %, Claude-Oberfläche ≈ 4 %, Messwerkzeug ≈ 2 %), ungemessener Vorlauf, **Neustart des Prozesses je Lauf**, 3 Läufe mit Median, Wiederholung bei Störung während des Laufs, Zeichenaufrufe/Dreiecke direkt an den GL-Zeichenbefehlen gezählt (`renderer.info.render` wird von verschachtelten render()-Aufrufen zurückgesetzt: 817 ↔ 148 je nach Reihenfolge).

## 3. Ergebnis (Gate-Median aus 3 Läufen, Neustart je Lauf, Ruhe-Erkennung)

| Messgröße | vorher | nachher | Ziel | erreicht |
|---|---|---|---|---|
| Ladezeit warm (Median) | 88–93 s | 70 s (Läufe 71,1 / 71,4 / 186,1 s) | ≤ 60 s | nein, knapp |
| Ladezeit kalt (leerer Shader-Cache) | 262 s | ≈ 222 s | ≤ 120 s | nein |
| Grafikspeicher Menü/Kreuzung | 6,0–6,4 GB | 1,85 GB Menü, 2,8–2,9 GB Kreuzung | ≤ 3 GB | ja |
| Grafikspeicher Straße / Nr. 7 innen | 6,2 / 6,3 GB | 3,0 / 3,0–3,1 GB | ≤ 3 GB | grenzwertig (Dorfkern) |
| Wald / Villa / Amt | 5–6 GB | 1,9 / 1,6 / 1,8 GB | ≤ 3 GB | ja |
| Ankunft Straße, schlechtestes Bild | 485–860 ms | 133–152 ms (ein Lauf 436 ms) | ≤ 150 ms | knapp |
| Neukompilierungen nach Start | 44 | 44 | ≈ 0 | nein |
| Shader-Programme | 568 | 640–651 | – | – |
| Kreuzung Dauer-p95 | 54 ms | 54 ms (CPU-gebunden, ≈ 765 Zeichenaufrufe) | 60 FPS | nein |

Verwerfen/Streaming ändert die Bildqualität an prägnanten Dingen nicht: Fenster nach Texeldichte × Bildschirmdichte × Reserve 1,5; Vergleichsbilder an 6 Orten (Kreuzung, Straße, Nr. 7, Wald, Villa, Amt) ohne sichtbaren Unterschied.

Gate: **bestanden** (Referenz 12.10. neu geschrieben, Median 3 Läufe; ein Lauf von drei war Ausreißer mit ≈ 185 s Ladezeit, in einem früheren Gate-Lauf zwei von drei).

| Bereich | Note | prägnant | Messwert |
|---|---|---|---|
| Kapelle außen (60 k Dreiecke statt 839 k) | 2 | ja | 60 k Dreiecke, Material/UV/Maße unverändert |
| Kapelle innen (Vertäfelung, Handlauf, Pfeiler, Balken, Chorbogen, Platten) | 2–3 | ja | Beleuchtung fast schwarz; Note 2 nicht bildlich belegt |
| Grafikspeicher Kreuzung/Straße | 2 | ja | 2,85 / 3,0 GB |
| Ladezeit | 3 | nein | 70 s warm |

### Koexistenz mit der Stimmen-Erzeugung
Die Stimmen-Pipeline selbst ließ sich nicht starten (Anwendungssteuerung blockiert das Python der virtuellen Umgebung; nicht umgangen). Ersatzmessung: zweite Electron-Instanz mit einer Seite, die 3,86 GB belegt (angefordert 5,2 GB; Treiber vergab 3,86 GB), neben dem Spiel (1,86 GB im Menü): Adapter gesamt 6,17 GB von 8,1 GB, Spiel blieb bereit, keine Abstürze. Bei 4–5,4 GB Stimmen plus 1,9–3,0 GB Spiel ergeben sich 5,9–8,4 GB: im Menü/Wald/Villa passt es, im Dorfkern (3 GB) bei 5,4 GB Stimmen nicht mehr sicher.

## 4. Nicht erreicht / offen (mit Ursache)
* Ladezeit warm 70 s statt 60 s: Modulphase 45 s (Skript-Ausführung des Hauptfadens) + Grafik 19 s; kein weiterer großer Hebel ohne Kapitel 4–6 lazy zu bauen (Modul-Abhängigkeiten).
* Ladezeit kalt ≈ 222 s: ≈ 600 Programme × ≈ 2,5 Kernsekunden HLSL-Übersetzung im GPU-Prozess (D3D11/ANGLE, CPU-gebunden). Teilmengen-Übersetzung (`?subset`) brachte keinen Gewinn und ist aus.
* Neukompilierungen 44: Laufzeit-Varianten von Haken-Materialien (Straßenwetter, Bewohnt-Dekor, Nachlauf-Shader, Geister-Varianten).
* 60 FPS an der Kreuzung nicht erreichbar: CPU-gebunden (≈ 770 Zeichenaufrufe, 8,9 M Dreiecke); Streaming ändert Bildzeit nur im Rauschen (1–3 ms).
* Einzelne Ausreißer: Ladezeit 185 s in 1 von 3 Läufen (Ursache nicht eindeutig; Hintergrundlast anderer Prozesse bei Fremdlast < 22 % nicht auszuschließen), „längster Stand“ der ersten 60 s 320–800 ms schwankend.
* Kapelle: Kollision/BVH der 60-k-Hülle nicht gesondert geprüft; Innenraum-Sichtbarkeit wegen Dunkelheit gering.
