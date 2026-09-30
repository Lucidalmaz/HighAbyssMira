// =====================================================================  BEUTEL (Modul „beutel“, Zusatzwunsch X-5): Lukes Beutel in drei Stufen – Fächer, Stapel, Untersuchen, Benutzen, Kombinieren
// Stufe 1 Gürteltasche (Fab „Leather Pouch“, MissTxxT, CC-BY; von Anfang an) · Stufe 2 alter Rucksack (Fab „Backpack Scan“, SebastianBA, CC-BY; Schrottplatz,
// abseits des Hauptwegs, Kap. 1/3/4/5) · Stufe 3 Wanderrucksack (Fab „Backpack for a wandering wizard“, a9908244, CC-BY; Hof im Westen an der Remise, Kap. 4/5). Aufbereitet mit tools/_x5_assets.mjs.
// Kapazität gilt nur für Verbrauchsgüter und Tauschwaren (Batterien, Streichhölzer, Kreide, Lampenöl, Handwärmer, Glänzendes, Tauschgeräte).
// Story-Gegenstände stecken in der Jacke und zählen nie – keine Sackgassen. Voller Beutel: nichts geht verloren – der Fund bleibt liegen bzw. Luke legt den Rest
// sichtbar ab (tausch_drop, glänzt, gespeichert), dazu ein Vorschlag (Whiskey tauscht Glänzendes, [I] ablegen). Beim Anvisieren eines Funds: „passt / passt nicht“.
// Ansicht: Bühne aus album.js (eigenes Licht beim Laden, Welt weich und dunkler, Blick senkt sich) – das Modell kommt von der Hüfte bzw. vom Rücken nach vorn,
// die Tasche klappt auf (Klappe per Eckpunkt-Gewichten), der Rucksack geht mit Reißverschluss auf; rechts das Innenfach mit den Fächern.
// Schnittstelle: beutel_platz(art, n) (tausch.js per typeof) · beutel_stufe() · beutel_auf() · beutel_zu() · beutel_upgrade(stufe, still)
const BEUTEL_STUFEN = [
  { key: 'beutel1', n: 'Gürteltasche', fach: 6, cols: 3, d: 'Deine Gürteltasche aus dem Studio. Früher Kabelbinder, Adapter und Ersatzbatterien fürs Diktiergerät. Jetzt: alles, was du findest.' },
  { key: 'beutel2', n: 'Alter Rucksack', fach: 12, cols: 4, d: 'Tarnmuster, ausgeblichen, ein Riemen geflickt. Die Reißverschlüsse klemmen, aber sie halten.' },
  { key: 'beutel3', n: 'Wanderrucksack', fach: 20, cols: 5, d: 'Leder auf Holzgestell, Zeltbahn oben, Wolldecke unten, eine leere Flasche mit Korken. Gepackt für eine Reise, die nie losging.' }];
// Stapel je Fach
const BEUTEL_ARTEN = { geraet: { n: 'Gerät', st: 1 }, batterie: { n: 'Batterien', st: 4, i: 'batterie' }, oel: { n: 'Lampenöl', st: 2, i: 'oel', e: 'Fläschchen' }, streich: { n: 'Streichhölzer', st: 20, i: 'streich', e: 'Hölzer' },
  kreide: { n: 'Straßenkreide', st: 24, i: 'kreide', e: 'Zeichen' }, waermer: { n: 'Handwärmer', st: 3, i: 'waermer' }, glanz: { n: 'Glänzendes', st: 8, i: 'kronkorken' } };
const BEUTEL_ORDER = ['geraet', 'batterie', 'oel', 'streich', 'kreide', 'waermer', 'glanz'];
// Fundorte der größeren Beutel (x, z, Blickrichtung, Kapitel)
const BEUTEL_FUNDE = [
  { stufe: 2, at: [131.2, -15.6], ry: 2.2, lean: .12, k: [1, 3, 4, 5], titel: 'Ein Rucksack',
    text: 'Unter der offenen Motorhaube eines Schrottautos, als hätte ihn jemand dort vor dem Regen versteckt: ein alter Rucksack. Tarnmuster, ausgeblichen, ein Riemen mit Paketband geflickt. Innen nur Sand und ein Kassenbon, auf dem nichts mehr steht.\n\n<span class="hand">Zwölf Fächer. Ich zieh um.</span>' },
  { stufe: 3, at: [-126.6, -30.4], ry: .9, lean: .05, k: [4, 5], titel: 'Ein Wanderrucksack',
    text: 'An der Remise, halb hinter dem Heu: ein großer Rucksack auf einem Holzgestell. Leder, oben eine Zeltbahn, unten eine Wolldecke, festgeschnallt. In der Seitentasche eine Flasche mit Korken, leer. Gepackt für eine lange Reise. Der Staub auf den Riemen sagt: Sie ging nie los.\n\n<span class="hand">Zwanzig Fächer. Wer auch immer du warst – danke.</span>' }];
// 3D-Modelle zum Untersuchen (und Bildchen im Fach)
const BEUTEL_MODELLE = { batterie: ['../ue/batterie'], brechstange: ['../ue/brechstange'], drahtschneider: ['../ue/drahtschneider'], lampe1: ['../ue/lampe1'], lampe2: ['../ue/lampe2'], lampe3: ['../ue/lampe3'],
  sicherung: ['../ue/sicherung'], schluesselteile: ['../ue/schluesselteil'], polaroid_kamera: ['w_kamera'], feuerzeug: ['w_lighter'], fotoalbum: ['album'], buch: ['w_buch'] };
const beutel_S = { ready: false, stufe: 1, gef: new Set(), open: false, phase: '', t: 0, mod: [], sel: null, kombi: null, insp: null, thumb: {}, welt: [], vor: '', tgt: null, lastFach: -1, hinweisT: 0, flap: null, umpack: 0 };
function beutel_stufe() { return beutel_S.stufe; }
function beutel_cap() { return BEUTEL_STUFEN[beutel_S.stufe - 1].fach; }
// ---------------------------------------------------------------- Inhalt zählen (aus dem Spielzustand; der Beutel speichert keine eigenen Kopien)
function beutel_zaehl() { const T = typeof tausch_S !== 'undefined' ? tausch_S : null, z = { batterie: FLASH.spare | 0, streich: T ? T.streich | 0 : 0, kreide: T ? T.kreide | 0 : 0, oel: T ? T.oelN | 0 : 0, waermer: T ? T.warmN | 0 : 0, glanz: 0, geraet: 0 };
  if (T) { for (const [k, v] of Object.entries(T.tasche)) { const W = TAUSCH_WAREN[k]; if (W && !W.kanon && v > 0) z.glanz += v; } z.geraet = (T.lampe ? 2 : 0) + (T.fernglas ? 1 : 0); } return z; }
function beutel_faecher(z) { let n = 0; for (const a of BEUTEL_ORDER) { if (a === 'geraet') n += z.geraet; else n += Math.ceil((z[a] || 0) / BEUTEL_ARTEN[a].st); } return n; }
// Öffentlich (tausch.js): passt n Stück der Art noch hinein? Wer schon zu viel hat (alter Spielstand), bekommt keine neuen Fächer, aber alles in bestehenden Stapeln.
function beutel_platz(art, n = 1) { if (!beutel_S.ready) return true; const z = beutel_zaehl(), vor = beutel_faecher(z); if (!(art in z)) return true; z[art] += art === 'geraet' ? n : n; const nach = beutel_faecher(z); return nach <= beutel_cap() || nach <= vor; }
function beutel_frei(art) { let n = 0; while (n < 99 && beutel_platz(art, n + 1)) n++; return n; }
// ---------------------------------------------------------------- Voll: nichts geht verloren
function beutel_ablegen(was, n) { const P = player.pos, d = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw)); let x = P.x + d.x * .7, z = P.z + d.z * .7;
  if (typeof tausch_drop === 'function') { tausch_drop(x, null, z, was, n > 1 ? `Deine ${n} Batterien. Da, wo du sie abgelegt hast.` : 'Da, wo du es abgelegt hast.'); return true; } return false; }
function beutel_vollHinweis(art) { const S = beutel_S, st = BEUTEL_STUFEN[S.stufe - 1], z = beutel_zaehl(); const tausch = z.glanz > 0 && typeof whiskey_S !== 'undefined';
  toast(`${st.n} voll (${beutel_faecher(z)}/${st.fach} Fächer). ` + (tausch ? 'Whiskey nimmt Glänzendes – das macht Platz. ' : '') + `[${album_tastenName(album_tasten.beutel)}] öffnen und etwas ablegen.`, 5200); S.hinweisT = 6; }
// ---------------------------------------------------------------- Stapel für die Anzeige (automatisch einsortiert)
function beutel_stapel() { const S = beutel_S, z = beutel_zaehl(), T = typeof tausch_S !== 'undefined' ? tausch_S : null, out = [];
  if (T && T.lampe) out.push({ art: 'geraet', k: T.lampe === 'sturm' ? 'sturmlaterne' : 'oellampe', n: 1, span: 2, name: T.lampe === 'sturm' ? 'Sturmlaterne' : 'Öllampe', i: T.lampe === 'sturm' ? 'laterne' : 'oellampe', sub: `Öl ${Math.round(T.oel * 100)} %` });
  if (T && T.fernglas) out.push({ art: 'geraet', k: 'fernglas', n: 1, name: 'Fernglas', i: 'fernglas' });
  for (const a of BEUTEL_ORDER) { if (a === 'geraet' || a === 'glanz') continue; let n = z[a]; const A = BEUTEL_ARTEN[a]; while (n > 0) { const m = Math.min(A.st, n); out.push({ art: a, k: a, n: m, name: A.n, i: A.i, voll: m === A.st }); n -= m; } }
  if (T && z.glanz) { const L = []; for (const [k, v] of Object.entries(T.tasche)) { const W = TAUSCH_WAREN[k]; if (W && !W.kanon) for (let i = 0; i < v; i++) L.push(k); } L.sort((a, b) => TAUSCH_WAREN[b].g - TAUSCH_WAREN[a].g);
    for (let i = 0; i < L.length; i += 8) out.push({ art: 'glanz', k: 'glanz', n: Math.min(8, L.length - i), name: 'Glänzendes', i: TAUSCH_WAREN[L[i]].i, waren: L.slice(i, i + 8) }); }
  return out; }
// Jacke: Story-Gegenstände (zählen nie)
function beutel_jacke() { const L = []; for (const k of story.items) { if (k === 'batterie' || !ITEMS[k]) continue; L.push(k); } if (typeof tausch_S !== 'undefined') for (const [k, v] of Object.entries(tausch_S.tasche)) { const W = TAUSCH_WAREN[k]; if (W && W.kanon && v > 0) L.push('kanon:' + k); } return L; }
function beutel_icon(k, i) { if (beutel_S.thumb[k]) return `<img src="${beutel_S.thumb[k]}" alt="">`; if (i && typeof tausch_svg === 'function') return tausch_svg(i); if (typeof ICONS !== 'undefined' && ICONS[k]) return ICONS[k]; return typeof tausch_svg === 'function' ? tausch_svg('staniol') : ''; }
function beutel_itemInfo(k) { if (k.startsWith('kanon:')) { const W = TAUSCH_WAREN[k.slice(6)]; return { name: W.n, desc: W.d, i: W.i }; } const it = ITEMS[k] || { name: k, desc: '' }; return { name: it.name, desc: it.desc }; }

// ================================================================ Oberfläche
{ const css = document.createElement('style'); css.textContent = `
  #beutelOv { position: fixed; right: 4.5vw; top: 50%; transform: translate(40px, -50%); width: min(44vw, 640px); z-index: 6; opacity: 0; pointer-events: none; transition: opacity .45s, transform .6s cubic-bezier(.2,.8,.3,1); }
  #beutelOv.show.auf { opacity: 1; transform: translate(0, -50%); pointer-events: auto; }
  .bt-kopf { display: flex; flex-wrap: wrap; row-gap: 6px; justify-content: space-between; align-items: baseline; margin: 0 4px 12px; color: #e3d6b8; text-shadow: 0 0 6px #000, 0 0 16px #000; }
  .bt-t { font: 20px "Special Elite", monospace; letter-spacing: .08em; }
  .bt-cap { font: 600 12px "Cormorant Garamond", Georgia, serif; letter-spacing: .26em; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
  .bt-cap i { display: inline-block; width: 7px; height: 10px; margin-left: -4px; border: 1px solid rgba(220,200,160,.55); border-radius: 1px 1px 3px 3px; }
  .bt-cap i.b { background: rgba(214,180,120,.75); } .bt-cap.voll { color: #e0907a; }
  .bt-grid { display: grid; gap: 7px; padding: 14px; border-radius: 6px; background-size: 240px 240px; position: relative;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,.6), inset 0 0 60px rgba(0,0,0,.75), inset 0 10px 22px rgba(0,0,0,.6), 0 20px 50px rgba(0,0,0,.65); }
  .bt-grid::before { content: ''; position: absolute; inset: 6px; border: 2px dashed rgba(226,206,160,.22); border-radius: 4px; pointer-events: none; }
  .bt-fach { position: relative; aspect-ratio: 1 / 1; border-radius: 3px; background: rgba(0,0,0,.22); box-shadow: inset 0 6px 12px rgba(0,0,0,.7), inset 0 -1px 0 rgba(255,235,200,.08), 0 1px 0 rgba(255,235,200,.06); cursor: default; transition: box-shadow .2s, transform .2s; }
  .bt-fach::after { content: ''; position: absolute; left: 5px; right: 5px; top: 5px; border-top: 1.5px dashed rgba(230,210,170,.25); }
  .bt-fach.span2 { grid-column: span 2; aspect-ratio: auto; }
  .bt-fach.leer { background: rgba(0,0,0,.12); }
  .bt-fach.has { cursor: pointer; } .bt-fach.has:hover, .bt-fach.sel { box-shadow: inset 0 6px 12px rgba(0,0,0,.6), 0 0 0 2px rgba(214,176,112,.65), 0 0 18px rgba(214,176,112,.25); transform: translateY(-2px); }
  .bt-fach.kombi { box-shadow: inset 0 6px 12px rgba(0,0,0,.6), 0 0 0 2px rgba(140,190,120,.7); }
  .bt-ding { position: absolute; inset: 9% 9% 14% 9%; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 6px 6px rgba(0,0,0,.7)); animation: btRein .78s both; }
  .bt-ding img { max-width: 100%; max-height: 100%; }
  .bt-ding svg { width: 72%; height: 72%; color: #e6dcc6; stroke-width: 1.2; }
  .bt-n { position: absolute; right: 7px; bottom: 3px; font: 26px/1 Caveat, cursive; color: #f0e4c8; text-shadow: 0 0 4px #000, 0 1px 2px #000; }
  .bt-sub { position: absolute; left: 7px; bottom: 5px; font: 11px "Special Elite", monospace; color: #d8c9a6; text-shadow: 0 0 3px #000; }
  @keyframes btRein { 0% { opacity: 0; transform: translateY(-64px) rotate(-9deg); animation-timing-function: cubic-bezier(.45,0,.9,.55); } 14% { opacity: 1; } 56% { transform: translateY(0) rotate(2.5deg); animation-timing-function: cubic-bezier(.2,.6,.4,1); } 70% { transform: translateY(-10px) rotate(-1.2deg); animation-timing-function: cubic-bezier(.5,0,.9,.5); } 82% { transform: translateY(0) rotate(.6deg); animation-timing-function: cubic-bezier(.2,.6,.4,1); } 90% { transform: translateY(-2.5px) rotate(-.2deg); } 100% { transform: translateY(0) rotate(0); } }
  .bt-jacke { margin-top: 16px; padding: 12px 14px 14px; background: var(--fibre), radial-gradient(140% 100% at 50% 40%, #e3d8bc 0%, #d6c9a8 60%, #bba983 100%); background-size: 240px 240px, auto; box-shadow: 0 2px 3px rgba(0,0,0,.35), 0 18px 40px rgba(0,0,0,.6); transform: rotate(-.4deg); color: #2a2016; }
  .bt-jacke h3 { margin: 0 0 8px; font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .35em; color: #7c2418; }
  .bt-jacke h3 small { letter-spacing: .12em; color: #5a4a35; font-weight: 400; }
  .bt-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .bt-tag { display: flex; align-items: center; gap: 6px; padding: 3px 9px 3px 6px; background: linear-gradient(180deg, #efe6cf, #ddd0b0); border-radius: 2px 8px 8px 2px; box-shadow: 0 1px 2px rgba(0,0,0,.3); font: 17px/1.1 Caveat, cursive; cursor: pointer; }
  .bt-tag:nth-child(odd) { transform: rotate(-1deg); } .bt-tag:hover, .bt-tag.sel { box-shadow: 0 0 0 2px rgba(124,36,24,.5); }
  .bt-tag svg, .bt-tag img { width: 20px; height: 20px; color: #2b2a33; object-fit: contain; }
  .bt-info { margin-top: 14px; min-height: 92px; padding: 12px 16px; background: rgba(8,6,4,.72); border: 1px solid rgba(201,163,106,.22); color: #d9cdb2; font: 15px/1.45 "Cormorant Garamond", Georgia, serif; }
  .bt-info b { display: block; font: 14px "Special Elite", monospace; letter-spacing: .06em; color: #e8dab8; margin-bottom: 4px; }
  .bt-info .hand { font: 21px/1.2 Caveat, cursive; color: #e4d3ad; }
  .bt-knopf { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .bt-knopf button { font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .24em; background: rgba(201,163,106,.08); color: #e2d2ae; border: 1px solid rgba(201,163,106,.45); padding: 6px 12px; cursor: pointer; }
  .bt-knopf button:hover { background: rgba(201,163,106,.22); } .bt-knopf button:disabled { opacity: .35; cursor: default; }
  .bt-fuss { margin-top: 10px; font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .22em; color: #cbbd9d; text-shadow: 0 0 4px #000; text-transform: uppercase; }
  .bt-fuss kbd { font: 600 11px Georgia; border: 1px solid rgba(201,163,106,.6); padding: 1px 6px; margin: 0 3px; color: var(--gold, #c9a36a); border-radius: 2px; }
  .bt-banner { position: absolute; left: 50%; top: -46px; transform: translateX(-50%); white-space: nowrap; font: 26px Caveat, cursive; color: #f0dfb4; text-shadow: 0 0 8px #000, 0 0 20px #000; opacity: 0; transition: opacity .6s; }
  .bt-banner.on { opacity: 1; }
  #beutelVor { position: fixed; left: 50%; top: calc(50% + 64px); transform: translateX(-50%); z-index: 5; pointer-events: none; font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .2em; text-transform: uppercase; color: #cfc3a5; text-shadow: 0 0 4px #000, 0 0 10px #000; opacity: 0; transition: opacity .3s; white-space: nowrap; }
  #beutelVor.on { opacity: .92; } #beutelVor.nein { color: #e49a86; }
  #beutelLupe { position: fixed; left: 50%; bottom: 4vh; transform: translateX(-50%); z-index: 6; pointer-events: none; font: 600 12px "Cormorant Garamond", Georgia, serif; letter-spacing: .22em; color: #d9cdb2; text-shadow: 0 0 4px #000, 0 0 12px #000; text-transform: uppercase; opacity: 0; transition: opacity .4s; }
  #beutelLupe.on { opacity: 1; } #beutelLupe kbd { font: 600 11px Georgia; border: 1px solid rgba(201,163,106,.6); padding: 1px 6px; margin: 0 3px; color: var(--gold, #c9a36a); border-radius: 2px; }`;
  document.head.appendChild(css);
  const mk = (id, html, par = document.body) => { const d = document.createElement('div'); d.id = id; if (html) d.innerHTML = html; par.appendChild(d); return d; };
  mk('beutelOv'); mk('beutelVor', '', document.getElementById('hud') || document.body); mk('beutelLupe'); }
function beutel_render(neu) {
  const S = beutel_S, st = BEUTEL_STUFEN[S.stufe - 1], L = beutel_stapel(), z = beutel_zaehl(), bel = beutel_faecher(z), el = $('beutelOv');
  const cells = []; let used = 0; L.forEach((s, j) => { used += s.span || 1; cells.push(s); }); const leer = Math.max(0, st.fach - used);
  const html = [`<div class="bt-banner${S.umpack ? ' on' : ''}">${S.umpack ? `Umgepackt – ${BEUTEL_STUFEN[S.umpack - 1].fach} → ${st.fach} Fächer` : ''}</div>`,
    `<div class="bt-kopf"><span class="bt-t">${st.n.toUpperCase()}</span><span class="bt-cap${bel >= st.fach ? ' voll' : ''}">Fächer ${bel} / ${st.fach} ${Array.from({ length: st.fach }, (_, i) => `<i class="${i < bel ? 'b' : ''}"></i>`).join('')}</span></div>`,
    `<div class="bt-grid" style="grid-template-columns:repeat(${st.cols},1fr);background-image:url('assets/ms/${st.key}/futter.jpg')">`];
  cells.forEach((s, j) => html.push(`<div class="bt-fach has${s.span ? ' span2' : ''}${S.sel && S.sel.f === j ? ' sel' : ''}${S.kombi && S.kombi.f === j ? ' kombi' : ''}" data-f="${j}"><div class="bt-ding" style="animation-delay:${neu ? .12 + j * .07 : 0}s">${beutel_icon(s.k === 'glanz' ? 'glanz_' + s.i : s.k, s.i)}</div>${s.n > 1 || BEUTEL_ARTEN[s.art].st > 1 ? `<span class="bt-n">×${s.n}</span>` : ''}${s.sub ? `<span class="bt-sub">${s.sub}</span>` : ''}</div>`));
  for (let i = 0; i < leer; i++) html.push('<div class="bt-fach leer"></div>');
  html.push('</div>');
  const J = beutel_jacke(); html.push(`<div class="bt-jacke"><h3>IN DER JACKE <small>· zählt nicht, geht nie verloren</small></h3><div class="bt-tags">${J.map(k => { const inf = beutel_itemInfo(k); return `<div class="bt-tag${S.sel && S.sel.j === k ? ' sel' : ''}" data-j="${k}">${beutel_icon(k.startsWith('kanon:') ? '' : k, inf.i)}${inf.name}</div>`; }).join('') || '<i style="font:16px Caveat">Nichts.</i>'}</div></div>`);
  html.push(`<div class="bt-info">${beutel_infoHtml(cells)}</div><div class="bt-fuss"><kbd>Klick</kbd> auswählen · <kbd>${album_tastenName(album_tasten.beutel)}</kbd> <kbd>Esc</kbd> zumachen</div>`);
  el.innerHTML = html.join(''); S.cells = cells;
  el.querySelectorAll('.bt-fach.has').forEach(f => { f.onclick = e => { e.stopPropagation(); beutel_waehle({ f: +f.dataset.f }); }; f.onmouseenter = () => album_ton('albFoto', { gain: .04, rate: 1.8 }); });
  el.querySelectorAll('.bt-tag').forEach(f => f.onclick = e => { e.stopPropagation(); beutel_waehle({ j: f.dataset.j }); });
  el.querySelectorAll('.bt-knopf button').forEach(b => b.onclick = e => { e.stopPropagation(); beutel_aktion(b.dataset.a); });
}
function beutel_infoHtml(cells) { const S = beutel_S, sel = S.sel; if (S.kombi) return `<b>KOMBINIEREN</b><span class="hand">Womit? Wähl das zweite Ding aus.</span><div class="bt-knopf"><button data-a="abbruch">ABBRECHEN</button></div>`;
  if (!sel) { const st = BEUTEL_STUFEN[S.stufe - 1]; return `<b>${st.n.toUpperCase()}</b>${st.d}`; }
  const acts = beutel_aktionen(sel, cells), btn = acts.map(a => `<button data-a="${a[0]}">${a[1]}</button>`).join('');
  if (sel.j) { const inf = beutel_itemInfo(sel.j); return `<b>${inf.name.toUpperCase()}</b>${inf.desc}<div class="bt-knopf">${btn}</div>`; }
  const s = cells[sel.f]; if (!s) return ''; let d = '';
  if (s.art === 'glanz') d = s.waren.map(k => TAUSCH_WAREN[k].n).join(', ') + '. <span class="hand">Whiskey nimmt das. Nur das Glänzendste zuerst.</span>';
  else if (s.art === 'batterie') d = `Mignonzellen. [R] wechselt die Batterie der Lampe. Eingelegte: ${Math.round(FLASH.charge * 100)} %.`;
  else if (s.k === 'oellampe' || s.k === 'sturmlaterne') { const T = tausch_S; d = `[L] an und aus. Öl: ${Math.round(T.oel * 100)} %${T.oelN ? ` · ${T.oelN} Fläschchen dabei` : ''}.`; }
  else if (s.k === 'fernglas') d = '[V] halten: heranholen. Glänzendes blitzt damit auch von weit auf.';
  else if (s.art === 'streich') d = 'Welthölzer. Zünden Lampe und Laterne. Ohne Lampe: [L], ein Streichholz, kurz Licht.';
  else if (s.art === 'kreide') d = '[K] malt einen gelben Pfeil dahin, wohin du siehst – er steht dann auch auf der Karte.';
  else if (s.art === 'oel') d = 'Petroleum, Korken drauf. Füllt Öllampe oder Sturmlaterne.';
  else if (s.art === 'waermer') d = 'Knicken: fünf Minuten warme Hände. Die Angst kriecht langsamer.';
  return `<b>${s.name.toUpperCase()}${s.n > 1 ? ' · ' + s.n + (BEUTEL_ARTEN[s.art].e ? ' ' + BEUTEL_ARTEN[s.art].e : '') : ''}</b>${d}<div class="bt-knopf">${btn}</div>`; }
function beutel_aktionen(sel, cells) { const T = typeof tausch_S !== 'undefined' ? tausch_S : null, A = [];
  if (sel.j) { const k = sel.j; if (BEUTEL_MODELLE[k]) A.push(['untersuchen', 'UNTERSUCHEN']);
    if (/^lampe\d$/.test(k)) { A.push(['lampe', flashOn ? 'AUSSCHALTEN' : 'EINSCHALTEN']); A.push(['kombi', 'KOMBINIEREN']); }
    if (k === 'polaroid_kamera' && typeof kamera_S !== 'undefined' && kamera_S.frei) A.push(['kamera', 'HEBEN']);
    if (k === 'fotoalbum') A.push(['album', 'AUFSCHLAGEN']); return A; }
  const s = cells[sel.f]; if (!s) return A;
  if (s.k === 'batterie') { A.push(['untersuchen', 'UNTERSUCHEN']); A.push(['reload', 'IN DIE LAMPE']); A.push(['kombi', 'KOMBINIEREN']); A.push(['ablegen', 'EINE ABLEGEN']); }
  else if (s.art === 'glanz') { A.push(['ablegen', 'EINS ABLEGEN']); }
  else if (s.k === 'oellampe' || s.k === 'sturmlaterne') { A.push(['lampeL', T && T.an ? 'AUSMACHEN' : 'ANZÜNDEN']); A.push(['kombi', 'KOMBINIEREN']); }
  else if (s.art === 'oel') { A.push(['nachfuellen', 'NACHFÜLLEN']); A.push(['kombi', 'KOMBINIEREN']); }
  else if (s.art === 'streich') { A.push(['streich', T && T.lampe ? 'LAMPE ANZÜNDEN' : 'EINS ANREISSEN']); A.push(['kombi', 'KOMBINIEREN']); }
  else if (s.art === 'waermer') A.push(['waermer', 'KNICKEN']);
  return A; }
function beutel_waehle(w) { const S = beutel_S; if (S.insp) return;
  if (S.kombi) { const a = S.kombi, b = w; S.kombi = null; beutel_kombi(a, b); return; }
  S.sel = w; album_ton('albFoto', { gain: .12, rate: 1.3 }); beutel_render(false); }
function beutel_art(w) { if (!w) return ''; if (w.j) return /^lampe\d$/.test(w.j) ? 'taschenlampe' : w.j; const s = beutel_S.cells[w.f]; if (!s) return ''; return s.k === 'oellampe' || s.k === 'sturmlaterne' ? 'oellampe' : s.art; }
function beutel_kombi(a, b) { const x = beutel_art(a), y = beutel_art(b), has = (p, q) => (x === p && y === q) || (x === q && y === p);
  if (has('batterie', 'taschenlampe')) return beutel_aktion('reload', true);
  if (has('oel', 'oellampe')) return beutel_aktion('nachfuellen', true);
  if (has('streich', 'oellampe')) return beutel_aktion('streich', true);
  toast(x === y ? 'Das ist dasselbe.' : 'Das passt nicht zusammen.', 2000); beutel_render(false); }
function beutel_aktion(a) { const S = beutel_S, T = typeof tausch_S !== 'undefined' ? tausch_S : null, sel = S.sel, s = sel && sel.f !== undefined ? S.cells[sel.f] : null;
  const zuDann = fn => { beutel_zu(); setTimeout(() => { try { fn(); } catch (e) {} }, 1250); };
  if (a === 'abbruch') { S.kombi = null; return beutel_render(false); }
  if (a === 'kombi') { S.kombi = sel; return beutel_render(false); }
  if (a === 'untersuchen') return beutel_untersuchen(sel.j || (s && s.k));
  if (a === 'reload') { if (FLASH.charge > .97) { toast('Die Batterie in der Lampe ist noch voll.', 2000); return; } flashReload(); if (!FLASH.spare) story.items = story.items.filter(k => k !== 'batterie'); S.sel = null; return beutel_render(false); }
  if (a === 'lampe') { flashOn = !flashOn; Audio.beep(true); FLASH.hudT = 2.5; return beutel_render(false); }
  if (a === 'nachfuellen') { if (!T || !T.lampe) return toast('Keine Lampe, in die das Öl könnte.', 2200); if (T.oel > .95) return toast('Die Lampe ist voll.', 1800); if (T.oelN <= 0) return;
    T.oelN--; T.oel = 1; Audio.play('waterFlow', { gain: .12, rate: 1.6, dur: 1.2 }); toast('Du füllst Lampenöl nach. Es riecht nach Keller.', 2400); S.sel = null; return beutel_render(false); }
  if (a === 'streich' || a === 'lampeL') return zuDann(() => tausch_lampeTaste());
  if (a === 'waermer') { if (typeof tausch_waermer === 'function') tausch_waermer(); S.sel = null; return beutel_render(false); }
  if (a === 'kamera') return zuDann(() => kamera_heben(true));
  if (a === 'album') { beutel_zu(); setTimeout(() => album_auf(), 1300); return; }
  if (a === 'ablegen' && s) { if (s.art === 'batterie') { if (!FLASH.spare) return; FLASH.spare--; if (!FLASH.spare) story.items = story.items.filter(k => k !== 'batterie'); flashHud(); beutel_ablegen({ bat: 1 }, 1); }
    else if (s.art === 'glanz') { const k = s.waren[s.waren.length - 1]; tausch_nimm(k); beutel_ablegen({ ware: k }, 1); }
    album_ton('albFoto', { gain: .2, rate: .8 }); Audio.play('keys1', { gain: .12, rate: 1.5, dur: .25 }); toast('Abgelegt. Es liegt vor deinen Füßen – es glänzt, wenn du wiederkommst.', 3200); S.sel = null; return beutel_render(false); } }

// ================================================================ 3D: Modelle der drei Stufen, Klappe, Untersuchen
const beutel_tmp = { e0: null, e1: null, q0: null, q1: null, v: null };
const BEUTEL_POSE = [ // in Kamera-Koordinaten der Bühne: von der Hüfte / vom Rücken nach vorn (Ursprung der Modelle: Boden, Mitte)
  { weg: { p: [.34, -.62, -.42], r: [.3, -1.2, .6] }, hand: { p: [-.13, -.1, -.56], r: [.5, .5, .02] }, d: .56 },
  { weg: { p: [.95, .25, -.7], r: [.2, -2.3, .7] }, hand: { p: [-.33, -.3, -1.35], r: [.32, 3.55, .02] }, d: 1.35 },
  { weg: { p: [1.5, .5, -1.1], r: [.2, -2.4, .7] }, hand: { p: [-.55, -.5, -2.2], r: [.26, .55, .02] }, d: 2.2 }];
function beutel_pose(a, b, k, o) { const T = beutel_tmp; T.q0.setFromEuler(T.e0.set(a.r[0], a.r[1], a.r[2])); T.q1.setFromEuler(T.e1.set(b.r[0], b.r[1], b.r[2])); o.quaternion.slerpQuaternions(T.q0, T.q1, k);
  o.position.set(a.p[0] + (b.p[0] - a.p[0]) * k, a.p[1] + (b.p[1] - a.p[1]) * k + Math.sin(k * Math.PI) * .05, a.p[2] + (b.p[2] - a.p[2]) * k); }
// Leder mit echter Narbung (Ausschnitt aus der Einband-Textur) dreiachsig aufgetragen – die Taschen-Skulptur hat keine UVs
// Stoff gibt nach: Zusammensacken (uSq), oben Durchhängen nach vorn (uGive), leichtes Schwingen (uSway) – im Objektraum, Ursprung am Boden.
// Die Tasche (Skulptur ohne UV) bekommt dazu echte Ledernarbung (Ausschnitt aus der Einband-Textur) dreiachsig aufgetragen.
const BEUTEL_GIVE = `float hN = clamp(position.y / uH, 0., 1.); transformed.y *= 1. - uSq * .07 * (1. - hN * .35); transformed.xz *= 1. + uSq * .035 * (1. - hN);
  transformed.z += uGive * .07 * uH * hN * hN * hN; transformed.x += uSway * .025 * uH * hN * hN;`;
function beutel_give(m, U, tex) { m.onBeforeCompile = sh => { Object.assign(sh.uniforms, U); if (tex) sh.uniforms.uLeder = { value: tex };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uGive, uSq, uSway, uH;' + (tex ? '\nvarying vec3 vOP; varying vec3 vON;' : ''))
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + BEUTEL_GIVE + (tex ? '\nvOP = position; vON = normal;' : ''));
    if (!tex) return;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uLeder; varying vec3 vOP; varying vec3 vON;')
      .replace('#include <map_fragment>', `vec3 bw = pow(abs(normalize(vON)), vec3(4.)); bw /= bw.x + bw.y + bw.z; vec3 p = vOP * 9.;
      vec3 lt = texture2D(uLeder, p.yz).rgb * bw.x + texture2D(uLeder, p.xz).rgb * bw.y + texture2D(uLeder, p.xy).rgb * bw.z; float ll = dot(lt, vec3(.3, .5, .2));
      diffuseColor.rgb *= mix(vec3(.72), lt / max(.08, ll) * .55 + .45, .55) * (.75 + ll * 1.4);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + (.5 - ll * 2.) * .25, .25, 1.);`); };
  m.customProgramCacheKey = () => 'beutelGive' + (tex ? 'L' : ''); m.needsUpdate = true; }
async function beutel_modelle() {
  const S = beutel_S, B = album_B; const lederTex = msTex('beutel1/futter.jpg', true); lederTex.wrapS = lederTex.wrapT = THREE.MirroredRepeatWrapping;
  for (let i = 0; i < 3; i++) { const key = BEUTEL_STUFEN[i].key; try { const src = await msModel(key, 'model.glb'); const g = src.clone(true), root = new THREE.Group(); root.add(g); root.visible = false; B.scene.add(root); const hb = new THREE.Box3().setFromObject(g); const U = { uGive: { value: 0 }, uSq: { value: 0 }, uSway: { value: 0 }, uH: { value: Math.max(.05, hb.max.y) } }; (S.giveU ||= [])[i] = U;
      const flap = []; g.traverse(o => { if (!o.isMesh) return; o.frustumCulled = false; if (o.material) { o.material = o.material.clone(); o.material.envMapIntensity = .5; if (i === 1) { o.material.color.setScalar(.5); o.material.roughness = 1; } beutel_give(o.material, U, i === 0 ? lederTex : null); }
        const sw = o.geometry.attributes.skinWeight; if (i === 0 && sw) { // Attribute liegen verschränkt vor → eigene, flache Kopien (werden beim Aufklappen umgerechnet)
          const G0 = o.geometry, G = new THREE.BufferGeometry(), flat = a => { const f = new Float32Array(a.count * 3); for (let k = 0; k < a.count; k++) { f[k * 3] = a.getX(k); f[k * 3 + 1] = a.getY(k); f[k * 3 + 2] = a.getZ(k); } return f; };
          const P0 = flat(G0.attributes.position), N0 = flat(G0.attributes.normal); G.setAttribute('position', new THREE.BufferAttribute(P0.slice(), 3)); G.setAttribute('normal', new THREE.BufferAttribute(N0.slice(), 3)); G.setIndex(G0.index); G.computeBoundingSphere(); o.geometry = G;
          G.attributes.position.setUsage(THREE.DynamicDrawUsage); G.attributes.normal.setUsage(THREE.DynamicDrawUsage); flap.push({ o, P0, N0, w: Float32Array.from({ length: P0.length / 3 }, (_, k) => sw.getY(k)) }); } });
      if (i === 0) { try { S.meta1 = await (await fetch('assets/ms/beutel1/meta.json')).json(); } catch (e) { S.meta1 = { hinge: [0, .159, -.0095] }; } S.flap = flap; }
      S.mod[i] = root; } catch (e) { console.warn('Beutel: Modell ' + key, e); } } }
// Klappe der Tasche: Winkel a (rad) um die Oberkante, weich über die Gewichte (nur beim Auf-/Zuklappen gerechnet)
function beutel_klappe(a) { const S = beutel_S; if (!S.flap || S.flapA === a) return; S.flapA = a; const h = S.meta1.hinge, hy = h[1], hz = h[2];
  for (const F of S.flap) { const P = F.o.geometry.attributes.position, N = F.o.geometry.attributes.normal, p = P.array, n = N.array;
    for (let k = 0, c = F.w.length; k < c; k++) { const w = F.w[k]; if (w <= 0) { if (a === 0 || true) { p[k * 3 + 1] = F.P0[k * 3 + 1]; p[k * 3 + 2] = F.P0[k * 3 + 2]; n[k * 3 + 1] = F.N0[k * 3 + 1]; n[k * 3 + 2] = F.N0[k * 3 + 2]; } continue; }
      const t = a * w, cs = Math.cos(t), sn = Math.sin(t), dy = F.P0[k * 3 + 1] - hy, dz = F.P0[k * 3 + 2] - hz;
      p[k * 3 + 1] = hy + dy * cs - dz * sn; p[k * 3 + 2] = hz + dy * sn + dz * cs; const ny = F.N0[k * 3 + 1], nz = F.N0[k * 3 + 2]; n[k * 3 + 1] = ny * cs - nz * sn; n[k * 3 + 2] = ny * sn + nz * cs; }
    P.needsUpdate = true; N.needsUpdate = true; } }
// Bildchen für die Fächer (einmal beim Laden, in der Bühne mit ihrem Licht gerendert → dieselben Programme wie beim Untersuchen)
async function beutel_bildchen() {
  const S = beutel_S, B = album_B, W = 160, rt = new THREE.WebGLRenderTarget(W, W), buf = new Uint8Array(W * W * 4), cam = new THREE.PerspectiveCamera(30, 1, .01, 5), cv = document.createElement('canvas'); cv.width = cv.height = W; const cx = cv.getContext('2d');
  const hid = []; B.scene.traverse(o => { if (o.parent === B.scene && o.visible && !o.isLight) { hid.push(o); o.visible = false; } });
  const oldC = renderer.getClearColor(new THREE.Color()), oldA = renderer.getClearAlpha();
  S.insM = {};
  for (const [k, spec] of Object.entries(BEUTEL_MODELLE)) { let g = null; try { const src = await msModel(spec[0], 'model.glb'); const o = msFit(src.clone(true), .1, 'max'); g = new THREE.Group(); g.add(o); o.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(o), c = bb.getCenter(new THREE.Vector3()); o.position.sub(c); g.traverse(m => { if (m.isMesh) { m.castShadow = false; m.frustumCulled = false; } });
      g.position.set(0, -.08, -.46); g.rotation.set(.5, .7, .15); B.scene.add(g); cam.position.set(0, -.08, -.46 + .24); cam.lookAt(g.position);
      const sp = B.spot.intensity; B.spot.intensity = 1.3; renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(B.scene, cam); renderer.readRenderTargetPixels(rt, 0, 0, W, W, buf); B.spot.intensity = sp;
      const im = cx.createImageData(W, W), d = im.data; for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const s = ((W - 1 - y) * W + x) * 4, t = (y * W + x) * 4; for (let q = 0; q < 3; q++) { let v = buf[s + q] / 255 * 1.6; v = v / (1 + v); d[t + q] = Math.pow(v * 1.25, 1 / 2.2) * 255; } d[t + 3] = buf[s + 3]; }
      cx.putImageData(im, 0, 0); S.thumb[k] = cv.toDataURL('image/png'); g.visible = false; S.insM[k] = g; } catch (e) { if (g) { g.visible = false; B.scene.remove(g); } /* ohne Modell: Bleistiftskizze */ } }
  renderer.setRenderTarget(null); renderer.setClearColor(oldC, oldA); rt.dispose(); for (const o of hid) o.visible = true; }
function beutel_untersuchen(k) { const S = beutel_S, g = S.insM && S.insM[k]; if (!g) { toast('Nichts Besonderes. Es ist, was es ist.', 1800); return; }
  S.insp = { g, t: 0, yaw: .7, drag: null, zurueck: false }; g.visible = true; g.position.set(.02, -.1, -.5); album_ton('albFoto', { gain: .2, rate: .7 }); $('beutelOv').classList.remove('auf');
  $('beutelLupe').innerHTML = `<kbd>Ziehen</kbd> drehen &nbsp; <kbd>Klick</kbd> <kbd>Esc</kbd> zurück`; $('beutelLupe').classList.add('on'); }
function beutel_inspZurueck() { const I = beutel_S.insp; if (!I || I.zurueck) return; I.zurueck = true; I.t = 0; $('beutelLupe').classList.remove('on'); }

// ================================================================ Öffnen / Schließen
function beutel_auf(umpack) {
  const S = beutel_S; if (!S.ready || S.open || !S.mod[S.stufe - 1]) return; const g = album_gefahr(); if (g) return album_nein(g);
  if (album_S.open || (album_B.owner && album_B.kZiel !== 0)) return;
  S.open = true; S.phase = 'auf'; S.t = 0; S.sel = null; S.kombi = null; S.insp = null; S.umpack = umpack || 0; S.klappe = false; S.lande = false; S.fl = { a: 0, v: 0, ziel: 0 }; S.give = { x: 0, v: 0, ziel: 0, s: 0, sv: 0 }; S.rv.set(0, 0, 0);
  ui.overlay = 'beutelOv'; $('beutelOv').classList.add('show'); document.body.classList.add('ov'); if (document.pointerLockElement) document.exitPointerLock();
  album_B.pitch = S.stufe === 1 ? -.72 : -.6; album_B.lean = .07; album_buehne('beutel', true); { const h = BEUTEL_POSE[S.stufe - 1].hand.p; album_B.spot.target.position.set(h[0], h[1] + .1 * S.stufe, h[2]); album_B.spotK = [1.1, 2.6, 5.2][S.stufe - 1]; }
  const R = S.mod[S.stufe - 1]; R.visible = true; const P = BEUTEL_POSE[S.stufe - 1]; beutel_pose(P.weg, P.weg, 0, R); beutel_pose(P.weg, P.weg, 0, beutel_tmp.T); if (S.stufe === 1) { S.flapA = null; beutel_klappe(0); }
  album_ton(S.stufe === 1 ? 'albLeder' : 'albStoff', { gain: .4, pan: .4 }); beutel_render(false);
}
function beutel_zu(schnell) { const S = beutel_S; if (!S.open || S.phase === 'zu') return; if (S.insp) { S.insp.g.visible = false; S.insp = null; $('beutelLupe').classList.remove('on'); }
  S.phase = 'zu'; S.t = schnell ? .9 : 0; $('beutelOv').classList.remove('auf'); document.body.style.cursor = ''; }
function beutel_ende() { const S = beutel_S; S.open = false; S.phase = ''; for (const m of S.mod) if (m) m.visible = false; if (S.stufe === 1) beutel_klappe(0); S.umpack = 0; album_buehne('beutel', false); if (ui.overlay === 'beutelOv') closeOverlay(); else $('beutelOv').classList.remove('show', 'auf'); }
// Jedes Ding landet hörbar in seinem Fach – im selben Takt wie die Fall-Animation (Aufprall bei 56 %, kleiner Nachhüpfer bei 82 %)
function beutel_klappern() { const L = beutel_S.cells || [], K = { batterie: ['keys1', 2.2, .07], glanz: ['metalHit1', 2.8, .035], streich: ['woodHit2', 2.5, .05], kreide: ['woodHit3', 2.9, .035], oel: ['glass1', 1.9, .035], waermer: ['woodHit1', 1.6, .02], geraet: ['glass1', 1.3, .05] };
  L.forEach((c, j) => { const k = K[c.art] || K.glanz, d = .12 + j * .07 + .78 * .56; if (j > 11) return; Audio.play(k[0], { pan: -.1 + Math.random() * .2, gain: k[2], rate: k[1] * (.94 + Math.random() * .12), delay: d, dur: .14 }); Audio.play(k[0], { pan: 0, gain: k[2] * .3, rate: k[1] * 1.1, delay: d + .78 * .26, dur: .1 }); }); }
function beutel_tick(dt) { const S = beutel_S; if (!S.ready || !S.open) return;
  if (ui.overlay !== 'beutelOv' && S.phase !== 'zu') return beutel_ende();
  if (S.phase !== 'zu') { const g = album_gefahr(true); if (g) beutel_zu(g === 'x'); }
  S.t += dt; const t = S.t, i = S.stufe - 1, R = S.mod[i], P = BEUTEL_POSE[i], Z = beutel_tmp.T, h = Math.min(dt, .033), G = S.give, F = S.fl;
  if (S.phase === 'auf') { beutel_pose(P.weg, P.hand, album_out(t / .72), Z);
    // Ankunft in den Händen: der Beutel sackt kurz zusammen (Stoff/Leder gibt nach) und federt aus
    if (t > .62 && !S.lande) { S.lande = true; G.sv -= i ? 5.5 : 3.5; album_ton('albStoff', { gain: .18, rate: 1.4 }); }
    if (t > .72 && !S.klappe) { S.klappe = true; if (i === 0) { album_ton('albSchnalle', { gain: .5 }); album_ton('albLeder', { gain: .35, delay: .12 }); F.ziel = -1.95; F.v = -1.2; }
      else { if (i === 2) { album_ton('albSchnalle', { gain: .4 }); album_ton('albLeder', { gain: .35, delay: .15 }); } album_ton('albZipp', { gain: .45, delay: i === 2 ? .3 : 0 }); G.ziel = .7; } }
    if (t > .98 && !S.klap2) { S.klap2 = true; beutel_render(true); beutel_klappern(); $('beutelOv').classList.add('auf'); }
    if (t > 1.45) { S.phase = 'offen'; S.t = 0; S.klap2 = false; S.lande = false; if (S.umpack) setTimeout(() => { S.umpack = 0; const b = $('beutelOv').querySelector('.bt-banner'); if (b) b.classList.remove('on'); }, 3200); } }
  else if (S.phase === 'zu') { if (t > .05 && !S.zuT0) { S.zuT0 = true; F.ziel = 0; F.v = 1.4; G.ziel = 0; }
    if (t > .32 && !S.zuT) { S.zuT = true; album_ton(i === 0 ? 'albSchnalle' : 'albZipp', { gain: .35, rate: i === 0 ? 1 : 1.3 }); album_buehne('beutel', false); }
    beutel_pose(P.weg, P.hand, 1 - album_io((t - .34) / .62), Z); if (t > 1.02) { S.zuT = S.zuT0 = false; S.klappe = false; beutel_ende(); return; } }
  else { const hp = P.hand; Z.position.set(hp.p[0] + Math.sin(t * .6) * .003, hp.p[1] + Math.sin(t * 1.1) * .0025, hp.p[2]); beutel_tmp.e0.set(hp.r[0] + Math.sin(t * .7) * .008, hp.r[1] + Math.sin(t * .4) * .012, hp.r[2]); Z.quaternion.setFromEuler(beutel_tmp.e0); }
  album_folge(R, Z, S.rv, dt);
  // Klappe: lockere Lederfeder, prallt am Rücken der Tasche ab; Stoff: Durchhängen/Zusammensacken als gedämpfte Federn
  if (i === 0) { const a = 70 * (F.ziel - F.a) - 2 * .32 * 8.4 * F.v; F.v += a * h; F.a += F.v * h; if (F.a < -2.12) { F.a = -2.12; F.v = -F.v * .3; } if (F.a > .02) { F.a = .02; F.v = -F.v * .25; } beutel_klappe(F.a); }
  { const a = 120 * (G.ziel - G.x) - 2 * .3 * 11 * G.v; G.v += a * h; G.x += G.v * h; const b = -160 * G.s - 2 * .28 * 12.6 * G.sv; G.sv += b * h; G.s += G.sv * h;
    const U = S.giveU && S.giveU[i]; if (U) { U.uGive.value = G.x; U.uSq.value = Math.max(-.6, Math.min(.6, G.s)); U.uSway.value = Math.sin(t * 1.3) * .15 + G.v * .02; } }
  if (typeof album_haendeTick === 'function') album_haendeTick(dt, true);
  const I = S.insp; if (I) { I.t += dt; const g = I.g; if (!I.drag) I.yaw += dt * .35;
    if (!I.zurueck) { const k = album_out(I.t / .45); g.position.set(.02 + (.05 - .02) * k, -.1 + .09 * k, -.5 + .2 * k); } else { const k = album_io(I.t / .35); g.position.set(.05 - .03 * k, -.01 - .09 * k, -.3 - .2 * k); if (k >= 1) { g.visible = false; S.insp = null; $('beutelOv').classList.add('auf'); } }
    beutel_tmp.e1.set(.35 + Math.sin(t * .5) * .05, I.yaw, .1); g.quaternion.setFromEuler(beutel_tmp.e1); } }
addEventListener('keydown', e => { const S = beutel_S; if (e.repeat || !S.ready) return;
  if (S.open) { if (ui.overlay !== 'beutelOv') return; e.preventDefault(); e.stopPropagation(); if (e.code === 'Escape' || e.code === album_tasten.beutel) { if (S.insp) beutel_inspZurueck(); else if (S.kombi) { S.kombi = null; beutel_render(false); } else beutel_zu(); } return; }
  if (e.code === album_tasten.beutel && state.started && !ui.overlay && !ui.paused && !state.talking && !(typeof GL !== 'undefined' && GL.lost)) beutel_auf(); }, true);
addEventListener('mousedown', e => { const I = beutel_S.insp; if (!beutel_S.open || !I || e.button !== 0) return; I.drag = e.clientX; I.dx0 = e.clientX; });
addEventListener('mousemove', e => { const I = beutel_S.insp; if (!I || !I.drag) return; I.yaw += (e.clientX - I.drag) * .012; I.drag = e.clientX; });
addEventListener('mouseup', e => { const I = beutel_S.insp; if (!I || !I.drag) return; const moved = Math.abs(e.clientX - I.dx0) > 6; I.drag = null; if (!moved) beutel_inspZurueck(); });

// ================================================================ Größere Beutel finden (Welt)
// An die nächste Wand / das nächste Wrack lehnen (Strahlen in 16 Richtungen, 3,5 m): Rücken zur Wand, leicht gekippt
function beutel_anlehnen(F) { const L = [], x = F.at[0], z = F.at[1]; scene.traverse(o => { if (!o.isMesh || !o.visible || o.isInstancedMesh || o.isSkinnedMesh || !o.geometry || !o.material || o.material.visible === false || o.material.transparent) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const c = o.geometry.boundingSphere.center.clone().applyMatrix4(o.matrixWorld), r = o.geometry.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis(); if (r < 40 && Math.hypot(c.x - x, c.z - z) < r + 3.5) L.push(o); });
  const R = new THREE.Raycaster(); R.far = 3.5; const y0 = (typeof solidGround === 'function' ? Math.max(0, solidGround(x, 1.5, z)) : 0) + .45, C = [];
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, d = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)); R.set(new THREE.Vector3(x, y0, z), d); let h; try { h = R.intersectObjects(L, false)[0]; } catch (e) { h = null; } if (h) C.push({ h, a, d }); }
  C.sort((p, q) => p.h.distance - q.h.distance);
  // nicht in die Klickfläche eines anderen Dings stellen (sonst greift man den Heuballen statt des Rucksacks)
  const boxes = interactables.filter(o => o.geometry).map(o => new THREE.Box3().setFromObject(o).expandByScalar(.15)), back = F.stufe === 3 ? .26 : .2;
  for (const c of C) { const px = c.h.point.x - c.d.x * back, pz = c.h.point.z - c.d.z * back, p = new THREE.Vector3(px, y0 - .1, pz); if (boxes.some(b => b.containsPoint(p))) continue;
    F.at = [px, pz]; F.ry = c.a + Math.PI + (F.dreh || 0); F.lean = F.lean || .08; F.wand = c.h.object.name || 'Wand'; return; } }
async function beutel_weltBau() { const S = beutel_S;
  for (const F of BEUTEL_FUNDE) { try { const src = await msModel(BEUTEL_STUFEN[F.stufe - 1].key, 'model.glb'); const g = src.clone(true); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      const w = new THREE.Group(); w.add(g); beutel_anlehnen(F); const y = typeof solidGround === 'function' ? Math.max(0, solidGround(F.at[0], 1.5, F.at[1])) : 0; w.position.set(F.at[0], y > -1 ? y : 0, F.at[1]); w.rotation.set(-F.lean, F.ry, 0, 'YXZ'); w.userData.noCol = true; scene.add(w);
      const hit = box(.6, .7, .6, F.at[0], w.position.y + .35, F.at[1], hidden, { cast: false }); interact(hit, () => BEUTEL_STUFEN[F.stufe - 1].n + ' nehmen', () => beutel_finden(F)); F.w = w; F.hit = hit; S.welt.push(F); } catch (e) { console.warn('Beutel: Fundort', e); } }
  beutel_weltSync(true); }
function beutel_weltSync(force) { const S = beutel_S, k = album_kap(); if (!force && S.kSync === k && S.stSync === S.stufe) return; S.kSync = k; S.stSync = S.stufe;
  for (const F of S.welt) { const on = S.stufe < F.stufe && !S.gef.has(F.stufe) && F.k.includes(k); F.w.visible = on; if (on) { if (!interactables.includes(F.hit)) interactables.push(F.hit); } else uninteract(F.hit); } }
function beutel_finden(F) { const S = beutel_S; if (S.stufe >= F.stufe) return; S.gef.add(F.stufe); album_ton('albStoff', { gain: .45 }); openNote(F.titel, F.text, 'beutel_' + F.stufe, () => { beutel_upgrade(F.stufe); }); beutel_weltSync(true); }
function beutel_upgrade(n, still) { const S = beutel_S; if (n <= S.stufe) return; const alt = S.stufe; S.stufe = n; beutel_weltSync(true); if (still) return;
  questPop('AUSRÜSTUNG', `${BEUTEL_STUFEN[n - 1].n} · ${BEUTEL_STUFEN[n - 1].fach} Fächer`); setTimeout(() => { if (!ui.overlay && !state.talking) beutel_auf(alt); }, 500); }

// ================================================================ Vorschau beim Anvisieren (passt / passt nicht)
function beutel_vorschau() { const S = beutel_S, el = $('beutelVor'); const tg = typeof target !== 'undefined' ? target : null; if (tg === S.tgt && S.vorT > 0) { S.vorT -= .1; return; } S.tgt = tg; S.vorT = .5;
  let need = null; if (tg && typeof TAUSCH_FUNDE !== 'undefined') { for (const F of TAUSCH_FUNDE) if (F.G && F.G.hit === tg) { need = [['glanz', F.w.length], ['batterie', F.bat || 0]]; break; }
    if (!need && typeof tausch_S !== 'undefined') for (const D of tausch_S.dropG) if (D.G && D.G.hit === tg) { need = [['glanz', D.was.ware ? 1 : 0], ['batterie', D.was.bat || 0]]; break; } }
  let txt = ''; if (need) { const ok = need.every(([a, n]) => !n || beutel_platz(a, n)), st = BEUTEL_STUFEN[S.stufe - 1], z = beutel_zaehl();
    txt = ok ? `✓ passt · ${st.n} ${beutel_faecher(z)}/${st.fach}` : `✗ ${st.n} voll · tauschen oder ablegen [${album_tastenName(album_tasten.beutel)}]`; el.classList.toggle('nein', !ok); }
  if (txt !== S.vor) { S.vor = txt; if (txt) el.textContent = txt; el.classList.toggle('on', !!txt && !ui.overlay); } }

// ================================================================ Hüllen um fremde Stellen (nur Aufrufstellen)
// Batterien: was nicht mehr passt, legt Luke sichtbar ab (bleibt gespeichert liegen) – nie Verlust
addBattery = (o => function (n = 1) { const S = beutel_S; if (!S.ready || typeof tausch_drop !== 'function') return o.call(this, n); const frei = beutel_frei('batterie');
  if (n <= frei) return o.call(this, n); if (frei > 0) o.call(this, frei); const rest = n - frei; beutel_ablegen({ bat: rest }, rest);
  setTimeout(() => toast(`Kein Platz mehr für ${rest === 1 ? 'die Batterie' : rest + ' Batterien'} – du legst ${rest === 1 ? 'sie' : 'sie'} vor dir ab. ` + (S.stufe < 3 ? 'Ein größerer Beutel wäre gut.' : `[${album_tastenName(album_tasten.beutel)}] öffnen und umräumen.`), 5200), 400); })(addBattery);
function beutel_reiter(B) { const S = beutel_S, st = BEUTEL_STUFEN[S.stufe - 1], z = beutel_zaehl(), L = beutel_stapel();
  B.innerHTML = `<h2>${st.n.toUpperCase()} · ${beutel_faecher(z)} / ${st.fach} FÄCHER</h2><p style="font:21px/1.25 Caveat,cursive;color:#2a2a3a">${st.d}</p>
    <ul>${L.map(s => `<li>${s.name}${s.n > 1 ? ' × ' + s.n : ''}${s.sub ? ' <small>' + s.sub + '</small>' : ''}</li>`).join('') || '<li><small>Leer.</small></li>'}</ul>
    <p style="color:var(--pdim,#5a4a35);font-size:15px">Story-Gegenstände stecken in der Jacke und zählen nicht. <kbd style="font:600 11px Georgia;border:1px solid rgba(124,36,24,.5);padding:1px 6px">${album_tastenName(album_tasten.beutel)}</kbd> öffnen</p>
    <button class="btReiterAuf" style="font:600 11px Georgia;letter-spacing:.2em;padding:6px 14px;cursor:pointer">ÖFFNEN</button>`;
  B.querySelector('.btReiterAuf').onclick = e => { e.stopPropagation(); if (ui.overlay === 'journal') closeOverlay(); setTimeout(() => beutel_auf(), 60); }; }
WORLD_MODS.push(['Beutel', async () => {
  const S = beutel_S; if (typeof album_B === 'undefined' || !album_B.ready) { console.warn('Beutel: keine Bühne (album.js fehlt) – Beutel ohne Ansicht, Kapazität unbegrenzt'); return; }
  beutel_tmp.e0 = new THREE.Euler(); beutel_tmp.e1 = new THREE.Euler(); beutel_tmp.T = new THREE.Object3D(); S.rv = new THREE.Vector3(); S.fl = { a: 0, v: 0, ziel: 0 }; S.give = { x: 0, v: 0, ziel: 0, s: 0, sv: 0 }; beutel_tmp.q0 = new THREE.Quaternion(); beutel_tmp.q1 = new THREE.Quaternion(); beutel_tmp.v = new THREE.Vector3();
  await beutel_modelle(); await beutel_bildchen(); await beutel_weltBau();
  if (typeof tausch_voll === 'function') tausch_voll = function () { beutel_vollHinweis(); return false; };
  album_buehneVorbereiten(); S.ready = true;
  if (typeof sammeln_reiter === 'function') sammeln_reiter('beutel', () => BEUTEL_STUFEN[beutel_S.stufe - 1].n.toUpperCase(), beutel_reiter, null, '#7d6a52');
  window.__beutel = { S: beutel_S, auf: beutel_auf, zu: beutel_zu, upgrade: beutel_upgrade, platz: beutel_platz, zaehl: beutel_zaehl, faecher: beutel_faecher, finden: beutel_finden, render: beutel_render, aktion: beutel_aktion, waehle: beutel_waehle, untersuchen: beutel_untersuchen, T: typeof tausch_S !== 'undefined' ? tausch_S : null, SAVE: MOD_SAVE, FLASH, licht: v => { flashOn = v; }, addBattery: n => addBattery(n) }; // Testzugriff
}]);
WORLD_TICK.push(dt => { const S = beutel_S; if (!S.ready) return; if (window.__x5slow) dt *= window.__x5slow; beutel_tick(dt); S.chk = (S.chk || 0) - dt; if (S.chk <= 0) { S.chk = .1; beutel_vorschau(); beutel_weltSync(false); } });
MOD_SAVE.push(['beutel', () => ({ stufe: beutel_S.stufe, gef: [...beutel_S.gef] }), v => { const S = beutel_S; if (!v) return; S.stufe = Math.max(1, Math.min(3, v.stufe | 0 || 1)); S.gef = new Set(v.gef || []); if (S.ready) beutel_weltSync(true); }]);
beginGame = (o => function (resume) { const r = o.apply(this, arguments); if (!resume && state.started) { beutel_S.stufe = 1; beutel_S.gef.clear(); if (beutel_S.ready) beutel_weltSync(true); } return r; })(beginGame);
renderJournal = (o => () => { o(); try { if (jTab !== 'inventar' || !beutel_S.ready) return; const B = $('jBody'), S = beutel_S, st = BEUTEL_STUFEN[S.stufe - 1]; const d = document.createElement('p'); d.style.cssText = 'margin-top:16px;color:var(--dim);font-size:15px';
  d.innerHTML = `${st.n}: ${beutel_faecher(beutel_zaehl())} / ${st.fach} Fächer belegt · <kbd style="font:600 11px Georgia;border:1px solid rgba(201,163,106,.6);padding:1px 6px;color:var(--gold)">${album_tastenName(album_tasten.beutel)}</kbd> öffnen`; B.appendChild(d); } catch (e) {} })(renderJournal);
