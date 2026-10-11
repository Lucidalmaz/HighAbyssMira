const st=()=>'main='+G.story.main+' cellar='+G.state.cellarOpen+' tape='+G.state.heardTape+' inB='+G.state.inBasement+' items='+JSON.stringify(G.story.items)+' pos='+F(P.toArray());
T.auto(false);
// Tastenfeld: erst falsch (Fehlversuch), dann 3110
lg(await __USE(/Code eingeben/,[31,-22],3,{wait:600})); lg('overlay='+G.ui.overlay);
const kp=async s=>{ for(const c of s) { ev("kapitel1_kpPress('"+c+"')"); await W(180); } ev("kapitel1_kpPress('OK')"); await W(900); };
if(G.ui.overlay==='keypad'){ await kp('3111'); lg('falsch: wrong='+G.state.wrongCodes+' overlay='+G.ui.overlay); await W(700); await kp('3110'); }
await W(4500); lg('nach Code '+st());
// Keller: Zettel am Rekorder, Kassette
const lt=T.find(/Zettel am Rekorder|Kassette abspielen/); lg('Rekorder-Treffer '+lt.length+' '+lt.map(m=>T.lab(m)).join(','));
for(let i=0;i<2;i++){ const l=T.find(/Zettel am Rekorder|Kassette abspielen/); if(!l.length) break; const p=T.wp(l[0]); lg(await __USE(/Zettel am Rekorder|Kassette abspielen/,[p.x,p.z],3,{wait:2500})); await W(1500); }
await W(9000); lg('nach Band '+st());
for(const o of __OBS.log.slice(-14)) lg(JSON.stringify(o).slice(0,220));
