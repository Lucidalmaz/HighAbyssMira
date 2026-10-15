// node mk_vt.js <name> <kap> <cases-teil: all|figur|a|b|c> -> <name>.json (s0 + lib + run)
const fs=require('fs'),cp=require('child_process');
const [name,kap,teil,max]=process.argv.slice(2);
let cases=JSON.parse(fs.readFileSync('cases.json','utf8'));
if(teil==='figur'){ const seen=new Set(); cases=cases.filter(c=>{ if(seen.has(c.f)) return false; seen.add(c.f); return true; }); }
else if(teil!=='all'){ const n=cases.length, k={a:0,b:1,c:2}[teil]; cases=cases.filter((c,i)=>i%3===k); }
fs.writeFileSync(name+'_run.js',`(async()=>{const C=${JSON.stringify(cases)};const out=[];for(const c of C){try{out.push(await window.__vt.zeile(c));}catch(e){out.push({f:c.f,id:c.id,fehler:String(e)});}}window.__vt_out=(window.__vt_out||[]).concat(out);return JSON.stringify(out);})()`);
cp.execSync(`node C:/Users/GIGABYTE/HighAbyssMira-Repo/app/tools/qa_bewegung/mk.js ${name} ${kap} vt_lib.js ${name}_run.js`,{stdio:'inherit'});
