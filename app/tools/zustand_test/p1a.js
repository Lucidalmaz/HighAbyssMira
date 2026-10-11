// Kapitel 1 echt gespielt (E-Interaktionen + Tastenfeld), Beobachtung + Snapshots
if(!window.__USE){
 window.__USE=async (re,near,rad=2.5,o={})=>{ const l=T.find(re,{near:[near[0],near[1],rad]}); if(!l.length) return 'NICHT GEFUNDEN '+re+'@'+near;
   const m=l[0]; const lab=String(T.lab(m)); const s0=G.story.items.length+'/'+G.story.lore.length+'/'+G.story.main;
   const r=await T.use(m,Object.assign({wait:1400},o)); await W(300);
   let esc=0; while(G.ui.overlay&&esc<12){ T.key('Escape'); await W(350); esc++; }
   return lab+' reach='+r.reach+(r.reach?'':' seen='+JSON.stringify(r.seen))+' i/l/m '+s0+' -> '+G.story.items.length+'/'+G.story.lore.length+'/'+G.story.main+(esc?' esc'+esc:''); };
 window.__SNAP=()=>{ ev('saveGame()'); return localStorage.getItem('ham_save'); };
}
__OBS.reset(); const A=[];
const st=()=>'kap='+ev('kap()')+' main='+G.story.main+' key='+G.state.hasKey+' cal='+G.state.readCal+' fr='+G.state.readFridge+' cellar='+G.state.cellarOpen+' tape='+G.state.heardTape+' pos='+F(P.toArray());
lg('START '+st());
lg(await __USE(/Briefkasten.*ffnen$/,[28,-7],2));
lg(await __USE(/Zeitungsrolle|^T.r .ffnen$/,[23,-12],2.5)); lg(st());
lg(await __USE(/Kalender ansehen/,[20,-19],3)); lg(await __USE(/Zettel lesen/,[31,-16],3)); lg(await __USE(/Foto am K.hlschrank/,[31,-17],3)); lg(st());
for(const o of __OBS.log.slice(-12)) lg(JSON.stringify(o));
