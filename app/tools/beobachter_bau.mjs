// R-21 · Der Beobachter backen: Gestalt umformen (beobachter_form.mjs), Lider, Skelett und Hautgewichte, eigene Clips, Hautattribute (Höhlen/Dicke/Falten),
// Texturen (Wachshaut, Augen), GLB schreiben, Filmstreifen (Silhouette ohne Textur, CLAUDE.md §20).
// Aufruf (in app/): node tools/beobachter_bau.mjs [--vorschau=Ordner] [--film=Ordner] [--nur=clip,clip] [--gewichte]
// Danach: node tools/ktx.mjs
import fs from 'fs'; import path from 'path'; import * as THREE from 'three'; import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { umformen, normalen } from './beobachter_form.mjs';
import { bild } from './beobachter_bild.mjs';
globalThis.window = globalThis; globalThis.self = globalThis;
const args = process.argv.slice(2), opt = k => { const a = args.find(x => x === '--' + k || x.startsWith('--' + k + '=')); return a ? (a.split('=')[1] ?? true) : null; };
const DIR = path.resolve('..', 'game', 'assets', 'ms', 'beobachter'), SRC = path.join(DIR, 'model.glb');
// ---------------------------------------------------------------- Original lesen (three entpackt Quantisierung und Texturverschiebung)
export async function quelle() { const buf = fs.readFileSync(SRC); const g = await new Promise((r, j) => new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', r, j));
  g.scene.updateMatrixWorld(true); const M = []; g.scene.traverse(m => { if (m.isMesh) M.push(m); });
  const teil = m => { const G = m.geometry, P = G.attributes.position, U = G.attributes.uv, I = G.index, v = new THREE.Vector3(), pos = new Float32Array(P.count * 3), uv = new Float32Array(P.count * 2);
    const map = m.material.map, rep = map ? map.repeat : { x: 1, y: 1 }, of = map ? map.offset : { x: 0, y: 0 };
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); pos.set([v.x, v.y, v.z], i * 3); if (U) uv.set([U.getX(i) * rep.x + of.x, U.getY(i) * rep.y + of.y], i * 2); }
    return { pos, uv, idx: I ? Uint32Array.from(I.array) : Uint32Array.from({ length: P.count }, (_, i) => i) }; };
  // Teile: 0 Arme, 1 Körper/Beine, 2 Kopf+Fühler, 3 Brauen (weg), 4 Nase (weg), 5 Augen
  return { arm: teil(M[0]), koerper: teil(M[1]), kopf: teil(M[2]), augen: teil(M[5]), map: M[0].material.map }; }
async function vorschau(dir, T) { fs.mkdirSync(dir, { recursive: true }); const pal = { arm: [236, 228, 218], koerper: [236, 228, 218], kopf: [236, 228, 218], augen: [30, 30, 36], lider: [236, 228, 218] };
  const parts = Object.entries(T).filter(([k, t]) => t && t.pos).map(([k, t]) => ({ pos: t.pos, idx: t.idx, nrm: t.nrm || normalen(t.pos, t.idx), col: t.ao, color: pal[k] }));
  for (const [n, yaw, pitch] of [['vorn', 0, 0], ['seite', Math.PI / 2, 0], ['schraeg', .6, .15], ['hinten', Math.PI + .5, .1]]) await bild(path.join(dir, 'form_' + n + '.png'), parts, { W: 500, H: 760, yaw, pitch });
  for (const [n, B, yaw, pitch] of [['gesicht', [-1, 1, .45, .9, -1, 1], .35, .05], ['hand', [-1, -.12, -.02, .3, -1, 1], -1.2, .1], ['fuss', [0, 1, -.01, .12, -1, 1], .7, .45], ['hals', [-1, 1, .3, .6, -1, 1], 1.0, 0]]) await bild(path.join(dir, 'zoom_' + n + '.png'), parts, { W: 500, H: 500, yaw, pitch, box: B }); }
if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const T = await quelle(); const info = umformen(T); console.log('Form', info);
  if (opt('vorschau')) await vorschau(String(opt('vorschau')), T);
}
