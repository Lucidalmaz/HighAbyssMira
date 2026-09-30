// X-5: Rohmodelle ansehen (Dreiecke, Materialien, Größe)
import fs from 'fs'; import * as THREE from 'three';
globalThis.self = globalThis; globalThis.window = globalThis;
const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js'); const { OBJLoader } = await import('three/addons/loaders/OBJLoader.js');
THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };
for (const f of process.argv.slice(2)) {
  const buf = fs.readFileSync(f); let o;
  if (f.endsWith('.obj')) o = new OBJLoader().parse(buf.toString()); else o = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
  o.updateMatrixWorld(true); let tris = 0; const mats = new Set(), meshes = []; const bb = new THREE.Box3().setFromObject(o);
  o.traverse(m => { if (!m.isMesh) return; const g = m.geometry; const t = g.index ? g.index.count / 3 : g.attributes.position.count / 3; tris += t; [].concat(m.material).forEach(x => mats.add(x.name)); meshes.push(m.name + ':' + t + (g.attributes.uv ? '' : '(noUV)') + (g.groups.length > 1 ? ' groups' + g.groups.length : '')); });
  console.log(f, 'tris', tris, 'size', bb.getSize(new THREE.Vector3()).toArray().map(v => +v.toFixed(3)), 'mats', [...mats].join(','), '\n  ', meshes.slice(0, 40).join(' | '));
}
