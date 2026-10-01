# Lizenz-Audit für die Veröffentlichung (Stand 01.10.2026)

> **Keine Rechtsberatung.** Diese Liste ist eine sorgfältige technische Bestandsaufnahme, keine juristische Prüfung. Vor einem kommerziellen Release die als „kritisch“ und „prüfen“ markierten Punkte von einer fachkundigen Person (Medien-/Urheberrecht) bestätigen lassen.

Quellen der Angaben: Fab-Bibliothek des Kontos (über `fab.com/i/library/search`, Lizenz je Erwerb), Fab-Listings (`/i/listings/<id>`), Download-Listen in `C:\Users\GIGABYTE\HAM_FabDownloads\*` (Dateinamen und Download-Kennungen den Listings zugeordnet), `app/tools/cast.json`, `unreal/Scripts/*`, `CREDITS.md`, `game/sounds_src/QUELLEN.txt`, `C:\Users\GIGABYTE\HAM_Stimmen\LIZENZ_UND_WAHL.md`. Verwendung = Verweise in `app/mods/*.js` und `app/mods/_base_source_index.html` (Quelle von `game/index.html`).

## Kurzfassung

### Kritisch (vor dem Release ersetzen oder schriftlich klären)
| Asset | Wo im Spiel | Problem | Empfehlung |
|---|---|---|---|
| **Epic UE5-Mannequin „Quinn“** (`game/assets/ghost/ghost.glb`, Mesh `SKM_Quinn_Simple`, Clips `MM_Idle`, `MF_Unarmed_Walk_Fwd`) | Basis (`FAB`-Figuren, Echo-/Geisterumrisse), `fassaden.js` (Silhouetten hinter Fenstern), `innen_kapitel.js` | Epic-Inhalt aus der Unreal-Engine-Vorlage, **nicht über Fab erworben** → gilt die Unreal-Engine-EULA, nicht die Fab-Lizenz. Die EULA erlaubt zwar „Distribute Examples … to any third party“, verlangt aber für Produkte mit Licensed Technology u. a. Einbindung „only in object code and only as an inseparable part of the Product“ und eine Endnutzer-EULA mit Haftungsausschluss; außerdem: „certain assets … are available for use only with Unreal Engine“. In einem three.js-Spiel nicht eindeutig zulässig. | Durch eine Fab-/CC-BY-Figur ersetzen (z. B. einen der Tony-Flanagan-Körper, die schon im Spiel sind). Aufwand klein, Risiko weg. |
| **Justins Bewegungen** (`game/justin.js` = `game/justin.glb`, Clips `MM_Idle_0`, `MF_Unarmed_Walk_Fwd_0`, `MM_Attack_01_0`, `MM_Death_Front_01_0`) | Basis (`justin.acts`), `justin.js`, `gedanken.js`, `kapitel3.js`, `weiss.js` | Dieselben Epic-Vorlagen-Animationen (`/Game/Characters/Mannequins/Anims/…`, siehe `unreal/Scripts/export_target.json`). Das Paladin-Modell selbst ist ok (s. u.). | Clips durch Fab-Mocap ersetzen, die schon im Projekt liegen (Motifect Locomotion/Daily Life, Animation Shopee „Dying“) – `justin.js` nutzt Motifect bereits für „knien“. |

**Nicht im Spiel, aber nicht verwenden:** `HAM_FabDownloads/v19_vegetation/stumpf.zip` (Megascans „Broken Stump“) – das Konto hat dafür nur die Stufe **„UEFN – Reference only“** (keine Quelldatei-Rechte). Dasselbe gilt für „Beech Tree Trunk“, „Birch Tree Trunk“, „Nordic Forest Tree Trunk Spruce Large“ (`batches.json`: `sprucetrunk`), „Fallen Tree“, „Mossy Tree Log“, „Mossy Stump“. Fab-EULA: „Personal - Reference Only tier: you may access the Content as a reference asset only“.

### Prüfen (wahrscheinlich ok, Restzweifel)
- **Animal Variety Pack** (`ms/animal_crow|deerdoe|deerstag|fox|pig|wolf`, Modul `leben.js`): Laut Fab-Bibliothek **Fab Standard License (Personal)**, Lizenzgeber **PROTOFACTOR INC** (nicht Epic, wie zuvor in CREDITS stand). Die Fab-Standardlizenz erlaubt ausdrücklich andere Engines. Restzweifel: Listing ist eine Epic-gesponserte „Permanent Collection Unreal Engine Sponsored Content“ aus dem alten Marketplace und nur im UE-Format; Fab-Doku: Migrierte Produkte können die alte „UE Marketplace License“ behalten. Unsere Bibliothek zeigt aber „Standard License“. → Screenshot der Bibliothek/Lizenz archivieren; optional beim Verkäufer bestätigen lassen.
- **Paladin RPG Set** (Polyphoria; Justins Rüstung, `game/justin.js`): Fab Standard (Personal) → ok. Prüfen: Laut `export_target.json` war auch `Polyphoria/Base/…/SK_ma_meta_body_head_01` vorgesehen (MetaHuman-Basis?). In `justin.js` steckt nur `SK_ma_pala_combine_a` (keine Kopf-Materialien); `chars/justin/kopf.glb` enthält nur Haar/Kopfhaut/Bart. MetaHuman-Inhalte wären laut Epic Content License „UE-Only Content“ → sicherstellen, dass kein MetaHuman-Kopf/-Körper exportiert wurde.
- **Asian Canal Environment** (Leartes Studios; `assets/canal/*`, Basis „Kanal“): Fab Standard (Personal) → ok laut Fab-EULA. Nur UE-Format, über UE exportiert (Bearbeitung ist erlaubt).
- **UEFN Manny Zombie Animation Sample Pack** (Teddy Goldstien; Mocap `v15_mocap/x/zombie`): Fab Standard → Bewegungsdaten ok. Ein eventuell mitgeliefertes Epic-Mannequin-Mesh nicht verwenden (wird laut `cast.json` nicht verwendet).
- **Fab „Personal“-Stufe**: Alle Standard-Erwerbe des Kontos sind „Personal“ (Ausnahme: zwei „Professional“, beide nicht im Spiel). Zulässig, wenn zum Erwerbszeitpunkt ≤ 100.000 USD Umsatz in 12 Monaten (inkl. Vorschüsse/Fördergelder). Fab: „There is no need for upgrading from Personal to Professional tier if you cross the revenue threshold after the purchase.“ → Bei Verlag/Förderung **vor** weiteren Käufen neu bewerten.
- **Lizenztexte in der App**: `three.module.js` trägt einen MIT-Kopf, aber `three-mesh-bvh/index.module.js`, die Schriften und die mitkopierten `examples/jsm/libs/*` (u. a. basis, draco, ammo, rhino3dm, opentype …) haben in `app/game/vendor` keine Lizenzdatei. Electron legt `LICENSE` und `LICENSES.chromium.html` selbst in `dist`. → Eine `THIRD_PARTY_NOTICES.txt` + `CREDITS` mit ausliefern (und nur benötigte `libs` kopieren).
- **CREDITS im Spiel**: Es gibt keinen Abspann/Lizenz-Bildschirm mit den Namensnennungen. CC-BY 4.0 verlangt Nennung „in any reasonable manner“ → CREDITS als Datei neben die EXE und/oder ins Menü.

### Namensnennungen
47 CC-BY-Werke, die im Spiel sind, fehlten in `CREDITS.md` und wurden ergänzt (Liste unten mit „ergänzt“). Zusätzlich: Hinweis auf Lizenztext und Bearbeitung (CC-BY verlangt beides), Animal-Variety-Pack-Urheber korrigiert (PROTOFACTOR INC statt Epic), Paladin/Kanal/Mannequin und die Schriften nachgetragen.

Kleinigkeiten ohne Handlungsbedarf: „Dog“ (styloo) steht in der CC-BY-Tabelle, ist auf Fab aber Standard-Lizenz (Überzählige Nennung schadet nicht). „Metal Rose Jewelry Trinket Box“ ist auf Fab Standard, die beiliegende `license.txt` (Sketchfab-Herkunft) sagt CC-BY – Nennung bleibt.

## Lizenzlage (geprüfte Aussagen)
- **Fab Standard License** (fab.com/eula, Zusammenfassung „Last updated: April 6, 2025“): „Use the assets commercially or privately“, „Commercially distribute your Projects with the Fab assets incorporated into it“, „Use the assets with any compatible tools (usage is not limited to Unreal Engine)“, „You are not required to give credit“. Verboten: Weitergabe als Einzeldatei („on a standalone basis“), Endnutzern das Herauslösen erlauben, Kombination mit GPL/LGPL/CC-BY-SA-Inhalten, NoAI-Inhalte für KI-Training. Personal ≤ 100.000 USD Umsatz (12 Monate, zum Erwerbszeitpunkt).
- **Megascans über Fab**: im Konto als Fab Standard (Personal) erworben → jede Engine. Achtung: Die *Epic Content License* sagt für Megascans aus dem alten Quixel-/Bridge-Weg „Unreal Engine plan … may only be used and shared as UE-Only Content“ – betrifft uns nur, falls Megascans **nicht** über Fab geholt wurden (z. B. über Bridge im UE-Projekt `unreal/`). Alle im Spiel gefundenen Megascans sind in der Fab-Bibliothek als „personal“ vorhanden.
- **UE-Only**: Epic Content License: „“UE-Only Content” means Licensed Content that is designated as only permitted for use in conjunction with Unreal Engine…“; MetaHuman-Inhalte sind UE-Only.
- **CC-BY auf Fab**: CC BY 4.0 – Namensnennung (Titel, Urheber, Quelle, Lizenz, Hinweis auf Änderungen). Fab führt auch „CC0 – …“-Titel von plaggy als CC-BY → wie CC-BY behandeln.
- **Sonniss GDC Bundles** (sonniss.com/gameaudiogdc): „royalty free and commercially usable“, „No attribution is required“; nicht als Einzelsounds weitergeben; KI-Training verboten.
- **VSCO 2 CE**: CC0 (laut CREDITS/klang_bau.py) – prüfen nicht nötig.
- **OpenGameArt-Sounds** (`sounds.js`, `sounds_extra.js`): laut `QUELLEN.txt` alle CC0; Stichprobe „low-rumbling“ (Musheran) bestätigt CC0, `scrapes`/`undead-moans` haben CC0-LICENSE. Einzelprüfung aller 23 Seiten offen (prüfen, geringes Risiko).
- **Schriften**: Caveat (OFL 1.1), Cormorant Garamond (OFL 1.1), Special Elite (Apache 2.0) – laut google/fonts METADATA. OFL erlaubt Einbetten/Weitergabe mit Lizenztext; Schriften nicht einzeln verkaufen.
- **Stimmen**: Qwen3-TTS (VoiceDesign/Base/Tokenizer, `qwen-tts`) Apache-2.0, Modelle werden nicht ausgeliefert, Ausgaben ohne Auflagen. Laut `LIZENZ_UND_WAHL.md` keine echte Person geklont (Stimmen aus Textbeschreibung + Seed; Base-Modell klont nur den synthetischen Referenzclip; die eingebauten „CustomVoice“-Sprecher wurden bewusst nicht benutzt). UTMOSv2 (MIT), faster-whisper (MIT) nur Werkzeuge.

## Tabelle
Status: **OK** · **ergänzt** (CC-BY, Nennung fehlte, jetzt in CREDITS) · **OK (genannt)** · **prüfen** · **KRITISCH** · **ungenutzt**.
Lizenz „Std-P“ = Fab Standard License, Stufe Personal.

### Figuren, Bewegungen, Kreaturen
| Asset | Verwendet | Quelle | Lizenz | Status | Empfehlung |
|---|---|---|---|---|---|
| ghost.glb (UE5-Mannequin Quinn + MM-Clips) | Basis, fassaden, innen_kapitel | Unreal-Engine-Vorlage (Epic) | UE-EULA | **KRITISCH** | ersetzen |
| justin.js / justin.glb – Animationen MM_* | Justin (Basis, justin.js u. a.) | Unreal-Engine-Vorlage (Epic) | UE-EULA | **KRITISCH** | durch Fab-Mocap ersetzen |
| justin.js – Mesh Paladin | Justin | Fab „Paladin RPG Set“, Polyphoria | Std-P | prüfen | MetaHuman-Anteile ausschließen |
| chars/* Kinder (C, J, M, OPT) | Zayn, Mike, Lucy, Dina, Cleo, Luke, gezählte | Fab NoEdge: Realistic 3D Child Character, Free Rigged Boy, Free Rigged Girl (332341c5), Download Free Rigged 3D Character | Std-P | OK | – |
| chars/* Kinder (G) | Roxy, Heidi, Graukind, Kleine, Mike | Fab NoEdge „Free Rigged 3D Girl Character …“ (267cc2ba) | CC-BY | **ergänzt** | – |
| chars/* Erwachsene NoEdge (FN, FHQ, MN) | Gesichtsformen/Köpfe | Fab NoEdge Female/Male/High-Quality Female | Std-P | OK | – |
| chars/* Tony Flanagan (yellow, ow3, ow6, ow7, rusw, farmer, doctor, spy, mallcop, cop) | alle Erwachsenen | Fab, Tony Flanagan | CC-BY | OK (genannt) | – |
| Haare NoEdge (HB, HB2, HLONG) | Bärte, Hildes offenes Haar | Fab NoEdge | Std-P | OK | – |
| Locken MotionstudioArts, Augen Leo3DCG, Wimpern kuroru0 | alle Figuren | Fab | CC-BY | OK (genannt) | – |
| Brille (`BRILLE`, `ms/brille`) | Hilde, Voss | Fab „Metal Round Glasses“, Rikokenz | CC-BY | OK (genannt) | – |
| ms/haende, anim/haende_rauchen.json | Ich-Hände, Rauchen | Detective_Hands (Tony Flanagan), Smoking 01 (Klian) | CC-BY | OK (genannt) | – |
| Mocap Motifect (Daily Life, Locomotion, Emotes, Injured) | alle Figuren | Fab, Motifect | Std-P | OK | – |
| Mocap Mocap.in (Acting, Mobility, Movement), Toei Zukun (Standing Idle, Free Motion Set), Animpacks (Look Through Window) | Figuren | Fab | Std-P | OK | – |
| Mocap Animation Shopee (12 Clips) | Figuren | Fab | Std-P | OK | – |
| Mocap Klian Getting Up 01/02 | Aufstehen | Fab | CC-BY | OK (genannt) | – |
| Mocap BTM Zombie Idle, Teddy Goldstien UEFN Manny Zombie | Behaltene/Zombie-Gang | Fab | Std-P | prüfen | nur Bewegungsdaten nutzen |
| nikoff Dead Bodies, DZTFIX Falling & Rolling | nicht in `cast.json` gefunden | Fab | Std-P | OK (ggf. ungenutzt) | – |
| chars/blechmann | Blechmänner | Fab „antiradiation suit – ozk“, sanyaork | CC-BY | OK (genannt) | – |
| ms/wendigo hirschding*, wolf_geschaelt, muskel_*, sehne | Wendigo, Geschälte | Deer Thing (Shedmon), Grimhound (DM-913), Muscle Tissue (clacydarch) | CC-BY | OK (genannt) | – |
| ms/wendigo/schaedel.glb | Wendigo | Megascans „Animal Skull“ | Std-P (+UEFN) | OK | – |
| ms/beobachter | Beobachter | Cute Alien Pet, MissTxxT | CC-BY | OK (genannt) | – |
| ms/hund | Bruno | Dog, styloo | Std-P | OK | (CREDITS nennt ihn zusätzlich als CC-BY – unschädlich) |
| ms/katze | Katzen, Kater | Cat long haired, Sean4297 | CC-BY | OK (genannt) | – |
| cow | Kuh | Cow, styloo | Std-P | OK | – |
| ms/animal_* (6 Tiere) | leben.js | Animal Variety Pack, PROTOFACTOR INC | Std-P | prüfen | Lizenznachweis archivieren |
| rat | Ratten | Black Rat, Nestaeric | CC-BY | **ergänzt** | – |
| bat | Fledermäuse | Bat, matisosanimation | CC-BY | **ergänzt** | – |
| fly | Fliegen | Realistic Fly, Aaron Bravo | CC-BY | **ergänzt** | – |
| spider_cross/little/tarantula | Spinnen | Spiders – characters with animations, Mixall | CC-BY | **ergänzt** | – |
| cobwebs | Spinnweben | Free Pack – Cobwebs, PolyOne Studio | Std-P | OK | – |
| gore/meat | Fleisch | CC0 – Raw Meat 4, plaggy | CC-BY | **ergänzt** | – |
| gore/kidney | Fraßstellen | Human Kidney Anatomy, clacydarch | CC-BY | OK (genannt) | – |
| gore/ribs, spatter, stain1/2; ms/blood_* | Gore, Blut | Megascans (Banquet Lamb Ribs, High Velocity Blood Spatter, Blood Stain ×2) | Std-P | OK | – |
| ms/w_spieluhr | Spieluhr | Metal Rose Jewelry Trinket Box, JordanFry3D | Std-P (Datei: CC-BY) | OK (genannt) | – |

### Gebäude, Straße, Außenwelt
| Asset | Verwendet | Quelle | Lizenz | Status | Empfehlung |
|---|---|---|---|---|---|
| canal/* | Kanal (Basis) | Asian Canal Environment, Leartes Studios | Std-P | prüfen | Lizenznachweis archivieren |
| ms/mansion | Villa | Old European Mansion, Red Kaiser | Std-P | OK | – |
| ms/chapel | Kapelle | Countryside chapel dataset, matousekfoto | CC-BY | **ergänzt** | – |
| ms/madre | Statue | Madre Statue Scan, EFX | Std-P | OK | – |
| ms/cross_concil, cross_field, cross_hang | Kreuze | matousekfoto / BlenderUserSkfb / Krag Studio | Std-P | OK | – |
| ms/grave1, grave2 | Gräber | Megascans Old Gravestone ×2 | Std-P | OK | – |
| ms/grave_coll | Gräber | Grave Stone Collection, Kigha | CC-BY | **ergänzt** | – |
| ms/grave_weathered | Gräber | Weathered Gravestone, aLeanbh | Std-P | OK | – |
| ms/tomb_cc0, ironfence_cc0, mailbox_cc0 | Friedhof, Briefkästen | plaggy | CC-BY | **ergänzt** | – |
| ms/ironfence_ms, stonewall1/2, fencepost | Zäune, Mauern | Megascans | Std-P | OK | – |
| ms/fence_garden | Gartenzäune | Garden Fences (Wood), Koceila HAID | CC-BY | **ergänzt** | – |
| ms/fence_dirty | Holzzäune | Wooden Fence … dirty garden, Gvozdy | Std-P | OK | – |
| ms/busstop1 | Haltestelle | Urban Bus Stop Shelter, AshenCut | CC-BY | **ergänzt** | – |
| ms/busstop2, crt | Haltestelle, Fernseher | Keonix | Std-P | OK | – |
| ms/gas_signs | Tankstelle | Gas Station Signs, commonspence | CC-BY | **ergänzt** | – |
| ms/jerrycan, radio, geschirr, w_blech, w_buch | Kanister, Radio, Geschirr, Dose, Dienstbuch | Guy in a Poncho | Std-P | OK | – |
| ms/shed_old, shed_util | Schuppen | Jimbogies | CC-BY | **ergänzt** | – |
| ms/shed_garden, parkbench | Gartenhaus, Parkbank | KenVeel | CC-BY | **ergänzt** | – |
| ms/barn_horse, barn_old | Scheunen | karaman / North Ember Studios | Std-P | OK | – |
| ms/haybale, wheelbarrow_ms, pallet_ms, pallets_ms, giraffe, cone_ms, barrier_ms | Hof/Straße | Megascans | Std-P (pallets auch UEFN) | OK | – |
| ms/scarecrow | Vogelscheuche | Scarecrow, Glowbox3D | CC-BY | **ergänzt** | – |
| ms/tractor | Traktor | Red Tractor, Chrix | CC-BY | **ergänzt** | – |
| ms/slide, roundabout | Spielplatz | crow | CC-BY | **ergänzt** | – |
| swings | Schaukeln | Old Swings, crow | CC-BY | **ergänzt** | – |
| ms/well | Brunnen | The village well, Abandoned World | Std-P | OK | – |
| ms/tires, toys_old, dumpster | Reifen, Spielzeug, Container | SKRUNDA / Lost Frames / EFX | Std-P | OK | – |
| ms/teddy_scan, teddy_retro | Teddys | Eddie Mauro / matousekfoto | Std-P | OK | – |
| ms/picnic | Picknicktisch | Rustic Wooden Picnic Table, TDR Store | CC-BY | **ergänzt** | – |
| ms/bicycle | Fahrräder | Vintage Bicycle, patrickgoud807 | CC-BY | **ergänzt** | – |
| ms/candles | Kerzen | 4 Candles pack, LOLIPOP | CC-BY | **ergänzt** | – |
| ms/lantern1, lantern2 | Laternen | Old Lantern (Sousinho Games / LetTBLight) | Std-P | OK | – |
| lamp | Straßenlaternen | Street Lamp, Krayton Gaming | CC-BY | **ergänzt** | – |
| ms/car_amsedan, car_burned, vans | Autos, Busse | High Matters / Renafox / Vehicle Variety Pack (Switchboard Studios) | Std-P | OK | – |
| ms/car_dutch, car_junk, car_rusty | Autowracks | Cygnos / PLEXUS GAME ASSETS / OlegVerenko | CC-BY | **ergänzt** | – |
| ms/poles_wood, roadsigns | Masten, Schilder | Eleanie / Awlok.dev | CC-BY | **ergänzt** | – |
| ms/curbs, hydrant, parksign, pole_old, mailbox2, asphalt_debris | Straße | Megascans (Mailbox auch UEFN) | Std-P | OK | – |
| Oberflächen ms/wallpaper_*, floor_*, wall_*, grime, asphalt_road2, road_asphalt, wet_asphalt, pavement, sidewalk_tiles, lawn1, gravel, bark, planks_painted, facade_*, garagedoor, corrugated, rust_sheet | Häuser, Straßen | Megascans | Std-P | OK | – |
| bench, boulder, manhole, deadshrubs, forestfloor, leaves | ältere Welt | Megascans (Wooden Bench, Mossy Forest Boulder, Metal Manhole Cover, Dead Shrubs, Forest Floor, Dry Fallen Leaves) | Std-P | OK | – |
| ms/deadtree1, deadtree3, elderberry, raspberry, spindle, wildgrass1/2 | Vegetation | Megascans | Std-P | OK | – |
| ms/w_* Wald (pineb, moretrees, bushes2, oldpine, stumprot, mossytrunk, mossrocks, ivytrunk, leftleaves, pinetrunk, branches, leaves, mosspatch, mossstick, clover, grasspack, grassgame, ivyplane, mushefx, birke) | waldleben, gruen, strasse, zimmer7, kino | Fab, versch. Urheber | CC-BY | OK (genannt) | – |

### Innenräume und Requisiten
| Asset | Verwendet | Quelle | Lizenz | Status | Empfehlung |
|---|---|---|---|---|---|
| ms/door1/2, window, frame_*, shelf, trashbag, trashcan, metaltable, floorlamp | Häuser | Megascans | Std-P | OK | – |
| ms/chair, ue/drahtschneider | Stühle, Drahtschneider | Max3d | Std-P | OK | – |
| ms/crib | Babybett | Baby Crib, Fab Mancer | Std-P | OK | – |
| ms/wallclock | Uhr | Vintage wall Clock, Sousinho Games | Std-P | OK | – |
| ms/doll | Puppe | Cursed Doll no.02, mami@horse-water | CC-BY | **ergänzt** | – |
| ms/hospbed | Eisenbetten | Old hospital bed, tris | CC-BY | **ergänzt** | – |
| ms/sofa | Sofas | Vintage Sofa, Zillious | CC-BY | **ergänzt** | – |
| ms/wardrobe | Schränke | Wardrobe, Shedmon | CC-BY | **ergänzt** | – |
| ms/dresser | Kommoden | Old Dresser 01, ClearMeshStudio | CC-BY | **ergänzt** | – |
| ms/mirror | Spiegel | Worn Victorian Mirror, MOJackal | CC-BY | **ergänzt** | – |
| ms/curtain_retro, curtain_sheer | Vorhänge | Farkas Interactive / Barnus Model's | CC-BY | **ergänzt** | – |
| ms/w_* Requisiten (barrel, lighter, kamera, teller, tasse, becher, brot, urne, schwert, besteck, papierlaterne, jacke, funk, kette) | diverse | Fab, versch. Urheber | CC-BY | OK (genannt) | – |
| ms/w_telefon | Telefon | Military Radio (SM_Telephone), DTry | Std-P | OK | – |
| ms/w_thermos, muetze, brille2 | Thermos, Mütze | Louey / Toshi Timo / Mohit Akundi | Std-P | OK | – |
| ms/lbook, album (Leather Book), schirm, beutel1–3; Notradio, Knöpfe, Nest, Decke, Vintage desk lamp | diverse | laut CREDITS | CC-BY | OK (genannt) | – |
| Tischlampe rostig, Speckteller, Münze | Zimmer 7, Tisch | Sousinho Games / LC-scanning / Megascans | Std-P | OK | – |
| ms/kiffen/* (inkl. `papier` aus dem Papes-Modell) | Kiffer-Szene | Sketchfab, versch. Urheber | CC-BY | OK (genannt) | Markenaufdruck bleibt entfernt |
| ue/lampe1, lampe2, lampe3 | Taschenlampen, Öllampe | crow / Studio Nychta / Houdini | CC-BY | **ergänzt** | – |
| ue/brechstange, schluesselteil, sicherung, totem | Werkzeuge, Geheimnisse | plaggy / Alex Krush / Zillious / Get Dead Entertainment | CC-BY | **ergänzt** | – |
| ue/batterie | Batterien | Realistic Battery, Hidden Territory | Std-P | OK | – |
| ue/leiter, ue/wrack | Leiter, Wrack-Teil | Megascans Metal Ladder, Rusty Metal Gear | Std-P | OK | – |
| fotos/*, polaroid/* | Ermittlungswand, Polaroids | im Spiel gerenderte Bilder | eigene Renders (enthalten die obigen Assets) | OK | – |

### Ton, Stimmen, Schriften, Bibliotheken
| Asset | Verwendet | Quelle | Lizenz | Status | Empfehlung |
|---|---|---|---|---|---|
| game/audio `mu_*`, `cue_*`, `pn_*`, `st_*`, `kb_*`, `mb_*`, Teile `sc_*` | Musik, Stinger | VSCO 2 CE | CC0 | OK (genannt) | – |
| game/audio `amb_*`, `fx_*`, `pz_*`, `wd_*`, `sc_*` | Klangbetten, Geräusche, Wendigo | Sonniss GDC 2017–2019 (Liste in `HAM_Audio/quellen.py`) | Sonniss-Lizenz (lizenzfrei, keine Nennung) | OK (genannt) | Lizenz-PDFs der Bundles archivieren |
| sounds.js, sounds_extra.js | Grundgeräusche | OpenGameArt (23 Seiten, `QUELLEN.txt`) | CC0 | OK / prüfen (Stichprobe ok) | – |
| assets/stimmen/*.opus | Sprachausgabe | Qwen3-TTS (lokal erzeugt) | Apache-2.0 (Modell), Ausgabe frei | OK | finale Stimmen einmal auf Ähnlichkeit zu Prominenten anhören |
| app/vendor/fonts | UI, Notizen | Caveat, Cormorant Garamond, Special Elite | OFL 1.1 / OFL 1.1 / Apache 2.0 | **ergänzt** | Lizenztexte mitliefern |
| three.js 0.170.0 (+ examples/jsm/libs) | Engine | npm | MIT (libs teils Apache/zlib) | prüfen | LICENSE mitliefern, ungenutzte libs weglassen |
| three-mesh-bvh 0.8.3 | Kollision | npm | MIT | prüfen | LICENSE mitliefern |
| Electron 44.4.5 | App | npm | MIT + Chromium-Lizenzen | OK | `LICENSE`, `LICENSES.chromium.html` liegen bereits in `dist` |

## Im Spiel nicht verwendet (nichts gelöscht)
In `game/assets`, aber ohne Verweis im Code (Stand der Quellen `app/mods`):
- `ms/chapel_flooded` (Hungarian flooded chapel, Aartee, CC-BY) · `ms/fence_white` (White Wood Fence, EV1LSM1RK, CC-BY) · `ms/gas_retro` (Retro Gas Station, Sherif Shawky, Std-P) · `ms/streetlamp_old` (Old street lamp, BlenderViz, Std-P) · `ms/teddy_ripped` (Ripped Apart Teddy Bear, Brigyon, CC-BY) · `ms/tomb_wndy` (Old Weathered Tombstone, Wndy, CC-BY) · `ms/wheelbarrow_old` (Old Metal Wheelbarrow, Std-P) · `ue/lichtstein` (Smooth sea pebble, HQ3DMOD, CC-BY) · `ue/chars/*` (alter_mann = „Old man“ 3dchmoshnik CC-BY, erwachsener = Office Worker 4 Tony Flanagan CC-BY, kind_junge/kind_maedchen NoEdge) · `chars/lorenz` (Figur gestrichen) · `chars/cast_liste.json` · `gore/kidney_kidneyc.jpg`.
- Werden sie wieder eingebaut, CC-BY-Nennung in CREDITS ergänzen. Ungenutzte Dateien werden sonst mit ausgeliefert (Release-Größe).
- Nur heruntergeladen (nicht in `game/assets`): u. a. v17 False Bear/Insectoid/Monster PBR, v18 Figuren (Camilia, Business man, Pocolov Hair 06 = CC-BY, …), v19 Megascans-Vegetation (inkl. „Broken Stump“ = nur UEFN-Reference), Payphone (EFX, CC-BY), Generic Sedan (MMCWorks), Megaplants, Zombie-Packs, City Sample, Game Animation Sample (beide Epic).

## Offene Fragen
1. Mannequin/Justin-Animationen ersetzen oder rechtlich bestätigen lassen? (Empfehlung: ersetzen.)
2. Wurden irgendwann Megascans über Quixel Bridge im UE-Projekt geholt und dann ins Spiel exportiert (z. B. `ue/leiter`, `ue/wrack` – beide auch in der Fab-Bibliothek als „personal“, also ok)? Falls weitere: Fab-Erwerb nachweisen.
3. Animal Variety Pack: Lizenznachweis (Fab-Bibliothek „Standard License“) reicht dir, oder Verkäufer anschreiben?
4. Wo sollen die Namensnennungen im Release erscheinen (Datei neben der EXE, Menüpunkt „Mitwirkende“)?

- Nutzer (01.10.2026): Megascans wurden nie über Quixel Bridge geholt, nur über Fab.
