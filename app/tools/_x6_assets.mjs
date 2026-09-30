// X-6 (Kiffer-Welt, Modul kiffen.js): Rohmodelle aus HAM_FabDownloads für das Spiel aufbereiten
//   haende   Detective_Hands (Tony Flanagan, CC-BY): aus der ganzen Figur nur Unterarme + Hände (Haut „Body“ + Ärmel „Tops“), Skelett ab dem Unterarm,
//            je Seite eine Wurzel (L_/R_ForeArm), Meter, Textur auf den genutzten Bereich zugeschnitten → game/assets/ms/haende/model.glb
//   grinder  Scan (shanti.rize, CC-BY): 250k → ~18k Dreiecke, am Deckelspalt in Deckel und Körper geschnitten, Aufdruck oben verwischt, 2048er Textur
//   knolle, papes (Aufdruck neutral überfärbt), joints, ascher, bong, tuetchen, pflanze (Dose), topf (Tontopf): Maße in Metern, Texturen 512–2048
//   Ziel: game/assets/ms/kiffen/<name>/model.glb (+ meta.json)
// Aufruf: node --max-old-space-size=12000 tools/_x6_assets.mjs [haende grinder knolle papes joints ascher bong tuetchen pflanze topf]
import fs from 'fs'; import path from 'path'; import * as THREE from 'three'; import sharp from 'sharp';
import { Document, NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { simplify, normals } from './_x5_qem.mjs';
globalThis.self = globalThis; globalThis.window = globalThis;
const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');
THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };
const SRC = 'C:/Users/GIGABYTE/HAM_FabDownloads/', K = SRC + 'v13_kiffer/', OUT = path.resolve('../game/assets/ms'), log = (...a) => console.log(...a);
const want = process.argv.slice(2); const doIt = k => !want.length || want.includes(k);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

// ---------------------------------------------------------------- Hilfen
async function img(buf, size, { q = 88, fmt = 'jpeg', alpha = false, crop = null } = {}) { let s = sharp(buf); if (crop) s = s.extract(crop);
  s = s.resize({ width: size, height: size, fit: 'inside', kernel: 'lanczos3', withoutEnlargement: true }); if (!alpha) s = s.removeAlpha();
  return fmt === 'png' ? await s.png({ compressionLevel: 9 }).toBuffer() : await s.jpeg({ quality: q, mozjpeg: true }).toBuffer(); }
function gltf() { const doc = new Document(); const buf = doc.createBuffer(); const scene = doc.createScene('s'); const texCache = new Map();
  const tex = (name, data, mime = 'image/jpeg') => { if (!data) return null; if (texCache.has(data)) return texCache.get(data); const t = doc.createTexture(name).setImage(new Uint8Array(data)).setMimeType(mime); texCache.set(data, t); return t; };
  const mat = (name, o = {}) => { const m = doc.createMaterial(name).setBaseColorFactor(o.color || [1, 1, 1, 1]).setRoughnessFactor(o.rough ?? 1).setMetallicFactor(o.metal ?? 0).setDoubleSided(!!o.ds);
    if (o.b) m.setBaseColorTexture(tex(name + '_b', o.b, o.bpng ? 'image/png' : 'image/jpeg')); if (o.n) m.setNormalTexture(tex(name + '_n', o.n)); if (o.orm) { const t = tex(name + '_orm', o.orm); m.setMetallicRoughnessTexture(t); if (o.ao !== false) m.setOcclusionTexture(t); }
    if (o.alpha) m.setAlphaMode(o.alpha); if (o.cutoff) m.setAlphaCutoff(o.cutoff); return m; };
  const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buf);
  const prim = (g, material, extra = {}) => { const p = doc.createPrimitive().setMaterial(material); p.setAttribute('POSITION', acc('VEC3', g.pos));
    if (g.nrm) p.setAttribute('NORMAL', acc('VEC3', g.nrm)); if (g.uv) p.setAttribute('TEXCOORD_0', acc('VEC2', g.uv));
    for (const [k, v] of Object.entries(extra)) p.setAttribute(k, acc(v.type, v.array));
    if (g.index) p.setIndices(acc('SCALAR', g.pos.length / 3 > 65535 ? Uint32Array.from(g.index) : Uint16Array.from(g.index))); return p; };
  const mesh = (name, g, material, parent = scene) => { const node = doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim(g, material))); parent.addChild(node); return node; };
  const write = async f => { fs.mkdirSync(path.dirname(f), { recursive: true }); await io.write(f, doc); log('  →', f, (fs.statSync(f).size / 1e6).toFixed(2) + ' MB'); };
  return { doc, buf, scene, mat, mesh, prim, acc, tex, write }; }
// Dreiecksliste (ohne Index) → indiziert (gleiche Punkte zusammen)
function weld(g, extra = []) { const map = new Map(), op = [], on = [], ou = [], oi = [], ox = extra.map(() => []); const n = g.pos.length / 3;
  for (let i = 0; i < n; i++) { const kk = [g.pos[i * 3], g.pos[i * 3 + 1], g.pos[i * 3 + 2], g.nrm ? g.nrm[i * 3] : 0, g.nrm ? g.nrm[i * 3 + 1] : 0, g.nrm ? g.nrm[i * 3 + 2] : 0, g.uv ? g.uv[i * 2] : 0, g.uv ? g.uv[i * 2 + 1] : 0].map(x => x.toFixed(6)).join(',');
    let j = map.get(kk); if (j === undefined) { j = op.length / 3; map.set(kk, j); op.push(g.pos[i * 3], g.pos[i * 3 + 1], g.pos[i * 3 + 2]); if (g.nrm) on.push(g.nrm[i * 3], g.nrm[i * 3 + 1], g.nrm[i * 3 + 2]); if (g.uv) ou.push(g.uv[i * 2], g.uv[i * 2 + 1]);
      extra.forEach((e, q) => { for (let c = 0; c < e.n; c++) ox[q].push(e.a[i * e.n + c]); }); } oi.push(j); }
  return { pos: Float32Array.from(op), nrm: g.nrm ? Float32Array.from(on) : null, uv: g.uv ? Float32Array.from(ou) : null, index: Uint32Array.from(oi), extra: ox }; }
// glTF-Dokument → flache Dreiecke je Material (Weltmatrix eingebacken)
function flatDoc(doc, filter = () => true) { const out = new Map();
  for (const node of doc.getRoot().listNodes()) { const m = node.getMesh(); if (!m || !filter(node)) continue; const W = node.getWorldMatrix(); const N3 = new THREE.Matrix3().getNormalMatrix(new THREE.Matrix4().fromArray(W));
    for (const p of m.listPrimitives()) { const P = p.getAttribute('POSITION').getArray(), Nn = p.getAttribute('NORMAL')?.getArray(), U = p.getAttribute('TEXCOORD_0')?.getArray(), I = p.getIndices()?.getArray(); const mat = p.getMaterial();
      if (!out.has(mat)) out.set(mat, { pos: [], nrm: [], uv: [], name: node.getName() }); const o = out.get(mat); const cnt = I ? I.length : P.length / 3; const v = new THREE.Vector3();
      const WM = new THREE.Matrix4().fromArray(W); for (let k = 0; k < cnt; k++) { const i = I ? I[k] : k; v.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]).applyMatrix4(WM); o.pos.push(v.x, v.y, v.z);
        if (Nn) { v.set(Nn[i * 3], Nn[i * 3 + 1], Nn[i * 3 + 2]).applyMatrix3(N3).normalize(); o.nrm.push(v.x, v.y, v.z); } else o.nrm.push(0, 1, 0); o.uv.push(U ? U[i * 2] : 0, U ? U[i * 2 + 1] : 0); } } }
  for (const o of out.values()) { o.pos = Float32Array.from(o.pos); o.nrm = Float32Array.from(o.nrm); o.uv = Float32Array.from(o.uv); } return out; }
function box(g) { const b = new THREE.Box3(); for (let i = 0; i < g.pos.length; i += 3) b.expandByPoint(new THREE.Vector3(g.pos[i], g.pos[i + 1], g.pos[i + 2])); return b; }
function boxAll(list) { const b = new THREE.Box3(); for (const g of list) b.union(box(g)); return b; }
function xf(g, fn) { const v = new THREE.Vector3(); for (let i = 0; i < g.pos.length; i += 3) { v.set(g.pos[i], g.pos[i + 1], g.pos[i + 2]); fn(v); g.pos[i] = v.x; g.pos[i + 1] = v.y; g.pos[i + 2] = v.z; } return g; }
function xfN(g, m3) { const v = new THREE.Vector3(); if (g.nrm) for (let i = 0; i < g.nrm.length; i += 3) { v.set(g.nrm[i], g.nrm[i + 1], g.nrm[i + 2]).applyMatrix3(m3).normalize(); g.nrm[i] = v.x; g.nrm[i + 1] = v.y; g.nrm[i + 2] = v.z; } return g; }
// Unterkante auf 0, Mitte auf x/z = 0, auf Zielmaß skalieren (axis: 'y' | 'max')
function normalize(list, size, axis = 'y', { ground = true } = {}) { const b = boxAll(list), s0 = b.getSize(new THREE.Vector3()), cur = axis === 'max' ? Math.max(s0.x, s0.y, s0.z) : s0[axis], s = size / cur, c = b.getCenter(new THREE.Vector3());
  for (const g of list) xf(g, v => v.set((v.x - c.x) * s, ground ? (v.y - b.min.y) * s : (v.y - c.y) * s, (v.z - c.z) * s)); return s; }
async function texOf(t) { return t ? Buffer.from(t.getImage()) : null; }
function simp(g, target, seams = 'lock') { const src = { pos: g.pos, uv: g.uv, index: g.index || null }; const r = simplify(src, target, { seams });
  const nn = normals(r, 50); return { pos: nn.pos, nrm: nn.nrm, uv: nn.uv, index: nn.index }; }

// ================================================================ HÄNDE
if (doIt('haende')) { log('Hände');
  const b = fs.readFileSync(SRC + 'v11/haende/source/Detective_Hands.fbx'); const o = new FBXLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), ''); o.updateMatrixWorld(true);
  const SIDES = ['Left', 'Right'], PFX = { Left: 'L_', Right: 'R_' };
  const FING = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
  const keepName = n => { const m = n.match(/^mixamorig(Left|Right)(ForeArm|Hand(?:Thumb|Index|Middle|Ring|Pinky)?[1-4]?)$/); return m ? { side: m[1], part: m[2] } : null; };
  const meshes = []; o.traverse(m => { if (m.isSkinnedMesh && (m.name === 'Body' || m.name === 'Tops')) meshes.push(m); });
  const sk = meshes[0].skeleton; // beide Netze teilen dasselbe Skelett
  // Knochen (Bindepose, Bindungsraum): B = inverse(boneInverse)
  const bindW = sk.bones.map((bn, i) => new THREE.Matrix4().copy(sk.boneInverses[i]).invert());
  const keepBones = []; sk.bones.forEach((bn, i) => { const k = keepName(bn.name); if (k) keepBones.push({ i, name: PFX[k.side] + k.part, side: k.side, part: k.part, W: bindW[i] }); });
  // Maßstab: Handlänge (Hand → Mittelfingerspitze-Gelenk 4) = 0,185 m
  const pos = m => new THREE.Vector3().setFromMatrixPosition(m);
  const bR = n => keepBones.find(k => k.name === n);
  const handLen = pos(bR('R_Hand').W).distanceTo(pos(bR('R_HandMiddle4').W)); const S = .185 / handLen; log('  Handlänge (roh)', handLen.toFixed(2), 'Maßstab', S.toExponential(3));
  // Vertices: Bindungsraum = bindMatrix · p
  const out = { pos: [], nrm: [], uv: [], j: [], w: [], mat: [] }; const kIdx = new Map(keepBones.map((k, q) => [k.i, q]));
  const foreOf = { Left: keepBones.findIndex(k => k.name === 'L_ForeArm'), Right: keepBones.findIndex(k => k.name === 'R_ForeArm') };
  for (const m of meshes) { const g = m.geometry, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight, I = g.index;
    const BM = m.bindMatrix, NM = new THREE.Matrix3().getNormalMatrix(BM); const cnt = I ? I.count : P.count; const v = new THREE.Vector3(), nv = new THREE.Vector3();
    const dom = i => { let best = -1, bi = 0; for (let k = 0; k < 4; k++) { const w = SW.getComponent(i, k); if (w > best) { best = w; bi = SI.getComponent(i, k); } } return bi; };
    for (let t = 0; t < cnt; t += 3) { const ids = [0, 1, 2].map(q => I ? I.getX(t + q) : t + q);
      const doms = ids.map(dom); const armOk = d => m.name === 'Tops' && /^mixamorig(Left|Right)Arm$/.test(sk.bones[d].name); // Ärmel bis zur Schulter (gerade, verlässt das Bild)
      if (!doms.every(d => kIdx.has(d) || armOk(d))) continue; // nur Unterarm/Hand (+ Ärmel)
      const d0 = doms.find(d => kIdx.has(d)); if (d0 === undefined) { const sd = /Left/.test(sk.bones[doms[0]].name) ? 'Left' : 'Right'; doms[0] = keepBones[foreOf[sd]].i; }
      const side = keepBones[kIdx.get(doms.find(d => kIdx.has(d)))].side;
      for (const i of ids) { v.fromBufferAttribute(P, i).applyMatrix4(BM); out.pos.push(v.x * S, v.y * S, v.z * S); nv.fromBufferAttribute(N, i).applyMatrix3(NM).normalize(); out.nrm.push(nv.x, nv.y, nv.z); out.uv.push(U.getX(i), U.getY(i));
        // Gewichte: nicht behaltene Knochen (Oberarm) → Unterarm derselben Seite
        const jw = new Map(); for (let k = 0; k < 4; k++) { const w = SW.getComponent(i, k); if (w <= 0) continue; const bi = SI.getComponent(i, k); const q = kIdx.has(bi) ? kIdx.get(bi) : foreOf[side]; jw.set(q, (jw.get(q) || 0) + w); }
        const arr = [...jw].sort((a, b2) => b2[1] - a[1]).slice(0, 4); const sum = arr.reduce((s, a) => s + a[1], 0) || 1; for (let k = 0; k < 4; k++) { out.j.push(arr[k] ? arr[k][0] : 0); out.w.push(arr[k] ? arr[k][1] / sum : 0); }
        out.mat.push(m.name === 'Tops' ? 1 : 0); } } }
  log('  Dreiecke', out.pos.length / 9);
  // Ärmel schlanker (die Detektiv-Figur trägt einen weiten Mantel): Abstand zur Armachse (Unterarm → Hand, nach hinten verlängert) auf 80 %
  for (const sd of ['Left', 'Right']) { const fa = pos(bR(PFX[sd] + 'ForeArm').W).multiplyScalar(S), hd = pos(bR(PFX[sd] + 'Hand').W).multiplyScalar(S), ax = hd.clone().sub(fa).normalize(), v = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i < out.mat.length; i++) { if (!out.mat[i]) continue; v.set(out.pos[i * 3], out.pos[i * 3 + 1], out.pos[i * 3 + 2]); if ((sd === 'Left') !== (v.x > 0)) continue;
      const tt = v.clone().sub(fa).dot(ax); if (tt > hd.clone().sub(fa).dot(ax) - .01) continue; c.copy(fa).addScaledVector(ax, tt); const k = tt > -.02 ? .86 : .8; v.sub(c).multiplyScalar(k).add(c); out.pos[i * 3] = v.x; out.pos[i * 3 + 1] = v.y; out.pos[i * 3 + 2] = v.z; } }
  // Texturausschnitt: UV-Bereich der behaltenen Dreiecke (V gespiegelt: Bild oben = v 1)
  let u0 = 1, u1 = 0, v0 = 1, v1 = 0; for (let i = 0; i < out.uv.length; i += 2) { u0 = Math.min(u0, out.uv[i]); u1 = Math.max(u1, out.uv[i]); v0 = Math.min(v0, out.uv[i + 1]); v1 = Math.max(v1, out.uv[i + 1]); }
  const T = SRC + 'v11/haende/textures/Detective_Hands_', md = await sharp(T + 'diffuse.png').metadata(); const TW = md.width, TH = md.height;
  const pad = .004; u0 = Math.max(0, u0 - pad); v0 = Math.max(0, v0 - pad); u1 = Math.min(1, u1 + pad); v1 = Math.min(1, v1 + pad);
  const crop = { left: Math.floor(u0 * TW), top: Math.floor((1 - v1) * TH), width: Math.ceil((u1 - u0) * TW), height: Math.ceil((v1 - v0) * TH) }; log('  Texturausschnitt', crop, 'von', TW, TH);
  for (let i = 0; i < out.uv.length; i += 2) { out.uv[i] = (out.uv[i] * TW - crop.left) / crop.width; out.uv[i + 1] = ((1 - out.uv[i + 1]) * TH - crop.top) / crop.height; } // glTF: v = 0 oben im Bild (FBX: unten)
  const side = Math.min(2048, Math.max(crop.width, crop.height));
  const rs = async (f, q = 90) => sharp(f).extract(crop).resize({ width: side, height: side, fit: 'fill', kernel: 'lanczos3' }).removeAlpha().jpeg({ quality: q, mozjpeg: true }).toBuffer();
  // ORM: R = 1 (kein AO), G = Rauheit, B = 0
  const rough = await sharp(T + 'roughness.png').extract(crop).resize({ width: side, height: side, fit: 'fill' }).greyscale().raw().toBuffer();
  const ormB = Buffer.alloc(side * side * 3); for (let i = 0; i < side * side; i++) { ormB[i * 3] = 255; ormB[i * 3 + 1] = rough[i]; ormB[i * 3 + 2] = 0; }
  const G = gltf();
  const mat = G.mat('haende', { b: await rs(T + 'diffuse.png'), n: await rs(T + 'normal.png', 92), orm: await sharp(ormB, { raw: { width: side, height: side, channels: 3 } }).jpeg({ quality: 90 }).toBuffer(), ao: false });
  // Knochen-Knoten: je Seite Wurzel = Unterarm; lokale Matrizen aus den Bindungs-Weltmatrizen (ohne Skalierung)
  const clean = keepBones.map(k => { const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); k.W.decompose(p, q, s); p.multiplyScalar(S); return new THREE.Matrix4().compose(p, q, new THREE.Vector3(1, 1, 1)); });
  const parentOf = k => { if (k.part === 'ForeArm') return null; if (k.part === 'Hand') return PFX[k.side] + 'ForeArm'; const m = k.part.match(/^Hand(\w+?)(\d)$/); const n = +m[2]; return PFX[k.side] + (n === 1 ? 'Hand' : 'Hand' + m[1] + (n - 1)); };
  const root = G.doc.createNode('haende'); G.scene.addChild(root); const nodes = keepBones.map(k => G.doc.createNode(k.name));
  keepBones.forEach((k, q) => { const pn = parentOf(k); const pi = pn ? keepBones.findIndex(x => x.name === pn) : -1; const L = pi < 0 ? clean[q].clone() : new THREE.Matrix4().copy(clean[pi]).invert().multiply(clean[q]);
    const p = new THREE.Vector3(), r = new THREE.Quaternion(), s = new THREE.Vector3(); L.decompose(p, r, s); nodes[q].setTranslation(p.toArray()).setRotation(r.toArray()); (pi < 0 ? root : nodes[pi]).addChild(nodes[q]); });
  const ibm = new Float32Array(keepBones.length * 16); clean.forEach((m, q) => ibm.set(new THREE.Matrix4().copy(m).invert().elements, q * 16));
  const skin = G.doc.createSkin('haende').setInverseBindMatrices(G.acc('MAT4', ibm)).setSkeleton(root); nodes.forEach(n => skin.addJoint(n));
  // Netz (indiziert), je Material eine Primitive – beide mit demselben Material (Ärmel und Haut liegen im selben Atlas)
  const W = weld({ pos: out.pos, nrm: out.nrm, uv: out.uv }, [{ a: out.j, n: 4 }, { a: out.w, n: 4 }]);
  const prim = G.prim({ pos: W.pos, nrm: W.nrm, uv: W.uv, index: W.index }, mat, { JOINTS_0: { type: 'VEC4', array: Uint16Array.from(W.extra[0]) }, WEIGHTS_0: { type: 'VEC4', array: Float32Array.from(W.extra[1]) } });
  const mn = G.doc.createNode('haut').setMesh(G.doc.createMesh('haut').addPrimitive(prim)).setSkin(skin); root.addChild(mn);
  await G.write(OUT + '/haende/model.glb');
  const meta = { bones: keepBones.map((k, q) => ({ n: k.name, p: new THREE.Vector3().setFromMatrixPosition(clean[q]).toArray().map(x => +x.toFixed(4)) })) };
  fs.writeFileSync(OUT + '/haende/meta.json', JSON.stringify(meta)); log('  Knochen', keepBones.length, 'Punkte', W.pos.length / 3);
}

// ================================================================ GRINDER
if (doIt('grinder')) { log('Grinder');
  const doc = await io.read(K + 'grinder.glb'); const parts = [...flatDoc(doc).values()];
  let g = parts[0];
  normalize([g], .06, 'max', { ground: true }); const bb = box(g); log('  Maße', bb.getSize(new THREE.Vector3()).toArray().map(v => v.toFixed(4)));
  // Radiusprofil über die Höhe → Deckelspalt (Einschnürung im oberen Teil)
  const H = bb.max.y, NB = 60, rmax = new Float32Array(NB); for (let i = 0; i < g.pos.length; i += 3) { const k = Math.min(NB - 1, Math.floor(g.pos[i + 1] / H * NB)); rmax[k] = Math.max(rmax[k], Math.hypot(g.pos[i], g.pos[i + 2])); }
  log('  Profil', Array.from(rmax).map(r => (r * 1000).toFixed(0)).join(' '));
  let cutK = -1, best = 1; for (let k = Math.floor(NB * .55); k < Math.floor(NB * .9); k++) if (rmax[k] < best) { best = rmax[k]; cutK = k; } const cutY = (cutK + .5) / NB * H; log('  Schnitt bei', cutY.toFixed(4), 'von', H.toFixed(4));
  // Aufdruck oben verwischen: nur die Texel unter den oberen, nach oben zeigenden Flächen (Maske im UV-Raum gerastert)
  const tex = doc.getRoot().listTextures()[0]; const TS = 2048; const mask = new Uint8Array(TS * TS); let nTop = 0;
  const fillTri = (a, b, c) => { const xs = [a[0], b[0], c[0]], ys = [a[1], b[1], c[1]]; const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 3), x1 = Math.min(TS - 1, Math.ceil(Math.max(...xs)) + 3), y0 = Math.max(0, Math.floor(Math.min(...ys)) - 3), y1 = Math.min(TS - 1, Math.ceil(Math.max(...ys)) + 3);
    const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]); if (Math.abs(d) < 1e-9) return;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const l1 = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / d, l2 = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / d, l3 = 1 - l1 - l2; const e = -.08; if (l1 >= e && l2 >= e && l3 >= e) mask[y * TS + x] = 255; } };
  for (let t = 0; t < g.pos.length / 9; t++) { let ny = 0, y = 0; for (let j = 0; j < 3; j++) { ny += g.nrm[(t * 3 + j) * 3 + 1]; y += g.pos[(t * 3 + j) * 3 + 1]; }
    if (ny / 3 > .75 && y / 3 > H * .9) { nTop++; fillTri(...[0, 1, 2].map(j => [g.uv[(t * 3 + j) * 2] * TS, (g.uv[(t * 3 + j) * 2 + 1]) * TS])); } }
  log('  Deckelflächen', nTop);
  const baseRaw = await sharp(Buffer.from(tex.getImage())).resize(TS, TS, { kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
  const blurRaw = await sharp(baseRaw, { raw: { width: TS, height: TS, channels: 3 } }).blur(18).raw().toBuffer();
  const mixed = Buffer.alloc(TS * TS * 3); for (let i = 0; i < TS * TS; i++) { const k = mask[i] ? .92 : 0; for (let c = 0; c < 3; c++) mixed[i * 3 + c] = baseRaw[i * 3 + c] * (1 - k) + blurRaw[i * 3 + c] * k * .9; }
  const baseBuf = await sharp(mixed, { raw: { width: TS, height: TS, channels: 3 } }).png().toBuffer();
  const baseJ = await sharp(baseBuf).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  // Vereinfachen, dann am Spalt schneiden
  const s = simp(g, 18000, 'free'); log('  vereinfacht', s.index.length / 3);
  const halves = { deckel: { pos: [], nrm: [], uv: [] }, koerper: { pos: [], nrm: [], uv: [] } };
  for (let t = 0; t < s.index.length; t += 3) { const vs = [0, 1, 2].map(j => { const i = s.index[t + j]; return { p: [s.pos[i * 3], s.pos[i * 3 + 1], s.pos[i * 3 + 2]], n: [s.nrm[i * 3], s.nrm[i * 3 + 1], s.nrm[i * 3 + 2]], u: [s.uv[i * 2], s.uv[i * 2 + 1]] }; });
    for (const [k, sign] of [['deckel', 1], ['koerper', -1]]) { const inside = v => sign * (v.p[1] - cutY) >= -1e-9; const o2 = [];
      for (let j = 0; j < 3; j++) { const A = vs[j], B = vs[(j + 1) % 3], ia = inside(A), ib = inside(B); if (ia) o2.push(A);
        if (ia !== ib) { const f = (A.p[1] - cutY) / (A.p[1] - B.p[1]); const Lp = (a, c) => a.map((x, q) => x + (c[q] - x) * f); o2.push({ p: Lp(A.p, B.p), n: Lp(A.n, B.n), u: Lp(A.u, B.u) }); } }
      for (let j = 1; j + 1 < o2.length; j++) for (const v of [o2[0], o2[j], o2[j + 1]]) { halves[k].pos.push(...v.p); halves[k].nrm.push(...v.n); halves[k].uv.push(...v.u); } } }
  const G = gltf(); const m = G.mat('grinder', { b: baseJ, metal: .72, rough: .38, ds: true });
  for (const k of ['deckel', 'koerper']) { const h = halves[k]; const w = weld({ pos: Float32Array.from(h.pos), nrm: Float32Array.from(h.nrm), uv: Float32Array.from(h.uv) });
    if (k === 'deckel') for (let i = 1; i < w.pos.length; i += 3) w.pos[i] -= cutY; // Deckel: Drehpunkt in der Schnittebene
    const nd = G.mesh(k, w, m); if (k === 'deckel') nd.setTranslation([0, cutY, 0]); log('  ', k, w.index.length / 3); }
  await G.write(OUT + '/kiffen/grinder/model.glb');
  // Radius an der Schnittebene (für den Deckel-Einsatz)
  let rc = 0; for (let i = 0; i < s.pos.length; i += 3) if (Math.abs(s.pos[i + 1] - cutY) < H * .03) rc = Math.max(rc, Math.hypot(s.pos[i], s.pos[i + 2]));
  fs.writeFileSync(OUT + '/kiffen/grinder/meta.json', JSON.stringify({ h: +H.toFixed(4), cut: +cutY.toFixed(4), r: +rc.toFixed(4) })); }

// ================================================================ Kleine Modelle: glTF lesen, Maße, Texturen verkleinern
async function klein(name, file, { size, axis = 'y', target = 0, texSize = 1024, filter, keepAlpha = false, fix = () => {}, mats = {} } = {}) {
  log(name); const doc = await io.read(K + file); const parts = flatDoc(doc, filter); const list = [...parts.values()]; normalize(list, size, axis);
  const G = gltf(); const tcache = new Map(); let n = 0;
  for (const [mat, g] of parts) { let geo = g; const nm = mat ? mat.getName() : 'm'; const tri = g.pos.length / 9;
    if (target && tri > target) { geo = simp({ pos: g.pos, uv: g.uv, index: null }, Math.round(target * tri / list.reduce((s, x) => s + x.pos.length / 9, 0)), 'lock'); } else geo = weld(g);
    const o = mats[nm] || {}; const bt = mat && mat.getBaseColorTexture(), nt = mat && mat.getNormalTexture(), mt = mat && mat.getMetallicRoughnessTexture();
    const alpha = mat ? mat.getAlphaMode() : 'OPAQUE'; const png = keepAlpha || alpha !== 'OPAQUE';
    const conv = async (t, sz, isPng) => { if (!t) return null; const k = t.getName() + '|' + sz + isPng; if (!tcache.has(k)) tcache.set(k, await img(Buffer.from(t.getImage()), sz, { fmt: isPng ? 'png' : 'jpeg', alpha: isPng })); return tcache.get(k); };
    const b = await conv(bt, texSize, png);
    const m = G.mat(nm, { b: o.bBuf || b, bpng: png, n: await conv(nt, Math.min(texSize, 1024), false), orm: mt ? await conv(mt, Math.min(texSize, 1024), false) : null, ao: false,
      color: o.color || (mat ? mat.getBaseColorFactor() : [1, 1, 1, 1]), rough: o.rough ?? (mat ? mat.getRoughnessFactor() : 1), metal: o.metal ?? (mat ? mat.getMetallicFactor() : 0), ds: o.ds ?? (mat ? mat.getDoubleSided() : false),
      alpha: o.alpha || (alpha !== 'OPAQUE' ? alpha : null), cutoff: o.cutoff || (alpha === 'MASK' ? mat.getAlphaCutoff() : 0) });
    fix(geo, nm); G.mesh(nm, geo, m); n += geo.index.length / 3; }
  const bb = boxAll(list); await G.write(OUT + '/kiffen/' + name + '/model.glb'); fs.writeFileSync(OUT + '/kiffen/' + name + '/meta.json', JSON.stringify({ size: bb.getSize(new THREE.Vector3()).toArray().map(v => +v.toFixed(4)), tris: n })); log('  Dreiecke', n, 'Maße', bb.getSize(new THREE.Vector3()).toArray().map(v => v.toFixed(3)));
}
if (doIt('knolle')) await klein('knolle', 'knolle.glb', { size: .034, target: 3200, texSize: 1024, mats: { Material_0: { rough: .85, ds: false } } });
if (doIt('joints')) await klein('joints', 'joints.glb', { size: .092, axis: 'max', texSize: 256 });
if (doIt('ascher')) await klein('ascher', 'ascher.glb', { size: .105, axis: 'max', texSize: 512, mats: { Material_46: { metal: 0, rough: .6 } } });
if (doIt('bong')) await klein('bong', 'bong.glb', { size: .36, texSize: 256, mats: { bong: { color: [.86, .93, .9, .32], rough: .05, alpha: 'BLEND' } } });
if (doIt('tuetchen')) await klein('tuetchen', 'tuetchen.glb', { size: .07, axis: 'max', texSize: 512 });
if (doIt('pflanze')) await klein('pflanze', 'pflanze_dose.glb', { size: 1.05, texSize: 1024 });
if (doIt('topf')) await klein('topf', 'pflanze_topf.glb', { size: .72, target: 30000, texSize: 512, filter: n => n.getMesh().listPrimitives()[0].getMaterial()?.getName() !== 'material',
  mats: { flower: { metal: 0, rough: .85 }, '07___Defaultdfd': { alpha: 'MASK', cutoff: .45, rough: .9 }, earth: { rough: 1 } } });
// Papes: Aufdruck (Marke) neutral überfärben – Schachtel-Textur: dunkle Felder bleiben dunkel, Schrift und Logos verschwinden, eigener schlichter Aufdruck
if (doIt('papes')) { const doc = await io.read(K + 'papes.glb'); const pq = doc.getRoot().listMaterials().find(m => m.getName() === 'Paquet'); const t = pq.getBaseColorTexture();
  const src = await sharp(Buffer.from(t.getImage())).resize(1024, 1024).removeAlpha().raw().toBuffer({ resolveWithObject: true }); const { data, info } = src; const W = info.width, H = info.height;
  // Helligkeit → zwei Töne: dunkle Felder = Ochsenblut, helle = ungebleichtes Papier; feine Schrift wird durch einen Median geschluckt
  const lum = new Float32Array(W * H); for (let i = 0; i < W * H; i++) lum[i] = (data[i * 3] * .3 + data[i * 3 + 1] * .59 + data[i * 3 + 2] * .11) / 255;
  const blurR = 9, tmp = new Float32Array(W * H), bl = new Float32Array(W * H);
  for (let y = 0; y < H; y++) { let s = 0; for (let x = -blurR; x <= blurR; x++) s += lum[y * W + Math.min(W - 1, Math.max(0, x))]; for (let x = 0; x < W; x++) { tmp[y * W + x] = s / (2 * blurR + 1); s += lum[y * W + Math.min(W - 1, x + blurR + 1)] - lum[y * W + Math.max(0, x - blurR)]; } }
  for (let x = 0; x < W; x++) { let s = 0; for (let y = -blurR; y <= blurR; y++) s += tmp[Math.min(H - 1, Math.max(0, y)) * W + x]; for (let y = 0; y < H; y++) { bl[y * W + x] = s / (2 * blurR + 1); s += tmp[Math.min(H - 1, y + blurR + 1) * W + x] - tmp[Math.max(0, y - blurR) * W + x]; } }
  const out = Buffer.alloc(W * H * 3); for (let i = 0; i < W * H; i++) { const d = bl[i] < .45 ? 1 : bl[i] > .6 ? 0 : (0.6 - bl[i]) / .15; const n = (Math.random() - .5) * 10;
    const c0 = [214, 200, 172], c1 = [92, 30, 26]; for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.max(0, Math.min(255, c0[c] + (c1[c] - c0[c]) * d + n)); }
  let paq = await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
  // schlichter eigener Aufdruck auf den dunklen Feldern (hochkant, wie die alten Logos): „BLÄTTCHEN · 32“
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${[[66, 760], [338, 760], [790, 760]].map(([x, y]) => `<text x="${x}" y="${y}" transform="rotate(-90 ${x} ${y})" font-family="Georgia" font-size="34" fill="#e8dcc0" letter-spacing="6" text-anchor="middle">BLÄTTCHEN · 32</text>`).join('')}</svg>`;
  paq = await sharp(paq).composite([{ input: Buffer.from(svg), left: 0, top: 0 }]).jpeg({ quality: 90 }).toBuffer();
  await klein('papes', 'papes.glb', { size: .11, axis: 'max', texSize: 512, mats: { Paquet: { bBuf: paq, rough: .7, metal: 0 }, Feuille: { rough: .9 } } });
  fs.writeFileSync(OUT + '/kiffen/papes/paquet_vorschau.jpg', paq); }
// Papiertextur für das Drehen (aus dem Papes-Modell: echtes Papier-Foto) und Pappe für den Tip
if (doIt('papier')) { const doc = await io.read(K + 'papes.glb'); const f = doc.getRoot().listMaterials().find(m => m.getName() === 'Feuille');
  fs.mkdirSync(OUT + '/kiffen/papier', { recursive: true }); fs.writeFileSync(OUT + '/kiffen/papier/b.jpg', await img(Buffer.from(f.getBaseColorTexture().getImage()), 512)); fs.writeFileSync(OUT + '/kiffen/papier/n.jpg', await img(Buffer.from(f.getNormalTexture().getImage()), 512)); log('Papier → kiffen/papier'); }
