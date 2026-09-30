# Stand AP-05/06 LWO (30.09.2026) – Schnittstellen für die Kapitel-APs

- Vertrauen: `lwo_trust(delta, key)` (einmalig je key, 0–100), `lwo_ereignis(key)` (Werte aus `LWO_WERT` = Tabelle 5.1 mit zuständigem AP), `lwo_stufe()`, Drohungen `lwo_drohung/lwo_drohungOffen/lwo_drohungErfuellt`, Kapitelende `lwo_kapitelende(kap)` → Text/Zeile/Stempel (AP-14 … AP-24 an ihren Endkarten), Funk-Daten `LWO_FUNK`, AG-V im Tick (V-01/02/03/06/12/13/15/16 fertig; übrige per `lwo_vAnker(id, fn)` an Kapitelorten).
- Szenen: `lwo_szene(id, opts)` spielt eine Dialogbank AG-01 … AG-21 (wortgleich in lwo.js) an einer Stelle ab, Kapitelmechanik über `opts.hook`; Dialog-Overlay mit 3 Antworten; Sprecherlabels „DER LANGE“/„DER KURZE“/„DER MANN IM MANTEL“ bis die Namen fallen.
- Figuren: `wolter`, `nachsorge11`, `nachsorge12`, `blechmann` in `game/assets/chars/`; Blinzeln (11 bei t, 12 bei t+0,68 s), Augen folgen Luke, Atmung, Kauen, `lwo_hand('bare')` (Wolters graue Hand), Sichtkegel `lwo_sieht(F, {weit, winkel})`, Präsenz ohne Kontakt `lwo_praesenz(x, z, ry, …)`, Blechmann-Lampe (ein SpotLight, beim Laden 0, wandert zur aktiven Lampe).
- Kombi (`car_amsedan` grau, ohne Kennzeichen, Magnetschild „Institut für Atmosphärenforschung“), Funk `klang_funk` (klang.js), Sender `lwo_senderEinstecken` (AG-09), `lwo_senderAnsehen` (Kap. 3), `lwo_senderVariante()` A/B/C, `ITEMS.sender`.
- Kap. 1 schon angebunden: AG-02 (vor Nr. 9), AG-01 (Kombi an Lucys Auto), Durchschläge −2.
- Bitten: AP-09 `katzen_baerbelPapier(x, z)` bereitstellen (wird nach AG-02 gerufen); AP-21 `whiskey_kombi(pos)` bei AG-15; AP-14 `lwo_kapitelende(1)` in die Endkarte.
- Offen (Autor): „Südsperre“ doppeldeutig (AG-01 an Lucys Auto gebaut), „Keine Aufschrift“ vs. Magnetschild (Schild am Heck), Lukes Dienstplan „Fr frei“ oder „Mo–Fr“.
- Fehlende Assets: Regenschirm, Schiebermütze, Thermoskanne, Blechbecher, Kettenrolle mit Karabiner, Funkgerät mit Spiralkabel, Chrysanthemen; Wolter-Gesten (keine Clips); Kopf-Hals-Naht sichtbar.
- Leistung: 7 LWO-Figuren gleichzeitig kostspielig (Blendshapes, Skinning) – Schatten nur < 16 m, ferne Figuren halbe Bildrate; Endmessung nötig.
