import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const ids = fs.readdirSync('game/assets/chars').filter(x => fs.existsSync(`game/assets/chars/${x}/model.glb`));
for (const id of ids) { const d = await io.read(`game/assets/chars/${id}/model.glb`); const R = d.getRoot();
  const mats = R.listMaterials().map(m => { const t = m.getBaseColorTexture(); return m.getName() + (t ? '[' + t.getSize().join('x') + ']' : '[-]') + (m.getAlphaMode()==='MASK'?'M':''); });
  console.log(id.padEnd(12), mats.filter(n => !/Std_(Eye|Cornea|Tear|Upper|Lower|Tongue|Nails)|Lesebrille/.test(n)).join(' ')); }
