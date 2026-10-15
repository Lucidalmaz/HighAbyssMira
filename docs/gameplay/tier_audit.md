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
