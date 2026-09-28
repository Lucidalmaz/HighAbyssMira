// =====================================================================  AKTE (Modul „akte“): Die Akte Abgrund – die Durchschläge der Whistleblowerin
// Dr. Edda Brand, 1994–2012 Ärztin der Außenstelle Lost Eyengless der Bundesstelle für Rückführung (BfR, im Ort „das Amt“), hat vor der Auflösung
// zehn Durchschläge versteckt – dort, wo Kinder spielen und Erwachsene nicht hinsehen. Sie erzählen, was die Regierung geheim hält:
// den Vertrag von 1958, die gefälschte UFO-Schlagzeile, die Bergungen nicht menschlicher Wesen in den Zyklusnächten, die Rückläufer (Kopien),
// Peter Kranz und die Versuchsreihe K (der Zahn-Mann aus Kapitel 2), die Sperre von 2009, Akte 08 – und das Ende 2012.
// Nebenstory zum Erkunden (Nebenaufgabe „Die Akte Abgrund“); jeder Durchschlag ist ein Fund, alle zehn geben die ganze Geschichte und eine Belohnung.
const AKTE_S = { ready: false, docs: [], placed: false };
const AKTE = [ // [Nr, Titel, Ort (Anker: x, yProbe, z | Funktion), Text]
  [1, 'Wer das findet', () => [22.6, 1.2, 69.2], 'Wenn du das liest, hat niemand aufgeräumt. Gut.\n\nIch heiße Edda Brand. Von 1994 bis 2012 war ich Ärztin der Außenstelle Lost Eyengless der Bundesstelle für Rückführung. Offiziell hat es diese Stelle nie gegeben.\n\nIch lege zehn Durchschläge aus. Dort, wo Kinder spielen und Erwachsene nicht hinsehen. Lies sie alle. Dann entscheide selbst, ob du Angst haben willst.'],
  [2, '1958 · Verwalten, nicht beseitigen', () => [-45.8, 1.2, 90.4], 'Aktenvermerk, Bonn 1958, Abschrift:\n„Das Phänomen Abgrund ist nicht zu beseitigen, sondern zu verwalten.“\nGegengezeichnet: Dr. Theodor Seiler, Leiter der Außenstelle.\n\nAls Anlage der Sühnevertrag eines Ritters von 1313, übersetzt. Die Bundesrepublik hat einen Vertrag aus dem Mittelalter übernommen.\n\nRückführung heißt nicht Rettung. Rückführung heißt: Wir holen ab, was zurückkommt – und wir schreiben auf, ob es ein Mensch ist.'],
  [3, '1975 · Die UFO-Schlagzeile', () => [112.2, 1.2, 23.4], '„UFO über dem Abgrund“ – die Schlagzeile von 1975 stammt von uns. Seiler hat sie der Lokalzeitung diktiert.\n\nWer von Ufos redet, wird ausgelacht. Wer ausgelacht wird, fragt nicht nach sieben Kindern.\n\nPeter Kranz kam drei Tage später zurück. Mit braunen Augen statt blauen. Seine Mutter hat es bemerkt. Wir haben ihr gesagt, das komme vom Schock.'],
  [4, 'Die Bergungen', () => [-129.2, 1.2, -23.6], 'In jeder Zyklusnacht geht ein Bergungstrupp an den Abgrund. Nicht alles, was dort herauskommt, ist ein Kind.\n\n1975: vier Kühe ohne Augen, glatte Ränder. Eine Kirchenglocke, die zwei Tage nicht aufhört zu schwingen.\n1992: ein Hund, der nur rückwärts läuft. Und Gefreiter Hofer aus dem Trupp, der mit einem Gesicht zurückkam, das seine Frau nicht kannte.\n\nIm Protokoll steht: „auf eigenen Wunsch versetzt“. Ich habe seine Akte gesehen. Da ist kein Wunsch drin. Nur Maße.'],
  [5, 'Die Rückläufer', () => [-110.4, 1.2, 27.8], 'Intern heißen sie R-Fälle. Rückläufer.\n\nSie essen, schlafen, lieben ihre Eltern. Sie bluten. Aber sie werden nie krank, und wenn im Radio 31,10 rauscht, zählen sie im Schlaf leise mit.\n\nDienstanweisung 4: beobachten, nicht aufklären. Wer weiß, was er ist, den holt sie zurück. Das haben wir 1992 gelernt.'],
  [6, '1992 · Kranz', () => [127.6, 1.2, -27.2], 'Peter Kranz hat 1992 seine eigene Akte gelesen. Jemand hat sie ihm gegeben. Ich weiß bis heute nicht, wer.\n\nIn derselben Nacht hat das Licht ihn geholt und zurückgegeben – so, wie ein Kind sich an ihn erinnert hat: Lachen und Zähne.\n\nDas Amt hat ihn nicht getötet. Man tötet keine Beweise. Man sperrt sie in den unteren Gang.'],
  [7, 'Versuchsreihe K', () => (typeof C2 !== 'undefined' ? [C2.x + 86.1, 1.2, C2.z - 1.1] : null), 'Versuchsreihe K, 1994–2011. Ziel: den Rückläufer „zurückübersetzen“, um den Verbleib des Originals zu erfahren. Licht, Kälte, Tonbänder mit der Stimme seiner Schwester Marion.\n\nErgebnis 41: Er hat meine Hand gehalten und „Bruder“ gesagt.\nErgebnis 212: Er hat seine Zähne gezählt, bis sie bluteten.\n\nAm 3. März 2011 hat er das Gitter aus der Wand gerissen. Zwei Pfleger. Offiziell: ein Gasleck.\nEr sucht keine Opfer. Er sucht den Ausgang.'],
  [8, '2009 · Die Sperre', () => [61.6, 1.2, 146.4], 'Wir kannten das Datum. Siebzehn Jahre, auf den Tag.\n\nAm 27. Juli wollten Familien wegfahren. Die Südsperre stand da schon: „Unwetterwarnung“. Wer durchbrechen wollte, blieb stehen. Die weißen Autos da draußen sind keine Unfälle.\n\nAnweisung aus Berlin: Beobachtung statt Evakuierung. Sieben Kinder.\nIch habe die Anweisung abgezeichnet. Ich schreibe es auf, weil ich es nicht mehr ungeschrieben machen kann.'],
  [9, 'Akte 08', () => (typeof TIEF !== 'undefined' ? [TIEF.stand.x - .5, 3.9, TIEF.stand.z + .4] : null), 'Am 5. August 2009 um 03:13 kamen sechs zurück. Einer von ihnen war nicht der, der gegangen war.\n\nDer Ritter hat es nicht gemerkt. Wir schon: eine andere Blutgruppe als vorher. In der linken Hand eine halbrunde Narbe, die er vorher nicht hatte.\n\nWir haben ihm eine Nummer gegeben – 08 – und seiner Mutter nichts gesagt.\n\nWenn du Luke heißt: Es tut mir leid. Du bist trotzdem jemand.'],
  [10, '2012 · Die Auflösung', () => (typeof ANW_HALL !== 'undefined' ? [ANW_HALL.x + 5.6, 1.2, ANW_HALL.z - 3.4] : null), 'Heute wird die Außenstelle aufgelöst. Die Akten gehen nach unten, zu den Wassern, dorthin, wo nichts gefunden wird.\n\nSeiler weigert sich, die Schlüssel abzugeben. Er sagt, 2026 komme jemand, und dann solle wenigstens einer die Wahrheit finden können. Acht Schlösser, wie die acht Akten.\n\nIch fahre heute Nacht nach Hamburg, zu einer Zeitung. Wenn du nie etwas davon gehört hast, bin ich nicht angekommen.\n\n— E. B., 19. November 2012'],
];
const akte_has = n => story.lore.some(l => l.key === 'akte_' + n);
const akte_n = () => AKTE.filter(a => akte_has(a[0])).length;
function akte_tex() { return tex(cnv(256, (c, w) => { c.fillStyle = '#b89a6a'; c.fillRect(0, 0, w, w); for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(60,40,20,${rand(.03, .12)})`; c.fillRect(rand(0, w), rand(0, w), rand(4, 40), rand(2, 10)); }
  c.fillStyle = '#efe8d8'; c.fillRect(30, 18, 196, 60); c.fillStyle = '#2a2a2a'; c.font = 'bold 22px Courier New'; c.textAlign = 'center'; c.fillText('BfR · AST LE', w / 2, 44); c.font = '16px Courier New'; c.fillText('DURCHSCHLAG', w / 2, 66);
  c.save(); c.translate(w / 2, 160); c.rotate(-.18); c.strokeStyle = 'rgba(170,30,25,.85)'; c.lineWidth = 5; c.strokeRect(-92, -26, 184, 52); c.fillStyle = 'rgba(170,30,25,.85)'; c.font = 'bold 28px Courier New'; c.fillText('VERTRAULICH', 0, 10); c.restore(); }), true); }
WORLD_MODS.push(['Die Akte Abgrund', async () => {
  const S = AKTE_S, mat = new THREE.MeshStandardMaterial({ map: akte_tex(), roughness: .85 });
  for (const [n, title, at] of AKTE) { const p = at(); if (!p) continue; const m = new THREE.Mesh(new THREE.BoxGeometry(.24, .012, .32), mat); m.position.set(p[0], .02, p[2]); m.rotation.y = rand(-.6, .6); m.castShadow = true; m.receiveShadow = true; m.userData.noCol = true; scene.add(m);
    const hit = box(.45, .3, .5, p[0], .15, p[2], hidden, { cast: false }); interact(hit, () => akte_has(n) ? `Durchschlag ${n} / 10` : 'Ein Umschlag, gestempelt VERTRAULICH', () => akte_lesen(n));
    S.docs.push({ n, m, hit, x: p[0], yP: p[1], z: p[2] }); if (typeof hintAdd === 'function') hintAdd({ id: 'akte_' + n, x: p[0], y: 0, z: p[2], kind: 'geheim', near: 24, open: () => !akte_has(n) }); }
  story.side.akte = { title: 'Die Akte Abgrund', desc: 'Jemand aus dem Amt hat Durchschläge versteckt. Es muss noch mehr davon geben.', state: 'hidden' };
  S.ready = true;
}]);
function akte_lesen(n) {
  const [, title, , txt] = AKTE.find(a => a[0] === n), html = '<span style="font-family:\'Courier New\',monospace;font-size:.93em;line-height:1.55">' + txt.replace(/\n/g, '<br>') + '</span>';
  if (!akte_has(n)) { story.lore.push({ key: 'akte_' + n, title: `Akte Abgrund ${n} / 10 · ${title}`, html }); Audio.paper(); sideStart('akte'); const c = akte_n();
    story.side.akte.desc = `Die Durchschläge der Ärztin Edda Brand: was das Amt vertuscht hat. Gefunden: ${c} / 10.` + (c < 10 ? ' Sie liegen dort, wo Kinder spielen und Erwachsene nicht hinsehen.' : '');
    questPop(`AKTE ABGRUND ${c} / 10`, title); const d = AKTE_S.docs.find(x => x.n === n); if (d) d.m.visible = false;
    const G = { 1: 'Eine Ärztin vom Amt. Sie wollte, dass das jemand findet.', 3: 'Die UFO-Zeitung an der Tankstelle. Die haben sie selbst geschrieben.', 4: 'Nicht alles, was zurückkommt, ist ein Kind. … Die Kuh.', 6: 'Onkel Peter. Der Mann aus Zähnen. Sie haben ihn eingesperrt, weil er es wusste.', 8: 'Sie wussten es. Sie haben die Straße zugemacht und zugesehen.', 9: 'Sie wussten es die ganze Zeit. Und niemand hat es mir gesagt. … Ich bin trotzdem jemand.' }[n];
    if (G && typeof gedanke === 'function') gedanke('akte_' + n, G, 1500, 3);
    if (c === 10) setTimeout(() => akte_fertig(), 1400); if (typeof saveGame === 'function' && state.started) saveGame(curChapter()); }
  openNote(`Durchschlag ${n} / 10 · ${title}`, html);
}
function akte_fertig() {
  if (story.lore.some(l => l.key === 'akte_ganz')) return;
  const html = 'Zehn Durchschläge. Zusammen ergeben sie eine Akte, die es offiziell nie gab: 1958 der Vertrag, 1975 die falsche UFO-Schlagzeile, die Bergungen in den Zyklusnächten, die Rückläufer, Peter Kranz im unteren Gang, die Sperre von 2009, Akte 08. Und 2012 das Ende.\n\nEdda Brand ist nie in Hamburg angekommen. Keine Zeitung hat je darüber berichtet.\n\nIm letzten Umschlag, ganz unten, steckt noch etwas: drei Batterien und ein Zettel in ihrer Handschrift: <span class="hand">„Für den Weg nach unten. Nimm Licht mit.“</span>';
  story.lore.push({ key: 'akte_ganz', title: 'Die Akte Abgrund (vollständig)', html }); addBattery(3); sideDone('akte', 'Alle zehn Durchschläge. Die Regierung hat es gewusst – seit 1958.'); openNote('Die Akte Abgrund', html);
  if (typeof gedanke === 'function') gedanke('akte_ganz', 'Sie ist nie angekommen. … Dann muss ich es sein.', 3000, 3);
}
WORLD_TICK.push(() => { // Umschläge auf die echte Oberfläche legen (Tisch, Plattform, Boden), sobald die Kollision steht
  const S = AKTE_S; if (!S.ready || S.placed || typeof SOL === 'undefined' || !SOL.items.length) return; S.placed = true;
  for (const d of S.docs) { const g = solidGround(d.x, d.yP, d.z), y = g > -1 ? g + .012 : .02; d.m.position.y = y; d.hit.position.y = y + .15; if (akte_has(d.n)) d.m.visible = false; }
});
MOD_SAVE.push(['akte', () => 1, () => { for (const d of AKTE_S.docs) d.m.visible = !akte_has(d.n); }]);
window.__akte = { S: AKTE_S, lesen: n => akte_lesen(n), liste: AKTE }; // Testzugriff
