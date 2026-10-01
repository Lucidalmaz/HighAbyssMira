# Stand Umwelt (R-7 Umgebungsphysik, R-8 Atmosphäre) – 01.10.2026

Nutzerwunsch (F3_extras.md, Rückmeldung 01.10.): Schaukel schwingt beim Anstoßen, Büsche bewegen sich im Wind und beim Durchlaufen, Windpfeifen/-heulen, Partikel in der Luft, fallende und verwehte Blätter. Maßstab: Until Dawn (2024), neuestes Resident Evil.

## EIN Windzustand für Bild und Ton (Basis)
- `WIND` in `_base_source_index.html` (Abschnitt „Wind in Bäumen und Hecken“) enthält die Richtung `dx/dz` (wandert langsam), den Grundwind `base` (atmet), die Stärke `k` (ruhig ≈ 0,3, Böe ≈ 1,3) sowie den Luftweg `fx/fz` und den Bodenweg `gx/gz` in Metern.
- `gust` und `gustT` bleiben wie bisher; neu ist `windStoss(dur)`.
- Jede hörbare Böe (`Audio.gust`, auch über klang.js, den Wald und die Regie) ist zugleich sichtbar.
- Shader-Uniforms: `windU` (Phase, läuft in Böen schneller), `windV` (Richtung, Grundwind, Böe) und `windP[6]` (Kontaktpunkte).
- `windVert(sh, hh, fl, push)` ist der gemeinsame Pflanzenwind. Er arbeitet geschichtet: Neigen und Schwanken mit der Böe, quer pendeln, Blätter flattern je Punkt. Böenfronten laufen sichtbar über Gras und Büsche.
- **Kontakt:** Sechs Spurpunkte hinter Luke federn unterkritisch zurück (ω 8, ζ 0,32). Pflanzen teilen sich vor Luke, schwingen hinter ihm über die Ruhelage zurück und kommen dann zur Ruhe.
- Genutzt von `addWind` (Basis-Hecken/-Büsche, ausbau_nord), `gruen_wind` (Gras, Gestrüpp, Hecken) und `wl_wind` (Waldleben). Die alten Einzel-Winde sind ersetzt, WL hat keine eigene Böe mehr.
- Regen fällt schräg in Windrichtung. Das Windspiel an Nr. 8 klingt bei Wind öfter.
- `Audio.busch` ersetzt das Gras-Schrittgeräusch beim Durchqueren weicher Büsche (Basis-SOL und gruen).

## R-7 Umgebungsphysik (`app/mods/umwelt.js`, neues Modul vor `bewohnt`)
- **Schaukeln:** Alle laufen als Pendel mit Länge aus dem Modell, Schwerkraft, Dämpfung und Wind.
  - **Anstoßen:** Der Stoß wirkt entlang der Schwingrichtung. Luke ist schwer, der Sitz leicht: Er wird mitgenommen oder prallt ab, und Luke wird ein wenig gebremst.
  - Die Kette klirrt beim Stoß (`Audio.kette`) und quietscht an den Umkehrpunkten (`Audio.quietsch`). Das Seil der Reifenschaukel knarrt.
  - Die Reifenschaukel Nr. 2 schwingt von allein (Antrieb pumpt Energie nach, Ziel 0,32 rad). `leben_S.swingHold` (Stehenbleiben, post.js „schwingt nicht mehr“) wirkt weiter.
  - **Neu:** Das Schaukelgerüst im Vorgarten von Nr. 2 war starr. Seine Sitze samt Ketten sind jetzt aus dem Scan gelöst (`umwelt_schaukelTeilen`).
  - Spielplatz (ausbau_nord): Antrieb „wenn niemand hinsieht“ über `s.ziel`, Anhalten über `s.halt`.
  - Waldschaukel (tiefwald): Ziel 0,42·`swingW`, beim Anhalten gehalten.
  - Ohne umwelt.js gelten die alten Wege (Wächter `typeof umwelt_pendel`).
- **Hängendes:** Strom- und Hausanschlussleitungen (strasse.js) schwingen mit Attribut `aSw` (Durchhang-Form) quer zum Wind. Das lose Kabel an Nr. 9 pendelt vom Mast aus. Gartentore und Fensterläden hatte leben.js schon (Böe).
  - **Mit Trägheit (R-23):** drei gedämpfte Schwinger `strasse_LO` (ω 0,9 / 1,35 / 1,9, ζ 0,08), angetrieben von WIND.k² und der Böe. Jede Spannweite hängt an einem davon. Nach einer Böe holen die Leitungen über und klingen langsam aus; dazu feines Zittern.
- **Schaukeln:** Sie sind physikalisch (Pendel mit Schwerkraft, Dämpfung 0,09–0,12/s, Stoß als Impuls, Wind als Kraft) und haben damit die richtige Trägheit.
- **Bewusst nicht gebaut:** Dosen, Tonnen und Wäsche. Es gibt keine solchen Scans an sinnvollen Stellen, und selbstgebaute Requisiten sind tabu. Türen sind Interaktionen.

## R-8 Atmosphäre
- **Wind-Ton (klang.js, `klang_wind`):**
  - `amb_heulen` (Hzandbits Urban Winds II) heult und pfeift um Ecken, erst ab kräftigem Wind. Drinnen ist es durch Wand und Fenster gedämpft (Tiefpass 520 Hz, Keller 280 Hz).
  - `amb_kronen` (Hzandbits Wind In Trees, Gras/Böen) rauscht je nach Bewuchs: im Wald voll, am Waldrand mehr, im Ortskern wenig.
  - Das Bett `amb_wind` atmet mit `WIND.k`. Die Stromleitung `amb_leitung` singt in der Böe.
  - Böen sind Einzelstöße `fx_boe_1…4` (toneglow Town Winds: nasse Straße, totes Laub), von der Luvseite her im Stereobild, über `hushG` (Stille-Zonen).
  - Das synthetische Rauschbett und das Rascheln in waldleben weichen den Aufnahmen.
- **Blätter (R-23, überarbeitet):** Einzelne Blätter stammen aus dem Laub-Scan w_leaves (Inseln des Netzes, 4 Formen × 40). Die Bahn läuft ganz im Vertex-Shader; die CPU spiegelt dieselben Formeln in `umwelt_blattY`/`umwelt_blattH` nur für Landezeit und Landeplatz.
  - **Fallarten:** 65 % Pendelgleiten. Das Blatt gleitet seitlich hin und her, kippt an den Umkehrpunkten hoch und bremst dort, fällt mittig schneller (Formwiderstand). Die Gleitebene dreht sich langsam, dazu flattert es kurz um die Längsachse.
  - 35 % taumeln: Sie drehen um die Querachse, fallen schneller und driften.
  - **Wind:** Böen schieben ungleichmäßig (Luftweg plus Turbulenz mit `gust`).
  - **Landung:** Das Blatt liegt flach auf dem echten Boden (solidGround) und wird in 3 s nass (dunkler, glänzender). Es bleibt liegen. Nur kräftige Böen schieben es weiter; dabei kippt es in halben Überschlägen und kommt flach zur Ruhe.
  - **Ausblenden:** Nach 24–40 s blendet es per Raster aus, über 6 s und ohne Aufploppen; ebenso das Einblenden.
  - **Aussehen:** Die Rückseite ist heller. Im Gegenlicht einer Laterne scheint das Blatt durch.
  - **Tönung je Baumart:** Ortsbäume braun/ocker, Waldlaub gelb/orange, Pfaffenhütchen-Hecken rosa-rot, Bodenlaub gemischt dunkler.
  - **Logik:** Blätter lösen sich nur von Laubbäumen (keine Kiefern) und Hecken innerhalb von 24 m; die Rate steigt mit dem Quadrat von Wind und Böe. Drinnen gibt es keine; was ins Haus weht, verschwindet.
  - **Aufwirbeln** (Böe von der Luvseite, Rennen mit Ton `fx_laub_*`) nur dort, wo Laub liegt: unter Bäumen und Hecken bis 4 m, im Rinnstein des Ortskerns, im Laubwald.
- **Luft:** 1400 Schwebeteilchen um die Kamera, ganz im Shader. Sichtbar sind sie nur im Lampenkegel (`fogUniforms.flP/flD/flK`) und unter den zehn nächsten Laternen.
  - **Staub drinnen:** Brownsche Bewegung (je Teilchen drei unharmonische Schwingungen, langsam, nie im Gleichtakt). Geht Luke vorbei, verdrängt er die Luft: Der Staub weicht aus, wirbelt hoch und kreiselt zurück (über die federnden Spurpunkte `windP`).
  - **Draußen:** Sprühregen-Tröpfchen fallen mit 1,4–2,4 m/s und ziehen mit dem Wind.
- **Atem (R-22, überarbeitet; Maßstab RDR2, TLOU, RE Village):** Eigenes System `umwelt_atemBau`/`umwelt_atemTick`, 40 Teilchen im Ring, Bahn und Aussehen ganz im Shader.
  - **Selten und begründet:** Der Hauch kommt nur beim Ausatmen. Ruhig alle 3,5–5 s; nach Rennen oder Angst (Anstrengung `E`) schneller und kräftiger, danach klingt es in etwa 15 s ab.
  - **Nur wenn er lesbar ist:** draußen und nur mit Licht (Lampenkegel, Laterne näher als etwa 10 m oder Tag); im Dunkeln entsteht keiner.
  - **Ein Ausatmen:** 5–9 Teilchen über 0,35–0,55 s, vor dem Mund etwa 16 cm unter Augenhöhe, also knapp unter der Bildmitte.
  - **Bewegung:** schneller Anstoß nach vorn und leicht abwärts, dann bremst er, steigt etwas, zieht mit dem Wind und hat leichte Turbulenz. Er löst sich in 0,8–1,4 s auf. Die Teilchen liegen in der Welt und bleiben zurück, wenn Luke sich dreht.
  - **Aussehen:** Rauschdichte mit verzerrten Koordinaten (Wirbel), feine Fäden; das Teilchen zerfasert mit dem Alter. Die Deckkraft ist niedrig (0,09–0,14 je Teilchen).
  - **Licht:** Der Lampenkegel trifft den Hauch von hinten und hellt ihn nur gedämpft auf. Laternen streuen nach vorn, im Gegenlicht leuchtet er auf.
  - **Abschaltbar:** über `settings.atem === false` oder „Kopfbewegung beim Gehen“ aus.
- **Gully-Dampf (überarbeitet):** Ein Rauschvolumen (Wirbel), das warm aufsteigt und langsamer wird. Oben greift der Wind stärker, die Fahne biegt sich und reißt mit Alter und Böe auf. Sichtbar nur im Licht.
- **Unverändert:** Regen und Nebel bleiben, wie sie sind.

## Dateien
`_base_source_index.html` (Wind, Böe, Regen, Windspiel, Schaukel-Wächter, Busch-Ton), `gruen.js`, `waldleben.js`, `strasse.js` (Leitungen), `leben.js`/`tiefwald.js`/`ausbau_nord.js` (Schaukel an umwelt), `klang.js`, neu `umwelt.js`, `tools/assemble.js` (ORDER), `tools/klang_bau4.py`, `HAM_Audio/quellen.py` (7 neue Ausschnitte), `CREDITS.md`.
Neue Klänge in `game/audio/` (bitte committen): `amb_heulen`, `amb_kronen`, `fx_boe_1…4`, `fx_busch_1…6`, `fx_laub_1…4`, `fx_kette_1…2`, `fx_quietsch_1…2`.

## Geprüft
- Syntax und Bau sind sauber: Alle geänderten Module bestehen die Vorprüfung, `assemble.js` prüft das ganze Modul-Script per `node --check`.
- Die Klänge sind gebaut und eingepegelt: Betten auf −24 LUFS, Böen auf −22 LUFS.
- **Kein Spiellauf:** Die Testschlange war voll (Anweisung: nach über 20 min Warten abbrechen).
  - Der vorbereitete Lauf liegt fertig bereit: `C:\Users\GIGABYTE\_umw_test\steps.json` (Erzeuger `mk.py`), Start `bash /c/Users/GIGABYTE/_umw_run.sh`.
  - Vorher die Seite bauen: `node tools/assemble.js ../game/index_umw.html` (das Skript übergibt `--root=…/game --page=index_umw.html`).
  - Er liefert `_umw_test/out/filmstreifen.jpg`, `wind.webm` (Aufnahme am Master) und `info.json`.

## Für den Schlusstest (bitte gesammelt prüfen)
1. **Shader:** Keine `THREE.WebGLProgram`-Fehler in der Konsole. Neue und geänderte Programme: `wind2*` (Basis), `gruenWind2`, `wl_wind2|…`, `strasseWire2`, `umweltBlatt2`, die Teilchen-, Dampf- und Atem-ShaderMaterials.
2. **Pflanzen:** Gras, Hecken und Gestrüpp im Ort schwingen ruhig, ohne sichtbaren Takt. In einer Böe neigen sie sich sichtbar in Windrichtung, Böenfronten laufen übers Gras. Nichts reißt ab, nichts springt.
3. **Busch:** Mit W durch einen Busch gehen (gruen-Gestrüpp, z. B. am Feldrain z ≈ 31–34). Er teilt sich vor Luke und federt hinter ihm mit kurzem Nachschwingen zurück. Rascheln kommt aus Aufnahmen (`fx_busch_*`), kein Gras-Schritt.
4. **Schaukel Nr. 2** (Gerüst, −58,8/10,2):
   - Die Sitze hängen an der richtigen Stelle (kein Versatz gegenüber dem Gerüst), sie schwingen nach dem Hineinlaufen aus, die Kette klirrt und quietscht.
   - Die Reifenschaukel daneben schwingt weiter von allein und lässt sich anstoßen.
   - `__umwelt.swings.length` ist mindestens 4 (Reifen, 2 Sitze Nr. 2, Spielplatz-Sitze; die Waldschaukel nur, wenn tiefwald gebaut ist).
5. **Spielplatz** (40,6/78,8): Die Schaukel schwingt an, wenn man wegsieht. „Schaukel anhalten“ hält sie. Sie lässt sich anstoßen.
6. **Böe:** Ein Windstoß ist zugleich hörbar (`fx_boe_*`, von der Luvseite) und sichtbar (Pflanzen, Regen schräger).
   - Die Leitungen holen nach der Böe nach und schwingen langsam aus; sie stoppen nicht hart.
7. **Blätter (R-23):** unter Ortsbäumen, an Hecken und ab Kap. 6 im Dustwoods-Wald, mit Lampe beobachten.
   - Die meisten Blätter pendeln seitlich (kippen an den Umkehrpunkten hoch, bremsen), einige taumeln. Keine Wolke gleichförmiger Teilchen.
   - In der Böe lösen sich deutlich mehr. Im Gegenlicht einer Laterne scheinen sie durch, die Rückseite ist heller.
   - **Landung:** flach auf Gehweg- oder Straßenhöhe (nicht im Boden, nicht schwebend), dann dunkler und nass glänzend. In Böen rutschen sie und kippen um, danach liegen sie still. Sie verschwinden langsam per Raster, ohne Aufploppen.
   - **Farben:** Hecken rosa-rot, Ortsbäume braun/ocker.
   - Kein Aufwirbeln auf freiem Asphalt ohne Laub; im Rinnstein, unter Bäumen und an Hecken schon. Drinnen gibt es keine Blätter.
8. **Licht und Staub:** Draußen fallen Sprühregen-Tröpfchen im Lampenkegel. Drinnen (z. B. Nr. 7) treibt Staub langsam ziellos im Kegel.
   - Geht Luke durch den Kegel, weicht der Staub aus, wirbelt hoch und kreiselt zurück.
   - Ohne Licht ist es fast nichts.
9. **Atem (R-22):**
   - Draußen mit Lampe nur beim Ausatmen sichtbar: ruhig alle 3,5–5 s, nach Sprint oder Schreck schneller und kräftiger, danach wieder ruhiger.
   - Der Hauch erscheint knapp unter der Bildmitte, nie mitten im Bild. Er ist weich und zerfasert (keine runde Scheibe) und vergeht in etwa 1 s.
   - Dreht Luke sich, bleibt der Hauch in der Welt zurück.
   - Unter einer Laterne leuchtet er im Gegenlicht auf. Im Dunkeln (Lampe aus, keine Laterne) ist kein Hauch zu sehen, drinnen nie.
   - Mit „Kopfbewegung beim Gehen“ aus oder `settings.atem = false` erscheint er nicht.
10. **Gully-Dampf** (−30/0,6 · 46/0,9 · −2,1/−38,5 · 66/1,3): wirbelig, steigt auf, biegt sich im Wind und reißt in Böen sichtbar ab; keine runden Scheiben.
11. **Ton:** Windheulen erst bei kräftigem Wind, drinnen dumpf. Im Wald (ab Kap. 6) rauscht es in den Kronen. Keine Dauerlautstärke, die nervt. Pegel nach Gehör in `klang_wind`: Heulen ·0,55, Kronen ·(0,12 + 0,5 k).
12. **Leistung:** In der Schluss-Messung die Ticks „Umwelt“ und „Klang“ ansehen (PERF), siehe „Offen“.

## Offen / Bitten
- Schatten der Pflanzen schwingen nicht mit (kein Wind im Tiefenmaterial). Das ist nur bei Hecken nahe Lampen bemerkbar.
- Die Leistung prüft der Hauptagent am Schluss. Kosten: ein Teilchen-Points-Aufruf (1400), ein Dampf-Aufruf (96), ein Atem-Aufruf (40), vier Blatt-Aufrufe (je 40 Instanzen); die Pflanzen-Shader haben sechs Kontaktpunkte mehr je Punkt.
