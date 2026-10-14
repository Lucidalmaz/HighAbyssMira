// =====================================================================  TIPPS (Modul „tipps“, Nutzer 10.10./12.10.2026): Tutorial im AAA-Maß – kontextbezogen, einmalig, überspringbar, ohne Textwand
// Konzept: docs/gameplay/fuehrung_tutorial.md · Texte: fuehrung_daten.js (FS_D.tp, 20 Einträge, IDs FS-<Kap>-TP-<Nr>) · Kreidepfeile: FS-1-KZ-01…04 (hier unten: tipps_kreide)
// Regeln: ein Tipp erscheint erst, wenn die Situation ihn braucht · höchstens einer je 60 s · nie in Jagd, Kino, QTE, Dialog, offener Fibel · 5 s sichtbar, Enter/Klick/X weg ·
// einmal je Spielstand (MOD_SAVE 'tipps'); wer die Aktion von selbst ausführt, sieht den Tipp nie · Einstellung „Hilfe“: aus = nur Priorität 1, deutlich = Stillstand schon nach 20 s.
// Position: unten links über der Akkuanzeige (Textspur unten Mitte, Ortsmarken darüber).
// Nicht doppelt: „Q halten – Augen zu“ (FS-2-TP-02, FS-5-TP-02) zeigt augenzu.js selbst mit Tastenkappe am Bild; Ducken/Kriechen/Hochziehen (FS-1-TP-08, FS-6-TP-01) laufen über
// bewegung.js (BHINT) → tipps_zeige; das Erklärwort „Strg“ ersetzt „Strg oder C“ (C ist in Kap. 5 die Kamera).
const TP = { done: new Set(), shown: new Set(), cur: null, hideT: 0, lastT: -999, t: 0, kd: {}, still: 0, run: 0, walk0: null, walked: 0, goalT: 0, goal: '', ready: false, q: [], poll: 0, el: null };
MOD_SAVE.push(['tipps', () => ({ done: [...TP.done], shown: [...TP.shown] }), v => { if (!v || typeof v !== 'object') return; (v.done || []).forEach(x => TP.done.add(x)); (v.shown || []).forEach(x => TP.shown.add(x)); }]);
const tp_txt = id => (FS_D.tp.find(x => x.id === id) || {});
const tp_k = (...c) => c.some(k => TP.kd[k]);
const tp_hilfe = () => { try { const h = settings.hilfe; return h === 0 || h === 2 ? h : 1; } catch (e) { return 1; } };
const tp_kap = () => { try { return typeof kap === 'function' ? kap() : curChapter(); } catch (e) { return 1; } };
function tp_ruhig() {
  try { if (!state.started || menu.attract || state.talking || ui.overlay || ui.paused || state.ending || state.blackout || (typeof scripted !== 'undefined' && scripted)) return false;
    if (typeof hunt !== 'undefined' && hunt.on) return false; if (typeof kino_S !== 'undefined' && kino_S.on) return false; if (typeof ziele_stress === 'function' && ziele_stress()) return false;
    if (typeof qte_aktiv === 'function' && qte_aktiv()) return false; if (typeof FS !== 'undefined' && FS.card) return false;
    const i = document.getElementById('introSeq'); if (i && i.classList.contains('show')) return false;
  } catch (e) { return false; } return true;
}
// ---------------------------------------------------------------- Anzeige
function tp_el() { if (TP.el) return TP.el; const el = document.createElement('div'); el.id = 'fsTipp'; (document.getElementById('hud') || document.body).appendChild(el); return TP.el = el; }
function tipps_zeigen(id, o = {}) {
  if (TP.done.has(id) || TP.cur) return false; const X = tp_txt(id), Z = X.zeilen || X.text.split(' / ');
  const h = tp_hilfe(); if (h === 0 && !o.prio1) return false;
  const el = tp_el(), T = o.tasten || [];
  // Tastennamen im Text werden zu Tastenkappen (Stil wie #kamTip kbd); Tasten, die im Text nicht vorkommen, stehen vorn als Kappen
  const kap = k => `<kbd>${k}</kbd>`; let vorn = [];
  const html = Z.map(l => { let s = l.replace(/&/g, '&amp;').replace(/</g, '&lt;'); s = s.replace(/W A S D/, () => kap('W') + kap('A') + kap('S') + kap('D'));
    for (const k of T) { if (/^[WASD]$/.test(k)) continue; const re = new RegExp('(^|[^A-Za-zÄÖÜäöüß>])' + k + '(?![A-Za-zÄÖÜäöüß])'); s = s.replace(re, (m, a) => a + kap(k)); }
    return `<p>${s}</p>`; }).join('');
  for (const k of T) if (!html.includes(`<kbd>${k}</kbd>`)) vorn.push(k);
  el.innerHTML = (vorn.length ? `<div class="kb">${vorn.map(kap).join('')}</div>` : '') + html;
  el.classList.add('an'); TP.cur = id; TP.hideT = TP.t + (o.sek || 5.2); TP.lastT = TP.t; TP.shown.add(id);
  try { if (typeof ziele_ton === 'function') ziele_ton('ui_stift', .16); } catch (e) {}
  return true;
}
function tipps_weg(gelernt) { if (!TP.cur) return false; if (gelernt) TP.done.add(TP.cur); tp_el().classList.remove('an'); TP.cur = null; return true; }
// Aus anderen Modulen (bewegung.js): Tipp nach ID; Rückgabe true = Tipp übernimmt (kein zusätzlicher Gedanke)
function tipps_zeige(id) { const D = { 'FS-1-TP-08': ['Strg', 'Leertaste'], 'FS-6-TP-01': ['Strg'] }[id]; if (!D) return false; if (TP.done.has(id) || TP.shown.has(id)) return true;
  if (!tp_ruhig() || TP.t - TP.lastT < 8) return false; return tipps_zeigen(id, { tasten: D }); }
// ---------------------------------------------------------------- Auslöser (2 mal je Sekunde)
const TP_LISTE = [
  // [id, Kapitel, Priorität, Tasten, wann(), gelernt()]
  ['FS-1-TP-01', [1], 1, ['W', 'A', 'S', 'D', 'Leertaste'], () => TP.still > (tp_hilfe() === 2 ? 2 : 3.5) && TP.walked < 5 && !FS.card, () => TP.walked >= 5],
  ['FS-1-TP-02', [1], 3, ['Shift'], () => TP.run > 25, () => tp_k('ShiftLeft', 'ShiftRight')],
  ['FS-1-TP-03', [1, 2], 2, ['F', 'R'], () => { try { return (!flashOn && (state.inBasement || (typeof indoorRect === 'function' && indoorRect()))) || FLASH.charge < .25; } catch (e) { return false; } }, () => tp_k('KeyF')],
  ['FS-1-TP-04', [1, 2, 3, 4, 5, 6], 2, ['E'], () => { const p = document.getElementById('promptText'); return !!p && /halten|aufbiegen|aufstemmen|Gitter|Leiter|Deckel/i.test(p.textContent) && p.offsetParent !== null; }, () => TP.eHeld > .6],
  ['FS-1-TP-05', [1, 2, 3, 4, 5, 6], 2, ['Z', 'Tab'], () => TP.goalT > (tp_hilfe() === 2 ? 20 : 40) && TP.t > 240, () => tp_k('KeyZ', 'KeyY', 'Tab')],
  ['FS-1-TP-06', [1, 2, 3, 4, 5, 6], 3, ['M'], () => TP.t > 420 && tp_kap() <= 3 && !state.inBasement && (typeof FS !== 'undefined' && (FS.om.has('FS-1-OM-04') || tp_kap() > 1)), () => tp_k('KeyM')],
  ['FS-1-TP-07', [1, 2, 3, 4, 5, 6], 2, ['Tab'], () => { try { return story.items.filter(k => k !== 'fibel').length >= 1 && TP.t > 60; } catch (e) { return false; } }, () => tp_k('Tab')],
  ['FS-1-TP-09', [1], 1, ['F'], () => { try { return typeof K1 !== 'undefined' && K1.v && K1.v.on; } catch (e) { return false; } }, () => false],
  ['FS-1-TP-10', [1, 2, 3, 4, 5, 6], 2, ['Enter', 'X'], () => FS.say >= 3 && !state.talking && tp_k('__nie'), () => tp_k('Enter', 'NumpadEnter', 'KeyX')],
  ['FS-1-TP-11', [1, 2, 3, 4, 5, 6], 2, ['Esc'], () => typeof FS !== 'undefined' && FS.cp.size >= 1 && TP.t > 150, () => false],
  ['FS-2-TP-01', [2], 1, ['Leertaste'], () => { try { const c = typeof C2 !== 'undefined' ? player.pos.x - C2.x : 0; return tp_kap() === 2 && c > 96 && c < 107; } catch (e) { return false; } }, () => false],
  ['FS-2-TP-03', [2], 1, ['Maus', 'A', 'D'], () => { try { return typeof ch2 !== 'undefined' && ch2.spiderPhase && ch2.spiderPhase !== 'gone' && ch2.spiderPhase !== 'idle' && /SCH.TTLE/.test(document.getElementById('objText').textContent); } catch (e) { return false; } }, () => false],
  ['FS-3-TP-01', [3, 4, 5, 6], 2, ['G'], () => { try { return story.items.some(k => /lichtstein/i.test(k)); } catch (e) { return false; } }, () => tp_k('KeyG')],
  ['FS-3-TP-02', [3], 3, ['Maus'], () => { try { return typeof lucy3_S !== 'undefined' && !!lucy3_S.win; } catch (e) { return false; } }, () => false],
  ['FS-5-TP-01', [5], 1, ['C', 'Klick'], () => { try { return tp_kap() === 5 && typeof kamera_S !== 'undefined' && kamera_S.film > 0 && !kamera_S.frei; } catch (e) { return false; } }, () => tp_k('KeyC')],
  ['FS-6-TP-02', [6], 1, ['R', 'E'], () => { try { return tp_kap() === 6 && FLASH.charge <= 0; } catch (e) { return false; } }, () => tp_k('KeyR')],
];
function tp_tick(dt) {
  if (!TP.ready || !state.started || menu.attract) return; TP.t += dt;
  const P = player.pos; if (!TP.walk0) TP.walk0 = [P.x, P.z]; else if (TP.walked < 5) TP.walked = Math.max(TP.walked, Math.hypot(P.x - TP.walk0[0], P.z - TP.walk0[1]));
  const mv = (typeof keys !== 'undefined') && (keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD || keys.ArrowUp);
  TP.still = mv ? 0 : TP.still + dt; TP.run = mv && !(keys.ShiftLeft || keys.ShiftRight) ? TP.run + dt : (mv ? 0 : TP.run * .98);
  TP.eHeld = (typeof keys !== 'undefined' && keys.KeyE) ? (TP.eHeld || 0) + dt : 0;
  const obj = (document.getElementById('objText') || {}).textContent || ''; if (obj !== TP.goal) { TP.goal = obj; TP.goalT = 0; } else if (tp_ruhig() && !mv) TP.goalT += dt; else if (tp_ruhig()) TP.goalT += dt * .5;
  if (TP.cur && TP.t > TP.hideT) tipps_weg(false);
  TP.poll -= dt; if (TP.poll > 0) return; TP.poll = .5;
  // gelernt: von selbst ausgeführt → nie zeigen
  const k = tp_kap();
  for (const [id, kaps, prio, tasten, wann, gel] of TP_LISTE) { if (TP.done.has(id)) continue; let g = false; try { g = gel(); } catch (e) {} if (g) { TP.done.add(id); if (TP.cur === id) tipps_weg(false); } }
  if (TP.cur || !tp_ruhig() || TP.t - TP.lastT < 60) return;
  for (const [id, kaps, prio, tasten, wann] of TP_LISTE) { if (TP.done.has(id) || TP.shown.has(id) || !kaps.includes(k)) continue; let ok = false; try { ok = wann(); } catch (e) {} if (!ok) continue;
    if (tp_hilfe() === 0 && prio !== 1) continue; if (tipps_zeigen(id, { tasten, prio1: prio === 1 })) break; }
}
// ---------------------------------------------------------------- Kreidepfeile: genau ein Moment je Farbe (Gedanke + Fibel-Fund; die weißen Pfeile glimmen kurz auf)
// Positionen stehen in kapitel1.js (K1.pfeileW weiß, K1.pfeileB blau, [x, z, dx, dz]). Auslöser: Pfeil < 7 m (blau < 6 m) und im Blickfeld, ≥ 0,8 s; spätestens 70 s nach Spielbeginn.
const TPK = { w: false, b: false, t: 0, wT: 0, wAt: 0, glim: 0 };
function tp_sieht(L, r) { const P = player.pos; for (const [x, z] of L) { if (Math.hypot(x - P.x, z - P.z) < r) { try { if (leben_facing(x, .05, z) > .55) return true; } catch (e) { return true; } } } return false; }
function tp_kreideTick(dt) {
  if (!TP.ready || !state.started || menu.attract || tp_kap() !== 1 || (TPK.w && TPK.b)) { if (TPK.glim > 0) tp_glimmen(dt); return; }
  if (TPK.glim > 0) tp_glimmen(dt);
  TPK.t += dt; if (TPK.t < .4) return; const d = TPK.t; TPK.t = 0; if (!tp_ruhig() || state.inBasement) return;
  const K = typeof K1 !== 'undefined' ? K1 : null; if (!K) return;
  if (!TPK.w && TP.t > 12) { TPK.wT = tp_sieht(K.pfeileW || [], 7) ? TPK.wT + d : 0; if (TPK.wT >= .8 || TP.t > 70) { TPK.w = true; tp_kreideW(); } }
  else if (TPK.w && !TPK.b && TP.t - TPK.wAt > 20 && tp_sieht(K.pfeileB || [], 6)) { TPK.b = true; try { gedanke('fs_kz_blau', FS_D.sc['FS-1-KZ-03'].split(' / ').join(' '), 500, 2); } catch (e) {} }
}
function tp_kreideW() {
  TPK.wAt = TP.t; TPK.glim = 2.4;
  try { gedanke('fs_kz_weiss', FS_D.sc['FS-1-KZ-01'].split(' / ').join(' '), 400, 3); } catch (e) {}
  try { if (!story.lore.some(l => l.key === 'kreidezeichen')) story.lore.push({ key: 'kreidezeichen', title: 'Kreidezeichen', html: FS_D.sc['FS-1-KZ-02'].split(' / ').join('\n') }); } catch (e) {}
}
function tp_glimmen(dt) { const im = typeof K1 !== 'undefined' ? K1.weissIM : null; if (!im) { TPK.glim = 0; return; } const m = im.material; TPK.glim = Math.max(0, TPK.glim - dt);
  if (!m.emissiveMap) { m.emissive = new THREE.Color(0xffffff); m.emissiveMap = m.map; m.needsUpdate = true; }
  const k = TPK.glim / 2.4; m.emissiveIntensity = TPK.glim <= 0 ? 0 : .85 * Math.sin(Math.PI * (1 - k)); }

// ---------------------------------------------------------------- Aussehen
(function tp_css() { const st = document.createElement('style'); st.id = 'tpCss'; st.textContent = `
#fsTipp { position: absolute; left: 30px; bottom: 64px; max-width: 420px; opacity: 0; transform: translateY(6px); transition: opacity .6s ease, transform .6s ease; pointer-events: none; text-shadow: 0 0 3px #000, 0 0 12px #000; }
#fsTipp.an { opacity: 1; transform: none; }
#fsTipp .kb { margin-bottom: 6px; } #fsTipp kbd { display: inline-block; min-width: 20px; margin-right: 5px; padding: 1px 7px; border: 1px solid rgba(201,163,106,.65); border-radius: 2px; background: rgba(0,0,0,.42); font: 600 clamp(13px, .95vw, 18px) Georgia, serif; color: #e0c38f; text-align: center; }
#fsTipp p { margin: 0 0 2px; font: italic clamp(18px, 1.3vw, 26px)/1.3 var(--f-buch, "Cormorant Garamond", Georgia, serif); color: #e6dcc4; }
`; document.head.appendChild(st); })();

WORLD_MODS.push(['Tipps', async () => {
  tp_el();
  addEventListener('keydown', e => { TP.kd[e.code] = (TP.kd[e.code] || 0) + 1; if (!TP.cur || e.repeat) return;
    const gel = { 'FS-1-TP-01': ['KeyW'], 'FS-1-TP-02': ['ShiftLeft', 'ShiftRight'], 'FS-1-TP-03': ['KeyF'], 'FS-1-TP-05': ['KeyZ', 'KeyY', 'Tab'], 'FS-1-TP-06': ['KeyM'], 'FS-1-TP-07': ['Tab'], 'FS-1-TP-09': ['KeyF'], 'FS-3-TP-01': ['KeyG'], 'FS-5-TP-01': ['KeyC'], 'FS-6-TP-02': ['KeyR'] }[TP.cur];
    if (gel && gel.includes(e.code)) tipps_weg(true); else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'KeyX') tipps_weg(true); }, true);
  addEventListener('mousedown', e => { if (TP.cur && e.button === 0 && document.pointerLockElement) tipps_weg(true); }, true);
  TP.ready = true;
  window.__tipps = { S: TP, K: TPK, zeigen: tipps_zeigen, weg: tipps_weg, liste: TP_LISTE.map(x => x[0]), done: () => [...TP.done] };
}]);
WORLD_TICK.push(dt => { try { tp_tick(dt); tp_kreideTick(dt); } catch (e) { if (!TP.err) { TP.err = 1; console.warn('Tipps: Takt', e); } } });
