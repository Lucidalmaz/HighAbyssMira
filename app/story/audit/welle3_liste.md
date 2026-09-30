# Welle 3 – Sammelliste (Stand 30.09.2026, aus den Abnahmen der Welle 2)

Alles hier ist **nach** Welle 2 zu erledigen, vor dem finalen Bau. Ergänzt die Punkte aus `produktion_welle2.md` §3 (Ränder) und dem Audit (Leistung, Größe, Regression, Credits).

## Optik (Master-Prompt: nichts schwebt, jedes Licht mit Quelle, Realismus)
- [ ] **Wald: schwebende Laub-/Moosflächen.** Auf Kapitel-6-Screenshots (`_p11_b/morph.png`, `oben.png`) hängen helle, flache Laub-/Moos-Scans (`w_leaves`, `w_leftleaves`, `w_mosspatch`) sichtbar über dem unebenen Boden und wirken als blasse Scheiben. `waldleben.js` `wl_scatter`: an die Bodenhöhe je Ecke anschmiegen (Neigung aus dem Gelände), tiefer setzen, dunkler tönen, an Hängen weglassen.
- [ ] **Morgenstimmung** für Kapitel 4 (07:40–09:30) und die Morgengrauen-Szenen K3A/K3B/K5: Himmel-Shader, `hemi`/`moon`, Umgebungs-Map, Regen zentral in der Basis umschaltbar machen (`leben_uhr` liefert die Zeit). Heute: Nacht mit Mond.
- [ ] Kapitel 4: Gully führt noch in die Kanalstadt (Basis) – ab Kap. 4 sperren („Rauch. Da geht keiner runter.“).
- [ ] Zimmer 7: blauer Lichtfleck an der Wand, Lichtspalt über der Tür (P4 bessert nach – prüfen).
- [ ] Feuer: `hgt`-Streuung .72–1.1 (P5 erledigt – prüfen), FPS im brennenden Gang messen (F3).
- [ ] Gitter an der Nordzaun-Lücke: prüfen, dass wirklich `ironfence_ms` und nicht die Betonleitwand sichtbar ist (`_p11_b/aufbiegen.png` zeigt unten eine helle Betonkante), Schild „FORSTBE…“ nicht abgeschnitten.
- [ ] K1: Untertitel/Gedanken aus `gedanken.js` vor Kinosequenzen ausblenden (P1 macht es in `kino_play`; prüfen).

## Figuren / Assets (nur Fab/Megascans, Namensnennung in CREDITS.md)
- [ ] Figur **Frau Reuter** (Nachhall Nr. 5; heute `aydin` als Stellvertreterin).
- [ ] Posen „Brille abnehmen“, „am Küchentisch schreiben“ – aus vorhandenen Motion-Packs prüfen, sonst idle/look.
- [ ] **Tischleuchte** (Zimmer 7; heute verkleinerte `floorlamp`), **verkohlte Holzkugeln** (Losurne), **Nadeldrucker** (Archiv), **Kinderdecke** (Zayns Hütte).
- [ ] Peters Zelle: Foto Oma Erna (Kanon) – Rahmen-Scan mit Canvas-Foto.

## Technik / Schnittstellen
- [ ] `spannung.js`: offizielle Schnittstelle für externe Stille-Zonen (`SP.zonen`); `kapitel6.js` überschreibt heute `SP.silent` nach dessen Tick.
- [ ] `kapEnde(3)` wird von P7 nach den Endkarten aufgerufen – prüfen, dass es genau einmal geschieht.
- [ ] Beobachter: `d_zugesehen` erst nach `hungrige_S.epilog` (P10 erledigt – prüfen).
- [ ] Testharness: hängende Selbsttest-Instanzen ohne Renderer automatisch beenden (`_testgate.sh` zählt heute alle; Alter > 60 min ignorieren).

## Leistung / Größe / Abnahme (aus dem Audit, unverändert)
- [ ] Kein Bild über 16,7 ms: Kirche, Villa, Hof, Schrebergärten; Kapitel-5-Orte (Nr. 1, Friedhof mit allen Figuren), Raum 3, tiefer Wald, Finale am Bau.
- [ ] Ladezeit < 20 s bis zum Menü; Kapitel nachladen.
- [ ] Größe 2,2–2,6 GB: `npm run ktx` für w_*/beobachter/ue, `release_check`, ungenutzte Assets raus.
- [ ] Credits-Szene im Spiel (alle Fab-Autoren).
- [ ] Kompletter Durchlauf Kapitel 1 → 6 im Testprofil, Spoiler-, Zeit- und Text-Scan (§4 produktion_welle2.md).
- [ ] Ränder (`raender.js`, W3-P12) erst nach Abnahme von P0/P3/P4/P6/P7/P9/P11.
