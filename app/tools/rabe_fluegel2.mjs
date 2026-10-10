// Rabe-Fluegel (Teil 2, ohne Blender, direkt am GLB; Skelett/Clips/Knotenachsen bleiben unveraendert, Federn behalten ihre Gewichte):
//  a) Hand-/Armschwingen: Spitzenaufbiegung (Vertexbiegung im Federlokalraum, ~t^2.2) + leichter Faecherwinkel je Feder
//  b) zusaetzliche Deckfederreihen (Kopien der vorhandenen Deckfedern, gestaffelt, gleiche Knochen/Gewichte)
//  c) Federraender ausgefranst (Alpha der Farbtextur: Barben-Kerben am Rand)
//  e) Vertexfarben je Feder (dunkel, leicht blau-violett, Helligkeitsstreuung), Roughness leicht gesenkt
//   node tools/rabe_fluegel2.mjs <quelle.glb> <ziel.glb> [--bend=.17] [--fan=3.2] [--rows=2] [--fray=1] [--rough=1] [--metal=.05] [--spec=.2]
import fs from 'fs'; import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const [SRC, DST, ...opt] = process.argv.slice(2); const O = Object.fromEntries(opt.map(s => s.replace(/^--/, '').split('=')));
const BEND = +(O.bend ?? .17), FAN = +(O.fan ?? 3.2) * Math.PI / 180, ROWS = +(O.rows ?? 2), FRAY = +(O.fray ?? 1);
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS), doc = await io.read(SRC), root = doc.getRoot();
const skin = root.listSkins()[0], jn = skin.listJoints().map(j => j.getName());
const wingJ = new Set(jn.map((n, i) => /Wing|UpperArm|Forearm|Hand$/.test(n) ? i : -1).filter(i => i >= 0));
const ibm = skin.getInverseBindMatrices().getArray();
const jpos = i => { const m = ibm.slice(i * 16, i * 16 + 16); return [-(m[0] * m[12] + m[1] * m[13] + m[2] * m[14]), -(m[4] * m[12] + m[5] * m[13] + m[6] * m[14]), -(m[8] * m[12] + m[9] * m[13] + m[10] * m[14])]; };
const sh = { L: jpos(jn.indexOf('CROW_-L-UpperArm')), R: jpos(jn.indexOf('CROW_-R-UpperArm')) };
const P = root.listMeshes()[0].listPrimitives()[0];
const A = n => P.getAttribute(n);
const pos = Float32Array.from(A('POSITION').getArray()), nor = Float32Array.from(A('NORMAL').getArray()), tan = Float32Array.from(A('TANGENT').getArray()),
  uv = Float32Array.from(A('TEXCOORD_0').getArray()), J = Uint16Array.from(A('JOINTS_0').getArray()), W = Float32Array.from(A('WEIGHTS_0').getArray()), I = Array.from(P.getIndices().getArray()), n0 = pos.length / 3;
const par = new Int32Array(n0).map((_, i) => i); const find = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
for (let t = 0; t < I.length; t += 3) { const a = find(I[t]), b = find(I[t + 1]), c = find(I[t + 2]); par[b] = a; par[find(c)] = a; }
const comp = new Map(); for (let i = 0; i < n0; i++) { const r = find(i); if (!comp.has(r)) comp.set(r, []); comp.get(r).push(i); }
const triOf = new Map(); for (let t = 0; t < I.length; t += 3) { const r = find(I[t]); if (!triOf.has(r)) triOf.set(r, []); triOf.get(r).push(t); }
const nrm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); }, dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mul = (M, v) => [0, 1, 2].map(r => M[r][0] * v[0] + M[r][1] * v[1] + M[r][2] * v[2]);
const rd = (arr, i, st) => [arr[i * st], arr[i * st + 1], arr[i * st + 2]], wr = (arr, i, st, v) => { arr[i * st] = v[0]; arr[i * st + 1] = v[1]; arr[i * st + 2] = v[2]; };
function frame(vs) {
  const m = [0, 0, 0]; for (const i of vs) for (let a = 0; a < 3; a++) m[a] += pos[i * 3 + a] / vs.length;
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (const i of vs) { const d = [0, 1, 2].map(a => pos[i * 3 + a] - m[a]); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) C[r][c] += d[r] * d[c]; }
  let e1 = [1, .3, .2]; for (let k = 0; k < 30; k++) e1 = nrm(mul(C, e1));
  let e2 = [.2, 1, .4]; for (let k = 0; k < 30; k++) { const d = dot(e2, e1); e2 = nrm(mul(C, e2.map((x, a) => x - d * e1[a]))); const d2 = dot(e2, e1); e2 = nrm(e2.map((x, a) => x - d2 * e1[a])); }
  let e3 = nrm(cross(e1, e2)); if (e3[1] < 0) e3 = e3.map(x => -x); // dorsal = +Y (Bindepose: Fluegel ausgebreitet)
  e2 = nrm(cross(e3, e1)); return { m, e1, e2, e3 };
}
// ---- Klassifikation (wie rabe_breiter: Fluegelgewichte >= .6; Schwingen v < .125, Decken v .17-.27)
const feathers = [], coverts = [];
for (const [r, vs] of comp) {
  if (vs.length < 6 || vs.length > 140) continue;
  let ww = 0, vm = 0; for (const i of vs) { for (let k = 0; k < 4; k++) if (wingJ.has(J[i * 4 + k])) ww += W[i * 4 + k]; vm += uv[i * 2 + 1]; } ww /= vs.length; vm /= vs.length; if (ww < .6) continue;
  const c = { r, vs, side: pos[vs[0] * 3] >= 0 ? 'L' : 'R', vm };
  if (vm < .125) feathers.push(c); else if (vm > .17 && vm < .27) coverts.push(c);
}
console.log('Schwingen', feathers.length, 'Decken', coverts.length);
// ---- a) Biegung + Faecher
const endsOf = (c, F) => {
  let lo = 1e9, hi = -1e9; for (const i of c.vs) { const s = dot([pos[i * 3] - F.m[0], pos[i * 3 + 1] - F.m[1], pos[i * 3 + 2] - F.m[2]], F.e1); lo = Math.min(lo, s); hi = Math.max(hi, s); }
  const sp = sh[c.side], pLo = F.m.map((x, a) => x + F.e1[a] * lo), pHi = F.m.map((x, a) => x + F.e1[a] * hi), dd = p => Math.hypot(p[0] - sp[0], p[1] - sp[1], p[2] - sp[2]);
  const sg = dd(pLo) < dd(pHi) ? 1 : -1; return { L: hi - lo, root: sg > 0 ? pLo : pHi, tipDir: F.e1.map(x => x * sg) };
};
const P2 = 2.2;
for (const c of feathers) {
  const F = frame(c.vs), E = endsOf(c, F); c.root = E.root; c.tipDir = E.tipDir; c.L = E.L;
  for (const i of c.vs) {
    const s = dot([pos[i * 3] - c.root[0], pos[i * 3 + 1] - c.root[1], pos[i * 3 + 2] - c.root[2]], c.tipDir), t = Math.max(0, Math.min(1, s / c.L));
    const D = BEND * c.L * Math.pow(t, P2), phi = Math.atan(BEND * P2 * Math.pow(t, P2 - 1)), cp = Math.cos(phi), sn = Math.sin(phi);
    for (let a = 0; a < 3; a++) pos[i * 3 + a] += F.e3[a] * D;
    for (const [arr, st] of [[nor, 3], [tan, 4]]) {
      const v = rd(arr, i, st), a1 = dot(v, c.tipDir), a3 = dot(v, F.e3), b1 = a1 * cp - a3 * sn, b3 = a1 * sn + a3 * cp;
      wr(arr, i, st, v.map((x, a) => x + c.tipDir[a] * (b1 - a1) + F.e3[a] * (b3 - a3)));
    }
  }
}
for (const side of ['L', 'R']) {
  const fs_ = feathers.filter(c => c.side === side); fs_.forEach(c => { c.ang = Math.atan2(c.tipDir[2], Math.abs(c.tipDir[0])); });
  const sorted = [...fs_].sort((a, b) => a.ang - b.ang), N = sorted.length, sx = side === 'L' ? 1 : -1;
  sorted.forEach((c, k) => {
    const del = (N > 1 ? (k / (N - 1)) * 2 - 1 : 0) * FAN, cd = Math.cos(del), sd = Math.sin(del);
    const rot = v => { const X = sx * v[0], x2 = X * cd - v[2] * sd, z2 = X * sd + v[2] * cd; return [sx * x2, v[1], z2]; };
    for (const i of c.vs) {
      const p = rd(pos, i, 3).map((x, a) => x - c.root[a]); wr(pos, i, 3, rot(p).map((x, a) => x + c.root[a]));
      wr(nor, i, 3, rot(rd(nor, i, 3))); wr(tan, i, 4, rot(rd(tan, i, 4)));
    }
  });
}
// ---- b) Deckfederreihen (Kopien der Deckfedern, gestaffelt)
const nv = { pos: [], nor: [], tan: [], uv: [], J: [], W: [], col: [] }, nI = []; let nAdd = 0;
const rowSpec = [{ sl: 1.32, sw: 1.08, e2: 0, off: .09, rot: 3 }, { sl: .78, sw: 1.0, e2: .5, off: .17, rot: -3 }, { sl: 1.1, sw: .9, e2: -.5, off: .26, rot: 5 }].slice(0, ROWS);
for (const c of coverts) {
  const F = frame(c.vs), E = endsOf(c, F); let wlo = 1e9, whi = -1e9;
  for (const i of c.vs) { const w = dot([pos[i * 3] - F.m[0], pos[i * 3 + 1] - F.m[1], pos[i * 3 + 2] - F.m[2]], F.e2); wlo = Math.min(wlo, w); whi = Math.max(whi, w); }
  const Wd = whi - wlo, L = E.L, sg = dot(E.tipDir, F.e1) >= 0 ? 1 : -1;
  for (const R of rowSpec) {
    const base = n0 + nAdd, map = new Map(), rr = R.rot * Math.PI / 180 * (rnd() < .5 ? -1 : 1), cd = Math.cos(rr), sd = Math.sin(rr);
    for (const i of c.vs) {
      const d = rd(pos, i, 3).map((x, a) => x - E.root[a]), s = dot(d, F.e1) * sg, w = dot(d, F.e2), h = dot(d, F.e3);
      const s2 = s * R.sl, w2 = w * R.sw + R.e2 * Wd, h2 = h + R.off * L; const b1 = s2 * cd - w2 * sd, b2 = s2 * sd + w2 * cd;
      nv.pos.push(...E.root.map((x, a) => x + F.e1[a] * sg * b1 + F.e2[a] * b2 + F.e3[a] * h2));
      nv.nor.push(...rd(nor, i, 3)); nv.tan.push(tan[i * 4], tan[i * 4 + 1], tan[i * 4 + 2], tan[i * 4 + 3]); nv.uv.push(uv[i * 2], uv[i * 2 + 1]);
      nv.J.push(J[i * 4], J[i * 4 + 1], J[i * 4 + 2], J[i * 4 + 3]); nv.W.push(W[i * 4], W[i * 4 + 1], W[i * 4 + 2], W[i * 4 + 3]); map.set(i, base + map.size);
    }
    for (const t of triOf.get(c.r)) nI.push(map.get(I[t]), map.get(I[t + 1]), map.get(I[t + 2]));
    nAdd += c.vs.length;
  }
}
console.log('Deckfeder-Kopien: +', nAdd, 'Vertices, +', nI.length / 3, 'Dreiecke');
// ---- zusammenbauen
const nTot = n0 + nAdd, cat = (a, b) => { const o = new a.constructor(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
const posF = cat(pos, new Float32Array(nv.pos)), norF = cat(nor, new Float32Array(nv.nor)), tanF = cat(tan, new Float32Array(nv.tan)), uvF = cat(uv, new Float32Array(nv.uv)),
  JF = cat(J, new Uint16Array(nv.J)), WF = cat(W, new Float32Array(nv.W)), IF = new (nTot < 65536 ? Uint16Array : Uint32Array)([...I, ...nI]);
// ---- e) Vertexfarben je Feder
const col = new Float32Array(nTot * 3).fill(1);
const featherOf = new Int32Array(nTot).fill(-1);
const CK = +(O.color ?? 1);
for (const c of [...feathers, ...coverts]) { const v = .86 + rnd() * .24, tint = [.93 * v, .95 * v, 1.12 * v]; for (const i of c.vs) { col.set(CK ? tint : [1, 1, 1], i * 3); } }
// Kopien: Farbe der Quelle uebernehmen (je Kopie neue Helligkeit)
{ let k = n0; for (const c of coverts) for (const R of rowSpec) { const v = .84 + rnd() * .26, tint = [.93 * v, .95 * v, 1.12 * v]; for (let j = 0; j < c.vs.length; j++, k++) col.set(tint, k * 3); } }
const buf = root.listBuffers()[0], acc = (arr, type) => doc.createAccessor().setArray(arr).setType(type).setBuffer(buf);
const setA = (name, arr, type) => { const old = P.getAttribute(name); P.setAttribute(name, acc(arr, type)); if (old) old.dispose(); };
setA('POSITION', posF, 'VEC3'); setA('NORMAL', norF, 'VEC3'); setA('TANGENT', tanF, 'VEC4'); setA('TEXCOORD_0', uvF, 'VEC2'); setA('JOINTS_0', JF, 'VEC4'); setA('WEIGHTS_0', WF, 'VEC4'); setA('COLOR_0', col, 'VEC3');
const oi = P.getIndices(); P.setIndices(acc(IF, 'SCALAR')); oi.dispose();
const mat = P.getMaterial();
if (O.nonormal) mat.setNormalTexture(null);
if (+(O.spec ?? .2) >= 0) { const sp = mat.getExtension('KHR_materials_specular'); if (sp) sp.setSpecularFactor(+(O.spec ?? .2)); } mat.setRoughnessFactor(+(O.rough ?? 1)); mat.setMetallicFactor(+(O.metal ?? .05)); // metallic 1 + Umgebungsbild = silberne Glanzstreifen an den aufgebogenen Spitzen
// ---- c) Federraender ausfransen (Alpha der Farbtextur, nur Federreihen oben im Atlas)
if (FRAY) {
  const tex = mat.getBaseColorTexture(), img = sharp(Buffer.from(tex.getImage())), meta = await img.metadata(), w = meta.width, h = meta.height;
  const raw = await img.ensureAlpha().raw().toBuffer(), Hb = Math.round(h * .245); // Federstreifen: v < ~.245
  const inside = new Uint8Array(w * Hb); for (let y = 0; y < Hb; y++) for (let x = 0; x < w; x++) inside[y * w + x] = raw[(y * w + x) * 4 + 3] >= 108 ? 1 : 0;
  const dist = new Float32Array(w * Hb).fill(1e3); for (let i = 0; i < w * Hb; i++) if (!inside[i]) dist[i] = 0;
  for (let y = 0; y < Hb; y++) for (let x = 0; x < w; x++) { const i = y * w + x; let d = dist[i]; if (x > 0) d = Math.min(d, dist[i - 1] + 1); if (y > 0) d = Math.min(d, dist[i - w] + 1); dist[i] = d; }
  for (let y = Hb - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; let d = dist[i]; if (x < w - 1) d = Math.min(d, dist[i + 1] + 1); if (y < Hb - 1) d = Math.min(d, dist[i + w] + 1); dist[i] = d; }
  const sc = w / 2048, hash = n => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
  const band = 16 * sc; let changed = 0;
  for (let y = 0; y < Hb; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!inside[i] || dist[i] > band) continue;
    // Barben laufen schraeg zur Spitze: Kerbenmuster entlang x - 1.3*y, 3 px breit
    const k = Math.floor((x - 1.3 * y) / (3 * sc)), r = hash(k), rr = hash(k * 7 + 3), depth = band * (r * r) * (.35 + .65 * rr);
    if (dist[i] < depth) { raw[i * 4 + 3] = 0; changed++; } else if (dist[i] < depth + 2 * sc) raw[i * 4 + 3] = Math.min(raw[i * 4 + 3], 110); }
  tex.setImage(new Uint8Array(await sharp(raw, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer())); console.log('Rand ausgefranst, Pixel', changed);
}
fs.writeFileSync(DST, await io.writeBinary(doc));
console.log('fertig', DST, (fs.statSync(DST).size / 1e6).toFixed(1) + ' MB', 'Dreiecke', IF.length / 3, 'Vertices', nTot);
