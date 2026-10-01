// R-21 Hilfsskript: Beobachter-Modell ansehen (Teile, Maße, Ansichten) – node tools/_beob_info.mjs <ausgabeordner> [glb]
import fs from 'fs'; import path from 'path'; import * as THREE from 'three'; import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; import sharp from 'sharp';
import { render, partsOf } from './_x5_render.mjs';
globalThis.window = globalThis; globalThis.self = globalThis;
const OUT = process.argv[2] || '.', SRC = process.argv[3] || '../game/assets/ms/beobachter/model.glb'; fs.mkdirSync(OUT, { recursive: true });
const buf = fs.readFileSync(SRC); const g = await new Promise((r, j) => new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', r, j));
const root = g.scene; root.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(root); console.log('box', bb.min.toArray().map(v => v.toFixed(3)), bb.max.toArray().map(v => v.toFixed(3)));
const pal = [[220, 90, 90], [90, 200, 90], [90, 120, 230], [230, 200, 80], [200, 90, 220], [80, 210, 210], [240, 150, 60]]; let i = 0;
const parts = []; root.traverse(m => { if (!m.isMesh) return; const b = new THREE.Box3().setFromObject(m); console.log('mesh', i, m.name, m.parent && m.parent.name, 'n', m.geometry.attributes.position.count, b.min.toArray().map(v => v.toFixed(3)).join(','), '→', b.max.toArray().map(v => v.toFixed(3)).join(','));
  const p = partsOf(m)[0]; p.color = pal[i % pal.length]; parts.push(p); i++; });
for (const [n, yaw, pitch] of [['vorn', 0, 0], ['seite', Math.PI / 2, 0], ['hinten', Math.PI, 0], ['oben', 0, 1.4], ['schraeg', .6, .25]]) await render(path.join(OUT, 'teile_' + n + '.png'), parts, { W: 700, H: 700, yaw, pitch });
// texturiert
const mat = []; root.traverse(m => { if (m.isMesh) mat.push(m.material); }); const map = mat[0].map; if (map && map.image) console.log('map', map.image.width, map.image.height, 'repeat', map.repeat.toArray(), 'offset', map.offset.toArray());
