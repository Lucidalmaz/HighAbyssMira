// mk.js <name> <kap|0> <js-datei>... : baut steps JSON (s0 für Kapitel falls nötig, danach jede js-Datei als Schritt (async-Ausdruck))
const fs=require('fs'),path=require('path');
const [name,kap,...files]=process.argv.slice(2);
const START={1:'G.beginGame && G.beginGame();',2:'await G.startChapter2();',3:'await G.startChapter3();',4:"await (window.__k6||window.__villa).ev('startChapter4()');",5:"await (window.__k6||window.__villa).ev('startChapter5()');",6:'await window.__k6.start();'}[kap];
const steps=[];
if(START) steps.push({name:'s0',shot:false,wait:300,timeout:600000,js:`(async()=>{for(let i=0;i<3000&&(typeof G==='undefined'||!window.__ready);i++)await new Promise(r=>setTimeout(r,200));
const W=ms=>new Promise(r=>setTimeout(r,ms));
if(window.__s0done){const k=window.__kap&&__kap.get(); if(k===${kap}||${kap}===1)return 's0 schon (Kapitel '+k+')'; ${START} await W(6000);try{if(window.__kino&&__kino.busy&&__kino.busy())__kino.skip();}catch(e){} await W(1500);G.state.talking=false;return 'Kapitelwechsel '+k+' -> '+(window.__kap&&__kap.get());}
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)));
window.__testMove=true;const st=document.getElementById('start');st&&st.classList.remove('show');G.menu&&(G.menu.attract=false);document.body.classList.remove('menu');
try{Object.defineProperty(document,'pointerLockElement',{get:()=>G.renderer.domElement,configurable:true});}catch(e){}
${START}
await W(6000);const s=document.getElementById('introSeq');s&&s.classList.remove('show');G.state.talking=false;try{if(window.__kino&&__kino.busy&&__kino.busy())__kino.skip();}catch(e){}
await W(1500);G.state.talking=false;window.__s0done=true;
return 'ok kap='+(window.__kap&&__kap.get())+' pos='+G.player.pos.toArray().map(v=>v.toFixed(1));})()`});
for(const f of files){ const src=fs.readFileSync(f,'utf8'); steps.push({name:path.basename(f,'.js'),shot:false,wait:100,timeout:900000,js:src}); }
fs.writeFileSync(name+'.json',JSON.stringify(steps));
console.log(name+'.json',steps.length,'Schritte');
