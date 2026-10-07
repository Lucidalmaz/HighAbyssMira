# Umsetzung Text gegen Welt: Basisspiel und Ausbau-Module

Stand: 07.10.2026. Grundlage: `basis_ausbau.md` (62 Lücken). Geändert wurden nur: `_base_source_index.html`, `innen_ort.js`, `ausbau_nord.js`, `ausbau_ost_west.js`, `gruen.js`, `fassaden.js`. Keine Commits, keine Kopien.

Gemeinsame Bausteine (in `ausbau_nord.js`, überall nutzbar, nur zur Bauzeit aufrufen): `bu_ritz` (Ritz-/Kreide-Abziehbild mit Höhenrelief aus `ritzschrift.js`), `bu_an` (Ebene exakt auf eine Fläche legen), `bu_strahl` (Strahl auf Modelle, ohne Sprites), `bu_mod` / `bu_teil` (Scan-Modell bzw. Einzelteil), `bu_kiesel`, `bu_strauss` (Astern), `bu_spaten`, `bu_kinderschuh`, `bu_grablichtBecher`, `bu_gras`, `bu_karton`, `bu_taschentuch`, `bu_etikett`.

## Ergebnis je Lücke

Abschnitt 1, Basisspiel
- Fußmatte Nr. 1 mit Schlüssel darunter: umgesetzt (Kokosmatte, vordere Ecke angehoben, Messingschlüssel schaut hervor).
- Mäntel + Kinderschuh im Schrank Nr. 1: umgesetzt (zwei Mäntel aus `w_jacke` an der Stange, Klettverschluss-Kinderschuh ganz hinten, selbst gebaut).
- Luke-Wandbild sieben statt acht Figuren: umgesetzt (`k < 7`, „wir 7“; das achte erscheint weiter über `eighthFigure`).
- Kellertür „Stahltür“: Text im Basisspiel auf „Eine schwere Tür“ geändert. Der gleiche Wortlaut „Stahltür“ steht noch in `kapitel1.js:333` (nicht meine Datei).
- Echo Brand (Feuerzeug, brennendes Haus): umgesetzt (Flammen an den Resten von Nr. 5 mit Licht, Feuerzeug mit Flamme in der Hand der Figur, nur solange das Nachbild läuft).
- Kratzspuren an Türrahmen (niedrig): umgesetzt für Nr. 2/4/6/8/9 (`ritz_kratzer`).
- Auto: Schlüssel / Laub (niedrig, unklar): nicht (Autos werden von `strasse.js` ersetzt).
- Panda-Anhänger am Schlüssel: umgesetzt (kleiner Panda mit abgebrochenem Ohr und Kugelkette am Schlüsselring).

Abschnitt 2, `innen_ort.js`
- Fensterbrett-Striche: umgesetzt (Ritz-Dekal auf dem Sims, Fünfergruppen); Text auf „Fünfergruppen“ angeglichen (`bewohnt.js` und `zeichen.js` hatten schon fünf).
- Heller Fleck hinter dem leeren Rahmen (niedrig): umgesetzt.
- Kratzspuren vom umgekippten Stuhl zur Kellertür: umgesetzt (vier Streifen, bis in den HWR).
- Fußabdrücke + Grashalme auf dem Laken Nr. 7: umgesetzt.
- Müllsack: sieben leere Grablicht-Becher + Kinderschuh (niedrig): umgesetzt.
- Karton „für die Kinder – jede Nacht eins“ (niedrig): umgesetzt.
- Streichholzschachtel neben dem Kanister (niedrig): umgesetzt.
- Klebeband am Radioknopf (niedrig): umgesetzt.
- Milchzahn im Taschentuch („Luke, 7“): umgesetzt (niedrig).
- Keller-Stuhl: sieben Striche + tieferer achter: umgesetzt.
- Einmachgläser mit Etiketten 1975 / 1992 / 2009 / 2026: umgesetzt.
- Eisenbett-Riemen (niedrig, unklar): umgesetzt (drei Lederriemen mit Schnalle).
- Puppe, Namensband am Handgelenk (niedrig): nicht (Handgelenk im zusammengefassten Puppennetz nicht ansprechbar).
- Kassettenrekorder im Keller Nr. 7: umgesetzt, der Quader ist unsichtbar (nur noch Klickfläche), darauf steht der Scan `radio` (ohne Röhren und Kabel) plus eine Kassette. Besser wäre ein echtes Kassettenrekorder-Modell: braucht Download.

Abschnitt 3, `ausbau_nord.js`
- Himmel und Hölle: umgesetzt (neu gezeichnet, Kreide-Stil, sechs Reihen à 50 cm, 7 und 8 sichtbar, nur die 8 frisch nachgezogen mit LUKE in roter Kreide, Rest ausgewaschen).
- Acht Grabsteine am Gedenkfeld: umgesetzt (achter Stein ohne Namensplatte, ohne Beet, neben Luke, mit Hinweis beim Ansehen).
- Madonna: umgesetzt (rotes Haarband zweimal um die gefalteten Hände, Knoten mit zwei Enden; laminierter Zettel mit Folienrand lehnt am Sockel). Lage per Strahl am Modell bestimmt.
- Sühnekreuz: umgesetzt (Ritzung Schwert, 1312, verwitterte Umschrift; sieben Kiesel in einer Reihe, achter abseits).
- Zayn: umgesetzt (Astern-Strauß mit Bindfaden, Moos am Sockel mit gekratzten Strichen in Fünfergruppen).
- Dina: umgesetzt (Kreidekreise um den Namen).
- Heidi: umgesetzt (aufgeweichte Postkarte ohne Absender lehnt am Stein).
- Luke: Spaten umgesetzt (Stahlblatt mit Erde, T-Griff, steckt im Erdhügel neben der Plane, nur sichtbar solange die Plane liegt).
- Eisenkreuz: acht Haarbänder umgesetzt (sieben graue, ein rotes neues, per Strahl an die Ranken gehängt).
- Rutsche: nasse Handabdrücke umgesetzt (acht Abdrücke, die hinaufführen).
- Kranz (niedrig): umgesetzt (Kreide auf dem Sockel).
- Lucy / Mike / Brandt / Unbekanntes Kind (niedrig): umgesetzt (Fingerspuren im Moos, 2026 geritzt und schief, LUCY im Moos, 08 vorn und ein Auge auf der Rückseite).
- Fahrkarte Datum (niedrig): Text auf 28.07.2009 angeglichen. Fahrplan „je einer“ auf „je zwei“ geändert.
- Plakat 1975 (niedrig): umgesetzt (Kind mit Scheitel).

Abschnitt 4, `ausbau_ost_west.js`
- Geldkassette: umgesetzt (Blechkassette mit Tragegriff, Zahlenschloss mit vier Rädchen, „P. K.“ im Deckel).
- Schaufenster: Text „leere Regale“ geändert (die Regale sind bestückt); acht Pappbecher auf dem Tresen, einer umgefallen, der neunte erscheint nach der Licht-Szene; Handabdrücke im Staub von innen am Glas.
- Picknicktisch: umgesetzt (acht Teller, acht Gabeln, neun Kiesel).
- Hildes Laube: umgesetzt (Bank, Schuhkarton „Nächte“, Blechdose, Streichholzschachtel, Petroleumlampe mit kleiner Flamme und Licht, zwei Stühle, auf dem zweiten ein eingedrücktes Kissen, Zettel „Drei. Immer drei.“ mit Reißzwecke).
- Roxys Heft: umgesetzt, aber außen: Hocker vor den Fenstern der Laube mit dem Scan `lbook` (die Laube ist innen nicht einsehbar); die Klickfläche wurde dorthin verlegt. Im Test sichtbar die Laube, das Heft nicht eigens verifiziert.
- Ladentür-Schild „Komme gleich wieder“: umgesetzt (Pappschild mit Staub); Text „An der Tür“ statt „Hinter der Tür“.
- Zapfinseln: umgesetzt (vier abgeschnittene Bolzen je Insel, Ölfleck, acht Kreidestriche).
- Reifenstapel: umgesetzt (I bis VII in Kreide, achter Strich frisch).
- Heuballen: umgesetzt (Mulde auf dem obersten Ballen, acht Kiesel im Kreis).
- Stalltür: umgesetzt (1312 und 2026 geritzt über dem Eingang).
- Traktor: umgesetzt (Kreidepfeil nach Osten auf dem Kotflügel).
- Fahrrad (niedrig): nur rot getönt, der Aufkleber „L. B. – 4b“ fehlt (Lage des Gepäckträgers im Scan unbekannt).
- Vogelscheuche (niedrig, unklar): nicht geändert (trägt bereits ein abgewetztes blaues Hemd; ein eigener Jackenversuch sah schwarz aus und wurde entfernt).
- Schrottbüro-Kalender: umgesetzt (Juli 1992, Tage bis zum 13. durchgestrichen), hängt außen an der Brettwand (verifiziert); Text angepasst.
- Transporter (niedrig): nicht (Ladefläche geschlossen, Schriftzug nicht einsehbar).
- Verkehrsschild (niedrig): umgesetzt als Zusatzschild mit Filzstift „AUSFAHRT AUCH.“; Sperre-Aushang mit Kuli-Zeile ergänzt.
- Container, ausgebranntes Auto, Schrottauto (niedrig): nicht (geschlossene Behälter).

Abschnitt 5, `gruen.js`
- Lichtung: Bäume stärker nach außen geneigt (12 bis 19 Grad statt 8 bis 14).
- Zaun 1 (Nord): Drahtstränge nach außen gebogen (umgesetzt).
- Zaun 2 (Ost): Stacheldrahtstrang mit Stacheln, daran nasse helle Haare (umgesetzt).
- Zaun 3 (West): Pfahl mit sieben alten und einer frischen Kerbe (umgesetzt).
- Zaun 4 (Süd): Baumstumpf erscheint hinter dem Zaun, sobald man nicht hinsieht (umgesetzt, `w_stumprot`).
- Absperrgitter (niedrig): Drahtwicklungen an den Pfosten (umgesetzt).

Abschnitt 6, `fassaden.js`
- Nr. 2: Fenster 0 zeigt jetzt die Küche mit Radio (umgesetzt).
- Nr. 6: gedeckter Tisch mit acht Gedecken und acht Stühlen zum Fenster (neue Möbel-Karte, leicht von oben gerendert).
- Nr. 9: Strichwände (neue Karte; Rück- und Seitenwände, letzte Gruppe nur drei). Das Fenster ist vernagelt; die Karte erscheint hinter den Brettern.
- Nr. 8 Kellerfenster (niedrig): Kinderstuhl mit dem Rücken zum Fenster und Kerze (umgesetzt).
- Atlas von 5 auf 8 Spalten erweitert (`fCard`, Viewport, Zellenindex).

Abschnitt 8, Ladefehler: `innen_ort.js` fängt die Promise.all-Modellfehler jetzt ab (Warnung statt Abbruch).

## braucht Download
- Echter Kassettenrekorder (Keller): bisher Scan `radio` als Näherung.
- Kinderschuh (Klettverschluss, Größe 31/33): selbst gebaut, ein Scan wäre besser.
- Spaten und Pandaanhänger: selbst gebaut (kein passendes Modell vorhanden).
- Astern/Blumenstrauß: selbst gebaut aus Planes und Röhren; ein Blumen-Scan wäre besser.
- Handabdrücke, Taschentuch, Postkarte: Abziehbilder.

## Auffälligkeiten
- Beim Bauen liefen vor meiner Änderung mehrere Module (`neben3x Schilder`, `Kap. 3 Hufeisen`) in `Cannot read properties of null (reading 'matrixWorld')`. Ursache: Strahlen über Gruppen mit Sprites (Raycaster ohne Kamera). Mein `bu_strahl` setzt die Kamera und überspringt Sprites.
- Dateien wurden von mir mit CRLF gespeichert (wie im Repo-Stand HEAD).

## Testlage (07.10., Abschluss)
Verifiziert per Screenshot: Himmel und Hölle, Gedenkfeld (Zayn Astern, Mike 2026, Dina Kreise, Heidi Postkarte, Spaten, Madonna Haarband + Zettel), Kranz-Kreide, 08 am unbekannten Kind, Sühnekreuz-Kiesel, Kiosk (acht Becher, Handabdrücke, Schild, Kassette), Zapfinsel-Kreidestriche, Picknicktisch (acht Teller), Hildes Laube (Stühle, Lampenschein), Stalltür-Brett, Schrottbüro-Kalender, Verkehrs-Zusatzschild, Echo Brand (Flammen, Licht), Keller (Radio als Rekorder, Etiketten, Eisenbett), Nr. 7 (Bett Gras, Karton).
Nicht verifiziert (gebaut, Build und Syntax laufen, kein Fehler im Spiel-Log, aber im Bild nicht erkennbar oder nicht aufgenommen): Eisenkreuz-Haarbänder (nach Korrektur nicht erneut getestet, vorher 0 gesetzt), Rutsche-Handabdrücke, Reifen-Kreide (Treffer vorhanden, im Bild nicht lesbar), Traktor-Pfeil (nach Korrektur nicht getestet), Heuballen-Mulde, Zapfinsel-Bolzen, Fassaden-Karten Nr. 6/9/8-Keller und Nr. 2, Fußmatte mit Schlüssel, Panda am Schlüssel, Zaun-Details (Nord/Ost/West/Süd), Lichtung, Türrahmen-Kratzer, Fensterbrett-Striche, Taschentuch/Milchzahn, Mäntel + Kinderschuh im Schrank, Eisenbett-Riemen (nach Korrektur nicht getestet).
