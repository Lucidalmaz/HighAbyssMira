// =====================================================================  NEBEN6 (Modul „neben6“, Fassung 3 · AP-24): Kapitel 6 · Nebenaufgaben N6-7 und N6-8
// Quelle: story_final.md Kap. 6 „Nebenaufgaben“ (N6-7 „Papa, ich bin’s“, N6-8 „Mit jedem Bissen“), Rätsel R6-4 „Annis Schleife“, Wendigo-Dossier 1.10 („Pells Heft“).
// Keine ist Pflicht; beide liegen am Hauptweg von kapitel6.js und benutzen dessen Stille-Zonen, Speicherstand und Wahl-Einblendung (k6_wahl).
// N6-7 · Warum: Eine Mädchenstimme ruft im stillen Wald nach ihrem Papa. Wer ihr nachgeht, findet heraus, wessen Kind das ist (Hofers Dienstbuch), öffnet mit dem
//   Schlüsselbund „3“ vom Hochsitz Hofers Spind im Amtsbus und hält Annis Lampion in der Hand – mit ihm im Gepäck spricht das Ding vor der Silhouette mit beiden Stimmen.
//   R6-4: In drei Stille-Zonen am Weg (vor dem Hochsitz, zwischen Hochsitz und Bus, zwischen Bus und Fraßstelle) läuft Annis Satz als Schleife aus der Richtung,
//   in die der Weg führt. Wer ihr folgt, geht in den Satz hinein (Stufe 2: direkt am Ohr, drei Sekunden flackert die Lampe). Wer die Naht abwartet (zehn Sekunden Pause),
//   geht ungehört vorbei. Hilfen: Lukes Loop-Satz · „Jeder Loop hat eine Naht“ · Whiskey fliegt genau in der Pause los · „Warte auf die Naht.“ (kein Tod).
// N6-8 · Warum: Karierte Seiten mit Kaffeeringen und Stempel „W“ liegen am Weg. Ein Amerikaner hat aufgeschrieben, was er in diesen Wald gesetzt hat – und wie man
//   es überlebt (Lampe oben). Sechs Seiten im Wald (Station Nord 7, Hochsitz 3, Amtsbus 5, Steinkreis 8, Weiher-Steg 6, Wrack 9), drei in der Villa (1, 2, 4; villa.js).
//   Im Handschuhfach des Wracks (nach kapitel6.js) Pells Rekorder mit Jonas’ Zettel; das Band kostet zwei der drei Batterien „for the dark“. Alle neun → „Erfüllt.“
// Lore-Schlüssel: pell_1 … pell_9 (hungrige.js liest pell_8 für den Blick-Gedanken), pell_band, pell_projekt, n67_* · Gegenstände: spindschluessel, lampion, pell_kassette.
// Schnittstellen: n6_blattGelesen() (hungrige.js, Seite 1b) · n6_pellVilla(n) (villa.js) · hungrige_stimme wird umwickelt (merkt sich, welche Stimme gespielt wurde).
// Keine Lichter, keine Allokationen im Takt (Prüfungen gedrosselt); alles in einer Gruppe, sichtbar nur, wenn der Wald offen ist (wald_frei).
const N6 = { ready: false, g: null, heard: new Set(), gates: {}, fails: 0, oks: 0, loopSaid: false, bat: false, placed: false, pages: [], t: 0, keyM: null, keyHit: null, spindHit: null, rekHit: null, band: false, busy: false };
const N6_TS = () => typeof TIEF !== 'undefined' ? TIEF.stand : { x: 14, z: 178.5 };
const n6_has = k => story.lore.some(l => l.key === k);
function n6_luke(t, ms = 3000) { if (!state.talking) subtitle(t, ms, 'LUKE'); }
// hungrige_stimme merkt sich die Stimmen (anni_1 … anni_5), damit Lukes Zeilen stimmen
if (typeof hungrige_stimme === 'function') hungrige_stimme = (orig => function (x, y, z, text, wer, ms, key) { if (key) N6.heard.add(key); return orig.apply(this, arguments); })(hungrige_stimme);
MOD_SAVE.push(['neben6', () => ({ heard: [...N6.heard], gates: N6.gates, fails: N6.fails, oks: N6.oks, loopSaid: N6.loopSaid, bat: N6.bat }),
  v => { if (!v || typeof v !== 'object') return; N6.heard = new Set(v.heard || []); N6.gates = v.gates || {}; N6.fails = +v.fails || 0; N6.oks = +v.oks || 0; N6.loopSaid = !!v.loopSaid; N6.bat = !!v.bat; n6_nachLaden(); }]);
// ---------------------------------------------------------------- Pells Heft (Wortlaut: Wendigo-Dossier 1.10, „Pells Laborjournal“)
const N6_PELL = {
  3: ['Der Hirsch', 'Der Hirsch als Wirt hält. Es geht in ihm herum, es frisst mit ihm, es kommt, wenn ich es rufe. Neonlicht als Korrektur, zwei Sekunden reichen. Dunkel als Belohnung.\nTag 8: Es hat gesprochen. Kinderstimme. „Papa, ich bin gleich wieder da.“ Hofer stand an der Tür. Ich habe ihm gesagt, es kopiert nur.\nDer Hirsch riecht seit heute süß. Ich glaube, er hält nicht mehr lange. Es wächst darin. It gets hungrier. Not a joke anymore.'],
  5: ['Tag 4, Wirt 2', 'Hofer isst für drei und ist guter Dinge. Er hat mir erklärt, dass die Bergungsanzüge nach Pfandkiste riechen und dass Bonnie Tyler eine Zumutung ist. Blutwerte normal. Puls 52, nachts 31.\nEr sagt, er hört im Schlaf ein Mädchen. Ich habe ihm nicht gesagt, dass wir auf dem Band nur ihn hören, wie er im Schlaf mit einer Mädchenstimme antwortet.\nGood. It is bonding.'],
  6: ['Tag 9', 'Hofer schreibt jetzt sehr viel. Er hat mir eine Seite gezeigt und gefragt, ob das seine Schrift ist. Es ist seine Schrift. Ich habe Ja gesagt.\nNeonlicht wirkt weiter, aber langsamer: heute vier Sekunden, bis er zurückweicht. Er lacht dabei. Hofer hat nie so gelacht.\nIch habe Seiler geschrieben, dass wir den Wirt trennen sollten. Antwort: „Das ist bedauerlich. Fortsetzen.“ Unterschrieben nicht von Seiler.'],
  7: ['13. Juli, morgens', 'Weg. Blechmann 3-4 hat ihm aufgemacht, weil er Hofer war. Ich kann es ihm nicht verübeln; er war Hofer, bis zur Tür.\nZelle leer, Neonring aus, alle Röhren von innen geplatzt. Der Hirschkadaver aus Zelle 2 ist mitgegangen. Zwei Kilometer nördlich gefunden, ohne Haut. Trupp 3 nennt es „geschält“. Ich nehme das Wort.\nSeiler lässt den Wald sperren. Schilder in zwei Sprachen. Ich soll es zurückholen. Ich bin der Einzige, den es kennt.'],
  8: ['Winter 1993', 'Achtzehn Nächte im Wald seit August. Es kommt, wenn ich rufe. Es kommt bis auf zwanzig Meter, und wenn ich die Lampe hebe, wird es zu Nebel. Ich habe die Lampe letzte Nacht gesenkt, um zu sehen, was passiert. Es ist einen Schritt näher gekommen und hat mit meiner Stimme gesagt: „Come home, W.“\nIch habe das noch nie laut gesagt. Nur gedacht. Am Rand der Senke, im Juli.\nEs frisst nicht nur, was liegt. Es frisst auch, was gerade entsteht.'],
  9: ['Oktober 1994, letzte Seite', 'Ich gehe heute Nacht rein, mit Band und Lampe. Wenn es auf die Stimme kommt, kommt es auf die Stimme. Wenn nicht, dann weiß Seiler wenigstens, dass wir es nicht zurückholen können, und lässt es in Ruhe.\nWolter war gestern hier. Er hat gesagt, das Projekt sei „erfüllt“. Ich habe gefragt, was das heißt. Er hat gesagt, der Wald sei jetzt leer, und das sei doch das Ziel gewesen.\nEs war nicht das Ziel. Das Ziel war, dass es keine Kinder mehr holt. Ob es das noch tut, weiß keiner vor der nächsten Öffnung. Wolter hat trotzdem abgehakt.\nShould have stayed in Ohio.'] };
const N6_PELL_VILLA = { 1: 'Zelle W, Station Nord', 2: 'Was es isst', 4: 'Freiwilliger' };
// Lukes Gedanke je Waldseite (knapp; „Wendigo“ sagt er nicht)
const N6_PELL_LUKE = { 7: 'Station Nord. Hier drin. Und Blechmann 3-4 hat ihm aufgemacht, weil er Hofer war.', 3: 'Neon als Korrektur. Dunkel als Belohnung. So erzieht man einen Hund.',
  5: 'Bonnie Tyler ist eine Zumutung. Da hat Hofer recht. Das ist das Schlimme.', 6: '„Unterschrieben nicht von Seiler.“ Von wem dann?', 8: 'Lampe heben: Nebel. Lampe senken: ein Schritt näher. … Lampe oben lassen.' };
// Fundorte im Wald (x, y-Probe, z) – das Heft liegt, wo Pell gesucht hat
function n6_pellOrte() { const T = typeof TIEF !== 'undefined' ? TIEF : null, W = typeof WALD !== 'undefined' ? WALD : null; if (!T || !W) return [];
  const J = T.jetty, R = T.ring, TS = T.stand;
  return [[7, W.nord.x + .5, .9, W.nord.z - .3], [3, TS.x + .55, 3.6, TS.z - .45], [5, T.bus.x + 2.9, .6, T.bus.z + 1.8], [8, R.x + 1.4, .6, R.z + 1.2], [6, J.x0 + (J.x1 - J.x0) * .3, .8, J.z0 + (J.z1 - J.z0) * .3]]; }
function n6_pellN() { let n = 0; for (let i = 1; i <= 9; i++) if (n6_has('pell_' + i)) n++; return n; }
function n6_waldN() { return [3, 5, 6, 7, 8, 9].filter(i => n6_has('pell_' + i)).length; }
function n6_pellHtml(i, t, txt) { return '<span style="display:block;text-align:center;font:700 .82em \'Courier New\',monospace;letter-spacing:.14em;border-bottom:1px solid rgba(40,30,20,.45);padding-bottom:4px;margin-bottom:10px">PELLS HEFT · STEMPEL „W“</span><i>Karierte Seite, Kaffeering, Kugelschreiber.</i>\n\n<b>Eintrag ' + i + ' · ' + t + '</b>\n<span class="hand">' + txt + '</span>'; }
// ---------------------------------------------------------------- R6-4 · „Annis Schleife“: drei Tore am Hauptweg (Mitte, Laufrichtung), je eine kleine Stille-Zone
const N6_TORE = [
  { id: 'g1', x: 26.5, z: 172.8, dx: -.894, dz: .447, on: () => K6.beat === 'faden' && !K6.sp.has('k6_hochsitz') },
  { id: 'g2', x: 31.5, z: 185.7, dx: .933, dz: .359, on: () => K6.beat === 'faden' && K6.sp.has('k6_hochsitz') },
  { id: 'g3', x: 31, z: 192.5, dx: -.932, dz: .363, on: () => K6.beat === 'frass' && !(typeof hungrige_has === 'function' && hungrige_has('spuren')) }];
const N6_REP = 5.5, N6_ZYKLUS = N6_REP * 3 + 10; // drei Durchläufe, dann die Naht (zehn Sekunden)
const N6_LOOP = { tor: null, t: 0, rep: -1, prev: 0, naht: false };
WORLD_MODS.push(['Kapitel 6 · Nebenaufgaben (N6-7, N6-8)', async () => {
  const T = THREE, G = N6.g = new T.Group(); G.name = 'neben6'; G.visible = false; scene.add(G); // Beton kollidiert (nur sichtbar = fest); Umschläge und Schlüssel sind keine Wände
  story.side.anni = { title: 'Papa, ich bin’s', desc: 'Eine Stimme im Wald. Ein Mädchen. Sie ruft nach ihrem Papa. Whiskey sieht nicht hin.', state: 'hidden' };
  story.side.pell = { title: 'Mit jedem Bissen', desc: 'Karierte Seiten mit Kaffeeringen, gestempelt „W“.', state: 'hidden' };
  modItem('spindschluessel', 'Schlüsselbund „3“', 'Zwei kleine Schlüssel an einem Ring. Ein Blechanhänger mit einer 3 und dem Auge.', 'key');
  modItem('lampion', 'Annis Lampion', 'Pergamentpapier, eine Sonne aus Buntpapier, ein Blechkerzenhalter ohne Kerze. Hofer hat ihn siebzehn Jahre in seinem Spind aufbewahrt.', 'paper');
  modItem('pell_kassette', 'Kassette „Come home, W.“', 'Pells Band aus dem Rekorder im Wrack. Jonas hat draufgeschrieben: NICHT NACHTS ANHÖREN.', 'paper');
  // Tore in die Stille-Zonen von kapitel6.js (nur solange die Schleife läuft)
  if (typeof K6_ZONEN !== 'undefined') for (const R of N6_TORE) K6_ZONEN.push({ id: 'anni_' + R.id, x: R.x + R.dx * 3, z: R.z + R.dz * 3, r: 5, soft: 7, on: () => N6_LOOP.tor === R });
  // --- Station Nord: Betonreste im Brombeergestrüpp rechts vom Gitter (Scan „barrier_ms“, halb versunken, gekippt) + Brombeeren
  if (typeof WALD !== 'undefined') { const N = WALD.nord;
    try { const src = await msModel('barrier_ms'); for (const [dx, dz, ry, tz, sy] of [[-.9, .2, .35, .22, .75], [1.1, -.6, 1.9, -.12, .6], [.3, 1.4, 2.7, .3, .45]]) { const o = msGround(msFit(src.clone(true), 2.4, 'max')); o.scale.y *= sy; o.position.set(N.x + dx, -.28, N.z + dz); o.rotation.set(0, ry, tz);
        o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.material = [].concat(m.material).map(q => { const c = q.clone(); if (c.color) c.color.multiplyScalar(.62); return c; }); if (m.material.length === 1) m.material = m.material[0]; } }); G.add(o); } } catch (e) { console.warn('Neben6: Station Nord', e); }
    try { const rb = (await msBake('raspberry')).filter(p => /VarB_LOD1$/.test(p.name)); if (rb.length) { const L = [], q = new T.Quaternion(), e = new T.Euler(); for (const [dx, dz, s] of [[-2.2, -.4, 1.3], [2.3, .9, 1.2], [-.4, 2.4, 1.1], [1.6, -2, 1.25], [-1.8, 1.9, 1]]) L.push(new T.Matrix4().compose(new T.Vector3(N.x + dx, 0, N.z + dz), q.setFromEuler(e.set(0, rand(0, 6.28), 0)), new T.Vector3(s, s, s)));
        for (const m of msInst(rb, L, { shadow: false })) { m.parent && m.parent.remove(m); G.add(m); } } } catch (e) { console.warn('Neben6: Brombeeren', e); } }
  // --- Pells Heft: Umschläge wie die Durchschläge der Akte Abgrund, Stempel „W“
  const mat = new T.MeshStandardMaterial({ roughness: .85, map: tex(cnv(256, (c, w) => { c.fillStyle = '#b39668'; c.fillRect(0, 0, w, w); for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(60,40,20,${rand(.03, .12)})`; c.fillRect(rand(0, w), rand(0, w), rand(4, 40), rand(2, 10)); }
    c.strokeStyle = 'rgba(90,60,30,.35)'; c.lineWidth = 5; c.beginPath(); c.arc(70, 190, 34, 0, 7); c.stroke(); // Kaffeering
    c.fillStyle = '#efe8d8'; c.fillRect(30, 18, 196, 60); c.fillStyle = '#2a2a2a'; c.font = 'bold 22px Courier New'; c.textAlign = 'center'; c.fillText('BfR · AST 7', w / 2, 44); c.font = '16px Courier New'; c.fillText('JOURNAL', w / 2, 66);
    c.save(); c.translate(w / 2 + 30, 160); c.rotate(-.14); c.strokeStyle = 'rgba(170,30,25,.85)'; c.lineWidth = 6; c.strokeRect(-40, -40, 80, 80); c.fillStyle = 'rgba(170,30,25,.85)'; c.font = 'bold 62px Courier New'; c.fillText('W', 0, 22); c.restore();
    if (typeof akte_auge === 'function') akte_auge(c, 60, 226, 14, 'rgba(30,30,30,.7)'); }), true) });
  for (const [i, x, yP, z] of n6_pellOrte()) { const m = new T.Mesh(new T.BoxGeometry(.24, .012, .32), mat); m.position.set(x, .02, z); m.rotation.y = rand(-.6, .6); m.castShadow = true; m.receiveShadow = true; m.userData.noCol = true; G.add(m);
    const hit = box(.45, .3, .5, x, .15, z, hidden, { cast: false }); interact(hit, () => !n6_offen() ? '' : n6_has('pell_' + i) ? 'Pells Heft · Eintrag ' + i : 'Eine Heftseite, gestempelt „W“', () => n6_pellLesen(i));
    N6.pages.push({ i, m, hit, x, yP, z }); if (typeof hintAdd === 'function') hintAdd({ id: 'n6_pell' + i, x, y: 0, z, kind: 'geheim', near: 22, open: () => n6_offen() && !n6_has('pell_' + i) }); }
  // --- N6-7 · Schlüsselbund am Fuß der Hochsitz-Leiter (Blechanhänger „3“ mit dem Auge)
  { const TS = N6_TS(), g = new T.Group(), met = new T.MeshStandardMaterial({ color: 0x8c8a84, roughness: .35, metalness: .9 });
    const ring = new T.Mesh(new T.TorusGeometry(.017, .0028, 6, 18), met); ring.rotation.x = PI / 2; g.add(ring);
    for (const [a, l] of [[.5, .045], [-.4, .038]]) { const k = new T.Mesh(new T.BoxGeometry(.008, .003, l), met); k.position.set(Math.sin(a) * (.017 + l / 2), 0, Math.cos(a) * (.017 + l / 2)); k.rotation.y = a; g.add(k); }
    const tag = new T.Mesh(new T.PlaneGeometry(.034, .026), new T.MeshStandardMaterial({ roughness: .4, metalness: .6, map: tex(cnv(64, (c, w) => { c.fillStyle = '#a3a6a4'; c.fillRect(0, 0, w, w); c.fillStyle = '#1c1c1c'; c.font = 'bold 30px Arial'; c.textAlign = 'center'; c.fillText('3', 20, 44); if (typeof akte_auge === 'function') akte_auge(c, 46, 32, 8, 'rgba(25,25,25,.9)'); }), true) }));
    tag.rotation.x = -PI / 2; tag.position.set(-.034, .002, -.01); g.add(tag); g.position.set(TS.x - .55, .02, TS.z - 2.35); g.rotation.y = .6; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.userData.noCol = true; G.add(g); N6.keyM = g;
    N6.keyHit = box(.4, .3, .4, TS.x - .55, .12, TS.z - 2.35, hidden, { cast: false }); interact(N6.keyHit, () => n6_offen() && !(story.items || []).includes('spindschluessel') && !n6_has('n67_spind') ? 'Etwas glänzt im Laub' : '', () => n6_schluessel());
    if (typeof hintAdd === 'function') hintAdd({ id: 'n6_schluessel', x: TS.x - .55, y: 0, z: TS.z - 2.35, kind: 'geheim', near: 14, open: () => n6_offen() && !(story.items || []).includes('spindschluessel') && !n6_has('n67_spind') }); }
  // --- N6-7 · Hofers Spind im Amtsbus, hinter dem Fahrersitz
  if (typeof TIEF !== 'undefined') { const B = TIEF.bus, bg = typeof tief_S !== 'undefined' ? tief_S.busG : null; let sw = null; if (bg) { try { n6_spindBau(bg); sw = tief_busW(.78, 1.1, -.55); } catch (e) { console.warn('Neben6: Spind', e); } }
    N6.spindHit = sw ? box(1.1, 1.5, 2.6, sw.x, sw.y, sw.z, hidden, { cast: false }) : box(.8, 1, .8, B.x + .5, 1.2, B.z + .2, hidden, { cast: false }); // lang nach hinten gestreckt: man zielt durch die Heckscheibe auf die Tür
    interact(N6.spindHit, () => !n6_offen() || n6_falle() ? '' : n6_has('n67_spind') ? 'Hofers Spind (leer)' : (story.items || []).includes('spindschluessel') ? 'Den Blechspind mit der 3 aufschließen' : 'Ein schmaler Blechspind hinter dem Fahrersitz', () => n6_spind());
    if (typeof hintAdd === 'function') hintAdd({ id: 'n6_spind', x: B.x + .5, y: 0, z: B.z + .2, kind: 'story', near: 40, open: () => n6_offen() && (story.items || []).includes('spindschluessel') && !n6_has('n67_spind') && !n6_falle() });
    // --- N6-8 · Pells Rekorder im Handschuhfach des Wracks (nach dem Polaroid aus kapitel6.js an derselben Stelle)
    const W = TIEF.wreck; N6.rekHit = box(.6, .5, .6, W.x + 1.1, .9, W.z - .7, hidden, { cast: false }); interact(N6.rekHit, () => !n6_offen() ? '' : !n6_has('pell_9') ? 'Im Handschuhfach: ein Rekorder' : !N6.band ? 'Pells Rekorder – das Band hören (zwei Batterien)' : 'Pells Rekorder', () => n6_rekorder()); uninteract(N6.rekHit); }
  N6.ready = true; // Stand nach dem Laden setzt der MOD_SAVE-Eintrag (beim Aufbau gibt es story.items noch nicht)
}]);
// Hofers Spind: schmaler Blechspind im Laderaum hinter dem Fahrersitz (links, Tür nach hinten), grüngraue Farbe, Rost, Lüftungsschlitze, eine weiße „3“ und das Auge darunter, Hebelgriff und Hängeschloss.
// Die Tür schwingt auf, sobald Annis Lampion herausgenommen ist (n6_spindTick).
function n6_spindBau(bus) { const T = THREE, g = new T.Group(); g.position.set(.78, .5, .22); g.rotation.y = PI; bus.add(g); // Ursprung: Boden des Laderaums; Vorderseite des Spinds = +z der Gruppe (nach hinten gedreht)
  const door = new T.Group(); door.position.set(-.16, 0, .18); g.add(door); // Scharnier an der linken Kante
  const tx = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 768; const x = c.getContext('2d'); x.fillStyle = '#5c6a5e'; x.fillRect(0, 0, 256, 768);
    for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${rand(30, 80) | 0},${rand(40, 80) | 0},${rand(30, 70) | 0},${rand(.03, .12)})`; x.fillRect(rand(0, 256), rand(0, 768), rand(2, 30), rand(1, 4)); }
    for (let i = 0; i < 30; i++) { const rx = rand(0, 256), ry = rand(300, 768), gr = x.createLinearGradient(0, ry, 0, ry + rand(60, 220)); gr.addColorStop(0, `rgba(110,56,24,${rand(.2, .5)})`); gr.addColorStop(1, 'rgba(110,56,24,0)'); x.fillStyle = gr; x.fillRect(rx, ry, rand(3, 10), 240); }
    for (let i = 0; i < 20; i++) { x.fillStyle = `rgba(120,64,30,${rand(.25, .6)})`; x.beginPath(); x.arc(rand(0, 256), rand(500, 768), rand(4, 22), 0, 7); x.fill(); }
    for (let k = 0; k < 4; k++) { x.fillStyle = '#1b1c1b'; x.fillRect(60, 40 + k * 22, 136, 8); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(60, 48 + k * 22, 136, 2); } // Lüftungsschlitze
    x.strokeStyle = '#e4e0d2'; x.lineWidth = 17; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(84, 232); x.bezierCurveTo(100, 196, 166, 196, 168, 244); x.bezierCurveTo(170, 282, 122, 292, 118, 292); x.bezierCurveTo(176, 296, 182, 350, 164, 386); x.bezierCurveTo(146, 420, 92, 420, 78, 384); x.stroke(); // von Hand gemalte 3
    x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(0, 0, 8, 768); x.fillRect(248, 0, 8, 768); if (typeof akte_auge === 'function') akte_auge(x, 128, 540, 34, 'rgba(235,230,214,.92)');
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; })();
  const dm = new T.MeshStandardMaterial({ map: tx, roughness: .55, metalness: .55 }), body = new T.MeshStandardMaterial({ color: 0x4a574c, roughness: .6, metalness: .5 }), met = new T.MeshStandardMaterial({ color: 0x8a8a86, roughness: .35, metalness: .9 });
  const dr = new T.Mesh(new T.BoxGeometry(.32, 1.2, .018), [body, body, body, body, dm, body]); dr.position.set(.16, .6, 0); dr.castShadow = true; dr.receiveShadow = true; door.add(dr);
  const ha = new T.Mesh(new T.BoxGeometry(.022, .1, .02), met); ha.position.set(.27, .62, .02); door.add(ha); const lk = new T.Mesh(new T.BoxGeometry(.03, .045, .02), met); lk.position.set(.27, .5, .016); door.add(lk); // Griff, Schloss
  const sh = new T.Mesh(new T.TorusGeometry(.011, .003, 5, 12, PI * 1.3), met); sh.position.set(.27, .545, .016); door.add(sh);
  // Korpus (hinten, Seiten, Decke, Boden): innen leer
  const parts = [[.32, 1.2, .012, 0, .6, -.17], [.012, 1.2, .36, -.158, .6, 0], [.012, 1.2, .36, .158, .6, 0], [.32, .012, .36, 0, 1.194, 0], [.32, .012, .36, 0, .006, 0]]; for (const [w, h, d, x, y, z] of parts) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), body); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); }
  N6.spind = { g, door }; return g; }
function n6_spindTick(dt) { const S = N6.spind; if (!S) return; const ziel = n6_has('n67_spind') ? -1.75 : 0, d = S.door.rotation.y; if (Math.abs(d - ziel) > .002) S.door.rotation.y += (ziel - d) * Math.min(1, dt * 2.2); }
function n6_offen() { return typeof wald_frei === 'function' && wald_frei(); }
function n6_falle() { return typeof K6 !== 'undefined' && K6.falleAn && !K6.falleFertig; }
// Laden: Villa-Seiten als Lore nachtragen, Funde ausblenden, Rekorder-Stand
function n6_nachLaden() {
  for (let n = 1; n <= 3; n++) if (typeof villa_hat === 'function' && villa_hat('pell' + n)) n6_pellVilla(n);
  N6.band = n6_has('pell_band'); for (const p of N6.pages) p.m.visible = !n6_has('pell_' + p.i);
  if (N6.keyM) N6.keyM.visible = !(story.items || []).includes('spindschluessel') && !n6_has('n67_spind'); n6_projekt(true);
}
// ---------------------------------------------------------------- N6-8 · Pells Heft
function n6_pellVilla(n) { // villa.js: Karton „W“ (Einträge 1, 2, 4) – nur die Lore-Seite; Zähler und Aufgabe erst im Wald
  const i = [1, 2, 4][n - 1], k = 'pell_' + i; if (!i || n6_has(k) || typeof VILLA_PELL === 'undefined') return;
  const raw = VILLA_PELL[n - 1].replace(/^<b>[^<]*<\/b>\n/, ''); story.lore.push({ key: k, title: 'Pells Heft · Eintrag ' + i + ' · ' + N6_PELL_VILLA[i], html: n6_pellHtml(i, N6_PELL_VILLA[i], raw) });
}
function n6_pellLesen(i) {
  const [t, txt] = N6_PELL[i], k = 'pell_' + i, neu = !n6_has(k), html = n6_pellHtml(i, t, txt);
  if (neu) { Audio.paper(); story.lore.push({ key: k, title: 'Pells Heft · Eintrag ' + i + ' · ' + t, html }); const p = N6.pages.find(q => q.i === i); if (p) p.m.visible = false; }
  openNote('Pells Heft · Eintrag ' + i, html, null, () => { if (!neu) return; n6_pellStand(true);
    if (N6_PELL_LUKE[i] && typeof gedanke === 'function') gedanke('n6_pell' + i, N6_PELL_LUKE[i], 800, 3);
    if (i === 7 && !N6.heard.has('pell_start')) { N6.heard.add('pell_start'); setTimeout(() => n6_luke('Ein Amerikaner. Mit Kaffeeflecken. Und er hat hier drin etwas gehalten, das ausgebrochen ist.', 4200), 2600); } });
}
function n6_pellStand(pop) { // Fibel-Zähler, Aufgabe, Projekt, „Erfüllt.“
  const n = n6_pellN(), w = n6_waldN(), q = story.side.pell; if (!q) return; sideStart('pell'); // nur aus dem Wald (Kap. 6) aufgerufen
  const h = story.lore.find(l => l.key === 'pell_heft'), hh = 'Pells Heft · ' + n + ' von 9. Karierte Seiten, Kaffeeringe, Stempel „W“. Drei lagen in der Villa (Karton „W“), sechs im Wald: Station Nord, Hochsitz, Amtsbus, Steinkreis, Weiher-Steg, Wrack.';
  if (h) { h.title = 'Pells Heft'; h.html = hh; } else story.lore.push({ key: 'pell_heft', title: 'Pells Heft', html: hh });
  if (pop) questPop('PELLS HEFT ' + n + ' / 9', 'Mit jedem Bissen');
  q.desc = n >= 9 ? 'Alle neun Seiten. „Erfüllt.“' : 'Pells Heft: ' + n + ' von 9 Seiten.' + (w < 6 ? ' Im Wald fehlen noch ' + (6 - w) + '. Er hat da gesucht, wo man es trifft: Station Nord, Hochsitz, Bus, Steinkreis, Steg, Wrack.' : ' Die drei übrigen lagen in der Villa, im Karton „W“.');
  n6_projekt(false);
  if (n >= 9 && !n6_has('pell_erfuellt')) { story.lore.push({ key: 'pell_erfuellt', title: 'Erfüllt.', html: '<span class="hand">„Erfüllt.“ Sie haben ihm den Wald ausgewischt wie eine Tafel, und Wolter hat es abgehakt.</span>' });
    sideDone('pell', 'Alle neun Seiten von Pells Heft. „Erfüllt.“'); if (typeof gedanke === 'function') gedanke('n6_erfuellt', '„Erfüllt.“ Sie haben ihm den Wald ausgewischt wie eine Tafel, und Wolter hat es abgehakt.', 2600, 3); }
}
function n6_projekt(still) { // Lore „Projekt WENDIGO“ (mit sechs Seiten oder dem Band); das Wort erst nach Hofers Seite 1 (Wer was wann weiß)
  const w = n6_waldN(); if (w < 6 && !N6.band) return; const wort = typeof hungrige_has === 'function' && hungrige_has('spuren');
  const html = 'Probe W: 1992 von Bergung 3 aus der Senke geholt, „wie ein nasser Sack“. Pell hat es in Station Nord gehalten. Es frisst kein Fleisch, sondern die Bilder, die nach einer Öffnung an den Orten hängen. Wirt 1: ein Hirsch. Wirt 2: Gefreiter Hofer, freiwillig. Am 13. Juli 1992 war die Zelle leer.\n\nPell hat es achtzehn Nächte lang im Wald gerufen. Hob er die Lampe, wurde es zu Nebel. Senkte er sie, kam es näher – mit seiner Stimme. Im Oktober 1994 ist er mit Band und Lampe hineingegangen.'
    + (N6.band ? '\n\nAuf dem Band sagt es seinen Satz zu Ende, als er schon nicht mehr redet: „Come … home … W.“' : '');
  const l = story.lore.find(x => x.key === 'pell_projekt'), title = wort ? 'Projekt WENDIGO' : 'Projekt W';
  if (l) { l.title = title; l.html = html; } else { story.lore.push({ key: 'pell_projekt', title, html }); if (!still) questPop('ABENTEUERFIBEL', title); }
}
// ---------------------------------------------------------------- N6-8 · der Rekorder (Handschuhfach), Jonas’ Zettel, drei Batterien „for the dark“, das Band
async function n6_rekorder() {
  if (N6.busy) return;
  if (!n6_has('pell_9')) { const [t, txt] = N6_PELL[9]; Audio.play('metalOpen', { gain: .15, rate: 1.4 }); story.lore.push({ key: 'pell_9', title: 'Pells Heft · Eintrag 9 · ' + t, html: n6_pellHtml(9, t, txt) });
    const jonas = '<i>Hinter dem Polaroid: ein Kassettenrekorder, ohne Batterien. Darauf ein Zettel mit Tesafilm, Kinderschrift, Kuli:</i>\n\n<span class="hand">Hab ich am Steinkreis gefunden, im Laub, mit Band drin. Und die Seiten.\nDa redet ein Ami. Dann redet er nicht mehr, aber es redet weiter.\nNICHT NACHTS ANHÖREN.\n— J. (12)</span>\n\n<i>Darunter die letzte Heftseite, noch an der Pappe des Rückendeckels. Auf die Pappe sind mit Klebeband drei Batterien geklebt. Darüber, in Pells Schrift:</i> <span class="hand">for the dark</span>\n\n';
    await new Promise(r => openNote('Im Handschuhfach · Pells Rekorder', jonas + n6_pellHtml(9, t, txt), null, r)); n6_pellStand(true);
    if (typeof gedanke === 'function') gedanke('n6_ohio', 'Should have stayed in Ohio. … Ja. Hättest du.', 600, 3);
    await wait(900); let w = 0; if (typeof k6_wahl === 'function' && typeof K6 !== 'undefined' && K6.wahl) w = await k6_wahl(['Zwei Batterien in den Rekorder. Das Band hören.', 'Die drei Batterien nehmen. Nicht nachts anhören.'], 20000);
    if (w === 1 || w < 0) { N6.bat = true; addBattery(3); n6_luke('Licht. Das Band läuft mir nicht weg.', 2600); return; }
    addBattery(1); return n6_band(); } // wer das Band hört, bezahlt es mit Licht: eine Batterie netto
  if (N6.band) return toast('Pells Band. „Come home, W.“ Jonas hatte recht.', 3000);
  if (N6.bat) { if ((FLASH.spare || 0) < 2) return toast('Der Rekorder braucht zwei Batterien. Du hast nicht genug.', 3000); FLASH.spare -= 2; try { flashApply(); } catch (e) {} }
  return n6_band();
}
async function n6_band() { // etwa fünfzig Sekunden: Kassettenrauschen, Mikrofon nah (Stufe 2: das zweite „Come home“)
  N6.busy = true; const W = TIEF.wreck, x = W.x + 1.1, z = W.z - .7, st = k => { if (typeof stimmen_spielen === 'function') try { stimmen_spielen(k, { x, y: 1, z }); } catch (e) {} };
  state.talking = true; Audio.play('switch1', { gain: .2, rate: .8 }); Audio.radio(x, z);
  try {
    await wait(900); st('pell_band_1'); await say([['„October. Ich bin am Kreis. Lamp up. Come home, W.“', 4600, 'PELL (BAND)']]);
    try { Audio.owl && Audio.owl(x, z); Audio.caw(x, 1, z); Audio.gust && Audio.gust(.6); } catch (e) {} subtitle('<i>Waldgeräusche auf dem Band. Dann gehen sie aus, eins nach dem anderen, als drehe jemand Regler zu.</i>', 4200); await wait(4600);
    await say([['Das ist keine Blende. Da schneidet einer Löcher in die Aufnahme.', 3600, 'LUKE']]);
    st('pell_band_2'); await say([['„Twenty metres. Ich senke jetzt die Lampe. For science.“', 4200, 'PELL (BAND)']]);
    for (let k = 0; k < 3; k++) { await wait(1300); if (typeof kino_atem === 'function') kino_atem(k < 2 ? .06 : .09, k < 2 ? 1 : .62, x, 1, z); } subtitle('<i>Zwei Atemzüge. Dann ein dritter, der nicht dazugehört.</i>', 3200); await wait(3000);
    scareCount++; glitchV = Math.max(glitchV, .45); Audio.heart(); st('pell_band_3'); Audio.whisper(x, 1, z, 1.4); await say([['„Come … home … W.“', 4800, 'PELLS STIMME?']]);
    subtitle('<i>Hofers Lachen.</i>', 2600, 'HOFER?'); await wait(2800);
    st('pell_band_4'); await say([['„Should have stayed in Ohio.“', 3400, 'PELLS STIMME?']]);
    subtitle('<i>Das Band läuft leer.</i>', 3000); await wait(3200);
  } finally { Audio.radio(x, z, true); state.talking = false; N6.busy = false; }
  N6.band = true; addItem('pell_kassette');
  story.lore.push({ key: 'pell_band', title: 'Pells Band', html: '<span class="hand">„October. Ich bin am Kreis. Lamp up. Come home, W.“</span>\n<i>Waldgeräusche, die ausgehen, eins nach dem anderen.</i>\n<span class="hand">„Twenty metres. Ich senke jetzt die Lampe. For science.“</span>\n<i>Zwei Atemzüge. Ein dritter.</i>\n<span class="hand">„Come … home … W.“</span> <i>– zu langsam, falsch betont.</i>\n<i>Hofers Lachen.</i>\n<span class="hand">„Should have stayed in Ohio.“</span>\n\nDas hat er geschrieben. In sein Heft. Das hat er nie gesagt.' });
  n6_projekt(false); await wait(600); await say([['Das hat er geschrieben. In sein Heft. Das hat er nie gesagt.', 3800, 'LUKE']]);
  if (typeof saveGame === 'function') saveGame(curChapter());
}
// ---------------------------------------------------------------- N6-7 · Schlüsselbund, Blatt, Spind, drei Sätze
function n6_anniDesc(t) { const q = story.side.anni; if (!q) return; sideStart('anni'); if (t) q.desc = t; }
function n6_schluessel() {
  if (story.items.includes('spindschluessel') || n6_has('n67_spind')) return; addItem('spindschluessel'); Audio.play('keys2', { gain: .2, rate: 1.5 }); if (N6.keyM) N6.keyM.visible = false;
  const satz = N6.heard.has('anni_2') && n6_has('hungrige_seite_2');
  n6_anniDesc('Am Fuß der Hochsitz-Leiter, im Laub: ein Schlüsselbund. Blechanhänger mit einer 3 und dem Auge. Das Amt schließt hier draußen nur an einem Ort etwas ab: im alten Bus.');
  setTimeout(() => n6_luke(satz ? 'Das ist der Satz aus dem Dienstbuch. Das ist sein Kind.' : 'Eine Drei. Und das Auge. Das ist vom Amt.', 3400), 500);
  if (typeof gedanke === 'function') gedanke('n6_schluessel', 'Eine Drei und das Auge. Irgendwo hier draußen gibt’s einen Spind mit einer Drei.', 4500, 3);
}
function n6_blattGelesen() { // hungrige.js: Seite 1b an der Fraßstelle
  if (!n6_has('n67_anni')) story.lore.push({ key: 'n67_anni', title: 'Anni Hofer', html: '<span class="hand">Anni Hofer. Aus dem Dienstbuch.</span>\n\n„Papa ich hab den Lampion gewonen!! Ich darf vorne laufen.“ – Sie hat nichts gewonnen. Sie ist gezogen worden. Ihr Vater hat unterschrieben.' });
  n6_anniDesc('Anni Hofer. Aus dem Dienstbuch. Sie hat den Lampion nicht gewonnen, sie ist gezogen worden – und Hofer hat unterschrieben.' + (story.items.includes('spindschluessel') && !n6_has('n67_spind') ? ' Der Schlüssel mit der 3 passt vielleicht in den Bus.' : ''));
}
async function n6_spind() {
  if (!n6_offen() || n6_falle() || N6.busy) return;
  if (n6_has('n67_spind')) return toast('Der Spind ist leer. Innen, mit Kuli an die Tür geschrieben: ANNI.', 3000);
  if (!(story.items || []).includes('spindschluessel')) return toast('Ein schmaler Blechspind hinter dem Fahrersitz. Abgeschlossen. Eine 3 auf der Tür, darunter das Auge.', 3600);
  N6.busy = true; Audio.play('metalOpen', { gain: .3, rate: .9 }); story.items = story.items.filter(k => k !== 'spindschluessel'); addItem('lampion');
  story.lore.push({ key: 'n67_spind', title: 'Annis Lampion', html: 'Hofers Spind im Amtsbus, Nummer 3. Darin: ein Lampion aus Pergamentpapier mit einer Sonne aus Buntpapier, ein Blechkerzenhalter ohne Kerze. Eine Thermoskanne. Eine Musikkassette: „Bonnie Tyler“.\n\nSiebzehn Jahre hat er den Lampion aufbewahrt.' });
  await new Promise(r => openNote('Hofers Spind', 'Der Schlüssel passt. Die Tür klemmt, dann gibt sie nach.\n\nEin Lampion aus Pergamentpapier, eine Sonne aus Buntpapier aufgeklebt, ein Blechkerzenhalter ohne Kerze. Eine Thermoskanne. Eine Musikkassette, das Etikett mit Kuli: <b>Bonnie Tyler</b>.', null, r));
  await say([['Das Poster, das sie nicht mochte. Er hat die Kassette trotzdem aufgehoben.', 3800, 'LUKE']]);
  const W = typeof whiskey_S !== 'undefined' ? whiskey_S : null; // Humor, knapp: Whiskey will den glänzenden Kerzenhalter
  if (W && W.g && W.g.visible && W.g.position.distanceTo(player.pos) < 30 && typeof whiskey_setzen === 'function') { const f = flatDir(), P = player.pos; whiskey_setzen(P.x + f.x * 1.2 - f.z * .6, .9, P.z + f.z * 1.2 + f.x * .6, () => {
    setTimeout(async () => { try { whiskey_mimic('gurren', { force: true }); } catch (e) {} await wait(900); await say([['Nein. Das ist ein Beweisstück.', 2400, 'LUKE']]); try { if (typeof whiskey_play === 'function') whiskey_play('IdleScratchWing', .2); } catch (e) {} }, 700); /* Gag-Budget H-1: kein Pling */ }); }
  N6.busy = false; n6_anniDesc('Annis Lampion. Hofer hat ihn siebzehn Jahre in seinem Spind aufbewahrt.'); n6_anniFertig();
  if (typeof saveGame === 'function') saveGame(curChapter());
}
function n6_anniFertig() { // Fibel „Drei Sätze“; der letzte Satz kommt erst nach dem Höhepunkt dazu
  if (!(story.items || []).includes('lampion') && !n6_has('n67_spind')) return; const blick = typeof hungrige_has === 'function' && hungrige_has('blick');
  if (!N6.heard.has('anni_5') && !blick) return; if (n6_has('n67_drei')) return;
  story.lore.push({ key: 'n67_drei', title: 'Drei Sätze', html: n6_dreiHtml() }); sideDone('anni', 'Drei Sätze. Er hat von jedem nur das, was der Wirt im Kopf hatte.');
}
function n6_dreiHtml() { const fin = typeof hungrige_S !== 'undefined' && hungrige_S.finale;
  return '<span class="hand">Er hat von jedem, den er gefressen hat, nur das, was der Wirt im Kopf hatte. Von Anni drei Sätze. Von Lucy ein Wort. Von mir …' + (fin ? ' einen Ruf.' : '') + '</span>'; }
// ---------------------------------------------------------------- R6-4 · die Schleife (Tore); Stufe 2 bei Fehlschlag, kein Tod
function n6_loopTick(dt, P) {
  const L = N6_LOOP; if (typeof K6 === 'undefined' || !K6.on) { if (L.tor) L.tor = null; return; }
  if (!L.tor) { for (const R of N6_TORE) { if (N6.gates[R.id] || !R.on()) continue; const d = Math.hypot(P.x - R.x, P.z - R.z); if (d < 16 && d > 4 && !state.talking) { L.tor = R; L.t = 0; L.rep = -1; L.naht = false; L.prev = (P.x - R.x) * R.dx + (P.z - R.z) * R.dz; break; } } return; }
  const R = L.tor; if (!R.on() || Math.hypot(P.x - R.x, P.z - R.z) > 30) { L.tor = null; return; }
  L.t += dt; const ph = L.t % N6_ZYKLUS, rep = ph < N6_REP * 3 ? Math.floor(ph / N6_REP) : -1, naht = rep < 0, vx = R.x + R.dx * 7, vz = R.z + R.dz * 7;
  if (rep >= 0 && rep !== L.rep && ph - rep * N6_REP > .3) { L.rep = rep; if (typeof hungrige_stimme === 'function') hungrige_stimme(vx, 1.2, vz, '„Papa? Papa, ich bin’s.“', 'ANNI?', 2600, 'anni_loop'); // gleich betont, der Atemzug an derselben Stelle
    setTimeout(() => { if (N6_LOOP.tor === R && typeof kino_atem === 'function') kino_atem(.05, 1.1, vx, 1.2, vz); }, 3000);
    if (!N6.loopSaid && L.rep === 0) { N6.loopSaid = true; setTimeout(() => { n6_luke('Das ist ein Loop. Ich hab Hörbücher geschnitten, ich kenn einen Loop. Sie atmet an derselben Stelle.', 5200); n6_anniDesc('Die Stimme kommt immer wieder. Gleich betont, der Atemzug an derselben Stelle. Ein Loop.'); }, 3600); } }
  if (naht && !L.naht) { L.rep = -1; if (N6.fails >= 2) { const W = typeof whiskey_S !== 'undefined' ? whiskey_S : null; if (W && W.g && W.g.visible && !W.fl && typeof whiskey_fly === 'function') whiskey_fly(new THREE.Vector3(R.x + R.dx * 10, 3, R.z + R.dz * 10), null); } } // Hilfe 3: Whiskey fliegt genau in der Pause los
  L.naht = naht;
  const s = (P.x - R.x) * R.dx + (P.z - R.z) * R.dz, lat = Math.abs((P.x - R.x) * R.dz - (P.z - R.z) * R.dx);
  if (L.prev < 0 && s >= 0 && lat < 7) { N6.gates[R.id] = naht ? 'ok' : 'fail'; L.tor = null; if (naht) n6_torOk(); else n6_torFail(P); }
  L.prev = s;
}
function n6_torOk() { N6.oks++; if (N6.oks === 1 && typeof gedanke === 'function') gedanke('n6_naht', 'In der Naht vorbei. Da, wo er von vorn anfängt, hört er nichts.', 400, 3); }
function n6_torFail(P) { // Satz 2 direkt am Ohr; die Zone lässt die Lampe drei Sekunden flackern
  N6.fails++; scareCount++; const f = flatDir(); if (typeof hungrige_stimme === 'function') hungrige_stimme(P.x - f.z * .5, 1.65, P.z + f.x * .5, '„Papa? … Papa, ich bin gleich wieder da.“', 'ANNI?', 3200, 'anni_ohr');
  state.flashFail = Math.max(state.flashFail, 3); shake = Math.max(shake, .06); glitchV = Math.max(glitchV, .5); Audio.heart();
  if (N6.fails === 1) setTimeout(() => n6_luke('Jeder Loop hat eine Naht. Da, wo er von vorn anfängt.', 3600), 3800);
  else if (N6.fails >= 3) setTimeout(() => toast('Warte auf die Naht.', 3000), 3600);
}
// ---------------------------------------------------------------- Takt
WORLD_TICK.push((dt, t) => {
  const S = N6; if (!S.ready || !state.started || menu.attract) return; const on = n6_offen(); if (S.g.visible !== on) S.g.visible = on; if (!on) return;
  const P = player.pos; n6_loopTick(dt, P); n6_spindTick(dt);
  S.t -= dt; if (S.t > 0) return; S.t = .25;
  if (!S.villaChk) { S.villaChk = true; n6_nachLaden(); } // auch für Spielstände ohne „neben6“-Eintrag: Villa-Seiten nachtragen, Funde ausblenden
  // Umschläge auf die echte Oberfläche legen (Beton, Plattform, Steg), sobald die Kollision steht
  if (!S.placed && typeof SOL !== 'undefined' && SOL.items.length) { S.placed = true; for (const p of S.pages) { const g = solidGround(p.x, p.yP, p.z), y = g > -1 ? g + .012 : .02; p.m.position.y = y; p.hit.position.y = y + .15; } }
  // Rekorder übernimmt das Handschuhfach, sobald kapitel6.js das Polaroid gezeigt hat (derselbe Platz, sonst verdeckt der eine den anderen)
  if (S.rekHit && typeof K6 !== 'undefined' && K6.told.has('handschuhfach') && !interactables.includes(S.rekHit)) { if (K6.hfHit) uninteract(K6.hfHit); interactables.push(S.rekHit); }
  // N6-7: Start mit der ersten Stimme (UK 3), Schritt 5 (die dritte Stimme vor der Silhouette), Nachtrag nach dem Höhepunkt
  if (S.heard.has('anni_1') && story.side.anni && story.side.anni.state === 'hidden') sideStart('anni');
  if (S.heard.has('anni_5') && !S.heard.has('anni5_luke')) { S.heard.add('anni5_luke'); setTimeout(() => n6_luke('Das hat sie nie gesagt. Das ist er. Das ist nur er.', 3600), 5600); n6_anniFertig(); }
  if (!n6_has('n67_drei') && typeof hungrige_has === 'function' && hungrige_has('blick')) n6_anniFertig();
  const drei = story.lore.find(l => l.key === 'n67_drei'); if (drei && typeof hungrige_S !== 'undefined' && hungrige_S.finale && !/Ruf/.test(drei.html)) drei.html = n6_dreiHtml();
  const pr = story.lore.find(l => l.key === 'pell_projekt'); if (pr && pr.title === 'Projekt W' && typeof hungrige_has === 'function' && hungrige_has('spuren')) pr.title = 'Projekt WENDIGO';
});
window.__n6 = { S: N6, L: N6_LOOP, tore: N6_TORE, pell: i => n6_pellLesen(i), rek: () => n6_rekorder(), band: () => n6_band(), spind: () => n6_spind(), key: () => n6_schluessel() }; // Testzugriff
