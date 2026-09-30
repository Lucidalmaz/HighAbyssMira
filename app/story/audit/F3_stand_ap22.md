# Stand AP-22 · Kapitel 5 · Nebenaufgaben – 01.10.2026

Alle sechs Aufgaben stehen mit ihrem Fibel-Namen in der Fibel (`kap: 5`). Jede Startbeschreibung sagt, **warum** Luke das tut. „Der Neunte“ bleibt der Titel der Beobachter-Aufgabe; die Lore aus der Laube heißt „Neun Paar Füße“.

## Module / Anker
- **Neues Modul `neben5.js`**
  - Steht in ORDER nach `kapitel5`. Es hat je ein `WORLD_MODS` und ein `WORLD_TICK`; der Spielstand liegt über `MOD_SAVE` unter `'neben5'` = `{ st }`.
  - Die Kamera-Ziele kommen über `kamera_zielDazu`; `KAP_END[5]` schließt das Kapitel ab.
- **Haken in `kapitel5.js`:** nur ein Aufruf in `k5_telefon` (UK 9), nach Lucys drei Zeilen: `neben5_uk9()`.
- **Alles andere sind Umhüllungen**, die fremden Dateien bleiben unverändert:
  - Briefkasten Nr. 7, Telefonzelle, `albers_talk`: jeweils nach `k5_huellen`.
  - Hildes Laube (Parzelle 7), Nachtschalter, Zapfinseln, roter Kanister, Schrottauto, Schuppentür (post.js): ab Kap. 5.

## Die sechs Aufgaben
1. **Ich bin trotzdem dran** (`k5_jonas`, gestartet von `k5_briefe`)
   - Der Nachttisch im Schlafzimmer von Nr. 7 (neu: Buffet-Scan ohne Aufsatz, 0,6 m) enthält Hildes drei Antworten im Wortlaut.
   - Schreck: Das Telefon in Nr. 7 klingelt zweimal.
   - Am Kasten: Antworten einwerfen, die Fahne geht hoch (echtes Scan-Fähnchen).
   - Whiskey klaut die Briefmarke; Luke tauscht sie gegen einen Kronkorken aus dem Rinnstein („Ich verhandle mit einem Vogel über Porto.“).
   - Lore „Hilde hatte zwei Söhne“.
   - Lucys Jonas-Zeilen kommen in UK 9. Ist die Aufgabe erst später fertig, sagt Lucy sie an Vegas’ Tür.
   - Die Fahne geht mit dem Takt „ende“ und mit `KAP_END[5]` herunter.
2. **Zuletzt neun** (`k5_laube`)
   - Start: Luke kommt der Laube nahe, oder er hat nach UK 9 noch ≤ 1 Bild („Parzelle 7“).
   - In der Laube: Blechdose mit Zettel, **+2 Filme** (setzt `k5.f.laube` und `k5.film`), Schuhkarton „Nächte“ mit dem Neun-Paare-Polaroid (Bild aus `n4_polaBild(1)`, auch im Album).
   - Die Gasleck-Zeile kommt nur, wenn Luke in Kap. 4 Bilder gerettet hat; dazu der Humor-Satz.
   - Beim Verlassen: Die Lampe ist aus, auf der Schwelle liegt Bonbonpapier (`beob_spur`).
   - **Kreuzungsfoto** (`Z.beob = true`, einziger Film-Beweis):
     - Acht Kinder (`gezaehlt_j/_m`) werden einmal angelegt und sind nur im Blitz-Moment sichtbar.
     - Der Neunte steht neben der Telefonzelle (`beob_sichtung` 0,8 s) und ist sofort nach dem Bild wieder weg.
     - Etwa 1 s nach dem Erkennen wechselt das Polaroid in der Hand zum Abzug ohne ihn. Das Album bekommt `bild2` über die vorhandene Album-Hülle, Vermerk „Da war jemand. Jetzt nicht mehr.“
3. **Kinder tanken nicht** (vorhandener Schlüssel `ow_kanister`, damit es keinen doppelten Eintrag gibt)
   - Start nach dem Anruf: mit bekannter Kassette per Gedanke im Wortlaut, sonst an der Zapfinsel.
   - Preistafel-Satz.
   - **Zapfinsel-Foto:**
     - Das Bild zeigt den Jungen (`luke_echt`) mit rotem Kanister (Scan), Vater Kranz hinter dem Kioskfenster (Stellvertreter `vegas`) und Wolter in der Kiosktür.
     - Das Leuchtschild flackert.
     - Danach ist `k5.f.kanisterFoto = true`, damit ist die Stall-Frage frei.
   - Danach ist die letzte Seite im Kassenbuch lesbar (Wortlaut), die Aufgabe ist erledigt. Lore „Der Benzin-Junge“.
   - Der alte Kanister-Rückgabe-Weg ist ab Kap. 5 abgeklemmt (er hätte die Aufgabe ohne Foto geschlossen).
4. **Ein Dorf näher** (`k5_heidi`)
   - Postkarte auf Vegas’ Fensterbrett; Vegas ruft den Satz über Maas.
   - Anruf aus der Zelle mit beiden Fragen, Heidis Alufolie-Frage und dem Schlusssatz.
   - Schreck: Die Zelle klingelt sofort wieder, dann Atem und Papier; bei „miserabel“ spricht Nachsorge 11.
   - Die Karte gibt Luke an Vegas’ Tür an Lucy. Lore „Heidi am Telefon“.
5. **Ist sie’s?** (`k5_dina`)
   - Frau Aydın (eigene LWO-Figur, `window_lean`) erscheint im erleuchteten Ostfenster des Bauernhauses, mit Tiefen-Radierer wie bei Lucy in kapitel5.js.
   - Dina (`ausbau_ost_west_OW.f3.dina`) sitzt auf einem Stuhl-Scan in der Remise.
   - Das Foto blendet die Augenbinde aus; danach Hänschen und Heuballen (kein Film-Beweis) und Dinas Zeilen.
   - Foto ans Fenster, die Haustür geht auf, Humor-Satz, **Börek**. Frau Aydın geht zur Remise. Lore „Dinas Augen“.
   - In UK 12 (Takt „tappen“) fressen Whiskey und Hänschen den Börek, dazu Lukes Satz.
6. **Der gelbe Kasten** (`k5_kasten`)
   - Ein gelber Kasten neben der Telefonzelle (mailbox2-Scan, postgelb, mit Kollision).
   - Maas steht nach UK 9 unter der Laterne (eigene LWO-Figur, Postrad aus post.js geparkt). Er erscheint nur, wenn Luke weit weg ist.
   - Schreck: Die Zelle klingelt einmal, das Rad fällt um. Dazu der Humor-Satz.
   - **Wahl:**

     | Wahl | Vertrauen | Folge |
     |---|---|---|
     | Einwerfen | −15 | Funk „Postversand. Umschlag alt.“; Maas geht zu Fuß, sein Rad liegt bis Kapitelende allein da |
     | Behalten | 0 | Gegenstand `brief_edda` |
     | Zurückgeben | +5 | Maas weint |

   - Danach der Durchschlag der Rechnung (Wortlaut 5.13 mit dem zweiten Kuli).
   - **Weg c:**
     - Das Brecheisen liegt im Kofferraum des Schrottautos.
     - An der Schuppentür „Aufbrechen“: −15 (`schuppen_aufbrechen`), der Schuppen ist offen.
     - Drinnen: leere Kisten, **B-K5-N1** auf dem Hocker, Günther weint an der Tür (`neben4_S.o.gTuer`) und hilft trotzdem, notfalls mit dem Durchschlag.
     - Danach ist `k4_post` erledigt. `k5_kasten` ist bei Weg c erst nach Brief **und** Schuppen erledigt, sonst am Kapitelende.

## Weitere Einlösungen
- **Gasleck** (`neben4_hat('gasleck_zurueck')`): vor Nr. 7 eine neue brennende Kerze, acht Grablichter in einer Reihe und ein neuntes abseits. Alle Kerzen sind beim Laden angelegt (Intensität 0). Beim Näherkommen Lukes Satz „Acht und eins …“.
- **Gisela** steht nach ihrer Szene am Napfbrett (`kirchberg_S.zaun`), nur in Kap. 5.
- **`k4_kreisel`** wird mit dem Polaroid „HEINI“ geschlossen (nur mit Grete-Foto; das HEINI-Bild selbst baut kapitel5.js).

## Kurz geprüft
- `node --check` und `node tools/assemble.js` sind fehlerfrei.
- **Ein** Lauf über `_testgate.sh` mit eigenem Testbau (der Testbau ist wieder gelöscht; Skript `C:/Users/GIGABYTE/_ap22_run.sh`, Schritte in `_ap22_t/mk.js`). Wie bei AP-20 fehlen dort KTX/BVH, deshalb sind Texturen weiß.
- **Bestätigt:**
  - Sechs Titel stehen in der Fibel.
  - Die Hüllen greifen.
  - Die Kerzen sind da (10 sichtbar), Gisela steht am Zaun.
  - **Zuletzt neun komplett:** +2 Filme, Album, Kreuzungsfoto mit `beob: true`, ein Abzug ohne den Neunten ist entstanden, der Neunte ist danach unsichtbar. Das Polaroid zeigt die Kinder im Ring.
  - **Kinder tanken nicht komplett:** Foto, `kanisterFoto`, Kassenbuch.
  - Heidi: Karte, Anruf und Rückruf laufen.
  - **Maas-Szene:** Wahl, Rad fällt (1,42), Durchschlag.
  - Kapitelende: Fahne unten, Kasten erledigt.
  - Lichter 18 vor und nach dem Lauf.
- **Nicht bestätigt**, weil der Test meine eigenen Auto-Szenen überlappen ließ („Acht und eins“ und Maas liefen gerade, als der nächste Schritt kam; das ist ein Testfehler, kein Spielfehler):
  - Jonas-Kette (Nachttisch → Einwurf → Whiskey/Kronkorken).
  - Heidis Karte an Lucy.
  - Frau Aydın und das Dina-Foto: Das zufällige Testfoto zeigte die Remise-Wand, aber **keine Dina**. Bitte im Gesamttest prüfen, ob Dina auf dem Stuhl (−123,6 | −35,4) sichtbar sitzt und der Stuhl richtig herum steht.
  - Der Einbruch in den Schuppen.

## Offen / Politur
- **Fehlende Assets** (Rückfall gebaut):
  - Posteinwurf-Kasten: postgelber Briefkasten-Scan.
  - Brecheisen: nur als Gegenstand.
  - Tupperdose: nur als Gegenstand.
  - Nachttisch: flaches Buffet.
  - Vater Kranz: Stellvertreter `vegas`.
  - Gestreifter Schlafanzug des Jungen: `luke_echt` so wie er ist.
- Die Postfahne unten ist im Abspann `k5` nicht im Bild, weil die Kranfahrt Nr. 7 nicht zeigt. Die Fahne ist trotzdem unten.
- AP-21 umhüllt `/^Laube/` bei (−107,2 | 25). Dort gibt es keine solche Klickfläche; das Log sagt „nicht gefunden“. Hildes Laube (−122,8 | 36,2) übernimmt jetzt neben5 samt Filmen. Die Zeile in kapitel5.js kann weg.
- Wenn Luke nach UK 9 nie wieder an die Kreuzung kommt, verpasst er Maas. Die Aufgabe schließt dann am Kapitelende als „zu“, außer bei Weg c.

## Bitten an andere
- **Hauptagent / Gesamttest:**
  - Dina in der Remise.
  - Frau Aydın im Fenster (Radierer).
  - Liegendes Postrad.
  - Die acht Kinder und der Neunte auf dem Kreuzungsfoto, jeweils mit echten Texturen.
  - Einmal die Jonas-Kette mit Whiskey.
- **AP-23 (Kap. 6):**
  - `polaroid_heini` ist Gegenstand (Tauschmittel AG-18), `k4_kreisel` ist dann erledigt.
  - Maas’ Rad liegt nur bis zum Ende von Kap. 5 (Einwurf-Weg: `neben5_S.st.kasten.brief === 'a'`).
