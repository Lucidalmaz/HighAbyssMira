# Wendigo – Integrationsanleitung, Testplan, Gate (Folgeauftrag 8)

Stand 12.10.2026. Alles hier ist **vorbereitet, nicht eingebaut**: `app/mods/wendigo.js` steht nicht in `tools/assemble.js`, es lief nie in einer Spielinstanz (der Vorbereitungslauf durfte keine starten).
Der Integrationslauf (mit Spielinstanz) baut nur noch ein, misst und korrigiert. Konzept, Kanon, Texte: `docs/gameplay/wendigo_konzept.md`.

## 1. Dateien

| Pfad | Inhalt |
|---|---|
| `app/mods/wendigo.js` | Modul: Zustandsmaschine, Auftritte nach Tabelle, Spuren/Kadaver/Fund, Texte, Speicherung, Testzugriff `window.__wd` |
| `game/assets/ms/wendigo_hirschding/model.glb` | originale Gruselform: aufrecht, gestrecktes Hirschskelett, Fleisch/Knochen, eigenes asymmetrisches Geweih, 12 Clips |
| `game/assets/ms/wendigo_fleisch/model.glb` | geschältes Reh (gebackene Muskel-/Sehnen-Textur, Morphs) |
| `game/assets/ms/wendigo_haut/model.glb` | haarlose, graue Haut mit Falten, Adern, Blutergüssen |
| `game/assets/ms/wendigo_reh/model.glb` | Reh in Fell + Fleischschicht darunter, Morphs `riss`, `kopf_falsch`, `maul_auf`, `knochen`, Blutflecken als Vertexfarbe |
| `game/assets/ms/wendigo_hirsch/model.glb` | wie Reh, Hirsch mit Geweih, Morph `geweih_klein` |
| `game/assets/ms/wendigo_vorschau/*.jpg` | Vorschaubilder (Studio/Nacht, mehrere Winkel, Posen) |
| `app/tools/blender/wendigo_*.py` | Baukette (Blender 4.5, Store-Version): `wendigo_tiere_bau.py` (Einstieg), `_lib`, `_morphs`, `_hirschding_bau`, `_clips`, `_vorschau` |

Neu bauen (ein Modell): `blender-launcher.exe -b --factory-startup --threads 4 -P app/tools/blender/wendigo_tiere_bau.py -- <Arbeitsordner> <fleisch|haut|reh|hirsch|hirschding> 2048 <Ausgabeordner>`.
Vorschau: `… -P wendigo_vorschau.py -- <glb> <Präfix> <studio|nacht> <ansichten> [clip] [bild] [shape=wert,…] [px]`. Das Blender-Skript schreibt sein Protokoll nach `<Arbeitsordner>/build_<form>.log`
(Store-Blender liefert keine Konsolenausgabe an Aufrufer).

## 2. Einbau-Schritte (Reihenfolge)

1. **assemble.js:** in `ORDER` `'wendigo'` direkt nach `'kreaturen'` einfügen (vor `'raender'`). Das Modul benutzt Funktionen aus `hungrige`, `beobachter`, `spannung`, `auftritt`, `figuren`, `leben` nur zur Laufzeit (alles `typeof`).
2. **Bauen:** `node app/tools/assemble.js` (Testbau), Syntaxwarnungen beachten (Modul besteht den Syntaxtest, `node` geprüft).
3. **Texturen komprimieren:** `node app/tools/ktx.mjs` (erzeugt `*.ktx.glb`, in `.gitignore`; ohne das lädt das Spiel die Roh-GLB, deutlich mehr Grafikspeicher).
4. **Selbsttest in der Dauerinstanz** (`_live.sh start normal`):
   * `__wd.report()` → `mode: 'schlaf'`, `modelle: []` (Vorladen startet 90 s nach Spielstart).
   * `__wd.form('hirschding', { clip: 'idle' })` – Modell erscheint 14–24 m voraus; `__wd.aus()` blendet aus.
   * `__wd.auftritt('k3_reh')` usw. für jedes Ereignis aus `WD_AUFTRITTE` (Zustand, Gedanke, Fibel-Eintrag, Spuren).
5. **Hook-Stellen je Kapitel** (nur dort, wo das Modul nicht selbst auslösen kann; je ein Einzeiler im bestehenden Modul, danach `typeof`-geschützt):

| Kapitel | Hook | Datei / Stelle | Aufruf |
|---|---|---|---|
| 1 | Kellerszene vorbei (frühestens Auftritt) | `kapitel1.js` nach „… danke, Luke …“ | `if (typeof __wd !== 'undefined') __wd.S.next = Math.max(__wd.S.next, __wd.S.t + 120)` (optional; sonst Zeitplan nach `WD_PARAM.start`) |
| 1 | Nebenaufgabe 18 „Wildschaden“ | `gruen.js` `gruen_wild` Abschluss | nichts nötig; Modul zählt Vorboten nicht doppelt |
| 2 | Bestandsliste im Archiv | `amt.js` Archiv-Interakt „Regal BERGUNG“ | `__wd && __wd.zettel('bestand')`; Prüfraum/Futter: `__wd.zettel('futter')` |
| 3 | Kassette/Band abgespielt | `stimmen.js` Kassetten-Wiedergabe / `kapitel3.js` Funk | `__wd && __wd.tonband()` |
| 4 | Fenster der Villa | `fensterfigur.js` / `anwesen.js` (Gardine Obergeschoss) | `__wd && __wd.fenster()`; Silhouette (Hofers Gesicht) über `fensterfigur` selbst zeigen, dann Ton/Gedanke über den Hook |
| 4 | Pells Heft gelesen | `villa.js` `VILLA_PELL` nach Eintrag 4 | `__wd.S.wissen = 1` |
| 5 | Nr. 1, Außenwand | automatisch über `indoorRects` (kein Hook) – bei Bedarf `__wd.spur('kratz')` mit fester Wand | |
| 5 | Abspann-Kino | `kino.js` K5 vorhanden | nichts nötig |
| 6 | Übergabe | automatisch (`mode: 'k6'`, Modul passiv) | `hungrige.js` kann `__wd.form(...)`/`__wd.uebergang(...)` für Formwechsel nutzen |

6. **Beobachter-Spiegel:** schon verdrahtet (`BEOB_SPERREN.push(wd_nah)`): Beobachter schweigt, solange der Wendigo ≤ 40 m sichtbar ist.
7. **Regie:** `SP_GAP` erweitert (`wd_ev`, `wd_ton`, …); jede Auslösung geht durch `spannung_can('wd_ev','amb')`, danach `spannung_did`.
8. **Spielstand:** `MOD_SAVE` Schlüssel `wendigo` (`done`, `n` je Ereignis, `wissen`). Beim Kapitelwechsel räumt das Modul Dekor/Spuren weg (Folgeauftrag 6 – keine Reste).

## 3. Leistungsbudget (Soll) und Messwerte der Modelle

| Form | Dreiecke (gemessen, GLB) | Knochen | Texturen | Bemerkung |
|---|---|---|---|---|
| hirschding | 16 770 | 34 (31 + Kiefer + 2 Geweih) | 3 × 2048² (Farbe, Normal, Rauheit/AO), 1 Material | 12 eigene Clips, Meta in `scene.extras.motion` |
| fleisch | 5 416 | 31 | 3 × 2048², 1 Material | Morphs `knochen`, `kopf_falsch`, `maul_auf`; 5 eigene + 22 Original-Clips |
| haut | 5 416 | 31 | 3 × 2048², 1 Material | wie fleisch |
| reh | 15 960 (Körper 5 416 + Fell 5 128 + Fleischschicht 5 416) | 31 | Original (Körper, Fell) + 3 × 2048² innen, 3 Materialien | zusätzlich Morph `riss`, Vertexfarbe `Col` |
| hirsch | 16 074 | 31 | wie reh | zusätzlich Morph `geweih_klein` |

Regeln des Moduls: höchstens **eine** Form sichtbar, **ein** Akteur, Kadaver als eigene Instanz (je ≤ 5 400 Dreiecke, höchstens 2 gleichzeitig, beim Kapitelwechsel entfernt); keine eigenen Shader; keine Lichter; kein
Schatten (`castShadow = false`); Mixer läuft nur, wenn die Form sichtbar ist; Vorladen nacheinander im Leerlauf (90 s nach Start, 2,5 s Abstand), `renderer.compileAsync` je Modell (Shader-Wache); Decals ≤ 40 (Plane,
geteilte Geometrie/Material). Erwartete Mehrkosten: ≈ 60–90 MB Grafikspeicher nach KTX2 (5 Formen), +1 Programm je Materialvariante (MeshStandardMaterial, Skinning, Morph).

## 4. Testplan (Integrationslauf, mit Spielinstanz)

1. **Ladung/Speicher:** `perf_gate.mjs --no-reload` vor und nach dem Einbau vergleichen (Programme ± 8, Grafikspeicher ± 250 MB, Neukompilierungen ≤ Referenz + 15).
2. **Je Ereignis** (14 Stück): `__wd.auftritt(id)` → Kontaktbogen aus 3/6/12 m, Tag/Nacht (`docs/gameplay/fotos_1010`-Verfahren), Prüfpunkte:
   * Form steht auf dem Boden (Strahl), kein Schweben/Einsinken, Kopf in Rasten, kein Gleiten beim Rückwärtsgang (Reh), Dither-Fade statt Poppen.
   * Gedanke/Fibel-Eintrag erscheint genau einmal, Spielstand speichert, nach Laden kein Wiederholen.
   * Beobachter still (Zähler `beob_S.stat`), Regie-Abstand eingehalten (`SP.log`).
3. **Zustandsmaschine:** Licht auf die Form (Rückzug < 1,5 s), Annäherung < 12 m (Rückzug), Wegblicken (Verschwinden), 45 s Zeitlimit; `report().stat` mit Zählern.
4. **Dosierung:** 30-Minuten-Lauf je Kapitel 1–5: Anzahl Auftritte ≤ `WD_PARAM.max`, Abstände ≥ `gap`, nie im Kino/Dialog/Tod; Kontrolle `SP_GAP`.
5. **Regression:** Gate aller bekannten Fehlerklassen (schwebende Objekte, Rückwärts/Seitwärts, Disco-Kopf, Kollision durch Decals, Softlocks, Doppeltexte), `perf_gate.mjs` grün.
6. **Modelle in Spielkamera:** `hirschding` clips `stehen`, `gehen` (Tempo 1,2 m/s ≙ Meta), `lauern`, `sturm`, `schrei`, `uebergang` – Fußgleiten messen (Fußpunkt-Weg je Zyklus = Meta-Tempo × Dauer ± 5 %); Skinning-Artefakte
   an Schulter/Hüfte prüfen (bekannter Schwachpunkt: harte Kieferkante, siehe Offenes).
7. **Übergänge:** `__wd.form('reh')` → `__wd.uebergang('reh','fleisch')`: Morph `riss` + Clip `uebergang`, Dither-Wechsel; zweite Kette `hirsch` → `hirschding` (Geweih wächst: `geweih_klein` 1 → 0).

## 5. Gate-Anforderungen

* `node app/tools/perf_gate.mjs` bestehen (Doku `TESTEN.md`, Budget `performance_budget.md`, Stand `leistung_1010.md`). Rot = nicht committen.
* Neue Messpunkte brauchen keine PT-Einträge (Dorfrand-Auftritte); wenn ein Auftritt an einem festen Ort liegt, Messpunkt ergänzen.
* Texturen 2048² nur für Hirschding/Fleisch/Haut (prägnant); Reh/Hirsch nutzen die Originaltexturen + 2048² Innenschicht (kann auf 1024² verkleinert werden, falls Speicher knapp:
  Neubau mit Auflösung 1024 im Skript, 4. Argument).
* Kanon-Regel prüfen: kein Auftreten der Wörter „Wendigo“/„Hungrige“ in Kap. 1–5-Texten (Suche in `WENDIGO_TEXTE`).

## 6. Offenes (ehrlich)

* **Nicht im Spiel getestet.** Alle Hooks sind aus dem Code gelesen, nicht ausgeführt; Fehler im Takt fängt `try/catch` (setzt das Modul still aus).
* **Zähne** des Hirschdings fehlen (Platzierung an der Mundspalte nicht sauber gelöst); der Kiefer ist als Knochen (`STAG_-Jaw`) vorhanden, Zähne nachbauen (Blender: Kegelreihen an Kieferkante).
* **Augen:** Höhlen sind tief modelliert, der Glutpunkt „hinter Milchglas“ fehlt als Teil; im Spiel über `emissive`-Sprite/Mesh in der Höhle setzen (wie `kr_hirschding`: Material `eye`).
* **Rippen** sind nur als Normalmap (nicht als Silhouette); Silhouette des Rumpfes bleibt Hirschrumpf.
* **Rig:** Gewichte stammen vom Original (Hals gestreckt: leichte Dehnung am Halsansatz möglich); Kieferknochen mit hartem Übergang; Hufe/Geweih ohne Pendelknochen (Geweihknochen existieren, nur im Clip `uebergang` benutzt).
* **Clips der Tierformen** sind einfach (Hals/Kopf/Körperhöhe); Beobachten/Lauern/Brüllen/Fressen/Übergang ohne Fußfixierung bei `lauern`.
* **Mensch im Fenster** (Hofers Gesicht): kein eigenes Modell; Hook `__wd.fenster()` liefert nur Ton/Gedanke; Silhouette über `fensterfigur.js` zu setzen.
* **Lizenz/Herkunft:** Basisnetze aus `animal_deerdoe`/`animal_deerstag` (bereits im Spiel/CREDITS); Textur, Geweih, Verformung, Rig-Erweiterung, Clips sind eigene Arbeit. CREDITS.md-Eintrag „Wendigo-Formen: eigene Arbeit auf Basis Animal Variety Pack“ ergänzen
  (CREDITS.md liegt außerhalb des Auftragsumfangs dieses Laufs).

## 7. Selbstbewertung der Vorschaubilder (Schulnoten; Bilder in `game/assets/ms/wendigo_vorschau/`)

Maßstab: prägnante Dinge ≥ 2, Unprägnantes 3 erlaubt. Ehrlich: **keine Form erreicht durchgängig die 2; das Hirschding (die prägnanteste Form) steht bei 3+**, die Gründe stehen unter „Mängel“.

| Form | Bild(er) | Gesamt | Silhouette/Pose | Material/Textur | Gesicht/Kopf | Mängel (Nacharbeit) |
|---|---|---|---|---|---|---|
| hirschding | `hirschding_stehen_{seite,34,vorn,kopf,geweih}`, `_gehen_34`, `_schrei_34`, `_sturm_34`, `_lauern_34`, `_uebergang_34`, `_nacht_{34,kopf}`, `_ruhe_{34,hinten}` | **3+** | 2 (aufrecht, lange Glieder, Geweih groß/schief; Posen glaubwürdig) | 3 (Muskel/Fasziennetz sauber, aber gleichförmig; Geweih einfarbig) | 3 (Schädel organisch, Augenhöhlen tief; **Zähne und Glutaugen fehlen**, Kiefer wirkt wie Lappen) | Zähne, Augenglut, Geweih-Farbvariation/Bast kräftiger, Rippensilhouette, Fingerhufe, Gewichte Kiefer |
| fleisch | `fleisch_{34,seite,kopf}`, `_nacht_34`, `_bruellen_34` | 2− (Ferne) / 3 (Nahaufnahme) | 3 (Reh-Silhouette, keine Rippen) | 2 | 3 | Rippenrelief als Geometrie, Lippen weg/Zähne, Wunde mit Knochen |
| haut | `haut_{34,kopf}`, `_nacht_34` | 3 | 3 | 3 (zu gleichmäßig, Blutergüsse rosa) | 3 | Falten stärker, lose Haut als Geometrie, Bauchnaht |
| reh | `reh_{34,kopf}`, `_nacht_34`, `_uebergang_34` | 2− (Tier) / 3 (als Wendigo-Form) | 2 | 2 (Original-Fell) | 2 | milchige Augen, Blutflecken sind Vertexfarbe (in Blender-Vorschau unsichtbar, im Spiel sichtbar prüfen) |
| hirsch | `hirsch_{34,geweih}`, `_nacht_34`, `_uebergang_34` | 2− / 3 | 2 | 2 | 2 | Bast-Streifen am Original-Geweih fehlen (nur am Hirschding), Geweih-Wachstum als Skalierung |
| Übergänge (Morphs/Clips) | `reh_uebergang_34`, `hirsch_uebergang_34`, `hirschding_uebergang_34` | 3 | | | | Rissmorph öffnet nur die Rückenlinie; kein Haut-Fetzen-Partikel; Clip `uebergang` einfach |
| Animationen | `hirschding_*` | 3 | Bewegung aus Clip-Posen mit IK/Gangplaner geprüft (Standbilder), **nicht in Bewegung/Spiel gesehen** | | | Fußgleiten ungemessen |

Punkte mit Note ≥ 4: keine; **offen mit Note 3 bei prägnanten Dingen** (Hirschding Kopf, Material): im Integrationslauf mit Kontaktbogen aus 3/6/12 m nachbessern.
