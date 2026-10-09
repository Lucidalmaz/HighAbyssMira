// =====================================================================  KAPITEL 3 · „Ich komme“ – Hauptweg auf der Straße (Modul „kapitel3“, AP-17, Fassung 3)
// Quelle: story_final.md, Kapitel 3 (Unterkapitel 1–10), Umsetzungsnotizen; Q-9 (A-10 Kein Draußen sichtbar, A-12 Stille nach der Kuh, A-25 keine erzählenden Angst-Untertitel,
// A-26 kein Schrei bei Luna/Graukind/Behaltenen). Wortlaute unverändert aus der Bibel.
// Ablauf hier: UK 2 (Kuh untersuchen, Polaroid „Sieben und ein halber“, Vegas durch die Tür) · UK 3 (Telefon, Regel 6) · UK 4 (Auslöser für Justin nach dem Anruf)
//   · UK 5 („Kein Draußen“ an Ost- und Südsperre, AG-09 an der Haltestelle) · UK 6 (Zählbuch, Nachbild 2009 mit der neunten Gestalt) · UK 8 (Graukind jagt „Ochs am Berg“,
//   Freimal, Augen zu aus ihren Augen, AG-10, Whiskey still auf dem Dach von Nr. 1) · UK 9 (AG-08, zweiter Riegel, grauer Kasten, Hufeisen) · UK 10 (die Behaltenen,
//   Eisen ist Freimal, Lichtsäule, B-K3-08, die Hand) · Weiterspielen mitten im Kapitel (Speicherstand „kapitel3“).
// Intro/Funk/Laternenkästen: lucy3.js · Nimmerheim: weiss.js · Justin: justin.js (AP-12) · Agentenszenen: lwo.js (AG-08/09/10).
// Schnittstellen für AP-18: kapitel3_uk() · kapitel3_nebenOffen() · kapitel3_jagd() · kapitel3_erstarren(sek) · KAPITEL3_LATERNE4.push(fn) · KAPITEL3_EISEN.push([x, z, r]).
const kapitel3_S = { uk: 0, kuh: new Set(), kuhHits: [], kuhFluch: false, kuhEnde: -1, vegasKuh: false, ringAb: -1, ringT: 0, callT: -1, draussen: 0, loopBusy: false, justinWacht: false,
  ag09: false, ag10: false, ag08: false, buch: false, buchN: 0, nb09: false, riegel: false, huf: false, laden: null, resumed: false, tafel: false, leine: null,
  jagd: { on: false, t: 0, pause: 0, seen: 0, stepT: 0, caught: 0, frei: 0, freiAn: false, freiWo: null, freiErst: false, qT: 0, wolter: false }, starr: 0,
  beh: { on: false, t: 0, frei: 0, freiAn: false, vegas: false, zweit: false }, kette: false, handT: 0, kum: false, nb: null, ohr: null, tick: 0 };
const KAPITEL3_LATERNE4 = [], KAPITEL3_EISEN = [];
const KAPITEL3_ZIEL_LATERNEN = 'Die Laternen müssen aus, dann muss sie herunter. Wie, steht bei Frau Wendt in Nr. 7 – und der Funkkasten an der Kreuzung spricht noch.'; // F3 Verständlichkeit: Ziel + Grund (Justin)
const _k3v = new THREE.Vector3(), _k3v2 = new THREE.Vector3(), _k3d = new THREE.Vector3();
function kapitel3_uk() { return kapitel3_S.uk; }
function kapitel3_uk_setzen(n) { if (n > kapitel3_S.uk) kapitel3_S.uk = n; }
function kapitel3_nebenOffen() { return !!(ch3.on && ch3.part !== 'white' && kapitel3_S.uk >= 5 && !ch3.lampsOff); }
function kapitel3_jagd() { return kapitel3_S.jagd.on; }
function kapitel3_erstarren(sek) { kapitel3_S.starr = Math.max(kapitel3_S.starr, +sek || 0); }
// Glocken-Joker (AP-18, neben3.js): vor jedem Fang fragen; solange alles erstarrt ist, bewegt sich niemand
function kapitel3_joker() { return typeof neben3_glockeFang === 'function' && !!neben3_glockeFang(); }
function kapitel3_frost() { return typeof neben3_frost === 'function' && !!neben3_frost(); }
function kapitel3_k3() { return ch3.on && (typeof kap !== 'function' || kap() === 3); }
function kapitel3_speichern() { try { if (typeof saveGame === 'function') saveGame(3); } catch (e) {} }
function kapitel3_lore(key, title, html) { const i = story.lore.findIndex(l => l.key === key), e = { key, title, html }; if (i >= 0) story.lore[i] = e; else story.lore.push(e); }
MOD_SAVE.push(['kapitel3', () => { const S = kapitel3_S; return { uk: S.uk, kuh: [...S.kuh], call: ch3.callDone, met: ch3.met, draussen: S.draussen, ag09: S.ag09, ag10: S.ag10, ag08: S.ag08,
  buch: S.buch, nb09: S.nb09, riegel: S.riegel, huf: S.huf, radio: ch3.radio, seq: ch3.seq.slice(), lampsOff: ch3.lampsOff, kette: S.kette, cow: ch3.cowSeen, vegasKuh: S.vegasKuh }; },
  v => { kapitel3_S.laden = v && typeof v === 'object' ? v : null; }]);

// ---------------------------------------------------------------- UK 2 · „Blinde Kuh“: drei Stellen untersuchen (A-12: erst am dritten Punkt der Fluch-Gag)
const KAPITEL3_KUH = {
  ohr: ['Ohrmarke', 'Gelbe Ohrmarke. Hof Aydın. Die stand gestern noch auf der Weide hinterm Stall. Die stand gestern noch überhaupt.'],
  kopf: ['Kopf', 'Die Augen fehlen. Kein Blut. Die Ränder sind glatt, wie mit einem Löffel. Als hätte jemand sie sich nur mal angucken wollen.'],
  flanke: ['Flanke', 'In die Haut gebrannt: sieben Kreise. Und ein halber achter. Sie hat aufgehört, bevor sie fertig war.'] };
function kapitel3_kuhLage() { // Mitte, Längsachse (Kopf), Oberseite der liegenden Kuh
  const g = cowFx.g, A = typeof kino_S !== 'undefined' ? kino_S.kuh : null; let hx = 1.05; try { if (FAB.cow) { const b = new THREE.Box3().setFromObject(FAB.cow); hx = (b.max.x - b.min.x) / 2; } } catch (e) {}
  const yaw = g.rotation.y, ax = Math.cos(yaw), az = -Math.sin(yaw), top = A && A.top ? A.top : .9;
  return { x: g.position.x, z: g.position.z, ax, az, hx, top }; }
function kapitel3_flanke() { return typeof kino_S !== 'undefined' && kino_S.kuh && typeof kino_flanke === 'function' ? kino_flanke(0, 0) : null; }
function kapitel3_kuhStellen() {
  const S = kapitel3_S; if (S.kuhHits.length || !cowFx.done) return; if (typeof cowHit !== 'undefined') { uninteract(cowHit); cowHit.position.set(0, -800, 0); }
  const L = kapitel3_kuhLage(), head = [L.x + L.ax * L.hx * .82, L.z + L.az * L.hx * .82];
  const pos = { ohr: [head[0] - L.ax * .15, L.top * .75, head[1] - L.az * .15], kopf: [head[0], L.top * .55, head[1]], flanke: [L.x - L.ax * .2, L.top - .1, L.z - L.az * .2] };
  for (const [k, p] of Object.entries(pos)) { const b = box(k === 'flanke' ? 1.1 : .55, .6, k === 'flanke' ? 1.1 : .55, p[0], p[1], p[2], hidden, { cast: false }); b.userData.noCol = true;
    interact(b, () => S.kuh.has(k) ? '' : 'Kuh untersuchen · ' + KAPITEL3_KUH[k][0], () => kapitel3_kuhUntersuchen(k, b)); S.kuhHits.push(b); }
  // Brandzeichen auf der Flanke bleibt sichtbar (Kinosequenz blendet ihres aus)
  try { if (typeof kino_tex_brand === 'function' && !S.brand) { const f = kapitel3_flanke() || [L.x, L.top, L.z];
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), new THREE.MeshStandardMaterial({ map: tex(kino_tex_brand(), true), transparent: true, depthWrite: false, roughness: .95, polygonOffset: true, polygonOffsetFactor: -4 }));
      m.position.set(f[0], f[1] + .005, f[2]); m.lookAt(f[0], f[1] + 1, f[2]); m.rotateZ(typeof kino_S !== 'undefined' && kino_S.kuh ? kino_S.kuh.ry : 0); m.userData.noCol = true; scene.add(m); S.brand = m; } } catch (e) { console.warn('Kap. 3 Brandzeichen', e); } }
async function kapitel3_kuhUntersuchen(k, b) {
  const S = kapitel3_S; if (S.kuh.has(k) || state.talking) return; S.kuh.add(k); uninteract(b); state.talking = true;
  try { await say([[KAPITEL3_KUH[k][1], 5200, 'LUKE']]);
    if (k === 'flanke') await kapitel3_polaroid();
    if (S.kuh.size === 3 && !S.kuhFluch) { S.kuhFluch = true; await wait(900); // A-12: der Gag erst beim dritten Punkt; Whiskey spricht beim dritten Mal mit
      await say([['Scheiße.', 1400, 'DU']]); if (typeof whiskey_fluch === 'function') whiskey_fluch(); await wait(700);
      await say([['Scheiße.', 1400, 'DU']]); if (typeof whiskey_fluch === 'function') whiskey_fluch(); await wait(700);
      const w = typeof whiskey_fluch === 'function' && whiskey_fluch(); await say([['Scheiße.', 1600, w ? 'WHISKEY und DU' : 'DU']]);
      if (!w) await say([['Das ist mein Wort. Such dir ein eigenes.', 2800, 'DU']]); else await wait(1600);
      S.kuhEnde = ch3.t; } }
  finally { state.talking = false; }
  if (S.kuh.size === 3 && S.ringAb < 0) S.ringAb = ch3.t + 25; }
// Luke fotografiert die Flanke automatisch: echtes Bild aus der Spielkamera (kamera.js), der halbe Kreis leuchtet nach
async function kapitel3_polaroid() {
  let bild = null; const f = kapitel3_flanke();
  try { if (typeof kamera_render === 'function') { const yaw0 = player.yaw, pit0 = player.pitch; if (f) { const dx = f[0] - camera.position.x, dy = f[1] - camera.position.y, dz = f[2] - camera.position.z; player.yaw = Math.atan2(-dx, -dz); player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ'); camera.updateMatrixWorld(true); }
      Audio.play('switch1', { gain: .35, rate: 1.8 }); const c = kamera_render(null, { fov: 34, blitz: .8 }); player.yaw = yaw0; player.pitch = pit0;
      const im = typeof c === 'string' ? await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = c; }) : c; /* kamera_render liefert eine Bild-URL, kein Canvas */ const o = document.createElement('canvas'); o.width = im.width; o.height = im.height; const x = o.getContext('2d'); x.drawImage(im, 0, 0);
      x.globalCompositeOperation = 'lighter'; const cx = o.width * .56, cy = o.height * .5, g = x.createRadialGradient(cx, cy, 6, cx, cy, 46); g.addColorStop(0, 'rgba(255,236,190,.55)'); g.addColorStop(1, 'rgba(255,200,120,0)');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 46, -Math.PI / 2, Math.PI / 2); x.fill(); x.strokeStyle = 'rgba(255,240,205,.8)'; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, 20, -Math.PI / 2, Math.PI / 2); x.stroke(); bild = o; } } catch (e) { console.warn('Kap. 3 Polaroid', e); }
  const hinten = 'Aydıns Gescheckte. Vom Himmel. Augen weg.\nSieben Kreise und ein halber. Wer zählt so?\nEiner, der bei acht noch nicht weiß, wie es weitergeht.';
  if (typeof album_abheften === 'function') try { await album_abheften('k3_kuh', { bild, art: 'pola', serie: 'sonst', notiz: 'Sieben und ein halber', hinten }); } catch (e) { console.warn('Album', e); }
  kapitel3_lore('k3_polaroid', 'Sieben und ein halber', '<span class="hand">' + hinten.replace(/\n/g, '\n') + '</span>'); questPop('POLAROID', 'Sieben und ein halber'); }

// ---------------------------------------------------------------- UK 3 · „Du hast mich freigeschlagen“: das Telefon (ersetzt c3Phone der Basis)
async function kapitel3_telefon() {
  const S = kapitel3_S; if (state.talking) return;
  if (ch3.callDone || !ch3.ringing) { state.talking = true; handset(true);
    // 3.5 „Der Riss“: steht Justin dabei, nimmt er den Hörer selbst in die Hand (einmal)
    if (ch3.met && typeof justin_sprich === 'function' && jDist() < 7 && !justin_S.said.has('riss')) { await wait(900); handset(false); await justin_sprich('riss', { frei: false }); state.talking = false; return; }
    setTimeout(() => { toast('Tot. Nur dein eigener Atem in der Muschel.'); handset(false); state.talking = false; }, 1500); return; }
  state.talking = true; ch3.ringing = false; ch3.callDone = true; S.ringAb = -2; handset(true); await wait(700);
  const L = 'LUCYS STIMME', K = 'KINDERSTIMME', d = Audio.ctx ? Audio.at(player.pos.x, 1.6, player.pos.z, .6) : null;
  try {
    await say([['„Haus Nummer sieben. Der Keller.“', 3000, L], ['Das ist der Anruf, der mich hergeholt hat. Wort für Wort.', 3200]]);
    if (typeof lucy3_tines === 'function') lucy3_tines(5.5, d, .7); // unter der Stimme fängt leise eine Spieluhr an
    await say([['„Haus … Nummer … sieben …“', 3800, L]]);
    // Spieleraktion: auflegen – der Hörer bleibt am Ohr
    await kapitel3_auflegenVersuch();
    if (typeof lucy3_tines === 'function') lucy3_tines(7, d, .9);
    await say([['„Das war nicht Lucy, Bruder. Das war ich. Ich war im Keller.“', 4400, K], ['„Du hast mich freigeschlagen. Danke.“', 3600, K]]);
    Audio.play('static', { gain: .05, dur: 1.2, hp: 400 }); await wait(400); for (let i = 0; i < 3; i++) { Audio.ring(.02); await wait(620); } // Freizeichen
    handset(false);
    const P = player.pos, bx = P.x + Math.sin(player.yaw) * .45, bz = P.z + Math.cos(player.yaw) * .45; Audio.giggle(bx, 1.55, bz); // direkt hinter Luke, im Nacken
    if (typeof beob_spur === 'function') try { beob_spur('beschlag', { pos: [8, 1.45, 8.1], ry: 0, frisch: true }); } catch (e) {} // ∴ in der Scheibe der Telefonzelle, mit einem Finger gezogen (S-03)
    await wait(2600); await say([['Ich hab die Kellertür aufgemacht.', 2800, 'DU']]);
  } finally { state.talking = false; }
  if (typeof mystFound === 'function') mystFound('stimme');
  kapitel3_lore('c3stimme', 'Die Stimme am Telefon', '„Haus Nummer sieben. Der Keller.“ Derselbe Anruf. Dann wird die Stimme jung, mit Spieluhr darunter: „Das war nicht Lucy, Bruder. Das war ich. Ich war im Keller. Du hast mich freigeschlagen. Danke.“\n\n<span class="hand">Hilde hat unten was eingesperrt. Ich hab’s rausgelassen. Was hab ich rausgelassen?</span>');
  questPop('NACHBILD', 'Die Stimme am Telefon'); S.callT = ch3.t; kapitel3_uk_setzen(3); kapitel3_speichern(); }
function kapitel3_auflegenVersuch() { return new Promise(res => { let fertig = false; const t0 = performance.now();
  const hint = document.createElement('div'); hint.id = 'k3auflegen'; hint.style.cssText = 'position:fixed;left:50%;bottom:23%;transform:translateX(-50%);font:600 14px "Cormorant Garamond",Georgia,serif;letter-spacing:.32em;color:#e9dfc8;text-shadow:0 0 2px #000,0 0 10px #000;opacity:0;transition:opacity .5s;pointer-events:none';
  hint.innerHTML = '<b style="display:inline-block;min-width:30px;height:30px;line-height:30px;text-align:center;border:1px solid rgba(201,163,106,.7);border-radius:3px;background:rgba(8,7,6,.62);margin-right:12px;letter-spacing:0">E</b>AUFLEGEN';
  document.body.appendChild(hint); requestAnimationFrame(() => hint.style.opacity = 1);
  const ende = () => { if (fertig) return; fertig = true; removeEventListener('keydown', key, true); hint.style.opacity = 0; setTimeout(() => hint.remove(), 600); res(); };
  const key = e => { if (e.code !== 'KeyE') return; e.preventDefault(); e.stopImmediatePropagation(); shake = Math.max(shake, .012); Audio.play('woodHit1', { gain: .05, rate: 2.4 }); setTimeout(ende, 700); };
  addEventListener('keydown', key, true); const iv = setInterval(() => { if (performance.now() - t0 > 5200) { clearInterval(iv); ende(); } if (fertig) clearInterval(iv); }, 100); }); }

// ---------------------------------------------------------------- UK 5 · „Kein Draußen“: Ost- und Südsperre führen zurück (hinter die Haltestelle am Kirchweg), A-10
const KAPITEL3_RAUS = { ost: { t: P => P.x > 139 && Math.abs(P.z) < 12, j: [134, .6, -Math.PI / 2] }, sued: { t: P => P.z < -43.6 && Math.abs(P.x) < 7, j: [.6, -40.5, PI] } };
const KAPITEL3_HALT = { aus: [10.4, 66.5, 0], kombi: [3.4, 52.4, 0], bank: [11.55, 52.75], wolterRy: -Math.PI / 2 };
async function kapitel3_raus(wo) {
  const S = kapitel3_S; if (S.loopBusy) return; S.loopBusy = true; S.draussen++; state.talking = true; const zweit = S.draussen >= 2;
  try { const fd = $('fade'); fd.style.background = '#c9ced4'; await fade(1, 900);
    const A = KAPITEL3_HALT.aus; player.pos.set(A[0], 0, A[1]); player.yaw = A[2]; player.pitch = 0; vel.set(0, 0, 0); camY = 1.65;
    if (zweit && !S.spuren) kapitel3_spuren(A[0], A[1]); // A-10: frische Abdrücke in Lukes Größe, die in den Nebel hineinführen
    await wait(500); fd.style.transition = 'opacity 1400ms'; fd.style.opacity = 0; await wait(1400); fd.style.background = '#000';
    // R-1 (Story-Prüfung): die Telefonzelle klingelt beim zweiten Hinausgehen nicht mehr – in Kap. 3 klingelt sie nur für den Anruf
    if (S.draussen === 1) { kapitel3_uk_setzen(5); if (typeof lwo_ag09 === 'function' && !S.ag09) { S.ag09 = true; lwo_ag09().then(() => kapitel3_speichern()).catch(e => console.error('AG-09', e)); } }
  } finally { state.talking = false; S.loopBusy = false; } }
// Beim zweiten Versuch steht Justin am Ausgang, ohne dass er gegangen wäre
async function kapitel3_justinAmAusgang(wo) {
  const S = kapitel3_S, J = KAPITEL3_RAUS[wo].j; if (S.justinWacht) return; S.justinWacht = true; jPlace(J[0], J[1], J[2]); justin.g.visible = true; justin.look = true;
  const warte = () => new Promise(r => { const iv = setInterval(() => { if (jDist() < 7 || !ch3.on) { clearInterval(iv); r(); } }, 200); }); await warte();
  while (state.talking) await wait(200); state.talking = true;
  try { await say([['„Hier gibt es kein Draußen, Kind. Nicht, bis sie aufhört zu suchen.“', 4400, JS], ['Und die Leute?', 1800, 'DU'], ['„Wer nie drin war, schläft wie ein Stein. Dein Nachbar mit der Kette war drin. Der schläft nicht.“', 5200, JS]]); }
  finally { state.talking = false; } S.justinDa = true; jWalk(3, -3.5, () => { justin.look = true; }); }
function kapitel3_spuren(x, z) { const S = kapitel3_S; S.spuren = true;
  const c = document.createElement('canvas'); c.width = 64; c.height = 160; const g = c.getContext('2d'); g.fillStyle = 'rgba(18,20,22,.62)'; g.beginPath(); g.ellipse(32, 50, 20, 40, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(32, 128, 16, 22, 0, 0, 7); g.fill();
  g.globalCompositeOperation = 'destination-out'; for (let y = 18; y < 88; y += 8) g.fillRect(14, y, 36, 3); for (let y = 112; y < 146; y += 7) g.fillRect(18, y, 28, 2.5);
  const m = new THREE.MeshStandardMaterial({ map: tex(c, true), transparent: true, depthWrite: false, roughness: .15, metalness: .05, polygonOffset: true, polygonOffsetFactor: -3 });
  const geo = new THREE.PlaneGeometry(.12, .3); geo.rotateX(-Math.PI / 2); const n = 14, im = new THREE.InstancedMesh(geo, m, n), M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1; p.set(x + side * .13, .02 + i * .0002, z + 1.2 + i * .68); q.setFromAxisAngle(_k3d.set(0, 1, 0), Math.PI + (Math.random() - .5) * .1); s.set(side > 0 ? -1 : 1, 1, 1); im.setMatrixAt(i, M4.compose(p, q, s)); }
  im.computeBoundingSphere(); im.userData.noCol = true; scene.add(im); S.spurMesh = im; }

// ---------------------------------------------------------------- UK 6 · „Es sind immer acht“: Hildes Zählbuch (ersetzt readBook), Nachbild 2009 an der Kreuzung
function kapitel3_zaehlbuch() {
  const S = kapitel3_S; S.buchN++; if (typeof addItem === 'function') addItem('buch');
  const sie = S.buchN >= 2 ? '<u>SIE</u>' : 'SIE'; // S-09: beim zweiten Öffnen ist „SIE“ mit Bleistift unterstrichen (der Beobachter)
  const html = '<i>Ein grünes Kassenbuch mit Stoffrücken. Dreißig Jahre Nächte. Drei Seiten sind aufgeschlagen.</i>\n\n<span class="hand">Es sind immer acht. Vegas zählt sieben. Er sieht den Achten nicht, der sieht ihn.\nSeit dem 31.: neun. Ich höre neun Paar Füße. Eins ist ganz klein. Keins von unseren.\nKeins mit fünf Zehen.</span>\n\n'
    + '<span class="hand">Laternen aus, dieses Jahr: im Juni vor 5 (Roxy). Im Juli vor 3 (Mike).\nEnde Oktober vor 1 (Lucy). Sie holt sie, wie wir sie hergegeben haben.\nWenn sie mich holt, geht meine aus. Dann sind es vier.\nFrüher kam sie im Sommer, zum Fest. Ohne Lampions wartet sie auf Martini. Auf ihre Nacht.</span>\n\n'
    + `<span class="hand">Wenn ich weg bin: Notfunk auf dem Tag, an dem ${sie} kam. Nicht Lucy. ${sie}.\nKanal nicht das, was zuerst antwortet.\nZayn, ich hab gezählt. Jede Nacht. Ich hab nie falsch gezählt.</span>`;
  const fn = () => openNote('Hildes Zählbuch', html, 'c3buch', () => { if (typeof mystFound === 'function') mystFound('buch');
    if (!S.buch) { S.buch = true; kapitel3_uk_setzen(6); setTimeout(() => { if (!state.talking) subtitle('Der Tag, an dem SIE kam. Der 31. Der Kellercode. Hilde hat alles auf denselben Tag gelegt, damit sie nichts vergisst.', 6000, 'LUKE'); }, 600);
      if (!ch3.radio) setC3('Der Funkkasten an der Kreuzung. Welche Frequenz?'); kapitel3_speichern(); } });
  if (typeof zbook !== 'undefined' && zbook.visible !== false && typeof liftTo === 'function') liftTo(zbook, fn, false); else fn(); }
// Nachbild an der Kreuzung (optional): mit dem Buch in der Tasche an der Kreuzung, Taschenlampe aus
async function kapitel3_nachbild2009() {
  const S = kapitel3_S; if (S.nb09 || state.talking) return; S.nb09 = true; state.talking = true; const NB = S.nb || {};
  try { if (typeof figuren_memoryLook === 'function') figuren_memoryLook(true); Audio.whisper(4, 1.6, -2, 2.2); glitchV = .35;
    const figs = NB.figs || []; for (const f of figs) f.g.visible = true; NB.an = true; NB.t = 0;
    await say([['Fünf Kinder, barfuß, die Straße herunter, langsam wie im Schlaf.', 4200, 'NACHBILD · 2009'], ['Ein Mann in Rüstung, an der Hand ein Junge mit braunen Augen.', 4200, 'NACHBILD · 2009'],
      ['Am Nebelrand ein Junge im gestreiften Schlafanzug, der nicht mitkommt.', 4200, 'NACHBILD · 2009'], ['Auf der Treppe von Nr. 7 eine Frau in Nachtjacke: „… sieben. Acht.“', 4400, 'NACHBILD · 2009']]);
    NB.lampeT = 6; while (NB.lampeT > 0 && !NB.neun) { await wait(100); NB.lampeT -= .1; } // wer die Taschenlampe zweimal über das Bild fährt, sieht die neunte Gestalt
    for (const f of figs) f.g.visible = false; NB.an = false;
    if (typeof figuren_memoryLook === 'function') figuren_memoryLook(false);
    kapitel3_lore('c3_nb2009', 'Nachbild · Die Kreuzung, 2009', '<i>Fünf Kinder, barfuß, die Straße herunter, langsam wie im Schlaf.\nEin Mann in Rüstung, an der Hand ein Junge mit braunen Augen.\nAm Nebelrand ein Junge im gestreiften Schlafanzug, der nicht mitkommt.\nAuf der Treppe von Nr. 7 eine Frau in Nachtjacke: „… sieben. Acht.“</i>' + (NB.neun ? '\n\nGanz am Rand: eine neunte Gestalt. Klein. Weiß. Große dunkle Augen. Sie hat mitgezählt.' : ''));
    questPop('NACHBILD', 'Die Kreuzung, 2009');
    if (NB.neun && typeof whiskey_blick === 'function') try { whiskey_blick(new THREE.Vector3(NB.neunPos[0], .5, NB.neunPos[2])); setTimeout(() => whiskey_blick(null), 9000); } catch (e) {}
  } finally { state.talking = false; } }

// ---------------------------------------------------------------- UK 8 · Das Graukind jagt (Ochs am Berg), Freimal, Augen zu aus ihren Augen
function kapitel3_eisenPunkte() { // [x, z, r]: Laternenpfähle, Geländer Nr. 3, Zaun/Geländer Nr. 7, Funkkasten, Gullydeckel + AP-18
  const L = []; for (const l of lamps) if (Math.abs(l.wz) < 12 && l.wx > -90 && l.wx < 150) L.push([l.wx, l.wz, 1.05]);
  L.push([-27.3, -10.6, 1.1], [-26.2, -9.8, 1.1], [26, -11.4, 1.1], [24.5, -9.6, 1.1], [27.6, -9.6, 1.1], [5.4, -6.6, 1.05], [9, -1.3, 1.0]); for (const e of KAPITEL3_EISEN) L.push(e); return L; }
function kapitel3_amEisen() { const P = player.pos; if (!kapitel3_S.eisen || kapitel3_S.eisenN !== KAPITEL3_EISEN.length) { kapitel3_S.eisen = kapitel3_eisenPunkte(); kapitel3_S.eisenN = KAPITEL3_EISEN.length; }
  for (const e of kapitel3_S.eisen) { const dx = P.x - e[0], dz = P.z - e[1]; if (dx * dx + dz * dz < e[2] * e[2]) return e; } return null; }
function kapitel3_siehtHin(x, y, z, eng) { camera.getWorldDirection(_k3d); _k3v.set(x - camera.position.x, y - camera.position.y, z - camera.position.z); const d = _k3v.length() || 1; return _k3d.dot(_k3v) / d > eng; }
function kapitel3_jagdStart() { const J = kapitel3_S.jagd; if (J.on || ch3.lampsOff) return; J.on = true; J.pause = 4; J.caught = J.caught || 0; kapitel3_graukindSetzen(26);
  if (typeof whiskey_setzen === 'function') try { whiskey_setzen(-50.4, 7.3, -17.2); } catch (e) {} } // Whiskey sitzt still auf dem Dach von Nr. 1 – das allein ist die Warnung
function kapitel3_graukindSetzen(d) { const P = player.pos, f = flatDir(), a = Math.atan2(-f.x, -f.z) + rand(-.7, .7); grey.position.set(P.x + Math.sin(a) * d, 0, P.z + Math.cos(a) * d); grey.visible = true; grey.lookAt(P.x, 0, P.z); }
function kapitel3_jagdTick(dt) {
  const S = kapitel3_S, J = S.jagd; if (!J.on) return;
  if (ch3.lampsOff || ch3.part !== 'town' || !kapitel3_k3()) { J.on = false; grey.visible = false; return; }
  if (state.talking || ui.overlay || kapitel3_S.loopBusy || (typeof kino_S !== 'undefined' && kino_S.on) || state.zone || (typeof LWO !== 'undefined' && LWO.playing)) return;
  const P = player.pos; if (typeof indoorRect === 'function' && indoorRect()) { J.pause = Math.max(J.pause, 1.5); return; }
  if (J.pause > 0) { J.pause -= dt; return; }
  const dx = P.x - grey.position.x, dz = P.z - grey.position.z, d = Math.hypot(dx, dz) || .01;
  if (d > 70) { kapitel3_graukindSetzen(28); return; }
  // Freimal: Eisen anfassen macht drei Sekunden sicher; danach erst wieder nach Loslassen
  const e = kapitel3_amEisen(); if (e && !J.freiAn && J.frei <= 0) { J.frei = 3; J.freiAn = true; if (!J.freiErst) { J.freiErst = true; setTimeout(() => { if (!state.talking) subtitle('Ich hab noch nie einen Laternenpfahl so gern gehabt. Nicht mal nach Schützenfest.', 4200, 'DU'); }, 300); if (typeof sammeln_fibel === 'function') sammeln_fibel('R-K3d'); } }
  if (!e) J.freiAn = false; if (J.frei > 0) J.frei -= dt;
  const safe = J.frei > 0 || S.starr > 0 || kapitel3_frost(), seen = kapitel3_siehtHin(grey.position.x, .9, grey.position.z, .8) && d < 45;
  grey.rotation.y = Math.atan2(dx, dz);
  if (!J.hinweis && !seen && !safe && d < 22 && !J.caught) { J.hinweis = true; toast('Das Kind kommt näher, sobald du wegsiehst. Sieh es an – oder fass Eisen an: einen Laternenpfahl.', 5200); }
  if (seen) { J.seen += dt; grey.rotation.z = flashOn && d < 16 ? .22 : .1; } // steht still, den Kopf schief wie ein Kind, das wartet
  else if (safe) { grey.position.y = Math.abs(Math.sin(ch3.t * 7)) * .035; grey.rotation.z = 0; } // wippt ungeduldig auf den Zehen
  else { grey.rotation.z = 0; grey.position.y = 0; const sp = d > 14 ? 4.6 : 3.1; grey.position.x += dx / d * sp * dt; grey.position.z += dz / d * sp * dt;
    J.stepT -= dt; if (J.stepT <= 0) { J.stepT = .19; if (Audio.stepAt) Audio.stepAt(grey.position.x, grey.position.z, .16); } } // nackte Füße auf Asphalt, schnell
  if (!safe && d < 1.05) { if (kapitel3_joker()) return; kapitel3_erwischt(); } }
async function kapitel3_erwischt() { // keine Verletzung, kein Neustart: eine schon gelöschte Laterne geht wieder an, der Hebel steht wieder auf EIN
  const S = kapitel3_S, J = S.jagd; J.pause = 99; J.caught++; state.talking = true;
  try { const P = player.pos; Audio.whisper(P.x + .2, 1.5, P.z + .1, 1.2); shake = .02; glitchV = .5; await wait(500);
    subtitle('„Du bist.“', 2400, 'KINDERSTIMME'); toast('Hinter dir geht eine Laterne wieder an. Der Hebel steht auf EIN.', 3200); grey.visible = false; await wait(1300);
    const n = ch3.seq.pop(); if (n !== undefined) { const B = switchBoxes.find(b => b.n === n); if (B) { B.off = false; B.L.mode = 'pulse';
        if (Audio.ctx) { const L = B.L; Audio.play('lighterClick', { gain: .08, rate: .5, x: L.wx, y: 5, z: L.wz, ref: 6 }); } } } // eine Kerze, die jemand anpustet – nur rückwärts
  } finally { state.talking = false; } J.pause = 7; kapitel3_graukindSetzen(30); }
// „Augen zu“ (Q) hilft nicht mehr: eine Sekunde lang Luke selbst von hinten, aus ihren Augen (Regel 4, Ausnahme)
function kapitel3_ausIhrenAugen() { const S = kapitel3_S, J = S.jagd; if (!J.on || J.qBusy || state.talking || ui.overlay) return; J.qBusy = true;
  const B = S.lukeRueck, P = player.pos; if (B) { B.position.set(P.x, 0, P.z); B.rotation.y = player.yaw + Math.PI; B.visible = true; }
  const gx = grey.position.x, gz = grey.position.z; Audio.whisper(P.x, 1.5, P.z, 1); glitchV = .6;
  setCamOverride(cam => { cam.position.set(gx, 1.05, gz); cam.lookAt(P.x, 1.1, P.z); }); PERF_CULL.t = 0;
  setTimeout(() => { setCamOverride(null); if (B) B.visible = false; J.qBusy = false; PERF_CULL.t = 0; if (typeof sammeln_fibel === 'function') sammeln_fibel('R-K2'); }, 1000); }

// ---------------------------------------------------------------- UK 10 · „Eisen ist frei“: die Behaltenen (ersetzt lampsOut / startC3Chase / c3ChaseUpdate / c3Caught / c3Safe)
const KAPITEL3_TUEREN = [[-12, -12], [-28, -11.2], [-50, -12.5], [26, -12], [-38, 12.5], [14, 12.5], [40, 12.5]]; // Haustüren (Nr. 5, 3, 1, 7, gegenüber)
async function kapitel3_lampsOut() {
  const S = kapitel3_S; if (ch3.lampsOff) return; ch3.lampsOff = true; kapitel3_uk_setzen(10); S.jagd.on = false; grey.visible = false;
  for (const f of KAPITEL3_LATERNE4) { try { f(); } catch (e) { console.error('Kap. 3 vierte Laterne', e); } }
  if (typeof lucy3_S !== 'undefined' && lucy3_S.nebel0 && scene.fog) { scene.fog.density = lucy3_S.nebel0; lucy3_S.nebelZiel = 0; }
  lamps.forEach(L => L.mode = 'dying'); booth.light.userData.dead = true; Audio.hum(true); shake = .03; // Das Summen wird ein Ton. Die Telefonzelle erlischt.
  // Justin steht an der Kreuzung in der Lichtsäule
  const JX = 4.4, JZ = .2; jPlace(JX, JZ, -Math.PI / 2); justin.g.visible = true; justin.look = true; ch3.pillarK = 1; pillar.position.set(JX, 35, JZ); pillarLight.position.set(JX, 3, JZ);
  await wait(1800); setC3('Zu Justin. An die Kreuzung.');
  state.talking = true; await say([['„Jetzt! Zu mir! Sie kommen!“', 2600, JS]]); state.talking = false;
  kapitel3_behStart(); }
function kapitel3_behStart() { const S = kapitel3_S, B = S.beh; B.on = true; B.t = 0; ch3.chase = 'run'; Audio.chaseMusic(true);
  counted.forEach((c, i) => { const T = KAPITEL3_TUEREN[i % KAPITEL3_TUEREN.length]; c.x = T[0]; c.z = T[1]; c.f.visible = true; c.f.position.set(c.x, 0, c.z); c.warte = rand(0, 1.8); });
  if (S.anni) { const T = KAPITEL3_TUEREN[5]; S.anni.x = T[0]; S.anni.z = T[1]; S.anni.f.visible = true; S.anni.f.position.set(T[0], 0, T[1]); S.anni.warte = 2.4; }
  if (B.zweit && typeof grey !== 'undefined') { grey.position.set(28.5, 0, -6); grey.visible = true; grey.lookAt(player.pos.x, 0, player.pos.z); } }
function kapitel3_behTick(dt) {
  const S = kapitel3_S, B = S.beh; if (!B.on || ch3.chase !== 'run') return; if (state.talking || ui.overlay) return;
  const P = player.pos; B.t += dt;
  const e = kapitel3_amEisen(); if (e && !B.freiAn && B.frei <= 0) { B.frei = 3; B.freiAn = true; } if (!e) B.freiAn = false; if (B.frei > 0) B.frei -= dt;
  const safe = B.frei > 0 || S.starr > 0 || kapitel3_frost(); let near = 99; const alle = S.anni ? [...counted, S.anni] : counted;
  for (const c of alle) { if (!c.f.visible) continue; if (c.warte > 0) { c.warte -= dt; continue; }
    const dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz) || .01; near = Math.min(near, d); c.f.rotation.y = Math.atan2(dx, dz);
    if (safe && d < 4) continue; // sie bleiben stehen und warten, ganz nah, und atmen nicht
    const sp = d > 12 ? 3.3 : 2.5; c.x += dx / d * sp * dt; c.z += dz / d * sp * dt; c.f.position.set(c.x, 0, c.z); // zügig, nicht rennend
    if (!safe && d < .95) { if (kapitel3_joker()) return; return kapitel3_behErwischt(); } }
  // Vegas durch den Türspalt, mitten in der Jagd
  if (!B.vegas && Math.hypot(P.x + 28, P.z + 10.5) < 7 && typeof albers_whiskey === 'function') { B.vegas = true; albers_whiskey([['„Lauf, Junge! Lauf!“', 2200, 'VEGAS'], ['„Und nicht durch meine Dahlien!“', 2600, 'VEGAS']]); }
  Audio.chaseLevel(Math.max(0, 1 - near / 12)); if (near < 8) { S.herzT = (S.herzT || 0) - dt; if (S.herzT < 0) { S.herzT = .5 + near * .06; Audio.heart(); } }
  if (Math.hypot(P.x - justin.g.position.x, P.z - justin.g.position.z) < 4.2) kapitel3_behSicher(); }
async function kapitel3_behErwischt() { const S = kapitel3_S, B = S.beh; ch3.chase = 'caught'; ch3.caught++; Audio.chaseMusic(false); B.on = false;
  const P = player.pos; subtitle('„Du bist!“', 1800, 'KINDERSTIMME'); Audio.whisper(P.x + .2, 1.5, P.z, .9); glitchV = .8; // A-26: kein Schrei – Stimme am Ohr, dann Schwarz
  await fade(1, 250); counted.forEach(c => c.f.visible = false); if (S.anni) S.anni.f.visible = false;
  player.pos.set(29, 0, -4.6); player.yaw = PI / 2; player.pitch = 0; vel.set(0, 0, 0); camY = 1.65; await wait(900); fade(0, 1100);
  B.zweit = ch3.caught >= 2; await wait(1600); if (ch3.chase === 'caught') { ch3.chase = 'run'; kapitel3_behStart(); } }
async function kapitel3_behSicher() {
  const S = kapitel3_S, B = S.beh; B.on = false; ch3.chase = 'done'; Audio.chaseMusic(false); state.talking = true;
  // Die Kinder bleiben am Rand des Lichts stehen. Sie sehen Luke an, alle gleichzeitig, und dann alle gleichzeitig weg, zur Senke
  const alle = S.anni ? [...counted, S.anni] : counted, J = justin.g.position;
  for (const c of alle) { if (!c.f.visible) continue; const dx = c.x - J.x, dz = c.z - J.z, d = Math.hypot(dx, dz) || 1; if (d < 5.4) { c.x = J.x + dx / d * 5.4; c.z = J.z + dz / d * 5.4; c.f.position.set(c.x, 0, c.z); } c.f.rotation.y = Math.atan2(player.pos.x - c.x, player.pos.z - c.z); }
  grey.visible = false; justin.look = true; await wait(1600); for (const c of alle) if (c.f.visible) c.f.rotation.y = Math.atan2(96 - c.x, 12 - c.z); await wait(900);
  await say([['„Sie dürfen nicht hinein. Sie sind schon drin. Nur wir zwei.“', 3600, JS], ['„Nimm meine Hand. Und lass sie nicht los, was immer du drinnen siehst. Wer loslässt, fällt. Irgendwohin. Irgendwann.“', 6200, JS]]);
  state.talking = false; if (typeof sammeln_fibel === 'function') sammeln_fibel('R-K3e');
  // B-K3-08 liegt genau da, wo Luke in die Lichtsäule tritt; das zweite Blatt daneben unter einem Kiesel (RH-4)
  if (typeof beobachter_zettel === 'function') try { const P = player.pos; beobachter_zettel('B-K3-08', { pos: [P.x, 0, P.z] }); beobachter_zettel('B-K3-08b', { pos: [P.x + .45, 0, P.z + .3] }); } catch (e) {}
  S.kette = true; kapitel3_speichern(); kapitel3_handAnbieten(); }
function kapitel3_handAnbieten() { const S = kapitel3_S; S.handT = 0; S.kum = S.kum || false;
  if (!S.handHit) { S.handHit = box(1.14, 1.6, 1.14, 0, .8, 0, hidden, { cast: false, parent: justin.g }); S.handHit.userData.noCol = true; }
  interact(S.handHit, 'Justins Hand nehmen', () => kapitel3_handNehmen()); setC3('Nimm Justins Hand.'); S.handWarte = true; }
async function kapitel3_handNehmen() { const S = kapitel3_S; if (!S.handWarte || state.talking) return; S.handWarte = false; uninteract(S.handHit);
  subtitle('Der Panzerhandschuh ist warm. Was er nicht sein dürfte.', 3400); await wait(2400);
  const alle = S.anni ? [...counted, S.anni] : counted; for (const c of alle) c.f.visible = false;
  if (typeof enterWhite === 'function') enterWhite(); }
// Whiskey K3-3 „Kum!“: bleibt Luke am Rand stehen und nimmt die Hand nicht
async function kapitel3_kum() { const S = kapitel3_S; if (S.kum) return; S.kum = true; state.talking = true;
  try { const J = justin.g.position; if (typeof whiskey_setzen === 'function') try { whiskey_setzen(J.x + .8, .05, J.z + .4); } catch (e) {} await wait(1800);
    let ok = false; if (typeof whiskey_mimic === 'function') try { ok = !!whiskey_mimic('kum', { force: true }); } catch (e) {} subtitle('„Kum!“<span style="opacity:.62;font-size:.8em;font-style:normal"> – alt für „Komm!“</span>', 2200, 'WHISKEY'); if (!ok) Audio.whisper(J.x + .8, .4, J.z + .4, .8);
    await wait(2600); await say([['„Das ist ihr Wort.“', 2600, JS]]); } finally { state.talking = false; } }

// ---------------------------------------------------------------- UK 9 · Hufeisen über der Stalltür (B-K3-07), zweiter Riegel + grauer Kasten
async function kapitel3_riegel() { const S = kapitel3_S; if (S.riegel || state.talking || !justin_da()) return; S.riegel = true; state.talking = true;
  try { await say([['„Hast du noch einen von den … Riegeln?“', 2800, JS], ['Deine Finger stoßen in der Innentasche neben dem Riegel an etwas Kleines, Hartes, Eckiges.', 4200], ['„Für drinnen. Da gibt es nichts.“', 2600, JS]]); }
  finally { state.talking = false; } if (typeof addItem === 'function' && story.items.includes('riegel')) story.items = story.items.filter(k => k !== 'riegel');
  if (typeof lwo_S !== 'undefined' && lwo_S.seen && lwo_S.seen.senderIn && lwo_S.sender === 'none' && typeof lwo_wahl === 'function') { await wait(600);
    const i = await lwo_wahl(['Innentasche ansehen.', 'Weitergehen.']); if (i === 0) { const r = await lwo_senderAnsehen(); if (r === 'thrown' || r === 'kept') await say([[r === 'thrown' ? 'Weg damit. In den Gully.' : 'Er ist warm. Ich behalt ihn. Mal sehen, wer ihn vermisst.', 3200, 'DU']]); } } }
async function kapitel3_hufeisen() { const S = kapitel3_S; if (S.huf) return; S.huf = true;
  if (typeof beobachter_zettel === 'function') try { beobachter_zettel('B-K3-07', { vor: true }); } catch (e) {}
  await wait(2600); Audio.whisper(-138.4, 1.4, -30.6, 2.6); await wait(900); if (!state.talking) subtitle('Heute nicht. Hat er gesagt. Ich hör ausnahmsweise mal auf jemanden.', 4200, 'LUKE'); }

// ---------------------------------------------------------------- Aufbau (beim Laden) und Neuzuweisungen der Basis
c3Phone = kapitel3_telefon;
readBook = kapitel3_zaehlbuch;
lampsOut = kapitel3_lampsOut;
startC3Chase = kapitel3_behStart;
c3ChaseUpdate = function (dt) { kapitel3_behTick(dt); };
c3Caught = kapitel3_behErwischt;
c3Safe = kapitel3_behSicher;
greyUpdate = function (dt) { kapitel3_jagdTick(dt); }; // die alte Zufallsjagd der Grauen entfällt – das Graukind jagt ab dem ersten Hebel (UK 8)
startChapter3 = (o => async function (...a) { kapitel3_S.tafel = true; return o.apply(this, a); })(startChapter3);
chapter3Begin = (o => function (...a) { const r = o.apply(this, a); const S = kapitel3_S; if (ch3.on && S.uk < 1) S.uk = 1; ch3.ringing = false; return r; })(chapter3Begin);
// Justin tritt erst nach dem Anruf aus dem Licht (UK 4): wenn Luke die Kreuzung verlässt oder nach einer halben Minute Stehen
justinArrives = (o => function (...a) { const S = kapitel3_S; if (!ch3.callDone || S.callT < 0) return; const P = player.pos; if (ch3.t - S.callT < 30 && Math.hypot(P.x - 4, P.z) < 14) return;
  kapitel3_uk_setzen(4); return o.apply(this, a); })(justinArrives);
WORLD_MODS.push(['Kapitel 3 · Hauptweg Straße (AP-17)', async () => {
  const S = kapitel3_S;
  if (typeof cowHit !== 'undefined') uninteract(cowHit);
  try { modItem('buch', 'Hildes Zählbuch', 'Ein grünes Kassenbuch mit Stoffrücken. Dreißig Jahre Nächte. Wird noch gebraucht.', 'paper'); } catch (e) {}
  // Das Zählbuch: echtes Buch (Scan) statt der Kiste, grün getönt
  try { if (typeof zbook !== 'undefined') { const b = await msModel('w_buch', 'model.glb'); const o = msFit(b.clone(true), .27, 'max'); o.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color = new THREE.Color(0x3d5a3e); m.castShadow = true; } });
      const bb = new THREE.Box3().setFromObject(o); o.position.set(zbook.position.x, zbook.position.y - .02 - bb.min.y, zbook.position.z); o.rotation.y = .4; o.visible = false; scene.add(o); S.buchModell = o; zbook.material = hidden; } } catch (e) { console.warn('Kap. 3 Zählbuch-Modell', e); }
  // Hufeisen über der Stalltür (Hof)
  { const h = box(1.2, .5, .6, -138.6, 2.35, -29.9, hidden, { cast: false }); h.userData.noCol = true; S.hufHit = h; interact(h, () => kapitel3_k3() && !S.huf ? 'Hufeisen über der Stalltür' : '', () => { if (kapitel3_k3() && ch3.part === 'town') kapitel3_hufeisen(); }); }
  // Anni Hofer (1975): Mädchen mit Papiersonnen-Lampion unter den Behaltenen (ohne Kerze, nur Buntpapier)
  try { const g = new THREE.Group(); g.visible = false; g.userData.noCol = true; scene.add(g); await figuren_embody(g, 'gezaehlt_m'); S.anni = { f: g, x: 0, z: 0, warte: 0 };
    const src = await msFBX('w_papierlaterne', 'model.fbx', {}); const l = msFit(src.clone(true), .32, 'y'); l.traverse(m => { if (m.isMesh) { m.material = [].concat(m.material).map(x => { const c = x.clone(); c.color = new THREE.Color(0xf0d890); c.emissive = new THREE.Color(0x2a1a08); return c; }); if (m.material.length === 1) m.material = m.material[0]; } });
    let hand = null; g.traverse(b => { if (!hand && b.isBone && /R_Hand$|RightHand|hand_r/i.test(b.name)) hand = b; }); const w = new THREE.Group(); w.add(l); l.position.set(0, -.38, 0); if (hand) { w.scale.setScalar(1 / (hand.getWorldScale(_k3v).x || 1)); hand.add(w); } else { w.position.set(.25, .55, .1); g.add(w); } } catch (e) { console.warn('Kap. 3 Anni', e); }
  // Luke von hinten (für „Augen zu“ aus ihren Augen)
  try { const g = new THREE.Group(); g.visible = false; g.userData.noCol = true; scene.add(g); await figuren_embody(g, 'luke_erw'); const sil = new THREE.MeshStandardMaterial({ color: 0x0c0c0f, roughness: .92 }); // Q-6: Luke mit 26 (eigene Figur, Ersatz amt2) als dunkler Umriss von hinten
    g.traverse(m => { if (m.isMesh) { m.material = sil; m.castShadow = false; } }); S.lukeRueck = g; } catch (e) { console.warn('Kap. 3 Luke von hinten', e); }
  // Nachbild 2009: Kinder, der Mann in Rüstung mit dem Jungen, Hilde auf der Treppe von Nr. 7 (Nachbild-Material, beim Laden besetzt)
  try { const NB = S.nb = { figs: [], an: false, t: 0, lampeT: 0 }; const mk = async (id, x, z, ry, o = {}) => { const g = new THREE.Group(); g.visible = false; g.userData.noCol = true; g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
      await figuren_embody(g, id, { ghost: true, ...o }); const F = { g, id, x0: x, z0: z, vx: o.vx || 0, vz: o.vz || 0 }; NB.figs.push(F); return F; };
    for (let i = 0; i < 5; i++) await mk(i % 2 ? 'gezaehlt_m' : 'gezaehlt_j', 16 + i * 1.1, -1.8 + (i % 3) * .9, -Math.PI / 2, { vx: -.55 });
    await mk('luke', 11.2, .9, -Math.PI / 2, { vx: -.55 }); await mk('luke_echt', 34, 5, -Math.PI / 2 - .4, { clip: 'idle' }); await mk('hilde', 25.4, -10.4, Math.PI, { clip: 'idle' });
    if (justin.model && typeof figuren_skc === 'function') { const sk = await figuren_skc(), c = typeof justin_nachbildKlon === 'function' ? justin_nachbildKlon(sk(justin.model)) : sk(justin.model), g = new THREE.Group(); g.add(c); g.position.set(12, 0, .4); g.rotation.y = -Math.PI / 2; g.visible = false; scene.add(g);
      const mx = new THREE.AnimationMixer(c), w = justin.acts.walk || justin.acts.idle; if (w) mx.clipAction(w.getClip()).play(); if (typeof weiss_ghostify === 'function') weiss_ghostify(c); NB.figs.push({ g, x0: 12, z0: .4, vx: -.55, vz: 0, mx }); }
    NB.neunPos = [3.2, 0, 9.6]; } catch (e) { console.warn('Kap. 3 Nachbild 2009', e); }
  // Q während der Jagd: aus ihren Augen
  addEventListener('keydown', e => { if (e.code === 'KeyQ' && !e.repeat && kapitel3_S.jagd.on && document.pointerLockElement === renderer.domElement) kapitel3_ausIhrenAugen(); });
  // Weiterspielen mitten in Kapitel 3: Zustand herstellen (nach dem Kapitelaufbau)
  if (typeof CH_RESUME !== 'undefined') CH_RESUME.push((d, at) => kapitel3_fortsetzen(d, at));
  // Abgleich Kap. 3 (Text gegen Welt): sichtbares Hufeisen über der Stalltür, Vegas’ Dahlienbeete vor Nr. 3
  try { kapitel3_hufeisenBau(); } catch (e) { console.warn('Kap. 3 Hufeisen', e); }
  try { S.dah = [kapitel3_dahlienBeet(-32.7, -29.6, -12.15, -11.0, 0, 11), kapitel3_dahlienBeet(-26.4, -23.3, -12.15, -11.0, 0, 23)]; } catch (e) { console.warn('Kap. 3 Dahlien', e); }
  try { kapitel3_senkeBau(); } catch (e) { console.warn('Kap. 3 Senke', e); }
  window.__k3 = { S, kuh: () => kapitel3_kuhStellen(), unters: k => kapitel3_kuhUntersuchen(k, S.kuhHits.find(() => true)), tel: () => kapitel3_telefon(), raus: w => kapitel3_raus(w), jam: w => kapitel3_justinAmAusgang(w),
    buch: () => kapitel3_zaehlbuch(), nb: () => kapitel3_nachbild2009(), jagd: () => kapitel3_jagdStart(), erwischt: () => kapitel3_erwischt(), augen: () => kapitel3_ausIhrenAugen(), aus: () => kapitel3_lampsOut(),
    sicher: () => kapitel3_behSicher(), hand: () => kapitel3_handNehmen(), riegel: () => kapitel3_riegel(), huf: () => kapitel3_hufeisen(), eisen: () => kapitel3_amEisen(), fort: (d, at) => kapitel3_fortsetzen(d, at), ev: code => eval(code) }; // Testzugriff (ev: Ausdruck im Modulbereich auswerten)
}]);
// Weiterspielen: den Stand der Nacht wiederherstellen (Speicherpunkte: Kreuzung, nach dem Anruf, Justin, Zählbuch, Kanal B, nach jeder Laterne, „Die Kette“)
function kapitel3_fortsetzen(d, at) {
  const S = kapitel3_S, v = S.laden; if (!v || !ch3.on || (typeof kap === 'function' && kap() !== 3)) return; S.resumed = true; S.laden = null;
  S.uk = Math.max(1, +v.uk || 1); (v.kuh || []).forEach(k => S.kuh.add(k)); S.draussen = +v.draussen || 0; S.ag09 = !!v.ag09; S.ag10 = !!v.ag10; S.ag08 = !!v.ag08; S.buch = !!v.buch; S.nb09 = !!v.nb09; S.riegel = !!v.riegel; S.huf = !!v.huf; S.vegasKuh = !!v.vegasKuh;
  if (typeof lucy3_S !== 'undefined') { lucy3_S.openDone = true; lucy3_S.opening = false; }
  lamps.forEach(L => { L.mode = 'pulse'; L.dead = 0; });
  if (v.cow || S.uk >= 2) { ch3.cowSeen = true; if (!cowFx.done && typeof FAB !== 'undefined' && FAB.cow) { cowFx.done = true; cowFx.g.clear(); cowFx.g.add((FAB.cowPlatt || FAB.cow).clone()); cowFx.g.position.set(-7.5, FAB.cowLift || .5, .8); cowFx.g.rotation.set(PI / 2 - .12, .6, 0, 'YXZ'); cowFx.t = 1; }
    if (S.kuh.size < 3) setTimeout(() => kapitel3_kuhStellen(), 400); S.kuhFluch = S.kuh.size >= 3; }
  else { const kuh = () => { /* Schlusstest: Spielstand vom Kapitelanfang (vor der Kuh) – das Intro bricht nach dem Aufstehen ab, die Kuh muss trotzdem fallen, sonst klingelt nie das Telefon */
    if (ch3.cowSeen || cowFx.done || !ch3.on) return; if (scripted || state.talking || ui.overlay || (typeof kino_S !== 'undefined' && kino_S.on)) return setTimeout(kuh, 1000);
    if (typeof kino_play === 'function' && typeof kino_S !== 'undefined' && kino_S.ready && typeof KINO !== 'undefined' && KINO.k3kuh) { Audio.hum(false); kino_play('k3kuh').catch(e => console.error('Kino k3kuh', e)).then(() => Audio.hum(true)); }
    else { cowDrop(); cowHit.position.set(-7.5, .6, .8); } }; setTimeout(kuh, 3000); }
  if (v.call) { ch3.callDone = true; ch3.ringing = false; S.callT = -999; S.ringAb = -2; }
  if (v.met && typeof justin_da === 'function') { ch3.met = true; justin.g.visible = true; jPlace(1.5, -5.2, 0); justin.look = true; ch3.pillarK = .35; if (typeof justin_S !== 'undefined' && (!justin_S.phase || justin_S.phase === 'uk4' || justin_S.phase === 'pflicht')) justin_S.phase = 'stadt'; if (typeof whiskey_S !== 'undefined') whiskey_S.jAsked = true; }
  if (v.radio) { ch3.radio = true; if (typeof lucy3_S !== 'undefined') lucy3_S.tuned = true; try { radioLed.material.emissive.set(0x30ff60); } catch (e) {} }
  ch3.seq = Array.isArray(v.seq) ? v.seq.filter(n => [5, 3, 1, 7].includes(n)) : []; for (const B of switchBoxes) { B.off = ch3.seq.includes(B.n); if (B.off) B.L.mode = 'off'; }
  if (ch3.seq.length && !v.lampsOff) kapitel3_jagdStart();
  if (v.lampsOff || v.kette) { // „Die Kette“: an der Kreuzung, Justin in der Lichtsäule, die Hand
    ch3.lampsOff = true; lamps.forEach(L => L.mode = 'off'); booth.light.userData.dead = true; ch3.chase = 'done'; const JX = 4.4, JZ = .2; jPlace(JX, JZ, -Math.PI / 2); justin.g.visible = true; ch3.pillarK = 1; pillar.position.set(JX, 35, JZ); pillarLight.position.set(JX, 3, JZ);
    player.pos.set(JX - 2.4, 0, JZ + .3); player.yaw = -Math.PI / 2; vel.set(0, 0, 0); S.kette = true; setTimeout(() => kapitel3_handAnbieten(), 600); }
  else if (!at) { player.pos.set(3.2, 0, 1.4); player.yaw = -Math.PI / 2 + .3; player.pitch = 0; vel.set(0, 0, 0); camY = 1.65; }
  setC3(!ch3.cowSeen ? 'Hol Lucy zurück. Finde heraus, was mit Lost Eyengless geschehen ist.' : !ch3.callDone ? 'Das Telefon an der Kreuzung klingelt.' : !ch3.met ? 'Hol Lucy zurück. Irgendwo muss es einen Weg zu ihr geben.' : !ch3.radio ? KAPITEL3_ZIEL_LATERNEN : !ch3.lampsOff ? 'Lösch die Laternen vor den Häusern, in der Reihenfolge, in der sie die Kinder geholt hat.' : 'Nimm Justins Hand.'); }

// ---------------------------------------------------------------- Takt
WORLD_TICK.push((dt, t) => {
  const S = kapitel3_S; if (!ch3.on || ch3.part !== 'town' || !kapitel3_k3()) return; const P = player.pos;
  if (S.starr > 0) S.starr -= dt;
  if (S.leine && !scripted) { const dx = P.x - S.leine.x, dz = P.z - S.leine.z, d = Math.hypot(dx, dz); if (d > 5) { P.x = S.leine.x + dx / d * 5; P.z = S.leine.z + dz / d * 5; } } // bis die Glocke fertig ist
  if (S.buchModell) S.buchModell.visible = !!(typeof zbook !== 'undefined' && interactables.includes(zbook));
  // UK 2: nach der Kinosequenz die drei Untersuchungsstellen
  if (ch3.cowSeen && cowFx.done && cowFx.t >= 1 && !S.kuhHits.length && !(typeof kino_S !== 'undefined' && kino_S.on)) { kapitel3_kuhStellen(); kapitel3_uk_setzen(2); if (S.ringAb < 0 && S.ringAb > -2) S.ringAb = ch3.t + 60; }
  // Vegas durch die Tür von Nr. 3 (Kette vor), sobald Luke in Hörweite ist
  if (!S.vegasKuh && ch3.cowSeen && !state.talking && Math.hypot(P.x + 28, P.z + 11) < 17 && typeof albers_whiskey === 'function') { S.vegasKuh = true; ch3.side.vegasKuh = true;
    albers_whiskey([['„Das ist Aydıns Kuh! Die Gescheckte! Ich hab’s gewusst. Die nehmen erst die Kühe, dann die Leute. Steht alles im Ordner. Seit ’58!“', 6400, 'VEGAS']]); }
  // UK 3: das Telefon klingelt, bis Luke abnimmt – wer sich entfernt, hört es leiser und dann, egal wo er steht, direkt neben sich
  if (!ch3.callDone && S.ringAb >= 0 && ch3.t > S.ringAb) { if (!S.ringStart) { S.ringStart = true; ch3.ringing = true; setC3('Das Telefon an der Kreuzung klingelt. Nimm ab.'); if (!state.talking) setTimeout(() => { if (!state.talking && !S.gedZelle) { S.gedZelle = true; subtitle('Die Zelle hat seit Jahren kein Kabel mehr. Vegas sagt, genau deshalb hört sie mit.', 4400, 'LUKE'); } }, 5000); }
    S.ringT -= dt; if (S.ringT < 0) { S.ringT = 3.2; const dB = Math.hypot(P.x - 8, P.z - 7.6); if (dB > 36) Audio.ring(.09); else Audio.ring(.09, 8, 1.9, 7.6); } }
  // UK 1: erster Blick zur Telefonzelle
  if (S.uk >= 1 && !S.gedZelle1 && !state.talking && !ui.overlay && P.distanceTo(_k3v2.set(8, 0, 7.6)) < 30 && kapitel3_siehtHin(8, 1.4, 7.6, .95)) { S.gedZelle1 = true; subtitle('Fünfzig Hertz. Immer noch. Kein Strom im ganzen Dorf, und die Zelle brummt.', 5200, 'LUKE'); }
  // UK 5: Kein Draußen (Ost- und Südsperre); beim zweiten Versuch steht Justin am Ausgang
  if (ch3.met && !S.loopBusy && !state.talking && !ch3.lampsOff) for (const [wo, R] of Object.entries(KAPITEL3_RAUS)) {
    if (S.draussen >= 1 && !S.justinWacht && Math.hypot(P.x - R.j[0], P.z - R.j[1]) < 26) { kapitel3_justinAmAusgang(wo); break; }
    if (R.t(P)) { kapitel3_raus(wo); break; } }
  // UK 6: Nachbild 2009 – Buch in der Tasche, an der Kreuzung, Taschenlampe aus
  if (S.buch && !S.nb09 && !flashOn && !state.talking && !ui.overlay && Math.hypot(P.x - 4, P.z - .5) < 7 && S.nb && S.nb.figs.length) kapitel3_nachbild2009();
  const NB = S.nb; if (NB && NB.an) { NB.t += dt; for (const f of NB.figs) { if (f.vx) { f.g.position.x = f.x0 + f.vx * NB.t; f.g.position.z = f.z0 + (f.vz || 0) * NB.t; } if (f.mx) f.mx.update(dt); }
    if (flashOn && !NB.neun) { camera.getWorldDirection(_k3d); const s = Math.sign(_k3d.x); if (s && s !== NB.sw) { NB.sw = s; NB.sweeps = (NB.sweeps || 0) + 1; } if (NB.sweeps >= 3) { NB.neun = true; if (typeof beob_sichtung === 'function') try { beob_sichtung(NB.neunPos, .8, { blick: [4, 1, .5] }); } catch (e) {} } } }
  // UK 8: die Jagd beginnt mit dem ersten richtig gezogenen Hebel
  if (!S.jagd.on && ch3.seq.length >= 1 && !ch3.lampsOff && ch3.seq.every((n, i) => n === LAMP_ORDER[i])) { kapitel3_uk_setzen(8); kapitel3_jagdStart(); }
  // AG-10: auf dem Weg zum Kasten vor Nr. 7 (nach der dritten Laterne), im Nebel am Ostende
  if (!S.ag10 && ch3.seq.length === 3 && !state.talking && P.x > 14 && typeof lwo_ag10 === 'function') { S.ag10 = true; lwo_ag10(); }
  // AG-08: die dritte Laterne ist aus – vom Kasten vor Nr. 1 aus der Blick zur Senke
  if (!S.ag08 && ch3.seq.length >= 3 && !state.talking && typeof lwo_ag08Bereit === 'function' && lwo_ag08Bereit()) { S.ag08 = true; kapitel3_uk_setzen(9); lwo_ag08().then(() => setTimeout(() => { if (Math.hypot(player.pos.x - justin.g.position.x, player.pos.z - justin.g.position.z) < 12) kapitel3_riegel(); }, 2500)); }
  // UK 10: an der Lichtsäule nicht die Hand nehmen → Whiskey „Kum!“
  if (S.handWarte && !state.talking && !ui.overlay) { S.handT += dt; if (S.handT > 9 && !S.kum && jDist() < 6) kapitel3_kum(); }
});

// ---------------------------------------------------------------- Abgleich Kap. 3 (Text gegen Welt): Hufeisen über der Stalltür, Vegas’ Dahlien
// Die Texte (B-K3-07 „Hufeisen über der Stalltür“, Vegas: „Und nicht durch meine Dahlien!“) verlangen sichtbare Dinge; vorher gab es nur eine Klickfläche bzw. nichts.
function kapitel3_hufeisenBau() {
  const S = kapitel3_S, OW = typeof ausbau_ost_west_OW !== 'undefined' ? ausbau_ost_west_OW : null, D = OW && OW.dbg && OW.dbg.barnDoor; if (!D) return;
  // Wandfläche über der Tür per Strahl finden (nur sichtbare Netze, keine Klickflächen)
  let hoehe = S.hufY || 2.45, wx = null, wz = D.z + 1.45; S.hufScan = []; // an den Türpfosten (Oberkante des Tors), vom Hof aus sichtbar; die Stirnwand über der Tür liegt hinter dem Gebälk
  for (const [dz, y] of [[1.45, 2.3], [1.45, 2.2], [-1.45, 2.3], [-1.45, 2.2]]) { const l = typeof neben3x_ray === 'function' ? neben3x_ray(new THREE.Vector3(D.x + 3, y, D.z + dz), new THREE.Vector3(-1, 0, 0), 6) : [], hit = l.find(h => h.point.x > D.x - .8); S.hufScan.push([dz, y, hit ? +hit.point.x.toFixed(2) : null]);
    if (hit) { wx = hit.point.x; wz = D.z + dz; hoehe = y + .1; S.hufWand = hit.object.name || hit.object.type; break; } }
  if (wx === null) wx = D.x + .35; // Rückfall: Pfostenvorderkante
  const T = THREE, Ra = .07, Ri = .04, a = 2.5, shape = new T.Shape(), n = 28;
  for (let i = 0; i <= n; i++) { const t = -T.MathUtils.lerp(-a, a, i / n) - Math.PI / 2; const x = Ra * Math.cos(t), y = Ra * Math.sin(t); if (i) shape.lineTo(x, y); else shape.moveTo(x, y); }
  for (let i = n; i >= 0; i--) { const t = -T.MathUtils.lerp(-a, a, i / n) - Math.PI / 2; shape.lineTo(Ri * Math.cos(t), Ri * Math.sin(t)); }
  for (const k of [-2.1, -1.4, -.7, 0, .7, 1.4, 2.1]) { const t = -Math.PI / 2 + k, r = (Ra + Ri) / 2, h = new T.Path(); h.absarc(r * Math.cos(t), r * Math.sin(t), .0052, 0, Math.PI * 2, true); shape.holes.push(h); } // sieben Nagellöcher
  const g = new T.ExtrudeGeometry(shape, { depth: .011, bevelEnabled: true, bevelThickness: .0028, bevelSize: .0028, bevelSegments: 2, curveSegments: 10 });
  const eisen = kirchberg_tex(kirchberg_cnv(128, 128, (x, w, h) => { x.fillStyle = '#3b332d'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const o = kirchberg_r(); x.fillStyle = o < .5 ? `rgba(${kirchberg_r(110, 160) | 0},${kirchberg_r(54, 80) | 0},26,${kirchberg_r(.12, .5)})` : `rgba(20,16,12,${kirchberg_r(.2, .6)})`; x.fillRect(kirchberg_r(0, w), kirchberg_r(0, h), kirchberg_r(1, 5), kirchberg_r(1, 4)); } }));
  { const b = g.boundingBox || (g.computeBoundingBox(), g.boundingBox), p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x), (p.getY(i) - b.min.y) / (b.max.y - b.min.y)); }
  const m = new T.Mesh(g, new T.MeshStandardMaterial({ map: eisen, color: 0xd8d0c8, roughness: .42, metalness: .7 })); m.castShadow = true; m.receiveShadow = true;
  const gr = new T.Group(); gr.add(m); // Öffnung nach oben: das Glück läuft nicht heraus
  const nagel = new T.Mesh(new T.CylinderGeometry(.0035, .0035, .05, 6), new T.MeshStandardMaterial({ color: 0x2a2622, roughness: .5, metalness: .9 })); nagel.rotation.x = Math.PI / 2; nagel.position.set(0, -.055, .01); gr.add(nagel);
  const kopf = new T.Mesh(new T.CylinderGeometry(.009, .007, .004, 8), nagel.material); kopf.rotation.x = Math.PI / 2; kopf.position.set(0, -.055, .0165); gr.add(kopf);
  gr.position.set(wx + .005, hoehe, wz); gr.rotation.y = Math.PI / 2; gr.rotation.z = .05; gr.scale.setScalar(1.5); gr.userData.noCol = true; /* ein Arbeitspferd-Eisen, handbreit */ scene.add(gr); gr.updateMatrixWorld(true); S.hufMesh = gr;
  const rost = kirchberg_decal(kirchberg_tex(kirchberg_cnv(64, 128, (x, w, h) => { const q = x.createLinearGradient(0, 0, 0, h); q.addColorStop(0, 'rgba(96,48,20,.55)'); q.addColorStop(1, 'rgba(96,48,20,0)'); x.fillStyle = q; x.beginPath(); x.moveTo(w * .42, 0); x.lineTo(w * .58, 0); x.lineTo(w * .7, h); x.lineTo(w * .3, h); x.fill(); })), .05, .22, wx + .004, hoehe - .17, wz, Math.PI / 2, { alpha: true }); // Rostfahne unter dem Nagel
  S.hufRost = rost; return gr; }
// ---- Dahlien: Kopf (Pompon aus Blütenblättern), Blatt, Beet
function kapitel3_dahlieGeo() {
  const pos = [], uv = [], idx = []; let v = 0;
  const ringe = [[13, .030, 4, .05, .026, .036], [12, .024, 22, .045, .024, .034], [11, .018, 40, .04, .022, .03], [9, .012, 58, .034, .02, .026], [7, .007, 74, .028, .017, .02], [5, .003, 86, .022, .014, .016]]; // n, r0, Neigung°, Länge, Breite, Höhe
  ringe.forEach(([n, r0, tilt, len, wid, h0], ri) => { for (let i = 0; i < n; i++) { const a = (i + (ri % 2) * .5) / n * Math.PI * 2, t = tilt * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), bx = ca * r0, bz = sa * r0, by = h0 * .0 + ri * .004;
      const dx = ca * Math.cos(t) * len, dy = Math.sin(t) * len, dz = sa * Math.cos(t) * len, sx = -sa * wid / 2, sz = ca * wid / 2;
      const P = [[bx - sx * .55, by, bz - sz * .55], [bx + sx * .55, by, bz + sz * .55], [bx + dx * .55 + sx, by + dy * .55 + .003, bz + dz * .55 + sz], [bx + dx * .55 - sx, by + dy * .55 + .003, bz + dz * .55 - sz], [bx + dx + sx * .3, by + dy - .002 * (90 - tilt) / 90, bz + dz + sz * .3], [bx + dx - sx * .3, by + dy - .002 * (90 - tilt) / 90, bz + dz - sz * .3]];
      P.forEach(p => pos.push(p[0], p[1], p[2])); uv.push(0, 0, 1, 0, 1, .55, 0, .55, .85, 1, .15, 1); idx.push(v, v + 1, v + 2, v, v + 2, v + 3, v + 3, v + 2, v + 4, v + 3, v + 4, v + 5); v += 6; } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
function kapitel3_dahlienBeet(x0, x1, z0, z1, ry, seed) {
  const T = THREE, S = kapitel3_S, grp = new T.Group(); grp.userData.noCol = true; scene.add(grp); const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; let rs = seed || 7; const r = (a = 0, b = 1) => { rs = (rs * 16807) % 2147483647; return a + (b - a) * rs / 2147483647; };
  if (!S.dahT) { S.dahT = {
      blatt: kirchberg_tex(kirchberg_cnv(256, 256, (x, ww, hh) => { x.clearRect(0, 0, ww, hh); x.translate(ww / 2, hh); x.fillStyle = '#243d1e'; x.strokeStyle = '#142410'; x.lineWidth = 2; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(0, -8); for (let k = 0; k <= 12; k++) { const t = k / 12, yy = -8 - t * 220, xx = s * (Math.sin(t * 2.6) * 78 * (1 - t * .15) + (k % 2 ? 7 : 0)); x.lineTo(xx, yy); } x.lineTo(0, -232); x.closePath(); x.fill(); x.stroke(); }
        x.strokeStyle = 'rgba(170,200,120,.55)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, -4); x.lineTo(0, -228); x.stroke(); x.lineWidth = 1.5; for (let k = 1; k < 8; k++) for (const s of [-1, 1]) { x.beginPath(); x.moveTo(0, -k * 28); x.lineTo(s * 60 * (1 - k / 10), -k * 28 - 22); x.stroke(); } })),
      bl: kirchberg_tex(kirchberg_cnv(64, 128, (x, ww, hh) => { x.clearRect(0, 0, ww, hh); const gr = x.createLinearGradient(0, hh, 0, 0); gr.addColorStop(0, 'rgba(110,110,110,1)'); gr.addColorStop(.35, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(235,235,235,1)'); x.fillStyle = gr; x.beginPath(); x.moveTo(ww * .2, hh); x.quadraticCurveTo(-ww * .15, hh * .35, ww * .5, 2); x.quadraticCurveTo(ww * 1.15, hh * .35, ww * .8, hh); x.fill(); x.strokeStyle = 'rgba(70,70,70,.5)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(ww * .5, hh); x.lineTo(ww * .5, 14); x.stroke(); })),
      geo: kapitel3_dahlieGeo() }; }
  // Erdbeet: weich auslaufende, dunkle Erde mit Rindenmulch
  const erde = kirchberg_tex(kirchberg_cnv(512, 256, (x, ww, hh) => { x.clearRect(0, 0, ww, hh); const gr = x.createRadialGradient(ww / 2, hh / 2, hh * .15, ww / 2, hh / 2, ww * .52); gr.addColorStop(0, 'rgba(46,34,24,1)'); gr.addColorStop(.78, 'rgba(52,38,26,1)'); gr.addColorStop(1, 'rgba(52,38,26,0)'); x.save(); x.scale(1, hh / ww * 1.5); x.fillStyle = gr; x.fillRect(0, 0, ww, ww); x.restore();
    for (let i = 0; i < 2600; i++) { const px = kirchberg_r(30, ww - 30), py = kirchberg_r(14, hh - 14), o = kirchberg_r(); x.fillStyle = o < .5 ? `rgba(${kirchberg_r(20, 40) | 0},${kirchberg_r(14, 28) | 0},${kirchberg_r(8, 18) | 0},${kirchberg_r(.4, .9)})` : `rgba(${kirchberg_r(80, 120) | 0},${kirchberg_r(58, 84) | 0},${kirchberg_r(36, 56) | 0},${kirchberg_r(.2, .6)})`; x.fillRect(px, py, kirchberg_r(2, 9), kirchberg_r(1.5, 4)); } }));
  kirchberg_decal(erde, w + .5, d + .5, cx, .025, cz, -ry, { alpha: true, rx: -Math.PI / 2, parent: grp });
  const n = Math.max(5, Math.round(w / .36)), blatt = [], blueten = [], stiele = [], stab = [];
  const lm = new T.MeshStandardMaterial({ map: S.dahT.blatt, alphaTest: .4, side: T.DoubleSide, roughness: .75, color: 0xd0e8b8 }), bm = new T.MeshStandardMaterial({ map: S.dahT.bl, alphaTest: .35, side: T.DoubleSide, roughness: .62, color: 0xffffff }), sm = new T.MeshStandardMaterial({ color: 0x35502a, roughness: .8 }), pm = new T.MeshStandardMaterial({ color: 0xa68a56, roughness: .85 });
  const farben = [0xc01428, 0xe02a3a, 0xe8501c, 0xf0a020, 0xe05a90, 0x9a38a0, 0xf4e8c8, 0xd01c48], M = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), sc = new T.Vector3(), p = new T.Vector3(), cos = Math.cos(ry), sin = Math.sin(ry);
  for (let i = 0; i < n; i++) { const lx = -w / 2 + (i + .5) * w / n + r(-.12, .12), lz = r(-d / 2 + .15, d / 2 - .15), px = cx + lx * cos - lz * sin, pz = cz + lx * sin + lz * cos, hh = r(.85, 1.25), sw = r(-.1, .1), sx = r(-.1, .1);
    p.set(px, hh / 2, pz); q.setFromEuler(e.set(sx, r(0, 6.28), sw)); sc.set(1, hh, 1); stiele.push(M.compose(p.clone(), q.clone(), sc.clone()).clone());
    p.set(px + r(-.03, .03), (hh + .05) / 2, pz + r(-.03, .03)); sc.set(1, hh + .05, 1); q.setFromEuler(e.set(0, 0, 0)); stab.push(M.compose(p.clone(), q.clone(), sc.clone()).clone());
    for (let k = 0; k < 9; k++) { const ph = r(.12, .8) * hh, a = r(0, 6.28), s = r(.16, .27) * (1.05 - ph / hh * .4); q.setFromEuler(e.set(r(.5, 1.1), a, 0, 'YXZ')); p.set(px + Math.sin(a) * .03, ph, pz + Math.cos(a) * .03); sc.set(s, s, s); blatt.push(M.compose(p.clone(), q.clone(), sc.clone()).clone()); }
    const nb = r() < .45 ? 3 : 2; for (let k = 0; k < nb; k++) { const hy = hh * (k ? r(.62, .86) : 1) + .01, ox = k ? r(-.17, .17) : sx * hh * .5, oz = k ? r(-.17, .17) : sw * hh * .5, s = k ? r(.9, 1.2) : r(1.2, 1.6); q.setFromEuler(e.set(r(-.5, .5) + (k ? .4 : 0), r(0, 6.28), r(-.5, .5))); p.set(px + ox, hy, pz + oz); sc.set(s, s, s); blueten.push([M.compose(p.clone(), q.clone(), sc.clone()).clone(), farben[Math.floor(r(0, farben.length)) % farben.length]]); } }
  const mk = (geo, mat, list, o = {}) => { const im = new T.InstancedMesh(geo, mat, list.length); list.forEach((mm, i) => im.setMatrixAt(i, Array.isArray(mm) ? mm[0] : mm)); im.castShadow = o.cast !== false; im.receiveShadow = true; im.userData.noCol = true; im.frustumCulled = false; grp.add(im); return im; };
  const bg = new T.PlaneGeometry(1, 1); bg.translate(0, .5, 0); const lg = bg;
  mk(new T.CylinderGeometry(.0055, .011, 1, 5).translate(0, 0, 0), sm, stiele); mk(new T.CylinderGeometry(.004, .004, 1, 4), pm, stab, { cast: false }); mk(lg, lm, blatt);
  const bi = mk(S.dahT.geo, bm, blueten); blueten.forEach((b, i) => bi.setColorAt(i, new T.Color(b[1]))); bi.instanceColor.needsUpdate = true;
  return grp; }

// Hufeisen: ab Kapitel 3 sichtbar (Eisen ist frei)
WORLD_TICK.push(dt => { const S = kapitel3_S; kapitel3_senkeTick(dt); if (S.hufMesh) { const an = typeof kap !== 'function' || kap() >= 3; if (S.hufMesh.visible !== an) S.hufMesh.visible = an; if (S.hufRost && S.hufRost.visible !== an) S.hufRost.visible = an; } });

// Senke im Osten: das Weiß „über der Senke“ (Justin: „Das Licht da hinten ist kein Licht. Es ist ein Schiff.“) – ein fernes, bleiches Leuchten über dem Horizont (Sprite, keine Lichtquelle)
function kapitel3_senkeBau() { const S = kapitel3_S, c = kirchberg_cnv(256, 256, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 4, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(244,248,255,.95)'); g.addColorStop(.18, 'rgba(226,236,255,.5)'); g.addColorStop(.5, 'rgba(200,214,240,.14)'); g.addColorStop(1, 'rgba(200,214,240,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
  const t = kirchberg_tex(c), m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 }), sp = new THREE.Sprite(m); sp.scale.set(70, 34, 1); sp.position.set(118, 15, 0); sp.userData.noCol = true; sp.renderOrder = -1; scene.add(sp); S.senke = sp; }
function kapitel3_senkeTick(dt) { const S = kapitel3_S, sp = S.senke; if (!sp) return; const an = typeof kap === 'function' && kap() === 3 && ch3.on && ch3.part === 'town', ziel = an ? .34 + Math.sin(performance.now() * .0006) * .06 : 0; const o = sp.material.opacity + (ziel - sp.material.opacity) * Math.min(1, dt * .8); sp.material.opacity = o; sp.visible = o > .004; }
