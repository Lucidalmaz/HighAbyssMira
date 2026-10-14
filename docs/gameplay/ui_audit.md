# UI-Audit und Neugestaltung „Akte & Blech“ (Folgeauftrag 11, 14.10.2026)

Bilder: `docs/gameplay/fotos_1410/` (`vorher_*`, `nachher_*`, 1584 × 861, Entwicklungsfassung, Dauerinstanz). Noten = Schulnote, Maßstab ≥ 2 (prägnant: Ziel 1–2).

## 1. Gestaltungskonzept
* **Stoffe, nichts gemalt:** rostiges Blech (Scan `rust_sheet`, als `assets/ui/blech.jpg`, 91 KB), fleckiger Beton (Scan `wall_damaged`, `assets/ui/beton.jpg`, 53 KB), Papierfaser (`assets/ms/papier/faser.jpg`, schon im Spiel), Kreide-Strichliste in der Kreideschrift. Lizenzen wie die Quell-Scans (docs/technical/lizenzen_release.md).
* **Schriften (alle OFL/Apache, lokal):** IM Fell English (SC) Titel · Special Elite Schreibmaschine/Etiketten · Alegreya Sans (SC) Beschriftung/Schalter · Cormorant Garamond Fließtext · Covered By Your Grace Kreide.
* **Farben:** Bein `#e4dac3`, Asche `#8f846e`, Ocker `#b8a47c` nur sparsam, Blutrot `#8e1d15/#b3261a` als einziger Akzent (Markierbalken, Hover, Todestitel). Messing/Gold-Zierrat (Ecken, Rauten, Goldplaketten) entfernt.
* **Bausteine:** Blechplatte mit vier Nieten (`.panel`, `#puzzle .box`), Tastenkappe aus Bein (überall gleich), flache dunkle Schalter mit rotem Balken bei Hover, weiche Streulicht-Scrims hinter Text statt Kästen, Klebeband mit Faser und gerissener Kante, dünne Haarlinien.
* **Unruhe:** Bei steigender Furcht (Furcht-Vignette > 0,3) zittern Aufgabe/Nebenaufgabe kaum merklich (±0,6 px, Farbsaum rot/blau); nur Text, keine Filter über dem Spiel.
* **Lesbarkeit/Leistung:** Schriftgrößen `clamp(…vw…)`, Texte weiter per Klick/Enter/X überspringbar (keine Logik geändert), keine Filter/Blur über dem laufenden Spiel, ein Stylesheet (Modul `ui2.js`), 2 neue Bilder (144 KB).

## 2. Inventar und Noten
| Element | Datei | Aussehen vorher | Note vorher | Note nachher | prägnant | Bild vorher → nachher |
|---|---|---|---|---|---|---|
| Hauptmenü | menue.js, Basis-CSS | Kreide-Titel gut; bei 861 px Höhe Menü abgeschnitten („Beenden“ unten raus) | 3 | 2 | ja | vorher_menu0 → nachher_m_main_k |
| Menü: Kapitelwahl | menue.js | Polaroids gut, aber große helle Nebelkugel (Blitz) mitten im Foto | 3 | 2 | ja | – → nachher_m_chap |
| Menü: Einstellungen/Steuerung | Basis | Notizheft mit Ringlöchern, Tastenkappen | 2 | 2 | ja | nachher_m_set, nachher_m_ctrl |
| Pause | Basis | Gold-Rahmen mit Rauten (RPG-Stil) | 4 | 2 | ja | vorher_pause → nachher_pause |
| HUD Aufgabe/Nebenaufgabe | ziele.js, Basis | nackter Text | 3 | 2 | ja | vorher_hud → nachher_hud, nachher_quest |
| Interaktionshinweis (E) | Basis | Rahmen aus Georgia | 3 | 2 | ja | nachher_hud |
| Fadenkreuz | Basis | Punkt/Ring | 3 | 2 | ja | nachher_hud |
| Untertitel/Textbox, Toast | Basis, textweiter.js | Text mit Schatten | 3 | 2 | ja | nachher_hud |
| Notizzettel | oberflaeche.js | gutes Papier, Klebeband = weißer Klotz | 3 | 2 | ja | vorher_note → nachher_note |
| Fibel (Aufgaben/Inventar/Funde/Fotos/Fallwand) | Basis, inventar3d.js | unten abgeschnitten, Höhe sprang je Reiter, Taste überdeckte Inhalt, bunte Reiter | 3 | 2 | ja | vorher_jr_inv → nachher_jr_inv, jr_aufg, j_funde |
| Inventar-Karten | ui2.js (CSS auf inventar3d.js) | flache Beige-Kacheln, dünne Strichsymbole | 3 | 2 | ja | vorher_jr_inv → nachher_inventar_karten |
| Karte | karte.js | handgezeichnete Skizze auf Rasterpapier, Falze | 2 | 2 | ja | vorher_jr_karte / nachher_jr_karte |
| Kapitelkarte | fuehrung.js | Goldtext mittig, flach | 3 | 2 | ja | vorher_kk → nachher_kk |
| Ortsmarke | fuehrung.js | zwei Textzeilen | 3 | 2 | ja | vorher_ort → nachher_ort |
| Tipp | tipps.js | Tastenrahmen golden | 3 | 2 | ja | vorher_tipp → nachher_tipp |
| Rätselfenster (Klavier, Uhr, Funk …) | Basis | Messingschild-Titel | 4 | 2 | ja | vorher_puzzle → nachher_puzzle |
| Tastenfeld | bedienung.js | echte Modelltextur der Tafel | 2 | 2 | ja | nachher_keypad |
| Todesbildschirm | tod.js | Zierrat, Goldlinie | 3 | 1–2 | ja | vorher_tod → nachher_tod7 |
| Ladeanzeige | Basis | dünne Linie, Text | 2 | 2 | ja | nachher_load |
| Beutel (3D-Hände) | beutel.js | echtes Modell | 2 | 2 | ja | nicht geändert |

## 3. Umsetzung
`app/mods/ui2.js` (neu, in `assemble.js` hinter `tipps`), `game/assets/ui/*.jpg` (neu), `menue.js` (Blitz der Kapitelwahl-Polaroids 16 → 7). Der Todesbildschirm zeigt die Tode als Kreide-Strichliste (Fünfergruppen, höchstens vier Gruppen).

## 4. Nachtrag (Koordinator-Auflage)
* **Inventar-Karten:** Pappanhänger mit Öse, Papierfaser, Stempelsymbol (dunkle Tinte, Multiplikation, leichter roter Versatz) wo noch keine 3D-Vorschau da ist, Schreibmaschinen-Etikett; ausgewählt = roter Rand. Bild `nachher_inventar_karten.jpg`.
* **Auflösungen:** Bildschirm der Testmaschine ist 1600 × 1000, größere Fenster sind nicht möglich. Ersatz: Seitenzoom (0,825 ≙ 1920 × 1080, 0,619 ≙ 2560 × 1440 bei CSS-Pixeln). Das prüft Abstände/Umbruch/Überlauf der Oberfläche; das 3D-Bild wird dabei nicht mitskaliert (schwarze/abgeschnittene Spielfläche im Bild ist Messartefakt). Belege `r1080_*`, `r1440_*`: Menü, Pause, HUD, Kapitelkarte und Fibel brechen nicht um, nichts läuft über. Echtes Fenster in 1920/2560 nicht geprüft.
* **Gefahr-Zittern gemessen:** 50 Proben in 2 s, `#objective` transform wechselt zwischen `translate(0,0)`, `(0,6; −0,5)`, `(−0,5; 0,4)`, `(0,4; 0,6)` px (4 verschiedene Werte, Soll ±0,6 px).
* **Fotoalbum:** per Hook freigeschaltet (`album_S.hat`, Testfoto abgeheftet), `album_auf()`: Album öffnet (`ui.overlay = albumOv`), Doppelseite mit Beschriftung „Zayns Kamera“, Foto-Ecken, Notiz lesbar. Bild `nachher_album.jpg`; Album ist 3D-Modell/eigener Stil, nicht verändert.

## 5. Offen / ehrlich
* Hauptmenü-Titel/Karte/Papier nicht neu gemalt (waren schon Note 2).
* Echte Fenstergrößen 1920/2560 nur per Zoom-Ersatz belegt.
