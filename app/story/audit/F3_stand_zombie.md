# Stand R-10/R-15: Peter, der Zahn-Mann – Figur, Jagd-KI, Flucht, Quick-Time-Events (01.10.2026)

## Gebaut
### Figur `peter` (statt des Quinn-Mannequins mit Fleischtextur)
- Gebaut mit der Werkstatt: `cast.json` → `peter` (ow3-Körper, MN-Kopf, 1,97 m, also „zu lang“). Dazu gehören die Haare, ein grauer, kahl rasierter Schädel und braune Augen. Ein eigener Mocap-Satz `peter` hängt an `figs.peter`.
- Der Satz enthält diese Clips: `idle` (kaum noch stehen), `idle2` (z_idle), `walk` (Hinken rechts, 0,46 m/s), `gehen`, `schritt` (1,59 m/s), `run` (Zombie-Lauf, 3,4 m/s), `stolpern`, `fall_vor`/`fall_rueck`/`fall_seite`, `knie_tod`, `kriechen`, `liegen`, `zusammenrollen`, `hug`, `packen`, `wand`, `suchen` und `taumeln`.
- Dateien: `game/assets/chars/peter/model.glb` (+ `.ktx.glb`). Der Eintrag in `chars.json` ist von Hand angefügt; `chars_pack.mjs` lief nicht, weil parallel gearbeitet wurde.
- Offline-Filmstreifen der Clips liegen in `C:/Users/GIGABYTE/_r10/film/`.
  - Gut: Hinken, `fall_vor` (vom Knien nach vorn), `knie_tod`, `hug`.
  - Nicht benutzt: `aufrichten` (Motifect revive) schwebt. `kriechen` ist fast eine Standpose.
  - Aufstehen und Zusammenbrechen laufen deshalb über `fall_vor` vorwärts und rückwärts.
- **Haut** (`pz_haut`/`pz_shader` in `feuer.js`, über den Werkstatt-Shadern):
  - grau-grün und blutleer, mit Adern, Leichenflecken, eingesunkenen Augenhöhlen und Nässe;
  - offene Geschwüre mit Fleisch aus `kreaturen.js` (`kr_tex`, Muskel-Textur);
  - die genähte Schädelnarbe der Versuchsreihe K mit Klammern;
  - Lichtsaum (Wrap-SSS), milchige Augen, gelbe Zähne und Haar in Strähnen (Rausch-Ausschnitt);
  - Hemd und Hose als verwaschenes Anstaltsgrün mit Druckmuster, Flecken, Blut, Rissen und Schmutz am Saum. Die Krawatte der Vorlage wird zur getrockneten Spur;
  - Öl macht Haut und Stoff dunkel und glänzend (`pzOel`).
- **Mimik**: `zahn` ist das Lachen, das nicht aufhört; `brand` ist Schmerz. Beide sind in `FIGUREN_MIMIK_V` eingetragen.

### Bewegung (figuren.js bewegt die Figur, `pz_schicht` legt eine Schicht nach dem Mischer darüber)
- Der Clip folgt dem echten Tempo:
  - Stand: `idle`/`suchen`;
  - unter 0,9 m/s: Hinken;
  - unter 2,9 m/s: `schritt`;
  - darüber: `run`.
- Schritte fallen genau auf die Fußphasen.
- Der Kopf sucht oder lauscht schief, eine Hand tastet an der Wand (mit Fingernägeln auf Blech) und der Oberkörper beugt sich vor.
- Beim Ausfall greifen beide Hände nach vorn. Er stolpert an Gerümpel. Im Feuer windet er sich, nickt und wendet den Kopf ab.

### Jagd-KI (`pz_jagd`/`pz_ki`, ersetzt `chaseUpdate`, solange die Figur geladen ist; ohne Figur läuft der alte Verfolger)
- Zustände: lauern → verdacht (bleibt stehen, Kopf schief, Zähne klicken) → suche (zur letzten Stelle, Stapel absuchen, still daneben lauern, „… Lu… ke …“/„… raus …“) → jagd → verloren.
- **Gehör:**
  - Sprint 13 m, Gehen 7 m, langsames Gehen 3 m;
  - Gitter rütteln 26 m;
  - Lampenschalter 3,5 m.
- **Sicht:**
  - mit Lampe im Kegel bis 17 m;
  - Lukes Lichtstrahl auf ihm verrät Luke immer;
  - ohne Licht nur aus der Nähe.
- Er fängt Luke ab, statt ihm nur hinterherzulaufen. Er weiß, dass das Gitter klemmt: Er geht ruhig und holt Luke erst ein, wenn es nachgibt (der Pflicht-Griff bleibt am Gitter).
- Bevor er zugreift, steht er 2,4 s hinter Luke.
- **Ausfall** (2–4,4 m, Abklingzeit 5,5–8 s): ein plötzlicher Satz mit **Ausweich-QTE**. Gefragt ist A oder D zur freien Seite; die falsche Seite zählt als Fehler.
  - Erfolg: seitlicher Ausweichschritt mit Kamera-Ruck, und er stolpert vorbei.
  - Fehlschlag: Fang. Der erste Fang führt zur Kinosequenz „Bruder.“, danach endet ein Fang tödlich.
  - Höchstens zwei Ausweich-QTEs pro Lauf.
- **Ton** (nur Aufnahmen, `tools/klang_peter.py` → `game/audio/pz_*.ogg`, Quellen `HAM_Audio/quellen.py` pz_*):
  - nackte, nasse Schritte, Schlurfen, Zähne/Mund, rasselnder Atem, gebrochene Lachstöße, Körperfall;
  - Lukes Herz (Takt nach Bedrohung), Keuchen, Losreißen, Stoff;
  - alles räumlich an Peter. Fehlen die Dateien, fällt der Schritt auf `Audio.stepAt` zurück.

### Kamera in der Flucht (`pz_kamera`)
- Schulterblick: Taste „zurueck“ (Standard Q, frei belegbar). Dabei 140° über die Schulter auf Peters Seite und +7° Sichtfeld.
- Beim Ausfall von hinten kommt automatisch ein Schulterblick, höchstens zweimal.
- Federn für Rollen und Ducken nach knappen Fehlgriffen; Sichtfeld −4 während des Ausweich-QTEs.

### QTE-System `app/mods/qte.js` (neu, in ORDER vor `kino`)
- API: `qte_start({ type: 'tippen'|'haemmern'|'folge'|'halten', keys, sperre, duration, need, window, label, at, onOk, onFail, onTick })`. Dazu kommen `qte_aktiv()`, `qte_taste(rolle)`, `qte_name()` und `qte_ende(ok)`.
- Darstellung: ein schmaler Ring mit Tastenkappe in Cormorant/Bernstein, verankert an einem Weltpunkt (Hand, Fass, Feuerzeug), ohne Neon.
- Bei Erfolg weitet sich der Ring aus; bei Fehlschlag wird er rot und zittert.
- Einstellungen (an das Menü angehängt):
  - Schwierigkeit „Normal / Leicht (mehr Zeit) / Automatisch bestehen“;
  - frei belegbare Tasten für Aktion, Losreißen, Links, Rechts und Schulterblick.
- Testzugriff: `window.__qte.erzwingen(true|false)`.

### Szenen
- **k2a „Bruder.“** (`kino.js`, nur Haken):
  - Einstellung 2/3: er tritt heran, die Hände an Lukes Gesicht, Mimik `zahn`.
  - Einstellung 5: **Losreißen**, Leertaste schnell drücken. Bei Fehlschlag folgt „Er drückt fester“ und ein zweiter Versuch „Luft!“.
  - Einstellung 6: **Gegen das Fass**, E im Zeitfenster, mit einem zweiten Versuch.
  - Einstellung 7: er rutscht aus und fällt nach vorn ins Öl (`fall_vor`, kein starres Kippen mehr).
  - Zwei Fehlschläge beim Losreißen oder am Fass führen zu `todDie('zombie')`, Speicherpunkt wie bisher.
  - Die Einstellungen warten auf das QTE (`feuer_k2aHalt`); `wenn` überspringt 6/7 nach dem Tod. `kino_zLangsam` greift nicht mehr bei Peter.
- **Wiederholung nach dem Tod**: ohne Kinosequenz aus Lukes Augen (`pz_griffOhneKino`), mit denselben QTEs.
- **Im Öl**: Er liegt bäuchlings mit dem Kopf zu Luke und sieht ihn an. Wartet Luke, schiebt er sich auf die Knie und steht dann auf (`fall_vor` rückwärts). Der zweite Fang ist tödlich.
- **Zünden**: QTE **Ruhig halten** (E halten, Maus still, 2,1 s) mit Funken und dann der Flamme.
  - Bei Fehlschlag reißt die Flamme ab, die Sequenz endet und Peter kommt 3,5 s näher ans Aufstehen. Danach erneut anbieten.
- **Brand**:
  1. Er nickt einmal und wendet den Kopf ab.
  2. Er windet sich im Feuer (Licht und Flammen wie bisher).
  3. Er richtet sich auf die Knie auf und greift an Luke vorbei zur Tür (er wollte raus), Blick zur Tür.
  4. Er bricht nach vorn zur Tür zusammen und verkohlt.
  - Die Handkamera sieht auf sein Gesicht und wird enger. Die Sequenz dauert 2,2 s länger (Ende bei 12,4 s, Flucht ab 13,6 s).
- Kleiner Haken in `innen_kapitel.js`: `!Z.eigen`, damit der alte Verfolger-Takt Peter nicht beugt.

## Kurz geprüft
- `node --check` für feuer, qte, kino und innen_kapitel; `node tools/assemble.js` und der zusammengebaute Modul-Code sind syntaktisch sauber.
- Offline-Filmstreifen der Mocap-Clips: Auswahl siehe oben.
- Werkstattbilder: `C:/Users/GIGABYTE/_r10/cast2/` (Kopf mit Haar) und `_r10/cast/` (Mimik).
- Spiel-Filmstreifen: Der erste Lauf griff auf einen Bau ohne diese Änderungen zu (Bau wurde parallel überschrieben) und ist ungültig. Der zweite Lauf blieb über 20 min in der Test-Warteschlange und wurde **abgebrochen** (neue Regel). **Im Spiel ist nichts davon gesehen.**

## Bitte im Schluss-Test prüfen (Schritte fertig: `C:/Users/GIGABYTE/_r10/steps.json`, Lauf `bash _r10/run.sh`, Bilder → `_r10/out/`)
1. Peter lädt in Kap. 2 (`PZ.P` gesetzt, 20 Clips), alter Verfolger unsichtbar. Im Licht ansehen: Haut (Adern, Geschwüre, Narbe), Augen, Zähne/Grinsen, Haarsträhnen, Hemd. Gibt es Shader-Fehler (schwarze/unsichtbare Teile)?
2. Bewegung in der Jagd: richtige Blickrichtung (+x der Gruppe, Halter `pg` um 90° gedreht), kein Fußgleiten, Hand an der Wand auf der richtigen Seite (Seitenregel in `pz_schicht`), Kopf sucht oder neigt sich.
3. KI-Zustände: Sprint → jagd, Lampe aus und stehen → suche/verloren, Stapel absuchen; Griff am Gitter nach wie vor erreichbar.
4. QTE-Ring an der Hand, Ausweichen bei Erfolg und Misserfolg, automatischer Schulterblick, Q-Schulterblick, Sichtfeld kehrt zurück.
5. k2a: Hände am Gesicht, Losreißen bei Fehlschlag und Erfolg, Fass, Sturz nach vorn. Liegt er danach an der richtigen Stelle (`ax − 2,0`, Kopf nach Osten)?
6. Zünden: Ruhig-halten bei Fehlschlag und Erfolg; Brand: Nicken → Winden → Knie → Griff zur Tür → Sturz vor Ende der Einstellung (12,4 s).
7. Tod durch Festhalten (2× Losreißen verfehlt) → Wiederkehr → zweiter Griff ohne Kino mit QTEs.
8. Klänge `pz_*` hörbar und räumlich; Herzschlag nicht zu laut.

## Offene Punkte / Bitten
- **Sprachausgabe (Sprecher-Agent):** Peter flüstert gebrochen „… Lu… ke …“ und „… raus …“ (Untertitel mit Sprecher PETER in `pz_wort`, `feuer.js`). Bitte die Zeilen gebrochen und nass erzeugen; bis dahin klingen Lachstöße und Atem darunter.
- **Assets (Hauptagent):** Ein echtes Patienten-Modell mit Krankenhemd fehlt. Gesucht auf Fab: „Zombie Hospital“ ist eine Umgebung, Tony Flanagans Zombies sind comichaft. Jetzt dient ow3 als Anstaltskleidung im Shader. Falls eines gefunden wird: Kittel-Mesh, Fingernägel. Die zusätzlichen „Zähne an falschen Stellen“ fehlen noch.
- `chars_pack.mjs` lief nicht für peter (Eintrag in `chars.json` von Hand, tris geschätzt 45 000).
- Der alte Ghost-Verfolger von `innen_kapitel` lädt zurzeit nicht (`ghost.glb.ktx.glb` 404). Mit Peter unschädlich, ohne Peter gibt es keinen Verfolger.
