// Gesichter (Q-6): Formen (Blendshapes) der CC-Quellen auflisten
import fs from 'fs'; import * as THREE from 'three'; import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
globalThis.window = globalThis; globalThis.self = globalThis; if (!globalThis.document) globalThis.document = { createElementNS: () => ({ style: {}, addEventListener() {}, removeEventListener() {}, setAttribute() {} }), createElement: () => ({ style: {}, getContext: () => null, addEventListener() {} }) };
console.warn = () => {};
const C = JSON.parse(fs.readFileSync('tools/cast.json', 'utf8'));
for (const k of process.argv.slice(2)) { const b = fs.readFileSync(new URL(C.src[k], new URL('file:///C:/Users/GIGABYTE/HighAbyssMira-Repo/app/tools/')));
  const root = new FBXLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
  root.traverse(o => { if (o.isMesh && o.morphTargetDictionary && /Body|EyeOcclusion|Eye$|Teeth/.test(o.name)) console.log(k, o.name, Object.keys(o.morphTargetDictionary).map(n => n.replace(/^.*\./, '')).join(' ')); }); }
