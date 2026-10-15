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
