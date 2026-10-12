# Story-Führung: Erzählfluss Kapitel 1–6 (Konzeption, Stand 12.10.2026)

Auftrag (Nutzer): Man soll jederzeit wissen, **was wo wann passiert, wer redet, in welcher Phase man ist und was zu tun ist**; geführter und natürlicher statt kreuz und quer.
Dieses Dokument ist die einbaufertige Konzeption. Es ändert **nichts am Kanon** (`app/story/story_final.md` ist verbindlich; `kanon.md` ist laut eigenem Kopf veraltet). Es erfindet keine Weltfakten.
Alle neuen Texte stehen maschinenlesbar in `docs/gameplay/fuehrung_texte.json` (IDs `FS-<Kap>-<Art>-<Nr>`, hier in Klammern genannt). Tutorial: `fuehrung_tutorial.md`. Ortsschild: `fuehrung_ortsschild.md`.

**Methode und Grenzen.** Gelesen wurden: UEBERGABE_0910_ABEND.md (Folgeauftrag 2 samt Ergänzungen), story_final.md (Kap.-Köpfe, Unterkapitel-Auslöser), gedanken.js (GEDANKEN_FADEN, GEDANKEN_ORTE), ziele.js, stimmen.js, oberflaeche.js, kapitel1.js, traum.js, fibeltour.js, karte.js, kino.js, hervorhebung.js, die Aufgaben-Extraktion `docs/unreal/data/aufgaben.json` und `dialoge.json`. Die Spalte „bisherige Unklarheit“ ist aus Code und Skript abgeleitet, **nicht aus einem Spieltest**. Wo etwas nur vermutet ist, steht „(prüfen)“. Es wurde keine Spielinstanz gestartet.

---

## 1. Führungsregeln (gelten für alle Kapitel)

| # | Regel | Umsetzung |
|---|---|---|
| F1 | **Jede Zeile hat eine Quelle.** Rede trägt einen Namen; Gedanken tragen „LUKE · GEDANKE“; Erzähltext trägt keinen Namen (CSS `data-art="erz"` blendet `.who` aus, das bleibt). | §2.5 |
| F2 | **Stimmen ohne sichtbare Figur** bekommen Kanal oder Ersatzkennung: `NAME · KANAL` oder `STIMME VON DRAUSSEN`. | §2.5, JSON `FS-ALLE-SP-*`, `FS-*-SZ-*` |
| F3 | **Wo, wann, wozu** steht bei jedem Kapitelbeginn auf der Kapitelkarte (Ort · Zeit · Ziel · Bisher). | §2.1 |
| F4 | **Phase**: eine Zeile „KAPITEL n · i VON N · NAME“ über der Zielzeile. | §2.2 |
| F5 | **Ortsmarke** beim ersten Betreten eines wichtigen Ortes (3 s, unten links). | §2.3 |
| F6 | **Zielzeile**: Verb zuerst, ein Ort, höchstens 90 Zeichen, kein doppelter Inhalt mit „Warum“ und „Faden“. | §2.4 |
| F7 | **Eine Information, eine Stufe.** Zielzeile = was; Warum = wozu (Lukes Stimme); Faden = Hilfe bei Festhängen (neue Information, nie Wiederholung). | §6 |
| F8 | **Ruhe-Einstiege füllen**: nach jedem Kapitelwechsel in den ersten 60 s höchstens drei Textereignisse, in fester Reihenfolge (siehe §3, Beat „Einstieg“ je Kapitel). | §3 |

---

## 2. Bausteine

### 2.1 Kapitelkarten (Ort · Zeit · Ziel · Bisher)

Bestand: K3–K6 haben eine Tafel (`C3_INTRO` in `_base_source_index.html` Z.4632, `C4_INTRO` anwesen.js Z.192, `C5_INTRO` kapitel5.js Z.518, `K6_INTRO` kapitel6.js Z.31); K4–K6 tragen darüber „BISHER“ (`RECAP`/`bisherHtml`, V-8). K1 und K2 haben im normalen Spielfluss **keine** Tafel (nur `questPop('KAPITEL 2', …)` in uebergang.js Z.77; die Tafel `startChapter2` erscheint nur über Menü/Weiterspielen). Weder Ort noch Zeit noch Ziel stehen in den Tafeln als eigene Zeilen.

Neu, einheitlicher Aufbau (Vollkarte, Klick = weiter):

```
KAPITEL 3 · ICH KOMME                          (Bestand, Gold, Versalien)
Lost Eyengless · Donnerstag, 5. November · 03:13   (neu, Ort · Zeit)
BISHER                                         (3 kurze Zeilen, Lukes Stimme, kursiv)
… Erzähltext (Bestand) …
ZIEL: Hol Lucy zurück. Finde heraus, was …     (neu, Gold, kleiner)
KLICK · WEITER
```

Kurzkarte (Lower-Third, 6 s, ohne Klick, Esc/Enter/Klick schließt) für K1 und K2, weil dort kein Schwarzbild vorausgeht.

| Kap. | Form | Ort · Zeit (JSON) | Ziel | Bisher |
|---|---|---|---|---|
| 1 | Kurzkarte nach Mailbox | Lost Eyengless · Mittwoch, 4. November · kurz nach elf Uhr abends (`FS-1-KK-02`) | Finde Haus Nr. 7. Lucy hat dort etwas hinterlassen. (`FS-1-KK-03`) | – (Prolog ist die Einleitung) |
| 2 | Kurzkarte bei `chapter2Begin` (ersetzt `questPop`) | Amt für Rückführung · Ebene −2 · Donnerstag, 5. November · kurz nach eins | Finde Lucy. Irgendwo hier unten summt sie. | `FS-2-BI-01..03` |
| 3 | Vollkarte | Lost Eyengless · Donnerstag, 5. November · 03:13 | Hol Lucy zurück. Finde heraus, was mit Lost Eyengless geschehen ist. | `FS-3-BI-01..03` |
| 4 | Vollkarte | … · Morgen, Nebel | Sieh nach Lucy. Dann die Villa Seiler: acht Schlüsselteile. | `FS-4-BI-01..03` (gekürzt, V-8) |
| 5 | Vollkarte | … · Abend | Lucy schläft bei Vegas. Bleib in ihrer Nähe. | unverändert (V-8) |
| 6 | Vollkarte | Forbidden Dustwoods · Freitag, 6. November · kurz nach zwei Uhr nachts | Finde den Jungen mit deinem Namen. Er ist im Wald. | unverändert (V-8) |

Zeitangaben nur, wo der Kanon sie nennt (story_final „Auf einen Blick“): K1 „kurz nach elf“, K2 „kurz nach eins bis 03:13“, K3 „03:13“, K4 „Morgengrauen bis früher Nachmittag“, K5 „früher Abend bis kurz vor Mitternacht; im Spielertext keine Uhrzeit“, K6 „kurz nach zwei“. Die Weltuhr (`leben_uhr`) startet K4 bei 07:40; auf der Karte steht deshalb „Morgen“, keine Zahl.
**Bisher jederzeit nachlesbar:** Fibel-Reiter „WAS JETZT?“ (ziele.js `ziele_rJetzt`) bekommt oben den Block „BISHER“ des laufenden Kapitels (gleiche Zeilen, `RECAP`-Struktur; für K1 entfällt der Block).

### 2.2 Phasenanzeige

Neue Zeile `#objPhase` über der Zielzeile in `#objective` (ziele.js `ziele_dom`), gleiche Ausblendregeln wie die Zielzeile; dauerhaft im Fibel-Reiter „WAS JETZT?“ und im Pause-Menü. Format: `KAPITEL 3 · 4 VON 6 · DIE LATERNEN`.
Die poetischen Unterkapitel-Titel (z. B. „LUKE, 9“) bleiben als Speicherpunkt-Beschriftung (`todCpShow`) bestehen und ergänzen die Phase, ersetzen sie nicht.

| Kap. | Phasen (JSON `FS-k-PH-nn`) | Auslöser je Phase (Quelle; bei Integration verifizieren) |
|---|---|---|
| 1 (7) | 1 ANKOMMEN · 2 DAS HAUS · 3 DIE KELLERTÜR · 4 DER KELLER · 5 DAS LICHT · 6 VERSTECKEN · 7 DIE WAND | `story.main` 0–1 · `main`=2 oder Schwelle Nr. 7 · `main`=3 · `main`=4/`state.inBasement` · `main`=6 (`state.outage`) · `main`=7 (`K1.v.on`) · `main`=8 |
| 2 (8) | 1 DER TUNNEL · 2 DAS ARCHIV · 3 DER STROM · 4 DIE ZELLE · 5 DER LANGE GANG · 6 DIE BLECHMÄNNER · 7 DER MESSRAUM · 8 DER SCHACHT | Start `ch2.on` · C2_MAIN[1]/Zimmer 7 · Sicherungsraum-Ziel (`zimmer7.js`) · Prüfraum (`feuer.js`/`spinnen.js`) · tod.js-Checkpoint `gang` · AG-07 (`lwo.js`) · Checkpoint `messraum` · `uebergang3_S.phase` |
| 3 (6) | 1 DIE KREUZUNG · 2 JUSTIN · 3 FUNK UND ZÄHLBUCH · 4 DIE LATERNEN · 5 NIMMERHEIM · 6 DER HOHE ABGRUND | `ch3.on` bis `ch3.callDone` · `ch3.met` · Funk-Ziele · `ch3.lampsOff` Fortschritt · `weiss.js` Räume · `weiss_teil2` |
| 4 (6) | 1 DER MORGEN · 2 DAS AMT KOMMT · 3 ACHT SCHLÜSSEL · 4 DIE VILLA · 5 DER KÜHLRAUM · 6 DIE TREPPE | Intro · Nachsorge-Szene · `anwesen_count()`<8 · `anwesen_enterHall` · Kellertür Anrichte · `anwesen_hallEnd` |
| 5 (6) | 1 DER ABEND · 2 HAUS NR. 1 · 3 DIE SPIELUHR · 4 DER STALL · 5 DAS TAPPEN · 6 DAS BETT | `k5.beat` ∈ {veranda…kamera} · {tisch, schleife} · {spieluhr, telefon} · {brot, stall} · `tappen` · {grab, gitter} |
| 6 (6) | 1 DER ZAUN · 2 DER WALD · 3 ZAYNS HÜTTE · 4 TIEFER WALD · 5 DER BAU · 6 DER HOCHSITZ | `K6` Intro · `wald_in` · `WALD.hut` · `TIEF.stand/bus/HUNGRIGE.spuren` · `TIEF.wreck` · Epilog |

### 2.3 Ortsmarken
35 Einträge (`FS-k-OM-nn`, Tabelle im JSON): Zeile 1 Ort in Versalien, Zeile 2 Zusatz (z. B. „NIMMERHEIM · RAUM 2 — Hildes Küche“). Einmal je Ort und Spielstand (MOD_SAVE `fuehrung`), 3 s, unten links über `#batt`; nicht in Jagd, Kino, QTE, Dialog. Abschaltbar über Einstellung „Hilfe“ = aus.

### 2.4 Zielzeilen, Warum, Faden
Bestand: `MAIN`/`C2_MAIN`/`setC3`/`k5_task`/`k6_obj` schreiben in `#objText`; ziele.js liest per MutationObserver; `ZIELE_WARUM` (22 Einträge) und `GEDANKEN_FADEN` (55) hängen per Regex an der Zeilenfassung. Befund (siehe §6): viele Regex hängen an Fassungen, die zur Laufzeit überschrieben werden, und rund 45 Zielzeilen fallen in die Allzweck-Antwort „Was hab ich übersehen? … Tab.“ Die überarbeiteten Zeilen, Warum- und Faden-Texte stehen im JSON (`FS-k-ZL/WA/GF-nn`, je mit `ersetzt` und `regex`). Wichtigste Änderungen: K1 `MAIN[0]` beginnt wieder mit „Finde Haus Nr. 7.“ (repariert das tote Warum); K2 Klavier→Akte konkret; K3 drei Varianten der Laternen-Zielzeile auf eine; K4 bekommt die fehlende erste Zielzeile „Sieh nach Lucy“; K5/K6 bekommen spezifische Fäden statt der Allzweckantwort.

### 2.5 Sprecher-Kennung für Stimmen ohne Figur
Bestand (verifiziert): `subtitle(t, ms, who)`; leeres `who` = Erzähltext ohne Namen; ST_FUNK-Regex in stimmen.js (`FUNK|TELEFON|MAILBOX|BAND|RADIO|ANRUF|LAUTSPRECHER|AMTSSTIMME|KANAL|MHz`) schaltet den Funk-Filter; `ST.wer` (Manifest) bildet Anzeigename → Stimme. Das Manifest hat noch keine Aufnahmen (`z` leer); die Zuordnung ist trotzdem die Schnittstelle.

Regel: **Anzeigename und Stimmen-Schlüssel entkoppeln.** Ein Wrapper in oberflaeche.js (`subShow`, neben den vorhandenen Wrappern Z.206–212) ersetzt nur den *sichtbaren* `.who`-Text über eine Tabelle `SPRECHER_ANZEIGE`. Der an `stimmen.js` übergebene `who` bleibt unverändert. Sonst wird die Zeile still, weil `st_finde` bei unbekanntem Sprecher absichtlich nichts spielt.

| Kennung | Wofür | Beispiel (Bestand → neu) |
|---|---|---|
| `NAME` | Figur im Bild | `LARS VEGAS`→`VEGAS` |
| `NAME · KANAL` | Name bekannt, Figur nicht im Bild (Kanal: FUNK, TONBAND, TELEFON, MAILBOX, HINTER DER TÜR, IM TANK, AM FENSTER) | `LUCYS STIMME`→`TONBAND · LUCY` (Band) |
| `STIMME VON DRAUSSEN` | unbekannt, im Freien | Kap. 1 „… Lu–?“ (bisher leeres `who`) |
| `STIMME AM TELEFON` | unbekannt, im Hörer | Kap. 5 `ANRUF` |
| `STIMME IM FUNK` | unbekannt, Funkkasten | Kap. 3 vor erstem Namen |
| `KINDERSTIMME` → `LUNA` | das Kind: bis Justin den Namen sagt (justin.js `name`), danach LUNA | Kap. 1–3 / ab Kap. 3 UK 8 |

Richtungsmarke (`FS-ALLE-UI-03`): Liegt die Quelle > 60° neben der Blickrichtung, steht vor dem Namen ◀ ▶ ▲ ▼ oder ● (hinter dir). Quelle: `ST.pos`/`st_ort()` in stimmen.js; ohne Ort keine Marke.
Vollständige Liste: JSON `FS-ALLE-SP-01..16`, Zuordnungen an Bestandszeilen `FS-*-SZ-*`.

---

## 3. Erzählfluss je Kapitel

Spalten: **Phase/Beat** · **Ort** · **Was passiert** · **Wer spricht / Quelle** · **Ziel** · **Bisherige Unklarheit** · **Maßnahme**. „UK“ = Unterkapitel der story_final.md.

### Prolog (Traum) und Kapitel-1-Einstieg

| Beat | Ort | Was passiert | Wer/Quelle | Ziel | Unklarheit | Maßnahme |
|---|---|---|---|---|---|---|
| Traum | Traumstraße | Nebel, Kind zählt, Rabe landet, gibt die Fibel | DER RABE (Miras Stimme), Gedanken LUKE | (keins) | Rabe sagt „siebzehn Jahre“, „vor dir selbst“: der Spieler weiß nicht, dass er danach ein konkretes Ziel bekommt | Beat bleibt; Zielsatz des Raben wird mit KK-03 wiederholt |
| Aufwachen | Ortsschild, Regen | „Huh …?“, Fibel in der Jacke | LUKE | – | – | – |
| Fibel-Tour | Fibel-UI | sechs Seiten, je ein Satz | LUKE (Zettel) | – | sechs Seiten, bevor die Welt gesehen ist | bleibt überspringbar (X); keine Verlängerung |
| Mailbox | Handy | Kühns Nachricht | MAILBOX · KÜHN | – | Quelle nur im Namen | Kennung `MAILBOX · KÜHN` (Bestand `KÜHN · MAILBOX`, im Manifest) |
| Einstieg | Ortsschild | Whiskey mit Schlüssel, Gedanken `traum_lucy`, `traum_elf` (13 s), `traum_kum` (26 s), `k1_hotelflur` | LUKE · GEDANKE, Rabe | Finde Haus Nr. 7 | fünf Textereignisse in einer Minute; Pfeile und Ortsschild unerklärt | Reihenfolge fest: Mailbox → Kurzkarte → Kreidepfeil-Gedanke → (Ortsschild bei Blick); `traum_kum` entfällt im ersten Takt und wandert in die Fibel (Fund „Kum, Wîse“ existiert bereits) |

### Kapitel 1 · Keller bleibt zu (Mi 4.11., ab kurz nach elf)

| Phase/Beat | Ort | Was passiert | Wer/Quelle | Ziel | Unklarheit | Maßnahme |
|---|---|---|---|---|---|---|
| 1 Ankommen · UK1 | Ortsschild → Ahornstraße | Zusatzschild, weiße Kreidepfeile nach Osten, Hufeisen, Gestalt am Ostende ruft „… Lu–?“ | Erzählspur; Luke-Gedanke | Finde Haus Nr. 7 | Pfeile unerklärt; Zahl am Schild liest sich als „2110“; Ruf hat keinen Sprecher | `FS-1-KZ-01..04`; `fuehrung_ortsschild.md`; `FS-1-SZ-01` |
| 1 · UK2 | vor Nr. 9 | zwei Männer in Mänteln (AG-02) | Männer, Block | – | wer sie sind, bleibt bewusst offen | nur Kennung `MANN VOM AMT` (Bestand) |
| 2 Das Haus · UK3 | Nr. 7, Briefkasten, Wohnzimmer | Schlüssel, Zettel, Fernseher, Hilde packt die Hand („Nicht du“) | Hilde, Luke | Durchsuche Nr. 7 | Zielzeile nennt „ein Band im Keller“, bevor der Zettel gelesen ist | `FS-1-ZL-03` |
| 3 Kellertür · UK4 | Flur, Keller | Tastenfeld, Stimme dahinter weint | Stimme hinter der Tür (Audio) | Öffne die Kellertür | Stimme hat keinen Namen; Faden wiederholt Zielzeile | Kennung `LUCY?` (Bestand), Faden aus §6 bereinigt |
| 4 Keller · UK5 | Keller | „LUKE, 9“, Tonband, „… danke, Luke …“ | LUCY · TONBAND | Finde im Keller, was Lucy hinterlassen hat | zweiter Faden verdeckt (feuerte nie) | `FS-1-ZL-05/GF-05` |
| 5 Das Licht · UK6 | Straße | Stromausfall, Laternen aus, Hilde im Strahl | Hilde, Kinderstimme von oben | Der Strom ist weg … | Warum-Regex tot | `FS-1-ZL-07` |
| 6 Verstecken · UK7 | Straße, Deckungen | Kegel sucht, Luke versteckt sich | Kinderstimme „Ich seh dich gleich …“ | Versteck dich vor dem Licht | Mechanik nie erklärt (Deckung, Lampe) | Tipp `FS-1-TP-09` |
| 7 Die Wand | Keller | Hand an die Zeichnungen, Wand gibt nach | Luke | Hinter die Bilder … | Warum hing am überschriebenen Text | `FS-1-ZL-09` |

### Kapitel 2 · Das achte Kind (Do 5.11., kurz nach eins bis 03:13)

| Phase | Ort | Was passiert | Wer/Quelle | Ziel | Unklarheit | Maßnahme |
|---|---|---|---|---|---|---|
| Einstieg | Tunnel | Tür fällt zu, Kinderhände, Summen | Erzählspur; Nadeldrucker (am Gerät) | Folge dem Gang | kein Kapitelbeginn im Spielfluss | Kurzkarte (`FS-2-KK-*`) |
| 2 Archiv | Archiv, Zimmer 7 | Akten, Ordnungstafel, Losurne, Dienstbuch | Papier, Luke | Namen ordnen; Zimmer 7 finden | Zielzeile 108 Zeichen | `FS-2-ZL-03` |
| 3 Strom | Sicherungsraum | Lights-Out, Lautsprecher kichert | LAUTSPRECHER · AMT | Strom einschalten | Zielzeile 100 Zeichen | `FS-2-ZL-05` |
| 4 Zelle | Prüfraum 3 | Spinnen, Tafel, Feuerzeug | Tafel, Luke | Schüttle sie ab | zwei Schreibweisen „SCHÜTTEL/SCHÜTTLE“, ZIELE_TAKT erkennt nur eine | `FS-2-ZL-08` |
| 5 Langer Gang | Gang | Peter, Ölfass, Feuer, Rauchflucht | PETER („Bruder.“) | Öl anzünden / Notentriegelung | Generische Fäden | Takt-Zeilen bleiben, siehe §6 |
| 6 Blechmänner | Vorraum | Blechmänner, Atem anhalten | FUNK (Nachsorge) | – | Tastenbelegung (Leertaste) nirgends genannt | Tipp `FS-2-TP-01` |
| 7 Messraum | Messraum | Klavier, Fach, Akte 08, Lucy im Tank | LUCY · IM TANK | Lies die achte Akte | Ziel „Lies die achte Akte“ ohne Ort | `FS-2-ZL-13` |
| 8 Schacht | Schacht | Leiter, Gully, Whiskey | Whiskey, Luke | Leiter hinauf | Faden `/Luke\|Leiter/` zu breit | `FS-2-ZL-17` |

### Kapitel 3 · Ich komme (Do 5.11., 03:13, Zeit steht)

| Phase | Ort | Was passiert | Wer/Quelle | Ziel | Unklarheit | Maßnahme |
|---|---|---|---|---|---|---|
| 1 Kreuzung · UK1–3 | Kreuzung | Glocke, Kuh, Telefon | LUCYS STIMME → KINDERSTIMME | Telefon abnehmen | zwei Zielfassungen | KK-Karte; ZL einheitlich |
| 2 Justin · UK4–5 | Ostende | Justin tritt aus dem Licht | JUSTIN | Sprich mit ihm | Generische Fäden | `FS-3-ZL-03` |
| 3 Funk · UK6–7 | Nr. 7, Funkkasten | Zählbuch, zwei Lucys | LUCY · KANAL A/B | Welche Frequenz? | Kanal-Kennung uneinheitlich | `FUNK · LUCY` |
| 4 Laternen · UK8–10 | vor Nr. 5, 3, 1, 7 | Schaltkästen, Graue | Luna (Kinderstimme) | Laternen löschen | drei Zielvarianten (134/90/89 Zeichen) | `FS-3-ZL-04/05` |
| 5 Nimmerheim · UK11–13 | drei Räume | Rätsel, Hilde, 1312 | HILDE, JUSTIN | Raum-Ziele | Generische Fäden | `FS-3-ZL-08/13` |
| 6 Hoher Abgrund · UK14 | Abgrund | Helm, Wahl A/B/C | JUSTIN, LUNA | Wahl | – | `FS-3-ZL-09` |

### Kapitel 4 · Sehen, Bergen, Schweigen (Do 5.11., Morgen)

| Phase | Ort | Was passiert | Wer/Quelle | Ziel | Unklarheit | Maßnahme |
|---|---|---|---|---|---|---|
| 1 Morgen · UK1–2 | Kreuzung, Nr. 3 | Gully-Rauch, Vegas macht Frühstück | VEGAS | **keine Zielzeile** (Intro springt direkt zur Villa) | Spieler überspringt Vegas | `FS-4-ZL-00` „Sieh nach Lucy“ |
| 2 Amt kommt · UK3–4 | Vegas’ Tür, Nr. 9 | Nachsorge 11/12 | NACHSORGE 11/12 | – | Namenskonvention | Bestand (im Manifest) |
| 3 Acht Schlüssel · UK5 | Ort | Teile suchen, Presse | Whiskey | Dir fehlen noch N … | Generischer Faden | `FS-4-ZL-03` |
| 4–6 Villa · UK6–13 | Halle … Treppe | Nadel, Kühlraum, Wolter, Ring | WOLTER, Mira-Stimme | Ziele je Raum | „Sieh dich um“ allgemein | `FS-4-ZL-02` |

### Kapitel 5 · Iss auf, Bruder (Do 5.11., Abend)

| Phase | Ort | Was passiert | Wer/Quelle | Ziel | Unklarheit | Maßnahme |
|---|---|---|---|---|---|---|
| 1 Abend · UK1–4 | Veranda Nr. 3, Fenster, Nr. 7 | Lucy friert, Kamera, Foto | VEGAS, LUCY | Warte auf der Veranda … | Zielzeilen sehr kurz | `FS-5-ZL-01/02` |
| 2 Nr. 1 · UK5–7 | Nr. 1 | gedeckter Tisch, Schleife | `LUCY?` (die Heimkehrerin) | Nr. 1. Wer deckt da den Tisch? | Generischer Faden | `FS-5-ZL-05` |
| 3 Spieluhr · UK8–9 | Kinderzimmer, Kreuzung | Spieluhr, Telefonzelle | ANRUF | Bring Lucy die Spieluhr | Sprecher „ANRUF“ | `FS-5-SZ-01` |
| 4 Stall · UK10–11 | Stall | Brot, Augen zu | ECHTER LUKE | Warten | Q nicht erklärt | `FS-5-TP-02` |
| 5 Tappen · UK12 | Gärten | „Hinterher.“ | – | Hinterher | Allzweckfaden | `FS-5-ZL-12` |
| 6 Bett · UK13–14 | Friedhof, Gitter | Kerzen, Kleine, Mama | LUNA, ECHTER LUKE | Gedenkfeld | – | – |

### Kapitel 6 · Wendigo (Fr 6.11., kurz nach zwei)

| Phase | Ort | Was passiert | Wer/Quelle | Ziel | Unklarheit | Maßnahme |
|---|---|---|---|---|---|---|
| 1 Zaun · UK1 | Gitter | Wolter, Kombi | WOLTER | Wer parkt hinter dir? | Allzweckfaden | `FS-6-ZL-01` |
| 2 Wald · UK2 | Dustwoods | Brotkrumen, Tiere | Erzählspur | Folge den Brotkrumen | – | – |
| 3 Hütte · UK3 | Zayns Hütte | Wolle, Roter Faden | Jonas’ Zettel | Zayns Hütte | – | – |
| 4 Tiefer Wald · UK4–7 | Hochsitz, Bus, Fraßstelle, Wrack | Stille, Hofer | HOFER?, FUNK von 1992 | Ziele je Ort | Tastenhinweise nur im Faden | Tipps `FS-6-TP-*` |
| 5 Bau · UK8 | Bau | zwei Whiskeys | WHISKEY (mit …) | Lampe/Feuerzeug | – | `FS-6-TP-02` |
| 6 Hochsitz · UK9 | Hochsitz | echter Luke schläft | ECHTER LUKE | Hochsitz, Whiskey wartet | Generisch | `FS-6-ZL-03` |

---

## 4. Einbau (Reihenfolge)
1. `oberflaeche.js`: Anzeige-Alias (§2.5), Richtungsmarke, Textspur-Hinweis (`say_hinweis` zeigt „KLICK · WEITER · X“ derzeit dauerhaft; neu: erste drei Blöcke, danach nur „ENTER · WEITER“).
2. `ziele.js`: `#objPhase`, Reiter „WAS JETZT?“ mit Bisher; ZIELE_WARUM/ZIELE_TAKT aktualisieren (SCHÜTTLE).
3. `gedanken.js`: GEDANKEN_FADEN nach §6 bereinigen und die Regex der JSON-Einträge übernehmen.
4. Zielzeilen in kapitel1.js (Z.589–591, 480, 587), amt.js AMT_ZIEL (Z.40), zimmer7.js, spinnen.js, kapitel3.js/lucy3.js, anwesen.js, kapitel5.js, kapitel6.js.
5. Kapitelkarten (§2.1) und Ortsmarken (neues Modul `fuehrung.js`, MOD_SAVE `fuehrung`).
Abnahme: Selbsttest, der JSON-Regex gegen alle statisch extrahierten Zielzeilen prüft (kein Treffer = Fehler; „Allzweck“ nur für Takt-Zeilen); Leistungs-Gate (`node app/tools/perf_gate.mjs`) vor Commit.

---

## 5. Zielzeilen-Übersicht (Bestand → Neu)
Vollständig im JSON (`art: zielzeile`, 33 Einträge). Länge: vier Bestandszeilen waren > 90 Zeichen (134, 108, 100, 92); alle neuen Zeilen ≤ 90.

---

## 6. Konsistenzprüfung gegen Gedanken-Fäden und Zielzeilen

Geprüft wurden alle 55 `GEDANKEN_FADEN`-Einträge und 22 `ZIELE_WARUM`-Einträge gegen die 102 statisch extrahierbaren Laufzeit-Zielzeilen (aufgaben.json + Überschreibungen in kapitel1.js + `AMT_ZIEL`). Dynamische Zeilen (z. B. `Dir fehlen noch ${n} …`, `Das Brot. Auf den Teller …`) sind lebendig und nicht als tot gezählt.

| # | Befund | Art | Folge | Abhilfe |
|---|---|---|---|---|
| K-01 | `ZIELE_WARUM[0]` `/^Finde Haus Nr\. 7/` trifft keine Laufzeitzeile (`MAIN[0]` beginnt „Lucy hat angerufen: …“, kapitel1.js Z.590). | tot | erste Zielzeile des Spiels ohne Warum | `FS-1-ZL-01` |
| K-02 | `ZIELE_WARUM[5]` `/^Geh wieder nach oben/` — `MAIN[5]` ist überschrieben. | tot | Warum fehlt | `FS-1-ZL-06` |
| K-03 | `ZIELE_WARUM[7]` „Wand mit den Zeichnungen klang hohl“ — Text ersetzt durch „Hilde hat auf die Zeichnungswand gezeigt …“. | tot | Warum fehlt | `FS-1-ZL-09` |
| K-04 | `GEDANKEN_FADEN` `/Das Tastenfeld will vier Ziffern/` wird von `/Kellertür/` verdeckt, gleicher Text. | Doppelung | nie ausgelöst | Eintrag entfernen |
| K-05 | Zweiter `/Lucy hinterlassen/`-Faden („Ein Kassettenrekorder …“) wird vom ersten verdeckt und ist der bessere. | Verdeckung | nie ausgelöst | `FS-1-GF-05` auf neue Zeile `FS-1-ZL-05` |
| K-06 | `/Die Ordnungstafel im Archiv/` verdeckt von `/Namen in die richtige Reihenfolge/`, identischer Text. | Doppelung | – | Eintrag entfernen |
| K-07 | `/Luke\|Leiter/` zu breit: trifft „Atlantschiss … Die Leiter führt zurück“ und liefert „Nach oben. Nicht umdrehen.“ | falscher Treffer | falscher Hinweis in Kap. 3 | Regex `/Die Leiter hinauf\|Luke offen/` |
| K-08 | Allzweckantwort „Was hab ich übersehen? … Tab.“ (`/./`, letzter Eintrag) trifft rund 45 Laufzeitzeilen (K2 Gang/Messraum, K3 Nimmerheim, K4 Villa, K5 Nr. 1/Telefon/„Hinterher.“, K6 Gitter/Hochsitz). | Lücke | Hilfe nur „Tab“ | spezifische Fäden `FS-*-GF-*`; Takt-Zeilen (≤ 14 Zeichen) dürfen generisch bleiben |
| K-09 | `ZIELE_TAKT` kennt `SCHÜTTEL`; spinnen.js sagt `SCHÜTTLE SIE AB` (Präfix passt nicht). | Schreibweise | im QTE als „NEUES ZIEL“ angekündigt (prüfen) | vereinheitlicht, `FS-2-ZL-08` |
| K-10 | Drei Fassungen der Laternen-Zielzeile (134 / 90 / 89 Zeichen; `KAPITEL3_ZIEL_LATERNEN`, lucy3.js, Basis). | Doppelung | wechselnder Text | `FS-3-ZL-04/05` |
| K-11 | Faden `/Das Gitter aufbiegen/` wiederholt die Zielzeile fast wörtlich. | Doppelung | keine neue Information | `FS-6-GF-02b` |
| K-12 | `ZIELE_WARUM[0]` behauptet, die Kreidepfeile „laufen alle zu Hilde Wendt“. Kanon nennt weder Urheber noch Ziel der weißen Pfeile. | Widerspruch zum Kanon-Stand (offen) | Behauptung ohne Beleg | ersetzt durch `FS-1-ZL-01` (Warum) |
| K-13 | K4 hat keine Zielzeile für Vegas/Nachsorge/Nr. 9; Intro setzt direkt „Die Villa Seiler …“. | Lücke | UK1–4 wirken nebensächlich | `FS-4-ZL-00` |
| K-14 | Tab/Fibel wird viermal eingeführt (questPop „Taste Tab – jederzeit nachlesen“, Tour-Schlusszeile, `#hudHint`, Tour-Fund). | Doppelung | Textlast im Einstieg | questPop streichen, HUD-Hinweis bleibt |
| K-15 | Einstieg: bis zu fünf Gedanken/Texte binnen einer Minute (`traum_lucy`, `traum_elf` nach 13 s, `traum_kum` nach 26 s, `k1_hotelflur`, Whiskey). | Dichte | Textspur überlastet | Reihenfolge §3; `traum_kum` in die Fibel |
| K-16 | Kind-Stimme heißt `DAS KIND`, `KINDERSTIMME`, `LUNA`, `???`. | Uneinheitlich | Spieler verbindet sie nicht | Regel §2.5 (Name erst nach Justins Satz) |
| K-17 | Hilde: `HILDE`, `HILDE WENDT`, `FRAU WENDT`; Vegas: `VEGAS`, `LARS VEGAS`, `HERR VEGAS · HINTER DER TÜR`. | Uneinheitlich | – | `FS-ALLE-SZ-01/02` |
| K-18 | Ducken: Tipp-Text nannte „Strg oder C“; `C` ist in Kap. 5 die Kamera (`KEY_HOOKS.KeyC`). | Konflikt | falsche Taste in K5 | Tipp nennt nur Strg |
| K-19 | Kanon Z.743 und Z.893 schreiben „daneben mit Kreide 211“; Nutzerwunsch ist „darunter“. | Kanon-Wortlaut | Darstellung weicht ab | siehe Ortsschild-Dokument; Autor bestätigt (offen) |

---

## 7. Offenes
- Spielerlebnis nicht getestet: alle „Unklarheit“-Spalten sind Code-Lesung.
- K5 `FS-5-SZ-02` (Sprecher der Zeile „Sie ist raus! Barfuß! …“) aus Kontext erschlossen; gegen story_final K5 UK8 verifizieren.
- Phasen-Auslöser (§2.2) nennen Bezeichner, die bei Integration einzeln zu prüfen sind (besonders K3 `ch3`-Zustände und K5 `k5.beat`-Namen).
- Ob Vollkarten für K1/K2 gewünscht sind (derzeit Kurzkarte) entscheidet der Nutzer.
- Stimmen-Manifest: neue Anzeigenamen nur als Alias einführen, sonst werden Zeilen still.

## ENTSCHEIDUNGEN (Koordinator im Auftrag des Autors/Nutzers, 12.10.; Empfehlung = Entscheidung)
1. Ortsschild: Die neue Zahl steht DARUNTER (Nutzerwunsch, Autorenwille); der Kanon-Wortlaut 'daneben' (story_final.md Z.743/893) wird zugunsten des Nutzers überstimmt; Kanon-Text nicht ändern, Darstellung folgt dem Wunsch.
2. Tastenkonflikt C: Ducken bleibt auf Strg (bzw. dessen Belegung), C bleibt Kamera in Kap. 5; Tutorial nennt nur Strg.
3. Kapitelkarten: Kap. 1 Vollkarte (vorhandener Intro-Ablauf, überspringbar), Kap. 2–6 Vollkarte mit 'Bisher' (≤ 3 s, überspringbar mit Klick/Enter/X); Lower-Third nur für Ortswechsel innerhalb eines Kapitels.
4. Neue Sprecher-Anzeigenamen nur als Alias in stimmen.js einführen (unbekannte Sprecher bleiben absichtlich stumm).
5. Vor jedem Einbau: Leistungs-Gate (perf_gate.mjs) grün.


## UMSETZUNG 12.10.2026 (Integrationslauf, im Spiel geprüft)

Module: `app/mods/fuehrung.js` (Zielzeilen-Alias, Warum/Faden, Phasen, Kapitelkarten, Ortsmarken, Sprecher-Anzeige), `app/mods/tipps.js` (Tutorial, Kreidepfeile), generierte Daten `app/mods/fuehrung_daten.js` (aus `fuehrung_texte.json` via `node app/tools/fuehrung_daten.mjs`). Eingriffe: `ziele.js` (Phase + Bisher in „Was jetzt?", SCHÜTTLE), `stimmen.js` (Textspur-Hinweis erst 3×, dann nur „ENTER · WEITER" bei Blöcken > 3 Zeilen; Alias-Tabelle, unbekannte Sprecher bleiben stumm), `textweiter.js` (Enter/Klick/X nimmt Karte und Tipp weg), `bewegung.js` (Ducken/Kriechen/Hochziehen als Tipp, „Strg" statt „Strg oder C"), `traum.js` (3. Einstiegsgedanke „Kum, Wîse" entfällt, steht als Fibel-Fund), `kapitel1.js` (Pfeil-Positionen für den Erklär-Moment, „… Lu–?" als STIMME VON DRAUSSEN), `strasse.js`/`kino.js`/`karte.js` (Ortsschild).

| Baustein | Umsetzung | Beleg | Note | prägnant |
|---|---|---|---|---|
| Zielzeilen | alle Setter schreiben in `#objText`; dort Alias auf die überarbeiteten Zeilen (Eigenschaft am Element). MAIN[0]-Warum lebt wieder („Finde Haus Nr. 7. Lucy hat dich dorthin gerufen." + Warum) | `_wd/out_t2/t2_hud.png`, `out_f1` | 2 | ja |
| Warum/Faden | 12 Warum + 33 Fäden vorn eingefügt; verdeckte Einträge (Tastenfeld, Ordnungstafel) und `/Luke\|Leiter/` entfernt; 3 Allzweck-Fälle behoben (Durchsuche Nr. 7, Wer parkt, Peter/Messraum/Matratze/Justin); Selbsttest `__fuehrung.selftest()`: 33 Zeilen, 0 ohne Faden, 0 > 90 Zeichen | Selbsttest | 2 | ja |
| Phasenanzeige | „KAPITEL n · i VON N · NAME" über der Zielzeile, in „Was jetzt?" und im Pause-Menü; springt nur vorwärts; Quellen: `story.main`, `kapitel3_S.uk`, `villa_S.uk`, `k5.beat`, `K6.beat`, Speicherpunkt-Ids | `out_t2/t2_hud.png`, K4-Bild `out_fe/fe.png` | 2 | ja |
| Kapitelkarten | K1 (nach Mailbox, ersetzt die vierte Tab-Nennung), K2 (ersetzt questPop), K3–K6 über `#intro` (Ort · Zeit, Bisher bei K2/K3, Ziel); Enter/Klick/X weg | `out_t2/t2_karte1.png`, Tafel-Test K3/K4/K6 (Absätze geprüft) | 2 | ja |
| Ortsmarken | 35 Orte, einmal je Ort, 3 s unten links, nie in Dialog/Kino/Jagd | `out_t2/t2_ort.png` (Nr. 7) | 3 (Auslöser der Amts-/K6-Orte aus Checkpoint-Ids und Maßen, nicht alle einzeln abgelaufen) | nein |
| Sprecher | `DAS KIND` → STIMME AM TELEFON / KINDERSTIMME / LUNA (ab Kap. 3 UK 8), `ANRUF` → STIMME AM TELEFON, Hilde/Vegas vereinheitlicht, `… Lu–?` → STIMME VON DRAUSSEN (Stimme über Text, `ST_OHNE`) | Code | 3 (Richtungsmarke ◀ ▶ nicht gebaut) | ja |
| Tutorial | 16 Tipps mit Auslösern, einmalig, gespeichert, Hilfe-Einstellung; Tastennamen im Text werden Tastenkappen; 2 Tipps (Augen zu K2/K5) bewusst nicht doppelt – `augenzu.js` zeigt „Q halten – Augen zu" selbst; Ducken/Kriechen über `bewegung.js` | `out_f1/f1.png` (Bewegung-Tipp) | 2 | ja |
| Kreidepfeile | ein Moment je Farbe: weiß (Gedanke + Fibel-Fund + Aufglimmen, Pfeil < 7 m, ≥ 0,8 s oder 70 s), blau (Briefkasten Nr. 7) | Code, Glimmen nicht im Bild | 3 | ja |
| Ortsschild | Schild 0,72 × 0,46 m, drei Zeilen: 214 zweimal rot durchgestrichen, 211 rot, 210 DARUNTER in Kreide; Zustände 0/1/5; Schreib-Animation (2 Kreidestriche über 211, dann 2-1-0) im Abspann; Karte untereinander; Texte FS-1-SC-01…07 | `out_t2/t2_nahe.png` (vor dem Maßkorrektur-Build), `t2_anim_*` | 2 nach Korrektur (Ziffernhöhe 64/76 px, vorher lief die 0 an den Rahmen); Bild nach Korrektur siehe Abschlusstest | ja |

Offen mit Ursache: Richtungsmarke ◀ ▶ (FS-ALLE-UI-03) nicht gebaut (Quellort `st_ort()` liefert nur für wenige Figuren einen Ort); Kap.-2-Phasen 4–6 stützen sich auf Speicherpunkt-Ids und `C2.x`-Maße; Stimmen-Manifest enthält noch keine Aufnahmen, die Alias-Zuordnung ist daher nur über Code geprüft.
