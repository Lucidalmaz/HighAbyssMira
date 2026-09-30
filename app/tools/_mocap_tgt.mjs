// AP-MOCAP: Ziel-Skelett einer fertigen Figur ansehen (game/assets/chars/<id>/model.glb). Aufruf (in app/): node tools/_mocap_tgt.mjs <id...>
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const id of process.argv.slice(2)) { const doc = await io.read('../game/assets/chars/' + id + '/model.glb'), R = doc.getRoot();
  const joints = new Set(R.listSkins().flatMap(s => s.listJoints()));
  const pr = (n, d) => { const j = joints.has(n); const t = n.getTranslation(); if (j || !n.getMesh()) console.log('  '.repeat(d) + n.getName() + (j ? '' : ' [node]') + ' t=' + t.map(v => v.toFixed(3)).join(',') + ' r=' + n.getRotation().map(v => v.toFixed(3)).join(',') + ' s=' + n.getScale().map(v => v.toFixed(3)).join(',')); n.listChildren().forEach(c => pr(c, d + 1)); };
  console.log('== ' + id, 'skins', R.listSkins().length, 'joints', joints.size, 'anims', R.listAnimations().map(a => a.getName() + ':' + a.listChannels().length).join(' '));
  for (const s of R.listScenes()) s.listChildren().forEach(c => pr(c, 0));
}
