// Poly-Haven-Modelle (CC0, https://polyhaven.com) → game/assets/ms/ph_<id>/model.glb (ein GLB, Texturen eingebettet, unbenutzte Teile entfernt)
//   node tools/ph_pack.mjs <Quellordner mit <id>/model.gltf> <id> [<id> ...]
import fs from 'fs'; import path from 'path';
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions'; import { prune, dedup } from '@gltf-transform/functions';
const [SRC, ...ids] = process.argv.slice(2); const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const id of ids) {
  const doc = await io.read(path.join(SRC, id, 'model.gltf')); await doc.transform(prune(), dedup());
  let t = 0; for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) t += (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
  const out = path.resolve('..', 'game', 'assets', 'ms', 'ph_' + id); fs.mkdirSync(out, { recursive: true });
  const info = path.join(SRC, id, 'info.json'); if (fs.existsSync(info)) fs.copyFileSync(info, path.join(out, 'info.json'));
  await io.write(path.join(out, 'model.glb'), doc);
  const tex = doc.getRoot().listTextures().map(x => { const s = x.getSize(); return s ? s.join('x') : '?'; });
  console.log(id, 'Dreiecke', Math.round(t), 'KB', (fs.statSync(path.join(out, 'model.glb')).size / 1024) | 0, 'Texturen', tex.join(' '), 'Meshes', doc.getRoot().listMeshes().length);
}
