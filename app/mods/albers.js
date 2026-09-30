// =====================================================================  VEGAS (Modul „albers“): Lars Vegas, Nr. 3 (Fassung 3: Kap. 1, 3, 4, 5; hier die Gespräche aus Kap. 3)
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
  { id: 't1', when: () => true, claim: 'laternen', lines: [
    ['„Nicht so laut, Junge. Die hören mit.“', 3000], ['„Die Laternen. Hast du\'s gesehen? Die atmen. Die zählen mit Licht, seit fünfundsiebzig.“', 4600],
    ['„Wenn du über die Kreuzung musst: Lampe aus. Frag nicht. Mach einfach.“', 3800]] },
  { id: 't2', when: () => ch3.met, claim: '1312', lines: [
    ['„Du hast ihn gesehen. Den Blecheimer. Ich riech\'s an dir – Rost und Schnee.“', 4200], ['„Der ist älter als die Kapelle. Dreizehnhundertzwölf. Steht alles in der Chronik, aber die liest ja keiner.“', 5000],
    ['„Der Pfarrer hat gesagt, ich trink zu viel. Der Pfarrer ist zweiundneunzig in den Nebel gegangen.“', 4600]] },
  { id: 't3', when: () => ch3.met && story.items.includes('buch'), claim: 'siebzehn', lines: [
    ['„Hildes Buch. Die hat alles gezählt, die alte Krähe. Und keiner hat ihr geglaubt. Mir auch nicht.“', 4800], ['„Rechne nach, Junge. Alle siebzehn Jahre.“', 3400],
    ['„Und dieses Jahr ist wieder so eins.“', 3000]] },
  { id: 't4', when: () => ch3.met && ch3.radio, claim: 'funk', lines: [
    ['„Einunddreißig-zehn. Hab ich\'s nicht gesagt? Die senden. Die haben nie aufgehört.“', 4400], ['„Das Amt, Junge. Ebene minus zwei. Stühle mit Riemen. Ich hab fünfundsiebzig auf so einem gesessen.“', 5000],
    ['„Du auch. Ich seh\'s dir an.“', 2800]] },
  { id: 't5', when: () => ch3.lampsOff || (ch3.radio && story.items.includes('buch')), claim: 'augen', lines: [
    ['„Wenn du da reingehst: Zähl nicht mit. Egal, was sie dir vorsagt.“', 4000], ['„Ich hab euch zweitausendneun auf der Kreuzung gezählt. Sieben, hab ich gesagt. Gott sei Dank.“', 4800],
    ['„Aber du, Junge … bis zu dem Sommer hattest du blaue Augen. Ich kenn dich, seit du laufen kannst.“', 4200]] }];
function albers_claimCheck() {
  const q = story.side.albers_spinn; if (!q) return;
  for (const c of ALBERS_CLAIMS) if (albers_S.talked.has(c.id) && !albers_S.confirmed.has(c.id) && c.ok()) { albers_S.confirmed.add(c.id); questPop('VEGAS HATTE RECHT', c.text); Audio.chime(); }
  q.desc = ALBERS_CLAIMS.filter(c => albers_S.talked.has(c.id)).map(c => (albers_S.confirmed.has(c.id) ? '✓ ' : '? ') + c.text).join('\n') || q.desc;
  if (albers_S.confirmed.size === ALBERS_CLAIMS.length && q.state !== 'done') { sideDone('albers_spinn'); // STORY-HOOK: Vegas glaubwürdig – er kann im Finale gebraucht werden
    setTimeout(() => openNote('Lars Vegas hatte recht', 'Die Laternen. Der Ritter von 1312. Die siebzehn Jahre. Die Sender. Deine Augen.\n\nAlles, worüber im Ort gelacht wurde, stimmt.\n\n<span class="hand">Das Schlimmste am Rechthaben, hat er gesagt, ist, dass es keiner hören will.</span>', 'albers_recht'), 1600); }
}
async function albers_talk() {
  const S = albers_S; if (S.busy || state.talking) return;
  const next = ALBERS_TALKS.find(T => !S.talked.has(T.claim) && T.when());
  S.busy = true; state.talking = true; Audio.chains(S.door.x, 1.2, S.door.z); Audio.creak(.25); S.open = 1;
  if (next) {
    await say(next.lines.map(([t, ms]) => [t, ms, 'LARS VEGAS']));
    S.talked.add(next.claim); story.lore.push({ key: 'albers_' + next.id, title: 'Vegas an der Tür', html: next.lines.map(l => l[0]).join('\n') });
    sideStart('albers_spinn'); albers_claimCheck();
    if (!ALBERS_TALKS.some(T => !S.talked.has(T.claim) && T.when())) setTimeout(() => subtitle('Die Kette rasselt. Die Tür geht zu. Drinnen ist es still. Kein Hund, der knurrt. Nicht mehr.', 4200), 600);
  } else await say([[S.talked.size >= ALBERS_TALKS.length ? '„Ich hab gesagt, was ich weiß. Jetzt geh. Und mach die Lampe aus.“' : '„Geh weg. Komm wieder, wenn du was gesehen hast. Dann reden wir.“', 3800, 'LARS VEGAS']]);
  S.open = 0; Audio.play(Audio.pick('woodClose1', 'woodClose2'), { gain: .6, x: S.door.x, y: 1.2, z: S.door.z, ref: 3 }); state.talking = false; S.busy = false;
}
WORLD_MODS.push(['Vegas', async () => {
  const S = albers_S, D = S.door;
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
  const S = albers_S; if (!ch3.on || ch3.part !== 'town') { if (S.on) { S.on = false; uninteract(S.hit); } return; }
  if (!S.on) { S.on = true; if (!interactables.includes(S.hit)) interactables.push(S.hit); for (const T of ALBERS_TALKS) if (story.lore.some(l => l.key === 'albers_' + T.id)) S.talked.add(T.claim); } // nach Laden: geführte Gespräche wiederherstellen
  const P = player.pos, d = Math.hypot(P.x - S.door.x, P.z - S.door.z);
  if (!S.hissed && d < 9 && !state.talking && +document.getElementById('subtitle').style.opacity < .05) { S.hissed = true; subtitle('<i>„Psst! Junge! Hierher. Leise, verdammt!“</i> – aus dem Türspalt von Nr. 3.', 4200); Audio.whisper(S.door.x, 1.5, S.door.z, 1.2); }
  // Spalt auf/zu: Licht und Figur weich ein- und ausblenden, Taschenlampen-Zittern
  S.t += ((S.open ? 1 : 0) - S.t) * Math.min(1, dt * 4); S.light.intensity = S.t * (.9 + Math.sin(t * 13) * .05); S.beam.intensity = S.t * (1.4 + Math.sin(t * 7.3) * .15 + Math.sin(t * 17) * .06);
  if (S.fig) { S.fig.visible = S.t > .05; if (S.fig.visible) { const want = state.talking && S.act.talk ? S.act.talk : S.act.idle;
      if (want && want !== S.cur) { want.reset().fadeIn(.3).play(); if (S.cur) S.cur.fadeOut(.3); S.cur = want; } S.mx.update(dt);
      const a = Math.atan2(P.x - S.fig.position.x, P.z - S.fig.position.z); S.fig.rotation.y += Math.atan2(Math.sin(a - S.fig.rotation.y), Math.cos(a - S.fig.rotation.y)) * Math.min(1, dt * 3); } }
  S.chk = (S.chk || 0) - dt; if (S.chk < 0) { S.chk = 1; if (S.talked.size) albers_claimCheck(); }
});
