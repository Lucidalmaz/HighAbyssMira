# Inventar: alles selbst Gezeichnete (Canvas-/DataTexture-/Shader-„Bilder")

Stand: 02.10.2026. Reine Bestandsaufnahme (nichts geändert). Grundlage: Suche nach `cnv(`, `canvasTex(`, `amt_cv(`, `zeichen_cv(`, `createElement('canvas')`, `CanvasTexture(`, `DataTexture(` plus den modulinternen Helfern (`kirchberg_cnv`, `kapitel1_cnv`, `villa_cv`, `weiss_cv`, `k5_cv`, `k6_tex`, `n4_cv`, `lwo_tex`, `justin_cv`, `kf_cnv`, `feuer_canvas`, `ausbau_nord_paper`, `cv` in zimmer7) in `app/mods/*.js` und `app/mods/_base_source_index.html` (ca. 420 Treffer-Zeilen in 57 Dateien, dazu ca. 140 Helfer-Aufrufe).

## Zusammenfassung

**Gesamt: ca. 570 erzeugte Texturen/Bilder an ca. 420 Tabellenzeilen.** (Zählweise: pro Stelle die Anzahl erzeugter Texturen; „je Haus/je Foto"-Schleifen mit 3 angesetzt; Schätzwerte, ca. ±10 %.)

| Kat | Bedeutung | Zeilen offen | Texturen offen (n) | davon Prio „hoch" | schon umgestellt (n) |
|---|---|---|---|---|---|
| A | Dokument mit Text (Zettel, Brief, Akte, Schild, Plakat) | 148 | 206 | 81 | 5 |
| B | Bild/Zeichnung/Foto | 36 | 61 | 30 | 22 (Fotos über `fotos.js`, `polaroid/*.jpg`, 3D-Render) |
| C | Decal auf Welt (Blut, Kreide, Kratzer, Spuren, Schmutz) | 76 | 87 | 42 | 6 (Hände aus `blood_hv`, Graffiti-Korn) |
| D | Oberflächen-Textur (Holz, Putz, Metall, Stoff, Boden, Himmel) | 57 | 74 | 13 | 14 (Boden, Wände, Asphalt, Gras, Rinde, Fassaden) |
| E | Technik/UI/FX (Sprites, Licht, Nebel, Maske, HUD, Karte) | 63 | 89 | – | 9 |
| **Summe** | | | **ca. 520 offen + ca. 56 erledigt** | | |

Zu ersetzen sind also **ca. 430 Texturen** (A+B+C+D offen); **ca. 90** (E) bleiben prozedural. „Erledigt" bedeutet hier: Foto/Scan ist schon im Einsatz, der Canvas-Code bleibt nur als Rückfall oder Formmaske (teilweise Umstellungen sind als „Teilweise ERLEDIGT" markiert und mitgezählt).

Bereits umgestellt (Stand heute): `M.floor/plaster/wallpaper/wallpaper2/block/concrete/brick` (`loadMS`, `_base` Z.5249), `M.asphalt/sidewalk/grass/bark` (`gruen.js:246–250`), Fassaden/Dächer (`fassaden.js`), Hand-/Blutabdrücke (`amt.js:237–254`, Maske + `blood_hv`), Graffiti-Farbe/Korn (`zeichen.js:236ff`, `graffiti_echt`), Indizienwände mit Ingame-Fotos (`fotos.js`), Polaroids (`assets/polaroid`, `assets/fotos`), Kamera/Beutel/Menü-Fotos als 3D-Render, Möbel-Karten der Scheinzimmer, Schmutz-Decals (`grime` in kirchberg/nr4/post/ausbau_ost_west/zimmer7), Blut-Decals (`blood_*` in innen_kapitel/innen_ort/weiss).

### Wichtigste Hebel in einem Satz
(1) Die Papier-Generatoren (`amt_papier`, `kirchberg_papier`, `kapitel1_papier`, `ausbau_nord_paper`, `villa_papierCv`, `innen_kapitel.js:86`, das HUD-Papier in `oberflaeche.js`, dazu Album-Seiten und Sammelblätter) auf **einen Satz neu beschaffter Papier-Scans** umstellen: ändert ca. 120 Dokumente auf einmal. (2) Ein **Decal-Set** (Kreide, Risse/Kratzer, Fuß-/Hand-/Tierspuren, Absperrband, Emaille-Schild-Basis) beschaffen: deckt ca. 90 Stellen. (3) **Kinderzeichnungen** einmal sauber anfertigen (kein Scan-Asset vorhanden). (4) Letzte Basis-Materialien `M.wood`, `M.fabric`, `M.ash`, `M.siding`, `M.roof` auf vorhandene Scans legen.

### Top-30 der sichtbarsten B/C/D-Stellen (Prioritätsreihenfolge)

| # | Stelle | Kat | Was / wo | Ersatz |
|---|---|---|---|---|
| 1 | `_base` Z.1013 `M.wood` | D | Holz auf Möbeln, Zäunen, Pfosten – überall, Nahaufnahme | `msSurf(M.wood, 'planks_painted'/'floor_wood')` (Scans da, nirgends gesetzt) |
| 2 | `_base` Z.1908–1917 | D | UFO-Rumpf (Kap. 1 Höhepunkt), 2048² Panel/Nieten/Schmutz | Sci-Fi-/Alu-Panel-Scan (b/n/orm) neu beschaffen |
| 3 | `_base` Z.4431 `bloodTex` | C | Blutlache + Spritzer auf Asphalt | `blood_s1/s2/hv` per `msSurfMat({alpha:true})` |
| 4 | `kino.js:278`, `amt.js:558` | B | Kinderzeichnung „PAPA + ICH" vor dem achten Stuhl (zentrales Story-Bild) | echtes Kinderzeichnungs-Asset auf Papier-Scan |
| 5 | `kino.js:321`, `_base` Z.1471 `crayon`, `weiss.js:50`, `zayn.js:44` | B | Kinderzeichnungen: Mädchen mit Laterne „LUKE, 9", Sieben Kinder an der Kreuzung, Laternenpapier, Hütte | wie 4 (ein Zeichen-Set) |
| 6 | `_base` Z.1452 `familyPhoto`, `kapitel5.js:263` | B | Familienfoto (drei Blässe-Stufen), Wohnzimmer | [FO] Ingame-Foto der echten Figuren |
| 7 | `amt.js:398`, `511`, `840` | B | Sommerfest-Fotos, Planungsraum-Foto, Akte-08-Foto (Junge mit braunen Augen) | [FO] + Foto-Postprocess (`n4_sepia`) |
| 8 | `kapitel1.js:139/147`, `_base` Z.2524, `neben4.js:78/84` | B | Polaroid auf dem Gurtstuhl, Polaroid-Rahmen, alter Abzug 1941 | Foto fertig; Rahmen/Sofortbildpapier [PS] |
| 9 | `kino.js:1226` `riss` | C | 3,4×3,4 m Wandrisse | Riss-Decal-Set (Megascans) |
| 10 | `_base` Z.2552, `kapitel1.js:43/46/57/61/130/133`, `strasse.js:416`, `ausbau_nord.js:426` | C | Kreidepfeile, Hüpfkästchen, Strichliste, Hydranten-Striche, Himmel & Hölle | Kreide-Scan-Set [KR] |
| 11 | `zeichen.js:365` `zeichen_wandMalen` | B | Wandbild „Unser Dorf" 2048×736 (Klasse 3b, 1976) | Farbe-auf-Putz-Pass wie Graffiti (Korn/Poren/Risse), Motiv bleibt |
| 12 | `amt.js:226`, `beobachter.js:633`, `justin.js:177`, `kapitel5.js:324`, `wald.js:59`, `innen_kapitel.js:253` | C | Kratzer (Amt, Beobachter, Justin, Stall, Wald, Zelle) | Kratzer-Decal-Set [RISS] mit Normalmap |
| 13 | `kapitel6.js:51/57/61`, `gruen.js:584`, `kapitel1.js:66/241`, `ausbau_ost_west.js:457`, `kapitel5.js:90` | C | Kinderfuß, Kinderhand, Huf, Stiefel, Fußspuren im Matsch/Staub | Fußspur-/Tierspur-Scans (Fab) |
| 14 | `lucy3.js:400/421/428`, `post.js:253` | C | beschlagene Heckscheibe, Hand auf Scheibe, blauer Kreispfeil (Spray), Fingerzeichnung im Beschlag | [GR]-Beschlag + Handabdruck-Scan + Spray-Decal mit [GF]-Korn |
| 15 | `_base` Z.1775 `scorch`, `kino.js:336`, `_base` Z.1004 `M.ash` | C/D | Brandstelle Haus Nr. 5: Brandfleck, Ruß, Aschenboden | `asphalt_debris` + [GR] Ruß; Burnt-Ground-Decal |
| 16 | `amt.js:475` Stadtmodell | B/D | Grundplatte mit gemalten Straßen, Kuppel „OBJEKT", Pappfiguren | Modellbau-Scan-Untergrund + Karte aus Weltdaten, Figuren-Renders |
| 17 | `amt.js:346`, `zimmer7.js:243`, `ausbau_ost_west.js:276`, `ausbau_nord.js:810` | D | Schwarze Bretter/Pinnwand (Kork, Tafel) | Kork-/Schiefer-Scan (neu beschaffen) |
| 18 | `neben3.js:111`, `kirchberg.js:344` | D/B | Bleiglas/Kapellenfenster (acht Felder) | Buntglas-Scan (Fab) + Motive |
| 19 | `strasse.js:454`, `ausbau_nord.js:827/864` | A/B | Plakate: Bruno, Mike K., Laternenfest, Bürgerversammlung, Zayn-Vermisst, vier Plakatschichten | Plakatpapier-Scan (Wheatpaste) + Fotos [FO] |
| 20 | `tiefwald.js:162`, `zeichen.js:480` | C/D | Landeplatz mit glasigem Boden/Moos-Rosetten; Nazca-Scharrlinie | `forestfloor` + `w_mosspatch`; Furche mit Scan-Normal |
| 21 | `_base` Z.1007 `M.fabric`/`M.cloth` | D | Stoff (Decken, Vorhänge, Teppich) | `curtain_retro`/Sofa-Stoff |
| 22 | `_base` Z.1296 `gd` | D | Garagentor | `ms/garagedoor` (Scan vorhanden) |
| 23 | `_base` Z.1025 `curtainTex` | D/E | warmes Fensterlicht hinter Vorhang (alle Häuser nachts) | `curtain_sheer` als Emissiv-Maske |
| 24 | `villa.js:156/227/235` | D/B | Alufolie an Fenstern, Weltkarte mit neun Nadeln + neun Fotos | Alufolie-Scan; Weltkarte (PD) + [FO] |
| 25 | `kapitel1.js:167`, `_base` Z.1524 | B | 58 / 30 Wachsmalkreide-Zeichnungen (Kinderzimmer Nr. 1, Hildes Keller) | bereits durch `fotos.js` ersetzt; Rückfall löschen |
| 26 | `innen_kapitel.js:361` `keys` | D | Klaviertasten 1024² | Klavier-Scan / Elfenbein-Textur |
| 27 | `tiefwald.js:167`, `kapitel6.js:64` | D | Messplakette, Eisennetz (Rost) | `rust_sheet`/Messing-Scan |
| 28 | `justin.js:182ff` | D | Leder-/Metall-Flicken, Kinderschrift-Ritzung | Leder-Scan (Fab) |
| 29 | `beobachter.js:378/408` | D | Haut des Beobachter-Modells (Postprocess auf Scan) | Skin-Detail-Scan auf `ms/beobachter` |
| 30 | `_base` Z.3678 `boardTex`, `amt.js:380` | C/A | Ordnungstafel + Kreide „Alle siebzehn." | Schiefer-Scan + [KR], Text dynamisch |

Hinweis zur Reihenfolge: A-Stellen (Zettel/Briefe/Schilder) sind absichtlich nicht in der Top-30; sie profitieren gemeinsam vom zentralen Papier-Scan (Hebel 1, ca. 200 Texturen) und sind sichtbarer als jede Einzelstelle, sobald dieser steht.

---

## Tabelle je Datei

Spalten: **Stelle** (Datei:Zeile) | **n** (Anzahl erzeugter Texturen/Bilder in dieser Zeile bzw. Funktion) | **Darstellung** | **Ort** (laut Code/Kommentar) | **Kat** | **Prio** (Sichtbarkeit/Wichtigkeit) | **Ersatzvorschlag**. Zeilen, deren Ersatz mit `ERLEDIGT` beginnt, sind bereits auf Scans/Fotos umgestellt (der Canvas-Code bleibt nur als Rückfall oder als Maske). `Z.` = Zeile.

Kürzel im Ersatz: **[PS]** = Papier-Scan-Basis (neu beschaffen, siehe Abschnitt „Querschnitts-Empfehlungen"), **[BL]** = `ms/blood_hv|blood_s1|blood_s2`, **[GR]** = `ms/grime` (Schmutz/Wasser/Ruß als Alpha-Decal), **[GF]** = `ms/graffiti_echt` (Tags/Farbe/Korn/Poren), **[KR]** = Kreide-Decal-Set (neu beschaffen: Fab/ambientCG „Chalk"), **[RISS]** = Riss-/Kratzer-Decal-Set (neu beschaffen), **[FO]** = Ingame-Foto über `fotos.js` / `kamera_render` / `assets/polaroid`, **[TECH]** = bleibt prozedural.

### app/mods/_base_source_index.html (53 Treffer-Zeilen)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.888–911 `cnv`, `noiseFill`, `normalFromHeight`, `tex`, `pbr` | 0 | Werkzeug-Funktionen für alle prozeduralen Texturen | überall | E | – | [TECH] (Infrastruktur) |
| Z.923 `M.asphalt` | 1 | Asphalt mit Pfützen, Rissen, Flecken (Farbe+Höhe+Rauheit) | Straßen Dorf | D | hoch | ERLEDIGT: `gruen.js:247` → `ms/road_asphalt` |
| Z.939 `M.sidewalk` | 1 | Gehwegplatten | Dorf | D | hoch | ERLEDIGT: `gruen.js:248` → `ms/pavement` |
| Z.945 `M.grass` | 1 | Gras | Dorf | D | hoch | ERLEDIGT: `gruen.js:246` → `ms/lawn1` + Laub/Waldboden |
| Z.950–956 `M.siding`/`sidingCanv`/`sidingMat` | 1 | Holz-Stülpschalung (Häuserwände) | Häuser im Dorf | D | hoch | Teilweise ERLEDIGT durch `fassaden.js` (Scan-Fassaden); `sidingMat` noch Rückfall → `planks_painted` |
| Z.957 `M.brick` | 1 | Ziegel | Gebäude | D | hoch | ERLEDIGT: `loadMS` Z.5250 → `ms/wall_brick` |
| Z.963 `M.roof` | 1 | Dachschindeln | Dächer | D | mittel | Teilweise ERLEDIGT (`fassaden.js:372` tauscht Dächer); Rest → `ms/corrugated` / Schindel-Scan |
| Z.970 `M.floor` | 1 | Holzdielen innen | Innenräume | D | hoch | ERLEDIGT: `loadMS` Z.5249 → `ms/floor_worn` |
| Z.977–984 `M.wallpaper`, `M.wallpaper2` | 2 | gemusterte Tapeten mit Wasserflecken | Innenräume | D | hoch | ERLEDIGT: `ms/wallpaper_old`, `ms/wallpaper_fabric` |
| Z.985 `M.plaster` | 1 | Putz | Innen/Außen | D | hoch | ERLEDIGT: `ms/wall_plaster` |
| Z.988 `M.block`, Z.995 `M.concrete` | 2 | Betonstein/Beton | Amt, Keller, Mauern | D | hoch | ERLEDIGT: `ms/wall_damaged` |
| Z.1000 `M.bark` | 1 | Rinde | Bäume, Schaukelast | D | mittel | ERLEDIGT: `gruen.js:250` → `ms/bark` |
| Z.1004 `M.ash` | 1 | Asche/Ruß-Boden (Brandstelle Haus Nr. 5, c2Room-Böden) | Brandhaus, Amt-Räume | D | mittel | Scan: `ms/asphalt_debris` + [GR] (Ruß), oder `wall_damaged` dunkel getönt (wie `innen_kapitel.js:230`) |
| Z.1007 `M.fabric`/`fabricMat`/`M.cloth` | 1 | Stoffgewebe (Decken, Vorhänge, Teppich, Polster) | Innenräume | D | mittel | `ms/curtain_retro` / `ms/sofa`-Stoff (b/n/orm aus Modell extrahieren) |
| Z.1013 `M.wood` | 1 | Holz allgemein (Möbel, Zaun, Pfosten) | überall | D | hoch | `ms/planks_painted` / `ms/floor_wood` als Oberfläche via `msSurf` (derzeit nirgends umgestellt) |
| Z.1025 `curtainTex` | 1 | warmes Fensterlicht hinter Vorhang (Emissiv) | Häuser nachts | D/E | mittel | `ms/curtain_sheer` als Emissiv-Maske; sonst [TECH] |
| Z.1184 `cookie` | 1 | Taschenlampen-Lichtmuster | Spieler | E | – | [TECH] |
| Z.1249 `numberSign` | n (je Haus) | Hausnummernschild (Georgia-Ziffer auf dunkler Platte) | Ahornstraße | A | mittel | Emaille-Hausnummer: `rust_sheet` + Aufdruck, oder `roadsigns`-Blech |
| Z.1296 `gd` | 1 | Garagentor (Riffelung, Rostflecken, Rauschen) | Garagen im Dorf | D | mittel | `ms/garagedoor` (Scan vorhanden, ungenutzt?) |
| Z.1389 `newspaper` | 1 | Zeitung „DER LATERNENBOTE – Dritte Vermisste in diesem Jahr" | Wohnung Nr. 7 (Tisch) | A | hoch | [PS] Zeitungspapier + Zeitungsschrift (z. B. IM Fell/Cormorant) + Halbton-Foto |
| Z.1392 `tvCanvas`/`tvTex` | 1 | Fernseher-Rauschen/Bild 96×72 (dynamisch) | Wohnzimmer | E | mittel | [TECH] (Scan `ms/crt` für Gehäuse; Bildschirm bleibt dynamisch) |
| Z.1417 `calendar` | 1 | Wandkalender OKTOBER (Zahlen, Kopf braun) | Wohnung | A | mittel | [PS] + Kalender-Layout; Handschrift Caveat |
| Z.1428 (unbenannt) | 1 | Haarrisse neben dem Tastenfeld (rissartige Linien) | Wand Keller Nr. 7 | C | mittel | [RISS] (Megascans „Cracks") |
| Z.1452 `familyPhoto` | 1 | Familienfoto im Rahmen (verwaschene Figuren, Blur) | Wohnung (Wand) | B | hoch | [FO] (Ingame-Foto der echten Figuren, wie `polaroid/*.jpg`); Rahmen `ms/frame_deco` |
| Z.1471 `crayon` | 1 | Buntstift-Kinderzeichnung | Kinderzimmer / `r1Items.zeichnung` Z.4267 | B | hoch | Kinderzeichnung: gescanntes Kinderpapier + Wachsmalfarben-Strichbrush (handgemalt, kein Primitiv); alternativ echte Zeichnung als Bild-Asset |
| Z.1524 `draw` | 1 | Wand mit 30 Kinderzeichnungen + roter Schrift „SIE NEHMEN NUR DIE…" (`B.wallArt`) | Hildes Keller | B | hoch | ERLEDIGT: `fotos.js:70` ersetzt die Textur durch die Foto-Indizienwand; Rückfall bleibt |
| Z.1546 `poolTex` | 1 | Lichtpool (Radialverlauf) | Laternen | E | – | [TECH] |
| Z.1742 `leaf` | 1 | Laubblatt-Alphakarte | Straßenlaub | D | gering | `assets/leaves`, `ms/w_leaves` |
| Z.1757 `gt` | 1 | Grasbüschel (gemalte Halme, Alpha) | Wiesen | D | gering | `ms/wildgrass1`, `ms/w_grasspack` |
| Z.1775 `scorch` | 1 | Brandfleck am Boden (Haus Nr. 5) | Brandstelle | C | mittel | [GR] Ruß + `asphalt_debris`; Megascans „Burnt Ground"-Decal |
| Z.1791 | 1 | Ortsschild „Lost Eyengless – Einwohner: 214" | Dorfeingang | A | hoch | `strasse.js:307` baut Ortstafel; hier prüfen, ob Dublette → `ms/roadsigns`-Blech + Aufdruck |
| Z.1842 `sign` | 1 | Schild „TELEFON" (gelber Streifen, leuchtend) | Telefonzelle | A | mittel | `strasse.js:341` hat eigene Version (Dublette prüfen); Emaille-Scan |
| Z.1908/1913/1917 `height`/`albedo`/`rough` | 3 | UFO-Rumpf: Panelfugen, Nieten, Schmutz (2048²) | UFO-Auftritt Kap. 1 | D | hoch | Fab/Megascans Sci-Fi-/Alu-Panel (b/n/orm) auf Lathe-Rumpf; sonst `rust_sheet` zu Metall getönt |
| Z.1926 `slitTex` | 1 | umlaufende Lichtschlitze | UFO | E | mittel | [TECH] |
| Z.1933 `irisTex` | 1 | pulsierende Iris an UFO-Unterseite | UFO | E | – | [TECH] |
| Z.1956 `fogTex` | 1 | Nebel-/Dunstsprite | UFO | E | – | [TECH] |
| Z.2524 `polaroidCanvas` | 1 (je Foto) | Polaroid-Rahmen mit Foto (assets/polaroid/*.jpg) + Beschriftung | Fibel/Polaroids | B | hoch | Foto ERLEDIGT (`assets/polaroid`); Rahmen/Sofortbildpapier → [PS] Sofortbild-Scan |
| Z.2539 `flameTex` | 1 | Kerzenflamme | Kerzen | E | – | [TECH] |
| Z.2552 `chalkTex` | 1 | Kreidepfeile (Kinderhand, verwaschen) | Straße/Wege | C | hoch | [KR] |
| Z.2611 `eighthFigure` | 1 | achtes Strichmännchen in Rot (Kinderzimmerwand) | Kinderzimmer Nr. 1 | C | hoch | [KR]/rote Wachsmalkreide-Scan; Strich handgesetzt |
| Z.3065 `eyeTex` | 1 | leuchtende Augenpaare im Dunkeln | Wald/Dorf | E | – | [TECH] |
| Z.3072 `silTex` | 1 | Silhouette hinter Fenster | Fenster Nachtszenen | E | gering | [TECH] |
| Z.3079 `drawFace` | 2+ (pale/…) | gemalte Gesichter (Hilde, blasses Gesicht), Körnung | Fernseher/Bilder/Rückfälle | B | mittel | wird teils durch `kino_grauPortrait` (3D-Render) ersetzt; Rest → Figuren-Render [FO] |
| Z.3657 `tunnelSign` | 1 | Schild „AMT FÜR RÜCKFÜHRUNG – Außenstelle … Ebene −2" | Tunnel | A | hoch | `amt.js:188` überschreibt (Emaille); Basis = Rückfall |
| Z.3678 `boardTex` | 1 (dyn.) | Ordnungstafel „REIHENFOLGE DER RÜCKFÜHRUNG" (7 Plätze) | Amt | A | hoch | Tafel: Schiefer-/Metalltafel-Scan + Kreide [KR]; dynamisch bleibt Canvas |
| Z.3752 (Spinnweben) | 6 | Spinnweben-Alphakarten | Amt-Räume (Spinnenraum) | D | mittel | `assets/cobwebs` (Scan vorhanden) |
| Z.3875 `tag` | 8 | Namensschilder der acht Stühle | Amt | A | mittel | Messing/Emaille-Mini-Schilder, [PS] Klebeetikett |
| Z.3886 `noteSheet` | 1 | Notenblatt „Lucys Lied (Spieluhr)" | Klavier (Amt) | A | mittel | [PS] Notenpapier + Notenfont |
| Z.4078 `chronTex` | 1 | Chronik-Tafel „GEMEINDE LOST EYENGLESS" (Kreuzung) | Kreuzung | A/B | hoch | Tafel-Scan (`ms/parksign`/Holztafel) + Schriftsatz; Bildfelder → [FO] |
| Z.4092 | 1 | Aufkleber „AMT F. RÜCKFÜHRUNG – FUNK · NICHT ÖFFNEN" | Funkkasten | A | gering | [PS] Klebeetikett |
| Z.4118 | n (je Kasten) | Schildchen „Nr. n" an Stromkästen | Straße | A | gering | Emaille/Klebeband |
| Z.4265 `kalender` | 1 | Kalender JULI 2009 | Zimmer (r1Items) | A | mittel | [PS] |
| Z.4267 `karte` | 1 | Glückwunschkarte „ALLES GUTE! 10" | Zimmer (r1Items) | A | mittel | [PS] Karton-Scan + Handschrift |
| Z.4272 `r1Panel` | 1 | Tafel „Was gehört nicht in diese Nacht?" | Tür (r1) | A | mittel | Schild-/Papier-Scan |
| Z.4297 `clockTex` | 1 (dyn.) | Zifferblatt-Uhr (Hildes Wanduhr) | Wohnung | B | mittel | `ms/wallclock` Zifferblatt + dynamische Zeiger |
| Z.4421 (Points-Map) | 1 | Partikelsprite | Wetter/Staub | E | – | [TECH] |
| Z.4431 `bloodTex` | 2+ (Lache, Spritzer) | Blutlache, Spritzer/Streifen auf Asphalt | Straße (Gewalt-/Todesszene) | C | hoch | [BL] (`blood_s1/s2/hv`) per `msSurfMat({alpha:true})` – hier noch Canvas |
| Z.4772 `moteTex` | 1 | Staubpartikel | Lichtkegel | E | – | [TECH] |
| Z.6020 | 1 | Hilfs-Canvas für Texturanalyse (Perf) | – | E | – | [TECH] |
| Himmel Z.1102 (`skyMat` ShaderMaterial, fbm-Wolken) | – | Nachthimmel/Wolken | überall | D | hoch | Shader-„Bild": optional HDRI-Nachthimmel (Fab/Poly Haven CC0) oder Sterne-/Wolken-Photo-Dome; sonst [TECH] |
| Z.1857 `fogMat`, Z.1537 `coneMat`, Z.1938 (Shader) | – | Bodennebel, Lichtkegel, UFO-Strahl | überall | E | – | [TECH] |

### app/mods/amt.js (58 Treffer-Zeilen) – Amt für Rückführung, Ebene −2 (Kap. 2+)

Hinweis: `amt_papier` (Z.48) ist der gemeinsame Papier-Generator (Flecken, Knick, Kaffee). Ihn einmal auf [PS] umzustellen verbessert 13 Dokumente.

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.46/48 `amt_cv`, `amt_papier`, `amt_papierNeu` Z.114 | 0 | Werkzeug/Papier-Generator | Amt | A | – | [PS] Basis tauschen |
| Z.188 `c` | 1 | Emailleschild „Bundesstelle" am Tunnel (grün, Rand) | Tunnel zum Amt | A | hoch | Emaille-Scan (`rust_sheet` + Aufdruck) |
| Z.197 `da`, Z.284 `da2`, Z.435 `da4` | 3 | Dienstanweisungen (gerahmt/Nordwand/grau 1992, Special Elite, Seilers Handschrift) | Amt Empfang/Nordwand | A | hoch | [PS] Durchschlagpapier + Schreibmaschinen-Font; Rahmen `ms/frame_deco` |
| Z.205 `warte` | 1 | „WARTEBEREICH – Bitte warten Sie…" | Warteraum | A | mittel | Schild-Scan/[PS] |
| Z.208/211 `uhr`, `zeiger` | 2 | Bahnhofsuhr Zifferblatt + Zeiger | Tunnel, Archiv, Messraumtür | B | mittel | `ms/wallclock` |
| Z.218 `auto` | 1 | Nummernautomat Front (Verlauf, Knopf, Schlitz) | Südwand Warteraum | D | mittel | Metall-Scan (`rust_sheet`/`metaltable`) + Beschriftung |
| Z.224 `zettel` | 1 | Nummernzettel | Warteraum | A | mittel | [PS] |
| Z.226 `krz` | 1 | drei parallele Kratzer in Kinderhöhe (Beobachter) | Nähe Nummernautomat | C | hoch | [RISS] (Wandkratzer-Decal) |
| Z.231 `lk` | 1 | Lautsprecher-Kasten-Front (Gitterlinien) | alle Räume | D | gering | Scan Lautsprecher (`ms/radio` Frontbespannung) |
| Z.233 `spz` | 1 | Speicherzettel (Caveat, blau) | erster Lautsprecher | A | mittel | [PS] + Handschrift |
| Z.251 `haende` (Maske) + Z.254 `bt` | 1 | Handabdrücke an der Wand (2048×192-Maske) | Amt-Wand (Hände) | C | hoch | ERLEDIGT: Farbe/Relief aus `ms/blood_hv` (Z.237–254), Canvas nur noch als Formmaske |
| Z.262 `amt_rauchmelder` | 1 | Rauchmelder (Scheibe) | Decken | D | gering | Scan-Rauchmelder (nicht vorhanden) – ok als Decal; [TECH] |
| Z.278 `pc` (`amt_papierNeu`) | 1 (dyn.) | Papierblatt, das beschrieben wird | Schreibtisch | A | mittel | [PS] |
| Z.291 `post` | 1 | Post-it-Krieg an Ordnungstafel (gelbe Zettel) | Ordnungstafel | A | mittel | Post-it-Scan/-Foto + Handschrift |
| Z.297 `gd` | 1 | Aktendeckel „GRÜNDUNG" (Karton-Look) | Schrank oben | A | mittel | [PS] Karton/Aktendeckel |
| Z.303 `kopf`, Z.305 `streifen` | 2 | Aktenvernichter-Aufkleber, Papierstreifen | Aktenvernichter | A/D | gering | [PS] |
| Z.309 `kal`, Z.359 `kal` | 2 | Wandkalender MÄRZ 2012 (2×) | Amt | A | mittel | [PS] Kalenderblatt |
| Z.311 `stapel` | 1 | Papierstapel auf Schränken | Archiv | D | gering | Scan-Papierstapel / `grime` |
| Z.324 `schild`, Z.378, Z.466 `ps`, Z.455 `ks` | 4 | Schilder KANTINE / HÄNGEREGISTRATUR / PLANUNG / KÜHLUNG (Email-Look) | Kantine, Archiv, Kühlraum | A | mittel | Emaille-Scan-Basis (ein gemeinsamer Hintergrund + Text) |
| Z.331 `kz` | 1 | Kantinenzettel „Wer meinen Joghurt nimmt…" | Kantine | A | mittel | [PS] + Handschrift |
| Z.337 `disp` | 1 | Display „ENTKALKEN" (grün) | Kaffeemaschine | E | gering | [TECH] |
| Z.346 `brett` | 1 | Schwarzes Brett (Kork) 1024×640 | Nordwand | D | hoch | Kork-Scan (neu); Zettel darauf [PS] |
| Z.355 `aus` | 1 | Speiseplan Woche 31 | Kantine | A | mittel | [PS] |
| Z.366 `ring` | 1 | Kaffeering-Decal | Schreibtisch | C | gering | [GR] |
| Z.380 `kreide` | 1 | Kreide „Alle siebzehn." | Archiv | C | hoch | [KR] |
| Z.382 `schloss` | 1 | Magnetschloss/Metallplatte | Kühlregal | D | gering | Metall-Scan |
| Z.389 `mappen` | 1 | Hängemappen-Reiter 40 Stück (1958–2009) | Hängeregistratur | D | mittel | Scan Karteireiter / `ms/shelf`-Aktenordner |
| Z.398 (Sommerfest-Fotos) | 4 | vier alte, unscharfe Fotos „Kinder mit Lampions" mit Rückseitenschrift | Hängeregistratur | B | hoch | [FO] Ingame-Fotos der Kinder, Sepia/Korn-Postprocess (`n4_sepia`-Technik) |
| Z.429 `funkLed` | 1 | grüne LED | Funkgerät | E | – | [TECH] |
| Z.441 `auf` | 1 | Aufkleber „Bei Stromausfall bitte Ruhe bewahren…" | Kasten | A | gering | [PS] Klebeetikett |
| Z.449 `glas`, Z.452 `kuehlBeschlag` | 2 | Glastür-Reflex, Beschlag | Kühlregal | E | gering | [TECH] |
| Z.475 `pl` | 1 | Grundplatte Stadtmodell (gemalte Straßen, Kuppel „OBJEKT") 1024×640 | Planungsraum | B | hoch | Modellbau-Scan (Grünflocken) + Luftbild-Karte aus Weltdaten; Straßen aus `karte.js`-Daten |
| Z.487 `pfand` | 1 | „Pfand hier abgeben" | Kantine | A | gering | [PS] |
| Z.490/493 `figur`, `hildeFig` | 4 | Pappfiguren Hilde/Luke/DREIPUNKT/Eisen (Silhouette in Flachfarbe) | Stadtmodell | B | mittel | Figuren-Render [FO] auf Pappe |
| Z.496 `ms`, Z.498 `reim` | 2 | Messingband, Reim in Handschrift | Stadtmodell | A | mittel | Messing-Scan; Handschrift auf [PS] |
| Z.504 `plaene` | 1 | vier Zyklus-Pläne 1958–2009 (Linienzeichnungen) | Planungsraum | A/B | mittel | [PS] + Plan-Scan (Blaupause) |
| Z.511 `foto` | 1 | Foto mit Figuren (weißer Rand) | Planungsraum | B | hoch | [FO] |
| Z.518 `krepp` | 1 | Kreppband „Do." an Dosen | Tür | A | gering | Kreppband-Scan |
| Z.523 `kk` | 1 | Karteikasten-Etikett „VERSUCHSREIHE K" | Amt | A | gering | [PS] |
| Z.545 `bb` | 1 | Butterbrotpapier (gefaltet) | vor Schrank | D | mittel | Scan Papier/Pergament (`ms/w_brot`?) |
| Z.558 `z8` | 1 | Kinderzeichnung vor leerem Stuhl: Strichmännchen, „PAPA + ICH", halber Mond | Amt-Stuhlreihe | B | hoch | Kinderzeichnung auf Papier-Scan, Wachsmalbrush; identisch zu `kino.js:278` – ein Asset |
| Z.566 `fed` | 1 | schwarze Feder (Decal) | Kerbe in Stuhl | C | mittel | Feder-Scan (nicht vorhanden; `w_*` suchen) |
| Z.574 `nl` | 1 | Notlicht-Piktogramm | Decke | A | gering | Emaille/Schild-Scan |
| Z.653 (Decal) | 1 | drei Kratzstriche am Boden | Amt Boden | C | gering | [RISS] |
| Z.754 `amt_zeichen` | 1 | ∴ in den Putz geritzt | Tunnel | C | mittel | [RISS] + Normal-Ritzung (Technik wie `zeichen.js`) |
| Z.775 `bb` | 1 | Bonbonpapier-Decal (grün/weiß) | Amt/Boden | C | gering | Scan Bonbonpapier (klein) / [TECH] |
| Z.840 `amt_akte08Foto` | 1 | Foto Akte 08: Junge mit braunen Augen, Handschuh auf der Schulter | Akte 08 | B | hoch | [FO] Ingame-Foto der Figur (Zayn/Luke-Render) mit Korn/Vignette |

### app/mods/kapitel1.js (27 Treffer-Zeilen + Helfer `kapitel1_cnv` 24×) – Kapitel 1 (Ahornstraße, Nr. 7, Keller)

`kapitel1_papier` (5 Aufrufe) und `kapitel1_kreideStrich`/`_wachs`/`_kritzel`/`_verwaschen` sind die Papier- und Strich-Generatoren.

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.21 `kapitel1_cnv` | 0 | Werkzeug | – | E | – | [TECH] |
| Z.43 `weiss` | 1 | weiße Kinderkreide-Pfeile vom Ortsschild nach Osten | Straße Dorfeingang | C | hoch | [KR] |
| Z.46 `blau` | 1 | Lucys blaue Pfeile (Kreis am Schaft) Nr. 7 → Kirchweg → Haltestelle | Straße/Gehweg | C | hoch | blaue Sprühkreide/Spray-Decal (Scan Spraypaint auf Asphalt, [GF]-Korn) |
| Z.50 `huf` | 1 | Hufeisen über jeder Haustür | Haustüren | C | mittel | Eisen/Rost-Scan (`rust_sheet`) als Decal; echtes Hufeisenmodell falls vorhanden |
| Z.57 | 1 | Lunas Hüpfkästchen mit 17 Feldern (weiße Kreide, halb verwaschen) | Gehweg Kreuzung | C | hoch | [KR] auf `ms/pavement` |
| Z.61 | 1 | Martinslaterne, Kinderkreide | Gehweg vor Nr. 7 | C | hoch | [KR] |
| Z.66 | 1 | Stiefelabdruck mit Platten im Matsch | unter Laterne Ostende | C | mittel | Fußspur-Scan (Megascans „Footprint in mud") |
| Z.70 `glow` | 1 | rotes Glimmen im Astloch (Kamera-Standby) | Nr. 9 | E | mittel | [TECH] |
| Z.80 `marke` | 1 | Marke „BfR VERWALTUNG 03" (Metall-/Plastikmarke) | Nr. 7 | A | mittel | Metall-Scan + Prägung |
| Z.90 `foto` | 1 | Foto „Laternenfest 2008" am Kühlschrank (lädt `polaroid/zayn.jpg`, sepia) | Küche Nr. 7 | B | hoch | Foto ERLEDIGT (Scan-JPG), Rahmen/Papier → [PS] |
| Z.93 `mag` | 1 | Magnet Kaninchenzüchterverein | Kühlschrank | B | gering | kleines Magnet-Bild / [TECH] |
| Z.97 `fridgeNote` | 1 | Zettel „31.10." am Kühlschrank (Handschrift) | Küche | A | hoch | [PS] + Handschrift |
| Z.101/105 `kt`,`em` | 2 | Tastenfeld-Blech, zwölf Tasten, Display | Keller-Tür | D | hoch | Metall-Scan (`rust_sheet`) + Tastenbeschriftung; Display bleibt [TECH] |
| Z.108 | 1 | Etikett „BITTE NICHT HÄMMERN" (Prägegerät) | über Tastenfeld | A | mittel | Dymo-Prägeband-Scan/ [PS] |
| Z.115 | 1 | Lucys Zettel „Großer, falls ich nicht heimkomme" | Flur-Anrichte | A | hoch | [PS] + Handschrift (Gochi Hand/Caveat) |
| Z.119 | 1 | Keller-Schild am Gurtstuhl | Keller | A | mittel | Schild-Scan |
| Z.125 | 1 | Oma Ernas Zettel „Hilde, Deine Kassetten sind…" | Keller | A | hoch | [PS] |
| Z.128 | 1 | Zettel „Für Großer. Erst hören, dann heim. – L." | Keller | A | hoch | [PS] |
| Z.130 | 1 | Hildes Strichliste (Kreide, 9 Gruppen) | Kellerwand | C | hoch | [KR]/Bleistift-Strich auf `wall_plaster` |
| Z.133 | 1 | Jahreszahlen 1958 1975 1992 2009 | Kellerwand | C | hoch | Kohle/Kreide-Decal [KR] |
| Z.139/147 `kapitel1_polaCanvas`, `polaStuhl` | 2 | Polaroid auf dem Gurtstuhl: Mädchen in blauem Kleid, grau, ohne Mund | Keller | B | hoch | [FO] (gerendertes Foto Lucy, entsättigt) + Sofortbild-Rahmen [PS] |
| Z.167 | 1 | Kinderzimmer-Wand Nr. 1: 58 Wachsmalkreide-Zeichnungen (2048×1024) | Kinderzimmer Nr. 1 | B | hoch | ERLEDIGT (Wand durch `fotos.js` als Indizienwand getauscht); Rückfall bleibt |
| Z.212 `T.cv` | 1 (dyn.) | Fernseher-Gesichtsbild 256×192 | Wohnzimmer TV | B | mittel | TV-Gesicht aus 3D-Render (`kino_tvGesicht`), [TECH] |
| Z.241 `kapitel1_fussspuren` | 1 | Fußspuren (64×128) | Boden | C | mittel | Fußspur-Scan (Matsch/Staub) |
| Z.493 `m.map` | 1 | weiche Staubpartikel im Strahl | UFO | E | – | [TECH] |

### app/mods/kino.js (21 Treffer-Zeilen) – Kellerszenen / Kino-Sequenzen (Kap. 1–3)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.265 `kino_glowTex` | 1 | Leuchtsprites (Flamme, Schein) | Kerzen/Lampen | E | – | [TECH] |
| Z.278 `kino_tex_papa` | 1 | Kinderzeichnung vor dem achten Stuhl: „PAPA + ICH", halber Mond | Keller | B | hoch | wie `amt.js:558`: ein gemeinsames Kinderzeichnungs-Asset |
| Z.291 `kino_tex_hand` | 1 | helle Hand (verwischt) | Szenen-Decal | C | hoch | Handabdruck-Decal Scan (nass/Staub) oder `blood_hv`-Maske wie `amt.js:251` |
| Z.293 `kino_tex_shadow` | 1 | weicher Schatten | Szene | E | – | [TECH] |
| Z.295 `kino_tex_wet` | 1 | nasse Stelle | Boden | C | mittel | [GR] (Wasser) |
| Z.297 `kino_tex_ring` | 1 | Ring/Fleck (Rauschen, Ablagerung) 256² | Boden/Tisch | C | gering | [GR] |
| Z.300 `kino_tex_brille` | 1 | Hildes Lesebrille an Perlenkette, ein Glas gesprungen (Aufsicht, 1024²) | Keller | B | hoch | Modell `ms/brille` ist vorhanden → Canvas nur noch Rückfall; Riss-Overlay [RISS] |
| Z.321 `kino_tex_zeichnung` | 1 | Kellerwand-Zeichnung: Mädchen mit Laterne, „LUKE, 9" | Keller | B | hoch | Kinderzeichnung (siehe oben) auf [PS] |
| Z.329 `kino_tex_feder` | 1 | schwarze Feder | Szene | C | mittel | Feder-Scan |
| Z.333 `kino_tex_band` | 1 | weißes Band/Absperrband | Szene | D | mittel | Absperrband-Scan/ [PS] |
| Z.336 `kino_tex_brand` | 1 | Brand-/Ruß-Spuren | Szene | C | mittel | [GR] Ruß |
| Z.444 `kino_grauPortrait` | 1 | 3D-Render des grauen Gesichts → Canvas (für TV/Bilder) | Fernseher/Bilder | B | hoch | ERLEDIGT (echtes Modell gerendert) |
| Z.472 `kino_tvGesicht`/`tvRausch` | 2 (dyn.) | TV-Gesicht mit Zeilen, Vignette, Rauschen | Fernseher | E | mittel | [TECH] (Röhren-Look, Scan `ms/crt` fürs Gehäuse) |
| Z.491/492 `mk` | n | Schild-Texturen aus Originalschild (Aufdruck über Scan-Blech) | Straße/Schild | A | mittel | ERLEDIGT-Prinzip (Scan als Basis + Aufdruck) |
| Z.590 | 1 | Beschlag am Glas (weicher Hof, Tropfen) | Glas/Scheibe | E/C | gering | [TECH] / [GR] |
| Z.598 `kino_polaBack` | 1 | Rückseite des Polaroids „2043" mit Schrift | Polaroid | A | mittel | [PS] Sofortbild-Rückseite + Handschrift |
| Z.1211 `auge` | 1 | Auge-Decal am Kopf (dunkel) | Figur | B | mittel | [TECH] (Kopf-Modell) |
| Z.1213 `tag` | 1 | gelbes Anhänger-Schildchen „AYDIN · DE 0917" | Figur/Schlüsselanhänger | A | mittel | Plastik-/Metallanhänger-Scan + Aufdruck |
| Z.1223 `rauch` | 1 | Dampf/Rauch | Szene | E | – | [TECH] |
| Z.1226 `riss` | 1 | große Wandrisse (3,4×3,4 m) | Wand | C | hoch | [RISS] (Megascans „Wall Crack Decals") |

### app/mods/strasse.js (19 Treffer-Zeilen + `canvasTex`) – Straße, Kreuzung, Telefonzelle, Ortstafeln (Kap. 1+)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.54–57 | n | Texturen aus `assets/ms/…` auf Canvas (Skalierung) | – | E | – | ERLEDIGT-Basis (Scan) |
| Z.103 `im` | 1 | Parkverbotsschild → Gemeindeschild (Text auf Scan-Blech) | Straße | A | mittel | ERLEDIGT-Prinzip (Scan + Aufdruck) |
| Z.131 `plateTex` | 1 (je Kennzeichen) | deutsche Kfz-Kennzeichen „BH …" | geparkte Autos | A | mittel | Kennzeichen-Foto/Scan (EU-Schriftsatz „FE-Schrift") |
| Z.227 `envMat` | 1 | Briefumschlag/Papier (Karton) | Briefkasten | A | mittel | [PS] |
| Z.307/315 `plateMat`,`zus` | 3 | Ortstafel „Lost Eyengless" (gelb, Rückseite rot durchgestrichen), Zusatzschild | Ortseingang/-ausgang | A | hoch | Emaille-Scan (`ms/roadsigns`) + Schrift |
| Z.341 `signTex` | 1 | „TELEFON"-Schild | Telefonzelle | A | mittel | Emaille-Scan + Schrift |
| Z.346 `glassTex`, Z.350 `handTex` | 2 | Glasreflex, Handabdrücke an Scheibe | Telefonzelle | E/C | mittel | [GR]/Handabdruck-Scan |
| Z.365 `face` | 1 | Telefon-Frontplatte/Anzeige (Gesicht/Wählscheibe) | Telefonzelle | D | mittel | Scan `ms/w_telefon` (Modell vorhanden) |
| Z.374 `noteTex` | 1 | Zettel „Vegas 3 17" | Telefonzelle | A | mittel | [PS] |
| Z.379 `st` | 1 | Notruf-Aufkleber „NOTRUF Polizei 110 Feuerwehr 112" | Telefonzelle | A | gering | Schild-Scan/ [PS] |
| Z.393 `blob` | 1 | dunkler Fleck/Pfütze (Deko) | Boden | C | gering | [GR] |
| Z.401 `sk` | 1 | Schleifspuren/Schlieren (128×1024) | Boden/Glas | C | mittel | [GR]/Reifenspuren-Scan |
| Z.416 `ch` | 1 | Kreidestriche neben Hydrant (7 + 1) | Kreuzung | C | hoch | [KR] |
| Z.454 `posterTex` | 4 | Plakate: Hund entlaufen (BRUNO), VERMISST Mike K., Laternenfest (FÄLLT AUS), Bürgerversammlung | Straße/Anschlagsäulen | A/B | hoch | [PS] Plakatpapier (zerrissen, nass) + Fotos [FO]; Layout bleibt |

### app/mods/zeichen.js (16 Treffer-Zeilen) – Symbole, Graffiti, Wandbild (X-7)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.75 `zeichen_cv` | 0 | Werkzeug | – | E | – | [TECH] |
| Z.136 `zeichen_stil`, Z.140 `hoehe` | 1 Atlas (2048², Farbe+Alpha) | Kreide/Ritzungen/Brandzeichen/Graffiti-Zellen mit Höhenkarte + Normalmap | Ort, Kirchberg, Schrebergärten, Hof, Villenmauer, Tunnel, Kanalstadt, Wald | C | hoch | Graffiti-Zellen ERLEDIGT teilweise: `graffiti_echt` Tags/Farbe + Korn/Poren (Z.240ff); Kreide → [KR]; Ritzungen/Brand bleiben prozedural mit Normalmap (sinnvoll) |
| Z.163 `zeichen_piece` | n | Graffiti-Einzelteile (Schriftzüge in Sprühfarbe) | Wände | C | hoch | ERLEDIGT-teilweise ([GF]) |
| Z.249/259/264 | 2 | Atlas A + Höhe + Normalmap | – | C | hoch | s. o. |
| Z.365 `zeichen_wandMalen` | 1 (2048×736) | Wandbild „Unser Dorf" (Klasse 3b, 1976) mit Figuren, Häusern, Schrift | Mauer neben Haltestelle Kirchberg | B | hoch | Zeichnung bleibt Motiv, aber „Farbe auf Putz": [GF]-Korn, Verwitterung [GR], Risse [RISS] (Z.436 macht das schon: Entsättigung, Risse, Algen, Regenschlieren) |
| Z.384 `ov` | 1 | blaue Folie (260×520) im Wandbild | Wandbild | B | gering | – |
| Z.436 `mk` | 1 | Alterung Wandbild | Wandbild | C | mittel | ERLEDIGT-Prinzip |
| Z.456–458 | 2 | Wandbild Höhe → Normalmap | Wandbild | D | gering | [TECH] |
| Z.466 `c` | 1 | Wandbild-URL (Canvas → Bild) | Wandbild | B | – | – |
| Z.480–490 `zeichen_nazcaTex` | 2 | Scharrbild (Nazca-Linie) im Waldboden: freigelegte Erde, Laubränder, Normalmap | Wald vor Hochsitz (Kap. 6) | D | hoch | `assets/forestfloor` + `ms/w_*`-Erde; Furche als Decal mit Scan-Normal (derzeit prozedural 256²) |

### app/mods/ausbau_ost_west.js (15 Treffer-Zeilen) – Ost/West-Ausbau (Kiosk, Nachtschalter, Schrottplatz, Vereinsplatz, Kirchweg)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.30 `canvasTex` | 0 | Werkzeug | – | E | – | [TECH] |
| Z.123 `fasciaTx` | 1 | Leuchtband über Kiosk (Schrift auf rostigem Blech) | Kiosk | A/D | mittel | `rust_sheet` + Leuchtschrift |
| Z.152 `calTx` | 1 | Kalender OKTOBER 2009 | Nachtschalter | A | mittel | [PS] |
| Z.158 `bookTx` | 1 | Kassenbuch (offen) | Nachtschalter | A | mittel | [PS] Buchseiten-Scan (`w_buch`) |
| Z.166 `outTx` | 1 | Schild „AUSSER BETRIEB seit 1.11.2009" | Nachtschalter | A | mittel | Schild-Scan/ [PS] |
| Z.174 `signTx` | 1 | altes Leuchtschild (eigener Aufdruck auf Scan-Blech) | Straße | A | mittel | ERLEDIGT-Prinzip |
| Z.204 `plateTx` | 1 | Schild „SCHROTT · KRANZ" (rostig) | Schrottplatz | A | mittel | `rust_sheet` + Aufdruck |
| Z.214 `blockTx` | 1 | Block „SPERRGEBIET" | Zufahrt | A | mittel | [PS] / Emaille |
| Z.262 `p7Tx` | 1 | Schild „Parzelle 7 Wendt" | Schrebergarten | A | mittel | Holz-Scan (`planks_painted`) + Schrift |
| Z.276 `boardTx` | 1 | Schwarzes Brett Vereinsplatz (Zettel) | Vereinsplatz | A | mittel | Kork-Scan + [PS] |
| Z.355 `chainTx` | 1 | Kette (Decal) | Tor | D | gering | `ms/w_kette` (Modell vorhanden) |
| Z.457 `footTx` | 1 | Fußabdruck | Boden | C | mittel | Fußspur-Scan |
| Z.589 `turm` | 1 | Turm über dem Abgrund, in Fundamentstein geritzt | Fundament | C | hoch | [RISS]/Ritzung + Normalmap wie `zeichen.js` |
| Z.606 `fisch` | 1 | oranger Fisch (Sprite) | Wasser | B | gering | [TECH]/Fischmodell |
| Z.611 | 1 | nasse Stelle/Fleck | Boden | C | gering | [GR] |

### app/mods/kiffen.js (14 Treffer-Zeilen) – Kiffen-Sequenz / Roxys Laube

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.107 `kf_cnv` | 0 | Werkzeug | – | E | – | [TECH] |
| Z.148 `kf_posterTex` (Dub, Band, Hanf, Reggae, Tanke) | 5 | Poster „KELLERDUB", Band „DIE NEBELKRÄHEN", Hanfblatt-Aufkleber, Reggae-Streifen, Aushang Tankstelle (Rauchwaren-Preise) | Tankstelle, Keller, Kneipe | A/B | hoch | [PS] Poster-/Kopierpapier + abgerissene Ecken; Motive bleiben handgesetzt (Marke „Kopierer-Look" ist bereits Absicht) |
| Z.155 `kf_texRauch`, Z.157 `kf_texGlow`, Z.158 `kf_texFlamme` | 3 | Rauch, Glut, Flamme | Kiffen | E | – | [TECH] |
| Z.160 `kf_texKruemel` | 1 | grüne Krümel | Hand/Joint | D | gering | Scan Tabak/Kraut-Krümel (Modell `ms/kiffen`) |
| Z.161 `kf_texEinsatz` | 1 | Grinder-Einsatz (Zähne, Blüte) | Grinder | D | gering | Modell `ms/kiffen` |
| Z.165 `kf_texPappe` | 1 | Pappe (1500 Fasern) | Filter/Tip | D | gering | Karton-Scan [PS] |
| Z.310 `hilde` | 1 | Nachbild: Hilde im Strahl | Wahn-Bild | E | – | [TECH] (bewusst unscharf) |
| Z.317 `peter` | 1 | Nachbild: Peter im Öl | – | E | – | [TECH] |
| Z.323 `grau` | 1 | Nachbild: graues Gesicht im Fernseher | – | E | – | [TECH] |
| Z.330 `nb` | 1 | Nachbild-Postprocess (Blur/Doppelbelichtung) | – | E | – | [TECH] |
| Z.708 `zt` | 1 | Zettel „Für schlechte Nächte. R." im Tütchen | Roxys Laube | A | hoch | [PS] liniertes Heftpapier + Handschrift |
| Z.791 | – | Feuerzeug-Modell (Material-Klon) | – | – | – | Modell `w_lighter` ERLEDIGT |

### app/mods/innen_kapitel.js (14 Treffer-Zeilen) – Innenräume Amt/Zelle/Gully (Kap. 2–4)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.77 `damp` | 1 | feuchter Fleck (Decal) | Amt-Wände | C | mittel | [GR] (Wasser) |
| Z.86 (Papier: Akten, Formulare, Kinderzeichnungen) | n | Papierblätter, 256×362 | Amt-Archiv | A/B | hoch | [PS] |
| Z.109 `photoMat` | 2 | unscharfe Fotografie, sepia, für Rahmen (`white`/`dark`) | Rahmen im Amt | B | mittel | [FO] |
| Z.151 `chalk`, Z.206 `chalk2` | 2 | Kreidestriche (gezählte Jahre); Spruch „Fang nie mit dem an, der schon leuchtet." | Amt/Zelle | C | hoch | [KR] |
| Z.174 `labelMat` | 1 | Namensschilder an Schubladen | Archivschränke | A | gering | Messing/[PS] |
| Z.204 `warn` | 1 | Schild „VORSICHT" (gelb, schwarz) | Amt | A | mittel | Warnschild-Scan (`ms/gas_signs`) |
| Z.241 `pc` (Peters Zelle) | n | Türschilder (Email + getipptes Schild mit Klebeband), „KRANZ, P. · Rückläufer…", Strichliste seit 1992 (Z.261), Kratzer-Canvas (Z.253), Tafel (Z.267), Fluchtplan (Z.281) | Peters Zelle W2-P5 | A/C | hoch | Schilder: Emaille-Scan; Kratzspuren [RISS]; Strichliste [KR]/Bleistift; Fluchtplan [PS] |
| Z.316 `grille` | 1 | Lüftungsgitter (Alphamap) | Wand | D | gering | `ms/ironfence_*` / Gitter-Scan |
| Z.361 `keys` | 1 | Klaviertasten (1024-Textur) | Klavier | D | mittel | `ms/w_spieluhr`/Klavier-Scan, sonst Elfenbein-Textur |
| Z.382 `plan` | 1 | Plan „PROTOKOLL SIEBZEHN – Platz 8: bleibt frei" | Wand Amt | A | hoch | [PS] Durchschlag + Stempel |
| Z.447 `glowTex`, Z.453 `steam` | 2 | Gully: Leuchten, Dampf | Gully | E | – | [TECH] |
| Z.460 `nc` | 1 (dyn.) | Röhrenmonitor: Schnee, Zeilen, Flackern | Amt | E | mittel | [TECH] (Gehäuse Scan `ms/crt`) |

### app/mods/karte.js (11 Treffer-Zeilen) – Lukes Bleistiftkarte (Fibel-Reiter)

Bleibt komplett prozedural: Das ist ein UI-Objekt (dynamische Karte aus Weltdaten).

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.23 `karte_korn`, Z.133–139 (Masken, Graphit), Z.197 | 4 | Bleistiftschraffur, Körnung, Konturen | Fibel/Karte | E | hoch | [TECH]; optional echtes Graphit-/Papierkorn-Overlay |
| Z.202 `PW` Papier | 1 | Karopapier (5 mm, blass blau) | Fibel/Karte | A | hoch | [PS] Karopapier-Scan als Untergrund, Karten-Zeichnung bleibt dynamisch |
| Z.234–251 (Nebel des Unbekannten, Zusammensetzen), Z.324 | 5 | Maske/Compositing | Karte | E | – | [TECH] |

### app/mods/villa.js (26 Aufrufe `villa_cv`/`villa_zettel`) – Villa Wendt/Forschungsetage (Kap. 4+)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.97/101/106 `villa_cv`, `villa_papierCv`, `villa_zettel` (10 Aufrufe) | 10 | Papier-/Schild-Zettel mit Text (Decal) | Villa | A | hoch | [PS] zentral |
| Z.156 `alu` | 1 | Alufolie an den Fenstern | Südwand | D | mittel | Alufolie-Scan (zerknittert; Fab/ambientCG) |
| Z.159 | 1 | Poster Mondlandung „LÜGE" (Silhouette) | Wand | B | mittel | Poster-[PS] + Mond-Foto (gemeinfrei, NASA) |
| Z.191 | 1 | Ordnerstapel „(hw)" | Regal | D | gering | Scan Ordner |
| Z.194 | 1 | Gardine mit Loch | Fenster | D | mittel | `ms/curtain_retro` / `curtain_sheer` |
| Z.222 | 1 | Aktenschrank mit fünf Messingschildern 1941–2009 | Ostwand | A/D | mittel | Messing-Scan |
| Z.227 | 1 | Weltkarte (Westwand) mit neun Nadeln | Westwand | B | hoch | Weltkarte-Scan (Public Domain) + Nadel-Modell |
| Z.235 | 9 | neun Fotos der Weltkarten-Nadeln (160×200) | Westwand | B | mittel | [FO] |
| Z.244 | 1 | Asservatenkiste (Schablonenschrift „ASSERVAT 7/58", Siegel mit Auge) | unter Schreibtisch | A | mittel | Holz-Scan + Stempel-Decal |
| Z.262 `schild` | 1 | Messingschild | Tür | D | gering | Messing-Scan |
| Z.271 | 1 | Fenster zum Garten (Glas/Rahmen) | Ostwand | D | mittel | `ms/window` |
| Z.284/285 | 5 | Nummernleisten, Regalrücken | Zellengang | A/D | gering | [PS] |
| Z.293 | 1 | Holztür (senkrechte Bretter) | Zelle | D | mittel | `ms/door1`/`planks_painted` |
| Z.299/300 | 2 | Namensschild „HEINRICH"; Spiegel/Glas | Zelle | A | mittel | Schild-Scan; `ms/mirror` |
| Z.331 | 1 | Türschild „ZELLENGANG" | Schleuse | A | gering | Emaille |
| Z.335/336 | 2 | Gitterrost; Rahmen (Schleuse) | Schleuse | D | gering | Metall-Scan |
| Z.354 | 1 | Glasfleck | Fenster | C | gering | [GR] |
| Z.362 | 1 | Sicherungskasten (Front, Aufkleber) | Trennwand Kühlraum | D | mittel | Scan Sicherungskasten/ `rust_sheet` |
| Z.379 | 1 | Karte „K-3 · BRANDT, L. · Aufnahme nach Öffnung 2026" | Zettel Kühlraum | A | hoch | [PS] |
| Z.535 | 1 | Post unter dem Briefschlitz (16 Umschläge) | Z-07 | A/D | mittel | Umschlag-Scan [PS] |
| Z.633 | 1 | Foto „Grete" (300×360) fürs Album | Album | B | mittel | [FO] |
| Z.861 | 1 | große Papier-/Aktenfläche (512×680) | Akte/Plan | A | mittel | [PS] |

### app/mods/zimmer7.js (11 Aufrufe `cv`) – Zimmer 7 Wendt (Kap. 5)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.171 | 1 | Emailleschild „ZIMMER 7 · H. WENDT · ZÄHLUNG" | Türschild | A | hoch | Emaille-Scan + Aufdruck |
| Z.210 | 1 | Foto „Zayn, 2009" im Rahmen | Wand | B | hoch | [FO] `ms/frame_deco`/`frame_dmg` |
| Z.230 `docC` | 1 | Dokument (Beige) | Schreibtisch | A | mittel | [PS] |
| Z.238 | 1 | Dokument/Karte | Schreibtisch | A | mittel | [PS] |
| Z.243 `cork` | 1 | Pinnwand (Kork) mit Stadtplan | Westwand | D | hoch | Kork-Scan + Stadtplan [PS] |
| Z.263 `aushangC` | 1 | Aushang „Einwilligungen 2009 – vollständig" | Nordwand | A | hoch | [PS] |
| Z.278 `aushangRest` | 1 | Reste des Aushangs | Nordwand | A | gering | [PS] |
| Z.282 | 1 | Kalender Juli 2009 (1. eingekreist) | Südwand | A | mittel | [PS] |
| Z.287 `board` | 2 | Schlüsselbrett (mit/ohne Schlüssel) | Nordwand | D | mittel | Holz-Scan + Haken |
| Z.311 `pi` | 1 | Post-it „Do Amt." am Monitor | Monitor | A | mittel | Post-it-Scan |
| Z.320 `bord` | 1 | Pflanzen-/Fensterbank-Etikett | Fensterbank | A | gering | [PS] |

### app/mods/weiss.js (11 Aufrufe `weiss_cv`) – das Weiße (Kap. 7)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.34–48 | 8 | Flamme, Schein, Reif, Atem-Beschlag | Weißer Raum | E | – | [TECH] |
| Z.50 | 1 | Laternenpapier mit Buntstift-Kinderzeichnungen, Rippen quer | große Laterne | B | hoch | Papierlaterne-Scan (`ms/w_papierlaterne` vorhanden) + Kinderzeichnungen |
| Z.61 | 1 | Spiegelung im Visier: weißes Gesicht mit braunen Augen | Visier | B | mittel | 3D-Render des Gesichts [FO] / [TECH] |

### app/mods/kapitel5.js (19 Aufrufe `k5_cv`) – Kapitel 5 (Stall, Hildes Haus, Polaroid-Kamera)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.90 `k5_tFuss` | 1 | Fußspur | Boden | C | mittel | Fußspur-Scan |
| Z.94 `k5_tHasen` | 1 | Hasenspuren | Boden | C | gering | Tierspur-Scan |
| Z.97 `k5_tPfeil` | 1 | Pfeil (Kreide) | Boden/Wand | C | mittel | [KR] |
| Z.100 `k5_tZahn`, Z.101 `k5_tFeder`, Z.103 `k5_tHase` | 3 | Zahn, Feder, Hase-Zeichnung | Stall | C/B | mittel | Zahn/Feder: Scan; Hase: Kinderzeichnung [PS] |
| Z.106 `k5_tFilm` | 1 | „INSTANT FILM · 10 EXP · 1994" (Filmpackung) | Kamera-Zubehör | A | mittel | Verpackungs-Scan/ [PS] |
| Z.107 `k5_tKreide` | 1 | Kreide | Stall | C | hoch | [KR] |
| Z.114 `k5_tBrief` | 1 | Brief | Haus | A | hoch | [PS] + Handschrift |
| Z.115–118 `k5_tFlamme`, `k5_tSchein`, `k5_tErde` | 3 | Flamme, Schein, Erdspur | – | E/C | mittel | Erde: Erde-Scan; Rest [TECH] |
| Z.212 `gt` | 1 | Gras vom Tau auf Tellern | Gedeck | D | gering | `ms/w_grasspack` |
| Z.259 `o.fussGras` | 1 | Fußspur im Gras | Wiese | C | gering | – |
| Z.263 `c` | 3 | Familienfoto (drei Stufen: der Junge wird blasser) | Wohnzimmer | B | hoch | [FO] mit Abschwächungen als Shader |
| Z.271 `o.zettel` | 1 | Zettel auf Hildes Stuhl | Nr. 7 Wohnzimmer | A | hoch | [PS] |
| Z.274 `papier` | 1 | Papier (Fassung 3) | Haus | A | mittel | [PS] |
| Z.324 `o.kratzer` | 1 | Kratzer | Stall | C | hoch | [RISS] |

### app/mods/kapitel6.js (7 Aufrufe `k6_tex`) – Kapitel 6 (Wald, Spuren)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.51 `k6_footTex` | 1 | kleiner nackter Fuß im nassen Boden (Ferse, Ballen, fünf Zehen) | Wald | C | hoch | Fußspur-Scan (Kinderfuß: eher Fab „Footprint") |
| Z.57 `k6_handTex` | 1 | kleine Hand im Staub/Moos | Wald | C | hoch | Handabdruck-Scan |
| Z.61 `k6_hufTex` | 1 | gespaltener Huf, frisch | Wald (A-23) | C | hoch | Tierspur-Scan (Hirsch) – Wild-Assets vorhanden (`animal_deerdoe`) |
| Z.64 `k6_netzTex` | 1 | Eisennetz der Bergung (Rost) | Wald | D | mittel | `ms/rust_sheet`/Netz-Scan |
| Z.129 | 1 | Dienstmarke „3-4" (AG-20) | Figur | A | gering | Metall-Scan + Prägung |
| Z.667 `fb` | 1 | Farbfläche/Etikett | Wald | A | gering | [PS] |

### app/mods/neben4.js (8 Aufrufe `n4_cv`) – Nebenaufgabe 4 (Polaroid/Alter Abzug, Absperrband)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.64 `n4_cv` | 0 | Werkzeug | – | E | – | [TECH] |
| Z.74/78 `n4_pola` (4×) | 4 | Sofortbild-Anmutung: harter Blitz-Abfall, Korn, Vignette; `kreuzung.jpg` als Quelle | Polaroids | B | hoch | Foto ERLEDIGT (Scan-JPG von Ingame); Rahmen → [PS] Sofortbild-Rahmen |
| Z.84 `n4_sepia` (3×) | 3 | Alter Abzug 1941: Sepia, Korn, Kratzer, Zackenrand | altes Foto | B | hoch | [FO] mit Foto-Postprocess; Rand [PS] |
| Z.101 `im` | 1 | Kreuzungsfoto Variante | – | B | mittel | ERLEDIGT (JPG) |
| Z.115 `n4_rahmenTex` | 1 | Polaroid-Rahmen an Kerze | Weltobjekt | B | mittel | [PS] |
| Z.131 `bt` | 1 | Absperrband „GASLECK · BETRETEN VERBOTEN" | zwischen Leitkegeln | D | mittel | Absperrband-Scan (rot-weiß) |
| Z.375 `g` | 1 | Glimmen/Schein | – | E | – | [TECH] |

### app/mods/ausbau_nord.js (17 Aufrufe `ausbau_nord_paper`) – Am Kirchberg / Nord (Friedhof, Haltestelle, Spielplatz, Praxis)

`ausbau_nord_paper` (Z.97) = Papier/Schild-Decal-Generator; ein Austausch auf [PS] wirkt auf alle Zeilen.

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.229 `note` | 1 | Aushang an Friedhofstafel (Tor) | Friedhofstor | A | hoch | [PS] auf Scan-Schild |
| Z.309 `plate` | 1 | Name auf dem Stein (vorn, Süden) | Gedenkstein | A | hoch | Stein-Gravur (Normalmap-Ritzung) + `grave_*` Scan |
| Z.418 `sign` | 1 | Wegweiser am Beginn der Gasse (grün, Rand) | Gasse | A | mittel | Emaille-Scan |
| Z.426 `hop` | 1 | Himmel und Hölle (Kreide, Kinderhand, 1,3×3,2 m) | Gehweg Gasse | C | hoch | [KR] |
| Z.447 `tt` | 1 | Fahrplan im Wartehäuschen („7 Kirchberg") | Haltestelle | A | mittel | [PS] Fahrplan-Aushang-Scan |
| Z.454 `tk` | 1 | Fahrkarte „KIND · EINFACH 28.07.2009 03:13" | Sitzbank | A | hoch | Fahrkarten-Karton-Scan [PS] |
| Z.462 `disc` | 1 | gelb-grüne Scheibe (Schild) | Haltestelle | A | gering | Schild-Scan |
| Z.501 `ps` | 1 | Schild „SPIELPLATZ" | Spielplatz | A | mittel | Emaille-Scan |
| Z.508 `bn` | 1 | Zettel „BÄRLI IST WEG!! bitte wieder auf die Bank" (Handschrift) | Bank | A | hoch | [PS] + Handschrift (Gochi Hand) |
| Z.795 `tarp` | 1 | grüne Friedhofsplane (2600 Körner) | Lukes Grube | D | mittel | Planen-/Gewebe-Scan (`trashbag`/Plane) |
| Z.810 `taf` | 1 | Tafel (Schiefer/Kreide) | Friedhof | A/D | mittel | Schiefer-Scan + [KR] |
| Z.818 `kr` | n | Kreide-Decals (Boden) | Bank/Friedhof | C | hoch | [KR] |
| Z.827 `plak` | 4 | vier Plakatschichten 2009/1992/1975/1958 (Papierkörner, Klebereste) | Bushaltestelle | A/B | hoch | [PS] Plakat-Schichten (Wheatpaste-Scan) + Motive |
| Z.843 `schild` | 1 | Emailschild Praxis Dr. Seiler | Haus 13 | A | mittel | Emaille-Scan |
| Z.849 `flur` | 2 | Seitenfenster: Flur mit Messlatte, weißer Kittel (2 Zustände) | Praxis | B | hoch | [FO] Render (3D-Szene) / Kittel-Modell |
| Z.859 `aus` | 1 | Schaukasten „Bundesstelle für Rückführung" | Gasse | A | hoch | [PS] Aushang |
| Z.864 `vp` | 1 | Vermisstenplakat „ZAYN WENDT, 7 J." | Schaukasten/Straße | A/B | hoch | [PS] + Foto [FO] |

### app/mods/neben3.js (10 Treffer-Zeilen) – Nebenaufgaben (Kirchberg, Friedhof, Kapelle)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| Z.111 | 1 | Bleiglas (Felder, Bleiruten, Figuren), glow = milchiges Glas | Kapellenfenster | D/B | hoch | Buntglas-Scan (Fab) + Bildmotiv bleibt |
| Z.209 `fleck` | 1 | Papier-/Fleck-Decal (helles Rechteck) | Weltdecal | A/C | gering | [PS] / [GR] |
| Z.221 `seilTex` | 1 | Seil | Glocke/Kapelle | D | mittel | Seil-Scan |
| Z.315 `brett` | 1 | Spielbrett 512² (Felder) | Pfarrhaus | D | gering | Holzspielbrett-Scan |
| Z.400 | 1 | Wimpel Schützenfest | Zimmer | A | mittel | Stoff-Scan + Aufdruck |
| Z.401 `kiste` | 1 | Zigarrenkiste „HAVANNA · Peters Schätze" | unter dem Bett | A/D | mittel | Holz-Scan + Etikett [PS] |
| Z.582 | 1 | Schild „heimgehen" (Friedhof, Reihenende) | Friedhof | A | mittel | Holz-/Emaille-Scan |
| Z.649 `bild` | 7 | Überwachungsbilder „AUSSENKAMERA BILD n/7" (Rauschen, Text) | Monitor | E | mittel | [TECH] (Kamera-Look); optional echtes Render der Szene |
| Z.694 `zeichne` | 1 | Flurkarte Ahornstraße (Skizze) | Papier | A/B | mittel | [PS] + Handskizze |
| Z.739 | 1 | rote Wolle/Faden (64×256) | hinter Nr. 7 | D | gering | Woll-Scan |

### app/mods/neben5.js / neben6.js / nr4.js / post.js / albers.js (zusammen 3 + 2 + 3 + 5 + 1)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| neben5.js:86 | 1 | Kronkorken im Rinnstein (Glanz) | Straße | D | gering | Kronkorken-Scan/ Modell |
| neben6.js:65 `mat` | 1 | Pells Heft „JOURNAL" (Umschlag, Stempel „W") | Wald/Hütte | A | hoch | [PS] Heft-Scan (`ms/lbook`) |
| neben6.js:77 `tag` | 1 | Anhänger „Spindschlüssel" (Metall, Auge) | Wald | A | mittel | Metall-Scan |
| nr4.js:98 | 1 | Hufeisen über der Tür | Nr. 4 | C | gering | `rust_sheet` |
| nr4.js:276 | 1 | Hundenapf „FLOCKE" (weiße Lackschrift) | Vor Tür | A | gering | Blech-Scan + Lackschrift |
| nr4.js:287 | 1 | Kinderkiste „LUKE – NICHT WEGWERFEN" mit Jonas' Regelseite | Kinderzimmer | A | hoch | Holz-Scan + [PS] |
| post.js:132 `schloss` | 1 | Briefkasten-Schloss | Briefkasten | D | gering | Metall-Scan |
| post.js:221 | 1 | Kreidekreis/Zeichen (rgba 236,232,214) | Boden | C | mittel | [KR] |
| post.js:228 `post_roxySchatten` | 1 | Kinderschatten ohne Kind (tanzt im Lampenkegel) | Asche im Lampenkegel | C | hoch | [TECH] (Schatten-Decal weich); optional Figuren-Silhouette per Render |
| post.js:253 | 1 | Beschlag mit Fingerzeichnung: Lucys blauer Kreispfeil, falsch herum | Scheibe | C | hoch | [GR] Beschlag + Finger-Spur (Handabdruck-Scan) |
| post.js:255 | 1 | Handschuhfach-Zettel | Auto | A | mittel | [PS] |
| albers.js:187 `fahne` | 1 | Briefkastenfahne + Umschlag „FÜR DEN BRANDT-JUNGEN. PERSÖNLICH. NICHT DAS AMT." | Briefkasten | A | hoch | Umschlag-Scan [PS] |

### app/mods/lwo.js, justin.js, geheimnisse.js, kamera.js, kapitel3.js

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| lwo.js:541–557 `lwo_tex` (6×) | 6 | Kombi-Innenraum: Magnetschild, Kaugummi „Lucid Mint", Butterbrot, Reifenabdruck, Glow | Kombi (graues Auto) | A/D | mittel | Magnetschild: Scan; Butterbrot: `ms/w_brot`; Reifen: `ms/tires` |
| lwo.js:872 | 1 | Aufkleber „K-3: nicht anfassen." (gelb) | K-3 | A | mittel | Klebeetikett [PS] |
| justin.js:177 `justin_kratzerTex` | 1 | Kratzer-Textur 512² (Grau → Normal) | Justins Körper/Boden | C | hoch | [RISS] |
| justin.js:182ff `justin_cv` (5×) | 5 | Leder-/Metall-Flicken, „H. R." in Kinderschrift eingeritzt, Turm über dem Abgrund | Justin (Figur) | D/C | mittel | Leder-Scan (nicht vorhanden; Fab „Leather") |
| geheimnisse.js:61 `hc` | 1 | Wrackteile: dunkle Hand-/Fingerabdrücke (Silhouetten) | Wrack | C | mittel | Handabdruck-Scan |
| kamera.js:105 | 1 (dyn.) | Polaroid-Kamera: Szene-Render (400×300) → Foto | Kap. 5 | B | hoch | ERLEDIGT (Render der echten Szene) |
| kapitel3.js:69/130 | 2 | Polaroid „Kap. 3" laden (JPG); Silhouette 64×160 | Kap. 3 | B/E | mittel | ERLEDIGT (Foto) / [TECH] |

### app/mods/anwesen.js (7), beobachter.js (9), cleo.js (4), entdecker.js, katzen.js, kirchberg.js, post/andere

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| anwesen.js:121 `sign` | 1 | Schild „SEILER · PRÄGEWERK · 1958" (Messing/Emaille) | Anwesen Seiler | A | hoch | Messing-/Emaille-Scan |
| anwesen.js:134 `holes` | 1 | Schlüssellöcher/-silhouetten (8×) | Eisenplatte | C/D | mittel | `rust_sheet` mit Alpha-Löchern; ok als Decal |
| anwesen.js:441 `tex` | 1 | dunkle Fenster im ersten Stock (Blur) | Villa | E | mittel | [TECH] |
| anwesen.js:447/448 `lockTx` | 2 | acht Vorhängeschlösser an Kette (eines neu) | Tor | D | mittel | Schloss-Scan (`ms/w_kette` + Schloss-Modell) |
| anwesen.js:452 `ktx` | 1 | Zettel „EMPFÄNGER VERSTORBEN – ZURÜCK –" / Briefkasten | Villa-Briefkasten | A | hoch | [PS] + Stempel |
| beobachter.js:212 | 1 | Beobachter-Zettel (zackiger Rand, Papier) | Zettel (∴) | A | hoch | [PS] |
| beobachter.js:378/408 `beob_haut` | 1 | Haut-Textur des Modells (Pastell → perlgrau, Adern, Augen dunkel) | Beobachter-Figur | D | hoch | Bleibt Postprocess auf dem Scan (`ms/beobachter`); Haut-Look mit Skin-Scan nachschärfen |
| beobachter.js:633 `kratzer` | 1 | drei Kratzer, Schatten + Hell + Highlight | Tür/Wand | C | hoch | [RISS] |
| beobachter.js:635 `fuss` | 1 | Fußabdruck | Boden | C | mittel | Fußspur-Scan |
| beobachter.js:637 `beschlag` | 2 (hand) | Beschlag (+Hand) | Glas | C/E | mittel | [GR]/Handabdruck |
| beobachter.js:645 `bonbon` | 1 | Bonbonpapier | Boden | C | gering | – |
| beobachter.js:648 `klappe`, 650 `gitter` | 2 | Klappe, Gitter (Metall) | Wand | D | mittel | Metall-/Gitter-Scan (`ironfence_*`) |
| cleo.js:22 `plate` | 1 | „achter Stein" Inschrift am Gedenkfeld | Gedenkfeld | A | mittel | Stein-Gravur + `grave_*` |
| cleo.js:43 | 1 | nasse Fingerabdrücke auf Brettern (drei Finger) | Steg | C | mittel | Handabdruck-/Wasser-Decal [GR] |
| cleo.js:47/48 `kreisCv` | 1 (dyn.) | Kreide-Kreis (CLEO) | Steinkreis | C | hoch | [KR] |
| entdecker.js:24 `entd_kreideTex` | 1 | Kreidestriche als Ring um den Mast | Mast | C | mittel | [KR] |
| katzen.js:159 `katzen_tagTex` | 1 (je Katze) | Namensschild (Filzstift auf hellem Leder) | Katzen-Halsband | A | gering | Leder-Scan |
| kirchberg.js:19–24 `kirchberg_papier` (7 Aufrufe + 30 in post/nr4/neben3 usw.) | n | zentraler Papier-Generator (Fasern, Karo/Linien, Flecken, Knick, Tesa, Handschrift) | Kirchberg/Nord, Nr. 4, Post | A | hoch | [PS] hier zentral umstellen: wirkt auf ca. 30 Dokumente |
| kirchberg.js:209 `namen` | 1 | Napfbrett: 18 Namen in weißer Lackfarbe | Vorgarten Gisela | A | hoch | Holz-Scan + Lackschrift-Decal |
| kirchberg.js:212 `top` | 1 | schwarzer Punkt (Deko-Decal) | – | E | – | – |
| kirchberg.js:344 | 1 | Kapellenfenster (acht Felder, außen/innen) | Kapelle | D/B | hoch | Buntglas-Scan (Fab) |
| kirchberg.js:501 `flammeTex` | 1 | Kerzenflamme | Kapelle | E | – | [TECH] |

### Übrige Dateien (Technik/UI überwiegend)

| Stelle | n | Darstellung | Ort | Kat | Prio | Ersatz |
|---|---|---|---|---|---|---|
| album.js:127 `album_klein` | 1 | Laufzeitbild verkleinern (Spielstand) | – | E | – | [TECH] |
| album.js:157 `album_papierBau` (L/R) | 2 | Albumseiten: Karton, Wolken, Fasern, Stockflecken | Album-Buch (Kap. alle) | A/D | hoch | [PS] Karton-/Albumseiten-Scan (3D-Buch `ms/album` ist Scan, Seiten aber Canvas) |
| album.js:173 | 1 | Vorsatz: dunkles gewolktes Papier, Schildchen mit Lukes Kürzel | Album | A | hoch | [PS] Marmorpapier-Scan |
| album.js:228 | 1 (dyn.) | Seiten-Textur (gecacht, neu gemalt bei Änderungen) | Album | A | hoch | [PS] + dynamische Abzüge |
| album.js:257/258 | 2 | Foto-Karte (Vorder-/Rückseite) | Album | B/A | hoch | Foto ERLEDIGT (Ingame), Karton [PS] |
| album.js:263 | 1 | Leerstelle (4×4 Fläche) | Album | E | – | [TECH] |
| album.js:289 | 1 | Aufschriften/Kreide auf Seiten | Album | C/A | mittel | [KR]/Handschrift |
| album.js:437 | 1 | Abzug-Malen (Foto-Rahmen) | Album-Flug | B | mittel | Foto ERLEDIGT, Rahmen [PS] |
| beutel.js:214 | 1 (dyn.) | Bildchen für Beutel-Fächer, in der Bühne gerendert | Inventar | B | mittel | ERLEDIGT (3D-Render) |
| fassaden.js:258 `tFig` | 1 | Silhouetten-Maske aus Mannequin-Scan | Fenster | E | – | ERLEDIGT/[TECH] |
| fassaden.js:277/811 `fassaden_atlas` | 1 | Möbel-Karten für Scheinzimmer, aus Scan-Möbeln gerendert | Fenster | D | mittel | ERLEDIGT (Render echter Möbel) |
| fassaden.js:612–620 | n | blaue Hausnummernschilder (#1b3663, Emaille) | Häuser | A | mittel | Emaille-Scan + Schrift |
| fassaden.js:652–659 | 1 | Klingelschild Bauernhaus (Messing, „AYDIN" + Kinderschrift) | Bauernhaus | A | hoch | Messing-Scan + Gravur |
| fassaden.js:919 | 1 | Glow-Sprite | – | E | – | [TECH] |
| feuer.js:21–23 `feuer_texDot`, `feuer_texSoot` | 2 | Funken-/Ruß-Sprites | Feuer | E | – | [TECH] |
| feuer.js:227/228 | 2 | Öllache (Decal): Feld-Canvas + Farbe, per Uniform animiert | Brand Öllache | C | mittel | [TECH]-Simulation (Feld); Farbtextur → [BL]-ähnlich `grime` getönt |
| feuer.js:257 | 1 | Schild Notentriegelung (Brandschutztür) | Nordwand | A | mittel | Emaille-Scan |
| feuer.js:269 | 1 | Schild auf Brandschutztür | Tür | A | mittel | Emaille-Scan |
| fotos.js:30 `fotos_wand` | 2 (Keller, Nr. 1) | Indizienwand: Nadeln, Fotos mit weißem Rand, Karteikarten, Handschrift, rote Fäden | Hildes Keller, Lucys Pinnwand | B/A | hoch | Fotos ERLEDIGT (Ingame-JPG); Pinnwand/Karteikarten: Kork-Scan + [PS] Karteikarten |
| grafik.js:131 | 1 (DataTexture) | kachelbares Rauschen für Lichtstreuung | Postprocess | E | – | [TECH] |
| grafik.js:134 `grafik_dirtTex` | 1 | Linsenschmutz | Kamera-Post | E | – | [TECH] |
| gruen.js:40 | 1 | weiche Masken für Laub-/Schlamm-/Pfützen-Flecken (nur Form) | Boden | E | – | ERLEDIGT (Scan-Oberfläche + Maske) |
| gruen.js:560 `tx` | 1 | Blechschild „FORBIDDEN DUSTWOODS · BETRETEN VERBOTEN" | Wald-Eingang | A | hoch | `rust_sheet`/Blech-Scan + Aufdruck |
| gruen.js:584 `huf` | 1 | Hufspuren im Matsch | Wald | C | hoch | Tierspur-Scan |
| gruen.js:590 `an` | 1 | laminierte Anzeige „Dackel entlaufen · Bruno" | Wald-Pfosten | A | mittel | [PS] laminiert (Folie spiegelnd) |
| hervorhebung.js:176/205/208/212 | 4 | Glanz-/Glitzer-Sprites, Halo, Env-Map | Fundstücke | E | – | [TECH] |
| innen_ort.js:58 `softMask` | 1 | weiche Randmaske für Schmutz-Scan | Innenräume | E | – | ERLEDIGT (Scan + Maske) |
| innen_ort.js:59 | – | Schmutzflecken (multiply) | Innenräume | C | gering | ERLEDIGT-Prinzip (`grime`) |
| leben.js:117 | n | Tiertexturen auf 1024² verkleinern | Tiere | E | – | ERLEDIGT (echte Tier-Scans) |
| leben.js:692 | 1 | Motten-Glow | Laternen | E | – | [TECH] |
| lucy3.js:400 `lucy3_fogTex` | 1 | beschlagene Heckscheibe, Tropfen, freigewischte Stelle (1024×512) | Auto-Szene | C | hoch | [GR] + Handabdruck-Scan; Tropfen bleiben prozedural |
| lucy3.js:421 `lucy3_handTex` | 1 | Hand auf Scheibe | Auto | C | hoch | Handabdruck-Scan |
| lucy3.js:428 `lucy3_arrowTex` | 1 | blauer Kreispfeil (Sprühfarbe) | Asphalt/Wand | C | hoch | Spraypaint-Decal, [GF]-Korn |
| lucy3.js:434 `puffTex` | 1 | Rauchpuff | – | E | – | [TECH] |
| lucy3.js:491 | 1 | Zettel „ZULETZT." (Druckschrift, Special Elite) | Kasten vor Nr. 7 | A | hoch | [PS] |
| lucy3.js:495 | 1 | Absperrband „GASLECK · BETRETEN VERBOTEN" (rot-weiß, 512×64) | an vier Kästen | D | mittel | Absperrband-Scan |
| menue.js:62 | 1 | Nummernschild-Platte (blau, weiße Ziffern) Hauptmenü-Szene | Hauptmenü | A | mittel | Kennzeichen-Scan |
| menue.js:129 `mz_maske` | 1 | Beschlag-Maske (#mzFog) | Menü | E | – | [TECH] |
| menue.js:150 `mz_fotos` | 1 | Menü-Fotos aus Spielkamera | Menü | B | hoch | ERLEDIGT (Render) |
| menue.js:201 | 1 | Papier-Textur (190²) fürs Menü | Menü | A | mittel | [PS] |
| menue.js:267 `kreideX` | 1 (dyn.) | Kreide-Schrift auf Tafel | Menü-Szene | C | mittel | [KR] |
| menue.js:278 | 1 | Etikett „ABENTEUERFIBEL · LUKE · JONAS · ZAYN" | Menü-Objekt | A | mittel | [PS] Etikett |
| oberflaeche.js:20 | 1 | Papier-Set (Fasern, Stockflecken, Wasserränder, Kaffeering, Falze, Lochung, Linien/Karos, Schiefertafel) 640×880, JPEG | HUD-Notizen (Overlay) | A/E | hoch | [PS]: dieselben Quellpapiere (brief/amt/druck/lucy/kind/beob/postit/handy) auf Scans umstellen |
| oberflaeche.js:50/56 | 2 | Körnung/Rauschen (PNG) | HUD | E | – | [TECH] |
| oberflaeche.js:63 `obRegen` | 1 (dyn.) | Regen auf der Scheibe vor Hauptmenü | Hauptmenü | E | mittel | [TECH] |
| regen.js:115 | 1 (DataTexture Float) | Regen-Höhenfeld | Wetter | E | – | [TECH] |
| sammeln.js:166 `sammeln_sbBild` | 1 (je Blatt) | Sammelblatt (SB-nn): ausgefranstes Papier, Schatten, Fund-Zeichnung | Sammelblätter | A/B | hoch | [PS] |
| sammeln.js:279 `sammeln_zFoto` | 1 (je Art) | Zeitungsbild: weiche Formen als Druckraster auf Zeitungspapier | Fundstücke | B | mittel | [FO] + Halbtonraster-Shader; Zeitungspapier [PS] |
| sammeln.js:305 | 1 | Fundstück-Zettel (Papier mit Text) | Welt | A | mittel | [PS] |
| sammeln.js:356 | 1 | J-05: aufgewühlte Erde am Sühnekreuz | Sühnekreuz | C | mittel | Erde-Scan-Decal |
| sammeln.js:481 | 1 | Rauschen-Maske (Schrift „Cormorant") | UI | E | – | [TECH] |
| tausch.js:288 | 1 | Lichtfunke | Fundstücke | E | – | [TECH] |
| tausch.js:337 `tausch_kreideTex` | 1 | gelbe Kreide-Markierung | Fundort | C | mittel | [KR] |
| tiefwald.js:92 `bs` | 1 | Blechschild „PROBE T – nicht bergen · zieht" | Stegpfosten | A | hoch | Blech-Scan + Aufdruck |
| tiefwald.js:122 `kb` | 1 | Kreide/Markierung am Fass | Wald | C | mittel | [KR] |
| tiefwald.js:132 `sign` | 1 | Blechschild „AMT FÜR RÜCKFÜHRUNG · FAHRDIENST" | Amtsbus | A | mittel | Blech-Scan |
| tiefwald.js:162 `ros` | 1 | Landeplatz: glasiger Boden, Moos-Rosetten aus drei Punkten | Kreis im Wald | C/D | hoch | `forestfloor`+`w_mosspatch` mit glasigem Look (Shader) |
| tiefwald.js:167 `pl` | 1 | Messplakette „AST 7 · MESSPUNKT K" | Messpunkt | A | mittel | Messing-Scan |
| tiefwald.js:192 `leafTex` | 1 | Blatt (Alpha) | Wald | D | gering | `assets/leaves` |
| traum.js:28 `traum_einband` | 1 | Fibel-Einband als Aufkleber-Decal (Wachstuch, Kinderarzt-Aufkleber, Filzstift) | nasser Asphalt (Traum) | B | hoch | ERLEDIGT-Basis (`w_buch` Scan); Aufkleber [PS] |
| uebergang.js:105 | 1 | Decal 128² | Übergang | C | gering | – |
| uebergang.js:141 | 1 | Absperrband „GASLECK · BETRETEN VERBOTEN" (512×64) | Kellerwand Nr. 7 (ab Kap. 4) | D | mittel | Absperrband-Scan (wie `lucy3.js:495`, `neben4.js:131`) |
| wald.js:59 `dm` | 3 | Kratzer im Schlamm, Kinderknie im Schlamm | Wald (Brombeerbusch) | C | hoch | Fußspur-/Matsch-Scan, [RISS] |
| wald.js:78 | 1 | Schild „FORSTBEZIRK NORD · Betreten verboten · Einsturzgefahr · Totholz" + „FORBIDDEN DUSTWOODS" | Waldeingang | A | hoch | Holz-/Blech-Scan + Schrift |
| whiskey.js:125 | 1 | Glanz im Schnabel | Rabe Whiskey | E | – | [TECH] |
| zayn.js:29 `tag` | 1 | Namensschild „ZAYN" | Hütte | A | mittel | Messing/Klebeband |
| zayn.js:38 `hop` | 1 | Aufdruck „BRAUSE · Waldmeister" (Kasten/Flasche) | Hütte | A | gering | Etikett-Scan |
| zayn.js:41 `wr` | 1 | Etikett „BRAUSE · Waldmeister" (Wrapper) | Hütte | A | gering | – |
| zayn.js:44 `draw` | n | Hütte: Zeichnungen, Radio, Decke, Kerze | Hütte | B | hoch | Kinderzeichnungen auf [PS] |
| zayn.js:114 | 1 (dyn.) | Rohbild → Kinderkamera-Abzug: Belichtung, warm, Vignette, Rauschen, Datumsstempel | Zayns Kamera | B | hoch | ERLEDIGT (Render + Postprocess), Rahmen [PS] |
| akte.js:26 `akte_tex` | 1 | Akten-Durchschlag „DURCHSCHLAG · VERTRAULICH" (beiges Papier, Flecken) | Aktenseite (HTML-Overlay) | A | hoch | [PS] |
| akte.js:33 `AKTE_KOPF` | 1 | Auge-Icon als Data-URL | Aktenkopf | E | – | [TECH] |

---

## Querschnitts-Empfehlungen (aus dem Inventar abgeleitet)

1. **Hebel Nr. 1: Sechs Papier-Generatoren zentral auf einen Papier-Scan umstellen.** `amt_papier` (amt.js:48), `kirchberg_papier` (kirchberg.js:22–43, ca. 30 Aufrufe in post/nr4/neben3/neben4/albers/ausbau_ost_west), `kapitel1_papier` (kapitel1.js, 5), `ausbau_nord_paper` (17), `villa_papierCv` (villa.js:101, 10), `innen_kapitel.js:86` und das HUD-Papier in `oberflaeche.js:20` (8 Quellen) sowie `album_papierBau` und `sammeln_sbBild`. Ein gemeinsamer Satz Papier-Scans (neu beschaffen: Fab/Megascans oder ambientCG CC0: Schreibpapier alt, Durchschlag, Karopapier, Liniert, Karton, Zeitungspapier, Plakatpapier, Post-it, Fahrkarte) + vorhandene Schriften (`app/vendor/fonts`: Special Elite, Courier Prime, Caveat, Kalam, Gochi Hand, Covered By Your Grace, IM Fell) + die vorhandenen Decals `grime`/`blood_*` für Flecken. Text bleibt als Canvas; nur der Untergrund wird gescannt.
2. **Kreide (C, ca. 25 Stellen)** in kapitel1, strasse, ausbau_nord, innen_kapitel, kapitel5, cleo, tausch, entdecker, post, menue, _base: ein Kreide-Strich-Satz (Scan/Foto von Kreide auf Asphalt/Putz) und ein einheitlicher Verwitterungs-Pass wie in `zeichen.js:436`.
3. **Kratzer/Risse/Fußspuren/Handabdrücke (C, ca. 25 Stellen)**: kleines Decal-Set beschaffen (Risse, Kratzer, Fuß/Hand in Matsch und Staub, Tierspuren). `amt.js:237–254` (Handabdrücke aus `blood_hv`) ist die Vorlage: Canvas liefert nur die Form-Maske, Scan liefert Farbe + Relief.
4. **Kinderzeichnungen (B)**: kein Scan-Asset vorhanden; am sinnvollsten ein gemeinsames Asset (`PAPA + ICH`, Zeichnung „Mädchen mit Laterne", Hase, Buntstift-Szene) – doppelt in `amt.js:558` und `kino.js:278`; einmal sauber auf Papier-Scan mit Wachsmalkreide-Textur anfertigen und in beiden verwenden.
5. **Fotos (B)**: alle Stellen, an denen ein Foto als Canvas gemalt wird (familyPhoto, amt.js:398/511/840, villa.js:235, zimmer7.js:210, kapitel1.js:139/147, `n4_sepia`), auf den Ingame-Foto-Weg `fotos.js`/`kamera_render`/`assets/polaroid` umstellen (Figur-Render in Szene, dann Foto-Postprocess).
6. **Standard-Oberflächen**: `M.wood`, `M.fabric/M.cloth`, `M.ash`, `M.siding`, `M.roof` (Rückfall) sind die letzten nicht umgestellten PBR-Materialien der Basis (alle anderen siehe Zeilen oben). Zugehörige Scans (`planks_painted`, `floor_wood`, `curtain_retro`, `corrugated`) liegen schon bereit.
7. **Bleibt prozedural (E)**: Leuchtsprites, Lichtpools, Nebel, Partikel, TV-Rauschen, Linsenschmutz, Regen-Feld, Karte, HUD-Masken, Himmel-Shader.
8. **Doppelt vorhanden/zu prüfen**: `_base` Z.1791 (Ortsschild), Z.1842 (TELEFON) vs. `strasse.js:307/341`; `_base` Z.3657 (Tunnelschild) vs. `amt.js:188`; `_base` Z.1524 (Keller-Wand) vs. `fotos.js:70`. Dort die Basisversion löschen oder nur als Rückfall belassen.

**Hinweis zur Genauigkeit:** Die Beschreibungen stammen aus Variablennamen, Kommentaren und sichtbaren Text-Strings der jeweiligen Zeile; bei wenigen Treffern ohne Kommentar (v. a. `villa.js`, `kapitel5.js`, `neben3.js`) ist die Zuordnung zum Ort bzw. Gegenstand geschätzt. Die Anzahl n zählt erzeugte Texturen pro Stelle (Schleifen/„je Haus" ergeben mehrere Instanzen derselben Textur und wurden einfach gezählt).
