# Stimmen einsetzen: Schritt für Schritt (Stand 09.10.2026)

Ziel: Wenn die Erzeugung (`schnell.cmd`, danach `schnell_zayn.cmd`) fertig ist, ein Weg ohne Überraschungen. Alles unten ist **vorbereitet, nicht ausgeführt**.

## Wichtig vorab
- `schnell.cmd` und `schnell_zayn.cmd` rufen am Ende **selbst** `spiel\baue_spiel.py` auf. Danach liegen `game/assets/stimmen/*.opus` und `manifest.json` schon im Spiel, **ungeprüft** (nur Schwellen WER/MOS/Treue). Erst Bericht und Gehörtest, dann entscheiden: behalten oder Figuren stumm schalten (Schritt 5).
- `baue_spiel.py` löscht alle `.opus` im Zielordner, die nicht im neuen Manifest stehen, und schreibt das Manifest neu. Es kann beliebig oft laufen.
- Ohne Stimmen-Dateien (leeres/fehlendes Manifest, `z: {}`) läuft das Spiel mit Untertiteln wie bisher. Die getrackte Datei `game/assets/stimmen/manifest.json` vom 01.10. ist so ein leerer Platzhalter.

## 1. Bericht erzeugen (wartet automatisch)
```
C:\Users\GIGABYTE\HAM_Stimmen\fertig_einsetzen.cmd
```
- Wartet (alle 60 s, nur Lesen: Prozessliste, `_schnell.log`), bis weder `schnell.cmd`, `schnell_zayn.cmd`, `_warte_zayn.ps1` noch `schnell.py` laufen (max. 14 h, Exit 2 bei Zeitlimit).
- Führt `pruefe_ausgabe.py` aus (liest die `.opus` mit soundfile/libsndfile; Lesbarkeit mit einer Probedatei geprüft) und schreibt **`docs/gameplay/stimmen_bericht.md`**: Zeilen je Figur (fertig / durchgefallen / nicht erzeugt), Auffälligkeiten, Gehörtest-Stichprobe mit IDs aus den echten Ergebnissen.
- `--jetzt` = nicht warten (Zwischenstand). Es wird nichts ins Spiel kopiert.

## 2. Bericht lesen
- Fehlt die Marke „SCHNELL FERTIG“ oder „ZAYN FERTIG“, steht das oben im Bericht (Lauf abgebrochen: `_schnell.log` ansehen, `schnell.cmd` erneut starten ist sicher, fertige Zeilen werden übersprungen).
- Spalte „nicht erzeugt“ sollte 0 sein. Viele durchgefallene Zeilen einer Figur = Figur bleibt dort stumm (nur Untertitel).

## 3. Gehörtest (Nutzer, ca. 20 min)
Zeile abspielen: `game/assets/stimmen/<ID>.opus` (Windows-Player oder VLC). Die Stichprobe mit den tatsächlich bestandenen IDs steht im Bericht. Wunschkandidaten (nicht jede besteht; falls `.opus` fehlt, nimm die nächste aus dem Bericht):

**luke** (202 Zeilen)
- [ ] `albers_11b4000f6f` (ruhig) „Das ist Pfand, Herr Vegas.“
- [ ] `albers_27a112494b` (ruhig) „Dann machen Sie die Kette ab.“

**lucy** (83 Zeilen)
- [ ] `basis_1da19f37ee` (ruhig) „Frau Wendt steht nachts im Garten und starrt nach oben. Stundenlang.“
- [ ] `kapitel1_deb4e3ef00` (fluestern) „Luke? Luke, bist du das? Mach auf. Bitte.“
- [ ] `neben3_06bc09dcad` (emotional) „Hallo Onkel Peter! Luke, jetzt du! Laut!“

**justin** (178 Zeilen)
- [ ] `basis_0e826ee52a` (ruhig) „Ich hatte ihre Hand. Am Rand. Dann riss die Luft auf, und sie ließ los. So war e“
- [ ] `basis_4003d51cc4` (emotional) „Jetzt! Zu mir, Kind – zur Kreuzung! Sie kommen!“
- [ ] `justin_012d580d0d` (fluestern) „Wenn er still wird, ist sie nah. Bei Gewitter war das auch so.“

**vegas** (108 Zeilen)
- [ ] `albers_0565051802` (ruhig) „Aber du, Junge … bis zu dem Sommer hattest du blaue Augen. Ich kenn dich, seit d“
- [ ] `kapitel3_8c65b1de48` (emotional) „Und nicht durch meine Dahlien!“

**wolter** (91 Zeilen)
- [ ] `ausbau_nord_45b23fed42` (fluestern) „Für ein Kind reicht es. Er ist ja eins. Ein bisschen.“
- [ ] `basis_cf8dd732bd` (ruhig) „So funktioniert das nicht. Das Licht gibt nie genau zurück, was es nimmt.“
- [ ] `lwo_fdbc9753ab` (emotional) „Der Junge, der 2009 nicht zurückkam, hat nicht geschrien. Er hat Klar! gesagt. W“

**luna** (63 Zeilen)
- [ ] `ausbau_nord_59be17d0aa` (fluestern) „Er kommt. Ich hab ihn eingeladen.“
- [ ] `basis_0d577d250c` (ruhig) „Bruder. Du hast ihn mitgebracht.“

**nachsorge11** (59 Zeilen)
- [ ] `kapitel5_076e65d8e1` (ruhig) „Nicht vorlesen, Kollege. Er hört mit.“
- [ ] `lwo_0292532ca7` (ruhig) „Brandt. Ja. Das dachten wir uns.“

**nachsorge12** (39 Zeilen)
- [ ] `kapitel5_b1ba02fdf2` (ruhig) „Brandt steht vor Nummer drei. Der Vogel hat den Speck. Brandt sieht jetzt zur Tü“
- [ ] `lwo_1279f2e307` (ruhig) „Dienstag. Kassler, vier achtzig.“

**luke_echt** (50 Zeilen)
- [ ] `kapitel5_009996e145` (emotional) „Nicht! Wer sich verschenkt, gehört ihr ganz.“
- [ ] `kapitel5_0a49309979` (ruhig) „Du hast ihr was weggenommen. Jetzt nimmt sie dir was weg.“

**funk_blechmann** (41 Zeilen)
- [ ] `amt_162ed6ba64` (ruhig) „Bergung zwei an Nachsorge. K-1 nicht im Käfig.“
- [ ] `amt_3b5ef25c3a` (ruhig) „Verstanden. Das ist bedauerlich.“

**mira** (19 Zeilen)
- [ ] `anwesen_8843a4f0ea` (fluestern) „Noch nicht, Luke. Aber bald.“
- [ ] `traum_0abb2527c8` (ruhig) „Deine Schwester ist nicht verschwunden. Sie hat sich versteckt. Vor etwas, das s“

**peter** (3 Zeilen)
- [ ] `feuer_47f9e15d2c` (fluestern) „… raus …“
- [ ] `feuer_5205467654` (fluestern) „… Lu… ke …“

**zayn** (3 Zeilen)
- [ ] `zayn_0d2e4e4b06` (ruhig) „Deshalb hab ich gewartet.“
- [ ] `zayn_6056de0274` (ruhig) „Ihr habt gesagt, ihr holt mich.“

**aydin** (13 Zeilen)
- [ ] `ausbau_ost_west_4c61702ba1` (ruhig) „Sag nicht wie geht’s. Sag, was du siehst. Sie kann nicht sehen, aber sie will wi“
- [ ] `ausbau_ost_west_6813889ce4` (emotional) „Luke! Lucys Luke! Komm her, du bist dünn.“

**heidi** (8 Zeilen)
- [ ] `neben5_1fa457c34c` (ruhig) „Ich komm nicht rüber, Luke. Noch nicht. Die Karte am Grab hab ich hingelegt, dam“
- [ ] `neben5_b39b0cf091` (emotional) „Ein Junge hat Klar! gesagt, als das blasse Mädchen mitspielen wollte. Das warst “

**jonas** (2 Zeilen)
- [ ] `neben3_b76628dfac` (ruhig) „Du musst nicht rangehen. Ich ruf trotzdem an.“
- [ ] `neben3_d719b941ff` (ruhig) „Mama. Ich bin’s. Sonntag, wie immer.“

**seiler** (2 Zeilen)
- [ ] `basis_a818f6be34` (ruhig) „Lassen Sie ihn. Der tut keinem was. Der hat den Jungen gebracht.“
- [ ] `villa_77cbdf4fb5` (ruhig) „Heinrich. Mach oben das Licht an. Für den, der kommt.“

**pell** (7 Zeilen)
- [ ] `hungrige_8c37a1de57` (fluestern) „Every bite. It gets hungrier with every bite.“
- [ ] `neben6_1bb7f56792` (ruhig) „October. Ich bin am Kreis. Lamp up. Come home, W.“

**hilde** (24 Zeilen)
- [ ] `basis_5677ed3056` (ruhig) „So lange hab ich auf meinen Zayn gewartet. Jetzt bin ich bei ihm. Nur anders, al“
- [ ] `kino_6180f2c7af` (emotional) „In den Keller! Unter der Erde sieht sie dich nicht!“

**gisela** (32 Zeilen)
- [ ] `kapitel5_02bc1dc78c` (ruhig) „Das ist Hänschens. Das H. R. hab ich reingeritzt. Mit der Nagelschere. Wo hast d“
- [ ] `kapitel5_0c5264351d` (ruhig) „Nimm ihn mit. Der sieht, was du nicht siehst.“

**guenther** (20 Zeilen)
- [ ] `neben4_5ada07febf` (ruhig) „Hilde hat mir alles gezeigt. Komm am Samstag und bring die Wolle mit.“
- [ ] `post_0632912639` (emotional) „Ich hab nichts gesehen! Ich hab nie was gesehen!“

**dina** (16 Zeilen)
- [ ] `ausbau_ost_west_0e1d177225` (ruhig) „Ich hab die Transporter gesehen. Acht Sitze. Ich zähl nicht gern. Ich hab trotzd“
- [ ] `ausbau_ost_west_67e1d02f20` (ruhig) „Die Kreise sind von unten.“

**mama** (5 Zeilen)
- [ ] `basis_d1f8b24084` (ruhig) „Egal. Ist egal, mein Schatz. Du bist da.“
- [ ] `basis_fab4048cb1` (ruhig) „Wie heißt unser Hund, Luke?“

**radio** (5 Zeilen)
- [ ] `ausbau_ost_west_3f745068fd` (ruhig) „…einunddreißig Komma eins null… wer das hört: nicht über die Sperre…“
- [ ] `basis_5bd72b04e5` (ruhig) „…nicht nach Hause… Luke… nicht nach Hau–“

**lautsprecher** (8 Zeilen)
- [ ] `basis_3f12ce5539` (ruhig) „Reaktion auf Reiz: hoch. Abweichung von 2009.“
- [ ] `basis_91525a2b9f` (ruhig) „Notstrom aktiv. Außenstelle Lost Eyengless.“

**kuehn** (5 Zeilen)
- [ ] `lwo_180f900f54` (ruhig) „Und Frau Brandt. Machen Sie die Laterne aus. Die vor Ihrem Haus. Ich weiß, das k“
- [ ] `traum_4e582815ea` (ruhig) „Herr Brandt? Kühn hier, Polizei, ne. Wegen Ihrer Schwester. Die ist seit dem 23.“

**anni** (8 Zeilen)
- [ ] `kapitel6_6c6fb92a5f` (fluestern) „Papa? … Papa, ich bin gleich wieder da.“
- [ ] `kapitel6_b408a36e85` (fluestern) „Du hast unterschrieben. Ist schon gut. Ich hab den Lampion gemocht.“

**hofer** (6 Zeilen)
- [ ] `hungrige_884ba9b10e` (fluestern) „Wir haben alle Hunger, Junge.“
- [ ] `hungrige_94862a1c4a` (fluestern) „… Bergung drei … ich hab Hunger, Junge …“

Worauf achten: richtige Figur (Alter/Geschlecht), Wörter verständlich, Betonung passt zur Stimmung (flüstern/emotional), Ende nicht abgeschnitten, kein Knacken/Rauschen, Namen/Zahlen richtig gesprochen (siehe `stimmen_aussprache.md`), Lautstärke zwischen Figuren ähnlich (−16 LUFS). Funk-Figuren (Blechmann, Lautsprecher, Radio, Kühn, Jonas) klingen im Spiel zusätzlich durch den Funkfilter; die Rohdatei ist sauberer.

## 4. Einsetzen / Build
```
cd C:\Users\GIGABYTE\HighAbyssMira-Repo\app
node tools/test_stimmen.js        (Spielseite gegen künstliches Manifest, ohne Spielinstanz)
node tools/assemble.js            (nur nötig, wenn stimmen.js geändert wurde)
npm run build                     (assemble + KTX + Kopie nach app/game; .opus werden mitkopiert, KTX ignoriert sie)
npm run selftest                  (nur wenn kein anderer Test läuft)
```
- Größe: Opus 24–32 kbps, ca. 1,5 h Gesamtlänge = ca. 20–35 MB, Grenze 150 MB (`release_check` prüft).
- Veröffentlichung: `npm run release`. `tools/release_check.mjs` prüft jetzt zusätzlich: Ordner `assets/stimmen` ist optional; wenn vorhanden: gültiges Manifest, jede Datei da und Ogg, keine verwaisten `.opus`, alle Verweise (`t`, `k`) gültig, Dauer plausibel, Summe <= 150 MB. `build.js` kopiert den Ordner mit `assets/`; `release_auslassen.js` lässt ihn drin; die electron-packager-Ignore-Liste trifft nur `dist|mods|…|tools` im App-Stammordner, nicht `game/`.
- Git: die `.opus` sind getrackt wie andere Assets (`git add game/assets/stimmen`), **kein Push ohne Freigabe**.

## 5. Figur oder Zeile stumm schalten (ohne neu zu erzeugen)
```
cd C:\Users\GIGABYTE\HAM_Stimmen
fertig_einsetzen.cmd --jetzt --einsetzen --ohne peter,zayn
```
Führt `baue_spiel.py` aus und nimmt danach die genannten Figuren (und immer die Zeilen mit Klammer-Regie wie „(summt)“) aus Manifest und Ordner. Einzelne Zeile: ID aus `z`, `t`, `k` in `game/assets/stimmen/manifest.json` entfernen und die `.opus` löschen (dann beim nächsten `baue_spiel.py` wieder drin, wenn sie `ok` ist).
Komplett ohne Stimmen: Ordnerinhalt entfernen und `manifest.json` auf `{"v":1,"wer":{},"z":{},"t":{},"k":{}}` setzen. Im Spiel: Einstellungen → Sprachausgabe aus.

## 6. Verhalten der Spielseite (geprüft, Test `app/tools/test_stimmen.js`)
- Zuordnung: Normtext (ohne Tags/Anführungszeichen) → Manifest `t`; Sprecher über `wer`; unbekannter oder nicht besetzter Sprecher (z. B. Zayn ohne Aufnahme) = stumm, kein Fehler. Hook-Schlüssel (`k`) für Traum, Wendigo, Pell-Band, Whiskey, Mira-Summen.
- Untertitel bleiben mindestens Stimmdauer + 0,35 s; `say()` wartet auf die Stimme, aber nur wenn die Datei wirklich geladen werden konnte. Klick/Enter: Stimme blendet in 0,15 s aus, nächste Zeile sofort; X: ganzer Block.
- Laden: Manifest beim Start, Dateien erst beim Abspielen (und die Zeilen des nächsten `say()`-Blocks). Höchstens 40 dekodierte Zeilen im Speicher (ca. 25–50 MB Audiospeicher außerhalb des JS-Heaps), ältere werden verworfen und bei Bedarf neu geladen.
- Mix: Stimme über dem Welt-Bus, Untertitel sichtbar = Betten −4 dB, Musik weicht (klang.js). Peter-Effekt ist in der Datei gebacken (`schnell.py`).
