# Umsetzung Text gegen Welt: Kapitel 1 und Ort (Protokoll)

Grundlage: `kap1_ort.md` (45 Lücken). Dieses Protokoll nennt je Lücke den Stand, die Datei und die Weltkoordinate (x, z). Alle neuen Objekte sind aus mehreren Teilen mit echten Materialien gebaut (Drehkörper, Extrusionen, Röhren, Scan-Modelle), nicht als Hitbox oder schwebendes Dekal. Kleine Dinge tragen `noCol`, feste Möbel (Sessel, Bildstock, Hintertür) sind begehbar-blockierend.

Prüfstand: Rechenintensive Teile (Rattan-Kindersitz, Relief, Küchenwecker, Pfanne/Sieb) wurden zusätzlich in einem eigenen Three.js-Prüfstand im Browser betrachtet; Spieltests nur über `_run_locked.sh`.

## Fotos (fotos.js): Kartentext an das Bild angepasst

| # | Foto | Ergebnis |
|---|---|---|
| 1 | nr3.jpg (Beweis 2) | **braucht neues Bild.** Bild zeigt ein Kind (2009-Stempel), Karte beschreibt Mike barfuß 2026. Mike/2026 ist Handlung, Text nicht geändert. |
| 2 | kreuzung.jpg (Beweis 1 und 8) | Text angepasst: Strahl unter der Scheibe ohne Rand („ein Loch“), Kinder mit dem Rücken zur Kamera, Zayn (rechts) hat den Kopf zur Seite gedreht (statt „sieht in die Kamera“). Handschrift auf Karte und Pinnwand angeglichen. |
| 3 | zwillinge.jpg (Beweis 5) | Text angepasst: keine Lampions, kein Blitzaugen-Satz mehr; „bleich, fast durchsichtig“; hinten „nichts, was man benennen könnte“. |
| 4 | senke.jpg (Beweis 6) | Text angepasst: Mama von hinten im Leopardenkleid, Laterne unsichtbar, nur ihr Schein auf dem Weg, geht auf den Wald zu. |
| 5 | nr7.jpg (Beweis 3) | Text angepasst: Hilde im hellen kurzen „Schlafkleid“ statt Nachthemd. |
| 6 | bergung.jpg (Beweis 7) | Text angepasst: dunkle Mäntel, Hüte, Dienstmantel; hinten ein dunkler Umriss, den man für einen Stamm halten kann. **Neues Bild empfohlen** (Uniform, hohes Wesen deutlich). |
| 7 | ufo1975.jpg (Beweis 4) | Text angepasst: die matten Randpunkte „sind keine Lichter, es sind Löcher“. |

Weitere Bildtexte: Kühlschrankfoto Nr. 7 (kapitel1.js) beschreibt jetzt einen Jungen mit Locken im roten Shirt (passt zu `polaroid/zayn.jpg`); Gurtstuhl-Polaroid: „Lucys Panda-Top“ statt „blaues Kleid“, „Derselbe Stuhl“ entfällt.

## Objekte in der Welt (Priorität hoch und mittel)

| # | Lücke | Stand | Umsetzung (Datei, Weltkoordinate) |
|---|---|---|---|
| 8 | Martinsnische | umgesetzt | kirchberg.js: freistehender Sandstein-Bildstock (Sockel, Bogenrahmen, Satteldach) bei (−57,7 / 80,9), 0,5 m über dem Boden, hinter dem Eisengitter. Innen ein Steinrelief „Sankt Martin zu Pferd, Schwert erhoben, Mantel halb, davor der kniende Bettler mit abgebrochenem Arm“ (Höhenfeld als echte Verschiebung, 4,5 cm tief, Normalen, Sandstein-Verwitterung) plus Grablicht. Die Madonnenfigur (Ersatz) entfällt. Das Pferd ist als Relief gebaut (kein Pferdemodell im Katalog). |
| 9 | Pfarrhaus-Herrenrad | umgesetzt | kirchberg.js (−61,05 / 50,05, Vorbau): Kindersitz aus Rattan (Flechttextur mit Bump, Randwulst, Chromgestell, Fußrasten, Dreipunktgurt geschlossen mit Schloss), Emaille-Schild „PFARRAMT ST. MARTIN“ am Rahmenrohr, Ledermappe (zugeknöpft) unter dem Gummispanner auf dem Vordergepäckträger. Das Rad steht jetzt parallel zur Hauswand. |
| 10 | Pfanne und Sieb, Nr. 3 | umgesetzt | whiskey.js (−25,0 / 1,0 / −12,26): gusseiserne Pfanne mit Speckstreifen, Nudelsieb aus Lochblech umgedreht darüber, ab dem zweiten Besuch (speck ≥ 1) sichtbar; der Rabe sitzt auf dem Sieb. Das „gekippte“ Fenster ist nicht umgesetzt (Flügel ist Teil der Fassade aus fassaden.js). |
| 11 | Sessel mit Wolldecke | umgesetzt | kapitel1.js (22,4 / −16,2, Nr. 7 Wohnzimmer): Sessel aus dem Sofa-Scan (halbe Breite, brauner Bezug), zusammengelegte Wolldecke (Schottenkaro, Fransen, gerundete Falten) über der Lehne, Teller mit angebissenem Brot auf dem Sitz; die Klickfläche „Sessel“ wanderte mit. |
| 12 | Kühlschrankfoto | Text | siehe oben. |
| 13 | Astloch Nr. 9 | umgesetzt | kapitel1.js (46,95 / 1,5 / −12,3): Astloch (Jahresringe) im Brett, darin ragt die Linse einer Kamera (Rohr, Glas, Ringe), rote Standby-Leuchte daneben; post.js dreht die Linse beim Anleuchten. |
| 14 | Panda-Anhänger | umgesetzt | strasse.js und kapitel1.js, Briefkasten Nr. 7: Haustürschlüssel aus Nickel mit Ring, Kettchen und Panda aus Plastik (ein Ohr abgebrochen); das rote Band entfällt. |
| 15 | Bus | umgesetzt (ungeprüft) | kapitel1.js: Transporter-Scan (7,4 m) mit zwei Scheinwerfern rollt im Nebel an die Haltestelle (5,2 / 57,4), beim geheimen Ende. |
| 16 | Kuli und Lesebrille | umgesetzt | kapitel1.js (22,5 / 2,0): ms/brille und grauer Kuli mit Auge auf dem Clip liegen auf dem Asphalt, bis aufgenommen. |
| 17 | Polaroid Gurtstuhl | Text | „Lucys Panda-Top“ statt „blaues Kleid“. |
| 18 | drei Katzen im Fenster | umgesetzt | katzen.js: LUNA, LISBETH, MARIE sitzen in Kap. 1 auf der Fensterbank von Giselas Küchenfenster (22,7 / 49,64). |
| 19 | Kuli mit Auge | umgesetzt | kirchberg.js: Metallkugelschreiber mit Clip, Rille, Drücker und geprägtem Zeichen (Auge über Flamme) auf dem Clip (Fensterbank). |
| 20 | Stützräder | umgesetzt | kirchberg.js: zwei Stützräder (Arme, Gummiräder) am Hinterrad des roten Kinderrads. |
| 22 | Küchenwecker | umgesetzt | nr4.js: Metallwecker (zwei Glocken, Klöppel, Zifferblatt 3:13) auf dem Gemüsefach im Kühlschrank (−1400,45 / 1395,45). Der Kühlschrank ist jetzt ein Hohlkörper mit schwenkbarer Tür (Klick „Kühlschrank öffnen“), Zettel hängen an der Tür. Zettel E-07 heißt jetzt „Fensterbank, wo der Küchenwecker stand“. |
| 23 | Telefon | umgesetzt | nr4.js: ms/w_telefon auf der Flurkommode statt Radio-Ersatz. |
| 24 | Pfandflaschen | umgesetzt | nr4.js (Keller, −1400,6 / 1444,2): drei Getränkekisten auf der Palette mit genau 31 Pfandflaschen (grünes und braunes Glas); das „Pfanddomino“ kippt die Flaschen nacheinander. |
| 25 | Türspion, Keksdosen, rote Wolle | umgesetzt | nr4.js: Messing-Türspion an der Haustür, blaue und rote Keksdose auf der Küchenzeile, rotes Wollknäuel mit Faden auf dem Nähkasten. |
| 26 | Hakenbrett | umgesetzt | nr4.js (Nr. 1, −55,78 / −14,3): Holzbrett mit fünf Messinghaken, fünf getöpferten Bechern, Namen in Kreideschrift (ritzschrift.js): MAMA, PAPA (Leimwulst am Henkel), LUCY, LUKE, einer ohne Namen. Es hängt an der freien Wand neben dem Buffet (am alten Platz stand das Buffet davor). |
| 27 | Mäntel und Kinderschuh | umgesetzt | nr4.js (Nr. 1 Elternzimmer, Ostwand, −44,2 / −20,15): Garderobenleiste, drei Wintermäntel, dazwischen am Boden ein blauer Kinderschuh mit Klett. ms/w_jacke ist ein zerknüllter Jackenhaufen und nicht aufhängbar, die Mäntel sind deshalb eigene Teile. |
| 28 | Blatt hinter der Hintertür | umgesetzt | post.js (47,8 / −21,6): die Vollblatt-Scan-Tür wurde durch eine Rahmentür mit großer, verschmutzter Glasscheibe ersetzt, dahinter am Boden Blatt 212. |
| 29 | Zaunlatten | umgesetzt | post.js (≈ 43,7 / −14,2): Lattenzaun von der Hausecke nach Westen, zwei Latten unten auseinandergebogen, drei Kratzer. Vorher gab es dort keinen Zaun. |
| 30 | Kind im Auto | umgesetzt (ungeprüft) | post.js: dunkle Kinder-Silhouette (gestreifter Ärmel, erhobener Arm) auf dem Rücksitz, erscheint 4 s im „Auto-Schreck“. |
| 34 | Vermisstenzettel am Sack | umgesetzt | strasse.js (46,4 / −6,3): fünf zerknitterte, nasse Zettel (Lucys Gesicht) am Boden und auf den Säcken. |
| 37 | Tausch-Funde | umgesetzt | tausch.js: 49 Fundorte, jede Ware mit eigenem kleinen Modell (Kronkorken „Abgrundbräu“, Messingknopf, Münzen, Murmel, Briefkastenschlüssel mit Anhänger „2“, Silberlöffel „H W“, Ring, Scherbe, Lametta, Staniolkugel, Abzeichen, Glöckchen, Zinnsoldat-Trommler, Reflektor, Medaillon, Plakette, Brillenglas, Haarspange, Uhrdeckel, Sicherheitsnadeln, Kupferdraht, Christbaumkugel); Träger: Blechdose (Brunnen, Zayns Hütte), Plastiktüte (Tankstelle), Lametta hängt an der Laubentür (−108,57 / 2,0 / 25,62; der Fundort der Laube wurde an die Tür verlegt). |
| 33 | Briefkasten Nr. 2 | teilweise | post.js: drei weitere Karten im Gras. Papier aus der Klappe: nicht. |
| 32 | Thermoskanne | umgesetzt | post.js: ms/w_thermos mit geprägtem Auge. |
| 36 | Milchzahn | teilweise | strasse.js: Milchzahn und feuchte Erde im Briefkasten Nr. 4. Zahl 8 auf dem Ball: nicht. |
| 38 | Zählgestell | umgesetzt | geheimnisse.js: rote Schnur in engen Wicklungen um den Pfosten und drei angelehnte Äste (w_branches). |
| 39 | Stempel Turm über Abgrund | umgesetzt (zuletzt neu ausgerichtet, ungeprüft) | geheimnisse.js: Stempel als Abziehbild auf Wrackteil 3 und 5, an der Fläche ausgerichtet. |
| 43 | Obstschale | umgesetzt | kapitel1.js (28,38 / −14,86): Steingutschale mit drei Äpfeln, Dienstmarke daneben. |

## Nicht umgesetzt (niedrig)

#21 Hänschen auf dem roten Rad, #31 Zeitungsrollen am Postrad, #35 Kastanien und Kindersitz im Auto, #40 Kuli in der Hand von Vegas, #41 Hufeisen zum Mitnehmen (würde Gameplay ändern), #42 Papier in der Tonne, #44 Klingel an Lucys Rad, #45 Sparkassen-Logo und toter Falter, Papier aus der Klappe Nr. 2, Zahl 8 auf dem Ball.

## braucht Download

- Reiterstandbild oder Pferdemodell (Sankt Martin zu Pferd als echte Figur; jetzt Steinrelief)
- Bratpfanne und Nudelsieb als Scans (jetzt eigener Aufbau)
- Fahrrad-Kindersitz aus Korbgeflecht (jetzt eigener Aufbau mit Rattan-Textur)
- Küchenwecker (jetzt eigener Aufbau), Getränkekisten mit Pfandflaschen
- Wintermäntel an Haken (w_jacke ist ein Haufen)
- Herrenrad mit Querstange (das vorhandene Rad ist ein Damenrad mit gebogenem Rahmen)
- Bus (jetzt gestreckter Transporter-Scan)

## braucht neues Bild

- fotos/nr3.jpg (Beweis 2): Mike barfuß von hinten, Laterne aus, Stempel 2026 (das Bild zeigt ein Kind, Stempel 2009)
- fotos/bergung.jpg (Beweis 7): Uniform und hohes Wesen im Wald (Text jetzt vorsichtig formuliert)
- Optional: kreuzung.jpg (Zayn frontal in die Kamera), zwillinge.jpg (Lampions, Blitzaugen), senke.jpg (Laterne in der Hand, Waldrand), polaroid/zayn.jpg als Gruppenbild mit Hilde und zwei Jungs

## Auffälligkeiten

- Ladezeit: Die Stufe „Grafik vorbereiten“ ist unter Mehrfachlast extrem lang (137 bis 155 s gegenüber 22 s im ruhigen Lauf); die Module dieser Umsetzung brauchen zusammen unter 10 s. Alle MeshPhysicalMaterial (Transmission, Clearcoat, Iridescence) wurden vorsorglich durch MeshStandardMaterial ersetzt.
- ms/w_jacke ist ein zerknüllter Jackenhaufen (Katalogeintrag irreführend).
- Zeilenenden: kirchberg, nr4, strasse, katzen, fotos sind CRLF, kapitel1, tausch, whiskey, post, geheimnisse LF (wie im Repository).
