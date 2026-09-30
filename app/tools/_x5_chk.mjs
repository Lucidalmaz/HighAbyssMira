import fs from 'fs'; import * as THREE from 'three';
globalThis.self = globalThis; globalThis.window = globalThis;
const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
const b = fs.readFileSync('../game/assets/ms/beutel1/model.glb');
new GLTFLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '', g => {
  g.scene.traverse(o => { if (!o.isMesh) return; const G = o.geometry; console.log(o.type, o.name, Object.keys(G.attributes).map(k => k + ':' + G.attributes[k].constructor.name + ':' + G.attributes[k].itemSize + ':' + G.attributes[k].count + (G.attributes[k].normalized ? 'N' : '')), 'idx', G.index && G.index.count, o.position.toArray(), o.scale.toArray());
    const bb = new THREE.Box3().setFromObject(o); console.log(' box', bb.min.toArray().map(v => v.toFixed(3)), bb.max.toArray().map(v => v.toFixed(3))); }); }, e => console.log('err', e));
