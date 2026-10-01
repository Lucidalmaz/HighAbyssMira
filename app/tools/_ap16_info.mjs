// AP-16: Rohmodelle ansehen (Meshes, Materialien, Maße, Dreiecke)
import fs from 'fs'; import * as THREE from 'three';
globalThis.self = globalThis; globalThis.window = globalThis;
const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');
THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };
for (const f of process.argv.slice(2)) {
  const buf = fs.readFileSync(f); const root = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), ''); root.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(root); console.log('==', f, 'bbox', bb.getSize(new THREE.Vector3()).toArray().map(v => v.toFixed(3)).join(' × '));
  root.traverse(o => { if (o.isMesh) { const g = o.geometry; const n = g.index ? g.index.count / 3 : g.attributes.position.count / 3; const b = new THREE.Box3().setFromObject(o);
    console.log('  mesh', o.name, 'tris', n | 0, 'mat', [].concat(o.material).map(m => m.name + (m.map ? '[map]' : '') + '#' + (m.color ? m.color.getHexString() : '')).join(','), 'size', b.getSize(new THREE.Vector3()).toArray().map(v => v.toFixed(3)).join('×'), 'uv', !!g.attributes.uv, 'col', !!g.attributes.color); } });
}
