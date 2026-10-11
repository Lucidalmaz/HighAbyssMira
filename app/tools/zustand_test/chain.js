// Item-Ketten: echte E-Interaktion am Fundort (Teleport + E), Inventar-Anzeige, Fundort-Merker (inv3d), Ergebnis je Zeile
if(!window.__USE){ window.__USE=async (re,near,rad=2.5,o={})=>{ for(let i=0;i<150;i++){ let busy=false; try{ busy=!!ev('kino_S.on'); }catch(e){} if(!busy) break; await W(1000); } const l=near&&near[0]!==null?T.find(re,{near:[near[0],near[1],rad]}):T.find(re); if(!l.length) return {err:'NICHT GEFUNDEN'}; const m=l[0]; const lab=String(T.lab(m));
   const b=new Set(G.story.items), nl=G.story.lore.length; const r=await T.use(m,Object.assign({wait:1500},o)); await W(400); let esc=0; while(G.ui.overlay&&esc<12){ T.key('Escape'); await W(350); esc++; }
   await W(300); return {lab,reach:r.reach,seen:r.seen,gained:G.story.items.filter(k=>!b.has(k)),lore:G.story.lore.length-nl}; }; }
const LISTE=window.__CHAIN||[];
const res=[]; G.state.talking=false; try{ G.setScripted(null); }catch(e){}
for(const [item,re,x,z,rad] of LISTE){ let r; const pre=JSON.stringify({ov:G.ui.overlay,talk:G.state.talking,kino:(()=>{try{return ev('kino_S.on');}catch(e){return null;}})(),sc:!!G.scripted,y:+G.player.pos.y.toFixed(2)}); if(item==='!'){ try{ const q=ev(re); if(q&&q.then) await Promise.race([q,W(8000)]); }catch(e){ res.push({item:'!',code:re,err:String(e.message).slice(0,80)}); } await W(x||800); G.state.talking=false; try{G.setScripted(null);}catch(e){} continue; } try{ r=await __USE(new RegExp(re),[x,z],rad||3); }catch(e){ r={err:String(e.message).slice(0,60)}; }
  const hat=G.story.items.includes(item); const def=!!(G.ITEMS[item]&&G.ITEMS[item].name); let found=null; try{ found=ev('INV3D.found')[item]; }catch(e){}
  res.push({item,pre,hat,def,name:def?G.ITEMS[item].name:null,fundort:found?(found.ort||'')+'/Kap'+found.ch:null,r}); await W(400); }
// Inventar-Anzeige: Fibel oeffnen, Namen im Text suchen
T.key('Tab'); await W(900); let txt=''; try{ ev("jTab='inventar'"); ev('renderJournal()'); await W(1200); const j=document.getElementById('journal'); txt=j?j.innerText:''; }catch(e){}
T.key('Escape'); await W(500); for(let i=0;i<5&&G.ui.overlay;i++){ T.key('Escape'); await W(300); }
for(const o of res){ o.angezeigt=!!(o.name&&txt.includes(o.name)); }
for(const o of res) lg(JSON.stringify(o).slice(0,330));
lg('items='+JSON.stringify(G.story.items));
