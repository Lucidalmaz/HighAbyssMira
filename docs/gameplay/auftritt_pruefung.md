# Prüfprotokoll: Auftritt und Abgang (08.10.2026)

Stand: Code fertig, Syntax und Bau (`node tools/assemble.js`) geprüft. Spieltest NOCH NICHT gelaufen (Testsperre war auf Anweisung freizugeben, Performance-Update hat Vorrang). Testskripte liegen bereit: `C:\Users\GIGABYTE\_auf_steps.json` (Boot, Anmeldeliste, Whiskey) und `_auf_steps2.json` (Krähenschwarm, Fledermaus, Katze, Beobachter, Graukind, Lichtschiff, Bericht). Aufruf: `bash _run_locked.sh _auf_steps2.json _auf_o2`. Die Schritte protokollieren pro Bild Sichtbarkeit, Deckkraft, Position und "im Bild"; Fehler = `bad:true` (Sichtbarkeit schaltet bei Deckkraft > 0,1 im Bild, oder Positionssprung im Bild). Zusätzlich `__auf.report()` (Zähler pop, jump, flick).

## Hilfsbaustein `app/mods/auftritt.js` (in ORDER vor `leistung`)
- `auftritt_reg(g, {name, ein, aus, r, nebel})`: macht `g.visible` weich. Im Bild (Blickfeld plus Rand, vor der Nebelgrenze) wird ein-/ausgeblendet (Dither-Fade per alphaHash auf eigenen Materialkopien, kein Z-/Sortierflackern, Schatten faden mit). Außerhalb des Bildes schaltet es sofort. Durchsichtige und eigene Shader-Materialien (Geister, Glanz) bleiben unberührt. Im Kino-Schnitt (`kino_S.on`) sofort.
- Sprung-Wächter: Positionssprung einer sichtbaren Gruppe wird gezählt; am neuen Ort wird neu eingeblendet.
- `auftritt_fernpunkt(x,y,z,{min,hoch,r})`: Anflugpunkt außer Sicht (hinter dem Spieler oder jenseits der Nebelgrenze, von oben).
- `auftritt_abgangsziel(x,y,z)`: Abflugziel hinter der Nebelgrenze.
- `auftritt_wenn_weg(g, fn)`, `auftritt_weg`, `auftritt_neu`, `auftritt_imBild`, `auftritt_nebel`.
- `auftritt_ufo()`: lässt das Lichtschiff aus der Ferne einblenden (3 s, Kuh-Auftakt 1,2 s) und ausblenden; hebt `camera.far` nur an, solange es weiter als 110 m ist.

## Inventar (angemeldete oder angepasste Wesen)
Whiskey, Krähen (8 Mast, 14 Streu), Krähenschwarm (9), Ratten (21), Fledermäuse (Basis 4, leben 8), Fuchs, Hirsch, Wolf, Schwein, Wald-Tiere (alle über `leben_beast`), Katzen, Hirschding, Hofer, geschälter Wolf, Beobachter (2 Ladepfade), Spinnen-Helden (14), lwo-Figuren und Kombi, alle eingekörperten Figuren (`figuren_embody`), Graukind (stalker), Beobachter-Statue (watcher), Kichernde (grey), Frau im Nachthemd (victim), Justin, Lichtschiff, Naturschreck-Spinne. Bewusst nicht angefasst: Peter/Zombie (anderer Agent), Kino-Szenen (eigene Schnitte), Nachbild-Geister (steuern Deckkraft selbst), Lichtsäulen (Visionen, faden bereits), Kuh.

## Fehler vorher und Fix
| Wesen | Fehler vorher | Fix |
|---|---|---|
| Rabe Whiskey | Abflug: nach 18-35 m mitten im Bild entfernt (Nebel lässt dort noch 40-65 % durch); Anflug: erschien 14 m über dem Ziel im Bild; Landung mit 25 % Restgeschwindigkeit, Start mit Ruck | Abflug zum Ziel hinter der Nebelgrenze; Anflug von außerhalb des Bildes (`auftritt_fernpunkt`) mit Blickrichtung zum Ziel; weite Flüge zügiger; Anlauf glatt und Auslauf bis Stillstand; Glanz im Schnabel blendet mit; weicher Fade falls doch im Bild |
| Krähen | Anflug aus 42 m (noch sichtbar), Abflug-Entfernen bei 42 m Höhe | Anflug aus 62 m (Landedauer 7-9 s), weicher Fade |
| Krähenschwarm | stand starr im Baum, bis die Verzögerung ablief | sichtbar erst beim Abflug, weiche Einblendung |
| Fledermaus (Basis) | Sturzflug aus bis 60 m: Sprung quer durchs Bild; Auftauchen beim Verlassen von Gebäuden | nur Fledermaus in 28 m Reichweite; weicher Fade |
| Kleine Tiere (Ratten, Krähen, Katzen) | Auslese der Leistungsschicht blendete bei 28 m aus (Nebel lässt dort 36 % durch) | Mindestweite 48 m (`RIGS`-Weite in Basis und `leistung.js`), weicher Fade |
| Katzen | `katzen_hide` setzte sofort auf y = -500 (Sprung im Bild) | erst nach dem Ausblenden wegsetzen, weicher Fade |
| Lichtschiff | Start sofort im Himmel, Ferne-Ebene 110 m schnitt den Rumpf ab ("klappte" ins Bild); Kuh-Auftakt: Wegsetzen nach 16 s sichtbar | Einblenden/Ausblenden, Ferne-Ebene dynamisch, Wegsetzen erst nach dem Ausblenden |
| Spinne (Naturschreck) | erschien an der Decke ohne Übergang, an der Wand/nach 1,6 s sofort entfernt | taucht aus dem Deckenspalt auf (0,45 s), verschwindet verkleinernd im Spalt bzw. im Dunkeln |
| Figuren, Graukind, Beobachter, Hirschding, Spinnen, lwo | Sichtbarkeit schaltete hart im Bild | weicher Fade (0,25-0,7 s je nach Wesen, kurz bei Schreckern) |

## Offen
- Spieltest steht aus (siehe oben). Risiko: Materialkopien benutzerdefinierter Shader (Haut, Beobachter) und `flicker`-Mechanik des Beobachters (Fade verlängert das Verschwinden auf 0,25 s). Bei Darstellungsfehler einer Figur: `auftritt_reg(..., { off: true })` schaltet den Fade für sie ab.
- Kino-Rabe und Kino-Figuren, Kuh-Fall und Nachbild-Geister nicht geändert.
