// R-21 Vorschau-Renderer (CPU): glatt schattiert (Normalen je Ecke), Wachston, Streiflicht + Gegenlicht – zum Beurteilen der Gestalt ohne Grafikkarte
import sharp from 'sharp';
export async function bild(file, parts, { W = 700, H = 900, yaw = 0, pitch = 0, pad = 1.08, box = null, bg = 52 } = {}) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const tr = (x, y, z) => { const x1 = cy * x + sy * z, z1 = -sy * x + cy * z; return [x1, cp * y - sp * z1, sp * y + cp * z1]; };
  const trn = (x, y, z) => tr(x, y, z);
  let mn = [1e9, 1e9], mx = [-1e9, -1e9]; for (const p of parts) for (let i = 0; i < p.pos.length; i += 3) { if (box && !inBox(p.pos, i, box)) continue; const [a, b] = tr(p.pos[i], p.pos[i + 1], p.pos[i + 2]); mn = [Math.min(mn[0], a), Math.min(mn[1], b)]; mx = [Math.max(mx[0], a), Math.max(mx[1], b)]; }
  const s = Math.min(W / (mx[0] - mn[0]), H / (mx[1] - mn[1])) / pad, ox = W / 2 - s * (mn[0] + mx[0]) / 2, oy = H / 2 + s * (mn[1] + mx[1]) / 2;
  const img = new Float32Array(W * H * 3).fill(bg / 255), zb = new Float32Array(W * H).fill(-1e9);
  const L1 = norm([.5, .6, .62]), L2 = norm([-.6, .2, -.75]);
  for (const p of parts) { const P = p.pos, N = p.nrm, I = p.idx, col = (p.color || [235, 228, 218]).map(c => c / 255), C = p.col;
    const sv = new Float32Array(P.length), nv = new Float32Array(P.length); for (let i = 0; i < P.length; i += 3) { const q = tr(P[i], P[i + 1], P[i + 2]); sv[i] = ox + q[0] * s; sv[i + 1] = oy - q[1] * s; sv[i + 2] = q[2]; const n = trn(N[i], N[i + 1], N[i + 2]); nv[i] = n[0]; nv[i + 1] = n[1]; nv[i + 2] = n[2]; }
    for (let t = 0; t < I.length; t += 3) { const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3; if (box && !(inBox(P, a, box) && inBox(P, b, box) && inBox(P, c, box))) continue;
      const x0 = Math.max(0, Math.floor(Math.min(sv[a], sv[b], sv[c]))), x1 = Math.min(W - 1, Math.ceil(Math.max(sv[a], sv[b], sv[c]))), y0 = Math.max(0, Math.floor(Math.min(sv[a + 1], sv[b + 1], sv[c + 1]))), y1 = Math.min(H - 1, Math.ceil(Math.max(sv[a + 1], sv[b + 1], sv[c + 1])));
      const d = (sv[b + 1] - sv[c + 1]) * (sv[a] - sv[c]) + (sv[c] - sv[b]) * (sv[a + 1] - sv[c + 1]); if (Math.abs(d) < 1e-12) continue;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const px = x + .5, py = y + .5, l1 = ((sv[b + 1] - sv[c + 1]) * (px - sv[c]) + (sv[c] - sv[b]) * (py - sv[c + 1])) / d, l2 = ((sv[c + 1] - sv[a + 1]) * (px - sv[c]) + (sv[a] - sv[c]) * (py - sv[c + 1])) / d, l3 = 1 - l1 - l2;
        if (l1 < 0 || l2 < 0 || l3 < 0) continue; const z = l1 * sv[a + 2] + l2 * sv[b + 2] + l3 * sv[c + 2], k = y * W + x; if (z < zb[k]) continue; zb[k] = z;
        let n = norm([l1 * nv[a] + l2 * nv[b] + l3 * nv[c], l1 * nv[a + 1] + l2 * nv[b + 1] + l3 * nv[c + 1], l1 * nv[a + 2] + l2 * nv[b + 2] + l3 * nv[c + 2]]); if (n[2] < 0) n = n.map(v => -v);
        const dif = Math.max(0, dot(n, L1)) * .85 + Math.max(0, dot(n, L2)) * .25, rim = Math.pow(1 - Math.abs(n[2]), 2.2) * .35, ao = C ? (l1 * C[I[t]] + l2 * C[I[t + 1]] + l3 * C[I[t + 2]]) : 1;
        const sh = (.16 + dif) * ao + rim; for (let ch = 0; ch < 3; ch++) img[k * 3 + ch] = col[ch] * sh; } } }
  const out = Buffer.alloc(W * H * 3); for (let i = 0; i < out.length; i++) out[i] = Math.max(0, Math.min(255, Math.pow(img[i], 1 / 1.15) * 255));
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toFile(file); }
const norm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); }, dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const inBox = (P, i, B) => P[i] >= B[0] && P[i] <= B[1] && P[i + 1] >= B[2] && P[i + 1] <= B[3] && P[i + 2] >= B[4] && P[i + 2] <= B[5];
