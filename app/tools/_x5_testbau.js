// X-5 Testbau: wie assemble.js + build.js, aber in app/game/index_x5.html und ohne Module, die gerade das Spiel stoppen (X5_SKIP=kiffen,…)
const fs = require('fs'), path = require('path'), cp = require('child_process');
const skip = (process.env.X5_SKIP || '').split(',').filter(Boolean);
let src = fs.readFileSync(path.join(__dirname, 'assemble.js'), 'utf8');
for (const s of skip) src = src.replace(`'${s}', `, '');
const tmp = path.join(__dirname, '_x5_assemble_tmp.js'); fs.writeFileSync(tmp, src);
const out = path.join(__dirname, '..', '..', 'game', 'index_x5.html');
cp.execFileSync(process.execPath, [tmp, out], { stdio: 'inherit' }); fs.rmSync(tmp);
let html = fs.readFileSync(out, 'utf8'); const VERSION = require('../package.json').version;
const rep = (a, b) => { html = html.split(a).join(b); };
rep('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js', './vendor/three/build/three.module.js');
rep('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/', './vendor/three/examples/jsm/');
rep('"three/addons/": "./vendor/three/examples/jsm/"', '"three/addons/": "./vendor/three/examples/jsm/",\n  "three-mesh-bvh": "./vendor/three-mesh-bvh/index.module.js"');
html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '').replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link href="vendor/fonts/fonts.css" rel="stylesheet">');
html = html.replace('<head>', `<head>\n<script>window.IS_APP = true; window.HAM_VERSION = ${JSON.stringify(VERSION)};</script>`);
fs.writeFileSync('C:/Users/GIGABYTE/_x5_root/index.html', html); fs.rmSync(out); console.log('Testbau: _x5_root/index.html', skip.length ? '(ohne ' + skip.join(', ') + ')' : '');
