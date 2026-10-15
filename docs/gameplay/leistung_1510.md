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
