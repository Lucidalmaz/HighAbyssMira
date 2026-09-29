// Einmalig (W2-P7): reduziert den Birken-Scan (w_birke, ~270k Punkte) auf eine spielbare Stufe → w_birke/lod.glb
import { NodeIO } from '@gltf-transform/core';
import * as THREE from 'three';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const IN = '../game/assets/ms/w_birke/model.glb', OUT = '../game/assets/ms/w_birke/lod.glb', KEEP = +(process.argv[2] || .06);
const io = new NodeIO(), doc = await io.read(IN); let before = 0, after = 0; const t0 = Date.now();
for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
  const g = new THREE.BufferGeometry();
  for (const n of ['POSITION', 'NORMAL', 'TEXCOORD_0']) { const a = prim.getAttribute(n); if (a) g.setAttribute({ POSITION: 'position', NORMAL: 'normal', TEXCOORD_0: 'uv' }[n], new THREE.BufferAttribute(a.getArray().slice(), a.getElementSize())); }
  const idx = prim.getIndices(); if (idx) g.setIndex(new THREE.BufferAttribute(idx.getArray().slice(), 1));
  const n0 = g.attributes.position.count; before += n0;
  const m = mergeVertices(g.index ? g : g, 1e-5);
  const s = new SimplifyModifier().modify(m, Math.floor(m.attributes.position.count * (1 - KEEP)));
  const r = s.index ? s : mergeVertices(s, 1e-6); after += r.attributes.position.count;
  const mk = (arr, type) => doc.createAccessor().setType(type).setArray(arr);
  prim.setAttribute('POSITION', mk(new Float32Array(r.attributes.position.array), 'VEC3'));
  if (r.attributes.normal) { r.computeVertexNormals(); prim.setAttribute('NORMAL', mk(new Float32Array(r.attributes.normal.array), 'VEC3')); }
  if (r.attributes.uv) prim.setAttribute('TEXCOORD_0', mk(new Float32Array(r.attributes.uv.array), 'VEC2'));
  for (const k of prim.listSemantics()) if (!['POSITION', 'NORMAL', 'TEXCOORD_0'].includes(k)) prim.setAttribute(k, null);
  prim.setIndices(mk(new Uint32Array(r.index.array), 'SCALAR'));
  console.log(mesh.getName(), n0, '→', r.attributes.position.count, ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
for (const a of doc.getRoot().listAccessors()) if (!a.listParents().some(p => p.propertyType !== 'Root')) a.dispose();
await io.write(OUT, doc); console.log('fertig', before, '→', after);
