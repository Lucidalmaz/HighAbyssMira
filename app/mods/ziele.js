// =====================================================================  ZIELE (Modul „ziele“, Nutzer-Rückmeldung R-17 vom 01.10.2026): Aufgaben, Ziel-Anzeige, „Was jetzt?“, Klänge
// Nutzer: „… ein gut verständliches und sinnvolles System, damit man immer weiß, was zu tun ist und nichts im Trubel des Schreckens übersieht oder vergisst“.
// Vorbilder: Resident Evil (Ziel kurz einblenden, Akten/Karte), Alan Wake 2 (Fallwand: was offen ist), The Last of Us II, Until Dawn (ruhig, diegetisch).
// Baut auf dem Vorhandenen auf, ersetzt nichts:
//   · questPop (Basis) bekommt Arten mit eigenem Aussehen und Klang: neben · fort · erledigt · verpasst · fund · fibel · karte · kapitel – erkannt am Kennwort.
//     Neue Nebenaufgabe/Fortsetzung/Erledigt zeigen darunter in Lukes Handschrift, worum es geht (Text der Aufgabe aus story.side).
//   · Warteschlange: Einblendungen überschreiben sich nie mehr; in Jagd, Kino, QTE, Sterben, bei offener Notiz/Fibel/Pause warten sie und kommen danach der Reihe nach.
//     Was während Jagd/Schreck eingesteckt wurde, kommt danach gesammelt: „DU HAST EINGESTECKT“ (+ Griff an die Jackentasche).
//   · Logbuch: jede Einblendung und jedes neue Ziel landet in der Fibel (Reiter „WAS JETZT?“, Abschnitt „Zuletzt notiert“) – Wegklicken kostet nichts.
//   · Ziel-Anzeige (#objective, alle Kapitel – setMain/setC2Objective/setC3/k5_task/k6_obj schreiben alle in #objText; hier per MutationObserver gelesen):
//     neues Ziel = „NEUES ZIEL“ + warum in Lukes Worten (ZIELE_WARUM), Bleistift schreibt die Zeile, Klang; danach blendet die Anzeige aus.
//     Wieder da: Taste Z (auch Y, deutsche Tastatur), nach Fibel/Notiz, nach Jagd/Schreck, nach dem Laden, nach längerem Stillstand.
//   · Einstellung „Hilfe“ (settings.hilfe): 0 aus · 1 sanft (Standard) · 2 deutlich. Stufe 1 = Lukes Gedanken bei Festhängen (gedanken.js, GEDANKEN_FADEN),
//     Stufe 2 = schneller + Richtung und Entfernung in der Ziel-Anzeige (nächster offener Story-Hinweis aus HINTS / Kartennadel).
//   · Klänge (nur Aufnahmen, app/tools/klang_ziele.py): Aufheben je Material (Audio.aufheben), Audio.paper → echtes Papier statt Rauschen,
//     Ziel/Neben/Fortsetzung/Erledigt/Verpasst/Fibel/Karte/Speicherpunkt (todCpShow).
// Schnittstelle: ziele_zeigen(sek, label) · ziele_fehl(titel, text) (gescheiterte/verpasste Aufgabe) · Audio.aufheben(material | Gegenstandsname)
//   · ziele_warum(regex, text) (eigene Begründung für ein Hauptziel nachtragen) · ziele_stress() · Testzugriff window.__ziele
const ZIELE = { zeig: 9, neu: 11, idle: 45, nach: 2.5, gap: 3.4 };
const ziele_S = { q: [], hold: [], popBis: 0, log: [], last: '', hideAt: 0, zeigeAn: false, pending: null, stressAn: false, frei: 0, freiSeit: 0, wasHeld: false,
  idleT: 0, idleZeig: false, px: 0, pz: 0, nachLaden: false, objT: 0, stuckT: 0, geladen: false, papT: null, papMute: 0, sperr: null, chimeAus: false, hinweise: 0, el: {}, lastAus: '' };
MOD_SAVE.push(['ziele', () => ({ log: ziele_S.log.slice(-60), hw: ziele_S.hinweise }), v => { if (v && Array.isArray(v.log)) ziele_S.log = v.log; if (v && v.hw) ziele_S.hinweise = v.hw; }]);
// ---------------------------------------------------------------- Warum (Lukes Stimme, 1–2 Sätze; nur wo das Ziel es nicht schon selbst sagt)
const ZIELE_WARUM = [
  [/^Finde Haus Nr\. 7/, 'Lucy ist weg, und die Kreidepfeile auf dem Asphalt laufen alle in eine Richtung: zu Hilde Wendt.'],
  [/Weg in Haus Nr\. 7/, 'Drinnen brennt Licht, aber keiner macht auf. Lucy hat früher immer was im Briefkasten versteckt.'],
  [/Durchsuche Haus Nr\. 7/, 'Der Schlüssel hing an Lucys Panda. Sie war hier. Irgendwas in diesem Haus weiß, wohin sie wollte.'],
  [/Öffne die Kellertür/, 'KELLER BLEIBT ZU, steht am Kühlschrank. Und die kleinen Fußspuren hören genau an dieser Tür auf.'],
  [/was Lucy hinterlassen hat/, 'Wenn Lucy hier unten war, hat sie was liegen lassen. Sie hat immer was liegen lassen.'],
  [/^Geh wieder nach oben/, 'Was auch immer da auf dem Band war: Hier unten bleib ich keine Sekunde länger als nötig.'],
  [/Versteck dich vor dem Licht/, 'Das Licht da draußen sucht jemanden. Unter der Erde findet es keinen. Hoffe ich.'],
  [/Wand mit den Zeichnungen klang hohl/, 'Wer malt Kinderbilder auf eine Wand, hinter der ein Gang ist?'],
  [/Folge dem Gang hinter der Wand|Hinter die Bilder/, 'Hilde hat „Lucy“ geschrien und auf die Wand gezeigt. Wenn Lucy irgendwo ist, dann da hinten.'],
  [/Sicherungsraum/, 'Ohne Strom bleibt die Stahltür zu. Und ohne die Tür komm ich hier nicht weiter.'],
  [/ZIMMER 7\. Finde das Zimmer/, 'Ein Schlüssel mit derselben Nummer wie Hildes Haus. An Zufälle glaub ich hier unten nicht mehr.'],
  [/Lies die achte Akte/, 'Sieben Kinder, sieben Akten. Und eine achte. Ich muss wissen, wer das ist.'],
  [/Finde heraus, was mit Lost Eyengless geschehen ist/, 'Die Uhren stehen auf 03:13, das ganze Dorf hält die Luft an. Und Lucy ist irgendwo da draußen.'],
  [/Funkkasten an der Kreuzung/, 'Hilde hat eine Frequenz in ihr Zählbuch geschrieben. Vielleicht redet da jemand, der mehr weiß als ich.'],
  [/Lösch die Laternen/, 'Die Laternen sind ihre Augen. Wenn ich sie richtig ausmache, sieht sie mich nicht kommen.'],
  [/Justin steht an der Kreuzung|^Zu Justin/, 'Der Mann in der Rüstung ist der Einzige hier, der keine Angst vor dem Licht hat.'],
  [/^Geh Justin nach/, 'Er kennt den Weg. Ich nicht.'],
  [/Villa Seiler\. (Schließ|Sieh)/, 'Was das Amt all die Jahre vertuscht hat, liegt in Seilers Villa. Irgendwo in diesen Räumen.'],
  [/Nr\. 1\. Wer deckt da den Tisch/, 'Nr. 1 ist unser Haus. Mamas Haus. Da wohnt keiner mehr, und trotzdem klappert Geschirr.'],
  [/Bring Lucy die Spieluhr/, 'Die Spieluhr hat sie früher immer runtergeholt. Vielleicht erinnert sie sich daran, wer sie ist.'],
  [/Hildes Kamera\. Nr\. 7/, 'Hilde hat die Sieben fotografiert. Wenn jemand wusste, worauf man das Ding richten muss, dann sie.'],
  [/Whiskey fliegt voraus/, 'Der Rabe hat mich schon oft beklaut. Verlaufen lassen hat er mich noch nie.'],
];
function ziele_warum(re, text) { ZIELE_WARUM.unshift([re, text]); }
// Kurze Takte (Warten, Rennen, QTE-Anweisungen) – still aktualisieren, keine Ankündigung
const ZIELE_TAKT = /^(Warten|Hinterher|Atmen|Durch die Tür|Lucy\.|LAUF|SCHÜTTEL|Raus hier|Weg hier|Klettern|Den Deckel|Die Leiter hinauf|Die Stablampe|Die Tür ist zu|Nimm Justins Hand|Der letzte Raum|Geh weiter\.)|E halten|Maus wild/;
// ---------------------------------------------------------------- Arten der Einblendungen
const ZIELE_ART = [['neben', /^(NEUE )?NEBENAUFGABE/], ['fort', /^FORTSETZUNG/], ['erledigt', /^(ERLEDIGT|ERFOLG|ALLE KERBEN|VEGAS HATTE RECHT)/], ['verpasst', /^(VERPASST|GESCHEITERT|ZU SPÄT)/],
  ['fund', /^(INVENTAR|AUSRÜSTUNG|GEFUNDEN|GLÄNZENDES|VON WHISKEY|SCHLÜSSELTEIL|JOKER|DU HAST EINGESTECKT)/], ['sammel', /^(LOSE SEITE|STUNDENBUCH|DER LATERNENBOTE|POLAROID|PELLS HEFT|ENTDECKER)/], ['kapitel', /^KAPITEL/], ['karte', /^KARTE/]];
const ZIELE_ARTNAME = { neben: 'Neue Nebenaufgabe', fort: 'Fortsetzung', erledigt: 'Erledigt', verpasst: 'Verpasst', fund: 'Eingesteckt', sammel: 'Sammlung', fibel: 'Fibel', speichern: 'Speicherpunkt', kapitel: 'Kapitel', karte: 'Karte', ziel: 'Neues Ziel' };
function ziele_art(kind) { const k = String(kind || '').toUpperCase(); for (const [a, re] of ZIELE_ART) if (re.test(k)) return a; return 'fibel'; }
// Material eines eingesteckten Gegenstands (aus dem Namen) → Aufheben-Klang
const ZIELE_MAT = [['batterie', /batterie|akku|stablampe|taschenlampe|lampe\b/i], ['schluessel', /schlüssel|schluessel|bund\b|schlüsselring|hufeisen/i],
  ['glanz', /glänz|glitzer|kronkorken|münze|euro|pfennig|messing|nadel|ring\b|plombe/i], ['glas', /flasche|glas\b|gläser/i],
  ['plastik', /kassette|tonband|kamera|funkgerät|handy|kuli|kugelschreiber|wartenummer|feuerzeug/i], ['stoff', /schuh|halsband|lampion|stoff|tuch|mütze|handschuh|wolle|socke|beutel/i],
  ['metall', /brech|stange|eisen|messer|schneider|sicherung|dose|thermos|leiter|glocke|werkzeug|zange|kette|blech/i], ['papier', /./]];
const ZIELE_KL = { papier: 3, metall: 3, glas: 2, stoff: 2, batterie: 2, schluessel: 3, plastik: 2, glanz: 2 };
const ZIELE_UI = ['ui_ziel_1', 'ui_ziel_2', 'ui_neben_1', 'ui_neben_2', 'ui_fort', 'ui_erledigt', 'ui_verpasst', 'ui_fibel_1', 'ui_fibel_2', 'ui_karte', 'ui_speichern', 'ui_tasche'];
const ziele_jetzt = () => performance.now();
const ziele_rein = t => String(t || '').replace(/<br\s*\/?>/gi, ' · ').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const ziele_esc = t => String(t || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function ziele_hilfe() { const h = typeof settings !== 'undefined' ? settings.hilfe : 1; return h === 0 || h === 2 ? h : 1; }
// ---------------------------------------------------------------- Klänge (Aufnahmen; laden nach dem ersten Audio-Start)
function ziele_laden() { const S = ziele_S; if (S.geladen || !Audio.ctx || typeof klang_load !== 'function') return; S.geladen = true;
  const L = [...ZIELE_UI]; for (const [m, n] of Object.entries(ZIELE_KL)) for (let i = 1; i <= n; i++) L.push('pk_' + m + '_' + i);
  (async () => { for (let i = 0; i < L.length; i += 6) await Promise.all(L.slice(i, i + 6).map(klang_load)); })(); }
function ziele_ton(name, gain, o = {}) { try { if (!Audio.ctx || !Audio.buf || !Audio.buf[name]) return null; return Audio.play(name, { gain, vary: o.vary ?? .02, dest: o.welt ? undefined : Audio.master, ...o }); } catch (e) { return null; } }
function ziele_eins(pre, n) { const L = []; for (let i = 1; i <= n; i++) if (Audio.buf && Audio.buf[pre + i]) L.push(pre + i); return L.length ? L[Math.floor(Math.random() * L.length)] : null; }
// Aufheben: Material oder Gegenstandsname; Papier-Rascheln (Audio.paper) direkt davor/danach wird geschluckt, damit nichts doppelt klingt
Audio.aufheben = function (was) { const S = ziele_S; let m = ZIELE_KL[was] ? was : (ZIELE_MAT.find(([, re]) => re.test(String(was || ''))) || ['papier'])[0];
  clearTimeout(S.papT); S.papMute = ziele_jetzt() + 380; const n = ziele_eins('pk_' + m + '_', ZIELE_KL[m]); if (!n) return false;
  ziele_ton(n, m === 'glanz' ? .3 : .34, { welt: true, varyGain: .1 }); return true; };
{ const alt = Audio.paper; Audio.paper = function () { if (!this.ctx) return; const S = ziele_S; if (ziele_jetzt() < S.papMute) return; clearTimeout(S.papT);
    S.papT = setTimeout(() => { if (ziele_jetzt() < S.papMute) return; const n = ziele_eins('pk_papier_', 3); if (n) ziele_ton(n, .3, { welt: true, varyGain: .12 }); else if (alt) alt.call(Audio); }, 60); }; }
{ const alt = Audio.chime; Audio.chime = function (kind) { if (ziele_S.chimeAus && kind === 'quest') return; return alt.apply(this, arguments); }; }
{ const alt = Audio.play; Audio.play = function (name) { if (ziele_S.sperr && name === ziele_S.sperr) return null; return alt.apply(this, arguments); }; }
const ZIELE_ARTTON = { neben: ['ui_neben_', 2, .36], fort: ['ui_fort', 0, .36], erledigt: ['ui_erledigt', 0, .38], verpasst: ['ui_verpasst', 0, .4], fibel: ['ui_fibel_1', 0, .3], sammel: ['ui_fibel_2', 0, .32], karte: ['ui_karte', 0, .36], ziel: ['ui_ziel_', 2, .46] };
function ziele_artTon(art) { const T = ZIELE_ARTTON[art]; if (!T) return; const n = T[1] ? ziele_eins(T[0], T[1]) : T[0]; if (n) { ziele_ton(n, T[2]); if (art === 'ziel' || art === 'erledigt') try { Audio.duck(2.5); } catch (e) {} } }
// ---------------------------------------------------------------- Wann warten? (Jagd, Kino, QTE, Sterben = Stress · offene Fenster/Pause/Menü = nur warten)
function ziele_stress() {
  try { if (typeof kino_S !== 'undefined' && kino_S.on) return true; if (typeof SP !== 'undefined' && SP.chase) return true;
    if (typeof spannung_phase === 'function') { const p = spannung_phase(); if (p === 3 || p === 4) return true; }
    if (Audio.chase) return true; if (typeof qte_aktiv === 'function' && qte_aktiv()) return true; if (typeof tod_S !== 'undefined' && tod_S.dying) return true; } catch (e) {}
  return false; }
function ziele_blockiert() { return !!(ui.overlay || ui.paused || (typeof menu !== 'undefined' && menu.attract) || !state.started || document.body.classList.contains('menu') || (document.getElementById('introSeq') || {}).classList?.contains('show') || state.ending); }
// ---------------------------------------------------------------- Logbuch
function ziele_log(art, kind, text) { const S = ziele_S, x = ziele_rein(text); if (!x) return; const k = ziele_rein(kind);
  const L = S.log[S.log.length - 1]; if (L && L.x === x && L.k === k) return; S.log.push({ a: art, k, x, c: typeof curChapter === 'function' ? curChapter() : 1 }); if (S.log.length > 80) S.log.splice(0, S.log.length - 80); }
// ---------------------------------------------------------------- Einblendungen: Warteschlange um questPop
function ziele_nebenZu(text) { const t = ziele_rein(text), s = t.includes('→') ? t.split('→').pop().trim() : t;
  try { const L = typeof sammeln_fadenSicht === 'function' ? sammeln_fadenSicht(story.side) : story.side; for (const q of Object.values(L)) if (q && ziele_rein(q.title) === s) return q;
    for (const q of Object.values(story.side)) if (q && ziele_rein(q.title) === s) return q; } catch (e) {} return null; }
function ziele_kurz(desc) { const d = String(desc || '').split(/<br\s*\/?>/i)[0]; let t = ziele_rein(d); if (t.length > 170) { const m = t.slice(0, 170).match(/^(.*[.!?…“])\s/); t = m ? m[1] : t.slice(0, 165) + ' …'; } return t; }
const ziele_qpOrig = questPop;
questPop = function (kind, text) { const S = ziele_S, art = ziele_art(kind); ziele_log(art, kind, text);
  if (art === 'fund' && !/^DU HAST/.test(kind)) { const g = /^(GLÄNZENDES|VON WHISKEY)/.test(String(kind)) ? 'glanz' : kind + ' ' + text; Audio.aufheben(g); }
  const st = ziele_stress(); if (st || ziele_blockiert()) { S.hold.push([kind, text, art, st]); if (st) S.wasHeld = true; return; }
  S.q.push([kind, text, art]); ziele_weiter(); };
function ziele_weiter() { const S = ziele_S; if (!S.q.length || ziele_jetzt() < S.popBis) return; const [kind, text, art] = S.q.shift(); ziele_pop(kind, text, art); }
function ziele_pop(kind, text, art) { const S = ziele_S; S.chimeAus = true; try { ziele_qpOrig(kind, text); } catch (e) { console.warn('Ziele: questPop', e); } finally { S.chimeAus = false; }
  const el = document.getElementById('questPop'); if (!el) return; el.dataset.art = art; let w = el.querySelector('#qpWarum'); if (!w) { w = document.createElement('em'); w.id = 'qpWarum'; el.appendChild(w); }
  let warum = ''; if (art === 'neben' || art === 'fort' || art === 'erledigt') { const q = ziele_nebenZu(text); if (q) warum = ziele_kurz(q.desc); } else if (art === 'fund' && /^DU HAST/.test(kind)) warum = 'Im Trubel eingesteckt. Steht im Inventar.';
  w.textContent = typeof trX === 'function' ? trX(warum) : warum; w.style.display = warum ? '' : 'none';
  el.classList.remove('zl-neu'); void el.offsetWidth; el.classList.add('zl-neu');
  if (art === 'fund') { if (/^DU HAST/.test(kind)) ziele_ton('ui_tasche', .3); } else ziele_artTon(art);
  S.popBis = ziele_jetzt() + Math.max(ZIELE.gap * 1000, warum ? 4200 : 0); }
// Nach dem Warten: Funde aus dem Stress gesammelt, der Rest der Reihe nach
function ziele_freigeben() { const S = ziele_S, H = S.hold.splice(0); if (!H.length) return; const funde = H.filter(h => h[2] === 'fund' && h[3]), rest = H.filter(h => !(h[2] === 'fund' && h[3]));
  for (const h of rest) S.q.push([h[0], h[1], h[2]]);
  if (funde.length) { const namen = [...new Set(funde.map(h => ziele_rein(h[1])))].join(' · '); S.q.push(['DU HAST EINGESTECKT', namen, 'fund']); }
  ziele_weiter(); }
function ziele_fehl(titel, text) { const q = Object.values(story.side || {}).find(x => x && x.title === titel); if (q && text) q.desc = text; questPop('VERPASST', titel); }
// ---------------------------------------------------------------- Ziel-Anzeige (#objective)
function ziele_dom() { const S = ziele_S; if (S.el.obj) return S.el; const o = document.getElementById('objective'); if (!o) return S.el;
  S.el.obj = o; S.el.lab = o.querySelector('b'); S.el.txt = document.getElementById('objText');
  const w = document.createElement('div'); w.id = 'objWarum'; const h = document.createElement('div'); h.id = 'objWohin';
  const si = document.getElementById('sideInfo'); o.insertBefore(w, si || null); o.insertBefore(h, si || null); S.el.warum = w; S.el.wohin = h; return S.el; }
function ziele_warumVon(t) { const f = ZIELE_WARUM.find(([re]) => re.test(t)); return f ? f[1] : ''; }
function ziele_zeigen(sek = ZIELE.zeig, label = 'AUFGABE', o = {}) { const S = ziele_S, E = ziele_dom(); if (!E.obj) return; const t = (E.txt.textContent || '').trim(); if (!t) return;
  E.lab.textContent = typeof trX === 'function' ? trX(label) : label; const warum = o.warum ? ziele_warumVon(t) : '';
  E.warum.textContent = warum ? (typeof trX === 'function' ? trX(warum) : warum) : ''; E.warum.style.display = warum ? '' : 'none';
  const wo = o.wohin === false ? '' : ziele_wohinHud(o.wohin); E.wohin.innerHTML = wo; E.wohin.style.display = wo ? '' : 'none';
  E.obj.classList.remove('zl-aus'); if (o.neu) { E.obj.classList.remove('zl-neu'); void E.obj.offsetWidth; E.obj.classList.add('zl-neu'); }
  S.hideAt = ziele_jetzt() + sek * 1000; S.zeigeAn = true; }
function ziele_aus() { const S = ziele_S, E = ziele_dom(); if (!E.obj) return; E.obj.classList.add('zl-aus'); E.obj.classList.remove('zl-neu'); S.zeigeAn = false; }
// Neues Ziel aus #objText (alle Kapitel). Takte still, sonst Ankündigung; in Stress/Fenstern sofort sichtbar, die Ankündigung wartet
function ziele_neu(t) { const S = ziele_S; if (!t || t === S.last) return; S.last = t; S.objT = 0; S.stuckT = 0; S.idleZeig = false;
  if (!state.started || (typeof menu !== 'undefined' && menu.attract) || S.nachLaden) { S.pending = null; return; }
  const takt = ZIELE_TAKT.test(t) || t.length < 14; ziele_log('ziel', 'NEUES ZIEL', t);
  if (takt || ziele_stress()) { ziele_zeigen(takt ? 6 : ZIELE.zeig, 'AUFGABE', { wohin: false }); if (!takt) S.pending = t; else if (!ziele_stress() && !ziele_blockiert()) ziele_ton('ui_stift', .22); return; }
  if (ziele_blockiert()) { S.pending = t; return; }
  ziele_ankuendigen(t); }
function ziele_ankuendigen(t) { const S = ziele_S; S.pending = null; ziele_zeigen(ZIELE.neu, 'NEUES ZIEL', { warum: true, neu: true, wohin: ziele_hilfe() === 2 ? 'leise' : false }); ziele_artTon('ziel');
  if (S.hinweise < 3) { S.hinweise++; const E = ziele_dom(); if (E.wohin && !E.wohin.innerHTML) { E.wohin.innerHTML = '<kbd>Z</kbd> zeigt das Ziel jederzeit wieder'; E.wohin.style.display = ''; } } }
// ---------------------------------------------------------------- Wohin? (nächster offener Story-Hinweis; Kartennadeln der Nebenaufgaben)
function ziele_hinweis() { if (typeof HINTS === 'undefined') return null; const P = player.pos; let best = null, bd = 1e9;
  for (const h of HINTS) { if (h.kind !== 'story') continue; let o = false; try { o = h.open(); } catch (e) {} if (!o) continue;
    if (Math.abs((h.y || 0) - P.y) > 12) continue; const d = Math.hypot(h.x - P.x, h.z - P.z); if (d < bd && d < 420) { bd = d; best = h; } }
  return best ? { x: best.x, z: best.z, d: bd } : null; }
function ziele_rel(x, z) { const P = player.pos, dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz); if (d < 6) return 'ganz in der Nähe';
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
  const a = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz) * 180 / Math.PI, b = Math.abs(a), s = a > 0 ? 'rechts' : 'links';
  const r = b < 25 ? 'geradeaus' : b < 70 ? s + ' vor dir' : b < 115 ? s : b < 155 ? s + ' hinter dir' : 'hinter dir'; return r + ', ' + ziele_m(d); }
function ziele_m(d) { return d < 25 ? 'ein paar Schritte' : 'etwa ' + Math.round(d / (d < 100 ? 10 : 50)) * (d < 100 ? 10 : 50) + ' m'; }
function ziele_himmel(x, z) { const P = player.pos, dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz); if (d < 6) return 'ganz in der Nähe';
  const a = (Math.atan2(-dx, dz) * 180 / Math.PI + 360) % 360, R = ['Norden', 'Nordosten', 'Osten', 'Südosten', 'Süden', 'Südwesten', 'Westen', 'Nordwesten']; // Karte: Norden = +z, Osten = −x
  return 'Richtung ' + R[Math.round(a / 45) % 8] + ', ' + ziele_m(d); }
function ziele_wohinHud(mode) { if (mode === false) return ''; const h = ziele_hilfe(); if (h === 0) return ''; if (h === 1 && mode !== 'immer') return '';
  const z = ziele_hinweis(); return z ? '<span class="zlPfeil">➶</span> ' + ziele_esc(ziele_rel(z.x, z.z)) : ''; }
// ---------------------------------------------------------------- Fibel-Reiter „WAS JETZT?“
function ziele_rJetzt(B) { const S = ziele_S, h = ziele_hilfe(), obj = (document.getElementById('objText').textContent || '').trim();
  const warum = ziele_warumVon(obj); let faden = '';
  if (h > 0 && typeof GEDANKEN_FADEN !== 'undefined') { const f = GEDANKEN_FADEN.find(([re]) => re.test(obj)); if (f && (h === 2 || S.objT > 60)) faden = f[1]; }
  const hin = h > 0 ? ziele_hinweis() : null; const wohin = hin ? ziele_himmel(hin.x, hin.z) : '';
  let neben = []; try { const L = typeof sammeln_fadenSicht === 'function' ? sammeln_fadenSicht(story.side) : story.side;
    for (const [k, q] of Object.entries(L)) { if (!q || q.state !== 'active') continue; let wo = '';
      const p = h > 0 && typeof karte_S !== 'undefined' ? karte_S.p[k] : null; if (p && typeof karte_blattAn === 'function') { const b = karte_blattAn(player.pos.x, player.pos.z); if (b && b.id === p[0]) wo = ziele_himmel(p[1], p[2]); }
      neben.push(`<li><b>${ziele_esc(ziele_rein(q.title))}</b><span>${ziele_esc(ziele_kurz(q.desc))}</span>${wo ? `<i>Nadel auf der Karte: ${ziele_esc(wo)}</i>` : ''}</li>`); } } catch (e) {}
  const log = S.log.slice(-12).reverse().map(l => `<li class="zl-${l.a}"><em>${ziele_esc(ZIELE_ARTNAME[l.a] || l.k)}</em>${ziele_esc(l.x)}</li>`).join('');
  B.innerHTML = `<h2>WAS JETZT?</h2><div class="zlJetzt">` +
    `<section class="zlHaupt"><small>DAS WICHTIGSTE</small><p class="zlZiel">${obj ? ziele_esc(obj) : '<span class="zlLeer">Gerade nichts. Durchatmen.</span>'}</p>` +
    (warum ? `<p class="zlWarum">${ziele_esc(warum)}</p>` : '') + (faden ? `<p class="zlFaden">${ziele_esc(faden)}</p>` : '') +
    (wohin ? `<p class="zlWohin">${ziele_esc(wohin)}${typeof karte_oeffnen === 'function' ? ' <button class="zlKarte">AUF DER KARTE</button>' : ''}</p>` : '') + `</section>` +
    `<section class="zlNeben"><small>NEBENBEI OFFEN</small>${neben.length ? `<ul>${neben.join('')}</ul>` : '<p class="zlLeer">Nichts offen.</p>'}</section>` +
    `<section class="zlLog"><small>ZULETZT NOTIERT</small>${log ? `<ul>${log}</ul>` : '<p class="zlLeer">Noch nichts.</p>'}</section>` +
    `<p class="zlFuss"><kbd>Z</kbd> zeigt das Ziel im Spiel · Hilfe: ${['aus', 'sanft', 'deutlich'][h]} (Einstellungen)</p></div>`;
  const k = B.querySelector('.zlKarte'); if (k) k.onclick = e => { e.stopPropagation(); karte_oeffnen(); }; }
if (typeof sammeln_reiter === 'function') sammeln_reiter('jetzt', 'WAS JETZT?', ziele_rJetzt, () => !!state.started, '#c9a36a');
// ---------------------------------------------------------------- Haken an anderen Systemen
if (typeof addBattery === 'function') addBattery = (o => function () { const S = ziele_S; S.sperr = 'keys2'; try { return o.apply(this, arguments); } finally { S.sperr = null; } })(addBattery);
if (typeof todCpShow === 'function') todCpShow = (o => function (label) { const r = o.apply(this, arguments); ziele_ton('ui_speichern', .36); ziele_log('speichern', 'SPEICHERPUNKT', label); return r; })(todCpShow);
if (typeof karte_markierung === 'function') karte_markierung = (o => function (x, z, art, text) { const r = o.apply(this, arguments); if (r && state.started && !(typeof menu !== 'undefined' && menu.attract)) { ziele_artTon('karte'); if (text) ziele_log('karte', 'KARTE', text); } return r; })(karte_markierung);
if (typeof closeOverlay === 'function') closeOverlay = (o => function () { const war = ui.overlay; const r = o.apply(this, arguments); if ((war === 'journal' || war === 'note') && !ui.overlay && state.started) ziele_S.nachFenster = ziele_jetzt() + 350; return r; })(closeOverlay);
CH_RESUME.push(() => { ziele_S.nachLaden = true; });
// Taste Z (Y auf deutschen Tastaturen an derselben Stelle): Ziel kurz zeigen, mit Richtung ab Hilfe „sanft“
addEventListener('keydown', e => { if ((e.code !== 'KeyZ' && e.code !== 'KeyY') || e.repeat) return; if (ui.overlay || ui.paused || !state.started || (typeof menu !== 'undefined' && menu.attract)) return;
  ziele_zeigen(7, 'AUFGABE', { warum: true, wohin: 'immer' }); });
// Einstellungen: „Hilfe“ (aus · sanft · deutlich) und Steuerung „Z“
{ const m = document.getElementById('mSet'); if (m && m.onclick) { const alt = m.onclick; m.onclick = function (e) { const r = alt.call(this, e); try { const P = document.getElementById('subPanel'), rows = P.querySelectorAll('.row'), last = rows[rows.length - 1];
      if (last && !document.getElementById('sHilfe')) { last.insertAdjacentHTML('afterend', `<div class="row"><span>Hilfe (Ziele, Hinweise)</span><select id="sHilfe">${['Aus', 'Sanft – Luke denkt laut nach', 'Deutlich – mit Richtung'].map((n, i) => `<option value="${i}" ${ziele_hilfe() === i ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`);
        document.getElementById('sHilfe').onchange = ev => { settings.hilfe = +ev.target.value; saveSettings(); }; } } catch (er) { console.warn('Ziele: Einstellung', er); } return r; }; } }
{ const m = document.getElementById('mCtrl'); if (m && m.onclick) { const alt = m.onclick; m.onclick = function (e) { const r = alt.call(this, e); try { const K = document.querySelector('#subPanel .keys');
      if (K && !K.querySelector('.zlTaste')) K.insertAdjacentHTML('beforeend', '<span class="zlTaste"><kbd class="k">Z</kbd></span><span>Aktuelles Ziel kurz zeigen (Fibel: „Was jetzt?“)</span>'); } catch (er) {} return r; }; } }
// ---------------------------------------------------------------- Aussehen (nur Ergänzungen; Schriften aus oberflaeche.js: --f-luke Lukes Hand, --f-buch Fibel, --f-ui/--f-ui-sc HUD)
(function ziele_css() { const st = document.createElement('style'); st.id = 'zlCss'; st.textContent = `
#objective { transition: opacity .9s ease, transform .9s ease; }
#objective.zl-aus { opacity: 0; transform: translateX(-8px); }
#objective.zl-neu #objText { animation: zlSchreib 1.1s cubic-bezier(.3,.6,.3,1) both; }
@keyframes zlSchreib { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
#objWarum { margin-top: 6px; max-width: 420px; font: 21px/1.2 var(--f-luke, Caveat, cursive); color: #d8ccae; opacity: .92; text-shadow: 0 1px 2px #000, 0 0 10px rgba(0,0,0,.9); }
#objective.zl-neu #objWarum { animation: zlSchreib 1.6s .6s cubic-bezier(.3,.6,.3,1) both; }
#objWohin { margin-top: 6px; font: italic 15px var(--f-ui, Georgia, serif); color: #b9ab8c; letter-spacing: .02em; }
#objWohin kbd, .zlFuss kbd { display: inline-block; min-width: 18px; padding: 0 5px; margin-right: 4px; border: 1px solid rgba(201,163,106,.6); border-radius: 2px; font: 700 11px var(--f-ui-sc, Georgia, serif); color: #e0c38f; text-align: center; font-style: normal; }
#objWohin .zlPfeil { color: var(--gold, #c9a36a); font-style: normal; }
#questPop #qpWarum { display: block; max-width: 400px; margin: 5px 0 0 auto; font: 20px/1.2 var(--f-luke, Caveat, cursive); font-style: normal; color: #d8ccae; text-shadow: 0 1px 2px #000, 0 0 10px rgba(0,0,0,.9); }
#questPop.zl-neu #qpWarum { animation: zlSchreib 1.4s .35s cubic-bezier(.3,.6,.3,1) both; }
#questPop[data-art="neben"] small { color: #d9b26f; } #questPop[data-art="fort"] small { color: #c7a77a; }
#questPop[data-art="erledigt"] small { color: #a9b59a; } #questPop[data-art="verpasst"] small { color: #d0453a; }
#questPop[data-art="fund"] small { color: #7fd8b4; } #questPop[data-art="fibel"] small { color: #b8a2e0; } #questPop[data-art="karte"] small { color: #c9b48a; }
#questPop[data-art="erledigt"] span, #questPop[data-art="verpasst"] span { background: linear-gradient(currentColor, currentColor) no-repeat 0 58% / 0 1.5px; }
#questPop.zl-neu[data-art="erledigt"] span, #questPop.zl-neu[data-art="verpasst"] span { animation: zlStrich .7s .45s ease-out forwards; }
#questPop[data-art="verpasst"] span { color: #cdbfb0; }
@keyframes zlStrich { to { background-size: 100% 1.5px; } }
#jBody .zlJetzt { display: grid; grid-template-columns: 1.15fr 1fr; gap: 10px 34px; }
#jBody .zlJetzt section small { display: block; font: 700 10px var(--f-ui-sc, Georgia, serif); letter-spacing: .38em; color: var(--pdim, #5a4a35); margin-bottom: 6px; }
#jBody .zlHaupt { grid-column: 1; grid-row: 1 / span 2; }
#jBody .zlZiel { font: 26px/1.25 var(--f-buch, "Cormorant Garamond", Georgia, serif); margin: 0 0 10px; }
#jBody .zlWarum, #jBody .zlFaden { font: 24px/1.2 var(--f-luke, Caveat, cursive); color: #3a3a40; margin: 0 0 10px; transform: rotate(-.6deg); }
#jBody .zlFaden { color: #2b3555; } #jBody .zlFaden::before { content: '… '; }
#jBody .zlWohin { font: italic 17px var(--f-buch, "Cormorant Garamond", Georgia, serif); margin: 12px 0 0; }
#jBody .zlWohin .zlKarte { margin-left: 8px; padding: 2px 10px; font: 600 10px Georgia, serif; letter-spacing: .25em; background: transparent; border: 1px solid currentColor; color: inherit; cursor: pointer; opacity: .8; }
#jBody .zlWohin .zlKarte:hover { opacity: 1; }
#jBody .zlJetzt ul { list-style: none; margin: 0; padding: 0; }
#jBody .zlNeben li { margin: 0 0 9px; padding-left: 14px; position: relative; } #jBody .zlNeben li::before { content: '–'; position: absolute; left: 0; }
#jBody .zlNeben li b { display: block; font-weight: 600; font-size: 17px; } #jBody .zlNeben li span { display: block; font-size: 15px; font-style: italic; opacity: .85; } #jBody .zlNeben li i { display: block; font-size: 13px; opacity: .7; }
#jBody .zlLog li { font-size: 14px; line-height: 1.3; margin: 0 0 4px; } #jBody .zlLog li em { font-style: normal; font: 600 9px Georgia, serif; letter-spacing: .2em; text-transform: uppercase; opacity: .65; margin-right: 6px; }
#jBody .zlLog li.zl-verpasst { text-decoration: line-through; opacity: .75; }
#jBody .zlLeer { font-style: italic; opacity: .6; }
#jBody .zlFuss { grid-column: 1 / -1; font: italic 13px Georgia, serif; opacity: .65; margin-top: 10px; }
#jBody .zlJetzt li::before { display: none; } #jBody .zlNeben li::before { display: inline; content: '–'; font-size: inherit; top: 0; color: inherit; }
`; document.head.appendChild(st); })();
// ---------------------------------------------------------------- Takt
WORLD_MODS.push(['Ziele', async () => { const S = ziele_S, E = ziele_dom(); if (!E.txt) return;
  new MutationObserver(() => ziele_neu((E.txt.textContent || '').trim())).observe(E.txt, { childList: true, characterData: true, subtree: true });
  S.last = (E.txt.textContent || '').trim();
  window.__ziele = { S, zeigen: ziele_zeigen, stress: ziele_stress, warum: ziele_warumVon, art: ziele_art, mat: m => (ZIELE_MAT.find(([, re]) => re.test(m)) || [])[0], ton: ziele_artTon, laden: ziele_laden }; }]);
WORLD_TICK.push(dt => { const S = ziele_S; if (!S.geladen) ziele_laden(); if (!state.started || (typeof menu !== 'undefined' && menu.attract)) { S.lief = false; return; } const now = ziele_jetzt();
  const st = ziele_stress(), bl = ziele_blockiert();
  // Stress zu Ende: kurz durchatmen lassen, dann Ziel zeigen und Wartendes nachreichen
  if (st) { S.stressAn = true; S.frei = 0; } else if (!bl) S.frei += dt; else S.frei = 0;
  if (!st && !bl && S.hold.length && S.frei > (S.wasHeld ? ZIELE.nach : .6)) { S.wasHeld = false; ziele_freigeben(); }
  if (S.stressAn && !st && !bl && S.frei > ZIELE.nach) { S.stressAn = false; if (S.pending) ziele_ankuendigen(S.pending); else ziele_zeigen(7, 'ZIEL', { warum: false, wohin: 'leise' }); }
  if (!S.lief) { S.lief = true; if (!S.nachLaden) S.pending = (document.getElementById('objText').textContent || '').trim() || null; }
  if (!st && !bl) { if (S.nachLaden && S.frei > 1.2) { S.nachLaden = false; S.pending = null; S.last = (document.getElementById('objText').textContent || '').trim(); ziele_zeigen(ZIELE.neu, 'WEITER', { warum: true, wohin: 'leise' }); }
    if (S.pending && S.frei > 1.6) ziele_ankuendigen(S.pending); ziele_weiter();
    if (S.nachFenster && now > S.nachFenster) { S.nachFenster = 0; ziele_zeigen(5, 'AUFGABE', { wohin: false }); } }
  // Stillstand: wer lange nicht weiterkommt, sieht das Ziel wieder (Hilfe „deutlich“ mit Richtung)
  const P = player.pos; if (Math.hypot(P.x - S.px, P.z - S.pz) > .6) { S.px = P.x; S.pz = P.z; S.idleT = 0; S.idleZeig = false; } else if (!state.talking && !bl && !st) S.idleT += dt;
  if (!S.idleZeig && S.idleT > ZIELE.idle) { S.idleZeig = true; ziele_zeigen(7, 'AUFGABE', { warum: true, wohin: 'leise' }); }
  if (!state.talking && !bl) S.objT += dt; const h = ziele_hilfe(); if (typeof GEDANKEN !== 'undefined') GEDANKEN.stuck = h === 0 ? 1e9 : h === 2 ? 75 : 150;
  if (h === 2 && !st && !bl) { S.stuckT += dt; if (S.stuckT > 150) { S.stuckT = 0; ziele_zeigen(8, 'AUFGABE', { warum: true, wohin: 'immer' }); } }
  if (S.zeigeAn && now > S.hideAt) ziele_aus();
  if (S.zeigeAn && ziele_hilfe() === 2 && S.el.wohin && S.el.wohin.style.display !== 'none' && S.el.wohin.querySelector('.zlPfeil')) { S.wT = (S.wT || 0) - dt; if (S.wT < 0) { S.wT = .5; S.el.wohin.innerHTML = ziele_wohinHud('immer'); } }
});
