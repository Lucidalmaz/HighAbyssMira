// X-6: Hände posieren und als Bild ansehen (CPU-Skinning, Software-Renderer). node tools/_x6_hpose.mjs out.png pose.json [yaw] [pitch]
// pose.json: { "bones": { "R_HandIndex1": [rx, ry, rz], … }, "roots": { "R_ForeArm": { "p": [x,y,z], "r": [rx,ry,rz] } } } – Winkel in Grad, lokal zur Bindepose
import fs from 'fs'; import * as THREE from 'three'; import sharp from 'sharp'; import { NodeIO } from '@gltf-transform/core'; import { render } from './_x5_render.mjs';
const [out, poseF, yaw = 0, pitch = 0] = process.argv.slice(2); const pose = poseF && fs.existsSync(poseF) ? JSON.parse(fs.readFileSync(poseF, 'utf8')) : { bones: {}, roots: {} };
const doc = await new NodeIO().read('../game/assets/ms/haende/model.glb'); const R = doc.getRoot();
const skin = R.listSkins()[0], joints = skin.listJoints(); const bones = new Map();
for (const j of joints) { const b = new THREE.Bone(); b.name = j.getName(); b.position.fromArray(j.getTranslation()); b.quaternion.fromArray(j.getRotation()); bones.set(j, b); }
const root = new THREE.Group(); for (const j of joints) { const p = j.getParentNode(); const b = bones.get(j); if (p && bones.has(p)) bones.get(p).add(b); else root.add(b); }
const deg = Math.PI / 180, e = new THREE.Euler(), q = new THREE.Quaternion();
for (const [n, r] of Object.entries(pose.bones || {})) { const b = [...bones.values()].find(x => x.name === n); if (!b) { console.log('fehlt', n); continue; } q.setFromEuler(e.set(r[0] * deg, r[1] * deg, r[2] * deg)); b.quaternion.multiply(q); }
for (const [n, o] of Object.entries(pose.roots || {})) { const b = [...bones.values()].find(x => x.name === n); if (!b) continue; if (o.p) b.position.fromArray(o.p); if (o.r) b.quaternion.setFromEuler(e.set(o.r[0] * deg, o.r[1] * deg, o.r[2] * deg, 'YXZ')); }
root.updateMatrixWorld(true);
const mesh = R.listMeshes()[0], prim = mesh.listPrimitives()[0]; const P = prim.getAttribute('POSITION').getArray(), U = prim.getAttribute('TEXCOORD_0').getArray(), J = prim.getAttribute('JOINTS_0').getArray(), W = prim.getAttribute('WEIGHTS_0').getArray(), I = prim.getIndices().getArray();
const ibm = skin.getInverseBindMatrices().getArray(); const M = joints.map((j, k) => new THREE.Matrix4().multiplyMatrices(bones.get(j).matrixWorld, new THREE.Matrix4().fromArray(ibm, k * 16)));
const v = new THREE.Vector3(), acc = new THREE.Vector3(), sk = new Float32Array(P.length);
for (let i = 0; i < P.length / 3; i++) { acc.set(0, 0, 0); for (let k = 0; k < 4; k++) { const w = W[i * 4 + k]; if (!w) continue; v.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]).applyMatrix4(M[J[i * 4 + k]]); acc.addScaledVector(v, w); } sk[i * 3] = acc.x; sk[i * 3 + 1] = acc.y; sk[i * 3 + 2] = acc.z; }
const tb = prim.getMaterial().getBaseColorTexture(); const { data, info } = await sharp(Buffer.from(tb.getImage())).resize(1024, 1024).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const tv = new Float32Array(I.length * 5); for (let k = 0; k < I.length; k++) { const i = I[k]; tv[k * 5] = sk[i * 3]; tv[k * 5 + 1] = sk[i * 3 + 1]; tv[k * 5 + 2] = sk[i * 3 + 2]; tv[k * 5 + 3] = U[i * 2]; tv[k * 5 + 4] = 1 - U[i * 2 + 1]; } // Renderer liest v von unten
const parts = [{ v: tv, tex: { data, w: info.width, h: info.height, ch: info.channels } }];
// Achsen der Knochen (Bindepose) ausgeben
if (pose.axes) for (const n of pose.axes) { const b = [...bones.values()].find(x => x.name === n); const m = b.matrixWorld; const x = new THREE.Vector3(), y = new THREE.Vector3(), z = new THREE.Vector3(); m.extractBasis(x, y, z); console.log(n, 'pos', new THREE.Vector3().setFromMatrixPosition(m).toArray().map(a => a.toFixed(3)), 'X', x.normalize().toArray().map(a => a.toFixed(2)), 'Y', y.normalize().toArray().map(a => a.toFixed(2)), 'Z', z.normalize().toArray().map(a => a.toFixed(2))); }
await render(out, parts, { yaw: +yaw, pitch: +pitch, W: 900, H: 700 });
