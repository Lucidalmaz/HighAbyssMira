# Tier-Audit und Fledermaus (15.10.2026) – Stand, ehrlich

## 1. Fledermaus: neu gebaut (Note vorher 5 -> nachher 2)
* **Vorher:** Maya-FBX mit 31 starren Teilen je Tier (374 Zeichenaufrufe-Kandidaten), blaues Kontrollrig, cartoonhafte Silhouette. Nach Entfernen des Rigs nur dunkler Fleck.
* **Quellen-Suche:** Fab (eingeloggter Browserweg, nur kostenlos): alle freien „Bat“-Modelle sind stilisiert (Cartoon, rote Augen, Halloween-Deko, Baseballschlaeger) -> keine Verbesserung. Daher Blender-Eigenbau (ausdruecklich beauftragt).
* **Modell** `app/tools/blender/fledermaus_bau.py` (Aufruf in Datei) -> `game/assets/ms/fledermaus/model.glb`: Grosses Mausohr, Spannweite 0,42 m (im Spiel x1,5), 2 194 Dreiecke,
  36 Knochen, 1 Material (Farbe + Normalenkarte 1024, KTX2 1,9 MB), Clips `Flap` (0,25 s, Abschlag mit nachschwingenden Fingern, Aufwaertsfalten) und `Glide` (1 s).
  Anatomie: Propatagium, Plagiopatagium, Dactylopatagium mit ausgebuchteten Hinterraendern, Uropatagium mit Sporn und Schwanz, Daumen mit Kralle, 3 Finger aus Mittelhand + 2 Gliedern,
  Hinterbeine mit Zehen/Krallen, grosse Ohren mit Tragus, Augen, Fellkarte (Rueken braun, Bauch hell), Hauttextur mit Adern und Knochenlinien.
* **Einbau** (leben.js `leben_batSetup/leben_batTick`): 12 Tiere, je 1 Zeichenaufruf (vorher 31 Teile je Tier), Flug in Schueben (Schlagphase 1,0–2,6 s, Gleiten 0,35–1,0 s, weich ueberblendet),
  Kopf voraus aus der echten Bewegung, Kurvenneigung (Roll) und Steig-/Sinkwinkel, Kreisbahnen um Kapelle/Tankstelle/Schrott/Scheune/Gaerten/Strasse, weicher Mindestabstand 6,5 m
  (kein Sprung) und >= 4,5 m ueber dem Kopf, nie auf den Spieler zu; Jagd an der Lampe bleibt >= 6,5 m. Alte FBX und `assets/bat/*` entfernt, Basis `FAB.bats` leer.
* **Sound** (`app/tools/klang_bau6.py`, `fx_fleder_1..6`, `fx_fleder_jagd_1..2`, `fx_fleder_fluegel_1..2`): echte Aufnahmen (Detektor/hoerbar), 3D (Audio.play x,y,z), leise,
  nur bei sichtbaren Tieren in Hoerweite (38 m), Fluegel nur < 18 m und nur in der Schlagphase, Jagd-Buzz am Lampenfang (alle 3 s hoechstens).
* **Bilder:** `tier_audit_bilder/sheet_flap_vorn.png` / `sheet_flap_drei.png` (Schlagzyklus, Frames 0/3/6/9), `v_Glide0_oben.png` (Draufsicht), `fledermaus_ingame_lampe_3bilder.png`
  (Nacht, Strasse, Jagd an der Laterne, ca. 10 m, 3 Bilder; Tier dort noch Massstab 1,0 – danach auf 1,5 und 6,5 m angehoben).
* **Offen/ungeprueft:** (a) neuer Massstab 1,5 und Mindestabstand 6,5 m ist im Code, aber nicht mehr im laufenden Spiel bildlich belegt (Dauerinstanz gehoert dem Leistungs-Agenten);
  (b) Rufe nur im Code geprueft, nicht gehoert/Pegel im Spiel gemessen; (c) Perf-Rauchlauf nicht gemacht (Zeichenaufrufe sinken rechnerisch um ca. 360); (d) Feinheit: Felle/Haare nur als Textur, Ohren glatt.

## 2. Tier-Liste (Vorschau-Blaetter `tier_audit_bilder/sheet1..3.png`, Blender-Import; im Spiel Shader/Beleuchtung anders)
| Tier | Modell/Quelle | Aussehen | Bewegung | Sound | Note vorher | praegnant | Aktion |
|---|---|---|---|---|---|---|---|
| Fledermaus | Eigenbau (s. o.) | 2 | 2 (Flap/Glide, Roll) | 2 (echte Rufe) | 5 | ja | neu gebaut |
| Kraehe/Rabenkraehe | rabe_kraehe (Eigenbau Blender 08.10., 17 Clips) | 2 | 2 | 2 (fx_rabe_*, Fluegel) | 2 | ja | nur gegengeprueft, nicht angefasst |
| Whiskey (Rabe) | rabe_whiskey | 2 | 2 | 2 | 2 | ja | bekannt gefixt, nicht angefasst |
| Ratte | Fab rat.glb, 32k Dreiecke, Fellkarten | 2 | 3 (3 Clips, Kratzton als Quieken) | 3 | 3 | mittel | offen |
| Katze (17) | Fab Cat long haired, Fellkarten, Shader | 2 | 2 | 2 (echt) | 2 | ja | bekannt gefixt |
| Fuchs | Animal Variety Pack | 1-2 | 2 | 2 | 2 | ja | – |
| Reh/Hirsch | Animal Variety Pack | 2 | 2 | 2 | 2 | ja | – |
| Wolf | Animal Variety Pack | 2 | 2 | 2 | 2 | ja | – |
| Schwein | Animal Variety Pack | 2 | 3 | 2 | 3 | mittel | offen (Fellfarbe im Preview ausgebrannt, im Spiel pruefen) |
| Kuh (Kino/Horror) | cow.glb 3 136 Dreiecke, absichtlich verdreht | 4 | 4 (Standbild/Fall) | 2 | 4 | ja (Kino) | offen: hochwertiges Ersatzmodell suchen (Fab-Treffer sind alle Low-Poly) |
| Spinnen (6 Arten) | spinnen.js (Haarkarten, Variationen, Gang) | 2-3 | 2 | 3 | 3 | mittel | Modul 10.10. bearbeitet; Vogelspinne -> Fab „Theraposa blondi“ (Personal/Professional, glb) waere Verbesserung, nicht eingebaut |
| Fliegen | fly.fbx, 28k Dreiecke, Instanzen | 2 | 3 | 3 | 3 | mittel | offen |
| Motten | Punkte/Sprites (Basis) | 4 | 3 | – | 4 | gering | offen |
| Wendigo-Tierformen (Reh/Hirsch/Hirschding) | wendigo_* (Eigenbau/Rigs) | 2 | 2 | 2 | 2 | ja | – |
| Voegel (Amsel, Eule, Voegel) | nur Ton | – | – | 2 | – | – | kein Modell vorhanden |
| Fische, Pferd (einzeln) | nicht im Spiel (Pferdestall = Gebaeude) | – | – | – | – | – | – |

Hinweis: Noten sind Einschaetzungen aus Vorschau und Code. Die Bildaufnahmen im laufenden Spiel (Nacht, Taschenlampe) scheiterten an der Soft-Sichtbarkeit (Tiere loesen sich auf, wenn sie
per Skript versetzt werden) – ehrlich: **kein belastbarer Nachher-Bildbeleg ausser Fledermaus**.

## 3. Offene Liste
1. Fledermaus im Spiel nochmals bildlich (6,5 m, Massstab 1,5) + Pegel der Rufe pruefen, Perf-Rauchlauf.
2. Kuh, Ratte, Schwein, Fliegen, Motten, Vogelspinne verbessern (Reihenfolge nach Sichtbarkeit: Ratte > Fliegen/Motten > Kuh > Spinne).
3. Tier-Fotos im Spiel: Tiere nicht per Skript versetzen, sondern per `Nahe gehen` an echten Standorten (S.spots) fotografieren.

## 4. Pruefung im Spiel (15.10.2026) – Bildnoten, ehrlicher Stand
Laeufe: `HAM_Tiere/belege/out2` (Ausgangsstand, 3 Bilder je Tier) und `out3` (nach Einbau). Skript `HAM_Tiere/mk2.py` (HUD aus, Debug-Licht, Spieler 3-6 m vor das Tier, Tiere per Modul-Hook an die Szene).
Einschraenkung: nur Nacht, Kapitel 1; Tag nicht vorhanden/geprueft. Die Kamera-Versetzung wurde teils durch Kollision/Raeume veraendert, deshalb sind viele Bilder keine Tierbilder.

| Tier | Note vorher | Note nachher | praegnant | Bild / Anmerkung |
|---|---|---|---|---|
| Fuchs | Schaetzung 2 | 2 (klein, ca. 10 m, Fell/Silhouette ok, Bewegung nicht beurteilbar) | ja | `out2/fox_1.png`, `fox_3.png` |
| Reh/Hirsch (Standbild, ca. 15 m) | Schaetzung 2 | 2 (Silhouette und Fell glaubhaft; Nahbild fehlt) | ja | `out2/hirsch_1.png`, `out3/hirsch_1.png` |
| Ratte, Kraehe, Schwein, Whiskey, Katze, Wolf, Fledermaus (Massstab 1,5), Bruno, Spinnen, Wendigo-Formen, Goldfisch | Schaetzung (s. Abschn. 2) | **nicht belegt** (Tier im Bild verdeckt/zu dunkel/ausserhalb, Goldfisch-Getter `OW` fehlt) | – | `out2/*_1..3.png` |
| Kuh | Schaetzung 4 | Eigenbau eingebaut; im Spiel nicht im Bild (Szene ohne Kuh im Sichtfeld) – nur Blender-Vorschau besser (Holstein, Euter, Ohren) | ja (Kino) | `HAM_Tiere/vk_a.png` |
| Fliege | Schaetzung 3 | gleiches Aussehen bei 3,6 k statt 28 k Dreiecken (Blender-Vorschau), im Spiel keine Fliege im Bild | mittel | `HAM_Tiere/vf_a.png` |
| Motte | Schaetzung 4 | Mesh-Fassung NICHT eingebaut: im Spiel-Bild (`out3/motte_1.png`) keine Motte erkennbar, Sprites (`out2/motte_1.png`) bleiben | gering | – |
| Rattenrufe / Fliegenbrummen | synthetisch/Kratzen | echte CC0-Aufnahmen eingebaut, laden ohne Fehler; Pegel im Spiel NICHT gemessen (Zielpegel -32/-34 LUFS leise) | – | `app/tools/klang_bau7.py` |

Offen: Nahbilder mit sichtbaren Tieren (Ratte, Kraehe, Schwein, Katze, Wolf, Bruno, Spinnen, Wendigo), Fledermaus Massstab 1,5, Kuh im Kino, Motte (Mesh in `HAM_Tiere/vorschlag/motte.glb`, nicht eingebaut), Pegelmessung, Perf-Rauchlauf.
