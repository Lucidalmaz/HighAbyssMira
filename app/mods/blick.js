// =====================================================================  BLICK (Modul „blick“, Nutzer-Rückmeldung 02.10.2026): man schaut immer dorthin, wo etwas passiert
// Nutzer: „viele Schreckmomente und story-relevante Szenen verpasst man, wenn man nicht weiß, wohin man schauen soll … baue ein System ein, dass man immer richtig schaut.“
// Grundsatz (RE Village / The Last of Us II / Alan Wake 2): Blicklenkung ist ein Angebot, kein Zwang. Die Kamera dreht sich weich zum Ereignis (Ease-in/out, nie ruckartig,
// Nick höchstens 0,55 rad), die Maus gewinnt IMMER: sobald der Spieler selbst dreht, bricht die Lenkung ab und ruht 3 s. Nie in Filmszenen, QTE, Notizen, Skript-Bewegung,
// bei Jagd/Flucht (da schaut man ohnehin) und nie, wenn das Ziel schon im Blickfeld ist. Einstellung „Hilfe“ (settings.hilfe): 0 aus · 1 sanft (Standard) · 2 deutlich (schneller, auch Ziele).
// Auslöser (ohne dass andere Module etwas wissen müssen):
//   · Wesen taucht auf (Kindschatten, Graukind, Peter, Echo-Figuren, Figuren der Basis, Justin) und ist < 32 m entfernt, aber nicht im Blick → weicher Schwenk.
//   · UFO erscheint (state.ufoOn) → Blick nach oben zum Licht.
//   · Neues Hauptziel mit bekanntem Ort (nächster offener Story-Hinweis aus HINTS) und Hilfe = 2 → sanfter Schwenk in Richtung Ziel.
// Schnittstelle für Module: blick_hin(x, y, z, { sek, schnell, art }) – bei Skript-Schreckmomenten kurz davor aufrufen. Testzugriff window.__blick.
const BLICK = { t: null, cancelUntil: 0, cool: 0, ly: 0, lp: 0, vis: new Map(), scan: 0, ufoWar: false, objT: 0, n: { start: 0, abbruch: 0, ziel: 0 }, log: [] };
const blick_stufe = () => { try { const h = settings.hilfe; return h === 0 || h === 2 ? h : 1; } catch (e) { return 1; } };
function blick_frei() { // darf die Lenkung jetzt überhaupt arbeiten?
  try { if (!state.started || state.ending || (typeof menu !== 'undefined' && menu.attract)) return false; if (ui.overlay) return false; if (scripted || camOverride) return false;
    if (typeof kino_S !== 'undefined' && kino_S.on) return false; if (typeof qte_S !== 'undefined' && qte_S && qte_S.on) return false;
    if (typeof SP !== 'undefined' && SP.chase) return false; if (ch2.chase === 'run' || ch3.chase === 'run') return false; if (document.pointerLockElement === null && !window.__testMove) return false; } catch (e) { return false; }
  return true; }
function blick_winkel(x, y, z) { const c = camera.position, dx = x - c.x, dz = z - c.z, h = Math.hypot(dx, dz) || 1e-6;
  const yaw = Math.atan2(-dx, -dz), pitch = Math.max(-.55, Math.min(.55, Math.atan2(y - c.y, h)));
  let dy = yaw - player.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); return { yaw, pitch, dy, dp: pitch - player.pitch, off: Math.hypot(dy, (pitch - player.pitch) * .6) }; }
function blick_hin(x, y, z, o = {}) {
  const s = blick_stufe(); if (s === 0 || !blick_frei()) return false; const now = performance.now() / 1000; if (now < BLICK.cancelUntil || now < BLICK.cool) return false;
  const w = blick_winkel(x, y, z); if (w.off < .5) return false; // schon im Blickfeld (≈ 29°)
  BLICK.t = { x, y, z, bis: now + (o.sek || 2.4), v: (o.schnell ? 3.6 : 1.5) * (s === 2 ? 1.5 : 1), art: o.art || 'ereignis', t0: now }; BLICK.ly = player.yaw; BLICK.lp = player.pitch; BLICK.n.start++;
  BLICK.log.push([Math.round(now), BLICK.t.art, +x.toFixed(1), +z.toFixed(1)]); if (BLICK.log.length > 40) BLICK.log.shift(); return true; }
function blick_stop(grund) { if (BLICK.t) { BLICK.t = null; BLICK.cool = performance.now() / 1000 + 4; if (grund === 'maus') { BLICK.n.abbruch++; BLICK.cancelUntil = performance.now() / 1000 + 3; } } }
function blick_step(dt) {
  const T = BLICK.t, now = performance.now() / 1000; if (!T) return;
  if (!blick_frei() || now > T.bis) return blick_stop('ende');
  // Maus gewinnt: hat der Spieler seit unserem letzten Schritt selbst gedreht, sofort aufhören
  if (Math.abs(player.yaw - BLICK.ly) > .012 || Math.abs(player.pitch - BLICK.lp) > .012) return blick_stop('maus');
  const w = blick_winkel(T.x, T.y, T.z); if (w.off < .17) return blick_stop('ziel'); // angekommen (≈ 10°)
  const k = Math.min(1, (now - T.t0) / .45) * Math.min(1, .25 + w.off / .6); // sanft anfahren, vor dem Ziel auslaufen
  const sy = Math.sign(w.dy) * Math.min(Math.abs(w.dy), T.v * k * dt * 1.0), sp = Math.sign(w.dp) * Math.min(Math.abs(w.dp), T.v * .6 * k * dt);
  player.yaw += sy; player.pitch += sp; BLICK.ly = player.yaw; BLICK.lp = player.pitch; }
// Wesen, die plötzlich da sind
function blick_wesen() { const L = []; const add = o => { if (o && o.isObject3D) L.push(o); };
  try { add(kidShadow); add(zombie); add(grey); if (typeof FIGS !== 'undefined') FIGS.forEach(add); if (typeof echoFigs !== 'undefined') echoFigs.forEach(add); if (typeof justin !== 'undefined' && justin.g) add(justin.g); } catch (e) {}
  return L; }
const _bv = new THREE.Vector3();
function blick_scan() {
  const c = camera.position;
  for (const o of blick_wesen()) { let v = o.visible; for (let p = o.parent; v && p; p = p.parent) if (!p.visible) v = false; const war = BLICK.vis.get(o); BLICK.vis.set(o, v);
    if (!v || war !== false) continue; o.getWorldPosition(_bv); const d = Math.hypot(_bv.x - c.x, _bv.z - c.z); if (d < 1.5 || d > 32 || Math.abs(_bv.y - c.y) > 8) continue;
    blick_hin(_bv.x, _bv.y + 1.15 * (o.scale ? Math.max(.5, o.scale.y) : 1), _bv.z, { art: 'wesen', sek: 2.2 }); }
  try { if (state.ufoOn && !BLICK.ufoWar) { BLICK.ufoWar = true; setTimeout(() => { try { blick_hin(ufo.position.x, ufo.position.y, ufo.position.z, { art: 'ufo', sek: 3 }); } catch (e) {} }, 1200); } else if (!state.ufoOn) BLICK.ufoWar = false; } catch (e) {}
}
// Neues Hauptziel mit bekanntem Ort: nur bei „Hilfe: deutlich“ weicher Schwenk (Stufe 1 bleibt bei der Ziel-Anzeige, nichts wird dem Spieler aus der Hand genommen)
function blick_ziel() { if (blick_stufe() < 2 || typeof ziele_hinweis !== 'function') return; const h = ziele_hinweis(); if (!h || h.d > 90 || h.d < 3) return;
  let y = 1.3; try { for (const q of HINTS) if (q.x === h.x && q.z === h.z) { y = q.y || 1.3; break; } } catch (e) {} if (blick_hin(h.x, y, h.z, { art: 'ziel', sek: 2.2 })) BLICK.n.ziel++; }
WORLD_MODS.push(['Blick', async () => {
  const el = document.getElementById('objText'); if (el && window.MutationObserver) new MutationObserver(() => { clearTimeout(BLICK.objT); BLICK.objT = setTimeout(blick_ziel, 1600); }).observe(el, { childList: true, characterData: true, subtree: true });
}]);
WORLD_TICK.push((dt) => { try { BLICK.scan -= dt; if (BLICK.scan < 0) { BLICK.scan = .25; blick_scan(); } blick_step(dt); } catch (e) { if (!BLICK.err) { BLICK.err = 1; console.warn('Blick', e); } } });
window.__blick = { S: BLICK, wesen: blick_wesen, scan: blick_scan, frei: blick_frei, hin: (x, y, z, o) => blick_hin(x, y, z, o), stop: () => blick_stop('test') }; // Testzugriff
