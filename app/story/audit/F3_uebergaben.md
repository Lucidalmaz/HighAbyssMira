# Übergaben an spätere APs (Hauptagent sammelt aus den Berichten; beim Start des jeweiligen AP mitgeben)

## AP-17/18 (Kap. 3)
- Kino (AP-10): Nimmerheim bauen, `kino_play('k3blinzeln', { mitte: [x, z] })` aufrufen; „Scheiße“-Gag an den dritten Untersuchungspunkt der Kuh (A-12).
- Kuh liest sich im Kino als roter Fleischklumpen, weil die Basis sie schon beim Laden blutig verformt → Verformung erst nach dem Aufprall.
- Katzen (AP-09): Kap. 3 vier Katzen auf dem Zaun (Regie steht); `kirchberg.js`: heimgebrachte Katzen über `katzen_S.nachRegie.push(fn)` an den Napf.

## AP-19/20 (Kap. 4)
- Kino-Sequenzen Kap. 4 nur vorbereitet (Namen in F3_stand_kino.md) → mit AP-19 umsetzen.

## AP-21/22 (Kap. 5)
- Katzen: `katzen_kater5(...)` für Schwellen, Tische, Laternen, Stall, Remise; Übergabe an Vegas.
- Kombi ist im Kino ein grau getöntes `car_dutch`.

## AP-23/24 (Kap. 6)
- Katzen: `katzen_kater5('gitter', …)`.

## Beobachter (AP-07, fertig; API im Kopf von beobachter.js)
- Katzen mit `folgt: true` spawnen, wo Regel 2 sichtbar werden soll.
- Alle APs 14–24: feste Zettel/Spuren/Sichtungen an ihrem Ort über `beobachter_zettel(id, {pos|vor|gitter})`, `beob_spur(...)`, `beob_sichtung(pos, dauer, {...})`, `beob_still(...)`, `BEOB_SPERREN` auslösen.
- AP-26: `spannung_traurig()` bzw. `SP.sad` für „nie in traurigen Szenen“ bereitstellen.
- AP-22: Kreuzungsfoto mit `Z.beob = true` (sonst blendet `kamera_render` ihn aus).
- AP-16: Bonbon-Wirkung von B-K2-04 (ruhigere Kamera) ist nicht gebaut.
- AP-06/AP-23: `story.lwo.ag18 === 'mit'` setzen (Zusatz B-K6-06); `ch3.answer` A/B/C = Reihenfolge der Bibel; RH-Einträge als 'RH-1' … in `ch3.armorHints`.
- Asset: Lüftungsklappe als echtes Modell statt Decal.

## Regression / Qualitätswelle
- Blaues Leuchtobjekt schwebt in mehreren Außenszenen (Herkunft unbekannt, nicht kino.js) → finden.
- Messraum: runde „Mond“-Scheibe im Tank, Regen im Innenraum (evtl. nur Test-Teleport) → prüfen.
- Behaltene im Kino nur abgedunkelt, nicht entsättigt → echtes Grau.
- Brille im Kino nur flaches Bild → Modell.
- KTX: `node tools/ktx.mjs` am Ende für alle neuen Modelle.
- Assets geholt (siehe F3_extras „Geholt (2)“): Lesebrille, Hund Bruno, Lichtschiff-Rumpf. Offen: Perlenkette, Katzenlaute.

## AP-19 (Kap. 4) – aus X-6 Kiffen (fertig, API im Bericht / Kopf von kiffen.js)
- `kiffen_S.auto = false` setzen und `kiffen_start()` am richtigen Moment (Anfang Kap. 4) aufrufen; `kiffen_fund('tips', [x,y,z])` für Vegas' Küchenschublade; Szene über Veranda-Prompt oder `kiffen_szene()`.
- Nachmittagslicht für Kap. 4 fehlt (Szene ist nachts beleuchtet).
- Offen (Autor): Vegas' Satz im Türrahmen (Entwurf „Riecht wie fünfundsiebzig. Nur ohne die Herren.“); welche Laube ist Roxys (genutzt: −107,2 / 25).
- Laternenbote-Meldung „Hanf in Kleingarten – Besitzerin verschwunden (hw)“ fehlt (sammeln.js).
- Qualitätswelle: höher aufgelöste Ich-Hände; Roll-Pose feinschleifen; Aufkleber Bushaltestelle/Auto und Bong-Glanz im Bild prüfen.
- `augenzu.js` nutzt `TOD_RESET` ohne typeof (AP-16 prüfen).

## Politur (P2) aus AP-13 Prolog
- kino.js Prolog-Sequenz: Kindergesicht braucht schwarze Augen und keinen Mund (Bibel); Rabe auf der Leuchte braucht Fülllicht aus dem Pool; Kamera sollte `TRAUM_BOOK.ux/uz` kennen.
- Motten-Partikel an Laternen erscheinen als weiße Quadrate (weiche runde Sprites).
- Kinder-/Rabenstimme synthetisch → Sprachausgabe-Hook `stimmen_spielen` (`traum_<shot>_<i>`).

## Nach der Zwischenversion (P1/P2) aus X-5
- **JS-Heap ~5,5 GB direkt nach dem Laden** (ohne Album/Beutel gemessen) – eigentliche Speicherursache; für Stabilität und Ladezeit untersuchen (Heap-Snapshot: welche Module halten Geometrie-/Animationsdaten im JS).
- Album-Einband bei Nacht fast schwarz (Aufhellung ×2,3 ungeprüft); alter Rucksack fleckig; Rucksäcke ohne Hände.
- Künftige Fotos per `album_abheften` (Grete, Porträt, HEINI, Laube, Stuhl-/Geldkassetten-Polaroid) in den Kapitel-APs.

## Aus AP-14 Kapitel 1 (fertig)
- **FPS**: unter Parallel-Last 22 (Basis) bzw. 2–7 (Laternen/Versteck) – saubere Messung ohne Last in der Integrationsprüfung PFLICHT.
- Blauer Leuchtpunkt schwebt in der Küche Nr. 7 / Außenszenen (2× gemeldet) → finden.
- Kratzspuren vor der Kellertür leuchten unbeleuchtet weiß.
- Hilde „Nicht du“ (`hilde_tot`): grau mit Dutt, Bibel will Nachthemd + offenes weißes Haar; Mocap-Clip für „grabHand“ fehlt; `lena_smile` am Modell nicht möglich.
- AG-02-Figuren: Schirm/Mütze/Thermoskanne (v16) anbringen (lwo.js).
- uebergang.js: Text „Immer dasselbe Motiv“ am rechten Wandstück veraltet.
- Fehlende Assets: Obstschale mit Äpfeln, Wolldecke, Kassettenrekorder, Kugelschreiber.
- Speicherpunkt still beim Stromausfall fehlt.

## Aus AP-17 Kapitel 3 (fertig)
- Kino „Blinde Kuh“: `goreBurst` wirft Organe/Blut, Kuh liest sich als Klumpen – Bibel: gescheckt und warm → Kino-Sequenz anpassen.
- Log „Kino: Zeitgeber TypeError … AudioParam non-finite“ → finden (Integrationsprüfung).
- Politur: Lichtschiff im Abgrund noch Papierlaterne; Behaltene nur grau getönt (kein Bruno/Kreisel); Mira/Ritter-Arme nicht posiert; Schrank atmet nicht; A-11 (Hand halten per Taste); Lesebrillen-Szene mit Whiskey; Pfandflaschen-Szene.
- Fehlende Figuren: Mira (Locken mit Scharlachschimmer), Voss mit Talar, erwachsener Luke von hinten, Frau Reuter, Bruno (Hund liegt in v16/x/hund, nicht umgewandelt), Blechkreisel; `w_papierlaterne` nur FBX (404 als GLB), `toys_old` 404.
- Autor prüfen: Haltestelle „Westende“ vs. Lage im Dorf; Karte auf dem Bett statt Kommode; Justins Handschuh nur erzählt.
- innen_kapitel.js Kinderzimmer: alte Texte (Babybett, Fernseher).

## Aus AP-12 Justin (fertig)
- Politur: Handschuh/Narbe in der Handfläche (Modell ohne Handschuh); echter Kniefall-Mocap fehlt (jetzt tiefe Hocke); Gesicht wirkt ~55, Narbe über rechter Braue und Wimpern fehlen; Haarkanten im Gegenlicht bläulich; keine Mundbewegung.
- Kap. 3: Bank-IDs `riss`, `blechmaenner`, `verwechslung`, `wolter` an ihren Stellen prüfen; Raum-1-/enterWhite-Zeilen vs. UK 11 prüfen.
- AP-16: Lore-Schlüssel `kerbe_stuhl8` beim Untersuchen der Kerbe setzen.
- gedanken.js: alter Gedanke an `justinArrives` („Ein Ritter. Ein echter …“) entfernen.
- forge.html `F.canon`: `spine_01`-Kürzung und Hips-Nicht-Knochen (Fix in `_ap12_look/retarget.js`).

## Aus AP-19 Kapitel 4 (fertig, Stand F3_stand_ap19.md)
- **FPS prüfen (sauber):** Halle, Arbeitszimmer, Nr. 3 unter Last 3–4 FPS gemeldet.
- Halle/Villa-Räume zu dunkel: Basis überschreibt `hemi.intensity` nach den Takten → Haken in der Basis-Lichtzeile (Lichtpass).
- Kamera-NaN in Höhepunkt A nur abgefangen (`villa_heil`), Ursache offen.
- Ungetestet: R4-1/R4-3 Fehlversuche, ∴-1 (−6), B-K4-06b, AG-12 Wege „echt“/„Fälschung“, Flicken-Einlösung, Sichtung im Kino k4, Weiterspielen aus Villa-Raum, Handschuh-Fall Höhepunkt B.

## Gesamttest am Schluss – anspielen (aus Bewegung/Kamera)
- Dreh-Neigung mit echter Maus (Test nur per Skript), Rückwärts-Tempo 0,78, echte Kino-`uebergabe`.
- Eingangsstufen Nr. 7 ohne Kollision (Boden springt an der Tür 0,43 m; Kamera kaschiert) → Welt-Code.

## Aus P2 Figuren (fertig, F3_stand_p2_figuren.md)
- Schlusstest: Figuren in echten Kap.-1–6-Szenen ansehen (Blick an Brustkorb gebunden – nur Node-getestet); LWO-Tempo (Wolter/Gisela/Günther) über Mocap abnehmen; Justins Kopf beim Gehen leicht nach hinten?
- Politur: stetige Unterarmdrehung in mocap.mjs + Neu-Backen (dann Sperrliste lockern); Fuß sinkt an Stufen kurz ~10 cm; CC-Kinder Brustkorb steif; Fuchs/Wolf-Schwanz zittert, Katze `walk`-Pfote an der Schleifennaht.

## Aus AP-20 (fertig, F3_stand_ap20.md) – für AP-22 Kap. 5
- Abfragen `neben4_hat('post_c'|'post_ab'|'gasleck_zurueck'|'grete_foto')`, `neben4_postWeg()`; Weg c: Einbruch −15, B-K5-N1, danach `k4_post` abschließen; `k4_kreisel` endet mit Polaroid „HEINI“; Gisela nach der Szene am Napfbrett.
- Offen: Weg a mit Vegas' Schachtel gegen Pfandflaschen; Vegas-Monolog zum Schuppenschloss; Grete-Foto mit Stellvertreterfiguren; Assets Transportkiste, weißer Kastenwagen, Postsäcke. Schlusstest: Gasleck komplett.

## Aus Welt/Licht (fertig, F3_stand_welt.md)
- Basis: `rect === s7` (Tür knallt) und `rect === s1` (Spieluhr Kinderzimmer) werden nie wahr, weil `shell()` `{...r, g}` zurückgibt (bestätigt). Toter Schreck seit langem; nicht aktiviert, weil Kap. 1/5 nach Fassung 3 ohne ihn gebaut und getestet sind – beim Schlusstest entscheiden (Bibel prüfen), sonst entfernen.
- Nachbild-Anker (`addEcho`, blaue Leuchtkugel) wirkt quellenlos → kleiner, schwach pulsierend, nur aus der Nähe.
- Nr. 4 / Kapelle innen dunkel → `LICHT_HAKEN` nutzen (nr4.js/kirchberg.js). Schwarze Tafel schwebt neben der Kapelle außen.
- Villa-Halle ohne Fenster (Tageslicht unbegründet). Performance-Schluss: `gStreak` ggf. 10 → 6 Laternen.
- Nicht im Bild bestätigt: Laubhaufen, Tropfen, Motten, Nebelkante Ortstafel.
