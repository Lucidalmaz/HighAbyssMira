// Kopiert das Spiel aus games/birkenhain in die App und stellt alle Online-Quellen auf lokale Dateien um.
const fs = require('fs'), path = require('path');
const SRC = 'C:/Users/GIGABYTE/OneDrive/Desktop/Claude projekte/games/birkenhain';
const OUT = path.join(__dirname, 'game');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const copy = (a, b) => fs.cpSync(a, b, { recursive: true });
for (const f of ['sounds.js', 'justin.js']) if (fs.existsSync(path.join(SRC, f))) copy(path.join(SRC, f), path.join(OUT, f));
if (fs.existsSync(path.join(SRC, 'assets'))) copy(path.join(SRC, 'assets'), path.join(OUT, 'assets'));
// Three.js und Schriften lokal
copy(path.join(__dirname, 'node_modules/three/build'), path.join(OUT, 'vendor/three/build'));
copy(path.join(__dirname, 'node_modules/three/examples/jsm'), path.join(OUT, 'vendor/three/examples/jsm'));
copy(path.join(__dirname, 'vendor/fonts'), path.join(OUT, 'vendor/fonts'));
copy(path.join(__dirname, 'node_modules/three-mesh-bvh/build/index.module.js'), path.join(OUT, 'vendor/three-mesh-bvh/index.module.js'));
copy(path.join(__dirname, 'tools/preview.html'), path.join(OUT, 'preview.html'));
let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
const rep = (a, b) => { if (!html.includes(a)) throw new Error('Nicht gefunden: ' + a); html = html.split(a).join(b); };
rep('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js', './vendor/three/build/three.module.js');
rep('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/', './vendor/three/examples/jsm/');
rep('"three/addons/": "./vendor/three/examples/jsm/"', '"three/addons/": "./vendor/three/examples/jsm/",\n  "three-mesh-bvh": "./vendor/three-mesh-bvh/index.module.js"');
html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '');
html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link href="vendor/fonts/fonts.css" rel="stylesheet">');
html = html.replace('<head>', '<head>\n<script>window.IS_APP = true;</script>');
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('Spiel kopiert:', fs.readdirSync(OUT).join(', '));
