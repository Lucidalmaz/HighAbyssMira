// =====================================================================  AUSRÜSTUNG (Modul „ausruestung“)
// Fundorte für Batterien, Werkzeuge und Taschenlampen-Stufen an echten Möbeln/Orten der Welt (nichts Selbstgebautes sichtbar:
// gefunden wird durch Durchsuchen von Werkbank, Tresen, Regal; der Rest sind Scan-Modelle). Lampenlogik/Akku: Grundspiel (FLASH).
// Wo später Unreal-Modelle aus unreal/Export_Requisiten.bat vorliegen (assets/ue/<rolle>/model.glb), liegen sie sichtbar am Fundort.
// Werkzeug-Einsätze: Drahtschneider → Villentor (ausbau_ost_west) · Brechstange → Zeichnungswand Keller Nr. 7 (Übergang Kap. 2).
const ausruestung_S = { taken: new Set(), ue: {} };
// Unreal-Export (optional): lädt assets/ue/<rolle>/model.glb, sonst null
async function ausruestung_ue(role, size) {
  try { const g = await msModel('../ue/' + role, 'model.glb'); const o = msGround(msFit(g.clone(true), size, 'max')); o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); o.userData.noCol = true; return o; }
  catch (e) { return null; }
}
// Durchsuchbare Stelle: unsichtbare Klickfläche an einem echten Möbel; einmalig, danach nur noch Beschreibung
function ausruestung_spot(id, [w, h, d], [x, y, z], label, found, empty, give, model) {
  const m = box(w, h, d, x, y, z, hidden, { cast: false });
  interact(m, () => ausruestung_S.taken.has(id) ? label : label + ' durchsuchen', () => {
    if (ausruestung_S.taken.has(id)) return toast(empty, 3200);
    const r = give(); if (r === false) return; // Bedingung nicht erfüllt: give() hat selbst erklärt
    ausruestung_S.taken.add(id); if (model) model.visible = false; toast(found, 4200); Audio.play(Audio.pick('woodHit1', 'woodHit2'), { gain: .25, rate: 1.3, x, y, z, ref: 2 });
  });
  return m;
}
WORLD_MODS.push(['Ausrüstung', async () => {
  const S = ausruestung_S;
  // --- Nr. 7, Hauswirtschaftsraum: Werkbank (Hildes). Brechstange + Batterie. Die Kerzen am anderen Ende gehören innen_ort.
  const crow = await ausruestung_ue('brechstange', .75); if (crow) { crow.rotation.set(0, .3, PI / 2); crow.position.set(26.5, Y + .95, -20.75); scene.add(crow); }
  ausruestung_spot('nr7_bank', [.55, .3, .9], [26.45, Y + 1.05, -20.7], 'Werkbank',
    'Unter Lappen und Drahtrollen: eine Brechstange. An der Spitze Kalkstaub – frisch. Und eine Batterie, mit Klebeband an den Griff gewickelt.',
    'Lappen, Drahtrollen, ein Zollstock, bei 1,31 m abgebrochen.', () => { addItem('brechstange'); addBattery(1); }, crow);
  // --- Tankstelle Kranz (Ost): Tresen-Schublade, Regal links, Ladegerät mit Handscheinwerfer (Kap. 3) im Regal rechts
  ausruestung_spot('tank_tresen', [.9, .35, .5], [109.4, 1.0, 25.6], 'Schublade unter dem Tresen',
    'Quittungsblöcke, Kaugummis von 2009, ein Päckchen Batterien. Zwei sind noch gut.', 'Quittungsblöcke. Auf dem obersten: „Luke – 31.10. – offen“.', () => addBattery(2));
  ausruestung_spot('tank_regal', [1.1, 1.6, .5], [108, 1.0, 30.0], 'Regal',
    'Motoröl, Scheibenfrost, eine Blisterpackung Batterien hinter den Dosen.', 'Motoröl, Scheibenfrost. Eine Dose ist innen voller Milchzähne.', () => addBattery(1));
  const spot3 = await ausruestung_ue('lampe3', .42); if (spot3) { spot3.position.set(116.3, 1.02, 30.15); spot3.rotation.y = PI; scene.add(spot3); }
  const chargeLed = new VLight(0x40ff60, 0, 1.2, 2); chargeLed.position.set(116.3, 1.25, 30.1); scene.add(chargeLed); S.led = chargeLed;
  ausruestung_spot('tank_lampe3', [.9, .6, .5], [116.3, 1.15, 30.0], 'Ladegerät',
    'Der Handscheinwerfer im Ladegerät ist voll geladen. Die Tankstelle hat seit Jahren keinen Strom.',
    'Das Ladegerät ist leer. Die grüne Lampe leuchtet trotzdem weiter.',
    () => { if (!ch3.on) { toast('Ein Feuerwehr-Handscheinwerfer steckt in einem Ladegerät. Der Akku ist tot. Die Ladelampe ist aus.', 4200); return false; } flashUpgrade(2); }, spot3); // STORY-HOOK: wer lädt ihn?
  // --- Kapitel 2: Keramiksicherung im Archiv (Aktenschrank); ohne sie hat der Sicherungskasten einen leeren Steckplatz
  ausruestung_spot('c2_sicherung', [.9, .5, .3], [C2.x + 28, 1.05, C2.z - 5.2], 'Aktenschrank',
    'Zwischen den Hängeregistern, mit Klebeband umwickelt: eine alte Keramiksicherung. Auf dem Band, in Kinderschrift: „RAUM 7“.',
    'Hängeregister, alphabetisch. Bei „B“ fehlt ein Name. Nur der Reiter ist noch da.', () => addItem('sicherung'));
  { const orig = fuseOpenPanel; fuseOpenPanel = function (...a) {
      if (!ch2.power && !S.fuseIn) { if (!story.items.includes('sicherung')) return toast('Sechs Kreise, sechs Hebel – und ein leerer Steckplatz für die Hauptsicherung. 25 Ampere, Keramik. Ohne sie rührt sich nichts.', 5200);
        S.fuseIn = true; story.items = story.items.filter(k => k !== 'sicherung'); Audio.play('switch1', { gain: .6, x: C2.x + 33, y: 1.5, z: C2.z + 7.8, ref: 2 }); toast('Du drehst die Sicherung ein. Irgendwo im Beton tickt ein Relais.', 3400); }
      return orig.apply(this, a); }; }
  // --- Villa-Gelände (hinter dem Tor, erst mit Drahtschneider): Kerzenkreis auf dem Kiesweg
  try {
    const cs = await msFBX('candles', 'model.fbx', { Used_candles: { b: 'Used_candles_BaseColor.jpg', n: 'Used_candles_Normal.jpg', r: 'Used_candles_Roughness.jpg' }, Candles_new: { b: 'Candles_new_BaseColor.jpg', n: 'Candles_new_Normal.jpg', r: 'Candles_new_Roughness.jpg' }, Extra_for_candles: { b: 'Extra_for_candles_BaseColor.jpg', r: 'Extra_for_candles_Roughness.jpg' } });
    for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2, c = msGround(msFit(cs.clone(true), .22, 'y')); c.traverse(m => { if (m.isMesh) m.castShadow = true; }); c.userData.noCol = true; c.position.set(-125 + Math.cos(a) * .7, 0, 61.5 + Math.sin(a) * .7); c.rotation.y = a * 3; scene.add(c); }
    const glow = new VLight(0xffa860, 1.1, 5, 2); glow.position.set(-125, .5, 61.5); scene.add(glow);
  } catch (e) { console.warn('Ausrüstung: Kerzen', e); }
  ausruestung_spot('villa_kreis', [1.8, .5, 1.8], [-125, .25, 61.5], 'Kerzenkreis',
    'Sieben Kerzen, alle brennen. In der Mitte, sorgfältig gestapelt: vier Batterien. Als hätte jemand gewusst, dass du im Dunkeln kommst.',
    'Die Kerzen brennen weiter. Keine ist kürzer geworden.', () => { addBattery(4); Audio.whisper(-125, 1.2, 64, 1.6); }); // STORY-HOOK: Mira legt Dinge bereit
}]);
WORLD_TICK.push((dt, t) => { const S = ausruestung_S; if (S.led) S.led.intensity = ch3.on && !S.taken.has('tank_lampe3') ? .35 + Math.sin(t * 3) * .15 : 0; });
