// X-5: GLB ansehen (Software-Renderer). node tools/_x5_lookglb.mjs datei.glb out.png yaw pitch [nur=name,name] [flap=winkel]
import { NodeIO } from '@gltf-transform/core'; import sharp from 'sharp'; import { render } from './_x5_render.mjs';
const [f, out, yaw, pitch, only, flap] = process.argv.slice(2); const doc = await new NodeIO().read(f); const parts = []; const texC = new Map();
const onlyL = only && only !== '-' ? only.split(',') : null, fa = flap ? +flap : 0;
for (const node of doc.getRoot().listNodes()) { const mesh = node.getMesh(); if (!mesh) continue; if (onlyL && !onlyL.includes(node.getName())) continue;
  for (const p of mesh.listPrimitives()) { const P = p.getAttribute('POSITION').getArray(), U = p.getAttribute('TEXCOORD_0')?.getArray(), W = p.getAttribute('WEIGHTS_0')?.getArray(), I = p.getIndices()?.getArray(); const m = p.getMaterial();
    let T = null; const bt = m && m.getBaseColorTexture(); if (bt) { if (!texC.has(bt)) { const { data, info } = await sharp(Buffer.from(bt.getImage())).resize(1024, 1024, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true }); texC.set(bt, { data, w: info.width, h: info.height, ch: info.channels }); } T = texC.get(bt); }
    const col = m ? m.getBaseColorFactor().slice(0, 3).map(x => Math.min(255, Math.pow(x, 1 / 2.2) * 255)) : [180, 180, 180];
    const cnt = I ? I.length : P.length / 3, v = new Float32Array(cnt * 5), meta = JSON.parse(process.env.META || 'null');
    for (let k = 0; k < cnt; k++) { const i = I ? I[k] : k; let x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
      if (W && fa && meta) { const w = W[i * 4 + 1], a = -fa * w * Math.PI / 180, hy = meta.hinge[1], hz = meta.hinge[2], dy = y - hy, dz = z - hz; y = hy + dy * Math.cos(a) - dz * Math.sin(a); z = hz + dy * Math.sin(a) + dz * Math.cos(a); }
      v[k * 5] = x; v[k * 5 + 1] = y; v[k * 5 + 2] = z; if (U) { v[k * 5 + 3] = U[i * 2]; v[k * 5 + 4] = U[i * 2 + 1]; } }
    parts.push({ v, tex: T, color: col }); } }
await render(out, parts, { yaw: +yaw, pitch: +pitch });
