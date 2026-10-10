# Checkpoint 10.10.2026 (Folgeauftrag 4/5/Gate) - Stand und offene Punkte

Werkzeuge ausserhalb des Repos: C:\Users\GIGABYTE\_gen (mk.js, gen_init.js, qa_a3.js, h1/h5/h6/h7 .js, sheet*.py), _anim (gt_rec.js), _qa_kol (gen.js, gt_k2..6.json).

## ERLEDIGT
- Wartenummern-Automat + Karte, Archivschraenke (Rueckseite), Aktenstapel, Staubtuecher, Kuechenherd (= Gisela-Kommode), Haengeschrank Nr. 1, Garderobe-Jacken, Kuehlschrank Nr. 4 mit schwenkender Tuer (kuehlschrank_tuer_bau.py, nr4.js), Treppen Nr. 4 OG/Keller als Blender-Treppen (treppe_bau.py, kirchberg.js modell:, nr4.js). Fotos: docs/gameplay/fotos_1010b.
- Schweben-Werkzeug repariert und in schweben.js integriert (Auflageflaechen, Wandnaehe = haengt, neben/schwebt/steckt, Klassen gut/haengt/neben/schwebt/steckt/ungeklaert). Messung ueber alle Raeume (Normalmodus): vor 742 gut / 44 steckt / 13 neben / 8 schwebt / 10 ungeklaert / 53 haengt, nach der Laufzeitkorrektur 777 / 23 / 4 / 3 / 10 / 53; Rest per Bild geprueft (Buergersteig-Spielzeug, Jerrycans auf Platte, Stativ-Kamera, geparkte Items am Ursprung).
- Decals: decal_auf_flaeche; die 18 Wand-Decals mit Messabstand > 8 cm im Bild geprueft: liegen auf Betten/Tischen/Kisten (Messartefakt), kein schwebendes Decal gefunden. Texturen mit 128 px auf 0,9 m = weiche Flecken (Note 3, unpraegnant).
- Gate: Fenster-Figuren (Kap. 1 Nr. 3/7/8, 7 Ansichten, fig=true fail=false: fotos_1010b/fenster_gate.png), Kollisionslauf B+C Kap. 1-6 (Tuerlogik auffaellig 29/30/30/29/29/27 von ~98, Ankunft 0 auffaellig; gt_k*.json), Rueckwaerts/Seitwaerts + Kopf (gt_rec.js Kap. 1-6: keine Menschen auffaellig; Wild gait.js 0 % Gleiten, Katzen Kopf glatt; Kraehen im Stand 0 Spruenge), graues Gesicht (kino_grauKopfBau deaktiviert, keine 2D-Auftritte im Code), Text weiter/ueberspringen: textweiter.js + textweiter_patch.py (Enter naechste Zeile, X alle; Test: Zeile 2 sofort, Folge in 1,2 s statt 19 s, Bewegung waehrend Text 1,05 m).

## HALB ERLEDIGT
- Schweben: "0 echte Schwebefaelle" nicht streng belegt - Rest 3 schwebt/4 neben/10 ungeklaert ohne Einzelbild (Messer 96,3/146,7 und Radio 59,1/148,2: Gelaende, Objekt im Nachtbild nicht sichtbar).
- Kollisionslauf: Ergebnis liegt vor, aber die 27-30 auffaelligen Tueren je Kapitel wurden nicht einzeln gegen den Stand 09.10. verglichen (gleiche Groessenordnung, Kap. 2/3 +1-2).
- Canvas-Zettel/Schilder: nur Messung (Texeldichte: 5 % unter 142 px/m, 7 Decals < 100 px/m: [-13,-10] 6 m 512 px, [-110,25] 5 m 128 px usw.), nichts neu erzeugt.
- Seite bewegung.js (anderer Agent) wurde versehentlich in Commit 6cad8a5 mitcommittet; assemble-Reihenfolge enthaelt sie.

## OFFEN
- Softlocks Kap. 1-6 als echter Item-Ketten-Durchlauf (nur statische Doku qa_raetsel_*.md + Tuerlogik).
- Disco-Kopf/Rueckwaerts: Messung mit dem generischen Rekorder zeigt bei Tieren Artefakt (ang 175); Pruefung stuetzt sich auf gait.js (10.10.).
- Drei schwarze Staebe Keller Nr. 7, Kantinentisch/Nr. 4 Kuechenzeile Auflagen (Werkzeug erkennt sie als "haengt").
- Schulnoten-Tabellen je Punkt (vorher/nachher, praegnant ja/nein) noch nicht in gate_1010.md; Villa-Raeume nicht jede Ecke gesichtet.
- Release nicht neu gebaut (Stand Release = Commit b96f3b0, ohne Kuehlschrank/Treppen/Text weiter).
