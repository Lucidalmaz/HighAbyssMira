# Übergabe Stand 09.10.2026 abends (für ein neues Claude-Fenster)

Zweig: `claude/wonderful-wozniak-twn7nr`. Testversion zum Spielen: `C:\Users\GIGABYTE\Spiele\High Abyss Mira - Testversion Kap 1-6` (Desktop-Verknüpfung „High Abyss Mira (Testversion)“; alter Stand unter „… (vorher)“). Release neu bauen + kopieren: `C:\Users\GIGABYTE\release_und_kopieren.cmd` (per `cmd.exe /c` mit vollem Pfad; Parameter `trocken` = nur anzeigen). Entwicklungsstart: `SPIELEN.bat`.

Regeln des Nutzers (verbindlich): immer auf Deutsch antworten; nur kostenlose Assets (Preis 0, kommerziell nutzbar, Credits in CREDITS.md) oder Blender-Eigenbau nach realistischer Vorlage (hochaufgelöst, detailreich); keine generierten Canvas-Schriften/Aufkleber/Props; alles extrem hochwertig und vor allem realistisch (keine verdrehten Glieder/Hände/Gesichter, organische Bewegung); keine Wände/Türen zum Durchlaufen; nur das Beauftragte tun, keine Doppelarbeit, kein Kontingent verschwenden; nichts als erledigt melden, was nicht im Bild gesehen wurde; Push/Desktop-Kopie nur mit Freigabe (für den 09.10. erteilt, Push wurde vom System blockiert → Nutzer führt `git push origin claude/wonderful-wozniak-twn7nr` selbst aus). Nur EINE Spielinstanz gleichzeitig (Grafikspeicher 8 GB, Spiel belegt ~7 GB): `_live.sh status|start|run|reload|stop`.

Für morgen angesetzt (Nutzerentscheidung): Stimmen einbauen (Pipeline `C:\Users\GIGABYTE\HAM_Stimmen`, `schnell.cmd`, dann `schnell_zayn.cmd`, `fertig_einsetzen.cmd`; Doku `stimmen_einsetzen.md`, `stimmen_aussprache.md`; läuft ungestört 7–9 h, wurde am 09.10. 13:10 gestoppt, Roh-Dateien in `spiel\ausgabe\_arbeit`) und Unreal-Umbau (Vorbereitung in `docs/unreal/`, Export `app/tools/ue_export/export.js`; offene Entscheidungen: Kinderfiguren ohne MetaHuman, Mira laut kanon.md 7-jähriges Mädchen vs. Stimmenentwurf „Frau von 1312“, TTS vs. Sprecher).

## Noch offen (außer Stimmen, Unreal, 60 FPS)
Performance: 37–47 FPS, Ladezeit ~2,5 min bis „Fertig“, kalter Start 200–270 s (Hebel: kleinere Standard-Shader, Lazy-Pakete Kap. 4–6, FBX→GLB, Material-Dedup).

**A Figuren/Tiere (zuerst):** Graukind-Gruppe (Glühbogen, gepunktete Haarkarten; Bild `C:\Users\GIGABYTE\_abn12_fig3_out\g_graukind_0.png`, per Live-Tuning in `figuren.js` beheben), Hilde (Augen offen, Haar mit Volumen, Haut nicht puppenglatt, Schirmglanz), Mädchengestalt (Mantelglanz), Lucy erwachsen (Cyan-Rand an Hand), „nackte“ Tiere Wolf/Reh (roter Fleck: `V.g.__auf.a` prüfen, wohl Einblendung), und Nahaufnahmen/Defektcheck von Mike, Roxy, Mama, Papa, Jonas, Justin, Gisela, Dina, Zayn, Zombie, Katzen, Raben/Whiskey, Spinnen, Welpe, Hirsch, „Das Ding“.

**B Gebaut, im Spiel nie gesehen:** neue Limousine/Kleinwagen (`car_neu`, strasse.js/lwo.js), Transporter `van_neu`, Kühlschränke (Nr. 7, Giselas Haus), Prüfraum-Schild, Hufeisen/Fisch/Warnschild/Strichwand/Kioskband, Archiv-Aktenschränke (moebel.js), Rabenflügel (Gleitflug im Spiellicht), Graukind-Toast, Raum-3-Klickflächen, Hauptsicherungs-Hinweis im frischen Spiel (leeres Inventar), Spinnen-QTE (6 Tasten/s), Leitergeschwindigkeit, Kontaktbögen schwebend/verdreht, Fahrzeugliste mit Maßen.

**C Wände/Türen/Erreichbarkeit:** Gegenlaufen+Sprung-Spam an Kellertür, Archiv, Sicherungsraum-Durchgang (0,6–0,9 m), Villa-Anrichte Ost (-881.4/898.5 „DURCH“), Stuhl 8 (Klebeband-Klickfläche hinter Stuhl-Netz), Auto bei Aydın (durchgedrückt), Würfel hinter Schlüsselloch-Tür Nr. 4 (besteigbar), Kapelle-Sakristei und Pfarrhaus (Engstellen), Villa-Tür und Kirchberg-Räume von außen, Sprung-Spam nicht flächendeckend.

**D Rätsel/Abläufe ungeprüft:** Laternen mit Schnelldruck (falsche Hebel), Glocken-Joker, Kapelle/Predigtmappe, Dinas Papier, Zayns Kamera, „Aus aller Welt“, Treppe/Galerie Villa, Laden+Kapitelwahl Kap. 3–4 (Brechstange), Bus-Falle (Fairness), Tappen-Weg, Jonas' Lager, Durchlauf hinter dem Gitter (Kap. 6; k6_1-Hänger war nur fehlender Dialog-Autopilot, kein Softlock).

**E Optik:** Nimmerheim Raum 2 zu leer, Prägepresse grob, Schemen Raum 3 mit sichtbarem Vieleck-Rand, Funkkasten-Amtsschild (Canvas, nur ausgeblendet), Kunstpunkte M-9 Straßenbäume/Props, M-10 Buntglas, M-11 Villa, M-12 Schrebergärten, Canvas-Reste (Leuchtschild Tankstelle, Silhouetten-/Gesichts-Planes, Bremsspur, Telefonzettel), Kinderzeichnungen aus Wachsmalstift, Stempel-/Öl-Decals, Amt-Bumpmap wirkt wie Wasserkräuselung, Wrack mit rechteckigem Leuchtfeld, Katzen-Grundnetz, Limousinen (5 Stück) im Spiel prüfen, Download-Kandidaten in `download_kandidaten.md`.

**F Tempo:** lange Gedanken-Dialoge (bis 25 s), Whiskey-Epilog ~150 s, Tank-Finale ~60 s: Überspringbarkeit prüfen.

**G Story-Entscheidungen des Nutzers:** Nord-Grab-Echo zeigt Mädchen im weißen Kleid als `luke_echt` (Junge), laut Text graues Kind; Mira-Echo steht, Untertitel angepasst („steht still davor“).

## Wichtige Arbeitsdateien
Berichte: `docs/gameplay/qa_raetsel_k12.md`, `qa_raetsel_k34.md`, `qa_raetsel_k56.md`, `qa_items.md`, `sprite_audit.md`, `qa_art_befund.md`, `abnahme_k56_zwischenstand.md`, `OFFEN.md`. Prüfwerkzeuge außerhalb des Repos: `C:\Users\GIGABYTE\_qa_kol\` (Kollision/Türen), `_abn12\`, `_abn56\`, `_gt\`, `_t\`, `_visual\`, `_lz\`. Blender-Werkdaten: `C:\Users\GIGABYTE\HAM_Blender\`, Skripte `app/tools/blender/`. Fab-Downloads: `C:\Users\GIGABYTE\HAM_FabDownloads\`.
