// AP-MOCAP: Mocap-Dateien ansehen (Skelett, Clips, Länge, Bilder/s, Ruhepose, Wurzelbewegung). Aufruf: node tools/_mocap_info.mjs <fbx...> [--bones] [--rest]
import fs from 'fs'; import * as THREE from 'three'; import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
const args = process.argv.slice(2), files = args.filter(a => !a.startsWith('--')), BONES = args.includes('--bones'), REST = args.includes('--rest');
console.warn = () => {}; globalThis.window = globalThis; globalThis.self = globalThis; globalThis.document = { createElementNS: () => ({ style: {}, addEventListener() {}, removeEventListener() {}, setAttribute() {} }), createElement: () => ({ style: {}, getContext: () => null, addEventListener() {} }) };
const L = new FBXLoader();
for (const f of files) {
  let o; try { const b = fs.readFileSync(f); o = L.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), ''); } catch (e) { console.log('FEHLER', f, e.message); continue; }
  const bones = []; o.traverse(x => { if (x.isBone) bones.push(x); }); let meshes = 0; o.traverse(x => { if (x.isMesh) meshes++; });
  o.updateMatrixWorld(true); const bb = new THREE.Box3(); const v = new THREE.Vector3(); for (const b of bones) bb.expandByPoint(v.setFromMatrixPosition(b.matrixWorld));
  const A = o.animations || [];
  console.log('== ' + f.replace(/^.*[\\/]/, ''), '| Knochen', bones.length, '| Meshes', meshes, '| Höhe', (bb.max.y - bb.min.y).toFixed(1), '| scale', o.scale.x);
  for (const a of A) {
    const hipT = a.tracks.find(t => /(hips|pelvis|hip|root)[^.]*\.position$/i.test(t.name));
    let rm = '';
    if (hipT) { const n = hipT.values.length / 3, x0 = hipT.values[0], z0 = hipT.values[2], x1 = hipT.values[(n - 1) * 3], z1 = hipT.values[(n - 1) * 3 + 2], y0 = hipT.values[1]; rm = ` hip ${hipT.name.split('.')[0]} dXZ=${Math.hypot(x1 - x0, z1 - z0).toFixed(1)} (${(x1 - x0).toFixed(0)},${(z1 - z0).toFixed(0)}) y0=${y0.toFixed(1)}`; }
    const t0 = a.tracks[0]; const fps = t0 && t0.times.length > 1 ? (1 / (t0.times[1] - t0.times[0])).toFixed(0) : '?';
    console.log(`   clip "${a.name}" ${a.duration.toFixed(2)}s ${a.tracks.length} Spuren ~${fps} fps${rm}`);
  }
  if (BONES) { const top = bones.filter(b => !b.parent || !b.parent.isBone); const pr = (b, d) => { const p = v.setFromMatrixPosition(b.matrixWorld); console.log('   ' + '  '.repeat(d) + b.name + (REST ? `  @(${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)})` : '')); for (const c of b.children) if (c.isBone) pr(c, d + 1); }; top.forEach(b => pr(b, 0)); }
}
