// chainO.js <kap> : nur die Objekt-Sprungtests (s0+lib, cfgobj, obj_test x4) -> chainO_k<kap>.json
const fs=require('fs');const kap=+process.argv[2];
const src=f=>fs.readFileSync(f,'utf8');
const steps=JSON.parse(fs.readFileSync('mk_'+kap+'.json','utf8'));
const add=(name,js,t)=>steps.push({name,shot:false,wait:100,timeout:t||900000,js});
add('cfgobj',`(() => { window.__BWCFG = { kap: ${kap}, name: 'obj_k${kap}', budget: 100, max: 300 }; window.__BWOBJ = null; return 'c'; })()`);
for(let i=0;i<4;i++) add('obj_test',src('obj_test.js'));
fs.writeFileSync('chainO_k'+kap+'.json',JSON.stringify(steps));console.log('chainO_k'+kap,steps.length);
