# High Abyss Mira

Psychologischer Horror/Mystery in Lost Eyengless – „Ein Horror, der dich das Fürchten lehrt“ · directed by Lucidworkz (Three.js, Desktop-App mit Electron).

- `game/` – das Spiel (`index.html`, Assets unter `assets/`, Fab/Megascans/Unreal-Exporte). `game/index.html` wird **erzeugt** (siehe unten) – nicht direkt bearbeiten.
- `app/` – Desktop-App: `main.js`, `build.js` (kopiert `game/` nach `app/game`), `npm run release` baut die EXE; `mods/` = Welt-Module (Briefing, Katalog), `tools/` = Test-/Vorschau-Werkzeuge, `story/` = Story-Bibel
- `unreal/Scripts/` – Unreal-Python-Skripte (Export von Figuren, Tieren, Kanalstadt)

## Welt-Module
Das Grundspiel liegt in `app/mods/_base_source_index.html`. `node tools/assemble.js` (in `app/`) setzt daraus `game/index.html` zusammen:
alle `mods/<bereich>_patch.py` und `mods/<bereich>.js` in der Reihenfolge
Kirchberg (`ausbau_nord`) → Ost/West (`ausbau_ost_west`) → `strasse` → `gruen` → `fassaden` → `innen_ort` → `innen_kapitel` → `leben`
→ `ausruestung` (Batterien, Werkzeuge) → `uebergang` (gelaufene Kapitelwechsel) → `geheimnisse` (Lichtsteine, Wrackteile, Totems) → `figuren` (Unreal-Figuren)
→ `albers` (Lars Vegas) → `gedanken` (Lukes Selbstgespräche) → `whiskey` (der Rabe) → `visionen` (Totem-Visionen, Kinderblick) → `anwesen` (Villa Seiler, Kapitel 4)
→ `wald` (Forbidden Dustwoods) → `tiefwald` (der tiefe Wald, „Der rote Faden“) → `zayn` (Nebenquest „Versprochen ist versprochen“) → `cleo` (Die Vergessene)
→ `schrecken` (Schreckmomente außerhalb der Hauptstraße) → `entdecker` (17 Kerben, Belohnungsstufen) → `akte` (Die Akte Abgrund) → `klang` (Musik, Geräusche) → `traum` (Prolog).
Änderungen am Grundspiel also in `_base_source_index.html`, an der Welt in den Modulen – danach neu zusammensetzen.
Alle Anforderungen mit Status: `app/story/anforderungen.md`. Gültige Geschichte: `app/story/story_final.md`.

## Tasten
WASD bewegen · Maus umsehen · Umschalt laufen · Leertaste springen/hochziehen · E benutzen · F Taschenlampe · R Batterie wechseln
· **G Lichtsteine hochhalten (Kinderblick)** · Tab Abenteuerfibel · F3 Messanzeige (Bildzeiten, Draw Calls, Dreiecke, Kosten je Modul).

## Unreal-Modelle
`unreal/Export_Requisiten.bat` und `unreal/Export_Figuren.bat` im eigenen Unreal-Projekt ausführen (siehe `unreal/Scripts`).
Sie legen Modelle unter `game/assets/ue/<rolle>/` ab; das Spiel verwendet sie automatisch statt der Ersatzformen
(Rollen u. a. `lampe1–3`, `batterie`, `drahtschneider`, `brechstange`, `sicherung`, `lichtstein`, `wrack`, `leiter`, `totem`, `schluesselteil`;
Figuren `kind_junge`, `kind_maedchen`, `erwachsener`, `alter_mann`).

## Start (Entwicklung)
```
cd app
npm install
npm run build        # = node tools/assemble.js && node build.js
npx electron .
```
`build.js` nimmt standardmäßig `../game`; ein anderer Quellordner geht über die Umgebungsvariable `HAM_SRC`.
Einzelnes Modul testen: `node tools/work.js make <bereich> [patch.py|-] mods/<bereich>.js` (nutzt `app/game/index_base.html` ohne die übrigen Module).
