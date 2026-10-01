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
- **Hängendes:** Strom- und Hausanschlussleitungen (strasse.js) schwingen mit Attribut `aSw` (Durchhang-Form) quer zum Wind, ruhig wenige Zentimeter, in der Böe bis etwa 10 cm. Das lose Kabel an Nr. 9 pendelt vom Mast aus. Gartentore und Fensterläden hatte leben.js schon (Böe).
- **Bewusst nicht gebaut:** Dosen, Tonnen und Wäsche. Es gibt keine solchen Scans an sinnvollen Stellen, und selbstgebaute Requisiten sind tabu. Türen sind Interaktionen.

## R-8 Atmosphäre
- **Wind-Ton (klang.js, `klang_wind`):**
  - `amb_heulen` (Hzandbits Urban Winds II) heult und pfeift um Ecken, erst ab kräftigem Wind. Drinnen ist es durch Wand und Fenster gedämpft (Tiefpass 520 Hz, Keller 280 Hz).
  - `amb_kronen` (Hzandbits Wind In Trees, Gras/Böen) rauscht je nach Bewuchs: im Wald voll, am Waldrand mehr, im Ortskern wenig.
  - Das Bett `amb_wind` atmet mit `WIND.k`. Die Stromleitung `amb_leitung` singt in der Böe.
  - Böen sind Einzelstöße `fx_boe_1…4` (toneglow Town Winds: nasse Straße, totes Laub), von der Luvseite her im Stereobild, über `hushG` (Stille-Zonen).
  - Das synthetische Rauschbett und das Rascheln in waldleben weichen den Aufnahmen.
- **Blätter:** Einzelne Blätter stammen aus dem Laub-Scan w_leaves (Inseln des Netzes, 4 Formen × 40). Die Bahn läuft ganz im Vertex-Shader: Fall, Pendeln, Taumeln, Luftweg. Die Blätter landen auf dem echten Boden (solidGround), liegen, rutschen in kräftigen Böen weiter (Bodenweg) und verblassen. Was in ein Haus weht, verschwindet.
  - Quellen nur innerhalb von 24 m: die kahlen Ortsbäume (wenige letzte Blätter), Laubbäume im Wald (`WL.treePts`) und Hecken.
  - In der Böe wirbelt Laub von der Luvseite her auf. Beim Rennen unter Bäumen oder im Laub wirbeln Blätter an den Füßen auf, mit Ton `fx_laub_*`.
- **Luft:** 1400 Schwebeteilchen um die Kamera, ganz im Shader. Drinnen ist es Staub, draußen sind es Sprühregen-Tröpfchen und Fasern, die mit dem Luftweg ziehen. Sichtbar sind sie nur im Lampenkegel (`fogUniforms.flP/flD/flK`) und unter den zehn nächsten Laternen.
- **Atem:** Draußen sind Wölkchen vor dem Mund zu sehen, der Rhythmus richtet sich nach Tempo und Angst. Dampf steigt aus vier Gullys. Beides ist nur im Licht sichtbar und wird vom Wind verweht.
- **Unverändert:** Regen und Nebel bleiben, wie sie sind.

## Dateien
`_base_source_index.html` (Wind, Böe, Regen, Windspiel, Schaukel-Wächter, Busch-Ton), `gruen.js`, `waldleben.js`, `strasse.js` (Leitungen), `leben.js`/`tiefwald.js`/`ausbau_nord.js` (Schaukel an umwelt), `klang.js`, neu `umwelt.js`, `tools/assemble.js` (ORDER), `tools/klang_bau4.py`, `HAM_Audio/quellen.py` (7 neue Ausschnitte), `CREDITS.md`.
Neue Klänge in `game/audio/` (bitte committen): `amb_heulen`, `amb_kronen`, `fx_boe_1…4`, `fx_busch_1…6`, `fx_laub_1…4`, `fx_kette_1…2`, `fx_quietsch_1…2`.

## Kurz geprüft (ein Lauf)
(siehe unten)

## Offen / Bitten
- Schatten der Pflanzen schwingen nicht mit (kein Wind im Tiefenmaterial). Das ist nur bei Hecken nahe Lampen bemerkbar.
- Die Leistung prüft der Hauptagent am Schluss. Kosten: ein Teilchen-Points-Aufruf (1400), ein Wölkchen-Aufruf (96), vier Blatt-Aufrufe (je 40 Instanzen); die Pflanzen-Shader haben sechs Kontaktpunkte mehr je Punkt.
