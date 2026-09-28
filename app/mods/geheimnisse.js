// =====================================================================  GEHEIMNISSE (Modul „geheimnisse“): Spielsachen des Kindes im Licht – drei Sammelreihen, die sich gegenseitig verraten
// · 7 Lichtsteine: Kiesel (Felsen-Scan) mit glimmenden Adern. NUR sichtbar, wenn die Taschenlampe aus ist – das Kind versteckt sich vor dem Licht.
//   Jeder flüstert eine Zahl (das Kind zählt). Alle sieben: Neben-Twist „Das Versteck“.
// · 5 Wrackteile: verbogenes Rostblech (Scan-Oberfläche) mit eingedrückten Kinderhänden. Zusammen: das Wappen vom Hohen Abgrund.
// · 4 Zähl-Totems (Holzmast-Scan, Teddy-Scan, Kerzen) an den Welträndern: drehen sich zu dir, wenn du wegsiehst (Regel der Grauen).
//   Alle vier: Kreide-Hinweise, wo die Lichtsteine liegen.
// Fortschritt steckt in story.lore (wird mit dem Spielstand gespeichert). Unreal-Modelle aus unreal/Export_Requisiten.bat ersetzen die Zusammenbauten.
const geheimnisse_S = { ready: false, stones: [], wrecks: [], totems: [], litHint: false, t: 0 };
const geheimnisse_has = k => story.lore.some(l => l.key === k);
const GEHEIM_STONES = [ // [x, z, Ort-Hinweis]
  [-12.2, -9.4, 'Wo Roxy verbrannte.'], [3.4, -39.6, 'Wo Lucy gewartet hat.'], [-61.6, 89.8, 'Wo die Toten zählen.'], [31, 71.5, 'Wo die Schaukel quietscht.'],
  [126.5, 12.5, 'Wo es nach Benzin riecht.'], [-115.5, 21.5, 'Wo Hilde gegärtnert hat.'], [-128.5, -29.5, 'Wo die Pferde fehlen.']];
const GEHEIM_WORDS = ['eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben'];
const GEHEIM_WRECKS = [
  [-4.6, 4.2, 'Verbogenes Blech, verrußt und eiskalt. Darin eingedrückt: zwei Kinderhände. Von innen.'],
  [-7.2, 37, 'Kein Flugzeugteil. Die Nieten sind von Hand geschmiedet.'],
  [128, -36, 'Unter dem Rost ein Stempel: ein Turm über einem Abgrund.'],
  [-145, 6, 'Das Blech ist gewölbt wie ein Brustpanzer. Zu klein für einen Mann. Genau richtig für ein Kind.'],
  [50, 88, 'Das letzte Stück passt an die anderen, als hätte es darauf gewartet.']];
const GEHEIM_TOTEMS = [[-150, 40], [136, 30], [-20, 92], [100, -38]]; // Westrand · hinter der Tankstelle · Kirchberg oben · südlich des Schrottplatzes
// Glimmende Adern: Höhenkarte des Felsen-Scans invertiert → Risse leuchten, pulsierend (gemeinsame Uniform für alle Steine)
const geheimnisse_glow = { value: 1 };
function geheimnisse_glowMat(src, hTex) {
  const m = src.clone(); m.emissive = new THREE.Color(0xcfe6ff); m.emissiveIntensity = 1;
  m.onBeforeCompile = sh => { sh.uniforms.hMap = { value: hTex }; sh.uniforms.glow = geheimnisse_glow;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D hMap; uniform float glow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_MAP\n totalEmissiveRadiance *= pow(1.0 - texture2D(hMap, vMapUv).r, 4.0) * 5.0 * glow;\n#endif'); };
  m.customProgramCacheKey = () => 'geheim_glow'; return m;
}
// Rostblech, verbogen und zerknittert (Scan-Oberfläche auf verformter Fläche), mit Kinderhänden als Prägung
function geheimnisse_plate(mat, handMat) {
  const g = new THREE.PlaneGeometry(1.1, .75, 16, 12), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin(x * 2.6) * .12 + Math.cos(y * 3.1 + x) * .05 + (Math.random() - .5) * .025); }
  g.computeVertexNormals(); const o = new THREE.Group(), m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; o.add(m);
  const h = new THREE.Mesh(new THREE.PlaneGeometry(.42, .3), handMat); h.position.set(.05, .02, .14); o.add(h); return o;
}
WORLD_MODS.push(['Geheimnisse', async () => {
  const S = geheimnisse_S, V = THREE.Vector3;
  story.side.geh_steine = { title: 'Die sieben Zähler', desc: 'Kleine Steine, die im Dunkeln glimmen. Mach das Licht aus.', state: 'hidden' };
  story.side.geh_wrack = { title: 'Blech vom Himmel', desc: 'Verbogene Metallteile, dort wo das Licht war.', state: 'hidden' };
  story.side.geh_totem = { title: 'Die Zählgestelle', desc: 'Jemand hat an den Rändern von Lost Eyengless etwas aufgestellt.', state: 'hidden' };
  // --- Lichtsteine
  try {
    const rock = await msModel('../boulder', 'model.gltf'), hTex = msTex('../boulder/T_wfstcdnaw_1K_H.jpg', false);
    let srcMat = null; rock.traverse(m => { if (m.isMesh && !srcMat) srcMat = [].concat(m.material)[0]; }); const gm = geheimnisse_glowMat(srcMat, hTex);
    GEHEIM_STONES.forEach(([x, z, hint], i) => {
      const o = msGround(msFit(rock.clone(true), .2, 'max')); o.traverse(m => { if (m.isMesh) { m.material = gm; m.castShadow = false; } }); o.userData.noCol = true;
      o.position.set(x, -.03, z); o.rotation.y = i * 1.7; o.visible = false; scene.add(o);
      const hit = box(.5, .4, .5, x, .15, z, hidden, { cast: false }); uninteract(hit);
      const key = 'geh_stein_' + i; S.stones.push({ o, hit, key, i, hint, on: false });
      interact(hit, 'Glimmenden Stein aufheben', () => geheimnisse_takeStone(S.stones[i])); uninteract(hit);
    });
  } catch (e) { console.warn('Geheimnisse: Steine', e); }
  // --- Wrackteile
  try {
    const wr = msSurfMat('rust_sheet', { tint: 0x8a8078 }); wr.side = THREE.DoubleSide;
    const hc = document.createElement('canvas'); hc.width = 256; hc.height = 180; const c = hc.getContext('2d');
    c.fillStyle = 'rgba(20,14,10,.55)'; for (const [cx, cy, s] of [[80, 95, 1], [170, 88, .95]]) { c.save(); c.translate(cx, cy); c.scale(s, s);
      c.beginPath(); c.ellipse(0, 18, 26, 30, 0, 0, 7); c.fill(); for (let f = 0; f < 5; f++) { c.beginPath(); c.ellipse(-24 + f * 12, -22 + Math.abs(f - 2) * 6, 5, 16, (f - 2) * .18, 0, 7); c.fill(); } c.restore(); }
    const ht = new THREE.CanvasTexture(hc); ht.colorSpace = THREE.SRGBColorSpace;
    const hm = new THREE.MeshStandardMaterial({ map: ht, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4 });
    const ueWreck = await ausruestung_ue('wrack', 1.2);
    GEHEIM_WRECKS.forEach(([x, z, text], i) => {
      const o = ueWreck ? ueWreck.clone(true) : geheimnisse_plate(wr, hm); o.position.set(x, .06, z); o.rotation.set(-PI / 2 + .25, i * 1.3, .15); o.userData.noCol = true; scene.add(o);
      const hit = box(1.1, .5, .9, x, .25, z, hidden, { cast: false }), key = 'geh_wrack_' + i; S.wrecks.push({ o, key, i });
      interact(hit, () => geheimnisse_has(key) ? 'Metallteil' : 'Metallteil untersuchen', () => geheimnisse_wreck(i, text, key));
    });
  } catch (e) { console.warn('Geheimnisse: Wrack', e); }
  // --- Zähl-Totems
  try {
    const pole = await msModel('pole_old'), bear = await msModel('teddy_scan', 'model.glb');
    const cs = await msFBX('candles', 'model.fbx', { Used_candles: { b: 'Used_candles_BaseColor.jpg', n: 'Used_candles_Normal.jpg', r: 'Used_candles_Roughness.jpg' }, Candles_new: { b: 'Candles_new_BaseColor.jpg', n: 'Candles_new_Normal.jpg', r: 'Candles_new_Roughness.jpg' }, Extra_for_candles: { b: 'Extra_for_candles_BaseColor.jpg', r: 'Extra_for_candles_Roughness.jpg' } });
    const ueTotem = await ausruestung_ue('totem', 1.9);
    GEHEIM_TOTEMS.forEach(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      if (ueTotem) g.add(ueTotem.clone(true));
      else { const p = msGround(msFit(pole.clone(true), 1.9, 'y')); g.add(p); const b = msGround(msFit(bear.clone(true), .34, 'max')); b.position.set(0, 1.18, .07); b.rotation.x = -.25; g.add(b);
        for (let k = 0; k < 3; k++) { const cc = msGround(msFit(cs.clone(true), .16, 'y')); cc.position.set(Math.cos(k * 2.1) * .35, 0, Math.sin(k * 2.1) * .35); g.add(cc); } }
      g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); g.userData.noCol = true;
      const l = new VLight(0xffa860, .6, 3.5, 2); l.position.set(x, .4, z); scene.add(l);
      const hit = box(.8, 1.9, .8, x, .95, z, hidden, { cast: false }), key = 'geh_totem_' + i; S.totems.push({ g, key, i, seen: true, turned: 0 });
      interact(hit, () => geheimnisse_has(key) ? 'Zählgestell' : 'Zählgestell ansehen', () => geheimnisse_totem(i, key));
    });
  } catch (e) { console.warn('Geheimnisse: Totems', e); }
  S.ready = true;
}]);
function geheimnisse_takeStone(s) {
  if (!s.on || geheimnisse_has(s.key)) return; story.lore.push({ key: s.key, title: 'Lichtstein · ' + GEHEIM_WORDS[s.i], html: `Ein kleiner Stein, warm wie eine Hand. Im Dunkeln leuchten seine Risse.\n\n${s.hint}` });
  s.o.visible = false; uninteract(s.hit); sideStart('geh_steine');
  const n = geheimnisse_S.stones.filter(x => geheimnisse_has(x.key)).length; story.side.geh_steine.desc = `Lichtsteine: ${n} / 7. Sie zeigen sich nur im Dunkeln.`;
  Audio.whisper(s.o.position.x + 1, 1.4, s.o.position.z, 1.4); toast(`Der Stein ist warm. Ganz nah, eine Kinderstimme: „… ${GEHEIM_WORDS[n - 1]} …“`, 4200);
  if (n === 7) setTimeout(() => { sideDone('geh_steine', 'Alle sieben Zähler gefunden.'); // STORY-HOOK: Neben-Twist „Das Versteck“ (Ende B: wer gefunden wird, muss zählen)
    openNote('Das Versteck', 'Sieben Steine, sieben Zahlen. Wer bis sieben zählt, sucht.\n\nAber sie hat nie gesucht. Sie hat sich versteckt – 1312, im Licht, unter der Birke am Anger. Keiner hat sie gefunden.\n\n<span class="hand">Beim Versteckspiel gilt: Wer gefunden wird, muss zählen.</span>', 'geh_versteck');
    setTimeout(() => subtitle('<i>… gefunden. Jetzt zählst du …</i>', 4200), 800); }, 4600);
}
function geheimnisse_wreck(i, text, key) {
  if (geheimnisse_has(key)) return toast(text, 3600);
  story.lore.push({ key, title: 'Blech vom Himmel · ' + (i + 1), html: text }); sideStart('geh_wrack'); Audio.play('metalSheet', { gain: .35, rate: .8 });
  const n = geheimnisse_S.wrecks.filter(x => geheimnisse_has(x.key)).length; story.side.geh_wrack.desc = `Metallteile: ${n} / 5.`; toast(text, 5200);
  if (n === 5) setTimeout(() => { sideDone('geh_wrack', 'Alle fünf Teile gefunden.'); // STORY-HOOK: Fallwand-Frage „Was ist das Ding am Himmel?“ – bewusst offen
    openNote('Das Wappen', 'Fünf Teile, von Hand geschmiedet. Auf jedem derselbe Stempel: ein Turm über einem Abgrund. Das Wappen vom Hohen Abgrund.\n\nZusammengelegt ergeben sie den Rücken einer Rüstung. Klein. Kindergröße.\n\n<span class="hand">Was da über Lost Eyengless schwebt, hat jemand aus Eisen gebaut, das sein Kind tragen sollte. Oder es sich so erträumt.</span>', 'geh_wappen'); }, 5400);
}
function geheimnisse_totem(i, key) {
  const lines = ['Äste, mit roter Schnur gebunden. Sieben Knoten. Ein achter ist abgeschnitten – frisch.', 'Oben ein Teddy, festgebunden, das Gesicht zum Wald. Eben hat er noch zu dir gesehen.', 'In die Rinde geritzt: Striche. Sieben Gruppen. Die letzte ist nicht fertig.', 'Die Kerzen brennen. Niemand ist hier. Das Wachs ist noch weich.'];
  if (geheimnisse_has(key)) { if (!(typeof visionen_totem === 'function' && visionen_totem(i))) toast(lines[i], 3600); return; }
  story.lore.push({ key, title: 'Zählgestell · ' + (i + 1), html: lines[i] }); sideStart('geh_totem'); toast(lines[i], 4800); Audio.creak(.16); // Berührung: Vision (Modul visionen)
  if (typeof visionen_totem === 'function') setTimeout(() => visionen_totem(i), 1400);
  const n = geheimnisse_S.totems.filter(x => geheimnisse_has(x.key)).length; story.side.geh_totem.desc = `Zählgestelle: ${n} / 4.`;
  if (n === 4) setTimeout(() => { sideDone('geh_totem', 'Alle vier gefunden. Auf der Rückseite: Kreide.'); sideStart('geh_steine');
    openNote('Kreide auf den Gestellen', 'Auf die Rückseiten hat jemand mit Kreide geschrieben. Kinderschrift, in einer Reihe:\n\n' + GEHEIM_STONES.map(s => '· ' + s[2]).join('\n') + '\n\n<span class="hand">Mach das Licht aus. Dann siehst du uns.</span>', 'geh_kreide'); }, 5000);
}
WORLD_TICK.push((dt, t) => {
  const S = geheimnisse_S; if (!S.ready) return; S.t -= dt; geheimnisse_glow.value = .55 + .45 * Math.sin(t * 1.3) * Math.sin(t * .37 + 1);
  const P = player.pos, dark = !flashOn || FLASH.charge <= 0 || state.flashFail > 0;
  for (const s of S.stones) { const want = dark && !geheimnisse_has(s.key); if (want !== s.on) { s.on = want; s.o.visible = want; if (want) { if (!interactables.includes(s.hit)) interactables.push(s.hit); } else uninteract(s.hit); }
    if (want && !S.litHint && Math.hypot(s.o.position.x - P.x, s.o.position.z - P.z) < 12) { S.litHint = true; subtitle('Da. Im Dunkeln. Am Boden glimmt etwas – als hätte es nur gewartet, bis du das Licht ausmachst.', 5000); } }
  // Totems: drehen sich zu dir, sobald du wegsiehst (nur in der Nähe)
  camera.getWorldDirection(_geheimFwd);
  for (const T of S.totems) { const dx = T.g.position.x - P.x, dz = T.g.position.z - P.z, d = Math.hypot(dx, dz); if (d > 28) continue;
    const looking = (_geheimFwd.x * dx + _geheimFwd.z * dz) / d > .45;
    if (!looking && T.seen) { const want = Math.atan2(-dx, -dz); if (Math.abs(want - T.g.rotation.y) > .3) { T.g.rotation.y = want; if (d < 15) Audio.play('woodSqueak1', { gain: .12, rate: .6, x: T.g.position.x, y: 1.2, z: T.g.position.z, ref: 3 }); } }
    T.seen = looking; }
});
const _geheimFwd = new THREE.Vector3();
