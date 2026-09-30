# Anleitung: Was nur auf deinem PC geht

Das Spiel ist fertig zusammengebaut und läuft auch ohne diese Schritte: Für fehlende Unreal-Modelle nimmt es die vorhandenen Scans und Ersatzformen.
Die Schritte 2 bis 4 tauschen nur die Ersatzformen (Taschenlampen, Werkzeug, Schlüsselteile …) und die Echo-Kinder gegen echte Unreal-Modelle mit Skins aus.
Das geht nur auf deinem Rechner: Hier in der Cloud gibt es weder Unreal noch eine Grafikkarte, und Fab/Quixel sind gesperrt.

## 1. Neuesten Stand holen
```
cd <dein Ordner>\HighAbyssMira
git fetch origin
git checkout claude/wonderful-wozniak-twn7nr
git pull
```

## 2. Unreal vorbereiten (einmalig)
1. Öffne dein Projekt `HighAbyssMira.uproject` in Unreal Engine 5.x.
2. Gehe zu **Edit → Plugins** und aktiviere diese beiden Plugins. Danach Unreal neu starten.
   - **Python Editor Script Plugin**
   - **glTF Exporter**
3. Hole die Modelle über **Fab** (im Editor: Fenster → Fab) ins Projekt, per „Add to Project“.
   - Pro Zeile unten genügt jeweils **ein** Modell.
   - Die Skripte finden sie über den Dateinamen. Die Suchbegriffe stehen in Klammern.

| Rolle im Spiel | Wonach suchen (Beispiele) |
|---|---|
| lampe1, lampe2, lampe3 | Taschenlampe klein (flashlight), Stablampe (maglite / tactical light), Handscheinwerfer oder Laterne (lantern, work light) |
| batterie | battery |
| drahtschneider | bolt cutter, wire cutter |
| brechstange | crowbar |
| sicherung | fuse |
| lichtstein | small rock, pebble |
| wrack | scrap metal, sheet metal |
| leiter | ladder, metal |
| totem | totem, effigy, wicker, voodoo |
| schluesselteil | old key, skeleton key, iron key |
| kind_junge, kind_maedchen | ein Kind-Charakter (boy, girl), am besten mit Idle-, Walk- und Talk-Animation am selben Skelett |
| erwachsener | ein erwachsener Mann (civilian, worker), mit Animationen |
| alter_mann | ein alter Mann (old man, grandpa) für Lars Vegas, mit Animationen |

## 3. Exportieren (Doppelklick)
1. Schließe Unreal. Die Skripte starten den Editor selbst, ohne Fenster.
2. Doppelklicke `unreal\Export_Requisiten.bat`.
   - Das dauert 2 bis 10 Minuten.
   - Am Ende zeigt das Fenster, welches Modell je Rolle genommen wurde.
3. Doppelklicke `unreal\Export_Figuren.bat`. Das dauert ebenfalls 2 bis 10 Minuten.
4. Wenn ein Fenster „Unreal-Projekt nicht gefunden“ oder „UnrealEditor-Cmd.exe nicht gefunden“ meldet:
   - Öffne eine Eingabeaufforderung (cmd) im Ordner `unreal`.
   - Gib die Pfade von Hand an:
   ```
   set HAM_UPROJECT=C:\Pfad\zu\HighAbyssMira.uproject
   set HAM_UE=C:\Program Files\Epic Games\UE_5.4\Engine\Binaries\Win64\UnrealEditor-Cmd.exe
   Export_Requisiten.bat
   Export_Figuren.bat
   ```
5. Wenn das Skript für eine Rolle das falsche Modell nimmt, lege die Wahl selbst fest.
   - Datei `unreal\Scripts\export_props_pick.json`, z. B. `{"brechstange": "/Game/Pfad/SM_Crowbar"}`. Für Figuren heißt die Datei `export_figures_pick.json`.
   - Den Pfad bekommst du im Content Browser: Rechtsklick → Copy Reference, dann nur den Teil `/Game/...` bis vor den Punkt.
   - Danach die .bat noch einmal starten.
6. Ergebnis: neue Ordner unter `game\assets\ue\<rolle>\` (model.glb und info.json) und `game\assets\ue\chars\<rolle>\` (Mesh, Animationen und manifest.json).
   - Die Logs `unreal\Scripts\export_props_log.txt` und `export_figures_log.txt` listen alle Kandidaten.

## 4. Spiel bauen und starten
```
cd app
npm install
npm run build
npx electron .
```
- `npm run build` setzt `game/index.html` aus allen Modulen zusammen und kopiert das Spiel samt deiner neuen Modelle in die App.
- Zum Weitergeben baust du mit `npm run release`. Die EXE liegt dann in `app\dist\High Abyss Mira-win32-x64\`.

## 5. Probespielen auf deiner Grafikkarte (Checkliste)
Hier konnte ich nur mit einer Software-Grafikkarte testen (etwa 0,1 Bilder pro Sekunde). Die echte Bildrate musst du selbst prüfen.
- Mit **F3** öffnest du die Messanzeige.
- Ziel: „95 %“ unter 16,7 ms (60 Bilder/s), „Ruckler >33 ms“ bleibt fast bei 0.
- Wenn es ruckelt: **Einstellungen → Grafik** eine Stufe runter und mir die F3-Werte von der Stelle schicken.

Die Stellen, die ich hier nur ohne echte Grafik prüfen konnte:
1. **Start:**
   - Menümusik läuft sofort.
   - Titel „HIGH ABYSS MIRA“ flackert.
   - Menü und Fußzeile überdecken sich nicht (auch im Fenster, nicht nur Vollbild).
2. **Neues Spiel:**
   - Traum mit dem Raben: 5 Einstellungen, der Rabe fliegt zur Fibel.
   - Mit Klick, Esc oder Leertaste lässt sich der Traum überspringen.
   - Danach: „Huh…? Warum stehe ich …“, dann weiterspielen.
3. **Schritte:** Asphalt nass, Laub, Kies, Holz im Haus, Wasser im Kanal klingen verschieden.
4. **Kapitel 1 → 2 → 3:** Du läufst durch, ohne Ladebildschirm. Beim Übergang in den Tunnel und in den Kanal darf es nicht hängen.
5. **Forbidden Dustwoods** (Lücke im Nordzaun hinter dem Spielplatz, ab Kapitel 3):
   - Rehe, Fuchs und Wölfe sind unterwegs.
   - Die Bildrate im dichten Wald prüfen.
6. **Zayn:**
   - Rucksack in Nr. 7 → Kamera.
   - Die 6 Fotos zeigen den Spielplatz, jedes Mal fehlt etwas.
7. **Der tiefe Wald** (eingedrückter Zaun hinter Zayns Hütte): Bildrate, Dunkelheit (mit Lampe gut lesbar?), Wölfe am Steinkreis, Wildschweine am Bus, Weiher-Szene.
8. **Entdecker:** Kreidestriche an Laternen, Umschläge „VERTRAULICH“, Fortschritt in der Fibel unter FUNDE.
9. **Villa Seiler:** Die acht Schlüsselteile, die Presse (nach Kapitel 3) und die Halle in Kapitel 4.
10. **Wände:** Nirgends durch Wände oder Decken sehen, auch nicht beim Springen an Tischen oder Kanten.
