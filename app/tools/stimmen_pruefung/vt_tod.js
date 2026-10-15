(async () => {
  const VT = window.__vt, SM = window.__stimmen, ST = SM.S, W = VT.W, R = {}; const EV = (window.__k6 || window.__villa).ev;
  const long = Object.entries(ST.man.z).filter(([i, z]) => z[1] > 5 && z[2] === 'luke').slice(10, 12);
  const txt = id => Object.entries(ST.man.t).find(([t, ids]) => ids.includes(id))[0];
  for (let i = 0; i < 80 && ST.cur.length; i++) await W(100);
  R.wrapper = EV("(todDie.toString().indexOf('st_stop') >= 0 || String(tod_zurueck).indexOf('st_stop') >= 0)");
  // Rettung (Teleport) waehrend einer Zeile
  SM.spiele(txt(long[0][0]), 'DU'); await W(900); R.vor_rettung = ST.cur.length;
  const p0 = G.player.pos.clone ? G.player.pos.clone() : null;
  try { await EV("tod_zurueck('schritt')"); } catch (e) { R.err_rettung = String(e.message || e); }
  R.nach_rettung = ST.cur.length; await W(300); R.nach_rettung_300 = ST.cur.length;
  // Tod waehrend einer Zeile
  for (let i = 0; i < 80 && ST.cur.length; i++) await W(100);
  SM.spiele(txt(long[1][0]), 'DU'); await W(900); R.vor_tod = ST.cur.length;
  try { EV("todDie('zombie')"); } catch (e) { R.err_tod = String(e.message || e); }
  await W(500); R.nach_tod = ST.cur.length;
  return JSON.stringify(R);
})()
