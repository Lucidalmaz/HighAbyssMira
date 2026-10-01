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

## Geprüft (ein Selbsttest-Lauf, `--root=../game`, 5 Orte: Tür Nr. 7, Halsband, Zettel am Kühlschrank, Glanz am Hydranten, Whiskey mit Schlüssel)
- Die Umrandung erscheint je Kategorie in der richtigen Farbe:
  - Tür: blau
  - Halsband: grün
  - Zettel: violett
  - Ortstafel: violett
  - Polaroid: rosa
- Mittlere Distanz ist dezent, das angesehene Objekt deutlich.
- Verdecktes wird nicht umrandet: Der Tiefentest funktioniert, und `depthTexture` wird von `grafik.js` mitbenutzt.
- Fibel-Eintrag „Ränder“ und Lukes Satz erscheinen beim ersten Sichten.
- Bei der Einstellung „aus“ und im Dialog bleibt nichts sichtbar.
- Am Boden ist der Schlüssel jetzt sichtbar, nachdem er auf die sichtbare Oberfläche gehoben wurde; die Glitzerpunkte blitzen.
- Danach umgebaut, nur Syntax/Build geprüft (Testwarteschlange voll):
  - Anheben über die Nahlisten statt Strahl durch die ganze Szene, wegen Taktspitzen bis 25 ms beim Teleport.
  - Glanz am Boden größer (9 cm).
  - Whiskeys Schlüssel an der gemessenen Schnabelspitze im Kopfknochen-Raum. Vorher schwebte der Funke ca. 16 cm über dem Kopf – vermutlich genau der „wirkt wie ein Fehler“-Eindruck.

## Im Schlusstest prüfen
1. **Whiskey, Station „auto“ (Kap. 1, Start):** Der Messingschlüssel liegt quer im Schnabel und folgt dem Kopf, er schwebt nicht. Er blitzt beim Seitwärtsgehen auf, hat einen bernsteinfarbenen Rand in Reichweite, und der Rabe selbst ist nicht umrandet.
2. **Glanz am Boden (z. B. `k1_hydrant` 13.2/−5.1, `k1_strasse` −68.4/3.3):**
   - Der Schlüssel liegt auf der sichtbaren Oberfläche, nicht darunter und nicht auf einem Objekt darüber.
   - Glitzern und Schein sind erkennbar; aufheben → kristalliner Doppelton (Spieluhr) + leises Klimpern.
3. **Tür Nr. 7, Kühlschrankzettel, Halsband, Polaroid:**
   - Farben: blau/violett/grün/rosa.
   - Nah wirkt der Rand weich (Aura), nicht wie eine harte Linie; mittlere Distanz nur ein Hauch.
   - Verdeckte Objekte (Wand dazwischen) leuchten nicht.
4. **Abschaltung:** Einstellungen → „Objekt-Hervorhebung“ stark/dezent/aus wirkt sofort. In Jagd, Kino und Dialog ist der Rand aus.
5. **Leistung:**
   - `__hl.HL.ms` (gleitendes Maximum der Taktzeit) nach dem Einlaufen ≤ ca. 1 ms.
   - Kantenpass nur aktiv, wenn `__hl.HL.aktiv > 0`.
   - FPS-Vergleich mit „aus“.

## Offen / Bitten
- **Fehlende Assets:** Scans für Münzen, Kronkorken, Ringe und Knöpfe. Bis dahin ist jeder Glanz-Fund der Fab-Schlüssel (Messing). Der Text beim Aufheben nennt den echten Gegenstand.
- Die Text-Regeln zur Kategorie greifen nicht überall. Kapitel-Module können `mesh.userData.hl = 'sammel' | 'hinweis' | …` setzen, ein abweichendes sichtbares Objekt über `userData.hlObj`.
- `album.js` („Fotoalbum“ in der Welt) wird derzeit als Hinweis eingeordnet. Eine Zeile reicht für Sammlung: `S.weltHit.userData.hl = 'sammlung'`.
- Testdatei `game/index_hl.html` (aus einem früheren Zwischenstand-Commit) entfernt – war nur meine Testkopie.
- Performance-Gesamtmessung übernimmt der Hauptagent. Der Kantenpass läuft nur, wenn etwas aktiv ist; die Maske nur mit den Kandidaten in halber Auflösung.
