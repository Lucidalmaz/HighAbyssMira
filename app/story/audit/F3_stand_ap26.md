# Stand AP-26 (Schreckbudget, Atempausen, Stimmen) und AP-27 (Kapitel 7 · Vorbereitung), 01.10.2026

## AP-26 · gebaut

**`spannung.js` (Regie)**, die vollständige Schnittstelle steht im Modulkopf.
- **Tabelle 5.6** liegt als `SP_BUDGET` vor: Dreier und Atempausen je Kapitel.
- **Stufen 1/2/3:**
  - Aufrufe: `spannung_schreck(stufe, id)`, `spannung_dreier(id)`, `spannung_peak()` (Skript-Höhepunkt, zählt als Stufe 3) und `spannung_mark('welt1'|'welt2'|'peak3')`.
  - `spannung_mark` wurde bisher an 12 Stellen aufgerufen, war aber nirgends definiert. Diese Aufrufe wirken jetzt.
- **Diese Dreier werden ohne Zutun erkannt:**
  - die Kinosequenzen `k1h`, `k2a`, `k2b`, `k3kuh` und `k3blinzeln`
  - über eine Namens-Hülle: `kapitel1_nichtDu`, `kapitel1_danke`, `spiderEvent`, `villa_hoehepunktA/B`, `k5_augenAuf`, `k6_ag20` und `hungrige_finale`
  - jeder große Stinger zählt als Stufe 3, jeder Schreckklang als Stufe 2
  - steigt `scareCount`, öffnet das nur eine Atempause und setzt keinen Höhepunkt.
- **Atempausen (A-28):**
  - Nach Stufe 2 oder 3 öffnet die Regie eine Pause. Verteilung: 50 % Lacher über `gedanken_atem` (A-01 … A-25), 30 % Stille (mindestens 20 s kein Gedanke), 20 % Ruhe mit Riss (nach 25 s eine Stufe-1-Anomalie).
  - Zeilen mit Anlass kommen nur nach genau diesem Schreck: Kuh, Blinzeln, Beobachter-Geräusch, Polaroid, Stille-Zone, Whiskey, Lampe und Pat/Patachon.
  - Skript-Pausen melden sich mit `spannung_pause(id)`.
- **Abnahme „zwischen zwei Dreiern immer eine Atempause“:**
  - Solange eine Dreier-Pause offen ist, ist jeder Zufalls-Major gesperrt.
  - Kommt trotzdem ein Dreier ohne Pause dazwischen, landet er in `SP.verstoss`. Abfrage über `__spannung.pruefe()`.
  - Dreier, die weniger als 45 s auseinanderliegen, gelten als eine Sequenz (Kap. 5: Atem + Polaroid).
- **Abnahme „nach Stufe 3 schweigt der Beobachter 2–3 min“:**
  - Jeder Höhepunkt setzt `SP.peak`. `beobachter.js` setzt daraufhin `peakUntil` auf 120–180 s; das ist vorhanden.
  - Bei Kino-Dreiern wird der Höhepunkt am Ende des Films noch einmal gesetzt.
  - Der Nachklang dauert nach Stufe 2 60 s und nach Stufe 3 120 s; in dieser Zeit gibt es keine Minor- oder Major-Ereignisse.
- **Sperrliste trauriger Szenen**, abfragbar mit `spannung_traurig()` (wird von `beobachter.js` und `gedanken.js` gelesen):
  - `hilde_strahl` (Kino k1h)
  - `tank` (Kino k2b und `CH2_END`)
  - `peter_tod` (`feuer_S.zs.st === 'nick'`)
  - `echter_luke` (`k5_stallSzene`, `k6_hochsitz`)
  - `mamas_kerze` (`k5_kerzeAnzuenden`)
  - In diesen Szenen gibt es keinen Lacher (Luke bleibt still), keinen Zufallsschreck und keine Präsenz.
  - Weitere Aufrufe: `spannung_trauer(id, sek)` und `spannung_trauerAn/Aus(id)`.
- **Stinger-Diät (A-26/5.9):**
  - `scareSound('scream')` gibt es nicht mehr (Luna schreit nie, 02 H4). Stattdessen kommt Atem am Ohr mit einem Ton-Abriss.
  - Geige und Kreischen spielen außerhalb des Kinos höchstens einmal je Kapitel, danach nur noch ein Ton-Abriss von 0,4 s.
  - Große Stinger behalten den Abstand aus `klang.js`; das Budget ist nicht doppelt gedrosselt.
- **Untertitel (A-25):**
  - Erzählende Angst-Untertitel ohne Sprecher („Hinter dir: …“, „Irgendwo hinter dir: ein Kichern …“ und weitere) entfallen.
  - Mit **`settings.geraeusche`** erscheinen sie als „[Geräusch]“. Die Einstellung heißt im Menü „Geräusche als Untertitel (Barrierefrei)“ und ist standardmäßig aus. `k5_geraeusch` aus AP-21 liest sie schon.
  - Für andere Module gibt es `spannung_geraeusch(text)`.
- **Grusel-Vergleich 5.1–5.9:**
  - 5.1: Phasen über `spannung_phase()`, Skripte setzen sie mit `spannung_phase(n, grund, sek)`. In der Jagd laufen nur Jäger und Atem, im Kino gar nichts.
  - 5.2: Stressmodell `SP.stress`, gelesen von `spannung_k()`. Lange Ruhe gibt die Präsenz frei, lange hoher Stress sperrt 45 s lang Minor-Ereignisse. Gedanken sind ab 0,7 gesperrt. Herzschlag und Vignette macht weiter die Basis (`fear`), damit nichts doppelt läuft.
  - 5.3: Präsenz ohne Kontakt, nur als Klang, mindestens 12 m entfernt, im Augenwinkel oder hinter Luke. Je Kapitel: Kombi-Tür (1), K-1 hinter der Wand (2), Graukind-Kichern (3/5), Ketten (4), wandernde Stille (6).
  - 5.4: falsche Sicherheit einmal je Kapitel, ausgelöst drinnen oder über `spannung_safe(zone)`.
  - 5.5: leere Stille höchstens zweimal je Kapitel.
  - 5.6: `spannung_laerm()` und `spannung_sicht()`. Dreht sich der Spieler oft um, kommt nichts mehr „hinter dir“. Nach langem Lesen gibt es mit 30 % ein Knarren; nach der Fibel einmal je Kapitel.
  - 5.7: Gewöhnungsschutz (Abstand ×1,8).
  - 5.8: das Kapitel kommt aus `kap()`, die Abstände sind [—, 85, 70, 60, 75, 55, 50].
- **Slapstick:**
  - S-08 „Montag!“ läuft hier als Atempause: Kap. 1, frühestens 150 s nach W-03. Whiskey macht dabei den Chef nach (`WHISKEY_MIMIC.montag`).
  - S-02 „Inhaltsverzeichnis“ steckt in `albers.js` (Ordner Kap. 3).
  - Schon vorhanden: S-01 (`whiskey.js`), S-03 (`kirchberg.js`), S-04 (`lwo.js`/`neben4.js`), S-09 (`nr4.js`), S-10 (`whiskey_zoll`).
- **Spielstand `spannung`:** Stinger je Kapitel, falsche Sicherheit, leere Stille, Fibel und Slapstick.

**`gedanken.js`**
- `GEDANKEN_SCHRECK` ist durch **`LUKE_ATEM`** (A-01 … A-25, wortgleich) und `gedanken_atem(anlass)` ersetzt. Die Reaktion auf `scareCount` ist entfallen; das macht jetzt die Regie.
- **`LUKE_BLICK`** enthält U-01 … U-104 und KZ-01 … KZ-15, wortgleich aus 85 §2, nach Objektart:
  - Format: `[Kennung, Unterart, Text, { ab, bis, g }]`. Die Kapitelsperre läuft über `kap()`.
  - `gedanken_blick(art, unterart, o)` spricht jede Zeile einmal. Mit `o.wort` sagt Luke beim zweiten Blick nur das Objektwort.
  - Generisch angeschlossen: Klopfen an verschlossene Häuser (U-01), die erste Batterie (U-65), Stehenbleiben an einer Laterne (U-14/15/16, U-19 ab Kap. 3), eine Katze tragen (KZ-04/05/07/09 und frei) und eine Katze, die auf eine Beobachter-Spur starrt (KZ-02/15).
- Die Ausgabe ist gesperrt bei Stress > 0,7 und während einer stillen Atempause. Story-Gedanken mit Priorität 3 kommen immer durch.

**`albers.js`**
- Vegas **V-07 … V-13** stehen in `ALBERS_TALKS`, wortgleich aus 85 §3; bei V-12 antwortet Luke.
  - V-07 … V-10 laufen in Kap. 3 an der Straße.
  - V-11/V-12 in Kap. 4 und V-12/V-13 in Kap. 5 laufen über die Haustür (`doorOf[3]`).
  - Die alten Gespräche t1–t5 sind jetzt auf Kap. 3 begrenzt.
- **Bitte aus AP-25 erledigt:** V-03 und V-06 sind in Kap. 1 verpassbar. Ab Kap. 3 holt Vegas sie an der Tür nach und trägt sie dann auch in `albers_K1.v` ein.
- Neue Behauptungen v07 … v12 mit Belegen: AG-14, `k3_hw`, Zettel B-K3-01, AG-10, `neben4_hat('post_ab')` und `ow_schichtbuch`.
  - V-13 bekommt keine Behauptung. Sein Beleg kommt erst in Kap. 6, der Faden gilt aber nur für Kap. 1–5.

**`schrecken.js`** (A-27, eine Bedingung): Die laufende kleine blasse Waldgestalt erscheint erst ab Kap. 3, damit sie nicht als Beobachter gelesen wird (Test-Checkliste m).

## AP-27 · vorbereitet (in `kapitel.js`, nichts gebaut)
- `kap()` kennt 7. Kapitel 7 ist gesperrt: `kapStart(7)` tut nichts, `KAP7.gebaut = false`.
- Die Signatur mit einem Punkt liegt als `KAP7.sig1` vor und ist ungenutzt. Dieselbe gibt es schon als `BEOB_SIG1` in `beobachter.js`, dort ebenfalls nirgends benutzt.
- Der Stub `kap7_haeltHand(an)` setzt `BEOB.seenMax = Infinity`, schaltet also die Ein-Sekunden-Regel ab. Er wirkt nur, wenn Kapitel 7 gebaut ist und läuft.
- Schlüssel `kleine` → `graukind`: Das ist schon erledigt. `figuren.js` setzt `graukind` auf den Asset-Ordner `kleine` um, und `mira` benutzt keine Figur.
- Flags, die Kap. 7 liest, über `kap7_flags()`:
  - `dose` (`cleo_dose`), `lampion`, `kassette` (`zayn_kassette`)
  - `falle` (`K6.falleWeg`/`beob_S.falle`), `zaehlbuch` (`lwo_S.auftrag1`/`villa_S.zaehlbuch`, 02 I1)
  - `heini` (`lwo_S.seen.heini`), `neunte` (alle 19 Orts-Zettel).
  - Am Ende von Kap. 6 entsteht ein Schnappschuss in `KAP_END[6]`, gespeichert unter `kapitel.k7`. Testzugriff: `__kap.k7()`.
- „Der Neunte“ ändert zwei Sätze, abgelegt in `KAP7.neunte`: den Beobachter-Satz wortgleich und die warme Murmel. Den Wortlaut der Murmel muss der Autor noch festlegen.
- **grep-Abnahme:** „UNSER GESTERN“, „STEIGT DAS HAUS“, „NIE GESCHRIEBEN. BIS JETZT“, Preis, Riss-Wahrheit und Ein-Punkt-Zettel kommen in `mods/*.js` und `game/index.html` nicht vor. Die einzigen Treffer sind „Preistafel“ und „steigender Preis“ (A-03) sowie Kommentare zu `BEOB_SIG1`.
- **`raender.js`** steht in `ORDER`, aber es gibt keine Datei, und der Zweck ist unklar. Nicht angefasst; das muss der Autor klären.

## Kurz geprüft
- `node --check` für alle fünf Dateien, dann `assemble` und `build`. Ein Selbsttest gegen `app/game`; der erste Lauf traf noch eine alte Kopie, weil `node build.js` fehlte.
- Ergebnisse des Selbsttests:
  - Alle Schnittstellen sind da, und `__kap.k7()` liefert Flags.
  - Die Einstellungszeile erscheint.
  - Der Angst-Untertitel ist standardmäßig weg und erscheint im Barrierefrei-Modus als „[Kichern, leise, hinter dir]“. Normale Untertitel bleiben unverändert.
  - Ein Dreier öffnet die Pause (Lacher, Anlass k3kuh) und sperrt Majors. Ein Dreier ohne Pause wird als Verstoß protokolliert, mit Skript-Pause gilt er als ok.
  - „Trauer“ macht die Pause still, die Phase wechselt in den Nachklang.
  - `gedanken_blick('tuer','zu')` liefert U-01; U-19 bleibt in Kap. 1 gesperrt.
- Keine Fehler aus meinen Modulen.

## Offen / Bitten an andere
- **Kapitel-Module (AP-14 … AP-24):**
  - Die Atempausen aus Tabelle 5.6 (Pat und Patachon, Lesebrille, „Hey, Großer.“ …) sollten `spannung_pause('<name>')` melden. Bis dahin füllt die Regie die Pausen selbst.
  - Für AG-19, den Hirsch einen Meter vor Luke und Hofers drei Stimmen fehlen gezielte `spannung_dreier('k6_ag19'|'k6_hirsch'|'k6_hofer')`. Bisher werden sie nur über `stinger(true)` erkannt.
  - A-15 (Whiskey erschreckt Luke), A-16 (Lampe fällt) und A-25 (Pat/Patachon hinter Luke) brauchen `spannung_schreck(2, 'whiskey'|'lampe'|'patachon')` an ihrer Stelle.
- **Interieur-Agent:** Gezielte Objekte (Kühlschrank, Spiegel, Uhr 03:13, Puppe, Telefon …) können mit `typeof gedanken_blick === 'function' && gedanken_blick(art, unterart, { wort: true })` reden. Die Arten und Unterarten stehen in `LUKE_BLICK`.
- **Kreaturen-Agent:** `spannung_laerm()` und `spannung_sicht()` (5.6) für den Wendigo, den Blechmann und den Abstand des Beobachters nutzen. Die freie Jagd des Wendigo (A-20) gehört in `hungrige.js`.
- **Nicht gebaut**, weil Ort oder Modell fehlen:
  - Slapstick S-05 „Dienstverpflegung“ (Kombi-Szene AG-15 mit N11/N12, `lwo.js`/`kapitel5.js`)
  - S-06 „Drehtür“ (an der Tankstelle gibt es keine Drehtür)
  - S-07 „Bewegungsmelder“ (Nr. 1 ist hohl, an der Garage gibt es keine Lampe)
  - 5.5 „Vakuum vor Dreiern“ (Skripte müssten ihren Dreier vorher anmelden)
  - A-30 „keine Speicherpunkte in Jagden“ (gehört zu den Kapitel-APs)
- **Fremder Fehler, nicht von mir:** `album.js:570` sucht `P.querySelector('.close:last-child')` und erwischt das `.close`-Span in der Zeile „Helligkeit kalibrieren“. Das löst bei jedem Öffnen der Einstellungen „Uncaught NotFoundError: insertBefore“ aus, und die Album-Tastenzeilen fehlen. Lösung: `':scope > .close:last-child'`.
- **Verhaltensänderungen:** Die Jagd und das Kino sperren jetzt auch die Umgebungs-Planer (5.1). Die 12 bisher wirkungslosen `spannung_mark`-Aufrufe setzen jetzt Höhepunkte (Nachklang, Beobachter-Schweigen).
- Keine neuen Assets nötig.
