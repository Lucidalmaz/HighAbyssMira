// X-6: Hände-FBX als Bild (Ruhepose), optional nur Netze mit Namen
import fs from 'fs'; import * as THREE from 'three'; import { render, loadTex, partsOf } from './_x5_render.mjs'; globalThis.self = globalThis; globalThis.window = globalThis;
const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js'); THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };
const [f, out, yaw = 0, pitch = 0, only] = process.argv.slice(2); const b = fs.readFileSync(f); const o = new FBXLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
const T = await loadTex('C:/Users/GIGABYTE/HAM_FabDownloads/v11/haende/textures/Detective_Hands_diffuse.png', 1024);
if (only) o.traverse(m => { if (m.isMesh && !only.split(',').includes(m.name)) m.visible = false; });
const parts = []; o.updateMatrixWorld(true); o.traverse(m => { if (m.isMesh && m.visible) { const p = partsOf(m); for (const x of p) { x.tex = T; parts.push(x); } } });
await render(out, parts, { yaw: +yaw, pitch: +pitch });
