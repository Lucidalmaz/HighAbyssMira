// Katzenfell neu aufbauen: Haarkarten (Netz `haar`) je Körperregion, Ohrflaum, Schnurrhaare (`bart`) – auf dem vorhandenen Katzenmodell (Rig und Clips bleiben unverändert).
//   node tools/katzen_fell.mjs [quelle.glb] [ziel.glb]     (Standard: Sicherung HAM_Blender/katzen/model_orig.glb → game/assets/ms/katze/model.glb)
// Jede Haarkarte ist ein Band aus 2–3 Segmenten, das an einem Punkt der Haut (Wurzel) ansetzt, der Fellrichtung folgt (Kopf → Schwanz, an den Beinen nach unten,
// am Ohr zur Spitze), sich zur Spitze hin von der Haut abhebt und je nach Region hängt (Bauch, Hosen, Schwanz). Gewichte und Knochen kommen vom nächsten Hautpunkt,
// die Normale ist die der Haut (weiches Licht statt Kartenkanten). Zusätzliche Eckpunktdaten: TEXCOORD_1 = UV der Haut (Fellmaske!), _ROOT = Wurzelpunkt
// (katzen.js verkürzt das Fell je Katze: pos = Wurzel + (pos − Wurzel) · Länge).
import { NodeIO, VertexLayout } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions'; import fs from 'fs'; import sharp from 'sharp';
const SRC = process.argv[2] || 'C:/Users/GIGABYTE/HAM_Blender/katzen/model_orig.glb', DST = process.argv[3] || 'C:/Users/GIGABYTE/HighAbyssMira-Repo/game/assets/ms/katze/model.glb';
const BUDGET = +(process.env.KARTEN || 0); // optional: Zahl der Karten erzwingen
let seed = 20261008; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = (a, b) => a + rnd() * (b - a);
const V = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], len: a => Math.hypot(a[0], a[1], a[2]), norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; } };
const rotAxis = (v, ax, ang) => { const c = Math.cos(ang), s = Math.sin(ang), k = V.cross(ax, v), d = V.dot(ax, v) * (1 - c); return [v[0] * c + k[0] * s + ax[0] * d, v[1] * c + k[1] * s + ax[1] * d, v[2] * c + k[2] * s + ax[2] * d]; };

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).setVertexLayout(VertexLayout.SEPARATE), doc = await io.read(SRC), root = doc.getRoot();
const nodeByName = n => root.listNodes().find(x => x.getName() === n);
const fellN = nodeByName('fell'), haarN = nodeByName('haar'), augenN = nodeByName('augen'), skin = fellN.getSkin();
const joints = skin.listJoints(), jn = joints.map(j => j.getName()), jpos = joints.map(j => { const m = j.getWorldMatrix(); return [m[12], m[13], m[14]]; });
const P = fellN.getMesh().listPrimitives()[0], pos = P.getAttribute('POSITION').getArray(), nor = P.getAttribute('NORMAL').getArray(), uv = P.getAttribute('TEXCOORD_0').getArray(), jnt = P.getAttribute('JOINTS_0').getArray(), wgt = P.getAttribute('WEIGHTS_0').getArray(), idx = P.getIndices().getArray();
const nV = pos.length / 3, nT = idx.length / 3;
// ---------------------------------------------------------------- Proportionen: größerer Kopf (Kindchenschema), kräftigerer Hals – nur Netz, Knochen und Clips bleiben
const KOPF = +(process.env.KOPF || 1.14), HALS = 1.12;
{ const jn0 = skin.listJoints().map(j => j.getName()), jw = jn0.map(n => /^(head|jaw|earL|earR|x_lip.*|x_DEFspine.*)$/.test(n) ? 1 : 0), nw = jn0.map(n => /^(neck|neck2)$/.test(n) ? 1 : 0);
  const pj = n => { const m = joints[jn0.indexOf(n)].getWorldMatrix(); return [m[12], m[13], m[14]]; }, hp0 = pj('head'), nk = pj('neck'), n2 = pj('neck2'), ax = V.norm(V.sub(n2, nk));
  const scaleMesh = (prim) => { const A = prim.getAttribute('POSITION'), arr = A.getArray(), J = prim.getAttribute('JOINTS_0').getArray(), Wt = prim.getAttribute('WEIGHTS_0').getArray();
    for (let i = 0; i < arr.length / 3; i++) { let wh = 0, wn = 0; for (let k = 0; k < 4; k++) { wh += Wt[i * 4 + k] * jw[J[i * 4 + k]]; wn += Wt[i * 4 + k] * nw[J[i * 4 + k]]; }
      let p = [arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]];
      if (wh > 0) { const f = 1 + (KOPF - 1) * Math.min(1, wh); p = V.add(hp0, V.mul(V.sub(p, hp0), f)); }
      if (wn > 0) { const q = V.sub(p, nk), al = V.dot(q, ax), r = V.sub(q, V.mul(ax, al)), f = 1 + (HALS - 1) * Math.min(1, wn); p = V.add(V.add(nk, V.mul(ax, al)), V.mul(r, f)); }
      arr[i * 3] = p[0]; arr[i * 3 + 1] = p[1]; arr[i * 3 + 2] = p[2]; } A.setArray(arr); };
  for (const nm of ['fell', 'augen', 'zaehne']) scaleMesh(nodeByName(nm).getMesh().listPrimitives()[0]); }
// ---------------------------------------------------------------- Maske (Rosa = Nase, Pfotenballen, Ohrinnenseite: dort kein Fell)
const maskTex = root.listTextures().find(t => /png/.test(t.getMimeType()) && root.listMaterials()[0].getMetallicRoughnessTexture() === t) || root.listMaterials()[0].getMetallicRoughnessTexture();
const mk = await sharp(Buffer.from(maskTex.getImage())).raw().toBuffer({ resolveWithObject: true }), MW = mk.info.width, MH = mk.info.height, MC = mk.info.channels;
const maskAt = (u, v) => { const x = Math.min(MW - 1, Math.max(0, Math.floor(u * MW))), y = Math.min(MH - 1, Math.max(0, Math.floor(v * MH))), i = (y * MW + x) * MC; return [mk.data[i], mk.data[i + 1], mk.data[i + 2]]; };
const isPink = (u, v) => { const [r, g, b] = maskAt(u, v); return b > 130 && r > 180 && g < 120; };
// ---------------------------------------------------------------- Regionen je Knochen
const regOf = n => /^(head|x_DEFspine|x_lip.*)$/.test(n) ? 'kopf' : n === 'jaw' ? 'kopf' : /^ear/.test(n) ? 'ohr' : /^(neck|neck2)$/.test(n) ? 'hals' : /^(chest|shoulder.|x_chest)$/.test(n) ? 'brust' : /^(spine1|spine2|belly|hips)$/.test(n) ? 'rumpf'
  : /^(thigh|thigh2)[LR]$/.test(n) ? 'schenkel' : /^(arm|arm2|fore|fore2|shin|shin2)[LR]$/.test(n) ? 'bein' : /^(hand|hand2|paw|x_ftoe|foot|foot2|toe|x_rtoe)[LR]$/.test(n) ? 'pfote' : /^(tail.|x_tail.*)$/.test(n) ? 'schwanz' : 'rumpf';
const regJ = jn.map(regOf), REGS = ['kopf', 'ohr', 'hals', 'brust', 'rumpf', 'schenkel', 'bein', 'pfote', 'schwanz'];
const vReg = new Array(nV), vBone = new Array(nV);
for (let i = 0; i < nV; i++) { const acc = {}; let bb = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = wgt[i * 4 + k], j = jnt[i * 4 + k]; acc[regJ[j]] = (acc[regJ[j]] || 0) + w; if (w > bw) { bw = w; bb = j; } } vReg[i] = Object.entries(acc).sort((a, b) => b[1] - a[1])[0][0]; vBone[i] = bb; }
// Augenmitten
const AP = augenN.getMesh().listPrimitives()[0].getAttribute('POSITION').getArray(), eyes = [[0, 0, 0, 0], [0, 0, 0, 0]];
for (let i = 0; i < AP.length / 3; i++) { const s = AP[i * 3] > 0 ? 0 : 1; eyes[s][0] += AP[i * 3]; eyes[s][1] += AP[i * 3 + 1]; eyes[s][2] += AP[i * 3 + 2]; eyes[s][3]++; } const eyeC = eyes.map(e => [e[0] / e[3], e[1] / e[3], e[2] / e[3]]);
// Augen 12 % größer (niedlicher), um die eigene Mitte
{ const ap = augenN.getMesh().listPrimitives()[0].getAttribute('POSITION'), arr = ap.getArray(); for (let i = 0; i < arr.length / 3; i++) { const e = eyeC[arr[i * 3] > 0 ? 0 : 1]; for (let k = 0; k < 3; k++) arr[i * 3 + k] = e[k] + (arr[i * 3 + k] - e[k]) * 1.12; } ap.setArray(arr); }
const jIdx = n => jn.indexOf(n), tailC = ['tail1', 'tail2', 'tail3', 'tail4'].map(n => jpos[jIdx(n)]); const tip = V.add(tailC[3], V.mul(V.norm(V.sub(tailC[3], tailC[2])), .07)); tailC.push(tip);
const headP = jpos[jIdx('head')], earP = { L: jpos[jIdx('earL')], R: jpos[jIdx('earR')] };
// ---------------------------------------------------------------- Parameter je Region: Länge, Breite, Anhebung (Wurzel → Spitze, rad), Hängen, Dichte (Karten/m²), Fellrichtung
const PAR = {
  kopf: { L: [.011, .016], w: [.010, .014], l0: .25, l1: .6, g: 0, d: 6500 }, ohr: { L: [.006, .010], w: [.006, .008], l0: .3, l1: .5, g: 0, d: 4200 },
  hals: { L: [.030, .045], w: [.016, .022], l0: .3, l1: .75, g: .5, d: 4600 }, brust: { L: [.035, .05], w: [.017, .024], l0: .3, l1: .8, g: .8, d: 4600 },
  rumpf: { L: [.028, .042], w: [.016, .022], l0: .28, l1: .7, g: .6, d: 4800 }, schenkel: { L: [.032, .05], w: [.016, .022], l0: .3, l1: .75, g: 1.0, d: 4600 },
  bein: { L: [.014, .022], w: [.010, .014], l0: .2, l1: .5, g: .2, d: 6000 }, pfote: { L: [.005, .009], w: [.006, .009], l0: .15, l1: .35, g: 0, d: 2600 },
  schwanz: { L: [.040, .060], w: [.014, .020], l0: .35, l1: .65, g: .3, d: 5400 } };
const grav = [0, -1, 0];
function flowDir(reg, p, n, i) {
  let f;
  if (reg === 'schwanz') { let bs = 1e9, bi = 0; for (let k = 0; k < 4; k++) { const a = tailC[k], b = tailC[k + 1], ab = V.sub(b, a), t = Math.max(0, Math.min(1, V.dot(V.sub(p, a), ab) / V.dot(ab, ab))), q = V.add(a, V.mul(ab, t)), d = V.len(V.sub(p, q)); if (d < bs) { bs = d; bi = k; } } f = V.norm(V.sub(tailC[bi + 1], tailC[bi])); }
  else if (reg === 'ohr') { const pv = p[0] > 0 ? earP.L : earP.R; f = V.norm(V.sub(p, pv)); }
  else if (reg === 'bein' || reg === 'pfote') f = V.norm([0, -1, -.12]);
  else if (reg === 'kopf') f = V.norm([0, .05, -1]);
  else if (reg === 'hals') f = V.norm([0, -.3, -1]);
  else if (reg === 'schenkel') f = V.norm([0, -.7, -.5]);
  else f = V.norm([0, -.4, -1]);
  const d = V.dot(f, n); f = V.sub(f, V.mul(n, d)); return V.len(f) < .15 ? V.norm(V.cross(n, [1, 0, 0])) : V.norm(f);
}
// ---------------------------------------------------------------- Oberfläche abtasten (flächengewichtet je Region)
const tri = [], tArea = [];
for (let t = 0; t < nT; t++) { const a = idx[t * 3], b = idx[t * 3 + 1], c = idx[t * 3 + 2], pa = [pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2]], pb = [pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2]], pc = [pos[c * 3], pos[c * 3 + 1], pos[c * 3 + 2]];
  const ar = V.len(V.cross(V.sub(pb, pa), V.sub(pc, pa))) / 2; tri.push([a, b, c]); tArea.push(ar); }
const cards = []; const areaReg = {}; for (let t = 0; t < nT; t++) { const reg = vReg[tri[t][0]]; areaReg[reg] = (areaReg[reg] || 0) + tArea[t]; }
console.log('Fläche je Region (cm²):', Object.fromEntries(Object.entries(areaReg).map(([k, v]) => [k, Math.round(v * 1e4)])));
const bary = () => { let a = rnd(), b = rnd(); if (a + b > 1) { a = 1 - a; b = 1 - b; } return [a, b, 1 - a - b]; };
for (let t = 0; t < nT; t++) {
  const [a, b, c] = tri[t], reg = vReg[a], par = PAR[reg]; const regs = new Set([vReg[a], vReg[b], vReg[c]]); const r2 = regs.size > 1 ? vReg[[a, b, c].sort((x, y) => 0)[0]] : reg;
  let n = tArea[t] * par.d * (+process.env.DICHTE || .88); let cnt = Math.floor(n) + (rnd() < n - Math.floor(n) ? 1 : 0);
  for (let s = 0; s < cnt; s++) {
    const [u, v, w] = bary(), at = (arr, k) => arr[a * k] * u + arr[b * k] * v + arr[c * k] * w;
    const p = [pos[a * 3] * u + pos[b * 3] * v + pos[c * 3] * w, pos[a * 3 + 1] * u + pos[b * 3 + 1] * v + pos[c * 3 + 1] * w, pos[a * 3 + 2] * u + pos[b * 3 + 2] * v + pos[c * 3 + 2] * w];
    const nn = V.norm([nor[a * 3] * u + nor[b * 3] * v + nor[c * 3] * w, nor[a * 3 + 1] * u + nor[b * 3 + 1] * v + nor[c * 3 + 1] * w, nor[a * 3 + 2] * u + nor[b * 3 + 2] * v + nor[c * 3 + 2] * w]);
    const best = u >= v && u >= w ? a : v >= w ? b : c; const tu = uv[best * 2], tv = uv[best * 2 + 1];
    { const nk = jpos[jIdx('neck')], n2 = jpos[jIdx('neck2')], cc = V.add(nk, V.mul(V.sub(n2, nk), .45)), ax = V.norm(V.sub(n2, nk)), q = V.sub(p, cc), al = V.dot(q, ax); if (Math.abs(al) < .0075 && V.len(V.sub(q, V.mul(ax, al))) < .075) continue; } // Halsband: kein Fell darüber
    if (isPink(tu, tv)) continue; // Nase, Ballen, Innenohr (Flaum folgt separat)
    let pr = reg, L = R(...par.L), W = R(...par.w);
    // Augen und Nase aussparen
    if (reg === 'kopf' && p[2] > headP[2] + .02 && p[1] < Math.min(eyeC[0][1], eyeC[1][1]) - .02) continue; // Kinn/Maul: kein Fell (sonst „Papierschnipsel“)
    if (reg === 'hals' && nn[1] < -.3) L *= .6;
    if (reg === 'kopf') { if (V.len(V.sub(p, eyeC[0])) < .011 || V.len(V.sub(p, eyeC[1])) < .011) continue; const fw = p[2] - headP[2]; if (fw > .035) { L *= .45; W *= .6; } /* Schnauze: fast kahl */ if (V.len(V.sub(p, eyeC[0])) < .02 || V.len(V.sub(p, eyeC[1])) < .02) { L *= .6; } }
    if (reg === 'ohr') { const pv = p[0] > 0 ? earP.L : earP.R; const dd = V.len(V.sub(p, pv)); if (dd > .03) { L *= 1.2; } }
    const f0 = flowDir(reg, p, nn, best); let lift0 = par.l0, lift1 = par.l1, g = par.g;
    if (reg === 'rumpf' && nn[1] < -.45) { L *= 1.2; g *= 1.6; } // Bauchfell hängt länger
    if (reg === 'rumpf' && nn[1] > .5) { L *= .9; } // Rückenlinie flacher
    // Richtungsstreuung
    const fj = V.norm(V.add(f0, V.mul(V.cross(nn, f0), R(-.28, .28)))), segs = L > .034 ? 3 : 2;
    cards.push({ p, n: nn, f: fj, L, W, lift0: lift0 * R(.8, 1.2), lift1: lift1 * R(.85, 1.15), g, segs, roll: R(-.7, .7), reg: pr, best, a, b, c, bw: [u, v, w], big: L > .024 });
  }
}
// Ohrflaum (Innenseite): Büschel aus kurzen Karten, die vom Ohrgrund nach vorn/oben zeigen; Ohrrand-Büschel
for (const side of ['L', 'R']) { const pv = earP[side], sg = side === 'L' ? 1 : -1;
  for (let t = 0; t < nT; t++) { const [a, b, c] = tri[t]; if (vReg[a] !== 'ohr' || vReg[b] !== 'ohr' || vReg[c] !== 'ohr' || (pos[a * 3] > 0) !== (side === 'L')) continue;
    const n0 = V.norm([nor[a * 3] + nor[b * 3] + nor[c * 3], nor[a * 3 + 1] + nor[b * 3 + 1] + nor[c * 3 + 1], nor[a * 3 + 2] + nor[b * 3 + 2] + nor[c * 3 + 2]]); if (n0[2] < .25 || n0[0] * sg > .5) continue; // nach vorn gerichtet, nicht Außenseite
    let n = tArea[t] * 9000; const cnt = Math.floor(n) + (rnd() < n - Math.floor(n) ? 1 : 0);
    for (let s = 0; s < cnt; s++) { const [u, v, w] = bary(), p = [pos[a * 3] * u + pos[b * 3] * v + pos[c * 3] * w, pos[a * 3 + 1] * u + pos[b * 3 + 1] * v + pos[c * 3 + 1] * w, pos[a * 3 + 2] * u + pos[b * 3 + 2] * v + pos[c * 3 + 2] * w];
      const f = V.norm(V.add(V.mul(V.norm(V.sub(p, pv)), .8), V.mul(n0, .3))); const best = u >= v && u >= w ? a : v >= w ? b : c;
      cards.push({ p, n: n0, f, L: R(.012, .02), W: R(.005, .008), lift0: .1, lift1: .25, g: 0, segs: 2, roll: R(-.5, .5), reg: 'ohr', best, a, b, c, bw: [u, v, w], big: false, flaum: true }); } } }
console.log('Karten:', cards.length, Object.fromEntries(REGS.map(r => [r, cards.filter(c => c.reg === r).length])));
// ---------------------------------------------------------------- Geometrie
const ATLAS = { S: { u: [.0, .5], v: [.004, .49] }, L: { u: [.5, 1.0], v: [.004, .965] } }; // Atlas aus tools/katzen_strands.py
const Pa = [], Na = [], U0 = [], U1 = [], Ja = [], Wa = [], Ra = [], Ca = [], Ix = [];
for (const c of cards) {
  const big = c.big, at = big ? ATLAS.L : ATLAS.S, uw = (at.u[1] - at.u[0]) * (big ? .5 : .5), u0 = R(at.u[0], at.u[1] - uw), mirror = rnd() < .5;
  const nS = c.segs; let q = V.sub(c.p, V.mul(c.n, .0015)), d = c.f; const step = c.L / nS, rowStart = Pa.length / 3; let prevCenter = q;
  for (let k = 0; k <= nS; k++) {
    const t = k / nS; const lift = c.lift0 + (c.lift1 - c.lift0) * t;
    if (k > 0) { d = V.norm(V.add(V.mul(c.f, Math.cos(lift)), V.mul(c.n, Math.sin(lift)))); d = V.norm(V.add(d, V.mul(grav, c.g * t * .55))); q = V.add(q, V.mul(d, step)); }
    const wd = V.norm(V.cross(d, c.n)), wv = rotAxis(wd, d, c.roll), hw = c.W * .5 * (1 - .45 * t) * (c.flaum ? 1 : 1);
    const l = V.add(q, V.mul(wv, -hw)), r = V.add(q, V.mul(wv, hw)); const vv = at.v[0] + (at.v[1] - at.v[0]) * t * (big ? 1 : 1);
    for (const [pt, ux] of [[l, 0], [r, 1]]) { Pa.push(...pt); const nb = V.norm(V.add(c.n, V.mul(d, .15 * t))); Na.push(...nb); U0.push(u0 + uw * (mirror ? 1 - ux : ux), vv); U1.push(uv[c.best * 2], uv[c.best * 2 + 1]);
      for (let kk = 0; kk < 4; kk++) { Ja.push(jnt[c.best * 4 + kk]); Wa.push(wgt[c.best * 4 + kk]); } Ra.push(...c.p); Ca.push(ux, t); }
  }
  for (let k = 0; k < nS; k++) { const i = rowStart + k * 2; Ix.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
}
console.log('Dreiecke Haarkarten:', Ix.length / 3, 'Eckpunkte:', Pa.length / 3);
// ---------------------------------------------------------------- ins Dokument
const hm = haarN.getMesh(), hp = hm.listPrimitives()[0];
const mkAcc = (type, arr, ct) => doc.createAccessor().setType(type).setArray(arr).setBuffer(root.listBuffers()[0]);
hp.getAttribute('POSITION').setArray(new Float32Array(Pa)); hp.getAttribute('NORMAL').setArray(new Float32Array(Na)); hp.getAttribute('TEXCOORD_0').setArray(new Float32Array(U0));
hp.getAttribute('JOINTS_0').setArray(new Uint16Array(Ja)); hp.getAttribute('WEIGHTS_0').setArray(new Float32Array(Wa)); hp.getIndices().setArray(new Uint16Array(Ix));
if (Pa.length / 3 > 65000) throw new Error('zu viele Eckpunkte für 16 Bit');
hp.setAttribute('TEXCOORD_1', mkAcc('VEC2', new Float32Array(U1))); hp.setAttribute('_ROOT', mkAcc('VEC3', new Float32Array(Ra))); hp.setAttribute('_CARD', mkAcc('VEC2', new Float32Array(Ca)));
haarN.setSkin(skin); // dieselbe Haut (gleiche Knochenreihenfolge) wie das Fell
const hmat = hp.getMaterial(); { const nt = hmat.getNormalTexture(), bt = hmat.getBaseColorTexture(); hmat.setNormalTexture(null); const at = doc.createTexture('haar_atlas').setImage(new Uint8Array(fs.readFileSync(process.env.ATLAS || 'C:/Users/GIGABYTE/HAM_Blender/katzen/strands.png'))).setMimeType('image/png'); hmat.setBaseColorTexture(at); if (nt) nt.dispose(); if (bt) bt.dispose(); }
hmat.setAlphaCutoff(.3);
// ---------------------------------------------------------------- Schnurrhaare (Netz `bart`): je Seite 5 gebogene, spitz zulaufende Bänder an der Oberlippe, + Brauenhaare
{ const bp = []; const bn = [], bu = [], bj = [], bw = [], bi = []; const jH = jIdx('head'); const lipC = [0, headP[1] - .002, headP[2] + .045];
  // Position der Schnurrhaarwurzel: seitlich der Nase (Oberlippe), aus der Kopfgeometrie geschätzt
  let mz = -1e9; for (let i = 0; i < nV; i++) if (vReg[i] === 'kopf') mz = Math.max(mz, pos[i * 3 + 2]); const noseZ = mz; console.log('Nasenspitze z', noseZ.toFixed(3), 'Kopf', headP.map(x => x.toFixed(3)).join(','));
  const rows = [[.018, .006, .50, -.04], [.021, .003, .30, -.02], [.020, .000, .10, -.0], [.018, -.003, -.15, .02], [.015, -.005, -.35, .04]]; // x, y, Winkel nach oben (rad), Länge-Versatz
  for (const side of [1, -1]) for (let r = 0; r < rows.length; r++) { const [x0, y0, ang, dl] = rows[r]; const root = [side * x0, headP[1] + y0 - .006, noseZ - .012 - r * .002];
    const len = .062 + dl, segs = 5, bend = .5 + r * .08; let q = root, dir = V.norm([side * Math.cos(ang) * .75, Math.sin(ang) * .55, .55 - r * .08]); const row0 = bp.length / 3; const width = .0016;
    for (let k = 0; k <= segs; k++) { const t = k / segs; if (k > 0) { dir = V.norm(V.add(dir, [side * .06, -bend * t * .1 - .02, -.05 * t])); q = V.add(q, V.mul(dir, len / segs)); }
      const wv = V.norm(V.cross(dir, [0, 0, 1])), w2 = width * (1 - .85 * t) * .5; for (const sx of [-1, 1]) { bp.push(...V.add(q, V.mul(wv, sx * w2))); bn.push(0, 1, 0); bu.push(sx < 0 ? 0 : 1, t);
        bj.push(jH, 0, 0, 0); bw.push(1, 0, 0, 0); } }
    for (let k = 0; k < segs; k++) { const i = row0 / 1 / 1 * 0 + (bp.length / 3 - (segs + 1) * 2) + k * 2; bi.push(i, i + 1, i + 2, i + 1, i + 3, i + 2, i + 2, i + 1, i, i + 2, i + 3, i + 1); } }
  const mesh = doc.createMesh('bart'), prim = doc.createPrimitive(), buf = root.listBuffers()[0];
  prim.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(bp)).setBuffer(buf)).setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(bn)).setBuffer(buf))
    .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(bu)).setBuffer(buf)).setAttribute('JOINTS_0', doc.createAccessor().setType('VEC4').setArray(new Uint16Array(bj)).setBuffer(buf))
    .setAttribute('WEIGHTS_0', doc.createAccessor().setType('VEC4').setArray(new Float32Array(bw)).setBuffer(buf)).setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(bi)).setBuffer(buf));
  const mat = doc.createMaterial('katze_bart').setBaseColorFactor([.85, .84, .8, 1]).setRoughnessFactor(.5).setMetallicFactor(0).setDoubleSided(true); prim.setMaterial(mat); mesh.addPrimitive(prim);
  const nd = doc.createNode('bart').setMesh(mesh).setSkin(skin); fellN.getParentNode().addChild(nd); console.log('Schnurrhaare Dreiecke:', bi.length / 3); }
await io.write(DST, doc); console.log('geschrieben', DST, (fs.statSync(DST).size / 1024) | 0, 'KB');
