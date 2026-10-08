import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { read } from 'ktx-parse';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const id = process.argv[2]; const d = await io.read(`game/assets/chars/${id}/model.glb.ktx.glb`);
for (const m of d.getRoot().listMaterials()) { const t = m.getBaseColorTexture(); if (!t) continue; const k = read(new Uint8Array(t.getImage())); console.log(m.getName().padEnd(28), k.pixelWidth+'x'+k.pixelHeight, 'levels', k.levelCount, 'alphaMode', m.getAlphaMode(), 'dfd', k.dataFormatDescriptor[0] && k.dataFormatDescriptor[0].samples.length); }
