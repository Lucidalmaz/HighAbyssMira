# QA-Art-Raster (Art-Director-Review, Triple-A-Maßstab)

Stand 09.10.2026. Gilt für den Gesamttest. Jeder Ort bekommt je Kriterium eine Note von 1 bis 5. Der Befund steht in `qa_art_befund.md`.

## Notenskala
| Note | Bedeutung |
|---|---|
| 5 | Triple-A: wie in einem Studio-Titel (RE-Village, SH2-Remake, Alan Wake 2), nichts fällt negativ auf |
| 4 | gut: einzelne kleine Schwächen, nur im Nahblick sichtbar |
| 3 | ordentlich: wirkt stimmig, aber erkennbar „Indie“ (Wiederholung, leere Flächen, flache Stellen) |
| 2 | schwach: sichtbar generiert, leer oder billig; stört die Immersion |
| 1 | kaputt: Platzhalter, Fehlfarbe, Loch, schwebende Dinge, schwarzes Bild |

## Kriterien (Kürzel)
| Kürzel | Kriterium | Prüffragen |
|---|---|---|
| **MAT** | Materialqualität | PBR vollständig (Farbe, Normal, Rauheit/ORM)? Texelauflösung im Nahblick (≥ 512 px/m bei Möbeln, ≥ 256 px/m bei Wänden)? Kachelung sichtbar (Wiederholmuster, Nähte, Riesenflecken durch zu große Kachel)? Falsches Material (Wellblech auf Aktenschrank, Plastik-Weiß)? |
| **DET** | Detaildichte | Kleinteile auf Ablagen, Verschleiß an Kanten, Schmutz mit Ursache (Wasserlauf, Sockel, Herd), Decals, Fugen, Sockelleisten, Türrahmen, Fensterbänke, Kabel, Steckdosen |
| **STO** | Storytelling-Props | Erzählt der Raum, wer hier lebte und was geschah? Jedes Story-Objekt glaubhaft platziert, nicht ausgestellt? |
| **LIC** | Lichtstimmung | Jede helle Stelle hat eine Quelle (visual_identity §2)? Kontrast lesbar, Dunkelheit nutzbar (Silhouetten statt Schwarz)? Natrium gegen Kaltblau? |
| **BAL** | Balance | Nicht zu leer (große tote Flächen), nicht zu voll (Duplikate, zu dichte Reihen, Dinge in Wänden) |
| **MAS** | Maßstab/Proportion | Türen 2,0–2,1 m, Sitzhöhe 0,45 m, Tische 0,75 m, Kinderbett, Schrift-/Schildgrößen realistisch |
| **GEN** | Generiert-Wirkung (5 = nichts) | Flache Canvas-Texturen mit Arial, Quader/Primitive, Symmetrie, identische Objekte in Reihe, gleicher Drehwinkel, Plastik-Look |
| **FX** | Effekte | Nebel liegt (keine Wand), Regen, Tropfen, Partikel, Flammen ohne Sprite-Kante |
| **FIG** | Figuren | Gesicht, Haare, Kleidung, Haltung, Aufpoppen, Laden |

## Ortsliste
Außen: Hauptstraße (Ahornstraße), Kreuzung, Vorgärten, Station/Tankstelle/Schrottplatz/Block Ost, Schrebergärten West und Hof, Wald, Tiefwald, Friedhof, Kapelle, Kirchberg.
Innen: Nr. 1, Nr. 4, Nr. 7 inkl. Keller, Nr. 9, Villa, Anwesen, Amt (Tunnel, Archiv, Kantine, Registratur, Sicherungsraum, Spinnenraum, langer Gang, Messraum, Zimmer 7), Kanal/Atlantschiss, Bus, Wrack, Hütten.

## Vorgehen je Ort
1. Totale, Halbtotale, Nahblick (Lampe an/aus), je 1 Bild; im Normalmodus, nicht Lite.
2. Raster ausfüllen, Mängel mit Bildpfad belegen.
3. Code-Gegenprüfung: Anzahl `put(`/`decal(`/`hideAt`, Kits, Canvas-Stellen ohne `echt_an`, gleichförmige Schleifen (`i * Abstand` ohne Zufall).
4. Maßnahme nach Wirkung/Aufwand und Sichtbarkeit im Hauptweg ordnen (Kap. 1 Start und Nr. 7 zuerst).

## Regeln für Maßnahmen
- Nur vorhandene Scan-Assets (`game/assets/ms/*`) oder freie Fab/Quixel-Assets (Preis 0, Lizenz geprüft, Credits). Nicht verwenden: die in `app/tools/release_auslassen.js` ausgeschlossenen Ordner (`gas_retro`, `teddy_ripped`, `wheelbarrow_old`, `tomb_wndy`, `streetlamp_old`, `fence_white`, `chapel_flooded`).
- Keine neuen Lichter (REGELN in `kino.js`); nur vorhandene modulieren.
- Keine Canvas-Schilder/-Aufkleber neu; vorhandene Schrift läuft über `echt_an` (Druck/Schablone/Farbband).
- Wiederholung brechen: Rotation, Skalierung, Farbton, Lage je Instanz; seltene Ausfälle statt fester Reihen.
