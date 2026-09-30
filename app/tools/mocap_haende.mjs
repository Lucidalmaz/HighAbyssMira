// AP-MOCAP: Finger- und Handgelenk-Bewegung aus echter Handschuh-Aufnahme (Rokoko „Anim_UE4_Smoking_01“, Unreal-4-Skelett, CC-BY)
// auf die Ich-Hände (assets/ms/haende = Detective_Hands, Tony Flanagan) übertragen → game/assets/anim/haende_rauchen.json
//   · je Fingergelenk (Daumen/Zeige/Mittel/Ring/Klein 1–3) + Handgelenk die LOKALE Drehung im Skelett der Ich-Hände (Quaternion x,y,z,w)
//   · Übertragung im Handraum: Drehung jedes Fingerglieds gegenüber der Hand (Ruhe → Bild) wird über die Handachsen (Handrücken quer, Richtung Mittelfinger) in die Zielhand umgerechnet;
//     unterschiedliche Ruhe-Fingerhaltungen gleicht die Gliedrichtung aus → keine verdrehten Finger.
//   · posen: benannte Haltungen (Mittel über kurze Fenster der Aufnahme) · kurven.rauchen: ganze Aufnahme mit 15 Bildern/s, 16-Bit-Werte (Base64, Int16 / 32767)
// Aufruf (in app/): node tools/mocap_haende.mjs   → Hilfe im Spiel: figuren_handPose(hands, pose, gewicht, { seite, t, handgelenk })
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url'; import * as THREE from 'three';
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { bindRest, canonMap, family } from './mocap.mjs'; import { loadSrc, buildTarget } from './mocap_bake.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(HERE, '..', '..', 'game', 'assets', 'anim', 'haende_rauchen.json');
const FING = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'], JOINTS = ['Hand', ...FING.flatMap(f => [1, 2, 3].map(i => f + i))];
const S = loadSrc('u_smoke'), clip = S.anims[0], sm = canonMap(S.root, S.fam);
const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(path.resolve(HERE, '..', '..', 'game', 'assets', 'ms', 'haende', 'model.glb')), T = buildTarget(doc);
const tb = {}; T.root.traverse(o => { const m = o.name.match(/^([LR])_(Hand|ForeArm|HandThumb[123]|HandIndex[123]|HandMiddle[123]|HandRing[123]|HandPinky[123])$/); if (m) tb[(m[1] === 'L' ? 'Left' : 'Right') + m[2].replace(/^Hand(?=.)/, 'Hand')] = o; });
const tname = (side, j) => side + (j === 'Hand' ? 'Hand' : 'Hand' + j), wq = o => { const q = new THREE.Quaternion(); o.matrixWorld.decompose(new THREE.Vector3(), q, new THREE.Vector3()); return q; }, wp = o => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
// Handbasis (in Weltlage): x quer (Zeige→Klein), y längs (Handgelenk→Mittelfinger), z Handflächen-Normale
const basis = (get, side) => { const h = wp(get(side + 'Hand')), m = wp(get(side + 'HandMiddle1')), i = wp(get(side + 'HandIndex1')), p = wp(get(side + 'HandPinky1'));
  const y = m.sub(h).normalize(), x = p.sub(i); x.addScaledVector(y, -x.dot(y)).normalize(); const z = new THREE.Vector3().crossVectors(x, y); return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); };
T.root.updateMatrixWorld(true); S.root.updateMatrixWorld(true);
const res = { fps: 15, gelenke: JOINTS, quelle: 'Anim_UE4_Smoking_01 (Klian/Rokoko, CC-BY) → Detective_Hands', ruhe: {}, posen: {}, kurven: {} };
const prep = {};
for (const side of ['Left', 'Right']) { const K = side[0];
  const Bs = basis(k => sm.get(k), side), Bt = basis(k => tb[k], side); // Handachsen beider Skelette
  // Zielhand-Ruhe: Glieder relativ zur Hand (Weltdrehungen), Quelle-Ruhe (Bindepose) ebenso; Richtungsangleich je Glied im gemeinsamen Handraum
  const HsI = Bs.clone().invert(), HtI = Bt.clone().invert(), rel0s = {}, rel0t = {}, A = {};
  for (const j of JOINTS) { const n = tname(side, j); if (!sm.has(n) || !tb[n]) continue; rel0s[j] = HsI.clone().multiply(wq(sm.get(n))); rel0t[j] = HtI.clone().multiply(wq(tb[n]));
    const ch = j === 'Hand' ? null : j.replace(/\d$/, d => +d + 1); const cn = ch && tname(side, ch);
    const a = new THREE.Quaternion(); if (ch && /[12]$/.test(j) && sm.has(cn) && tb[cn]) { const ds = wp(sm.get(cn)).sub(wp(sm.get(n))).applyQuaternion(HsI).normalize(), dt = wp(tb[cn]).sub(wp(tb[n])).applyQuaternion(HtI).normalize(); a.setFromUnitVectors(dt, ds); }
    else if (/3$/.test(j)) { const j2 = j.replace(/3$/, '2'); if (A[j2]) a.copy(A[j2]); } A[j] = a; }
  res.ruhe[K] = JOINTS.map(j => tb[tname(side, j)] ? tb[tname(side, j)].quaternion.toArray().map(v => +v.toFixed(5)) : null);
  prep[side] = { Bs, Bt, HsI, HtI, rel0s, rel0t, A }; }
// Abtasten
const mixer = new THREE.AnimationMixer(S.root), act = mixer.clipAction(clip); act.setLoop(THREE.LoopOnce, 1); act.clampWhenFinished = true; act.play();
const N = Math.floor(clip.duration * res.fps), frames = { L: [], R: [] };
const fore = { Left: tb.LeftForeArm, Right: tb.RightForeArm };
for (let f = 0; f < N; f++) { mixer.setTime(f / res.fps); S.root.updateMatrixWorld(true);
  for (const side of ['Left', 'Right']) { const K = side[0], Pp = prep[side], Hs = basis(k => sm.get(k), side), row = [];
    const handRel = {}; // Zieldrehung je Glied relativ zur (Ziel-)Handbasis
    for (const j of JOINTS) { const n = tname(side, j); if (!Pp.rel0s[j]) { row.push(null); continue; }
      const relS = Hs.clone().invert().multiply(wq(sm.get(n))), D = relS.multiply(Pp.rel0s[j].clone().invert()); // Drehung im Quell-Handraum (Basisachsen)
      handRel[j] = D.multiply(Pp.A[j]).multiply(Pp.rel0t[j]); }
    for (const j of JOINTS) { const b = tb[tname(side, j)]; if (!handRel[j] || !b) { row.push(null); continue; }
      let local; if (j === 'Hand') local = b.quaternion.clone(); // Handgelenk unten gesondert
      else { const par = j.endsWith('1') ? 'Hand' : j.replace(/\d$/, d => d - 1); const pr = par === 'Hand' ? Pp.HtI.clone().multiply(wq(b.parent)) : handRel[par].clone(); local = pr.invert().multiply(handRel[j]); } // lokal = (Eltern im Handraum)⁻¹ · Glied im Handraum
      row.push(local.toArray().map(v => +v.toFixed(5))); }
    frames[K].push(row); } }
mixer.stopAllAction();
// Handgelenk: Beuge/Drehung der Hand gegenüber dem Unterarm (Quelle, Bindepose → Bild) als Drehung um die Handachsen, auf die Zielhand gelegt
{ const mx2 = new THREE.AnimationMixer(S.root), a2 = mx2.clipAction(clip); a2.setLoop(THREE.LoopOnce, 1); a2.clampWhenFinished = true; a2.play(); S.root.updateMatrixWorld(true);
  bindRest(S.root); S.root.updateMatrixWorld(true);
  const r0 = {}; for (const side of ['Left', 'Right']) { const f0 = sm.get(side + 'ForeArm'); r0[side] = wq(f0).invert().multiply(basis(k => sm.get(k), side)); }
  for (let f = 0; f < N; f++) { mx2.setTime(f / res.fps); S.root.updateMatrixWorld(true);
    for (const side of ['Left', 'Right']) { const K = side[0], b = tb[side + 'Hand'], f0 = sm.get(side + 'ForeArm'); if (!b || !f0) continue;
      const rel = wq(f0).invert().multiply(basis(k => sm.get(k), side)), d = rel.multiply(r0[side].clone().invert()); // Drehung im Unterarmraum der Quelle
      // gemeinsamer Bezug: Handbasis in Ruhe, im jeweiligen Unterarmraum
      const tf = tb[side + 'ForeArm'], PtI = wq(tf).invert(), Bt = prep[side].Bt, Bs0 = r0[side];
      const Cs = Bs0, Ct = PtI.clone().multiply(Bt); // Handbasis im Unterarmraum (Quelle Ruhe / Ziel Ruhe)
      const dT = Ct.clone().multiply(Cs.clone().invert()).multiply(d).multiply(Cs).multiply(Ct.clone().invert()); // Drehung in den Ziel-Unterarmraum
      const local = dT.multiply(b.quaternion.clone()); frames[K][f][0] = local.toArray().map(v => +v.toFixed(5)); } }
  mx2.stopAllAction(); }
// benannte Haltungen: Mittel über ein Fenster (Sekunden) der Aufnahme – Zeiten wie KF_MO in kiffen.js
const POSEN = { halten: [22, 25], zug: [14.8, 15.8], heben: [13.2, 13.6], senken: [18, 18.6], klopfen: [32.2, 32.6], locker: [4, 6], anfang: [0.3, 0.8] };
const avg = (K, t0, t1) => { const a = Math.floor(t0 * res.fps), b = Math.max(a + 1, Math.floor(t1 * res.fps)); return JOINTS.map((j, ji) => { const q = new THREE.Quaternion(0, 0, 0, 0), r = new THREE.Quaternion(); let first = null;
  for (let f = a; f < Math.min(b, N); f++) { const v = frames[K][f][ji]; if (!v) return null; r.fromArray(v); if (!first) first = r.clone(); if (r.dot(first) < 0) r.set(-r.x, -r.y, -r.z, -r.w); q.x += r.x; q.y += r.y; q.z += r.z; q.w += r.w; } return q.normalize().toArray().map(v => +v.toFixed(5)); }); };
for (const [n, [a, b]] of Object.entries(POSEN)) res.posen[n] = { L: avg('L', a, b), R: avg('R', a, b), zeit: [a, b] };
// Kurve: Int16 (Werte/32767) je Bild · Seite · Gelenk · xyzw, Base64
for (const K of ['L', 'R']) { const I = new Int16Array(N * JOINTS.length * 4); for (let f = 0; f < N; f++) JOINTS.forEach((j, ji) => { const v = frames[K][f][ji] || res.ruhe[K][ji] || [0, 0, 0, 1]; for (let c = 0; c < 4; c++) I[(f * JOINTS.length + ji) * 4 + c] = Math.round(v[c] * 32767); });
  (res.kurven.rauchen = res.kurven.rauchen || { bilder: N, dauer: +(N / res.fps).toFixed(2) })[K] = Buffer.from(I.buffer).toString('base64'); }
fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(res));
console.log('haende_rauchen.json:', (fs.statSync(OUT).size / 1024).toFixed(0), 'KB,', N, 'Bilder,', Object.keys(res.posen).join('/'), '· Zielknochen', Object.keys(tb).length, '· Quelle', S.fam);
