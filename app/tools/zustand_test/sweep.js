// Raster-Streifzug: Ereignisse an allen Orten der Stadt beobachten
const kp=ev('kap()'); __OBS.log.length=0; const t1=performance.now();
const pts=[]; for(let x=-110;x<=70;x+=8) for(let z=-40;z<=40;z+=8) pts.push([x,z]);
let n=0;
for(const [x,z] of pts){ const y=ev('solidGround')(x,0.5,z); T.tp(x,isFinite(y)?y:0,z); G.state.talking=false; await W(450); n++; }
// Innenräume
for(const r of ev('indoorRects')){ const cx=(r.x0+r.x1)/2, cz=(r.zb+r.zf)/2; T.tp(cx,r.y||0,cz); await W(900); }
lg('Sweep kap='+kp+' pts='+n+' dauer='+((performance.now()-t1)/1000).toFixed(0)+'s ereignisse='+__OBS.log.length);
for(const o of __OBS.log) lg(JSON.stringify(o));
