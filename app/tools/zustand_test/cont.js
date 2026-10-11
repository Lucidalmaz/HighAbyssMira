// Weiterspielen wie im Menue
__OBS.reset();
const ls0=localStorage.getItem('ham_save'); lg('ham_save vorhanden='+(!!ls0)+' bytes='+(ls0||'').length);
G.menu.attract=false; document.body.classList.remove('menu'); document.getElementById('start').classList.remove('show');
window.__SNAP=()=>{ ev('saveGame()'); return localStorage.getItem('ham_save'); };
G.continueGame(); const sq=document.getElementById('introSeq');
for(let i=0;i<40;i++){ await W(500); if(sq&&sq.classList.contains('show')) break; } lg('introSeq show='+(sq&&sq.classList.contains('show'))+' geladen='+ev('ZUST.geladen')); await W(1500); if(sq&&sq.classList.contains('show')) sq.click();
await W(20000);
lg('geladen kap='+ev('kap()')+' pos='+F(P.toArray())+' main='+G.story.main+' geladen-Flag='+ev('ZUST.geladen')+' items='+JSON.stringify(G.story.items));
const s=__SNAP(); lg('SNAPBEGIN'+s+'SNAPEND');
for(const o of __OBS.log) lg(JSON.stringify(o).slice(0,200));
