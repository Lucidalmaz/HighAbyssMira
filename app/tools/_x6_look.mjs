// X-6 (kiffen): GLB ansehen (Software-Renderer aus _x5_render.mjs), mit Knoten-Matrizen und allen Erweiterungen.
// node tools/_x6_look.mjs datei.glb out.png [yaw] [pitch] [nur=name,name]
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions'; import sharp from 'sharp'; import { render } from './_x5_render.mjs';
const [f, out, yaw = .6, pitch = .4, only] = process.argv.slice(2); const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(f); const parts = []; const texC = new Map();
const onlyL = only && only !== '-' ? only.split(',') : null;
for (const node of doc.getRoot().listNodes()) { const mesh = node.getMesh(); if (!mesh) continue; if (onlyL && !onlyL.some(s => node.getName().includes(s))) continue; const W = node.getWorldMatrix();
  for (const p of mesh.listPrimitives()) { const P = p.getAttribute('POSITION').getArray(), U = p.getAttribute('TEXCOORD_0')?.getArray(), I = p.getIndices()?.getArray(); const m = p.getMaterial();
    let bt = m && m.getBaseColorTexture(); if (!bt && m) { const sg = m.getExtension('KHR_materials_pbrSpecularGlossiness'); if (sg) bt = sg.getDiffuseTexture(); }
    let T = null; if (bt) { if (!texC.has(bt)) { const { data, info } = await sharp(Buffer.from(bt.getImage())).resize(1024, 1024, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true }); texC.set(bt, { data, w: info.width, h: info.height, ch: info.channels }); } T = texC.get(bt); }
    const col = m ? m.getBaseColorFactor().slice(0, 3).map(x => Math.min(255, Math.pow(x, 1 / 2.2) * 255)) : [180, 180, 180];
    const cnt = I ? I.length : P.length / 3, v = new Float32Array(cnt * 5);
    for (let k = 0; k < cnt; k++) { const i = I ? I[k] : k; const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
      v[k * 5] = W[0] * x + W[4] * y + W[8] * z + W[12]; v[k * 5 + 1] = W[1] * x + W[5] * y + W[9] * z + W[13]; v[k * 5 + 2] = W[2] * x + W[6] * y + W[10] * z + W[14]; if (U) { v[k * 5 + 3] = U[i * 2]; v[k * 5 + 4] = 1 - U[i * 2 + 1]; } } // glTF: v von oben
    parts.push({ v, tex: T, color: col }); } }
await render(out, parts, { yaw: +yaw, pitch: +pitch });
