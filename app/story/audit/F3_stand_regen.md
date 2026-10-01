# Stand Regen (R-24) – 01.10.2026

Modul `app/mods/regen.js` (in ORDER nach `fassaden`). Ersetzt den CPU-Nieselregen der Basis (`rain.m` zeigt jetzt auf das neue Netz, `rain.N = 0`; Schalter anderer Module – `visible`, `material.opacity` als Schauer aus leben.js, `scale` im Traum – wirken weiter).

- Schlieren: 10 000 Tropfen (nah/fern) in einem Zeichenaufruf, Lage nur aus der Zeit im Shader, Wind wie Laub (`WIND`), Bewegungsunschärfe relativ zur Kamera, sichtbar nur im Licht (Laternen, Taschenlampe, Hauch Mond).
- Verdeckung: Höhenkarte 64 × 64 × 0,5 m um Luke (BVH-Strahlen auf `SOL`, ≤ 0,2 ms je Bild). Unter Dach/Vordach/Auto nichts, unter Kronen nur durchfallend. Drinnen (Ortshäuser) regnet es nur vor dem Fenster (`indoorRect`).
- Aufschläge: 1400 Kronen + Ringe je Belag (Karte kennt Asphalt, Pfütze, Blech, Holz, Laub …).
- Ton: Schichten je Oberfläche um den Hörer (`amb_regen`, `amb_wald`, `amb_regen_tropf`, `amb_regen_veranda` (neu), `amb_dach`, `amb_rinne`, `amb_regen_innen`) mit Stereorichtung über den Bettbus von klang.js; klang.js fragt `regen_bett(n)` und spielt diese Betten nicht mehr selbst. Neue Dateien: `game/audio/amb_regen_tropf.ogg`, `amb_regen_veranda.ogg` (Bau: `python app/tools/klang_bau2.py regen`).
- Linse: nur beim Blick nach oben in den offenen Regen vereinzelte Tropfen am Bildrand (DOM, kein Render-Durchgang).
- Testzugriff: `window.__regen` – `stats()`, `ab(true)` = alter CPU-Regen zum Vergleich, `zelle(x, z)`.

## Prüfung (2 Spielläufe, Testtor)

Keine Konsolenfehler/-warnungen. Regen sichtbar (Schlieren im Laternen-/Lampenlicht, Kronen auf der Straße), hörbar (`amb_regen` 0,81–0,84 mit Richtung, `amb_regen_tropf` 0,08–0,09; drinnen Nr. 7 nur `amb_regen_innen` 0,5), Linse 3 von 4 Tropfen beim Blick nach oben, in Nr. 7 Zelle über Luke = Dach.

FPS neu vs. alter CPU-Regen (gleiche Stelle, nacheinander): Ortstafel 45,6 / 42,4 · Kreuzung 38,9 / 40,3 und 36,7–37,6 / 36,4–32,2 · Lampe an 38,9 / 30,2 · Nr. 7 innen 54,4–52,0 / 53,1. Regen-Takt (CPU) 0,01–0,05 ms stehend, 0,35–0,5 ms kurz nach einem Teleport (Karte füllt sich). Ziel „höchstens ~5 % schlechter“ erfüllt – meist gleich oder besser.

## Offen

- Die Regenringe in Pfützen (gruen.js) und die Dachrinnen-Tropfen (fassaden.js) bleiben eigene Systeme; regen.js koppelt nur die Tropfenhelligkeit ans Licht.
- `remise` und `raender` stehen in ORDER, die Dateien fehlen im Repo (assemble überspringt sie) – war schon vorher so.
