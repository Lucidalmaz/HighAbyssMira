# CLAUDE.md – ENTWICKLUNGSREGELN DES HORROR-GAMES

> **NEUE SITZUNG? ZUERST `docs/gameplay/UEBERGABE.md` LESEN** (aktueller Stand, angefangene Arbeiten und ihre Branches, Fehlerliste, nächste Schritte). Antworten an den Nutzer immer auf Deutsch.

## 1. HAUPTZIEL DES PROJEKTS

Dieses Projekt ist ein hochwertiges psychologisches Horror-/Thriller-Spiel mit starker Story, Horror-Atmosphäre, glaubwürdigen Charakteren, physikalisch nachvollziehbaren Bewegungen und filmischer Inszenierung.

Das Hauptspiel soll zunächst 8 Kapitel umfassen.

Eine spätere Erweiterung auf ungefähr 13 Kapitel ist möglich.

### AKTUELLE HAUPTPRIORITÄT

Die höchste Priorität besteht aktuell darin, so schnell wie möglich eine stabile, spielbare Testversion zu erreichen.

Der Entwickler soll das Spiel endlich selbst spielen und testen können.

Nicht tagelang im Hintergrund weiterentwickeln, ohne einen spielbaren Zwischenstand bereitzustellen.

Die Reihenfolge lautet:

SPIELBAR → STABIL → POLIERT → ERWEITERT

Nicht:

PERFEKTE BACKEND-SYSTEME → PERFEKTE BACKEND-SYSTEME → PERFEKTE BACKEND-SYSTEME → IRGENDWANN SPIELBAR

---

## 2. PRIORITÄTEN

Arbeite grundsätzlich nach dieser Reihenfolge:

### P0 – SPIELBARKEIT

Zuerst alles, was notwendig ist, damit eine zusammenhängende Spielsequenz funktioniert:

- Spielerbewegung
- Kamera
- Interaktion
- Level-/Szenenfluss
- grundlegende Umgebung
- wichtige Trigger
- Story-Fortschritt
- Dialoge, soweit für die Testsequenz erforderlich
- grundlegende Horror-Events
- notwendige Animationen
- notwendige Audioelemente
- Speichern/Laden, wenn für die aktuelle Testversion erforderlich
- notwendige Gegner-/KI-Funktionen

### P1 – STABILITÄT

Danach:

- Abstürze
- Gamebreaking Bugs
- blockierter Spielfortschritt
- kaputte Interaktionen
- fehlerhafte Abhängigkeiten
- offensichtliche Animationsfehler
- kritische Performance-Probleme

### P2 – PRÄSENTATION

Danach:

- Beleuchtung
- Atmosphäre
- Sounddesign
- Animation
- Gesichtsausdrücke
- VFX
- Kameraführung
- Umgebungsdetails
- Cinematics

### P3 – POLISH

Erst danach:

- zusätzliche Animationen
- zusätzliche Varianten
- subtile Effekte
- zusätzliche Details
- Feintuning
- Optimierung
- nicht kritische Refactorings

---

## 3. SCHNELL ZU EINER SPIELBAREN TESTVERSION

Die erste Testversion muss NICHT das komplette Spiel enthalten.

Sie muss einen zusammenhängenden Abschnitt demonstrieren:

START
→ SPIELER
→ ERKUNDUNG
→ INTERAKTION
→ STORY
→ HORROR
→ FORTSCHRITT
→ KLARER TEST-ENDPUNKT

Das Ziel ist eine Vertical Slice.

Die Vertical Slice soll möglichst früh zeigen, ob:

- das Gameplay funktioniert
- die Atmosphäre funktioniert
- die Steuerung funktioniert
- die Story-Inszenierung funktioniert
- der Horror funktioniert
- die technische Basis funktioniert

Ein spielbarer Zwischenstand ist wertvoller als weitere Tage unsichtbarer Backend-Arbeit.

---

## 4. ARBEITSWEISE

Arbeite in klar abgegrenzten Arbeitspaketen.

Für jedes Arbeitspaket:

1. Nur relevante Dateien/Systeme untersuchen.
2. Bestehende Architektur verstehen.
3. Abhängigkeiten feststellen.
4. Kleinste sinnvolle Lösung bestimmen.
5. Implementieren.
6. Einen passenden fokussierten Test durchführen.
7. Arbeitspaket abschließen.
8. Einmalige Integrationsprüfung durchführen.
9. Nächstes priorisiertes Arbeitspaket beginnen.

Nicht nach jedem kleinen Schritt das gesamte Projekt erneut analysieren.

Nicht dieselben Dateien wiederholt lesen, wenn sie unverändert sind.

Nicht dieselben Tests wiederholt durchführen, wenn keine relevante Änderung stattgefunden hat.

---

## 5. TESTEN – GRÜNDLICH, ABER NICHT REDUNDANT

Qualität ist wichtig.

Redundante Prüfung ist jedoch keine zusätzliche Qualität.

Es gibt vier Prüfungsstufen:

### Stufe 1 – Direkter Kurztest

Nur das unmittelbar geänderte System prüfen.

Beispiele:

- Kompilieren
- Syntax prüfen
- gezielten Test ausführen
- betroffene Szene starten
- konkrete Funktion testen

### Stufe 2 – Feature-Test

Nach Abschluss eines zusammenhängenden Features:

- Feature vollständig testen
- direkte Abhängigkeiten testen
- offensichtliche Nebenwirkungen prüfen

### Stufe 3 – Meilenstein-Test

Nach einem wichtigen Meilenstein:

- breitere Regression
- Gameplay-Fluss
- relevante Systeme
- Performance

### Stufe 4 – Release-Test

Vor einer größeren spielbaren Version oder Veröffentlichung:

- umfassende Prüfung
- komplette relevante Spielabläufe
- Performance
- Stabilität
- bekannte Fehler

### WICHTIG

Stufe 3 oder 4 NICHT nach jedem kleinen Arbeitsschritt durchführen.

Wenn sich an einem System nichts Relevantes geändert hat, dieses System nicht erneut vollständig prüfen.

Ziel:

Einmal richtig prüfen statt dreimal dasselbe prüfen.

---

## 6. CLAUDE-CODE-NUTZUNG SPARSAM EINSETZEN

Das Nutzerkontingent ist begrenzt.

Jede Aufgabe muss deshalb möglichst effizient bearbeitet werden.

Ziel:

MAXIMALER FORTSCHRITT PRO NUTZUNGSEINHEIT

Vermeide:

- unnötige Repository-weite Scans
- wiederholtes Lesen derselben Dateien
- wiederholte Analyse derselben Architektur
- wiederholte Tests ohne relevante Änderung
- unnötig lange Statusberichte
- unnötige Refactorings
- theoretische Systeme ohne unmittelbaren Nutzen
- Untersuchung völlig unabhängiger Bereiche
- mehrfaches Überprüfen bereits bestätigter Ergebnisse

Wenn Informationen bereits bekannt sind und sich nicht verändert haben, verwende sie weiter.

Bevor große Mengen an Dateien gelesen werden:

Erst feststellen, ob diese Dateien für die aktuelle Aufgabe wirklich relevant sind.

---

## 7. NICHT ÜBERDENKEN

Einfache Aufgaben nicht unnötig kompliziert machen.

Wenn die Lösung eindeutig ist:

UMSETZEN.

Nicht fünf verschiedene Architekturen entwickeln, wenn eine robuste Lösung offensichtlich ist.

Bei komplexen Architekturentscheidungen gründlich denken.

Bei normalen Implementierungen schnell und zielgerichtet handeln.

---

## 8. KEIN UNNÖTIGES OVERENGINEERING

Vor dem Erstellen eines neuen Systems:

1. Nach vorhandenen Systemen suchen.
2. Vorhandenes System verwenden, wenn es geeignet ist.
3. Vorhandenes System erweitern, wenn möglich.
4. Erst dann ein neues System erstellen.

Keine doppelten Systeme ohne zwingenden Grund.

Keine unnötigen Abstraktionen.

Keine großen Refactorings während einer normalen Feature-Implementierung.

---

## 9. BESTEHENDE FUNKTIONALITÄT SCHÜTZEN

Vor Änderungen an bestehenden Systemen:

- relevante Implementierung untersuchen
- Abhängigkeiten verstehen
- bestehendes Verhalten erhalten
- möglichst kleine Änderung durchführen

Kein funktionierendes System komplett neu schreiben, nur weil eine andere Lösung schöner aussieht.

Keine bestehende Funktion entfernen, ohne sicherzustellen, dass sie wirklich nicht mehr benötigt wird.

Keine unnötigen Änderungen an nicht betroffenen Dateien.

---

## 10. MEHRERE AGENTEN

Mehrere Claude-Code-Agenten können gleichzeitig am Projekt arbeiten.

Deshalb müssen Aufgaben klar getrennt sein.

Agenten sollen:

- klar abgegrenzte Aufgaben bekommen
- möglichst unterschiedliche Dateien/Systeme bearbeiten
- keine Arbeit eines anderen Agenten unnötig wiederholen
- keine fertigen Systeme ohne Grund neu schreiben
- keine unabhängigen Bereiche verändern

Kein permanentes gegenseitiges Auditieren der Agenten.

Nach Abschluss der jeweiligen Arbeit:

Eine gezielte Integrationsprüfung.

Nicht ständig alles erneut überprüfen.

---

## 11. AUFGABENGRÖSSE

Bevorzuge zusammenhängende Aufgaben.

GUT:

„Implementiere das Interaktionssystem für Türen inklusive verriegelt, entriegelt und Interaktionsanzeige.“

SCHLECHT:

„Baue die komplette Gameplay-Architektur.“

Große Aufgaben in sinnvolle Arbeitspakete zerlegen.

---

## 12. DEFINITION VON FERTIG

Eine Aufgabe gilt als fertig, wenn:

- die gewünschte Funktion vorhanden ist
- sie mit der bestehenden Architektur funktioniert
- die relevante Prüfung erfolgreich war
- offensichtliche Fehler behoben sind
- keine unnötigen Änderungen eingeführt wurden
- kein bekannter Blocker offen ist

Nicht endlos weiterpolieren, wenn die Aufgabe abgeschlossen ist.

---

## 13. SPIELBARE CHECKPOINTS

Sobald ausreichend Gameplay vorhanden ist:

Spielbaren Checkpoint erzeugen.

Nicht auf folgende Dinge warten:

- perfekte Animationen
- finale VFX
- finale Kreaturenmodelle
- perfekte Beleuchtung
- vollständiges Sounddesign
- komplette Optimierung

Es sei denn, eines dieser Elemente ist für den konkreten Test zwingend erforderlich.

Der Entwickler muss früh spielen können.

Echtes Spieltesten ist wertvoller als theoretische Perfektion.

---

## 14. QUALITÄTSSTANDARD

Schnell bedeutet NICHT schlampig.

Ziel:

SCHNELL + PRÄZISE + STABIL + HOCHWERTIG

Nicht:

SCHNELL + PROVISORISCH + CHAOTISCH

Temporäre Platzhalter sind erlaubt, wenn sie:

- den spielbaren Fortschritt deutlich beschleunigen
- sauber isoliert sind
- später problemlos ersetzt werden können

Keine temporären Lösungen, die langfristig die Architektur beschädigen.

---

## 15. MENSCHLICHE / ORGANISCHE QUALITÄT

Das Spiel darf nicht wie generisch erzeugter KI-Content wirken.

Vermeide:

- repetitive Animationen
- identische Idle-Bewegungen
- generische Horror-Assets
- sinnlose Detailflut
- übermäßige Symmetrie
- offensichtliche Animations-Loops
- künstliche Gesichtsausdrücke
- austauschbare Kreaturen
- rein zufällige Details
- Kreaturen, die nur durch Textur/Farbe voneinander unterschieden werden

Jedes wichtige visuelle Detail muss einen Grund haben:

- physikalisch
- erzählerisch
- charakterbezogen
- atmosphärisch
- gestalterisch

Keine zufälligen „Unvollkommenheiten“ nur mit dem Ziel, etwas menschlicher aussehen zu lassen.

---

## 16. CHARAKTERANIMATION

Charaktere müssen lebendig und physikalisch glaubwürdig wirken.

Besonders wichtig:

- Gewicht
- Beschleunigung
- Trägheit
- Gleichgewicht
- Körpermechanik
- sekundäre Bewegungen
- natürliche Übergänge
- Atmung
- Augenbewegungen
- Blinzeln
- Gesichtsausdrücke
- Kopf-/Nackenbewegungen
- Körperhaltung

Keine starren Körper bei Ereignissen, die physische Reaktionen erfordern.

---

## 17. PHYSIKALISCHE EREIGNISSE

Bei Kräften und Bewegungen muss der gesamte Körper berücksichtigt werden.

Beispiel:

Wenn die Frau von einem UFO nach oben gezogen wird:

- Beschleunigung muss erkennbar sein
- Körper muss auf die Bewegung reagieren
- Arme und Beine dürfen nicht starr bleiben
- Oberkörper muss reagieren
- Körperhaltung muss sich verändern
- Trägheit muss berücksichtigt werden
- Haare/Kleidung sollen angemessen reagieren
- Gesicht soll auf das Ereignis reagieren
- Kamera und Körperbewegung müssen zusammenpassen

Der Charakter darf nicht wie ein starres Objekt wirken, das an einem Punkt nach oben gezogen wird.

---

## 18. GESICHTSAUSDRÜCKE

Wichtige Story-Momente brauchen sichtbare Emotionen.

Verwende sinnvoll:

- Facial Animation
- Blendshapes/Morph Targets
- Augenbewegung
- Blinzeln
- Augenbrauen
- Mund/Kiefer
- Kopfbewegung
- Atmung
- Körperhaltung

Emotionen nicht übertreiben.

Psychologischer Horror profitiert häufig von subtilen Gesichtsausdrücken.

---

## 19. KREATUREN

Wichtige Kreaturen benötigen eine eigene Identität.

Jede wichtige Kreatur soll sich unterscheiden durch:

- Silhouette
- Anatomie
- Fortbewegung
- Verhalten
- Geräusche
- Angriffe
- Reaktionen
- Interaktion mit der Umgebung
- individuelles Auftreten

Keine simplen Reskins.

---

## 20. WENDIGO – HÖCHSTE QUALITÄTSANFORDERUNG

Der Wendigo ist eine der wichtigsten Kreaturen des Spiels.

Er muss besonders sorgfältig gestaltet werden.

Er soll wie eine glaubwürdige, fleischbasierte biologische Horror-Kreatur wirken und nicht wie ein beliebiges Monster mit Fleischtexturen.

Besondere Aufmerksamkeit auf:

- Skelettstruktur
- Muskelaufbau
- Sehnen
- Gelenke
- Gewicht
- Schwerpunkt
- Fleischdeformation
- Verletzungen
- Asymmetrie
- Atmung
- Fortbewegung
- Angriff
- Erholung nach Angriffen
- Umgebungskontakt
- Geräusche
- Silhouette

Die Kreatur muss auch ohne Farbe und Textur eindeutig erkennbar sein.

---

## 21. WENDIGO-VARIANTEN

Die verschiedenen Wendigo-/Tierformen dürfen keine einfachen Reskins sein.

Sie müssen sich sinnvoll unterscheiden in:

- Silhouette
- Proportionen
- Anatomie
- Körperhaltung
- Fortbewegung
- Jagdverhalten
- Angriffsstil
- Geräuschen
- Spurensuche
- Reaktion auf Umgebung

Gleichzeitig muss eine gemeinsame biologische und visuelle Designsprache bestehen.

Ein geschulter Spieler soll anhand von:

Silhouette + Bewegung + Verhalten

erkennen können, welche Wendigo-Form er vor sich hat.

---

## 22. RABE UND ANDERE TIERE

Tiere dürfen nicht wie animierte Requisiten wirken.

Beim Raben besonders beachten:

- natürliche Idle-Bewegungen
- Kopfbewegungen
- Blickrichtung
- Reaktion auf Umgebung
- Beschleunigung
- Start
- Landung
- Flügelschlag
- Reaktionen
- artgerechte Bewegungsmuster
- kontrollierte Variation

Keine immer identischen Bewegungsloops.

---

## 23. HORROR

Psychologischer Horror darf nicht ausschließlich aus Jumpscares bestehen.

Nutze:

- Erwartung
- Stille
- Geräusche
- Beleuchtung
- Unsicherheit
- Umgebungsstorytelling
- subtile Anomalien
- veränderte Wahrnehmung
- verzögerte Konsequenzen
- Veränderungen bereits bekannter Orte
- begrenzte Informationen

Der Spieler soll gelegentlich nicht sicher sein, ob etwas tatsächlich passiert ist.

Horror-Ereignisse müssen Atmosphäre, Gameplay oder Story unterstützen.

---

## 24. STORY

Das Hauptspiel umfasst zunächst:

8 Kapitel

Eine spätere Erweiterung kann ungefähr:

Kapitel 9–13

umfassen.

Die Erweiterung darf erst nach einem stabilen Hauptspiel priorisiert werden.

---

## 25. DOKUMENTATION

Diese CLAUDE.md enthält dauerhafte Entwicklungsregeln.

Detailliertes Projektwissen soll in docs/ liegen:

docs/

- architecture/
- gameplay/
- story/
- chapters/
- characters/
- creatures/
- animation/
- horror/
- technical/

Dokumentation soll zukünftige Arbeit erleichtern und verhindern, dass Claude Informationen immer wieder neu aus dem gesamten Projekt rekonstruieren muss.

Keine Dokumentation nur um der Dokumentation willen.

---

## 26. AKTUELLE PROJEKTPHASE

Das Projekt befindet sich aktuell in einer Phase, in der eine spielbare Testversion dringend benötigt wird.

Wenn die Wahl besteht zwischen:

A) einem weiteren großen Backend-System, das der Entwickler nicht unmittelbar testen kann

und

B) der Fertigstellung und Stabilisierung eines bereits begonnenen spielbaren Abschnitts

ist grundsätzlich B zu bevorzugen, sofern dadurch keine gravierenden langfristigen Architekturprobleme entstehen.

---

## 27. WENN DU BLOCKIERT BIST

Wenn ein Problem auftritt:

1. Exakten Blocker feststellen.
2. Kleinste sinnvolle Lösung versuchen.
3. Relevanten Kurztest durchführen.
4. Wenn gelöst → weiterarbeiten.
5. Wenn weiterhin blockiert → Problem dokumentieren.
6. Wenn möglich, unabhängige nächste Aufgabe bearbeiten.

Nicht minutenlang dieselbe erfolglose Strategie wiederholen.

---

## 28. ABSCHLUSSREGEL

Das Projekt muss kontinuierlich in Richtung eines spielbaren und hochwertigen Spiels fortschreiten.

Bei jeder Aufgabe muss klar sein:

Welchen konkreten spielbaren Fortschritt gibt es nach Abschluss dieser Aufgabe?

Wenn das nicht klar ist, Priorität der Aufgabe erneut bewerten.

Arbeite:

- effizient
- präzise
- sparsam mit Nutzerkontingent
- ohne unnötige Wiederholungen
- ohne unnötige Refactorings
- ohne bestehende Systeme unnötig anzufassen

Aber niemals auf Kosten der tatsächlichen Qualität.

### OBERSTE PRIORITÄT

SPIELBARKEIT → STABILITÄT → QUALITÄT → POLISH → ERWEITERUNG
