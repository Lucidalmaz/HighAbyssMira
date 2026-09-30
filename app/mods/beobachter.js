// =====================================================================  DER BEOBACHTER (Modul „beobachter“): ein kleiner weißer Außerirdischer
// Ab Kapitel 2 ist er immer in der Nähe. Man hört ihn mehr, als man ihn sieht: Rascheln im Gebüsch, ein Ast knackt, kleine schnelle Schritte,
// ein Kiesel, ein leises Zirpen – unten im Amt Kratzen in den Rohren, Klopfen, Papier. Sieht man ihn länger als eine Sekunde an (oder leuchtet ihn an),
// ist er weg und taucht an einer ganz anderen Stelle wieder auf.
// Er hinterlässt Zettel (Druckbuchstaben, Bleistift, Zeichen „∴“): hilfreich (Hinweise, wenn man festhängt; Batterien, wenn die Lampe stirbt),
// gruselig (er weiß, was Luke eben getan hat), Rätsel (führen zu Verstecken mit Batterien) und Fragen. Dazu liegt an jedem Ort der Welt ein Zettel –
// die Belohnung fürs Erkunden (Nebenaufgabe „Der Beobachter“, alle gefunden → letzter Zettel und Geschenk).
// Gut oder böse? Bleibt offen (Auflösung Kapitel 7). Kanon: story_final.md „Der Beobachter“. Hilde zählte zuletzt neun Kinder – der neunte ist er.
// Modell: assets/ms/beobachter/model.glb (klein, weiß; fehlt es, bleibt er unsichtbar – Geräusche und Zettel funktionieren trotzdem).
const BEOB = { h: .82, gap: [150, 260], sndGap: [6, 15], peekGap: [55, 120], seenMax: 1 };
const beob_S = { ready: false, found: new Set(), given: new Set(), bonus: new Set(), done: false, stat: { turns: 0, still: 0, stillMax: 0, flashOff: 0, runs: 0, t: 0, lastYaw: 0, fl: true, run: false }, a: { x: 0, z: 0 },
  sndT: 8, noteT: 90, peekT: 40, model: null, V: null, peek: null, notes: [], spots: [], chirpT: 0 };
MOD_SAVE.push(['beobachter', () => ({ found: [...beob_S.found], given: [...beob_S.given], bonus: [...beob_S.bonus], done: beob_S.done }),
  v => { const S = beob_S; (v.found || []).forEach(k => S.found.add(k)); (v.given || []).forEach(k => S.given.add(k)); (v.bonus || []).forEach(k => S.bonus.add(k)); S.done = !!v.done; for (const n of S.spots) if (S.found.has(n.id)) beob_hideSpot(n); beob_desc(); }]);
function beob_ch() { return typeof curChapter === 'function' ? curChapter() : 1; }
function beob_active() { if (beob_ch() < 2 || !state.started || menu.attract || state.ending) return false; if (ch3.on && ch3.part === 'white') return false; return true; }
function beob_quiet() { return state.talking || !!ui.overlay || !!scripted || dir.busy || state.blackout || (typeof hunt !== 'undefined' && hunt.on) || (typeof hungrige_S !== 'undefined' && (hungrige_S.cine || hungrige_S.ev)); }
function beob_indoor() { return ch2.on && !ch3.on || state.inBasement || state.zone === 'canal' || (typeof indoorRect === 'function' && !!indoorRect()); }
function beob_town() { return ch3.on && ch3.part === 'town' || (typeof anwesen_S !== 'undefined' && anwesen_S.ch4); }
const beob_V = new THREE.Vector3();
function beob_gy(x, z) { const P = player.pos, g = solidGround(x, P.y + 1.2, z); return g > P.y - 3 ? g : P.y; }
function beob_free(x, z) { if (!beob_town()) return true; try { return !leben_inHouse(x, z, 1) && leben_free(x, z, .4, .6); } catch (e) { return true; } }
function beob_facing(x, y, z) { try { return leben_facing(x, y, z); } catch (e) { return 0; } }
// ---------------------------------------------------------------- Die Zettel
const BEOB_SIG = '<span style="letter-spacing:.3em">∴</span>';
function beob_html(t) { return '<div style="font-family:\'Courier New\',monospace;font-size:17px;line-height:1.55;letter-spacing:.08em;color:#3a3a40;text-transform:uppercase">' + t.replace(/\n/g, '<br>') + '<br><br>' + BEOB_SIG + '</div>'; }
function beob_fill(t) { const S = beob_S.stat; return t.replace('{pct}', Math.round(FLASH.charge * 100)).replace('{turns}', Math.max(3, S.turns)).replace('{still}', Math.max(4, Math.round(S.stillMax))).replace('{off}', Math.max(2, S.flashOff)).replace('{min}', Math.max(2, Math.round(S.t / 60))).replace('{runs}', Math.max(2, S.runs)); }
// Zettel, die er Luke in den Weg legt (direkt hinter ihm – man hört Papier und kleine Schritte, dreht sich um, und da liegt er)
const BEOB_DYN = [
  // Kapitel 2 · Amt
  { id: 'd_erst', kind: 'gruselig', when: () => ch2.on, item: 1, text: 'DU BIST DURCH DIE WAND GEGANGEN. ICH AUCH.\nDEINE LAMPE HAT NOCH {pct} %. DAS REICHT NICHT FÜR UNTEN.\nHIER.' },
  { id: 'd_archiv', kind: 'hilfe', when: () => ch2.on && !ch2.archiveSolved && !ch2.power, stuck: true, text: 'WER ZUERST HEIMKAM, STEHT LINKS.\nDAS MÄDCHEN MIT DEN SCHWARZEN HAAREN KAM ZUERST.\nDER MIT DEN LOCKEN KAM NIE.' },
  { id: 'd_schalter', kind: 'hilfe', when: () => ch2.on && ch2.archiveSolved && !ch2.power, stuck: true, text: 'DIE SCHALTER MÖGEN ES NICHT, WENN MAN AM RAND ANFÄNGT.\nZWEI. DREI. VIER. FÜNF.' },
  { id: 'd_klavier', kind: 'hilfe', when: () => ch2.on && ch2.power && !ch2.safeOpen && /Klavier|Maschine/.test(beob_obj()), stuck: true, text: 'DIE SPIELUHR IN NR. 1 HAT ES DIR SCHON VORGESPIELT.\nE. DANN ABWÄRTS. GANZ UNTEN KEHRT ES UM.\nDU HAST ES ALS KIND GESUMMT. ODER ER.' },
  { id: 'd_akte', kind: 'gruselig', when: () => ch2.on && ch2.safeOpen, text: 'DIE ACHTE AKTE IST DÜNNER ALS DIE ANDEREN.\nWEIL ES DICH NOCH NICHT SO LANGE GIBT.' },
  { id: 'd_umdrehen', kind: 'gruselig', when: () => ch2.on, text: 'DU HAST DICH {turns} MAL UMGEDREHT, SEIT DU HIER UNTEN BIST.\nICH WAR JEDES MAL NICHT DA.' },
  { id: 'd_kopie', kind: 'frage', when: () => ch2.on, text: 'WENN DU EINE KOPIE BIST –\nWESSEN HEIMWEH HAST DU DANN?' },
  { id: 'd_spinnen', kind: 'gruselig', when: () => ch2.on && ch2.spiderPhase === 'done', text: 'SIE SIND AN DIR HOCHGEKROCHEN, WEIL DU WARM BIST.\nAN MIR NIE. ICH BIN KALT.' },
  // Kapitel 3 · Stadt
  { id: 'd_auto', kind: 'gruselig', when: () => ch3.on, text: 'IM AUTO AM ORTSSCHILD HAST DU MIT OFFENEM MUND GESCHLAFEN.\nICH HABE GEWARTET, BIS DU AUFWACHST.\nDU HAST VON DER STRASSE GETRÄUMT. ICH WEISS ES, WEIL ICH DRIN WAR.' },
  { id: 'd_funk', kind: 'hilfe', when: () => ch3.on && !ch3.radio && /31,10|Funkkasten/.test(beob_obj()), stuck: true, text: 'DER KASTEN AN DER KREUZUNG HÖRT NUR AUF EINE ZAHL.\nHILDE HAT SIE IN IHR ZÄHLBUCH GESCHRIEBEN.\nEINUNDDREISSIG. KOMMA. ZEHN.' },
  { id: 'd_laternen', kind: 'hilfe', when: () => ch3.on && !ch3.lampsOff && /Laternen/.test(beob_obj()), stuck: true, text: 'SO SIND SIE GEGANGEN: FÜNF. DREI. EINS. SIEBEN.\nSO GEHEN DIE LICHTER AUS.' },
  { id: 'd_uhr', kind: 'hilfe', when: () => ch3.on && /Küchenuhr/.test(beob_obj()), stuck: true, text: 'DREI UHR DREIZEHN.\nDAS WAR DIE ZEIT. DAS WAR DEIN ERSTER ATEMZUG.' },
  { id: 'd_nacht', kind: 'hilfe', when: () => ch3.on && /nicht in diese Nacht/.test(beob_obj()), stuck: true, text: 'EINE KARTE MIT EINER ZAHL, DIE ES IN DIESER NACHT NOCH NICHT GAB.\nZÄHL DIE KERZEN. DANN ZÄHL DIE JAHRE.' },
  { id: 'd_licht', kind: 'gruselig', when: () => ch3.on, text: 'DU HAST DIE LAMPE {off} MAL AUSGEMACHT.\nIM DUNKELN SIEHST DU MEHR.\nICH AUCH.' },
  { id: 'r_briefkasten', kind: 'raetsel', when: () => beob_town(), cache: 'briefkasten', text: 'ICH HABE EINEN MUND UND SCHLUCKE NUR PAPIER.\nDAS MÄDCHEN MIT DEM ROTEN BAND HAT MIR EINMAL EINEN SCHLÜSSEL GEFÜTTERT.\nJETZT LIEGT BEI MIR ETWAS FÜR DICH.' },
  { id: 'r_stein', kind: 'raetsel', when: () => beob_town(), cache: 'friedhof', text: 'WO SIEBEN NAMEN STEHEN UND EINER WEISS GEKRATZT IST,\nLIEGT, WAS DEIN LICHT LÄNGER MACHT.' },
  { id: 'd_hund', kind: 'frage', when: () => ch3.on, text: 'WIE HIESS EUER HUND?\nNICHT NACHDENKEN. EINFACH WISSEN.\n… SIEHST DU.' },
  { id: 'd_stehen', kind: 'gruselig', when: () => ch3.on, text: 'DU HAST {still} SEKUNDEN GANZ STILL GESTANDEN.\nICH AUCH. DIREKT HINTER DIR.' },
  { id: 'r_hochsitz', kind: 'raetsel', when: () => beob_town() && player.pos.z > 90, cache: 'hochsitz', text: 'ICH STEHE AUF VIER BEINEN IM WALD UND HABE KEINEN KOPF.\nWER AUF MICH STEIGT, SIEHT, WO DER WALD AUFHÖRT.\nUNTER MIR HABE ICH ETWAS VERGESSEN. MIT ABSICHT.' },
  { id: 'r_bus', kind: 'raetsel', when: () => beob_town() && player.pos.z > 150, cache: 'bus', text: 'ICH TRAGE DIE, DIE NIE ANGEKOMMEN SIND.\nMEINE RÄDER SIND ÄLTER ALS DIE BÄUME UM MICH.\nNEBEN MIR SCHLAFEN DIE SCHWEINE. UND MEIN GESCHENK.' },
  { id: 'd_wald', kind: 'gruselig', when: () => typeof hungrige_S !== 'undefined' && hungrige_S.done.size >= 2, text: 'DAS REH IST NICHT RÜCKWÄRTS GEGANGEN.\nDU HAST NUR NICHT GESEHEN, WO VORNE WAR.\nGEH NICHT OHNE LICHT IN DEN WALD. ER FRISST, WAS ICH SAMMLE.' },
  { id: 'd_lucy', kind: 'frage', when: () => ch3.on, text: 'WENN DU SIE FINDEST –\nWEN VON EUCH BEIDEN WIRD SIE ERKENNEN?' },
  // Kapitel 4 · Villa
  { id: 'd_villa', kind: 'hilfe', when: () => typeof anwesen_S !== 'undefined' && (anwesen_S.ch4 || /Villa Seiler. Schließ/.test(beob_obj())) && !anwesen_S.open, stuck: true, text: 'ACHT LÖCHER. ACHT TEILE.\nWAS DU LIEGEN GELASSEN HAST, HAT DER RABE GESAMMELT.\nSIEH IN SEIN NEST.' },
  { id: 'd_zugesehen', kind: 'frage', when: () => typeof hungrige_S !== 'undefined' && hungrige_S.finale, text: 'ICH HABE DICH NICHT GERETTET.\nDER VOGEL HAT DAS GEMACHT.\nICH HABE NUR ZUGESEHEN. FRAG DICH, WARUM.' },
];
const BEOB_NOT = { id: 'd_not', kind: 'hilfe', item: 2, text: 'DU HAST KEINE MEHR. UND DEINE LAMPE HAT NOCH {pct} %.\nIM DUNKELN BIST DU LAUT.\nHIER. ZWEI.' };
// Zettel an Orten: die Belohnung fürs Erkunden (ab Kapitel 3 in der Stadt und im Wald; Rätsel-Verstecke bringen zusätzlich Batterien)
const BEOB_ORTE = [
  { id: 'kreuzung', name: 'Kreuzung', x: 3.5, z: 3.2, text: 'KREUZUNG.\nHIER HAST DU ALS KIND GESTANDEN, BARFUSS.\nICH HABE MITGEZÄHLT. ES WAREN ACHT. MICH HAT KEINER GEZÄHLT.' },
  { id: 'nr1', name: 'Nr. 1', x: -47, z: -8.8, text: 'EUER HAUS. DAS BETT AM FENSTER.\nDU HAST DORT GESCHLAFEN, ALS WÄRE ES DEINS.\nES HAT DICH NIE GESTÖRT, DASS ES NACH JEMAND ANDEREM ROCH.' },
  { id: 'nr3', name: 'Nr. 3', x: -28, z: -8.8, text: 'DER ALTE MANN HAT MIT ALLEM RECHT GEHABT.\nAUCH MIT MIR.\nER HAT MICH NUR NIE GESEHEN. ER HAT IMMER NACH OBEN GESCHAUT.' },
  { id: 'briefkasten', name: 'Briefkasten Nr. 7', x: 28.4, z: -5.9, bonus: 2, text: 'GUT GERATEN.\nDER BRIEFKASTEN HAT NICHTS GESAGT. ICH AUCH NICHT.\nZWEI FÜR DEINE LAMPE.' },
  { id: 'kapelle', name: 'Kirchberg', x: -4.5, z: 45.5, text: 'AM SÜHNEKREUZ LIEGEN SIEBEN KIESEL. DER ACHTE IST WEGGEROLLT.\nDER ACHTE BIN NICHT ICH.\nDER ACHTE IST DER, DER NICHT GANZ ZURÜCKKAM.' },
  { id: 'friedhof', name: 'Gedenkfeld', x: -47.6, z: 71.6, bonus: 1, text: 'DER ACHTE STEIN.\nSIE HABEN IHREN NAMEN WEGGEKRATZT. IHRE SCHRITTE NICHT.\nSIE GEHT HIER NACHTS IM KREIS. SIEBEN RUNDEN. DANN SETZT SIE SICH.' },
  { id: 'spielplatz', name: 'Spielplatz', x: 31, z: 70, text: 'DIE SCHAUKEL HÄLT NIE STILL.\nNICHT WEGEN DES WINDES.\nWEIL JEMAND DRAUFSITZT, DEN DU NICHT SIEHST. SAG HALLO. SIE FREUT SICH.' },
  { id: 'tankstelle', name: 'Tankstelle', x: 109.5, z: 20, bonus: 1, text: 'HIER HAT MIKE BARFUSS GESTANDEN. 3:13.\nDIE TANKSTELLE IST SEIT JAHREN ZU. ER HATTE TROTZDEM EINEN SCHLÜSSEL.\nFRAG DICH, VON WEM.' },
  { id: 'sperre', name: 'Straßensperre', x: 145.5, z: 2.5, text: 'DIE WEISSEN AUTOS SIND NICHT KAPUTT. SIE WARTEN.\nWER HIER RAUSWILL, MUSS WISSEN, WOHIN.\nWEISST DU ES?' },
  { id: 'schreber', name: 'Schrebergärten', x: -114, z: 24, text: 'HILDE HAT HIER GEMÜSE GEZOGEN. FÜR ACHT TELLER.\nES WAREN IMMER ZU VIELE.\nFRAG DICH, FÜR WEN DER ACHTE WAR.' },
  { id: 'hof', name: 'Hof', x: -127, z: -26, text: 'DINA HAT GELERNT, DIE AUGEN ZUZUMACHEN.\nDU NICHT. DU SIEHST IMMER HIN.\nDAS MAG ICH AN DIR.' },
  { id: 'villa', name: 'Villa Seiler', x: -111, z: 60.5, bonus: 1, text: 'ACHT SCHLÜSSELLÖCHER.\nDER MANN, DER HIER WOHNTE, HAT MICH 1975 FOTOGRAFIERT.\nER HAT DAS FOTO VERBRANNT UND EIN ANDERES IN DIE ZEITUNG GEGEBEN.' },
  { id: 'lichtung', name: 'Lichtung', x: 4, z: 110.5, text: 'DER WALD HAT KEIN ECHO.\nRUF MAL.\n… NEIN. LIEBER NICHT.' },
  { id: 'huette', name: 'Zayns Hütte', x: 55, z: 146.5, text: 'ZAYN HAT HIER GEZEICHNET. MICH AUCH.\nER HAT MICH GRÖSSER GEMALT, ALS ICH BIN.\nKINDER MACHEN DAS MIT DINGEN, VOR DENEN SIE KEINE ANGST HABEN.' },
  { id: 'hochsitz', name: 'Hochsitz', x: 16.2, z: 176.2, bonus: 2, text: 'DU HAST ES GEFUNDEN.\nOBEN SIEHT MAN DAS LICHT HINTER DEM WALD.\nICH WEISS, WO ER AUFHÖRT. DU NOCH NICHT.' },
  { id: 'bus', name: 'Amtsbus', x: 60.8, z: 196.2, bonus: 2, text: 'SIEBEN SITZE.\nEINEN HABE ICH MIR GENOMMEN, ALS NIEMAND HINSAH.\nDIE SCHWEINE HABEN AUF DEIN GESCHENK AUFGEPASST.' },
  { id: 'steinkreis', name: 'Steinkreis', x: 15, z: 231.2, text: 'DER ACHTE STÖCKCHENMANN HÄNGT TIEFER.\nICH HABE IHN NICHT GEMACHT.\nABER ICH WEISS, FÜR WEN ER IST.' },
  { id: 'wrack', name: 'Autowrack', x: -6.2, z: 201.5, bonus: 1, text: 'HINTER DEM WRACK WOHNT, WAS FRISST.\nES HAT ANGST VOR DEM VOGEL.\nVOR MIR NICHT. DENK DARÜBER NACH.' },
  { id: 'weiher', name: 'Weiher', x: 43, z: 245.4, text: 'DER WEIHER HAT KEINEN GRUND.\nICH HABE ES GEPRÜFT.\nJONAS HAT DAS ENDE DER WOLLE HINEINGEHÄNGT. JEMAND HAT DARAN GEZOGEN. NICHT ICH.' },
];
const BEOB_FINAL = 'NEUNZEHN ORTE. DU HAST SIE ALLE GESEHEN.\nICH AUCH. JEDES MAL MIT DIR.\nAM 23. OKTOBER HABE ICH MICH ZUM ERSTEN MAL DAZUGESTELLT.\nHILDE HAT MICH MITGEZÄHLT. SIE HAT NIE GEFRAGT, WER DER NEUNTE IST.\nDU FRAGST AUCH NICHT.\nNOCH NICHT.';
function beob_obj() { const el = document.getElementById('objText'); return el ? el.textContent : ''; }
function beob_desc() { const q = story.side.beobachter; if (!q) return; const n = BEOB_ORTE.filter(o => beob_S.found.has(o.id)).length;
  q.desc = beob_S.done ? 'Alle Zettel des Beobachters gefunden. Er war an jedem Ort vor dir. Und nach dir.' : `Jemand Kleines folgt dir und legt Zettel aus, gezeichnet „∴“. Zettel an Orten: ${n} / ${BEOB_ORTE.length}.`; }
// Papier im Spiel: Blatt aus einem Notizblock, Bleistift-Druckbuchstaben (auf die Entfernung unleserlich), unten „∴“
let beob_paperTex = null;
function beob_paper() { if (beob_paperTex) return beob_paperTex; const c = cnv(256, (x, w) => { x.fillStyle = '#e9e7df'; x.fillRect(0, 0, w, w); x.fillStyle = 'rgba(120,110,90,.18)'; for (let i = 0; i < 3; i++) x.fillRect(0, rand(0, w), w, 1);
    x.fillStyle = '#5a5a62'; for (let l = 0; l < 7; l++) { let px = 26; const py = 40 + l * 26; while (px < w - 40) { const lw = rand(5, 9); x.fillRect(px, py + rand(-1, 1), lw, 11); px += lw + rand(2, 5); if (Math.random() < .12) px += 8; } }
    x.font = 'bold 30px serif'; x.fillText('∴', w - 60, w - 24); }); beob_paperTex = tex(c, true); return beob_paperTex; }
function beob_note(x, y, z, open) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.15, .2), new THREE.MeshStandardMaterial({ map: beob_paper(), roughness: .95 })); m.rotation.set(-PI / 2, 0, rand(-PI, PI)); m.position.set(x, y + .012, z); m.receiveShadow = true; scene.add(m);
  const hit = box(.7, .45, .7, x, y + .2, z, hidden, { cast: false }); interact(hit, 'Zettel', open); return { m, hit }; }
function beob_hideSpot(n) { if (n.m) n.m.visible = false; if (n.hit) uninteract(n.hit); n.gone = true; }
function beob_read(title, text, key, items) { Audio.paper(); openNote(title, beob_html(beob_fill(text)), key); if (items) setTimeout(() => addBattery(items), 600); }
function beob_firstThought() { if (typeof gedanke !== 'function') return; gedanke('beob_1', 'Druckbuchstaben. Bleistift. Und dieses Zeichen: drei Punkte. … Wer schreibt so? Und woher weiß er das?', 1800, 3); }
function beob_readSpot(n) {
  const S = beob_S; if (n.gone) return; const first = !S.found.size; S.found.add(n.id); beob_hideSpot(n);
  const bonus = n.bonus && S.bonus.has(n.id) ? n.bonus : (n.bonus && !BEOB_DYN.some(d => d.cache === n.id) ? n.bonus : 0);
  beob_read('Ein Zettel · ' + n.name, n.text, 'beob_ort_' + n.id, bonus || 0);
  if (!story.side.beobachter) story.side.beobachter = { title: 'Der Beobachter', desc: '', state: 'hidden' }; if (story.side.beobachter.state === 'hidden') sideStart('beobachter');
  beob_desc(); if (first) beob_firstThought();
  if (!S.done && BEOB_ORTE.every(o => S.found.has(o.id))) { S.done = true; setTimeout(() => { beob_read('Der letzte Zettel', BEOB_FINAL, 'beob_final', 3); addItem('murmel'); sideDone('beobachter', 'Alle Zettel des Beobachters gefunden.'); beob_desc();
    if (typeof gedanke === 'function') gedanke('beob_final', 'Der neunte. Hilde hat neun gezählt, und niemand hat ihr geglaubt. … Er war die ganze Zeit da. Und er will, dass ich es weiß.', 2500, 3); }, 1200); }
  if (typeof saveGame === 'function') saveGame(beob_ch());
}
// Zettel direkt hinter Luke ablegen (Papierrascheln, Trippelschritte weg)
function beob_drop(d) {
  const S = beob_S, P = player.pos, f = flatDir(); let spot = null;
  for (let k = 0; k < 14 && !spot; k++) { const a = Math.atan2(-f.x, -f.z) + rand(-.6, .6), r = rand(1.8, 3.4), x = P.x + Math.sin(a) * r, z = P.z + Math.cos(a) * r; if (beob_facing(x, P.y, z) > .1 || !beob_free(x, z)) continue; const gy = beob_gy(x, z); if (Math.abs(gy - P.y) > .35) continue; spot = [x, gy, z]; }
  if (!spot) return false; S.given.add(d.id); const [x, y, z] = spot;
  const N = beob_note(x, y, z, () => { beob_hideSpot(N); S.notes.splice(S.notes.indexOf(N), 1); if (d.cache) S.bonus.add(d.cache); beob_read(d.kind === 'raetsel' ? 'Ein Zettel · Rätsel' : d.kind === 'frage' ? 'Ein Zettel · Frage' : 'Ein Zettel', d.text, 'beob_' + d.id, d.item || 0);
    if (!S.found.size && !S.given.has('_t')) { S.given.add('_t'); beob_firstThought(); } if (!story.side.beobachter) story.side.beobachter = { title: 'Der Beobachter', desc: '', state: 'hidden' }; if (story.side.beobachter.state === 'hidden') { sideStart('beobachter'); beob_desc(); } });
  S.notes.push(N); Audio.paper(); setTimeout(() => { beob_patter(x, z, 4); beob_rustle(x + rand(-3, 3), z + rand(-3, 3), .5); }, 350);
  if (typeof hintAdd === 'function') hintAdd({ id: 'beob_' + d.id, x, y, z, kind: 'geheim', near: 12, open: () => !N.gone });
  if (typeof gedanke === 'function') gedanke('beob_hinter', 'Papier. Direkt hinter mir. … Da lag eben noch nichts.', 900, 2);
  if (typeof saveGame === 'function') saveGame(beob_ch()); return true;
}
function beob_nextNote() {
  const S = beob_S, stuck = typeof gedanken_S !== 'undefined' && gedanken_S.objT > 100;
  if (FLASH.spare <= 0 && FLASH.charge < .25 && !S.given.has('d_not_' + beob_ch())) return Object.assign({}, BEOB_NOT, { id: 'd_not_' + beob_ch() });
  const open = BEOB_DYN.filter(d => !S.given.has(d.id) && (() => { try { return d.when(); } catch (e) { return false; } })());
  return (stuck && open.find(d => d.stuck)) || open.find(d => !d.stuck) || null;
}
// ---------------------------------------------------------------- Geräusche: er ist immer irgendwo in der Nähe
function beob_rustle(x, z, v = 1) { if (!Audio.ctx) return; const d = Audio.at(x, .5, z, 3), n0 = rand(3, 6);
  for (let i = 0; i < n0; i++) { const n = Audio.noise(false), bp = Audio.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(1800, 4200); bp.Q.value = .9; n.connect(bp); Audio.env(bp, rand(.05, .11) * v, .01, rand(.05, .14), i * rand(.05, .12), d); n.stop(Audio.ctx.currentTime + 1.5); } }
function beob_patter(x, z, n = 4) { for (let i = 0; i < n; i++) setTimeout(() => Audio.play(Audio.pick('stepG1', 'stepG2', 'stepG3'), { gain: .09, rate: rand(1.7, 2.1), x: x + i * .3, y: 0, z: z + i * .3, ref: 2 }), i * rand(80, 120)); }
function beob_chirp(x, z) { if (!Audio.ctx) return; const d = Audio.at(x, .7, z, 3), t = Audio.ctx.currentTime;
  for (let k = 0; k < 2; k++) { const o = Audio.ctx.createOscillator(), g = Audio.ctx.createGain(); o.type = 'sine'; const t0 = t + k * .16; o.frequency.setValueAtTime(1500 + k * 180, t0); o.frequency.exponentialRampToValueAtTime(2300 + k * 200, t0 + .08); o.frequency.exponentialRampToValueAtTime(1700, t0 + .14);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.022, t0 + .02); g.gain.linearRampToValueAtTime(0, t0 + .14); o.connect(g); g.connect(d); o.start(t0); o.stop(t0 + .16); } }
function beob_sound() {
  const S = beob_S, P = player.pos, f = flatDir(), side = Math.random() < .5 ? 1 : -1;
  // Position wandert um Luke herum, meist hinter ihm oder seitlich, 7–16 m
  const a = Math.atan2(-f.x, -f.z) + side * rand(.2, 1.4), r = rand(7, 16); S.a.x = P.x + Math.sin(a) * r; S.a.z = P.z + Math.cos(a) * r; const x = S.a.x, z = S.a.z, q = Math.random();
  if (beob_indoor()) {
    if (q < .3) Audio.play(Audio.pick('scrape1', 'scrape2', 'scrape3', 'scrape4'), { gain: .12, rate: rand(1.6, 2.2), x, y: 2.3, z, ref: 3 });
    else if (q < .5) Audio.play(Audio.pick('metalHit1', 'metalHit2'), { gain: .08, rate: rand(1.6, 2), x, y: 2, z, ref: 3 });
    else if (q < .7) beob_patter(x, z, 3); else if (q < .85) Audio.drip(x, 1.6, z); else beob_chirp(x, z);
  } else {
    if (q < .34) beob_rustle(x, z, 1); else if (q < .52) Audio.twig ? Audio.twig(x, z) : Audio.play('woodCrack', { gain: .15, rate: 1.6, x, y: 0, z, ref: 3 });
    else if (q < .68) beob_patter(x, z, 4); else if (q < .8) Audio.play('stones1', { gain: .1, rate: rand(1.5, 1.9), x, y: 0, z, ref: 3 });
    else if (q < .9) Audio.play(Audio.pick('metalHit1', 'metalHit2'), { gain: .05, rate: rand(1.8, 2.2), x, y: .1, z, ref: 2 }); else beob_chirp(x, z);
  }
}
// ---------------------------------------------------------------- Kurz zu sehen: am Rand des Blickfelds; länger als 1 s angesehen → weg, taucht woanders auf
async function beob_loadModel() {
  const S = beob_S; try { const src = await msModel('beobachter', 'model.glb'); const m = src.clone(true); const g = new THREE.Group(); g.add(msGround(msFit(m, BEOB.h, 'y'))); g.visible = false; g.userData.noCol = true; scene.add(g);
    m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; const mm = o.material.clone(); mm.color.setRGB(.62, .62, .66); mm.roughness = 1; mm.metalness = 0; mm.envMapIntensity = .25; o.material = mm; } }); g.updateMatrixWorld(true);
    const head = m.getObjectByName('Kopf'), body = m.getObjectByName('Koerper'), uT = { value: 0 };
    // Fühler: nur die Eckpunkte oberhalb der Kopfkugel wippen (Shader), Stärke wächst zur Spitze hin
    const hm = []; (m.getObjectByName('kopf_Group28799') || head || m).traverse(o => { if (o.isMesh) hm.push(o); });
    for (const mesh of hm) { const toHead = new THREE.Matrix4().copy(head.matrixWorld).invert().multiply(mesh.matrixWorld), P = mesh.geometry.attributes.position, v = new THREE.Vector3(); let bulb = -1e9, top = -1e9;
      for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(toHead); top = Math.max(top, v.y); if (Math.abs(v.x) < .012) bulb = Math.max(bulb, v.y); }
      const mat = mesh.material, fromHead = new THREE.Matrix4().copy(toHead).invert(), base = bulb - .01;
      mat.onBeforeCompile = sh => { sh.uniforms.uT = uT; sh.uniforms.uToHead = { value: toHead }; sh.uniforms.uFromHead = { value: fromHead }; sh.uniforms.uBase = { value: base }; sh.uniforms.uTop = { value: top };
        sh.vertexShader = 'uniform float uT, uBase, uTop; uniform mat4 uToHead, uFromHead;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          vec3 hp = (uToHead * vec4(position, 1.)).xyz; float k = smoothstep(uBase, uTop, hp.y); k *= k;
          vec3 off = vec3(sin(uT * 3.1 + hp.x * 30.) * .018 + sin(uT * 7.3) * .004, 0., cos(uT * 2.6 + hp.x * 22.) * .014) * k;
          transformed += (uFromHead * vec4(off, 0.)).xyz;`); };
      mat.customProgramCacheKey = () => 'beob_fuehler'; mesh.material = mat; }
    S.V = { g, m, head, body, uT, t: rand(0, 9), tilt: 0, tiltT: 0, look: 0 }; S.model = true; } catch (e) { console.warn('Beobachter: Modell', e); S.model = false; }
}
// Lebendig ohne Skelett: atmen, Kopf neugierig schief legen, zu Luke drehen, Fühler wippen
function beob_anim(dt) { const V = beob_S.V; if (!V || !V.g.visible) return; V.t += dt; V.uT.value = V.t;
  V.tiltT -= dt; if (V.tiltT < 0) { V.tiltT = rand(1.5, 4); V.tilt = Math.random() < .35 ? rand(-.75, .75) : rand(-.25, .25); V.jerk = .18; } if (V.jerk > 0) V.jerk -= dt;
  if (V.body) V.body.scale.set(1 + Math.sin(V.t * 2.3) * .008, 1 + Math.sin(V.t * 2.3) * .014, 1 + Math.sin(V.t * 2.3) * .008);
  if (V.head) { V.head.rotation.z += (V.tilt + Math.sin(V.t * .9) * .03 - V.head.rotation.z) * Math.min(1, dt * (V.jerk > 0 ? 40 : 1.2)); V.head.rotation.x = Math.sin(V.t * 1.4) * .04 - .06; V.head.rotation.y += (Math.sin(V.t * .7) * .25 - V.head.rotation.y) * Math.min(1, dt * 3); V.head.position.y = V.head.userData.y0 ?? (V.head.userData.y0 = V.head.position.y); V.head.position.y += Math.sin(V.t * 2.3) * .003; } }
function beob_peekSpot(minF, maxF, far = [12, 22]) {
  const P = player.pos, trees = (typeof leben_S !== 'undefined' && leben_S.treePts) || [];
  for (let k = 0; k < 40; k++) { let x, z; if (trees.length && Math.random() < .7) { const [tx, tz] = trees[Math.floor(Math.random() * trees.length)], d = Math.hypot(tx - P.x, tz - P.z); if (d < far[0] || d > far[1]) continue;
      const side = Math.random() < .5 ? .34 : -.34, sx = (P.z - tz) / d * side, sz = -(P.x - tx) / d * side; x = tx + sx - (P.x - tx) / d * .1; z = tz + sz - (P.z - tz) / d * .1; }
    else { const a = rand(0, 6.28), d = rand(far[0], far[1]); x = P.x + Math.cos(a) * d; z = P.z + Math.sin(a) * d; }
    const f = beob_facing(x, P.y + .6, z); if (f < minF || f > maxF || !beob_free(x, z)) continue; const gy = beob_gy(x, z); if (f > .3 && typeof hungrige_los === 'function' && !hungrige_los(x, gy + BEOB.h * .75, z)) continue; return [x, gy, z]; }
  return null;
}
function beob_show(sp) { const S = beob_S, V = S.V; V.g.position.set(sp[0], sp[1], sp[2]); V.g.rotation.y = Math.atan2(player.pos.x - sp[0], player.pos.z - sp[2]); V.g.visible = true; V.tiltT = 0; }
function beob_vanish() { const S = beob_S, V = S.V, p = V.g.position; V.g.visible = false; beob_rustle(p.x, p.z, 1.2); beob_patter(p.x, p.z, 5); if (Math.random() < .4) beob_chirp(p.x, p.z);
  if (typeof gedanke === 'function') gedanke('beob_sehen', 'Da war was. Klein. Weiß. Große Augen. … Und jetzt ist es weg. Als hätte es gewusst, dass ich hinsehe.', 1200, 3); }
function beob_peekTick(dt) {
  const S = beob_S, V = S.V, K = S.peek; if (!V || !K) return; K.t += dt;
  if (K.st === 'show') { beob_anim(dt); const p = V.g.position, dx = player.pos.x - p.x, dz = player.pos.z - p.z, d = Math.hypot(dx, dz); V.g.rotation.y = leben_ang(V.g.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 3));
    const f = beob_facing(p.x, p.y + BEOB.h * .7, p.z), inView = f > .7 && d < 45, lit = flashOn && !state.blackout && d < 26 && f > .96; if (f > .93) K.seen += dt * .6;
    if (inView) K.seen += dt; if (lit && V.head) V.head.rotation.y += (-.9 - V.head.rotation.y) * Math.min(1, dt * 6); if (K.seen > BEOB.seenMax || d < 3.5) { beob_vanish(); K.st = 'gone'; K.t = 0; K.wait = rand(2.5, 6); } else if (K.t > 40) { V.g.visible = false; S.peek = null; } }
  else if (K.st === 'gone') { if (K.t < K.wait) return; if (K.n >= 2 || beob_quiet() || !beob_active()) { S.peek = null; return; }
    // ganz woanders wieder auftauchen: gegenüber, außerhalb des Blickfelds – am Rand, wo man ihn beim Umdrehen erwischt
    const sp = beob_peekSpot(-.9, .15, [14, 26]); if (!sp) { S.peek = null; return; } K.n++; beob_show(sp); K.st = 'show'; K.t = 0; K.seen = 0; }
}
// ---------------------------------------------------------------- Aufbau und Takt
WORLD_MODS.push(['Der Beobachter', async () => {
  const S = beob_S;
  story.side.beobachter = story.side.beobachter || { title: 'Der Beobachter', desc: '', state: 'hidden' }; beob_desc();
  for (const o of BEOB_ORTE) { let x = o.x, z = o.z; for (let k = 0; k < 12 && !beob_freeAt(x, z); k++) { const a = k * 2.1, r = .8 + k * .25; x = o.x + Math.cos(a) * r; z = o.z + Math.sin(a) * r; }
    const sg = solidGround(x, 1.5, z), y = sg > -1 ? Math.max(0, sg) : 0; const n = Object.assign({ x, y, z }, o, { x, z }); const N = beob_note(x, y, z, () => beob_readSpot(n)); n.m = N.m; n.hit = N.hit; n.m.visible = false; uninteract(n.hit); n.live = false; S.spots.push(n);
    if (typeof hintAdd === 'function') hintAdd({ id: 'beob_ort_' + o.id, x, y, z, kind: 'geheim', near: 20, open: () => n.live && !n.gone }); }
  beob_loadModel(); S.ready = true;
}]);
function beob_freeAt(x, z) { try { return !leben_inHouse(x, z, 1) && leben_free(x, z, .4, .5); } catch (e) { return true; } }
WORLD_TICK.push((dt, t) => {
  const S = beob_S; if (!S.ready) return;
  if (!S.item) { S.item = true; ITEMS.murmel = { name: 'Milchweiße Murmel', desc: 'Lag beim letzten Zettel des Beobachters. Sie ist warm. Im Dunkeln leuchtet sie ganz schwach – wie ein Auge, das zurücksieht.' }; } // ITEMS entsteht erst nach den Modulen
  // Orts-Zettel ab Kapitel 3 (Stadt und Wald) freischalten
  const town = beob_ch() >= 3; for (const n of S.spots) { if (n.gone) continue; if (town && !n.live) { n.live = true; n.m.visible = true; interact(n.hit, 'Zettel', () => beob_readSpot(n)); } }
  if (!beob_active()) { if (S.V && S.V.g.visible) { S.V.g.visible = false; S.peek = null; } return; }
  // Beobachtungen für die Zettel (was Luke tut)
  const st = S.stat, P = player.pos, spd = Math.hypot(vel.x, vel.z); st.t += dt; let dy = player.yaw - st.lastYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); st.acc = (st.acc || 0) * Math.exp(-dt * 2) + dy; st.lastYaw = player.yaw; if (Math.abs(st.acc) > 2.4) { st.turns++; st.acc = 0; }
  if (spd < .2) { st.still += dt; st.stillMax = Math.max(st.stillMax, st.still); } else st.still = 0; if (flashOn !== st.fl) { if (!flashOn) st.flashOff++; st.fl = flashOn; } const run = spd > 4.2; if (run && !st.run) st.runs++; st.run = run;
  // Orts-Zettel: beim ersten Annähern ein Rascheln, als hätte er ihn gerade erst hingelegt
  for (const n of S.spots) if (n.live && !n.gone && !n.heard) { const d = Math.hypot(P.x - n.x, P.z - n.z); if (d < 13) { n.heard = true; beob_rustle(n.x + rand(-4, 4), n.z + rand(-4, 4), .8); beob_patter(n.x + 3, n.z + 3, 3); } }
  if (S.peek) beob_peekTick(dt);
  if (beob_quiet()) return;
  // Geräusche (häufiger, wenn Luke stillsteht)
  S.sndT -= dt * (st.still > 3 ? 1.8 : 1); if (S.sndT < 0) { S.sndT = rand(BEOB.sndGap[0], BEOB.sndGap[1]); if (typeof spannung_ask !== 'function' || spannung_ask('beob', 'amb')) beob_sound(); }
  // Zettel hinter Luke
  S.noteT -= dt; if (S.noteT < 0) { const d = beob_nextNote(); S.noteT = d && beob_drop(d) ? rand(BEOB.gap[0], BEOB.gap[1]) : 25; }
  // kurz zu sehen (nur mit Modell, draußen)
  if (S.V && !S.peek && !beob_indoor()) { S.peekT -= dt; if (S.peekT < 0) { S.peekT = rand(BEOB.peekGap[0], BEOB.peekGap[1]); const sp = beob_peekSpot(.62, .86, [14, 24]); if (sp) { beob_show(sp); S.peek = { st: 'show', t: 0, seen: 0, n: 0 }; beob_rustle(sp[0], sp[2], .6); } } }
});
window.__beob = { S: beob_S, drop: id => beob_drop(BEOB_DYN.find(d => d.id === id) || BEOB_NOT), peek: () => { const sp = beob_peekSpot(.72, .95); if (sp && beob_S.V) { beob_show(sp); beob_S.peek = { st: 'show', t: 0, seen: 0, n: 0 }; } return sp; }, sound: () => beob_sound(), orte: BEOB_ORTE }; // Testzugriff
