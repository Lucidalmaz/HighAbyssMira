(async () => {
  const VT = window.__vt, SM = window.__stimmen, ST = SM.S, W = VT.W, R = {};
  const long = Object.entries(ST.man.z).filter(([i, z]) => z[1] > 5 && z[2] === 'luke').slice(7, 9);
  const txt = id => Object.entries(ST.man.t).find(([t, ids]) => ids.includes(id))[0];
  for (let i = 0; i < 80 && ST.cur.length; i++) await W(100);
  const kap = window.__kap && __kap.get(); R.kap_vor = kap;
  SM.spiele(txt(long[0][0]), 'DU'); await W(800); R.laeuft = ST.cur.length;
  const n = kap >= 6 ? 5 : kap + 1; G.setChapter(n); await W(700);
  R.nach_wechsel_cur = ST.cur.length; R.kap_nach = window.__kap && __kap.get();
  // danach spielt eine neue Zeile normal
  await W(1500); SM.spiele(txt(long[1][0]), 'DU'); await W(900); R.neue_zeile = ST.cur.length; 
  R.zustand = SM.zustand();
  return JSON.stringify(R);
})()
