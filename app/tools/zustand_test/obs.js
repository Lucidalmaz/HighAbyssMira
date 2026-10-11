// Beobachter: protokolliert Dialoge/Ereignisse
if(!window.__OBS){
 window.__OBS={log:[],on:true};
 const rec=(k,a)=>{ try{ if(!__OBS.on) return; const p=G.player.pos; let s=a.map(x=>typeof x==='string'?x:(x&&x.id)||(x&&x.key)||(x&&x.name)||JSON.stringify(x)).join(' | ').replace(/<[^>]*>/g,' ').slice(0,110);
   __OBS.log.push({t:+(performance.now()/1000).toFixed(1),k:kapNow(),f:k,s,x:+p.x.toFixed(0),z:+p.z.toFixed(0)}); }catch(e){} };
 const kapNow=()=>{ try{ return ev('kap()'); }catch(e){ return -1; } };
 for(const n of ['subtitle','toast','questPop','gedanke','playEcho','showNote','openNote','addItem','kino_play','kino_karte','setMain','saveFlag','gedanken_atem','gedanken_blick']){
   try{ if(ev('typeof '+n)==='function') ev(n+' = (o=>function(...a){ __OBS_rec('+JSON.stringify(n)+',a); return o.apply(this,a); })('+n+')'); }catch(e){ }
 }
 window.__OBS_rec=rec;
}
lg('obs ok '+__OBS.log.length);
