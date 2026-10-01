// Lizenz (Release-Prüfung, docs/technical/lizenzen_release.md): Justins Bewegungen aus der Unreal-Vorlage (MM_Idle, MF_Unarmed_Walk_Fwd, MM_Attack_01, MM_Death_Front_01)
// durch Fab-Mocap ersetzen (Motifect/Mocap.in, Satz „justin“ in cast.json → mocap) – gleicher Übertragungskern wie alle Figuren (tools/mocap.mjs über mocap_bake.mjs).
// Ablauf: GLB aus game/justin.js (window.JUSTIN_GLB) → vorübergehend game/assets/chars/justin/model.glb → mocap_bake (alte Clips fallen weg) → zurück in justin.js + game/justin.glb.
// Aufruf (in app/): node tools/justin_mocap.mjs
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), GAME = path.resolve(HERE, '..', '..', 'game'), JS = path.join(GAME, 'justin.js'), TMP = path.join(GAME, 'assets', 'chars', 'justin', 'model.glb');
const src = fs.readFileSync(JS, 'utf8'), re = /window\.JUSTIN_GLB = "([A-Za-z0-9+/=]+)"/, m = src.match(re); if (!m) throw new Error('JUSTIN_GLB fehlt');
fs.writeFileSync(TMP, Buffer.from(m[1], 'base64'));
try { execFileSync(process.execPath, [path.join(HERE, 'mocap_bake.mjs'), 'justin', '--no-ktx'], { stdio: 'inherit', cwd: path.resolve(HERE, '..') });
  const glb = fs.readFileSync(TMP); fs.writeFileSync(JS, src.replace(re, () => 'window.JUSTIN_GLB = "' + glb.toString('base64') + '"')); fs.writeFileSync(path.join(GAME, 'justin.glb'), glb);
  console.log('justin.js/justin.glb: ' + (glb.length / 1e6).toFixed(1) + ' MB');
} finally { fs.unlinkSync(TMP); }
