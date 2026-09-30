// X-5: Album-Einband untersuchen – zusammenhängende Teile mit Box und UV-Bereich
import fs from 'fs'; import * as THREE from 'three';
globalThis.self = globalThis; globalThis.window = globalThis;
const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');
THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };
const buf = fs.readFileSync('C:/Users/GIGABYTE/HAM_FabDownloads/v10/lbook/source/Book_low.fbx');
const o = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), ''); o.updateMatrixWorld(true);
o.traverse(m => { if (!m.isMesh) return; console.log('mesh', m.name, 'matrix', m.matrixWorld.elements.map(v => +v.toFixed(3)).join(','));
  const g = m.geometry, P = g.attributes.position, U = g.attributes.uv, n = P.count; console.log('verts', n, 'index', !!g.index, 'groups', JSON.stringify(g.groups));
  // Teile: Dreiecke über gleiche Positionen verbinden
  const key = i => [P.getX(i), P.getY(i), P.getZ(i)].map(v => v.toFixed(3)).join(','); const id = new Map(), par = [];
  const vid = new Int32Array(n); for (let i = 0; i < n; i++) { const k = key(i); if (!id.has(k)) { id.set(k, id.size); par.push(id.size - 1); } vid[i] = id.get(k); }
  const f = x => { while (par[x] !== x) x = par[x] = par[par[x]]; return x; };
  for (let t = 0; t < n; t += 3) { const a = f(vid[t]), b = f(vid[t + 1]), c = f(vid[t + 2]); par[b] = a; par[f(c)] = a; }
  const comp = new Map(); for (let t = 0; t < n; t += 3) { const r = f(vid[t]); if (!comp.has(r)) comp.set(r, { tris: 0, min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9], umin: [9, 9], umax: [-9, -9] }); const C = comp.get(r); C.tris++;
    for (let j = 0; j < 3; j++) { const i = t + j; for (let k = 0; k < 3; k++) { const v = [P.getX(i), P.getY(i), P.getZ(i)][k]; C.min[k] = Math.min(C.min[k], v); C.max[k] = Math.max(C.max[k], v); } C.umin[0] = Math.min(C.umin[0], U.getX(i)); C.umin[1] = Math.min(C.umin[1], U.getY(i)); C.umax[0] = Math.max(C.umax[0], U.getX(i)); C.umax[1] = Math.max(C.umax[1], U.getY(i)); } }
  for (const C of comp.values()) console.log(C.tris, 'min', C.min.map(v => v.toFixed(1)).join(' '), 'max', C.max.map(v => v.toFixed(1)).join(' '), 'uv', C.umin.map(v => v.toFixed(2)).join(' '), '→', C.umax.map(v => v.toFixed(2)).join(' '));
});
