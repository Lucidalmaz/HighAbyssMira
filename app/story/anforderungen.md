# High Abyss Mira – Gesamtauftrag (alle Anforderungen aus dem Chat)

Stand der Sammlung: 28.09.2026. Status: ✅ umgesetzt + zur Laufzeit geprüft · 🟡 umgesetzt, (noch) nicht zur Laufzeit geprüft · ⬜ offen · ⛔ hier technisch nicht möglich (Grund steht dabei)

## A. Qualitäts-Prompt (Technik, Spielgefühl, Robustheit, ehrliche Prüfung)
| # | Anforderung | Status |
|---|---|---|
| A1 | Projekt verstehen, Ausgangszustand sichern, Build prüfbar | ✅ `app/tools/assemble.js` (Syntaxprüfung je Modul) |
| A2 | Messbare Performance (Frame-Zeiten, Ruckler, Draw Calls) | ✅ F3-Messanzeige; Draw Calls Hauptstraße 447 320 → 1 051 |
| A3 | Ruckler/Steuerung/Abläufe; Mondschatten folgt dem Spieler | ✅ |
| A4 | Kollision: nirgends durch Wände/Decken sehen oder glitchen (Tisch + Doppelsprung) | ✅ Prüfskript, 0 Verstöße |
| A5 | Robuste Abläufe (Menü, Laden, Kapitelwechsel, Pause) | 🟡 wird im Gesamtdurchlauf erneut geprüft |
| A6 | Audio: natürlich, gruselig, nicht nervig; adaptive Musik + passende Aufnahmen | ✅ Musiksystem, Mischregeln |
| A7 | Story verständlich, tief, spannend, mit Twists; Vergleich mit Top-Genre-Spielen | 🟡 Story-Bibel; Stimmigkeitsprüfung aller Texte (Abschnitt F) |
| A8 | Abschlussbericht: überprüft / nicht überprüft / empfohlen | ⬜ am Ende |

## B. Ausrüstung, Übergänge, Rätsel
| # | Anforderung | Status |
|---|---|---|
| B1 | Bessere Taschenlampe nach Kap. 2, weitere Stufen später | ✅ 3 Stufen |
| B2 | Batterien, Drahtschneider, Brechstange, Sicherung u. a. für Rätsel (Kap. 1–3) | ✅ |
| B3 | Keine Teleport-Kapitelwechsel – alles selbst laufen | ✅ Kap. 1→2 und 2→3 gelaufen |
| B4 | Nichtlineare Geheimnisse, Rätsel, Quests mit rotem Faden | 🟡 |
| B5 | Mystery-Items: Totems, Wrackteile, Leuchtsteine | ✅ |
| B6 | Totems zeigen Visionen als Hinweissystem | 🟡 `visionen.js` |
| B7 | Leuchtsteine mit nützlicher, „krasser“ Funktion | 🟡 Kinderblick (Taste G) |
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
| D3 | Umbenennungen: Zayn, Roxy, Lucy, Luke, Heidi, Dina, Mike, Cleo; Lars Vegas; Hund Bruno; Lost Eyengless; Atlantschiss; Forbidden Dustwoods | 🟡 Rest-Suche nach alten Namen |
| D4 | Cleo: eigene emotionale Storyline | ⬜ |
| D5 | Zayn-Nebenquest exakt nach Vorgabe (Rucksack, Kamera + 6 Fotos, Spur, Häuschen, Radio, letzte Zeichnung, keine Antwort) | ⬜ |
| D6 | Forbidden Dustwoods: dicht, lebendig, gruselig, Tiere mit Interaktion, Aufgaben | ⬜ |
| D7 | Rabe Whiskey: begleitet, gibt Hinweise und Aufgaben, Justin klärt auf | 🟡 `whiskey.js` |
| D8 | Mansion in Lost Eyengless: sofort erreichbar, verschlossen; 8 Schlüsselteile in Kap. 1–3 an schwer zugänglichen Orten; Maschine nach Kap. 3; Betreten in Kap. 4; Unreal-Mansion + Grusel-Flair | ⬜ |

## F. Klang, Anfang, Startbildschirm (Nachtrag)
| # | Anforderung | Status |
|---|---|---|
| F1 | Sounds/Musik: nichts störend oder überladen, aber nie still; schaurige Musikstücke je Ort | 🟡 `klang.js`: 10 komponierte Stücke, gerendert beim Start, Ortswahl, kürzere Pausen |
| F2 | Passende Hintergrundgeräusche (Tiere usw.) | 🟡 Waldkauz, Fuchs, Reh, Krähen, Hunde, Dachrinnen, Totholz; keine Grillen im November |
| F3 | Weltgeräusche prüfen: Regen, Schritte je Untergrund, Türen, bewegte Gegenstände | 🟡 nasser Asphalt, Laub, Kies, Wasser, Holz, Beton; Tür auf/zu verschieden; Aufheben klingt |
| F4 | Anfangsstory: Traum, Rabe flüstert, gibt Auftrag + Abenteuerfibel; Aufwachen: „Huh…? Warum stehe ich …“ | 🟡 `traum.js` |
| F5 | Startbildschirm: Name eindrucksvoll/gruselig, Vermerk Lucidworkz, schaurige Musik, kein Birkenhain | 🟡 |

## E. Gesamtziel
Das Spiel soll ohne Fehler, Hänger und Ruckler durchspielbar sein. Die Geschichte soll stimmig sein: keine Widersprüche und keine falschen Details.
