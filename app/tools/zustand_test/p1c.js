const st=()=>'main='+G.story.main+' cellar='+G.state.cellarOpen+' tape='+G.state.heardTape+' inB='+G.state.inBasement+' outage='+G.state.outage+' pos='+F(P.toArray());
await W(15000); lg('Band zu Ende? '+st()+' talking='+G.state.talking+' ov='+G.ui.overlay);
// jetzt echtes Tastenfeld: zur Tür, E, Code
T.tp(31,0.45,-20.4); await W(600);
const l=T.find(/Code eingeben/); lg('keypad '+l.length);
if(l.length){ const r=await T.reach(l[0]); lg('reach '+JSON.stringify(r)); T.key('KeyE'); await W(900); lg('overlay='+G.ui.overlay); }
const kp=async s=>{ for(const c of s) { ev("kapitel1_kpPress('"+c+"')"); await W(220); } ev("kapitel1_kpPress('OK')"); await W(900); };
if(G.ui.overlay==='keypad'){ await kp('3111'); lg('falsch: wrong='+G.state.wrongCodes+' ov='+G.ui.overlay); await W(1200); if(G.ui.overlay==='keypad') await kp('3110'); }
await W(5000); lg('nach Code '+st()+' ov='+G.ui.overlay);
