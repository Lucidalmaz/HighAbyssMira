# F3 · Stand R-5 (Ich-Hände greifen, nie hindurch) und R-6 (logische Innenräume)

Stand 01.10.2026. Testbilder: `C:/Users/GIGABYTE/_r56/vorher/`, `…/nachher/`, `…/nachher2/` (Kontaktbögen: Spielerblick, drei weitere Winkel, grüne Kollisionsformen, Fingerprüfung gegen das echte Mesh).

## R-5 Hände

### Neues Modul `griff.js` (in ORDER nach `tausch`)
- Ein Korrektur-Durchgang für alle Ich-Hände (Detective_Hands), läuft nach dem Posen.
  1. **Handfläche und Unterarm:** Liegen Handwurzel, Grundgelenke oder Unterarm in einer Form, wird der Arm entlang der Flächennormalen herausgeschoben. Ausnahme: die Form, die diese Hand selbst hält (`halt`).
  2. **Finger-IK:** Jeder Finger wird über eine Beugezahl k gesetzt (alle drei Glieder gemeinsam, mit Gelenkgrenzen).
     - Dringt ein Finger ein, öffnet er sich bis zur Oberfläche.
     - Geht es auch gestreckt nicht, beugt er sich stärker um das Objekt herum.
     - Mit `anlegen` schließt er bis zur Berührung, höchstens +35 % Beugung.
     - Öffnen geschieht sofort, Schließen gefedert.
- **Formen:** Kasten, Zylinder (Achse y) und Kapsel. Fingerradien liegen zwischen 5,8 und 8,8 mm.
- **Takt:** keine Allokationen, nur aktiv bei sichtbaren Händen.
- **Testzugriff:** `__griff.pruefen(B, meshes)` zählt Punkte im echten Mesh (Strahl-Parität, Selbsttest). `window.__griffAus` schaltet den Durchgang ab (nur für Vorher-Bilder).

### Angebunden
- **Gürteltasche, Stufe 1** (`album.js`, `album_griffFormen('beutel')`):
  - Körper als Kasten aus allen Punkten außer der Klappe; Riemen und Schnalle zählen zum Körper.
  - Klappe als Kasten, der mit `beutel_S.flapA` um die Scharnierkante dreht.
  - Die Finger der rechten Hand liegen jetzt außen an der Seitenwand statt in der offenen Tasche.
- **Album:** zwei Kästen.
  - Rechter Block: Rücken und rechte Seiten.
  - Linker Block: Deckel und linke Seiten, klappt mit dem Drehpunkt.
- **Joint-Szene** (`kiffen.js`, `kf_griff`):
  - Formen: Grinder-Körper und -Deckel als Zylinder; Knolle, Papes und Feuerzeug als Kasten aus der Geometrie.
  - Blatt und Tip als Kasten aus der aktuellen, verformten Geometrie, der gerollte Joint als Kapsel.
  - Die haltende Hand (Schlüssel `a`) schiebt nicht gegen ihre Requisite. Den Joint beim Rauchen klemmen die Finger selbst.
- **Kater tragen** (`kapitel5.js`):
  - Die Hände hängen jetzt am Kater statt an der Kamera: Rig = Kater-Lage · (Kater-Lage bei waagerechtem Blick)⁻¹.
  - Vorher fuhr beim Blick nach unten die rechte Handfläche in den Rücken, weil `katzen.js` den Kater nur mit der Blickrichtung dreht.
  - Kollisionsformen aus den Knochen wurden geprüft und verworfen: In der Trage-Pose liegen Becken und Hals fast aufeinander. Dafür gilt die bei waagerechtem Blick saubere Lage jetzt immer.
- **Beutel Stufe 2/3:** Die Rucksäcke stehen ohne Hände, also gibt es dort nichts zu prüfen.
- **`kino.js` (`kino_haendeAugen`):** Das sind NPC-Hände, keine Ich-Hände; nicht angefasst (Kino-AP).
- **`figuren_handPose`:** hat keine Aufrufer.

### Fingerprüfung gegen das echte Mesh (Punkte im Mesh von 36 je Hand)

| Szene | vorher | nachher |
|---|---|---|
| Album (8 Momente) | 5 Momente mit Fingern im Buch (bis 9 Punkte, z. B. offen 2,5 s: L 5, R 4) | nur 2 Momente mit 2–3 Fingerkuppen (Auf-/Zuklappen) |
| Gürteltasche (9 Momente) | rechts in jedem Moment 4–5 Punkte (Mittel-, Ring-, Kleinfinger in der Tasche), links bis 6 | Finger frei; übrig 1–3 Daumenpunkte an Riemen/Schnalle → Körperkasten erweitert, siehe letzter Lauf |
| Kater geradeaus / gesenkt | frei / rechte Handfläche im Rücken | siehe letzter Lauf |
| Joint (21 Momente) | in 14 Momenten 1–5 Punkte (Ring-/Mittelfinger im Grinder) | siehe letzter Lauf |

## R-6 Innenräume

### Bildlauf vorher (Kap. 1, mit Taschenlampe + helle Ansicht + Grundriss)
Kap. 2 (Amt) und Kap. 4 (Villa) liefen in beiden Versuchen in die 10-Minuten-Grenze (Ladezeit bei parallelen Läufen). Für sie gibt es keine neuen Bilder. Bestand aus `_bewohnt/shots`: dort ist nichts Unlogisches aufgefallen.

| Raum | Unlogisch | Behoben |
|---|---|---|
| **Keller Nr. 7** | 8 massive Klotzstufen enden mitten im Raum auf 1,76 m, 0,74 m unter der Decke; kein Durchbruch, kein Geländer, keine Tür; Ankunft neben dem Treppenkopf | ja |
| Nr. 7 Eingangsstufen | Lauf über die Stufen gemessen: Boden 0 → 0,22 → 0,43 (die Stufen tragen schon über die Scan-Kollision; der Hinweis in `F3_uebergaben.md` ist überholt) | nicht nötig |
| **Nr. 4 Diele** | 6 Stufen auf 1,08 m, dann Luft (unsichtbarer Sperrkasten) | ja |
| **Nr. 4 oben** | „Treppe nach unten“ = drei Bretter flach auf dem Boden | ja |
| **Nr. 4 Keller** | 5 frei schwebende Bretter mit 42 cm Steigung bis unter die Decke; Ankunft mitten auf der neuen Treppenfläche | ja |
| Nr. 7 Wohnen/Küche/Schlafen/HWR, Nr. 1, Gisela, Pfarrhaus, Kapelle | Möbel an Wänden, Stühle an Tischen, nichts schwebt erkennbar | – |
| Schuppen, Posten, Pfarrhaus, Nr. 7 | Jacken (`bewohnt.js`, `w_jacke`) hängen als flache, fast schwarze Form ohne Haken an der Wand | offen (siehe unten) |
| Nr. 4 oben | Kleiderschrank zeigt aus der SO-Ecke den Rücken (im Grundriss steht er an der Bad-Trennwand) | offen, geringfügig |

### Was gebaut ist
- **`kirchberg_treppe(o)`** (`kirchberg.js`): Treppe mit Logik.
  - Tritt- und Setzstufen, zwei Wangen, Geländer mit Pfosten, Handlauf und Stäben an der offenen Seite, Podest.
  - Deckendurchbruch: Die Decke wird um das Loch in Stücken neu gebaut, darüber ein Treppenschacht mit Deckel.
  - `begehbar`: jede Stufe eine Kollisionsstufe, Geländer und Schacht halten. Sonst sind nur die ersten zwei Stufen begehbar, der Rest sperrt und die Klickfläche führt weiter.
  - `kirchberg_raum` merkt sich dazu `R.decke`, `R.boden` und `R.cm`.
- **Keller Nr. 7** (`innen_ort.js`):
  - Offene Holztreppe an der Ostwand: 11 Stufen à 22,5 cm, Podest auf 2,70 m, Durchbruch mit Schacht, Geländer zur Raumseite. Der Balken im Durchbruch endet an zwei Wechseln.
  - Oben die Kellertür; die Klickfläche „Nach oben gehen“ sitzt jetzt dort. Die Treppe ist begehbar.
  - Ankunft am Fuß der Treppe mit Blick zum Stuhl. Geändert in `enterBasement` und Fortsetzen (Basis) sowie in den Kellerwegen von `kapitel1.js`.
  - Der Türschlag in `kapitel1.js` kommt jetzt von oben am Podest.
- **Nr. 4** (`nr4.js`):
  - **Diele:** ganzer Lauf bis ins OG. 14 Stufen à 19,7 cm (steile Altbautreppe) mit 0,9 m Platz am Antritt, Durchbruch und Schacht.
    - Garderobe, Jacke, Zettel E-01 („Garderobe“) und ein Stapel sind an Innen- und Vorderwand umgezogen.
    - Zurück von oben steht man am Fuß der Treppe.
  - **Oben:** Tür zum Treppenhaus an der Westwand. Nachttisch, Zettel t_zaehl und Glas sind 30 cm verrückt.
  - **Keller:** 10 Stufen à 22,7 cm mit Wangen, Geländer, Durchbruch, Podest und Tür oben. Ankunft am Fuß der Treppe; die Klickfläche „Kellertreppe hinauf“ sitzt am Fuß.
- **Klickflächen und Quest-Objekte:** Alle bleiben erhalten. Verschoben sind nur die Lage von E-01, t_zaehl, „Nach oben gehen“ und „Kellertreppe hinauf“.

## Geprüft
- Je Modul Syntax, Zusammenbau fehlerfrei.
- Ein Bildlauf vorher (Hände + Kap.-1-Räume).
- Ein Händelauf nachher (Album, Beutel, Kater).
- Ein gezielter Schlusslauf: Joint, Beutel, Kater, Keller 7, Nr. 4 EG/OG/Keller.

## Offen / Bitten
- **Hauptagent, Gesamttest:**
  - Keller Nr. 7 die Treppe hinauf und hinunter laufen (Stufen-Kollision, Kopf im Schacht).
  - Nr. 4 Treppen ansehen.
  - Kap. 2 und Kap. 4 mit Lampe durchgehen (dafür gab es keinen Bildlauf).
- **`bewohnt.js`:** Jacken hängen flach und fast schwarz ohne Haken an der Wand (Schuppen, Posten, Pfarrhaus). Besser über eine Stuhllehne oder an einen Haken (Scan fehlt: Kleiderhaken).
- **Beutel Stufe 2/3:** Die Rucksäcke werden ohne Hände gezeigt. Wenn Hände gewünscht sind, gibt es die Formen über `griff_kastenVon`.
- **Kater:** Für echte Formen bräuchte es eine Trage-Pose, in der der Körper waagerecht liegt (Mocap).
