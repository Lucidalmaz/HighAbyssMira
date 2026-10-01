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
    CH2_BEGIN.push(() => { tween(pv, { ry: 0 }, .45, () => { solidRefresh(pv); Audio.slam(pv.position.x, 1.2, pv.position.z); shake = Math.max(shake, .03); }); }); }
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
    setTimeout(() => subtitle('Hinter dir fällt die Tür ins Schloss. Auf dieser Seite hat sie keine Klinke. Ein Betongang, der nach Rost riecht. Und ganz hinten nach Sommer.', 5200), 900); // Fassung 3 (AP-16), UK 1
  }
});

// =====================================================================  Kapitel 2, Unterkapitel 9 „Das war jetzt neu“ (Fassung 3, AP-16): Bergungsschacht über dem Tank bis unter den Gully an der Kreuzung
// Nach der Abspann-Kinosequenz „Ihre Augen“: Luke kniet vor dem leeren Tank. Die Stablampe liegt nicht mehr, wo sie hingefallen ist – am Fuß der Eisenleiter,
// der Kegel zeigt senkrecht in den Schacht (Spur des Beobachters). Aufstieg mit E halten, Sprosse für Sprosse (gut vierzig Sekunden), nasse Kinderhände auf zwei Sprossen,
// daneben Lucys; ein Tropfen fällt an ihm vorbei. Oben: Gullydeckel von unten (E halten). Kopf raus, Whiskey sitzt am Rand: „SCHEISSE!“ – „Scheiße!“ – „… Das war jetzt neu.“
// Luke kniet neben dem Gully, die Hände auf dem Deckel; die Kapellenglocke schlägt drei, Pause, dann der erste der dreizehn → Endkarte unter den Schlägen → beim
// dreizehnten Schlag Kapitel 3 (chapter3Begin + chapter3Opening). Technik: in der Mitte des Schachts unbemerkt in den baugleichen Schacht unter der Kreuzung versetzt.
const uebergang3_S = { SH: { x: C2.x + 118, z: C2.z + 7.3 }, TOWN: { x: 9, z: -1.3 }, H: 14, C2Y: 2.5, TR: 9.5, speed: .46, open: false, lampTaken: false, phase: '', glocke: false, done: false };
function uebergang3_shaft(cx, cz, y0, M, ladderMat) {
  const S = uebergang3_S, H = S.H, w = 1.2, t = .2, y = y0 + H / 2, b = (sx, sz, x, z) => box(sx, H, sz, x, y, z, M.wall, { collide: true });
  b(w + 2 * t, t, cx, cz - w / 2 - t / 2); b(w + 2 * t, t, cx, cz + w / 2 + t / 2); b(t, w, cx - w / 2 - t / 2, cz); b(t, w, cx + w / 2 + t / 2, cz);
  // Leiter an der Nordwand: zwei Holme + Sprossen alle 30 cm, eine zusammengefasste Geometrie (Rost-Scan)
  const parts = []; for (const dx of [-.22, .22]) { const g = new THREE.BoxGeometry(.05, H, .05); g.translate(cx + dx, y, cz + w / 2 - .08); parts.push(g); }
  for (let k = .3; k < H; k += .3) { const g = new THREE.BoxGeometry(.44, .035, .035); g.translate(cx, y0 + k, cz + w / 2 - .1); parts.push(g); }
  const lad = new THREE.Mesh(mergeGeometries(parts), ladderMat); lad.castShadow = lad.receiveShadow = true; lad.userData.noCol = true; scene.add(lad);
  const l = new VLight(0xbfd0ff, .35, 5, 2); l.position.set(cx, y0 + H - .6, cz); scene.add(l); // schwaches Licht oben (gleich in beiden Schächten)
  const cap = box(w + .3, .1, w + .3, cx, y0 + H - .06, cz, M.ceil, { cast: false }); // Abschluss oben, knapp unter der Oberkante (im Ort: Unterseite des Gullys, unsichtbar unter dem Asphalt)
  // Nässe an den Wänden, zwei nasse Kinderhände auf den Sprossen (unten), daneben Lucys größere
  const nass = new THREE.MeshStandardMaterial({ color: 0x0b0b0a, roughness: .12, metalness: .1, transparent: true, opacity: .35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  for (const [dx, dz, ry] of [[0, -w / 2 + .005, 0], [-w / 2 + .005, 0, PI / 2], [w / 2 - .005, 0, -PI / 2]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w * .9, H * .9), nass); m.position.set(cx + dx, y, cz + dz); m.rotation.y = ry; m.userData.noCol = true; scene.add(m); }
  return { lad, cap, l };
}
function uebergang3_haende(cx, cz, y0) { // nasse Handabdrücke auf zwei Sprossen (Decal an der Wand hinter der Leiter): klein, klein, groß
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'); x.clearRect(0, 0, 128, 128); x.fillStyle = 'rgba(200,215,220,.55)';
  x.beginPath(); x.ellipse(64, 78, 22, 26, 0, 0, 7); x.fill(); for (const [a, l] of [[-1, 26], [-.4, 34], [0, 38], [.4, 34], [1, 22]]) { x.save(); x.translate(64, 64); x.rotate(a); x.beginPath(); x.ellipse(0, -30 - l / 2, 6, l / 2, 0, 0, 7); x.fill(); x.restore(); }
  const mat = new THREE.MeshStandardMaterial({ map: tex(c, true), transparent: true, depthWrite: false, roughness: .08, metalness: .2, polygonOffset: true, polygonOffsetFactor: -5 });
  for (const [dx, dy, s] of [[-.1, 1.2, .07], [.12, 2.4, .07], [.02, 3.3, .1]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), mat); m.position.set(cx + dx, y0 + dy, cz + .59); m.rotation.y = PI; m.userData.noCol = true; scene.add(m); } }
WORLD_MODS.push(['Übergang Kapitel 3', async () => {
  if (!SEAMLESS) return; const S = uebergang3_S, SH = S.SH;
  const wall = msSurfMat('facade_concrete', { tint: 0x7c7a74 }), ceil = msSurfMat('rust_sheet', { tint: 0x6a6660 }), rust = msSurfMat('rust_sheet', { tint: 0x9a8e80 });
  for (const m of [wall, ceil, rust]) m.userData.tile = 1.5;
  const M = { wall, ceil };
  S.c2 = uebergang3_shaft(SH.x, SH.z, S.C2Y, M, rust); uebergang3_haende(SH.x, SH.z, S.C2Y);
  S.town = uebergang3_shaft(S.TOWN.x, S.TOWN.z, -S.H, M, rust); uebergang3_haende(S.TOWN.x, S.TOWN.z, -S.H + 4);
  box(1.6, .2, 1.6, S.TOWN.x, -S.H - .1, S.TOWN.z, wall, { collide: true }); // Schachtsohle im Ort
  const red = new VLight(0xff3a20, .6, 5, 2); red.position.set(S.TOWN.x, -S.H + .8, S.TOWN.z); scene.add(red); // rotes Restlicht unten – wie der Notlicht-Tankraum
  // Mondlicht durch die Schlitze des Gullys (für den Aufstieg und den Blick nach oben in „Ihre Augen“), beim Laden mit 0
  S.mond = new VLight(0xb8c8e6, 0, 9, 1.6); S.mond.position.set(S.TOWN.x, -.35, S.TOWN.z); scene.add(S.mond);
  S.mond2 = new VLight(0xa8b8d6, 0, 7, 1.8); S.mond2.position.set(S.TOWN.x, -7, S.TOWN.z); scene.add(S.mond2);
  // Messraum-Decke mit Lukenöffnung über dem Tank neu bauen (Original ausblenden), Luke verschlossen bis zum Ende von Kapitel 2
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
  // Die Stablampe (LED) liegt nach dem Abspann am Fuß der Leiter: Modell, Klickfläche
  const lamp = await ausruestung_ue('lampe2', .32); if (lamp) { lamp.position.set(SH.x + .12, .04, SH.z + .05); lamp.rotation.set(0, .5, PI / 2); lamp.visible = false; scene.add(lamp); S.lamp = lamp; }
  S.lampHit = box(.5, .4, .5, SH.x + .1, .2, SH.z, hidden, { cast: false }); S.lampHit.userData.noCol = true;
  S.ladHit = box(.9, 2.2, .7, SH.x, 1.1, SH.z + .3, hidden, { cast: false }); S.ladHit.userData.noCol = true;
  CH2_END.push(() => { S.open = true; msHide(S.hatch); S.roomLadder.visible = true; });
  // Nach Kapitel 2: Ebene −2 zu. Die aufgebrochene Kellerwand in Nr. 7 trägt ab Kapitel 4 Absperrband „Gasleck“ (AG-11); vorher endet der Gang im Rauch
  { const c = document.createElement('canvas'); c.width = 512; c.height = 64; const x = c.getContext('2d'); for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#c8261a' : '#efe9dc'; x.save(); x.translate(i * 32, 0); x.transform(1, 0, -.5, 1, 0, 0); x.fillRect(0, 8, 32, 48); x.restore(); } x.fillStyle = '#1a1a1a'; x.font = 'bold 26px Arial'; x.fillText('GASLECK · BETRETEN VERBOTEN', 60, 42);
    const mat = new THREE.MeshStandardMaterial({ map: tex(c, true), transparent: true, side: THREE.DoubleSide, roughness: .6 }); S.band = [];
    for (const [y, r] of [[.95, .12], [1.45, -.1]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .12), mat); m.position.set(298, y, 295.92); m.rotation.z = r; m.userData.noCol = true; m.visible = false; scene.add(m); S.band.push(m); }
    S.bandHit = box(1.3, 2.1, .2, 298, 1.05, 295.9, hidden, { cast: false }); S.bandCol = null; }
  S.ready = true;
}]);
// Nach „Ihre Augen“ (Basis finale → hierher): kniend vor dem leeren Tank, die Lampe liegt am Fuß der Leiter und leuchtet in den Schacht
async function uebergang3_nachAbspann() { const S = uebergang3_S, SH = S.SH; if (S.phase) return; S.phase = 'lampe';
  try { if (typeof amt_S !== 'undefined') amt_S.notlichtAn = 1; } catch (e) {} S.emerg.intensity = 0; flashOn = true; try { if (typeof sammeln_fibel === 'function') sammeln_fibel('R-K2'); } catch (e) {} // Spielregeln: „Augen zu hilft nicht, wenn man weiß, was man ist.“
  const P = player.pos; player.pos.set(SH.x - .1, 0, SH.z - 2.05); player.yaw = 0; player.pitch = .05; vel.set(0, 0, 0); camY = .95; // vor dem Tank, auf den Knien
  if (S.lamp) S.lamp.visible = true; S.lampeLiegt = true;
  await wait(1200); fade(0, 1800); setScripted(null); state.talking = false;
  await wait(1800); for (let i = 0; i < 5; i++) { try { Audio.drip(C2.x + 118 + rand(-.3, .3), 2.2, C2.z + 6 + rand(-.3, .3)); } catch (e) {} await wait(rand(1400, 2200)); }
  subtitle('Die Stablampe liegt nicht mehr, wo sie hingefallen ist. Sie liegt am Fuß der Eisenleiter, der Kegel zeigt senkrecht in den Schacht. Da hat er sie nicht hingelegt.', 6200);
  if (typeof setC2Objective === 'function') setC2Objective('Die Stablampe.'); void P;
  interact(S.lampHit, 'Stablampe aufheben', () => { uninteract(S.lampHit); S.lampeLiegt = false; S.lampTaken = true; if (S.lamp) S.lamp.visible = false; if (FLASH.tier < 1) flashUpgrade(1); else Audio.play('switch2', { gain: .3, rate: 1.2 }); S.phase = 'leiter';
    if (typeof setC2Objective === 'function') setC2Objective('Die Leiter hinauf.'); interact(S.ladHit, 'Die Leiter hinaufsteigen (E halten)', () => uebergang3_climb()); }); }
// Aufstieg: nur solange E gehalten wird, Sprosse für Sprosse; in der Mitte in den Schacht unter der Kreuzung; oben der Deckel (E halten)
function uebergang3_climb() {
  const S = uebergang3_S, SH = S.SH, T = S.TOWN, P = player.pos; if (scripted || S.phase === 'klettern') return;
  uninteract(S.ladHit); S.phase = 'klettern'; let phase = 'c2', rung = 0, hold = 0, side = 0, tropf = false, whisk = false, ruhe = 0;
  const lx = SH.x, lz = SH.z; if (typeof setC2Objective === 'function') setC2Objective('Klettern. E halten.');
  setScripted(dt => {
    if (phase === 'c2' || phase === 'town') {
      P.x += (lx + (phase === 'town' ? T.x - SH.x : 0) - P.x) * Math.min(1, dt * 6); P.z += (lz + (phase === 'town' ? T.z - SH.z : 0) - P.z) * Math.min(1, dt * 6);
      const e = !!keys.KeyE; if (e) { ruhe = 0; const k = .78 + .22 * Math.sin(rung / .3 * PI); P.y += S.speed * k * dt; rung += S.speed * dt; if (rung > .3) { rung = 0; Audio.play(Audio.pick('metalHit1', 'metalHit2'), { gain: .07, rate: rand(1.5, 1.8), x: P.x, y: P.y + 1.4, z: P.z, ref: 1.5 }); } }
      else { ruhe += dt; } // hält sich fest; der Atem geht weiter
      if (phase === 'c2' && P.y >= S.TR) { // unsichtbar in den Schacht unter der Kreuzung (Kapitel 2 läuft weiter)
        const dy = -(S.C2Y + S.H); P.x += T.x - SH.x; P.z += T.z - SH.z; P.y += dy; camY += dy; phase = 'town'; Audio.setArea(false, false); S.mond2.intensity = .8; }
      if (!tropf && phase === 'town' && P.y > -9) { tropf = true; try { Audio.drip(P.x + .2, P.y + 3, P.z); setTimeout(() => Audio.drip(P.x + .2, P.y - 4, P.z), 900); } catch (e) {} }
      if (!whisk && phase === 'town' && P.y > -5.5) { whisk = true; try { if (typeof whiskey_setzen === 'function') whiskey_setzen(T.x + .75, .12, T.z + .1); } catch (e) {} }
      if (phase === 'town' && P.y >= -1.75) { phase = 'lid'; hold = 0; if (typeof setC2Objective === 'function') setC2Objective('Den Deckel aufstemmen. E halten.'); }
      return true;
    }
    if (phase === 'lid') { if (keys.KeyE) { hold += dt; if (hold % .35 < dt) { Audio.play('stones1', { gain: .25, rate: .8, x: T.x, y: 0, z: T.z, ref: 3 }); shake = Math.max(shake, .01); } } else hold = Math.max(0, hold - dt);
      if (hold > 1.1) { phase = 'kopf'; side = 0; S.town.cap.visible = false; msHide(S.town.cap); for (const m of S.lid) tween(m, { pos: m.position.clone().add(new THREE.Vector3(.95, 0, .2)) }, .6); Audio.play('metalOpen', { gain: .8, rate: .7, x: T.x, y: 0, z: T.z, ref: 3 }); S.mond.intensity = 1.2; if (Audio.drone) Audio.drone.gain.value = .03; } return true; }
    if (phase === 'kopf') { P.y = Math.min(-1.02, P.y + S.speed * 1.4 * dt); side += dt; if (side > .6 && !S.fluch) { S.fluch = true; player.yaw = -PI / 2 + .2; player.pitch = .05; uebergang3_whiskey().then(() => { phase = 'raus'; side = 0; }); } return true; }
    if (phase === 'raus') { P.y = Math.min(0, P.y + S.speed * 2 * dt); if (P.y >= 0) { side += dt; P.x = T.x + Math.min(1, side / .8) * 1.0; if (side >= .8) { uebergang3_ende(); return false; } } return true; }
    return false;
  });
}
async function uebergang3_whiskey() { // K2-2 „Oben wartet einer“: SCHEISSE! – „Scheiße!“ – „… Das war jetzt neu.“ (whiskey.js)
  if (typeof whiskey_schacht === 'function') { try { await whiskey_schacht(); } catch (e) { console.warn('Whiskey am Gully', e); } } else await say([['SCHEISSE!', 1400, 'LUKE'], ['… Das war jetzt neu.', 2200, 'LUKE']]);
  await wait(900); }
// Das Ende von Kapitel 2 (02 H2): kniend neben dem Gully, die Hände auf dem kalten Eisen; drei Schläge, Pause, dann die dreizehn – die Endkarte läuft unter ihnen
async function uebergang3_ende() { const S = uebergang3_S; if (S.done) return; S.done = true; S.glocke = true;
  camY = Math.min(camY, .9); player.pitch = .6; state.talking = true; setScripted(() => true); if (typeof setC2Objective === 'function') setC2Objective('');
  await wait(1600); let bells = null; try { if (typeof leben_bell3plus13 === 'function') bells = leben_bell3plus13(); } catch (e) { console.warn('Glocke', e); }
  await wait(3 * 3300 + 2000 + 400); // drei Schläge, Pause, der erste der dreizehn
  if (typeof kino_karte === 'function' && typeof KINO_KARTE2 === 'function') await kino_karte(KINO_KARTE2(), { bleiben: true }); else await wait(9000);
  if (bells) await Promise.race([bells, wait(40000)]);
  try { if (typeof kapEnde === 'function') kapEnde(2); else saveFlag('ch3'); } catch (e) {}
  setScripted(null); state.talking = false; S.mond.intensity = 0; S.mond2.intensity = 0; try { if (typeof amt_S !== 'undefined') amt_S.notlichtAn = 0; } catch (e) {}
  chapter3Begin(); try { if (typeof leben_uhrSync === 'function') leben_uhrSync().c3 = true; } catch (e) {} // die 3 + 13 Schläge sind schon gefallen (unter der Endkarte) – Kapitel 3 beginnt genau hier
  document.body.classList.remove('cine'); fade(0, 1400); questPop('KAPITEL 3', 'Ich komme'); chapter3Opening(); }
WORLD_TICK.push(() => { const S = uebergang3_S; if (!S.ready) return;
  // Selbstheilung: im Testlauf über den echten Abspann fehlte die Klickfläche der Lampe einmal (Ursache nicht gefunden) – nie ohne Weg nach oben stehen bleiben
  if (S.phase === 'lampe' && S.lampeLiegt && S.lampHit.userData.action && !interactables.includes(S.lampHit)) interactables.push(S.lampHit);
  if (S.phase === 'leiter' && S.ladHit.userData.action && !interactables.includes(S.ladHit)) interactables.push(S.ladHit);
  // Die Lampe liegt am Fuß der Leiter: der Kegel zeigt senkrecht in den Schacht
  if (S.lampeLiegt && typeof flashRig !== 'undefined') { flashRig.position.set(S.SH.x + .12, .1, S.SH.z + .05); flashRig.quaternion.setFromAxisAngle(uebergang_up, PI / 2); flashRig.updateMatrixWorld(); }
  // ab Kapitel 4: Absperrband „Gasleck“ vor der aufgebrochenen Kellerwand in Nr. 7
  const k4 = typeof kap === 'function' && kap() >= 4; if (S.band && S.band[0].visible !== k4) { for (const m of S.band) m.visible = k4; if (k4) { interact(S.bandHit, 'Absperrband', () => toast('„GASLECK · BETRETEN VERBOTEN.“ Dahinter riecht es nach kaltem Rauch. Jemand hat das Loch mit Brettern zugenagelt.', 4200)); if (!S.bandCol) S.bandCol = addCol(297.3, 298.7, 295.8, 296.1, 3); } else uninteract(S.bandHit); } });
const uebergang_up = new THREE.Vector3(1, 0, 0);
window.__ueb3 = { S: uebergang3_S, nach: () => uebergang3_nachAbspann(), climb: () => uebergang3_climb(), lampHit: () => interactables.includes(uebergang3_S.lampHit) }; // nur für Tests (AP-16)
