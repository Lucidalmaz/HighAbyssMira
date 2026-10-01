# Stand R-11 · Bewuchs Ort und Wald (01.10.2026)

Nutzerwunsch R-11 (mit R-7/R-8, Q-2/Q-8): Außenwelt und Wald deutlich dichter, lebendiger und detailreicher; jede Pflanze mit Grund; Maßstab Until Dawn / RE.

## Gebaut
- **Neues Modul `app/mods/bewuchs.js`** (am Ende von ORDER in `assemble.js`). Es lässt `gruen.js`, `wald.js`, `tiefwald.js` und `waldleben.js` unverändert und nutzt nur ihre Schnittstellen: `gruen_lodSet/lodAdd/lodBuild`, `gruen_occ`, `gruen_wind`, `wl_asset`, `wl_free`, `wald_/tief_pathDist`, `solidNear`.
- **Ort, Kapitel 1–5 (beim Laden, ~0,6 s):**
  - **Gehwege:** Unkraut im Rinnstein und in den Plattenfugen. An der Gartenkante wachsen Unkraut und Trockengras.
  - **Kieseinfahrten:** Mittelstreifen bewachsen, die von Nr. 9 dicht.
  - **Mauer-, Haus-, Schuppen-, Grab- und Zaunfuß:** aus der Belegungskarte von `gruen.js` abgeleitet. Dort stehen:
    - Unkraut und Trockengras
    - Farne an Nordseiten und in Ecken (Schatten, Feuchte)
    - Pilze in feuchten Ecken
    - Laub in Windecken
    - Ranken am Zaun
    - Bodenefeu an verlassenen Orten
  - **Verwilderte Flächen:** um verlassene Orte (`BEWUCHS_VERWAHRLOST`: Nr. 9, Nr. 1, Friedhof, Schrebergärten, Hof, Villa, Tankstelle, Schrott, Sperren) wachsen Trockengras, Farn, Efeu, Unkraut und Büsche.
  - **Häuser:** Büsche an den Hausecken; Laub an den Ortsbäumen im Windschatten.
  - **Treppenstufen:** Moos.
  - **Waldrand am Weidezaun:** Farne und Trockengras.
  - **Gefällte Bäume:** in Gärten und am Hof stehen Stümpfe mit Pilzen.
  - **Wandefeu:** erst nach dem Kollisionsaufbau. Für die Wand wird per Strahl gegen die Kollisionskörper Höhe und Ausrichtung bestimmt; nur echte Wände ab 1,55 m Höhe bekommen Efeu.
    - An Häusern wächst Efeu nur an den Ecken und niedrig (≤ 1,3 m), damit die Fenster frei bleiben.
    - An verlassenen Häusern, Mauern und Schuppen wächst er bis 2,6 m.
- **Wald, Kapitel 6 (lädt erst nach, sobald `wald_frei()`):**
  - **Mehr Bäume** (+22 je 1000 m², nur auf freien Plätzen ≥ 2,3 m von vorhandenen Stämmen): Kiefern von Jungwuchs bis 21 m, Laubbäume und stehendes Totholz. Jeder Stamm hat eine schmale Kollision.
  - **Liegende tote Stämme** (Kollision entlang des Stamms), Stümpfe, Felsen.
  - **Farnkolonien:** Lady Fern und Beech Fern, grün bis herbstbraun je Kolonie, tiefer im Wald und am Weiher dichter.
  - **Dickicht:** Himbeer- und Holunderflecken, weich (bremsen und rascheln); Trockengras.
  - **Laub und Unkraut** an den Wegrändern.
  - **Mondlicht durch Lücken im Kronendach:** nur über Lichtung, Steinkreis und Weiher. Es sind kaltblaue, weiche Lichtschächte ohne Lichtquelle (Streulicht im Nebel, Richtung zum Mond).
  - **Frei bleiben:**
    - Wege aus `WALD_PATHS`/`TIEF_PATHS`, Lukes Weg (`K6_WEG`) und die Kinderspur
    - Story-Orte (`wald_free`/`tief_free`) und Interaktionspunkte
    - die Zeichen-Orte (`ZEICHEN_TAB`)
    - die Jagdflächen: Bus-Falle (r 11), Fraßstelle, Bau, Wrack, Lager, Lichtung
- **Bewegung (R-7):** Alle neuen Pflanzen nutzen `gruen_wind`. Das ist `windVert` aus der Basis: Böen, Flattern und Ausweichen vor Luke. Wandefeu zittert nur und weicht nicht aus. Das System gehört zum Agenten Umgebungsphysik und wird nicht verdoppelt.
- **Leistung:**
  - **Instanzen:** je Art ein Satz Instanzen über `gruen_lodSet`. Ort und Wald teilen sich dieselben Sätze, die Zahl der Draw Calls hängt also nicht von der Fläche ab.
  - **Detailstufen:** nah Scan-LOD0/1, mittel LOD1/2, fern Bildkarte, dann weg; dazu der Sichtkegel.
  - **Schatten:** nur Farn nah, Bäume nah und Stumpf.
  - **Wald:** lädt erst in Kapitel 6 und wird bei einem älteren Spielstand wieder ausgeblendet.
  - **Texturen:** KTX2 (`node tools/ktx.mjs`).

## Assets (Megascans, Fab-Standardlizenz, `HAM_FabDownloads/v19_vegetation/x`)
- **Neu übernommen** mit `app/tools/_r11_import.mjs`: `ms/ladyfern`, `ms/beechfern`, `ms/ivy_ms`, `ms/drygrass`, `ms/weeds`, `ms/bolete`. Eingetragen in `CREDITS.md`.
- **Wildgras, Himbeere, Holunder, Spindel** lagen schon vor (`wildgrass2`, `raspberry`, `elderberry`, `spindle`).
- **„Totbaum“ (qlEtl)** ist identisch mit `ms/deadtree1` und wurde nicht doppelt übernommen.
- **„Broken Stump“** wurde laut Lizenzhinweis nicht übernommen, weil er nur „UEFN – Reference only“ ist. Stattdessen wird der vorhandene `w_stumprot` verwendet (Ewan Lejkowski, CC-BY, Credits ergänzt).

## Kurz geprüft
- `node --check` und `assemble.js` laufen fehlerfrei; `game/index.html` ist neu gebaut.
- **Rundgang nachher** (10 Orte, `C:/Users/GIGABYTE/_r11/nachher`): Der Ort wurde gebaut mit
  - 1823 Unkraut, 1164 Trockengras, 346 Frauenfarn, 58 Buchenfarn
  - 70 Bodenefeu, 100 Ranken, 167 Pilze, 192 Laub, 7 Moos, 20 Stümpfe
  - Aufbau in 611 ms
- **Fehler aus dem Rundgang:**
  - Der Wald brach mit `PI2 is not defined` ab. Ursache war ein `//`-Kommentar mitten in der Zeile; das ist behoben.
  - Wandefeu kam nicht zustande, weil der Kollisionsaufbau im Testbau fehlschlug (`three-mesh-bvh`, siehe unten).
- **Abschlusscheck:** entfallen, weil die Testwarteschlange voll war (Anweisung Hauptagent). Nach der Korrektur sind nur Syntax und Bau geprüft.
- **Vorher-Rundgang:** nur ohne KTX (`_r11/vorher_ohneKTX`). Der zweite Vorher-Lauf ging beim Sitzungsneustart verloren.

## Im Gesamttest prüfen (bewuchs.js)
1. **Laden ohne Fehler:** Kein „Bewuchs:“-Fehler im Protokoll. `__bewuchs.S.stats` zeigt die Ortszahlen (siehe oben) und nach dem Kollisionsaufbau `efeuWand > 0` (erwartet etwa 40–100).
2. **Kapitel 6:** Nach dem Gitter muss `__bewuchs.S.wald === 2` sein. Die Werte `waldBaeume`, `waldFarne`, `waldBuesche`, `waldLiegend`, `waldStuempfe` und `waldFelsen` müssen größer als 0 sein; `waldMs` ist die Aufbauzeit (Ruckler beim Nachladen während AG-18?).
3. **Sichtprüfung an 10 Orten** (Schritte `C:/Users/GIGABYTE/_r11/steps.json`):
   - Dorfstraße, Vorgärten, Platz/Kreuzung, Friedhof, Schrebergärten, Waldrand
   - Wald-Eingang, Dustwoods, Hochsitz, Steinkreis
   - Zu prüfen: Texturen da? Keine Pflanze schwebt oder steckt in einer Wand? Efeu an Hausecken lässt die Fenster frei? Keine sichtbare Wiederholung?
4. **Mondlicht-Schächte** über Lichtung, Steinkreis und Weiher: weich und nicht zu hell. Die Stärke steht in `bewuchs_strahlen`, Faktor `.085`.
5. **Wege und Jagd in Kapitel 6:**
   - Lukes Weg, die Kinderspur und die Wege mit dem roten Faden sind frei.
   - Keine neue Baum- oder Stammkollision auf der Fluchtlinie Lager → Wrack.
   - Die Bus-Falle (r 11) ist frei.
   - Das Dickicht bremst nur abseits der Wege.
6. **FPS** im Dorf und im tiefen Wald, mit und ohne die neuen Sätze `bw_*`.

## Offen / Bitten
- **Hauptagent:** In den Testläufen fehlen auffällig viele Texturen.
  - Symptome: „GLTFLoader: Couldn't load texture blob:…“, graue Karten und Blätter auch im Vorher-Bild.
  - Unter `--root=game` fehlt `game/vendor` (KTX-Transcoder 404).
  - Einmal trat zusätzlich `Kollision TypeError: Failed to resolve module specifier 'three-mesh-bvh'` auf.
  - Das betrifft die ganze Vegetation und vermutlich alle KTX-Modelle. Bitte im Gesamttest mit dem echten App-Bau prüfen. Ohne Texturen wirkt jede Pflanze „generiert“.
- **Gesamttest:** Wandefeu an Häusern und Mauern ansehen (Fenster frei?) und die Waldwege mit der Jagd ablaufen: Ist der Weg frei, ist das Dickicht nicht zu dicht?
- **Performance-Schluss:** Die neuen Sätze heißen `bw_*` (in `gruen_S.stats`).
  - Wenn es knapp wird, zuerst `bw_totholz`/`bw_liegend` kürzen (16,7k Dreiecke je Stamm), danach die Farn-Fernkarten.
