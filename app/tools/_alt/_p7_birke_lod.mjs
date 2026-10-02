// Einmalig (W2-P7): Birken-Scan (w_birke/model.glb, 197k Dreiecke, zerstückelter Foto-Atlas) → spielbare Stufe w_birke/lod.glb.
// Schritt 1 (früher): Geometrie mit three/SimplifyModifier reduziert (UVs dabei unbrauchbar).  Schritt 2 (hier): Rinde aus dem Original-Atlas
// in eine Zylinder-Abwicklung (2048 × 1024) umbacken und die reduzierte Geometrie mit Zylinder-UVs versehen. Aufruf: node tools/_p7_birke_lod.mjs
import { NodeIO } from '@gltf-transform/core'; import sharp from 'sharp';
const SRC = '../game/assets/ms/w_birke/model.glb', LOD = '../game/assets/ms/w_birke/lod.glb', W = 2048, H = 1024, io = new NodeIO();
const src = await io.read(SRC), img = src.getRoot().listTextures()[0].getImage();
const { data: sp, info } = await sharp(Buffer.from(img)).removeAlpha().raw().toBuffer({ resolveWithObject: true }); const SW = info.width, SH = info.height;
const prims = []; for (const me of src.getRoot().listMeshes()) for (const p of me.listPrimitives()) prims.push({ P: p.getAttribute('POSITION').getArray(), U: p.getAttribute('TEXCOORD_0').getArray(), I: p.getIndices() ? p.getIndices().getArray() : null });
let cx = 0, cy = 0, n = 0, z0 = 1e9, z1 = -1e9; for (const { P } of prims) for (let i = 0; i < P.length; i += 3) { cx += P[i]; cy += P[i + 1]; n++; z0 = Math.min(z0, P[i + 2]); z1 = Math.max(z1, P[i + 2]); } cx /= n; cy /= n;
const cyl = (x, y, z) => [Math.atan2(y - cy, x - cx) / (2 * Math.PI) + .5, (z - z0) / (z1 - z0), Math.hypot(x - cx, y - cy)];
const out = new Uint8Array(W * H * 3), rad = new Float32Array(W * H).fill(-1);
function raster(a, b, c, ua, ub, uc, ra, rb, rc) { // a/b/c = [px,py] Ziel, ua.. = Quell-UV, r = Radius
  const minX = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))), maxX = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0], c[0]))), minY = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))), maxY = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
  const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]); if (Math.abs(d) < 1e-9) return;
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) { const px = x + .5, py = y + .5;
    const l1 = ((b[1] - c[1]) * (px - c[0]) + (c[0] - b[0]) * (py - c[1])) / d, l2 = ((c[1] - a[1]) * (px - c[0]) + (a[0] - c[0]) * (py - c[1])) / d, l3 = 1 - l1 - l2;
    if (l1 < -.02 || l2 < -.02 || l3 < -.02) continue; const r = l1 * ra + l2 * rb + l3 * rc, k = y * W + x; if (r < rad[k] - .004) continue;
    const u = l1 * ua[0] + l2 * ub[0] + l3 * uc[0], v = l1 * ua[1] + l2 * ub[1] + l3 * uc[1]; const sx = Math.min(SW - 1, Math.max(0, Math.floor((u - Math.floor(u)) * SW))), sy = Math.min(SH - 1, Math.max(0, Math.floor((v - Math.floor(v)) * SH)));
    rad[k] = r; out[k * 3] = sp[(sy * SW + sx) * 3]; out[k * 3 + 1] = sp[(sy * SW + sx) * 3 + 1]; out[k * 3 + 2] = sp[(sy * SW + sx) * 3 + 2]; } }
for (const { P, U, I } of prims) { const cnt = I ? I.length : P.length / 3;
  for (let t = 0; t < cnt; t += 3) { const id = [0, 1, 2].map(j => I ? I[t + j] : t + j), C = id.map(i => cyl(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])), S = id.map(i => [U[i * 2], U[i * 2 + 1]]);
    const us = C.map(c => c[0]); if (Math.max(...us) - Math.min(...us) > .5) C.forEach(c => { if (c[0] < .5) c[0] += 1; });
    for (const off of [0, -1]) raster(...C.map(c => [(c[0] + off) * W, (1 - c[1]) * H]), ...S, ...C.map(c => c[2])); } }
// Löcher füllen (Nachbarn), damit keine schwarzen Fugen entstehen
for (let pass = 0; pass < 24; pass++) { let left = 0; const nr = rad.slice();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = y * W + x; if (rad[k] >= 0) continue; let r = 0, g = 0, b = 0, m = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = (x + dx + W) % W, yy = y + dy; if (yy < 0 || yy >= H) continue; const q = yy * W + xx; if (rad[q] < 0) continue; r += out[q * 3]; g += out[q * 3 + 1]; b += out[q * 3 + 2]; m++; }
    if (m) { out[k * 3] = r / m; out[k * 3 + 1] = g / m; out[k * 3 + 2] = b / m; nr[k] = 0; } else left++; } rad.set(nr); if (!left) break; }
const jpg = await sharp(Buffer.from(out), { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 88 }).toBuffer();
await sharp(jpg).toFile('../game/assets/ms/w_birke/lod_bark.jpg');
// Stamm neu vernetzen (Retopologie des Scans): Radius r(Winkel, Höhe) aus den Scan-Punkten, 8 Scan-Abschnitte gespiegelt übereinander (≈ 3,5 m),
// Textur-v läuft mit (Sampler MIRRORED_REPEAT) → keine Nähte. Ergebnis: ein Stamm mit ~5k Punkten, echte Scan-Form und -Rinde.
const NA = 64, NZ = 16, SEG = 8, RS = NZ * SEG, za = z0 + (z1 - z0) * .03, zb = z1 - (z1 - z0) * .03;
const bins = Array.from({ length: NA * NZ }, () => []);
for (const { P } of prims) for (let i = 0; i < P.length; i += 3) { const [u, , r] = cyl(P[i], P[i + 1], P[i + 2]), z = P[i + 2]; if (z < za || z > zb) continue;
  const a = Math.min(NA - 1, Math.floor(u * NA)), k = Math.min(NZ - 1, Math.floor((z - za) / (zb - za) * NZ)); bins[k * NA + a].push(r); }
let R = bins.map(b => { if (!b.length) return NaN; b.sort((x, y) => x - y); return b[Math.floor(b.length * .8)]; });
const mean = R.filter(x => !isNaN(x)).reduce((a, b) => a + b, 0) / R.filter(x => !isNaN(x)).length; R = R.map(x => isNaN(x) ? mean : x);
for (let it = 0; it < 2; it++) R = R.map((_, i) => { const a = i % NA, k = Math.floor(i / NA); let s = 0, m = 0; for (let dk = -1; dk <= 1; dk++) for (let da = -1; da <= 1; da++) { const kk = k + dk; if (kk < 0 || kk >= NZ) continue; s += R[kk * NA + (a + da + NA) % NA] * (da || dk ? 1 : 2); m += da || dk ? 1 : 2; } return s / m; });
{ const col = Array.from({ length: NA }, (_, a) => { let t = 0; for (let k = 0; k < NZ; k++) t += R[k * NA + a]; return t / NZ; }); R = R.map((r, i) => r * .35 + col[i % NA] * .65); }
const rAt = (a, k) => { const kk = Math.max(0, Math.min(NZ - 1, k)); return R[kk * NA + ((a % NA) + NA) % NA]; };
const segH = zb - za, pos = [], uv = [], idx = [];
for (let ring = 0; ring <= RS; ring++) { const seg = Math.floor(ring / NZ), f = (ring % NZ) / NZ, lf = seg % 2 ? 1 - f : f, kf = lf * (NZ - 1), k0 = Math.floor(kf), kt = kf - k0; // gespiegelt
  const vScan = (za + lf * segH - z0) / (z1 - z0); // 0..1 im gebackenen Bild (unten 0)
  const tw = ring / RS * 1.35, sh = Math.round(tw * NA); // leichte Drehung nach oben: bricht die Spiegelsymmetrie
  for (let a = 0; a <= NA; a++) { const r = rAt(a + sh, k0) * (1 - kt) + rAt(a + sh, k0 + 1) * kt, ang = (a / NA - .5) * 2 * Math.PI;
    pos.push(Math.cos(ang) * r, ring / NZ * segH, -Math.sin(ang) * r);
    uv.push(a / NA + sh / NA, seg + (seg % 2 ? 1 - vScan : vScan)); } }
// Bild: unten = v 0 → im Bild unten (1 − v). Spiegeln über gerade/ungerade Abschnitte übernimmt MIRRORED_REPEAT
for (let i = 0; i < uv.length; i += 2) uv[i + 1] = -uv[i + 1] + 1;
for (let ring = 0; ring < RS; ring++) for (let a = 0; a < NA; a++) { const p = ring * (NA + 1) + a, q = p + NA + 1; idx.push(p, p + 1, q, p + 1, q + 1, q); }
const P2 = new Float32Array(pos), I2 = new Uint32Array(idx), N2 = (() => { const N = new Float32Array(P2.length); for (let t = 0; t < I2.length; t += 3) { const [a, b, c] = [I2[t], I2[t + 1], I2[t + 2]];
  const ux = P2[b * 3] - P2[a * 3], uy = P2[b * 3 + 1] - P2[a * 3 + 1], uz = P2[b * 3 + 2] - P2[a * 3 + 2], vx = P2[c * 3] - P2[a * 3], vy = P2[c * 3 + 1] - P2[a * 3 + 1], vz = P2[c * 3 + 2] - P2[a * 3 + 2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; for (const i of [a, b, c]) { N[i * 3] += nx; N[i * 3 + 1] += ny; N[i * 3 + 2] += nz; } }
  for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; N[i] /= l; N[i + 1] /= l; N[i + 2] /= l; } return N; })();
// Naht (a = 0 und a = NA) gleiche Normalen
for (let ring = 0; ring <= RS; ring++) { const i0 = ring * (NA + 1), i1 = i0 + NA; for (let c = 0; c < 3; c++) { const m = (N2[i0 * 3 + c] + N2[i1 * 3 + c]) / 2; N2[i0 * 3 + c] = N2[i1 * 3 + c] = m; } }
const { Document } = await import('@gltf-transform/core'); const doc = new Document(); const buf = doc.createBuffer();
const tex = doc.createTexture('birke_rinde').setImage(new Uint8Array(jpg)).setMimeType('image/jpeg');
const mat = doc.createMaterial('birke').setBaseColorTexture(tex).setRoughnessFactor(.92).setMetallicFactor(0);
mat.getBaseColorTextureInfo().setWrapS(10497).setWrapT(33648);
const prim = doc.createPrimitive().setMaterial(mat).setIndices(doc.createAccessor().setType('SCALAR').setArray(I2).setBuffer(buf))
  .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(P2).setBuffer(buf)).setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(N2).setBuffer(buf))
  .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(uv)).setBuffer(buf));
doc.createScene().addChild(doc.createNode('birke_stamm').setMesh(doc.createMesh('birke_stamm').addPrimitive(prim)));
await io.write(LOD, doc); console.log('fertig: Punkte', P2.length / 3, 'Höhe', (RS / NZ * segH).toFixed(2), 'Radius', mean.toFixed(3));
