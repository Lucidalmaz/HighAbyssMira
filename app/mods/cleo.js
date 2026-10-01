// =====================================================================  CLEO (Modul „cleo“): Eine für sieben (Fassung 3; früher „Die Vergessene“)
// Cleo, 8, wohnte im Birkenweg. Zu ihrem Geburtstag am 25. Juli 2009 kam niemand außer Lucy. Drei Tage später, als die Sieben geholt wurden,
// ging sie freiwillig mit ins Licht: „Eine für sieben. Dann dürfen alle heim.“ (Spiegel von Mira 1312: „ich für sechs“).
// Kinderregel des Lichts: „Geschenkt ist geschenkt, wiederholen ist gestohlen.“ Wer sich verschenkt, gehört dem Kind im Licht ganz – mit Namen und Erinnerung.
// Darum erinnert sich niemand an Cleo, nicht einmal ihre Eltern. Nur Lucy hat sie jeden Tag in ihr Tagebuch geschrieben: „C.“
// Spuren: Kap. 1 – Lucys Tagebuch, die Lücke im Gruppenfoto, der weiß gekratzte achte Stein am Gedenkfeld · Kap. 2 – die Akte ohne Nummer („FREIWILLIG“)
// Kap. 3 – Whiskey tauscht den Baumhausschlüssel, das Baumhaus in den Forbidden Dustwoods · Ende: Luke schreibt ihren Namen mit Kreide auf den Stein. Er „stiehlt“ ihn zurück.
// AP-24 (N6-3): im Baumhaus nasse Kinderfinger-Abdrücke, die Keksdose mit acht Kronkorken (R, H, M, D, L, L, Z, einer leer); das Ende liegt am Steinkreis im tiefen Wald:
//   sieben Steine stehen, der achte liegt im Moos – Luke schreibt CLEO darauf (E halten, Buchstabe für Buchstabe). Die Kreide bleibt (Gedenkfeld-Fassung weiter möglich).
const cleo_S = { ready: false, stone: null, name: null, up: false, lid: null, baum: [], baumHits: [], k: 0 };
const CLEO_STONE = { x: -48.65, z: 72.95 };
const cleo_has = k => story.lore.some(l => l.key === k);
function cleo_start(desc) { sideStart('cleo'); if (desc) story.side.cleo.desc = desc; }
WORLD_MODS.push(['Cleo', async () => {
  const S = cleo_S, T = THREE, X = C2.x, Z = C2.z;
  story.side.cleo = { title: 'Eine für sieben', desc: 'In Lucys Tagebuch steht immer wieder ein einzelner Buchstabe: C.', state: 'hidden' };
  modItem('cleo_kreide', 'Weiße Kreide', 'Ein Stück Kreide, mit Klebeband umwickelt. Auf dem Band, in Kinderschrift: C.', 'paper');
  modItem('cleo_dose', 'Keksdose mit acht Kronkorken', 'Sieben tragen Filzstift-Buchstaben: R, H, M, D, L, L, Z. Der achte ist leer.', 'paper');
  // --- Der achte Stein am Gedenkfeld, links neben Zayn
  try { const g = await msModel('grave_weathered', 'model.glb'); const o = msGround(msFit(g.clone(true), .62, 'y')); o.position.set(CLEO_STONE.x, -.03, CLEO_STONE.z); o.rotation.y = .06;
    o.traverse(m => { if (m.isMesh) { m.material = [].concat(m.material).map(q => { const c = q.clone(); c.color = new T.Color(1.35, 1.32, 1.25); return c; }); if (m.material.length === 1) m.material = m.material[0]; m.castShadow = true; m.receiveShadow = true; } }); scene.add(o); S.stone = o; } catch (e) { console.warn('Cleo: Stein', e); }
  const plate = (fn) => { const m = new T.Mesh(new T.PlaneGeometry(.34, .24), new T.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, map: tex(cnv(256, fn), true) }));
    m.position.set(CLEO_STONE.x, .36, CLEO_STONE.z - .16); m.rotation.y = PI; scene.add(m); return m; };
  plate((x, w) => { x.clearRect(0, 0, w, w); x.fillStyle = 'rgba(240,238,230,.75)'; for (let i = 0; i < 90; i++) { x.save(); x.translate(rand(30, 226), rand(40, 150)); x.rotate(rand(-.5, .5)); x.fillRect(0, 0, rand(20, 70), rand(1, 3)); x.restore(); }
    x.fillStyle = 'rgba(40,36,30,.7)'; x.font = 'bold 40px Georgia'; x.fillText('C', 28, 110); x.font = '26px Georgia'; x.textAlign = 'center'; x.fillText('† 28. 7. 2009', w / 2, 200); });
  S.name = plate((x, w) => { x.clearRect(0, 0, w, w); x.save(); x.translate(w / 2, 100); x.rotate(-.05); x.fillStyle = 'rgba(250,250,245,.95)'; x.font = 'bold 62px "Comic Sans MS", cursive'; x.textAlign = 'center'; x.fillText('CLEO', 0, 0); x.restore(); });
  S.name.position.z -= .004; S.name.visible = false;
  { const hit = box(.6, .8, .5, CLEO_STONE.x, .4, CLEO_STONE.z, hidden, { cast: false });
    interact(hit, () => cleo_has('cleo_ende') ? 'CLEO' : story.items.includes('cleo_kreide') ? 'Ihren Namen auf den Stein schreiben' : 'Der achte Stein', () => cleo_stone()); }
  // --- Kapitel 2: die Akte ohne Nummer (Archiv, zweiter Schrank, unterste Schublade)
  { const hit = box(.9, .3, .45, X + 22, .32, Z - 5.3, hidden, { cast: false });
    interact(hit, () => cleo_has('cleo_akte') ? 'Aktenschrank' : 'Unterste Schublade', () => cleo_akte());
    if (typeof hintAdd === 'function') hintAdd({ id: 'cleo_akte', x: X + 22, y: 0, z: Z - 5.3, kind: 'story', near: 20, open: () => !cleo_has('cleo_akte') }); }
  // --- Kapitel 3: das Baumhaus (Plattform aus dem Modul wald) – Strickleiter, Kiste
  const P = WALD.tree, y = wald_S.treeY || 2.2;
  { const up = box(.8, 1.6, .5, P.x, .9, P.z - 1.55, hidden, { cast: false }); interact(up, 'Strickleiter hinaufklettern', () => cleo_climb(true));
    const down = box(.8, .6, .4, P.x, y + .4, P.z - 1.05, hidden, { cast: false }); interact(down, 'Hinunterklettern', () => cleo_climb(false)); S.baumHits.push(up, down); }
  { const wood = msSurfMat('planks_painted', { tint: 0x6a4a34 }), cx = P.x + .55, cz = P.z + .15; S.baum.push(box(.7, .36, .44, cx, y + .18, cz, wood, { collide: false }));
    const piv = new T.Group(); piv.position.set(cx, y + .36, cz + .22); scene.add(piv); const lid = box(.72, .06, .46, 0, .03, -.22, wood, { parent: piv }); S.lid = piv;
    const lock = box(.07, .08, .02, cx, y + .3, cz - .23, new T.MeshStandardMaterial({ color: 0xa08040, metalness: .8, roughness: .35 }), { collide: false }); S.lock = lock;
    const hit = box(.8, .5, .55, cx, y + .25, cz, hidden, { cast: false }); interact(hit, () => cleo_has('cleo_baumhaus') ? 'Cleos Kiste' : 'Kiste mit Vorhängeschloss', () => cleo_chest(lock)); S.baum.push(piv); S.baumHits.push(hit); }
  // AP-24: nasse Abdrücke auf den Brettern – drei Finger, Kinderhöhe, noch nicht getrocknet (Stufe 1)
  { const m = new T.Mesh(new T.PlaneGeometry(.26, .2), new T.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: .15, metalness: 0, polygonOffset: true, polygonOffsetFactor: -4, map: tex(cnv(128, (c, w) => { c.clearRect(0, 0, w, w);
      for (const [x, y] of [[34, 50], [60, 38], [86, 48]]) { const g = c.createRadialGradient(x, y, 0, x, y, 16); g.addColorStop(0, 'rgba(18,14,10,.75)'); g.addColorStop(1, 'rgba(18,14,10,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y + 18, 11, 30, 0, 0, 7); c.fill(); } }), true) }));
    m.rotation.set(-PI / 2, 0, .7); m.position.set(P.x - .5, y + .005, P.z - .35); scene.add(m); S.baum.push(m); }
  // AP-24: das Ende am Steinkreis – der achte Stein liegt umgefallen im Moos (tiefwald.js: TIEF.ring.acht)
  if (typeof TIEF !== 'undefined' && TIEF.ring.acht) { const A = TIEF.ring.acht, cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; S.kreisCv = cv;
    const mt = new T.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, map: new T.CanvasTexture(cv) }); mt.map.colorSpace = T.SRGBColorSpace;
    S.kreisName = new T.Mesh(new T.PlaneGeometry(.62, .31), mt); S.kreisName.rotation.set(-PI / 2, 0, A.ry || 0); S.kreisName.position.set(A.x, .5, A.z); S.kreisName.visible = false; scene.add(S.kreisName);
    const hit = box(1.1, .7, 1.1, A.x, .35, A.z, hidden, { cast: false }); interact(hit, () => cleo_has('cleo_kreis') ? 'CLEO' : story.items.includes('cleo_kreide') ? 'Ihren Namen auf den liegenden Stein schreiben (E halten)' : 'Der achte Stein liegt im Moos', () => cleo_kreis()); S.baumHits.push(hit);
    if (typeof hintAdd === 'function') hintAdd({ id: 'cleo_kreis', x: A.x, y: 0, z: A.z, kind: 'story', near: 30, open: () => kapAb(6) && story.items.includes('cleo_kreide') && !cleo_has('cleo_kreis') }); }
  if (typeof hintAdd === 'function') { hintAdd({ id: 'cleo_stein', x: CLEO_STONE.x, y: 0, z: CLEO_STONE.z, kind: 'story', near: 30, open: () => !cleo_has('cleo_gedenk') || (story.items.includes('cleo_kreide') && !cleo_has('cleo_ende')) });
    hintAdd({ id: 'cleo_baumhaus', x: P.x, y: 0, z: P.z, kind: 'story', near: 45, open: () => kapAb(6) && story.items.includes('baumhausschluessel') && !cleo_has('cleo_baumhaus') }); }
  cleo_sperre(); S.ready = true;
}]);
function cleo_stone() {
  const S = cleo_S;
  if (cleo_has('cleo_ende')) return toast('CLEO. In Kreide, ein bisschen schief. Der Regen wäscht es nicht ab.', 3200);
  if (story.items.includes('cleo_kreide')) return cleo_end();
  if (!cleo_has('cleo_gedenk')) story.lore.push({ key: 'cleo_gedenk', title: 'Der achte Stein', html: 'Links neben Zayns Grab ein achter Stein, kleiner als die anderen. Der Name ist weggekratzt, bis der Stein weiß war. Nur am Rand, wo der Meißel abgerutscht ist: ein C.\n\nDas Datum ist stehen geblieben. † 28. Juli 2009. Derselbe Tag wie bei den anderen.' });
  cleo_start('Ein achter Stein am Gedenkfeld, der Name weggekratzt. Nur ein C ist geblieben. Lucy hat jeden Tag ein C. in ihr Tagebuch geschrieben.');
  openNote('Der achte Stein', 'Links neben Zayns Grab steht ein achter Stein, kleiner als die anderen. Der Name ist weggekratzt – so gründlich, dass der Stein darunter weiß geworden ist.\n\nNur am Rand, wo der Meißel abgerutscht ist: ein <b>C</b>.\n\nDas Datum ist stehen geblieben: † 28. Juli 2009. Derselbe Tag.');
  if (typeof gedanke === 'function') gedanke('cleo_stein', 'C. Wie in Lucys Tagebuch. Jemand hat sie nicht vergessen. Jemand hat sie ausgekratzt.', 1000, 3);
}
function cleo_akte() {
  if (cleo_has('cleo_akte')) return toast('Die Schublade ist leer bis auf einen Abdruck im Staub. Dort lag eine Akte, siebzehn Jahre lang.', 3400);
  Audio.play('metalOpen', { gain: .4, rate: 1.1, x: C2.x + 22, y: .32, z: C2.z - 5.3 });
  story.lore.push({ key: 'cleo_akte', title: 'Die Akte ohne Nummer', html: 'Keine Nummer, kein Name. Das Deckblatt ist geschwärzt, bis auf einen Stempel: FREIWILLIG.\n\nInnen ein einziger Satz, Kinderschrift, Bleistift:\n<span class="hand">„Eine für sieben. Dann dürfen alle heim.“</span>\n\nDarunter, Schreibmaschine: „Vorgang geschlossen. Nicht erinnern.“' });
  cleo_start('Im Amt lag eine Akte ohne Nummer: FREIWILLIG. „Eine für sieben. Dann dürfen alle heim.“');
  openNote('Die Akte ohne Nummer', 'Die unterste Schublade klemmt. Darin eine einzelne Akte. Keine Nummer, kein Name – das Deckblatt ist geschwärzt, bis auf einen Stempel:\n\n<b>FREIWILLIG</b>\n\nInnen ein einziger Satz, Kinderschrift, Bleistift:\n<span class="hand">„Eine für sieben. Dann dürfen alle heim.“</span>\n\nDarunter, Schreibmaschine: „Vorgang geschlossen. Nicht erinnern.“');
  if (typeof gedanke === 'function') gedanke('cleo_akte', 'Eine für sieben. Irgendwer hat sich selbst geschickt – für uns.', 1000, 3); // Fassung 3: alte Justin-Zeile abgeschafft
}
function cleo_climb(up) {
  const S = cleo_S, P = WALD.tree, y = wald_S.treeY || 2.2; if (S.climbing || (up && player.pos.y > 1) || (!up && player.pos.y < 1)) return; S.climbing = true; state.talking = true; let t = 0;
  const from = player.pos.clone(), mid = new THREE.Vector3(P.x, up ? 0 : y, P.z - 1.75), to = up ? new THREE.Vector3(P.x, y, P.z - .5) : new THREE.Vector3(P.x, 0, P.z - 2.3);
  Audio.play('woodSqueak1', { gain: .3, rate: .9 });
  setScripted(dt => { t += dt; const p = player.pos;
    if (t < .4) p.lerpVectors(from, mid, t / .4);
    else if (t < 2.2) { const k = (t - .4) / 1.8; p.set(P.x, up ? y * k : y * (1 - k), P.z - 1.75); if (Math.floor(t * 3) !== Math.floor((t - dt) * 3)) Audio.play('woodSqueak1', { gain: .12, rate: rand(.9, 1.2) }); }
    else if (t < 2.7) p.lerpVectors(new THREE.Vector3(P.x, up ? y : 0, P.z - 1.75), to, (t - 2.2) / .5);
    else { p.copy(to); S.climbing = false; S.up = up; state.talking = false;
      if (up && kapAb(6) && !S.klappe) { S.klappe = true; setTimeout(() => subtitle('Das war größer. Oder ich war kleiner. Eins von beiden ist gelogen.', 3600, 'LUKE'), 300); } // AP-24: durch die Klappe gequetscht
      return false; } });
}
function cleo_chest(lock) {
  const S = cleo_S;
  if (cleo_has('cleo_baumhaus')) { if (kapAb(6) && !story.items.includes('cleo_dose')) addItem('cleo_dose'); return openNote('Cleos Brief', cleo_letter()); }
  if (!story.items.includes('baumhausschluessel')) { cleo_start(); return toast('Eine Holzkiste mit einem kleinen Vorhängeschloss aus Messing. In den Deckel geritzt: C. Der Schlüssel fehlt.', 4000); }
  lock.visible = false; tween(S.lid, { rx: -1.9 }, .8); Audio.creak(.3, S.lid.position.x, S.lid.position.y, S.lid.position.z);story.items = story.items.filter(k => k !== 'baumhausschluessel'); addItem('cleo_kreide'); if (kapAb(6)) addItem('cleo_dose'); // AP-24: die Keksdose (Samen Kap. 7)
  story.lore.push({ key: 'cleo_baumhaus', title: 'Cleos Kiste', html: 'Eine Zeichnung: acht Kinder an einer Kreuzung, Hand in Hand. In der Mitte ein Mädchen mit roten Zöpfen: CLEO. Neben ihr, kleiner geschrieben: LUCY.\n\nEin Brief an Lucy. Ein Stück weiße Kreide. Und eine Keksdose mit acht Kronkorken: R, H, M, D, L, L, Z – und einer ohne Buchstaben.\n\n' + cleo_letter() });
  cleo_start('Cleos Baumhaus. Ein Brief an Lucy – „Eine für sieben.“ Acht Kronkorken, einer ohne Buchstaben. Ihr Name steht auf keinem Stein. Jonas’ Karte kennt einen Kreis aus Steinen, tief im Wald.');
  openNote('Cleos Kiste', 'Obenauf eine Zeichnung: acht Kinder an einer Kreuzung, Hand in Hand. In der Mitte ein Mädchen mit roten Zöpfen, darüber in großen Buchstaben: <b>CLEO</b>. Daneben, kleiner: LUCY.\n\nDarunter ein Brief. Ein Stück weiße Kreide, mit Klebeband umwickelt. Und eine Keksdose. Darin acht Kronkorken. Sieben tragen Filzstift-Buchstaben: <b>R · H · M · D · L · L · Z</b>. Der achte ist leer.\n\n' + cleo_letter(), null, () => {
    if (kapAb(6)) subtitle('<i>Du zählst die Kronkorken mit dem Finger nach. Acht. Einer ohne Buchstaben.</i>', 3600);
    if (typeof gedanke === 'function') gedanke('cleo_regel', 'Eine für sieben. Mira ist für die eine noch mal rein. Cleo ist für alle sieben rein. Und keiner weiß ihren Namen.', 2400, 3); }); // Bibel N6-3 (ersetzt die alte Zeile)
}
function cleo_letter() { return '<span class="hand">Liebe Lucy,\nich hab gehört, wie die Männer vom Amt gesagt haben: sieben. Ich hab gefragt, ob auch eine reicht. Eine für sieben. Dann dürfen alle heim.\nWenn ihr mich vergesst, ist das nicht schlimm. Dann hat es geklappt.\nGeschenkt ist geschenkt.\n– Cleo, 8</span>'; }
applySave = (o => d => { o(d); const S = cleo_S; if (cleo_has('cleo_ende') && S.name) S.name.visible = true;
  if (cleo_has('cleo_baumhaus') && S.lid) { S.lid.rotation.x = -1.9; if (S.lock) S.lock.visible = false; }
  if (S.kreisName) { S.kreisName.visible = cleo_has('cleo_kreis'); if (S.kreisName.visible) { const A = TIEF.ring.acht, g = solidGround(A.x, 1.5, A.z); S.kreisName.position.y = (g > -1 ? g : .45) + .012; cleo_kreisMalen(4); } } cleo_sperre(); })(applySave);
// Kapitel-Sperre (PK-A A12): das Baumhaus steht in den Dustwoods → Kiste und Strickleiter erst ab Kapitel 6; vorher unsichtbar und nicht anklickbar
function cleo_sperre() {
  const S = cleo_S, on = kapAb(6); for (const m of S.baum) m.visible = on; if (S.kreisName) S.kreisName.visible = on && cleo_has('cleo_kreis'); if (S.lock) S.lock.visible = on && !cleo_has('cleo_baumhaus');
  for (const h of S.baumHits) { const i = interactables.indexOf(h); if (on && i < 0) interactables.push(h); else if (!on && i >= 0) interactables.splice(i, 1); }
}
for (let n = 1; n <= 6; n++) KAP_BEGIN[n].push(() => cleo_sperre());
async function cleo_end() {
  const S = cleo_S; if (S.ending) return; S.ending = true; state.talking = true; Audio.play('stones1', { gain: .25, rate: 1.6, x: CLEO_STONE.x, y: .4, z: CLEO_STONE.z, ref: 2 });
  try { // state.talking wird immer zurückgesetzt
  await say([['Du schreibst ihren Namen. C – L – E – O. Die Kreide kratzt über den Stein. Er nimmt sie an.', 4800]]); S.name.visible = true; // AP-24: die Kreide bleibt (Steinkreis: „Dann stehl ich sie eben zweimal.“)
  const F = echoFigs[0]; F.position.set(CLEO_STONE.x + .7, 0, CLEO_STONE.z - .9); F.rotation.y = -.9; F.scale.setScalar(.52); F.visible = true;
  if (typeof figuren_person === 'function') { await figuren_person(F, 'cleo'); figuren_memoryLook(true); }
  for (let k = 0; k <= 20; k++) { echoMat.opacity = k / 20 * .34; await wait(45); }
  await say([['Neben dem Stein steht ein Mädchen. Acht, vielleicht. Rote Zöpfe. Sie liest ihren Namen. Dann sieht sie dich an – und lächelt.', 5800], ['„Wiederholen ist gestohlen“, sagt sie. „Du hast mich zurückgestohlen.“', 4600, 'CLEO']]);
  for (let k = 20; k >= 0; k--) { echoMat.opacity = k / 20 * .34; await wait(60); } F.visible = false;
  } finally { state.talking = false; } if (typeof figuren_memoryLook === 'function') figuren_memoryLook(false);
  story.lore.push({ key: 'cleo_ende', title: 'Cleo', html: 'Cleo, 8. Sie ist 2009 freiwillig ins Licht gegangen, damit die anderen heimkommen: eine für sieben. Danach hat sie niemand mehr gekannt – außer Lucy.\n\nJetzt steht ihr Name auf dem achten Stein. In Kreide. Wiederholen ist gestohlen: Du hast sie zurückgestohlen.' });
  sideDone('cleo', 'Ihr Name steht auf dem Stein: CLEO.'); questPop('ERINNERUNG', 'Cleo');
  setTimeout(() => { if (typeof gedanke === 'function') gedanke('cleo_nach', 'Lucy hat sie nie vergessen. Siebzehn Jahre lang, jeden Tag ein C. … Jetzt vergesse ich sie auch nicht mehr.', 0, 3); }, 8000);
}
// AP-24 · N6-3 Ende am Steinkreis: CLEO auf den liegenden achten Stein, E halten, Buchstabe für Buchstabe
function cleo_kreisMalen(n) { const cv = cleo_S.kreisCv, c = cv.getContext('2d'); c.clearRect(0, 0, 256, 128); c.save(); c.translate(128, 84); c.rotate(-.04); c.fillStyle = 'rgba(248,248,242,.93)'; c.font = 'bold 64px "Comic Sans MS", cursive'; c.textAlign = 'center';
  c.fillText('CLEO'.slice(0, n).padEnd(4, ' '), 0, 0); c.restore(); cleo_S.kreisName.material.map.needsUpdate = true; }
async function cleo_kreis() {
  const S = cleo_S, A = TIEF.ring.acht; if (S.kreisBusy) return;
  if (cleo_has('cleo_kreis')) return toast('CLEO. In Kreide, auf dem Stein, der als einziger liegt. Der Wald hat ihn nicht gefressen.', 3600);
  if (!story.items.includes('cleo_kreide')) return toast('Sieben Steine stehen im Kreis. Der achte liegt umgefallen im Moos, als hätte ihn keiner aufheben wollen.', 4200);
  S.kreisBusy = true; state.talking = true; const g = solidGround(A.x, 1.5, A.z); S.kreisName.position.y = (g > -1 ? g : .45) + .012; S.kreisName.visible = true; cleo_kreisMalen(0);
  try { toast('E halten: Buchstabe für Buchstabe.', 2600); let n = 0, h = 0, t0 = performance.now();
    while (n < 4) { await wait(50); if (keys.KeyE || performance.now() - t0 > 25000) { h += .05; if (Math.floor(h * 6) !== Math.floor((h - .05) * 6)) Audio.play('stones1', { gain: .16, rate: 2.4, x: A.x, y: .4, z: A.z, ref: 2 }); if (h >= .9) { h = 0; n++; cleo_kreisMalen(n); } } }
  } finally { state.talking = false; S.kreisBusy = false; }
  const zweimal = cleo_has('cleo_ende');
  story.lore.push({ key: 'cleo_kreis', title: 'Cleo', html: 'Cleo, 8. Sie ist 2009 freiwillig ins Licht gegangen, damit die anderen heimkommen: eine für sieben. Danach hat sie niemand mehr gekannt – außer Lucy.\n\nIm tiefen Wald stehen sieben Steine im Kreis. Der achte lag im Moos. Jetzt steht ihr Name darauf, in Kreide: CLEO.\n\nBilder frisst er. Buchstaben nicht.' });
  sideDone('cleo', 'Ihr Name steht auf dem achten Stein im Kreis: CLEO.'); questPop('ERINNERUNG', 'Cleo');
  if (typeof gedanke === 'function') gedanke('cleo_kreis', 'Bilder frisst er. Buchstaben nicht.', 900, 3);
  if (zweimal) setTimeout(() => { if (!state.talking) subtitle('Wiederholen ist gestohlen. Dann stehl ich sie eben zweimal.', 3600, 'LUKE'); }, 5200);
}
WORLD_TICK.push(() => { const S = cleo_S; if (!S.ready) return; const k = kap(); if (k !== S.k) { S.k = k; cleo_sperre(); } if (!state.started) return;
  if (state.diary && story.side.cleo.state === 'hidden') cleo_start('In Lucys Tagebuch steht immer wieder ein einzelner Buchstabe: C. Zu C.s Geburtstag kam 2009 niemand außer Lucy.'); });
window.__cleo = { S: cleo_S, stone: () => cleo_stone(), akte: () => cleo_akte(), climb: u => cleo_climb(u), end: () => cleo_end() }; // Testzugriff
