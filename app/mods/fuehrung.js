// =====================================================================  FÜHRUNG (Modul „fuehrung“, Nutzer 10.10./12.10.2026): man weiß jederzeit, wo man ist, in welcher Phase der Story, was zu tun ist und wer spricht
// Konzept: docs/gameplay/fuehrung_story.md · Texte: docs/gameplay/fuehrung_texte.json → app/mods/fuehrung_daten.js (node app/tools/fuehrung_daten.mjs)
// Bausteine (alles ohne Kanonänderung, nur Anzeige):
//  · Zielzeilen: genau eine Stelle – #objText.textContent (alle Setter der Kapitel schreiben dort hinein) – ersetzt Bestandstexte durch die überarbeiteten Zeilen (FS_D.zl)
//  · Warum/Faden: neue Einträge vorn in ZIELE_WARUM / GEDANKEN_FADEN, tote/verdeckte/zu breite Bestandseinträge bereinigt (selftest: jede Zielzeile hat Warum oder ist Takt)
//  · Phasenanzeige: Zeile „KAPITEL 3 · 4 VON 6 · DIE LATERNEN“ über der Zielzeile, in der Fibel („Was jetzt?“) und im Pause-Menü (Phase springt nur vorwärts)
//  · Kapitelkarten: Ort · Zeit · Bisher · Ziel (Tafeln K3–K6 über #intro; K1/K2 als Karte, ≤ 6 s, Klick/Enter/X weg)
//  · Ortsmarken: 35 Orte, einmal je Ort und Spielstand, 3 s unten links
//  · Sprecher: Anzeigename ≠ Stimmen-Schlüssel (Tabelle FS_ANZEIGE, nur der sichtbare .who-Text; die Aufnahme bleibt am alten Namen)
// Testzugriff: __fuehrung (S, phase, selftest, karte, ort)
const FS = { ph: {}, om: new Set(), cp: new Set(), k: 0, kT: 0, say: 0, card: null, cardT: 0, omQ: [], omT: 0, omAn: 0, ready: false, pT: 0, k1: false, alias: new Map(), test: false };
MOD_SAVE.push(['fuehrung', () => ({ ph: FS.ph, om: [...FS.om], say: FS.say, k1: FS.k1 }),
  v => { if (!v || typeof v !== 'object') return; if (v.ph) Object.assign(FS.ph, v.ph); (v.om || []).forEach(x => FS.om.add(x)); FS.say = v.say || 0; FS.k1 = !!v.k1; }]);
const fs_norm = t => String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
const fs_esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function fs_kap() { try { return typeof kap === 'function' ? kap() : typeof curChapter === 'function' ? curChapter() : 1; } catch (e) { return 1; } }
function fs_dist(x, z) { return Math.hypot(player.pos.x - x, player.pos.z - z); }
function fs_hilfe() { try { return typeof settings !== 'undefined' && settings.hilfe === 0 ? 0 : 1; } catch (e) { return 1; } }

// ---------------------------------------------------------------- Zielzeilen (eine Stelle: #objText)
function fs_aliasBauen() {
  for (const z of FS_D.zl) { if (!z.alt || /^\(/.test(z.alt)) continue; for (const v of z.alt.split(' | ')) { const s = fs_norm(v); if (s && !/…$/.test(s) && !/^…/.test(s)) FS.alias.set(s, z.text); } }
  // Fassungen, die zur Laufzeit zusammengesetzt werden (Bestand in kapitel1/lucy3/kapitel3 – drei Fassungen der Laternen-Zeile, K-10)
  if (typeof KAPITEL3_ZIEL_LATERNEN === 'string') FS.alias.set(fs_norm(KAPITEL3_ZIEL_LATERNEN), FS_D.zl.find(z => z.id === 'FS-3-ZL-04').text);
}
function fs_zielAlias(t) {
  const n = fs_norm(t); if (!n) return t; const a = FS.alias.get(n); if (a) return a;
  // K4: bis Lucy bei Vegas besucht wurde, ist „Sieh nach Lucy“ das Ziel (FS-4-ZL-00), nicht die Villa
  try { if (fs_kap() === 4 && /^Die Villa Seiler\. (Dir fehlen noch|Sieh dich um)/.test(n) && typeof villa_S !== 'undefined' && villa_S.uk < 2) return FS_D.zl.find(z => z.id === 'FS-4-ZL-00').text; } catch (e) {}
  return t;
}
function fs_zielHaken() {
  const el = document.getElementById('objText'); if (!el || el.__fs) return; el.__fs = 1;
  const d = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
  Object.defineProperty(el, 'textContent', { configurable: true, get() { return d.get.call(this); }, set(v) { d.set.call(this, fs_zielAlias(v)); } });
  el.textContent = d.get.call(el);   // schon gesetzten Text (Spielstart) nachträglich übersetzen
}
function fs_hilfeBereinigen() {
  // Warum: neue Einträge vor die alten (erster Treffer gewinnt); Bestand K-12 („laufen alle zu Hilde Wendt“) bleibt dadurch unwirksam
  try { for (const w of FS_D.wa.slice().reverse()) ZIELE_WARUM.unshift([new RegExp(w.rx), w.text]); } catch (e) { console.warn('Führung: Warum', e); }
  try {
    const G = GEDANKEN_FADEN, kill = [/^\/Das Tastenfeld will vier Ziffern\//, /Die Ordnungstafel im Archiv/, /Luke\|Leiter/];   // K-04 verdeckt, K-06 Doppelung, K-07 zu breit
    for (const [re] of G.slice()) { const s = re.toString(); if (kill.some(k => k.test(s) || s.includes(k.source))) { const i = G.findIndex(x => x[0] === re); if (i >= 0) G.splice(i, 1); } }
    for (const f of FS_D.gf.slice().reverse()) G.unshift([new RegExp(f.rx), f.text]);
    // letzte Allzweck-Antwort bleibt am Ende (für Takt-Zeilen)
    const i = G.findIndex(x => x[0].toString() === '/./'); if (i >= 0 && i !== G.length - 1) G.push(G.splice(i, 1)[0]);
  } catch (e) { console.warn('Führung: Faden', e); }
}
// Selbsttest: jede Zielzeile (neu) hat einen Warum-Eintrag oder einen Faden mit eigenem Text, ausgenommen kurze Takt-Zeilen
function fs_selftest() {
  const R = { zeilen: 0, ohneWarum: [], ohneFaden: [], allzweck: [], lang: [] };
  const taktRe = typeof ZIELE_TAKT !== 'undefined' ? ZIELE_TAKT : /^$/;
  for (const z of FS_D.zl) { R.zeilen++; if (z.text.length > 90) R.lang.push(z.id);
    const takt = taktRe.test(z.text) || z.text.length < 14;
    const w = ZIELE_WARUM.find(([re]) => re.test(z.text)), f = GEDANKEN_FADEN.find(([re]) => re.test(z.text));
    if (!w && !takt) R.ohneWarum.push(z.id + ' ' + z.text.slice(0, 40));
    if (f && f[0].toString() === '/./' && !takt) R.allzweck.push(z.id + ' ' + z.text.slice(0, 40)); if (!f && !takt) R.ohneFaden.push(z.id); }
  return R;
}

// ---------------------------------------------------------------- Phasen (springen nur vorwärts)
function fs_phase(k) {
  const P = player.pos; let p = 1;
  try {
    if (k === 1) { const m = story.main; p = m <= 1 ? 1 : m === 2 ? 2 : m === 3 ? 3 : m <= 5 ? 4 : m === 6 ? 5 : m === 7 ? 6 : 7; if (state.inBasement && m >= 3) p = Math.max(p, 4); }
    else if (k === 2 && typeof C2 !== 'undefined') { const dx = P.x - C2.x; if (dx > 18.5) p = 2; if (typeof ch2 !== 'undefined' && ch2.fuseKey) p = 3; if (FS.cp.has('pruef')) p = Math.max(p, 4); if (FS.cp.has('gang') || FS.cp.has('flucht')) p = Math.max(p, 5);
      if (FS.cp.has('flucht') && dx > 85) p = 6; if (FS.cp.has('messraum') || dx > 107.2) p = Math.max(p, 7); if (typeof uebergang3_S !== 'undefined' && uebergang3_S.phase) p = 8; }
    else if (k === 3) { const u = typeof kapitel3_S !== 'undefined' ? kapitel3_S.uk : 0; p = u <= 3 ? 1 : u <= 5 ? 2 : u <= 7 ? 3 : u <= 10 ? 4 : u <= 13 ? 5 : 6;
      if (typeof ch3 !== 'undefined') { if (ch3.met) p = Math.max(p, 2); if (ch3.radio || ch3.funk) p = Math.max(p, 3); if (ch3.part === 'white') p = Math.max(p, 5); if (typeof weiss_S !== 'undefined' && weiss_S.phase === 'abgrund') p = 6; } }
    else if (k === 4) { const u = typeof villa_S !== 'undefined' ? villa_S.uk : 0; p = u <= 2 ? 1 : u <= 4 ? 2 : u === 5 ? 3 : u <= 9 ? 4 : u <= 12 ? 5 : 6;
      if (typeof anwesen_count === 'function' && anwesen_count() > 0 && p < 3) p = 3; if (u >= 6) p = Math.max(p, 4); if (FS.cp.has('k4_keller') || FS.cp.has('k4_kasten') || FS.cp.has('k4_zelle')) p = Math.max(p, 5); if (FS.cp.has('k4_og') || FS.cp.has('k4_halle2') || FS.cp.has('k4_portraet')) p = 6; }
    else if (k === 5 && typeof k5 !== 'undefined') { const b = k5.beat, T = { veranda: 1, kamera: 1, foto1: 1, licht: 1, tuer: 2, tisch: 2, schleife: 2, foto2: 2, heimweg: 3, lucy: 3, anruf: 3, anrufLaeuft: 3, brot: 4, stall: 4, augenauf: 4, tappen: 5, zaun: 5, grab: 6, ende: 6 }; p = T[b] || 1; }
    else if (k === 6 && typeof K6 !== 'undefined') { const b = K6.beat, T = { zaun: 1, krumen: 2, huette: 3, faden: 4, hochsitz: 4, frass: 4, falle: 4, wrack: 5, bau: 5, oben: 6, epilog: 6, ende: 6 }; p = T[b] || 1; }
  } catch (e) {}
  return p;
}
function fs_phaseText(k = fs_kap()) { const L = FS_D.phase[k]; if (!L) return ''; const p = Math.min(L.length, Math.max(1, FS.ph[k] || 1)); return `KAPITEL ${k} · ${p} VON ${L.length} · ${L[p - 1]}`; }
function fuehrung_phaseText() { return fs_phaseText(); }
function fuehrung_bisherHtml(k = fs_kap()) { const L = FS_D.bisher[k]; if (!L || k < 2) return ''; return '<section class="zlBisher"><small>BISHER</small>' + L.map(l => `<p>${fs_esc(l)}</p>`).join('') + '</section>'; }

// ---------------------------------------------------------------- Karten (Kapitelanfang)
function fs_kartenEl() { if (FS.el) return FS.el; const el = document.createElement('div'); el.id = 'fsKarte'; el.innerHTML = '<div class="k"></div>'; (document.getElementById('hud') || document.body).appendChild(el); return FS.el = el; }
function fs_karte(k, o = {}) {
  const K = FS_D.kk[k]; if (!K) return false; const el = fs_kartenEl(), B = FS_D.bisher[k] || [];
  el.querySelector('.k').innerHTML = `<small>${fs_esc(K.kopf)}</small><b>${fs_esc(K.ortzeit)}</b>` + (o.bisher !== false && B.length ? '<div class="bi">' + B.map(l => `<i>${fs_esc(l)}</i>`).join('') + '</div>' : '') + `<em>ZIEL: ${fs_esc(K.ziel)}</em><u>ENTER · KLICK · X – WEITER</u>`;
  el.classList.add('an'); FS.card = k; FS.cardT = performance.now() + (o.ms || 6000); return true;
}
function fuehrung_kartenWeg() { if (!FS.card) return false; fs_kartenEl().classList.remove('an'); FS.card = null; return true; }
function fs_introUmbauen() {   // Tafeln K3–K6 (und K2 per Menü): Ort · Zeit unter den Titel, Bisher (K2/K3), Ziel ans Ende
  const I = document.getElementById('intro'); if (!I) return;
  new MutationObserver(() => { if (I.dataset.fs === '1') return; const P = [...I.querySelectorAll('p')]; if (!P.length) return;
    const t = P.find(p => /^KAPITEL \d/.test(p.textContent.trim())); if (!t) return; const k = +(t.textContent.match(/^KAPITEL (\d)/) || [])[1], K = FS_D.kk[k]; if (!K) return;
    I.dataset.fs = '1'; const mk = (html, css) => { const p = document.createElement('p'); p.className = 'on'; p.style.cssText = css; p.innerHTML = html; return p; };
    const ort = mk('<i>' + fs_esc(K.ortzeit) + '</i>', 'font-family:Georgia;font-size:14px;letter-spacing:.14em;color:#b9ab8c;margin:-10px 0 18px'); t.after(ort);
    if ((k === 2 || k === 3) && !P.some(p => /^(BISHER|WAS BISHER)/.test(p.textContent.trim()))) { const B = FS_D.bisher[k] || [];
      let last = ort; for (const l of B) { const p = mk('<i>' + fs_esc(l) + '</i>', 'font-size:.78em;opacity:.82'); last.after(p); last = p; } last.after(mk('', 'height:14px;margin:0')); }
    I.appendChild(mk('ZIEL: ' + fs_esc(K.ziel), 'font-family:Georgia;font-size:15px;letter-spacing:.06em;color:#c9a36a;margin-top:26px')); }).observe(I, { childList: true });
  // jede neue Tafel darf wieder umgebaut werden
  const iS = document.getElementById('introSeq'); if (iS) new MutationObserver(() => { if (!iS.classList.contains('show')) I.dataset.fs = ''; }).observe(iS, { attributes: true, attributeFilter: ['class'] });
}

// ---------------------------------------------------------------- Ortsmarken
const fs_P = () => player.pos;
const fs_c2 = () => { try { return typeof C2 !== 'undefined' && fs_kap() === 2 ? { dx: fs_P().x - C2.x, dz: fs_P().z - C2.z } : null; } catch (e) { return null; } };
function fs_in7() { try { const r = typeof indoorRect === 'function' ? indoorRect() : null; return !!r && typeof s7 !== 'undefined' && r.x0 === s7.x0 && r.zb === s7.zb; } catch (e) { return false; } }
const FS_TRIG = {
  'FS-1-OM-01': () => FS.k1 && fs_dist(-66, 2) > 4 && !state.inBasement,
  'FS-1-OM-02': () => fs_in7() && !state.inBasement,
  'FS-1-OM-03': () => state.inBasement && state.zone !== 'canal',
  'FS-1-OM-04': () => fs_dist(4, 0) < 9 && !state.inBasement,
  'FS-2-OM-05': () => { const c = fs_c2(); return !!c && c.dx > .4 && c.dx < 17; },
  'FS-2-OM-06': () => { const c = fs_c2(); return !!c && c.dx > 18.5; },
  'FS-2-OM-07': () => { try { return typeof z7_in === 'function' && z7_in(0) && fs_kap() === 2; } catch (e) { return false; } },
  'FS-2-OM-08': () => { const c = fs_c2(); return !!c && c.dx > 30 && c.dx < 36.4 && c.dz > 1.5 && c.dz < 8; },
  'FS-2-OM-09': () => fs_kap() === 2 && FS.cp.has('pruef'),
  'FS-2-OM-10': () => fs_kap() === 2 && (FS.cp.has('gang') || FS.cp.has('flucht')),
  'FS-2-OM-11': () => { const c = fs_c2(); return !!c && c.dx > 107.2; },
  'FS-3-OM-12': () => fs_kap() === 3 && FS.kT > 3,
  'FS-3-OM-13': () => { try { return fs_kap() === 3 && kapitel3_S.uk >= 4 && ch3.part === 'town'; } catch (e) { return false; } },
  'FS-3-OM-14': () => { try { return ch3.part === 'white' && !ch3.room1; } catch (e) { return false; } },
  'FS-3-OM-15': () => { try { return ch3.part === 'white' && ch3.room1 && !ch3.room2 && fs_P().x > X3 + 20; } catch (e) { return false; } },
  'FS-3-OM-16': () => { try { return ch3.part === 'white' && ch3.room2 && fs_P().x > X3 + 29.5; } catch (e) { return false; } },
  'FS-3-OM-17': () => { try { return weiss_S.phase === 'abgrund'; } catch (e) { return false; } },
  'FS-4-OM-18': () => fs_kap() === 4 && FS.kT > 3,
  'FS-4-OM-19': () => fs_kap() === 4 && fs_dist(-27.2, -10.6) < 5 && !state.inBasement,
  'FS-4-OM-20': () => fs_kap() === 4 && FS.cp.has('k4_nr9'),
  'FS-4-OM-21': () => fs_kap() === 4 && fs_P().x < -800 && !FS.cp.has('villa_halle'),
  'FS-4-OM-22': () => fs_kap() === 4 && FS.cp.has('villa_halle'),
  'FS-4-OM-23': () => fs_kap() === 4 && (FS.cp.has('k4_keller') || FS.cp.has('k4_kasten') || FS.cp.has('k4_zelle')),
  'FS-5-OM-24': () => fs_kap() === 5 && FS.kT > 3,
  'FS-5-OM-25': () => { try { return fs_kap() === 5 && typeof k5_in1 === 'function' && k5_in1(); } catch (e) { return false; } },
  'FS-5-OM-26': () => { try { return fs_kap() === 5 && fs_dist(-53.2, -19.4) < 4; } catch (e) { return false; } },
  'FS-5-OM-27': () => fs_kap() === 5 && fs_dist(-135.6, -30.1) < 9,
  'FS-5-OM-28': () => fs_kap() === 5 && fs_dist(-52.5, 64.6) < 9,
  'FS-6-OM-29': () => fs_kap() === 6 && FS.kT > 3,
  'FS-6-OM-30': () => { try { return fs_kap() === 6 && typeof wald_in === 'function' && wald_in(fs_P().x, fs_P().z) && !(typeof tief_in === 'function' && tief_in(fs_P().x, fs_P().z)); } catch (e) { return false; } },
  'FS-6-OM-31': () => fs_kap() === 6 && FS.cp.has('k6_huette'),
  'FS-6-OM-32': () => fs_kap() === 6 && FS.cp.has('k6_hochsitz'),
  'FS-6-OM-33': () => fs_kap() === 6 && FS.cp.has('k6_bus'),
  'FS-6-OM-34': () => { try { return fs_kap() === 6 && typeof K6 !== 'undefined' && K6.beat === 'frass'; } catch (e) { return false; } },
  'FS-6-OM-35': () => fs_kap() === 6 && FS.cp.has('k6_wrack'),
};
function fs_omZeigen(o) {
  FS.om.add(o.id); let el = FS.omEl; if (!el) { el = FS.omEl = document.createElement('div'); el.id = 'fsOrt'; (document.getElementById('hud') || document.body).appendChild(el); }
  el.innerHTML = `<b>${fs_esc(o.z1)}</b>` + (o.z2 ? `<span>${fs_esc(o.z2)}</span>` : ''); el.classList.add('an'); FS.omAn = performance.now() + 3200;
  try { if (typeof ziele_ton === 'function') ziele_ton('ui_stift', .18); } catch (e) {}
}
function fs_omRuhig() {
  try { if (!state.started || (typeof menu !== 'undefined' && menu.attract) || state.talking || ui.overlay || ui.paused || FS.card) return false;
    if (typeof hunt !== 'undefined' && hunt.on) return false; if (typeof kino_S !== 'undefined' && kino_S.on) return false;
    if (typeof ziele_stress === 'function' && ziele_stress()) return false; if (document.getElementById('introSeq').classList.contains('show')) return false;
  } catch (e) { return false; } return true;
}

// ---------------------------------------------------------------- Sprecher: Anzeigename ≠ Stimmen-Schlüssel
// Anzeige nur sichtbar ändern; stimmen.js bekommt weiter den alten Namen (st_finde: unbekannter Sprecher → stumm).
// Das Kind: bis Justin den Namen sagt (ab Kap. 3, UK 8) „KINDERSTIMME“, danach „LUNA“; am Telefon „STIMME AM TELEFON“ (FS-ALLE-SP-02/13/14, K-16).
function fs_kindName() { try { return (fs_kap() >= 4 || (fs_kap() === 3 && kapitel3_S.uk >= 8)) ? 'LUNA' : 'KINDERSTIMME'; } catch (e) { return 'KINDERSTIMME'; } }
const FS_ANZEIGE = [
  [/^(KÜHN · MAILBOX|MAILBOX · KÜHN)$/i, 'MAILBOX · KÜHN'], [/^LUCYS STIMME$/i, 'TONBAND · LUCY'],
  [/^DAS KIND$/i, () => (typeof ST !== 'undefined' && ST.telefon) ? 'STIMME AM TELEFON' : fs_kindName()], [/^KINDERSTIMME$/i, () => fs_kindName()],
  [/^ANRUF$/i, 'STIMME AM TELEFON'], [/^(HILDE|FRAU WENDT)$/i, 'HILDE WENDT'], [/^(LARS VEGAS|HERR VEGAS)$/i, 'VEGAS'], [/^(LARS VEGAS · HINTER DER TÜR|HERR VEGAS · HINTER DER TÜR)$/i, 'VEGAS · HINTER DER TÜR'],
];
function fuehrung_anzeige(who) { const w = String(who || '').trim(); if (!w) return null; for (const [re, neu] of FS_ANZEIGE) if (re.test(w)) { const n = typeof neu === 'function' ? neu() : neu; return n === w ? null : n; } return null; }

// ---------------------------------------------------------------- Takt
function fs_tick(dt) {
  if (!FS.ready || !state.started || (typeof menu !== 'undefined' && menu.attract)) return;
  const k = fs_kap(); if (k !== FS.k) { FS.k = k; FS.kT = 0; }
  const intro = document.getElementById('introSeq'); if (!(intro && intro.classList.contains('show'))) FS.kT += dt;
  FS.pT -= dt; if (FS.pT <= 0) { FS.pT = .5; const p = fs_phase(k); if (p > (FS.ph[k] || 1)) FS.ph[k] = p; else if (!FS.ph[k]) FS.ph[k] = 1;
    const el = document.getElementById('objPhase'); if (el) { const t = fs_phaseText(k); if (el.textContent !== t) el.textContent = t; }
    const pm = document.getElementById('fsPausePhase'); if (pm && ui.paused) pm.textContent = fs_phaseText(k);
    if (FS.card && performance.now() > FS.cardT) fuehrung_kartenWeg();
    if (FS.omAn && performance.now() > FS.omAn) { FS.omAn = 0; FS.omEl && FS.omEl.classList.remove('an'); }
    // Ortsmarken: höchstens eine je Zyklus, nie in Szenen
    if (fs_hilfe() && fs_omRuhig()) for (const o of FS_D.om) { if (o.k !== k || FS.om.has(o.id)) continue; let ok = false; try { ok = FS_TRIG[o.id] && FS_TRIG[o.id](); } catch (e) {} if (ok) { fs_omZeigen(o); break; } } }
}

// ---------------------------------------------------------------- Haken
function fs_haken() {
  // Speicherpunkte als Ortswechsel-/Phasen-Auslöser
  if (typeof todCheckpoint === 'function' && !todCheckpoint.__fs) { const o = todCheckpoint; todCheckpoint = function (id) { try { FS.cp.add(id); } catch (e) {} return o.apply(this, arguments); }; todCheckpoint.__fs = 1; }
  // Kapitelkarten K1/K2 im Spielfluss: die Fibel-Frage nach der Mailbox (K-14: vierte Tab-Nennung) wird zur Karte von Kapitel 1; „KAPITEL 2“ aus uebergang.js zur Karte von Kapitel 2
  if (typeof questPop === 'function' && !questPop.__fs) { const o = questPop; questPop = function (kind, text) {
      if (kind === 'ABENTEUERFIBEL' && /Taste Tab/.test(String(text))) { FS.k1 = true; fs_karte(1, { ms: 7000 }); return; }
      if (kind === 'KAPITEL 2' && /Das achte Kind/.test(String(text))) { fs_karte(2, { ms: 5200 }); return; }
      return o.apply(this, arguments); }; questPop.__fs = 1; }
  // Anzeigename der Sprecher
  if (typeof subShow === 'function') subShow = (o => function (t, ms, who) { const r = o.apply(this, arguments); try { const n = fuehrung_anzeige(who); if (n) { const wh = document.querySelector('#subtitle .who'); if (wh && !/LUKE|DU/.test(String(who))) wh.textContent = n; } } catch (e) {} return r; })(subShow);
  // Bisher K4–K6 in den kürzeren Fassungen aus der Führung (nur Wortlaut, V-8 unverändert im Aufbau)
  try { for (const k of [4, 5, 6]) if (typeof RECAP !== 'undefined' && RECAP[k] && FS_D.bisher[k]) RECAP[k] = ['BISHER', ...FS_D.bisher[k]]; } catch (e) {}
}

// ---------------------------------------------------------------- Aussehen
(function fs_css() { const st = document.createElement('style'); st.id = 'fsCss'; st.textContent = `
#objPhase { font: 600 11px var(--f-ui-sc, Georgia, serif); letter-spacing: .34em; color: #b99a63; margin: 2px 0 7px; text-shadow: 0 0 6px #000; text-transform: uppercase; }
#objPhase:empty { display: none; }
#fsKarte { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: radial-gradient(closest-side, rgba(0,0,0,.78), rgba(0,0,0,.6) 60%, rgba(0,0,0,.28)); opacity: 0; transition: opacity .7s ease; pointer-events: none; z-index: 7; }
#fsKarte.an { opacity: 1; }
#fsKarte .k { text-align: center; max-width: min(980px, 86vw); font-family: var(--f-buch, "Cormorant Garamond", Georgia, serif); color: #eadfc8; text-shadow: 0 1px 2px #000, 0 0 14px #000; }
#fsKarte small { display: block; font: 600 clamp(14px, 1.05vw, 20px) var(--f-ui-sc, Georgia, serif); letter-spacing: .42em; color: #c9a36a; margin-bottom: 14px; }
#fsKarte b { display: block; font-weight: 500; font-size: clamp(23px, 1.75vw, 36px); letter-spacing: .06em; margin-bottom: 18px; color: #d6c8a8; }
#fsKarte .bi { margin: 4px 0 20px; } #fsKarte .bi i { display: block; font-size: clamp(18px, 1.3vw, 26px); opacity: .82; line-height: 1.5; }
#fsKarte em { display: block; font: 600 clamp(16px, 1.15vw, 23px) var(--f-ui-sc, Georgia, serif); letter-spacing: .14em; color: #c9a36a; font-style: normal; margin-top: 8px; }
#fsKarte u { display: block; margin-top: 26px; text-decoration: none; font: 600 clamp(11px, .8vw, 15px) var(--f-ui-sc, Georgia, serif); letter-spacing: .36em; color: #7f7562; }
#fsOrt { position: absolute; left: 30px; bottom: 112px; opacity: 0; transition: opacity 1s ease; pointer-events: none; text-shadow: 0 0 3px #000, 0 0 12px #000; }
#fsOrt.an { opacity: 1; }
#fsOrt b { display: block; font: 600 clamp(17px, 1.2vw, 24px) var(--f-ui-sc, Georgia, serif); letter-spacing: .38em; color: #e0c38f; }
#fsOrt span { display: block; margin-top: 4px; font: italic clamp(18px, 1.3vw, 26px) var(--f-buch, "Cormorant Garamond", Georgia, serif); color: #cdbf9f; letter-spacing: .04em; }
#fsPausePhase { margin-top: 6px; font: 600 12px Georgia, serif; letter-spacing: .3em; color: #b99a63; text-align: center; }
#jBody .zlBisher { margin: 0 0 14px; } #jBody .zlBisher small { display: block; font: 700 10px var(--f-ui-sc, Georgia, serif); letter-spacing: .38em; color: var(--pdim, #5a4a35); margin-bottom: 6px; }
#jBody .zlBisher p { margin: 0 0 4px; font: italic 16px/1.35 var(--f-buch, "Cormorant Garamond", Georgia, serif); opacity: .85; }
#jBody .zlPhase { font: 700 10px var(--f-ui-sc, Georgia, serif); letter-spacing: .3em; color: #7a5a3a; margin: 0 0 10px; }
`; document.head.appendChild(st); })();

WORLD_MODS.push(['Führung', async () => {
  fs_aliasBauen(); fs_zielHaken(); fs_hilfeBereinigen(); fs_haken(); fs_introUmbauen();
  const o = document.getElementById('objective'), l = o && o.querySelector('b'); if (o && !document.getElementById('objPhase')) { const p = document.createElement('div'); p.id = 'objPhase'; o.insertBefore(p, l ? l.nextSibling : o.firstChild); }
  const pt = document.querySelector('#pause .panel .t'); if (pt && !document.getElementById('fsPausePhase')) { const p = document.createElement('div'); p.id = 'fsPausePhase'; pt.after(p); }
  // Enter/Klick/X nehmen die Karte weg (wie Toasts)
  addEventListener('keydown', e => { if (!FS.card || e.repeat) return; if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'KeyX' || e.code === 'Escape') fuehrung_kartenWeg(); }, true);
  addEventListener('mousedown', e => { if (FS.card && e.button === 0 && document.pointerLockElement) fuehrung_kartenWeg(); }, true);
  FS.ready = true;
  window.__fuehrung = { S: FS, D: FS_D, faden: GEDANKEN_FADEN, warum: ZIELE_WARUM, phase: fs_phase, phaseText: fs_phaseText, selftest: fs_selftest, karte: fs_karte, weg: fuehrung_kartenWeg, ort: id => { const o = FS_D.om.find(x => x.id === id); if (o) fs_omZeigen(o); return !!o; }, alias: fs_zielAlias, trig: id => { try { return !!FS_TRIG[id](); } catch (e) { return null; } }, anzeige: fuehrung_anzeige };
}]);
WORLD_TICK.push(dt => { try { fs_tick(dt); } catch (e) { if (!FS.err) { FS.err = 1; console.warn('Führung: Takt', e); } } });
