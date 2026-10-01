// R-21 · Der Beobachter: eigene Bewegungen (aufgenommen über das Rig, kreaturen_rig.mjs). Weltachsen: +z vorn, +y oben, +x seine linke Seite, Meter.
// Grundsätze (Dossier 82 §2/§3, CLAUDE.md §16/§19): klein, schnell, leise, mit Gewicht; Knie nie ganz durchgestreckt; Kopf wie bei einem Vogel (bleibt im Raum stehen,
// ruckt statt zu drehen – Blick/Neigung/Zittern legt das Spiel zur Laufzeit darüber); die Hände sind immer beschäftigt (Finger tasten, reiben, krallen).
// Übergänge macht das Spiel mit Federn, nie mit Gleiten: Abspieltempo der Gangarten = Wegtempo.
import * as THREE from 'three'; import { X, Y, Z, clamp, lerp, smooth, wob, foot } from './kreaturen_rig.mjs';
const V = (x, y, z) => new THREE.Vector3(x, y, z), PI = Math.PI, q1 = new THREE.Quaternion();
const achse = (R, k, lok) => lok.clone().applyQuaternion(R.b[k].getWorldQuaternion(q1)).normalize();
const SEITEN = [['L', 1], ['R', -1]];
// ---------------------------------------------------------------- Bausteine
// Rumpf: Becken verschieben/kippen, Wirbel beugen, Schultern heben, Hals/Kopf
function rumpf(R, J, o) { const b0 = R.pos('becken', V()); R.move('becken', (o.bx || 0), (o.by || 0), (o.bz || 0));
  R.turn('becken', X, o.kipp || 0); R.turn('becken', Z, o.roll || 0); R.turn('becken', Y, o.dreh || 0);
  R.turn('bauch', X, (o.beug || 0) * .45 + (o.atem || 0) * -.3); R.turn('brust', X, (o.beug || 0) * .55 + (o.atem || 0) * -.5); R.turn('brust', Z, -(o.roll || 0) * .8 + (o.croll || 0)); R.turn('brust', Y, -(o.dreh || 0) * .7 + (o.cdreh || 0));
  for (const [S, s] of SEITEN) { const h = (o.schulter || 0) + (o['schulter' + S] || 0); if (h) R.turn('schulter' + S, Z, s * h); }
  R.turn('hals', X, o.hals ?? 0); R.turn('hals2', X, (o.hals2 ?? 0)); R.turn('hals', Z, o.hroll || 0);
  // Kopf: Weltlage (Vogel: der Kopf bleibt im Raum, der Körper bewegt sich darunter) – Nicken/Neigen/Drehen
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(o.kx || 0, o.ky || 0, o.kz || 0, 'YXZ')); R.setWorldQ('kopf', q.multiply(R.restWorldQ('kopf')));
  R.turn('kehle', X, o.kehle || 0); for (const [S] of SEITEN) { R.turn('fuehler1' + S, X, o.fuehler || 0); R.turn('fuehler2' + S, X, (o.fuehler || 0) * .6); } }
// Bein: Knöchel nach Ziel (Welt), Knie nach vorn (leicht nach außen), Fuß zur Zehenspitze, Zehen krallen/abrollen
function bein(R, J, S, A, o = {}) { const s = S === 'L' ? 1 : -1; R.ik2('oberschenkel' + S, 'schienbein' + S, 'fuss' + S, A, V(s * (o.aus ?? .15), 0, 1));
  const zl = J['zehen' + S].clone().sub(J['fuss' + S]), Lz = Math.hypot(zl.y, zl.z), ang = (o.fuss ?? 0), dir = V(0, -Math.sin(Math.atan2(-zl.y, zl.z) + ang) , Math.cos(Math.atan2(-zl.y, zl.z) + ang)).applyAxisAngle(Y, o.gier || 0);
  R.aim('fuss' + S, 'zehen' + S, R.pos('fuss' + S, V()).addScaledVector(dir, Lz));
  const tip = J['zehenspitze' + S].clone().sub(J['zehen' + S]); const ta = Math.atan2(-tip.y, tip.z) + (o.zehen ?? 0) - ang; // + = Zehen nach unten (krallen), − = abrollen
  R.aimDir('zehen' + S, tip, V(0, -Math.sin(ta), Math.cos(ta)).applyAxisAngle(Y, o.gier || 0)); }
// Arm: Handgelenk nach Ziel, Ellenbogen nach hinten/außen; Hand zeigt in Richtung dir; Finger krümmen (k je Finger 0…1, Spreizen)
function arm(R, J, S, W, o = {}) { const s = S === 'L' ? 1 : -1; R.ik2('oberarm' + S, 'unterarm' + S, 'hand' + S, W, o.pol || V(s * .35, -.2, -1));
  if (o.dir) R.aimDir('hand' + S, 'finger2' + S, o.dir); finger(R, S, o.k ?? [.25, .3, .2], o.spreiz || 0); }
function haengen(R, J, S, o = {}) { const s = S === 'L' ? 1 : -1, sh = R.pos('oberarm' + S, V()), L1 = R.len('oberarm' + S, 'unterarm' + S), L2 = R.len('unterarm' + S, 'hand' + S);
  const d0 = J['hand' + S].clone().sub(J['oberarm' + S]).normalize(); // Ruhe-Richtung (Arme stehen etwas ab)
  const W = sh.clone().addScaledVector(d0, (L1 + L2) * .975).add(V(s * (o.aus ?? 0), 0, (o.vor ?? .01))); arm(R, J, S, W, { pol: V(s * .2, 0, -1), dir: V(s * (o.handAus ?? .12), -1, (o.handVor ?? .05)), k: o.k }); }
function finger(R, S, k, spreiz) { const s = S === 'L' ? 1 : -1;
  for (let f = 1; f <= 3; f++) { const ax = achse(R, 'hand' + S, V(0, 0, 1)), a = -s * (k[f - 1] ?? .3);
    R.turn('finger' + f + S, ax, a * .9); R.turn('finger' + f + S, achse(R, 'hand' + S, V(1, 0, 0)), (f - 2) * spreiz); R.turn('fingerB' + f + S, achse(R, 'finger' + f + S, V(0, 0, 1)), a * 1.2); } }
// Ruhe-Knöchel/Zehen
const FUSS = (J, S) => J['fuss' + S].clone();
// ---------------------------------------------------------------- Clips
export function clips(J) { const FL = FUSS(J, 'L'), FR = FUSS(J, 'R'), legL = J.oberschenkelL.y - J.fussL.y, armL = J.oberarmL.distanceTo(J.handL);
  const stand = (R, o, t = 0) => { // Grundhaltung: Knie weich, Becken tiefer, leicht nach vorn, Bauch vor
    rumpf(R, J, Object.assign({ by: -.012, kipp: .06, beug: .1, hals: -.12, hals2: .1, kx: .04 }, o));
    bein(R, J, 'L', FL.clone().add(V(o.fxL || 0, o.fyL || 0, o.fzL || 0)), { zehen: o.zL || 0, gier: .12 }); bein(R, J, 'R', FR.clone().add(V(o.fxR || 0, o.fyR || 0, o.fzR || 0)), { zehen: o.zR || 0, gier: -.12 }); };
  const C = {};
  // Stehen (12 s): Atmen (Brust und Kehle), Gewicht wandert, ein Knie gibt nach, die Finger einer Hand reiben aneinander, die andere Hand tastet ins Leere
  C.stehen = { dur: 12, loop: true, speed: 0, pose(R, t) { const T = 12, ph = t / T * 2 * PI, at = Math.sin(t / T * 2 * PI * 4.5), w = Math.sin(ph) * .5 + Math.sin(ph * 2 + 1) * .2, knie = smooth((t - 6.8) / .5) * (1 - smooth((t - 8.6) / .6));
    stand(R, { bx: .012 * w, by: -.012 - .006 * knie + .002 * at, roll: -.04 * w + .03 * knie, atem: .025 * at, kehle: .03 * at, croll: .02 * w, kx: .04, kz: .03 * w, fyR: .0, fzR: .004 * knie });
    const rb = (Math.sin(t * 9) * .5 + .5) * smooth((t - 2) / .4) * (1 - smooth((t - 4.2) / .4)), ta = smooth((t - 9.2) / .5) * (1 - smooth((t - 11) / .6));
    haengen(R, J, 'L', { vor: .02, k: [.25 + .35 * rb, .5 - .3 * rb, .35 + .2 * rb] }); haengen(R, J, 'R', { vor: .03 + .05 * ta, aus: .02, k: [.15 + .3 * ta * (Math.sin(t * 5) * .5 + .5), .2, .45] }); } };
  // Hocken (8 s): tief auf den Zehen, Knie vorn und weit, eine Hand am Boden, die andere vor der Brust, Kopf vorgeschoben (Gollum, Little Nightmares)
  C.hocken = { dur: 8, loop: true, speed: 0, pose(R, t) { const at = Math.sin(t / 8 * 2 * PI * 3.5), w = Math.sin(t / 8 * 2 * PI);
    rumpf(R, J, { by: -legL * .4, bz: -.01, kipp: .45, beug: .4, hals: -.5, hals2: .15, kx: .08, kz: .04 * w, atem: .03 * at, kehle: .04 * at, roll: .02 * w });
    bein(R, J, 'L', FL.clone().add(V(.025, .006, .015)), { aus: .6, fuss: -.25, zehen: .35, gier: .25 }); bein(R, J, 'R', FR.clone().add(V(-.025, .006, -.005)), { aus: .6, fuss: -.25, zehen: .35, gier: -.25 });
    arm(R, J, 'L', V(.06, .012, .13 + .005 * w), { pol: V(.6, 0, -1), dir: V(0, -1, .5), k: [.15, .1, .2], spreiz: .2 }); const hR = R.pos('brust', V()).add(V(-.035, -.02, .13));
    arm(R, J, 'R', hR, { pol: V(-.6, -.5, -1), dir: V(.3, -.2, 1), k: [.6, .7, .5] }); } };
  // Spähen (je Seite): Körper hinter der Deckung, der Oberkörper neigt sich zur Seite hinaus, nur Kopf und Schulter kommen vor; die Hand der Seite hält sich an der Kante fest
  for (const [S, s] of SEITEN) C['spaehen' + S] = { dur: 6, loop: true, speed: 0, pose(R, t) { const at = Math.sin(t / 6 * 2 * PI * 2.5), w = wob(t * .7, s), lean = .34 + .03 * w;
    stand(R, { bx: -s * .015, roll: -s * lean * .6, croll: -s * lean * .9, hroll: -s * lean * .3, beug: .14, kipp: .05, atem: .02 * at, kehle: .03 * at, kz: s * .1, kx: .05, fxL: s > 0 ? .01 : .03, fxR: s > 0 ? -.03 : -.01 });
    const brust = R.pos('brust', V()); arm(R, J, S, brust.clone().add(V(s * .115, .035 + .004 * w, .09)), { pol: V(s * .3, -1, -.4), dir: V(s * .1, .6, 1), k: [.8, .85, .75] }); // Hand an der Kante (Finger um die Kante)
    haengen(R, J, S === 'L' ? 'R' : 'L', { vor: .04, k: [.3, .4, .5] }); } };
  // Zucken: ertappt – Schultern hoch, Oberkörper zurück und weg, die Hände vor die Brust, dann halten (das Spiel lässt ihn danach verschwinden)
  C.zucken = { dur: .9, loop: false, speed: 0, pose(R, t) { const a = smooth(t / .12), b = smooth((t - .12) / .5);
    stand(R, { by: -.02 * a, bz: -.025 * a, kipp: -.12 * a + .05, beug: -.08 * a + .1 * b, schulter: .25 * a - .08 * b, hals: -.2 * a, kx: -.1 * a, kz: .12 * a * (1 - b * .5), fzL: -.01 * a, fzR: -.03 * a });
    const br = R.pos('brust', V()); for (const [S, s] of SEITEN) { if (a < .02) { haengen(R, J, S); continue; } const W0 = R.pos('hand' + S, V()); haengen(R, J, S); const H0 = R.pos('hand' + S, V()); R.reset; arm(R, J, S, H0.lerp(br.clone().add(V(s * .04, .015, .135)), a), { pol: V(s * .6, -1, -.6), dir: V(-s * .3, .7, .6), k: [.7 * a, .8 * a, .9 * a] }); } } };
  // Trippeln: kleine schnelle Schritte, vorgebeugt, Hände eng vor der Brust, das Becken sackt bei jedem Auftreten ein (Gewicht), der Kopf bleibt ruhig
  { const T = .32, v = .8; C.trippeln = { dur: T, loop: true, speed: v, pose(R, t) { const LL = { x: FL.x - .006, z: FL.z, off: 0, duty: .5, lift: .04 }, LR = { x: FR.x + .006, z: FR.z, off: .5, duty: .5, lift: .04 };
      const fL = foot(LL, t, T, v), fR = foot(LR, t, T, v), ph = t / T * 2 * PI, side = Math.sin(ph); const dip = Math.max(fL.c && fL.s < .25 ? 1 - fL.s / .25 : 0, fR.c && fR.s < .25 ? 1 - fR.s / .25 : 0);
      rumpf(R, J, { by: -.02 - .012 * dip + .006 * Math.abs(Math.cos(ph)), bx: .006 * side, bz: .015, kipp: .28, beug: .2, roll: .05 * side, dreh: .08 * Math.cos(ph), hals: -.3, hals2: .05, kx: .06, kz: -.02 * side, schulter: .06 });
      bein(R, J, 'L', V(fL.x, FL.y + fL.y, fL.z), { fuss: fL.c ? 0 : -.3 * fL.lift, zehen: fL.c ? .1 : .5 * fL.lift, gier: .1 }); bein(R, J, 'R', V(fR.x, FR.y + fR.y, fR.z), { fuss: fR.c ? 0 : -.3 * fR.lift, zehen: fR.c ? .1 : .5 * fR.lift, gier: -.1 });
      const br = R.pos('brust', V()); for (const [S, s] of SEITEN) { const sw = Math.sin(ph + (s > 0 ? PI : 0)) * .012; arm(R, J, S, br.clone().add(V(s * .05, -.035, .125 + sw)), { pol: V(s * .7, -1, -.5), dir: V(-s * .15, -.3, 1), k: [.55, .6, .5] }); } } }; }
  // Auf allen vieren: Becken hoch, Brust tief, Hände setzen vorn auf (Kreuzgang wie ein Kleinkind, aber viel zu schnell), Kopf hochgereckt und still
  { const T = .3, v = 1.5; C.vierbeinig = { dur: T, loop: true, speed: v, pose(R, t) { const HL = { x: FL.x + .01, z: FL.z - .03, off: 0, duty: .45, lift: .05 }, HR = { x: FR.x - .01, z: FR.z - .03, off: .5, duty: .45, lift: .05 },
      VL = { x: .07, z: .24, off: .5, duty: .45, lift: .06 }, VR = { x: -.07, z: .24, off: 0, duty: .45, lift: .06 }; const F = {}; for (const [k, L] of Object.entries({ HL, HR, VL, VR })) F[k] = foot(L, t, T, v);
      const ph = t / T * 2 * PI; rumpf(R, J, { by: -legL * .3 + .008 * Math.sin(ph * 2), bz: .02, kipp: 1.15, beug: .25, roll: .05 * Math.sin(ph), dreh: .06 * Math.sin(ph), hals: -1.1, hals2: -.2, kx: -.05, schulter: .12 });
      bein(R, J, 'L', V(F.HL.x, FL.y + F.HL.y, F.HL.z), { aus: .35, fuss: -.25, zehen: F.HL.c ? .5 : .2 }); bein(R, J, 'R', V(F.HR.x, FR.y + F.HR.y, F.HR.z), { aus: .35, fuss: -.25, zehen: F.HR.c ? .5 : .2 });
      for (const [S, s] of SEITEN) { const f = F['V' + S]; arm(R, J, S, V(f.x, .012 + f.y, f.z), { pol: V(s * .4, 0, -1), dir: V(0, -1, f.c ? .35 : .9), k: f.c ? [.05, .05, .05] : [.7, .7, .6], spreiz: f.c ? .25 : 0 }); } } }; }
  // Klettern (über Zaun/Fensterbrett, Kante .8 m, .25 m tief): ducken, springen, Hände an die Kante, hochziehen, Knie drauf, oben hocken
  { const H = .8, D = .25; C.klettern = { dur: 1.7, loop: false, speed: 0, wurzel: [0, H, D], pose(R, t) { const a = smooth(t / .22), j = smooth((t - .2) / .3), p = smooth((t - .5) / .55), k = smooth((t - .95) / .45), e = smooth((t - 1.35) / .35);
      const by = lerp(-legL * .35 * a, .45 * j, j) + (H - .45) * p + (-legL * .55 - (H - .45) * 0) * 0, bz = .08 * j + .12 * p + (D - .2) * k;
      rumpf(R, J, { by: lerp(by, H - legL * .55, e), bz: lerp(bz, D - .02, e), kipp: lerp(.3 * a + .2 * j + .5 * p - .3 * k, .5, e), beug: .3 + .1 * p, hals: lerp(-.4, -.5, e), kx: .1 - .2 * j + .1 * k, schulter: .2 * p * (1 - k) });
      const kante = V(0, H, .14); for (const [S, s] of SEITEN) { const hand = kante.clone().add(V(s * .06, .01, 0)); if (t < .3) haengen(R, J, S, { vor: .08 * a }); else arm(R, J, S, hand.lerp(V(s * .05, H + .012, D + .08), e), { pol: V(s * .5, -.3, -1), dir: V(0, -1, .6), k: [.85, .9, .85] }); }
      const fy = lerp(0, H + .01, smooth((t - .55) / .5)), fz = lerp(0, D, smooth((t - .6) / .6)); bein(R, J, 'L', V(FL.x + .02, FL.y + lerp(0, fy, smooth((t - .3) / .3)), lerp(FL.z, fz, smooth((t - .5) / .5))), { aus: .5, fuss: -.4 * p, zehen: .4 });
      bein(R, J, 'R', V(FR.x - .02, FR.y + lerp(0, fy, smooth((t - .65) / .4)), lerp(FR.z - .02, fz - .02, smooth((t - .7) / .5))), { aus: .5, fuss: -.4 * p, zehen: .4 }); } }; }
  // Ohren zuhalten: geduckt, Kopf gesenkt, beide Hände an die Kopfseiten (gesetzte Sichtung o.ohren)
  C.ohren = { dur: 3, loop: true, speed: 0, pose(R, t) { const z = Math.sin(t * 31) * .004 + Math.sin(t * 17) * .003; stand(R, { by: -.05, kipp: .25, beug: .35, schulter: .2, hals: -.35, kx: .45 + z, kz: z });
    const kp = R.pos('kopf', V()); for (const [S, s] of SEITEN) arm(R, J, S, kp.clone().add(V(s * .1, .06, .02)), { pol: V(s * 1, -.6, -.3), dir: V(-s * .4, 1, .2), k: [.4, .45, .4], spreiz: .2 }); } };
  // Ablegen: ein Bonbon/Zettel wird mit drei Fingern auf den Boden gelegt, sehr sorgfältig; dann richtet er sich auf
  C.ablegen = { dur: 2.2, loop: false, speed: 0, pose(R, t) { const d = smooth(t / .6) * (1 - smooth((t - 1.4) / .6)), g = smooth((t - .6) / .3) * (1 - smooth((t - 1.2) / .2));
    stand(R, { by: -legL * .45 * d, bz: -.02 * d, kipp: .45 * d, beug: .35 * d, hals: -.3 * d, kx: .25 * d, fzR: -.03 * d });
    arm(R, J, 'L', lerp(0, 1, d) > .01 ? V(.03, lerp(.18, .015, d), lerp(.03, .13, d)) : V(.05, .18, .03), { pol: V(.6, 0, -1), dir: V(0, -1, .4), k: [.35 - .3 * g, .4 - .35 * g, .5 - .4 * g], spreiz: .15 * g }); haengen(R, J, 'R', { vor: .05 * d, k: [.6, .6, .5] }); } };
  return C; }
