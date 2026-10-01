# Stand Raumklang (R-19, 01.10.2026)

Nutzerwunsch R-19: Jeder Ton kommt von seiner Quelle. Er ist dort am lautesten und wird mit dem Abstand leiser und entfernter (Telefonzelle, Beobachter im Busch). Vorbilder: RE2/RE7/Village, TLOU2, Alien: Isolation.

## System: `app/mods/raumklang.js`
Das Modul steht in ORDER direkt nach `klang` und ersetzt `Audio.at` und `Audio.play` der Basis. Aufrufe und Rückgaben bleiben gleich. Jede Quelle mit `x/y/z` oder `obj` durchläuft diese Kette:
Panner → Tiefpass (Luft + Verdeckung) → Pegel (Verdeckung) → Welt-Bus (Hall des Hörer-Raums), dazu der Hall des Quell-Raums, wenn es ein anderer Raum ist.

- **Entfernung:** inverse Kurve (≈ 1/r) je Typ `[Bezugsabstand, Abfall, Hörweite]`:
  - `leise` [1 m, 1,6, 30 m]: Rascheln, Stoff, Kleinkram
  - `normal` [2,5, 1, 120]
  - `laut` [6, 1, 300]: Telefon, Türknall, Rabenschrei
  - `sehr_laut` [15, .85, 800]: Glocke, Schuss
  - Ohne `typ` wird der Typ aus `ref` abgeleitet (≤1,6 leise, ≤4 normal, ≤10 laut, sonst sehr_laut).
- **Richtung:** HRTF für nahe (< 16 m) und `wichtig`e Quellen, höchstens 14 gleichzeitig, mit Hysterese 14/22 m. Sonst Equal-Power.
- **Luftdämpfung:** Tiefpass `20 kHz / (1 + (d/25)^1.3)`, also etwa 15 kHz bei 10 m, 7 kHz bei 40 m und 2,8 kHz bei 100 m.
- **Verdeckung:**
  - Die Strecke vom Hörer zur Quelle wird gegen die `colliders` geprüft, über ein Raster mit 6-m-Zellen.
  - Niedrige Boxen (< 1,1 m) zählen nicht. Offene Türen zählen auch nicht, weil sie bei −9999 liegen; das Raster trägt sie nach, sobald sie einmal geschlossen waren.
  - Gewicht je Box nach Breite und Höhe: Baumstamm ≈ 0,1, Tür ≈ 0,75, Wand/Auto 1, Kiste schwächer.
  - Eine Wand ergibt −12 dB und 600 Hz, jede weitere Wand −6 dB und halbiert den Tiefpass. Eine geschlossene Tür ergibt ≈ −9 dB und 1,4 kHz.
- **Beugung:** Ist der Weg zu, werden die Ecken der ersten Box vom Hörer und von der Quelle aus geprüft (je 4 Ecken, +0,4 m).
  - Ein freier Weg über eine Ecke gewinnt, wenn er leiser verliert. Dann kommt der Ton von der Ecke/Türkante, der Panner steht auf der verlängerten Weglänge, mit −2…−12 dB je nach Knickwinkel und dumpfer.
  - Damit „kommen Schritte um die Ecke“, und Ton fällt durch eine offene Tür herein.
- **Unter der Erde ↔ oben:** stumm, wie bisher.
- **Hall des Quell-Raums:** Liegt die Quelle in einem anderen Raum als Luke (Haus/draußen/Beton/Halle), geht zusätzlich ein Anteil in dessen Faltungshall. Der Anteil wächst mit der Entfernung bis zum 2,2-Fachen. Ein Haus klingt so nach Haus, auch wenn Luke draußen steht. Die Kiffen-/Stille-Blende von `Audio.world` gilt mit.
- **Bewegte Quellen:**
  - `obj` (Object3D oder Vektor, dazu `h` als Höhenversatz) folgt jedes Bild ohne Allokation.
  - Lange Klänge und Schleifen werden alle 0,1–0,18 s neu bewertet (Verdeckung, Luft, HRTF, Quell-Hall), höchstens 8 Auswertungen pro Bild.
  - Doppler nur mit `doppler: true`, über die Abspielrate, begrenzt auf ±40 m/s.
- **Stimmenbudget:**
  - 32 Einmal-Stimmen mit Vorrang (Pegel am Ohr × Verdeckung, `wichtig` ×3). Ist das Budget voll, weicht die leiseste mit 25-ms-Blende, statt hart abzubrechen.
  - Unhörbares wird gar nicht erst angelegt: unter −56 dB oder jenseits der Hörweite.
- **API:**
  - `Audio.at('name', obj | [x,y,z] | {x,y,z}, { typ, gain, h, loop, doppler, wichtig, … })` (Alias `Audio.quelle`) spielt räumlich.
  - Alte Form `Audio.at(x, y, z, ref, { obj, h, dauer, typ })` liefert den Panner als `dest`.
  - `Audio.play(name, { …, obj, typ, doppler, wichtig })`.
  - `Audio.setze(panner, x, y, z)` verschiebt eine Quelle; `Audio.frei(panner)` gibt Dauerquellen frei.
- **Helfer mit optionalem Ort** (ohne Ort wie früher = Luke selbst):
  - `slam(x,y,z)`, `knock(x,y,z)`, `creak(v,x,y,z)`, `intercomClick(x,y,z)`
  - `ring(v,x,y,z)`: Telefonzelle bei 8 / 1,9 / 7,6. `v` ist die Lautstärke an der Zelle und bleibt konstant. Unter .03 klingt das Freizeichen im Hörer.
  - `musicBox(x,y,z)`, `pianoNote(k,x,y,z)`, `tankHum(on,x,y,z)`
  - `engine` verschiebt per `setze`.
- **Fernseher Nr. 7:** Das Rauschen kommt aus dem Gerät. Die Basis regelt nur noch an/aus.
- **Testzugriff:** `window.__raumklang` (`probe(x,y,z)`, `stats()`, `seg`).

## Audit (alle Module + Basis)
Ich habe jeden Tonaufruf eingeordnet:
- (a) Welt-Quelle: räumlich, bewegt → `obj`
- (b) Luke/Oberfläche: Atem, Herz, eigene Schritte, Inventar, Papier in der Hand, Pickup/Quest, Freizeichen am Ohr, eigenes Handy
- (c) Musik, Stinger, Schreck-Akzent, Betten, Dröhnen (`hum`), Traum/Vision, Kino-Filmton

Rund 600 Stellen sind (a); davon waren die meisten schon verortet. Korrigiert:
- **Basis:**
  - Klopfen an Haustüren und bei Vegas; Keller-, Schrank-, Sicherungsraum- und Türknarren; Türknall Nr. 1/Nr. 7/Spinnenraum/Jagdtür.
  - Spieluhr 3× am Kasten; Küchenröhre zerspringt am Ort; Klavier; Tank; Funkgerät; Amt-Lautsprecher (`amt_box0`).
  - Schaukel und Telefonzelle 3×: die von Hand gerechnete Entfernungs-Lautstärke ist raus.
- **kapitel6:** Jäger-Ruf, Knurren und Stöhnen folgen ihm (`obj: J.p`).
- **neben6:** Waldgeräusche aus dem Rekorder.
- **lucy3:** Funkstimmen, Rauschen und Klicks kommen aus dem Funkkasten.
- **ausbau_nord:** Geisterbus-Motor per `setze` nachgeführt.
- **ausbau_ost_west:** Tankstellen-Schild ohne Hand-Entfernung.
- **neben3:** Kirchenbank unter Justin, Standuhr, Gitter.
- **neben4:** Günthers Feuerzeug, Weltkarten-Klappe.
- **neben5:** Zelle 2× konstant an der Zelle, Wohnzimmer-Telefon Nr. 7 auf der Anrichte, Brecheisen.
- **beobachter:** Rascheln `typ: 'leise'`.
- **whiskey:** Rufe, Mimik und Stimme folgen dem Raben (`obj` + Doppler).
- **katzen:** Schnurren folgt per `obj`/`frei`; die alte Panner-Nachführung ist raus.
- **lwo:** Kombi-Motor folgt per `obj`.
- **post:** Spieluhr war seit dem Umbau stumm (`musicBox(.25)`), jetzt am Radio; Feuerzeug; Autoschloss.
- **albers:** Vegas' Tür 4×.
- **weiss:** Schrank.
- **villa:**
  - Whiskey auf dem Kühlschrank; Klopfen von draußen an Nr. 3; Rascheln der Nachsorge; Neonröhren; Kompressor im Kühlraum (lief vorher überall).
  - Hallentür; Wolters Hand.
- **anwesen:** Presse; Klopfen und Spieluhr hinter der Tür.
- **hungrige:** Hufschlag an der aktuellen Position; Hirschding-Stöhnen und auffliegende Krähe folgen (`groan`/`flap` mit `obj`).
- **wald/tiefwald:** Der Schreckruf fliehender Rehe läuft mit (`deerBark(x, z, obj)`). `groan`, `deerBark` und `flap` nehmen in raumklang.js jetzt ein optionales `obj` als letzten Parameter.
- **schrecken:** Kapellentür; Villa-Fenster (Knarren + Spieluhr).
- **uebergang:** Westtür.
- **innen_ort:** Pendeluhr.
- **zimmer7:** Tür.
- **feuer:** Lautsprecher, Jagdtür 2×.
- **nr4:** Peters Stuhl.

## Kurz geprüft
- Geprüft wurden nur Syntax und Bau: alle Module bestehen die Syntaxprüfung, `node tools/assemble.js` baut fehlerfrei (78 Teile, `raumklang.js` nach `klang.js`).
- **Hörtest: vorbereitet, aber nicht gelaufen.** `_testgate.sh` war zum Zeitpunkt der Abgabe dicht: rund 20 Tests in der Warteschlange, ~330 MB RAM frei. Der Lauf kam später durch die Warteschlange, die Test-App endete aber ohne jede Ausgabe (kein `result.json`, keine WAV-Datei). Vermutlich ist sie bei dem Speichermangel abgestürzt; geprüft habe ich das nicht. Unter Last nicht wiederholt, bitte im Schluss-Test mitlaufen lassen.
  - Die Steps liegen im Scratchpad dieser Sitzung unter `rk/`: `mk.py` → `steps.json`, `run.sh`, `ana.py`.
  - Fünf Proben, aufgenommen als PCM-Stereo-WAV am Master (vor Kompressor; Betten/Musik stumm), jedes Ereignis mit Abstand, Winkel und `__raumklang.probe` (Verdeckung, Tiefpass, gebeugt ja/nein):
    1. Telefonzelle aus 40 m heran, dann einmal im Kreis (r 4 m) bei festem Blick
    2. Beobachter-Rascheln links hinten bei 3 und 12 m (`beob_rustle` über `__k6.ev`)
    3. Nr. 7: Rauschen im Wohnzimmer, Luke vor der Haustür, `door7` zu/auf/zu
    4. Amt: Schritte kommen den langen Gang herunter und durch die Türkante in den Spinnenraum (Luke abseits der Türachse)
    5. Überflug eines Raben (Proxy-Objekt, 10 m/s, 6 m hoch) mit `Audio.at('crow1', obj, { doppler: true })`
  - `python ana.py` gibt je Ereignis aus: Pegel L/R, Balance R−L, Spitze und Höhenanteil > 2 kHz.
  - Erwartung: 1/r-Abfall beim Heranlaufen; Balance wandert im Kreis; die Tür offen ist mehrere dB lauter und heller als zu; „gebeugt“, bevor die Schritte die Türkante erreichen; Balance kippt beim Überflug.

## Offen
- `klang_funk` kann noch kein `obj`. In lwo gibt es ohnehin nur feste Punkte.
- `Audio.tape` (Tonband im Keller, Kap. 1) läuft noch ohne Ort. `Audio.owl` ist in klang.js stumm.
- `Audio.hum` (UFO/Pfeiler-Dröhnen) bleibt bewusst ein Bereichsklang.
- Großer `ref` als Pegelersatz (Kapellenglocke `ref 34`, Wolfsheulen `ref 28`) bleibt so, weil die Pegel nicht verändert werden sollten.
- kapitel3 Z. 352: Ab 36 m klingelt das Telefon absichtlich direkt neben Luke (Horror-Regie).
- weiss Z. 468: Ob das Atmen wirklich „hinter“ Luke liegt (Yaw-Konvention), ist ungeprüft.
- Die Position des Wohnzimmer-Telefons in Nr. 7 (neben5) und des Kompressors in der Villa ist geschätzt; es gibt dafür kein Modell.
- Stimmen (`stimmen.js`, Sprecher-Agent): Sie nutzen `Audio.at` und bekommen Verdeckung und Hall damit automatisch. Bewegte Sprecher bitte über `{ obj, dauer }` + `Audio.frei` anbinden. Der eigene „trocken“-Panner dort bleibt unverändert.
