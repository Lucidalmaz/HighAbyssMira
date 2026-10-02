// X-5: kleiner Software-Renderer zum Ansehen von Modellen (Z-Puffer, Textur, Licht) → PNG. Export: render(tris, opts)
import sharp from 'sharp';
// tris: Float32Array [x,y,z,u,v, ...] je Eckpunkt (Welt), tex: {data,w,h,ch} | null
export async function render(file, parts, { W = 900, H = 700, yaw = .6, pitch = .35, pad = 1.1 } = {}) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), spp = Math.sin(pitch);
  const tr = (x, y, z) => { const x1 = cy * x + sy * z, z1 = -sy * x + cy * z; const y2 = cp * y - spp * z1, z2 = spp * y + cp * z1; return [x1, y2, z2]; };
  let mn = [1e9, 1e9], mx = [-1e9, -1e9]; for (const p of parts) for (let i = 0; i < p.v.length; i += 5) { const [a, b] = tr(p.v[i], p.v[i + 1], p.v[i + 2]); mn[0] = Math.min(mn[0], a); mn[1] = Math.min(mn[1], b); mx[0] = Math.max(mx[0], a); mx[1] = Math.max(mx[1], b); }
  const s = Math.min(W / (mx[0] - mn[0]), H / (mx[1] - mn[1])) / pad, ox = W / 2 - s * (mn[0] + mx[0]) / 2, oy = H / 2 + s * (mn[1] + mx[1]) / 2;
  const img = new Uint8Array(W * H * 3).fill(58), zb = new Float32Array(W * H).fill(-1e9), L = [.4, .75, .52];
  for (const p of parts) { const v = p.v, T = p.tex, col = p.color || [180, 180, 180];
    for (let t = 0; t < v.length; t += 15) { const A = [], U = [];
      for (let j = 0; j < 3; j++) { const i = t + j * 5; const q = tr(v[i], v[i + 1], v[i + 2]); A.push([ox + q[0] * s, oy - q[1] * s, q[2]]); U.push([v[i + 3], v[i + 4]]); }
      const e1 = [v[t + 5] - v[t], v[t + 6] - v[t + 1], v[t + 7] - v[t + 2]], e2 = [v[t + 10] - v[t], v[t + 11] - v[t + 1], v[t + 12] - v[t + 2]];
      let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const nl = Math.hypot(...n) || 1; n = n.map(x => x / nl);
      const sh = .35 + .65 * Math.abs(n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
      const x0 = Math.max(0, Math.floor(Math.min(A[0][0], A[1][0], A[2][0]))), x1 = Math.min(W - 1, Math.ceil(Math.max(A[0][0], A[1][0], A[2][0]))), y0 = Math.max(0, Math.floor(Math.min(A[0][1], A[1][1], A[2][1]))), y1 = Math.min(H - 1, Math.ceil(Math.max(A[0][1], A[1][1], A[2][1])));
      const d = (A[1][1] - A[2][1]) * (A[0][0] - A[2][0]) + (A[2][0] - A[1][0]) * (A[0][1] - A[2][1]); if (Math.abs(d) < 1e-9) continue;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const px = x + .5, py = y + .5;
        const l1 = ((A[1][1] - A[2][1]) * (px - A[2][0]) + (A[2][0] - A[1][0]) * (py - A[2][1])) / d, l2 = ((A[2][1] - A[0][1]) * (px - A[2][0]) + (A[0][0] - A[2][0]) * (py - A[2][1])) / d, l3 = 1 - l1 - l2;
        if (l1 < 0 || l2 < 0 || l3 < 0) continue; const z = l1 * A[0][2] + l2 * A[1][2] + l3 * A[2][2], k = y * W + x; if (z < zb[k]) continue; zb[k] = z;
        let c = col; if (T) { let u = l1 * U[0][0] + l2 * U[1][0] + l3 * U[2][0], w = l1 * U[0][1] + l2 * U[1][1] + l3 * U[2][1]; u -= Math.floor(u); w -= Math.floor(w); const sx = Math.min(T.w - 1, Math.floor(u * T.w)), sy2 = Math.min(T.h - 1, Math.floor((1 - w) * T.h)), o = (sy2 * T.w + sx) * T.ch; c = [T.data[o], T.data[o + 1], T.data[o + 2]]; }
        img[k * 3] = Math.min(255, c[0] * sh); img[k * 3 + 1] = Math.min(255, c[1] * sh); img[k * 3 + 2] = Math.min(255, c[2] * sh); } } }
  await sharp(Buffer.from(img), { raw: { width: W, height: H, channels: 3 } }).png().toFile(file);
}
export async function loadTex(f, max = 1024) { const { data, info } = await sharp(f).resize({ width: max, height: max, fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height, ch: info.channels }; }
// three-Objekt → Teile (Weltkoordinaten)
export function partsOf(o, texFor) { const out = []; o.updateMatrixWorld(true); const v = { x: 0, y: 0, z: 0 };
  o.traverse(m => { if (!m.isMesh) return; const g = m.geometry, P = g.attributes.position, U = g.attributes.uv, I = g.index, e = m.matrixWorld.elements; const cnt = I ? I.count : P.count; const arr = new Float32Array(cnt * 5);
    for (let k = 0; k < cnt; k++) { const i = I ? I.getX(k) : k, x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      arr[k * 5] = e[0] * x + e[4] * y + e[8] * z + e[12]; arr[k * 5 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; arr[k * 5 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14]; arr[k * 5 + 3] = U ? U.getX(i) : 0; arr[k * 5 + 4] = U ? U.getY(i) : 0; }
    out.push({ v: arr, tex: texFor ? texFor(m) : null, name: m.name }); }); return out; }
