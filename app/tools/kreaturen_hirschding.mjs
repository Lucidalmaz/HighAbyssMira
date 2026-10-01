// Q-1 · Hirschding (wahre Gestalt des Wendigo): echtes Skelett für „Deer Thing“ (Sketchfab, CC-BY) – Knochen, Hautgewichte, Spielrahmen (Meter, +z vorn, Füße auf 0).
// Das Rohmodell steht als Vierbeiner (Kopf −x, Hufe bei y = −1). Knochen haben die Ruhedrehung Null; Gewichte über Abstand zu den Knochenstrecken mit weichen Gelenkübergängen
// und Regionen (Beine nur an ihrer Seite, Kiefer nur unterm Schädel, Geweih nur am Kopf).
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions'; import { prune } from '@gltf-transform/functions'; import * as THREE from 'three';
const smooth = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
export const DT_SRC = 'C:/Users/GIGABYTE/HAM_FabDownloads/v6/c_deerthing__deer_thing.glb';
export const DT_S = 1.3; // Maßstab: Rohmodell 2 Einheiten hoch (mit Geweih) → aufrecht ~2,7 m (Bibel: anderthalbmal so groß wie Luke)
// Gelenke im Rohmodell [x, y, z] (Kopf −x, links +z), Eltern, Endpunkt (für Blätter)
const J = [
  ['root', null, [0.86, -0.97, 0]],
  ['hips', 'root', [0.78, 0.02, 0]],
  ['spine1', 'hips', [0.46, 0.07, 0]],
  ['spine2', 'spine1', [0.14, 0.1, 0]],
  ['chest', 'spine2', [-0.1, 0.18, 0]],
  ['neck1', 'chest', [-0.22, 0.34, 0]],
  ['neck2', 'neck1', [-0.42, 0.52, 0]],
  ['head', 'neck2', [-0.62, 0.62, 0], [-0.98, 0.42, 0]],
  ['jaw', 'head', [-0.71, 0.52, 0], [-0.86, 0.27, 0]],
  ['tail', 'hips', [0.9, 0.0, 0], [0.98, -0.1, 0]],
];
for (const [s, z] of [['L', 1], ['R', -1]]) J.push(
  ['scap' + s, 'chest', [0.1, 0.12, 0.07 * z]],
  ['arm' + s, 'scap' + s, [0.19, -0.12, 0.11 * z]],
  ['fore' + s, 'arm' + s, [0.18, -0.42, 0.115 * z]],
  ['cannon' + s, 'fore' + s, [0.265, -0.74, 0.122 * z]],
  ['hoof' + s, 'cannon' + s, [0.196, -0.87, 0.12 * z], [0.278, -1.0, 0.126 * z]],
  ['thigh' + s, 'hips', [0.78, 0.0, 0.11 * z]],
  ['shin' + s, 'thigh' + s, [0.67, -0.31, 0.115 * z]],
  ['meta' + s, 'shin' + s, [0.92, -0.72, 0.11 * z]],
  ['hhoof' + s, 'meta' + s, [0.87, -0.87, 0.11 * z], [0.847, -0.975, 0.11 * z]]);
// Rohmodell → Spielrahmen: Drehung +90° um y (Kopf −x → +z), Maßstab, Hinterhufe in den Ursprung
const R0 = J[0][2]; export const toGame = (x, y, z) => [z * DT_S, (y - R0[1]) * DT_S, -(x - R0[0]) * DT_S];
export async function buildHirschding(outFile) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS), doc = await io.read(DT_SRC), R = doc.getRoot(), buf = R.listBuffers()[0];
  const scene = R.listScenes()[0], prims = []; const M = new THREE.Matrix4(), N3 = new THREE.Matrix3(), v = new THREE.Vector3();
  const G = new THREE.Matrix4().set(0, 0, DT_S, 0, 0, DT_S, 0, -DT_S * R0[1], -DT_S, 0, 0, DT_S * R0[0], 0, 0, 0, 1); // = toGame
  for (const node of R.listNodes()) { const mesh = node.getMesh(); if (!mesh) continue; M.fromArray(node.getWorldMatrix()).premultiply(G); N3.getNormalMatrix(M);
    for (const p of mesh.listPrimitives()) { const P = p.getAttribute('POSITION'), Nn = p.getAttribute('NORMAL'), Tg = p.getAttribute('TANGENT');
      const pa = new Float32Array(P.getCount() * 3), e = []; for (let i = 0; i < P.getCount(); i++) { P.getElement(i, e); v.fromArray(e).applyMatrix4(M); pa.set([v.x, v.y, v.z], i * 3); }
      p.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(pa).setBuffer(buf));
      if (Nn) { const na = new Float32Array(Nn.getCount() * 3); for (let i = 0; i < Nn.getCount(); i++) { Nn.getElement(i, e); v.fromArray(e).applyMatrix3(N3).normalize(); na.set([v.x, v.y, v.z], i * 3); } p.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(na).setBuffer(buf)); }
      if (Tg) { const ta = new Float32Array(Tg.getCount() * 4); for (let i = 0; i < Tg.getCount(); i++) { Tg.getElement(i, e); v.set(e[0], e[1], e[2]).transformDirection(M); ta.set([v.x, v.y, v.z, e[3]], i * 4); } p.setAttribute('TANGENT', doc.createAccessor().setType('VEC4').setArray(ta).setBuffer(buf)); }
      prims.push(p); } }
  for (const n of R.listNodes()) n.dispose(); for (const m of R.listMeshes()) if (!prims.some(p => m.listPrimitives().includes(p))) m.dispose();
  // Knoten: Wurzel → Armature → Gelenke (Ruhedrehung 0), Netz-Knoten mit Haut
  const top = doc.createNode('Hirschding'); scene.addChild(top); const arm = doc.createNode('Armature'); top.addChild(arm);
  const W = new Map(), jn = new Map(); for (const [n, par, p] of J) W.set(n, toGame(...p));
  for (const [n, par] of J) { const node = doc.createNode(n), w = W.get(n), pw = par ? W.get(par) : [0, 0, 0]; node.setTranslation([w[0] - pw[0], w[1] - pw[1], w[2] - pw[2]]); (par ? jn.get(par) : arm).addChild(node); jn.set(n, node); }
  const mesh = doc.createMesh('Hirschding_Koerper'); for (const p of prims) { for (const m of R.listMeshes()) if (m !== mesh && m.listPrimitives().includes(p)) m.removePrimitive(p); mesh.addPrimitive(p); }
  for (const m of R.listMeshes()) if (m !== mesh) m.dispose();
  const mn = doc.createNode('Hirschding_Netz').setMesh(mesh); top.addChild(mn);
  const skin = doc.createSkin('Hirschding_Haut'); const ibm = new Float32Array(J.length * 16); J.forEach(([n], i) => { skin.addJoint(jn.get(n)); const w = W.get(n); new THREE.Matrix4().makeTranslation(-w[0], -w[1], -w[2]).toArray(ibm, i * 16); });
  skin.setInverseBindMatrices(doc.createAccessor().setType('MAT4').setArray(ibm).setBuffer(buf)).setSkeleton(jn.get('root')); mn.setSkin(skin);
  // Gewichte
  const idx = new Map(J.map(([n], i) => [n, i]));
  // Kette je Knochen: welches Kind setzt die Strecke fort (Übergang am Ende), welcher Knochen liegt davor (Übergang am Anfang)
  const chainKid = { hips: 'spine1', spine1: 'spine2', spine2: 'chest', chest: 'neck1', neck1: 'neck2', neck2: 'head' }; for (const s of ['L', 'R']) Object.assign(chainKid, { ['scap' + s]: 'arm' + s, ['arm' + s]: 'fore' + s, ['fore' + s]: 'cannon' + s, ['cannon' + s]: 'hoof' + s, ['thigh' + s]: 'shin' + s, ['shin' + s]: 'meta' + s, ['meta' + s]: 'hhoof' + s });
  const parOf = n => /^thigh/.test(n) || n === 'tail' ? 'hips' : /^scap/.test(n) ? 'chest' : n === 'hips' ? null : (J.find(j => j[0] === n)[1] === 'root' ? null : J.find(j => j[0] === n)[1]);
  const segs = J.map(([n, par, p, end]) => ({ n, par: parOf(n), a: W.get(n), b: end ? toGame(...end) : chainKid[n] ? W.get(chainKid[n]) : W.get(n) }));
  const segD = (s, x, y, z) => { const ax = s.b[0] - s.a[0], ay = s.b[1] - s.a[1], az = s.b[2] - s.a[2], L2 = ax * ax + ay * ay + az * az || 1e-9; const t = ((x - s.a[0]) * ax + (y - s.a[1]) * ay + (z - s.a[2]) * az) / L2, tc = Math.max(0, Math.min(1, t));
    return [Math.hypot(x - s.a[0] - ax * tc, y - s.a[1] - ay * tc, z - s.a[2] - az * tc), t]; };
  const body = ['hips', 'spine1', 'spine2', 'chest', 'neck1', 'neck2', 'head', 'tail', 'scapL', 'scapR', 'thighL', 'thighR'];
  const cand = (X, Y, Z) => { // Regionen im Rohmodell-Koordinatensystem (x vorn/hinten, y, z Seite)
    const s = Z >= 0 ? 'L' : 'R';
    if (X < -0.64) { const jaw = X < -0.68 && Y < 0.47 + 0.45 * (X + 0.72) && Y < 0.52; return jaw ? ['jaw'] : ['head']; }
    if (X < -0.5 && Y > 0.45) return ['neck2', 'head'];
    if (Y < -0.3 && X > 0.52 && (Math.abs(Z) > 0.055 || Y < -0.36)) return ['thigh' + s, 'shin' + s, 'meta' + s, 'hhoof' + s];
    if (Y < -0.33 && X > -0.05 && X < 0.46 && (Math.abs(Z) > 0.05 || Y < -0.4)) return ['arm' + s, 'fore' + s, 'cannon' + s, 'hoof' + s];
    if (Y < -0.12 && X > 0.52 && Math.abs(Z) > 0.06) return ['hips', 'spine1', 'thigh' + s, 'shin' + s, 'tail'];
    if (Y < -0.1 && X > -0.05 && X < 0.4 && Math.abs(Z) > 0.07) return ['spine2', 'chest', 'scap' + s];
    return body.filter(b => !/(L|R)$/.test(b) || b.endsWith(s)); };
  let stat = {}; for (const p of prims) { const P = p.getAttribute('POSITION'), n = P.getCount(), JI = new Uint16Array(n * 4), WW = new Float32Array(n * 4), e = [];
    for (let i = 0; i < n; i++) { P.getElement(i, e); const [x, y, z] = e; const X = R0[0] - z / DT_S, Y = y / DT_S + R0[1], Z = x / DT_S; // zurück ins Rohmodell
      const C = cand(X, Y, Z); let best = null, bd = 1e9, bt = 0; for (const c of C) { const s = segs[idx.get(c)], [d, t] = segD(s, x, y, z); if (d < bd) { bd = d; best = s; bt = t; } }
      const w = new Map(); const add = (k, a) => { if (!k || !idx.has(k)) return; w.set(k, (w.get(k) || 0) + a); };
      const par = best.par, kid = chainKid[best.n];
      if (/^thigh/.test(best.n) && Y > -0.3) { const k = smooth(-Y / 0.3) * .9; add(best.n, k); add('hips', 1 - k); } // Keule: je höher, desto mehr Becken (sonst reißt das Fleisch beim Aufrichten mit)
      else if (/^arm/.test(best.n) && Y > -0.42) { const k = smooth((-0.14 - Y) / 0.28) * .9; add(best.n, k); add('scap' + best.n.slice(-1), 1 - k); } // Schulter: ebenso
      else if (/^scap/.test(best.n)) { const k = smooth((0.12 - Y) / 0.3) * .5; add(best.n, .5 + k * .6); add('chest', .5 - k * .6); }
      else { const bz = .22; if (bt < bz && par) { const k = .5 + .5 * Math.max(0, bt) / bz; add(best.n, k); add(par, 1 - k); } else if (bt > 1 - bz && kid && C.includes(kid)) { const k = .5 + .5 * Math.max(0, 1 - bt) / bz; add(best.n, k); add(kid, 1 - k); } else add(best.n, 1); }
      const L = [...w.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4), sum = L.reduce((a, b) => a + b[1], 0); L.forEach(([k, a], j) => { JI[i * 4 + j] = idx.get(k); WW[i * 4 + j] = a / sum; }); stat[L[0][0]] = (stat[L[0][0]] || 0) + 1; }
    p.setAttribute('JOINTS_0', doc.createAccessor().setType('VEC4').setArray(JI).setBuffer(buf)); p.setAttribute('WEIGHTS_0', doc.createAccessor().setType('VEC4').setArray(WW).setBuffer(buf)); }
  console.log('Gewichte (Ecken je Hauptknochen):', Object.entries(stat).map(([k, v]) => k + ' ' + v).join(', '));
  await doc.transform(prune());
  if (outFile) await io.write(outFile, doc); return { doc, io, joints: J.map(j => j[0]) };
}
