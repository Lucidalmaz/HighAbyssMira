// AP-MOCAP: Bewegungsdaten (Motion-Capture) auf die Figuren-Skelette übertragen – gemeinsamer Kern für
//   tools/forge.html (Werkstatt, Vorschaubilder) und tools/mocap_bake.mjs (Backen in game/assets/chars/<id>/model.glb).
// Verfahren (Doku: app/story/audit/F3_stand_mocap.md):
//   1. Skelettfamilie erkennen (Mixamo/Mocap.in/Toei · Motifect · Unreal 4/5 · Character Creator · Auto-Rig Pro · Blechmann) → gemeinsame Knochennamen.
//      Früher wurden alle Familien gleichzeitig geprüft: Motifect „LeftLeg“ (Oberschenkel) schlug Mixamo „LeftLeg“ (Unterschenkel) → Knie und Brust blieben starr.
//   2. Ruhepose der Quelle = Bindepose des Skin-Meshes (Motifect-Dateien stehen sonst im ersten Laufbild); Achsen beider Skelette über Becken→Kopf und Hüftbreite angleichen.
//   3. Je Knochen die Weltdrehung gegenüber der Ruhepose übertragen; unterschiedliche Ruheposen (T/A) gleicht die Knochenrichtung aus, bei Händen zusätzlich die Handflächenebene.
//   4. Positionen über eine virtuelle Vorwärtskette setzen: auch „flache“ Skelette (Auto-Rig-Pro-Export der Tony-Figuren: Ober-/Unterschenkel sind Geschwister) bleiben zusammen.
//   5. Becken: Höhe mit der Beinlänge skaliert, Wurzelbewegung je Clip: 'lin' (Fortbewegung → auf der Stelle + Tempo), 'fix' (Drift weg, Schwanken bleibt), 'keep', 'turn' (Drehung/Weg als Kurve).
//   6. Unterarm-Drehknochen bekommen einen Teil der Handdrehung (kein „Bonbonpapier“-Handgelenk).
//   7. Nahtlose Schleifen (beste Schleifenstelle), Fußkontakte (Phase), Keyframe-Reduktion.
import * as THREE from 'three';

const SIDE = [['Left', 'l'], ['Right', 'r']], FING = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
const strip = n => String(n).replace(/^.*[:|]/, '').replace(/^mixamorig[:_]?/i, '').replace(/^CC_Base_/i, '');
// ---------- Familie
export function family(root) { const N = new Set(); root.traverse(o => N.add(strip(o.name)));
  const has = re => [...N].some(n => re.test(n));
  if (has(/^arm_stretch[lr](_\d+)?$/)) return 'arp';
  if (has(/^L_Upperarm$/)) return 'cc';
  if (has(/^arm2L$/)) return 'oz';
  if (has(/^upperarm_l$/i)) return has(/^spine_05$/i) ? 'ue5' : 'ue4';
  if (has(/^LeftShin$/)) return 'dl';
  if (has(/^(Left|Right)(UpLeg|ForeArm)$/)) return 'mx';
  return 'mx'; }
// Name → Rolle (gemeinsamer Name, 'spine'/'neck' für Ketten, null = unbenutzt)
function role(fam, raw) { let n = strip(raw);
  if (fam === 'arp' || fam === 'mx') n = n.replace(/_\d+$/, ''); // Sketchfab-Export: mixamorigHips_32
  if (fam === 'mx') { if (/^hips$/i.test(n)) return 'Hips'; if (/^spine\d*$/i.test(n)) return 'spine'; if (/^neck\d*$/i.test(n)) return 'neck'; if (/^head$/i.test(n)) return 'Head';
    const m = n.match(/^(Left|Right)(Shoulder|Arm|ForeArm|Hand|UpLeg|Leg|Foot|ToeBase)$/); if (m) return m[1] + m[2];
    const f = n.match(/^(Left|Right)Hand(Thumb|Index|Middle|Ring|Pinky)([123])$/); if (f) return f[1] + 'Hand' + f[2] + f[3]; return null; }
  if (fam === 'dl') { if (n === 'Hips') return 'Hips'; if (/^(Spine\d|Chest)$/.test(n)) return 'spine'; if (/^Neck\d$/.test(n)) return 'neck'; if (n === 'Head') return 'Head';
    const m = n.match(/^(Left|Right)(Shoulder|Arm|ForeArm|Hand|Leg|Shin|Foot|ToeBase)$/); if (m) return m[1] + ({ Leg: 'UpLeg', Shin: 'Leg' }[m[2]] || m[2]);
    const f = n.match(/^(Left|Right)Hand(Thumb|Index|Middle|Ring|Pinky)([1234])$/); if (f) { const k = f[2] === 'Thumb' ? +f[3] : +f[3] - 1; return k >= 1 && k <= 3 ? f[1] + 'Hand' + f[2] + k : null; } return null; }
  if (fam === 'ue4' || fam === 'ue5') { n = n.toLowerCase(); if (n === 'pelvis') return 'Hips'; if (/^spine_0\d$/.test(n)) return 'spine'; if (/^neck_0\d$/.test(n)) return 'neck'; if (n === 'head') return 'Head';
    const m = n.match(/^(clavicle|upperarm|lowerarm|hand|thigh|calf|foot|ball)_([lr])$/); if (m) return (m[2] === 'l' ? 'Left' : 'Right') + { clavicle: 'Shoulder', upperarm: 'Arm', lowerarm: 'ForeArm', hand: 'Hand', thigh: 'UpLeg', calf: 'Leg', foot: 'Foot', ball: 'ToeBase' }[m[1]];
    const f = n.match(/^(thumb|index|middle|ring|pinky)_0([123])_([lr])$/); if (f) return (f[3] === 'l' ? 'Left' : 'Right') + 'Hand' + f[1][0].toUpperCase() + f[1].slice(1) + f[2]; return null; }
  if (fam === 'cc') { if (n === 'Hip') return 'Hips'; if (/^(Waist|Spine0\d)$/.test(n)) return 'spine'; if (/^NeckTwist0\d$/.test(n)) return 'neck'; if (n === 'Head') return 'Head';
    const m = n.match(/^([LR])_(Clavicle|Upperarm|Forearm|Hand|Thigh|Calf|Foot|ToeBase)$/); if (m) return (m[1] === 'L' ? 'Left' : 'Right') + { Clavicle: 'Shoulder', Upperarm: 'Arm', Forearm: 'ForeArm', Hand: 'Hand', Thigh: 'UpLeg', Calf: 'Leg', Foot: 'Foot', ToeBase: 'ToeBase' }[m[2]];
    const f = n.match(/^([LR])_(Thumb|Index|Mid|Ring|Pinky)([123])$/); if (f) return (f[1] === 'L' ? 'Left' : 'Right') + 'Hand' + (f[2] === 'Mid' ? 'Middle' : f[2]) + f[3]; return null; }
  if (fam === 'arp') { if (n === 'rootx') return 'Hips'; if (/^spine_0\dx$/.test(n)) return 'spine'; if (n === 'neckx') return 'neck'; if (n === 'headx') return 'Head';
    const m = n.match(/^(shoulder|arm_stretch|forearm_stretch|hand|thigh_stretch|leg_stretch|foot|toes_01)([lr])$/); if (m) return (m[2] === 'l' ? 'Left' : 'Right') + { shoulder: 'Shoulder', arm_stretch: 'Arm', forearm_stretch: 'ForeArm', hand: 'Hand', thigh_stretch: 'UpLeg', leg_stretch: 'Leg', foot: 'Foot', toes_01: 'ToeBase' }[m[1]];
    const f = n.match(/^(?:c_)?(thumb|index|middle|ring|pinky)([123])([lr])$/); if (f) return (f[3] === 'l' ? 'Left' : 'Right') + 'Hand' + f[1][0].toUpperCase() + f[1].slice(1) + f[2]; return null; }
  if (fam === 'oz') { const T = { spine1: 'Hips', spine2: 'spine', spine3: 'spine', neck: 'neck', head: 'Head' }; if (T[n]) return T[n];
    const m = n.match(/^(arm1|arm2|arm3|wrist|leg1|leg2|leg3|leg4)([LR])$/); if (m) return (m[2] === 'L' ? 'Left' : 'Right') + { arm1: 'Shoulder', arm2: 'Arm', arm3: 'ForeArm', wrist: 'Hand', leg1: 'UpLeg', leg2: 'Leg', leg3: 'Foot', leg4: 'ToeBase' }[m[1]]; return null; }
  return null; }
const depth = o => { let d = 0; for (let p = o.parent; p; p = p.parent) d++; return d; };
// Gemeinsamer Name → Knoten (oberster Knoten je Name; Ketten Wirbelsäule/Hals auf Spine/Spine1/Spine2 bzw. Neck verteilt)
export function canonMap(root, fam = family(root)) { const map = new Map(), spine = [], neck = [], seen = new Set(); let MIX = false; root.traverse(o => { if (/^mixamorig/i.test(o.name)) MIX = true; });
  root.traverse(o => { if (o.isMesh || o.isLight || o.isCamera) return; const nm = strip(o.name); let dup = false; for (let p = o.parent; p; p = p.parent) if (strip(p.name) === nm) { dup = true; break; } if (dup) return;
    const r = role(fam, o.name); if (!r) return; if (r === 'spine') spine.push(o); else if (r === 'neck') neck.push(o); else if (!map.has(r) || (o.isBone && !map.get(r).isBone) || (MIX && /mixamorig/i.test(o.name) && !/mixamorig/i.test(map.get(r).name))) map.set(r, o); });
  // Skin-Gelenke vor gleichnamigen Hilfsknoten (Sketchfab-Export: Mesh-Gruppe „head_70“ neben „mixamorigHead_1“)
  const hips = map.get('Hips'), under = o => { for (let p = o.parent; p; p = p.parent) if (p === hips) return true; return fam === 'arp'; };
  const pick = L => { const b = L.filter(o => MIX ? /mixamorig/i.test(o.name) : o.isBone); return b.length ? b : L; };
  const S = pick(spine).filter(under).sort((a, b) => depth(a) - depth(b));
  if (S.length === 1) map.set('Spine', S[0]); else if (S.length === 2) { map.set('Spine', S[0]); map.set('Spine2', S[1]); }
  else if (S.length >= 3) { map.set('Spine', S[0]); map.set('Spine1', S[Math.round((S.length - 1) / 2)]); map.set('Spine2', S[S.length - 1]); }
  const Nk = pick(neck).sort((a, b) => depth(a) - depth(b)); if (Nk.length) map.set('Neck', Nk[0]);
  return map; }
// Kanonische Elternkette (für die Vorwärtskette der Positionen)
const CPAR = { Spine: 'Hips', Spine1: 'Spine', Spine2: 'Spine1', Neck: 'Spine2', Head: 'Neck' };
for (const [S] of SIDE) { Object.assign(CPAR, { [S + 'Shoulder']: 'Spine2', [S + 'Arm']: S + 'Shoulder', [S + 'ForeArm']: S + 'Arm', [S + 'Hand']: S + 'ForeArm', [S + 'UpLeg']: 'Hips', [S + 'Leg']: S + 'UpLeg', [S + 'Foot']: S + 'Leg', [S + 'ToeBase']: S + 'Foot' });
  for (const f of FING) { CPAR[S + 'Hand' + f + '1'] = S + 'Hand'; CPAR[S + 'Hand' + f + '2'] = S + 'Hand' + f + '1'; CPAR[S + 'Hand' + f + '3'] = S + 'Hand' + f + '2'; } }
const CHILD = { Hips: 'Spine', Spine: 'Spine1', Spine1: 'Spine2', Spine2: 'Neck', Neck: 'Head' };
for (const [S] of SIDE) { Object.assign(CHILD, { [S + 'Shoulder']: S + 'Arm', [S + 'Arm']: S + 'ForeArm', [S + 'ForeArm']: S + 'Hand', [S + 'Hand']: S + 'HandMiddle1', [S + 'UpLeg']: S + 'Leg', [S + 'Leg']: S + 'Foot', [S + 'Foot']: S + 'ToeBase' });
  for (const f of FING) { CHILD[S + 'Hand' + f + '1'] = S + 'Hand' + f + '2'; CHILD[S + 'Hand' + f + '2'] = S + 'Hand' + f + '3'; } }
export const CANON_NAMES = Object.keys(CPAR).concat('Hips');
const cpar = (k, m) => { let p = CPAR[k]; while (p && !m.has(p)) p = CPAR[p]; return p || null; }; // m: Menge/Map der vorhandenen Namen
const TORSO = /^(Hips|Spine\d?|Neck|Head)$/;

// ---------- Ruhepose aus der Bindepose des Skin-Meshes (Quelle)
export function bindRest(root) { root.updateMatrixWorld(true); const W = new Map();
  root.traverse(o => { if (!o.isSkinnedMesh) return; const sk = o.skeleton; sk.bones.forEach((b, i) => { if (!W.has(b)) W.set(b, new THREE.Matrix4().copy(sk.boneInverses[i]).invert()); }); });
  if (!W.size) return false;
  // Bindematrizen liegen im Raum des Meshes zur Bindezeit (bindMatrix = Mesh-Welt) → hier einfach als Welt nehmen
  const inv = new THREE.Matrix4(), L = new THREE.Matrix4(); const list = [...W.keys()].sort((a, b) => depth(a) - depth(b));
  for (const b of list) { b.parent.updateWorldMatrix(true, false); L.copy(inv.copy(b.parent.matrixWorld).invert()).multiply(W.get(b)); L.decompose(b.position, b.quaternion, b.scale); b.updateMatrixWorld(true); }
  root.updateMatrixWorld(true); return true; }

// ---------- Quelle vorbereiten: Familie + Ruhepose (Bindepose nur, wenn sie die Hauptknochen enthält und gestreckter ist als die Grundstellung der Datei)
export function prepSource(root) {
  // Bindepose nur, wenn das Skin-Skelett die Hauptknochen wirklich enthält (manche Dateien binden nur das Becken → sonst zerrissene Ruhe)
  const fam = family(root), cm = canonMap(root, fam), skel = new Set(); root.traverse(o => { if (o.isSkinnedMesh) o.skeleton.bones.forEach(b => skel.add(b)); });
  // Ruhe-Kandidaten: Bindepose oder Grundstellung der Datei – genommen wird die mit den gestreckteren Gliedern (echte T-/A-Pose), Knickwinkel an Ellbogen und Knien
  const bend = () => { root.updateMatrixWorld(true); let s2 = 0; for (const [a, b, c] of [['LeftArm', 'LeftForeArm', 'LeftHand'], ['RightArm', 'RightForeArm', 'RightHand'], ['LeftUpLeg', 'LeftLeg', 'LeftFoot'], ['RightUpLeg', 'RightLeg', 'RightFoot']]) {
      if (!cm.has(a) || !cm.has(b) || !cm.has(c)) continue; const A = new THREE.Vector3().setFromMatrixPosition(cm.get(a).matrixWorld), B = new THREE.Vector3().setFromMatrixPosition(cm.get(b).matrixWorld), C = new THREE.Vector3().setFromMatrixPosition(cm.get(c).matrixWorld);
      s2 += B.clone().sub(A).angleTo(C.clone().sub(B)); } return s2 * 57.3; };
  const snap = []; root.traverse(o => snap.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone()])); const b0 = bend();
  const cov = cm.size ? [...cm.values()].filter(o => skel.has(o)).length / cm.size : 0; let hadBind = cov > .8 ? bindRest(root) : false;
  if (hadBind) { const b1 = bend(); if (b1 > b0 + 10) { for (const [o, p2, q, sc] of snap) { o.position.copy(p2); o.quaternion.copy(q); o.scale.copy(sc); } root.updateMatrixWorld(true); hadBind = false; } }
  return { fam, hadBind, cov }; }

// ---------- Hilfen
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4();
const wpos = o => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
const wrot = o => { const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); o.matrixWorld.decompose(p, q, s); return q; };
const snapAxis = v => { const a = [Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)], i = a.indexOf(Math.max(...a)); const r = new THREE.Vector3(); r.setComponent(i, Math.sign(v.getComponent(i))); return r; };
// Körperachsen (links, oben, vorn) in Weltlage; oben/links auf die nächste Achse gerundet (Ruheposen stehen achsparallel)
export function bodyFrame(map, snap = true) { const hp = wpos(map.get('Hips')), top = map.get('Head') || map.get('Neck') || map.get('Spine2');
  let up = wpos(top).sub(hp).normalize(); let left = map.has('LeftUpLeg') && map.has('RightUpLeg') ? wpos(map.get('LeftUpLeg')).sub(wpos(map.get('RightUpLeg'))) : wpos(map.get('LeftArm')).sub(wpos(map.get('RightArm')));
  if (snap) up = snapAxis(up); left.addScaledVector(up, -left.dot(up)).normalize(); if (snap) left = snapAxis(left);
  const fwd = new THREE.Vector3().crossVectors(left, up).normalize(); left.crossVectors(up, fwd).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(left, up, fwd)); return { up, left, fwd, q }; }
const lerpAngle = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
function smooth1(arr, win) { if (win < 2) return arr.slice(); const n = arr.length, out = new Array(n), h = Math.floor(win / 2); for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let j = Math.max(0, i - h); j <= Math.min(n - 1, i + h); j++) { s += arr[j]; c++; } out[i] = s / c; } return out; }

// ---------- Übertragen
// src = { root, clip }, tgt = { root, deform: Set<Object3D>|null (Skin-Gelenke) }
// opt: { fps, rm: 'lin'|'fix'|'keep'|'turn', loop, trim: [t0, t1], name, autoLoop, fingers, speed (Faktor auf die Abspielzeit) }
// Ergebnis: { tracks: [{ node, path: 'quaternion'|'position', times: Float32Array, values: Float32Array }], duration, meta }
export function retarget(src, tgt, opt = {}) {
  const fps = opt.fps || 30, rm = opt.rm || 'fix', sfam = src.fam || family(src.root), tfam = tgt.fam || family(tgt.root);
  const S = src.root, T = tgt.root; S.updateMatrixWorld(true); T.updateMatrixWorld(true);
  const sm = canonMap(S, sfam), tm = canonMap(T, tfam);
  let keys = CANON_NAMES.filter(k => sm.has(k) && tm.has(k)); if (opt.fingers === false) keys = keys.filter(k => !/Hand(Thumb|Index|Middle|Ring|Pinky)/.test(k));
  if (!keys.includes('Hips')) throw new Error('Becken fehlt (' + sfam + '→' + tfam + ')');
  const kset = new Set(keys);
  // Weltachsen der Quelle aus dem Clip selbst (oben = Kopf über den Füßen, links = Hüft-/Schulterbreite, gemittelt über 12 Bilder) – die Ruhepose kann liegen (Motifect: Bindepose = erstes Bild)
  const snapS = []; S.traverse(o => snapS.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone()]));
  const fs = (() => { const mx0 = new THREE.AnimationMixer(S), a0 = mx0.clipAction(src.clip); a0.setLoop(THREE.LoopOnce, 1); a0.clampWhenFinished = true; a0.play(); const Lf = new THREE.Vector3();
    const top = sm.get('Head') || sm.get('Neck') || sm.get('Spine2'), feetK = ['LeftFoot', 'RightFoot'].filter(k => sm.has(k)), HF = [], FM = [];
    for (let i = 0; i < 24; i++) { mx0.setTime(src.clip.duration * i / 23); S.updateMatrixWorld(true); const fp = feetK.map(k => wpos(sm.get(k))), fm = fp.length ? fp.reduce((v, p) => v.add(p), new THREE.Vector3()).divideScalar(fp.length) : wpos(sm.get('Hips'));
      HF.push(wpos(top).sub(fm)); FM.push(fp.length ? fp : [fm]); if (sm.has('LeftUpLeg') && sm.has('RightUpLeg')) Lf.add(wpos(sm.get('LeftUpLeg')).sub(wpos(sm.get('RightUpLeg'))).normalize()); if (sm.has('LeftArm') && sm.has('RightArm')) Lf.add(wpos(sm.get('LeftArm')).sub(wpos(sm.get('RightArm'))).normalize()); }
    mx0.stopAllAction(); mx0.uncacheRoot(S); for (const [o, p2, q, sc] of snapS) { o.position.copy(p2); o.quaternion.copy(q); o.scale.copy(sc); } S.updateMatrixWorld(true);
    // oben = Achse, entlang der der Kopf im Mittel hoch über den Füßen steht und der tiefste Fuß (Boden) am ruhigsten bleibt – auch wenn die Figur zeitweise liegt
    const H0 = HF.reduce((m, v) => Math.max(m, v.length()), 1e-6); let up = null, best = -Infinity;
    for (const ax of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) { const a = new THREE.Vector3(...ax), mean = HF.reduce((s2, v) => s2 + v.dot(a), 0) / HF.length, fmin = FM.map(L => Math.min(...L.map(p => p.dot(a) * Math.sign(mean || 1)))), mu = fmin.reduce((x, y) => x + y, 0) / fmin.length, sd = Math.sqrt(fmin.reduce((x, y) => x + (y - mu) ** 2, 0) / fmin.length);
      const sc = Math.abs(mean) / (sd + H0 * .05); if (sc > best) { best = sc; up = a.multiplyScalar(Math.sign(mean) || 1); } }
    if (!opt.up && (sfam === 'dl' || sfam === 'mx')) opt = { ...opt, up: 'y' }; // Motifect/Mocap.in/Mixamo-Dateien sind immer Y-oben (Boden-Suche nur für Unreal-Dateien)
    if (opt.up) { const m2 = String(opt.up).match(/^(-?)([xyz])$/); up = new THREE.Vector3(); up[m2[2]] = m2[1] ? -1 : 1; } // Clips, die nur liegen: Achse vorgeben
    Lf.addScaledVector(up, -Lf.dot(up)).normalize(); const sn = snapAxis(Lf); const left = Lf.angleTo(sn) < .35 ? sn : Lf; const fwd = new THREE.Vector3().crossVectors(left, up).normalize(); left.crossVectors(up, fwd).normalize();
    return { up, left, fwd, q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(left, up, fwd)) }; })();
  const ft = bodyFrame(tm), F = ft.q.clone().multiply(fs.q.clone().invert());
  // Körperachsen in Ruhe (ungerundet): weichen sie stark von der Ziel-Ruhe ab (liegende Bindepose), wird auch der Rumpf ausgerichtet
  const rsQ = F.clone().multiply(bodyFrame(sm, false).q), rtQ = bodyFrame(tm, false).q, torsoA = new THREE.Quaternion();
  if (new THREE.Vector3(0, 1, 0).applyQuaternion(rsQ).angleTo(new THREE.Vector3(0, 1, 0).applyQuaternion(rtQ)) > .5 || new THREE.Vector3(1, 0, 0).applyQuaternion(rsQ).angleTo(new THREE.Vector3(1, 0, 0).applyQuaternion(rtQ)) > .5) torsoA.copy(rsQ).multiply(rtQ.clone().invert());
  const Qs0 = new Map(), Qt0 = new Map(), A = new Map(), Ps0 = new Map();
  for (const k of keys) { Qs0.set(k, F.clone().multiply(wrot(sm.get(k)))); Qt0.set(k, wrot(tm.get(k))); Ps0.set(k, wpos(sm.get(k)).applyQuaternion(F)); }
  for (const k of keys) { const a = new THREE.Quaternion(), ch = CHILD[k];
    if (!TORSO.test(k) && ch && sm.has(ch) && tm.has(ch)) { const ds = Ps0.get(ch).clone().sub(Ps0.get(k)), dt = wpos(tm.get(ch)).sub(wpos(tm.get(k)));
      if (ds.lengthSq() > 1e-12 && dt.lengthSq() > 1e-12) { ds.normalize(); dt.normalize(); a.setFromUnitVectors(dt, ds);
        // Handfläche: Zeigefinger→kleiner Finger quer zur Handrichtung angleichen (sonst verdrehte Handgelenke)
        const side = k.startsWith('Left') ? 'Left' : 'Right', i1 = side + 'HandIndex1', p1 = side + 'HandPinky1';
        if (/Hand$/.test(k) && sm.has(i1) && sm.has(p1) && tm.has(i1) && tm.has(p1)) { const ws = wpos(sm.get(p1)).applyQuaternion(F).sub(wpos(sm.get(i1)).applyQuaternion(F)), wt = wpos(tm.get(p1)).sub(wpos(tm.get(i1))).applyQuaternion(a);
          ws.addScaledVector(ds, -ws.dot(ds)); wt.addScaledVector(ds, -wt.dot(ds)); if (ws.lengthSq() > 1e-12 && wt.lengthSq() > 1e-12) { ws.normalize(); wt.normalize(); const ang = Math.atan2(_v.crossVectors(wt, ws).dot(ds), wt.dot(ws)); a.premultiply(_q.setFromAxisAngle(ds, ang)); } } } }
    if (TORSO.test(k)) a.copy(torsoA); A.set(k, a); }
  // Größenverhältnis über die Beinlänge (Oberschenkel + Unterschenkel, unabhängig von der Haltung der Ruhepose)
  const legLen = m => { let s2 = 0, n2 = 0; for (const S2 of ['Left', 'Right']) if (m.has(S2 + 'UpLeg') && m.has(S2 + 'Leg') && m.has(S2 + 'Foot')) { s2 += wpos(m.get(S2 + 'UpLeg')).distanceTo(wpos(m.get(S2 + 'Leg'))) + wpos(m.get(S2 + 'Leg')).distanceTo(wpos(m.get(S2 + 'Foot'))); n2++; } return n2 ? s2 / n2 : 1; };
  // Größenverhältnis: Gliedlängen (unabhängig davon, ob die Ruhepose steht, liegt oder ein Knie beugt – z. B. Aydin); Auto-Rig Pro (Vegas): Beckenhöhe über den Füßen
  const hipH = (m, up) => { const h = wpos(m.get('Hips')); const f = ['LeftFoot', 'RightFoot'].filter(k => m.has(k)).map(k => wpos(m.get(k))); return f.length ? Math.max(1e-6, h.dot(up) - f.reduce((s2, p) => s2 + p.dot(up), 0) / f.length) : 1; };
  const upright = torsoA.equals(new THREE.Quaternion()) && tfam === 'arp', ratio = upright ? hipH(tm, ft.up) / hipH(new Map([...sm].map(([k, o]) => [k, { matrixWorld: new THREE.Matrix4().makeRotationFromQuaternion(F).multiply(o.matrixWorld) }])), ft.up) : legLen(tm) / legLen(sm);
  const hs0 = Ps0.get('Hips').clone(), ht0 = wpos(tm.get('Hips'));
  const footT0 = Math.min(...['LeftFoot', 'RightFoot'].filter(k => tm.has(k)).map(k => wpos(tm.get(k)).dot(ft.up)), ht0.dot(ft.up)); // Knöchelhöhe der Zielfigur in Ruhe
  // Zielknoten in Hierarchie-Reihenfolge; Ruhe-Weltmatrizen; Mitläufer (flache Drehknochen) und Unterarm-Drehknochen
  const nodes = []; T.traverse(o => { if (o !== T && !o.isMesh) nodes.push(o); });
  const W0 = new Map(nodes.map(o => [o, o.matrixWorld.clone()])), L0 = new Map(nodes.map(o => [o, o.matrix.clone()])), tk = new Map(keys.map(k => [tm.get(k), k]));
  const follow = new Map(), twist = new Map();
  const tn = o => strip(o.name).replace(/_\d+$/, '');
  for (const o of nodes) { if (tk.has(o)) continue; const n = tn(o);
    if (tfam === 'arp') { const m = n.match(/^(thigh_twist|c_arm_twist_offset|arm_twist)([lr])$/); if (m) { const k = (m[2] === 'l' ? 'Left' : 'Right') + (m[1] === 'thigh_twist' ? 'UpLeg' : 'Arm'); if (tm.has(k) && kset.has(k)) follow.set(o, k); }
      const t2 = n.match(/^forearm_twist([lr])$/); if (t2) twist.set(o, { k: (t2[1] === 'l' ? 'Left' : 'Right') + 'ForeArm', w: .5 }); }
    if (tfam === 'cc') { const t2 = n.match(/^([LR])_ForearmTwist0([12])$/); if (t2) { let dup = false; for (let p = o.parent; p; p = p.parent) if (tn(p) === n) dup = true; if (!dup) twist.set(o, { k: (t2[1] === 'L' ? 'Left' : 'Right') + 'ForeArm', w: t2[2] === '1' ? .2 : .55 }); } } }
  const Wf0inv = new Map([...follow].map(([o, k]) => [o, new THREE.Matrix4().copy(W0.get(tm.get(k))).invert().multiply(W0.get(o))]));
  const offs = new Map(); for (const k of keys) { const p = cpar(k, kset); if (p) offs.set(k, { p, off: wpos(tm.get(k)).applyMatrix4(new THREE.Matrix4().copy(W0.get(tm.get(p))).invert()) }); }
  const wscale = new Map(keys.map(k => { const s = new THREE.Vector3(); W0.get(tm.get(k)).decompose(_v, _q, s); return [k, s]; }));
  // Quelle abtasten
  const clip = src.clip, t0 = Math.max(0, (opt.trim && opt.trim[0]) || 0), t1 = Math.min(clip.duration, (opt.trim && opt.trim[1]) || clip.duration);
  let footMinS = Infinity; const mixer = new THREE.AnimationMixer(S), act = mixer.clipAction(clip); act.setLoop(THREE.LoopOnce, 1); act.clampWhenFinished = true; act.play(); // sonst springt setTime(Dauer) auf 0 zurück
  let N = Math.max(2, Math.round((t1 - t0) * fps) + 1);
  const D = keys.map(() => []), hipP = [], hipAbs = [], yaw = [], sFoot = [[], []], useIK = opt.ik !== false && ['Left', 'Right'].every(S2 => ['UpLeg', 'Leg', 'Foot'].every(b => kset.has(S2 + b)));
  const fwdHip = (() => { const q = Qs0.get('Hips').clone().invert(); return new THREE.Vector3(0, 0, 1).applyQuaternion(rsQ).applyQuaternion(q); })(); // Vorwärts im Beckenraum der Quelle
  for (let f = 0; f < N; f++) { mixer.setTime(Math.min(t1, t0 + f / fps)); S.updateMatrixWorld(true);
    keys.forEach((k, i) => { const q = F.clone().multiply(wrot(sm.get(k))); D[i].push(q.multiply(Qs0.get(k).clone().invert())); });
    hipP.push(wpos(sm.get('Hips')).applyQuaternion(F).sub(hs0).multiplyScalar(ratio)); hipAbs.push(wpos(sm.get('Hips')).applyQuaternion(F).dot(ft.up));
    footMinS = Math.min(footMinS, ...['LeftFoot', 'RightFoot'].filter(k => sm.has(k)).map(k => wpos(sm.get(k)).applyQuaternion(F).dot(ft.up)));
    if (useIK) ['Left', 'Right'].forEach((S2, si) => sFoot[si].push(wpos(sm.get(S2 + 'Foot')).sub(wpos(sm.get('Hips'))).applyQuaternion(F).multiplyScalar(ratio))); // Fuß relativ zum Becken (skaliert)
    const fq = fwdHip.clone().applyQuaternion(F.clone().multiply(wrot(sm.get('Hips')))); fq.addScaledVector(ft.up, -fq.dot(ft.up)); yaw.push(Math.atan2(fq.dot(ft.left), fq.dot(ft.fwd))); }
  mixer.stopAllAction(); mixer.uncacheRoot(S);
  for (let f = 1; f < N; f++) yaw[f] = yaw[f - 1] + lerpAngle(yaw[f - 1], yaw[f]);
  // Schleifenstelle suchen (Fortbewegung/Stand): Paar (i, j) mit ähnlichster Pose und Geschwindigkeit, Länge ≥ minLen
  let i0 = 0, i1 = N - 1;
  if (opt.loop && opt.autoLoop !== false) { const idx = keys.map((k, i) => /^(Hips|Spine2|Neck|Head|(Left|Right)(Arm|ForeArm|UpLeg|Leg|Foot))$/.test(k) ? i : -1).filter(i => i >= 0);
    const dist = (a, b) => { let s = 0; for (const i of idx) { const d = Math.abs(D[i][a].dot(D[i][b])); s += 1 - Math.min(1, d); const a2 = Math.min(N - 1, a + 2), b2 = Math.min(N - 1, b + 2); s += .5 * Math.abs((1 - Math.abs(D[i][a].dot(D[i][a2]))) - (1 - Math.abs(D[i][b].dot(D[i][b2])))); } return s; };
    const minLen = Math.round((opt.minLoop || Math.min(4, (N - 1) / fps * .5)) * fps); let best = Infinity;
    for (let a = 0; a < Math.floor(N * .35); a++) for (let b = Math.max(a + minLen, Math.floor(N * .55)); b < N; b++) { const d = dist(a, b) - (b - a) * 1e-5; if (d < best) { best = d; i0 = a; i1 = b; } } }
  N = i1 - i0 + 1; const sl = a => a.slice(i0, i1 + 1); for (let i = 0; i < keys.length; i++) D[i] = sl(D[i]); let HP = sl(hipP), YW = sl(yaw), HA = sl(hipAbs); if (useIK) for (let si = 0; si < 2; si++) sFoot[si] = sl(sFoot[si]);
  // Wurzelbewegung
  const up = ft.up, meta = { src: clip.name, loop: !!opt.loop, rm, speed: 0, dur: (N - 1) / fps };
  const hy = HA.map(h => footT0 + (h - (isFinite(footMinS) ? footMinS : hs0.dot(up))) * ratio - ht0.dot(up)), /* Beckenhöhe über dem Boden, skaliert */ ox = HP.map(p => p.dot(ft.left)), oz = HP.map(p => p.dot(ft.fwd)), ym = YW.reduce((s, v) => s + v, 0) / N; let ry;
  if (rm === 'lin') ry = smooth1(YW, Math.round(fps * 1.1)); // Blickrichtung folgt der über einen Doppelschritt gemittelten Beckendrehung (gebogene Wege werden gerade)
  else if (rm === 'turn') { ry = smooth1(YW, Math.round(fps * .35)); ry = ry.map(v => v - ry[0] + YW[0]); }
  else if (rm === 'keep') ry = YW.map(() => YW[0]); else ry = YW.map(() => ym);
  // Weg begradigen: Schritte um die herausgenommene Drehung zurückdrehen und aufsummieren
  const hx = [ox[0]], hz = [oz[0]]; for (let f = 1; f < N; f++) { const a = -(ry[f] - ry[0]), dx = ox[f] - ox[f - 1], dz = oz[f] - oz[f - 1]; hx.push(hx[f - 1] + dx * Math.cos(a) + dz * Math.sin(a)); hz.push(hz[f - 1] - dx * Math.sin(a) + dz * Math.cos(a)); }
  let rx, rz; if (globalThis.MOCAP_DEBUG) console.log('DBG', { ratio, ox: [ox[0], ox[N - 1]], oz: [oz[0], oz[N - 1]], hx: [hx[0], hx[N - 1]], hz: [hz[0], hz[N - 1]], yw: [YW[0], YW[N >> 1], YW[N - 1]], ry: [ry[0], ry[N - 1]], F: F.toArray(), fs: [fs.up.toArray(), fs.left.toArray()] });
  if (rm === 'lin') { const dx = (hx[N - 1] - hx[0]) / (N - 1), dz = (hz[N - 1] - hz[0]) / (N - 1); rx = hx.map((v, f) => hx[0] + dx * f); rz = hz.map((v, f) => hz[0] + dz * f); meta.speed = Math.hypot(dx, dz) * fps; meta.dir = +Math.atan2(dx, dz).toFixed(3); }
  else if (rm === 'fix') { const w = Math.round(fps * 1.2); rx = smooth1(hx, w); rz = smooth1(hz, w); }
  else if (rm === 'keep') { rx = hx.map(() => hx[0]); rz = hz.map(() => hz[0]); }
  else { const w = Math.round(fps * .35); rx = smooth1(hx, w); rz = smooth1(hz, w); }
  const sx = smooth1(ox, Math.round(fps * .35)), sz = smooth1(oz, Math.round(fps * .35));
  // Wurzel-Kurve (Meter, relativ zum Start; Drehung um die Hochachse) für Drehungen/Wege
  const y0 = ry[0]; meta.turn = ry[N - 1] - y0; meta.root = { fps: 10, yaw: [], x: [], z: [] };
  for (let f = 0; f < N; f += fps / 10) { const i = Math.round(f); meta.root.yaw.push(+(ry[i] - y0).toFixed(4)); const c = Math.cos(-y0), s = Math.sin(-y0), X = sx[i] - sx[0], Z = sz[i] - sz[0]; meta.root.x.push(+(X * c + Z * s).toFixed(4)); meta.root.z.push(+(-X * s + Z * c).toFixed(4)); }
  // Bein-IK: Fußgelenk dorthin, wo es in der Quelle (relativ zum Becken, skaliert) steht → Standfuß bleibt stehen, auch wenn Ober-/Unterschenkel anders proportioniert sind.
  // Kniebeuge-Ebene aus der Vorwärtskette; Fußdrehung bleibt aus der Quelle.
  const ikA = new THREE.Vector3(), ikB = new THREE.Vector3(), ikC = new THREE.Vector3(), ikT = new THREE.Vector3(), ikQ = new THREE.Quaternion(), ikQ2 = new THREE.Quaternion(), ikS = new THREE.Vector3(), ikR = new THREE.Quaternion();
  const legIK = (WK, rq, f) => { const hp = new THREE.Vector3().setFromMatrixPosition(WK.get('Hips'));
    ['Left', 'Right'].forEach((S2, si) => { const mU = WK.get(S2 + 'UpLeg'), mL = WK.get(S2 + 'Leg'), mF = WK.get(S2 + 'Foot');
      ikA.setFromMatrixPosition(mU); ikB.setFromMatrixPosition(mL); ikC.setFromMatrixPosition(mF); ikT.copy(sFoot[si][f]).applyQuaternion(rq).add(hp);
      const a = ikA.distanceTo(ikB), b = ikB.distanceTo(ikC), AT = ikT.clone().sub(ikA); let d = AT.length(); if (d < 1e-6) return; d = Math.min(Math.max(d, Math.abs(a - b) + 1e-4), (a + b) * .9995); AT.normalize();
      const pole = ikB.clone().sub(ikA); pole.addScaledVector(AT, -pole.dot(AT)); if (pole.lengthSq() < 1e-12) return; pole.normalize();
      const cosA = (a * a + d * d - b * b) / (2 * a * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA)), B2 = ikA.clone().addScaledVector(AT, a * cosA).addScaledVector(pole, a * sinA), T2 = ikA.clone().addScaledVector(AT, d);
      ikQ.setFromUnitVectors(ikB.clone().sub(ikA).normalize(), B2.clone().sub(ikA).normalize());
      const cRot = ikC.clone().sub(ikB).applyQuaternion(ikQ).normalize(); ikQ2.setFromUnitVectors(cRot, T2.clone().sub(B2).normalize());
      mU.decompose(_v, ikR, ikS); ikR.premultiply(ikQ); mU.compose(ikA, ikR, ikS);
      mL.decompose(_v, ikR, ikS); ikR.premultiply(ikQ).premultiply(ikQ2); mL.compose(B2, ikR, ikS);
      mF.decompose(_v, ikR, ikS); mF.compose(T2, ikR, ikS);
      const tb = S2 + 'ToeBase', o = offs.get(tb); if (o && WK.has(tb)) { WK.get(tb).decompose(_v, ikR, ikS); WK.get(tb).compose(o.off.clone().applyMatrix4(mF), ikR, ikS); } }); };
  // Zielposen berechnen
  const Wt = new Map(), out = new Map(); for (const o of nodes) out.set(o, { q: new Float32Array(N * 4), p: new Float32Array(N * 3) });
  const rq = new THREE.Quaternion(), pw = new THREE.Matrix4(), M = new THREE.Matrix4(), P = new THREE.Vector3(), Q = new THREE.Quaternion(), Sc = new THREE.Vector3(), tmpM = new THREE.Matrix4();
  const WK = new Map(), feet = [[], []];
  for (let f = 0; f < N; f++) { rq.setFromAxisAngle(up, -(ry[f] - y0)); // Wurzeldrehung heraus
    // gewünschte Weltlagen der zugeordneten Knochen (Kette in CANON-Reihenfolge: Eltern zuerst)
    WK.clear();
    for (const k of ['Hips', ...keys.filter(k => k !== 'Hips')]) { const i = keys.indexOf(k); const rot = rq.clone().multiply(D[i][f]).multiply(A.get(k)).multiply(Qt0.get(k));
      let pos; if (k === 'Hips') { pos = ht0.clone().addScaledVector(ft.left, hx[f] - rx[f]).addScaledVector(ft.fwd, hz[f] - rz[f]).addScaledVector(up, hy[f]); } // Rest nach Abzug der Wurzel (im begradigten Raum)
      else { const o = offs.get(k); pos = o ? o.off.clone().applyMatrix4(WK.get(o.p)) : wpos(tm.get(k)); }
      WK.set(k, new THREE.Matrix4().compose(pos, rot, wscale.get(k))); }
    if (useIK) legIK(WK, rq, f);
    Wt.clear();
    for (const o of nodes) { const par = o.parent === T || !Wt.has(o.parent) ? (o.parent.matrixWorld) : Wt.get(o.parent); let W;
      const k = tk.get(o);
      if (k) W = WK.get(k); else if (follow.has(o)) W = new THREE.Matrix4().copy(WK.get(follow.get(o))).multiply(Wf0inv.get(o)); else W = new THREE.Matrix4().multiplyMatrices(par, L0.get(o));
      Wt.set(o, W); M.copy(tmpM.copy(par).invert()).multiply(W); M.decompose(P, Q, Sc);
      const t = twist.get(o), hk = t && t.k.replace('ForeArm', 'Hand'); if (t && WK.has(t.k) && WK.has(hk)) { // Unterarm-Drehknochen: Anteil der Handdrehung um die Unterarmachse
        const fw = new THREE.Quaternion(), hw = new THREE.Quaternion(), fp = new THREE.Vector3(), hp = new THREE.Vector3(); WK.get(t.k).decompose(fp, fw, _v2); WK.get(hk).decompose(hp, hw, _v2);
        const rigid = fw.clone().multiply(Qt0.get(t.k).clone().invert()).multiply(Qt0.get(hk)), d = hw.clone().multiply(rigid.invert()), ax = hp.sub(fp).normalize();
        const pr = ax.dot(_v.set(d.x, d.y, d.z)), tw = new THREE.Quaternion(ax.x * pr, ax.y * pr, ax.z * pr, d.w).normalize(); if (tw.w < 0) tw.set(-tw.x, -tw.y, -tw.z, -tw.w);
        const Wr = new THREE.Vector3(), Wq = new THREE.Quaternion(), Ws = new THREE.Vector3(); W.decompose(Wr, Wq, Ws); Wq.premultiply(new THREE.Quaternion().slerp(tw, t.w));
        W = new THREE.Matrix4().compose(Wr, Wq, Ws); Wt.set(o, W); M.copy(tmpM.copy(par).invert()).multiply(W); M.decompose(P, Q, Sc); }
      const r = out.get(o); Q.toArray(r.q, f * 4); P.toArray(r.p, f * 3); }
    for (const [si, S2] of ['Left', 'Right'].entries()) { const a = tm.get(S2 + 'Foot'), b = tm.get(S2 + 'ToeBase'); if (!a || !Wt.has(a)) continue; const p = new THREE.Vector3().setFromMatrixPosition(Wt.get(a)); if (b && Wt.has(b)) p.add(_v.setFromMatrixPosition(Wt.get(b))).multiplyScalar(.5); feet[si].push(p); } }
  // Fußkontakte: Standbein = tiefster Fuß (≤ 3 cm über seinem Tiefstwert). Tempo (lin) = Rückwärtsgeschwindigkeit des Standfußes (gilt für Clips mit und ohne Wurzelweg);
  // Rutschen = verbleibende Fußgeschwindigkeit im Stand bei Fortbewegung mit diesem Tempo (Prüfmaß, soll ≈ 0 sein)
  if (feet[0].length === N && feet[1].length === N && N > 3) { const h = feet.map(F2 => F2.map(p => p.dot(up))), mn = h.map(a => Math.min(...a)), vs = [], sl = [];
    const stance = (s2, f) => h[s2][f] < mn[s2] + .03 && h[s2][f] <= h[1 - s2][f] + .01;
    for (let f = 1; f < N; f++) for (const s2 of [0, 1]) if (stance(s2, f) && stance(s2, f - 1)) vs.push(-(feet[s2][f].dot(ft.fwd) - feet[s2][f - 1].dot(ft.fwd)) * fps);
    vs.sort((a, b) => a - b); const med = vs.length ? vs[vs.length >> 1] : 0;
    if (rm === 'lin') { meta.footSpeed = +Math.max(0, med).toFixed(3); meta.stance = vs.length; if (!useIK || meta.speed < .5 * med) meta.speed = Math.max(0, med); /* Clips auf der Stelle: Tempo aus dem Standfuß */ for (let f = 1; f < N; f++) for (const s2 of [0, 1]) if (stance(s2, f) && stance(s2, f - 1)) { const d = feet[s2][f].clone().sub(feet[s2][f - 1]); d.addScaledVector(up, -d.dot(up)); d.addScaledVector(ft.fwd, meta.speed / fps); sl.push(d.length() * fps); } }
    else for (let f = 1; f < N; f++) for (const s2 of [0, 1]) if (stance(s2, f) && stance(s2, f - 1)) { const d = feet[s2][f].clone().sub(feet[s2][f - 1]); d.addScaledVector(up, -d.dot(up)); sl.push(d.length() * fps); }
    sl.sort((a, b) => a - b); meta.slide = sl.length ? +sl[sl.length >> 1].toFixed(3) : 0;
    // Phase: Aufsetzen = Beginn des Standes je Fuß (normiert 0…1)
    for (const [s2, key] of [[0, 'phaseL'], [1, 'phaseR']]) { let best = -1; for (let f = 1; f < N; f++) if (stance(s2, f) && !stance(s2, f - 1)) { best = f; break; } if (best < 0) best = h[s2].indexOf(mn[s2]); meta[key] = +(best / (N - 1)).toFixed(3); }
    meta.footMin = +Math.min(mn[0], mn[1]).toFixed(3); }
  // Spuren: Drehungen der bewegten Knoten; Positionen, wo sie sich ändern (Becken, flache Knochen)
  const tracks = [], times = new Float32Array(N); for (let f = 0; f < N; f++) times[f] = f / fps;
  for (const o of nodes) { const r = out.get(o), q0 = new THREE.Quaternion().setFromRotationMatrix(L0.get(o)), p0 = new THREE.Vector3().setFromMatrixPosition(L0.get(o)); let qd = false, pd = false;
    for (let f = 0; f < N; f++) { const qq = r.q.subarray(f * 4, f * 4 + 4); if (Math.abs(Math.abs(qq[0] * q0.x + qq[1] * q0.y + qq[2] * q0.z + qq[3] * q0.w) - 1) > 1e-7) qd = true;
      const d = Math.hypot(r.p[f * 3] - p0.x, r.p[f * 3 + 1] - p0.y, r.p[f * 3 + 2] - p0.z), L = Math.max(p0.length(), 1e-6); if (d > L * 1e-4 + 1e-6) pd = true; }
    for (let f = 1; f < N; f++) { const a = r.q, i = f * 4, j = i - 4; if (a[i] * a[j] + a[i + 1] * a[j + 1] + a[i + 2] * a[j + 2] + a[i + 3] * a[j + 3] < 0) for (let c = 0; c < 4; c++) a[i + c] = -a[i + c]; }
    if (qd || tk.has(o)) tracks.push({ node: o, path: 'quaternion', times, values: r.q });
    if (pd && (tk.has(o) || follow.has(o))) tracks.push({ node: o, path: 'position', times, values: r.p }); }
  // nahtlose Schleife: Restfehler Ende→Anfang über die ganze Länge verteilen
  if (opt.loop) for (const tr of tracks) { const v = tr.values, n = tr.path === 'quaternion' ? 4 : 3;
    if (n === 4) { const qa = new THREE.Quaternion().fromArray(v, 0), qb = new THREE.Quaternion().fromArray(v, (N - 1) * 4), err = qa.clone().multiply(qb.clone().invert()), c = new THREE.Quaternion(), q = new THREE.Quaternion();
      for (let f = 0; f < N; f++) { c.identity().slerp(err, f / (N - 1)); q.fromArray(v, f * 4).premultiply(c).normalize().toArray(v, f * 4); } }
    else { const e = [0, 1, 2].map(c => v[c] - v[(N - 1) * 3 + c]); for (let f = 0; f < N; f++) for (let c = 0; c < 3; c++) v[f * 3 + c] += e[c] * f / (N - 1); } }
  meta.speed = +meta.speed.toFixed(4); meta.turn = +meta.turn.toFixed(4); meta.frames = [i0, i1]; meta.fams = sfam + '→' + tfam; meta.bones = keys.length;
  return { tracks, duration: (N - 1) / fps, meta };
}

// ---------- Keyframe-Reduktion: Schlüssel weglassen, die sich aus den Nachbarn interpolieren lassen (Drehung ≤ tolR rad, Position ≤ tolP · Länge)
export function reduce(times, values, n, tol) { const N = times.length; if (N <= 2) return { times, values };
  const keep = [0]; let a = 0; const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qi = new THREE.Quaternion(), qx = new THREE.Quaternion();
  const err = (a, b) => { for (let i = a + 1; i < b; i++) { const t = (times[i] - times[a]) / (times[b] - times[a]);
      if (n === 4) { qa.fromArray(values, a * 4); qb.fromArray(values, b * 4); qi.slerpQuaternions(qa, qb, t); qx.fromArray(values, i * 4); if (2 * Math.acos(Math.min(1, Math.abs(qi.dot(qx)))) > tol) return true; }
      else { for (let c = 0; c < n; c++) { const v = values[a * n + c] + (values[b * n + c] - values[a * n + c]) * t; if (Math.abs(v - values[i * n + c]) > tol) return true; } } } return false; };
  for (let b = 2; b < N; b++) if (err(a, b)) { keep.push(b - 1); a = b - 1; }
  keep.push(N - 1);
  const T2 = new Float32Array(keep.length), V2 = new Float32Array(keep.length * n); keep.forEach((k, i) => { T2[i] = times[k]; for (let c = 0; c < n; c++) V2[i * n + c] = values[k * n + c]; }); return { times: T2, values: V2 }; }

// Hilfe für three.js: Spuren → AnimationClip (Vorschau in der Werkstatt)
export function toClip(name, r) { const tr = r.tracks.map(t => new (t.path === 'quaternion' ? THREE.QuaternionKeyframeTrack : THREE.VectorKeyframeTrack)(t.node.uuid + '.' + t.path, t.times, t.values)); const c = new THREE.AnimationClip(name, r.duration, tr); c.userData = r.meta; return c; }
