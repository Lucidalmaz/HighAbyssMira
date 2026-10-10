// =====================================================================  VERSTECKE (Modul „verstecke“, Nutzer-Rückmeldung 02.10.2026)
// Nutzer: „Ducken und Hochziehen sollen in der Spielwelt echte Vorteile, Events, Quests und Fundorte haben.“
// Nebenaufgabe „Verstecke der Sieben“: Die sieben Kinder von 2009 hatten Verstecke, an die nur Kinder kamen –
//   · unten (unter Autos, Bänken, Verandaböden): nur geduckt erreichbar (Strg / C) → Glänzendes für Whiskey;
//   · oben (Schuppen-, Garagen-, Autodächer, Mauerkronen): nur durch Hochziehen (Leertaste an der Kante) → Batterien.
// Orte werden einmal aus der echten Geometrie gesucht (Kollisionskästen + echte Formen): „unten“ = über dem Boden 0,3–0,95 m Deckung;
//   „oben“ = Fläche 1,05–1,6 m über einem begehbaren Nachbarpunkt, eben, frei, mit Kopffreiheit. Gleichmäßig verteilt, nie an Türen/Klickstellen.
// Alle acht: der Kinderblick (G) lädt schneller nach (visionen.js, VISION_RECHARGE 75 → 45 s). Fibel-Seite „Verstecke der Sieben“.
const VST = { orte: [], found: new Set(), such: null, fertig: false, tipp: new Set(), batt: null };
MOD_SAVE.push(['verstecke', () => [...VST.found], v => { if (Array.isArray(v)) v.forEach(k => VST.found.add(k)); }]);
const VST_ZONE = { x0: -76, x1: 76, z0: -34, z1: 34 }; // Ortskern Kapitel 1–5 (Straßen, Gärten, Höfe)
function vst_belegt(x, z) { // Türen, Klickstellen, Häuser innen: dort nichts verstecken
  if (VST.ip) { for (const q of VST.ip) if (Math.hypot(q[0] - x, q[1] - z) < 2.2) return true; } // 10.10.: Weltpositionen einmal je Suche (vorher je Zelle neu: 240-ms-Standbilder nach 15 s)
  else for (const m of interactables) { if (!m || !m.position) continue; const p = m.getWorldPosition ? m.getWorldPosition(new THREE.Vector3()) : m.position; if (Math.hypot(p.x - x, p.z - z) < 2.2) return true; }
  return indoorRects.some(r => inRect(r, x, z, .5)); }
function vst_unten(x, z) { if (!mantleFree(x + 1.1, z, 0) && !mantleFree(x - 1.1, z, 0) && !mantleFree(x, z + 1.1, 0) && !mantleFree(x, z - 1.1, 0)) return null;
  const c = headCeiling(x, .05, z); if (!(c > .3 && c < .95)) return null; return { y: .02, decke: c }; }
function vst_weich() { if (VST.weich) return VST.weich; const W = VST.weich = new Set(); scene.traverse(o => { if (o.isMesh && o.userData.col && (o.material === M.hedge || /hecke|hedge|bush|busch|leaf|laub/i.test((o.material && o.material.name) || ''))) W.add(o.userData.col); }); return W; } // Hecken: oben stehen wäre unglaubwürdig
function vst_oben(x, z) { if (colliders.some(c => c.weich && x > c.minX - .4 && x < c.maxX + .4 && z > c.minZ - .4 && z < c.maxZ + .4)) return null; const W = vst_weich(); let t = -Infinity; for (const c of colliders) if (c.minX > -9000 && !W.has(c) && !c.weich && c.top > 1.0 && c.top < 1.75 && x > c.minX + .3 && x < c.maxX - .3 && z > c.minZ + .3 && z < c.maxZ - .3 && c.top > t) t = c.top;
  const sg = solidGround(x, 1.4, z); if (sg > 1.0 && sg < 1.75 && sg > t) t = sg; if (t < 1.0) return null; if (typeof leben_free === 'function' && !leben_free(x, z, t - .25, .2)) return null; // unter der Fläche weiches Gestrüpp (Busch, Hecke als Form): keine Standfläche
  for (const [dx, dz] of [[.25, 0], [-.25, 0], [0, .25], [0, -.25]]) { const q = mantleGround(x + dx, z + dz, t); if (Math.abs(q - t) > .06) return null; }
  if (!mantleFree(x, z, t) || headCeiling(x, t + .1, z) - t < HEAD_CLEAR) return null;
  let rand_ = false; for (const [dx, dz] of [[1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]) { const g = mantleGround(x + dx, z + dz, 0); if (t - g > 1.0 && t - g < 1.6 && mantleFree(x + dx, z + dz, g)) { rand_ = true; break; } }
  return rand_ ? { y: t } : null; }
// Gewählte Orte an erkennbaren Dingen (gemessen: geparkte Autos und das Autowrack). „unten“: unter dem Schweller, die Klickfläche ragt 35 cm
// heraus (geduckt sichtbar und erreichbar); „oben“: Mitte der Dachfläche. Jeder Ort wird beim Laden geprüft (echte Höhe, Standfläche, Weg hinauf) – fällt einer durch,
// springt die automatische Suche ein (ohne Hecken).
const VST_WAHL = [
  { art: 'unten', x: 36.5, z: 3.7, hx: 36.5, hz: 4.15 }, { art: 'unten', x: -49.2, z: 3.7, hx: -49.2, hz: 4.15 },
  { art: 'unten', x: 2.5, z: -37.0, hx: 2.95, hz: -37.0 }, { art: 'unten', x: -74.6, z: 3.3, hx: -74.6, hz: 3.95 },
  { art: 'oben', x: -8.5, z: -13.1 }, { art: 'oben', x: 36.0, z: 3.1 }, { art: 'oben', x: -50.0, z: 3.1 }, { art: 'oben', x: 1.9, z: -37.6 }]; // Dächer: Autowrack und drei Autos
function vst_pruef(O) {
  if (O.art === 'unten') { const c = headCeiling(O.x, .05, O.z); if (!(c > .2 && c < 1.0)) return null; if (!mantleFree(O.hx + (O.hx - O.x) * 1.6, O.hz + (O.hz - O.z) * 1.6, 0)) return null; return { ...O, y: .02, decke: c }; }
  let t = -Infinity; for (const c of colliders) if (c.minX > -9000 && !c.weich && c.top > .9 && c.top < 1.75 && O.x > c.minX && O.x < c.maxX && O.z > c.minZ && O.z < c.maxZ) t = Math.max(t, c.top);
  const sg = solidGround(O.x, 1.6, O.z); if (sg > .9 && sg < 1.8) t = Math.max(t, sg); if (!(t > .9)) return null;
  if (headCeiling(O.x, t + .1, O.z) - t < HEAD_CLEAR) return null;
  for (let a = 0; a < 8; a++) { const gx = O.x + Math.sin(a * .785) * 2.4, gz = O.z + Math.cos(a * .785) * 2.4, g = mantleGround(gx, gz, 0); if (t - g > .45 && t - g < 1.65 && mantleFree(gx, gz, g)) return { ...O, y: t }; }
  return null; }
function* vst_sucher() { const R = [];
  { const P = new THREE.Vector3(); VST.ip = []; for (const m of interactables) { if (!m || !m.position) continue; const p = m.getWorldPosition ? m.getWorldPosition(P) : m.position; VST.ip.push([p.x, p.z]); } yield; }
  for (const O of VST_WAHL) { const q = vst_pruef(O); if (q) R.push(q); yield; }
  const fehlt = { unten: 4 - R.filter(o => o.art === 'unten').length, oben: 4 - R.filter(o => o.art === 'oben').length };
  if (fehlt.unten > 0 || fehlt.oben > 0) { const U = [], O2 = []; let n = 0;
    for (let x = VST_ZONE.x0; x <= VST_ZONE.x1; x += 1.3) for (let z = VST_ZONE.z0; z <= VST_ZONE.z1; z += 1.3) { if (++n % 6 === 0) yield;
      if (vst_belegt(x, z)) continue; if (fehlt.unten > 0) { const u = vst_unten(x, z); if (u) U.push({ x, z, hx: x, hz: z, ...u, art: 'unten' }); } if (fehlt.oben > 0) { const o = vst_oben(x, z); if (o) O2.push({ x, z, ...o, art: 'oben' }); } }
    const wahl = (L, k) => { const Q = []; for (const p of L) { if (Q.length >= k) break; if ([...R, ...Q].every(q => Math.hypot(q.x - p.x, q.z - p.z) > 18)) Q.push(p); } return Q; };
    R.push(...wahl(U, fehlt.unten), ...wahl(O2, fehlt.oben)); }
  VST.ip = null;
  VST.orte = R.map((p, i) => ({ ...p, key: 'vst_' + p.art + '_' + Math.round(p.x) + '_' + Math.round(p.z), i })); }
async function vst_bau() {
  let batt = null; try { batt = await msModel('../ue/batterie', 'model.glb'); } catch (e) {}
  for (const O of VST.orte) { if (VST.found.has(O.key)) continue;
    if (O.art === 'unten' && typeof glanz_neu === 'function') { const it = glanz_neu({ size: .07 }); it.g.position.set(O.x, O.y + .01, O.z); scene.add(it.g); O.vis = it.g; }
    else if (batt) { const b = msFit(batt.clone(true), .07, 'max'); const g = new THREE.Group(); g.add(b); g.position.set(O.x, O.y + .015, O.z); g.rotation.set(0, O.i * 1.3, Math.PI / 2); g.userData.noCol = true; b.traverse(m => { if (m.isMesh) m.castShadow = true; }); scene.add(g); O.vis = g; }
    const hx = O.hx ?? O.x, hz = O.hz ?? O.z, hit = O.art === 'unten' ? box(.7, .28, .7, (O.x + hx) / 2, .14, (O.z + hz) / 2, hidden, { cast: false }) : box(.6, .5, .6, O.x, O.y + .2, O.z, hidden, { cast: false }); O.hit = hit;
    hit.userData.hl = O.art === 'unten' ? 'glanz' : 'wichtig'; hit.userData.hlObj = () => O.vis && O.vis.visible ? O.vis : null;
    interact(hit, () => O.art === 'unten' ? (crouchK > .6 ? 'Hervorholen' : 'Da unten liegt was') : (player.pos.y > O.y - .35 ? 'Aufheben' : 'Da oben liegt was'), () => vst_nimm(O)); }
}
function vst_nimm(O) {
  if (O.art === 'unten' && crouchK < .6) return toast('Zu tief. Duck dich (Strg oder C), dann kommst du ran.', 3200);
  if (O.art === 'oben' && player.pos.y < O.y - .35) return toast('Zu hoch. Spring an die Kante (Leertaste) und zieh dich hoch.', 3400);
  VST.found.add(O.key); uninteract(O.hit); if (O.vis) O.vis.visible = false; try { if (typeof glanz_klang === 'function') glanz_klang(O.x, O.y, O.z); } catch (e) {}
  if (O.art === 'unten') { const W = ['kronkorken', 'knopf', 'pfennig']; if (typeof tausch_gib === 'function') tausch_gib(W[O.i % W.length]); else addBattery(1); }
  else addBattery(1);
  const n = VST.orte.filter(o => VST.found.has(o.key)).length, N = VST.orte.length; sideStart('verstecke'); story.side.verstecke.desc = `Verstecke: ${n} / ${N}. Unten nur geduckt, oben nur mit Hochziehen.`;
  if (n === 1) setTimeout(() => { if (typeof gedanke === 'function') gedanke('vst_1', 'Ein Kinderversteck. Lucy und ich hatten auch welche. Wo Erwachsene nie hinsehen: ganz unten und ganz oben.', 600, 3); }, 1200);
  if (n >= N && !VST.fertig) { VST.fertig = true; setTimeout(() => { sideDone('verstecke', 'Alle Verstecke gefunden.'); try { VISION_RECHARGE = 45; } catch (e) {}
    story.lore.push({ key: 'verstecke', title: 'Verstecke der Sieben', html: '<span class="hand">Alle gefunden. Unter Autos, auf Dächern, auf Mauern. Sieben Kinder, die wussten, wo man sich klein macht und wo man hochklettert.\n\nSeitdem werden die Lichtsteine schneller warm. Als hätten die Verstecke etwas zurückgegeben.</span>\n<small>Kinderblick (G) lädt jetzt in 45 statt 75 Sekunden nach.</small>' });
    try { questPop('BELOHNUNG', 'Kinderblick lädt schneller'); } catch (e) {} }, 1800); } }
// Tipps beim ersten Sichten: was man tun muss (einmal je Art)
function vst_tipps() { const P = player.pos;
  for (const O of VST.orte) { if (VST.found.has(O.key) || VST.tipp.has(O.art)) continue; const d = Math.hypot(O.x - P.x, O.z - P.z); if (d > 6.5) continue;
    camera.getWorldDirection(_vstV); const dx = O.x - camera.position.x, dz = O.z - camera.position.z, dl = Math.hypot(dx, dz) || 1; if ((_vstV.x * dx + _vstV.z * dz) / dl < .8) continue;
    VST.tipp.add(O.art); if (typeof gedanke === 'function') gedanke('vst_tipp_' + O.art, O.art === 'unten' ? 'Da unten glänzt was. Da passt nur rein, wer sich klein macht. (Strg oder C: ducken)' : 'Da oben liegt was. Springen, an die Kante, hochziehen. (Leertaste)', 0, 3); } }
const _vstV = new THREE.Vector3();
story.side.verstecke = story.side.verstecke || { title: 'Verstecke der Sieben', desc: 'Kinder verstecken Dinge, wo Erwachsene nie hinsehen: ganz unten und ganz oben.', state: 'hidden' };
WORLD_MODS.push(['Verstecke', async () => {}]);
WORLD_TICK.push(dt => { try {
  if (!state.started || menu.attract) return;
  if (!VST.such && !VST.orte.length && performance.now() > (VST.ab || (VST.ab = performance.now() + 15000))) VST.such = vst_sucher();
  if (VST.such) { const t0 = performance.now(); while (performance.now() - t0 < 4) { if (VST.such.next().done) { VST.such = null; vst_bau(); break; } } return; }
  if ((VST.tT = (VST.tT || 0) - dt) < 0) { VST.tT = .4; vst_tipps(); } } catch (e) { if (!VST.err) { VST.err = 1; console.warn('Verstecke', e); } } });
window.__verstecke = { S: VST, nimm: i => vst_nimm(VST.orte[i]) }; // Testzugriff
