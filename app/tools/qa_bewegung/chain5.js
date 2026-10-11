const fs = require('fs'); const src = f => fs.readFileSync(f, 'utf8');
const steps = JSON.parse(src('mk_1.json'));
const add = (nm, js, t) => steps.push({ name: nm, shot: false, wait: 100, timeout: t || 900000, js });
const areas = [
  ['falle_amt', [585, 735, -2625, -2575], [601, -2600]],
  ['falle_villa', [-940, -875, 880, 925], [-917, 900]],
  ['falle_nr4', [-1415, -1385, 1385, 1455], [-1403, 1402]],
  ['falle_kb2', [-1490, -1430, 1395, 1450], [-1442, 1405]],
  ['falle_nr7', [-65, 5, -35, 5], [-47, -8]],
  ['falle_k6', [20, 120, 150, 250], [60, 190]],
];
for (const [name, box, seed] of areas) {
  add('cfg_' + name, `(() => { window.__BWCFG = { name: '${name}', box: ${JSON.stringify(box)}, cs: .5, seed: ${JSON.stringify(seed)} }; return 'c'; })()`);
  add(name, src('falle.js'));
}
fs.writeFileSync('chain5.json', JSON.stringify(steps)); console.log('chain5', steps.length);
