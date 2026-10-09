# QA Rätsel Kapitel 3 und 4 (nur Code-/Textanalyse, Stand 09.10.2026)

Methode: statische Analyse von kapitel3.js, lucy3.js, weiss.js, neben3.js, anwesen.js, villa.js, kirchberg.js, gedanken.js (GEDANKEN_FADEN, Festhänge-Schwelle 150 s) und Basis (`_base_source_index.html`). Keine Spielläufe. Kap. 4 (villa.js/anwesen.js) wurde nach den Befunden der Koordination und stichprobenartig im Code geprüft, nicht Zeile für Zeile.
Bewertung: OK = lösbar + verständlich · unklar = lösbar, Hinweis dünn/spät · defekt = Sackgasse/Fehlverhalten.

## Kapitel 3

| Rätsel | Lösung / Schrittfolge | Hinweise im Spiel (wo/wann) | Bewertung | Verbesserung |
|---|---|---|---|---|
| Aufwachen | W drücken (aufrappeln) | Toast „W – aufstehen“ nach 6 s | OK | – |
| Telefon an der Kreuzung | Klingelt 25 s nach der 3. Kuh-Stelle bzw. 60 s nach Kuh-Ende; Hörer abnehmen, E = Auflegen-Versuch | Klingeln mit Distanz-Lautstärke, Gedanke „Die Zelle hat seit Jahren kein Kabel…“ | war unklar: Aufgabenzeile blieb „Hol Lucy zurück…“ | UMGESETZT: bei Klingelbeginn `setC3('Das Telefon an der Kreuzung klingelt. Nimm ab.')` (kapitel3.js) |
| Kuh untersuchen (3 Stellen) | Ohr, Kopf, Flanke anklicken; Polaroid bei Flanke; Fluch-Gag beim 3. | Beschriftung „Kuh untersuchen · …“ | OK (optional, kein Blocker) | – |
| Funkkasten 31,10 MHz | Zählbuch in Nr. 7 („Notfunk auf dem Tag, an dem SIE kam“, „Ende Oktober“) + Radios in Kap. 1 mit Skala 31,10; Regler auf 31,10 (Toleranz 0,06), HINHÖREN | Aufgabe „Der Funkkasten… Welche Frequenz?“, Rückmeldung nah/fern, magisches Auge, nach 55 s Luke-Gedanke, Justin-Hilfe | OK | UMGESETZT V1: Aufkleber um Kuli-Zeile „nicht auf das erste Rauschen hören“ ergänzt (lucy3.js:184) |
| Kanal A/B, HASENBROT | Frage 3 „Sag unser Wort“ (A: „Hasen…“), Heckscheibe unten „HASEN…“; HASENBROT in den Staub schreiben, an KANAL B senden | Frage-Antworten, Heckscheibe, Luke-Gedanke nach allen Fragen, Fehlschlag: Lachen + Sperre 10 s, Whiskey-Striche (nach 2. Fehler/180 s), Zettel B-K3-H2 (3. Fehler), Justin-Satz | OK; Randfall: Wort laut gesagt ohne Frage „Wo bist du?“ führte zu Fehlschlägen ohne Text | UMGESETZT V6: nach lautem Sagen Luke-Zeile „Jetzt kann sie es auch. Nur eine weiß, wo Lucy wirklich ist.“ (lucy3.js). Zustand `tuned` wird gespeichert/geladen (B2) |
| Laternenfolge 5-3-1-7 | Hebel an Kasten Nr. 5, 3, 1, 7 | Zählbuch (Juni vor 5, Juli vor 3, Okt vor 1), Zettel „ZULETZT.“ an Kasten 7, Lucy-Funk, Fehlversuch 1 „Juni, Juli, Oktober…“, 3 „Hilde… als Letzte“, ab 4 Justin | OK | UMGESETZT B1: Hebel in den 2,6 s nach falschem Hebel gesperrt (`wrongBusy`), sonst Zustandsabweichung ch3.seq/Hebel |
| Graukind-Jagd (Ochs am Berg, Freimal) | Hinsehen = es steht; Eisen anfassen = 3 s sicher; weiterlaufen | Justin-Satz „Eisen ist frei“ (justin.js blechmaenner), Fibel R-K3d, Whiskey-Warnung auf Dach Nr. 1 | unklar für Spieler ohne Justin-Gespräch; Rückmeldung nach Fang war nur „Du bist.“ | UMGESETZT V7: Toast „Hinter dir geht eine Laterne wieder an. Der Hebel steht auf EIN.“ nach dem Fang |
| Behaltene / Lichtsäule | Zu Justin an die Kreuzung laufen, Eisen = sicher, dann Hand nehmen | Aufgabe „Zu Justin. An die Kreuzung.“, Justin-Ruf, nach 9 s Whiskey „Kum!“ | OK | – |
| Nimmerheim Raum 1 | Karte (Gegenstand, der in dieser Nacht nicht existierte) wählen | Aufgabe „Finde, was nicht in diese Nacht gehört…“, ab 2. Fehler Justin, 3. Fehler Kamera dreht sich zur Karte, 4. Luke-Gedanke | OK | – |
| Nimmerheim Raum 2 (Hilde, Küchenuhr 3:13) | Hilde-Fragen, Uhr auf 3:13 | Uhr überall im Spiel auf 3:13 (Kap. 1, Endkarte Kap. 2), Hilde-Satz, Aufgabe, Fehlversuch-Leiter | war defekt-anfällig: Hilfeleiter hing am deutschen Toast-Text | UMGESETZT B3: Zählung über Zustand (clockPuzzle-Hülle), V2: Fehler 2 = Hilde „Du hast sie doch schlagen hören, Junge.“, Fehler 3 = Justin „Die dritte Stunde…“ (weiss.js) |
| Raum 3 (Hände, „Wessen Hand ist aufgegangen?“) | Blatt SB-07 aufheben, 3+ Stellen ansehen, Tafel: JUSTINS | Aufgabe, Justin „Sieh, wohin du willst“, Fehlwahl-Leiter (Whiskey, Kamera, Luke) | war unklar: Tafel öffnet nur einmal selbst, Wiederöffnen nur über Justin; SB-07-Absturz = Hänger | UMGESETZT V5: Aufgabenzeile „Sieh dir die Hände an. Wenn du es weißt: sag es Justin.“; Absicherung: scheitert `sammeln_platz`, geht es direkt mit den Händen weiter |
| Wahl A/B/C | Entscheidung am Ende | Justin-Frage „Was will sie?“ | OK (Wahl, kein Rätsel) | – |

Nebenaufgaben Kap. 3

| Rätsel | Lösung | Befund | Bewertung | Verbesserung |
|---|---|---|---|---|
| Kapelle (Fenster, Kirchenführer, Sakristei, Sühnebrief, Gesangbuch) | alle 5 Punkte | Fibel-Aufgabenzeile nannte „Fenster x/8“ und „Glockenseil“ statt Sühnebrief (B5) | war unklar | UMGESETZT V4: `Fenster (n/4) · Kirchenführer · Sakristei · Sühnebrief · Gesangbuch` (neben3.js) |
| Glocken-Joker | Seil 16x: 3 · Pause · 13 | enges Zeitfenster, kein Feedback bei verworfenem Zähler | unklar | UMGESETZT: Toast bei misslungenem Rhythmus; V9: Glockenzettel um Rhythmus-Hinweis ergänzt (neben3.js) |
| Predigtmappe (Pfarrhaus) | 12 Wörter in Reihenfolge | Zeile nach Mappe-Fund | unklar | UMGESETZT V3: „Zwölf Predigten. Und ein dreizehntes Blatt, fast leer. Gegen die Lampe halten?“ |
| Register, RH, Peters Zimmer, Gully/Atlantschiss, Gisela | – | nicht vertieft geprüft (Koordination: lösbar) | OK (nicht vertieft) | – |

## Kapitel 4 (nach Koordinationsbefund: alle lösbar; nicht Zeile für Zeile geprüft)

| Rätsel | Befund | Bewertung | Änderung |
|---|---|---|---|
| Aufräumkommando, Vegas klopfen, Nr. 3, Nr. 9 (Ringbuch/Kameraloch/Dienstplan) | Aufgabenzeile über `villa_ziel()`, Gedanken `villa_nr9…` | OK | – |
| Prägepresse / 8 Schlüsselteile / Villa-Tür | Teil 04 (Kellerfenster) braucht Brechstange; bei Kapitelwahl/Weiterspielen ohne Inventar sonst gesperrt (B4) | war defekt (Sackgasse möglich) | UMGESETZT: `startChapter4` gibt die Brechstange, wenn sie fehlt (anwesen.js) |
| Halle, Arbeitszimmer, Aktenschrank „1958“, Krankenbett/Nachbild, Anrichte, Obergeschoss, Schleichen AG-13, Zelle Ost, AG-14 Wolter, W-11 Ring, Noten/Porträt, Treppe, Kino k4 | Hilfe-Gedanken `villa_r41a/b`, Checkpoints `todCheckpoint` | OK | – |
| Sicherungskasten Villa / Höhepunkt A | Farbkombination, Fehlversuch-Gedanken | unklar (Hinweis „Zwei nicht“ mehrdeutig) | UMGESETZT V8: `villa_r43b` = „Vier Schilder kann ich lesen. Zwei nicht – das müssen die hier unten sein. Und ich weiß, welche Farben dafür übrig sind.“ (villa.js) |

## Vorschläge GEDANKEN_FADEN (nicht umgesetzt, in gedanken.js einzufügen, vor `[/./, …]`)

Hinweis: Treffer ist der erste passende Eintrag; `/Luke|Leiter/` (Z. 292) würde jede Aufgabenzeile mit „Luke“ abfangen. Die neuen stehen ohne „Luke“/„Leiter“.

```js
  [/Das Telefon an der Kreuzung klingelt/, 'Es klingelt und klingelt. Wer bei so einem Klingeln nicht rangeht, hat nie Kinder gehabt. Also los.'],
  [/Hol Lucy zurück/, 'Irgendwer hat mir das Telefon hingestellt. Ich such jemanden, der mir sagt, wo man anfängt. Justin, vielleicht.'],
  [/Der Funkkasten an der Kreuzung\. Welche Frequenz/, 'Der Tag, an dem sie kam. Hilde hat ihn aufgeschrieben. Und Tag und Monat sind zwei Zahlen. Kurzwelle kennt Kommas.'],
  [/Laternen müssen aus/, 'Frau Wendt in Nr. 7 hat ihre Nächte aufgeschrieben. Kein Zeichen von ihr, bis ich bei ihr drin war.'],
  [/Lösch die Laternen/, 'Roxy zuerst, dann Mike, dann ich. Hilde kommt zuletzt. Welche Hausnummern waren das?'],
  [/Zu Justin\. An die Kreuzung/, 'Nicht stehen bleiben. Und wo Eisen ist, bin ich frei.'],
  [/Nimm Justins Hand/, 'Er steht da und wartet. Ich lass nicht los. Das hat er gesagt.'],
  [/Finde, was nicht in diese Nacht gehört/, 'Alles hier gab es an dem Abend, bevor er ging. Was fehlt in dem Bild? Oder: was kommt erst danach dazu?'],
  [/Stell die Küchenuhr/, 'Wann haben sie mich geholt? Die Uhr in Kap. 1 ging auf 3:13. Die Glocke hat dreizehnmal geschlagen.'],
  [/Sieh dir die Hände an/, 'Wessen Hand ist aufgegangen? Miras Finger, Justins Handschuh, der Stiefel an der Kante. Und dann Justin sagen, was ich sehe.'],
  [/Am Rand der Wiese liegt ein Blatt/, 'Im Reif liegt etwas Helles. Ein Blatt. Hinsehen kostet nichts.'],
  [/Schließ die Tür auf/, 'Acht Teile, ein Schlüssel. Wer noch fehlt, steht in meiner Fibel. Und der Rabe weiß es auch.'],
  [/Dir fehlen noch/, 'Ich such nach etwas Eisernem. Zwischen Laub, unter Steinen, hinter Gittern. Dazu brauch ich die Brechstange.'],
```

Anmerkung zu Zeilen, die schon vorhanden sind und passen sollten: `/Lösch die Laternen/` besteht bereits (Z. 291).

## Weitere offene Punkte (nicht umgesetzt)

- Kapitel 4: vertiefte Zeile-für-Zeile-Prüfung von villa.js (1216 Zeilen) steht aus; die Laufzeit-Inventur sollte Aktenschrank „1958“, Dienstplan und Sicherungskasten-Farbfolge bestätigen.
- Kap. 3 Funkkasten: der Monat der Frequenz („31,10“) ergibt sich nur aus „Ende Oktober“ + Kap.-1-Radios; ein expliziter „31.10.“-Satz im Zählbuch-Text (kapitel3.js:141) würde das absichern (Story-Text, nicht angefasst).
