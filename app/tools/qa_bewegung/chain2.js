// chain2.js <kap> : chain2_k<kap>.json: (s0+lib) veh_test, obj_test x4 (max 300), ia (mech filter, 3 steps+dump), iap_test
const fs=require('fs');const kap=+process.argv[2];
const src=f=>fs.readFileSync(f,'utf8');
const chain=src('chain.js'); const MECH=chain.match(/const MECH='(.*?)';/s)[1].replace(/\\\\/g, '\\');
const steps=JSON.parse(fs.readFileSync('mk_'+kap+'.json','utf8'));
const add=(name,js,t)=>steps.push({name,shot:false,wait:100,timeout:t||900000,js});
add('cfgveh',`(() => { window.__BWCFG = { name: 'veh_k${kap}' }; return 'c'; })()`);
add('veh_test',src('veh_test.js'));
add('cfgobj',`(() => { window.__BWCFG = { kap: ${kap}, name: 'obj_k${kap}', budget: 100, max: 300 }; window.__BWOBJ = null; return 'c'; })()`);
for(let i=0;i<4;i++) add('obj_test',src('obj_test.js'));
add('cfgia',`(() => { window.__BWCFG = { kap: ${kap}, name: 'ia_k${kap}', budget: 85, reset: true, rx: ${JSON.stringify(MECH)} }; window.__IAINV = null; return 'c'; })()`);
for(let i=0;i<3;i++) add('ia_inv',src('ia_inv.js'));
add('cfgia3',`(() => { window.__BWCFG.dumpAlways = true; window.__BWCFG.reset = false; return 'c'; })()`);
add('ia_inv',src('ia_inv.js'));
add('cfgiap',`(() => { window.__BWCFG = { name: 'iap_k${kap}' }; return 'c'; })()`);
add('iap_test',src('iap_test.js'));
add('hohl',src('hohl_stat.js').replace("out/hohl.json","out/hohl_k"+kap+".json"));
fs.writeFileSync('chain2_k'+kap+'.json',JSON.stringify(steps));console.log('chain2_k'+kap,steps.length);
