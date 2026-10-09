# NAECHSTE_SCHRITTE - Checkliste "Tag 1" und Projektgrundlagen für die Unreal-Fassung

Stand 09.10.2026. Ziel: Wenn der Start beschlossen ist, steht am Ende von Tag 1 ein leeres, aber korrekt aufgesetztes Projekt mit Datenschicht, Ordnerstruktur und einem ersten Testraum. Es wird **nichts gekauft** und nichts installiert, bevor der Nutzer es freigibt.

## 0. Was auf dem Rechner schon da ist (am 09.10.2026 geprüft, nur gelesen)

- Epic Games Launcher: `C:\Program Files\Epic Games\Launcher` vorhanden.
- **Unreal Engine 5.8.3** installiert: `C:\Program Files\Epic Games\UE_5.8` (Build.version: 5.8.3, Release-Zweig). Ob die Plugins MetaHuman, Python Editor Script, Audio-/Face-Werkzeuge in dieser Fassung aktiv bzw. enthalten sind, ist im Editor unter *Edit > Plugins* zu prüfen (nicht geprüft).
- Freier Speicher C: ca. 450 GB von 894 GB.
- Ordner `C:\Users\GIGABYTE\HAM_FabDownloads\` mit bereits heruntergeladenen Fab-Paketen (u. a. `v15_mocap`, `v17_kreaturen`, `v18_figuren`, `v19_vegetation`, `v20_texturen`, `v20_zombie`, `v21_papier`, `v22_risse`, `v30_bedienung`, `v31_ergaenzung`, `v32_decals`, `spinnen`, `deadshrubs`, `felsen`, …). **Das ist ein großer Teil der Topf-B-Beschaffung** (Papier, Risse, Decals) - vor jedem Neukauf hier nachsehen.
- Ein Unreal-Projekt `HighAbyssMira.uproject` wurde unter `Documents\Unreal Projects` **nicht gefunden**. Im Repo gibt es `unreal/Scripts/*.py` und `Export_*.bat` (früherer Weg: Figuren/Requisiten *aus* Unreal ins Browser-Spiel exportieren). Der neue Weg läuft umgekehrt (Daten und Assets *nach* Unreal).
- Python 3.13 ist lokal vorhanden (nur für Werkzeuge; Unreal bringt seinen eigenen Python-Interpreter mit).

## 1. Was der Nutzer selbst tun muss (ich darf es nicht)

| # | Aufgabe | Hinweis |
|---|---|---|
| 1 | **Epic-Login** im Epic Games Launcher prüfen (gleiches Konto wie bei Fab und MetaHuman) | Anmelden, Passwörter und Zahlungsdaten gebe ich nie ein |
| 2 | **Unreal-Version festlegen**: 5.8.3 ist installiert. Vor Projektbeginn Release Notes zu MetaHuman/Audio-to-Face/Nanite/Lumen für 5.8 lesen und bestätigen, ob 5.8 die Zielversion ist (nicht im laufenden Projekt wechseln) | Entscheidung bleibt beim Nutzer |
| 3 | **Visual Studio** mit Workload "Spieleentwicklung mit C++" (Windows-SDK, .NET) prüfen/installieren | für das C++-Modul `HighAbyssMira` |
| 4 | **Fab-Konto prüfen**: Bibliothek öffnen, was bereits "im Besitz" ist (Gratis-Käufe/Freebies; "Persönlich" vs. "Professionell") | **nichts kaufen** ohne Rückfrage; Gratis-Hinzufügen nur nach Freigabe |
| 5 | **MetaHuman-Zugang** testen (MetaHuman Creator im Browser mit Epic-Konto; Plugin im Launcher/Fab) | Lizenzbedingungen lesen |
| 6 | **Hardware-Ziel** nennen (GPU/RAM; 60 fps in welcher Auflösung?) | bestimmt Lumen-/Nanite-Einstellung |
| 7 | **Entscheidungen aus ASSET_PLAN §9** treffen (Gebäudekit, Kinderfiguren, TTS vs. Sprecher, Blender-Eigenarbeiten, Beobachter-Ersatz) | in dieser Reihenfolge ist die Wirkung am größten |
| 8 | Entscheidung, **ob** und **wann** gestartet wird (Zeitrahmen: siehe `ARCHITEKTUR_UE.md` §11, ca. 600 Personentage) | |

## 2. Checkliste Tag 1 (ca. 6-8 Stunden)

1. **Export frisch erzeugen** (Spiel nicht starten): `node app/tools/ue_export/export.js` → `docs/unreal/data/*.json` aktualisieren; `node app/tools/ue_export/gen_asset_liste.js` → `ASSET_LISTE.md`. Zahlen in `data/_manifest.json` mit `ARCHITEKTUR_UE.md` §1 vergleichen.
2. **Projekt anlegen** (Launcher → UE 5.8 → Spiele → *Leer/Third Person ohne Starter Content*, **C++**, Raytracing aus, Zielplattform Desktop, Qualität Maximum, *kein* Starter-Content): Name `HighAbyssMira`, Speicherort `C:\Users\GIGABYTE\Documents\Unreal Projects\HighAbyssMira` (nicht in OneDrive: die Dateien sind riesig und OneDrive-Synchronisierung bricht Builds).
3. **Plugins aktivieren** (Edit > Plugins): Python Editor Script Plugin, Editor Scripting Utilities, Enhanced Input, Common UI, Gameplay State Tree / State Tree, AI-Perception (Standard), Niagara, MetaSounds, Sequencer-Zubehör, Movie Render Queue (für Marketing-Bilder), MetaHuman und (falls vorhanden) die Audio-zu-Gesicht-Plugins; **Geometry Script und Modeling Tools deaktiviert lassen** (Regel: kein Geometry Script).
4. **Versionskontrolle**: `git init` im Projektordner (Git LFS für `.uasset/.umap/.fbx/.png/.wav`) **oder** Perforce; `.gitignore` für `Binaries/ Intermediate/ Saved/ DerivedDataCache/`. Kein Push ohne Nutzerfreigabe.
5. **Ordnerstruktur anlegen**: im Editor `py "…/HighAbyssMira-Repo/app/tools/ue_export/ue_setup_project.py"` (Entwurf; legt `/Game/HAM/…` an).
6. **C++-Modul**: Klassen `AHamGameMode`, `UHamGameInstance`, `AHamPlayerCharacter`, und die sieben `FTableRowBase`-Structs (`FHamDialogRow` …) anlegen (Felder siehe `ue_import_datatables.py`, Funktion `rows_*`). Build, Editor neu starten.
7. **DataTables importieren**: `py "…/ue_import_datatables.py"` → `/Game/HAM/Core/Data/Tables/DT_*`. Prüfen: Log zeigt Zeilenzahlen (Dialog 1.665, Tasks 250, Thoughts 325, Items 79, Locations ~25, Puzzles 77, Characters 35).
8. **Testraum**: Level `L_Test_Keller` anlegen, ein Raum aus Megascans-Wänden (kein Primitiv-Würfelbau; Boden/Wand aus Fab-Assets), eine Taschenlampe, Lumen/VSM an; Bildrate messen (Stat Unit/GPU). Das ist der erste Premium-Look-Test (Phase 0, `ARCHITEKTUR_UE.md` §12).
9. **Import-Probe**: `HAM_SET=kapitel1_props` setzen, `py "…/ue_import_assets.py"` (Tastenfeld, Rekorder, Messer, Feuermelder). Besser: die Originaldateien aus `HAM_FabDownloads` bzw. frisch von Fab verwenden.
10. **Notizen**: Ergebnis (Bildrate, Probleme) in `docs/unreal/` als kurze Datei festhalten - nicht ins Spielrepo mischen, ohne den Nutzer zu fragen.

## 3. Projektstruktur (Vorschlag)

```
/Game/HAM
  Core/        Blueprints, GameFramework, Input, UI, Save, Data/{Structs,Tables}
  Characters/  MetaHuman, Children, Creatures, Animation, Voice
  Items/       Meshes, Icons, Data (PrimaryDataAssets je Item)
  Audio/       MetaSounds, Cues, Ambience, Music, Voice, Attenuation, Concurrency
  VFX/         Niagara, Materials
  Cinematics/  Sequences, Cameras
  Environment/ Megascans, Fab, Foliage, Materials, Decals
  Lighting/    PostProcess, Presets
  Chapters/    K01_KellerBleibtZu … K06_Wendigo, K07_Reserve   (je: Maps, Props, Dialogue, Sequences, Quests)
  Maps/        Persistent, Test
  ThirdParty/  FabRaw      (unveränderte Importe, nie bearbeiten; Kopien nach Environment/Items)
```
Regel: Fab-/Megascans-Importe bleiben unter `ThirdParty/FabRaw` unverändert (Lizenz, Updates); eigene Materialinstanzen und Varianten liegen in `Environment`/`Items`.

## 4. Namenskonventionen

Epic-Standard (Allar-Style-Guide-ähnlich), damit Skripte Assets finden:

| Typ | Präfix | Beispiel |
|---|---|---|
| Static Mesh / Skeletal Mesh | `SM_` / `SK_` | `SM_Rekorder`, `SK_Hilde` |
| Material / Instanz / Funktion | `M_` / `MI_` / `MF_` | `MI_Putz_Keller_Nass` |
| Textur (BaseColor/Normal/ORM) | `T_<Name>_BC / _N / _ORM` | `T_Putz_01_BC` |
| Blueprint / Widget | `BP_` / `WBP_` | `BP_Tastenfeld`, `WBP_Fibel` |
| Level / Sequenz | `L_` / `LS_` | `L_Nr7_Keller`, `LS_K01_UFO` |
| Niagara / MetaSound / Sound Cue | `NS_` / `MS_` / `SC_` | `NS_Rain_Player`, `MS_Ambience_Keller` |
| Sound Wave | `SW_` | `SW_amb_keller` (Name aus Spielarchiv beibehalten) |
| Anim BP / Montage / Sequence | `ABP_` / `AM_` / `A_` | `ABP_Hilde`, `A_Hilde_Talk_01` |
| DataTable / Struct / Enum | `DT_` / `F` / `E` | `DT_Dialog`, `FHamDialogRow`, `EHamChapter` |
| Datenasset | `DA_` | `DA_Item_key` |
| Zeilenschlüssel (Tabellen) | `DLG_`, `TASK_`, `ITEM_`, `LOC_`, `PUZ_`, `CHAR_`, `VOICE_`, `ECHO_`, `SIDE_` | wie im Export |

Sprache: Asset-Namen **englisch/ASCII**, Texte deutsch (StringTables); keine Umlaute in Dateinamen.

## 5. Import-Skripte (Entwürfe in `app/tools/ue_export/`)

| Skript | Zweck | Status |
|---|---|---|
| `export.js` | Statische Analyse → `docs/unreal/data/*.json` (getestet, läuft in ca. 10 s) | **fertig, getestet** |
| `gen_asset_liste.js` | CREDITS.md → `ASSET_LISTE.md` + `asset_klassifikation.json` | **fertig, getestet** |
| `ue_setup_project.py` | Ordnerstruktur `/Game/HAM/…` | Entwurf, in Unreal ungetestet (nur Syntax geprüft) |
| `ue_import_datatables.py` | JSON → DataTables (braucht C++-Structs) | Entwurf, ungetestet |
| `ue_import_assets.py` | Stapelimport Mesh/Textur/Audio mit Namenspräfixen | Entwurf, ungetestet |

Folgeskripte (noch nicht geschrieben): `ue_make_materials.py` (MI aus Textursätzen per Namensendung), `ue_place_markers.py` (Marker aus `DT_Locations` mit Koordinatenumrechnung), `ue_bake_face_anims.py` (Audio → Gesichtsanimation, abhängig von §ASSET_PLAN 6).

## 6. Entscheidungsfragen, die vor Tag 1 beantwortet sein sollten

1. Welche Hardware ist Zielwert (Spieler)? 60 fps in 1440p?
2. Kinder: Welche Lösung (Fab-Kinder + Schemen)?
3. Dorfhäuser: Welches Gebäudekit (Preisrahmen)?
4. Blender-Eigenarbeiten (Rabe, Spinnen, Kindersitze, Bus) behalten oder ersetzen?
5. Stimmen: TTS behalten, oder Sprecher für Hauptrollen?
6. Reihenfolge: Phase 0 (3 Wochen Look-Dev) zuerst - einverstanden?
7. Veröffentlichung/Vertrieb (bestimmt Fab-Lizenzstufe Personal vs. Professional).

## 7. Nicht vergessen

- Das Browser-/Electron-Spiel bleibt Referenz (Memory: "App only"): Verhalten dort nachsehen, nicht neu erfinden. Änderungen am Original sind für die UE-Vorbereitung **nicht** nötig.
- `CREDITS.md` ist Pflicht: Credits-Widget aus `data/credits.json` erzeugen.
- Kein Push, keine Kopien auf den Desktop ohne Rückfrage (Memory: "vor Upload fragen").
