// =====================================================================  OBERFLÄCHE (Modul „oberflaeche“, R-14 + Q-3 + Schriften-Wunsch vom 01.10.2026)
// Nur Aussehen und Übergänge – keine IDs, keine Handler der Basis werden angefasst.
// 1) SCHRIFTEN je Funktion (alle lokal in app/vendor/fonts, SIL OFL bzw. Apache 2.0, mit ä ö ü ß; Konzept: docs/gameplay/visual_identity.md § 9):
//    Titel/Menü IM Fell English (SC) · Fließtext/Fibel Cormorant Garamond · Untertitel/HUD/Hinweise Alegreya Sans (SC) · Lukes Gedanken Kalam ·
//    Erwachsenen-Handschrift Caveat · Lucy/Luna und Kinder Gochi Hand · Beobachter/Kreide Covered By Your Grace · Schreibmaschine (Amt, LWO, BfR) Special Elite ·
//    Formulare/Geräte Courier Prime · das Fremde (Lichtschiff, das Weiße, ∴) Julius Sans One. CSS-Variablen --f-*; Klasse .ob-fremd für fremde Schrift.
// 2) PAPIER je Quelle: Notizen bekommen data-src (brief · amt · druck · lucy · kind · beob · postit · handy) aus Titel/Inhalt; echte Papierstruktur
//    (Fasern, Stockflecken, Wasserränder, Kaffeering, Falze, Lochung, Linien/Karos, Schiefertafel) einmal beim Laden auf Canvas erzeugt;
//    Stempel auf Amtspapier; „Fibel:“-Randnotizen in Lukes Handschrift.
// 3) BEWEGUNG: Overlays und Unterfenster blenden weich ein und aus (allow-discrete), Regen läuft über die Scheibe vor dem Hauptmenü.
const OB = { pap: {}, stil: null, regen: null };
const OB_QUELLE = [['handy', /handy|display/i], ['postit', /post-it/i], ['beob', /kreide|∴|beobachter|stöckchenmann/i],
  ['kind', /heidis karten|dinas|roxys|jonas|kinderzeichnung|zeichnung|himmel und hölle|abzählreim|spielhaus|heftseite|cleos/i], ['lucy', /lucy|luna/i],
  ['amt', /akte|bfr|merkblatt|protokoll|dienstplan|klemmbrett|einwilligung|vermessung|untersuchungsheft|prüfraum|messpunkt|blatt 212|schichtbuch|formular|bescheid|lwo|\bamt\b|spind/i],
  ['druck', /laternenbote|zeitung|aushang|schaukasten|gemeindebrief|kirchenführer|fahrplan|chronik|schild|plakette|\bbon\b|fahrkarte|rechnung|schwarzes brett|plakate|gesangbuch|kalender|kreuzworträtsel|notenblatt/i]];
function ob_quelle(title, html) { const t = String(title || ''); for (const [k, re] of OB_QUELLE) if (re.test(t)) return k; if (/∴/.test(html || '')) return 'beob'; return 'brief'; }

// ---------------------------------------------------------------- Papier (Canvas → JPEG, einmal beim Laden)
function ob_papier(o) {
  const W = 640, H = 880, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true }), R = Math.random;
  x.fillStyle = o.base; x.fillRect(0, 0, W, H); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  const scan = o.fasern > 0 && PAPIER.faser; if (scan) { papierScan(x, W, H, o.base, { dreck: .3 }); o = { ...o, wolke: o.wolke * .35, fasern: o.fasern * .15 }; } // echtes Papier (Scan) trägt Faser und Knitter; die gemalten Wolken/Fasern nur noch als Hauch
  for (const [n, a] of [[5, 1], [13, .7], [34, .45]]) { const s = document.createElement('canvas'); s.width = n; s.height = Math.round(n * H / W); const sx = s.getContext('2d'), id = sx.createImageData(s.width, s.height);
    for (let i = 0; i < id.data.length; i += 4) { const hell = R() < .45; id.data[i] = hell ? o.hell[0] : o.dunkel[0]; id.data[i + 1] = hell ? o.hell[1] : o.dunkel[1]; id.data[i + 2] = hell ? o.hell[2] : o.dunkel[2]; id.data[i + 3] = R() * 255 * a * o.wolke; }
    sx.putImageData(id, 0, 0); x.drawImage(s, 0, 0, W, H); }
  if (o.wisch) { x.lineCap = 'round'; for (let i = 0; i < o.wisch; i++) { x.strokeStyle = `rgba(225,228,215,${.025 + R() * .04})`; x.lineWidth = 20 + R() * 60; x.beginPath(); const px = R() * W, py = R() * H; x.arc(px, py, 60 + R() * 200, R() * 6, R() * 6 + 1 + R() * 2); x.stroke(); } }
  x.lineCap = 'round';
  for (let i = 0; i < o.fasern; i++) { const px = R() * W, py = R() * H, l = 3 + R() * 18, a = R() * 6.28, b = a + (R() - .5) * 1.4;
    x.strokeStyle = R() < .55 ? `rgba(${o.dunkel.join(',')},${.035 + R() * .07})` : `rgba(${o.hell.join(',')},${.05 + R() * .09})`; x.lineWidth = .35 + R() * .8;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * .5, py + Math.sin(a) * l * .5, px + Math.cos(b) * l, py + Math.sin(b) * l); x.stroke(); }
  for (let i = 0; i < (o.stock || 0); i++) { const px = R() * W, py = R() * H, r = 1 + R() * (R() < .15 ? 9 : 3), g = x.createRadialGradient(px, py, 0, px, py, r * 2.2);
    g.addColorStop(0, `rgba(120,72,25,${.22 + R() * .25})`); g.addColorStop(.45, 'rgba(130,85,35,.08)'); g.addColorStop(1, 'rgba(130,85,35,0)'); x.fillStyle = g; x.fillRect(px - r * 3, py - r * 3, r * 6, r * 6); }
  const blob = (cx, cy, r, f, s, lw) => { x.beginPath(); const n = 28, ph = R() * 9; for (let i = 0; i <= n; i++) { const a = i / n * 6.2832, k = r * (.78 + .16 * Math.sin(a * 3 + ph) + .1 * Math.sin(a * 7 + ph * 2) + .05 * R());
    const px = cx + Math.cos(a) * k, py = cy + Math.sin(a) * k * .85; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); if (f) { x.fillStyle = f; x.fill(); } if (s) { x.strokeStyle = s; x.lineWidth = lw; x.stroke(); } };
  for (let i = 0; i < (o.wasser || 0); i++) { x.filter = 'blur(1.2px)'; blob(R() * W, R() * H, 50 + R() * 120, 'rgba(120,85,40,.045)', 'rgba(105,70,28,.16)', 1.6); x.filter = 'none'; }
  if (o.ring) { const cx = W * (.62 + R() * .25), cy = H * (.68 + R() * .22), r = 40 + R() * 12; x.filter = 'blur(.7px)';
    x.strokeStyle = 'rgba(92,52,18,.32)'; x.lineWidth = 3.5; x.beginPath(); x.arc(cx, cy, r, R() * 2, 4.4 + R() * 1.6); x.stroke();
    x.strokeStyle = 'rgba(92,52,18,.14)'; x.lineWidth = 7; x.beginPath(); x.arc(cx + 2, cy + 1, r - 2, 0, 6.3); x.stroke();
    x.fillStyle = 'rgba(120,75,30,.05)'; x.beginPath(); x.arc(cx, cy, r, 0, 6.3); x.fill();
    x.strokeStyle = 'rgba(92,52,18,.2)'; x.lineWidth = 2.5; x.beginPath(); x.arc(cx + r * .55, cy - r * .35, r * .96, 2.4, 4.1); x.stroke(); x.filter = 'none'; }
  for (const f of o.falz || []) { const y = f * H, g = x.createLinearGradient(0, y - 7, 0, y + 7);
    g.addColorStop(0, 'rgba(60,40,15,0)'); g.addColorStop(.42, 'rgba(60,40,15,.1)'); g.addColorStop(.5, 'rgba(255,253,245,.32)'); g.addColorStop(.57, 'rgba(60,40,15,.17)'); g.addColorStop(1, 'rgba(60,40,15,0)');
    x.fillStyle = g; x.fillRect(0, y - 7, W, 14); x.fillStyle = 'rgba(40,25,10,.025)'; x.fillRect(0, y, W, H - y); }
  if (o.vfalz) { const xx = W * o.vfalz, g = x.createLinearGradient(xx - 6, 0, xx + 6, 0); g.addColorStop(0, 'rgba(60,40,15,0)'); g.addColorStop(.45, 'rgba(60,40,15,.09)'); g.addColorStop(.52, 'rgba(255,253,245,.28)'); g.addColorStop(1, 'rgba(60,40,15,0)'); x.fillStyle = g; x.fillRect(xx - 6, 0, 12, H); }
  const img = x.getImageData(0, 0, W, H), d = img.data; for (let i = 0; i < d.length; i += 4) { const n = (R() - .5) * o.korn; d[i] += n; d[i + 1] += n; d[i + 2] += n * .9; } x.putImageData(img, 0, 0);
  const v = x.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, o.rand); x.fillStyle = v; x.fillRect(0, 0, W, H);
  if (o.loch) for (const y of [H * .32, H * .68]) { const g = x.createRadialGradient(30, y, 0, 30, y, 13); g.addColorStop(0, '#0c0a08'); g.addColorStop(.62, '#0c0a08'); g.addColorStop(.72, 'rgba(90,70,45,.5)'); g.addColorStop(1, 'rgba(90,70,45,0)'); x.fillStyle = g; x.fillRect(14, y - 16, 32, 32); }
  return c.toDataURL('image/jpeg', .88);
}
function ob_tinte() { // Stempelfarbe: unregelmäßig deckend (Maske)
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), R = Math.random; x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${.15 + R() * .6})`; x.beginPath(); x.arc(R() * 256, R() * 256, .5 + R() * 2.4, 0, 7); x.fill(); }
  for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(R() * 256, R() * 256, 10 + R() * 40, 4 + R() * 14, R() * 3, 0, 7); x.fill(); }
  const img = x.getImageData(0, 0, 256, 256), d = img.data; for (let i = 0; i < d.length; i += 4) { d[i + 3] = d[i]; d[i] = d[i + 1] = d[i + 2] = 0; } x.putImageData(img, 0, 0); return c.toDataURL('image/png');
}
function ob_kreide() { // Kreidestrich: körnige Maske für Schrift auf der Tafel
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), img = x.createImageData(128, 128), d = img.data, R = Math.random;
  for (let i = 0; i < d.length; i += 4) { d[i] = d[i + 1] = d[i + 2] = 0; d[i + 3] = R() < .22 ? 40 + R() * 90 : 200 + R() * 55; } x.putImageData(img, 0, 0); return c.toDataURL('image/png');
}

// ---------------------------------------------------------------- Regen auf der Scheibe (nur Hauptmenü)
function ob_regenStart() {
  const st = document.getElementById('start'), menu = document.getElementById('menu'); if (!st || OB.regen) return;
  const c = document.createElement('canvas'); c.id = 'obRegen'; st.insertBefore(c, menu || null); const x = c.getContext('2d'), R = Math.random;
  const S = OB.regen = { c, x, drops: [], runs: [], t: 0, last: 0 };
  const groesse = () => { c.width = Math.round(innerWidth / 2); c.height = Math.round(innerHeight / 2); }; groesse(); addEventListener('resize', groesse);
  const tropfen = (px, py, r, a) => { const g = x.createRadialGradient(px - r * .3, py - r * .35, 0, px, py, r); g.addColorStop(0, `rgba(235,225,205,${.55 * a})`); g.addColorStop(.35, `rgba(150,145,140,${.18 * a})`);
    g.addColorStop(.8, `rgba(10,10,14,${.35 * a})`); g.addColorStop(1, 'rgba(10,10,14,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(px, py, r, r * 1.12, 0, 0, 7); x.fill(); };
  for (let i = 0; i < 140; i++) S.drops.push({ x: R(), y: R(), r: .6 + R() * R() * 3.2, a: .35 + R() * .5 });
  const frame = now => {
    requestAnimationFrame(frame); if (!st.classList.contains('show') || document.hidden) return; if (now - S.last < 33) return; const dt = Math.min(.1, (now - S.last) / 1000); S.last = now;
    const W = c.width, H = c.height; x.clearRect(0, 0, W, H);
    if (S.runs.length < 7 && R() < dt * 1.4) S.runs.push({ x: R() * W, y: -10, v: 18 + R() * 40, r: 2 + R() * 2.2, wob: R() * 6, trail: [] });
    for (const d of S.drops) tropfen(d.x * W, d.y * H, d.r, d.a);
    for (let i = S.runs.length - 1; i >= 0; i--) { const q = S.runs[i]; q.v += (R() - .45) * 30 * dt; q.v = Math.max(6, Math.min(90, q.v)); q.y += q.v * dt; q.x += Math.sin(q.y * .05 + q.wob) * .25;
      if (R() < dt * 6) q.trail.push({ x: q.x, y: q.y, r: q.r * (.3 + R() * .25) }); if (q.trail.length > 26) q.trail.shift();
      x.strokeStyle = 'rgba(160,155,150,.07)'; x.lineWidth = q.r * .9; x.beginPath(); x.moveTo(q.x, q.y - 40); x.lineTo(q.x, q.y); x.stroke();
      for (const p of q.trail) tropfen(p.x, p.y, p.r, .6); tropfen(q.x, q.y, q.r, .9); if (q.y > H + 20) S.runs.splice(i, 1); }
  };
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- Stil
function ob_css() {
  const P = OB.pap, u = k => `url("${P[k]}")`;
  return `
:root { --f-titel: "IM Fell English SC", "IM Fell English", Georgia, serif; --f-titel-l: "IM Fell English", Georgia, serif; --f-buch: "Cormorant Garamond", Georgia, serif;
  --f-ui: "Alegreya Sans", "Segoe UI", sans-serif; --f-ui-sc: "Alegreya Sans SC", "Alegreya Sans", sans-serif; --f-luke: "Kalam", "Caveat", cursive; --f-hand: "Caveat", cursive;
  --f-lucy: "Gochi Hand", "Caveat", cursive; --f-kreide: "Covered By Your Grace", "Gochi Hand", cursive; --f-typo: "Special Elite", "Courier Prime", monospace;
  --f-akte: "Courier Prime", "Courier New", monospace; --f-fremd: "Julius Sans One", "Alegreya Sans", sans-serif; --ob-ease: cubic-bezier(.2,.8,.2,1); }
.ob-fremd { font-family: var(--f-fremd) !important; letter-spacing: .22em; font-weight: 400; color: #eef2ff; text-shadow: 0 0 6px rgba(200,215,255,.55), 0 0 22px rgba(170,190,255,.25), 0 1px 2px #000; }
/* ---------- Übergänge: Overlays und Unterfenster blenden weich (auch beim Schließen) */
.overlay { opacity: 0; transition: opacity .32s var(--ob-ease), display .32s allow-discrete, overlay .32s allow-discrete; }
.overlay.show { opacity: 1; } .overlay:not(.show) { pointer-events: none; }
@starting-style { .overlay.show { opacity: 0; } }
.overlay > .paper, .overlay > .box, .overlay > .book, .overlay > .panel { transition: transform .45s var(--ob-ease), filter .45s var(--ob-ease); }
.overlay:not(.show) > .book, .overlay:not(.show) > .box, .overlay:not(.show) > .panel { transform: translateY(10px) scale(.985); filter: blur(2px); }
@starting-style { .overlay.show > .book, .overlay.show > .box, .overlay.show > .panel { transform: translateY(14px) scale(.98); filter: blur(3px); } }
#subPanel { opacity: 0; transition: opacity .3s var(--ob-ease), display .3s allow-discrete; } #subPanel.show { opacity: 1; } @starting-style { #subPanel.show { opacity: 0; } }
#start { transition: opacity .6s var(--ob-ease), display .6s allow-discrete; }
#objective, #questPop span, #sideInfo { transition: opacity .5s var(--ob-ease); }
/* ---------- Hauptmenü: Titel wie alter, abgenutzter Druck; Regen auf der Scheibe */
#obRegen { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; opacity: .85; filter: blur(.3px); }
#start h1 { font-family: var(--f-titel-l); font-weight: 400; }
#start h1 .l { font-family: var(--f-titel); letter-spacing: .5em; }
#start h1 .m { font-family: var(--f-titel); letter-spacing: .1em; }
#start .sub, #start .dir, #start .foot, #goText { font-family: var(--f-ui-sc); font-weight: 500; }
#start .dir { font-style: italic; font-family: var(--f-titel-l); letter-spacing: .2em; }
#mainMenu button { font-family: var(--f-titel); font-size: 25px; letter-spacing: .16em; }
#mainMenu button small, #subPanel .chap button small { font-family: var(--f-ui-sc); font-weight: 500; letter-spacing: .22em; }
.ptitle, #pause .t, #puzzle h3, #jTabs button, #jBody h2, #journal h2 { font-family: var(--f-titel) !important; font-weight: 400 !important; }
#subPanel .row span, #subPanel .keys { font-family: var(--f-buch); }
#subPanel .close button, #pause .pbtns button, .case button { font-family: var(--f-ui-sc); font-weight: 500; letter-spacing: .32em; }
#subPanel .chap button { font-family: var(--f-titel-l); }
#subPanel select { font-family: var(--f-ui); }
/* ---------- HUD: klar, gut lesbar, mit Charakter */
#objective { font-family: var(--f-ui); font-size: 19px; line-height: 1.32; }
#objective b, #questPop small, #hudHint, #batt span, #subtitle .who, body #kbHud { font-family: var(--f-ui-sc) !important; font-weight: 700 !important; }
#sideInfo { font-family: var(--f-ui); font-style: italic; }
#questPop span { font-family: var(--f-titel-l); }
#prompt { font-family: var(--f-ui); font-weight: 500; font-size: 18px; }
#prompt kbd, kbd.k, .hint kbd { font-family: var(--f-ui-sc) !important; font-weight: 700 !important; }
#toast { font-family: var(--f-ui); font-style: italic; font-size: 20px; letter-spacing: .01em; }
/* Textordnung (Nutzer 08.10.): Gesprochenes und Gedanken unten in der Mitte (Name oben, Gedanken kursiv-blau mit „· GEDANKE“); Hinweise (toast) in einer eigenen, kleineren Zeile direkt darüber; Aufgabe oben links, neue Aufgabe oben rechts, E-Hinweis am Fadenkreuz */
#toast { top: auto !important; bottom: calc(8% + 118px); font-size: 17px; padding: 8px 40px !important; color: #d8cfba; letter-spacing: .03em; }
#toast::before { content: 'HINWEIS'; display: block; font: 700 10px var(--f-ui-sc, Georgia), serif; letter-spacing: .5em; color: #b9a173; margin-bottom: 2px; font-style: normal; }
#subtitle.thought .who { color: #9fb3c8; }
#subtitle.thought { font-style: italic; }
#subtitle[data-art="erz"] { color: #cfc8b8; font-style: italic; }
.hint, #keypad .hint, #puzzle .hint, #journal .hint, #note .hint { font-family: var(--f-ui-sc) !important; font-weight: 500 !important; }
#subtitle { font-family: var(--f-ui); font-weight: 500; font-size: calc(23px * var(--subScale, 1)); line-height: 1.38; letter-spacing: .005em; }
#subtitle.thought { font-family: var(--f-luke); font-style: normal; font-weight: 400; font-size: calc(24px * var(--subScale, 1)); line-height: 1.35; color: #e4e8ee; }
#subtitle[data-ob="fremd"] { font-family: var(--f-fremd); letter-spacing: .14em; color: #eef2ff; text-shadow: 0 0 6px rgba(200,215,255,.5), 0 0 22px rgba(170,190,255,.22), 0 1px 2px #000, 0 0 10px #000; }
#subtitle[data-ob="kind"] .who { color: #e8c9a0; }
body.kino:has(#kinoCard.on) #subtitle, body.kino:has(#kinoCard.on) #toast { opacity: 0 !important; } /* Kino-Endkarte ersetzt die Untertitel-Spur */
#introSeq #intro { font-family: var(--f-titel-l); font-size: 25px; line-height: 1.7; }
#introSeq .skip { font-family: var(--f-ui-sc); font-weight: 500; }
/* ---------- Fibel */
#jBody, #jBody li { font-family: var(--f-buch); }
#jBody li small, #invDesc { font-family: var(--f-buch); }
#invDesc b, .slot .n, .photos .ph { font-family: var(--f-ui-sc) !important; }
/* ---------- Rätsel und Geräte */
#puzzle p, #puzzle .small { font-family: var(--f-ui); }
#puzzle button, #keypad button { font-family: var(--f-akte); font-weight: 700; letter-spacing: .06em; }
#kpDisplay { font-family: var(--f-akte); font-weight: 700; }
/* ---------- Papier je Quelle */
#note .paper { font-family: var(--f-buch); font-size: 19px; line-height: 1.62; background: ${u('brief')} center / cover, #d9ceb2; background-size: cover; }
#note .paper[data-v="1"] { background: ${u('brief2')} center / cover, #d9ceb2; }
#note .paper h2 { font-family: var(--f-titel); font-weight: 400; font-size: 22px; letter-spacing: .06em; }
#note .paper .hand { font-family: var(--f-hand); font-size: 27px; line-height: 1.28; color: #1e2b5c; }
#note .paper[data-src] .hand.luke, #note .paper[data-src] .ob-fibel + .hand { font-family: var(--f-luke); font-size: 22px; line-height: 1.45; color: #3a2a1c; transform: rotate(-.6deg); text-shadow: 0 0 .6px rgba(40,28,16,.5); }
#note .paper .ob-fibel { font-family: var(--f-ui-sc); font-style: normal; font-weight: 700; font-size: 11px; letter-spacing: .3em; color: #7a5a3a; margin-right: 6px; }
#note .paper[data-src="amt"] { font-family: var(--f-typo); font-size: 16.5px; line-height: 1.75; color: #24201c; background: ${u('amt')} center / cover, #e2ddd0; }
#note .paper[data-src="amt"] h2 { font-family: var(--f-akte); font-weight: 700; font-size: 17px; letter-spacing: .14em; text-transform: uppercase; border-bottom: 2px solid rgba(30,30,30,.55); box-shadow: 0 3px 0 -2px rgba(30,30,30,.35); }
#note .paper[data-src="amt"] .hand { font-family: var(--f-typo); font-size: 16.5px; line-height: 1.75; color: #24201c; transform: none; text-shadow: 0 0 .7px rgba(20,20,20,.55); }
#note .paper[data-src="amt"] i + .hand, #note .paper[data-src="amt"] .ob-hs { font-family: var(--f-hand); font-size: 26px; line-height: 1.25; color: #1d3a8a; transform: rotate(-1.4deg); text-shadow: 0 0 1px rgba(29,58,138,.35); }
#note .paper[data-src="druck"] { font-family: var(--f-titel-l); font-size: 17.5px; line-height: 1.55; color: #1c1a17; background: ${u('druck')} center / cover, #cfc8b4; }
#note .paper[data-src="druck"] h2 { font-family: var(--f-titel); font-size: 26px; text-align: center; letter-spacing: .08em; border-bottom: 3px double rgba(30,28,24,.6); }
#note .paper[data-src="lucy"], #note .paper[data-src="kind"] { color: #2e2c33; }
#note .paper[data-src="lucy"] { background: linear-gradient(90deg, transparent 52px, rgba(190,60,60,.45) 52px 54px, transparent 54px), repeating-linear-gradient(180deg, transparent 0 33px, rgba(70,110,170,.28) 33px 34px) 0 52px / 100% calc(100% - 52px) no-repeat, ${u('heft')} center / cover, #e9e6dc; }
#note .paper[data-src="kind"] { background: repeating-linear-gradient(90deg, transparent 0 18px, rgba(80,110,150,.2) 18px 19px), repeating-linear-gradient(180deg, transparent 0 18px, rgba(80,110,150,.2) 18px 19px), ${u('heft')} center / cover, #e9e6dc; }
#note .paper[data-src="lucy"] .hand, #note .paper[data-src="kind"] .hand { font-family: var(--f-lucy); font-size: 25px; line-height: 1.36; color: #3b3a44; text-shadow: 0 0 .8px rgba(50,50,60,.6); }
#note .paper[data-src="kind"] .hand { color: #2f4f8f; }
#note .paper[data-src="lucy"] h2, #note .paper[data-src="kind"] h2 { font-family: var(--f-lucy); font-size: 26px; letter-spacing: .02em; border-bottom: 0; box-shadow: none; }
#note .paper[data-src="beob"] { color: #e6e3d8; background: ${u('tafel')} center / cover, #222724; box-shadow: inset 0 0 0 12px #3a2c1e, inset 0 0 0 14px #1b140e, inset 0 0 90px rgba(0,0,0,.7), 0 30px 90px rgba(0,0,0,.95); }
#note .paper[data-src="beob"]::before { display: none; }
#note .paper[data-src="beob"] h2 { font-family: var(--f-ui-sc); font-size: 12px; letter-spacing: .4em; color: rgba(230,227,216,.55); border-bottom: 1px solid rgba(230,227,216,.15); box-shadow: none; }
#note .paper[data-src="beob"] .hand, #note .paper[data-src="beob"] .ob-kreide { font-family: var(--f-kreide); font-size: 34px; line-height: 1.3; color: #f1eee4; letter-spacing: .04em; transform: rotate(-1.8deg);
  text-shadow: 0 0 1px rgba(255,255,255,.65), 0 0 6px rgba(255,255,255,.12); -webkit-mask-image: url("${P.kreide}"); -webkit-mask-size: 64px 64px; }
#note .paper[data-src="postit"] { width: min(400px, 80vw); color: #2a2418; background: ${u('postit')} center / cover, #e9d77a; box-shadow: 0 2px 2px rgba(0,0,0,.25), 0 22px 50px rgba(0,0,0,.85); transform: rotate(1.6deg); }
#note .paper[data-src="handy"] { font-family: var(--f-ui); font-size: 18px; color: #dfe6ee; background: radial-gradient(120% 70% at 30% 0%, rgba(120,150,190,.18), transparent 60%), linear-gradient(180deg, #121821, #070a0f);
  border-radius: 26px; box-shadow: inset 0 0 0 2px #2b313a, inset 0 0 0 9px #05070a, 0 30px 90px #000; }
#note .paper[data-src="handy"]::before { display: none; }
#note .paper[data-src="handy"] h2 { font-family: var(--f-ui-sc); font-size: 13px; letter-spacing: .3em; color: #8fa3bb; border-bottom: 1px solid rgba(143,163,187,.2); box-shadow: none; }
#note .paper[data-src="handy"] .hand { font-family: var(--f-ui); font-size: 19px; color: #eef3f8; transform: none; background: rgba(60,90,130,.35); border-radius: 14px; padding: 6px 12px; }
#note .paper .ob-stempel { position: absolute; right: 46px; top: 74px; padding: 6px 12px 4px; font: 700 15px/1.1 var(--f-akte); letter-spacing: .22em; color: rgba(150,28,36,.78); border: 3px double rgba(150,28,36,.72); border-radius: 3px;
  transform: rotate(-11deg); mix-blend-mode: multiply; pointer-events: none; -webkit-mask-image: url("${P.tinte}"); -webkit-mask-size: 180px 180px; text-align: center; }
#note .paper .ob-stempel small { display: block; font-size: 9px; letter-spacing: .3em; margin-top: 2px; }
`;
}

// ---------------------------------------------------------------- Einbindung
WORLD_MODS.push(['Oberfläche', async () => {
  const R = Math.random, warm = { dunkel: [95, 66, 30], hell: [255, 249, 232] };
  OB.pap.brief = ob_papier({ base: '#dcd1b5', ...warm, wolke: .28, fasern: 3200, stock: 70, wasser: 1, ring: true, falz: [.34, .67], korn: 9, rand: 'rgba(120,80,35,.38)' });
  OB.pap.brief2 = ob_papier({ base: '#d8ccad', ...warm, wolke: .32, fasern: 3200, stock: 110, wasser: 2, ring: false, falz: [.5], vfalz: .5, korn: 10, rand: 'rgba(110,72,30,.45)' });
  OB.pap.amt = ob_papier({ base: '#e4e0d4', dunkel: [70, 66, 58], hell: [255, 255, 250], wolke: .18, fasern: 1800, stock: 18, wasser: 1, ring: R() < .5, falz: [.33], korn: 7, rand: 'rgba(90,80,60,.28)', loch: true });
  OB.pap.druck = ob_papier({ base: '#d2cab3', dunkel: [60, 55, 45], hell: [245, 240, 225], wolke: .3, fasern: 2400, stock: 40, wasser: 1, falz: [.5], korn: 16, rand: 'rgba(100,80,45,.42)' });
  OB.pap.heft = ob_papier({ base: '#ebe8de', dunkel: [90, 85, 75], hell: [255, 255, 252], wolke: .14, fasern: 1500, stock: 8, wasser: 0, falz: [], korn: 6, rand: 'rgba(110,100,80,.22)' });
  OB.pap.tafel = ob_papier({ base: '#232825', dunkel: [8, 10, 9], hell: [200, 205, 195], wolke: .22, wisch: 34, fasern: 0, korn: 10, rand: 'rgba(0,0,0,.55)' });
  OB.pap.postit = ob_papier({ base: '#e8d575', dunkel: [120, 100, 30], hell: [255, 250, 200], wolke: .16, fasern: 900, stock: 4, korn: 6, rand: 'rgba(130,100,20,.25)' });
  OB.pap.tinte = ob_tinte(); OB.pap.kreide = ob_kreide();
  OB.stil = document.createElement('style'); OB.stil.id = 'obStil'; OB.stil.textContent = ob_css(); document.head.appendChild(OB.stil);
  try { ob_regenStart(); } catch (e) { console.warn('Oberfläche: Regen', e); }
  try { await Promise.race([Promise.all(['IM Fell English SC', 'IM Fell English', 'Alegreya Sans', 'Alegreya Sans SC', 'Kalam', 'Gochi Hand', 'Covered By Your Grace', 'Courier Prime', 'Julius Sans One', 'Caveat', 'Special Elite'].map(f => document.fonts.load(`20px "${f}"`, 'Äß'))), wait(3000)]); } catch (e) {} // Schriften vorab laden (kein Umspringen beim ersten Zettel)
}]);
// Notizen: Quelle bestimmen, Papier/Schrift wählen, Stempel und Lukes Randnotizen kennzeichnen (Inhalt bleibt unverändert)
showNote = (o => function (title, html) { const r = o.apply(this, arguments);
  try { const p = document.querySelector('#note .paper'); if (p) { const src = ob_quelle(trX(title), html); p.dataset.src = src; let h = 0; for (const ch of String(title)) h = (h * 31 + ch.charCodeAt(0)) | 0; p.dataset.v = String(Math.abs(h) % 2);
      p.querySelectorAll('i').forEach(i => { const t = i.textContent.trim(); if (/^fibel:?$/i.test(t)) { i.classList.add('ob-fibel'); i.textContent = 'Fibel'; const n = i.nextElementSibling; if (n && n.classList.contains('hand')) n.classList.add('luke'); }
        else if (/^handschriftlich:?$/i.test(t)) { const n = i.nextElementSibling; if (n && n.classList.contains('hand')) n.classList.add('ob-hs'); } });
      if (src === 'amt') { const s = document.createElement('div'); s.className = 'ob-stempel'; s.innerHTML = /akte/i.test(title) ? 'VERSCHLUSSSACHE' : 'EINGANG<small>— · — · ——</small>'; p.appendChild(s); } } } catch (e) { console.warn('Oberfläche: Notiz', e); }
  return r; })(showNote);
// Untertitel: fremde Stimmen in fremder Schrift
subShow = (o => function (t, ms, who) { const r = o.apply(this, arguments); // an subShow: färbt erst, wenn der Text wirklich erscheint (Lese-Warteschlange der Basis)
  try { const el = document.getElementById('subtitle'), w = String(who || '').toUpperCase(); if (el) el.dataset.ob = /WEISS|LICHTSCHIFF|∴|BEOBACHTER|NIMMER|DAS FREMDE/.test(w) ? 'fremd' : /KIND|LUNA|LUCY/.test(w) ? 'kind' : ''; } catch (e) {}
  return r; })(subShow);
// Gedanke oder laut gesprochen? Gedanken stehen als <i>…</i> (Quelle: Gedankenmodul und Skripte); alles andere von Luke ist gesprochen. Zeilen ohne Namen sind Erzähltext.
subShow = (o => function (t, ms, who) { const r = o.apply(this, arguments);
  try { const el = document.getElementById('subtitle'), w = String(who || '').toUpperCase(), luke = w === 'LUKE' || w === 'DU', gedanke = luke && /^\s*<i>/.test(String(t));
    el.classList.toggle('thought', gedanke); el.dataset.art = !who ? 'erz' : ''; const wh = el.querySelector('.who'); if (wh && luke) wh.textContent = gedanke ? 'LUKE · GEDANKE' : 'LUKE'; } catch (e) {}
  return r; })(subShow);
// Textführung (Nutzer 08.10.: „oft weiß man nicht, wo man hingucken soll“). EINE Spur für Rede, Gedanken und Erzähltext: #subtitle unten Mitte (Warteschlange der Basis).
// Hinweise (toast) und neue-Aufgabe-Meldungen (questPop) kommen nie gleichzeitig mit einer Dialogzeile: sie warten, bis die Spur ruhig ist (kurze Warteschlange),
// ein später einsetzender Untertitel blendet einen eben erst gezeigten Hinweis aus und stellt ihn hinten an. Kino-Endkarte ersetzt den Untertitel.
const OBT = { q: [], h: null, toastAn: 0 };
const obt_ruhig = () => { const s = document.getElementById('subtitle'); return !(s && parseFloat(s.style.opacity) > .05) && !subQ.length; }; // Spur frei? (auch von anderen Modulen nutzbar)
function obt_poll() { if (OBT.h) return; OBT.h = setTimeout(() => { OBT.h = null; const n = performance.now(); OBT.q = OBT.q.filter(a => n - a.t < 25000);
  if (!OBT.q.length) return; if (!obt_ruhig() || (typeof ui !== 'undefined' && ui.paused)) return obt_poll();
  const tt = document.getElementById('toast'), a = OBT.q[0]; if (a.k === 'toast' && tt && parseFloat(tt.style.opacity) > .05) return obt_poll(); OBT.q.shift();
  if (a.k === 'toast') toast(a.a[0], a.a[1]); else questPop(a.a[0], a.a[1]); if (OBT.q.length) obt_poll(); }, 450); }
toast = (o => function (t, ms) { if (!obt_ruhig()) { if (!OBT.q.some(a => a.k === 'toast' && a.a[0] === t)) { OBT.q.push({ k: 'toast', a: [t, ms], t: performance.now() }); if (OBT.q.length > 4) OBT.q.shift(); } obt_poll(); return; }
  OBT.toastAn = performance.now(); OBT.toastT = t; OBT.toastMs = ms; return o.apply(this, arguments); })(toast);
questPop = (o => function (kind, text) { if (!obt_ruhig()) { OBT.q.push({ k: 'quest', a: [kind, text], t: performance.now() }); if (OBT.q.length > 4) OBT.q.shift(); obt_poll(); return; } return o.apply(this, arguments); })(questPop);
subShow = (o => function (t, ms, who) { try { const tt = document.getElementById('toast');
    if (tt && parseFloat(tt.style.opacity) > .05) { tt.style.opacity = 0; clearTimeout(toastT); if (performance.now() - OBT.toastAn < 2500 && OBT.toastT) { OBT.q.unshift({ k: 'toast', a: [OBT.toastT, OBT.toastMs], t: performance.now() }); obt_poll(); } } } catch (e) {}
  return o.apply(this, arguments); })(subShow);
window.__obt = { quest: (k, t) => questPop(k, t), karte: () => hl_karte(), q: () => OBT.q.length, ruhig: () => obt_ruhig() }; // Testzugriff
