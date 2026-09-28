# High Abyss Mira – Gesamtauftrag (alle Anforderungen aus dem Chat)

Stand der Sammlung: 28.09.2026. Status: ✅ umgesetzt + zur Laufzeit geprüft · 🟡 umgesetzt, (noch) nicht zur Laufzeit geprüft · ⬜ offen · ⛔ hier technisch nicht möglich (Grund steht dabei)

## A. Qualitäts-Prompt (Technik, Spielgefühl, Robustheit, ehrliche Prüfung)
| # | Anforderung | Status |
|---|---|---|
| A1 | Projekt verstehen, Ausgangszustand sichern, Build prüfbar | ✅ `app/tools/assemble.js` (Syntaxprüfung je Modul) |
| A2 | Messbare Performance (Frame-Zeiten, Ruckler, Draw Calls) | ✅ F3-Messanzeige; Draw Calls Hauptstraße 447 320 → 1 553. Schatten-Diät + Figuren-Sichtprüfung (Dreiecke je Bild inkl. Schatten): Villa 21,0 → 8,8 Mio., Wald 14,7 → 8,9, Spielplatz 27,4 → 20,7, Hauptstraße 24,8 → 20,4, Friedhof 35,9 → 26,5 |
| A3 | Ruckler/Steuerung/Abläufe; Mondschatten folgt dem Spieler | ✅ + Grafikqualität Niedrig/Mittel/Hoch (Onboard-Grafik startet auf Mittel) |
| A4 | Kollision: nirgends durch Wände/Decken sehen oder glitchen (Tisch + Doppelsprung) | ✅ Prüfskript, 0 Verstöße |
| A5 | Robuste Abläufe (Menü, Laden, Kapitelwechsel, Pause) | ✅ Kapitel 3 → Endkarte → Kapitel 4 → Presse → Tür → Halle → Endkarte durchgespielt; Spielstand sichert jetzt auch den Fortschritt der Welt-Module (Zayn, Cleo, Wald, Villa, Whiskey, durchsuchte Stellen, Visionen) – Laden geprüft; erledigte Aufgaben werden sofort gesichert |
| A6 | Audio: natürlich, gruselig, nicht nervig; adaptive Musik + passende Aufnahmen | ✅ Musiksystem, Mischregeln |
| A7 | Story verständlich, tief, spannend, mit Twists; Vergleich mit Top-Genre-Spielen | 🟡 Story-Bibel; Stimmigkeitsprüfung aller Texte (Abschnitt F) |
| A8 | Abschlussbericht: überprüft / nicht überprüft / empfohlen | ✅ im Chat + `ANLEITUNG.md` |

## B. Ausrüstung, Übergänge, Rätsel
| # | Anforderung | Status |
|---|---|---|
| B1 | Bessere Taschenlampe nach Kap. 2, weitere Stufen später | ✅ 3 Stufen |
| B2 | Batterien, Drahtschneider, Brechstange, Sicherung u. a. für Rätsel (Kap. 1–3) | ✅ |
| B3 | Keine Teleport-Kapitelwechsel – alles selbst laufen | ✅ Kap. 1→2 und 2→3 gelaufen |
| B4 | Nichtlineare Geheimnisse, Rätsel, Quests mit rotem Faden | 🟡 |
| B5 | Mystery-Items: Totems, Wrackteile, Leuchtsteine | ✅ |
| B6 | Totems zeigen Visionen als Hinweissystem | ✅ `visionen.js` (Kameraflug + Rückkehr geprüft) |
| B7 | Leuchtsteine mit nützlicher, „krasser“ Funktion | ✅ Kinderblick (Taste G): Lichtsäulen über allem Verborgenen, Ladungen = Steine (geprüft) |
| B8 | Gefühl „viel zu tun und zu entdecken“, ohne Überforderung | 🟡 Hinweis-Register, gestaffelte Freischaltung |

## C. Grafik / Unreal
| # | Anforderung | Status |
|---|---|---|
| C1 | Alle Grafiken aus Unreal/Fab, realistisch | 🟡 alle Scans stammen aus dem Paket; Zusatzmodelle über Exportskripte |
| C2 | „Exportiere selbst aus Unreal“ | ⛔ Hier gibt es kein Unreal und keine GPU; fab.com/unrealengine.com/quixel.com sind gesperrt → `unreal/Export_*.bat` exportiert auf deinem PC, das Spiel lädt die Dateien automatisch |
| C3 | Echo-Geisterkinder mit echten Skins und Gesichtern, flüssige Animation | 🟡 Anbindung fertig; echte Modelle brauchen `Export_Figuren.bat` |

## D. Figuren & Erzählung
| # | Anforderung | Status |
|---|---|---|
| D1 | Kap. 3: grummeliger Verschwörungstheoretiker, der recht behält (Unreal-Modell) | 🟡 Lars Vegas |
| D2 | Selbstgespräche: Luke hinterfragt, zeigt Gefühle | 🟡 `gedanken.js` |
| D3 | Umbenennungen: Zayn, Roxy, Lucy, Luke, Heidi, Dina, Mike, Cleo; Lars Vegas; Hund Bruno; Lost Eyengless; Atlantschiss; Forbidden Dustwoods | ✅ Suche im fertigen Spiel: keine alten Namen mehr in sichtbaren Texten (nur noch interne Bezeichner) |
| D4 | Cleo: eigene emotionale Storyline | ✅ `cleo.js`: achter Stein, Akte ohne Nummer, Baumhaus (Leiter, Truhe), Kreide-Ende – zur Laufzeit durchgespielt |
| D5 | Zayn-Nebenquest exakt nach Vorgabe (Rucksack, Kamera + 6 Fotos, Spur, Häuschen, Radio, letzte Zeichnung, keine Antwort) | ✅ `zayn.js`: Rucksack, 6 echte Fotos, Puzzle, Spur, Hütte, Radio, Zeichnung – zur Laufzeit geprüft |
| D6 | Forbidden Dustwoods: dicht, lebendig, gruselig, Tiere mit Interaktion, Aufgaben | ✅ `wald.js`: 538 Bäume, 3 Rehe + Hirsch, Fuchs mit Schuh, 2 Wölfe + Welpe in der Schlinge; alle Wege begehbar, Zaun dicht (Laufzeittest) |
| D7 | Rabe Whiskey: begleitet, gibt Hinweise und Aufgaben, Justin klärt auf | 🟡 `whiskey.js` |
| D8 | Mansion in Lost Eyengless: sofort erreichbar, verschlossen; 8 Schlüsselteile in Kap. 1–3 an schwer zugänglichen Orten; Maschine nach Kap. 3; Betreten in Kap. 4; Unreal-Mansion + Grusel-Flair | ✅ `anwesen.js`: Villa Seiler (Mansion-Scan), 8 Teile, Prägepresse, Kapitel 4 mit Halle – zur Laufzeit geprüft |

## F. Klang, Anfang, Startbildschirm (Nachtrag)
| # | Anforderung | Status |
|---|---|---|
| F1 | Sounds/Musik: nichts störend oder überladen, aber nie still; schaurige Musikstücke je Ort | ✅ `klang.js`: 10 komponierte Stücke (49–81 s) werden fehlerfrei gerendert, gleiche Lautheit, Spitzen < 0,7; Ortswahl, kürzere Pausen. Klangeindruck selbst: nur mit Lautsprechern beurteilbar |
| F2 | Passende Hintergrundgeräusche (Tiere usw.) | 🟡 Waldkauz, Fuchs, Reh, Krähen, Hunde, Dachrinnen, Totholz; keine Grillen im November |
| F3 | Weltgeräusche prüfen: Regen, Schritte je Untergrund, Türen, bewegte Gegenstände | 🟡 nasser Asphalt, Laub, Kies, Wasser, Holz, Beton; Tür auf/zu verschieden; Aufheben klingt |
| F4 | Anfangsstory: Traum, Rabe flüstert, gibt Auftrag + Abenteuerfibel; Aufwachen: „Huh…? Warum stehe ich …“ | ✅ `traum.js`: 5 Kamerafahrten mit Rabe (Bilder geprüft), Fibel im Inventar, Aufwach-Sätze |
| F5 | Startbildschirm: Name eindrucksvoll/gruselig, Vermerk Lucidworkz, schaurige Musik, kein Birkenhain | ✅ Menümusik läuft, Titel flackert; Layout für niedrige Fenster korrigiert |

## G. Wald, Schrecken, Belohnung, Vorgeschichte (Nachtrag)
| # | Anforderung | Status |
|---|---|---|
| G1 | Wald nie leer: dicht, viele Bäume, viel Laub und Gestrüpp, düster, geheimnisvoll, immer tiefer hinein | ✅ `tiefwald.js`: 110 m tiefer Teil hinter dem Zaun, 792 Bäume, 34 umgestürzte Stämme, Unterholz, Totholz-Gestrüpp, Laubflecken, fallende Blätter, Nebelschwaden; Dunkelheit und Nebel wachsen mit der Tiefe; alle Wege begehbar (Laufzeittest), 6–9 Mio. Dreiecke je Bild |
| G2 | Viel zu erkunden und zu erledigen im Wald | ✅ Nebenaufgaben „Der rote Faden“ (5 Zettel, Hochsitz zum Klettern, Amtsbus, Steinkreis, Weiher) und „Die Rotte“; Autowrack, Jonas’ Lager mit Karte, Schaukel, Stein in den Weiher – alles durchgespielt |
| G3 | Lebendig, wilde Tiere begegnen | ✅ Wolfsrudel (lauert, weicht Licht, springt einmal an – friedlich nach „Die Schlinge“), Wildschweinrotte (Angriff, Flucht), Rehe, Augen im Dunkeln, Krähen, Käuzchen, Fuchs – Laufzeittest |
| G4 | Schreckmomente und Jumpscares im ganzen Spiel und Wald | ✅ `schrecken.js`: 7 feste Momente außerhalb der Hauptstraße + Zufallsmomente (Laternenmann, Schritte hinter dir, Gestalt zwischen Bäumen); im tiefen Wald 7 weitere (Krähen, Kind unter dem Hochsitz, Keiler, Wolf, achter Stöckchenmann, Gesicht im Weiher, Schritte/Läufer) |
| G5 | Erkunden soll sich belohnend anfühlen, überall etwas zu entdecken | ✅ `entdecker.js`: 17 Kerben (Abzählreim) über die ganze Stadt, 6 Belohnungsstufen nach Funden (Batterien, Akku, Kinderblick, Lichtkegel, Erinnerung 2009, „M.“), Fortschritt in der Fibel |
| G6 | Whistleblower-Notizen: Vorgeschichte, Vertuschung, Bergung nicht menschlicher Wesen, entgleiste Experimente (Zombie) | ✅ `akte.js`: „Die Akte Abgrund“ – 10 Durchschläge von Dr. Edda Brand (1958–2012), kanonisch in `story_final.md` |

## Automatische Fehlersuche (Ergebnis)
- Code hinter Zeilenkommentaren (2 Stellen): Lars Vegas’ Unreal-Figur wurde nie in die Szene gesetzt; Zayns sechstes Foto war eine Kopie – beide behoben, restliche Module ohne Befund.
- Unbehandelte Browser-Ablehnung der Maussperre beim Aufwachen aus dem Traum – abgefangen.
- Fehlender Klang „flick“ (Menü) – ersetzt; alle übrigen 81 benutzten Klänge und alle Audio-Funktionen vorhanden (Laufzeitprüfung).
- Instanz-Auslese schaltete sich nach Zayns Fotos ab (doppelte/fehlende Bäume möglich) – behoben.
- Spielstand verlor den Fortschritt der neuen Nebenquests – behoben (siehe A5).

## E. Gesamtziel
Das Spiel soll ohne Fehler, Hänger und Ruckler durchspielbar sein. Die Geschichte soll stimmig sein: keine Widersprüche und keine falschen Details.
