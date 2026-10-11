// Kapitelwahl direkt in Kapitel N (Menüweg)
const N=window.__N||4;
G.menu.attract=false; G.state.started=true; document.body.classList.remove('menu'); document.getElementById('start').classList.remove('show');
const t0=performance.now();
ev('Audio.init()');
const fn={2:'startChapter2',3:'startChapter3',4:'startChapter4',5:'startChapter5',6:'startChapter6'}[N];
__OBS.log.length=0; await ev(fn+'()');
lg('gestartet kap='+ev('kap()')+' pos='+F(P.toArray()));
await W(2500); const sq=document.getElementById('introSeq'); lg('introSeq show='+sq.classList.contains('show')); if(sq.classList.contains('show')) sq.click();
await W(30000);
lg('nach 30s: kap='+ev('kap()')+' pos='+F(P.toArray()));
for(const o of __OBS.log) lg(JSON.stringify(o));
