# Inventar generierter / aus Primitiven gebauter Requisiten (10.10.2026)

Methode: (a) statisch: Suche nach Box-/Cylinder-/Plane-Zusammenbauten und Canvas-Texturen in app/mods; (b) Laufzeit: Szenen-Traversal ueber alle Raeume/Aussenorte im Normalmodus (`_gen/scan_prim.js`): 1104 Meshes aus einfachen Geometrien ueber 0,3 m, nach Abzug von Waenden/Boden/Decken/Leuchten 505, zu 167 Clustern zusammengefasst (`_gen/clusters.json`); (c) Kontaktboegen aller 21 begehbaren Raeume (je 3 Ansichten), 16 Aussenpunkte (je 3) und 116 Cluster-Nahaufnahmen (`_gen/sheets/*.png`, Auswahl in `fotos_1010b`).

## Ersetzt / verbessert (Funktion, Position, Interaktion unveraendert)
| Fund | Ort | Vorher | Jetzt | Quelle |
|---|---|---|---|---|
| Nummernautomat | Amt-Tunnel (Nr. 8 ziehen) | aufgeklebte Canvas-Zeichnung (flache Ebene) | Blender-Modell: Rueckplatte, Gehaeuse mit Fasen, Papierrolle im Fenster, Emailschild mit erhabener Schrift, Chromrand, roter Knopf, Ausgabemulde mit Abrisskante, Kabel/Abzweigdose; Karte "8" als Modell mit erhabener Ziffer | nummernspender_bau.py, wartenummer_karte_bau.py, game/assets/ms/nummernspender |
| Archivschraenke Suedreihe | Amt-Archiv | Rueckseite zum Raum (glatte graue Kloetze), dunkle Schubladenfugen ragten durch die Tueren | Tueren zum Raum, Fugen ausgeblendet | moebel.js |
| Aktenstapel auf den Schraenken | Amt-Archiv | flache weisse Canvas-Streifen | Blender-Aktenstapel | aktenstapel_bau.py |
| Staubtuecher (3) | Nr. 1 Wohnzimmer | verbeulte Boxen | echtes Tuch per Cloth-Simulation ueber Sofa/Sessel/Kommode | laken_bau.py |
| Kuechenherd | Giselas Haus | Kiste | Blender-Herd (4 Platten, Backofen mit Fenster, Waermefach) | herd_bau.py |
| Haengeschrank | Nr. 1 Kueche | Box, 0,5 m vor der Wand schwebend | Modell, Rueckseite an der Wand | haengeschrank_bau.py |
| Kindermaentel an der Garderobe | Nr. 1 Flur | Zylinder/Kapseln | Jacken-Scans (w_jacke) | innen_ort.js |

(Skripte unter app/tools/blender, gemeinsame Bibliothek prop_lib.py/prop_tail.py/run_prop.py.)

## Geprueft und belassen
Voodoo-/Strohpuppen (Fab-Modell "Burlap Pin Effigy"), Telefonzelle, Zaehlerkaesten (aussen), Pfandkisten, Schuppenkisten mit Etiketten, Treppen Nr. 4/Keller (Boxstufen mit Handlauf), Deckenbalken, Villa-Dachstuhl, Planungstisch Amt, Archivschublade (Interaktion), Tank (Glas).

## Offen / nicht ersetzt (ehrlich)
- (erledigt 10.10.) Kuehlschrank Nr. 4 und Treppen Nr. 4 sind Modelle.
- Gisela: weisse Kommode neben dem Herd (Box 0,62 x 0,88 x 0,6) bleibt.
- Treppen aus Boxstufen (Nr. 4, Kellertreppen): nicht durch Modell ersetzt.
- Canvas-Beschriftungen (Zettel, Schilder, Zeichnungen): grob 400 Stellen in amt.js, kirchberg.js, innen_*.js, ausbau_*.js - als Papier-/Schildflaechen belassen, nicht neu gebaut.
- "GRUENDUNG"-Aktendeckel (Canvas) im Amt-Archiv: Story-Prop, belassen.
- Villa-Raeume (Moebel dort fast ausschliesslich Modelle): per Scan keine Baukasten-Cluster, aber nicht jede Ecke per Bild begutachtet.
