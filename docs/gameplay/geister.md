# Geister – gemeinsamer Look (Modul `geister`, Stand 08.10.2026)

Alle Geister im Spiel laufen über **app/mods/geister.js**: Echos (`ECHO_CAST`), Nachbilder an Orten (`figuren_person`: cleo, visionen, zayn; kapitel3 Nachbild 2009, lucy3, kapitel5 Mama/Laterne), weiss.js (`weiss_ghostify`), die Mannequin-Geister der Basis (`FAB.figs`).
`figuren_ghostMat` / `figuren_geistBau` / `figuren_memoryLook` (figuren.js) rufen nur noch `geister_mat` / `geister_bau` / `geister_look` auf. Reihenfolge in tools/assemble.js: `auftritt, geister, leistung`.
kino.js hat keine Geister-Figuren (nur eigene Graufilter für Rückblenden) – dort war nichts umzustellen.

## Aufbau je Figur
| Teil | Was | Kosten |
|---|---|---|
| Geister-Hülle | MeshStandard + `onBeforeCompile`, Programmschlüssel **`geist5`** (ein Programm je three.js-Variante: Karte/Alphatest/Seite/Morph), vormultiplizierte Mischung (`One, OneMinusSrcAlpha`) | wie bisher (gleiche Hüllen) |
| Tiefen-Zwilling | MeshBasic, nur Tiefe, Schlüssel **`geistZ5`**, gleiches Wabern/Auflösen | wie bisher |
| Nachbild | Kopie der 3 größten Skin-Hüllen, Knochen 0,12 s zurück (Ringpuffer, 16 Bilder); nur < 14 m, höchstens 6 Figuren, nicht bei eingefrorenen | ≤ 18 Zeichenaufrufe |
| Effekte | EIN instanzierter Zeichenaufruf für alle: je Figur (8 nächste) Kontaktschatten, 5 Bodennebel, 36 Glimmer | 1 Aufruf, 336 Quads |
| Lichtkegel | ein offener Kegel über dem Echo (nur während Echos) | 1 Aufruf |

Material-Klone je Figur teilen das Programm (nur die Uniforms `uF`, `uK`, `uE` sind je Figur). Keine neuen Lichter.

## Look-Parameter (`GEIST.G`, `GEIST.L`, Shader-Konstanten)
| Parameter | Wert | Wirkung |
|---|---|---|
| `uCA` | (0,20 · 0,38 · 0,86) | Randfarbe unten/außen (kalt, tief) |
| `uCB` | (0,80 · 0,89 · 1,00) | Randfarbe oben/streifend (blass) |
| `uCC` | (0,48 · 0,56 · 0,72) | Körper-Grundton (mit Albedo moduliert) |
| Fresnel | `pow(1 − |N·V|, 2)` | Rand dicht, Körper durchscheinend: Deckung 0,06 (Mitte) … 0,30 (Rand) + 0,08 · Albedo (+0,1 im Gesicht) |
| Innenstruktur | Albedo-Helligkeit, `0,5 + (√L − 0,55) · 0,6` | entsättigt, kontrastarm – Falten/Kleidung bleiben lesbar |
| Szenenlicht | `× (1 + min(2,2 · L_licht, 1,4))` | Taschenlampe/Lampen hellen den Geist auf |
| Auflösung (Schlieren) | Rauschen `vWP · (5,5; 1,35; 5,5)`, steigt mit 0,55/s | an Rand (0,5), Händen/Füßen (Abstand zur Körperachse, 0,45), Scheitel (0,6), Füßen/Boden (0,75); nie ganze Glieder (max. 93 %) |
| Auftritt/Abgang | Front `p · 1,6 − 0,3` (Höhe 0…1), Rausch-Rand ±0,15, Glutkante 0,07 | von unten nach oben; `p` folgt der Stärke mit max. 2/s (Flimmer-Einbrüche bewegen die Front kaum), Sichtbarwerden: 1,1 s |
| Helligkeit | `min(uGhost / 0,45, 1)`, über 1: `1 + (uGhost − 1) · 0,3` | Ausblenden zeigt erst die Auflösung, dann das Dunkelwerden |
| Wabern `uWav` | 0,011 m · Höhe/1,7 | Wellen 4,2/9,1 rad/m, unten (Saum) 100 %, oben 30 %; Schweben ±4 mm |
| Flimmern | 0,94…1,0 (1,7 rad/s), Einbruch auf 0,55–0,8 für 60–140 ms alle 2,5–7 s | |
| Nachbild | Verzögerung `GEIST.L.lag` 0,12 s, Stärke 30 %, beim Stocken/Schleifensprung 58 % | |
| Sättigungsausgleich | Chroma `/ uSat` | Geister behalten Farbe, die Umgebung wird blass |

## Kopf und Gesicht (09.10., Befund Bündel 2: abgeschnittene Köpfe, fehlende Gesichter)
- Kopfmaske je Figur (`uHd`: Kopfknochen + 7 cm, Radius 0,17 m · Größe/1,7, min. 0,75): im Kopf keine Rausch-Kante (Auf-/Abtritt blendet dort weich), keine Schlieren, Albedo-Kontrast 1,35 statt 0,75, Rand schwächer, Körperanteil stärker.
- Augäpfel bleiben sichtbar (nur Hornhaut/Tränenrand/Augenschatten, Zähne, Zunge, Mundraum, Wimpern sind aus); die Tiefen-Zwillinge verhindern das Durchscheinen.
- Ursache der abgeschnittenen Köpfe: beim flimmernden Ausblenden sprang der Modus zwischen Auftritt/Abgang – jetzt schaltet er nur bei 0 bzw. 1 um.
- Nachbild: strenger Tiefentest (deckungsgleiche Flächen nicht doppelt), dunkelt nie ab (nur Licht).
- Hintergrund-Abdunklung: Deckung jetzt 0,06 (Mitte) … 0,30 (Rand), max. 0,6.

## Animation
- Zeitlupe je Figur 0,72–0,85 (Mischer-Tempo), **beim Gehen Tempo 1** (Schrittlänge = Weg, kein Gleiten).
- Stocken 80–150 ms alle 4–9 s (nur im Stand), Schleifensprung (Clip-Zeit springt zurück) wird mit Flimmern + Nachbild verdeckt.
- Echo-Regie `GEIST_REGIE` (geister.js): Ruhe-Clip je Figur (Sitz-Clips nur, wenn die Figur sitzend platziert ist – sonst `idle2`), Sprecher (Untertitel-Name) → `talk`/`erklaeren`/`sit_talk` für die Zeilendauer, die anderen sehen zum Sprecher (Kopf-/Blickfeder aus figuren.js), `blick`: Figur, zu der alle sehen (Kinder → Vegas), `cam`: Figur sieht zu Luke („zu dir“). „???“-Zeilen flüstern direkt am Ohr.
- Atmung, Blick, Fuß-IK: unverändert aus figuren.js.

## Echo-Start/-Ende
| Effekt | Wert |
|---|---|
| Entsättigung (`filmPass` → `gSat`) | 1 → 0,6 (1,2 s ein, 1,6 s aus) – ersetzt den CSS-Filter von `figuren_memoryLook` |
| Bleichung/Korn (`gBl`) | 0 → 0,14 (Silberrest-Mischung, Korn × 1,2) |
| Vignette | +0,22 auf den aktuellen Wert |
| Farbsaum | Puls +0,010 (Start), +0,005 (Ende), klingt mit e^(−2,2 t) ab; Dauer +0,0015 |
| Lampen | vorhandene virtuelle Lichter (`vlights`) < 14 m: im Echo +22 % heller (Szene bleibt lesbar), leises Flackern 2–5 %, weiche Aussetzer auf 70–85 % (flickDip) – am Anfang gehäuft; am Ende auf den Wert, den die Lampe selbst hat |
| Lichtkegel | Stärke 0,035 (Staubschicht, kein Licht) |
| Ton | Herzschlag `pz_herz_*` (0,5, Tiefpass 420 Hz), Druck `fx_tief_2` (0,18, Rate 0,78), Flüsterschicht `fx_fluester_*` alle 2,4–4,8 s an einer der Figuren (räumlich → Hall über raumklang), Ende: Ausatmen `pz_atem_*` |

## Leistung
Ziel ≤ 1,5 ms Zusatz bei 6 Geistern im Bild. Takt `__geister.S.ms` (CPU), Prüfschritt `g_gang_fps6` / `g_kreuz_fps` misst mit/ohne.

## Test
Steps-Datei `C:\Users\GIGABYTE\_visual\geister.json` (ohne s0, für die Dauerinstanz `_live.sh start normal` → `_live.sh run _visual/geister.json`).
Testzugriff `window.__geister`: `stat()`, `echo(id)` (Nachbild erneut abspielen), `halt(0…0,32)` (Echo-Stärke festhalten), `look(on)`, `S` (alle Parameter, live änderbar: `S.G.uWav.value`, `S.L.lag` …).
