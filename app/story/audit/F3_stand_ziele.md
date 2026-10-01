# Stand R-17 Ziele, Aufgaben und Klänge (01.10.2026)

Vorbilder: Resident Evil (Ziel kurz einblenden, Akten, Karte), Alan Wake 2 (was offen ist), TLoU II und Until Dawn (ruhig, diegetisch).

## Was gebaut ist
- **Modul `app/mods/ziele.js`**, ganz am Ende von ORDER. Es legt nur Hüllen um Vorhandenes: `questPop`, `closeOverlay`, `todCpShow`, `karte_markierung`, `addBattery`, `Audio.paper`, `Audio.chime`, `Audio.play` (nur Sperre).
  - Die Ziel-Anzeige liest `#objText` per MutationObserver. Damit gilt sie für alle Kapitel, egal wer das Ziel setzt.
- **Arten der Einblendung**, erkannt am Kennwort von `questPop`, jede mit eigener Farbe und eigenem Klang:
  - neben, fort, erledigt (Bleistiftstrich durch den Titel)
  - verpasst (rot, durchgestrichen; `ziele_fehl(titel, text)`)
  - fund, sammel, fibel, karte, kapitel
  - Bei Neben, Fortsetzung und Erledigt steht darunter in Lukes Handschrift (`--f-luke`), worum es geht. Der Text kommt aus `story.side[...].desc` (Fäden über `sammeln_fadenSicht`).
- **Neues Hauptziel:** Die Anzeige heißt „NEUES ZIEL“. Der Text wird geschrieben (Clip-Animation), darunter steht das *Warum* in Lukes Worten (`ZIELE_WARUM`, 22 Ziele aus Kap. 1–6; erweiterbar mit `ziele_warum(re, text)`), dazu der Klang.
  - Kurze Takte (Warten, LAUF, QTE-Anweisungen) erscheinen still mit leisem Stift.
  - Nach 11 s blendet die Anzeige aus.
- **Die Anzeige kommt wieder:**
  - mit Taste **Z** (auch Y), mit Richtung ab Hilfe „sanft“
  - nach Fibel oder Notiz
  - 2,5 s nach Jagd, Kino, QTE oder Sterben
  - nach dem Laden („WEITER“, über `CH_RESUME`)
  - nach 45 s Stillstand
  - bei Hilfe „deutlich“ alle 150 s am selben Ziel, mit Richtung und Entfernung
- **Warteschlange:** Einblendungen überschreiben sich nicht mehr, sie folgen im Abstand von ≥ 3,4 s.
  - Sie warten bei Jagd, Kino, QTE und Sterben und bei offener Notiz, Fibel, Pause, Menü oder Titelkarte. Der HUD ist dort unsichtbar, früher gingen sie dort verloren.
  - Was während Stress eingesteckt wurde, kommt danach gesammelt als „DU HAST EINGESTECKT“, mit dem Griff an die Jackentasche.
  - Kinos eigene Warteschlange läuft jetzt auch nacheinander statt gleichzeitig.
- **Fibel-Reiter „WAS JETZT?“:** zeigt
  - das aktive Ziel mit Warum
  - Lukes Hilfegedanken (`GEDANKEN_FADEN`, bei Hilfe „deutlich“ sofort, sonst nach 60 s)
  - die Himmelsrichtung und Entfernung zum nächsten offenen Story-Hinweis (`HINTS`), mit Knopf „AUF DER KARTE“
  - die offenen Nebenaufgaben mit ihrem letzten Schritt und der Kartennadel
  - „Zuletzt notiert“: die letzten 12 Einträge aus dem Logbuch. Das Logbuch nimmt jede Einblendung, jedes neue Ziel und jeden Speicherpunkt auf (Spielstand `ziele`, 60 Einträge).
- **Einstellung „Hilfe“** (Einstellungen, `settings.hilfe`):
  - 0 aus: keine Hilfegedanken, keine Richtung
  - 1 sanft (Standard): `GEDANKEN.stuck` 150 s
  - 2 deutlich: 75 s, mit Richtung in der Anzeige
  - In der Steuerungsliste steht die Zeile „Z“.
- **Klänge**, nur Aufnahmen, gebaut mit `python app/tools/klang_ziele.py [holen] [bau]`. Die Quellen holt das Skript selbst (Schlüssel `zl_*`, `quellen.py` bleibt unberührt). Neue Dateien in `game/audio`:
  - **Aufheben** `pk_<material>_n`:
    - papier (Paperlife): Zettel, Fotos
    - metall (Blacksmith-Handling)
    - glas (Bierflasche aus dem Kasten, Gläser)
    - stoff (Canvas-Tasche, Tuch)
    - batterie (rollende Batterie + Plastikklick)
    - schluessel (Münzklimpern tiefer + Alu-Glieder)
    - plastik (Kassette aus der Hülle)
    - glanz (Glasklöppel-Windspiel + Glockenspiel E7/H6, VSCO)
  - **Material:** `Audio.aufheben(material | Name)` ordnet es dem Gegenstandsnamen zu, bei jedem Fund-`questPop` (INVENTAR, GEFUNDEN …), sofort, auch in der Jagd.
  - **`Audio.paper`** (72 Aufrufe, bisher Rauschen) spielt jetzt echtes Papier. Liegt es ≤ 380 ms an einem Material-Fund, wird es geschluckt.
  - **Fibel-Klänge** `ui_*`:
    - ziel: HB-Bleistift + gestrichenes Becken eine Oktave tiefer + Kontrabass + Gong-Hauch
    - neben: Strich + gedämpfte Harfe
    - fort: Seite + Strich + offene Quarte
    - erledigt: Seite + Klavier E3/A3 → A2/E3/C4
    - verpasst: zwei Striche + Radierer + Celli A/B♭ tremolo
    - fibel / sammel: Seite + Vibraphon
    - karte: Bleistiftpunkt
    - speichern: Buch zu + tiefes Klavier
    - tasche: Klaps auf die Jackentasche
  - **Pegel:** Die Dateien liegen bei −21 LUFS, gespielt mit 0,3–0,46. Das ergibt etwa −28 bis −31 LUFS (Stift bisher ≈ −33,5, Betten ≈ −34 dB RMS). Ziel und Erledigt ducken die Musik kurz.
  - **Lautstärkeregler:** UI-Klänge laufen trocken auf `master`, Aufheben auf `world` mit Raumhall.

## Kurz geprüft
- Syntax und Bau sind sauber. Ergebnis des einen Laufs: siehe Abschnitt „Testlauf“ unten.

## Offen / Bitten
- **Glanz-Agent:** `pk_glanz_1/2` steht bereit. `glanz_klang()` könnte `Audio.aufheben('glanz')` unterlegen. Bei GLÄNZENDES spielt `ziele` den Glanz schon leise mit; bitte nicht doppelt hochziehen.
- **Kapitel-Agenten:**
  - Für verpasste Aufgaben bitte `ziele_fehl(titel, text)` aufrufen; bisher gibt es keine.
  - Für neue Hauptziele ohne Warum: `ziele_warum(/regex/, 'Lukes Satz')`.
- **UI-Agent:** Die Klassen `#objective.zl-aus/.zl-neu`, `#objWarum`, `#objWohin`, `#qpWarum`, `#questPop[data-art]` und `.zlJetzt` lassen sich frei überstylen.
- **Achtung:** `node build.js` räumt „verwaiste“ `app/game/index_*.html` auf, also die Testseiten anderer Agenten.
