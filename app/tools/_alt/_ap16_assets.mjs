// AP-16 (Kapitel 2 „Das achte Kind“): neue Requisiten aus HAM_FabDownloads/v16_requisiten für das Amt aufbereiten (Maße in Metern, Unterkante y = 0, Mitte x/z = 0)
//   kette    rostige Kette (Scan, 500k Dreiecke, Punktfarben) → ~16k Dreiecke, Punktfarben als COLOR_0 → ms/w_kette/model.glb   (Kette an der Luke)
//   funk     Notfunkgerät „p_33_radio“ (mit Lämpchen im Emissive) → ms/w_funk/model.glb                                  (AG-06, Sicherungsraum)
//   telefon  Tischtelefon (SM_Telephone, ohne Textur → Bakelit schwarz) → ms/w_telefon/model.glb                             (Zimmer 7, Kantine)
//   thermos  Thermoskanne (aus „Canister“) → ms/w_thermos/model.glb                                                           (Kantine)
//   blech    Campinggeschirr (Becher, Teller, Flasche als eigene Knoten) → ms/w_blech/model.glb                              (Kantine)
// Aufruf (in app/tools): node --max-old-space-size=8000 _ap16_assets.mjs [kette funk telefon thermos blech]
import fs from 'fs'; import path from 'path'; import * as THREE from 'three'; import sharp from 'sharp';
import { Document, NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { simplify, normals } from './_x5_qem.mjs';
globalThis.self = globalThis; globalThis.window = globalThis;
const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');
THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };
const SRC = 'C:/Users/GIGABYTE/HAM_FabDownloads/v16_requisiten/', X = SRC + 'x/', OUT = path.resolve('../../game/assets/ms'), log = (...a) => console.log(...a);
const want = process.argv.slice(2); const doIt = k => !want.length || want.includes(k);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

async function img(file, size, { q = 88, png = false } = {}) { if (!file || !fs.existsSync(file)) return null; let s = sharp(fs.readFileSync(file)).resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true });
  return png ? await s.png({ compressionLevel: 9 }).toBuffer() : await s.removeAlpha().jpeg({ quality: q, mozjpeg: true }).toBuffer(); }
async function orm(ao, rough, metal, size) { // glTF: R = AO, G = Rauheit, B = Metall
  const rd = async (f, def) => f && fs.existsSync(f) ? await sharp(fs.readFileSync(f)).resize(size, size, { fit: 'fill' }).greyscale().raw().toBuffer() : Buffer.alloc(size * size, def);
  const a = await rd(ao, 255), r = await rd(rough, 200), m = await rd(metal, 0), out = Buffer.alloc(size * size * 3);
  for (let i = 0; i < size * size; i++) { out[i * 3] = a[i]; out[i * 3 + 1] = r[i]; out[i * 3 + 2] = m[i]; }
  return await sharp(out, { raw: { width: size, height: size, channels: 3 } }).jpeg({ quality: 90 }).toBuffer(); }
function gltf() { const doc = new Document(); const buf = doc.createBuffer(); const scene = doc.createScene('s');
  const tex = (name, data, mime = 'image/jpeg') => data ? doc.createTexture(name).setImage(new Uint8Array(data)).setMimeType(mime) : null;
  const mat = (name, o = {}) => { const m = doc.createMaterial(name).setBaseColorFactor(o.color || [1, 1, 1, 1]).setRoughnessFactor(o.rough ?? 1).setMetallicFactor(o.metal ?? 0).setDoubleSided(!!o.ds);
    if (o.b) m.setBaseColorTexture(tex(name + '_b', o.b, o.bpng ? 'image/png' : 'image/jpeg')); if (o.n) m.setNormalTexture(tex(name + '_n', o.n, 'image/png'));
    if (o.orm) { const t = tex(name + '_orm', o.orm); m.setMetallicRoughnessTexture(t); m.setOcclusionTexture(t); } if (o.e) { m.setEmissiveTexture(tex(name + '_e', o.e)); m.setEmissiveFactor(o.ef || [1, 1, 1]); }
    if (o.alpha) m.setAlphaMode(o.alpha); return m; };
  const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buf);
  const mesh = (name, g, material) => { const p = doc.createPrimitive().setMaterial(material); p.setAttribute('POSITION', acc('VEC3', g.pos)); if (g.nrm) p.setAttribute('NORMAL', acc('VEC3', g.nrm));
    if (g.uv) p.setAttribute('TEXCOORD_0', acc('VEC2', g.uv)); if (g.col) p.setAttribute('COLOR_0', acc('VEC3', g.col));
    if (g.index) p.setIndices(acc('SCALAR', g.pos.length / 3 > 65535 ? Uint32Array.from(g.index) : Uint16Array.from(g.index)));
    const node = doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(p)); scene.addChild(node); return node; };
  const write = async f => { fs.mkdirSync(path.dirname(f), { recursive: true }); await io.write(f, doc); log('  →', f, (fs.statSync(f).size / 1e6).toFixed(2) + ' MB'); };
  return { mat, mesh, write }; }
function fbx(file) { const b = fs.readFileSync(file); const r = new FBXLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), ''); r.updateMatrixWorld(true); return r; }
// Meshes eines FBX → Geometrien (Weltmatrix eingebacken) je Materialname
function flat(root, keep = () => true) { const out = new Map(); const v = new THREE.Vector3();
  root.traverse(o => { if (!o.isMesh || !keep(o)) return; const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, n3 = new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
    const mats = [].concat(o.material), groups = g.groups.length ? g.groups : [{ start: 0, count: P.count, materialIndex: 0 }];
    for (const gr of groups) { const mn = (mats[gr.materialIndex] || mats[0]).name; if (!out.has(mn)) out.set(mn, { pos: [], nrm: [], uv: [] }); const e = out.get(mn);
      for (let i = gr.start; i < gr.start + gr.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); e.pos.push(v.x, v.y, v.z); if (N) { v.fromBufferAttribute(N, i).applyMatrix3(n3).normalize(); e.nrm.push(v.x, v.y, v.z); } else e.nrm.push(0, 1, 0); e.uv.push(U ? U.getX(i) : 0, U ? U.getY(i) : 0); } } });
  for (const e of out.values()) { e.pos = Float32Array.from(e.pos); e.nrm = Float32Array.from(e.nrm); e.uv = Float32Array.from(e.uv); } return out; }
function norm(list, size, axis = 'y') { const b = new THREE.Box3(), v = new THREE.Vector3(); for (const g of list) for (let i = 0; i < g.pos.length; i += 3) b.expandByPoint(v.set(g.pos[i], g.pos[i + 1], g.pos[i + 2]));
  const s0 = b.getSize(new THREE.Vector3()), s = size / (axis === 'max' ? Math.max(s0.x, s0.y, s0.z) : s0[axis]), c = b.getCenter(new THREE.Vector3());
  for (const g of list) for (let i = 0; i < g.pos.length; i += 3) { g.pos[i] = (g.pos[i] - c.x) * s; g.pos[i + 1] = (g.pos[i + 1] - b.min.y) * s; g.pos[i + 2] = (g.pos[i + 2] - c.z) * s; }
  log('    Maß', s0.multiplyScalar(s).toArray().map(x => x.toFixed(3)).join(' × ')); }

// ================================================================ KETTE (Scan mit Punktfarben)
if (doIt('kette')) { log('kette');
  const txt = fs.readFileSync(SRC + 'kette.obj', 'utf8'), V = [], C = [], F = [];
  for (const l of txt.split('\n')) { if (l.startsWith('v ')) { const a = l.split(' '); V.push(+a[1], +a[2], +a[3]); C.push(+(a[4] ?? .5), +(a[5] ?? .45), +(a[6] ?? .38)); }
    else if (l.startsWith('f ')) { const a = l.trim().split(' ').slice(1).map(s => +s.split('/')[0] - 1); for (let k = 1; k + 1 < a.length; k++) F.push(a[0], a[k], a[k + 1]); } }
  log('  roh', V.length / 3, 'Punkte', F.length / 3, 'Dreiecke');
  const pos = Float32Array.from(V), r = simplify({ pos, uv: null, index: Uint32Array.from(F) }, 16000, { seams: 'free' }), nn = normals(r, 55);
  // Farbe je neuem Punkt: nächster Originalpunkt (Gitter)
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], pos[i + k]); mx[k] = Math.max(mx[k], pos[i + k]); }
  const cell = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 200, grid = new Map(), key = (x, y, z) => Math.floor((x - mn[0]) / cell) + ',' + Math.floor((y - mn[1]) / cell) + ',' + Math.floor((z - mn[2]) / cell);
  for (let i = 0; i < pos.length / 3; i++) { const k = key(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); (grid.get(k) || grid.set(k, []).get(k)).push(i); }
  const col = new Float32Array(nn.pos.length);
  for (let i = 0; i < nn.pos.length / 3; i++) { const x = nn.pos[i * 3], y = nn.pos[i * 3 + 1], z = nn.pos[i * 3 + 2], gx = Math.floor((x - mn[0]) / cell), gy = Math.floor((y - mn[1]) / cell), gz = Math.floor((z - mn[2]) / cell); let best = -1, bd = 1e30;
    for (let r2 = 1; r2 <= 3 && best < 0; r2++) for (let a = -r2; a <= r2; a++) for (let b = -r2; b <= r2; b++) for (let c = -r2; c <= r2; c++) { const L = grid.get((gx + a) + ',' + (gy + b) + ',' + (gz + c)); if (!L) continue; for (const j of L) { const d = (pos[j * 3] - x) ** 2 + (pos[j * 3 + 1] - y) ** 2 + (pos[j * 3 + 2] - z) ** 2; if (d < bd) { bd = d; best = j; } } }
    const s = best < 0 ? 0 : best; for (let k = 0; k < 3; k++) col[i * 3 + k] = Math.pow(C[s * 3 + k], 2.2); } // sRGB → linear
  const g = { pos: nn.pos, nrm: nn.nrm, uv: null, col, index: nn.index };
  // Scan = Kettenhaufen (flach gerollt): dünnste Achse nach oben, 0,62 m über alles (Haufen unter der Luke, Kettenrolle der Blechmänner)
  const b = new THREE.Box3(); for (let i = 0; i < g.pos.length; i += 3) b.expandByPoint(new THREE.Vector3(g.pos[i], g.pos[i + 1], g.pos[i + 2])); const sz = b.getSize(new THREE.Vector3());
  const ax = sz.x <= sz.y && sz.x <= sz.z ? 'x' : sz.z <= sz.y ? 'z' : 'y'; log('  dünne Achse', ax, sz.toArray().map(v => v.toFixed(1)).join(' × '));
  if (ax !== 'y') { const m = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(ax === 'x' ? 0 : 1, 0, ax === 'x' ? 1 : 0), Math.PI / 2), m3 = new THREE.Matrix3().getNormalMatrix(m), v = new THREE.Vector3();
    for (let i = 0; i < g.pos.length; i += 3) { v.set(g.pos[i], g.pos[i + 1], g.pos[i + 2]).applyMatrix4(m); g.pos[i] = v.x; g.pos[i + 1] = v.y; g.pos[i + 2] = v.z; v.set(g.nrm[i], g.nrm[i + 1], g.nrm[i + 2]).applyMatrix3(m3).normalize(); g.nrm[i] = v.x; g.nrm[i + 1] = v.y; g.nrm[i + 2] = v.z; } }
  norm([g], .62, 'max');
  const G = gltf(); G.mesh('kette', g, G.mat('rost', { rough: .78, metal: .55 })); await G.write(path.join(OUT, 'w_kette/model.glb')); }

// ================================================================ NOTFUNKGERÄT (Emissive: Lämpchen und Skala)
if (doIt('funk')) { log('funk'); const T = X + 'notradio/textures/';
  const M = flat(fbx(X + 'notradio/source/p_33_radio_sf.fbx'), o => !/^ground/.test(o.name)); const list = [...M.values()]; norm(list, .34, 'max');
  const G = gltf();
  const radio = G.mat('radio', { b: await img(T + 'radio_albedo.jpg', 1024), n: await img(T + 'radio_normal.png', 1024, { png: true }), orm: await orm(T + 'radio_AO.jpg', T + 'radio_roughness.jpg', T + 'radio_metallic.jpg', 1024), e: await img(T + 'radio_emissive.jpg', 512), ef: [1, 1, 1] });
  const glas = G.mat('glas', { b: await img(T + 'Glass_albedo.jpg', 512), orm: await orm(T + 'Glass_AO.jpg', T + 'Glass_roughness.jpg', T + 'Glass_metallic.jpg', 512), alpha: 'BLEND', color: [1, 1, 1, .55] });
  for (const [mn, g] of M) { G.mesh(mn, { pos: g.pos, nrm: g.nrm, uv: g.uv, index: null }, /glass/i.test(mn) ? glas : radio); }
  await G.write(path.join(OUT, 'w_funk/model.glb')); }

// ================================================================ TELEFON (Bakelit, ohne Textur)
if (doIt('telefon')) { log('telefon');
  const M = flat(fbx(X + 'funkgeraet/SM_Telephone.fbx')); const list = [...M.values()]; norm(list, .24, 'max');
  const G = gltf(), bak = G.mat('bakelit', { color: [.028, .026, .024, 1], rough: .32, metal: 0 });
  for (const [mn, g] of M) { G.mesh(mn, { pos: g.pos, nrm: g.nrm, uv: g.uv, index: null }, bak); }
  await G.write(path.join(OUT, 'w_telefon/model.glb')); }

// ================================================================ THERMOSKANNE
if (doIt('thermos')) { log('thermos'); const T = X + 'thermos/textures/';
  const M = flat(fbx(X + 'thermos/source/Canister.fbx'), o => /thermos/i.test(o.name)); const list = [...M.values()]; norm(list, .31, 'y');
  const G = gltf(), m = G.mat('thermos', { b: await img(T + 'Diffuse_UnoVac.png', 1024), n: await img(T + 'Normal_1k.png', 1024, { png: true }), orm: await orm(null, T + 'Roughness_UnoVac.png', T + 'Metallic_UnoVac.png', 1024) });
  for (const [mn, g] of M) { G.mesh(mn, { pos: g.pos, nrm: g.nrm, uv: g.uv, index: null }, m); }
  await G.write(path.join(OUT, 'w_thermos/model.glb')); }

// ================================================================ BLECHGESCHIRR (Knoten: coffee_flask, cup, plate, …; Maße des Originals in Metern)
if (doIt('blech')) { log('blech'); const D = X + 'geschirr/camping_dinnerware_(GLTF)/';
  const doc = await io.read(D + 'camping_dinnerware_(GLTF).gltf');
  for (const t of doc.getRoot().listTextures()) { const im = t.getImage(); if (!im) continue; const out = await sharp(Buffer.from(im)).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer(); t.setImage(new Uint8Array(out)).setMimeType('image/png'); }
  fs.mkdirSync(path.join(OUT, 'w_blech'), { recursive: true }); await io.write(path.join(OUT, 'w_blech/model.glb'), doc); log('  →', path.join(OUT, 'w_blech/model.glb')); }
