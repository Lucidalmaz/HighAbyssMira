# High Abyss Mira

Psychologischer Horror/Mystery in Birkenhain (Three.js, Desktop-App mit Electron).

- `game/` – das Spiel (`index.html`, Assets unter `assets/`, Fab/Megascans/Unreal-Exporte). `game/index.html` wird **erzeugt** (siehe unten) – nicht direkt bearbeiten.
- `app/` – Desktop-App: `main.js`, `build.js` (kopiert `game/` nach `app/game`), `npm run release` baut die EXE; `mods/` = Welt-Module (Briefing, Katalog), `tools/` = Test-/Vorschau-Werkzeuge, `story/` = Story-Bibel
- `unreal/Scripts/` – Unreal-Python-Skripte (Export von Figuren, Tieren, Kanalstadt)

## Welt-Module
Das Grundspiel liegt in `app/mods/_base_source_index.html`. `node tools/assemble.js` (in `app/`) setzt daraus `game/index.html` zusammen:
alle `mods/<bereich>_patch.py` und `mods/<bereich>.js` in der Reihenfolge
Kirchberg (`ausbau_nord`) → Ost/West (`ausbau_ost_west`) → `strasse` → `gruen` → `fassaden` → `innen_ort` → `innen_kapitel` → `leben`.
Änderungen am Grundspiel also in `_base_source_index.html`, an der Welt in den Modulen – danach neu zusammensetzen.

## Start (Entwicklung)
```
cd app
npm install
npm run build        # = node tools/assemble.js && node build.js
npx electron .
```
`build.js` nimmt standardmäßig `../game`; ein anderer Quellordner geht über die Umgebungsvariable `HAM_SRC`.
Einzelnes Modul testen: `node tools/work.js make <bereich> [patch.py|-] mods/<bereich>.js` (nutzt `app/game/index_base.html` ohne die übrigen Module).
