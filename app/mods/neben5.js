// =====================================================================  NEBEN5 (Modul „neben5“, Fassung 3 · AP-22): Kapitel 5 · Nebenaufgaben
// Kanon: story_final.md Kapitel 5 „Nebenaufgaben“ (Wortlaute), „Wer was wann weiß“ (Kern-Regeln 7–9), Beobachter-Dossier 82 (B-K5-N1), 02 C2/D6/F3/F9/F12.
// Sechs Aufgaben (Fibel-Namen) – jede sagt in der Fibel, WARUM Luke das tut:
//   Ich bin trotzdem dran (k5_jonas: Jonas’ Briefe → Hildes Antworten im Nachttisch Nr. 7 → Kasten, Fahne hoch, Whiskey und die Briefmarke)
//   Zuletzt neun (k5_laube: Hildes Laube Parzelle 7 → zwei Filme, Schuhkarton „Nächte“ → Kreuzungsfoto mit dem Neunten, Z.beob = true, einziger Film-Beweis)
//   Kinder tanken nicht (ow_kanister, Titel aus ausbau_ost_west: Zapfinsel fotografieren → k5.f.kanisterFoto, letzte Seite im Kassenbuch)
//   Ein Dorf näher (k5_heidi: Postkarte auf Vegas’ Fensterbrett → Telefonzelle → Rückruf → Karte zu Lucy)
//   Ist sie’s? (k5_dina: Frau Aydın am Fenster des Bauernhauses → Dina in der Remise ohne Binde → Foto ans Fenster, Börek)
//   Der gelbe Kasten (k5_kasten, registriert von neben4: Maas an der Kreuzung, Brief −15 / 0 / +5, Durchschlag; Weg c: Brecheisen, Einbruch −15, B-K5-N1)
// Dazu: Gasleck-Einlösung vor Nr. 7 (neue Kerze, acht Grablichter und ein neuntes), Gisela am Napfbrett, „HEINI“ schließt k4_kreisel, Postfahne unten zum Abspann,
//   Lucys Jonas-Zeile in UK 9 (Haken neben5_uk9 in kapitel5.js k5_telefon), Börek in UK 12.
// Haken in anderen Modulen: nur Umhüllungen (Briefkasten Nr. 7, Telefonzelle, albers_talk, Laube Parzelle 7, Nachtschalter, Zapfinseln, roter Kanister, Schrottauto,
//   Schuppentür) und kamera_zielDazu. Einziger Eingriff: ein Aufruf in kapitel5.js (k5_telefon, UK 9).
// Regeln: Lichter nur beim Laden (Kerzen mit Intensität 0), Figuren werden erst in der Nähe einmal angelegt (Lazy), keine Allokationen im Takt.
const neben5_S = { ready: false, st: {}, o: {}, chk: 0, busy: false, nachLaden: false, hK5: false, hWelt: 0, v: new THREE.Vector3() };
const NEBEN5 = {
  k5_jonas: ['Ich bin trotzdem dran', 'Drei Briefe aus Hamburg in Hildes Briefkasten, von Jonas, ihrem Großen. „Ich ruf dich jeden Sonntag an. Du gehst nicht ran.“ Hilde hat alles aufgehoben, was man ihr geschickt hat. Wenn sie ihm je geantwortet hat, liegt das in ihrem Schlafzimmer.'],
  k5_laube: ['Zuletzt neun', 'Hilde hat jede Nacht die Kreuzung gezählt: „Es sind immer acht. Zuletzt neun.“ In den Schrebergärten hat sie eine Laube, Parzelle 7. Wenn sie irgendwo Filme für die Kamera gebunkert hat – und ihre Nächte –, dann da.'],
  ow_kanister: ['Kinder tanken nicht', 'Das Polaroid aus Vater Kranz’ Geldkassette: ein Junge an der Zapfsäule, 31.10.09, 03:13, blaue Augen, ein roter Kanister. Die Stimme am Telefon war ich als Kind. Hildes Kamera zeigt, was damals da stand: die Zapfinsel der Tankstelle Kranz, bei Nacht.'],
  k5_heidi: ['Ein Dorf näher', 'Eine Postkarte für Lucy auf Vegas’ Fensterbrett. Heidi, ein Gasthof im Nachbardorf, mit Nummer. „Ruf an. Und sag Luke, er soll nicht alleine gehen.“ Die Telefonzelle an der Kreuzung geht noch.'],
  k5_dina: ['Ist sie’s?', 'Frau Aydın am Fenster des Bauernhauses. Dina sitzt seit der offenen Nacht in der Remise und will nicht ins Haus. Ihre Mutter traut sich nicht, sie anzusehen: „Du hast die Kamera von der Hilde. Mach ein Bild. Ist sie’s?“'],
  k5_kasten: ['Der gelbe Kasten', 'Günther Maas steht an der Kreuzung unter der Laterne, das Postrad neben sich, die Tasche leer. Er hat heute alles ausgetragen, was er vierzig Jahre behalten hat. Bis auf einen Brief.'] };
const N5_ITEMS = {
  hildes_antworten: ['Hildes Antworten', 'Drei Umschläge an Jonas Wendt, Hamburg. Adressiert, frankiert, nie abgeschickt.'],
  heidi_karte: ['Heidis Postkarte', 'An Lucy. „Ich bin jetzt ein Dorf näher.“ Ein Gasthof im Nachbardorf, eine Telefonnummer.'],
  brecheisen: ['Ein Brecheisen', 'Aus dem Kofferraum des Schrottautos an der Tankstelle. Rostig, aber gerade.'],
  boerek: ['Börek', 'Eine Tupperdose von Frau Aydın, „für den Weg“. Noch warm.'],
  brief_edda: ['Edda Brands Brief', 'Ein vergilbter Umschlag an eine Hamburger Zeitung, Dezember 2012. „Unzustellbar – zurück.“ Günther hat ihn vierzehn Jahre getragen.'],
  rechnung_durchschlag: ['Durchschlag der Steinmetzrechnung', 'Kühnle, Rechnung Nr. 26-114. „Grabstelle Brandt, L.“ Auf Maas’ Durchschlag ein zweiter Kuli: „Bar bezahlt. Handschuhe anbehalten.“'] };
const n5_st = k => neben5_S.st[k] || (neben5_S.st[k] = {});
const n5_hand = s => '<span class="hand">' + s + '</span>';
const n5_masch = s => '<span style="font-family:\'Courier New\',monospace;font-size:.92em;letter-spacing:.02em">' + s + '</span>';
const n5_item = k => story.items.includes(k);
const n5_d = (x, z) => Math.hypot(player.pos.x - x, player.pos.z - z);
const N5_ZU = ['aus', 'intro', 'veranda', 'fenster', 'tisch', 'schleife', 'foto2', 'spieluhr', 'heimweg', 'lucy', 'anruf', 'anrufLaeuft', 'augenauf', 'grab', 'zaun', 'ende'];
function n5_k5() { return typeof k5 !== 'undefined' && k5.on && (typeof kap !== 'function' || kap() === 5); }
function n5_offenBeat() { return n5_k5() && !N5_ZU.includes(k5.beat) && !(k5.beat === 'stall' && k5.f.brotStall); } // freies Umhergehen, keine Skriptszene
function n5_nach9() { return n5_k5() && typeof k5_ab === 'function' && k5_ab('brot'); } // nach dem Anruf (UK 9)
function n5_frei() { return state.started && !state.talking && !ui.overlay && !state.ending && !neben5_S.busy && !(typeof kino_busy === 'function' && kino_busy())
  && !(typeof kamera_S !== 'undefined' && (kamera_S.busy || kamera_S.hoch)) && !(typeof LWO !== 'undefined' && LWO.playing); }
function n5_start(k, desc, karte) { const q = story.side[k]; if (!q || q.state === 'zu' || q.state === 'done') return; if (karte && !q.karte) q.karte = karte; if (desc) q.desc = desc; if (q.state === 'hidden') sideStart(k); try { updateSideInfo(); } catch (e) {} }
function n5_desc(k, desc) { const q = story.side[k]; if (q && q.state !== 'done' && q.state !== 'zu') { q.desc = desc; try { updateSideInfo(); } catch (e) {} } }
function n5_fertig(k, desc) { const q = story.side[k]; if (!q || q.state === 'done') return; if (q.state === 'zu' || q.state === 'hidden') q.state = 'active'; sideDone(k, desc); }
function n5_offen(k) { const q = story.side[k]; return !!q && q.state === 'active'; }
function n5_lore(key, title, html) { const l = story.lore.find(x => x.key === key); if (l) l.html = html; else story.lore.push({ key, title, html }); }
function n5_save() { if (typeof saveGame === 'function' && state.started && !state.ending) try { saveGame(5); } catch (e) {} }
function n5_gedanke(id, t, d = 600) { if (typeof gedanke === 'function') gedanke(id, t, d, 3); else setTimeout(() => subtitle(t, 4200, 'LUKE'), d); }
async function n5_says(lines) { const war = state.talking; state.talking = true; try { await say(lines); } finally { state.talking = war; } }
async function n5_wahl(opts) { if (typeof k5_wahl === 'function' && typeof K5 !== 'undefined' && K5.v) return k5_wahl(opts, { zeit: 45000 }); if (typeof kirchberg_wahl === 'function') return kirchberg_wahl(opts); return 0; }
function n5_note(title, html, key) { return new Promise(r => openNote(title, html, key || null, r)); }
function n5_gib(k) { const I = N5_ITEMS[k]; if (I) modItem(k, I[0], I[1], 'paper'); addItem(k); }
function n5_weg(k) { story.items = story.items.filter(x => x !== k); }
function n5_boden(x, z) { try { const g = solidGround(x, 1.2, z); return g > -1 && g < 1.2 ? Math.max(0, g) : 0; } catch (e) { return 0; } }
function n5_blick(x, y, z) { return typeof k5_blick === 'function' ? k5_blick(x, y, z) : 0; }
function n5_an(k, on) { const O = neben5_S.o; if (O[k + 'On'] === on) return; O[k + 'On'] = on; kirchberg_an(O[k], on); } // Klickfläche nur bei Wechsel
function n5_idle0(F) { if (F && F.idle0 && F.acts.idle !== F.idle0) { F.acts.idle.setEffectiveWeight(0); F.acts.idle = F.idle0; F.idle0.setEffectiveWeight(1); } } // Standbewegung zurück (nach kirchberg_clip)
function n5_lwo() { return typeof lwo_stufe === 'function' ? lwo_stufe() : 'mittel'; }

// ---------------------------------------------------------------------  Register (vor dem Laden des Spielstands) · Kapitelende
function neben5_register() { for (const [k, [title, desc]] of Object.entries(NEBEN5)) { const q = story.side[k]; if (q) { q.title = title; q.kap = 5; if (q.state === 'hidden') q.desc = desc; } else story.side[k] = { title, desc, state: 'hidden', kap: 5 }; } }
function neben5_kapEnde() { const K = n5_st('kasten');
  n5_fahne(false); // Abspann: jemand hat die Post geholt
  if (n5_offen('ow_kanister') && typeof k5 !== 'undefined' && k5.f.kanisterFoto) n5_fertig('ow_kanister', 'Hildes Kamera hat an der Zapfinsel einen Jungen gezeigt, barfuß, mit einem roten Kanister. Vater Kranz hat ihm den Kanister geschenkt.');
  if (K.brief) n5_kastenFertig(true);
  for (const k of ['k5_jonas', 'k5_laube', 'ow_kanister', 'k5_heidi', 'k5_dina', 'k5_kasten']) { const q = story.side[k]; if (!q || q.state !== 'active') continue; q.state = 'zu'; q.desc = q.desc.replace(/\s*\(Die Nacht ist vorbei\.\)$/, '') + ' (Die Nacht ist vorbei.)'; }
  const p = story.side.k4_post; if (p && p.state === 'active' && typeof neben4_hat === 'function' && neben4_hat('post_c') && !K.schuppen) { p.state = 'zu'; p.desc = 'Günthers Schuppen ist zu geblieben. Was drin lag, hat er am Nachmittag ausgetragen. (Die Nacht ist vorbei.)'; }
  try { updateSideInfo(); } catch (e) {} }

// =====================================================================  1 · „Ich bin trotzdem dran“ (Jonas’ Briefe)
const N5_Y = .43, N5_NACHT = [23.35, -21.6], N5_KAPSEL = [26.9, -4.75];
const N5_ANTWORT = [
  ['Hildes Antwort · auf den Brief von 2014', 'Jonas. Du schreibst, es ist okay. Es ist nicht okay. Ich hab die Kugel gezogen und nicht neu gezogen. Wenn ich rangeh, hörst du das. — Mama'],
  ['Hildes Antwort · auf den Brief von 2020', 'Ja. Jeden Abend. Er isst es auch. Mehr schreib ich nicht, die lesen mit. — Mama'],
  ['Hildes Antwort · unfertig', 'Komm nicht am Samstag. Komm gar nicht. Ich hab dich lieb, das ist der Gr'] ];
// Nachttisch im Schlafzimmer von Nr. 7 (rechts neben dem Bett): das Küchenbuffet ohne Aufsatz, niedrig (wie innen_ort „lowerCab“)
async function n5_jonasBau() { const O = neben5_S.o, T = THREE;
  try { const W = k => ({ b: `T_${k}_BaseColor.jpg`, n: `T_${k}_Normal.jpg`, r: `T_${k}_Roughness.jpg`, color: 0x9c8c78 });
    const o = await msFBX('dresser', 'model.fbx', { 'Wood-1': W('Wood-1'), 'Wood-2': W('Wood-2'), 'Wood-3': W('Wood-3'), Metal: { ...W('Metal'), color: 0xffffff, m: 'T_Metal_Metallic.jpg' } });
    o.traverse(m => { if (!m.isMesh) return; m.geometry = m.geometry.clone(); const P = m.geometry.attributes.position;
      for (let i = 0; i < P.count; i++) if (P.getY(i) > 409.5) { P.setY(i, 405); P.setX(i, Math.min(267, Math.max(-288, P.getX(i)))); P.setZ(i, Math.min(123, Math.max(-114, P.getZ(i)))); }
      P.needsUpdate = true; m.geometry.computeBoundingBox(); m.geometry.computeBoundingSphere(); m.castShadow = true; m.receiveShadow = true; });
    msFit(o, .6, 'y'); const g = msGround(o); kirchberg_setze(g, N5_NACHT[0], N5_Y, N5_NACHT[1], 0); O.nacht = g;
    const b = new T.Box3().setFromObject(g); if (typeof addCol === 'function') addCol(b.min.x, b.max.x, b.min.z, b.max.z, b.max.y, -1); } catch (e) { console.warn('neben5: Nachttisch', e); }
  O.nachtHit = kirchberg_hit(.8, .5, .5, N5_NACHT[0], N5_Y + .4, N5_NACHT[1] + .12, 'Nachttisch', () => n5_nachttisch()); kirchberg_an(O.nachtHit, false);
  // Kronkorken im Rinnstein (Abziehbild mit Glanz)
  const t = kirchberg_tex(kirchberg_cnv(64, 64, (x, w) => { x.clearRect(0, 0, w, w); for (let i = 0; i < 21; i++) { const a = i / 21 * PI * 2; x.fillStyle = '#b89a3a'; x.beginPath(); x.arc(32 + Math.cos(a) * 26, 32 + Math.sin(a) * 26, 5, 0, 7); x.fill(); }
    const g = x.createRadialGradient(26, 26, 2, 32, 32, 26); g.addColorStop(0, '#fff6c8'); g.addColorStop(.5, '#d8b848'); g.addColorStop(1, '#8a6a20'); x.fillStyle = g; x.beginPath(); x.arc(32, 32, 26, 0, 7); x.fill(); }));
  O.kapsel = kirchberg_decal(t, .04, .04, N5_KAPSEL[0], .012, N5_KAPSEL[1], 0, { rx: -PI / 2, alpha: true, emi: .35 }); O.kapsel.visible = false;
  O.kapselHit = kirchberg_hit(.5, .3, .5, N5_KAPSEL[0], .15, N5_KAPSEL[1], 'Etwas Glänzendes im Rinnstein', () => n5_kapsel()); kirchberg_an(O.kapselHit, false); }
function n5_jonasTick() { const J = n5_st('jonas'), O = neben5_S.o;
  const nacht = n5_k5() && n5_offen('k5_jonas') && !J.antworten && n5_offenBeat(); if (O.nachtHit && O.nachtOn !== nacht) { O.nachtOn = nacht; kirchberg_an(O.nachtHit, nacht); }
  const kap = n5_k5() && J.marke === 'weg'; if (O.kapsel && O.kapsel.visible !== kap) { O.kapsel.visible = kap; kirchberg_an(O.kapselHit, kap); } }
async function n5_nachttisch() { const J = n5_st('jonas'), S = neben5_S; if (state.talking || S.busy || J.antworten) return; S.busy = true; state.talking = true;
  try { try { Audio.play(Audio.pick('woodSqueak1', 'woodSqueak2'), { gain: .35, rate: 1.2, x: N5_NACHT[0], y: .8, z: N5_NACHT[1], ref: 2 }); } catch (e) {} await wait(900);
    // Schreck (1): im Wohnzimmer klingelt zweimal das Telefon – in einem Haus, in dem keiner mehr rangeht
    try { Audio.ring(.1, 20.5, 1.3, -15.35); } catch (e) {} await wait(2900); try { Audio.ring(.1, 20.5, 1.3, -15.35); } catch (e) {} await wait(3200);
    await say([['Zweimal. Dann nichts mehr.', 2600]]); } finally { state.talking = false; }
  try { for (let i = 0; i < 3; i++) await n5_note(N5_ANTWORT[i][0], (i === 0 ? 'Ganz hinten in der Schublade, unter einer Brille mit gesprungenem Glas: drei Umschläge. Adressiert an Jonas Wendt, Hamburg. Frankiert. Nie abgeschickt.\n\n' : '')
      + n5_hand('„' + N5_ANTWORT[i][1] + '“'), 'k5_antwort' + (i + 1)); } finally { S.busy = false; }
  J.antworten = 1; n5_gib('hildes_antworten');
  await n5_says([['„Sie hat jeden beantwortet. Und keinen abgeschickt.“', 3600, 'LUKE']]);
  n5_desc('k5_jonas', 'Hildes Antworten an Jonas: adressiert, frankiert, nie abgeschickt. Sie gehören in ihren Briefkasten, Fahne hoch. Dann holt sie einer ab.'); n5_save(); }
// Briefkasten Nr. 7 (Umhüllung): Antworten einwerfen, Fahne hoch; Whiskey klaut die oberste Briefmarke
async function n5_einwerfen() { const J = n5_st('jonas'), S = neben5_S; if (state.talking || S.busy || J.eingeworfen) return; J.eingeworfen = 1; S.busy = true; state.talking = true; n5_weg('hildes_antworten');
  try { try { if (typeof tween === 'function' && mailbox7.userData.lid) { tween(mailbox7.userData.lid, { rx: 1.45 }, .4); setTimeout(() => tween(mailbox7.userData.lid, { rx: 0 }, .4), 1500); } Audio.play('metalOpen', { gain: .3, rate: 1.4, x: 28.4, y: 1.2, z: -6.9, ref: 2 }); } catch (e) {}
    Audio.paper(); await wait(1600); n5_fahne(true); try { Audio.play('metalHit1', { gain: .12, rate: 2.4, x: 28.4, y: 1.3, z: -6.9, ref: 2 }); } catch (e) {}
    await say([['Du legst Hildes drei Antworten in ihren Briefkasten und stellst die Fahne hoch.', 3800]]);
    const W = typeof whiskey_S !== 'undefined' && whiskey_S.g && typeof whiskey_setzen === 'function';
    if (W) { const y = (typeof whiskey_perch === 'function' && whiskey_perch(28.4, -6.9)) || 1.28; try { whiskey_setzen(28.4, y > .5 ? y : 1.28, -6.9, () => { if (typeof whiskey_pick === 'function') whiskey_pick(2); }); } catch (e) {}
      await wait(4200); try { Audio.paper(); whiskey_setzen(N5_KAPSEL[0] + .4, .03, N5_KAPSEL[1] - .5); } catch (e) {}
      await say([['Whiskey landet auf dem Kasten, zupft die oberste Briefmarke vom Umschlag und hüpft damit zwei Meter weiter. Er sieht dich an. Er wartet.', 5600], ['„Ohne Marke kommt der nicht an.“', 2600, 'LUKE']]);
      J.marke = 'weg'; n5_desc('k5_jonas', 'Hildes Antworten liegen im Kasten, die Fahne ist oben. Aber Whiskey hat die oberste Briefmarke. Er tauscht nur gegen etwas, das glänzt.'); }
  } finally { state.talking = false; S.busy = false; }
  if (!J.marke) n5_jonasFertig(); n5_save(); }
async function n5_kapsel() { const J = n5_st('jonas'); if (state.talking || J.marke !== 'weg') return; J.marke = 'zurueck'; const O = neben5_S.o; O.kapsel.visible = false; kirchberg_an(O.kapselHit, false);
  try { Audio.play('metalHit1', { gain: .08, rate: 3.2 }); } catch (e) {}
  await n5_says([['Ein Kronkorken, frisch poliert vom Regen. Du hältst ihn Whiskey hin. Er legt die Briefmarke auf den Kasten und nimmt den Kronkorken, ohne dich anzusehen.', 5800], ['„Ich verhandle mit einem Vogel über Porto.“', 3000, 'LUKE']]);
  try { if (typeof whiskey_setzen === 'function') whiskey_setzen(28.4, 1.28, -6.9); } catch (e) {} n5_jonasFertig(); n5_save(); }
function n5_jonasFertig() { const J = n5_st('jonas'); if (J.fertig) return; J.fertig = 1;
  n5_lore('k5_zwei_soehne', 'Hilde hatte zwei Söhne', 'Zayn und Jonas. Den einen hat sie jede Nacht auf der Kreuzung gezählt. Dem anderen hat sie jeden Brief beantwortet und keinen abgeschickt. „Wenn ich rangeh, hörst du das.“\n\nJonas kommt am Samstag, weil Maas ein einziges Mal Lucys Brief zugestellt hat. Das Brot im Stall hat er schon als Kind gesehen.');
  n5_fertig('k5_jonas', 'Hildes Antworten liegen in ihrem Briefkasten, die Fahne ist oben. Sie hat jeden Brief beantwortet und keinen abgeschickt. Jonas kommt am Samstag.'); }
// Postfahne am Kasten Nr. 7 (Scan-Fähnchen aus strasse.js): oben 0, unten −π/2 + 0,1
function n5_fahne(oben) { const O = neben5_S.o; if (O.fahneP === undefined) { O.fahneP = null; try { mailbox7.userData.group.traverse(m => { if (m.isMesh && m.name === 'MailboxFlag' && m.parent) O.fahneP = m.parent; }); } catch (e) {} }
  if (!O.fahneP) return; O.fahneOben = !!oben; O.fahneP.rotation.x = oben ? 0 : -PI / 2 + .1; }
// UK 9 (kapitel5.js k5_telefon, nach Lucys drei Zeilen): Lucy weiß, dass Jonas kommt
async function neben5_uk9() { const J = n5_st('jonas'); if (!J.fertig || J.lucy) return; J.lucy = 1; await say([['„Der kommt wirklich? Ich hab ihm im Oktober geschrieben und gedacht, das liegt bei Maas im Schuppen.“', 5200, 'LUCY'], ['„Dann räum ich bei Vegas das Sofa frei. Er schnarcht, das weiß ich noch.“', 4200, 'LUCY']]); }

// =====================================================================  2 · „Zuletzt neun“ (Hildes Laube, Kreuzungsfoto mit dem Neunten)
const N5_LAUBE = [-122.8, 36.2], N5_ZELLE = [6.85, 6.95];
function n5_ring() { const O = neben5_S.o; if (O.ring) return O.ring; let best = null, bd = 10; try { for (const L of lamps) { const d = Math.hypot(L.wx, L.wz); if (d < bd) { bd = d; best = L; } } } catch (e) {} return (O.ring = best ? [best.wx, best.wz] : [.4, -.6]); }
function n5_laubeTick() { const L = n5_st('laube'); if (!n5_k5() || L.fertig) return;
  if (!L.start && typeof k5_ab === 'function' && k5_ab('foto1') && n5_frei() && n5_offenBeat()) { const film = typeof kamera_S !== 'undefined' ? kamera_S.film : 3, nah = n5_d(...N5_LAUBE) < 16;
    if (nah || (n5_nach9() && film <= 1)) { L.start = 1; n5_start('k5_laube', null, { x: N5_LAUBE[0], z: N5_LAUBE[1] });
      n5_gedanke('n5_laube', nah ? '„Hildes Laube. Parzelle 7. Hier hat sie gesessen, wenn sie nicht am Fenster saß.“' : '„Ein Bild noch. Hilde hatte nie irgendwas nur einmal. Ihre Laube in den Schrebergärten, Parzelle 7.“', 200); } }
  // Schreck beim Verlassen: die Petroleumlampe ist aus
  if (L.gelesen && !L.lampeAus && n5_d(...N5_LAUBE) > 7 && n5_frei()) { L.lampeAus = 1; subtitle('Hinter dir ist es dunkel geworden. In der Laube brennt keine Lampe mehr.', 4200);
    } /* R-1 (Story-Prüfung): kein Bonbonpapier mehr an der Laube – Spuren-Budget Kap. 5, Dossier 82 §4 */
  if (L.gelesen && !L.foto && !neben5_S.o.kinder) n5_kinderBau(); }
async function n5_laube() { const L = n5_st('laube'), S = neben5_S; if (state.talking || S.busy) return;
  if (L.gelesen) return toast('Die Blechdose ist leer. Der Schuhkarton „Nächte“ steht offen auf der Bank. Die Lampe ist aus.', 3400);
  S.busy = true; L.start = 1; n5_start('k5_laube', null, { x: N5_LAUBE[0], z: N5_LAUBE[1] });
  try { try { Audio.play('doorCreak', { gain: .3, rate: 1.2, x: N5_LAUBE[0], y: 1, z: N5_LAUBE[1], ref: 2 }); } catch (e) {}
    await n5_note('Hildes Laube · Parzelle 7', 'Die Petroleumlampe brennt klein. Auf dem zweiten Stuhl ein Kissen, eingedrückt. Unter der Bank eine Blechdose: zwei Filmpacks für eine Sofortbildkamera, ungeöffnet, und ein Schuhkarton mit der Aufschrift „Nächte“.\n\nIn der Dose ein Zettel:\n\n'
      + n5_hand('Für den, der die Kamera findet: Die Bilder gehören nicht dem Amt. Die gehören den Kindern.'), 'k5_laube');
    if (typeof k5 !== 'undefined') { k5.f.laube = true; k5.film = (k5.film || 0) + 2; } if (typeof kamera_film === 'function') kamera_film(2); questPop('INVENTAR', 'Zwei Filmpacks'); await wait(700);
    let bild = null; try { if (typeof n4_polaBild === 'function') bild = await n4_polaBild(1); } catch (e) {}
    await n5_note('Der Schuhkarton „Nächte“', 'Polaroids, Dutzende, nach Monaten mit Gummibändern gebündelt. Immer dieselbe Kreuzung, nachts, leer. Auf jedem Bild kleine nackte Fußabdrücke im Regenwasser, mit Kreide nummeriert: eins bis acht.\n\nDas letzte Bild liegt obenauf.'
      + (bild ? `\n\n<img src="${bild}" style="width:48%;display:block;margin:0 auto 12px;border:9px solid #ece6d6;border-bottom-width:30px;transform:rotate(-1.4deg);box-shadow:0 6px 18px rgba(0,0,0,.6)">` : '\n\n')
      + 'Neun Paare. Das neunte ist kleiner, drei Zehen, und es endet mitten auf der Straße.\n\nAuf dem weißen Rand, Hildes Kuli:\n' + n5_hand('„Neun. Der Kleine gehört nicht dazu. Er zählt selber, ich hab ihn gesehen. Er zählt mich. — H.“'), 'k5_neun');
    if (bild) { try { if (typeof album_abheften === 'function') album_abheften('k5_laube_neun', { bild, art: 'pola', serie: 'sonst', notiz: 'Hildes Polaroid · Neun', hinten: { stil: 'pola', blei: 'Neun. Der Kleine gehört nicht dazu. Er zählt selber, ich hab ihn gesehen. Er zählt mich. — H.' } }); } catch (e) { console.warn('neben5: Album', e); } }
  } finally { S.busy = false; }
  L.gelesen = 1; const G = typeof neben4_S !== 'undefined' && neben4_S.st.gas && neben4_S.st.gas.p && Object.keys(neben4_S.st.gas.p).length;
  await n5_says([...(G ? [['„Hildes Kuli. Wie an den Kerzen. Die hat jede Nacht fotografiert.“', 3800, 'LUKE']] : []), ['„Hilde hat mehr Fotos von nassen Füßen als ich von meinem ganzen Leben.“', 4000, 'LUKE']]);
  n5_lore('k5_neun_paar', 'Neun Paar Füße', 'Hildes Polaroids aus dem Schuhkarton „Nächte“: die Kreuzung, jede Nacht, leer. Kleine nackte Fußabdrücke im Regenwasser, mit Kreide nummeriert, eins bis acht. Auf dem letzten Bild neun Paare. Das neunte ist kleiner, drei Zehen, und endet mitten auf der Straße.\n\n„Neun. Der Kleine gehört nicht dazu. Er zählt selber, ich hab ihn gesehen. Er zählt mich. — H.“');
  n5_desc('k5_laube', 'Hildes Nächte: acht Paar nackte Füße auf der Kreuzung, auf dem letzten Bild neun. „Er zählt selber.“ Ich hab ihre Kamera und zwei Filme mehr. Ein Bild von der Kreuzung, bei Nacht, so wie sie es gemacht hat.'); n5_save(); n5_kinderBau(); }
// Die acht Kinder für das eine Kreuzungsbild: einmal angelegt, sichtbar nur im Blitz-Moment
async function n5_kinderBau() { const O = neben5_S.o; if (O.kinder || typeof figuren_embody !== 'function') return; O.kinder = [];
  for (let i = 0; i < 8; i++) { const g = new THREE.Group(); g.visible = false; g.userData.noCol = true; scene.add(g); O.kinder.push(g);
    try { await figuren_embody(g, i % 2 ? 'gezaehlt_m' : 'gezaehlt_j', { clip: 'idle' }); g.traverse(m => { if (m.isMesh) m.castShadow = false; }); } catch (e) { console.warn('neben5: Kind', e); } }
  O.kinderBereit = true; }
function n5_kinderZeigen(an) { const O = neben5_S.o; if (!O.kinder) return; const [cx, cz] = n5_ring();
  for (let i = 0; i < O.kinder.length; i++) { const g = O.kinder[i]; if (!an) { g.visible = false; continue; } const a = i / 8 * PI * 2 + .3, r = 1.7 + (i % 3) * .2;
    g.position.set(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r); g.rotation.y = Math.atan2(cx - g.position.x, cz - g.position.z) + (i % 2 ? .25 : -.2); g.visible = true;
    const P = g.userData.person; if (P && P.mx) P.mx.update(.3 + i * .37); g.updateMatrixWorld(true); } }
// Der Neunte: abseits neben der Telefonzelle, sieht in die Kamera (Sichtung ≤ 1 s; nach dem Bild sofort weg)
function n5_neunter() { if (typeof beob_sichtung !== 'function') return; const P = camera.position, f = neben5_S.v.set(fwd.x, 0, fwd.z).normalize();
  let x = N5_ZELLE[0], z = N5_ZELLE[1]; const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz) || 1;
  if ((dx * f.x + dz * f.z) / d < .8) { const [cx, cz] = n5_ring(); x = cx - f.z * 3.3; z = cz + f.x * 3.3; }
  try { beob_sichtung([x, null, z], .8, { blick: [P.x, P.y, P.z] }); } catch (e) { console.warn('neben5: Neunter', e); } }
function n5_neunterWeg() { try { if (typeof beob_S !== 'undefined' && beob_S.sicht && beob_S.V) { beob_S.sicht = null; beob_S.V.g.visible = false; } } catch (e) {} }
function n5_zielKreuz() { const L = n5_st('laube'), O = neben5_S.o; if (!L.gelesen || L.foto || !O.kinderBereit || !n5_offenBeat()) return null;
  const [cx, cz] = n5_ring(), d = n5_d(cx, cz); if (d < 5 || d > 30 || n5_blick(cx, 1, cz) < .9) return null;
  return { stempel: '05 · 11 · 26', beob: true, fov: 50, blitz: .75, halten: 6, text: 'Da war jemand. Jetzt nicht mehr.',
    vorFoto() { n5_kinderZeigen(true); n5_neunter(); }, nachFoto() { n5_kinderZeigen(false); n5_neunterWeg(); L.foto = 1;
      // Wer länger als eine Sekunde hinsieht, sieht ihn auf dem Foto nicht mehr (im Album bleibt der Abzug ohne ihn): etwa eine Sekunde, nachdem das Bild erkennbar ist
      setTimeout(() => { const F = kamera_S.fotos[kamera_S.fotos.length - 1], img = kamera_S.el.pola.querySelector('img'); if (F && F.ohne && img) img.src = F.ohne; }, 3300); },
    async nachEntwickeln() { await wait(900); await n5_says([['„Acht um die Laterne. Und einer bei der Zelle, der zurückguckt.“', 4000, 'LUKE'], ['„… Weg. Nicht aus der Nacht. Vom Bild.“', 3000, 'LUKE']]);
      n5_lore('k5_neun_paar', 'Neun Paar Füße', ((story.lore.find(l => l.key === 'k5_neun_paar') || {}).html || '') + '\n\nMein Bild von der Kreuzung: acht Kinder barfuß im Nebel um die Laterne. Ein neuntes, klein und weiß, abseits bei der Telefonzelle, sieht in die Kamera. Eine Sekunde lang. Da war jemand. Jetzt nicht mehr.');
      L.fertig = 1; n5_fertig('k5_laube', 'Hildes Neunter gehört nicht zu den acht. Er zählt selber – die Kinder, Hilde, mich. Auf Hildes Film war er eine Sekunde lang zu sehen. Dann nicht mehr.'); n5_save(); } }; }

// =====================================================================  3 · „Kinder tanken nicht“ (Tankstelle Kranz, Zapfinsel; Schlüssel ow_kanister)
const N5_ZAPF = [111, 15], N5_JUNGE = [108.45, 14.3], N5_KRANZ = [110.4, 25.7], N5_KTUER = [113.35, 24.2];
function n5_owQ() { return typeof ausbau_ost_west_OW !== 'undefined' && ausbau_ost_west_OW.Q || {}; }
function n5_kanisterTick() { const K = n5_st('kan'), q = story.side.ow_kanister; if (!q || !n5_k5()) return;
  if (q.state === 'hidden' && n5_nach9() && n5_offenBeat() && n5_frei()) { const Q = n5_owQ(), nah = n5_d(...N5_ZAPF) < 22;
    if (Q.kasse || nah) { K.start = 1; n5_start('ow_kanister', Q.kasse ? NEBEN5.ow_kanister[1] : 'Tankstelle Kranz. Im Kassenbuch steht um 03:13 nur ein Wort: KIND. Die Stimme am Telefon war ich als Kind. Hildes Kamera zeigt, was damals da stand: die Zapfinsel, bei Nacht.', { x: N5_ZAPF[0], z: N5_ZAPF[1] });
      n5_gedanke('n5_kanister', Q.kasse ? '„Barfuß, allein, ein roter Kanister. Das Foto in der Kassette. Ich weiß jetzt, wer das war.“' : '„Tankstelle Kranz. Um 03:13 steht im Kassenbuch nur KIND. Hildes Kamera lügt nicht.“', 500); } }
  if (q.state === 'active' && !K.tafel && n5_d(99.2, 8.2) < 9 && n5_frei()) { K.tafel = 1; n5_gedanke('n5_tafel', '„Vier Ziffern hängen noch, und die ergeben die einzige Uhrzeit, die ich nie wieder sehen will.“', 0); }
  if (q.state === 'active' && !neben5_S.o.jungeTry && n5_d(...N5_ZAPF) < 90) n5_jungeBau(); }
async function n5_jungeBau() { const O = neben5_S.o; if (O.jungeTry || typeof figuren_embody !== 'function') return; O.jungeTry = true;
  try { const mk = async (id) => { const g = new THREE.Group(); g.visible = false; g.userData.noCol = true; scene.add(g); await figuren_embody(g, id, { clip: 'idle' }); return g; };
    O.junge = await mk('luke_echt'); O.kranz = await mk('vegas'); // Vater Kranz hinter dem Kioskfenster: Stellvertreter-Figur (kein eigenes Modell)
    const k = await kirchberg_mod('jerrycan', 'model.gltf', .36); if (k) { k.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0xc02a1c); } }); k.visible = false; scene.add(k); O.kanister = k; } } catch (e) { console.warn('neben5: Benzin-Junge', e); } }
function n5_zapfZeigen(an) { const O = neben5_S.o, P = camera.position;
  if (O.junge) { O.junge.visible = an; if (an) { O.junge.position.set(N5_JUNGE[0], n5_boden(...N5_JUNGE), N5_JUNGE[1]); O.junge.rotation.y = Math.atan2(P.x - N5_JUNGE[0], P.z - N5_JUNGE[1]); const Q = O.junge.userData.person; if (Q && Q.mx) Q.mx.update(.6); O.junge.updateMatrixWorld(true); } }
  if (O.kanister) { O.kanister.visible = an; if (an && O.junge) { const r = O.junge.rotation.y; O.kanister.position.set(N5_JUNGE[0] + Math.sin(r) * .26, O.junge.position.y + .2, N5_JUNGE[1] + Math.cos(r) * .26); O.kanister.rotation.y = r + PI / 2; } }
  if (O.kranz) { O.kranz.visible = an; if (an) { O.kranz.position.set(N5_KRANZ[0], 0, N5_KRANZ[1]); O.kranz.rotation.y = PI; const Q = O.kranz.userData.person; if (Q && Q.mx) Q.mx.update(1.1); O.kranz.updateMatrixWorld(true); } }
  // Schreck: in der Kiosktür einer mit Hut, so alt wie heute (Wolters Figur nur für das Bild umgestellt)
  const W = typeof lwo_figur === 'function' ? lwo_figur('wolter') : null;
  if (W) { if (an) { O.wSave = { v: W.g.visible, x: W.g.position.x, y: W.g.position.y, z: W.g.position.z, r: W.g.rotation.y }; W.g.position.set(N5_KTUER[0], 0, N5_KTUER[1]); W.g.rotation.y = PI; W.g.visible = true; W.g.updateMatrixWorld(true); }
    else if (O.wSave) { const s = O.wSave; W.g.position.set(s.x, s.y, s.z); W.g.rotation.y = s.r; W.g.visible = s.v; O.wSave = null; } } }
function n5_zielZapf() { const O = neben5_S.o; if (!n5_offen('ow_kanister') || k5.f.kanisterFoto || !O.junge || !n5_offenBeat()) return null;
  const d = n5_d(...N5_ZAPF); if (d < 4 || d > 28 || n5_blick(109.5, 1, 15) < .86) return null;
  return { stempel: '05 · 11 · 26', fov: 46, blitz: .8, halten: 6, text: 'Ein Junge im gestreiften Schlafanzug, barfuß, den roten Kanister mit beiden Händen. Blaue Augen. Hinter dem Kioskfenster ein Mann, der ein Foto macht.',
    beimHeben() { if (typeof ausbau_ost_west_OW !== 'undefined') ausbau_ost_west_OW.signFlick = 3; },
    vorFoto() { n5_zapfZeigen(true); }, nachFoto() { n5_zapfZeigen(false); try { if (typeof ausbau_ost_west_OW !== 'undefined') ausbau_ost_west_OW.signFlick = 4; Audio.buzz(99.2, 4.5, 8.2); } catch (e) {} },
    async nachEntwickeln() { k5.f.kanisterFoto = true; n5_st('kan').foto = 1;
      await n5_says([['In der Kiosktür, am Rand des Bildes, steht noch einer. Mit Hut. So alt wie heute.', 4600], ['„Das bin ich. Mit neun. Barfuß, mit einem Kanister, um drei Uhr nachts.“', 4400, 'LUKE']]);
      n5_lore('k5_benzin', 'Der Benzin-Junge', 'Hildes Kamera hat die Zapfinsel so fotografiert, wie sie damals war: ein Junge im gestreiften Schlafanzug, blaue Augen, den roten Kanister mit beiden Händen. Hinter dem Kioskfenster der Mann, der das Foto macht. In der Kiosktür einer mit Hut, so alt wie heute.');
      n5_desc('ow_kanister', 'Das Polaroid zeigt, was hier stand. Im Nachtschalter liegt das Kassenbuch. Hinten, auf der letzten Seite, stand vorher nichts.'); n5_save();
      setTimeout(() => n5_gedanke('n5_kanister2', '„Wofür braucht ein Kind nachts Benzin?“', 0), 2200); } }; }
async function n5_kassenbuch() { const K = n5_st('kan'); if (state.talking) return; K.seite = 1;
  await n5_note('Das Kassenbuch · letzte Seite', 'Hinten im Kassenbuch, auf der letzten Seite, eine andere Schrift als die Zahlen. Blass, als hätte sie schon immer da gestanden:\n\n'
    + n5_hand('„Der Junge hat gesagt, er braucht es für eine Laterne, damit seine Mutter ihn findet. Ich hab ihm den Kanister geschenkt und das Foto behalten. Man soll nicht bezahlen müssen, wenn man neun ist und barfuß.“'), 'k5_kassenbuch');
  n5_lore('k5_benzin', 'Der Benzin-Junge', ((story.lore.find(l => l.key === 'k5_benzin') || {}).html || '') + '\n\nVater Kranz, letzte Seite: „Der Junge hat gesagt, er braucht es für eine Laterne, damit seine Mutter ihn findet.“');
  n5_fertig('ow_kanister', 'Der Junge an der Zapfsäule hat den Kanister für eine Laterne gebraucht, damit seine Mutter ihn findet. Vater Kranz hat ihn ihm geschenkt und das Foto behalten. „Man soll nicht bezahlen müssen, wenn man neun ist und barfuß.“'); n5_save(); }

// =====================================================================  4 · „Ein Dorf näher“ (Heidi)
async function n5_heidiBau() { const O = neben5_S.o, W = typeof K5 !== 'undefined' && K5.win3; if (!W) return;
  const t = kirchberg_papier({ w: 256, h: 176, bg: '#e8dfc8', flecken: 1, zeilen: [['Lucy Brandt', 118, 70, 30], ['bei L. Vegas', 118, 104, 26], ['Ahornstraße 3', 118, 136, 26]],
    fn: x => { x.fillStyle = '#7a8a6a'; x.fillRect(12, 16, 90, 140); x.fillStyle = '#b8402c'; x.fillRect(206, 12, 38, 44); x.strokeStyle = 'rgba(40,40,60,.5)'; x.beginPath(); x.arc(212, 40, 24, 0, 7); x.stroke(); } });
  O.karte = kirchberg_decal(t, .15, .1, W.x + .12, W.y - .5, W.z + .06, 0, { rx: -.35, rz: .06 }); O.karte.visible = false;
  O.karteHit = kirchberg_hit(.45, .35, .35, W.x + .12, W.y - .5, W.z + .2, 'Postkarte auf dem Fensterbrett', () => n5_karte()); kirchberg_an(O.karteHit, false); }
function n5_heidiTick(dt) { const H = n5_st('heidi'), O = neben5_S.o; if (!O.karte) return;
  const da = n5_nach9() && !H.karte; if (O.karte.visible !== da) O.karte.visible = da; const hit = da && n5_offenBeat(); if (O.karteOn !== hit) { O.karteOn = hit; kirchberg_an(O.karteHit, hit); }
  if (hit && !H.ruf && n5_d(-26.5, -11) < 9 && n5_frei()) { H.ruf = 1; n5_vegasRuf(); }
  } // Story-Prüfung R-1: kein Nachklingeln der Zelle nach Heidis Anruf mehr (Telefonzelle nur noch viermal: Kap. 1 Nebenaufgabe, Kap. 3, Kap. 5, Heidi)
async function n5_vegasRuf() { neben5_S.busy = true; try { if (typeof albers_S !== 'undefined') albers_S.open = 1; Audio.chains && Audio.chains(-28, 1.2, -12.2);
    await n5_says([['„Junge! Auf dem Fensterbrett liegt Post für Lucy. Der Maas hat sie durchgeschoben. Ohne zu klingeln. Feigling.“', 5200, 'VEGAS']]); } finally { if (typeof albers_S !== 'undefined') albers_S.open = 0; neben5_S.busy = false; } }
async function n5_karte() { const H = n5_st('heidi'); if (state.talking || H.karte) return; H.karte = 1; Audio.paper();
  await n5_note('Eine Postkarte für Lucy', 'Vorn ein Gasthof im Nachbardorf, Fachwerk, eine Kastanie, ein Stempel mit Datum von gestern. Hinten, in einer Schrift, die erwachsen geworden ist und trotzdem noch rund:\n\n'
    + n5_hand('„Lucy. Ich bin jetzt ein Dorf näher. Jedes Jahr eins, mehr trau ich mich nicht. Das Amt hat uns damals umgesetzt wie Schachfiguren. Ruf an. Und sag Luke, er soll nicht alleine gehen. — Heidi“') + '\n\nDarunter eine Telefonnummer, mit Kuli nachgezogen.', 'k5_heidi_karte');
  n5_gib('heidi_karte'); n5_start('k5_heidi', null, { x: 8, z: 7.6 }); n5_save(); }
async function n5_heidiAnruf() { const H = n5_st('heidi'), S = neben5_S; if (state.talking || S.busy) return; S.busy = true; state.talking = true; const HE = 'HEIDI', LU = 'LUKE';
  try { if (typeof handset === 'function') handset(true); await wait(900);
    subtitle('Du wählst die Nummer von der Karte. Es klingelt lange.', 3200); try { Audio.ring(.05); } catch (e) {} await wait(3600);
    await say([['„Ja?“', 1600, HE], ['„Heidi? Hier ist Luke. Luke Brandt.“', 2800, LU]]); try { Audio.play('switch1', { gain: .08, rate: 2.6 }); } catch (e) {} // ein Feuerzeug, Rauchen im Hintergrund
    await say([['„… Luke.“', 2200, HE], ['„Deine Karte ist heute angekommen. Lucy hat sie noch nicht.“', 3400, LU]]);
    const O = [['„Warum seid ihr weg?“', [['„Wir sind nicht weggezogen. Morgens stand ein Umzugswagen da, und ein Mann mit Hut hat meiner Mutter erklärt, dass wir freiwillig gehen.“', 6800, HE]]],
      ['„Die Nacht damals?“', [['„Ein Junge hat ‚Klar!‘ gesagt, als das blasse Mädchen mitspielen wollte. Das warst nicht du.“', 5400, HE], ['„Du warst noch gar nicht da.“', 2800, HE]]]];
    while (O.length) { const i = await n5_wahl([...O.map(o => o[0]), '„Das reicht.“']); if (i < 0 || i >= O.length) break; const [q, zl] = O.splice(i, 1)[0]; subtitle(q, 1800, LU); await wait(1600); await say(zl); }
    await say([['„Trägt Vegas noch Alufolie?“', 2600, HE], ['„Innen im Hut.“', 2000, LU], ['„Sag ihm, er hatte recht. Bei allem.“', 3000, HE], ['„Ich komm nicht rüber, Luke. Noch nicht. Die Karte am Grab hab ich hingelegt, damit wenigstens die stimmt.“', 5600, HE]]);
    try { Audio.play('switch1', { gain: .3, rate: .8 }); } catch (e) {}
  } finally { if (typeof handset === 'function') handset(false); state.talking = false; S.busy = false; }
  H.anruf = 1; n5_lore('k5_heidi_tel', 'Heidi am Telefon', 'Heidis Familie ist nicht weggezogen: Morgens stand ein Umzugswagen da, und ein Mann mit Hut hat ihrer Mutter erklärt, dass sie freiwillig gehen. Das Amt hat sie umgesetzt „wie Schachfiguren“.\n\nIn der Nacht damals hat ein Junge „Klar!“ gesagt, als das blasse Mädchen mitspielen wollte. „Das warst nicht du. Du warst noch gar nicht da.“');
  n5_desc('k5_heidi', 'Heidi kommt nicht rüber. Noch nicht. Ihre Karte gehört Lucy – Lucy ist bei Vegas.'); n5_save(); }
// Vegas’ Tür (albers_talk umhüllt): Heidis Karte zu Lucy · Lucy und Jonas, wenn die Antworten erst nach UK 9 im Kasten lagen
function n5_vegasOffen() { const H = n5_st('heidi'), J = n5_st('jonas'); return n5_nach9() && ((H.anruf && !H.lucy && n5_item('heidi_karte')) || (J.fertig && !J.lucy)); }
async function n5_vegasTuer() { const H = n5_st('heidi'), J = n5_st('jonas'); if (state.talking) return; state.talking = true; if (typeof albers_S !== 'undefined') albers_S.open = 1;
  try { try { Audio.chains(-28, 1.2, -12.2); } catch (e) {} await say([['„Sie ist noch wach. Gerade so.“', 2600, 'VEGAS']]);
    if (H.anruf && !H.lucy && n5_item('heidi_karte')) { H.lucy = 1; n5_weg('heidi_karte');
      await say([['Du schiebst Heidis Karte durch den Kettenspalt. Drinnen raschelt es. Dann Lucys Stimme, dicht an der Tür.', 4800], ['„Sie hat mir jedes Jahr geschrieben. Ich hab nie eine gekriegt.“', 4200, 'LUCY']]);
      n5_fertig('k5_heidi', 'Heidi hat Lucy jedes Jahr geschrieben, jedes Jahr ein Dorf näher. Das Amt hat ihre Familie umgesetzt wie Schachfiguren. In der Nacht damals hat ein Junge „Klar!“ gesagt. Das war nicht ich.'); }
    if (J.fertig && !J.lucy) { J.lucy = 1; await say([['„Großer? Jonas … Der kommt wirklich? Ich hab ihm im Oktober geschrieben und gedacht, das liegt bei Maas im Schuppen.“', 5600, 'LUCY'], ['„Dann räum ich bei Vegas das Sofa frei. Er schnarcht, das weiß ich noch.“', 4200, 'LUCY']]); }
  } finally { if (typeof albers_S !== 'undefined') albers_S.open = 0; state.talking = false; } n5_save(); }

// T-2 (Story-Prüfung) · „Einunddreißig Flaschen“: nach UK 9 an der Tür von Nr. 3, Kette vor. Vegas sagt Luke, dass er für Mike unterschrieben hat. Traurige Szene: kein Witz danach.
function n5_flaschenOffen() { return n5_nach9() && !n5_st('flaschen').done; }
async function n5_flaschen() { const F = n5_st('flaschen'); if (state.talking) return; state.talking = true; F.done = 1; if (typeof albers_S !== 'undefined') albers_S.open = 1;
  try { if (typeof spannung_trauerAn === 'function') spannung_trauerAn('k5_flaschen'); } catch (e) {}
  const V = (t, ms) => [t, ms, 'VEGAS'], L = (t, ms) => [t, ms, 'DU']; let w = -1; // X-1: Lukes Antworten an Vegas sind gesprochen (DU), keine Gedanken
  try { try { Audio.chains(-28, 1.2, -12.2); } catch (e) {} await wait(700);
    await say([['Die Kette bleibt vor. Vegas hat eine leere Bierflasche in der Hand und hält sie, als wäre sie noch warm.', 4800],
      V('„Die hatte Mike in der Hand. Er hat für mich Pfand gesammelt. Zweiunddreißig passen in die Kiste hinten an der Tankstelle.“', 6200),
      V('„Da stehen einunddreißig. Eine fehlt. Die hier lag morgens auf dem Hof.“', 4200), V('„Ich hab für ihn unterschrieben.“', 2600),
      V('„Deine Mutter hat zweimal angesetzt. Ich hab’s in einem Zug geschafft. Das verzeih ich mir nicht.“', 5600)]);
    w = await n5_wahl(['„Er sitzt auf dem dritten Stuhl. In der Tankstellenjacke.“', '„Das konnten Sie nicht wissen.“']);
    if (w === 0) { await say([L('„Er sitzt auf dem dritten Stuhl. In der Tankstellenjacke.“', 3600)]); await wait(3400); await say([V('„Die hab ich ihm gekauft. Zwei Nummern zu groß. Er sollte reinwachsen.“', 5200)]); }
    else { await say([L('„Das konnten Sie nicht wissen.“', 2400), V('„Ich hab Ordner, Junge. Ich hab alles gewusst. Ich hab bloß gedacht, die nehmen die anderen.“', 5800)]); }
    if (typeof albers_S !== 'undefined') albers_S.open = 0; try { Audio.creak(.2, -28, 1.2, -12.2); Audio.chains(-28, 1.2, -12.2); } catch (e) {} await wait(900); // Tür zu, die Kette bleibt
  } finally { if (typeof albers_S !== 'undefined') albers_S.open = 0; state.talking = false; try { if (typeof spannung_trauerAus === 'function') spannung_trauerAus('k5_flaschen', 90); } catch (e) {} }
  n5_lore('k5_flaschen', 'Einunddreißig Flaschen', 'Mike hat für Vegas Pfand gesammelt. In die Kiste hinten an der Tankstelle passen zweiunddreißig. Da stehen einunddreißig. Die zweiunddreißigste lag am Morgen nach dem 12. Juli auf dem Hof.\n\nVegas hat für ihn unterschrieben. In einem Zug.' + (w === 0 ? '\n\n<span class="hand">Die Jacke war zwei Nummern zu groß. Er sollte reinwachsen.</span>' : ''));
  n5_save(); }

// =====================================================================  5 · „Ist sie’s?“ (Frau Aydın am Bauernhaus, Dina in der Remise)
const N5_FARM = [-112, -13], N5_DINA = [-123.6, -35.4], N5_HEU = [-125.6, .6, -33.3], N5_VORTUER = [-117.5, -19.9];
async function n5_dinaBau() { const O = neben5_S.o, T = THREE;
  const st = await kirchberg_fbx('chair', { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } }, .92); if (st) { kirchberg_setze(st, N5_DINA[0], 0, N5_DINA[1] - .08, 0); st.visible = false; O.stuhl = st; }
  // Fenster des Bauernhauses (Ostseite, erleuchtet): Fassaden-Fenster suchen; „Tiefen-Radierer“ wie kapitel5.js (Lucy am Fenster von Nr. 3)
  let wx = N5_FARM[0], wy = 1.75, wz = N5_FARM[1]; try { let best = 4; for (const W of (typeof fassaden_S !== 'undefined' ? fassaden_S.windows : [])) { const p = neben5_S.v.set(W.x, W.y, W.z); W.g.localToWorld(p); const d = Math.hypot(p.x - wx, p.z - wz) + Math.abs(p.y - 1.75); if (d < best) { best = d; wx = p.x; wy = p.y; wz = p.z; } } } catch (e) {}
  O.fenster = { x: wx, y: wy, z: wz };
  const er = new T.Mesh(new T.PlaneGeometry(.9, 1.45), new T.ShaderMaterial({ vertexShader: 'void main(){ vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); p.z = p.w * .99999; gl_Position = p; }', fragmentShader: 'void main(){ gl_FragColor = vec4(0.); }', colorWrite: false, depthFunc: T.AlwaysDepth }));
  er.position.set(wx - .02, wy, wz); er.rotation.y = PI / 2; er.renderOrder = 20; er.visible = false; er.userData.noCol = true; er.frustumCulled = false; scene.add(er); O.radierer = er;
  O.fensterHit = kirchberg_hit(.6, 1.2, 1.2, wx + .45, wy - .3, wz, () => n5_st('dina').foto && !n5_st('dina').fertig ? 'Das Foto ans Fenster halten' : 'Frau Aydın', () => n5_fensterKlick()); kirchberg_an(O.fensterHit, false);
  O.dinaHit = kirchberg_hit(.8, 1.3, .8, N5_DINA[0], .65, N5_DINA[1], 'Dina', () => n5_dinaKlick()); kirchberg_an(O.dinaHit, false); }
function n5_dinaF() { return typeof ausbau_ost_west_OW !== 'undefined' && ausbau_ost_west_OW.f3 ? ausbau_ost_west_OW.f3.dina || null : null; }
function n5_band(F) { const O = neben5_S.o; if (O.band === undefined && F && F.head) { O.band = null; F.head.traverse(m => { if (m.isMesh && m.geometry && m.geometry.type === 'CylinderGeometry') O.band = m; }); } return O.band || null; }
function n5_dinaTick() { const D = n5_st('dina'), O = neben5_S.o, F = n5_dinaF(), A = O.aydin;
  // Dina sitzt in der Remise (nur Kap. 5, in der Nähe), der Stuhl dazu
  const da = n5_nach9() && n5_d(...N5_DINA) < 70;
  if (F && da && !O.dinaDa) { O.dinaDa = true; lwo_zeigen(F, N5_DINA[0], N5_DINA[1], 0); lwo_sitzen(F, .47); lwo_blick(F, null); } else if (F && !da && O.dinaDa) { O.dinaDa = false; F.g.visible = false; F.sit = false; }
  if (O.stuhl && O.stuhl.visible !== da) O.stuhl.visible = da; n5_an('dinaHit', da && !!F && n5_offenBeat());
  // Frau Aydın am Fenster (lazy), Fenster-Szene startet die Aufgabe
  if (!O.aydinTry && n5_nach9() && n5_d(...N5_FARM) < 90 && typeof LWO !== 'undefined' && LWO.ready && typeof kirchberg_figur === 'function') { O.aydinTry = true;
    kirchberg_figur('aydin5', { id: 'aydin', speed: .8, stride: 1 }).then(F2 => { if (!F2) return; O.aydin = F2; F2.g.traverse(m => { if (m.isMesh) m.renderOrder = 21; }); kirchberg_clip(F2, F2.acts.window_lean ? 'window_lean' : 'idle'); lwo_blick(F2, 'luke'); }); }
  const amFenster = !!A && n5_k5() && n5_nach9() && !D.tuer && n5_d(...N5_FARM) < 60 && (D.fenster || n5_d(...N5_FARM) < 30);
  if (A && O.aydinFenster !== amFenster) { O.aydinFenster = amFenster; if (amFenster) { const W = O.fenster; A.g.position.set(W.x - .3, -.08, W.z); A.g.rotation.y = PI / 2; A.g.visible = true; A.path = null; } else if (!D.tuer) A.g.visible = false; O.radierer.visible = amFenster; }
  if (A && D.tuer && !n5_k5()) A.g.visible = false;
  if (A && D.tuer && !D.fertigZeigen && n5_k5() && !A.g.visible) { D.fertigZeigen = 1; lwo_zeigen(A, -121.8, -31.6, PI); n5_idle0(A); } // nach dem Laden: Frau Aydın bei Dina
  n5_an('fensterHit', amFenster && n5_offenBeat() && (!!D.fenster && !D.fertig));
  if (amFenster && !D.fenster && n5_d(...N5_FARM) < 10 && n5_frei() && n5_offenBeat()) n5_aydinFenster(); }
async function n5_aydinFenster() { const D = n5_st('dina'), S = neben5_S, A = S.o.aydin; D.fenster = 1; S.busy = true; const FA = 'FRAU AYDIN';
  try { try { Audio.play('woodSqueak2', { gain: .3, rate: 1.1, x: S.o.fenster.x, y: 1.8, z: S.o.fenster.z, ref: 2 }); } catch (e) {}
    const sag = z => typeof kirchberg_sag === 'function' ? kirchberg_sag(A, z) : say(z); state.talking = true;
    await sag([['Im Bauernhaus geht ein Fenster auf. Frau Aydın. Sie sieht nicht dich an, sondern zur Remise.', 4600, '']]);
    await sag([['Sie will nicht rein. Ich guck sie an und weiß es nicht.', 3800, FA], ['Du hast die Kamera von der Hilde. Mach ein Bild. Ist sie’s?', 4200, FA]]);
  } finally { state.talking = false; S.busy = false; }
  n5_start('k5_dina', null, { x: N5_DINA[0], z: N5_DINA[1] }); n5_desc('k5_dina', NEBEN5.k5_dina[1] + ' Dina sitzt in der Remise. Ein Bild mit Hildes Kamera.'); n5_save(); }
async function n5_dinaKlick() { const D = n5_st('dina'), F = n5_dinaF(); if (state.talking) return;
  const sag = z => typeof kirchberg_sag === 'function' ? kirchberg_sag(F, z) : say(z); state.talking = true;
  try { if (!D.angesprochen) { D.angesprochen = 1; if (typeof k5_kater === 'function') { try { k5_kater('starren', { x: N5_HEU[0], y: N5_HEU[1], z: N5_HEU[2] }); } catch (e) {} }
      await sag([['Wenn du knipst, sag mir, was drauf ist. Ich guck nicht. Ich hab genug geguckt.', 4600, 'DINA']]); }
    else if (D.foto) await sag([['Sag’s ihr. Ich bleib noch ein bisschen hier.', 3000, 'DINA']]);
    else await sag([['Knips schon.', 1800, 'DINA']]);
  } finally { state.talking = false; } }
function n5_zielDina() { const D = n5_st('dina'), F = n5_dinaF(); if (!n5_offen('k5_dina') || D.foto || !F || !F.g.visible || !n5_offenBeat()) return null;
  const p = F.g.position, d = n5_d(p.x, p.z); if (d > 9 || n5_blick(p.x, 1.05, p.z) < .93) return null;
  return { stempel: '05 · 11 · 26', fov: 36, blitz: .9, halten: 5, text: 'Dina. Ganz, ohne Hand auf der Schulter. Ohne Binde: braune, müde, eigene Augen.',
    vorFoto() { const b = n5_band(F); if (b) b.visible = false; }, nachFoto() { const b = n5_band(F); if (b) b.visible = true; D.foto = 1; },
    async nachEntwickeln() { const sag = z => typeof kirchberg_sag === 'function' ? kirchberg_sag(F, z) : say(z); state.talking = true;
      try { await sag([['Am Bildrand sitzt Hänschen und starrt auf einen Heuballen. Auf dem Polaroid ist hinter dem Heuballen nichts.', 5200, '']]);
        if (typeof k5_stroh === 'function') k5_stroh(N5_HEU[0], N5_HEU[2]); if (typeof k5_kater === 'function') { try { k5_kater('starren', { x: N5_HEU[0], y: N5_HEU[1], z: N5_HEU[2] }); } catch (e) {} }
        await sag([['Du siehst auf. Hänschen starrt immer noch hin. Im Heu raschelt es.', 3800, '']]);
        await sag([['„Ohne Binde. Du. Ganz.“', 2400, 'LUKE'], ['Ohne Binde? Dann bin ich’s.', 2600, 'DINA'], ['Sag ihr, ich hab die Laster gesehen, mit den Ketten, wie sie die anderen reingeladen haben. Deshalb mach ich die Augen zu. Nicht wegen ihr.', 6800, 'DINA']]);
      } finally { state.talking = false; }
      setTimeout(() => { if (typeof k5_kater === 'function' && n5_k5()) try { k5_kater('folgen'); } catch (e) {} }, 6000);
      n5_desc('k5_dina', 'Das Polaroid zeigt Dina ohne Binde. Frau Aydın soll es selbst sehen: am Fenster des Bauernhauses.'); n5_save(); } }; }
async function n5_fensterKlick() { const D = n5_st('dina'), S = neben5_S, A = S.o.aydin; if (state.talking || D.fertig || !A) return;
  if (!D.foto) { if (typeof kirchberg_sag === 'function') kirchberg_sag(A, [['Mach ein Bild. Ist sie’s?', 2400, 'FRAU AYDIN']]); return; } S.busy = true; state.talking = true; const FA = 'FRAU AYDIN';
  const sag = z => typeof kirchberg_sag === 'function' ? kirchberg_sag(A, z) : say(z);
  try { await sag([['„Sie sagt, sie macht die Augen nicht wegen Ihnen zu.“', 3200, 'LUKE'], ['Du hältst das Polaroid an die Scheibe. Frau Aydın sieht lange hin. Sehr lange.', 4600, '']]); await wait(2200);
    A.g.visible = false; S.o.radierer.visible = false; D.tuer = 1; S.o.aydinFenster = false; try { Audio.play('doorCreak', { gain: .35, rate: .9, x: -117.5, y: 1.2, z: -17.7, ref: 3 }); } catch (e) {} await wait(1500);
    lwo_zeigen(A, N5_VORTUER[0], N5_VORTUER[1], PI); A.g.traverse(m => { if (m.isMesh) m.renderOrder = 0; }); n5_idle0(A); lwo_blick(A, 'luke'); D.fertigZeigen = 1;
    await sag([['Die Haustür geht auf. Zum ersten Mal seit dem Sommer.', 3200, ''], ['Und iss was. Du siehst aus wie dein Vater, und der sah schon aus wie nichts.', 4600, FA]]);
    n5_gib('boerek'); await sag([['Sie drückt dir eine Tupperdose in die Hand. Börek, noch warm. „Für den Weg.“ Dann geht sie an dir vorbei, zur Remise.', 5200, '']]);
  } finally { state.talking = false; S.busy = false; }
  lwo_gehe(A, [[-119.2, -24], [-121.8, -31.6]], .8).then(() => { const F = n5_dinaF(); if (F) lwo_blick(A, F.g.position.clone().setY(1.05)); });
  D.fertig = 1; n5_lore('k5_dina_augen', 'Dinas Augen', 'Auf Hildes Polaroid hat Dina keine Binde: braune, müde, eigene Augen. Sie macht die Augen zu, weil sie die Laster gesehen hat, mit den Ketten, wie die anderen reingeladen wurden. Nicht wegen ihrer Mutter.\n\nFrau Aydın hat die Haustür aufgemacht, zum ersten Mal seit dem Sommer.');
  n5_fertig('k5_dina', 'Hildes Kamera lügt nicht: Dina ist Dina. Sie macht die Augen zu, weil sie die Laster mit den Ketten gesehen hat. Frau Aydın ist zu ihr in die Remise gegangen.'); n5_save(); }
// UK 12 (Atempause): Whiskey holt sich ein Stück Börek, die Katze den Rest
function n5_boerekTick(dt) { const D = n5_st('dina'); if (!n5_k5() || k5.beat !== 'tappen' || !n5_item('boerek') || D.gegessen) return; D.tT = (D.tT || 0) + dt; if (D.tT < 16 || !n5_frei()) return; D.gegessen = 1;
  try { if (typeof whiskey_setzen === 'function') { const f = neben5_S.v.set(fwd.x, 0, fwd.z).normalize(); whiskey_setzen(player.pos.x + f.x * 1.2, .03, player.pos.z + f.z * 1.2, () => { if (typeof whiskey_play === 'function') whiskey_play('EatSomething', .1, true); }); } } catch (e) {}
  setTimeout(async () => { n5_weg('boerek'); await n5_says([['Whiskey landet vor dir und holt sich ein Stück Börek aus der Dose. Hänschen frisst den Rest, ohne zu fragen.', 5200], ['„Ich bin der Einzige hier, der nicht isst. Heute vielleicht ganz gut so.“', 4200, 'LUKE']]); }, 2600); }

// =====================================================================  6 · „Der gelbe Kasten“ (Günther Maas; Postrad aus post.js, Schuppen aus post.js/kirchberg.js/neben4.js)
const N5_MAAS = [5.1, 5.35], N5_RAD = [3.9, 6.45], N5_KASTEN = [9.55, 7.05];
async function n5_kastenBau() { const O = neben5_S.o;
  const k = await kirchberg_mod('mailbox2', 'model.gltf', 1.25); // Rückfall: der vorhandene Briefkasten-Scan, postgelb (ein Posteinwurf-Scan fehlt)
  if (k) { k.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0xe8b418); if (m.material.map) m.material.color.multiplyScalar(1.15); } }); kirchberg_setze(k, N5_KASTEN[0], n5_boden(...N5_KASTEN), N5_KASTEN[1], PI); O.kasten = k;
    const b = new THREE.Box3().setFromObject(k); if (typeof addCol === 'function') addCol(b.min.x, b.max.x, b.min.z, b.max.z, b.max.y, -1); }
  O.kastenHit = kirchberg_hit(.6, 1.3, .6, N5_KASTEN[0], .65, N5_KASTEN[1], 'Der gelbe Kasten', () => toast(n5_st('kasten').brief === 'a' ? 'Leerung 17.00. Edda Brands Brief liegt da drin. Morgen früh holt ihn einer.' : 'Ein gelber Postkasten. Leerung 17.00. Die letzte war heute.', 3400)); }
function n5_maasF() { return neben5_S.o.maasF || null; }
function n5_rad() { return typeof post_S !== 'undefined' ? post_S.ride : null; }
function n5_radParken() { const R = n5_rad(); if (!R) return; try { if (typeof neben4_S !== 'undefined' && neben4_S.st.post) neben4_S.st.post.zeigen = 0; } catch (e) {}
  R.path = null; R.done = null; R.v = 0; R.fahrer = false; if (post_S.F) post_S.F.g.visible = false; R.g.position.set(N5_RAD[0], 0, N5_RAD[1]); R.g.rotation.set(0, PI / 2, n5_st('kasten').fall === 2 ? 1.42 : 0); R.g.visible = true; }
function n5_radWeg() { const R = n5_rad(); if (!R) return; R.g.visible = false; R.g.rotation.z = 0; if (post_S.F) post_S.F.g.visible = true; }
function n5_kastenTick() { const K = n5_st('kasten'), O = neben5_S.o, R = n5_rad();
  if (!O.maasTry && n5_nach9() && typeof LWO !== 'undefined' && LWO.ready && typeof kirchberg_figur === 'function') { O.maasTry = true;
    kirchberg_figur('guenther5', { id: 'guenther', speed: .9, stride: 1 }).then(F => { if (F) O.maasF = F; }); }
  const F = n5_maasF(); if (!F || !R) return;
  if (!n5_k5()) { if (O.maasDa) { O.maasDa = false; F.g.visible = false; n5_radWeg(); } return; }
  // Maas unter der Laterne: nach UK 9, erscheint nur, wenn Luke weit weg ist
  if (!K.szene && n5_nach9() && n5_offenBeat() && !O.maasDa && n5_d(...N5_MAAS) > 30) { O.maasDa = true; lwo_zeigen(F, N5_MAAS[0], N5_MAAS[1], -PI / 2); lwo_clip(F, F.acts.nervous ? 'nervous' : 'idle'); lwo_blick(F, 'luke'); n5_radParken(); }
  if (O.maasDa && !K.szene && !K.gesehen && n5_d(...N5_MAAS) < 26) { K.gesehen = 1; n5_start('k5_kasten', (typeof neben4_hat === 'function' && neben4_hat('post_c')) ? null : NEBEN5.k5_kasten[1], { x: N5_MAAS[0], z: N5_MAAS[1] });
    if (typeof neben4_hat === 'function' && neben4_hat('post_c')) n5_desc('k5_kasten', 'Günthers Schuppen hinter der Tankstelle ist noch zu. Und Günther selbst steht an der Kreuzung unter der Laterne, das Postrad neben sich, die Tasche leer.'); }
  if (O.maasDa && !K.szene && n5_d(...N5_MAAS) < 7 && n5_frei() && n5_offenBeat()) n5_maas();
  // nach der Szene: bei „behalten“/„zurückgeben“ ist er mit dem Rad weg, sobald Luke nicht hinsieht; nach dem Einwurf liegt das Rad allein unter der Laterne
  if (K.szene === 2 && K.brief !== 'a' && O.maasDa && n5_d(...N5_MAAS) > 38) { O.maasDa = false; F.g.visible = false; n5_radWeg(); K.szene = 3; }
  if (K.brief === 'a' && K.szene >= 2 && !R.g.visible && n5_k5()) { K.fall = 2; n5_radParken(); } }
function n5_radTick(dt) { const K = n5_st('kasten'), R = n5_rad(); if (K.fall !== 1 || !R) return; K.fallT = (K.fallT || 0) + dt; const k = Math.min(1, K.fallT / .6); R.g.rotation.z = 1.42 * k * k; if (k >= 1) K.fall = 2; }
async function n5_maas() { const K = n5_st('kasten'), S = neben5_S, F = n5_maasF(); K.szene = 1; S.busy = true; state.talking = true;
  const G = (t, ms) => { lwo_sprich(F, Math.max(ms, 1300 + t.length * 50)); return post_zeile(t, ms, 'GÜNTHER'); };
  n5_start('k5_kasten', null, { x: N5_MAAS[0], z: N5_MAAS[1] });
  try { await n5_says([['Günther Maas steht unter der Laterne, das Postrad neben sich, die Tasche leer. Eine Zigarette zittert zwischen seinen Fingern.', 5600]]); state.talking = true;
    const weg = typeof neben4_postWeg === 'function' ? neben4_postWeg() : null;
    if (!weg) await G('Ich hab heut alles ausgetragen, was ich nie ausgetragen hab. Bis auf einen.', 4200); else await G('Alles ausgetragen. Heut Nachmittag. Bis auf einen.', 3200);
    subtitle('Er hält einen vergilbten Umschlag hoch. Schreibmaschine, eine Hamburger Redaktion. Edda Brands Brief.', 4600); await wait(4400);
    await G('Dreimal in der Hand gehabt heute. Seit die Frau weg ist, fahr ich jeden Morgen an dem Kasten vorbei. Ich schaff’s nicht bis zum Schlitz.', 6200);
    // Schreck (1): die Briefkastenklappe von Nr. 7 schlägt zu, ohne dass einer dran war – Maas zuckt, das Rad fällt um (R-1: die Telefonzelle klingelt hier nicht mehr)
    try { Audio.play('metalHit2', { gain: .32, rate: 1.5, x: 28.4, y: 1.1, z: -5.9, ref: 3 }); } catch (e) {} await wait(420); K.fall = 1; K.fallT = 0; if (F.acts.look) lwo_clip(F, 'look'); lwo_blick(F, new THREE.Vector3(28.4, 1.1, -5.9));
    setTimeout(() => { try { Audio.play('metalHit2', { gain: .4, rate: .85, x: N5_RAD[0], y: .3, z: N5_RAD[1], ref: 3 }); Audio.play('metalHit1', { gain: .2, rate: 1.6, delay: .15, x: N5_RAD[0], y: .2, z: N5_RAD[1], ref: 3 }); } catch (e) {} }, 520);
    await wait(2200); lwo_blick(F, 'luke'); lwo_clip(F, F.acts.nervous ? 'nervous' : 'idle');
    await G('Vierzig Jahre Post. Das Einzige, was ich immer zugestellt hab, war Werbung. Werbung hat keiner verboten.', 5000);
    subtitle('Er hält dir den Umschlag hin.', 2400); await wait(2200);
    const i = await n5_wahl(['Den Brief einwerfen', 'Den Brief behalten', 'Günther den Brief zurückgeben']); state.talking = true; const w = i === 0 ? 'a' : i === 2 ? 'c' : 'b'; K.brief = w;
    if (w === 'a') { subtitle('Du gehst mit dem Umschlag zum gelben Kasten. Der Schlitz klemmt kurz. Dann ist der Brief weg.', 4600); await wait(2600); try { Audio.play('metalHit1', { gain: .18, rate: 1.9, x: N5_KASTEN[0], y: 1, z: N5_KASTEN[1], ref: 2 }); Audio.paper(); } catch (e) {} await wait(2000);
      if (typeof lwo_ereignis === 'function') lwo_ereignis('brief_einwerfen'); await G('So. Jetzt ist es weg. Ich hab gar nicht gemerkt, wie leicht das geht.', 4200);
      setTimeout(() => { if (typeof lwo_funk === 'function' && !state.talking && n5_k5()) lwo_funk('„Postversand. Umschlag alt.“'); }, 24000); }
    else if (w === 'b') { if (typeof lwo_ereignis === 'function') lwo_ereignis('brief_behalten'); n5_gib('brief_edda'); await G('Dann lies ihn irgendwann. Die Frau hat’s riskiert. Ich nicht.', 3800); }
    else { if (typeof lwo_ereignis === 'function') lwo_ereignis('brief_zurueck'); subtitle('Du gibst ihm den Brief zurück. Er steckt ihn in die Innentasche, zu den Zigaretten. Dann weint er. Ohne einen Laut.', 5200); await wait(5200); }
    // Durchschlag der Steinmetzrechnung
    await G('Und das hier. Die hab ich für den Kühnle ans Amt gebracht. Eine Behörde, die’s seit Jahren nicht gibt. Bezahlt hat sie trotzdem. Bar.', 6000);
    state.talking = false; await n5_durchschlag(); state.talking = true;
    if (w === 'a') { lwo_gehe(F, [[16, 4.6], [40, 4.4], [70, 4.2]], .9).then(() => { F.g.visible = false; }); }
  } catch (e) { console.warn('neben5: Maas', e); } finally { state.talking = false; S.busy = false; }
  K.szene = 2; n5_lore('k5_brief_zeitung', 'Der Brief an die Zeitung', 'Dr. Edda Brand, Ärztin der Dienststelle, Dezember 2012, an eine Hamburger Zeitung: „Versuchsreihe K … Ein dritter ist vorgesehen; er ist heute zwölf und heißt Brandt.“ Der Brief kam als „Unzustellbar“ zurück. Günther hat ihn seitdem bei sich getragen und es nie bis zum Schlitz geschafft.\n\n'
    + (K.brief === 'a' ? 'Ich hab ihn eingeworfen. Im Kombi schreibt einer mit.' : K.brief === 'c' ? 'Ich hab ihn Günther zurückgegeben. Er hat geweint.' : 'Ich hab ihn behalten.'));
  n5_kastenFertig(false); n5_save(); }
async function n5_durchschlag() { const K = n5_st('kasten'); if (K.durchschlag) return; K.durchschlag = 1; n5_gib('rechnung_durchschlag'); Audio.paper();
  await n5_note('Durchschlag · Steinmetz Kühnle', n5_masch('Steinmetz Kühnle · Grabmale · Abgrundtal\nRechnung Nr. 26-114 · an: BfR i. A. / Institut für Atmosphärenforschung, Messstelle Kirchberg\nGrabstelle Brandt, L., Gedenkfeld Reihe 8 · ausgehoben 30.10.2026 · Stein: Granit grau, Inschrift „LUKE BRANDT · 2009–2026“ · Anmerkung Kunde: „Geburtsjahr 2009 ist richtig so.“\nZahlbar bis 13.11. · Skonto bei Barzahlung · Vielen Dank für Ihren Auftrag. Wir wünschen ein friedliches Gedenken.')
    + '\n\n<i>Kuli vom Steinmetz:</i>\n' + n5_hand('„Zweite Stelle daneben freihalten, wie besprochen? Nicht in Rechnung gestellt.“') + '\n\n<i>Darunter, zweiter Kuli, nur auf dem Durchschlag:</i>\n' + n5_hand('„Bar bezahlt. Handschuhe anbehalten. Frag ich nicht. – K.“'), 'k5_durchschlag'); }
function n5_kastenFertig(ende) { const K = n5_st('kasten'); if (!K.brief) return; const c = typeof neben4_hat === 'function' && neben4_hat('post_c');
  const t = { a: 'Edda Brands Brief ist im gelben Kasten. Günther ist zu Fuß gegangen, sein Rad liegt allein unter der Laterne.', b: 'Edda Brands Brief steckt in meiner Jacke. „Die Frau hat’s riskiert. Ich nicht.“', c: 'Ich hab Günther den Brief zurückgegeben. Er hat geweint.' }[K.brief] + ' Die LWO bezahlt mein Grab, bar. Günther hat die Rechnung selbst überbracht.';
  if (c && !K.schuppen && !ende) return n5_desc('k5_kasten', t + ' Günthers Schuppen hinter der Tankstelle ist noch zu. Mit dem Brecheisen aus dem Schrott ginge es.');
  n5_fertig('k5_kasten', t); }
// Weg c aus Kap. 4: Brecheisen im Schrottauto, Einbruch (−15), leere Kisten, B-K5-N1, Günther an der Tür
async function n5_schuppenTuer() { const K = n5_st('kasten'), S = neben5_S; if (state.talking || S.busy) return;
  if (!n5_item('brecheisen')) { n5_gedanke('n5_schloss', '„Neues Schloss. Mit einem Brecheisen ginge es. Im Schrott der Tankstelle liegt genug Eisen.“', 0); return toast('Das Vorhängeschloss ist neu. Das Auge darauf ist frisch geprägt.', 3000); }
  const i = await n5_wahl(['Das Schloss aufbrechen', 'Lassen']); if (i !== 0) return;
  S.busy = true; state.talking = true;
  try { for (let k = 0; k < 3; k++) { try { Audio.play('metalHit2', { gain: .45, rate: .8 + k * .1, x: 101.1, y: 1.1, z: -26.05, ref: 3 }); } catch (e) {} await wait(700); }
    try { Audio.play('lockOpen', { gain: .6, x: 101.1, y: 1.1, z: -26.05, ref: 2 }); } catch (e) {} await say([['Beim dritten Mal gibt das Schloss nach. Das Auge darauf ist verbogen.', 3400]]);
    if (typeof lwo_ereignis === 'function') lwo_ereignis('schuppen_aufbrechen'); if (typeof kirchberg_oeffne === 'function') kirchberg_oeffne('schuppen'); K.schuppen = 1; n5_weg('brecheisen');
  } finally { state.talking = false; S.busy = false; }
  n5_save(); if (typeof kirchberg_rein === 'function') await kirchberg_rein('schuppen'); await n5_schuppenInnen(); }
async function n5_schuppenInnen() { const K = n5_st('kasten'), S = neben5_S; if (K.innen) return; K.innen = 1; S.busy = true;
  try { if (typeof n4_schuppenBau === 'function') await n4_schuppenBau(); } catch (e) {} const O4 = typeof neben4_S !== 'undefined' ? neben4_S.o : {}, C = POST_RAUM.schuppen;
  if (O4.gSitz) O4.gSitz.visible = false; state.talking = true;
  try { await wait(900); await say([['Die Obstkisten sind leer. Alle. AHORN 1 bis 7, HOF, ZEITUNG. Er hat wirklich alles ausgetragen.', 4800]]);
    try { if (typeof beobachter_zettel === 'function') beobachter_zettel('b_k5_n1', { pos: [C.x - .62, .62, C.z + .72] }); } catch (e) { console.warn('neben5: B-K5-N1', e); }
    await say([['Auf dem Hocker liegt ein gefalteter Zettel. Ordentlich. Hinter dir knarrt die Tür.', 4200]]);
    if (O4.gTuer) { O4.gTuer.visible = true; S.o.gTuerAn = true; }
    await post_zeile('Ich hab gesagt, das ist Einbruch. Das muss ich melden.', 3400, 'GÜNTHER'); subtitle('Er weint. Er wischt es nicht weg.', 2600); await wait(2600);
    await post_zeile('Mach ich aber nicht.', 2000, 'GÜNTHER'); await post_zeile('Der Zettel lag heut Mittag schon da, auf meinem Hocker. Ich hab ihn nicht angefasst.', 4400, 'GÜNTHER');
    if (!K.durchschlag) { await post_zeile('Und das nehmen Sie mit. Die Rechnung vom Kühnle. Den Durchschlag. Ich hab sie selbst ans Amt gebracht.', 5000, 'GÜNTHER'); state.talking = false; await n5_durchschlag(); state.talking = true; }
  } finally { state.talking = false; S.busy = false; }
  n5_fertig('k4_post', 'Ich bin in Günthers Schuppen eingebrochen. Die Kisten waren leer: Er hat heute Nachmittag alles ausgetragen, was nie ankommen durfte. Er stand an der Tür und hat geweint – und mir trotzdem geholfen.');
  n5_kastenFertig(false); n5_save(); }

// =====================================================================  7 · Einlösungen: Gasleck-Kerzen vor Nr. 7 · Gisela am Napfbrett · HEINI · Postfahne
const N5_KERZE = [23.6, -10.9];
function n5_gasBau() { const O = neben5_S.o; O.lichter = [];
  const add = (x, z) => { const C = candleAt(x, n5_boden(x, z), z); C.g.visible = false; C.on = false; C.light.intensity = 0; O.lichter.push(C); return C; };
  add(...N5_KERZE); for (let i = 0; i < 8; i++) add(24.25 + i * .36, -10.95); add(27.65, -10.3); } // die neue Kerze, acht Grablichter in einer Reihe, ein neuntes einen Schritt abseits
function n5_gasTick() { const O = neben5_S.o, G = n5_st('gas'); if (!O.lichter) return; const an = n5_k5() && typeof neben4_hat === 'function' && neben4_hat('gasleck_zurueck');
  if (O.lichterAn !== an) { O.lichterAn = an; for (const C of O.lichter) { C.on = an; C.g.visible = an; if (!an) C.light.intensity = 0; } }
  if (an && !G.gesehen && n5_d(24.4, -10.6) < 6 && n5_frei()) { G.gesehen = 1; n5_says([['Eine der Kerzen vor Hildes Tür ist neu und brennt. Keiner hat sie angezündet. Daneben acht Grablichter in einer Reihe, ein neuntes einen Schritt abseits.', 6200], ['„Acht und eins. Hilde hätte das gefallen. Glaub ich.“', 3400, 'LUKE']]); } }
function n5_giselaTick() { const O = neben5_S.o, K = typeof kirchberg_S !== 'undefined' ? kirchberg_S : null; if (!K || !K.brett || !K.F || !K.F.gisela) return; const G = K.F.gisela;
  const soll = n5_k5() && k5.f.gisela && !(typeof K5 !== 'undefined' && K5.g.gisela && K5.g.gisela.visible) && typeof k5_ab === 'function' && k5_ab('licht');
  if (soll && !O.gisela) { O.gisela = true; K.zaun = true; if (G.idle0 && G.acts.idle !== G.idle0) { G.acts.idle.setEffectiveWeight(0); G.acts.idle = G.idle0; G.idle0.setEffectiveWeight(1); } G.g.position.set(K.brett.x - 1.4, 0, K.brett.z - .2); G.g.rotation.y = 0; lwo_blick(G, 'luke'); }
  else if (!soll && O.gisela) { O.gisela = false; K.zaun = false; } }
function n5_kreiselTick() { if (n5_offen('k4_kreisel') && n5_item('polaroid_heini')) n5_fertig('k4_kreisel', 'Auf Hildes Polaroid hat Grete einen Mund, eine Zahnlücke und eine rote Schleife, hinter ihr unscharf ein Junge in kurzen Hosen. In Kinderschrift: HEINI. Sie hat ihn nicht vergessen. Für Wolter ist dieses Bild mehr wert als jede Akte.'); }
function n5_fahneTick() { const J = n5_st('jonas'), O = neben5_S.o; if (!J.eingeworfen) return; const oben = n5_k5() && k5.beat !== 'ende'; if (O.fahneOben !== oben) n5_fahne(oben); }

// ---------------------------------------------------------------------  Kamera-Ziele (kamera_zielDazu): Kreuzung (mit dem Neunten), Zapfinsel, Dina
function neben5_kameraZiel(cam) { if (!n5_k5()) return null; return n5_zielKreuz() || n5_zielZapf() || n5_zielDina(); }

// ---------------------------------------------------------------------  Umhüllungen fremder Klickflächen (Dateien bleiben unverändert)
function n5_lab(o) { const l = o.userData.label; try { return typeof l === 'function' ? String(l()) : String(l || ''); } catch (e) { return ''; } }
function n5_finde(re, x, z, r) { const v = neben5_S.v; return interactables.filter(o => re.test(n5_lab(o)) && (o.getWorldPosition(v), Math.hypot(v.x - x, v.z - z) < r)); }
function n5_huelle(m, wenn, label, tun) { if (!m || m.userData.n5) return; m.userData.n5 = true; const ol = m.userData.label, oa = m.userData.action;
  m.userData.label = () => wenn() ? (typeof label === 'function' ? label() : label) : (typeof ol === 'function' ? ol() : ol); m.userData.action = () => wenn() ? tun() : oa && oa(); }
// Welt (ausbau_ost_west, post.js): gilt ab Kap. 5, auch nach dem Weiterspielen in Kap. 6
function n5_huellenWelt() { const S = neben5_S; if (S.hWelt >= 2) return; S.hWelt++; const k5b = () => typeof kap === 'function' && kap() >= 5;
  for (const m of n5_finde(/Hildes Laube/, ...N5_LAUBE, 3)) n5_huelle(m, () => n5_k5() && typeof k5_ab === 'function' && k5_ab('foto1'), () => n5_st('laube').gelesen ? 'Hildes Laube' : 'Hildes Laube · unter der Bank', () => n5_laube());
  for (const m of n5_finde(/Nachtschalter|Geldkassette|Kassenbuch/, 115.1, 24.8, 2)) n5_huelle(m, () => n5_k5() && k5.f.kanisterFoto && !n5_st('kan').seite, 'Kassenbuch · die letzte Seite', () => n5_kassenbuch());
  for (const m of n5_finde(/Zapfinsel|Kanister abstellen/, 111, 15, 6)) n5_huelle(m, k5b, 'Zapfinsel', () => toast(n5_offen('ow_kanister') && !(typeof k5 !== 'undefined' && k5.f.kanisterFoto) ? 'Vier abgeschnittene Bolzen, wo die Säulen standen. Acht Kreidestriche daneben. Hildes Kamera zeigt, was hier stand.' : 'Vier abgeschnittene Bolzen, wo die Säulen standen. Jemand hat Kreidestriche daneben gemacht: acht Stück.', 4200));
  for (const m of n5_finde(/Roter Kanister/, 133.6, -10.2, 2)) n5_huelle(m, k5b, 'Roter Kanister', () => toast('Ein roter Kanister im Schrott, leer. Auf dem Griff, eingeritzt: LUKE.', 3400));
  for (const m of n5_finde(/Schrottauto/, 130.5, -12.6, 3)) n5_huelle(m, () => n5_k5() && typeof neben4_hat === 'function' && neben4_hat('post_c') && !n5_item('brecheisen') && !n5_st('kasten').schuppen, 'Schrottauto · Kofferraum', () => { n5_gib('brecheisen'); try { Audio.play('metalOpen', { gain: .3, rate: 1.1, x: 130, y: 1, z: -12, ref: 2 }); } catch (e) {} toast('Unter dem Schulranzen im Kofferraum: ein Brecheisen, rostig, aber gerade.', 3600); });
  const h = typeof post_S !== 'undefined' && post_S.schuppenHit; if (h) n5_huelle(h, () => n5_k5() && typeof neben4_hat === 'function' && neben4_hat('post_c') && !(typeof kirchberg_offen === 'function' && kirchberg_offen('schuppen')), () => n5_item('brecheisen') ? 'Schuppentür aufbrechen' : 'Schuppentür', () => n5_schuppenTuer()); }
// Kapitel 5 (nach k5_huellen): Briefkasten Nr. 7, Telefonzelle, Vegas’ Tür
function n5_huellenK5() { const S = neben5_S; if (S.hK5) return; S.hK5 = true; const J = () => n5_st('jonas');
  if (typeof mailbox7 !== 'undefined') { n5_huelle(mailbox7, () => n5_k5() && n5_item('hildes_antworten') && !J().eingeworfen, 'Hildes Antworten einwerfen · Fahne hoch', () => n5_einwerfen()); }
  if (typeof booth !== 'undefined' && booth.phone) { const H = () => n5_st('heidi');
    n5_huelle(booth.phone, () => n5_k5() && !['anruf', 'anrufLaeuft'].includes(k5.beat) && n5_item('heidi_karte') && !H().anruf, 'Heidi anrufen', () => n5_heidiAnruf()); }
  if (typeof albers_talk === 'function') albers_talk = (o => async (...a) => { if (n5_k5() && n5_flaschenOffen()) return n5_flaschen(); if (n5_k5() && n5_vegasOffen()) return n5_vegasTuer(); return o(...a); })(albers_talk); }

// ---------------------------------------------------------------------  Spielstand · Laden · Takt
MOD_SAVE.push(['neben5', () => ({ st: neben5_S.st }), v => { if (v && v.st && typeof v.st === 'object') neben5_S.st = v.st; neben5_S.nachLaden = true; }]);
beginGame = (o => function (resume) { const r = o.apply(this, arguments); if (!resume && state.started) { neben5_S.st = {}; neben5_S.nachLaden = true; } return r; })(beginGame);
WORLD_MODS.push(['Nebenaufgaben Kap. 5', async () => { const S = neben5_S; neben5_register();
  for (const [k, [n, d]] of Object.entries(N5_ITEMS)) modItem(k, n, d, 'paper');
  try { await n5_jonasBau(); } catch (e) { console.warn('neben5: Jonas', e); }
  try { await n5_heidiBau(); } catch (e) { console.warn('neben5: Heidi', e); }
  try { await n5_dinaBau(); } catch (e) { console.warn('neben5: Dina', e); }
  try { await n5_kastenBau(); } catch (e) { console.warn('neben5: Kasten', e); }
  try { n5_gasBau(); } catch (e) { console.warn('neben5: Kerzen', e); }
  try { n5_huellenWelt(); } catch (e) { console.warn('neben5: Hüllen', e); }
  if (typeof kamera_zielDazu === 'function') kamera_zielDazu(neben5_kameraZiel);
  if (typeof KAP_END !== 'undefined') KAP_END[5].push(() => neben5_kapEnde());
  S.ready = true; window.__neben5 = { S, st: n5_st, laube: n5_laube, maas: n5_maas, heidi: n5_heidiAnruf, karte: n5_karte, nacht: n5_nachttisch, einwerfen: n5_einwerfen, kapsel: n5_kapsel,
    aydin: n5_aydinFenster, fenster: n5_fensterKlick, schuppen: n5_schuppenTuer, kassenbuch: n5_kassenbuch, ziel: neben5_kameraZiel, kinder: n5_kinderBau, junge: n5_jungeBau }; }]); // Testzugriff
WORLD_TICK.push(dt => { const S = neben5_S; if (!S.ready || !state.started) return;
  n5_radTick(dt); S.chk -= dt; if (S.chk > 0) return; const d = .2 - S.chk; S.chk = .2;
  if (S.nachLaden) { S.nachLaden = false; S.o.maasDa = false; S.o.dinaDa = false; { const K = n5_st('kasten'); if (K.szene === 1) K.szene = 0; } S.o.aydinFenster = undefined; S.o.lichterAn = undefined; S.o.fahneOben = undefined; if (S.hWelt < 2) n5_huellenWelt(); }
  if (!S.hK5 && typeof k5 !== 'undefined' && k5.huellen) { try { n5_huellenK5(); if (S.hWelt < 2) n5_huellenWelt(); } catch (e) { console.warn('neben5: Hüllen Kap. 5', e); } }
  try { n5_jonasTick(); n5_fahneTick(); n5_laubeTick(); n5_kanisterTick(); n5_heidiTick(d); n5_dinaTick(); n5_boerekTick(d); n5_kastenTick(); n5_gasTick(); n5_giselaTick(); n5_kreiselTick();
    if (S.o.gTuerAn && !(typeof kirchberg_S !== 'undefined' && kirchberg_S.inRaum === 'schuppen')) { S.o.gTuerAn = false; if (typeof neben4_S !== 'undefined' && neben4_S.o.gTuer) neben4_S.o.gTuer.visible = false; }
  } catch (e) { console.warn('neben5: Takt', e); S.chk = 2; } });
