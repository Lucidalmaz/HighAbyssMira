// =====================================================================  GEHEIMNISSE (Modul „geheimnisse“): Spielsachen des Kindes im Licht – drei Sammelreihen, die sich gegenseitig verraten
// · 7 Lichtsteine: Kiesel (Felsen-Scan) mit glimmenden Adern. NUR sichtbar, wenn die Taschenlampe aus ist – das Kind versteckt sich vor dem Licht.
//   Jeder flüstert eine Zahl (das Kind zählt). Fassung 3 (AP-18, Kap. 3 Nebenaufgabe 14 „Warm wie eine Hand“): nur in Kap. 3 ab UK 5 bis zur vierten Laterne
//   (neben3_offen); Splitter der Schiffshaut. RH-10: Stein in der Tasche + Justin < 5 m → leiser Summton (Audio, kein Licht) und vier Zeilen. Der vierte Stein
//   flüstert direkt hinter Luke; Whiskey schnappt sich einmal einen glimmenden Stein und lässt ihn fallen, sobald die Lampe angeht. Ein Stein bleibt im Inventar.
// · 5 Wrackteile: verbogenes Rostblech (Scan-Oberfläche) mit eingedrückten Kinderhänden. Zusammen: das Wappen vom Hohen Abgrund.
// · 4 Zähl-Totems (Holzmast-Scan, Teddy-Scan, Kerzen) an den Welträndern: drehen sich zu dir, wenn du wegsiehst (Regel des Graukinds).
//   Alle vier: Kreide-Hinweise, wo die Lichtsteine liegen.
// Fortschritt steckt in story.lore (wird mit dem Spielstand gespeichert). Unreal-Modelle aus unreal/Export_Requisiten.bat ersetzen die Zusammenbauten.
const geheimnisse_S = { ready: false, stones: [], wrecks: [], totems: [], litHint: false, t: 0, humOn: false, humG: null, rhBusy: false, wk: null, wkMesh: null, chk: 0 };
const geheimnisse_has = k => story.lore.some(l => l.key === k);
const GEHEIM_STONES = [ // [x, z, Ort-Hinweis]
  [-12.2, -9.4, 'Wo Roxy Feuer gemacht hat.'], [3.4, -39.6, 'Wo Lucy gewartet hat.'], [-61.6, 89.8, 'Wo die Toten zählen.'], [31, 71.5, 'Wo die Schaukel quietscht.'],
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
  story.side.geh_steine = { title: 'Warm wie eine Hand', desc: 'Kleine Steine, die im Dunkeln glimmen. Mach das Licht aus.', state: 'hidden' };
  modItem('geh_lichtstein', 'Ein Lichtstein', 'Ein kleiner Stein, warm wie eine Hand. Hart, matt, grauweiß. Innen Adern, die im Dunkeln leuchten.', 'paper');
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
    { const o = msFit(rock.clone(true), .2, 'max'); o.traverse(m => { if (m.isMesh) { m.material = gm; m.castShadow = false; } }); o.userData.noCol = true; o.visible = false; scene.add(o); S.wkMesh = o; } // Whiskeys Beute (Humor)
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
      const hit = box(.8, 1.9, .8, x, .95, z, hidden, { cast: false }), key = 'geh_totem_' + i; S.totems.push({ g, key, i, seen: true, turned: 0, l, flare: 0, nah: false });
      interact(hit, () => geheimnisse_has(key) ? 'Zählgestell berühren' : 'Zählgestell berühren', () => geheimnisse_totem(i, key));
    });
  } catch (e) { console.warn('Geheimnisse: Totems', e); }
  S.ready = true;
}]);
function geheimnisse_takeStone(s) {
  if (!s.on || geheimnisse_has(s.key)) return; story.lore.push({ key: s.key, title: 'Lichtstein · ' + GEHEIM_WORDS[s.i], html: `Ein kleiner Stein, warm wie eine Hand. Im Dunkeln leuchten seine Risse.\n\n${s.hint}` });
  s.o.visible = false; uninteract(s.hit); if (typeof neben3_start === 'function') neben3_start('geh_steine', { x: s.o.position.x, z: s.o.position.z }); else sideStart('geh_steine'); addItem('geh_lichtstein');
  const n = geheimnisse_S.stones.filter(x => geheimnisse_has(x.key)).length, desc = `Lichtsteine: ${n} / 7. Sie zeigen sich nur im Dunkeln.`;
  if (typeof neben3_desc === 'function') neben3_desc('geh_steine', desc); else story.side.geh_steine.desc = desc;
  if (n === 4) { const P = player.pos, yw = player.yaw; Audio.whisper(P.x + Math.sin(yw) * .55, 1.45, P.z + Math.cos(yw) * .55, 1.6); toast(`Der Stein ist warm. Direkt hinter dir, eine Kinderstimme: „… ${GEHEIM_WORDS[n - 1]} …“`, 4600); } // Schreck (1): nicht vor Luke, hinter ihm
  else { Audio.whisper(s.o.position.x + 1, 1.4, s.o.position.z, 1.4); toast(`Der Stein ist warm. Ganz nah, eine Kinderstimme: „… ${GEHEIM_WORDS[n - 1]} …“`, 4200); }
  if (n < 7) setTimeout(() => geheimnisse_whiskeyWill(s), 1600);
  if (n === 7) setTimeout(() => { if (typeof neben3_fertig === 'function') neben3_fertig('geh_steine', 'Sieben Steine, sieben Zahlen. Einer ist noch in deiner Tasche.'); else sideDone('geh_steine', 'Sieben Steine, sieben Zahlen.');
    openNote('Warm wie eine Hand', 'Sieben Steine, sieben Zahlen. Sie zählt.\nSie sind warm, und sie summen, wenn er in der Nähe ist.\nDie Männer am Rand sammeln das Zeug in Kisten. Die denken, es ist Beute.\nEs ist Haut.', 'geh_haut'); }, 4600);
}
// ---- RH-10: Stein in der Tasche und Justin näher als 5 m → Stein und Rüstung summen im selben Ton (nur Ton, kein Licht)
function geheimnisse_hum(on) { const S = geheimnisse_S, A = Audio; if (!A.ctx || S.humOn === on) return; S.humOn = on;
  if (!S.humG) { if (!on) return; const c = A.ctx; S.humG = c.createGain(); S.humG.gain.value = 0; S.humG.connect(A.master);
    for (const [f, g] of [[98, .5], [98.6, .42], [196.3, .16], [294.2, .05]]) { const o = c.createOscillator(), gg = c.createGain(); o.type = 'sine'; o.frequency.value = f; gg.gain.value = g; o.connect(gg); gg.connect(S.humG); o.start(); } } // zwei fast gleiche Töne: Schwebung
  const t = A.ctx.currentTime; S.humG.gain.cancelScheduledValues(t); S.humG.gain.setValueAtTime(S.humG.gain.value, t); S.humG.gain.setTargetAtTime(on ? .045 : 0, t, on ? 1.1 : .45); }
async function geheimnisse_rh10() { const S = geheimnisse_S; if (S.rhBusy) return; S.rhBusy = true; const was = state.talking; state.talking = true;
  try { await wait(2200); await say([['„Das ist kein Netzbrummen. Das ist ein Ton, den ich noch nie gemischt hab. Und ihr zwei macht ihn zusammen.“', 5600, 'LUKE'], ['„Der fällt von ihr ab, wenn es aufgeht.“', 3600, 'JUSTIN'], ['„Und deine Rüstung?“', 2400, 'LUKE']]);
    await wait(1800); await say([['„Auch.“', 2400, 'JUSTIN']]); } finally { if (!was) state.talking = false; }
  if (typeof neben3_rh === 'function') neben3_rh('RH-10'); else if (typeof justin_rh === 'function') justin_rh('RH-10'); }
function geheimnisse_rhTick() { const S = geheimnisse_S; if (!Audio.ctx) return;
  const near = kap() === 3 && story.items.includes('geh_lichtstein') && typeof justin !== 'undefined' && justin.g.visible && !state.inBasement && Math.hypot(justin.g.position.x - player.pos.x, justin.g.position.z - player.pos.z) < 5;
  geheimnisse_hum(near); if (near && !S.rhBusy && !state.talking && !ui.overlay && !(ch3.armorHints && ch3.armorHints.has('RH-10'))) geheimnisse_rh10(); }
// ---- Humor: Whiskey will den glimmenden Stein; wenn die Lampe angeht, glimmt er nicht mehr – dann ist er uninteressant (einmal)
function geheimnisse_whiskeyWill(s) { const S = geheimnisse_S, W = typeof whiskey_S !== 'undefined' ? whiskey_S : null;
  if (!W || !W.g || !W.g.visible || W.mode === 'gone' || W.mood === 'still' || W.fl || S.wk || state.talking || geheimnisse_lit() || kap() !== 3 || (typeof neben3_hat === 'function' && neben3_hat('geh_whiskey'))) return;
  const P = player.pos; if (Math.hypot(W.g.position.x - P.x, W.g.position.z - P.z) > 30) return;
  const yw = player.yaw, x = P.x - Math.sin(yw) * 1.3, z = P.z - Math.cos(yw) * 1.3; if (typeof neben3_merk === 'function') neben3_merk('geh_whiskey');
  whiskey_setzen(x, whiskey_perch(x, z), z, () => { if (geheimnisse_lit()) return; S.wk = { t: 0 }; whiskey_play('EatSomething', .08, true, 1.4); Audio.play('woodHit1', { gain: .1, rate: 2.4, x, y: .3, z, ref: 2 });
    toast('Whiskey pickt dir den glimmenden Stein aus der Hand und hüpft zwei Schritte weg. Er gibt ihn nicht her.', 4400); }); }
function geheimnisse_whiskeyTick(dt) { const S = geheimnisse_S, W = typeof whiskey_S !== 'undefined' ? whiskey_S : null; if (!S.wk || !W || !W.g || !S.wkMesh) return;
  if (W.head) { W.head.getWorldPosition(_geheimV); const a = W.g.rotation.y + (W.hy || 0); S.wkMesh.position.set(_geheimV.x + Math.sin(a) * .12, _geheimV.y - .04, _geheimV.z + Math.cos(a) * .12); S.wkMesh.visible = !W.fl && W.g.visible; }
  if (geheimnisse_lit() && !S.wk.drop) { S.wk.drop = true; S.wkMesh.visible = false; Audio.play('stones1', { gain: .18, rate: 1.8, x: W.g.position.x, y: .2, z: W.g.position.z, ref: 2 }); whiskey_play('IdleScratchWing', .2);
    toast('Im Licht glimmt der Stein nicht mehr. Whiskey lässt ihn fallen, als hätte er ihn nie gewollt. Du hebst ihn auf.', 4400);
    setTimeout(() => { subtitle('Du stehst nur auf Sachen, die leuchten. Ich kenn Leute wie dich.', 3800, 'LUKE'); S.wk = null; }, 2200); } }
const _geheimV = new THREE.Vector3();
function geheimnisse_lit() { return flashOn && FLASH.charge > 0 && !(state.flashFail > 0); }
function geheimnisse_wreck(i, text, key) {
  if (geheimnisse_has(key)) return toast(text, 3600);
  story.lore.push({ key, title: 'Blech vom Himmel · ' + (i + 1), html: text }); sideStart('geh_wrack'); Audio.play('metalSheet', { gain: .35, rate: .8 });
  const n = geheimnisse_S.wrecks.filter(x => geheimnisse_has(x.key)).length; story.side.geh_wrack.desc = `Metallteile: ${n} / 5.`; toast(text, 5200);
  if (n === 5) setTimeout(() => { sideDone('geh_wrack', 'Alle fünf Teile gefunden.'); // STORY-HOOK: Fallwand-Frage „Was ist das Ding am Himmel?“ – bewusst offen
    openNote('Das Wappen', 'Fünf Teile, von Hand geschmiedet. Auf jedem derselbe Stempel: ein Turm über einem Abgrund. Das Wappen vom Hohen Abgrund.\n\nZusammengelegt ergeben sie einen Bügel. Einen Haken, wie er oben an einer Kinderlaterne sitzt – nur so groß wie ein Scheunentor.\n\n<span class="hand">Was da über dem Dorf hängt, hält jemand an einem Stab. Wer schmiedet so etwas für ein Kind – und geht dann nie hinterher?</span>', 'geh_wappen'); }, 5400);
}
// Nutzer 02.10.: „Voodoo-Statue verstehe ich nicht – deutlicher, funktionaler, spannender, mehr Spaß, keine verwirrenden Zusatzinfos.“
// Klar: Berühren → Kerzen lodern auf, Kinder zählen leise mit (n / 4) → Vision eines Ortes, der jetzt wichtig ist → Lichtsäule dorthin. Alle vier: Geheimnis (Kreide → Lichtsteine).
const GEH_ZAHL = ['Eins.', 'Zwei.', 'Drei.', 'Vier. Alle da.'];
const GEH_KARTE = `<div style="font:13px/1 'Special Elite',Georgia,serif;letter-spacing:.32em;opacity:.55;margin-bottom:12px">ZÄHLGESTELLE</div>
  <div style="font-size:19px;line-height:1.45;margin-bottom:14px;font-style:italic;opacity:.92">Kinder haben sie gebaut. Sie zählen, wer noch da ist.</div>
  <div style="font-size:17px;line-height:1.5;opacity:.88;margin:8px 0"><b style="font-weight:600">Berühren:</b> eine Vision von einem Ort, der jetzt wichtig ist.</div>
  <div style="font-size:17px;line-height:1.5;opacity:.88;margin:8px 0"><b style="font-weight:600">Danach:</b> eine Lichtsäule zeigt dir den Weg dorthin.</div>
  <div style="font-size:17px;line-height:1.5;opacity:.88;margin:8px 0"><b style="font-weight:600">Vier</b> stehen an den Rändern des Dorfs. Findest du alle, verraten sie ein Geheimnis.</div>
  <div style="font-size:17px;line-height:1.5;opacity:.7;margin:8px 0">Sie drehen sich, wenn du wegsiehst. Sie tun dir nichts.</div>
  <div style="margin-top:14px;font-size:14px;opacity:.5;letter-spacing:.06em">E · weiter</div>`;
function geheimnisse_totem(i, key) {
  const T = geheimnisse_S.totems[i]; if (T) T.flare = 1.6; // Kerzen lodern auf
  try { Audio.play('woodSqueak1', { gain: .2, rate: .55, x: T.g.position.x, y: 1.4, z: T.g.position.z, ref: 3 }); } catch (e) {}
  if (geheimnisse_has(key)) { if (!(typeof visionen_totem === 'function' && visionen_totem(i))) toast('Das Gestell ist still.', 2400); return; }
  const n0 = geheimnisse_S.totems.filter(x => geheimnisse_has(x.key)).length;
  story.lore.push({ key, title: 'Zählgestell · ' + (n0 + 1) + ' / 4', html: 'Ein Gestell aus Ästen, roter Schnur und einem Teddy. Berührt: eine Vision, danach eine Lichtsäule zu dem Ort.' }); sideStart('geh_totem');
  const n = n0 + 1; story.side.geh_totem.desc = `Zählgestelle: ${n} / 4. Jedes zeigt dir in einer Vision, wohin du musst.`;
  try { Audio.whisper(T.g.position.x, 1.3, T.g.position.z, 1.6); } catch (e) {} setTimeout(() => subtitle(`<i>${GEH_ZAHL[Math.min(3, n - 1)]}</i>`, 2200, 'KINDERSTIMME'), 500);
  setTimeout(() => { try { questPop('ZÄHLGESTELL', n + ' / 4'); } catch (e) { toast('Zählgestell ' + n + ' / 4', 3000); } }, 900);
  if (n0 === 0 && typeof hl_karte === 'function') setTimeout(() => { try { hl_karte(GEH_KARTE); } catch (e) {} }, 300);
  if (typeof visionen_totem === 'function') setTimeout(() => visionen_totem(i), n0 === 0 ? 2600 : 1600);
  if (n === 4) setTimeout(() => { sideDone('geh_totem', 'Alle vier gefunden. Auf der Rückseite: Kreide.'); if (typeof neben3_offen !== 'function' || neben3_offen('geh_steine')) sideStart('geh_steine');
    openNote('Kreide auf den Gestellen', 'Auf die Rückseiten hat jemand mit Kreide geschrieben. Kinderschrift, in einer Reihe:\n\n' + GEHEIM_STONES.map(s => '· ' + s[2]).join('\n') + '\n\n<span class="hand">Mach das Licht aus. Dann siehst du uns.</span>', 'geh_kreide'); }, 9000);
}
WORLD_TICK.push((dt, t) => {
  const S = geheimnisse_S; if (!S.ready) return; S.t -= dt; geheimnisse_glow.value = .55 + .45 * Math.sin(t * 1.3) * Math.sin(t * .37 + 1);
  const P = player.pos, dark = !flashOn || FLASH.charge <= 0 || state.flashFail > 0; S.chk -= dt; if (S.chk <= 0) { S.chk = .25; S.k3 = typeof neben3_offen === 'function' ? neben3_offen('geh_steine') : kapAb(3); geheimnisse_rhTick(); } // Lichtsteine nur in der 03:13-Nacht (Kap. 3, UK 5 bis zur vierten Laterne)
  const k3 = S.k3; geheimnisse_whiskeyTick(dt);
  for (const s of S.stones) { const want = dark && k3 && !geheimnisse_has(s.key); if (want !== s.on) { s.on = want; s.o.visible = want; if (want) { if (!interactables.includes(s.hit)) interactables.push(s.hit); } else uninteract(s.hit); }
    if (want && !S.litHint && Math.hypot(s.o.position.x - P.x, s.o.position.z - P.z) < 12) { S.litHint = true; subtitle('Da. Im Dunkeln. Am Boden glimmt etwas – als hätte es nur gewartet, bis du das Licht ausmachst.', 5000); } }
  // Totems: drehen sich zu dir, sobald du wegsiehst (nur in der Nähe)
  camera.getWorldDirection(_geheimFwd);
  for (const T of S.totems) { if (T.l) { T.flare = Math.max(0, T.flare - dt * .7); T.l.intensity = .6 * (1 + T.flare * 2.2) * (.85 + .15 * Math.sin(t * 9 + T.i)); }
    const dx = T.g.position.x - P.x, dz = T.g.position.z - P.z, d = Math.hypot(dx, dz); if (d > 28) continue;
    if (!T.nah && d < 14 && !geheimnisse_has(T.key) && !state.talking && !story.lore.some(l => /^geh_totem_/.test(l.key))) { T.nah = true; if (!S.ersterBlick) { S.ersterBlick = true; subtitle('<i>Ein Gestell aus Ästen, oben ein Teddy. Kinder haben sowas gebaut, wenn sie gezählt haben, wer noch da ist.</i>', 5200, 'LUKE'); try { if (typeof blick_hin === 'function') blick_hin(T.g.position.x, 1.3, T.g.position.z, { art: 'totem', sek: 2 }); } catch (e) {} } }
    const looking = (_geheimFwd.x * dx + _geheimFwd.z * dz) / d > .45;
    if (!looking && T.seen) { const want = Math.atan2(-dx, -dz); if (Math.abs(want - T.g.rotation.y) > .3) { T.g.rotation.y = want; if (d < 15) Audio.play('woodSqueak1', { gain: .12, rate: .6, x: T.g.position.x, y: 1.2, z: T.g.position.z, ref: 3 }); } }
    T.seen = looking; }
});
const _geheimFwd = new THREE.Vector3();
window.__geheimK3 = { S: geheimnisse_S, take: i => geheimnisse_takeStone(geheimnisse_S.stones[i]), rh10: () => geheimnisse_rh10(), will: () => geheimnisse_whiskeyWill(geheimnisse_S.stones[0]), lit: () => geheimnisse_lit() }; // Testzugriff (AP-18)
