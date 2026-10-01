# Stand Hervorhebung R-1/R-2 (01.10.2026)

## Gebaut
- **Neues Modul `app/mods/hervorhebung.js`** (in ORDER nach `grafik`/`oberflaeche`). An der Basis wurde nichts geändert: Das Modul liest `IA.list`, `target`, `interactables` und `composer` direkt.
- **R-1 Umrandung**
  - Masken-Pass direkt nach dem RenderPass. Er zeichnet die Silhouetten der Kandidaten in einen halb aufgelösten Puffer, und zwar Kategorie-Farbe × Stärke.
  - Verdeckte Teile verwirft er per Vergleich mit der Szenentiefe. Dazu dient `depthTexture` an beiden Composer-Puffern, dieselbe Lösung wie in `grafik.js`.
  - Kantenpass nach dem OutputPass mit drei Abtastringen. Er erzeugt eine weiche Aura außen, nur einen Hauch Rand innen und Schimmer aus zwei Rauschlagen plus aufsteigende feine Funken.
  - Eine leichte Pulsierung kommt pro Objekt dazu.
  - Kategorien und Farben:
    - Interaktion: Mondblau `#7fb2ff`
    - Sammelobjekt: Jadegrün `#69f0c0`
    - Hinweis/Notiz: Violett `#b38bff`
    - Glanz/Tausch: Bernstein `#ffcf6b`
    - Sammlungen (Polaroids, Stundenbuch, Laternenbote, Pells Heft): Perlrosa `#ff8ccf`
  - Kandidaten: 5× je Sekunde werden die 6 nächsten innerhalb von 8 m gewählt, dazu das angesehene Objekt (Fadenkreuz bzw. Blick < 6 m). Es gibt 10 Plätze mit weichem Ein- und Ausblenden.
  - Stärke:
    - angesehen: 1,0
    - in Reichweite/im Blick: 0,72
    - mittlere Distanz: 0,2, fällt bis 8 m auf 0
  - Aus bei:
    - Jagd (`SP.chase`)
    - Kino (`kino_S.on`)
    - Dialog (`state.talking`)
    - Menüs, Pause, `scripted`, `camOverride`, Blackout
  - Sichtbares Objekt:
    - Ist das Klickobjekt selbst sichtbar, wird es verwendet.
    - Bei einer unsichtbaren Klickfläche werden die Modelle verwendet, deren Mitte darin liegt. Sie kommen aus einer Nahliste, die verteilt über mehrere Bilder entsteht: höchstens 500 Knoten je Bild, 14 m um Luke.
    - Figuren (Skinned) werden nie umrandet.
  - Kategorie: Explizit über `userData.hl`, sonst aus dem Text. Text-Regeln stehen in `HL_TEXT`; Namen aus ITEMS gelten als Sammelobjekt.
  - Getaggt sind:
    - `sammeln_platz` (umhüllt) → Sammlung
    - Tausch-Funde → Glanz
    - Whiskeys Schnabel → Glanz, nur solange er etwas trägt; der Rabe selbst wird nie umrandet
- **Einstellungen:** „Objekt-Hervorhebung: stark / dezent / aus“ (`settings.hl` 2/1/0, Standard: stark).
- **Legende:**
  - Beim ersten Sichten sagt Luke: „Da liegt ein Schimmer drum. Als wollte es gefunden werden.“
  - Danach erscheint der Hinweis „Neu in der Fibel: Ränder“.
  - Der Fibel-Eintrag „Ränder“ (Lore-Key `hervorhebung`) zeigt farbige Punkte und Lukes Erklärung.
- **R-2 Glanz**
  - `glanz_neu()` setzt ein echtes Modell ein: Fab „OldKey“ (`assets/ue/schluesselteil`). Es ist polierter Messing (metalness 1, roughness 0,2) mit Umgebungsbild aus Nachthimmel, Natriumlaternen am Horizont und Mond; daraus kommt ein scharfes Glanzlicht auch ohne Lampe.
  - Dazu kommen zwei weiche, runde Glitzerpunkte. Sie blitzen auf, wenn der Blickwinkel über die Fläche streicht (Bewegung, Drehung des Kopfes), plus seltenes Funkeln.
  - Ein leiser Schein liegt darum; im Lampenkegel wird alles stärker.
  - Am Boden wird der Gegenstand einmalig auf die sichtbare Oberfläche gehoben (`glanz_boden`), weil die Fundorte teils auf dem Kollisionsboden unter Gehweg/Laub lagen.
  - `tausch.js`: Der Lichtfunke ist jetzt weich und rund statt eines Kreuzes.
  - Fundklang `glanz_klang()`: zwei hohe Spieluhr-Zungen (VSCO-2-Aufnahmen `kb_spieluhr_A6/E6`, Hochpass), dazu ein leises Schlüsselklimpern; kein Oszillator.
  - `whiskey.js`: Der Schlüssel liegt quer im Schnabel und pendelt mit dem Kopf; der alte Sprite ist nur noch Rückfall.

## Geprüft (ein Lauf, 5 Orte: Tür Nr. 7, Halsband, Zettel am Kühlschrank, Glanz am Hydranten, Whiskey mit Schlüssel)
- Umrandung erscheint je Kategorie in der richtigen Farbe:
  - Tür: blau
  - Halsband: grün
  - Zettel: violett
  - Ortstafel: violett
  - Polaroid: rosa
- Mittlere Distanz ist dezent, das angesehene Objekt deutlich.
- Fibel-Eintrag und Lukes Satz erscheinen beim ersten Sichten.
- Bei „aus“ und im Dialog sind 0 Kandidaten aktiv.
- Die Taktkosten (gleitendes Maximum) fallen nach dem Einlaufen auf ca. 1–2 ms. Die Spitzen am Anfang entstehen durch das erste Berechnen der Bounding-Spheres.
- Ergebnis des Laufs: siehe Abschnitt unten.

## Offen / Bitten
- **Fehlende Assets:** Scans für Münzen, Kronkorken, Ringe und Knöpfe. Bis dahin ist jeder Glanz-Fund der Fab-Schlüssel (Messing). Der Text beim Aufheben nennt den echten Gegenstand.
- Die Text-Regeln zur Kategorie greifen nicht überall. Kapitel-Module können `mesh.userData.hl = 'sammel' | 'hinweis' | …` setzen, ein abweichendes sichtbares Objekt über `userData.hlObj`.
- `album.js` („Fotoalbum“ in der Welt) wird derzeit als Hinweis eingeordnet. Eine Zeile reicht für Sammlung: `S.weltHit.userData.hl = 'sammlung'`.
- Performance-Gesamtmessung übernimmt der Hauptagent. Der Kantenpass läuft nur, wenn etwas aktiv ist; die Maske nur mit den Kandidaten in halber Auflösung.
