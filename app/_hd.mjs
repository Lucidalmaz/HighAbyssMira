import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const id of fs.readdirSync('game/assets/chars')) { const f = `game/assets/chars/${id}/model.glb`; if (!fs.existsSync(f)) continue; const d = await io.read(f);
  for (const n of d.getRoot().listNodes()) { const m = n.getMesh(); if (!m) continue; for (const p of m.listPrimitives()) { const mt = p.getMaterial(); if (!mt || !/^Std_Skin_Head$/.test(mt.getName())) continue;
    const W = n.getWorldMatrix(), pos = p.getAttribute('POSITION'), mn = pos.getMin([]), mx = pos.getMax([]); const mi=[1e9,1e9,1e9], ma=[-1e9,-1e9,-1e9];
    for (let c = 0; c < 8; c++) { const q = [c&1?mx[0]:mn[0], c&2?mx[1]:mn[1], c&4?mx[2]:mn[2]]; for (let k=0;k<3;k++){ const v=W[k]*q[0]+W[4+k]*q[1]+W[8+k]*q[2]+W[12+k]; mi[k]=Math.min(mi[k],v); ma[k]=Math.max(ma[k],v);} }
    console.log(id.padEnd(12), 'ext', [0,1,2].map(k => (ma[k]-mi[k]).toFixed(3)).join(' '), 'top y', ma[1].toFixed(3), 'zc', ((ma[2]+mi[2])/2).toFixed(3)); break; } } }
