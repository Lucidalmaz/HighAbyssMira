# Prüfwerkzeuge Sprachausgabe (Dauerinstanz)
Stand 15.10.2026, Auswertung in `docs/gameplay/stimmen_integration.md`.
* `cases.py` baut die Zeilenliste, `mk_vt.js` / `mk_vt2.js` bauen Steps (Kapitelstart wie `qa_bewegung/mk.js`), `vt_lib.js` misst je Zeile (Start, Sprecher, Quellstarts,
  Stimmdauer gegen Untertitel, RMS/Spitze/Abstand zum Bett hinter dem Begrenzer, Anteil < 250 Hz), `vt_keys.js` Hook-Schlüssel, `vt_flow.js` Enter/Klick/X/Pause/Aus,
  `vt_wechsel.js` Kapitelwechsel, `vt_tod.js` Tod/Rettung, `vt_kino.js` Kino-Zeilen (braucht `window.__vt_kino_cases`).
* Läufe: `bash ~/_live.sh start normal`, `bash ~/_live.sh run <name>.json`; Ergebnis in `_live/normal1/out/<name>/steps.json`. Das Leistungs-Gate leert `out/` – Ergebnisse vorher sichern.
