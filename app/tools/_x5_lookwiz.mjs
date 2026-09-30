import fs from 'fs'; import * as THREE from 'three'; import { render, loadTex, partsOf } from './_x5_render.mjs';
globalThis.self = globalThis; globalThis.window = globalThis;
const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');
THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };
const [out, yaw, pitch] = process.argv.slice(2), D = 'C:/Users/GIGABYTE/HAM_FabDownloads/v10/wizbp/';
const buf = fs.readFileSync(D + 'source/Backpack.fbx'); const o = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
const texs = {}; for (const f of fs.readdirSync(D + 'textures')) { const m = f.match(/^Rucksack_(.+)_Albedo\.png$/); if (m) texs[m[1].toLowerCase().replace(/[^a-z]/g, '')] = D + 'textures/' + f; }
const cache = {}; const names = new Set(); o.traverse(m => { if (m.isMesh) for (const mt of [].concat(m.material)) names.add(mt.name); }); console.log([...names].join(' | ')); console.log(Object.keys(texs).join(' '));
for (const n of names) { const k = n.toLowerCase().replace(/[^a-z]/g, ''); const f = texs[k] || texs[Object.keys(texs).find(x => k.includes(x) || x.includes(k))]; if (f) cache[n] = await loadTex(f, 512); }
await render(out, partsOf(o, m => cache[[].concat(m.material)[0].name] || null), { yaw: +yaw, pitch: +pitch });
