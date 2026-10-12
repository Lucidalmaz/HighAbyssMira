# Wendigo – Konzept (Folgeauftrag 8): Kanon-Abgleich, Foreshadowing, Texte, Verhalten, Formen

Stand 12.10.2026. Umsetzung: `app/mods/wendigo.js` (Modul, noch NICHT in `assemble.js` eingetragen), Modelle `game/assets/ms/wendigo_*/`, Blender-Skripte `app/tools/blender/wendigo_*.py`.
Einbau und Tests: `docs/gameplay/wendigo_integration.md`. Das Modul ändert keine bestehenden Dateien; es hängt sich nur über `typeof`-geprüfte Hooks an.

## 1. Kanon-Abgleich

Vorrang hat die Beschreibung des Autors (Nutzer 10.10., `UEBERGABE_0910_ABEND.md` Folgeauftrag 8): *dauerhaft präsent und unerkannt, beobachtet, steht in anderer Form neben dir; Spiegelbild des
Beobachters, nur böse; wollte Luke fressen, hat gemerkt, dass Luke „kein Mensch“ ist, will ihn jetzt nutzen, um die Kinder zu finden; Experiment; „wenn er alle Kinder frisst, wird alles besser“;
inzwischen nur noch Blutdurst, keine eigenen Gedanken mehr.* Bisheriger Kanon: `app/story/story_final.md` (Dossier „Projekt WENDIGO“ §1.1–1.9, Kap. 6, Kap. 1 Nebenaufgabe 18 „Wildschaden, 1992“),
`AAA_Bewertung.md` (Stille-Zonen, kein Atem, gefressene Stimmen), `hungrige.js`/`kapitel6.js`/`beobachter.js`.

### 1.1 Was zusammenpasst (wird übernommen)
| Nutzer | Kanon | Folgerung |
|---|---|---|
| Experiment | Probe W / Projekt WENDIGO, LWO 1992, Pell, Wirt Hofer | unverändert |
| steht in anderer Form neben dir | „Er trägt Haut“: Reh, Fuchs, Krähe, Wolf, Hirsch, Hofers Gesicht; die Geschälten sind abgelegte Häute | Formenliste = Kanonformen; Menschengestalt = Hofers Gesicht |
| Blutdurst, keine eigenen Gedanken | „kopiert nur“, „Loops“, Hunger, „wird mit jedem Bissen hungriger“ | Verhalten als Trieb + Wiederholung (Zustandsmaschine ohne Planung) |
| Hunger nach den Kindern | Hofers Wunsch „Anni zurück“, Pells Rechnung „Licht aushungern, dann holt es keine Kinder mehr“ | „alle Kinder fressen – dann wird alles besser“ = verbrannter Rest aus Pells Rechnung und Hofers Wunsch |
| Spiegelbild des Beobachters | Beobachter schweigt, wo der Wendigo ist („Wo der Wendigo ist, ist der Beobachter still“); Zettel „VOR MIR NICHT“, „ER SCHABT“ | gleiche Andeutungssprache (Nähe, Spuren, Blick, Hinweise), aber ohne Zettel: nur Fraß, Laut, Form |
| Luke ist „kein Mensch“ | Luke = „einziger Abdruck, der herumläuft“; der Wendigo wartet, „bis Luke es weiß“ | der Wendigo erkennt es früh (Kap. 1–2) und hört auf, ihn fressen zu wollen |

### 1.2 Widersprüche und Reibungen (dem Koordinator zur Entscheidung; bis dahin gilt die Nutzerfassung)
1. **Absicht „Luke nutzen“ gegen „Luke ist das größte Mahl“ (Dossier 1.6).** Kanon: er lockt Luke tiefer, um ihn zu fressen, und wartet. Nutzer: er hat gemerkt, dass Luke nichts zu fressen ist,
   und führt ihn zu den Kindern. Umsetzung: beides in einer Folge – Kap. 1–2 Fressinteresse (er folgt dicht), ab Kap. 3 „Führen“ (er bleibt in Reichweite, greift nicht an, Spuren zeigen *in die Richtung der Kinder*),
   Kap. 5/6 Ausbrüche, wenn Luke ihn nicht dorthin folgt. Das Dossier-Zitat „Ein Abdruck, der nicht weiß, dass er einer ist, schmeckt nach nichts“ trägt beide Lesarten.
2. **„Keine eigenen Gedanken“ gegen Hofers Rest** (Dienstbuch Seite 6 „klarer Moment“, „trauert mit Annis Stimme“) **und gegen Pells Dressur/Strategie** (Lampe als Strafe). Umsetzung: kein Planen im Spiel,
   nur Reflexe (Licht → zurück, Stimme → Loop). Die offene Frage „hört noch etwas zu“ bleibt unbeantwortet, wie im Dossier.
3. **Wendigo im Dorf (Kap. 1–5).** Kanon: Wald ohne Echo, Nachbilder werden dort gefressen; Dorf hat Nachbilder (Echos). Nutzer: er steht neben dir. Umsetzung: Auftritte im Dorf nur an Rändern
   (Waldrand, Zaun, Tankstelle, Friedhofsmauer, dunkle Fenster) und immer mit einem *Verlust*: ein Echo/Nachhall fehlt (Ruf ohne Hall, ein Geräusch ohne Echo, ein gefressenes Nachbild-Detail).
4. **Beobachter-Regel Kap. 1 „nie sichtbar“.** Gilt nur für den Beobachter. Der Wendigo darf ab Kap. 1 sehr fern sichtbar sein (Dossier 1.6: „hätte Luke schon in Kapitel 1 am Waldrand haben können“).
5. **Kap. 2 und 3 unter der Erde / Nimmerheim.** Kanon 1.9: „unter der Erde geht er nicht“, Lunas Spiel gilt für ihn nicht. Umsetzung: dort keine Körperauftritte, nur Papier/Funk/Stille (Tabelle).
6. **Name.** Kanon: „Wendigo“ erst nach Hofers Seite 1 (Kap. 6); davor Dorfname „der Hungrige“ ab dem Fuchs. Alle Foreshadowing-Texte kommen ohne beides aus (Ausnahme: Pells Heft auf Papier, Kap. 4).
7. **Reihenfolge der Tierformen.** Kanon Kap. 6 steigert Reh → Krähe → Fuchs → Hirsch. Die Vorboten in Kap. 1–5 nehmen Reh und Hirsch vorweg (Kap. 5-Abspann zeigt bereits „Geweih im Nebel“).
   Der Fuchs bleibt dem Nordzaun (Kap. 1, Wildschaden) und Kap. 6 vorbehalten, die Krähe Kap. 6.
8. **Hofer-Gesicht.** Kanon: Gesicht seit dem Ausbruch am Wendigo. Ein „Mensch im Fenster“ vor Kap. 6 ist daher Hofers Gesicht auf falschem Körper; Spieler kennt Hofer vor Kap. 4 nicht (Foto Beweis 7) – Hinweis
   erst nach Kap. 4 als Wiedererkennen (Fotowand „Pell und ‚Buck‘“, Bild vom Mann in der Zelle).
9. **Stille-Zonen.** Kanon: Stille-Zonen im Wald (Kap. 6). Ausgeweitet auf „wandernde Stille“ (spannung_hush) für die Dorfauftritte (`spannung.js` kennt `wer = 'wendigo'` bereits in Kap. 6).

## 2. Leitregeln des Foreshadowings

* **Nie erklärt, nie benannt**, bis Hofer Seite 1 gelesen ist. Der Spieler hat Hinweise, aber kein Wort.
* **Immer ein Verlust statt eines Angriffs**: ein fehlendes Echo, ein fehlendes Tier, eine abgenagte Stelle, ein Geräusch ohne Atem. Kein Auftritt endet mit Schaden an Luke vor Kap. 6.
* **Spiegel des Beobachters**: Der Beobachter lässt Zettel, Spuren und Bonbon-Papier zurück und ist *nett*. Der Wendigo lässt Fraßstellen, Haut, Kratzer in Kopfhöhe und nasse Schritte zurück. Wo einer ist,
  ist der andere still (`BEOB_SPERREN`), das Schweigen des Beobachters ist selbst ein Hinweis (Stille-Regel 45 s).
* **Ein Auftritt je Ort und Kapitel höchstens, Abstand ≥ 6 min Spielzeit**, nur in ruhigen Momenten (Regie `spannung_can`), nie in traurigen Szenen, nie direkt nach einem Höhepunkt.
* **Sichtbar nur kurz und nur im Augenwinkel**: Er wird erst „gesehen“, wenn der Spieler ≥ 0,6 s hinblickt; nach ≤ 2 s ist er weg (Dither-Fade `auftritt_reg`, kein Poppen), oder das Bild ist ein Baum.
* **Kein Atem, Hufe im Metronomtakt, Kopf sitzt falsch**: gemeinsame Merkmale aller Formen (Kanon `hungrige.js`).

## 3. Foreshadowing-Plan Kapitel 1–6

Spalten: Kapitel | Ort/Szene | Hinweis | Form des Wendigo | Wahrnehmung des Spielers | Auslöser/Code-Hook | Dosierung. „B“ = Beobachter-Gegenstück. Ids sind die Ereignis-Kennungen in `wendigo.js` (`WD_AUFTRITTE`).

| # | Kap. | Ort/Szene | Hinweis | Form | Wahrnehmung des Spielers | Auslöser / Code-Hook | Dosierung |
|---|---|---|---|---|---|---|---|
| k1_hall | 1 | Waldrand Ost, Kreuzung am Abend, erster Gang zu Nr. 7 | Ein Ruf (Vegas/Hund/Luke) kommt ohne Hall zurück; zwei Atemzüge später ein einzelner, zu langsamer Rehruf wie eine Aufnahme mit falscher Geschwindigkeit | nur Ton („Reh“) | „Der Wald hat Hall verloren.“ Spieler denkt an Akustik/Wind | `WD.tick`: Spieler > 25 m vom Haus Nr. 7, im Freien, Kap. 1, `spannung_can('wd_ruf','amb')`; Hall aus über `spannung_hush(2.5,.1)` + `Audio.wendigo('ruf')` | 1× |
| k1_fell | 1 | Straßenrand zwischen Nr. 7 und Tankstelle | Ein Büschel nasses, rotes Fell/Haut am Zaunpfosten, kleine Hufspuren in Zweierreihe im Matsch | Reh-Haut (abgelegt) | Fund, interaktiv (E): „Jemand hat hier etwas ausgezogen.“ | `WD.spur('haut')` an Zaunpfosten (Interact), nur nach Kellerszene | 1× |
| k1_zaun | 1 | Nordzaun, Tankstelle | gehört zu Nebenaufgabe 18 (existiert, `gruen.js`): Hufe auf zwei Beinen, Fuchs mit zu weit gedrehtem Kopf | Fuchs (Quest) | wie im Kanon | **nicht verdoppeln**; `wendigo.js` hört nur mit (`gruen_wild` → zählt als Vorbote 1) | – |
| k1_nacht | 1 | Nr. 7, Schlafzimmer / Fenster zur Straße, nach dem Keller | Etwas Hohes steht zwischen den Laternen, neben dem Laternenmast, sein Kopf „zu hoch“; nach dem Blinzeln ist es ein zweiter Mast | Silhouette mit Geweih (kein Detail) | 1,2 s, dann Mast | Fenster-Blick (`leben_facing` > .93 zur Position), Kap. 1 nach „… danke, Luke …“ | 1× |
| k2_papier | 2 | Amt, Archiv/Prüfraum | Bestandsliste „Probe W · entwichen 13.07.1992“ (nur die Zeile, ohne Namen); eine Akte „Fütterungsprotokoll“ mit Tierarten statt Kindern | Papier | Fibel „Bestandsliste, durchgestrichen“ | `wendigo_lore('k2_bestand')` über Amt-Interakt oder `kino`‑freier Hook `WD.zettel` | 1× |
| k2_stille | 2 | Lüftungsschacht außen/Hof, Außenluft nur wenn Spieler kurz oben ist | Schacht-Luft riecht nach nassem Leder (Text), kein Echo im Schacht | – | Luke-Gedanke | `gedanke` bei Aufenthalt Schachtmündung | 1× |
| k3_funk | 3 | Funkgerät/Tonband in der Stadt-Etappe (nicht in Nimmerheim) | Tonband: Rauschen, dann in Seilers Stimme der Satz, den Seiler *gerade erst* gefunkt hat, Wort für Wort, ohne Atem | Ton | „Das Band holt Luft nicht.“ | `WD.tonband()` wenn Funk/Kassette abgespielt wird (Hook `stimmen_spielen` der Kassette) | 1× |
| k3_reh | 3 | Straße Richtung Kirchberg am Tag | Reh steht auf der Straße, schaut dich an, geht rückwärts in den Zaun; Hufschläge in gleichmäßigem Takt (Metronom) | Reh (Tier-Haut, Kanon-Form) | klar „ein Reh“, aber falsch | `WD.auftritt('reh_rueck')`, nur Tag, Abstand 22–35 m | 1× |
| k4_fenster | 4 | Villa Seiler, Außenanlage, Gardine im Obergeschoss | Ein „Mensch“ hinter der Gardine, der Körper steht, der Kopf dreht sich zu Luke, drei Sekunden zu lang | Hofers Gesicht auf falschem Körper (Silhouette) | Beobachter-Verwechslung („Der Neunte?“), Beobachter bleibt still | `WD.fenster()` nutzt `beob_fenster`‑Suche; `beob_still(40)` | 1× |
| k4_pell | 4 | Villa, Pells Heft 1, 2, 4 | Text im Heft („Probe W“, Hirsch „Buck“, zwei Sekunden Neon); Luke überliest das Wort | Papier (existiert in `villa.js`) | – | **nicht verdoppeln**; `wendigo.js` setzt nur `WD.S.wissen = 1` | – |
| k4_spur | 4 | Garten Villa, Beet/Matsch | Zweierspur gespaltener Hufe geht *neben* Lukes Spur her und endet an seiner Fußspur | Spur (Decal) | Er ist neben mir gegangen. | `WD.spur('huf_neben')`: Spur parallel zu Lukes zuletzt gelaufenem Weg (Positionspuffer) | 1× |
| k4_aas | 4 | Park/Rückseite Villa | angefressener Dachs/Katze: Fleisch „probiert, nicht gemocht“ | Geschältes Tier (Fleischform) | Fund, Kadaver (`kr_nackt`) | `WD.kadaver('klein')` | 1× |
| k5_nebel | 5 | Kreuzung/Kirchberg im Nebel, Nacht | Hirsch im Nebel am Rand der Sicht, Geweih zu groß, bewegt sich nur, wenn Luke wegschaut (+ Lucys „Großer“ ohne Stimme) | Hirsch (Tierform mit falschem Geweih) | Geweih im Nebel | `WD.auftritt('hirsch_nebel')`: Nebeldichte > 0; 45 m; „Weeping“-Verhalten | 2× (Kap. 5) |
| k5_hand | 5 | Nr. 1 / Hof, Küche | Kratzer in Kopfhöhe an der Außentür (vier Striche, 2,3 m); Haut-/Fleischrest auf der Türschwelle | Spur (Decal) | „Wer kratzt in zwei Meter dreißig?“ | `WD.spur('kratz')` Außenwand Nr. 1 | 1× |
| k5_stehen | 5 | Gitter/Spielplatz | Steht still neben dem Klettergerüst im Dunkel (Whiskey sitzt stumm, schaut hin) | Hirschding (nur Umriss, sehr dunkel) | Whiskeys Blick lenkt hin | `WD.auftritt('gitter')`; `whiskey_blick` | 1× |
| k5_abspann | 5 | Abspann-Kino (existiert) | Geweih im Nebel, drei Kratzer | Hirschding | – | `kino.js` k5 vorhanden; `wendigo.js` zählt `S.k5 = 1` | – |
| k6_* | 6 | Wald | Übergabe an `hungrige.js`/`kapitel6.js` (Stufen reh, kraehe, fuchs, wolf_funk, hirsch, blick, hofer, bau, K6J-Jagd) | alle | Kanon | `wendigo.js` bleibt **passiv** (`WD.S.mode = 'k6'`), liefert nur Formen/Übergänge/Ausbrüche auf Anfrage | – |

Fortschritt „Er wird hungriger“: Die Hinweise steigern sich Kap. 1→5 über die Formen (Ton → Haut → Silhouette → Tier → Hirsch → Umriss), die Abstände schrumpfen (35 → 12 m), die Kadaver werden frischer.

### 3.1 Wie er Luke „führt“ (Kap. 3–5, Nutzerabsicht „Luke nutzen“)
* Spuren (Zweier-Hufabdrücke, Fraßstelle, Kratzer) liegen *in der Richtung des nächsten Zieles* (Kinderspur, Zayns Hütte, Kreuzung), nie dagegen.
* Er hält Abstand 25–45 m *vor* Luke an der Strecke zum Ziel (nicht hinter ihm): „folgen“ = voraus gehen und nicht erreichbar sein.
* Weicht Luke in Kap. 5 vom Ziel ab (> 60 m, > 90 s ohne Fortschritt), folgt ein Blutdurst-Ausbruch weit weg (Tierschrei + Fleischgeräusch), danach liegt ein Geschältes am Weg.

## 4. Texte (fertige deutsche Zeilen, Ziel-Datei)

Alle Texte liegen im Modul in `WENDIGO_TEXTE`; die Spalte „Ziel“ nennt den Hook, über den sie ins Spiel kommen (Fibel = `story.lore.push`, Gedanke = `gedanke(id, text, delay, prio)`, UT = `subtitle(html, ms, wer)`).
Regeln: Luke-Gedanken ≤ 2 Sätze; Dokumente ≤ 5 Zeilen (Kern §13); kein Wort „Wendigo“/„Hungrige“ vor Hofers Seite 1.

| Id | Kap. | Art | Wortlaut | Ziel |
|---|---|---|---|---|
| g_hall | 1 | Gedanke | „Ich hab gerufen. Der Wald hat es behalten.“ | `gedanke('wd_hall', …, 1800, 2)` in wendigo.js |
| g_fell | 1 | Gedanke | „Das ist kein Wild, das hängen bleibt. Das hat sich ausgezogen.“ | wendigo.js |
| f_haut | 1 | Fibel | **Fund am Zaun** – „Nasses Fell, rot, an der Pfostenspitze. Darunter zwei Hufspuren hintereinander, als ginge etwas aufrecht. Die Spur endet am Zaun und fängt dahinter nicht wieder an.“ | `story.lore` Schlüssel `wd_haut` |
| g_mast | 1 | Gedanke | „Zwei Masten. Gestern waren es keine zwei.“ | wendigo.js |
| z_bestand | 2 | Dokument | „BESTAND · Probe W · entwichen 13.07.1992 · Wirt: Hofer · Leiter: Pell (seit 1994: s. Probe W)“ (aus Dossier 1.2) | Fibel `wd_bestand` (Amt-Archiv-Interakt, Hook `WD.zettel('bestand')`) |
| z_futter | 2 | Dokument | „Fütterungsprotokoll, Zelle W. Tag 1 Hirsch. Tag 3 Hund. Tag 8: Licht. Tag 9: ‚Es nimmt, was nicht mehr hinsieht.‘ – R. P.“ | Fibel `wd_futter` |
| g_schacht | 2 | Gedanke | „Hier unten hallt nichts. Das ist nicht der Beton.“ | wendigo.js |
| t_band | 3 | UT (Tonband) | `<i>„… Station Nord, Seiler, Probe liegt am Rand, ich wiederhole …“</i> (ohne Atem, Wort für Wort ein zweites Mal) | `subtitle(…, 'BAND?')` |
| g_band | 3 | Gedanke | „Es holt keine Luft. Ein Mensch holt Luft, auch auf Band.“ | wendigo.js |
| g_reh | 3 | Gedanke | „Es geht rückwärts, als wüsste es nicht, wo vorn ist.“ | wendigo.js |
| g_fenster | 4 | Gedanke | „Der Körper steht, der Kopf kommt hinterher. Kein Mensch dreht so.“ | wendigo.js |
| g_spur | 4 | Gedanke | „Zwei Hufe neben meinen Schuhen. Jemand ist mit mir gegangen.“ | wendigo.js |
| f_spur | 4 | Fibel | **Spuren im Beet** – „Gespaltene Hufe, immer nur zwei, in einer Linie. Sie laufen neben meinen und hören dort auf, wo ich stehen geblieben bin.“ | `wd_spur` |
| g_aas | 4 | Gedanke | „Das hat probiert und aufgehört. Nicht satt. Enttäuscht.“ (greift den Kanon-Gedanken „hat probiert“ vor; ersetzt ihn nicht) | wendigo.js |
| g_nebel | 5 | Gedanke | „Es bewegt sich nur, wenn ich weggucke. Das hat Wartezeit gelernt.“ | wendigo.js |
| g_kratz | 5 | Gedanke | „Zwei dreißig. Das kratzt nicht, um reinzukommen. Das zählt die Höhe.“ | wendigo.js |
| g_gitter | 5 | Gedanke | „Whiskey schaut hin und sagt nichts. Der Rabe hat Respekt, wie vor einem Hausmeister.“ | wendigo.js |
| g_kinder | 5 | Gedanke | „Es führt mich irgendwohin. Es will nicht mich. Es will, was ich finde.“ (erst nach `k5_nebel` und `k5_kratz`) | wendigo.js |
| f_reihe | 5 | Fibel | **Er** – „Ich habe nichts gesehen, was ich einen Namen nennen würde. Ein Reh, das falsch geht. Ein Hirsch im Nebel, der wartet. Ein Kratzen in zwei Metern Höhe. Alles hat dieselbe Geduld.“ | `wd_reihe` (Fibel „Der Wald im Dorf“) |
| s_funk | 3–5 | Funk-Andeutung | „… Nachsorge, Probe ist am Zaun. Nein. Nicht am Zaun. Hinter Ihnen.“ (Blechmann-Funk, Amt) | `lwo.js`-Funkkanal, nur wenn Funk spielt |
| b_stille | 1–5 | Beobachter-Spiegel | Beobachter-Zettel bleiben aus, solange der Wendigo ≤ 40 m ist (nur Verhalten, kein Text) | `BEOB_SPERREN` |

Texte, die nach der Enthüllung (Kap. 6) greifen (Wiedererkennen): `g_wieder_fenster` „Das Gesicht im Fenster. Das war sein Gesicht. Das war Hofer.“ (nach Seite 1), `g_wieder_spur` „Die Hufe neben meinen. Er hat mich nach Hause begleitet.“

## 5. Verhaltens-Zustandsmaschine

Ein Wendigo-Akteur (`WD.A`), eine Form zur Zeit; Zustandswechsel in `WD.tick(dt)`; Parameter in `WD_PARAM`.

| Zustand | Zweck | Eintritt | Verhalten | Austritt | Parameter |
|---|---|---|---|---|---|
| `schlaf` | unsichtbar, Zähler läuft | Start, nach jedem Auftritt | nur Budgetuhr, Ton selten | Budget frei + ruhiger Moment (Regie) → `beobachten` | Abstand zwischen Auftritten 360–540 s (K1–2), 300–420 s (K3–4), 240–360 s (K5) |
| `beobachten` | steht am Rand der Sicht | Auftritt gewählt | steht still, Kopf in Rasten (≈ 20°) zu Luke; nie im Lampenkegel; „Weeping“: bewegt sich nur außerhalb des Blickfelds | Spieler sieht ≥ 0,6 s hin → Sichtung (≤ 2 s) → `rueckzug`; Spieler nähert sich < 12 m → `rueckzug`; Zeit 25–45 s → `schlaf` | Abstand 22–45 m (K1–3), 14–30 m (K4–5); Blickfeld-Schwelle 0,88; Sichtdauer 0,8–2 s |
| `folgen` | begleitet/führt | nach 2 Sichtungen im Kapitel (K3+) | geht parallel in 25–45 m, nur wenn nicht im Bild; hält an, sobald im Bild; Zielrichtung = Weg zum nächsten Hauptziel | Dauer 30–60 s, Licht → `rueckzug` | Tempo 1,0–1,6 m/s; 9-Bilder-Takt wie Hirschding |
| `lauern` | geduckt hinter Deckung | K4+ , Spieler steht > 8 s, Lampe aus | kriecht auf 10–16 m heran, Pause 3–6 s je Schritt, sichtbar nur der Geweihansatz | Spieler bewegt sich schnell → `rueckzug`; Zeit 20–30 s → `schlaf`; K5: Zeit abgelaufen → `blutdurst` | Abstand 10–16 m, Schrittpause 3–6 s |
| `blutdurst` | Ausbruch (kein Angriff auf Luke) | K5, Luke > 60 m abseits des Ziels oder 8 min ohne Ereignis | 2–4 s: Brüllen (`schrei`), Fleisch-/Knochenlaut, Licht flackert, danach liegt ein Geschältes im Weg | immer → `rueckzug` | nur 1× je Kapitel; K6 übernimmt `K6J` |
| `rueckzug` | flieht Licht/Whiskey/Nähe | Lampe ≥ 0,8 s auf ihn (Abstand < 26 m), Whiskey, Nähe < 12 m | rückwärts („nicht rennen, fallen lassen“), Dither-Fade 0,3 s, Hautfetzen/Nebelstoß | nach 1,5 s unsichtbar → `schlaf` mit Abstand ×1,3 | Lichtkegel cos > 0,965 (wie `hungrige_lit`) |
| `k6` | Übergabe | `curChapter() ≥ 6` | Modul passiv; liefert `WD.form(name)` und `WD.uebergang()` auf Abruf | – | – |

Gemeinsame Gesetze: nie in der Nähe von Luke bei Dialog/Kino/Tod (`spannung_can`), nie in Innenräumen außer hinter Fenstern, nie < 6 m am Spieler, nie auf Wegen, die im Bild frei von Deckung sind (Sicht über `hungrige_los`), Ruhe-Regel nach Auftritt 90 s.

### 5.1 Formen und Verwandlungen
| Form | Modell (`game/assets/ms/…`) | Einsatz | Kennzeichen |
|---|---|---|---|
| `reh` | `wendigo_reh/model.glb` | K1 Ton, K3 Tag, K6 Stufe 1 | Reh, Kopf zu weit zurück, Augen milchig, Maul blutig, Morph `kopf_falsch` |
| `hirsch` | `wendigo_hirsch/model.glb` | K5 Nebel, K6 | Hirsch, Geweih zu groß/asymmetrisch, Baststreifen, Morph `geweih_klein` |
| `fleisch` | `wendigo_fleisch/model.glb` | Kadaver, Geschälte, Übergangsmitte | geschältes Reh: Muskeln, Sehnen, Rippen, Nässe, Wunde |
| `haut` | `wendigo_haut/model.glb` | Zwischenform, Jäger | haarlose, graue, nasse Haut, lose Falten, grobe Naht am Bauch |
| `hirschding` | `wendigo_hirschding/model.glb` | K5 Umriss, K6 wahre Gestalt | aufrecht, lange Glieder, Knochen und rohes Fleisch, aufgesteckter Schädel, schiefes Geweih |
Übergänge (`WD.uebergang(von, zu)`): Morph `riss` (Haut reißt) → Dither-Fade der Hülle → Morph `knochen` (Rippen/Wirbel schieben) → Geweih wächst (`geweih_klein` 1→0) → Ton `knochen` + Nebelstoß → Lampenflackern 0,4 s.

## 6. Formenmodelle (Blender) – Stand und Selbstbewertung

Siehe Abschnitt „Modelle“ im Integrationsdokument und die Vorschaubilder in `game/assets/ms/wendigo_vorschau/` (mit Schulnoten). Basis aller Formen: die im Spiel vorhandenen Tiermodelle `animal_deerdoe` / `animal_deerstag` (gleiches Skelett,
31 Knochen, Clips bleiben erhalten) plus eigene Blender-Arbeit (Geometrie, Backen, Geweih, Rippen, Zähne, Morphs, Clips).
