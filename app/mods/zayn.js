// =====================================================================  ZAYN (Modul „zayn“): Nebenquest „Versprochen ist versprochen“
// Zayn Wendt, 7 (2009) – Hildes Jüngster, der kleine Bruder von Jonas, Lukes bestem Freund. Er kam 2009 als Einziger nie zurück.
// 1) Nr. 7, ab Kapitel 3 verlassen: ein kleiner Rucksack, Anhänger „ZAYN“.  2) Darin eine Kinderkamera: sechs Fotos vom alten Spielplatz,
// auf jedem fehlt ein Detail, auf jedem steht Zayn einen Schritt näher am Wald → Reihenfolge finden. Letztes Bild: nur der Waldrand, „Er wollte, dass ich ihm folge.“
// 3) Spur durch die Forbidden Dustwoods: Murmel, Schuh (der Fuchs trägt ihn), Kreide, Süßigkeitenverpackung – Dinge aus Lukes eigener Kindheit.
// 4) Die Hütte: Kinderzeichnungen („Versprochen ist versprochen.“), die Erinnerung an das Versprechen, das alte Radio mit Zayns Stimme.
// 5) Auf dem Boden die letzte Zeichnung – Zayn hat sich selbst herausgemalt. Keine Antwortmöglichkeit. Die Quest endet einfach.
// Die Fotos sind echte Aufnahmen der Spielwelt (einmalig gerendert, mit dem Taschenlampenlicht als Kamerablitz).
const zayn_S = { ready: false, stage: 0, photos: null, bag: null, bagHit: null, spots: [], found: new Set(), shoeHit: null, drawing: null, floor: null, radio: null, hutIn: false };
const ZAYN_SPUR = [
  ['murmel', 'Eine Murmel', 'Eine Glasmurmel mit rotem Wirbel. Deine Lieblingsmurmel. Du hast sie mit acht an Jonas verloren – hinter der Kapelle, beim Spiel „Wer trifft die Wand“.\n\nWie kommt sie hierher?'],
  ['schuh', 'Ein Kinderschuh', 'Ein blauer Kinderschuh, Größe 26, rot-weiße Schnürsenkel. Genau solche hattest du. Mama hat sie gekauft, weil du keine anderen wolltest.\n\nZayn wollte dann auch welche. Natürlich.'],
  ['kreide', 'Ein Stück Kreide', 'Gelbe Straßenkreide, halb abgebrochen. Daneben, auf dem Waldboden, ein Hüpfkästchen – wie das, das ihr jeden Sommer vor Nr. 7 gemalt habt.\n\nZayn durfte immer nur die Acht malen. Die war am weitesten weg.'],
  ['brause', 'Eine Süßigkeitenverpackung', 'Brausestäbchen, Waldmeister. Die gab es an der Tankstelle Kranz, fünf Stück für eine Mark – später für fünfzig Cent.\n\nJonas hat Zayn immer die Hälfte abgegeben. Du nie.']];
const zayn_has = k => story.lore.some(l => l.key === k);
function zayn_stage(n, desc) { const S = zayn_S; if (n > S.stage) S.stage = n; sideStart('zayn'); if (desc) story.side.zayn.desc = desc; }
WORLD_MODS.push(['Zayn', async () => {
  const S = zayn_S, T = THREE;
  story.side.zayn = { title: 'Versprochen ist versprochen', desc: 'Ein kleiner Rucksack mit einem Namen.', state: 'hidden' };
  modItem('zayn_kamera', 'Zayns Kinderkamera', 'Eine kleine Kamera aus buntem Plastik. Sechs Fotos, alle vom alten Spielplatz.', 'paper');
  // --- Rucksack (Mesh jetzt, Platz im Haus erst nach dem Kollisionsaufbau)
  { const g = new T.Group(), fab = new T.MeshStandardMaterial({ color: 0x2c4a7a, roughness: .92 }), strap = new T.MeshStandardMaterial({ color: 0x1a1a1e, roughness: .8 });
    const body = new T.Mesh(new T.BoxGeometry(.26, .32, .14), fab); body.position.y = .16; g.add(body);
    const top = new T.Mesh(new T.CylinderGeometry(.13, .13, .26, 14, 1, false, 0, PI), fab); top.rotation.set(0, 0, PI / 2); top.scale.set(1, 1, .55); top.position.y = .32; g.add(top);
    const pocket = new T.Mesh(new T.BoxGeometry(.2, .12, .05), fab); pocket.position.set(0, .1, .09); g.add(pocket);
    for (const s of [-1, 1]) { const st = new T.Mesh(new T.BoxGeometry(.03, .28, .012), strap); st.position.set(s * .07, .18, -.075); g.add(st); }
    const tag = new T.Mesh(new T.PlaneGeometry(.06, .04), new T.MeshStandardMaterial({ roughness: .8, map: tex(cnv(128, (c, w) => { c.fillStyle = '#e8e0c8'; c.fillRect(0, 0, w, w); c.fillStyle = '#1a2a6a'; c.font = 'bold 34px Arial'; c.textAlign = 'center'; c.fillText('ZAYN', w / 2, 76); }), true) }));
    tag.position.set(.1, .26, .076); tag.rotation.z = -.2; g.add(tag); g.rotation.x = -.18; g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.userData.noCol = true; g.visible = false; scene.add(g); S.bag = g; }
  // --- Spur im Wald
  const glass = new T.MeshStandardMaterial({ color: 0xd8e8f0, roughness: .05, metalness: .1, transparent: true, opacity: .85, emissive: 0x304050, emissiveIntensity: .4 });
  const spot = (k, x, y, z, mesh, w = .45) => { if (mesh) { mesh.position.set(x, y, z); scene.add(mesh); } const hit = box(w, .35, w, x, y + .1, z, hidden, { cast: false }); S.spots.push({ k, x, z, mesh, hit });
    interact(hit, () => zayn_has('zayn_spur_' + k) ? '' : ZAYN_SPUR.find(s => s[0] === k)[1], () => zayn_take(k));
    if (typeof hintAdd === 'function') hintAdd({ id: 'zayn_' + k, x, y: 0, z, kind: 'story', near: 22, open: () => zayn_S.stage >= 2 && !zayn_has('zayn_spur_' + k) }); };
  { const m = new T.Group(), b = new T.Mesh(new T.SphereGeometry(.014, 14, 10), glass), sw = new T.Mesh(new T.TorusGeometry(.009, .003, 6, 14), new T.MeshStandardMaterial({ color: 0xc02020, emissive: 0x400000 })); m.add(b, sw); spot('murmel', 30.6, .015, 107.2, m); }
  { const c = new T.Mesh(new T.CylinderGeometry(.009, .009, .07, 8), new T.MeshStandardMaterial({ color: 0xe8d060, roughness: 1 })); c.rotation.set(PI / 2, 0, .6); spot('kreide', 17.6, .012, 122.9, c);
    const hop = new T.Mesh(new T.PlaneGeometry(1.1, 2.6), new T.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, map: tex(cnv(256, (x, w) => { x.clearRect(0, 0, w, w); x.strokeStyle = 'rgba(230,220,160,.55)'; x.lineWidth = 5;
      const cells = [[0, 0], [0, 1], [-1, 2], [1, 2], [0, 3], [-1, 4], [1, 4], [0, 5]]; cells.forEach(([cx, cy], i) => { const px = 128 + cx * 38 - 19, py = 236 - cy * 40 - 36; x.strokeRect(px, py, 38, 38); x.fillStyle = i === 7 ? 'rgba(250,240,170,.9)' : 'rgba(230,220,160,.5)'; x.font = 'bold 26px Arial'; x.fillText(String(i + 1), px + 12, py + 28); }); }), true) }));
    hop.rotation.set(-PI / 2, 0, .3); hop.position.set(19, .016, 122); scene.add(hop); }
  { const wr = new T.Mesh(new T.PlaneGeometry(.12, .045), new T.MeshStandardMaterial({ side: T.DoubleSide, roughness: .4, metalness: .3, map: tex(cnv(128, (c, w) => { c.fillStyle = '#2e8a3a'; c.fillRect(0, 0, w, w); c.fillStyle = '#f4f0a0'; c.font = 'bold 22px Arial'; c.textAlign = 'center'; c.fillText('BRAUSE', w / 2, 44); c.font = '15px Arial'; c.fillText('Waldmeister', w / 2, 70); }), true) }));
    wr.rotation.set(-.6, .8, .3); spot('brause', 35.3, .42, 135.4, wr); }
  // --- Hütte: Zeichnungen, Radio, Decke, Kerze
  const H = WALD.hut, draw = (fn, w, h, x, y, z, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ roughness: .95, map: tex(cnv(512, fn), true) })); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m; };
  const kid = (x, c, px, py, s, col) => { x.strokeStyle = col; x.lineWidth = 7 * s; x.lineCap = 'round'; x.beginPath(); x.arc(px, py, 26 * s, 0, 7); x.stroke(); x.beginPath(); x.moveTo(px, py + 26 * s); x.lineTo(px, py + 110 * s); x.moveTo(px - 40 * s, py + 60 * s); x.lineTo(px + 40 * s, py + 60 * s); x.moveTo(px, py + 110 * s); x.lineTo(px - 28 * s, py + 170 * s); x.moveTo(px, py + 110 * s); x.lineTo(px + 28 * s, py + 170 * s); x.stroke(); };
  const paper = x => { x.fillStyle = '#ece4cc'; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(90,70,40,${rand(.02, .06)})`; x.fillRect(rand(0, 512), rand(0, 512), rand(20, 90), rand(2, 8)); } };
  S.drawing = draw(x => { paper(x); kid(x, 0, 150, 150, 1, '#2a4ac0'); kid(x, 0, 290, 150, 1, '#c03a2a'); kid(x, 0, 400, 205, .7, '#2a9a3a');
    x.fillStyle = '#333'; x.font = '28px "Comic Sans MS", cursive'; x.fillText('LUKE', 110, 380); x.fillText('JONAS', 245, 380); x.fillText('ICH', 375, 380); x.fillStyle = '#a02020'; x.font = 'bold 34px "Comic Sans MS", cursive'; x.fillText('Versprochen ist versprochen.', 40, 460); }, .62, .62, H.x - .3, 1.45, H.z + 1.84, PI);
  draw(x => { paper(x); x.strokeStyle = '#5a3a1a'; x.lineWidth = 12; for (let i = 0; i < 7; i++) { x.beginPath(); x.moveTo(40 + i * 70, 470); x.lineTo(60 + i * 70, 120); x.stroke(); } x.fillStyle = '#e8c020'; x.beginPath(); x.arc(256, 70, 40, 0, 7); x.fill(); kid(x, 0, 256, 260, .6, '#2a9a3a'); }, .5, .5, H.x - 1.64, 1.5, H.z - .4, PI / 2);
  draw(x => { paper(x); x.strokeStyle = '#444'; x.lineWidth = 8; x.strokeRect(80, 260, 90, 200); x.beginPath(); x.moveTo(250, 460); x.lineTo(330, 280); x.lineTo(410, 460); x.stroke(); kid(x, 0, 330, 120, .55, '#2a9a3a'); x.fillStyle = '#333'; x.font = '30px "Comic Sans MS", cursive'; x.fillText('ich warte hier', 150, 60); }, .45, .45, H.x - 1.64, 1.45, H.z + .6, PI / 2);
  { const hit = box(.7, .7, .15, H.x - .3, 1.45, H.z + 1.8, hidden, { cast: false }); interact(hit, 'Kinderzeichnung', () => zayn_drawing()); }
  box(1.4, .12, .75, H.x + .7, .06, H.z + 1.4, new T.MeshStandardMaterial({ color: 0x4a3a30, roughness: 1 }), { collide: false }); // Decke auf dem Boden
  box(.5, .45, .4, H.x + 1.1, .225, H.z - 1.3, M.wood, { collide: true }); // Kiste
  try { const r = await msModel('radio'); const o = msGround(msFit(r.clone(true), .38, 'max')); o.position.set(H.x + 1.1, .45, H.z - 1.3); o.rotation.y = -PI / 2 - .3; scene.add(o); S.radio = o; } catch (e) { console.warn('Zayn: Radio', e); }
  { const hit = box(.5, .4, .45, H.x + 1.1, .65, H.z - 1.3, hidden, { cast: false }); interact(hit, () => zayn_has('zayn_radio') ? 'Altes Radio' : 'Altes Radio einschalten', () => zayn_radio()); }
  // Die letzte Zeichnung (erscheint nach dem Radio)
  S.floor = draw(x => { paper(x); kid(x, 0, 150, 150, 1, '#2a4ac0'); kid(x, 0, 290, 150, 1, '#c03a2a'); x.fillStyle = 'rgba(236,228,204,.95)'; x.fillRect(340, 120, 130, 260);
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(120,110,90,${rand(.04, .12)})`; x.fillRect(rand(345, 460), rand(130, 370), rand(10, 40), rand(2, 6)); } x.fillStyle = '#333'; x.font = '28px "Comic Sans MS", cursive'; x.fillText('LUKE', 110, 380); x.fillText('JONAS', 245, 380); }, .48, .48, H.x - .2, .012, H.z - .3, 0);
  S.floor.rotation.set(-PI / 2, 0, .4); S.floor.visible = false;
  { const hit = box(.6, .12, .6, H.x - .2, .05, H.z - .3, hidden, { cast: false }); S.floorHit = hit; interact(hit, 'Zeichnung auf dem Boden', () => zayn_last()); uninteract(hit); }
  if (typeof hintAdd === 'function') { hintAdd({ id: 'zayn_rucksack', x: 24.8, y: Y, z: -13.2, kind: 'story', near: 30, open: () => (ch3.on || (typeof anwesen_S !== 'undefined' && anwesen_S.ch4)) && zayn_S.stage < 1 });
    hintAdd({ id: 'zayn_huette', x: H.x, y: 0, z: H.z, kind: 'story', near: 60, open: () => zayn_S.stage >= 2 && !zayn_has('zayn_ende') }); }
  S.ready = true;
}]);
// ---- 1) Rucksack (bleibt liegen: bis das Rätsel gelöst ist, öffnet er die Kamera erneut)
const zayn_bagLabel = () => zayn_S.stage < 1 ? 'Kleiner Rucksack' : zayn_S.stage < 2 ? 'Zayns Kamera ansehen' : 'Zayns Rucksack';
function zayn_placeBag() { // freie Stelle auf dem Boden im Wohnzimmer von Nr. 7, nahe Zayns Blechroboter
  const S = zayn_S; for (let r = 0; r < 2.4; r += .25) for (let a = 0; a < 6.28; a += .5) { const x = 24.8 + Math.cos(a) * r, z = -13.3 + Math.sin(a) * r * .7;
    if (x < 21 || x > 31 || z > -12.6 || z < -21.5) continue; if (!leben_free(x, z, Y + .25, .3) || !leben_free(x, z, Y + .9, .3)) continue;
    S.bag.position.set(x, Y, z); S.bag.rotation.y = rand(-.6, .6); S.bagHit = box(.45, .5, .4, x, Y + .22, z, hidden, { cast: false }); interact(S.bagHit, zayn_bagLabel, () => zayn_bag()); uninteract(S.bagHit); return true; }
  return false; }
function zayn_bag() {
  const S = zayn_S; if (S.stage >= 1) return S.stage < 2 ? zayn_camera() : toast('Zayns Rucksack. Leer bis auf ein Kaugummipapier und einen Zettel mit einer 8 darauf.', 3200); addItem('zayn_kamera');
  story.lore.push({ key: 'zayn_rucksack', title: 'Ein kleiner Rucksack', html: 'Blau, ausgeblichen. Auf dem Anhänger: ZAYN.\n\nZayn Wendt. Jonas’ kleiner Bruder. Er war immer dabei, obwohl er viel zu klein war, um bei euch mitzuspielen. Du hast ihn seit Jahren nicht gesehen.\n\nIm Rucksack: eine Kinderkamera.' });
  zayn_stage(1, 'Zayns Rucksack lag in Nr. 7. Darin eine Kinderkamera mit sechs Fotos vom alten Spielplatz. (Inventar)');
  openNote('Ein kleiner Rucksack', 'Blau, ausgeblichen, mit einem Anhänger. Darauf, in Druckbuchstaben: <b>ZAYN</b>.\n\nDu erkennst den Namen sofort. Zayn – der kleine Bruder von Jonas, deinem besten Freund damals. Er war immer dabei, obwohl er viel zu klein war, um bei euch mitzuspielen.\n\nDu hast ihn seit Jahren nicht gesehen.\n\nIm Rucksack: eine alte Kinderkamera.', null, () => setTimeout(() => zayn_camera(), 250));
}
// ---- 2) Kamera: sechs echte Aufnahmen vom Spielplatz
function zayn_hideAt(x, z, r, onlyInst) { // alles in Reichweite kurz ausblenden; gibt eine Rücknahme zurück
  const undo = [], m4 = new THREE.Matrix4(), v = new THREE.Vector3(), bb = new THREE.Box3(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
  scene.traverse(o => { if (!o.isMesh || o.isSkinnedMesh || !o.visible) return;
    if (o.isInstancedMesh) { for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); v.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld); if (Math.hypot(v.x - x, v.z - z) < r) { const keep = m4.clone(); o.setMatrixAt(i, zero); o.instanceMatrix.needsUpdate = true;
          undo.push(() => { o.setMatrixAt(i, keep); o.instanceMatrix.needsUpdate = true; const C = typeof PERF_CULL !== 'undefined' && PERF_CULL.list.find(c => c.o === o); if (C) C.ver = o.instanceMatrix.version + 1; }); } } return; }
    if (onlyInst) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); const s = bb.getSize(v);
    if (s.x > 6 || s.z > 6 || s.y > 6) return; bb.getCenter(v); if (Math.hypot(v.x - x, v.z - z) < r) { o.visible = false; undo.push(() => { o.visible = true; }); } });
  return () => undo.forEach(f => f()); }
function zayn_takePhotos() {
  const T = THREE, W = 400, Hh = 300, rt = new T.WebGLRenderTarget(W, Hh), pc = new T.PerspectiveCamera(58, W / Hh, .1, 160), buf = new Uint8Array(W * Hh * 4);
  const c0 = camera.position.clone(), q0 = camera.quaternion.clone(), fr0 = { p: flashRig.position.clone(), q: flashRig.quaternion.clone(), i: flashlight.intensity }, F = echoFigs[0], op0 = echoMat.opacity;
  const shots = [[70.5, [40.6, 78.8, 1.9], 'Schaukel'], [76, [35.9, 69.2, .6], 'Ball'], [81.5, [21.4, 67.2, 1.3], 'Bank'], [87, [30, 86.5, 1.4], 'Baum'], [92, [34, 71.2, 1.6], 'Karussell'], [null, null, 'Waldrand']];
  const out = [];
  try {
    for (const [zz, hide, what] of shots) {
      if (zz) { pc.position.set(31.2, 1.3, 60.5); pc.lookAt(31, 1.1, 92); } else { pc.position.set(30.8, 1.35, 88.5); pc.lookAt(30.2, 1.25, 104); } pc.updateMatrixWorld(true);
      camera.position.copy(pc.position); camera.quaternion.copy(pc.quaternion); camera.updateMatrixWorld(true);
      try { gruen_refreshAll(true); } catch (e) {} if (typeof PERF_CULL !== 'undefined') { PERF_CULL.t = 0; perfCullTick(0); } try { assignLampPool(); } catch (e) {}
      flashRig.position.copy(pc.position); flashRig.quaternion.copy(pc.quaternion); flashRig.updateMatrixWorld(true); flashlight.intensity = Math.max(fr0.i, 1) * 3.2;
      const undo = hide ? zayn_hideAt(hide[0], hide[1], hide[2], what === 'Baum' || what === 'Bank') : () => {};
      if (zz && F) { F.position.set(30.6 + (zz - 80) * .03, 0, zz); F.rotation.y = 0; F.scale.setScalar(.5); F.visible = true; echoMat.opacity = .45; }
      renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, pc); renderer.readRenderTargetPixels(rt, 0, 0, W, Hh, buf); renderer.setRenderTarget(null);
      undo(); if (F) F.visible = false;
      out.push(zayn_print(buf, W, Hh, zz ? '07 · 09' : '07 · 09', !zz));
    }
  } finally {
    echoMat.opacity = op0; camera.position.copy(c0); camera.quaternion.copy(q0); camera.updateMatrixWorld(true); flashRig.position.copy(fr0.p); flashRig.quaternion.copy(fr0.q); flashlight.intensity = fr0.i;
    try { gruen_refreshAll(true); } catch (e) {} if (typeof PERF_CULL !== 'undefined') { PERF_CULL.t = 0; perfCullTick(0); } try { assignLampPool(); } catch (e) {} rt.dispose();
  }
  return out;
}
// Rohbild (linear, kopfüber) → Kinderkamera-Abzug: Belichtung, leicht warm, Vignette, Rauschen, Datumsstempel
function zayn_print(buf, W, H, stamp, last) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), im = x.createImageData(W, H), d = im.data;
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) { const s = ((H - 1 - y) * W + i) * 4, t = (y * W + i) * 4, vx = i / W - .5, vy = y / H - .5, vig = 1 - (vx * vx + vy * vy) * 1.5, n = (Math.random() - .5) * 26;
    for (let k = 0; k < 3; k++) { let v = buf[s + k] / 255; v = Math.pow(Math.min(1, v * 2.6), 1 / 2.2) * 255 * vig * [1.06, 1, .9][k] + n; d[t + k] = Math.max(0, Math.min(255, v)); } d[t + 3] = 255; }
  x.putImageData(im, 0, 0); x.font = 'bold 18px monospace'; x.fillStyle = 'rgba(255,150,40,.85)'; x.fillText(stamp, W - 92, H - 14);
  if (last) { x.save(); x.translate(26, H - 30); x.rotate(-.04); x.fillStyle = 'rgba(250,245,235,.92)'; x.font = '24px "Comic Sans MS", cursive'; x.fillText('Er wollte, dass ich ihm folge.', 0, 0); x.restore(); }
  return c.toDataURL('image/jpeg', .85);
}
function zayn_camera() {
  const S = zayn_S; if (S.stage >= 2) return openNote('Zayns Kinderkamera', 'Das letzte Bild: nur der Waldrand hinter dem Spielplatz.\n\n<span class="hand">„Er wollte, dass ich ihm folge.“</span>');
  toast('Die Kamera surrt. Das Display flackert – dann: Fotos.', 2400);
  if (!S.photos) try { S.photos = zayn_takePhotos(); } catch (e) { console.warn('Zayn: Fotos', e); S.photos = []; }
  const order = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - .5); let step = 0;
  openPuzzle(`<h3>ZAYNS KAMERA</h3><p>Sechs Fotos vom alten Spielplatz. Auf jedem fehlt etwas. Auf jedem steht ein kleiner Junge – nie an derselben Stelle.<br>Tippe die Fotos in der richtigen Reihenfolge an.</p>
    <div class="zph" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:640px;margin:0 auto">${order.map(i => `<button data-i="${i}" style="position:relative;padding:0;border:2px solid #444;background:#111;cursor:pointer">${S.photos[i] ? `<img src="${S.photos[i]}" style="width:100%;display:block">` : `<div style="height:120px;color:#888;padding:40px 6px">Foto ${i + 1}</div>`}<span style="position:absolute;left:6px;top:4px;font:bold 22px Georgia;color:#ffd080;text-shadow:0 0 4px #000"></span></button>`).join('')}</div>
    <p style="opacity:.6;font-size:13px;margin-top:10px">Esc: später weitermachen</p>`, box => {
    const btns = [...box.querySelectorAll('button[data-i]')];
    btns.forEach(b => b.onclick = e => { e.stopPropagation(); const i = +b.dataset.i; if (b.dataset.done) return;
      if (i === step) { b.dataset.done = 1; b.style.borderColor = '#c9a36a'; b.querySelector('span').textContent = String(step + 1); step++; Audio.play('switch1', { gain: .2, rate: 1.6 });
        if (step === 6) setTimeout(() => { closeOverlay(); zayn_solved(); }, 700); }
      else { Audio.beep(false); step = 0; btns.forEach(o => { delete o.dataset.done; o.style.borderColor = '#444'; o.querySelector('span').textContent = ''; }); toast('Nein. Sieh genauer hin: Wo steht er auf jedem Bild?', 2600); } }); });
}
function zayn_solved() {
  zayn_stage(2, 'Auf jedem Foto ist Zayn einen Schritt näher am Wald. Das letzte zeigt nur noch den Waldrand hinter dem Spielplatz: „Er wollte, dass ich ihm folge.“');
  story.lore.push({ key: 'zayn_fotos', title: 'Zayns Fotos', html: 'Sechs Fotos vom alten Spielplatz. Auf jedem fehlt ein anderes Detail – die Schaukel, der Ball, die Bank, ein Baum, das Karussell. Und auf jedem steht Zayn einen Schritt weiter Richtung Wald.\n\nDas letzte Bild zeigt nur noch den Waldrand. Darauf, in Kinderschrift:\n<span class="hand">„Er wollte, dass ich ihm folge.“</span>' });
  openNote('Das letzte Foto', 'Kein Spielplatz mehr. Nur der Waldrand, dahinter Dunkel.\n\nQuer über das Bild, in Kinderschrift:\n<span class="hand">„Er wollte, dass ich ihm folge.“</span>');
  if (typeof gedanke === 'function') gedanke('zayn_folge', 'Die Dustwoods. Hinter dem Spielplatz. Da durfte keiner rein. Zayn schon gar nicht.', 1.2, 3);
}
// ---- 3) Spur
function zayn_shoeDropped(shoe) { const S = zayn_S; const hit = box(.4, .3, .4, shoe.position.x, .12, shoe.position.z, hidden, { cast: false }); S.spots.push({ k: 'schuh', x: shoe.position.x, z: shoe.position.z, mesh: shoe, hit });
  interact(hit, () => zayn_has('zayn_spur_schuh') ? '' : 'Ein Kinderschuh', () => zayn_take('schuh'));
  if (typeof hintAdd === 'function') hintAdd({ id: 'zayn_schuh', x: shoe.position.x, y: 0, z: shoe.position.z, kind: 'story', near: 22, open: () => zayn_S.stage >= 2 && !zayn_has('zayn_spur_schuh') }); }
function zayn_take(k) {
  const S = zayn_S, key = 'zayn_spur_' + k; if (zayn_has(key)) return; const sp = S.spots.find(s => s.k === k), def = ZAYN_SPUR.find(s => s[0] === k);
  if (sp) { if (sp.mesh) sp.mesh.visible = false; uninteract(sp.hit); } story.lore.push({ key, title: 'Zayns Spur · ' + def[1], html: def[2] }); Audio.paper();
  const n = ZAYN_SPUR.filter(s => zayn_has('zayn_spur_' + s[0])).length; openNote(def[1], def[2]);
  if (S.stage >= 2) zayn_stage(3, `Kleine Dinge am Weg durch die Forbidden Dustwoods (${n} / 4).` + (n === 4 ? ' Alles Dinge aus deiner eigenen Kindheit. Weiter hinten im Wald steht eine Hütte.' : ''));
  if (n === 4) setTimeout(() => say([['Eine Murmel. Ein Schuh. Kreide. Brause.', 3200], ['Das sind keine Zufälle. Das sind deine Sachen – deine Sommer, dein Spielplatz, deine Tankstelle.', 5200], ['Zayn hat sie nicht verloren. Er hat Erinnerungen nachgestellt. Für dich.', 4800]]), 900);
}
// ---- 4) Die Hütte
function zayn_drawing() {
  const S = zayn_S; openNote('Kinderzeichnung', 'Buntstift, an die Bretter gepinnt. Drei Kinder: ein blaues, ein rotes, ein kleines grünes am Rand. Darunter die Namen: <b>LUKE · JONAS · ICH</b>.\n\nUnd quer darunter, in Rot, mit viel zu viel Druck:\n<span class="hand">„Versprochen ist versprochen.“</span>', 'zayn_zeichnung', () => {
    if (S.stage < 2 || zayn_has('zayn_versprechen')) return; zayn_stage(4, 'Die Hütte im Wald. Eine Zeichnung: „Versprochen ist versprochen.“ Das alte Radio in der Ecke.');
    story.lore.push({ key: 'zayn_versprechen', title: 'Das Versprechen', html: 'Ein Nachmittag im Sommer. Jonas und du oben auf dem Klettergerüst, Zayn unten, zu klein. Er hatte Angst vor dem Wald.\n\n„Wenn du Angst hast, holen wir dich.“\n\nIhr habt es vergessen. Nicht absichtlich. Ihr seid älter geworden, habt euch auseinandergelebt. Und Zayn wurde einfach der kleine Bruder, den irgendwann keiner mehr beachtet hat.' });
    state.talking = true; setTimeout(async () => { await say([['Du erinnerst dich. Ein Sommernachmittag, das Klettergerüst. Zayn unten, zu klein zum Hochkommen. Er hatte Angst vor dem Wald.', 5600],
      ['„Wenn du Angst hast, holen wir dich.“ Jonas hat es gesagt. Du auch. Die Hand auf dem Herzen.', 5200], ['Ihr habt es vergessen. Nicht absichtlich. Ihr seid älter geworden. Und Zayn war nur noch der kleine Bruder, den keiner mehr beachtet hat.', 6400]]);
      state.talking = false; if (typeof gedanke === 'function') gedanke('zayn_ich', 'Ich weiß noch, wie sich das angefühlt hat. Ich weiß nur nicht mehr, ob ich das war.', 1, 3); }, 300); });
}
async function zayn_radio() {
  const S = zayn_S, H = WALD.hut; if (S.radioBusy) return;
  if (zayn_has('zayn_radio')) return toast('Nur noch Rauschen. Und das Summen einer Batterie, die es nicht gibt.', 3000);
  if (!zayn_has('zayn_versprechen')) return toast('Ein altes Kofferradio. Es rauscht leise – obwohl kein Strom da ist und das Batteriefach leer.', 3400);
  S.radioBusy = true; state.talking = true; Audio.radio(H.x + 1.1, H.z - 1.3); if (wald_S.hutLight) wald_S.hutLight.intensity = .6;
  await say([['*Rauschen* – dann ein Klicken. Eine Aufnahme.', 2600], ['„Ich weiß noch, was ihr gesagt habt.“', 3800, 'ZAYN']]); await wait(1800);
  await say([['„Ihr habt gesagt, ihr holt mich.“', 3800, 'ZAYN']]); Audio.giggle(H.x + 1.1, 1, H.z - 1.3); subtitle('<i>Kinderlachen. Mehrere Kinder. Ganz nah – dann weit weg.</i>', 3000); await wait(3200);
  await say([['„Deshalb hab ich gewartet.“', 4200, 'ZAYN'], ['Die Aufnahme endet.', 2400]]);
  Audio.radio(H.x + 1.1, H.z - 1.3, true); state.talking = false; S.radioBusy = false;
  story.lore.push({ key: 'zayn_radio', title: 'Das Radio', html: '„Ich weiß noch, was ihr gesagt habt.“\n„Ihr habt gesagt, ihr holt mich.“\n<i>Kinderlachen.</i>\n„Deshalb hab ich gewartet.“' });
  zayn_stage(5, 'Zayns Stimme im Radio. „Deshalb hab ich gewartet.“ Auf dem Boden der Hütte liegt eine Zeichnung.');
  S.floor.visible = true; interactables.push(S.floorHit); Audio.paper();
}
// ---- 5) Das Ende: keine Antwort
function zayn_last() {
  if (zayn_has('zayn_ende')) return openNote('Die letzte Zeichnung', 'Die Rückseite:\n<span class="hand">„Hast du dich an mich erinnert?“</span>');
  openNote('Die letzte Zeichnung', 'Wieder die drei Kinder. Jonas. Du. Und daneben – nichts. Zayn hat sich selbst aus dem Bild herausgemalt. Man sieht noch, wo er stand: Radiergummi, bis das Papier dünn wurde.\n\nAuf der Rückseite:\n<span class="hand">„Vielleicht wird man nicht vergessen, weil die Menschen aufhören, sich an einen zu erinnern.“\n„Vielleicht wird man vergessen, wenn sie anfangen, ohne einen weiterzuleben.“</span>\n\nUnd darunter nur:\n<span class="hand">„Hast du dich an mich erinnert?“</span>', null, () => {
    story.lore.push({ key: 'zayn_ende', title: 'Hast du dich an mich erinnert?', html: '„Vielleicht wird man nicht vergessen, weil die Menschen aufhören, sich an einen zu erinnern.“\n„Vielleicht wird man vergessen, wenn sie anfangen, ohne einen weiterzuleben.“\n\n„Hast du dich an mich erinnert?“' });
    sideDone('zayn', 'Hast du dich an mich erinnert?'); if (wald_S.hutLight) wald_S.hutLight.intensity = 0;
    setTimeout(() => { if (typeof gedanke === 'function') gedanke('zayn_nach', 'Ich suche Lucy, als gäbe es niemanden sonst. Aber Zayn war auch jemandes kleiner Bruder. Hilde hat siebzehn Jahre lang jede Nacht gezählt. Und Jonas hat allein im Wald gesucht.', 0, 3); }, 30000); });
}
WORLD_TICK.push((dt, t) => {
  const S = zayn_S; if (!S.ready || !state.started) return;
  // Der Rucksack liegt erst da, wenn Nr. 7 verlassen ist (Kapitel 3 und 4) – Platz nach dem Kollisionsaufbau suchen
  const open = ch3.on || (typeof anwesen_S !== 'undefined' && anwesen_S.ch4);
  if (open && S.stage < 1 && !S.bagPlaced && SOL.items.length) { S.bagPlaced = zayn_placeBag(); if (!S.bagPlaced) { S.bag.position.set(24.4, Y, -13.4); S.bagHit = box(.45, .5, .4, 24.4, Y + .22, -13.4, hidden, { cast: false }); interact(S.bagHit, zayn_bagLabel, () => zayn_bag()); S.bagPlaced = true; } }
  if (S.bagPlaced) { const vis = open; if (S.bag.visible !== vis) { S.bag.visible = vis; if (vis) { if (!interactables.includes(S.bagHit)) interactables.push(S.bagHit); } else uninteract(S.bagHit); } }
  const P = player.pos, r = wald_S.hutRect; const inHut = r && P.x > r.x0 && P.x < r.x1 && P.z > r.z0 && P.z < r.z1;
  if (inHut && !S.hutIn) { S.hutIn = true; if (S.stage >= 2 && !zayn_has('zayn_versprechen') && typeof gedanke === 'function') gedanke('zayn_huette', 'Kerzenwachs. Frisch. Hier war jemand. Vor Kurzem.', .3, 3); } else if (!inHut) S.hutIn = false;
});
window.__zayn = { S: zayn_S, bag: () => zayn_bag(), camera: () => zayn_camera(), solved: () => zayn_solved(), take: k => zayn_take(k), drawing: () => zayn_drawing(), radio: () => zayn_radio(), last: () => zayn_last(), photos: () => zayn_takePhotos() }; // Testzugriff
