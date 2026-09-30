# Stand AP-18 · Kapitel 3 Nebenaufgaben und Rüstungs-Hinweise (30.09.2026) – Schnittstellen

## Module
- **`neben3.js`** (ORDER nach `karte`; `remise` ist eingetragen, Datei gibt es noch nicht): Register der 20 Aufgaben (Fibel-Titel), Zeitfenster `neben3_frei()` (= `kapitel3_nebenOffen()` von AP-17), Abschluss über `KAPITEL3_LATERNE4` bzw. `ch3.lampsOff` (Zustand 'zu'; weiter laufen „Siebzehn Näpfe“, „Hast du dich an mich erinnert?“, „Eine für sieben“, „Hinter deinen Füßen“), RH über `justin_rh`, Glocken-Joker (`ch3.bell`, bei Treffer `kapitel3_erstarren(17)`; Basis-`greyUpdate` ist umhüllt).
- Voll gebaut in neben3.js: Kapelle innen (neues Bleiglasfenster, 8 Felder im Blickfenster, RH-6 bei Lampe aus, Kirchenführer, Sakristei mit Z-11/Sühnebrief/Gemälde-Zettel, Gesangbuch, Justin summt, Turmraum mit Glockenseil + Joker), Pfarrhaus (Schach/Springer-Zettel, Kalender, Foto, Talar, Predigtmappe mit Reitern, Brecheisen, B-K3-N1) → Martinsnische (Kerze, Seelbuch, RH-7), Giselas Küche (vier Katzen an Spuren, 16 Katzen, Köpfe, Gisela wach, Pfarrhausschlüssel), Peters Zimmer Nr. 4 (Tür schwingt auf, E-21, Rekorder, Zigarrenkiste → SB-05, Kassette, Stuhl-Schreck).
- `albers.js`: „Rot eingekreist“ (Umschlag + Kapellenschlüssel `n3_kapschluessel`, Ordner durch den Kettenspalt, Verandabank, Z-01/Z-10/Fotoseite, Kaugummipapier daneben → Fibel „(hw)“).
- Basis: Gully → `neben3_gully()` (Justin hält den Deckel), Kanal-Schrecken in Kap. 3 aus (Regel „Aus!“), Intro ohne alte ATLANTSCHISS-Zeile.
- `geheimnisse.js` (Helfer): „Warm wie eine Hand“ mit RH-10-Summton, neuer Schlusstext.
- Schlanke Fassung (Klickflächen an vorhandenen Orten, Wortlaute der Bibel, ohne eigene Räume/Figuren): Heimgehen, Klar! (Nachbild Sommerfest), Bus 03:13 (Erzählung + Fahrt zum Hof), Ich hol sie selbst (SB-06), Bitte lächeln (Band mit 7 Standbildern, RH-8), Zweiundvierzig Kerben, Leg sie auf den Ort (Dina in der Scheune, Papier umdrehen, RH-5), Ja., Schläft wie ein Stein (Auswahl an der Tür), Damit keiner fehlt (Nachbild 1975 + `echo_kreuzung`), Zayn (Wolle, Anhänger, Anrufbeantworter), Cleo (Pony/Foto nach dem Schlüsseltausch).

## Flags für AP-17 (ch3.side, gespeichert)
`ordner` (Vegas’ Ordner) · `fenster` (Kapelle fertig) · `predigt` (Seelbuch) · `klar` · `zayn` (Anhänger + Anrufbeantworter) · `k3_selbst` · `k3_stein` · `glocke` ('frei'|'benutzt'|'verfallen'). Gegenstände: `predigtmappe`, `n3_schuh` (rechter Schuh für Raum 1), `n3_kapschluessel`, `n3_pfarrschluessel`. Lore `k3_vier_kreise` = dritter Weg zur Laternenfolge.

## Offen / später
- Ausbau der schlanken Fassungen: Remise als Gebäude, Nr. 6/Nr. 8 begehbar, echter Bus mit Innenraum und Behaltenen, Drehtür-Szene, Villa-Handschuh/Kombi (V-01/V-13), V-02 an Tankstelle/Friedhof, Justin-Zeilen an mehr Stellen.
- Fehlende Assets: Bus (außen/innen), Lesepult, Glockenseil, Schachspiel, Kassettenrekorder, Zigarrenkiste, Holzkiste (Kanal), Plastikpony, Anrufbeantworter, Drehtür.
