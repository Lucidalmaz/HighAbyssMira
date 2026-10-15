(async () => {
  const VT = window.__vt, SM = window.__stimmen, ST = SM.S, W = VT.W, R = {}; const EV2 = (window.__k6 || window.__villa).ev;
  const long = Object.entries(ST.man.z).filter(([i, z]) => z[1] > 4.5 && z[2] === 'luke').slice(0, 6);
  const txt = id => Object.entries(ST.man.t).find(([t, ids]) => ids.includes(id))[0];
  const idle = async () => { for (let i = 0; i < 80 && ST.cur.length; i++) await W(100); await W(300); };
  await idle();
  // 1) say(): Enter bricht die Stimme ab, naechste Zeile sofort, kein Doppelstart
  const [a, b] = [long[0][0], long[1][0]];
  const n0 = window.__vt_s5.length; const p = __ui.say([[txt(a), 100, 'DU'], [txt(b), 100, 'DU']]);
  await W(900); R.say_start = ST.cur.map(h => h.id); const t1 = performance.now();
  __ui.weiter(false); await W(60); R.nach_enter_ms = Math.round(performance.now() - t1);
  await W(400); R.nach_enter_cur = ST.cur.map(h => h.id); R.zweite_laeuft = ST.cur.some(h => h.id === b);
  const dm = (ids, n) => window.__vt_s5.slice(n).filter(s => ids.some(i => Math.abs(ST.man.z[i][1] - s.d) < .08)).length; R.starts_bis_enter = dm([a, b], n0);
  // 2) X: ganzer Block endet, Stimmen aus
  __ui.weiter(true); const r = await Promise.race([p.then(() => 'ende'), W(3000).then(() => 'haengt')]); R.x_ende = r;
  await W(500); R.nach_x_cur = ST.cur.length; R.starts_gesamt = dm([a, b], n0);
  // 3) Klick (mousedown) wie Enter
  await idle(); const q = __ui.say([[txt(long[2][0]), 100, 'DU'], [txt(long[3][0]), 100, 'DU']]);
  await W(800); R.klick_vor = ST.cur.map(h => h.id); window.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true })); await W(500);
  R.klick_nach = ST.cur.map(h => h.id); __ui.weiter(true); await q; await W(400);
  // 4) Kapitelwechsel-Aufraeumen stoppt Stimme
  await idle(); SM.spiele(txt(long[4][0]), 'DU'); await W(900); R.vor_aufr = ST.cur.length; (window.__zust || {}).aufr && window.__zust.aufr(); await W(500); R.nach_aufr = ST.cur.length;
  // 5) Pause (ESC-Zustand ui.paused) haelt an und setzt fort
  await idle(); SM.spiele(txt(long[5][0]), 'DU'); await W(700); const ui = G.ui; ui.paused = true; await W(500); const cur1 = ST.cur.length, halt = !!ST.halt; await W(400); ui.paused = false; await W(500); R.pause = { cur_in_pause: cur1, halt, fortgesetzt: ST.cur.length };
  SM.S && (SM.spiele, 0); await idle();
  // 6) Einstellung aus: keine Stimme
  const SET = (window.__k6 || window.__villa).ev('settings'); const s0 = SET.stimmen; SET.stimmen = false; const n1 = window.__vt_s5.length; EV2('subQ.length=0;subMin=0'); SM.sub(txt(long[0][0]), 800, 'DU'); await W(1200); R.aus_starts = dm([long[0][0]], n1); R.aus_cur = ST.cur.length; SET.stimmen = s0;
  R.zustand = SM.zustand();
  return JSON.stringify(R);
})()
