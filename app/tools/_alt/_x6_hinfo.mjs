// X-6: Hände-FBX ansehen (Knochen, Animationen, Netze)
import fs from 'fs'; import * as THREE from 'three'; globalThis.self = globalThis; globalThis.window = globalThis;
const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js'); THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };
const b = fs.readFileSync(process.argv[2]); const o = new FBXLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o); console.log('box', bb.min.toArray().map(v => v.toFixed(2)), bb.max.toArray().map(v => v.toFixed(2)));
o.traverse(n => { const d = []; let p = n; while (p.parent) { d.push(0); p = p.parent; } if (n.isMesh) console.log(' '.repeat(d.length) + 'MESH', n.name, n.isSkinnedMesh, n.geometry.attributes.position.count, (n.geometry.index ? n.geometry.index.count : n.geometry.attributes.position.count) / 3, [].concat(n.material).map(m => m.name).join('|'));
  else console.log(' '.repeat(d.length) + (n.isBone ? 'BONE ' : 'NODE ') + n.name + ' pos ' + n.position.toArray().map(v => v.toFixed(2)).join(','), n.scale.x.toFixed(2)); });
for (const a of o.animations) console.log('ANIM', a.name, a.duration.toFixed(2), a.tracks.length);
