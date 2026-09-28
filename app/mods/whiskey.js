// =====================================================================  WHISKEY (Modul „whiskey“): der Rabe, der Luke durch alle drei Kapitel begleitet
// Echtes, gerigtes Modell (Unreal Animal Variety Pack, animal_crow), dunkler und größer als die Dorfkrähen. Sitzt an Stationen, die zum
// Fortschritt passen, fliegt voraus, pickt an Hinweisen, gibt eine Aufgabe (Tausch: etwas Glänzendes gegen einen Schlüssel).
// Den Namen hat ihm Lars Vegas gegeben (er saß abends auf seinem Geländer). Justin erklärt in Kapitel 3, was es mit ihm auf sich hat.
const whiskey_S = { ready: false, g: null, mx: null, A: {}, cur: null, st: null, mode: 'gone', fl: null, idleT: 2, met: new Set(), named: false, hit: null, trade: false, jHit: null, jAsked: false };
// Stationen: when() = aktiv, done() = erledigt (dann fliegt er weiter/fort). at = [x, z] Sitzplatz (Oberfläche wird per Strahl gesucht), talk = Klick
const WHISKEY_ST = [
  { id: 'start', at: [-44.2, 3.4], when: () => state.started && !ch2.on && !ch3.on && story.main <= 1, done: () => story.main >= 1 || Math.hypot(player.pos.x + 44.2, player.pos.z - 3.4) < 6,
    talk: 'Ein Rabe. Groß, schwarz, die Augen fast weiß. Er sieht mich an, als hätte er auf mich gewartet.' },
  { id: 'briefkasten', at: [28.4, -6.9], when: () => state.started && !ch2.on && !ch3.on && story.main <= 2, done: () => state.hasKey, peck: true,
    talk: 'Er pickt am Briefkasten von Nr. 7. Immer wieder, genau an der Klappe. … Okay. Ich hab verstanden.' },
  { id: 'nr7', at: [26, -11.4], when: () => state.ch1Done && !ch2.on, done: () => state.inBasement,
    talk: 'Da ist er wieder. Auf dem Geländer von Nr. 7. Er schaut zur Kellertür, nicht zu mir.' },
  { id: 'akte', at: [C2.x + 22, C2.z - 5.6], when: () => ch2.on && !ch3.on, done: () => story.lore.some(l => l.key === 'cleo_akte') || ch2.power, peck: true,
    talk: 'Ein Rabe. Hier unten. Zwanzig Meter unter der Erde. Er pickt an der untersten Schublade eines Aktenschranks. Das Schild daneben ist geschwärzt.' },
  { id: 'luke', at: [716.5, -2598.5], hover: 2.45, when: () => ch2.on && ch2.lenaMet, done: () => ch3.on,
    talk: 'Er sitzt am Rand der Luke. Als ich hinsehe, fliegt er hinauf in den Schacht. Ich soll ihm folgen.' },
  { id: 'vegas', at: [-27.2, -11.2], when: () => ch3.on && ch3.part === 'town', done: () => whiskey_S.trade && whiskey_S.named,
    talk: () => whiskey_tradeTalk() },
  { id: 'gedenkfeld', at: [-48.65, 72.95], when: () => ch3.on && ch3.part === 'town' && ch3.met, done: () => story.lore.some(l => l.key === 'cleo_gedenk'),
    talk: 'Whiskey sitzt auf einem Grabstein ohne Namen. Dem achten. Jemand hat den Namen weggekratzt, bis der Stein weiß war.' },
  { id: 'waldrand', at: [30, 96.2], when: () => ch3.on && ch3.part === 'town' && ch3.met && story.lore.some(l => /^zayn_|^cleo_/.test(l.key)), done: () => player.pos.z > 100,
    talk: 'Am Waldrand. Er fliegt ein Stück hinein und wartet. Forbidden Dustwoods. Da wollte als Kind keiner rein.' }];
// Oberseite des höchsten festen Körpers unter (x, z) – Laternenkopf, Briefkasten, Geländer, Grabstein
function whiskey_perch(x, z) {
  let top = 0; const ray = new THREE.Ray(), o = new THREE.Vector3(), d = new THREE.Vector3(), w = new THREE.Vector3();
  for (const it of solidNear(x, z)) { const bb = it.bb; if (x < bb.min.x || x > bb.max.x || z < bb.min.z || z > bb.max.z || it.soft || !solidLive(it) || bb.max.y > 9) continue;
    o.set(x, bb.max.y + .5, z).applyMatrix4(it.inv); d.set(0, -1, 0).transformDirection(it.inv); ray.set(o, d); const h = it.o.geometry.boundsTree.raycastFirst(ray, THREE.DoubleSide);
    if (h) { w.copy(h.point).applyMatrix4(it.mw); if (w.y > top) top = w.y; } }
  return top;
}
function whiskey_play(k, fade = .25, once = false, ts = 1) { const S = whiskey_S, a = S.A[k]; if (!a || a === S.cur) return; a.reset(); a.timeScale = ts;
  if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else a.setLoop(THREE.LoopRepeat, Infinity); a.fadeIn(fade).play(); if (S.cur) S.cur.fadeOut(fade); S.cur = a; }
function whiskey_caw() { const g = whiskey_S.g; Audio.play('crow1', { gain: .7, rate: .78, vary: .06, x: g.position.x, y: g.position.y, z: g.position.z, ref: 5 }); }
// Flug in einem Bogen (quadratische Bezierkurve) zu einem Ziel
function whiskey_fly(to, then) {
  const S = whiskey_S, from = S.g.position.clone(), dist = from.distanceTo(to), apex = Math.max(from.y, to.y) + Math.min(8, 2 + dist * .25);
  S.fl = { from, to: to.clone(), ctrl: new THREE.Vector3((from.x + to.x) / 2, apex, (from.z + to.z) / 2), t: 0, dur: Math.max(1.6, dist / 7.5), then };
  S.mode = 'take'; S.tt = .45; whiskey_play('TakeOff', .08, true, 1.2); whiskey_caw();
}
function whiskey_tradeTalk() {
  const S = whiskey_S;
  if (!S.named) { S.named = true; subtitle('„Lass den Vogel in Ruhe, Junge. Das ist Whiskey. Sitzt jeden Abend auf meinem Geländer, wenn ich einen trink. Gehört keinem.“', 5600, 'LARS VEGAS (HINTER DER TÜR)'); return; }
  if (S.trade) return toast('Whiskey putzt sich. Der Schlüssel ist weg – er hat ihn dir gegeben, und er bereut nichts.', 3600);
  if (!FLASH.spare) return toast('Er hat etwas im Schnabel: einen kleinen Messingschlüssel. Er legt den Kopf schief. Er will tauschen – gegen etwas, das glänzt.', 4800);
  S.trade = true; FLASH.spare--; if (!FLASH.spare) story.items = story.items.filter(k => k !== 'batterie');
  addItem('baumhausschluessel'); whiskey_caw(); toast('Du hältst ihm eine Batterie hin. Er nimmt sie, prüft sie mit dem Schnabel – und lässt einen kleinen Messingschlüssel in deine Hand fallen.', 5200); // STORY-HOOK: Schlüssel zu Cleos Kiste im Baumhaus
}
WORLD_MODS.push(['Whiskey', async () => {
  const S = whiskey_S; modItem('baumhausschluessel', 'Kleiner Messingschlüssel', 'Von Whiskey, gegen eine Batterie getauscht. In den Bart ist ein „C“ gefeilt.', 'key');
  try {
    const src = await msModel('animal_crow', 'model.glb'), sk = (await import('three/addons/utils/SkeletonUtils.js')).clone, m = sk(src);
    m.scale.setScalar(1.45); m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      o.material = [].concat(o.material).map(x => { const c = x.clone(); c.color = (c.color || new THREE.Color(1, 1, 1)).clone().multiplyScalar(.55); c.roughness = .45; return c; }); if (o.material.length === 1) o.material = o.material[0]; } });
    const g = new THREE.Group(); g.add(m); g.visible = false; g.userData.noCol = true; scene.add(g); S.g = g;
    S.mx = new THREE.AnimationMixer(m); for (const c of src.animations || []) S.A[c.name.replace(/^.*\|/, '')] = S.mx.clipAction(c);
    S.hit = box(.8, .8, .8, 0, -50, 0, hidden, { cast: false });
    interact(S.hit, () => S.named ? 'Whiskey' : 'Rabe', () => { const st = S.st; if (!st) return; whiskey_caw(); if (typeof st.talk === 'function') return st.talk();
      S.met.add(st.id); subtitle('<i>' + st.talk + '</i>', Math.max(3600, st.talk.length * 50), 'LUKE'); if (st.id === 'luke' || st.id === 'waldrand') setTimeout(() => whiskey_leave(), 1200); });
    uninteract(S.hit);
    // Justin nach dem Raben fragen (Kapitel 3, ab der dritten Begegnung)
    S.jHit = box(.9, 2.2, .9, 0, -50, 0, hidden, { cast: false });
    interact(S.jHit, 'Justin nach dem Raben fragen', async () => { if (S.jAsked || state.talking) return; S.jAsked = true; uninteract(S.jHit); state.talking = true;
      await say([['„Der Rabe? Er gehörte meiner Frau. Er war schon alt, als ich sie kennenlernte.“', 4200, 'JUSTIN'], ['„Er fliegt zwischen dem Weißen und euch hin und her. Er hat nie gelernt, auf welcher Seite er zu Hause ist.“', 5200, 'JUSTIN'],
        ['„Er hatte viele Namen. Bei euch heißt er Whiskey. Sie hat gesagt, er findet immer heim. Zu ihr.“', 5000, 'JUSTIN']]); state.talking = false; // STORY-HOOK: Whiskey = Bote von Justins Frau (Mira, spätere Kapitel – hier namenlos)
      story.lore.push({ key: 'whiskey_justin', title: 'Whiskey', html: 'Laut Justin gehörte der Rabe seiner Frau. Er fliegt zwischen dem Weißen und Lost Eyengless.\n\n„Sie hat gesagt, er findet immer heim. Zu ihr.“' });
      setTimeout(() => subtitle('<i>Seine Frau. Er redet von ihr, als wäre sie nicht tot. Als würde sie noch kommen.</i>', 4200, 'LUKE'), 900); });
    uninteract(S.jHit);
    S.ready = true;
  } catch (e) { console.warn('Whiskey', e); }
}]);
function whiskey_leave() { const S = whiskey_S; if (!S.g || S.mode === 'gone') return; const p = S.g.position; whiskey_fly(new THREE.Vector3(p.x + rand(-25, 25), p.y + 18, p.z + rand(-25, 25)), () => { S.g.visible = false; S.mode = 'gone'; }); S.left = S.st; }
WORLD_TICK.push((dt, t) => {
  const S = whiskey_S; if (!S.ready || !state.started || menu.attract) return; const P = player.pos, g = S.g;
  // aktuelle Station (letzte, deren Bedingung gilt und die nicht erledigt ist)
  let st = null; for (const s of WHISKEY_ST) if (s.when() && !s.done()) st = s;
  if (st !== S.st && S.mode !== 'take' && S.mode !== 'fly') {
    S.st = st; uninteract(S.hit);
    if (st && S.left !== st) { const y = st.hover ?? whiskey_perch(st.at[0], st.at[1]), to = new THREE.Vector3(st.at[0], y, st.at[1]);
      if (S.mode === 'gone' || !g.visible) { g.position.set(to.x + rand(-18, 18), to.y + 14, to.z + rand(-18, 18)); g.visible = true; } whiskey_fly(to, () => { S.mode = 'perch'; S.idleT = 1.5; if (!interactables.includes(S.hit)) interactables.push(S.hit); }); }
    else if (!st && g.visible) whiskey_leave();
  }
  if (!g.visible) return;
  // Flug
  if (S.fl) { const F = S.fl; F.t = Math.min(1, F.t + dt / F.dur); const k = F.t, a = (1 - k) * (1 - k), b = 2 * (1 - k) * k, c = k * k;
    const nx = a * F.from.x + b * F.ctrl.x + c * F.to.x, ny = a * F.from.y + b * F.ctrl.y + c * F.to.y, nz = a * F.from.z + b * F.ctrl.z + c * F.to.z;
    const dx = nx - g.position.x, dz = nz - g.position.z; if (dx * dx + dz * dz > 1e-6) g.rotation.y = Math.atan2(dx, dz); g.position.set(nx, ny, nz);
    if (S.mode === 'take') { S.tt -= dt; if (S.tt < 0) { S.mode = 'fly'; whiskey_play('Fly', .2); } }
    else if (F.t > .82 && S.cur !== S.A.Landing) whiskey_play('Landing', .15, true); else if (F.t < .82 && Math.sin(t * .9) > .3 && S.cur !== S.A.Glide) whiskey_play('Glide', .4); else if (F.t < .82 && Math.sin(t * .9) <= .3 && S.cur !== S.A.Fly) whiskey_play('Fly', .4);
    if (F.t >= 1) { S.fl = null; S.mode = 'perch'; whiskey_play('IdleLookAround', .3); F.then && F.then(); }
  } else if (S.mode === 'perch') {
    // sitzen: zum Spieler drehen, ab und zu picken/hüpfen/putzen, krächzen, wenn Luke näher kommt
    const dx = P.x - g.position.x, dz = P.z - g.position.z, d = Math.hypot(dx, dz), want = Math.atan2(dx, dz);
    g.rotation.y += Math.atan2(Math.sin(want - g.rotation.y), Math.cos(want - g.rotation.y)) * Math.min(1, dt * 2.5);
    S.idleT -= dt; if (S.idleT < 0) { S.idleT = rand(2.5, 5); const opts = S.st && S.st.peck ? ['EatSomething', 'EatSomething', 'IdleLookAround'] : ['IdleLookAround', 'IdleScratchWing', 'Hop']; const k = opts[Math.floor(Math.random() * opts.length)]; whiskey_play(S.A[k] ? k : 'IdleLookAround', .3); if (d < 14 && Math.random() < .4) whiskey_caw(); }
    S.hit.position.set(g.position.x, g.position.y + .25, g.position.z);
    if (S.st && !S.met.has(S.st.id) && d < 9 && !state.talking && +document.getElementById('subtitle').style.opacity < .05) { S.met.add(S.st.id); whiskey_caw(); } // erste Sichtung
  }
  S.mx.update(dt);
  // Justin-Frage anbieten
  if (ch3.on && ch3.met && !S.jAsked && S.met.size >= 3 && justin.g.visible && ch3.part === 'town') { S.jHit.position.set(justin.g.position.x, 1.1, justin.g.position.z); if (!interactables.includes(S.jHit)) interactables.push(S.jHit); }
});
