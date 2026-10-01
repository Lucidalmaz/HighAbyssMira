# Stand Kino 2 (R-4 Kinosequenzen filmisch, R-9 graues Gesicht, Kuh-Sturz) – 01.10.2026

Grundlage: `F3_stand_kino.md` (Schnittstelle unverändert). Geändert: `app/mods/kino.js`, `kapitel1.js` (nur `kapitel1_tvTick`). Basis, figuren.js, kapitel6.js unberührt.

## R-9 · Das graue Gesicht (echter Kopf statt gemalter Fläche)
- `kino_grauKopfBau()` (beim Laden): Kopf des Graukinds (NoEdge/CC, Figur `graukind` = Ordner `kleine`) in Ruhepose eingebacken, Rahmen aus den Augen (Ursprung zwischen den Augen, +z Blickrichtung, Meter). CC-Puffer werden geteilt (Kopf+Wimpern, beide Augen) → nur die Ecken des eigenen Index (`kino_benutzt`).
- Haut `kino_gkHaut`: grau-wächsern (Textur entsättigt), Umgriff-Licht als Streulicht-Näherung (warm in der Schattengrenze), feine Adern (Schläfen, unter den Augen, Rauschen im Objektraum), feuchter Klarlack mit wechselnder Rauheit, Sheen.
- **Kein Mund** (`kino_mundZu`): Lippen und Mundhöhle auf eine glatte Hautfläche zwischen Oberlippen-Ansatz und Kinn gezogen (Profil des Kopfes vermessen: Mund bei −0,98 Augenabständen), Farb-/Normalendetail dort ausgeblendet. Augen schwarz, nass, 10 % größer.
- Uniforms `KINO_GK`: `uPlane` (Gesicht wird an einer Ebene platt gedrückt, dort heller/blutleer), `uMund` (Haut wölbt sich, wo der Mund wäre), `uNass`.
- **Tank (k2b, 10–15 s):** kommt aus dem Wasser (0,6 s), presst sich ans Glas (platt, Rand heller), atmet (Druck wechselt mit dem Atem, Luftblasen aus der Nase steigen am Glas, Beschlag am Glas wächst/schwindet), Haut über dem Mund wölbt sich; kaltes Licht von unten aus dem Wasser, Streulicht der Taschenlampe. Blinzeln bewusst nicht (schwarze Augen, die nie zugehen).
- **Fernseher Nr. 7 (Kap. 1):** eigenes 256×192-Bild für die Dauer: Gesicht taucht aus dem Schnee auf (0,35 s), steht 0,55 s mit Zeilenzittern, Tonnenwölbung, Zeilen, Rauschen, laufendem Balken, Blauton; Ton: Rauschen wird hohl + 50-Hz-Brummen (`kino_tvTon`); dann „HALLO LUKE“ in Kreide 0,7 s. Bewusst länger als die „zwei Bilder“ der Bibel, damit es als Absicht lesbar ist.
- **Prolog (kp, 12–13,2 s):** derselbe Kopf, kindgroß verkleinert, ohne Haar, auf dem Rabenhals, schwach von unten aus dem Laternenglas.
- **Flache Rückfälle:** `faceTexes.grey` wird beim Laden durch ein Porträt des Kopfes ersetzt (`kino_grauPortrait`) → alter Tank-Ablauf, Gestalt-Gesichter, Kiffer-Bild.

## R-4 · Sequenzen
- **k1h „Hilde im Strahl“:** neu inszeniert; durchgehende Bahn mit echter Beschleunigung (Fersen, Zehen, frei, schneller steigend, treibt auf Luke zu, dreht sich wie im Wasser). **Körperphysik (CLAUDE.md §17)** `kino_hildeStrahl`: Arme schweben seitlich hoch und sacken bei jedem Ruck nach (Feder mit Überschwingen), Beine hängen mit weichen Knien und pendeln, Zehen nach unten, Oberkörper wölbt sich, Glieder bleiben bei Drehung zurück; beim Hochreißen (26 s) schlagen Arme/Beine nach unten nach. Mimik je Einstellung (müde → Angst/geschrien → trauriges Lächeln), Flüstern mit Mundbewegung. Licht je Einstellung (warmer Schein der Scheibe, Mondkante, Oberlicht seitlich im Close-up), Strahl gezügelt (Spot 900→150, Kegel-Dunst 40 %), damit sie nicht weiß ausbrennt. Blick wird am Anfang sanft zu ihr gezogen. Brille + Polaroid fallen jetzt dort, wo sie an Luke vorbei hochgerissen wurde (direkt vor seinen Knien), Kamera kniet davor.
- **Brille:** Fab-Modell `ms/brille` mit Perlenkette (instanzierte Perlen, Perlmutt) statt flachem Bild (k1h, k1).
- **Mimik/Mund für Kinofiguren:** `kino_mimik(P, {Form: w})` (weich, über Blinzeln/Sprechen gelegt), Zeilen bewegen den Mund der sprechenden Figur (`kino_sprecher`).
- **Behaltene:** echtes Grau (Textur entsättigt, kühl), schwarze nasse Augen, mundloses Kopfnetz (Zähne/Zunge/Wimpern aus) – `kino_grau`.
- **Licht:** „Bruder.“ (Taschenlampe am Boden strahlt Peter von unten an + kalte Deckenkante), Stuhl 8 (Arbeitslampe + kalte Kante), Schacht (Pulsieren streicht kalt über die Wände), Kreuzungs-Kiesel (k3), Rabe auf Lucys Schulter (landet auf der von der Kamera abgewandten Seite, Kante). Prolog-Rabe weiter weg gerahmt (war ein schwarzer Fleck).
- **k4 „Noch nicht“:** drei Einstellungen statt einer starren: Totale vom Hallenboden mit Fahrt, Blick die Treppe hinauf mit Spieluhr und Sichtung, Fahrt aufs Porträt (Stehlampe als Kante, Streicher); Licht je Einstellung aus den echten Quellen.
- Alte `k6`-Fassung entfernt (kapitel6.js definiert K6). Fehlendes `kino_reh` ergänzt.

## Blinde Kuh (Nutzerwunsch 01.10.)
- Eigene Kuh mit Skelett (`kino_kuhBau`, `assets/cow/cow.glb`, im k3-Satz vorgeladen): Kopf nach +X wie `kapitel3.js` erwartet.
- **Sturz** aus 26 m mit Erdbeschleunigung, Aufschlag genau bei 7,08 s; kippt um die Längsachse und kommt auf der Seite an; Beine und Hals schlenkern passiv. Fallgeräusch (Rauschen + Böe), Muhen, Blick folgt ihr nach unten, schwaches Weiß der Senke streift sie.
- **Aufschlag:** Stauchung + Rückprall (gedämpfte Feder), Knochen federn mit Überschwingen in die gebrochene Lage der Basis, ein Bein zuckt einmal; Subbass/Tiefschlag (Aufnahmen `fx_tief_1/2`), nasser Laut, Splitt (`stones1`), Knacken; Kamerastoß; Splitt (bleibt liegen) und Wasser (versickert) fliegen mit Schwerkraft, Gischt; Riss im Asphalt (Decal), eine Lache, die 40 s lang wächst („Unter ihr breitet sich das Blut immer noch aus“), keine Organe/kein Blutregen mehr.
- **Danach:** Dampf steigt 2,5 min aus dem warmen Körper; gelbe Ohrmarke „AYDIN“ am Ohr, ein Stück davon auf dem Asphalt; glatte Augenhöhlen am Kopfknochen; Brandkreise wie bisher. Luke geht im Schwenk (9–13 s) zwei zögernde Schritte auf sie zu (bleibt danach dort stehen).
- Rückfall ohne eigene Kuh: Basis-Kuh (`kino_kuhAlt`). Kein Auto/Zaun in Reichweite der Kreuzung → kein Alarm.

## Geprüft (Kontaktbögen)
- Kap. 3 (Kuh, Blinzeln): Kuh gescheckt statt rotem Klumpen, Sturz sichtbar, Lage plausibel; Behaltene grau mit schwarzen Augen.
- Prolog/Kap. 1 Hilde: erster Lauf zeigte Ausbrennen im Strahl, abgeschnittenen Kopf (14–20), fehlende Mundschließung (geteilte CC-Puffer) → behoben, Abschlusslauf siehe unten.

## Abschluss-Prüfung (nicht gelaufen: Testschlange verstopft; nur Syntax/Build geprüft) – im Gesamttest ansehen
Kontaktbögen per `__kino.seek`; fertige Schrittdatei `C:/Users/GIGABYTE/_r4/t_F.json` (Prolog → Porträt-Overlay → Fernseher → k2b → k2a → k2 → k1h mit Kopf-Debug).
1. **Graues Gesicht, 3 Orte:** (a) Porträt `__kino.S.gkBild` (grau, kein Mund, schwarze Augen, nicht ausgebrannt; Licht in `kino_grauPortrait` ggf. nachstellen); (b) Tank k2b 10,4/11/11,8/12,8/13,6 s (kommt aus dem Wasser, platt am Glas, heller Druckrand, Blasen, Beschlag, kein Durchstoßen des Glases); (c) Fernseher Nr. 7 (`__k1.K1.tv.fr = 1`, Bild bei 0,4/0,7/1,3 s); (d) Prolog 12,3–13 s (Kopf auf dem Rabenhals, nicht weiß).
2. **k1h:** 11,8/13,6 s (Strahl nicht ausgebrannt, Fersen/Zehen), 16/18,5 s (Kopf im Bild, Arme schweben, Beine pendeln), 21,5/23,5 s (Close-up: im ersten Lauf **fehlte bei 23,5 s Hildes Kopf** – Ursache offen; Debugschritt `dbg23` liefert Kopfknochen/Kamera/Sichtbarkeit; Verdacht Nahebene oder Knochenlage nach `kino_richte`), 26,4 s (Hochreißen, Glieder schlagen nach), 30/33 s (Brille mit Perlenkette vor Lukes Knien, lesbar).
3. **k2a / k2:** „Bruder.“ 6/8,5/10,5 s hell genug; Stuhl 8 (18/22 s) und Schacht (27 s) lesbar.
4. **Kuh (k3kuh):** Gischt/Dampf jetzt Rauch statt Lichtkugeln (nach dem Lauf geändert); Flanke bei 14 s nicht überstrahlt; Riss/Lache/Ohrmarke/Augenhöhlen sichtbar; Untersuchungspunkte aus kapitel3.js treffen Kopf/Ohr/Flanke der neuen Kuh.
5. **k3blinzeln:** stand im Testlauf bei 29,8 s (S.T rührt sich nicht, kein Fehler) – prüfen, ob `S.ending` hängt oder `augenzu_frei` die Kamera übernimmt.
6. k4 (Halle, Kap. 4), k5, k6 (kapitel6.js) mit Kapitelzustand ansehen.

## Offen / Bitten
- Lichtschiff-Unterseite (Rippen-Scheibe) wirkt im Aufblick billig (Kreaturen/Modell).
- Hilde: Haar im Dutt (Bibel: offen), Nachthemd/Haar reagieren nicht auf den Strahl (keine Stoff-/Haarsimulation am Modell) – Figuren-AP.
- Durchscheinende Nachbild-Kinder stehen beim Kuh-Test an der Kreuzung (Testzustand, nicht kino.js) – im Schlusstest prüfen.
- k3blinzeln blieb im Test nach 29,8 s hängen (kein Fehler im Log, wahrscheinlich Testablauf/Augen-zu) – im Schlusstest prüfen.
- k4/k5/k6 im Test nicht abspielbar ohne Kapitelzustand (Halle nur in Kap. 4); im Schlusstest ansehen.
