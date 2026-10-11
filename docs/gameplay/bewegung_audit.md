# Bewegung und Hitboxen – Audit (Folgeauftrag 7, Stand 11.10.2026)

Maßstab (Nutzer, 10.10.): bei allem mindestens Schulnote 2, Unprägnantes darf 3 sein; „prägnant“ = Fahrzeuge, Hauptrequisiten, Bewegung. Noten: 1 sehr gut … 6 ungenügend. Jede Zahl unten stammt aus einem Messlauf (Werkzeuge: `app/tools/qa_bewegung/`, Dauerinstanz `_live.sh`, `__BW` in der Spielseite; Läufe 11.10.2026).

## 1. Ergebnis in einer Tabelle

| Punkt | prägnant | Note vorher | Note nachher | Messwert / Beleg |
|---|---|---|---|---|
| Fahrzeuge begehbar (Dach/Haube/Kofferraum, Sprung + Hochziehen aus 8 Richtungen, 4 davon im Sprint) | ja | 5 | 1 | 17 Fahrzeuge, 204 Läufe: oben 176 · abgeglitten/drüber 8 · Anlauf durch Nachbarn blockiert 15 · steckt 0 · gefangen 0 |
| Fahrzeuge: nie hineinfallen / kein Hohlraum | ja | 4 | 1 | Hitbox = Höhenfeld des echten Netzes (15-cm-Zellen → Kisten, Oberkante = Dach/Haube); Freischieben aus dem Volumen: 27/27 Testlagen frei (3 Lagen je Fahrzeug: Mitte unten, vorn innen, Mitte hoch) |
| Lukes Leihwagen (erste Minute des Spiels) | ja | 4 | 1 | alte Kiste `addCol(-77.2 … 3.75)` ohne Höhe = 99 m → Wand bis zum Himmel; jetzt Höhenfeld-Hitbox, 12/12 Läufe oben |
| Requisiten/Kollisionskörper: Steckenbleiben (Stichprobe 300/Kapitel + alle Objekte Kap. 1) | ja | 3 | 1 | 1800 Objekte / 7200 Läufe in Kap. 1–6 + 465 Objekte / 1860 Läufe Vollmessung Kap. 1: steckt/gefangen = 0 (vorher 5 gefangene Fässer in 400 Objekten) |
| Hochziehen/Mantle-Höhe | ja | 3 (bis 2,0 m) | 1 (bis 2,4 m) | Kiste 1,6 × 1,6 m: 0,4 … 2,4 m aus 4 Richtungen oben (4/4), 2,6 m nicht (Sprung 0,98 m + Hochziehen) |
| Hocken (Kollisionshöhe) | ja | 3 (1,15 m) | 1 (0,90 m) | `bodyH() = 1,7 − 0,8·crouchK − 0,25·crawlK`; Augenhöhe 0,85 m |
| Kriechen durch Öffnungen | ja | 4 (nur ≥ 1,15 m) | 1 (ab 0,70 m) | Wand mit Loch, Kiste und Netz: 0,70 … 1,20 m durch, 0,55/0,60 gesperrt; Netz auch 0,65 m |
| Abrutschen von Kanten | ja | 3 (21 cm Überstand) | 2 (13,5 cm) | Körpermitte 10 cm hinter der Kante: steht, 20 cm: rutscht ab |
| Sprung/Luftkontrolle | ja | 2 | 2 (unverändert) | Scheitel 0,98 m, Flugzeit 0,73 s; Seitenschritt in der Luft 0,55 m; Sprint-Sprung 3,6 m weit |
| Schwenktüren der Basis: offen = Durchgang, zu = gesperrt | ja | 2 | 1 | Tür 0 (23 / -12): zu 1.2 m gesperrt, offen 7.2 m durchgelaufen; Tür 1 (-47 / -12): zu 1.2 m gesperrt, offen 6.0 m durchgelaufen; Tür 2 (633 / -2598): zu 1.2 m gesperrt, offen 7.0 m durchgelaufen; Tür 4 (633 / -2602): zu 1.2 m gesperrt, offen 5.4 m durchgelaufen; Tür 3 ist die Klappe des Sicherungskastens (kein Durchgang) |
| Fallen (Flutfüllung, Hineingelangen ohne Rückweg) | ja | nicht gemessen | 1 | 8 Gebiete (Dorf, Wald, Amt, Villa, Nr. 1, Nr. 4, Kirchberg-Räume, Kap.-6-Gelände): 0 Fallen (Abschnitt 4) |

## 2. Befunde, Ursachen, Maßnahmen

| # | Befund (Messung) | Ursache im Code | Maßnahme | Datei |
|---|---|---|---|---|
| 1 | Auf **jedes** Fahrzeug springen/hochziehen schlug fehl: alle 8 Fahrzeuge „unten“, man lief durch den Wagen (erster Lauf: 12/12 „unten“ je Fahrzeug) | `bewegung_bauen` setzte nach einem Neubau die neuen Kisten nicht auf „aktiv“; `bewegung_aktiv(true)` schrieb dann `minX = __x0` = `undefined` → NaN-Kisten, Fahrzeug ohne Kollision (nach jeder Unsichtbarkeit, z. B. Kapitelstart) | `rec.on = true` nach dem Bauen | `app/mods/bewegung.js` |
| 2 | Lukes Leihwagen (Start) nicht begehbar: Hochziehen unmöglich | `strasse.js` legt `addCol(-77.2, -72.6, 1.85, 3.75)` ohne Höhe an (Standardhöhe 99 m) – eine Wand bis zum Himmel mitten im Wagen | beim Bau der Hitbox werden hohe Kisten im Fahrzeugumriss abgeschaltet (nicht gelöscht) | `bewegung.js` |
| 3 | Konsolenfehler `Cannot read properties of undefined (reading 'minX')` (raumklang `rk_seg`) und falsche Wandverdeckung des Tons | `colliders.splice(...)` verschob die Indizes, die `raumklang.js` hält (die Türen schalten deshalb nur ab: `minX = maxX = -9999`) | Kisten werden abgeschaltet und beim Neubau wiederverwendet (Pool) – `colliders` wächst nicht mehr (zuerst als Leistungs-Gate-Fehler aufgefallen: p95 Wald 18 → 42 ms) | `bewegung.js` |
| 4 | Fässer/Tonnen: Sprung/Hochziehen „drüber“ landete **im** Fass, Körper (r 0,3 m) steckte fest (5 gefangene Fälle in 400 Objekten) | Netz-Kollision arbeitet an der Oberfläche: steht die Körpermitte weiter als 0,3 m von der Wand, gibt es keinen Treffer – kein Schieben, kein Hochziehen | Volumenfüller: kleine wasserdichte Netze (≤ 5000 Dreiecke, ≤ 2,4 m) werden von oben mit Strahlen durchlaufen (Vorder-/Rückseiten → feste Abschnitte, Hohlräume im Inneren bleiben frei), Zellen mit Körpermitte ganz im Festen werden zu Kisten bis zur echten Oberkante; Takt höchstens ein Netz je 60 ms im 25-m-Umkreis | `bewegung.js` (`hohl_*`) |
| 5 | Wer (z. B. nach einem Szenenwechsel) im Volumen eines Fahrzeugs steht, kam nicht heraus: 14 von 24 Testlagen (8 Fahrzeuge × 3) blieben drin | `tod_klemmTick` suchte den freien Platz nur mit Weg, der **nicht** durch Kisten führt – vom Wageninneren geht jeder Weg durch die Wagenkisten | neu: steckt der Körper in Füllkisten (Fahrzeug/Fass), nach 0,5 s – auch ohne Eingabe – zum nächsten freien Platz außen schieben; Weg darf durch Füllkisten führen, nicht durch Wände | `app/mods/tod.js` |
| 6 | Hocke 1,15 m Kollisionshöhe, kein Kriechen: Öffnungen niedriger als 1,15 m waren gesperrt (Rätsel „kleine Löcher in Häusern“) | `bodyH = 1,7 − 0,55·crouchK`, Netz-Proben fest bei 0,62/1,05/1,5/1,72 m | Hocke 0,90 m; Kriechzustand 0,65 m (automatisch bei Hocke und Decke < 0,96 m voraus, erst ab 1,0 m wieder Hocke); Netz-Proben folgen der Körperhöhe (`bodyProbes()`); Augenhöhe 0,85/0,55 m; Tempo ×0,5/×0,25 | `app/mods/bewegung_patch.py`, `tod.js` |
| 7 | Hochziehen aus der Luft nur bis ≈ 2,0 m | Grenze `m.top − player.pos.y < 1.2` im Sprung | 1,45 → bis 2,4 m (Sprungscheitel 0,98 m) | `bewegung_patch.py` |
| 8 | Man stand 21 cm neben einer Kante „in der Luft“ | `groundAt` nutzt Radius `R·0,7` für die Stützfläche | `R·0,45` (13,5 cm) | `bewegung_patch.py` |

Unverändert und geprüft (kein Befund): Kollisionsauflösung `collide()` achsweise in 10-cm-Teilschritten, Stufen bis 0,36 m, Kopfstoß-Schutz, Netz-Schiebung `solidPush`, Kamera-Schutz `camGuard`, Weltgrenze `mapGuard`.

## 3. Messtabellen

### 3.1 Fahrzeuge: Sprung-/Mantle-Test

Je Fahrzeug 8 Richtungen (4 Achsen + 4 Diagonalen), Achsen zusätzlich im Sprint; Anlauf 3,2 m (bei Nachbarn 2,2/1,7 m), Absprung 1,1 m vor der Kante, danach 1 s ausrollen. „oben“ = Körper steht auf dem Fahrzeug (Boden unter den Füßen = Kisten-Oberkante) ; „unten“ = außen gelandet/abgeglitten; „steckt“ = Eindringtiefe > 10 cm in Kiste oder Netz; „gefangen“ = von dort in 0,7 s Lauf + Sprung keine 0,4 m Weg.

| Nr. | Fahrzeug | Lage x / z | Höhe m | Läufe | oben | unten | Anlauf blockiert | steckt | gefangen | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Transporter/Bus (vans, auf Buslänge gestreckt) | 8 / -4 | 1.75 | 12 | 6 | 0 | 6 | 0 | 0 | 1 |
| 3 | Wrack, überwachsen (car_rusty) | -10 / 204 | 1.35 | 12 | 11 | 0 | 0 | 0 | 0 | 1 |
| 4 | Transporter/Bus (vans, auf Buslänge gestreckt) | 65 / 200 | 2.05 | 12 | 11 | 0 | 1 | 0 | 0 | 1 |
| 5 | Limousine (car_neu/sedan) | -75 / 3 | 1.45 | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| 6 | Wrack, ausgebrannt (car_burned) | -8 / -12 | 1.25 | 12 | 9 | 1 | 0 | 0 | 0 | 1 |
| 7 | Wrack, überwachsen (car_rusty) | -5 / -42 | 1.25 | 12 | 6 | 0 | 6 | 0 | 0 | 1 |
| 8 | Transporter (van_neu) | 14 / 3 | 1.85 | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| 9 | Kleinwagen (car_neu/hatch) | -50 / 3 | 1.55 | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| 10 | Limousine (car_neu/sedan) | 36 / 3 | 1.45 | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| 11 | Limousine (car_neu/sedan) | -37 / 3 | 1.45 | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| 13 | Limousine (car_neu/sedan) | 2 / -37 | 1.45 | 12 | 10 | 0 | 2 | 0 | 0 | 1 |
| 14 | Transporter/Bus (vans, auf Buslänge gestreckt) | 131 / -21 | 1.85 | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| 15 | Traktor | -132 / -20 | 2.05 | 12 | 9 | 3 | 0 | 0 | 0 | 1 |
| 16 | Wrack, ausgebrannt (car_burned) | 153 / -2 | 1.35 | 12 | 8 | 2 | 0 | 0 | 0 | 1 |
| 17 | Wrack, ausgebrannt (car_burned) | 150 / 2 | 1.25 | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| 18 | Transporter/Bus (vans, auf Buslänge gestreckt) | 136 / -24 | 1.85 | 12 | 10 | 2 | 0 | 0 | 0 | 1 |
| 19 | Wrack, ausgebrannt (car_burned) | 122 / -13 | 1.35 | 12 | 12 | 0 | 0 | 0 | 0 | 1 |

Alle Fahrzeuge prägnant = ja. „Anlauf blockiert“ entsteht, wenn die Anlaufstrecke vor Wand, Zaun oder Nachbarwagen endet (Wagen 7 und 13 stehen dicht an Hauswänden) – der Test lässt diese Richtung aus, statt die Wand zu werten.

### 3.2 Requisiten und Kollisionskörper

Alle Kollisionskisten (Höhe 0,5 … 2,2 m, Grundfläche ≤ 9 m) und alle festen Netze (0,5 … 4 m hoch, ≤ 9 m) der geladenen Welt, gleichmäßige Stichprobe von 300 Objekten je Kapitel, je 4 Richtungen; zusätzlich Kap. 1 vollständig.

| Kap. | Objekte | Läufe | oben | unten (drüber/abgeglitten) | Anlauf blockiert | innen frei (unter/neben Teilen, beweglich) | streift | steckt | gefangen |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 300 | 1200 | 118 | 444 | 625 | 13 | 0 | 0 | 0 |
| 2 | 300 | 1200 | 138 | 464 | 589 | 9 | 0 | 0 | 0 |
| 3 | 300 | 1200 | 125 | 476 | 592 | 5 | 2 | 0 | 0 |
| 4 | 300 | 1200 | 133 | 474 | 584 | 6 | 3 | 0 | 0 |
| 5 | 300 | 1200 | 140 | 453 | 594 | 12 | 1 | 0 | 0 |
| 6 | 300 | 1200 | 47 | 492 | 651 | 4 | 6 | 0 | 0 |
| 1 (voll) | 465 | 1860 | 183 | 724 | 943 | 7 | 3 | 0 | 0 |

Stand der Läufe: Kap. 2–5 mit dem Zwischenstand vom Vormittag (Füller mit 40 m Umkreis und 24-k-Dreiecksgrenze); Kap. 1, Kap. 6 und die Vollmessung mit dem Endstand (25 m, ≤ 5000 Dreiecke, Pool). Die Fahrzeugtests, Kriech-, Hochzieh-, Kanten- und Freischiebe-Messungen sind vom Endstand.

Die Hälfte der Läufe ist „Anlauf blockiert“: viele Requisiten stehen an Wänden oder in Räumen ohne 1,7 m Anlauf. Das ist keine Aussage über diese Objekte; sie sind in den anderen Richtungen oder durch die Laufraster-Tests (`_qa_kol` Teil C) abgedeckt.

### 3.3 Hohlraum-Füller

| Kap. | geprüfte Netze (25 m um den Spieler) | Netze mit gefüllten Volumen | Kollisionskisten | Fehler |
|---|---|---|---|---|
| 1 | 7541 | 109 | 166 | 0 |
| 2 | 8226 | 176 | 517 | 0 |
| 3 | 8161 | 163 | 460 | 0 |
| 4 | 8091 | 164 | 509 | 0 |
| 5 | 8148 | 181 | 553 | 0 |
| 6 | 8065 | 75 | 376 | 0 |
| 1 (voll) | 7527 | 110 | 174 | 0 |

(Die Kap.-1–6-Zeilen stammen aus dem Lauf vor der Umstellung auf 25 m Umkreis und das Dreiecksbudget; die Vollmessung zeigt den jetzigen Stand.)

### 3.4 Hochziehen (Kiste 1,6 × 1,6 m, Anlauf aus 4 Richtungen)

| Höhe | oben | Hochziehen |
|---|---|---|
| 0.4 m | 4/4 | nein (Sprung/Stufe) |
| 0.6 m | 4/4 | nein (Sprung/Stufe) |
| 0.8 m | 4/4 | nein (Sprung/Stufe) |
| 1.0 m | 4/4 | nein (Sprung/Stufe) |
| 1.2 m | 4/4 | nein (Sprung/Stufe) |
| 1.4 m | 4/4 | ja |
| 1.6 m | 4/4 | ja |
| 1.8 m | 4/4 | ja |
| 2.0 m | 4/4 | ja |
| 2.2 m | 4/4 | ja |
| 2.4 m | 4/4 | ja |
| 2.6 m | 0/4 | nein (Sprung/Stufe) |
| 3.0 m | 0/4 | nein (Sprung/Stufe) |

Dünne Mauer (20 cm): 0.6 m: nicht überwunden, 0.9 m: nicht überwunden, 1.2 m: oben, 1.5 m: über die Kante gestiegen, 1.8 m: über die Kante gestiegen, 2.2 m: nicht überwunden. Mauern über 1,8 m und dünner als 40 cm lassen sich nicht übersteigen (keine Standfläche hinter der Kante) – bewusst.

### 3.5 Kante

| Körpermitte hinter der Kante | Höhe nach 1 s | Ergebnis |
|---|---|---|
| 0 cm | 1.00 m | steht |
| 5 cm | 1.00 m | steht |
| 10 cm | 1.00 m | steht |
| 15 cm | 0.00 m | rutscht ab |
| 20 cm | 0.00 m | rutscht ab |
| 25 cm | 0.00 m | rutscht ab |
| 30 cm | 0.00 m | rutscht ab |
| 40 cm | 0.00 m | rutscht ab |

### 3.6 Kriechen

Wand 4 m breit, Öffnung 1,0 m breit, Hocke gehalten (Strg) und 2,6 m Anlauf; als Kollisionskisten und als Netz (Box-Meshes mit BVH) gebaut.

| Lochhöhe | Kisten | Netz | Zustand | tiefste Augenhöhe |
|---|---|---|---|---|
| 0.55 m | gesperrt | gesperrt | Kriechen | 0.55 m |
| 0.60 m | gesperrt | gesperrt | Kriechen | 0.55 m |
| 0.65 m | gesperrt | durch | Kriechen | 0.55 m |
| 0.70 m | durch | durch | Kriechen | 0.55 m |
| 0.75 m | durch | durch | Kriechen | 0.55 m |
| 0.80 m | durch | durch | Kriechen | 0.55 m |
| 0.90 m | durch | durch | Kriechen | 0.55 m |
| 1.00 m | durch | durch | Hocke | 0.84 m |
| 1.20 m | durch | durch | Hocke | 0.84 m |

Geplant für die Rätsel mit kleinen Löchern: Öffnungen ab **0,70 m** Höhe sind verlässlich passierbar (0,65 m nur als Netz). Rät­sel­bau: Loch als Lücke zwischen Kollisionskisten (Unterkante der oberen Kiste = Lochhöhe) oder als Netz-Öffnung bauen; Mindestbreite 0,7 m.

## 4. Fallen / Erreichbarkeit (Flutfüllung)

Raster 0,5 m; Zelle frei = Körper (r 0,3 m, 1,7 m) überlappt weder Kisten noch feste Netze; Kanten zu 8 Nachbarn, Aufstieg ≤ 1,5 m (Sprung/Hochziehen), Abstieg beliebig. **Vorwärts** vom Start aus erreichbar (F), **rückwärts** zum Start zurückkehrbar (R). Falle = F \ R (hineingelangt, nicht wieder heraus). Außerdem werden freie, aber **nicht erreichbare** Bereiche gelistet (geschlossene Räume hinter verriegelten Türen, Zaunstreifen an der Weltgrenze).

| Gebiet | Fläche erreichbar m² | Fallen | nicht erreichbare Bereiche | Bemerkung |
|---|---|---|---|---|
| Dorf (x −110…110, z −42…62) | 19158 | 0 | 5 | Kap. 1: Straße, Gärten, Hinterhöfe; unerreichbar: zwei Zaunstreifen hinter der Südgrenze, Innenräume Nr. 1 und Nr. 7 (Türen zu) |
| Wald (x −60…140, z 62…262) | 31826 | 0 | 1 | Kap. 1/6: Dustwoods; unerreichbar: Streifen jenseits der Weltgrenze (z 62…98) |
| Amt Kap. 2 | 185 | 0 | 11 | Kap. 2: Amt; unerreichbar: Räume hinter verriegelten Stahltüren (Messraum, Archiv …) und Außenwelt |
| Villa | 2730 | 0 | 1 | Villa: unerreichbar: ein Raum (Tür zu) |
| Nr. 4 innen | 1928 | 0 | 4 | Nr. 4 (Oma Erna): unerreichbar: drei Zimmer (Türen zu) und eine Bettfläche (1 m², 0,7 m hoch, Möbel ringsum) |
| Kirchberg-Räume | 3126 | 0 | 3 | Kirchberg-Räume (Friedhofs-/Vorgartenräume): 3 kleine Flecken (0,5–30 m²) hinter Möbeln |
| Nr. 1 + Vorgarten | 2199 | 0 | 2 | Nr. 1 (Elternhaus): Innenraum (Tür zu) und Grenzstreifen |
| Kap. 6 Bus/Wald | 9827 | 0 | 1 | Kap. 6: Gelände um den Bus; ein 3-m²-Fleck an der Boxkante |

## 5. Grenzen und Offenes (ehrlich)

* **Stichprobe:** Requisiten/Netze in Kap. 1–6 je 300 Objekte × 4 Richtungen (gleichmäßig über Kisten und feste Netze); Kap. 1 zusätzlich vollständig. Die Welt bleibt über alle Kapitel geladen, die Kapitel unterscheiden sich durch Sichtbarkeit und nachgebaute Räume – die Stichproben je Kapitel prüfen deshalb zum großen Teil dieselben Orte, Kap. 6 zusätzlich Dustwoods/Bus.
* **Anlauf blockiert** (rund die Hälfte der Objektläufe) wird nicht als „bestanden“ gewertet, nur nicht gewertet.
* Fahrzeuge **ohne** Spielerzugang nach innen: Bus (Kap. 6) und Transporter sind als massive Hitbox gebaut (Fenster sind nie Eingang); Innenräume sind reine Kulisse hinter Glas. Konsistent, keine Hohlräume ohne Ausgang.
* Rätsel mit kleinen Löchern (Nutzer baut später): physikalisch bestätigt ab 0,70 m; **Spielhinweis** (Fibel/Tutorial „Strg/C: ducken, unter Öffnungen kriechen“) ist nicht geändert worden – der Text steht in `verstecke.js`/`fibeltour.js` unter „ducken“ und bleibt gültig.
* `raumklang.js` hält Kollisionsindizes: Kisten werden deshalb nur abgeschaltet/wiederverwendet. Wiederverwendete Fahrzeugkisten stehen im Schallraster in den alten Zellen (Verdeckung für parkende Fahrzeuge unverändert, bewegte Fahrzeuge sind selten).

## 6. Werkzeuge und Nachlauf

`app/tools/qa_bewegung/` (Kopie der Werkzeuge aus `C:\Users\GIGABYTE\_qa_bew`): `lib.js` (Testbibliothek `__BW`: place/upd/sprungTest/overlap), `mk.js` (Steps bauen), `veh_all.js`, `obj_test.js`, `synth.js` (Hochziehen/Kante), `crawl.js`, `falle2.js`/`falle.js`, `freischieben.js`, `door_test.js`, `aircontrol.js`, `chain*.js`, `docgen_*.py`. Aufruf: `node mk.js <name> <kap> lib.js <test>.js` → `bash _live.sh run <name>.json`; Ergebnis liegt in `out/*.json` (Schritt gibt „FILES:“ zurück).

