// R-21 · Der Beobachter backen: Gestalt umformen (beobachter_form.mjs), Lider, Skelett und Hautgewichte, eigene Clips, Hautattribute (Höhlen/Dicke/Falten),
// Texturen (Wachshaut, Augen), GLB schreiben, Filmstreifen (Silhouette ohne Textur, CLAUDE.md §20).
// Aufruf (in app/): node tools/beobachter_bau.mjs [--vorschau=Ordner] [--film=Ordner] [--nur=clip,clip] [--gewichte]
// Danach: node tools/ktx.mjs
import fs from 'fs'; import path from 'path'; import * as THREE from 'three'; import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { umformen, normalen } from './beobachter_form.mjs';
import { schweissen, augen, lider, messen, strecken, gewichte, haut, KNOCHEN } from './beobachter_rig.mjs';
import { bild } from './beobachter_bild.mjs';
import { clips as beobClips } from './beobachter_clips.mjs';
import { Rig, record, writeClips, film } from './kreaturen_rig.mjs';
import { Document, NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions'; import { cloneDocument } from '@gltf-transform/functions';
globalThis.window = globalThis; globalThis.self = globalThis;
const args = process.argv.slice(2), opt = k => { const a = args.find(x => x === '--' + k || x.startsWith('--' + k + '=')); return a ? (a.split('=')[1] ?? true) : null; };
const DIR = path.resolve('..', 'game', 'assets', 'ms', 'beobachter'), SRC = path.join(DIR, 'model.glb');
// ---------------------------------------------------------------- Original lesen (three entpackt Quantisierung und Texturverschiebung)
export async function quelle() { const buf = fs.readFileSync(SRC); const g = await new Promise((r, j) => new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', r, j));
  g.scene.updateMatrixWorld(true); const M = []; g.scene.traverse(m => { if (m.isMesh) M.push(m); });
  const teil = m => { const G = m.geometry, P = G.attributes.position, U = G.attributes.uv, I = G.index, v = new THREE.Vector3(), pos = new Float32Array(P.count * 3), uv = new Float32Array(P.count * 2);
    const map = m.material.map, rep = map ? map.repeat : { x: 1, y: 1 }, of = map ? map.offset : { x: 0, y: 0 };
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); pos.set([v.x, v.y, v.z], i * 3); if (U) uv.set([U.getX(i) * rep.x + of.x, U.getY(i) * rep.y + of.y], i * 2); }
    return { pos, uv, idx: I ? Uint32Array.from(I.array) : Uint32Array.from({ length: P.count }, (_, i) => i) }; };
  // Teile: 0 Arme, 1 Körper/Beine, 2 Kopf+Fühler, 3 Brauen (weg), 4 Nase (weg), 5 Augen
  return { arm: teil(M[0]), koerper: teil(M[1]), kopf: teil(M[2]), augen: teil(M[5]), map: M[0].material.map }; }
async function vorschau(dir, T) { fs.mkdirSync(dir, { recursive: true }); const pal = { arm: [236, 228, 218], koerper: [236, 228, 218], kopf: [236, 228, 218], augen: [30, 30, 36], lider: [236, 228, 218] };
  const parts = Object.entries(T).filter(([k, t]) => t && t.pos).map(([k, t]) => ({ pos: t.pos, idx: t.idx, nrm: t.nrm || normalen(t.pos, t.idx), col: t.ao, color: pal[k] }));
  for (const [n, yaw, pitch] of [['vorn', 0, 0], ['seite', Math.PI / 2, 0], ['schraeg', .6, .15], ['hinten', Math.PI + .5, .1]]) await bild(path.join(dir, 'form_' + n + '.png'), parts, { W: 500, H: 760, yaw, pitch });
  for (const [n, B, yaw, pitch] of [['gesicht', [-1, 1, .45, .9, -1, 1], .35, .05], ['hand', [-1, -.12, -.02, .3, -1, 1], -1.2, .1], ['fuss', [0, 1, -.01, .12, -1, 1], .7, .45], ['hals', [-1, 1, .3, .6, -1, 1], 1.0, 0]]) await bild(path.join(dir, 'zoom_' + n + '.png'), parts, { W: 500, H: 500, yaw, pitch, box: B }); }
// ---------------------------------------------------------------- Aufbau: Gestalt → Teile mit Lidern, Normalen, Skelett, Gewichten, Hautattributen
export async function aufbau() { const T0 = await quelle(); umformen(T0);
  const T = { arm: schweissen(T0.arm), koerper: schweissen(T0.koerper), kopf: schweissen(T0.kopf), augen: schweissen(T0.augen) };
  const seiten = augen(T.augen); T.lider = lider(T.augen, seiten);
  for (const t of Object.values(T)) t.nrm = normalen(t.pos, t.idx);
  const J = messen(T, seiten), seg = strecken(J);
  for (const [k, t] of Object.entries(T)) gewichte(t, k, J, seg);
  haut(T, J);
  return { T, J, seg, seiten }; }
// ---------------------------------------------------------------- GLB: ein Netz-Knoten mit Haut, zwei Primitive (Haut: Arme+Körper+Kopf+Lider, Augen)
function dokument(T, J) { const doc = new Document(), buf = doc.createBuffer(), sc = doc.createScene('Szene'), top = doc.createNode('Beobachter'); sc.addChild(top); const arm = doc.createNode('Armature'); top.addChild(arm);
  const jn = new Map(); for (const [n, par] of KNOCHEN) { const w = J[n] || new THREE.Vector3(), pw = par ? J[par] || new THREE.Vector3() : new THREE.Vector3(); const node = doc.createNode(n).setTranslation([w.x - pw.x, w.y - pw.y, w.z - pw.z]); (par ? jn.get(par) : arm).addChild(node); jn.set(n, node); }
  const acc = (type, arr, norm) => { const a = doc.createAccessor().setType(type).setArray(arr).setBuffer(buf); if (norm) a.setNormalized(true); return a; };
  const prim = (teile, mat, mitUV) => { let n = 0, m = 0; for (const t of teile) { n += t.pos.length / 3; m += t.idx.length; } const P = new Float32Array(n * 3), N = new Float32Array(n * 3), Cc = new Float32Array(n * 3), H = new Float32Array(n * 4), JI = new Uint16Array(n * 4), WW = new Float32Array(n * 4), U = new Float32Array(n * 2), I = new Uint32Array(m); let o = 0, oi = 0;
    for (const t of teile) { const k = t.pos.length / 3; P.set(t.pos, o * 3); N.set(t.nrm, o * 3); if (t.farbe) Cc.set(t.farbe, o * 3); else Cc.fill(.03, o * 3, (o + k) * 3); if (t.haut) H.set(t.haut, o * 4); JI.set(t.ji, o * 4); WW.set(t.ww, o * 4); if (t.uv) U.set(t.uv, o * 2); for (let i = 0; i < t.idx.length; i++) I[oi + i] = t.idx[i] + o; o += k; oi += t.idx.length; }
    const p = doc.createPrimitive().setMaterial(mat).setIndices(acc('SCALAR', I)).setAttribute('POSITION', acc('VEC3', P)).setAttribute('NORMAL', acc('VEC3', N)).setAttribute('COLOR_0', acc('VEC3', Cc)).setAttribute('_HAUT', acc('VEC4', H)).setAttribute('JOINTS_0', acc('VEC4', JI)).setAttribute('WEIGHTS_0', acc('VEC4', WW));
    if (mitUV) p.setAttribute('TEXCOORD_0', acc('VEC2', U)); return p; };
  const mH = doc.createMaterial('Haut').setBaseColorFactor([.92, .9, .87, 1]).setRoughnessFactor(.5).setMetallicFactor(0), mA = doc.createMaterial('Auge').setBaseColorFactor([.02, .02, .025, 1]).setRoughnessFactor(.05).setMetallicFactor(0);
  const mesh = doc.createMesh('Beobachter_Netz').addPrimitive(prim([T.arm, T.koerper, T.kopf, T.lider], mH, false)).addPrimitive(prim([T.augen], mA, true));
  const mn = doc.createNode('Beobachter_Haut').setMesh(mesh); top.addChild(mn);
  const skin = doc.createSkin('Beobachter_Skelett'), ibm = new Float32Array(KNOCHEN.length * 16); KNOCHEN.forEach(([n], i) => { skin.addJoint(jn.get(n)); const w = J[n] || new THREE.Vector3(); new THREE.Matrix4().makeTranslation(-w.x, -w.y, -w.z).toArray(ibm, i * 16); });
  skin.setInverseBindMatrices(acc('MAT4', ibm)).setSkeleton(jn.get('wurzel')); mn.setSkin(skin); return doc; }
async function toThree(io, doc) { const bin = await io.writeBinary(cloneDocument(doc)); return await new Promise((res, rej) => new GLTFLoader().parse(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), '', res, rej)); }
export async function backen() { const { T, J } = await aufbau(); const io = new NodeIO().registerExtensions(ALL_EXTENSIONS), doc = dokument(T, J);
  const g = await toThree(io, doc), root = g.scene; root.updateMatrixWorld(true); const names = {}; root.traverse(o => { if (o.isBone) names[o.name] = o.name; }); const R = new Rig(root, names);
  const only = opt('nur') ? String(opt('nur')).split(',') : null, C = beobClips(J), list = [], meta = {};
  for (const [k, c] of Object.entries(C)) { if (only && !only.includes(k)) continue; list.push(record(R, k, c.dur, 30, t => c.pose(R, t), { loop: c.loop, trans: ['becken'] })); meta[k] = { speed: c.speed, loop: c.loop, dur: c.dur, ...(c.wurzel ? { wurzel: c.wurzel } : {}) }; }
  R.reset(); writeClips(doc, list, { tolDeg: .2, tolM: .0005 });
  const lidAx = {}; for (const S of ['L', 'R']) lidAx[S] = J['lid' + S].toArray().map(v => +v.toFixed(4));
  doc.getRoot().listScenes()[0].setExtras({ motion: meta, lid: lidAx, quelle: 'Cute Alien Pet (MissTxxT, Fab) · Gestalt/Lider/Skelett/Clips R-21' });
  return { doc, io, meta, J }; }
const HAUPT = /beobachter_bau.mjs$/.test(process.argv[1] || ''); if (HAUPT) {
  const t0 = Date.now(); const { T, J, seiten } = await aufbau(); console.log('Aufbau', ((Date.now() - t0) / 1000).toFixed(1) + ' s', Object.entries(T).map(([k, t]) => k + ' ' + t.pos.length / 3).join(', '));
  for (const [k, v] of Object.entries(J)) console.log(' J', k, v && v.isVector3 ? v.toArray().map(x => x.toFixed(3)).join(' ') : (+v).toFixed(3));
  if (opt('vorschau')) await vorschau(String(opt('vorschau')), T);
  if (opt('schreiben') || opt('film') || opt('pose')) { const { doc, io, meta } = await backen(); const file = path.join(DIR, 'beobachter_rig.glb');
    if (opt('schreiben')) { await io.write(file, doc); console.log('geschrieben', file, (fs.statSync(file).size / 1e6).toFixed(2) + ' MB', Object.keys(meta).join(',')); }
    if (opt('pose')) { const g2 = await toThree(io, doc), r2 = g2.scene; const mx = new THREE.AnimationMixer(r2); const outs = [];
      for (const pz of String(opt('pose')).split(',')) { const [cn, ts] = pz.split(':'); const clip = g2.animations.find(a => a.name === cn); mx.stopAllAction(); if (clip) { const a = mx.clipAction(clip); a.play(); mx.setTime(+ts || 0); } r2.updateMatrixWorld(true);
        const parts = []; r2.traverse(m => { if (!m.isSkinnedMesh) return; const G = m.geometry, n = G.attributes.position.count, pos = new Float32Array(n * 3), v = new THREE.Vector3(); for (let i = 0; i < n; i++) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); pos.set([v.x, v.y, v.z], i * 3); }
          const idx = Uint32Array.from(G.index.array); parts.push({ pos, idx, nrm: normalen(pos, idx), col: null }); });
        for (const [vn, yaw] of [['v', .35], ['s', 1.9]]) { const f = path.join(String(opt('bilder') || '.'), 'pose_' + cn + '_' + ts + '_' + vn + '.png'); await bild(f, parts, { W: 420, H: 600, yaw, pitch: .1 }); outs.push(f); } }
      console.log('Posen', outs.join(' ')); }
    if (opt('film')) { const g2 = await toThree(io, doc), r2 = g2.scene; r2.updateMatrixWorld(true); const cl = g2.animations; cl.forEach(a => a.userData = { speed: meta[a.name].speed }); fs.mkdirSync(String(opt('film')), { recursive: true });
      console.log(await film(path.join(String(opt('film')), 'beobachter' + (opt('vorn') ? '_vorn' : '') + '.png'), r2, null, cl, { n: +(opt('n') || 7), W: +(opt('w') || 200), H: +(opt('w') || 200) * 1.3, fit: { sc: +(opt('w') || 200) * 1.3 * .8 / .9 }, views: opt('vorn') ? [['vorn', 0], ['schraeg hinten', 2.4]] : [['seite', Math.PI / 2], ['schraeg', .7]] })); } }
}
