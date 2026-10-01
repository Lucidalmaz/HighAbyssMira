# F3 · Stand R-12 „Fenster und Türen logisch von innen und außen“

Stand 01.10.2026. Alles in `app/mods/fassaden.js`. Basis und andere Module sind unverändert.

## Bestandsaufnahme

| Gebäude | Art | Innenraum von außen sichtbar? | Lösung |
|---|---|---|---|
| Nr. 7, Nr. 1 (Hüllen der Basis) | begehbar, am Ort | nein (`G7`/`G1` nur sichtbar, wenn man drin ist, Wände ohne Öffnungen) | Spiegelung + Vorhang wie innen + Scheinzimmer mit dem Motiv des echten Raums und seiner echten Lichtquelle |
| Nr. 4, Nr. 3 (Vegas), Gisela (H15), Pfarrhaus (H11), Nr. 9 (Posten) | begehbar, Raum weit außerhalb (Überblendung) | nein | wie oben, Motiv passend (Giselas Küche, Studierzimmer, gedeckter Tisch Nr. 6 …) |
| Villa Seiler | begehbar, Raum außerhalb | nein (vorher schwarze Flächen) | jetzt Scheinzimmer (dunkel, eingerichtet, teils Jalousie) + spiegelndes Glas; das erleuchtete Fenster und die winkende Hand bleiben |
| Kiosk Tankstelle Kranz, Wartehäuschen | Innenraum echt | ja | Glas spiegelt jetzt die Umgebung (Sonde) |
| Nr. 2, 6, 8, Praxis (13), H17, Bauernhaus | nicht begehbar | – | Spiegelung, Staub/Regen, Vorhang/Gardine/Jalousie/Laden oder eingerichtetes Scheinzimmer |
| Kapelle | Scan, Fensterbild | – | unverändert (`kirchberg.js`) |

## Gebaut

- **Spiegelung:** eine gemeinsame Würfelkamera (128 px, HalfFloat, PMREM über three.js), steht dort, wo der Spieler auf der Straße ist.
  - Neu aufgenommen nach 18 m Weg oder 50 s, je Bild nur eine Seite, ohne Schattenpass, Glas ausgeblendet. Drinnen und im Keller keine Aufnahme.
- **Glas** (`fa_glass`): additive Spiegel-/Glanzschicht über Zimmer und Vorhang, Fresnel.
  - Feiner Staub an Rand und Unterkante fängt Lampenlicht, Regenperlen und ablaufende Tropfen (Normale, nie im Takt).
  - Der Nebel schluckt die Schicht mit.
- **Scheinzimmer nie leer:** Atlas 5 × 2 aus echten Scan-Möbeln, beim Laden gerendert und nach 8 s und 25 s nachgezeichnet.
  - Motive: Wohnzimmer (Regal, Fernseher, Sofa, Stehlampe), Küche (Buffet, Radio, Tisch, Stühle), Schlafzimmer (Bett, Kommode, Bild), Kinderzimmer (Gitterbett, Teddy, Giraffe), Flur hinter Türglas (Spiegel, Kommode, Jacke).
  - Rückwand und Möbel im Raum liegen in zwei Ebenen (Parallaxe).
- **Licht nur mit Quelle:** Hauslicht, Nachtlicht, Fernseher (blaues Flackern mit Szenenwechseln), gedimmte Stehlampe, Röhre (Nr. 7 Küche, folgt `tube`, geht beim Schreck mit aus), Kerze (Nr. 7 Schlafzimmer).
  - Fernseher und Lampe gibt es nur in bewohnten Häusern (mit Licht, ohne Bretter), je Haus höchstens eins, nur unten. Nr. 4 (Oma Erna †2020) bleibt dunkel.
  - Dunkle Zimmer: Streulicht folgt der Hemisphäre (`uAmb`) plus kaltes Fensterlicht am Boden.
- **Behang:** Gardine, Vorhänge, geschlossene Läden wie bisher, neu Jalousien (Lamellen mit Gegenlicht). Rund die Hälfte der vorher nackten Fenster hat jetzt eine Jalousie.
- **Innen = außen (Nr. 7, Nr. 1):** Fensterlage, Höhe und Größe außen wie innen (`innen_ort.js winIn`).
  - Gestrichen: Fenster auf den Zwischenwänden (Seiten), Nr. 7 hinten vor der Kellertür, Nr. 1 vorne links.
  - Hilde steht jetzt im Wohnzimmerfenster (Text „Im Wohnzimmer …“), vorher im Küchenfenster.
  - Nr. 1 Kinderzimmer (Nachtlicht, „Hineinsehen“): Fenster in die Seitenwand verlegt, weil die Rückwand innen von Regal und Betten zugestellt ist. Innen ist es neu da: Scan-Rahmen, Nacht, Gardine, Blitze.
- **Türspion:** Messingrosette, Ring und gewölbte Linse an allen Haustüren der Häuser (per Strahl auf die Türfläche).
  - Bewohnte Häuser: schwacher Flurschein in der Linse.
  - Klopf-Text „Am Türspion bewegt sich etwas.“ (Basis): Licht geht an, ein Schatten zieht vorbei, ein Auge verdeckt die Linse, kurzes Blinzeln (`fassaden_spion(n)`). Läuft über eine Hülle um `doorOf[n].userData.action`.
  - Nr. 4 innen: Spion in der Haustür neben Zettel E-14 („Spion der Haustür“), außen kaltes Licht.
- **Weitere Text-Details:**
  - Briefschlitz mit Messingklappe an Nr. 3 („Die Klappe vom Briefschlitz geht auf“, `anwesen.js`).
  - Klingelschild „AYDIN – und Dina“ (Kinderschrift) mit Knopf am Bauernhaus (`ausbau_ost_west.js`).
  - Nr. 9 hat hinten eine Hintertür mit Scheibe (`post.js` „Hintertür (Scheibe)“), dahinter dunkler Flur, Betonstufe. Das Fenster, das dort stand, ist weg.
  - Emailschild der Praxis Seiler gab es schon.

## Prüfung

- **Geprüft:** Syntax und Bau (`node tools/assemble.js` → `game/index.html`, fassaden.js ohne Fehler eingebaut).
- **Nicht geprüft:** Der Bildlauf ist nicht gelaufen (Testschlange voll, Abbruch auf Anweisung).
- Der fertige Lauf liegt bereit unter `C:/Users/GIGABYTE/_fenster/`:
  - Schritte: `mk.py` → `steps.json`.
  - Start: `run.sh`, vorher `node tools/assemble.js game/index_fenster.html`.
  - Positionen und Blickrichtungen stehen in `mk.py`.

**Im Gesamttest bitte prüfen:**
1. **Laden:** Die Konsole hat keine Shader-Fehler (`fa_room`, `fa_glass`). Im Log `[Fassaden]` steht `Türspione: …`, `Villa: … Fenster mit Zimmer` und `Klingelschild Aydın`. Es gibt keine Zeile „Möbel-Karten FEHLEN“.
2. **Nacht, von der Straße** (Nr. 3, 9, 2, 4, 6, 8, 7, 1, Gisela, Pfarrhaus, Praxis, Bauernhaus, Villa, Kiosk):
   - Hinter keinem Fenster ist ein leeres Zimmer, eine schwarze oder eine weiße Fläche. Man sieht Möbel-Silhouetten, Vorhang, Jalousie oder Laden.
   - Im flachen Winkel spiegeln sich Laternen und Nebel. Bei Taschenlampe glänzen Staub und Tropfen.
3. **Tag (Kap. 4):** Die Zimmer sind grau-hell lesbar, nicht schwarz.
4. **Durchs Fenster, nah:**
   - Nr. 7 Wohnzimmer: Hilde-Silhouette, warmes Licht, Sofa vor dem Fernseher.
   - Nr. 7 Küche: kaltes Röhrenlicht; geht nach dem Schreck in der Küche mit aus.
   - Nr. 1 Kinderzimmer, Seitenwand: Gitterbett, blaues Nachtlicht, „Hineinsehen“-Text.
   - Gisela Küche: Buffet, Tisch.
5. **Nr. 1 innen, Kinderzimmer:** Das neue Fenster in der Westwand (z ≈ −18,5) sitzt bündig an der Wand und hat eine Gardine. Es schneidet keine Möbel.
6. **Türspion:**
   - An Nr. 2/4/6/8/9 klopfen, bis „Am Türspion bewegt sich etwas.“ kommt: Die Linse wird hell, dann dunkel (Auge) und blinzelt kurz.
   - Der Spion sitzt auf der Türfläche, nicht in der Luft und nicht im Holz. Das gilt auch für Türen mit Glas (Tür-Scan 1, Nr. 9/13).
   - Nr. 4 innen: Der Spion sitzt in der Haustür neben Zettel E-14.
7. **Details:** Briefschlitz an Nr. 3 (Höhe ≈ 1,4 m), Klingelschild Bauernhaus (rechts neben der Tür), Hintertür mit Scheibe an Nr. 9 hinten. Das Fenster dort ist weg, die Klickfläche „Hintertür (Scheibe)“ passt.
8. **Leistung:** Die Sonde hängt nicht spürbar (sechs Bilder alle ~50 s / 18 m).

## Offen / Bitten

- **Hauptagent:** Kosten der Sonde im Gesamtlauf messen. Sie zeichnet alle ~50 s bzw. 18 m sechs Bilder lang je eine Würfelseite. Falls zu teuer: `fassaden_probeAt` seltener aufrufen oder die Weite (`CubeCamera` far 80) kürzen.
- **Erledigt (Entscheidung Hauptagent):** Nachtlicht im Kinderzimmer Nr. 1 unter dem neuen Fenster: Fab-Scan `ms/floorlamp` (wie die Schreibtischlampe in Zimmer 7, auf 0,34 m), Schirm kaltblau leuchtend, Schein nur über LICHT_HAKEN (+0,05 Hemisphäre im Kinderzimmer), kein neues Licht. Im Gesamttest: steht auf dem Boden, schneidet nichts.
- Kein Treppenhaus-Motiv: Im Katalog gibt es keinen Treppen-Scan. Statt Treppenhaus zeigt das Motiv einen Flur.
- Die Hintertür-Klickfläche von Nr. 9 (`post.js`) liegt jetzt genau auf der neuen Tür. Dort ist nichts zu ändern.
