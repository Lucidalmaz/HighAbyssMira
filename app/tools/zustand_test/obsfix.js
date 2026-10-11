const seen=new Set(); const old=window.__OBS_rec;
window.__OBS_rec=(k,a)=>{ const key=k+'|'+(a[0]&&a[0].id||a[0])+'|'+String(a[1]).slice(0,40); if(k==='gedanke'||k==='setMain'){ if(seen.has(key)) return; seen.add(key); } old(k,a); };
window.__OBS.reset=()=>{ seen.clear(); __OBS.log.length=0; };
lg('obsfix');
