// Q-6: prüft, was gltfpack mit den Gesichtsnetzen macht
import { execFileSync } from 'child_process'; import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS), f = process.argv[2], tmp = process.argv[3], r = process.argv[4] || '0.5';
const info = d => d.getRoot().listMeshes().map(m => m.getName() + ':' + m.listPrimitives().map(p => (p.getIndices() ? p.getIndices().getCount() / 3 : 0) + (p.listTargets().length ? 'T' + p.listTargets().length : '')).join('/')).join(' ');
console.log('vorher', info(await io.read(f)));
execFileSync('npx.cmd', ['-y', 'gltfpack@0.21.0', '-i', f, '-o', tmp, '-si', r, '-kn', '-km'], { stdio: 'inherit', shell: true });
console.log('nachher', info(await io.read(tmp)));
