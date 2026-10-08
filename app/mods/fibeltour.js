// =====================================================================  FIBEL-TOUR (Modul „fibeltour“, 08.10.2026)
// Geführte Tour beim Aufwachen (traum.js ruft fibeltour_start() nach „Die Fibel steckt drin“): Luke schlägt die nasse Fibel auf und geht sie Seite für Seite durch –
// Aufgaben · Inventar · Funde · Fotos · Ränder · Karte. Gezeigt wird die ECHTE Fibel-Oberfläche (renderJournal, echte Reiter und Seiten, keine nachgemalten Grafiken):
// Ein Fenster im Dunkel (SVG-Maske) hebt Reiter und Seite hervor, ein Filzstift-Kringel umkreist sie, darunter schreibt Luke je einen Satz auf ein Zettelblatt
// (echter Papierscan aus der Basis [papierScan], Heftlinien, Wasserflecken, gerissene Kanten; Schrift „Kalam“/„Caveat“ mit zufälligem Versatz je Buchstabe).
// Enter / Klick / Leertaste = weiter (beim Schreiben: erst fertig schreiben), Pfeil links = zurück, X oder Esc = alles überspringen. Danach steht die Tour als Fund
// „So funktioniert die Fibel“ in der Fibel (Tab). Das große „Ränder“-Fenster (hervorhebung.js, hl_karte) wird hier als Seite der Fibel gezeigt und poppt danach nicht mehr auf.
// Testzugriff: __fibeltour (S, start, ende).
const FIBT = { on: false, i: 0, steps: [], layer: null, res: null, typeIv: 0, raf: 0, holes: null, tgt: null, keyFn: null, ptrFn: null, clickFn: null, rsFn: null, papier: null, tab0: 'aufgaben', fertig: false };
const FIBT_TEXT = {
  aufgaben: 'Aufgaben. Was als Nächstes zu tun ist, steht hier. Ganz oben die Hauptsache: Lucy finden. Haus Nr. 7, der Keller.',
  inventar: 'Inventar. Alles, was ich bei mir trage. Die Fibel liegt jetzt auch drin – nass, aber heil.',
  funde: 'Funde. Jeder Zettel, jede Notiz, die ich lese, landet hier. Sogar der Traum von eben.',
  fotos: 'Fotos. Polaroids, die ich unterwegs finde. Noch ist jeder Platz leer.',
  raender: 'Ränder. Seit dieser Nacht liegt ein Schimmer um manche Dinge. Die Farbe verrät mir, was es ist.',
  karte: 'Karte. Meine eigene, mit Bleistift. Sie füllt sich, wo ich gewesen bin. Mit M ist sie sofort da.' };
function fibeltour_schritte() {
  const B = () => $('jBody'), tab = k => { const b = $('jTabs').querySelector(`[data-t="${k}"]`) || document.querySelector(`#samReiter [data-t="${k}"]`); return b; };
  return [
    { id: 'aufgaben', titel: 'AUFGABEN', tab: 'aufgaben', text: FIBT_TEXT.aufgaben, el: B, btn: () => tab('aufgaben') },
    { id: 'inventar', titel: 'INVENTAR', tab: 'inventar', text: FIBT_TEXT.inventar, el: B, btn: () => tab('inventar'), nach: () => { const s = B().querySelector('.slot.has[data-k="fibel"]'); if (s && s.onmouseenter) s.onmouseenter(); } }, // die echte Beschreibung unter den Feldern einblenden
    { id: 'funde', titel: 'FUNDE', tab: 'funde', text: FIBT_TEXT.funde, el: B, btn: () => tab('funde') },
    { id: 'fotos', titel: 'FOTOS', tab: 'fotos', text: FIBT_TEXT.fotos, el: B, btn: () => tab('fotos') },
    { id: 'raender', titel: 'RÄNDER', tab: 'funde', text: FIBT_TEXT.raender, el: B, btn: () => tab('funde'), nach: fibeltour_raender },
    { id: 'karte', titel: 'KARTE', tab: 'karte', text: FIBT_TEXT.karte, el: B, btn: () => tab('karte'), warte: 700 }]; }
// Die „Ränder“-Seite: der echte Fibel-Eintrag aus hervorhebung.js (Farbpunkte und Bedeutung), statt des Fensters mitten im Bild
function fibeltour_raender() {
  try { if (typeof hl_legende === 'function') hl_legende(true); if (typeof HL !== 'undefined') HL.tourGezeigt = true; } catch (e) {}
  try { const l = story.lore.find(x => x.key === 'hervorhebung'); const B = $('jBody'); if (!l || !B) return;
    B.innerHTML = `<h2>RÄNDER</h2><div class="ftNote">${l.html}</div>`; } catch (e) { console.warn('Fibel-Tour: Ränder', e); } }
function fibeltour_css() { if (document.getElementById('fibeltourCss')) return; const s = document.createElement('style'); s.id = 'fibeltourCss';
  s.textContent = `body.ftOn #journal .book { translate: 0 -12vh; } body.ftOn #jBody { max-height: calc(64vh - 90px); }
  #journal.ftZu .book { animation: ftZu .5s ease-in forwards !important; } @keyframes ftZu { to { opacity: 0; transform: translateY(24px) scale(.97) rotate(.8deg); } }
  @keyframes ftSeite { from { opacity: 0; transform: translateX(18px) rotate(.25deg); } to { opacity: 1; transform: none; } } #jBody.ftSeite { animation: ftSeite .45s cubic-bezier(.2,.8,.2,1); }
  #jBody .ftNote { white-space: pre-wrap; font: 400 clamp(15px, 1.95vh, 20px)/1.55 var(--f-buch, "Cormorant Garamond", Georgia, serif); color: #2a2016; }
  #jBody .ftNote .hand { font-family: var(--f-hand, Caveat, cursive); font-size: clamp(19px, 2.6vh, 26px); line-height: 1.3; color: #1e2b5c; } #jBody .ftNote small { opacity: .7; }
  #ftLayer { position: fixed; inset: 0; z-index: 9600; opacity: 0; transition: opacity .5s; cursor: pointer; } #ftLayer.on { opacity: 1; } #ftLayer.aus { opacity: 0; }
  #ftLayer svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
  #ftPen path { fill: none; stroke: #f0d58a; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 0 3px rgba(240,213,138,.45)); }
  #ftPen path.d { stroke-width: 1.4; stroke: #f7e7b4; opacity: .55; }
  #ftCard { position: absolute; left: 50%; bottom: 2.4vh; width: min(720px, 92vw); transform: translateX(-50%) rotate(-.5deg) translateY(26px); opacity: 0; transition: opacity .55s, transform .7s cubic-bezier(.2,.8,.2,1); filter: drop-shadow(0 16px 20px rgba(0,0,0,.65)); }
  #ftCard.on { opacity: 1; transform: translateX(-50%) rotate(-.5deg); }
  .ftPap { position: relative; padding: 15px 32px 12px 66px; background-color: #e6dcc3; background-size: cover; background-position: center; color: #1b2a5e; }
  .ftPap::before { content: ''; position: absolute; left: 48px; top: 0; bottom: 0; width: 2px; background: rgba(176,52,40,.4); }
  .ftTape { z-index: 2; position: absolute; left: 50%; top: -11px; width: 92px; height: 24px; margin-left: -46px; transform: rotate(-2.5deg); background: linear-gradient(180deg, rgba(232,214,150,.78), rgba(210,190,120,.7)); box-shadow: 0 1px 3px rgba(0,0,0,.35); clip-path: polygon(0 8%, 4% 0, 8% 12%, 12% 0, 92% 0, 96% 12%, 100% 0, 100% 90%, 96% 100%, 92% 88%, 88% 100%, 8% 100%, 4% 88%, 0 100%); }
  .ftKopf { display: flex; justify-content: space-between; align-items: baseline; font: 400 clamp(11px, 1.35vh, 14px) var(--f-titel, "IM Fell English SC", Georgia, serif); letter-spacing: .3em; color: #6d2418; }
  .ftTxt { margin: 6px 0 2px; font: 400 clamp(22px, 3.1vh, 31px)/1.42 var(--f-luke, Kalam, Caveat, cursive); min-height: 4.26em; color: #1b2a5e;
    background: repeating-linear-gradient(to bottom, transparent 0, transparent calc(1.42em - 2px), rgba(70,100,160,.3) calc(1.42em - 2px), rgba(70,100,160,.3) 1.42em); }
  .ftTxt .w { display: inline-block; white-space: nowrap; } .ftTxt .c { display: inline-block; opacity: 0; transform: translateY(var(--dy, 0)) rotate(var(--r, 0deg)) scale(var(--s, 1)); transition: opacity .1s; } .ftTxt .c.on { opacity: var(--o, 1); }
  .ftFuss { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font: 400 clamp(10px, 1.2vh, 13px) var(--f-typo, "Special Elite", monospace); letter-spacing: .1em; color: #6d5a3e; }
  .ftPunkte span { display: inline-block; width: 8px; height: 8px; margin-right: 7px; border-radius: 50%; border: 1.5px solid #5a3a22; } .ftPunkte span.on { background: #7c2418; border-color: #7c2418; } .ftPunkte span.ok { background: rgba(90,58,34,.5); }`;
  document.head.appendChild(s); }
// Papier für den Zettel: echter Scan (papierScan der Basis), Wasserflecken (die Fibel ist nass), einmal erzeugt
function fibeltour_papier() { if (FIBT.papier) return FIBT.papier; const W = 1200, H = 640, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  try { if (typeof papierScan === 'function') papierScan(c, W, H, '#e9e0c7', { dreck: .4 }); else { c.fillStyle = '#e9e0c7'; c.fillRect(0, 0, W, H); } } catch (e) { c.fillStyle = '#e9e0c7'; c.fillRect(0, 0, W, H); }
  c.save(); c.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 5; i++) { const x = rand(0, W), y = rand(0, H), r = rand(60, 170), g = c.createRadialGradient(x, y, r * .6, x, y, r); g.addColorStop(0, 'rgba(130,108,66,0)'); g.addColorStop(.86, 'rgba(130,108,66,.10)'); g.addColorStop(1, 'rgba(96,74,42,.22)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  c.restore(); try { return FIBT.papier = cv.toDataURL('image/jpeg', .9); } catch (e) { return FIBT.papier = ''; } }
function fibeltour_kante() { const n = 26, a = [], b = []; for (let i = 0; i <= n; i++) { const x = (i / n * 100).toFixed(2) + '%'; a.push(`${x} ${rand(0, 5).toFixed(1)}px`); b.push(`${x} calc(100% - ${rand(0, 5).toFixed(1)}px)`); }
  return `polygon(${a.join(',')},${b.reverse().join(',')})`; }
function fibeltour_ton(was) { const A = Audio; if (!A.ctx) return; try {
  if (was === 'auf') { if (A.buf.ui_fibel_1) A.play('ui_fibel_1', { gain: .28 }); setTimeout(() => { const k = traum_nm('fx_tropfen_1', 'fx_tropfen_2', 'fx_tropfen_3'); if (k) A.play(k, { gain: .1, rate: rand(.9, 1.1) }); }, 900); }
  else if (was === 'zu') { if (A.buf.ui_fibel_2) A.play('ui_fibel_2', { gain: .26 }); else A.paper && A.paper(); }
  else if (was === 'seite') { A.paper && A.paper(); }
  else if (was === 'stift') { if (A.buf.ui_stift) A.play('ui_stift', { gain: .075, rate: rand(.85, 1.2), dur: .2 }); } } catch (e) {} }
// Filzstift-Kringel um ein Rechteck: unregelmäßig, leicht überlappend, wird beim Erscheinen „gezogen“
function fibeltour_kringel(r) { const pen = document.getElementById('ftPen'); if (!pen) return; pen.innerHTML = ''; if (!r) return; const p = 9, x0 = r.left - p, y0 = r.top - p, x1 = r.right + p, y1 = r.bottom + p, J = () => (Math.random() - .5) * 5, pts = [];
  const side = (ax, ay, bx, by, k) => { for (let i = 0; i < k; i++) { const t = i / k; pts.push([ax + (bx - ax) * t + J(), ay + (by - ay) * t + J()]); } };
  const k = v => Math.max(3, Math.round(v / 130)); side(x0 + 14, y0, x1 - 14, y0, k(x1 - x0)); side(x1, y0 + 14, x1, y1 - 14, k(y1 - y0)); side(x1 - 14, y1, x0 + 14, y1, k(x1 - x0)); side(x0, y1 - 14, x0, y0 + 24, k(y1 - y0)); pts.push([x0 + 20, y0 + 1], [x0 + 52, y0 - 1]);
  for (const [stroke, jit] of [['', 1], ['d', 2.2]]) { const q = pts.map(([x, y]) => [x + (jit - 1) * J(), y + (jit - 1) * J()]); let d = `M${q[0][0].toFixed(1)} ${q[0][1].toFixed(1)}`;
    for (let i = 1; i < q.length - 1; i++) d += ` Q${q[i][0].toFixed(1)} ${q[i][1].toFixed(1)} ${((q[i][0] + q[i + 1][0]) / 2).toFixed(1)} ${((q[i][1] + q[i + 1][1]) / 2).toFixed(1)}`;
    const ph = document.createElementNS('http://www.w3.org/2000/svg', 'path'); ph.setAttribute('d', d); if (stroke) ph.setAttribute('class', stroke); pen.appendChild(ph);
    const len = ph.getTotalLength(); ph.style.strokeDasharray = len; ph.style.strokeDashoffset = len; void ph.getBoundingClientRect(); ph.style.transition = `stroke-dashoffset ${stroke ? 1.3 : 0.95}s cubic-bezier(.3,.6,.3,1)`; ph.style.strokeDashoffset = 0; } }
// Das Fenster im Dunkel gleitet weich zur neuen Stelle (eigene Interpolation, unabhängig davon, ob der Browser SVG-Maße per CSS animiert)
function fibeltour_lauf(now) { const S = FIBT; if (!S.on) return; const dt = Math.min(.1, S.lastT ? (now - S.lastT) / 1000 : 0), k = 1 - Math.exp(-dt * 9); S.lastT = now;
  if (S.holes && S.tgt) for (const id of ['h1', 'h2']) { const h = S.holes[id], t = S.tgt[id]; if (!h || !t) continue; for (const a of ['x', 'y', 'w', 'h']) h.v[a] += (t[a] - h.v[a]) * k; h.e.setAttribute('x', h.v.x.toFixed(1)); h.e.setAttribute('y', h.v.y.toFixed(1)); h.e.setAttribute('width', Math.max(0, h.v.w).toFixed(1)); h.e.setAttribute('height', Math.max(0, h.v.h).toFixed(1)); }
  S.raf = requestAnimationFrame(fibeltour_lauf); }
function fibeltour_fenster(st) { const S = FIBT, hole = (el, pad) => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width ? { x: r.left - pad, y: r.top - pad, w: r.width + 2 * pad, h: r.height + 2 * pad } : null; };
  const e = st.el && st.el(), b = st.btn && st.btn(); S.tgt = { h1: hole(e, 6), h2: hole(b, 3) };
  for (const id of ['h1', 'h2']) { const h = S.holes[id], t = S.tgt[id]; if (t && !h.v) h.v = { x: t.x + t.w / 2, y: t.y + t.h / 2, w: 0, h: 0 }; if (!t) { S.tgt[id] = { x: h.v ? h.v.x : 0, y: h.v ? h.v.y : 0, w: 0, h: 0 }; if (!h.v) h.v = { x: 0, y: 0, w: 0, h: 0 }; } }
  try { fibeltour_kringel(e ? e.getBoundingClientRect() : null); } catch (er) {} }
// Zettel beschreiben: Buchstabe für Buchstabe mit eigenem Versatz, Neigung, Größe und Tinte; je Wort ein Stiftgeräusch
function fibeltour_schreibe(txt) { const S = FIBT, T = document.querySelector('#ftCard .ftTxt'); clearInterval(S.typeIv); T.innerHTML = ''; const cs = [];
  txt.split(' ').forEach((w, wi, arr) => { const sw = document.createElement('span'); sw.className = 'w'; for (const ch of w) { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch;
      c.style.setProperty('--dy', rand(-1.8, 1.8).toFixed(1) + 'px'); c.style.setProperty('--r', rand(-2.2, 2.2).toFixed(1) + 'deg'); c.style.setProperty('--s', rand(.95, 1.06).toFixed(2)); c.style.setProperty('--o', rand(.82, 1).toFixed(2)); sw.appendChild(c); cs.push([c, wi, ch === w[0]]); }
    T.appendChild(sw); if (wi < arr.length - 1) T.appendChild(document.createTextNode(' ')); });
  let i = 0; S.typeCs = cs; S.typeIv = setInterval(() => { if (!S.on) return clearInterval(S.typeIv); const e = cs[i]; if (!e) { clearInterval(S.typeIv); S.typeIv = 0; return; } e[0].classList.add('on'); if (e[2] && i % 2 === 0) fibeltour_ton('stift'); i++; }, 30); }
function fibeltour_fertigSchreiben() { const S = FIBT; if (!S.typeIv) return false; clearInterval(S.typeIv); S.typeIv = 0; for (const e of S.typeCs || []) e[0].classList.add('on'); return true; }
function fibeltour_zeige(i, erst) { const S = FIBT; if (!S.on) return; i = Math.max(0, Math.min(S.steps.length - 1, i)); S.i = i; const st = S.steps[i], card = document.getElementById('ftCard'), pap = card.querySelector('.ftPap');
  card.classList.remove('on'); clearInterval(S.typeIv); S.typeIv = 0;
  const neu = jTab !== st.tab; jTab = st.tab; try { renderJournal(); } catch (e) { console.warn('Fibel-Tour: Seite', e); }
  const B = $('jBody'); if (B) { B.classList.remove('ftSeite'); void B.offsetWidth; B.classList.add('ftSeite'); } if (!erst) fibeltour_ton('seite');
  setTimeout(() => { if (!S.on || S.i !== i) return; try { st.nach && st.nach(); } catch (e) {}
    pap.style.clipPath = fibeltour_kante(); pap.querySelector('.ftSeiteNr').textContent = `SEITE ${i + 1} VON ${S.steps.length}`; pap.querySelector('.ftTitel').textContent = st.titel;
    pap.querySelector('.ftPunkte').innerHTML = S.steps.map((s, j) => `<span class="${j === i ? 'on' : j < i ? 'ok' : ''}"></span>`).join('');
    pap.querySelector('.ftHinweis').textContent = i === S.steps.length - 1 ? 'ENTER · FERTIG     TAB · FIBEL JEDERZEIT' : 'ENTER · WEITER     X · ÜBERSPRINGEN';
    setTimeout(() => { if (!S.on || S.i !== i) return; fibeltour_fenster(st); card.classList.add('on'); fibeltour_schreibe(st.text); }, 80); }, (st.warte || 130) + (neu ? 60 : 0)); }
function fibeltour_weiter() { const S = FIBT; if (!S.on) return; if (fibeltour_fertigSchreiben()) return; if (S.i >= S.steps.length - 1) return fibeltour_ende(false); fibeltour_zeige(S.i + 1); }
function fibeltour_zurueck() { const S = FIBT; if (!S.on || S.i <= 0) return; fibeltour_zeige(S.i - 1); }
function fibeltour_ende(skip) { const S = FIBT; if (!S.on) return; S.on = false; S.fertig = !skip; clearInterval(S.typeIv); cancelAnimationFrame(S.raf);
  removeEventListener('keydown', S.keyFn, true); removeEventListener('pointerdown', S.ptrFn, true); removeEventListener('click', S.clickFn, true); removeEventListener('resize', S.rsFn);
  const L = S.layer; if (L) { L.classList.remove('on'); L.classList.add('aus'); } fibeltour_ton('zu'); $('journal').classList.add('ftZu');
  setTimeout(() => { try { if (L) L.remove(); document.body.classList.remove('ftOn'); $('journal').classList.remove('ftZu'); jTab = S.tab0 || 'aufgaben'; const B = $('jBody'); if (B) B.classList.remove('ftSeite'); if (ui.overlay === 'journal') closeOverlay(); } catch (e) { console.warn('Fibel-Tour: Ende', e); }
    S.layer = null; const r = S.res; S.res = null; if (r) r(!skip); }, 560); }
// Die Tour als Fund „So funktioniert die Fibel“: jederzeit unter Tab → Funde nachlesbar (Handschrift auf dem Notizblatt)
function fibeltour_fund() { try { if (story.lore.some(l => l.key === 'fibel_tour')) return;
  story.lore.push({ key: 'fibel_tour', title: 'So funktioniert die Fibel', html: '<span class="hand">' + ['aufgaben', 'inventar', 'funde', 'fotos', 'raender', 'karte'].map(k => FIBT_TEXT[k]).join('\n\n') + '\n\nMit Tab geht sie jederzeit auf.</span>' }); } catch (e) {} }
function fibeltour_start() { const S = FIBT; if (S.on) return Promise.resolve(false);
  return new Promise(res => { try { fibeltour_css(); fibeltour_fund(); S.res = res; S.on = true; S.i = 0; S.steps = fibeltour_schritte(); S.tab0 = 'aufgaben'; S.lastT = 0; S.tgt = null;
    const L = document.createElement('div'); L.id = 'ftLayer'; S.layer = L;
    L.innerHTML = `<svg id="ftDim" xmlns="http://www.w3.org/2000/svg"><defs><mask id="ftMask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%"><rect x="0" y="0" width="100%" height="100%" fill="#fff"/><rect id="ftH1" rx="5" fill="#000"/><rect id="ftH2" rx="4" fill="#000"/></mask></defs><rect x="0" y="0" width="100%" height="100%" fill="rgba(5,3,2,.6)" mask="url(#ftMask)"/></svg><svg id="ftPen"></svg>
      <div id="ftCard"><div class="ftTape"></div><div class="ftPap"><div class="ftKopf"><span class="ftSeiteNr"></span><span class="ftTitel"></span></div><div class="ftTxt"></div><div class="ftFuss"><span class="ftPunkte"></span><span class="ftHinweis"></span></div></div></div>`;
    document.body.appendChild(L); const pp = fibeltour_papier(); if (pp) L.querySelector('.ftPap').style.backgroundImage = `url(${pp})`;
    S.holes = { h1: { e: L.querySelector('#ftH1'), v: null }, h2: { e: L.querySelector('#ftH2'), v: null } };
    S.keyFn = e => { if (!S.on) return; const c = e.code; e.preventDefault(); e.stopImmediatePropagation(); if (e.repeat) return;
      if (c === 'KeyX' || c === 'Escape') fibeltour_ende(true); else if (c === 'Enter' || c === 'NumpadEnter' || c === 'Space' || c === 'KeyE' || c === 'ArrowRight') fibeltour_weiter(); else if (c === 'ArrowLeft' || c === 'Backspace') fibeltour_zurueck(); };
    S.ptrFn = e => { if (!S.on) return; e.preventDefault(); e.stopImmediatePropagation(); if (e.button === 0 || e.pointerType === 'touch') fibeltour_weiter(); }; S.clickFn = e => { if (S.on) { e.preventDefault(); e.stopImmediatePropagation(); } };
    S.rsFn = () => { if (S.on) fibeltour_fenster(S.steps[S.i]); };
    addEventListener('keydown', S.keyFn, true); addEventListener('pointerdown', S.ptrFn, true); addEventListener('click', S.clickFn, true); addEventListener('resize', S.rsFn);
    document.body.classList.add('ftOn'); jTab = 'aufgaben'; renderJournal(); openOverlay('journal'); fibeltour_ton('auf'); requestAnimationFrame(() => L.classList.add('on')); S.raf = requestAnimationFrame(fibeltour_lauf);
    setTimeout(() => fibeltour_zeige(0, true), 650);
  } catch (e) { console.warn('Fibel-Tour', e); S.on = false; try { document.body.classList.remove('ftOn'); if (S.layer) S.layer.remove(); } catch (er) {} res(false); } }); }
window.__fibeltour = { S: FIBT, start: () => fibeltour_start(), ende: s => fibeltour_ende(!!s), weiter: () => fibeltour_weiter(), zeige: i => fibeltour_zeige(i) }; // Testzugriff
