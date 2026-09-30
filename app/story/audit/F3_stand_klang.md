# Stand Klang (Ton-Überarbeitung, 01.10.2026)

## Was es gibt
- `game/audio/*.ogg` (Opus, 112 Dateien, 19 MB) wird **bei Bedarf** per `fetch` geladen, nichts steckt im HTML. `app/build.js` kopiert den Ordner mit.
  Diese Dateien bitte committen: die Quellen liegen außerhalb des Repos (`C:\Users\GIGABYTE\HAM_Audio`).
- Bau: `python app/tools/klang_bau.py [musik|schleifen|bank]`, `python app/tools/klang_bau2.py [betten|einzel]`, danach `python app/tools/klang_pegel.py` (gleicht die Lautheit je Gruppe an).
  Die Ausschnitte aus den Sonniss-Bündeln holt `HAM_Audio/quellen.py` per HTTP-Range (nur die gebrauchten Sekunden). Hilfen: `klang_lib.py` (nur numpy/soundfile, weil scipy gesperrt ist).
- Schleifen tragen je 0,25 s Rand; `klang_load` schneidet ihn ab, sonst klickt die Opus-Naht.

## Module
- **klang.js**: `klang_load(name)`. `KL_ORT_BETT` enthält die Klangbetten je Ort (ort, friedhof, villa, wald, innen, nr7, keller, amt, kanal, weiss), weich überblendet über `bedBus → hushG`.
  Bei Sprache oder Untertitel werden die Betten um −4 dB gesenkt und die Musik weicht.
  Die Musik `KL_MUSIK` besteht aus vorab gerenderten Stücken aus VSCO-Samples. Die Instrumentenbank `kb_*` spielt `KI.piano/box/bow/pad/choir/pluck/bell/glass/flute/drone` mit echten Samples; die Synthese bleibt nur als Rückfall.
- Die Audio-API behält ihre Namen, dahinter liegen jetzt Aufnahmen: `stinger`, `scareSound`, `screech`, `whisper`, `musicBox`, `pianoNote`, `drip`, `thump`, `bark`, `deerBark`, `twig`, `gutter`, `tape`, `radio`, `ring` (unter 0,03 das Freizeichen mit 425 Hz), `chime` (`'quest'` = Bleistift, sonst der Moment `cue_fund`), `bell`, `tankHum`, `chaseMusic`/`chaseLevel`, `hum`.
  `owl`, `owlPair`, `fox` und `trainHorn` sind stumm. Die Synth-Phrasen `phrase*` geben `null` zurück, dann herrscht Stille.
  Neu sind `Audio.cue('fund'|'verlust'|'ende')` für musikalische Momente (höchstens alle 25 s) und `Audio.glocke(x, y, z, f, gain, ref, damp)` für eine aufgenommene Glocke.
- **Basis**: `MUSIC` hat längere Pausen (calm 120–260 s, erste Pause 70–140 s). `AUDIO_MIX` setzt den Stinger-Abstand auf 20 s und den Flüster-Abstand auf 10 s. `questPop` ruft `chime('quest')`.
  Der Fernseher rauscht bandbegrenzt und −6 dB leiser, der Tiefbass des Donners ist halbiert. Den Kellerton `weird1` gibt es nur noch ohne Klangbetten.
- **spannung.js**: `SP_AMB` erlaubt weniger Einzelereignisse, weil die Betten die Kulisse tragen.
- Aufnahmen statt Sinus: `leben.js` (Ratte, Fledermaus stumm, Kapellenglocke), `beobachter.js` (das Zwitschern ist jetzt ein Sohlenquietschen), `neben3.js`/`ausbau_nord.js` (Glocke),
  `kapitel5.js`/`lucy3.js` (Spieluhr-Zinken), `kino.js` (`kino_sub`/`kino_schlag`).

## Kurz geprüft (ein Lauf, Aufnahme am Master)
- Straße Kap. 1: Das Bett liegt bei etwa −34 dB RMS. Ein naher Donner erreicht −0,7 dBFS Spitze (Tiefbass danach halbiert).
- Nr. 7 innen: −25,6 LUFS, dominiert vom Fernsehrauschen; das ist jetzt bandbegrenzt und leiser.
- Amt mit Jagd und großem Stinger: −18 LUFS, Spitze −1,2 dBFS, nichts übersteuert. Alle Dateien werden geladen.

## Offen
- Noch synthetisch sind: `kino.js` (Vögel, Taube, Mikrowellen-„Pling“, Brummen), `feuer.js` (eigene Blech-/Sägezahn-Musik, Brandalarm), `kiffen.js` (Tinnitus 4,15 kHz), `tod.js` (Tinnitus 3,95 kHz, Stöhnen),
  Summ-Stimmen (`amt_summen`, `k5_summen`, `neben3_summen`), `whiskey_ton` sowie die Piepser in `neben3` (Pager, Wecker, Hörgerät). Das Summen wartet auf die Sprachaufnahmen (`stimmen_spielen`).
- Pegel der Betten und Musik nach Gehör feinjustieren: `KL_ORT_BETT` und die Lautstärken in `KL_MUSIK`.
