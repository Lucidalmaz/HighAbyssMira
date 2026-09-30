// X-5 (Album/Beutel): Netz-Vereinfachung nach Garland–Heckbert (Quadriken, Halbkanten-Kollaps), UV-Nähte bleiben erhalten.
// simplify({ pos, uv, index }, zielDreiecke, { seams: 'lock' | 'free' }) → { pos, uv, index }
//   pos Float32Array (xyz je Ecke), uv Float32Array|null, index Uint32Array|null (ohne: je drei Ecken ein Dreieck)
//   'lock': Naht-/Randpunkte bleiben stehen (Textur exakt) · 'free': Nähte dürfen wandern (Seile, gleichförmige Stoffe)
// normals(…) rechnet Normalen mit Knickwinkel (Ecken mit verschiedener Richtung bekommen eigene Punkte).
export function simplify(src, target, { seams = 'lock', maxErr = Infinity, log = () => {} } = {}) {
  const P = src.pos, UV = src.uv, nC = src.index ? src.index.length : P.length / 3, cix = k => src.index ? src.index[k] : k;
  // Schweißen: Positionen → Punkte, (Punkt, UV) → Keile
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], P[i + k]); mx[k] = Math.max(mx[k], P[i + k]); }
  const q = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) * 1e-6;
  const pid = new Map(), wid = new Map(), vx = [], wv = [], wu = []; const corner = new Int32Array(nC);
  for (let k = 0; k < nC; k++) { const i = cix(k); const key = Math.round(P[i * 3] / q) + ',' + Math.round(P[i * 3 + 1] / q) + ',' + Math.round(P[i * 3 + 2] / q);
    let v = pid.get(key); if (v === undefined) { v = vx.length / 3; pid.set(key, v); vx.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); }
    const u0 = UV ? UV[i * 2] : 0, u1 = UV ? UV[i * 2 + 1] : 0, wk = v + '|' + (UV ? Math.round(u0 * 1e5) + ',' + Math.round(u1 * 1e5) : '');
    let w = wid.get(wk); if (w === undefined) { w = wv.length; wid.set(wk, w); wv.push(v); wu.push(u0, u1); } corner[k] = w; }
  pid.clear(); wid.clear();
  const nV = vx.length / 3, nF = nC / 3, V = Float64Array.from(vx); const FW = corner; // Keil je Ecke
  const fv = (f, j) => wv[FW[f * 3 + j]]; const alive = new Uint8Array(nF).fill(1); let faces = nF;
  // Punkt → Dreiecke
  const vf = Array.from({ length: nV }, () => []); for (let f = 0; f < nF; f++) for (let j = 0; j < 3; j++) vf[fv(f, j)].push(f);
  // entartete Dreiecke weg
  for (let f = 0; f < nF; f++) { const a = fv(f, 0), b = fv(f, 1), c = fv(f, 2); if (a === b || b === c || a === c) { alive[f] = 0; faces--; } }
  // Quadriken
  const Q = new Float64Array(nV * 10), fn = new Float64Array(nF * 3);
  const plane = f => { const a = fv(f, 0) * 3, b = fv(f, 1) * 3, c = fv(f, 2) * 3; const ux = V[b] - V[a], uy = V[b + 1] - V[a + 1], uz = V[b + 2] - V[a + 2], wx = V[c] - V[a], wy = V[c + 1] - V[a + 1], wz = V[c + 2] - V[a + 2];
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const l = Math.hypot(nx, ny, nz); return l < 1e-30 ? null : [nx / l, ny / l, nz / l, l / 2]; };
  const addQ = (v, nx, ny, nz, d, w) => { const o = v * 10; Q[o] += w * nx * nx; Q[o + 1] += w * nx * ny; Q[o + 2] += w * nx * nz; Q[o + 3] += w * nx * d; Q[o + 4] += w * ny * ny; Q[o + 5] += w * ny * nz; Q[o + 6] += w * ny * d; Q[o + 7] += w * nz * nz; Q[o + 8] += w * nz * d; Q[o + 9] += w * d * d; };
  for (let f = 0; f < nF; f++) { if (!alive[f]) continue; const p = plane(f); if (!p) continue; fn[f * 3] = p[0]; fn[f * 3 + 1] = p[1]; fn[f * 3 + 2] = p[2]; const a = fv(f, 0) * 3, d = -(p[0] * V[a] + p[1] * V[a + 1] + p[2] * V[a + 2]);
    for (let j = 0; j < 3; j++) addQ(fv(f, j), p[0], p[1], p[2], d, p[3]); }
  // Kanten: Rand (1 Dreieck), Naht (verschiedene Keile), nicht-mannigfaltig (>2) → Punkte sperren
  const lock = new Uint8Array(nV); const ek = (a, b) => a < b ? a * nV + b : b * nV + a; const E = new Map();
  for (let f = 0; f < nF; f++) { if (!alive[f]) continue; for (let j = 0; j < 3; j++) { const a = fv(f, j), b = fv(f, (j + 1) % 3), k = ek(a, b), wa = FW[f * 3 + j], wb = FW[f * 3 + (j + 1) % 3];
    const e = E.get(k); if (!e) E.set(k, { n: 1, wa: a < b ? wa : wb, wb: a < b ? wb : wa, seam: false }); else { e.n++; if (e.wa !== (a < b ? wa : wb) || e.wb !== (a < b ? wb : wa)) e.seam = true; } } }
  let nb = 0, ns = 0;
  for (const [k, e] of E) { const a = Math.floor(k / nV), b = k % nV;
    if (e.n !== 2) { lock[a] = lock[b] = 1; nb++; // Rand: zusätzlich Ebene senkrecht zur Kante in die Quadrik (Silhouette halten)
    } else if (e.seam && seams === 'lock') { lock[a] = lock[b] = 1; ns++; } }
  E.clear(); log(`  Punkte ${nV}, Dreiecke ${faces}, Randkanten ${nb}, Nahtkanten ${ns}, gesperrt ${lock.reduce((s, x) => s + x, 0)}`);
  // Kosten eines Halbkanten-Kollapses a → b
  const cost = (a, b) => { const o = a * 10, p = b * 10, x = V[b * 3], y = V[b * 3 + 1], z = V[b * 3 + 2]; const q0 = Q[o] + Q[p], q1 = Q[o + 1] + Q[p + 1], q2 = Q[o + 2] + Q[p + 2], q3 = Q[o + 3] + Q[p + 3], q4 = Q[o + 4] + Q[p + 4], q5 = Q[o + 5] + Q[p + 5], q6 = Q[o + 6] + Q[p + 6], q7 = Q[o + 7] + Q[p + 7], q8 = Q[o + 8] + Q[p + 8], q9 = Q[o + 9] + Q[p + 9];
    return Math.max(0, q0 * x * x + 2 * q1 * x * y + 2 * q2 * x * z + 2 * q3 * x + q4 * y * y + 2 * q5 * y * z + 2 * q6 * y + q7 * z * z + 2 * q8 * z + q9); };
  // Halde (Min-Heap) mit Versionsmarken
  const ver = new Uint32Array(nV); let hc = [], ha = [], hb = [], hv = [], hn = 0;
  const push = (c, a, b) => { let i = hn++; hc[i] = c; ha[i] = a; hb[i] = b; hv[i] = ver[a] * 4096 + (ver[b] & 4095); while (i > 0) { const pi = (i - 1) >> 1; if (hc[pi] <= hc[i]) break; sw(i, pi); i = pi; } };
  const sw = (i, j) => { let t = hc[i]; hc[i] = hc[j]; hc[j] = t; t = ha[i]; ha[i] = ha[j]; ha[j] = t; t = hb[i]; hb[i] = hb[j]; hb[j] = t; t = hv[i]; hv[i] = hv[j]; hv[j] = t; };
  const pop = () => { hn--; sw(0, hn); let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < hn && hc[l] < hc[m]) m = l; if (r < hn && hc[r] < hc[m]) m = r; if (m === i) break; sw(i, m); i = m; } return hn; };
  const nbrs = (v, out) => { out.clear(); for (const f of vf[v]) if (alive[f]) for (let j = 0; j < 3; j++) { const u = fv(f, j); if (u !== v) out.add(u); } return out; };
  const S1 = new Set(), S2 = new Set();
  const cand = v => { if (!lock[v]) for (const u of nbrs(v, S1)) push(cost(v, u), v, u); for (const u of nbrs(v, S1)) if (!lock[u]) push(cost(u, v), u, v); };
  for (let v = 0; v < nV; v++) if (!lock[v] && vf[v].length) for (const u of nbrs(v, S1)) push(cost(v, u), v, u);
  log(`  Kandidaten ${hn}`); const hMax = Math.max(2e6, hn * 2);
  const tmpN = [0, 0, 0];
  while (faces > target && hn > 0) {
    const c = hc[0], a = ha[0], b = hb[0], hver = hv[0]; pop(); if (c > maxErr) break;
    if (hver !== ver[a] * 4096 + (ver[b] & 4095) || lock[a]) continue;
    // Kante noch da? gemeinsame Dreiecke
    const shared = []; for (const f of vf[a]) if (alive[f] && (fv(f, 0) === b || fv(f, 1) === b || fv(f, 2) === b)) shared.push(f); if (!shared.length) continue;
    // Verbindungsbedingung: gemeinsame Nachbarn = gegenüberliegende Punkte der gemeinsamen Dreiecke
    nbrs(a, S1); nbrs(b, S2); let common = 0; for (const u of S1) if (S2.has(u)) common++; if (common !== shared.length) continue;
    // Keil-Zuordnung a → b (je UV-Insel)
    const wmap = new Map(); for (const f of shared) { let wa = -1, wb = -1; for (let j = 0; j < 3; j++) { const w = FW[f * 3 + j]; if (wv[w] === a) wa = w; else if (wv[w] === b) wb = w; } if (wa >= 0 && wb >= 0) wmap.set(wa, wb); }
    // Umklappen prüfen und Keile, die keine Zuordnung haben (nur bei seams: free), nächstgelegenen UV von b geben
    let bad = false; const bx = V[b * 3], by = V[b * 3 + 1], bz = V[b * 3 + 2];
    for (const f of vf[a]) { if (!alive[f] || shared.includes(f)) continue; const o = [0, 1, 2].map(j => fv(f, j)); const p = o.map(v => v === a ? [bx, by, bz] : [V[v * 3], V[v * 3 + 1], V[v * 3 + 2]]);
      const ux = p[1][0] - p[0][0], uy = p[1][1] - p[0][1], uz = p[1][2] - p[0][2], wx = p[2][0] - p[0][0], wy = p[2][1] - p[0][1], wz = p[2][2] - p[0][2];
      tmpN[0] = uy * wz - uz * wy; tmpN[1] = uz * wx - ux * wz; tmpN[2] = ux * wy - uy * wx; const l = Math.hypot(tmpN[0], tmpN[1], tmpN[2]); if (l < 1e-20) { bad = true; break; }
      if ((tmpN[0] * fn[f * 3] + tmpN[1] * fn[f * 3 + 1] + tmpN[2] * fn[f * 3 + 2]) / l < .25) { bad = true; break; }
      for (let j = 0; j < 3; j++) { const w = FW[f * 3 + j]; if (wv[w] === a && !wmap.has(w)) { if (seams === 'lock') { bad = true; break; } let best = -1, bd = 1e9; for (const g of vf[b]) if (alive[g]) for (let k = 0; k < 3; k++) { const w2 = FW[g * 3 + k]; if (wv[w2] === b) { const d = (wu[w2 * 2] - wu[w * 2]) ** 2 + (wu[w2 * 2 + 1] - wu[w * 2 + 1]) ** 2; if (d < bd) { bd = d; best = w2; } } } if (best < 0) { bad = true; break; } wmap.set(w, best); } } if (bad) break; }
    if (bad) continue;
    // Anwenden
    for (const f of shared) { alive[f] = 0; faces--; }
    for (const f of vf[a]) { if (!alive[f]) continue; for (let j = 0; j < 3; j++) { const w = FW[f * 3 + j]; if (wv[w] === a) FW[f * 3 + j] = wmap.get(w); }
      // Normale neu
      const o = [fv(f, 0), fv(f, 1), fv(f, 2)]; const ux = V[o[1] * 3] - V[o[0] * 3], uy = V[o[1] * 3 + 1] - V[o[0] * 3 + 1], uz = V[o[1] * 3 + 2] - V[o[0] * 3 + 2], wx = V[o[2] * 3] - V[o[0] * 3], wy = V[o[2] * 3 + 1] - V[o[0] * 3 + 1], wz = V[o[2] * 3 + 2] - V[o[0] * 3 + 2];
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx, l = Math.hypot(nx, ny, nz) || 1; fn[f * 3] = nx / l; fn[f * 3 + 1] = ny / l; fn[f * 3 + 2] = nz / l; vf[b].push(f); }
    vf[a] = []; for (let k = 0; k < 10; k++) Q[b * 10 + k] += Q[a * 10 + k];
    vf[b] = vf[b].filter(f => alive[f]); ver[a]++; ver[b]++;
    cand(b);
    if (hn > hMax) { // Halde aufräumen
      const nc = [], na = [], nb2 = [], nv = []; for (let i = 0; i < hn; i++) if (hv[i] === ver[ha[i]] * 4096 + (ver[hb[i]] & 4095)) { nc.push(hc[i]); na.push(ha[i]); nb2.push(hb[i]); nv.push(hv[i]); }
      hc = []; ha = []; hb = []; hv = []; hn = 0; for (let i = 0; i < nc.length; i++) { hc[hn] = nc[i]; ha[hn] = na[i]; hb[hn] = nb2[i]; hv[hn] = nv[i]; hn++; } for (let i = (hn >> 1) - 1; i >= 0; i--) { let k = i; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < hn && hc[l] < hc[m]) m = l; if (r < hn && hc[r] < hc[m]) m = r; if (m === k) break; sw(k, m); k = m; } } }
  }
  // Ausgabe: benutzte Keile verdichten
  const remap = new Int32Array(wv.length).fill(-1), op = [], ou = [], oi = [];
  for (let f = 0; f < nF; f++) { if (!alive[f]) continue; for (let j = 0; j < 3; j++) { const w = FW[f * 3 + j]; if (remap[w] < 0) { remap[w] = op.length / 3; const v = wv[w]; op.push(V[v * 3], V[v * 3 + 1], V[v * 3 + 2]); ou.push(wu[w * 2], wu[w * 2 + 1]); } oi.push(remap[w]); } }
  log(`  → ${oi.length / 3} Dreiecke, ${op.length / 3} Punkte`);
  return { pos: Float32Array.from(op), uv: UV ? Float32Array.from(ou) : null, index: Uint32Array.from(oi) };
}
// Normalen mit Knickwinkel: gibt neue Geometrie (Punkte ggf. aufgeteilt) zurück
export function normals(g, crease = 60) {
  const { pos, uv, index } = g, nV = pos.length / 3, nF = index.length / 3, cc = Math.cos(crease * Math.PI / 180);
  // gleiche Positionen zusammenfassen (über UV-Nähte glatt)
  const key = new Map(), pv = new Int32Array(nV); for (let v = 0; v < nV; v++) { const k = pos[v * 3].toFixed(6) + ',' + pos[v * 3 + 1].toFixed(6) + ',' + pos[v * 3 + 2].toFixed(6); let p = key.get(k); if (p === undefined) { p = key.size; key.set(k, p); } pv[v] = p; }
  const fn = new Float32Array(nF * 3), pf = Array.from({ length: key.size }, () => []);
  for (let f = 0; f < nF; f++) { const a = index[f * 3] * 3, b = index[f * 3 + 1] * 3, c = index[f * 3 + 2] * 3; const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], wx = pos[c] - pos[a], wy = pos[c + 1] - pos[a + 1], wz = pos[c + 2] - pos[a + 2];
    fn[f * 3] = uy * wz - uz * wy; fn[f * 3 + 1] = uz * wx - ux * wz; fn[f * 3 + 2] = ux * wy - uy * wx; for (let j = 0; j < 3; j++) pf[pv[index[f * 3 + j]]].push(f); }
  const out = new Map(), op = [], ou = [], on = [], oi = [];
  for (let f = 0; f < nF; f++) { const l0 = Math.hypot(fn[f * 3], fn[f * 3 + 1], fn[f * 3 + 2]) || 1;
    for (let j = 0; j < 3; j++) { const v = index[f * 3 + j]; let nx = 0, ny = 0, nz = 0;
      for (const g2 of pf[pv[v]]) { const l = Math.hypot(fn[g2 * 3], fn[g2 * 3 + 1], fn[g2 * 3 + 2]) || 1; if ((fn[g2 * 3] * fn[f * 3] + fn[g2 * 3 + 1] * fn[f * 3 + 1] + fn[g2 * 3 + 2] * fn[f * 3 + 2]) / (l * l0) >= cc) { nx += fn[g2 * 3]; ny += fn[g2 * 3 + 1]; nz += fn[g2 * 3 + 2]; } }
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; const k = v + ':' + Math.round(nx * 50) + ',' + Math.round(ny * 50) + ',' + Math.round(nz * 50);
      let o = out.get(k); if (o === undefined) { o = op.length / 3; out.set(k, o); op.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); on.push(nx, ny, nz); if (uv) ou.push(uv[v * 2], uv[v * 2 + 1]); } oi.push(o); } }
  return { pos: Float32Array.from(op), nrm: Float32Array.from(on), uv: uv ? Float32Array.from(ou) : null, index: Uint32Array.from(oi) };
}
