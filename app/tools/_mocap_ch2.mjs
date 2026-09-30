// AP-MOCAP: Kanäle eines Clips zweier GLBs vergleichen
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS); const [a, b, clip] = process.argv.slice(2);
const ch = async f => { const d = await io.read(f); const an = d.getRoot().listAnimations().find(x => x.getName() === clip); return new Set(an.listChannels().map(c => c.getTargetNode().getName() + '.' + c.getTargetPath())); };
const A = await ch(a), B = await ch(b); console.log('nur A', [...A].filter(x => !B.has(x)).join(' ')); console.log('nur B', [...B].filter(x => !A.has(x)).join(' '));
