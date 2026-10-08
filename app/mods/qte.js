// =====================================================================  QTE (Modul „qte“): Quick-Time-Events – klein, wiederverwendbar, im Bild verankert (R-10)
// Vorbild Until Dawn / Resident Evil: wenige, gut gesetzte Momente; ein schmaler Ring mit Tastenkappe sitzt am Ort der Handlung (Hand, Fass, Feuerzeug), kein Neon.
// API
//   qte_start({ type, keys, duration, need, window, label, at, onOk, onFail, onTick }) → Griff { cancel(), aktiv, ok }
//     type  'tippen'   einmal im richtigen Moment: der äußere Ring zieht sich zusammen, getroffen wird im Zielring (window = [a, b] als Anteil der Dauer)
//           'haemmern' schnell wiederholen (need Anschläge, der Druck lässt nach)
//           'folge'    Tastenfolge (keys = [...], je Taste duration / Anzahl)
//           'halten'   Taste halten und die Maus ruhig lassen („Nicht bewegen“), duration = Haltezeit; zu viel Bewegung oder Loslassen → Fehlschlag
//     keys  Rollen 'aktion' | 'links' | 'rechts' | 'ruetteln' | 'zurueck' (frei belegbar, Einstellungen) oder KeyboardEvent.code
//     sperre Rollen/Codes, die während des QTE abgefangen werden; bei 'tippen' zählt eine davon als Fehlgriff (falsche Richtung)
//     at    THREE.Vector3 oder Funktion → Vector3: der Ring folgt diesem Weltpunkt; sonst unten mittig
//     onTick(k, h) je Bild mit Fortschritt k (0…1) – z. B. für Kamera/Klang
//   qte_aktiv() · qte_taste(rolle) → code · qte_name(rolle|code) → lesbarer Name · qte_ende(ok) beendet den laufenden QTE von außen (Tests: __qte.erzwingen)
// Einstellungen: settings.qte = 'normal' | 'leicht' | 'auto' (Barrierefreiheit: automatisch bestehen) · settings.qteKeys = { aktion, links, rechts, ruetteln, zurueck }
// Leistung: ein DOM-Knoten, beim Laden gebaut; je Bild nur Stil-Zuweisungen solange ein QTE läuft.
const QTE_STD = { aktion: 'KeyE', links: 'KeyA', rechts: 'KeyD', ruetteln: 'Space', zurueck: 'KeyQ' };
const QTE_ROLLEN = [['aktion', 'Handeln (Fass, Feuerzeug)'], ['ruetteln', 'Losreißen (schnell drücken)'], ['links', 'Ausweichen links'], ['rechts', 'Ausweichen rechts'], ['zurueck', 'Über die Schulter sehen']];
const qte_S = { h: null, el: null, held: new Set(), maus: 0, wahl: null };
function qte_set() { try { return settings; } catch (e) { return {}; } }
function qte_taste(r) { const s = qte_set(), k = s.qteKeys || {}; return k[r] || QTE_STD[r] || r; }
function qte_name(r) { const c = QTE_STD[r] || (qte_set().qteKeys || {})[r] ? qte_taste(r) : r;
  const m = { Space: 'LEER', ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT', ControlLeft: 'STRG', ControlRight: 'STRG', AltLeft: 'ALT', Enter: 'ENTER', Tab: 'TAB', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Backspace: '⌫', CapsLock: 'FEST' };
  return m[c] || c.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'NUM ').toUpperCase(); }
function qte_modus() { const m = qte_set().qte; return m === 'leicht' || m === 'auto' ? m : 'normal'; }
function qte_aktiv() { return !!(qte_S.h && qte_S.h.aktiv); }
// ---------------------------------------------------------------- Aufbau (einmal)
function qte_dom() { if (qte_S.el) return qte_S.el;
  const css = document.createElement('style'); css.textContent = `
  #qte { position: absolute; left: 50%; top: 72%; width: 120px; height: 120px; margin: -60px 0 0 -60px; pointer-events: none; opacity: 0; transform: scale(.86); transition: opacity .22s, transform .22s; will-change: transform, left, top; }
  #qte.on { opacity: 1; transform: scale(1); }
  #qte svg { position: absolute; inset: 0; width: 120px; height: 120px; overflow: visible; }
  #qte .bg { fill: rgba(8,7,6,.38); stroke: rgba(216,185,138,.16); stroke-width: 1; }
  #qte .zeit { fill: none; stroke: rgba(216,185,138,.85); stroke-width: 1.6; stroke-linecap: round; transform: rotate(-90deg); transform-origin: 60px 60px; filter: drop-shadow(0 0 3px rgba(0,0,0,.9)); }
  #qte .ziel { fill: none; stroke: rgba(239,226,198,.0); stroke-width: 5; transition: stroke .12s; }
  #qte .zug { fill: none; stroke: rgba(239,226,198,.75); stroke-width: 1.2; }
  #qte.t-tippen .ziel { stroke: rgba(216,185,138,.22); } #qte.t-tippen.fenster .ziel { stroke: rgba(239,226,198,.5); }
  #qte .kap { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); min-width: 26px; padding: 3px 8px 2px; border: 1px solid rgba(216,185,138,.6); border-radius: 3px; background: rgba(12,10,8,.62);
    font: 600 17px/1 "Cormorant Garamond", Georgia, serif; letter-spacing: .08em; color: #efe2c6; text-align: center; text-shadow: 0 0 4px #000; box-shadow: 0 1px 0 rgba(216,185,138,.25), 0 0 10px rgba(0,0,0,.6); transition: transform .08s, background .08s; }
  #qte .kap.druck { transform: translate(-50%, -46%) scale(.92); background: rgba(216,185,138,.22); }
  #qte .kap i { font-style: normal; opacity: .38; margin: 0 4px; } #qte .kap b { font-weight: 600; } #qte .kap .weg { opacity: .3; }
  #qte .lbl { position: absolute; left: 50%; top: 104px; transform: translateX(-50%); white-space: nowrap; font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .42em; color: #d8b98a; text-shadow: 0 0 3px #000, 0 0 9px #000; }
  #qte .auto { position: absolute; left: 50%; top: 120px; transform: translateX(-50%); white-space: nowrap; font: italic 400 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .12em; color: rgba(216,185,138,.55); display: none; }
  #qte.modus-auto .auto { display: block; }
  #qte.ok { opacity: 0; transform: scale(1.28); transition: opacity .45s, transform .45s; } #qte.ok .zeit { stroke: #f4ead4; }
  #qte.fail .zeit, #qte.fail .kap { stroke: #a3271b; border-color: #a3271b; color: #e8b0a4; } #qte.fail { animation: qteNein .32s; opacity: 0; transition: opacity .6s .25s; }
  /* Losreißen (gross): Prompt groß, Ring wie eine pulsierende Ader, Bildränder atmen rot */
  #qte.gross { top: 70% !important; left: 50% !important; }
  #qte.gross.on { transform: scale(2.1); }
  #qte.gross .zeit { stroke-width: 3.4; stroke: #b3231a; filter: url(#qteOrg) drop-shadow(0 0 5px rgba(160,20,10,.8)); }
  #qte.gross .bg { fill: rgba(30,4,3,.55); stroke: rgba(179,35,26,.5); }
  #qte.gross .kap { font-size: 21px; padding: 4px 10px 3px; border-color: rgba(239,226,198,.85); background: rgba(24,6,4,.78); }
  #qte.gross .lbl { top: 100px; color: #e6c9a0; letter-spacing: .5em; font-size: 10px; }
  #qte.gross .kap.druck { transform: translate(-50%, -38%) scale(.84); background: rgba(179,35,26,.5); }
  #qte.gross.puls .bg { fill: rgba(110,12,8,.7); }
  #qteRand { position: fixed; inset: 0; pointer-events: none; opacity: 0; z-index: 40; background: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 38%, rgba(70,2,2,.55) 78%, rgba(25,0,0,.92) 100%); will-change: opacity; }
  #qteRand.gut { background: radial-gradient(ellipse at 50% 50%, rgba(255,246,225,.0) 20%, rgba(255,246,225,.7) 100%); transition: opacity .7s; }
  #qteRand.nein { background: rgba(10,0,0,.85); transition: opacity .5s; }
  @keyframes qteNein { 0%, 100% { margin-left: -60px; } 20% { margin-left: -66px; } 45% { margin-left: -55px; } 70% { margin-left: -63px; } }`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'qte';
  el.innerHTML = '<svg viewBox="0 0 120 120"><defs><filter id="qteOrg" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter></defs><circle class="bg" cx="60" cy="60" r="27"/><circle class="ziel" cx="60" cy="60" r="27"/><circle class="zug" cx="60" cy="60" r="44"/><circle class="zeit" cx="60" cy="60" r="33"/></svg><div class="kap"></div><div class="lbl"></div><div class="auto">automatisch</div>';
  (document.getElementById('hud') || document.body).appendChild(el); qte_S.el = el; const rd = document.createElement('div'); rd.id = 'qteRand'; document.body.appendChild(rd); qte_S.rand = rd;
  qte_S.zeit = el.querySelector('.zeit'); qte_S.zug = el.querySelector('.zug'); qte_S.kap = el.querySelector('.kap'); qte_S.lbl = el.querySelector('.lbl'); qte_S.ziel = el.querySelector('.ziel');
  qte_S.U = 2 * Math.PI * 33; qte_S.zeit.style.strokeDasharray = qte_S.U.toFixed(1);
  return el; }
// ---------------------------------------------------------------- Start / Ende
function qte_start(o = {}) {
  qte_dom(); if (qte_S.h) qte_ende(null); // nur einer zur Zeit (der alte endet ohne Rückruf)
  const M = qte_modus(), easy = M === 'leicht', type = o.type || 'tippen', rollen = [].concat(o.keys || (type === 'haemmern' ? 'ruetteln' : 'aktion'));
  const dur = (o.duration || (type === 'haemmern' ? 3 : type === 'halten' ? 2.6 : 1.4)) * (easy ? 1.45 : 1);
  const win = o.window || [.62, .9], ww = easy ? Math.min(.3, (win[1] - win[0]) * .9) : 0;
  const h = { o, type, rollen, codes: rollen.map(qte_taste), sperre: [].concat(o.sperre || []).map(qte_taste), dur, t: 0, k: 0, need: Math.max(3, Math.round((o.need || 9) * (easy ? .6 : 1))), win: [Math.max(.15, win[0] - ww), Math.min(.98, win[1] + ww * .4)],
    pos: 0, wack: 0, still: (o.still || 1) * (easy ? 2.6 : 1), auto: M === 'auto', aktiv: true, ok: null, hielt: 0, frueh: easy ? 1 : 0, cancel: () => qte_ende(null) };
  qte_S.h = h; qte_S.maus = 0; const el = qte_S.el;
  el.className = 't-' + type + (h.auto ? ' modus-auto' : '') + (o.gross ? ' gross' : ''); h.gross = !!o.gross; h.flash = 0; if (h.gross) { qte_S.rand.className = ''; qte_S.rand.style.opacity = '.25'; } qte_S.lbl.textContent = (o.label || '').toUpperCase();
  qte_kappe(h); qte_S.zug.style.display = type === 'tippen' ? '' : 'none'; qte_S.ziel.setAttribute('r', type === 'tippen' ? 27 : 27);
  qte_S.zeit.style.strokeDashoffset = '0'; qte_lage(h); void el.offsetWidth; el.classList.add('on');
  return h; }
function qte_kappe(h) { const k = qte_S.kap;
  if (h.type === 'folge') k.innerHTML = h.codes.map((c, i) => `<b class="${i < h.pos ? 'weg' : ''}">${qte_name(h.rollen[i])}</b>`).join('<i>·</i>');
  else k.textContent = qte_name(h.rollen[0]); }
function qte_ende(ok) { const h = qte_S.h; if (!h) return; qte_S.h = null; h.aktiv = false; h.ok = ok; const el = qte_S.el;
  if (h.gross) { const r = qte_S.rand; r.className = ok === true ? 'gut' : ok === false ? 'nein' : ''; r.style.opacity = ok === null ? '0' : '1'; setTimeout(() => { r.style.opacity = '0'; }, ok === true ? 180 : 420); }
  el.classList.remove('on', 'fenster', 'puls'); if (ok === true) el.classList.add('ok'); else if (ok === false) el.classList.add('fail');
  setTimeout(() => { if (!qte_S.h) el.className = ''; }, 700);
  if (ok === null) return; try { (ok ? h.o.onOk : h.o.onFail) && (ok ? h.o.onOk : h.o.onFail)(h); } catch (e) { console.warn('QTE Rückruf', e); } }
// ---------------------------------------------------------------- Eingabe (vor dem Spiel: die Taste löst während eines QTE nichts anderes aus)
addEventListener('keydown', e => { qte_S.held.add(e.code); const h = qte_S.h; if (!h || !h.aktiv) return; let pause = false; try { pause = ui.paused || !!ui.overlay; } catch (er) {} if (pause) return;
  const i = h.codes.indexOf(e.code), alle = h.codes.concat(h.sperre);
  if (!alle.includes(e.code) && (h.type !== 'folge' || !Object.keys(QTE_STD).some(r => qte_taste(r) === e.code))) return; // Folge: nur eine falsche QTE-Taste zählt als Fehler, Laufen bleibt frei
  e.preventDefault(); e.stopImmediatePropagation(); if (e.repeat || h.auto) return;
  qte_S.kap.classList.add('druck'); setTimeout(() => qte_S.kap.classList.remove('druck'), 90);
  if (h.type === 'tippen') { if (i < 0) { if (h.sperre.includes(e.code)) { if (h.frueh > 0) h.frueh--; else qte_ende(false); } return; } const k = h.t / h.dur; if (k >= h.win[0] && k <= h.win[1]) qte_ende(true); else if (h.frueh > 0) h.frueh--; else qte_ende(false); }
  else if (h.type === 'haemmern') { if (i >= 0) { h.k = Math.min(1, h.k + 1 / h.need); h.flash = 1; if (h.gross) { const z = qte_S.zeit; z.style.stroke = h.k > .66 ? '#efe2c6' : h.k > .33 ? '#d4472f' : '#b3231a'; if (h.o.onHit) try { h.o.onHit(h.k, h); } catch (er) {} } } if (h.k >= 1) qte_ende(true); }
  else if (h.type === 'folge') { if (e.code === h.codes[h.pos]) { h.pos++; h.t = 0; qte_kappe(h); if (h.pos >= h.codes.length) qte_ende(true); } else if (h.frueh > 0) h.frueh--; else qte_ende(false); }
}, true);
addEventListener('keyup', e => qte_S.held.delete(e.code), true);
addEventListener('blur', () => qte_S.held.clear());
addEventListener('mousemove', e => { if (qte_S.h && qte_S.h.type === 'halten' && document.pointerLockElement) qte_S.maus += Math.min(200, Math.abs(e.movementX) + Math.abs(e.movementY)); });
// ---------------------------------------------------------------- Lage im Bild (Weltpunkt → Bildschirm, im sicheren Bereich gehalten)
const _qv = new THREE.Vector3();
function qte_lage(h) { const el = qte_S.el, at = typeof h.o.at === 'function' ? h.o.at() : h.o.at; let x = .5, y = .72;
  if (at && typeof camera !== 'undefined') { _qv.copy(at).project(camera); if (_qv.z < 1 && Math.abs(_qv.x) < 1.4 && Math.abs(_qv.y) < 1.4) { x = Math.min(.86, Math.max(.14, _qv.x * .5 + .5)); y = Math.min(.82, Math.max(.2, .5 - _qv.y * .5)); } }
  h.x = h.x === undefined ? x : h.x + (x - h.x) * .25; h.y = h.y === undefined ? y : h.y + (y - h.y) * .25; el.style.left = (h.x * 100).toFixed(2) + '%'; el.style.top = (h.y * 100).toFixed(2) + '%'; }
// ---------------------------------------------------------------- Pro Bild
function qte_tick(dt) { const h = qte_S.h; if (!h || !h.aktiv) return; h.t += dt; const U = qte_S.U, Z = qte_S.zeit;
  qte_lage(h);
  if (h.auto && h.t > Math.min(h.dur * .55, h.type === 'tippen' ? h.dur * (h.win[0] + .04) : 1.1)) return qte_ende(true); // Barrierefreiheit: besteht von selbst, die Aufforderung bleibt kurz lesbar
  if (h.type === 'tippen') { const k = Math.min(1, h.t / h.dur), r = 44 - 30 * k; qte_S.zug.setAttribute('r', r.toFixed(2)); Z.style.strokeDashoffset = (U * k).toFixed(1);
    qte_S.el.classList.toggle('fenster', k >= h.win[0] && k <= h.win[1]); h.k = k; if (k >= 1) return qte_ende(false); }
  else if (h.type === 'haemmern') { h.k = Math.max(0, h.k - dt * (h.o.decay ?? .32)); Z.style.strokeDashoffset = (U * (1 - h.k)).toFixed(1); if (h.t >= h.dur) return qte_ende(false);
    if (h.gross) { const druck = 1 - h.k, herz = Math.max(0, Math.sin(h.t * (6 + 5 * druck))); h.flash = Math.max(0, h.flash - dt * 6); qte_S.rand.style.opacity = Math.min(1, .2 + .55 * druck + .18 * herz * druck + .3 * h.flash).toFixed(3); Z.style.strokeWidth = (3.2 + 1.6 * herz * druck + 1.6 * h.flash).toFixed(2); qte_S.el.classList.toggle('puls', herz > .6 && druck > .3); } }
  else if (h.type === 'folge') { const per = h.dur / h.codes.length, k = Math.min(1, h.t / per); Z.style.strokeDashoffset = (U * k).toFixed(1); h.k = h.pos / h.codes.length; if (k >= 1) return qte_ende(false); }
  else if (h.type === 'halten') { const down = h.codes.some(c => qte_S.held.has(c)), mv = qte_S.maus; qte_S.maus = 0;
    h.wack = Math.max(0, h.wack + mv * .0016 / h.still - dt * .55) ; if (!down && h.t > .35) h.hielt += dt; else h.hielt = Math.max(0, h.hielt - dt);
    if (down) h.k = Math.min(1, h.k + dt / h.dur); Z.style.strokeDashoffset = (U * (1 - h.k)).toFixed(1);
    const j = Math.min(1, h.wack); qte_S.kap.style.marginLeft = ((Math.random() - .5) * 7 * j).toFixed(1) + 'px'; Z.style.strokeWidth = (1.6 + j * 1.6).toFixed(2);
    if (h.wack >= 1 || h.hielt > (qte_modus() === 'leicht' ? 1.2 : .6)) return qte_ende(false); if (h.k >= 1) return qte_ende(true);
    if (h.t > h.dur * 3) return qte_ende(false); }
  if (h.o.onTick) try { h.o.onTick(h.k, h); } catch (e) {} }
WORLD_MODS.push(['QTE', async () => {
  qte_dom();
  const mS = document.getElementById('mSet'); if (mS) mS.addEventListener('click', () => setTimeout(qte_einstellung, 0));
  window.__qte = { S: qte_S, start: o => qte_start(o), erzwingen: ok => qte_ende(!!ok), name: qte_name, taste: qte_taste };
}]);
WORLD_TICK.push(dt => { try { qte_tick(dt); } catch (e) { if (!qte_S.err) { qte_S.err = true; console.warn('QTE', e); } } });
// ---------------------------------------------------------------- Einstellungen: Schwierigkeit/Automatik, Tasten frei belegen
function qte_einstellung() { try { const P = document.getElementById('subPanel'), z = P && P.querySelector(':scope > div.close'); if (!z || !P.querySelector('#sGfx') || document.getElementById('sQte')) return;
  const s = settings, m = qte_modus();
  z.insertAdjacentHTML('beforebegin', `<div class="row"><span>Quick-Time-Events</span><select id="sQte"><option value="normal" ${m === 'normal' ? 'selected' : ''}>Normal</option><option value="leicht" ${m === 'leicht' ? 'selected' : ''}>Leicht (mehr Zeit)</option><option value="auto" ${m === 'auto' ? 'selected' : ''}>Automatisch bestehen</option></select></div>`
    + QTE_ROLLEN.map(([r, n]) => `<div class="row"><span>${n}</span><span class="close" style="margin:0"><button data-qte="${r}" style="min-width:96px">${qte_name(r)}</button></span></div>`).join(''));
  const sel = document.getElementById('sQte'); sel.onclick = ev => ev.stopPropagation(); sel.onchange = ev => { s.qte = ev.target.value; saveSettings(); };
  P.querySelectorAll('button[data-qte]').forEach(b => b.onclick = ev => { ev.stopPropagation(); const r = b.dataset.qte; b.textContent = 'Taste …';
    const fang = e => { e.preventDefault(); e.stopImmediatePropagation(); removeEventListener('keydown', fang, true);
      if (e.code !== 'Escape') { s.qteKeys = Object.assign({}, s.qteKeys || {}, { [r]: e.code }); saveSettings(); } b.textContent = qte_name(r); };
    addEventListener('keydown', fang, true); }); } catch (e) { console.warn('QTE Einstellungen', e); } }
