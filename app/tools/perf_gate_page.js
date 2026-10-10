// Seitenseitige Messbibliothek des Leistungs-Gates (perf_gate.mjs). Wird per executeJavaScript in die laufende Dauerinstanz eingespielt (nur Entwicklungsbau, braucht window.G).
// window.__pg: Bildzeit-Sampler (jedes requestAnimationFrame), Langläufer-Beobachter, Messfenster, renderer.info-Schnappschuss, Texturspeicher-Schätzung.
(() => {
  if (window.__pg) return 'schon da';
  const F = [], T = [], LT = []; let last = performance.now();
  const fr = t => { F.push(t - last); T.push(t); last = t; if (F.length > 400000) { F.splice(0, 100000); T.splice(0, 100000); } requestAnimationFrame(fr); };
  requestAnimationFrame(fr);
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) LT.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: false }); } catch (e) {}
  const pct = (a, p) => a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))] : 0;
  const stat = (i0, i1) => {
    const d = F.slice(i0 + 1, i1 === undefined ? F.length : i1); // erstes Bild nach Markierung (Spanne unbestimmt) auslassen
    if (!d.length) return { n: 0, fps: 0, avg: 0, p50: 0, p95: 0, p99: 0, worst: 0, over50: 0, over100: 0 };
    const s = d.slice().sort((a, b) => a - b), sum = d.reduce((a, b) => a + b, 0);
    return { n: d.length, fps: +(d.length * 1000 / sum).toFixed(1), avg: +(sum / d.length).toFixed(1), p50: +pct(s, .5).toFixed(1), p95: +pct(s, .95).toFixed(1), p99: +pct(s, .99).toFixed(1),
      worst: +s[s.length - 1].toFixed(0), over50: d.filter(x => x > 50).length, over100: d.filter(x => x > 100).length };
  };
  const W = ms => new Promise(r => setTimeout(r, ms));
  // Zeichenaufrufe/Dreiecke je Bild: renderer.render() wird mehrfach je Bild gerufen (Schatten, Nachbearbeitung) – Summen je Bild über Umhüllung (info.autoReset bleibt an)
  const C = [], TR = []; let fc = 0, ft = 0; const R0 = G.renderer, rr = R0.render.bind(R0);
  R0.render = function (s, c) { rr(s, c); fc += R0.info.render.calls; ft += R0.info.render.triangles; };
  const fr2 = () => { C.push(fc); TR.push(ft); fc = 0; ft = 0; if (C.length > 400000) { C.splice(0, 100000); TR.splice(0, 100000); } requestAnimationFrame(fr2); };
  requestAnimationFrame(fr2);
  const med = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
  const pg = {
    F, T, LT, W, stat,
    mark: () => F.length,
    async window(ms) { const i0 = F.length; await W(ms); return stat(i0); },
    // Zähler von renderer.info (Zeichenaufrufe/Dreiecke gelten fürs letzte volle Bild: info.autoReset wird bei eingeblendeter Leistungsanzeige vom Spiel selbst bedient)
    info() { const R = G.renderer, i = R.info; return { calls: med(C.slice(-90)), tris: med(TR.slice(-90)), textures: i.memory.textures, geometries: i.memory.geometries, programs: i.programs ? i.programs.length : 0 }; },
    heapMB() { return performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1; },
    // Texturspeicher (Schätzung): einmalig je Textur, komprimiert ≈ 1 Byte/Pixel (BC7/ASTC), sonst 4 Byte/Pixel, plus 1/3 für Mip-Ketten
    texMB() {
      const seen = new Set(); let b = 0, n = 0;
      const add = t => { if (!t || !t.isTexture || seen.has(t)) return; seen.add(t); n++;
        let w = 0, h = 0; const im = t.image; if (t.mipmaps && t.mipmaps.length && t.mipmaps[0].width) { w = t.mipmaps[0].width; h = t.mipmaps[0].height; } else if (im) { w = im.width || im.videoWidth || 0; h = im.height || im.videoHeight || 0; }
        if (!w && t.source && t.source.data) { w = t.source.data.width || 0; h = t.source.data.height || 0; }
        if (t.isRenderTargetTexture) return;
        const bpp = t.isCompressedTexture ? 1 : 4; b += w * h * bpp * (t.generateMipmaps === false && !(t.mipmaps && t.mipmaps.length > 1) ? 1 : 1.33); };
      G.scene.traverse(o => { const ms = o.material ? [].concat(o.material) : []; for (const m of ms) { if (!m) continue; for (const k in m) { const v = m[k]; if (v && v.isTexture) add(v); } if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k] && m.uniforms[k].value; if (v && v.isTexture) add(v); } } });
      return { mb: Math.round(b / 1048576), n };
    },
    progLater() { const p = window.__proglog; return p ? p.later.length : -1; },
    stalls() { const p = window.__proglog; return p ? p.stalls.length : -1; },
    // Messpunkt: hinbeamen, Ankunft (erste 4 s: enthält Nachladen/Übersetzen) und Dauer (6–12 s) getrennt messen
    async point(name, x, y, z, lx, ly, lz, arrMs = 4000, steadyMs = 6000, settleMs = 2000) {
      const c = G.camera.position, P = G.player;
      P.pos.set(x, y, z); G.vel && G.vel.set(0, 0, 0); P.pitch = 0;
      const yaw = () => { const cc = G.camera.position; P.yaw = Math.atan2(-(lx - cc.x), -(lz - cc.z)); P.pitch = Math.atan2(ly - cc.y, Math.hypot(lx - cc.x, lz - cc.z)); };
      setTimeout(yaw, 60);
      const pr0 = this.info().programs, lt0 = LT.length, la0 = this.progLater();
      const arr = await this.window(arrMs); await W(settleMs); const st = await this.window(steadyMs);
      const inf = this.info();
      return { name, arrival: arr, steady: st, calls: inf.calls, tris: inf.tris, textures: inf.textures, geometries: inf.geometries, programs: inf.programs,
        newPrograms: inf.programs - pr0, newProgLater: this.progLater() - la0, longTasks: LT.length - lt0, heapMB: this.heapMB() };
    },
  };
  window.__pg = pg;
  return 'installiert';
})()
