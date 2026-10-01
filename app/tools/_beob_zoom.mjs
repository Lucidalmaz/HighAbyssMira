// R-21 Hilfsskript: Ausschnitt eines Modells rendern – node tools/_beob_zoom.mjs out.png x0 x1 y0 y1 z0 z1 yaw pitch [glb]
import fs from 'fs'; import * as THREE from 'three'; import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; import { render, partsOf } from './_x5_render.mjs';
globalThis.window = globalThis; globalThis.self = globalThis;
const a = process.argv.slice(2), [out] = a, [x0, x1, y0, y1, z0, z1, yaw, pitch] = a.slice(1, 9).map(Number), SRC = a[9] || '../game/assets/ms/beobachter/model.glb';
const buf = fs.readFileSync(SRC); const g = await new Promise((r, j) => new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', r, j));
const pal = [[220, 90, 90], [90, 200, 90], [90, 120, 230], [230, 200, 80], [200, 90, 220], [80, 210, 210], [240, 150, 60], [200, 200, 200]]; let i = 0; const parts = [];
g.scene.traverse(m => { if (!m.isMesh) return; const p = partsOf(m)[0], v = p.v, keep = []; for (let t = 0; t < v.length; t += 15) { let ok = true; for (let j = 0; j < 3; j++) { const x = v[t + j * 5], y = v[t + j * 5 + 1], z = v[t + j * 5 + 2]; if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1) ok = false; } if (ok) for (let j = 0; j < 15; j++) keep.push(v[t + j]); }
  if (keep.length) parts.push({ v: new Float32Array(keep), color: pal[i % pal.length] }); i++; });
await render(out, parts, { W: 600, H: 600, yaw, pitch });
