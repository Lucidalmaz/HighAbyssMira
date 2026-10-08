import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import sharp from 'sharp'; import fs from 'fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const ids = fs.readdirSync('game/assets/chars').filter(x => fs.existsSync(`game/assets/chars/${x}/model.glb`));
const out = {};
for (const id of ids) { const d = await io.read(`game/assets/chars/${id}/model.glb`); let R=0,G=0,B=0,W=0; const seen = new Set();
  for (const m of d.getRoot().listMaterials()) { if (m.getAlphaMode() !== 'MASK' || /lash|shoes|footwear/i.test(m.getName()) || /beard|bushy_base/i.test(m.getName())) continue; const t = m.getBaseColorTexture(); if (!t || seen.has(t)) continue; seen.add(t);
    const { data, info } = await sharp(Buffer.from(t.getImage())).resize(256,256,{fit:'fill'}).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) { const a = data[i+3]/255; if (a < .55) continue; R += data[i]*a; G += data[i+1]*a; B += data[i+2]*a; W += a; } }
  if (W > 100) { const h = x => Math.round(x/W).toString(16).padStart(2,'0'); out[id] = '#' + h(R) + h(G) + h(B); } }
console.log(JSON.stringify(out));
