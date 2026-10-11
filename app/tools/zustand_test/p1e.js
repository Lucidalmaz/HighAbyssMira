const st=()=>'main='+G.story.main+' tape='+G.state.heardTape+' inB='+G.state.inBasement+' outage='+G.state.outage+' talking='+G.state.talking+' ov='+G.ui.overlay+' pos='+F(P.toArray());
lg(await __USE(/Nach oben gehen/,[304.28,299.25],3,{wait:3000})); await W(4000); lg('oben? '+st());
// Ausfall (Hook, sonst nach 150 s)
ev('window.__k1.ausfall()'); await W(1500); lg('ausfall gestartet '+st());
for(let i=0;i<40;i++){ await W(2500); if(!G.state.talking) break; } lg('nach Ausfallkino '+st());
const ia=G.interactables.filter(m=>/Wand|Hand|Zeichnungen|Treppe|unten/i.test(String(T.lab(m)))).map(m=>String(T.lab(m)).slice(0,30)+'@'+T.fmt([T.wp(m).x,T.wp(m).z]).join(','));
lg('IA: '+ia.join(' | ')); lg('K1.v='+JSON.stringify({on:ev('K1.v.on'),done:ev('K1.v.done')}));
for(const o of __OBS.log.slice(-8)) lg(JSON.stringify(o).slice(0,200));
