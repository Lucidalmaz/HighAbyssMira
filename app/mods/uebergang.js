// =====================================================================  ÜBERGANG (Modul „uebergang“): Kapitel 1 → 2 ohne Schnitt
// Hinter der Zeichnungswand im Keller von Nr. 7 (Südwand z = 296) liegt ein Versorgungsgang. Mit der Brechstange bricht Luke die Wand auf
// und läuft hinunter ins Amt. Technik: zwei baugleiche Gangstücke K1 (am Keller) und K2 (am Amtstunnel, Westtür bei x = 600).
// In der Mitte des geraden Stücks wird der Spieler unbemerkt von K1 nach K2 versetzt (und zurück, falls er umkehrt): Knicke an beiden
// Enden verhindern, dass man weiter als bis zum baugleichen Teil sieht. Betritt er den Amtstunnel, beginnt Kapitel 2 und die Stahltür
// fällt hinter ihm zu. Relative Maße (m): gerades Stück x 0…12, Knick A (Norden, zum Keller) bei x 0, Knick B (Süden) bei x 12.
const uebergang_S = { K1: { x: 298, z: 292.2 }, K2: { x: 584, z: -2597 }, MID: 6, W: .8, ready: false, open: false, prev: null, lights: [] };
function uebergang_corr(O, side, M) {
  const b = (w, h, d, x, y, z, mat = M.wall) => box(w, h, d, O.x + x, y, O.z + z, mat, { collide: true }), H = 2.5, y = H / 2;
  b(.2, H, 4.9, -.9, y, 1.45); b(.2, H, 3, .9, y, 2.3);                // Knick A: West- und Ostwand
  b(12, H, .2, 6.8, y, .9); b(12, H, .2, 5.2, y, -.9);                  // gerades Stück: Nord- und Südwand (Öffnungen zu A bzw. B)
  b(.2, H, 3, 11.1, y, -2.3);                                          // Knick B: Westwand
  if (side === 'k1') { b(.2, H, 4.8, 12.9, y, -1.5); b(2, H, .2, 12, y, -3.9); }                 // Knick B endet blind (wird nie erreicht)
  else { b(.2, H, 3.1, 12.9, y, -.65); b(4.9, H, .2, 13.55, y, -3.9); b(3.1, H, .2, 14.45, y, -2.1); // Knick B → Gang C zur Amtstür
    b(1.8, H, .2, 0, y, 3.9); }                                         // Knick A endet blind (wird nie erreicht)
  plane(17.2, 8.2, O.x + 7.6, .012, O.z - .1, M.floor);                  // Boden
  box(17.2, .2, 8, O.x + 7.6, H + .1, O.z - .1, M.ceil, { cast: false }); // Decke
  // Lampen an identischen Stellen, Flackern in beiden Stücken zeitgleich (sonst springt das Licht beim Versetzen)
  for (const [x, z, col, int, flick] of [[0, 2.4, 0xffc890, .7, 0], [3, 0, 0xffe0b0, 1.1, 1], [9.4, 0, 0xffe0b0, 1.0, 2], [12, -2.4, 0xd8ecff, .8, 0]]) {
    const tube = box(.08, .05, .9, O.x + x, H - .03, O.z + z, new THREE.MeshStandardMaterial({ color: 0x111111, emissive: col, emissiveIntensity: 2 }), { cast: false });
    const l = new VLight(col, int, 6, 2); l.position.set(O.x + x, H - .3, O.z + z); scene.add(l); uebergang_S.lights.push({ tube, l, int, flick });
  }
}
// Ein Stück der Zeichnungen (u/v-Ausschnitt der Originalfläche) als eigene Fläche
function uebergang_art(art, u0, u1, v0, v1) {
  const g = new THREE.PlaneGeometry(8 * (u1 - u0), 3.8 * (v1 - v0)), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  const m = new THREE.Mesh(g, art.material); m.position.set(295.5 + 8 * (u0 + u1) / 2, 3.8 * (v0 + v1) / 2, art.position.z); m.rotation.copy(art.rotation); m.receiveShadow = true; scene.add(m); return m;
}
WORLD_MODS.push(['Übergang Kapitel 2', async () => {
  if (!SEAMLESS) return; const S = uebergang_S;
  const wallMat = msSurfMat('facade_concrete', { tint: 0x8e8b84 }), floorMat = msSurfMat('wet_asphalt', { tint: 0x77736c }), ceilMat = msSurfMat('facade_concrete', { tint: 0x5c5a56 });
  for (const m of [wallMat, floorMat, ceilMat]) m.userData.tile = 2;
  const M = { wall: wallMat, floor: floorMat, ceil: ceilMat };
  uebergang_corr(S.K1, 'k1', M); uebergang_corr(S.K2, 'k2', M);
  // Kellersüdwand: Original ausblenden, mit Türöffnung (x 297.4…298.6, 2,1 m hoch) neu bauen, Öffnung mit einem „Pfropfen“ verschließen
  const old = msFind((m, bb) => m.geometry && m.geometry.type === 'BoxGeometry' && Math.abs((bb.min.z + bb.max.z) / 2 - 296) < .2 && bb.max.x - bb.min.x > 9 && bb.min.y < .3 && bb.min.x > 294 && bb.max.x < 306);
  const mat = old[0] ? old[0].material : M.block; old.forEach(msHide);
  wall('x', 296, 295, 305, 2.5, mat, [{ at: 298, w: 1.2 }], .2, 2.1);
  const plug = box(1.2, 2.1, .2, 298, 1.05, 296, mat, { collide: true });
  // Zeichnungen in Stücke: links, rechts, über der Öffnung, auf dem Pfropfen
  const art = B.wallArt, U0 = (297.4 - 295.5) / 8, U1 = (298.6 - 295.5) / 8, V = 2.1 / 3.8;
  const right = uebergang_art(art, U1, 1, 0, 1), top = uebergang_art(art, U0, U1, V, 1), gap = uebergang_art(art, U0, U1, 0, V);
  const left = uebergang_art(art, 0, U0, 0, 1); art.geometry = left.geometry; art.position.copy(left.position); scene.remove(left);
  interact(right, 'Zeichnungen ansehen', () => toast('Kinderzeichnungen. Immer dasselbe Motiv. Manche sind mit deinem Namen signiert.', 4500)); void top;
  S.plug = [plug, gap];
  interact(gap, () => !state.ch1Done ? 'Zeichnungen ansehen' : story.items.includes('brechstange') ? 'Wand aufbrechen' : 'Die Wand klingt hohl', () => {
    if (!state.ch1Done) return toast('Ein Blatt hängt schief. Dahinter klingt die Wand hohl – wie eine Tür, die jemand zugemauert hat.', 4600); // Vorahnung in Kapitel 1
    if (!story.items.includes('brechstange')) return toast('Hohl. Mit bloßen Händen kommst du da nicht durch. Oben im Hauswirtschaftsraum steht eine Werkbank.', 4800);
    S.open = true; uninteract(gap); S.plug.forEach(msHide); shake = Math.max(shake, .05);
    Audio.play('woodCrack', { gain: .9, x: 298, y: 1, z: 296, ref: 3 }); Audio.play('stones1', { gain: .7, delay: .25, x: 298, y: .5, z: 295.6, ref: 3 }); Audio.play('metalHit1', { gain: .4, delay: .1, rate: .8, x: 298, y: 1, z: 296, ref: 3 });
    setMain(8); subtitle('Die Wand gibt nach. Dahinter ist kein Keller mehr. Ein Gang – älter als das Haus.', 4800);
  });
  // Die echte Tür in der Westwand des Amtstunnels (innen_kapitel): um die Angel drehbar, steht offen, fällt bei Kapitel 2 zu
  const door = innen_kapitel_S.westDoor;
  if (door) { door.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(door), pv = new THREE.Group(); pv.position.set((bb.min.x + bb.max.x) / 2, 0, bb.min.z); scene.add(pv); pv.updateMatrixWorld(true); pv.attach(door);
    pv.rotation.y = 1.45; S.doorPv = pv;
    CH2_BEGIN.push(() => { tween(pv, { ry: 0 }, .45, () => { solidRefresh(pv); Audio.slam(); shake = Math.max(shake, .03); }); }); }
  CH2_BEGIN.push(() => { S.open = false; }); // Gang bleibt ab jetzt zu (Kapitel 2 läuft nur im Amt)
  S.ready = true;
}]);
WORLD_TICK.push((dt, t) => {
  const S = uebergang_S; if (!S.ready) return;
  // synchrones Flackern (nur eine Röhre je Stück flackert, gleich in K1 und K2)
  for (const L of S.lights) { const k = !L.flick ? 1 : (Math.sin(t * 13 + L.flick) > .93 || Math.sin(t * 2.1 + L.flick * 3) > .985) ? .15 : 1; L.l.intensity = L.int * k; L.tube.material.emissiveIntensity = 2 * k; }
  if (!S.open || ch2.on) return;
  const P = player.pos;
  const rel = O => ({ x: P.x - O.x, z: P.z - O.z }), a = rel(S.K1), b = rel(S.K2);
  const inS = r => Math.abs(r.z) < S.W && r.x > -.8 && r.x < 12.8;
  const side = inS(a) ? 'k1' : inS(b) ? 'k2' : null, r = side === 'k1' ? a : side === 'k2' ? b : null;
  if (r && S.prev && S.prev.side === side) {
    if (side === 'k1' && S.prev.x < S.MID && r.x >= S.MID) { P.x += S.K2.x - S.K1.x; P.z += S.K2.z - S.K1.z; S.prev = { side: 'k2', x: r.x }; return; }
    if (side === 'k2' && S.prev.x >= S.MID && r.x < S.MID) { P.x += S.K1.x - S.K2.x; P.z += S.K1.z - S.K2.z; S.prev = { side: 'k1', x: r.x }; return; }
  }
  S.prev = r ? { side, x: r.x } : null;
  // im Amtstunnel angekommen: Kapitel 2 beginnt, die Tür fällt hinter dem Spieler zu
  if (P.x > C2.x + .4 && P.x < C2.x + 17 && Math.abs(P.z - C2.z) < 1.9) {
    chapter2Begin(); questPop('KAPITEL 2', 'Das achte Kind'); setC2Objective(C2_MAIN[0]);
    setTimeout(() => subtitle('Hinter dir fällt die Tür ins Schloss. Auf dieser Seite hat sie keine Klinke. Es riecht nach Rost – und nach Sommer 2009.', 5200), 900);
  }
});

// =====================================================================  Kapitel 2 → 3: Wartungsschacht aus dem Tankraum bis unter den Gully an der Kreuzung
// Nach dem Finale öffnet sich eine Luke in der Tankraum-Decke, eine Leiter fällt herab. Luke klettert; in der Mitte des gleichförmigen Schachts wird er
// unbemerkt in den baugleichen Schacht unter der Kreuzung versetzt (Kapitel 3 beginnt), oben stemmt er den Gullydeckel auf und steigt auf die Straße.
const uebergang3_S = { SH: { x: 716.5, z: -2598.5 }, TOWN: { x: 9, z: -1.3 }, H: 14, C2Y: 2.5, TR: 9.5, speed: 1.1, open: false, lampTaken: false };
function uebergang3_shaft(cx, cz, y0, M, ladderMat) {
  const S = uebergang3_S, H = S.H, w = 1.2, t = .2, y = y0 + H / 2, b = (sx, sz, x, z) => box(sx, H, sz, x, y, z, M.wall, { collide: true });
  b(w + 2 * t, t, cx, cz - w / 2 - t / 2); b(w + 2 * t, t, cx, cz + w / 2 + t / 2); b(t, w, cx - w / 2 - t / 2, cz); b(t, w, cx + w / 2 + t / 2, cz);
  // Leiter an der Nordwand: zwei Holme + Sprossen alle 30 cm, eine zusammengefasste Geometrie (Rost-Scan)
  const parts = []; for (const dx of [-.22, .22]) { const g = new THREE.BoxGeometry(.05, H, .05); g.translate(cx + dx, y, cz + w / 2 - .08); parts.push(g); }
  for (let k = .3; k < H; k += .3) { const g = new THREE.BoxGeometry(.44, .035, .035); g.translate(cx, y0 + k, cz + w / 2 - .1); parts.push(g); }
  const lad = new THREE.Mesh(mergeGeometries(parts), ladderMat); lad.castShadow = lad.receiveShadow = true; lad.userData.noCol = true; scene.add(lad);
  const l = new VLight(0xbfd0ff, .35, 5, 2); l.position.set(cx, y0 + H - .6, cz); scene.add(l); // schwaches Licht oben (gleich in beiden Schächten)
  const cap = box(w + .3, .1, w + .3, cx, y0 + H - .06, cz, M.ceil, { cast: false }); // Abschluss oben, knapp unter der Oberkante (im Ort: Unterseite des Gullys, unsichtbar unter dem Asphalt)
  return { lad, cap };
}
WORLD_MODS.push(['Übergang Kapitel 3', async () => {
  if (!SEAMLESS) return; const S = uebergang3_S, SH = S.SH;
  const wall = msSurfMat('facade_concrete', { tint: 0x7c7a74 }), ceil = msSurfMat('rust_sheet', { tint: 0x6a6660 }), rust = msSurfMat('rust_sheet', { tint: 0x9a8e80 });
  for (const m of [wall, ceil, rust]) m.userData.tile = 1.5;
  const M = { wall, ceil };
  S.c2 = uebergang3_shaft(SH.x, SH.z, S.C2Y, M, rust);
  S.town = uebergang3_shaft(S.TOWN.x, S.TOWN.z, -S.H, M, rust);
  box(1.6, .2, 1.6, S.TOWN.x, -S.H - .1, S.TOWN.z, wall, { collide: true }); // Schachtsohle im Ort
  const red = new VLight(0xff3a20, .6, 5, 2); red.position.set(S.TOWN.x, -S.H + .8, S.TOWN.z); scene.add(red); // rotes Restlicht unten – wie der Notlicht-Tankraum
  // Tankraum-Decke mit Lukenöffnung neu bauen (Original ausblenden), Luke verschlossen bis zum Ende von Kapitel 2
  const X = C2.x, Z = C2.z, ceilOld = msFind((m, bb) => m.geometry && m.geometry.type === 'BoxGeometry' && Math.abs((bb.min.y + bb.max.y) / 2 - 2.6) < .15 && Math.abs((bb.min.x + bb.max.x) / 2 - (X + 114)) < .5 && Math.abs((bb.min.z + bb.max.z) / 2 - Z) < .5 && bb.max.x - bb.min.x > 15);
  const cm = ceilOld[0] ? ceilOld[0].material : wall; ceilOld.forEach(msHide);
  const x0 = X + 105.7, x1 = X + 122.3, z0 = Z - 8.3, z1 = Z + 8.3, hx0 = SH.x - .6, hx1 = SH.x + .6, hz0 = SH.z - .6, hz1 = SH.z + .6;
  const slab = (a, b2, c, d) => box(b2 - a, .2, d - c, (a + b2) / 2, 2.6, (c + d) / 2, cm, { cast: false });
  slab(x0, hx0, z0, z1); slab(hx1, x1, z0, z1); slab(hx0, hx1, z0, hz0); slab(hx0, hx1, hz1, z1);
  S.hatch = box(1.2, .12, 1.2, SH.x, 2.56, SH.z, rust, { cast: false });
  // Leiterstück im Raum (0 … 2,5 m): erscheint erst, wenn die Luke aufgeht
  const parts = []; for (const dx of [-.22, .22]) { const g = new THREE.BoxGeometry(.05, 2.5, .05); g.translate(SH.x + dx, 1.25, SH.z + .52); parts.push(g); }
  for (let k = .3; k < 2.5; k += .3) { const g = new THREE.BoxGeometry(.44, .035, .035); g.translate(SH.x, k, SH.z + .5); parts.push(g); }
  S.roomLadder = new THREE.Mesh(mergeGeometries(parts), rust); S.roomLadder.visible = false; S.roomLadder.userData.noCol = true; scene.add(S.roomLadder);
  S.emerg = new VLight(0xff3a20, 0, 9, 2); S.emerg.position.set(X + 114, 2.1, Z); scene.add(S.emerg);
  // Gullydeckel im Ort (falls als Einzelmodell vorhanden) – wird beim Aufstemmen zur Seite geschoben
  S.lid = msFind((m, bb) => !m.isInstancedMesh && Math.hypot((bb.min.x + bb.max.x) / 2 - S.TOWN.x, (bb.min.z + bb.max.z) / 2 - S.TOWN.z) < .6 && bb.max.y < .3 && bb.max.x - bb.min.x < 1.6 && bb.max.x - bb.min.x > .4);
  // Stablampe (LED) am Haken neben der Leiter: Unreal-Modell, falls exportiert
  const lamp = await ausruestung_ue('lampe2', .32); if (lamp) { lamp.position.set(SH.x + .95, 1.3, SH.z + .6); lamp.rotation.z = PI / 2; lamp.visible = false; scene.add(lamp); S.lamp = lamp; }
  const lampHit = box(.5, .6, .4, SH.x + .95, 1.35, SH.z + .55, hidden, { cast: false });
  const ladHit = box(.9, 2.2, .7, SH.x, 1.1, SH.z + .2, hidden, { cast: false });
  const takeLamp = () => { if (S.lampTaken) return; S.lampTaken = true; uninteract(lampHit); if (S.lamp) S.lamp.visible = false; flashUpgrade(1); };
  CH2_END.push(() => {
    S.open = true; msHide(S.hatch); S.roomLadder.visible = true; S.emerg.intensity = 1.4; Audio.play('metalOpen', { gain: .7, rate: .8, x: SH.x, y: 2.5, z: SH.z, ref: 3 }); Audio.play('metalSheet', { gain: .5, delay: .4, x: SH.x, y: 1, z: SH.z, ref: 3 });
    if (S.lamp) S.lamp.visible = true;
    interact(lampHit, 'Stablampe vom Haken nehmen', () => { takeLamp(); toast('Eine schwere LED-Stablampe. Eingraviert: „EIGENTUM BfR – NICHT ENTFERNEN“. Du entfernst sie.', 4600); });
    interact(ladHit, 'Die Leiter hinaufsteigen', () => uebergang3_climb(takeLamp, ladHit));
  });
  S.ready = true;
}]);
function uebergang3_climb(takeLamp, ladHit) {
  const S = uebergang3_S, SH = S.SH, T = S.TOWN, P = player.pos; if (scripted) return;
  if (!S.lampTaken) { takeLamp(); toast('Im Vorbeigehen nimmst du die Stablampe vom Haken. Unten wird es dunkel bleiben.', 3800); }
  uninteract(ladHit); let phase = 'c2', rung = 0, hold = 0, side = 0;
  const lx = SH.x, lz = SH.z; setC2Objective('Klettern.');
  setScripted(dt => {
    if (phase === 'c2' || phase === 'town') {
      P.x += (lx + (phase === 'town' ? T.x - SH.x : 0) - P.x) * Math.min(1, dt * 6); P.z += (lz + (phase === 'town' ? T.z - SH.z : 0) - P.z) * Math.min(1, dt * 6);
      P.y += S.speed * dt; rung += S.speed * dt; if (rung > .32) { rung = 0; Audio.play(Audio.pick('metalHit1', 'metalHit2'), { gain: .08, rate: rand(1.5, 1.8), x: P.x, y: P.y, z: P.z, ref: 1.5 }); }
      if (phase === 'c2' && P.y >= S.TR) { // unsichtbar in den Schacht unter der Kreuzung
        const dy = -(S.C2Y + S.H); P.x += T.x - SH.x; P.z += T.z - SH.z; P.y += dy; camY += dy; phase = 'town'; chapter3Begin(); }
      if (phase === 'town' && P.y >= -1.75) { phase = 'lid'; hold = 0; Audio.play('stones1', { gain: .5, x: T.x, y: 0, z: T.z, ref: 3 }); Audio.play('metalOpen', { gain: .8, rate: .7, delay: .3, x: T.x, y: 0, z: T.z, ref: 3 }); shake = Math.max(shake, .02); }
      return true;
    }
    if (phase === 'lid') { hold += dt; if (hold > .7) { phase = 'out'; S.town.cap.visible = false; msHide(S.town.cap); for (const m of S.lid) tween(m, { pos: m.position.clone().add(new THREE.Vector3(.95, 0, .2)) }, .6); Audio.setArea(false, false); if (Audio.drone) Audio.drone.gain.value = .03; } return true; }
    if (phase === 'out') { P.y = Math.min(0, P.y + S.speed * 1.2 * dt); if (P.y >= 0) { side += dt; P.x = T.x + Math.min(1, side / .5) * 1.0; if (side >= .5) {
          questPop('KAPITEL 3', 'Das Licht'); chapter3Opening(); setTimeout(() => subtitle('Die Kreuzung. Lost Eyengless. Aber die Laternen atmen.', 4200), 600); return false; } } return true; }
    return false;
  });
}
WORLD_TICK.push(() => {});
