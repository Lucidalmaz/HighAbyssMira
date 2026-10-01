import fs from 'fs'; import * as THREE from 'three'; import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
globalThis.window = globalThis; globalThis.self = globalThis;
const buf = fs.readFileSync('../game/assets/ms/beobachter/model.glb'); const g = await new Promise((r, j) => new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', r, j));
g.scene.updateMatrixWorld(true); const M = []; g.scene.traverse(m => { if (m.isMesh) M.push(m); });
const pts = m => { const P = m.geometry.attributes.position, v = new THREE.Vector3(), out = []; for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); out.push([v.x, v.y, v.z]); } return out; };
const body = pts(M[1]), arm = pts(M[0]);
// Bein links: Mittelpunkt je Höhe
for (let y = 0; y < .13; y += .01) { const s = body.filter(p => p[1] >= y && p[1] < y + .01 && p[0] > 0); if (!s.length) continue; const c = [0, 2].map(k => s.reduce((a, p) => a + p[k], 0) / s.length); const zs = s.map(p => p[2]); console.log('legL', y.toFixed(2), s.length, 'cx', c[0].toFixed(3), 'cz', c[1].toFixed(3), 'z', Math.min(...zs).toFixed(3), Math.max(...zs).toFixed(3), 'x', Math.min(...s.map(p => p[0])).toFixed(3), Math.max(...s.map(p => p[0])).toFixed(3)); }
// Fuß unten: Umriss in z je x
const f = body.filter(p => p[1] < .02 && p[0] > 0); for (let x = .01; x < .12; x += .01) { const s = f.filter(p => p[0] >= x && p[0] < x + .01); if (s.length) console.log('foot x', x.toFixed(2), 'z', Math.min(...s.map(p => p[2])).toFixed(3), Math.max(...s.map(p => p[2])).toFixed(3)); }
// Hand rechts: unterhalb .17 Cluster
const h = arm.filter(p => p[0] < 0 && p[1] < .17); for (let y = .125; y < .17; y += .005) { const s = h.filter(p => p[1] >= y && p[1] < y + .005); if (s.length) console.log('hand', y.toFixed(3), s.length, 'x', Math.min(...s.map(p => p[0])).toFixed(3), Math.max(...s.map(p => p[0])).toFixed(3), 'z', Math.min(...s.map(p => p[2])).toFixed(3), Math.max(...s.map(p => p[2])).toFixed(3)); }
