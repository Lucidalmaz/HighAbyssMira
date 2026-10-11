# Zustand, Persistenz und Kapitelwechsel – Audit und Test (10./11.10.2026)

Auftrag (Nutzer): Wie bei einem AAA-Spiel – Kapitelstart, Kapitelwahl, Teleport oder Test bringen Dialoge, Erinnerungen, Echos, Ereignisse und Hinweise früherer Kapitel NICHT wieder; Zurückporten bringt nichts Erledigtes zurück; der Stand ist jederzeit der tatsächlich erspielte.

Schulnoten: 1 sehr gut … 6 ungenügend. "prägnant": ja = Hauptweg/Hauptfigur/sichtbarer Wiederholungsfehler, nein = Hintergrund/selten. Maßstab: prägnant mindestens 2, Hintergrund 3 erlaubt.
Belegkürzel: **J2…J6** Kapitelwahl-Sprung in Kap. 2…6 (frische Sitzung, Beobachter protokolliert Untertitel/Toast/Gedanken/Echo/Aufgaben/Items 30–100 s lang; Ausgabe in `_zst/j<N>_ev.txt`, `j<N>_chk.txt`), **S4** Raster-Streifzug Kap. 4 (253 Punkte à 0,45 s + 12 Innenräume, vorher/nachher), **P1** echt gespielter Kap.-1-Durchlauf mit E (Briefkasten → Tür → Kalender/Zettel/Foto → Tastenfeld 3110 → Rekorder/Band → Treppe → Ausfall → Keller → Werkbank → Wand), **L1/L4** Speichern → Neuladen → „Weiterspielen“ → Snapshot-Vergleich (`_zst/cmp.py`), **H1…H6** Interaktions-Sweep je Kapitel (alle 540–570 Interaktionen einmal ausgelöst, Funde protokolliert), **Code** = Quelltext-Befund, im Spiel nicht einzeln ausgelöst.

## 1. Mechanismus (neu)

| Baustein | Datei | Wirkung |
|---|---|---|
| `ZUST` (begun, erl, geladen) | `kapitel.js` | Welche Kapitel in diesem Spielstand wirklich begonnen wurden (Spielstand-Schlüssel `zustand`); ältere Stände: bis zum gespeicherten Kapitel |
| `zustand_aufraeumen()` | `kapitel.js` (in `setChapter`) | Bei jedem Kapitelwechsel leeren: Untertitel-Reihe, Toast, Gedanken-Reihe, wartende Notizen, Ziele-Reihe/-Halt, Aufheben-Reihe, laufende Sprachzeile |
| `zustand_vorgeschichte(n)` | `kapitel.js` (kapStart / setChapter) | Für jedes Kapitel < n, das nie begonnen wurde (Kapitelwahl/Sprung): Funktionen `ZUST.erl[k]` aus `zustand.js` – Pflicht-Merker, Gegenstände, Funde, Nachbilder, Aufgaben `zu` |
| `zustand.js` | neues Modul (nach `geister`) | Füllt `ZUST.erl[1…5]`; Funde (Wortlaut aus echten Durchläufen), Nachbilder, Aufgabenschluss, Welt-Sync (Kellerwand-Pfropfen nach Kap. 1 weg, späte Nachbild-Anker) |
| `ZUST.geladen` | `kapitel.js`, Basis `saveGame`/`resumeHooks` | Solange ein Stand eingelesen/aufgebaut wird, schreibt `saveGame` nichts (vorher überschrieben `chapter3Begin`/`chapter4Begin` den Stand mit Kap. 3/Kap. 4 ohne Ort und löschten Villa-Fortschritt) |

## 2. Modul-Tabelle (alle Module mit Kapitelzustand)

| Modul | Kapitelzustand | Speichern/Laden (Befund) | Kapitel-Aufräumen (Befund) | Lücke → Behebung | Note vorher → nachher | prägnant | Beleg |
|---|---|---|---|---|---|---|---|
| Basis: Echos (`echoSeen`) | Set gesehener Nachbilder | nirgends gespeichert → nach Laden alle wieder berührbar, Lore doppelt | Kap.-1-Echos in allen Kapiteln | `applySave` leitet `echoSeen` aus Lore `echo_*` ab, Anker aus; `playEcho` ohne Doppel-Lore; Sprung markiert Vorkapitel-Echos erledigt (`zustand.js`) | 5 → 2 | ja | J4/J5/J6: `echoSeen` = alle Vorkapitel-Echos, Anker weg; Code |
| Basis: Polaroids (`story.photos`) | 7 Fotos + Kerzen | Mesh/Kerze nach Laden wieder da, "Foto aufheben" doppelt, Lore `eight` doppelt | Weg-Ereignisse (Roxy-Schatten, Mike-Telefon, Dina-TV …) feuerten in Kap. 3–6 | `applySave`: aufgehobene Fotos aus, Kerze aus; Weg-Ereignisse nur in Kap. 1 | 4 → 2 | ja | S4 vorher: "Kinderschatten ohne Kind" in Kap. 4 @(-14,-16); nachher weg (`out_sw` vs `out_sw2`) |
| Basis: Rahmen (`saveGame`, `SAVE_STATE`) | `state.*`-Merker Kap. 1 | `st` nur in `resumeCh1` angewandt → ab Kap. 2 verfielen sie beim nächsten Speichern | `saveGame(ch3.on?3…)` schrieb in Kap. 4–6 "Kapitel 3" | `st` immer angewandt; `saveGame(curChapter())`; `ZUST.geladen`-Sperre | 4 → 2 | ja | L1: `st/*` bleibt (Diff 45 → nur erwartete Kapitelwechsel-Felder); Code |
| Basis: Zufallsregie (`runEvent`) | – | – | lief ohne Kapitelbegrenzung in Kap. 5/6 (Wendt-Gestalt, Geisterauto) | nur `curChapter() <= 1` | 3 → 2 | ja | Code |
| `kapitel.js` | KAP, KAP_BEGIN/END | 'kapitel' gespeichert, aber keine Vorgeschichte | – | siehe Mechanismus | 3 → 2 | ja | J2…J6 |
| `kapitel1.js` | K1.f, K1.v | Setter: `K1.obenT` undefiniert → NaN nach Laden; `saveGame(1)` in Kap. ≥3 | "Nicht du"/"Sommer" liefen in Kap. 3 erneut und setzten den Stand auf Kap. 1 | `obenT=0`, `saveGame(curChapter())`, `nichtDu` nur Kap. 1; `erl[1]` setzt Merker/Keller/K1.f | 4 → 2 | ja | P1 (E-Durchlauf), J3 |
| `uebergang.js` | Pfropfen/Kellerwand | nicht gespeichert → Wand nach Laden wieder zu | "Zeichnungen ansehen"/Vorahnung in Kap. 3–6 | `zustand.js`-Tick: ab Kap. 2 Pfropfen weg | 3 → 2 | nein | Code |
| `zimmer7.js`, `amt.js`, `tod.js`, `spinnen.js`, `feuer.js`, `augenzu.js`, `akte.js` | Kap.-2-Zustand | `amt`: `said`/`schritt` nicht gespeichert (Besteck/Registratur doppelt plünderbar), `ch2.ag06` nicht gesetzt (Funkszene erneut); `tod`: `persistCp` ging nach Laden verloren | Ticks sauber `!ch2.on` | `said`/`schritt` im Getter, `ag06` im Setter; `persistCp` im Setter, Punkt für Kap. ≥3 | 4 → 2 | ja | Code; L1 (`tod/cp`) |
| `innen_ort.js` | Puppe/Ball | nicht gespeichert → "Die Puppe sitzt jetzt auf dem Bett" nach jedem Laden | in Kap. 3–6 beim Betreten von Nr. 7 | Spielstand-Schlüssel `innen_ort`, Puppen-Stufe nur Kap. 1 | 3 → 2 | nein | Code |
| `kapitel3.js` | Kreuzung/Anruf/Funk/Laternen | Setter legte nur `S.laden` ab, in Kap. 4+ wurden `ch3.callDone/radio/cowSeen/seq` nie gesetzt und beim nächsten Speichern als false zurückgeschrieben | – | Flags auch in Kap. 4+ wiederhergestellt; `erl[3]` | 4 → 2 | ja | J4/J5/J6 (`ch3` im Protokoll), Code |
| `lucy3.js` | Funkkasten, Begrüßung | `greeted/asked/handOn` nicht gespeichert | Funkkasten ab Kap. 4 tot (gut) | gespeichert | 3 → 2 | nein | Code |
| `neben3.js`, `neben4.js`, `neben5.js`, `neben6.js` | Nebenaufgaben `st` | gespeichert; `*_nachLaden` stellt Welt her | gesperrt über `kapitelN_k()`; Aufgaben schließen am Kapitelende | Sprung: Kap.-2/3/4-Aufgaben `zu` (kein "Neue Nebenaufgabe" nachträglich) | 3 → 2 | ja | J4 (`zu=…k3_*`), J5, J6 |
| `anwesen.js`, `villa.js` | Villa, Schlüsselteile, F3-Fenster | `chapter4Begin` rief `villa_neu()` + Weltuhr 07:40 auch beim Laden → Villa-Stand gelöscht, "Fünf Minuten"/Funk erneut; F3 (`mal`, `schloesser`, `kasten`, `laut`, `nestPick`) nicht gespeichert | Fundorte der Schlüsselteile ohne Kapitelgrenze | `!ZUST.geladen`-Wächter, Einmal-Flag `nachintro`, F3 im Spielstand, Hinweise nur Kap. ≤4, `erl[4]` | 4 → 2 | ja | J5/J6 (`anw_teil_*`), Code |
| `visionen.js` | Totem-Visionen | gespeichert | Visionen ohne Kapitelgrenze (`anwesen`, `rabe`, `steine`) | Kapitelfenster je Vision | 3 → 2 | nein | Code |
| `kirchberg.js`, `post.js`, `nr4.js` | Gisela, Pfarrhaus, Post | `inRaum` ohne Raumzustand | `post.js` Auto-Schreck ohne Kap-Guard | Raum nach Laden wie beim Betreten; `kap()===1` | 3 → 2 | nein | Code |
| `ausbau_nord.js` | Namen, Lichter, Bär, Glocke, Bus, Nachbild | nur localStorage `ham_nord` (nicht am Spielstand, Neues Spiel erbte Stand) | Glocke/Licht-Bus/Nachbild wiederholten sich | Spielstand-Schlüssel `nord` (localStorage nur Rückfall) | 3 → 2 | nein | Code |
| `ausbau_ost_west.js` | Heft, Kanister | Kanister-Aufgabe nicht gespeichert → erneut aufnehmbar/lieferbar | Aydın/Dina Kap. 1 gegated | `kh/kd/kx` im Spielstand, Kanister nach Laden wieder an der Zapfinsel | 3 → 2 | nein | Code |
| `weiss.js`, `justin.js`, `albers.js` | Kap. 3 Weiß, Justin, Vegas | `ch3.said` fehlte; "Psst, Junge" (Vegas-Tür) in Kap. 4 | – | `ch3.said` im Spielstand; `albers_S.hissed` Sprung | 3 → 2 | ja | S4 vorher/nachher ("Psst" weg) |
| `kapitel5.js` | k5-Beats | Spielstand ok; Veranda-Dialog lief bei SP5-1 nach Laden/Tod erneut | alles `k5.on` | `wieder` überspringt Veranda-Gespräch | 3 → 2 | ja | Code; J5 (Start sauber) |
| `kapitel6.js` | K6-Beats | Beute am toten Blechmann (Funkgerät, Kettenrolle) nach Laden unwiederbringlich; `funk/kette/schneider(Frei)` nicht gespeichert; Weltuhr 02:10 statt Beat | Kap.-6-Ende: `saveGame` vor `kapEnde` | `k6_ag20Beute()` + Resume, Flags im Spielstand, `leben_uhr` je Beat, Speichern nach `kapEnde`; Sprung gibt `baumhausschluessel` | 4 → 2 | ja | J6, Code |
| `wald.js`, `tiefwald.js`, `hungrige.js`, `cleo.js` | Wald/Kap. 6 | `told`-Mengen nicht gespeichert (Einmal-Toasts/-Zeilen wiederholten sich) | `wald_frei()`/`kapAb(6)` | `told` im Spielstand | 3 → 2 | nein | Code |
| `lwo.js`, `beobachter.js`, `entdecker.js`, `zayn.js`, `kreaturen.js`, `schrecken.js`, `naturschreck.js` | Nachsorge/Beobachter/Zeichen | vollständig gespeichert | über `kap()`/`wald_frei()` begrenzt | keine Lücke gefunden | 2 → 2 | ja | Code, S4 |
| `gedanken.js` | `said`, Reihe | `said.add` beim Einreihen → ein eingereihter, nie gesprochener Gedanke geht verloren (bewusst belassen: der Versuch, `said` erst beim Sprechen zu setzen, ließ zusätzliche – früher verworfene – Gedanken sprechen und damit Stimmen laden: Leistungs-Gate rot (Straße 1,65 s, Wald p95 36 ms); zurückgenommen, Gate grün) | Orts-Erstzeilen ohne Kapitelbedingung | Orte nur Kap. ≤3 (Villa ≤4); Reihe bei Kapitelwechsel leer | 3 → 2 | ja | S4; Gate `perf_gate_C` |
| `inventar3d.js`, `weltitems.js`, `beutel.js`, `tausch.js`, `kiffen.js`, `verstecke.js` | Inventar-Funde | `known` leer beim Laden → "Aufheben" erneut; Verstecke-Belohnung ging verloren | – | `known` aus Inventar; `fertig` ab 8 Funden | 3 → 2 | nein | Code |
| `album.js`, `sammeln.js`, `karte.js`, `ausruestung.js`, `hervorhebung.js`, `spannung.js`, `ziele.js` | Fibel/Karte/Ausrüstung | gespeichert (`hervorhebung` 600er-Grenze → 1500) | `ziele`-Reihe wurde nie geleert | Reihe bei Kapitelwechsel leer | 3 → 2 | nein | Code |
| `kino.js` | gesehene Sequenzen | kein Gedächtnis | Reihe nur Untertitel | `KAP_SAVE.kino.seen` (Schlüssel `kino`) | 3 → 2 | nein | L4 |
| `leben.js` | Weltuhr, Schauer | **nicht gespeichert**: Tageszeit auf Kapitelstart, Wetter zufällig nach jedem Laden | `ch3.on` statt `kap()` (funktioniert, weil `ch3.on` bleibt) | Spielstand-Schlüssel `leben` (Uhr, Schauer) | 4 → 2 | ja | L1/L4 (`mods/leben/*`) |
| `whiskey.js`, `katzen.js`, `justin.js` (Begleiter) | Whiskey/Katzen/Kater | vollständig gespeichert | `whiskey_k()` je Kapitel; Katzen je Kapitel neu verteilt | keine Lücke | 2 → 2 | ja | Code, L4 |

(Weitere Zeilen und Tests: Abschnitte 3–6.)

## 3. Testprotokoll Zustand (Teil 1d)

| Test | Aufbau | Ergebnis | Note | prägnant | Beleg |
|---|---|---|---|---|---|
| J2–J6 Kapitelwahl-Sprung | frische Sitzung, `startChapterN()` wie im Menü, Einführungskarte angeklickt, 30–100 s beobachtet | In jedem Kapitel nur Ereignisse des Zielkapitels (Kap. 2: Tür/Lucy-Gedanke; Kap. 3: „Fibel“, „W – aufstehen“; Kap. 4: Gasleck, Villa-Gedanken, „Vier ist sauber“; Kap. 5: Veranda-Dialog; Kap. 6: Kiesel/Hänschen). `ZUST.begun` = [1…N]; Pflicht-Items da; Vorkapitel-Aufgaben `zu`; Nachbilder gesehen; `ch3`-Flags bei Kap. 4–6 gesetzt | 4 → 2 | ja | `_zst/j2…j6_ev.txt`, `j*_chk.txt` |
| S4 Raster-Streifzug Kap. 4 | 253 Rasterpunkte (8 m) + 12 Innenräume | vorher 26 Ereignisse inkl. „Psst, Junge“ (Vegas, Kap. 3) und „Kinderschatten“ (Roxy-Foto, Kap. 1); nachher 19, nur Kap.-4-/Allgemein-Ereignisse (Gasleck, Rauch, Villa-Bilder, Beobachter, Verstecke) | 4 → 2 | ja | `out_sw` / `out_sw2` |
| RÜ Rück-Teleport (Kap. 4 und 5) | 18 Orte früherer Kapitel (Nr. 7 Küche/Keller, Kreuzung, Telefonzelle, Auto, Asche, Nr. 1, Nr. 3, Amt Tunnel/Archiv/Zimmer 7/Messraum, Weiß, Kanal, Villa, Tankstelle, Friedhof) je 4 s | nichts aus früheren Kapiteln kommt wieder (Kap. 4: nur Gasleck/Villa/Beobachter; Kap. 5: nur Veranda-Gespräch, das noch läuft) | 2 | ja | `_zst/r4_res.txt`, `r5_res.txt` |
| P1 Kap. 1 gespielt | Briefkasten → Tür → Kalender/Zettel/Foto → Tastenfeld (Fehlversuch + 3110) → Rekorder → Band → Treppe → Ausfall → Keller → Werkbank → Wand aufbrechen, alles mit E | durchgespielt bis Gang offen; Zustand je Schritt (`main` 0→8, `hasKey`, `readCal`, `readFridge`, `cellarOpen`, `heardTape`) wie erwartet | 2 | ja | `p1a…p1k` |
| L1 Speichern → Neuladen → Weiterspielen (Kap. 1, Keller offen) | Neues Spiel, Briefkasten, Tür, Kalender, Zettel, Foto, Tastenfeld 3110 echt, Rekorder-Zettel; speichern, Seite neu laden, „Weiterspielen“ (Pfad `resumeCh1`) | 528 Felder, 8 Differenzen: Akku, Weltuhr (+1,7 min), Schauer-Zeitgeber, Speicherpunkt-Ort (Weiterspiel-Punkt = Kellertreppe); **alle `st`-Merker, Lore, Items, Türen, Aufgaben, Kino/Nachbilder identisch** | 2 | ja | `ltL1_cmp.txt` |
| L1a Kap. 1 Ende → Weiterspielen | Stand nach P1 (Wand offen, `ch1Done`) vor der Korrektur der `st`-Anwendung | Weiterspielen beginnt Kapitel 2 (Absicht); damals gingen `hasKey`, `cellarOpen` … beim nächsten Speichern verloren (45 Differenzen) → Fehler behoben (`applySave` wendet `st` immer an) | 4 → 2 | ja | `ltB2_cmp.txt` |
| L4 Speichern → Neuladen → Weiterspielen (Kap. 4) | Sprung nach 4, dann echte E: Roter Kanister (idef), Vogelscheuche (Seite), Lucys Handy; Weltuhr 09:30, Schauer an | 689 Felder, 18 Differenzen: Taschenlampenakku, Weltuhr +0,8 min, Zeitgeber, Ziele-Log; **0 verlorene Items/Lore/Seiten/Aufgaben**; gefundene Fehler: „Speicherpunkt Kapitel 3 · Ich komme“ im Ziele-Log (tod.js, behoben), nachträglich gesprochene Gedanken (behoben) | 2 | ja | `ltA4_cmp.txt` |

## 4. Schrift-Audit (Teil 3) – siehe `schrift_audit_1110.md`

## 5. Grenzen (ehrlich)
* Nicht einzeln im Spiel ausgelöst („Code“): Kanister-Wiederherstellung (ow), Nord-Glocke/Bus, Kirchberg-Raum nach Laden, Villa-F3-Merker, Kap.-6-Beute nach Laden (`k6_ag20Beute`), Puppe (innen_ort), Weltuhr Kap. 6.
* Klavier-Rätsel im Messraum (`ch2.safeOpen`, `lenaMet`) wird in `tod_ch2Snap` nicht gespeichert: nach dem Laden im Messraum ist es erneut lösbar (kein Fortschrittsverlust, bewusst belassen, weil ein „offen ohne Animation“-Zustand das Fach unerreichbar machen könnte).
* `doors[]` im Spielstand wird nur in Kapitel 1 angewandt; ab Kapitel 2 hat nur `door7` Bedeutung (entriegelt `chapter3Begin`).
* Die Sprung-Vorgeschichte (`ZUST_LORE`) enthält die Funde, die Fallwand/Fibel/Folgekapitel brauchen (Wortlaut aus echten Aktionen); optionale Sammelstücke (Polaroids, Heftseiten, Stundenbuch) bleiben absichtlich im Spiel auffindbar – sie sind Sammelaufgaben, keine Ereignisse.
* Kap. 6: Der Interaktions-Sweep (H6) und die Item-Kette brachen im Dauerprozess ab (siehe `item_ketten_lauf.md`).
