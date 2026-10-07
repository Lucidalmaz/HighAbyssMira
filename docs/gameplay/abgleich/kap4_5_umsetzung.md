# Umsetzung Text-Welt-Abgleich Kapitel 4 und 5 (Protokoll)

Grundlage: `kap4_5.md`. Geändert wurden nur `villa.js`, `anwesen.js`, `kapitel5.js`, `neben4.js`, `neben5.js` (kiffen.js unverändert: der Fundort „Küchenschublade“ wird von villa.js über `kiffen_fund('tips', …)` auf die neue Schublade gesetzt). Alles in Worlds-Koordinaten (x, z).

Stand der Prüfung: Spiellauf r1 (Halle) und r2 (Nr. 3) mit Screenshots gesichtet; die übrigen Läufe (r3 Arbeitszimmer/Anrichte/OG/Keller, r4 Kreuzung/Kerzen/Pfand, r5 Kapitel 5/Schacht/Nest) siehe Abschnitt „Prüfstand“. Alle Dateien bestehen `node --check`.

## Umgesetzt

| # | Lücke | Umsetzung |
|---|---|---|
| 1 | Galerie/Geländer Halle | `anwesen_galerie`: Dielen y 3,2 an der Nordwand (x −906,85…−893,15, 1,5 m tief), Randbalken, Querbalken, zwei Pfosten (mit Kollision), vier Konsolen, Handlauf (Oberkante 4,3), Fußleiste, ca. 70 gedrechselte Stäbe (Drehteil, instanziert, einzelne fehlen), Bruch über der Treppe (abgerissener Handlauf, hängende Treppenbretter). Whiskey sitzt auf dem Handlauf bei (−897,8 / 4,3 / 904,45) (`whiskey_w10` in villa.js angepasst). |
| 18 | Licht „oben“ ohne Quelle | Nordwand oberhalb der Galerie geöffnet: Flur (Boden, Wände, Decke, Rückwand mit Tür `door2`), Sturmlaterne (`lantern1`) an der Decke mit Glühen und eigenem Licht, das mit dem „Atmen“ des `upLight` (kino k4) pulsiert. |
| 2, 23 | Strickjacke, acht Ritzstriche | `anwesen_bettDeko`: `w_jacke` (FBX) mit grauer Wolltextur über das Fußende, zwei Lederflicken per Strahl auf den Ellenbogen, acht Ritzstriche (`ritz_strich`, der achte tiefer) am Kopfteil. Aufrufbar mit Parametern über `__anw.bett({…})`. |
| 3 | Vegas’ Stube | `villa_kueche`: Kühlschrank (abgerundet, Chromgriffe, Whiskey sitzt oben bei −977,46 / 1,77 / 855,45), Herd mit Backofen (Backofenknopf fehlt, Pfanne mit grauem Rührei und Speck), Küchenschränke mit Spüle und Hahn, Kanonenofen mit Ofenrohr bis zur Decke, glimmender Feuerschlitz und flackerndem Licht, Kohleneimer, Speisekammertür (Nordwand x −978,6), Klofenster (Südwand x −981,9), Alufolie-Fenster neu verteilt. Radio und Funkgeräte stehen jetzt auf Möbeln (Tischchen unter dem Radio, Funkgeräte auf der Kommode). |
| 5 | Küchenschublade Streichhölzer | Schubladenelement bei x −978,98, oberste Schublade 32 cm herausgezogen, Streichholzschachtel darin; `kiffen_fund('tips', [−978,93 / 0,707 / 855,86])`. |
| 16 | Bruno + Napf | `figuren_hund` (steht; Text auf „steht“ geändert, kein Liege-Clip vorhanden) mit Napf (Drehteil, Futter) bei (−982,65 / 859,95). |
| 4 | Aufräumkommando | b1 und b3 schrubben an der Kreuzung (Posten (2,35 / −3,75) und (4,55 / −3,65)) mit langen Schrubbern (Stiel zwischen Hand und Boden gespannt, Bürstenkopf pendelt, Körper wippt, Kratzgeräusch), je ein Eimer mit grauem Seifenwasser und Handbürste. Fortschritt 0…1 (`villa_S.kreide`, gespeichert) blendet die Kreide „ICH KOMME“ aus zeichen.js aus und legt eine nasse, saubere Stelle an; geht das Kommando, ist sie weg. |
| 6 | Radio Nr. 1 | `ms/radio` (ohne Röhren-Netz) auf der Anrichte bei (−48,55 / Oberkante / −16,58), sichtbar wie die Anrichte. |
| 7 | Grabkranz | `k5_kranzBau`: Strohkern, 64 Tannenzweig-Karten, dunkelrote Schleife mit Goldrand, lehnt an einem bemoosten Stein bei (pit.x − 3,6 / pit.z + 2,4); Filmpack in Folie steckt zwischen den Zweigen und verschwindet beim Nehmen. |
| 8 | Heizung, Mantelhaken | Heinrichs Zimmer: Gliederheizkörper (zwölf Glieder, Sammelrohre, Ventil mit Thermostatkopf auf 5), Hakenleiste mit drei leeren Messinghaken daneben. |
| – | try/catch anwesen.js | `metaltable` (Schreibtisch), `wardrobe`/`crt` (Regale), `trashcan` geschützt. |
| 9 | Kanne auf dem Buffet | Thermoskanne steht auf der Buffetplatte (Oberkante aus `anwesen_dressHall`), nicht mehr auf dem Schreibtisch. |
| 10 | Whiskey Kellertreppe | Rabe sitzt auf dem Buffet der Anrichte (Oberkante per Strahl); Text „auf dem Buffet neben der Kellertür“. |
| 11 | Drei Batterien | `ue/batterie` ×3 im Dreieck auf der 5. Stufe, einsammelbar; Einblendtext beim Betreten des OG passt sich an. |
| 12 | Nierenschale | Nierenförmige Stahlschale mit Splitter, Schildchen und Faden auf dem Stahltisch. |
| 13 | Sicherungen | `ue/sicherung` ×3 (rot, grau, blau) vor dem Kasten bei (−897,6 / 867,3). |
| 14 | Kartenrahmen, Klappe | Holzrahmen um die Weltkarte, Fach mit Messingklappe und Schlüsselloch unten; `villa_klappeAuf()` aus `neben4_weltFertig` klappt sie auf (Tween) und zeigt das Tonband, nach der Übergabe leer. Löcher im Kork bei sechs Nadeln, sechs lose Zeitungsausschnitte (Boden, Schreibtisch). |
| 15 | Fenster Arbeitszimmer | Fenster in der Westwand (z 899,7) mit Rahmen, Sprossen, Bank, Gardine (`curtain_retro`) und Stange. |
| 17 | Zeitungsrolle | `villa_zeitungBau`: gerollte Zeitung mit Gummiband statt des flachen Quads (Nr. 7, Z-09; `sammeln_platz` mit `unsichtbar`) und an der Haustür von Nr. 1 (Günther-Szene). |
| 20 | Pfandkiste | `n5_pfandkiste` hinter der Tankstelle (114,2 / 31,55): Kiste für 32 Flaschen, 31 Flaschen (instanziert), eine Lücke. |
| 21 | Zettel auf dem Kissen | Zelle Ost: Schreibmaschinenzettel auf dem Kopfkissen. |
| 22 | Messingschild | Porträt: blank gerieben, „… IRA“. |
| 24 | Laub + Handschuh | Lichtschacht: Laubstreu (`w_leftleaves`) und roter Kinderhandschuh. |
| 26 | Nest | Kronkorken, Ring, Spange, Stanniol. |
| 27 | Dose unter dem Bett | zweite Blechdose unter Heinrichs Bett. |
| 28 | Grüne Lampe, Heft | `ue/lampe3` (grün) auf dem Schreibtisch; Kreuzworträtselheft auf dem Klappstuhl Nr. 9 (Papier-Decal). |
| 29 | Kreide | Weißes Kreidestück neben der mittleren Kerze, verschwindet beim Einstecken. |
| 30 | Blechkiste | Schablonenschrift „AST 7 · BILDTAUSCH“ auf dem Deckel. |
| 31 | Stein auf der Rechnung | kleiner bemooster Stein auf der Ecke. |
| 32 | Regentonne | `w_barrel` hinter Nr. 3 (−28,6 / −24,5). |

## Prüfstand

- Im Spiel mit Screenshots gesichtet und für gut befunden: Galerie samt Flur-Öffnung und Laterne (Whiskey auf dem Handlauf), Küche in Nr. 3 (Kühlschrank, Herd, Spüle, offene Schublade, Kanonenofen, Klofenster, Speisekammertür, Bruno mit Napf), Ritzstriche am Kopfteil, Messingschild.
- Mit Mangel: Die Strickjacke renderte im Lauf schwarz; danach auf eine graue Wollkarte umgestellt, aber nicht mehr im Spiel gesehen.
- NICHT im Spiel gesehen (Läufe r3 bis r5 scheiterten viermal beim Laden: Arbeitsspeicher und WebGL-Kontext durch parallele Spielinstanzen, das Spiel kam nie über „Texturen hochladen“): Arbeitszimmer (Fenster, Klappe, Ausschnitte, Schirmlampe), Anrichte (Batterien, Whiskey auf Buffet), Heinrichs Zimmer, Keller (Nierenschale, Sicherungen, Zettel), Kanne auf dem Buffet, Aufräumkommando samt Kreide-Ausblendung, Zeitungsrollen, Kerzenkreide, Blechkistenschrift, Pfandkiste, Radio Nr. 1, Grabkranz, Stein, Lichtschacht, Nest, Regentonne, Heft Nr. 9. Alle bestehen `node --check`; Platzierungen sind gerechnet, der Feinabgleich (Gardine, Kranz-Lehnwinkel, Radio-Drehung, Rollenposition) steht aus. Testschritte: `C:\Users\GIGABYTE\_kap45_r3.json` bis `_kap45_r5.json` (je höchstens 12 Bilder), Aufruf über `bash _run_locked.sh`.

## Nicht umgesetzt

- 19 Laube Parzelle 7: geschlossener Scan, Innenraum nicht sichtbar; Text unverändert (siehe „braucht Download“).
- 25 Vogelscheuche (Draht): Modell gehört ausbau_ost_west.js (nicht meine Datei).
- 33 Wegweiser Westweg, 34 umgestürztes Regal Amt: Ort unklar, keine Änderung.

## Braucht Download

- Röhrenradio mit Zierleiste/Skala in besserer Qualität (derzeit `ms/radio`), Kühlschrank/Herd als echte Scans (hier aus Einzelteilen gebaut), Strickjacke als Scan mit Strickstruktur (derzeit `w_jacke`, umgefärbt, flach), liegender Hund Bruno (kein Lege-Clip im Modell), Laube Parzelle 7 mit begehbarem Innenraum.
