const st=()=>'main='+G.story.main+' cellar='+G.state.cellarOpen+' tape='+G.state.heardTape+' inB='+G.state.inBasement+' outage='+G.state.outage+' talking='+G.state.talking+' pos='+F(P.toArray());
lg(st());
for(let i=0;i<2;i++){ const l=T.find(/Zettel am Rekorder|Kassette abspielen/); if(!l.length) break; const p=T.wp(l[0]); lg(await __USE(/Zettel am Rekorder|Kassette abspielen/,[p.x,p.z],3,{wait:2500})); await W(2000); }
await W(30000); lg('nach Band '+st());
const near=G.interactables.filter(m=>{const p=T.wp(m); return Math.abs(p.x-300)<14&&Math.abs(p.z-298)<14;}).map(m=>String(T.lab(m)).slice(0,30)+'@'+T.fmt([T.wp(m).x,T.wp(m).z]).join(','));
lg('Keller-IA: '+near.join(' | '));
