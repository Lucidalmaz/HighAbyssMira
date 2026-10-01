# Stand AP Kreaturen (Q-1, CLAUDE.md §19–§22) – 01.10.2026

## Gebaut

### Werkzeugkette (neu, Node + three, ohne Grafikkarte)
- `app/tools/kreaturen.mjs hirschding|wolf [--film=Ordner] [--nur=clip,…] [--w=Breite] [--gewichte]` – Modell vorbereiten, Clips aus Gang-/IK-Beschreibungen aufnehmen, ins GLB schreiben (Drehungen 16 Bit, Keyframe-Reduktion), Filmstreifen zeichnen (flach schattiert, ohne Farbe und Textur = Silhouettenprüfung nach §20; Bodenraster gegen Gleiten). Danach `node tools/ktx.mjs`.
- `kreaturen_rig.mjs`: Rig-Helfer (Weltachsen-Drehung, Zielen, Zwei-Glied-IK mit Polvektor, Weltdrehung des Kopfes, Posen mischen), **Gangplaner** `foot()` (Standfuß steht in der Welt still, Schwungfuß holt den Weg auf; Stil „hitch“ = zwei Tritte je Schritt), Aufnahme, Schreiben, Filmstreifen.
- `kreaturen_hirschding.mjs`: **echtes Skelett für „Deer Thing“** (32 Knochen, Ruhedrehung 0, Spielrahmen Meter/+z vorn/Füße auf 0) mit Hautgewichten über Abstand zu Knochenstrecken, weichen Gelenkübergängen und Regionen (Beine nur ihrer Seite, Kiefer nur unterm Schädel, Geweih am Kopf, Keule/Schulter mit Höhenverlauf ins Becken bzw. Schulterblatt, damit beim Aufrichten nichts reißt).
- `kreaturen_wolf.mjs`: Grimhound (DM-913) → Maßstab, three-taugliche Knochennamen, eigene Clips unter den alten Namen.
- `klang_wendigo.py` + 22 neue Quellen in `HAM_Audio/quellen.py` (`wd_*`).

### Modelle (`game/assets/ms/wendigo/`)
| Datei | Inhalt |
|---|---|
| `hirschding_rig.glb` (+ ktx) | Hirschding mit Skelett; Clips `stehen` (8 s, kein Atem, Kopf rastet schief ein, Kiefer klappt, ein Huf zuckt), `gehen` (aufrecht, **zwei Tritte je Schritt**, Gewicht fällt aufs Standbein, Kopf stabil wie beim Vogel, 1,06 m/s), `lauern` (tief vorgebeugt, Schädel vor der Brust, lange Pausen, 0,48 m/s), `sturm` (fällt auf alle viere, Sprunggalopp, Rücken beugt/streckt, 4,05 m/s), `flucht` (rückwärts, **Sprunggelenke knicken falsch herum**, −2,8 m/s), `zurueck` (Ruck zurück, **ein Vorderlauf vor die Augen**, Schritt zurück), `aufstieg` (aus dem nassen Sack: Becken zuerst, Arme zuletzt, Kopf rastet ein), `schrei`, `packen` (Tod durch ihn). Aufrecht ~2,7 m bis zu den Geweihspitzen („ein Hirsch auf zwei Beinen“, Bibel Z-03). |
| `wolf_geschaelt.glb` (+ ktx) | Geschälter Wolf: `Rest` (flach hingeworfen, ein Lauf zuckt), `RestToGoBackUp` (falsch herum: Becken wie an Fäden, Hände schleifen, Kopf hängt und rastet zuletzt), `IdleAggressive` (tief, Schultern hoch, **schwerer nasser Atem**, Zunge tropft), `IdleBreathe`, `IdleLookAround` (**Spurensuche** mit der Nase am Boden), `Walk` (Seitenfolge, **lahmt vorn rechts**: kürzerer Schritt, die Hand knickt ein, der Körper sackt), `Run` (Sprunggalopp 6,5 m/s), `JumpBite` (ducken, 1,3 m Satz, schnappen, schwer landen), `Death` (im Netz: zusammenbrechen, winden). |
| `muskel_faser.jpg`, `muskel_hoehe.jpg`, `sehne.jpg` | Ausschnitte aus „Muscle Tissue“ (clacydarch, CC-BY): Faserbild, Relief, Sehne/Knochenhaut. |

### Spiel (`app/mods/kreaturen.js`, neu, in ORDER nach `neben6`)
- **Fleisch-Shader** `kr_fleischMat`/`kr_haut` (eine Designsprache für alle Geschälten): Muskelfasern dreiplanar im Modellraum, Relief als Normalenstörung, Blut dunkler in den Falten, Adern, **Nässe** (Rauheit fleckig 0,14…0,55), **Subsurface-Anmutung** (Wrap-Beleuchtung: Licht greift rötlich um die Kanten), eingesunkene **Rippen** und durchstoßende **Wirbel** (Verschiebung im Vertex-Shader), **asymmetrische Wunde** mit Knochen darin, Fuchs-**Naht** auf dem Rücken. Formen `KR_FORM`: `reh`, `wolf`, `hd`, `rabe`, `fuchs`, dazu Halsring `hals`/`hals_k` (Hirsch, Krähe: wo der Kopf sich dreht, klafft Fleisch).
- **Hirschding-Bewegungsschicht**: Clip aus dem Zustand (Jagd `K6J.st`, Höhepunkt `cine.ph`, Tod), **Abspieltempo = Wegtempo** (kein Gleiten), in Jagd/Aufstieg/Flucht **9 Bilder je Sekunde** (Skelett und Lage im selben Takt), Kopf dreht ohne Hals zu Luke **in Rasten** (jede Raste knackt).
- **Geschälte**: Wolf-Tempo an den Weg gekoppelt, hörbarer Atem im Rhythmus des Clips; Reh lahmt hinten links (Schicht nach dem Mischer).
- **Laute** `Audio.wendigo(art, x, y, z, gain)`: knochen ×6, schritt ×6 (nasse Tritte), atem ×3, knurr ×4, ruf ×3 (Hirschröhren tiefer + Menschenstöhnen, leicht verzerrt), fleisch ×3, schnueff ×2, huf ×4, stoehn ×3 – alles Aufnahmen, keine Oszillatoren. Laden erst in Kapitel 6.
- **Lichtschiff** (Bibel §2 „Rippen, dünne leuchtende Haut, Licht wie eine Flamme, Haut, die atmet“): die Blech-Untertasse bekommt eine von innen durchleuchtete Membran (wölbt sich zwischen den Rippen, atmet langsam, Adern, unten heller) und 26 gewachsene, ungleiche Knochenrippen + Randring (ein Netz). Lichtschlitze/Positionslampen aus. Strahl, Iris, Lichter, Bewegung (kino.js, kapitel1.js) unverändert.
- Testzugriff `window.__kr` (`zeige(clip, tempo)` erzwingt einen Hirschding-Clip).

### Geändert (nur Aussehen/Bewegung/Ton)
- `hungrige.js`: Wolf aus kreaturen.js (`hungrige_beast('wolf')`), `hungrige_nackt` → Fleisch-Shader, Hirschding mit Skelett in `hungrige_loadDT` (Rückfall altes Modell), `hungrige_ton()` (Wendigo-Laut, sonst alter Laut) an allen Kreaturstellen, Fuchs-Naht, Halsring Hirsch/Krähe, **Kopf in Rasten** bei Hirsch (5) und Hofer (6, jede knackt), Hirsch ruft (Aufnahme) und tritt schwer, Rabe beim Aufreißen mit Fasern/Adern/Nässe + reißendes Fleisch, Höhepunkt: Hufe, Knurren, Ruf beim Fliehen; `hungrige_flyTick`: schnell ab/bremsend an, in die Kurve legen, Nase nach Flugrichtung, beim Landen aufgerichtet; Squash-/Kipp-Behelfe nur noch ohne Skelett. `hungrige_blatt`, Seite-1-Rückruf und `hungrige_stimme` unberührt.
- `kapitel6.js`: Jagd ohne Squash/Kipp-Behelfe bei Skelett (Lage im 9er-Takt, auch bei der Flucht), Schritte = zwei Huftritte + gelegentlich Knochen, Sturm mit Ruf, Lichtflucht mit Knochen/Stöhnen, Falle-Wolf mit Stöhnen/Knurren; `k6_ton()`.
- `whiskey.js`: Schleifen starten an zufälliger Stelle mit leicht anderem Tempo (keine identischen Loops), **Ducken vor dem Absprung**, **in die Kurve legen**, **bremsende Flügelschläge** beim Landen (zwei Schläge hörbar), **Gewicht beim Aufsetzen** (Körper federt ein).
- `beobachter.js`: beim Trippeln bewegen sich **Füße und Arme im Takt** (Vertex-Shader, Phase = Schrittphase) statt dass der Körper gleitet.
- `lwo.js`: `lwo_brustLicht` – das Eigenleuchten des Blechmann-Anzugs nur noch im Feld um die Brustlampe (Gewicht je Ecke einmal beim Aufbau), vorher glühte der ganze Anzug.
- `CREDITS.md`: Grimhound, Muscle Tissue, Deer-Thing-Nutzung, Wendigo-Tonquellen, angesehene/nicht genommene Modelle.

## Unterscheidung der Formen (Silhouette + Bewegung + Verhalten + Ton)
| Form | Silhouette | Bewegung | Ton |
|---|---|---|---|
| Hirschding | aufrecht 2,7 m, Rippenrumpf, Wirbelhals, aufgesteckter Schädel, hängende Vorderläufe | zwei Tritte je Schritt, 9 Bilder/s, Sturm auf allen vieren, Rückwärtsflucht mit falschen Gelenken, Arm vor die Augen; **kein Atem** | Huftritte doppelt, Knochenrasten, Ruf |
| Geschälter Wolf | tief, lang, Menschenhände vorn, Borstenreste, offene Flanke | lahmt vorn rechts, steht falsch herum auf, **atmet schwer**, Satz mit Biss | nasser Atem, Knurren, Stöhnen, nasse Tritte |
| Geschältes Reh | schlank, Wirbel stoßen durch, eingesunkene Rippen, Schulterwunde mit Knochen | kommt wie ein Hund, Kopf schief, lahmt hinten links | nasse Schritte |
| Fuchs | Fell, auf dem Rücken klafft eine nasse Naht | sitzt ohne Atem, Kopf verkehrt | Knurren (Aufnahme) |
| Hirsch | Fell, Halsring aus Fleisch | Kopf dreht ohne Hals in fünf knackenden Rasten | Ruf, schwere Hufe |
| Krähe | Federn, kleiner Fleischring am Hals | Kopf 180° | – |
| Hofer | Mensch | Kopf in sechs Rasten, jede knackt | Knochen, Knurren |

## Kurz geprüft
- Filmstreifen offline (Silhouette ohne Farbe) für alle Hirschding- und Wolf-Clips; behoben: Bauch-/Flankenfetzen (Gewichte), Brustfetzen beim Arm-Heben (Oberarm nur mäßig, Unterarm greift), Rückwärtsflucht (nur die Sprunggelenke drehen um), zu langer Fluchtschritt, Wolf im Boden (Liegepose neu, Nase beim Schnüffeln höher).
- `node --check`/Zusammenbau ohne Syntaxfehler; KTX für die neuen Dateien.
- Sichtlauf im Spiel: siehe unten.

## Sichtlauf (ein Lauf im Spiel, Kap. 6, Testbau `index_kr.html`, Schritte `C:/Users/GIGABYTE/_kr_t/`, Bilder `C:/Users/GIGABYTE/_kr_out/`)
- Alles lädt in Kapitel 6 (Wolf, Hirschding mit Skelett, Fleischtexturen, Lichtschiff-Rippen, 34 `wd_*`-Laute). Falle: Wolf liegt (`Rest`) → steht auf → `IdleAggressive` → `Walk` (Abspieltempo folgt dem Weg). Geschältes Reh: Fasern, Nässe, Rippen. Fuchs mit Naht. Hirschding: `stehen`, `lauern`, `sturm` (auf allen vieren), `zurueck`, `flucht` erzwungen und gesehen. Höhepunkt vollständig durch: Raben → Aufreißen (Rabe mit Fleisch-Shader) → `aufstieg` → `gehen` → `zurueck` beim Stoß → `flucht` → Epilog, Fibel „~~Der Hungrige~~ Wendigo“ erledigt. Keine Fehler aus kreaturen/hungrige/kapitel6.
- Danach behoben: Fleisch-Relief rauschte (Bump-Stärke ×0,02), Fleisch zu dunkel/grob (heller, feinere Kachel, Grundnässe), Lichtschiff-Adern wie gesprungene Erde (feiner, Kern zur Mitte heller), Reh-Relief halbiert. Nicht erneut geprüft.
- **Achtung, nicht aus diesem AP:** Im Selbsttest laden derzeit **alle eingebetteten GLB-Texturen nicht** (`THREE.GLTFLoader: Couldn't load texture blob:app://game/…`, 13× – auch mit dem Haupt-Bau `index.html` und z. B. `animal_fox` aus dem Tierpaket); KTX2-Einzelbilder laden. Dadurch wirken Wolf/Fuchs/Hirschding in den Bildern blass bzw. weiß. Bitte im Gesamttest prüfen (Electron/`app://`-Protokoll, Blob-URLs).

## Offen / Bitten
- Fab-Links für Grimhound und Muscle Tissue in `CREDITS.md` nachtragen (lokal nur die Downloads, keine Listing-Adressen).
- Hirschding ohne LOD-Netz (52 k Dreiecke, nur ein Exemplar, sichtbar < 26 m, Skelett nur sichtbar aktualisiert, keine Schatten); Wolf 12 k.
- Lichtschiff: der Kandidat `ufo_plaggy/UFO.fbx` (CC0) ist eine weiße Blech-Untertasse ohne Struktur – nicht genommen. Ein echtes Fab-Modell „Schiff aus Rippen und Haut“ fehlt; jetzt Haut-Shader + Rippen auf der vorhandenen Rumpfform. Bei Fund eines passenden Fab-Modells austauschen.
- Zahn-Mann (feuer.js, UE5-Mannequin mit Brand-Clips) nicht angefasst – nicht sichtbar unter dem Standard.
- Hauptagent: Gesamttest Kap. 6 (Jagd mit Lärm/Licht, Falle alle drei Wege, Tod durch das Hirschding, Höhepunkt), FPS mit Hirschding im Bild; Lautstärken der `wd_*` im Gesamtmix nach Gehör.
