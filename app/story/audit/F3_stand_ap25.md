# Stand AP-25 · Fäden über mehrere Kapitel – 01.10.2026

Konsistenz- und Lückenprüfung (grep/Code-Lesen), Lücken minimal geschlossen. Neu in `sammeln.js`: Fäden mit mehreren Schlüsseln stehen in der Fibel als **ein Eintrag mit Abschnitten** (Bibel K9). Titel und Text stammen vom neuesten Abschnitt, darunter stehen die früheren als „Kap. N · „Titel“: …“. Der Zustand richtet sich nach dem neuesten Abschnitt. Startet ein späterer Abschnitt, meldet er „FORTSETZUNG“ statt „NEUE NEBENAUFGABE“. Das betrifft nur die Anzeige; Schlüssel, Zustände und Spielstände der Module bleiben gleich. Nachträge ohne eigene Aufgabe gehen über `sammeln_fadenNachtrag(key, kap, text)`.

| Faden | Kapitel | Module / Schlüssel | Status | Was behoben wurde |
|---|---|---|---|---|
| „Das Schlimmste am Rechthaben“ | 1, 3, 4 (5 ohne Beleg) | albers.js `albers_spinn` | läuft, abschließbar | Gesagtes und Belegtes (`albers_S.talked`/`confirmed`) werden jetzt gespeichert (`MOD_SAVE 'albers_faden'`); vorher wiederholte Vegas sich nach dem Laden, Kap.-1-Häkchen gingen verloren und „VEGAS HATTE RECHT“ kam doppelt. **V-04** (Whiskeys Taufe) zählt jetzt; vorher war die Aufgabe nie abschließbar (12/13). Häkchen werden auch außerhalb der Kap.-3-Straße gesetzt (Kap. 4: Sumpfgas, Ring) über `albers_fadenTick`. Die Beschreibung trägt das Warum („Vegas hat immer recht, das ist das Schlimme.“) und zeigt eine Zeile je Behauptung. |
| „Wo Erwachsene nicht hinsehen“ | 1, 2, 3, 4, 6 | akte.js `akte`, amt.js `umschlag7` | läuft, abschließbar | Durchschlag 7 („Akte 08“, Kap. 2 ungeöffnet eingesteckt) ging verloren. Jetzt öffnet Luke ab Kap. 3 den Umschlag beim nächsten gelesenen Durchschlag (Gedanke, dann `akte_lesen(7)`). |
| „Der Neunte“ | 1–6 | beobachter.js `beobachter` | in Ordnung | – (Zettel in jedem Kapitel; ladefest; endet mit der Murmel) |
| „Das Heft im Heu“ | 1, 3, 5 | ausbau_ost_west.js `ow_heft` | läuft | Seiten 2–3 (Schuppen, Tor) liegen ab **Kap. 3** (vorher erst Kap. 5, Bibel 1591); das Heft im Stall weiterhin ab Kap. 5. Fortschritt wird jetzt gespeichert (`MOD_SAVE 'ow_heft'`); vorher fehlten die Seiten nach dem Laden und der Faden begann neu. Die Beschreibung erklärt, warum das Heft noch fehlt, und wird nach „erledigt“ nicht mehr überschrieben. |
| „Siebzehn Näpfe“ | 1, 3, 4, 5 | kirchberg/neben3 `kb_naepfe` → neben4 `k4_naepfe`, kapitel5 (Gisela) | ein Eintrag | Im Fibel-Faden zusammengelegt; vorher standen zwei Einträge mit gleichem Titel. Der Kap.-3-Abschnitt schließt jetzt bei Giselas Schlüssel; vorher blieb er bis zum Spielende offen. Der Kap.-5-Abschnitt (Hänschen, Riemen) kommt über `sammeln_fadenNachtrag` in kapitel5.js dazu. |
| „Unzustellbar“ → „Der gelbe Kasten“ | 4, 5 | neben4 `k4_post` → `k5_kasten` (neben5) | ein Eintrag | Im Fibel-Faden zusammengelegt. Weg c: Weiterspielen in Kap. 5 setzte den Text von `k5_kasten` zurück; jetzt startet die Aufgabe nur noch, solange sie verborgen ist (`neben4_kap5`). |
| „Hast du dich an mich erinnert?“ | 3, 6 | neben3/zayn.js `zayn` | in Ordnung (ein Schlüssel) | – (bleibt von Kap. 3 bis 6 aktiv; offen siehe unten) |
| „Eine für sieben“ | (1, 2) 3, 6 | neben3/cleo.js `cleo` | in Ordnung (ein Schlüssel) | – |
| „Rot eingekreist“ → „Aus aller Welt“ | 3, 4 | albers/neben3 `k3_rot` → neben4 `k4_welt` | ein Eintrag | Im Fibel-Faden zusammengelegt. Der Kaugummipapier-Hinweis nach dem Ordner erschien nie (`neben3_desc` greift bei erledigten Aufgaben nicht); er wird jetzt direkt gesetzt. |
| „Sind sie wieder da?“ → „Ja.“ → „Ein Dorf näher“ | 1, 3, 5 | kirchberg/post `k1_karten` → neben3 `k3_ja` → neben5 `k5_heidi` | ein Eintrag | Im Fibel-Faden zusammengelegt. Ein in Kap. 1 liegengebliebener Abschnitt hält den Faden nicht mehr offen. |
| Stundenbuch SB-01…12 | 1–6 | sammeln.js + Kapitelmodule | vollständig | – (jede Seite hat einen Fundort) |
| Laternenbote Z-01…11 | 1–4, 6 | sammeln.js + Kapitelmodule | vollständig | Meldung „Hanf in Kleingarten – Besitzerin verschwunden (hw)“ steht als Kurzmeldung in Z-08 (Feld `meldung`, Roxys Laube, X-6). |
| Pells Heft | 4, 6 | villa.js (Seiten 1, 2, 4) → neben6 `pell` | in Ordnung | – |
| Kap.-3-Geschenke | 4 / 5 | villa.js (Flicken an S-7), kapitel5.js (Riemen bei Gisela, Riegel auf Hildes Tisch, Schnalle im Fundamentstein) | eingelöst | – (Item-Schlüssel passen, ladefest) |

## Kurz geprüft
- `node --check` aller geänderten Module.
- `node tools/assemble.js` (66 Teile); das Hauptskript des Zusammenbaus wird fehlerfrei geparst.
- Ein Node-Check der Fibel-Logik:
  - doppelte Näpfe zu einem Eintrag zusammengelegt
  - „FORTSETZUNG“-Meldungen
  - Nachtrag einmalig
  - liegengebliebenes `k1_karten` zählt nicht als offen
  - Schlüssel intakt

**Nicht im Spiel angesehen.**

## Offen (Autor / spätere Pakete)
- **Rechthaben:**
  - V-03 und V-06 gibt es nur in Kap. 1. Wer sie verpasst, kann die Aufgabe nicht mehr abschließen.
  - Die Vegas-Monologe V-07…V-13 (Kap. 3–5, Bibel 1505) sind nicht gebaut. Das gehört zu AP-26 (`ALBERS_TALKS`). Damit bekommt Kap. 5 seinen Abschnitt.
  - „laternen“ und „v01“ sind dieselbe Behauptung, doppelt geführt.
- **Zayn/Cleo:**
  - In Kap. 6 gibt es keine Fortsetzungsmeldung.
  - In Kap. 4/5 steht der Text „heute Nacht“ aus Kap. 3.
  - Cleo: „ERINNERUNG“ überdeckt „ERLEDIGT“. Holt Luke den Schlüssel erst in Kap. 6 (Tausch), fehlen die Pony-/Foto-Notizen.
- **Akte:** In Kap. 5 kommt kein neuer Durchschlag hinzu (nur Reste). Die Funknotiz „Abgeholt. (12)“ (lwo.js) ist nicht gebaut.
- **Heidi:** `k5_heidi` verweist nicht auf die „Ja.“-Karte. Bibel prüfen: Schreibt Heidi in Kap. 1 an sich selbst, in Kap. 5 an Lucy?
- **Gelber Kasten, Weg c:** Bricht Luke vor der Maas-Szene ein, bleibt der Text „Schuppen noch zu“ stehen.
- **Kleinkram:** Gegenstand „Heftseite“/„Heftseiten“ heißt in Kap. 1 und Kap. 5 unterschiedlich; Riegel und Schnalle in Kap. 5 sind ohne Hinweis verpassbar.
