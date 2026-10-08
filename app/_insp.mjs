import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const id = process.argv[2], f = process.argv[3] || 'model.glb';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const d = await io.read(`game/assets/chars/${id}/${f}`);
const root = d.getRoot();
for (const n of root.listNodes()) { const m = n.getMesh(); if (!m) continue;
  for (const p of m.listPrimitives()) { const mat = p.getMaterial(); const pos = p.getAttribute('POSITION'); const mn = pos.getMin([]), mx = pos.getMax([]);
    console.log(n.getName().padEnd(26), 'mesh', m.getName().padEnd(22), 'mat', (mat&&mat.getName()||'-').padEnd(24), 'vtx', pos.getCount(), 'alpha', mat&&mat.getAlphaMode(), mat&&mat.getAlphaCutoff(), 'ds', mat&&mat.getDoubleSided(), 'min', mn.map(x=>x.toFixed(2)).join(','), 'max', mx.map(x=>x.toFixed(2)).join(','), 'skin', !!n.getSkin()); } }
console.log('--- materials');
for (const m of root.listMaterials()) { const t = x => x ? (x.getURI()||x.getName()||'tex')+':'+x.getMimeType()+':'+(x.getSize()||[]).join('x') : '-';
  console.log(m.getName().padEnd(26), 'base', t(m.getBaseColorTexture()), 'n', t(m.getNormalTexture()), 'mr', t(m.getMetallicRoughnessTexture()), 'occ', t(m.getOcclusionTexture()), 'em', t(m.getEmissiveTexture()), 'bc', m.getBaseColorFactor().map(x=>x.toFixed(2)).join(','), 'r', m.getRoughnessFactor().toFixed(2), 'a', m.getAlphaMode()); }
