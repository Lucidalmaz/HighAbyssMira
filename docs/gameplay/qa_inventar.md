# QA-Inventar: Interaktionen, Erreichbarkeit, Sammel-Quellen

_Erzeugt von `app/tools/qa_inventar.js` am 2026-10-09 00:10 (nur statisch; Laufzeitteil fehlt noch – Lite-Lauf mit `C:/Users/GIGABYTE/_qa/qa_steps.json`)._

Strahltest (Laufzeit): 12 Sektoren à 30° um das Objekt, je Sektor der begehbare Rasterpunkt (0,3 m) am nächsten an 1,4 m, Abstand 0,6–2,4 m zur Grundfläche;
Körper frei (`tod_blockiert`, r 0,3), Boden aus Innenraum/Kisten/BVH. Auge 1,65 m (stehend) und 1,03 m (hockend); Strahl wie im Spiel (2,7 m, nur `interactables` + `occluders`).
Gültig = erster Treffer ist das Objekt. „Sicht durch Netz verdeckt“ = ein festes Modell (BVH) liegt davor, der Klick geht aber durch (Spiellogik prüft keine Modelle).


## Statische Fundstellen: Klickflächen (500)

Wrapper: `interact` (Basis), `kirchberg_hit`/`villa_hit`/`kf_hit`/`amt_hit`/`spot` (verborgene Klickkiste), `neben3_ort` (nur aktiv, solange `wann()` wahr), Türen (`makeDoor`/`steelDoor`/`amt_tuer`), `anwesen_wrap`, `ausruestung_spot`, `tausch_glint`, `katzen_klick`, `n5_huelle` (Bedingung `wenn`).

| Datei:Zeile | Funktion | Art | Label | x / y / z (Argumente) | Bedingung (wann) | Aktion |
|---|---|---|---|---|---|---|
| _base_source_index.html:1396 | pickLine | interact | Klopfen |  /  /  |  | () => { Audio.knock(di.position.x, 1.3, di.position.z); toast(pickLine()); } |
| _base_source_index.html:1446 | makeDoor | makeDoor |  | 23 /  / s7.zf + .1 |  |  |
| _base_source_index.html:1518 | cy | makeDoor |  | -47 /  / s1.zf + .1 |  |  |
| _base_source_index.html:1918 | car | interact | Autotür |  /  /  |  | () => { tween(c.userData.door, { ry: .05 }, .07, () => tween(c.userData.door, { ry: 0 }, .12)); Aud… |
| _base_source_index.html:1919 | car | interact | () => lenaCar.userData.open ? 'Autotür schließen' : 'Autotü… |  /  /  |  | () => { const o = !lenaCar.userData.open; lenaCar.userData.open = o; tween(lenaCar.userData.door, {… |
| _base_source_index.html:2667 | chalkArrow | interact | Foto aufheben |  /  /  |  | () => { if (p.car && !lenaCar.userData.open) return toast('Es liegt hinter der Scheibe. Die Tür ist… |
| _base_source_index.html:2725 | photoWayUpdate | interact | Briefkasten öffnen |  /  /  |  | () => { if (state.hasKey) return toast('Leer. Nur ein toter Falter.'); state.hasKey = true; door7.l… |
| _base_source_index.html:2752 | doorAction | interact | () => door7.open ? 'Tür schließen' : 'Tür öffnen' |  /  /  |  | doorAction(door7, 'Abgeschlossen. Lucy hat den Schlüssel sicher irgendwo versteckt. Irgendwo in der… |
| _base_source_index.html:2753 | doorAction | interact | Zeitung lesen |  /  /  |  | () => { state.readPaper = true; liftTo(newspaper, () => openNote('Der Laternenbote · 29. Oktober', … |
| _base_source_index.html:2755 | doorAction | interact | Zettel lesen |  /  /  |  | () => { state.readFridge = true; setMain(3); openNote('Zettel am Kühlschrank', '<span class="hand">… |
| _base_source_index.html:2757 | doorAction | interact | Kalender ansehen |  /  /  |  | () => { if (!state.readCal) Audio.stinger(false); state.readCal = true; openNote('Kalender · Oktobe… |
| _base_source_index.html:2759 | doorAction | interact | Kellertür |  /  /  |  | () => toast('Eine schwere Tür. Frische Kratzspuren. Von innen.') |
| _base_source_index.html:2760 | doorAction | interact | Tastenfeld benutzen |  /  /  |  | () => { setMain(3); if (state.cellarOpen) return enterBasement(); kpValue = ''; kpRender(); openOve… |
| _base_source_index.html:2762 | doorAction | interact | Fernseher |  /  /  |  | () => toast(state.tvSeen ? 'Nur Rauschen. Jetzt.' : 'Rauschen. Du könntest schwören, darin bewegt s… |
| _base_source_index.html:2763 | doorAction | interact | Kassette abspielen |  /  /  |  | async () => { if (state.talking) return; state.talking = true; Audio.tape(true); state.tapeOn = tru… |
| _base_source_index.html:2773 | doorAction | interact | Zeichnungen ansehen |  /  /  |  | () => toast('Kinderzeichnungen. Immer dasselbe Motiv. Manche sind mit deinem Namen signiert.', 4500) |
| _base_source_index.html:2775 | doorAction | interact | Nach oben gehen |  /  /  |  | () => { if (!state.heardTape) return toast('Noch nicht. Lucy wollte, dass du hier etwas findest.');… |
| _base_source_index.html:2778 | doorAction | interact | () => door1.open ? 'Tür schließen' : 'Tür öffnen' |  /  /  |  | () => { if (!state.home1) { state.home1 = true; sideStart('home'); toast('Der Schlüssel liegt noch … |
| _base_source_index.html:2782 | doorAction | interact | Familienfoto |  /  /  |  | () => openNote('Familienfoto', 'Mama, Lucy, du. Und ein viertes Gesicht, jemand hat es mit einer Na… |
| _base_source_index.html:2783 | doorAction | interact | Fotoalbum |  /  /  |  | () => liftTo(album, () => openNote('Fotoalbum · Sommerfest 2009', 'Ein Gruppenfoto. Kinder vor der … |
| _base_source_index.html:2784 | doorAction | interact | Spieluhr |  /  /  |  | () => { tween(mbLidPiv, { rx: -1.4 }, .5, () => { Audio.musicBox(musicBox.position.x, musicBox.posi… |
| _base_source_index.html:2785 |  | interact | Lose Diele untersuchen |  /  /  |  | () => { state.diary = true; uninteract(loose); tween(loose, { pos: loose.position.clone().setY(loos… |
| _base_source_index.html:2795 | pendingClose2 | interact | Schublade öffnen |  /  /  |  | openDrawer |
| _base_source_index.html:2795 | pendingClose2 | interact | Schublade öffnen |  /  /  |  | openDrawer |
| _base_source_index.html:2796 | pendingClose2 | interact | () => state.wOpen ? 'Schrank schließen' : 'Schrank öffnen' |  /  /  |  | () => { state.wOpen = !state.wOpen; tween(wPiv, { ry: state.wOpen ? 1.5 : 0 }, .6); Audio.creak(sta… |
| _base_source_index.html:2800 | checkHome | interact | Klopfen |  /  /  |  | async () => { if (state.talking) return; state.talking = true; Audio.knock(doorOf[3].position.x, 1.… |
| _base_source_index.html:2819 | checkHome | interact | Halsband aufheben |  /  /  |  | () => { state.hasCollar = true; Audio.chime(); addItem('collar'); liftTo(collar.parent, () => { if … |
| _base_source_index.html:2827 | checkHome | interact | Lucys Handy |  /  /  |  | () => { if (!lenaCar.userData.open) return toast('Die Tür ist zu. Nicht abgeschlossen – nur zu.'); … |
| _base_source_index.html:2834 | handset | interact | Hörer abnehmen |  /  /  |  | async () => { if (state.talking) return; if (!state.ringing) { state.talking = true; handset(true);… |
| _base_source_index.html:3726 | gardenGate | interact | () => G_.open ? 'Gartentor schließen' : 'Gartentor öffnen' |  /  /  |  | () => toggleGate(G_) |
| _base_source_index.html:3755 | steelDoor | interact | () => D.locked ? label + ' (verriegelt)' : D.open ? label :… |  /  /  |  | () => { if (D.locked) { Audio.thump(x, 1.2, z); toast(D.lockedText \|\| 'Verriegelt. Ohne Strom rührt… |
| _base_source_index.html:3788 | steelDoor | interact | () => 'Akte ' + f.userData.name |  /  /  |  | () => { ch2.read = ch2.read \|\| new Set(); ch2.read.add(f.userData.name); liftTo(f, () => openNote('… |
| _base_source_index.html:3797 | drawBoard | interact | Ordnungstafel |  /  /  |  | () => { if (ch2.archiveSolved) return toast('Sieben Namen in der richtigen Reihenfolge. Der Schrank… |
| _base_source_index.html:3802 | drawBoard | interact | Schublade |  /  /  |  | () => openNote('Vermessungsprotokoll · Sommer 2009', 'Acht Stühle. Acht Gurte. Acht Protokolle.\n\n… |
| _base_source_index.html:3817 | drawBoard | makeDoor |  | X + 33 /  / Z + 2.1 |  |  |
| _base_source_index.html:3818 | drawBoard | interact | () => fuseDoor.open ? 'Tür schließen' : 'Sicherungsraum' |  /  /  |  | () => { if (fuseDoor.locked) { if (ch2.fuseKey) { fuseDoor.locked = false; Audio.beep(true); toast(… |
| _base_source_index.html:3827 | fuseLedUpdate | interact | Sicherungskasten |  /  /  |  | () => { if (ch2.coverOpen) return fuseOpenPanel(); ch2.coverOpen = true; tween(fuseCoverPiv, { ry: … |
| _base_source_index.html:3848 | fuseOpenPanel | interact | Sicherungskasten |  /  /  |  | () => fuseCover.userData.action() |
| _base_source_index.html:3861 | powerOn | steelDoor | Stahltür | X + 36 /  / Z |  |  |
| _base_source_index.html:3862 | powerOn | steelDoor | Stahltür | X + 46 /  / Z |  |  |
| _base_source_index.html:3931 | obst | interact | () => gate.userData.open ? 'Gitter' : 'Gitter aufschieben (… |  /  /  |  | () => {} |
| _base_source_index.html:3932 | obst | steelDoor | Stahltür | X + 106 /  / Z |  |  |
| _base_source_index.html:4003 | caught | interact | Notenblatt |  /  /  |  | () => openNote('Notenblatt', '„Sieben Kinder, weiß wie Schnee – <b>E D</b> ? ? ?“\n\nDarunter Bleis… |
| _base_source_index.html:4005 | caught | interact | Klavier spielen |  /  /  |  | () => { if (ch2.safeOpen) return toast('Die Tasten sind stumm geworden.'); openPuzzle(`<h3>KLAVIER<… |
| _base_source_index.html:4017 | safeOpens | interact | Akte 08 |  /  /  |  | () => openNote('AKTE 08 · [kein Name] · R-Fall', 'Rückführung: <b>Mittwoch, in der Nacht</b>, Überg… |
| _base_source_index.html:4201 | jDist | interact | Anschlagtafel lesen |  /  /  |  | () => liftTo(chronik, () => openNote('Aus der Chronik von Lost Eyengless', '<i>Abschrift von 1891, … |
| _base_source_index.html:4207 | jDist | interact | Funkkasten benutzen |  /  /  |  | () => radioPuzzle() |
| _base_source_index.html:4235 | broadcast | interact | () => `Schaltkasten vor Nr. ${n}` |  /  /  |  | () => pressSwitch(S) |
| _base_source_index.html:4348 | jHint | interact | () => ch3.part === 'town' ? 'Mit Justin sprechen' : 'Justin' |  /  /  |  | () => jHint() |
| _base_source_index.html:4385 | whiteDoor | interact | () => it.name |  /  /  |  | () => { it.seen = true; openNote(it.name, it.text); } |
| _base_source_index.html:4387 | whiteDoor | interact | Die Frage an der Tür |  /  /  |  | () => { if (ch3.room1) return toast('Die Tür steht offen.'); openPuzzle(`<h3>WAS GEHÖRT NICHT IN DI… |
| _base_source_index.html:4418 | hand | interact | Küchenuhr |  /  /  |  | () => clockPuzzle() |
| _base_source_index.html:4609 | cowUpdate | interact | Kuh untersuchen |  /  /  |  | () => { if (state.talking) return; state.talking = true; say([['Das Fell ist warm. Viel zu warm. Un… |
| _base_source_index.html:4614 | cowUpdate | interact | () => ch3.on && ch3.part === 'town' && ch3.met ? 'Gullydeck… |  /  /  |  | () => { if (!ch3.on \|\| !ch3.met \|\| ch3.part !== 'town') return toast('Ein schwerer Gullydeckel. Dar… |
| _base_source_index.html:4640 | chapter3Begin | interact | Brief lesen |  /  /  |  | readLetter2 |
| _base_source_index.html:4640 | chapter3Begin | interact | Zählbuch lesen |  /  /  |  | readBook |
| _base_source_index.html:4640 | chapter3Begin | interact | Umschlag nehmen |  /  /  |  | readAlbers |
| _base_source_index.html:4641 | chapter3Begin | interact | Hörer abnehmen |  /  /  |  | c3Phone |
| _base_source_index.html:4902 | addEcho | interact | () => echoSeen.has(E.id) ? '' : 'Berühren' |  /  /  |  | () => playEcho(E) |
| _base_source_index.html:5026 | key | interact | Leiter nach oben |  /  /  |  | () => leaveCanal() |
| akte.js:38 | AKTE_KOPF | interact | () => akte_has(n) ? `Durchschlag ${n} / 10` : 'Ein Umschlag… |  /  /  |  | () => akte_lesen(n) |
| albers.js:74 | albers_talk | interact | () => ALBERS_TALKS.some(T => !albers_S.talked.has(T.claim) … |  /  /  |  | () => albers_talk() |
| albers.js:190 | albers_k3Init | kirchberg_hit | Umschlag im Briefkasten | MB[0] / 1.15 / MB[1] + .05 |  | () => albers_k3Umschlag() |
| albers.js:193 | albers_k3Init | kirchberg_hit | () => albers_K3.st.gelesen && story.items.includes('kaugumm… | bx / .8 / bz |  | () => albers_k3Bank() |
| album.js:578 | album_weltBau | interact | Fotoalbum |  /  /  |  | () => album_nehmen() |
| amt.js:69 | amt_hit | interact | label |  /  /  |  | fn |
| amt.js:467 | amt_tuer | amt_hit |  | x / 1.05 / z |  |  |
| amt.js:528 | amt_bauTunnel | amt_hit | Schild | tunnelSign.positi… / 1.8 / tunnelSign.positi… |  | () => toast('„Bundesstelle für Rückführung · Außenstelle Lost Eyengless · Ebene −2“. Unten rechts, … |
| amt.js:534 | amt_bauTunnel | amt_hit | Dienstanweisung | X0 + 13.6 / 1.3 / zN - .1 |  | () => amt_note('Dienstanweisung', '<b>SEHEN · BERGEN · SCHWEIGEN.</b>\n\nWer sieht, meldet.\nWer bi… |
| amt.js:561 | mkUhr | amt_hit | () => amt_S.nr ? 'Nummernautomat' : 'Eine Nummer ziehen' | nx / 1.2 / nz + .1 |  | () => amt_nummer() |
| amt.js:562 | mkUhr | amt_hit | Kratzer | nx + .42 / .72 / nz + .08 |  | () => toast('Drei parallele Kratzer im Putz. In Kinderhöhe. Frisch.', 3000) |
| amt.js:568 | mkUhr | amt_hit | Zettel am Lautsprecher | AMT_BOXEN[0][0] / 2.1 / zN - .12 |  | () => amt_note('Speicherzettel', '<span class="hand">„Bandschleife Ansagen 2009, Sprecher H. W. Nic… |
| amt.js:615 | amt_bauArchiv | amt_hit | Nadeldrucker | AMT_DRUCK.x - .1 / .98 / AMT_DRUCK.z |  | () => amt_note('Endlospapier', '<span style="font-family:Courier New,monospace;font-size:.9em">' + … |
| amt.js:621 | amt_bauArchiv | amt_hit | Dienstanweisung | X0 + 19.6 / 1.5 / Z0 + 5.7 |  | () => amt_note('Dienstanweisung', 'Graues Papier, Schreibmaschine:\n\n<b>„Rückläufer werden nicht g… |
| amt.js:628 | amt_bauArchiv | amt_hit | Zettel an der Tafel | X0 + 29.7 / 2.08 / Z0 + 3.75 |  | () => amt_note('Zwei Zettel an der Tafel', '<span class="hand">„Herr Dr. Seiler, die Tafel klemmt b… |
| amt.js:635 | amt_bauArchiv | amt_hit | () => amt_S.gruendung ? 'Archivschrank' : amt_S.leiterSteht… | X0 + 28 / 2.0 / Z0 - 5.2 |  | () => amt_gruendung() |
| amt.js:640 | amt_bauArchiv | amt_hit | () => amt_S.vernichter ? 'Aktenvernichter' : 'Streifen hera… | vx / .5 / Z0 + 5.55 |  | () => amt_vernichter() |
| amt.js:656 | amt_bauKantine | amt_tuer | Kantine | x1 /  / Z0 + 4.3 |  | { dir: -1 } |
| amt.js:667 | amt_bauKantine | amt_hit | Zettel am Kühlschrank | xi0 + .6 / 1.3 / Z0 + 7.2 |  | () => amt_note('Zwei Zettel am Kühlschrank', '<span class="hand">„Wer meinen Joghurt nimmt, wird rü… |
| amt.js:672 | amt_bauKantine | amt_hit | Kaffeeecke | xi0 + .3 / ry1 + .15 / Z0 + 2.65 |  | () => toast('Eine Warmhalteplatte, darauf eine Kanne. Ein Filter von 2012, versteinert. Daneben ein… |
| amt.js:673 | amt_bauKantine | amt_hit | Kaffeekasse | xi0 + .17 / ry1 + .06 / Z0 + 3.36 |  | () => amt_kaffeekasse() |
| amt.js:675 | amt_bauKantine | amt_hit | Aschenbecher | X0 + 13.9 / ty + .05 / Z0 + 4.2 |  | () => amt_ascher() |
| amt.js:686 | zet | amt_hit | Schwarzes Brett | X0 + 12.2 / 1.5 / zi1 - .1 |  | () => amt_brett() |
| amt.js:690 | zet | amt_hit | Speiseplan | X0 + 8.4 / 1.55 / zi1 - .1 |  | () => amt_note('Speiseplan', 'Speiseplan Woche 31: Mo Kassler, Di Fisch, Mi Eintopf, Do Sprechstund… |
| amt.js:694 | zet | amt_hit | Wandkalender | X0 + 16.2 / 1.6 / zi1 - .1 |  | () => amt_note('Wandkalender', 'März 2012. Weiter wurde nicht geblättert. Der letzte Tag ist eingek… |
| amt.js:701 | zet | amt_hit | () => amt_S.said.kschub ? 'Besteck' : 'Besteck durchsuchen' | X0 + 10.35 / ty + .03 / Z0 + 4.8 |  | () => { if (amt_S.said.kschub) return toast('Besteck, eine Serviette mit Lippenstift, sonst nichts.… |
| amt.js:713 | amt_bauRegistratur | amt_tuer | Hängeregistratur (Zahlenschloss) | x1 /  / Z0 - 4.6 |  | { locked: true, zu: () => amt_zahlenschloss(), dir: 1 } |
| amt.js:729 | zu | amt_hit | Vier Hängemappen | X0 + 12.4 / rty + .1 / Z0 - 5.0 |  | () => amt_regMappen() |
| amt.js:730 | zu | amt_hit | () => amt_S.said.regschub ? 'Registraturschrank' : 'Registr… | X0 + 7.3 / 1.2 / zi0 + .68 |  | () => { if (amt_S.said.regschub) return toast('Leere Reiter, 1958 bis 2009. Nichts für 2026. Noch n… |
| amt.js:777 | amt_bauSicherung | amt_hit | Funkgerät | X0 + 30.55 / bankY + .08 / Z0 + 4.92 |  | () => { if (!ch2.ag06) return amt_ag06(); toast('Das Funkgerät. Das grüne Lämpchen brennt. Die Batt… |
| amt.js:780 | amt_bauSicherung | amt_hit | Drei Batterien | X0 + 30.55 / bankY + .05 / Z0 + 5.98 |  | () => amt_batterien() |
| amt.js:786 | amt_bauSicherung | amt_hit | Dienstanweisung 4 | X0 + 35.5 / 1.5 / Z0 + 7.7 |  | () => amt_note('Dienstanweisung 4 (1992)', 'Graues Papier:\n\n„Rückläufer (R-Fälle) sind zu beobach… |
| amt.js:790 | amt_bauSicherung | amt_hit | Aufkleber | X0 + 33 / 2.2 / Z0 + 7.7 |  | () => { toast('„Bei Stromausfall bitte Ruhe bewahren und den zuständigen Sachbearbeiter informieren… |
| amt.js:793 | amt_bauSicherung | amt_hit | () => amt_S.leiter ? '' : 'Leiter nehmen' | X0 + 35.5 / 1.1 / Z0 + 6.7 |  | () => amt_leiterNehmen() |
| amt.js:805 |  | amt_hit | () => amt_S.kuehl ? 'Kühlregal' : 'Kühlregal öffnen' | X0 + 35.3 / 1.1 / Z0 + 3.55 |  | () => amt_kuehlregal() |
| amt.js:813 |  | amt_tuer | Planung | X0 + 31 /  / Z0 + 8 |  | { dir: -1 } |
| amt.js:862 | fig | amt_hit | Das Modelldorf | cx / ty + .1 / cz |  | () => amt_modell() |
| amt.js:863 | fig | amt_hit | In die Tischkante geritzt | cx / ty - .03 / cz + D / 2 + .04 |  | () => amt_reim() |
| amt.js:877 | amt_bauPruef | amt_hit | Ein Foto | ox / oy + .03 / bs.z + .05 |  | () => amt_note('Ein Foto auf der Matratze', 'Oma Erna Kranz, jung, mit einem Jungen an der Hand. Ku… |
| amt.js:880 | amt_bauPruef | amt_hit | Dosen | X0 + 36.5 / .2 / Z0 + 1.25 |  | () => { toast('Ein Turm ausgespülter Dosen mit Schraubdeckel. Auf jedem Deckel ein Streifen Kreppba… |
| amt.js:883 | amt_bauPruef | amt_hit | Karteikasten „VERSUCHSREIHE K“ | X0 + 43.6 / .25 / Z0 - 4.3 |  | () => amt_karteiK() |
| amt.js:905 | amt_bauVorraum | amt_hit |  | X0 + 108.3 / .06 / Z0 + 4.55 |  | () => {} |
| amt.js:922 | amt_bauMessraum | amt_hit | Zeichnung vor dem leeren Stuhl | s8.x - .05 / .08 / s8.z - .62 |  | () => amt_note('Vor dem achten Stuhl', 'Buntstift. Ein Strichmännchen mit Hut und Zacken, daneben e… |
| amt.js:930 | amt_bauMessraum | amt_hit | Stuhl 8 | s8.x / .75 / s8.z |  | () => amt_stuhl8() |
| amt.js:1151 | amt_danke | amt_hit | Das Bonbon essen | x + .12 / .05 / z + .1 |  | () => { uninteract(S.bonbonHit); S.bonbon.visible = false; S.ruhig = 5; try { Audio.paper(); } catc… |
| amt.js:1159 | amt_messraumTick | amt_hit | Die Hand ans Glas legen | X0 + 117.35 / 1.3 / Z0 + 5.35 |  | () => { uninteract(S.tankHit); S.tankHand = true; subtitle('Sie atmet. Das Wasser ist warm.', 3600)… |
| amt.js:1232 | amt_akte06 | interact | () => S.akte06 ? 'Akte 06 · Blatt wenden' : 'Akte Luke' |  /  /  |  | () => { ch2.read = ch2.read \|\| new Set(); ch2.read.add('Luke'); if (!S.akte06) return liftTo(f, () … |
| anwesen.js:47 | open | anwesen_wrap | Brunnen | -108 /  / 35.5 |  | -108 |
| anwesen.js:53 | action | anwesen_wrap | Vogelscheuche | -121.2 /  / 24.8 |  | -121.2 |
| anwesen.js:61 | action | interact | () => anwesen_has(2) ? 'Sand' : 'Aufgewühlter Sand' |  /  /  |  | () => { if (anwesen_has(2)) return toast('Nur Sand. Und die Mulde, die deine Hände gegraben haben.'… |
| anwesen.js:67 | action | interact | () => anwesen_has(3) ? 'Kellerfenster' : 'Kellerfenster (Gi… |  /  /  |  | () => { if (anwesen_has(3)) return toast('Der Lichtschacht ist leer. Aus dem Keller zieht kalte Luf… |
| anwesen.js:76 | action | interact | () => anwesen_has(4) ? 'Umgestürztes Regal' : 'Unter das Re… |  /  /  |  | () => { if (anwesen_has(4)) return toast('Nur Staub und ein abgerissener Streifen Klebeband.', 2400… |
| anwesen.js:80 | action | interact | () => anwesen_has(7) ? 'Stuhl 8' : 'Stuhl 8 · unter die Sit… |  /  /  |  | () => { if (anwesen_has(7)) return toast('Der Stuhl ohne Namen. Die Gurte sind offen.', 2400); anwe… |
| anwesen.js:97 |  | interact | () => S.ch4 && anwesen_count() < 8 ? 'Whiskeys Nest' : (ch3… |  /  /  |  | () => { if (S.ch4 && anwesen_count() < 8) { const miss = ANW_TEILE.map((_, i) => i).filter(i => !an… |
| anwesen.js:135 | add | interact | () => S.key ? 'Prägepresse' : 'Prägepresse · Seiler & Sohn' |  /  /  |  | () => anwesen_press() |
| anwesen.js:147 | open | interact | () => S.key ? 'Die Tür der Villa aufschließen' : 'Tür der V… |  /  /  |  | () => anwesen_door() |
| anwesen.js:251 | put | interact | Brief auf dem Schreibtisch |  /  /  |  | () => { S.seen.add('brief'); openNote('Ein Brief, März 2019', anwesen_hand('An den, der die acht Te… |
| anwesen.js:254 | put | interact | () => typeof villa_hat === 'function' && villa_hat('ring') … |  /  /  |  | async () => { if (typeof villa_portraet === 'function' && await villa_portraet()) return; const ers… |
| anwesen.js:257 | put | interact | Wanduhr |  /  /  |  | () => toast(++uhrN > 1 ? 'Drei Uhr dreizehn. Das Pendel schwingt. Die Zeiger sind mit Bleistift auf… |
| anwesen.js:261 | put | interact | Treppe nach oben |  /  /  |  | () => anwesen_hallEnd() |
| anwesen.js:363 | chair | interact | Kinderbett |  /  /  |  | () => toast('Ein Kinderbett, mitten in der Halle, zur Treppe gedreht. Das Laken ist frisch bezogen.… |
| anwesen.js:373 | chair | interact | () => typeof villa_hat === 'function' && villa_hat('nachbil… |  /  /  |  | () => { if (typeof villa_bett === 'function') return villa_bett(); toast('Ein Krankenbett, mitten i… |
| anwesen.js:380 | chair | interact | Teddy auf der Treppe |  /  /  |  | () => toast('Ein alter Teddy, sorgfältig auf die Stufe gesetzt. Mit dem Gesicht zur Tür. Er hat auf… |
| anwesen.js:532 | ktx | interact | Briefkasten der Villa |  /  /  |  | () => { F.kasten = true; kirchberg_start('anw_fenster', { x: -125, z: 54 }); toast('Vollgestopft, d… |
| ausbau_nord.js:317 | cut | interact | h.n === 13 ? 'Tür' : 'Klopfen' |  /  /  |  | () => { if (h.n !== 13) Audio.knock(h.x, 1.3, h.z + h.d / 2 + .15); toast(KNOCK[h.n][k++ % KNOCK[h.… |
| ausbau_nord.js:352 | fence | interact | Aushang lesen |  /  /  |  | () => openNote('Friedhof Lost Eyengless · Aushang', '<b>FRIEDHOFSORDNUNG</b>\nDas Tor wird bei Einb… |
| ausbau_nord.js:391 | addGrave | interact | Grabstein lesen |  /  /  |  | () => S.id === 'kranz' && kapAb(4) ? ausbau_nord_peter() : openNote(S.title, S.html, 'nord_grab_' +… |
| ausbau_nord.js:433 | gen | interact | Grabstein lesen |  /  /  |  | () => ausbau_nord_readKid(i) |
| ausbau_nord.js:440 | gen | interact | Grabstein ansehen |  /  /  |  | () => toast('Ein achter Stein. Neu, glatt, ohne Namen. Kein Grab davor.', 4200) |
| ausbau_nord.js:508 | addW | interact | Madonna ansehen |  /  /  |  | () => openNote('Die Madonna am Gedenkfeld', 'Eine steinerne Madonna, die Hände gefaltet. Um ihre Ha… |
| ausbau_nord.js:514 | addW | interact | () => ausbau_nord.lantern.taken ? '' : 'Laterne nehmen' |  /  /  |  | () => ausbau_nord_takeLantern() |
| ausbau_nord.js:544 |  | interact | () => C.on ? '' : story.items.includes('nord_lantern') ? 'G… |  /  /  |  | () => ausbau_nord_lightCandle(C) |
| ausbau_nord.js:574 |  | interact | Eisenkreuz |  /  /  |  | () => openNote('Das Eisenkreuz', 'Ein schmiedeeisernes Grabkreuz, fast zwei Meter hoch. Der Name da… |
| ausbau_nord.js:611 | sw | interact | Steinkreuz |  /  /  |  | () => openNote('Das Sühnekreuz', 'Ein altes Steinkreuz, schief und halb im Boden versunken. Solche … |
| ausbau_nord.js:628 | run | interact | Wegweiser |  /  /  |  | () => toast('KIRCHWEG – zum Friedhof, zur Kapelle, zum Spielplatz. „Spielplatz“ ist durchgestrichen… |
| ausbau_nord.js:650 | ln | interact | Kreidezeichnung |  /  /  |  | () => openNote('Himmel und Hölle', 'Ein Hüpfspiel, mit Kreide aufs Pflaster gemalt. Der Regen hat f… |
| ausbau_nord.js:669 | ln | interact | Fahrplan lesen |  /  /  |  | () => { N.busArmed = Math.max(N.busArmed, 1); ausbau_nord_quest('plakat'); openNote('Fahrplan · Hal… |
| ausbau_nord.js:674 |  | interact | Fahrkarte |  /  /  |  | () => openNote('Eine Fahrkarte', 'Kinderfahrkarte, einfache Fahrt.\n\n<b>28.07.2009 · 03:13</b>\nvo… |
| ausbau_nord.js:706 | tx | interact | Rutsche |  /  /  |  | () => toast('Kleine, nasse Handabdrücke auf dem Blech. Sie führen hinauf. Keine führen herunter.', … |
| ausbau_nord.js:713 | tx | interact | Karussell anstoßen |  /  /  |  | () => { const M_ = ausbau_nord.merry; M_.w = Math.min(2.2, M_.w + 1.1); M_.frozen = false; Audio.pl… |
| ausbau_nord.js:724 | put | interact | Holzgiraffe |  /  /  |  | () => openNote('Eine Holzgiraffe', 'Abgeschabt, die Farbe fast ganz ab. Unten, eingebrannt: <b>D.</… |
| ausbau_nord.js:734 | put | interact | Schild lesen |  /  /  |  | () => toast('SPIELPLATZ · Nach Einbruch der Dunkelheit ist das Betreten verboten. Darunter, in Rot:… |
| ausbau_nord.js:739 | put | interact | () => story.items.includes('nord_baer') ? 'Bärli auf die Ba… |  /  /  |  | () => ausbau_nord_bench() |
| ausbau_nord.js:749 | put | interact | () => ausbau_nord.bear === 'bench' \|\| ausbau_nord.bear === … |  /  /  |  | () => ausbau_nord_teddy() |
| ausbau_nord.js:815 | ausbau_nord_swing | interact | Schaukel anhalten |  /  /  |  | () => { const S = ausbau_nord.swing; S.seats.forEach(q => { q.v *= .1; q.drive = 0; }); S.hold = 12… |
| ausbau_nord.js:909 | ausbau_nord_bench | interact | Bärli |  /  /  |  | () => ausbau_nord_teddy() |
| ausbau_nord.js:1034 | hand | interact | Grüne Plane |  /  /  |  | () => { toast('Die Plane liegt straff. Ordentlich beschwert, Stein an Stein. Darunter ist es tiefer… |
| ausbau_nord.js:1047 | hand | interact | Tafel am Spielhaus |  /  /  |  | () => openNote('Die Tafel am Spielhaus', '<span class="hand">Ochs am Berg, eins, zwei, drei,<br>wer… |
| ausbau_nord.js:1054 | kr | interact | Kreide am Schaukelgerüst |  /  /  |  | () => toast('EISEN IST FREI. In Kreide, vor den Pfosten des Gerüsts. Die Buchstaben sind groß, als … |
| ausbau_nord.js:1070 | plak | interact | () => N.plakat ? 'Die Ritze hinter dem Plakat' : (N.plakatG… |  /  /  |  | () => ausbau_nord_plakat() |
| ausbau_nord.js:1077 | plak | interact | Emailschild |  /  /  |  | () => { ausbau_nord_quest('strich'); toast('„Dr. med. Th. Seiler · Allgemeinmedizin · Vorsorge donn… |
| ausbau_nord.js:1087 |  | interact | Durchs Flurfenster sehen |  /  /  |  | () => ausbau_nord_messlatte() |
| ausbau_nord.js:1098 |  | interact | Schaukasten |  /  /  |  | () => ausbau_nord_schaukasten() |
| ausbau_nord.js:1116 | ausbau_nord_ochsTick | interact | Bärli aufheben |  /  /  |  | () => ausbau_nord_teddy() |
| ausbau_ost_west.js:29 | hit | interact | label |  /  /  |  | action |
| ausbau_ost_west.js:614 | owSpaeter | kirchberg_hit | Ein Lager im Heu | L.x + .3 / .45 / L.z |  | () => ausbau_ost_west_lager() |
| ausruestung.js:15 | ausruestung_spot | interact | () => ausruestung_S.taken.has(id) ? label : label + ' durch… |  /  /  |  | () => { if (ausruestung_S.taken.has(id)) return toast(empty, 3200); const r = give(); if (r === fal… |
| ausruestung.js:27 | ausruestung_spot | ausruestung_spot | Werkbank |  /  /  |  | 'Unter Lappen und Drahtrollen: eine Brechstange. An der Spitze Kalkstaub – frisch. Und eine Batteri… |
| ausruestung.js:31 | ausruestung_spot | ausruestung_spot | Schublade unter dem Tresen |  /  /  |  | 'Quittungsblöcke, Kaugummis von 2009, ein Päckchen Batterien. Zwei sind noch gut.' |
| ausruestung.js:33 | ausruestung_spot | ausruestung_spot | Regal |  /  /  |  | 'Motoröl, Scheibenfrost, eine Blisterpackung Batterien hinter den Dosen.' |
| ausruestung.js:37 | ausruestung_spot | ausruestung_spot | Ladegerät |  /  /  |  | 'Der Handscheinwerfer im Ladegerät ist voll geladen. Die Tankstelle hat seit Jahren keinen Strom.' |
| ausruestung.js:42 | ausruestung_spot | ausruestung_spot | Aktenschrank |  /  /  |  | 'Zwischen den Hängeregistern, mit Klebeband umwickelt: eine alte Keramiksicherung. Auf dem Band, in… |
| ausruestung.js:55 | ausruestung_spot | ausruestung_spot | Kerzenkreis |  /  /  |  | 'Sieben Kerzen, alle brennen. In der Mitte, sorgfältig gestapelt: vier Batterien. Als hätte jemand … |
| beobachter.js:220 | beob_note | interact | Zettel |  /  /  |  | open |
| beobachter.js:672 | beob_spurAn | interact | Bonbonpapier |  /  /  |  | () => beob_bonbonPapier(sp) |
| beobachter.js:672 | beob_spurAn | interact | Drei Kiesel |  /  /  |  | () => beob_kieselUm(sp) |
| beutel.js:291 | beutel_weltBau | interact | () => BEUTEL_STUFEN[F.stufe - 1].n + ' nehmen' |  /  /  |  | () => beutel_finden(F) |
| cleo.js:29 | plate | interact | () => cleo_has('cleo_ende') ? 'CLEO' : story.items.includes… |  /  /  |  | () => cleo_stone() |
| cleo.js:32 | plate | interact | () => cleo_has('cleo_akte') ? 'Aktenschrank' : 'Unterste Sc… |  /  /  |  | () => cleo_akte() |
| cleo.js:36 | open | interact | Strickleiter hinaufklettern |  /  /  |  | () => cleo_climb(true) |
| cleo.js:37 | open | interact | Hinunterklettern |  /  /  |  | () => cleo_climb(false) |
| cleo.js:43 | open | interact | () => cleo_has('cleo_baumhaus') ? 'Cleos Kiste' : 'Kiste mi… |  /  /  |  | () => cleo_chest(lock) |
| cleo.js:52 | open | interact | () => cleo_has('cleo_kreis') ? 'CLEO' : story.items.include… |  /  /  |  | () => cleo_kreis() |
| entdecker.js:47 | entd_kreideTex | interact | () => story.lore.some(l => l.key === 'kerbe_' + id) ? 'Krei… |  /  /  |  | () => entd_kerbe(id) |
| fassaden.js:696 | hitBox | interact | label |  /  /  |  | act |
| feuer.js:226 | feuer_hazePass | interact | Ölfass |  /  /  |  | () => feuer_barrelAct() |
| feuer.js:230 | mk | interact | Feuerzeug |  /  /  |  | () => feuer_takeLighter() |
| feuer.js:272 | fl | interact | () => S.phase === 'escape' && !S.relOpen ? 'Notentriegelung… |  /  /  |  | () => { if (S.phase === 'idle' && S.spent && (S.spentT \|\| 0) > 90 && !S.done) { feuer_notAlarm(); r… |
| feuer.js:702 | feuer_reset | interact | S.bHit.userData.label |  /  /  |  | S.bHit.userData.action |
| feuer.js:750 |  | interact | Das Öl anzünden |  /  /  |  | () => feuer_ignite() |
| feuer.js:833 | feuer_griff | interact | Stablampe aufheben |  /  /  |  | () => { S.lampe = null; uninteract(S.lampeHit); Audio.play('switch2', { gain: .25, rate: 1.2 }); } |
| fotos.js:71 | extra | interact | Foto genau ansehen |  /  /  |  | () => fotos_open(f) |
| fotos.js:77 | extra | interact | Foto genau ansehen |  /  /  |  | () => fotos_open(f) |
| geheimnisse.js:54 | geheimnisse_plate | interact | Glimmenden Stein aufheben |  /  /  |  | () => geheimnisse_takeStone(S.stones[i]) |
| geheimnisse.js:70 | geheimnisse_plate | interact | () => geheimnisse_has(key) ? 'Metallteil' : 'Metallteil unt… |  /  /  |  | () => geheimnisse_wreck(i, text, key) |
| geheimnisse.js:88 | geheimnisse_plate | interact | () => geheimnisse_has(key) ? 'Zählgestell berühren' : 'Zähl… |  /  /  |  | () => geheimnisse_totem(i, key) |
| gruen.js:494 | customProgramCacheKey | interact | Den Kreis untersuchen |  /  /  |  | () => { gruen_find('gruen_kreis', 'Der Kreis im Wald', 'Ein Kreis, in dem nichts wächst. Sieben Sch… |
| gruen.js:505 | customProgramCacheKey | interact | Ansehen |  /  /  |  | () => gruen_find('gruen_steine', 'Sieben Steine', 'Sieben Steine im Kreis, auf frisch umgegrabener … |
| gruen.js:513 | customProgramCacheKey | interact | Den Zaun ansehen |  /  /  |  | () => { gruen_find('gruen_zaun' + i, 'Am Weidezaun', txt, 6000); if (i === 3) setTimeout(() => Audi… |
| gruen.js:541 | tube | interact | In die Pfütze sehen |  /  /  |  | () => { if (pudScare++ % 3 === 0) { toast('Im Wasser spiegelt sich die Laterne. Und für einen Augen… |
| gruen.js:604 | tx | interact | () => D.open ? '' : (typeof wald_frei === 'function' && wal… |  /  /  |  | () => { if (typeof wald_frei === 'function' && wald_frei()) return; Audio.play('metalHit2', { gain:… |
| gruen.js:626 | an | interact | Anzeige: Dackel entlaufen |  /  /  |  | () => { kirchberg_start('gruen_wild', { x: 28, z: 95 }); subtitle('Heißen hier alle Hunde Bruno?', … |
| gruen.js:627 | an | interact | Blechschild |  /  /  |  | () => { kirchberg_start('gruen_wild', { x: 28, z: 95 }); openNote('Blechschild am Gitter', '<b>FORB… |
| gruen.js:629 | an | interact | In den Wald rufen |  /  /  |  | () => gruen_rufen() |
| hungrige.js:156 | page | interact | () => !hungrige_seiteFrei(i) ? '' : story.lore.some(l => l.… |  /  /  |  | () => { if (hungrige_seiteFrei(i)) hungrige_seite(i); } |
| innen_kapitel.js:60 | spot | interact | label |  /  /  |  | fn |
| innen_kapitel.js:155 | lit | spot | Die Tür | XA + .35 / 1.1 / ZA |  | note('Die Tür', 'Von dieser Seite hat sie keine Klinke. Nur Kratzspuren, knapp über dem Boden – so … |
| innen_kapitel.js:161 | lit | spot | Kreidestriche | XA + 5.5 / 1.25 / zN - .2 |  | note('Kreidestriche', 'Fünfergruppen, sauber gezogen. Siebzehn Gruppen – und ganz unten, mit andere… |
| innen_kapitel.js:164 | lit | spot | Laufzettel | XA + 17.7 / 1.45 / ZA - 1.0 |  | note('Laufzettel · Ebene −2', 'RÜCKFÜHRUNG NR. 6 – ZUSTELLUNG VERSPÄTET\nÜbergabe: Kreuzung, <b>Mit… |
| innen_kapitel.js:201 |  | interact | Gruppenfoto |  /  /  |  | note('Gruppenfoto · Sommerfest 2009', 'Kinder an der Kreuzung, in einer Reihe. Du zählst: <b>acht</… |
| innen_kapitel.js:221 |  | spot | Wartungsbuch | XA + 30.62 / tt + .05 / ZA + 6.25 |  | note('Wartungsbuch · Notstrom Ebene −2', '<span class="hand">13.07.1992 – Ausfall 03:13. Kreise 2 +… |
| innen_kapitel.js:222 |  | spot | Überwachungsmonitore | XA + 30.47 / tt + .18 / ZA + 4.9 |  | () => { try { Audio.flick(); Audio.whisper(XA + 30.5, 1, ZA + 4.9, 1.6); } catch (e) {} toast('Zwei… |
| innen_kapitel.js:258 | grime | spot | Türschild | XA + 35.7 / 1.72 / ZA - 1.38 |  | note('Prüfraum 3', 'Ein Emailleschild, an den Kanten abgeplatzt: <b>PRÜFRAUM 3 · Unterscheidung Ori… |
| innen_kapitel.js:286 | kz | spot | Tafel | XA + 39.1 / 1.55 / ZA + 4.55 |  | () => { if (ch2.spiderPhase !== 'gone') { toast('Eine Tafel an der Wand, dicht zugesponnen. Darunte… |
| innen_kapitel.js:296 | kz | spot | Fluchtplan | XA + 45.7 / 1.5 / ZA + 1.42 |  | note('Fluchtplan Ebene −2', 'Hinter zerkratztem Plexiglas, vergilbt. Ein roter Punkt: <b>Sie sind h… |
| innen_kapitel.js:379 |  | spot | Monitore | XA + 112.8 / ty + .2 / ZA - 7.55 |  | () => { try { Audio.flick(); } catch (e) {} toast('Auf beiden Schirmen derselbe Raum: dieser hier. … |
| innen_kapitel.js:381 |  | spot | Zeichnungen | XA + 106.3 / 1.25 / ZA - 4.1 |  | note('Zeichnungen an der Wand', 'Mit Tesafilm an den Putz geklebt, in Augenhöhe eines Kindes. Siebe… |
| innen_kapitel.js:391 |  | interact | Plan an der Wand |  /  /  |  | note('Protokoll SIEBZEHN · Anordnung', 'Acht Plätze im Kreis. Sieben sind mit Bleistift nummeriert.… |
| innen_kapitel.js:400 |  | interact | Leerer Rahmen |  /  /  |  | note('Ein Rahmen', 'Das Foto darin ist weiß. Nicht vergilbt, nicht ausgeblichen – <b>weiß</b>, als … |
| innen_kapitel.js:412 | material | spot | Babybett | XW + 16.6 / .5 / ZW - 5.45 |  | note('Ein Babybett', 'Viel zu klein für einen Neunjährigen. Mama hat es nie weggegeben – „für späte… |
| innen_kapitel.js:415 | material | spot | Fernseher | XW + 8.6 / .3 / ZW + 4.2 |  | () => { toast('Der Fernseher ist aus. In der schwarzen Scheibe spiegelt sich das Zimmer – mit einem… |
| innen_kapitel.js:419 | material | interact | Familienfoto |  /  /  |  | note('Familienfoto', 'Mama, Lucy, ein Junge mit Sommersprossen. Sommer 2008.\n\nDas Gesicht des Jun… |
| innen_kapitel.js:432 | material | spot | Radio | XW + 30.6 / 1.0 / ZW + 5.45 |  | () => toast('Hildes Radio. Die Nadel steht auf 31,10. Aus dem Lautsprecher: nur das Ticken einer Uh… |
| innen_kapitel.js:439 | material | interact | Foto von Zayn |  /  /  |  | note('Zayn, 7', 'Ein Junge mit Zahnlücke und viel zu großem Fußballtrikot. Unten am Rand, in Hildes… |
| innen_kapitel.js:449 | material | interact | Zeichnung vor dem leeren Stuhl |  /  /  |  | note('Vor dem achten Stuhl', 'Buntstift, sorgfältig. Ein großer Mann aus grauem Eisen, daneben ein … |
| innen_ort.js:121 | hand | interact | Pendeluhr |  /  /  |  | () => { toast(text, 5200); const q = body.getWorldPosition(new THREE.Vector3()); Audio.play('woodHi… |
| innen_ort.js:177 | toy | interact | Blechroboter |  /  /  |  | () => toast('Ein Blechroboter. Auf der Unterseite, mit rotem Nagellack: ZAYN. Kein Staub darauf – a… |
| innen_ort.js:183 | toy | interact | Stuhl am Fenster |  /  /  |  | () => toast('Hildes Stuhl. Er steht so, dass man durch die Gardine genau auf die Kreuzung sieht. Au… |
| innen_ort.js:194 | toy | interact | Leerer Bilderrahmen |  /  /  |  | () => toast('Der Rahmen ist leer. Dahinter ein hellerer Fleck auf der Tapete – das Bild hing hier j… |
| innen_ort.js:221 |  | interact | Radio einschalten |  /  /  |  | async () => { // STORY-HOOK: Radio 31,10 MHz if (state.talking) return; const p = bbox(gRadio).getC… |
| innen_ort.js:231 |  | interact | Umgekippter Stuhl |  /  /  |  | () => toast('Umgekippt. Die Stuhlbeine haben helle Kratzer in die Dielen gezogen – in Richtung Kell… |
| innen_ort.js:235 |  | interact | Müllsäcke |  /  /  |  | () => toast('Prall gefüllt, süßlicher Geruch. Obenauf: sieben leere Grablicht-Packungen. Und ein Ki… |
| innen_ort.js:252 | foot | interact | Bett |  /  /  |  | () => toast('Die Decke ist zurückgeschlagen, als wäre sie mitten in der Nacht aufgestanden. Auf dem… |
| innen_ort.js:258 | foot | interact | Bilderrahmen |  /  /  |  | () => toast('Leer. Auf der Rückwand, mit Bleistift: „Zayn, 7. Sommer 2009.“ Darunter, frischer: „Er… |
| innen_ort.js:263 | foot | interact | Kerze |  /  /  |  | () => toast('Frisch angezündet. Das Wachs ist noch weich. Du bist allein im Haus. Oder?', 4200) |
| innen_ort.js:277 | foot | interact | Grablichter |  /  /  |  | () => toast('Grablichter. Dutzende. Alle schon einmal angezündet und wieder ausgeblasen. Auf dem Ka… |
| innen_ort.js:280 | foot | interact | Kanister |  /  /  |  | () => toast('Benzin, halb leer. Daneben eine Schachtel Streichhölzer. Wollte sie etwas verbrennen?'… |
| innen_ort.js:315 | moveSheet | interact | Teddy |  /  /  |  | () => toast('Lucys Teddy. Ein Ohr ist mit rotem Faden angenäht – Lucys erste Naht, mit neun. Staub … |
| innen_ort.js:319 | moveSheet | interact | Verkehrt aufgehängtes Bild |  /  /  |  | () => toast('Das Bild hängt verkehrt herum, mit dem Gesicht zur Wand. Auf der Rückseite, in Mamas S… |
| innen_ort.js:333 | moveSheet | interact | Küchenbuffet |  /  /  |  | () => toast('Mamas Rezeptkarten, alle für vier Personen. Auf jeder ist die „4“ durchgestrichen und … |
| innen_ort.js:353 | moveSheet | interact | Stoffhase |  /  /  |  | () => toast('Lucys Stoffhase. Ein Auge fehlt. Ihr habt euch darum gestritten, das weißt du noch. Ni… |
| innen_ort.js:357 |  | interact | Ball |  /  /  |  | () => { if (S.ball.t < 1) return toast('Ein alter Gummiball, halb unter Lucys Bett.', 3000); toast(… |
| innen_ort.js:367 |  | interact | Bett |  /  /  |  | () => toast('Nur eine Seite ist benutzt. Auf dem Kissen der anderen: ein Milchzahn in einem Taschen… |
| innen_ort.js:388 | mk | interact | In den Spiegel sehen |  /  /  |  | () => { toast('Dein Gesicht. Braune Augen. Du blinzelst – das Spiegelbild einen Herzschlag später.'… |
| innen_ort.js:441 | gurtAuf | interact | Stuhl |  /  /  |  | () => toast('In die Sitzfläche sind Striche geritzt. Sieben. Daneben ein achter – tiefer, frischer.… |
| innen_ort.js:456 | gurtAuf | interact | Einmachgläser |  /  /  |  | () => toast('Einmachgläser, beschriftet mit Jahreszahlen: 1975. 1992. 2009. Das letzte ist leer. Da… |
| innen_ort.js:464 | gurtAuf | interact | Spielzeug |  /  /  |  | () => toast('Sieben Spielsachen, im Kreis um den Stuhl gestellt. Alle schauen zum Stuhl. Die Kerzen… |
| innen_ort.js:484 | trashcan | interact | Anrichte |  /  /  |  | () => toast('In der Schublade: Streichhölzer, Gummibänder, ein Stapel Trauerkarten. Alle unbeschrie… |
| innen_ort.js:500 | trashcan | interact | Teddy auf dem Stuhl |  /  /  |  | () => toast('Jemand hat den Stuhl vor das Kinderbett gestellt und den Teddy daraufgesetzt. Zum Aufp… |
| innen_ort.js:511 | trashcan | interact | Kinderstuhl |  /  /  |  | () => toast('Dein alter Stuhl. Er steht in der Ecke, zur Wand gedreht – wie damals, zur Strafe. Du … |
| innen_ort.js:531 |  | interact | Eisenbett |  /  /  |  | () => toast('Ein Eisenbett im Keller. Die Matratze ist fleckig und nach der Mitte zu durchgelegen –… |
| innen_ort.js:555 |  | interact | Puppe |  /  /  |  | () => toast('Porzellan, kalt und feucht. Am Handgelenk ein Namensband aus dem Krankenhaus: „Wendt, … |
| kapitel1.js:146 |  | interact | Astloch |  /  /  |  | () => { toast('Im Astloch der Bretter glimmt es rot, wie eine Standby-Leuchte. Dahinter ein rundes … |
| kapitel1.js:149 |  | interact | Fahrrad |  /  /  |  | () => toast('Lucys altes Fahrrad. Die Kette ist rostig, der Sattel zerkratzt. Am Lenker hängt noch … |
| kapitel1.js:162 |  | interact | Schale |  /  /  |  | () => { toast('In der Obstschale: Hildes alte Dienstmarke. „BfR · Verwaltung · 03“. Daneben ein Kug… |
| kapitel1.js:165 |  | interact | Sessel |  /  /  |  | () => { if (!K1.f.has('sessel')) { K1.f.add('sessel'); toast('Leer. Und warm. Auf der Lehne eine zu… |
| kapitel1.js:174 |  | interact | Foto am Kühlschrank |  /  /  |  | () => openNote('Foto am Kühlschrank', 'Ein kleiner Junge mit Locken, im roten Shirt, die Arme lang … |
| kapitel1.js:185 |  | interact | Batterien |  /  /  |  | () => { if (K1.f.has('batt')) return; K1.f.add('batt'); K1.batt.forEach(o => o.visible = false); un… |
| kapitel1.js:197 |  | interact | Polaroid |  /  /  |  | () => kapitel1_polaAnsehen() |
| kapitel1.js:200 |  | interact | Zettel |  /  /  |  | () => { openNote('Zettel auf der Obstkiste', '<span class="hand">„Hilde, Deine Kassetten sind noch … |
| kapitel1.js:321 | kapitel1_nichtDu | interact | Taschenlampe aufheben |  /  /  |  | () => { K1.lampe = null; uninteract(K1.lampeHit); flashOn = true; Audio.play('switch1', { gain: .35… |
| kapitel1.js:418 | kapitel1_leaveBasement | interact | Lucys Zettel |  /  /  |  | () => openNote('Lucys Zettel', '<span class="hand">Großer, falls ich nicht heimkomme:\nHilde macht … |
| kapitel1.js:484 | kapitel1_versteck | interact | Kugelschreiber |  /  /  |  | () => { uninteract(K1.stift); if (K1.stiftG) K1.stiftG.visible = false; kapitel1_lore('k1_stift', '… |
| kapitel1.js:540 | kapitel1_kellerEnde | interact | Die Hand an die Wand legen |  /  /  |  | async () => { uninteract(K1.wandHand); toast('Sie ist warm.', 2600); await wait(2400); kapitel1_end… |
| kapitel1.js:593 | kapitel1_a04Tick | interact | Briefkasten öffnen |  /  /  |  | kapitel1_briefkasten |
| kapitel1.js:594 | kapitel1_a04Tick | interact | Kalender ansehen |  /  /  |  | () => { state.readCal = true; openNote('Kalender · Oktober', '<i>Werbekalender der Sparkasse. Hilde… |
| kapitel1.js:595 | kapitel1_a04Tick | interact | () => K1.f.has('bandZettel') ? 'Kassette abspielen' : 'Zett… |  /  /  |  | kapitel1_band |
| kapitel1.js:596 | kapitel1_a04Tick | interact | Zeichnungen ansehen |  /  /  |  | kapitel1_wand |
| kapitel1.js:597 | kapitel1_a04Tick | interact | Nach oben gehen |  /  /  |  | kapitel1_treppe |
| kapitel1.js:598 | kapitel1_a04Tick | interact | () => story.items.includes('autoschluessel') ? 'Nach Hause … |  /  /  |  | kapitel1_heim |
| kapitel3.js:47 | kapitel3_kuhStellen | interact | () => S.kuh.has(k) ? '' : 'Kuh untersuchen · ' + KAPITEL3_K… |  /  /  |  | () => kapitel3_kuhUntersuchen(k, b) |
| kapitel3.js:253 | kapitel3_handAnbieten | interact | Justins Hand nehmen |  /  /  |  | () => kapitel3_handNehmen() |
| kapitel3.js:296 | kapitel3_hufeisen | interact | () => kapitel3_k3() && !S.huf ? 'Hufeisen über der Stalltür… |  /  /  |  | () => { if (kapitel3_k3() && ch3.part === 'town') kapitel3_hufeisen(); } |
| kapitel5.js:341 | hit | interact | label |  /  /  |  | fn |
| kapitel6.js:134 |  | interact | () => K6.on && !K6.flasche ? 'Eine Pfandflasche' : '' |  /  /  |  | () => k6_flascheNehmen() |
| kapitel6.js:136 |  | interact | () => K6.on && !K6.told.has('handschuhfach') ? 'Das Handsch… |  /  /  |  | () => k6_handschuhfach() |
| kapitel6.js:138 |  | interact | () => K6.on && K6.batFall && !K6.batDa ? 'Die Batterie zwis… |  /  /  |  | () => { if (!K6.batFall \|\| K6.batDa) return; K6.batDa = true; bt.visible = false; if (typeof addBat… |
| kapitel6.js:140 |  | interact | () => K6.on && k6_has('bergungsfunk') && !K6.told.has('funk… |  /  /  |  | () => k6_funkZurueck() |
| kapitel6.js:143 |  | interact | () => K6.on && K6.falleFertig ? 'Ein Klemmbrett-Blatt' : '' |  /  /  |  | () => k6_liste() |
| kapitel6.js:342 | k6_ag18Tasche | interact | () => K6.on && K6.schneiderFrei && !K6.schneider ? 'Den Sei… |  /  /  |  | () => { if (K6.schneider \|\| !K6.schneiderFrei) return; K6.schneider = true; if (!k6_has('seitenschn… |
| kapitel6.js:503 | hook | interact | () => K6.on && !K6.funk ? 'Das Funkgerät nehmen' : '' |  /  /  |  | () => { if (K6.funk) return; K6.funk = true; if (K6.funkM) K6.funkM.visible = false; story.items.pu… |
| kapitel6.js:504 | hook | interact | () => K6.on && !K6.kette ? 'Die Kettenrolle nehmen' : '' |  /  /  |  | () => { if (K6.kette) return; K6.kette = true; if (K6.ketteM) K6.ketteM.visible = false; if (typeof… |
| kapitel6.js:741 | k6_reset | interact | () => K6.on && !K6.flasche ? 'Eine Pfandflasche' : '' |  /  /  |  | () => k6_flascheNehmen() |
| katzen.js:19 |  | katzen_klick | label |  /  /  |  | fn |
| katzen.js:332 | katzen_klick | interact | label |  /  /  |  | () => fn(k) |
| kiffen.js:701 | kf_hit | interact | label |  /  /  |  | act |
| kiffen.js:712 | kf_fundeBau | kf_hit | () => 'Lose Stufe' | -27.36 / (S.fundObj.grinde… / 12.12 |  | () => { kf_gefunden('grinder'); kf_gefunden('papes'); } |
| kiffen.js:713 | kf_fundeBau | kf_hit | Unter dem Blumentopf | KF_ORTE.knolle.at… / (S.fundObj.knolle… / KF_ORTE.knolle.at… |  | () => kf_gefunden('knolle') |
| kiffen.js:714 | kf_fundeBau | kf_hit | Vegas nach Tips fragen | -28 / 1.5 / -12.05 |  | () => kf_vegasTips() |
| kiffen.js:715 | kf_fundeBau | kf_hit | Hinsetzen · fünf Minuten | KF_SITZ.x / .7 / KF_SITZ.z - .15 |  | () => kiffen_szene({}) |
| kiffen.js:723 | kiffen_fund | kf_hit | o.label \|\| 'Streichholzschachtel' | pos[0] / pos[1] + .05 / pos[2] |  | () => { subtitle('„Tips? Nimm den Pappdeckel von den Streichhölzern. Hab ich ’75 auch so gemacht.“'… |
| kiffen.js:725 | kiffen_fund | kf_hit | o.label \|\| 'Hinter dem Poster' | pos[0] / pos[1] + .08 / pos[2] |  | () => kf_gefunden('papes') |
| kiffen.js:743 | add | kf_hit |  |  /  /  |  |  |
| kirchberg.js:48 | kirchberg_hit | interact | label |  /  /  |  | fn |
| kirchberg.js:77 | kirchberg_raum | kirchberg_hit | def.rausLabel \|\| 'Hinausgehen' | tx / 1.1 / tz |  | () => kirchberg_raus() |
| kirchberg.js:215 | kirchberg_giselaAussen | kirchberg_hit | () => S.steps.liste ? 'Napfbrett · achtzehn Näpfe' : 'Napfb… | bx / .25 / bz |  | () => kirchberg_napfbrett() |
| kirchberg.js:220 | kirchberg_giselaAussen | kirchberg_hit | Rotes Kinderrad | H.x + 3.9 / .45 / fz + 5.55 |  | () => kirchberg_notiz('Ein Kinderfahrrad', 'Klein, rot, Stützräder, Vollgummireifen. Mit einer Kett… |
| kirchberg.js:227 | kirchberg_giselaAussen | kirchberg_hit | () => kirchberg_offen('gisela') ? 'Eintreten' : 'Klopfen' | H.x / 1.6 / fz + .3 |  | () => kirchberg_klopfen() |
| kirchberg.js:228 | kirchberg_giselaAussen | kirchberg_hit | () => S.steps.gespraech ? 'Küchenfenster' : 'Ans Küchenfens… | F0.x / F0.y / F0.z + .25 |  | () => kirchberg_klopfen(true) |
| kirchberg.js:271 | kirchberg_katzenAn | katzen_klick | () => katzen_S.carry === k ? '' : 'Katze hochheben · ' + n.… |  /  /  |  | () => kirchberg_katzeNehmen(n) |
| kirchberg.js:323 | fn | kirchberg_hit | Aushang lesen | K.x + .95 / 1.5 / tz - .2 |  | () => kirchberg_aushang() |
| kirchberg.js:331 | fn | kirchberg_hit | Martinsnische | nx / 1.1 / nz - .6 |  | () => kirchberg_nische() |
| kirchberg.js:335 | fn | kirchberg_hit | Kapellenfenster (mit der Lampe) | K.x + 3.05 / 2 / 80 |  | () => kirchberg_fenster() |
| kirchberg.js:339 | fn | kirchberg_hit | () => kirchberg_offen('kapelle') ? 'Kapelle betreten' : 'Ka… | K.x / 1.2 / tz - .3 |  | () => kirchberg_kapTuer() |
| kirchberg.js:619 | kirchberg_pfarrAussen | kirchberg_hit | Herrenrad | P.x - 1.2 / .9 / fz + .55 |  | async () => { S.steps.rad = 1; kirchberg_start('kb_fest', { x: P.x, z: fz + 3 }); openNote('Ein Her… |
| kirchberg.js:624 | kirchberg_pfarrAussen | kirchberg_hit | Vergilbter Gemeindebrief | P.x + 1.1 / .45 / fz + .7 |  | () => { S.steps.gemeindebrief = 1; kirchberg_start('kb_fest'); openNote('Gemeindebrief St. Martin, … |
| kirchberg.js:627 | kirchberg_pfarrAussen | kirchberg_hit | () => kirchberg_offen('pfarrhaus') ? 'Pfarrhaus aufschließe… | P.x / 1.6 / fz + .3 |  | () => { if (kirchberg_offen('pfarrhaus')) return kirchberg_rein('pfarrhaus'); Audio.knock(); toast(… |
| kirchberg.js:667 | kerze | kirchberg_hit | Kindergedeck | C.x - 2.2 / tischY + .1 / C.z + .2 |  | () => kirchberg_notiz('Ein Gedeck', 'Blechteller, Blechbecher, ein Stück Brot. Alles von damals.\nD… |
| kirchberg.js:674 | kerze | kirchberg_hit | Kühlschrank | x0 + .38 / 1 / z1 - 1.1 |  | () => kirchberg_notiz('Ein Turm aus Dosen', 'Auf dem Kühlschrank: siebzehn Katzenfutterdosen, siebz… |
| kirchberg.js:678 | kerze | kirchberg_hit | Uhr | x0 + .2 / 1.8 / C.z + .4 |  | () => toast('Drei Uhr dreizehn. Alle Uhren im Haus. Das Pendel schwingt.', 3000) |
| kirchberg.js:689 | fn | kirchberg_hit | Foto über dem Sofa | C.x + 2.9 / 1.55 / z0 + .25 |  | () => kirchberg_notiz('Ein Foto', 'Ein kleiner Junge auf einem roten Rad mit Stützrädern. Er lacht … |
| kirchberg.js:706 | fn | kirchberg_hit | Predigtmappe | C.x + .9 / ty + .1 / C.z + .35 |  | () => kirchberg_notiz('Eine Predigtmappe', 'Zwölf Predigten, sauber abgeheftet. Die dreizehnte fehl… |
| kirchberg.js:727 |  | kirchberg_hit | Kapellenfenster | x1 - .3 / 3 / C.z - 1.5 |  | () => openNote('Das Kapellenfenster, von innen', 'Acht Felder. Farbig, von innen. Im sechsten ein M… |
| kirchberg.js:747 | kirchberg_save | kirchberg_hit | Kugelschreiber | S.fenster.x + .3 / S.fenster.y - .55 / S.fenster.z + .2 |  | () => subtitle('Bevor du zugreifst, ist er weg. Der Rabe.', 2600) |
| lucy3.js:517 | lookLow | interact | Heckscheibe ansehen |  /  /  |  | lucy3_lookTop |
| lucy3.js:517 | lookLow | interact | Heckscheibe unten ansehen |  /  /  |  | lucy3_lookLow |
| lwo.js:874 | lwo_ag07V05 | interact | Gelber Klebezettel |  /  /  |  | () => { openNote(V.notiz[0], V.notiz[1], 'lwo_v05', () => { for (const z of V.zeilen) lwo_zeile(z[0… |
| lwo.js:923 | hook | interact | Kaugummipapier |  /  /  |  | () => { uninteract(hit); if (pap) pap.visible = false; if (typeof modItem === 'function') modItem('… |
| lwo.js:926 | hook | interact | Thermoskanne |  /  /  |  | () => { uninteract(th); thermos.visible = false; if (typeof modItem === 'function') modItem('thermo… |
| lwo.js:927 | hook | interact | Die Bank |  /  /  |  | () => toast('Die Bank ist an einer Stelle warm. Nicht da, wo er saß.', 3000) |
| neben3.js:194 | fn | kirchberg_hit | Kirchenführer lesen | x1 - .45 / ty + .1 / z1 - 1.6 |  | () => neben3_fuehrer() |
| neben3.js:208 | fn | kirchberg_hit | Gerahmte Abschrift | x1 - 1.35 / 1.45 / zS - .25 |  | () => neben3_suehne() |
| neben3.js:212 | fn | kirchberg_hit | Heller Fleck an der Wand | xS + .2 / 1.85 / z0 + .8 |  | () => { neben3_st('kapelle').fleck = 1; openNote('Ein heller Fleck', 'An der Wand ein heller Fleck … |
| neben3.js:217 | fn | kirchberg_hit | Gesangbuch lesen | px / py + .1 / pz |  | () => neben3_gesangbuch() |
| neben3.js:227 |  | kirchberg_hit | Zettel am Seil | x0 + .25 / 1.5 / sz + .55 |  | () => neben3_giselaZettel() |
| neben3.js:228 |  | kirchberg_hit | () => neben3_st('kapelle').seil1 ? 'Am Seil ziehen' : 'Das … | sx / 1.1 / sz |  | () => neben3_seil() |
| neben3.js:321 | put | kirchberg_hit | Schachbrett | tx / ty + .1 / tz |  | () => neben3_springer() |
| neben3.js:324 | put | kirchberg_hit | Talar | x0 + .3 / 1.2 / C.z + 1.2 |  | () => toast('Ein schwarzer Talar am Haken. In der Tasche ein Kuli und ein Hustenbonbon.', 3400) |
| neben3.js:329 | fn | kirchberg_hit | Wandkalender | x0 + .25 / 1.55 / C.z - .55 |  | () => openNote('Wandkalender, Juni 1992', 'Der Einundzwanzigste ist mit Kuli umkringelt.\n\n<i>Auf … |
| neben3.js:333 | fn | kirchberg_hit | Foto | x1 - .25 / 1.55 / C.z - .1 |  | () => openNote('Ein Foto', 'Pfarrer Voss mit dem Rad vor der Kapelle, lachend. Im Hintergrund, unsc… |
| neben3.js:338 | action | kirchberg_hit | Brecheisen | P.x + 2.6 / .4 / P.z + P.d / 2 + .… |  | () => { if (!neben3_k3()) return toast('Ein Brecheisen, an die Wand gelehnt. Rostig.', 2600); b.vis… |
| neben3.js:344 | action | kirchberg_hit | Kerze | 0 / -50 / 0 |  | () => toast('Eine Kerze. Sie ist noch warm.', 2600) |
| neben3.js:397 | action | kirchberg_hit | () => neben3_st('ritter').sb05 ? 'Kassette abspielen' : 'Ka… | C.x + .4 / ty + .12 / C.z - 3.45 |  | () => neben3_rekorder() |
| neben3.js:402 | action | kirchberg_hit | Zigarrenkiste unter dem Bett | C.x + 4.35 / .15 / C.z - 2.95 |  | () => neben3_zigarrenkiste() |
| neben3.js:404 | action | kirchberg_hit | Zettel auf dem Kopfkissen | C.x + 5.3 / .68 / C.z - 3.55 |  | () => openNote('Auf dem Kopfkissen', '<span class="hand">Für Luke, falls er’s mal erfährt: Ich hab’… |
| neben3.js:484 | neben3_giselaWach | katzen_klick | Katze von der Herdplatte heben |  /  /  |  | () => { katzen_klick(hk, null); katzen_tragen(hk); setTimeout(() => { katzen_absetzen(hk, hx + 1.1,… |
| neben3.js:484 | neben3_giselaWach | katzen_klick | null |  /  /  |  |  |
| neben3.js:546 | neben3_ort | kirchberg_hit | label | x / y / z |  | fn |
| neben3.js:559 | neben3_kanalBau | neben3_ort | Kreide an der Schachtwand | sp.x - .9 / sp.y + 1.2 / sp.z | () => state.zone === 'canal' | () => { const st = neben3_st('ast3'); openNote('Kreide an der Schachtwand', '<i>Kinderkreide, alt:<… |
| neben3.js:561 | neben3_kanalBau | neben3_ort | Die Kiste | kiste.x / kiste.y + .5 / kiste.z | () => state.zone === 'canal' && !neben3_st('ast3').kiste | () => neben3_kiste() |
| neben3.js:563 | neben3_kanalBau | neben3_ort | Ins tiefe Wasser sehen | tief.x / tief.y + .8 / tief.z | () => state.zone === 'canal' && !neben3_st('ast3').tief | async () => { const st = neben3_st('ast3'); if (st.tief) return; st.tief = 1; state.talking = true;… |
| neben3.js:583 | stelle | neben3_ort | label | P.x + dx / .6 / P.z + dz | () => frei() && !st()[k] | async () => { const s = st(); neben3_start('k3_heim', { x: P.x, z: P.z }); if (s[k]) return; s[k] =… |
| neben3.js:589 | stelle | neben3_ort | Probeliegen? | P.x / .4 / P.z + .1 | () => frei() && ['stein', 'kreide', 'schuh', 'knie'].every(k => st()[k]) && !st().probe | async () => { const s = st(); s.probe = 1; await say([['„Nein.“', 1600, 'DU']]); neben3_fertig('k3_… |
| neben3.js:632 | neben3_villaBau | neben3_ort | Überquellender Briefkasten | x / 1.1 / z | () => neben3_auf('k3_selbst') | async () => { const st = neben3_st('selbst'); neben3_start('k3_selbst', { x, z }); if (!st.post) { … |
| neben3.js:645 | neben3_bandBau | neben3_ort | Monitor über der Kasse | 114.2 / 1.4 / 24.6 | () => neben3_auf('k3_band') | () => neben3_band() |
| neben3.js:646 | neben3_bandBau | neben3_ort | Aufkleber an der Tür | 116.6 / 1.2 / 22.2 | () => neben3_auf('k3_band') | () => toast('„Bitte lächeln, Sie werden gefilmt.“ Darunter, zwei Millimeter groß, ein Auge.', 3600) |
| neben3.js:667 | stelle | neben3_ort | label | x / y / z | () => neben3_auf('k3_kerben') && !st()[k] | async () => { neben3_start('k3_kerben', { x: L.x, z: L.z }); const s = st(); if (s[k]) return; s[k]… |
| neben3.js:681 | neben3_dinaBau | neben3_ort | Dina | x / .9 / z | () => neben3_auf('k3_ort') | () => neben3_dina() |
| neben3.js:711 | neben3_strasseBau | neben3_ort | Neue Postkarte | -51.45 / 1.1 / 6.72 | () => neben3_auf('k3_ja') | async () => { const st = neben3_st('ja'); neben3_start('k3_ja', { x: -51.5, z: 6.7 }); st.n = (st.n… |
| neben3.js:715 | neben3_strasseBau | neben3_ort | Schild am Gartentor | -50 / 1.2 / 12.3 | () => neben3_auf('k3_ja') | () => { toast('„Objekt frei ab sofort. Ruhige Lage.“', 3000); setTimeout(() => say([['„Ruhig. Ja. T… |
| neben3.js:716 | neben3_strasseBau | neben3_ort | Die Haustür ist angelehnt | 46 / 1.3 / 12.2 | () => neben3_auf('k3_stein') | () => neben3_aydin() |
| neben3.js:717 | neben3_strasseBau | neben3_ort | Die Treppe von Nr. 6 | 22 / 1.1 / 12 | () => neben3_auf('k3_fehlt') && !neben3_st('fehlt').n1 | () => neben3_hilde1975() |
| neben3.js:718 | neben3_strasseBau | neben3_ort | Schild an der Haustür | 22.9 / 1.5 / 12.1 | () => neben3_auf('k3_fehlt') | () => { toast('„Keine Werbung. Keine Zeugen Jehovas. Kein Amt.“', 3200); setTimeout(() => say([['„D… |
| neben3.js:742 | st | neben3_ort | Rote Wolle am Zaunpfahl | 24.2 / .8 / -23.4 | () => neben3_frei() && !st().anh | async () => { const s = st(); neben3_start('zayn'); if (state.talking) return; if (!s.knoten) { s.k… |
| neben3.js:747 | st | neben3_ort | Anrufbeantworter („Speicher voll“) | 22.9 / Y + .8 / -12.6 | () => neben3_frei() && !st().ab | async () => { const s = st(); if (s.ab \|\| state.talking) return; s.ab = 1; state.talking = true; ne… |
| neben4.js:128 | neben4_gasBau | kirchberg_hit | () => n4_kerzeLabel(i) | x / y + .2 / z |  | () => n4_kerze(i) |
| neben4.js:151 | band | kirchberg_hit | () => neben4_S.st.gas && neben4_S.st.gas.w4 === 'da' ? 'Pol… | N4_KISTE[0] / .3 / N4_KISTE[1] |  | () => n4_kiste() |
| neben4.js:154 | band | kirchberg_hit | Mülltüte hinter der Tonne | N4_TUETE[0] / .35 / N4_TUETE[1] |  | () => n4_tuete() |
| neben4.js:160 | band | kirchberg_hit | Laternenpfahl · mit Hildes Kreide schreiben | lx / .9 / lz - .2 |  | () => n4_kreide() |
| neben4.js:322 | n4_schuppenBau | kirchberg_hit | N4_BRIEFE[k].label | x / y + .16 / z |  | () => n4_fach(k) |
| neben4.js:323 | n4_schuppenBau | kirchberg_hit | N4_BRIEFE.s75.label | R.x1 - .5 / .35 / C.z - .8 |  | () => n4_fach('s75') |
| neben4.js:323 | n4_schuppenBau | kirchberg_hit | N4_BRIEFE.s59.label | R.x1 - 1.0 / .35 / C.z - .8 |  | () => n4_fach('s59') |
| neben4.js:456 | n4_keinerKlick | katzen_klick | () => katzen_S.carry === k ? '' : 'Keiner hochheben' |  /  /  |  | () => n4_keinerNehmen() |
| neben5.js:84 | n5_jonasBau | kirchberg_hit | Nachttisch | N5_NACHT[0] / N5_Y + .4 / N5_NACHT[1] + .12 |  | () => n5_nachttisch() |
| neben5.js:89 | n5_jonasBau | kirchberg_hit | Etwas Glänzendes im Rinnstein | N5_KAPSEL[0] / .15 / N5_KAPSEL[1] |  | () => n5_kapsel() |
| neben5.js:223 | n5_heidiBau | kirchberg_hit | Postkarte auf dem Fensterbrett | W.x + .12 / W.y - .5 / W.z + .2 |  | () => n5_karte() |
| neben5.js:284 | n5_dinaBau | kirchberg_hit | () => n5_st('dina').foto && !n5_st('dina').fertig ? 'Das Fo… | wx + .45 / wy - .3 / wz |  | () => n5_fensterKlick() |
| neben5.js:285 | n5_dinaBau | kirchberg_hit | Dina | N5_DINA[0] / .65 / N5_DINA[1] |  | () => n5_dinaKlick() |
| neben5.js:351 | n5_kastenBau | kirchberg_hit | Der gelbe Kasten | N5_KASTEN[0] / .65 / N5_KASTEN[1] |  | () => toast(n5_st('kasten').brief === 'a' ? 'Leerung 17.00. Edda Brands Brief liegt da drin. Morgen… |
| neben5.js:455 | k5b | n5_huelle | () => n5_st('laube').gelesen ? 'Hildes Laube' : 'Hildes Lau… |  /  /  |  | () => n5_laube() |
| neben5.js:456 | k5b | n5_huelle | Kassenbuch · die letzte Seite |  /  /  |  | () => n5_kassenbuch() |
| neben5.js:457 | k5b | n5_huelle | Zapfinsel |  /  /  |  | () => toast(n5_offen('ow_kanister') && !(typeof k5 !== 'undefined' && k5.f.kanisterFoto) ? 'Vier ab… |
| neben5.js:458 | k5b | n5_huelle | Roter Kanister |  /  /  |  | () => toast('Ein roter Kanister im Schrott, leer. Auf dem Griff, eingeritzt: LUKE.', 3400) |
| neben5.js:459 | k5b | n5_huelle | Schrottauto · Kofferraum |  /  /  |  | () => { n5_gib('brecheisen'); try { Audio.play('metalOpen', { gain: .3, rate: 1.1, x: 130, y: 1, z:… |
| neben5.js:460 | k5b | n5_huelle | () => n5_item('brecheisen') ? 'Schuppentür aufbrechen' : 'S… |  /  /  |  | () => n5_schuppenTuer() |
| neben5.js:463 | J | n5_huelle | Hildes Antworten einwerfen · Fahne hoch |  /  /  |  | () => n5_einwerfen() |
| neben5.js:465 | H | n5_huelle | Heidi anrufen |  /  /  |  | () => n5_heidiAnruf() |
| neben6.js:71 | on | interact | () => !n6_offen() ? '' : n6_has('pell_' + i) ? 'Pells Heft … |  /  /  |  | () => n6_pellLesen(i) |
| neben6.js:79 | open | interact | () => n6_offen() && !(story.items \|\| []).includes('spindsch… |  /  /  |  | () => n6_schluessel() |
| neben6.js:84 | open | interact | () => !n6_offen() \|\| n6_falle() ? '' : n6_has('n67_spind') … |  /  /  |  | () => n6_spind() |
| neben6.js:87 | open | interact | () => !n6_offen() ? '' : !n6_has('pell_9') ? 'Im Handschuhf… |  /  /  |  | () => n6_rekorder() |
| nr4.js:49 | nr4_zettel | kirchberg_hit | 'Zettel · ' + NR4_ORT[id] | x / y / z |  | () => nr4_lesen(id) |
| nr4.js:145 | p | kirchberg_hit | () => S.kZiel ? 'Kühlschrank schließen' : 'Kühlschrank öffn… | cx / .85 / cz + D / 2 + .1 |  | () => { S.kZiel = S.kZiel ? 0 : 1; Audio.play(S.kZiel ? 'woodSqueak1' : 'woodClose1', { gain: .22, … |
| nr4.js:214 | fn | kirchberg_hit | Zwei Fotos im Flur | x0 + .2 / 1.62 / C.z + .9 |  | () => { S.steps.fotos = 1; openNote('Zwei Fotos im Flur', 'Links: Junge, acht, Zahnlücke, die Tanks… |
| nr4.js:221 | fn | kirchberg_hit | Treppe nach oben | x0 + .75 / 1 / C.z + 1.3 |  | () => nr4_wechsel('og') |
| nr4.js:223 | fn | kirchberg_hit | Kellertür | C.x - 1.6 / 1 / C.z + .3 |  | () => nr4_wechsel('keller') |
| nr4.js:241 |  | kirchberg_hit | Kassetten | x1 - .2 / 1.3 / C.z + 1.6 |  | () => { if (nr4_S.steps.heino) return toast('Hildes Kassetten. Handschrift auf jeder Hülle. Eine Lü… |
| nr4.js:244 |  | kirchberg_hit | Fotoalbum | C.x + 4.2 / .55 / C.z + 2.3 |  | () => nr4_lesen('album') |
| nr4.js:280 | fn | kirchberg_hit | () => kapAb(3) ? 'Peters Zimmer' : 'Durchs Schlüsselloch se… | C.x + 3 / 1.1 / C.z + .25 |  | () => nr4_schluesselloch() |
| nr4.js:295 |  | kirchberg_hit | Treppe nach unten | a0 + .3 / 1.05 / b1 - .75 |  | () => nr4_wechsel('eg') |
| nr4.js:309 |  | kirchberg_hit | Poster von 2016 | O.x - .2 / 1.55 / b0 + .25 |  | () => toast('„Die Nebelkrähen · live · Alte Schmiede · 2016“. Eine Ecke ist schon oft abgelöst word… |
| nr4.js:329 |  | kirchberg_hit | Kellertreppe hinauf | c0 + .65 / 1 / d1 - 3.0 |  | () => nr4_wechsel('eg') |
| nr4.js:339 |  | kirchberg_hit | Pfandkisten | K.x - .6 / .4 / d0 + .7 |  | () => nr4_domino() |
| nr4.js:383 | put | kirchberg_hit | Hundenapf | -46.1 / .3 / -11.35 |  | () => { toast('Ein Blechnapf mit Regenwasser. Weiße Lackschrift: FLOCKE.', 3400); setTimeout(async … |
| nr4.js:394 | put | kirchberg_hit | Hakenbrett mit fünf Bechern | -55.7 / Yh + 1.55 / -14.3 |  | () => openNote('Die Becher', 'Fünf, selbst getöpfert: MAMA. PAPA, der Henkel geklebt. LUCY. LUKE. D… |
| nr4.js:398 | put | kirchberg_hit | Blaues Kinderrad | -44.55 / Yh + .45 / -13.2 |  | () => { toast('Dein blaues Kinderrad. Kein Kratzer, keine Delle.', 3000); nr4_flocke('rad'); } |
| nr4.js:402 |  | kirchberg_hit | Kinderkiste | -55.4 / Yh + .3 / -21.2 |  | () => openNote('Jonas’ Regelseite', '<span class="hand" style="font-family:\'Caveat\';color:#8a1010… |
| nr4.js:405 |  | kirchberg_hit | Kommodenschublade | -45.2 / Yh + .85 / -21.4 |  | () => openNote('Kinderuntersuchungsheft', 'Gelb. Brandt, Luke. U11: o. B. (Stempel, Frühjahr 2009).… |
| nr4.js:412 |  | kirchberg_hit | Zwischen Mamas Mänteln | -44.5 / Yh + 1 / -20.2 |  | () => openNote('Ein Kinderschuh', 'Blau, Klettverschluss, Größe 33. Nur der linke.', 'nr1_schuh', (… |
| post.js:140 | post_schuppenAussen | kirchberg_hit | () => kirchberg_offen('schuppen') ? 'Schuppen betreten' : '… | x + .3 / 1.2 / z |  | () => { if (kirchberg_offen('schuppen')) return kirchberg_rein('schuppen'); kirchberg_start('ow_kas… |
| post.js:199 | post_nr9Bau | kirchberg_hit | Küchenfenster (ein Brett fehlt) | 52.75 / 1.75 / -21.8 |  | () => post_durchsFenster() |
| post.js:201 | post_nr9Bau | kirchberg_hit | Hintertür (Scheibe) | 47.8 / 1.1 / -21.8 |  | () => post_blatt212() |
| post.js:205 | post_nr9Bau | kirchberg_hit | Zettel im Briefkastenschlitz | 51.45 / 1.36 / -6.95 |  | () => post_meldezettel() |
| post.js:230 | bx | kirchberg_hit | Gartenzaun | xl / .4 / z0 |  | () => { post_S.steps.zaun = 1; kirchberg_start('k1_butter'); toast('Zwei Latten unten auseinanderge… |
| post.js:291 | post_autoBau | interact | Handschuhfach |  /  /  |  | () => post_handschuhfach() |
| post.js:360 | fn | kirchberg_hit | Eine Postkarte im Gras | -53.4 / .1 / 9.4 |  | () => { S.steps.karte17 = 1; k.visible = false; kirchberg_an(S.k17Hit, false); Audio.paper(); toast… |
| sammeln.js:334 | setPos | interact | () => o.label \|\| (art === 'z' ? 'Eine Zeitung' : 'Ein loses… |  /  /  |  | () => { if (art === 'z') sammeln_z(nr); else sammeln_sb(nr); } |
| sammeln.js:359 | sammeln_schatz | interact | () => sammeln_hat('J05_fund') ? 'Aufgewühlte Erde' : 'Drei … |  /  /  |  | () => { if (sammeln_hat('J05_fund')) return toast('Hier war Jonas’ Schatz. Jetzt ist er in deiner T… |
| strasse.js:143 | clickOn | interact | label |  /  /  |  | fn |
| strasse.js:145 | reTalk | interact | Autotür |  /  /  |  | lockedTalk(lines, c.position.x, c.position.z) |
| strasse.js:172 | seat | interact | () => story.photos.has(1) ? '' : 'Polaroid nehmen' |  /  /  |  | () => { if (story.photos.has(1)) return; pm.userData.action(); if (story.photos.has(1)) uninteract(… |
| strasse.js:267 |  | interact | () => st.open ? 'Briefkasten schließen' : 'Briefkasten öffn… |  /  /  |  | () => { st.open = !st.open; tween(piv, { rx: st.open ? 1.45 : 0 }, st.open ? .45 : .3); Audio.play(… |
| strasse.js:335 | roadSign | interact | Ortstafel |  /  /  |  | () => toast(state.ch1Done \|\| (typeof kap === 'function' && kap() >= 2) ? 'Lost Eyengless. Darunter … |
| strasse.js:338 | roadSign | interact | Schild lesen |  /  /  |  | () => openNote('Schild der Gemeinde', '<b>GEMEINDE LOST EYENGLESS</b>\nNACHTRUHE 3 – 4 UHR\nStraße … |
| strasse.js:343 | roadSign | interact | Absperrung |  /  /  |  | () => toast('Gesperrt. Kein Schild sagt, warum. Hinter den Blöcken verschwindet der Asphalt im Nebe… |
| strasse.js:371 | hand | makeDoor |  | gx /  / gz + .515 |  |  |
| strasse.js:376 | fr | interact | () => D.open ? 'Tür schließen' : 'Tür öffnen' |  /  /  |  | doorAction(D, '') |
| strasse.js:392 | fr | interact | Zettel an der Wand |  /  /  |  | () => liftTo(note, () => openNote('Zettel in der Telefonzelle', 'Mit Klebeband an die Wand geklebt,… |
| strasse.js:435 | put | interact | Hydrant |  /  /  |  | () => toast('Neben dem Hydranten: Kreidestriche. Sieben, vom Regen fast weggewaschen. Der achte ist… |
| strasse.js:442 | put | interact | Müll |  /  /  |  | () => toast('Seit Wochen holt niemand mehr etwas ab. Aus einem aufgerissenen Sack quellen Vermisste… |
| strasse.js:446 | put | interact | Gullydeckel |  /  /  |  | () => { n++; // STORY-HOOK: die Stadt unter dem Gully if (n === 1) { for (let i = 0; i < 3; i++) se… |
| strasse.js:480 | posterOn | interact | Zettel lesen |  /  /  |  | () => openNote(d.note[0], d.note[1], d.note[2]) |
| strasse.js:498 | place | interact | label |  /  /  |  | () => { toast(text, 4600); onUse && onUse(o); } |
| tausch.js:369 | tausch_glint | interact | label |  /  /  |  | act |
| tausch.js:379 | tausch_dropMake | tausch_glint | Etwas glänzt | D.x / D.y / D.z |  | () => tausch_dropNimm(D) |
| tausch.js:454 | tausch_fundeSync | tausch_glint | Etwas glänzt | F.at[0] / y / F.at[1] |  | () => tausch_finde(F) |
| tiefwald.js:245 | note | interact | label |  /  /  |  | fn |
| uebergang.js:45 | uebergang_art | interact | Zeichnungen ansehen |  /  /  |  | () => toast('Kinderzeichnungen. Immer dasselbe Motiv. Manche sind mit deinem Namen signiert.', 4500) |
| uebergang.js:47 | uebergang_art | interact | () => !state.ch1Done ? 'Zeichnungen ansehen' : story.items.… |  /  /  |  | () => { if (!state.ch1Done) return toast('Ein Blatt hängt schief. Dahinter klingt die Wand hohl – w… |
| uebergang.js:157 | uebergang3_nachAbspann | interact | Stablampe aufheben |  /  /  |  | () => { uninteract(S.lampHit); S.lampeLiegt = false; S.lampTaken = true; if (S.lamp) S.lamp.visible… |
| uebergang.js:158 | uebergang3_nachAbspann | interact | Die Leiter hinaufsteigen (E halten) |  /  /  |  | () => uebergang3_climb() |
| uebergang.js:204 | uebergang3_ende | interact | Absperrband |  /  /  |  | () => toast('„GASLECK · BETRETEN VERBOTEN.“ Dahinter riecht es nach kaltem Rauch. Jemand hat das Lo… |
| verstecke.js:54 | hlObj | interact | () => O.art === 'unten' ? (crouchK > .6 ? 'Hervorholen' : '… |  /  /  |  | () => vst_nimm(O) |
| villa.js:75 | villa_hit | interact | label |  /  /  |  | act |
| villa.js:239 | add | villa_hit | Speisekammer | -978.6 / 1.05 / R.z1 - .3 |  | () => toast('Die Speisekammertür ist zu. Dahinter kaut jemand. Oder lauscht. Bei Vegas ist das schw… |
| villa.js:300 | villa_azKartenwand | villa_hit | () => villa_hat('klappe') ? 'Fach am Kartenrahmen' : 'Messi… | X + .08 / by / cz |  | () => villa_klappeText() |
| villa.js:313 | villa_anBatterien | villa_hit | Drei Batterien | cx / y + .06 / cz |  | () => { if (villa_hat('batt3')) return; villa_setz('batt3'); for (const b of VILLA.o.batt) b.visibl… |
| villa.js:336 | villa_krSicherungen | villa_hit | Nach draußen | cx / 1.1 / R.z1 - .25 |  | () => villa_nr3Raus() |
| villa.js:366 | ch | villa_hit | () => villa_hat('lucy') ? 'Lucy' : 'Lucy' | R.x0 + .7 / .6 / 857.9 |  | () => villa_lucyNochmal() |
| villa.js:367 | ch | villa_hit | Vegas | -979.9 / .95 / 858.2 |  | () => villa_vegasNochmal() |
| villa.js:376 | ch | villa_hit | Nach draußen | -983.8 / 1.1 / R.z0 + .3 |  | () => villa_nr9Raus() |
| villa.js:395 |  | villa_hit | Ringbuch | -976.3 / .9 / 897 |  | () => villa_nr9Ringbuch() |
| villa.js:396 |  | villa_hit | Dienstplan | R.x1 - .2 / 1.5 / 899.2 |  | () => { villa_note('Dienstplan · Posten 9', villa_masch('Mo N11 · Di N12 · Mi N11 · <u><b>Do AMT</b… |
| villa.js:397 |  | villa_hit | () => villa_hat('da10') ? 'Schwarzes Brett' : 'Schwarzes Br… | R.x1 - .2 / 1.55 / 897.3 |  | () => villa_nr9Brett() |
| villa.js:398 |  | villa_hit | Durch das Kameraloch sehen | -977.2 / 1.2 / 900.3 |  | () => villa_nr9Kamera() |
| villa.js:401 |  | villa_hit | Klappstuhl | -977.6 / .5 / 899.6 |  | () => { villa_note('Auf dem Klappstuhl', 'Ein Kreuzworträtselheft, halb gelöst. Eine Lösung ist mit… |
| villa.js:402 |  | villa_hit | Thermoskanne und Aschenbecher | -976.4 / .3 / 899.9 |  | () => toast('Eine Thermoskanne, kalt. Ein Aschenbecher voller Kippen ohne Filter. Daneben Butterbro… |
| villa.js:409 |  | villa_hit | In die Halle | R.x1 - .25 / 1.1 / 898 |  | () => villa_geh('halle', { p: VILLA_TUER.halleW }) |
| villa.js:423 |  | villa_hit | Aktenschrank | R.x0 + .5 / .7 / 897.8 |  | () => villa_azSchrank() |
| villa.js:430 |  | villa_hit | Weltkarte mit Nadeln | R.x0 + .2 / 1.75 / 901.6 |  | () => villa_azKarte() |
| villa.js:442 |  | villa_hit | Fotowand | -918.8 / 1.65 / R.z0 + .3 |  | () => villa_azFotos() |
| villa.js:447 |  | villa_hit | () => villa_hat('sb08') ? 'Asservatenkiste (offen)' : 'Kist… | -917.6 / .25 / 899.4 |  | () => villa_azAsservat() |
| villa.js:448 |  | villa_hit | Schreibtisch | -917.2 / .9 / 899.2 |  | () => villa_azTisch() |
| villa.js:449 |  | villa_hit | Bücherwand | -917.8 / 1.1 / R.z1 - .35 |  | () => villa_note('Die Bücherwand', 'Fachliteratur, Reihe um Reihe. Dazwischen ein Taschenbuch: <b>„… |
| villa.js:450 |  | villa_hit | Schreibtischstuhl | -917 / .5 / 898.3 |  | () => toast(villa_hat('stuhl') ? 'Die Sitzfläche ist warm. Der Stuhl ist zur Fotowand gedreht.' : '… |
| villa.js:458 |  | villa_hit | In die Halle | R.x0 + .25 / 1.1 / 900 |  | () => villa_geh('halle', { p: VILLA_TUER.halleO }) |
| villa.js:466 |  | villa_hit | () => villa_item('dienstnadel') ? 'Dienstbotentreppe · Nade… | -887.6 / 1.1 / R.z1 - .3 |  | () => villa_anOben() |
| villa.js:470 |  | villa_hit | () => villa_item('dienstnadel') ? 'Kellertür · Nadel in den… | -889.4 / 1.1 / R.z0 + .3 |  | () => villa_anUnten() |
| villa.js:482 |  | villa_hit | Dienstbotentreppe hinunter | -896 / 1.1 / R.z0 + .3 |  | () => villa_ogRunter() |
| villa.js:508 |  | villa_hit | Regal BESTAND · Bestandsliste | VILLA.o.regal['BE… / 1.1 / 932 |  | () => villa_ogBestand() |
| villa.js:509 |  | villa_hit | Regal VERSUCHSREIHE K · die K-Akten | VILLA.o.regal['VE… / 1.1 / 932 |  | () => villa_ogKAkten() |
| villa.js:510 |  | villa_hit | Regal LISTEN · vier Mappen | VILLA.o.regal['LI… / 1.1 / 932 |  | () => villa_ogListen() |
| villa.js:511 |  | villa_hit | Regal BERGUNG · Karton „W“ | VILLA.o.regal['BE… / 1.1 / 932 |  | () => villa_ogPell() |
| villa.js:512 |  | villa_hit | Regal OBJEKT DREIPUNKT | VILLA.o.regal['OB… / 1.1 / 932 |  | () => villa_ogDreipunkt() |
| villa.js:513 |  | villa_hit | Regal KORRESPONDENZ | VILLA.o.regal['KO… / 1.1 / 932 |  | () => toast('Briefe an eine Regionalleitung, Briefe von einer Regionalleitung. Jeder zweite endet m… |
| villa.js:514 |  | villa_hit | Tisch · Formblatt 8 | -900.5 / .9 / 929.6 |  | () => villa_ogFormblatt() |
| villa.js:515 |  | villa_hit | Garderobenschrank | R.x0 + .5 / 1.05 / 929.2 |  | () => villa_verstecken('schrank') |
| villa.js:516 |  | villa_hit | Vorhang am Fenster | -903.4 / 1.1 / R.z0 + .35 |  | () => villa_verstecken('vorhang') |
| villa.js:517 |  | villa_hit | Heinrichs Bett | -887.2 / .4 / 930.8 |  | () => villa_verstecken('bett') |
| villa.js:518 |  | villa_hit | Teedose aus Blech | -888.4 / .75 / 932.5 |  | () => villa_ogTeedose() |
| villa.js:519 |  | villa_hit | Heizung | -886.4 / .5 / 928.4 |  | () => toast('Die Heizung ist bis zum Anschlag aufgedreht. Fünf. Der Mantelhaken daneben ist leer. U… |
| villa.js:520 |  | villa_hit | Beschlagene Scheibe | -889.6 / 1.55 / R.z0 + .3 |  | () => toast('Es ist so warm, dass die Scheibe beschlägt. Und in der beschlagenen Scheibe steht, von… |
| villa.js:532 |  | villa_hit | Kellertreppe hinauf | R.x0 + .25 / 1.1 / 869 |  | () => villa_krRauf() |
| villa.js:571 | glas | villa_hit | Sicherungskasten | -898.3 / 1.35 / 867.3 |  | () => villa_krKasten() |
| villa.js:572 | glas | villa_hit | ∴-1 | -903.6 / ty + .4 / 868.8 |  | () => villa_krGlas1() |
| villa.js:573 | glas | villa_hit | ∴-2 | -902.65 / ty + .4 / 869.2 |  | () => villa_note('∴-2', 'Leer. Schon lange. Innen ein trockener Rand, wie in einer Vase, in der sei… |
| villa.js:574 | glas | villa_hit | Beobachtungsblatt DREIPUNKT | -903.1 / ty + .55 / 868.62 |  | () => villa_note('Beobachtungsblatt DREIPUNKT', villa_masch('∴-1 · gefangen 1958, Eisennetz · † sof… |
| villa.js:575 | glas | villa_hit | Nierenschale | -904.1 / ty + .1 / 869.5 |  | () => villa_krSplitter() |
| villa.js:587 |  | villa_hit | Schild an der Tür | -890.5 / 1.5 / 868.85 |  | () => villa_krSchild() |
| villa.js:588 |  | villa_hit | Tonbandgerät · „Marion 2009“ | -888.6 / .6 / 868.1 |  | () => villa_krBand() |
| villa.js:589 |  | villa_hit | Das Bett | -890.2 / .45 / 867.3 |  | () => toast('Ein Bett, frisch bezogen. Ein Kopfkissen mit Knick in der Mitte, wie im Hotel. Am Fuße… |
| villa.js:783 | villa_halleTueren | interact | Westtür · Arbeitszimmer |  /  /  |  | () => villa_geh('az') |
| villa.js:784 | villa_halleTueren | interact | Osttür · Anrichte |  /  /  |  | () => villa_geh('an') |
| villa.js:787 | villa_halleTueren | interact | Wolters Thermoskanne |  /  /  |  | () => villa_teeTrinken() |
| villa.js:1191 | villa_tagLicht | interact | () => villa_hat('lucy') ? 'Nr. 3 · Vegas' : 'An Vegas’ Tür … |  /  /  |  | () => villa_nr3Klopfen() |
| villa.js:1192 | villa_tagLicht | interact | Garagentor Nr. 9 · einen Spalt offen |  /  /  |  | () => villa_nr9Rein() |
| villa.js:1193 | villa_tagLicht | interact | Nachsorge 11 ansprechen |  /  /  |  | () => villa_ag12Kombi() |
| wald.js:67 | chunk | interact | () => S.fakeGone && !story.lore.some(l => l.key === 'wald_f… |  /  /  |  | () => wald_fakeFund() |
| wald.js:88 | run | interact | Schild lesen |  /  /  |  | () => { if (!story.lore.some(l => l.key === 'wald_schild')) story.lore.push({ key: 'wald_schild', t… |
| wald.js:150 | wald_beasts | interact | () => story.lore.some(l => l.key === 'wald_welpe') ? 'Die o… |  /  /  |  | () => wald_pup() |
| weiss.js:88 | weiss_trail | interact | () => ch3.schrank ? 'Der Schrank (leer)' : 'Den Schrank öff… |  /  /  |  | () => weiss_schrank() |
| weiss.js:253 | weiss_hildeEnde | interact | WEISS_SPUR[i].label |  /  /  |  | () => weiss_spur(i + 1) |
| weiss.js:422 | weiss_f3Bau | interact | () => it.name |  /  /  |  | () => weiss_r1Sehen(k, it) |
| weiss.js:426 | weiss_f3Bau | interact | Der Mann auf dem Stuhl |  /  /  |  | () => weiss_voss() |
| weiss.js:523 | weiss_haendeAuftrag | interact | () => (k === 'mira' && WEISS_F3.stellen.has('handschuh') &&… |  /  /  |  | () => weiss_stelle(k) |
| whiskey.js:505 | whiskey_klick | interact | () => whiskey_label() |  /  /  |  | () => whiskey_klick() |
| zayn.js:34 | spot | interact | () => zayn_has('zayn_spur_' + k) ? '' : ZAYN_SPUR.find(s =>… |  /  /  |  | () => zayn_take(k) |
| zayn.js:36 | open | spot |  | 'murmel' / 30.6 / .015 |  |  |
| zayn.js:37 | open | spot |  | 'kreide' / 17.6 / .012 |  |  |
| zayn.js:42 | open | spot |  | 'brause' / 35.3 / .42 |  |  |
| zayn.js:51 | kid | interact | Kinderzeichnung |  /  /  |  | () => zayn_drawing() |
| zayn.js:55 | kid | interact | () => zayn_has('zayn_radio') ? 'Altes Radio' : 'Altes Radio… |  /  /  |  | () => zayn_radio() |
| zayn.js:60 | kid | interact | Zeichnung auf dem Boden |  /  /  |  | () => zayn_last() |
| zayn.js:70 | zayn_placeBag | interact | zayn_bagLabel |  /  /  |  | () => zayn_bag() |
| zayn.js:144 | zayn_shoeDropped | interact | () => zayn_has('zayn_spur_schuh') ? '' : 'Ein Kinderschuh' |  /  /  |  | () => zayn_take('schuh') |
| zayn.js:202 | ia | interact | zayn_bagLabel |  /  /  |  | () => zayn_bag() |
| zeichen.js:372 | zeichen_wandMauer | interact | Wandbild ansehen |  /  /  |  | () => zeichen_wandAnsehen() |
| zimmer7.js:133 | hit | interact | label |  /  /  |  | fn |
| zimmer7.js:163 | along | makeDoor |  | X + 33 /  / Z - 2.08 |  |  |
| zimmer7.js:165 | along | interact | () => D.locked ? 'Zimmer 7' : D.open ? 'Tür schließen' : 'T… |  /  /  |  | z7_doorUse |

## Statische Fundstellen: Sammel-Quellen (229)

### addItem (81)

| Datei:Zeile | Funktion | Schlüssel | weitere Argumente |
|---|---|---|---|
| _base_source_index.html:2727 | photoWayUpdate | key |  |
| _base_source_index.html:2770 | doorAction | tape |  |
| _base_source_index.html:2820 | checkHome | collar |  |
| _base_source_index.html:2829 | checkHome | phone |  |
| _base_source_index.html:3802 | drawBoard | fuse |  |
| _base_source_index.html:4324 | readBook | buch |  |
| albers.js:160 | albers_k1Klopfen | ring_hufeisen |  |
| albers.js:160 | albers_k1Klopfen | euro_bruno |  |
| albers.js:168 | albers_k1Halsband | collar |  |
| albers.js:202 | albers_k3Umschlag | n3_kapschluessel |  |
| albers.js:209 | albers_k3Ordner | n3_ordner |  |
| amt.js:948 | amt_nummer | wartenummer |  |
| amt.js:997 | amt_leiterNehmen | leiter_amt |  |
| amt.js:1110 | amt_akte08 | umschlag7 |  |
| anwesen.js:20 | anwesen_give | schluesselteile |  |
| anwesen.js:102 |  | schluesselteile |  |
| anwesen.js:167 | anwesen_press | villaschluessel |  |
| ausbau_nord.js:874 | ausbau_nord_takeLantern | nord_lantern |  |
| ausbau_nord.js:902 | ausbau_nord_teddy | nord_baer |  |
| ausbau_ost_west.js:373 | item | k |  |
| ausbau_ost_west.js:425 |  | drahtschneider |  |
| ausbau_ost_west.js:566 | ausbau_ost_west_seite1 | ow_seiten |  |
| ausbau_ost_west.js:660 | ausbau_ost_west_aydin | alupaeckchen |  |
| ausbau_ost_west.js:672 | ausbau_ost_west_dinaFund | alufolie |  |
| ausbau_ost_west.js:683 | ausbau_ost_west_dinaFund | dina_zeichnung |  |
| ausruestung.js:29 | ausruestung_spot | brechstange |  |
| ausruestung.js:44 | ausruestung_spot | sicherung |  |
| beobachter.js:258 | onClose | murmel |  |
| cleo.js:89 | cleo_chest | cleo_dose |  |
| cleo.js:91 | cleo_chest | cleo_kreide |  |
| cleo.js:91 | cleo_chest | cleo_dose |  |
| feuer.js:291 | giveLighter | feuerzeug |  |
| feuer.js:432 | done | feuerzeug |  |
| geheimnisse.js:114 | geheimnisse_takeStone | geh_lichtstein |  |
| justin.js:502 | justin_antwort | G[0] |  |
| justin.js:506 | justin_antwort | F[0] |  |
| kamera.js:16 | kamera_frei | polaroid_kamera |  |
| kapitel1.js:277 | kapitel1_briefkasten | key |  |
| kapitel1.js:395 | kapitel1_band | tape |  |
| kapitel3.js:139 | kapitel3_zaehlbuch | buch |  |
| kapitel5.js:36 | k5_item | k |  |
| kiffen.js:57 | kiffen_nimm | key |  |
| kirchberg.js:294 | kirchberg_naepfeFinale | futterdose |  |
| lwo.js:710 | lwo_senderAnsehen | sender |  |
| lwo.js:923 | hook | kaugummipapier |  |
| lwo.js:926 | hook | thermoskanne |  |
| neben3.js:84 | neben3_joker | n3_glocke |  |
| neben3.js:338 | action | n3_brecheisen |  |
| neben3.js:363 | onClose | predigtmappe |  |
| neben3.js:426 | neben3_rekorder | n3_kassette_peter |  |
| neben3.js:494 | luna | n3_pfarrschluessel |  |
| neben3.js:570 | neben3_kiste | n3_lieferschein |  |
| neben3.js:584 | stelle | n3_schuh |  |
| neben3.js:661 | onClose | n3_kassette_band |  |
| neben4.js:252 | neben4_haushaltsbuch | haushaltsbuch |  |
| neben4.js:356 | n4_zusammenbruch | thermos_bfr |  |
| neben4.js:423 | n4_weltFertig | tonband_ast |  |
| neben5.js:51 | n5_gib | k |  |
| neben6.js:175 | n6_band | pell_kassette |  |
| neben6.js:183 | n6_schluessel | spindschluessel |  |
| neben6.js:197 | n6_spind | lampion |  |
| nr4.js:241 |  | heino |  |
| post.js:264 | post_handschuhfach | lucy_zigaretten |  |
| tiefwald.js:506 | tief_lager | jonas_karte |  |
| traum.js:312 | traum_awake | fibel |  |
| villa.js:767 | villa_da10 | da10 |  |
| villa.js:804 | villa_bett | dienstnadel |  |
| villa.js:1106 | villa_w11Akte | miras_ring |  |
| wald.js:196 | wald_pupFrei | jonas_messer |  |
| wald.js:196 | wald_pupFrei | plombe |  |
| whiskey.js:270 | ok | autoschluessel |  |
| whiskey.js:360 | ok | lwo_kuli |  |
| whiskey.js:400 | ok | baumhausschluessel |  |
| whiskey.js:413 | ring | miras_ring |  |
| whiskey.js:447 | ok | baumhausschluessel |  |
| zayn.js:73 | zayn_bag | zayn_kamera |  |
| zayn.js:181 | zayn_kassette | zayn_kassette |  |
| ziele.js:231 | done | k |  |
| zimmer7.js:54 | z7_protokoll | zimmer7 |  |
| zimmer7.js:74 | z7_takeKey | fuse |  |
| zimmer7.js:83 | z7_takeAushang | einwilligungen |  |

### modItem (69)

| Datei:Zeile | Funktion | Schlüssel | weitere Argumente |
|---|---|---|---|
| _base_source_index.html:2995 | modItem | k | name, desc, icon |
| albers.js:160 | albers_k1Klopfen | ring_hufeisen | 'Schlüsselring mit Hufeisen', 'Eisern. Von Vegas. „Nimm das Hufeisen nie ab.“', 'key' |
| albers.js:160 | albers_k1Klopfen | euro_bruno | 'Eine Euromünze', 'Pfandgeld. Ehrlich verdient. Von Bruno.', 'paper' |
| albers.js:202 | albers_k3Umschlag | n3_kapschluessel | 'Kapellenschlüssel', 'Ein großer Eisenschlüssel mit Kordel. Kapellentür und das Gitter de… |
| albers.js:209 | albers_k3Ordner | n3_ordner | 'Vegas’ Ordner', '„DIE WAHRHEIT · BAND 3 · NICHT ANFASSEN“, mit Alufolie beklebt. In drei… |
| album.js:623 | album_reiter | fotoalbum | 'Fotoalbum', 'Leder, ein Riemen mit Druckknopf, Fotoecken auf jeder Seite. [' + album_tas… |
| amt.js:36 | amt_trust | wartenummer | 'Wartenummer 8', 'Aus dem Nummernautomaten im Tunnel. Eine 8, schwarz auf Pappe. Wird nie… |
| amt.js:37 | amt_trust | leiter_amt | 'Leiter', 'Eine Holzleiter aus dem Sicherungsraum. Schwer, und sie klappert bei jedem Sch… |
| amt.js:38 | amt_trust | umschlag7 | 'Brauner Umschlag', '„BfR · AST LE · DURCHSCHLAG · VERTRAULICH“. Aus dem Fach mit Akte 08… |
| anwesen.js:20 | anwesen_give | schluesselteile | 'Schlüsselteile', `Geschmiedete Teile eines großen Schlüssels, gestempelt 01–08. Gefunden… |
| anwesen.js:102 |  | schluesselteile | 'Schlüsselteile', `Geschmiedete Teile eines großen Schlüssels, gestempelt 01–08. Gefunden… |
| anwesen.js:166 | anwesen_press | villaschluessel | 'Schlüssel der Villa Seiler', 'Aus acht Teilen gepresst. Schwer, noch warm. Der Bart hat … |
| ausbau_ost_west.js:660 | ausbau_ost_west_aydin | alupaeckchen | 'Päckchen in Alufolie', 'Für Dina. Warm. „Die Alufolie bringst du zurück, die ist von mei… |
| ausbau_ost_west.js:672 | ausbau_ost_west_dinaFund | alufolie | 'Alufolie', 'Von Frau Aydıns Mutter. Zurückbringen.', 'paper' |
| ausbau_ost_west.js:683 | ausbau_ost_west_dinaFund | dina_zeichnung | 'Dinas Zeichnung', 'Sieben Kreise mit Flamme und Stiel. Vier durchgestrichen.', 'paper' |
| cleo.js:17 | cleo_start | cleo_kreide | 'Weiße Kreide', 'Ein Stück Kreide, mit Klebeband umwickelt. Auf dem Band, in Kinderschrif… |
| cleo.js:18 | cleo_start | cleo_dose | 'Keksdose mit acht Kronkorken', 'Sieben tragen Filzstift-Buchstaben: R, H, M, D, L, L, Z.… |
| geheimnisse.js:42 | geheimnisse_plate | geh_lichtstein | 'Ein Lichtstein', 'Ein kleiner Stein, warm wie eine Hand. Hart, matt, grauweiß. Innen Ade… |
| justin.js:498 | justin_antwort | G[0] | G[1], G[2], 'paper' |
| justin.js:506 | justin_antwort | F[0] | F[1], F[2], 'paper' |
| kamera.js:14 | kamera_item | polaroid_kamera | 'Hildes Kamera', kamera_desc(), 'polaroid' |
| kapitel3.js:291 | kapitel3_hufeisen | buch | 'Hildes Zählbuch', 'Ein grünes Kassenbuch mit Stoffrücken. Dreißig Jahre Nächte. Wird noc… |
| kapitel5.js:36 | k5_item | k | name, desc, icon |
| kapitel6.js:166 | open | pfandflasche | 'Pfandflasche', 'Bier, acht Cent. „Wenn ich das überlebe, ist das mein Anfang.“', 'paper' |
| kapitel6.js:167 | open | seitenschneider | 'Seitenschneider', 'Aus der Werkzeugtasche der Bergung. Schneidet Draht.', 'key' |
| kapitel6.js:168 | open | bergungsfunk | 'Funkgerät der Bergung', 'Vom toten Blechmann. Es rauscht, als würde jemand zuhören.', 'p… |
| kirchberg.js:294 | kirchberg_naepfeFinale | futterdose | 'Katzenfutterdose', 'Rind in Soße. Der Deckel glänzt.', 'paper' |
| lwo.js:923 | hook | kaugummipapier | 'Kaugummipapier', 'Lucid Mint. Innen ein Kreis, darin ein offenes Auge über einer Flamme.… |
| lwo.js:926 | hook | thermoskanne | 'Thermoskanne', 'Wolters Thermoskanne. Noch warm. Riecht nach Pfefferminz und Blech.', 'p… |
| neben3.js:84 | neben3_joker | n3_glocke | 'Die Glocke', 'Drei, Pause, dreizehn. Einmal in dieser Nacht.', 'key' |
| neben3.js:338 | action | n3_brecheisen | 'Brecheisen', 'Aus dem Vorbau des Pfarrhauses. Rostig, schwer.', 'key' |
| neben3.js:363 | onClose | predigtmappe | 'Predigtmappe', 'Schwarzes Leder, Aufkleber einer Konfirmandenfreizeit. Zwölf Predigten, … |
| neben3.js:426 | neben3_rekorder | n3_kassette_peter | 'Kassette „Peter“', 'Etikett „MARION · FÜR K-1“, „K-1“ mit Kuli durchgestrichen, darüber … |
| neben3.js:494 | luna | n3_pfarrschluessel | 'Pfarrhausschlüssel', 'Messing, Korkanhänger: „PFARRHAUS – NICHT DER KAPELLE“.', 'key' |
| neben3.js:570 | neben3_kiste | n3_lieferschein | 'Lieferschein', 'BfR · AST 7 → AST 3 · LAGUNE. „Absender siehe Empfänger.“', 'paper' |
| neben3.js:584 | stelle | n3_schuh | 'Kinderschuh, rechts', 'Größe 33, rechts, Klettverschluss. Nur einer.', 'paper' |
| neben3.js:661 | onClose | n3_kassette_band | 'Kassette „Außenkamera“', '„NICHT ÜBERSPIELEN“, darunter das Auge.', 'paper' |
| neben4.js:252 | neben4_haushaltsbuch | haushaltsbuch | 'Oma Ernas Haushaltsbuch', 'Grünes Kassenbuch, Stoffrücken – dasselbe Modell wie Hildes Z… |
| neben4.js:356 | n4_zusammenbruch | thermos_bfr | 'Günthers Thermoskanne', 'Grau, zerbeult, Aufkleber „BfR – Wir bringen Sie heim“. Kaffee,… |
| neben4.js:423 | n4_weltFertig | tonband_ast | 'Tonband · Kanal 3', '„Kanal 3 · alle AST · 1992“. Funkfetzen aus neun Außenstellen. Eine… |
| neben4.js:488 | n4_kanneTick | thermoskanne | 'Wolters Thermoskanne', 'Von der Bushaltestelle (Kap. 3). Innen riecht sie nach Fenchel. … |
| neben4.js:491 | n4_kanneTick | thermoskanne | 'Thermoskanne G. W.', 'Wolters Kanne. ' + (gab ? '„Behalten Sie sie. Sie werden frieren, … |
| neben4.js:511 | onRein | thermoskanne | S.st.kanne.fertig ? 'Thermoskanne G. W.' : 'Wolters Thermoskanne', 'Auf dem Boden, unter … |
| neben4.js:512 | onRein | haushaltsbuch | 'Oma Ernas Haushaltsbuch', 'Grünes Kassenbuch, Stoffrücken – dasselbe Modell wie Hildes Z… |
| neben4.js:513 | onRein | tonband_ast | 'Tonband · Kanal 3', '„Kanal 3 · alle AST · 1992“.', 'paper' |
| neben4.js:513 | onRein | thermos_bfr | 'Günthers Thermoskanne', '„BfR – Wir bringen Sie heim“.', 'paper' |
| neben5.js:51 | n5_gib | k | I[0], I[1], 'paper' |
| neben5.js:484 | add | k | n, d, 'paper' |
| neben6.js:53 | on | spindschluessel | 'Schlüsselbund „3“', 'Zwei kleine Schlüssel an einem Ring. Ein Blechanhänger mit einer 3 … |
| neben6.js:54 | on | lampion | 'Annis Lampion', 'Pergamentpapier, eine Sonne aus Buntpapier, ein Blechkerzenhalter ohne … |
| neben6.js:55 | on | pell_kassette | 'Kassette „Come home, W.“', 'Pells Band aus dem Rekorder im Wrack. Jonas hat draufgeschri… |
| nr4.js:241 |  | heino | 'Heino-Kassette', 'Glitzernde Hülle. Hildes Schrift: „Nicht von mir.“', 'paper' |
| post.js:264 | post_handschuhfach | lucy_zigaretten | 'Lucys Zigaretten', 'Drei fehlen. Menthol. Sie hat mal gesagt, sie hört auf.', 'paper' |
| tiefwald.js:366 | open | jonas_karte | 'Jonas’ Karte', 'Mit Kuli auf Karopapier: der Wald, die Wege, fünf Kreuze. Am Weiher: „EN… |
| traum.js:56 | traum_einband | fibel | 'Abenteuerfibel', 'Dein dickes Kinderheft mit Wachstuch-Einband, ein Aufkleber vom Kinder… |
| villa.js:767 | villa_da10 | da10 | 'DA 10', 'Dienstanweisung von 2012, graues Papier: „Zutritt zu Archivräumen … ausschließl… |
| villa.js:804 | villa_bett | dienstnadel | 'Seilers Dienstnadel', 'Silber, das Auge darauf. In ein Taschentuch mit Monogramm T. S. g… |
| villa.js:1106 | villa_w11Akte | miras_ring | 'Miras Ring', 'Ein halber Mond. Whiskey hat ihn gebracht. Er passt in meine Narbe, als wä… |
| wald.js:118 | open | jonas_messer | 'Jonas’ Taschenmesser', 'Rostig, zugeklappt. In den Griff geritzt: JONAS W.', 'key' |
| wald.js:119 | open | plombe | 'Plombe aus Blech', 'Vom Pflock der Schlinge. Das Auge über der Flamme. „AST 7 · Köder W … |
| whiskey.js:270 | ok | autoschluessel | 'Autoschlüssel', 'Dein Leihwagen am Ortsschild. Ein bisschen Rabenspucke am Anhänger.', '… |
| whiskey.js:360 | ok | lwo_kuli | 'Kugelschreiber mit Auge', 'Grau, ein Auge auf dem Clip. Lag auf Giselas Fensterbrett. Wh… |
| whiskey.js:413 | ring | miras_ring | 'Miras Ring', 'Ein halber Mond, klein, für eine Frauenhand. Whiskey hat ihn gebracht. Er … |
| whiskey.js:489 | whiskey_klick | baumhausschluessel | 'Kleiner Messingschlüssel', 'Von Whiskey, gegen etwas Glänzendes getauscht. In den Bart i… |
| zayn.js:21 | zayn_stage | zayn_kamera | 'Zayns Kinderkamera', 'Eine kleine Kamera aus buntem Plastik. Sechs Fotos, alle vom alten… |
| zayn.js:22 | zayn_stage | zayn_kassette | 'Kassette „FÜR JONAS UND LUKE“', 'Kinderschrift auf dem Etikett: FÜR JONAS UND LUKE · NIC… |
| zimmer7.js:32 | Z7_AUSHANG_HTML | zimmer7 | 'Schlüssel „ZIMMER 7“', 'Lag mit einer Klammer am achten Protokoll. Am Ring ein Pappschil… |
| zimmer7.js:33 | Z7_AUSHANG_HTML | einwilligungen | 'Einwilligungen 2009', `„Einwilligungen 2009 – vollständig“. Aushang aus Zimmer 7.${z7_ta… |
| zimmer7.js:34 | Z7_AUSHANG_HTML | fuse | 'Schlüssel Sicherungsraum', 'Hing an Hildes Haken in Zimmer 7, neben der Tür.', 'fuse' |

### mystFound (7)

| Datei:Zeile | Funktion | Schlüssel | weitere Argumente |
|---|---|---|---|
| _base_source_index.html:4201 | jDist | chronik |  |
| _base_source_index.html:4313 | c3Phone | stimme |  |
| _base_source_index.html:4320 | readLetter2 | brief |  |
| _base_source_index.html:4324 | readBook | buch |  |
| _base_source_index.html:4328 | readAlbers | albers |  |
| kapitel3.js:99 | kapitel3_telefon | stimme |  |
| kapitel3.js:144 | fn | buch |  |

### beobachter_zettel (28)

| Datei:Zeile | Funktion | Schlüssel | weitere Argumente |
|---|---|---|---|
| amt.js:996 | amt_batterien | B-K2-03 | { pos: [C2.x + 30.55, (S.funkPos && S.funkPos.y \|\| .84) + .005, C2.z + 5.98] } |
| amt.js:1075 | amt_kuehlregal | B-K2-06 | { pos: [C2.x + 35.3, 1.02, C2.z + 3.55] } |
| amt.js:1114 | amt_akte08 | B-K2-07 | { pos: [C2.x + 110, 1.04, C2.z + 7.35], gitter: true } |
| amt.js:1147 | amt_safe | B-K2-07 | { pos: [C2.x + 111.85, 1.29, C2.z + 7.62], gitter: true } |
| amt.js:1149 | amt_danke | B-K2-04 | { pos: [x, 0, z] } |
| amt.js:1185 | amt_regieTick | B-K2-02 | { pos: [AMT_DRUCK.x + .02, AMT_DRUCK.y + .2, AMT_DRUCK.z] } |
| amt.js:1186 | amt_regieTick | B-K2-05 | { pos: [X0 + 108.7, 0, Z0 + 6.6] } |
| beobachter.js:15 |  | id | o |
| beobachter.js:875 | beobachter_falle | id |  |
| kapitel3.js:249 | kapitel3_behSicher | B-K3-08 | { pos: [P.x, 0, P.z] } |
| kapitel3.js:249 | kapitel3_behSicher | B-K3-08b | { pos: [P.x + .45, 0, P.z + .3] } |
| kapitel3.js:271 | kapitel3_hufeisen | B-K3-07 | { vor: true } |
| kapitel5.js:25 | k5_zettel | id | o |
| kapitel6.js:367 | k6_oben | b_k6_05 | { pos: [TIEF.stand.x + .55, 3.13, TIEF.stand.z + .62] } |
| kapitel6.js:388 | k6_justinStimme | b_k6_04 | { pos: [player.pos.x - g.x * 1.4, .05, player.pos.z - g.z * 1.4] } |
| kapitel6.js:394 | k6_falleStart | b_k6_06 | { pos: [TIEF.bus.x - 1.5, 1.02, TIEF.bus.z + 1.1] } |
| kapitel6.js:527 | k6_lagerFertig | b_k6_08 | {} |
| kapitel6.js:527 | k6_lagerFertig | b_k6_08 | { vor: true } |
| kapitel6.js:699 | V | b_k6_07 | { pos: [42.1, .05, 154.3] } |
| kapitel6.js:786 | respawn | b_k6_03 | { pos: [player.pos.x - f.x * 1.3, .05, player.pos.z - f.z * 1.3] } |
| lucy3.js:335 | lucy3_fail | B-K3-H2 | {} |
| lwo.js:853 | kette | B-K2-05 | { pos: [X0 + 108.7, 0, Z0 + 6.6] } |
| lwo.js:928 | hook | B-K3-03 | { pos: [B[0] + .1, 0, B[1] - .35] } |
| neben3.js:536 | gully | B-K3-N1 | { pos: [C.x - 2.8, .02, C.z + 1.6] } |
| neben4.js:348 | n4_dunkel | b_k4_n6 | { pos: [C.x - .62, .62, C.z + .72] } |
| neben4.js:415 | html | b_k4_n5 | { vor: true } |
| neben5.js:420 | n5_schuppenInnen | b_k5_n1 | { pos: [C.x - .62, .62, C.z + .72] } |
| villa.js:107 | villa_beob | id | o |

### sammeln_fibel (32)

| Datei:Zeile | Funktion | Schlüssel | weitere Argumente |
|---|---|---|---|
| amt.js:1112 | amt_akte08 | D-03 |  |
| amt.js:1112 | amt_akte08 | D-05 |  |
| ausbau_nord.js:910 | ausbau_nord_bench | R-ochs |  |
| ausbau_nord.js:1047 | hand | R-ochs |  |
| ausbau_nord.js:1108 | ausbau_nord_ochsTick | R-eisen |  |
| ausbau_nord.js:1108 | ausbau_nord_ochsTick | R-frei |  |
| ausbau_nord.js:1140 | ausbau_nord_strichCheck | D-strich |  |
| kapitel1.js:567 | kapitel1_heim | R-K1 |  |
| kapitel1.js:567 | kapitel1_heim | R-heim |  |
| kapitel3.js:182 | kapitel3_jagdTick | R-K3d |  |
| kapitel3.js:203 | kapitel3_ausIhrenAugen | R-K2 |  |
| kapitel3.js:247 | kapitel3_behSicher | R-K3e |  |
| kapitel5.js:1183 | k5_kerzeAnzuenden | R-K5c |  |
| kapitel6.js:257 | k6_zoneWechsel | R-K6 |  |
| kapitel6.js:667 | k6_zweiLukes | D-11 |  |
| kirchberg.js:300 | kirchberg_naepfeFinale | N-01 |  |
| kirchberg.js:367 | kirchberg_fenster | kb_fenster |  |
| lucy3.js:322 | lucy3_win | R-K3c |  |
| nr4.js:403 |  | R-K1 |  |
| sammeln.js:9 |  | flag |  |
| sammeln.js:143 | sammeln_auto | f |  |
| sammeln.js:144 | sammeln_auto | D-01 |  |
| sammeln.js:144 | sammeln_auto | D-02 |  |
| sammeln.js:144 | sammeln_auto | D-03 |  |
| sammeln.js:145 | sammeln_auto | J-15 |  |
| sammeln.js:360 | sammeln_schatz | J05_fund |  |
| sammeln.js:428 | sammeln_rDamals | J05_gelesen |  |
| sammeln.js:441 | strike | seen:augen |  |
| sammeln.js:442 | strike | 'seen:' + f |  |
| tiefwald.js:484 | tief_weiher | J-15 |  |
| uebergang.js:150 | uebergang3_nachAbspann | R-K2 |  |
| weiss.js:544 | weiss_gestaendnisF3 | sb07_strike |  |

### beob_drop (10)

| Datei:Zeile | Funktion | Schlüssel | weitere Argumente |
|---|---|---|---|
| beobachter.js:233 | onClose | BEOB_FINAL_D | { hinter: true } |
| beobachter.js:285 | beobachter_zettel | d | o |
| beobachter.js:376 | beob_papier | d |  |
| beobachter.js:771 | beob_k1Tick | beob_findDyn('b_k1_02') | { hinter: true } |
| beobachter.js:775 | beob_k1Tick | beob_findDyn('b_k1_01') | pos ? { pos } : { vor: true } |
| beobachter.js:846 | beob_fotoHuelle | beob_findDyn('b_k3_06') |  |
| beobachter.js:859 |  | d |  |
| beobachter.js:859 |  | BEOB_FINAL_D | { hinter: true } |
| beobachter.js:860 |  | d | mode === 'decke' && !d.wo ? { gitter: true } : {} |
| beobachter.js:875 | beobachter_falle | BEOB_DYN.find(d => d.id === id) \|\| BEOB_NOT |  |

### lore (2)

| Datei:Zeile | Funktion | Schlüssel | weitere Argumente |
|---|---|---|---|
| sammeln.js:144 | sammeln_auto | phone |  |
| sammeln.js:144 | sammeln_auto | akte8 |  |

### BEUTEL_FUNDE (beutel.js): 2 Einträge

