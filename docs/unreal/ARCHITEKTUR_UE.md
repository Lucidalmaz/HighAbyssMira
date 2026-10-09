# ARCHITEKTUR_UE - Abbildung Three.js-Spiel nach Unreal Engine 5

Stand 09.10.2026. Grundlage: statische Analyse der 91 Module in `app/mods/` (ca. 5,9 MB Quelltext, Basis `_base_source_index.html` 743 KB) und die Exporte in `docs/unreal/data/` (erzeugt mit `node app/tools/ue_export/export.js`). Die Unreal-Fassung wird **nicht jetzt gebaut**, dies ist die Vorbereitung. Alle Zahlen sind Schätzungen mit Unsicherheit (siehe §11).

Leitplanken (Nutzerregeln): Premium-Anspruch · MetaHuman für Erwachsene · nur hochauflösende Fab/Megascans-Assets, **nie GeometryScript oder Primitiv-Objekte** · flüssige FPS und schnelles Laden · nichts kaufen ohne Rückfrage.

---

## 1. Prinzip: Daten aus dem Export, Verhalten neu

Das Spiel ist zu zwei Dritteln **Inhalt als Code** (Dialogzeilen, Aufgabentexte, Items, Koordinaten stehen mitten in JS-Funktionen) und zu einem Drittel Mechanik. Der Export holt das erste Drittel automatisch heraus; die Mechanik wird in Unreal neu geschrieben, nicht übersetzt.

| Exportiert (docs/unreal/data) | Umfang (Stand Export) | Ziel in Unreal |
|---|---|---|
| `dialoge.json` / `.csv` | 1.665 Zeilen (870 mit Sprecher, 795 Erzählung/Gedanken/Untertitel), 98 Sprecherlabels, 51 Quelldateien, ca. 87.000 Zeichen | `DT_Dialog` (DataTable) + Voice-Zuordnung |
| `aufgaben.json` | 217 Aufgabenzeilen (setC3, k5_task, k6_obj, setC2Objective, MAIN, C2_MAIN, sideStart/Done) + 33 Nebenaufgaben | `DT_Tasks`, Quest-Subsystem |
| `gedanken.json` | 325 (123 `gedanke()`-Aufrufe, 113 Tabellenzeilen inkl. Atempausen A-01…, 48 Hinweis-Fäden, 22 Ziel-Warum) | `DT_Thoughts` |
| `items.json` | 79 Gegenstände (71 mit Name/Beschreibung, 68 mit Vergabestelle, 14 dynamische Fälle unter `ungeklaert`) | `DT_Items` |
| `raetsel.json` | 77 Rätsel/Hürden aus den QA-Dokumenten Kap. 1-6 + vollständige Markdown-Abschnitte | `DT_Puzzles` (Designgrundlage) |
| `orte.json` | 30 Orts-Konstanten, 7 Häuser, 14 Echo-Orte, 4 Kartenblätter, Kapitel-Ursprünge C2/C3/C4 | `DT_Locations`, Level-Layout |
| `figuren.json` | 35 Figurenmodelle, 29 Stimmen-Besetzungen, 85 Sprecherlabels → Stimme, Echo-Besetzung | `DT_Characters`, MetaHuman-Plan |
| `kapitel.json` | 91 Module mit Kopfkommentar, Beat-Listen K5 (22) und K6 (13), Story-Gliederung (678 Überschriften) | Level-/Quest-Gerüst |
| `audio.json` | 352 Audiodateien (25 MB) in Gruppen amb/fx/kb/mu/pk/pn/pz/sc/st/ui/wd/zb + Klang-Inventar | MetaSounds-Plan, Import |
| `credits.json`, `assets.json`, `asset_klassifikation.json` | 141 Credits-Zeilen, 26 Asset-Ordner (6,3 GB), 161 klassifizierte Lizenzeinträge | `ASSET_PLAN.md` / `ASSET_LISTE.md` |

Grenzen des Exports (ehrlich): Zeilen ohne Sprecher sind Erzählung **oder** nicht aufgelöste Wrapper (z. B. Zeilen, in denen Luke spricht, aber der Sprecher in einer lokalen Variable steht). Kapitelzuordnung ist nur eine Modul-Vermutung (`kapitelModul`; 499 Zeilen aus der Basisdatei sind pauschal "Kap. 1/2"). Dynamische Texte (Template-Strings) stehen mit `{…}` als Platzhalter. Alle Positionen sind Spielkoordinaten (Meter), keine UE-Koordinaten.

---

## 2. Gameplay Framework

| Unreal-Klasse | Aufgabe | Herkunft (Module) |
|---|---|---|
| `AHamGameMode` / `UHamGameInstance` | Kapitelablauf (`KAP_BEGIN/KAP_END`, Kapitel 1-6, 7 gesperrt), Weiterspielen, Ladereihenfolge | `kapitel.js`, `uebergang.js`, `teststand.js` |
| `AHamPlayerCharacter` (C++) | Ich-Perspektive, Gehen/Schleichen/Rennen/Kriechen, Augen-zu (Taste Q), Atem/Puls, Hände (Ich-Arme als eigene Mesh-Ebene), Kamera-Override für Kino | Basis, `augenzu.js`, `griff.js`, `blick.js`, `kamera.js` |
| `UHamInteractionComponent` | Strahltest, Hervorhebung, Prompt ("Taste E: …"), Halten-Interaktionen, Hitbox-Aufgaben (`interact(...)`) | `hervorhebung.js`, `bedienung.js`, Basis |
| `UHamQuestSubsystem` (GameInstance-Subsystem) | Hauptaufgabe je Kapitel, Nebenaufgaben (Zustände hidden/active/done), "Neues Ziel"-Einblendung, Hinweis-Fäden nach Stillstand | `ziele.js`, `gedanken.js`, `sammeln.js`, Basis (`story.side`, `sideStart/sideDone`) |
| `UHamInventoryComponent` | Items (79), Beutel in 3 Stufen, Kombinieren, Untersuchen, Fibel-Reiter, Lore | `beutel.js`, `sammeln.js`, `ausruestung.js`, Basis `ITEMS`/`modItem`/`addItem` |
| `UHamSaveSubsystem` + `UHamSaveGame` | Kapitelstand, Flags (`saveFlag`), Checkpoints SP5-1…SP6-x, Tod/Wiederkehr | `kapitel.js` (`MOD_SAVE`), `tod.js` |
| `UHamDialogSubsystem` | Zeilenwiedergabe (Untertitel, Dauer, Sprecher-Etikett), Sprachdatei starten, Funk/Telefon-Filter, Lip-Sync-Auslöser | `stimmen.js`, `say()`/`subtitle()` |
| `UHamThoughtDirector` | Lukes Gedanken (Mindestabstand 9 s, nur einmal, nie in Dialogen), Atempausen nach Schreck | `gedanken.js`, `spannung.js` |
| `UHamFearDirector` ("Regie") | Schreck-Planer, Stille/Ruhe/Lacher-Entscheidung, Auftritt/Abgang, Natur-Schrecks | `spannung.js`, `schrecken.js`, `naturschreck.js`, `auftritt.js` |
| `AHamFlashlight` (Komponente am Spieler) | Lichtkegel, Akku (`FLASH.charge`), Batterien, Stufen (`FLASH_TIERS`) | Basis, `ausruestung.js` |
| `AHamEchoDirector` | Nachbilder (Echo): Ort, Figuren, Zeilen, Look | `geister.js`, `ECHO_CAST`, `figuren.js` |

**Blueprint vs. C++**
- C++: Spieler-Charakter und Bewegung, Interaktionsfindung, Quest-/Inventar-/Save-Subsysteme, Datenstructs, Dialog-/Gedankenregie, Gegner-Wahrnehmung (Performance und Testbarkeit).
- Blueprint: levelspezifische Rätsel (Tastenfeld, Funkkasten, Ordnungstafel …) als Aktor-Blueprints mit Events an die Subsysteme; UMG-Widgets; Sequencer-Auslöser; Feinabstimmung (Zeiten, Lautstärken).
- Faustregel: Alles, was von mehr als einem Kapitel benutzt wird → C++. Alles, was genau ein Rätsel steuert → Blueprint.

---

## 3. Welt, Koordinaten, Level-Streaming

**Das Three.js-Spiel hat eine einzige Szene mit weit voneinander entfernten Kapitel-Arenen** (Ursprünge aus dem Export): Dorf (um 0/0), Amt Ebene −2 `C2 = (600, −2600)`, "Das Weiße" `C3 = (−600, −2600)`, Kapitel 4 `C4 = (0, 2600)`, Villa um (−900, 900), Wald (−64…134, 96…292), Kirchberg um (−1440, 1400). Nahtlose Übergänge (Kellerwand Kap. 1 → Amt, `SEAMLESS`) werden gelaufen, nicht per Karte.

**UE-Umsetzung**
- **Eine persistente Level (`L_HAM_Persistent`) mit Sublevels je Region**, per Level-Streaming-Volumen geladen: `L_Dorf_Aussen`, `L_Nr7_Innen`, `L_Keller`, `L_Amt_E2`, `L_Weiss`, `L_Villa`, `L_Wald`, `L_Tiefwald`, `L_Kirchberg`, `L_Kanal`. Die Region-Ursprünge aus dem Export werden **nicht** übernommen; jede Region bekommt ihr eigenes Level-Ursprung. Übergänge (Keller → Amt) per Streaming plus Portalraum (Gang) oder Sequencer-Überblendung.
- **World Partition nur für das Außengebiet** (Dorf + Wald + Kirchberg: zusammenhängend ca. 340 x 170 m Dorf und 200 x 200 m Wald), falls PCG/Foliage große Streams braucht. Innenräume und Kapitelarenen als normale Sublevel (kleiner, deterministisch ladbar, einfach zu debuggen). Entscheidung in Phase 0 per Test; World Partition ist für diese Spielgröße **kein Muss**.
- **Koordinatenumrechnung** Three.js (x rechts, y oben, z zum Betrachter; Meter, rechtshändig) → UE (X vor, Y rechts, Z oben; Zentimeter, linkshändig): `UE.X = −z * 100`, `UE.Y = x * 100`, `UE.Z = y * 100`; Gierwinkel: `UE.Yaw = degrees(−yaw_three)` (zu prüfen am ersten Haus; Vorzeichen mit einem Testobjekt eichen). `DT_Locations` hält die Rohwerte; ein Editor-Skript platziert Marker (`TargetPoint`) daraus.
- **Kapitelstruktur:** Kapitel 1 "Keller bleibt zu", 2 "Das achte Kind" (Amt), 3 "Ich komme" (Straße/Weiß), 4 "Sehen, Bergen, Schweigen" (Villa), 5 "Iss auf, Bruder", 6 Wendigo; 7 gesperrt ("Fortsetzung folgt"). Beats in K5 (22) und K6 (13) werden zu Quest-Zuständen (`StateTree` oder Enum + DataTable), nicht zu Levelsequenzen.

## 4. Datenschicht (Data Tables)

C++-Structs (alle `FTableRowBase`): `FHamDialogRow`, `FHamTaskRow`, `FHamThoughtRow`, `FHamItemRow`, `FHamLocationRow`, `FHamPuzzleRow`, `FHamCharacterRow`. Importskript: `app/tools/ue_export/ue_import_datatables.py` (Entwurf). Regeln:
- Zeilenschlüssel = `Name` aus dem Export (`DLG_kapitel1_0013`, `ITEM_key`, `TASK_…`). Schlüssel sind **stabil nach Datei+Zeilenfolge**, ändern sich also bei Textänderungen im JS: nach dem Umzug nach Unreal ist die DataTable die Wahrheit, der Export ist ein einmaliger Start.
- Texte als `FText` in StringTables (Lokalisierung später), nicht als `FString`.
- Items: eigene `UHamItemDefinition` (PrimaryDataAsset) pro Item mit Mesh/Icon/Untersuchen-Modell; die DataTable liefert nur Name/Beschreibung/Schlüssel.
- Rätsel: `raetsel.json` ist **Designdokument**, kein Laufzeitformat. Jedes Rätsel wird ein Aktor/Blueprint; Lösungen und Hinweisstufen kommen aus den Spalten.

## 5. Rendering: Nanite, Lumen, Virtual Shadow Maps

| Thema | Entscheidung | Warum / Vorsicht |
|---|---|---|
| Nanite | Für alle statischen Scans (Megascans, Gebäudekits, Felsen, Möbel) an; **nicht** für Skinned Meshes (Figuren), Foliage nur mit Nanite-Foliage-Assets (Fab, UE-nativ) | Web-Fassungen sind Low-Poly und werden ersetzt |
| Lumen | Standard für GI/Reflexionen; Innenräume mit eigenen Post-Process-Volumes; **Software-Lumen als Mindeststandard**, Hardware-Lumen optional | Taschenlampen-Spiel: dunkle Räume zeigen Lumen-Rauschen sofort; Emissive/Lichtkegel früh testen |
| Virtual Shadow Maps | An; Taschenlampe, Laternen (Kap. 3 "Laternen löschen"), Kerzen: viele bewegliche Lichter → Kosten pro Licht begrenzen (Light Culling wie `PERF_CULL` im Original) | Das Original kappt aktive Lichter; in UE: Attenuation-Radius klein, "Cast Shadows" nur für Lampe, Feuer, Schlüssellichter |
| Auflösung/Upscaling | TSR + DLSS/FSR/XeSS-Plugins, dynamische Auflösung | "flüssige FPS" ist Nutzerregel: Zielwert und Referenz-GPU in Phase 0 festlegen (Vorschlag: 60 fps auf der Hardware des Nutzers in 1440p mit Upscaling) |
| Streaming-Texturen | Virtual Textures für große Flächen (Asphalt, Putz), Streaming-Pool bewusst setzen | VRAM war schon im Original das Problem (siehe Memory "HAM performance"; KTX2/VRAM-Fix) |
| Look | Dunkle Nacht, nasse Oberflächen (Dauerregen), Film-Korn, Vignette, Blendung: Post-Process-Material, keine selbstgezeichneten Texturen | `visual_identity.md`, `regen.js`, `post.js`, `grafik.js` |

## 6. Niagara (Feuer, Nebel, Regen, …)

| Original | Niagara-System |
|---|---|
| `feuer.js` (Ölfass, Peter brennt, Brand Nr. 5, Rauch) | `NS_Fire_Barrel`, `NS_Fire_Person`, `NS_Smoke_Dense`, Fluid-Smoke optional (teuer); Hitzeflimmern per Post-Process |
| `regen.js` (Dauerregen, überdacht/innen/Rinne) | `NS_Rain_Player` (an den Spieler gebunden), Regen-Decals/Pfützen als Material (Wetness), `NS_Rain_Drips`; Fenster-Tropfen als Material |
| `umwelt.js`, `wald.js`, `waldleben.js` (Laub, Staub, Pollen, Nebel) | `NS_Leaves`, `NS_Dust_Motes`, Volumetric Fog + `NS_Mist_Ground` |
| `kino.js`/`weiss.js` (UFO-Strahl, Weißes) | Strahl: Niagara + Volumetric Cloud/Beam-Material; Weiß: Post-Process + Nebelvolumen |
| Blut/Schmutz/Kreide/Spuren (Decals) | DBuffer-Decals aus Fab/Megascans-Decals (nicht selbstgemalt) |
| Funken, Zigarette/Joint, Kerzen, Taschenlampen-Staub | kleine Niagara-Systeme, Pooling |

## 7. Sequencer (Kino-Szenen)

`kino.js` (253 KB, "Kinosequenzen nach Fassung 3", u. a. UFO/Stromausfall, Hilde im Nachthemd, Kuh-Sturz, Runde drei) ist das größte Modul. Jede Sequenz = **Level Sequence** (`LS_K01_UFO`, …) mit Kamera-Rig (CineCamera, Kamera-Override des Spielers `setCamOverride`), MetaHuman-Animation (Control Rig/Mocap), Audio-Track (Stimmen + Musik-Stinger) und Event-Track (Rückgabe der Kontrolle). Zeilen aus `dialoge.json` (Eintrag `funktion` zeigt, in welcher Sequenzfunktion sie stehen) werden als Subtitle-Track aufgebaut. Geschätzt **25-30 Sequenzen** (genauer zählen: `grep "kino_"` im Phase-0-Tag).

## 8. Audio (MetaSounds)

- 352 Dateien: `amb_*` (27 Klangbetten), `fx_*` (154 Einzelgeräusche), `kb_*` (23 Instrumentenbank), `mu_*` (16 Musik), `pk_/pn_` (Klavier), `pz_*` (30 Peter/Atem), `sc_*` (Schreck), `st_*` (Stinger), `ui_*`, `wd_*` (34 Wendigo), `zb_*` (Zombie). Alle OGG; für Unreal vorab nach WAV 48 kHz wandeln (sicher) oder Import testen.
- MetaSounds-Bausteine: `MS_Ambience_Bed` (Schleifen + zufällige Einzelereignisse), `MS_Footsteps` (Oberflächen per Physical Material), `MS_Heartbeat_Breath` (Puls/Atem-Parameter aus Stress), `MS_Music_Layers` (Schichten aus `mu_*`). Sound-Klassen/Concurrency für Dialog-Ducking.
- Raumklang (`raumklang.js`, `klang.js` Betten je Ort): Audio-Volumes + Reverb-Presets je Raum, Attenuation mit Okklusion; Telefon/Funk: Quartz-/MetaSound-Bandpass 300-3400 Hz (wie im Original).
- Stimmen: bisher synthetisch (Qwen3-TTS), siehe `ASSET_PLAN.md` §6 (Lip-Sync, Entscheidung TTS vs. Sprecher).

## 9. Einzelsysteme (Abbildung)

| System | Original | Unreal-Umsetzung |
|---|---|---|
| **Quest/Ziele** | `MAIN`, `setC3(...)`, `story.side`, Faden nach 150 s Stillstand (`GEDANKEN.stuck`), Ziel-"Warum" | `UHamQuestSubsystem`; Task-Zeilen aus `DT_Tasks`; Timer-Komponente für Stillstand → `DT_Thoughts` (Art `faden`) |
| **Items/Inventar** | `ITEMS`, `modItem`, `addItem`, `story.items`, Beutel 3 Stufen, "Fibel" mit Reitern | `UHamInventoryComponent`, `UHamItemDefinition`; Fibel/Karte/Album als UMG-Widgets; Karte aus Bleistift-Look → Render-Target aus Weltdaten (`DT_Locations.mapSheet`) |
| **Save** | `MOD_SAVE`, `saveFlag`, `saveGame(n)`, Checkpoints `todCheckpoint` | `USaveGame` + Subsystem; Flags als `GameplayTag`-Container; Checkpoints = Spieler-Transform + Kapitel-Beat + Items |
| **QTE** | `qte.js`: kleine, im Bild verankerte Ereignisse (R-10) | `UHamQteComponent` + Widget am Weltpunkt; Eingaben über Enhanced Input (Hold/Mash/Timing) |
| **Verstecken** | `verstecke.js`, Kap. 1 Versteck vor dem Lichtkegel, "erwischt = gehoben + fallen gelassen, kein Tod" | `AHamHideSpot` (Volumen + Einsteige-Animation + Sichtlinien-Test); Gegner-Wahrnehmung mit `AIPerception` (Sicht, Lichtkegel als eigener Sinn) |
| **Taschenlampe/Akku** | `FLASH`, `FLASH_TIERS`, Batterien wechseln [R] | Spot-Light am Spieler (IES-Profil), Akku als Float im Spieler, Flackern als Curve; Lichtkegel-Gegner prüfen Lampe als Sinn |
| **Whiskey (Rabe, Begleiter)** | `whiskey.js` (90 KB), `tausch.js` (Glänzendes tauschen), Klau-Mechanik (`WHISKEY_NIE`), Nachahmen von Stimmen | `AHamWhiskey` (Pawn), **State Tree** (Folgen, Sitzen auf Schulter/Ast, Fliegen, Tauschen, Klauen, Warnen, Krähen); Skelett aus Protofactor-Animal-Pack; Stimmenimitat über Dialog-Subsystem |
| **Echo/Geister-Rückblicke** | `addEcho(...)` mit Figuren `E_()`, Zeilen, Titel "Nachbild · …", `geister.js` (einheitlicher Look, Regie), 14 Echo-Orte | `AHamEcho` (Trigger → Nachbild-Material (Fresnel/Transluzenz + Flimmern), Figuren-Spawns, Sequenz-Light-Boost +22 %, Dialogzeilen aus `DT_Dialog.Echo`) |
| **Gegner** | `hungrige.js` (Gestaltwandler), `kreaturen.js`, `spinnen.js`, `beobachter.js`, Peter-Zombie (`feuer.js`), Wolf, "Gezählte", "Läufer" | Je Gegner: Behavior Tree/StateTree + AIPerception + eigene Anim-BPs; Hunter-Spannungs-Kurve in `UHamFearDirector` |
| **Menü/Optionen** | `menue.js` (Bühne), `leistung.js` | Hauptmenü als Level mit Sequencer; Optionen: Grafik-Scalability, Untertitel, Tasten (Common UI) |

## 10. Mapping aller Modulgruppen (Kurzliste)

| Gruppe (Module) | Unreal |
|---|---|
| Kapitel-Hauptwege: `kapitel1`, `kapitel3`, `kapitel5`, `kapitel6`, `amt`, `villa`, `anwesen`, `weiss`, `lucy3` | Quest-Beats + Level-Blueprints je Kapitel |
| Nebenaufgaben: `neben3-6`, `albers`, `post`, `nr4`, `kiffen`, `katzen`, `zayn`, `cleo`, `justin` | Quest-Dataassets + eigene Aktor-BPs |
| Welt/Außenraum: `strasse`, `fassaden`, `gruen`, `wald`, `tiefwald`, `bewuchs`, `waldleben`, `kirchberg`, `ausbau_nord`, `ausbau_ost_west` | Levelbau mit Megascans/Fab-Kits, PCG für Wald |
| Innenräume: `innen_ort`, `innen_kapitel`, `zimmer7`, `bewohnt`, `moebel`, `fotos`, `ritzschrift` | Levelbau, Detail-Decals aus Scan-Sets |
| Figuren/KI: `figuren`, `geister`, `lwo`, `kreaturen`, `spinnen`, `beobachter`, `hungrige`, `schrecken`, `spannung` | MetaHumans, Anim-BPs, KI |
| Spielersystem: `beutel`, `sammeln`, `album`, `kamera`, `karte`, `ziele`, `gedanken`, `qte`, `verstecke`, `tod`, `augenzu`, `griff`, `blick`, `hervorhebung`, `bedienung`, `ausruestung` | C++-Subsysteme + UMG |
| Kamera/Kino/Look: `kino`, `traum`, `uebergang`, `post`, `grafik`, `regen`, `umwelt`, `laternen`, `oberflaeche` | Sequencer, Post-Process, Niagara |
| Audio: `klang`, `raumklang`, `stimmen`, `sounds*` | MetaSounds, Dialog-Subsystem |
| Nur Original-Technik, in Unreal **entfällt**: `leistung`, `teststand`, `fibeltour`, `menue` (Teile), `entdecker`, Texturgeneratoren (`*_cnv`, `canvasTex`) | ersetzt durch Engine-Features bzw. Scan-Texturen |

## 11. Aufwandsschätzung je System (Personentage)

Annahme: eine erfahrene Person arbeitet mit Unreal 5.x (C++ und Blueprint) und nutzt KI für Code- und Datenarbeit. Spannen: untere Zahl = glatter Verlauf, obere = übliche Reibung. Art-Posten sind abhängig von Auswahl und Kauf der Fab-Kits (nicht entschieden).

| # | System | Tage |
|---|---|---|
| 1 | Projekt-Setup, C++-Modul, Plugins, Build/Versionskontrolle | 3-5 |
| 2 | Datenschicht (Structs, DataTables, Import, StringTables) | 4-6 |
| 3 | Spieler-Charakter (Ich-Perspektive, Arme, Bewegung, Input, Gamepad) | 8-12 |
| 4 | Interaktionssystem | 4-6 |
| 5 | Quest/Aufgaben/Ziele/Fäden/Gedankenregie | 8-12 |
| 6 | Items, Inventar, Beutel (3 Stufen), Kombinieren, Sammelreihen | 12-18 |
| 7 | UI gesamt (HUD, Fibel, Karte, Album, Menüs, Optionen) | 20-30 |
| 8 | Save, Checkpoints, Tod/Wiederkehr | 6-9 |
| 9 | Dialog/Untertitel/Stimmenwiedergabe/Funkfilter | 6-9 |
| 10 | Taschenlampe/Akku/Batterien | 3-5 |
| 11 | Verstecken + Lichtkegel-Gegner | 6-9 |
| 12 | QTE | 3-4 |
| 13 | Whiskey (Begleiter-KI, Tausch, Klau, Imitat) | 12-18 |
| 14 | Echo/Nachbilder (14+ Szenen, Look, Regie) | 10-15 |
| 15 | Gegner-KI + Schreckregie (Peter, Hungriger, Wolf, Beobachter, Spinnen, Gezählte, Läufer) | 25-40 |
| 16 | Rätsel/Hürden umsetzen (77 dokumentierte) | 35-55 |
| 17 | Sequencer-Kinosequenzen (25-30) | 30-45 |
| 18 | Weltaufbau Außenraum (Dorf, Straße, Häuser außen, Wald, Kirchberg, Schrebergärten, Hof) | 35-55 |
| 19 | Innenräume (Nr. 7, Nr. 1, Nr. 4, Keller, Villa, Amt Ebene −2, Weißes, Kanal) | 45-70 |
| 20 | Wald/Tiefwald/Foliage/PCG | 12-20 |
| 21 | Licht, Lumen/VSM-Tuning, Post-Process, Wetter | 12-18 |
| 22 | Niagara-VFX | 12-18 |
| 23 | Level-Streaming, Ladeübergänge (Kap. 1 → 2 nahtlos) | 8-12 |
| 24 | Audio (MetaSounds, Ambiences, Musikregie, Import 352 Dateien) | 15-22 |
| 25 | MetaHumans Erwachsene (ca. 18 Figuren) | 25-40 |
| 26 | Kinderfiguren (8-10; Lösung offen, siehe ASSET_PLAN §5) | 15-30 |
| 27 | Animation: Locomotion, Retargeting, Gesten, Lip-Sync/Gesichtsanimation | 20-30 |
| 28 | Kreaturen (Wendigo/Hirschding, Wolf, Beobachter, Spinnen, Zombie, Rabe) | 20-30 |
| 29 | Performance, Optimierung, Packaging, Grafikoptionen | 15-25 |
| 30 | QA, Playtests, Bugfixing | 25-40 |
| | **Summe** | **ca. 454-708** |

**Realistische Gesamtschätzung:** Planwert **ca. 600 Personentage** (Spanne 450-710). Das sind rund 28-30 Personenmonate: eine Person Vollzeit **ca. 2-2,5 Jahre**; ein Team aus 3 Personen (Technik, Welt/Art, Charakter/Animation) **ca. 10-12 Monate**. Der Planwert enthält einen Puffer für Fab-Auswahl und Integrationsfehler, aber **keine** Wartezeiten (Käufe, Downloads, Shader-/Lichtberechnung), keine Lokalisierung außer Deutsch, keine Konsolenversionen. Größte Unsicherheiten: Kinderfiguren (§ASSET_PLAN 5), Gebäudekits für das Dorf (Nr. 1-9 sind im Original prozedural), Zahl der Sequencer-Szenen, Gegner-Feinschliff.

## 12. Reihenfolge der Umsetzung (vertikaler Schnitt Kapitel 1 zuerst)

**Phase 0 - Look-Dev und Grundlagen (ca. 3 Wochen, 15-20 Tage).** Setup, Datenschicht, Spieler + Interaktion, *ein* Raum (Keller Nr. 7 mit Tastenfeld 3110 und Rekorder) in Premium-Qualität: Lumen/VSM, Taschenlampe, eine MetaHuman (Hilde) mit Stimme und Lip-Sync, Nachweis 60 fps auf der Ziel-Hardware. **Ergebnis entscheidet** über Kosten für Fab-Käufe und Gesamtplan. (Entspricht dem Nutzerwunsch "content+quality first, Test am Schluss": Phase 0 ist eine Qualitätsprobe, kein Testlauf.)

**Phase 1 - Kapitel 1 vertikal (ca. 10-12 Wochen).** Dorfstraße (Ahornstraße), Haus Nr. 7 innen und außen, Keller, Tastenfeld, Tonband, Stromausfall, Versteck vor dem Lichtkegel, UFO-Kino, Übergang. Dazu die Subsysteme in der Reihenfolge: Quest → Items/Fibel → Save/Tod → Dialog → QTE → Verstecken → Echo (Küche Nr. 7). Gesamtumfang inklusive Fundament **ca. 110-150 Tage**; danach steht die komplette Pipeline und jedes weitere Kapitel ist "nur noch" Inhalt.

**Phase 2 - Kapitel 2 (Amt, Ebene −2)** (Innenräume, Akten, Ordnungstafel, Spinnenraum, Zombie-Jagd im Langen Gang, Feuer-Niagara).
**Phase 3 - Kapitel 3 (Straße, Das Weiße, Whiskey)** (Whiskey-KI früh, weil er durch alle Kapitel läuft; Laternen/Gezählte-Gegner; Justin).
**Phase 4 - Kapitel 4 (Villa)** und **Kapitel 5 (Iss auf, Bruder)** (Kirchberg, Friedhof, Kinosequenz "Runde drei").
**Phase 5 - Kapitel 6 (Wendigo, Wald)** (Hungriger, Wolf, PCG-Wald, Nebel).
**Phase 6 - Politur** (Performance, Audio-Mix, Credits, Optionen, Packaging).

Begründung der Reihenfolge: Kapitel 1 enthält fast jede Mechanik in klein (Interaktion, Items, Rätsel, Gegner, Kino, Echo, Save); Whiskey wird erst in Kap. 3 groß, deshalb dort; Kapitel 6 hängt an der teuersten Technik (Wald/Gegner) und kommt zuletzt, wenn Performance-Wissen da ist.

## 13. Risiken (Auszug, vollständige Liste im Bericht)

1. **Kinderfiguren:** MetaHuman bietet nach meinem Wissen keine Kinder. Die Geschichte hängt an Kindern (2009). Entscheidung nötig: Fab-Kinderfiguren (im Original schon NoEdge-Kinder), eigene Blender-Arbeit (Regel "keine selbstgebauten Assets" betroffen) oder Kinder nur als Schemen/Nachbilder.
2. **Häuser:** Im Original sind die Dorfhäuser prozedural (`makeHouse`). Für Premium braucht es Fab-Gebäudekits oder Megascans-Gebäude → Kauf-/Auswahlentscheid, Preis offen.
3. **Lumen + viele bewegliche Lichter + VSM** gegen "flüssige FPS". Früh messen.
4. **Prozedurale Texturen** (ca. 430 Canvas-Texturen, `docs/technical/selbstgezeichnet_inventar.md`) müssen durch Scans ersetzt werden; Schriftdokumente (Zettel, Akten) brauchen echte Papier-Scans plus UMG/Decal-Text.
5. **Stimmen:** 85 Sprecherlabels, synthetisch erzeugt; für Premium Entscheidung TTS vs. Sprecher nötig.
6. **Lizenzen:** CC-BY-Pflichtnennung, Fab-Personal-/Professional-Lizenz je nach späterem Vertrieb.
