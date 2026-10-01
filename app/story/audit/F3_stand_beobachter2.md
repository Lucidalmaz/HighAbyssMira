# Stand R-21 · Der Beobachter, Fassung 4 (01.10.2026)

Nutzerwunsch R-21: detailreicher, hochwertiger, etwas gruseliger, aber süß; organisch und realistisch in Aussehen, Verhalten und Bewegung. Der Kanon gilt weiter (Dossier 82 §2/§3): perlweiß wie Kerzenwachs, großer runder Kopf, große dunkle Augen ohne Weiß, kein Mund, zwei Fühler, drei Finger, drei lange Zehen, spricht nie. Die Ein-Sekunden-Regel bleibt unverändert: Er verschwindet zwischen zwei Bildern.

## Gebaut

### Werkzeugkette (`app/tools/`, Node + three, ohne Grafikkarte)
- Aufruf: `node tools/beobachter_bau.mjs --schreiben [--film=Ordner] [--vorschau=Ordner] [--pose=clip:t,…] [--nur=clip,…]`, danach `node tools/ktx.mjs`.
- `beobachter_form.mjs`: formt das vorhandene Netz um („Cute Alien Pet“; Ecken werden verschoben, es entsteht kein neues Netz).
  - Mundrille und Daumen weggeschmolzen.
  - Dünner, langer Hals mit abfallenden Schultern.
  - Schmaler Rumpf mit kleinem Bauch.
  - Längere, dünne Beine mit Knie, schmalem Knöchel und breitem Fuß.
  - Drei lange Zehen.
  - Zu lange, dünne Arme.
  - Drei lange Finger mit geschwollenen Kuppen.
  - Eingesunkene Augenhöhlen mit leichtem Brauenwulst.
  - Kopf etwas kleiner.
  - Endhöhe 0,82 m.
- `beobachter_rig.mjs`:
  - Verschweißen (das Original hatte je Dreieck eigene Ecken; danach etwa 38 000 statt 200 000 Ecken).
  - Augenachse und eigene UV.
  - **Oberlider aus der eigenen Augenkappe**: decken in Ruhe 38 % des Auges (schwere, lauernde Lider), der Rand rollt zum Augapfel.
  - Skelett mit 44 Knochen, aus der Gestalt gemessen: Becken, Bauch, Brust, Hals ×2, Kehle, Kopf, je Seite Lid, Fühler ×3, Schulter, Ober-/Unterarm, Hand, drei Finger ×2 Glieder, Ober-/Unterschenkel, Fuß, Zehen.
  - Hautgewichte nach Abstand zu den Knochen, über die Nachbarn geglättet.
  - Hautattribute je Ecke:
    - Höhlen (AO) als Grundfarbe: Wachs, an dünnen Stellen rosig, in den Höhlen kühl, die Schädelkuppe gelblicher.
    - Dicke (für das Durchscheinen).
    - Faltenstärke und Faltenkoordinate an Hals, Ellenbogen, Handgelenk, Fingern, Knie, Knöchel, Zehen und Lidern.
    - Adernstärke (Schläfen, Kehle, Arme, Bauch).
- `beobachter_clips.mjs`: zehn eigene Clips.
  - `stehen` (12 s): Atem, Gewicht wandert, ein Knie gibt nach, Finger reiben bzw. tasten.
  - `hocken`: tief, Hand am Boden.
  - `spaehenL/R`: Oberkörper neigt sich aus der Deckung, die Hand krallt sich an die Kante.
  - `zucken`: ertappt; Schultern hoch, Hände vor die Brust.
  - `trippeln`: kleine schnelle Schritte, Becken sackt beim Auftreten, Hände vor der Brust; 0,8 m/s.
  - `vierbeinig`: Kreuzgang auf allen vieren, Kopf hochgereckt und still; 1,5 m/s.
  - `klettern`: Kante 0,8 m, Wurzelversatz in den Szenen-Extras.
  - `ohren`
  - `ablegen`: legt etwas mit drei Fingern ab.
- `beobachter_bild.mjs`: CPU-Vorschau, glatt schattiert.
- Ergebnis: `game/assets/ms/beobachter/beobachter_rig.glb` (4 MB) und Texturen:
  - `haut.png` (+ktx2): Rot = Poren/Fältchen (Höhe aus der NoEdge-HQ-Mikronormale), Grün = Äderchen (Lederhaut aus „Realistic Eye Models“).
  - `auge.jpg` (+ktx2): fast schwarze Iris mit Fasern, großer Pupillenkern, dunkler Limbus.
- Das alte `model.glb` bleibt als Rückfall.

### Spiel (`app/mods/beobachter.js`, nur Modell- und Bewegungsstellen)
- `beob_rigLaden` lädt das Rig. Schlägt das fehl, greift der alte Lader (`console.warn 'Beobachter: Rig …'`).
- Hautshader (`beob_rigMat`, MeshPhysical):
  - Poren und Fältchen dreiplanar im Bindungsraum, als Relief über Ableitungen; schwimmt nicht beim Skinning.
  - Gelenkfalten als Querrillen.
  - Adern bläulich unter der Haut.
  - Fleckung.
  - Nässe als fleckige Rauheit plus Klarlack.
  - Wachs-Randschimmer.
  - **Unter der Taschenlampe** scheint die dünne Haut warm-rot durch (Finger, Fühler, Lider, Hals, Kanten; die Adern dunkler rot), Uniform `uFl` aus Lampe, Mitte und Abstand.
  - Augen: nasse Hornhaut (Klarlack 1, IOR 1,38) über der dunklen Iris-Textur.
- Laufzeit-Schicht über dem Clip (`beob_rigAnim`):
  - Der Kopf ruckt wie bei einem Vogel (harte Feder), hält still, zittert fein und legt sich schief.
  - Geblendet dreht er den Kopf weg und kneift die Lider zu.
  - Blinzeln: selten, manchmal doppelt, manchmal sehr langsam.
  - Atem: Die Brust hebt sich, die **Kehle pumpt ohne Mund** (nach dem Laufen schnell).
  - **Erstarren wie ein Beutetier**, wenn Lukes Blick in die Nähe kommt: Der Clip läuft fast nicht mehr, er hält die Luft an und blinzelt nicht – „zu still“.
  - **Fühler als Federkette:** Trägheit des Kopfes, stetes Wippen (Kanon). Bei Geräusch oder Licht (Lampe an/aus, Luke rennt) stellen sie sich nach vorn und werden steif, der Kopf schnappt herum.
  - Die Finger tasten und zittern.
  - Der Körper dreht sich mit Ausholen und Nachschwingen.
  - **Spiegeln:** Bei jedem dritten Auftauchen etwa übernimmt er Lukes Kopfneigung (guckt Luke hoch, guckt er hoch).
- Verstecken:
  - `beob_peekSpot` liefert jetzt zusätzlich die Richtung von der Deckung nach außen (sp[3], sp[4]).
  - Er steht 7 cm weiter hinter der Deckung und **lehnt sich mit Kopf und Schulter hinaus** (`spaehenL/R`), die Hand an der Kante.
  - **Wird er angesehen, zuckt er zurück** (`zucken`, ab 0,16 s Blick). Die Ein-Sekunden-Regel lässt ihn danach unverändert verschwinden.
- Gesetzte Sichtungen (`beob_sichtung`):
  - Gangart nach Tempo: unter 1,25 m/s `trippeln`, darüber `vierbeinig`, im Stand `stehen`.
  - **Abspieltempo = Wegtempo**, kein Gleiten.
  - Schritte werden beim Aufsetzen im Clip hörbar (vorher fester 0,09-s-Takt).
  - Neu: `o.clip` erzwingt einen Clip (z. B. `'hocken'`, `'ablegen'`).
  - `o.ohren` spielt `ohren`.
- **Er lässt etwas liegen:** Beim Verschwinden aus einem Versteck im Ort ab Kapitel 3 liegt selten (12 %, höchstens einmal je Kapitel) ein frisch gefaltetes Bonbonpapier am alten Platz (`beob_spur('bonbon')`). Zettel bleiben wie gehabt.
- Töne: nicht angefasst, außer dass die Trippelschritte jetzt am Fußaufsatz hängen (Aufruf wie vorher: `Audio.play('stepG*' …)`). Kein neuer Ton.
- `CREDITS.md`:
  - Cute Alien Pet: Umformung, Lider, Skelett, Clips.
  - NoEdge HQ Male: Poren.
  - Realistic Eye Models: Iris und Äderchen.

## Kurz geprüft
- Syntax: `beobachter.js` und alle `tools/beobachter_*.mjs` sind fehlerfrei. Zusammenbau (`assemble.js`) ist durch, das Modul-Skript von `game/index.html` parst. KTX2 für `haut.png` und `auge.jpg` erzeugt.
- **Silhouette ohne Textur** (Filmstreifen, flach schattiert, CPU) mit allen zehn Clips: `C:/Users/GIGABYTE/_r21/film/beobachter.png` (Seite/schräg), `beobachter_vorn.png`.
  - Glatte Posen-Bilder: `C:/Users/GIGABYTE/_r21/pose/*.png`.
  - Behoben: Arme im Rumpf (Ruhe-Richtung beim Hängen), Arme in der Brust (Ziele weiter vorn), Bauch zerknittert (Rumpf ohne Oberschenkel-Gewicht, Gewichte geglättet), Spähen kippte zur falschen Seite, zu lange Schritte beim Trippeln und auf allen vieren.
- **Kein Sichtlauf im Spiel.** Ein erster Lauf scheiterte am Testaufbau (`G` noch nicht da), die Warteschlange war danach voll bzw. wurde abgebrochen. Ergebnis aus dem ersten Lauf: Warnungen „16 texture units“. Daraufhin Poren und Adern in eine Textur gepackt und Schattenempfang am Beobachter abgeschaltet. Ob die Warnung von ihm kam, ist nicht belegt.

## Für den Gesamttest (bitte prüfen)
Fertige Schritte: `C:/Users/GIGABYTE/_r21/t/mk.js` → `steps.json`; Lauf mit `bash C:/Users/GIGABYTE/_r21/run.sh`. Kap. 5 nachts, Straße bei (−58, 0, 1,5) und Ahornstraße (0, 0, 10).
1. **Lädt das Rig?** `beob_S.V.rig === true`, `Object.keys(beob_S.V.act)` = 10 Clips, keine Warnung „Beobachter: Rig“. Keine Shaderfehler, keine Warnung „texture units“ mit dem Beobachter im Bild.
2. **Nahaufnahme unter der Lampe:** Haut wirkt wie feuchtes Wachs mit Poren (nicht glatt, nicht verrauscht). Unter der Lampe scheinen Finger, Fühler, Lider und Hals warm durch. Augen dunkel mit Glanzpunkt, Lider halb geschlossen, Blinzeln sichtbar. Kein Mund, keine Nahtrisse am Hals.
   - Falls das Relief rauscht: Stärke `* .0011` im Shader senken.
   - Falls die Haut zu dunkel ist: Grundfarbe in `haut()` (`beobachter_rig.mjs`) anheben und neu backen.
3. **Süß:** Kopf legt sich schief, Hände vor der Brust (`zucken`/`trippeln`). **Gruselig:** Er erstarrt bei halbem Blick, geblendet dreht er den Kopf weg; auf allen vieren mit stillem Kopf.
4. **Spähen:** Er lehnt sich aus der Deckung zur richtigen Seite (weg vom Stamm/Auto), nur Kopf und Schulter sind frei. Beim Hinsehen zuckt er zurück, nach ≤ 1 s ist er weg (zwischen zwei Bildern). Die Ein-Sekunden-Regel und `S.test.maxVis ≤ 1 s` gelten unverändert.
5. **Weglaufen** (`beob_sichtung(null, T, { weg })`): Füße gleiten nicht, die Gangart wechselt mit dem Tempo, die Schritte sind im Takt hörbar. Die gesetzten Sichtungen Kap. 4 (Treppe der Villa) und Kap. 6 (Wrack) mit der neuen Gangart ansehen.
6. Kap. 2, Fast-Sichtung in der Lüftung: Er steht (Clip `stehen`), nach 0,8 s ist er weg.
7. Leistung: ein Exemplar, rund 38 000 Ecken skinned, 44 Knochen, Mixer nur wenn sichtbar, ein Schattenwurf, kein Schattenempfang.

## Offen / Bitten
- `klettern` ist gebacken, wird aber noch von keiner Szene benutzt (Bitte an Kino/Kap. 4: Fensterbrett/Zaun über `o.clip: 'klettern'` und Wurzelversatz `scene.userData.motion.klettern.wurzel`). `ablegen` und `hocken` sind ebenfalls über `o.clip` nutzbar.
- An R-19 (Raumklang): Die Trippelschritte hängen jetzt am Fußaufsatz in `beob_rigLauf`. Sollen sie räumlich anders klingen, bitte dort den `Audio.play`-Aufruf anpassen. Neue Laute (leises Klicken, Haut auf Holz beim Klettern) wären mit echten Aufnahmen schön, sind aber nicht eingebaut.
- Fab-Listing-Adresse für „Free High-Quality Male“ (NoEdge) in `CREDITS.md` nachtragen.
