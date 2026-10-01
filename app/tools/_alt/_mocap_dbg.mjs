// AP-MOCAP: Ziel-Körperachsen einer Figur ausgeben (Fehlersuche)
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions'; import * as THREE from 'three';
import { buildTarget } from './mocap_bake.mjs'; import { canonMap, family, bodyFrame } from './mocap.mjs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const id of process.argv.slice(2)) { const doc = await io.read('../game/assets/chars/' + id + '/model.glb'), T = buildTarget(doc), fam = family(T.root), m = canonMap(T.root, fam);
  const w = k => m.has(k) ? new THREE.Vector3().setFromMatrixPosition(m.get(k).matrixWorld).toArray().map(v => v.toFixed(2)).join(',') + ' ' + m.get(k).name : '-';
  const f = bodyFrame(m, false), f2 = bodyFrame(m); console.log(id, fam, 'up', f.up.toArray().map(v => v.toFixed(2)), 'left', f.left.toArray().map(v => v.toFixed(2)), 'snap', f2.up.toArray(), f2.left.toArray());
  for (const k of ['Hips', 'Spine', 'Spine2', 'Neck', 'Head', 'LeftUpLeg', 'RightUpLeg', 'LeftFoot', 'LeftArm']) console.log('   ', k, w(k)); }
