// =====================================================================  GEDANKEN (Modul „gedanken“): Lukes Stimme
// Kurze Selbstgespräche, die das Seltsame beim Namen nennen, hinterfragen und fühlen – damit Luke auf das Krasse reagiert und die Geschichte
// verständlicher und persönlicher wird. Regeln gegen Nerven: jeder Gedanke nur einmal, nie während Dialogen/Notizen/anderen Untertiteln,
// Mindestabstand GEDANKEN.gap Sekunden. Hängt lange an einer Aufgabe fest, denkt Luke über den nächsten Schritt nach (Hinweis ohne Textwand).
const GEDANKEN = { gap: 9, stuck: 150, who: 'LUKE' };
MOD_SAVE.push(['gedanken', () => [...gedanken_S.said], v => v.forEach(id => gedanken_S.said.add(id))]);
const gedanken_S = { said: new Set(), q: [], cd: 6, obj: '', objT: 0, scares: 0, lastScare: 0, area: new Set(), battEmpty: false };
function gedanke(id, text, delay = 0, prio = 1) {
  const S = gedanken_S; if (S.said.has(id)) return; S.said.add(id);
  S.q.push({ id, text, at: performance.now() + delay, until: performance.now() + delay + 25000, prio }); S.q.sort((a, b) => b.prio - a.prio || a.at - b.at);
}
const GEDANKEN_SCHRECK = ['Das war nicht der Wind. Oder? … Atmen, Luke. Einfach atmen.', 'Ich hab das gesehen. Ich weiß, dass ich das gesehen hab.',
  'Lucy hätte gelacht. „Großer, du bist ein Angsthase.“ … Wo bist du, Lucy?', 'Ich sollte gehen. Ins Auto, weg. … Und dann? Wer sucht sie dann?',
  'Reiß dich zusammen. Das ist ein Haus. Nur ein Haus.', 'Irgendwas will, dass ich Angst habe. Und es funktioniert.',
  'Wenn ich gerade verrückt werde – merk ich das dann überhaupt?', 'Mein Herz. Hör auf. Hör einfach auf.'];
const GEDANKEN_ECHO = {
  echo_kreuzung: 'Wie wenn man in eine Lampe geguckt hat und die Augen zumacht. Ein Nachbild. Nur dass das nicht meins war. Oder?', // Fassung 3: Kap. 1 (wortgleich)
  echo_kueche: '„Fast wie Zayn.“ Sie haben ihr einen anderen Jungen angeboten. Wie einen Hund aus dem Tierheim.',
  echo_kinderzimmer: 'Er wusste nicht, wie unser Hund hieß. … Ich weiß es auch nicht. Warum weiß ich das nicht?',
  echo_brand: 'Sie wollte zurück. Dahin, wo es warm war. Was ist da oben, dass ein Kind sein eigenes Haus anzündet?',
  echo_archiv: '„Augenfarbe stimmt nicht.“ … Meine Augen sind braun. Waren sie immer braun?',
  echo_messraum: 'Kinder, festgeschnallt, mit offenen Augen. Einer hatte meine Jacke an. Meine alte, blaue Jacke.',
  echo_1975: 'Vegas. Als Kind. An der Hand vom Mann in Eisen. Der alte Mann hat es die ganze Zeit gewusst.' }; // Fassung 3: echo_mira („aus Papa gemacht“) abgeschafft, neuer Wortlaut offen (Autor)
// Erste Eindrücke an Orten: [id, x0, x1, z0, z1, Bedingung, Text]
const GEDANKEN_ORTE = [
  ['ort_friedhof', -75, -30, 66, 95, () => true, 'Kindergräber. Ich les die Namen nicht. Noch nicht.'],
  ['ort_kapelle', -80, 60, 40, 66, () => true, 'Die Kapelle. Als Kind hab ich mich nie reingetraut. Jetzt weiß ich nicht mehr, warum.'],
  ['ort_tankstelle', 97, 128, 4, 31, () => true, 'Tankstelle Kranz. Opas Tankstelle. Hier hab ich mit Lucy Eis gekauft. Glaub ich. Warum ist die Erinnerung so … dünn?'],
  ['ort_garten', -140, -90, 8, 45, () => true, 'Hildes Parzelle. Sie hat Gemüse gezogen. Für Kinder, die nicht mehr zum Essen kamen.'],
  ['ort_hof', -150, -110, -45, -10, () => true, 'Der Hof. Dina hat hier gewohnt. Dina … wie sah Dina eigentlich aus?'],
  ['ort_villa', -145, -105, 58, 90, () => true, 'Das Tor war immer zu. Ich war nie hier. Und trotzdem weiß ich, wo der Weg langgeht.'],
  ['ort_sperre', 138, 158, -20, 20, () => true, 'Gesperrt. Ausgebrannte Autos. Als hätte jemand versucht, rauszufahren. Und es nicht geschafft.']];
// Festhängen: Luke denkt laut über den nächsten Schritt nach (sanft, ohne Rätsellösung)
const GEDANKEN_FADEN = [
  [/Finde Haus Nr\. 7/, 'Nr. 7. Hilde Wendts Haus. Die Straße entlang … ich erkenne es, wenn ich davorstehe.'],
  [/Weg in Haus Nr\. 7/, 'Lucy hat Schlüssel immer irgendwo versteckt, wo man nicht sucht. Was hat sie mir vor der Tür hinterlassen?'],
  [/Durchsuche Haus Nr\. 7/, 'Irgendwo hier muss es einen Hinweis geben. Zettel, Kalender, alles, was Hilde aufgeschrieben hat.'],
  [/Kellertür/, 'Vier Ziffern. Welche Tasten sind abgegriffen? Und was hat Hilde in ihrem Kalender angestrichen?'],
  [/Lucy hinterlassen/, 'Lucy war hier unten. Sie hat etwas für mich liegen lassen. Etwas zum Anhören.'],
  [/Keller von Nr\. 7/, 'Die Wand mit den Zeichnungen. Mit bloßen Händen geht das nicht. Oben war doch eine Werkbank.'],
  [/Gang hinter der Wand|Folge dem Tunnel/, 'Nur ein Weg. Also geh ihn, Luke.'],
  [/Amt über die Kinder/, 'Akten. Irgendwer hier hat alles aufgeschrieben. Die Wahrheit steht bestimmt in einer Schublade.'],
  [/Namen in die richtige Reihenfolge/, 'Wer zuerst zurückkam, steht links. Die Zeiten stehen in den Akten. Lies sie nochmal.'],
  [/Lösch die Laternen/, 'In ihrer Reihenfolge. Hilde hat aufgeschrieben, wann. Und die Einwilligungen sagen, wer zuerst unterschrieben hat.'],
  [/Luke|Leiter/, 'Die Leiter. Nach oben. Nicht umdrehen.'],
  [/Lost Eyengless geschehen/, 'Irgendwer muss wach sein. Der alte Vegas in Nr. 3 hat früher nie geschlafen.'],
  [/./, 'Was hab ich übersehen? In der Fibel steht, was ich weiß. Tab.']];
WORLD_MODS.push(['Gedanken', async () => {
  const S = gedanken_S;
  // Story-Ereignisse: die vorhandenen Funktionen bleiben, Luke reagiert danach (Aufruf per Name → Umhüllung greift überall)
  const after = (orig, fn) => async function (...a) { const r = await orig.apply(this, a); try { fn(...a); } catch (e) {} return r; };
  startOutage = after(startOutage, () => gedanke('stromausfall', 'Strom weg. Alles. Und dieses Brummen … das ist kein Trafo. Das kommt von oben.', 3500, 3));
  { const o = startPhase2; startPhase2 = function (...a) { const r = o.apply(this, a); gedanke('wendt_strasse', 'Frau Wendt? Im Nachthemd, mitten auf der Straße. Sie steht da wie ein Kind, das auf jemanden wartet.', 5200, 3); return r; }; }
  ending = after(ending, () => gedanke('wendt_weg', 'Sie ist weg. Einfach hochgezogen. Und ich hab nichts gemacht. Ich hab nur dagestanden und zugesehen.', 1500, 3));
  cowDrop = after(cowDrop, () => gedanke('kuh', 'Eine Kuh. Vom Himmel. Ich sollte schreien. Warum bin ich so ruhig? … Warum fühlt sich das an, als hätte ich das schon mal gesehen?', 2500, 3));
  justinArrives = after(justinArrives, () => gedanke('ritter', 'Ein Ritter. Ein echter. Er riecht nach Schnee. Ich müsste wegrennen – und will ihn fragen, ob er mich kennt.', 1500, 3));
  broadcast = after(broadcast, () => gedanke('funk', 'Eine Stimme vom Amt. Aus einem Kasten, der seit 2012 tot sein müsste. … Und sie weiß, dass ich es weiß.', 1200, 3));
  lampsOut = after(lampsOut, () => gedanke('laternen', 'Alle Laternen aus. Der alte Vegas hatte recht. Und wenn er damit recht hatte …', 2000, 3));
  enterWhite = after(enterWhite, () => gedanke('weiss', 'Weiß. Kein Oben, kein Unten. Und irgendwo zählt ein Kind.', 2500, 3));
  enterCanal = after(enterCanal, () => gedanke('kanal', 'Eine Stadt unter Lost Eyengless. Das gehört nicht hierher. Oder ich gehöre nicht hierher.', 9000, 2));
  enterBasement = after(enterBasement, () => gedanke('keller', 'Ein Keller, den Lucy kannte und ich nicht. Wie viel von ihr kenne ich eigentlich?', 4500, 2));
  spiderEvent = after(spiderEvent, () => gedanke('spinnen', 'Raus aus meinem Kopf. Das war nicht echt. … Es hat sich echt angefühlt.', 1500, 3));
  caught = after(caught, () => gedanke('gefangen', 'Er hat mich nicht gebissen. Er hat mich festgehalten. Wie jemanden, den man lange vermisst hat.', 1500, 3));
  playEcho = after(playEcho, E => { if (GEDANKEN_ECHO[E.id]) gedanke('echo_' + E.id, GEDANKEN_ECHO[E.id], 900, 3);
    // Nachbilder: warum Luke sie sieht (Narbe = aus Justins Hand gemacht, Fassung 3) – nach dem ersten und dritten Nachbild
    const n = echoSeen.size; if (n === 1) gedanke('nachhall_1', 'Die Narbe in der Hand. Sie hat gebrannt, sobald ich den Ort angefasst hab. … Als würde sich die Hand erinnern, nicht ich.', 7000, 3);
    if (n === 3) gedanke('nachhall_2', 'Vegas hat an der Kreuzung nichts gesehen. Hilde hat gezählt, aber nie gesehen. Nur ich seh diese Bilder. Warum ich?', 7000, 3); });
  CH2_BEGIN.push(() => gedanke('tuer', 'Die Tür hat keine Klinke. Nicht von dieser Seite. Wer baut so was? Jemand, der nicht will, dass man zurückkommt.', 7500, 3));
  CH2_END.push(() => gedanke('lena_tank', 'Lucy war da drin. „Weißt du es jetzt?“ … Ja. Und ich wünschte, ich wüsste es nicht.', 14000, 3));
}]);
WORLD_TICK.push((dt, t) => {
  const S = gedanken_S; if (!state.started || menu.attract) return; const now = performance.now(), P = player.pos;
  // Schreckmomente (alle zählen scareCount hoch): danach eine eigene, kurze Reaktion
  if (scareCount !== S.scares) { S.scares = scareCount; const i = S.said.size % GEDANKEN_SCHRECK.length, k = GEDANKEN_SCHRECK.findIndex((_, j) => !S.said.has('schreck_' + ((i + j) % GEDANKEN_SCHRECK.length)));
    if (k >= 0) { const n = (i + k) % GEDANKEN_SCHRECK.length; gedanke('schreck_' + n, GEDANKEN_SCHRECK[n], 2600, 2); } }
  // Orte
  for (const [id, x0, x1, z0, z1, ok, text] of GEDANKEN_ORTE) if (!S.said.has(id) && P.x > x0 && P.x < x1 && P.z > z0 && P.z < z1 && !state.inBasement && ok()) gedanke(id, text, 800, 1);
  if (story.items.includes('brechstange')) gedanke('brechstange', 'Kalk an der Spitze. Frisch. Jemand hat hier vor kurzem etwas aufgebrochen. Oder zugemauert.', 4600, 1);
  if (story.items.includes('drahtschneider')) gedanke('drahtschneider', 'Kinderpflaster auf den Griffen. Wer lässt so was in einem Schuppen liegen? Für wen?', 4600, 1);
  if (FLASH.charge <= 0 && flashOn) gedanke('akku_leer', 'Nein. Nein, nein, nein. Nicht jetzt. Nicht hier im Dunkeln.', 300, 3);
  if (typeof albers_S !== 'undefined') { if (albers_S.talked.has('laternen')) gedanke('albers1', 'Ein alter Mann, der Stimmen in Laternen hört. … Aber sie haben wirklich geatmet.', 1500, 2);
    if (albers_S.talked.has('augen')) gedanke('albers5', 'Blau. Meine Augen waren blau. Er irrt sich. Er muss sich irren.', 1500, 3); }
  // Festhängen an einer Aufgabe
  const obj = document.getElementById('objText').textContent; if (obj !== S.obj) { S.obj = obj; S.objT = 0; } else if (!state.talking && !ui.overlay) S.objT += dt;
  if (S.objT > GEDANKEN.stuck) { S.objT = -GEDANKEN.stuck; const f = GEDANKEN_FADEN.find(([re]) => re.test(obj)); if (f) { const id = 'faden_' + obj.slice(0, 30); S.said.delete(id); gedanke(id, f[1], 0, 0); } }
  // Ausgabe: nur wenn nichts anderes läuft
  S.cd -= dt; if (S.cd > 0 || !S.q.length || state.talking || ui.overlay || state.ending) return;
  if (+document.getElementById('subtitle').style.opacity > .05) return;
  S.q = S.q.filter(x => x.until > now); const g = S.q.find(x => x.at <= now); if (!g) return; S.q.splice(S.q.indexOf(g), 1);
  const ms = Math.max(3200, Math.min(6800, 1800 + g.text.length * 48)); subtitle('<i>' + g.text + '</i>', ms, GEDANKEN.who); S.cd = ms / 1000 + GEDANKEN.gap;
});
