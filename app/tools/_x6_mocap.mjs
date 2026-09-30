// X-6: Rauch-Mocap (Klian, Rokoko, CC-BY) → Handkurven im Augenraum für kiffen.js (game/assets/ms/haende/rauchen.json)
// Je Bild: Handgelenk (m, relativ zum Kopf, Achsen: x rechts, y oben, −z vorn), Fingerrichtung f, Handflächen-Normale n, Beugung je Finger (0…1), Spreizung
// node tools/_x6_mocap.mjs [info]
import fs from 'fs'; import * as THREE from 'three'; globalThis.self = globalThis; globalThis.window = globalThis;
const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js'); THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };
const F = 'C:/Users/GIGABYTE/HAM_FabDownloads/v15_mocap/x/smoke/source/Anim_UE4_Smoking_01.fbx';
const b = fs.readFileSync(F); const o = new FBXLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
const B = {}; o.traverse(n => { B[n.name] = n; }); const clip = o.animations[0]; const mx = new THREE.AnimationMixer(o); mx.clipAction(clip).play();
const P = n => new THREE.Vector3().setFromMatrixPosition(B[n].matrixWorld);
const fps = 30, N = Math.floor(clip.duration * fps), out = { fps, n: N, R: [], L: [] }; const info = process.argv[2] === 'info';
// Maßstab: Mannequin in cm → Meter über die Handlänge (hand → middle_03) auf 0,17 m
mx.setTime(0); o.updateMatrixWorld(true); const hl = P('hand_r').distanceTo(P('middle_03_r')), S = .165 / hl;
const FING = ['thumb', 'index', 'middle', 'ring', 'pinky'], MAXB = [1.6, 2.6, 2.7, 2.7, 2.7];
for (let i = 0; i < N; i++) { mx.setTime(i / fps); o.updateMatrixWorld(true);
  // Kopf-Rahmen: rechts = Schulterlinie, oben = Welt-y (leicht nach dem Kopf geneigt), vorn = oben × rechts
  const head = P('head'), sr = P('upperarm_r'), sl = P('upperarm_l'); const right = sr.clone().sub(sl).setZ(0).normalize(), up = new THREE.Vector3(0, 0, 1), back = new THREE.Vector3().crossVectors(right, up).normalize(); // Mocap: z oben, cm
  const eye = head.clone().addScaledVector(back, -.09 / S).addScaledVector(up, .08 / S); // Augen ~9 cm vor und 8 cm über dem Kopfknochen
  const toEye = v => { const d = v.clone().sub(eye).multiplyScalar(S); return [+d.dot(right).toFixed(4), +d.dot(up).toFixed(4), +d.dot(back).toFixed(4)]; };
  const toDir = v => [+v.dot(right).toFixed(4), +v.dot(up).toFixed(4), +v.dot(back).toFixed(4)];
  for (const s of ['r', 'l']) { const h = P('hand_' + s), mid = P('middle_01_' + s), ix = P('index_01_' + s), pk = P('pinky_01_' + s);
    const f = mid.clone().sub(h).normalize(), lat = ix.clone().sub(pk).normalize(); let n = new THREE.Vector3().crossVectors(f, lat).normalize(); if (s === 'l') n.negate(); // Handflächen-Normale
    const c = FING.map((fg, k) => { const j1 = P(fg + '_01_' + s), j2 = P(fg + '_02_' + s), j3 = P(fg + '_03_' + s); const d0 = k === 0 ? j1.clone().sub(h).normalize() : j1.clone().sub(h).normalize(), d1 = j2.clone().sub(j1).normalize(), d2 = j3.clone().sub(j2).normalize();
      const bend = d0.angleTo(d1) + d1.angleTo(d2) * 1.7; return +Math.min(1, bend / MAXB[k]).toFixed(3); });
    const spread = +(P('index_02_' + s).distanceTo(P('pinky_02_' + s)) * S).toFixed(4);
    out[s.toUpperCase()].push({ w: toEye(h), f: toDir(f), n: toDir(n), c, sp: spread });
    // Zwischenraum Zeige-/Mittelfinger (wo der Joint klemmt)
    if (s === 'r') out.R[out.R.length - 1].j = toEye(P('index_02_r').add(P('middle_02_r')).multiplyScalar(.5));
  }
}
if (info) { for (let i = 0; i < N; i += 15) { const r = out.R[i], l = out.L[i]; const dr = Math.hypot(...r.w), dl = Math.hypot(...l.w); console.log((i / fps).toFixed(1).padStart(5), 'R', dr.toFixed(2), r.w.join(','), 'c', r.c.join(','), '| L', dl.toFixed(2), 'c', l.c.join(',')); } }
else { fs.mkdirSync('../game/assets/ms/haende', { recursive: true }); fs.writeFileSync('../game/assets/ms/haende/rauchen.json', JSON.stringify(out)); console.log('→ rauchen.json', N, 'Bilder'); }
