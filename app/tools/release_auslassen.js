// R-25: Was die Veröffentlichung NICHT mitliefern muss (die Quelle in game/ bleibt unverändert, nichts wird gelöscht).
// build.js --release kopiert diese Dateien nicht; `node tools/release_auslassen.js` zeigt die Liste mit Größen (--list: jede Datei).
//  1. Ungenutzte Assets (kein Verweis in app/mods, Lizenz-Audit docs/technical/lizenzen_release.md „Im Spiel nicht verwendet“).
//  2. Originale (jpg/png/glb/gltf), deren KTX-Fassung in assets/ktx2.json steht: das Spiel lädt über TextureLoader/GLTFLoader nur die KTX-Fassung
//     (Basis: GLTFLoader.load / TextureLoader.load). Ausnahmen in BRAUCHT_ORIGINAL: Dateien, die als <img>, CSS-Hintergrund, fetch-Rohdaten oder
//     createImageBitmap gelesen werden – dort gibt es kein KTX.
//  3. Zu einem .gltf mit KTX-Fassung gehörende .bin-Puffer und externe Texturen (samt ihrer .ktx2): die .ktx.glb enthält alles selbst.
//     Ausnahme BRAUCHT_KTX2: Texturen, die ein Modul zusätzlich einzeln über msTex lädt.
// Neue direkte Bild-/Rohdaten-Zugriffe (new Image, url(), fetch, createImageBitmap) auf assets/** hier eintragen.
const fs = require('fs'), path = require('path');

const UNGENUTZT = [ // Ordner (mit /) oder Dateien relativ zu game/
  'assets/ms/chapel_flooded/', 'assets/ms/fence_white/', 'assets/ms/gas_retro/', 'assets/ms/streetlamp_old/', 'assets/ms/teddy_ripped/',
  'assets/ms/tomb_wndy/', 'assets/ms/wheelbarrow_old/', 'assets/ue/lichtstein/', 'assets/ue/chars/', 'assets/chars/cast_liste.json',
  'assets/gore/kidney_kidneyc.jpg', 'assets/gore/kidney_kidneyc.jpg.ktx2',
];
const BRAUCHT_ORIGINAL = [ // Präfixe/Dateien relativ zu game/
  'assets/fotos/', 'assets/polaroid/',                                                      // Tagebuch/Album/Polaroids: <img>, Leinwand
  'assets/ms/album/cover.jpg',                                                               // album.js: CSS-Hintergrund
  'assets/ms/beutel1/futter.jpg', 'assets/ms/beutel2/futter.jpg', 'assets/ms/beutel3/futter.jpg', // beutel.js: CSS-Hintergrund
  'assets/ms/beobachter/model.glb',                                                          // beobachter.js: fetch → Rohdaten (Knoten/Clips)
  'assets/ms/gas_signs/OldGasStationSign.jpg', 'assets/ms/rust_sheet/b.jpg',                 // ausbau_ost_west.js, fassaden.js: new Image
  'assets/ms/vans/van_undamaged_d.jpg', 'assets/ms/hydrant/t0.jpg', 'assets/ms/parksign/t0.jpg', // strasse.js: Umfärben über Leinwand
  'assets/forestfloor/b.jpg', 'assets/ms/curtain_retro/curtainroom_01_-_Default_BaseColor.jpg', 'assets/ms/floor_worn/b.jpg', // fassaden.js small(): createImageBitmap
  'assets/ms/papier/',                                                                         // papierScan (Basis): echtes Papier (Image, Leinwand)
  'assets/ms/graffiti_echt/',                                                                  // zeichen.js: echte Graffiti (Image, Leinwand)
  'assets/ms/wall_damaged/b.jpg', 'assets/ms/wall_plaster/b.jpg', 'assets/ms/wallpaper_deco/b.jpg', 'assets/ms/wallpaper_fabric/b.jpg', 'assets/ms/wallpaper_old/b.jpg',
];
const BRAUCHT_KTX2 = ['assets/ms/shed_util/t0.jpg', 'assets/ms/shed_util/t1.jpg', 'assets/ms/shed_util/t2.jpg', // fassaden.js: Schindeln über msTex
  'assets/boulder/T_wfstcdnaw_1K_H.jpg'];                                                    // geheimnisse.js: Höhenkarte über msTex

const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else out.push(p); } return out; };
const hit = (r, list) => list.some(p => p.endsWith('/') ? r.startsWith(p) : r === p);

// Rückgabe: Map game-relativer Pfad → Grund
function auslassen(SRC) {
  const out = new Map(), A = path.join(SRC, 'assets'); if (!fs.existsSync(A)) return out;
  const rel = f => path.relative(SRC, f).split(path.sep).join('/');
  let list; try { list = JSON.parse(fs.readFileSync(path.join(A, 'ktx2.json'), 'utf8')); } catch (e) { list = { images: [], models: [] }; }
  const I = new Set(list.images), M = new Set(list.models), all = walk(A);
  for (const f of all) { const r = rel(f); if (hit(r, UNGENUTZT)) out.set(r, 'ungenutzt'); }
  for (const f of all) { const r = rel(f); if (out.has(r)) continue;
    if (/\.(jpe?g|png)$/i.test(r) && I.has(r) && !hit(r, BRAUCHT_ORIGINAL)) out.set(r, 'Original (KTX2 vorhanden)');
    else if (/\.(glb|gltf)$/i.test(r) && !/\.ktx\.glb$/i.test(r) && M.has(r) && !hit(r, BRAUCHT_ORIGINAL)) out.set(r, 'Original (KTX-Modell vorhanden)'); }
  for (const f of all.filter(f => /\.gltf$/i.test(f))) { const r = rel(f); if (!M.has(r)) continue;
    let j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
    const dir = path.dirname(f), dep = u => rel(path.join(dir, decodeURIComponent(u)));
    for (const b of j.buffers || []) if (b.uri && !b.uri.startsWith('data:')) { const d = dep(b.uri); if (!hit(d, BRAUCHT_ORIGINAL)) out.set(d, 'Puffer eines KTX-Modells'); }
    for (const im of j.images || []) if (im.uri && !im.uri.startsWith('data:')) { const d = dep(im.uri);
      if (!hit(d, BRAUCHT_ORIGINAL)) out.set(d, 'Textur eines KTX-Modells');
      if (!hit(d, BRAUCHT_KTX2) && fs.existsSync(path.join(SRC, d + '.ktx2'))) out.set(d + '.ktx2', 'Textur eines KTX-Modells (steckt in .ktx.glb)'); } }
  return out;
}
module.exports = { auslassen };

if (require.main === module) {
  const SRC = path.join(__dirname, '..', '..', 'game'), m = auslassen(SRC), by = new Map(); let total = 0;
  for (const [r, why] of m) { const s = fs.statSync(path.join(SRC, r)).size; total += s; by.set(why, (by.get(why) || 0) + s); if (process.argv.includes('--list')) console.log(r + '  · ' + why); }
  for (const [why, s] of by) console.log(why.padEnd(48), (s / 1e9).toFixed(2), 'GB');
  console.log(`Ausgelassen: ${m.size} Dateien, ${(total / 1e9).toFixed(2)} GB`);
}
