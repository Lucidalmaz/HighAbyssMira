# High Abyss Mira

Psychologischer Horror/Mystery in Birkenhain (Three.js, Desktop-App mit Electron).

- `game/` – das Spiel (`index.html`, Assets unter `assets/`, Fab/Megascans/Unreal-Exporte)
- `app/` – Desktop-App: `main.js`, `build.js` (kopiert `game/` nach `app/game`), `npm run release` baut die EXE; `mods/` = Welt-Module (Briefing, Katalog), `tools/` = Test-/Vorschau-Werkzeuge, `story/` = Story-Bibel
- `unreal/Scripts/` – Unreal-Python-Skripte (Export von Figuren, Tieren, Kanalstadt)

Start (Entwicklung): `cd app && npm install && node build.js && npx electron .`
