# Umsetzung Kapitel 2 (Amt): Lücken zwischen Text und Welt

Grundlage: `kap2_amt.md`. Geändert: `app/mods/amt.js`, `app/mods/innen_kapitel.js`, `app/mods/zimmer7.js`.

Technik: neue Hilfsfunktionen `amtp_*` in `amt.js` (Gehäuse mit Fasen, Boxprojektions-UV, je Material zu einem Mesh verschmolzen, gemeinsame Materialien, Bänder für Papier und Gurte). Kollision kommt wie bei den Nachbarobjekten aus der sichtbaren Geometrie (Rollwagen, Kühlschrank-Pilaster, Kaffee-Regal u. a.). Keine neuen Assets heruntergeladen; `gas_retro` wird nicht mehr geladen (steht in `release_auslassen.js`, wäre in der Veröffentlichung nicht vorhanden).

Spieltest: Läufe `_kap2_j` und `_kap2_k` (Screenshots, keine Fehlermeldungen im Log). Die Bilder sind wegen der Taschenlampenbeleuchtung dunkel, die Objekte sind aber erkennbar.

## Stand je Lücke

| Nr | Lücke | Stand | Umsetzung |
|---|---|---|---|
| 1 | Nadeldrucker auf Rollwagen (Archiv und Messraum) | umgesetzt | Archiv: Stahl-Rollwagen (Tabletts, Rollen, Schiebebügel), Matrixdrucker mit Rauchglasdeckel, Walze, Druckkopf, Bedienfeld, Leporello-Stapel auf dem unteren Tablett, Zuführbahn und Ausgabebahn mit der Live-Textur (neueste Zeile am Austritt) bis zum Boden. Messraum: gleicher Drucker auf dem Seitentisch (nach rechts verschoben, stand vorher neben dem Tisch in der Luft), Papier liegt auf der Platte. |
| 2 | Vier Hängemappen auf dem Tisch | umgesetzt (Rest teilweise) | Vier Pendelmappen (Rückseite, abgehobene Vorderseite, Aufhängeschiene mit Haken, Reiter mit Jahr) liegen fest auf dem Tisch, die Fotos legen sich beim Lesen darauf. Das unbenutzte Dekal `mappen` ist weiter unbenutzt (keine sinnvolle Stelle ohne schwebendes Dekal). |
| 3 | Stuhl 8: durchtrennte Gurte, Kerbe, Feder | umgesetzt | An allen acht Stühlen Lederriemen (Beckengurt mit Schnalle, Fußriemen); an Stuhl 8 sauber durchtrennt (helle Schnittkanten, ein Ende hängt über die Kante, das andere liegt lose), Kerbe in der Lehne mit Spänen, Feder von Anfang an sichtbar. |
| 4 | Aktenvernichter | umgesetzt | Bürogerät mit Auffangkorb, Schlitz, Zierleiste, Schalter, Aufkleber „Max. 8 Blatt!“, Papierstreifen als gebogene Bänder aus dem Schlitz, gekringelte Reste am Boden; steht an der Südwand. |
| 5 | Kaktus in Zimmer 7 | umgesetzt (Näherung) | Säulenkaktus aus Teilen (Rippen, Dornenpolster, Seitenarm, rosa Blüte) im Tontopf mit Untersetzer, auf einem echten Wandbrett mit zwei Stahlwinkeln. Siehe „braucht Download“. |
| 6 | Kaffeemaschine mit Warmhalteplatte, Kanne, Filter, Display | umgesetzt (Näherung) | Filterkaffeemaschine mit Säule, Brühkopf, Filterkorb mit braunem Papierfilter, Warmhalteplatte, Glaskanne mit Satz, Display „ENTKALKEN“ an der Maschine (der Schreck lässt es weiter aufleuchten). Thermoskanne, Blechgeschirr und Dose daneben neu angeordnet. |
| 7 | Kühlregal mit sichtbaren leeren Fächern, Etiketten, Magnetschloss, Nische | umgesetzt | Edelstahl-Laborkühlschrank in einer Wandnische (Pilaster und Sturz aus Putz, Schild „KÜHLUNG“ am Sturz) mit vier Böden, Etiketten (∴-1, ∴-2, ∴-3 durchgestrichen, Substanz S, „Privat“), Reifring, Fleck, Staub mit sauberem Kreis, Kassler-Dose, Türrahmen, Griff, Magnetschloss mit Kontrolllicht. Glas und Beschlag der Basis bleiben davor. |
| 8 | Feuerzeug und Foto auf der Matratze | teilweise | Messung im Spiel: Oberkante der Matratze bei y ≈ 0,73 m (Eisenbett ist eine Instanz-Mesh). `amt_bettOben()` misst das beim Aufbau; das Oma-Foto liegt jetzt dort, und `feuer_bedSpot` (in `feuer.js`, nicht meine Datei) wird zur Laufzeit so umhüllt, dass es bei Boden-Rückfall diesen Wert liefert. Das Feuerzeug selbst wird in `feuer.js` gesetzt und wurde nicht eigens geprüft. |
| 9 | Plastikdosen mit Schraubdeckel und Kreppband | umgesetzt | Sechs Dosen (milchig, farbige Schraubdeckel mit Rippenrand), je ein Streifen Kreppband „Do.“ auf dem Deckel, zwei Türme neben der Tür. |
| 10 | Foto-Details 1958/1975/2009 | umgesetzt | Kinderfahrrad mit zu kleinem Jungen (1958), Mann ganz links halb im Schatten des Fotografen (1958), Stirnband, Zöpfe mit Butterblume, Mädchen im Profil „falsche Richtung“ (1975), 2009: Mann direkt hinter den Kindern mit Hand im Lederhandschuh auf der Schulter, Lucy sieht das Mädchen an. Auflösung 900 × 600. |
| 11 | Plastikarmband „KRANZ, P.“ | umgesetzt, ungetestet | `amt_armband` hängt ein angeschmolzenes Krankenhausband (Etikett, Tropfen) an den linken Handgelenk-Knochen der Peter-Figur, sobald `feuer.js` sie geladen hat. Nicht im Spiel gesehen (Cutscene nicht angefahren). |
| 12 | Blechdose KAFFEEKASSE, Karteikasten | umgesetzt | Blechdose mit Münzschlitz und beklebtem Etikett; Karteikasten aus Blech mit hochgeklapptem Deckel, Karteikarten mit Reitern, Etikettenhalter. |
| 13 | Modelldorf | umgesetzt | Tankstelle aus Teilen (Kiosk, Zapfsäulendach, zwei Zapfsäulen, Preisschild-Mast), Pappkuppel „OBJEKT“ über der Senke, Pappschild „Pfand hier abgeben“ auf Holzspieß, Faden bis zur Decke, Fähnchen „DREIPUNKT · Standort?“, Sockel mit Gravur „EISEN“. |
| 14 | Besteck und Serviette in der Schublade | umgesetzt (Näherung) | Besteck (`w_besteck`), Serviette mit Lippenstift, Batterie mit Gummi am Löffel liegen auf dem Tisch; die Hitbox heißt jetzt „Besteck“. |
| 15 | Brotdose, Ordner „2009“ | umgesetzt | Blechbrotdose mit Namensschild und Krümeln auf dem Schreibtisch; vier Aktenordner (Rücken „2005“, „2009“, „2012“, „Zählung“) oben auf dem Aktenschrank, Hitbox reicht bis dort. |
| 16 | Lippenstift an der Tasse | umgesetzt | Lippenabdruck am Tassenrand. |
| 17 | Sauberes Rechteck unter dem Gründungsdeckel | umgesetzt | Staubschicht auf dem Schrank mit sauberem Rechteck (liegt unter dem Deckel, sichtbar nach der Aufnahme). Höhe der Schrankoberkante geschätzt (2,204 m), nicht eigens geprüft. |
| 18 | Überwachungsmonitore zeigen nur Rauschen | nicht | Textlich gewollt (Halluzination), nur Textänderung möglich; nicht angefasst. |
| 19 | Kinderzeichnung Stuhlkreis | umgesetzt, nicht im Bild geprüft | Vierte Zeichnung (acht Stühle im Kreis, Licht darüber, achter Stuhl durchgestrichen und neu gemalt) hängt an der Westwand des Messraums; der Kamerawinkel im Test traf die Wand nicht. |
| 20 | Notentriegelung (Hebel, Plombe, Rundumleuchte) | nicht | liegt in `feuer.js`, nicht meine Datei. |
| 21 | Bretter vor dem Loch in Keller 7 | nicht | liegt in `uebergang.js`, nicht meine Datei. |

## Braucht Download (bessere Näherung durch echtes Asset)

- Nadeldrucker / Matrixdrucker (Fab „dot matrix printer“)
- Aktenvernichter (Fab „paper shredder“)
- Kaffeemaschine mit Glaskanne (Fab „coffee maker“)
- Kaktus im Topf (Fab/Megascans „cactus pot“)
- Laborkühlschrank (Fab „lab refrigerator“), optional
- Karteikasten / Tupperdosen / Blechdose, optional

## Auffälligkeiten

- Spieltests waren lange nur eingeschränkt möglich: mehrere gleichzeitige Spielinstanzen erschöpften Arbeitsspeicher und Grafikspeicher (Kontextverlust, „G is not defined“).
- In der Testumgebung zeigt die Hilfekarte „Ränder“ beim ersten Sichten einen Rahmen auf den Screenshots; sie verdeckt nur die linke Bildhälfte.
- Der Messraum-Drucker steht jetzt bei X+114,0 / Z−7,52 auf dem Tisch (vorher bei X+111,2 neben dem Tisch).
