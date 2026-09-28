// =====================================================================  ANWESEN (Modul „anwesen“): Die Villa Seiler – acht Schlüsselteile, die Prägepresse, Kapitel 4
// Die Villa (Mansion-Scan aus dem Unreal/Fab-Paket, Modul ausbau_ost_west) ist von Anfang an sichtbar und erreichbar, aber verschlossen:
// Die Tür hat acht Schlüssellöcher. Dr. Theodor Seiler, der 1958 das Amt gründete und 2019 allein in dieser Villa starb, hat die acht Teile
// dort versteckt, wo sich die Kinder früher versteckt haben (gestempelt 01–08 wie die acht Akten). Kapitel 1 und 3 (Ort), Kapitel 2 (Amt), Kapitel 3 (Vegas, Whiskey).
// Die Prägepresse im Garten setzt sie zusammen – aber nur mit Strom, und der ist seit dem Licht die ganze Nacht weg. Er kommt am Morgen zurück: Kapitel 4.
// Verpasste Teile hat in Kapitel 4 der Rabe Whiskey in seinem Nest gesammelt (nie blockierend).
const anwesen_S = { ready: false, ch4: false, key: false, open: false, sockets: [], lock: [], wheel: null, nestParts: null, hall: null, seen: new Set(), endArmed: false, t: 0, faceT: 30, face: null, flick: null };
const ANW_HALL = { x: -900, z: 900, w: 14, d: 12, h: 6.4 };
const ANW_TEILE = [ // Stempel, Name, Ort (für das Tagebuch), Kapitel-Bereich
  ['01', 'Reide, linke Hälfte', 'Brunnen in den Schrebergärten', 'ort'], ['02', 'Reide, rechte Hälfte', 'Vogelscheuche im Gemüsebeet', 'ort'],
  ['03', 'Halm, oben', 'Spielplatz, an der Rutsche', 'ort'], ['04', 'Halm, unten', 'Kellerfenster der Villa', 'ort'],
  ['05', 'Bart, erster Zahn', 'Amt, Gang unter dem Regal', 'amt'], ['06', 'Bart, zweiter Zahn', 'Lars Vegas', 'kap3'],
  ['07', 'Bart, dritter Zahn', 'Whiskeys Nest', 'kap3'], ['08', 'Schließkern', 'Messraum, Stuhl 8', 'amt']];
const anwesen_has = i => story.lore.some(l => l.key === 'anw_teil_' + i);
const anwesen_in = i => story.lore.some(l => l.key === 'anw_slot_' + i);
const anwesen_count = () => ANW_TEILE.filter((_, i) => anwesen_has(i)).length;
function anwesen_give(i, text) {
  if (anwesen_has(i)) return false; const [n, name] = ANW_TEILE[i];
  story.lore.push({ key: 'anw_teil_' + i, title: 'Schlüsselteil ' + n, html: text + `\n\n<b>${name}</b>. Eingeschlagen: <b>${n}</b> – und ein Turm über einem Abgrund.` });
  const c = anwesen_count(); modItem('schluesselteile', 'Schlüsselteile', `Geschmiedete Teile eines großen Schlüssels, gestempelt 01–08. Gefunden: ${c} / 8.`, 'key'); addItem('schluesselteile');
  try { ITEMS.schluesselteile.desc = `Geschmiedete Teile eines großen Schlüssels, gestempelt 01–08. Gefunden: ${c} / 8.`; } catch (e) {}
  sideStart('anw_teile'); story.side.anw_teile.desc = `Die Tür der Villa Seiler hat acht Schlüssellöcher. Teile gefunden: ${c} / 8.` + (c < 8 ? '' : ' Die Presse im Garten fügt sie zusammen.');
  openNote('Schlüsselteil ' + n, text + `\n\n<b>${name}</b>. Eingeschlagen: <b>${n}</b> – und ein Turm über einem Abgrund.`);
  Audio.play('metalHit1', { gain: .25, rate: 1.6 }); questPop('SCHLÜSSELTEIL ' + c + ' / 8', name);
  if (typeof gedanke === 'function' && c === 1) gedanke('anw_erstes', 'Ein Stempel. Turm über Abgrund. Derselbe wie auf dem Blech … Und die Villa hat acht Schlösser. Das ist kein Zufall.', 1500, 3);
  if (typeof saveGame === 'function') saveGame(anwesen_S.ch4 ? 4 : ch3.on ? 3 : ch2.on ? 2 : 1); return true;
}
// Kleines geschmiedetes Teil (für sichtbare Fundstellen); Unreal-Export „schluesselteil“ ersetzt es
function anwesen_partMesh(mat) {
  const g = new THREE.Group(), a = new THREE.Mesh(new THREE.TorusGeometry(.045, .012, 8, 18, 3.6), mat), b = new THREE.Mesh(new THREE.BoxGeometry(.11, .018, .018), mat);
  b.position.x = .08; g.add(a, b); g.traverse(m => { if (m.isMesh) m.castShadow = true; }); g.userData.noCol = true; return g;
}
// Vorhandene Interaktion eines anderen Moduls erweitern (Label + Aktion), gefunden über Label und Nähe
function anwesen_wrap(label, x, z, fn) {
  const m = interactables.find(o => o.userData.label === label && Math.hypot(o.position.x - x, o.position.z - z) < 2.5); if (!m) { console.warn('Anwesen: nicht gefunden', label); return null; }
  const orig = m.userData.action; fn(m, orig); return m;
}
WORLD_MODS.push(['Anwesen', async () => {
  const S = anwesen_S, OW = ausbau_ost_west_OW, T = THREE, X = C2.x, Z = C2.z;
  story.side.anw_teile = { title: 'Acht Schlösser', desc: 'Die Tür der Villa Seiler hat acht Schlüssellöcher.', state: 'hidden' };
  const rust = msSurfMat('rust_sheet', { tint: 0x7a6a5e }); rust.metalness = .55; rust.roughness = .75;
  const iron = new T.MeshStandardMaterial({ color: 0x2a2826, roughness: .5, metalness: .85 });
  const ue = await ausruestung_ue('schluesselteil', .16), partMesh = () => ue ? ue.clone(true) : anwesen_partMesh(rust);
  const reg = (i, x, y, z) => { if (typeof hintAdd === 'function') hintAdd({ id: 'anw_teil_' + i, x, y, z, kind: 'teil', near: 14, open: () => !anwesen_has(i) }); };
  // --- 01 Brunnen (Schrebergärten): der Kiesel schlägt nie auf. Wer wiederkommt, zieht die Kette hoch.
  anwesen_wrap('Brunnen', -108, 35.5, (m, orig) => { let first = true;
    m.userData.label = () => anwesen_has(0) ? 'Brunnen' : first ? 'Brunnen' : 'Brunnen · Kette hochziehen';
    m.userData.action = () => { if (first || anwesen_has(0)) { first = false; return orig(); }
      Audio.chains(-108, .5, 35.5); setTimeout(() => anwesen_give(0, 'Du ziehst an der Kette. Sie kommt hoch, Glied um Glied – viel zu lang für diesen Brunnen. Am Ende hängt kein Eimer. Ein Stück Eisen, mit einem roten Kinderhaarband festgeknotet.'), 1400); }; });
  reg(0, -108, 0, 35.5);
  // --- 02 Vogelscheuche (Parzelle W2): Brust mit Draht zugenäht → Drahtschneider
  anwesen_wrap('Vogelscheuche', -121.2, 24.8, (m, orig) => {
    m.userData.label = () => OW.q && OW.q.jacket && !anwesen_has(1) ? 'Vogelscheuche · Brust abtasten' : 'Vogelscheuche';
    m.userData.action = () => { if (!OW.q || !OW.q.jacket || anwesen_has(1)) return orig();
      if (!story.items.includes('drahtschneider')) return toast('Unter der Jacke ist etwas Hartes. Die Brust ist mit Draht zugenäht – eng, sorgfältig. Mit bloßen Händen keine Chance.', 4400);
      Audio.play('metalHit2', { gain: .2, rate: 1.8 }); anwesen_give(1, 'Du schneidest den Draht auf. Stroh quillt heraus, trocken, obwohl es seit Stunden regnet. Mittendrin, wo ein Herz wäre: ein Stück Eisen, geformt wie ein halber Ring.'); }; });
  reg(1, -121.2, 0, 24.8);
  // --- 03 Spielplatz: aufgewühlter Sand am Ende der Rutsche
  { const hit = box(.8, .3, .6, 24.3, .12, 74.15, hidden, { cast: false }); const glint = partMesh(); glint.position.set(24.35, .02, 74.1); glint.rotation.set(-PI / 2, 0, .6); glint.scale.setScalar(.8); scene.add(glint);
    interact(hit, () => anwesen_has(2) ? 'Sand' : 'Aufgewühlter Sand', () => { if (anwesen_has(2)) return toast('Nur Sand. Und die Mulde, die deine Hände gegraben haben.', 2600);
      glint.visible = false; Audio.step('grass'); anwesen_give(2, 'Du gräbst mit den Fingern. Unter dem Sand ein flacher Stein, darunter, in Wachstuch gewickelt, ein Stück geschmiedetes Eisen. Vergraben, wie Kinder Schätze vergraben – mit einem Stein obendrauf, damit man die Stelle wiederfindet.'); }); reg(2, 24.3, 0, 74.15); }
  // --- 04 Kellerfenster der Villa (Ostseite, hinter dem Tor): Gitter festgerostet → Brechstange
  const vb = OW.vbb || new T.Box3(new T.Vector3(-133.5, 0, 61.3), new T.Vector3(-116.5, 16, 78.7)), kx = vb.max.x + .2, kz = (vb.min.z + vb.max.z) / 2;
  { const grate = box(.06, .5, .9, kx + .02, .3, kz, iron, { cast: true }); const shaft = box(.5, .02, .9, kx + .25, .02, kz, new T.MeshStandardMaterial({ color: 0x0a0908, roughness: 1 }), { cast: false });
    const hit = box(.5, .7, 1.1, kx + .2, .35, kz, hidden, { cast: false }); let open = false;
    interact(hit, () => anwesen_has(3) ? 'Kellerfenster' : 'Kellerfenster (Gitter)', () => { if (anwesen_has(3)) return toast('Der Lichtschacht ist leer. Aus dem Keller zieht kalte Luft – und es riecht nach Äther.', 3600);
      if (!open && !story.items.includes('brechstange')) return toast('Ein Kellerfenster, vergittert. Das Gitter ist festgerostet. Im Lichtschacht darunter liegt etwas zwischen dem Laub. Du kommst nicht heran.', 4600);
      if (!open) { open = true; Audio.play('metalHit2', { gain: .5, rate: .7, x: kx, y: .3, z: kz, ref: 3 }); tween(grate, { rz: -1.2 }, .6); }
      anwesen_give(3, 'Du hebelst das Gitter ab. Im Lichtschacht, zwischen nassem Laub und einem Kinderhandschuh: ein Eisenstück mit einer Nummer. Hinter der Scheibe, im dunklen Keller, fällt etwas um.'); }); reg(3, kx, 0, kz); shaft.userData.noCol = true; }
  // --- 05 Amt, Gang: unter dem umgestürzten Regal (Kapitel 2)
  { const hit = box(1.1, .3, .6, X + 87.6, .15, Z - 1.55, hidden, { cast: false }); const p = partMesh(); p.position.set(X + 87.7, .03, Z - 1.6); p.rotation.x = -PI / 2; scene.add(p);
    interact(hit, () => anwesen_has(4) ? 'Umgestürztes Regal' : 'Unter das Regal greifen', () => { if (anwesen_has(4)) return toast('Nur Staub und ein abgerissener Streifen Klebeband.', 2400);
      p.visible = false; anwesen_give(4, 'Du legst dich flach auf den Beton und greifst unter das Regal. Kalt. Metall. Mit Klebeband an die Unterseite geklebt – so, dass man es nur findet, wenn man sich hinlegt wie ein Kind beim Versteckspielen.'); }); reg(4, X + 87.6, 0, Z - 1.55); }
  // --- 08 Messraum: unter Stuhl 8, dem ohne Namen (Kapitel 2)
  { const hit = box(.6, .35, .5, X + 118.6, .28, Z + 4.55, hidden, { cast: false });
    interact(hit, () => anwesen_has(7) ? 'Stuhl 8' : 'Stuhl 8 · unter die Sitzfläche tasten', () => { if (anwesen_has(7)) return toast('Der Stuhl ohne Namen. Die Gurte sind offen.', 2400);
      anwesen_give(7, 'Unter der Sitzfläche von Stuhl 8, dem Stuhl ohne Namen, klebt etwas. Ein schweres Eisenstück, rund, mit einem Loch in der Mitte. Der Kern eines Schlosses.'); }); reg(7, X + 118.6, 0, Z + 4.55); }
  // --- 07 Whiskeys Nest: toter Baum hinter dem Friedhof (ab Kapitel 3; in Kapitel 4 sammelt er dort alles, was du übersehen hast)
  try { const tr = await msModel('deadtree1'); const t = msGround(msFit(tr.clone(true), 5.2, 'y')); t.position.set(-40, 0, 96); t.rotation.y = 1.1; scene.add(t);
    t.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    const bark = msSurfMat('bark', { tint: 0x5a4a3a }); const nest = new T.Group(); nest.position.set(-39.62, 1.95, 96.2); scene.add(nest);
    for (let k = 0; k < 14; k++) { const tw = new T.Mesh(new T.CylinderGeometry(.012, .008, .42, 5), bark); tw.position.set(Math.cos(k * 2.4) * .12, (k % 3) * .025, Math.sin(k * 2.4) * .12); tw.rotation.set(PI / 2 + rand(-.3, .3), k * .45, rand(-.4, .4)); nest.add(tw); }
    const glint = partMesh(); glint.position.set(0, .06, 0); glint.scale.setScalar(.7); nest.add(glint); nest.userData.noCol = true; S.nest = nest;
    const hit = box(.6, .5, .6, -39.62, 2.0, 96.2, hidden, { cast: false });
    interact(hit, () => S.ch4 && anwesen_count() < 8 ? 'Whiskeys Nest' : (ch3.on || S.ch4) && !anwesen_has(6) ? 'Nest in der Astgabel' : 'Nest', () => {
      if (S.ch4 && anwesen_count() < 8) { const miss = ANW_TEILE.map((_, i) => i).filter(i => !anwesen_has(i)); for (const i of miss) story.lore.push({ key: 'anw_teil_' + i, title: 'Schlüsselteil ' + ANW_TEILE[i][0], html: 'Aus Whiskeys Nest. Er hat es irgendwo aufgelesen, wo du nicht hingesehen hast.' });
        const c = anwesen_count(); modItem('schluesselteile', 'Schlüsselteile', `Geschmiedete Teile eines großen Schlüssels, gestempelt 01–08. Gefunden: ${c} / 8.`, 'key'); addItem('schluesselteile'); story.side.anw_teile.desc = 'Alle acht Teile. Die Presse im Garten der Villa fügt sie zusammen.';
        glint.visible = false; if (typeof whiskey_caw === 'function') whiskey_caw();
        return openNote('Whiskeys Nest', `Zweige, Draht, Stanniol. Und dazwischen alles, was glänzt: Kronkorken, ein Ehering, eine Kinderspange – und <b>${miss.length === 1 ? 'ein Schlüsselteil' : miss.length + ' Schlüsselteile'}</b>, gestempelt ${miss.map(i => ANW_TEILE[i][0]).join(', ')}.\n\nEr hat gesammelt, was du übersehen hast.`); }
      if (!ch3.on && !S.ch4) return toast('Ein Nest in der Astgabel. Leer. Groß – für einen sehr großen Vogel.', 2800);
      if (anwesen_has(6)) return toast('Kronkorken, Stanniol, eine Kinderspange. Whiskey sammelt, was glänzt.', 3000);
      glint.visible = false; anwesen_give(6, 'Zweige, Draht, Stanniol. Und dazwischen alles, was glänzt: Kronkorken, eine Kinderspange, ein Ehering – und ein Stück geschmiedetes Eisen. Whiskey sammelt, was glänzt. Oder was man ihm aufträgt.'); });
    reg(6, -39.62, 0, 96.2);
  } catch (e) { console.warn('Anwesen: Nest', e); }
  // --- 06 Lars Vegas (Kapitel 3): gibt das Teil durch den Briefschlitz, sobald du ihm drei Dinge geglaubt hast
  if (typeof albers_talk === 'function') albers_talk = (o => async (...a) => { const r = await o(...a);
    if (ch3.on && albers_S.talked.size >= 3 && !anwesen_has(5) && !state.talking) { state.talking = true;
      await say([['Die Klappe vom Briefschlitz geht auf. Etwas Schweres fällt auf die Fußmatte.', 3600], ['„Seiler, der Doktor. Hat mir das zwanzigachtzehn in die Hand gedrückt. ‚Für den, der fragt.‘“', 5200, 'VEGAS'], ['„Du fragst. Also nimm.“', 2600, 'VEGAS']]);
      state.talking = false; anwesen_give(5, 'Es lag in einem alten Tabaksbeutel, der nach Vegas riecht. Ein Stück Eisen mit drei Zähnen – nein, mit einem. Die anderen fehlen noch.'); }
    return r; })(albers_talk);
  // --- Die Prägepresse im Garten (Ostseite des Vorgartens, geschützt unter einem Blechdach)
  { const mx = -109.5, mz = 66, g = new T.Group(); g.position.set(mx, 0, mz); g.rotation.y = -PI / 2; scene.add(g); g.userData.noCol = true;
    const conc = msSurfMat('facade_concrete', { tint: 0x6a665e }), wood = msSurfMat('planks_painted', { tint: 0x5a4c3e }), roofM = msSurfMat('corrugated', { tint: 0x6e6a62 }); roofM.side = T.DoubleSide;
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
    add(new T.BoxGeometry(1.9, .5, 1.3), conc, 0, .25, 0); add(new T.CylinderGeometry(.44, .44, 1.3, 28), rust, 0, .98, -.05, 0, 0, PI / 2);
    add(new T.BoxGeometry(.5, .9, .5), rust, -.45, .95, .15); add(new T.BoxGeometry(.18, .6, .18), iron, .45, 1.55, -.05); add(new T.BoxGeometry(1.2, .08, .3), iron, .15, 1.88, -.05);
    const wheel = new T.Group(); wheel.position.set(1.0, .98, -.05); g.add(wheel); S.wheel = wheel;
    const rim = new T.Mesh(new T.TorusGeometry(.5, .045, 10, 36), iron); rim.rotation.y = PI / 2; wheel.add(rim);
    for (let k = 0; k < 6; k++) { const sp = new T.Mesh(new T.BoxGeometry(.03, .96, .03), iron); sp.rotation.x = k * PI / 6; wheel.add(sp); }
    const crank = new T.Mesh(new T.CylinderGeometry(.025, .025, .25, 8), wood); crank.position.set(.1, .38, 0); crank.rotation.z = PI / 2; wheel.add(crank);
    const plate = add(new T.BoxGeometry(.05, .5, .95), iron, -.72, .98, -.05);
    for (let k = 0; k < 8; k++) { const sm = new T.MeshStandardMaterial({ color: 0x151412, emissive: 0xffa040, emissiveIntensity: 0, roughness: .4, metalness: .6 });
      const s = add(new T.CylinderGeometry(.04, .04, .04, 12), sm, -.755, 1.1 - Math.floor(k / 4) * .22, -.38 + (k % 4) * .22, 0, 0, PI / 2); S.sockets.push(s); }
    const sign = new T.Mesh(new T.PlaneGeometry(.7, .16), new T.MeshStandardMaterial({ roughness: .6, metalness: .5, map: tex(cnv(256, (c, w) => { c.fillStyle = '#6a5a3a'; c.fillRect(0, 0, w, w); c.fillStyle = '#1a1510'; c.font = 'bold 26px Georgia'; c.textAlign = 'center'; c.fillText('SEILER · PRÄGEWERK · 1958', w / 2, 40); }), true) }));
    sign.material.map.repeat.set(1, .23); sign.material.map.offset.set(0, .77); sign.position.set(-.3, .38, .66); g.add(sign);
    for (const [px, pz] of [[-1.3, -1], [1.5, -1], [-1.3, 1], [1.5, 1]]) add(new T.CylinderGeometry(.06, .07, 2.5, 8), wood, px, 1.25, pz);
    add(new T.PlaneGeometry(3.4, 2.6), roofM, .1, 2.55, 0, -PI / 2 + .12);
    box(1.9, 1.7, 2.6, mx, .85, mz, hidden, { collide: true, cast: false });
    const L = new VLight(0xffb070, .0, 4, 2); L.position.set(mx, 1.6, mz); scene.add(L); S.pressLight = L;
    const hit = box(1.6, 1.4, 2.3, mx, .9, mz, hidden, { cast: false });
    interact(hit, () => S.key ? 'Prägepresse' : 'Prägepresse · Seiler & Sohn', () => anwesen_press());
    if (typeof hintAdd === 'function') hintAdd({ id: 'anw_presse', x: mx, y: 0, z: mz, kind: 'story', near: 60, open: () => S.ch4 && !S.key && anwesen_count() === 8 }); }
  // --- Die Tür: eine Eisenplatte mit acht Schlüssellöchern
  { const dz = vb.min.z - .04, plate = new T.Mesh(new T.PlaneGeometry(.46, .62), new T.MeshStandardMaterial({ color: 0x3a3632, roughness: .45, metalness: .8, map: tex(cnv(256, (c, w) => {
      c.fillStyle = '#6c665e'; c.fillRect(0, 0, w, w); c.fillStyle = '#0c0b0a'; for (let k = 0; k < 8; k++) { const x = 64 + (k % 2) * 128, y = 34 + Math.floor(k / 2) * 62; c.beginPath(); c.arc(x, y, 11, 0, 7); c.fill(); c.fillRect(x - 4, y, 8, 22); }
      c.strokeStyle = '#2a2622'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, w - 12); }), true) }));
    plate.position.set(-125, 1.42, dz); plate.rotation.y = PI; scene.add(plate);
    for (let k = 0; k < 8; k++) { const d = new T.Mesh(new T.CircleGeometry(.018, 12), new T.MeshBasicMaterial({ color: 0xffb060, transparent: true, opacity: 0 })); d.position.set(-125 + .115 - (k % 2) * .23, 1.42 + .235 - Math.floor(k / 2) * .145, dz - .004); d.rotation.y = PI; scene.add(d); S.lock.push(d); }
    const hit = box(1.6, 2.4, .5, -125, 1.2, dz - .2, hidden, { cast: false }); S.doorHit = hit;
    interact(hit, () => S.key ? 'Die Tür der Villa aufschließen' : 'Tür der Villa Seiler', () => anwesen_door()); }
  // --- Grusel: flackernde Kerze im Erdgeschoss, ein Gesicht am Fenster, eine Spieluhr hinter der Tür
  { const fl = new VLight(0xffa050, 0, 5, 2); fl.position.set(-129.7, 2.1, vb.min.z + .9); scene.add(fl); S.flick = fl;
    const face = new T.Mesh(new T.PlaneGeometry(.3, .36), new T.MeshBasicMaterial({ map: faceTexes.child, transparent: true, opacity: 0, color: new T.Color(.7, .72, .78), depthWrite: false }));
    face.position.set(-120.28, 2.05, vb.min.z - .03); face.rotation.y = PI; scene.add(face); S.face = face; }
  // --- Kapitel 4: Eingangshalle der Villa (eigener Innenraum; die Haustür führt hinein)
  await anwesen_buildHall();
  S.ready = true;
}]);
function anwesen_press() {
  const S = anwesen_S, have = ANW_TEILE.map((_, i) => i).filter(i => anwesen_has(i) && !anwesen_in(i));
  if (S.key) return toast('Die Presse steht still. Das Schwungrad ist noch warm.', 2600);
  if (have.length) { for (const i of have) story.lore.push({ key: 'anw_slot_' + i, title: 'Presse · ' + ANW_TEILE[i][0], html: 'Eingesetzt.' }); Audio.play('metalHit1', { gain: .3, rate: 1.2 }); }
  const n = ANW_TEILE.filter((_, i) => anwesen_in(i)).length; anwesen_sockets();
  if (n < 8) return toast(have.length ? `${have.length === 1 ? 'Das Teil passt' : 'Die Teile passen'} in die Fassungen – ${n} von 8 sitzen. Die anderen Fassungen sind leer.` : n ? `${n} von 8 Fassungen sind belegt. Die übrigen warten.` : 'Eine alte Prägepresse. Vorn acht leere Fassungen, nummeriert 01 bis 08. Auf dem Schild: SEILER · PRÄGEWERK · 1958.', 4200);
  if (!S.ch4) return toast('Alle acht Fassungen sind belegt. Du drehst am Schwungrad – nichts. Der Motor braucht Strom, und in ganz Lost Eyengless ist der Strom weg, seit das Licht kam.', 5200);
  S.key = true; state.talking = true; S.pressT = 4.5; Audio.powerUp(); shake = .02;
  modItem('villaschluessel', 'Schlüssel der Villa Seiler', 'Aus acht Teilen gepresst. Schwer, noch warm. Der Bart hat sieben Zähne und eine Lücke.', 'key');
  setTimeout(() => { Audio.play('metalHit2', { gain: .5, rate: .6 }); story.items = story.items.filter(k => k !== 'schluesselteile'); addItem('villaschluessel'); state.talking = false;
    sideDone('anw_teile', 'Acht Teile, ein Schlüssel. Die Tür der Villa wartet.'); setC3('Die Villa Seiler. Schließ die Tür auf.');
    subtitle('Die Presse stampft dreimal. Dann liegt da ein Schlüssel, so lang wie deine Hand. Sieben Zähne – und eine Lücke, wo der achte sein müsste.', 5600); }, 4200);
}
function anwesen_sockets() { const S = anwesen_S; S.sockets.forEach((s, i) => s.material.emissiveIntensity = anwesen_in(i) ? 2.2 : 0); S.lock.forEach((d, i) => d.material.opacity = S.key ? .9 : 0); }
function anwesen_door() {
  const S = anwesen_S; Audio.knock();
  if (S.open) return;
  if (!S.key) { const c = anwesen_count();
    if (!S.knocked) { S.knocked = true; setTimeout(() => { Audio.knock(); subtitle('<i>Von drinnen klopft es zurück. Dreimal. Dann, ganz leise, eine Spieluhr.</i>', 4200); if (Audio.musicBox) Audio.musicBox(); }, 1400); }
    sideStart('anw_teile'); return toast(`Kein Griff, kein Klingelschild. Eine Eisenplatte mit acht Schlüssellöchern.${c ? ` Du hast ${c} von 8 Teilen.` : ''} Wer hat eine Tür gebaut, die man nur zu acht öffnen kann?`, 5200); }
  if (!S.ch4) return;
  S.open = true; anwesen_sockets(); anwesen_enterHall();
}
// ---- Kapitel 4
const C4_INTRO = '<p class="on" style="font-family:Georgia;font-size:12px;letter-spacing:.4em;color:#c9a36a;margin-bottom:22px">KAPITEL 4 · DIE VILLA</p><p class="on">5. November 2026. Der Morgen nach dem Licht.</p><p class="on">Der Strom ist zurück. Die Laternen brennen, als wäre nichts gewesen.</p><p class="on">Lucy schläft bei Vegas auf dem Sofa. Er hat die ganze Nacht am Fenster gesessen und gezählt.</p><p class="on">Und am Westrand steht die Villa Seiler. Oben brennt noch immer das eine Fenster.</p><p class="on" style="font-family:Georgia;font-size:11px;letter-spacing:.35em;color:#8b7f68;margin-top:30px">KLICKEN ZUM WEITERSPIELEN</p>';
async function chapter4Begin() {
  const S = anwesen_S; if (S.ch4) return; S.ch4 = true; saveFlag('ch4');
  $('endcard').classList.remove('show'); ui.overlay = null; document.body.classList.remove('ov'); state.ending = false; state.talking = false;
  ch3.part = 'town'; ch3.lampsOff = true; ch3.chase = 'done'; ch3.met = true; hunt.on = false; grey.visible = false; if (justin && justin.g) justin.g.visible = false;
  state.zone = null; try { canalAtmo(false); } catch (e) {} Audio.hum(false); Audio.chaseMusic(false); Audio.setArea(false, false);
  lamps.forEach(L => { L.mode = 'on'; L.dead = 0; });
  { const OW = ausbau_ost_west_OW; if (!OW.gateOpen && OW.gate) { OW.gateOpen = true; if (OW.chain) OW.chain.visible = false; msHide(OW.gate); // wie im Tor-Code: Flügel an einem Scharnier, offen
    const pv = new THREE.Group(); pv.position.set(-127.3, 0, 57); pv.userData.noCol = true; const leaf = OW.gate.clone(true); leaf.visible = true; leaf.position.set(2.3, 0, 0); leaf.rotation.set(0, 0, 0); pv.add(leaf); pv.rotation.y = -1.2; OW.gate.parent.add(pv); } }
  player.pos.set(.8, 0, 1.6); player.yaw = PI / 2 + .6; player.pitch = .05; vel.set(0, 0, 0); camY = player.pos.y + 1.65; flashOn = true;
  $('fade').style.background = '#000'; $('fade').style.opacity = 1; await wait(300);
  $('intro').innerHTML = C4_INTRO; $('introSeq').classList.add('show'); $('fade').style.opacity = 0;
  $('introSeq').onclick = () => { $('introSeq').classList.remove('show'); $('introSeq').onclick = null; lockPointer();
    const c = anwesen_count(); setC3(c === 8 ? 'Die Villa Seiler. Die Presse im Garten fügt die acht Teile zusammen.' : `Die Villa Seiler. Dir fehlen noch ${8 - c} Schlüsselteile – frag den Raben.`);
    if (typeof gedanke === 'function') gedanke('ch4_start', 'Es ist vorbei. Oder? … Die Villa. Acht Schlösser. Ich will wissen, was Seiler da drin versteckt hat.', 1500, 3); };
  saveGame(4); anwesen_sockets(); if (typeof c3Info === 'function') c3Info();
}
async function startChapter4() { // Weiterspielen / Kapitel wählen
  $('subPanel').classList.remove('show'); menu.attract = false; state.started = true; document.body.classList.remove('menu'); $('start').classList.remove('show');
  chapter3Begin(); ch3.met = true; anwesen_S.ch4 = false; await chapter4Begin();
}
async function anwesen_enterHall() {
  const S = anwesen_S, H = ANW_HALL; state.talking = true; Audio.play('ironDoor', { gain: .5, rate: .7 }); Audio.creak(.3);
  for (let k = 0; k < 8; k++) setTimeout(() => Audio.play('metalHit1', { gain: .15, rate: 1.4 + k * .05 }), 300 + k * 180);
  await fade(1, 1200); player.pos.set(H.x, 0, H.z - H.d / 2 + 1.2); player.yaw = PI; player.pitch = 0; vel.set(0, 0, 0); camY = 1.65; if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0;
  Audio.setArea(true, false); await wait(300); await fade(0, 1200); state.talking = false; S.inHall = true; S.hallT = 0;
  setC3('Die Villa Seiler. Sieh dich um.');
  subtitle('<i>Hinter dir fällt die Tür ins Schloss. Acht Riegel. Einer nach dem anderen.</i>', 4200);
  story.lore.push({ key: 'anw_halle', title: 'Die Villa Seiler', html: 'Acht Teile, eine Presse, ein Schlüssel. Hinter der Tür: die Eingangshalle eines Hauses, in dem seit 2019 niemand mehr gewohnt hat. Oben brennt Licht.' });
}
async function anwesen_buildHall() {
  const S = anwesen_S, H = ANW_HALL, T = THREE, x0 = H.x - H.w / 2, x1 = H.x + H.w / 2, z0 = H.z - H.d / 2, z1 = H.z + H.d / 2;
  const wp = msSurfMat('wallpaper_old', { tint: 0x8a7c6c }); wp.userData.tile = 1.4; const fl = msSurfMat('floor_wood', { tint: 0x4a3626 }); fl.userData.tile = .9; fl.roughness = .5;
  const pl = msSurfMat('wall_plaster', { tint: 0x6a665e }); pl.userData.tile = 2; const dark = msSurfMat('planks_painted', { tint: 0x3a2e24 }); dark.userData.tile = 1;
  plane(H.w, H.d, H.x, .01, H.z, fl); box(H.w + .4, .2, H.d + .4, H.x, H.h + .1, H.z, pl, { cast: false });
  wall('x', z0, x0, x1, H.h, wp, [{ at: H.x, w: 1.6 }], .3); wall('x', z1, x0, x1, H.h, wp, [], .3); wall('z', x0, z0, z1, H.h, wp, [], .3); wall('z', x1, z0, z1, H.h, wp, [], .3);
  box(1.6, 2.62, .12, H.x, 1.31, z0 - .05, dark, { collide: true }); // Haustür (von innen zu)
  indoorRects.push({ x0, x1, zb: z0, zf: z1, y: 0 });
  // Treppe nach oben (eingebrochen): Stufen, auf halber Höhe zersplittert
  for (let k = 0; k < 9; k++) box(3, .2, .42, H.x, .1 + k * .2, z1 - 3.6 + k * .38, dark, { collide: k < 3 });
  box(3.4, 1.2, .5, H.x, .6, z1 - 3.9, hidden, { collide: true, cast: false });
  for (let k = 0; k < 5; k++) { const b = box(.14, .14, 2.6, H.x + rand(-1.2, 1.2), 1.9 + rand(-.3, .3), z1 - 2.2 + rand(-.5, .5), dark); b.rotation.set(rand(-.5, .5), rand(-1, 1), rand(-.6, .6)); }
  const put = async (key, file, size, axis, x, z, ry, y = 0) => { try { const m = await msModel(key, file); const o = msGround(msFit(m.clone(true), size, axis)); o.position.set(x, y, z); o.rotation.y = ry; o.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); scene.add(o); return o; } catch (e) { console.warn('Halle ' + key, e); return null; } };
  await put('wardrobe', 'model.gltf', 2.2, 'y', x0 + .6, H.z - 2.5, PI / 2); await put('wallclock', 'model.gltf', .9, 'y', x1 - .25, H.z + 1, -PI / 2, 1.5);
  await put('floorlamp', 'model.gltf', 1.7, 'y', x0 + .7, z1 - 1, .4); await put('floorlamp', 'model.gltf', 1.7, 'y', x1 - .7, z0 + 1.2, -.4);
  await put('shelf', 'model.gltf', 1.9, 'y', x1 - .35, H.z - 3.2, -PI / 2); await put('radio', 'model.gltf', .45, 'max', x1 - 1.4, z0 + 2.4, -PI / 2, .78);
  const desk = box(1.6, .76, .8, x1 - 1.4, .38, z0 + 2.4, dark, { collide: true });
  const letter = plane(.24, .32, x1 - 1.6, .77, z0 + 2.3, paperMat, -PI / 2, .3);
  const portrait = await put('frame_dmg', 'model.gltf', 1.2, 'y', x0 + .12, H.z + 1.5, PI / 2, 1.5);
  for (const [lx, lz] of [[x0 + .7, z1 - 1], [x1 - .7, z0 + 1.2]]) { const L = new VLight(0xffa860, 1.1, 7, 2); L.position.set(lx, 1.6, lz); scene.add(L); }
  const up = new VLight(0xfff0d8, .9, 9, 2); up.position.set(H.x, H.h - .6, z1 - 1.2); scene.add(up); S.upLight = up;
  // Seilers Brief, das Porträt, die Uhr – dann die Treppe
  interact(letter, 'Brief auf dem Schreibtisch', () => { S.seen.add('brief'); openNote('Ein Brief, März 2019', anwesen_hand('An den, der die acht Teile gefunden hat.\n\nIch habe 1958 das Amt gegründet. Ich habe Listen geschrieben, damit das Licht nur nimmt, wen wir ihm geben. Ich dachte, das sei Barmherzigkeit.\n\nDie Teile habe ich dorthin gebracht, wo sich die Kinder früher versteckt haben. Wer sie findet, hat hingesehen. Das hat keiner von uns.\n\nOben liegt, was ich nie jemandem zeigen konnte.\n— Dr. Theodor Seiler'), 'anw_brief'); });
  const ph = box(.2, 1.3, 1.1, x0 + .15, 1.5, H.z + 1.5, hidden, { cast: false });
  interact(ph, 'Porträt', () => { S.seen.add('bild'); openNote('Ein Porträt', 'Eine Frau in einem langen, dunklen Kleid. In der Hand eine Laterne, deren Flamme gerade steht. Das Bild ist alt, der Rahmen zerbrochen – aber die Farbe ist frisch, fast noch feucht.\n\nAuf dem Messingschild, fast blank gerieben: <b>„… IRA“</b>.\nAuf der Rückseite, mit Bleistift: <i>gemalt 2043</i>.', 'anw_bild'); });
  const ch = box(.3, .9, .9, x1 - .25, 1.95, H.z + 1, hidden, { cast: false }); interact(ch, 'Wanduhr', () => toast('Drei Uhr dreizehn. Die Zeiger stehen. Das Pendel schwingt.', 2600));
  const stairs = box(3, 2, .6, H.x, 1, z1 - 3.1, hidden, { cast: false });
  interact(stairs, 'Treppe nach oben', () => anwesen_hallEnd());
}
async function anwesen_hallEnd() {
  const S = anwesen_S; if (S.hallDone) return;
  if (S.seen.size < 2) return toast('Die Treppe ist auf halber Höhe eingebrochen. Oben brennt Licht. Irgendwo muss es einen anderen Weg geben – sieh dich erst hier unten um.', 4200);
  S.hallDone = true; state.talking = true;
  await say([['Über dir: Schritte. Kleine. Sie laufen einmal quer über den Flur und bleiben genau über der Treppe stehen.', 4600], ['Eine Spieluhr. Dieselbe Melodie wie in Lucys Zimmer.', 3400],
    ['Dann eine Frauenstimme. Ruhig. Sehr weit weg und ganz nah:', 3600], ['„Noch nicht, Luke. Aber bald.“', 3200, '?']]);
  if (Audio.musicBox) Audio.musicBox(); state.talking = false; saveGame(4);
  state.ending = true; Audio.hum(false); $('endcard').querySelector('h1').textContent = 'KAPITEL 4 · DIE VILLA';
  $('endcard').querySelector('p').innerHTML = 'Die Villa Seiler hat ihr erstes Geheimnis preisgegeben.<br>Oben brennt Licht. Jemand wartet dort – und kennt deinen Namen.';
  $('endStats').innerHTML = `SCHLÜSSELTEILE ${anwesen_count()} / 8 · FUNDE ${story.lore.length}`; $('endcard').querySelector('.next').textContent = 'HIGH ABYSS MIRA · KAPITEL 4 WIRD FORTGESETZT';
  const go = $('endcard').querySelector('.go'); go.style.display = ''; go.textContent = 'ZURÜCK ZUM HAUPTMENÜ'; go.onclick = () => location.reload();
  document.exitPointerLock(); ui.overlay = 'endcard'; $('endcard').classList.add('show'); document.body.classList.add('ov');
}
// Endkarte von Kapitel 3: zusätzlicher Knopf „Weiter · Kapitel 4“
c3Endcard = (o => (...a) => { o(...a); let b = $('endcard').querySelector('.go4');
  if (!b) { b = document.createElement('div'); b.className = 'go go4'; b.style.marginBottom = '18px'; $('endcard').querySelector('.go').before(b); }
  b.style.display = ''; b.textContent = ch3.choice === 'A' ? 'WEITER · KAPITEL 4 (setzt Ende B fort)' : 'WEITER · KAPITEL 4 · DIE VILLA';
  b.onclick = e => { e.stopPropagation(); b.style.display = 'none'; chapter4Begin(); }; })(c3Endcard);
WORLD_TICK.push((dt, t) => {
  const S = anwesen_S; if (!S.ready || !state.started) return; const P = player.pos;
  if (S.pressT > 0) { S.pressT -= dt; if (S.wheel) S.wheel.rotation.x += dt * 7; if (S.pressLight) S.pressLight.intensity = 1.2 + Math.random() * .6; if (S.pressT <= 0 && S.pressLight) S.pressLight.intensity = 0; }
  const dv = Math.hypot(P.x + 125, P.z - 66); if (dv > 45 || S.inHall) return;
  // flackernde Kerze hinter dem Fenster, die manchmal wandert
  if (S.flick) { S.fT = (S.fT || 0) - dt; if (S.fT < 0) { S.fT = rand(4, 11); S.flickOn = Math.random() < .6; } S.flick.intensity = S.flickOn ? .5 + Math.sin(t * 13) * .12 + Math.random() * .15 : Math.max(0, S.flick.intensity - dt); }
  // ein Kindergesicht am Fenster, nur wenn man gerade hinsieht, und nie länger als einen Atemzug
  if (S.face) { S.faceT -= dt; const f = S.face, d = Math.hypot(P.x - f.position.x, P.z - f.position.z);
    if (S.faceT < 0 && d > 7 && d < 28 && !state.talking) { camera.getWorldDirection(_anwFwd); const dx = f.position.x - camera.position.x, dz = f.position.z - camera.position.z, k = (_anwFwd.x * dx + _anwFwd.z * dz) / Math.hypot(dx, dz);
      if (k > .93) { S.faceT = rand(90, 160); S.faceShow = .5; Audio.whisper(f.position.x, 2, f.position.z, 1.2); } }
    if (S.faceShow > 0) { S.faceShow -= dt; f.material.opacity = S.faceShow > 0 ? .85 : 0; } }
});
const _anwFwd = new THREE.Vector3();
const anwesen_hand = s => '<span class="hand">' + s + '</span>';
if (typeof WHISKEY_ST !== 'undefined') WHISKEY_ST.push({ id: 'nest', at: [-39.62, 96.2], hover: 2.35, when: () => anwesen_S.ch4 && anwesen_count() < 8, done: () => anwesen_count() >= 8, talk: 'Whiskey hockt auf dem toten Baum hinter dem Friedhof, direkt über einem Nest voller Glitzerkram. Er sieht mich an, als hätte er für mich gesammelt.' });
window.__anw = { chapter4Begin, startChapter4, press: () => anwesen_press(), door: () => anwesen_door(), hallEnd: () => anwesen_hallEnd(), count: anwesen_count, endcard3: (...a) => c3Endcard(...a) }; // Testzugriff
