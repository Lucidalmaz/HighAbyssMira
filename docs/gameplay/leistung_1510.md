# Leistung 15.10.2026 (Block „so schnell und fluessig wie moeglich“) – Zwischenstand

Messung: Dauerinstanz normal1, perf_gate Median aus 3 Laeufen (Neustart je Lauf), Rechner Ryzen 7 260 / RTX 5070 Laptop. Rohdaten: app/tools/perf_last.json (nicht committet).

## Analyse (Kreuzung, Messwerte)
* Hauptthread des Renderers 100 % ausgelastet, GPU-Prozess 42 %, GPU-Zeit je Bild per Timer-Query 13,5 ms: CPU-gebunden.
* 12 000 GL-Aufrufe je Bild kosten nur ca. 0,5 ms (Mikrobenchmark); Sortierung nach Programm (Programmwechsel 197 -> 130, GL-Aufrufe -12 %) aenderte die Renderzeit nicht -> verworfen.
* Kosten je statischem opakem Mesh ca. 25 us (227 ausgeblendet = -5,6 ms), je Instanz-Mesh 12 us, je transparentem 8 us.
* Obergrenze Zusammenlegen statischer Meshes (Simulation): 334 -> 203 (je Materialobjekt) / 150 (je Signatur) Aufrufe.

## Hebel
| Hebel | Aenderung | vorher -> nachher | Risiko | Beleg |
|---|---|---|---|---|
| Fledermaeuse: Kontrollrig-Linien | FBX `bat/model.fbx` (und fly/cobwebs/lamp/swings, ms-FBX) enthaelt das Maya-Kontrollrig als `Line`-Objekte (LineBasicMaterial 0x3300ff, 374 Stueck bei 12 Fledermaeusen, 31 je Tier). Jetzt unsichtbar. Das sind die „leuchtend blauen Dinger“. | Ladezeit 70,1 -> 62,4 s (Median 62,4/62,9/61,5), Modulphase 45,4 -> 39,7 s, Grafik vorbereiten 18,9 -> 16,7 s; Fledermaus nicht mehr blau | gering (Knoten bleiben, nur `visible=false`) | gate 15.10., Bilder `_live/.../bat5` (vorher blauer Fleck, nachher dunkle Silhouette) |
| Fledermaeuse: Verhalten | Sturzflug (`swoop`, Anflug auf den Spieler + Fluegelschlag-Ton) entfernt; Kreisen immer >= 9 m Abstand und >= 5 m ueber dem Kopf (Basis `fabUpdate`, leben.js `leben_batTick`/`leben_huntTick`) | – | gering | Code |

Gate: BESTANDEN (alle Werte innerhalb der Toleranz; Kreuzung p95 54,6 ms, 797 Aufrufe, Neukompilierungen 44 unveraendert).

## Nicht umgesetzt (ehrlich)
Render-Zeit-Ersatz statischer Meshes, Autos zusammenfuehren, dcull/vcull rundenweise, Mixer/Knochen drosseln, Allokationen, Ladeprofil/Vorwaermen, neues Fledermausmodell mit echten Rufen und Tier-Audit: nicht begonnen. Gruende: Umfang; Downloads freier Assets/Sounds brauchen Freigabe des Nutzers.

## Nachtrag: Zusammenfuehren (merge.js, dfd8e2f)
Render-Zeit-Ersatz: je Modellwurzel (Gruppe mit 25-400 Meshes ohne Figuren/Instanzen/Lichter) werden statische opake Teile gleicher Material-Signatur zu einem Mesh
(Kind der Wurzel) zusammengefuehrt; Originale bleiben unveraendert und werden nur zwischen rigFarHide/rigFarShow ausgeblendet, wenn die Gueltigkeitspruefung je Gruppe
besteht (Teile sichtbar, gleiches Elternteil, gleiche Lage zur Wurzel, gleiche Materialwerte/Karten, gleiche castShadow-Marke). Spiegel-Teile (negative Determinante) mit gedrehter Reihenfolge.
Aus: `?nomerge`. Testzugriff `window.__mrg`.
| Messung | ohne | mit |
|---|---|---|
| Render-CPU/Bild, Strasse, A/B 6 Wechsel x 80 Bilder | 19,4 ms | 18,9 ms (-2,6 %) |
| Zeichenaufrufe Strasse | 882 | 858 |
| Bildvergleich an/aus (Strasse, Wagen mit offener Tuer) | Unterschied = Rauschen (Mittel 22,9 vs. 23,7 ohne Aenderung) | |
| Gate 3 Laeufe | BESTANDEN: Ladezeit 61,9/61,6/62,7 s, Kreuzung p95 54,6/54,4/42,5 ms, Neukompilierungen 44 | |
Grund fuer den kleinen Gewinn: Fahrzeuge haben ca. 25 verschiedene Material-Signaturen auf 94 Teile, davon nur ca. 23 Teile in Gruppen >= 2 (Einzelteile, Glas, Leuchten
bleiben einzeln); mehr geht nur mit Texturatlas/Vertexfarben (Eingriff in Assets).

## Offene Liste (nicht umgesetzt)
dcull/vcull rundenweise (ca. 3 ms Gesamtkosten, Gewinn vermutlich 1 ms), Mixer-/Knochen-Drosselung fuer Figuren ausserhalb des Blickfelds (5761 sichtbare Knochen),
scene.updateMatrixWorld (ca. 3 ms), Allokationen (45-55 MB/s: Morph-Update, collide(), mwf_upd, neb_hide), Shader-Vorwaermen/44 Neukompilierungen,
Strassen-Spitzenframe (139 ms), neue Fledermaus (Modell/Animation/Rufe; freie Quellen verlangen Konto/Login -> Blender-Eigenbau noetig), Tier-Audit (docs/gameplay/tier_audit.md).

## Nachtrag 2 (15.10., Block „Haenger beim Gehen“) – Messung mit Phasenzeiten

Werkzeug: `window.__leistung.LP` (nur Entwicklung; ms-Summen je Phase, Teiler = LP.n) und A/B-Wechsel im selben Spiel (je 10 Wechsel, paarweise Differenz, Rauschen der Bildzeit umgangen). Steps-Hilfen in `C:\Users\GIGABYTE\_lz` (nicht im Repo).

### Befund
* Bildzeit am Kreuzung-Stand ist flach verteilt (kein Einzelposten > 15 %): Zeichnen ≈ 21 ms (davon updateMatrixWorld 3–4, Schatten 2–2,5), Logik 4,5, Auslesen 3.
* **Beim Gehen** waren die Ausreisser (p95 55–62 ms, max 226–345 ms) fast alle Code-Spitzen, nicht Rauschen (272 von 281 Bildern > 50 ms mit CPU-Zeit > 1,8 × Median): Fassaden-Sonde (6 Bilder je 18 m, 20–134 ms je Seite), vcull-/dcull-Neuaufbau (76–118 ms + 36–58 ms am Stueck, mehrmals je Minute), Shader-Wache-compile (voller Szenendurchlauf je Aufruf ≈ 3–10 ms), Wandbild-Bau (203 ms, getImageData), Mond-/Laternenschatten (11 ms alle ~0,5 s).
* GC ist kein Haengerverursacher (0,5 % der Zeit, Spitze 22 ms). 45–55 MB/s Muell stammten u. a. aus `for…of` ueber Kollider, `subarray` in perfCullTick, MWF-Zeitmarken (HeapNumber), Math.hypot.
* Anzeige 165 Hz: Bildzeiten sind keine vsync-Stufen (24/30/36 ms = Vielfache von 6,06 ms).
* **Fehler gefunden und behoben**: `leben_batTick` weist `const x/y/z` neu zu (TypeError jedes Bild, Takt „leben“ nach 60 Fehlern abgeschaltet) – Commit 1dba2cf (Datei des anderen Agenten, minimal).

### Hebel
| # | Hebel | vorher -> nachher | Commit | Risiko |
|---|---|---|---|---|
| 2 | dcull: Urteil je Teil nur jedes 4. Bild, Merkliste; Kamerasprung/Nebel: alle | 2,21 -> 1,18 ms/Bild (10/10) | 7d83881 | gering (Teile < 1 Pixel) |
| 2 | vcull: reihum jedes 3. Bild, Verbergen mit +5 m Rand, bei Drehung > 1°/Bild oder > 0,4 m alles | 1,48 -> 0,89 ms (10/10); Drehtest 5,7°/Bild: 0 Verstoesse | 7841fac | gering |
| 1 | merge.js: Gueltigkeit je Gruppe nur jedes 2. Bild | 1,21 -> 0,74 ms (Strasse, 10/10) | 5a92918 | gering |
| 1 | mwf_check: Nahzweige abwechselnd | 0,88 -> 0,80 ms, verworfen | – | – |
| 3 | Grenzen aus Schleife, Indexschleifen (collide/groundAt/ceilingAt/figuren_ground), perfCullTick ohne subarray, MWF-Zeit als Smi, kein Math.hypot in neb_hide/Sonde, Uniform-Merker statt Set-Suche | Heap-Stichprobe 509 -> 420 MB/10 s (vor Indexschleifen); mwf_upd 33 -> 7 MB | 5a92918, 7841fac, (offen: Indexschleifen) | gering |
| 4 | compile: Lichter aus Register statt traverseVisible ueber 17 000 Knoten | 3 ms -> 0,1 ms je Aufruf | 7841fac | mittel (Register ueber Object3D.add; Aus: `?nolightreg`) |
| 4 | Vorkompilieren der 44 Varianten | **nicht umgesetzt**: Varianten entstehen beim ersten Auftritt von Figuren/Bewohnt-Deko (Liste siehe unten), kein allgemeines Rezept ohne ~60 Programme / +5 s Ladezeit | – | – |
| 5 | Sonde: Gruppen ausserhalb der Seite, Fernteile ohne Wurzel, Himmel/Boden-Seiten nur jede 4. Aufnahme, K 64 -> 40 | Seite 11,5/13,4/9,7 -> 8,3/9,1/5,3 ms (ohne Y-Skip) | 7841fac | gering |
| 5 | vcull/dcull-Neuaufbau in Zeitscheiben (3 ms) | Spitzen 76–118 / 36–58 ms entfallen | 7841fac | gering |
| 5 | Wandbild beim Laden | 203-ms-Standbild entfaellt (+0,2 s Laden) | 7841fac | gering |
| 7 | MOON_MOVE 2 -> 4 m | Mondschatten-Durchlaeufe (11,5 ms) halbiert | offen | gering (Randschatten bei 38–42 m, Nebel) |
| 7 | Schatten statisch/Rate | war schon umgesetzt (autoUpdate aus, needsUpdate nach Bewegung); Taschenlampe/Laternen bei Bewegern bleiben je Bild/4 Hz | – | – |

Gehtest 60 s (gleiche Strecke, CPU je Bild aus den Phasenzeiten): Bilder 2301 -> 2961, CPU p95 62,5 -> 42,7 ms, p99 85,7 -> 57,5, max 226 -> 92; Bilder mit Abstand > 50 ms: 281 -> 99.

### Offen / ehrlich
* Hebel 6 (Modulphase 40 s): nicht profiliert abgeschlossen – das Ladeprofil kam wegen belegter Instanz/Sperre nicht zustande. Groesste Posten laut `__log`: Grafik vorbereiten 6,9 s, Kirchberg 4,9, Fassaden 4,3, Innenraeume 3,8, Ausbau Ost/West 5,3, Strassenraum 2,2, Kollision 1,9.
* Hebel 1: scene.updateMatrixWorld ist schon eingefroren (12 600 von 17 500 Knoten), Rest = Knochen sichtbarer Figuren (nur 11 % ruhend); Doppelrechnung in figuren_tick (updateMatrixWorld je naher Figur, ≈ 1,2 ms) nicht angefasst (Kopf-/Anim-Risiko).
* Weitere Haenger: welt_bau (30–60 ms beim Annaehern an Modelle), bw_vorher (30–40 ms Bewohnt-Deko), erste Sonden-Aufnahme nach Spielstart (Programm-Link 290 ms), einzelne 2048²-Bild-Uploads (HTMLImageElement 35 ms, ImageBitmap 6 ms – 2 Bilder), Lampenschatten bei Beweger (8–10 ms, 2/s).
* Neukompilierungen bleiben ≈ 45 (Figuren-Teile 7 s nach „Fertig“ im Menue, Aufheben, Uhr-Glas, Bewohnt-Deko, Figuren an der Strasse).
