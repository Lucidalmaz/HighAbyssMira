# ASSET_PLAN - Modelle, Texturen, Audio und Besetzung für die Unreal-Fassung

Stand 09.10.2026. Quellen: `CREDITS.md`, `game/assets/` (6,3 GB, 26 Ordner), `game/audio/` (352 Dateien, 25 MB), `app/mods/figuren.js`, `game/assets/chars/chars.json`, `app/tools/cast.json`, `HAM_Stimmen/besetzung.json`, `app/story/kanon.md`. Der vollständige, nach Kategorien sortierte Lizenzbestand mit Links steht in **`ASSET_LISTE.md`** (161 Einträge, generiert aus CREDITS.md mit `app/tools/ue_export/gen_asset_liste.js`; Maschinenfassung `data/asset_klassifikation.json`).

Regeln (Nutzer): in Unreal nur **hochauflösende Fab/Megascans-Assets**, nie GeometryScript/Primitive/selbstgezeichnete Dinge; echte Beschriftung nur realistisch; **nichts kaufen ohne Rückfrage**.

---

## 1. Wichtigster Befund vorweg

Das Spiel enthält **keine Originaldateien in Premium-Qualität**: Alles unter `game/assets/` ist für den Browser verkleinert (1k/2k-Texturen, gltfpack/Meshopt, KTX2). Bei Dopplungen gilt:
- `.glb` 4,5 GB (352 Dateien) enthält je Modell `model.glb` **und** `model.glb.ktx.glb` (komprimierte Variante). `.ktx2` 1,07 GB (685 Dateien) sind GPU-Container neben den Quell-`.jpg/.png`.
- **Nicht nach Unreal importieren:** `*.ktx2`, `*.ktx.glb`, `.bin`-Reste. Wenn überhaupt, nur Referenz.
- **Besser: Originale neu laden.** Fast jedes Modell hat einen Fab-Link in `CREDITS.md`. Das Original (FBX/UE-Format, 4k-8k-Texturen, Nanite-fähig) ist die Quelle für Unreal, nicht die Web-Fassung. Die Download-Ordner des Nutzers (`HAM_FabDownloads/…`, im Repo nur als Verweise in cast.json/CREDITS) sind der erste Platz zum Nachsehen.

## 2. Gesamtbild: drei Töpfe

| Topf | Umfang (Einträge in CREDITS.md, heuristisch) | Vorgehen |
|---|---|---|
| **A. 1:1 übernehmbar** (Originaldatei erneut laden, in UE importieren) | ca. 93 Requisiten (Rekorder, Tastenfeld, Feuermelder, Messer, Feuerzeug, Ölfass, Geschirr, Bücher, Schwert, …) + 6 Mocap-/Anim-Sets + 16 Kreaturen/Tiere (mit Nacharbeit) | FBX/UE-Format von Fab, Materialinstanzen neu bauen, Nanite an; CC-BY-Nennung behalten |
| **B. Ersetzen durch Fab/Megascans-Äquivalent (UE-nativ)** | ca. 23 Vegetation + 6 Megascans-Einträge (Gebäude, Straßen, Zäune, Möbel, Decals, Laternen, Bäume) + alle Oberflächen-Ordner in `ms/` (Asphalt, Putz, Holz, Fassade, Boden, Kies, Pflaster …; `ms/` hat insgesamt 214 Unterordner, darunter Oberflächen und Requisiten gemischt) | Megascans/Fab in UE-nativer Fassung (Nanite, 8k), nicht die verkleinerten Web-Texturen |
| **C. Neu zu bauen (Blender) oder neu zu beschaffen** | eigene Arbeiten: Rabe Whiskey (aus CC0-Museumsscan), 6 Spinnen, Kindersitze, Bus-Innenraum, Wrack-Innenraum; ca. 430 Canvas-Texturen (Papier, Decals, Oberflächen); prozedurale Häuser; Beobachter-Umbau | siehe §4; **Konflikt mit Nutzerregel "nur Fab/Megascans"** → vor Start entscheiden |

## 3. 1:1 übernehmbar (Topf A)

Formate: GLB/FBX → FBX/GLB-Import (Interchange ab UE 5.5 oder Datasmith/FBX; GLB sonst über Blender nach FBX). Texturen: nie `.ktx2`; PNG/JPG direkt oder, besser, das Fab-Original. Skripte: `app/tools/ue_export/ue_import_assets.py` (Entwurf).

Beispiele mit Lizenz (alle im Spiel nachweisbar in CREDITS.md):

| Gruppe | Beispiele | Lizenz | Anmerkung |
|---|---|---|---|
| Kapitel-1-Requisiten | Tastenfeld (plaggy, CC-BY, auf Fab als CC-BY geführt), Kassettenrekorder (Ryptimal Games, CC-BY), Taschenmesser (Gerardo Justel, CC-BY), Feuermelder (Thorrian, CC-BY), Feuerzeug (LR-Scans, CC-BY), Ölfass (Sunbox Games, CC-BY), Taschenkamera (Gerardo Justel) | CC-BY 4.0 | direkt wiederverwenden |
| Haushalt | Teller, Tassen, Becher, Brot, Besteck, Spieluhr-Dose, Laternen, Strickjacke, Leder-Buch, Rucksäcke | CC-BY 4.0 / Fab-Standard | Beutel Stufe 1-3 sind drei verschiedene Modelle |
| Waffen/Fantasie | Schwert (strmcat), Paladin-Set (Polyphoria, Fab-Standard) für Justin | CC-BY / Standard | Justin siehe §5 |
| Kreaturen | Deer Thing (Shedmon, Wendigo-Form), Grimhound (DM-913, Wolf), Zombie 7 (Tony Flanagan), Animal Variety Pack (Protofactor: Krähe, Reh, Hirsch, Fuchs, Wolf, Schwein) | CC-BY / Fab-Standard | Rigs/Clips in UE neu aufsetzen; Shader (Wachshaut, Ölnässe, Brand) in Material nachbauen |
| Mocap | Motifect, Mocap.in, Animation Shopee, Toei Zukun, nikoff, DZTFIX (alle Fab-Standard) | Fab-Standard | **ideal für UE**: Retargeting auf MetaHuman (IK Retargeter) |
| Tier-Modelle | Hund Bruno (styloo), Kuh (styloo), Katze (Sean4297, 17 Katzen Gisela) | Fab-Standard / CC-BY | Fell: Groom prüfen statt Karten |

## 4. Ersetzen und Neu bauen (Topf B und C)

**B. Ersetzen durch Megascans/Fab (UE-nativ)**
- **Oberflächen** (`game/assets/ms/`: asphalt_road2, road_asphalt, pavement, sidewalk_tiles, floor_wood, floor_worn, facade_brick, facade_concrete, planks_painted, gravel, stonewall1/2, corrugated, rust_sheet, grime, bark, curbs, …): Megascans-Surfaces in UE-Fassung.
- **Vegetation** (Pine_b_04, Nicholas-3D-Free-Pakete, Laub, Moos, Efeu, Gras, Pilze): Low-Poly-Web-Assets → Megascans/Fab-Nanite-Foliage, PCG für den Wald.
- **Megascans bereits im Spiel** (Gebäude-Elemente, Zäune, Möbel, Straßen, Decals, Laternen, Elektrokasten, Farn/Efeu/Gras/Pilze `ms/ladyfern`, `ms/ivy_ms`, `ms/drygrass`, `ms/bolete` …): in Unreal die **Originale aus Fab/Bridge** laden, nicht diese.
- **Gebäude:** Im Spiel sind die Dorfhäuser (Nr. 1-9, 2, 4, 6, 8, Hof, Kirche, Villa Seiler) **prozedural** (`makeHouse`, Wände, Fassadenmodul). Für Unreal ist ein modulares Fab-Gebäudekit nötig (Vorstadt, 1970er-2000er, deutsches Dorf). *Das ist die teuerste offene Beschaffungsfrage.*
- **Dokumente/Papier/Decals:** ca. 430 Canvas-Texturen (laut `docs/technical/selbstgezeichnet_inventar.md`) → Papier-Scan-Set (Hebel 1), Kreide-/Riss-/Kratzer-/Fußspur-/Blut-/Brand-Decals aus Fab/Megascans, Schrift als echte Schriftart auf Scan-Papier (Regel "Schrift muss echt wirken"). Rund 90 Technik-/UI-Texturen bleiben als Material/Shader.

**C. In Blender neu zu bauen (eigene Arbeit; Nutzerentscheidung nötig)**
Bereits in Blender entstanden und per FBX/GLB übernehmbar: Rabe Whiskey und Rabenkrähe (Basis CC0-Museumsscan "Common raven", Wirtualne Muzea Małopolski; Skelett/Clips aus Protofactor), 6 Spinnen (`ms/spinnen`), Kindersitze, Bus-Innen, Wrack-Innen. Das verstößt gegen die strenge UE-Regel "nur Fab/Megascans"; Vorschlag: übernehmen (Blender-Arbeit mit realem Scan als Grundlage) **oder** durch Fab-Ersatz tauschen (Spinnen/Rabe gibt es als Scan-Modelle auf Fab) - Entscheidung beim Nutzer, vor dem ersten Import.
Beobachter: derzeit "Cute Alien Pet" (MissTxxT, stilisiert) stark umgeformt. In einer Premium-Horror-Fassung ist das ein Stilbruch → eher ein realistisches Fab-Wesen (Liste "angesehen, nicht genommen" in CREDITS: Realistic PBR Monster, Spectral Guardian …) oder MetaHuman-Variante mit Morphs; Designentscheidung offen.
Wendigo-Formen (Hirschding/Wolf/Geschälter/Hungriger): Fab-Modelle vorhanden (Deer Thing, Grimhound, Muscle Tissue als Textur); Gesamtwirkung in Phase 0 an einer Form testen.

## 5. MetaHuman-Besetzung (Erwachsene)

Quellen: `figuren.js` (Kopfkommentar: Erwachsene = mama, hilde, lucy_erw, vegas, amt1, amt2, aydin, dina_erw, polizist; Lorenz gestrichen), `chars.json` (35 Modelle mit Höhe), `kanon.md`, `besetzung.json` (Stimmen-Info). Alter/Aussehen **soweit in den Quellen**; "offen" = nicht festgelegt, in Phase 0 gemeinsam entscheiden. Keine realen Personen als Vorbild.

| Figur (id) | Alter / Zeit | Höhe (Modell) | Aussehen laut Quellen | Rolle | MetaHuman-Hinweis |
|---|---|---|---|---|---|
| Hilde Wendt (`hilde`, `hilde_tot`) | 60, wirkt wie 80 | 1,60 | knochig, wenig Worte, Nachthemd in "Nicht du"-Szene, wächserne Schreckform | Nr. 7, Zayns Mutter, Zählerin | alt, hager; Varianten: normal, Nachthemd (Haar offen, lang), "wächsern" (Hautmaterial). Zentrale Figur → Phase-0-Test |
| Lars Vegas (`vegas`) | 60 | 1,76 | Verschwörungs-Onkel, Alufolie, grummelig, nuschelnd | Nr. 3, Gespräch durch die Tür | breiter Typ, Bart/Stoppeln; Alufolie als Accessoire-Mesh; 1975 als Kind (9) im Echo |
| Frau Aydın (`aydin`) | ca. 60 | 1,64 | Türkisch-deutsche Bäuerin, herzlich, laut, fürsorglich | Hof/Stall, Dinas Mutter | warm, kräftig; Kleidung ländlich; Börek-Tupperdose |
| Dina Aydın (`dina_erw`) | 26 (9 in 2009) | 1,66 | Augenbinde, Klinik "Sonnenhang", schroff | Kapitel 2/5 (Nebenaufgabe Scheune) | jünger, Augenbinde als Accessory |
| Gisela Rieke (`gisela`) | 78 | 1,55 | 17 Katzen, raucherstimmig, Gummistiefel | Dorf | sehr alt, klein; Katzen separat (Fab) |
| Günther Maas (`guenther`) | 61 | 1,88 | Postbote, nervös, redet zu viel | Post-Nebenaufgaben | groß, hager; Uniform; bricht später zusammen (Emotionsrange) |
| Lucy Brandt (`lucy_erw`) | 26 (verschwand 23.10.2026) | 1,68 | Luke-Zwilling; frech/herrisch/warm, "Großer" | Tank (Kap. 2), Tonband, Weiß | Zwillingsähnlichkeit mit Luke wichtig (Gesichtsbasis teilen) |
| Luke Brandt (`luke_erw`) | 26 | 1,80 | Tontechniker, Nachtschicht, braune Augen (Original: blau) | **Spielerfigur (Ich-Perspektive)**, in Kino von hinten | Körper/Hände (Ich-Arme) + Version für Kinoszenen von hinten; Gesicht kaum sichtbar → billiger |
| Marion Brandt / Mama (`mama`) | 42 (1967-2011) | 1,68 | Nachbilder, Briefe, Wiegenlied | Echo Kinderzimmer, Kap. 5 Laterne | nur Nachbild-Material; ein MetaHuman reicht |
| Papa | nicht festgelegt | - | **keine Figur** in `figuren.js`; Mira imitiert "Papa", Lukes Vater unaufgeklärt | - | **nicht besetzen**, bis die Story ihn zeigt (offener Kanonpunkt) |
| Heinrich Wolter (`wolter`) | LWO-Nachsorger, mittleres Alter | 1,80 | weich, höflich, Mantel, "Mann im Mantel" | Amt/LWO | glatt, gepflegt; im Spiel mehrfach Doppelgänger (Amt-Männer) |
| Nachsorge 11 / 12 (`nachsorge11`, `nachsorge12`) | - | 1,92 / 1,62 | der Lange (dünn, redet), der Kurze (breit, schreibt) | LWO | gegensätzliche Körperbauten; Körper-Presets nutzen |
| Mann vom Amt 1 / 2 (`amt1`, `amt2`) | - | 1,84 / 1,80 | graue Anzüge | Amt | austauschbar; evtl. gleiche Basis, andere Gesichter |
| Gefreiter Hofer (`polizist`) | wohl Mitte 30 bis 50 (offen) | 1,80 | Wirt des Wendigo; "Mall Cop"-Körper | Kap. 6 | gebrochen, hungrig; Wendigo-Transformation per Morph/Material |
| Pfarrer Bernhard Voss (`voss`) | bis 1992 | 1,80 | Talar (schwarzer Mantel), Nachbild im Kapellenkeller, "Behaltener" | optional Kap. 5 | Nachbild-Material |
| Dr. Theodor Seiler | 1934-2019 | - | Arzt, Gründer der Außenstelle; Villa Seiler | Kap. 4 (Stimme, 2 Zeilen; Porträt) | **keine Figur** im Spiel → entweder nur Porträt (Fotoscan-Prinzip) oder ein MetaHuman; Entscheidung offen |
| Frau Reuter (`reuter`) | - | 1,66 | Roxys Mutter, Pferdeschwanz | Hof | klein; evtl. Statistenrolle |
| Justin vom Hohen Abgrund (`justin`) | Ritter von 1312, altert nicht | 1,94 | Locken, Paladin-Rüstung (Polyphoria), Schwert; ruhig, knapp | Kap. 3 Verbündeter | **ja, besetzen** (Hauptfigur Kap. 3-6). MetaHuman + Rüstung aus Fab-Paladin oder Fab-Rüstungs-Kit; Haar/Bart per Groom |
| Mira (`mira`) | 1312 (Mädchen 7 laut kanon.md); Stimmenentwurf "Frau von 1312" | 1,66 | graues Mädchen ohne Mund; Nachbild/Porträt | Weißes, Rabe | **Widerspruch in den Quellen** (Kind vs. Frau) vor MetaHuman klären |
| Peter Kranz (`peter`) | Ersatzkind 1975 | 1,97 | Zahn-Mann, Zombie | Kap. 2 Jagd, Feuer | bleibt Kreatur (Fab Zombie 7); MetaHuman nicht nötig |
| Blechmann (`blechmann`) | - | 1,86 | Schutzanzug, Atemfilter (Fab "antiradiation suit") | LWO-Bergungstrupp | Gesicht verdeckt → Anzug-Asset |
| Mike K., Roxy R., Heidi W., Zayn W. | **Kinder 2009** (10, 8, 8, 7-10); Roxy "junge Frau mit schwarzen Haaren" im Echo Juni 2026; Mike 2021 erneut geholt | 1,22-1,44 (Kinder) | Kinder in cast.json mit Haut/Haarfarben | Akten, Polaroids, Echos | Kinder siehe unten; Erwachsene Roxy/Mike/Heidi nur in Echos/Briefen, keine Figur außer Roxy-Echo |

**Kinderfiguren (zentral, 9-10 Figuren: Zayn, Roxy, Lucy, Luke, der echte Luke, Heidi, Dina, Mike, Cleo, die Kleine/Graue, Gezählte):** MetaHuman Creator bildet nach meinem Wissensstand **keine Kinder** ab; das ist vor Projektstart zu prüfen (aktuelle MetaHuman-Dokumentation und Lizenz). Optionen: (1) bestehende Fab-Kinderfiguren (NoEdge "Realistic 3D Child Character"; im Spiel bereits genutzt, daher Lizenz bekannt) auf UE-Qualität heben; (2) Kinder überwiegend als Nachbild-Schemen darstellen (Material statt Gesicht); (3) Blender-Eigenbau (Regel-Konflikt). Empfehlung: (1) + (2) kombinieren, Entscheidung in Phase 0.

**Anzahl:** ca. 18 Erwachsene mit Gesicht (Hilde, Vegas, Aydın, Dina, Gisela, Günther, Lucy, Wolter, Nachsorge 11, Nachsorge 12, Amt 1, Amt 2, Hofer, Voss, Justin, Mama, Reuter, Luke-Körper/Hände) + optional Seiler/Mira. Varianten (Hilde x3, Lucy x2, Justin Rüstung/zivil) zählen als Zusatz. Aufwand siehe `ARCHITEKTUR_UE.md` §11 (Posten 25-27).

**Technik:** MetaHuman Creator (Cloud) bzw. Mesh-to-MetaHuman nur mit **eigenen** Scans/Fotos mit Rechten (nicht Gesichter echter Personen aus dem Netz). Haar als Groom (Strand-basiert) für Hauptfiguren, Haarkarten (Cards) für Statisten (Performance). Kleidung: Fab-Kleidungskits oder MetaHuman-Standard, passend zu 2026 (Dorfleute) bzw. 1975-2011 (Echos). LODs und Nanite-Skinned-Mesh nur mit geprüfter Engine-Version.

## 6. Stimmen und Lip-Sync

**Bestand:** 29 Figuren-Stimmen (`HAM_Stimmen/besetzung.json`), 85 Sprecherlabels → Stimmen-ID (`game/assets/stimmen/manifest.json: wer`), Modul `stimmen.js`. Die Stimmen sind **synthetisch** (Qwen3-TTS VoiceDesign + Base-Klon einer festen Referenz je Figur, Apache-2.0; Qualitätsprüfung mit Whisper/UTMOSv2). Im Repo liegt das Manifest **leer** (`z`: 0 Einträge) - die erzeugten `.opus` liegen außerhalb. Zeilen: 1.665 insgesamt; **440 Nicht-Luke-Zeilen mit Sprecher** (davon ca. 76 Funk/Band/Mailbox/Stimme-aus-dem-Off ohne sichtbares Gesicht) → **ca. 360 Zeilen mit sichtbarem Gesicht**; Lukes ca. 430 Zeilen sind Ich-Perspektive (kein Gesicht, aber Atem/Mund-Ton).

**Entscheidung nötig (Nutzer):** (a) TTS-Stimmen beibehalten (schnell, konsistent, lizenzfrei, aber begrenzte Emotion), (b) Sprecher aufnehmen lassen für Hauptfiguren (Hilde, Vegas, Lucy, Justin, Wolter, Gisela, Aydın …) und TTS für Nebenrollen/Funk. Für Premium wird (b) für ca. 10 Hauptrollen empfohlen. Kosten hängen von Auswahl ab - nichts beauftragen ohne Rückfrage.

**Lip-Sync / Gesichtsanimation (zwei Wege, Reihenfolge nach Test in Phase 0):**
1. **MetaHuman Animator mit Audio-Eingabe** (Audio → Gesichtsanimation): in neueren UE-Versionen verfügbar (ich erinnere ab UE 5.5; zu prüfen). Offline pro Zeile eine Animationssequenz erzeugen, an der Zeile in `DT_Dialog` (Spalte `FaceAnim`) hinterlegen. Vorteil: Qualität, Entscheidungen im Editor.
2. **NVIDIA Audio2Face (ACE-Plugin für Unreal)**: Audio → Blendshapes/ARKit-Kurven, auf MetaHuman abbildbar; auch live nutzbar. Lizenz und Plugin-Stand vor Einsatz prüfen.
Pipeline: `Stimmen-Audio (WAV 48 kHz) → Face-Animation → Sequencer-Track bzw. Anim-BP-Montage; Kopf-/Körpergesten aus Mocap-Sets (Gesprächs-Clips); Blinzeln/Blick aus Control Rig`. Im Original existiert eine Mund-Hüllkurve (`stimmen_pegel()`/`figuren_mund`) - das genügt in Unreal nicht, wird ersetzt.
**Empfehlung:** Zeilen vorab offline backen (≈360 Zeilen, Automatisierung per Python/Commandlet), Live-Lip-Sync nur für prozedural erzeugte Zeilen (Whiskey-Imitate) nötig.

## 7. Audio-Import (game/audio, 352 Dateien)

| Gruppe | Anzahl | Quelle/Lizenz | Plan |
|---|---|---|---|
| `amb_*` Klangbetten | 27 | Sonniss GDC (lizenzfrei, keine Namensnennung, nur im Spiel mitgeliefert) | 1:1, besser Originale in Studioqualität (Sonniss-Pakete) neu bearbeiten |
| `fx_*` Einzelgeräusche | 154 | Sonniss, freesound **CC0**, Wikimedia CC0/PD, OpenGameArt CC0 | 1:1 (Cues in MetaSounds) |
| `mu_*`, `kb_*`, `pn_*`, `pk_*`, `cue_*`, `st_*` | 16 + 23 + 7 + 19 + 3 + 5 | VSCO 2 CE **CC0** (Sampler) | Sampler-Bank bleibt; Stücke 1:1 oder neu einspielen |
| `pz_*`, `wd_*`, `sc_*`, `zb_*`, `ui_*` | 30, 34, 6, 7, 18 | Sonniss / freesound CC0 | 1:1 |
| Stimmen | extern (`HAM_Stimmen`) | Qwen3-TTS synthetisch | siehe §6 |

Details je Datei: `data/audio.json` und `docs/gameplay/klang_inventar.md` (Stand 08.10.2026: "echte Aufnahmen statt Synthese"). Konvertierung nach WAV 48 kHz 24 Bit (ffmpeg) vor Import. Share-Alike-Dateien (CC BY-SA) wurden bewusst nie benutzt - das bleibt Regel.

## 8. Lizenzen (Kurzfassung)

- **CC-BY 4.0** (140 Fab-Einträge + 9 Sketchfab): Namensnennung (Werk, Urheber, Link, Hinweis auf Änderungen) im Credits-Screen und im Store-Eintrag. CREDITS.md in UE-Credits-Widget überführen (Quelle: `data/credits.json`).
- **Fab-Standardlizenz** (21 Einträge, u. a. NoEdge, Motifect, Mocap.in, Quixel): keine Nennung nötig; **Personal vs. Professional** richtet sich nach Umsatz/Unternehmensgröße des späteren Vertriebs - vor Veröffentlichung klären.
- **Quixel Megascans / Fab:** In Unreal-Projekten nutzbar; Konditionen für kostenlose bzw. kostenpflichtige Inhalte ändern sich - vor Kauf/Download die aktuelle Fab-Seite prüfen (hier keine Preise zugesichert).
- **MetaHuman:** eigene Lizenzbedingungen (Epic); Einsatz in einem Unreal-Spiel ist der vorgesehene Fall. Bedingungen vor Start nachlesen.
- **Sonniss GDC:** lizenzfrei, aber nicht als einzelne Dateien weiterverteilen (im Spiel eingebettet ist ok).
- **TTS-Stimmen:** Apache-2.0-Modell, erzeugte Audios ohne Auflagen; dennoch Hinweis im Credits-Screen ("synthetische Stimmen").

## 9. Offene Beschaffungs-/Entscheidungsliste (nichts kaufen ohne Rückfrage)

1. Gebäudekit für das Dorf (Nr. 1-9, Hof, Kirche, Villa, Amt-Gebäude): Auswahl + Preis.
2. Papier-/Dokument-Scan-Set, Kreide-/Riss-/Blut-/Fußspur-Decals (Fab/Megascans: möglichst kostenlose Pakete zuerst prüfen).
3. Kinderfiguren-Lösung (siehe §5).
4. Beobachter-Ersatz (realistisches Wesen).
5. Sprecher vs. TTS (§6).
6. Welche Blender-Eigenarbeiten bleiben (§4 C).
7. Hardware-Ziel (60 fps, Referenz-GPU) → bestimmt Nanite/Lumen-Einstellungen.
