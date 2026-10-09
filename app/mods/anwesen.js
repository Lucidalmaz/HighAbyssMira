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
  if (typeof saveGame === 'function') saveGame(curChapter()); return true;
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
  try { anwesen_f3Bau(); } catch (e) { console.warn('Anwesen: winkendes Fenster (AP-15)', e); }
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
      anwesen_give(3, 'Du hebelst das Gitter ab. Im Lichtschacht, zwischen nassem Laub und einem Kinderhandschuh: ein Eisenstück mit einer Nummer. Hinter der Scheibe, im dunklen Keller, fällt etwas um.'); }); reg(3, kx, 0, kz); shaft.userData.noCol = true;
    try { const lv = await msModel('w_leftleaves', 'model.glb'); const lo = msGround(msFit(lv.clone(true), .55, 'max')); lo.position.set(kx + .25, .028, kz - .05); lo.traverse(q => { if (q.isMesh) { q.castShadow = false; q.receiveShadow = true; } }); lo.userData.noCol = true; scene.add(lo); } catch (e) { console.warn('Anwesen: Laub im Schacht', e); }
    { const gl = new T.Group(), wool = new T.MeshStandardMaterial({ color: 0x9c2f2f, roughness: 1 }), palm = new T.Mesh(new T.CapsuleGeometry(.024, .055, 4, 8), wool); palm.rotation.z = PI / 2; gl.add(palm); const th = new T.Mesh(new T.CapsuleGeometry(.011, .03, 4, 6), wool); th.position.set(-.012, 0, .026); th.rotation.set(.5, 0, PI / 2 - .4); gl.add(th);
      const cuff = new T.Mesh(new T.CylinderGeometry(.027, .027, .028, 12), new T.MeshStandardMaterial({ color: 0xe0d8c8, roughness: 1 })); cuff.rotation.z = PI / 2; cuff.position.x = .058; gl.add(cuff); gl.position.set(kx + .21, .052, kz + .17); gl.rotation.y = .8; gl.traverse(q => { if (q.isMesh) q.castShadow = true; }); gl.userData.noCol = true; scene.add(gl); } }
  // --- 05 Amt, Gang: unter dem umgestürzten Regal (Kapitel 2)
  { const hit = box(1.1, .3, .6, X + 87.6, .15, Z - 1.55, hidden, { cast: false }); const p = partMesh(); p.position.set(X + 87.7, .03, Z - 1.6); p.rotation.x = -PI / 2; scene.add(p);
    interact(hit, () => anwesen_has(4) ? 'Umgestürztes Regal' : 'Unter das Regal greifen', () => { if (anwesen_has(4)) return toast('Nur Staub und ein abgerissener Streifen Klebeband.', 2400);
      p.visible = false; anwesen_give(4, 'Du legst dich flach auf den Beton und greifst unter das Regal. Kalt. Metall. Mit Klebeband an die Unterseite geklebt – so, dass man es nur findet, wenn man sich hinlegt wie ein Kind beim Versteckspielen.'); }); reg(4, X + 87.6, 0, Z - 1.55); }
  // --- 08 Messraum: unter Stuhl 8, dem ohne Namen (Kapitel 2)
  { const hit = box(.6, .35, .5, X + 118.6, .28, Z + 4.55, hidden, { cast: false });
    interact(hit, () => anwesen_has(7) ? 'Stuhl 8' : 'Stuhl 8 · unter die Sitzfläche tasten', () => { if (anwesen_has(7)) return toast('Der Stuhl ohne Namen. Die Gurte sind offen.', 2400);
      anwesen_give(7, 'Unter der Sitzfläche von Stuhl 8, dem Stuhl ohne Namen, klebt etwas. Ein schweres Eisenstück, rund, mit einem Loch in der Mitte. Der Kern eines Schlosses.'); }); reg(7, X + 118.6, 0, Z + 4.55); }
  // --- 07 Whiskeys Nest: toter Baum hinter dem Friedhof (ab Kapitel 3; in Kapitel 4 sammelt er dort alles, was du übersehen hast)
  // Nur der Baum hängt am Laden des Modells; Nest und Interaktion entstehen immer (sonst Sackgasse in Kapitel 4, wenn das Modell fehlt)
  try { const tr = await msModel('deadtree1'); const t = msGround(msFit(tr.clone(true), 5.2, 'y')); t.position.set(-40, 0, 96); t.rotation.y = 1.1; scene.add(t);
    t.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  } catch (e) { console.warn('Anwesen: toter Baum', e); }
  { let glint = { visible: true };
    try { const bark = msSurfMat('bark', { tint: 0x5a4a3a }); const nest = new T.Group(); nest.position.set(-39.62, 1.95, 96.2); scene.add(nest);
      for (let k = 0; k < 14; k++) { const tw = new T.Mesh(new T.CylinderGeometry(.012, .008, .42, 5), bark); tw.position.set(Math.cos(k * 2.4) * .12, (k % 3) * .025, Math.sin(k * 2.4) * .12); tw.rotation.set(PI / 2 + rand(-.3, .3), k * .45, rand(-.4, .4)); nest.add(tw); }
      for (const [x, z, c] of [[.04, .05, 0xb0302a], [-.06, .03, 0x2a5a9a], [.01, -.07, 0xc8a22a]]) { const k = new T.Mesh(new T.CylinderGeometry(.013, .013, .005, 12), new T.MeshStandardMaterial({ color: c, roughness: .4, metalness: .7 })); k.position.set(x, .05, z); k.rotation.set(rand(-.5, .5), 0, rand(-.5, .5)); nest.add(k); }
      const ring = new T.Mesh(new T.TorusGeometry(.011, .0025, 6, 14), new T.MeshStandardMaterial({ color: 0xd8b448, roughness: .25, metalness: .95 })); ring.position.set(.07, .052, -.03); ring.rotation.x = PI / 2.5; nest.add(ring);
      const spange = new T.Mesh(new T.BoxGeometry(.045, .006, .013), new T.MeshStandardMaterial({ color: 0xd06a8a, roughness: .5, metalness: .2 })); spange.position.set(-.04, .054, -.06); spange.rotation.y = .7; nest.add(spange);
      for (const [x, z, sc] of [[.015, .075, 1], [-.08, -.01, .8]]) { const st = new T.Mesh(new T.IcosahedronGeometry(.02, 0), new T.MeshStandardMaterial({ color: 0xd2d6da, roughness: .22, metalness: .95 })); st.scale.set(sc * 1.2, sc * .55, sc); st.position.set(x, .052, z); st.rotation.set(rand(0, 3), rand(0, 3), 0); nest.add(st); }
      glint = partMesh(); glint.position.set(0, .06, 0); glint.scale.setScalar(.7); nest.add(glint); nest.userData.noCol = true; S.nest = nest; S.nestGlint = glint;
    } catch (e) { console.warn('Anwesen: Nest', e); }
    const hit = box(.6, .5, .6, -39.62, 2.0, 96.2, hidden, { cast: false });
    interact(hit, () => S.ch4 && anwesen_count() < 8 ? 'Whiskeys Nest' : (ch3.on || S.ch4) && !anwesen_has(6) ? 'Nest in der Astgabel' : 'Nest', () => {
      if (S.ch4 && anwesen_count() < 8) { const miss = ANW_TEILE.map((_, i) => i).filter(i => !anwesen_has(i) && i !== 3); // Teil 04 liegt nie im Nest (02 C5): Luke hebelt das Kellerfenster selbst auf
        if (!miss.length) return toast('Das vom Kellerfenster ist nicht dabei. Da kommt der Vogel nicht durchs Gitter. Ich schon, mit der Brechstange.', 4600);
        if (!S.nestPick) { S.nestPick = true; if (typeof whiskey_caw === 'function') whiskey_caw(); return subtitle('Whiskey hackt dir einmal auf den Handrücken, nicht fest. – „Au. Das ist meins. Das ist ja wohl meins.“', 4400); }
        for (const i of miss) story.lore.push({ key: 'anw_teil_' + i, title: 'Schlüsselteil ' + ANW_TEILE[i][0], html: 'Aus Whiskeys Nest. Er hat es irgendwo aufgelesen, wo du nicht hingesehen hast.' });
        const c = anwesen_count(); modItem('schluesselteile', 'Schlüsselteile', `Geschmiedete Teile eines großen Schlüssels, gestempelt 01–08. Gefunden: ${c} / 8.`, 'key'); addItem('schluesselteile'); story.side.anw_teile.desc = 'Alle acht Teile. Die Presse im Garten der Villa fügt sie zusammen.';
        glint.visible = false; if (typeof whiskey_caw === 'function') whiskey_caw();
        return openNote('Whiskeys Nest', `Zweige, Draht, Stanniol. Und dazwischen alles, was glänzt: Kronkorken, ein Ehering, eine Kinderspange – und <b>${miss.length === 1 ? 'ein Schlüsselteil' : miss.length + ' Schlüsselteile'}</b>, gestempelt ${miss.map(i => ANW_TEILE[i][0]).join(', ')}.\n\nEr hat gesammelt, was du übersehen hast. Nach dem zweiten Versuch lässt er dich, mit einem beleidigten Krächzen.` + (anwesen_has(3) ? '' : '\n\n<span class="hand">Das vom Kellerfenster ist nicht dabei. Da kommt der Vogel nicht durchs Gitter. Ich schon, mit der Brechstange.</span>')); }
      if (!ch3.on && !S.ch4) return toast('Ein Nest in der Astgabel. Leer. Groß – für einen sehr großen Vogel.', 2800);
      if (anwesen_has(6)) return toast('Kronkorken, Stanniol, eine Kinderspange. Whiskey sammelt, was glänzt.', 3000);
      glint.visible = false; anwesen_give(6, 'Zweige, Draht, Stanniol. Und dazwischen alles, was glänzt: Kronkorken, eine Kinderspange, ein Ehering – und ein Stück geschmiedetes Eisen. Whiskey sammelt, was glänzt. Oder was man ihm aufträgt.'); });
    reg(6, -39.62, 0, 96.2); }
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
    { const cb = box(1.9, 1.7, 2.6, mx, .85, mz, hidden, { collide: true, cast: false }); const oi = occluders.indexOf(cb); if (oi >= 0) occluders.splice(oi, 1); } // Kollision ja, aber kein Strahlblocker: sonst deckt die Kiste die kleinere Klickfläche ab und der Strahl trifft die Presse nie (Test 08.10.)
    const L = new VLight(0xffb070, .0, 4, 2); L.position.set(mx, 1.6, mz); scene.add(L); S.pressLight = L;
    const hit = box(1.6, 1.4, 2.3, mx, .9, mz, hidden, { cast: false });
    interact(hit, () => S.key ? 'Prägepresse' : 'Prägepresse · Seiler & Sohn', () => anwesen_press());
    if (typeof hintAdd === 'function') hintAdd({ id: 'anw_presse', x: mx, y: 0, z: mz, kind: 'story', near: 60, open: () => S.ch4 && !S.key && anwesen_count() === 8 }); }
  // --- Die Tür: eine Eisenplatte mit acht Schlüssellöchern
  { const dz = vb.min.z - .04, pg = new T.BoxGeometry(.46, .62, .02); worldUV(pg, .46, .62, .02, 1.2);
    const plateMat = msSurfMat('rust_sheet', { tint: 0x7a6e64 }); plateMat.metalness = .55; plateMat.roughness = .7; // Eisenplatte: Rost-Scan statt einfarbiger Fläche
    const plate = new T.Mesh(pg, plateMat); plate.position.set(-125, 1.42, dz + .008); plate.castShadow = true; plate.receiveShadow = true; scene.add(plate);
    const holes = new T.Mesh(new T.PlaneGeometry(.46, .62), new T.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, map: tex(cnv(256, (c, w) => {
      c.clearRect(0, 0, w, w); c.fillStyle = '#080706'; for (let k = 0; k < 8; k++) { const x = 64 + (k % 2) * 128, y = 34 + Math.floor(k / 2) * 62; c.beginPath(); c.arc(x, y, 11, 0, 7); c.fill(); c.fillRect(x - 4, y, 8, 22); }
      c.fillStyle = 'rgba(20,16,12,.85)'; for (const [x, y] of [[16, 16], [w - 16, 16], [16, w - 16], [w - 16, w - 16]]) { c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill(); } }), true) }));
    holes.position.set(-125, 1.42, dz - .003); holes.rotation.y = PI; scene.add(holes);
    for (let k = 0; k < 8; k++) { const d = new T.Mesh(new T.CircleGeometry(.018, 12), new T.MeshBasicMaterial({ color: 0xffb060, transparent: true, opacity: 0 })); d.position.set(-125 + .115 - (k % 2) * .23, 1.42 + .235 - Math.floor(k / 2) * .145, dz - .004); d.rotation.y = PI; scene.add(d); S.lock.push(d); }
    const hit = box(1.6, 2.4, .5, -125, 1.2, dz - .2, hidden, { cast: false }); S.doorHit = hit;
    interact(hit, () => S.key ? 'Die Tür der Villa aufschließen' : 'Tür der Villa Seiler', () => anwesen_door()); }
  // --- Grusel: flackernde Kerze im Erdgeschoss, ein Gesicht am Fenster, eine Spieluhr hinter der Tür
  { const fl = new VLight(0xffa050, 0, 5, 2); fl.position.set(-129.7, 2.1, vb.min.z + .9); scene.add(fl); S.flick = fl;
    const face = new T.Mesh(new T.PlaneGeometry(.3, .36), new T.MeshBasicMaterial({ map: faceTexes.child, transparent: true, opacity: 0, color: new T.Color(.7, .72, .78), depthWrite: false }));
    face.position.set(-120.28, 2.05, vb.min.z - .03); face.rotation.y = PI; scene.add(face); S.face = face; }
  // --- Kapitel 4: dünner Rauch aus dem Gully an der Kreuzung (der Gang im Amt brennt noch)
  try { anwesen_smokeBuild(); } catch (e) { console.warn('Anwesen: Rauch', e); }
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
  setTimeout(() => { const pq = S.pressLight ? S.pressLight.position : player.pos; Audio.play('metalHit2', { gain: .5, rate: .6, x: pq.x, y: 1.2, z: pq.z, ref: 3 }); story.items = story.items.filter(k => k !== 'schluesselteile'); addItem('villaschluessel'); state.talking = false;
    sideDone('anw_teile', 'Acht Teile, ein Schlüssel. Die Tür der Villa wartet.'); setC3('Die Villa Seiler. Schließ die Tür auf.');
    subtitle('Die Presse stampft dreimal. Dann liegt da ein Schlüssel, so lang wie deine Hand. Sieben Zähne – und eine Lücke, wo der achte sein müsste.', 5600); }, 4200);
}
applySave = (o => d => { o(d); const S = anwesen_S; S.key = story.items.includes('villaschluessel'); try { anwesen_sockets(); } catch (e) {} })(applySave);
// Spielstand Kapitel 4: Tür offen, Halle betreten, gesehene Dinge. Weiterspielen in der Halle setzt dort fort; das Ende an der Treppe lässt sich erneut auslösen (nie Sackgasse)
MOD_SAVE.push(['anwesen', () => ({ open: !!anwesen_S.open, inHall: !!anwesen_S.inHall, hallDone: !!anwesen_S.hallDone, seen: [...anwesen_S.seen], knocked: !!anwesen_S.knocked }),
  v => { const S = anwesen_S; S.open = !!v.open; S.pendingHall = !!(v.open && v.inHall); (v.seen || []).forEach(k => S.seen.add(k)); S.knocked = !!v.knocked; }]);
if (typeof CH_RESUME !== 'undefined') CH_RESUME.push((d, at) => { // nach dem Platzieren beim Weiterspielen
  const S = anwesen_S, H = ANW_HALL; if (d.chapter !== 4) { S.pendingHall = false; return; } // nur Kapitel 4 (ab Kapitel 5 nie zurück in die Halle)
  const inHall = at && Math.abs(at.x - H.x) < H.w && Math.abs(at.z - H.z) < H.d;
  if (S.pendingHall || inHall) { if (!inHall) { player.pos.set(H.x, 0, H.z - H.d / 2 + 1.2); player.yaw = PI; } S.open = true; S.inHall = true; S.hallT = 0; if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0; Audio.setArea(true, false); setC3('Die Villa Seiler. Sieh dich um.'); }
  else S.open = false; // Tür offen, aber draußen gespeichert → Tür wieder benutzbar
  S.pendingHall = false; });
function anwesen_sockets() { const S = anwesen_S; S.sockets.forEach((s, i) => s.material.emissiveIntensity = anwesen_in(i) ? 2.2 : 0); S.lock.forEach((d, i) => d.material.opacity = S.key ? .9 : 0); }
function anwesen_door() {
  const S = anwesen_S; Audio.knock();
  if (S.open) return;
  if (!S.key) { const c = anwesen_count();
    if (!S.knocked) { S.knocked = true; setTimeout(() => { const q = S.doorHit.position; Audio.knock(q.x, 1.3, q.z + 1.2); subtitle('<i>Von drinnen klopft es zurück. Dreimal. Dann, ganz leise, eine Spieluhr.</i>', 4200); if (Audio.musicBox) Audio.musicBox(q.x, 1, q.z + 3); }, 1400); }
    sideStart('anw_teile'); return toast(`Kein Griff, kein Klingelschild. Eine Eisenplatte mit acht Schlüssellöchern.${c ? ` Du hast ${c} von 8 Teilen.` : ''} Wer hat eine Tür gebaut, die man nur zu acht öffnen kann?`, 5200); }
  if (!S.ch4) return;
  S.open = true; anwesen_sockets(); anwesen_enterHall();
}
// ---- Kapitel 4
const C4_INTRO = '<p class="on" style="font-family:Georgia;font-size:12px;letter-spacing:.4em;color:#c9a36a;margin-bottom:22px">KAPITEL 4 · SEHEN, BERGEN, SCHWEIGEN</p><p class="on">Donnerstag, 5. November. Der Morgen nach dem Licht.</p><p class="on">Der Strom ist zurück. Die Laternen sind aus. Die Zeitung ist schon da.</p><p class="on">Lucy liegt bei Vegas auf dem Sofa und friert.</p><p class="on">Auf der Ahornstraße schrubben Männer die Kreide weg.</p><p class="on">Und am Westrand steht die Villa Seiler. Oben brennt noch immer das eine Fenster.</p><p class="on" style="font-family:Georgia;font-size:11px;letter-spacing:.35em;color:#8b7f68;margin-top:30px">KLICKEN ZUM WEITERSPIELEN</p>';
async function chapter4Begin() {
  const S = anwesen_S; if (S.ch4) return; S.ch4 = true; saveFlag('ch4'); if (typeof villa_neu === 'function') villa_neu(); setChapter(4);
  $('endcard').classList.remove('show'); ui.overlay = null; document.body.classList.remove('ov'); state.ending = false; state.talking = false;
  ch3.part = 'town'; ch3.lampsOff = true; ch3.chase = 'done'; ch3.met = true; ch3.gullyHint = true; hunt.on = false; grey.visible = false; if (justin && justin.g) justin.g.visible = false;
  state.zone = null; try { canalAtmo(false); } catch (e) {} Audio.hum(false); Audio.chaseMusic(false); Audio.setArea(false, false);
  lamps.forEach(L => { L.mode = 'off'; L.dead = 0; }); // Morgen: die Laternen sind aus (PK-H)
  if (typeof leben_uhr === 'function') { try { leben_uhr(7, 40); } catch (e) { console.warn('Anwesen: Weltuhr', e); } } // Weltuhr Kap. 4: Start 07:40 (PK-G G-1)
  { const OW = ausbau_ost_west_OW; if (!OW.gateOpen && OW.gate) { OW.gateOpen = true; if (OW.chain) OW.chain.visible = false; msHide(OW.gate); // wie im Tor-Code: Flügel an einem Scharnier, offen
    const pv = new THREE.Group(); pv.position.set(-127.3, 0, 57); pv.userData.noCol = true; const leaf = OW.gate.clone(true); leaf.visible = true; leaf.position.set(2.3, 0, 0); leaf.rotation.set(0, 0, 0); pv.add(leaf); pv.rotation.y = -1.2; OW.gate.parent.add(pv); } }
  player.pos.set(.8, 0, 1.6); player.yaw = PI / 2 + .6; player.pitch = .05; vel.set(0, 0, 0); camY = player.pos.y + 1.65; flashOn = true;
  $('fade').style.background = '#000'; $('fade').style.opacity = 1; await wait(300);
  $('intro').innerHTML = (typeof bisherHtml === 'function' ? bisherHtml(4) : '') + C4_INTRO; /* Story-Prüfung V-8 */ $('introSeq').classList.add('show'); $('fade').style.opacity = 0;
  $('introSeq').onclick = () => { $('introSeq').classList.remove('show'); $('introSeq').onclick = null; lockPointer();
    const c = anwesen_count(); setC3(c === 8 ? 'Die Villa Seiler. Die Presse im Garten fügt die acht Teile zusammen.' : `Die Villa Seiler. Dir fehlen noch ${8 - c} Schlüsselteile – frag den Raben.`);
    if (typeof gedanke === 'function') gedanke('ch4_start', 'Es ist vorbei. Oder? … Die Villa. Acht Schlösser. Ich will wissen, was Seiler da drin versteckt hat.', 1500, 3);
    if (typeof villa_nachIntro === 'function') villa_nachIntro(); };
  saveGame(4); anwesen_sockets(); if (typeof c3Info === 'function') c3Info();
}
async function startChapter4() { // Weiterspielen / Kapitel wählen
  $('subPanel').classList.remove('show'); menu.attract = false; state.started = true; document.body.classList.remove('menu'); $('start').classList.remove('show');
  chapter3Begin(); ch3.met = true; anwesen_S.ch4 = false;
  if (!story.items.includes('brechstange') && typeof addItem === 'function') addItem('brechstange'); // Kapitelwahl/Weiterspielen: Teil 04 (Kellerfenster-Gitter) braucht sie, sonst ist die Villa nie vollständig
  await chapter4Begin();
}
async function anwesen_enterHall() {
  const S = anwesen_S, H = ANW_HALL; state.talking = true; Audio.play('ironDoor', { gain: .5, rate: .7 }); Audio.creak(.3);
  for (let k = 0; k < 8; k++) setTimeout(() => Audio.play('metalHit1', { gain: .15, rate: 1.4 + k * .05 }), 300 + k * 180);
  try { await fade(1, 1200); player.pos.set(H.x, 0, H.z - H.d / 2 + 1.2); player.yaw = PI; player.pitch = 0; vel.set(0, 0, 0); camY = 1.65; if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0;
    S.inHall = true; S.hallT = 0; Audio.setArea(true, false); await wait(300); await fade(0, 1200); } finally { state.talking = false; if (+$('fade').style.opacity > 0) fade(0, 600); }
  if (typeof todCheckpoint === 'function') todCheckpoint('villa_halle', 'Die Villa Seiler'); else saveGame(4);
  setC3('Die Villa Seiler. Sieh dich um.');
  subtitle('<i>Hinter dir fällt die Tür ins Schloss. Acht Riegel. Einer nach dem anderen.</i>', 4200);
  story.lore.push({ key: 'anw_halle', title: 'Die Villa Seiler', html: 'Acht Teile, eine Presse, ein Schlüssel. Hinter der Tür: die Eingangshalle eines Hauses, in dem seit 2019 niemand mehr gewohnt hat. Oben brennt Licht.' });
}
async function anwesen_buildHall() {
  const S = anwesen_S, H = ANW_HALL, T = THREE, x0 = H.x - H.w / 2, x1 = H.x + H.w / 2, z0 = H.z - H.d / 2, z1 = H.z + H.d / 2;
  const wp = msSurfMat('wallpaper_old', { tint: 0x8a7c6c }); wp.userData.tile = 1.4; const fl = msSurfMat('floor_wood', { tint: 0x4a3626 }); fl.userData.tile = .9; fl.roughness = .5;
  const pl = msSurfMat('wall_plaster', { tint: 0x6a665e }); pl.userData.tile = 2; const dark = msSurfMat('planks_painted', { tint: 0x3a2e24 }); dark.userData.tile = 1;
  plane(H.w, H.d, H.x, .01, H.z, fl); box(H.w + .4, .2, H.d + .4, H.x, H.h + .1, H.z, pl, { cast: false });
  wall('x', z0, x0, x1, H.h, wp, [{ at: H.x, w: 1.6 }], .3); wall('z', x0, z0, z1, H.h, wp, [], .3); wall('z', x1, z0, z1, H.h, wp, [], .3);
  // Nordwand: oberhalb der Galerie (y 3,2 bis 5,5) die Öffnung zum Flur oben (anwesen_galerie)
  wall('x', z1, x0, H.x - 1, H.h, wp, [], .3); wall('x', z1, H.x + 1, x1, H.h, wp, [], .3); box(2, 3.2, .3, H.x, 1.6, z1, wp, { collide: true }); box(2, H.h - 5.5, .3, H.x, 5.5 + (H.h - 5.5) / 2, z1, wp);
  box(1.6, 2.62, .12, H.x, 1.31, z0 - .05, dark, { collide: true }); // Haustür (von innen zu)
  indoorRects.push({ x0, x1, zb: z0, zf: z1, y: 0 });
  // Treppe nach oben (eingebrochen): Stufen, auf halber Höhe zersplittert
  for (let k = 0; k < 9; k++) box(3, .2, .42, H.x, .1 + k * .2, z1 - 3.6 + k * .38, dark, { collide: k < 3 });
  // QA-Kollision 09.10.: unsichtbare Sperrkiste (3,4 × 1,2 m) vor der ersten Stufe entfernt – die Stufen selbst sind fest, oben hält die Galerie auf
  for (let k = 0; k < 5; k++) { const b = box(.14, .14, 2.6, H.x + rand(-1.2, 1.2), 1.9 + rand(-.3, .3), z1 - 2.2 + rand(-.5, .5), dark); b.rotation.set(rand(-.5, .5), rand(-1, 1), rand(-.6, .6)); }
  const put = async (key, file, size, axis, x, z, ry, y = 0) => { try { const m = await msModel(key, file); const o = msGround(msFit(m.clone(true), size, axis)); o.position.set(x, y, z); o.rotation.y = ry; o.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); scene.add(o); return o; } catch (e) { console.warn('Halle ' + key, e); return null; } };
  await put('wardrobe', 'model.gltf', 2.2, 'y', x0 + .44, H.z - 4.4, 0); /* QA-Kollision 09.10.: stand bei z−2,5 direkt vor der Westtür zum Arbeitszimmer (897,6) */ await put('wallclock', 'model.gltf', .9, 'y', x1 - .25, H.z + 1, -PI / 2, 1.5);
  await put('floorlamp', 'model.gltf', 1.7, 'y', x0 + .7, z1 - 1, .4); await put('floorlamp', 'model.gltf', 1.7, 'y', x1 - .7, z0 + 1.2, -.4);
  const shelfO = await put('shelf', 'model.gltf', 1.2, 'x', x1 - .3, H.z - 3.2, -PI / 2, 1.45); await put('radio', 'model.gltf', .45, 'max', x1 - 1.4, z0 + 2.4, -PI / 2, .78);
  // Schreibtisch: gescannter Metalltisch statt Kiste
  try { const t = (await msModel('metaltable')).clone(true); t.scale.set(.5, .9, 1); const o = msGround(t); o.position.set(x1 - 1.4, 0, z0 + 2.4); o.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); scene.add(o); } catch (e) { console.warn('Halle metaltable', e); }
  const letter = plane(.24, .32, x1 - 1.6, .785, z0 + 2.3, paperMat, -PI / 2, .3);
  const portrait = await put('frame_dmg', 'model.gltf', 1.2, 'y', x0 + .12, H.z + 1.5, PI / 2, 1.5);
  for (const [lx, lz] of [[x0 + .7, z1 - 1], [x1 - .7, z0 + 1.2]]) { const L = new VLight(0xffa860, 1.1, 7, 2); L.position.set(lx, 1.6, lz); scene.add(L); }
  const up = new VLight(0xfff0d8, .9, 9, 2); up.position.set(H.x, H.h - .6, z1 - 1.2); scene.add(up); S.upLight = up;
  try { await anwesen_galerie(H, x0, x1, z1, pl, fl, wp); } catch (e) { console.warn('Galerie', e); }
  // Seilers Brief, das Porträt, die Uhr – dann die Treppe
  interact(letter, 'Brief auf dem Schreibtisch', () => { S.seen.add('brief'); openNote('Ein Brief, März 2019', anwesen_hand('An den, der die acht Teile gefunden hat.\n\nIch habe 1958 das Amt gegründet. Ich habe Listen geschrieben, damit das Licht nur nimmt, wen wir ihm geben. Ich dachte, das sei Barmherzigkeit.\n\nDie Teile habe ich dorthin gebracht, wo sich die Kinder früher versteckt haben. Wer sie findet, hat hingesehen. Das hat keiner von uns.\n\nOben liegt, was ich nie jemandem zeigen konnte.\n— Dr. Theodor Seiler'), 'anw_brief'); });
  const ph = box(.2, 1.3, 1.1, x0 + .15, 1.5, H.z + 1.5, hidden, { cast: false });
  if (portrait && typeof villa_portraetBild === 'function') { try { villa_portraetBild(portrait); } catch (e) { console.warn('Porträt-Bild', e); } } // Fassung 3: Mira mit Rabe, weiße Flamme, „L. B.“
  interact(ph, () => typeof villa_hat === 'function' && villa_hat('ring') && !villa_hat('noten') ? 'Das Porträt anheben' : 'Porträt', async () => { if (typeof villa_portraet === 'function' && await villa_portraet()) return; const erst = !S.seen.has('bild'); S.seen.add('bild');
    openNote('Ein Porträt', 'Eine Frau in einem langen dunklen Kleid. Auf ihrer Schulter ein Rabe, am linken Fuß ein dunkler Ring. In der Hand eine Laterne. Die Flamme darin steht kerzengerade und ist weiß wie kaltes Licht.\nUnten rechts in der Farbe: <b>L. B.</b>\nMessingschild, fast blank gerieben: <b>„… IRA“</b>. Rückseite, Bleistift: <i>gemalt 2043</i>.', 'anw_bild', () => {
      if (!erst) return; subtitle('<i>L. B. Lucy Brandt. Luke Brandt. … Zweitausenddreiundvierzig. Das ist die nächste Nacht.</i>', 5600, 'LUKE'); setTimeout(() => { try { Audio.play('woodHit1', { gain: .35, rate: 1.5, x: x0 - .3, y: 2.4, z: H.z + 2.4 }); } catch (e) {} }, 6200); }); });
  const ch = box(.3, .9, .9, x1 - .25, 1.95, H.z + 1, hidden, { cast: false }); let uhrN = 0; interact(ch, 'Wanduhr', () => toast(++uhrN > 1 ? 'Drei Uhr dreizehn. Das Pendel schwingt. Die Zeiger sind mit Bleistift auf das Zifferblatt nachgezeichnet. Jemand hat gemalt, was er weiß.' : 'Drei Uhr dreizehn. Die Zeiger stehen. Das Pendel schwingt.', 3600));
  await anwesen_dressHall(H, x0, x1, z0, z1, put, shelfO);
  if (typeof villa_halleTueren === 'function') { try { villa_halleTueren(H); } catch (e) { console.warn('Villa-Türen', e); } }
  const stairs = box(3, 2, .6, H.x, 1, z1 - 3.1, hidden, { cast: false });
  interact(stairs, 'Treppe nach oben', () => anwesen_hallEnd());
}
// Seilers Krankenbett: graue Strickjacke (Ellenbogen mit Leder geflickt) über dem Fußende, acht Striche ins Kopfteil geritzt (der achte tiefer)
async function anwesen_bettDeko(o = {}) {
  const S = anwesen_S, T = THREE, g = S.bett; if (!g) return; for (const k of ['jackeG', 'ritzG']) if (S[k]) { scene.remove(S[k]); S[k] = null; } for (const m of S.flickenM || []) scene.remove(m); S.flickenM = [];
  g.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(g), cx = (bb.min.x + bb.max.x) / 2, zf = o.fuss ?? bb.max.z, zh = o.kopf ?? bb.min.z; S.bettBox = bb;
  const rc = new T.Raycaster(new T.Vector3(cx, 2.5, zf - .5), new T.Vector3(0, -1, 0), 0, 4), hit = rc.intersectObject(g, true)[0], top = o.top ?? (hit ? hit.point.y : .6);
  // Jacke: Scan, entsättigt grau (Strickjacke), mit zwei Lederflicken
  const m = await msFBX('w_jacke', 'model.fbx', { '*': { b: 'model.jpg', rough: .97, ds: true } });
  const kn = anwesen_strickMat(); m.traverse(q => { if (!q.isMesh) return; q.castShadow = true; q.receiveShadow = true; q.material = kn; });
  msFit(m, o.size ?? .8, 'max'); const pv = new T.Group(); pv.add(m); pv.rotation.set(o.rx ?? -PI / 2, o.ry ?? 0, o.rz ?? 0); pv.updateMatrixWorld(true);
  const jb = new T.Box3().setFromObject(pv), jc = jb.getCenter(new T.Vector3()); m.position.set(-jc.x, -jb.min.y, -jc.z); const J = new T.Group(); J.add(pv); S.jackeSrc = m;
  J.position.set(o.x ?? cx, o.y ?? top - .005, o.z ?? zf - (o.dz ?? .32)); J.rotation.y = o.jry ?? 0; scene.add(J); S.jackeG = J; J.userData.noCol = true; J.updateMatrixWorld(true);
  // Lederflicken auf beiden Ellenbogen: per Strahl von oben auf die Jacke gesetzt
  { const jr = new T.Raycaster(), N = new T.Vector3(), q = new T.Quaternion(), Zax = new T.Vector3(0, 0, 1), jbb = new T.Box3().setFromObject(J), jcx = (jbb.min.x + jbb.max.x) / 2, sw = jbb.max.x - jbb.min.x;
    for (const sx of [-1, 1]) for (const dz of [0, .05, -.05, .1, -.1]) { jr.set(new T.Vector3(jcx + sx * sw * .3, jbb.max.y + .5, J.position.z + dz), new T.Vector3(0, -1, 0)); jr.far = 2; const h = jr.intersectObject(J, true)[0]; if (!h) continue;
      N.copy(h.face ? h.face.normal : new T.Vector3(0, 1, 0)).transformDirection(h.object.matrixWorld); if (N.y < 0) N.negate(); const fl = new T.Mesh(new T.PlaneGeometry(.075, .095), new T.MeshStandardMaterial({ map: anwesen_flickenTex(), roughness: .8, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));
      fl.position.copy(h.point).addScaledVector(N, .004); q.setFromUnitVectors(Zax, N); fl.quaternion.copy(q); fl.rotateZ(sx * .6); fl.userData.noCol = true; fl.receiveShadow = true; scene.add(fl); (S.flickenM || (S.flickenM = [])).push(fl); break; } }
  // acht Ritzstriche im Kopfteil
  const w = 256, h = 128, c = document.createElement('canvas'), b = document.createElement('canvas'); c.width = b.width = w; c.height = b.height = h; const C = c.getContext('2d'), B = b.getContext('2d'); C.clearRect(0, 0, w, h); B.fillStyle = '#808080'; B.fillRect(0, 0, w, h);
  if (typeof ritz_strich === 'function') { for (let i = 0; i < 8; i++) { const x = 22 + i * 30, tief = i === 7, L = tief ? 84 : 70 - (i % 3) * 3; const pts = [[x, 20 + (tief ? 0 : 6)], [x + (i % 2 ? 1.5 : -1), 20 + L * .5], [x + 1, 20 + L]]; ritz_strich(C, B, pts, tief ? 52 : 34, 'ritz', tief ? 1 : .8); if (tief) ritz_strich(C, B, pts.map(([a, d]) => [a + 2.5, d]), 40, 'ritz', 1); } }
  const tp = typeof ritz_tex === 'function' ? ritz_tex(c, b) : { map: tex(c, true) };
  const R = new T.Mesh(new T.PlaneGeometry(.34, .17), new T.MeshStandardMaterial(Object.assign({ transparent: true, roughness: .85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }, tp))); R.position.set(o.rx2 ?? cx, o.ry2 ?? top + .12, zh + (o.rdz ?? .06)); R.rotation.y = o.rry ?? 0; R.userData.noCol = true; scene.add(R); S.ritzG = R;
}
// graue Wolle: Maschenreihen (V-Muster) als Karte, vielfach wiederholt
function anwesen_strickMat() { const S = anwesen_S; if (S.strickMat) return S.strickMat; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#8c8c8e'; x.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 16; r++) for (let k = 0; k < 16; k++) { const px = k * 8 + (r % 2) * 0, py = r * 8; x.strokeStyle = `rgba(${150 + (k * 7 + r * 3) % 40},${150 + (k * 5 + r) % 36},${154 + (k + r * 5) % 34},.9)`; x.lineWidth = 2; x.beginPath(); x.moveTo(px + 1, py + 1); x.lineTo(px + 4, py + 7); x.lineTo(px + 7, py + 1); x.stroke(); x.strokeStyle = 'rgba(40,40,44,.35)'; x.lineWidth = 1; x.beginPath(); x.moveTo(px + 4, py + 7); x.lineTo(px + 4, py + 8); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5); t.anisotropy = 4;
  return (S.strickMat = new THREE.MeshStandardMaterial({ map: t, roughness: 1, metalness: 0, side: THREE.DoubleSide })); }
function anwesen_flickenTex() { if (anwesen_S.flickenTex) return anwesen_S.flickenTex; const c = document.createElement('canvas'); c.width = 96; c.height = 120; const x = c.getContext('2d'); x.fillStyle = '#6a4326'; x.beginPath(); x.ellipse(48, 60, 42, 54, 0, 0, 7); x.fill(); const g = x.createRadialGradient(40, 46, 6, 48, 60, 56); g.addColorStop(0, 'rgba(160,110,64,.55)'); g.addColorStop(1, 'rgba(30,16,6,.55)'); x.fillStyle = g; x.fill();
  x.strokeStyle = 'rgba(210,190,150,.9)'; x.lineWidth = 2; x.setLineDash([5, 4]); x.beginPath(); x.ellipse(48, 60, 36, 48, 0, 0, 7); x.stroke(); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(20,10,4,${Math.random() * .25})`; x.fillRect(Math.random() * 96, Math.random() * 120, 1 + Math.random() * 2, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (anwesen_S.flickenTex = t); }
// Galerie an der Nordwand (Oberkante Dielen y 3,2): Dielen auf Tragbalken, Konsolen und zwei Pfosten, Geländer mit gedrechselten Stäben (Scan), der Bruch über der
// eingestürzten Treppe, dahinter die Flur-Öffnung mit Tür und Sturmlaterne – das Licht „oben“, das atmet. Whiskey sitzt auf dem Handlauf (villa.js: whiskey_w10, y 4,3).
async function anwesen_galerie(H, x0, x1, z1, pl, fl, wp) {
  const T = THREE, S = anwesen_S, GY = 3.2, zw = z1 - .15, zf = zw - 1.5, zr = zf + .1, xa = x0 + .15, xb = x1 - .15, cx = (xa + xb) / 2, len = xb - xa, gx0 = H.x - 1.5, gx1 = H.x + 1.5;
  const holz = msSurfMat('planks_painted', { tint: 0x52402f }); holz.userData.tile = .9; const dunkel = msSurfMat('planks_painted', { tint: 0x2f251c }); dunkel.userData.tile = .9;
  const lack = msSurfMat('planks_painted', { tint: 0x6a5238 }); lack.userData.tile = .5;
  // Dielen, Randbalken, Querbalken
  box(len, .12, 1.5, cx, GY - .06, (zw + zf) / 2, dunkel); box(len, .3, .2, cx, GY - .18, zf + .1, holz);
  for (let x = xa + .6; x < xb - .3; x += 1.4) box(.12, .2, 1.4, x, GY - .22, (zw + zf) / 2 + .02, dunkel, { cast: false });
  for (const x of [xa + .35, xb - .35]) box(.2, GY - .33, .2, x, (GY - .33) / 2, zf + .12, holz, { collide: true });
  for (const x of [-905.1, -903.2, -896.8, -894.9]) { const k = box(.1, .14, 1.7, x, GY - .75, (zw + zf + .12) / 2, dunkel, { cast: false }); k.rotation.x = .52; }
  // Geländer: Handlauf (Oberkante 4,3), Fußleiste, Pfosten, Stäbe; in der Mitte der Bruch über der Treppe
  const seg = (a, b) => { const l = b - a, m = (a + b) / 2; box(l, .07, .11, m, 4.265, zr, lack); box(l, .06, .08, m, GY + .09, zr, dunkel, { cast: false }); return l; };
  seg(xa, gx0); seg(gx1, xb);
  for (const x of [xa + .06, -904.2, gx0, gx1, -896.2, xb - .06]) { box(.12, 1.12, .12, x, GY + .56, zr, lack); box(.17, .05, .17, x, GY + 1.14, zr, holz, { cast: false }); }
  // gedrechselte Stäbe (Drehteile, instanziert); einzelne fehlen
  { const pr = [[.0, 0], [.022, 0], [.022, .04], [.03, .07], [.019, .11], [.019, .2], [.034, .29], [.041, .36], [.034, .43], [.019, .5], [.019, .66], [.026, .7], [.031, .74], [.026, .78], [.017, .82], [.017, .93], [.022, .96], [.022, 1.0], [0, 1.0]].map(([r, y]) => new T.Vector2(r, y * 1.02));
    const geo = new T.LatheGeometry(pr, 14), im = []; const mats = []; let n = 0;
    for (const [a, b] of [[xa + .12, gx0 - .08], [gx1 + .08, xb - .12]]) for (let x = a; x <= b; x += .155) { n++; if (n % 13 === 5) continue; mats.push(new T.Matrix4().compose(new T.Vector3(x, GY + .1, zr), new T.Quaternion(), new T.Vector3(1, 1, 1))); }
    const ms = new T.InstancedMesh(geo, new T.MeshStandardMaterial({ color: 0x5a4430, roughness: .72 }), mats.length); mats.forEach((m4, i) => ms.setMatrixAt(i, m4)); ms.castShadow = true; ms.receiveShadow = true; ms.userData.noCol = true; ms.computeBoundingSphere(); scene.add(ms); void im; }
  // Bruch: abgerissener Handlauf hängt am Pfosten, zwei Bretter der Treppe ragen vom Rand, Splitter auf den Dielen
  { const h = box(.95, .07, .11, gx1 - .38, 4.04, zr, lack); h.rotation.z = .55; const h2 = box(.6, .07, .11, gx0 + .22, 3.98, zr, lack); h2.rotation.z = -.9; h2.rotation.y = .12;
    for (const [x, rz, l] of [[H.x - .7, .42, 1.5], [H.x + .5, .3, 1.2]]) { const b = box(.28, .05, l, x, GY - .6, zf - .35, dunkel); b.rotation.x = .6; b.rotation.z = rz * .2; } }
  // Flur oben: Seitenwände, Boden, Decke, Rückwand mit Tür; Sturmlaterne an der Decke
  { const fz = z1 + .15, ft = 2.7, fb = fz + ft, fm = fz + ft / 2; box(2.28, .14, ft + .14, H.x, GY - .07, fm, fl, { cast: false }); box(2.28, .14, ft + .14, H.x, 5.57, fm, pl, { cast: false });
    box(.14, 2.3, ft, H.x - 1.07, 4.35, fm, pl, { cast: false }); box(.14, 2.3, ft, H.x + 1.07, 4.35, fm, pl, { cast: false }); box(2.28, 2.5, .14, H.x, 4.35, fb + .07, wp, { cast: false });
    try { const m = await msModel('door2'); const o = msGround(msFit(m.clone(true), 2.15, 'y')); o.position.set(H.x, GY, fb); o.rotation.y = PI; o.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); scene.add(o); } catch (e) { console.warn('Galerie: Tür', e); }
    const lz = fz + 1.25; box(.008, .78, .008, H.x, 5.18, lz, dunkel, { cast: false });
    try { const ln = await msFBX('lantern1', 'model.fbx', { lantern: { b: 'lantern_and_bulb_lantern_BaseColor.1001.png', n: 'lantern_and_bulb_lantern_Normal.1001.jpg', r: 'lantern_and_bulb_lantern_Roughness.1001.jpg', m: 'lantern_and_bulb_lantern_Metallic.1001.jpg' }, buln: { b: 'lantern_and_bulb_buln_BaseColor.1001.png', rough: .2, emissive: 0xffb060 } });
      msFit(ln, .36, 'y'); const lg = msGround(ln); lg.position.set(H.x, 4.43, lz); scene.add(lg); lg.traverse(q => { if (q.isMesh) { q.castShadow = false; if (q.material && q.material.emissive && q.material.emissive.getHex() !== 0) S.lanMat = q.material; } });
    } catch (e) { console.warn('Galerie: Laterne', e); }
    const gl = new T.Sprite(new T.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: .8 })); gl.scale.set(.5, .7, 1); gl.position.set(H.x, 4.62, lz); scene.add(gl); S.lanGlow = gl;
    const L = new VLight(0xffc27a, .9, 7, 2); L.position.set(H.x, 4.6, lz); scene.add(L); S.lanLight = L; }
  S.gal = { y: GY, rail: 4.3, z: zr, x0: xa, x1: xb };
}
// Halle einrichten: nur Scan-Modelle (Sofa, Stühle, Buffet, Kinderbett, Bilder, Kerzen, Spielzeug, Teddy, Teppich, Spinnweben)
async function anwesen_dressHall(H, x0, x1, z0, z1, put, shelfO) {
  const T = THREE, S_ = anwesen_S, V = (x, y, z) => new T.Vector3(x, y, z), wx0 = x0 + .15, wx1 = x1 - .15, wz0 = z0 + .15, wz1 = z1 - .15;
  const add = (o, x, z, ry = 0, y = 0) => { const g = msGround(o); g.position.set(x, y, z); g.rotation.y = ry; g.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); scene.add(g); g.updateMatrixWorld(true); return g; };
  const mesh1 = o => { let m = null; o.traverse(q => { if (!m && q.isMesh) m = q; }); return m; };
  const rc = new T.Raycaster(), topOf = (o, x, z, from = 3) => { rc.set(V(x, from, z), V(0, -1, 0)); rc.far = 5; const h = rc.intersectObject(o, true)[0]; return h ? h.point.y : 0; };
  const W_ = k => ({ b: `T_${k}_BaseColor.jpg`, n: `T_${k}_Normal.jpg`, r: `T_${k}_Roughness.jpg`, color: 0x7a6e60 });
  const hutchSpec = { 'Wood-1': W_('Wood-1'), 'Wood-2': W_('Wood-2'), 'Wood-3': W_('Wood-3'), Metal: { b: 'T_Metal_BaseColor.jpg', n: 'T_Metal_Normal.jpg', r: 'T_Metal_Roughness.jpg', m: 'T_Metal_Metallic.jpg' } };
  const chairSpec = { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg', color: 0x8a8078 } };
  const candleSpec = { Used_candles: { b: 'Used_candles_BaseColor.jpg', n: 'Used_candles_Normal.jpg', r: 'Used_candles_Roughness.jpg' }, Candles_new: { b: 'Candles_new_BaseColor.jpg', n: 'Candles_new_Normal.jpg', r: 'Candles_new_Roughness.jpg' }, Extra_for_candles: { b: 'Extra_for_candles_BaseColor.jpg', n: 'Extra_for_candles_Normal.jpg', r: 'Extra_for_candles_Roughness.jpg', m: 'Extra_for_candles_Metallic.jpg' } };
  const safe = p => p.catch(e => { console.warn('Halle', e); return null; });
  const [sofa, hutch, crib, cSrc, tSrc, teddy] = await Promise.all([
    safe(msFBX('sofa', 'model.fbx', { Sofa: { b: 'Sofa_BaseColor.jpg', n: 'Sofa_Normal.jpg', r: 'Sofa_Roughness.jpg', color: 0x7a6a62 } })), safe(msFBX('dresser', 'model.fbx', hutchSpec)),
    safe(msFBX('crib', 'model.fbx', { 'Material #2142147589': { b: '../planks_painted/b.jpg', n: '../planks_painted/n.jpg', r: '../planks_painted/orm.jpg', color: 0xdcd6ca }, 'Material #2142147590': { b: '../hospbed/mattress_color.jpg', n: '../hospbed/mattress_nrm.jpg', color: 0xe0dcd4 }, 'Material #2142147602': { color: 0x2a2826, rough: .6 } })),
    safe(msFBX('candles', 'model.fbx', candleSpec)), safe(msFBX('toys_old', 'model.fbx', { '*': { b: 'T_Toys_BaseColor.jpg', n: 'T_Toys_Normal.jpg', r: 'T_Toys_ORM.jpg', ao: 'T_Toys_ORM.jpg' } })), safe(msFBX('teddy_retro', 'model.fbx', { material0: { b: 'teddy-bear.jpg', color: 0xb8aa98 }, material1: { b: 'teddy-bear1.jpg', color: 0xb8aa98 } }))]);
  const part = (src, name, s) => { if (!src) return null; src.updateMatrixWorld(true); let m = null; src.traverse(q => { if (q.isMesh && q.name === name) m = q; }); if (!m) return null;
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld); g.computeBoundingBox(); const b = g.boundingBox; g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); g.scale(s, s, s); g.computeBoundingBox(); g.computeBoundingSphere();
    const r = new T.Mesh(g, m.material); r.castShadow = true; r.receiveShadow = true; return r; };
  const at = (o, x, y, z, ry = 0) => { if (!o) return null; o.position.set(x, y, z); o.rotation.y = ry; scene.add(o); return o; };
  const candle = (name, x, y, z, lit) => { const c = at(part(cSrc, name, .01), x, y, z, rand(0, 6)); if (c && lit) { const fl = new T.Sprite(new T.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); fl.scale.set(.05, .085, 1); fl.position.set(x, y + c.geometry.boundingBox.max.y + .035, z); scene.add(fl); } return c; };
  // Sitzecke an der Westwand: Sofa, ein Stuhl davor, einer umgeworfen
  if (sofa) { msFit(sofa, 2.0, 'x'); add(sofa, wx0 + .55, H.z + 3.3, PI / 2); }
  const chair = async () => { const c = await msFBX('chair', 'model.fbx', chairSpec); msFit(c, .92, 'y'); return c; };
  add(await chair(), wx0 + 2.35, H.z + 3.5, -PI / 2 + .25);
  { const c = await chair(); c.rotation.x = -PI / 2 + .06; add(c, wx0 + 2.6, H.z + 1.7, 2.1); }
  add(await chair(), x1 - 1.4, z0 + 3.25, PI + .15); // Schreibtischstuhl
  // Buffet an der Ostwand mit heruntergebrannten Kerzen
  if (hutch) { msFit(hutch, 2.2, 'y'); const g = add(hutch, wx1 - .31, H.z + 3.6, -PI / 2); const b = new T.Box3().setFromObject(g), sy = topOf(g, b.min.x + .12, H.z + 3.6, 1.3);
    S_.hutchTop = sy; S_.hutchX = b.min.x + .14; candle('Candle_large_big_used_low', b.min.x + .14, sy, H.z + 3.2); candle('Thin_candle_used_low', b.min.x + .12, sy, H.z + 3.45); candle('Candle_large_small_used_low', b.min.x + .15, sy, H.z + 4.0);
    const xc = wx1 - .2, lv = [...new Set([2.05, 1.8, 1.55].map(f => +topOf(g, xc, H.z + 3.6, f).toFixed(3)))].filter(y => y > sy + .15);
    lv.forEach((y, r) => { for (let i = 0; i < 5; i++) candle(['Candle_large_small_used_low001', 'Thin_candle_used_low001', 'Candle_small_used_low', 'Candle_large_big_used_low', 'Candle_small_used_low001'][(i + r) % 5], xc - (i % 2) * .03, y, H.z + 3.12 + i * .2); }); }
  if (shelfO) { const sy = topOf(shelfO, x1 - .3, H.z - 3.2, 2.5); if (sy > 1) { candle('Candle_small_used_low', x1 - .28, sy, H.z - 3.5); candle('Candle_large_small_used_low001', x1 - .28, sy, H.z - 2.9); } }
  // Ein Kinderbett mitten in der Halle, zur Treppe gedreht – frisch bezogen. Davor Kerzen, eine brennt.
  if (crib) { crib.scale.setScalar(.024); add(crib, H.x + 2.6, H.z + .6, .35);
    const hit = box(1.3, 1, .8, H.x + 2.6, .5, H.z + .6, hidden, { cast: false }); hit.rotation.y = .35;
    interact(hit, 'Kinderbett', () => toast('Ein Kinderbett, mitten in der Halle, zur Treppe gedreht. Das Laken ist frisch bezogen. Überall liegt Staub – nur hier nicht.', 5200)); } // STORY-HOOK: Mira
  candle('Candle_large_big_used_low001', H.x + 1.75, 0, H.z - .2, true); candle('Big_Wax_leak_low', H.x + 1.9, .001, H.z - .05, false); candle('Candle_small_used_low001', H.x + 3.4, 0, H.z - .25, false); candle('Thin_candle_used_low001', H.x + 1.6, 0, H.z + 1.3, false);
  // Zwei offene Regale neben der Haustür (Kerzen, Spielzeug, ein alter Fernseher)
  for (const [x, fill] of [[H.x - 4.8, 0], [H.x + 4.4, 1]]) try { const g = add((await msModel('wardrobe')).clone(true), x, wz0 + .27, -PI / 2);
    const lv = [.8, 1.45, 2.1].map(f => topOf(g, x, wz0 + .25, f)).filter(y => y > .05).sort((a, b) => a - b); if (!lv.length) continue;
    if (fill) { const tv = (await msModel('crt', 'model.glb')).clone(true); msFit(tv, .34, 'y'); add(tv, x - .3, wz0 + .26, .15 - PI / 2, lv[0]); /* QA 09.10.: crt-Bildschirm bei +x → nach vorn aus dem Regal */ candle('Candle_large_small_used_low002', x + .45, lv[1] ?? lv[0], wz0 + .25); candle('Thin_candle_used_low002', x + .25, lv[1] ?? lv[0], wz0 + .22); }
    else { at(part(tSrc, 'SM_ToyRobot', .01), x - .35, lv[1] ?? lv[0], wz0 + .25, .3); at(part(tSrc, 'SM_ToyBoat', .01), x + .3, lv[0], wz0 + .25, -.2); candle('Candle_small_used_low', x + .1, lv[2] ?? lv[0], wz0 + .24); } } catch (e) { console.warn('Halle Regal', e); }
  // Seilers Krankenbett: die letzten Monate hat er hier unten geschlafen, mit Blick auf die Treppe
  { const spec = { blanket: { b: 'blanket_color.jpg', n: 'blanket_nrm.jpg', r: 'blanket_rough.jpg', ds: 1, color: 0x8a8278 }, mattress: { b: 'mattress_color.jpg', n: 'mattress_nrm.jpg', r: 'mattresss_rough.jpg', color: 0xa8a094 }, bed: { b: 'bed_color.jpg', n: 'bed_nrm.jpg', r: 'bed_Rough.jpg', m: 'bed_metalic.jpg' } };
    const b = await safe(msFBX('hospbed', 'model.fbx', spec)); if (b) { b.scale.set(.009, .009, -.009); const g = add(b, H.x - 2.35, wz0 + 1.12, 0); S_.bett = g;
      interact(mesh1(g), () => typeof villa_hat === 'function' && villa_hat('nachbild') && !story.items.includes('dienstnadel') ? 'Krankenbett · die Strickjacke' : 'Krankenbett', () => { if (typeof villa_bett === 'function') return villa_bett(); toast('Ein Krankenbett, mitten im Erdgeschoss, zur Treppe gedreht. Seiler hat die letzten Monate hier unten geschlafen. In das Kopfteil sind acht Striche geritzt.', 5600); }); } // STORY-HOOK: Seiler (Strickjacke, Nachbild, Dienstnadel: villa.js)
    try { await anwesen_bettDeko(); } catch (e) { console.warn('Halle Bett-Deko', e); }
    add(await chair(), H.x - 3.5, wz0 + 1.6, PI / 2 + .3); candle('Candle_large_big_used_low', H.x - 1.55, 0, wz0 + .4, false);
    try { add((await msModel('trashcan')).clone(true), H.x - 1.6, wz0 + 2.3, .5); } catch (e) { console.warn('Halle trashcan', e); } }
  // Spielzeug auf der eingebrochenen Treppe, der Teddy wartet auf der vierten Stufe
  at(part(tSrc, 'SM_ToyTrain', .01), H.x - .9, .4, z1 - 3.6 + .38, .6); at(part(tSrc, 'SM_ToyCube_01a', .01), H.x + .6, .6, z1 - 3.6 + .76, .3);
  if (teddy) { msFit(teddy, .36, 'y'); const g = add(teddy, H.x + .7, z1 - 3.6 + 4 * .38 - .05, PI, 1.0);
    interact(mesh1(g), 'Teddy auf der Treppe', () => toast('Ein alter Teddy, sorgfältig auf die Stufe gesetzt. Mit dem Gesicht zur Tür. Er hat auf jemanden gewartet.', 4600)); }
  // Bilder an allen Wänden (schief, eines zerbrochen)
  for (const [k, sz, x, z, ry, y] of [['frame_deco', .9, H.x - 4.2, wz1 - .03, PI, 1.9], ['frame_dmg', 1.1, H.x + 4.2, wz1 - .03, PI, 1.75], ['frame_dmg', .8, H.x - 3.2, wz0 + .03, 0, 1.6], ['frame_deco', .7, H.x + 3.2, wz0 + .03, 0, 1.8], ['frame_deco', .7, wx1 - .03, H.z - 1, -PI / 2, 1.65]]) {
    const f = await put(k, 'model.gltf', sz, 'y', x, z, ry, y); if (f) f.rotation.z = rand(-.07, .07); }
  // Teppich unter dem Kinderbett, Spinnweben in den Ecken und am Buffet
  { const m = msSurfMat('wallpaper_fabric', { tint: 0x4a3e38 }); m.userData.tile = 1.3; m.polygonOffset = true; m.polygonOffsetFactor = -1; plane(4.2, 3, H.x + 1.5, .012, H.z + .3, m); }
  let cob = null; scene.traverse(m => { if (!cob && m.isMesh && m.material && m.material.transparent && m.material.map && m.material.color && m.material.color.getHex() === 0xd8d4c8 && m.geometry.type === 'BufferGeometry') cob = m; });
  if (cob) for (const [x, y, z, ry, s] of [[wx0 + .2, 5.8, wz0 + .2, -PI / 4, 1.4], [wx1 - .2, 5.8, wz0 + .2, PI / 4, 1.4], [wx0 + .2, 5.8, wz1 - .2, PI * 1.25, 1.5], [wx1 - .2, 5.8, wz1 - .2, -PI / 4, 1.5], [wx1 - .2, 2.3, H.z + 4.3, -PI / 4, .7], [wx0 + .2, 1.2, H.z + 2.2, PI * 1.25, .5]]) {
    const w = cob.clone(); w.position.set(x, y, z); w.rotation.set(0, ry, rand(-.3, .3)); w.scale.setScalar(.0105 * s); scene.add(w); }
}
async function anwesen_hallEnd() {
  const S = anwesen_S; if (S.hallDone) return;
  if (!(S.seen.has('ring') && S.seen.has('noten'))) return toast('Die Treppe, auf halber Höhe eingebrochen. Oben brennt Licht, gelb und ruhig, und manchmal atmet es. Da komm ich nicht hoch. Noch nicht.', 4600); // Fassung 3: erst nach W-11 (Ring) und den Noten
  S.hallDone = true; state.talking = true;
  try { await say([['Du stehst unten, wo die Stufen aufhören, und leuchtest hinauf. Das Licht oben atmet.', 4000], ['Über dir: Schritte. Kleine. Sie laufen einmal quer über den Flur und bleiben genau über der Treppe stehen.', 4600],
    ['Eine Spieluhr, dieselbe Melodie wie auf den Noten in deiner Hand. Und diesmal hörst du, der Tontechniker, dass sie nicht aus einer Spieluhr kommt: Es summt jemand.', 6000],
    ['Dann eine Frauenstimme. Ruhig. Sehr weit weg und ganz nah, als stünde jemand im Nebenzimmer eines anderen Jahrhunderts:', 4600], ['„Noch nicht, Luke. Aber bald.“', 3200, '?'],
    ['Whiskey, auf dem Geländer der Galerie, dreht den Kopf zum Licht und macht sich klein.', 3800], ['<i>Die Stimme kenn ich. Aus dem Traum.</i>', 3000, 'LUKE']]); } finally { state.talking = false; }
  saveGame(4); // Abbruch vor dem Knopf: Weiterspielen setzt in der Halle fort, das Ende lässt sich erneut auslösen
  // Kinosequenz K4 „Noch nicht“ (kino.js); ohne sie: Spieluhr und eine ruhige Schwarzblende
  if (typeof kino_play === 'function') { try { await kino_play('k4'); } catch (e) { console.error('Kino k4', e); } }
  else { if (Audio.musicBox) Audio.musicBox(); $('fade').style.background = '#000'; await fade(1, 1800); await wait(600); }
  anwesen_endcard();
}
// Endkarte Kapitel 4 (PK-H) mit dem Übergang zu Kapitel 5
function anwesen_endcard() {
  const ec = $('endcard'); state.ending = true; state.talking = false; Audio.hum(false);
  ec.querySelector('h1').textContent = 'KAPITEL 4 — ENDE · SEHEN, BERGEN, SCHWEIGEN'; // Titel bricht als Ganzes um (Fassung 3, wortgleich; Vertrauenszeile: AP-05)
  ec.querySelector('p').innerHTML = 'Sie haben ein Bett für dich gemacht.<br>Oben hat jemand deinen Namen gesagt, und es klang nicht nach einer Drohung.<br>Am Abend brennt Licht in eurem Elternhaus.';
  { let z = ''; try { const E = typeof lwo_kapitelende === 'function' ? lwo_kapitelende(4) : null, st = E ? E.stufe : 'mittel';
      z = (E && E.zeile) || (st === 'hoch' ? 'Whiskey hat dir Wolters Kugelschreiber aufs Kissen gelegt.' : st === 'miserabel' ? 'An deinem Fenster in Nr. 1 klebt Absperrband: GASLECK.' : ''); } catch (e) {}
    if (z) ec.querySelector('p').innerHTML += '<br><i>' + z + '</i>'; } // Vertrauenszeile (Endkarte Kap. 4, wörtlich)
  $('endStats').innerHTML = `SCHLÜSSELTEILE ${anwesen_count()} / 8 · FUNDE ${story.lore.length}`; ec.querySelector('.next').textContent = '';
  const b4 = ec.querySelector('.go4'); if (b4) b4.style.display = 'none';
  const go = ec.querySelector('.go'); go.style.display = ''; go.textContent = 'WEITER · KAPITEL 5 · ISS AUF, BRUDER';
  go.onclick = e => { e.stopPropagation(); go.onclick = null; anwesen_toCh5(); };
  document.exitPointerLock(); ui.overlay = 'endcard'; ec.classList.add('show'); document.body.classList.add('ov');
  $('fade').style.background = '#000'; $('fade').style.opacity = 0;
}
async function anwesen_toCh5() {
  const S = anwesen_S; S.inHall = false; S.pendingHall = false;
  if (typeof kapEnde === 'function') { try { kapEnde(4); } catch (e) { console.error('kapEnde(4)', e); saveFlag('ch5'); } } else saveFlag('ch5');
  if (typeof startChapter5 !== 'function') { location.reload(); return; } // Rückfall ohne Kapitel 5: Hauptmenü (Kapitel 5 ist freigeschaltet)
  $('endcard').classList.remove('show'); ui.overlay = null; document.body.classList.remove('ov'); state.ending = false;
  try { await startChapter5(); } catch (e) { console.error('Kapitel 5', e); location.reload(); }
}
// Endkarte von Kapitel 3: zusätzlicher Knopf „WEITER · KAPITEL 4“ (Fassung 3: alle Antworten münden in „Noch eine Runde“)
c3Endcard = (o => (...a) => { o(...a); let b = $('endcard').querySelector('.go4');
  if (!b) { b = document.createElement('div'); b.className = 'go go4'; b.style.marginBottom = '18px'; $('endcard').querySelector('.go').before(b); }
  b.style.display = ''; b.textContent = 'WEITER · KAPITEL 4';
  b.onclick = e => { e.stopPropagation(); b.style.display = 'none'; chapter4Begin(); }; })(c3Endcard);
WORLD_TICK.push((dt, t) => {
  const S = anwesen_S; if (!S.ready || !state.started) return; const P = player.pos; anwesen_f3Tick(dt, t);
  if (S.pressT > 0) { S.pressT -= dt; if (S.wheel) S.wheel.rotation.x += dt * 7; if (S.pressLight) S.pressLight.intensity = 1.2 + Math.random() * .6; if (S.pressT <= 0 && S.pressLight) S.pressLight.intensity = 0; }
  if (S.smoke) anwesen_smokeTick(S.smoke, dt, t, P);
  const dv = Math.hypot(P.x + 125, P.z - 66); if (dv > 45 || S.inHall) return;
  // flackernde Kerze hinter dem Fenster, die manchmal wandert
  if (S.flick) { S.fT = (S.fT || 0) - dt; if (S.fT < 0) { S.fT = rand(4, 11); S.flickOn = Math.random() < .6; } S.flick.intensity = S.flickOn ? .5 + Math.sin(t * 13) * .12 + Math.random() * .15 : Math.max(0, S.flick.intensity - dt); }
  // ein Kindergesicht am Fenster, nur wenn man gerade hinsieht, und nie länger als einen Atemzug
  if (S.face) { S.faceT -= dt; const f = S.face, d = Math.hypot(P.x - f.position.x, P.z - f.position.z);
    if (S.faceT < 0 && d > 7 && d < 28 && !state.talking) { camera.getWorldDirection(_anwFwd); const dx = f.position.x - camera.position.x, dz = f.position.z - camera.position.z, k = (_anwFwd.x * dx + _anwFwd.z * dz) / Math.hypot(dx, dz);
      if (k > .93) { S.faceT = rand(90, 160); S.faceShow = .5; Audio.whisper(f.position.x, 2, f.position.z, 1.2); } }
    if (S.faceShow > 0) { S.faceShow -= dt; f.material.opacity = S.faceShow > 0 ? .85 : 0; } }
});
WORLD_TICK.push((dt, t) => { const S = anwesen_S; if (!S.lanLight || !S.inHall) return; const b = S.upLight ? S.upLight.intensity / .9 : 1 + .0, f = (.78 + .22 * Math.sin(t * 1.3 + 1)) * b;
  S.lanLight.intensity = .9 * f; if (S.lanMat) S.lanMat.emissiveIntensity = .55 + .9 * f; if (S.lanGlow) S.lanGlow.material.opacity = .45 + .4 * f; });
const _anwFwd = new THREE.Vector3();
const anwesen_hand = s => '<span class="hand">' + s + '</span>';
// ---- Kapitel 4: Rauch aus dem Gully an der Kreuzung (PK-H). Kein Licht: Billboards als Instanzen (ein Zeichenaufruf), Form aus Rauschen im Shader
// (Machart wie der Rauch in feuer.js), vom Mond kaum, von der Taschenlampe sichtbar angestrahlt, im Nebel wie alles andere. Alles beim Laden angelegt,
// im Tick keine Zuweisungen. Dünn, langsam, vom Morgenwind die Straße entlang gezogen.
const ANW_GULLY = { x: 9, z: -1.3 };
const ANW_SMOKE_VS = `attribute vec3 iPos; attribute vec4 iD; varying vec2 vUv; varying float vAge, vSeed; varying vec3 vW;
  void main(){ vUv = uv; vAge = iD.y; vSeed = iD.w;
    vec3 r = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), u = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    float c = cos(iD.z), s = sin(iD.z); vec2 p = vec2(c * position.x - s * position.y, s * position.x + c * position.y);
    vW = iPos + (r * p.x + u * p.y) * iD.x; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`;
const ANW_SMOKE_FS = `uniform float uTime, uA, fogD; uniform vec3 uCol, fogC, flP, flD; uniform vec2 flK; varying vec2 vUv; varying float vAge, vSeed; varying vec3 vW;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
  float fb(vec2 p){ return n(p) * .5 + n(p * 2.03 + 1.7) * .3 + n(p * 4.11 + 3.1) * .2; }
  void main(){ vec2 q = vUv - .5; float r = length(q) * 2.;
    float n1 = fb(vUv * 1.9 + vec2(vSeed * 9., uTime * .05 + vAge * .7)), n2 = fb(vUv * 4.2 - vec2(uTime * .06 + vAge * .9, vSeed * 3.));
    float d = smoothstep(1., .05, r + (n1 - .5) * 1.1) * (.15 + .85 * n2 * n2 * n2);
    float dc = distance(vW, cameraPosition);
    float a = d * smoothstep(0., .18, vAge) * (1. - smoothstep(.3, 1., vAge)) * uA * smoothstep(.5, 1.8, dc) * smoothstep(0., .3, vW.y); if (a < .003) discard;
    vec3 L = vW - flP; float dl = max(length(L), .001), beam = flK.x * smoothstep(flK.y, flK.y + (1. - flK.y) * .5, dot(L / dl, flD)) / (1. + dl * dl * .06);
    vec3 col = uCol * (.7 + .5 * n1) + vec3(1., .96, .88) * beam * .3 * (.6 + .4 * n2);
    col = mix(col, fogC, 1. - exp(-fogD * fogD * dc * dc));
    gl_FragColor = vec4(col, min(a, .6)); }`;
function anwesen_smokeBuild() {
  const T = THREE, N = 44, pl = new T.PlaneGeometry(1, 1), g = new T.InstancedBufferGeometry(); g.index = pl.index; g.setAttribute('position', pl.attributes.position); g.setAttribute('uv', pl.attributes.uv);
  const ip = new T.InstancedBufferAttribute(new Float32Array(N * 3), 3), id = new T.InstancedBufferAttribute(new Float32Array(N * 4), 4); ip.setUsage(T.DynamicDrawUsage); id.setUsage(T.DynamicDrawUsage);
  g.setAttribute('iPos', ip); g.setAttribute('iD', id); g.instanceCount = 0; g.boundingSphere = new T.Sphere(new T.Vector3(ANW_GULLY.x + 1.5, 2, ANW_GULLY.z), 7);
  const FU = typeof fogUniforms !== 'undefined' ? fogUniforms : null;
  const u = { uTime: { value: 0 }, uA: { value: .19 }, uCol: { value: new T.Color(.034, .034, .037) }, fogC: { value: scene.fog.color }, fogD: { value: scene.fog.density },
    flP: FU ? FU.flP : { value: new T.Vector3() }, flD: FU ? FU.flD : { value: new T.Vector3(0, 0, -1) }, flK: FU ? FU.flK : { value: new T.Vector2() } };
  const mat = new T.ShaderMaterial({ uniforms: u, vertexShader: ANW_SMOKE_VS, fragmentShader: ANW_SMOKE_FS, transparent: true, depthWrite: false, fog: false });
  const m = new T.Mesh(g, mat); m.renderOrder = 11; m.userData.noCol = true; m.castShadow = false; m.receiveShadow = false; scene.add(m); // sichtbar lassen: Shader wird beim Laden übersetzt
  const F = () => new Float32Array(N), M = { m, g, ip, id, u, N, n: 0, acc: 0, rate: 3.0, on: false, chk: 0, said: false, x: F(), y: F(), z: F(), vx: F(), vy: F(), vz: F(), age: F(), life: F(), s0: F(), s1: F(), rot: F(), rv: F(), seed: F() };
  M.arr = [M.x, M.y, M.z, M.vx, M.vy, M.vz, M.age, M.life, M.s0, M.s1, M.rot, M.rv, M.seed]; anwesen_S.smoke = M; return M;
}
function anwesen_smokeEmit(M) {
  if (M.n >= M.N) return; const i = M.n++, a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * .28; // aus den Schlitzen des Deckels (ø 0,6 m)
  M.x[i] = ANW_GULLY.x + Math.cos(a) * r; M.y[i] = .06; M.z[i] = ANW_GULLY.z + Math.sin(a) * r; M.vx[i] = rand(-.03, .03); M.vy[i] = rand(.28, .42); M.vz[i] = rand(-.03, .03);
  M.age[i] = 0; M.life[i] = rand(6.5, 9.5); M.s0[i] = rand(.18, .28); M.s1[i] = rand(.9, 1.4); M.rot[i] = rand(0, 6.283); M.rv[i] = rand(-.25, .25); M.seed[i] = Math.random();
}
function anwesen_smokeTick(M, dt, t, P) {
  M.chk -= dt; if (M.chk <= 0) { M.chk = .5; const S = anwesen_S; M.on = S.ch4 && !S.inHall && !S.hallDone && (typeof kap === 'function' ? kap() : curChapter()) === 4; }
  // In Kapitel 4 fällt aus dem Gully kein warmes Laternenlicht mehr (Kapitel-3-Effekt in innen_kapitel.js): nur Rauch, kein Licht
  if (M.on && typeof innen_kapitel_S !== 'undefined' && innen_kapitel_S.gully) { const G = innen_kapitel_S.gully; G.light.intensity = 0; G.glow.visible = false; G.steam.visible = false; }
  const near = M.on && Math.abs(P.x - ANW_GULLY.x) < 70 && Math.abs(P.z - ANW_GULLY.z) < 70;
  if (!near && M.n === 0) { if (M.m.visible) { M.m.visible = false; M.g.instanceCount = 0; } return; }
  M.m.visible = true; M.u.uTime.value = t; M.u.fogD.value = scene.fog.density;
  if (near) { M.acc += dt * M.rate; while (M.acc >= 1) { M.acc -= 1; anwesen_smokeEmit(M); }
    if (!M.said && !state.talking && !ui.overlay && Math.hypot(P.x - ANW_GULLY.x, P.z - ANW_GULLY.z) < 6) { M.said = true; // Gedanke beim Nähern (PK-H)
      if (typeof gedanke === 'function') gedanke('k4_rauch', 'Rauch. Von ganz unten. Der Gang brennt noch.', 0, 3); else subtitle('Rauch. Von ganz unten. Der Gang brennt noch.', 4200, 'LUKE'); } }
  const ip = M.ip.array, id = M.id.array, A = M.arr, wx = .32 + Math.sin(t * .13) * .08, wz = -.05 + Math.sin(t * .09 + 1) * .05;
  for (let i = 0; i < M.n; i++) {
    M.age[i] += dt; if (M.age[i] >= M.life[i]) { const j = --M.n; if (i !== j) for (let k = 0; k < A.length; k++) A[k][i] = A[k][j]; i--; continue; }
    const k = M.age[i] / M.life[i], hw = Math.min(1, M.y[i] / 1.4); // der Wind greift erst über dem Boden
    M.vx[i] += (wx * hw + Math.sin(t * .8 + M.seed[i] * 17) * .05 - M.vx[i]) * dt * .7; M.vz[i] += (wz * hw + Math.cos(t * .7 + M.seed[i] * 11) * .05 - M.vz[i]) * dt * .7; M.vy[i] *= 1 - dt * .12;
    M.x[i] += M.vx[i] * dt; M.y[i] += M.vy[i] * dt; M.z[i] += M.vz[i] * dt; M.rot[i] += M.rv[i] * dt;
    ip[i * 3] = M.x[i]; ip[i * 3 + 1] = M.y[i]; ip[i * 3 + 2] = M.z[i]; id[i * 4] = M.s0[i] + (M.s1[i] - M.s0[i]) * (1 - (1 - k) * (1 - k)); id[i * 4 + 1] = k; id[i * 4 + 2] = M.rot[i]; id[i * 4 + 3] = M.seed[i];
  }
  M.g.instanceCount = M.n; if (M.n) { M.ip.needsUpdate = true; M.id.needsUpdate = true; }
}
if (typeof WHISKEY_ST !== 'undefined') WHISKEY_ST.push({ id: 'nest', at: [-39.62, 96.2], hover: 2.35, when: () => anwesen_S.ch4 && anwesen_count() < 8, done: () => anwesen_count() >= 8, talk: 'Whiskey hockt auf dem toten Baum hinter dem Friedhof, direkt über einem Nest voller Glitzerkram. Er sieht mich an, als hätte er für mich gesammelt.' });
window.__anw = { bett: o => anwesen_bettDeko(o), chapter4Begin, startChapter4, press: () => anwesen_press(), door: () => anwesen_door(), hallEnd: () => anwesen_hallEnd(), count: anwesen_count, endcard3: (...a) => c3Endcard(...a), S: anwesen_S, endcard4: () => anwesen_endcard(), smoke: () => anwesen_S.smoke ? { n: anwesen_S.smoke.n, on: anwesen_S.smoke.on, vis: anwesen_S.smoke.m.visible } : null }; // Testzugriff

// =====================================================================  Fassung 3 (AP-15): „Das winkende Fenster“ (Tor der Villa Seiler) – seit der Story-Prüfung (H-6) eine Nebenaufgabe von Kapitel 3
// Kette mit acht Vorhängeschlössern (eines neuer), Kiesweg ohne Spur, vollgestopfter Briefkasten („EMPFÄNGER VERSTORBEN – ZURÜCK“); im ersten Stock winkt in einem
// dunklen Fenster eine kleine, blasse Hand, langsam, wie am Bahnsteig. Lampe drauf: sie hört auf; Lampe weg: sie winkt wieder; beim dritten Mal im Fenster daneben.
const anwesen_F3 = { hand: null, fenster: [], i: 0, winkt: false, mal: 0, t: 0, schloesser: false, kasten: false };
function anwesen_f3Bau() { const F = anwesen_F3, OW = ausbau_ost_west_OW, T = THREE; window.__anwF3 = F; // Testzugriff
 if (!OW || !OW.villaGlass) return;
  // die dunklen Fenster im ersten Stock (Richtung Tor), das nähere zur Treppe als zweites
  F.fenster = OW.villaGlass.filter(m => m.position.y > 5).sort((a, b) => a.position.distanceTo(new T.Vector3(-125, 6, 57)) - b.position.distanceTo(new T.Vector3(-125, 6, 57))).slice(0, 2);
  if (!F.fenster.length) return;
  const tex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 192; const g = c.getContext('2d'); g.clearRect(0, 0, 128, 192); g.filter = 'blur(2.5px)'; g.fillStyle = 'rgba(214,218,222,.78)';
    g.beginPath(); g.ellipse(64, 120, 26, 34, 0, 0, 7); g.fill(); for (let f = 0; f < 4; f++) { g.beginPath(); g.ellipse(40 + f * 16, 62 - Math.abs(f - 1.5) * 6, 7, 26, (f - 1.5) * .12, 0, 7); g.fill(); } g.beginPath(); g.ellipse(94, 108, 7, 20, -.7, 0, 7); g.fill(); g.fillRect(50, 140, 30, 52);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  const hand = new T.Mesh(new T.PlaneGeometry(.3, .45), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: .9, color: 0xe8ecf0, fog: false })); hand.geometry.translate(0, .22, 0); hand.userData.noCol = true;
  const piv = new T.Group(); piv.add(hand); scene.add(piv); F.hand = piv; F.handM = hand; anwesen_f3Setze(0); piv.visible = false;
  // acht Vorhängeschlösser an der Kette, eines neuer (Abziehbilder auf der Kette)
  const lockTx = neu => { const c = document.createElement('canvas'); c.width = 64; c.height = 80; const g = c.getContext('2d'); g.clearRect(0, 0, 64, 80); g.strokeStyle = neu ? '#b8b8b0' : '#6a5a48'; g.lineWidth = 6; g.beginPath(); g.arc(32, 26, 14, PI, 0); g.lineTo(46, 36); g.moveTo(18, 26); g.lineTo(18, 36); g.stroke();
    const gr = g.createLinearGradient(0, 34, 0, 76); gr.addColorStop(0, neu ? '#d8c888' : '#8a7040'); gr.addColorStop(1, neu ? '#a08840' : '#4a3a20'); g.fillStyle = gr; g.fillRect(10, 34, 44, 40); g.fillStyle = '#1a140c'; g.fillRect(30, 48, 4, 12); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; };
  const tOld = lockTx(false), tNew = lockTx(true); for (let i = 0; i < 8; i++) { const m = new T.Mesh(new T.PlaneGeometry(.075, .095), new T.MeshStandardMaterial({ map: i === 5 ? tNew : tOld, transparent: true, alphaTest: .1, roughness: i === 5 ? .3 : .7, metalness: .6, side: T.DoubleSide }));
    m.position.set(-125.22 + i * .065, 1.02 + Math.sin(i * 1.7) * .04, 56.87); m.rotation.set(0, PI, (i - 3.5) * .08); m.userData.noCol = true; scene.add(m); }
  // Briefkasten an der Mauer, vollgestopft, Klappe klemmt; obenauf „EMPFÄNGER VERSTORBEN – ZURÜCK“ (SB-06 liegt ab Kap. 3 hier, AP-18)
  const ktx = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#e8e0c8'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#a01818'; g.lineWidth = 4; g.strokeRect(14, 24, 228, 56); g.fillStyle = '#a01818'; g.font = 'bold 21px Arial'; g.textAlign = 'center'; g.fillText('EMPFÄNGER VERSTORBEN', 128, 50); g.fillText('– ZURÜCK –', 128, 74); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  const k = new T.Mesh(new T.PlaneGeometry(.26, .13), new T.MeshStandardMaterial({ map: ktx, roughness: .9 })); k.position.set(-121.9, 1.32, 56.66); k.rotation.set(-.2, PI, .06); k.userData.noCol = true; scene.add(k);
  const kh = box(.5, .5, .4, -121.9, 1.2, 56.6, hidden, { cast: false }); interact(kh, 'Briefkasten der Villa', () => { F.kasten = true; kirchberg_start('anw_fenster', { x: -125, z: 54 }); toast('Vollgestopft, die Klappe klemmt. Obenauf ein Umschlag mit rotem Stempel: EMPFÄNGER VERSTORBEN – ZURÜCK.', 4600); anwesen_f3Check(); });
}
function anwesen_f3Setze(i) { const F = anwesen_F3, W = F.fenster[Math.min(i, F.fenster.length - 1)]; if (!W) return; const n = new THREE.Vector3(0, 0, 1).applyQuaternion(W.quaternion);
  F.hand.position.copy(W.position).addScaledVector(n, .012); F.hand.position.y -= .28; F.hand.quaternion.copy(W.quaternion); F.hand.position.x += (i ? .12 : -.18); }
function anwesen_f3Schloesser() { const F = anwesen_F3; F.schloesser = true; kirchberg_start('anw_fenster', { x: -125, z: 54 });
  say([['Acht. Entweder da drin ist was sehr Wertvolles, oder was, das nicht rauswill.', 4200, 'LUKE']]).then(() => wait(900)).then(() => say([['Oder beides. Hier ist ja immer beides.', 2800, 'LUKE']])).then(() => anwesen_f3Check()); }
function anwesen_f3Check() { const F = anwesen_F3; kirchberg_desc('anw_fenster', `Acht Schlösser, ein voller Briefkasten, ein Fenster im ersten Stock. (${[F.schloesser, F.kasten, F.mal >= 3].filter(Boolean).length}/3)`);
  if (F.schloesser && F.mal >= 3) { kirchberg_fertig('anw_fenster', 'Der Rabe hat einen Laut gemacht, den er bei Kindern macht.'); if (!story.lore.some(l => l.key === 'anw_villa_k1')) story.lore.push({ key: 'anw_villa_k1', title: 'Die Villa', html: 'Acht Schlösser an der Kette, eines neuer. Oben winkt eine kleine, blasse Hand, wie am Bahnsteig. Der Rabe hat einen Laut gemacht, den er bei Kindern macht.' });
    if (typeof karte_markierung === 'function') try { karte_markierung(-125, 66, 'ort', 'Die Villa'); } catch (e) {} } }
const anwesen_v = new THREE.Vector3();
function anwesen_f3Tick(dt, t) { const F = anwesen_F3; if (!F.hand) return; const P = player.pos, d = Math.hypot(P.x + 125, P.z - 60), k1 = kap() === 3 && (typeof ch3 === 'undefined' || !ch3.part || ch3.part === 'town'); // H-6 (Story-Prüfung): die Hand winkt erst in der offenen Nacht von Kap. 3
  if (!k1 || d > 32 || P.z > 57.5) { F.hand.visible = false; return; }
  if (!F.start && d < 16) { F.start = true; kirchberg_start('anw_fenster', { x: -125, z: 54 }); if (!F.laut) { F.laut = true; setTimeout(() => { if (typeof whiskey_mimic === 'function') whiskey_mimic('gurren', { force: true }); setTimeout(() => subtitle('Ich war nie hier. Und trotzdem weiß ich, wo der Weg langgeht.', 3800, 'LUKE'), 1600); }, 2500); } }
  F.hand.visible = true; const W = F.hand.position; anwesen_v.set(W.x - camera.position.x, W.y + .15 - camera.position.y, W.z - camera.position.z).normalize(); const licht = flashOn && fwd.dot(anwesen_v) > .985;
  if (licht) { if (F.winkt && F.t > 1.2) { F.winkt = false; F.mal++; F.t = 0; if (F.mal === 2) { F.wechsel = true; } anwesen_f3Check(); } }
  else if (!F.winkt) { F.t += dt; if (F.t > .8) { F.winkt = true; F.t = 0; if (F.wechsel) { F.wechsel = false; F.i = 1; anwesen_f3Setze(1); } } }
  else F.t += dt;
  const ziel = F.winkt ? Math.sin(t * 1.6) * .38 : 0; F.hand.rotation.z = F.hand.rotation.z * .9 + ziel * .1; F.handM.material.opacity = .82 * (F.winkt ? 1 : .55); }

// QA Kap. 4: Trennornament oben lief bei der langen Karte mit "BISHER" durch die erste Textzeile
try { const st = document.createElement('style'); st.textContent = '#introSeq:has(#intro > p:first-child[style*="8b7f68"])::before { display: none; }'; document.head.appendChild(st); } catch (e) {}
