// =====================================================================  KAPITEL 6 · DER HUNGRIGE (Modul „kapitel6“, Paket W2-P11)
// Grundlage: story_final.md, Produktionsplan PK-E (Texte wortgleich), PK-A A1–A13 (Sperren), PK-G G-1 (Uhr). Freitag, 6. November 2026, 02:10–05:40.
// Ablauf (Beats, K6.beat): gitter (Absperrgitter aufbiegen, SP6-1) → krumen (Brotkrumen bis Zayns Hütte; die Krähe frisst sie) → huette (SP6-2)
//   → zaun (eingedrückte Stelle im Nordzaun) → faden (roter Faden, Hochsitz SP6-3, Amtsbus) → wrack (Fraßstelle SP6-4, Seite 1 Pflicht) → bau (Wrack SP6-5,
//   Seite 2, Finale in hungrige.js: Lampe stirbt, Feuerzeug, zwei Raben) → epilog (Whiskey fliegt voraus) → hochsitz → oben (Augen zu, Dialog) → Kino K6 → Endkarte.
// Stille-Zonen („der Wald hat kein Echo“): Fraßstelle r 25, Hochsitz-Nackte r 15, Bus-Wolf r 15, Bau r 30 – über die Regie (spannung.js: SP.silent → keine
//   Tierlaute, Wind 20 %, Hall „dead“), Übergang 3 s; aus nach dem Finale (Epilog: erste Vögel, waldleben.js).
// Schnittstellen (typeof): kapStart/kapEnde (kapitel.js) · kino_play('k6') (kino.js) · augenzu_frei/_zu/_sperre (augenzu.js) · todCheckpoint (tod.js) ·
//   leben_uhr (leben.js) · whiskey_S/whiskey_fly (whiskey.js). Eigene Hooks für hungrige.js/tiefwald.js: k6_krumeVorn, k6_krumenFressen, k6_nachKraehe,
//   k6_lampeStirbt, k6_feuerzeug, k6_nachFinale, k6_oben. Keine Lichter zur Laufzeit: das Feuerzeug-Licht ist ein VLight, beim Laden mit 0 angelegt.
const K6 = { on: false, beat: '', obj: '', sp: new Set(), told: new Set(), ready: false, grp: null, krumen: [], krIM: [], eaten: false, prints: null, hands: null, blood: null,
  sil: 0, holdT: 0, openT: -1, lampDead: false, lighter: null, boy: null, chair: null, gi: 0, guideT: 0, epiBusy: false, busSeen: 0, kidT: 0, hint: null, wahl: null, saveT: 0 };
const K6_ZONEN = [{ x: 1.5, z: 199.6, r: 25, id: 'frass' }, { x: 14, z: 178.5, r: 15, id: 'hochsitz' }, { x: 65, z: 199.5, r: 15, id: 'bus' }, { x: -13.2, z: 206.8, r: 30, id: 'bau' }];
const K6_WEG = [[-5, 203], [6, 200], [22, 196], [40, 189], [27, 184], [19, 176.5]]; // Whiskeys Rückweg vom Bau zum Hochsitz (tiefwald.js: TIEF_PATHS 5 und 1)
const K6_INTRO = '<p class="on" style="font-family:Georgia;font-size:12px;letter-spacing:.4em;color:#c9a36a;margin-bottom:22px">KAPITEL 6 · WENDIGO</p><p class="on">Freitag, kurz nach zwei.</p><p class="on">Lucy schläft bei Vegas. Diesmal ganz.</p><p class="on">Du nicht. In der Jacke: Peters Feuerzeug, die Lampe, drei Batterien.</p><p class="on">Hinter dem Spielplatz sitzt ein Junge mit deinem Namen in einem Wald, der kein Echo hat.</p><p class="on" style="font-family:Georgia;font-size:11px;letter-spacing:.35em;color:#8b7f68;margin-top:30px">KLICKEN ZUM WEITERSPIELEN</p>';
const K6_BEATS = ['gitter', 'krumen', 'huette', 'zaun', 'faden', 'wrack', 'bau', 'epilog', 'hochsitz', 'oben', 'ende'];
const k6_ab = b => K6_BEATS.indexOf(K6.beat) >= K6_BEATS.indexOf(b);
const _k6V = new THREE.Vector3(), _k6M = new THREE.Matrix4(), _k6Z = new THREE.Matrix4().makeScale(0, 0, 0);
function k6_obj(t) { K6.obj = t; if (typeof setC3 === 'function') setC3(t); else $('objText').textContent = t; }
function k6_cp(id, label) { if (K6.sp.has(id)) return; K6.sp.add(id); if (typeof todCheckpoint === 'function') todCheckpoint(id, label); else saveGame(6); }
function k6_luke(t, ms = 2600) { subtitle(t, ms, 'LUKE'); }
function k6_wait(ms) { return new Promise(r => setTimeout(r, ms)); }
// ---------------------------------------------------------------- Texturen für Spuren (Decals, beim Laden gezeichnet)
function k6_tex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function k6_blot(g, x, y, rx, ry, a, col) { const gr = g.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry)); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(.72, `rgba(${col},${a * .8})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx, 0, 7); g.fill(); g.restore(); }
// kleiner nackter Fuß (links; rechts = gespiegelt): Ferse, Außenkante, Ballen, fünf Zehen – nasse Erde, ausgefranst
const k6_footTex = () => k6_tex(128, 256, (g, w, h) => { g.clearRect(0, 0, w, h); const c = '34,24,16';
  k6_blot(g, 66, 206, 25, 31, .8, c); for (let i = 0; i < 9; i++) k6_blot(g, 74 - i * 1.2, 180 - i * 11, 16 + Math.sin(i * .7) * 3, 14, .72, c); // Ferse, Außenkante
  k6_blot(g, 60, 92, 34, 26, .82, c); // Ballen
  [[40, 50, 11], [56, 42, 9], [70, 42, 8], [82, 47, 7], [92, 55, 6]].forEach(([x, y, r]) => k6_blot(g, x, y, r, r * 1.2, .85, c));
  const id = g.getImageData(0, 0, w, h), d = id.data; for (let i = 3; i < d.length; i += 4) d[i] *= .7 + Math.random() * .3; g.putImageData(id, 0, 0); });
// kleine Hand im Staub (hell, trocken) bzw. im Moos (dunkel, eingedrückt)
const k6_handTex = col => k6_tex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h);
  k6_blot(g, 64, 80, 26, 24, .75, col); [[34, 52, 8, 16, -.5], [48, 32, 7, 18, -.15], [64, 26, 7, 19, 0], [79, 31, 6, 17, .15], [92, 60, 6, 12, .7]].forEach(([x, y, rx, ry, a]) => { g.save(); g.translate(x, y); g.rotate(a); g.translate(-x, -y); k6_blot(g, x, y, rx, ry, .75, col); g.restore(); });
  const id = g.getImageData(0, 0, w, h), d = id.data; for (let i = 3; i < d.length; i += 4) d[i] *= .6 + Math.random() * .4; g.putImageData(id, 0, 0); });
function k6_decalMat(map, rough = .7) { return new THREE.MeshStandardMaterial({ map, transparent: true, depthWrite: false, roughness: rough, metalness: 0, polygonOffset: true, polygonOffsetFactor: -4 }); }
function k6_decals(mat, list, w, h) { // list: [x, z, ry, s, spiegeln] → eine Instanzgruppe (ein Zeichenaufruf)
  const g = new THREE.PlaneGeometry(w, h); g.rotateX(-PI / 2); const im = new THREE.InstancedMesh(g, mat, list.length), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  list.forEach(([x, z, ry, sc, mir, y], i) => { im.setMatrixAt(i, new THREE.Matrix4().compose(v.set(x, y ?? .034, z), q.setFromEuler(e.set(0, ry, 0)), s.set(mir ? -sc : sc, 1, sc))); });
  im.receiveShadow = true; im.castShadow = false; im.userData.noCol = true; im.userData.noCull = true; im.computeBoundingSphere(); K6.grp.add(im); return im; }
// Punkte entlang einer Polylinie alle ~step m: [x, z, Richtung]
function k6_along(P, step, from = 0) { const out = []; let acc = from; for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], L = Math.hypot(bx - ax, bz - az), a = Math.atan2(bx - ax, bz - az);
  while (acc <= L) { const k = acc / L; out.push([ax + (bx - ax) * k, az + (bz - az) * k, a]); acc += step; } acc -= L; } return out; }
// ---------------------------------------------------------------- Aufbau (beim Laden; alles in K6.grp, unsichtbar bis Kapitel 6)
WORLD_MODS.push(['Kapitel 6', async () => {
  const T = THREE; K6.grp = new T.Group(); K6.grp.name = 'kapitel6'; K6.grp.visible = false; K6.grp.userData.noCol = true; scene.add(K6.grp);
  // --- Brotkrumen: Papas Brot, zerbröselt (Scan w_brot, verkleinert) – alle 4–6 m auf dem Weg vom Gitter bis zu Zayns Hütte
  try { const parts = await msBake('w_brot', 'model.glb'); const bb = new T.Box3(); parts.forEach(p => { p.geo.computeBoundingBox(); bb.union(p.geo.boundingBox); }); const sz = bb.getSize(new T.Vector3()), mx = Math.max(sz.x, sz.y, sz.z) || 1, c = bb.getCenter(new T.Vector3());
    const route = typeof WALD_PATHS !== 'undefined' ? WALD_PATHS[0] : [[30, 96], [57, 146.8]], pts = k6_along(route, 5, 2.5).filter(p => p[1] > 99.2), M = [], q = new T.Quaternion(), e = new T.Euler();
    pts.forEach(([x, z], i) => { const cl = { x: x + rand(-.5, .5), z: z + rand(-.5, .5), idx: [] }; for (let k = 0; k < 5; k++) { const s = rand(.028, .055) / mx; cl.idx.push(M.length);
        M.push(new T.Matrix4().compose(new T.Vector3(cl.x + rand(-.28, .28), .015, cl.z + rand(-.28, .28)), q.setFromEuler(e.set(rand(0, 6), rand(0, 6), rand(0, 6))), new T.Vector3(s, s * rand(.5, .8), s)).multiply(new T.Matrix4().makeTranslation(-c.x, -bb.min.y, -c.z))); }
      K6.krumen.push(cl); });
    K6.krM = M; K6.krIM = parts.map(p => { const mat = p.mat.clone(); if (mat.color) mat.color.multiplyScalar(1.25); const im = new T.InstancedMesh(p.geo, mat, M.length); M.forEach((m, i) => im.setMatrixAt(i, m)); im.castShadow = false; im.receiveShadow = true; im.userData.noCol = true; im.userData.noCull = true; im.computeBoundingSphere(); K6.grp.add(im); return im; });
  } catch (e) { console.warn('Kapitel6: Brotkrumen', e); }
  // --- kleine nackte Fußspuren unter dem Gitter hindurch (durch die aufgebogene Ecke rechts) auf den Weg
  { const L = []; let x = 33.7, z = 95.6, a = -.25; for (let i = 0; i < 22; i++) { const side = i % 2 ? 1 : -1; a += (Math.atan2(29.6 - x, 105 - z) - a) * .2; x += Math.sin(a) * .36; z += Math.cos(a) * .36;
      L.push([x + Math.cos(a) * .06 * side, z - Math.sin(a) * .06 * side, a, rand(.95, 1.05), side > 0]); }
    K6.prints = k6_decals(k6_decalMat(k6_footTex(), .45), L, .085, .17); }
  // --- Hände: im Staub der Hütte und hinaus zur eingedrückten Stelle im Nordzaun; im Moos an den Wollbäumen (der Junge folgt der Wolle auch)
  { const H = typeof WALD !== 'undefined' ? WALD.hut : { x: 58, z: 149.5 }, L = [];
    for (let i = 0; i < 6; i++) L.push([H.x + rand(-1.2, 1), H.z + rand(-1.2, 1.2), rand(0, 6.28), rand(.9, 1.1), i % 2, .045]);
    for (const [x, z, a] of k6_along([[57.4, 147.3], [52, 146.4], [48, 147.5], [46, 149], [44, 152.5], [42.2, 155.6]], 1.6)) L.push([x + rand(-.2, .2), z + rand(-.2, .2), a + rand(-.3, .3), rand(.9, 1.05), Math.random() < .5]);
    K6.handsDust = k6_decals(k6_decalMat(k6_handTex('150,140,120'), .95), L, .1, .1);
    const M2 = [], route = typeof TIEF_PATHS !== 'undefined' ? [...TIEF_PATHS[0], ...TIEF_PATHS[1].slice(1)] : [];
    for (const [x, z, a] of k6_along(route, 9, 4)) { const nx = Math.cos(a), nz = -Math.sin(a); for (let k = 0; k < 2; k++) M2.push([x + nx * 1.1 + rand(-.25, .25), z + nz * 1.1 + rand(-.25, .25), a + rand(-.6, .6), rand(.9, 1.1), k, .038]); }
    K6.handsMoss = k6_decals(k6_decalMat(k6_handTex('20,26,14'), .9), M2, .1, .1); }
  // --- Blutspur vom Weg am Amtsbus zur Fraßstelle (es hat das Reh dorthin geschleift)
  { const L = []; for (const [x, z, a] of k6_along([[40, 189], [22, 196], [8, 199.6], [3.5, 199.8]], 2.6, 1)) L.push([x + rand(-.4, .4), z + rand(-.4, .4), rand(0, 6.28), rand(.7, 1.3), Math.random() < .5, .036]);
    let bm = null; for (let i = 0; i < 40 && !(FAB.blood && FAB.blood.spatter); i++) await wait(100); const sp = FAB.blood && FAB.blood.spatter; bm = sp && sp.isMaterial ? sp : null;
    K6.blood = k6_decals(bm || k6_decalMat(k6_handTex('70,6,4'), .3), L, .45, .45); }
  // --- Hochsitz: ein alter Stuhl (Scan), darauf später der Junge
  try { const TS = typeof TIEF !== 'undefined' ? TIEF.stand : { x: 14, z: 178.5 }, y = 3.1; const ch = await msFBX('chair', 'model.fbx', { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } });
    msFit(ch, .92, 'y'); const g = msGround(ch); g.position.set(TS.x + .15, y, TS.z + .35); g.rotation.y = PI; g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); K6.grp.add(g); K6.chair = g;
    const bg = new T.Group(); bg.position.set(TS.x + .15, y, TS.z + .42); bg.visible = false; bg.userData.noCol = true; K6.grp.add(bg); K6.boy = { g: bg, P: null }; } catch (e) { console.warn('Kapitel6: Hochsitz', e); }
  // --- Peters Feuerzeug in der Hand (Scan w_lighter) mit Flammen-Sprite; das Licht ist ein VLight, beim Laden mit 0 angelegt
  try { const src = await msModel('w_lighter', 'model.glb'); const o = msGround(msFit(src.clone(true), .065, 'y')); o.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; } });
    const g = new T.Group(); g.add(o); const fl = new T.Sprite(new T.SpriteMaterial({ map: flameTex, color: 0xffd08a, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); fl.scale.set(.022, .038, 1); fl.position.y = .082; g.add(fl);
    g.visible = false; g.userData.noCol = true; scene.add(g); const L = new VLight(0xffb266, 0, 5.5, 2); scene.add(L); K6.lighter = { g, fl, L, on: false, t: 0 }; } catch (e) { console.warn('Kapitel6: Feuerzeug', e); }
  // --- Einblendungen: „E – Feuerzeug“ und die Antworten auf dem Hochsitz (Tasten 1–3)
  { const css = document.createElement('style'); css.textContent = `#k6Hint { position: absolute; left: 50%; bottom: 23%; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; opacity: 0; transition: opacity .6s; pointer-events: none;
      font: 600 14px "Cormorant Garamond", Georgia, serif; letter-spacing: .32em; color: #e9dfc8; text-shadow: 0 0 2px #000, 0 0 10px #000; white-space: nowrap; } #k6Hint.show { opacity: 1; }
    #k6Hint b, #k6Wahl b { display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 28px; padding: 0 6px; letter-spacing: 0; border: 1px solid rgba(201,163,106,.7); border-radius: 3px; background: rgba(8,7,6,.62); color: #f3e7cc; font: 700 14px Georgia, serif; }
    #k6Wahl { position: absolute; left: 50%; bottom: 31%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 10px; opacity: 0; transition: opacity .5s; pointer-events: none; }
    #k6Wahl.show { opacity: 1; } #k6Wahl div { display: flex; align-items: center; gap: 14px; font: italic 20px "Cormorant Garamond", Georgia, serif; color: #e2d6b8; text-shadow: 0 0 3px #000, 0 0 12px #000; white-space: nowrap; }`;
    document.head.appendChild(css); const hud = document.getElementById('hud'); K6.hint = document.createElement('div'); K6.hint.id = 'k6Hint'; hud.appendChild(K6.hint); K6.wahl = document.createElement('div'); K6.wahl.id = 'k6Wahl'; hud.appendChild(K6.wahl); }
  // --- Kinderblick (Taste G): die Hauptaufgabe
  if (typeof hintAdd === 'function') { const H = (id, x, z, open) => hintAdd({ id, x, y: 0, z, kind: 'story', near: 60, open: () => K6.on && open() });
    H('k6_huette', 58, 149.5, () => K6.beat === 'krumen' || K6.beat === 'huette'); H('k6_zaun', 42, 156.5, () => K6.beat === 'zaun'); H('k6_hochsitz', 14, 178.5, () => K6.beat === 'faden' && !K6.sp.has('k6_hochsitz'));
    H('k6_bus', 65, 199.5, () => K6.beat === 'faden' && K6.sp.has('k6_hochsitz')); H('k6_frass', 1.5, 199.6, () => K6.beat === 'wrack' && !(typeof hungrige_has === 'function' && hungrige_has('spuren')));
    H('k6_wrack', -10, 204.5, () => K6.beat === 'wrack' && typeof hungrige_has === 'function' && hungrige_has('spuren')); H('k6_hochsitz2', 14, 178.5, () => K6.beat === 'hochsitz'); }
  K6.ready = true;
}]);
// ---------------------------------------------------------------- Brotkrumen und die Krähe (Hooks für hungrige.js)
function k6_krumeVorn() { // eine noch liegende Krume 5–12 m vor Luke, im Blick
  if (!K6.on || K6.eaten || K6.beat !== 'krumen') return null; const P = player.pos, f = flatDir(); let best = null, bd = 1e9;
  for (const c of K6.krumen) { if (c.gone) continue; const dx = c.x - P.x, dz = c.z - P.z, d = Math.hypot(dx, dz); if (d < 5 || d > 12 || (dx * f.x + dz * f.z) / d < .7) continue; if (d < bd) { bd = d; best = c; } }
  return best ? [best.x, 0, best.z] : null;
}
function k6_krumeWeg(c) { if (c.gone) return; c.gone = true; for (const i of c.idx) for (const im of K6.krIM) { im.setMatrixAt(i, _k6Z); im.instanceMatrix.needsUpdate = true; } }
function k6_krumenFressen(x, z) { for (const c of K6.krumen) if (Math.hypot(c.x - x, c.z - z) < 2.5) k6_krumeWeg(c); }
function k6_nachKraehe(ate) { // die Krähe hat gefressen: auch die übrigen Krumen voraus sind fort
  if (!K6.on || K6.eaten || !ate) return; K6.eaten = true; const P = player.pos;
  for (const c of K6.krumen) if (c.z > P.z - 2) k6_krumeWeg(c);
  setTimeout(() => { if (K6.beat === 'krumen') { k6_luke('Die Spur ist weg.', 2400); k6_obj('Zayns Hütte.'); k6_set('huette'); } }, 3600);
}
// ---------------------------------------------------------------- Lampe und Feuerzeug (Finale am Bau)
function k6_feuerzeug(on) {
  const L = K6.lighter; if (L) { L.on = on; L.g.visible = on; if (!on) L.L.intensity = 0; }
  if (on) { Audio.play('metalHit1', { gain: .16, rate: 2.6, dur: .12 }); setTimeout(() => Audio.play('switch2', { gain: .2, rate: .7 }), 180); }
  else if (K6.lampDead) { K6.lampDead = false; flashOn = true; state.flashFail = Math.max(state.flashFail, .5); } // die Lampe geht wieder an
}
async function k6_lampeStirbt() {
  if (!K6.on) return; state.flashFail = 1.4; Audio.play('buzz', { gain: .12, rate: 1.4, dur: .6 }); await k6_wait(1400);
  K6.lampDead = true; flashOn = false; Audio.play('switch1', { gain: .15, rate: .6 }); await k6_wait(500);
  await say([['Nicht jetzt.', 1800, 'LUKE']]);
  K6.hint.innerHTML = '<b>E</b><span>' + trX('Feuerzeug') + '</span>'; K6.hint.classList.add('show');
  await new Promise(res => { const t0 = performance.now(), k = e => { if (e.code === 'KeyE' || e.code === 'Enter') { removeEventListener('keydown', k, true); res(); } }; addEventListener('keydown', k, true);
    const safe = () => { if (!K6.hint.classList.contains('show')) return; if (performance.now() - t0 > 60000) { removeEventListener('keydown', k, true); res(); } else setTimeout(safe, 1000); }; setTimeout(safe, 1000); });
  K6.hint.classList.remove('show'); k6_feuerzeug(true); await k6_wait(900);
  await say([['Damit du im Dunkeln nicht allein bist.', 3000, 'LUKE']]);
}
function k6_lighterTick(dt, t) {
  const L = K6.lighter; if (!L) return; if (K6.lampDead) flashOn = false;
  if (!L.on) return; L.t += dt; _k6V.set(.15, -.16, -.36).applyQuaternion(camera.quaternion).add(camera.position); L.g.position.copy(_k6V); L.g.quaternion.copy(camera.quaternion); L.g.rotateX(.25);
  const fk = .85 + Math.sin(t * 13) * .06 + Math.sin(t * 29 + 1.3) * .05 + (Math.random() - .5) * .06; L.fl.scale.set(.022 * fk, .038 * (2 - fk), 1);
  L.fl.getWorldPosition(L.L.position); L.L.position.y += .02; L.L.intensity += (1.9 * fk - L.L.intensity) * Math.min(1, dt * 10);
}
// ---------------------------------------------------------------- Stille-Zonen (Werte vorab, keine Allokation; spannung.js bleibt unverändert)
function k6_stille(dt) {
  if (!K6.on || typeof SP === 'undefined') return; const P = player.pos; let want = 0, zone = null;
  if (!(typeof hungrige_S !== 'undefined' && hungrige_S.finale) && !state.inBasement && state.zone !== 'canal')
    for (const Z of K6_ZONEN) { if (Z.id === 'hochsitz' && typeof hungrige_has === 'function' && hungrige_has('nackt_reh') && !(hungrige_S.ev && hungrige_S.ev.id === 'nackt_reh')) continue; // nach der Begegnung: wieder Wald
      if (Z.id === 'bus' && typeof hungrige_has === 'function' && hungrige_has('nackt_wolf') && !(hungrige_S.ev && hungrige_S.ev.id === 'nackt_wolf')) continue;
      const d = Math.hypot(P.x - Z.x, P.z - Z.z), s = d < Z.r ? 1 : d < Z.r + 6 ? (Z.r + 6 - d) / 6 : 0; if (s > want) { want = s; zone = Z; } }
  const st = dt / 3; K6.sil += Math.max(-st, Math.min(st, want - K6.sil)); SP.silent = K6.sil; if (typeof spannung_bed === 'function') spannung_bed(false);
  if (K6.sil > .9 && zone && !state.talking && !ui.overlay) {
    if (!K6.told.has('still')) { K6.told.add('still'); k6_luke('Hier ist es still. Nicht leise. Still.', 3400); }
    else if (zone.id === 'frass' && !K6.told.has('ruf') && Math.hypot(P.x - zone.x, P.z - zone.z) < 12) { K6.told.add('ruf'); setTimeout(() => { subtitle('„Luke?“', 2200, 'LUKE'); setTimeout(() => subtitle('<i>Kein Echo.</i>', 2400), 2600); }, 1200); }
  }
}
// ---------------------------------------------------------------- Ablauf
function k6_set(b) { if (K6.beat === b) return; K6.beat = b; if (typeof saveGame === 'function' && b !== 'oben') saveGame(6); }
function k6_near(x, z, r) { return Math.hypot(player.pos.x - x, player.pos.z - z) < r; }
function k6_beats(dt) {
  const B = K6.beat, P = player.pos, has = k => typeof tief_has === 'function' && tief_has(k), hh = k => typeof hungrige_has === 'function' && hungrige_has(k);
  if (B === 'krumen') { if (k6_near(58, 149.5, 13)) { k6_obj('Zayns Hütte.'); k6_set('huette'); } }
  else if (B === 'huette') { const R = typeof wald_S !== 'undefined' && wald_S.hutRect; const inHut = R ? P.x > R.x0 - .3 && P.x < R.x1 + .3 && P.z > R.z0 - .6 && P.z < R.z1 + .3 : k6_near(58, 149.5, 2.5);
    if (inHut && !K6.told.has('huette')) { K6.told.add('huette'); k6_cp('k6_huette', 'Zayns Hütte'); setTimeout(() => { if (K6.beat === 'huette') { k6_obj('Durch den eingedrückten Zaun. Tiefer.'); k6_set('zaun'); } }, 6000); } }
  else if (B === 'zaun') { if (k6_near(42, 156.4, 4.5) || has('tief_zettel_1') || P.z > 158) { k6_obj('Folge dem roten Faden.'); k6_set('faden'); } }
  else if (B === 'faden') { if (k6_near(14, 178.5, 7)) k6_cp('k6_hochsitz', 'Der Hochsitz');
    if (k6_near(65, 199.5, 10)) K6.busSeen += dt; if ((K6.busSeen > 0 && (has('tief_zettel_3') || has('tief_fahrtenbuch') || hh('nackt_wolf'))) || K6.busSeen > 25 || (K6.busSeen > 0 && !k6_near(65, 199.5, 24))) { k6_obj('Der Weg zum Wrack.'); k6_set('wrack'); } }
  else if (B === 'wrack') { if (hh('spuren') && k6_near(-10, 204.5, 9)) { k6_obj('Hinter dem Wrack.'); k6_cp('k6_wrack', 'Das Wrack'); k6_set('bau'); } }
  else if (B === 'bau') { if (typeof hungrige_S !== 'undefined' && hungrige_S.finale && !hungrige_S.cine) k6_epilog(); }
  else if (B === 'epilog') k6_guide(dt);
  if (k6_near(1.5, 199.6, 12) && K6.beat !== 'gitter') k6_cp('k6_frass', 'Die Fraßstelle');
}
// Absperrgitter: ab Kapitel 5 die Kinderlücke, in Kapitel 6 aufbiegen (E halten, wie das Gitter im Amt)
function k6_gitter(dt) {
  const D = typeof gruen_S !== 'undefined' && gruen_S.dustBarrier; if (!D) return;
  K6.kidT -= dt; if (K6.kidT < 0) { K6.kidT = 1; D.setKid(typeof kapAb === 'function' ? kapAb(5) : K6.on); }
  if (K6.openT >= 0) { K6.openT += dt; D.setOpen(Math.min(1, K6.openT / 1.3)); if (K6.openT >= 1.3) K6.openT = -1; return; }
  if (!K6.on || D.open) return; const P = player.pos, near = Math.abs(P.x - 30.1) < 5 && P.z > 95.3 && P.z < 98.3;
  if (near && keys.KeyE && !ui.overlay && !scripted) { /* nicht auf state.talking warten: Whiskey sitzt an der Station „waldrand“ direkt daneben */ K6.holdT += dt; if (K6.holdT % .3 < dt) Audio.play(Audio.pick('metalHit1', 'metalHit2'), { gain: .1, rate: rand(1.4, 1.9), dur: .15, x: 33, y: .6, z: 98 });
    if (K6.holdT > 1.6) { K6.holdT = 0; K6.openT = 0; Audio.play('metalSheet', { gain: .35, rate: .8, x: 32, y: .5, z: 98.3 }); Audio.play('scrape2', { gain: .25, rate: .9, x: 32, y: .2, z: 98.5 }); $('sideInfo').textContent = '';
      if (K6.beat === 'gitter') { k6_obj('Folge den Brotkrumen.'); k6_set('krumen'); } } }
  else K6.holdT = Math.max(0, K6.holdT - dt * 2);
  if (near) $('sideInfo').textContent = K6.holdT > 0 ? '▮'.repeat(Math.ceil(K6.holdT / 1.6 * 8)).padEnd(8, '▯') : '';
}
// ---------------------------------------------------------------- Epilog: Whiskey fliegt voraus, der Hochsitz, Augen zu
function k6_nachFinale(at) { K6.whAt = at ? at.clone() : null; if (typeof whiskey_S !== 'undefined' && whiskey_S.g && at) { const W = whiskey_S; W.fl = null; W.mode = 'perch'; W.g.position.copy(at); W.g.visible = true; if (typeof whiskey_play === 'function') whiskey_play('IdleLookAround', .2); } }
function k6_epilog() {
  if (K6.beat !== 'bau') return; k6_feuerzeug(false); K6.lampDead = false; flashOn = true; k6_set('epilog'); k6_obj('Whiskey fliegt voraus. Folge ihm.');
  if (typeof leben_uhr === 'function') try { leben_uhr(4, 50); } catch (e) {}
  if (typeof WL !== 'undefined') WL.morgen = true; K6.gi = 0; K6.guideT = 3; k6_boy(true);
  if (typeof whiskey_S === 'undefined' || !whiskey_S.g || typeof whiskey_fly !== 'function') { k6_obj('Der Hochsitz.'); k6_set('hochsitz'); }
  else if (!K6.whAt) { const W = whiskey_S, p = HUNGRIGE.pfahl; W.fl = null; W.mode = 'perch'; W.g.position.set(p.x, 2.1, p.z); W.g.visible = true; }
}
function k6_whiskeyStation() { if (typeof WHISKEY_ST === 'undefined') return; let st = null; for (const s of WHISKEY_ST) if (s.when() && !s.done()) st = s; whiskey_S.st = st; whiskey_S.left = st; } // Stationen ruhen, solange er führt
function k6_guide(dt) {
  const W = whiskey_S; if (!W || !W.g) return; k6_whiskeyStation(); if (W.fl || W.mode === 'take' || W.mode === 'fly') return; K6.guideT -= dt; if (K6.guideT > 0) return;
  const d = Math.hypot(player.pos.x - W.g.position.x, player.pos.z - W.g.position.z); if (d > 12 && K6.gi > 0) return;
  const TS = typeof TIEF !== 'undefined' ? TIEF.stand : { x: 14, z: 178.5 };
  if (K6.gi < K6_WEG.length) { const [x, z] = K6_WEG[K6.gi++]; const y = typeof whiskey_perch === 'function' ? whiskey_perch(x, z) : 0; whiskey_fly(new THREE.Vector3(x, y, z), null); K6.guideT = 1; }
  else if (K6.gi === K6_WEG.length) { K6.gi++; whiskey_fly(new THREE.Vector3(TS.x + .95, 4.02, TS.z), () => { if (K6.beat === 'epilog') { k6_obj('Der Hochsitz.'); k6_set('hochsitz'); } }); }
}
async function k6_boy(on) {
  const b = K6.boy; if (!b) return; b.g.visible = on; if (!on || b.P || b.loading || typeof figuren_embody !== 'function') return; b.loading = true;
  try { const P = await figuren_embody(b.g, 'luke_echt', { clip: 'idle', sit: 3.1 + .46 }); b.P = P; if (P) { P.obj.traverse(o => { if (o.isMesh) o.castShadow = true; }); if (P.mx) P.mx.stopAllAction(); } } catch (e) { console.warn('Kapitel6: Junge', e); } b.loading = false;
}
function k6_oben() { // tiefwald.js: oben auf dem Hochsitz angekommen
  if (!K6.on || K6.beat !== 'hochsitz' || K6.epiBusy) return false; k6_hochsitz(); return true;
}
function k6_zuWarten() { return new Promise(res => { const f = () => (typeof augenzu_zu !== 'function' || augenzu_zu()) ? res() : setTimeout(f, 80); f(); }); }
async function k6_sayZu(lines) { for (const l of lines) { await k6_zuWarten(); const [t, ms, who] = l, d = Math.max(ms, readMs(trX(t))); subtitle(t, d + 250, who); await k6_wait(d); } }
function k6_taste(n, ms) { return new Promise(res => { let done = false; const k = e => { const m = /^(Digit|Numpad)([1-9])$/.exec(e.code); if (!m || +m[2] > n) return; if (typeof augenzu_zu === 'function' && !augenzu_zu()) return; done = true; removeEventListener('keydown', k, true); res(+m[2] - 1); };
  addEventListener('keydown', k, true); if (ms) setTimeout(() => { if (!done) { removeEventListener('keydown', k, true); res(-1); } }, ms); }); }
async function k6_hochsitz() {
  K6.epiBusy = true; k6_set('oben'); state.talking = true; const W = typeof whiskey_S !== 'undefined' ? whiskey_S : null;
  try {
    await k6_wait(800); k6_luke('Nicht hinsehen.', 2400); await k6_wait(1600);
    if (typeof augenzu_frei === 'function') augenzu_frei({ wirkt: true, hinweis: 'Q halten – Augen zu' }); else { $('fade').style.background = '#000'; await fade(1, 1200); }
    await k6_zuWarten(); await k6_wait(900);
    const P = player.pos; Audio.play('heartbeat', { gain: .12, rate: .8, dur: .9, lp: 300 }); if (W && W.g) Audio.flap(W.g.position.x, W.g.position.y, W.g.position.z);
    await k6_sayZu([['Du bist mir nachgekommen.', 2600, 'ECHTER LUKE'], ['Das hat noch keiner.', 2400, 'ECHTER LUKE']]);
    const kreis = typeof tief_has === 'function' && (tief_has('tief_achter') || tief_has('tief_zettel_4'));
    const opt = [['Ich guck nicht hin. Versprochen.', [['Versprochen ist versprochen.', 2600, 'ECHTER LUKE']]],
      ...(kreis ? [['Der achte Stöckchenmann …', [['Den hab ich gemacht. 2013. Für dich. Damit du auch einen Platz hast.', 4400, 'ECHTER LUKE']]]] : []),
      ['Kommst du mit heim?', [['Wenn ich heimgeh, musst du gehen. Einer von uns ist immer übrig.', 4600, 'ECHTER LUKE']]]];
    let asked = 0;
    while (opt.length) { await k6_zuWarten(); K6.wahl.innerHTML = opt.map((o, i) => `<div><b>${i + 1}</b><span>„${trX(o[0])}“</span></div>`).join(''); K6.wahl.classList.add('show');
      const i = await k6_taste(opt.length, asked ? 16000 : 0); K6.wahl.classList.remove('show'); if (i < 0) break;
      const [q, a] = opt.splice(i, 1)[0]; asked++; await k6_sayZu([[q, 2400, 'LUKE'], ...a]); await k6_wait(500); }
    await k6_sayZu([['Du zitterst ja.', 2200, 'LUKE']]);
    for (let i = 0; i < 3; i++) setTimeout(() => { if (typeof wl_rustle === 'function') wl_rustle(P.x + .3, P.z + .5, .9); }, i * 420); await k6_wait(1700);
    await k6_sayZu([['Die ist warm.', 2200, 'ECHTER LUKE']]); await k6_wait(1800);
    await k6_sayZu([['Meine Jacke hängt an der Vogelscheuche. Jetzt hab ich deine. Gerecht.', 4400, 'ECHTER LUKE']]);
    await k6_wait(1200); $('fade').style.background = '#000'; await fade(1, 900);
  } catch (e) { console.error('Kapitel6: Hochsitz', e); }
  if (typeof augenzu_sperre === 'function') augenzu_sperre(); state.talking = false; K6.wahl.classList.remove('show');
  await k6_ende();
}
async function k6_ende() {
  k6_set('ende'); if (typeof hungrige_S !== 'undefined') hungrige_S.epilog = true; // Beobachter „d_zugesehen“ (W2-P10) darf jetzt erscheinen
  if (!story.lore.some(l => l.key === 'k6_hochsitz')) story.lore.push({ key: 'k6_hochsitz', title: 'Kapitel 6 · Der Hochsitz', html: 'Oben auf dem Hochsitz schläft ein Junge mit deinem Namen. Du hast ihn nicht angesehen.\n\nDeine Jacke hat er jetzt. Seine hängt an der Vogelscheuche.' });
  try { saveGame(6); } catch (e) {}
  if (typeof kino_play === 'function') { if (K6.boy) K6.boy.g.visible = false; try { await kino_play('k6'); } catch (e) { console.error('Kino k6', e); } } else { $('fade').style.background = '#000'; await fade(1, 1200); await k6_wait(1500); } // die Kinosequenz besetzt den Jungen selbst
  if (typeof kapEnde === 'function') { try { kapEnde(6); } catch (e) { console.error('kapEnde(6)', e); } }
  const ec = $('endcard'); state.ending = true; state.talking = false;
  ec.querySelector('h1').textContent = 'KAPITEL 6 · WENDIGO · ENDE'; // Fassung 3, wortgleich
  ec.querySelector('p').innerHTML = 'Er ist nicht tot. Er weiß jetzt, wem der Rabe gehört.<br>Auf dem Hochsitz schläft ein Junge in deiner Jacke. Du hast ihn nicht angesehen.<br>Der Rabe ist nach Westen geflogen.<br>Am Samstag kommt Jonas.';
  $('endStats').innerHTML = `FUNDE ${story.lore.length}`; ec.querySelector('.next').textContent = 'HIGH ABYSS MIRA · FORTSETZUNG FOLGT';
  const b4 = ec.querySelector('.go4'); if (b4) b4.style.display = 'none';
  const go = ec.querySelector('.go'); go.style.display = ''; go.textContent = 'ZUM TITEL'; go.onclick = e => { e.stopPropagation(); location.reload(); };
  document.exitPointerLock(); ui.overlay = 'endcard'; ec.classList.add('show'); document.body.classList.add('ov'); $('fade').style.opacity = 0;
}
// ---------------------------------------------------------------- Start
function k6_welt(laden) {
  // Kapitel 3 (Ort nach Ende B) und 4 herstellen – chapter3Begin speichert Kapitel 3: beim Weiterspielen den Spielstand nicht überschreiben
  const sg = saveGame; if (laden) saveGame = () => {}; try { if (typeof chapter3Begin === 'function') chapter3Begin(); } finally { saveGame = sg; }
  ch3.met = true; ch3.part = 'town'; ch3.lampsOff = true; ch3.chase = 'done'; if (!ch3.choice) ch3.choice = 'B'; hunt.on = false; grey.visible = false; if (justin && justin.g) justin.g.visible = false;
  state.zone = null; state.ending = false; try { canalAtmo(false); } catch (e) {} Audio.hum(false); Audio.chaseMusic(false); Audio.setArea(false, false);
  lamps.forEach(L => { L.mode = 'on'; L.dead = 0; }); if (typeof anwesen_S !== 'undefined') anwesen_S.ch4 = true;
  if (typeof feuer_items === 'function') feuer_items(); if (ITEMS.feuerzeug && !story.items.includes('feuerzeug')) story.items.push('feuerzeug'); // Peters Feuerzeug (Kapitel 2)
  const kerze = Object.keys(ITEMS).find(k => /kerze/i.test(k)); if (kerze && !story.items.includes(kerze)) story.items.push(kerze); // Mamas Kerze (Kapitel 5, falls vorhanden)
  if (!laden) { FLASH.charge = Math.max(FLASH.charge ?? 1, .9); FLASH.spare = Math.max(FLASH.spare || 0, 1); try { flashApply(); } catch (e) {} }
}
function k6_reset() { K6.beat = 'gitter'; K6.sp.clear(); K6.told.clear(); K6.eaten = false; K6.busSeen = 0; K6.gi = 0; for (const c of K6.krumen) c.gone = false; for (const im of K6.krIM) { K6.krM.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; } }
async function startChapter6() {
  $('subPanel').classList.remove('show'); $('endcard').classList.remove('show'); ui.overlay = null; document.body.classList.remove('ov');
  menu.attract = false; state.started = true; document.body.classList.remove('menu'); $('start').classList.remove('show');
  const laden = typeof KAP !== 'undefined' && KAP.laden;
  k6_welt(laden); K6.on = true; if (typeof wald_S !== 'undefined') wald_S.k6 = true;
  if (!laden || !K6.beat) k6_reset(); else k6_resumeWelt();
  if (typeof kapStart === 'function') kapStart(6); else { setChapter(6); saveFlag('ch6'); if (!laden) saveGame(6); }
  player.pos.set(30, 0, 94); player.yaw = PI; player.pitch = 0; vel.set(0, 0, 0); camY = 1.65; flashOn = true;
  if (typeof hungrige_prep === 'function') hungrige_prep().catch(e => console.warn('Kapitel6: Vorbereitung', e));
  $('fade').style.background = '#000'; $('fade').style.opacity = 1; await wait(300);
  $('intro').innerHTML = K6_INTRO; $('introSeq').classList.add('show'); $('fade').style.opacity = 0;
  $('introSeq').onclick = () => { $('introSeq').classList.remove('show'); $('introSeq').onclick = null; lockPointer();
    if (K6.beat === 'gitter') { k6_obj('Folge dem Jungen in die Dustwoods.'); k6_cp('k6_gitter', 'Das Absperrgitter'); } };
}
// Weiterspielen: Welt passend zum gespeicherten Beat (Gitter offen, gefressene Krumen, der Junge oben)
function k6_resumeWelt() {
  const D = typeof gruen_S !== 'undefined' && gruen_S.dustBarrier; if (D && k6_ab('krumen')) D.setOpen(1);
  for (const c of K6.krumen) if (K6.eaten || c.gone) { c.gone = false; k6_krumeWeg(c); }
  if (K6.beat === 'oben' || K6.beat === 'ende') K6.beat = 'hochsitz'; if (K6.beat === 'epilog') K6.beat = 'hochsitz'; // Whiskey wartet schon oben
  if (k6_ab('epilog')) { k6_boy(true); if (typeof WL !== 'undefined') WL.morgen = true; if (typeof whiskey_S !== 'undefined' && whiskey_S.g) { const TS = TIEF.stand; whiskey_S.fl = null; whiskey_S.mode = 'perch'; whiskey_S.g.visible = true; whiskey_S.g.position.set(TS.x + .95, 4.02, TS.z); } }
}
MOD_SAVE.push(['kapitel6', () => ({ on: K6.on, beat: K6.beat, sp: [...K6.sp], told: [...K6.told], eaten: K6.eaten, gone: K6.krumen.map((c, i) => c.gone ? i : -1).filter(i => i >= 0) }),
  v => { K6.on = false; K6.beat = v.beat || ''; K6.sp = new Set(v.sp || []); K6.told = new Set(v.told || []); K6.eaten = !!v.eaten; (v.gone || []).forEach(i => { if (K6.krumen[i]) K6.krumen[i].gone = true; }); K6.lampDead = false; }]);
if (typeof CH_RESUME !== 'undefined') CH_RESUME.push((d, at) => { if (d.chapter !== 6 || !K6.on) return; if (!at && K6.beat !== 'gitter') { const TS = TIEF.stand; if (k6_ab('epilog')) { player.pos.set(TS.x, 0, TS.z - 4); player.yaw = 0; } } if (d.obj) K6.obj = d.obj; });
// ---------------------------------------------------------------- Takt
WORLD_TICK.push((dt, t) => {
  if (!K6.ready) return; const on = K6.on && state.started && !menu.attract;
  if (K6.grp.visible !== on) K6.grp.visible = on;
  k6_gitter(dt); if (!on) return;
  k6_lighterTick(dt, t); k6_stille(dt);
  K6.saveT -= dt; if (K6.saveT < 0) { K6.saveT = .2; if (!ui.overlay && !state.ending) k6_beats(.2); }
});
window.__k6 = { S: K6, start: () => startChapter6(), set: b => { K6.beat = b; }, epilog: () => k6_epilog(), hochsitz: () => k6_hochsitz(), ende: () => k6_ende(), lampe: () => k6_lampeStirbt(), feuerzeug: on => k6_feuerzeug(on), boy: on => k6_boy(on), D: () => typeof gruen_S !== 'undefined' && gruen_S.dustBarrier, SP: () => typeof SP !== 'undefined' ? SP : null, can: (f, c) => typeof spannung_can === 'function' ? spannung_can(f, c) : null, wh: () => whiskey_S.g, whFl: () => !!whiskey_S.fl }; // Testzugriff
