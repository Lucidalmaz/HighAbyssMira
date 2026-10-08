import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'fs'; import sharp from 'sharp';
const id = process.argv[2], pat = new RegExp(process.argv[3], 'i'), out = 'C:/Users/GIGABYTE/_figscratch/';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const d = await io.read(`game/assets/chars/${id}/model.glb`);
for (const m of d.getRoot().listMaterials()) { if (!pat.test(m.getName())) continue;
  for (const [k, t] of [['base', m.getBaseColorTexture()], ['n', m.getNormalTexture()]]) { if (!t) continue;
    const buf = Buffer.from(t.getImage()); await sharp(buf).resize(1024, 1024, {fit:'inside'}).flatten({background:{r:255,g:0,b:255}}).png().toFile(out + `${id}_${m.getName()}_${k}.png`); 
    if (k==='base') await sharp(buf).resize(1024,1024,{fit:'inside'}).ensureAlpha().extractChannel(3).png().toFile(out + `${id}_${m.getName()}_alpha.png`).catch(e=>console.log('noalpha')); console.log('ok', m.getName(), k); } }
