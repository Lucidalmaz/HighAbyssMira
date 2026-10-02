// AP-MOCAP: Kanäle (Zielknoten) der Bewegungen einer Figur auflisten
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const id of process.argv.slice(2)) { const doc = await io.read('../game/assets/chars/' + id + '/model.glb'), R = doc.getRoot(); const a = R.listAnimations()[1] || R.listAnimations()[0];
  console.log('== ' + id, a.getName(), a.listChannels().map(c => c.getTargetNode().getName() + '.' + c.getTargetPath()[0] + ':' + c.getSampler().getInput().getCount() + ':' + c.getSampler().getOutput().getComponentType()).join(' '));
  let bytes = 0; for (const an of R.listAnimations()) for (const s of an.listSamplers()) bytes += s.getOutput().getByteLength() + s.getInput().getByteLength(); console.log('  anim bytes', bytes);
}
