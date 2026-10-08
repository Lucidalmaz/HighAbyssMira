# Inventar der Bedienelemente (Stand 08.10.2026)

Zweck: Welche Geräte der Spieler anfasst, wo sie gebaut werden und wie sie dargestellt sind. „Baukasten“ = neues Modul `app/mods/bedienung.js` (`BED.*`).
Darstellung: **Box** = einfache Quader/Flächen mit Materialfarbe, **Canvas** = auf Fläche gezeichnete Textur, **3D** = eigene Geometrie, **Scan** = Fab/Megascans-Modell, **Overlay** = 2D-Fenster (HTML) für die Eingabe.

| # | Gerät | Kap. | Modul / Ort | Art der Bedienung | Darstellung vorher | Status |
|---|-------|------|-------------|-------------------|--------------------|--------|
| 1 | Tastenfeld Kellertür (Code 3110) | 1 | Basis `keypadMesh`, Textur `kapitel1.js` ~178 | E, Overlay `#keypad`, Tasten 0-9, C, OK | Box .18×.26 + flache Canvas-Textur | **ersetzt** (BED.keypad) |
| 2 | Etikett „BITTE NICHT HÄMMERN“ | 1 | `kapitel1.js` ~186 | nur Anblick | Canvas-Decal | bleibt (Rätsel/Atmosphäre), sitzt über dem neuen Feld |
| 3 | Sicherungskasten (Hebel 1-6, Lights-out) | 2 | Basis `fusePanel`/`fuseCover`/`fuseLeds` (~3750) | E öffnet Klappe, Overlay `fuseOpenPanel` | graue Quader, 6 Leuchtquader | **ersetzt** (BED.sicherung) |
| 4 | Notentriegelung Brandschutztür (Hebel, Plombe, Rundumleuchte) | 2 | `feuer.js` ~256-267 | E halten (Fluchtphase) | flache Canvas-Platte (`relSign`) + Leuchtsprite | **angeglichen** an Notschalter der Szene (siehe Bericht) |
| 5 | Funkkasten (31,10 MHz, Kanal-Rätsel) | 3 | Basis `radioBox`/`radioLed` (~4134), Overlay `lucy3.js` (`radioPuzzle`) | E, Overlay mit Skala, Regler, Kanalfenster | grauer Quader + Canvas-Schild | **ersetzt** (BED.funk) |
| 6 | Schaltkästen der Stadtwerke (4 Stück, Hebel EIN/AUS) | 3 | `lucy3.js` `lucy3_hebelBau` | E, Reihenfolge-Rätsel | 3D (Emailleschild, Hebel, Schloss) | bereits hochwertig, unverändert |
| 7 | Lucys Autoradio (31,10) | 3 | `lucy3.js` ~478 | nur Klang | Fahrzeugmodell | unverändert |
| 8 | Telefonzelle / Hörer („Der Anruf“) | 1-6 | Basis `booth` (~1855), Kap. 5 `k5_telefon` | E hebt Hörer ab | 3D aus Boxen/Modell | unverändert (Kandidat Nachbesserung) |
| 9 | Funkgerät AG-06 auf der Werkbank | 2 | `amt.js` ~762-767 | E | Scan `w_funk` | Scan, unverändert |
| 10 | Nadeldrucker, Wippschalter, Tastenfeld des Druckers | 2 | `amt.js` ~268, ~292, ~605 | E | 3D aus abgerundeten Quadern (`amtp_rbox`) | bereits 3D, unverändert |
| 11 | Lautsprecher der Bandschleife, Nummernautomat | 2 | `amt.js` ~509-560 | E (Zettel), Knopf | 3D / Canvas | unverändert |
| 12 | Klavier (Messgerät-Melodie E-D-C-H-C) | 2 | Basis `piano` (~3929), `amt.js` ~1127 | E, Tonfolge | Box (Holz) + Tastenreihe | Kandidat (Tasten ohne eigene 3D-Drücke) |
| 13 | Röhrenradio Wunschkonzert | 5 | `kapitel5.js` ~254 | Anblick/Klang | Scan `radio` | Scan |
| 14 | Sicherungskasten Kühlraum (Villa) | 5/6 | `villa.js` ~565 | E (`villa_krKasten`) | Canvas-Decal | Kandidat |
| 15 | Tonbandgerät „Marion 2009“ | 5/6 | `villa.js` ~588 | E | Modell/Decal | Kandidat |
| 16 | Kassettenrekorder / B.tape | 1 | Basis ~1540, `kapitel1.js` | E | Box (Metall) | Kandidat |
| 17 | Spieluhr | 1 | Basis `musicBox` ~1486 | E | Box (Holz) | Kandidat |
| 18 | Fernseher | 1 | Basis `tvScreen` ~1406 | E | Fläche mit Rausch-Textur | ok |
| 19 | Zählbuch | 1 | Basis `zbook` ~4253 | E, Overlay | Box (Stoff) | ok (Buch, kein Gerät) |
| 20 | Uhren (Pendel-, Wand-, Küchenuhr, Bahnhofsuhr) | 1/2 | Basis ~4347, `innen_ort.js` ~121, `anwesen.js` ~257 | E, Uhr-Rätsel-Overlay | Canvas / Scan | ok |
| 21 | Ordnungstafel, Anschlagtafel/Chronik | 2/3 | Basis ~3725, ~4129 | E lesen | Canvas | ok (Lesefläche) |
| 22 | Nummern-/Zahlenrätsel, Schalter-Rätsel in Overlays | 2-6 | `puzzle`-Fenster der Module | Overlay | HTML/CSS | Overlays bleiben; Tastenfeld-Overlay an das 3D-Gerät angeglichen |
| 23 | Laternenschalter / Lampen im Ort | 3 | Basis `lamps`, `switchBoxes` | E | Boxen | siehe Nr. 6 |

Kap. 4–6 haben keine eigenen Schalt- oder Tastengeräte außer 8, 13-15; ihre Rätsel laufen über Gegenstände, Schilder und Overlays.

**Zählung:** 23 Einträge (Geräte/Gruppen), davon 4 in diesem Durchgang ersetzt/angeglichen (1, 3, 4, 5), 6 bereits 3D bzw. Scan, 7 weitere als Nachbesserungskandidaten markiert (8, 12, 14-17).

## Verständlichkeit (Auftrag Punkt 4)
- E-Hinweise (Interaktions-Label) eindeutig: Tastenfeld **„Code eingeben“** (offen: „In den Keller“), Sicherungskasten **„Sicherungskasten öffnen“ / „Sicherungen schalten“**, Funkkasten **„Funkgerät abstimmen“**.
- Rätselhinweise unangetastet: Tasten 0·1·3 abgegriffen (glänzendes Messing), übrige verstaubt (matt, Staub); Overlay-Tasten tragen weiter die Klassen `worn`/`dust`.
- Rückmeldung am Gerät: Display zeigt Eingabe (Striche für leere Stellen), „Err“ + rote LED bei falschem Code, „OPEn“ bei richtigem; rote LED und blinkendes „Err“ beim dritten Fehlversuch (die Szene färbt das Gerät rot).
- Klick-Töne: nur echte Aufnahmen (`switch1`, `switch2`, `metalHit2`, `buzz`, `metalOpen`), kein Sinuston.
