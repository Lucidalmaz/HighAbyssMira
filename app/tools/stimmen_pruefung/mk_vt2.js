// node mk_vt2.js <kap> -> vtK<kap>.json : Kapitel starten, lib, je Figur eine (kap-abhaengige) Zeile, Flow, Wechsel
const fs=require('fs'),cp=require('child_process');
const kap=+process.argv[2]; const name='vtK'+kap;
const all=JSON.parse(fs.readFileSync('cases.json','utf8')); const byF={}; for(const c of all)(byF[c.f]=byF[c.f]||[]).push(c);
const cases=Object.values(byF).map(L=>L[(kap-1)%L.length]);
fs.writeFileSync(name+'_run.js',`(async()=>{const C=${JSON.stringify(cases)};const out=[];for(const c of C){try{out.push(await window.__vt.zeile(c));}catch(e){out.push({f:c.f,id:c.id,fehler:String(e)});}}return JSON.stringify(out);})()`);
cp.execSync(`node C:/Users/GIGABYTE/HighAbyssMira-Repo/app/tools/qa_bewegung/mk.js ${name} ${kap} vt_lib.js ${name}_run.js vt_flow.js vt_wechsel.js`,{stdio:'inherit'});
