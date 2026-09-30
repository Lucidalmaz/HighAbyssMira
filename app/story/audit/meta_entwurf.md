# Randnotizen – Meta-Ebene („RÄNDER“)

Stand: 29.09.2026 · Grundlage für Welle 3, Paket W3-P12 (`app/mods/raender.js`, neu). Abhängig von Welle 2 (siehe Spalte „braucht“), weil jede Notiz im fertigen Spiel **wörtlich stimmen** muss.

---

## 1. Entwurf aus dem Audit (wortgleich übernommen)

Meta note draft from the audit (keep it in meta_entwurf.md, adjusted): 25 „Randnotizen“, signature „— lw“, a second hand „LW“; phases unheimlich → Widerspruch → Anrede → KI → persönlich → Realität → Paranoia; distribution Start 1 · K1 9 · K2 3 · K3 5 · K4 2 · K5 1 · K6 3 · Epilog 1; hiding techniques: flashlight glint of a paper clip only within ~2.5 m at flat angle, after a specific action, from a specific angle, time window, on return to a finished place; paper types A Baunotiz Karopapier Schreibmaschine „BN-Nr.“, B gelber Haftzettel Filzstift, C Thermobon, D Karteikarte, E Drehbuchseite Rotstift, F Spiralblock Bleistift persönlich, G weiß auf weiß, H zweite Hand „LW“ blaue Tinte; rules: no new world facts, predictions must be literally true in the build, dates 2025–05.11.2026, no OS tricks/system time/user name/files, no items, stored under own MOD_SAVE key 'raender' not story.lore, journal tab „RÄNDER“ without total count after the 3rd note, phase gating (≥2 notes of previous phase + minimum chapter). Example texts: #1 Ortsschild-Pfosten „BN-001 · 14.03.2025 / Startpunkt: Ortsschild. Er wacht auf der Straße auf, nicht im Auto. / TODO: Regen lauter. Er soll sich fragen, wie er hergekommen ist. / Nicht, wer ihn hergebracht hat. / — lw“; #3 under the strap chair after the tape „BN-031 · Gurtstuhl / Riemen gehen nach dem Band auf. Nicht vorher. / Wenn sie vorher offen sind, hat jemand die Reihenfolge geändert. / Nicht ich. / — lw“; #7 feather note at Whiskey's first lantern „Rabe: gekauftes Modell, 17 Animationen. / Irgendwann sitzen zwei davon auf einem Pfahl. / Ich hab nur einen gekauft. / — lw“; #13 chair 8 under part 08 „Im Fach liegt Akte 08. Du liest sie gleich. / Bitte lies sie nicht. / (Die einzige Zeile hier, die ich nicht löschen kann.) / — lw“; #18 room 3 white on white „Ende A. Ende B. Ende C fehlt. / Nicht, weil ich es vergessen habe. / Solange ich zusehe, darfst du es nicht wählen. / — lw“; #21 „KAPITEL 5 / (bleibt frei) / Das hab ich nicht geschrieben. Es stand schon da, als ich die Datei öffnete. / Seitdem ist die Seite jeden Morgen ein bisschen weniger leer. / — lw“ (adjust since chapter 5 now exists — e.g. make it about chapter 5 having been empty); #24 counter-note „Die Zettel mit ‚lw‘ sind nicht von mir. / Ich unterschreibe nie klein. / Wenn einer schreibt, er hat etwas nicht eingebaut: er lügt. / Einer von uns. / — LW“; #25 epilogue dialog „lw: Du hast alle gefunden. Das war nicht vorgesehen. / LW: Doch. Das war das Einzige, was vorgesehen war. / lw: Hör nicht auf ihn. / LW: Hör nicht auf dich.“. Write all 25 fully (German), each with chapter, exact location (coordinates/object from the code), hiding technique, trigger condition, paper type, text, and which real in-game event it foreshadows.

---

## 2. Anpassungen gegenüber dem Entwurf (und warum)

| # | Entwurf | Anpassung | Grund |
|---|---|---|---|
| 18 | „Ende C fehlt. … Solange ich zusehe, darfst du es nicht wählen.“ | „Ende C gibt es nur für die, die gesucht haben. Ich hab es nicht vergessen. Ich hab es versteckt. Hinter der Birke. Wie er.“ | Ende C existiert jetzt (PK-C K3-10) und erscheint nur mit ≥ 3 Versteck-Hinweisen. „Fehlt“ wäre im Build falsch. |
| 21 | „Das hab ich nicht geschrieben. Es stand schon da … jeden Morgen ein bisschen weniger leer.“ | „So stand es monatelang in der Datei. Eines Morgens stand da ein Tisch. Vier Teller. Ich hab ihn nicht gedeckt.“ | Kapitel 5 existiert jetzt und heißt „Der gedeckte Tisch“. „(bleibt frei)“ stand wörtlich in `story_final.md`. |
| 1, 3, 7, 13, 24, 25 | – | unverändert | stimmen im Build (Rabenmodell `animal_crow` hat genau 17 Animationen, geprüft 29.09.) |
| alle | – | Datum in jeder BN-Notiz zwischen 14.03.2025 und 05.11.2026 | Regel |

---

## 3. Regeln für die Umsetzung (bindend)

1. **Keine neuen Weltfakten.** Die Notizen reden über das Bauen des Spiels, nicht über Lost Eyengless. Jede Aussage über das Spiel muss im Build **wörtlich stimmen** (Spalte „stimmt, weil“).
2. **Daten** nur zwischen 2025 und dem 05.11.2026.
3. **Keine OS-Tricks:** keine Systemzeit, kein Benutzername, keine Dateien lesen, keine Fenstertitel, kein Zwischenspeicher. Nichts, was außerhalb des Spiels nachsieht.
4. **Keine Gegenstände**, keine Belohnungen, keine Hilfen. Nie blockierend, nie Pflicht. Einziger Ton: Papierrascheln (`Audio.paper`).
5. **Speicher:** eigener Schlüssel über `MOD_SAVE.push(['raender', holen, setzen])` – `{ found: [Nummern], read: [Nummern] }`. **Nicht** in `story.lore`. Kein Zeitstempel (keine Systemzeit).
6. **Tagebuch-Reiter „RÄNDER“** erscheint ab der **dritten** gefundenen Notiz. Er zeigt die gefundenen Notizen in Fundreihenfolge, **nie eine Gesamtzahl** („x / 25“ ist verboten), keine leeren Plätze.
7. **Phasen-Sperre:** Eine Notiz liegt nur aus, wenn (a) mindestens **zwei Notizen der vorigen Phase** gefunden sind und (b) das Mindestkapitel erreicht ist (`kapAb(n)`, Paket W2-P0). Phase 1 hat keine Vorbedingung. Phase 6 hat nur zwei Notizen – für Phase 7 braucht es beide. #25 braucht alle 24.
8. **Verstecktechniken** (`T1`–`T5`):
   - **T1 Büroklammer-Glanz:** Die Notiz ist unsichtbar klein, nur eine Büroklammer glänzt – und nur, wenn die Taschenlampe an ist, die Entfernung ≤ 2,5 m beträgt und der Lichtkegel **flach** auf die Fläche fällt (Winkel zwischen Blickrichtung und Fläche ≤ 25°). Kein Hinweis-Marker.
   - **T2 Nach einer Handlung:** Die Notiz wird erst angelegt, wenn eine bestimmte Handlung erledigt ist.
   - **T3 Aus einem Winkel:** nur sichtbar, wenn die Kamera in einem bestimmten Winkelbereich steht (Punktprodukt-Prüfung, einmal pro 0,25 s, keine Allokation).
   - **T4 Zeitfenster:** nur zwischen zwei Story-Zuständen vorhanden.
   - **T5 Rückkehr an einen erledigten Ort:** erst, wenn der Ort abgeschlossen ist und der Spieler ihn danach noch einmal betritt (Eintritt in einen Radius, nachdem er ihn verlassen hatte).
9. **Papierarten** (Canvas-Texturen, beim Laden erzeugt; Leseansicht über `openNote` mit eigener Schrift):
   - **A** Baunotiz: Karopapier, Schreibmaschine, Kopf „BN-Nr. · Datum“
   - **B** gelber Haftzettel, schwarzer Filzstift
   - **C** Thermobon: schmal, verblasst, Nadeldruck-Schrift, Großbuchstaben
   - **D** Karteikarte: liniert, roter Kopfbalken, Kugelschreiber
   - **E** Drehbuchseite: Courier, Szenenkopf, Anmerkungen mit **Rotstift**
   - **F** Spiralblockblatt, abgerissen, Bleistift, persönlich, durchgestrichene Wörter
   - **G** weiß auf weiß: blindgeprägte Schrift, nur im Streiflicht lesbar
   - **H** zweite Hand: „LW“, blaue Tinte, Großbuchstaben, gerader Druck

---

## 4. Die 25 Randnotizen

Koordinaten (x / y / z) in Weltkoordinaten. `X/Z` = Amt (600 / −2600), `X3/Z3` = das Weiße (−600 / −2600), `H` = Villa-Halle (−900 / 900), `B` = Keller Nr. 7 (300 / 300), `Y` = 0,43.

### Phase 1 · unheimlich (keine Vorbedingung)

**#1 · Start · Papier A · T1**
- **Ort:** Pfosten des Ortsschilds (Schild bei −72 / 2,1 / 6,2), Notiz am Pfosten auf 1,0 m Höhe, Westseite.
- **Auslöser:** ab dem Aufwachen auf der Straße (`traum_awake` fertig), Kap. ≥ 1.
- **Text:**
  > BN-001 · 14.03.2025
  > Startpunkt: Ortsschild. Er wacht auf der Straße auf, nicht im Auto.
  > TODO: Regen lauter. Er soll sich fragen, wie er hergekommen ist.
  > Nicht, wer ihn hergebracht hat.
  > — lw
- **Stimmt, weil:** Luke wacht im Regen auf der Straße auf (`traum.js`, „Warum stehe ich … auf der Straße?“).
- **Vorhall:** Twist 1 – die Kleine hat ihn mit Lucys Stimme hergelockt.

**#2 · Kap. 1 · Papier B · T2**
- **Ort:** Briefkasten Nr. 7, innen an der Klappe (28,4 / 1,1 / −5,9).
- **Auslöser:** nachdem der Schlüssel genommen ist (`state.hasKey`), beim nächsten Öffnen des Briefkastens.
- **Text:**
  > Schlüssel: Briefkasten.
  > Rabe pickt vorher dran. Sonst findet ihn keiner.
  > Keiner soll merken, dass der Rabe hilft.
  > — lw
- **Stimmt, weil:** Whiskey-Station `briefkasten` mit `peck: true` (`whiskey.js`).
- **Vorhall:** Kap. 6 – Whiskey rettet Luke.

**#3 · Kap. 1 · Papier A · T2**
- **Ort:** unter dem Gurtstuhl im Keller (B.x − 1 / 0,02 / B.z = 299 / 0,02 / 300).
- **Auslöser:** nach dem Tonband (`state.heardTape`), wenn die Riemen offen sind.
- **Text (wie Entwurf):**
  > BN-031 · Gurtstuhl
  > Riemen gehen nach dem Band auf. Nicht vorher.
  > Wenn sie vorher offen sind, hat jemand die Reihenfolge geändert.
  > Nicht ich.
  > — lw
- **Stimmt, weil:** vor dem Band „Die Riemen sind geschlossen“, danach offen (Stuhlschreck „… danke, Luke …“).
- **Vorhall:** Twist 1 – Luke hat sie herausgelassen.

**#4 · Kap. 1 · Papier C · T4**
- **Ort:** Telefonzelle an der Kreuzung (Zelle bei 8 / 0 / 7,6), in der Münzrückgabe (8,2 / 1,0 / 7,3).
- **Auslöser:** nur in den 60 s nach dem Kinderanruf (Nebenaufgabe „Der Anruf“ gerade erledigt); danach weg.
- **Text:**
  > THERMOBON · TELEFONZELLE KREUZUNG
  > ANRUF EINGEHEND · 1
  > STIMME: KIND · SPIELUHR: KEINE
  > Ton so lassen. Er ist Tontechniker. Er hört das.
  > — lw
- **Stimmt, weil:** Der Anruf ist die Kinderstimme „ohne Spieluhr, nur Rauschen“; Luke ist Tontechniker (Kanon).
- **Vorhall:** Twist 7 – der echte Luke (Kap. 5).

### Phase 2 · Widerspruch (≥ 2 aus Phase 1)

**#5 · Kap. 1 · Papier D · T3**
- **Ort:** Spiegel im Elternschlafzimmer Nr. 1 (−44,2 / Y + 1,6 / −20,35), Karte steckt zwischen Rahmen und Wand; nur die Kante ist sichtbar, und nur **vom Bett aus schräg** (Kamera im Bereich x −47,5…−46, z −21…−19,5).
- **Auslöser:** nachdem Luke in den Spiegel gesehen hat (`onceFlags.mir`).
- **Text:**
  > KARTEI · SPIEGEL NR. 1
  > Spiegelbild: ein Herzschlag zu spät. Absicht.
  > Augen im Spiegel: braun. Augen auf dem Familienfoto: blau.
  > Kein Fehler. Nicht korrigieren. Auch wenn er fragt.
  > — lw
- **Stimmt, weil:** Spiegel-Text „Braune Augen … das Spiegelbild einen Herzschlag später“ (`innen_ort.js`), Familienfoto mit blauäugigem Jungen.
- **Vorhall:** Twist 4 – Akte 08.

**#6 · Kap. 1 · Papier B · T5**
- **Ort:** Küche Nr. 7, hinter Hildes Zettel am Kühlschrank.
- **Auslöser:** Zettel gelesen, Küche verlassen, zurückgekehrt.
- **Text:**
  > Der Zettel am Kühlschrank hat mal die Lösung verraten.
  > Jetzt steht da nur noch: Egal mit welcher Stimme.
  > Wer hat die Lösung reingeschrieben? Ich nicht.
  > Wer hat sie wieder rausgenommen? Auch nicht ich.
  > — lw
- **Stimmt, weil:** Der Zettel lautet nach W2-P3 (PK-G T8) „KELLER BLEIBT ZU. Egal wer ruft. Egal mit welcher Stimme.“
- **braucht:** W2-P3.
- **Vorhall:** Lucys Stimme hinter der Stahltür mit Spieluhr darunter (Twist 1).

**#7 · Kap. 1 · Papier D (mit schwarzer Feder angesteckt) · T5**
- **Ort:** Laternenmast an Whiskeys erster Station (`WHISKEY_ST` `start`, −44,2 / 1,4 / 3,4), Feder und Karte am Mast.
- **Auslöser:** Station `start` erledigt, Whiskey fort, Spieler kommt zurück.
- **Text (wie Entwurf):**
  > Rabe: gekauftes Modell, 17 Animationen.
  > Irgendwann sitzen zwei davon auf einem Pfahl.
  > Ich hab nur einen gekauft.
  > — lw
- **Stimmt, weil:** `animal_crow/model.glb` hat 17 Animationen; im Finale von Kap. 6 sitzen zwei Raben auf dem Pfahl.
- **Vorhall:** Kap. 6 – der zweite Whiskey.

**#8 · Kap. 1 · Papier E · T2 + T1**
- **Ort:** im Gullyrost an der Kreuzung (9 / 0,05 / −1,3), eingeklemmt.
- **Auslöser:** nach dem Echo `echo_kreuzung`; nur mit Klammer-Glanz auffindbar.
- **Text:**
  > SZENE 14 · KREUZUNG · NACHT
  > VEGAS (off): Sieben. Gott sei Dank.
  > KIND (off): Acht.
  > [Rotstift] Eigentlich sagt sie NEUN. Hab ich gestrichen. Steht trotzdem im Zählbuch.
  > — lw
- **Stimmt, weil:** Echo „… sieben. Gott sei Dank …“ – „Acht.“; Zählbuch „23.10.2026: Neun.“ (auch nach T4).
- **Vorhall:** der Neunte (Beobachter, Kap. 7).

### Phase 3 · Anrede (≥ 2 aus Phase 2)

**#9 · Kap. 1 · Papier B · T5**
- **Ort:** Lucys Auto an der Südsperre (Auto um 1,9 / −37), Rücksitz.
- **Auslöser:** Nebenaufgabe „Lucys Auto“ erledigt (Rücksitz-Schreck gesehen), Spieler kommt zurück.
- **Text:**
  > Du hast dich umgedreht. Alle drehen sich hier um.
  > Du bist nicht der Erste, der hier sitzt.
  > Nur der Erste, der es liest.
  > — lw
- **Stimmt, weil:** Rücksitz-Schreck (Kind auf dem Rücksitz); „nicht der Erste“ ist eine Aussage über Spieler, keine Weltaussage.
- **Vorhall:** Kap. 5 – das Kind auf dem Rücksitz war der echte Luke.

**#10 · Kap. 1 · Papier E · T5**
- **Ort:** Keller Nr. 7, im Schutt der aufgebrochenen Zeichnungswand (298 / 0,05 / 296,3).
- **Auslöser:** Wand aufgebrochen (`uebergang_S.open`), Spieler geht aus dem Gang noch einmal in den Keller zurück.
- **Text:**
  > KAPITEL 1 · ENDE
  > [Rotstift] Erst: kein Ende. Er sollte einfach weitergehen.
  > Jetzt: eine schwarze Karte. Drei Zeilen.
  > Du hast sie gelesen. Und bist trotzdem umgedreht.
  > — lw
- **Stimmt, weil:** Kinosequenz K1 endet mit einer schwarzen Karte aus Titel + zwei Zeilen (PK-F); vorher gab es kein Kapitelende (SEAMLESS).
- **braucht:** W2-P1, W2-P3.
- **Vorhall:** Kapitel sind im Spiel Übergänge ohne Schnitt (Kap. 2 beginnt im Gang).

**#11 · Kap. 2 · Papier D · T1**
- **Ort:** Tunnel Ebene −2, Nordwand hinter dem Rohrbündel neben den Kreidestrichen (X + 5,5 / 2,1 / Z + 1,8).
- **Auslöser:** Kap. ≥ 2.
- **Text:**
  > KARTEI · TUNNEL EBENE −2
  > Kreide: siebzehn Fünfergruppen. Darunter: + 1.
  > Das + 1 bist du.
  > Du hast mitgezählt. Du zählst immer mit.
  > — lw
- **Stimmt, weil:** Kreidestriche „Siebzehn Gruppen – und ganz unten, mit anderer Hand: + 1“ (`innen_kapitel.js`).
- **Vorhall:** Luke ist der „eine mehr“ (Akte 08).

**#12 · Kap. 2 · Papier A · T2**
- **Ort:** Zimmer 7, unter der Losurne auf dem Schreibtisch (neu, W2-P4; Raum x 630–636, z −2608…−2602).
- **Auslöser:** Dienstbuch gelesen.
- **Text:**
  > BN-207 · Zimmer 7
  > Sieben Kugeln. Zwei tragen denselben Namen.
  > Spieler zählt nach. Spieler zählt immer nach.
  > Du hast gerade nachgezählt.
  > — lw
- **Stimmt, weil:** Losurne: „BRANDT, L. · BRANDT, L.“ (PK-D K2-3).
- **braucht:** W2-P4.
- **Vorhall:** Zwillinge, Twist 3.

### Phase 4 · KI (≥ 2 aus Phase 3)

**#13 · Kap. 2 · Papier B · T4**
- **Ort:** Messraum, unter der Sitzfläche von Stuhl 8 (X + 118,6 / 0,45 / Z + 5), wo Schlüsselteil 08 liegt.
- **Auslöser:** nur zwischen „Klavier gelöst“ (`ch2.safeOpen`) und „Akte 08 gelesen“.
- **Text (wie Entwurf):**
  > Im Fach liegt Akte 08. Du liest sie gleich.
  > Bitte lies sie nicht.
  > (Die einzige Zeile hier, die ich nicht löschen kann.)
  > — lw
- **Stimmt, weil:** Nach dem Klavier springt das Fach mit Akte 08 auf; sie ist Pflicht.
- **Vorhall:** Twist 4 und 5.

**#14 · Kap. 3 · Papier C · T4**
- **Ort:** Oberseite des Funkkastens an der Kreuzung (5,4 / 1,12 / −6,6), neben der Staubschrift.
- **Auslöser:** HASENBROT in den Staub geschrieben; bis zum ersten gelöschten Schaltkasten.
- **Text:**
  > PROTOKOLL · 05.11.2026 · 03:13
  > EINGABE: HASENBROT · 9 ZEICHEN
  > GELESEN VON: 2
  > Ich wollte nur einen Leser. Die Regel wollte zwei.
  > — lw
- **Stimmt, weil:** Das Wort hat 9 Buchstaben; sie liest durch Luke mit (Regel 10) und schreibt es in Kap. 5 an die Küchenscheibe (PK-B K5-6).
- **braucht:** W2-P6, W2-P9.
- **Vorhall:** HASENBROT an der Scheibe in Nr. 1.

**#15 · Kap. 3 · Papier A · T1**
- **Ort:** Chronik-Tafel an der Kreuzung, am Fuß des linken Pfostens (−7,5 / 0,3 / −6,45).
- **Auslöser:** Kap. ≥ 3.
- **Text:**
  > BN-312 · Chronik
  > Die Tafel lügt. Mit Absicht. „Ritt nach“ ist falsch.
  > Ich habe gelernt: Eine Geschichte wird besser, wenn eine Stelle lügt.
  > Ich weiß nicht mehr, wer mir das beigebracht hat.
  > — lw
- **Stimmt, weil:** Chronik „Der Ritter Justin … ritt nach“; Raum 3: „Eine Erinnerung lügt.“
- **braucht:** W2-P7.
- **Vorhall:** Twist 8 (Fußspuren am Rand).

**#16 · Kap. 3 · Papier D · T2**
- **Ort:** Schaltkasten vor Nr. 7 (29 / 0,6 / −5,4), innen am Deckel.
- **Auslöser:** nach mindestens einem falschen Schaltversuch (`wrongSwitch`).
- **Text:**
  > KARTEI · LATERNEN
  > Reihenfolge: steht nirgends. Nur in Tagen und Unterschriften.
  > Früher hat eine Stimme im Funk sie vorgesagt. Man hat es mir abgewöhnt.
  > Ich sag dir nichts mehr vor. Ich darf nicht.
  > — lw
- **Stimmt, weil:** Nach W2-P6 nennt niemand die Folge; Herleitung aus Zählbuch und Einwilligungen.
- **braucht:** W2-P6.
- **Vorhall:** Twist 3 wird zur Rätsellösung.

### Phase 5 · persönlich (≥ 2 aus Phase 4)

**#17 · Kap. 3 · Papier F · T4**
- **Ort:** Lucys Auto, Fahrersitz.
- **Auslöser:** nur solange der Motor läuft (Kap. 3, bis der Funk gelöst ist).
- **Text:**
  > Die Szene mit der Scheibe hab ich nachts geschrieben.
  > GROSSER, von innen, in ihrer Schrift.
  > Ich hatte nie jemanden, der so auf mich wartet.
  > ~~Streich das.~~
  > — lw
- **Stimmt, weil:** „GROSSER“ steht von innen an der Heckscheibe (PK-C K3-3).
- **braucht:** W2-P6.
- **Vorhall:** Lucy in Kap. 5: „Komm heim.“

**#18 · Kap. 3 · Papier G · T2 + T3**
- **Ort:** Raum 3, erster Teil (die Nacht von 1312), im Reif an der Kante direkt neben Justins Stiefelspur (X3 + 40,6 / 0,03 / Z3 + 0,9). Nur im Streiflicht: lesbar, wenn Luke mit dem Rücken zum Abgrund steht.
- **Auslöser:** Stelle „Stiefel- und Hufspuren“ untersucht; vor der Lösung des Rätsels.
- **Text (angepasst):**
  > Ende A. Ende B.
  > Ende C gibt es nur für die, die gesucht haben.
  > Ich hab es nicht vergessen. Ich hab es versteckt.
  > Hinter der Birke. Wie er.
  > — lw
- **Stimmt, weil:** Antwort C erscheint nur mit ≥ 3 Versteck-Hinweisen (PK-C K3-10); Kapellenfenster/Kanon: Ritter hinter der Birke.
- **braucht:** W2-P7.
- **Vorhall:** Ende C „Such mich“.

**#19 · Kap. 4 · Papier F · T2**
- **Ort:** Villa-Halle, Schreibtisch, unter Seilers Brief (H.x + 5,4 / 0,79 / H.z − 3,7).
- **Auslöser:** Brief gelesen (`anw_brief`), beim nächsten Blick auf den Tisch.
- **Text:**
  > Seiler schreibt: „Wer sie findet, hat hingesehen.“
  > Den Satz hab ich dreimal umgeschrieben.
  > Beim dritten Mal hab ich an dich gedacht. Nicht an Luke.
  > — lw
- **Stimmt, weil:** Seilers Brief enthält „Wer sie findet, hat hingesehen.“ (`anwesen.js`).
- **Vorhall:** Kap. 5 – Hinsehen ist Verrat.

### Phase 6 · Realität (≥ 2 aus Phase 5)

**#20 · Kap. 4 · Papier C · T2**
- **Ort:** Prägepresse im Villengarten, im Auswurf.
- **Auslöser:** Schlüssel gepresst (`villaschluessel` im Inventar).
- **Text:**
  > PRÄGEPRESSE · 05.11.2026
  > 1 SCHLÜSSEL · 7 ZÄHNE · 1 LÜCKE
  > Die Lücke ist kein Modellfehler. Ich hab nachgesehen. Zweimal.
  > Es fehlt wirklich einer.
  > — lw
- **Stimmt, weil:** „Sieben Zähne – und eine Lücke, wo der achte sein müsste.“ (`anwesen.js`).
- **Vorhall:** „Einer von uns ist immer übrig.“ (Kap. 6).

**#21 · Kap. 5 · Papier E · T5**
- **Ort:** Nr. 1, Küche, unter dem Teller von Mamas Platz (≈ −53,6 / Y + 0,78 / −14,4).
- **Auslöser:** nach der Schleife (K5-9) und nach dem Verlassen des Hauses: beim Zurückkommen (Brot holen, K5-12), wenn der Tisch dunkel und leer ist.
- **Text (angepasst):**
  > KAPITEL 5
  > (bleibt frei)
  > [Rotstift] So stand es monatelang in der Datei.
  > Eines Morgens stand da ein Tisch. Vier Teller. Ich hab ihn nicht gedeckt.
  > — lw
- **Stimmt, weil:** `story_final.md` enthielt „Kapitel 5 bleibt frei“; Kapitel 5 heißt jetzt „Der gedeckte Tisch“ mit vier Gedecken.
- **braucht:** W2-P9.
- **Vorhall:** Mamas Platz – „Mama kommt noch.“

### Phase 7 · Paranoia (beide aus Phase 6)

**#22 · Kap. 6 · Papier B · T2**
- **Ort:** Fraßstelle (1,5 / 0,06 / 199,6), neben Hofers Seite 1.
- **Auslöser:** Seite 1 gelesen (Stufe `spuren`).
- **Text:**
  > Hier ist es still, weil ich den Ton rausgenommen habe.
  > Fünfundzwanzig Meter um diese Stelle.
  > Wenn du hier trotzdem etwas hörst: Das war nicht ich.
  > — lw
- **Stimmt, weil:** Stille-Zone r = 25 m um die Fraßstelle (PK-E, W2-P11).
- **braucht:** W2-P11.
- **Vorhall:** Stufe „Heulen, das zu Funk wird“.

**#23 · Kap. 6 · Papier A · T2**
- **Ort:** Amtsbus (65 / 199,5), auf dem Sitz mit dem abgekratzten „Z“.
- **Auslöser:** Jonas' Zettel 3 gelesen.
- **Text:**
  > BN-640 · Bus
  > Sieben Sitze. Der Beobachter sagt, er hat sich einen genommen.
  > Den Beobachter hab ich nicht geschrieben.
  > Seine Zettel lagen eines Tages einfach in der Datei.
  > — lw
- **Stimmt, weil:** Beobachter-Zettel am Bus: „EINEN HABE ICH MIR GENOMMEN, ALS NIEMAND HINSAH.“ (`beobachter.js`).
- **Vorhall:** Kap. 7 (Beobachter).

**#24 · Kap. 6 · Papier H · T5**
- **Ort:** am Pfahl beim Bau (−13,9 / 1,0 / 207,6), mit einem Nagel festgeschlagen.
- **Auslöser:** nach dem Finale und dem Epilog, wenn der Spieler noch einmal zum Bau geht.
- **Text (wie Entwurf):**
  > Die Zettel mit „lw“ sind nicht von mir.
  > Ich unterschreibe nie klein.
  > Wenn einer schreibt, er hat etwas nicht eingebaut: er lügt.
  > Einer von uns.
  > — LW
- **Stimmt, weil:** bezieht sich auf #7 („nur einen gekauft“) und #23 („nicht geschrieben“); keine Weltaussage.
- **Vorhall:** #25.

### Epilog

**#25 · nach der Endkarte von Kap. 6 · Dialogseite (A und H auf einem Blatt)**
- **Ort:** keine Welt-Notiz: erscheint als letzte Seite im Reiter „RÄNDER“, wenn die Endkarte von Kapitel 6 geschlossen wird.
- **Auslöser:** alle 24 anderen gefunden.
- **Text (wie Entwurf):**
  > lw: Du hast alle gefunden. Das war nicht vorgesehen.
  > LW: Doch. Das war das Einzige, was vorgesehen war.
  > lw: Hör nicht auf ihn.
  > LW: Hör nicht auf dich.
- **Stimmt, weil:** erscheint nur bei 24/24.
- **Vorhall:** Kapitel 7.

---

## 5. Übersicht

| # | Kap. | Phase | Papier | Technik | braucht |
|---|---|---|---|---|---|
| 1 | Start | 1 | A | T1 | – |
| 2 | 1 | 1 | B | T2 | – |
| 3 | 1 | 1 | A | T2 | – |
| 4 | 1 | 1 | C | T4 | – |
| 5 | 1 | 2 | D | T3 | – |
| 6 | 1 | 2 | B | T5 | W2-P3 |
| 7 | 1 | 2 | D | T5 | – |
| 8 | 1 | 2 | E | T2+T1 | – |
| 9 | 1 | 3 | B | T5 | – |
| 10 | 1 | 3 | E | T5 | W2-P1, W2-P3 |
| 11 | 2 | 3 | D | T1 | – |
| 12 | 2 | 3 | A | T2 | W2-P4 |
| 13 | 2 | 4 | B | T4 | – |
| 14 | 3 | 4 | C | T4 | W2-P6, W2-P9 |
| 15 | 3 | 4 | A | T1 | W2-P7 |
| 16 | 3 | 4 | D | T2 | W2-P6 |
| 17 | 3 | 5 | F | T4 | W2-P6 |
| 18 | 3 | 5 | G | T2+T3 | W2-P7 |
| 19 | 4 | 5 | F | T2 | – |
| 20 | 4 | 6 | C | T2 | – |
| 21 | 5 | 6 | E | T5 | W2-P9 |
| 22 | 6 | 7 | B | T2 | W2-P11 |
| 23 | 6 | 7 | A | T2 | – |
| 24 | 6 | 7 | H | T5 | – |
| 25 | Epilog | – | A+H | – | alle |

Verteilung: Start 1 · K1 9 · K2 3 · K3 5 · K4 2 · K5 1 · K6 3 · Epilog 1 = 25.
