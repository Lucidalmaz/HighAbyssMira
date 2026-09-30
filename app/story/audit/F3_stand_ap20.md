# Stand AP-20 · Kapitel 4 · Nebenaufgaben

Stand 01.10.2026. Alle acht Aufgaben stehen mit ihrem Fibel-Namen in der Fibel. Jede Startbeschreibung sagt, **warum** Luke das tut. Weg c von „Unzustellbar“ schaltet „Der gelbe Kasten“ (Kap. 5) frei.

## Module / Anker
- **neu `neben4.js`** (ORDER nach `neben3`; je ein `WORLD_MODS`/`WORLD_TICK`, `MOD_SAVE` 'neben4' = `{ st }`): Register der acht Aufgaben (`kap: 4`), dazu `k5_kasten` (versteckt), Kapitelende über `KAP_END[4]`, Kap.-5-Start über `KAP_BEGIN[5]`.
  - **Gasleck:** drei Kerzen (Basis `candleAt`, beim Laden angelegt) vor Nr. 7, jede mit einem Polaroid. Der Arbeiter b2 geht seine Wegpunkte (villa.js) ab und tauscht ab 25 s nach dem Start alles, was er erreicht, gegen leere Bilder. Das Absperrband sind vier Leitkegel (Scan) mit Bandstreifen. Wer im Blick eines Arbeiters (< 14 m, Blickkegel) unter dem Band durchgeht, bekommt −4 (`ag11_band_n`) und die Zeile „Wir schreiben das sonst auf“. K4-2: Whiskey landet auf der Blechkiste und lässt das vierte Bild fallen. Getauschte Bilder liegen in der Mülltüte hinter der Tonne von Nr. 9. Wenn das Kommando weg ist (Villa offen), steckt Luke die Bilder zurück. Danach schreibt er mit Hildes Kreide „EISEN IST FREI“ an den Laternenpfahl (20 | 4,6). Kommt er wieder, steht darunter „Bitte nicht auf Gemeindeeigentum.“ Schreck am zweiten Bild: neun Paar Füße, das neunte schwebt, dazu leises Tappen.
  - **Kassler, vier achtzig:** Ab Kap. 4 öffnet der Zettel E-18 in Nr. 4 (Buffet) das ganze Haushaltsbuch: E-18, drei Seiten, die letzte Seite ohne Jahr (Schreck) und Lukes Kassler-Satz. Luke kann das Buch einstecken → Gegenstand `haushaltsbuch`. AG-12 bietet dann in villa.js Weg 2 an (auch am Kombi bei „Später“). Fibel: „Oma Ernas Donnerstage“. Das Buch ist jetzt grün, wie im Kanon.
  - **Unzustellbar:** Günther (Rad und Figur aus post.js) wartet nach AG-12 am Gartentor von Nr. 1. Er erscheint nur, wenn Luke mehr als 28 m entfernt ist; die Szene startet unter 7 m. Wortlaut aus der Bibel, dazu zwei kurze Brückenzeilen zum Brief aus Kap. 1.
    - (a) Lucys Zigaretten, (b) Drohung mit −10 (`unzustellbar_drohen`, später Funk „Maas meldet …“): `kirchberg_oeffne('schuppen')`, Günther fährt los.
    - Im Schuppen: Günther sitzt auf dem Hocker (`figuren_embody` mit `sit`). Sieben Fundstellen (AHORN 1/5/7, HOF, ZEITUNG, Postsack 1975, Postsack 1959) zeigen die vollständigen Brieftexte; jeder Brief kommt in die Fibel.
    - Nach dem 3. Brief flackert die Röhre, dazu Günthers Satz. Nach Hedwigs Briefen: Dunkelheit, Tappen, **B-K4-N6** auf dem Hocker, Günther steht an der Tür.
    - Nach allen sieben bricht er zusammen, Eddas Brief bleibt bei ihm, Luke bekommt die Thermoskanne `thermos_bfr`, Whiskey klingelt.
    - (c): Günther fährt 20 m, kommt zurück („Mach ich aber nicht.“) und fährt weg. Der Schuppen bleibt zu, b4 faltet am Tankstellenvorplatz Band, an der Schuppentür kommt der Gedanke „Heute Nacht.“ Die Aufgabe bleibt über das Kapitelende offen.
  - **Der Kreisel, der nicht umfällt:** Teedose mit vollem Wortlaut (Vorderseite, Rückseite Tinte und Kuli). Davor der Humor, die Heizung tickt dreimal beim Umdrehen, danach Lukes Wiedererkennen und die Fibel „Grete und Heinrich“. Luke kann das Foto einstecken (`villa_setz('gretefoto')`, die −5 kommen wie in AP-19 über AG-14). Das Album-Bild ist ein Sepia-Abzug mit Zackenrand, gerendert mit zwei Kinderfiguren auf einer eigenen Bühne. Die Aufgabe bleibt für Kap. 5/6 (HEINI) offen.
  - **Aus aller Welt:** Der erste Blick auf die Karte bleibt (Z-10, Lukes Satz), danach kommt das Rätsel (`openPuzzle`): sechs Ausschnitte auf neun Nadeln, Zuordnung nach Bibel-Reihenfolge (1 OH … 7 wir. … 9 NORD). Hilfeleiter: nach 2 Fehlern Lukes Satz, nach 4 Whiskey an der Scheibe (Klopfen), nach 6 Nadellöcher, nach 8 **B-K4-N5**. Gelöst: Tonband `tonband_ast` wird abgespielt, dann klopft es dreimal in der Wand (Schreck 2). Fibel „Die neun Außenstellen“ (AST 6 seit 1983 ohne Personal). Mit dem Band bei Vegas: „Der Ural! … Siehste.“
  - **Papas Marke:** Nach dem Batterie-Zoll bietet Vegas die Frage „Nach dem Vogel fragen“ an (höchstens zweimal), das startet die Aufgabe. `whiskey_papasMarke` (AP-08) meldet danach `neben4_marke()`: Chip am Schlüsselbund, Gedanke zu „Wîse“, Aufgabe erledigt. Spielt K4-4 ohne die Frage, wird sie trotzdem erledigt.
  - **Siebzehn Näpfe (Kap. 4, eigener Schlüssel `k4_naepfe`):** Ab UK 2 kommt an der Kreuzung der Funkspruch. Der weiße Transporter des Kommandos (Scan `vans`, aufgehellt, Kollision nur solange das Kommando da ist) steht dort, dazu Kiesel (`beob_spur`, Kap. 4). Keiner wird hochgehoben und als Schal getragen. Am Napfbrett steht Gisela (`kirchberg_S.zaun`), sagt ihre Zeilen, und mit Akte K-2 kommt die Frage nach dem Namen. Wer Hedwigs Briefe gelesen hat, bekommt einen Zusatzgedanken. Keiner bleibt am Napf, Fibel „Keiner“.
  - **Dieselbe Kanne:** Mit der Thermoskanne im Inventar startet ab UK 2 der Gedanke zu Justins Satz und „G. W.“ auf dem Boden. Nach AG-14 (Hinstellen +5 aus AP-19/lwo) heißt der Gegenstand „Thermoskanne G. W.“, Aufgabe erledigt. Ohne Kanne aus Kap. 3 bleibt die Aufgabe verborgen (Kanon: nur bei hohem Vertrauen in Kap. 3).
  - **Polaroids (Album):** vier Bilder mit Hildes Kuli hinten (`k4_pola_0…3`, Serie „Dazwischen“):
    - 0 und 1 sind Ausschnitte aus `fotos/kreuzung.jpg`, Bild 1 kalt und mit dem schwebenden Neunten.
    - 2 und 3 sind echte Scans (Teddy, Rabe), gerendert auf einer eigenen kleinen Bühne mit Blitz und Sofortbild-Körnung.
    - Die Bühne liegt außerhalb der Welt, ihre Lichter entstehen einmal beim ersten Foto; die Hauptszene bekommt keine Lichter zur Laufzeit.
- **Haken (klein, per `typeof`):**
  - `villa.js`: `villa_vegasNochmal` → `neben4_vegas()`, `villa_azKarte` → `neben4_karte()`, `villa_ogTeedose` → `neben4_teedose()` (alter Code bleibt als Rückfall).
  - `nr4.js`: `nr4_lesen('E-18')` ab Kap. 4, `nr4_S.hb`/`hbZettel`, Buchfarbe grün.
  - `whiskey.js`: `whiskey_papasMarke` → `neben4_marke()`, Fibel-Zeile „Er hebt auf …“.
  - `kirchberg.js`: Sichtbarkeit Giselas mit `S.zaun`.
  - `assemble.js`: ORDER.

## Schnittstellen für Kap. 5 (AP-21/22)
- `neben4_hat('gasleck_zurueck')`: Die Bilder wurden zurückgesteckt, also brennt in Kap. 5 eine neue Kerze, die keiner angezündet hat.
- `neben4_postWeg()` gibt `'a'|'b'|'c'|null` zurück.
- `neben4_hat('post_c')`: Der Schuppen ist noch zu. Einbruch mit Brecheisen (−15 `schuppen_aufbrechen`), B-K5-N1, leere Kisten; danach `sideDone('k4_post')` und `k5_kasten` weiterführen.
- `neben4_hat('post_ab')`: Der Schuppen ist leer, `kirchberg_S.offen.schuppen` bleibt true. Den Nachmittag, an dem Günther austrägt, legt AP-21/22 fest.
- `k5_kasten` („Der gelbe Kasten“) ist registriert. Bei Weg c startet die Aufgabe mit Kapitel 5 von selbst; sonst startet AP-22 sie an der Kreuzung.
- `neben4_hat('grete_foto')` → Polaroid „HEINI“ möglich; `k4_kreisel` bleibt aktiv und wird in Kap. 5 abgeschlossen (Polaroid in der Fibel).
- Das Einkaufswagen-Pfand im Nest (Kap. 4, UK 5) ist nicht Teil dieses AP.

## Kurzcheck
Ein Lauf über `_testgate.sh`, Skript `_ap20_run.sh`, Schritte `C:/Users/GIGABYTE/_ap20_t/mk.js`. Das gemeinsame `assemble` scheiterte da gerade an fremden Baustellen, deshalb lief der Check auf einem eigenen Testbau. Der ist wieder gelöscht. Inzwischen baut `node tools/assemble.js` mit `neben4.js` fehlerfrei. Der Lauf nutzte `--root=game`: Dort fehlt `vendor` (KTX, BVH), deshalb sind Texturen und Shader im Bild kaputt. Das kommt vom Testaufbau, nicht vom Modul.
- ✓ Beim Start stehen Kerzen und Transporter, alle acht Aufgaben sind versteckt.
- ✓ Kassler: erledigt, Gegenstand da, Fibel da.
- ✓ Unzustellbar Weg b: −10, Schuppen offen; Günther sitzt, alle 7 Briefe in der Fibel, Aufgabe erledigt, Thermoskanne da.
- ✓ Kreisel: Foto eingesteckt, Album und Fibel da, Aufgabe bleibt aktiv.
- ✓ Aus aller Welt: Rätsel geht auf, gelöst gibt es das Tonband, Aufgabe erledigt, Vegas-Zeilen kommen.
- ✓ Papas Marke: Frage und Abschluss funktionieren.
- ✓ Siebzehn Näpfe: Funkspruch, Keiner getragen, Gisela am Zaun, Aufgabe erledigt.
- ✓ Dieselbe Kanne: Start, nach AG-14 heißt sie „Thermoskanne G. W.“
- ✓ **Fibel: 8 von 8 sichtbar.** Weg c startet `k5_kasten`. Kapitelende schließt Gasleck; Kreisel und Weg c bleiben offen.
- ✓ Lichter 18 vor und nach dem Lauf, keine Fehler aus `neben4` im Log.
- **Gasleck nur teilweise geprüft:** Im Test lief die ganze Zeit eine Szene („Fünf Minuten“), deshalb blieb `n4_frei()` falsch. Nicht bestätigt sind damit Bilder aufnehmen, Band −4, Whiskey K4-2 und das Rabenbild. Aufgabenstart, Kerzen und Kreuzungsbilder gingen.
- Nach dem Lauf korrigiert, nicht erneut geprüft: Günthers Blickrichtung im Sitzen (sah zur Wand) und Giselas Haltung am Zaun (stand noch in der Fenster-Pose, jetzt zurück auf `idle0`).

## Offen / Politur
- „Unzustellbar“ (a) nur mit Lucys Zigaretten; Vegas’ Schachtel gegen zwei Pfandflaschen ist nicht gebaut.
- Die Blechkiste ist ein vergrößerter Blechdosen-Scan, weil ein echter Kisten- oder Werkzeugkasten-Scan fehlt. Der Transporter ist der Scan „van_damaged“, aufgehellt, weil ein sauberer weißer Transporter fehlt.
- Das Grete-Foto verwendet die Figuren `zayn` und `dina` als Stellvertreter für Heinrich und Grete. Ein eigenes 1941-Motiv mit Forsthaus wäre besser.
- Das Lucy-Polaroid zeigt nur den Teddy und einen unscharfen Ärmel, weil ein Lucy-Bild fehlt; Lukes Satz fängt das auf.
- Günther sitzt mit `figuren_embody … sit` auf der Hockerstelle. Im Bild prüfen, ob er zum Stuhl-Scan passt.
- Vegas’ Monolog „Unzustellbar“ (neues Schloss) ist nicht gebaut.
- Die −5 fürs Grete-Foto gibt es nur, wenn in AG-14 „Grete.“ gewählt wird (so von AP-19 gebaut).

## Fehlende Assets
Werkzeug- oder Transportkiste · weißer Kastenwagen (sauber) · Postsäcke (Rückfall: Müllsack-Scan aus post.js).
