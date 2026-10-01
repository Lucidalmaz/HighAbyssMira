// Q-1 Kreaturen backen: Modell vorbereiten (Skelett/Maßstab/Richtung), eigene Clips aus Gang-/IK-Beschreibungen aufnehmen, ins GLB schreiben, Filmstreifen zeichnen.
// Aufruf (in app/): node tools/kreaturen.mjs hirschding|wolf [--film=Ordner] [--nur=clip,clip] [--gewichte]
// Danach: node tools/ktx.mjs (komprimierte Texturen für das Spiel).
import fs from 'fs'; import path from 'path'; import * as THREE from 'three'; import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { NodeIO } from '@gltf-transform/core'; import { cloneDocument } from '@gltf-transform/functions'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { Rig, X, Y, Z, clamp, lerp, smooth, frac, wob, foot, record, writeClips, film } from './kreaturen_rig.mjs';
import { buildHirschding } from './kreaturen_hirschding.mjs';
import { buildWolf, wolfClips } from './kreaturen_wolf.mjs';
globalThis.window = globalThis; globalThis.self = globalThis;
const args = process.argv.slice(2), opt = k => { const a = args.find(x => x === '--' + k || x.startsWith('--' + k + '=')); return a ? (a.split('=')[1] ?? true) : null; };
const OUT = path.resolve('..', 'game', 'assets', 'ms', 'wendigo'); const PI = Math.PI;
export async function toThree(io, doc) { const d2 = cloneDocument(doc); for (const t of d2.getRoot().listTextures()) t.dispose(); for (const e of d2.getRoot().listExtensionsUsed()) if (/basisu|webp|texture_transform/i.test(e.extensionName)) e.dispose();
  const bin = await io.writeBinary(d2); return await new Promise((res, rej) => new GLTFLoader().parse(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), '', res, rej)); }
const V = (x, y, z) => new THREE.Vector3(x, y, z), Q = new THREE.Quaternion(), E = new THREE.Euler();
// ======================================================================================= HIRSCHDING
// Aufrecht auf den Hinterläufen („ein Hirsch auf zwei Beinen“), Vorderläufe hängen wie zu lange Arme; zum Sturm fällt es auf alle viere.
// Gemeinsame Sprache: kein Atem (Brust steht), Zucken statt Mikrobewegung, Kopf wie aufgesteckt (stabil, dreht ohne den Hals), Gelenke, die falsch knicken können.
function hdPose(R, o) { // o: Körperhaltung
  const hip0 = R.pos('hips', V()); R.move('hips', (o.hx || 0) - hip0.x, (o.hy ?? 1.2) - hip0.y, (o.hz || 0) - hip0.z);
  R.turn('hips', X, -(o.th ?? 1.15)); R.turn('hips', Z, o.roll || 0); R.turn('hips', Y, o.yaw || 0);
  const b = o.bend ?? .12; R.turn('spine1', X, b * .6 + (o.b1 || 0)); R.turn('spine2', X, b + (o.b2 || 0)); R.turn('chest', X, b * .8 + (o.b3 || 0)); R.turn('chest', Y, -(o.yaw || 0) * 1.6 + (o.cyaw || 0)); R.turn('chest', Z, -(o.roll || 0) * 1.3 + (o.croll || 0));
  // Hals: Kopfpunkt vor der Brust (Schädel „aufgesteckt“), Hals im Bogen nach oben
  const c = R.pos('neck1', V()), f = V(0, 0, 1).applyAxisAngle(Y, (o.yaw || 0) * .4 + (o.hyaw || 0) * .5); const H = c.clone().addScaledVector(f, o.nf ?? .42).add(V(0, o.nu ?? .3, 0));
  R.ik2('neck1', 'neck2', 'head', H, V(0, 1, -.25).add(f.clone().multiplyScalar(-.3)));
  // Kopf: Weltdrehung (Blick), unabhängig vom Körper; Ruhe = Schnauze 29° abwärts
  Q.setFromEuler(E.set(o.hp || 0, (o.hyaw || 0), o.hr || 0, 'YXZ')); R.setWorldQ('head', Q.multiply(R.restWorldQ('head')));
  R.turn('jaw', X, -(o.jaw || 0));
  R.turn('tail', X, o.tail ?? .3);
}
const HD_LEGS = s => ({ th: 'thigh' + s, sh: 'shin' + s, me: 'meta' + s, ho: 'hhoof' + s, ar: 'arm' + s, fo: 'fore' + s, ca: 'cannon' + s, fh: 'hoof' + s, sc: 'scap' + s });
function hdLeg(R, s, F, o = {}) { // Hinterlauf: Fessel F (Welt), Mittelfuß-Neigung ma (rad, + = Sprunggelenk hinter der Fessel), invers = Knie nach hinten
  const L = HD_LEGS(s), lm = R.len(L.me, L.ho), ma = o.ma ?? .32; const d = V(0, -Math.cos(ma), Math.sin(ma)).applyAxisAngle(Y, o.yaw || 0); const Hk = F.clone().addScaledVector(d, -lm);
  R.ik2(L.th, L.sh, L.me, Hk, V(0, 0, o.inv ? -1 : 1).applyAxisAngle(Y, o.yaw || 0).add(V(s === 'L' ? .15 : -.15, 0, 0))); R.aim(L.me, L.ho, F);
  const tipL = new THREE.Vector3(-.0, -.137, .03); const pa = o.pa ?? -.35; const T = F.clone().add(V(0, -Math.cos(pa) * .14, Math.sin(-pa) * .14 + .02).applyAxisAngle(Y, o.yaw || 0)); if (o.flat) T.y = Math.max(0, T.y);
  R.aim(L.ho, tipL, T); }
function hdArmHang(R, s, o = {}) { // Vorderlauf als Arm: hängt, pendelt; o.sw Pendel (rad), o.fw vor, o.out seitlich
  const L = HD_LEGS(s), sg = s === 'L' ? 1 : -1, sw = o.sw || 0, fw = o.fw ?? .12, out = o.out ?? .1;
  R.aimDir(L.ar, L.fo, V(sg * out, -1, fw + sw)); R.aimDir(L.fo, L.ca, V(sg * out * .5, -1, fw + .28 + sw * 1.3 + (o.el || 0))); R.aimDir(L.ca, L.fh, V(0, -1, fw + .12 + sw * 1.5 + (o.wr || 0))); R.aimDir(L.fh, V(.008 * sg, -.169, -.106), V(0, -1, -.25 + sw + (o.fi || 0))); }
function hdArmTo(R, s, P, o = {}) { // Vorderlauf zum Punkt (Huf am Boden = Vierbeiner) · Ellenbogen nach hinten, Karpus nach vorn
  const L = HD_LEGS(s), lc = R.len(L.ca, L.fh), ca = o.ca ?? -.12; const d = V(0, -Math.cos(ca), Math.sin(ca)); const C = P.clone().addScaledVector(d, -lc);
  R.ik2(L.ar, L.fo, L.ca, C, V(0, 0, -1)); R.aim(L.ca, L.fh, P); R.aimDir(L.fh, V(.008, -.169, -.106), V(0, -.85 + (o.fl || 0), -.53)); }
function hdArmAt(R, s, P, o = {}) { // Vorderlauf zu einem Punkt in der Luft (Huf vors Gesicht, greifen): Oberarm nur mäßig heben (sonst reißt die Brust), Unterarm + Röhrbein greifen
  const L = HD_LEGS(s), sg = s === 'L' ? 1 : -1; R.aimDir(L.ar, L.fo, o.up || V(sg * .25, -.55, 1)); R.ik2(L.fo, L.ca, L.fh, P, o.pole || V(0, -1, -.4)); R.aimDir(L.fh, V(.008 * sg, -.169, -.106), o.dir2 || V(0, 1, .6)); }
const HD = {
  // Stehen: kein Atem. Nur Zucken, ein Gewichtswechsel, der Kopf rastet einmal schief ein und wieder zurück, der Kiefer klappt einmal.
  stehen: { dur: 8, loop: true, speed: 0, pose(R, t) { const k = Math.sin(t / 8 * 2 * PI), tw = t > 2.3 && t < 3.6 ? 1 : 0, tick = t > 6.2 && t < 6.35 ? 1 : 0;
    hdPose(R, { hx: .035 * k, hy: 1.19 - .01 * Math.abs(k), th: 1.12, roll: .025 * k, hr: tw * .32, hp: .05 * tw, hyaw: .05 * Math.sin(t / 8 * 4 * PI), jaw: t > 5.1 && t < 5.3 ? .22 : .04 });
    hdLeg(R, 'L', V(.17 + .01 * k, .137, .08)); hdLeg(R, 'R', V(-.17 + .01 * k, .137, .02)); hdArmHang(R, 'L', { sw: .02 * k, fi: tick * .6 }); hdArmHang(R, 'R', { sw: -.02 * k }); } },
  // Gehen: aufrecht, zwei Tritte je Schritt (der Fuß setzt in der Mitte kurz auf), das Gewicht fällt auf das Standbein, der Kopf bleibt stehen wie bei einem Vogel.
  gehen: { dur: 1.3, loop: true, speed: 1.2, pose(R, t) { const T = 1.3, v = 1.2, LL = { x: .17, z: .12, off: 0, duty: .58, lift: .16 }, LR = { x: -.17, z: .12, off: .5, duty: .58, lift: .16 };
    const fL = foot(LL, t, T, v, { hitch: 1 }), fR = foot(LR, t, T, v, { hitch: 1 }); const ph = t / T * 2 * PI, side = Math.sin(ph); // + = links trägt
    const dip = (fL.c && fL.s < .18 ? 1 - fL.s / .18 : 0) + (fR.c && fR.s < .18 ? 1 - fR.s / .18 : 0);
    hdPose(R, { hx: .05 * side, hy: 1.17 - .05 * dip, hz: .02, th: 1.08, roll: .06 * side, yaw: .07 * Math.cos(ph), bend: .14, hyaw: -.07 * Math.cos(ph) * .3, jaw: .05 });
    hdLeg(R, 'L', V(fL.x, .137 + fL.y, fL.z), { ma: .32 + .35 * fL.lift, pa: -.35 - .8 * fL.lift }); hdLeg(R, 'R', V(fR.x, .137 + fR.y, fR.z), { ma: .32 + .35 * fR.lift, pa: -.35 - .8 * fR.lift });
    hdArmHang(R, 'L', { sw: -.16 * Math.sin(ph - .6) }); hdArmHang(R, 'R', { sw: .16 * Math.sin(ph - .6) }); } },
  // Lauern: geduckt, weit vorgebeugt, der Schädel tief vor der Brust, lange Pausen zwischen den Schritten.
  lauern: { dur: 2.4, loop: true, speed: .55, pose(R, t) { const T = 2.4, v = .55, LL = { x: .19, z: .25, off: 0, duty: .78, lift: .1 }, LR = { x: -.19, z: .25, off: .5, duty: .78, lift: .1 };
    const fL = foot(LL, t, T, v), fR = foot(LR, t, T, v), ph = t / T * 2 * PI, side = Math.sin(ph);
    hdPose(R, { hx: .04 * side, hy: .98, hz: .02, th: .62, roll: .04 * side, bend: .22, nf: .5, nu: -.02, hp: .12 + .04 * Math.sin(ph * 2), jaw: .1, tail: .5 });
    hdLeg(R, 'L', V(fL.x, .137 + fL.y, fL.z), { ma: .45 + .3 * fL.lift }); hdLeg(R, 'R', V(fR.x, .137 + fR.y, fR.z), { ma: .45 + .3 * fR.lift });
    hdArmHang(R, 'L', { fw: .3, sw: -.06 * side, el: .1 }); hdArmHang(R, 'R', { fw: .3, sw: .06 * side, el: .1 }); } },
  // Sturm: fällt auf alle viere und springt (Vorderläufe zusammen, Hinterläufe zusammen), Rücken beugt und streckt sich, Geweih voran.
  sturm: { dur: .62, loop: true, speed: 4.6, pose(R, t) { const T = .62, v = 4.6, ph = t / T;
    const legs = { HL: { x: .15, z: .02, off: 0, duty: .34, lift: .22 }, HR: { x: -.15, z: .02, off: .06, duty: .34, lift: .22 }, VL: { x: .17, z: 1.05, off: .48, duty: .32, lift: .3 }, VR: { x: -.17, z: 1.05, off: .55, duty: .32, lift: .3 } };
    const F = {}; for (const k in legs) F[k] = foot(legs[k], t, T, v); const flex = Math.sin(ph * 2 * PI);
    hdPose(R, { hy: 1.12 + .08 * Math.sin(ph * 2 * PI + 1.2), hz: -.05, th: .1 + .12 * flex, bend: -.04 - .1 * flex, nf: .55, nu: -.12, hp: .35, jaw: .18, tail: .7 - .3 * flex });
    for (const s of ['L', 'R']) { const f = F['H' + s]; hdLeg(R, s, V(f.x, .137 + f.y, f.z), { ma: .3 + .5 * f.lift, pa: -.35 - .6 * f.lift }); const g = F['V' + s]; hdArmTo(R, s, V(g.x, .13 + g.y, g.z), { ca: -.1 - 1.2 * g.lift }); } } },
  // Flucht rückwärts: geduckt, die Knie knicken falsch herum (nach hinten), die Vorderläufe vor dem Gesicht.
  flucht: { dur: .66, loop: true, speed: -3.2, pose(R, t) { const T = .66, v = -3.2, LL = { x: .2, z: .05, off: 0, duty: .45, lift: .2 }, LR = { x: -.2, z: .05, off: .5, duty: .45, lift: .2 };
    const fL = foot(LL, t, T, v), fR = foot(LR, t, T, v), ph = t / T * 2 * PI, side = Math.sin(ph), jolt = Math.abs(Math.sin(ph));
    hdPose(R, { hx: .07 * side, hy: 1.02 - .06 * jolt, hz: .1, th: .95, roll: .1 * side, b1: -.1, b2: -.15, bend: .05, nf: .2, nu: .38, hp: -.55, hyaw: .25 * side, hr: .2 * side, jaw: .45, tail: .9 });
    hdLeg(R, 'L', V(fL.x, .137 + fL.y, fL.z), { ma: -.5 - .3 * fL.lift }); hdLeg(R, 'R', V(fR.x, .137 + fR.y, fR.z), { ma: -.5 - .3 * fR.lift });
    hdArmHang(R, 'L', { sw: .35 * side - .2, out: .35, el: .3 }); hdArmHang(R, 'R', { sw: -.35 * side - .2, out: .35, el: .3 }); } },
  // Zurückweichen vor dem Licht: Ruck nach hinten, EIN Vorderlauf vors Gesicht (eine menschliche Bewegung), ein Schritt zurück, dann sinkt der Arm.
  zurueck: { dur: 1.8, loop: false, speed: 0, pose(R, t) { const a = smooth(t / .18), up = smooth((t - .05) / .3) * (1 - smooth((t - 1.3) / .5)), st = smooth((t - .25) / .45);
    hdPose(R, { hy: 1.19 - .1 * a + .06 * st, hz: -.12 * a - .2 * st, th: 1.12 + .22 * a - .1 * st, b2: -.12 * a, b3: -.1 * a, hp: -.2 * a + .25 * up, hyaw: -.5 * up, hr: -.25 * up, jaw: .3 * a * (1 - st * .6), tail: .6 });
    hdLeg(R, 'L', V(.17, .137, .08)); const zR = lerp(.02, -.42, st), lift = Math.sin(PI * clamp((t - .25) / .45, 0, 1)) * .14; hdLeg(R, 'R', V(-.17, .137 + lift, zR), { ma: .32 + lift * 2 });
    const hd = R.pos('head', V()); const tgt = hd.clone().add(V(.02, .02, .3)); const P0 = R.pos('cannonL', V()); if (up > .01) hdArmAt(R, 'L', P0.lerp(tgt, up), { up: V(.2, -.55 + .5 * up, 1), dir2: V(-.5, .5, .6) }); else hdArmHang(R, 'L');
    hdArmHang(R, 'R', { sw: -.2 * a, out: .2 }); } },
  // Aufstieg aus dem Haufen: liegt wie ein nasser Sack, das Becken kommt zuerst, dann der Rücken, Arme zuletzt, der Kopf rastet ein.
  aufstieg: { dur: 3.2, loop: false, speed: 0, pose(R, t) { const a = smooth(t / 1.1), b = smooth((t - .8) / 1.2), c = smooth((t - 1.8) / .9), d = smooth((t - 2.6) / .25);
    const hy = lerp(.32, lerp(.8, 1.19, b), a), th = lerp(-.05, 1.12, b); hdPose(R, { hy, hz: lerp(-.3, 0, b), th, bend: lerp(.5, .12, c), nf: lerp(.2, .42, c), nu: lerp(-.5, .3, c), hp: lerp(.9, 0, d), hr: lerp(.5, 0, d), jaw: lerp(.3, .04, c) });
    hdLeg(R, 'L', V(.2, .137, lerp(.35, .08, a)), { ma: lerp(1.3, .32, a) }); hdLeg(R, 'R', V(-.2, .137, lerp(.3, .02, a)), { ma: lerp(1.3, .32, a) });
    if (c < .99) { for (const s of ['L', 'R']) { const sg = s === 'L' ? 1 : -1, P = V(.3 * sg, .13, lerp(.9, .5, b)); if (c < .01) hdArmTo(R, s, P, { ca: -.8 }); else { const h0 = R.pos('cannon' + s, V()); hdArmHang(R, s, { fw: lerp(.8, .12, c) }); } } } else { hdArmHang(R, 'L'); hdArmHang(R, 'R'); } } },
  // Schrei: der Hals streckt sich, der Kopf fliegt zurück, der Kiefer hängt weit offen, die Arme gehen auseinander.
  schrei: { dur: 2.2, loop: false, speed: 0, pose(R, t) { const a = smooth(t / .35) * (1 - smooth((t - 1.6) / .6)), sh = Math.sin(t * 38) * .03 * a;
    hdPose(R, { hy: 1.19 + .05 * a, th: 1.12 + .15 * a, b3: -.15 * a, nf: .42 - .1 * a, nu: .3 + .25 * a, hp: -.7 * a + sh, hr: sh, jaw: .04 + .7 * a });
    hdLeg(R, 'L', V(.17, .137, .08)); hdLeg(R, 'R', V(-.17, .137, .02)); hdArmHang(R, 'L', { out: .1 + .6 * a, fw: .12 + .2 * a }); hdArmHang(R, 'R', { out: .1 + .6 * a, fw: .12 + .2 * a }); } },
  // Packen (Tod): Satz nach vorn, beide Vorderläufe greifen, der Schädel stößt herab.
  packen: { dur: 1.1, loop: false, speed: 0, pose(R, t) { const a = smooth(t / .25), b = smooth((t - .2) / .3);
    hdPose(R, { hy: 1.19 - .15 * a, hz: .25 * a, th: 1.12 - .45 * a, b3: .2 * b, nf: .42 + .25 * b, nu: .3 - .5 * b, hp: .6 * b, jaw: .04 + .6 * a });
    hdLeg(R, 'L', V(.17, .137, .08 + .3 * a)); hdLeg(R, 'R', V(-.17, .137, .02), { ma: .32 + .3 * a });
    for (const s of ['L', 'R']) { const sg = s === 'L' ? 1 : -1, hd = R.pos('head', V()); hdArmAt(R, s, hd.clone().add(V(.25 * sg, -.45, .35 * b + .15)), { up: V(sg * .3, -.4 + .3 * b, 1), pole: V(sg * .5, -1, -.3), dir2: V(0, -.6, 1) }); } } },
};
async function hirschding() {
  const file = path.join(OUT, 'hirschding_rig.glb'); const { doc, io } = await buildHirschding(null);
  const g = await toThree(io, doc); const root = g.scene; root.updateMatrixWorld(true);
  const names = {}; root.traverse(o => { if (o.isBone) names[o.name] = o.name; }); const R = new Rig(root, names);
  const only = opt('nur') ? String(opt('nur')).split(',') : null, clips = [], meta = {};
  for (const [k, c] of Object.entries(HD)) { if (only && !only.includes(k)) continue; clips.push(record(R, k, c.dur, 30, t => c.pose(R, t), { loop: c.loop, trans: ['hips'] })); meta[k] = { speed: c.speed, loop: c.loop, dur: c.dur }; }
  R.reset(); const bytes = writeClips(doc, clips); const SC = .88; doc.getRoot().listNodes().find(n => n.getName() === 'Hirschding').setScale([SC, SC, SC]); for (const k in meta) meta[k].speed = +(meta[k].speed * SC).toFixed(3); // aufrecht ~2,7 m bis zu den Geweihspitzen
  const sc = doc.getRoot().listScenes()[0]; sc.setExtras({ motion: meta, quelle: 'Deer Thing (Sketchfab, CC-BY) · Skelett/Clips AP Q-1' });
  if (!only) { await io.write(file, doc); console.log('geschrieben', file, (fs.statSync(file).size / 1e6).toFixed(1) + ' MB, Clips', clips.length, (bytes / 1024 | 0) + ' KB'); }
  if (opt('film')) { const g2 = await toThree(io, doc); const r2 = g2.scene; const cl = g2.animations.filter(a => !only || only.includes(a.name)); cl.forEach(a => a.userData = { speed: meta[a.name].speed });
    let colorOf = null; if (opt('gewichte')) { const pal = {}; let i = 0; colorOf = (m, vi) => { const j = m.geometry.attributes.skinIndex.getX(vi), n = m.skeleton.bones[j].name; if (!pal[n]) { const h = (i++ * .618) % 1, c = new THREE.Color().setHSL(h, .7, .6); pal[n] = [c.r * 255, c.g * 255, c.b * 255]; console.log('Farbe', n, '#' + c.getHexString()); } return pal[n]; }; }
    const out = await film(path.join(String(opt('film')), 'hirschding' + (opt('gewichte') ? '_gew' : '') + '.png'), r2, null, cl, { n: +(opt('n') || 7), W: +(opt('w') || 230), H: +(opt('w') || 230) * 1.3, fit: { sc: +(opt('w') || 230) * 1.3 * .8 / 3.1 }, colorOf, views: opt('vorn') ? [['vorn', 0], ['schräg hinten', 2.4]] : [['seite', PI / 2], ['schräg', .7]] }); console.log(out); }
}
async function wolf() { await wolfClips({ opt, toThree, OUT }); }
const cmd = args[0]; if (cmd === 'hirschding') await hirschding(); else if (cmd === 'wolf') await wolf(); else console.log('Aufruf: node tools/kreaturen.mjs hirschding|wolf [--film=Ordner] [--nur=a,b] [--gewichte]');
