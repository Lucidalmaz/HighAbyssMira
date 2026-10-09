# QA-Art-Befund (Art-Director-Review), Stand 09.10.2026

Grundlage: vorhandene Bilder (keine neuen Läufe, die Instanz war belegt) und Code-Analyse. Raster und Notenskala: `qa_art_raster.md`.
Bildquellen (unter `C:\Users\GIGABYTE\`): `_b2_out` (09.10., Normallauf), `_bundle_out`, `_bundle_out_a` (08.10.), `_welt\nachher` (01.10.), `_light_tour_final` (29.09.).
Wichtig: Die Bilder aus `_welt` und `_light_tour_final` sind 8 bis 10 Tage alt. Spätere Arbeiten (Echt-Schrift, Gurtstuhl, Kellertreppe, Fassaden) sind darin noch nicht zu sehen. Diese Noten sind vorläufig und müssen im Bildlauf bestätigt werden.
„–“ heißt: kein Bild vorhanden, die Note stammt nur aus dem Code oder fehlt ganz.

## Noten je Ort

| Ort | MAT | DET | STO | LIC | BAL | MAS | GEN | FX | FIG | Ø | Beleg |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Hauptstraße | 3 | 2 | 3 | 4 | 2 | 4 | 3 | 4 | – | **3,1** | `_welt\nachher\01_strasse`, `_light_tour_final\p_ort` |
| Kreuzung | 3 | 3 | 4 | 4 | 3 | 4 | 3 | 4 | 3 | **3,4** | `_welt\nachher\02_kreuzung`, `_b2_out\129_geister_g_1975_total` |
| Vorgärten / Veranda Nr. 7 | 3 | 3 | 3 | 4 | 3 | 4 | 3 | 3 | – | **3,3** | `_bundle_out\055_K1lf_lf_veranda`, `057_K1lf_lf_hydrant` |
| Tankstelle / Schrott / Block Ost | 3 | 2 | 3 | 3 | 2 | 4 | 2 | 3 | – | **2,8** | `_light_tour_final\p_tankstelle`, Code `ausbau_ost_west.js` Z. 108–215 |
| Schrebergärten West / Hof | 3 | 2 | 3 | 3 | 2 | 4 | 2 | 3 | – | **2,8** | `_light_tour_final\p_schreber`, `p_hof` |
| Wald / Tiefwald | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 4 | – | **3,9** | `_light_tour_final\p_tiefwald`, `_b2_out\063_tanke_tanke_total` (zeigt den Wald) |
| Friedhof / Kirchberg (außen) | 3 | 3 | 3 | 4 | 3 | 4 | 3 | 3 | – | **3,3** | `_light_tour_final\p_kirche` |
| Kapelle (innen) | 3 | 2 | 3 | 3 | 2 | 4 | 3 | 3 | – | **2,9** | `_welt\nachher\09_kapelle`, Menü `_b2_out\008_menue_m4_kapelle` (schwarz) |
| Nr. 7 (Erdgeschoss) | 4 | 4 | 5 | 3 | 4 | 4 | 3 | 3 | – | **3,8** | `_welt\nachher\06_nr7_unten`, `06b_nr7_lampe`, Code `innen_ort.js` (56 `put`, 29 `decal`) |
| Nr. 7 Keller | 3 | 4 | 5 | 4 | 4 | 4 | 2 | 3 | – | **3,6** | `_b2_out\056`–`058_keller_wand_*`, `_welt\nachher\07b_keller_lampe`, `_bundle_out\059`, `060` |
| Nr. 1 (Elternhaus) | 3 | 3 | 4 | 2 | 3 | 4 | 3 | 3 | – | **3,1** | `_welt\nachher\05b_nr1_lampe` |
| Nr. 4 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 3 | – | **3,1** | `_welt\nachher\08_nr4`, Code `nr4.js` (57 `put`) |
| Nr. 9 | – | – | – | 2 | – | – | – | – | – | **–** | nur AAA-Bewertung (Nr. 9 dunkel) |
| Villa | 2 | 2 | 3 | 2 | 2 | 4 | 2 | 3 | – | **2,5** | `_welt\nachher\11_villa_halle` (Bild alt) |
| Anwesen | – | – | – | – | – | – | – | – | – | **–** | kein Bild |
| Amt: Tunnel | 3 | 3 | 4 | 3 | 3 | 4 | 3 | 3 | – | **3,3** | Code `innen_kapitel.js` Z. 142–169 |
| Amt: Archiv / Registratur / Planung | 2 | 3 | 4 | 3 | 2 | 4 | 2 | 3 | – | **2,9** | `_b2_out\103_akten_akte_registratur`, `104_akten_kantine`, `105_akten_planungsraum`, `_welt\nachher\10_amt` |
| Amt: Spinnenraum | 3 | 3 | 4 | 2 | 3 | 4 | 2 | 3 | – | **3,0** | `_b2_out\107`–`109_spinnen_spinnenraum_befall*` |
| Amt: langer Gang / Messraum | 3 | 3 | 4 | 3 | 3 | 4 | 3 | 3 | 3 | **3,2** | `_b2_out\137_geister_g_sitz_messraum`, Code Z. 320–392 |
| Amt: Zimmer 7 | – | – | – | – | – | – | – | – | – | **–** | kein Bild |
| Im Weißen (Küche, Kinderzimmer) | 3 | 3 | 4 | 3 | 3 | 4 | 3 | 3 | 3 | **3,2** | `_b2_out\132_geister_g_kueche_total`, `136_geister_g_sitz_kinderzimmer` |
| Kanal / Atlantschiss | – | – | – | – | – | – | – | – | – | **–** | kein Bild |
| Bus / Wrack (innen) | – | – | – | 1 | – | – | – | – | – | **–** | `_b2_out\161_bus_bus_innen`, `168_bus_wrack_innen` (komplett schwarz, nur „Klick · Überspringen“) |
| Hütten | – | – | – | – | – | – | – | – | – | **–** | kein Bild |

Gesamteindruck: Story-Props und Licht sind oft auf Note 4–5. Material, Detaildichte und Generiert-Wirkung bleiben auf 2–3. Am stärksten wirken der Tiefwald, Nr. 7 und der Keller. Am schwächsten sind Villa, Tankstelle, Schrebergärten und Archiv.

## Top-10-Mängel (nach Sichtbarkeit im Hauptweg)

1. **Kellerwand Nr. 7: Kopien in Reihe.** 58 Blätter tragen nur 4 Motive (`i % 4`), alle gleich groß und gleich gesetzt. Die Unterschrift „LUKE, 9“ steht immer an derselben Stelle. Im Lampenkegel wird die Wand zum fast weißen Block. Belege: `_b2_out\056_keller_wand_total`, `057`, `058`. **Umgesetzt** (siehe unten).
2. **Spinnweben überall gleich.** In Nr. 7 und Nr. 1 ist jede Webe ein Klon *einer* Netzform. Sie sitzt immer im 45°-Winkel in der Ecke, auf derselben Höhe von 2,5 m, in jedem Raum 2 bis 4 Mal. Im Spinnenraum und im langen Gang hängen die Kantennetze als Reihe in festem Abstand (`i * 2.5`, `i * 6.5`). Belege: `_b2_out\107_spinnen_spinnenraum_befall`, `_b2_out\132`, `_welt\nachher\11_villa_halle`. **Umgesetzt.**
3. **Bus und Wrack innen: komplett schwarzes Bild.** Belege: `_b2_out\161`, `168`. Ursache ist vermutlich die Kino-Blende („Klick · Überspringen“), die nicht aufgeht, oder ein fehlendes Licht im Innenraum. Muss im Bildlauf geklärt werden. **Offen** (die Module `kino.js` und `bus_innen` bearbeitet gerade ein anderer Agent).
4. **Schrift auf Tankstelle und Schrottplatz wirkt generiert.** Gemeint sind das Blechband „TANKSTELLE KRANZ · KFZ“, der Kalender, „AUSSER BETRIEB“, das Kassenbuch, das Schild „SCHROTT · KRANZ“ und „SPERRGEBIET“: glatte Arial auf Canvas, ohne den Echt-Haken. Dasselbe gilt für die Helfer `kf_cnv` (Kiffen-Plakate, Zündholzschachtel, Rauchwaren), `lwo_tex` (Magnet, Kaugummi), `k6_tex` (Messmarke, Durchschlag) und `n4_cv` (Absperrband). Verstoß gegen `ham-keine-generierten-dinge`. **Umgesetzt** (Druck/Schablone über `echt_an`). Das Motiv selbst bleibt Canvas. Echte Blechschild-Scans wären der nächste Schritt.
5. **Tankstelle zu leer.** Der Platz unter dem Tankdach hatte nur zwei Kanister auf 17 × 10 m Pflaster. Beleg: `_light_tour_final\p_tankstelle`. **Teilweise umgesetzt:** Leitkegel an den Zapfinseln, Reifenstapel, Müllsäcke, Palette. Offen bleiben die Ölspur zum Gully sowie Laub und Wasser in den Pflasterfugen.
6. **Amt-Archiv: Aktenschränke aus Wellblech.** `steelMat` legt die Farbe und Rauheit von `corrugated` auf Aktenschränke, Schaltpulte und Maschinen. Dadurch entstehen senkrechte Rippen und Wellenspiegelungen. Beleg: `_b2_out\105_akten_planungsraum`, Schrank rechts. Ein echtes Modell liegt bereit (`ms/aktenschrank/akte_grau|oliv|beige.glb`) und wird in `amt.js` schon genutzt, im Archiv von `innen_kapitel.js` aber nicht. **Offen**, Maßnahme M-6.
7. **Amt-Wände: großflächige Flecken.** Der Putz zeigt im Lampenkegel ein Schlierenmuster von etwa 1 m. Das deutet auf eine zu große Kachel oder eine zu starke Normalmap hin (`104_akten_kantine`, `105`). Der Sockel ist eine dunkle, flache Fläche ohne Sockelleiste. **Offen**, Maßnahme M-7.
8. **Villa: dunkel und leer, weißes Plastik-Kinderbett.** Beleg: `_welt\nachher\11_villa_halle` (Bild vom 01.10.). Im Kinderzimmer „Im Weißen“ war das Kinderbett einfarbig ohne Textur (`innen_kapitel.js` kCrib). **Kinderbett umgesetzt.** Für die Villa selbst steht ein frischer Bildlauf aus.
9. **Hauptstraße und Schrebergärten: wiederholte Silhouetten.** Fast alle Straßenbäume sind dieselben kahlen Totbäume (`deadtree1`/`deadtree3`). Die weißen Lattenzäune laufen als lange, identische Reihen. Die Ränder sind leer: Gehweg ohne Laub, Mülltonnen, Fahrräder oder Autos. Belege: `p_ort`, `p_schreber`, `01_strasse`. **Offen**, Maßnahme M-9.
10. **Kapelle innen: nur Bänke, Kreuz und Kerzen.** Der Altarraum ist leer, das Buntglasfenster ein gezeichnetes Canvas mit acht Feldern (Inventar Top-30 Nr. 18). Im Menü ist die Kapelle schwarz (`008_menue_m4_kapelle`). **Offen.**

Weitere Funde: Der Bauernhof (`p_hof`) zeigt eine flache Wasser- oder Schlammebene mit harter Kante vor der Scheune. Der Fluchtplan im Spinnenraum und das Schild „PRÜFRAUM 3“ sind reine Canvas-Arbeit (Schild in Arial). Die Kerzenflammen in Nr. 7 sind Sprites (vertretbar). Der Kühlschrank in Nr. 7 ist eine Box mit Putz-Scan (kein Modell im Katalog).

## Umgesetzte Verbesserungen (09.10.2026)

| # | Ort | Datei | Änderung |
|---|---|---|---|
| U-1 | Keller Nr. 7 | `kapitel1.js` `kapitel1_wandTex` | Jedes Motiv wird je Blatt mit eigener Größe (72–104 %), Lage, Neigung und zu einem Drittel gespiegelt gesetzt. Die Unterschrift „LUKE, 9“ wechselt Lage (meist rechts, manchmal links), Größe, Farbe und Druck. Der Radierfleck fehlt auf 40 % der Blätter. Das Papier ist eine Spur dunkler und älter (L 62–80 % statt 70–86 %, mehr Schmutz). Der Story-Text („jede unten … signiert“) bleibt gültig. |
| U-2 | Nr. 7, Nr. 1 | `innen_ort.js` `web()` | Alle Netzformen des Fab-Sets „cobwebs“ statt eines Klons. Lage (±6 cm), Höhe (bis −18 cm), Kippung, Drehung (±0,22) und Größe (80–115 %) sind je Netz anders. Kleine Netze fallen zu 20 % aus. |
| U-3 | Amt: Spinnenraum, langer Gang, Messraum | `innen_kapitel.js` `edgeWeb`/`edgeWebX` | Kantennetze mit eigener Höhe (14–42 cm unter der Decke), eigenem Wandabstand, eigener Neigung und Größe sowie ±50 cm Versatz längs der Wand. 22 % fallen aus, damit keine Reihe entsteht. Der Zufall läuft über `rand()`, so bleibt die reproduzierbare Reihe `R()` der übrigen Räume unverändert. |
| U-4 | Im Weißen, Kinderzimmer | `innen_kapitel.js` kCrib | Das Kinderbett bekommt den Lack-Scan `planks_painted` und eine Matratzentextur (wie Zayns Bett in Nr. 7) statt Einfarb-Plastik. |
| U-5 | Tankstelle, Schrottplatz, Sperre | `ausbau_ost_west.js` `canvasTex` | Alle Leinwände laufen über `echt_an` (Druck mit Papierzahn und Tintenhof). Das Blechband „TANKSTELLE KRANZ“ und „SCHROTT · KRANZ“ laufen als Schablone (Stege, Abplatzer, Overspray). |
| U-6 | Kiffen, LWO, Kap. 6, Neben 4 | `kiffen.js` `kf_cnv`, `lwo.js` `lwo_tex`, `kapitel6.js` `k6_tex`, `neben4.js` `n4_cv` | Echt-Schrift wie bei U-5, für Plakate, Schachteln, Magnet, Kaugummi, Messmarke, Durchschlag und Absperrband. Masken und Leuchtsprites bleiben unberührt, denn der Haken greift nur bei `fillText` ab 9 px. |
| U-7 | Tankstelle | `ausbau_ost_west.js` nach den Kanistern | Abgesperrte Zapfinseln: drei Leitkegel und ein umgekippter. Dazu ein Reifenstapel an der Kioskwand, zwei Müllsäcke an Säule 2 und eine Palette. Alles sind vorhandene Scans (`cone_ms`, `tires`, `trashbag`, `pallet_ms`), keine Laufwege werden versperrt. |

Prüfung: `node --check` für alle acht Dateien bestanden, `assemble.js` hat gebaut (91 Teile, `game/index.html` 6501 KB). **Im Spiel ungetestet:** Es lief kein Normal- oder Lite-Lauf, die Instanz war belegt.

## Maßnahmen offen (nach Wirkung/Aufwand)

| ID | Ort | Maßnahme | Module | Aufwand |
|---|---|---|---|---|
| M-3 | Bus/Wrack innen | Schwarzbild klären: Blende, Kameraposition, Lichtquelle im Bus (vorhandene Lampe modulieren) | `kino.js`, Bus-Modul (anderer Agent) | S |
| M-6 | Amt-Archiv | Die alten Blechkisten durch `ms/aktenschrank` ersetzen (akte_grau/oliv/beige im Wechsel, ±2° Drehung). Die Klickfläche der Schublade `archiveDrawer` bleibt unsichtbar erhalten. Als Notlösung `steelMat` auf glatten Lack umstellen (Albedo `rust_sheet` aufgehellt oder `planks_painted` mit niedriger Normalstärke) | `innen_kapitel.js` Z. 71, 171–205 | M |
| M-7 | Amt-Wände | Kachel des Putz-Scans halbieren und `normalScale` auf 0,5. Sockelleisten aus `floor_wood` oder `rust_sheet` (Leiste 8 cm). Wasserläufe (`damp`) unter Rohren statt in festen Abständen | `amt.js` (Raumbau), `innen_kapitel.js` | M |
| M-9 | Hauptstraße | Baumarten mischen (`w_birke`, `w_oldpine`, `w_moretrees` aus `waldleben` als Straßenbäume, je Baum Drehung und Größe ±15 %). Laub und Wasser im Rinnstein verdichten (`w_leaves`, `w_leftleaves`). Vor drei Häusern Mülltonnen (`trashcan`), Fahrrad (`bicycle`) und Briefkasten (`mailbox2`). Lattenzäune je Feld um ±2° gekippt, einzelne Latten fehlen | `strasse.js`, `gruen.js`, `fassaden.js` | M |
| M-10 | Kapelle | Altarraum: Kerzenständer (`candles`), Gesangbücher (`w_buch`), Läufer (`wallpaper_fabric`), Staub-Decals (`grime`). Buntglas durch einen Fab-Buntglas-Scan ersetzen (Inventar Nr. 18). Menü-Kamera der Kapelle prüfen | `neben3.js`, `kirchberg.js`, `menue.js` | M |
| M-11 | Villa | Neuer Bildlauf. Dann Verdichtung mit Möbeln aus `moebel.js`, Gardinen (`curtain_retro`), Rahmen (`frame_dmg`), Grime unter Fenstern, Wasserflecken (`pinsel/feucht`) | `villa.js` | M |
| M-12 | Schrebergärten/Hof | Laube, Werkzeug, Schubkarre (`wheelbarrow_ms`), Regentonne (`w_barrel`), Gießkannen. Die Schlammebene vor der Scheune mit weichem Rand (Alpha-Maske) und `gravel` als Übergang | `ausbau_ost_west.js` West | M |
| M-13 | Tankstelle | Echte Blechschild- und Emaille-Scans für das Kioskband (Fab „old metal sign“) statt Canvas-Motiv. Ölspur zum Gully | `ausbau_ost_west.js` | S–M |
| M-14 | Nr. 7 | Kühlschrank-Box gegen ein Fab-Modell tauschen (frei, Lizenz prüfen). Steckdosen und Lichtschalter an den Türrahmen (Scan-Kleinteile) | `innen_ort.js` | S |
| M-15 | Amt Spinnenraum | Schild „PRÜFRAUM 3“ und Fluchtplan über `echt_an` (der Helfer `pc` dort hat keinen Haken) | `innen_kapitel.js` Z. 247 | S |

## Für den Bildlauf (sobald ein Fenster frei ist)
Schritte je Ort mit Totale, Nahblick (Lampe an) und Seitenblick. Vorrang haben die Orte ohne Bild: Nr. 9, Anwesen, Zimmer 7, Kanal/Atlantschiss, Hütten, Bus/Wrack. Danach die Wiederholung der umgesetzten Stellen U-1 bis U-7 (Kellerwand total und nah; Spinnenraum total; Nr. 7 Wohnzimmerecke; Tankstelle total und Kiosk-Band nah; Kiffen-Plakate).
