# Inventar 3D (Stand 10.10.2026)

Modul `app/mods/inventar3d.js` (in `assemble.js` direkt vor `tausch`, damit Beutel-/Tausch-Zusätze weiter unter die Liste hängen).

## Bedienung (Fibel → INVENTAR)
- Kategorien als Chips (nur vorhandene): Schlüssel · Werkzeug · Licht & Gerät · Papier & Akten · Ton & Foto · Erinnerung · Sonstiges; Sortierung NEUESTE / A–Z / ART.
- Liste scrollt (kein 12-Slot-Limit), je Gegenstand ein aus dem Modell gerendertes Symbol; „NEU“ bis zum ersten Anklicken.
- Detail: Modell mit Maus ziehen (drehen, Schwung), Rad (Zoom 0,6–2,6×), Doppelklick = zurück, Selbstdrehung im Leerlauf; Pfeiltasten wählen den Nachbarn.
  Text: Kategorie · Kapitel · Fundort, Beschreibung. BENUTZEN (Batterie → Lampe wechseln, sonst Hinweis), KOMBINIEREN (Batterie + Lampe → wechseln, sonst „passt nicht zusammen“).
- Aufheben: eigene Darstellung (Modell dreht sich groß, „AUFGENOMMEN“, Ton nach Art, fliegt zur Fibel); Warteschlange bei mehreren; nie über Notizen/Rätseln/Fibel.

## Technik
- Kein zweiter GL-Kontext: eigene Szene (Dreipunktlicht + Umgebungsbild aus Softboxen) wird mit dem Hauptrenderer in einen Zielpuffer (Halbfloat, MSAA) gezeichnet, per OutputPass getont und asynchron in ein 2D-Canvas gelesen. Puffer/Umgebung werden 8 s nach dem Schließen freigegeben.
- Fundorte: `INV3D.found[key] = { ch, ort, t }` (Ort = nächster Kartenname aus `karte_orte`), gespeichert über `MOD_SAVE 'inventar3d'`.
- Wache: erkennt neue Schlüssel in `story.items` (auch `story.items.push` ohne `addItem`), mehr als 2 auf einmal (Laden) = still.
- Modelle: `INV3D_MODELLE` (Id → Verzeichnis, Materialüberschreibung `mat`, `pick` = Teilmenge, `pit` = Anfangsneigung), `INV3D_ITEM` (Schlüssel → Id), `INV3D_REGELN` (Name → Id). Katalog: `docs/gameplay/item_katalog.md`.
- Abwandlungen je Gegenstand (`INV3D_VAR`): gleiches Modell, anderer Werkstoff/Größe/Tönung (Schlüssel, Kassetten, Papiere, Thermoskannen).
- Weltmodelle: Halsband (Basis-Torus) und Lucys Handy (Basis-Quader) werden ersetzt (`inv3d_welt`, `inv3d_weltHandy`); die übrigen Fundstücke der Kapitel nutzen bereits echte Modelle aus früheren Modulen.
- Aufheben-Stau: höchstens 3 wartende Darstellungen, der Rest kommt still ins Inventar (Massenvergabe/Laden).

## Modell-Pipeline
1. Poly Haven (CC0, API ohne Anmeldung): `HAM_FabDownloads/ph/dl.py <id> …` → `node tools/ph_pack.mjs <Quelle> <id>` → `game/assets/ms/ph_<id>/model.glb`.
2. `node tools/item_opt.mjs`: Teilmengen (Namensmuster), Texturen ≤ 1024 px, Dreiecke begrenzt (Meshopt-Simplify), schreibt `game/assets/ms/it_<id>/model.glb`.
3. Blender 4.5 (Store-Version, `blend_run.ps1` startet über den App-Alias): `tools/blender/item_bau.py` baut Kleinteile ohne Schrift (Umschlag, Brief, Zettel, Fahrkarte, Münze, Murmel, Ring, Glocke, Kreide, Halsband, Handy, Autoschlüssel, Folie, Plombe, Kronkorken, Riemen, Riegel, Schnalle, Dienstnadel, Sofortbild, Grinder, Blättchen, Knolle, Filter, Kinderschuh).
   Direktaufruf: `blender-launcher.exe -b --factory-startup -P item_bau.py -- <Ausgabe> [name …]` (aus PowerShell/cmd; Git-Bash mangelt Backslashes).

## Offen
- Weltmodelle der übrigen Fundstellen (jede Kapitel-Mod baut ihre eigenen; viele nutzen schon echte Modelle, die Basisformen anderer noch nicht).
- Kinderschuh ist eine einfache Form (kein Scan); Murmel/Papiere sind schlicht, aber ohne Schrift.
- Fab-Download war in der Browser-Pane nicht freigegeben; weitere hochwertige Modelle (Schlüsselbund, Kassette „echt“, Kinderschuh) bei Gelegenheit nachladen.
