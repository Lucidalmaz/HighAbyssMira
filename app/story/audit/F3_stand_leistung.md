# F3 – Stand Leistung (Schluss-Leistungsprüfung, 01.10.2026)

Neues Modul `app/mods/leistung.js`, ganz zuletzt in ORDER (`tools/assemble.js`). Es ändert keinen Inhalt und keine andere Datei. Es wirkt nur auf das, was die übrigen Module gebaut haben.

## Messung

- **Wie gemessen:** Echte App (`electron.exe app --selftest --window`), Fenster 1600 × 900 (Zeichenfläche 1584 × 861, Pixelverhältnis 1), Grafik „Hoch“. Exklusiv über `_testgate.exclusive`. Gemessen wurde die eigene Seite `game/index_perf.html`, damit parallele Builds nicht dazwischenfunken.
- **Werkzeuge:** `C:/Users/GIGABYTE/_perf/` (`run.sh`, `localize.js`, Schrittdateien, `prof.py`/`callers.py` für `.cpuprofile`).
- **Zwei Messarten:**
  - **„Ankunft“** wie `_int1_steps.json`: Teleport, 1,5 s warten, 4 s messen. Das enthält das einmalige Nachladen am Ort (Figuren, Bewohnt-Deko), die Zahlen schwanken deshalb von Lauf zu Lauf stark (Kreuzung 9–19 FPS, Nr. 7 innen 2–46 FPS).
  - **„Dauer“**: 5 s nach der Ankunft, 4 s messen.
- **A/B je Maßnahme:** Ein- und Ausschalten im Wechsel, 4–6 × 1 s, Mittelwert. Einzelmessungen streuen um ±10 %.
- **Störquelle beim ersten Lauf:** Die Stimmen-Pipeline (Python, `HAM_Stimmen`) belegte 5,7 GB der 8 GB VRAM. Später lief sie nicht mehr. Für eigene Messungen bitte ohne laufende Stimmen-Erzeugung messen.

## Befund (Ursachen)

1. **Das Spiel ist rein CPU-gebunden, und zwar im Haupt-Thread (JavaScript).**
   - Trace: Renderer-Hauptthread 98 % belegt, GPU-Prozess 43 %, GPU 20–30 %.
   - „Niedrig“ und „Hoch“ ergeben die gleiche Bildzeit (±1 ms). Die Grafik-Voreinstellungen können die FPS deshalb nicht heben.
2. **Kosten je Bild (Straße, Dauer):**

   | Posten | Anteil |
   |---|---|
   | Zeichenaufrufe (three.js setProgram/Uniforms/Bindungen) | ~33 % |
   | Matrix-Auffrischung | ~14 % |
   | Szenendurchlauf/Sichtprüfung | ~7–10 % |
   | Schatten der Taschenlampe | ~6 % |
   | Modul-Takte | ~5 % |
   | Auslese der Basis (vcull/dcull) | ~7 % |
   | Nativer WebGL-Aufrufaufwand | ~15 % |

3. **~650–1050 Zeichenaufrufe je Bild bei ~15–20 µs je Aufruf.**
   - Zusammenfassen hilft kaum: Von ~300 geeigneten festen Teilen je Bild haben ~200 ein eigenes Material (3 957 Materialien insgesamt, gemessen).
   - Leeres Bild (alle Szenenteile aus): 9–11 ms. Diesen Boden bilden Takte, Auslese und Nachbearbeitung.
4. **Laufzeit-Shaderübersetzung war der schlimmste Ruckler.**
   - Bewohnt-Deko Nr. 7 beim ersten Betreten: 3,8–8,2 s Standbild.
   - Zayn/Kinder beim ersten Auftritt: 4 × 0,3–0,55 s.
5. **Ladezeit.**
   - Bereit nach 101–108 s (warm), 220–246 s, wenn der Shader-Speicher nicht passt (erster Start nach jeder Shader-Änderung). Dabei kostet „Grafik vorbereiten“ ~115 s kalt bzw. ~20–25 s warm.
   - Ursache: 575 Programme, alle Standard-Shader tragen das prozedurale Rauschen aus `grafik.js` (D3D-Übersetzung).
   - Außerdem: das Modul Fassaden lädt 22 s, die Texturen 21–30 s.

## Kosten je System (ms je Bild, gemessen)

| System | vorher | nachher | Bemerkung |
|---|---|---|---|
| grafik (Material-Erweiterung, AO, Volumen) | CPU ≈ 0, GPU nicht begrenzend | unverändert | „Niedrig“ ohne det/ao/vol/Bloom/0,75 px = gleiche Bildzeit; kostet aber ~90 s kalte Ladezeit (Shadergröße) |
| hervorhebung | Takt 0,15–0,34 | unverändert | Kantenpass nur aktiv bei Hervorhebung |
| fassaden | Takt 0,03–0,45 | unverändert | |
| fassaden – Spiegel-Sonde | 18–38 je Würfelseite (6 Bilder alle ~18 m: Ruckler beim Gehen) | 8,6–17 | siehe Maßnahme 5 |
| bewuchs + gruen (Instanzen) | ~100 Aufrufe, 1,2–3 | unverändert | |
| umwelt | Takt < 0,05 | unverändert | Kosten auf der GPU |
| raumklang | 0,02–0,06 | unverändert | |
| zeichen, menue, qte, ziele, griff, stimmen, kreaturen, beobachter | je ≤ 0,07 | unverändert | |
| figuren | Takt 0,05–1,4; 8 nahe Kinder an der Kreuzung ≈ 200 Aufrufe + ~1 100 Knochen ≈ 6–8 | unverändert / Animation außer Sicht −2–3 % | |
| leben (Krähen, Ratten) | 0,6–2 + Animation | Animation außer Sicht seltener | |
| Laufzeit-Shader (bewohnt, Figuren) | 3,8–8,2 s / 0,3–0,55 s Standbild | Nr. 7: kein Standbild mehr (Deko erscheint wenige Bilder später); Figuren 0,07–0,25 s | siehe Maßnahme 1 |
| Taschenlampen-Rückstreuung (Strahl) | ~2,5 % der Bildzeit | ~0 | |
| Ferne Teile im Nebel | 250–400 Aufrufe ohne sichtbares Ergebnis | weg | +4 … +20 % FPS |

## Maßnahmen

Alles in `leistung.js`, ohne sichtbare Änderung.

1. **Shader nie im laufenden Bild übersetzen.**
   - Eine Hintergrund-Durchsicht (600 Knoten je Bild) findet neue Material-/Varianten-Paare (Skelett, Instanz, Morph, Tangenten, Material-Version), solange sie noch versteckt sind.
   - Diese Paare werden parallel übersetzt (`KHR_parallel_shader_compile`, für den Nachbearbeitungs-Puffer wie der Gesamtdurchgang der Basis, Portionen zu 12).
   - Taucht trotzdem etwas Unübersetztes auf, wird nur dieses Teil ausgelassen, bis sein Programm fertig ist.
2. **Animationen außerhalb des Blickfelds ~10× je Sekunde statt jedes Bild.** Die Zeit wird aufgeholt. Was die Blickfeld-Auslese für das Bild ausgeblendet hat, zählt als außer Sicht.
3. **Lichter mit Stärke 0 zeichnen kein Schattenbild** (z. B. die Taschenlampe, wenn sie aus ist).
4. **Nebel-Auslese.**
   - Feste Einzelteile der Kleinteil-Auslese (Basis 8) fallen für das Bild weg, wenn ihre Hülle hinter der 0,3-%-Sichtweite liegt. Die Sichtweite wird aus der Nebeldichte berechnet: 71 m bei 0,034. Bei dünnerem Nebel liegt sie weiter, ohne Nebel gibt es keine Auslese.
   - Sie greift nicht bei Blitzen und nicht in Bildern, in denen Mond- oder Laternenschatten entstehen.
   - Die Entscheidung wird in Portionen getroffen. Bei einem Kamerasprung wird sofort alles neu entschieden.
   - Ganze Gruppen sind bewusst ausgenommen: Deren Hüllen veralten, wenn Module später Teile hineinhängen.
5. **Spiegel-Sonde (fassaden.js) billiger.**
   - Für die 128-px-Würfelseiten entfallen Teile unter einem Sondenpixel, Teile hinter 50 m (Nebel < 6 %) und ferne Figuren.
   - Es gibt keine zweite Matrix-Auffrischung.
6. **Lichtwerte nur einmal je Programm und Zeichenaufruf hochladen.**
   - three.js lud bei jedem Programmwechsel alle Werte der 18 Lichter neu.
   - Das wird an den internen Uniform-Klassen von r170 erweitert. Texturen werden weiter jedes Mal gebunden.
7. **Rückstreu-Strahl der Taschenlampe:** Er prüft nur noch Verdecker in Reichweite. Das Ergebnis ist identisch.
8. **Skelett-Liste:**
   - Die Liste wird nebenbei durch die Durchsicht gepflegt, statt alle 5 s die ganze Szene zu durchlaufen.
   - Die Größe neuer Figuren kommt aus den Hüllen in Ruhelage. Vorher rechnete `Box3.setFromObject` jeden Eckpunkt durch die Knochen: 7 % der Ankunftszeit an der Kreuzung.

### Geprüft und verworfen (kein messbarer Gewinn oder Risiko)

- Opake Sortierung nach Programm
- Ruhende Matrix-Zweige nur jedes 2. Bild prüfen
- Skelett-Vergleich je Knochen
- Kleinteil-Schwelle 2–3 px
- Nebel-Sichtweite 51/60 m
- Figuren-Gesichtsteile ausblenden
- Gruppen-Nebelauslese (blendete einmal nahe Äste aus)
- Schatten der Taschenlampe jedes 2. Bild (~1 ms, sichtbarer Nachlauf)
- Statisches Zusammenfassen (zu viele Einzelmaterialien)

## Ergebnis (4 Schlussläufe; Spannen = Streuung zwischen den Läufen)

| Ort | Ankunft vorher (int1: Nutzer / eigener Lauf) | Ankunft nachher | Dauer vorher | Dauer nachher |
|---|---|---|---|---|
| Ortstafel | 19,7 (91 ms) / 21,3 (108) | 20–31 (67–190) | 39 | 35–41 (A/B Nebel-Auslese: +13 %) |
| Straße Ost | 16,0 (130) / 15,2 (154) | 20–30 (86–128) | 32–34 | 40–43 |
| Kreuzung | 17,5 (164) / 21,9 (93) | 9–17 (127–658) | 34 | 32–45 |
| Kreuzung Nord | 34,7 (283) / 40,8 (35) | 36–44 (33–280) | 52–56 | 55–67 |
| Nr. 7 innen | 42,4 (85) / 26,8 (102); erstes Betreten bis 8,2 s Standbild | 8–46; kein Standbild mehr (≤ 250 ms) | 50 | 45–54 |
| Lampe an | 35,4 (44) / 34,6 (52) | 35–39 (37–87) | ~35 | 42–48 |

- **Ankunft** hängt am einmaligen Nachladen. An der Kreuzung werden acht Kinderfiguren (je 20–50 MB) beim ersten Hinsehen geladen und eingerichtet; die Shader-Wache verteilt deren Übersetzung jetzt über mehrere Bilder statt Standbilder.
- **Ladezeit:** unverändert 101–108 s warm (eigene Messung vorher 104–107 s; die genannten 63 s stammen von vor der Qualitätswelle), kalt 220–246 s. Das Modul kostet beim Laden nichts messbar.
- **≥ 60 FPS** nur an der Kreuzung Nord.
- **Voreinstellungen:** Mehr ist damit nicht erreichbar. „Niedrig“ ist gleich schnell wie „Hoch“, weil die Last nicht auf der Grafikkarte liegt. Die Voreinstellungen wurden darum nicht verändert.

## Offen / Risiken

- **Shader-Wache:** Neu entstehende Dinge (Bewohnt-Deko, Figuren beim ersten Auftritt) erscheinen wenige Bilder später, statt das Spiel anzuhalten.
- **Figuren-Materialien:** Sie bekommen beim Auftritt wiederholt `needsUpdate` (Version bis v101 gemessen). Das ergibt Restruckler von 0,07–0,25 s je Figur. Ursache in figuren.js/stimmen.js, nicht angefasst.
- **Abhängigkeit von three.js r170:** Maßnahme 6 hängt an den internen Uniform-Klassen. Bei einem three.js-Update neu prüfen; Vergleich mit `window.__lstAus = true` vor dem Laden.
- **Release-Prüfung:** `node tools/assemble.js --release` scheitert derzeit an Testzugriffen in zeichen.js, feuer.js (`window.__feuer.peter`) und einem Kommentar in bewuchs.js. Das betrifft nicht leistung.js.
- **Größere Hebel für 60 FPS** (Architektur, nicht in diesem Auftrag):
  1. Materialien beim Bau zusammenlegen (gleiche Parameter → ein Material), danach statisch zusammenfassen.
  2. CC-Figuren: Gesichtsteile in einen Atlas/ein Netz (20–30 → ~5 Aufrufe je Figur), Körper-LOD.
  3. Weniger Lichter im Pool (18 → 10).
  4. Kleinere Standard-Shader (kalte Ladezeit).
- **JS-Speicher:** 6,3 GB.

## Nachtrag 09.10.2026 (Leistung/Ladezeit, Sonnet 5.5)

Messweise: Dauerinstanz, A/B-Schalter zur Laufzeit abwechselnd (3 × 9 s Einschwingen + 6 s Messung je Ort und Zustand), 1584 × 861, Normalmodus, Leistungs-Einblendung an (in beiden Zuständen gleich).

| Ort | vorher FPS (Ø ms / p95 / schlechtestes Bild) | nachher FPS (Ø ms / p95 / schlechtestes Bild) |
|---|---|---|
| Kreuzung | 32,2 (31,1 / 50,4 / 58) | 37,3 (26,8 / 33,1 / 40) |
| Straße | 33,1 (30,2 / 49,4 / 72) | 38,8 (25,8 / 31,0 / 38) |
| Nr. 7 innen | 32,6* (30,7 / 44,9 / 70) | 46,5 (21,5 / 25,3 / 34) |

\* ein Ausreißer-Durchgang (21 FPS) im Zustand „vorher“; ohne ihn ≈ 44 FPS.
Beim Gehen (4,5 m/s, 10 s, 3 Durchgänge): Ø 40,3 → 34,1 ms, p95 66 → 49 ms, Bilder > 80 ms je 10 s: 11,3 → 2,3.

Maßnahmen (alle ohne sichtbare Änderung; Vergleichsschalter in Klammern):
- **Kleinteil-Auslese mit Weltradius** (Basis `dcullBuild`; `__PX.DCULL.wr = false; __PX.DCULL.n = -1`): FBX-Modelle in cm (Skalierung 0,0025) hatten einen Formradius von 232 und fielen aus der Auslese. Zwei Gruppen „Simple Burlap Pin Effigy“ (je 152 Teile, 135–169 m entfernt, tief im Nebel) wurden jedes Bild gezeichnet: ≈ 300 von 950 Zeichenaufrufen. Kreuzung 952 → 706, Straße 1149 → 995, Nr. 7 534 → ≈ 390 Aufrufe.
- **Leistung 17 – Schattenbild-Bilder ohne volles Hauptbild** (`?noshfrei`, `__leistung.SHF.on`): Die Basis schaltete in Bildern mit neuem Mond-/Lampen-/Schlüssellicht-Schattenbild alle Auslesen ab, das Hauptbild zeichnete dann alles (+60 ms, beim Gehen alle ~0,45 s). three.js r170 baut die Liste des Hauptbilds vor `shadowMap.render`; darum bleiben die Auslesen an, ausgeblendete Teile sind nur für den Schattendurchlauf wieder sichtbar (Figuren bleiben in diesen Bildern sichtbar, damit ihre Knochen stimmen). Geprüft: gleiche Menge gezeichneter Schattenwerfer (480 = 480).
- **Leistung 18/19 – Shader-Wache** (`?nocompdefer`, `__leistung.S.cdefer`): Portionsgröße nach gemessener Anlegezeit (1 Teil mit neuem Programm je Bild statt 12), bis zu drei Portionen gleichzeitig bei der Grafikkarte; direktes `renderer.compile(gruppe, kamera, szene)` (bewohnt.js, `bw_bauen`: 12 Programme auf einmal) wird nach dem Laden in die Warteschlange der Wache umgeleitet. Erstes Betreten von Nr. 7: schlechtestes Bild 373 → 160 ms (die 250–370-ms-Standbilder sind weg; dafür mehr Bilder mit 50–100 ms in den ersten Sekunden).
- **Ladezeit:** Hüllkugel der SkinnedMesh aus der Ruhepose (`?noskinsph`; 2990 Formen × 1,2 ms ≈ 3,7 s; auch die 50–100 ms je auftretender Figur entfallen), früher BVH für Strahlen gegen große Formen (`?nobvh`, Basis `BVH_EARLY`; 900 Strahlen 46,8 s → 8 ms; die BVH gehören ohnehin zu `buildSolids`, 14 Formen mit Gruppen/Mehrfachmaterial gegen die einfache Strahlprüfung verglichen: 0 Abweichungen), 36 statt 12 Gruppen je Hochlade-Bild (`?upch=12` zum Vergleich). Modulphase im Ladeprofil 91,6 → 80,7 s, „Erstes Bild → Schatten“ 24,0 → 20,8 s.

Befunde ohne Änderung:
- „(program)“ im CPU-Profil (13–19 %) ist nativer Zeitanteil der WebGL-Aufrufe (Fast-API-Aufrufe, ohne JS-Rahmen), kein Treiber-Stall. Der „Freeze 1 s nach Neues Spiel“ war ein Messartefakt des Profil-Starts (`Profiler.start` blockiert 0,5–0,9 s); ohne Profiler: `beginGame` 0 ms, kein Bild > 90 ms danach.
- Die Grafikkarte ist nicht der Engpass (Zeitabfrage ≈ CPU-Einreichdauer; Viertel der Pixel: −15 %), die Last liegt im JS-Hauptthread (Zeichenaufrufe ≈ 40 %, Matrizen 11 %, projectObject 12 %, Auslesen 7 %).
- Durchsichtige Zeichenaufrufe (168 mit 135 Materialien, meist Einzelflächen mit eigener Textur) und Laternen-Halos (5–6 Sprites) lassen sich nicht sinnvoll zusammenführen: Gewinn < 0,3 ms.
- Knochen nur bei Bewegung neu rechnen (Leistung 16): kein Gewinn gemessen, verworfen.
- Ladezeit schwankt stark mit der Rechnerlast (Texturen-Hochladen 17–97 s im selben Stand, Isolations-Messung 1 GB/s); Texturen früh hochladen bringt nichts, weil der Hauptfaden in der Modulphase ausgelastet ist.
