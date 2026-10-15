(async () => {
  const VT = window.__vt, SM = window.__stimmen, ST = SM.S, W = VT.W, EV = (window.__k6 || window.__villa).ev;
  const keys = Object.keys(ST.man.k), out = [];
  const px = G.player.pos.x, pz = G.player.pos.z;
  for (const k of keys) {
    for (let i = 0; i < 60 && ST.cur.length; i++) await W(100);
    await W(250);
    const bed = VT.sample()[0], n0s = window.__vt_s5.length, t0 = performance.now();
    let ret = null, err = null;
    try { ret = EV(`stimmen_spielen(${JSON.stringify(k)}, [${px + 1}, 1.4, ${pz + 1}])`); } catch (e) { err = String(e.message || e); }
    let started = null, endT = null, peak = 0; const rms = [];
    const v = ST.man.k[k], ids = Array.isArray(v) ? v : [v], dur = Math.max(...ids.map(i => ST.man.z[i][1]));
    for (let j = 0; j < (dur * 1000 + 2500) / 40; j++) { await W(40); const t = performance.now() - t0, [r, p] = VT.sample();
      if (ST.cur.length && started === null) started = t; if (started !== null) { rms.push(r); if (p > peak) peak = p; }
      if (started !== null && !ST.cur.length) { endT = t; break; } }
    const top = rms.slice().sort((a, b) => b - a).slice(0, Math.max(1, Math.round(rms.length * .5)));
    out.push({ k, ids: ids.join(','), sprecher: ids.map(i => ST.man.z[i][2]).join('+'), art: ST.art && ST.art.split('@')[0], ret, err, starts: window.__vt_s5.slice(n0s).filter(s => ids.some(i => Math.abs(ST.man.z[i][1] - s.d) < .08)).length, soll: ids.length,
      dur, stimme_ms: endT !== null ? Math.round(endT - started) : null, start_ms: started === null ? null : Math.round(started),
      peak_dbfs: rms.length ? +VT.db(peak).toFixed(1) : null, voice_rms_db: top.length ? +VT.db(top.reduce((s, v) => s + v, 0) / top.length).toFixed(1) : null, bed_db: +VT.db(bed).toFixed(1) });
  }
  window.__vt_keys = out;
  return JSON.stringify(out);
})()
