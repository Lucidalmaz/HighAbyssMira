// Q-1 Kreaturen: Werkzeuge zum Posen und Animieren gerigter Kreaturen (Node + three) – IK, Zielrichtungen, Gangplaner, Clip-Aufnahme, Filmstreifen.
// Alles in Weltachsen der Aufnahme: +z = vorn (Blickrichtung), +y = oben, +x = links der Kreatur, Meter. Knochen dürfen beliebige Ruhedrehungen haben.
import * as THREE from 'three'; import sharp from 'sharp';
const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), q3 = new THREE.Quaternion(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
export const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k, smooth = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
export const frac = x => x - Math.floor(x);
// deterministisches Rauschen (für Mikrobewegungen): glatte Summe aus Sinus mit krummen Frequenzen
export const wob = (t, s = 0) => Math.sin(t * 1.13 + s) * .5 + Math.sin(t * 2.71 + s * 1.7) * .3 + Math.sin(t * 5.3 + s * 2.3) * .2;
export class Rig {
  constructor(root, names) { this.root = root; this.b = {}; this.all = [];
    root.traverse(o => { if (o.isBone) this.all.push(o); });
    for (const [k, n] of Object.entries(names)) { const b = this.all.find(o => o.name === n) || this.all.find(o => o.name.replace(/[_\d]+$/, '') === n.replace(/[_\d]+$/, ''));
      if (!b) throw new Error('Knochen fehlt: ' + n); this.b[k] = b; }
    this.rest = new Map(this.all.map(o => [o, { q: o.quaternion.clone(), p: o.position.clone(), s: o.scale.clone() }])); root.updateMatrixWorld(true); this.restW = new Map(this.all.map(o => [o, o.getWorldQuaternion(new THREE.Quaternion())])); }
  // Pose festhalten und zwei Posen mischen (Übergänge wie Aufstehen/Zusammenbrechen)
  capture() { return this.all.map(o => [o.quaternion.clone(), o.position.clone()]); }
  mix(A, B, k) { this.all.forEach((o, i) => { o.quaternion.copy(A[i][0]).slerp(B[i][0], k); o.position.copy(A[i][1]).lerp(B[i][1], k); }); this.root.updateMatrixWorld(true); }
  reset() { for (const [o, r] of this.rest) { o.quaternion.copy(r.q); o.position.copy(r.p); o.scale.copy(r.s); } this.root.updateMatrixWorld(true); }
  pos(k, out = new THREE.Vector3()) { return (typeof k === 'string' ? this.b[k] : k).getWorldPosition(out); }
  // Drehung um eine Weltachse durch den Knochenpunkt (wirkt auf alle Kinder)
  turn(k, axis, ang) { if (!ang) return; const b = typeof k === 'string' ? this.b[k] : k; b.getWorldQuaternion(q1); q2.setFromAxisAngle(axis, ang).multiply(q1); b.parent.getWorldQuaternion(q3).invert(); b.quaternion.copy(q3.multiply(q2)); b.updateMatrixWorld(true); }
  // Knochen so drehen, dass sein Kindgelenk (Knochen) bzw. ein Punkt im Knochenraum (Vector3) zum Ziel zeigt (kleinste Drehung)
  aim(k, childK, target) { const b = typeof k === 'string' ? this.b[k] : k; const P = b.getWorldPosition(v1), C = this.tip(b, childK, v2);
    const a = C.sub(P).normalize(), t = v3.copy(target).sub(P); if (t.lengthSq() < 1e-10) return; t.normalize(); q2.setFromUnitVectors(a, t); b.getWorldQuaternion(q1); q2.multiply(q1); b.parent.getWorldQuaternion(q3).invert(); b.quaternion.copy(q3.multiply(q2)); b.updateMatrixWorld(true); }
  aimDir(k, childK, dir) { const b = typeof k === 'string' ? this.b[k] : k; const P = b.getWorldPosition(new THREE.Vector3()); this.aim(b, childK, P.addScaledVector(dir.clone().normalize(), 1)); }
  tip(b, childK, out) { if (childK && childK.isVector3) return out.copy(childK).applyMatrix4(b.matrixWorld); const c = typeof childK === 'string' ? this.b[childK] : childK; return c.getWorldPosition(out); }
  // Weltdrehung eines Knochens setzen (Blick des Kopfes unabhängig vom Körper)
  setWorldQ(k, q) { const b = typeof k === 'string' ? this.b[k] : k; b.parent.getWorldQuaternion(q3).invert(); b.quaternion.copy(q3.multiply(q)); b.updateMatrixWorld(true); }
  restWorldQ(k) { const b = typeof k === 'string' ? this.b[k] : k; return this.restW.get(b); }
  // Punkt eines Knochens verschieben (Welt-Delta)
  move(k, dx, dy, dz) { const b = typeof k === 'string' ? this.b[k] : k, w = b.getWorldPosition(new THREE.Vector3()).add(v1.set(dx, dy, dz)); b.position.copy(b.parent.worldToLocal(w)); b.updateMatrixWorld(true); }
  len(a, b) { const A = typeof a === 'string' ? this.b[a] : a; return A.getWorldPosition(new THREE.Vector3()).distanceTo(this.tip(A, b, new THREE.Vector3())); }
  // Zwei-Glied-IK: a (oben) → b (Gelenk) → c (Endpunkt) auf `target`, Beugung Richtung `pole` (Weltvektor)
  ik2(a, b, c, target, pole) { const P = this.pos(a, new THREE.Vector3()), la = this.len(a, b), lb = this.len(b, c); /* c: Kindknochen von b oder Punkt im Raum von b */ const T = target.clone().sub(P); let d = T.length();
    d = clamp(d, Math.abs(la - lb) + 1e-4, (la + lb) * .9995); const u = T.normalize(), cosA = clamp((la * la + d * d - lb * lb) / (2 * la * d), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
    const v = pole.clone().addScaledVector(u, -pole.dot(u)); if (v.lengthSq() < 1e-8) v.set(0, 0, 1).addScaledVector(u, -u.z); v.normalize();
    const K = P.clone().addScaledVector(u, la * cosA).addScaledVector(v, la * sinA); this.aim(a, b, K); this.aim(b, c, P.clone().addScaledVector(u, d)); }
}
// ---------------------------------------------------------------- Gangplaner: Fußziel je Bein relativ zur Wurzel. Die Wurzel läuft im Spiel mit v m/s vorwärts (negativ = rückwärts);
// der Clip ist auf der Stelle aufgenommen: Standfuß wandert mit −v nach hinten (steht in der Welt still), Schwungfuß holt den Weg v·T auf.
// leg: { x, z, off, duty, lift, y0 } · t Zeit · T Zyklus · style.hitch: „zwei Tritte je Schritt“ (der Fuß setzt in der Mitte kurz auf, steht, hebt noch einmal ab)
export function foot(leg, t, T, v, style = {}) { const p = frac(t / T + leg.off), ds = leg.duty * T, tau = p * T, L = v * ds, out = { x: leg.x, y: leg.y0 || 0, z: 0, c: 0, q: 0, lift: 0, s: 0 };
  if (tau < ds) { out.z = leg.z + L / 2 - v * tau; out.c = 1; out.s = tau / ds; return out; }
  const q = (tau - ds) / (T - ds), D = v * T; let w; out.q = q;
  if (style.hitch) { if (q < .4) { w = .5 * smooth(q / .4); out.lift = Math.sin(PI * q / .4); } else if (q < .55) { w = .5; out.c = 1; out.lift = 0; } else { w = .5 + .5 * smooth((q - .55) / .45); out.lift = .8 * Math.sin(PI * (q - .55) / .45); } }
  else { w = smooth(q); out.lift = Math.sin(PI * q) ** .8; }
  out.z = leg.z - L / 2 + D * w - v * (tau - ds); out.y += out.lift * (leg.lift ?? .1); return out; }
const PI = Math.PI;
// ---------------------------------------------------------------- Clip-Aufnahme: pose(t) je Bild → lokale Drehungen/Lagen der Knochen
export function record(rig, name, dur, fps, pose, { loop = true, trans = [] } = {}) { const n = Math.max(2, Math.round(dur * fps) + 1), bones = rig.all, T = new Float32Array(n);
  const Q = bones.map(() => new Float32Array(n * 4)), P = trans.map(() => new Float32Array(n * 3));
  for (let i = 0; i < n; i++) { const t = i / fps; T[i] = t; rig.reset(); pose(loop ? t % dur : Math.min(t, dur), t); rig.root.updateMatrixWorld(true);
    bones.forEach((b, j) => { const qq = b.quaternion; if (i && Q[j][(i - 1) * 4] * qq.x + Q[j][(i - 1) * 4 + 1] * qq.y + Q[j][(i - 1) * 4 + 2] * qq.z + Q[j][(i - 1) * 4 + 3] * qq.w < 0) qq.set(-qq.x, -qq.y, -qq.z, -qq.w); Q[j].set([qq.x, qq.y, qq.z, qq.w], i * 4); });
    trans.forEach((k, j) => { const b = rig.b[k] || k; P[j].set([b.position.x, b.position.y, b.position.z], i * 3); }); }
  if (loop) { bones.forEach((b, j) => { const a = Q[j].slice(0, 4); Q[j].set(a, (n - 1) * 4); }); P.forEach(p => p.set(p.slice(0, 3), (n - 1) * 3)); } // nahtlos
  return { name, dur, T, bones: bones.map((b, j) => ({ name: b.name, q: Q[j] })), trans: trans.map((k, j) => ({ name: (rig.b[k] || k).name, p: P[j] })), loop }; }
// Keyframe-Reduktion (Drehung ≤ tolDeg, Lage ≤ tolM) – linear
export function reduce(times, vals, dim, tol, isQ) { const n = times.length, keep = [0]; let a = 0;
  const err = (i, j, k) => { const f = (times[k] - times[i]) / (times[j] - times[i]); let e = 0; if (isQ) { let d = 0; for (let c = 0; c < 4; c++) { const x = vals[i * 4 + c] + (vals[j * 4 + c] - vals[i * 4 + c]) * f; d += x * vals[k * 4 + c]; } let l = 0; for (let c = 0; c < 4; c++) { const x = vals[i * 4 + c] + (vals[j * 4 + c] - vals[i * 4 + c]) * f; l += x * x; } e = 2 * Math.acos(Math.min(1, Math.abs(d) / Math.sqrt(l))) * 180 / PI; }
    else for (let c = 0; c < dim; c++) e = Math.max(e, Math.abs(vals[i * dim + c] + (vals[j * dim + c] - vals[i * dim + c]) * f - vals[k * dim + c])); return e; };
  for (let j = 2; j < n; j++) { let bad = false; for (let k = a + 1; k < j; k++) if (err(a, j, k) > tol) { bad = true; break; } if (bad) { keep.push(j - 1); a = j - 1; } }
  keep.push(n - 1); const t = new Float32Array(keep.length), v = new Float32Array(keep.length * dim); keep.forEach((i, m) => { t[m] = times[i]; for (let c = 0; c < dim; c++) v[m * dim + c] = vals[i * dim + c]; }); return { t, v }; }
// Clips in ein gltf-transform-Dokument schreiben (Drehungen als normierte 16-Bit-Werte)
export function writeClips(doc, clips, { tolDeg = .15, tolM = .0008 } = {}) { const R = doc.getRoot(), buf = R.listBuffers()[0], nodes = new Map(R.listNodes().map(n => [n.getName(), n]));
  for (const a of R.listAnimations()) if (clips.some(c => c.name === a.getName())) a.dispose();
  let bytes = 0; for (const c of clips) { const A = doc.createAnimation(c.name);
    const put = (node, path, t, v, dim, q) => { const inp = doc.createAccessor().setType('SCALAR').setArray(t).setBuffer(buf); let out;
      if (q) { const I = new Int16Array(v.length); for (let i = 0; i < I.length; i++) I[i] = Math.round(clamp(v[i], -1, 1) * 32767); out = doc.createAccessor().setType('VEC4').setArray(I).setNormalized(true).setBuffer(buf); bytes += I.byteLength; }
      else { out = doc.createAccessor().setType('VEC3').setArray(v).setBuffer(buf); bytes += v.byteLength; } bytes += t.byteLength;
      const s = doc.createAnimationSampler().setInput(inp).setOutput(out).setInterpolation('LINEAR'); A.addSampler(s); A.addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath(path).setSampler(s)); };
    for (const b of c.bones) { const node = nodes.get(b.name); if (!node) continue; const r = reduce(c.T, b.q, 4, tolDeg, true); if (r.t.length === 2 && c.bones.length > 1) { const d = b.q; let same = true; for (let i = 4; i < d.length && same; i++) same = Math.abs(d[i] - d[i % 4]) < 1e-4; if (same) { put(node, 'rotation', new Float32Array([0]), d.slice(0, 4), 4, true); continue; } } put(node, 'rotation', r.t, r.v, 4, true); }
    for (const p of c.trans) { const node = nodes.get(p.name); if (!node) continue; const r = reduce(c.T, p.p, 3, tolM, false); put(node, 'translation', r.t, r.v, 3, false); } }
  return bytes; }
// ---------------------------------------------------------------- Filmstreifen (Software-Skinning, flach schattiert – Silhouette ohne Farbe und Textur, CLAUDE.md §20)
export async function film(file, root, rig, clips, { n = 6, W = 260, H = 300, views = [['seite', PI / 2], ['schraeg', .6]], fit = null, colorOf = null, tag = '', title = '' } = {}) {
  const meshes = []; root.traverse(o => { if (o.isMesh && o.visible) meshes.push(o); });
  const vv = new THREE.Vector3(), L = new THREE.Vector3(.35, .8, .5).normalize();
  const draw = (img, zb, yaw, sc, cx, cy) => { const cyw = Math.cos(yaw), syw = Math.sin(yaw); const pr = (x, y, z) => { const X1 = cyw * x - syw * z, Z1 = syw * x + cyw * z; return [W / 2 + (X1 - cx) * sc, H * .88 - (y - cy) * sc, Z1]; };
    // Boden-Raster (alle 0,5 m) – Rutschen der Füße sichtbar
    for (let g = -6; g <= 6; g += .5) for (const [a, b] of [[[g, 0, -6], [g, 0, 6]], [[-6, 0, g], [6, 0, g]]]) { const A = pr(...a), B = pr(...b); const steps = 200; for (let s = 0; s <= steps; s++) { const x = Math.round(A[0] + (B[0] - A[0]) * s / steps), y = Math.round(A[1] + (B[1] - A[1]) * s / steps); if (x >= 0 && y >= 0 && x < W && y < H) { const k = (y * W + x) * 3; img[k] = img[k + 1] = img[k + 2] = 92; } } }
    for (const m of meshes) { const G = m.geometry, I = G.index, cnt = I ? I.count : G.attributes.position.count, cache = new Map(); const mats = [].concat(m.material), groups = G.groups.length ? G.groups : [{ start: 0, count: cnt, materialIndex: 0 }];
      const get = i => { let r = cache.get(i); if (r) return r; m.getVertexPosition(i, vv); vv.applyMatrix4(m.matrixWorld); r = [vv.x, vv.y, vv.z]; cache.set(i, r); return r; };
      for (const gr of groups) { const mat = mats[gr.materialIndex] || mats[0]; if (mat && mat.visible === false) continue;
        for (let k = gr.start; k < gr.start + gr.count; k += 3) { const ia = I ? I.getX(k) : k, ib = I ? I.getX(k + 1) : k + 1, ic = I ? I.getX(k + 2) : k + 2; const a = get(ia), b = get(ib), c = get(ic);
          const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2]; let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          const sh = .3 + .7 * Math.abs(nx * L.x + ny * L.y + nz * L.z); const col = colorOf ? colorOf(m, ia) : [200, 196, 190];
          const A = pr(...a), B = pr(...b), C = pr(...c); const x0 = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0]))), x1 = Math.min(W - 1, Math.ceil(Math.max(A[0], B[0], C[0]))), y0 = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1]))), y1 = Math.min(H - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
          const d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]); if (Math.abs(d) < 1e-9) continue;
          for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const px = x + .5, py = y + .5, l1 = ((B[1] - C[1]) * (px - C[0]) + (C[0] - B[0]) * (py - C[1])) / d, l2 = ((C[1] - A[1]) * (px - C[0]) + (A[0] - C[0]) * (py - C[1])) / d, l3 = 1 - l1 - l2;
            if (l1 < 0 || l2 < 0 || l3 < 0) continue; const z = l1 * A[2] + l2 * B[2] + l3 * C[2], kk = y * W + x; if (z < zb[kk]) continue; zb[kk] = z; img[kk * 3] = col[0] * sh; img[kk * 3 + 1] = col[1] * sh; img[kk * 3 + 2] = col[2] * sh; } } } } };
  const tiles = []; const mx = new THREE.AnimationMixer(root);
  for (const clip of clips) { mx.stopAllAction(); const act = mx.clipAction(clip); act.setLoop(THREE.LoopOnce, 1); act.clampWhenFinished = true; act.reset().play(); const sp = (clip.userData && clip.userData.speed) || 0;
    for (let i = 0; i < n; i++) { const t = clip.duration * i / (n - 1 || 1) * .999; mx.setTime(t); root.position.z = sp * t; root.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(root); const sc = fit ? fit.sc : (H * .8) / Math.max(1e-3, bb.max.y - bb.min.y);
      views.forEach(([vn, yaw], r) => { const img = new Uint8Array(W * H * 3).fill(48), zb = new Float32Array(W * H).fill(-1e9); const cyw = Math.cos(yaw), syw = Math.sin(yaw); const cx = cyw * root.position.x - syw * root.position.z; draw(img, zb, yaw, sc, fit ? cx + (fit.cx || 0) : cx, 0);
        tiles.push({ img, col: i, row: tiles.filter(t => t.clip === clip.name && t.r === r).length ? 0 : 0, r, clip: clip.name, t }); }); } }
  // Blatt: je Clip eine Zeile je Ansicht
  console.log('Filmstreifen: Clips', clips.map(c => c.name).join(','), 'Bilder', tiles.length);
  const rows = []; for (const c of clips) for (let r = 0; r < views.length; r++) rows.push(tiles.filter(t => t.clip === c.name && t.r === r));
  const comp = []; let y = 0; for (const row of rows) { const lab = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * n}" height="20"><rect width="100%" height="20" fill="#222"/><text x="6" y="15" font-family="Arial" font-size="13" fill="#ddd">${tag}${row[0].clip} · ${views[row[0].r][0]} · ${row.map(t => t.t.toFixed(2)).join(' ')} s</text></svg>`;
    comp.push({ input: await sharp(Buffer.from(lab)).png().toBuffer(), left: 0, top: y }); y += 20; for (const t of row) comp.push({ input: await sharp(Buffer.from(t.img), { raw: { width: W, height: H, channels: 3 } }).png().toBuffer(), left: t.col * W, top: y }); y += H; }
  await sharp({ create: { width: W * n, height: y, channels: 3, background: '#222' } }).composite(comp).png().toFile(file); return file; }
