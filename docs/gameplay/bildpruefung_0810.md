# Bildprüfung 08.10.2026 (gebündelter Normallauf)

Läufe (Normalmodus, Dauerinstanz): Lauf A `C:\Users\GIGABYTE\_bundle_out_a` (Menü, Traum, Fibel-Tour, Laternen, Brand-Echo; danach hing die Figurenstrecke), Lauf B `_live\normal1\out\_bundle_b_steps` (Kap. 1 komplett, Kap. 2, Kap. 4/6), Lauf C `C:\Users\GIGABYTE\_bundle_out_c` (Wiederholung der Figuren, Funkgerät, Auftritt, Kap. 4/6). Schrittdateien: `_bundle_steps.json`, `_bundle_b_steps.json`, `_bundle_c_steps.json`, Generator `_mk_bundle.py`.
Bildnummern verweisen auf die Dateinamen in den Ordnern oben. Keine GLSL- und keine Skriptfehler: `__errs` leer (Schritte `163_gz_errs`, `164_ende_abschluss`).

## Ergebnis je Punkt

| Punkt | Urteil | Bild | Ursache / Vorschlag |
|---|---|---|---|
| Menü, Beta-Vermerk, Titel | OK | A `001_menue_m0_titel_beta`, `003`, `005` | „BETA Testversion Kapitel 1–6“ sichtbar, Schrift sauber. Kapelle (`008_menue_m4_kapelle`) ist komplett schwarz: Szenenwechsel oder Kapelle nicht beleuchtet, Kameraschuss prüfen (Mangel gering). |
| Traum: Nebel, Rabe im Nebel, Schärfe | OK | A `016`, `019`, `024` | Rabe im Nebel sichtbar, sitzt auf der Laterne. Nebel sehr dicht, Boden-Lichtbänder wirken streifig, aber stimmig. Rabe startet nach 8,3 s (Soll ≤ 8), Aufsetzen nach 37 s statt 10–12 s (Messung beginnt vor dem Anflug, nicht prüfbar). |
| Fibel-Tour 1080p | Mangel | B `tour_1080p_auf` | Rändertafel („Ränder“) liegt über der Aufgabenseite und verdeckt sie. Nur im Neustart-Spiel ohne Traum. Fibel-Tour-Karte selbst sauber. |
| Fibel-Tour 720p | Mangel gering | B `tour_720p_auf` | Layout passt (Fenster nur 1264x721), Kartentext war beim Schuss noch am Tippen („die Haupt“). Fenster ließ sich nur ungefähr verkleinern. |
| Fibel-Tour im Traum-Ablauf | OK | A `035`–`040` | Spotlight, Karte, Seiten 1–6, Skip (X) laufen. |
| Brennendes Haus (Echo brand) | OK | B `063_K1lf_echo_brand` | Echte Flammen und Rauch am Haus, Mädchen im Garten. Flammen wirken etwas klein im Verhältnis zum Haus. |
| Laternen: Licht bündig | OK | A `049`, `050`, `053` | Lampenkopf mit Halo sitzt auf dem Mast. „Aus“ (`051`) zeigt noch eine Restglut im Lichtkegel. |
| Kellertür-Rückwand | Mangel | B `056_K1lf_lf_tuer`, `069` (zweiter Treffer im Figurenlauf) | Rückwand zeigt grüne Tapete, die im unteren Drittel diagonal abgeschnitten wirkt (Gras-/Rasenfläche als Dreieck). Rückwand-Plane und Boden/Tapete prüfen (`_door_steps.json` Befund). |
| Gurtstuhl | OK, nicht klar | B `059_K1lf_lf_stuhl_auf` | Stuhl mit Kerzen sichtbar, Gurte auf dem Bild nicht erkennbar (Kamera zu weit weg). Schrittlog: `gurte 3`. |
| Blutschrift | OK | A `060_K1lf_lf_blut` | Rote Schrift („…DIE… WEG WAREN“) an der Kellerwand, Kamera schneidet sie an. Kreidezeichnungen sichtbar. |
| Echo-Figuren | OK | B `062_K1lf_lf_echo_b` | Echo Küche: Figur und Zimmer sichtbar. |
| Figuren: Köpfe (Scheitel, Lidstrich, Hemdsaum, Lucy-Kragen) | OK, Ausnahme amt1 | C `fig_*` (Raster `_bc_fig.png`), B `073`–`082`, `092` | Zayn, Roxy, Lucy, Heidi, Kleine, Gisela, Hilde, Mama, Dina, Aydin, Vegas wirken stimmig, Lucy-Kragen sauber. Mike, Luke und die Erwachsenen sind im Lauf B unsichtbar (Köpfe nach 3 s nicht geladen); mit 7 s Wartezeit (Lauf C) erscheinen alle. Heißt: Figuren laden langsam, in der Praxis kurzes Aufpoppen möglich. |
| Figur amt1 (Beamter, blauer Mantel) | Mangel | C `087_fig_f_amt1_kopf` | Kopf fehlt komplett (Hals endet im Nichts), nur Kragenöffnung. Modell- oder Kopf-Anbindung prüfen. |
| Vegas-Arme | OK | C `088_fig_f_vegas_kopf`, B `091` | Lange Arme sichtbar, wie gewünscht. |
| Funkgerät | Mangel | C `095_bed_funk`, `096_bed_funk_dicht` | Gerät steht auf einem eckigen Würfel mit Asphalttextur (Betonblock wirkt wie Platzhalter). Podest verkleiden oder weglassen. Beschriftung „Funkgerät abstimmen“ gut. |
| Codeschloss Kap. 1 | OK | B `108`–`114` | Tür, Tastenfeld, falscher Code, Overlay arbeiten. Tapetenmuster hinter der Tür siehe Kellertür. |
| Sicherungskasten Kap. 2 | OK | B `125`–`128` | Gehäuse, Schilder, Hebel sauber. Schritt `fuse_klick` fand keinen Sicherungsknopf (`btn=false`). |
| Notschalter-Modell | OK | B `129_bed_notschalter` | Roter Kasten mit „Notentriegelung“ sichtbar. |
| QTE-Optik | OK | B `118_k2_z_qte` | „LEER“-Anzeige (Leertaste) mit Kreis und Text „LOSREISSEN“, gut lesbar. Das QTE blieb im Test absichtlich aktiv und überlagert die Folgebilder. |
| Zombie nah | Mangel | B `117_k2_d0` | Zombie steht laut Log 1,7 m vor der Kamera (`vis true`, Knochen bei 659,7), ist im Bild aber nicht zu sehen. Verdacht: Frustum-Culling der Skinned-Mesh oder dunkles Licht. Dringend prüfen. |
| Zombie Jagd, Fass-Kino | Mangel gering | B `132`–`135` | Zombie-Detail (Fleisch, Arme, „Bruder“) wirkt stark. Fass-Kino ist fast schwarz: das Fass ist nicht zu erkennen (`134`, `135`). Beleuchtung im Kino anheben. Gleiten des Zombies nicht prüfbar (Standbild). |
| Feuer (Flamme Kap. 2) | OK, ein Mangel | B `121_k2_fl1`, `122` | Flamme und Funken sichtbar. Oberkante ist eine gerade Linie (Sprite-Rechteck sichtbar). Frame-Zeit im Feuer: Median 25 ms, p95 47 ms. |
| Todesbildschirm | OK | B `137_K2_reset` | Text, Leiste und Schaltflächen sauber. |
| Graukind | OK | C `140_gz_gk2`, `141` | Graue Gestalt steht klein an der Bushaltestelle im Nebel, erscheint und verschwindet wie geplant (ph seen). |
| Nazca | Mangel | C `143_gz_nz0` – `147` | `zeichen.S.nazca` bleibt 0 (im Lauf B 1), Bilder zeigen dunkle Holz-/Waldflächen statt Linienbild. Nazca baut sich verzögert oder gar nicht, Kornkreis ungeprüft. Kameras (`__at(14,178.5,…)`) liegen offenbar im Wald statt am Feld. |
| Bus-Scheibe | Nicht eindeutig | C `148`–`151` | Bus mit Aufschrift „211“ sichtbar, rote Schnur sichtbar. Scheibe/Gesicht nicht klar erkennbar (zu dunkel). |
| Messer/Rekorder | Mangel | C `152_gz_mod1` | Beide Objekte im Bild nicht erkennbar; Messer-Skalierung im Log 22 x 87 x 629 (Einheit falsch, wird auf 0,15 m skaliert, Box vermutlich falsch). |
| Graffiti-Wandposition | OK | B `153`–`158` | Graffiti sitzen auf den Wänden (Auge, Abhang, Umdrehen, Tanke, Villa, Schrott). Lesbarkeit begrenzt durch Dunkelheit. |
| Wandbild Kreuz/Rutsche/Traktor | OK | B `160`–`162` | Traktor rot, gut sichtbar, Rändertafel „Nachbild“ sichtbar. |
| Auftritt (Krähen, Fledermaus, Katze, Beobachter, Graukind) | OK | Log C `099`–`103` | Keine `bad`-Ereignisse, Frame-Spitzen ≤ 110 ms. Im Lauf B: UFO- und Spinnenschritt liefen in ein Zeitlimit (120 s) mit Bildstillstand bis 4,1 s, Ursache offen (Speicher oder Shader). |

## Mängel nach Priorität
1. Zombie nah unsichtbar (B `117_k2_d0`): Sichtbarkeit/Culling prüfen. Wichtigster Fund.
2. Nazca nicht gebaut oder dunkel (C `143`–`147`).
3. Figur amt1: Kopf fehlt (C `087`); Figuren laden spät (Mike/Luke/Erwachsene nicht sofort sichtbar).
4. Kellertür-Rückwand: diagonaler Tapetenschnitt (B `056`).
5. Funkgerät auf Würfelpodest (C `095`).
6. Fass-Kino zu dunkel (B `134`, `135`).
7. Fibel-Tour 1080p: Rändertafel überdeckt die Seite (B `tour_1080p_auf`).
8. Messer/Rekorder nicht sichtbar, Skalierung (C `152`).
9. Kleinkram: Kapelle im Menü schwarz, Flammen-Oberkante gerade, Restglut bei ausgeschalteter Laterne.

## Hinweise zum Lauf
- Die Schritte `069`/`070` (Mike) und mehrere Folgeschritte liefen im Lauf B in ein Zeitlimit (120 s). Ursache nicht geklärt; in Lauf C mit 60 s Limit nicht aufgetreten. Wiederholte Läufe in derselben Instanz verlangsamen sich offenbar (Speicher 2,9 GB Heap).
- Brennendes Haus nutzt das Echo `echo_brand`; die Erinnerung läuft nur, wenn man die Dialoge mit X weiterklickt (Schritt `echo_brand_ende`).
- In den Zombie-Kapiteln wurde nichts im Code geändert; es wurden keine Dateien im Spiel verändert.
