// P2: Drehspitzen in den schon gebackenen Figuren glätten (dieselbe Regel wie tools/mocap.mjs → despike beim Backen) – ändert NUR Drehungs-Schlüssel der Animationen,
// Netze/Texturen/Knoten bleiben unverändert. Schreibt model.glb und model.glb.ktx.glb (das Spiel lädt die .ktx.glb).
// Aufruf (in app/): node tools/mocap_glatt.mjs <id …|all> [--dry] [--backup=Ordner]
import fs from 'fs'; import path from 'path'; import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions'; import { despike } from './mocap.mjs';
const args = process.argv.slice(2), dry = args.includes('--dry'), bk = (args.find(a => a.startsWith('--backup=')) || '').slice(9), CH = '../game/assets/chars/';
let ids = args.filter(a => !a.startsWith('--')); if (!ids.length || ids[0] === 'all') ids = fs.readdirSync(CH).filter(d => fs.existsSync(CH + d + '/model.glb'));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const id of ids) for (const f of [CH + id + '/model.glb', CH + id + '/model.glb.ktx.glb']) { if (!fs.existsSync(f)) continue;
  const doc = await io.read(f), log = {}; let n = 0; const done = new Set(), el = [];
  for (const A of doc.getRoot().listAnimations()) for (const c of A.listChannels()) { if (c.getTargetPath() !== 'rotation') continue; const s = c.getSampler(), out = s.getOutput(); if (done.has(out)) continue; done.add(out);
    const times = s.getInput().getArray(), N = out.getCount(), v = new Float32Array(N * 4); for (let i = 0; i < N; i++) { out.getElement(i, el); v.set(el, i * 4); }
    const k = despike(times, v); if (!k) continue; n += k; log[A.getName()] = (log[A.getName()] || 0) + k; for (let i = 0; i < N; i++) out.setElement(i, Array.from(v.subarray(i * 4, i * 4 + 4))); }
  console.log(path.basename(path.dirname(f)) + '/' + path.basename(f) + ': ' + n + ' Schlüssel geglättet ' + JSON.stringify(log));
  if (!n || dry) continue; if (bk) { fs.mkdirSync(path.join(bk, id), { recursive: true }); fs.copyFileSync(f, path.join(bk, id, path.basename(f))); }
  fs.writeFileSync(f, await io.writeBinary(doc)); }
