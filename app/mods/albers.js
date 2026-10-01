// =====================================================================  VEGAS (Modul „albers“): Lars Vegas, Nr. 3 (Fassung 3: Kap. 1, 3, 4, 5; Gespräche aus Kap. 3, am Ende Kap. 1 „Schnalle zu“, AP-15)
// Der Einzige, der in dieser Nacht wach ist. Grummelig, misstrauisch, verbarrikadiert – er wirkt wie ein Verschwörungsspinner.
// Er öffnet die Tür nur einen Spalt (Kette vor), Lampenlicht fällt heraus, hinter ihm knurrt Bruno. Fünf Gespräche, freigeschaltet durch den
// Fortschritt; jede seiner Behauptungen wird später im Spiel belegt (Nebenaufgabe „Das Schlimmste am Rechthaben“ hakt sie ab).
// Unreal-Modell „alter_mann“ (unreal/Export_Figuren.bat): dann steht er sichtbar im Türspalt. Ohne Modell: nur Licht, Schatten und Stimme – keine Ersatzpuppe.
const albers_S = { door: { x: -28, y: 1.45, z: -12.2 }, talked: new Set(), hissed: false, busy: false, fig: null, mx: null, act: {}, light: null, beam: null, t: 0, confirmed: new Set() };
const ALBERS_CLAIMS = [
  { id: 'laternen', text: '„Die Laternen zählen mit.“', ok: () => ch3.lampsOff },
  { id: '1312', text: '„Der Blecheimer ist von 1312.“', ok: () => story.lore.some(l => l.key === 'c3chronik' || l.key === 'nord_suehnekreuz') },
  { id: 'funk', text: '„Die senden auf einunddreißig-zehn.“', ok: () => ch3.radio },
  { id: 'siebzehn', text: '„Alle siebzehn Jahre holt es Kinder.“', ok: () => story.lore.some(l => l.key === 'c3chronik' || l.key === 'c3buch') },
  { id: 'augen', text: '„Du hast die falschen Augen, Junge.“', ok: () => story.photos.has(4) || ch3.room1 }];
// Gespräche: Bedingung → höchstens drei Sätze (danach ist wieder der Spieler dran)
const ALBERS_TALKS = [
  { id: 't1', when: () => kap() === 3, claim: 'laternen', lines: [
    ['„Nicht so laut, Junge. Die hören mit.“', 3000], ['„Die Laternen. Hast du\'s gesehen? Die atmen. Die zählen mit Licht, seit fünfundsiebzig.“', 4600],
    ['„Wenn du über die Kreuzung musst: Lampe aus. Frag nicht. Mach einfach.“', 3800]] },
  { id: 't2', when: () => kap() === 3 && ch3.met, claim: '1312', lines: [
    ['„Du hast ihn gesehen. Den Blecheimer. Ich riech\'s an dir – Rost und Schnee.“', 4200], ['„Der ist älter als die Kapelle. Dreizehnhundertzwölf. Steht alles in der Chronik, aber die liest ja keiner.“', 5000],
    ['„Der Pfarrer hat gesagt, ich trink zu viel. Der Pfarrer ist zweiundneunzig in den Nebel gegangen.“', 4600]] },
  { id: 't3', when: () => kap() === 3 && ch3.met && story.items.includes('buch'), claim: 'siebzehn', lines: [
    ['„Hildes Buch. Die hat alles gezählt, die alte Krähe. Und keiner hat ihr geglaubt. Mir auch nicht.“', 4800], ['„Rechne nach, Junge. Alle siebzehn Jahre.“', 3400],
    ['„Und dieses Jahr ist wieder so eins.“', 3000]] },
  { id: 't4', when: () => kap() === 3 && ch3.met && ch3.radio, claim: 'funk', lines: [
    ['„Einunddreißig-zehn. Hab ich\'s nicht gesagt? Die senden. Die haben nie aufgehört.“', 4400], ['„Das Amt, Junge. Ebene minus zwei. Stühle mit Riemen. Ich hab fünfundsiebzig auf so einem gesessen.“', 5000],
    ['„Du auch. Ich seh\'s dir an.“', 2800]] },
  { id: 't5', when: () => kap() === 3 && (ch3.lampsOff || (ch3.radio && story.items.includes('buch'))), claim: 'augen', lines: [
    ['„Wenn du da reingehst: Zähl nicht mit. Egal, was sie dir vorsagt.“', 4000], ['„Ich hab euch zweitausendneun auf der Kreuzung gezählt. Sieben, hab ich gesagt. Gott sei Dank.“', 4800],
    ['„Aber du, Junge … bis zu dem Sommer hattest du blaue Augen. Ich kenn dich, seit du laufen kannst.“', 4200]] },
  // Fassung 3 (AP-26): Vegas durch die Tür V-07 … V-13 (85 §3, wortgleich; V-01 … V-06 stehen in ALBERS_V, V-04 = W-01 in whiskey.js). Kap. 3 an der Straße, Kap. 4/5 über die Haustür.
  // V-07 „Der Graue mit dem Tee“ (Kap. 3, `albers.js` nach t2)
  { id: 'V-07', when: () => kap() === 3 && ch3.met && albers_S.talked.has('1312'), claim: 'v07', lines: [['„Hut, Handschuhe, auch im Juli. Ich hab ihn gesehen, da war ich ein Kind. Ich hab ihn gesehen, da war Mike ein Kind. Derselbe Mann.“', 5600], ['„Die Leute sagen: Der Vegas sieht Gespenster. Ich sag: Dann ist es ein Gespenst, das Tee trinkt. Das ist schlimmer.“', 5100], ['„Guck auf die alten Fotos. Immer am Rand. Immer gleich alt.“', 3300]] },
  // V-08 „Zwei Buchstaben“ (Kap. 3, beim Ordner, Z-01)
  { id: 'V-08', when: () => kap() === 3 && !!albers_K3.st.gelesen, claim: 'v08', lines: [['„Dreißig Jahre hab ich ausgeschnitten, wo was passiert ist. Weißt du, was drunter steht? Zwei Buchstaben in Klammern.“', 5200], ['„Die Kaninchenzüchter kriegen einen Namen. Das Schützenfest kriegt einen Namen. Ein Kind ist weg, und es gibt zwei Buchstaben. Rate, wer h w ist.“', 6100]] },
  // V-09 „Die Katzenfrau hat recht“ (Kap. 3)
  { id: 'V-09', when: () => kap() === 3 && ch3.met, claim: 'v09', lines: [['„Die Gisela sagt, ihre Katzen gucken, weil da einer steht. Ich sag, das sind Strahlen. Wir streiten seit fünfundsiebzig.“', 5300], ['„Das Schlimme ist: Ich glaub, sie hat recht, und ich sag’s ihr nicht. Da, wo die Katzen hingucken, liegen morgens drei Kiesel übereinander.“', 5900], ['„Ich hab welche gesammelt. Die liegen im Keller. Im Dreieck. Hab ich nicht so hingelegt.“', 4200]] },
  // V-10 „Gummistiefel“ (Kap. 3, vor AG-10)
  { id: 'V-10', when: () => kap() === 3 && ch3.met && !(typeof lwo_S !== 'undefined' && lwo_S.seen && lwo_S.seen['ag:AG-10']), claim: 'v10', lines: [['„Wenn du im Nebel einen Ritter siehst, guck auf die Füße. Gummistiefel? Dann ist es keiner.“', 4300], ['„Die kommen mit Ketten, weiße Anzüge, Kapuze aus Eisen. Haben sie sich beim Ritter abgeguckt. Bei dem funktioniert’s.“', 5200]] },
  // V-11 „Unzustellbar“ (Kap. 4, nach AG-12)
  { id: 'V-11', when: () => kap() === 4 && typeof lwo_S !== 'undefined' && !!lwo_S.seen['ag:AG-12'], claim: 'v11', lines: [['„Zwölf Briefe hab ich ans richtige Bundesamt geschrieben. Keine Antwort. Weißt du, warum? Die sind nie angekommen.“', 5100], ['„Der Günther. Kommt um vier, klingelt wie ein Rabe und guckt keinem in die Augen. Wer keinem in die Augen guckt, hat was im Schuppen.“', 5700], ['„Neues Vorhängeschloss am Reifenschuppen. Wer braucht für alte Reifen ein neues Schloss?“', 4200]] },
  // V-12 „Pfand“ (Kap. 4 oder 5)
  { id: 'V-12', when: () => kap() === 4 || kap() === 5, claim: 'v12', lines: [['„Jede Pfandflasche hat einen Strichcode. Die wissen, wer wann was trinkt. Ich bring meine nur nach Mitternacht weg, mit Handschuhen.“', 5700], ['„Das ist Pfand, Herr Vegas.“', 2400, 'DU'], ['„Mike hat an dem Abend Pfand weggebracht. Die Kiste steht noch neben dem Automaten. Eine Flasche fehlt. Die hatte er in der Hand.“', 5600]] },
  // V-13 „Der Wald hat kein Echo“ (Kap. 5, Vorbote Kap. 6)
  { id: 'V-13', when: () => kap() === 5, claim: 'v13', lines: [['„Geh in die Dustwoods und ruf ‚Hallo‘. Kommt nichts zurück. Das hat einer aufgefressen.“', 4200], ['„Zweiundneunzig haben sie was aus dem Loch geholt. Lastwagen mit Stroh drin, wie für ein Pferd. Seitdem gibt’s im Wald keine Rehe mehr. Nur welche, die so aussehen.“', 6700]] }];
function albers_claimCheck() {
  const q = story.side.albers_spinn; if (!q) return;
  for (const c of ALBERS_CLAIMS) if (albers_S.talked.has(c.id) && !albers_S.confirmed.has(c.id) && c.ok()) { albers_S.confirmed.add(c.id); questPop('VEGAS HATTE RECHT', c.text); Audio.chime(); }
  const liste = ALBERS_CLAIMS.filter(c => albers_S.talked.has(c.id)).map(c => (albers_S.confirmed.has(c.id) ? '✓ ' : '? ') + c.text).join('<br>'); // AP-25: mit Warum (Lukes Satz), eine Zeile je Behauptung
  if (liste) q.desc = 'Vegas hat immer recht, das ist das Schlimme. Was er behauptet, prüf ich nach.<br>' + liste;
  if (albers_S.confirmed.size === ALBERS_CLAIMS.length && q.state !== 'done') { sideDone('albers_spinn'); // STORY-HOOK: Vegas glaubwürdig – er kann im Finale gebraucht werden
    setTimeout(() => openNote('Lars Vegas hatte recht', 'Die Laternen. Der Ritter von 1312. Die siebzehn Jahre. Die Sender. Deine Augen.\n\nAlles, worüber im Ort gelacht wurde, stimmt.\n\n<span class="hand">Das Schlimmste am Rechthaben, hat er gesagt, ist, dass es keiner hören will.</span>', 'albers_recht'), 1600); }
}
async function albers_talk() {
  const S = albers_S; if (S.busy || state.talking) return;
  if (albers_k3OrdnerBereit()) return albers_k3Ordner(); // Fassung 3 (AP-18): „Rot eingekreist“ – der Ordner durch den Kettenspalt
  const next = ALBERS_TALKS.find(T => !S.talked.has(T.claim) && T.when());
  S.busy = true; state.talking = true; Audio.chains(S.door.x, 1.2, S.door.z); Audio.creak(.25); S.open = 1;
  if (next) {
    await say(next.lines.map(([t, ms, who]) => [t, ms, who || 'LARS VEGAS']));
    S.talked.add(next.claim); if (/^V-0[1-6]$/.test(next.id)) albers_K1.v.add(next.id); story.lore.push({ key: 'albers_' + next.id, title: 'Vegas an der Tür', html: next.lines.map(l => l[0]).join('\n') });
    sideStart('albers_spinn'); albers_claimCheck();
    if (kap() === 3 && !ALBERS_TALKS.some(T => !S.talked.has(T.claim) && T.when())) setTimeout(() => subtitle('Die Kette rasselt. Die Tür geht zu. Drinnen ist es still. Kein Hund, der knurrt. Nicht mehr.', 4200), 600);
  } else await say([[S.talked.size >= ALBERS_TALKS.length ? '„Ich hab gesagt, was ich weiß. Jetzt geh. Und mach die Lampe aus.“' : '„Geh weg. Komm wieder, wenn du was gesehen hast. Dann reden wir.“', 3800, 'LARS VEGAS']]);
  S.open = 0; Audio.play(Audio.pick('woodClose1', 'woodClose2'), { gain: .6, x: S.door.x, y: 1.2, z: S.door.z, ref: 3 }); state.talking = false; S.busy = false;
}
WORLD_MODS.push(['Vegas', async () => {
  const S = albers_S, D = S.door;
  albers_k1Init(); // Fassung 3 (AP-15): Kapitel 1 an Tür und Halsband
  try { await albers_k3Init(); } catch (e) { console.warn('Vegas: Kap. 3', e); } // Fassung 3 (AP-18): „Rot eingekreist“
  story.side.albers_spinn = { title: 'Das Schlimmste am Rechthaben', desc: 'Der alte Vegas erzählt Dinge, die keiner glaubt.', state: 'hidden' }; // schon beim Laden da → wird mit dem Spielstand gesichert
  S.light = new VLight(0xffb070, 0, 4, 2); S.light.position.set(D.x, 1.9, D.z + .25); scene.add(S.light);   // Lampenlicht aus dem Türspalt
  S.beam = new VLight(0xffc890, 0, 5, 2); S.beam.position.set(D.x + .3, 1.2, D.z + 1.4); scene.add(S.beam);    // Taschenlampe, die dich anleuchtet
  S.hit = box(1.1, 2.1, .3, D.x, 1.5, D.z + .15, hidden, { cast: false }); uninteract(S.hit);
  interact(S.hit, () => ALBERS_TALKS.some(T => !albers_S.talked.has(T.claim) && T.when()) ? 'An Vegas\' Tür klopfen' : 'Vegas\' Tür', () => albers_talk()); uninteract(S.hit);
  const F = await figuren_load('vegas'); // Lars Vegas, 60: eigene Figur aus der Figuren-Werkstatt
  if (F) { const w = await figuren_clone(F, 1.74); w.position.set(D.x + .2, .45, D.z + .45); w.visible = false; scene.add(w); S.fig = w; // tritt einen Schritt auf die Veranda, die Tür hinter sich angelehnt
    S.mx = new THREE.AnimationMixer(w.children[0]); for (const [k, c] of [['idle', 'idle'], ['talk', F.clips.talk ? 'talk' : 'look']]) if (F.clips[c]) S.act[k] = S.mx.clipAction(F.clips[c]); /* beim Reden sieht er sich unruhig um */ if (S.act.idle) S.act.idle.play(); }
}]);
WORLD_TICK.push((dt, t) => {
  albers_k3Tick(); albers_fadenTick(dt); // AP-25: Faden „Das Schlimmste am Rechthaben“ in jedem Kapitel
  const S = albers_S; if (!ch3.on || ch3.part !== 'town') { if (S.on) { S.on = false; uninteract(S.hit); } if (S.wOpen || S.open || S.t > .01) albers_door(dt, t); return; } // Whiskey-Szenen (AP-08): Tür in jedem Kapitel
  if (!S.on) { S.on = true; if (!interactables.includes(S.hit)) interactables.push(S.hit); for (const T of ALBERS_TALKS) if (story.lore.some(l => l.key === 'albers_' + T.id)) S.talked.add(T.claim); } // nach Laden: geführte Gespräche wiederherstellen
  const P = player.pos, d = Math.hypot(P.x - S.door.x, P.z - S.door.z);
  if (!S.hissed && d < 9 && !state.talking && +document.getElementById('subtitle').style.opacity < .05) { S.hissed = true; subtitle('<i>„Psst! Junge! Hierher. Leise, verdammt!“</i> – aus dem Türspalt von Nr. 3.', 4200); Audio.whisper(S.door.x, 1.5, S.door.z, 1.2); }
  albers_door(dt, t);
  S.chk = (S.chk || 0) - dt; if (S.chk < 0) { S.chk = 1; if (S.talked.size) albers_claimCheck(); }
});
// Spalt auf/zu: Licht und Figur weich ein- und ausblenden, Taschenlampen-Zittern (bei Whiskey-Szenen bleibt Vegas hinter der Kette)
function albers_door(dt, t) { const S = albers_S, P = player.pos;
  S.t += ((S.open ? 1 : 0) - S.t) * Math.min(1, dt * 4); S.light.intensity = S.t * (.9 + Math.sin(t * 13) * .05); S.beam.intensity = S.t * (S.wOpen ? .5 : 1.4 + Math.sin(t * 7.3) * .15 + Math.sin(t * 17) * .06);
  if (S.fig) { S.fig.visible = S.t > .05 && !S.wOpen; if (S.fig.visible) { const want = state.talking && S.act.talk ? S.act.talk : S.act.idle;
      if (want && want !== S.cur) { want.reset().fadeIn(.3).play(); if (S.cur) S.cur.fadeOut(.3); S.cur = want; } S.mx.update(dt);
      const a = Math.atan2(P.x - S.fig.position.x, P.z - S.fig.position.z); S.fig.rotation.y += Math.atan2(Math.sin(a - S.fig.rotation.y), Math.cos(a - S.fig.rotation.y)) * Math.min(1, dt * 3); } } }
// Fassung 3 (AP-08): Vegas durch den Türspalt in Whiskeys Szenen (W-01 Taufe, K1-4 Speck, K4-4 Papas Marke …). lines: [Text, ms, Sprecher] oder async-Funktionen
async function albers_whiskey(lines, o = {}) { const S = albers_S; if (S.busy) return false; S.busy = true; S.wOpen = true;
  Audio.chains(S.door.x, 1.2, S.door.z); Audio.creak(.25); S.open = 1;
  try { for (const l of lines) { if (typeof l === 'function') await l(); else await say([[l[0], l[1], l[2] || 'LARS VEGAS']]); } }
  finally { S.open = 0; Audio.chains(S.door.x, 1.2, S.door.z); Audio.play(Audio.pick('woodClose1', 'woodClose2'), { gain: .6, x: S.door.x, y: 1.2, z: S.door.z, ref: 3 }); S.busy = false; setTimeout(() => { S.wOpen = false; }, 1400); }
  return true; }

// =====================================================================  Fassung 3 (AP-15): Kapitel 1 · „Schnalle zu“ – Vegas an Tür und Küchenfenster (Nr. 3), V-01 … V-06, Bruno-Happen
// Wortlaut 85 §3 (V-01 … V-06) und 11 „Schnalle zu“. Je Spieleraktion (Klopfen) ein Happen. V-04 = W-01 (Taufe, whiskey.js). V-06 erst nach AG-02, V-03 erst nach Z-02.
// Die Tür bleibt an der Kette; die Klickfläche der Basis (doorOf[3]) wird in Kap. 1 neu belegt, das Halsband (collar) ebenso (neuer Name, Zusatzsatz).
const ALBERS_V = {
  'V-01': [['„Nicht so laut. Die Laternen hören mit. Guck nicht hoch, dann wissen die, dass du’s weißt.“', 4400], ['„Bei mir vorm Haus sind sie mal ausgegangen, eine nach der anderen, wie Kerzen am Geburtstag. Nur dass keiner gesungen hat. Über die Kreuzung: Lampe aus.“', 6400]],
  'V-02': [['„Guck durch den Spalt. Den Kuli geb ich nicht raus. Siehst du das Auge unter dem Clip?“', 4400], ['„Die Bahn druckt einen Zug drauf, die Sparkasse ein S. Die hier drucken, dass sie gucken.“', 4600], ['„Damit hab ich unterschrieben. Ich hab das Auge nicht gesehen. Ich wollt’s nicht sehen.“', 4400]],
  'V-03': [['„UFO über dem Abgrund, stand in der Zeitung. Mit Fragezeichen, damit’s nicht so peinlich ist. Dann ein Experte: Sumpfgas.“', 5600], ['„Wir haben keinen Sumpf, Junge. Wir haben einen Weiher, und der ist gesperrt. Guck dir das Foto an der Tankstelle an. Nicht das UFO. Den Mann dahinter.“', 6600]],
  'V-05': [['„Hufeisen über jeder Tür. Frag, warum. Tradition, sagen die. Tradition heißt: Man hat vergessen, wovor man Angst hatte.“', 5600], ['„In der Chronik steht, der Schmied hat nach der Sache damals nie wieder ein Wort gesagt. Was schmiedet man, dass man danach die Klappe hält?“', 6000], ['„Eisen ist frei. Nimm eins mit. Nicht für mich. Für dich.“', 3400]],
  'V-06': [['„Nummer neun. Da wohnt keiner. Aber abends glüht da ein rotes Licht im Astloch.“', 4200], ['„Ich hab Butterbrotpapier in deren Tonne gefunden. Frisch. Gespenster schmieren keine Stullen, Junge.“', 5000], ['„Die filmen Hildes Haus. Die haben mehr Bilder von Hilde als Hilde von ihrem Kleinen.“', 4600]] };
// AP-26 (Bitte aus AP-25): V-03 und V-06 sind in Kap. 1 verpassbar (V-06 erst nach AG-02, V-03 erst nach Z-02) – Vegas holt sie später an der Tür nach
// (Kap. 3 an der Straße, Kap. 4/5 an der Haustür), damit „Das Schlimmste am Rechthaben“ abschließbar bleibt
ALBERS_TALKS.push(
  { id: 'V-06', when: () => kap() >= 3 && !albers_K1.v.has('V-06'), claim: 'v06', lines: ALBERS_V['V-06'] },
  { id: 'V-03', when: () => kap() >= 3 && !albers_K1.v.has('V-03'), claim: 'v03', lines: ALBERS_V['V-03'] });
// Behauptungen aus Kapitel 1 für „Das Schlimmste am Rechthaben“ (Häkchen, wenn der Beleg gefunden ist)
ALBERS_CLAIMS.push(
  { id: 'v01', text: '„Die Laternen hören mit.“', ok: () => !!state.ch1Done || kapAb(2) },
  { id: 'v02', text: '„Der Kuli vom Amt.“', ok: () => kapAb(2) && (typeof zimmer7_S === 'undefined' || story.lore.some(l => /stempel|zimmer7/i.test(l.key))) },
  { id: 'v03', text: '„Sumpfgas.“', ok: () => kapAb(4) && story.lore.some(l => /wolter|ag11|ag-11|z09/i.test(l.key)) },
  { id: 'v04', text: '„Der Vogel ist älter als ich.“', ok: () => kapAb(4) && typeof whiskey_S !== 'undefined' && !!whiskey_S.ring },
  { id: 'v05', text: '„Hufeisen.“', ok: () => kapAb(3) && !!ch3.lampsOff },
  { id: 'v06', text: '„Wer Stullen schmiert, ist kein Gespenst.“', ok: () => typeof post_S !== 'undefined' && !!post_S.steps.fenster },
  { id: 'bruno', text: '„Den hat einer rausgehoben.“', ok: () => kapAb(3) && !!ch3.met && story.lore.some(l => /nimmerheim|weiss|white/i.test(l.key)) });
// AP-26: Hinweise aus V-07 … V-13 als Behauptungen (85 Umsetzungsnotizen) – abgehakt, wenn der Beleg im Spiel gefunden ist
ALBERS_CLAIMS.push(
  { id: 'v07', text: '„Immer am Rand. Immer gleich alt.“', ok: () => kapAb(4) && typeof lwo_S !== 'undefined' && !!lwo_S.seen['ag:AG-14'] },
  { id: 'v08', text: '„Rate, wer h w ist.“', ok: () => !!albers_K3.st.daneben || story.lore.some(l => l.key === 'k3_hw') },
  { id: 'v09', text: '„Die Katzenfrau hat recht.“', ok: () => story.lore.some(l => l.key === 'beob_b_k3_01') },
  { id: 'v10', text: '„Gummistiefel? Dann ist es keiner.“', ok: () => typeof lwo_S !== 'undefined' && !!lwo_S.seen['ag:AG-10'] },
  { id: 'v11', text: '„Wer keinem in die Augen guckt, hat was im Schuppen.“', ok: () => typeof neben4_hat === 'function' && !!neben4_hat('post_ab') },
  { id: 'v12', text: '„Eine Flasche fehlt.“', ok: () => story.lore.some(l => l.key === 'ow_schichtbuch') }); // V-13 („Der Wald hat kein Echo“) belegt erst Kap. 6 – der Faden gilt für Kap. 1–5 (AP-25), daher keine Behauptung
const albers_K1 = { schritt: 0, v: new Set(), halsband: false, belohnt: false, saetze: false };
function albers_k1Save() { if (typeof saveGame === 'function' && state.started && !state.ending) try { saveGame(curChapter()); } catch (e) {} }
MOD_SAVE.push(['albers_k1', () => ({ schritt: albers_K1.schritt, v: [...albers_K1.v], halsband: albers_K1.halsband, belohnt: albers_K1.belohnt, saetze: albers_K1.saetze }),
  v => { if (!v) return; albers_K1.schritt = +v.schritt || 0; (v.v || []).forEach(x => albers_K1.v.add(x)); albers_K1.halsband = !!v.halsband; albers_K1.belohnt = !!v.belohnt; albers_K1.saetze = !!v.saetze; }]);
// AP-25 · „Das Schlimmste am Rechthaben“ über die Kapitel: Gesagtes und Belegtes speichern (sonst wiederholt Vegas sich nach dem Laden und Häkchen fehlen),
// Kap.-1-Sätze (albers_K1.v) und V-04 (Whiskeys Taufe, whiskey.js) zählen mit, Belege werden auch außerhalb der Kap.-3-Straße abgehakt (Kap. 4: Sumpfgas, Ring).
MOD_SAVE.push(['albers_faden', () => ({ talked: [...albers_S.talked], ok: [...albers_S.confirmed] }), v => { if (!v) return; (v.talked || []).forEach(x => albers_S.talked.add(x)); (v.ok || []).forEach(x => albers_S.confirmed.add(x)); }]);
function albers_fadenTick(dt) { const S = albers_S; if ((S.fadenT = (S.fadenT || 0) - dt) > 0) return; S.fadenT = 1.5; if (!state.started) return;
  for (const id of albers_K1.v) S.talked.add(id.toLowerCase().replace('-', '')); if (typeof whiskey_S !== 'undefined' && whiskey_S.vegas_taufe) S.talked.add('v04');
  if (S.talked.size && !(ch3.on && ch3.part === 'town') && story.side.albers_spinn && story.side.albers_spinn.state !== 'hidden') albers_claimCheck(); }
function albers_vHappen(id) { const K = albers_K1; K.v.add(id); albers_S.talked.add(id.toLowerCase().replace('-', '')); sideStart('albers_spinn'); story.lore.push({ key: 'albers_' + id, title: 'Vegas · ' + id, html: ALBERS_V[id].map(l => l[0]).join('\n') }); }
async function albers_k1Klopfen() {
  const S = albers_S, K = albers_K1; if (S.busy || state.talking) return; if (kap() !== 1) return; S.busy = true; state.talking = true; Audio.knock(); await wait(900); Audio.chains(S.door.x, 1.2, S.door.z); Audio.creak(.25); S.open = 1;
  const V = 'LARS VEGAS', sag = l => say(l.map(([t, ms]) => [t, ms, V]));
  try {
    if (!K.schritt) { K.schritt = 1; await sag([['„Wer da? … Der Brandt-Junge. Mach die Lampe aus, verdammt, die gucken.“', 4200], ['„Bruno ist weg. Zum Pinkeln raus und nicht wieder rein. Guck bei Reuters, wo das Haus war. Da hat er immer gebuddelt.“', 5600]]);
      kirchberg_start('bruno', { x: -13, z: -10 }); kirchberg_desc('bruno', 'Bruno ist weg. „Guck bei Reuters, wo das Haus war.“ (Nr. 5, der Aschekreis)'); await wait(500); await sag(ALBERS_V['V-01']); albers_vHappen('V-01'); }
    else if (state.hasCollar && !K.halsband) { K.halsband = true; story.items = story.items.filter(k => k !== 'collar');
      await sag([['„Die Schnalle ist zu. Der ist nicht weggelaufen. Den hat einer rausgehoben. Wie ’ne Katze aus ’nem Pulli.“', 5200]]);
      const a = await kirchberg_wahl(['„Wer hebt einen Hund aus dem Halsband?“', '„Vielleicht ist er dünner geworden.“']);
      await sag(a === 1 ? [['„Bruno? Dünner? Du hast Bruno nie gesehen.“', 3000]] : [['„Frag lieber, was.“', 2200]]); albers_S.talked.add('bruno');
      kirchberg_desc('bruno', 'Das Halsband ist zurück. Vegas redet. Klopf wieder, wenn du etwas getan hast.'); }
    else if (K.halsband) { // je Klopfen ein Happen: V-02, V-05, V-06 (nach AG-02), V-03 (nach Z-02), dann die zwei Sätze und die Belohnung
      const ag02 = typeof lwo_S !== 'undefined' && lwo_S.seen && Object.keys(lwo_S.seen).some(k => /AG-02/.test(k)), z02 = typeof sammeln_hatZ === 'function' && sammeln_hatZ(2);
      const next = ['V-02', 'V-05', ...(ag02 ? ['V-06'] : []), ...(z02 ? ['V-03'] : [])].find(v => !K.v.has(v));
      if (next) { await sag(ALBERS_V[next]); albers_vHappen(next); }
      if (!next || (K.v.has('V-02') && K.v.has('V-05') && !K.saetze)) { if (!K.saetze) { K.saetze = true; await sag([['„Unter allem, was beruhigt, steht ‚hw‘. Seit ich denken kann. Ich hab’s in Ordnern.“', 4400], ['„So lange schreibt kein Mensch dieselbe Beruhigung. Das ist ’ne Behörde mit Hut.“', 4200]]); await wait(600); await sag([['„Ich hab schon mal Kinder gezählt, Junge. Auf der Kreuzung. Frag nicht, wann.“', 4600]]); } }
      if (K.saetze && !K.belohnt) { K.belohnt = true; await sag([['„Nimm das Hufeisen nie ab, Junge. Frag nicht, warum. Doch, frag. Aber nicht heute.“', 4600], ['„Pfandgeld. Ehrlich verdient. Von Bruno.“', 2800]]);
        modItem('ring_hufeisen', 'Schlüsselring mit Hufeisen', 'Eisern. Von Vegas. „Nimm das Hufeisen nie ab.“', 'key'); addItem('ring_hufeisen'); modItem('euro_bruno', 'Eine Euromünze', 'Pfandgeld. Ehrlich verdient. Von Bruno.', 'paper'); addItem('euro_bruno');
        kirchberg_fertig('bruno', 'Die Schnalle war zu. Den hat einer rausgehoben. Unter allem, was beruhigt, steht „hw“.');
        S.open = 0; await wait(1400); porchLights[0] && (porchLights[0].dead = true); Audio.play('switch2', { gain: .3, x: S.door.x, y: 2.3, z: S.door.z + .5, ref: 2 }); await wait(700); subtitle('„Siehste.“', 2000, V); } // Schreck Stufe 1: Verandalampe geht aus, ohne Schalter
      else if (!next && K.belohnt) await sag([['„Ich hab gesagt, was ich weiß. Jetzt geh. Und mach die Lampe aus.“', 3600]]); }
    else await sag([['„Hast du Bruno gefunden? … Nein. Natürlich nicht. Guck bei Reuters.“', 3600]]);
  } finally { S.open = 0; Audio.play(Audio.pick('woodClose1', 'woodClose2'), { gain: .5, x: S.door.x, y: 1.2, z: S.door.z, ref: 3 }); state.talking = false; S.busy = false; albers_k1Save(); albers_claimCheck(); }
}
function albers_k1Halsband() { // Halsband im Aschekreis (Basis-Objekt), neuer Aufgabenname, Zusatzsatz, Lukes Frage
  if (state.hasCollar) return; state.hasCollar = true; Audio.chime(); addItem('collar'); kirchberg_start('bruno', { x: -13, z: -10 });
  liftTo(collar.parent || collar, () => { kirchberg_desc('bruno', 'Bring Vegas (Nr. 3) das Halsband.');
    openNote('Ein Hundehalsband', 'Rotes Leder, eine Messingmarke: <b>BRUNO · Vegas · Ahornstr. 3</b>\n\nEs liegt genau am Rand des verbrannten Kreises. Die Schnalle ist noch geschlossen. Das Leder ist nicht gerissen.', 'collar', () => subtitle('Wie kommt ein Hund aus einem geschlossenen Halsband?', 3400, 'LUKE')); }, false); }
function albers_k1Init() {
  const d = typeof doorOf !== 'undefined' && doorOf[3]; if (d) { const v45 = () => kap() >= 4 && ALBERS_TALKS.some(T => !albers_S.talked.has(T.claim) && T.when()); // AP-26: Kap. 4/5 (V-11 … V-13)
    d.userData.label = () => kap() === 1 || v45() ? 'An Vegas’ Tür klopfen' : 'Klopfen'; const alt = d.userData.action; d.userData.action = () => kap() === 1 ? albers_k1Klopfen() : v45() ? albers_talk() : alt(); }
  if (typeof collar !== 'undefined') { const alt = collar.userData.action; collar.userData.label = 'Halsband aufheben'; collar.userData.action = () => kap() === 1 ? albers_k1Halsband() : alt(); }
  }

// =====================================================================  Fassung 3 (AP-18): Kapitel 3 · „Rot eingekreist“ (Nr. 3, Lars Vegas; Wortlaut 31 Nr. 1)
// Nach AG-09 steht an Vegas’ Briefkasten die Fahne oben: Umschlag (Brief + Kapellenschlüssel) → Klopfen: Ordner in drei Stapeln durch den Kettenspalt →
// auf der Verandabank lesen (Verandalampe brennt): Ordnerrücken, Z-01, Z-10, Fotoseite → freiwillig: Kaugummipapier daneben legen → Fibel „(hw)“.
const albers_K3 = { st: {}, bank: null, bankHit: null, mbHit: null, fahne: null };
MOD_SAVE.push(['albers_k3', () => albers_K3.st, v => { if (v && typeof v === 'object') Object.assign(albers_K3.st, v); }]);
function albers_k3Frei() { return typeof neben3_frei === 'function' && neben3_frei() && (typeof lwo_S === 'undefined' || !!lwo_S.seen['ag:AG-09']); }
function albers_k3OrdnerBereit() { const st = albers_K3.st; return st.umschlag && !st.ordner && albers_k3Frei(); }
async function albers_k3Init() {
  const T = THREE, D = albers_S.door, MB = [-26.55, -6.72];
  // Fahne oben + Umschlag, der oben aus dem Kasten ragt (Abziehbild); eigene Klickfläche vor der Kasten-Klickfläche aus strasse.js
  albers_K3.fahne = kirchberg_decal(kirchberg_tex(kirchberg_cnv(64, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#b2261c'; x.fillRect(8, 6, w - 16, 46); x.fillStyle = '#6a6a66'; x.fillRect(w / 2 - 4, 40, 8, h - 44); })), .1, .2, MB[0] + .26, 1.32, MB[1], PI / 2, { alpha: true, double: true });
  albers_K3.umschlag = kirchberg_decal(kirchberg_papier({ w: 256, h: 128, bg: '#d9cfb4', flecken: 1, zeilen: [['FÜR DEN BRANDT-JUNGEN.', 10, 50, 24, 'rgba(20,30,90,.9)'], ['PERSÖNLICH. NICHT DAS AMT.', 10, 92, 22, 'rgba(20,30,90,.9)']] }), .22, .11, MB[0], 1.21, MB[1] + .02, 0, { rx: -.4 });
  albers_K3.fahne.visible = albers_K3.umschlag.visible = false;
  albers_K3.mbHit = kirchberg_hit(.55, .5, .55, MB[0], 1.15, MB[1] + .05, 'Umschlag im Briefkasten', () => albers_k3Umschlag()); kirchberg_an(albers_K3.mbHit, false);
  // Verandabank vor Nr. 3 (Scan „parkbench“), Klickfläche für das Lesen und „Daneben legen“
  const b = await kirchberg_mod('parkbench', 'model.glb', 1.5, 'x'); const bx = D.x + 1.85, bz = D.z + 1.25; if (b) { const gy = kirchberg_boden(bx, bz, 1.2); kirchberg_setze(b, bx, gy, bz, PI); albers_K3.bank = b; }
  albers_K3.bankHit = kirchberg_hit(1.4, .8, .8, bx, .8, bz, () => albers_K3.st.gelesen && story.items.includes('kaugummipapier') && !albers_K3.st.daneben ? 'Daneben legen' : 'Auf der Bank lesen', () => albers_k3Bank()); kirchberg_an(albers_K3.bankHit, false);
  ALBERS_CLAIMS.push({ id: 'hw', text: '„Unter allem, was beruhigt, steht ‚hw‘.“', ok: () => !!albers_K3.st.gelesen }); }
function albers_k3Tick() { const K = albers_K3, st = K.st, frei = albers_k3Frei(); if (!K.mbHit) return;
  const mb = frei && !st.umschlag; if (K.fahne.visible !== mb) { K.fahne.visible = mb; K.umschlag.visible = mb; kirchberg_an(K.mbHit, mb); }
  const bank = frei && st.ordner && (!st.gelesen || (story.items.includes('kaugummipapier') && !st.daneben)); if (K.bankOn !== bank) { K.bankOn = bank; kirchberg_an(K.bankHit, bank); }
  if (st.gelesen && !albers_S.talked.has('hw')) albers_S.talked.add('hw'); }
function albers_k3Umschlag() { const st = albers_K3.st; if (st.umschlag) return; st.umschlag = 1; neben3_start('k3_rot', { x: -28, z: -8 }); Audio.paper();
  openNote('Ein dicker Umschlag', 'Kuli: <b>„FÜR DEN BRANDT-JUNGEN. PERSÖNLICH. NICHT DAS AMT.“</b>\n\nDarin ein Brief und ein großer Eisenschlüssel mit Kordel.', 'k3_vegas_umschlag');
  openNote('Vegas’ Brief', '<i>Kariertes Papier, Kuli, Fettfleck.</i>\n\n<span class="hand">Junge. Ich sag das nicht durch die Tür, die hören mit.\nDer Schlüssel ist von der Kapelle. Hab ich eingesteckt, als der Pfarrer in den Nebel ist, damit die vom Amt da nicht auch noch rumwühlen.\nGuck dir das Fenster an, bevor die es rausbrechen. Da ist alles drauf.\nIch hab für Mike unterschrieben. Das weißt du jetzt. Frag nicht, wie das war.\nL. V. — PS: Der Vogel kriegt nix von meinem Speck, auch wenn er dich schickt.</span>', 'k3_vegas_brief', () => {
    modItem('n3_kapschluessel', 'Kapellenschlüssel', 'Ein großer Eisenschlüssel mit Kordel. Kapellentür und das Gitter der Martinsnische.', 'key'); addItem('n3_kapschluessel'); if (typeof kirchberg_oeffne === 'function') kirchberg_oeffne('kapelle');
    neben3_desc('k3_rot', 'Vegas hat einen Ordner. Klopf an seine Tür.'); neben3_save(); }); }
async function albers_k3Ordner() { const S = albers_S, st = albers_K3.st; S.busy = true; state.talking = true; const V = 'LARS VEGAS';
  try { Audio.knock(); await wait(900); Audio.chains(S.door.x, 1.2, S.door.z); Audio.creak(.25); S.open = 1; await wait(700);
    await say([['„Der passt nicht.“', 2200, V], ['„Dann machen Sie die Kette ab.“', 2600, 'DU'], ['„Nachts? Bist du bekloppt?“', 2600, V]]);
    for (let i = 0; i < 3; i++) { Audio.play('metalOpen', { gain: .15, rate: 2.2, x: S.door.x, y: 1.1, z: S.door.z, ref: 2 }); await wait(500); Audio.paper(); await say([[['„Das hier, Wetterballon, von wegen.“', '„Nicht knicken!“', '„Inhaltsverzeichnis. Das brauchst du zuerst.“'][i], i === 1 ? 1700 : 2600, V]]); await wait(300); } // Slapstick S-02 (85 §11)
    if (typeof spannung_pause === 'function') spannung_pause('S-02');
    st.ordner = 1; modItem('n3_ordner', 'Vegas’ Ordner', '„DIE WAHRHEIT · BAND 3 · NICHT ANFASSEN“, mit Alufolie beklebt. In drei Stapeln durch den Kettenspalt.', 'paper'); addItem('n3_ordner');
    neben3_desc('k3_rot', 'Auf Vegas’ Verandabank lesen. Die Verandalampe brennt.'); if (porchLights[0]) porchLights[0].dead = false; Audio.play('switch2', { gain: .3, x: S.door.x, y: 2.3, z: S.door.z + .5, ref: 2 }); }
  finally { S.open = 0; Audio.play(Audio.pick('woodClose1', 'woodClose2'), { gain: .5, x: S.door.x, y: 1.2, z: S.door.z, ref: 3 }); state.talking = false; S.busy = false; } }
function albers_k3Ordnerseite(title, html, key) { return new Promise(r => openNote(title, html, key, r)); }
async function albers_k3Bank() { const st = albers_K3.st, D = albers_S.door; if (state.talking) return;
  if (st.gelesen) return albers_k3Daneben();
  if (porchLights[0]) porchLights[0].dead = false;
  const zH = nr => typeof sammeln_zHtml === 'function' ? sammeln_zHtml(nr) : '';
  if (typeof sammeln_z === 'function') { sammeln_z(1, true); sammeln_z(10, true); }
  await albers_k3Ordnerseite('Vegas’ Ordner', 'Ordnerrücken: <b>„DIE WAHRHEIT · BAND 3 · NICHT ANFASSEN“</b>, mit Alufolie beklebt.\n\nIn jedem Artikel ist das „(hw)“ rot eingekreist. Seit Jahrzehnten.', 'k3_vegas_ordner');
  // Humor: Whiskey zupft ein Stück Alufolie vom Ordnerrücken und fliegt damit auf die Laterne
  if (typeof whiskey_S !== 'undefined' && whiskey_S.g && typeof whiskey_setzen === 'function' && !st.folie) { st.folie = 1; try { Audio.flap(D.x + 1.8, 1.2, D.z + 1.3); whiskey_setzen(D.x + 3.4, 3.1, D.z + 3.2); } catch (e) {} setTimeout(() => albers_whiskey([['„Das ist Beweismaterial!“', 2600]]), 1600); }
  await albers_k3Ordnerseite('Der Laternenbote · rot eingekreist', `${zH(1)}<div class="hand" style="color:#9a1010;margin-top:8px">(hw) – rot eingekreist.</div>`, null);
  // Schreck 1: die Hecke raschelt, während Luke liest
  Audio.play('woodCrack', { gain: .14, rate: 1.7, lp: 1300, x: D.x + 4.2, y: .8, z: D.z + 2.6, ref: 2 }); setTimeout(() => Audio.play('woodCrack', { gain: .1, rate: 1.9, lp: 1100, x: D.x + 4.8, y: .7, z: D.z + 3.1, ref: 2 }), 700);
  await wait(1500); await say([['„Junge. Wenn das ein Igel ist, ist das ein großer Igel.“', 3600, 'LARS VEGAS (DRINNEN, LEISE)']]);
  await albers_k3Ordnerseite('„Aus aller Welt“', `${zH(10)}<div class="hand" style="color:#9a1010;margin-top:8px">Jede Meldung rot umkreist. Die Lagune zusätzlich gelb.<br>SIEHST DU? ÜBERALL.</div>`, null);
  await albers_k3Ordnerseite('Fotoseite', '<i>Drei ausgeschnittene Zeitungsfotos, aufgeklebt: Bergung am Abgrund, Kinder auf der Kreuzung, Hilde mit Blumenstrauß. Am Rand jedes Fotos derselbe Mann im Mantel, jedes Mal rot umkringelt.</i>\n\n<span class="hand" style="color:#9a1010">DERSELBE!!! Auf allen dreien!!! Der wird nicht älter.\nHab’s dem Kühn gezeigt. Kühn sagt: Brille putzen, Lars.\nHab die Brille geputzt. DERSELBE.</span>', 'k3_vegas_fotoseite');
  st.gelesen = 1; if (typeof neben3_merk === 'function') neben3_merk('ordner');
  neben3_fertig('k3_rot', 'Vegas hat die ganze Zeit einen Mann eingekreist, dessen Namen er nicht kannte.'); albers_claimCheck();
  if (story.items.includes('kaugummipapier')) setTimeout(() => { const q = story.side.k3_rot; if (q) q.desc = 'Das Kaugummipapier von der Bushaltestelle. Neben das Foto legen?'; }, 400); } // AP-25: neben3_desc greift bei erledigten Aufgaben nicht
function albers_k3Daneben() { const st = albers_K3.st; if (st.daneben || !story.items.includes('kaugummipapier')) return; st.daneben = 1;
  openNote('Daneben gelegt', 'Das Kaugummipapier neben dem Foto: das Auge auf dem Papier. Und im Artikel, klein unter dem BfR-Stempel, dasselbe Auge.', null, async () => {
    await say([['‚Wolter. Ich schreibe für das Blatt hier.‘ … Der schreibt die Beruhigung gleich selber.', 5200, 'LUKE']]);
    if (!story.lore.some(l => l.key === 'k3_hw')) story.lore.push({ key: 'k3_hw', title: '(hw)', html: '<span class="hand">hw. Wolter. Der Mann an der Bushaltestelle steht auf Fotos, die älter sind als Mama. Und er schreibt, dass alles in Ordnung ist.</span>' });
    questPop('ABENTEUERFIBEL', '(hw)'); neben3_save(); }); }
