// =====================================================================  GRIFF (Modul „griff“, R-5): Ich-Hände greifen um Dinge herum, nie hindurch
// Gemeinsamer Korrektur-Durchgang für alle Ich-Hände (Detective Hands): Beutel/Album (album.js), Joint-Szene (kiffen.js), Kater tragen (kapitel5.js).
// Ablauf je Hand, NACH dem Posen (Knochen B = { fore, hand, f[5][3], bindF[5][3] } wie in album_hand/kf_applyHand/k5_hand):
//   1. Handfläche und Unterarm: liegen Handwurzel, Fingergrundgelenke oder Unterarm in einer Kollisionsform, wird der ganze Arm entlang der
//      Flächennormalen herausgeschoben (Formen, die diese Hand selbst hält – halt: 'L'|'R' –, schieben nicht: die Requisite hängt an der Hand).
//   2. Finger-IK gegen die Formen: jeder Finger wird als Ganzes geöffnet (Beugung skaliert zur Bindepose hin), bis Glieder und Kuppe außerhalb
//      liegen (Haut ~4–9 mm); mit anlegen schließt er stattdessen bis zur Berührung (echter Griff um das Objekt, höchstens +35 % Beugung).
//   Formen (je Objekt einfach gehalten): Kasten { art: 'kasten', o, m?, min, max } · Zylinder { art: 'zyl', o, m?, c, r, h } (Achse lokal y)
//   · Kapsel { art: 'kapsel', a, b, r } (Weltpunkte, vom Aufrufer gesetzt). an = false schaltet eine Form ab. Keine Allokationen im Takt.
// Prüfung (Selbsttest, Schlüsselmomente): griff_pruefen(B, meshes) zählt Finger- und Handpunkte, die im echten Objekt-Mesh liegen (Strahl-Parität).
const GRIFF = { v0: new THREE.Vector3(), v1: new THREE.Vector3(), v2: new THREE.Vector3(), v3: new THREE.Vector3(), n: new THREE.Vector3(), nb: new THREE.Vector3(), push: new THREE.Vector3(),
  l: new THREE.Vector3(), q0: new THREE.Quaternion(), q1: new THREE.Quaternion(), m0: new THREE.Matrix4(), ax: new THREE.Vector3(), PT: [], PR: [], n0: 0, stat: { schub: 0, offen: 0, zu: 0 } };
for (let i = 0; i < 12; i++) { GRIFF.PT.push(new THREE.Vector3()); GRIFF.PR.push(0); }
// Fingerdicke (Radius in m, Glied 1 Mitte · Mittelgelenk · Glied 2 Mitte · Endgelenk · Glied 3 Mitte · Kuppe) – Daumen etwas kräftiger, kleiner Finger schmaler
const GRIFF_R = [.0088, .0084, .0078, .0072, .0066, .0058], GRIFF_FS = [1.1, 1, 1.02, .97, .86];
// Gelenkgrenzen (rad) je Glied: Grund-, Mittel-, Endgelenk
const GRIFF_LIM = [1.6, 1.85, 1.35];
function griff_kasten(o, min, max, m) { const F = { art: 'kasten', o, m: m || null, c: new THREE.Vector3(), hh: new THREE.Vector3(), mw: new THREE.Matrix4(), inv: new THREE.Matrix4(), s: 1, an: true, halt: null, frei: null };
  griff_kastenSetzen(F, min, max); return F; }
function griff_kastenSetzen(F, min, max) { F.c.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2); F.hh.set(Math.abs(max.x - min.x) / 2, Math.abs(max.y - min.y) / 2, Math.abs(max.z - min.z) / 2); }
function griff_zyl(o, c, r, h, m) { return { art: 'zyl', o, m: m || null, c: c.clone(), r, h, mw: new THREE.Matrix4(), inv: new THREE.Matrix4(), s: 1, an: true, halt: null, frei: null }; }
function griff_kapsel(r) { return { art: 'kapsel', a: new THREE.Vector3(), b: new THREE.Vector3(), r, an: true, halt: null, frei: null }; }
// Kasten aus der Geometrie eines Objekts (im Raum von bezug, Standard: das Objekt selbst) – einmal beim Aufbau
function griff_kastenVon(obj, bezug, filter) { const b = new THREE.Box3(), v = new THREE.Vector3(), M = new THREE.Matrix4(); bezug = bezug || obj; bezug.updateWorldMatrix(true, true); const inv = new THREE.Matrix4().copy(bezug.matrixWorld).invert();
  obj.traverse(o => { if (!o.isMesh || !o.geometry || (filter && !filter(o))) return; const P = o.geometry.attributes.position; if (!P) return; M.multiplyMatrices(inv, o.matrixWorld);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(M); b.expandByPoint(v); } });
  return b.isEmpty() ? null : griff_kasten(bezug, b.min, b.max); }
// Weltlage aller aktiven Formen einmal je Bild auffrischen (vor griff_loesen)
function griff_formen(L) { for (const F of L) { if (!F.an || F.art === 'kapsel') continue; F.o.updateWorldMatrix(true, false); if (F.m) F.mw.multiplyMatrices(F.o.matrixWorld, F.m); else F.mw.copy(F.o.matrixWorld); F.inv.copy(F.mw).invert(); F.s = F.mw.getMaxScaleOnAxis(); } }
// Vorzeichenbehafteter Abstand (m) von Weltpunkt p zur Form, n = Flächennormale nach außen (Welt)
function griff_sd(F, p, n) { const G = GRIFF;
  if (F.art === 'kapsel') { const ab = G.v2.subVectors(F.b, F.a), L2 = ab.lengthSq(); let t = L2 > 1e-10 ? G.v3.subVectors(p, F.a).dot(ab) / L2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    n.copy(F.a).addScaledVector(ab, t); n.subVectors(p, n); const d = n.length(); if (d > 1e-7) n.multiplyScalar(1 / d); else n.set(0, 1, 0); return d - F.r; }
  const l = G.l.copy(p).applyMatrix4(F.inv);
  if (F.art === 'zyl') { const dx = l.x - F.c.x, dz = l.z - F.c.z, rr = Math.hypot(dx, dz), a = rr - F.r, dy = l.y - F.c.y, b = Math.abs(dy) - F.h, sy = dy < 0 ? -1 : 1; let d;
    const ux = rr > 1e-7 ? dx / rr : 1, uz = rr > 1e-7 ? dz / rr : 0;
    if (a > 0 || b > 0) { const ax = a > 0 ? a : 0, bx = b > 0 ? b : 0; d = Math.hypot(ax, bx); n.set(ux * ax, sy * bx, uz * ax); }
    else if (a > b) { d = a; n.set(ux, 0, uz); } else { d = b; n.set(0, sy, 0); }
    n.transformDirection(F.mw); return d * F.s; }
  const qx = Math.abs(l.x - F.c.x) - F.hh.x, qy = Math.abs(l.y - F.c.y) - F.hh.y, qz = Math.abs(l.z - F.c.z) - F.hh.z, sx = l.x < F.c.x ? -1 : 1, sy = l.y < F.c.y ? -1 : 1, sz = l.z < F.c.z ? -1 : 1; let d;
  if (qx > 0 || qy > 0 || qz > 0) { const ax = qx > 0 ? qx : 0, ay = qy > 0 ? qy : 0, az = qz > 0 ? qz : 0; d = Math.hypot(ax, ay, az); n.set(sx * ax, sy * ay, sz * az); }
  else if (qx >= qy && qx >= qz) { d = qx; n.set(sx, 0, 0); } else if (qy >= qz) { d = qy; n.set(0, sy, 0); } else { d = qz; n.set(0, 0, sz); }
  n.transformDirection(F.mw); return d * F.s; }
// Hand vorbereiten: Kuppen-Knochen (…4) und Zwischenspeicher
function griff_hand(B) { B.gTip = []; B.gQ = []; B.gA = []; B.gW = []; B.gK = [];
  for (let fi = 0; fi < 5; fi++) { const ch = B.f[fi]; let tip = null; if (ch[2]) for (const c of ch[2].children) if (c.isBone) { tip = c; break; }
    B.gTip.push(tip); B.gQ.push([new THREE.Quaternion(), new THREE.Quaternion(), new THREE.Quaternion()]); B.gA.push([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]); B.gW.push([0, 0, 0]); B.gK.push(-1); } }
// Fingerpunkte (Welt) samt Radien in GRIFF.PT/PR; Rückgabe: Anzahl
function griff_fPunkte(B, fi) { const G = GRIFF, ch = B.f[fi], tip = B.gTip[fi], s = GRIFF_FS[fi]; let n = 0;
  const p1 = G.v0.setFromMatrixPosition(ch[0].matrixWorld), p2 = G.v1.setFromMatrixPosition(ch[1].matrixWorld), p3 = G.v2.setFromMatrixPosition(ch[2].matrixWorld);
  G.PT[n].lerpVectors(p1, p2, .5); G.PR[n++] = GRIFF_R[0] * s; G.PT[n].copy(p2); G.PR[n++] = GRIFF_R[1] * s; G.PT[n].lerpVectors(p2, p3, .5); G.PR[n++] = GRIFF_R[2] * s; G.PT[n].copy(p3); G.PR[n++] = GRIFF_R[3] * s;
  if (tip) { const p4 = G.v3.setFromMatrixPosition(tip.matrixWorld); G.PT[n].lerpVectors(p3, p4, .5); G.PR[n++] = GRIFF_R[4] * s; G.PT[n].lerpVectors(p3, p4, .9); G.PR[n++] = GRIFF_R[5] * s; }
  return n; }
// Handpunkte: Handwurzel, vier Grundgelenke, Mitte der Handfläche, Unterarm (zwei Punkte)
function griff_hPunkte(B) { const G = GRIFF; let n = 0; const w = G.PT[n].setFromMatrixPosition(B.hand.matrixWorld); G.PR[n++] = .02;
  for (let fi = 1; fi < 5; fi++) if (B.f[fi][0]) { G.PT[n].setFromMatrixPosition(B.f[fi][0].matrixWorld); G.PR[n++] = .011; }
  if (B.f[2][0]) { G.PT[n].setFromMatrixPosition(B.f[2][0].matrixWorld).lerp(w, .5); G.PR[n++] = .016; }
  const e = G.PT[n].setFromMatrixPosition(B.fore.matrixWorld); G.PR[n++] = .03; G.PT[n].lerpVectors(e, w, .55); G.PR[n++] = .028; return n; }
// tiefste Eindringung der Punkte 0…n−1 in die Formen; nach außen zeigende Normale der tiefsten in GRIFF.nb
function griff_pen(L, n, seite, hand) { const G = GRIFF; let best = 0;
  for (const F of L) { if (!F.an || F.frei === seite || (hand && F.halt === seite)) continue;
    for (let i = 0; i < n; i++) { const d = G.PR[i] - griff_sd(F, G.PT[i], G.n); if (d > best) { best = d; G.nb.copy(G.n); } } }
  return best; }
// Finger fi auf k (0 = Bindepose, 1 = gewünschte Pose, > 1 stärker gebeugt) setzen
function griff_fSetzen(B, fi, k) { const G = GRIFF, ch = B.f[fi], bd = B.bindF[fi], A = B.gA[fi], W = B.gW[fi];
  for (let i = 0; i < 3; i++) { if (!ch[i]) continue; const a = Math.min(W[i] * k, GRIFF_LIM[i]); ch[i].quaternion.copy(bd[i]).multiply(G.q0.setFromAxisAngle(A[i], a)); }
  ch[0].updateMatrixWorld(true); }
function griff_fPen(B, fi, L, seite, k) { griff_fSetzen(B, fi, k); return griff_pen(L, griff_fPunkte(B, fi), seite, false); }
// Hauptaufruf je Hand: o = { seite: 'L'|'R', anlegen: true|[5], dt }
function griff_loesen(B, L, o) { if (!B || !L || !B.fore || !B.hand || window.__griffAus) return 0; /* __griffAus: nur Selbsttest (Vorher-Bilder) */ let aktiv = false; for (const F of L) if (F.an && F.frei !== o.seite) { aktiv = true; break; } if (!aktiv) return 0;
  const G = GRIFF, seite = o.seite; if (!B.gTip) griff_hand(B);
  if (B.fore.parent) B.fore.parent.updateWorldMatrix(true, false); B.fore.updateMatrixWorld(true);
  // 1. Handfläche/Unterarm heraus (höchstens drei Schübe, je entlang der tiefsten Normalen)
  let schub = 0; for (let it = 0; it < 3; it++) { const pen = griff_pen(L, griff_hPunkte(B), seite, true); if (pen <= 1e-4) break;
    G.push.copy(G.nb).multiplyScalar(pen + .0015); B.fore.getWorldPosition(G.v3).add(G.push); if (B.fore.parent) B.fore.parent.worldToLocal(G.v3); B.fore.position.copy(G.v3); B.fore.updateMatrixWorld(true); schub += pen; }
  if (schub) G.stat.schub++;
  // 2. Finger-IK: Beugung je Finger über eine Zahl k (alle drei Glieder gemeinsam, wie ein echter Griff)
  const dt = o.dt || .016;
  for (let fi = 0; fi < 5; fi++) { const ch = B.f[fi], bd = B.bindF[fi]; if (!ch[0] || !ch[1] || !ch[2] || !bd[0]) continue; const A = B.gA[fi], W = B.gW[fi];
    for (let i = 0; i < 3; i++) { const q = G.q1.copy(bd[i]).invert().multiply(ch[i].quaternion); if (q.w < 0) { q.x = -q.x; q.y = -q.y; q.z = -q.z; q.w = -q.w; }
      const s = Math.sqrt(Math.max(0, 1 - q.w * q.w)); W[i] = 2 * Math.acos(Math.min(1, q.w)); if (s > 1e-6) A[i].set(q.x / s, q.y / s, q.z / s); else A[i].set(1, 0, 0); }
    const anl = Array.isArray(o.anlegen) ? o.anlegen[fi] : !!o.anlegen; let k = 1;
    const p1 = griff_fPen(B, fi, L, seite, 1);
    if (p1 > 1e-4) { // dringt ein → öffnen bis zur Oberfläche; geht es auch gestreckt nicht, um das Objekt herum stärker beugen
      if (griff_fPen(B, fi, L, seite, 0) <= 1e-4) { let lo = 0, hi = 1; for (let j = 0; j < 6; j++) { const m = (lo + hi) / 2; if (griff_fPen(B, fi, L, seite, m) <= 1e-4) lo = m; else hi = m; } k = lo; G.stat.offen++; }
      else { let bk = 1, bp = p1; for (const kk of [1.2, 1.4, 1.6, .5, 0]) { const p = griff_fPen(B, fi, L, seite, kk); if (p < bp) { bp = p; bk = kk; } if (p <= 1e-4) break; } k = bk; G.stat.zu++; } }
    else if (anl && W[1] > .05) { const kx = 1.35; if (griff_fPen(B, fi, L, seite, kx) > 1e-4) { let lo = 1, hi = kx; for (let j = 0; j < 5; j++) { const m = (lo + hi) / 2; if (griff_fPen(B, fi, L, seite, m) <= 1e-4) lo = m; else hi = m; } k = lo; } }
    // weich nachführen, aber nie in eine Eindringung hinein: Öffnen sofort, Schließen gefedert
    const kv = B.gK[fi]; if (kv >= 0 && k > kv) { const kz = kv + (k - kv) * Math.min(1, dt * 9); k = griff_fPen(B, fi, L, seite, kz) <= 1e-4 ? kz : k; }
    B.gK[fi] = k; griff_fSetzen(B, fi, k); }
  return schub; }
// Abschalten (Hand unsichtbar): weiches Nachführen neu beginnen
function griff_reset(B) { if (B && B.gK) for (let i = 0; i < 5; i++) B.gK[i] = -1; }
// ---------------------------------------------------------------- Prüfung gegen das echte Mesh (nur Selbsttest; erzeugt Hilfsobjekte)
function griff_pruefen(B, meshes) { if (!B || !B.fore) return { n: 0, drin: [] }; if (!B.gTip) griff_hand(B); const G = GRIFF;
  const rc = new THREE.Raycaster(), dirs = [new THREE.Vector3(1, .013, .007).normalize(), new THREE.Vector3(-.011, 1, .017).normalize(), new THREE.Vector3(.009, -.015, -1).normalize()], dbl = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const L = []; for (const m of meshes) m.traverse(o => { if (!o.isMesh || !o.geometry || !o.visible) return; let t = o;
    if (o.isSkinnedMesh && !o.geometry.attributes.skinIndex) { t = new THREE.Mesh(o.geometry, dbl); t.matrixWorld.copy(o.matrixWorld); t.matrixAutoUpdate = false; }
    o.geometry.computeBoundingSphere(); o.geometry.computeBoundingBox(); if (o.isSkinnedMesh && t === o) { o.computeBoundingSphere(); o.computeBoundingBox(); } L.push(t); });
  const swap = L.map(t => { const m = t.material; if (t.material !== dbl) t.material = dbl; return m; });
  const drin = [], namen = ['Daumen', 'Zeige', 'Mittel', 'Ring', 'Klein'], tn = ['G1', 'MG', 'G2', 'EG', 'G3', 'Kuppe'], P = [];
  B.fore.updateMatrixWorld(true);
  for (let fi = 0; fi < 5; fi++) { if (!B.f[fi][2]) continue; const n = griff_fPunkte(B, fi); for (let i = 0; i < n; i++) P.push([namen[fi] + '.' + tn[i], G.PT[i].clone()]); }
  const nh = griff_hPunkte(B); for (let i = 0; i < nh - 2; i++) P.push(['Hand' + i, G.PT[i].clone()]);
  try { for (const [name, p] of P) { let odd = 0; for (const d of dirs) { rc.set(p, d); rc.far = 2; const hs = rc.intersectObjects(L, false); if (hs.length % 2) odd++; } if (odd >= 2) drin.push(name); } }
  finally { L.forEach((t, i) => { t.material = swap[i]; }); }
  return { n: P.length, drin }; }
window.__griff = { G: GRIFF, pruefen: griff_pruefen, sd: griff_sd };
