// Sweep: jede Interaktion einmal ausloesen (Aktion direkt) und festhalten, was ins Inventar/in die Fibel kommt
const SKIP=/Bus warten|Gullydeckel|Gully|Heimfahrt|Fahrkarte|Hand an die Wand|Wand aufbrechen|Wand klingt|Eintreten|Hörer abnehmen|Hoerer|Auto.*(starten|fahren)|Mit Justin|Totem|Kinderblick|Absperrung|Kreuz|Karussell/i;
const out=[]; const list=[...G.interactables]; const t0=performance.now(); let n=0;
const free=async()=>{ for(let i=0;i<6&&G.ui.overlay;i++){ T.key('Escape'); await W(120); } G.state.talking=false; try{ G.setScripted(null);}catch(e){} };
for(const m of list){ if(performance.now()-t0>MAXMS) break; let lab=''; try{ lab=String(T.lab(m)); }catch(e){}
  if(!lab||SKIP.test(lab)) continue; const a=m.userData&&m.userData.action; if(typeof a!=='function') continue;
  const p=T.wp(m); const b=new Set(G.story.items), nl=G.story.lore.length, ns=ev('Object.values(story.side).filter(q=>q.state!=="hidden").length');
  const pos0=P.toArray(); const hp=T.vis(m)?1:0;
  try{ await Promise.race([Promise.resolve(a()), W(1200)]); }catch(e){ out.push({lab,err:String(e.message).slice(0,80)}); }
  await W(120); await free(); n++;
  const gained=G.story.items.filter(k=>!b.has(k)), lore=G.story.lore.slice(nl).map(l=>({k:l.key,t:l.title,h:String(l.html).slice(0,3000)}));
  if(gained.length||lore.length) out.push({lab:lab.slice(0,40),x:+p.x.toFixed(1),y:+p.y.toFixed(1),z:+p.z.toFixed(1),vis:hp,items:gained,lore});
  P.set(pos0[0],pos0[1],pos0[2]); }
lg('SWEEP n='+n+' fund='+out.length+' kap='+ev('kap()')+' dauer='+((performance.now()-t0)/1000).toFixed(0)+'s');
lg('JSONBEGIN'+JSON.stringify(out)+'JSONEND');
lg('items='+JSON.stringify(G.story.items));
// ---- gezielte Hooks fuer zustandsgebundene Funde (Fallwand-Hinweise)
{ const nl0=G.story.lore.length; const tryf=async(c)=>{ try{ const r=ev(c); if(r&&r.then) await Promise.race([r,W(4000)]); }catch(e){ lg('hook '+c+' FEHLER '+String(e.message).slice(0,60)); } await W(300); await free(); };
  for(const c of ['__z7.protokoll()','__amt.akte08()','__amt.nummer()','readLetter2()','readBook()','readAlbers()','c3Phone()','__k3.buch()','__k3.nb()','__lucy3.radio()']) await tryf(c);
  const nl=G.story.lore.slice(nl0).map(l=>({k:l.key,t:l.title,h:String(l.html).slice(0,3000)}));
  lg('HOOKLORE JSONBEGIN'+JSON.stringify(nl)+'JSONEND'); }
