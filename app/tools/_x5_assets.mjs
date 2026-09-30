// X-5 (Fotoalbum + Beutel): Rohmodelle aus HAM_FabDownloads/v10 für das Spiel aufbereiten → game/assets/ms/{album,beutel1,beutel2,beutel3}/model.glb
//   album   Leather Book (Smoggybeard, CC-BY): in Metern, entlang der halben Dicke in Deckel- und Rückenhälfte geschnitten (zum Aufklappen), meta.json mit Maßen
//   beutel1 Leather Pouch (MissTxxT, CC-BY): ZBrush-Skulptur ohne UV → 40k Dreiecke, Teile als eigene Netze, Gewichte für die Klappe (Skinning zur Laufzeit)
//   beutel2 Backpack Scan (SebastianBA, CC-BY): Boden-Scheibe entfernt, vereinfacht, Textur 2048
//   beutel3 Backpack (CC-BY): 2,5 Mio. → ~130k Dreiecke, Texturen 256–2048 statt 4096
// Aufruf: node --max-old-space-size=12000 tools/_x5_assets.mjs [album|beutel1|beutel2|beutel3 …]  (danach: node tools/ktx.mjs)
import fs from 'fs'; import path from 'path'; import * as THREE from 'three'; import sharp from 'sharp';
import { Document, NodeIO } from '@gltf-transform/core';
import { simplify, normals } from './_x5_qem.mjs';
globalThis.self = globalThis; globalThis.window = globalThis;
const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js'); const { OBJLoader } = await import('three/addons/loaders/OBJLoader.js');
THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };
const SRC = 'C:/Users/GIGABYTE/HAM_FabDownloads/v10/', OUT = path.resolve('../game/assets/ms'), log = (...a) => console.log(...a);
const want = process.argv.slice(2); const doIt = k => !want.length || want.includes(k);
function fbx(f) { const b = fs.readFileSync(f); return new FBXLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), ''); }
// Netz in Weltkoordinaten (Matrix eingebacken), ohne Index
function flat(m) { m.updateMatrixWorld(true); const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrixWorld);
  return { pos: g.attributes.position.array.slice(), nrm: g.attributes.normal ? g.attributes.normal.array.slice() : null, uv: g.attributes.uv ? g.attributes.uv.array.slice() : null }; }
async function img(file, size, { q = 88, fmt = 'jpeg', ch } = {}) { let s = sharp(file).resize({ width: size, height: size, fit: 'fill', kernel: 'lanczos3' }); if (ch === 'grey') s = s.greyscale(); s = s.removeAlpha();
  return fmt === 'png' ? await s.png().toBuffer() : await s.jpeg({ quality: q, mozjpeg: true }).toBuffer(); }
// ORM aus drei Graustufenbildern (R = AO, G = Rauheit, B = Metall)
async function orm(ao, rough, metal, size) { const ch = async (f, def) => f ? (await sharp(f).resize(size, size, { fit: 'fill' }).greyscale().raw().toBuffer()) : Buffer.alloc(size * size, def);
  const [a, r, m] = await Promise.all([ch(ao, 255), ch(rough, 200), ch(metal, 0)]); const o = Buffer.alloc(size * size * 3); for (let i = 0; i < size * size; i++) { o[i * 3] = a[i]; o[i * 3 + 1] = r[i]; o[i * 3 + 2] = m[i]; }
  return sharp(o, { raw: { width: size, height: size, channels: 3 } }).jpeg({ quality: 90 }).toBuffer(); }
// ---------------------------------------------------------------- glTF schreiben
function gltf() { const doc = new Document(); const buf = doc.createBuffer(); const scene = doc.createScene('s'); const texCache = new Map();
  const tex = (name, data, mime = 'image/jpeg') => { if (!data) return null; if (texCache.has(data)) return texCache.get(data); const t = doc.createTexture(name).setImage(new Uint8Array(data)).setMimeType(mime); texCache.set(data, t); return t; };
  const mat = (name, o = {}) => { const m = doc.createMaterial(name).setBaseColorFactor(o.color || [1, 1, 1, 1]).setRoughnessFactor(o.rough ?? 1).setMetallicFactor(o.metal ?? 0).setDoubleSided(!!o.ds);
    if (o.b) m.setBaseColorTexture(tex(name + '_b', o.b)); if (o.n) m.setNormalTexture(tex(name + '_n', o.n)); if (o.orm) { const t = tex(name + '_orm', o.orm); m.setMetallicRoughnessTexture(t); if (o.ao !== false) m.setOcclusionTexture(t); } return m; };
  const mesh = (name, g, material, extra = {}) => { const prim = doc.createPrimitive().setMaterial(material);
    prim.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(g.pos).setBuffer(buf));
    if (g.nrm) prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(g.nrm).setBuffer(buf));
    if (g.uv) prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(g.uv).setBuffer(buf));
    for (const [k, v] of Object.entries(extra)) prim.setAttribute(k, doc.createAccessor().setType(v.type).setArray(v.array).setBuffer(buf));
    if (g.index) prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(g.pos.length / 3 > 65535 ? g.index : Uint16Array.from(g.index)).setBuffer(buf));
    const node = doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)); scene.addChild(node); return node; };
  const write = async f => { fs.mkdirSync(path.dirname(f), { recursive: true }); await new NodeIO().write(f, doc); log('  →', f, (fs.statSync(f).size / 1e6).toFixed(1) + ' MB'); };
  return { doc, mat, mesh, write }; }
// Punkte umrechnen: Skalierung/Verschiebung
function xform(g, fn) { const p = g.pos, n = g.nrm, v = new THREE.Vector3(); for (let i = 0; i < p.length; i += 3) { v.set(p[i], p[i + 1], p[i + 2]); fn(v); p[i] = v.x; p[i + 1] = v.y; p[i + 2] = v.z; } return g; }
function bounds(list) { const b = new THREE.Box3(); for (const g of list) for (let i = 0; i < g.pos.length; i += 3) b.expandByPoint(new THREE.Vector3(g.pos[i], g.pos[i + 1], g.pos[i + 2])); return b; }
const tris = g => (g.index ? g.index.length : g.pos.length / 3) / 3;

// ================================================================ ALBUM
if (doIt('album')) { log('Album');
  const o = fbx(SRC + 'lbook/source/Book_low.fbx'); let src; o.traverse(m => { if (m.isMesh) src = flat(m); });
  // FBX: Länge entlang −z, Dicke entlang +y (nach der Knotenmatrix). Auf 0,30 m Länge, Rücken (min x) nach x = 0, Mitte der Dicke nach y = 0
  let b = bounds([src]); const s = .30 / (b.max.z - b.min.z), cz = (b.min.z + b.max.z) / 2, cy = (b.min.y + b.max.y) / 2, x0 = b.min.x;
  xform(src, v => v.set((v.x - x0) * s, (v.y - cy) * s, (v.z - cz) * s)); b = bounds([src]); log('  Maße', b.min.toArray().map(x => x.toFixed(3)), b.max.toArray().map(x => x.toFixed(3)));
  // Seitenblock (UV im Schnittkanten-Streifen rechts im Atlas): Ausdehnung für die Papierseiten
  const pb = new THREE.Box3(); for (let i = 0; i < src.pos.length / 3; i++) if (src.uv[i * 2] > .78) pb.expandByPoint(new THREE.Vector3(src.pos[i * 3], src.pos[i * 3 + 1], src.pos[i * 3 + 2]));
  log('  Seitenblock', pb.min.toArray().map(x => x.toFixed(4)), pb.max.toArray().map(x => x.toFixed(4)));
  // Schneiden an y = 0 (Sutherland–Hodgman je Dreieck): oben = Deckel, unten = Rücken
  const halves = { oben: { pos: [], nrm: [], uv: [] }, unten: { pos: [], nrm: [], uv: [] } };
  const P = src.pos, N = src.nrm, U = src.uv;
  for (let t = 0; t < P.length / 9; t++) { const vs = [0, 1, 2].map(j => { const i = t * 3 + j; return { p: [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]], n: [N[i * 3], N[i * 3 + 1], N[i * 3 + 2]], u: [U[i * 2], U[i * 2 + 1]] }; });
    for (const [k, sign] of [['oben', 1], ['unten', -1]]) { const inside = v => sign * v.p[1] >= -1e-9; const out = [];
      for (let j = 0; j < 3; j++) { const A = vs[j], B = vs[(j + 1) % 3], ia = inside(A), ib = inside(B);
        if (ia) out.push(A); if (ia !== ib) { const f = A.p[1] / (A.p[1] - B.p[1]); const L = (a, c) => a.map((x, q) => x + (c[q] - x) * f); out.push({ p: L(A.p, B.p), n: L(A.n, B.n), u: L(A.u, B.u) }); } }
      for (let j = 1; j + 1 < out.length; j++) for (const v of [out[0], out[j], out[j + 1]]) { halves[k].pos.push(...v.p); halves[k].nrm.push(...v.n); halves[k].uv.push(...v.u); } } }
  const G = gltf(), D = SRC + 'lbook/textures/';
  const leder = G.mat('Einband', { b: await img(D + 'Book_albedo.jpg', 2048, { q: 90 }), n: await img(D + 'Book_normal.png', 2048, { q: 92 }), orm: await orm(D + 'Book_AO.jpg', D + 'Book_roughness.jpg', D + 'Book_metallic.jpg', 1024) });
  for (const k of ['oben', 'unten']) { const h = halves[k]; const g = { pos: Float32Array.from(h.pos), nrm: Float32Array.from(h.nrm), uv: Float32Array.from(h.uv), index: null };
    // gleiche Punkte zusammenlegen (Index)
    const map = new Map(), op = [], on = [], ou = [], oi = []; for (let i = 0; i < g.pos.length / 3; i++) { const key = [g.pos[i * 3], g.pos[i * 3 + 1], g.pos[i * 3 + 2], g.nrm[i * 3], g.nrm[i * 3 + 1], g.nrm[i * 3 + 2], g.uv[i * 2], g.uv[i * 2 + 1]].map(x => x.toFixed(5)).join(',');
      let j = map.get(key); if (j === undefined) { j = op.length / 3; map.set(key, j); op.push(g.pos[i * 3], g.pos[i * 3 + 1], g.pos[i * 3 + 2]); on.push(g.nrm[i * 3], g.nrm[i * 3 + 1], g.nrm[i * 3 + 2]); ou.push(g.uv[i * 2], g.uv[i * 2 + 1]); } oi.push(j); }
    G.mesh(k === 'oben' ? 'deckel' : 'ruecken', { pos: Float32Array.from(op), nrm: Float32Array.from(on), uv: Float32Array.from(ou), index: Uint32Array.from(oi) }, leder); log('  ', k, oi.length / 3, 'Dreiecke'); }
  await G.write(OUT + '/album/model.glb');
  fs.writeFileSync(OUT + '/album/meta.json', JSON.stringify({ min: b.min.toArray(), max: b.max.toArray(), block: { min: pb.min.toArray(), max: pb.max.toArray() } }));
}

// ================================================================ BEUTEL 1: Ledertasche (ohne UV) – Teile getrennt, Klappen-Gewicht
if (doIt('beutel1')) { log('Beutel 1');
  const o = new OBJLoader().parse(fs.readFileSync(SRC + 'pouch/src/Merged_PolySphere5.obj').toString()); let src; o.traverse(m => { if (m.isMesh) src = flat(m); });
  // Teile (zusammenhängend), der Größe nach
  const P = src.pos, n = P.length / 3; const key = i => P[i * 3].toFixed(5) + ',' + P[i * 3 + 1].toFixed(5) + ',' + P[i * 3 + 2].toFixed(5); const id = new Map(), par = [], vid = new Int32Array(n);
  for (let i = 0; i < n; i++) { const k = key(i); if (!id.has(k)) { id.set(k, id.size); par.push(id.size - 1); } vid[i] = id.get(k); }
  const fd = x => { while (par[x] !== x) x = par[x] = par[par[x]]; return x; }; for (let t = 0; t < n; t += 3) { const a = fd(vid[t]); par[fd(vid[t + 1])] = a; par[fd(vid[t + 2])] = a; }
  const byR = new Map(); for (let t = 0; t < n; t += 3) { const r = fd(vid[t]); if (!byR.has(r)) byR.set(r, []); byR.get(r).push(t); }
  const comps = [...byR.values()].sort((a, b) => b.length - a.length);
  // 0 Hülle (Rücken, Deckel, Front) · 1 Schnalle oben · 2 Schnalle unten · 3 Riemen unten · 4 Riemen über den Deckel · 5 Seitenteile
  const names = ['huelle', 'schnalle_o', 'schnalle_u', 'riemen_u', 'riemen_o', 'seiten'], target = [16000, 4200, 4200, 2400, 3000, 1800];
  const b0 = bounds([src]); const s = .17 / (b0.max.y - b0.min.y), cx = (b0.min.x + b0.max.x) / 2, cz = (b0.min.z + b0.max.z) / 2, y0 = b0.min.y;
  const G = gltf();
  const mats = { huelle: G.mat('Leder', { color: [.36, .21, .12, 1], rough: .62 }), seiten: G.mat('LederDunkel', { color: [.24, .14, .08, 1], rough: .66 }), riemen: G.mat('Riemen', { color: [.2, .115, .065, 1], rough: .58 }), schnalle: G.mat('Schnalle', { color: [.09, .075, .06, 1], rough: .38 }) };
  const hingeY = (.40 - y0) * s, hingeZ = (0 - cz) * s; // Klappe dreht um die Oberkante
  for (let c = 0; c < 6; c++) { const L = comps[c], pos = new Float32Array(L.length * 9); L.forEach((t, j) => { for (let q = 0; q < 9; q++) pos[j * 9 + q] = P[t * 3 + q]; });
    xform({ pos }, v => v.set((v.x - cx) * s, (v.y - y0) * s, (v.z - cz) * s));
    const r = simplify({ pos, uv: null, index: null }, target[c], { log }); const g = normals(r, 55);
    // Klappe: Hülle/Riemen oben/Schnalle oben – vorn (z > 0) dreht mit, über die Oberkante weich
    const fw = new Float32Array(g.pos.length / 3);
    for (let i = 0; i < fw.length; i++) { const y = g.pos[i * 3 + 1], z = g.pos[i * 3 + 2]; let w = 0;
      if (c === 1) w = 1; else if (c === 0 || c === 4) { const k = Math.min(1, Math.max(0, (z - (hingeZ - .004)) / .018)); w = k * k * (3 - 2 * k); if (y < hingeY - .03 && z < hingeZ + .01) w = 0; } fw[i] = w; }
    const sk = new Uint16Array(fw.length * 4), sw = new Float32Array(fw.length * 4); for (let i = 0; i < fw.length; i++) { sk[i * 4] = 0; sk[i * 4 + 1] = 1; sw[i * 4] = 1 - fw[i]; sw[i * 4 + 1] = fw[i]; }
    const m = c === 0 ? mats.huelle : c === 5 ? mats.seiten : c === 1 || c === 2 ? mats.schnalle : mats.riemen;
    G.mesh(names[c], g, m, { JOINTS_0: { type: 'VEC4', array: sk }, WEIGHTS_0: { type: 'VEC4', array: sw } }); }
  await G.write(OUT + '/beutel1/model.glb'); fs.writeFileSync(OUT + '/beutel1/meta.json', JSON.stringify({ hinge: [0, hingeY, hingeZ], size: [(b0.max.x - b0.min.x) * s, .17, (b0.max.z - b0.min.z) * s] }));
}

// ================================================================ BEUTEL 2: Rucksack-Scan
if (doIt('beutel2')) { log('Beutel 2');
  const o = fbx(SRC + 'bpscan/src/Mochila.fbx'); let src; o.traverse(m => { if (m.isMesh) src = flat(m); });
  let b = bounds([src]); const H = b.max.y - b.min.y;
  // Fußabdruck des Rucksacks (Punkte zwischen 25 und 55 % der Höhe) → Bodenscheibe außerhalb weg
  const fp = new THREE.Box3(); for (let i = 0; i < src.pos.length / 3; i++) { const y = src.pos[i * 3 + 1]; if (y > b.min.y + H * .25 && y < b.min.y + H * .55) fp.expandByPoint(new THREE.Vector3(src.pos[i * 3], 0, src.pos[i * 3 + 2])); }
  const fcx = (fp.min.x + fp.max.x) / 2, fcz = (fp.min.z + fp.max.z) / 2, rx = (fp.max.x - fp.min.x) / 2 * 1.04, rz = (fp.max.z - fp.min.z) / 2 * 1.04;
  // Bodenscheibe: sandfarbene Dreiecke im unteren Fünftel (Farbe an der UV-Mitte) und alles ganz unten
  const { data: TX, info: TI } = await sharp(SRC + 'bpscan/src/Mochila.png').resize(1024, 1024, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const sand = (u, v) => { const x = Math.min(TI.width - 1, Math.max(0, Math.floor((u - Math.floor(u)) * TI.width))), y = Math.min(TI.height - 1, Math.max(0, Math.floor((1 - (v - Math.floor(v))) * TI.height))), o = (y * TI.width + x) * 3, r = TX[o], g = TX[o + 1], bl = TX[o + 2]; return r > 120 && r - bl > 45 && g > 80 && r + g + bl > 300; };
  const keep = []; for (let t = 0; t < src.pos.length / 9; t++) { let cy = 0, out = 0, cu = 0, cv = 0; for (let j = 0; j < 3; j++) { const i = t * 3 + j, x = src.pos[i * 3], y = src.pos[i * 3 + 1], z = src.pos[i * 3 + 2]; cy += y / 3; cu += src.uv[i * 2] / 3; cv += src.uv[i * 2 + 1] / 3; if (((x - fcx) / rx) ** 2 + ((z - fcz) / rz) ** 2 > 1) out++; }
    if (cy < b.min.y + H * .09 && out > 0) continue; if (cy < b.min.y + H * .03) continue; if (cy < b.min.y + H * .22 && sand(cu, cv)) continue; keep.push(t); }
  const pos = new Float32Array(keep.length * 9), uv = new Float32Array(keep.length * 6); keep.forEach((t, j) => { for (let q = 0; q < 9; q++) pos[j * 9 + q] = src.pos[t * 9 + q]; for (let q = 0; q < 6; q++) uv[j * 6 + q] = src.uv[t * 6 + q]; });
  log('  ohne Boden', keep.length, 'von', src.pos.length / 9);
  const g0 = { pos, uv }; b = bounds([g0]); const s = .46 / (b.max.y - b.min.y), cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, y0 = b.min.y; xform(g0, v => v.set((v.x - cx) * s, (v.y - y0) * s, (v.z - cz) * s));
  const r = simplify({ pos: g0.pos, uv: g0.uv, index: null }, 48000, { log }); const g = normals(r, 70);
  const G = gltf(); G.mesh('rucksack', g, G.mat('Rucksack', { b: await img(SRC + 'bpscan/src/Mochila.png', 2048, { q: 90 }), rough: .9 }));
  await G.write(OUT + '/beutel2/model.glb');
}

// ================================================================ BEUTEL 3: großer Wanderrucksack
if (doIt('beutel3')) { log('Beutel 3');
  const D = SRC + 'wizbp/', o = fbx(D + 'source/Backpack.fbx'); const parts = []; o.traverse(m => { if (m.isMesh) parts.push({ name: m.name, mat: [].concat(m.material)[0].name, g: flat(m) }); });
  const b = bounds(parts.map(p => p.g)); const s = .78 / (b.max.y - b.min.y), cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, y0 = b.min.y; for (const p of parts) xform(p.g, v => v.set((v.x - cx) * s, (v.y - y0) * s, (v.z - cz) * s));
  const tx = {}; for (const f of fs.readdirSync(D + 'textures')) { const m = f.match(/^Rucksack_(.+)_(Albedo|Normal|Roughness|AO)\.png$/); if (m) { const k = m[1].toLowerCase().replace(/[^a-z]/g, ''); (tx[k] ||= {})[m[2]] = D + 'textures/' + f; } }
  const texOf = n => { const k = n.toLowerCase().replace(/[^a-z]/g, ''); return tx[k] || null; };
  // Zielgrößen (Dreiecke) und Texturgrößen je Material
  const T = { Rope: [16000, 'free', 512], Rucksack: [52000, 'lock', 2048], 'Shoulder straps': [9000, 'lock', 1024], 'Top straps': [6000, 'lock', 512], Blanket: [9000, 'lock', 1024], 'Bag stuff': [6000, 'lock', 512], 'Top strap buckles': [3000, 'free', 0], 'Bottom strap buckles': [3000, 'free', 0],
    'Bottom straps': [5000, 'lock', 512], 'Tent bag': [7000, 'lock', 1024], 'Belt buckle': [2500, 'free', 0], 'Tent strap': [2500, 'lock', 256], Belt: [2500, 'lock', 512], Bottle: [2400, 'free', 0] };
  const G = gltf(), matCache = {};
  const matFor = async n => { if (matCache[n]) return matCache[n]; const t = texOf(n), cfg = T[n] || [0, 'lock', 256], sz = cfg[2] || 256; let m;
    if (n === 'Bottle') m = G.mat(n, { color: [.72, .8, .78, 1], rough: .08, metal: 0 });
    else if (/buckle/i.test(n) && !(t && t.Albedo)) m = G.mat(n, { color: [.42, .36, .28, 1], rough: .45, metal: .85 });
    else if (!t || !t.Albedo) m = G.mat(n, { color: [.35, .25, .17, 1], rough: .8 });
    else m = G.mat(n, { b: await img(t.Albedo, sz, { q: 88 }), n: t.Normal ? await img(t.Normal, Math.min(sz, 1024), { q: 90 }) : null, orm: t.Roughness ? await orm(t.AO || null, t.Roughness, null, Math.min(sz, 1024)) : null, ao: !!t.AO });
    return matCache[n] = m; };
  let total = 0;
  for (const p of parts) { const cfg = T[p.mat]; const n0 = tris(p.g); let g;
    if (cfg && n0 > cfg[0]) { log(' ', p.name, p.mat, n0); g = normals(simplify({ pos: p.g.pos, uv: p.g.uv, index: null }, cfg[0], { seams: cfg[1], log }), 60); }
    else { // klein: nur schweißen
      g = normals(simplify({ pos: p.g.pos, uv: p.g.uv, index: null }, n0, {}), 60); }
    total += tris(g); G.mesh(p.name, g, await matFor(p.mat)); }
  log('  gesamt', total); await G.write(OUT + '/beutel3/model.glb');
}
