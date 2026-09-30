# Stand AP-16 · Kapitel 2 „Das achte Kind“ (30.09.2026) – Schnittstellen und Speicherschlüssel für spätere APs

## Module / Dateien
- **neu `amt.js`** (ORDER nach `zimmer7`): Ebene −2 – neue Räume (Kantine, Hängeregistratur, Planungsraum, Vorraum des Messraums mit Trennwand bei X + 110), Nadeldrucker, Lautsprecher (AG-05), Bahnhofsuhren, Nummernautomat, sieben Nebenaufgaben, Stuhl 8, Notbeleuchtung, K-1-Präsenz ohne Kontakt (A-05), A-06, B-K2-Zettel mit festem Ort.
- `uebergang.js`: UK 1 (Tunneltext) und **UK 9** komplett neu (Lampe am Leiterfuß, Aufstieg mit E halten, Gully, Whiskey „Scheiße!“, Glocke 3 + 13, Endkarte unter den Schlägen, dann Kapitel 3). Absperrband „Gasleck“ an der Kellerwand Nr. 7 ab Kap. 4.
- `feuer.js`: Griff „Bruder.“ (Pflicht, `feuer_griff`), Fass am klemmenden Gitter, Lampe liegt zwischen Luke und Peter, 12-s-Fenster, Nicken + Kopf wegdrehen, Peters Feuerzeug (Gravur „– M.“), Nachher ohne Musik (30 s Lüftung) → AG-07.
- `lwo.js` (nur AG-07-Block am Ende): `lwo_ag07()`, `lwo_ag07Tick(dt)` (Takt aus feuer.js), `lwo_ag07Reset()` (TOD_RESET).
- `tod.js`: erster Fang → `feuer_griff`, Todesart `blech` (AG-07), Speicherpunkt „Speicherpunkt Amt“.
- `zimmer7.js`, `innen_kapitel.js`: Wortlaute Fassung 3, Stuhlkreis im Messraum, Formblätter mit Auge, Prüfraum-Texte.
- Basis (Kap.-2-Stellen): FILE_TEXT (Akten 01–07), Ordnungstafel (Hilfeleiter, kein Zähler), Vermessungsprotokoll, Lights-Out (1 und 6 leuchten; Hilfeleiter 6/15/30; A-06), `powerOn` → `amt_notstrom`, `spidersGone` → `amt_nachSpinnen`, Jagd (er geht; klemmendes Gitter 3 s), Klavier (`amt_klavier`), Akte 08 (+ Foto, → `amt_akte08`), `finale()` (Wortlaut UK 8, „Flocke.“-Zweig), Nachbilder (kein Archiv-Nachbild; Stuhlkreis 2009), Messraum-Auslöser hinter der Trennwand.
- `kino.js`: nur `KINO_K2_KARTE = false` (Endkarte läuft am Gully, Wunsch AP-10).
- Werkzeug `app/tools/_ap16_assets.mjs`: neue Requisiten `ms/w_kette`, `ms/w_funk`, `ms/w_telefon`, `ms/w_thermos`, `ms/w_blech` (+ KTX2).

## Funktionen für andere
- `amt_druck(text, { mess, still })` – Nadeldrucker (oben rechts immer „ZÄHLSCHLUSS 03:13“).
- `amt_band(text, { schnitte: [...], spieluhr, kichern, at })` – Wolters Bandschleife aus dem nächsten Lautsprecher (Promise).
- `amt_uhr(hh, mm)` – Bahnhofsuhren springen (nie rückwärts) + `leben_uhr`.
- `amt_S` (Zustand), `amt_S.versteck` (AG-07), `amt_S.notlichtAn` (Notbeleuchtung Messraum).
- `uebergang3_S.glocke` – die 3 + 13 Schläge sind am Gully schon gefallen; `leben_uhrSync().c3 = true` wird nach `chapter3Begin()` gesetzt, damit `lucy3_bells()` nicht ein zweites Mal läutet.
- `feuer_griff()`, `feuer_S.griff`, `feuer_S.lampe`.

## Speicherschlüssel
- `amt` = { akte06, batt, klavierFehl, danke, nr (Wartenummer), ag06, ag07, reg (Zahlenschloss), regFotos (0–4), regDreh, kantine, brett, kasse (Kaffeekasse +1), leiter, leiterSteht, gruendung, vernichter, modell, modellN, kuehl, bogen („Flocke.“ möglich), stuhl8, feder, bogenFlocke, akte8, tankHand, lucyDa, umschlag, druck (letzte Druckzeilen) }.
- Nebenaufgaben in `story.side`: `k2_kleid`, `k2_kantine`, `k2_gruendung`, `k2_modell`, `k2_bogen`, `k2_einmachen`, `k2_fuettern`.
- Gegenstände: `wartenummer` (bleibt, wird nie gebraucht), `einwilligungen` (Pflicht für die Laternen in Kap. 3), `umschlag7` (Durchschlag 7 „Akte 08“, ungeöffnet), `feuerzeug` („Peters Feuerzeug“ – bleibt nach dem Zünden im Inventar: Kap. 4 Joint, Kap. 5 Mamas Kerze, Kap. 6 Gravur).
- Lore-Schlüssel: `amt_villa_westweg`, `amt_grauer_mantel`, `amt_bestandsliste`, `amt_drei`, `amt_kaffeekasse`, `amt_abzaehlreim`, `amt_feder`, `amt_vermessungsbogen`/`vermessungsbogen`.
- Vertrauen (lwo_ereignis): `zimmer7_einwilligung` −5, `registratur` −10, `gruendungsakte` −10, `kuehlregal` −5, `kaffeekasse` +1.

## Für AP-17 (Kapitel 3) wichtig
- Kapitel 3 beginnt am Gully an der Kreuzung (x 9,7 | z −1,3), Luke kniet, es ist 03:13; `chapter3Begin()` + `chapter3Opening()` werden von `uebergang3_ende()` gerufen, **nachdem** die 3 + 13 Schläge unter der Endkarte gefallen sind (`uebergang3_S.glocke = true`, `leben_uhrSync().c3 = true` → `lucy3_bells()` läutet nicht erneut). Wenn Kap. 3 die Tafel/das Zusammensacken zeigt, hier ansetzen.
- Whiskey-Station `schacht` ist mit K2-2 erledigt (`whiskey_S.flags` 'k2_2'); Whiskey sitzt am Gullyrand.
- `einwilligungen` (Aushang aus Zimmer 7) ist im Inventar – Pflicht für die Laternenfolge 5 → 3 → 1 → 7.
- RH-1 = B-K2-05 (liegt im Versteck hinter den Schränken im Vorraum; `ch3.armorHints` bekommt 'RH-1' beim Lesen, AP-07).
- SB-04 liegt unter Stuhl 8 (`sammeln_platz('SB-04')`), W-05 (Feder in der Kerbe) als Lore `amt_feder`.
- Nach Kap. 2: Ebene −2 unerreichbar (Gang hinter der Kellerwand endet blind), ab Kap. 4 Absperrband „Gasleck“ an der Wand.

## Teststand (30.09.2026, Electron-Selbsttest)
- Lauf 2/3 (Tunnel → Nummer → Kantine → Zimmer 7 → AG-06 → Strom/AG-05 → Kühlregal → Spinnen → Jagd → Griff „Bruder.“ → Öl → Nicken → Brand → Nachher/Funk): läuft durch, keine Fehler im Log.
- AG-07 mit richtigem Verhalten (Versteck, Lampe aus, Atem nur während „nah“): bestanden, `amt_S.ag07 = true`. Atem jetzt 14 s (vorher 11 s – zu knapp), Schonzeit 1,6 s.
- Messraum → Stuhl 8 → Klavier/Safe → Akte 08 → `finale()` → Wahl → „Ihre Augen“ (k2) → UK 9: läuft.
- UK 9 (gezielt): Lampe → Leiter (E halten) → Stadtschacht → Whiskey → Deckel → Glocke 3 + 13 → Endkarte → `chapter3Begin()`: läuft, `ch3.on = true`.
- Fixes aus den Läufen: Lampe (F) lässt sich während AG-07 auch im Funkdialog schalten; Hinweis „Hinter die Schränke.“; Sprecher „DU“ → „LUKE“ (3 Zeilen); `TOD_RESET.push` in augenzu.js/feuer.js verzögert (TDZ-Schutz); Amt-Bänder/Drucker schweigen nach dem Abspann; Klickflächen Lampe/Leiter in UK 9 heilen sich selbst (Schutz; der Fehlbefund kam vom zu früh greifenden Testschritt).
- Gesamtkette bestätigt: echter `finale()` → „Ihre Augen“ → UK 9 → Aufstieg → Gully → Glocke → Endkarte → Kapitel 3 (`kap() = 3`). FPS im Messraum 79–107.
- Test-Export: `window.__ueb3` (uebergang.js), `__amt.ag07/ag07S/lampe`.
