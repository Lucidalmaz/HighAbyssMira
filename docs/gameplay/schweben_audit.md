# Schweben-Audit (10.10.2026)

Werkzeug: `_fx/qa_a_objekte.js` (Normalmodus, Dauerinstanz, alle Raeume gebaut: __bw / __villa), erweitert um Strahlen gegen alle sichtbaren Meshes (beide Seiten) + Rahmen-Auflage (Kopie `_gen/qa_a3.js`).
Laufzeit-Korrektur: `app/mods/schweben.js` (`auf_flaeche`, `decal_auf_flaeche`, Durchlauf je betretenem Raum).

Geprueft: 2069 Einheiten. Davor: schwebt 118 / steckt 171 / kippt 83. Danach: schwebt 112 / steckt 187 / kippt 76.

| Raum | schwebt vor | schwebt nach | steckt vor | steckt nach | kippt vor | kippt nach |
|---|---|---|---|---|---|---|
| Amt · Archiv | 0 | 0 | 2 | 2 | 2 | 2 |
| Amt · Hängeregistratur | 3 | 3 | 0 | 0 | 0 | 0 |
| Amt · Kantine | 9 | 5 | 0 | 0 | 1 | 1 |
| Amt · Langer Gang | 0 | 0 | 0 | 0 | 10 | 10 |
| Amt · Prüfraum 3 | 0 | 0 | 0 | 0 | 2 | 2 |
| Amt · Sicherungsraum | 0 | 0 | 0 | 0 | 5 | 4 |
| Amt · Tunnel/Wartebereich | 0 | 0 | 1 | 1 | 1 | 1 |
| Amt · Zimmer 7 | 0 | 0 | 2 | 1 | 0 | 0 |
| Giselas Haus | 1 | 1 | 6 | 7 | 0 | 0 |
| Günthers Schuppen | 0 | 0 | 5 | 5 | 0 | 0 |
| Kapelle innen | 4 | 4 | 5 | 5 | 0 | 0 |
| Nr. 1 (Elternhaus) | 4 | 4 | 12 | 12 | 0 | 0 |
| Nr. 3 (Vegas) | 2 | 2 | 0 | 0 | 0 | 0 |
| Nr. 4 Erdgeschoss | 6 | 5 | 42 | 42 | 3 | 3 |
| Nr. 4 Keller | 0 | 0 | 8 | 8 | 0 | 0 |
| Nr. 4 oben | 1 | 1 | 9 | 9 | 0 | 0 |
| Nr. 7 (Hilde Wendt) | 6 | 6 | 6 | 9 | 4 | 4 |
| Nr. 9 Posten | 1 | 0 | 0 | 0 | 0 | 0 |
| Pfarrhaus | 1 | 1 | 8 | 8 | 0 | 0 |
| Villa · Anrichte | 4 | 3 | 0 | 0 | 4 | 3 |
| Villa · Arbeitszimmer | 1 | 1 | 0 | 0 | 0 | 0 |
| Villa · Keller | 1 | 1 | 0 | 0 | 0 | 0 |
| Villa · Nr. 9 | 2 | 2 | 0 | 0 | 0 | 0 |
| Villa · Obergeschoss | 1 | 1 | 0 | 0 | 0 | 0 |
| außen | 69 | 70 | 64 | 77 | 51 | 46 |
| innen#10 | 1 | 1 | 1 | 1 | 0 | 0 |
| innen#11 | 1 | 1 | 0 | 0 | 0 | 0 |

## Decals (Boden/Wand) - Messung nach der Korrektur
584 Decal-Planes mit Textur erfasst (300 Wand, 284 Boden). Korrektur `decal_auf_flaeche`: Boden Strahl nach unten, +0,6 cm; Wand Strahl entlang -Normale, +0,4 cm; nur Versaetze bis 7 cm; dazu polygonOffset, Anisotropie 8, Mipmaps. Im Lauf bewegt: ca. 290 Decals (Boden-Pfeile/Kreide, Blut, Zettel, Ritzschrift).
Texeldichte unter 100 px/m: 6 Decals; Anisotropie unter 8: 0; ohne Mipmaps: 95 (Canvas-/Kachel-Texturen, nicht ohne Neuerstellung der Bilder aenderbar).
Nach der Korrektur messbar von der Wand abstehend (ueber 2 cm): 29; messbar eingebettet: 38 (Messung gegen beliebiges Mesh dahinter, enthaelt Fehlzuordnungen zu Glas/Moebeln; Sichtprobe Kellerwand: Strichliste, Blut, Ritzschrift sitzen sauber auf der Wand, siehe fotos_1010b/keller_wanddecals.png).

## Was NICHT belegt ist
- Das Werkzeug erkennt manche Auflagen nicht (Tische/Regale ohne durchgehende Dreiecksflaeche, z. B. Kantinentisch, Nr. 4 Kuechenzeile). Solche Funde (0,2-1 m ueber Boden) wurden im Bild geprueft: die Dinge liegen auf Tischen/Regalen. Deshalb senkt die Laufzeitkorrektur nur, wenn eine Flaeche 3-12 cm darunter gefunden wird (9 Objekte im Lauf: Becher, Radio, Thermos, Buch, Kamera, Feuerzeug, Kerzen, Kanister).
- Drei schwarze Staebe im Keller Nr. 7 (1,4 m hoch, Unterkante 0,8 m ueber Boden) wurden nicht veraendert (vermutlich Absicht: Strichwand).
- Kapitel-3-6-Szenen, in denen Objekte erst durch Ereignisse erscheinen, wurden nicht einzeln betreten.
