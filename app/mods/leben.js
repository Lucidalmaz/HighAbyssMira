// =====================================================================  LEBEN (Modul „leben“)
// Tiere, die aufeinander und auf dich reagieren · Fenster, hinter denen jemand wohnt · Wind · ferne Geräusche · Unerklärliches.
// Nur Verhalten und Ereignisse – keine Requisiten. Alles hängt an WORLD_TICK: Zeitgeber statt Dauerschleifen, keine Speicheranforderungen pro Bild.
// Tiere: echte, gerigte Modelle (Krähe, Fuchs, Reh, Wolf, Schwein aus assets/ms/animal_*, Ratten/Fledermäuse/Fliegen/Spinnen aus den Fab-Assets). Die selbstgebauten Krähen des Spiels sind nur noch unsichtbares Gerüst.
const leben_S = { ok: false, ready: false, zone: 'off', frame: 0, root: null, skc: null, crows: [], perches: [], wireOk: true, rats: [], spots: {}, trash: [], bats: [], hunt: null, eaten: [],
  flies: null, swarms: [], buzz: null, moths: null, fm: null, rooms: [], shadow: null, tvVoice: null, webs: [], spSrc: null, drop: null, turn: null, swingHold: null,
  T: { hunt: 14, win: 30, sh: 25, far: 40, chase: 50, knockChk: 0, look: 0, gate: 0, react: 0, tvv: 0, rat8: 0 }, prev: {}, far: { car: null, cd: {} }, clk: { min: -1 }, wx: { T: 200, on: false, k: 0, at: 0, was: false, fogBase: 0 },
  look8: 0, hook8: 0, seen8Away: false, cowDone: false, pathBudget: 0 };
const leben_V = [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector3());
const leben_M4 = new THREE.Matrix4(), leben_Q = new THREE.Quaternion(), leben_E = new THREE.Euler(), leben_ONE = new THREE.Vector3(1, 1, 1);
const leben_ray = new THREE.Ray(), leben_tgt = { point: new THREE.Vector3(), distance: 0, faceIndex: 0 };
const leben_CHAPEL = { x: -55, y: 14, z: 82 }, leben_PLAY = { x: 31, z: 72 };

// ---------------------------------------------------------------- Hilfen
function leben_quiet() { return !state.started || state.talking || !!ui.overlay || state.scaring || state.blackout || state.ending || menu.attract; }
function leben_zone() { if (state.inBasement || state.zone === 'canal') return 'off'; if (ch3.on && ch3.part !== 'town') return 'off'; return 'town'; }
function leben_region(x, z) { return z > 33 ? 'nord' : x > 80 ? 'ost' : x < -80 ? 'west' : 'ort'; }
function leben_facing(x, y, z) { const v = leben_V[5].set(x - camera.position.x, y - camera.position.y, z - camera.position.z); const l = v.length() || 1; return (v.x * fwd.x + v.y * fwd.y + v.z * fwd.z) / l; }
function leben_inHouse(x, z, m = .4) { for (const r of indoorRects) if (x > r.x0 - m && x < r.x1 + m && z > r.zb - m && z < r.zf + m) return r; return null; }
const leben_ang = (a, b, k) => { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * k; };
// Höchster fester Punkt unter (x, yTop, z) – echte Form (BVH), nicht die Kiste. Für Sitzplätze (Firste, Äste, Masten)
function leben_probe(x, z, yTop, yMin, nMin = .4) {
  let best = -Infinity; const list = solidNear(x, z);
  for (let i = 0; i < list.length; i++) { const it = list[i], bb = it.bb;
    if (x < bb.min.x || x > bb.max.x || z < bb.min.z || z > bb.max.z || bb.min.y > yTop || bb.max.y < yMin || it.soft || !solidLive(it)) continue;
    leben_ray.origin.set(x, yTop, z).applyMatrix4(it.inv); leben_ray.direction.set(0, -1, 0).transformDirection(it.inv);
    const h = it.o.geometry.boundsTree.raycastFirst(leben_ray, THREE.DoubleSide); if (!h) continue;
    const p = leben_V[0].copy(h.point).applyMatrix4(it.mw); if (p.y < yMin || p.y > yTop || p.y <= best) continue;
    if (Math.abs(leben_V[1].copy(h.face.normal).transformDirection(it.mw).y) < nMin) continue;
    best = p.y; }
  return best;
}
// Frei für ein kleines Tier? (fester Körper im Umkreis r in Höhe y; Zäune/Hecken lassen Ratten durch)
function leben_free(x, z, y, r) {
  const list = solidNear(x, z);
  for (let i = 0; i < list.length; i++) { const it = list[i], bb = it.bb;
    if (x + r < bb.min.x || x - r > bb.max.x || z + r < bb.min.z || z - r > bb.max.z || y + r < bb.min.y || y - r > bb.max.y || it.soft || !solidLive(it)) continue;
    leben_V[0].set(x, y, z).applyMatrix4(it.inv);
    const h = it.o.geometry.boundsTree.closestPointToPoint(leben_V[0], leben_tgt, 0, r / it.sc); if (!h) continue;
    if (leben_V[1].copy(h.point).applyMatrix4(it.mw).distanceTo(leben_V[2].set(x, y, z)) < r) return false; }
  for (let i = 0; i < colliders.length; i++) { const c = colliders[i]; if (c.minX < -5000 || c.top < 1.6) continue; if (x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ && c.base < y + r && c.top > y) return false; }
  return true;
}
// Nutzer 02.10.: „Tiere und Agenten sollen nicht gegen Steine, Bäume, Wände laufen.“ Gemeinsames Ausweichen: alle 0,25 s ein Fühler voraus (Körperhöhe y, Breite r);
// ist er zu, die nächste freie Richtung (±0,45 … ±1,6 rad, die zum Ziel nähere zuerst) für 0,8 s halten. Rückgabe: Kurs (Gierwinkel), den die Figur jetzt nehmen soll.
function leben_umweg(V, x, z, yw, { r = .32, y = .5, vor = 1.1 } = {}) {
  const U = V.umweg || (V.umweg = { bis: 0, a: 0, ab: 0, chk: 0 }), now = performance.now() / 1000;
  if (now < U.bis) return U.a;
  if (now < U.chk) return yw; U.chk = now + .25;
  if (leben_free(x + Math.sin(yw) * vor, z + Math.cos(yw) * vor, y, r)) return yw;
  for (const o of [.45, -.45, .9, -.9, 1.6, -1.6]) { const a = yw + o * (U.ab || 1); if (leben_free(x + Math.sin(a) * vor, z + Math.cos(a) * vor, y, r) && leben_free(x + Math.sin(a) * vor * .5, z + Math.cos(a) * vor * .5, y, r)) { U.a = a; U.bis = now + .8; U.ab = Math.sign(o) || 1; return a; } }
  return yw; }
function leben_path(x0, z0, x1, z1) { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / .4); for (let i = 1; i <= n; i++) { const k = i / n; if (!leben_free(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, .1, .1)) return false; } return true; }

// ---------------------------------------------------------------- Klänge (vorhandene Audio-Bausteine)
function leben_squeak(x, y, z, n = 3, v = .05) { // Ratte: kein Sinus-Pfeifen mehr – Krallen auf Holz/Stein (Aufnahmen), kurz und leise
  if (!Audio.ctx || !Audio.started) return;
  for (let i = 0; i < n; i++) Audio.play(Audio.pick('scrape1', 'scrape2', 'scrape3', 'scrape4'), { gain: v * rand(.5, .8), rate: rand(2.2, 2.8), hp: 1400, dur: .2, delay: i * rand(.08, .2), x, y, z, ref: 1.5 });
}
function leben_click() {} // Fledermaus: im November kaum da, die Klicks lagen an der Hörgrenze – ersatzlos still
function leben_hiss(x, y, z) { // Katze im Dunkeln: Fauchen
  if (!Audio.ctx || !Audio.started) return; if (Audio.katze && Audio.katze('fauch', x, y, z)) return; // echte Aufnahme (klang.js) const ctx = Audio.ctx, d = Audio.at(x, y, z, 2.5), n = Audio.noise(false), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(3000, 4200); bp.Q.value = .9;
  n.connect(bp); Audio.env(bp, .22, .035, .55, 0, d); n.stop(ctx.currentTime + 1.2);
}
function leben_bellStrike(amp, damp) { // Kapellenglocke: aufgenommene Röhrenglocke (VSCO, CC0), auf g gestimmt, mit tiefem Summton darunter; gedämpft = kurz abgefangen
  if (!Audio.ctx || !Audio.started) return; const ctx = Audio.ctx, C = leben_CHAPEL; const dest = Audio.at(C.x, C.y, C.z, 34); if (Audio.cut) return; // drinnen: dumpf durch die Wand (Audio.at)
  if (Audio.buf.kb_glocke_A4) { Audio.play('kb_glocke_A4', { gain: amp * 1.1, rate: 392 / 440 * rand(.998, 1.002), dur: damp ? .8 : undefined, dest });
    const o = Audio.osc('sine', 98, 0, damp ? 1 : 8), g = Audio.env(o, amp * .12, .02, damp ? .6 : 7, 0, dest); return; }
  const f = 196;
  for (const [m, a, dc] of [[.5, .42, 9], [1, .5, 7], [1.19, .3, 5.5], [1.5, .2, 3.8], [2, .42, 4.5], [2.51, .14, 2.4], [3.01, .09, 1.7], [4.03, .05, 1.1]])
    for (const det of [-.21, .23]) { const len = damp ? .7 : dc; const o = Audio.osc('sine', f * m + det * m, 0, len + .3); Audio.env(o, amp * a * .5, .003, damp ? len * .6 : dc, 0, dest); }
  const n = Audio.noise(false), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.3; n.connect(bp); Audio.env(bp, amp * .22, .002, .07, 0, dest); n.stop(ctx.currentTime + .4);
}
function leben_hush(sec) { // plötzliche Stille: die Regie hält alle Geräusch-Planer an, Regen und Wind sinken auf 0,2
  if (!Audio.ctx) return; if (typeof spannung_hush === 'function') return spannung_hush(sec);
  if (!Audio.crickets) return; const t = Audio.ctx.currentTime;
  Audio.crickets.gain.cancelScheduledValues(t); Audio.crickets.gain.setTargetAtTime(0, t, .06);
  Audio.wind.gain.cancelScheduledValues(t); Audio.wind.gain.setTargetAtTime(Audio.area === 'o' ? .1 : .03, t, .25);
  setTimeout(() => { try { Audio.setArea(isIndoor(), state.inBasement); } catch (e) {} }, sec * 1000);
}
function leben_shutter(x, z) { if (!Audio.ctx) return; Audio.bang(x, z, rand(.25, .4)); setTimeout(() => Audio.bang(x, z, rand(.1, .18)), rand(260, 420)); }

// ---------------------------------------------------------------- Aufbau
WORLD_MODS.push(['Leben', async () => {
  const S = leben_S;
  S.root = new THREE.Group(); S.root.userData.noCol = true; scene.add(S.root);
  try { S.skc = (await import('three/addons/utils/SkeletonUtils.js')).clone; } catch (e) { console.warn('leben: SkeletonUtils', e); }
  if (S.skc) await leben_loadModels();
  try { leben_crowSetup(); } catch (e) { console.warn('leben: Krähen', e); }
  if (FAB.ok && S.skc) { try { leben_ratSetup(); } catch (e) { console.warn('leben: Ratten', e); } try { for (const R of FAB.rats || []) leben_variiere(R.g.children[0], { gr: .12, hell: [.62, 1.18], warm: .1 }); for (const b of FAB.bats || []) leben_variiere(b.g.children[0], { hell: [.75, 1.1] }); } catch (e) {} try { leben_batSetup(); } catch (e) { console.warn('leben: Fledermäuse', e); } }
  if (S.skc) try { leben_beastSetup(); } catch (e) { console.warn('leben: Säugetiere', e); }
  try { leben_flySetup(); } catch (e) { console.warn('leben: Fliegen', e); }
  try { leben_mothSetup(); } catch (e) { console.warn('leben: Motten', e); }
  try { await leben_findModels(); } catch (e) { console.warn('leben: Modelle anderer Module', e); }
  try { await leben_spiderSetup(); } catch (e) { console.warn('leben: Spinnen', e); }
  leben_shadowSetup();
  // Krähenschwarm: bricht aus einer Baumkrone 10–22 m vor dir und zieht dicht über deinen Kopf hinweg (echtes Krähenmodell)
  flock.forEach(c => leben_reg(c.g, 'Krähenschwarm', .6));
  crowFlock = function () {
    const P = player.pos, f = flatDir();
    const cands = treeSpots.filter(([x, z]) => { const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz); return d > 10 && d < 22 && (dx * f.x + dz * f.z) / d > .25; });
    if (!cands.length) return false;
    const [tx, tz, ts] = cands[Math.floor(Math.random() * cands.length)];
    flock.forEach((c, i) => { c.g.position.set(tx + rand(-1.5, 1.5), rand(5.8, 7.4) * ts, tz + rand(-1.5, 1.5));
      c.vel.set(P.x + rand(-3, 3), rand(3.3, 4.8), P.z + rand(-3, 3)).sub(c.g.position).normalize().multiplyScalar(rand(9, 12.5)); c.on = true; c.delay = i * rand(.03, .09); });
    Audio.flap(tx, 6, tz); Audio.flap(tx + 1, 5, tz - 1);
    for (let i = 0; i < 4; i++) setTimeout(() => Audio.at(Math.random() < .7 ? 'crow1' : 'crow2', flock[i % flock.length].g, { gain: .6, vary: .12, ref: 4 }), 80 + i * rand(120, 260));
    setTimeout(() => { shake = Math.max(shake, .02); }, 650);
    leben_crowScare(tx, tz, 24); return true; };
  window.__leben = leben_debug();
  S.ok = true;
}]);
WORLD_TICK.push((dt, t, indoor) => { if (leben_S.ok) leben_tick(dt, t, indoor); });

// Echte Tiere (Unreal ANIMAL VARIETY PACK, assets/ms/animal_*): laden, Texturen auf 1024² verkleinern (2048² × 3 je Tier wäre zu viel Grafikspeicher)
function leben_shrink(root, px) { const done = new Set(); root.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap']) {
    const t = m[k]; if (!t || !t.image || t.isCompressedTexture || done.has(t)) continue; done.add(t); const im = t.image, w = im.width, h = im.height; if (!w || !h || Math.max(w, h) <= px) continue; // komprimierte (KTX2) sind schon klein genug
    const c = document.createElement('canvas'), f = px / Math.max(w, h); c.width = Math.round(w * f); c.height = Math.round(h * f); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); t.image = c; t.needsUpdate = true; } }); }
// Jedes Tier ein Individuum (08.10.2026, Nutzer: „kein Tier genau gleich“): Materialklon je Tier (gleiches Shaderprogramm – nur der Farbwert
// unterscheidet sich, keine neuen Programme), Helligkeit/Wärme leicht verschieden, Größe ±8 %. o: { gr, hell: [min, max], warm, ton: THREE.Color }
function leben_variiere(root, o = {}) { if (!root) return root; const gr = o.gr != null ? o.gr : .08; if (gr) root.scale.multiplyScalar(1 + rand(-gr, gr));
  const h = o.hell || [.84, 1.12], L = rand(h[0], h[1]), w = rand(-1, 1) * (o.warm != null ? o.warm : .05), col = new THREE.Color(L * (1 + w), L * (1 + w * .2), L * (1 - w));
  if (o.ton) col.multiply(o.ton); const done = new Map();
  root.traverse(m => { if (!m.isMesh || !m.material) return; const one = src => { if (done.has(src)) return done.get(src); if (!src.color) return src;
      const c = src.clone(); c.color.multiply(col); if (src.onBeforeCompile) c.onBeforeCompile = src.onBeforeCompile; if (src.customProgramCacheKey) c.customProgramCacheKey = src.customProgramCacheKey; done.set(src, c); return c; };
    m.material = Array.isArray(m.material) ? m.material.map(one) : one(m.material); });
  return root; }
async function leben_loadModels() {
  const S = leben_S; S.M = {};
  const load = async (k, key, alt, ganz) => { try { let sc; try { sc = await msModel(key, 'model.glb'); } catch (e) { if (!alt) throw e; console.warn('leben: ' + key + ' fehlt – ' + alt, e); sc = await msModel(alt, 'model.glb'); } if (!ganz) leben_shrink(sc, 1024); S.M[k] = { src: sc, clips: sc.animations || [] }; } catch (e) { console.warn('leben: Modell ' + key, e); } };
  // 08.10.: Krähen = eigene Rabenkrähe (rabe_kraehe, 4–8 k Dreiecke, gleiches Skelett/Clips wie animal_crow); „rabe“ = Whiskeys Modell (für die zwei Raben am Bau, nicht verkleinert – Textur teilt er mit Whiskey)
  await Promise.all([load('crow', 'rabe_kraehe', 'animal_crow'), load('rabe', 'rabe_whiskey', null, true), load('fox', 'animal_fox'), load('deer', 'animal_deerdoe'), load('wolf', 'animal_wolf'), load('pig', 'animal_pig')]);
}
// Modelle der anderen Module finden (Mülltonnen, Müllsäcke, tote Bäume) – nur, wenn sie wirklich geladen wurden
async function leben_findModels() {
  const S = leben_S, mats = async key => { const k = key + '/model.gltf'; if (!MSL.cache.has(k)) return null; const sc = await msModel(key); const set = new Set(); sc.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => set.add(m)); }); return set; };
  const trashMats = new Set(); for (const k of ['trashcan', 'trashbag']) { const s = await mats(k); if (s) s.forEach(m => trashMats.add(m)); }
  S.treeMats = new Set(); for (const im of MS.trees) S.treeMats.add(im.material); for (const k of ['deadtree1', 'deadtree3']) { const s = await mats(k); if (s) s.forEach(m => S.treeMats.add(m)); }
  if (!trashMats.size) return;
  scene.updateMatrixWorld(true); const bb = new THREE.Box3();
  scene.traverse(o => { if (!o.isMesh || !trashMats.has(o.material) || !o.visible) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const put = mw => { bb.copy(o.geometry.boundingBox).applyMatrix4(mw); const x = (bb.min.x + bb.max.x) / 2, z = (bb.min.z + bb.max.z) / 2;
      if (S.trash.some(p => Math.hypot(p.x - x, p.z - z) < .9)) return; if (S.trash.length < 24) S.trash.push({ x, z, y: bb.max.y }); };
    if (o.isInstancedMesh) { for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, leben_M4); put(leben_M4.premultiply(o.matrixWorld)); } } else put(o.matrixWorld); });
}

// ---------------------------------------------------------------- Bereit (erstes Bild nach dem Kollisionsaufbau: echte Formen stehen)
function leben_ready() {
  const S = leben_S; S.ready = true; const t0 = performance.now(); S.prof = { acc: 0, n: 0, max: 0 };
  try { leben_perchInit(); } catch (e) { console.warn('leben: Sitzplätze', e); } S.prof.perch = Math.round(performance.now() - t0);
  try { leben_ratSpots(); } catch (e) { console.warn('leben: Rattenwege', e); } S.prof.spots = Math.round(performance.now() - t0);
  try { leben_beastReady(); } catch (e) { console.warn('leben: Säugetiere', e); }
  try { leben_winInit(); } catch (e) { console.warn('leben: Fenster', e); }
  try { leben_webPlace(); } catch (e) { console.warn('leben: Spinnennetze', e); }
  try { for (const p of S.trash.slice(0, 10)) leben_swarm(p.x, p.y + .22, p.z, 4, .35, [new THREE.Vector3(p.x + .08, p.y + .005, p.z - .05), new THREE.Vector3(p.x - .1, p.y + .005, p.z + .06)], true); } catch (e) { console.warn('leben: Fliegen an Tonnen', e); }
  try { for (const d of S.moths.data) if (d.pl) d.pl.light.getWorldPosition(d.P); } catch (e) {}
  S.wx.fogBase = fogUniforms.strength.value; S.prof.ready = Math.round(performance.now() - t0);
}

// =====================================================================  KRÄHEN (echtes, gerigtes Modell „animal_crow“: 17 Animationen)
// Die Krähen des Spiels (makeCrow, Kugeln und Kisten) bleiben als unsichtbares Gerüst – ihr Flug- und Sitzverhalten lenkt jetzt das echte Modell.
function leben_anims(mx, clips) { const A = {}; for (const c of clips) { if (/_RM$/.test(c.name)) continue; A[c.name.replace(/^ANIM_[A-Za-z]+_/, '')] = mx.clipAction(c); } return A; }
function leben_play(V, k, fade = .25, ts = 1, once = false) { const a = V.A[k]; if (!a) return; a.timeScale = ts; if (a === V.cur) return;
  a.reset(); if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else a.setLoop(THREE.LoopRepeat, Infinity); a.fadeIn(fade).play(); if (V.cur) V.cur.fadeOut(fade); V.cur = a; }
function leben_crowVis(g, yOff) {
  const S = leben_S, C = S.M.crow; if (!C) return null;
  for (const ch of g.children) ch.visible = false; // selbstgebaute Kugeln/Kisten aus
  const m = S.skc(C.src); m.rotation.y = PI / 2; m.position.y = yOff; const rabe = Math.random() < .15; m.scale.setScalar(1.1 * (rabe ? 1.22 : 1)); m.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } }); g.add(m);
  leben_variiere(m, rabe ? { hell: [.68, .8], warm: .02 } : { hell: [.85, 1.15], warm: .06 }); // 08.10.: Gefieder je Vogel, Kolkraben größer/dunkler
  const mx = new THREE.AnimationMixer(m), V = { m, mx, A: leben_anims(mx, C.clips), cur: null, next: rand(2, 7), mode: '', skip: false };
  leben_play(V, 'IdleLookAround', 0); mx.update(rand(0, 3)); return V;
}
function leben_crowSetup() {
  const S = leben_S, C = S.M.crow;
  const calm = c => { c.g.userData.noCol = true; c.g.traverse(m => { if (m.isMesh) m.castShadow = false; }); };
  flock.forEach(c => { calm(c); if (C) c.V = leben_crowVis(c.g, -.12); });
  // Die acht Krähen sitzen auf dem mittleren Draht über der Kreuzung – im gleichen Abstand, wie abgezählt. // STORY-HOOK: acht Kinder / immer acht
  const span = wireSpots.find(([a, , c]) => Math.abs(a.x) < .5 && Math.abs(c.x - 19) < .5 && Math.abs(a.z - 7.6) < .05) || wireSpots[Math.floor(wireSpots.length / 2)];
  crows.forEach((c, i) => { calm(c); const k = (i + 1) / (crows.length + 1), [a, m, e] = span;
    const p = new THREE.Vector3().copy(a).multiplyScalar((1 - k) ** 2).addScaledVector(m, 2 * k * (1 - k)).addScaledVector(e, k * k); p.y += .1;
    c.g.position.copy(p); c.g.rotation.set(0, rand(1.2, 1.9) * (i % 2 ? 1 : -1), 0);
    S.crows.push({ c, V: C ? leben_crowVis(c.g, -.087) : null, base: true, slot: p, st: 'base', t: 0, take: 0, pf: false, L: null, perch: null }); if (C) leben_reg(c.g, 'Krähe(Mast)', 1); });
  if (!C) return;
  // Weitere Krähen: Dächer, Schornsteine, Masten, Baumkronen, Wiesen und Straßen – auch Kirchberg, Landstraße, Höfe
  for (const reg of ['ort', 'ort', 'ort', 'ort', 'ort', 'ort', 'nord', 'nord', 'nord', 'ost', 'ost', 'west', 'west', 'west']) {
    const g = new THREE.Group(); g.visible = false; g.userData.noCol = true; S.root.add(g);
    S.crows.push({ c: { g, wings: [], fly: false, gone: true, vel: new THREE.Vector3() }, V: leben_crowVis(g, 0), base: false, reg, st: 'away', t: rand(1, 25), take: 0, perch: null, L: null, C: null, hopT: 0, hx: 0, hz: 0 }); leben_reg(g, 'Krähe', 1); }
}
function leben_reg(g, name, r) { try { auftritt_reg(g, { name, r: r || 1 }); } catch (e) { console.warn('Leben: Auftritt', e); } return g; } // 08.10.: weiche Sichtbarkeit (auftritt.js)
function leben_perchInit() {
  const S = leben_S, out = S.perches, add = (x, y, z, kind, grp) => { const p = { x, y, z, kind, reg: leben_region(x, z), used: null, grp }; out.push(p); return p; };
  // Draht sichtbar? (Das Straßen-Modul darf die Leitungen ersetzen – dann sitzen die acht woanders)
  let wire = null; scene.traverse(o => { if (!wire && o.isMesh && !o.isInstancedMesh && o.material === M.dark) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; if (b.max.x - b.min.x > 100 && b.min.y > 6.5 && b.max.y < 9) wire = o; } });
  let vis = !!wire; for (let p = wire; p; p = p.parent) if (!p.visible) vis = false; S.wireOk = vis;
  // Mastquerträger: echte Form, wenn die Masten einzeln sind (Straßen-Modul); sonst die Querträger des Spiels (y 7,96), solange sie sichtbar sind
  let poles = null; scene.traverse(o => { if (!poles && o.isMesh && !o.isInstancedMesh && o.material === M.wood) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; if (b.max.x - b.min.x > 100 && b.max.y > 8 && b.max.y < 9) poles = o; } });
  let pv = !!poles; for (let p = poles; p; p = p.parent) if (!p.visible) pv = false;
  for (const [x, z] of poleSpots) for (const o of [-.45, .45]) { let y = leben_probe(x, z + o, 9.8, 6, .5); if (!(y > 6) && pv) y = 7.96; if (y > 6) add(x, y, z + o, 'mast'); }
  const v = leben_V[3];
  for (const { g, o } of HOUSES) { if (!g.visible) continue; const H = o.H ?? 6, rh = o.rh ?? 2.6, d = o.d ?? 9, w = o.w ?? 11; g.updateMatrixWorld(true);
    for (const dz of [-d * .32, d * .05, d * .3]) { g.localToWorld(v.set(0, 0, dz)); const y = leben_probe(v.x, v.z, H + rh + 1.6, H + rh - 1.2, .25); if (y > 3) add(v.x, y, v.z, 'dach'); }
    if (o.chimney) { g.localToWorld(v.set(w * .28, 0, -d * .2)); const y = leben_probe(v.x, v.z, H + 5.5, H + 2, .6); if (y > 3) add(v.x, y, v.z, 'schornstein'); } }
  // Tote Bäume (gescannt; auch die der anderen Module): Äste in der Krone
  const trees = S.treePts = []; scene.traverse(o => { if (o.isInstancedMesh && S.treeMats && S.treeMats.has(o.material) && o.visible) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const hTop = o.geometry.boundingBox.max.y;
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, leben_M4); leben_M4.premultiply(o.matrixWorld); leben_M4.decompose(leben_V[0], leben_Q, leben_V[1]); trees.push([leben_V[0].x, leben_V[0].z, hTop * leben_V[1].y, leben_V[1].x]); } } });
  const tl = trees.slice(); for (let i = tl.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [tl[i], tl[j]] = [tl[j], tl[i]]; }
  let nt = 0;
  for (const [x, z, h, s] of tl) { if (nt >= 70) break; if (Math.abs(x) > 175 || z < -70 || z > 115) continue; let got = 0;
    for (let k = 0; k < 12 && got < 2; k++) { const a = rand(0, 6.28), r = rand(.4, 2.2) * s, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; const y = leben_probe(px, pz, h * .96, h * .5, .3);
      if (y > 3.2) { add(px, y, pz, 'baum'); got++; } }
    if (got) nt++; }
  // Boden: Rasen, Straße, Feld – Krähen landen in Gruppen, picken, hüpfen
  const fields = { ort: [[-74, 74, -29, 29, 18]], nord: [[-78, 58, 36, 93, 8]], ost: [[82, 150, -38, 33, 7]], west: [[-150, -82, -48, 43, 8]] };
  for (const reg in fields) for (const [x0, x1, z0, z1, n] of fields[reg]) { let made = 0;
    for (let k = 0; k < 160 && made < n; k++) { const x = rand(x0, x1), z = rand(z0, z1); if (leben_inHouse(x, z, 1) || !leben_free(x, z, .25, 1.3)) continue;
      const grp = { x, z, n: 0 }; let pts = 0;
      for (let j = 0; j < 4; j++) { const a = j * 1.57 + rand(-.4, .4), r = j ? rand(.7, 1.6) : 0, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (j && !leben_free(px, pz, .2, .25)) continue;
        const sg = solidGround(px, .3, pz); add(px, sg > -1 ? Math.max(0, sg) : 0, pz, 'boden', grp); pts++; }
      if (pts >= 2) made++; } }
  // Die acht: ohne Draht → auf Mastquerträger und Firste
  if (!S.wireOk) for (const W of S.crows) if (W.base) { W.slot = null; if (!W.c.fly) { W.c.gone = true; W.c.g.visible = false; W.st = 'away'; W.t = rand(1, 12); } }
}
function leben_perched(W) { return W.base ? (W.st === 'base' && !W.c.fly && !W.c.gone) : W.st === 'perch'; }
function leben_crowScare(x, z, r) { for (const W of leben_S.crows) if (leben_perched(W) && !(W.take > 0)) { const p = W.c.g.position; if (Math.hypot(p.x - x, p.z - z) < r) W.take = rand(.1, .9); } }
function leben_crowChain(W) { const p = W.c.g.position; for (const o of leben_S.crows) if (o !== W && leben_perched(o) && !(o.take > 0)) { const q = o.c.g.position; if (Math.hypot(q.x - p.x, q.z - p.z) < 8.5) o.take = rand(.12, .75); } }
function leben_crowOff(W, fx, fz) {
  const c = W.c, g = c.g, p = g.position, dx = p.x - fx, dz = p.z - fz, d = Math.hypot(dx, dz) || 1;
  c.fly = true; c.vel.set(dx / d * rand(4.5, 6) + rand(-1, 1), rand(3.2, 4.4), dz / d * rand(4.5, 6) + rand(-1, 1)); g.rotation.z = 0;
  if (!W.base) { W.st = 'fly'; if (W.perch) { if (W.perch.grp) W.perch.grp.n = Math.max(0, W.perch.grp.n - 1); W.perch.used = null; W.perch = null; } } else W.pf = true;
  if (W.V) { W.V.mode = 'take'; W.V.tt = .55; leben_play(W.V, 'TakeOff', .08, 1.3, true); }
  W.take = 0; if (Math.random() < .55) Audio.at(Math.random() < .7 ? 'crow1' : 'crow2', g, { gain: .6, vary: .12, ref: 4 }); Audio.flap(p.x, p.y, p.z);
  leben_crowChain(W);
}
function leben_crowLandAt(W, px, py, pz, here) {
  const P = player.pos, g = W.c.g; let ax = px - P.x, az = pz - P.z; const d = Math.hypot(ax, az) || 1; ax /= d; az /= d;
  const sd = rand(-.7, .7), L = W.L || (W.L = {});
  if (here) { L.sx = g.position.x; L.sy = g.position.y; L.sz = g.position.z; L.cx = px + (L.sx - px) * .35; L.cy = py + 3; L.cz = pz + (L.sz - pz) * .35; L.dur = rand(3.5, 4.5); } // aus dem Kreisen direkt hinunter
  else { L.sx = px + (ax - sd * az) * 62; L.sy = py + rand(12, 20); L.sz = pz + (az + sd * ax) * 62; L.cx = px + ax * 8; L.cy = py + 4; L.cz = pz + az * 8; L.dur = rand(7, 9); } // 08.10.: Anflug aus 62 m (jenseits des Nebels), nicht erst aus 42 m
  L.px = px; L.py = py; L.pz = pz; L.t = 0; L.fl = 0;
  W.st = 'land'; g.visible = true; g.position.set(L.sx, L.sy, L.sz); if (W.V) { W.V.mode = 'glide'; leben_play(W.V, 'Glide', .1); }
}
function leben_crowReturn(W) {
  const S = leben_S, P = player.pos;
  if (W.base && W.slot) { const s = W.slot; if (Math.hypot(s.x - P.x, s.z - P.z) < 22) { W.t = 8; return; } leben_crowLandAt(W, s.x, s.y, s.z); return; }
  let best = null, bs = -1;
  for (const p of S.perches) { if (p.used || (W.base && p.kind === 'boden')) continue; const d = Math.hypot(p.x - P.x, p.z - P.z); if (d < (p.kind === 'boden' ? 30 : 24) || d > 95) continue;
    const s = Math.random() + (p.reg === W.reg ? 1.2 : 0) + (d < 70 ? .5 : 0) + (W.base && p.kind === 'mast' ? 1.5 : 0) + (p.grp && p.grp.n > 0 && p.grp.n < 3 ? 1.4 : 0); if (s > bs) { bs = s; best = p; } }
  if (!best) { W.t = 12; return; }
  best.used = W; W.perch = best; if (best.grp) best.grp.n++; leben_crowLandAt(W, best.x, best.y, best.z);
}
function leben_crowLand(W, dt) {
  const L = W.L, c = W.c, g = c.g, V = W.V; L.t += dt; const k = Math.min(1, L.t / L.dur), e = 1 - (1 - k) * (1 - k), u = 1 - e;
  g.position.set(u * u * L.sx + 2 * u * e * L.cx + e * e * L.px, u * u * L.sy + 2 * u * e * L.cy + e * e * L.py, u * u * L.sz + 2 * u * e * L.cz + e * e * L.pz);
  const tx = u * (L.cx - L.sx) + e * (L.px - L.cx), ty = u * (L.cy - L.sy) + e * (L.py - L.cy), tz = u * (L.cz - L.sz) + e * (L.pz - L.cz);
  if (k < .97) g.rotation.y = Math.atan2(-tz, tx); g.rotation.z = Math.atan2(ty, Math.hypot(tx, tz)) * .45 * (1 - k);
  if (V) { const rest = L.dur - L.t; // gleiten, zwischendurch schlagen, zum Schluss abfangen und landen
    if (rest < .6) { if (V.mode !== 'land') { V.mode = 'land'; leben_play(V, 'Landing', .12, 1, true); } }
    else { L.fl -= dt; if (L.fl < -rand(1.5, 3)) L.fl = rand(.6, 1.2); const want = L.fl > 0 || k > .8 ? 'Fly' : 'Glide'; if (V.cur !== V.A[want]) leben_play(V, want, .3); } }
  if (k >= 1) { g.rotation.z = 0; g.position.set(L.px, L.py, L.pz); if (V) { V.mode = ''; V.next = rand(.8, 2); }
    if (W.base) { c.fly = false; c.gone = false; W.st = 'base'; W.pf = false; if (W.slot) leben_S.seen8Away = true; } else { W.st = 'perch'; W.hx = L.px; W.hz = L.pz; }
    if (Math.hypot(L.px - player.pos.x, L.pz - player.pos.z) < 40) Audio.flap(L.px, L.py, L.pz); }
}
// Animation je nach Zustand (nur, wenn nah genug und sichtbar)
function leben_crowAnimTick(W, dt, flying, ground) {
  const V = W.V; if (!V) return; const g = W.c.g; if (!g.visible) return;
  const cam = camera.position, dx = g.position.x - cam.x, dz = g.position.z - cam.z, d2 = dx * dx + dz * dz; if (d2 > 75 * 75) return;
  if (V.mode === 'take') { V.tt -= dt; if (V.tt < 0) { V.mode = 'fly'; leben_play(V, 'Fly', .2); } }
  else if (flying) { if (V.mode !== 'fly' && V.mode !== 'glide' && V.mode !== 'land') { V.mode = 'fly'; leben_play(V, 'Fly', .2); } }
  else if (V.mode !== 'land') { V.next -= dt; if (V.next < 0) { const r = Math.random();
      if (ground) { if (r < .45) { leben_play(V, 'EatSomething', .2); V.next = rand(2, 5); } else if (r < .72) { leben_play(V, 'IdleLookAround', .25); V.next = rand(2, 4); } else if (r < .9) { V.hop = .5; leben_play(V, 'Hop', .1, 1.2); V.next = .55; } else { leben_play(V, 'IdleScratchWing', .25); V.next = rand(2, 3.5); } }
      else { if (r < .1 && V.A.Caw && d2 < 60 * 60) { leben_play(V, 'Caw', .15, rand(.9, 1.15), true); V.next = 1.8; Audio.at(Math.random() < .7 ? 'crow1' : 'crow2', g, { gain: .5, vary: .12, ref: 4 }); } // 08.10.: Krächzen mit Verbeugung und offenem Schnabel (Clip „Caw“)
        else if (r < .66) { leben_play(V, 'IdleLookAround', .3); V.next = rand(3, 8); } else if (r < .86) { leben_play(V, 'IdleScratchWing', .3); V.next = rand(2.5, 4); } else { leben_play(V, 'IdleStretchWings', .3); V.next = rand(2.5, 4); } } }
  }
  if (V.mode === 'land' && V.cur && !V.cur.isRunning()) { V.mode = ''; leben_play(V, 'IdleLookAround', .3); }
  V.skip = !V.skip; if (d2 < 45 * 45) V.mx.update(dt); else if (V.skip) V.mx.update(dt * 2);
}
function leben_crowTick(dt, t, indoor, c1, c3, live) {
  const S = leben_S, P = player.pos, spd = Math.hypot(vel.x, vel.z), town = S.zone === 'town';
  if (c3 && dir.crowT < 2) dir.crowT = 2; // Kapitel 3: die Krähen schweigen
  if (state.started && !S.prev.started) for (const W of S.crows) if (W.base && W.slot) { // Spielbeginn: die acht sitzen wieder (die Menükamera hat sie vielleicht verscheucht)
    const c = W.c; c.fly = false; c.gone = false; c.g.visible = true; c.g.position.copy(W.slot); c.g.rotation.set(0, rand(1.2, 1.9) * (Math.random() < .5 ? 1 : -1), 0); W.st = 'base'; W.pf = false; W.take = 0; if (W.V) { W.V.mode = ''; leben_play(W.V, 'IdleLookAround', 0); } }
  S.prev.started = state.started;
  // Kapitel 3: über der Kuh kreisen Krähen – und landen, sobald du weit genug weg bist, um an ihr zu picken
  if (c3 && !S.cowCircle && cowFx.done && cowFx.t >= 1 && ch3.part === 'town' && !ch3.lampsOff) { S.cowCircle = true; let n = 0;
    const cx = cowFx.g.position.x, cz = cowFx.g.position.z; S.cowPts = [];
    for (let j = 0; j < 5; j++) { const a = j / 5 * 6.283 + rand(-.3, .3), r = rand(1.1, 1.7), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; S.cowPts.push({ x, y: 0, z, kind: 'kuh', reg: 'ort', used: null, face: [cx, cz] }); }
    for (const W of S.crows) { if (W.base || n >= 4 || W.st === 'land') continue; if (W.perch) { W.perch.used = null; W.perch = null; }
      W.st = 'circle'; W.cow = true; W.C = { a: rand(0, 6.28), r: rand(6, 13), h: rand(16, 25), w: rand(.22, .38) * (n % 2 ? -1 : 1), fl: 0 }; W.c.g.visible = true; n++; } }
  S.T.look -= dt; const chk8 = S.T.look < 0; if (chk8) S.T.look = .25; let n8 = 0;
  for (const W of S.crows) {
    const c = W.c, g = c.g;
    if (W.base && W.st === 'base') {
      if (c.gone) { W.st = 'away'; W.t = rand(35, 80); W.pf = false; continue; }
      if (c.fly && !W.pf) { leben_crowChain(W); if (W.V) { W.V.mode = 'take'; W.V.tt = .55; leben_play(W.V, 'TakeOff', .08, 1.3, true); } } W.pf = c.fly;
      if (!c.fly && town) { leben_crowWatch(W, dt, spd, indoor);
        if (chk8 && W.slot) { const p = g.position; if (Math.hypot(p.x - P.x, p.z - P.z) < 38 && leben_facing(p.x, p.y, p.z) > .82) n8++; } }
      if (town) leben_crowAnimTick(W, dt, c.fly, false);
      continue;
    }
    if (!town && W.st !== 'away') continue; // eingefroren, solange du nicht im Ort bist
    switch (W.st) {
      case 'perch': { const q = g.position, v = Math.abs(q.x - P.x) < 95 && Math.abs(q.z - P.z) < 95; if (g.visible !== v) g.visible = v; leben_crowWatch(W, dt, spd, indoor);
        if (W.st === 'perch') leben_crowAnimTick(W, dt, false, W.perch && (W.perch.kind === 'boden' || W.perch.kind === 'kuh')); break; } // ferne Krähen nicht zeichnen (Nebel)
      case 'fly': g.position.addScaledVector(c.vel, dt); c.vel.y += dt * .6; g.rotation.y = Math.atan2(-c.vel.z, c.vel.x); leben_crowAnimTick(W, dt, true, false);
        if (W.cow && c3 && g.position.y > 14 && !ch3.lampsOff && ch3.part === 'town') { W.st = 'circle'; W.C.a = Math.atan2(g.position.z - cowFx.g.position.z, g.position.x - cowFx.g.position.x); break; }
        if (g.position.y > 42) { W.st = 'away'; g.visible = false; W.t = rand(30, 75); } break;
      case 'away': W.t -= dt; if (W.t < 0 && town && !(c3 && W.cow)) leben_crowReturn(W); break;
      case 'land': leben_crowLand(W, dt); leben_crowAnimTick(W, dt, W.st === 'land', !!(W.perch && W.perch.kind !== 'mast' && W.perch.kind !== 'dach')); break;
      case 'circle': { if (!c3 || ch3.lampsOff || ch3.part !== 'town') { W.st = 'fly'; W.cow = false; c.vel.set(rand(-3, 3), 4, rand(-3, 3)); break; }
        const C = W.C, x0 = cowFx.g.position.x, z0 = cowFx.g.position.z; C.a += dt * C.w; const s = Math.sign(C.w);
        g.position.set(x0 + Math.cos(C.a) * C.r, C.h + Math.sin(C.a * 2.1) * .9, z0 + Math.sin(C.a) * C.r);
        g.rotation.y = Math.atan2(-Math.cos(C.a) * s, -Math.sin(C.a) * s);
        if (W.V) { C.fl -= dt; if (C.fl < -rand(3, 7)) C.fl = rand(.8, 1.6); const want = C.fl > 0 ? 'Fly' : 'Glide'; if (W.V.cur !== W.V.A[want]) { W.V.mode = 'glide'; leben_play(W.V, want, .4); } leben_crowAnimTick(W, dt, true, false); }
        if (Math.random() < dt * .02) Audio.at(Math.random() < .7 ? 'crow1' : 'crow2', g, { gain: .6, vary: .12, ref: 4 });
        // weit genug weg? Dann hinunter zur Kuh
        if (Math.hypot(P.x - x0, P.z - z0) > 17 && live && Math.random() < dt * .25) { const pt = S.cowPts.find(p => !p.used); if (pt) { pt.used = W; W.perch = pt; leben_crowLandAt(W, pt.x, pt.y, pt.z, true); } }
        break; }
    }
    // Hüpfen am Boden: ein kleiner Satz nach vorn
    if (W.st === 'perch' && W.V && W.V.hop > 0) { W.V.hop -= dt; const a = g.rotation.y, st = dt * .9; g.position.x += Math.cos(a) * st; g.position.z -= Math.sin(a) * st; if (Math.hypot(g.position.x - W.hx, g.position.z - W.hz) > 1.2) g.rotation.y += PI; }
  }
  // „Acht Krähen“ – wer lange genug hinsieht, bemerkt es
  if (chk8 && S.wireOk && S.hook8 < 2) {
    if (n8 >= 7 && live && !indoor && (S.hook8 === 0 || S.seen8Away)) S.look8 += .25; else S.look8 = Math.max(0, S.look8 - .25);
    if (S.look8 >= 2.2) { S.look8 = 0; S.hook8++; S.seen8Away = false;
      subtitle(S.hook8 === 1 ? 'Acht Krähen auf dem Draht. Im gleichen Abstand, wie abgezählt. Alle sehen zu dir.' : 'Sie sind zurück. Wieder acht. Wieder genau dieselben Plätze.', 4200); } }
  // Unerklärlich: alle drehen sich gleichzeitig weg – zum Kirchberg
  if (S.turn) { S.turn.t -= dt; if (S.turn.t < 0) S.turn = null; else for (const W of S.crows) if (leben_perched(W)) { const g = W.c.g; g.rotation.y = leben_ang(g.rotation.y, Math.atan2(-(S.turn.z - g.position.z), S.turn.x - g.position.x), Math.min(1, dt * 4)); } }
  // Schwarm aus dem Baum (Spiel): echtes Modell, Flügelschlag
  for (const c of flock) if (c.on && c.V && c.g.visible) { if (c.V.cur !== c.V.A.Fly) leben_play(c.V, 'Fly', 0, rand(1.1, 1.4)); c.V.mx.update(dt); }
}
function leben_crowWatch(W, dt, spd, indoor) {
  const c = W.c, g = c.g, P = player.pos, dx = P.x - g.position.x, dz = P.z - g.position.z, d = Math.hypot(dx, dz), ground = W.perch && (W.perch.kind === 'boden' || W.perch.kind === 'kuh');
  if (!W.base && !(W.V && W.V.hop > 0)) { // eigene: Kopf zum Spieler (am Boden nur, wenn du nah bist; an der Kuh zum Futter)
    if (W.perch && W.perch.face && d > 12) g.rotation.y = leben_ang(g.rotation.y, Math.atan2(-(W.perch.face[1] - g.position.z), W.perch.face[0] - g.position.x), Math.min(1, dt * 2));
    else if (d < (ground ? 20 : 28)) g.rotation.y = leben_ang(g.rotation.y, Math.atan2(-dz, dx), Math.min(1, dt * 1.5)); }
  if (W.take > 0) { W.take -= dt; if (W.take <= 0) leben_crowOff(W, P.x, P.z); return; }
  if (indoor || d > 24) return;
  const lit = flashOn && d < 18 && leben_facing(g.position.x, g.position.y, g.position.z) > .985;
  if ((spd > 3.6 && d < (ground ? 19 : 16)) || (spd > .9 && d < (ground ? 13 : 12)) || lit || (!W.base && d < (ground ? 8 : 10))) leben_crowOff(W, P.x, P.z);
}

// =====================================================================  RATTEN
function leben_ratSetup() {
  const S = leben_S, R0 = FAB.rats[0]; if (!R0) return;
  const src = R0.g.children[0], clip = k => R0.acts[k].getClip();
  for (const reg of ['ort', 'ort', 'ort', 'ort', 'ort', 'ort', 'ort', 'nord', 'nord', 'nord', 'nord', 'ost', 'ost', 'ost', 'ost', 'ost', 'west', 'west', 'west', 'west', 'west']) {
    const o = S.skc(src); o.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; } }); leben_variiere(o, { gr: .12, hell: [.62, 1.18], warm: .1 }); // Fellton/Größe je Ratte
    const g = new THREE.Group(); g.add(o); g.visible = false; g.userData.noCol = true; S.root.add(g); leben_reg(g, 'Ratte', .6);
    const mx = new THREE.AnimationMixer(o), acts = { idle: mx.clipAction(clip('idle')), sniff: mx.clipAction(clip('sniff')), walk: mx.clipAction(clip('walk')), run: mx.clipAction(clip('run')) };
    acts.idle.play(); mx.update(rand(0, 3));
    S.rats.push({ g, mx, acts, cur: acts.idle, reg, on: false, st: 'idle', t: rand(1, 6), tx: 0, tz: 0, sp: 0, np: false, burst: 0, pause: 0, gy: 0, ty: 0, spot: null, lead: null, far: true, skip: false, tmp: { x: 0, z: 0, hide: false } });
  }
}
function leben_ratSpots() {
  const S = leben_S, boxes = { ort: [[-76, 76, -31, 31], [-4.5, 4.5, -44, -31]], nord: [[-80, 60, 34, 95]], ost: [[81, 155, -40, 35]], west: [[-155, -81, -50, 45]] };
  const gullies = [[-30, .6], [9, -1.3], [46, .9], [1.2, -27], [-55, -.9]], hideAt = gullies.map(([x, z]) => [x, z, 1]); // in den Gully
  for (const c of [parkedA, parkedB, lenaCar]) if (c && c.visible !== false) hideAt.push([c.position.x, c.position.z, 2.8]); // unter Autos
  for (const p of S.trash) hideAt.push([p.x, p.z, 1.1]); // hinter Tonnen und Säcken
  for (const reg in boxes) { const L = S.spots[reg] = [];
    for (const [x, z] of gullies) if (leben_region(x, z) === reg && leben_free(x, z, .1, .15)) L.push({ x, z, hide: true, gully: true });
    for (const [x0, x1, z0, z1] of boxes[reg]) for (let k = 0; k < 520 && L.length < 44; k++) {
      const x = rand(x0, x1), z = rand(z0, z1); if (leben_inHouse(x, z) || !leben_free(x, z, .12, .22)) continue;
      let hide = false; for (const [hx, hz, hr] of hideAt) if (Math.hypot(hx - x, hz - z) < hr) { hide = true; break; }
      if (!hide) { for (const it of solidNear(x, z)) if (it.soft && x > it.bb.min.x - .25 && x < it.bb.max.x + .25 && z > it.bb.min.z - .25 && z < it.bb.max.z + .25 && it.bb.min.y < .4) { hide = true; break; } } // unter Hecken und Büsche
      if (!hide && leben_free(x, z, .15, .85)) continue; // offenes Feld meiden: Ratten laufen an Wänden, Zäunen, Autos entlang
      L.push({ x, z, hide }); } }
  for (const R of S.rats) { const L = S.spots[R.reg]; if (!L || L.length < 4) continue; let s = null;
    for (let k = 0; k < 12 && !s; k++) { const c = L[Math.floor(Math.random() * L.length)]; if (!c.taken && !c.gully) s = c; } if (!s) continue; s.taken = true;
    R.on = true; R.g.position.set(s.x, 0, s.z); R.g.rotation.y = rand(0, 6.28); R.far = true; const sg = solidGround(s.x, .05, s.z); R.ty = R.g.position.y = sg > -1 ? Math.max(0, sg) : 0; }
}
function leben_ratAnim(R, k, ts = 1) { const a = R.acts[k]; a.timeScale = ts; if (a === R.cur) return; a.reset().fadeIn(.15).play(); R.cur.fadeOut(.15); R.cur = a; }
function leben_ratGo(R, s, st, sp, np = false) { R.tx = s.x; R.tz = s.z; R.spot = s; R.st = st; R.sp = sp; R.np = np || st === 'flee'; R.burst = rand(.5, 1.3); R.pause = 0; leben_ratAnim(R, 'run', sp / 2.3); }
function leben_ratFlee(R, sx, sz) {
  const S = leben_S, p = R.g.position, L = S.spots[R.reg]; let ax = p.x - sx, az = p.z - sz; const d = Math.hypot(ax, az) || 1; ax /= d; az /= d;
  for (let tries = 0; tries < 5; tries++) { let best = null, bs = -9;
    for (const s of L) { if (s.tried === S.frame) continue; const dx = s.x - p.x, dz = s.z - p.z, dd = Math.hypot(dx, dz); if (dd < 2.5 || dd > 13) continue;
      const sc = (dx * ax + dz * az) / dd + (s.hide ? .35 : 0) - dd * .02; if (sc > bs) { bs = sc; best = s; } }
    if (!best || bs < .15) break; best.tried = S.frame;
    if (leben_path(p.x, p.z, best.x, best.z)) { leben_ratGo(R, best, 'flee', rand(2.8, 3.5)); if (Math.random() < .45) leben_squeak(p.x, .12, p.z, 2, .045); return; } }
  const T = R.tmp; T.x = p.x + ax * 3.5; T.z = p.z + az * 3.5; T.hide = false;
  if (leben_path(p.x, p.z, T.x, T.z)) leben_ratGo(R, T, 'flee', 3); else { R.st = 'idle'; R.t = rand(1, 2.5); leben_ratAnim(R, 'sniff'); } // in die Ecke gedrängt: erstarren
}
function leben_ratDecide(R) {
  const S = leben_S; if (S.pathBudget <= 0) { R.t = .15; return; } S.pathBudget--;
  const L = S.spots[R.reg], p = R.g.position, wantHide = Math.random() < .22;
  for (let k = 0; k < 4; k++) { const s = L[Math.floor(Math.random() * L.length)], dd = Math.hypot(s.x - p.x, s.z - p.z);
    if (dd < 2 || dd > 12 || (s.hide !== wantHide && k < 2)) continue;
    if (leben_path(p.x, p.z, s.x, s.z)) { leben_ratGo(R, s, 'run', rand(1.7, 2.5)); return; } }
  R.t = rand(1, 3); leben_ratAnim(R, Math.random() < .5 ? 'sniff' : 'idle');
}
function leben_ratMove(R, dt) {
  const p = R.g.position;
  if (R.st === 'chase') { const A = R.lead; if (!A || A.st !== 'run' || !A.g.visible) { R.st = 'idle'; R.t = rand(2, 5); R.lead = null; leben_ratAnim(R, 'sniff'); return; }
    R.tx = A.g.position.x - Math.sin(A.g.rotation.y) * .38; R.tz = A.g.position.z - Math.cos(A.g.rotation.y) * .38; }
  const dx = R.tx - p.x, dz = R.tz - p.z, dd = Math.hypot(dx, dz);
  if (dd < .1 && R.st !== 'chase') {
    if (R.spot && R.spot.hide && (R.st === 'flee' || Math.random() < .6)) { R.st = 'hidden'; R.t = rand(8, 30); R.g.visible = false; }
    else { R.st = 'idle'; R.t = rand(2, 8); leben_ratAnim(R, Math.random() < .55 ? 'sniff' : 'idle'); }
    return; }
  if (!R.np) { if (R.pause > 0) { R.pause -= dt; if (R.pause <= 0) { R.burst = rand(.4, 1.3); leben_ratAnim(R, 'run', R.sp / 2.3); } return; }
    R.burst -= dt; if (R.burst < 0) { R.pause = rand(.25, .9); leben_ratAnim(R, 'sniff'); return; } }
  const st = Math.min(dd, R.sp * dt); if (dd > 1e-4) { p.x += dx / dd * st; p.z += dz / dd * st; }
  R.g.rotation.y = leben_ang(R.g.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 12));
}
function leben_scare(x, z, r) { // alles, was klein ist und am Boden lebt, flieht
  let n = 0; const r2 = r * r;
  for (const R of leben_S.rats) if (R.on && R.st !== 'hidden' && R.st !== 'flee' && !R.far) { const dx = R.g.position.x - x, dz = R.g.position.z - z; if (dx * dx + dz * dz < r2) { leben_ratFlee(R, x, z); n++; } }
  for (const R of FAB.rats) { const dx = R.g.position.x - x, dz = R.g.position.z - z; if (dx * dx + dz * dz < r2 && R.mode !== 'flee') { const d = Math.hypot(dx, dz) || 1; R.tx = R.g.position.x + dx / d * rand(5, 8); R.tz = R.g.position.z + dz / d * rand(5, 8); R.mode = 'flee'; R.sp = 2.8; ratPlay(R, 'run'); n++; } }
  return n;
}
function leben_ratTick(dt, t, live) {
  const S = leben_S; if (S.zone !== 'town') return;
  const P = player.pos, spd = Math.hypot(vel.x, vel.z); S.pathBudget = 2; let loud = null, ld = 7;
  for (const R of S.rats) {
    if (!R.on) continue; const g = R.g, p = g.position, dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz);
    if (d > 36) { if (g.visible) g.visible = false; R.far = true; continue; }
    if (R.far) { R.far = false; if (R.st !== 'hidden') g.visible = true; }
    if (R.st === 'hidden') { R.t -= dt; if (R.t < 0 && d > 7) { R.st = 'idle'; R.t = rand(1.5, 4); g.visible = true; leben_ratAnim(R, 'sniff'); } continue; }
    R.skip = !R.skip; if (d < 22) R.mx.update(dt); else if (R.skip && d < 30) R.mx.update(dt * 2);
    if (R.st !== 'flee' && !S.noFlee) { const near = spd > 3.4 ? 5.5 : 3.2; if (d < near || (flashOn && d < 8 && leben_facing(p.x, p.y + .1, p.z) > .94)) leben_ratFlee(R, P.x, P.z); }
    if (R.st === 'idle') { R.t -= dt; if (R.t < 0) leben_ratDecide(R); } else leben_ratMove(R, dt);
    R.gy -= dt; if (R.gy < 0) { R.gy = .15; const sg = solidGround(p.x, p.y + .05, p.z); R.ty = sg > -1 ? Math.max(0, sg) : 0; }
    p.y += (R.ty - p.y) * Math.min(1, dt * 12);
    if ((R.st === 'run' || R.st === 'flee' || R.st === 'chase') && d < ld && R.cur === R.acts.run) { ld = d; loud = R; }
  }
  // Kratzen und Trippeln der nächsten laufenden Ratte
  S.T.rat8 -= dt; if (loud && S.T.rat8 < 0 && Audio.ctx && live) { S.T.rat8 = rand(.18, .4); const p = loud.g.position; Audio.play(Audio.pick('scrape1', 'scrape2', 'scrape3', 'scrape4'), { gain: .045, rate: rand(2.2, 2.9), x: p.x, y: .05, z: p.z, ref: 1, hp: 1600, dur: .14, offset: rand(0, .3) }); }
  // Zwei Ratten jagen einander (Revierstreit)
  S.T.chase -= dt; if (S.T.chase < 0) { S.T.chase = rand(40, 90); if (live) leben_ratChase(); }
}
function leben_ratChase() {
  const S = leben_S, P = player.pos;
  for (const A of S.rats) { if (!A.on || A.st !== 'idle' || !A.g.visible || A.far) continue; const pa = A.g.position; if (Math.hypot(pa.x - P.x, pa.z - P.z) > 24 || Math.hypot(pa.x - P.x, pa.z - P.z) < 5) continue;
    for (const B of S.rats) { if (B === A || !B.on || B.st !== 'idle' || !B.g.visible || B.reg !== A.reg) continue; const pb = B.g.position; if (Math.hypot(pa.x - pb.x, pa.z - pb.z) > 8) continue;
      const L = S.spots[A.reg]; for (let k = 0; k < 6; k++) { const s = L[Math.floor(Math.random() * L.length)], dd = Math.hypot(s.x - pa.x, s.z - pa.z); if (dd < 4 || dd > 11 || !leben_path(pa.x, pa.z, s.x, s.z)) continue;
        leben_ratGo(A, s, 'run', 3, true); B.st = 'chase'; B.lead = A; B.sp = 3.25; B.np = true; leben_ratAnim(B, 'run', 1.4); leben_squeak(pb.x, .12, pb.z, 4, .06); setTimeout(() => leben_squeak(A.g.position.x, .12, A.g.position.z, 3, .05), 700); return true; }
      return false; } }
  return false;
}

// =====================================================================  SÄUGETIERE (echte, gerigte Modelle): Fuchs, Reh, Wolf, Schwein
// Fuchs: schnürt nachts an Wänden entlang, jagt Ratten, flieht vor dir. Reh: steht am Rand und äst – bis du zu nah kommst.
// Wolf: selten, am Waldrand, sieht dich an. Schwein: auf dem Hof, wühlt und starrt.
function leben_beast(key, s = 1) {
  const S = leben_S, B = S.M[key]; if (!B) return null;
  const m = S.skc(B.src); m.scale.setScalar(s); m.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } }); leben_variiere(m, { hell: key === 'pig' ? [.8, 1.1] : [.82, 1.14], warm: .07 }); // Individuum
  const g = new THREE.Group(); g.add(m); g.visible = false; g.userData.noCol = true; S.root.add(g); leben_reg(g, 'Tier:' + key, 1.6);
  const mx = new THREE.AnimationMixer(m), V = { g, m, mx, A: leben_anims(mx, B.clips), cur: null, st: 'off', t: 0, tx: 0, tz: 0, sp: 0, gy: 0, ty: 0, skip: false, nat: LEBEN_NAT[key] };
  const first = Object.keys(V.A).find(k => /IdleBreathe/.test(k)) || Object.keys(V.A)[0]; if (first) leben_play(V, first, 0);
  return V;
}
function leben_beastMove(V, dt, face = true) { // gerade auf das Ziel zu; Bodenhöhe aus der echten Form
  const p = V.g.position, dx = V.tx - p.x, dz = V.tz - p.z, dd = Math.hypot(dx, dz); if (dd < .05) return true;
  // Nutzer 02.10.: „Lebewesen sollen nicht mehr rückwärts gehen“ – vorher sofort zum Ziel geschoben, Körper drehte erst hinterher (rutschte bis 0,5 s rückwärts/seitwärts).
  // Jetzt wie die Katzen: erst wenden, dann vorwärts in Blickrichtung; je größer der Winkel, desto langsamer (Wende im Stand, dann Bogen).
  if (!face) { const st = Math.min(dd, V.sp * dt); p.x += dx / dd * st; p.z += dz / dd * st; }
  else { const want = dd > 1.2 ? leben_umweg(V, p.x, p.z, Math.atan2(dx, dz), { r: V.sp > 3 ? .45 : .32, y: .5, vor: V.sp > 3 ? 2 : 1.1 }) : Math.atan2(dx, dz); V.g.rotation.y = leben_ang(V.g.rotation.y, want, Math.min(1, dt * (V.sp > 3 ? 7 : 5))); let df = want - V.g.rotation.y; df = Math.atan2(Math.sin(df), Math.cos(df));
    const k = dd < .35 ? 1 : Math.max(0, Math.cos(Math.min(1.57, Math.abs(df) * 1.15))), st = Math.min(dd, V.sp * dt * k);
    if (dd < .35) { p.x += dx / dd * st; p.z += dz / dd * st; } else { p.x += Math.sin(V.g.rotation.y) * st; p.z += Math.cos(V.g.rotation.y) * st; } }
  V.gy -= dt; if (V.gy < 0) { V.gy = .2; const sg = solidGround(p.x, p.y + .1, p.z); V.ty = sg > -1 ? Math.max(0, sg) : 0; } p.y += (V.ty - p.y) * Math.min(1, dt * 8);
  return dd < .15;
}
// 10.10.: Abspieltempo = Wegtempo (kein Fussgleiten): natuerliche Geschwindigkeit der Walk/Run-Clips (m/s bei Modellmass 1, aus den _RM-Clips gemessen)
const LEBEN_NAT = { fox: { Walk: .46, Run: 2.54 }, deer: { Walk: 1.08, Run: 5.61 }, wolf: { Walk: .93, Run: 4.3 }, pig: { Walk: 1.01, Run: 6.48 }, stag: { Walk: 1.2, Run: 6.12 } };
function leben_beastSync(V, dt) { const p = V.g.position; if (V.__lx === undefined) { V.__lx = p.x; V.__lz = p.z; V.__v = 0; return; }
  const v = Math.hypot(p.x - V.__lx, p.z - V.__lz) / Math.max(dt, 1e-3); V.__lx = p.x; V.__lz = p.z; V.__v += (Math.min(v, 12) - V.__v) * Math.min(1, dt * 8);
  const c = V.cur, N = V.nat; if (!c || !N || !V.A) return; if (c === V.A.Walk || c === V.A.Run) { const n = (c === V.A.Run ? N.Run : N.Walk) * (V.m.scale.x || 1); if (n > 0) c.timeScale = Math.max(.5, Math.min(2.3, V.__v / n)); } }
function leben_beastUpd(V, dt, far = 60) { const cam = camera.position, dx = V.g.position.x - cam.x, dz = V.g.position.z - cam.z; if (dx * dx + dz * dz < far * far) { leben_beastSync(V, dt); V.mx.update(dt); } }
function leben_openSpot(dMin, dMax, clear, behind) { // freier Platz in einem Ring um den Spieler (für Reh und Wolf)
  const P = player.pos;
  for (let k = 0; k < 24; k++) { const a = rand(0, 6.28), d = rand(dMin, dMax), x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d;
    if (behind && leben_facing(x, 1, z) > .25) continue; if (Math.abs(z) < 7 && Math.abs(x) < 80) continue; // nicht mitten auf der Hauptstraße
    if (leben_inHouse(x, z, 1.5) || !leben_free(x, z, .5, clear)) continue; const sg = solidGround(x, .6, z); return [x, sg > -1 ? Math.max(0, sg) : 0, z]; }
  return null;
}
function leben_beastSetup() {
  const S = leben_S;
  S.fox = leben_beast('fox', 1); S.deer = leben_beast('deer', rand(.95, 1.05)); S.wolf = leben_beast('wolf', 1.12); S.pig = leben_beast('pig', .92);
  if (S.deer) S.deer.T = rand(60, 120); if (S.wolf) { S.wolf.T = rand(240, 420); S.wolf.n = 0; } if (S.fox) { S.fox.T = 0; S.fox.huntT = 2; }
}
function leben_beastReady() { // Fuchs und Schwein an ihren Platz
  const S = leben_S, F = S.fox, L = S.spots.ort;
  if (F && L && L.length > 6) { const s = L[Math.floor(Math.random() * L.length)]; F.g.position.set(s.x, 0, s.z); F.st = 'roam'; F.t = rand(2, 6); F.g.visible = true; F.reg = 'ort'; }
  const pigSpots = (S.spots.west || []).filter(s => s.x > -150 && s.x < -110 && s.z > -45 && s.z < -10); // Hof im Westen
  if (S.pig && pigSpots.length) { const s = pigSpots[Math.floor(Math.random() * pigSpots.length)]; S.pig.home = [s.x, s.z]; S.pig.g.position.set(s.x, 0, s.z); S.pig.st = 'root'; S.pig.t = rand(2, 5); S.pig.g.visible = true; S.pig.gruntT = rand(5, 15); }
  else if (S.pig) S.pig.st = 'none';
}
function leben_beastTick(dt, t, live, c1, c3) {
  const S = leben_S; if (S.zone !== 'town') return;
  if (S.fox && S.fox.st !== 'off') leben_foxTick(S.fox, dt, live);
  if (S.deer) leben_deerTick(S.deer, dt, live, c1 || c3);
  if (S.wolf) leben_wolfTick(S.wolf, dt, live, c1 || c3);
  if (S.pig && S.pig.st !== 'none' && S.pig.st !== 'off') leben_pigTick(S.pig, dt, live);
}
// ---- Fuchs
function leben_foxTick(F, dt, live) {
  const S = leben_S, P = player.pos, p = F.g.position, dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz), spd = Math.hypot(vel.x, vel.z), L = S.spots[F.reg];
  if (d > 70) { if (F.g.visible) F.g.visible = false; F.far = true; F.T -= dt; if (F.T < 0 && L) { F.T = rand(20, 40); const s = L[Math.floor(Math.random() * L.length)]; if (Math.hypot(s.x - P.x, s.z - P.z) > 45) { p.set(s.x, 0, s.z); F.st = 'roam'; F.t = rand(1, 4); } } return; }
  if (F.far) { F.far = false; F.g.visible = true; }
  leben_beastUpd(F, dt, 55);
  // Du störst: kurz ansehen, dann weg
  if (F.st !== 'flee' && F.st !== 'look') { const lit = flashOn && d < 16 && leben_facing(p.x, p.y + .3, p.z) > .96;
    if (d < 6 || (spd > .9 && d < 10) || (spd > 3.6 && d < 16) || lit) { F.st = 'look'; F.t = rand(.45, .9); leben_play(F, Math.random() < .5 ? 'IdleAggressive' : 'IdleLookAround', .15); } }
  switch (F.st) {
    case 'look': F.g.rotation.y = leben_ang(F.g.rotation.y, Math.atan2(-dx, -dz), Math.min(1, dt * 8)); F.t -= dt;
      if (F.t < 0) { let best = null, bs = -9; for (const s of L) { const sx = s.x - p.x, sz = s.z - p.z, sd = Math.hypot(sx, sz); if (sd < 12 || sd > 32) continue; const sc = (sx * dx + sz * dz) / (sd * (d || 1)) + rand(0, .3); if (sc > bs && leben_pathR(p.x, p.z, s.x, s.z, .3, .2)) { bs = sc; best = s; } }
        if (best) { F.tx = best.x; F.tz = best.z; } else { F.tx = p.x + dx / (d || 1) * 20; F.tz = p.z + dz / (d || 1) * 20; }
        F.st = 'flee'; F.sp = 4.3; leben_play(F, 'Run', .15, 1.05); leben_scare(p.x, p.z, 5); } break;
    case 'flee': if (leben_beastMove(F, dt)) { F.st = 'roam'; F.t = rand(4, 9); leben_play(F, 'IdleLookAround', .3); }
      if (!F.rsT || (F.rsT -= dt) < 0) { F.rsT = .3; if (d < 18) Audio.play(Audio.pick('stepG1', 'stepG2', 'stepG3'), { gain: .12, rate: rand(1.5, 1.9), x: p.x, y: .1, z: p.z, ref: 1.5 }); } break;
    case 'roam': F.t -= dt; if (F.t < 0 && L && S.pathBudget > 0) { S.pathBudget--; for (let k = 0; k < 4; k++) { const s = L[Math.floor(Math.random() * L.length)], sd = Math.hypot(s.x - p.x, s.z - p.z); if (sd < 5 || sd > 22 || !leben_pathR(p.x, p.z, s.x, s.z, .3, .2)) continue;
        F.tx = s.x; F.tz = s.z; F.st = 'go'; F.sp = rand(.9, 1.15); leben_play(F, 'Walk', .3, F.sp / 1.05); break; } if (F.st === 'roam') F.t = rand(1, 3); }
      break;
    case 'go': if (leben_beastMove(F, dt)) { F.st = 'roam'; F.t = rand(3, 9); leben_play(F, Math.random() < .6 ? 'IdleLookAround' : 'IdleBreathe', .35); } break;
    case 'stalk': { const R = F.prey; if (!R || R.st === 'hidden' || !R.g.visible) { F.st = 'roam'; F.t = rand(2, 5); leben_play(F, 'IdleLookAround', .3); break; }
      F.tx = R.g.position.x; F.tz = R.g.position.z; const rd = Math.hypot(F.tx - p.x, F.tz - p.z);
      if (rd < 1.7) { F.st = 'pounce'; F.t = .9; leben_play(F, 'JumpBite', .1, 1.1, true); F.sp = 2.4; const caught = Math.random() < .35; F.caught = caught;
        if (caught) { R.st = 'hidden'; R.t = rand(90, 160); R.g.visible = false; leben_squeak(F.tx, .1, F.tz, 6, .07); } else { leben_ratFlee(R, p.x, p.z); leben_squeak(F.tx, .1, F.tz, 3, .06); } }
      else { if (rd < 3.2 && R.st !== 'flee' && Math.random() < dt * 1.5) leben_ratFlee(R, p.x, p.z); leben_beastMove(F, dt); } break; }
    case 'pounce': F.t -= dt; if (F.t > .3) leben_beastMove(F, dt); if (F.t < 0) { F.st = 'roam'; F.t = rand(3, 6); leben_play(F, F.caught ? 'IdleBreathe' : 'IdleLookAround', .3); } break;
  }
  // Jagen: Ratte in der Nähe, du weit genug weg
  F.huntT -= dt; if (F.huntT < 0 && (F.st === 'roam' || F.st === 'go') && d > 12) { F.huntT = 1;
    for (const R of S.rats) { if (!R.on || R.st === 'hidden' || !R.g.visible || R.far) continue; const rd = Math.hypot(R.g.position.x - p.x, R.g.position.z - p.z); if (rd > 9 || rd < 1) continue;
      if (!leben_pathR(p.x, p.z, R.g.position.x, R.g.position.z, .3, .2)) continue; F.prey = R; F.st = 'stalk'; F.sp = .7; leben_play(F, 'Walk', .3, .7); break; } }
  // Krähen am Boden trauen ihm nicht
  if (F.st === 'go' || F.st === 'flee' || F.st === 'stalk') { F.cT = (F.cT || 0) - dt; if (F.cT < 0) { F.cT = .5; for (const W of S.crows) if (leben_perched(W) && W.perch && W.perch.kind === 'boden' && Math.hypot(W.c.g.position.x - p.x, W.c.g.position.z - p.z) < 6) W.take = W.take > 0 ? W.take : rand(.1, .4); } }
}
function leben_pathR(x0, z0, x1, z1, y, r) { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / .5); for (let i = 1; i <= n; i++) { const k = i / n; if (!leben_free(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, y, r)) return false; } return true; }
// ---- Reh: steht am Rand, äst, hebt den Kopf, springt davon
function leben_deerTick(D, dt, live, ok) {
  const P = player.pos, p = D.g.position;
  if (D.st === 'off') { D.T -= dt; if (D.T > 0 || !live || !ok || dir.busy) return;
    const edge = Math.abs(P.x) > 58 || P.z > 22 || P.z < -24; if (!edge) { D.T = 8; return; } // nur draußen am Rand, nicht mitten im Ort
    const sp = leben_openSpot(34, 52, 1.2, true); if (!sp) { D.T = 6; return; }
    p.set(sp[0], sp[1], sp[2]); D.ty = sp[1]; D.g.rotation.y = rand(0, 6.28); D.g.visible = true; D.st = 'graze'; D.t = rand(3, 7); leben_play(D, 'IdleGraze', 0); D.seen = 0; D.life = 0; return; }
  D.life += dt; leben_beastUpd(D, dt, 70);
  const dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz), spd = Math.hypot(vel.x, vel.z), f = leben_facing(p.x, p.y + .9, p.z);
  if (D.st === 'graze' || D.st === 'walk') {
    if (f > .9 && d < 60) D.seen += dt;
    const lit = flashOn && d < 32 && f > .97;
    if (d < 22 || (spd > 3.6 && d < 32) || lit) { D.st = 'alert'; D.t = d < 16 || spd > 3.6 ? rand(.3, .6) : rand(1.1, 2); leben_play(D, 'IdleLookAround', .2); }
    else if (D.life > 90 && D.seen < .1 && f < .2) { D.st = 'off'; D.g.visible = false; D.T = rand(120, 240); return; } // ungesehen verschwunden
    else { D.t -= dt; if (D.t < 0) { if (D.st === 'graze' && Math.random() < .45) { D.st = 'walk'; D.t = rand(2, 4); const a = D.g.rotation.y + rand(-.8, .8); D.tx = p.x + Math.sin(a) * 1.2; D.tz = p.z + Math.cos(a) * 1.2; D.sp = .35; leben_play(D, 'WalkGraze', .4); }
      else { D.st = 'graze'; D.t = rand(3, 8); leben_play(D, Math.random() < .7 ? 'IdleGraze' : 'IdleChew', .4); } }
      if (D.st === 'walk' && leben_free(D.tx, D.tz, .5, .5)) leben_beastMove(D, dt); } }
  else if (D.st === 'alert') { D.g.rotation.y = leben_ang(D.g.rotation.y, Math.atan2(-dx, -dz), Math.min(1, dt * 3)); D.t -= dt;
    if (D.t < 0 || d < 14) { D.st = 'run'; D.sp = 7.5; D.ax = dx / (d || 1); D.az = dz / (d || 1); D.tx = p.x + D.ax * 60; D.tz = p.z + D.az * 60; leben_play(D, 'Run', .15); D.hT = 0; leben_crowScare(p.x, p.z, 14); } }
  else if (D.st === 'run') { // Hindernis voraus? ausweichen
    D.cT = (D.cT || 0) - dt; if (D.cT < 0) { D.cT = .35; const ax = Math.sin(D.g.rotation.y), az = Math.cos(D.g.rotation.y);
      if (!leben_free(p.x + ax * 2.2, p.z + az * 2.2, .7, .45)) { for (const turn of [.7, -.7, 1.4, -1.4]) { const a = Math.atan2(D.tx - p.x, D.tz - p.z) + turn; if (leben_free(p.x + Math.sin(a) * 2.2, p.z + Math.cos(a) * 2.2, .7, .45)) { D.tx = p.x + Math.sin(a) * 40; D.tz = p.z + Math.cos(a) * 40; break; } } } }
    leben_beastMove(D, dt); D.hT -= dt; if (D.hT < 0 && d < 35) { D.hT = .19; Audio.play(Audio.pick('stepG1', 'stepG2', 'stepG3'), { gain: .35, rate: rand(.8, 1), x: p.x, y: .1, z: p.z, ref: 4 }); }
    if (d > 62 || (d > 40 && f < .3)) { D.st = 'off'; D.g.visible = false; D.T = rand(240, 420); } }
}
// ---- Wolf: selten. Steht am Waldrand und sieht dich an. Wer wegsieht, sieht ihn nicht wieder.
function leben_howl(x, y, z) {
  if (!Audio.ctx || !Audio.started) return; if (Audio.wolf && Audio.wolf(x, y, z)) return; /* echtes Wolfsheulen (Sonniss) */ const ctx = Audio.ctx, t = ctx.currentTime, d = Audio.at(x, y, z, 28), f0 = rand(380, 430), dur = rand(3.4, 4.4);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.14, t + .6); g.gain.setValueAtTime(.14, t + dur - 1); g.gain.linearRampToValueAtTime(0, t + dur); g.connect(d);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300; lp.connect(g);
  const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.3; vg.gain.value = 6; vib.connect(vg); vib.start(t); vib.stop(t + dur + .1);
  for (const [type, m, a] of [['sine', 1, .8], ['sawtooth', 1, .22], ['sine', 2, .12]]) { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; og.gain.value = a; vg.connect(o.frequency);
    o.frequency.setValueAtTime(f0 * .78 * m, t); o.frequency.linearRampToValueAtTime(f0 * 1.42 * m, t + .8); o.frequency.setValueAtTime(f0 * 1.42 * m, t + dur * .55); o.frequency.linearRampToValueAtTime(f0 * 1.08 * m, t + dur);
    o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + .1); }
}
function leben_wolfTick(Wf, dt, live, ok) {
  const S = leben_S, P = player.pos, p = Wf.g.position;
  if (Wf.st === 'off') { Wf.T -= dt; if (Wf.T > 0 || !live || !ok || dir.busy || Wf.n >= 3 || !S.treePts || !S.treePts.length) return;
    // am Waldrand: ein Baum 30–46 m weit, hinter dir; der Wolf steht davor
    let spot = null; for (let k = 0; k < 30 && !spot; k++) { const [tx, tz] = S.treePts[Math.floor(Math.random() * S.treePts.length)], d = Math.hypot(tx - P.x, tz - P.z); if (d < 30 || d > 46) continue;
      const x = tx + (P.x - tx) / d * 2.2, z = tz + (P.z - tz) / d * 2.2; if (leben_facing(x, 1, z) > .2 || leben_inHouse(x, z, 2) || !leben_free(x, z, .5, .7)) continue; const sg = solidGround(x, .6, z); spot = [x, sg > -1 ? Math.max(0, sg) : 0, z]; }
    if (!spot) { Wf.T = 10; return; }
    p.set(spot[0], spot[1], spot[2]); Wf.ty = spot[1]; Wf.g.rotation.y = Math.atan2(P.x - p.x, P.z - p.z); Wf.g.visible = true; Wf.st = 'watch'; Wf.seen = 0; Wf.away = 0; Wf.life = 0; Wf.howled = false; Wf.n++; leben_play(Wf, 'IdleBreathe', 0); return; }
  Wf.life += dt; leben_beastUpd(Wf, dt, 70);
  const dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz), f = leben_facing(p.x, p.y + .6, p.z);
  if (Wf.st === 'watch') {
    Wf.g.rotation.y = leben_ang(Wf.g.rotation.y, Math.atan2(-dx, -dz), Math.min(1, dt * 2));
    if (f > .93 && d < 55) { Wf.seen += dt; Wf.away = 0; } else if (Wf.seen > .4) Wf.away += dt;
    if (Wf.seen > .5 && !Wf.howled && d > 28 && Math.random() < .5) { Wf.howled = true; leben_play(Wf, 'Howl', .3, 1, true); Wf.hT = 4.5; leben_howl(p.x, p.y + .8, p.z); } else if (Wf.seen > .5) Wf.howled = true;
    if (Wf.hT > 0) { Wf.hT -= dt; if (Wf.hT <= 0) leben_play(Wf, 'IdleLookAround', .4); }
    const lit = flashOn && d < 30 && f > .97;
    if (d < 22 || lit) { Wf.st = 'run'; Wf.sp = 6.5; Wf.tx = p.x + dx / d * 50; Wf.tz = p.z + dz / d * 50; leben_play(Wf, 'Run', .2); leben_crowScare(p.x, p.z, 20); leben_scare(p.x, p.z, 12); }
    else if (Wf.away > 3 || Wf.life > 45) { Wf.st = 'off'; Wf.g.visible = false; Wf.T = rand(420, 700); } } // weggesehen – und weg
  else if (Wf.st === 'run') { leben_beastMove(Wf, dt); if (d > 60 || (d > 40 && f < .3) || !leben_free(p.x + Math.sin(Wf.g.rotation.y) * 1.5, p.z + Math.cos(Wf.g.rotation.y) * 1.5, .5, .4) && f < .5) { Wf.st = 'off'; Wf.g.visible = false; Wf.T = rand(420, 700); } }
}
// ---- Schwein auf dem Hof
function leben_grunt(x, y, z) {
  { const n = typeof kl_pick === 'function' ? kl_pick('fx_schwein_', 3) : null; if (n) { Audio.play(n, { gain: .5, vary: .08, x, y, z, ref: 4 }); return; } } // echte Aufnahme (klang.js)
  if (!Audio.ctx || !Audio.started) return; const ctx = Audio.ctx, d = Audio.at(x, y, z, 3);
  for (let i = 0, n = 2 + Math.floor(rand(0, 3)); i < n; i++) { const t0 = i * rand(.18, .3), n_ = Audio.noise(false), lp = ctx.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = rand(180, 320); lp.Q.value = 2.5; n_.connect(lp);
    const am = ctx.createGain(); am.gain.value = .5; lp.connect(am); Audio.env(am, .5, .02, rand(.1, .2), t0, d); n_.stop(ctx.currentTime + t0 + .5);
    const o = Audio.osc('sawtooth', rand(70, 95), t0, .3), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; o.connect(f); Audio.env(f, .09, .02, .16, t0, d); }
}
function leben_pigTick(Pg, dt, live) {
  const P = player.pos, p = Pg.g.position, dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz);
  if (d > 75) { if (Pg.g.visible) Pg.g.visible = false; return; } if (!Pg.g.visible) Pg.g.visible = true;
  leben_beastUpd(Pg, dt, 50);
  if (d < 11) { if (Pg.st !== 'stare') { Pg.st = 'stare'; leben_play(Pg, 'IdleLookAround', .4); } Pg.g.rotation.y = leben_ang(Pg.g.rotation.y, Math.atan2(-dx, -dz), Math.min(1, dt * 1.2)); } // es hört auf zu fressen und sieht dich an
  else if (Pg.st === 'stare') { Pg.st = 'root'; Pg.t = rand(2, 4); leben_play(Pg, 'SniffleforFood', .4); }
  else if (Pg.st === 'root') { Pg.t -= dt; if (Pg.t < 0) { const a = rand(0, 6.28), r = rand(1, 4.5), x = Pg.home[0] + Math.cos(a) * r, z = Pg.home[1] + Math.sin(a) * r;
      if (leben_pathR(p.x, p.z, x, z, .4, .45)) { Pg.tx = x; Pg.tz = z; Pg.sp = .55; Pg.st = 'walk'; leben_play(Pg, 'Walk', .4, .9); } else Pg.t = 1.5; } }
  else if (Pg.st === 'walk') { if (leben_beastMove(Pg, dt)) { Pg.st = 'root'; Pg.t = rand(4, 10); leben_play(Pg, Math.random() < .6 ? 'SniffleforFood' : 'Chew', .4); } }
  Pg.gruntT -= dt; if (Pg.gruntT < 0) { Pg.gruntT = rand(6, 16); if (live && d < 28) leben_grunt(p.x, .6, p.z); }
}

// =====================================================================  FLEDERMÄUSE (Kapelle, Tankstelle, Schrott, Scheune, Gärten) + Jagd auf Motten
function leben_batSetup() {
  const S = leben_S, B0 = FAB.bats[0]; if (!B0) return;
  for (const b of FAB.bats) if (b.g.children[0]) b.g.children[0].rotation.y = -PI / 2; // 10.10.: Modell blickt entlang +X, die Flugbahn läuft entlang +Z (Fledermaeuse flogen seitwaerts); die Klone unten uebernehmen die Drehung
  const o0 = B0.g.children[0], clip = (o0.animations && o0.animations[0]) || (B0.mx._actions && B0.mx._actions[0] && B0.mx._actions[0].getClip()); if (!clip) return;
  [[-52, 80, 9, 10], [-40, 70, 7, 7.5], [30, 72, 8, 7], [112, 18, 9, 7.5], [118, -18, 10, 6.5], [-130, -28, 8, 8.5], [-118, -20, 6, 6.5], [-115, 25, 9, 6.5]].forEach(([cx, cz, r, h], i) => {
    const o = S.skc(o0); o.traverse(m => { if (m.isMesh) m.castShadow = false; }); leben_variiere(o, { hell: [.75, 1.1] });
    const g = new THREE.Group(); g.add(o); g.visible = false; g.userData.noCol = true; S.root.add(g); leben_reg(g, 'Fledermaus', .6);
    const mx = new THREE.AnimationMixer(o), a = mx.clipAction(clip); a.timeScale = rand(2.6, 3.4); a.play(); mx.update(rand(0, 2));
    S.bats.push({ g, mx, cx, cz, r, h, sp: rand(.5, .85) * (i % 2 ? 1 : -1), ph: rand(0, 6.28) }); });
}
function leben_batTick(dt, t, live) {
  const S = leben_S, P = player.pos, show = S.zone === 'town' && !ch3.lampsOff;
  for (const b of S.bats) { b.ph += dt * b.sp; const d = Math.hypot(b.g.position.x - P.x, b.g.position.z - P.z), v = show && d < 58; if (b.g.visible !== v) b.g.visible = v; if (!v && Math.hypot(b.cx - P.x, b.cz - P.z) > 45) continue;
    if (v && d < 40) b.mx.update(dt);
    const x = b.cx + Math.cos(b.ph) * b.r + Math.sin(b.ph * 2.9) * 1.2, y = b.h + Math.sin(b.ph * 2.3) * 1.3, z = b.cz + Math.sin(b.ph) * b.r * .7 + Math.cos(b.ph * 3.3) * .8;
    const px = b.g.position.x, pz = b.g.position.z; b.g.position.set(x, y, z); b.g.rotation.y = Math.atan2(x - px, z - pz); }
  for (let i = S.eaten.length - 1; i >= 0; i--) { const e = S.eaten[i]; e.t -= dt; if (e.t < 0) { e.d.h = e.h; S.eaten.splice(i, 1); } } // neue Motten finden das Licht
  if (S.hunt) leben_huntTick(dt, t);
  else { S.T.hunt -= dt; if (S.T.hunt < 0) { S.T.hunt = rand(9, 22); if (show && state.started) leben_huntStart(); } }
}
function leben_huntStart() {
  const S = leben_S, P = player.pos; let best = null, bd = 1e9;
  const tryBat = (b, fab) => { if (!b.g.visible || (fab && b.swoop > 0)) return; const bp = b.g.position; if (Math.hypot(bp.x - P.x, bp.z - P.z) > 55) return;
    for (const L of lamps) { if (L.k < .5 || L.mode === 'off') continue; const dl = Math.hypot(L.wx - bp.x, L.wz - bp.z), dp = Math.hypot(L.wx - P.x, L.wz - P.z); if (dl > 30 || dp > 42) continue;
      const sc = dl + dp * .3 + rand(0, 8); if (sc < bd) { bd = sc; best = { b, L }; } } };
  for (const b of FAB.bats) tryBat(b, true); for (const b of S.bats) tryBat(b, false);
  if (!best) return false;
  const L = best.L, H = S.hunt = { b: best.b, L, t: 0, dur: rand(5, 8), ph: rand(0, 6), px: best.b.g.position.x, pz: best.b.g.position.z, saved: [], clickT: 0, flap: false,
    dive: Math.hypot(L.wx - P.x, L.wz - P.z) > 9 && Math.random() < .4 };
  const scatter = d => { if (d.L !== L) return; H.saved.push([d, d.r, d.sp]); d.r *= 1.9; d.sp *= 2.3; };
  moths.data.forEach(scatter); if (S.moths) S.moths.data.forEach(scatter);
  for (let k = 0, n = 1 + Math.floor(rand(0, 2)); k < n && H.saved.length; k++) { const d = H.saved[Math.floor(Math.random() * H.saved.length)][0]; if (d.h > -50) { S.eaten.push({ d, h: d.h, t: rand(35, 80) }); d.h = -80; } } // gefressen
  return true;
}
function leben_huntTick(dt, t) {
  const S = leben_S, H = S.hunt, b = H.b, L = H.L, P = player.pos; H.t += dt; const k = H.t;
  if (L.mode === 'off' || L.mode === 'dying' || k > H.dur || !b.g.visible) { for (const [d, r, sp] of H.saved) { d.r = r; d.sp = sp; } S.hunt = null; return; }
  const a = k * 4.4 + Math.sin(k * 6.1) * 1.1, r = .8 + .5 * Math.sin(k * 2.6 + H.ph);
  let hy = 5 + Math.sin(k * 4.3) * .5 - .25; if (H.dive && k > H.dur - 1.7 && k < H.dur - .4) hy -= 3.3 * Math.sin((k - (H.dur - 1.7)) / 1.3 * PI);
  const hx = L.wx + Math.cos(a) * r, hz = L.wz + Math.sin(a * 1.35) * r * .8, w = Math.min(1, k / 1.3, (H.dur - k) / 1.3), e = w * w * (3 - 2 * w), gp = b.g.position;
  gp.set(gp.x + (hx - gp.x) * e, gp.y + (hy - gp.y) * e, gp.z + (hz - gp.z) * e);
  if (Math.abs(gp.x - H.px) + Math.abs(gp.z - H.pz) > 1e-3) b.g.rotation.y = Math.atan2(gp.x - H.px, gp.z - H.pz); H.px = gp.x; H.pz = gp.z;
  H.clickT -= dt; if (H.clickT < 0 && e > .5) { H.clickT = rand(.35, .8); if (Math.hypot(L.wx - P.x, L.wz - P.z) < 22) leben_click(gp.x, gp.y, gp.z); }
  if (!H.flap && Math.hypot(gp.x - P.x, gp.z - P.z) < 5) { H.flap = true; Audio.flap(gp.x, gp.y, gp.z); }
  if (H.dive && gp.y < 2.2 && !H.scared) { H.scared = true; leben_scare(gp.x, gp.z, 6); } // Tiefflug über dem Pflaster: die Ratten stieben auseinander
}

// =====================================================================  FLIEGEN (eine Instanz-Geometrie: Kuh, Blut, Mülltonnen)
function leben_flySetup() {
  const S = leben_S, f0 = FAB.flies[0]; if (!f0) return;
  const o = f0.o, sp = o.position.clone(), sr = o.rotation.clone(); o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.updateMatrixWorld(true);
  const geos = []; let mat = null;
  o.traverse(m => { if (!m.isMesh) return; const g = m.geometry.clone(); g.applyMatrix4(m.matrixWorld); for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k); g.morphAttributes = {}; geos.push(g); mat = mat || [].concat(m.material)[0]; });
  o.position.copy(sp); o.rotation.copy(sr); o.updateMatrixWorld(true);
  const geo = geos.length > 1 ? mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g)) : geos[0]; if (!geo) return;
  const im = new THREE.InstancedMesh(geo, mat, 72); im.count = 0; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.userData.noCol = true; S.root.add(im);
  S.flies = { im, cap: 72, used: 0 };
}
function leben_swarm(x, y, z, n, r, pts, on) {
  const S = leben_S, F = S.flies; if (!F || F.used + n > F.cap) return null;
  const W = { x, y, z, r, pts, on, flies: [] }; F.used += n;
  for (let i = 0; i < n; i++) W.flies.push({ ph: rand(0, 6.28), sp: rand(3, 6.5), rr: r * rand(.5, 1.2), h: rand(-.1, .25), st: 'fly', lt: rand(.5, 4), pi: 0, x: x + rand(-.2, .2), y, z: z + rand(-.2, .2), yaw: 0 });
  S.swarms.push(W); return W;
}
function leben_flyTick(dt, t, live) {
  const S = leben_S, F = S.flies; if (!F) return;
  // Kapitel 3: Die Fliegen sind schon an der Kuh – und am Blut
  if (ch3.on && !S.cowDone && cowFx.done && cowFx.t >= 1) { S.cowDone = true; const pts = [], v = leben_V[0]; cowFx.g.updateMatrixWorld(true);
    cowFx.g.traverse(m => { if (!m.isMesh) return; const pa = m.geometry.attributes.position; for (let k = 0; k < 30; k++) { v.fromBufferAttribute(pa, Math.floor(Math.random() * pa.count)).applyMatrix4(m.matrixWorld); if (v.y > .12) pts.push(v.clone()); } });
    const c = cowFx.g.position; leben_swarm(c.x, .55, c.z, 16, 1.1, pts.slice(0, 50), true); }
  if (S.cowDone && !S.goreDone && gorePieces.length && gorePieces.every(p => p.t >= p.dur)) { S.goreDone = true; // und am Blut, sobald die Teile liegen
    const gp = gorePieces.map(p => p.o.position.clone().setY(.06)); let gx = 0, gz = 0; gp.forEach(p => { gx += p.x; gz += p.z; }); leben_swarm(gx / gp.length, .25, gz / gp.length, 10, 1.8, gp, true); }
  const cam = camera.position, im = F.im; let n = 0, near = null, nd = 12, nf = 0;
  if (S.zone === 'town') for (const W of S.swarms) {
    if (!W.on) continue; const dx = W.x - cam.x, dz = W.z - cam.z, d2 = dx * dx + dz * dz; if (d2 > 24 * 24) continue;
    let flying = 0;
    for (const f of W.flies) {
      f.lt -= dt;
      if (f.st === 'sit') { if (f.lt < 0) { f.st = 'fly'; f.lt = rand(1.2, 4.5); } else if (Math.random() < dt * 1.5) f.yaw += rand(-.7, .7); }
      else if (f.st === 'go') { const p = W.pts[f.pi], ex = p.x - f.x, ey = p.y - f.y, ez = p.z - f.z, e = Math.hypot(ex, ey, ez); flying++;
        if (e < .02) { f.st = 'sit'; f.lt = rand(1, 6); f.x = p.x; f.y = p.y; f.z = p.z; } else { const s = Math.min(e, 1.3 * dt); f.x += ex / e * s + (Math.random() - .5) * .01; f.y += ey / e * s; f.z += ez / e * s; f.yaw = Math.atan2(ex, ez); } }
      else { flying++; f.ph += dt * f.sp; const a = f.ph, tx = W.x + Math.cos(a) * f.rr + Math.sin(a * 2.7) * .1, ty = W.y + f.h + Math.sin(a * 1.9) * .16, tz = W.z + Math.sin(a * 1.3) * f.rr * .8;
        const k = Math.min(1, dt * 9), ox = f.x, oz = f.z; f.x += (tx - f.x) * k; f.y += (ty - f.y) * k; f.z += (tz - f.z) * k; f.yaw = Math.atan2(f.x - ox, f.z - oz);
        if (f.lt < 0 && W.pts && W.pts.length) { f.st = 'go'; f.pi = Math.floor(Math.random() * W.pts.length); } }
      leben_M4.compose(leben_V[1].set(f.x, f.y, f.z), leben_Q.setFromEuler(leben_E.set(0, f.yaw, 0)), leben_ONE); im.setMatrixAt(n++, leben_M4);
    }
    const d = Math.sqrt(d2); if (d < nd && flying) { nd = d; near = W; nf = flying / W.flies.length; }
  }
  im.count = n; if (n) im.instanceMatrix.needsUpdate = true;
  // Summen: eine Stimme am nächsten Schwarm
  if (Audio.ctx && Audio.started) { if (!S.buzz) leben_buzzMake(); const B = S.buzz; if (B) { B.t -= dt; if (B.t < 0) { B.t = .12; const tt = Audio.ctx.currentTime;
    if (near) Audio.setze(B.p, near.x, near.y, near.z);
    B.g.gain.setTargetAtTime(near ? .08 * (.25 + .75 * nf) * (Math.random() < .2 ? .4 : 1) : 0, tt, .08); } } }
}
function leben_buzzMake() {
  const ctx = Audio.ctx, S = leben_S; try {
    const p = Audio.at(0, -50, 0, 1.1, { dauer: 1e9 }), g = ctx.createGain(); g.gain.value = 0; g.connect(p);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = .6; bp.connect(g);
    const am = ctx.createGain(); am.gain.value = .6; Audio.lfo(11.5, .35, am.gain); am.connect(bp);
    for (const f of [187, 223, 251]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; Audio.lfo(rand(4, 7), f * .035, o.frequency); const og = ctx.createGain(); og.gain.value = .22; o.connect(og); og.connect(am); o.start(); }
    S.buzz = { p, g, t: 0 }; } catch (e) { S.buzz = { p: null, g: { gain: { setTargetAtTime() {} } }, t: 1e9 }; }
}

// =====================================================================  MOTTEN: auch an den neuen Laternen, an Verandalampen – und in deinem Lichtkegel
function leben_mothSetup() {
  { // Motten als weiche, runde Sprites (vorher weiße Quadrate): heller Körper, weich auslaufender Flügelschein; warm, weil sie im Natriumlicht fliegen
    const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,250,240,1)'); g.addColorStop(.3, 'rgba(236,222,196,.8)'); g.addColorStop(.7, 'rgba(220,200,170,.22)'); g.addColorStop(1, 'rgba(220,200,170,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    for (const mt of [moths.m.material, mothBurst.m.material]) { mt.map = tx; mt.alphaTest = .02; mt.size *= 1.7; mt.needsUpdate = true; } moths.m.material.color.setHex(0xffe6c4); }
  const S = leben_S, base = new Set(moths.data.map(d => d.L)), data = [];
  for (const L of lamps) if (!base.has(L)) for (let i = 0; i < 10; i++) data.push({ L, pl: null, P: null, ph: rand(0, 6.28), r: rand(.25, .9), sp: rand(1.5, 4), h: rand(-.6, .1) });
  for (const pl of porchLights) { const P = new THREE.Vector3(); for (let i = 0; i < 6; i++) data.push({ L: null, pl, P, ph: rand(0, 6.28), r: rand(.12, .42), sp: rand(2, 4.5), h: rand(-.25, .15) }); }
  const N = Math.max(1, data.length), pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) pos[i * 3 + 1] = -50;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.Points(g, moths.m.material); m.frustumCulled = false; S.root.add(m); S.moths = { m, pos, data };
  const fN = 9, fp = new Float32Array(fN * 3), fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  const fm = new THREE.Points(fg, new THREE.PointsMaterial({ map: poolTex, color: 0xc9bea6, size: .02, transparent: true, opacity: 0, depthWrite: false })); fm.frustumCulled = false; fm.visible = false; S.root.add(fm); // weiche, staubige Punkte statt Quadrate
  S.fm = { m: fm, pos: fp, k: 0, still: 0, cx: 0, cy: 0, cz: 0, near: 0, nT: 0, ph: Array.from({ length: fN }, () => [rand(0, 6.28), rand(.5, 1.1), rand(2.2, 5), rand(.08, .3)]) };
}
function leben_mothTick(dt, t, indoor) {
  const S = leben_S, M_ = S.moths; if (!M_) return; const cam = camera.position, town = S.zone === 'town';
  for (let i = 0; i < M_.data.length; i++) { const d = M_.data[i]; let on, cx, cz, cy;
    if (d.L) { on = d.L.k > .3; cx = d.L.wx; cz = d.L.wz; cy = 4.85; } else { on = !d.pl.dead && d.pl.light.intensity > 1; cx = d.P.x; cz = d.P.z; cy = d.P.y; }
    if (!town || !on || Math.abs(cx - cam.x) > 45 || Math.abs(cz - cam.z) > 45) { M_.pos[i * 3 + 1] = -50; continue; }
    const a = t * d.sp + d.ph + Math.sin(t * 1.7 + d.ph * 3) * 1.2, rr = d.r * (.65 + .35 * Math.sin(t * 2.3 + d.ph * 5)); // unruhiger Flug: Richtungswechsel und Abstand zum Licht schwanken
    M_.pos[i * 3] = cx + Math.cos(a) * rr + Math.sin(t * 7 + d.ph) * .05; M_.pos[i * 3 + 1] = cy + d.h + Math.sin(t * 5 + d.ph) * .12 + Math.sin(t * 13.1 + d.ph * 2) * .04; M_.pos[i * 3 + 2] = cz + Math.sin(a * 1.3) * rr; }
  M_.m.geometry.attributes.position.needsUpdate = true;
  // Taschenlampe: wer still steht, bekommt Besuch
  const F = S.fm; F.nT -= dt; if (F.nT < 0) { F.nT = .5; F.near = 0; for (const L of lamps) if (L.k > .3 && Math.hypot(L.wx - player.pos.x, L.wz - player.pos.z) < 7) { F.near = 1; break; } }
  const ok = town && !indoor && flashOn && !F.near && Math.hypot(vel.x, vel.z) < .35 && !ch3.lampsOff && (state.started || false);
  F.still = ok ? F.still + dt : 0; const want = F.still > 4.5 ? 1 : 0; F.k += (want - F.k) * Math.min(1, dt * (want ? .45 : 1.4));
  if (F.k < .02) { if (F.m.visible) F.m.visible = false; return; }
  F.m.visible = true; F.m.material.opacity = Math.min(1, F.k * 1.1);
  const q = Math.min(1, dt * 2.5); F.cx += (cam.x + fwd.x * 2 - F.cx) * q; F.cy += (cam.y + fwd.y * 2 - .05 - F.cy) * q; F.cz += (cam.z + fwd.z * 2 - F.cz) * q;
  const spread = 2.6 - 1.8 * F.k;
  for (let i = 0; i < F.ph.length; i++) { const [p0, r, w, h] = F.ph[i], a = t * w + p0;
    F.pos[i * 3] = F.cx + Math.cos(a) * r * spread * .6 + Math.sin(t * 9 + p0) * .04; F.pos[i * 3 + 1] = F.cy + Math.sin(a * 1.3 + p0) * h * spread + Math.sin(t * 11 + p0) * .03; F.pos[i * 3 + 2] = F.cz + Math.sin(a) * r * spread * .6; }
  F.m.geometry.attributes.position.needsUpdate = true;
}

// =====================================================================  FENSTER: Licht an/aus, Fernseher, Schatten hinter dem Vorhang, Klopfen
function leben_shadowSetup() {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.75, .95), new THREE.MeshBasicMaterial({ map: silTex, color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
  m.visible = false; m.userData.noCol = true; leben_S.root.add(m); leben_S.shadow = { m, on: false, t: 0 };
}
function leben_winInit() {
  const S = leben_S, map = new Map();
  for (const w of litWindows) {
    if ((typeof s7 !== 'undefined' && w.g === s7.g) || (typeof s1 !== 'undefined' && w.g === s1.g)) continue; // begehbare Häuser: echtes Innenleben, nicht anfassen
    let r = map.get(w.mat);
    if (!r) { r = { mat: w.mat, wins: [], st: 'on', t: 0, own: null, pause: 0, tv: false, base: w.mat.emissiveIntensity > .1 ? w.mat.emissiveIntensity : 1.3, knock: false, tvT: 0, tvK: 1, tvC: [1, 1, 1], light: null }; map.set(w.mat, r); S.rooms.push(r); }
    w.g.updateMatrixWorld(true); const pos = w.g.localToWorld(new THREE.Vector3(w.x, w.y, w.z)), ry = w.ry + w.g.rotation.y;
    r.wins.push({ pos, ry, nx: Math.sin(ry), nz: Math.cos(ry) }); }
  // Fernseher: Zimmer mit genau einem Fenster im Erdgeschoss
  let n = 0; for (const r of S.rooms) if (n < 2 && r.wins.length === 1 && r.wins[0].pos.y < 2.8) { r.tv = true; n++; const w = r.wins[0];
    const L = new VLight(0x7f9cff, 0, 4.5, 2); L.position.set(w.pos.x + w.nx * .7, w.pos.y - .2, w.pos.z + w.nz * .7); scene.add(L); r.light = L; }
}
function leben_winSet(r, v) { r.mat.emissiveIntensity = v; r.own = v; }
function leben_winTick(dt, t, c1, live, indoor) {
  const S = leben_S, P = player.pos, active = c1 && !state.outage && S.zone === 'town';
  for (const r of S.rooms) {
    if (!active) { if (r.own !== null) { r.mat.emissive.setRGB(1, 1, 1); r.own = null; if (r.light) r.light.intensity = 0; } continue; }
    if (r.own !== null && Math.abs(r.mat.emissiveIntensity - r.own) > 1e-4) { r.pause = 30; r.own = null; r.mat.emissive.setRGB(1, 1, 1); if (r.light) r.light.intensity = 0; } // jemand anderes (Silhouette, Geschichte) hat eingegriffen
    if (r.pause > 0) { r.pause -= dt; continue; }
    if (dir.win && dir.win.w.mat === r.mat) continue;
    if (r.st === 'off') { r.t -= dt; if (r.t < 0) { r.st = 'flick'; r.t = rand(.25, .6); } else if (r.own !== 0) leben_winSet(r, 0); if (r.light) r.light.intensity = 0; continue; }
    if (r.st === 'flick') { r.t -= dt; leben_winSet(r, Math.random() < .5 ? 0 : r.base * rand(.5, 1)); if (r.t < 0) r.st = 'on'; continue; }
    if (r.tv) { r.tvT -= dt; if (r.tvT < 0) { r.tvT = rand(.08, .6); r.tvK = Math.random() < .08 ? rand(.05, .2) : rand(.45, 1.35); const c = r.tvC, k = Math.random(); if (k < .7) { c[0] = .4; c[1] = .56; c[2] = 1; } else if (k < .9) { c[0] = .24; c[1] = .32; c[2] = .86; } else { c[0] = .68; c[1] = .72; c[2] = .82; } } // Schnitte: kaltes Blau, tiefes Blau, fahles Weiß – manchmal fast schwarz
      const v = r.base * .9 * r.tvK * (.9 + Math.random() * .12); r.mat.emissive.setRGB(r.tvC[0], r.tvC[1], r.tvC[2]); leben_winSet(r, v); if (r.light) r.light.intensity = .9 * r.tvK; }
    else if (r.own !== r.base) leben_winSet(r, r.base);
  }
  if (!active) { if (S.shadow.on) { S.shadow.on = false; S.shadow.m.visible = false; } return; }
  // Licht aus – jemand geht ins Bett. Oder hört dich.
  S.T.win -= dt; if (S.T.win < 0) { S.T.win = rand(40, 90); if (live) { let best = null, bs = -1;
    for (const r of S.rooms) { if (r.tv || r.st !== 'on' || r.pause > 0) continue; for (const w of r.wins) { const d = Math.hypot(w.pos.x - P.x, w.pos.z - P.z); if (d < 10 || d > 55) continue; const f = leben_facing(w.pos.x, w.pos.y, w.pos.z); if (f < .35) continue; const s = f + Math.random(); if (s > bs) { bs = s; best = [r, w, d]; } } }
    if (best) { const [r, w, d] = best; r.st = 'off'; r.t = rand(12, 35); leben_winSet(r, 0); if (d < 20) Audio.play('switch2', { gain: .12, x: w.pos.x, y: w.pos.y, z: w.pos.z, ref: 2, lp: 2500 }); } } }
  // Schatten hinter dem Vorhang
  const sh = S.shadow;
  if (sh.on) leben_shadowTick(dt, t);
  else { S.T.sh -= dt; if (S.T.sh < 0) { S.T.sh = rand(20, 45); if (live) leben_shadowStart(false); } }
  // Klopfen von innen, wenn du zu nah am Fenster stehst (einmal pro Haus)
  S.T.knockChk -= dt; if (S.T.knockChk < 0 && live && !indoor) { S.T.knockChk = .3;
    for (const r of S.rooms) { if (r.knock || r.st !== 'on') continue; for (const w of r.wins) { if (w.pos.y > 2.8 || Math.hypot(w.pos.x - P.x, w.pos.z - P.z) > 2.3) continue; r.knock = true;
      if (Math.random() < .45) { const x = w.pos.x, y = w.pos.y, z = w.pos.z; for (let i = 0; i < 3; i++) setTimeout(() => { Audio.play('glass1', { gain: .5, rate: rand(.5, .62), x, y, z, ref: 2 }); Audio.thump(x, y, z); }, 400 + i * rand(240, 320));
        setTimeout(() => { if (!state.outage && r.st === 'on' && r.pause <= 0) { r.st = 'off'; r.t = rand(25, 60); leben_winSet(r, 0); } }, 1900); } break; } } }
}
function leben_shadowStart(force) {
  const S = leben_S, P = player.pos, sh = S.shadow; if (sh.on) return false; let best = null, bs = -1;
  for (const r of S.rooms) { if (r.st !== 'on' || r.pause > 0 || (dir.win && dir.win.w.mat === r.mat)) continue;
    for (const w of r.wins) { const d = Math.hypot(w.pos.x - P.x, w.pos.z - P.z); if (d < 7 || d > 42) continue; const f = leben_facing(w.pos.x, w.pos.y, w.pos.z); if (f < (force ? .2 : .6)) continue; const s = f + Math.random() * .3; if (s > bs) { bs = s; best = [r, w]; } } }
  if (!best) return false;
  const [r, w] = best; sh.on = true; sh.r = r; sh.w = w; sh.t = 0; sh.seen = 0; sh.stay = Math.random() < .28; sh.dir = Math.random() < .5 ? 1 : -1; sh.dur = rand(2.2, 3.2);
  sh.m.visible = true; sh.m.rotation.set(0, w.ry, 0); sh.m.material.opacity = 0; return true;
}
function leben_shadowTick(dt, t) {
  const S = leben_S, sh = S.shadow, w = sh.w, r = sh.r, m = sh.m; sh.t += dt;
  const end = () => { sh.on = false; m.visible = false; m.material.opacity = 0; };
  if (r.st !== 'on' || state.outage) return end();
  const rx = Math.cos(w.ry), rz = -Math.sin(w.ry); let off, op;
  if (!sh.stay) { const k = sh.t / sh.dur; if (k >= 1) return end(); off = (k - .5) * .72 * sh.dir; op = .6 * Math.sin(PI * k); }
  else { const k = Math.min(1, sh.t / 1.6); off = (1 - k) * .36 * sh.dir; op = .78 * k;
    if (k >= 1) { const f = leben_facing(w.pos.x, w.pos.y, w.pos.z), d = Math.hypot(w.pos.x - player.pos.x, w.pos.z - player.pos.z); if (f > .985 && d < 45) sh.seen += dt;
      if (sh.seen > .7 || sh.t > 16) { if (sh.seen > .7) { r.st = 'off'; r.t = rand(25, 60); leben_winSet(r, 0); if (d < 22) Audio.play('switch2', { gain: .12, x: w.pos.x, y: w.pos.y, z: w.pos.z, ref: 2 }); } return end(); } } }
  const bob = sh.stay && sh.t > 1.6 ? 0 : Math.abs(Math.sin(sh.t * 5.2)) * .018;
  m.position.set(w.pos.x + w.nx * .04 + rx * off, w.pos.y + (sh.stay ? -.12 : .1) + bob, w.pos.z + w.nz * .04 + rz * off); m.material.opacity = op; // wer vorbeigeht, ist erwachsen – wer stehen bleibt, ein Kind
}
function leben_tvVoice(dt, live) { // gedämpfte Stimmen aus dem Fernseher, nur ganz nah am Fenster
  const S = leben_S; if (!Audio.ctx || !Audio.started) return; const P = player.pos; let near = null, nd = 9;
  if (S.zone === 'town' && !ch3.on && !state.ch2 && !state.outage) for (const r of S.rooms) if (r.tv && r.st === 'on' && r.pause <= 0) { const w = r.wins[0], d = Math.hypot(w.pos.x - P.x, w.pos.z - P.z); if (d < nd) { nd = d; near = w; } }
  if (!near && !S.tvVoice) return;
  if (!S.tvVoice) { const ctx = Audio.ctx, p = Audio.at(0, -50, 0, 1.5, { dauer: 1e9 }), g = ctx.createGain(); g.gain.value = 0; g.connect(p); const n = Audio.noise(true), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 2.2;
    const am = ctx.createGain(); am.gain.value = 0; n.connect(bp); bp.connect(am); am.connect(g); S.tvVoice = { p, g, am, bp, t: 0 }; }
  const V = S.tvVoice; V.t -= dt; if (V.t > 0) return; V.t = rand(.09, .2); const tt = Audio.ctx.currentTime;
  if (near) { Audio.setze(V.p, near.pos.x, near.pos.y, near.pos.z); V.bp.frequency.setTargetAtTime(rand(380, 780), tt, .03); V.am.gain.setTargetAtTime(Math.random() < .25 ? 0 : rand(.4, 1), tt, .03); }
  V.g.gain.setTargetAtTime(near ? .09 : 0, tt, .25);
}

// =====================================================================  SPINNEN: Kreuzspinnen in den Netzen, eine seilt sich ab
async function leben_spiderSetup() {
  const S = leben_S; if (!S.skc) return;
  // 08.10.2026: eigene Kreuzspinne (Blender, spinnen.js → spn_neu): jede anders groß/gefärbt; Kopf des Modells zeigt nach −z → im Halter um 180° gedreht (+z = Kopf, wie bisher)
  let make = null;
  if (typeof spn_neu === 'function') try { await spn_art('kreuz');
    make = async () => { const n = await spn_neu('kreuz', { spann: rand(.06, .08) }), g = new THREE.Group(); n.g.rotation.y = PI; g.add(n.g); g.userData.noCol = true; scene.add(g);
      n.acts.idle.timeScale = .35; n.acts.idle.play(); n.acts.walk.timeScale = 1.4; n.mx.update(rand(0, 4)); return { g, mx: n.mx, acts: { idle: n.acts.idle, walk: n.acts.walk }, cur: n.acts.idle }; }; } catch (e) { console.warn('leben: Kreuzspinne (neu)', e); make = null; }
  if (!make) make = await leben_spiderAlt(S); if (!make) return;
  // Spinnweben aus dem Spiel (Häuser 7 und 1, Keller, Amt) – in gut der Hälfte sitzt jetzt eine Spinne
  const rects = [[20.2, 31.8, -21.8, -12.2], [-55.8, -44.2, -21.8, -12.2], [B.x - 5, B.x + 5, B.z - 4, B.z + 4], [C2.x + 18, C2.x + 30, C2.z - 6, C2.z + 6], [C2.x + 36, C2.x + 46, C2.z - 5, C2.z + 5], [C2.x, C2.x + 18, C2.z - 2, C2.z + 2]];
  const webs = []; scene.traverse(o => { if (o.isMesh && o.renderOrder === 2 && o.material && o.material.alphaTest === .12 && o.material.depthWrite === false && o.material.side === THREE.DoubleSide) webs.push(o); });
  scene.updateMatrixWorld(true);
  for (const w of webs) { if (Math.random() < .4 || S.webs.length >= 12) continue; const p = w.getWorldPosition(new THREE.Vector3()), R = rects.find(([a, b, c, d]) => p.x > a - .5 && p.x < b + .5 && p.z > c - .5 && p.z < d + .5); if (!R) continue;
    const sp = await make(); sp.g.visible = false; sp.web = p; sp.R = R; sp.T = rand(3, 12); sp.walkT = 0; sp.off = new THREE.Vector2(); sp.scared = 0; S.webs.push(sp); } // Platz erst, wenn die Decken fest sind (leben_webPlace)
  // Die, die sich abseilt
  const d = await make(); d.g.visible = false; const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xd0d0d0, transparent: true, opacity: .32, depthWrite: false })); line.frustumCulled = false; line.visible = false; line.userData.noCol = true; scene.add(line);
  S.drop = Object.assign(d, { line, st: 'wait', T: rand(40, 80), x: 0, y: 0, z: 0, top: 0, low: 0, t: 0 });
}
// Bisheriges Fab-Modell (spider_cross) – nur noch Rückfall, falls die neuen Spinnen fehlen
async function leben_spiderAlt(S) {
  const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');
  const mgr = new THREE.LoadingManager(); mgr.setURLModifier(u => /\.(psd|png|jpe?g|tga|tif)$/i.test(u) && !u.startsWith('data:') ? MS_DATA_PNG : u);
  const src = await new FBXLoader(mgr).loadAsync('assets/spider_cross/model.fbx');
  const tx = new THREE.TextureLoader().load('assets/spider_cross/color.jpg'); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ map: tx, roughness: .55, color: 0xc4b4a4 });
  src.traverse(m => { if (m.isMesh) { m.material = mat; m.castShadow = false; m.receiveShadow = false; } });
  src.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(src), sz = bb.getSize(new THREE.Vector3()); src.scale.multiplyScalar(.085 / Math.max(sz.x, sz.z, 1e-6));
  const A = src.animations || [], idle = A.find(a => a.name === 'idle') || A[0], walk = A.find(a => a.name === 'walk') || idle; if (!idle) return null;
  return async () => { const o = S.skc(src), g = new THREE.Group(); g.add(o); g.userData.noCol = true; scene.add(g); const mx = new THREE.AnimationMixer(o), acts = { idle: mx.clipAction(idle), walk: mx.clipAction(walk) }; acts.idle.timeScale = .35; acts.idle.play(); mx.update(rand(0, 4)); return { g, mx, acts, cur: acts.idle }; };
}
// Unterste Decke über einem Punkt (echte Form)
function leben_ceil(x, y, z) {
  let best = Infinity; const list = solidNear(x, z);
  for (let i = 0; i < list.length; i++) { const it = list[i], bb = it.bb; if (x < bb.min.x || x > bb.max.x || z < bb.min.z || z > bb.max.z || bb.max.y < y || it.soft || !solidLive(it)) continue;
    leben_ray.origin.set(x, y, z).applyMatrix4(it.inv); leben_ray.direction.set(0, 1, 0).transformDirection(it.inv);
    const h = it.o.geometry.boundsTree.raycastFirst(leben_ray, THREE.DoubleSide); if (!h) continue; const py = leben_V[0].copy(h.point).applyMatrix4(it.mw).y; if (py > y && py < best) best = py; }
  return best;
}
// Kreuzspinne ins Netz: Kopf nach unten, Rücken zum Raum, sicher unter der Decke (die Netze ragen teils hinein)
function leben_webPlace() {
  const up = new THREE.Vector3(), fw = new THREE.Vector3(0, -1, 0), rt = new THREE.Vector3();
  for (const sp of leben_S.webs) { const p = sp.web, R = sp.R; up.set((R[0] + R[1]) / 2 - p.x, 0, (R[2] + R[3]) / 2 - p.z).normalize();
    const c = leben_ceil(p.x + up.x * .06, p.y - .6, p.z + up.z * .06), y = Math.min(p.y - .03, (c < 99 ? c : p.y + .2) - .1 - rand(0, .08));
    rt.crossVectors(up, fw).normalize(); sp.g.position.set(p.x + up.x * .035, y, p.z + up.z * .035); sp.g.quaternion.setFromRotationMatrix(leben_M4.makeBasis(rt, up, fw)); sp.g.scale.setScalar(rand(.85, 1.15));
    sp.home = sp.g.position.clone(); sp.fw = fw.clone(); sp.rt = rt.clone(); sp.g.visible = true; }
}
function leben_spiderTick(dt, t, indoor, live) {
  const S = leben_S, cam = camera.position, P = player.pos;
  for (const sp of S.webs) { if (!sp.home) continue; const dx = sp.home.x - cam.x, dz = sp.home.z - cam.z, near = dx * dx + dz * dz < 144; if (sp.g.visible !== near) sp.g.visible = near; if (!near || dx * dx + dz * dz > 81) continue;
    sp.mx.update(dt); sp.T -= dt;
    const d = Math.hypot(dx, sp.home.y - cam.y, dz), lit = flashOn && d < 2.6 && leben_facing(sp.home.x, sp.home.y, sp.home.z) > .96;
    if (lit && sp.scared <= 0) { sp.scared = 6; sp.walkT = rand(.7, 1.2); sp.vx = rand(-.3, .3); sp.vy = -1; } // ins Licht geraten: nach oben in die Ecke
    else if (sp.T < 0 && sp.walkT <= 0) { sp.T = rand(5, 14); sp.walkT = rand(.25, .6); sp.vx = rand(-1, 1); sp.vy = rand(-1, 1); }
    sp.scared -= dt;
    if (sp.walkT > 0) { sp.walkT -= dt; if (sp.cur !== sp.acts.walk) { sp.acts.walk.reset().fadeIn(.1).play(); sp.cur.fadeOut(.1); sp.cur = sp.acts.walk; }
      sp.off.x = Math.max(-.07, Math.min(.07, sp.off.x + sp.vx * .06 * dt)); sp.off.y = Math.max(-.05, Math.min(.12, sp.off.y + sp.vy * .08 * dt));
      sp.g.position.copy(sp.home).addScaledVector(sp.rt, sp.off.x).addScaledVector(sp.fw, sp.off.y); }
    else if (sp.cur !== sp.acts.idle) { sp.acts.idle.reset().fadeIn(.2).play(); sp.cur.fadeOut(.2); sp.cur = sp.acts.idle; } }
  // Abseilen: nur in den begehbaren Häusern, wenn du still stehst
  const D = S.drop; if (!D) return;
  if (D.st === 'wait') { const r = leben_inHouse(P.x, P.z, -.2); if (!r || !live || state.inBasement || dir.busy || Math.hypot(vel.x, vel.z) > .5) return; D.T -= dt; if (D.T > 0) return; D.T = rand(50, 120);
    const f = flatDir(), k = rand(.8, 1.05), x = P.x + f.x * k, z = P.z + f.z * k; if (x < r.x0 + .35 || x > r.x1 - .35 || z < r.zb + .35 || z > r.zf - .35) return;
    const top = (typeof H7 !== 'undefined' ? H7.H : 3.2) - .02; for (const y of [1.5, 2.2, 2.9]) if (!leben_free(x, z, y, .12)) return;
    Object.assign(D, { st: 'down', x, z, top, low: cam.y + .02 + rand(-.08, .06), y: top, t: 0 }); D.g.visible = true; D.line.visible = true; }
  if (D.st === 'wait') return;
  D.t += dt; D.mx.update(dt);
  const dh = Math.hypot(D.x - P.x, D.z - P.z);
  if (D.st === 'down') { D.y = Math.max(D.low, D.y - dt * (.12 + .4 * Math.min(1, D.t))); if (D.y <= D.low + 1e-3) { D.st = 'hang'; D.t = 0; D.hang = rand(5, 7.5); } }
  else if (D.st === 'hang') { if (D.t > D.hang || dh < .38 || !leben_inHouse(P.x, P.z, 0)) { D.st = 'up'; D.fast = dh < .38; } }
  else if (D.st === 'up') { D.y = Math.min(D.top, D.y + dt * (D.fast ? 1.3 : .28)); if (D.y >= D.top - 1e-3) { D.st = 'wait'; D.g.visible = false; D.line.visible = false; return; } }
  const sw = Math.sin(D.t * 1.7) * .012; D.g.position.set(D.x + sw, D.y - .035, D.z + Math.cos(D.t * 1.3) * .008);
  const ax = cam.x - D.x, az = cam.z - D.z, al = Math.hypot(ax, az) || 1; leben_V[0].set(ax / al, 0, az / al); leben_V[1].set(0, -1, 0); leben_V[2].crossVectors(leben_V[0], leben_V[1]);
  D.g.quaternion.setFromRotationMatrix(leben_M4.makeBasis(leben_V[2], leben_V[0], leben_V[1])); D.g.rotateZ(Math.sin(D.t * .6) * .6); // dreht sich langsam am Faden
  const a = D.line.geometry.attributes.position; a.setXYZ(0, D.x, D.top + .02, D.z); a.setXYZ(1, D.g.position.x, D.y, D.g.position.z); a.needsUpdate = true;
}

// =====================================================================  WIND: Fensterläden, Gartentore, Schrottblech, Schaukel
function leben_windTick(dt, t, c3, live) {
  const S = leben_S, P = player.pos, town = S.zone === 'town';
  if (town && gustT > 0 && !(S.prev.gust > 0) && !c3 && state.started) { // Böe setzt ein
    let n = 0; for (const { g, o } of HOUSES) { if (!o.shutters || n >= 2) continue; const d = Math.hypot(g.position.x - P.x, g.position.z - P.z); if (d < 12 || d > 45) continue; n++;
      const x = g.position.x + rand(-4, 4), z = g.position.z + (o.facing ?? 1) * (o.d ?? 9) / 2; setTimeout(() => leben_shutter(x, z), rand(600, 3000)); }
    if (Math.hypot(118 - P.x, -18 - P.z) < 90) setTimeout(() => Audio.play('metalSheet', { gain: .5, rate: rand(.6, .8), x: 118 + rand(-10, 10), y: 1.5, z: -18 + rand(-8, 8), ref: 7 }), rand(800, 2500));
  }
  S.prev.gust = gustT;
  const g0 = c3 ? 0 : gust;
  for (let i = 0; i < gates.length; i++) { const G_ = gates[i], pv = G_.piv; let tw = false; for (let k = 0; k < tweens.length; k++) if (tweens[k].obj === pv) { tw = true; break; }
    if (!G_.open || tw || !town) { G_.lbOn = false; if (!G_.open && !tw && town && g0 > .45) { G_.lbR = (G_.lbR ?? rand(1, 3)) - dt; if (G_.lbR < 0) { G_.lbR = rand(1.2, 3.5); if (Math.hypot(G_.gapX - P.x, G_.z - P.z) < 22) { Audio.play('metalHit2', { gain: .05, rate: rand(1.5, 1.9), x: G_.gapX + .9, y: .8, z: G_.z, ref: 2 }); } } } continue; }
    if (!G_.lbOn) { G_.lbOn = true; G_.lbBase = pv.rotation.y; G_.lbV = 0; }
    const amp = (.022 + g0 * .17) * (.6 + .4 * Math.sin(t * .37 + i)), v = Math.sin(t * (1.25 + i * .13) + i * 1.7); pv.rotation.y = G_.lbBase + v * amp;
    if (Math.sign(v) !== G_.lbV) { G_.lbV = Math.sign(v); if (amp > .08 && Math.hypot(G_.gapX - P.x, G_.z - P.z) < 20) Audio.play(Audio.pick('woodSqueak1', 'woodSqueak2'), { gain: .06 + amp * .3, rate: rand(.8, 1.1), x: G_.gapX, y: 1, z: G_.z, ref: 2 }); } }
  // Reifenschaukel: in der Böe weiter ausholen – oder mitten im Schwung stehen bleiben (mit umwelt.js: Pendel dort, das liest leben_S.swingHold)
  if (typeof umwelt_pendel !== 'function' && typeof swing !== 'undefined' && swing.piv) { const H = S.swingHold;
    if (H) { H.t += dt; const k = H.t < H.dur ? 1 : Math.max(0, 1 - (H.t - H.dur) / .7); swing.piv.rotation.x = H.a * k + swing.piv.rotation.x * (1 - k); if (k <= 0) S.swingHold = null; }
    else swing.piv.rotation.x *= 1 + g0 * .9; }
}

// =====================================================================  REAKTIONEN auf die Geschichte: Tiere spüren, was du nicht siehst
function leben_reactTick(dt) {
  const S = leben_S, pv = S.prev, P = player.pos; if (S.zone !== 'town') { pv.st = false; return; }
  const st = stalker.visible; if (st && !pv.st) { const p = stalker.position; leben_scare(p.x, p.z, 22); leben_crowScare(p.x, p.z, 28); } pv.st = st;
  if (sparks.life > 1.4 && !(pv.spark > 1.4)) { leben_scare(sparks.pos[0], sparks.pos[2], 30); leben_crowScare(sparks.pos[0], sparks.pos[2], 45); } pv.spark = sparks.life;
  S.T.react -= dt; if (dir.carState === 'drive' && S.T.react < 0) { S.T.react = .3; const p = ghostCar.position; leben_scare(p.x, p.z, 8); leben_crowScare(p.x, p.z, 14); }
  if (state.ufoOn && !pv.ufo) { leben_crowScare(P.x, P.z, 400); leben_scare(P.x, P.z, 60); const a = rand(0, 6.28); Audio.bark(P.x + Math.cos(a) * 80, P.z + Math.sin(a) * 80, true); } pv.ufo = state.ufoOn;
  for (const e of eyePairs) { const v = e.m.visible; if (v && !e.lbv) { const p = e.m.position; if (leben_scare(p.x, p.z, 9) > 0 && Math.random() < .6) leben_hiss(p.x, p.y, p.z); } e.lbv = v; } // Katzenaugen: die Ratten wissen es zuerst
  leben_beobBlick(dt);
}
// Katzenaugen und der Beobachter (F3 AP-07, Dossier 82 §3.3/S-17): Katzen sehen ihn immer. Ist er (auch unsichtbar) näher als 15 m, drehen sich ihre Augen
// zu ihm, nicht zu Luke (Blick folgt Sprüngen mit ~0,5 s); näher als 4 m fauchen sie in seine Richtung. Läuft nach der Basis (die richtet die Augen auf die Kamera aus).
const leben_BB = new THREE.Vector3();
function leben_beobBlick(dt) {
  const bp = typeof beob_pos === 'function' ? beob_pos() : null; if (!bp) return;
  for (const e of eyePairs) { if (!e.m.visible) { e.bk = 0; continue; } const p = e.m.position, d = Math.hypot(bp.x - p.x, bp.z - p.z);
    const want = d < 15 ? 1 : 0; e.bk = (e.bk || 0) + (want - (e.bk || 0)) * Math.min(1, dt * 2); if (e.bk < .02) continue;
    leben_BB.copy(camera.position).lerp(bp, .72 * e.bk); leben_BB.y = Math.max(leben_BB.y, p.y); e.m.lookAt(leben_BB); e.m.scale.x = 1 - .45 * e.bk; // halb abgewandt: schmaler
    e.hissT = (e.hissT || 0) - dt; if (d < 4 && e.hissT < 0) { e.hissT = rand(12, 25); leben_hiss(p.x + (bp.x - p.x) * .15, p.y, p.z + (bp.z - p.z) * .15); } }
}

// =====================================================================  WETTER: Schauer, Bodennebel, der atmet
function leben_skyTick(dt, t, c1) {
  const S = leben_S, W = S.wx, town = S.zone === 'town';
  W.T -= dt; if (W.T < 0 && c1 && town && state.started) { W.T = rand(170, 330); W.dur = rand(35, 70); W.t = 0; W.on = true; }
  if (W.on) { W.t += dt; W.k = Math.max(0, Math.min(1, W.t / 8, (W.dur - W.t) / 10)); if (W.t > W.dur || !c1) { W.on = false; W.k = 0; } } else W.k = 0;
  rain.m.material.opacity = .12 + .09 * W.k;
  W.at -= dt; if (W.at < 0 && Audio.ctx && Audio.rain && town && Audio.area !== 'b') { W.at = .5; if (W.k > 0 || W.was) Audio.rain.gain.setTargetAtTime((Audio.area === 'o' ? .5 : .16) * (1 + .7 * W.k), Audio.ctx.currentTime, .8); W.was = W.k > 0; }
  if (town && W.fogBase) fogUniforms.strength.value = W.fogBase * (.82 + .32 * (.5 + .5 * Math.sin(t * .011 + 1.3)) * (.6 + .4 * Math.sin(t * .027)) + .18 * W.k);
}

// =====================================================================  UHR: Weltuhr je Kapitel (PK-G G-1) · Kapellenglocke vom Kirchberg
// clk.min = Minuten seit Mitternacht des Kapiteltags (läuft über 24:00 weiter) · 25 s Spielzeit = eine Minute in Lost Eyengless
// schlag: nur diese Stunden schlagen (Stunde → Schläge); ohne Angabe gewöhnlich (1–12) · steht: Uhr läuft nicht · aus: ab dem Stromausfall steht die Kapellenuhr
const LEBEN_UHR = {
  1: { start: 23 * 60 + 4, schlag: { 0: 12, 1: 13 }, aus: true }, // 01:00 dreizehn statt einem – „zur falschen Stunde“; nie 03:00/03:13
  2: { start: 1 * 60 + 4, steht: true, schlag: {} },  // unter der Erde; die Amt-Uhren sind skriptgesteuert
  3: { start: 3 * 60 + 13, steht: true, schlag: {} }, // 03:13 steht; einmal 3 + 13 zu Kapitelbeginn über leben_bell3plus13()
  4: { start: 7 * 60 + 40 },
  5: { start: 18 * 60 + 10 },                         // Sprünge an Beats über leben_uhr(hh, mm)
  6: { start: 2 * 60 + 10 },
};
const LEBEN_BELL_GAP = 3.3, LEBEN_BELL_PAUSE = 2; // Sekunden zwischen zwei Schlägen · Zusatzpause zwischen den drei und den dreizehn
const LEBEN_BELL313_SUB = ['Die Glocke auf dem Kirchberg. Drei Schläge. Pause.', 'Dann dreizehn. Du zählst mit, ohne es zu wollen.'];
function leben_uhrKap() { return typeof kap === 'function' ? kap() : curChapter(); }
function leben_uhrSync() { // Kapitelwechsel (auch nach dem Laden): Uhr auf den Kapitelstart
  const K = leben_S.clk, k = leben_uhrKap(); if (K.kap === k) return K;
  const U = LEBEN_UHR[k] || LEBEN_UHR[1]; K.kap = k; K.min = U.start; K.h = Math.floor(U.start / 60); K.pend = 0; K.c3 = false; return K;
}
function leben_uhrCount(h) { const U = LEBEN_UHR[leben_S.clk.kap], hh = h % 24; if (!U) return 0; return U.schlag ? (U.schlag[hh] || 0) : (hh % 12 || 12); }
// Schlagfolge ohne Timer-Ketten: der Takt schlägt zur Zeit clk.qAt (performance.now) – keine Allokation pro Bild
function leben_bellSeq(n, pauseAfter, amp, sub, hush) {
  const K = leben_S.clk; if (K.qr) { const r = K.qr; K.qr = null; r(); }
  K.q = n; K.qi = 0; K.qp = pauseAfter; K.qa = amp; K.qs = sub; K.qh = hush; K.qAt = performance.now() + 250;
}
function leben_bellRun(now) {
  const K = leben_S.clk;
  if (K.hushAt && now >= K.hushAt) { K.hushAt = 0; leben_hush(9); }
  if (!(K.q > 0) || now < K.qAt) return;
  const i = K.qi++; K.q--; K.n = (K.n || 0) + 1;
  leben_bellStrike(K.qa * rand(.94, 1.04), false);
  if (i === 0) { leben_crowScare(leben_CHAPEL.x, leben_CHAPEL.z, 70); const P = player.pos; if (Math.random() < .5) leben_crowScare(P.x, P.z, 30); }
  if (K.qs && (i === 1 || i === 4) && !state.talking && !ui.overlay) subtitle(LEBEN_BELL313_SUB[i === 1 ? 0 : 1], i === 1 ? 4600 : 5600);
  if (K.q > 0) { K.qAt = now + (LEBEN_BELL_GAP + (K.qi === K.qp ? LEBEN_BELL_PAUSE : 0) + rand(-.05, .05)) * 1000; return; }
  if (K.qr) { const r = K.qr; K.qr = null; r(); }
  if (K.qh) K.hushAt = now + 2500;
}
// T10 · drei Schläge (3,3 s), 2 s Pause, dreizehn Schläge. In Kapitel 3 genau einmal, nur dort mit Untertiteln. Promise: löst beim letzten Schlag auf
function leben_bell3plus13() {
  const K = leben_uhrSync(), c3 = K.kap === 3; if (c3 && K.c3) return Promise.resolve(); if (c3) K.c3 = true;
  let res; const p = new Promise(r => { res = r; });
  leben_bellSeq(16, 3, .75, c3, true); K.qr = res; console.log('[uhr] 3 + 13 Schläge');
  setTimeout(() => { if (K.qr === res) { K.qr = null; res(); } }, 62000); // Sicherung, falls der Takt nicht läuft
  return p;
}
function leben_bell313() { return leben_bell3plus13(); } // alter Name, nur noch für den Testzugriff __leben.bell
// Zeitsprung (Kap. 5/6, z. B. leben_uhr(23, 0)): nie rückwärts. Landet der Sprung auf einer neuen vollen Stunde, schlägt sie sofort; schlag === true erzwingt, false unterdrückt
function leben_uhr(hh, mm = 0, schlag) {
  const K = leben_uhrSync(); let t = hh * 60 + mm; while (t < K.min - 720) t += 1440;
  if (t > K.min) K.min = t;
  const h = Math.floor(K.min / 60), neu = h > K.h; if (neu) { K.h = h; K.pend = 0; }
  if (schlag === true || (schlag !== false && neu && K.min % 60 === 0)) { const n = leben_uhrCount(h) || (h % 12 || 12); leben_bellSeq(n, -1, .68, false, false); console.log('[uhr] ' + (h % 24) + ':00 · ' + n + ' Schläge (Sprung)'); }
  return K.min;
}
function leben_clockTick(dt, c1, c3, live) {
  const S = leben_S, K = leben_uhrSync(), U = LEBEN_UHR[K.kap] || LEBEN_UHR[1];
  if (!U.steht && state.started && !state.ending && !(U.aus && state.outage) && !(typeof traum_S !== 'undefined' && traum_S.on)) {
    K.min += dt / 25;
    if (K.kap === 1 && !state.heardTape && K.min > 1495) { K.min = 1495; S.k1Steht = (S.k1Steht || 0) + dt; // H-6 (Story-Prüfung): die Uhr bleibt bei fünf vor eins stehen, bis Lucys Band gehört ist
      if (S.k1Steht > 420 && !state.talking && !ui.overlay && typeof gedanke === 'function') gedanke('k1_fuenfvoreins', 'Fünf vor eins. Seit einer Ewigkeit fünf vor eins.', 0, 2); }
    const h = Math.floor(K.min / 60); if (h > K.h) { K.h = h; const n = leben_uhrCount(h); if (n) { K.pend = n; K.pendAt = K.min; } } }
  if (K.pend) { // schlägt, sobald nichts läuft und man draußen im Ort ist – höchstens 30 Spielminuten später, nach dem Stromausfall gar nicht
    if (K.min - K.pendAt > 30 || (U.aus && state.outage)) K.pend = 0;
    else if (!(K.q > 0) && live && S.zone === 'town') { const n = K.pend; K.pend = 0; leben_bellSeq(n, -1, n === 13 ? .7 : .65, false, n === 13); console.log('[uhr] ' + (K.h % 24) + ':00 · ' + n + ' Schläge'); } }
  leben_bellRun(performance.now());
}
window.__uhr = { S: leben_S.clk, T: LEBEN_UHR, uhr: (hh, mm, s) => leben_uhr(hh, mm, s), bell3plus13: () => leben_bell3plus13(), kap: leben_uhrKap }; // Testzugriff

// =====================================================================  FERNE GERÄUSCHE & UNERKLÄRLICHES (selten, nie gleichzeitig, nie in Dialogen)
const leben_EV = {
  dog() { // Ein Hund bellt – und verstummt mitten im Bellen. Danach: nichts. Nicht mal die Grillen.
    if (!Audio.ctx || !Audio.buf.dog) return false;
    const P = player.pos, a = rand(0, 6.28), d = rand(70, 115), x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d;
    const h = Audio.play('dog', { gain: .6, vary: .06, x, y: .6, z, ref: 7 }); if (!h) return false;
    const cut = Math.min(Audio.buf.dog.duration * 700, rand(2600, 4300)); // mitten im Bellen: abgeschnitten
    setTimeout(() => { h.stop(.02); setTimeout(() => leben_hush(rand(7, 10)), 700); }, cut);
    if (story.items && story.items.includes('collar') && !leben_S.far.bruno) { leben_S.far.bruno = true; setTimeout(() => { if (!state.talking && !ui.overlay) subtitle('Ein Hund, irgendwo hinter den Höfen. Er klingt wie Bruno. Dann – nichts mehr.', 4600); }, cut + 1800); } // STORY-HOOK: Bruno / Herr Vegas
    return true; },
  car() { // Ein Auto in der Ferne kommt die Landstraße herauf, hält hinter der Sperre. Motor aus. Eine Tür. Niemand kommt.
    if (dir.carState === 'drive' || leben_S.far.car || !Audio.ctx || !Audio.buf.carEngine) return false;
    const p = Audio.at(290, .6, -1.5, 18), l = Audio.play('carEngine', { loop: true, gain: .9, lp: 700, dest: p, fadeIn: 4 }); if (!l) return false;
    const F = leben_S.far; if (!F.hl) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      F.hl = new THREE.Points(g, new THREE.PointsMaterial({ map: poolTex, color: 0xfff0d0, size: 2.4, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); F.hl.frustumCulled = false; F.hl.visible = false; leben_S.root.add(F.hl); }
    F.car = { p, l, x: 290, z: rand(-2.4, -1.2), stop: rand(152, 164), v: 13, st: 'come', t: 0, idle: rand(5, 9), door: false }; F.hl.visible = true; return true; },
  chains() { const P = player.pos, a = rand(0, 6.28), d = rand(14, 26); Audio.chains(P.x + Math.cos(a) * d, .4, P.z + Math.sin(a) * d); return true; }, // Eine Hundekette schleift über Beton. Kein Hund.
  giggle() { const P = player.pos, d = Math.hypot(P.x - leben_PLAY.x, P.z - leben_PLAY.z); if (d > 80 || d < 12) return false; // Kinderlachen vom Spielplatz. Um diese Uhrzeit.
    Audio.giggle(leben_PLAY.x, 1, leben_PLAY.z); setTimeout(() => Audio.play('woodSqueak2', { gain: .35, rate: .55, x: leben_PLAY.x + 2, y: 1.8, z: leben_PLAY.z, ref: 4 }), 900); return true; },
  silence() { leben_hush(rand(7, 10)); return true; }, // Alles hält den Atem an
  crowsTurn() { let n = 0; const P = player.pos; for (const W of leben_S.crows) if (leben_perched(W) && Math.hypot(W.c.g.position.x - P.x, W.c.g.position.z - P.z) < 50) n++; if (n < 3) return false;
    leben_S.turn = { t: rand(6, 9), x: leben_CHAPEL.x, z: leben_CHAPEL.z }; return true; }, // Alle Krähen drehen sich gleichzeitig zum Kirchberg
  swingFreeze() { if (typeof swing === 'undefined' || !swing.piv || !swing.piv.parent) return false; let vis = true; for (let p = swing.piv; p; p = p.parent) if (!p.visible) vis = false; const d = Math.hypot(player.pos.x - swing.x, player.pos.z - swing.z);
    if (!vis || d < 7 || d > 28 || leben_facing(swing.x, 2, swing.z) < .75) return false; leben_S.swingHold = { t: 0, dur: rand(3.5, 5), a: swing.piv.rotation.x }; return true; }, // Die Schaukel bleibt mitten im Schwung stehen
  ratRun() { const S = leben_S, P = player.pos; let n = 0; const a = rand(0, 6.28), sx = P.x + Math.cos(a) * 25, sz = P.z + Math.sin(a) * 25;
    for (const R of S.rats) if (R.on && R.g.visible && !R.far && Math.hypot(R.g.position.x - P.x, R.g.position.z - P.z) < 26) { leben_ratFlee(R, sx, sz); n++; }
    if (n < 1) return false; setTimeout(() => leben_squeak(P.x + Math.cos(a + PI) * 6, .1, P.z + Math.sin(a + PI) * 6, 5, .05), 400); return true; }, // Alle Ratten rennen in dieselbe Richtung – weg von etwas
  shutter() { const P = player.pos; const H = HOUSES.filter(h => h.g.visible !== false && Math.hypot(h.g.position.x - P.x, h.g.position.z - P.z) > 12 && Math.hypot(h.g.position.x - P.x, h.g.position.z - P.z) < 50); if (!H.length) return false;
    const h = H[Math.floor(Math.random() * H.length)]; leben_shutter(h.g.position.x + rand(-4, 4), h.g.position.z + (h.o.facing ?? 1) * (h.o.d ?? 9) / 2); return true; },
};
const leben_EVW = [['dog', 1, 240], ['car', .9, 300], ['chains', .7, 140], ['giggle', .5, 300], ['silence', .45, 220], ['crowsTurn', .6, 160], ['swingFreeze', .6, 180], ['ratRun', .6, 120], ['shutter', 1, 50]];
// Familie und Klasse für die Regie (spannung): Unerklärliches ist „minor“, Nachbarschaftsgeräusche sind Umgebung
const leben_EVR = { dog: ['dogcut', 'minor'], car: ['car', 'minor'], chains: ['chains', 'minor'], giggle: ['giggle', 'minor'], silence: ['silence', 'minor'], crowsTurn: ['crows', 'minor'], swingFreeze: ['swing', 'minor'], ratRun: ['rats', 'amb'], shutter: ['shutter', 'amb'] };
function leben_farTick(dt, t, c1, live) {
  const S = leben_S, F = S.far;
  if (F.car) leben_carTick(dt);
  if (S.zone !== 'town' || !live || !c1 || state.outage) return;
  for (const k in F.cd) F.cd[k] -= dt;
  F.T = (F.T ?? rand(30, 50)) - dt; if (F.T > 0) return;
  if (nat.calm > 0 || dir.busy) { F.T = 4; return; }
  const reg = typeof spannung_can === 'function', allow = k => !(F.cd[k] > 0) && (!reg || spannung_can(leben_EVR[k][0], leben_EVR[k][1])); // Regie fragen
  let sum = 0; for (const [k, w] of leben_EVW) if (allow(k)) sum += w;
  for (let tries = 0; tries < 3 && sum > 0; tries++) { let r = Math.random() * sum, pick = null; for (const e of leben_EVW) { if (!allow(e[0])) continue; r -= e[1]; if (r <= 0) { pick = e; break; } }
    if (!pick) break; let ok = false; try { ok = leben_EV[pick[0]](); } catch (e) { console.warn('leben:', pick[0], e); }
    if (ok) { F.cd[pick[0]] = pick[2]; F.T = rand(32, 58); nat.calm = Math.max(nat.calm, 8); if (reg) spannung_did(...leben_EVR[pick[0]]); return; } }
  F.T = 6;
}
function leben_carTick(dt) {
  const F = leben_S.far, C = F.car; C.t += dt;
  if (C.st === 'come') { const d = C.x - C.stop; C.v = Math.max(1.2, Math.min(13, d * .45)); C.x -= C.v * dt; try { C.l.src.playbackRate.value = .66 + C.v / 13 * .36; } catch (e) {} if (d < .3) { C.st = 'idle'; C.t = 0; } }
  else if (C.st === 'idle') { if (C.t > C.idle) { C.l.stop(.9); C.st = 'off'; C.t = 0; } }
  else if (C.st === 'off') { if (!C.door && C.t > 1.3) { C.door = true; Audio.play('carDoor', { gain: .9, x: C.x, y: 1, z: C.z, ref: 14 }); } if (C.t > 12) { F.hl.visible = false; F.car = null; return; } }
  Audio.setze(C.p, C.x, .6, C.z);
  const a = F.hl.geometry.attributes.position; a.setXYZ(0, C.x - 2.2, .72, C.z - .62); a.setXYZ(1, C.x - 2.2, .72, C.z + .62); a.needsUpdate = true;
  F.hl.material.opacity = (C.st === 'off' && C.t > 8 ? 0 : 1) * Math.min(1, (300 - C.x) / 70) * .75;
}

// =====================================================================  TAKT
function leben_tick(dt, t, indoor) {
  const S = leben_S; S.frame++;
  if (!S.ready) { S.wait = (S.wait || 0) + dt; if (SOL.items.length || S.wait > 8) leben_ready(); else return; }
  const t0 = performance.now();
  leben_run(dt, t, indoor);
  const ms = performance.now() - t0; S.prof.acc += ms; S.prof.n++; if (ms > S.prof.max) S.prof.max = ms;
}
function leben_run(dt, t, indoor) {
  const S = leben_S, pf = S.pf || (S.pf = [0, 0, 0, 0, 0, 0, 0, 0]); let a = performance.now(), b;
  S.zone = leben_zone(); S.root.visible = S.zone === 'town';
  const c3 = ch3.on, c1 = !c3 && !state.ch2, live = !leben_quiet();
  leben_crowTick(dt, t, indoor, c1, c3, live); b = performance.now(); pf[0] += b - a; a = b;
  leben_ratTick(dt, t, live); leben_beastTick(dt, t, live, c1, c3); b = performance.now(); pf[1] += b - a; a = b;
  leben_batTick(dt, t, live); b = performance.now(); pf[2] += b - a; a = b;
  leben_flyTick(dt, t, live); leben_mothTick(dt, t, indoor); b = performance.now(); pf[3] += b - a; a = b;
  leben_winTick(dt, t, c1, live, indoor); leben_tvVoice(dt, live); b = performance.now(); pf[4] += b - a; a = b;
  leben_spiderTick(dt, t, indoor, live); b = performance.now(); pf[5] += b - a; a = b;
  leben_windTick(dt, t, c3, live); leben_reactTick(dt); leben_skyTick(dt, t, c1); b = performance.now(); pf[6] += b - a; a = b;
  leben_clockTick(dt, c1, c3, live); leben_farTick(dt, t, c1, live); b = performance.now(); pf[7] += b - a;
}
// Testzugriff (für die Selbsttests; im Spiel ungenutzt)
function leben_debug() { return { S: leben_S, EV: leben_EV, bell: () => leben_bell313(ch3.on), hunt: leben_huntStart, chase: leben_ratChase, shadow: () => leben_shadowStart(true), scare: leben_scare, crowScare: leben_crowScare, drop: () => { if (leben_S.drop) leben_S.drop.T = 0; }, flash: v => { flashOn = !!v; } }; }
