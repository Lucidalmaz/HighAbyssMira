const fs = require('fs'); const src = f => fs.readFileSync(f, 'utf8');
const steps = JSON.parse(src('mk_1.json'));
const add = (nm, js, t) => steps.push({ name: nm, shot: false, wait: 100, timeout: t || 900000, js });
const areas = [
  ['f2_dorf', [-110, 110, -42, 62], [-66, 2]],
  ['f2_wald', [-60, 140, 62, 262], [20, 170]],
  ['f2_amt', [585, 735, -2625, -2575], [601, -2600]],
  ['f2_villa', [-940, -875, 880, 925], [-917, 900]],
  ['f2_nr4', [-1415, -1385, 1385, 1455], [-1403, 1402]],
  ['f2_kb2', [-1490, -1430, 1395, 1450], [-1442, 1405]],
  ['f2_nr1', [-65, 5, -35, 5], [-47, -8]],
  ['f2_k6', [20, 120, 150, 250], [60, 190]],
];
for (const [name, box, seed] of areas) {
  add('cfg_' + name, `(() => { window.__BWCFG = { name: '${name}', box: ${JSON.stringify(box)}, cs: .5, seed: ${JSON.stringify(seed)} }; return 'c'; })()`);
  add(name, src('falle2.js'));
}
fs.writeFileSync('chain6.json', JSON.stringify(steps)); console.log('chain6', steps.length);
