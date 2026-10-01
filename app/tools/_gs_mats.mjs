// Gesichter (Q-6): Netze/Materialien/Texturgrößen eines GLB auflisten
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
for (const f of process.argv.slice(2)) { const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(f); console.log('==', f.split('/').pop());
  for (const m of doc.getRoot().listMeshes()) console.log('  ', m.getName(), m.listPrimitives().map(p => (p.getMaterial() && p.getMaterial().getName()) + ':' + (p.getIndices() ? p.getIndices().getCount() / 3 : 0)).join(' '));
  console.log('  anims', doc.getRoot().listAnimations().map(a => a.getName()).join(','), 'nodes', doc.getRoot().listNodes().length); }
