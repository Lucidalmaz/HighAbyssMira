(async () => {
  const VT = window.__vt, SM = window.__stimmen, ST = SM.S, W = VT.W, R = [];
  const EV = (window.__k6 || window.__villa).ev;
  const meta = JSON.parse(window.__vt_kino_cases || '[]');
  for (const c of meta) {
    for (let i = 0; i < 60 && ST.cur.length; i++) await W(100);
    const n0 = window.__vt_s5.length; let err = null; EV('subQ.length=0;subMin=0'); for (let i = 0; i < 60; i++) { const v = VT.subVis(); if (!v || !v.v) break; await W(50); }
    try { await SM.kino(c.text, c.who, 1500); } catch (e) { err = String(e.message || e); }
    let cur = []; for (let i = 0; i < 40; i++) { await W(50); cur = ST.cur.map(h => h.id); if (cur.length) break; } const st = ST.stimme;
    R.push({ f: c.f, id: c.id, err, cur, stimme: st, ok: cur.includes(c.id) }); EV('st_stop(.05)'); await W(150);
  }
  return JSON.stringify(R);
})()
