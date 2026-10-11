// ia_shots.js <name> "<label>@x,y,z" ... → Schritte: hinstellen, Bild zu, E, 0,9 s, Bild offen (für Kontaktbögen)
const fs = require('fs');
const [name, ...items] = process.argv.slice(2);
const steps = [];
items.forEach((it, i) => {
  const m = it.match(/^(.*)@(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)(?:,([\d.]+),(-?[\d.]+))?$/); const label = m[1], x = +m[2], y = +m[3], z = +m[4], dist = m[5] ? +m[5] : 1.7, pitch = m[6] ? +m[6] : -.18;
  const prep = `(async()=>{ const B=window.__BW,E=B.E; const ev=(window.__k6||window.__villa).ev; const IA=ev('interactables'); let best=null,bd=9;
    for(const h of IA){ if(!h.userData||!h.userData.iap) continue; let l=h.userData.label; try{ if(typeof l==='function') l=l(); }catch(e){} if(String(l)!==${JSON.stringify(label)}&&!String(l).startsWith(${JSON.stringify(label)})) continue; const p=h.getWorldPosition(new E.THREE.Vector3()); const d=Math.hypot(p.x-(${x}),p.z-(${z})); if(d<bd){bd=d;best=h;} }
    window.__SHOT_H=best; if(!best) return 'keine Klickfläche'; const wp=best.getWorldPosition(new E.THREE.Vector3());
    for (const a of [0,1.57,3.14,4.71]) { const px=wp.x+Math.sin(a)*${dist}, pz=wp.z+Math.cos(a)*${dist}; if (B.overlap(px,B.floorY(px,pz,wp.y),pz,1.7).length) continue; B.place(px,B.floorY(px,pz,wp.y)+.02,pz,a+Math.PI); break; }
    try{ ev('flashOn = true'); }catch(e){} E.player.pitch=${pitch}; for(let i=0;i<20;i++) B.upd(1/30); E.ui.paused=false; await new Promise(r=>setTimeout(r,500)); return 'bereit '+bd.toFixed(2); })()`;
  const act = `(async()=>{ const B=window.__BW,E=B.E; const h=window.__SHOT_H; if(!h) return 'x'; E.state.talking=false; E.ui.paused=false; h.userData.action(); for(let i=0;i<30;i++){ B.upd(1/30); await new Promise(r=>setTimeout(r,20)); } E.ui.paused=false; await new Promise(r=>setTimeout(r,500)); return 'offen'; })()`;
  steps.push({ name: 'p' + i, shot: false, wait: 200, timeout: 120000, js: prep });
  steps.push({ name: 'zu' + i, shot: true, wait: 400, timeout: 60000, js: '"zu"' });
  steps.push({ name: 'a' + i, shot: false, wait: 200, timeout: 120000, js: act });
  steps.push({ name: 'auf' + i, shot: true, wait: 400, timeout: 60000, js: '"auf"' });
});
fs.writeFileSync(name + '.json', JSON.stringify(steps)); console.log(steps.length);
