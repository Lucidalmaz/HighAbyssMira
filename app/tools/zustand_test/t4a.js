// Kapitel 4 (Kapitelwahl), danach echte E-Interaktionen und Zustandsaenderungen, dann Snapshot
window.__SNAP=()=>{ ev('saveGame()'); return localStorage.getItem('ham_save'); };
if(!window.__USE){ window.__USE=async (re,near,rad=2.5,o={})=>{ const l=T.find(re,{near:[near[0],near[1],rad]}); if(!l.length) return 'NICHT GEFUNDEN '+re+'@'+near; const m=l[0]; const lab=String(T.lab(m)); const s0=G.story.items.length+'/'+G.story.lore.length;
   const r=await T.use(m,Object.assign({wait:1400},o)); await W(300); let esc=0; while(G.ui.overlay&&esc<12){ T.key('Escape'); await W(350); esc++; }
   return lab+' reach='+r.reach+' i/l '+s0+' -> '+G.story.items.length+'/'+G.story.lore.length; }; }
const A=[
 [/Roter Kanister/,[133.6,-10.2],2],        // Item mit idef (ow_kanister)
 [/Vogelscheuche/,[-121.2,24.8],3],          // Seiten (ow)
 [/Fotoalbum/,[21.4,-13],3],                 // Album
 [/Halsband aufheben/,[-12.2,-10.4],3],      // Collar (Whiskey/Vegas-Kette)
 [/Lucys Handy/,[2.3,-37.1],3],
 [/Foto aufheben/,[115.3,15.1],3],           // Polaroid 3 (Mike) an der Tankstelle
];
for(const [re,near,rad] of A) lg(await __USE(re,near,rad));
// Zeit und Wetter
ev('leben_uhr(9,30)'); ev('leben_S.wx.on=true; leben_S.wx.t=5; leben_S.wx.dur=60; leben_S.wx.T=999');
// Kino-Gedaechtnis
try{ ev("KAP_SAVE.kino.seen.push('k1')"); }catch(e){}
// Nachbild ausloesen (Echo) per Hook
try{ lg('echo: '+ev("window.__geister && __geister.echo ? __geister.echo('echo_kanal_laterne') : 'kein Hook'")); await W(2500); }catch(e){ lg('echo FEHLER '+e.message); }
await W(2000);
const s=__SNAP(); lg('items='+JSON.stringify(G.story.items)); lg('uhr='+ev('leben_S.clk.min')+' wx='+ev('leben_S.wx.on')+' photos='+[...G.story.photos].join(','));
lg('SNAPBEGIN'+s+'SNAPEND');
