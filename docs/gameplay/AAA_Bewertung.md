# High Abyss Mira · AAA-Bewertung Mystery und Grusel

Stand 02.10.2026 · Blick eines Lead Game Designers / Narrative Designers. **Es wurde nichts am Code geändert.**
Grundlage: `app/story/story_final.md` (Kern §0–§15, Kapitelübersichten, Rätsel, Schreckbudgets), `docs/gameplay/UEBERGABE.md`, `CLAUDE.md`,
`app/story/audit/F3_extras.md`, `F3_schlusstest.md`, `story_pruefung.md`, `F3_grusel_vergleich.md` sowie die Kopfkommentare und Ablaufstellen von
`kapitel1/3/5/6.js`, `amt.js`, `villa.js`, `hungrige.js`, `beobachter.js`, `kino.js`, `neben3–6.js`, `geheimnisse.js`, `entdecker.js`, `visionen.js`, `spannung.js`, `stimmen.js`, `tod.js`.
Methode: Ich habe den Code gelesen und durchsucht, das Spiel aber nicht gespielt. Aussagen zur Optik stützen sich auf den Schlusstest und auf die Rückmeldungen des Nutzers.
Was schon umgesetzt ist, habe ich per Suche im Code geprüft. „Nicht gefunden“ heißt: Die Suche nach der Kennung oder dem Mechanismus ergab keinen Treffer.

---

## 1 · Kurzurteil

1. Die Geschichte von High Abyss Mira, also Mystery-Aufbau und Weltbau, spielt in der obersten Liga des Genres. Sie hat eine eigene Mythologie (Martinsnacht 1312, Wechselbalg, Behördenhorror der LWO), acht faire Pflicht-Wendungen und sechs Höhepunkte, die mit Silent Hill 2 Remake und P.T. mithalten.
2. Im Spiel kommt davon heute nur ein Teil an. Die Präsentation bricht den AAA-Eindruck schon in den ersten Minuten: 16–37 FPS, rund vier Minuten Kaltstart, Grafikspeicher am Limit, 3 von rund 1 100 Zeilen vertont, Figurenanimation. Kein Genre braucht ein flüssiges Bild und echte Stimmen so sehr wie Horror.
3. Zwischen den Höhepunkten ist der Grusel zu sicher. In Kapitel 1, 3 und 4 kostet ein Fehler fast nichts. Der Kinderblick zeigt die Gefahr rot durch Wände an. Und die Hälfte aller Atempausen ist ein Witz.
4. Das Rätsel der Geschichte wird mehr erzählt und über fünfstufige Hilfeleitern gelöst, als dass der Spieler es selbst herleitet. Raum 3 („Wessen Hand ist aufgegangen?“) zeigt, wie es besser geht, bleibt aber ein Einzelfall. Gut ein Dutzend parallele Sammelreihen verwässern den Sog.
5. Der größte Gewinn liegt deshalb nicht in mehr Inhalt, sondern im Verdichten: die Technik stabilisieren, die Kernzeilen vertonen, aus Scheitern Rituale mit Folgen machen und dem Spieler eigene Schlüsse abverlangen.

---

## 2 · Vergleich mit Referenzen je Disziplin

Noten 1–10. Die 10 entspricht der jeweils besten Referenz. Wo Konzept und spielbarer Stand auseinanderliegen, stehen beide Werte da. Die Note bewertet den spielbaren Stand.

| Disziplin | Note | Referenzen |
|---|---|---|
| Mystery-Struktur | **8** | Alan Wake 2, Return of the Obra Dinn, Signalis, Oxenfree |
| Grusel | **6** (Konzept 8) | Silent Hill 2 Remake, P.T., Amnesia: The Bunker, RE7 |
| Spielspaß / Loop | **6** | RE2 Remake / Village (Herrenhaus-Schleife), Amnesia: The Bunker, Dredge, What Remains of Edith Finch |
| Figuren / Emotion | **8** (Text 9) | Silent Hill 2 Remake, Firewatch, Oxenfree, Edith Finch |
| Weltbau / Umgebungserzählen | **8** (Konzept 9) | RE7 (Baker-Haus), Alan Wake 2 (Bright Falls), Edith Finch, Kona |
| Pacing über die Kapitel | **7** | RE4 Remake, Alan Wake 2, Until Dawn |
| Onboarding | **5** | RE7, P.T., Firewatch |
| Audio-Horror | **7** (Konzept 9) | Amnesia, Alien: Isolation, Silent Hill 2 Remake, Signalis |
| Präsentation (Bild, Animation, Kino, UI, Technik) | **4** | RE Village, Alan Wake 2, Until Dawn (2024) |

### 2.1 Mystery-Struktur · 8
**Stark:**
- **Frage-Antwort-Takt.** Jedes Kapitel hat ein festes „Danach weiß der Spieler / Neue Fragen“ und eine Endkarte mit Haken („Einer fehlt noch. Du.“). Das ist Alan-Wake-2-Takt.
- **Gepflanzt und eingelöst.** Narbe → Justins gleiche Narbe → Miras Ring passt (Kap. 1/3/4). Spieluhr → Miras Wiegenlied. „(hw)“ → Heinrich Wolter. Der Name im Nebel war „Luna“.
- **Faire Herleitung.** Die Lösung steht nie in der Notiz zum Rätsel (Schreibregel §13).
- **Raum 3 („Wessen Hand ist aufgegangen?“, Kap. 3 UK 13).** Der Spieler widerlegt mit drei Bildbeweisen eine Lüge, die er seit Kapitel 1 hört. Auf eine falsche Antwort sagt Justin „zu schnell: ‚Ja. So war es.‘“, und das schlechte Gefühl ist die einzige Strafe. Das ist Obra-Dinn-Qualität und der beste Deduktionsmoment des Spiels.

**Schwach:**
- **Zu großzügige Hinweise.** Fast jedes Rätsel hat vier bis fünf Hilfestufen (Gedanke, Whiskey, Beobachter-Zettel B-K3-H1…H3, Justin, Kamera-Zug). Der Beobachter legt Lösungshilfen „hinter Lukes Füße“. Der Spieler lernt: Warten löst das Rätsel.
- **Deduktion heißt meist eine Zahl finden.** Bis Kapitel 4 gibt es sieben Zahlen- und Folgen-Lösungen: 3110, 31,10, 5→3→1→7, 03:13, 1958·1975·1992·2009, Hebel 2-3-4-5, Schublade „1958“. Echte Schlüsse über Menschen gibt es nur bei HASENBROT (Kanal B) und in Raum 3.
- **Zu viel wird erklärt.** Justin erklärt in acht Happen, die Fibel schreibt „SPIELREGELN“ mit, Luke kommentiert dazu. Der Spieler muss selten selbst eine Theorie bilden. Alan Wake 2 lässt Hinweise auf der Fallwand verknüpfen, Obra Dinn bestätigt erst drei richtige Schlüsse auf einmal.
- **Zu viel Stoff.** Die Story-Prüfung zählt rund zwanzig Enthüllungen und Kennungen in jedem Text. Für Nebenaufgaben ist das reich, für den Hauptsog riskant.

### 2.2 Grusel · 6 (Konzept 8)
**Stark:**
- **Regelhorror.** Lunas Spielregeln laufen immer gleich ab: zeigen → erleben → benutzen → erklären. Signalis und P.T. arbeiten genauso.
- **„Luna schreit nie“, sie zählt, summt und kichert.** Der Grundsatz „Kindergeräusche an Orten ohne Kinder“ wird durchgehalten.
- **Beobachter.** Die Ein-Sekunden-Regel plus „man hört ihn ständig“ ist ein eigenes, starkes Verfolgungsgefühl.
- **`spannung.js` ist auf Profi-Niveau.** Es gibt Phasen, ein Stressmodell, eine Stinger-Diät (kein `scream` bei Luna), Pflicht-Nachklang und gesperrte traurige Szenen.
- **Die besten Kapitel.** Kapitel 2 baut Präsenz ohne Kontakt (der Nadeldrucker meldet K-1, A-05). Kapitel 5 hat die P.T.-Flurschleife. Kapitel 6 hat eine echte Jagd mit Tod (A-20 in `kapitel6.js`).
- **Schreckbudget je Kapitel.** Stufen 1–3, nie zwei Dreier am Stück. Das ist eine sauber dosierte Jump-Scare-Kurve.

**Schwach:**
- **Scheitern kostet fast nichts.**
  - Kap. 1, Verstecken vor dem Licht: „Kein Tod. Sie spielt.“
  - Kap. 3, Ochs am Berg: Wer erwischt wird, hört nur „Du bist.“, eine Laterne geht wieder an (`kapitel3_erwischt`). Den beschlossenen Vorschlag A-07 („Du bist“ heißt zählen) habe ich im Code nicht gefunden.
  - Die Behaltenen setzen Luke nur zurück (`kapitel3_behErwischt`).
  - Kap. 4: „keiner jagt Luke“. A-14 (Blechmann auf Streife) und A-15 (Funkmeldungen) habe ich nicht gefunden.
  RE7 und Amnesia: The Bunker leben vom Preis des Fehlers.
- **Der Kinderblick verrät die Gefahr.** Taste G, `visionen.js` Z. 42/50: In der Jagd steht das Graukind als **rote Säule durch Wände**, dazu der Untertitel „Rot. Da. Sie steht hinter der Wand.“ Damit ist die Ungewissheit weg, der Kern jedes Grusels.
- **Witz als Entwarnung.** Die Atempausen-Regie (`spannung.js`, A-28) wählt zu 50 % einen Lacher, dazu kommen die Whiskey-Gags nach Höhepunkten. Der Spieler lernt: Witz heißt sicher. In Silent Hill 2 Remake sind Pausen melancholisch, nicht komisch.
- **Ein Muster zu oft.** „Bewegt sich, wenn du wegsiehst“ ist auf 4 Einsätze begrenzt, kommt aber zusätzlich in den Zähl-Totems (`geheimnisse.js`) und am Friedhof vor.
- **Technik frisst Grusel.** Ein Schreck bei 16 FPS oder mit steifer Kinderfigur wirkt unfreiwillig komisch.

### 2.3 Spielspaß / Loop · 6
- **Was der Spieler pro Minute tut:** gehen, leuchten, lesen (Notizen höchstens fünf Zeilen, gut), etwas benutzen, einsammeln. Jedes Kapitel bringt ein bis zwei neue Verben: Funk, Laternen, Freimal, Blinzeln, Polaroid-Kamera (Kap. 5), Augen zu, Stille-Zonen, Feuerzeug. Die Abwechslung von Kapitel zu Kapitel ist stark, wie bei Edith Finch.
- **Zu viel Sammeln.** Stundenbuch, Laternenbote, Polaroids, Schlüsselteile, Lichtsteine, Wrackteile, Zähl-Totems, 17 Kerben, Verstecke der Sieben, Glanz/Tausch, Pell-Seiten, Nachbilder, Beobachter-Zettel, Entdecker-Stufen. Dazu 41 Nebenaufgaben allein in Kapitel 1 und 3, alle in einer Nacht. Das ist eine Ubisoft-Checkliste, keine Horror-Verdichtung. RE2R hat eine Schleife: Schlüssel → Raum → Abkürzung.
- **Rätsel:** solide und fair. Aber viele Code-Eingaben und ein Lights-Out (Kap. 2), ein Genre-Klischee. Die besten Rätsel sind die, die eine Regel benutzen: HASENBROT, die Laternen unter Ochs am Berg, „Annis Schleife“ (die Naht abwarten, `neben6.js`).
- **Belohnung:** Der Tausch mit Whiskey ist eine gute, eigene Idee (Dredge-Prinzip), die Entdecker-Stufen geben spürbare Boni. Beides konkurriert aber mit fünf anderen Belohnungsreihen.

### 2.4 Figuren / Emotion · 8 (Text 9)
- **Szenen auf A+++-Niveau:** Justins Schuld (die Hand ging auf), Peter („Bruder.“, er nickt im Öl), Hilde („Zähl für mich weiter“), der echte Luke („War es schön? Mein Leben?“), Lucy, die sich den Wechselbalg ausgesucht hat. Dazu die Regel, dass Luke nach Enthüllungen nur einen Satz sagt (Silent-Hill-2-Zurückhaltung).
- **Humor-Figuren mit eigener Handschrift:** Vegas, Pat und Patachon, Whiskey, Justin in der Neuzeit.
- **Abzug, stumm:** Firewatch und Oxenfree stehen und fallen mit Stimmen. Hier sind 3 von rund 1 100 Zeilen vertont.
- **Abzug, Luke:** Nach Kapitel 3 reagiert er nur noch (Story-Prüfung).
- **Abzug, Mira:** Die Titelfigur tritt im gebauten Spiel (Kap. 1–6) nie auf.

### 2.5 Weltbau / Umgebungserzählen · 8 (Konzept 9)
- **Stark:**
  - Nr. 9 als Beobachtungsposten („Objekt weint. Schichtwechsel.“).
  - Der *Laternenbote* seit 1890, jeder Ortsname mit Herkunft, LWO-Zeichen bis aufs Kaugummipapier.
  - Die Zeichnungswand „LUKE, 9“, der Kalender, der durchgestrichen ist, bis das Papier reißt.
  
  Das ist RE7-/Edith-Finch-Niveau.
- **Abzug, Umsetzung:**
  - leere Stellen (R-11)
  - selbst gezeichnete Canvas-Decals (Kreidestriche, die als Balken schweben, UFO-Bilder im Keller, blutige Hände)
  - schwarze „Schlieren“ über den Vorgärten
  - die sehr dunkle Villa
  - die Fülle, die einzelne Funde entwertet

### 2.6 Pacing über die Kapitel · 7
- **Der Moduswechsel ist vorbildlich:** offenes Dorf → enger Bunker → Regeljagd und Nimmerheim → Villa bei Tag → häusliche Schleife → Wald. So arbeiten RE4R und Alan Wake 2.
- **Kapitel 4 ist eine Spannungsdelle** genau in der Mitte. Es gibt kein Monster, und Entdecktwerden ist höflich (Vertrauen −8).
- **Gipfel zu früh?** Der emotionale Höhepunkt (Raum 3, Justin) liegt in Kapitel 3. Kapitel 3 und 6 dauern auf dem Hauptweg je etwa zwei Stunden.
- **Das Finale ist passiv.** „Zwei Raben“ läuft mit geführter Kamera, der Spieler schaut zu.
- **Das Ende hängt offen.** Das gebaute Spiel endet nach Kapitel 6 mit „Fortsetzung“. `CLAUDE.md` plant acht Kapitel. Bis dahin ist Kapitel 6 das Finale und muss sich wie eines spielen.
- **Gut:** „BISHER“-Rückblick auf den Kapitelkarten (Until-Dawn-Prinzip).

### 2.7 Onboarding · 5
- **Gut:**
  - Der Prolog ist steuerbar (A-01).
  - Der Aufhänger ist stark (elf Anrufe, Lucy).
  - Das Ziele-System (`ziele.js`) mit „NEUES ZIEL + warum“ und „WAS JETZT?“ erklärt jede Aufgabe.
- **Schwach:**
  - Rund vier Minuten Kaltstart vor dem ersten Bild.
  - Viele Tasten: Lampe, Q, G, C, Z, Strg, Leertaste, Fibel, Beutel, Karte.
  - 21 Nebenaufgaben ab der ersten Minute.
  - Viele Einblendungen.
  - Vor allem: An der Haustür von Nr. 7, der wichtigsten Tür in Kapitel 1, bleibt man beim Rennen auf der ersten Stufe hängen (`UEBERGABE.md` §9.1).
  
  RE7 und P.T. führen in den ersten 15 Minuten genau eine Mechanik ein und lassen sie dem Spieler selbst passieren.

### 2.8 Audio-Horror · 7 (Konzept 9)
- **Stark:**
  - Lucys Spieluhr (E D C H C) ist Leitmotiv **und** hörbarer Hinweis: Sie läuft unter jeder geliehenen Stimme (Regel 5). Ton als Beweismittel ist eine Signalis-würdige Idee.
  - Stille-Zonen: „Der Wald hat kein Echo“.
  - Räumlicher Ton mit Raumhall (R-19).
  - Ein Tontechniker als Hauptfigur.
- **Schwach:**
  - Ohne Stimmen verliert „Stille Post“ die halbe Wirkung. Die Spieluhr unter Lunas Stimmen spielt `stimmen.js` nur, wenn eine Aufnahme existiert. Fest verdrahtet ist sie nur in `amt.js`, `lucy3.js` und `kapitel3.js`.
  - Schritte im Amt-Gang verstummen zwischen 25 m und 5 m (Schlusstest). Das ist ausgerechnet im Verfolger-Kapitel ein schwerer Fehler.

### 2.9 Präsentation · 4
- **Technik:**
  - Bildrate: Ortstafel 24,5 · Kreuzung 15,7 · Nr. 7 innen beim ersten Betreten 8,1 FPS.
  - Grafikspeicher in Kap. 5/6: 7,6–7,8 von 8 GB, zweimal WebGL-Kontextverlust.
  - JS-Speicher ≈ 6,3 GB.
  - Kaltstart 220–246 s.
- **Bild:**
  - Peter in Nahaufnahme pixelig (Kap. 2).
  - Prolog-Graugesicht überstrahlt, und das ist **der erste Höhepunkt des Spiels**.
  - Hildes Kopf fehlt in einem Bild von k1h.
  - Der Joint schwebt.
  - Villa und Halle sehr dunkel.
- **Rückmeldung des Nutzers:** Animationen und Skins seien „absoluter Müll“ (R-3).
- **Nicht gebaut:** Titelbildschirm R-27 und Symbol R-28.
- **Gut angelegt:** Das Kino-System (`kino.js`: Brennweite, Schärfentiefe, Schnitte, Untertitel) hat die richtigen Werkzeuge. Es fehlt Qualität in Figuren und Licht, nicht in der Regie.

---

## 3 · Die 10 größten Hebel (nach Wirkung gegen Aufwand)

Aufwand: **S** ≤ ½ Tag · **M** 1–2 Tage · **L** ≥ 3 Tage.
Alle Hebel halten die Projektregeln ein: keine Lichter zur Laufzeit, nur vorhandene oder kostenlose Fab/Megascans-Assets, keine selbst gebauten Primitiv-Modelle. Die Reihenfolge folgt der Nutzerregel „spielbar → stabil → poliert“.

### H1 · Stabilität und Bildrate vor allem anderen (L)
- **Problem:** Kontextverlust in Kap. 5/6, 8 FPS beim ersten Betreten von Nr. 7, 16–37 FPS draußen, vier Minuten Kaltstart. Ruckeln und Abstürze zerstören Spannung zuverlässiger als jeder Inhaltsfehler.
- **Vorschlag:**
  1. **Erst Grafikspeicher, dann FPS.** Beim Kapitelwechsel Geometrien und Texturen des vorigen Großortes freigeben (Amt nach Kap. 2, Villa nach Kap. 4). Figuren-Texturen 1K im Spiel, 2K nur in der Nahaufnahme im Kino.
  2. **Shader vorwärmen.** Während Kapitelkarte und Überblendung `renderer.compileAsync` für den nächsten Innenraum laufen lassen (Nr. 7, Amt, Villa). Das beseitigt die Einbrüche beim ersten Betreten. Für Horror zählt die gleichmäßige Bildzeit mehr als die Durchschnitts-FPS.
  3. **Die schon erkannten Hebel aus `UEBERGABE.md` §4.1 umsetzen:** Gesichtsteile der CC-Figuren zusammenfassen, Körper-LOD, Takte außerhalb des Blicks drosseln.
- **Ziel:** 45+ FPS, 1 %-Tief ≥ 30, Grafikspeicher ≤ 5,5 GB, Kaltstart ≤ 90 s.
- **Module:** `leistung.js`, `figuren.js`, `kapitel.js` (Wechsel), `uebergang.js`.
- **Effekt:** Voraussetzung für jeden anderen Hebel.

### H2 · Selektive Sprachausgabe statt Vollvertonung (M, nach der Nutzerentscheidung zu Smart App Control)
- **Problem:** 3 von rund 1 100 Zeilen sind vertont. Die Klon-Treue liegt unter der Schwelle (Luke 0,48 bei Schwelle 0,70).
- **Vorschlag, in drei Stufen:**
  - **Stufe A, rund 150 Kernzeilen, die Emotion oder einen Hinweis tragen:** Lucys Band und die Stimme hinter der Kellertür (Kap. 1), „… danke, Luke …“, Hildes „Nicht du“ und „Zähl für mich weiter“, Justins Raum-3-Zeilen, alle geliehenen Stimmen Lunas (mit Spieluhr), der echte Luke (Telefon, Stall, Hochsitz), Wendigo-Stimmen, Wolter in AG-14.
  - **Stufe B, für alle übrigen Zeilen nonverbale Laute:** Atmen, Seufzen, Lachen, „hm“, Kinderkichern aus den vorhandenen, lizenzfreien Sonniss-Bündeln. So arbeiten Signalis und Dredge, und stumme Zeilen wirken trotzdem bewohnt.
  - **Stufe C, die Schwelle je Klangweg prüfen:** Funk, Telefon und Flüstern (Bandpass, Sättigung) verdecken Klon-Artefakte. Dort darf ein Hörtest des Nutzers über die Freigabe entscheiden.
- **Module:** `stimmen.js`, `game/assets/stimmen/manifest.json`, `klang.js`.
- **Effekt:** sehr hoch. Stille Post und die Spieluhr-Hinweise funktionieren erst mit Stimme richtig.

### H3 · Scheitern als Ritual mit Folgen (S/M)
- **Problem:** Wer erwischt wird, verliert kaum etwas (Kap. 1, Kap. 3, Behaltene). Spätestens in Kapitel 3 weiß der Spieler: „Mir passiert nichts.“
- **Vorschlag:**
  - A-07 bauen und verschärfen (Ausarbeitung in Abschnitt 4, G2).
  - Kap. 1, beim dritten Fang im Lichtkegel: Luke wird an einer schlechteren Stelle fallen gelassen (weiter weg vom Keller), und die Lampe verliert Ladung.
  - Behaltene, ab dem zweiten Fang: Luke startet weiter weg von Justin, und Anni wartet nicht mehr an der Tür (`kapitel3_behErwischt`).
  - Kanon: kein Tod, Luna spielt. Aber Kontrolle, Zeit und Licht kosten etwas.
- **Module:** `kapitel3.js`, `augenzu.js`, `kapitel1.js`.
- **Effekt:** hoch. Jede spätere Jagd wird ernst genommen.

### H4 · Kinderblick und Hinweise knapper und mit Preis (S)
- **Problem:**
  - Der Kinderblick zeigt die Gefahr rot durch Wände.
  - Die „Deutung“ setzt eine Säule zum nächsten Ziel.
  - Der Beobachter legt Lösungshilfen hin.
  - Fünf Hilfestufen pro Rätsel.
- **Vorschlag:**
  1. Die Säulenart `gefahr` streichen (`visionen.js` Z. 42/50).
  2. Der Kinderblick bekommt einen Preis aus dem Kanon, Regel 10 „Wer es weiß, durch den sieht sie“. Ab Kapitel 3 löst jede Nutzung ein Präsenz-Ereignis aus: ein Kichern hinter Luke, eine Laterne zuckt, das Graukind steht beim nächsten Hinsehen einen Schritt näher. Aus dem Hilfsmittel wird eine Abwägung.
  3. Neue Einstellung „Rätselhilfe: viel / wenig / aus“, Standard „wenig“. Ab Stufe 3 kommen Hilfen erst nach Zeit **und** auf Nachfrage in der Fibel („WAS JETZT?“).
  4. Beobachter-Hilfezettel erst, wenn Luke länger als 3 Minuten feststeckt.
- **Module:** `visionen.js`, `beobachter.js`, `ziele.js`, `menue.js`.
- **Effekt:** hoch, die Ungewissheit kommt zurück.

### H5 · Die ersten 30 Minuten als Visitenkarte (M)
- **Problem:** Tester und Rezensenten urteilen nach 20 Minuten. Genau dort liegen Fehler:
  - Treppe Nr. 7
  - das überstrahlte Prolog-Graugesicht
  - schwebende Kreidebalken
  - Canvas-UFO-Bilder im Keller
  - der fehlende Titelbildschirm R-27
- **Vorschlag:** Prolog bis Kellertür (Kap. 1, Schreckbudget Nr. 1–11) als fertig polierten Abschnitt behandeln:
  - Stufen-Kollision von Nr. 7 reparieren.
  - Belichtung und Tonemapping des Graugesichts im Prolog nachstellen.
  - Kreide, Graffiti, Blut und Handabdrücke aus Megascans-Decals (frei) statt Canvas.
  - Titelszene R-27 (Ortstafel, Regen, Whiskey).
  - Nr. 7 innen mit vorgewärmten Shadern (H1).
- **Module:** `kapitel1.js`, `traum.js`, `zeichen.js`, `menue.js`, `grafik.js`.
- **Effekt:** sehr hoch für den Gesamteindruck.

### H6 · Atempausen neu mischen, Witz nicht mehr als Entwarnung (S)
- **Problem:** 50 % Lacher nach Stufe 2/3. Dazu Vogel-Gags nach vier von sechs Höhepunkten.
- **Vorschlag:**
  - Verteilung in `spannung.js` (A-28) je Kapitel:
    - Kap. 1–3: Lacher 35 % · Stille 40 % · Ruhe mit Riss 25 %
    - Kap. 4: wie bisher
    - Kap. 5–6: Lacher 15 % · Stille 50 % · Ruhe mit Riss 35 %; nach einem Dreier dort nie ein Lacher
  - „Falsche Sicherheit“ (5.4) einmal je Kapitel prüfen und auslösen.
  - Humor gehört in die Ruhephasen (Vegas’ Stube, Tausch, Justin und die Neuzeit), nicht in die Auflösung eines Schrecks.
- **Modul:** `spannung.js`.
- **Effekt:** mittel bis hoch. Der Spieler entspannt nie ganz.

### H7 · Kapitel 4: die Villa wird feindlich (M/L)
- **Problem:** In der Villa „jagt keiner Luke“. Das ist die Spannungsdelle in der Mitte des Spiels.
- **Vorschlag:** A-14 und A-15 bauen, ausgearbeitet in Abschnitt 4, G3 („Schichtwechsel“).
- **Module:** `villa.js`, `lwo.js` (Sichtkegel vorhanden), `tod.js` (Todesart `blech` vorhanden).
- **Effekt:** hoch, ein RE2R-Moment.

### H8 · Ein Finale, das der Spieler selbst entscheidet: „Zwei Raben“ (M)
- **Problem:** Das Ende des gebauten Spiels ist Zuschauen.
- **Vorschlag:** In der Kinosequenz eine Deduktion unter Druck (ausgearbeitet in Abschnitt 4, M3).
- **Module:** `hungrige.js` (Finale), `kapitel6.js`, `whiskey.js`, `kino.js`.
- **Effekt:** hoch. Grusel und Rätsel gipfeln im selben Moment, und die Hinweise aus sechs Kapiteln zahlen sich aus.

### H9 · Systeme verdichten, ohne Inhalte zu löschen (M)
- **Problem:** Gut ein Dutzend Sammelreihen und 41 Nebenaufgaben in einer Nacht fressen Grusel und Fokus.
- **Vorschlag:**
  - Lichtsteine, Zähl-Totems, 17 Kerben und Wrackteile zu **einer** Reihe zusammenführen: „Lunas Spielsachen“, sieben Stück, Fibel-Seite.
  - Die Entdecker-Stufen in den Tausch mit Whiskey überführen. Dann gibt es eine Belohnungswährung statt zwei.
  - In Spannungsphase ≥ 2 keine Nebenaufgabe starten und keine Einblendung zeigen.
  - In Kapitel 1 erst den Aufhänger: Nebenaufgaben sind sichtbar, starten aber erst nach „Nicht du“ (Hilde).
- **Module:** `geheimnisse.js`, `entdecker.js`, `visionen.js`, `tausch.js`, `ziele.js`, `kapitel1.js`, `neben3.js`.
- **Effekt:** mittel bis hoch. Funde bekommen wieder Gewicht.

### H10 · Die Tontechniker-Mechanik „Mitschnitt“ (M/L)
- **Problem:** Lukes Beruf ist der stärkste Mechanik-Haken des Spiels und wird nur in Sprüchen benutzt. Kapitel 5 hat die Kamera (Fatal-Frame-Prinzip), aber dem Ton fehlt ein Werkzeug.
- **Vorschlag:** Ein Diktiergerät aus Lukes Gürteltasche (in `beutel.js` schon erwähnt). Ausarbeitung in Abschnitt 4, M2.
- **Module:** neu `mitschnitt.js` (nach `stimmen` in ORDER), `sammeln.js` (Fibel-Reiter), `klang.js`.
- **Effekt:** sehr hoch für die Eigenständigkeit. Das ist das Merkmal, das man auf die Verpackung schreibt.

---

## 4 · Konkrete Szenenvorschläge

### 4.1 Fünf Gruselmomente (neu oder umgebaut)

**G1 · Kap. 1 · „Die Laternen gucken“ (neu, S). Bedrohung in der offenen Welt, ohne die Hauptgeschichte zu verraten**
- **Kanon:** Regel 2 (die Straßenlaternen sind ihre Augen) soll in Kapitel 1 „gezeigt, nicht erklärt“ werden. A-02 lässt die Laternen vor Nr. 7 schon E D C H C brummen.
- **Ablauf:** Bleibt Luke beim Erkunden länger als 6 s im Lichtkreis einer Laterne stehen, wird ihr Brummen eine Spur lauter und das Licht minimal wärmer. Die nächste Laterne in Blickrichtung flackert einmal, als würde sie blinzeln. Beim dritten Mal holt jemand über Luke hörbar und sehr leise Luft, dasselbe Luftholen wie später beim Ausblasen (UK 7).
- **Grenzen:** Stufe 1, höchstens dreimal vor der Freilassung, nie in Szenen. Wer das Luftholen in Kapitel 1 gehört hat, erschrickt beim Stromausfall doppelt.
- **Technik:** nur Intensität und Modus vorhandener Laternen (`lamps`, Modus `pulse`), vorhandener Atemklang, Freigabe über `spannung_ask('minor')`.

**G2 · Kap. 3 · „Du bist. Zähl!“ (Umbau von Ochs am Berg und Behaltenen, S/M)**
- **Kanon:** Regel 1 („Wer gefunden wird, muss zählen“), Regel 4 (Augen zu), Luna kennt die Achtzehn nicht („siebzehn und noch eins“).
- **Ablauf:**
  1. Fängt das Graukind Luke, wird das Bild schwarz, Augen zu ist erzwungen.
  2. Eine Kinderstimme zählt **mit** Luke bis siebzehn, jede Zahl als Kreidestrich am Bildrand. Der Spieler muss Q halten.
  3. Um ihn herum laufen nackte Füße im Kreis, eine Laterne wird „rückwärts angepustet“.
  4. Bei „siebzehn und noch eins“ kichert es direkt am Ohr.
  5. **Lässt der Spieler Q zu früh los,** sieht er für 4 Frames das mundlose Gesicht 20 cm vor sich, und eine zweite Laterne geht wieder an.
  6. Beim dritten Fang kippt Lucys Funkstimme mitten im Satz in ein Rauschen und meldet sich 30 s lang nicht.
- **Warum:** Kontrollverlust als Strafe (P.T., Signalis), die Regel wird erlebt statt notiert, und Kapitel 3 bekommt Zähne.
- **Technik:** `augenzu.js` (Schwärze, Q), `kapitel3_erwischt`/`kapitel3_behErwischt`, vorhandene `grey`-Figur, Kreide als HUD-Strich.

**G3 · Kap. 4 · „Schichtwechsel“ (A-14/A-15 mit Kanon-Drohung, M/L)**
- **Kanon:** Die LWO wendet keine Gewalt an, aber „Abholung Freitag früh (hw)“. Die Todesart `blech` in `tod.js` sagt schon: „Sie haben dich nicht angefasst. Sie haben nur gewartet, bis jemand kam, der es durfte.“
- **Ablauf:**
  1. Nach AG-13 bleibt **Nachsorge 11** (das lange Modell, vorhanden) im Haus und geht eine feste Runde mit Uhr-Takt: Halle → Galerie → Archiv → Anrichte. Er macht Schränke auf, schraubt die Thermoskanne auf und gibt Funkmeldungen durch („Nachsorge an Bergung. Villa. Obergeschoss. Keine Sicht.“). Draußen fährt der Kombi zweimal im Schritttempo am Haus vorbei.
  2. **Wird Luke gesehen:** Kein Zugriff. Nachsorge 11 stellt sich in die Tür, sagt „Bleiben Sie bitte, wo Sie sind“ und funkt nach Wolter. Ab da läuft eine hörbare Uhr: Wolters Wagen auf dem Kies, eine Autotür, Schritte auf der Treppe, rund 25 s.
  3. Luke entkommt nur über die Dienstbotentreppe (Anrichte) oder durch das Lichtschacht-Fenster (Teil 04). Sonst kommt der Todesbildschirm `blech` mit Sprung zum letzten Speicherpunkt vor dem Archiv.
  4. Whiskey wird bei jeder Vorbeifahrt am Fenster still (Grusel-Signal aus dem Kanon).
- **Technik:** Sichtkegel aus AG-13 (`lwo.js` Z. 456), acht Wegpunkte, keine neuen Lichter (die Blechmann-Lampe ist schon geladen).

**G4 · Kap. 5 · „Entwicklungszeit“ (Kamera-Umbau plus neuer Moment, M)**
- **System:** Jedes Polaroid entwickelt sich in Lukes Hand **in Echtzeit, 6–8 s** von Weiß zum Bild. Solange es sich entwickelt, ist die Kamera unten und Luke sieht auf das Foto. Er ist verwundbar, die Entwicklungszeit wird zum Spannungsfenster (Fatal Frame, P.T.).
- **Neuer Moment, Kinderzimmer in Nr. 1 (Nachtlicht vorhanden), vor der Flurschleife:**
  1. Luke fotografiert sein Kinderbett. Das Bild entwickelt sich langsam: das Bett, das Nachtlicht und unter dem Bettkasten **zwei blaue Augen**, die in den Blitz sehen.
  2. Luke dreht sich zum Bett: Da ist nichts. Unter dem Bett liegt ein Brotkanten in Butterbrotpapier.
  3. LUKE: nichts. Erst im Flur: „Blau.“
- **Kanon:** Der echte Luke hat blaue Augen (Luke braune), Hilde hat ihm Brot hingestellt, er warnt sonst nur stumm. Das ist ein fairer, gruseliger Hinweis auf Wendung 8 im selben Kapitel, ohne Worte. Es bleibt innerhalb der Grenze von zwei warnenden Kindern mit Worten, weil er hier nicht spricht.
- **Technik:** vorhandene Kamera-Logik in `kapitel5.js` (Renderziel als Foto), Überblendung des Fotos per Shader-Uniform, Figur des echten Luke (vorhanden).

**G5 · Kap. 6 · „Er hat dein Hallo behalten“ (neu, S, mit H2)**
- **Kanon:** Der Wendigo frisst Nachbilder und spricht mit gefressenen Stimmen (Hofer, Pell, Anni, Lucy). In Stille-Zonen ruft Luke, „nichts kommt zurück“. Der Gedanke A-23 lautet: „Ich hab ‚Hallo‘ gesagt, und der Wald hat es behalten.“
- **Ablauf:**
  1. In der ersten Stille-Zone ruft Luke „Hallo?“ (Taste oder Pflichtzeile). Nichts kommt zurück.
  2. **40 s später,** außerhalb der Zone, kommt das „Hallo?“ zurück. Lukes Stimme, trocken, ohne Raum, aus der falschen Richtung, ohne Atem davor.
  3. In der Jagd (A-20) benutzt das Hirschding einmal einen Satz, den Luke in diesem Spiel selbst gesagt hat, etwa seinen Fluch vom Kuh-Absturz, aber ohne Fluch-Pointe und ohne Spieluhr.
- **Warum:** Das Monster stiehlt **den Spieler selbst**. Das ist persönlicher als jede fremde Stimme, wie die gestohlenen Stimmen in Alan Wake 2 und Oxenfree.
- **Technik:** `stimmen_spielen(key, pos)` mit Art „trocken“ (vorhanden). Ohne Aufnahme fällt der Moment weg, deshalb nur zusammen mit H2.

### 4.2 Drei Mystery-Verbesserungen

**M1 · „WAS WEISST DU?“, Lukes Fragen in der Fibel (Deduktion vor der Auflösung, M)**
- **Prinzip:** Die Fallwand aus Alan Wake 2 plus die Dreier-Bestätigung aus Obra Dinn. Vor vier Wendungen öffnet die Fibel eine Frage in Lukes Handschrift. Der Spieler legt zwei bis drei gefundene Stücke darunter (Polaroid, Notiz, Nachbild, Mitschnitt).
- **Fragen:**
  - Kap. 1: „Wer war hinter der Kellertür?“, Belege: Spieluhr unter der Stimme, Gurte von innen, Hildes „Nicht du“.
  - Kap. 2: „Wer ist das achte Kind auf dem Foto?“
  - Kap. 3: „Wessen Hand ist aufgegangen?“ (Raum 3 bleibt die Pflicht-Einlösung.)
  - Kap. 5: „Wer kocht in unserem Haus?“, Belege: Lucy summt und bricht beim vierten Ton ab, Spieluhr im Abspann von Kap. 3, Lucys Zehen berühren den Boden nicht.
- **Belohnung:** Wer richtig kombiniert, **bevor** die Wendung kommt, bekommt eine eigene Luke-Zeile in der Szene („Ich wusste es. Ich wollt’s nicht wissen.“), einen Fibel-Stempel und Tauschware für Whiskey. Falsche Kombinationen bleiben einfach stehen. Nichts blockiert.
- **Warum:** Der Spieler bildet Theorien, statt sie vorgelesen zu bekommen. Die Wendung trifft dann seine eigene Vermutung.
- **Technik:** `sammeln_reiter` (vorhanden), Spielstand über `MOD_SAVE`, Belege aus `story.lore`.

**M2 · „Mitschnitt“, das Ohr des Tontechnikers (M/L)**
- **Werkzeug:** Lukes Diktiergerät (Gürteltasche). Er kann Telefon, Funk, Kellertür, Band und Tierlaute aufnehmen, höchstens sechs Plätze. In der Fibel liegt ein Mischpult mit Spektrum: Tempo halbieren, Bandpass, rückwärts.
- **Fairer Grundwert:** Lucys Band in Kapitel 1 ist laut Kanon „Lucys **echte** Stimme, ohne Spieluhr“. Das ist die Vergleichsprobe.
- **Deduktionen:**
  - Kap. 1: Die Stimme hinter der Kellertür zeigt im Spektrum die Zinken der Spieluhr (E6 …). Das ist ein Hinweis auf Wendung 1, den nur aufmerksame Spieler finden.
  - Kap. 3, Funk „Zwei Lucys“: Ein zweiter Lösungsweg neben HASENBROT. Kanal A hat die Zinken, Kanal B nicht.
  - Kap. 6: Die Wendigo-Stimmen haben **keinen Atem** vor dem Satz. Das ist eine Messbarkeit, die M3 vorbereitet.
- **Warum:** Das Spiel bekommt ein unverwechselbares Verb. Hinweise werden gehört statt gelesen, und Regel 5 wird ein Werkzeug des Spielers.
- **Technik:** Web Audio (`AnalyserNode` und `AudioBuffer`), keine Assets nötig, Spieluhr über `lucy3_tines`.

**M3 · „Zwei Raben“ als Entscheidung des Spielers (Umbau Höhepunkt Kap. 6, M)**
- **Ablauf:** Am Bau sitzen zwei Whiskeys. Die Kinosequenz hält an (`kino.js`, `frei: true`). Luke muss **einem** Raben die Hand hinstrecken. Bisher ist das „Hand ausstrecken“ nur optional, jetzt wird es die Wahl. Zeitdruck: Das Hirschding steigt in 12 s aus dem falschen.
- **Merkmale, die über sechs Kapitel gepflanzt wurden:**
  1. **Ring am linken Fuß** mit Turm über Abgrund (Kap. 1 Vegas, Kap. 4 LWO-Akte „beringt“). Der falsche ist spiegelverkehrt, Ring rechts.
  2. **Atem:** Whiskey hat sichtbaren Atemhauch (R-26), der falsche nicht. Kein Atem ist das gemeinsame Merkmal aller Wendigo-Häute (`hungrige.js`).
  3. **„Großer“:** Whiskey sagt nie „Großer“, der falsche sagt es. **Dafür braucht es eine neue Pflanze:** In Kap. 3 oder 4 äfft Whiskey Lucy nach, bricht aber genau vor „Großer“ ab und putzt sich. Luke bemerkt es.
  4. **Flügel:** Der falsche schlägt mit stummen Flügeln.
- **Folge:**
  - Richtig: Der echte Whiskey landet auf der Hand und trägt Miras Licht, kerzengerade und kalt-weiß. Die Sequenz läuft wie geschrieben weiter.
  - Falsch: Todesart `wendigo`, und nach A-21 fehlt danach ein Nachbild.
- **Warum:** Das Finale des gebauten Spiels wird zur Probe aufs Aufpassen, wie das „Wer ist der Doppelgänger?“ in Until Dawn und The Quarry. Grusel und Mystery entladen sich im selben Atemzug.

---

## 5 · Risiken: Was den AAA-Eindruck am stärksten bricht, und die Reihenfolge der Behebung

| # | Risiko | Beleg | Behebung |
|---|---|---|---|
| 1 | **Absturz / Kontextverlust** in Kap. 5/6 | Grafikspeicher 7,6–7,8 von 8 GB, rund 4 700 Texturen, 876 Programme (Schlusstest) | H1, Teil 1: Entladen je Kapitel, Texturgrößen |
| 2 | **Blockierende Fehler in den ersten Minuten** | Treppe Nr. 7 (Kap. 1), Kellertreppe ungeprüft, Tür Zimmer 7 (Kap. 2) im Neubau prüfen | H5, Kollision/Treppe, ein gezielter Lauf |
| 3 | **Ruckeln beim ersten Betreten, niedrige FPS** | 8,1 FPS Nr. 7 innen, 15,7 FPS Kreuzung, CPU-gebunden im JS-Thread | H1, Teil 2 und 3: Shader vorwärmen, CC-Gesichter, LOD, Takte |
| 4 | **Ladezeit** | kalt 220–246 s, warm 101–108 s | H1: Vorladen nach Bedarf, schlanker Bau (`HAM_SLIM`) |
| 5 | **Lesbarkeit von Licht und Bild** | Prolog-Graugesicht überstrahlt, Villa und Halle sehr dunkel, Nr. 9 dunkel, Schlieren über Vorgärten | H5: gesteuerte, lesbare Dunkelheit (Silhouetten, Kantenlicht) statt Schwarz |
| 6 | **Selbst gezeichnete Decals** | Kreidebalken schweben, Telefonzelle ohne Eingang, Canvas-Blut/UFO-Bilder | H5: Megascans-Decals (Nutzer meldet sich selbst an) |
| 7 | **Fehlende Stimmen** | 3 von 1 100 Zeilen; Blocker Smart App Control und Klon-Treue | H2: Kernzeilen plus nonverbale Laute; Entscheidung des Nutzers nötig |
| 8 | **Figuren und Animation** | Nutzerurteil R-3; Peter-Nahaufnahme pixelig; Kinderfiguren 76–107 k Dreiecke; Hildes Kopf fehlt in einem Bild; Joint schwebt | nach H1 (Speicher/LOD): Nahaufnahmen im Kino gezielt nachbessern, Mocap-Durchgang |
| 9 | **Fehler im Raumklang** | Schritte im Amt-Gang verstummen zwischen 25 m und 5 m | ein Hörtest im Amt, Verdeckung/Abstandskurve in `raumklang.js` prüfen |
| 10 | **Ungeprüfte Systeme** | Zeichen, Umwelt, Vegetation, Hände/Räume, Beobachter, Kino-Bilder im Schlusstest nicht gelaufen | im einen Schlusslauf am Ende (Nutzerregel) mitnehmen |
| 11 | **Erster Eindruck außerhalb des Spiels** | Titelbildschirm R-27 und Symbol R-28 nicht gebaut | H5, nach Absprache (laut `UEBERGABE.md` erst nach Rücksprache beginnen) |
| 12 | **Struktur** | Das gebaute Spiel endet nach Kap. 6 ohne Titelfigur; `CLAUDE.md` plant 8 Kapitel | erst nach Stabilität erweitern; bis dahin H8 als echtes Finale |

**Reihenfolge der Behebung**, nach der Regel „spielbar → stabil → poliert“:
1. Absturz (1) und blockierende Fehler (2).
2. Ruckeln, FPS und Ladezeit (3, 4).
3. Erste 30 Minuten: Licht, Decals, Titel (5, 6, 11 als H5).
4. Die kleinen Design-Hebel ohne Asset-Bedarf: H3, H4, H6. Jeder höchstens S/M, mit großer Wirkung auf den Grusel.
5. Stimmen (7, H2) nach der Entscheidung des Nutzers.
6. Figuren und Animation (8), Raumklang (9).
7. Inhaltliche Ausbauten: H7, H8, M1, H9, H10/M2.
8. Ein Spieltest und Leistungsdurchgang am Ende (10), wie vom Nutzer festgelegt.

**Was nicht angefasst werden sollte:**
- die sechs Höhepunkte und Raum 3
- Lunas Spielregeln als Gerüst
- die Ein-Sekunden-Regel des Beobachters
- „Luna schreit nie“
- die Ein-Satz-Regel für Luke
- die Kapitel-Abfolge der Spielmodi

Das ist der Kern, der das Spiel von der Masse abhebt.
