// AP-MOCAP / Premium P2: Prüfung aller Figuren-Bewegungen ohne Grafikkarte – Clips (Stufe A) und die Wiedergabeschicht figuren.js im Spieltakt (Stufe B).
// Stufe A je Figur und Clip (30 Bilder/s): KOPF-FLIP (Kopf gegen Brustkorb > 100° gegenüber der Ruhe) · Kopf ab/Skala 0 (Kopfnetz löst sich vom Kopfknochen) · NaN ·
//   Boden (tiefster Hautpunkt < 0) · Knie nach vorn überstreckt · Handgelenk verdreht · Zittern (schnelle Richtungsumkehr) · Drehsprung (> 25 rad/s) · Schleifennaht · Rutschen (motion.slide) ·
//   Spuren: Knochen, die die Zusatzschicht dreht, ohne Spur im Clip (würden sich im Spiel aufsummieren) · model.glb ↔ model.glb.ktx.glb gleich (das Spiel lädt .ktx.glb)
//   Sonderwege: Justin (game/justin.glb + chars/justin/mocap.json), kino.json-Clips, Tiere/Wesen (Katze, Rabe, Wild, Wolf …) nur allgemein (NaN, Zittern, Sprünge, Naht).
// Stufe B (--spiel): figuren.js wird mit Attrappen geladen (echter Code), je Figur Szenen im 60-Hz-Takt: Stehen + Blick rundum (auch hinter die Figur), Gehen/Stoppen, Drehen 90°/180°,
//   Laufen, schnelles Hin-und-Her (Überblendgewichte), Stufe (Fuß-IK), Geste, Sitzen. Gemessen: Kopf-Flip, Kopfdrehtempo/Zittern, Gewichtssumme < 1 (Mischung zur Bindepose), NaN, Augen, Gleiten.
// Aufruf (in app/): node tools/mocap_check.mjs [<id …>|all] [--clips=a,b] [--spiel] [--nur-spiel] [--extra] [--szenen=a,b]
import fs from 'fs'; import * as THREE from 'three'; import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; import * as SKU from 'three/addons/utils/SkeletonUtils.js';
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
globalThis.window = globalThis; globalThis.self = globalThis; globalThis.THREE = THREE;
const args = process.argv.slice(2), opt = k => (args.find(a => a.startsWith('--' + k + '=')) || '').slice(k.length + 3), flag = k => args.includes('--' + k);
const only = opt('clips').split(',').filter(Boolean), CH = '../game/assets/chars/', MS = '../game/assets/ms/', D2R = Math.PI / 180;
let ids = args.filter(a => !a.startsWith('--')); if (!ids.length || ids[0] === 'all') ids = fs.readdirSync(CH).filter(d => fs.existsSync(CH + d + '/model.glb'));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
async function loadGlb(file) { const doc = await io.read(file); for (const t of doc.getRoot().listTextures()) t.dispose(); for (const e of doc.getRoot().listExtensionsUsed()) if (/basisu|webp|texture_transform/i.test(e.extensionName)) e.dispose();
  const bin = await io.writeBinary(doc); return new Promise((res, rej) => new GLTFLoader().parse(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), '', res, rej)); }
const glbJson = file => { const b = fs.readFileSync(file), n = b.readUInt32LE(12); return JSON.parse(b.slice(20, 20 + n).toString('utf8')); };
const inGame = id => fs.existsSync(CH + id + '/model.glb.ktx.glb') ? CH + id + '/model.glb.ktx.glb' : CH + id + '/model.glb';

// ---------- figuren.js mit Attrappen laden (derselbe Code wie im Spiel)
function loadFiguren() {
  Object.assign(globalThis, { MSL: { gl: { loadAsync: async url => { const id = url.split('/')[2]; return loadGlb(inGame(id)); } } }, FAB: {}, WORLD_MODS: [], WORLD_TICK: [], ECHO_CAST: {}, FACE_HOOK: {}, FIGS: [], colliders: [],
    camera: new THREE.PerspectiveCamera(60, 16 / 9, .05, 300), renderer: { domElement: { style: {} } }, scene: new THREE.Scene(), justin: {}, __skClone: SKU.clone,
    fetch: async url => ({ ok: fs.existsSync('../game/' + url), json: async () => JSON.parse(fs.readFileSync('../game/' + url, 'utf8')) }) });
  const src = fs.readFileSync('mods/figuren.js', 'utf8').replace("(await import('three/addons/utils/SkeletonUtils.js')).clone", 'globalThis.__skClone');
  return new Function(src + '\nreturn { figuren_embody, figuren_tick, figuren_play, figuren_do, figuren_lookAt, figuren_seat, figuren_rig, figuren_load, FIGUREN_MV, figuren_S };')(); }
const FG = loadFiguren();

// ---------- Hilfen
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _s = new THREE.Vector3();
const W = o => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld), Q = o => { const q = new THREE.Quaternion(); o.matrixWorld.decompose(_v1, q, _s); return q; };
const qAng = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(a.dot(b))));
const relAng = (A, Bq, rest) => { const r = A.clone().invert().multiply(Bq); return qAng(r, rest); }; // Winkel der Lage B relativ zu A gegenüber der Ruhe
const kneeSigned = (U, L, F, fwd) => { const a1 = W(L).sub(W(U)).normalize(), a2 = W(F).sub(W(L)).normalize(), c = new THREE.Vector3().crossVectors(a1, a2), side = new THREE.Vector3().crossVectors(a1, fwd); if (side.lengthSq() < 1e-6) return 0; return Math.asin(Math.min(1, c.length())) * Math.sign(c.dot(side)); };
const KEYB = ['hips', 'chest', 'neck', 'head', 'lArm', 'rArm', 'lFore', 'rFore', 'lHand', 'rHand', 'lUp', 'rUp', 'lLeg', 'rLeg', 'lFoot', 'rFoot'];
// Ruhe (Bindepose der Haut) für eine Figur: Kopf-zu-Brust-Lage, Kopf-Hals-Abstand, Kopfnetz relativ zum Kopfknochen
// Ruhe = Grundstellung der Datei (Knoten wie geladen, ohne Clip); restSrc: unbewegte Vorlage (im Spieltest ist root schon bewegt)
function restInfo(root, R, restSrc = root) { const c = SKU.clone(restSrc), Rc = FG.figuren_rig(c); c.updateMatrixWorld(true);
  const I = {}; if (Rc.head && Rc.chest) I.hc = Q(Rc.chest).invert().multiply(Q(Rc.head)); if (Rc.head && Rc.neck) I.hn = W(Rc.head).distanceTo(W(Rc.neck)); if (Rc.head) I.hs = Rc.head.getWorldScale(new THREE.Vector3()).x;
  for (const s of ['lEye', 'rEye']) if (Rc[s] && Rc.head) I[s] = Q(Rc.head).invert().multiply(Q(Rc[s]));
  // Kopfnetz: Ecken, deren stärkster Knochen der Kopf oder ein Kind davon ist (Stichprobe ≤ 300)
  const headSet = new Set(); if (R.head) R.head.traverse(b => { if (b.isBone) headSet.add(b.name); }); I.hv = [];
  root.traverse(m => { if (!m.isSkinnedMesh || !R.head) return; const SI = m.geometry.attributes.skinIndex, SW = m.geometry.attributes.skinWeight; if (!SI) return; const hit = [];
    for (let i = 0; i < SI.count; i++) { let bw = 0, bi = -1; for (let k = 0; k < 4; k++) { const w = SW.getComponent(i, k); if (w > bw) { bw = w; bi = SI.getComponent(i, k); } } const b = m.skeleton.bones[bi]; if (b && headSet.has(b.name)) hit.push(i); }
    const st = Math.max(1, Math.floor(hit.length / 150)); for (let j = 0; j < hit.length; j += st) I.hv.push([m, hit[j]]); });
  if (I.hv.length && Rc.head) { // Mittelpunkt des Kopfnetzes im Raum des Kopfknochens (Bindepose)
    const cm = []; c.traverse(m => { if (m.isSkinnedMesh) cm.push(m); }); const mi = new Map(); let k = 0; root.traverse(m => { if (m.isSkinnedMesh) mi.set(m, cm[k++]); });
    const cen = new THREE.Vector3(); for (const [m, i] of I.hv) { const mc = mi.get(m); mc.getVertexPosition(i, _v1); _v1.applyMatrix4(mc.matrixWorld); cen.add(_v1); } cen.divideScalar(I.hv.length);
    I.hsz = 0; for (let j = 0; j < I.hv.length; j += 5) { const [m, i] = I.hv[j], mc = mi.get(m); mc.getVertexPosition(i, _v1); _v1.applyMatrix4(mc.matrixWorld); I.hsz = Math.max(I.hsz, _v1.distanceTo(cen)); } // Ausdehnung in Metern (Welt)
    I.hcen = cen.applyMatrix4(Rc.head.matrixWorld.clone().invert()); }
  return I; }
// Kopfnetz-Abweichung: Mittelpunkt (Welt) gegen die Lage, die der Kopfknochen vorgibt; Ausdehnung (Skala 0 → verschwunden)
function headMesh(R, I) { if (!I.hcen || !R.head) return [0, 1]; const cen = _v2.set(0, 0, 0); for (const [m, i] of I.hv) { m.getVertexPosition(i, _v1); _v1.applyMatrix4(m.matrixWorld); cen.add(_v1); } cen.divideScalar(I.hv.length);
  const want = I.hcen.clone().applyMatrix4(R.head.matrixWorld), d = cen.distanceTo(want); let sz = 0; for (let j = 0; j < I.hv.length; j += 5) { const [m, i] = I.hv[j]; m.getVertexPosition(i, _v1); _v1.applyMatrix4(m.matrixWorld); sz = Math.max(sz, _v1.distanceTo(cen)); }
  return [d, sz / Math.max(1e-4, I.hsz)]; }
// Zittern/Sprünge aus einer Folge lokaler Drehungen (Float32Array, 4 je Bild, fps)
function jitter(seq, n, fps) { let wMax = 0, rev = 0, run = 0; const a = new THREE.Quaternion(), b = new THREE.Quaternion(), c = new THREE.Quaternion(), d1 = new THREE.Quaternion(), d2 = new THREE.Quaternion(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  const rv = (q, v) => { if (q.w < 0) q.set(-q.x, -q.y, -q.z, -q.w); const s = Math.sqrt(1 - Math.min(1, q.w * q.w)), ang = 2 * Math.acos(Math.min(1, q.w)); if (s < 1e-6) return v.set(0, 0, 0); return v.set(q.x / s * ang, q.y / s * ang, q.z / s * ang); };
  for (let i = 0; i + 1 < n; i++) { a.fromArray(seq, i * 4); b.fromArray(seq, i * 4 + 4); const w = qAng(a, b) * fps; if (w > wMax) wMax = w;
    if (i + 2 < n) { c.fromArray(seq, i * 4 + 8); d1.copy(b).multiply(a.clone().invert()); d2.copy(c).multiply(b.clone().invert()); rv(d1, v1); rv(d2, v2); const l1 = v1.length(), l2 = v2.length(); if (l1 > 1 * D2R && l2 > 1 * D2R && v1.dot(v2) < -.5 * l1 * l2) { run++; if (run >= 3) rev++; } else run = 0; } } // Zittern = Richtungsumkehr in ≥ 3 Bildern hintereinander (+ − + −), nicht der einzelne Umkehrpunkt eines Schritts
  return [wMax, rev]; }
const report = [], summary = [];

// =====================================================================  Stufe A: Clips
async function checkClips(label, root, clips, { human = true, motion = {}, h = 1.6 } = {}) {
  const R = FG.figuren_rig(root), bones = []; root.traverse(o => { if (o.isBone) bones.push(o); }); const meshes = []; root.traverse(o => { if (o.isSkinnedMesh && o.visible) meshes.push(o); });
  const mx = new THREE.AnimationMixer(root); root.updateMatrixWorld(true);
  const rest = {}, restKnee = {}; for (const s of ['l', 'r']) { if (R[s + 'Fore'] && R[s + 'Hand']) rest[s] = Q(R[s + 'Fore']).invert().multiply(Q(R[s + 'Hand'])); if (R[s + 'Up'] && R[s + 'Leg'] && R[s + 'Foot']) restKnee[s] = kneeSigned(R[s + 'Up'], R[s + 'Leg'], R[s + 'Foot'], new THREE.Vector3(0, 0, 1)); }
  const hq0 = R.hips ? Q(R.hips).invert() : null, I = human ? restInfo(root, R) : {}, key = human ? KEYB.filter(k => R[k]).map(k => [k, R[k]]) : bones.map(b => [b.name, b]);
  const layer = new Set([...(R.chestChain || []), ...(R.neckChain || []), ...(R.headChain || []), R.lEye, R.rEye].filter(Boolean).map(b => b.name)); const trackSets = [];
  if (human && !R.head) report.push([label, '*', 'KEIN KOPFKNOCHEN']);
  for (const clip of clips) { if (only.length && !only.includes(clip.name)) continue; mx.stopAllAction(); const a = mx.clipAction(clip); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.reset().play();
    const fps = 30, N = Math.max(2, Math.floor(clip.duration * fps) + 1), seq = key.map(() => new Float32Array(N * 4)); const m = motion[clip.name] || {}, flags = [];
    let minY = Infinity, knee = 0, twist = 0, headLow = 0, hipMin = Infinity, hc = 0, hcT = 0, hn = 1, hs = 1, hmD = 0, hmS = 1, nan = false;
    for (let i = 0; i < N; i++) { const t = Math.min(i / fps, clip.duration); mx.setTime(t); root.updateMatrixWorld(true);
      key.forEach(([, b], j) => b.quaternion.toArray(seq[j], i * 4));
      if (i % 5 === 0) for (const b of bones) { const e = b.matrixWorld.elements; for (let k = 0; k < 16; k++) if (!Number.isFinite(e[k])) { nan = true; break; } }
      if (!human) continue;
      if (R.head && R.chest && I.hc) { const d = relAng(Q(R.chest), Q(R.head), I.hc); if (d > hc) { hc = d; hcT = t; } }
      if (R.head && R.neck && I.hn) { const r = W(R.head).distanceTo(W(R.neck)) / I.hn; if (Math.abs(r - 1) > Math.abs(hn - 1)) hn = r; }
      if (R.head && I.hs) { const r = R.head.getWorldScale(_s).x / I.hs; if (Math.abs(r - 1) > Math.abs(hs - 1)) hs = r; }
      if (i % 3) continue; // 10 Bilder/s für die teuren Prüfungen
      if (I.hv && I.hv.length) { const [d, s] = headMesh(R, I); if (d > hmD) hmD = d; if (s < hmS) hmS = s; }
      for (const mm of meshes) { const n = mm.geometry.attributes.position.count; for (let k = 0; k < n; k += 23) { mm.getVertexPosition(k, _v1); _v1.applyMatrix4(mm.matrixWorld); if (_v1.y < minY) minY = _v1.y; } }
      if (R.head && R.hips) { const hy = W(R.hips).y, dy = W(R.head).y - hy; hipMin = Math.min(hipMin, hy); if (dy < 0) headLow = Math.max(headLow, -dy); }
      for (const s of ['l', 'r']) { const U = R[s + 'Up'], L = R[s + 'Leg'], F = R[s + 'Foot'];
        if (U && L && F) { const fw = new THREE.Vector3(0, 0, 1); if (R.hips && hq0) fw.applyQuaternion(Q(R.hips).multiply(hq0)); fw.y = 0; fw.normalize(); const sg = kneeSigned(U, L, F, fw) - (restKnee[s] || 0); if (sg > .17) knee = Math.max(knee, sg); } // vorn = Blickrichtung des Beckens (Drehclips)
        const E = R[s + 'Fore'], H = R[s + 'Hand'];
        if (E && H && rest[s]) { const r = Q(E).invert().multiply(Q(H)).multiply(rest[s].clone().invert()); const ax = W(H).sub(W(E)).normalize().applyQuaternion(Q(E).invert()); const pr = ax.dot(new THREE.Vector3(r.x, r.y, r.z)); twist = Math.max(twist, 2 * Math.atan2(Math.abs(pr), Math.abs(r.w))); } } }
    // Zittern/Sprünge je Knochen
    let jit = [], jump = []; key.forEach(([k], j) => { const [w, rev] = jitter(seq[j], N, fps); if (rev >= 1) jit.push(k + '×' + rev); if (w > 25) jump.push(k + ' ' + w.toFixed(0)); });
    // Schleifennaht (erstes gegen letztes Bild)
    const LOOPN = human ? m.loop !== false : /idle|walk|run|trot|gallop|fly|glide|loaf|sleep|sit|stand|groom|crouch|eat|sniff/i.test(clip.name) && !/to|death|start|end|land|take|jump|attack|bite|turn/i.test(clip.name);
    let seam = 0, seamB = ''; if (LOOPN && N > 3) key.forEach(([k], j) => { _q1.fromArray(seq[j], 0); _q2.fromArray(seq[j], (N - 1) * 4); const d = qAng(_q1, _q2); if (d > seam) { seam = d; seamB = k; } });
    const tr = new Set(clip.tracks.filter(t => /\.quaternion$/.test(t.name)).map(t => t.name.replace(/\.quaternion$/, ''))); trackSets.push([clip.name, tr]);
    const noTrack = [...layer].filter(n => !tr.has(n));
    const STAND = /^(idle\d?|walk.*|run.*|look|nervous|alert|talk.*|listen|turn_.*|window.*|phone|winken|nick|kopfschuetteln|z_idle\d?|z_walk|z_run)$/.test(clip.name);
    if (!STAND) knee = 0;
    if (nan) flags.push('NaN');
    if (human) { if (hc > 100 * D2R) flags.push('KOPF-FLIP ' + (hc / D2R).toFixed(0) + '° @' + hcT.toFixed(1) + 's'); if (Math.abs(hn - 1) > .35 || Math.abs(hs - 1) > .3) flags.push('Kopf ab/Skala (Hals ×' + hn.toFixed(2) + ', Skala ×' + hs.toFixed(2) + ')');
      if (hmD > .12 * h || hmS < .5) flags.push('Kopfnetz löst sich ' + (hmD * 100).toFixed(0) + ' cm, Größe ×' + hmS.toFixed(2));
      if (headLow > .05) flags.push('KOPFÜBER'); if (STAND && hipMin < .35 * h) flags.push('Becken tief ' + hipMin.toFixed(2) + ' m');
      if (minY < -.03) flags.push('sinkt ' + (minY * 100).toFixed(0) + ' cm'); if (knee > .17) flags.push('Knie vorn ' + (knee / D2R).toFixed(0) + '°'); if (twist > 1.75) flags.push('Handgelenk ' + (twist / D2R).toFixed(0) + '°');
      if (m.slide > .12 && m.rm === 'lin') flags.push('rutscht ' + m.slide.toFixed(2)); if (noTrack.length) flags.push('ohne Spur: ' + noTrack.join('/')); }
    if (jit.length) flags.push('Zittern ' + jit.join(' ')); if (jump.length) flags.push('Drehsprung ' + jump.join(' ')); if (seam > 25 * D2R) flags.push('Naht ' + seamB + ' ' + (seam / D2R).toFixed(0) + '°');
    report.push([label, clip.name, flags.join(', '), { hc: +(hc / D2R).toFixed(1) }]); }
  // Spuren uneinheitlich: Knochen, die in manchen Clips animiert sind, in anderen nicht (Überblenden → Bindepose)
  const all = new Map(); for (const [, s] of trackSets) for (const n of s) all.set(n, (all.get(n) || 0) + 1); const odd = [...all].filter(([, c]) => c < trackSets.length && c > trackSets.length * .2).map(([n, c]) => n + ' ' + c + '/' + trackSets.length);
  if (odd.length) report.push([label, '*', 'Spuren uneinheitlich: ' + odd.slice(0, 8).join(', ') + (odd.length > 8 ? ' …+' + (odd.length - 8) : '')]);
  const bad = report.filter(r => r[0] === label && r[2]); console.log(label + ': ' + clips.length + ' Clips, auffällig ' + bad.length + (bad.length ? ' → ' + bad.map(r => r[1] + ' (' + r[2] + ')').join('; ') : ''));
  summary.push([label, clips.length, bad.length]); }

// =====================================================================  Stufe B: Wiedergabeschicht figuren.js im Spieltakt
const SZENEN = ['blick', 'gehen', 'drehen', 'laufen', 'hinher', 'stufe', 'geste', 'sitzen'];
async function checkSpiel(id) { const T = await FG.figuren_load(id); if (!T) return;
  const g = new THREE.Group(); scene.add(g); const P = await FG.figuren_embody(g, id); if (!P) { report.push([id, 'spiel', 'embody fehlgeschlagen']); return; }
  const R = P.rig, I = restInfo(P.obj, R, T.scene), dt = 1 / 60, cam = camera, want = (flag('spiel') || flag('nur-spiel')) && opt('szenen') ? opt('szenen').split(',') : SZENEN;
  const res = {}; let frames = 0;
  const run = async (name, secs, step) => { const r = res[name] = { hc: 0, hcT: 0, w: 0, rev: 0, wsum: 1, nan: false, eye: 0, hm: 0, sink: 0, slip: 0, slipN: 0, clips: new Set() }; let prevRel = null, prevD = null; const pf = [null, null];
    for (let t = 0; t < secs; t += dt) { step(t); scene.updateMatrixWorld(true); cam.updateMatrixWorld(); FG.figuren_tick(dt); P.obj.updateMatrixWorld(true); frames++; r.clips.add(P.curK);
      if (R.head && R.chest && I.hc) { const d = relAng(Q(R.chest), Q(R.head), I.hc); if (d > r.hc) { r.hc = d; r.hcT = t; } }
      if (R.head && R.hips) { const rel = Q(R.hips).invert().multiply(Q(R.head)); if (prevRel) { const w = qAng(prevRel, rel) / dt; if (w > r.w) r.w = w; const dq = rel.clone().multiply(prevRel.clone().invert()); if (dq.w < 0) dq.set(-dq.x, -dq.y, -dq.z, -dq.w); const v = new THREE.Vector3(dq.x, dq.y, dq.z);
          if (prevD && v.length() > .006 && prevD.length() > .006 && v.dot(prevD) < -.5 * v.length() * prevD.length()) { r.run = (r.run || 0) + 1; if (r.run >= 3) r.rev++; } else r.run = 0; prevD = v; } prevRel = rel; }
      let s = 0; for (let i = 0; i < P.mx._nActiveActions; i++) s += P.mx._actions[i].getEffectiveWeight(); if (s < r.wsum) r.wsum = s;
      if (process.env.P2W && s < .97) console.log(name, t.toFixed(2), s.toFixed(3), P.mx._actions.slice(0, P.mx._nActiveActions).map(a => a.getClip().name + ':' + a.getEffectiveWeight().toFixed(2) + (a.paused ? 'P' : '') + (a.enabled ? '' : 'D')).join(' '));
      if (R.head) { const e = R.head.matrixWorld.elements; for (let k = 0; k < 16; k++) if (!Number.isFinite(e[k])) r.nan = true; }
      for (const sd of ['lEye', 'rEye']) if (R[sd] && I[sd]) r.eye = Math.max(r.eye, relAng(Q(R.head), Q(R[sd]), I[sd]));
      if (frames % 6 === 0 && I.hv && I.hv.length) r.hm = Math.max(r.hm, headMesh(R, I)[0]);
      // Füße: Einsinken (gegen Boden/Stufe) und Gleiten (Standfuß bewegt sich waagerecht)
      if (R.legs.length === 2) { const f0 = W(R.legs[0][2]), f1 = W(R.legs[1][2]), low = f0.y < f1.y ? 0 : 1, f = low ? f1 : f0; const gy = step.ground ? step.ground(f.x, f.z) : 0; if (f.y < gy - .02) r.sink = Math.max(r.sink, gy - f.y);
        if (!(step.moving && step.moving(t))) r.fmin = Math.min(r.fmin ?? 9, f.y - gy); // Knöchelhöhe im Stand
        if (process.env.P2DBG === name && frames % 3 === 0 && step.moving && step.moving(t)) console.log(t.toFixed(2), P.curK, P.cur && P.cur.timeScale.toFixed(2), P.mv.spd.toFixed(2), 'fuss', f0.y.toFixed(3), f1.y.toFixed(3), 'min', (r.fmin ?? 0).toFixed(3), pf[low] ? (Math.hypot(f.x - pf[low].x, f.z - pf[low].z) / dt).toFixed(2) : '');
        if (step.moving && step.moving(t) && pf[low] && f.y - gy < (r.fmin ?? 0) + .03) { (r.sl || (r.sl = [])).push(Math.hypot(f.x - pf[low].x, f.z - pf[low].z) / dt); } pf[0] = f0; pf[1] = f1; } } // Gleiten: waagerechtes Tempo des aufgesetzten Fußes
    await null; };
  const reset = () => { P.mv.init = false; g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); scene.updateMatrixWorld(true); FG.figuren_lookAt(P, null); globalThis.colliders.length = 0; };
  const camAt = (x, y, z) => { cam.position.set(x, y, z); cam.lookAt(g.position.x, 1, g.position.z); };
  const H = P.h || 1.6, eyeY = H * .93;
  if (want.includes('blick')) { reset(); camAt(0, eyeY, 2); FG.figuren_lookAt(P, 'cam', 1); await run('blick', 8, t => { const a = t / 8 * Math.PI * 2; cam.position.set(Math.sin(a) * 1.8, eyeY + Math.sin(t * 1.3) * .5, Math.cos(a) * 1.8); cam.lookAt(0, 1, 0); }); FG.figuren_lookAt(P, null); }
  if (want.includes('gehen')) { reset(); await run('gehen', 7, Object.assign(t => { g.position.z = Math.min(t, 4) * 1.2; camAt(2.5, 1.6, g.position.z + 2); }, { moving: t => t > .8 && t < 3.9 })); }
  if (want.includes('drehen')) { reset(); camAt(2, 1.6, 2); await run('drehen', 9, t => { g.rotation.y = t < 1 ? 0 : t < 4.5 ? Math.PI / 2 : Math.PI * 1.5; camAt(2, 1.6, 2); }); }
  if (want.includes('laufen')) { reset(); await run('laufen', 5, Object.assign(t => { g.position.z = Math.min(t, 3) * 2.2; camAt(3, 1.6, g.position.z + 2); }, { moving: t => t > .8 && t < 2.9 })); }
  if (want.includes('hinher')) { reset(); let z = 0; await run('hinher', 5, t => { if (Math.floor(t / .25) % 2 === 0) z += 1.2 * dt; g.position.z = z; camAt(2.5, 1.6, z + 2); }); }
  if (want.includes('stufe')) { reset(); globalThis.colliders.push({ top: .17, minX: -1, maxX: 1, minZ: 1.5, maxZ: 3, base: 0 }); const gr = (x, z) => z > 1.5 && z < 3 && x > -1 && x < 1 ? .17 : 0;
    await run('stufe', 6, Object.assign(t => { g.position.z = Math.min(t, 3.5) * .9; g.position.y = gr(0, g.position.z) > 0 && g.position.z > 1.9 ? .17 : 0; camAt(2.5, 1.6, g.position.z + 1.5); }, { ground: gr })); globalThis.colliders.length = 0; }
  if (want.includes('geste')) { reset(); camAt(0, 1.6, 2.2); FG.figuren_lookAt(P, 'cam', 1); const k = ['winken', 'nick', 'schulterzucken'].find(c => P.acts[c]); let done = false;
    await run('geste', 7, t => { if (!done && t > .5 && k) { FG.figuren_do(P, k); done = true; } }); FG.figuren_lookAt(P, null); }
  if (want.includes('sitzen') && P.acts.sit) { reset(); camAt(1.5, 1.4, 1.8); FG.figuren_seat(P, .46); FG.figuren_lookAt(P, 'cam', .8); await run('sitzen', 5, t => { cam.position.x = 1.5 * Math.cos(t); cam.lookAt(0, .8, 0); }); }
  for (const [n, r] of Object.entries(res)) { const f = [];
    if (r.nan) f.push('NaN'); if (r.hc > 100 * D2R) f.push('KOPF-FLIP ' + (r.hc / D2R).toFixed(0) + '° @' + r.hcT.toFixed(2) + 's'); if (r.w > 12) f.push('Kopfdrehung ' + r.w.toFixed(1) + ' rad/s'); if (r.rev >= 1) f.push('Kopf zittert ×' + r.rev);
    if (r.wsum < .97) f.push('Gewichtssumme ' + r.wsum.toFixed(2) + ' (Bindepose schimmert durch)'); if (r.eye > 60 * D2R) f.push('Auge verdreht ' + (r.eye / D2R).toFixed(0) + '°'); if (r.hm > .12 * H) f.push('Kopfnetz ' + (r.hm * 100).toFixed(0) + ' cm');
    if (r.sink > .06) f.push('Fuß sinkt ' + (r.sink * 100).toFixed(0) + ' cm'); const sl = r.sl && r.sl.length > 10 ? r.sl.sort((a, b) => a - b)[r.sl.length >> 1] : 0; if (sl > .3) f.push('Gleiten ' + sl.toFixed(2) + ' m/s');
    report.push([id, 'spiel:' + n, f.join(', '), { hc: +(r.hc / D2R).toFixed(1), w: +r.w.toFixed(1), rev: r.rev, wsum: +r.wsum.toFixed(3), slip: +sl.toFixed(2), clips: [...r.clips].join('/') }]); }
  const bad = report.filter(r => r[0] === id && /^spiel:/.test(r[1]) && r[2]); console.log(id + ' [Spiel]: ' + Object.keys(res).length + ' Szenen, auffällig ' + bad.length + (bad.length ? ' → ' + bad.map(r => r[1].slice(6) + ' (' + r[2] + ')').join('; ') : '') + '  ·  max Kopf/Brust ' + Math.max(...Object.values(res).map(r => r.hc / D2R)).toFixed(0) + '°');
  if (FG.FIGUREN_MV.flip) { report.push([id, 'spiel:netz', 'Sicherheitsnetz griff ' + FG.FIGUREN_MV.flip + '×']); console.log(id + ' Sicherheitsnetz griff ' + FG.FIGUREN_MV.flip + '×'); FG.FIGUREN_MV.flip = 0; }
  scene.remove(g); FG.figuren_S.embodied.delete(g); }

// =====================================================================  Ablauf
const spielOnly = flag('nur-spiel');
for (const id of ids) {
  if (!spielOnly) { const f = inGame(id), g = await loadGlb(f), clips = g.animations; await checkClips(id, g.scene, clips, { motion: g.scene.userData.motion || {}, h: ((await FG.figuren_load(id)) || {}).height || 1.6 });
    // Das Spiel lädt die .ktx.glb: gleiche Clips wie model.glb?
    if (f.endsWith('.ktx.glb')) { const a = glbJson(CH + id + '/model.glb').animations || [], b = glbJson(f).animations || []; const sig = L => L.map(x => x.name + ':' + x.channels.length).sort().join('|'); if (sig(a) !== sig(b)) report.push([id, '*', 'model.glb ≠ model.glb.ktx.glb (Clips/Kanäle verschieden)']); }
    // kino.json (alte Werkstatt-Clips, nur wo kein gleichnamiger Mocap-Clip existiert – so nimmt kino.js sie)
    if (fs.existsSync(CH + id + '/kino.json')) { const L = JSON.parse(fs.readFileSync(CH + id + '/kino.json', 'utf8')).filter(j => !clips.some(c => c.name === j.name)).map(j => THREE.AnimationClip.parse(j)); if (L.length) await checkClips(id + '/kino', g.scene, L, { h: 1.6 }); } }
  if ((flag('spiel') || spielOnly) && id !== 'blechmann') try { await checkSpiel(id); } catch (e) { report.push([id, 'spiel', 'FEHLER ' + e.message]); console.log(id + ' [Spiel] FEHLER', e.stack); }
}
if (flag('extra') && !spielOnly) {
  // Justin: Paladin-Modell mit eigenen Clips + mocap.json (Knien)
  try { const g = await loadGlb('../game/justin.glb'), J = JSON.parse(fs.readFileSync(CH + 'justin/mocap.json', 'utf8')); const clips = [...g.animations, ...Object.values(J.clips || {}).map(c => THREE.AnimationClip.parse(c))]; await checkClips('justin', g.scene, clips, { h: 1.94 }); } catch (e) { console.log('justin FEHLER', e.message); }
  // Tiere/Wesen: allgemeine Prüfung (NaN, Zittern, Drehsprung, Naht)
  for (const k of ['katze', 'animal_crow', 'animal_deerstag', 'animal_deerdoe', 'animal_fox', 'animal_wolf', 'animal_pig']) { const f = MS + k + '/model.glb'; if (!fs.existsSync(f)) continue;
    try { const g = await loadGlb(f); await checkClips(k, g.scene, g.animations.filter(c => !/_RM$/.test(c.name)), { human: false }); } catch (e) { console.log(k + ' FEHLER', e.message); } }
}
fs.mkdirSync('C:/Users/GIGABYTE/_mocap', { recursive: true }); fs.writeFileSync('C:/Users/GIGABYTE/_mocap/check.json', JSON.stringify(report));
console.log('\nSUMME: ' + report.filter(r => r[2]).length + ' Auffälligkeiten in ' + report.length + ' Prüfungen');
