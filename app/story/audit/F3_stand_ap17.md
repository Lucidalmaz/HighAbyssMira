# Stand AP-17 · Kapitel 3 „Ich komme“ (Hauptweg) – Schnittstellen

Stand 30.09.2026 (umgesetzt). Tests (Profil `_ham_testprofil_ap17`, Ausgaben `C:/Users/GIGABYTE/_ap17_out2…5`): Intro → Kuh-Kino → drei Untersuchungsstellen ✓ · Straße bis „Nimm Justins Hand“ erreicht (Bildbeleg) · Nimmerheim Raum 1 → 2 → 3 → Deduktion → Geständnis → Abgrund → Wahl-Tafel ✓ · Antwort C → Geschenk + Flicken (≥ 3 RH) → „Noch eine Runde“ → Abspann k3c → Endkarte mit Knopf Kapitel 4, Justin weg ✓.

## Module
- **neu `kapitel3.js`** (ORDER nach `lucy3`): Straße UK 2–6, 8–10: Kuh-Untersuchung (drei Stellen, Fluch-Gag am dritten Punkt, Polaroid „Sieben und ein halber“ ins Album), Vegas durch die Tür, Telefon (Regel 6), Justin erst nach dem Anruf, „Kein Draußen“ (Ost-/Südsperre → hinter der Haltestelle am Kirchweg; beim zweiten Mal Spuren + Justin am Ausgang), Zählbuch (Scan-Buch, drei Seiten), Nachbild 2009 mit neunter Gestalt, Graukind „Ochs am Berg“ ab dem ersten Hebel, Freimal, Q = aus ihren Augen, Behaltene (Freimal, „Du bist!“, zurück vor Nr. 7), Lichtsäule an der Kreuzung, B-K3-08/08b, Hand nehmen, „Kum!“. Speicherstand `kapitel3` + Weiterspielen mitten im Kapitel (CH_RESUME).
- `lucy3.js`: UK 1 (Tafel im nahtlosen Weg, Aufwachen, Glocke nur im Menü-Weg, Stimme am linken Ohr), UK 7 Funk, UK 8 Kästen (Hilfeleiter, Speichern je Laterne, „ZULETZT.“), Sperren ab Kap. 4 (Funkkasten tot, Absperrband).
- `weiss.js`: UK 10–14 (Übergang, Raum 1–3, Voss, Deduktion MIRAS/JUSTINS mit SB-07, Abgrund mit Kinosequenz `k3blinzeln`, Lucy nach „Noch eine Runde“ über einen Hook um `justin_runde`).
- `lwo.js` (Block am Ende): `lwo_ag09()`, `lwo_ag10()`, `lwo_ag08()`, `lwo_ag08Bereit()`.
- Basis: Kuh unversehrt geladen, verformt erst beim Aufprall (`FAB.cow` / `FAB.cowPlatt`).
- `kino.js` (klein): Kreis der Behaltenen = Hilde, Zayn, Mike, Roxy, Cleo, Mädchen mit Kreisel + Lucy (erwachsen); Dina/Heidi raus.

## Für AP-18
- Lesen: `ch3.cowSeen`, `ch3.callDone`, `ch3.met`, `ch3.radio`, `ch3.seq`, `ch3.lampsOff`, `ch3.part`; `kapitel3_uk()` (1–14); `kapitel3_nebenOffen()` (UK 5 bis vierte Laterne); `kapitel3_jagd()`.
- Schreiben: `KAPITEL3_LATERNE4.push(fn)` (vierte Laterne), `KAPITEL3_EISEN.push([x, z, r])` (weitere Freimale), `kapitel3_erstarren(sek)`.
- Glocken-Joker: AP-17 ruft vor jedem Fang `neben3_glockeFang()` und behandelt `neben3_frost()` als sicher.
- Luna-Zusatzzeilen lesen `neben3_hat('k3_rot' | 'k3_kapelle' | 'k3_klar')`; Voss erkennt Luke mit `neben3_hat('k3_predigt')` (Zeile „Reifen“ mit Gegenstand `predigtmappe`); Hildes Jonas-Zeile mit Lore `zayn_rucksack` oder `neben3_hat('k3_rucksack')`.
- RH nur über `justin_rh`; AP-17 zählt RH-4 (B-K3-08b über beobachter.js) und RH-5 (Zeichnung Raum 1).
- Vegas’ Kuh-Ruf setzt `ch3.side.vegasKuh = true` (Start „Rot eingekreist“).
