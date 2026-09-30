// AP-MOCAP: Prüfung aller gebackenen Bewegungen ohne Grafikkarte – je Figur und Clip (10 Bilder/s):
//   Boden: tiefster Hautpunkt unter 0 (Einsinken) · Knie: nach vorn durchgebogen (Überstreckung) · Ellbogen: nach hinten überstreckt
//   Handgelenk: Verdrehung der Hand gegenüber dem Unterarm um dessen Achse (klassischer Übertragungsfehler) · Rutschen (motion.slide)
// Aufruf (in app/): node tools/mocap_check.mjs <id …|all> [--clips=a,b]
import fs from 'fs'; import * as THREE from 'three'; import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
globalThis.window = globalThis; globalThis.self = globalThis;
const args = process.argv.slice(2), only = (args.find(a => a.startsWith('--clips=')) || '').slice(8).split(',').filter(Boolean);
const C = JSON.parse(fs.readFileSync('tools/cast.json', 'utf8')), ids = args.filter(a => !a.startsWith('--'));
const list = ids[0] === 'all' ? Object.keys(C.mocap.figs) : ids, io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const RE = { lUp: /^(l_thigh|thigh_stretchl|leftupleg)$/, lLeg: /^(l_calf|leg_stretchl|leftleg)$/, lFoot: /^(l_foot|footl|leftfoot)$/, rUp: /^(r_thigh|thigh_stretchr|rightupleg)$/, rLeg: /^(r_calf|leg_stretchr|rightleg)$/, rFoot: /^(r_foot|footr|rightfoot)$/,
  lArm: /^(l_upperarm|arm_stretchl|leftarm)$/, lFore: /^(l_forearm|forearm_stretchl|leftforearm)$/, lHand: /^(l_hand|handl|lefthand)$/, rArm: /^(r_upperarm|arm_stretchr|rightarm)$/, rFore: /^(r_forearm|forearm_stretchr|rightforearm)$/, rHand: /^(r_hand|handr|righthand)$/, hips: /^(hip|hips|rootx)$/, head: /^(head|headx)$/ };
const v = new THREE.Vector3(), W = o => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld), Q = o => { const q = new THREE.Quaternion(); o.matrixWorld.decompose(new THREE.Vector3(), q, new THREE.Vector3()); return q; };
const report = [];
// Kniewinkel mit Vorzeichen: > 0 = Unterschenkel nach vorn (Überstreckung), Bezug Querachse aus Oberschenkel × Vorwärts
const kneeSigned = (U, L, F, fwd) => { const a1 = W(L).sub(W(U)).normalize(), a2 = W(F).sub(W(L)).normalize(), c = new THREE.Vector3().crossVectors(a1, a2), side = new THREE.Vector3().crossVectors(a1, fwd); if (side.lengthSq() < 1e-6) return 0; return Math.asin(Math.min(1, c.length())) * Math.sign(c.dot(side)); };
for (const id of list) { const doc = await io.read(/[/]/.test(id) ? id : '../game/assets/chars/' + id + '/model.glb'); for (const t of doc.getRoot().listTextures()) t.dispose(); for (const e of doc.getRoot().listExtensionsUsed()) if (/basisu|webp/i.test(e.extensionName)) e.dispose();
  const bin = await io.writeBinary(doc), g = await new Promise((res, rej) => new GLTFLoader().parse(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), '', res, rej)), root = g.scene, motion = root.userData.motion || {};
  const B = {}; root.traverse(o => { const n = o.name.replace(/^mixamorig/i, '').replace(/_\d+$/, '').toLowerCase(); for (const k in RE) if ((!B[k] || (o.isBone && !B[k].isBone)) && RE[k].test(n)) B[k] = o; });
  const meshes = []; root.traverse(o => { if (o.isSkinnedMesh && o.visible) meshes.push(o); }); const mx = new THREE.AnimationMixer(root); root.updateMatrixWorld(true);
  // Ruhe: Handverdrehung = 0; Knie-/Ellbogenebene
  const rest = {}, restKnee = {}; for (const s of ['l', 'r']) { if (B[s + 'Fore'] && B[s + 'Hand']) rest[s] = Q(B[s + 'Fore']).invert().multiply(Q(B[s + 'Hand'])); if (B[s + 'Up'] && B[s + 'Leg'] && B[s + 'Foot']) restKnee[s] = kneeSigned(B[s + 'Up'], B[s + 'Leg'], B[s + 'Foot'], new THREE.Vector3(0, 0, 1)); }
  for (const clip of g.animations) { if (only.length && !only.includes(clip.name)) continue; mx.stopAllAction(); const a = mx.clipAction(clip); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.reset().play();
    let minY = Infinity, knee = 0, elbow = 0, twist = 0, headLow = 0, hipMin = Infinity;
    for (let t = 0; t <= clip.duration + 1e-6; t += .1) { mx.setTime(Math.min(t, clip.duration)); root.updateMatrixWorld(true);
      for (const m of meshes) { const n = m.geometry.attributes.position.count; for (let i = 0; i < n; i += 23) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); if (v.y < minY) minY = v.y; } }
      if (B.head && B.hips) { const hy = W(B.hips).y, dy = W(B.head).y - hy; hipMin = Math.min(hipMin, hy); if (dy < 0) headLow = Math.max(headLow, -dy); }
      const hq = B.hips ? Q(B.hips) : new THREE.Quaternion(), fwd = new THREE.Vector3(0, 0, 1), left = new THREE.Vector3(1, 0, 0); // Körperachsen (Figur schaut nach +z)
      for (const s of ['l', 'r']) { const U = B[s + 'Up'], L = B[s + 'Leg'], F = B[s + 'Foot'];
        if (U && L && F) { const sg = kneeSigned(U, L, F, fwd) - (restKnee[s] || 0); if (sg > .17) knee = Math.max(knee, sg); } // Überstreckung gegenüber der Ruhehaltung
        const A = B[s + 'Arm'], E = B[s + 'Fore'], H = B[s + 'Hand'];
        if (A && E && H && rest[s]) { const r = Q(E).invert().multiply(Q(H)).multiply(rest[s].clone().invert()); const ax = W(H).sub(W(E)).normalize().applyQuaternion(Q(E).invert()); const pr = ax.dot(new THREE.Vector3(r.x, r.y, r.z)); const tw = 2 * Math.atan2(Math.abs(pr), Math.abs(r.w)); twist = Math.max(twist, tw); } } }
    const m = motion[clip.name] || {}, flags = [];
    const STAND = /^(idle\d?|walk.*|run.*|look|nervous|alert|talk.*|listen|turn_.*|window.*|phone|winken|nick|kopfschuetteln|z_idle\d?|z_walk|z_run)$/.test(clip.name);
    if (!STAND) knee = 0; if (headLow > .05) flags.push('KOPFÜBER'); if (STAND && hipMin < .35 * (root.userData.h || 1.2)) flags.push('Becken tief ' + hipMin.toFixed(2) + ' m');
    if (minY < -.03) flags.push('sinkt ' + (minY * 100).toFixed(0) + ' cm'); if (knee > .17) flags.push('Knie vorn ' + (knee * 57.3).toFixed(0) + '°'); if (twist > 1.75) flags.push('Handgelenk ' + (twist * 57.3).toFixed(0) + '°'); if (m.slide > .12 && m.rm === 'lin') flags.push('rutscht ' + m.slide.toFixed(2));
    report.push([id, clip.name, flags.join(', ')]); }
  const bad = report.filter(r => r[0] === id && r[2]); console.log(id + ': ' + g.animations.length + ' Clips, auffällig ' + bad.length + (bad.length ? ' → ' + bad.map(r => r[1] + ' (' + r[2] + ')').join('; ') : '')); }
fs.writeFileSync('C:/Users/GIGABYTE/_mocap/check.json', JSON.stringify(report));
