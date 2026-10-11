// ia_shots2.js <name> "<label>@x,y,z,dist,pitch" ... → je Objekt: hinstellen (mit Zusatzlicht), Bild zu, E, 1 s, Bild auf
const fs = require('fs');
const [name, ...items] = process.argv.slice(2);
const steps = [];
items.forEach((it, i) => {
  const m = it.match(/^(.*)@(-?[\d.]+),(-?[\d.]+),(-?[\d.]+),([\d.]+),(-?[\d.]+)$/); const label = m[1], x = +m[2], y = +m[3], z = +m[4], dist = +m[5], pitch = +m[6];
  const prep = `(async()=>{ const B=window.__BW,E=B.E; const ev=(window.__k6||window.__villa).ev; const IA=ev('interactables'); let best=null,bd=9;
    for(const h of IA){ if(!h.userData||typeof h.userData.action!=='function') continue; let l=h.userData.label; try{ if(typeof l==='function') l=l(); }catch(e){} if(!new RegExp("^"+${JSON.stringify(label)}).test(String(l))) continue; const p=h.getWorldPosition(new E.THREE.Vector3()); const d=Math.hypot(p.x-(${x}),p.z-(${z})); if(d<bd){bd=d;best=h;} }
    window.__SHOT_H=best; if(!best) return 'keine Klickfläche'; const wp=new E.THREE.Vector3(${x},${y},${z});
    for (const a of [0,1.57,3.14,4.71]) { const px=wp.x+Math.sin(a)*${dist}, pz=wp.z+Math.cos(a)*${dist}; if (B.overlap(px,B.floorY(px,pz,wp.y),pz,1.7).length) continue; B.place(px,B.floorY(px,pz,wp.y)+.02,pz,a); window.__SHOT_A=a; break; }
    const a=window.__SHOT_A||0; try{ ev('flashOn = true'); }catch(e){}
    if(!window.__SHOT_L){ window.__SHOT_L=new E.THREE.PointLight(0xfff2dd, 6, 7, 1.6); E.scene.add(window.__SHOT_L); }
    window.__SHOT_L.position.set(wp.x+Math.sin(a)*${dist}*.6, wp.y+1.0, wp.z+Math.cos(a)*${dist}*.6);
    E.player.pitch=${pitch}; for(let i=0;i<20;i++) B.upd(1/30); E.ui.paused=false; await new Promise(r=>setTimeout(r,900)); return 'bereit '+bd.toFixed(2); })()`;
  const act = `(async()=>{ const B=window.__BW,E=B.E; const h=window.__SHOT_H; if(!h) return 'x'; E.state.talking=false; E.ui.paused=false; h.userData.action(); for(let i=0;i<40;i++){ B.upd(1/30); await new Promise(r=>setTimeout(r,20)); } E.ui.paused=false; for(let k=0;k<3;k++){ await new Promise(r=>setTimeout(r,350)); for(const t of [document,window]) t.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape',bubbles:true})); } await new Promise(r=>setTimeout(r,700)); return 'offen'; })()`;
  steps.push({ name: 'p' + i, shot: false, wait: 200, timeout: 120000, js: prep });
  steps.push({ name: 'zu' + i, shot: true, wait: 400, timeout: 60000, js: '"zu"' });
  steps.push({ name: 'a' + i, shot: false, wait: 200, timeout: 120000, js: act });
  steps.push({ name: 'auf' + i, shot: true, wait: 400, timeout: 60000, js: '"auf"' });
});
fs.writeFileSync(name + '.json', JSON.stringify(steps)); console.log(steps.length);
