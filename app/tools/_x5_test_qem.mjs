import fs from 'fs'; import * as THREE from 'three'; import { simplify, normals } from './_x5_qem.mjs'; import { render } from './_x5_render.mjs';
globalThis.self = globalThis; globalThis.window = globalThis;
const { OBJLoader } = await import('three/addons/loaders/OBJLoader.js');
const o = new OBJLoader().parse(fs.readFileSync('C:/Users/GIGABYTE/HAM_FabDownloads/v10/pouch/src/Merged_PolySphere5.obj').toString());
let g; o.traverse(m => { if (m.isMesh) g = m.geometry; });
const t0 = Date.now(); const r = simplify({ pos: g.attributes.position.array, uv: null, index: null }, +process.argv[2], { log: console.log }); console.log('s', (Date.now() - t0) / 1000);
const n = normals(r); const v = new Float32Array(n.index.length * 5); n.index.forEach((i, k) => { v[k * 5] = n.pos[i * 3]; v[k * 5 + 1] = n.pos[i * 3 + 1]; v[k * 5 + 2] = n.pos[i * 3 + 2]; });
await render(process.argv[3], [{ v, color: [170, 120, 80] }], { yaw: .5, pitch: .3 });
