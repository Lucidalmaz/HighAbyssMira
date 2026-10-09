const s=require(require('path').resolve(process.argv[2])+'/steps.json');
for(const k of process.argv.slice(3)){ console.log('=====',k); const A=JSON.parse(s[k]);
 for(const e of A){ console.log(e.id,'at',e.at.map(v=>+v.toFixed?+v.toFixed(1):v).join(','), e.err?('ERR '+e.err):'', 'castMs',e.castMs);
  for(const f of e.figs){ const rel=(v,b)=>v==null?'-':(v-(b==null?0:b)).toFixed(2);
   console.log(`  #${f.i} ${f.id} clip=${f.clip} sit=${f.sit} pos=${f.pos} ry=${f.ry} s=${f.s} Fy=${f.Fy} gnd=${f.gnd} high=${f.gndHigh} foot=${f.foot} hip=${f.hip} head=${f.head} drop=${f.drop} legs=${JSON.stringify(f.legs)} hipXZ=${JSON.stringify(f.hipXZ)} oy=${f.oy} face=${f.faceErr}${f.chair?(' chair='+f.chair.j+'/'+f.chair.d):''}${f.walls?(' WALL='+JSON.stringify(f.walls)):''}`);}}}
