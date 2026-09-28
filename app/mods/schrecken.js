// =====================================================================  SCHRECKEN (Modul „schrecken“): Schreckmomente in der ganzen erweiterten Welt
// Der Regisseur des Grundspiels arbeitet nur auf der Hauptstraße (|x| < 76, |z| < 30). Dieses Modul bespielt alles andere:
// feste, einmalige Momente an Orten (Friedhof, Spielplatz, Kapelle, Schrebergärten, vorderer Wald, Villa-Garten) und seltene Zufallsmomente
// (Laternenmann, Schritte hinter dir, Gestalt zwischen den Bäumen, Flüstern). Nie zwei kurz nacheinander (≥ 75 s), nie in Gesprächen, Filmszenen oder Verfolgungen.
// Der tiefe Wald (Modul tiefwald) hat eigene Momente und ist hier ausgenommen.
const schreck_S = { last: -999, t: 0, fig: null, lampOff: null, follow: null, done: new Set(), randT: 60 };
function schreck_ok() {
  return state.started && !state.talking && !state.ending && !ui.overlay && !menu.attract && !scripted && !state.inBasement && state.zone !== 'canal' && !dir.busy
    && !(typeof hunt !== 'undefined' && hunt.on) && !(ch3.on && ch3.part === 'white') && !(typeof anwesen_S !== 'undefined' && anwesen_S.inHall);
}
function schreck_main(x, z) { return Math.abs(x) < 76 && Math.abs(z) < 30; } // Revier des Grundspiel-Regisseurs
function schreck_deep(x, z) { return typeof tief_in === 'function' && tief_in(x, z, 2); }
const _sfw = new THREE.Vector3(), _sft = new THREE.Vector3();
function schreck_fwd() { camera.getWorldDirection(_sfw); _sfw.y = 0; return _sfw.normalize(); }
// Gestalt zeigen (die des Grundspiels, solange dessen Regisseur sie nicht braucht): verschwindet, wenn man sie ansieht oder ihr zu nahe kommt
function schreck_figur(x, z, o = {}) {
  if (dir.busy || !stalker) return false; setFace(stalker, o.face || 'pale'); stalker.scale.setScalar(o.scale || 1); stalker.position.set(x, 0, z); stalker.visible = true; dir.busy = true;
  schreck_S.fig = { t: 0, seen: 0, run: !!o.run, dx: o.dx || 0, dz: o.dz || 0, sp: o.sp || 4.5, big: !!o.big, lamp: o.lamp || null, ttl: o.ttl || 10, onSeen: o.onSeen || null }; return true;
}
function schreck_weg() { stalker.visible = false; stalker.scale.setScalar(1); dir.busy = false; schreck_S.fig = null; }
function schreck_mark(t) { schreck_S.last = t; scareCount++; }
// ---------------------------------------------------------------- feste Momente (je einmal)
const SCHRECK_ORTE = [
  { id: 'friedhof', x: -48.6, z: 73.5, r: 13, when: () => true, run(t) { // ein Kind neben dem achten Stein – und jemand zählt
      const P = player.pos, dx = -48.65 - P.x, dz = 72.95 - P.z, d = Math.hypot(dx, dz), f = schreck_fwd(); if (d < 7 || (dx * f.x + dz * f.z) / d < .6) return false; // erst aus der Entfernung, mit Blick zum Stein
      if (!schreck_figur(-48.65 + dx / d * 1.8, 72.95 + dz / d * 1.8, { face: 'pale', scale: .6, ttl: 9, big: true })) return false;
      Audio.whisper(-48.6, 1, 73, 2.2); subtitle('<i>Ganz leise, ein Kind: „… fünf … sechs … sieben …“</i>', 4200); return true; } },
  { id: 'kapelle', x: -52.5, z: 83.5, r: 9, when: () => true, run(t) { // die Glocke schlägt einmal – dann ein zweites Mal, von innen
      Audio.play('metalHit2', { gain: .55, rate: .22, x: -52.5, y: 9, z: 86.6, ref: 25 }); shake = .02;
      setTimeout(() => { Audio.play('metalHit2', { gain: .35, rate: .2, x: -52.5, y: 1.5, z: 87.5, ref: 8 }); Audio.knock(); subtitle('<i>Die Kapellenglocke. Einmal. Dann noch einmal – diesmal von drinnen, direkt hinter der Tür.</i>', 4600); }, 2600); return true; } },
  { id: 'spielplatz', x: 31.5, z: 72, r: 10, when: () => ch3.on || (typeof anwesen_S !== 'undefined' && anwesen_S.ch4), run(t) { // alles bewegt sich auf einmal
      try { const M_ = ausbau_nord.merry; M_.w = 2.2; M_.frozen = false; M_.auto = true; } catch (e) {}
      const f = schreck_fwd(); Audio.giggle(player.pos.x - f.x * 2, 1, player.pos.z - f.z * 2); setTimeout(() => Audio.giggle(40.6, 1, 78.8), 900);
      setTimeout(() => { schreck_figur(player.pos.x + f.x * 17 - f.z * 6, player.pos.z + f.z * 17 + f.x * 6, { face: 'lena', scale: .58, run: true, dx: f.z, dz: -f.x, sp: 3.2, ttl: 4 }); }, 1600); return true; } },
  { id: 'garten', x: -115, z: 26, r: 16, when: () => true, run(t) { // zwischen den Beeten steht jemand und rührt sich nicht
      const f = schreck_fwd(); return schreck_figur(player.pos.x + f.x * 16 + f.z * 3, player.pos.z + f.z * 16 - f.x * 3, { face: 'grey', ttl: 12, big: true, onSeen: () => { Audio.whisper(player.pos.x, 1.6, player.pos.z, 1.2); } }); } },
  { id: 'baumhaus', x: -22, z: 138, r: 10, when: () => true, run(t) { // oben im Baumhaus fällt etwas um, dann tropft etwas herunter
      Audio.play('woodFall1', { gain: .5, x: -22, y: 2.4, z: 141, ref: 5 }); setTimeout(() => { Audio.play('woodHit2', { gain: .3, rate: .8, x: -22, y: 2.4, z: 141, ref: 5 }); Audio.caw(-20, 6, 139); Audio.flap(-21, 5, 140); }, 700); shake = .03; return true; } },
  { id: 'fuchsbau', x: 74, z: 129.5, r: 8, when: () => true, run(t) { // Fuchsschrei direkt neben dir – klingt wie eine Frau
      const f = schreck_fwd(); Audio.fox(player.pos.x - f.z * 3, player.pos.z + f.x * 3); shake = .04; setTimeout(() => { if (typeof gedanke === 'function') gedanke('schreck_fuchs', 'Nur ein Fuchs. … Nur ein Fuchs. Füchse klingen so. Sagt man.', 0, 3); }, 2200); return true; } },
  { id: 'villa_garten', x: -125, z: 52, r: 10, when: () => true, run(t) { // oben geht ein Fenster auf, eine Spieluhr, dann schlägt es zu
      Audio.creak(.4); if (Audio.musicBox) Audio.musicBox(); setTimeout(() => { Audio.play(Audio.pick('woodSlam1', 'woodSlam2'), { gain: .7, x: -125, y: 6, z: 61, ref: 10 }); shake = .04; }, 3800); return true; } },
];
// ---------------------------------------------------------------- Tick
WORLD_MODS.push(['Schrecken', async () => {}]); // Eintrag für die Messanzeige (ein Tick je Modul)
WORLD_TICK.push((dt, t) => {
  const S = schreck_S; if (!state.started || menu.attract) return; const P = player.pos;
  // laufende Gestalt
  if (S.fig) { const F = S.fig; F.t += dt; stalker.lookAt(P.x, 0, P.z); const f = schreck_fwd();
    if (F.run) { stalker.position.x += F.dx * F.sp * dt; stalker.position.z += F.dz * F.sp * dt; if (Math.floor(F.t * 5) !== F.st) { F.st = Math.floor(F.t * 5); Audio.stepAt(stalker.position.x, stalker.position.z, .45); } }
    _sft.set(stalker.position.x - camera.position.x, 1.2 * stalker.scale.y + stalker.position.y - camera.position.y, stalker.position.z - camera.position.z); const d = _sft.length(); _sft.normalize();
    camera.getWorldDirection(_sfw); if (_sfw.dot(_sft) > .972) F.seen += dt;
    const need = F.big ? .7 : .35; if (F.seen > need || d < 6 || F.t > F.ttl || state.talking) { if (F.seen > need) { if (F.big) { Audio.scareSound('violin'); glitchV = .55; shake = .04; } else Audio.stinger(false); if (F.onSeen) F.onSeen(); }
      if (F.lamp) { const L = F.lamp, prev = L.mode; L.mode = 'off'; setTimeout(() => { if (L.mode === 'off') L.mode = prev; }, 700); } schreck_weg(); } }
  // Schritte hinter dir: halten an, wenn du anhältst – dann ein Flüstern
  if (S.follow) { const F = S.follow, spd = Math.hypot(vel.x, vel.z), f = schreck_fwd(); F.t -= dt;
    if (spd > 1) { F.step -= dt; if (F.step < 0) { F.step = .52; const st = typeof klang_surface === 'function' && klang_surface(false) === 'leaves' ? Audio.pick('stepG1', 'stepG2', 'stepG3') : Audio.pick('stepWet1', 'stepWet2', 'stepWet3');
        setTimeout(() => Audio.play(st, { gain: .3, x: P.x - f.x * 3.5, y: 0, z: P.z - f.z * 3.5, ref: 3 }), 240); } F.still = 0; } else F.still += dt;
    if (F.still > 1.3 || F.t < 0) { if (F.still > 1.3) { Audio.play('stepWet2', { gain: .32, x: P.x - f.x * 2.2, y: 0, z: P.z - f.z * 2.2, ref: 3 }); setTimeout(() => Audio.whisper(P.x - f.x, 1.6, P.z - f.z, 1.5), 900); schreck_mark(t); } S.follow = null; } }
  S.t -= dt; if (S.t > 0) return; S.t = .5;
  if (!schreck_ok() || S.fig || S.follow || t - S.last < 75 || schreck_deep(P.x, P.z)) return;
  const indoor = indoorRects.some(r => P.x > r.x0 && P.x < r.x1 && P.z > r.zb && P.z < r.zf); if (indoor) return;
  // feste Momente
  for (const O of SCHRECK_ORTE) { if (S.done.has(O.id) || !O.when() || Math.hypot(P.x - O.x, P.z - O.z) > O.r) continue; if (O.run(t) !== false) { S.done.add(O.id); schreck_mark(t); return; } }
  // Zufall: nur außerhalb des Grundspiel-Reviers (dort arbeitet dessen Regisseur), selten
  if (schreck_main(P.x, P.z)) return; S.randT -= .5; if (S.randT > 0) return; S.randT = rand(80, 150);
  const f = schreck_fwd(), inWald = typeof wald_in === 'function' && wald_in(P.x, P.z), r = Math.random();
  if (r < .35) { S.follow = { t: 10, step: .3, still: 0 }; return; }
  if (inWald && r < .7) { const side = Math.random() < .5 ? 1 : -1, dd = rand(15, 21), x = P.x + f.x * dd - f.z * side * 8, z = P.z + f.z * dd + f.x * side * 8; if (schreck_figur(x, z, { face: ['pale', 'grey'][Math.floor(Math.random() * 2)], run: true, dx: f.z * side, dz: -f.x * side, sp: 5, ttl: 4 })) schreck_mark(t); return; }
  if (!inWald && r < .8) { // Laternenmann: unter einer Laterne vor dir steht jemand; siehst du hin, geht die Laterne aus – und er ist weg
    const L = (typeof lamps !== 'undefined' ? lamps : []).filter(L => L.mode === 'on' && L.wx !== undefined).map(L => { const dx = L.wx - P.x, dz = L.wz - P.z, d = Math.hypot(dx, dz); return { L, d, c: (dx * f.x + dz * f.z) / (d || 1) }; })
      .filter(o => o.d > 18 && o.d < 34 && o.c > .88).sort((a, b) => a.d - b.d)[0];
    if (L && schreck_figur(L.L.wx + .6, L.L.wz + .4, { face: ['pale', 'wendt', 'grey'][Math.floor(Math.random() * 3)], lamp: L.L, ttl: 14 })) schreck_mark(t); return; }
  Audio.whisper(P.x - f.x * 1.5, 1.6, P.z - f.z * 1.5, 1.6); schreck_mark(t);
});
MOD_SAVE.push(['schrecken', () => [...schreck_S.done], v => v.forEach(id => schreck_S.done.add(id))]);
window.__schreck = { S: schreck_S, orte: SCHRECK_ORTE, ok: () => schreck_ok(), figur: (x, z, o) => schreck_figur(x, z, o) }; // Testzugriff
