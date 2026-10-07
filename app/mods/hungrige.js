// =====================================================================  DER HUNGRIGE (Modul „hungrige“): der Gestaltwandler in den Forbidden Dustwoods
// Kanon (story_final.md, „Der Hungrige“): In der Zyklusnacht 1992 holte Bergungstrupp 3 etwas aus der Senke, das sich hinstellte wie ein Hirsch.
// Es frisst den Nachhall – die Abdrücke, die das Licht hinterlässt (Lukes Erinnerungen) – und trägt die Tiere, die es gefressen hat, als Haut. Falsch:
// der Kopf sitzt nie richtig. Es lernt Stimmen aus den Abdrücken (Lucy, Seiler, Hofer) und kam 1992 mit Hofers Gesicht zurück. Es hasst Licht, und es
// fürchtet den Raben, der zu Mira gehört.
// Ablauf (jede Begegnung nur einmal, wird gespeichert): erst Tiere, die nicht stimmen (Reh rückwärts, Krähe mit Lucys Wort, Fuchs mit verdrehtem Kopf),
// dann die Fraßstelle mit Hofers Dienstbuch, Hirsch-Angriff, Heulen, das zu Funk wird, die Silhouette im tiefen Wald, Hofer selbst – und am Bau
// hinter dem Autowrack die Enthüllung: zwei Whiskeys, einer davon falsch. Der echte vertreibt ihn (Kapitel 6 · „Der Hungrige“).
// Garantierte Begegnungen mit gehäuteten Tieren („die Nackten“): am Hochsitz und am Amtsbus. Modelle: Unreal Animal Variety Pack (Reh, Krähe, Fuchs,
// Wolf, Hirsch), Deer Thing (Sketchfab, CC-BY) als wahre Gestalt, Megascans-Tierschädel, Fleisch/Organe und Blut aus dem Kuh-Sturz.
const HUNGRIGE = { spuren: { x: 1.5, z: 199.6 }, bau: { x: -13.2, z: 206.8 }, pfahl: { x: -13.9, z: 207.6 }, reh: { x: 14, z: 178.5 }, wolf: { x: 65, z: 199.5 }, dtYaw: PI / 2, dtH: 2.75, wunde: [.17, .62, .0, .3] };
const HUNGRIGE_STUFEN = ['reh', 'kraehe', 'fuchs', 'spuren', 'hirsch', 'wolf_funk', 'blick', 'hofer', 'bau'];
// Reihenfolge in Kapitel 6 (Fassung 3, AP-23): Dustwoods 1–3 · am Bus Funk · Fraßstelle (Seite 1, Pflicht) · danach der Hirsch · Silhouette und Hofer auf dem Weg vom Lager zum Wrack · Bau (Seite 6)
const HUNGRIGE_FOLGE = ['reh', 'kraehe', 'fuchs', 'wolf_funk', 'hirsch', 'blick', 'hofer'];
// Formen (CLAUDE.md §20/§21): jede Haut hat eigene Gangart, eigenes Verhalten und eigene Geräusche – gemeinsam ist nur: kein Atem, der Kopf sitzt falsch, keine Spieluhr unter den Stimmen.
//   Reh: starrt, geht rückwärts, Hufe im Metronomtakt · Krähe: frisst die Spur, Kopf zu weit, fliegt rückwärts, tiefer Ruf · Fuchs: sitzt ohne Atem, Kopf verkehrt, Knurren im Licht ·
//   Geschältes Reh: kommt wie ein Hund, hält an, wenn Luke hält, legt den Kopf schief, nasse Schritte · Geschälter Wolf: liegt tot, kommt nur ungesehen näher, springt ·
//   Hirsch: stürmt, steht auf einen Meter, Kopf dreht ohne Hals · Hirschding (wahre Gestalt, kapitel6.js: Jagd): aufrecht, ruckend wie ein Film mit fehlenden Bildern, zwei Tritte je Schritt,
//   Knochenknacken, trägt die Stille mit sich · Hofer: Mensch, Körper steht, Kopf dreht sich, drei Stimmen aus einem Mund · der falsche Rabe: spiegelverkehrt, stumme Flügel, kein Atem, schwarze Augen.
const hungrige_S = { ready: false, stage: 0, done: new Set(), ev: null, cool: 30, flesh: null, none: null, dt: null, cine: null, look: null, nackt: {}, fix: {}, finale: false, tries: 0, told: new Set(), epilog: false, ravA: null, ravB: null, pages: {} };
MOD_SAVE.push(['hungrige', () => ({ stage: hungrige_S.stage, done: [...hungrige_S.done], finale: hungrige_S.finale, epilog: hungrige_S.epilog }), // epilog: Kapitel 6 ganz zu Ende (Beobachter „d_zugesehen“ liest es)
  v => { const S = hungrige_S; S.stage = v.stage || 0; (v.done || []).forEach(k => S.done.add(k)); S.finale = !!v.finale; S.epilog = !!v.epilog;
    const alt = story.lore.find(l => l.key === 'hungrige_seite_2' && /letzte Seite/.test(l.title)); if (alt) alt.key = 'hungrige_seite_6'; // Spielstand vor Fassung 3: die letzte Seite hieß Seite 2
    if (S.done.size && story.side.hungrige) { story.side.hungrige.state = S.finale ? 'done' : (S.done.has('fuchs') ? 'active' : 'hidden'); hungrige_desc(); } }]);
const hungrige_has = k => hungrige_S.done.has(k);
function hungrige_seiteFrei(i) { if (i !== 6) return true; return hungrige_has('spuren') && (typeof k6_bauFrei !== 'function' || k6_bauFrei()); }
// Nur in Kapitel 6 (PK-A A6): wald_frei() aus wald.js. Stufen 1–3 nur in den Dustwoods (wald_in), 4–9 nur im tiefen Wald (tief_in).
function hungrige_ok() { return typeof wald_frei === 'function' && wald_frei() && typeof tief_ok === 'function' && tief_ok() && !dir.busy && !hungrige_S.ev && !hungrige_S.cine && !(typeof tief_S !== 'undefined' && (tief_S.fig || tief_S.follow)) && !hungrige_S.finale; }
function hungrige_dust(x, z) { return typeof wald_in === 'function' && wald_in(x, z); }
function hungrige_tief(x, z) { return typeof tief_in === 'function' && tief_in(x, z); }
function hungrige_inWald(x, z) { return (typeof wald_in === 'function' && wald_in(x, z)) || (typeof tief_in === 'function' && tief_in(x, z)); }
function hungrige_deep() { return typeof tief_S !== 'undefined' ? tief_S.k : 0; }
// Fibel-Faden (Bibel 1.11): Dorfname „Der Hungrige“ ab dem Fuchs, nach Hofers Seite 1 durchgestrichen und darüber „Wendigo“ – beides sichtbar (Durchstrich als Zeichen, damit er auch im Aufgaben-Popup steht)
const HUNGRIGE_TITEL_DURCH = 'Der Hungrige'.split('').map(c => c + '̶').join('') + ' Wendigo';
function hungrige_desc() {
  const q = story.side.hungrige; if (!q) return;
  if (hungrige_has('spuren')) q.title = HUNGRIGE_TITEL_DURCH;
  if (hungrige_S.finale) q.desc = 'Der Wendigo hat sich gezeigt, und Whiskey hat ihn vertrieben. Er ist nicht tot. Aber er weiß jetzt, wer zu wem gehört.';
  else if (hungrige_has('bau')) q.desc = 'Hofers letzte Seite: Es frisst die Bilder. Es trägt sein Gesicht. Es hasst Licht und fürchtet den Raben.';
  else if (hungrige_has('spuren')) q.desc = 'Ein Dienstbuch vom Amt neben einem angefressenen Reh. 1992 hat ein Trupp etwas aus der Senke gezogen, das keiner anfassen wollte. Einer hat es angefasst.';
  else q.desc = 'Im Wald stimmt etwas mit den Tieren nicht. Ein Reh geht rückwärts, eine Krähe kennt Lucys Wort, ein Fuchs trägt den Kopf falsch. Vegas sagt, der Wald hat kein Echo.';
}
function hungrige_done(id, thought) {
  const S = hungrige_S; if (S.done.has(id)) return; S.done.add(id); const i = HUNGRIGE_STUFEN.indexOf(id); if (i >= 0) S.stage = Math.max(S.stage, i + 1);
  if (!story.side.hungrige) story.side.hungrige = { title: 'Der Hungrige', desc: '', state: 'hidden' };
  if ((id === 'fuchs' || S.done.size >= 3) && story.side.hungrige.state === 'hidden') { hungrige_desc(); sideStart('hungrige'); } else hungrige_desc(); // ab dem Fuchs steht der Faden in der Fibel
  if (thought && typeof gedanke === 'function') gedanke('hungrige_' + id, thought, 1400, 3);
  if (typeof k6_hungrigeDone === 'function') try { k6_hungrigeDone(id); } catch (e) { console.warn('Kapitel6: Stufe', id, e); }
  if (typeof saveGame === 'function') saveGame(curChapter());
}
// ---------------------------------------------------------------- Helfer: Platz vor dem Spieler zwischen den Bäumen, Blick, Licht, Knochen
const hungrige_V = new THREE.Vector3(), hungrige_Q = new THREE.Quaternion(), hungrige_E = new THREE.Euler();
// Freie Sicht von der Kamera auf (x, y, z)? Strahl gegen die Kollisionskörper (Bäume, Wände, Autos; Gras und Laub zählen nicht)
const hungrige_ray = new THREE.Ray(), hungrige_R2 = new THREE.Ray(), hungrige_W = new THREE.Vector3();
function hungrige_los(x, y, z) {
  const c = camera.position, dir = hungrige_W.set(x - c.x, y - c.y, z - c.z), L = dir.length(); if (L < .5) return true; dir.divideScalar(L); hungrige_ray.set(c, dir); const seen = new Set();
  for (let s = .5; s < L; s += 1.2) { for (const it of solidNear(c.x + dir.x * s, c.z + dir.z * s)) { if (seen.has(it)) continue; seen.add(it); if (it.soft || !solidLive(it) || !hungrige_ray.intersectsBox(it.bb)) continue;
    const bt = it.o.geometry && it.o.geometry.boundsTree; if (!bt) continue; hungrige_R2.copy(hungrige_ray).applyMatrix4(it.inv); const h = bt.raycastFirst(hungrige_R2, THREE.DoubleSide); if (!h) continue;
    if (h.point.applyMatrix4(it.mw).distanceTo(c) < L - .45) return false; } }
  return true;
}
function hungrige_spot(dMin, dMax, spread = .55, behind = false, h = .7) {
  const P = player.pos, f = flatDir(); if (behind) f.negate();
  for (let k = 0; k < 28; k++) { const a = Math.atan2(f.x, f.z) + rand(-spread, spread), d = rand(dMin, dMax), x = P.x + Math.sin(a) * d, z = P.z + Math.cos(a) * d;
    if (!hungrige_inWald(x, z) || leben_inHouse(x, z, 1.5) || !leben_free(x, z, .5, .9)) continue; if (typeof tief_pond === 'function' && tief_pond(x, z, 2)) continue;
    const sg = solidGround(x, .6, z), y = sg > -1 ? Math.max(0, sg) : 0; if (!behind && (!hungrige_los(x, y + h, z) || !hungrige_los(x, y + h * .45, z))) continue; return [x, y, z]; }
  return null;
}
function hungrige_facePlayer(V, k = 1) { const p = V.g.position, P = player.pos; V.g.rotation.y = leben_ang(V.g.rotation.y, Math.atan2(P.x - p.x, P.z - p.z), Math.min(1, k)); }
function hungrige_dist(V) { const p = V.g.position, P = player.pos; return Math.hypot(p.x - P.x, p.z - P.z); }
function hungrige_lit(V, dMax = 26, thr = .965, h = .7) { const p = V.g.position; return flashOn && !state.blackout && hungrige_dist(V) < dMax && leben_facing(p.x, p.y + h, p.z) > thr; }
function hungrige_seen(V, thr = .88, h = .7) { const p = V.g.position; return hungrige_dist(V) < 45 && leben_facing(p.x, p.y + h, p.z) > thr; }
function hungrige_bone(root, re) { let b = null; root.traverse(o => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; }
function hungrige_bones(root, re) { const L = []; root.traverse(o => { if (o.isBone && re.test(o.name)) L.push(o); }); return L; }
// Verdrehungen und Streckungen nach dem Mixer anwenden (der Mixer setzt die Knochen jedes Bild neu)
function hungrige_applyTwist(V) { if (!V.tw) return; for (const t of V.tw) { if (t.q) { hungrige_Q.identity().slerp(t.q, t.k); t.b.quaternion.copy(t.q0).multiply(hungrige_Q); } if (t.s) t.b.scale.set(t.s0.x * (1 + (t.s[0] - 1) * t.k), t.s0.y * (1 + (t.s[1] - 1) * t.k), t.s0.z * (1 + (t.s[2] - 1) * t.k)); } }
function hungrige_twist(V, b, ry, s) { if (!b) return null; const t = { b, q: ry ? new THREE.Quaternion().setFromEuler(hungrige_E.set(0, ry, 0)) : null, s: s || null, k: 0, q0: b.quaternion.clone(), s0: b.scale.clone() }; (V.tw = V.tw || []).push(t); return t; }
function hungrige_beast(key, s = 1) { if (key === 'wolf' && typeof kr_wolf === 'function') { const W = kr_wolf(); if (W) return W; } const V = leben_beast(key, s); /* Q-1: der Geschälte Wolf hat ein eigenes Modell (kreaturen.js) */ if (!V) return null; if (key === 'crow') V.m.rotation.y = PI / 2; V.g.visible = false; return V; }
function hungrige_off(V) { if (!V) return; V.g.visible = false; if (V.tw) for (const t of V.tw) { t.b.quaternion.copy(t.q0); t.b.scale.copy(t.s0); } V.tw = null; if (V.cur) V.cur.timeScale = 1; }
function hungrige_flesh() { // rohes Fleisch: Material aus dem Kuh-Sturz (Megascans-Fleischtextur), auf Tierhaut gelegt
  const S = hungrige_S; if (S.flesh) return S.flesh; let m = null; if (FAB.gore && FAB.gore.meat) FAB.gore.meat.traverse(o => { if (!m && o.isMesh) m = o.material; });
  S.flesh = m ? m.clone() : new THREE.MeshPhysicalMaterial({ color: 0x8a3a3a, roughness: .45, clearcoat: .8, clearcoatRoughness: .25 }); S.flesh.color.setRGB(.42, .17, .16); S.flesh.roughness = .28; if ('clearcoat' in S.flesh) { S.flesh.clearcoat = 1; S.flesh.clearcoatRoughness = .12; } S.flesh.side = THREE.DoubleSide; S.flesh.name = 'Nackt';
  S.none = S.none || new THREE.MeshBasicMaterial({ visible: false }); return S.flesh;
}
function hungrige_nackt(V) { // Fell und Federn weg, das Fleisch darunter: „die Nackten“ (Q-1: Muskel, Sehnen, Rippen, Wunde aus kreaturen.js; alt als Rückfall)
  if (typeof kr_nackt === 'function' && kr_nackt(V)) return V; const F = hungrige_flesh(); V.m.traverse(o => { if (!o.isMesh) return; const ms = [].concat(o.material); const out = ms.map(m => /fur|hair|feather/i.test(m.name || '') ? hungrige_S.none : F);
    o.material = Array.isArray(o.material) ? out : out[0]; o.castShadow = true; }); return V;
}
function hungrige_step(V, gain = .3, rate) { const p = V.g.position; Audio.play(rate ? 'stepG2' : Audio.pick('stepG1', 'stepG2', 'stepG3'), { gain, rate: rate || rand(.75, .95), x: p.x, y: .1, z: p.z, ref: 4 }); } // rate fest = mechanisch gleich (Reh)
// Wendigo-Laute aus Aufnahmen (kreaturen.js: Audio.wendigo – knochen, schritt, atem, knurr, ruf, fleisch, schnueff, huf, stoehn), sonst der alte Laut
function hungrige_ton(art, x, y, z, gain, alt, o) { if (Audio.wendigo && Audio.wendigo(art, x, y, z, gain, o)) return; if (alt) alt(); }
// nasse Schritte der Geschälten: Laub und ein feuchtes Schmatzen darunter
function hungrige_nass(V, gain = .25) { const p = V.g.position; if (Audio.wendigo && Audio.wendigo('schritt', p.x, .05, p.z, gain * 1.5)) return; hungrige_step(V, gain * .8); Audio.play('scrape3', { gain: gain * .35, rate: rand(.42, .55), lp: 900, x: p.x, y: .05, z: p.z, ref: 3 }); }
// „Wer sie anleuchtet, sieht nur Nebel“: ein Nebelstoß an der Stelle (ein Sprite, beim Laden angelegt)
function hungrige_nebel(x, y, z, s = 1) { const N = hungrige_S.nebel; if (!N) return; N.position.set(x, y, z); N.scale.setScalar(2.4 * s); N.userData.t = 1; N.userData.s = 2.4 * s; N.visible = true; }
// Gefressene Stimmen (Bibel 1.5): trocken, ohne Raum, KEINE Spieluhr darunter – Sprecher mit Fragezeichen (LUCYS STIMME?, HOFER?, ANNI?, PELL?, DEINE STIMME?). Sprachausgabe (X-1) über stimmen_spielen, sonst Hauch
function hungrige_stimme(x, y, z, text, wer, ms = 2400, key) { Audio.whisper(x, y, z, 1.6); if (typeof stimmen_spielen === 'function' && key) try { stimmen_spielen(key, { x, y, z }); } catch (e) {} subtitle('<i>' + text + '</i>', ms, wer); }
function hungrige_lucy(x, y, z, text, ms = 2200) { hungrige_stimme(x, y, z, text, 'LUCYS STIMME?', ms, 'wendigo_lucy'); }
// ---------------------------------------------------------------- Die wahre Gestalt (Deer Thing) und der Bau
async function hungrige_loadDT() {
  const S = hungrige_S; if (S.dt) return S.dt; if (S.dtP) return S.dtP; S.dtP = (async () => {
  try { const K = typeof kr_hirschding === 'function' ? await kr_hirschding() : null; // Q-1: Hirschding mit Skelett und Clips (kreaturen.js), sonst das alte starre Modell
    if (K) { const g = new THREE.Group(); g.add(K.o); g.visible = false; g.userData.noCol = true; scene.add(g); S.dt = { g, o: K.o, t: 0, kr: K }; return S.dt; } } catch (e) { console.warn('Hungrige: Hirschding (Skelett)', e); }
  try { const src = await msModel('wendigo', 'hirschding.glb'); const o = msGround(msFit(src.clone(true), HUNGRIGE.dtH, 'y')); o.rotation.y = HUNGRIGE.dtYaw;
    o.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; m.frustumCulled = false; const mats = [].concat(m.material).map(x => { const c = x.clone(); if (/eye/i.test(c.name || '')) { c.emissive = new THREE.Color(0x3a0a06); c.emissiveIntensity = 1.2; } c.roughness = Math.min(c.roughness ?? .6, .5); return c; }); m.material = Array.isArray(m.material) ? mats : mats[0]; } });
    const g = new THREE.Group(); g.add(o); g.visible = false; g.userData.noCol = true; scene.add(g); S.dt = { g, o, t: 0 }; return S.dt; } catch (e) { console.warn('Hungrige: Hirschding', e); return null; } })(); return S.dtP;
}
function hungrige_dtHide() { const D = hungrige_S.dt; if (!D) return; D.g.visible = false; D.o.scale.setScalar(D.s0 || D.o.scale.x); D.g.scale.setScalar(1); D.g.rotation.set(0, 0, 0); }
// ---------------------------------------------------------------- Hofers Dienstbuch
const HUNGRIGE_SEITEN = {
  1: ['Dienstbuch Gefr. Hofer · Seite 1', 'Amt · Bergung 3 · Öffnung, Nacht zum 22. Juni 1992 · Gefr. Hofer\n\nBefehl wie immer: alles bergen, was aus der Senke kommt. Nicht ansehen, nicht ansprechen, nicht anfassen. Geborgen: drei Kühe ohne Augen (Roy, Roland, Rex), ein Hund, der rückwärts läuft und trotzdem ankommt. Und um drei etwas, das lag wie ein nasser Sack und sich hingestellt hat wie ein Hirsch, als die Lampen draufkamen.\nEs hat Seilers Stimme gemacht. Wort für Wort, was der drei Minuten vorher gefunkt hat. Seiler stand daneben und wurde weiß.\nKeiner wollte es anfassen. Ich hab’s angefasst. Es war warm wie ein Hund. Der Ami will es behalten.\n\nNachtrag: Anni nicht dabei. Diesmal ist keins rein und keins raus, der Pfarrer hat die Kinder in den Kapellenkeller gebracht und ist selber gegangen. Siebzehn Jahre. Nächstes Mal bin ich achtundsechzig.'], // Fassung 3: Wendigo-Dossier, Seite 1 (wortgleich)
  2: ['Dienstbuch Gefr. Hofer · Seite 2', 'Station Nord, Tag 8. Der Sack sitzt jetzt im Hirsch. Der Ami sagt Wirt dazu, ich sag Hirsch. Er geht drin herum wie einer in einer geliehenen Jacke, die Ärmel zu lang.\nIch muss Licht machen, wenn es an der Tür kratzt. Zwei Sekunden Neon, dann geht es zurück. Der Ami nennt das Erziehung. Ich nenne es, was es ist. Bei mir hat man das auch so gemacht.\nHeute Abend hat es geredet. Kinderstimme. „Papa, ich bin gleich wieder da.“\nIch hab am Zaun gestanden, bis der Ami mich reingeholt hat. Er sagt, es kopiert nur. Ich sag, die Kühe haben auch nur gemuht, und ich hab sie trotzdem getauft.'], // Hochsitz, an der Leiter
  3: ['Dienstbuch Gefr. Hofer · Seite 3', 'Hab unterschrieben. Der Ami hat mir dreimal gesagt, es gibt keinen Weg zurück, den sie kennen. Junge, sag ich, ich kenn seit siebzehn Jahren keinen.\nAb Donnerstag bin ich der Hirsch. Feldbett, Thermoskanne, dieses Buch. Pfandkiste hab ich auch reingestellt, das Amt trinkt hier Sprudel wie Wasser.\nWenn das Ding wirklich das Licht aushungert, muss das Licht hergeben, was es hat. Dann will ich vorne stehen. Dann will ich der sein, dem sie entgegenläuft.\nRosi, wenn du das je liest: Ich war nicht verrückt. Ich war nur immer noch am Zaun.'], // Zaunlücke
  4: ['Dienstbuch Gefr. Hofer · Seite 4', 'Tag 5. Ich habe Hunger. Seit der Nacht. Der Ami wiegt mich jeden Morgen und schreibt, ich nehme ab, und ich esse für drei. Nachts ist es still hier, und dann ist es nicht still.\nIch träume von Anni. Sie steht am Zaun und dreht sich um. Sie sagt, Papa, ich bin gleich wieder da. Sie sagt es mit meiner Stimme. Das ist neu.\nDas Poster in ihrem Zimmer ist von Nena. Sie mochte Nena. Ich hab ihr das Poster gekauft, mit der rechten Hand, ich bin Rechtshänder.\nDer Anzug riecht nach Pfandkiste. Das sag ich immer. Das ist witzig.'], // Amtsbus, unter dem Fahrersitz (die erste Seite, die der Wendigo mitschreibt)
  5: ['Dienstbuch Gefr. Hofer · Seite 5', 'Tag 9. Der Ami hat gefragt, ob das meine Schrift ist. Ich hab gesagt ja. Es ist meine Schrift. Es ist meine Hand. Die Hand weiß, wie das geht.\nLicht tut nicht mehr so weh. Vier Sekunden, dann geh ich zurück, und ich lache dabei, weil das Lachen im Bild war, das ich im Hirsch gefressen habe. Ich meine gegessen. Ich meine, das Essen war gut.\nDie Kühe hießen Roy, Roland, Rex und Rudi. Vier. Ich hab sie getauft, mit der Hand.\nAnni sagt, ich soll rauskommen. Sie sagt es jede Nacht. Sie hat Hunger, Junge. Wir haben alle Hunger.'], // Autowrack, Handschuhfach
  6: ['Dienstbuch Gefr. Hofer · letzte Seite', 'Ich weiß jetzt, was es isst. Kein Fleisch. Das Fleisch ist nur die Jacke: Reh, Krähe, Fuchs, was eben rumläuft. Es trägt sie falsch, der Kopf sitzt nie richtig, weil es nur die Vorderseite kennt.\nEs frisst, was bleibt, wenn das Licht jemanden holt oder zurückbringt. Die Bilder. Der Ami sagt Belichtung, Seiler sagt, nur ein Ritter sieht so was, und einer, der aus dem Ritter gemacht ist.\nAus den Bildern lernt es die Stimmen. Meine hat es gelernt, bevor ich es gemerkt habe.\nIch bin im Juni nicht aus der Senke zurückgekommen. <b>Es ist mit meinem Gesicht zurückgekommen.</b> Ich schreibe das mit seiner Hand.\n\nWer das liest: Es hasst Licht. Eine Lampe reicht, wenn man sie nicht senkt. Und es hat Angst vor dem Raben. Vor dem einen, der zu der Frau mit der Laterne gehört.\n— H.'] }; // Fassung 3: Seiten 1–6 wortgleich aus dem Wendigo-Dossier 1.10 (1 Fraßstelle · 2 Hochsitz-Leiter · 3 Zaunlücke · 4 Amtsbus · 5 Wrack · 6 Bau)
const HUNGRIGE_SEITE_LUKE = { 1: ['Er hat die Kühe getauft. Roy, Roland, Rex. … Ich mag den Mann. Das ist schlecht.', 4200], 4: ['Er erklärt seinen eigenen Witz. Das macht keiner, der ihn selbst gemacht hat.', 4200],
  5: ['„Ich meine gegessen.“ … Er korrigiert sich in die richtige Richtung. Für sich. Für den, der er ist.', 5200] }; // Bibel 1.10
// AP-24 · Seite 1b (N6-7): das eingeklebte Blatt aus Annis Schulheft, Hofers Nachsatz darunter (Wortlaut Bibel Kap. 6, N6-7); Fibel „Hofers Blatt“
function hungrige_blatt(cb) {
  const k = 'hungrige_seite_1b', html = '<i>Zwischen Seite 1 und Seite 2 klebt ein Blatt aus einem Schulheft. Kinderschrift, Bleistift:</i>\n\n<span class="hand">Papa ich hab den Lampion gewonen!! Ich darf vorne laufen. Du musst nicht gucken, ich mach die Augen zu, dann seh ich das Licht nicht. Halt mich fest. Anni</span>\n\n<i>Darunter, Hofers Schrift, andere Tinte:</i>\n\n<span class="hand">Sie hat nichts gewonnen. Sie ist gezogen worden. Ich hab unterschrieben. Wenn das Ding meine Erinnerung frisst, soll es an der hier ersticken.</span>';
  if (!story.lore.some(l => l.key === k)) { Audio.paper(); story.lore.push({ key: k, title: 'Wendigo · Hofers Blatt (eingeklebt)', html }); }
  openNote('Eingeklebt, zwischen Seite 1 und 2', html, null, () => { if (typeof n6_blattGelesen === 'function') try { n6_blattGelesen(); } catch (e) {} if (cb) cb(); });
}
function hungrige_seite(i) {
  const [t, txt] = HUNGRIGE_SEITEN[i], k = 'hungrige_seite_' + i, html = '<span class="hand">' + txt + '</span>', neu = !story.lore.some(l => l.key === k);
  if (neu) { Audio.paper(); story.lore.push({ key: k, title: 'Wendigo · ' + t, html }); } // Fassung 3: „Wendigo“ ab Hofers Seite 1
  // Fortschritt hängt am Stand (hungrige_has), nicht daran, ob die Seite neu war – ging der Rückruf verloren (Tod, Laden), holt ihn das nächste Lesen nach
  openNote(t, html, null, () => {
    const L = HUNGRIGE_SEITE_LUKE[i], luke = ms => { if (neu && L) setTimeout(() => { if (!state.talking) subtitle(L[0], L[1], 'LUKE'); }, ms); };
    if (i === 1 && neu) setTimeout(() => hungrige_blatt(() => luke(1200)), 450); else luke(i === 1 ? 5200 : 700); // AP-24: zwischen Seite 1 und 2 klebt Annis Blatt (N6-7, Seite 1b)
    if (i === 1) { if (!hungrige_has('spuren')) hungrige_done('spuren', 'Das war kein Wolf. Wölfe fressen. Das hier hat probiert.'); }
    else if (i === 6) { if (!hungrige_has('bau')) hungrige_done('bau', 'Es frisst die Bilder. Die, die nur ich sehe. … Und ich bin ein einziger Abdruck, der herumläuft.'); hungrige_S.finT = 2.6; } // das Finale startet der Takt
    if (typeof k6_seite === 'function') try { k6_seite(i, neu); } catch (e) { console.warn('Kapitel6: Seite', e); } });
}
// Der Kadaver an der Fraßstelle: das Rehmodell (animal_deerdoe), Clip „Death“ auf dem letzten Bild festgehalten, liegt auf der Seite; die Flanke ist aufgerissen (Fleisch-Shader aus kreaturen.js,
// Fell bleibt am Rest). Das Netz ist geskinnt (keine automatische Kollision): darum eine unsichtbare Kollisionskiste, so groß wie der Körper am Boden.
async function hungrige_kadaver(P, ry = 1.7) {
  const L = typeof leben_S !== 'undefined' ? leben_S : null, T = THREE; if (!L || !L.M || !L.M.deer || !L.skc) return null; const B = L.M.deer;
  if (typeof kr_tex === 'function') { try { await kr_tex(); } catch (e) {} }
  const o = L.skc(B.src), clip = B.clips.find(c => /Death$/.test(c.name)), mx = new T.AnimationMixer(o);
  if (clip) { const a = mx.clipAction(clip); a.setLoop(T.LoopOnce, 1); a.clampWhenFinished = true; a.play(); a.time = clip.duration; mx.update(0); }
  if (typeof kr_haut === 'function' && typeof KR !== 'undefined' && KR.tex) kr_haut(o, { mus: 0, scale: 6, veins: .6, wet: 1, wrap: .55, wound: HUNGRIGE.wunde, bump: 1, nass: .25 }, true);
  o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; } });
  const g = new T.Group(); g.add(o); g.position.set(P.x, 0, P.z); g.rotation.y = ry; g.userData.noCol = true; scene.add(g); g.updateMatrixWorld(true);
  let bb = new T.Box3().setFromObject(o, true); g.position.y -= bb.min.y + .03; g.updateMatrixWorld(true); bb = new T.Box3().setFromObject(o, true);
  const c = bb.getCenter(new T.Vector3()), s = bb.getSize(new T.Vector3()); g.position.x += P.x - c.x; g.position.z += P.z - c.z; bb.translate(new T.Vector3(P.x - c.x, 0, P.z - c.z));
  const hit = box(Math.max(.5, s.x - .35), Math.min(.55, s.y), Math.max(.5, s.z - .35), P.x, Math.min(.55, s.y) / 2, P.z, hidden, { cast: false, collide: true }); hit.userData.noCol = true;
  hungrige_S.kadaver = { g, bb, size: s }; return g;
}
// ---------------------------------------------------------------- Aufbau: Fraßstelle, Bau, Modelle
WORLD_MODS.push(['Wendigo (Dorfname: der Hungrige)', async () => {
  const S = hungrige_S, T = THREE;
  story.side.hungrige = story.side.hungrige || { title: 'Der Hungrige', desc: 'Im Wald stimmt etwas mit den Tieren nicht.', state: 'hidden' };
  const paper = new T.MeshStandardMaterial({ color: 0xcfc8b4, roughness: .92 }), page = (x, y, z, ry, i, hs = [.6, .5, .6]) => { const m = plane(.15, .21, x, y, z, paper, -PI / 2 + .12, ry); m.rotation.z = rand(-.3, .3);
    const hit = box(hs[0], hs[1], hs[2], x, y + .1, z, hidden, { cast: false }); interact(hit, () => !hungrige_seiteFrei(i) ? '' : story.lore.some(l => l.key === 'hungrige_seite_' + i) ? 'Hofers Dienstbuch' : 'Eine Seite aus einem Dienstbuch', () => { if (hungrige_seiteFrei(i)) hungrige_seite(i); }); S.pages[i] = m; return m; }; // Seite 6 erst nach der Fraßstelle und wenn Kapitel 6 den Bau freigibt
  const blood = (mat, x, z, s, rz, y = .045) => { if (!mat) return; const m = new T.Mesh(new T.PlaneGeometry(1, 1), mat); m.rotation.set(-PI / 2, 0, rz); m.position.set(x, y, z); m.scale.setScalar(s); m.receiveShadow = true; scene.add(m); };
  for (let i = 0; i < 80 && !(FAB.blood && FAB.gore); i++) await wait(250);
  const Bd = FAB.blood || {}, G = FAB.gore;
  const gore = (src, x, z, ry) => { if (!src) return; const o = src.clone ? src.clone() : src(); o.position.set(x, .02, z); o.rotation.set(rand(-.3, .3), ry, rand(-.3, .3)); scene.add(o); };
  // --- Fraßstelle auf dem Pfad zum Wrack: angefressenes Reh, Blut, Seite 1
  { const P = HUNGRIGE.spuren; blood(Bd.stain1, P.x, P.z, 2.2, .4); blood(Bd.stain2, P.x + 1.1, P.z - .6, 1.5, 2.1, .046); for (let i = 0; i < 7; i++) blood(Bd.spatter, P.x + rand(-2.4, 2.4), P.z + rand(-2, 2), rand(.8, 1.8), rand(0, 6), .047 + i * .0004);
    if (G) { gore(G.meat, P.x + 1.4, P.z + .9, rand(0, 6)); gore(G.kid, P.x - .9, P.z + 1.2, rand(0, 6)); gore(G.gut, P.x + .6, P.z - 1.3, 0); }
    try { await hungrige_kadaver(P); } catch (e) { console.warn('Hungrige: Kadaver', e); }
    page(P.x - 1.6, .06, P.z - 1.1, .7, 1); S.fix.spurenY = .06; }
  // --- Der Bau hinter dem Autowrack: Schädel auf dem Pfahl, Knochen, Blut, letzte Seite
  try { const P = HUNGRIGE.pfahl, parts = await msBake('fencepost'); let post = null, hTop = 0;
    for (const p of parts) { p.geo.computeBoundingBox(); const h = p.geo.boundingBox.max.y - p.geo.boundingBox.min.y; if (h > hTop) { hTop = h; post = p; } }
    if (post) { const m = new T.Mesh(post.geo, post.mat); m.position.set(P.x, -post.geo.boundingBox.min.y - .02, P.z); m.rotation.set(.05, .8, -.06); m.castShadow = true; m.receiveShadow = true; scene.add(m); S.fix.pfahlTop = post.geo.boundingBox.max.y - .02; }
    const sk = await msModel('wendigo', 'schaedel.glb'); const skull = msGround(msFit(sk.clone(true), .5, 'max')); skull.position.set(P.x, (S.fix.pfahlTop || 1.6) - .08, P.z); skull.rotation.set(.35, 2.2, .1); scene.add(skull); skull.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); S.skull = skull;
    const B = HUNGRIGE.bau; blood(Bd.stain2, B.x, B.z, 2.6, 1.3); blood(Bd.stain1, B.x - 1.2, B.z + 1, 1.8, 4.2, .046); for (let i = 0; i < 9; i++) blood(Bd.spatter, B.x + rand(-2.6, 2.6), B.z + rand(-2.2, 2.2), rand(.9, 2), rand(0, 6), .047 + i * .0004);
    if (G) { gore(G.ribs, B.x + 1.3, B.z - .8, rand(0, 6)); gore(G.meat, B.x - 1.4, B.z - 1.1, rand(0, 6)); gore(G.meat, B.x + .4, B.z + 1.5, rand(0, 6)); gore(G.kid, B.x - .3, B.z - 1.7, rand(0, 6)); gore(G.gut, B.x + 1.6, B.z + .7, 0); }
    page(B.x + 1.1, .06, B.z - .2, -.9, 6);
    // Seiten 2–4 (Bibel 1.10): Hochsitz an der Leiter · Zaunlücke · Amtsbus unter dem Fahrersitz (Seite 5 liegt im Handschuhfach des Wracks: kapitel6.js)
    if (typeof TIEF !== 'undefined') { page(TIEF.stand.x + .45, .06, TIEF.stand.z - 1.95, .3, 2); page(40.9, .06, 155.5, -.4, 3); { const w = typeof tief_busW === 'function' ? tief_busW(.42, .545, .64) : null; // Seite 4: auf dem Boden des Fahrerhauses, unter dem Fahrersitz (Wagen innen, Scheiben fehlen: man sieht sie durch die Frontscheibe)
      if (w) page(w.x, w.y, w.z, .5, 4, [1.6, 1.2, 1.6]); else page(TIEF.bus.x + 1.25, .3, TIEF.bus.z - .75, .5, 4); } }
    if (typeof hintAdd === 'function') { hintAdd({ id: 'hungrige_spuren', x: HUNGRIGE.spuren.x, y: 0, z: HUNGRIGE.spuren.z, kind: 'geheim', near: 26, open: () => wald_frei() && !hungrige_has('spuren') }); hintAdd({ id: 'hungrige_bau', x: B.x, y: 0, z: B.z, kind: 'geheim', near: 24, open: () => wald_frei() && hungrige_has('spuren') && !hungrige_has('bau') && hungrige_seiteFrei(6) }); }
  } catch (e) { console.warn('Hungrige: Bau', e); }
  // --- Hirsch ins Tierregister von leben.js (für leben_beast)
  try { if (typeof leben_S !== 'undefined' && leben_S.M && !leben_S.M.stag) { const sc = await msModel('animal_deerstag', 'model.glb'); leben_shrink(sc, 1024); leben_S.M.stag = { src: sc, clips: sc.animations || [] }; } } catch (e) { console.warn('Hungrige: Hirsch', e); }
  { const L = new VLight(0xdfe9ff, 0, 10, 1.6); L.position.set(0, -60, 0); scene.add(L); S.ravenL = L; }
  { const N = new T.Sprite(new T.SpriteMaterial({ map: typeof fogTex !== 'undefined' ? fogTex : poolTex, color: 0x9aa4ae, transparent: true, opacity: 0, depthWrite: false })); N.visible = false; N.userData = { t: 0, s: 2.4 }; scene.add(N); S.nebel = N; } // Nebelstoß im Licht // Whiskeys Licht im Finale: jetzt anlegen, später nur Intensität
  S.ready = true;
}]);
// ---------------------------------------------------------------- Die Begegnungen (jede genau einmal, in dieser Reihenfolge freigeschaltet)
const HUNGRIGE_EV = {
  // 1) Ein Reh steht zwischen den Bäumen und sieht dich an. Dann geht es rückwärts in die Dunkelheit – ohne den Blick zu lösen. Hufe im Metronomtakt: zu gleichmäßig für ein Tier.
  reh: { need: () => hungrige_dust(player.pos.x, player.pos.z), skip: () => hungrige_tief(player.pos.x, player.pos.z),
    start() { const sp = hungrige_spot(13, 19, .5); if (!sp) return false; const V = hungrige_beast('deer', 1); if (!V) return false;
      V.g.position.set(sp[0], sp[1], sp[2]); V.ty = sp[1]; hungrige_facePlayer(V, 1); V.g.visible = true; leben_play(V, 'IdleLookAround', 0); V.mx.update(.4); if (V.cur) V.cur.timeScale = 0; // steht, ohne zu grasen, ohne sich umzusehen: nur der Blick
      this.V = V; this.t = 0; this.seen = 0; this.ph = 'stare'; return true; },
    tick(dt) { const V = this.V, d = hungrige_dist(V); this.t += dt; leben_beastUpd(V, dt, 80); hungrige_facePlayer(V, dt * 2);
      if (this.ph === 'stare') { if (hungrige_seen(V, .9, .9)) this.seen += dt; if (this.seen > 1.6 || d < 9) { this.ph = 'back'; const P = player.pos, p = V.g.position, dx = p.x - P.x, dz = p.z - P.z, L = Math.hypot(dx, dz) || 1; V.tx = p.x + dx / L * 40; V.tz = p.z + dz / L * 40; V.sp = 1.05; leben_play(V, 'Walk', .3, -1); Audio.twig(p.x, p.z); this.hT = 0; }
        else if (this.t > 40) return false; }
      else { leben_beastMove(V, dt, false); this.hT -= dt; if (this.hT < 0 && d < 30) { this.hT = .62; hungrige_step(V, .22, .82); } if (d > 34 || this.t > 60 || (!hungrige_seen(V, .5) && d > 22)) return false; } return true; }, // .62 s, gleiche Tonhöhe: Metronom
    end() { hungrige_off(this.V); hungrige_done('reh', 'Ein Reh geht nicht rückwärts. … Es hat mich angesehen. Die ganze Zeit, beim Rückwärtsgehen.'); } },
  // 2) Eine Krähe landet auf der Brotkrumenspur, frisst sie und sagt Lucys Wort – ohne Spieluhr darunter. Dann fliegt sie davon, rückwärts, den Kopf zu Luke.
  // Kapitel 6: sie landet auf den Brotkrumen des Jungen und frisst sie (kapitel6.js: k6_krumeVorn / k6_krumenFressen) – „Die Spur ist weg.“
  kraehe: { need: () => hungrige_dust(player.pos.x, player.pos.z), skip: () => hungrige_tief(player.pos.x, player.pos.z),
    start() { const kr = typeof k6_krumeVorn === 'function' ? k6_krumeVorn() : null, sp = kr || hungrige_spot(5, 8, .4, false, .3); if (!sp) return false; this.krume = !!kr; const V = hungrige_beast('crow', 1.15); if (!V) return false; if (typeof kr_form === 'function') kr_form(V, 'hals_k');
      V.g.position.set(sp[0], sp[1] + 6, sp[2]); V.ty = sp[1]; hungrige_facePlayer(V, 1); V.g.visible = true; leben_play(V, 'Landing', 0, 1, true); Audio.flap(sp[0], sp[1] + 4, sp[2]); this.V = V; this.t = 0; this.ph = 'land'; this.said = false; return true; },
    tick(dt) { const V = this.V, p = V.g.position; this.t += dt; leben_beastUpd(V, dt, 60); if (this.ph !== 'fly') hungrige_facePlayer(V, dt * 3);
      if (this.ph === 'land') { p.y += (V.ty - p.y) * Math.min(1, dt * 3.2); if (this.t > 1.1) { this.ph = 'sit'; leben_play(V, 'IdleLookAround', .3); p.y = V.ty; } }
      else if (this.ph === 'sit') { if (this.krume && !this.ate) { if (!this.eat0) { this.eat0 = this.t; leben_play(V, 'EatSomething', .2); setTimeout(() => { if (!state.talking) subtitle('Hey. Hey! Das ist seine Spur!', 2400, 'LUKE'); }, 700); } if (this.t - this.eat0 > 2.4) { this.ate = true; if (typeof k6_krumenFressen === 'function') k6_krumenFressen(p.x, p.z); leben_play(V, 'IdleLookAround', .3); } }
        if (!this.said && (!this.krume || this.ate) && this.t > (this.krume ? 4.6 : 2.4) && hungrige_seen(V, .8, .3)) { this.said = true; this.saidT = this.t; hungrige_lucy(p.x, p.y + .3, p.z, '„Großer …“', 2000); this.tw = hungrige_twist(V, hungrige_bone(V.m, /Head/), PI);
          setTimeout(() => { if (!state.talking) subtitle('Keine Spieluhr. Das ist nicht sie. Das ist nicht mal das Graukind.', 3600, 'LUKE'); }, 2600); }
        if (this.tw) this.tw.k = Math.min(1, this.tw.k + dt * 1.2);
        if ((this.said && this.t > 6.5) || (this.said && this.t > this.saidT + 2 && hungrige_lit(V, 12, .985, .3)) || hungrige_dist(V) < 2.2) { this.ph = 'fly'; leben_play(V, 'Fly', .1, -1.1); Audio.flap(p.x, p.y + .5, p.z, V.g); Audio.play('crow2', { gain: .55, rate: .55, x: p.x, y: p.y + 1, z: p.z, ref: 5, obj: V.g, h: 1 }); this.ft = 0; const f = flatDir(); this.dir = new THREE.Vector3(f.x, .5, f.z).normalize(); } // tiefer, zu langsamer Ruf; Flügelschlag rückwärts
        else if (this.t > 30) return false; }
      else { this.ft += dt; p.addScaledVector(this.dir, dt * 6.5); hungrige_facePlayer(V, dt * 8); if (this.ft > 4) return false; } // fliegt weg und sieht dabei zurück: falsch herum
      hungrige_applyTwist(V); return true; },
    end() { hungrige_off(this.V); hungrige_done('kraehe', '„Großer.“ Das ist Lucys Wort. Aus einem Krähenschnabel. … Und keine Spieluhr drunter. Das ist nicht sie.'); if (typeof k6_nachKraehe === 'function') k6_nachKraehe(!!this.ate, this.V && this.V.g.position); } },
  // 3) Ein Fuchs sitzt mit dem Rücken zu dir. Der Kopf sieht dich trotzdem an – um 180 Grad gedreht. Er atmet nicht; im Licht knurrt er nass und ist weg.
  fuchs: { need: () => hungrige_dust(player.pos.x, player.pos.z), skip: () => hungrige_tief(player.pos.x, player.pos.z),
    start() { const sp = hungrige_spot(8, 12, .45); if (!sp) return false; const V = hungrige_beast('fox', 1); if (!V) return false; if (typeof kr_form === 'function') kr_form(V, 'fuchs'); // Q-1: „hinten den Reißverschluss vergessen“
      V.g.position.set(sp[0], sp[1], sp[2]); V.ty = sp[1]; hungrige_facePlayer(V, 1); V.g.rotation.y += PI; V.g.visible = true; leben_play(V, 'IdleBreathe', 0); V.mx.update(.5); if (V.cur) V.cur.timeScale = 0; this.V = V; this.t = 0; this.lit = 0; // eingefroren: kein Atem
      this.tw = hungrige_twist(V, hungrige_bone(V.m, /Head/), PI); if (this.tw) this.tw.k = 1; return true; },
    tick(dt) { const V = this.V; this.t += dt; leben_beastUpd(V, dt, 60); if (hungrige_lit(V, 20, .975, .35)) this.lit += dt;
      if (this.tw) this.tw.k = 1 + (Math.sin(this.t * 17) > .96 ? .04 : 0); // ein Zucken ab und zu, sonst nichts
      if (this.lit > 1.2 || hungrige_dist(V) < 3) { const p = V.g.position; hungrige_ton('knurr', p.x, .3, p.z, .55, () => Audio.growl(p.x, p.z, true)); Audio.play('scrape3', { gain: .1, rate: .5, x: p.x, y: .3, z: p.z, ref: 3 }); hungrige_nebel(p.x, p.y + .4, p.z, .7); return false; } if (this.t > 35) return false; hungrige_applyTwist(V); return true; },
    end() { hungrige_off(this.V); hungrige_done('fuchs', 'Der Kopf saß falsch. Umgedreht. Als hätte jemand den Fuchs angezogen und hinten den Reißverschluss vergessen.'); } },
  // 5) Nach der Fraßstelle: ein Hirsch bricht aus dem Dunkel, stürmt auf dich zu, bleibt einen Meter vor dir stehen – und der Kopf dreht sich ohne den Hals. Knacken. Licht aus.
  hirsch: { need: () => hungrige_tief(player.pos.x, player.pos.z) && hungrige_has('spuren') && Math.hypot(player.pos.x - HUNGRIGE.spuren.x, player.pos.z - HUNGRIGE.spuren.z) < 34, skip: () => hungrige_has('bau'),
    start() { const sp = hungrige_spot(22, 30, .35, false, 1.3) || hungrige_spot(16, 22, .9, false, 1.3); if (!sp) return false; const V = hungrige_beast('stag', 1.12); if (!V) return false; if (typeof kr_form === 'function') kr_form(V, 'hals'); // Q-1: am Hals klafft das Fleisch, wo der Kopf sich dreht
      V.g.position.set(sp[0], sp[1], sp[2]); V.ty = sp[1]; hungrige_facePlayer(V, 1); V.g.visible = true; leben_play(V, 'IdleLookAround', 0); this.V = V; this.t = 0; this.ph = 'watch'; this.hT = 0; this.tw = hungrige_twist(V, hungrige_bone(V.m, /Head/), PI); return true; },
    tick(dt) { const V = this.V, d = hungrige_dist(V), p = V.g.position; this.t += dt; leben_beastUpd(V, dt, 90);
      if (this.ph === 'watch') { hungrige_facePlayer(V, dt * 2); if ((hungrige_seen(V, .92, 1.2) && this.t > 1.5) || this.t > 12) { this.ph = 'run'; V.sp = 9; leben_play(V, 'Run', .15); hungrige_ton('ruf', p.x, 1.6, p.z, .7, () => Audio.deerBark ? Audio.deerBark(p.x, p.z) : Audio.grunt(p.x, p.z, true, V.g), { obj: V.g, h: 1.6 }); leben_crowScare(p.x, p.z, 20); } }
      else if (this.ph === 'run') { const P = player.pos; V.tx = P.x; V.tz = P.z; leben_beastMove(V, dt); this.hT -= dt; if (this.hT < 0) { this.hT = .17; hungrige_ton('huf', p.x, .1, p.z, .5, () => hungrige_step(V, .55, .6)); shake = Math.max(shake, .02); } // schwer, schnell, tief
        if (d < 1.9) { this.ph = 'stop'; this.t = 0; leben_play(V, 'AntlersAttack', .08, 1, true); Audio.stinger(true); shake = .07; glitchV = .5; scareCount++; } }
      else if (this.ph === 'stop') { hungrige_facePlayer(V, dt * 6); if (this.t > 1.1) { this.kr = Math.min(1, (this.kr || 0) + dt * .9); const st = Math.floor(this.kr * 5) / 5; if (st > this.tw.k) { this.tw.k = st; hungrige_ton('knochen', p.x, 1.8, p.z, .55, () => Audio.crack()); } } // ohne Hals, in Rasten – jede Raste knackt
        if (this.t > 1.6 && !this.crk) { this.crk = true; hungrige_ton('knochen', p.x, 1.8, p.z, .7, () => Audio.crack()); }
        if (this.t > 2.8) { this.ph = 'gone'; cutLights(1100); hungrige_ton('knurr', p.x, 1.4, p.z, .7, () => Audio.growl(p.x, p.z, true, V.g), { obj: V.g, h: 1.4 }); } }
      else { const f = flatDir(); p.addScaledVector(f, dt * 14); if (this.t > 3.6) return false; }
      hungrige_applyTwist(V); return true; },
    end() { hungrige_off(this.V); hungrige_done('hirsch', 'Ein Meter. Der hat mich gemessen.'); } },
  // 6) Am Amtsbus: ein Heulen aus dem Dunkeln, das mitten im Ton zu Funk wird – Bergung 3, 1992.
  wolf_funk: { need: () => hungrige_tief(player.pos.x, player.pos.z) && (Math.hypot(player.pos.x - HUNGRIGE.wolf.x, player.pos.z - HUNGRIGE.wolf.z) < 40 || (typeof tief_has === 'function' && tief_has('tief_zettel_3'))) && !(typeof K6 !== 'undefined' && K6.falleAn), skip: () => hungrige_has('spuren'),
    start() { const sp = hungrige_spot(22, 30, .9, true); if (!sp) return false; this.p = sp; this.t = 0; this.st = 0; leben_howl(sp[0], sp[1] + .8, sp[2]); return true; },
    tick(dt) { this.t += dt; const [x, y, z] = this.p;
      if (this.st === 0 && this.t > 2.2) { this.st = 1; Audio.radio(x, z); glitchV = Math.max(glitchV, .35); subtitle('*Rauschen* „… Bergung drei … wir haben es … es steht auf wie ein –“', 3400, 'FUNK · 31,10 MHz'); }
      if (this.st === 1 && this.t > 6) { this.st = 2; subtitle('„… Hofer? Hofer, was ist mit deinem Gesicht –“', 3000, 'FUNK · 31,10 MHz'); Audio.whisper(x, 1.6, z, 1.2); }
      if (this.st === 2 && this.t > 9.4) { Audio.radio(x, z, true); Audio.twig(x, z); return false; } return true; },
    end() { hungrige_done('wolf_funk', 'Ein Wolf heult nicht auf der Frequenz vom Amt. Das war eine Stimme, die Heulen übt.'); } },
  // 7) Die wahre Gestalt, weit hinten zwischen den Stämmen. Aufrecht, zu groß, kein Atem. Wer sie anleuchtet, sieht nur Nebel. (Kapitel 6: auf dem Weg vom Lager zum Wrack)
  blick: { need: () => hungrige_tief(player.pos.x, player.pos.z) && hungrige_deep() > .3 && !!hungrige_S.dt && hungrige_has('hirsch') && (typeof k6_nachLager !== 'function' || k6_nachLager()), skip: () => hungrige_has('bau'),
    start() { const sp = hungrige_spot(17, 23, .35, false, 1.9); if (!sp) return false; const D = hungrige_S.dt; D.g.position.set(sp[0], sp[1], sp[2]); D.g.rotation.set(0, Math.atan2(player.pos.x - sp[0], player.pos.z - sp[2]), 0); D.g.scale.setScalar(1); D.g.visible = true; this.t = 0; this.seen = 0; this.sw = rand(0, 6);
      if (story.items.includes('lampion') && !hungrige_S.told.has('anni5')) { hungrige_S.told.add('anni5'); hungrige_stimme(sp[0], 1.6, sp[2], '„Ich hab Hunger, Papa.“', 'ANNI?', 2400, 'anni_5'); setTimeout(() => hungrige_stimme(sp[0], 1.8, sp[2], '„Wir haben alle Hunger, Junge.“', 'HOFER?', 2600, 'hofer_5'), 2500); } // N6-7 Schritt 5
      return true; },
    tick(dt) { const D = hungrige_S.dt, g = D.g; this.t += dt; this.sw += dt; g.rotation.y += Math.sin(this.sw * .7) * dt * .05;
      const p = g.position; if (leben_facing(p.x, p.y + 1.8, p.z) > .9 && hungrige_dist(D) < 40) this.seen += dt; if (this.seen > .6 && !this.sn) { this.sn = true; Audio.whisper(p.x, 1.8, p.z, 1.6); glitchV = Math.max(glitchV, .3); }
      if (hungrige_lit(D, 30, .975, 1.6) && this.seen > 1.5) { Audio.twig(p.x, p.z); Audio.treeCreak(p.x, p.z); hungrige_nebel(p.x, p.y + 1.6, p.z, 1.6); scareCount++; return false; } if (hungrige_dist(D) < 7) { Audio.growl(p.x, p.z, true); glitchV = .6; return false; } if (this.t > 45) return false; return true; },
    end() { hungrige_dtHide(); const ext = story.lore.some(l => l.key === 'hungrige_seite_6' || /^pell_?0?8$/.test(l.key)) ? ' … Eine Lampe reicht. Wenn man sie nicht senkt.' : '';
      hungrige_done('blick', 'Zu groß für einen Hirsch. Zu aufrecht. Und im Licht war da nur Nebel.' + ext); } },
  // 8) Gefreiter Hofer im Bergungsanzug von damals, mit dem Rücken zu dir. Der Kopf dreht sich zu dir um – der Körper bleibt stehen. Drei Stimmen aus einem Mund, der sich nicht bewegt.
  // Kapitel 6: Pflichtstelle zwischen Fraßstelle und Wrack (nach dem Lager)
  hofer: { need: () => hungrige_has('spuren') && hungrige_tief(player.pos.x, player.pos.z) && player.pos.x < 34 && typeof figuren_embody === 'function' && (typeof k6_nachLager !== 'function' || k6_nachLager()), skip: () => hungrige_has('bau'),
    start() { const sp = hungrige_spot(11, 15, .35, false, 1.6); if (!sp) return false; const S = hungrige_S; if (!S.hoferG) { S.hoferG = new THREE.Group(); scene.add(S.hoferG); }
      const g = S.hoferG; g.position.set(sp[0], sp[1], sp[2]); g.rotation.y = Math.atan2(sp[0] - player.pos.x, sp[2] - player.pos.z); g.visible = true; this.t = 0; this.ph = 'wait'; this.P = null; this.v = 0;
      const an = P => { if (!P) return false; this.P = P; this.head = hungrige_bone(P.obj, /^(mixamorig)?Head$|Head$/i); if (P.mx) P.mx.timeScale = .15; return true; }; // Rückfall Polizist (Bibel 1.11); Atmung fast still
      figuren_embody(g, 'blechmann', { clip: 'idle' }).then(P => an(P) || figuren_embody(g, 'polizist', { clip: 'idle' }).then(Q => { if (!an(Q)) this.fail = true; })).catch(() => { this.fail = true; }); return true; },
    tick(dt) { this.t += dt; if (this.fail) return false; const g = hungrige_S.hoferG, p = g.position, d = Math.hypot(p.x - player.pos.x, p.z - player.pos.z), f = leben_facing(p.x, p.y + 1.5, p.z);
      if (this.ph === 'wait') { if (f > .9 && d < 30) this.seen = (this.seen || 0) + dt; if (this.seen > 1.4) { this.ph = 'turn'; this.k = 0; hungrige_ton('knochen', p.x, 1.7, p.z, .6, () => Audio.crack()); } else if (this.t > 40) return false; }
      else if (this.ph === 'turn') { this.k = Math.min(1, this.k + dt * .55); if (this.k >= 1 && !this.sp) { this.sp = true; this.spT = this.t; }
        if (this.sp) { const T = this.t - this.spT; // drei Stimmen, ein Mund, der sich nicht bewegt
          if (this.v === 0) { this.v = 1; hungrige_stimme(p.x, 1.7, p.z, '„… Bergung drei … ich hab Hunger, Junge …“', 'HOFER?', 3000, 'hofer_8a'); }
          else if (this.v === 1 && T > 3.4) { this.v = 2; hungrige_stimme(p.x, 1.6, p.z, '„Papa, ich bin’s.“', 'ANNI?', 2200, 'anni_8'); }
          else if (this.v === 2 && T > 6) { this.v = 3; hungrige_stimme(p.x, 1.7, p.z, '„Every bite. It gets hungrier with every bite.“', 'PELL?', 3200, 'pell_8'); } }
        if (this.sp && ((flashOn && f > .975 && d < 20 && this.t > this.spT + 9.4) || d < 3.5 || this.t > this.spT + 13)) { this.ph = 'gone'; glitchV = .7; shake = .05; scareCount++; hungrige_ton('knurr', p.x, 1.6, p.z, .7, () => Audio.growl(p.x, p.z, true)); hungrige_nebel(p.x, p.y + 1.4, p.z, 1.3); cutLights(700); return false; } if (this.t > 60) return false; }
      if (this.head && this.k) { if (!this.base) this.base = this.head.quaternion.clone(); const kk = Math.floor(this.k * 6) / 6; if (kk !== this.kk) { this.kk = kk; if (kk > 0) hungrige_ton('knochen', p.x, 1.7, p.z, .45, () => Audio.crack()); } hungrige_Q.setFromEuler(hungrige_E.set(0, PI * kk, 0)); /* Q-1: der Kopf rastet in sechs Stufen, jede knackt */ this.head.quaternion.copy(this.base).multiply(hungrige_Q); } return true; },
    end() { const g = hungrige_S.hoferG; if (g) g.visible = false; hungrige_done('hofer', 'Eine Uniform vom Amt. Vom alten. Der Kopf hat sich zu mir gedreht, und der Körper ist stehen geblieben.');
      setTimeout(() => { if (!state.talking) subtitle('Er hat sie alle gefressen und keinen richtig verdaut.', 3400, 'LUKE'); }, 4200); } },
};
// ---------------------------------------------------------------- Garantierte Begegnungen: die Nackten (Hochsitz, Amtsbus)
const HUNGRIGE_NACKT = {
  // Ein Reh ohne Fell steht auf dem Pfad zum Hochsitz. Es kommt auf dich zu, langsam, Kopf schief. Licht drauf – es rennt.
  reh: { at: HUNGRIGE.reh, r: 15,
    start() { const sp = hungrige_spot(9, 13, .5); if (!sp) return false; const V = hungrige_beast('deer', 1.04); if (!V) return false; hungrige_nackt(V);
      V.g.position.set(sp[0], sp[1], sp[2]); V.ty = sp[1]; hungrige_facePlayer(V, 1); V.g.visible = true; leben_play(V, 'IdleLookAround', 0); this.V = V; this.t = 0; this.ph = 'look'; this.lit = 0; this.tw = hungrige_twist(V, hungrige_bone(V.m, /Head/), .9); this.tw && (this.tw.k = 1);
      Audio.whisper(sp[0], 1.2, sp[2], 1.4); glitchV = Math.max(glitchV, .25); return true; },
    tick(dt) { const V = this.V, d = hungrige_dist(V), p = V.g.position; this.t += dt; leben_beastUpd(V, dt, 60); hungrige_facePlayer(V, dt * 2.5);
      if (this.ph === 'look') { if (this.t > 2.2 && hungrige_seen(V, .85, .9)) { this.ph = 'come'; V.sp = .55; leben_play(V, 'Walk', .4, .55); this.hT = 0; } else if (this.t > 30) return false; }
      else if (this.ph === 'come') { const still = Math.hypot(vel.x, vel.z) < .25; // wie ein Hund, der seinen Namen hört: bleibt Luke stehen, bleibt es stehen und legt den Kopf schief
        if (still && d < 9) { if (!this.halt) { this.halt = true; leben_play(V, 'IdleLookAround', .35); if (V.cur) V.cur.timeScale = .35; } if (this.tw) this.tw.k = 1 + .35 * Math.sin(this.t * 1.3); }
        else { if (this.halt) { this.halt = false; leben_play(V, 'Walk', .35, .55); } if (this.tw) this.tw.k = 1; V.tx = player.pos.x; V.tz = player.pos.z; leben_beastMove(V, dt, false); this.hT -= dt; if (this.hT < 0) { this.hT = 1.1; hungrige_nass(V, .28); } }
        if (hungrige_lit(V, 18, .96, .9)) this.lit += dt; else this.lit = Math.max(0, this.lit - dt);
        if (this.lit > 1.3 || d < 2.4) { this.ph = 'run'; V.sp = 8; const P = player.pos, dx = p.x - P.x, dz = p.z - P.z, L = Math.hypot(dx, dz) || 1; V.tx = p.x + dx / L * 50; V.tz = p.z + dz / L * 50; leben_play(V, 'Run', .15); Audio.grunt(p.x, p.z, true, V.g); this.hT = 0; scareCount++; if (d < 2.4) { shake = .06; glitchV = .5; } } }
      else { leben_beastMove(V, dt); this.hT -= dt; if (this.hT < 0) { this.hT = .2; hungrige_nass(V, .35); } if (d > 40 || this.t > 60) return false; }
      hungrige_applyTwist(V); return true; },
    end() { hungrige_off(this.V); hungrige_done('nackt_reh', 'Kein Fell. Nur Fleisch, als wär es gerade erst angezogen worden.'); setTimeout(() => { if (!state.talking) subtitle('Geschält. Vegas hat das gesagt. Wie ’ne Kartoffel.', 3200, 'LUKE'); }, 3600); } },
  // Ein Wolf ohne Fell liegt neben dem Amtsbus wie tot. Er steht auf, wenn du nah bist. Wer wegsieht, hat ihn danach näher.
  wolf: { at: HUNGRIGE.wolf, r: 13,
    start() { const B = HUNGRIGE.wolf; let sp = null; for (let k = 0; k < 20 && !sp; k++) { const x = B.x + rand(-7, 7), z = B.z + rand(-7, 7); if (Math.hypot(x - player.pos.x, z - player.pos.z) < 5 || !leben_free(x, z, .5, .9)) continue; const sg = solidGround(x, .6, z); sp = [x, sg > -1 ? Math.max(0, sg) : 0, z]; }
      if (!sp) return false; const V = hungrige_beast('wolf', 1.2); if (!V) return false; hungrige_nackt(V); V.g.position.set(sp[0], sp[1], sp[2]); V.ty = sp[1]; V.g.rotation.y = rand(0, 6.28); V.g.visible = true; leben_play(V, 'Rest', 0); V.mx.update(2); this.V = V; this.t = 0; this.ph = 'lie'; this.away = 0; this.jumps = 0; return true; },
    tick(dt) { const V = this.V, d = hungrige_dist(V), p = V.g.position, f = leben_facing(p.x, p.y + .5, p.z); this.t += dt; leben_beastUpd(V, dt, 60);
      if (this.ph === 'lie') { if (d < 6.5 && f > .6) { this.ph = 'rise'; this.t = 0; leben_play(V, 'RestToGoBackUp', .1, 1, true); hungrige_ton('stoehn', p.x, .4, p.z, .5, () => Audio.groan(p.x, p.z, false)); glitchV = Math.max(glitchV, .3); } else if (this.t > 90) return false; }
      else if (this.ph === 'rise') { hungrige_facePlayer(V, dt * 1.5); if (this.t > 1.9) { this.ph = 'stare'; leben_play(V, 'IdleAggressive', .3); hungrige_ton('knurr', p.x, .5, p.z, .45, () => Audio.growl(p.x, p.z, false)); this.t = 0; } }
      else if (this.ph === 'stare') { hungrige_facePlayer(V, dt * 4); if (f < .35 && d < 20) this.away += dt; else if (this.away > .5 && f > .8) { this.away = 0; const P = player.pos, k = Math.max(0, 1 - 2.6 / (d || 1)); p.x = P.x + (p.x - P.x) * k * .62; p.z = P.z + (p.z - P.z) * k * .62; hungrige_nass(V, .4); hungrige_ton('knurr', p.x, .5, p.z, .6, () => Audio.growl(p.x, p.z, true)); glitchV = Math.max(glitchV, .4); shake = Math.max(shake, .02); }
        if (d < 2.6) { this.ph = 'bite'; this.t = 0; leben_play(V, 'JumpBite', .05, 1, true); Audio.stinger(true); scareCount++; shake = .08; glitchV = .7; setTimeout(() => cutLights(900), 450); } else if (this.t > 75) return false; }
      else if (this.ph === 'bite') { hungrige_facePlayer(V, dt * 6); if (this.t > 1.35) return false; }
      return true; },
    end() { hungrige_off(this.V); hungrige_done('nackt_wolf', 'Er lag da wie tot. Ohne Fell, ohne Haut fast. Und jedes Mal, wenn ich weggesehen hab, war er näher. … Was hier im Wald wohnt, hat keine Eile.'); } },
};
// ---------------------------------------------------------------- Kapitel 6 · Die Enthüllung: zwei Whiskeys, und der echte vertreibt den Hungrigen
// Die zwei Raben am Bau (Abnahme AP-23): Whiskey = Ring LINKS, abstehende Feder links, fast weiße Augen, die Brust hebt sich · der falsche = spiegelverkehrt (Ring RECHTS,
// Feder rechts), schwarze nasse Augen, keine Atmung (Clip steht), stumme Flügel. Augen/Feder sind kleine Teile an den Knochen (bis die Qualitätswelle eigene Texturen bringt).
function hungrige_raven(mirror) { const V = hungrige_beast('crow', 1.45); if (!V) return null; V.m.traverse(o => { if (!o.isMesh) return; o.castShadow = true; o.material = [].concat(o.material).map(x => { const c = x.clone(); c.color = (c.color || new THREE.Color(1, 1, 1)).clone().multiplyScalar(.55); c.roughness = .45; return c; }); if (o.material.length === 1) o.material = o.material[0]; });
  if (typeof whiskey_ring === 'function') try { whiskey_ring(V.m, false); } catch (e) {} // AP-08: eiserner Ring am linken Lauf – beim gespiegelten Nachbild sitzt er dadurch rechts
  try { const head = hungrige_bone(V.m, /(^|-)Head$/), wing = hungrige_bone(V.m, /^WingLeftC$/), spine = hungrige_bone(V.m, /(^|-)Spine$/);
    const eyeM = mirror ? new THREE.MeshStandardMaterial({ color: 0x040404, roughness: .08, metalness: .2 }) : new THREE.MeshStandardMaterial({ color: 0xdedbd0, roughness: .12, emissive: 0xdfe9ff, emissiveIntensity: .12 });
    if (head) for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.0048, 10, 8), eyeM); e.position.set(.021, s * .0122, .005); e.castShadow = false; head.add(e); }
    if (wing) { const f = new THREE.Mesh(new THREE.PlaneGeometry(.075, .013), new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: .5, side: THREE.DoubleSide })); f.position.set(.03, 0, .01); f.rotation.set(0, .5, .45); wing.add(f); } // die abstehende Feder
    V.look = { eyeM, spine, s0: spine ? spine.scale.clone() : null }; } catch (e) { console.warn('Hungrige: Rabe', e); }
  if (mirror) V.g.scale.x = -1; return V; }
function hungrige_flyTo(V, to, dur, apex = 3) { const from = V.g.position.clone(); V.fl = { from, to: to.clone(), ctrl: new THREE.Vector3((from.x + to.x) / 2, Math.max(from.y, to.y) + apex, (from.z + to.z) / 2), t: 0, dur }; leben_play(V, 'Fly', .15); }
const _hfA = new THREE.Vector3(), _hfB = new THREE.Vector3(), _hfP = new THREE.Vector3(), _hfW = new THREE.Vector3(); // keine Allokation im Takt
function hungrige_flyTick(V, dt) { const F = V.fl; if (!F) return false; F.t += dt; const k0 = Math.min(1, F.t / F.dur), k = F.dur > .6 ? .25 * k0 + .75 * (1 - (1 - k0) * (1 - k0)) : k0, a = _hfA.lerpVectors(F.from, F.ctrl, k), b = _hfB.lerpVectors(F.ctrl, F.to, k), p = _hfP.lerpVectors(a, b, k); // Q-1: schnell ab, bremsend an
  const g = V.g, dx = p.x - g.position.x, dz = p.z - g.position.z, dy = p.y - g.position.y, h = Math.hypot(dx, dz);
  if (h > 1e-3) { const y = Math.atan2(dx, dz), yr = Math.atan2(Math.sin(y - g.rotation.y), Math.cos(y - g.rotation.y)) / Math.max(dt, 1e-3); g.rotation.y = y; g.rotation.z += (Math.max(-.55, Math.min(.55, -yr * .3 * (g.scale.x < 0 ? -1 : 1))) - g.rotation.z) * Math.min(1, dt * 6); }
  g.rotation.x += (Math.max(-.45, Math.min(.45, -Math.atan2(dy, h + 1e-3) * .7)) * (k0 > .85 ? -.6 : 1) - g.rotation.x) * Math.min(1, dt * 8); g.position.copy(p); // Nase in Flugrichtung, beim Landen aufgerichtet
  if (k0 >= 1) { V.fl = null; g.rotation.x = 0; g.rotation.z = 0; return true; } return false; }
async function hungrige_finale() {
  const S = hungrige_S, W = new THREE.Vector3(), wait_ = wait; if (S.finale || S.cine || S.finBusy) return; S.finBusy = true; // Spielzeit: steht bei Pause
  try { await hungrige_finaleRun(S, W, wait_); } catch (e) { console.error('Hungrige: Finale', e); }
  finally { S.finBusy = false; if (typeof setCamOverride === 'function' && S.camAus) { setCamOverride(null); S.camAus = false; } if (S.bass) { try { S.bass.gain.setTargetAtTime(0, Audio.ctx.currentTime, .1); } catch (e) {} S.bass = null; }
    if (S.cine) { try { hungrige_off(S.cine.A); hungrige_off(S.cine.B); hungrige_dtHide(); } catch (e) {} S.cine = null; state.talking = false; dir.busy = false; lightBoost = 0; if (S.ravenL) S.ravenL.intensity = 0; if (typeof whiskey_S !== 'undefined' && whiskey_S.g) whiskey_S.g.visible = true; hungrige_finaleSkip(); }
    if (typeof k6_feuerzeug === 'function' && S.finale) k6_feuerzeug(false); } // Fehler mitten im Finale: Feuerzeug weg, Lampe an – der Epilog startet trotzdem
}
// Finale nicht spielbar (Modell fehlt, Fehler mitten drin): Aufgabe trotzdem abschließen – nie eine offene Nebenaufgabe ohne Weg
function hungrige_finaleSkip() { const S = hungrige_S; if (S.finale) return; S.finale = true; try { sideDone('hungrige', 'Der Wendigo hat sich gezeigt, und Whiskey hat ihn vertrieben.'); hungrige_desc(); } catch (e) {} }
// Lidschlag (0,2 s Schwarz) – die Bildsprache des Spiels
function hungrige_lid(ms = 200) { if (typeof kino_blinzeln === 'function') { try { kino_blinzeln(ms / 2000, ms / 2000); return; } catch (e) {} } const f = $('fade'); f.style.transition = 'none'; f.style.background = '#000'; f.style.opacity = 1; setTimeout(() => { f.style.transition = 'opacity .08s'; f.style.opacity = 0; }, ms); }
// Musik im Höhepunkt (Bibel-Tabelle): Kontrabass pianissimo ab 0:19 (bricht beim Lidschlag ab) · Celesta E D C H C beim Kreisen (bricht nach dem fünften Ton ab)
function hungrige_bass(an) { const A = Audio, S = hungrige_S; if (!A.ctx || typeof KI === 'undefined') return; if (an) { const g = A.ctx.createGain(); g.gain.value = 1; g.connect(A.master); S.bass = g; try { KI.bow(A.ctx, g, A.ctx.currentTime, 41.2, 9, .05, 600); } catch (e) {} }
  else if (S.bass) { S.bass.gain.setTargetAtTime(0, A.ctx.currentTime, .015); const g = S.bass; S.bass = null; setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 800); } }
function hungrige_celesta() { const A = Audio; if (!A.ctx || typeof KI === 'undefined') return; const t = A.ctx.currentTime + .05; [659.3, 587.3, 523.3, 493.9, 523.3].forEach((f, i) => { try { KI.box(A.ctx, A.master, t + i * .62, f, .07); } catch (e) {} }); }
// Story-Prüfung T-4: unter der Celesta summt eine Frauenstimme die fünf Töne mit, ohne Worte, aus der Richtung des Raben (Mira, nur ihr Klang)
function hungrige_summen(x, y, z) { const A = Audio; if (!A.ctx || !A.at) return; const c = A.ctx, t0 = c.currentTime + .08, d = A.at(x, y, z, 9);
  try { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; const bp = c.createBiquadFilter(); bp.type = 'peaking'; bp.frequency.value = 820; bp.Q.value = 1.4; bp.gain.value = 5; lp.connect(bp); bp.connect(d);
    [329.6, 293.7, 261.6, 246.9, 261.6].forEach((f, i) => { const t = t0 + i * .62, len = i === 4 ? 1.05 : .6, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain(), vib = c.createOscillator(), vg = c.createGain();
      o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2.003; vib.frequency.value = 4.8; vg.gain.value = f * .007; vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
      g2.gain.value = .22; o2.connect(g2); o.connect(g); g2.connect(g); g.connect(lp); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.035, t + .14); g.gain.setValueAtTime(.035, t + len - .15); g.gain.linearRampToValueAtTime(0, t + len);
      for (const q of [o, o2, vib]) { q.start(t); q.stop(t + len + .05); } }); } catch (e) {} }
// R6-5 „Welcher ist Whiskey?“: sechs Sekunden, E streckt die Hand aus – nach dem Raben, den Luke gerade ansieht
function hungrige_hand(C, A, B, ms) { return new Promise(res => { let done = false; if (typeof k6_hinweis === 'function') k6_hinweis('E', 'Hand ausstrecken');
  const fin = v => { if (done) return; done = true; removeEventListener('keydown', key, true); if (typeof k6_hinweis === 'function') k6_hinweis(''); res(v); };
  const key = e => { if (e.code !== 'KeyE' || e.repeat) return; e.preventDefault(); e.stopImmediatePropagation(); const a = A.g.position, b = B.g.position; fin(leben_facing(a.x, a.y + .2, a.z) >= leben_facing(b.x, b.y + .2, b.z) ? 'A' : 'B'); };
  addEventListener('keydown', key, true); setTimeout(() => fin(null), ms); }); }
function hungrige_handPos(v) { return v.set(.07, -.2, -.4).applyQuaternion(camera.quaternion).add(camera.position); } // Lukes Handgelenk vor der Kamera
async function hungrige_finaleRun(S, W, wait_) {
  const D = await hungrige_loadDT(); if (!D) return hungrige_finaleSkip();
  if (state.talking || ui.overlay) { S.finT = 1.5; return; } // der Takt versucht es gleich noch einmal
  const P = HUNGRIGE.pfahl, B = HUNGRIGE.bau, top = (S.fix.pfahlTop || 1.6) + .38; const A = S.ravA || hungrige_raven(false), Bv = S.ravB || hungrige_raven(true); S.ravB = null; if (!A || !Bv) { hungrige_off(A); hungrige_off(Bv); return hungrige_finaleSkip(); } // Bv wird verwandelt: nie wiederverwenden
  const C = S.cine = { A, B: Bv, t: 0, look: null, lookK: 2, light: null, dt: D, ph: 'vor', heart: false, heartT: 0 };
  state.talking = true; dir.busy = true; if (hungrige_S.ev) { try { hungrige_S.ev.end(); } catch (e) {} hungrige_S.ev = null; }
  const real = typeof whiskey_S !== 'undefined' && whiskey_S.g; if (real) real.visible = false;
  C.light = S.ravenL; // beim Laden angelegt (Intensität 0) – folgt dem Raben im Takt, kein neues Licht zur Laufzeit
  // 0) Davor (Bibel): Lampe flackert und stirbt, der Batteriewechsel scheitert (sie fällt zwischen die Rippen), Peters Feuerzeug, die Gravur halblaut
  if (typeof k6_lampeStirbt === 'function') { try { await k6_lampeStirbt(); } catch (e) { console.warn('Kapitel6: Feuerzeug', e); } }
  // 1) Whiskey fliegt über Luke hinweg und landet auf dem Pfahl – ab hier führt das Spiel den Blick (0:00–0:04)
  C.look = new THREE.Vector3(P.x, top, P.z); C.ph = 'in';
  const f = flatDir(); A.g.position.set(player.pos.x - f.x * 9, 5.5, player.pos.z - f.z * 9); A.g.visible = true; hungrige_flyTo(A, W.set(P.x, top, P.z), 2.6, 2.5); Audio.flap(player.pos.x, 3, player.pos.z); setTimeout(() => Audio.flap(P.x, top, P.z), 2300);
  await wait_(2700); leben_play(A, 'Landing', .1, 1, true); await wait_(700); leben_play(A, 'IdleLookAround', .3);
  await say([['Whiskey. … Du bist mir nachgeflogen.', 2400, 'LUKE']]);
  // 2) Links vom Pfahl (aus Lukes Sicht), auf einer Rippe: ein zweiter Rabe – er landet ohne ein einziges Geräusch (0:04–0:07)
  let sp = null; { const lx = P.x - player.pos.x, lz = P.z - player.pos.z, ll = Math.hypot(lx, lz) || 1, x = P.x + lz / ll * 1.5 - lx / ll * .5, z = P.z - lx / ll * 1.5 - lz / ll * .5, g = solidGround(x, .6, z);
    if (leben_free(x, z, .3, .5)) sp = [x, g > -1 ? Math.max(0, g) : 0, z]; }
  sp = sp || hungrige_spot(2.2, 3.6, 1.1, false, 1.2) || [B.x + 2.6, Math.max(0, solidGround(B.x + 2.6, .6, B.z + .8)), B.z + .8]; const bx = sp[0], bz = sp[2], by = sp[1] + .12;
  if (typeof whiskey_S !== 'undefined') { A.g.rotation.y = Math.atan2(bx - P.x, bz - P.z); } // Whiskey dreht den Kopf nach links, Luke folgt ihm
  Bv.g.position.set(bx - (P.z - player.pos.z) * .5, 4.5, bz + (P.x - player.pos.x) * .5); Bv.g.visible = true; hungrige_flyTo(Bv, W.set(bx, by, bz), 2, 1.5); C.look.set(bx, by + .4, bz); // keine Flügelgeräusche
  await wait_(2100); leben_play(Bv, 'IdleLookAround', 0); Bv.mx.update(.3); if (Bv.cur) Bv.cur.timeScale = 0; C.heart = true; // die Brust steht still · Lukes Herzschlag kommt unter die Mischung
  C.ph = 'zwei'; C.look.set((P.x + bx) / 2, top * .6, (P.z + bz) / 2);
  await say([['… Zwei. Da sind zwei.', 2200, 'LUKE']]);
  // 3) Der Blick springt zweimal hin und her (0:10–0:16): Ring rechts, Feder rechts, schwarze Augen, keine Atmung – R6-5 „Hand ausstrecken“
  C.spring = { a: A.g.position, b: Bv.g.position, t: 0 };
  const wahl = await hungrige_hand(C, A, Bv, 6000); C.spring = null; let falsch = false;
  if (wahl === 'A') { const home = A.g.position.clone(); A.fl = { from: home.clone(), to: hungrige_handPos(_hfW).clone(), ctrl: home.clone().add(W.set(0, .8, 0)), t: 0, dur: .45 }; leben_play(A, 'Hop', .08, 1, true); Audio.flap(home.x, home.y, home.z);
    await wait_(500); C.handA = true; shake = Math.max(shake, .015); subtitle('<i>Krallen. Gewicht. Warm.</i>', 2200); await wait_(1500); C.handA = false; A.fl = { from: A.g.position.clone(), to: home, ctrl: home.clone().add(W.set(0, .7, 0)), t: 0, dur: .5 }; await wait_(600); }
  else if (wahl === 'B') { falsch = true; const home = Bv.g.position.clone(), tH = hungrige_twist(Bv, hungrige_bone(Bv.m, /Head/), PI); if (Bv.cur) Bv.cur.timeScale = 0; // er wiegt nichts und ist kalt
    Bv.fl = { from: home.clone(), to: hungrige_handPos(_hfW).clone(), ctrl: home.clone().add(W.set(0, .6, 0)), t: 0, dur: .4 }; await wait_(450); C.handB = true; subtitle('<i>Kein Gewicht. Kalt.</i>', 1800); await wait_(900);
    hungrige_lucy(Bv.g.position.x, Bv.g.position.y, Bv.g.position.z, '„Großer …“', 2000); await wait_(1200); C.twistK = tH; hungrige_ton('knochen', Bv.g.position.x, Bv.g.position.y, Bv.g.position.z, .7, () => Audio.crack()); shake = .04; await wait_(900);
    C.handB = false; Audio.play('crow2', { gain: .9, rate: .7, x: P.x, y: top, z: P.z, ref: 5, obj: A.g }); hungrige_flyTo(A, W.copy(Bv.g.position), .35, .2); leben_play(A, 'FlyingAttack', .05, 1.3, true); await wait_(380); // Whiskey fegt ihn herunter
    Bv.fl = { from: Bv.g.position.clone(), to: home, ctrl: home.clone().add(W.set(0, .4, 0)), t: 0, dur: .5 }; hungrige_flyTo(A, W.set(P.x, top, P.z), .8, 1); await wait_(900); leben_play(A, 'IdleLookAround', .3); }
  // 4) 0:16–0:19: er öffnet den Schnabel, ohne den Kopf zu bewegen – Lucys Stimme direkt am linken Ohr, KEINE Spieluhr darunter
  C.look.set(bx, by + .3, bz);
  if (!falsch) { hungrige_lucy(player.pos.x - Math.cos(player.yaw) * .4, 1.6, player.pos.z + Math.sin(player.yaw) * .4, '„Großer …“', 2200); await wait_(2600); }
  // 0:19–0:21 Whiskey reißt den Schnabel auf und hüpft auf ihn zu – der erste laute Laut; ein tiefer Kontrabass-Ton setzt ein
  Audio.play('crow2', { gain: .8, rate: .7, x: P.x, y: top, z: P.z, ref: 5, obj: A.g }); leben_play(A, 'Hop', .1, 1, true); hungrige_bass(true); await wait_(1300);
  await say([[wahl === 'A' ? 'Der linke atmet nicht. … Der linke hat noch nie geatmet. … Ich wusste es. Der Ring.' : 'Der linke atmet nicht. … Der linke hat noch nie geatmet.', 3200, 'LUKE']]);
  // 5) 0:25 Lidschlag – danach ist der Kopf um 180 Grad gedreht; anderthalb Sekunden nichts, auch kein Atem
  const head = hungrige_bone(Bv.m, /Head/), neck = hungrige_bone(Bv.m, /Neck/), spine = hungrige_bone(Bv.m, /Spine/), feathers = hungrige_bones(Bv.m, /Wing(Left|Right)[A-H]|Feather/);
  hungrige_lid(200); hungrige_bass(false); await wait_(100);
  const tHead = falsch ? C.twistK : hungrige_twist(Bv, head, PI); if (tHead) tHead.k = 1; if (!falsch) hungrige_ton('knochen', bx, by, bz, .8, () => Audio.crack()); C.heart = false; C.ph = 'twist'; C.look.set(bx, by + .5, bz);
  await wait_(1500);
  // 0:28–0:33 Die Federn fallen gerade nach unten wie nasses Laub, darunter rohes Fleisch; der Hals wird lang; die Flamme neigt sich zu ihm hin
  const tNeck = hungrige_twist(Bv, neck, 0, [1.4, 3.8, 1.4]), tSpine = hungrige_twist(Bv, spine, 0, [1.7, 2.6, 1.3]); const tF = feathers.map(b => hungrige_twist(Bv, b, 0, [.02, .02, .02]));
  C.ph = 'morph'; C.t = 0; Audio.play('scrape3', { gain: .3, rate: .42, x: bx, y: .4, z: bz, ref: 3 }); scareCount++; glitchV = .6; shake = .05; if (typeof k6_flamme === 'function') k6_flamme(1, bx, by + .5, bz);
  const flesh = hungrige_flesh(); setTimeout(() => { if (!(typeof kr_form === 'function' && kr_form(Bv, 'rabe'))) Bv.m.traverse(o => { if (o.isMesh) o.material = flesh; }); }, 1500); // Q-1: rohes Fleisch mit Fasern, Adern, Nässe
  hungrige_ton('fleisch', bx, by + .3, bz, .7); setTimeout(() => hungrige_ton('knochen', bx, by + .3, bz, .8, () => Audio.crack()), 1000); setTimeout(() => hungrige_ton('knochen', bx, by + .3, bz, .9, () => Audio.crack()), 2200); setTimeout(() => hungrige_ton('fleisch', bx, by + .5, bz, .8), 1700); setTimeout(() => { Audio.screech(); setTimeout(() => Audio.groan(bx, bz, true), 700); }, 2600);
  if (Audio.ctx) { const o = Audio.osc('sine', 33, 0, 5.2); Audio.env(o, .16, 1.6, 3.4, 0, Audio.master); } // Subbass schwillt an
  C.morph = { tHead, tNeck, tSpine, tF }; await wait_(3000);
  // 6) 0:33–0:36 Schnitt von hinten unten (Kniehöhe, links hinter Luke): aus dem Vogel steigt das Hirschding – ruckend wie ein Film mit fehlenden Bildern; drei Stimmen flüstern „Hunger.“
  D.g.position.set(bx, by - .12, bz); D.g.rotation.set(0, Math.atan2(player.pos.x - bx, player.pos.z - bz), 0); D.s0 = D.o.scale.x; D.g.scale.setScalar(.06); D.g.visible = true; C.ph = 'rise'; C.t = 0; hungrige_ton('knochen', bx, 1, bz, .9); setTimeout(() => hungrige_ton('knochen', bx, 1.8, bz, .8), 600); Audio.groan(bx, bz, true); glitchV = .8; shake = .09;
  if (typeof setCamOverride === 'function') { const lk = new THREE.Vector3(bx, by + 2.1, bz), fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), cx = player.pos.x - fx * 1.25 + fz * .55, cz = player.pos.z - fz * 1.25 - fx * .55;
    S.camAus = true; setCamOverride(cam => { cam.position.set(cx + Math.sin(C.t * 7) * .01, .52, cz); cam.lookAt(lk.x, D.g.position.y + 1.9 * D.g.scale.x, lk.z); }); if (typeof k6_feuerzeugWelt === 'function') k6_feuerzeugWelt(true); }
  setTimeout(() => { hungrige_stimme(bx, 2, bz, '„Hunger.“', 'HOFER? · PELL? · ANNI?', 2600, 'drei_hunger'); Audio.whisper(bx + .4, 2.1, bz, 1.4); Audio.whisper(bx - .4, 1.9, bz, 1.2); }, 900);
  await wait_(1500); Bv.g.visible = false; await wait_(1600);
  // 0:36 Lidschlag, zurück in Lukes Augen, Blick steil nach oben
  hungrige_lid(200); await wait_(110); if (S.camAus) { setCamOverride(null); S.camAus = false; if (typeof k6_feuerzeugWelt === 'function') k6_feuerzeugWelt(false); } C.look.set(bx, by + 2.4, bz); C.lookK = 5; state.flashFail = Math.max(state.flashFail, .9);
  await say([['Nein. Nein, nein –', 1800, 'LUKE']]); C.lookK = 2;
  // 7) 0:38–0:44 zwei Schritte auf Luke zu, zwei Stöße der Kamera; bei jedem Schritt wird die Flamme kleiner. Hofer, dann Lukes eigene Stimme.
  C.ph = 'come'; C.t = 0; hungrige_ton('huf', bx, .2, bz, .9, () => Audio.thump(bx, .5, bz)); shake = .06; if (typeof k6_flamme === 'function') k6_flamme(.72); await wait_(1100); hungrige_ton('huf', D.g.position.x, .2, D.g.position.z, 1, () => Audio.thump(D.g.position.x, .5, D.g.position.z)); shake = .07; if (typeof k6_flamme === 'function') k6_flamme(.45); await wait_(600);
  hungrige_stimme(D.g.position.x, 2.2, D.g.position.z, '„Ich hab Hunger, Junge.“', 'HOFER?', 2400, 'hofer_fin'); await wait_(2500);
  hungrige_stimme(D.g.position.x, 2.2, D.g.position.z, '„Luke?“', 'DEINE STIMME?', 2000, 'luke_ruf'); if (typeof k6_senderBeiIhm === 'function' && k6_senderBeiIhm()) for (let i = 0; i < 6; i++) setTimeout(() => { if (Audio.ctx) { const o = Audio.osc('square', 2350, 0, .05); Audio.env(o, .025, .002, .04, 0, Audio.at(D.g.position.x, 1.6, D.g.position.z, 2)); } }, i * 520); // der weggeworfene Sender piept aus ihm heraus
  await wait_(2100);
  // 8) 0:44–0:58 Whiskey stößt sich ab – ein Windstoß in der Stille; kreist, das Licht in ihm wächst (Celesta, fünf Töne); drei Stöße
  C.ph = 'attack'; C.t = 0; C.dive = 0; leben_play(A, 'TakeOff', .1, 1.2, true); Audio.flap(P.x, top, P.z); Audio.play('wingFlap', { gain: .6, rate: .8, x: P.x, y: top, z: P.z, ref: 4, obj: A.g }); Audio.caw(P.x, top + 1, P.z); if (Audio.gust) Audio.gust(1.3); if (typeof k6_windStoss === 'function') k6_windStoss();
  await wait_(500); hungrige_flyTo(A, W.set(bx + 5, by + 5.5, bz - 4), 1.6, 3); hungrige_celesta(); hungrige_summen(bx + 5, by + 5.5, bz - 4); await wait_(1650);
  for (let i = 0; i < 3; i++) { C.dive = i + 1; const from = A.g.position.clone(); hungrige_flyTo(A, W.set(D.g.position.x, by + 1.9, D.g.position.z), .9, .2); leben_play(A, 'FlyingAttack', .05, 1.3, true); Audio.screech(); if (Audio.gust) Audio.gust(1.2);
    await wait_(950); C.recoil = 1; hungrige_nebel(D.g.position.x, 1.4, D.g.position.z, .9); shake = Math.max(shake, .05 + i * .02); glitchV = Math.max(glitchV, .35); hungrige_ton('knurr', D.g.position.x, 2, D.g.position.z, .8, () => Audio.growl(D.g.position.x, D.g.position.z, true));
    if (i === 1) hungrige_stimme(D.g.position.x, 2.2, D.g.position.z, '„Come ho–“', 'PELL?', 1500, 'pell_fin');
    if (i < 2) { hungrige_flyTo(A, W.set(from.x + rand(-2, 2), by + 5, from.z + rand(-2, 2)), 1.1, 2.5); await wait_(1150); } }
  // 0:58 dritter Stoß: eine Sekunde lang ist der Wald Tag – Knochen, Häute in den Bäumen, der Beobachter mit den Händen auf den Ohren; alle Waldgeräusche auf einmal, dann abgeschnitten
  C.ph = 'flash'; C.t = 0; Audio.crack(); Audio.thunder(.1, 1); lightBoost = 1.2; skyMat && skyMat.uniforms && (skyMat.uniforms.flash.value = .8);
  if (typeof beob_sichtung === 'function') { const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw); try { beob_sichtung([bx + fz * 6 + fx * 4, 0, bz - fx * 6 + fz * 4], 1, { ohren: true, blick: [player.pos.x, 1.2, player.pos.z] }); } catch (e) {} }
  if (typeof k6_waldAufEinmal === 'function') k6_waldAufEinmal();
  await wait_(1000);
  // 0:59–1:04 das Hirschding flieht RÜCKWÄRTS, die Knie knicken falsch herum, es brüllt; eine Linie brechender Äste entfernt sich
  C.ph = 'flee'; C.t = 0; hungrige_ton('ruf', D.g.position.x, 2.2, D.g.position.z, 1, () => Audio.growl(D.g.position.x, D.g.position.z, true, D.g), { obj: D.g, h: 2.2 }); Audio.groan(D.g.position.x, D.g.position.z, true, D.g); Audio.treeCreak(D.g.position.x + 3, D.g.position.z - 3);
  for (let i = 1; i <= 5; i++) setTimeout(() => { const g = D.g.position; Audio.twig(g.x, g.z); if (i === 3) Audio.treeCreak(g.x, g.z); }, i * 480);
  await wait_(2800); hungrige_dtHide(); hungrige_flyTo(A, W.set(P.x, top, P.z), 1.8, 3); await wait_(1900); leben_play(A, 'Landing', .1, 1, true); await wait_(600); leben_play(A, 'IdleLookAround', .3, .6); C.look.set(P.x, top, P.z);
  // 1:04–1:14 Whiskey landet, das Licht in ihm geht aus wie eine Glühbirne, die langsam kalt wird; er sitzt schief und müde. Stille, dann ein Käuzchen.
  C.ph = 'aus'; C.t = 0; A.g.rotation.z = .12; await wait_(2600); if (Audio.owl) Audio.owl(P.x + 30, P.z - 25); await wait_(1400);
  await say([['Kalt. Kerzengerade. Wie Mamas Kerze.', 3200, 'LUKE']]); if (typeof gedanke === 'function') gedanke('hungrige_villa', 'Wie das Fenster in der Villa. Und die Stimme war die aus der Villa.', 0, 3);
  await wait_(2400);
  // Danach (Unterkapitel 8): Steuerung zurück
  await say([['Er hat ihn vertrieben. Nicht ich. Er.', 2800, 'LUKE']]);
  // 9) Kapitel 6: der echte Whiskey sitzt auf dem Pfahl und fliegt gleich voraus (Epilog, kapitel6.js); sonst fliegt der Rabe auf
  if (typeof k6_nachFinale === 'function') { const at = A.g.position.clone(); hungrige_off(A); hungrige_off(Bv); if (real) real.visible = true; k6_nachFinale(at); }
  else { leben_play(A, 'TakeOff', .1, 1.2, true); Audio.flap(P.x, top, P.z); hungrige_flyTo(A, W.set(P.x - 8, 9, P.z - 12), 2.2, 4); await wait_(2300); hungrige_off(A); hungrige_off(Bv); if (real) real.visible = true; }
  S.cine = null; S.finale = true; state.talking = false; dir.busy = false; lightBoost = 0; if (S.ravenL) S.ravenL.intensity = 0; if (skyMat && skyMat.uniforms) skyMat.uniforms.flash.value = 0;
  if (!story.lore.some(l => l.key === 'hungrige_enthuellung')) story.lore.push({ key: 'hungrige_enthuellung', title: 'Zwei Raben', html: 'Zwei Raben am Bau hinter dem Wrack. Der linke atmete nicht, trug den Ring am rechten Fuß und hatte schwarze Augen – und er sagte „Großer“ mit Lucys Stimme, ohne Spieluhr darunter. Dann riss er auf: Die Federn fielen, der Hals wurde lang, und aus dem Vogel stieg das, was Bergungstrupp 3 im Juni 1992 aus der Senke geholt hat.\n\nWhiskey hat ihn vertrieben. Mit einem Licht, das er nicht selbst hat: kalt, kerzengerade, wie Mamas Kerze. Es gehört der Frau, der er gehört. Der Wendigo ist nicht tot. Aber er weiß jetzt, wem der Rabe gehört.' });
  sideDone('hungrige', 'Der Wendigo hat sich gezeigt, und Whiskey hat ihn vertrieben.'); hungrige_desc(); // kein Popup „KAPITEL 6“ mehr: Kapitel 6 endet mit dem Epilog (kapitel6.js)
  if (typeof gedanke === 'function') gedanke('hungrige_finale', '„Er gehörte meiner Frau.“ Hat der Ritter gesagt. Und das Ding weiß das auch.', 6000, 3);
  if (typeof saveGame === 'function') saveGame(curChapter());
}
function hungrige_cineTick(dt) {
  const C = hungrige_S.cine; if (!C) return; C.t += dt; const A = C.A, B = C.B, D = C.dt;
  // Blick springt zwischen den beiden Raben (0:10–0:16)
  if (C.spring) { C.spring.t += dt; const s = C.spring, w = Math.floor(s.t / 1.5) % 2 ? s.b : s.a; C.look.set(w.x, w.y + .25, w.z); }
  // Blick des Spielers sanft auf das Geschehen
  if (C.look && !hungrige_S.camAus) { const dx = C.look.x - camera.position.x, dz = C.look.z - camera.position.z, dy = C.look.y - camera.position.y, yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(dy, Math.hypot(dx, dz));
    let d = yaw - player.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); const k = Math.min(1, dt * C.lookK); player.yaw += d * k; player.pitch += (pitch - player.pitch) * k; }
  for (const V of [A, B]) { if (!V.g.visible) continue; if (V.fl) hungrige_flyTick(V, dt); leben_beastUpd(V, dt, 200); }
  if (C.handA && !A.fl) { hungrige_handPos(A.g.position); A.g.rotation.y = player.yaw + PI; } if (C.handB && !B.fl) { hungrige_handPos(B.g.position); B.g.rotation.y = player.yaw + PI; } // auf Lukes Handgelenk
  // Whiskey atmet (Brust hebt sich), der andere nicht; Whiskeys Augen glimmen weiß, sobald das Licht kommt
  if (A.look && A.look.spine) A.look.spine.scale.set(A.look.s0.x * (1 + .035 * Math.sin(C.t * 2.6)), A.look.s0.y, A.look.s0.z * (1 + .035 * Math.sin(C.t * 2.6)));
  if (A.look && A.look.eyeM) { const want = C.ph === 'attack' ? .6 + (C.dive || 0) * .5 : C.ph === 'flash' ? 3 : C.ph === 'flee' ? 1.2 : .12; A.look.eyeM.emissiveIntensity += (want - A.look.eyeM.emissiveIntensity) * Math.min(1, dt * (C.ph === 'aus' ? .6 : 3)); }
  if (C.heart) { C.heartT -= dt; if (C.heartT < 0) { C.heartT = .92; Audio.play('heartbeat', { gain: .07, rate: .8, dur: .6, lp: 260 }); } }
  if (B.g.visible && !B.fl && !C.handB) B.g.rotation.y = leben_ang(B.g.rotation.y, Math.atan2(player.pos.x - B.g.position.x, player.pos.z - B.g.position.z), Math.min(1, dt * 2));
  if (C.ph === 'morph' && C.morph) { const M = C.morph, k = Math.min(1, C.t / 2.8), j = k > .3 ? Math.sin(C.t * 41) * .06 * k : 0; M.tHead.k = 1; M.tNeck.k = THREE.MathUtils.smoothstep(k, .1, .9) + j; M.tSpine.k = THREE.MathUtils.smoothstep(k, .25, 1) + j; for (const t of M.tF) t.k = THREE.MathUtils.smoothstep(k, .05, .55);
    B.g.position.y += Math.sin(C.t * 37) * .004 * k; B.g.rotation.z = Math.sin(C.t * 23) * .08 * k; glitchV = Math.max(glitchV, .25 * k); }
  if (B.g.visible) hungrige_applyTwist(B);
  if (D && D.g.visible) { const g = D.g;
    if (C.ph === 'rise') { const k = Math.min(1, C.t / 1.4), e = k < .7 ? k / .7 * .55 : .55 + (k - .7) / .3 * .45, fr = Math.floor(C.t * 9) / 9, jit = Math.sin(fr * 53) * .04 * (1 - k) + Math.sin(fr * 17) * .02; // Film mit fehlenden Bildern: 9 Bilder je Sekunde
      g.scale.setScalar(Math.max(.06, e + jit)); g.rotation.z = Math.sin(fr * 19) * .07 * (1 - k); g.rotation.x = Math.sin(fr * 13) * .05 * (1 - k); }
    else { const P = player.pos, dx = P.x - g.position.x, dz = P.z - g.position.z, L = Math.hypot(dx, dz) || 1;
      if (C.ph === 'flee') { const fr = Math.floor(C.t * 11) / 11, kn = Math.sin(fr * 26); g.position.x -= dx / L * dt * 7; g.position.z -= dz / L * dt * 7; if (D.kr) { g.rotation.x = 0; g.scale.setScalar(1); } else { g.rotation.x = -.32 - .1 * Math.abs(kn); g.scale.set(1, .86 + .12 * Math.abs(kn), 1); } /* Q-1: mit Skelett knicken die Gelenke selbst (Clip „flucht“) */ g.rotation.y = leben_ang(g.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 4)); } // rückwärts, das Gesicht zu Luke, einknickend
      else { g.scale.setScalar(1); g.rotation.z = D.kr ? 0 : Math.sin(C.t * 1.7) * .02 + (Math.sin(C.t * 5.3) > .97 ? .05 : 0); g.rotation.x = D.kr ? 0 : C.recoilT > 0 ? -.18 * C.recoilT : 0; // kein Atmen: nur ein Zucken ab und zu
        g.rotation.y = leben_ang(g.rotation.y, Math.atan2(dx, dz) + Math.sin(C.t * 9) * .1, Math.min(1, dt * 3));
        if (C.ph === 'come' && L > 3.2) { g.position.x += dx / L * dt * .75; g.position.z += dz / L * dt * .75; }
        if (C.recoil) { C.recoil = 0; C.recoilT = 1; g.position.x -= dx / L * 1.1; g.position.z -= dz / L * 1.1; } if (C.recoilT > 0) C.recoilT = Math.max(0, C.recoilT - dt * 1.4); } }
    if (C.look) { C.look.set(g.position.x, g.position.y + 1.7 * g.scale.x, g.position.z); if (C.ph === 'attack' || C.ph === 'flash') C.look.lerp(A.g.position, .35); } } /* Schlusstest: in der Phase „vor“ (Lampe stirbt) ist look noch null – sonst schaltet sich der ganze Takt ab */
  // Whiskeys Licht: wächst mit jedem Stoß, blendet beim dritten, erlischt langsam
  if (C.light) { C.light.position.set(A.g.position.x, A.g.position.y + .25, A.g.position.z); const want = C.ph === 'attack' ? 1.5 + (C.dive || 0) * 2.2 : C.ph === 'flash' ? 9 : C.ph === 'flee' ? 4 : 0; C.light.intensity += (want - C.light.intensity) * Math.min(1, dt * (C.ph === 'aus' ? .45 : 3)); }
  if (C.ph === 'flash') { lightBoost = Math.max(0, 1.2 - C.t * .35); if (skyMat && skyMat.uniforms) skyMat.uniforms.flash.value = Math.max(0, .8 - C.t * .4); } else if (C.ph === 'flee') lightBoost = Math.max(0, lightBoost - dt * .4);
}
// ---------------------------------------------------------------- Takt
WORLD_TICK.push((dt, t) => {
  const S = hungrige_S; if (!S.ready || !state.started || menu.attract || !wald_frei()) return; // Kapitel 1–5: nichts (PK-A A6)
  { const N = S.nebel; if (N && N.visible) { N.userData.t -= dt * .7; N.material.opacity = Math.max(0, N.userData.t) * .55; N.scale.setScalar(N.userData.s * (1.6 - .6 * Math.max(0, N.userData.t))); if (N.userData.t <= 0) N.visible = false; } } // Nebelstoß verweht
  if (S.cine) { hungrige_cineTick(dt); return; }
  // Finale (wieder) anstoßen: Bau gelesen, Finale fehlt – auch nach Tod, Laden oder verlorenem Rückruf; nur in der Nähe des Baus
  if (hungrige_has('bau') && !S.finale && !S.finBusy) { S.finT = (S.finT ?? 2) - dt; const B = HUNGRIGE.bau;
    if (S.finT <= 0) { S.finT = 3; if (Math.hypot(player.pos.x - B.x, player.pos.z - B.z) < 28 && !S.ev) hungrige_finale(); } }
  if (S.ev) { let on = true; try { on = S.ev.tick(dt); } catch (e) { console.warn('Hungrige', S.ev.id, e); on = false; } if (!on) { try { S.ev.end(); } catch (e) { console.warn('Hungrige Ende', e); } S.ev = null; S.cool = hungrige_dust(player.pos.x, player.pos.z) ? rand(16, 28) : rand(35, 55); } return; } // Kapitel 6: dichter, der Weg ist kurz
  if (!S.corpse && typeof leben_S !== 'undefined' && leben_S.ready && leben_S.M && leben_S.M.deer) { S.corpse = true; try { const V = leben_beast('deer', 1); const Q = HUNGRIGE.spuren; V.g.position.set(Q.x + .4, Math.max(0, solidGround(Q.x + .4, .6, Q.z + .3)), Q.z + .3); V.g.rotation.y = 2.3; V.g.visible = true;
      leben_play(V, 'Death', 0, 1, true); V.mx.update(6); V.m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); S.corpseV = V; } catch (e) { console.warn('Hungrige: Kadaver', e); } }
  const P = player.pos; if (!hungrige_inWald(P.x, P.z) || S.finale) return;
  // Garantierte Begegnungen an festen Orten
  for (const [id, N] of Object.entries(HUNGRIGE_NACKT)) { if (hungrige_has('nackt_' + id) || (typeof k6_nacktFrei === 'function' && !k6_nacktFrei(id))) continue; if (Math.hypot(P.x - N.at.x, P.z - N.at.z) > N.r || !hungrige_ok() || !leben_S.ready) continue;
    if ((S.nacktT || 0) > t) continue; const ev = Object.assign({ id: 'nackt_' + id }, N); if (ev.start()) { S.ev = ev; return; } S.nacktT = t + 4; }
  // Gestaffelte Begegnungen
  S.cool -= dt; if (S.cool > 0 || !hungrige_ok() || !leben_S.ready) return;
  if (!S.dt && !S.dtP && hungrige_tief(P.x, P.z)) hungrige_loadDT();
  // nächste Begegnung: die erste nicht erlebte in HUNGRIGE_FOLGE, die an diesem Ort noch dran ist (skip: Ort/Zeitpunkt verpasst – übersprungen, nicht erledigt)
  let id = null; for (const k of HUNGRIGE_FOLGE) { if (S.done.has(k)) continue; const e = HUNGRIGE_EV[k]; if (e.skip && e.skip()) continue; id = k; break; }
  const E = id && HUNGRIGE_EV[id]; if (!E || !E.need()) { S.cool = 3; return; }
  const ev = Object.assign({ id }, E); if (ev.start()) S.ev = ev; else S.cool = 6;
});
// Kapitel 6 beginnt (kapitel6.js): Wesen, Raben und Material jetzt anlegen und vorwärmen – nie mitten in einer Szene laden oder klonen
async function hungrige_prep() {
  const S = hungrige_S; S.cool = Math.min(S.cool, 12); hungrige_flesh();
  try { if (!S.ravA && typeof leben_S !== 'undefined' && leben_S.ready && leben_S.M && leben_S.M.crow) { S.ravA = hungrige_raven(false); S.ravB = hungrige_raven(true); } } catch (e) { console.warn('Hungrige: Raben', e); }
  const D = await hungrige_loadDT();
  try { const L = [D && D.g, S.ravA && S.ravA.g, S.ravB && S.ravB.g].filter(Boolean); L.forEach(g => { g.visible = true; g.position.set(HUNGRIGE.bau.x, -40, HUNGRIGE.bau.z); });
    if (renderer.compileAsync) await renderer.compileAsync(scene, camera); L.forEach(g => g.visible = false); } catch (e) { console.warn('Hungrige: Vorwärmen', e); }
}
window.__hungrige = { S: hungrige_S, EV: HUNGRIGE_EV, N: HUNGRIGE_NACKT, start: id => { const S = hungrige_S; if (S.ev) return false; const E = HUNGRIGE_EV[id] || HUNGRIGE_NACKT[id]; const ev = Object.assign({ id }, E); if (ev.start()) { S.ev = ev; return true; } return false; },
  finale: () => hungrige_finale(), seite: i => hungrige_seite(i), dt: () => hungrige_loadDT(), prep: () => hungrige_prep() }; // Testzugriff
