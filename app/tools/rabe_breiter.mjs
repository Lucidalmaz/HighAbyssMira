// Rabe: Fluegelfedern lateral verbreitern (Federn ueberlappen, keine Luecken im Faecher) – direkt am fertigen GLB, Skelett/Clips bleiben bit-gleich.
// Warum nicht neu bauen: Blender ist in dieser Umgebung nicht startbar; die Federn sind einzelne Gitter (Komponenten) mit Wing-Gewichten.
//   node tools/rabe_breiter.mjs <quelle.glb> <ziel.glb> [faktor_schwingen=1.26] [faktor_decken=1.2]
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const [SRC, DST, FA, FB] = process.argv.slice(2); const FS = +(FA || 1.26), FD = +(FB || 1.2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS), doc = await io.read(SRC), root = doc.getRoot();
const skin = root.listSkins()[0], jn = skin.listJoints().map(j => j.getName()), wingJ = new Set(jn.map((n, i) => /Wing|UpperArm|Forearm|Hand$/.test(n) ? i : -1).filter(i => i >= 0));
let nF = 0;
for (const mesh of root.listMeshes()) for (const P of mesh.listPrimitives()) {
  const posA = P.getAttribute('POSITION'), J = P.getAttribute('JOINTS_0'), W = P.getAttribute('WEIGHTS_0'), UV = P.getAttribute('TEXCOORD_0'), idx = P.getIndices(); if (!posA || !J || !W || !idx) continue;
  const pos = posA.getArray(), ja = J.getArray(), wa = W.getArray(), uv = UV.getArray(), I = idx.getArray(), n = pos.length / 3;
  const par = new Int32Array(n).map((_, i) => i); const find = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
  for (let t = 0; t < I.length; t += 3) { const a = find(I[t]), b = find(I[t + 1]), c = find(I[t + 2]); par[b] = a; par[find(c)] = a; }
  const comp = new Map(); for (let i = 0; i < n; i++) { const r = find(i); if (!comp.has(r)) comp.set(r, []); comp.get(r).push(i); }
  for (const vs of comp.values()) { if (vs.length < 6 || vs.length > 140) continue;
    let ww = 0, vm = 0; for (const i of vs) { for (let k = 0; k < 4; k++) if (wingJ.has(ja[i * 4 + k])) ww += wa[i * 4 + k]; vm += uv[i * 2 + 1]; } ww /= vs.length; vm /= vs.length; if (ww < .6) continue;
    const F = vm < .125 ? FS : FD; if (vm > .27) continue; // glTF-v (nach unten): Zeilen Hand/Arm (v < .125) und Decken (v .19-.25); Schuppen/Auge/Koerper nicht
    const m = [0, 0, 0]; for (const i of vs) for (let a = 0; a < 3; a++) m[a] += pos[i * 3 + a]; for (let a = 0; a < 3; a++) m[a] /= vs.length;
    const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (const i of vs) { const d = [pos[i * 3] - m[0], pos[i * 3 + 1] - m[1], pos[i * 3 + 2] - m[2]]; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) C[r][c] += d[r] * d[c]; }
    // Hauptachsen per Potenzverfahren (Laenge), dann zweite Achse (Breite)
    const mul = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];
    const nrm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
    let e1 = [1, .3, .2]; for (let k = 0; k < 30; k++) e1 = nrm(mul(C, e1));
    const l1 = Math.hypot(...mul(C, e1)); let e2 = [.2, 1, .4]; for (let k = 0; k < 30; k++) { const d = e2[0] * e1[0] + e2[1] * e1[1] + e2[2] * e1[2]; e2 = nrm(mul(C, e2.map((x, a) => x - d * e1[a]))); { const d2 = e2[0] * e1[0] + e2[1] * e1[1] + e2[2] * e1[2]; e2 = nrm(e2.map((x, a) => x - d2 * e1[a])); } }
    for (const i of vs) { const d = [pos[i * 3] - m[0], pos[i * 3 + 1] - m[1], pos[i * 3 + 2] - m[2]], w = d[0] * e2[0] + d[1] * e2[1] + d[2] * e2[2];
      for (let a = 0; a < 3; a++) pos[i * 3 + a] += e2[a] * w * (F - 1); }
    nF++; }
  posA.setArray(pos);
}
await io.write(DST, doc); console.log('Federn verbreitert:', nF, '->', DST);
