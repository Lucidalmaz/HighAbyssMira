// AP-MOCAP: Knoten + Hierarchie einer beliebigen GLB (Pfad relativ zu app/)
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS); const doc = await io.read(process.argv[2]), R = doc.getRoot(); const joints = new Set(R.listSkins().flatMap(s => s.listJoints()));
const pr = (n, d) => { console.log('  '.repeat(d) + n.getName() + (joints.has(n) ? '' : ' [n]') + ' t=' + n.getTranslation().map(v => v.toFixed(3)) + ' r=' + n.getRotation().map(v => v.toFixed(3))); n.listChildren().forEach(c => pr(c, d + 1)); };
R.listScenes().forEach(s => s.listChildren().forEach(c => pr(c, 0))); console.log('anims', R.listAnimations().map(a => a.getName() + ':' + a.listChannels().length).join(' '));
