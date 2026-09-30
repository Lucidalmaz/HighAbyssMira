# Bildsprache von High Abyss Mira (verbindlich für Welt, Licht, Requisiten, Kino)

Stand 01.10.2026 (AP Welt/Licht, Prioritäten 6–8 des Premium-Auftrags). Grundlage ist der vorhandene Ton des Spiels: Dauerregen, Natriumlaternen gegen Mond und Nebel, Kreide, Laternen, Auge und ∴.

## 1. Zwei Lichtfarben, ein Konflikt
- **Natriumgelb** (≈ 0xff9f4c) steht für alles Menschliche, Nahe und Warme: Laternen, Glühbirnen, Kerzen und Stehlampen.
- **Kaltblau** (Mond, Nebel, Fernseher, Nachtlicht) steht für das Fremde und Ferne.
- **Grünstichiges Röhrenweiß** gibt es nur im Amt und in Behördenräumen, **reines Weiß** nur für „das Weiße“, das Lichtschiff und den Beobachter.
- Keine weiteren Lichtfarben ohne erzählerischen Grund.

## 2. Kein Licht ohne Quelle
- Jede helle Stelle hat eine sichtbare Ursache: eine Leuchte, ein Fenster mit Laternenschein, einen Fernseher, eine Kerze oder ein Notlicht.
- Aufhellung (Fülllicht) wirkt nur als Streulicht einer brennenden Quelle im Raum. Das sind die Hemisphäre über `LICHT_HAKEN` und keine neuen Lichter.
- Geht die Quelle aus, wird es dunkel (Stromausfall, tote Röhre).
- Innenräume sind nachts ohne Taschenlampe als Räume lesbar (Umrisse, Türen, Möbel), aber nicht ausgeleuchtet.
- Tagsüber (Kap. 4) sind Innenräume so hell wie ein Raum mit Fenstern an einem nebligen Morgen.

## 3. Alles draußen ist nass
- Asphalt und Gehweg sind feucht.
- Laternen spiegeln sich als lange, weiche Natriumstreifen zwischen Laternenfuß und Betrachter, in Pfützen schärfer und mit Regenringen.
- Glanz entsteht nur dort, wo Wasser, Glas oder Metall ist.
- Dachrinnen laufen über und tropfen, Fallrohre plätschern.

## 4. Nebel liegt, er steht nicht
- Bodennebel liegt in Schichten unter Hüfthöhe und nimmt den Laternenschein auf.
- Er hat weiche Ränder und darf nie als Wand oder als hartes Band am Horizont erscheinen.
- In der Ferne verschluckt er die Welt, nah bleibt er durchsichtig.

## 5. Material: alt, benutzt, feucht
- Es werden nur Scan-Oberflächen und Scan-Modelle verwendet (Fab/Megascans).
- Nichts ist neu: Farbe blättert, Holz ist vergraut, Metall rostet, Papier ist gewellt.
- Schmutz hat eine Ursache: Wasserläufe unter Fensterbänken, Spritzwasser am Sockel, Laub im Rinnstein vor Kanaldeckeln, Fettfilm über dem Herd.

## 6. Wiederkehrende Motive sparsam setzen
- Diese Motive dürfen wiederkehren:
  - Auge
  - ∴
  - weiße Kinderkreide
  - Laterne/Martinslaterne
  - Strichlisten in Fünfergruppen
  - die Zahl 17 und ihr Takt
  - Raben
- Sie stehen nur an erzählerischen Orten, nie als Muster und nie zweimal gleich im selben Blickfeld (siehe `F3_extras.md` X-7).

## 7. Die Umgebung bewegt sich leise
- Vegetation bewegt sich im Wind, Motten fliegen als weiche Punkte unruhig um die Laternen, Tropfen fallen, Vorhänge bewegen sich.
- Flackern gibt es nur mit einer Ursache: defekte Röhre, Kerze, Wackelkontakt oder Lichtschiff.
- Keine Bewegung wiederholt sich sichtbar im Takt.

## 8. Farbkomposition und Belichtung
- Schatten ziehen leicht ins Kalt-Blaue, Lichter ins Bernsteinfarbene; die Sättigung ist gedämpft (Filmpass in der Basis).
- Die Belichtung ist nachts einheitlich (1,3 × Helligkeitsregler) und bei Tag 1,1.
- Blackout (Schreck) ist die einzige harte Abweichung.
- Tag (Kap. 4) wirkt grau-kühl mit Nebel. Die Wärme kommt dann nur aus Lampen im Innern.

## Technik (wo die Regeln wohnen)

| Regel | Umsetzung |
|---|---|
| Natriumfarbe, Lampenpool | `lamp()` / `lampPool` in `_base_source_index.html` |
| Grading | `filmPass` in `_base_source_index.html` |
| Nebelränder | `fogMat` in `_base_source_index.html` |
| Nasse Straße, Laternenstreifen | `gStreak` in `gruen.js` (Uniform `fogUniforms.lamps`, dieselben zehn Laternen wie der Nebelschein) |
| Fülllicht mit Quelle | `LICHT_HAKEN` in der Basis; genutzt von `innen_ort.js` (Nr. 7/Nr. 1), `innen_kapitel.js` (Amt) und `villa.js` (Tageslicht Kap. 4) |
| Tropfen | `fassaden_tropfen` in `fassaden.js` |
| Motten | `leben_mothSetup` in `leben.js` |
| Laub im Rinnstein | `strasse.js` |
