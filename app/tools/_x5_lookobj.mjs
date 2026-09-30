import fs from 'fs'; import * as THREE from 'three'; import { render } from './_x5_render.mjs';
globalThis.self = globalThis; globalThis.window = globalThis;
const { OBJLoader } = await import('three/addons/loaders/OBJLoader.js');
const [src, out, yaw, pitch] = process.argv.slice(2);
const o = new OBJLoader().parse(fs.readFileSync(src).toString()); o.updateMatrixWorld(true);
const cols = [[150, 95, 60], [120, 70, 40], [100, 60, 35], [200, 170, 60], [90, 150, 200], [200, 80, 80]];
const parts = []; o.traverse(m => { if (!m.isMesh) return; const P = m.geometry.attributes.position, n = P.count;
  const key = i => P.getX(i).toFixed(4) + ',' + P.getY(i).toFixed(4) + ',' + P.getZ(i).toFixed(4); const id = new Map(), par = [], vid = new Int32Array(n);
  for (let i = 0; i < n; i++) { const k = key(i); if (!id.has(k)) { id.set(k, id.size); par.push(id.size - 1); } vid[i] = id.get(k); }
  const fd = x => { while (par[x] !== x) x = par[x] = par[par[x]]; return x; }; for (let t = 0; t < n; t += 3) { const a = fd(vid[t]); par[fd(vid[t + 1])] = a; par[fd(vid[t + 2])] = a; }
  const byR = new Map(); for (let t = 0; t < n; t += 3) { const r = fd(vid[t]); if (!byR.has(r)) byR.set(r, []); byR.get(r).push(t); }
  [...byR.values()].sort((a, b) => b.length - a.length).forEach((L, ci) => { const v = new Float32Array(L.length * 15); L.forEach((t, j) => { for (let q = 0; q < 3; q++) { v[j * 15 + q * 5] = P.getX(t + q); v[j * 15 + q * 5 + 1] = P.getY(t + q); v[j * 15 + q * 5 + 2] = P.getZ(t + q); } }); parts.push({ v, color: cols[ci % cols.length] }); }); });
await render(out, parts, { yaw: +(yaw || .6), pitch: +(pitch || .35) });
