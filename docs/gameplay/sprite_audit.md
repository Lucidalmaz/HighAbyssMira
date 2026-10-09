# Sprite-, Fahrzeug- und Textur-Audit (statisch, 09.10.2026)

Methode: nur Quelltext und Dateien im Worktree `HAM_Kunst` gelesen, keine Spielinstanz, Blender-Vorschauen der Fahrzeug-Assets. Was nur im Spiel prüfbar ist, steht jeweils dabei. Aufwand: S = unter 1 h, M = 1 bis 3 h, L = mehr.

## A. Fahrzeuge

| Fundstelle | Modell | Befund | Maßnahme / Stand | Aufwand |
|---|---|---|---|---|
| `strasse.js:203-205` (Transporter vor der Telefonzelle, 14,6 / 3,25) | `vans/model.fbx` (Scan-Kleinbus, niedrige Polygonzahl, 1024er-Textur) | Wahrscheinlichster Kandidat für „das große weiße Auto“. Der Lack kam aus einer Laufzeit-Umfärbung per Canvas (`recolor`, Heuristik auf Weiß/Blau). Scheiben, Grill und Rücklichtbereich blieben hellblau/weiß, die Beschriftung „HALCYON“ konnte durchscheinen. Schlägt die Umfärbung fehl (`safe`), steht der Wagen weiß-blau da; `VAN['Material #928']` hatte keine Farbkarte. | ERLEDIGT: fertig gebackene Textur `vans/van_grau_d.jpg` (aus dem Unbeschädigten, grau mit Wolkenschmutz, Scheiben dunkel getönt, Grill gedämpft). Canvas-Umfärbung abgeschaltet (`null && recolor`). Im Spiel prüfen: Wagen dunkelgrau, Scheiben dunkel, keine Streckung/Verdrehung der Textur (UV-Layout unverändert). | S |
| `kapitel1.js:97-98` (geheimes Ende, „Bus“) | derselbe Transporter, per `msFit(o, 7.4)` um Faktor ca. 1,5 gestreckt | weiß/blau, mit Firmenaufdruck, gestreckt: wirkt billig | Textur auf `van_grau_d.jpg` (erledigt). Streckung bleibt (eine Bus-Scan fehlt, siehe `download_kandidaten.md`). | S / M für echten Bus |
| `neben4.js:449` (Kap. 4, Transporter bei 7,7 / -4,25) | derselbe | weiß/blau, Farbe zusätzlich zu 55 % Richtung Off-White gemischt | Textur auf `van_grau_d.jpg` (erledigt) | S |
| `tiefwald.js:265` (Wrack im Wald, Farbfaktor 0x8a8478) | derselbe, Scheiben fehlen absichtlich | blau/weißer Halcyon-Aufdruck unter braunem Faktor | offen (bewusst nicht angefasst): bei Bedarf auf `van_grau_d.jpg` und Faktor 0xb8b4aa | S |
| `ausbau_ost_west.js:90` | derselbe, `van_damaged_d.jpg` | Beschriftung sichtbar | wie oben, Fundstelle prüfen (im Spiel) | S |
| `strasse.js:178-193` (Oldtimer geparkt, -37 / 3,15) und `kino.js:519` (Kombi) | `car_dutch/model.glb` (Foto-Scan, 55k Dreiecke, Atlas 2048², Autofläche nur etwa 1/5 des Atlas) | Motorhaube, Dach und Kofferraum waren im Scan ausgebrannt (nahezu weiß), das Auto wirkte weiß. Texeldichte niedrig: Nahaufnahme unscharf. | ERLEDIGT (Teil): Albedo-Lichter gedämpft (weiße Flächen werden graugrün), Blender-Vorschau geprüft. Texeldichte nicht lösbar ohne neuen Scan. | S |
| `strasse.js:78` (vier Limousinen, Geisterauto, Lena/rot/beige, Lukes Leihwagen `strasse.js:216`, `lwo.js:559`) | `car_amsedan/Car.fbx` (Spielzeug-nahe Low-Poly-Limousine, Texturen 512²: `Car_color.jpg` 4,6 KB = Farbpalette, `Car_details.jpg`) | Sieht im Nahbereich billig aus: wenige Polygone, glatter Lack ohne Scan-Detail. Wird sehr oft verwendet (gleiche Silhouette fünfmal auf der Hauptstraße). | OFFEN: echte hochauflösende Limousine (siehe `download_kandidaten.md`). Kurzfristig: Verteilung variieren (zwei der Wagen auf `car_dutch`/`car_burned`-Silhouette tauschen), Lack mit `grime`-Decals. | M |
| `strasse.js:207-211`, `tiefwald.js:329` | `car_rusty/model.glb` (15 MB, 664 614 Dreiecke, 2K-Texturen) | Leistungsrisiko: das Mesh ist sehr schwer. In `strasse.js` wird nur `Group002` behalten, die tatsächliche Zahl nach dem Ausdünnen ist nicht ermittelt. | OFFEN: im Spiel mit Leistungsmessung prüfen; Dreiecke per Blender auf unter 150 000 decimieren. | M |
| `strasse.js:212-213`, `ausbau_ost_west.js:78` | `car_burned` (zwei Fahrzeuge, 1024² Texturen) | gut | keine | n. a. |
| `ausbau_ost_west.js:79` | `car_junk` (Scan, 1,6 MB FBX) | nicht geprüft | im Spiel ansehen | S |
| `tiefwald.js:89` (Bus-Einbau) | `bus_innen` (Blender-Eigenbau) | in Ordnung | keine | n. a. |

`nr4.js` und `kirchberg.js` enthalten keine Fahrzeugmodelle.

## B. Sprites und Billboards (`THREE.Sprite`, Planes mit Textur)

Von rund 45 `THREE.Sprite`-Stellen sind fast alle additive Lichteffekte (Flammen, Halos, Glut, Rauch, Staub, Funkeln: `anwesen.js:326/349`, `ausbau_nord.js:82/978`, `feuer.js:232`, `hervorhebung.js:182/224`, `kapitel3.js:443`, `kiffen.js:267-270`, `laternen.js:26/38`, `lwo.js:423/566`, `neben3.js:563/747`, `tausch.js:368`, `weiss.js:68`, `zeichen`, `post.js:171`). Das sind Licht und Atmosphäre, keine Gegenstände, und sind mit der Regel „keine generierten Dinge“ vereinbar. Dabei: Radiale Verläufe in 64-128 px (`kapitel1.js:99/140`, `kiffen.js:155-160`) sind bei Skalierung über 1 m weich genug; nur harte Kanten würden auffallen.

Echte Gegenstände als Sprite oder Canvas-Fläche (Problemfälle):

| Fundstelle | Befund | Fix-Vorschlag | Aufwand |
|---|---|---|---|
| `ausbau_ost_west.js:627` | Fisch im Glas als Sprite aus einer 64×32-Canvas (orange Ellipse). Billig, verstößt gegen „keine generierten Gegenstände“. | Fisch weglassen oder als kleines Blender-Modell (echter Goldfisch nach Referenz) in das vorhandene Glasmodell | S |
| `ausbau_ost_west.js:352/533`, `anwesen.js:150`, `innen_ort.js:386`, `justin.js:277` (Silhouetten/Gesichter als Planes mit Textur `silTex`, `faceTexes`) | Fläche mit Canvas-Silhouette: von der Seite flach. Gewollt als Spuk, aber bei Nähe sichtbar. | Nur mit Nähe-Abschaltung (Fade unter 2 m) oder durch Figuren-Modell ersetzen | M |
| `fassaden.js:873` | 3,2 × 2,5 m große Plane mit 1024×800-Canvas (Strichwände): 3,2 px pro cm, bei Annäherung körnig | Textur auf 2048 oder als Decal aus vorhandenen `ritzschrift`-Karten | S |
| `strasse.js:416-418` | Bremsspur 1,62 × 11 m mit 128×1024-Canvas: 12 px/m quer, gestreift | 512×4096 oder gescannte Reifenspur (`spuren/`) | S |
| `strasse.js:389` | Zettel in der Telefonzelle 128×170-Canvas mit Handschrift auf 12×16 cm: lesbar nur grob | 512×680 | S |
| `gruen.js:592-598` | Warnschild „FORBIDDEN DUSTWOODS“ als Canvas-Blech 512×320 auf 62×39 cm: Schrift ist generiert (Arial) | Schild-Scan (Fab „old metal sign“) mit Gravur; vorerst Schrift in `Caveat`/Stempel-Font statt Arial | M |
| `kapitel1.js:120` (Hufeisen), `kapitel1.js:171` (Magnet/Foto), `kapitel1.js:325` | Canvas-gezeichnete Gegenstände 64-128 px | Hufeisen: Blender-Eigenbau nach Referenz, 3D; Magnet: weglassen | M |
| `post.js:132/173/255/270/289`, `neben3.js:209-221/742/914-970`, `villa.js:224-467`, `nr4.js:126/203`, `kirchberg.js:451/587/733` | viele Canvas-Decals 32-160 px für Zettel, Schilder, Etiketten (Breite 4-20 cm) | Prüfen, ob die Fläche unter 25 cm bleibt (dann ok); größere hochskalieren auf 512+ | M |

`fillText` kommt in rund 383 Zeilen vor (Spitzenreiter: `amt.js` 64, `strasse.js` 25, `ausbau_nord.js` 25, `neben3.js` 22, `ausbau_ost_west.js` 22, `villa.js` 21, `zimmer7.js` 20). Das ist größtenteils Handschrift/Tipptext auf Papier und gewollt; kritisch sind die Fälle, in denen ein Blech- oder Emailleschild als Canvas entsteht (Straßenschilder, Typenschilder, Aufkleber): `strasse.js` (Parkschild, Kennzeichen, Telefonzettel), `gruen.js:598`, `amt.js` (`amtp_schild`, Aufkleber `amt.js:272`), `ausbau_ost_west.js:209/219` (Platten/Blöcke), `feuer.js:355` (Plakette). Sammel-Maßnahme: Metallschilder aus Blender-Modellen mit Gravur (Prüfraum-Schild ist bereits so gelöst, siehe `qa_art_befund.md` M-15) bzw. Scan-Schildern (`download_kandidaten.md`).

## C. Niedrig aufgelöste Texturen (< 512 px) auf nahen oder großen Flächen

Bildateien in `game/assets` unter 512 px: nur acht. Alle unkritisch.

| Datei | Größe | Verwendung | Bewertung |
|---|---|---|---|
| `ms/album/cover.jpg` | 240×300 | Fotoalbum-Deckel, im Nahbild | Nahaufnahme weich | 
| `ms/grave_coll/Gravestones_256_*` | 256² | Grabsteine, nur Fernstufe (2K-Variante wird geladen: `ausbau_nord.js:240`) | in Ordnung |
| `ms/barn_horse/t3.jpg` | 1×1 | Platzhalter | in Ordnung |
| `ms/spuren/kratzer.png` | 256² | Krallenspuren-Decal (`beobachter.js:634`) | etwas weich, Decal klein |

Sehr viele Dateien liegen bei genau 512² (Auto-Atlanten `car_amsedan`, `beutel*/futter.jpg`, `doll/knife_*`): `car_amsedan/Car_color.jpg` und `Car_details.jpg` (512²) sind die Ursache für den Billig-Eindruck der Limousinen. `car_dutch` (Atlas 2048², Auto nur ein Teil) hat effektiv ca. 300-400 px je Karosserieteil.

Canvas-Texturen (zur Laufzeit erzeugt) unter 512 px auf Flächen über 1 m: keine gefunden, aber die Mehrzahl der Plakate/Zettel ist 128-256 px bei 10-30 cm Kantenlänge (1 bis 1,5 px pro mm, noch knapp ausreichend, in der Nahansicht weich).

## D. Zusammenfassung / Priorität

1. Transporter: erledigt (4 Fundstellen auf graue Textur; offen: `tiefwald.js:265`, `ausbau_ost_west.js:90`).
2. Oldtimer: erledigt (Highlights gedämpft).
3. Limousinen `car_amsedan`: offen, braucht neues Modell (Download).
4. `car_rusty` Leistung: im Spiel messen, decimieren.
5. Canvas-Gegenstände/Schilder: Fisch, Hufeisen, Warnschild ersetzen (je S bis M).
