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
| Inventar-Karten | inventar3d.js | 3D-Vorschau schon echt; Platzhaltersymbole bis Render fertig | 3 | 3 | ja | nachher_jr_inv (siehe offen) |
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

## 4. Offen / ehrlich
* Inventar-Symbole sind bis zum 3D-Vorschaubild Strichsymbole (Basis-ICONS); das ist Logik in inventar3d.js, nicht angefasst.
* Hauptmenü-Titel/Karte/Papier nicht neu gemalt (waren schon Note 2).
* Nur 1584 × 861 geprüft; andere Auflösungen nur über `clamp()`-Skalierung, nicht im Bild.
* Gefahr-Zittern per Hook-Zustand nur im Bild einer Furcht-Vignette (ohne Bewegungsbeleg).
