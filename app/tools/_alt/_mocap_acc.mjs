// AP-MOCAP: ungenutzte Accessoren / Bewegungsgröße einer Figur prüfen
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const id of process.argv.slice(2)) { const doc = await io.read('../game/assets/chars/' + id + '/model.glb'), R = doc.getRoot(); let un = 0, ub = 0, ab = 0;
  for (const a of R.listAccessors()) { const p = a.listParents().filter(x => x.propertyType !== 'Root'); if (!p.length) { un++; ub += a.getByteLength(); } }
  for (const an of R.listAnimations()) for (const s of an.listSamplers()) { ab += s.getOutput().getByteLength(); } const ex = JSON.stringify(R.listScenes()[0].getExtras()).length;
  console.log(id, 'ungenutzt', un, (ub / 1024 | 0) + ' KB', 'Anim-Ausgaben', (ab / 1024 | 0) + ' KB', 'extras', (ex / 1024 | 0) + ' KB', 'Clips', R.listAnimations().length); }
