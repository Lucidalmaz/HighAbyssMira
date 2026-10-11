# Schrift-Audit Canvas-Zettel/Schilder (Teil 3, 11.10.2026)

Werkzeug: `C:\Users\GIGABYTE\_fx\qa_c_schrift.js` (in der Entwicklungsfassung, Kapitel-4-Sitzung, 8,8 s Laufzeit). Es prüft jede sichtbare Fläche mit Leinwand-Textur und geschriebener Schrift (459 Flächen): Leserichtung (gespiegelt), Seitenverhältnis (gestreckt), Unterlage (versenkt/Z-Fighting), Sichtbarkeit von drei Standpunkten (verdeckt / halb verdeckt).
Wichtig: Die Messung ist geometrisch und hat viele Scheinbefunde (Flächen ohne Rückseitenerkennung, Bodenaufleger, am Ursprung geparkte Modelle, Kleinstdecals). Deshalb wurden **alle 53 prägnanten Kandidaten** (Fläche ≥ 0,04 m², sichtbar im Spielraum, nicht am Ursprung geparkt, nicht Boden-Mikro-Decal; Duplikate zusammengefasst) einzeln im Bild geprüft: Kontaktbögen `fotos_1110/kontakt_schrift_0/1.jpg` (20 Flächen), `kontakt_schrift2_0/1/2.jpg` (29 Flächen), Gegenprobe `kontakt_schrift_pruef.jpg`, nach der Korrektur `kontakt_schrift_nachher.jpg`.

## Zahlen (Messwerte)
| Klasse | vorher (Audit 09.10.) | Lauf 11.10. vor Korrektur | Lauf 11.10. nach Korrektur | Bemerkung |
|---|---|---|---|---|
| gestreckt | 63 | 61 | 60 | meist kleine/leicht verzerrte Schilder; prägnante im Bild lesbar |
| halb verdeckt | 93 | 92 | 84 | durch Regale/Möbel (Amt), Rest Standpunkt-Artefakt |
| verdeckt | 52 | 56 | 59 | Mikro-Decals, am Ursprung geparkte Gegenstände, Zaun vor Schild (gewollt) |
| versenkt (Fläche davor) | 31 | 36 | 36 | überwiegend Mikro-Decals (Kreide, Flecken, Abziehbilder, Tiefe 3–26 mm bei 2–5 cm Größe), drei übereinandergeklebte Sommerfest-Plakate (gewollt), Schuppenschild (behoben; die Messung zählt es nach dem Umbau weiter, weil das ausgeblendete alte Schild noch Fläche ist) |
| gespiegelt | 10 | 10 | 10 | 4× Schalter „EIN/AUS“ (Rückseite gemessen), Bodenzahlen „10“, 2 Schilder: **Scheinbefund** (Rückseite statt Straßenseite gemessen, im Bild lesbar) |

## Echte Fehler (im Bild bestätigt) und Behebung
| Fund | Ort | Befund | Behebung | Note vorher → nachher | prägnant | Beleg |
|---|---|---|---|---|---|---|
| Ortstafel „Lost Eyengless“ | (−72,2,6) | Ortsname schlug über den Rahmen (Font fest 150 px auf 1024 px), die beiden Pfosten standen VOR der Tafel und verdeckten „L“ und „s“ | Schrift per `measureText` einpassen; Pfosten hinter die Tafel (x −72,34 → −72,20) | 4 → 2 | ja | `kontakt_schrift2_0` H25 / `kontakt_schrift_nachher` F1 |
| Kennzeichen „BH·L 2310“, „BH·KM 1987“, „BH·HW 713“ (Lucys Auto, Parkwagen) | Sperre (2,−35), Straße (−39,3), (34,3) | Text breiter als das Schildfeld, letzte Ziffer abgeschnitten | Schriftgröße per Messung einpassen (≤ 410 px) | 4 → 1 | ja | H03 vor / F2, F4, F5 nach |
| Schuppenschild „SCHROTT · KRANZ“ / „REIFEN – KRANZ“ | Tankstelle, Schuppen (101,2,4,−26,5) | zwei Schilder am selben Platz; das vordere nur 1,2 cm vor dem Blech (flimmerte/verschwand), das hintere 1,2 cm im Blech | „REIFEN – KRANZ“ (Story, post.js) 4,5 cm vor die Wand, altes Schild ausgeblendet | 4 → 2 | ja | G11 vor / F3 nach |

## Geprüft ohne Fehler (Auswahl, Bild belegt)
Hausnummern „Nr. 1/3/5/7“ am Schaltkasten (lesbar, leichte Streckung 2:1 → Note 2/3), Tankstellenschild „TANK STELLE KRANZ“ (lesbar), Aushang „Nachtruhe“, Gemeinde-Chronik, Kühlschrankzettel „KELLER BLEIBT ZU“, Kalender „OKTOBER“ / „JULI 2009“, „Der Laternenbote“, „Protokoll siebzehn“, Brandschutztür, Notenblatt „Lucys Lied“, Fahrplan, Wegweiser „KIRCHWEG“ (Überschrift knapp am Rahmen, Note 3), „SPIELPLATZ“ (Note 3), „ZU VERKAUFEN“ (von der Straße lesbar; Messung nahm die Rückseite), Magnetschild „Institut für Atmosphärenforschung“ am Transporter (von außen lesbar), Amt-Schilder hinter Regalen (HÄNGEREGISTRATUR, KANTINE, Dienstanweisung 4: teilweise verdeckt, lesbar), „FORSTBEZIRK NORD“ hinter dem Zaun (gewollt).
Nicht belegt: „DAS LICHT“ (Amt, Langer Gang, 3,6 × 0,8 m) war von keiner Seite im Bild zu sehen (Messwert „gestreckt 0,16“): vermutlich Wandschrift, die erst in einem Ereignis erscheint; Note 3 (nicht prägnant), keine Änderung.

## Auflösung/Mipmaps
Canvas-Texturen: 0 ohne Mipmaps (Audit 10.10.), 7 Hintergrund-Decals < 100 px/m belassen. Kennzeichen: 512 px über 0,52 m (≈ 980 px/m), Ortstafel: 1024 px über 1,4 m (≈ 730 px/m); beide mit Mipmaps (CanvasTexture), im Bild bei 1,3 m lesbar.

## Ergebnis
Echte prägnante Fehler: 3 Gruppen, alle behoben und im Bild belegt. Übrige Messbefunde: Hintergrund/Scheinbefund (Note 3 erlaubt, 2 bei den geprüften prägnanten). Keine Massen-Neuerzeugung.
