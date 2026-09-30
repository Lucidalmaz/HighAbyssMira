// =====================================================================  AUGEN ZU (Modul „augenzu“, W2-P5): Taste Q halten – das Bild wird schwarz, der Ton bleibt
// Kanon, Regel 4: Wer die Augen zu hat, den sieht sie nicht. Ausnahme: ihre eigenen Kinder, sobald sie wissen, was sie sind.
// Eingeführt im Finale von Kapitel 2 (dort versagt es: „Ich seh ja durch dich.“), nützlich in Kapitel 5 (Stall) und Kapitel 6 (Hochsitz).
// Schnittstelle (produktion_welle2.md §1.3):
//   augenzu_frei(opts)  → schaltet Q für eine Szene frei. opts: { wirkt: true|false, hinweis: 'Q halten – Augen zu', onZu(), onAuf(sekunden) }
//                          wirkt:false (Kap. 2): Q schließt die Augen wie sonst – aber es schützt nicht; unter den Lidern bleibt ein graues Schimmern (sie sieht durch ihn).
//   augenzu_sperre()    → Q wieder ohne Wirkung (offene Augen gehen auf, Hinweis verschwindet)
//   augenzu_zu()        → true, solange Q gehalten wird und die Szene frei ist
//   augenzu_oeffnen()   → erzwingt „Augen auf“ (die Lider flattern auf); Q wirkt erst wieder nach Loslassen und neuem Drücken
// Bild: eigene Schwarzblende 0,3 s (DOM-Ebene unter dem HUD – Untertitel bleiben lesbar, kein Licht, kein Shader). Ton: bleibt, ohne Tiefpass, dafür Nähe-Hall
// (der vorhandene kleine Raumhall, solange die Augen zu sind). Robust: Menü, Pause, offene Fenster, Tod und Laden öffnen die Augen immer wieder (Wächter im Tick).
const augenzu_S = { frei: false, wirkt: true, hinweis: '', onZu: null, onAuf: null, zu: false, t0: 0, forced: false, el: null, hint: null, room: null };
{ const css = document.createElement('style');
  css.textContent = `#augenzu { position: fixed; inset: 0; pointer-events: none; background: #000; opacity: 0; transition: opacity .3s ease-in; }
  #augenzu.on { opacity: 1; } #augenzu.auf { animation: augenzuAuf .9s ease-out forwards; }
  @keyframes augenzuAuf { 0% { opacity: 1; } 28% { opacity: .38; } 42% { opacity: .82; } 100% { opacity: 0; } }
  #augenzu i { position: absolute; inset: 0; opacity: 0; background: radial-gradient(ellipse 32% 26% at 50% 47%, rgba(150,152,150,.10), rgba(90,92,92,.04) 55%, rgba(0,0,0,0) 100%); }
  #augenzu.durch i { animation: augenzuDurch 3.1s ease-in-out infinite; }
  @keyframes augenzuDurch { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
  #augenzuHint { position: absolute; left: 50%; bottom: 23%; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; opacity: 0; transition: opacity .6s;
    font: 600 14px "Cormorant Garamond", Georgia, serif; letter-spacing: .32em; color: #e9dfc8; text-shadow: 0 0 2px #000, 0 0 10px #000; white-space: nowrap; }
  #augenzuHint.show { opacity: 1; } #augenzuHint b { display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 30px; padding: 0 6px; letter-spacing: 0;
    border: 1px solid rgba(201,163,106,.7); border-radius: 3px; background: rgba(8,7,6,.62); color: #f3e7cc; font: 700 15px Georgia, serif; box-shadow: 0 0 14px rgba(201,163,106,.22); }
  body.augenzu #crosshair, body.augenzu #prompt { opacity: 0 !important; }`;
  document.head.appendChild(css);
  const hud = document.getElementById('hud'), el = augenzu_S.el = document.createElement('div'); el.id = 'augenzu'; el.appendChild(document.createElement('i'));
  document.body.insertBefore(el, hud); // unter dem HUD: Untertitel liegen über dem Schwarz
  const h = augenzu_S.hint = document.createElement('div'); h.id = 'augenzuHint'; hud.appendChild(h);
}
// ---------------------------------------------------------------- Schnittstelle
function augenzu_frei(opts = {}) {
  const S = augenzu_S; S.frei = true; S.wirkt = opts.wirkt !== false; S.onZu = opts.onZu || null; S.onAuf = opts.onAuf || null;
  S.hinweis = opts.hinweis === undefined ? 'Q halten – Augen zu' : (opts.hinweis || ''); S.forced = !!keys.KeyQ; // schon gedrückt: erst loslassen
  S.el.classList.toggle('durch', !S.wirkt);
  const t = trX(S.hinweis); S.hint.innerHTML = /^Q\s/.test(t) ? '<b>Q</b><span>' + t.slice(2) + '</span>' : t;
}
function augenzu_sperre() { const S = augenzu_S; if (S.zu) augenzu_set(false, false); S.frei = false; S.onZu = S.onAuf = null; S.hint.classList.remove('show'); }
function augenzu_zu() { return augenzu_S.frei && augenzu_S.zu; }
function augenzu_oeffnen() { const S = augenzu_S; S.forced = true; if (S.zu) augenzu_set(false, true); }
// ---------------------------------------------------------------- Lider
function augenzu_set(zu, flatter) {
  const S = augenzu_S, el = S.el; if (S.zu === zu) return; S.zu = zu;
  if (zu) { S.t0 = performance.now(); el.classList.remove('auf'); el.classList.add('on'); document.body.classList.add('augenzu');
    try { S.room = Audio.room; Audio.setRoom('small'); } catch (e) {} // Nähe-Hall: alles ist plötzlich ganz nah
    if (S.onZu) try { S.onZu(); } catch (e) { console.warn('Augen zu', e); } }
  else { el.classList.remove('on'); document.body.classList.remove('augenzu'); if (flatter) { el.classList.remove('auf'); void el.offsetWidth; el.classList.add('auf'); }
    try { Audio.setRoom(Audio.roomHint ? Audio.roomHint() : (S.room || 'out')); } catch (e) {}
    const sec = (performance.now() - S.t0) / 1000; if (S.onAuf) try { S.onAuf(sec); } catch (e) { console.warn('Augen auf', e); } }
}
// Solange die Augen zu sind, bleibt der Raumhall klein (der Klang-Wächter setzt ihn sonst jede Sekunde neu)
if (Audio.setRoom) Audio.setRoom = (o => function (kind) { return o.call(this, augenzu_S.zu ? 'small' : kind); })(Audio.setRoom);
setTimeout(() => { try { TOD_RESET.push(() => augenzu_sperre()); } catch (e) {} }, 0); // Wiederkehr nach dem Tod: jede Szene gibt Q neu frei (verzögert: TOD_RESET steht in tod.js, typeof schützt nicht vor der „temporal dead zone“)
MOD_SAVE.push(['augenzu', () => ({}), () => augenzu_sperre()]); // Laden: nie mit geschlossenen Augen anfangen
WORLD_MODS.push(['Augen zu', async () => { window.__augenzu = { S: augenzu_S, frei: augenzu_frei, sperre: augenzu_sperre, zu: augenzu_zu, oeffnen: augenzu_oeffnen }; }]);
// ---------------------------------------------------------------- Pro Bild: Taste lesen, Wächter (keine Zuweisungen)
WORLD_TICK.push(() => {
  const S = augenzu_S; try {
    const blocked = !state.started || menu.attract || ui.paused || (ui.overlay && ui.overlay !== 'note') || (typeof tod_S !== 'undefined' && tod_S.dying) || GL.lost;
    if (S.forced && !keys.KeyQ) S.forced = false;
    const want = S.frei && !S.forced && !blocked && !!keys.KeyQ;
    if (want !== S.zu) augenzu_set(want, false);
    else if (!S.zu && S.el.classList.contains('on')) { S.el.classList.remove('on'); document.body.classList.remove('augenzu'); } // Wächter: nie hängenbleibendes Schwarz
    const sh = S.frei && !!S.hinweis && !S.zu && !blocked; if (sh !== S.hint.classList.contains('show')) S.hint.classList.toggle('show', sh);
  } catch (e) { if (!S.err) { S.err = true; console.warn('Augen-zu-Tick', e); } }
});
