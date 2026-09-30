// X-5: zusammenhängende Teile eines Modells (Box, Dreiecke)
import fs from 'fs'; import * as THREE from 'three';
globalThis.self = globalThis; globalThis.window = globalThis;
const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js'); const { OBJLoader } = await import('three/addons/loaders/OBJLoader.js');
THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };
const f = process.argv[2], buf = fs.readFileSync(f); const o = f.endsWith('.obj') ? new OBJLoader().parse(buf.toString()) : new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
o.updateMatrixWorld(true);
o.traverse(m => { if (!m.isMesh) return; const g = m.geometry, P = g.attributes.position, I = g.index, n = I ? I.count : P.count; const at = k => I ? I.getX(k) : k;
  const key = i => P.getX(i).toFixed(4) + ',' + P.getY(i).toFixed(4) + ',' + P.getZ(i).toFixed(4); const id = new Map(), par = [], vid = new Int32Array(P.count);
  for (let i = 0; i < P.count; i++) { const k = key(i); if (!id.has(k)) { id.set(k, id.size); par.push(id.size - 1); } vid[i] = id.get(k); }
  const fd = x => { while (par[x] !== x) x = par[x] = par[par[x]]; return x; };
  for (let t = 0; t < n; t += 3) { const a = fd(vid[at(t)]); par[fd(vid[at(t + 1)])] = a; par[fd(vid[at(t + 2)])] = a; }
  const comp = new Map(); for (let t = 0; t < n; t += 3) { const r = fd(vid[at(t)]); if (!comp.has(r)) comp.set(r, { tris: 0, min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] }); const C = comp.get(r); C.tris++; for (let j = 0; j < 3; j++) { const i = at(t + j); const v = [P.getX(i), P.getY(i), P.getZ(i)]; for (let k = 0; k < 3; k++) { C.min[k] = Math.min(C.min[k], v[k]); C.max[k] = Math.max(C.max[k], v[k]); } } }
  const L = [...comp.values()].sort((a, b) => b.tris - a.tris); console.log(m.name, 'components', L.length); for (const C of L.slice(0, 30)) console.log(C.tris, C.min.map(v => v.toFixed(3)).join(' '), '|', C.max.map(v => v.toFixed(3)).join(' ')); });
