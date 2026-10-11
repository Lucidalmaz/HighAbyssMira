// mk_ia.js <name> <kap> <nSteps> : Schritte: (ggf. s0) lib, cfg, ia_inv x n, dump
const fs = require('fs');
const [name, kap, n] = process.argv.slice(2);
const src = f => fs.readFileSync(f, 'utf8');
const chain = src('chain.js'); const MECH = chain.match(/const MECH='(.*?)';/s)[1].replace(/\\\\/g, '\\');
const steps = JSON.parse(src('mk_' + kap + '.json'));
const add = (nm, js, t) => steps.push({ name: nm, shot: false, wait: 100, timeout: t || 900000, js });
add('cfg', `(() => { window.__BWCFG = { kap: ${kap}, name: '${name}', budget: 85, reset: true, rx: ${JSON.stringify(MECH)} }; window.__IAINV = null; return 'c'; })()`);
for (let i = 0; i < +n; i++) add('ia', src('ia_inv.js'));
add('cfg2', `(() => { window.__BWCFG.reset = false; window.__BWCFG.dumpAlways = true; return 'c'; })()`);
add('ia', src('ia_inv.js'));
fs.writeFileSync(name + '.json', JSON.stringify(steps)); console.log(name, steps.length);
