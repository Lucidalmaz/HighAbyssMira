// R-21 · Der Beobachter: Netz verschweißen, Lider aus den eigenen Augen, Skelett (aus der Gestalt gemessen), Hautgewichte, Hautattribute.
import * as THREE from 'three'; import { MeshBVH } from 'three-mesh-bvh';
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, k) => a + (b - a) * k;
// ---------------------------------------------------------------- Verschweißen (gleiche Lage + gleiche UV = eine Ecke): das Original hat je Dreieck eigene Ecken
export function schweissen(t) { const key = new Map(), map = new Int32Array(t.pos.length / 3), P = [], U = []; let n = 0;
  for (let i = 0; i < map.length; i++) { const k = Math.round(t.pos[i * 3] * 1e5) + ',' + Math.round(t.pos[i * 3 + 1] * 1e5) + ',' + Math.round(t.pos[i * 3 + 2] * 1e5) + ',' + Math.round(t.uv[i * 2] * 4e3) + ',' + Math.round(t.uv[i * 2 + 1] * 4e3);
    let j = key.get(k); if (j === undefined) { j = n++; key.set(k, j); P.push(t.pos[i * 3], t.pos[i * 3 + 1], t.pos[i * 3 + 2]); U.push(t.uv[i * 2], t.uv[i * 2 + 1]); } map[i] = j; }
  const idx = []; for (let k = 0; k < t.idx.length; k += 3) { const a = map[t.idx[k]], b = map[t.idx[k + 1]], c = map[t.idx[k + 2]]; if (a !== b && b !== c && a !== c) idx.push(a, b, c); }
  return { pos: new Float32Array(P), uv: new Float32Array(U), idx: Uint32Array.from(idx) }; }
// ---------------------------------------------------------------- Kugel durch Punkte (algebraisch, kleinste Quadrate)
function kugel(pts) { const A = Array.from({ length: 4 }, () => new Float64Array(4)), b = new Float64Array(4);
  for (const [x, y, z] of pts) { const r = [2 * x, 2 * y, 2 * z, 1], f = x * x + y * y + z * z; for (let i = 0; i < 4; i++) { b[i] += r[i] * f; for (let j = 0; j < 4; j++) A[i][j] += r[i] * r[j]; } }
  for (let i = 0; i < 4; i++) { let p = i; for (let k = i + 1; k < 4; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k; [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
    for (let k = i + 1; k < 4; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j < 4; j++) A[k][j] -= f * A[i][j]; b[k] -= f * b[i]; } }
  const x = new Float64Array(4); for (let i = 3; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < 4; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
  const c = new THREE.Vector3(x[0], x[1], x[2]); return { c, r: Math.sqrt(x[3] + c.lengthSq()) }; }
// ---------------------------------------------------------------- Augen: Rahmen je Auge, eigene UV (Planprojektion), Oberlid aus der Augenkappe
export function augen(E) { const P = E.pos, seiten = {};
  for (const s of [1, -1]) { const pts = []; for (let i = 0; i < P.length; i += 3) if (Math.sign(P[i]) === s) pts.push([P[i], P[i + 1], P[i + 2]]);
    const K = kugel(pts), m = new THREE.Vector3(); pts.forEach(p => m.add(new THREE.Vector3(...p))); m.divideScalar(pts.length);
    const f = m.clone().sub(K.c).normalize(), u = new THREE.Vector3(0, 1, 0).addScaledVector(f, -f.y).normalize(), r = new THREE.Vector3().crossVectors(u, f);
    let A = 0; for (const p of pts) { const d = new THREE.Vector3(...p).sub(K.c).normalize(); A = Math.max(A, Math.acos(Math.min(1, d.dot(f)))); }
    seiten[s] = { c: K.c, R: K.r, f, u, r, A }; }
  const uv = new Float32Array(P.length / 3 * 2), v = new THREE.Vector3();
  for (let i = 0; i < P.length / 3; i++) { const S = seiten[Math.sign(P[i * 3]) || 1]; v.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]).sub(S.c); const k = .5 / (S.R * Math.sin(S.A)); uv[i * 2] = .5 + v.dot(S.r) * k; uv[i * 2 + 1] = .5 + v.dot(S.u) * k; }
  E.uv = uv; return seiten; }
// Oberlid: die Augenkappe wird auf eine etwas größere Kugel gelegt und nach oben gefaltet (Unterkante = Lidrand), Rand rollt zum Auge ein.
// In Ruhe deckt es das obere Viertel (schwere Lider: müde, lauernd), beim Blinzeln dreht der Lid-Knochen es über das Auge.
export const LID = { ruhe: .3, rand: .12 }; // ruhe: Anteil des Auges, den das Lid in Ruhe deckt (von oben)
export function lider(E, seiten) { const P = E.pos, I = E.idx, outP = [], outI = [], v = new THREE.Vector3(), d = new THREE.Vector3();
  for (const s of [1, -1]) { const S = seiten[s], map = new Map();
    const eckeVon = i => { if (map.has(i)) return map.get(i); v.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]).sub(S.c).normalize();
      const al = Math.atan2(v.dot(S.r), v.dot(S.f)), be = Math.atan2(v.dot(S.u), Math.hypot(v.dot(S.r), v.dot(S.f))); // waagerecht / senkrecht
      const q = (be + S.A) / (2 * S.A), b0 = S.A * (1 - 2 * LID.ruhe), be2 = b0 + q * 2.3 * S.A, al2 = al * 1.14; // Unterkante bei b0, reicht weit nach oben unter die Haut
      const roll = 1 - sm(0, LID.rand, q), R2 = S.R * (1.075 - .06 * roll * roll); // Rand rollt zum Augapfel
      d.copy(S.f).multiplyScalar(Math.cos(be2) * Math.cos(al2)).addScaledVector(S.r, Math.cos(be2) * Math.sin(al2)).addScaledVector(S.u, Math.sin(be2));
      const j = outP.length / 3; outP.push(S.c.x + d.x * R2, S.c.y + d.y * R2, S.c.z + d.z * R2); map.set(i, j); return j; };
    for (let t = 0; t < I.length; t += 3) { const a = I[t], b = I[t + 1], c = I[t + 2]; if (Math.sign(P[a * 3]) !== s) continue; outI.push(eckeVon(a), eckeVon(b), eckeVon(c)); } }
  return { pos: new Float32Array(outP), uv: new Float32Array(outP.length / 3 * 2), idx: Uint32Array.from(outI) }; }
// ---------------------------------------------------------------- Messen: Gelenkorte aus der Gestalt
const box = (P, f) => { const b = new THREE.Box3(); const v = new THREE.Vector3(); for (let i = 0; i < P.length; i += 3) if (!f || f(P[i], P[i + 1], P[i + 2])) b.expandByPoint(v.set(P[i], P[i + 1], P[i + 2])); return b; };
const mitte = (P, f) => { const m = new THREE.Vector3(); let n = 0; for (let i = 0; i < P.length; i += 3) if (f(P[i], P[i + 1], P[i + 2])) { m.x += P[i]; m.y += P[i + 1]; m.z += P[i + 2]; n++; } return n ? m.divideScalar(n) : null; };
export function messen(T, seiten) { const A = T.arm.pos, K = T.koerper.pos, H = T.kopf.pos; const J = {};
  // Beine: Schritt = höchster Punkt der Lücke zwischen den Beinen (|x| klein, unten)
  let schritt = 0; for (let i = 0; i < K.length; i += 3) if (Math.abs(K[i]) < .006 && K[i + 1] < .4) schritt = Math.max(schritt, K[i + 1] < .35 ? 0 : 0);
  const legC = (s, y) => mitte(K, (x, yy) => Math.sign(x) === s && Math.abs(yy - y) < .006 && Math.abs(x) > .006);
  // Lücke: von unten nach oben die erste Höhe, auf der die Beine zusammenwachsen
  for (let y = .05; y < .4; y += .004) { let gap = 1; for (let i = 0; i < K.length; i += 3) if (Math.abs(K[i + 1] - y) < .002 && Math.abs(K[i]) < .004) { gap = 0; break; } if (!gap) { schritt = y; break; } }
  J.schritt = schritt;
  for (const s of [1, -1]) { const S = s > 0 ? 'L' : 'R';
    const hip = legC(s, schritt - .012), knee = legC(s, schritt * .5), ank = legC(s, .045), sole = box(K, (x, y) => Math.sign(x) === s && y < .02);
    J['oberschenkel' + S] = new THREE.Vector3(hip.x * .9, schritt + .006, hip.z); J['schienbein' + S] = new THREE.Vector3(knee.x, knee.y, knee.z + .004); J['fuss' + S] = new THREE.Vector3(ank.x, .042, ank.z);
    const toeZ = sole.max.z; J['zehen' + S] = new THREE.Vector3(ank.x, .014, lerp(ank.z, toeZ, .48)); J['zehenspitze' + S] = new THREE.Vector3(ank.x, .006, toeZ);
    // Arm: Schulter = oberes Ende, Handgelenk = Fingeransatz
    const ab = box(A, x => Math.sign(x) === s), sh = mitte(A, (x, y) => Math.sign(x) === s && y > ab.max.y - .025);
    // Finger: unterste 30 mm, drei Häufchen
    const fing = []; for (let i = 0; i < A.length; i += 3) if (Math.sign(A[i]) === s && A[i + 1] < ab.min.y + .034) fing.push([A[i], A[i + 1], A[i + 2]]);
    let c = [-.03, -.01, .01].map(z => [ab.min.x * 0 + (s > 0 ? ab.max.x : ab.min.x) - s * .012, z]);
    for (let it = 0; it < 15; it++) { const acc = c.map(() => [0, 0, 0]); for (const p of fing) { let b = 0, bd = 1e9; c.forEach((q, k) => { const d = (p[0] - q[0]) ** 2 + (p[2] - q[1]) ** 2; if (d < bd) { bd = d; b = k; } }); acc[b][0] += p[0]; acc[b][1] += p[2]; acc[b][2]++; } c = c.map((q, k) => acc[k][2] ? [acc[k][0] / acc[k][2], acc[k][1] / acc[k][2]] : q); }
    c.sort((a, b) => a[1] - b[1]); // hinten → vorn
    // Fingeransatz: Höhe, ab der unter dem Handballen die drei Finger getrennt sind (grob: 30 mm über der tiefsten Spitze)
    const tipY = ab.min.y, baseY = tipY + .03; const wrist = mitte(A, (x, y) => Math.sign(x) === s && Math.abs(y - (baseY + .018)) < .004);
    J['schulter' + S] = new THREE.Vector3(sh.x - s * .012, sh.y - .012, sh.z); J['oberarm' + S] = new THREE.Vector3(sh.x, sh.y - .018, sh.z);
    J['hand' + S] = wrist.clone(); J['unterarm' + S] = J['oberarm' + S].clone().lerp(wrist, .5).add(new THREE.Vector3(0, 0, -.006));
    c.forEach((q, k) => { const tip = mitte(A, (x, y, z) => Math.sign(x) === s && y < tipY + .008 && (x - q[0]) ** 2 + (z - q[1]) ** 2 < .008 ** 2) || new THREE.Vector3(q[0], tipY, q[1]);
      J['finger' + (k + 1) + S] = new THREE.Vector3(q[0], baseY, q[1]); J['fingerB' + (k + 1) + S] = new THREE.Vector3(lerp(q[0], tip.x, .5), lerp(baseY, tipY, .5), lerp(q[1], tip.z, .5)); J['fingerS' + (k + 1) + S] = new THREE.Vector3(tip.x, tipY, tip.z); });
    J['lid' + S] = seiten[s].c.clone(); }
  // Rumpf/Hals/Kopf
  const hb = box(H, (x, y, z) => Math.hypot(x, z) > .03 || y < .7); // Kopf ohne Fühler
  const halsB = box(K, (x, y) => y > J.schritt + .2); J.kopfUnten = hb.min.y;
  const halsAt = y => mitte(K, (x, yy) => Math.abs(yy - y) < .004) || new THREE.Vector3(0, y, 0);
  J.becken = new THREE.Vector3(0, schritt + .03, halsAt(schritt + .03).z); J.bauch = new THREE.Vector3(0, schritt + .09, halsAt(schritt + .09).z - .01); J.brust = new THREE.Vector3(0, schritt + .17, halsAt(schritt + .17).z - .012);
  const schulterY = (J.oberarmL.y + J.oberarmR.y) / 2; J.hals = new THREE.Vector3(0, schulterY + .012, halsAt(schulterY + .012).z); J.hals2 = new THREE.Vector3(0, lerp(J.hals.y, hb.min.y, .55), halsAt(lerp(J.hals.y, hb.min.y, .55)).z);
  J.kopf = new THREE.Vector3(0, hb.min.y + .02, halsAt(hb.min.y - .005).z); J.kehle = new THREE.Vector3(0, lerp(J.hals.y, hb.min.y, .5), J.hals2.z + .012);
  J.kopfOben = hb.max.y; J.kopfMitte = hb.getCenter(new THREE.Vector3());
  // Fühler: Ecken über dem Schädel, je Seite: Fuß, zwei Glieder, Kopf (Kugel an der Spitze)
  for (const s of [1, -1]) { const S = s > 0 ? 'L' : 'R'; const fp = []; for (let i = 0; i < H.length; i += 3) if (Math.sign(H[i]) === s && H[i + 1] > hb.max.y - .01 && Math.abs(H[i]) > .006) fp.push(new THREE.Vector3(H[i], H[i + 1], H[i + 2]));
    let tip = fp[0]; for (const p of fp) if (p.y + Math.abs(p.x) > tip.y + Math.abs(tip.x)) tip = p; const base = mitte(H, (x, y) => Math.sign(x) === s && Math.abs(y - (hb.max.y - .004)) < .004 && Math.abs(x) > .006 && Math.abs(x) < .06);
    J['fuehler1' + S] = base.clone(); J['fuehler2' + S] = base.clone().lerp(tip, .36); J['fuehler3' + S] = base.clone().lerp(tip, .72); J['fuehlerS' + S] = tip.clone(); }
  return J; }
// ---------------------------------------------------------------- Skelett (Eltern, Gelenkort-Schlüssel)
export const KNOCHEN = [['wurzel', null], ['becken', 'wurzel'], ['bauch', 'becken'], ['brust', 'bauch'], ['hals', 'brust'], ['hals2', 'hals'], ['kehle', 'hals'], ['kopf', 'hals2']];
for (const S of ['L', 'R']) KNOCHEN.push(['lid' + S, 'kopf'], ['fuehler1' + S, 'kopf'], ['fuehler2' + S, 'fuehler1' + S], ['fuehler3' + S, 'fuehler2' + S],
  ['schulter' + S, 'brust'], ['oberarm' + S, 'schulter' + S], ['unterarm' + S, 'oberarm' + S], ['hand' + S, 'unterarm' + S],
  ['finger1' + S, 'hand' + S], ['fingerB1' + S, 'finger1' + S], ['finger2' + S, 'hand' + S], ['fingerB2' + S, 'finger2' + S], ['finger3' + S, 'hand' + S], ['fingerB3' + S, 'finger3' + S],
  ['oberschenkel' + S, 'becken'], ['schienbein' + S, 'oberschenkel' + S], ['fuss' + S, 'schienbein' + S], ['zehen' + S, 'fuss' + S]);
export const ENDE = { kopf: J => new THREE.Vector3(0, J.kopfOben, J.kopf.z), kehle: J => J.kehle.clone().add(new THREE.Vector3(0, .01, .01)) }; // Strecken für Blätter
for (const S of ['L', 'R']) Object.assign(ENDE, { ['fuehler3' + S]: J => J['fuehlerS' + S], ['zehen' + S]: J => J['zehenspitze' + S], ['lid' + S]: J => J['lid' + S].clone().add(new THREE.Vector3(0, .02, .02)) },
  Object.fromEntries([1, 2, 3].map(k => ['fingerB' + k + S, J => J['fingerS' + k + S]])));
export function strecken(J) { const kid = {}; for (const [n, p] of KNOCHEN) if (p && !kid[p] && !/^(kehle|lid|fuehler1|schulter|oberschenkel|finger[123])/.test(n)) kid[p] = n;
  kid.hand = null; kid.becken = 'bauch'; kid.hals = 'hals2'; kid.brust = 'hals'; kid.wurzel = null;
  for (const S of ['L', 'R']) { kid['hand' + S] = null; kid['schulter' + S] = 'oberarm' + S; kid['fuehler1' + S] = 'fuehler2' + S; for (const k of [1, 2, 3]) kid['finger' + k + S] = 'fingerB' + k + S; }
  const seg = {}; for (const [n] of KNOCHEN) { const a = J[n] || new THREE.Vector3(); let b = ENDE[n] ? ENDE[n](J) : kid[n] ? J[kid[n]] : null;
    if (!b && /^hand/.test(n)) { const S = n.slice(-1); b = J['finger2' + S]; } if (!b) b = a.clone().add(new THREE.Vector3(0, .01, 0)); seg[n] = { a: a.clone(), b: b.clone() }; } return seg; }
// ---------------------------------------------------------------- Gewichte: weicher Abstand zu den Knochenstrecken, Kandidaten je Teil/Region
function segD(s, p) { const ab = s.b.clone().sub(s.a), L2 = ab.lengthSq() || 1e-9, t = Math.max(0, Math.min(1, p.clone().sub(s.a).dot(ab) / L2)); return p.distanceTo(s.a.clone().addScaledVector(ab, t)); }
export function gewichte(teil, art, J, seg) { const P = teil.pos, n = P.length / 3, JI = new Uint16Array(n * 4), WW = new Float32Array(n * 4), idx = new Map(KNOCHEN.map(([k], i) => [k, i])), p = new THREE.Vector3();
  for (let i = 0; i < n; i++) { p.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); const S = p.x >= 0 ? 'L' : 'R'; let C, sig = .012;
    if (art === 'augen') C = ['kopf']; else if (art === 'lider') C = ['lid' + S];
    else if (art === 'kopf') { const fu = p.y > J.kopfOben - .012 && Math.abs(p.x) > .004 && Math.hypot(p.x - J['fuehler1' + S].x, p.z - J['fuehler1' + S].z) < .05; C = fu ? ['kopf', 'fuehler1' + S, 'fuehler2' + S, 'fuehler3' + S] : ['kopf']; sig = .008; }
    else if (art === 'arm') { C = ['brust', 'schulter' + S, 'oberarm' + S, 'unterarm' + S, 'hand' + S, ...[1, 2, 3].flatMap(k => ['finger' + k + S, 'fingerB' + k + S])]; if (p.y < J['hand' + S].y - .006) { C = C.filter(c => /finger|hand/.test(c)); sig = .004; } }
    else { // Körper
      const y = p.y; if (y < J.schritt - .004 && Math.abs(p.x) > .002) { C = ['becken', 'oberschenkel' + S, 'schienbein' + S, 'fuss' + S, 'zehen' + S]; sig = y < .06 ? .008 : .014; }
      else if (y > J.hals.y - .02) C = ['brust', 'hals', 'hals2', 'kehle', 'kopf', 'schulter' + S]; else C = ['becken', 'bauch', 'brust', 'oberschenkel' + S, 'schulter' + S]; }
    const d = C.map(c => segD(seg[c], p)); let dm = Math.min(...d); const w = d.map((v, k) => [C[k], Math.exp(-(v - dm) / sig)]);
    if (art === 'koerper' && p.y > J.hals.y - .02) { const k = w.find(e => e[0] === 'kehle'); const vorn = p.z - J.hals2.z; k[1] *= vorn > .004 ? .9 : 0; } // Kehle nur vorn am Hals
    if (art === 'arm') { const b = w.find(e => e[0] === 'brust'); b[1] *= .35; }
    const L = w.sort((a, b) => b[1] - a[1]).slice(0, 4), sum = L.reduce((a, b) => a + b[1], 0); L.forEach(([k, a], j) => { JI[i * 4 + j] = idx.get(k); WW[i * 4 + j] = a / sum; }); }
  teil.ji = JI; teil.ww = WW; }
// ---------------------------------------------------------------- Haut: Höhlen (AO), Dicke (Durchscheinen), Falten an Gelenken, Adernstärke, Grundfarbe je Ecke
export function haut(teile, J) { const alle = Object.entries(teile).filter(([k, t]) => t && t.pos && k !== 'augen');
  // ein Netz für die Strahlen (inkl. Augen)
  let n = 0; for (const [, t] of Object.entries(teile)) if (t && t.pos) n += t.pos.length; const pos = new Float32Array(n), idx = []; let o = 0;
  for (const [, t] of Object.entries(teile)) { if (!t || !t.pos) continue; pos.set(t.pos, o); const b = o / 3; for (const k of t.idx) idx.push(k + b); o += t.pos.length; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); const bvh = new MeshBVH(g), mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const ray = new THREE.Ray(), dir = new THREE.Vector3(), p = new THREE.Vector3(), nrm = new THREE.Vector3(), up = new THREE.Vector3(), tA = new THREE.Vector3(), tB = new THREE.Vector3();
  const halb = []; for (let k = 0; k < 24; k++) { const a = k * 2.399963, z = (k + .5) / 24, r = Math.sqrt(1 - z * z); halb.push([Math.cos(a) * r, Math.sin(a) * r, z]); } // Halbkugel (Fibonacci)
  for (const [art, t] of alle) { const P = t.pos, N = t.nrm, m = P.length / 3, ao = new Float32Array(m), H4 = new Float32Array(m * 4), col = new Float32Array(m * 3);
    for (let i = 0; i < m; i++) { p.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); nrm.set(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]).normalize(); up.set(Math.abs(nrm.y) < .9 ? 0 : 1, Math.abs(nrm.y) < .9 ? 1 : 0, 0); tA.crossVectors(up, nrm).normalize(); tB.crossVectors(nrm, tA);
      let occ = 0; for (const [a, b, c] of halb) { dir.copy(tA).multiplyScalar(a).addScaledVector(tB, b).addScaledVector(nrm, c); ray.origin.copy(p).addScaledVector(nrm, .0008); ray.direction.copy(dir); const h = bvh.raycastFirst(ray, THREE.DoubleSide); if (h && h.distance < .06) occ += (1 - h.distance / .06) * c; }
      ao[i] = Math.max(0, 1 - occ / 12 * 1.35);
      // Dicke: Strahl nach innen bis zur Gegenseite
      ray.origin.copy(p).addScaledVector(nrm, -.0008); ray.direction.copy(nrm).negate(); const h2 = bvh.raycastFirst(ray, THREE.DoubleSide); const dk = h2 ? h2.distance : .2; const duenn = 1 - sm(.008, .07, dk);
      // Falten an Gelenken: Stärke (Nähe zum Gelenk) und Koordinate entlang der Gliedmaße (Querrillen)
      let falte = 0, fk = 0; const S = p.x >= 0 ? 'L' : 'R';
      const gel = art === 'arm' ? [['unterarm' + S, .018, 'oberarm' + S], ['hand' + S, .012, 'unterarm' + S], ...[1, 2, 3].map(k => ['fingerB' + k + S, .006, 'finger' + k + S])]
        : art === 'koerper' ? [['schienbein' + S, .02, 'oberschenkel' + S], ['fuss' + S, .016, 'schienbein' + S], ['hals2', .03, 'hals'], ['bauch', .03, 'becken'], ['zehen' + S, .01, 'fuss' + S]] : art === 'kopf' ? [['kopf', .025, 'hals2']] : [];
      for (const [jn, rad, par] of gel) { const jp = J[jn], d = p.distanceTo(jp); const s = Math.exp(-(d / rad) ** 2); if (s > falte) { falte = s; const ax = jp.clone().sub(J[par]).normalize(); fk = p.clone().sub(jp).dot(ax); } }
      if (art === 'koerper' && p.y > J.hals.y - .01 && p.y < J.kopfUnten + .01) { falte = Math.max(falte, .8); fk = p.y; } // ganzer Hals: Ringe
      if (art === 'lider') { falte = .6; fk = p.y; }
      // Adern: wo die Haut dünn ist und an Schläfen, Kehle, Handgelenk, Bauch
      const sch = art === 'kopf' ? Math.exp(-((Math.abs(p.x) - .11) / .04) ** 2 - ((p.y - (J.lidL.y + .03)) / .05) ** 2) : 0;
      const ad = Math.min(1, duenn * .7 + sch * .8 + (art === 'arm' ? .35 : 0) + (art === 'koerper' && p.y > J.hals.y - .02 ? .5 : 0) + (art === 'koerper' && p.z > J.bauch.z + .02 && Math.abs(p.y - J.bauch.y) < .05 ? .3 : 0));
      H4.set([duenn, falte, fk, ad], i * 4);
      // Grundfarbe: Perlweiß/Kerzenwachs; dünne Stellen rosig (Blut dahinter), Höhlen kühl-grau, Schädelkuppe gelblicher (älteres Wachs)
      const a = Math.pow(ao[i], 1.25); let r = .9, gg = .885, b = .855; const ros = duenn * .55; r += .03 * ros; gg -= .05 * ros; b -= .035 * ros;
      const kuppe = art === 'kopf' ? sm(J.kopfMitte.y, J.kopfOben, p.y) * .5 : 0; b -= .03 * kuppe; gg -= .006 * kuppe;
      const kalt = 1 - a; col.set([r * lerp(1, .72, kalt) * a + .02 * kalt, gg * lerp(1, .74, kalt) * a + .025 * kalt, b * lerp(1, .8, kalt) * a + .04 * kalt], i * 3); }
    t.ao = ao; t.haut = H4; t.farbe = col; }
}
