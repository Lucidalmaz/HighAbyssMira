import fs from 'fs'; import * as THREE from 'three'; import { render, loadTex, partsOf } from './_x5_render.mjs';
globalThis.self = globalThis; globalThis.window = globalThis;
const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');
THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };
const [src, texf, out, yaw, pitch] = process.argv.slice(2);
const buf = fs.readFileSync(src); const o = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
const T = texf && texf !== '-' ? await loadTex(texf) : null;
await render(out, partsOf(o, () => T), { yaw: +(yaw || .6), pitch: +(pitch || .35) });
