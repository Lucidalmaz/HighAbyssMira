// =====================================================================  POST (Modul „post“, AP-15 Fassung 3): Günther Maas, der Postbote (N-03/N-04)
// Kap. 1, Nebenaufgabe 16 „Empfänger unbekannt verzogen“: kurz nach Mitternacht zwischen Kirchweg und Ortskern, Klingel zweimal kurz, einmal lang,
// gelbe Regenjacke, ohne Licht; bremst und rollt drei Meter zu weit, steigt nicht ab; Whiskey klingelt aus der falschen Richtung, die Posttasche kippt,
// der Brief an Lucy (J. W., Hamburg) – „Unzustellbar. Empfänger unbekannt verzogen.“; Zigaretten für schlechte Zeiten; Telefonat am Zaun von Nr. 9,
// Meldezettel in den Kasten, nach Osten. Figur aus der Werkstatt (chars/guenther), Postrad = Fahrrad-Scan: Räder drehen sich mit der Fahrt (Speichen
// aus dem Scan herausgelöst), Treten aus der Hüfte mit weichen Übergängen, Kopf folgt Luke, Atmung – kein Gleiten.
// Sein Schuppen hinter der Tankstelle (shedUtilS 99,6 / −26,5, AP-15): Schild REIFEN – KRANZ, Vorhängeschloss mit Auge, Werbeprospekte nach Jahren gebündelt,
// Neonröhre in den Ritzen, flackert, wenn jemand davorsteht; innen (Kap. 4/5) Obstkisten-Regale mit Straßen-Fächern, Postsäcke nach Jahren, Kalender 2012.
// Außerdem (Kap. 1, 7 „Butterbrotpapier“): Nr. 9 nur durchs Fenster – Objektiv im Astloch dreht sich, Gartenzaun mit Kratzern, Küchenfenster hinten (Blick in den
// Posten), Blatt 212 hinter der Hintertür, Günthers Meldezettel im Briefkasten. Und (Basis nach AP-15): „Sieben Kerzen“ (Hildes Zeilen, Orte), „Elf Anrufe“ (Handy, Kreispfeil falsch herum).
const post_S = { ready: false, steps: {}, F: null, bike: null, ride: null, sz: 'aus', t: 0, meld: 0, v: new THREE.Vector3(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), ax: new THREE.Vector3(), R: {} };
const POST_RAUM = { schuppen: { x: -1480, z: 1440 }, posten: { x: -1520, z: 1400 } };

// ---------------------------------------------------------------------  Klang: Fahrradklingel zweimal kurz, einmal lang (Whiskey kann das)
function post_klingel(x, y, z, g = 1) { const A = Audio; if (!A.ctx) return; if (A.klingel && A.klingel(x, y, z, g)) return; /* echte Fahrradklingel */ const d = A.at(x, y, z, 4);
  [[0, .16], [.2, .16], [.55, .95]].forEach(([t0, dur]) => { for (const [f, a] of [[2093, .09], [2093 * 2.76, .025], [2093 * 5.4, .01]]) { const o = A.osc('sine', f, t0, dur + .2); A.env(o, a * g, .003, dur, t0, d); } }); }
function post_zeile(t, ms, who) { const d = Math.max(ms || 0, 1300 + t.length * 50); subtitle(t, d + 250, who || 'GÜNTHER'); return wait(d); }

// ---------------------------------------------------------------------  Postrad: Fahrrad-Scan, Länge entlang +z, Räder als drehbare Teile
async function post_radBau() {
  const src = await msModel('bicycle'); const o = src.clone(true); msFit(o, 1.05); o.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(o), s = bb.getSize(new THREE.Vector3()); if (s.x > s.z) o.rotation.y = PI / 2; // Länge auf z
  { o.updateMatrixWorld(true); const v = new THREE.Vector3(), pts = []; o.traverse(m => { if (!m.isMesh) return; const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); pts.push([v.y, v.z]); } });
    const b3 = new THREE.Box3().setFromObject(o), cz = (b3.min.z + b3.max.z) / 2; pts.sort((p, q) => q[0] - p[0]); const top = pts.slice(0, Math.max(8, pts.length * .02 | 0)); const tz = top.reduce((a, p) => a + p[1], 0) / top.length; if (tz < cz) o.rotation.y += PI; } // Lenker (höchster Punkt) vorn = +z
  const g0 = msGround(o); g0.updateMatrixWorld(true); const b2 = new THREE.Box3().setFromObject(g0), L = b2.max.z - b2.min.z, H = b2.max.y - b2.min.y, r = H * .37;
  // alle Dreiecke in Welt (Bike-Gruppe) holen; Speichen/Felgen/Reifen (Abstand zur Nabe .5–1.05 r) → zwei drehbare Räder
  const wheels = [{ c: new THREE.Vector3(0, r, b2.min.z + r), tris: [] }, { c: new THREE.Vector3(0, r, b2.max.z - r), tris: [] }], rest = [];
  const root = new THREE.Group(); root.name = 'post_rad';
  g0.traverse(m => { if (!m.isMesh) return; const geo = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrixWorld), P = geo.attributes.position, n = P.count / 3, keep = [], w0 = [], w1 = [];
    for (let t = 0; t < n; t++) { let cy = 0, cz = 0; for (let k = 0; k < 3; k++) { cy += P.getY(t * 3 + k); cz += P.getZ(t * 3 + k); } cy /= 3; cz /= 3;
      const d0 = Math.hypot(cy - wheels[0].c.y, cz - wheels[0].c.z) / r, d1 = Math.hypot(cy - wheels[1].c.y, cz - wheels[1].c.z) / r;
      if (d0 > .5 && d0 < 1.08) w0.push(t); else if (d1 > .5 && d1 < 1.08) w1.push(t); else keep.push(t); }
    const sub = (list, off) => { if (!list.length) return null; const g = new THREE.BufferGeometry(); for (const [nm, a] of Object.entries(geo.attributes)) { const arr = new a.array.constructor(list.length * 3 * a.itemSize); list.forEach((t, j) => { for (let k = 0; k < 3 * a.itemSize; k++) arr[j * 3 * a.itemSize + k] = a.array[t * 3 * a.itemSize + k]; }); g.setAttribute(nm, new THREE.BufferAttribute(arr, a.itemSize)); }
      if (off) g.translate(-off.x, -off.y, -off.z); g.computeBoundingSphere(); const me = new THREE.Mesh(g, m.material); me.castShadow = true; me.receiveShadow = true; return me; };
    const a = sub(keep); if (a) root.add(a); for (const [i, lst] of [[0, w0], [1, w1]]) { const me = sub(lst, wheels[i].c); if (me) { if (!wheels[i].g) { wheels[i].g = new THREE.Group(); wheels[i].g.position.copy(wheels[i].c); root.add(wheels[i].g); } wheels[i].g.add(me); } } });
  root.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); if (m.material.color) m.material.color.lerp(new THREE.Color(0x151515), .7); m.material.roughness = .55; } });
  // Posttasche am Gepäckträger (Müllsack-Scan in Leder-Braun als Rückfall für die fehlende Tasche) und Zeitungsrollen im Korb
  try { const t = (await msModel('trashbag')).clone(true); msFit(t, .38); t.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.36, .26, .16); m.material.roughness = .8; } }); const tg = msGround(t); tg.position.set(0, H * .72, b2.min.z + L * .18); root.add(tg); post_S.tasche = tg; } catch (e) {}
  root.userData.noCol = true; return { root, wheels: wheels.filter(w => w.g), r, L, H, sattel: new THREE.Vector3(0, H * .9, b2.min.z + L * .33), lenker: new THREE.Vector3(0, H * .98, b2.max.z - L * .2) };
}
// ---------------------------------------------------------------------  Günther: Figur + Fahrhaltung (über der Standbewegung, weich)
function post_bone(obj, re) { let b = null; obj.traverse(o => { if (!b && o.isBone && re.test(o.name.replace(/^mixamorig[:_]?/i, '').replace(/_\d+$/, ''))) b = o; }); return b; }
async function post_figurBau() { if (typeof figuren_load !== 'function') return null; const T = await figuren_load('guenther'); if (!T) return null;
  const sk = await figuren_skc(), obj = sk(T.scene); obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
  const mx = new THREE.AnimationMixer(obj), acts = {}; for (const [k, c] of Object.entries(T.clips)) { const a = mx.clipAction(c); a.play(); a.setEffectiveWeight(k === 'idle' ? 1 : 0); acts[k] = a; }
  const B = {}; for (const [k, re] of Object.entries({ hips: /^Hips$/, spine: /^Spine1?$/, spine2: /^Spine2$/, neck: /^Neck$/, head: /^Head$/, lu: /^LeftUpLeg$/, ru: /^RightUpLeg$/, ll: /^LeftLeg$/, rl: /^RightLeg$/, lf: /^LeftFoot$/, rf: /^RightFoot$/, la: /^LeftArm$/, ra: /^RightArm$/, lfa: /^LeftForeArm$/, rfa: /^RightForeArm$/ })) B[k] = post_bone(obj, re);
  const g = new THREE.Group(); g.add(obj); g.visible = false; g.userData.noCol = true; scene.add(g); mx.update(.01); g.updateMatrixWorld(true);
  const hip = new THREE.Vector3(); if (B.hips) B.hips.getWorldPosition(hip);
  return { g, obj, mx, acts, B, hipY: hip.y, fahrt: 1, fw: 1, blick: 0, atem: Math.random() * 6, cur: 'idle' }; }
function post_rotW(bone, axis, ang) { if (!bone || !ang) return; const S = post_S; bone.parent.getWorldQuaternion(S.q); S.q2.setFromAxisAngle(axis, ang); bone.quaternion.premultiply(S.q.clone().invert().multiply(S.q2).multiply(S.q)); }
// Fahrhaltung: Oberschenkel nach vorn, Knie treten im Wechsel (Kurbel θ), Oberkörper vor, Arme zum Lenker, Kopf aufrecht zu Luke; fw = Gewicht (0 = steht neben dem Rad)
function post_haltung(F, dt, theta, fuss) {
  const S = post_S, g = F.g, w = F.fw; if (w < .01) return; g.getWorldQuaternion(S.q3 || (S.q3 = new THREE.Quaternion())); const lat = S.ax.set(1, 0, 0).applyQuaternion(S.q3);
  const a = theta, b = theta + PI, sinA = Math.sin(a), sinB = Math.sin(b);
  // linkes Bein: bei „Fuß am Boden“ gestreckt zur Seite nach unten (steht), sonst treten
  const lT = fuss ? -.35 : -1.18 + .32 * sinA, lK = fuss ? .15 : 1.25 + .42 * Math.sin(a + 1.25), rT = -1.18 + .32 * sinB, rK = 1.25 + .42 * Math.sin(b + 1.25);
  post_rotW(F.B.lu, lat, lT * w); post_rotW(F.B.ru, lat, rT * w); post_rotW(F.B.ll, lat, lK * w); post_rotW(F.B.rl, lat, rK * w); post_rotW(F.B.lf, lat, (fuss ? .05 : -.25 + .2 * Math.sin(a - .6)) * w); post_rotW(F.B.rf, lat, (-.25 + .2 * Math.sin(b - .6)) * w);
  post_rotW(F.B.spine, lat, .32 * w); post_rotW(F.B.spine2, lat, .1 * w); post_rotW(F.B.la, lat, -1.05 * w); post_rotW(F.B.ra, lat, -1.05 * w); post_rotW(F.B.lfa, lat, -.35 * w); post_rotW(F.B.rfa, lat, -.35 * w);
  post_rotW(F.B.neck, lat, -.22 * w); post_rotW(F.B.head, lat, -.18 * w);
  // Hüfte wiegt beim Treten leicht mit (Gewicht über dem Pedal)
  if (F.B.hips && !fuss) { S.ax.set(0, 0, 1).applyQuaternion(S.q3); post_rotW(F.B.hips, S.ax, Math.sin(a) * .04 * w); } }
// Kopf zu Luke (weich, begrenzt)
function post_blick(F, dt, an) { const S = post_S, R = S.ride, g = R ? R.g : F.g, P = player.pos, yaw = Math.atan2(P.x - g.position.x, P.z - g.position.z); let d = yaw - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); d = Math.max(-1.1, Math.min(1.1, d));
  F.blick += ((an ? d : 0) - F.blick) * Math.min(1, dt * 2.2); const up = S.ax.set(0, 1, 0); post_rotW(F.B.neck, up, F.blick * .45); post_rotW(F.B.head, up, F.blick * .55); }

// ---------------------------------------------------------------------  Fahrt: Rad + Fahrer als eine Gruppe, Geschwindigkeit weich, Räder drehen mit v/r
function post_fahrZu(pts, v = 3.4) { const R = post_S.ride; R.path = pts.map(p => new THREE.Vector3(p[0], 0, p[1])); R.i = 0; R.vWant = v; return new Promise(res => { R.done = res; }); }
function post_rideTick(dt) { const S = post_S, R = S.ride, F = S.F; if (!R || !R.g.visible) return;
  let want = 0; if (R.path && R.i < R.path.length) { const p = R.path[R.i], dx = p.x - R.g.position.x, dz = p.z - R.g.position.z, d = Math.hypot(dx, dz);
      if (d < .6 && R.i < R.path.length - 1) R.i++; else if (d < .15 || (R.i === R.path.length - 1 && d < R.v * R.v / 3 + .05 && R.bremsen)) { R.path = null; if (R.done) { const f = R.done; R.done = null; f(); } }
      else { const yw = Math.atan2(dx, dz); let dy = yw - R.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); R.g.rotation.y += Math.sign(dy) * Math.min(Math.abs(dy), dt * 1.4 * Math.max(.3, R.v)); R.lean += (-dy * .6 * Math.min(1, R.v / 3) - R.lean) * Math.min(1, dt * 3);
        want = R.vWant * (R.i === R.path.length - 1 ? Math.min(1, d / 3.5 + .1) : 1); } }
  R.v += (want - R.v) * Math.min(1, dt * (want > R.v ? .9 : 1.6)); // anfahren weich, bremsen etwas schneller
  if (R.v > .005) { R.g.position.x += Math.sin(R.g.rotation.y) * R.v * dt; R.g.position.z += Math.cos(R.g.rotation.y) * R.v * dt; }
  if ((R.gyT -= dt) < 0) { R.gyT = .25; try { const s = solidGround(R.g.position.x, .8, R.g.position.z); R.gy = s > -1 && s < .8 ? Math.max(0, s) : 0; } catch (e) { R.gy = 0; } } R.g.position.y += ((R.gy || 0) - R.g.position.y) * Math.min(1, dt * 6);
  for (const w of S.bike.wheels) w.g.rotation.x += R.v / S.bike.r * dt; // Rollen ohne Rutschen
  R.theta += R.v / S.bike.r * dt * .62 * (R.v > .3 && want >= R.v * .7 ? 1 : 0); // treten nur beim Fahren/Anfahren, beim Ausrollen stehen die Kurbeln
  const steh = R.v < .12 && !R.path; R.fuss += ((steh ? 1 : 0) - R.fuss) * Math.min(1, dt * 3); R.bike.rotation.z = R.lean * .5 + R.fuss * .1; // steht: leicht zur Seite gekippt, ein Fuß am Boden
  if (F && R.fahrer) { F.mx.update(dt); F.g.rotation.z = R.lean * .5 + R.fuss * .1; post_haltung(F, dt, R.theta, R.fuss > .5); post_blick(F, dt, Math.hypot(player.pos.x - R.g.position.x, player.pos.z - R.g.position.z) < 14); } }
// ---------------------------------------------------------------------  Szene „Empfänger unbekannt verzogen“ (N-03)
function post_bereit() { const S = post_S; if (S.sz !== 'aus' || kap() !== 1 || !state.started || state.talking || ui.overlay || state.inBasement || state.outage || state.phase2) return false;
  const P = player.pos, car = story.side.car, tank = story.side.ow_kasse, zone = (Math.abs(P.x + 7) < 5 && P.z > 8 && P.z < 34) || (P.x > -18 && P.x < 14 && P.z > -3 && P.z < 6);
  const nacht = typeof leben_S === 'undefined' || !leben_S.clk || !leben_S.clk.min || leben_S.clk.min >= 1440 || leben_S.clk.min < 300; // kurz nach Mitternacht (02 H1)
  return zone && nacht && ((car && car.state !== 'hidden') || (tank && tank.state !== 'hidden') || state.hasKey); }
async function post_szene() { const S = post_S, R = S.ride, F = S.F; S.sz = 'laeuft'; kirchberg_start('post_brief', { x: -7, z: 20 });
  const P = player.pos, start = [-7.2, Math.min(58, P.z + 34)], ziel = [-6.9, P.z - 3.2]; R.g.position.set(start[0], 0, start[1]); R.g.rotation.y = PI; R.g.visible = true; R.v = 0; R.fahrer = true;
  post_klingel(start[0], 1.3, start[1], 1.1); await wait(2600); post_klingel(start[0], 1.3, start[1] - 5, 1.2);
  R.bremsen = true; await post_fahrZu([[-7.1, (start[1] + P.z) / 2], ziel], 4.2); state.talking = true;
  try { await post_zeile('Also, ich, äh … Sie sind nicht von hier. Doch. Brandt. Nr. 1. Kein Nachsendeantrag.', 4200); await post_zeile('Ich hab nichts für Sie. Ich mein: Es gibt nichts. Für Sie. Gute Nacht.', 3600);
    // Whiskey klingelt von der Laterne, aus der falschen Richtung → Günther zuckt, die Posttasche kippt
    if (typeof whiskey_mimic === 'function') whiskey_mimic('fahrrad', { force: true, at: [-4.45, 5.2, 17] }); else post_klingel(-4.45, 5, 17, .8);
    await wait(700); R.v = 0; R.lean = .18; Audio.play('metalHit2', { gain: .25, rate: 1.6, x: R.g.position.x, y: .8, z: R.g.position.z, ref: 2 }); post_tascheKippt();
    await post_zeile('Ich hab nichts gesehen! Ich hab nie was gesehen!', 2600); await wait(600);
    subtitle('Zeitungsrollen, Werbung. Und ein Brief: „Lucy Brandt, Ahornstraße 1“, Poststempel Hamburg. Absender: J. W., Hamburg.', 5200); await wait(3600);
    await post_zeile('Unzustellbar. Empfänger unbekannt verzogen.', 2600); subtitle('Meine Schwester ist nicht verzogen.', 2600, 'LUKE'); await wait(2600); post_papiereWeg();
    await post_zeile('Dann … dann ist das ja gut. Ich muss weiter.', 2600);
    const hatZ = story.items.includes('lucy_zigaretten'), opts = hatZ ? ['Lucys Zigaretten anbieten', '„Wieso Post um Mitternacht?“', '(Nichts sagen.)'] : ['„Wieso Post um Mitternacht?“', '(Nichts sagen.)'];
    let a = await kirchberg_wahl(opts); if (!hatZ) a += 1;
    if (a === 0) { S.steps.zigaretten = 1; await post_zeile('Ich rauch nicht. Ich sammel die. Für schlechte Zeiten.', 3200); subtitle('Er steckt eine hinters Ohr, zu der anderen, und zündet eine dritte an.', 3400); Audio.play('switch1', { gain: .15, rate: 2.5, x: R.g.position.x, y: 1.5, z: R.g.position.z, ref: 2 }); await wait(3200);
      await post_zeile('Die sind jetzt.', 1600); await post_zeile('Ich fang jetzt früher an. Seit Oktober. Fragen Sie nicht.', 3200); await post_zeile('Die an Nummer zwei stell ich zu. Da wohnt keiner. Da darf ich.', 3200); await post_zeile('Der Rabe ist Ihrer? Meine Klingel klingt wie der. Oder er wie die.', 3400); }
    else if (a === 1) await post_zeile('Um vier guckt keiner, sagt man. Stimmt nicht. Um vier gucken alle, die bloß nicht die Vorhänge aufmachen.', 5000);
  } finally { state.talking = false; }
  // weiter: zwanzig Meter, dann doch die Klingel – Whiskey klingelt nach; am Zaun von Nr. 9 telefoniert er mit dem Rücken zur Straße
  R.bremsen = false; const w = post_fahrZu([[-6.8, P.z - 12], [-2, 0.8], [30, 1.6], [48.6, 1.7]], 3.6);
  setTimeout(() => { post_klingel(R.g.position.x, 1.3, R.g.position.z, 1); setTimeout(() => { if (typeof whiskey_mimic === 'function') whiskey_mimic('fahrrad', { force: true }); }, 1700); }, 5200);
  setTimeout(() => subtitle('Der hat mir gerade gesagt, dass es nichts gibt. Für mich. Das war die ehrlichste Zustellung heute.', 4600, 'LUKE'), 9000);
  R.bremsen = true; await w; S.sz = 'telefon'; R.fahrer = true; S.telT = 0; S.steps.brief = 1; kirchberg_desc('post_brief', 'Maas, Günther. Steht auf der Tasche. Am Zaun von Nr. 9 telefoniert er.');
  if (!story.lore.some(l => l.key === 'post_postbote')) story.lore.push({ key: 'post_postbote', title: 'Der Postbote', html: 'Maas, Günther. Steht auf der Tasche. Gelbe Regenjacke, kein Licht am Rad, Zigarette hinterm Ohr. „Ich fang jetzt früher an. Seit Oktober.“' });
  post_save(); }
// Posttasche kippt: Papier auf der Straße (Abziehbilder), gleitet nicht – fällt mit Schwerkraft und bleibt liegen
function post_tascheKippt() { const S = post_S, R = S.ride, T = THREE; if (!S.papiere) { S.papiere = []; const m = [0xe8e0c8, 0xd8d0b8, 0xf0ece0, 0xcfc4a8, 0xe0d8c0].map(c => new T.MeshStandardMaterial({ color: c, roughness: .9, side: T.DoubleSide }));
    for (let i = 0; i < 9; i++) { const p = new T.Mesh(new T.PlaneGeometry(i === 0 ? .16 : .22, i === 0 ? .11 : .3), i === 0 ? new T.MeshStandardMaterial({ map: kirchberg_papier({ w: 256, h: 176, bg: '#f2ecde', zeilen: [['Lucy Brandt', 40, 80, 34], ['Ahornstraße 1', 40, 120, 30]], fn: (x) => { x.strokeStyle = '#2a4a8a'; x.lineWidth = 3; x.beginPath(); x.arc(210, 40, 24, 0, 7); x.stroke(); x.fillStyle = '#2a4a8a'; x.font = '12px Arial'; x.fillText('HAMBURG', 186, 44); } }), roughness: .9, side: T.DoubleSide }) : m[i % 5]);
      p.userData.noCol = true; p.castShadow = true; p.visible = false; scene.add(p); S.papiere.push({ p, v: new T.Vector3(), w: 0 }); } }
  const b = R.g.position, y0 = 1.1; S.papiere.forEach((q, i) => { q.p.visible = true; q.p.position.set(b.x + rand(-.2, .2), y0, b.z - .4 + rand(-.2, .2)); q.v.set(rand(-.9, .9), rand(.3, 1.1), rand(-1.4, -.2)); q.w = rand(-4, 4); q.p.rotation.set(rand(0, 6), rand(0, 6), 0); q.liegt = false; });
  S.papierAn = true; }
function post_papierTick(dt) { const S = post_S; if (!S.papierAn) return; let alle = true;
  for (const q of S.papiere) { if (q.liegt || !q.p.visible) continue; alle = false; q.v.y -= 9.81 * dt * .55; q.v.x *= 1 - dt * 1.8; q.v.z *= 1 - dt * 1.8; q.v.y = Math.max(q.v.y, -1.6); // Papier fällt gebremst (Luftwiderstand)
    q.p.position.addScaledVector(q.v, dt); q.p.rotation.x += q.w * dt; q.p.rotation.z += q.w * .6 * dt; if (q.p.position.y <= .012) { q.p.position.y = .012 + Math.random() * .004; q.p.rotation.set(-PI / 2, 0, q.p.rotation.z); q.liegt = true; } }
  if (alle) S.papierAn = false; }
function post_papiereWeg() { const S = post_S; if (S.papiere) { S.papiere[0].p.visible = false; } } // den Brief reißt er Luke aus der Hand; die Werbung bleibt liegen
// Telefonat am Zaun von Nr. 9 (Rücken zur Straße, drei Sätze, zu leise) → Meldezettel in den Kasten → nach Osten
function post_telefonTick(dt) { const S = post_S, R = S.ride, F = S.F; if (S.sz !== 'telefon') return; S.telT += dt;
  if (S.telT > .5 && !S.telAn) { S.telAn = true; R.g.rotation.y = PI; if (F) { F.acts.phone && F.acts.phone.setEffectiveWeight(.8); } Audio.play('switch2', { gain: .1, rate: 1.5, x: R.g.position.x, y: 1.4, z: R.g.position.z, ref: 2 }); }
  if (S.telAn && !S.telFluester && S.telT > 2) { S.telFluester = true; for (let i = 0; i < 3; i++) setTimeout(() => Audio.whisper(R.g.position.x, 1.5, R.g.position.z - .3, 1.6), i * 2400); }
  if (S.telT > 10 && S.telAn && !S.meldung) { S.meldung = true; if (F && F.acts.phone) F.acts.phone.setEffectiveWeight(0); Audio.play('metalHit2', { gain: .15, rate: 2, x: 51.45, y: 1.2, z: -6.72, ref: 2 }); S.meld = 2; post_save();
    post_fahrZu([[60, 1.6], [90, 1.2], [132, 1]], 4).then(() => { R.g.visible = false; S.sz = 'fertig'; kirchberg_fertig('post_brief', 'Maas, Günther. „Ich fang jetzt früher an. Seit Oktober.“ Der Brief an Lucy kam aus Hamburg. J. W.'); post_save(); }); R.bremsen = false; } }

// ---------------------------------------------------------------------  Schuppen (außen, Kap. 1: zu) + innen (Kap. 4/5)
async function post_schuppenAussen() { const S = post_S, x = 101.05, z = -26.5; // Vorderseite (+x) des Geräteschuppens
  const schild = kirchberg_papier({ w: 512, h: 128, bg: '#6a5a44', flecken: 5, zeilen: [['REIFEN – KRANZ', 70, 86, 64, '#e6dcc4', 'bold Arial', 0]] });
  kirchberg_decal(schild, 2, .5, x + .012, 2.4, z, PI / 2, { rough: .8 });
  const schloss = kirchberg_tex(kirchberg_cnv(128, 160, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = '#8a8478'; c.lineWidth = 12; c.beginPath(); c.arc(w / 2, 50, 28, PI, 0); c.lineTo(w / 2 + 28, 70); c.moveTo(w / 2 - 28, 50); c.lineTo(w / 2 - 28, 70); c.stroke();
    const g = c.createLinearGradient(0, 70, 0, 150); g.addColorStop(0, '#9a8a60'); g.addColorStop(1, '#5a4a30'); c.fillStyle = g; c.fillRect(20, 70, w - 40, 80); c.strokeStyle = '#3a2e1c'; c.lineWidth = 3; c.beginPath(); c.ellipse(w / 2, 104, 16, 8, 0, 0, 7); c.stroke(); c.fillStyle = '#3a2e1c'; c.beginPath(); c.arc(w / 2, 104, 3.5, 0, 7); c.fill(); c.fillRect(w / 2 - 2, 122, 4, 16); }));
  kirchberg_decal(schloss, .1, .125, x + .015, 1.1, z + .45, PI / 2, { alpha: true, rough: .4 });
  // Werbeprospekte, nach Jahren gebündelt (Bücher-Scan flach, bunt, mit Paketschnur-Abziehbild)
  const bu = await kirchberg_mod('w_buch', 'model.glb', .3, 'max'); if (bu) for (let i = 0; i < 7; i++) { const b = bu.clone(true); b.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setHSL((i * .17) % 1, .45, .5); } }); b.scale.y *= .55; kirchberg_setze(b, x + .55 + (i % 3) * .05, (i / 3 | 0) * .06 + .01, z - .6 + (i % 3) * .34, kirchberg_r(-.3, .3)); }
  // Neonröhre in den Ritzen: nur Emission (kein Licht), flackert, sobald jemand davorsteht
  S.roehre = new THREE.MeshStandardMaterial({ color: 0x0a0c0a, emissive: 0xd8f0e0, emissiveIntensity: 0, transparent: true, opacity: .9, depthWrite: false });
  for (const [dz, h] of [[-.62, 1.9], [.08, 2.1], [.71, 1.7]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.012, h), S.roehre); m.position.set(x + .006, 1.05 + h / 2 - .9, z + dz); m.rotation.y = PI / 2; m.userData.noCol = true; scene.add(m); }
  S.schuppenHit = kirchberg_hit(.6, 2.4, 2.6, x + .3, 1.2, z, () => kirchberg_offen('schuppen') ? 'Schuppen betreten' : 'Schuppentür', () => { if (kirchberg_offen('schuppen')) return kirchberg_rein('schuppen');
    kirchberg_start('ow_kasse'); openNote('Günthers Schuppen', 'Wellblech, ein Schild REIFEN – KRANZ, ein Vorhängeschloss mit eingeprägtem Auge. Vor der Tür Werbeprospekte, nach Jahren gebündelt.\n\nDurch die Ritzen: Postsäcke, ein Kalender, eine Neonröhre.', 'post_schuppen', () => { post_S.steps.schuppen = 1; if (typeof ausbau_ost_west_zapfCheck === 'function') ausbau_ost_west_zapfCheck(); }); });
}
async function post_schuppenInnen() { const C = POST_RAUM.schuppen, S = post_S;
  const R = kirchberg_raum({ id: 'schuppen', x: C.x, z: C.z, w: 5, d: 4, h: 2.7 /* QA-Kollision 09.10.: 2,5 → 2,7: Sprung stieß mit der Kamera in die Decke */, wand: 'corrugated', wandTint: 0x8a8a80, wandTile: 1.5, boden: 'pavement', bodenTint: 0x6a6660, decke: 'rust_sheet', tuer: [C.x + 1.5, C.z + 1.95, PI], tuerWand: 'n', rein: { x: C.x + .5, z: C.z + 1.2, yaw: 0 } /* QA-Kollision 09.10.: nicht neben die Postsäcke (vorher 0,6 m bis zum Sack) */, raus: { x: 102.4, z: -26.5, yaw: -PI / 2 }, rausLabel: 'Hinaus' });
  const g = R.g, pl = kirchberg_mat('planks_painted', 0x8a7458, .8), x0 = R.x0, x1 = R.x1, z0 = R.z0;
  // Obstkisten-Regale (Latten mit Holz-Scan), beschriftet mit Straßen und Hausnummern
  const kiste = (x, y, z, label) => { const w = .5, h = .3, d = .36; box(w, .02, d, x, y + .01, z, pl, { parent: g, cast: true }); box(.02, h, d, x - w / 2, y + h / 2, z, pl, { parent: g }); box(.02, h, d, x + w / 2, y + h / 2, z, pl, { parent: g }); box(w, h * .6, .02, x, y + h * .3, z + d / 2, pl, { parent: g }); box(w, h, .02, x, y + h / 2, z - d / 2, pl, { parent: g });
    kirchberg_decal(kirchberg_papier({ w: 256, h: 80, bg: '#e8e0c8', zeilen: [[label, 16, 56, 40, '#1a1a1a', '"Caveat", cursive', 0]] }), .3, .09, x, y + .2, z + d / 2 + .012, 0, { parent: g }); };
  ['AHORN 1', 'AHORN 2', 'AHORN 3', 'AHORN 4', 'AHORN 5', 'AHORN 7', 'HOF', 'ZEITUNG / POLIZEI / LANDTAG'].forEach((l, i) => kiste(x0 + .45 + (i % 4) * .56, .02 + (i / 4 | 0) * .42 + (i === 7 ? .84 : 0), z0 + .3, l));
  // Postsäcke nach Jahr (Müllsack-Scan in Sackleinen-Farbe), Kalender von 2012 (Dezember), Hocker mit Zeitungsstapel, Kaffeemaschine (Radio-Scan als Ersatz)
  const sack = await kirchberg_mod('trashbag', 'model.gltf', .7); if (sack) for (let i = 0; i < 5; i++) { const s2 = sack.clone(true); s2.scale.y *= .62; /* QA-Kollision 09.10.: flachere Säcke – auf den hohen Säcken stieß die Kamera an die 2,5-m-Decke */ s2.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.5, .43, .32); m.material.roughness = .95; } }); kirchberg_setze(s2, x1 - .5 - (i % 2) * .5, 0, C.z - .8 + (i / 2 | 0) * .55, kirchberg_r(0, 6), g); }
  kirchberg_decal(kirchberg_papier({ w: 300, h: 420, bg: '#f0ece2', zeilen: [['DEZEMBER 2012', 30, 56, 32, '#8a1a14', 'Georgia, serif', 0]], fn: (x) => { x.strokeStyle = '#999'; for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) x.strokeRect(24 + c * 36, 90 + r * 48, 36, 48); } }), .3, .42, x1 - .105, 1.5, C.z + .9, -PI / 2, { parent: g });
  const ch = await kirchberg_fbx('chair', { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } }, .6); if (ch) kirchberg_setze(ch, C.x - .6, 0, C.z + .7, .5, g);
  const bu = await kirchberg_mod('w_buch', 'model.glb', .32, 'max'); if (bu) for (let i = 0; i < 5; i++) { const b = bu.clone(true); b.scale.y *= .6; kirchberg_setze(b, C.x - .6, .6 + i * .03, C.z + .7, kirchberg_r(-.2, .2), g); }
  const r = await kirchberg_mod('radio', 'model.gltf', .3, 'max'); if (r) { r.traverse(m => { if (m.name === 'tubes') m.visible = false; }); kirchberg_setze(r, x1 - .4, .9, z0 + .35, -.3, g); }
  const tisch = await kirchberg_mod('metaltable', 'model.gltf', 0); if (tisch) { tisch.scale.set(.25, .85, .5); kirchberg_setze(tisch, x1 - .5, 0, z0 + .4, 0, g); }
  // Neonröhre (echte Quelle: Emission) + kaltes Licht, konstant
  const nm = new THREE.MeshStandardMaterial({ color: 0x223, emissive: 0xd8f0e0, emissiveIntensity: 2.2 }); const n = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1.2, 8), nm); n.rotation.z = PI / 2; n.position.set(C.x, 2.42, C.z); n.userData.noCol = true; g.add(n);
  kirchberg_licht(R, 0xd8f0e0, 1.4, 6, C.x, 2.3, C.z);
  const sm = msSurfMat('grime', { alpha: true, tint: 0x4a4032 }); sm.opacity = .6; const d = new THREE.Mesh(new THREE.PlaneGeometry(3, 2.4), sm); d.rotation.x = -PI / 2; d.position.set(C.x, .004, C.z); d.userData.noCol = true; g.add(d);
}
// ---------------------------------------------------------------------  Nr. 9 „Butterbrotpapier“: nur durchs Fenster (02 C10)
async function post_postenBau() { const C = POST_RAUM.posten, S = post_S, T = THREE;
  const R = kirchberg_raum({ id: 'posten', x: C.x, z: C.z, w: 4.2, d: 3.6, h: 2.6, wand: 'wallpaper_old', wandTint: 0x8a8272, boden: 'floor_worn', bodenTint: 0x6a5e50, rein: { x: C.x - .3, z: C.z + 1.25, yaw: 0 } }); /* QA-Kollision 09.10.: vorher z+1,6 = in der Südwand (0 m frei) */
  const g = R.g, x0 = R.x0, x1 = R.x1, z0 = R.z0;
  const k = await kirchberg_mod('w_kamera', 'model.glb', .16, 'max'); if (k) kirchberg_setze(k, C.x + 1.2, 1.35, z0 + .5, PI * .8, g); // Stativ-Kamera (Stativ: Stehlampen-Fuß)
  const st = await kirchberg_mod('floorlamp', 'model.gltf', 1.35); if (st) { st.traverse(m => { if (m.isMesh && /shade|lamp/i.test(m.name)) m.visible = false; }); kirchberg_setze(st, C.x + 1.2, 0, z0 + .3, 0, g); /* QA-Kollision 09.10.: bündig an die Wand (Engstelle zwischen Lampe und Wand) */ }
  const ch = await kirchberg_fbx('chair', { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } }, .85); if (ch) kirchberg_setze(ch, C.x + .4, 0, C.z - .2, PI * .9, g);
  const ti = await kirchberg_mod('metaltable', 'model.gltf', 0); if (ti) { ti.scale.set(.28, .8, .5); kirchberg_setze(ti, C.x - .6, 0, z0 + .45, 0, g); }
  const ty = .78; const rk = await kirchberg_mod('radio', 'model.gltf', .3, 'max'); if (rk) { rk.traverse(m => { if (m.name === 'tubes') m.visible = false; }); kirchberg_setze(rk, C.x - .95, ty, z0 + .42, .2, g); }
  const led = new T.Sprite(new T.SpriteMaterial({ map: kirchberg_flammeTex(), color: 0xff3020, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); led.scale.setScalar(.03); led.position.set(C.x - .85, ty + .2, z0 + .6); g.add(led); S.led = led;
  const th = await kirchberg_mod('w_thermos', 'model.glb', .31); if (th) { kirchberg_setze(th, C.x - .35, ty, z0 + .5, 0, g); // Thermoskanne mit dem Auge: eingeprägtes Zeichen (Auge über Flamme im Kreis) in Brusthöhe der Kanne, zum Fenster hin
    const eye = kirchberg_decal(kirchberg_tex(kirchberg_cnv(128, 128, (x, w) => { x.clearRect(0, 0, w, w); x.strokeStyle = 'rgba(20,20,22,.9)'; x.lineWidth = 7; x.beginPath(); x.arc(64, 64, 54, 0, 7); x.stroke(); x.beginPath(); x.ellipse(64, 50, 28, 14, 0, 0, 7); x.stroke(); x.fillStyle = 'rgba(20,20,22,.9)'; x.beginPath(); x.arc(64, 50, 8, 0, 7); x.fill(); x.beginPath(); x.moveTo(64, 112); x.quadraticCurveTo(44, 94, 64, 70); x.quadraticCurveTo(84, 94, 64, 112); x.fill(); })), .05, .05, C.x - .35, ty + .15, z0 + .5 + .0525, 0, { alpha: true, rough: .4, parent: g }); }
  const br = await kirchberg_mod('w_brot', 'model.glb', .12, 'max'); if (br) for (let i = 0; i < 2; i++) kirchberg_setze(br.clone(true), C.x - .55 + i * .13, ty + .01, z0 + .62, i, g);
  kirchberg_decal(kirchberg_papier({ w: 256, h: 200, bg: '#efe8d8', flecken: 2, fn: (x, w, h) => { x.strokeStyle = 'rgba(120,110,90,.4)'; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(0, i * 26); x.lineTo(w, i * 26 + 10); x.stroke(); } } }), .28, .2, C.x - .5, ty + .006, z0 + .64, 0, { rx: -PI / 2, parent: g, alpha: false });
  kirchberg_decal(kirchberg_papier({ w: 300, h: 420, bg: '#f2ecde', zeilen: [['MESSSTELLE KIRCHBERG', 16, 50, 26, '#222', 'Arial', 0], ['Nachtdienst November', 16, 84, 22, '#333', 'Arial', 0], ['Mo bis Do: 11 / 12', 16, 150, 26, '#222', 'Arial', 0], ['Fr: –', 16, 190, 26, '#222', 'Arial', 0], ['Fr frei. Abholung.', 30, 290, 36, 'rgba(20,30,110,.9)', null, -.05]] }), .3, .42, x0 + .105, 1.5, C.z, PI / 2, { parent: g });
  kirchberg_licht(R, 0xd0d8e8, .25, 5, C.x - .5, 1.8, z0 + .8); // nur das Standby und der Nebel draußen
  S.postenR = R; }
async function post_durchsFenster() { const S = post_S, C = POST_RAUM.posten; if (state.talking) return; kirchberg_start('k1_butter', { x: 50, z: -8 });
  const an = typeof flashOn !== 'undefined' ? flashOn : true; if (!an) return toast('Hinter der Scheibe ist es schwarz. Ein Brett fehlt. Mit der Lampe vielleicht.', 3000);
  state.talking = true; const zurueck = { x: player.pos.x, z: player.pos.z, yaw: player.yaw, pitch: player.pitch };
  try { await fade(1, 450); player.pos.set(C.x, 0, C.z + 1.65); player.yaw = 0; player.pitch = -.18; if (typeof vel !== 'undefined') vel.set(0, 0, 0); await fade(0, 500); await wait(3200);
    subtitle('Stativ mit Kamera. Ein Rekorder mit roter Leuchte. Campingstuhl, Thermoskanne mit Auge. Zwei Stullen in Butterbrotpapier. Ein Kreuzworträtsel. Ein Dienstplan.', 6200); await wait(4600);
    await fade(1, 400); player.pos.set(zurueck.x, 0, zurueck.z); player.yaw = zurueck.yaw; player.pitch = zurueck.pitch; await fade(0, 500); } finally { state.talking = false; }
  S.steps.fenster = 1; openNote('Dienstplan', 'MESSSTELLE KIRCHBERG · Nachtdienst November · Mo bis Do: 11 / 12 · Fr: –\n<span class="hand">Fr frei. Abholung.</span>', 'post_dienstplan');
  openNote('Kreuzworträtsel', '<i>Zwei Handschriften, eine ordentlich, eine sehr langsam.</i>\n\nWaagerecht: Behörde (3) AMT. Nachtvogel (4) <s>EULE</s>, darüber RABE.\nSenkrecht: Gegenteil von Tag (6) DIENST. Anderes Wort für Rückführung (9): leer, am Rand <span class="hand">frag 11</span>', 'post_kreuzwort',
    () => { subtitle('Gegenteil von Tag: Dienst. Das Ehrlichste, was ich heute gelesen hab.', 3800, 'LUKE'); post_butterCheck(); }); post_save(); }
function post_blatt212() { const S = post_S; kirchberg_start('k1_butter'); if (typeof flashOn !== 'undefined' && !flashOn) return toast('Hinter der Scheibe der Hintertür liegt ein Blatt am Boden. Ohne Licht nicht lesbar.', 3200);
  S.steps.blatt = 1; openNote('Blatt 212 (hinter der Scheibe, am Boden)', '<span style="font-family:\'Special Elite\',monospace">Messstelle Kirchberg · Beobachtung Ahornstraße 7 · Blatt 212\n23.10., 21:10 · L. B. (26) betritt Nr. 7. Licht Keller. 21:40 · Frau Wendt vor dem Haus, zählt. Acht. 22:05 · L. B. verlässt Nr. 7 nicht.\n24.10. bis 31.10. · Nr. 7 dunkel. Frau Wendt stellt Brot vor die Kellertür. Der Vogel sitzt auf der Laterne.\n03.11., 04:00 · Maas meldet: Anruf aus der Stadt, Bruder. Elfmal nicht abgenommen. Zwölftes Mal: Verbindung.\n04.11., 23:12 · Fahrzeug Ortsschild. Fahrer schläft. Zettel am Fenster (nicht von uns).\n04.11., 23:40 · K-3 betritt den Ort. Zu Fuß. Barfuß? Nein. Nass.</span>\n\n<i>Letzte Zeile, andere Hand, Bleistift, Druckbuchstaben:</i>\nIHR ZÄHLT AUCH. ABER FALSCH ∴', 'post_blatt212',
    () => { subtitle('Die schreiben mich mit.', 2600, 'LUKE'); post_butterCheck(); }); post_save(); }
function post_meldezettel() { const S = post_S; kirchberg_start('k1_butter'); S.steps.meld = Math.max(S.steps.meld || 0, S.meld || 1);
  openNote('Obenauf im Briefkasten: ein Zettel', '<span class="hand" style="font-family:Caveat;color:#333">4.11., spät. Wagen am Ortsschild. Stadtkennzeichen. Fahrer schläft im Sitzen, Mund offen. Brandt L.? Der Junge. Sieht älter aus. – M.</span>' + (S.meld >= 2 ? '<br><br><i>Darauf, frischer:</i><br><span class="hand" style="font-family:Caveat;color:#333">Brandt L. wach. Zu Fuß. Fragt nach der Schwester. Hat keine Zigaretten (meine). Vogel dabei. – M.</span>' : '') + '<br><br><i>Karopapier, zittrige Schrift.</i>', 'post_meldezettel' + (S.meld >= 2 ? '2' : ''), () => post_butterCheck()); post_save(); }
function post_butterCheck() { const S = post_S, st = S.steps, n = ['fenster', 'blatt', 'meld', 'objektiv'].filter(k => st[k]).length + (st.zaun ? 1 : 0);
  kirchberg_desc('k1_butter', `Nr. 9: Astloch, Gartenzaun, Küchenfenster hinten, Hintertür, Briefkasten. (${n}/5)`);
  if (st.fenster && st.blatt && st.meld) { kirchberg_fertig('k1_butter', 'Die Männer, die nachts aufbleiben, haben Proviant wie auf Klassenfahrt. Und sie schreiben mich mit.');
    if (!story.lore.some(l => l.key === 'post_maenner')) story.lore.push({ key: 'post_maenner', title: 'Die Männer im Nebel', html: 'Nr. 9 ist ein Posten. Messstelle Kirchberg. Mo bis Do: 11 / 12. Stullen in Butterbrotpapier, ein Kreuzworträtsel, ein Objektiv auf Nr. 7. Blatt 212: „K-3 betritt den Ort.“ Die letzte Zeile hat jemand anderes geschrieben.' }); } }
async function post_nr9Bau() { const S = post_S;
  // Küchenfenster hinten (Glas des Hauses, ein Brett fehlt), Hintertür mit Scheibe, Gartenzaun mit Lücke und Kratzern, Zettel im Briefkastenschlitz
  S.fensterHit = kirchberg_hit(1.3, 1.4, .6, 52.75, 1.75, -21.8, 'Küchenfenster (ein Brett fehlt)', () => post_durchsFenster());
  const pl = kirchberg_mat('planks_painted', 0x5a4a3a, 1); for (const [y, r] of [[2.25, .06], [1.35, -.05]]) { const b = box(1.35, .16, .04, 52.75, y, -21.58, pl); b.rotation.z = r; b.rotation.y = PI; b.userData.noCol = true; }
  S.tuerHit = kirchberg_hit(1.1, 2.1, .5, 47.8, 1.1, -21.8, 'Hintertür (Scheibe)', () => post_blatt212());
  try { post_hintertuer(); } catch (e) { console.warn('Post: Hintertür', e); }
  try { post_zaun(); } catch (e) { console.warn('Post: Zaun', e); }
  if (typeof beob_spur === 'function') /* Kratzer neben der Lücke: post_zaun() */
  S.meldHit = kirchberg_hit(.35, .25, .5, 51.45, 1.36, -6.95, 'Zettel im Briefkastenschlitz', () => post_meldezettel()); }
// Hintertür von Nr. 9 mit Glasscheibe: die Scan-Tür (Vollblatt) wird durch Rahmentür mit großer, verschmutzter Scheibe ersetzt; dahinter am Boden das Blatt 212 (Schreibmaschine), nur im Lampenlicht lesbar
function post_hintertuer() { const T = THREE, S = post_S, X = 47.8, Zo = -21.62;
  const alt = msFind((m, b) => b.min.x > 47.1 && b.max.x < 48.5 && b.min.z > -21.95 && b.max.z < -21.35 && b.max.y - b.min.y > 1.7 && b.max.y - b.min.y < 2.4); alt.forEach(m => { m.visible = false; });
  const holz = kirchberg_mat('planks_painted', 0x3d3328, 1), g = new T.Group(), bx = (w, h, d, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), holz); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  bx(.16, 2.09, .2, -.5, 1.045, 0); bx(.16, 2.09, .2, .5, 1.045, 0); bx(1.16, .16, .2, 0, 2.01, 0); bx(1.16, .22, .2, 0, .11, 0); bx(.82, .06, .14, 0, 1.45, 0); bx(.05, 1.4, .13, 0, 1.0, 0); // Stiele, Querriegel, Sprossen
  const glas = new T.MeshStandardMaterial({ color: 0x1b2326, transparent: true, opacity: .3, roughness: .06, metalness: 0, envMapIntensity: 1.8, side: T.DoubleSide, depthWrite: false });
  for (const [yy, hh] of [[.9, .98], [1.9, .54]]) { const gp = new T.Mesh(new T.PlaneGeometry(.84, hh), glas); gp.position.set(0, yy - .0 + (yy === .9 ? .0 : -.0), -.092); gp.renderOrder = 3; g.add(gp); }
  const schmutz = new T.Mesh(new T.PlaneGeometry(.84, 1.9), msSurfMat('grime', { alpha: true, tint: 0x5a5648 })); schmutz.material.opacity = .55; schmutz.position.set(0, 1.35, -.095); schmutz.renderOrder = 4; g.add(schmutz);
  const gr = new T.Mesh(new T.CylinderGeometry(.018, .018, .16, 8), new T.MeshStandardMaterial({ color: 0x4a4a4c, metalness: 1, roughness: .4 })); gr.position.set(.38, 1.0, -.15); g.add(gr);
  g.traverse(m => { m.userData.noCol = false; }); g.position.set(X, .45, Zo); scene.add(g); S.hintertuer = g;
  const blatt = kirchberg_decal(kirchberg_papier({ w: 256, h: 340, bg: '#e9e3d0', flecken: 4, knick: true, zeilen: [['Blatt 212', 24, 42, 22, '#222', '"Special Elite","Courier New",monospace', 0], ['23.10., 21:10  L. B. (26)', 24, 84, 15, '#333', '"Courier New",monospace', 0], ['betritt Nr. 7. Licht Keller.', 24, 108, 15, '#333', '"Courier New",monospace', 0], ['21:40  Frau Wendt vor dem', 24, 142, 15, '#333', '"Courier New",monospace', 0], ['Haus, zählt. Acht.', 24, 166, 15, '#333', '"Courier New",monospace', 0]] }), .21, .3, X - .08, .452, -21.27, 0, { rx: -PI / 2, rz: .5 }); blatt.material.color.setRGB(.8, .8, .76); S.blatt = blatt; }
// Gartenzaun von Nr. 9 (Lattenzaun von der Hausecke nach Westen): zwei Latten sind unten auseinandergebogen, gerade weit genug für ein kleines Kind; am Rand der Lücke drei Kratzer im Holz
function post_zaun() { const T = THREE, holz = kirchberg_mat('planks_painted', 0x6b6150, 1), alt = kirchberg_mat('planks_painted', 0x544a3c, 1), g = new T.Group(), z0 = -14.2, xE = 44.45, nL = 17, dx = .165;
  const bx = (w, h, d, x, y, z, m) => { const q = new T.Mesh(new T.BoxGeometry(w, h, d), m); q.position.set(x, y, z); q.castShadow = q.receiveShadow = true; g.add(q); return q; };
  const xs = []; for (let i = 0; i < nL; i++) xs.push(xE - .12 - i * dx); const lueck = 4; // Lattenindex der Lücke (x ≈ 43.7)
  bx(nL * dx + .1, .08, .05, xE - nL * dx / 2 - .02, .28, z0 - .03, alt); bx(nL * dx + .1, .08, .05, xE - nL * dx / 2 - .02, .72, z0 - .03, alt); // zwei Riegel (hinten)
  for (const px of [xE - .05, xE - nL * dx - .1]) bx(.1, 1.05, .1, px, .525, z0 - .03, alt); // Pfosten
  xs.forEach((x, i) => { const h = .84 + (i % 5) * .012 - .02, geknickt = i === lueck || i === lueck + 1, s = i === lueck ? -1 : 1;
    if (!geknickt) { const q = bx(.1, h, .022, x, .08 + h / 2 + .02, z0, holz); q.rotation.z = ((i * 37) % 7 - 3) * .004; const sp = new T.Mesh(new T.ConeGeometry(.05, .06, 4), holz); sp.rotation.y = PI / 4; sp.scale.set(1, 1, .22); sp.position.set(x, .1 + h + .03, z0); g.add(sp); return; }
    const piv = new T.Group(); piv.position.set(x, .08 + h + .02 - .06, z0); const q = new T.Mesh(new T.BoxGeometry(.1, h, .022), holz); q.position.y = -h / 2 + .06; q.castShadow = true; piv.add(q); const sp = new T.Mesh(new T.ConeGeometry(.05, .06, 4), holz); sp.rotation.y = PI / 4; sp.scale.set(1, 1, .22); sp.position.y = .09; piv.add(sp);
    piv.rotation.z = s * .34; piv.rotation.y = s * .08; g.add(piv); }); // Pivot oben: die Unterkanten klappen nach außen
  const xl = xs[lueck];
  if (typeof beob_spur === 'function') beob_spur('kratzer', { pos: [xl - .32, .3, z0 + .014], ry: 0, w: .09, h: .12, k: [1, 2, 3] });
  g.traverse(m => { if (m.isMesh) m.userData.noCol = false; }); scene.add(g); post_S.zaun = g;
  const hit = kirchberg_hit(.9, .8, .6, xl, .4, z0, 'Gartenzaun', () => { post_S.steps.zaun = 1; kirchberg_start('k1_butter'); toast('Zwei Latten unten auseinandergebogen, gerade weit genug für ein kleines Kind. Daneben drei Kratzer.', 4200); post_butterCheck(); post_save(); }); post_S.zaunHit = hit; }
// Objektiv im Astloch (AP-14 baut das Glimmen): Lampe länger als zwei Sekunden darauf → es surrt und dreht sich einen Fingerbreit zu Luke
function post_objektivTick(dt) { const S = post_S; if (kap() !== 1 || typeof flashOn === 'undefined') return; const P = player.pos, x = 46.95, y = 1.5, z = -12.42, d = Math.hypot(P.x - x, P.z - z); if (d > 11) { S.objT = 0; return; }
  S.v.set(x - camera.position.x, y - camera.position.y, z - camera.position.z).normalize(); if (flashOn && fwd.dot(S.v) > .985) { S.objT = (S.objT || 0) + dt; if (S.objT > 2 && !S.objGedreht) { S.objGedreht = true; S.steps.objektiv = 1; kirchberg_start('k1_butter');
      if (Audio.ctx) { const dd = Audio.at(x, y, z, 2); const o = Audio.osc('sawtooth', 180, 0, .5); Audio.env(o, .02, .05, .35, 0, dd); }
      if (typeof K1 !== 'undefined' && K1.glimmen) K1.glimmen.position.x += .012; if (typeof K1 !== 'undefined' && K1.linse) K1.linse.rotation.y += .16; subtitle('Es surrt. Das Glas dreht sich einen Fingerbreit. Zu dir.', 3400); post_butterCheck(); post_save(); } } else S.objT = 0;
  // beim Weggehen klickt drinnen die Kamera (einmal)
  if (S.objGedreht && !S.klick && d > 8 && d < 11) { S.klick = true; Audio.play('switch1', { gain: .2, rate: 2.2, x, y, z, ref: 2 }); } }

// ---------------------------------------------------------------------  „Sieben Kerzen“ (Basis-PHOTOS, AP-15): Hildes Zeilen, Orte (Mike an Zapfsäule 3, Heidi auf der Schaukel), Momente
const POST_HILDE = ['Roxy. Ist im Juni selber gegangen. Hat das Licht angelassen.', 'Lucy. Hat mir geglaubt. Als Einzige.', 'Mike. Säule drei. Der Lars zählt noch.', 'Dina, Scheune. Sie hat die Augen zu. Klug.', 'Luke. Der mit dem Klar.', 'Heidi. Weit weg. Kommt trotzdem.', 'Zayn. Mein Zayn. 28.7.'];
const POST_BILD = ['Roxy, gestreiftes Shirt, Zahnlücke.', 'Lucy, Panda-Top, Zunge raus.', 'Mike, blond, Hand an der Zapfpistole.', 'Dina, acht, Augenbinde, Heu.', 'Junge, neun, gestreifter Schlafanzug. Augen im Blitz fast weiß, sehr hellblau.', 'Heidi, hellblond, unscharf vom Schwung.', 'Zayn, Locken, rotes Shirt.'];
function post_kerzen() { if (typeof PHOTOS === 'undefined') return;
  PHOTOS.forEach((p, i) => { p.text = `${POST_BILD[i]}\n\nUnten, Hildes Zeile: <span class="hand">„${POST_HILDE[i]}“</span>\n\nRückseite, Kinderkreide: <span class="hand" style="font-family:Caveat">Wer ist das achte Kind?</span>`; p.hint = { 2: 'An der Zapfsäule 3 der Tankstelle Kranz.', 5: 'Auf der Schaukel am Spielplatz.' }[i] || p.hint; });
  // Mike: aus der Telefonzelle an Zapfsäule 3 (Tankstelle Kranz, vordere Zapfinsel; Kreideumriss zweier Kinderfüße)
  const mv = (i, x, y, z, zone) => { const p = PHOTOS[i]; if (!p || !p.mesh) return; scene.attach(p.mesh); p.mesh.position.set(x, y, z); p.mesh.rotation.set(-PI / 2, 0, rand(-.5, .5), 'YXZ'); p.booth = null; if (p.candle && p.candle.g) p.candle.g.position.set(x + .28, y - .004, z + .1); p.zone = zone; p.mesh.updateMatrixWorld(true); };
  mv(2, 115.3, .63, 15.1, [115, 15, 9]); mv(5, 40.25, .52, 78.8, [40.6, 78.8, 8]);
  try { const sw = typeof ausbau_nord !== 'undefined' && ausbau_nord.swing; const seat = sw && sw.seats && sw.seats[0]; if (seat) { const b = new THREE.Box3().setFromObject(seat.piv.children[0]), c = b.getCenter(new THREE.Vector3()), p5 = PHOTOS[5]; p5.mesh.position.set(c.x, b.max.y + .004, c.z); seat.piv.attach(p5.mesh); if (p5.candle && p5.candle.g) p5.candle.g.position.set(c.x + .5, 0, c.z + .3); } } catch (e) {} // Polaroid 7/7 liegt auf dem Schaukelsitz und schwingt mit
  kirchberg_decal(kirchberg_tex(kirchberg_cnv(256, 256, (x, w) => { x.clearRect(0, 0, w, w); x.strokeStyle = 'rgba(236,232,214,.8)'; x.lineWidth = 6; for (const dx of [-38, 38]) { x.beginPath(); x.ellipse(w / 2 + dx, w / 2 + 10, 22, 48, dx * .004, 0, 7); x.stroke(); for (let t = 0; t < 5; t++) { x.beginPath(); x.arc(w / 2 + dx - 14 + t * 7, w / 2 - 44 - (t === 0 ? 4 : 0), 5, 0, 7); x.stroke(); } } })), .4, .4, 115.9, .025, 15.7, 0, { rx: -PI / 2, alpha: true });
  // Momente (Bibel): Roxy – in der Lampe tanzt auf der Asche ein Kinderschatten ohne Kind; Lucy – Radio „… komm nach Hause, Luke …“, Spieluhr darunter; Mike, Heidi – still
  if (typeof photoWay !== 'undefined') { photoWay[0] = () => post_roxySchatten(); photoWay[1] = () => { Audio.radio(1.9, -37); setTimeout(async () => { await say([['*Rauschen*', 1600], ['„… komm nach Hause, Luke …“', 2800, 'EINE MÄDCHENSTIMME']]); if (typeof Audio.musicBox === 'function') try { Audio.musicBox(1.9, 1, -37); } catch (e) {} await wait(1200); await say([['Nach Hause. Das sagt sie nicht. Lucy sagt heim.', 3200, 'LUKE']]); story.lore.push({ key: 'post_kopfhoerer', title: 'Kopfhörer', html: 'Kopfhörer. Im Kofferraum.' }); }, 600); };
    photoWay[2] = () => { Audio.buzz(111, 3, 25); }; photoWay[5] = () => { setTimeout(() => Audio.play('woodSqueak1', { gain: .12, rate: .8, x: 40.6, y: 2, z: 78.8, ref: 2 }), 900); }; }
  if (typeof photoAfter !== 'undefined') { photoAfter[0] = () => subtitle('Brandschutz ist hier im Ort eher so ein Gefühl.', 3200, 'LUKE'); photoAfter[5] = null; photoAfter[2] = null; }
  if (typeof kidShadow !== 'undefined') kidShadow.visible = false; }
// Kinderschatten ohne Kind: nur ein Schatten auf der Asche im Lampenkegel (Abziehbild, tanzt), kein Körper
function post_roxySchatten() { const S = post_S; if (!S.schatten) { const m = new THREE.MeshBasicMaterial({ map: kirchberg_tex(kirchberg_cnv(128, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,.85)'; x.filter = 'blur(4px)'; x.beginPath(); x.arc(w / 2, 40, 18, 0, 7); x.fill(); x.fillRect(w / 2 - 16, 56, 32, 90); x.fillRect(w / 2 - 14, 144, 11, 90); x.fillRect(w / 2 + 3, 144, 11, 90); x.fillRect(w / 2 - 40, 70, 80, 12); })), transparent: true, depthWrite: false, opacity: 0 });
    S.schatten = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.8), m); S.schatten.rotation.x = -PI / 2; S.schatten.position.set(-13, .03, -9.6); S.schatten.userData.noCol = true; scene.add(S.schatten); }
  S.schattenT = 0; subtitle('Auf der Asche, im Licht der Lampe, tanzt ein Schatten. Ein Kinderschatten. Ohne Kind.', 4200); Audio.giggle(-13, .5, -10.2); if (typeof spannung_mark === 'function') try { spannung_mark('welt2'); } catch (e) {} }
function post_schattenTick(dt, t) { const S = post_S; if (!S.schatten || S.schattenT === undefined || S.schattenT < 0) return; S.schattenT += dt; const m = S.schatten.material;
  const hell = typeof flashOn !== 'undefined' && flashOn && Math.hypot(player.pos.x + 13, player.pos.z + 10) < 12; m.opacity += ((hell && S.schattenT < 7 ? .75 : 0) - m.opacity) * Math.min(1, dt * 3);
  S.schatten.rotation.z = Math.sin(t * 3.1) * .35; S.schatten.position.x = -13 + Math.sin(t * 1.7) * .25; S.schatten.scale.x = 1 + Math.sin(t * 5.3) * .12; if (S.schattenT > 9) { S.schattenT = -1; m.opacity = 0; } }

// ---------------------------------------------------------------------  „Elf Anrufe“ (Basis carScare, AP-15): Handschuhfach, falsch herum gemalter Kreispfeil auf der Heckscheibe, warmer Handabdruck
async function post_handschuhfach() { const S = post_S; kirchberg_start('car'); if (S.steps.hsf) return toast('Parkschein, Haargummi. Das Handschuhfach riecht nach Lucy.', 2600); S.steps.hsf = 1;
  modItem('lucy_zigaretten', 'Lucys Zigaretten', 'Drei fehlen. Menthol. Sie hat mal gesagt, sie hört auf.', 'paper'); addItem('lucy_zigaretten');
  openNote('Handschuhfach', 'Lucys Zigaretten, drei fehlen. Ein Parkschein von der Kreisstadt. Ein Haargummi mit zwei langen Haaren darin.', 'post_hsf'); post_save(); }
// nach dem Handy: Lukes Sätze; nach 25 Sekunden im Auto (bzw. an der offenen Tür) die Hupe (Stufe 3)
async function post_handy() { await wait(500); await say([['Elf Anrufe. Ich hab elf Anrufe weggedrückt, weil ich einen Podcast über Schlafhygiene geschnitten hab.', 5200, 'LUKE']]); await wait(700); await say([['Nach Hause. So hat sie nie geredet. Sie sagt heim.', 3200, 'LUKE']]);
  const S = post_S; S.autoT = 0; S.autoWart = true; }
// Kind auf dem Rücksitz (Silhouette im Rückspiegel): kniet mit dem Rücken zur Rückenlehne, Gesicht zur Heckscheibe, ein Arm erhoben (malt mit dem Finger), Ärmel quer gestreift – dunkel, kaum Licht
function post_kindBau() { const T = THREE, g = new T.Group(), dk = new T.MeshStandardMaterial({ color: 0x07080a, roughness: 1 }), tx = kirchberg_tex(kirchberg_cnv(64, 64, (x, w) => { x.fillStyle = '#0a0b0d'; x.fillRect(0, 0, w, w); x.fillStyle = '#2b3138'; for (let i = 0; i < 8; i++) x.fillRect(0, i * 8 + 2, w, 3); })), st = new T.MeshStandardMaterial({ map: tx, roughness: 1 });
  const part = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; };
  part(new T.CapsuleGeometry(.1, .24, 6, 12), st, 0, .38, 0); part(new T.SphereGeometry(.085, 14, 12), dk, 0, .66, .0); part(new T.CylinderGeometry(.03, .035, .05, 8), dk, 0, .59, 0); // Rumpf (gestreift), Kopf, Hals
  part(new T.CapsuleGeometry(.032, .2, 4, 8), st, .0, .66, .14, PI / 2 - .5, 0, 0); part(new T.CapsuleGeometry(.03, .18, 4, 8), dk, -.1, .46, .0, 0, 0, .35); // erhobener Arm zur Scheibe (gestreift), anderer Arm hängt
  part(new T.CapsuleGeometry(.045, .2, 4, 8), dk, 0, .12, -.07, PI / 2, 0, 0); // Unterschenkel unter dem Körper (kniend)
  g.traverse(m => { if (m.isMesh) { m.userData.noCol = true; m.castShadow = false; } }); g.userData.noCol = true; return g; }
async function post_autoSchreck() { const S = post_S; if (S.steps.nichtSie) return; S.steps.nichtSie = 1; if (typeof lenaCar === 'undefined') return; state.talking = true; const car = lenaCar;
  try { await wait(900); Audio.horn(car.position.x, car.position.z); shake = .04; glitchV = .3; // Hupe, lang
    Audio.play('carDoor', { gain: .6, x: car.position.x, y: 1, z: car.position.z, ref: 3 }); Audio.play('switch2', { gain: .3, rate: .7, delay: .3, x: car.position.x, y: 1, z: car.position.z, ref: 2 }); if (typeof carLight !== 'undefined') carLight.intensity = 0; // Türen verriegeln, Innenlicht aus
    await wait(1400); subtitle('Im Rückspiegel: ein Kind auf dem Rücksitz. Gesicht im Schatten, ein gestreifter Ärmel. Es malt mit dem Finger auf die beschlagene Heckscheibe.', 5600); if (S.kind) { S.kind.visible = true; setTimeout(() => { S.kind.visible = false; }, 4200); }
    for (let i = 0; i < 4; i++) setTimeout(() => Audio.play('scrape1', { gain: .05, rate: 2.2, x: car.position.x, y: 1.1, z: car.position.z, ref: 1 }), 900 + i * 450);
    await wait(3000); S.nichtSie.visible = true; await wait(2200); subtitle('Du drehst dich um. Leer.', 2400); await wait(1800);
    Audio.play('switch1', { gain: .3, rate: .8, x: car.position.x, y: 1, z: car.position.z, ref: 2 }); S.hand.visible = true; subtitle('Die Türen entriegeln. Im Kunstleder ein kleiner Handabdruck. Noch warm.', 4200);
    if (typeof spannung_mark === 'function') try { spannung_mark('peak3'); } catch (e) {}
  } finally { state.talking = false; } kirchberg_fertig('car', 'Lucy wollte weg, rief elfmal an und rannte zu Hilde. Wer am 31. schrieb, sagt „nach Hause“.'); post_save(); }
function post_autoBau() { const S = post_S; if (typeof lenaCar === 'undefined') return; const car = lenaCar;
  // R-1 (Story-Prüfung): statt „NICHT SIE“ Lucys blauer Kreispfeil, falsch herum (der Pfeil zeigt in den Kreis zurück) – mit dem Finger in den Beschlag der Heckscheibe
  const t = kirchberg_tex(kirchberg_cnv(512, 160, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(200,210,215,.28)'; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'destination-out'; x.strokeStyle = '#000'; x.lineWidth = 15; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.arc(w / 2 - 50, 80, 44, .35, PI * 2 - .35); x.stroke(); x.beginPath(); x.moveTo(w / 2 + 120, 80); x.lineTo(w / 2 + 6, 80); x.stroke(); x.beginPath(); x.moveTo(w / 2 + 34, 56); x.lineTo(w / 2 + 6, 80); x.lineTo(w / 2 + 34, 104); x.stroke(); x.globalCompositeOperation = 'source-over'; x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 2; for (let i = 0; i < 20; i++) { const px = rand(0, w); x.beginPath(); x.moveTo(px, 116); x.lineTo(px + rand(-3, 3), 116 + rand(10, 40)); x.stroke(); } }));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.95, .3), new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: .2 })); m.position.set(2.05, 1.05, 0); m.rotation.set(0, PI / 2, 0); m.rotation.x = -.35; m.visible = false; m.userData.noCol = true; car.add(m); S.nichtSie = m;
  const h = new THREE.Mesh(new THREE.PlaneGeometry(.12, .15), new THREE.MeshStandardMaterial({ map: kirchberg_tex(kirchberg_cnv(64, 80, (x, w, hh) => { x.clearRect(0, 0, w, hh); if (echt_hand(x, 32, 42, 76, 'rgb(40,30,25)', .5, 0, false, 'trocken')) return; x.fillStyle = 'rgba(40,30,25,.35)'; x.filter = 'blur(2px)'; x.beginPath(); x.ellipse(32, 52, 14, 18, 0, 0, 7); x.fill(); for (let f = 0; f < 5; f++) { x.beginPath(); x.ellipse(14 + f * 9, 26 - Math.abs(f - 2) * 4, 3.5, 11, (f - 2) * .15, 0, 7); x.fill(); } })), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
  h.position.set(.55, .515, .1); h.rotation.x = -PI / 2; h.visible = false; h.userData.noCol = true; car.add(h); S.hand = h; // 09.10.: auf der Rücksitzbank der Fab-Limousine (Sitzfläche x .28…74, Lehne ab x .7, Oberkante y .5)
  S.hsfHit = box(.35, .28, .5, -.45, .72, -.38, hidden, { cast: false, parent: car }); S.hsfHit.userData.noCol = true; interact(S.hsfHit, 'Handschuhfach', () => post_handschuhfach());
  { const kd = post_kindBau(); kd.position.set(.55, .5, 0); kd.rotation.y = PI / 2; kd.visible = false; car.add(kd); S.kind = kd; } // Rücksitz
  S.nichtSie.visible = !!S.steps.nichtSie; S.hand.visible = !!S.steps.nichtSie; }

// ---------------------------------------------------------------------  Speicherstand, Laden, Takt
function post_save() { if (typeof saveGame === 'function' && state.started && !state.ending) try { saveGame(curChapter()); } catch (e) {} }
MOD_SAVE.push(['post', () => ({ steps: post_S.steps, sz: post_S.sz === 'laeuft' || post_S.sz === 'telefon' ? 'fertig' : post_S.sz, meld: post_S.meld, weg: null, briefe: [] }),
  v => { const S = post_S; if (!v || typeof v !== 'object') return; Object.assign(S.steps, v.steps || {}); S.sz = v.sz === 'fertig' ? 'fertig' : 'aus'; S.meld = v.meld || 0; S.nachLaden = true; }]);
WORLD_MODS.push(['Post (Günther Maas, Schuppen, Nr. 9)', async () => { const S = post_S;
  try { await post_schuppenAussen(); } catch (e) { console.warn('Post: Schuppen', e); }
  try { await post_schuppenInnen(); } catch (e) { console.warn('Post: Schuppen innen', e); }
  try { await post_postenBau(); await post_nr9Bau(); } catch (e) { console.warn('Post: Nr. 9', e); }
  try { post_kerzen(); post_autoBau(); post_kartenBau(); } catch (e) { console.warn('Post: Kerzen/Auto/Karten', e); }
  if (typeof booth !== 'undefined' && booth.phone) { const alt = booth.phone.userData.action; booth.phone.userData.action = () => kap() === 1 ? post_anruf() : alt && alt(); }
  try { S.bike = await post_radBau(); const g = new THREE.Group(); g.add(S.bike.root); g.visible = false; g.userData.noCol = true; scene.add(g); S.ride = { g, bike: S.bike.root, v: 0, vWant: 0, lean: 0, fuss: 1, theta: 0, gy: 0, gyT: 0, path: null, fahrer: false };
    S.F = await post_figurBau(); if (S.F) { g.add(S.F.g); S.F.g.visible = true; // auf den Sattel: Hüfte auf Sattelhöhe, etwas hinter der Sattelmitte
      S.F.g.position.set(0, S.bike.sattel.y - S.F.hipY + .08, S.bike.sattel.z - .08); } try { await renderer.compileAsync(g, camera, scene); } catch (e) {} } catch (e) { console.warn('Post: Günther/Rad', e); }
  S.ready = true; window.__post = { S, szene: post_szene, fenster: post_durchsFenster, blatt: post_blatt212, zettel: post_meldezettel, auto: post_autoSchreck, fahr: post_fahrZu }; }]); // Testzugriff
WORLD_TICK.push((dt, t) => { const S = post_S; if (!S.ready) return; S.t += dt;
  if (S.nachLaden && state.started) { S.nachLaden = false; if (S.nichtSie) { S.nichtSie.visible = !!S.steps.nichtSie; S.hand.visible = !!S.steps.nichtSie; } if (S.k17 && S.steps.karte17) { S.k17.visible = false; kirchberg_an(S.k17Hit, false); } }
  if (S.ride) { post_rideTick(dt); post_telefonTick(dt); }
  if ((S.chk = (S.chk || 0) - dt) < 0) { S.chk = .5; if (S.ride && S.F && post_bereit()) post_szene(); }
  post_papierTick(dt); post_objektivTick(dt); post_schattenTick(dt, t);
  if (S.autoWart && typeof lenaCar !== 'undefined') { const d = Math.hypot(player.pos.x - lenaCar.position.x, player.pos.z - lenaCar.position.z); if (d < 3.4) S.autoT += dt; if (S.autoT > 25 && !state.talking && !ui.overlay) { S.autoWart = false; post_autoSchreck(); } }
  // Neonröhre im Schuppen flackert, wenn jemand vor der Tür steht (Beobachter-Regel; Luke zählt auch)
  if (S.roehre) { const d = Math.hypot(player.pos.x - 101.6, player.pos.z + 26.5); const soll = d < 3.2 ? (Math.random() < .12 ? 0 : .9 + Math.random() * .5) : 0; S.roehre.emissiveIntensity += (soll - S.roehre.emissiveIntensity) * Math.min(1, dt * (soll ? 18 : 6)); }
  if (S.led) S.led.material.opacity = .6 + Math.sin(t * 2.2) * .35;
  kirchberg_an(S.meldHit, (S.meld || 0) >= 1 || kap() === 1); });
// Meldezettel 1 liegt von Anfang an im Kasten (Günther war schon am 4.11. da); Zettel 2 nach der Szene
post_S.meld = 1;

// ---------------------------------------------------------------------  „Da unten ist nicht Lucy“ (Telefonzelle, Basis-Hörer in Kap. 1 neu belegt)
async function post_anruf() { if (state.talking) return; if (!state.ringing) { state.talking = true; handset(true); await wait(1400); toast('Tot. Kein Freizeichen.'); await wait(900); handset(false); state.talking = false; return; }
  state.talking = true; state.ringing = false; state.callDone = true; handset(true); kirchberg_start('call', { x: 8, z: 7.6 });
  try { await say([['Telefon mit Kabel. Wie Fahrradfahren. Nur dass das Fahrrad redet.', 3200, 'LUKE']]); await wait(500); await say([['*Rauschen*', 1400], ['„Geh nicht in den Keller.“', 2400, 'DAS KIND'], ['„Da unten ist nicht Lucy.“', 2600, 'DAS KIND']]);
    const a = await kirchberg_wahl(['„Wer ist da?“', '„Lucy?“', '(Schweigen.)']);
    if (a === 0) await say([['„Ich darf nicht lange. Sie guckt gleich.“', 2800, 'DAS KIND']]); else if (a === 1) await say([['„Nein. Die hat sich versteckt. Richtig gut.“', 3000, 'DAS KIND']]); else { Audio.whisper(8, 1.5, 7.6, 1.8); await wait(1800); await say([['„Pass auf sie auf.“', 2200, 'DAS KIND']]); }
    Audio.play('switch2', { gain: .3, rate: 1.3 }); await wait(700); await say([['Keine Musik drunter. Nur Rauschen.', 2600, 'LUKE']]); await wait(600); await say([['Die Stimme kenn ich. Ich weiß bloß nicht, woher. Das ist schlimmer.', 4000, 'LUKE']]);
  } finally { handset(false); state.talking = false; }
  // ∴ innen auf dem beschlagenen Glas, in Kinderhöhe (S-03); die Gestalt in der Scheibe (Basis scareDoppel: bewegt sich wie Luke, ohne Gesicht, zwei zu helle Augen)
  if (typeof beob_spur === 'function' && !post_S.steps.zelleSpur) { post_S.steps.zelleSpur = 1; beob_spur('beschlag', { pos: [8, 1.02, 8.02], ry: 0, w: .22, h: .22, k: [1] }); }
  setTimeout(() => armBehind(8, 0, 'doppel'), 400);
  if (!story.lore.some(l => l.key === 'call_zwei')) story.lore.push({ key: 'call_zwei', title: 'Zwei Stimmen', html: '„Geh nicht in den Keller. Da unten ist nicht Lucy.“ Keine Spieluhr darunter. Die Stimme kenn ich. Ich weiß nicht, woher.' });
  kirchberg_fertig('call', 'Eine Kinderstimme ohne Spieluhr: „Da unten ist nicht Lucy.“ Die Stimme kennst du. Woher, weißt du nicht.'); post_save(); }
// ---------------------------------------------------------------------  „Sind sie wieder da?“ (Nr. 2): 16 Karten im Kasten + die 17. im Gras, nach Poststempel ordnen
const POST_KARTEN = [['Kiel', 2010, 'Leuchtturm', 'Liebe Heidi, wir sind jetzt am Meer.'], ['Kiel', 2011, 'Fähre', 'Mama sagt, ich darf dir nicht schreiben. Ich schreib trotzdem.'], ['Neumünster', 2012, 'Holstenhallen', 'Ich träum von der Wiese. Da ist immer dieselbe Uhrzeit.'],
  ['Hamburg', 2013, 'Michel', 'Jonas wohnt jetzt hier, sagt man. Ich hab ihn nicht gesucht.'], ['Lüneburg', 2014, 'Salzsiederei', 'Ich hab den Lampion noch.'], ['Celle', 2015, 'Schloss', ''], ['Hannover', 2016, 'Neues Rathaus', 'Ich hab mir die Haare geschnitten. Du hättest geheult.'],
  ['Hildesheim', 2017, 'Dom', '(die Schrift ist fester)'], ['Göttingen', 2018, 'Gänseliesel', 'Ich studier jetzt. Ich weiß nicht mal, wieso hier.'], ['Göttingen', 2019, 'dieselbe Gänseliesel', ''], ['Northeim', 2020, 'Fachwerk', 'Es zieht, Heidi. Wie am Ärmel.'],
  ['Kassel', 2021, 'Herkules', 'Mein Zimmer hat Blick nach Süden. Warum Süden?'], ['Kassel', 2022, 'Wilhelmshöhe', ''], ['Bad Hersfeld', 2023, 'Stiftsruine', 'Die Laternen, sind die noch an?'], ['Kreisstadt', 2024, 'Marktplatz', 'Ich fahr jeden Tag an eurem Schild vorbei. Ich hab nicht angehalten.'],
  ['Kreisstadt', 2025, 'die Kreuzung, Sommer', ''], ['Kreisstadt, 23.10.', 2026, 'Kapelle St. Martin, Lost Eyengless', '']];
function post_kartenOffen() { const S = post_S; kirchberg_start('k1_karten', { x: -51.5, z: 6.7 }); if (S.steps.karten) return toast('Siebzehn Karten, geordnet. Die Stempel kommen jedes Jahr ein Stück näher.', 3200);
  const hat17 = S.steps.karte17, ab = hat17 && S.steps.k16 ? 16 : 0, ende = hat17 ? 17 : 16, liste = POST_KARTEN.slice(ab, ende).map((k, i) => ({ k, i: i + ab })).sort(() => Math.random() - .5); let next = ab; // QA K1/2: sind die ersten sechzehn schon geordnet (k16), muss nur noch die siebzehnte einsortiert werden
  openPuzzle(`<h3>SIND SIE WIEDER DA?</h3><p>${hat17 ? 'Siebzehn' : 'Sechzehn'} Karten, alle an „Heidi W., 8 Jahre, Ahornstraße 2“. Leg sie nach dem Poststempel, die älteste zuerst.</p><div id="pkK" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:680px"></div><p class="small" id="pkT">${hat17 ? (ab ? 'Sechzehn liegen schon geordnet. Nur die letzte fehlt noch.' : '') : 'Eine fehlt. Im Kasten waren sechzehn.'}</p>`, bx => {
    const K = bx.querySelector('#pkK'); for (const { k, i } of liste) { const b = document.createElement('button'); b.style.cssText = 'font:15px Georgia;padding:6px 8px;min-width:120px;background:#e8e0c8;color:#2a2418;border:1px solid #8a7a5a;transform:rotate(' + (Math.random() * 4 - 2).toFixed(1) + 'deg)';
      b.innerHTML = `<b>${k[0]}</b><br><small>${k[2]}</small><br><small>Stempel ${k[1]}</small>`; b.onclick = e => { e.stopPropagation(); if (i !== next) { Audio.beep(false); b.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], 240); return; }
        Audio.paper(); b.disabled = true; b.style.opacity = .45; b.innerHTML += `<br><span class="hand" style="font-size:15px">${k[3] || '–'}</span><br><small>${k[1]} · Sind sie wieder da?</small>`; next++;
        if (next >= ende) { if (hat17) setTimeout(() => { closeOverlay(); post_kartenFertig(); }, 1400); else { S.steps.k16 = 1; post_save(); bx.querySelector('#pkT').textContent = 'Sechzehn geordnet. Eine fehlt noch. Die letzte liegt irgendwo draußen.'; } } }; K.appendChild(b); } }); }
async function post_kartenFertig() { const S = post_S; S.steps.karten = 1; await say([['Sie schreibt an sich selbst. An die mit acht.', 3000, 'LUKE']]); await wait(800); await say([['Und kommt jedes Jahr ein Stück näher und will’s nicht.', 3400, 'LUKE']]);
  // Schreck Stufe 2: die Schaukel bleibt am höchsten Punkt stehen, eine Sekunde, dann fällt sie zurück und schwingt nicht mehr
  if (typeof leben_S !== 'undefined' && typeof swing !== 'undefined' && swing.piv) { leben_S.swingHold = { t: 0, dur: 1.2, a: 1.05 }; setTimeout(() => { leben_S.swingHold = { t: 0, dur: 1e9, a: 0 }; Audio.play('woodSqueak2', { gain: .15, rate: .7, x: swing.x || -58.8, y: 2, z: swing.z || 10.2, ref: 2 }); }, 1500); }
  if (!story.lore.some(l => l.key === 'post_heidi')) story.lore.push({ key: 'post_heidi', title: 'Heidi', html: 'Siebzehn Karten, alle an sich selbst, an die mit acht. Kiel, Neumünster, Hamburg … Kassel, Bad Hersfeld, Kreisstadt. Jedes Jahr ein Stück näher. Die letzte: Kapelle St. Martin, Lost Eyengless.' });
  kirchberg_fertig('k1_karten', 'Wer drin war, den zieht es zurück. Die Stempel laufen auf Lost Eyengless zu.'); post_save(); }
function post_kartenBau() { const S = post_S;
  // 16 Karten im Kasten: Klick auf den Briefkasten von Nr. 2 (strasse.js) in Kap. 1 neu belegt
  const ziel = new THREE.Vector3(-51.45, 1.1, 6.72); let best = null, bd = 1.2; for (const m of interactables) { const p = m.getWorldPosition(new THREE.Vector3()); const d = p.distanceTo(ziel); if (d < bd) { bd = d; best = m; } }
  if (best) { const alt = best.userData.action; best.userData.label = () => kap() === 1 ? 'Briefkasten (quillt über)' : 'Briefkasten'; best.userData.action = () => kap() === 1 ? post_kartenOffen() : alt && alt(); S.mb2 = best; }
  // die 17. Karte im Gras (Stempel Kreisstadt, 23.10., Kapelle St. Martin)
  const k = kirchberg_decal(kirchberg_papier({ w: 256, h: 176, bg: '#e8e2d0', zeilen: [['Heidi W., 8 Jahre', 20, 70, 26], ['Ahornstraße 2', 20, 104, 24]], fn: x => { x.strokeStyle = '#6a2a2a'; x.lineWidth = 3; x.beginPath(); x.arc(206, 42, 26, 0, 7); x.stroke(); x.fillStyle = '#6a2a2a'; x.font = '11px Arial'; x.fillText('23.10.26', 186, 46); } }), .15, .1, -53.4, .035, 9.4, 0, { rx: -PI / 2, rz: .6 });
  for (const [x, z, rz, w] of [[-53.05, 9.05, 2.1, 0], [-53.95, 9.75, -.7, 1], [-52.65, 9.95, 1.2, 2]]) { const m = kirchberg_decal(kirchberg_papier({ w: 256, h: 176, bg: '#e2dcc8', flecken: 3, zeilen: [['Heidi W., 8 Jahre', 20, 70, 26], ['Ahornstraße 2', 20, 104, 24]], fn: (x2, w2) => { x2.strokeStyle = '#6a2a2a'; x2.lineWidth = 3; x2.beginPath(); x2.arc(206, 42, 26, 0, 7); x2.stroke(); } }), .15, .1, x, .03, z, 0, { rx: -PI / 2, rz }); m.material.color.setRGB(.85, .85, .8); } // weitere Karten, aus dem überquellenden Kasten ins Gras gerutscht
  S.k17 = k; S.k17Hit = kirchberg_hit(.4, .2, .4, -53.4, .1, 9.4, 'Eine Postkarte im Gras', () => { S.steps.karte17 = 1; k.visible = false; kirchberg_an(S.k17Hit, false); Audio.paper(); toast('Eine Postkarte, aufgeweicht. Stempel: Kreisstadt, 23.10.2026. Vorn: die Kapelle St. Martin.', 4200); kirchberg_start('k1_karten', { x: -51.5, z: 6.7 }); post_save(); }); }
