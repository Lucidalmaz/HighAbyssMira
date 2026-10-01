// Q-1 · Der Geschälte Wolf: „Grimhound“ (DM-913, Fab, CC-BY) als gehäuteter Wolf – Maßstab (Meter), Knochennamen wie in three, eigene Clips mit den Namen,
// die hungrige.js/kapitel6.js schon benutzen (Rest, RestToGoBackUp, IdleAggressive, IdleBreathe, IdleLookAround, Walk, Run, JumpBite, Death).
// Eigenart gegenüber dem Hirschding: er ATMET (schwer, nass, sichtbar), er lahmt vorn rechts (alte Verletzung), er schnüffelt die Spur ab, er steht falsch herum auf (Becken zuerst, der Kopf hängt nach).
import fs from 'fs'; import path from 'path'; import * as THREE from 'three'; import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions'; import { prune } from '@gltf-transform/functions';
import { Rig, X, Y, Z, clamp, lerp, smooth, wob, foot, record, writeClips, film } from './kreaturen_rig.mjs';
export const WOLF_SRC = 'C:/Users/GIGABYTE/HAM_FabDownloads/v17_kreaturen/grimhound.glb'; const WS = .05, PI = Math.PI; // Schulterhöhe ~0,75 m, Länge mit Kopf ~1,9 m
const V = (x, y, z) => new THREE.Vector3(x, y, z), Q = new THREE.Quaternion(), E = new THREE.Euler();
export async function buildWolf() { const io = new NodeIO().registerExtensions(ALL_EXTENSIONS), doc = await io.read(WOLF_SRC), R = doc.getRoot();
  for (const n of R.listNodes()) { if (n.getName() === 'Object_18') { n.dispose(); continue; } n.setName(THREE.PropertyBinding.sanitizeNodeName(n.getName())); }
  R.listNodes().find(n => n.getName() === 'Sketchfab_model').setScale([WS, WS, WS]); for (const a of R.listAnimations()) a.dispose(); await doc.transform(prune()); return { io, doc }; }
const N = { pel: 'Pelvis_68', sp: 'Spine_49', to: 'Torso_48', ne: 'Neck_12', he: 'Head_11', t0: 'Tongue_6', t1: 'Tongue1_5', t2: 'Tongue2_4', eL: 'EarL_9', eR: 'EarR_10' };
for (const [s, a] of [['L', ['Upper_ArmL_24', 'ForearmL_23', 'HandL_22', 'ThighL_54', 'ShinL_53', 'FootL_52', 'Outter_ToeL_50', 'Inner_ToeL_51']], ['R', ['Upper_ArmR_38', 'ForearmR_37', 'HandR_36', 'ThighR_63', 'ShinR_62', 'FootR_61', 'Outter_ToeR_59', 'Inner_ToeR_60']]])
  ['ua', 'fa', 'ha', 'th', 'sh', 'fo', 'to1', 'to2'].forEach((k, i) => N[k + s] = a[i]);
function wPose(R, o) { const p0 = R.pos('pel', V()); R.move('pel', (o.px || 0) - p0.x, (o.py ?? .74) - p0.y, (o.pz ?? -.6) - p0.z);
  R.turn('pel', X, o.pitch || 0); R.turn('pel', Z, o.roll || 0); R.turn('pel', Y, o.yaw || 0);
  R.turn('sp', X, (o.bend || 0) * .5); R.turn('to', X, (o.bend || 0) * .5 + (o.sh || 0)); R.turn('to', Y, -(o.yaw || 0) * 1.4 + (o.tyaw || 0)); R.turn('to', Z, -(o.roll || 0) * .8);
  R.turn('ne', X, o.neck ?? .15); R.turn('ne', Y, (o.hyaw || 0) * .4);
  Q.setFromEuler(E.set(o.hp || 0, o.hyaw || 0, o.hr || 0, 'YXZ')); if (!o.headFree) R.setWorldQ('he', Q.multiply(R.restWorldQ('he'))); else { R.turn('he', X, o.hp || 0); R.turn('he', Z, o.hr || 0); }
  R.turn('t0', X, o.tongue ?? .2); R.turn('t1', X, (o.tongue ?? .2) * .8 + (o.drip || 0)); R.turn('t2', X, (o.tongue ?? .2) * .6 + (o.drip || 0) * 1.5);
  R.turn('eL', X, o.ears ?? .3); R.turn('eR', X, o.ears ?? .3); }
function wHind(R, s, T, o = {}) { const toe = R.b['to1' + s].position.clone().add(R.b['to2' + s].position).multiplyScalar(.5); const lf = R.len('fo' + s, toe), a = o.ma ?? .12; const d = V(0, -Math.cos(a), Math.sin(a)); const Hk = T.clone().addScaledVector(d, -lf);
  R.ik2('th' + s, 'sh' + s, 'fo' + s, Hk, V(0, 0, 1)); R.aim('fo' + s, toe, T); }
function wFront(R, s, W, o = {}) { R.ik2('ua' + s, 'fa' + s, 'ha' + s, W, V(o.out || 0, 0, -1)); Q.setFromAxisAngle(X, o.curl || 0); R.setWorldQ('ha' + s, Q.multiply(R.restWorldQ('ha' + s))); }
// Standort der Füße (Ruhe): Hinterzehen z −0,49, Hände (Handgelenk) z +0,39
const HZ = -.49, FZ = .39, HX = .145, FX = .28;
const wStand = (R, o = {}) => { wHind(R, 'L', V(HX, .033, HZ + (o.dz || 0))); wHind(R, 'R', V(-HX, .033, HZ - (o.dz || 0))); wFront(R, 'L', V(FX + (o.wide || 0), .036, FZ)); wFront(R, 'R', V(-FX - (o.wide || 0), .036, FZ + .04), { curl: o.lahm ?? .35 }); };
// Liegen wie tot: flach auf dem Bauch hingeworfen, Hinterläufe nach hinten gestreckt, Hände vorn, der Kopf seitlich auf dem Boden
function wLie(R, t = 0) { const tw = t > 3.1 && t < 3.25 ? .06 : 0; wPose(R, { py: .24, pz: -.62, roll: .22, bend: -.06, neck: .35, hp: .5, hr: .75, tongue: .6, ears: -.4 });
  wHind(R, 'L', V(HX + .08, .05, HZ - .42 + tw), { ma: 1.25 }); wHind(R, 'R', V(-HX - .05, .06, HZ - .38), { ma: 1.2 }); wFront(R, 'L', V(FX + .05, .04, FZ + .3), { curl: -.1 }); wFront(R, 'R', V(-FX - .1, .04, FZ + .15), { curl: .6 }); }
const WOLF = {
  // Liegt wie tot. Kein Atem. Ein Hinterlauf zuckt einmal.
  Rest: { dur: 6, loop: true, speed: 0, pose: (R, t) => wLie(R, t) },
  // Steht falsch herum auf: erst das Becken (wie an Fäden), die Vorderhände schleifen, der Kopf hängt – und rastet zuletzt ein.
  RestToGoBackUp: { dur: 1.9, loop: false, speed: 0, pose(R, t) { wLie(R); const A = R.capture(); R.reset(); const k1 = smooth(t / 1.1), k2 = smooth((t - .6) / .8), k3 = smooth((t - 1.45) / .2);
    wPose(R, { py: lerp(.4, .72, k1), pz: -.6, pitch: lerp(.3, 0, k2), neck: lerp(.85, .45, k3), hp: lerp(.8, .45, k3), hr: lerp(.8, 0, k3), headFree: 1, tongue: .5, ears: -.1 });
    wHind(R, 'L', V(HX, .033, HZ)); wHind(R, 'R', V(-HX, .033, HZ)); wFront(R, 'L', V(FX, .036 + .1 * (1 - k2), FZ - .2 * (1 - k2)), { curl: 1.2 * (1 - k2) }); wFront(R, 'R', V(-FX, .036, FZ - .25 * (1 - k2)), { curl: 1.4 * (1 - k2) + .35 * k2 });
    const B = R.capture(); R.mix(A, B, smooth(t / .5)); } },
  // Starrt: tief, Schultern hoch, Kopf gesenkt, schwerer nasser Atem (sichtbar in Rumpf und Hals), Zunge tropft.
  IdleAggressive: { dur: 4.8, loop: true, speed: 0, pose(R, t) { const b = Math.sin(t / 1.6 * 2 * PI), b2 = Math.max(0, Math.sin(t / 1.6 * 2 * PI + .4));
    wPose(R, { py: .66 - .012 * b, pz: -.62, pitch: .08, bend: .06 + .03 * b, sh: -.1 - .02 * b, neck: .5 + .03 * b, hp: .55 - .05 * b2, hyaw: .05 * wob(t * .5), tongue: .35, drip: .1 * b2, ears: -.35 });
    wStand(R, { wide: .05 }); } },
  IdleBreathe: { dur: 4.8, loop: true, speed: 0, pose(R, t) { const b = Math.sin(t / 2.4 * 2 * PI);
    wPose(R, { py: .7 - .008 * b, bend: .03 * b, sh: -.02 * b, neck: .25 + .02 * b, hp: .25, hyaw: .1 * wob(t * .4, 1), tongue: .25, drip: .05 * b }); wStand(R); } },
  // Spurensuche: die Nase am Boden, pendelt, schnaubt, hebt den Kopf, lauscht.
  IdleLookAround: { dur: 6, loop: true, speed: 0, pose(R, t) { const down = smooth(t / .6) * (1 - smooth((t - 4.2) / .6)), sw = Math.sin(t * 2.2) * down, sn = Math.sin(t * 14) * .02 * down;
    wPose(R, { py: .7 - .06 * down, pitch: .12 * down, neck: .2 + .55 * down, hp: .3 + .55 * down + sn, hyaw: .35 * sw + .4 * (1 - down) * Math.sin(t * .9), tongue: .2, ears: .3 - .5 * down }); wStand(R, { dz: .03 * sw }); } },
  // Schleichen: tief, ein Bein nach dem anderen (Seitenfolge), vorn rechts lahm – kürzerer Schritt, die Hand knickt ein, der Körper sackt darauf.
  Walk: { dur: 1.4, loop: true, speed: .8, pose(R, t) { const T = 1.4, v = .8; const L = { HL: { x: HX, z: HZ, off: 0, duty: .66, lift: .09 }, FL: { x: FX, z: FZ, off: .25, duty: .66, lift: .1 }, HR: { x: -HX, z: HZ, off: .5, duty: .66, lift: .09 }, FR: { x: -FX, z: FZ, off: .75, duty: .74, lift: .06 } };
    const F = {}; for (const k in L) F[k] = foot(L[k], t, T, v); const ph = t / T * 2 * PI, lahm = F.FR.c && F.FR.s < .3 ? 1 - F.FR.s / .3 : 0;
    wPose(R, { py: .66 + .012 * Math.sin(ph * 2) - .04 * lahm, pitch: .06 + .05 * lahm, roll: .05 * Math.sin(ph) - .06 * lahm, yaw: .05 * Math.sin(ph), bend: .05, neck: .45, hp: .5, hyaw: -.03 * Math.sin(ph), tongue: .3, drip: .08 * Math.sin(ph * 2), ears: -.3 });
    for (const s of ['L', 'R']) { const h = F['H' + s], f = F['F' + s]; wHind(R, s, V(h.x, .033 + h.y, h.z), { ma: .12 + .6 * h.lift }); wFront(R, s, V(f.x, .036 + f.y, f.z), { curl: (s === 'R' ? .45 : 0) + 1.3 * f.lift }); } } },
  // Galopp: Sprung-Galopp, der Rücken biegt und streckt sich, Kopf flach voraus.
  Run: { dur: .5, loop: true, speed: 6.5, pose(R, t) { const T = .5, v = 6.5; const L = { HL: { x: HX, z: HZ, off: 0, duty: .3, lift: .18 }, HR: { x: -HX, z: HZ, off: .08, duty: .3, lift: .18 }, FL: { x: FX * .8, z: FZ + .1, off: .5, duty: .28, lift: .22 }, FR: { x: -FX * .8, z: FZ + .1, off: .6, duty: .28, lift: .22 } };
    const F = {}; for (const k in L) F[k] = foot(L[k], t, T, v); const fl = Math.sin(t / T * 2 * PI);
    wPose(R, { py: .66 + .06 * Math.sin(t / T * 2 * PI + 1), pitch: -.08 * fl, bend: .15 * fl, neck: .35, hp: .35, tongue: .5, ears: -.6 });
    for (const s of ['L', 'R']) { const h = F['H' + s], f = F['F' + s]; wHind(R, s, V(h.x, .033 + h.y, h.z), { ma: .12 + .9 * h.lift }); wFront(R, s, V(f.x, .036 + f.y, f.z), { curl: 1.5 * f.lift }); } } },
  // Sprung mit Biss: duckt sich (0–0,35), schnellt 1,3 m vor und hoch, schnappt mit dem Kopf, landet schwer.
  JumpBite: { dur: 1.35, loop: false, speed: 0, pose(R, t) { const c = smooth(t / .3) * (1 - smooth((t - .3) / .08)), j = smooth((t - .33) / .4), air = Math.sin(PI * clamp((t - .33) / .42, 0, 1)), land = smooth((t - .75) / .15) * (1 - smooth((t - 1.05) / .3));
    const dz = 1.3 * j; wPose(R, { py: .7 - .2 * c + .45 * air - .12 * land, pz: -.6 + dz, pitch: -.3 * air + .15 * c + .1 * land, bend: .1 * c - .1 * air, neck: .3 - .3 * air, hp: .5 - .7 * air + .3 * land, tongue: .6, ears: -.8 });
    wHind(R, 'L', V(HX, .033 + .3 * air, HZ + dz * (t > .7 ? 1 : .3))); wHind(R, 'R', V(-HX, .033 + .3 * air, HZ + dz * (t > .7 ? 1 : .3)));
    wFront(R, 'L', V(FX, .036 + .5 * air, FZ + dz + .35 * air), { curl: .8 * air }); wFront(R, 'R', V(-FX, .036 + .5 * air, FZ + dz + .35 * air), { curl: .8 * air }); } },
  // Im Netz: bricht zusammen, windet sich, liegt.
  Death: { dur: 2.2, loop: false, speed: 0, pose(R, t) { wPose(R, { py: .66, neck: .45, hp: .5, tongue: .5 }); wStand(R); const A = R.capture(); R.reset(); wLie(R); const B = R.capture(); const k = smooth(t / .8), w = Math.sin(t * 17) * .08 * (1 - smooth((t - 1.2) / .8));
    R.mix(A, B, k); R.turn('ne', X, w); R.turn('sp', Z, w); } },
};
export async function wolfClips({ opt, toThree, OUT }) { const { io, doc } = await buildWolf(); const g = await toThree(io, doc), root = g.scene; root.updateMatrixWorld(true);
  const R = new Rig(root, N), only = opt('nur') ? String(opt('nur')).split(',') : null, clips = [], meta = {};
  for (const [k, c] of Object.entries(WOLF)) { if (only && !only.includes(k)) continue; clips.push(record(R, k, c.dur, 30, t => c.pose(R, t), { loop: c.loop, trans: ['pel'] })); meta[k] = { speed: c.speed, loop: c.loop, dur: c.dur }; }
  R.reset(); const bytes = writeClips(doc, clips); doc.getRoot().listScenes()[0].setExtras({ motion: meta, quelle: 'Grimhound (DM-913, Fab, CC-BY) · Clips AP Q-1' });
  const file = path.join(OUT, 'wolf_geschaelt.glb'); if (!only) { await io.write(file, doc); console.log('geschrieben', file, (fs.statSync(file).size / 1e6).toFixed(1) + ' MB, Clips', clips.length, (bytes / 1024 | 0) + ' KB'); }
  if (opt('film')) { const g2 = await toThree(io, doc); const cl = g2.animations.filter(a => !only || only.includes(a.name)); cl.forEach(a => a.userData = { speed: meta[a.name].speed }); const w = +(opt('w') || 230);
    console.log(await film(path.join(String(opt('film')), 'wolf.png'), g2.scene, null, cl, { n: +(opt('n') || 6), W: w, H: Math.round(w * .8), fit: { sc: w / 2.6 }, views: [['seite', PI / 2], ['schräg', .7]] })); } }
