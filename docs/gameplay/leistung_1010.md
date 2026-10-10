# Leistung und Ladezeit 10.10.2026 (Folgeauftrag 2, Block „Ladezeiten und Flüssigkeit“)

Messung: Dauerinstanz `normal1`, 1584 × 861, Grafik „Hoch“, Normalmodus, RTX-Klasse mit 8 GB. Werkzeug: `app/tools/perf_gate.mjs` (siehe unten), Rohdaten `app/tools/perf_last.json`.
Alle Zahlen sind Läufe auf demselben Rechner; die Streuung zwischen Läufen steht dabei, wo sie bekannt ist.

## 1. Ergebnistabelle vorher / nachher

| Messgröße | vorher (Stand b96f3b0 + Checkpoint) | nachher | Bemerkung |
|---|---|---|---|
| Ladezeit bis „Fertig“ (Start der App, warm) | 90–97 s | **69–78 s** | CPU-Profil: 105 s → 87,7 s (mit Profiler) |
| Modulphase (Kirchberg … Kollision) | 62,2 s | **50–52 s** | Hauptursache: Decal-Prüfung (siehe 2.1) |
| Grafik vorbereiten + Hochladen | 20–26 s | 21–23 s | GPU-/Treiber-gebunden, unverändert |
| Neuladen der Seite (`reload`) | 92–258 s | 78–125 s | schwankt mit dem GPU-Shader-Cache; kalt (Cache leer / nach Shader-Änderung) bis 250 s |
| Erste 60 s nach „Neues Spiel“: längster Stand | **988 ms** (Lauf 1), 3 709 ms für den `beginGame`-Aufruf selbst | **200–236 ms** | Aufheben-Szene vorgewärmt, Verstecke-Suche zeitscheibenweise |
| Erste 60 s: Bilder > 100 ms | 18 | 10–20 | streut mit dem Intro (Aufwachen/Traum) |
| Erste 60 s: p95 | 60,6 ms | 54,6–60,7 ms | Straße ~30 FPS ist der CPU-Boden (siehe F3_stand_leistung.md) |
| Stand 15–18 s nach Spielstart (Verstecke-Suche) | 3 × 230–285 ms Standbild | **entfallen** | |
| Kreuzung steady p95 / FPS | 36,4 ms / 32,5 | 36,4 ms / 32,5 | unverändert (CPU-gebunden, Zeichenaufrufe ≈ 800) |
| Straße steady p95 | 42,3 ms | 36,5–42,4 ms | |
| Nr. 7 innen steady p95 | 66,6 ms (Ausreißer 230 ms) | 42–55 ms | |
| Wald / Villa / Amt steady p95 | 30,3 / 18,3 / 24,3 ms | 18,3 / 18,2 / 24,3 ms | |
| Ankunft schlechtestes Bild Kreuzung / Straße / Nr. 7 / Wald / Villa / Amt | 115 / 133 / 418 / 115 / 49 / 194 ms | 109–200 / 479–558 / 333–454 / 109–122 / 18–43 / 182–188 ms | **Straße schlechter**, siehe 3 (Shader-Erstübersetzung von Figuren) |
| Grafikspeicher (GPU-Prozess dediziert) | **7 118 MB** | **6 214–6 398 MB** (−11 %) | Texturdiät, siehe 4 |
| JS-Heap | 2 838 MB | 2 574–2 639 MB | |
| Shader-Programme | 641 | 644–645 | |
| Shader-Neukompilierungen nach Spielstart | 22 (Lauf ohne Spielstart-Phase) | 38–44 | Ziel 0 **nicht erreicht**, siehe 3 |

## 2. Behobene Ursachen (nach Hebelwirkung)

1. **Decal-Prüfung im Ladevorgang (`schweben.js`, `schweben_decals(null)` nach 25 s): 22 s CPU im Ladeprofil.** Jedes Decal prüfte per Strahl alle ~4 000 Kandidatenformen (`intersectObject`), und das lief
   in 6-ms-Scheiben mitten in der Modulphase. Jetzt: Kugel-Vorprüfung je Kandidat (nur Formen in Strahlreichweite) und Start erst 3 s nach `__ready`. Ladeprofil 105 s → 87,7 s.
2. **Aufheben-Szene (inventar3d.js)**: Beim ersten Aufheben (Batterie bei „Neues Spiel“) entstanden Umgebungsbild (PMREM ≈ 130 ms), Zielpuffer und 12 Programme synchron im Bild
   (0,5–0,9 s Standbild); nach 8 s Leerlauf wurde alles wieder verworfen und beim nächsten Aufheben neu gebaut. Jetzt: beim Laden vorgewärmt (`inv3d_warm`), Szene bleibt stehen,
   Programme des gezeigten Modells werden vorab parallel übersetzt (`compileAsync`, `inv3d_vorab`). Gemessen: Aufheben Batterie 36 ms, Sicherung 73 ms, Brecheisen 61 ms, Sender 503 ms (Modell-Parsen, offen).
3. **Verstecke-Suche (verstecke.js)**: nach 15 s lief die Zellensuche mit `getWorldPosition` je Zelle × alle Klickstellen, Zeitscheibe nur alle 120 Zellen = 240–285-ms-Standbilder. Jetzt Positionen
   einmal je Suche, Scheibe alle 6 Zellen.
4. **Kino-Übergänge (kino.js)**: Blende vorher 0,7 s + 750 ms Warten, danach *schwarz* auf das Laden des Figurensatzes (k3/k5/k6) warten. Jetzt: Blende 0,45 s, der Figurensatz lädt **parallel**
   zur Blende (`kino_preload` vorher angestoßen, danach `await`); Endkarten: Blende 0,45 s, Nachlauf 500/200 ms statt 900/250 ms.
5. **Texte** (siehe 5).
6. **VRAM-Diät und Geometrie-Dedup** (`vram.js`, siehe 4).

## 3. Nicht erreicht / offen (ehrlich)

* **Shader-Neukompilierungen nach Spielstart = 0**: nicht erreicht. Nach dem Start entstehen 38–44 Programme: beim Spielstart 12 Figuren-Programme (fig_haut/fig_auge/fig_haar2/Hornhaut …,
  ≈ 700 ms blockierende Verbindung `getProgramParameter` bis zu 1,4 s im ersten Lauf), später je Figurenart 6–12. Die Shader-Wache (leistung.js) übersetzt asynchron, aber der Treiber
  blockiert die Statusabfrage, solange er verbindet. Lösungsrichtung: je Figurenart ein versteckter Klon beim Laden (kostet ~12 s Ladezeit für ~20 Arten) oder die Programme der Figuren-Materialien
  über gleiche `customProgramCacheKey` zusammenlegen (figuren.js `fig_haut8`+Gesicht, `fig_auge`). Das Gate begrenzt die Zahl auf Referenz + 15.
* **60 FPS**: nicht erreicht; Kreuzung 32 FPS, Straße 28–33, Nr. 7 innen 33–38, Wald 62, Villa 71, Amt 55. Der JS-Hauptthread (Zeichenaufrufe ≈ 800, Matrizen, Auslese) ist der Boden.
* **Grafikspeicher ≤ 3 GB**: nicht erreicht (6,2–6,4 GB), Messung und Weg in 4.
* **Ladezeit ≤ 60 s**: nicht erreicht (69–78 s warm). Rest: Texturen hochladen 9 s, Grafik vorbereiten 13 s (Treiber), 52 s Modul-JS (verteilt: keine Funktion > 2 s, Summe vieler Bauten).
* **Straße, Ankunft**: schlechtestes Bild 479–558 ms (sechs neue Programme); Lauf 1 vorher 133 ms. Die Reihenfolge der Messpunkte ist jetzt fest und startet mit frischem Spielzustand;
  die damaligen 133 ms stammen vermutlich aus einem Zustand, in dem die Figuren schon einmal gezeichnet worden waren (nicht belegt).
* Kino-Szenen einzeln (Ende/Anfang in ms) wurden über Code-Analyse und den Test `kino_black.json` nicht lückenlos gemessen: die Szenen k1h/k3kuh brauchen Spielzustand-Vorbedingungen
  (Item, Raum), der Harness blieb in k1h hängen. Strukturell sind die Wartezeiten jetzt ≤ 0,5 s vor dem ersten Bild (Blende) plus das, was `D.start` noch lädt.
* Dedup normaler (nicht instanzierter) Meshes: gleiche Geometrien (z. B. 7 × „Candle_large“, 22 MB) bleiben getrennt, weil Flammen/Stoff/Dampf ihre Puffer zur Laufzeit beschreiben,
  ohne die Nutzungsart zu setzen (siehe Kommentar in vram.js).

## 4. Grafikspeicher (VRAM): Messung und Maßnahmen

Messung: Windows-Zähler „GPU Process Memory (dedicated)“ des Electron-GPU-Prozesses (nvidia-smi zeigt unter WDDM nichts je Prozess). Grundlast des Systems ohne Spiel ≈ 470 MB.

| Zustand | MB |
|---|---|
| Spiel geladen, Menü, vor der Diät | 6 818–7 118 |
| mit Texturdiät (460 KTX-Quellen, 1 085 MB Mip-Daten entfernt) | **6 033** (Menü) / 6 214–6 398 (im Spiel) |
| Sparmodus `?vram=lean` (Grenze 700 px/m statt 1 500) | 5 661 |

Peak je Messpunkt (Normalmodus, nach Spielstart und Textur-Hochladen; GPU-Prozess dediziert):
Kreuzung 6 214 · Straße 6 282–6 291 · Nr. 7 innen 6 359–6 362 · Wald 6 461 · Villa 6 370–6 374 · Amt 6 389–6 398 MB. Der Anstieg ist das Nachladen am Ort (Bewohnt-Deko, Figuren).
Kapitel 4–6 wurden nicht einzeln gespielt (Teleport in die Bereiche ohne Kapitelzustand).

Zusammensetzung (Kreuzung, vor der Diät): KTX-Texturen 2 134 Stück ≈ 5,2 GB geschätzt (393 × 2048² tiling = 2,1 GB, 221 × 2048² mit Dichte > 6 000 px/m = 1,2 GB, 1024²-Texturen 1,5 GB),
Canvas 813 Stück ≈ 0,5 GB, ImageBitmap/IMG 0,4 GB, Geometrien ≈ 1,9 GB (davon sichtbar 0,75 GB, verborgen 1,12 GB, Figuren 0,22 GB), Zielpuffer/Schattenkarten ≈ 0,3 GB.
Die Texturen von Figuren (Skelett) sind 1,5 GB (786 Quellen), von verborgenen Figuren/Räumen allein 1,1 GB.

Maßnahmen:

1. **Texturdiät** (`app/mods/vram.js`, abschaltbar `?novram`): je KTX-Quelle die kleinste Texeldichte über alle Besitzer-Formen (Breite × UV-Spannweite × Wiederholung / größte Weltausdehnung,
   Instanzen mit größter Skalierung) bestimmen und die oberste(n) Mip-Stufe(n) entfernen, solange danach noch ≥ 1 500 px/m bleiben (Figuren 3 000), höchstens 2 Stufen, mindestens 256 px.
   Wirkung: −0,8 bis −1,1 GB. Sichtprüfung gegen `?novram`: Kreuzung, Straße, Nr. 7 Küche (Tisch/Geschirr), Wand: kein sichtbarer Unterschied (Bilder `_pg/ab_on`, `_pg/ab_off`).
2. **Geometrie-Dedup** nur für InstancedMesh (Prototypen gleichen Inhalts teilen sich eine Geometrie, inkrementell in Zeitscheiben nach dem Laden, beim Spielstart und alle 40 s): gespart wird
   vor allem JS-Heap/ArrayBuffer (≈ 0,8 GB Daten umgeordnet; Grafikspeicher nur, soweit schon gezeichnet).
3. Nicht umgesetzt, aber **gemessen** (Experiment: `texture.dispose()`/`geometry.dispose()` aller verborgenen Wurzeln): Grafikspeicher 6 830 → 4 386 MB (−2,4 GB), davon Geometrie allein −0,7 GB.
   Verborgene Wurzeln sind 2 874 Gruppen (Innenräume io_*, Regionen ow_*, Figuren-Klone lwo_*, k5_*). Umsetzung wäre ein Residenz-Manager (Abstand/Sichtbarkeit → freigeben/vorab laden,
   Texturen über `ktxRestore`); Risiko: schwarze Texturen/Ruckler beim Einblenden. Nicht ohne eigenen Testlauf. Mit Manager + Diät wären ≈ 3,8 GB erreichbar, mit Figuren-Texturen
   nach Abstand ≈ 3 GB.
4. Der Stimmen-Parallelbetrieb ist damit **nicht** möglich (Spiel 6,2–6,4 GB + Stimmen 4–5,4 GB > 8 GB); `?vram=lean` (5,7 GB) reicht ebenfalls nicht.

## 5. Text-Inventar (Textarten, Verhalten vorher / nachher)

| Textart | Quelle | vorher | nachher |
|---|---|---|---|
| Untertitel aus `say()` (Dialoge, Funk, Stimme) | stimmen.js `say_weiter`, textweiter.js | Klick (Maus gefangen) / Enter = nächste Zeile, X = Block | unverändert (zwei Handler greifen ineinander, kein Doppelsprung) |
| Einzelne Untertitel (`subtitle()`) und Gedanken (kursiv, `gedanke()`) | Basis, gedanken.js | Enter/X (textweiter), Klick nur bei freier Maus | Enter/X, **Klick auch bei gefangener Maus** |
| Toasts (Hinweise unten) | `toast()` | nur Ablauf (3,6 s+) | **Enter/Klick blendet aus, X zusammen mit Folge** |
| Aufgaben-/Fibel-Pop-ups (`questPop`) | Basis | nur Ablauf (4,5 s+) | **Enter/Klick/X blendet aus** |
| Kino-Karten (Endkarten, Titel) | `kino_karte` | Space/Enter/Esc/Klick erst nach 3 s | **zusätzlich X, ab 0,8 s**; Blende 0,45 s |
| Kino-Szenen (Zeilen im Shot) | kino.js | Space/Enter/Esc/Klick nach `skipAfter` (3 s) | **zusätzlich X**; 7 nahtlose Szenen (`skipAfter: Infinity`: Hilde im Strahl, Gesicht im Glas, Bruder, Blinde Kuh, Blinzeln, Kum Wîse) bleiben bewusst unüberspringbar (je < 30 s, Spieler behält Kamera) |
| Notizen, Briefe, Akten (Overlay `note`) | `openNote` | E oder Esc | **zusätzlich Enter, Leertaste, X** |
| Journal/Fibel, Rätsel, Keypad | Overlay | Tab/J/Esc, Keypad OK = Enter | unverändert (Enter ist dort Bedienung) |
| Dialogmenüs (Auswahl) | `showChoice` | Auswahl verpflichtend | unverändert (Auswahl, kein Text zum Überspringen) |
| Endkarten (Kap. 3/5/6 `endcard`) | anwesen.js, kapitel5.js, kapitel6.js | Klick auf Weiter | unverändert |

Beweglichkeit während Texten: `freeTalk` der Basis (Spieler bewegt sich, wenn `state.talking && !scripted && !camOverride && !mantle && !ending && !zone && !blackout`). Echte Kamerafahrten,
`setScripted`-Szenen (Lena-Begegnung, Leiter, Fahrten) und Kino halten den Spieler fest; das ist bewusst. Nicht alle Gespräche im Code laufen als `say()` im freien Zustand – Kap. 3
(Hilde/Justin/Raum 1–3 in der Basis) setzt `state.talking = true` mit `scripted`; dort ist die Bewegung gesperrt (offen: Einzelfallprüfung je Szene).

## 6. Das Gate

`node app/tools/perf_gate.mjs` (Dauerinstanz `normal`, lädt neu, misst, vergleicht gegen `app/tools/perf_baseline.json`, Exit 1 bei Überschreitung). Doku in `docs/gameplay/TESTEN.md`,
Budget-Regeln in `docs/gameplay/performance_budget.md`. Referenz = Lauf vom 10.10.2026 (Ladezeit 80 s, Kreuzung p95 36,4 ms, 6,4 GB).
