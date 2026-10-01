// =====================================================================  WELT-MODUL · justin (AP-12, Fassung 3) – Justin vom Hohen Abgrund
// Quelle: story_final.md, Justin-Dossier (81) §1.11 Aussehen, §3 Dialogbank Kap. 3, Entscheidungen 02 B1–B9, Kap. 3 UK 4/13/14, Whiskey-Dossier (83) §6.
// Figur: das Paladin-Modell (game/justin.js) bleibt. Hier bekommt es
//   · Material „Schiffshaut“: mattgrau wie nasser Schiefer, unter der Taschenlampe perlmuttfarben (Irisieren), keine Nieten-/Goldfarbe, 700 Jahre feiner
//     Kratzer; die Nähte werden bei Antwort A heller (justin_brustZerren). Kein Schild (steht in 81 §1.11 nicht). Kerbe in der Klinge, zwei Finger breit.
//   · Flicken aus mehreren Jahrhunderten: Ranzenriemen „H. R.“ am linken Unterarm, verchromte Gürtelschnalle mit dem Turm, Bindfaden/Draht, Stundenbuch
//     in der Ledertasche am Gürtel (Scan w_buch) mit Gummiband, schwarze Rabenfeder im Helmband (W-06).
//   · Gesicht unter dem Helm: vorhandener Kopf des Modells (braune Augen) + braune Locken (Haarkarten, MotionstudioArts „Small Curl Hairs Brown“)
//     + Vollbart (Karten aus der NoEdge-Figur „haar_bart“), beide auf den Kopf übertragen (Werkstatt _ap12_look) → assets/chars/justin/kopf.glb.
//     Blinzeln (eigene Lid-Form), Augen folgen Luke, Kopf/Oberkörper drehen sich mit (mit Helm der ganze Oberkörper, 81 §1.11), Atmung.
//     Das Haar ist vom Helm plattgedrückt und stellt sich nach dem Abnehmen langsam wieder auf (Kap. 3 UK 14).
//   · Bewegung: Gehen mit Schrittlänge = Fortbewegung (kein Gleiten), Drehen auf der Stelle mit Schritten, eigenes Schritt-Geräusch (Stein auf Stein, 81 §1.11),
//     Visier hoch/zu, Helm ab/auf, Brustplatte zerren, Geben – Arme per Zwei-Knochen-IK über der Mocap-Grundhaltung.
// Dialogbank: JUSTIN_BANK (Wortlaut 81 §3 / Kap. 3). „Luke“ sagt er nie (02 B2). Gesicht genau zweimal (Visier UK 4, Helm ab Raum 3). Ab „Noch eine Runde“ nie mehr als Figur.
// Schnittstellen für AP-17 (Kap.-3-Ablauf): justin_sprich(id) · justin_rh(id) / justin_rhZahl() · justin_visier(sek) · justin_helmAb() / justin_helmAuf() ·
//   justin_brustZerren() · justin_antwort('A'|'B'|'C') · justin_weg() · justin_blick(ziel|null) · justin_knien(an) · JUSTIN_BANK.
const justin_S = { ready: false, phase: '', said: new Set(), gone: false, face: 0, faceShown: 0, visier: 0, visierZiel: 0, helm: null, helmAb: 0, helmZiel: 0, helmHand: false,
  hair: [], beard: [], hairFlat: 1, hairFlatZiel: 1, eyes: null, blinkT: 2.5, blink: 0, blinkPh: 0, gaze: new THREE.Vector2(), sacc: new THREE.Vector2(), saccT: 1,
  lookYaw: 0, lookPitch: 0, lookV: [0, 0], blickZiel: null, bones: {}, ik: {}, walkV: 1.2, stepT: 0, footY: [0, 0], footDown: [true, true], turn: 0, turnStep: 0,
  atem: 0, naht: { value: 0 }, sheen: { value: 1 }, knie: 0, knieZiel: 0, uk4: null, blickHold: {}, blickNext: 0, oben: 0, wT: 0, geben: 0, zerren: 0, aufT: 0 };
const _jv = new THREE.Vector3(), _jv2 = new THREE.Vector3(), _jv3 = new THREE.Vector3(), _jv4 = new THREE.Vector3(), _jv5 = new THREE.Vector3(), _jq = new THREE.Quaternion(), _jq2 = new THREE.Quaternion(), _jq3 = new THREE.Quaternion(), _jm = new THREE.Matrix4(), _je = new THREE.Euler();
const JUSTIN_UP = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------- Dialogbank (Wortlaut: Justin-Dossier 81 §3, Kap. 3 UK 4/13/14; nichts umformuliert)
// Zeilen: [Text, ms, Sprecher]; 'DU' = Luke spricht, 'LUKE' = Lukes Gedanke (kursiv), ohne Sprecher = Erzählung.
const JUSTIN_BANK = {
  // 3.1 Ankunft (UK 4 „Wîse, du alter Dieb“)
  ank1: [['„Bleib stehen, Kind. Ich tu dir nichts.“', 3000, J]],
  ankBlick: [['Der guckt mich an, als hätte er mich schon mal verloren.', 3600, 'LUKE']],
  ank2: [['„Ich bin Justin. Ritter vom Hohen Abgrund. Das da hinten war mein Hof, als er noch einer war.“', 5000, J]],
  ank3: [['„Eure Kutschen sind lauter geworden. Und eure Nächte heller. Beides hilft nicht.“', 4600, JS]],
  kerbe: [['„Sie hatten dich festgeschnallt, da unten. Ich hab dich losgeschnitten. Die Maschine war härter als meine Klinge.“', 5600, JS]],
  peter1: [['„Du riechst nach Rauch. Nach dem unteren Gang.“', 3600, JS]],
  peter2: [['„Er war auch einer von meinen.“', 3200, JS], ['Ich weiß.', 1800, 'DU']],
  pflicht1: [['„Deine Schwester ist halb bei ihr. Bis zum Morgen hält sie nicht. Und wenn meine Tochter nicht findet, was sie sucht, nimmt sie alle mit, die wach sind.“', 6000, JS]],
  pflicht2: [['„Sie hält sich an den Lampen fest. Die meisten Lampen hier schlafen. Wach sind nur die, vor denen sie dieses Jahr einen geholt hat. Vier Augen. Mach sie ihr zu, eins nach dem andern, dann muss sie herunter, und wir können hinein.“', 8800, JS], // Story-Prüfung V-2 ['Wir?', 1600, 'DU'],
    ['„Ich such seit siebenhundert Jahren. Ich weiß, wie es da drin geht. Du nicht.“', 4400, JS]],
  pflicht3: [['„Die alte Frau im Haus mit der Sieben hat alles aufgeschrieben. Und der eiserne Kasten an der Kreuzung spricht noch.“', 5200, JS]],
  ostende: [['„Du hast mich schon gesehen. Am Ende der Straße. Weiter reichte die Nacht noch nicht.“', 4400, JS]],
  ankEnde: [['Ein Ritter. Um drei Uhr nachts. Und ich frage mich ernsthaft, ob er die Ahornstraße kennt.', 4600, 'LUKE']],
  // Der Schokoriegel (UK 4, Humor, Pflicht)
  riegel1: [['Justin sieht in deine offene Jackentasche.', 2600], ['„Was ist das?“', 1800, JS]],
  riegel2: [['„Das ist das Beste, was eure Zeit hervorgebracht hat.“', 3600, JS], ['Das ist ein Schokoriegel von der Tankstelle.', 2800, 'DU'], ['„Dann hat die Tankstelle etwas richtig gemacht.“', 3400, JS]],
  // 3.2 Das Lichtschiff (Happen, an Blicke gebunden)
  senke: [['„Das Licht da hinten ist kein Licht. Es ist ein Schiff. Es lebt, und es ist krank. Es ist vor siebenhundert Jahren in meinen Birkenwald gefallen.“', 6000, JS]],
  sammeln: [['„Die drin sind, sammeln. Bilder, die liegen bleiben. Stimmen. Das, was du Nachbild nennst. Sie waren schon oft hier, vor dem Absturz. Man hat Steine im Kreis aufgestellt, wo sie landeten.“', 7600, JS]],
  herz: [['„Das Schiff hatte ein Herz, und das Herz war leer, als es fiel. Das Erste, was es berührt hat, war meine Tochter. Sie war sieben.“', 5800, JS], ['„Seitdem will das Schiff, was ein Kind will.“', 3200, JS]],
  kuh: [['„Spielen. Blinde Kuh, Verstecken, Fangen. Es holt sich Tiere, guckt sie an und lässt sie fallen.“', 4800, JS], ['Sie hat der Kuh die Augen genommen.', 2600, 'DU'],
    ['„Sie hat gucken wollen, wie es aussieht, wenn eine Kuh guckt. Sie ist sieben. Seit siebenhundert Jahren.“', 5000, JS]],
  hinauf: [['„Sieh nicht zu lang hin. Es sieht zurück.“', 2800, JS]],
  ufo: [['Sag jetzt nicht UFO.', 1800, 'DU'], ['„Wir nannten es das Lichtschiff, weil uns nichts Besseres einfiel.“', 3800, JS]],
  naeher: [['„Drinnen gibt es keine Zeit. Sie zählt beim Verstecken. Jedes Zählen ist bei euch ein Jahr. Bis siebzehn konnte sie zählen, sie war stolz darauf. Bei siebzehn ruft sie ‚Ich komme‘, und das Schiff geht auf.“', 8400, JS]],
  // Story-Prüfung V-1 „Das siebzehnte Jahr“ (Kanon-Änderung, freigegeben): Pflicht direkt nach „naeher“
  siebzehn: [['„Die letzten Zahlen zählt sie langsam. Wie Kinder, die nicht wollen, dass es anfängt.“', 4600, JS], ['„In dem Jahr ist die Haut dünn. Wer Licht macht und zu ihr hochsieht, den holt sie vorher. Und mich spuckt sie aus, wenn sie mich wieder nicht gefunden hat. Dann wart ich am Rand, bis sie fertig gezählt hat.“', 9400, JS],
    ['Roxy. Mike. Lucy.', 2600, 'DU'], ['„Und die Frau mit dem Buch.“', 2800, JS]],
  // 3.3 Nimmerheim (erste gelöschte Laterne)
  lucy: [['Wo ist Lucy?', 1800, 'DU'], ['„Drinnen. Die Kinder von damals haben es Nimmerheim genannt. Weil da keiner groß wird und keiner heimdarf.“', 5000, JS],
    ['„Es baut sich aus dem, was es sich gemerkt hat. Küchen. Wiesen. Dein Haus, wenn es will. Es riecht nach Sommer. Lass dich davon nicht täuschen.“', 5800, JS]],
  // 3.4 Zeit (nach der zweiten Laterne)
  zeit: [['Siebenhundert Jahre. Du siehst aus wie vierzig.', 2800, 'DU'], ['„Ich geh hinein, such eine Nacht, und wenn ich rauskomme, sind draußen siebzehn Jahre um.“', 4600, JS],
    ['„Für mich waren es vielleicht drei Winter. Für euch die ganze Geschichte.“', 3800, JS], ['Das ist Zeitreise.', 1800, 'DU'], ['„Ich reise nicht. Die Zeit läuft an mir vorbei, und ich steh im Weg.“', 4000, JS]],
  zeitSpaeter: [['„Wer drinnen die Hand loslässt, kann weit fallen. In irgendeine offene Nacht. Manchmal kommt einer raus, der noch gar nicht reingegangen ist.“', 6000, JS],
    ['Das ergibt keinen Sinn.', 1800, 'DU'], ['„Nein. Hat es nie. Halt einfach die Hand fest.“', 3200, JS]],
  // 3.5 Der Riss (Kreuzung, Justin hält den Hörer – AP-17 ruft justin_sprich('riss'))
  riss: [['Die Narbe. Ich hab dieselbe.', 2400, 'DU'], ['„Fahrradunfall?“', 1600, JS], ['… Hat Mama gesagt.', 2000, 'DU'], ['„Mütter sagen viel.“', 2200, JS],
    ['„Manchmal reißt die Zeit da drin auf wie Stoff. Dann fällt man durch. Meine Frau ist so gegangen. Das Schiff war kaputt vom Sturz. Da drin ist was gerissen, und sie stand davor.“', 7200, JS]],
  // UK 4: „Was sucht sie?“ (erste Fassung der Nacht)
  miraUk4: [['Was sucht sie?', 1600, 'DU'], ['„Ihre Mama. Und mich.“', 2200, JS], ['Er sieht auf seine linke Hand.', 2200],
    ['„Meine Frau hat in der Nacht sechs Kinder herausgeholt, eins nach dem anderen, an der Hand. Dann ist sie noch mal hinein, für Luna. Ich hab sie festgehalten, am Rand.“', 6800, JS]],
  miraUk4b: [['Und dann?', 1400, 'DU'], ['„Die Luft ist aufgerissen wie Stoff. Das Schiff war kaputt, es hat die Zeit mit aufgerissen. Es hat gezogen. Sie hat losgelassen.“', 6000, JS]],
  // 3.6 Die Rüstung
  ruestung: [['Was ist das für ein Metall?', 2000, 'DU'], ['„Kein Eisen. Drei Kleine, weiß wie Reif, die übrig waren, haben mir Platten von ihrem Schiff gegeben, im Winter danach. Der Schmied hat sie geschmiedet und danach nie wieder gesprochen.“', 7600, JS],
    ['Was für Kleine?', 1600, 'DU'], ['„Zwei haben die grauen Mäntel geholt. Den dritten hab ich nie wieder gesehen.“', 4000, JS], ['„Manchmal hör ich was hinter mir, wenn ich nicht hinschau.“', 3600, JS]],
  ruestung2: [['„Nur darin komme ich wieder heraus. Ohne wird man grau. Frag nicht, wie ich das weiß.“', 4400, JS]],
  klopfen: [['Das klingt nicht wie Eisen.', 2200, 'DU']],
  blechmaenner: [['„Die in Weiß mit den Eisenhauben. Die haben sich das bei mir abgeschaut. Drinnen halten sie so lang wie ein Atemzug.“', 5400, JS],
    ['„Euer Eisen ist gut. Fass es an, dann kriegt sie dich nicht. Aber sie sieht dich. Eisen ist frei. Unsichtbar ist es nicht.“', 5400, JS]],
  verwechslung: [['Nicht Justin. Nur einer, der sich für ihn hält.', 2800, 'LUKE'], ['„Die haben mich gesehen und sich Eisen umgehängt. Sie glauben, es ist dasselbe. Drinnen halten sie so lange, wie ein Mensch die Luft anhält.“', 6400, JS]],
  wolter: [['„Den kenne ich. Er stand schon einmal am Rand, mit einem Netz. Dieselbe Kanne.“', 4400, JS], ['Das war wann?', 1400, 'DU'], ['„Als eure Kutschen noch leiser waren.“', 2600, JS]],
  // 3.7 Die offenen Nächte (Glocke: drei, Pause, dreizehn)
  glocke: [['„Drei, und dann dreizehn. So lang hat meine Frau gebraucht, vom Bett bis zum Rand. Sie hat gezählt. Die Glocke zählt seitdem mit.“', 5800, JS],
    ['„Alle siebzehn Jahre. So weit kann sie zählen. Dann ruft sie ‚Ich komme‘, und das Schiff geht auf. Eine Nacht. Bis zum Morgen.“', 5600, JS],
    ['„Dann ist es zu, und drin bleibt, wer drin ist. Deshalb haben wir Eile, Knabe. Und deshalb hab ich keine. Ich bin immer drin.“', 5600, JS]],
  // 3.8 Luna (nach der dritten Laterne)
  luna: [['Deine Tochter. Die im Keller. Das war sie?', 2600, 'DU'], ['„Luna. Sieben. Sie konnte bis siebzehn zählen und war stolz drauf.“', 3800, JS],
    ['„Sie hat sich versteckt, wie wir’s abgemacht hatten. Ich sollte sie finden. Ich such noch.“', 4400, JS]],
  lunaWeiter: [['„Sie ist das Herz von dem Ding geworden. Es tut, was sie will. Und sie will spielen. Und uns.“', 4600, JS]],
  rh3: [['Und in siebenhundert Jahren hast du sie nie gefunden?', 2800, 'DU'], ['„Sie hört mich rufen und sieht niemanden. Sie hält es für Mogeln. Wie wenn Erwachsene beim Verstecken schummeln.“', 5400, JS]],
  rh3b: [['„Also versteckt sie sich besser. Jedes Mal. Darin sind wir beide sehr gut geworden.“', 4000, JS]],
  name: [['Wie heißt sie?', 1400, 'DU'], ['„Luna.“', 1800, JS], ['Luna. Am Ostende hat vorhin einer was in den Nebel gerufen. Ich hab ‚Lucy‘ gehört. Weil ich ‚Lucy‘ hören wollte.', 5200, 'LUKE']],
  // 3.9 Mira (vor dem Einstieg)
  mira: [['Und deine Frau?', 1600, 'DU'], ['„Mira. Sie konnte lesen. Sie hat mir das beigebracht, mit dem Buch da.“', 3800, JS]],
  mira2: [['„Sie hat die sechs rausgeholt. Alle. Dann ist sie noch mal rein, für Luna.“', 3800, JS], ['Und dann?', 1400, 'DU'],
    ['„Das erzähl ich drinnen. Da, wo es passiert ist. Nicht hier auf der Straße neben einem Kasten voller leerer Krüge.“', 5200, JS]],
  // 3.10 Wîse – Stufen 3 bis 6 (Stufe 1/2 = W-06 in whiskey.js)
  wise3: [['„Er hat schon damals alles geklaut, was glänzt. Ihren Fingerhut. Meinen Sporn. Einmal die Hostie.“', 4600, JS], ['Und was hat er heute?', 1800, 'DU'], ['„Deinen Autoschlüssel, vermute ich.“', 2600, JS]],
  wise4: [['Wie alt ist der eigentlich? Vegas sagt, der saß schon ’75 auf der Laterne.', 3600, 'DU'], ['„Älter als du. Älter als ich, wenn man richtig zählt. Raben werden nicht so alt. Er schon.“', 4600, JS],
    ['Wie?', 1000, 'DU'], ['„Er fliegt, wo ich nur gehen kann. Rein und raus. Er hat keine Angst vor drinnen. Ich weiß nicht, wer ihm das beigebracht hat.“', 5600, JS]],
  wise5: [['Er hat, seit wir drin sind, keinen Ton gemacht.', 2600, 'DU'], ['„Er weiß, wo er ist.“', 1800, JS], ['Und warum ist er dann mitgekommen?', 2200, 'DU'],
    ['„Sie kennt ihn. Er ist der Vogel ihrer Mutter. Wenn er ruft, kommt sie.“', 4000, JS]],
  wise5b: [['„Wenn er still wird, ist sie nah. Bei Gewitter war das auch so.“', 3400, JS]],
  wise6: [['„Er kommt von irgendwo, wo sie ist. Ich weiß nicht, wo. Ich weiß nur, dass er nach Minze riecht, wenn er kommt.“', 5200, JS],
    ['„Sie hat gesagt, er findet immer heim. Zu ihr, hat sie gesagt. Von mir war nie die Rede.“', 4600, JS]],
  // 2.2 Beispielzeilen, die als Fragen erreichbar sind
  geist: [['Bist du ein Geist?', 1600, 'DU'], ['„Wenn ich einer wär, wär mir nicht kalt.“', 2800, JS]],
  jahre: [['Was hast du all die Jahre gemacht?', 2200, 'DU'], ['„Gerufen. Und zugesehen. Vor allem zugesehen. Ich bin darin sehr gut geworden. Das ist kein Lob.“', 5000, JS]],
  drache: [['Ein Ritter. Fehlt nur noch der Drache.', 3000, 'DU'], ['„Drachen gab es nie. Das hier schon.“', 2600, JS]],
  sicher: [['Und du bist sicher, dass das klappt?', 2200, 'DU'], ['„Nein.“', 1200, JS], ['Das war rhetorisch.', 1600, 'DU'], ['„Das Wort kenn ich nicht. Ich bin trotzdem nicht sicher.“', 3200, JS]],
  // 3.12 nach dem Geständnis, im Aufstehen
  aufstehen: [['„Ich hab immer gedacht, sie versteckt sich vor mir, weil ich sie nicht gesucht hab. Weil ich stehen geblieben bin.“', 5200, JS],
    ['„Vielleicht ist es was anderes. Ich hab nie nachgesehen. Man sieht nicht gern nach, wenn man Angst hat, was man findet.“', 5400, JS]],
  // 3.14 Die Wahl · 3.15 Letzte Worte und Geschenke
  A1: [['„Sie ist mit mir verwachsen. Wenn ich sie ausziehe, hier drin, werde ich wie die auf den Stühlen. Noch nicht.“', 5400, JS]],
  A2: [['„Dann bleib ich so. Bei ihr. Wenn sie mich nicht sehen kann, soll sie mich wenigstens hören. Die ganze Zeit.“', 5200, JS]],
  Aletzt: [['„Ich bleib hier, Knabe. Wenn du sie mal suchst: Ich bin der, der ruft.“', 4400, JS]],
  Ageschenk: [['„Von einem Jungen, der ihn nicht mehr gebraucht hat. Er hieß Hans. Seine Schwester wartet noch.“', 5000, JS]],
  Ageschenk2: [['„Sag ihr, er hat nicht gefroren.“', 2600, JS]],
  B1: [['„Dann spiele ich mit ihr.“', 2400, JS]],
  B2: [['„Ich kann Verstecken. Ich hab’s nur nie zu Ende gespielt. Diesmal zähl ich, laut, damit sie’s hört.“', 5000, JS]],
  Bletzt: [['„Pass auf deine Schwester auf. Sie hat dich gewählt, bevor du wusstest, was du bist. Das tun nicht viele.“', 5200, JS]],
  Bgeschenk: [['„Für die Runde danach. Man spielt nicht mit leerem Bauch.“', 3400, JS]],
  Bgeschenk2: [['„Das hat meine Frau gesagt. Über mich.“', 2600, JS]],
  C1: [['„Das tue ich seit siebenhundert Jahren.“', 3000, JS]],
  C2: [['„Vielleicht muss sie mich dabei sehen.“', 2800, JS]],
  C3: [['„Ich hab immer leise gesucht. Wie einer, der sich schämt. Diesmal such ich laut.“', 4400, JS]],
  Cletzt: [['„Wenn ich sie das nächste Mal finde, will ich, dass sie es merkt. Halt mir die Augen offen, Knabe. Deine.“', 5400, JS]],
  Cgeschenk: [['„Damit du weißt, wo du herkommst. Vom Hof. Nicht aus dem Licht.“', 3800, JS]],
  rhJa: [['Sie sieht dich nicht. Wegen der Rüstung. Das Schiff sieht sie nicht, und sie sieht durch das Schiff.', 5200, 'DU'], ['Justin steht still.', 1800], ['„… Dann muss ich sie eines Tages ausziehen.“', 3200, JS]],
  rhFlicken: [['„Fang schon mal an. Das da ist das erste Stück.“', 3000, JS]],
  rhNein: [['Sie sieht ihn nicht. Er steht direkt da. Irgendwas an ihm ist für sie nicht da.', 4400, 'LUKE']],
  runde: [['„Papa? … Papa, du mogelst wieder.“', 3400, 'DAS KIND'], ['„Noch eine Runde.“', 2400, 'DAS KIND'], ['„Eins.“', 1400, 'DAS KIND'], ['„Zwei.“', 1400, 'DAS KIND'], ['„Drei.“', 1600, 'DAS KIND']],
};
// Geschenke (02 B3): Gegenstand, Name, Beschreibung (Wortlaut der Beschreibung aus 81 §1.11 / §3.15)
const JUSTIN_GABEN = { A: ['ranzenriemen', 'Ranzenriemen', 'Ein brauner Lederriemen von einem Schulranzen, mit einer Metallschnalle. In das Leder geritzt, in Kinderschrift: „H. R.“'],
  B: ['riegel_halb', 'Halber Riegel', 'Der zweite Schokoriegel, halb gegessen, ordentlich in Silberpapier gefaltet.'],
  C: ['schnalle_turm', 'Gürtelschnalle mit dem Turm', 'Stumpf. Darauf der Turm über dem Abgrund, das Zeichen seines Hofs. Dasselbe Zeichen wie auf Whiskeys Ring.'],
  F: ['flicken', 'Flicken', 'Von der Innenseite seines rechten Armschutzes. So groß wie eine Münze, mattgrau, warm.'] };

// ---------------------------------------------------------------- Sprechen, Zähler, Hilfen
function justin_da() { return !!(justin && justin.model && justin.g.visible && justin.g.position.y > -100 && !justin_S.gone); }
// Zeilen aus der Bank sprechen (einmalig, außer again): gibt ein Promise zurück; Justin sieht Luke dabei an und bewegt die Schultern beim Reden
async function justin_sprich(id, { again = false, frei = true } = {}) {
  const L = JUSTIN_BANK[id]; if (!L || (!again && justin_S.said.has(id))) return false; justin_S.said.add(id);
  const was = state.talking; state.talking = true; justin_S.redet = true;
  try { await say(L); } finally { justin_S.redet = false; if (frei && !was) state.talking = false; }
  return true; }
// Rüstungs-Hinweise RH-1 … RH-11 (02 B4): Zähler im Spielstand (ch3.armorHints), Schwelle 3
function justin_rh(id) { if (!ch3.armorHints) ch3.armorHints = new Set(); const neu = !ch3.armorHints.has(id); ch3.armorHints.add(id); if (neu && typeof saveGame === 'function' && ch3.on) try { saveGame(3); } catch (e) {} return ch3.armorHints.size; }
function justin_rhZahl() { return ch3.armorHints ? ch3.armorHints.size : 0; }
function justin_blick(z) { justin_S.blickZiel = z || null; }
function justin_gedanke(t, ms = 3600) { subtitle(t, ms, 'LUKE'); }
function justin_hat(k) { return story.lore.some(l => l.key === k); }

// ---------------------------------------------------------------- Aufbau: Material, Helm/Visier, Flicken, Feder, Kopf (beim Laden)
// „Schiffshaut“: Farbe entsättigt (kein Gold, kein Rot), nasser Schiefer, Kratzer als feines Rauheitsmuster, irisierender Glanz (perlmutt im Lampenlicht)
function justin_haut(src, o = {}) {
  const m = new THREE.MeshPhysicalMaterial({ map: src.map, normalMap: src.normalMap, normalScale: src.normalScale ? src.normalScale.clone() : new THREE.Vector2(1, 1), roughnessMap: src.roughnessMap, metalnessMap: src.metalnessMap, aoMap: src.aoMap,
    color: new THREE.Color(o.tint ?? 0xffffff), roughness: o.rough ?? .72, metalness: o.metal ?? .35, iridescence: o.irid ?? .55, iridescenceIOR: 1.32, iridescenceThicknessRange: [180, 520],
    clearcoat: o.coat ?? .12, clearcoatRoughness: .5, side: src.side, alphaTest: src.alphaTest || 0, transparent: false, envMapIntensity: .7 });
  const kratzer = justin_S.kratzerT;
  m.onBeforeCompile = sh => { sh.uniforms.uNaht = justin_S.naht; sh.uniforms.uKr = { value: kratzer }; sh.uniforms.uGrau = { value: o.grau ?? .92 }; sh.uniforms.uDunkel = { value: o.dunkel ?? .62 };
    sh.fragmentShader = 'uniform float uNaht, uGrau, uDunkel; uniform sampler2D uKr;\n' + sh.fragmentShader
      .replace('#include <map_fragment>', `#include <map_fragment>
        { float l = dot(diffuseColor.rgb, vec3(.3, .59, .11)); float sat = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)) - min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
          vec3 schiefer = vec3(.30, .325, .34) * (.55 + l * .9); diffuseColor.rgb = mix(diffuseColor.rgb, schiefer, clamp(uGrau + sat * .6, 0., 1.)) * uDunkel; }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        #ifdef USE_MAP
        { float k = texture2D(uKr, vMapUv * 7.).r; roughnessFactor = clamp(roughnessFactor * (.82 + .36 * k), .25, 1.); }
        #endif`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        #ifdef USE_AOMAP
        { float cav = 1. - texture2D(aoMap, vAoMapUv).r; totalEmissiveRadiance += vec3(.75, .8, .85) * smoothstep(.12, .5, cav) * uNaht; }
        #endif`); };
  m.customProgramCacheKey = () => 'justin_haut' + (o.key || '');
  return m; }
function justin_kratzerTex() { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { const a = Math.random() * 6.28, l = 6 + Math.random() * 60, px = Math.random() * 512, py = Math.random() * 512; x.strokeStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '20,20,20'},${(.08 + Math.random() * .22).toFixed(2)})`; x.lineWidth = Math.random() * 1.2 + .3;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * .5 + rand(-4, 4), py + Math.sin(a) * l * .5 + rand(-4, 4), px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
// Leder-/Metall-Texturen für die Flicken (Canvas, auf echter Grundfarbe)
function justin_cv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const JUSTIN_TEX = {
  riemen: () => justin_cv(512, 64, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3a2414'); g.addColorStop(.15, '#6e4526'); g.addColorStop(.5, '#7a4d2a'); g.addColorStop(.85, '#5e3a20'); g.addColorStop(1, '#2e1c10'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '20,12,6' : '150,110,70'},${(Math.random() * .12).toFixed(3)})`; x.fillRect(Math.random() * w, Math.random() * h, rand(1, 6), 1); }
    x.strokeStyle = 'rgba(210,190,150,.55)'; x.setLineDash([5, 4]); x.lineWidth = 1.4; x.beginPath(); x.moveTo(0, 8); x.lineTo(w, 8); x.moveTo(0, h - 8); x.lineTo(w, h - 8); x.stroke(); x.setLineDash([]);
    // Schnalle
    x.fillStyle = '#8c8e8a'; x.fillRect(300, 10, 36, 44); x.fillStyle = '#4a4c48'; x.fillRect(306, 16, 24, 32); x.fillStyle = '#b8bab4'; x.fillRect(316, 12, 4, 40);
    // „H. R.“ in Kinderschrift eingeritzt
    x.save(); x.translate(150, 42); x.rotate(-.04); x.font = 'bold 30px "Caveat", cursive'; x.fillStyle = 'rgba(30,16,8,.85)'; x.fillText('H. R.', 0, 0); x.fillStyle = 'rgba(170,130,90,.45)'; x.fillText('H. R.', 1, 1); x.restore(); }),
  schnalle: () => justin_cv(128, 96, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#9a9c98'); g.addColorStop(.5, '#6c6e6a'); g.addColorStop(1, '#8a8c88'); x.fillStyle = g; x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, 10); x.fill();
    x.strokeStyle = '#3c3e3a'; x.lineWidth = 3; x.stroke(); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(40,40,36,${(Math.random() * .25).toFixed(2)})`; x.fillRect(Math.random() * w, Math.random() * h, rand(1, 4), 1); }
    // Turm über dem Abgrund
    x.fillStyle = '#34362f'; x.fillRect(52, 22, 24, 38); x.fillRect(48, 18, 6, 8); x.fillRect(61, 18, 6, 8); x.fillRect(74, 18, 6, 8); x.fillRect(30, 66, 68, 5); x.beginPath(); x.moveTo(40, 71); x.lineTo(64, 84); x.lineTo(88, 71); x.fill(); }),
  faden: () => justin_cv(128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); for (let i = 0; i < 14; i++) { const y = 24 + i * 6 + rand(-1, 1); x.strokeStyle = i % 5 === 4 ? 'rgba(90,92,96,.95)' : 'rgba(176,156,112,.95)'; x.lineWidth = i % 5 === 4 ? 2.2 : 3.4; x.beginPath(); x.moveTo(6, y); x.bezierCurveTo(40, y + rand(-3, 3), 90, y + rand(-3, 3), 122, y + rand(-2, 2)); x.stroke(); }
    for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(60,48,30,${(Math.random() * .3).toFixed(2)})`; x.fillRect(Math.random() * w, 20 + Math.random() * 90, 2, 1); } }),
  feder: () => justin_cv(128, 512, (x, w, h) => { x.clearRect(0, 0, w, h); x.save(); x.translate(w / 2, h - 10);
    for (let i = 0; i < 220; i++) { const t = i / 220, y = -30 - t * 450, side = i % 2 ? 1 : -1, len = (34 + Math.sin(t * 3.1) * 16) * (t < .92 ? 1 : (1 - t) * 12) * (side > 0 ? 1 : .8), gap = Math.random() < .05;
      if (gap) continue; x.strokeStyle = `rgba(${10 + Math.random() * 10},${12 + Math.random() * 10},${18 + Math.random() * 14},${(.75 + Math.random() * .25).toFixed(2)})`; x.lineWidth = 1.6;
      x.beginPath(); x.moveTo(0, y); x.quadraticCurveTo(side * len * .5, y - 6, side * len, y - 16 - Math.random() * 6); x.stroke(); }
    x.strokeStyle = '#1c1c20'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -470); x.stroke(); x.restore(); }),
};
function justin_decal(tex, w, h, o = {}) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: !!o.alpha, alphaTest: o.alpha ? .35 : 0, depthWrite: true, polygonOffset: true, polygonOffsetFactor: -3,
  roughness: o.rough ?? .8, metalness: o.metal ?? 0, side: THREE.DoubleSide })); m.castShadow = false; m.receiveShadow = true; m.userData.jFlick = true; m.userData.noCol = true; return m; }
// Oberflächenpunkt eines Skin-Netzes nahe einem Knochen in einer Richtung (Weltraum → Knochenraum)
function justin_flaeche(bone, dir, meshes, maxD = .3) { const inv = _jm.copy(bone.matrixWorld).invert(), bp = bone.getWorldPosition(new THREE.Vector3()); let best = null, bs = -1e9; const v = new THREE.Vector3();
  for (const m of meshes) { const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i += 2) { v.fromBufferAttribute(p, i); m.applyBoneTransform(i, v); v.applyMatrix4(m.matrixWorld); const d = v.distanceTo(bp); if (d > maxD) continue;
      const s = _jv.copy(v).sub(bp).normalize().dot(dir) - d * .2; if (s > bs) { bs = s; best = v.clone(); } } }
  if (!best) return null; const n = best.clone().sub(bp).normalize(); return { p: best.applyMatrix4(inv), n: n.transformDirection(inv) }; }

WORLD_MODS.push(['Justin · Figur, Gesicht, Bewegung (AP-12)', async () => {
  const S = justin_S; if (!justin.model || !justin.mixer) return; const M = justin.model; S.kratzerT = justin_kratzerTex();
  // Knochen aus dem Skelett des Körpers (die Teile Helm/Kopf bringen eigene, unbenutzte Knochenketten gleichen Namens mit)
  M.updateMatrixWorld(true); const B = S.bones; let body = null; M.traverse(o => { if (o.isSkinnedMesh && !body && /chest/i.test([].concat(o.material)[0].name || '')) body = o; });
  if (!body) M.traverse(o => { if (o.isSkinnedMesh && !body) body = o; }); for (const b of body.skeleton.bones) if (!B[b.name]) B[b.name] = b;
  // --- Schild weg, Materialien
  if (justin.shield) justin.shield.visible = false;
  const skins = []; let helm = null, headSkin = null, eyeMesh = null;
  M.traverse(o => { if (!o.isMesh) return; const n = [].concat(o.material)[0].name || '';
    if (o.isSkinnedMesh && /helm/i.test(o.name + n)) { helm = o; return; }
    if (/head_light/.test(n)) { headSkin = o; o.material.normalScale && o.material.normalScale.multiplyScalar(.8); return; }
    if (/eye_Brown/.test(n)) { eyeMesh = o; return; }
    if (/WorldGrid/.test(n)) { o.visible = false; return; }
    if (/body_light|beard|occlusion|tearline/.test(n)) return;
    if (o === justin.sword || (justin.sword && justin.sword.getObjectById(o.id))) { o.material = justin_haut(o.material, { key: 'schwert', grau: .55, dunkel: .8, irid: 0, metal: .75, rough: .5, coat: 0 }); return; }
    if (/chest|bracer/.test(n)) { o.material = justin_haut(o.material, { key: 'platte' }); skins.push(o); return; }
    if (/glove/.test(n)) { o.material = justin_haut(o.material, { key: 'handschuh', grau: .45, dunkel: .55, irid: .08, metal: .05, rough: .85, coat: 0 }); return; }
    if (/cloak/.test(n)) { o.material = justin_haut(o.material, { key: 'stoff', grau: .55, dunkel: .42, irid: 0, metal: 0, rough: .95, coat: 0 }); return; }
    if (/pants|shoe/.test(n)) { o.material = justin_haut(o.material, { key: 'leder', grau: .35, dunkel: .6, irid: 0, metal: .02, rough: .9, coat: 0 }); return; } });
  S.skins = skins; S.headSkin = headSkin; S.eyeMesh = eyeMesh;
  // --- Helm: vom Skelett gelöst (starr am Kopfknochen), Flügel und Gold weg, Visier als eigenes Teil
  try { if (helm && B.head) justin_helmBauen(helm, B.head); } catch (e) { console.warn('Justin Helm', e); }
  // --- Schwert: Kerbe, zwei Finger breit (2009, Stuhl 8); er zieht es fast nie – es hängt am Gürtel (81 §1.11)
  try { if (justin.sword) { justin_kerbe(justin.sword); justin_schwertGuertel(); } } catch (e) { console.warn('Justin Schwert', e); }
  // --- Flicken aus mehreren Jahrhunderten
  try { justin_flicken(); } catch (e) { console.warn('Justin Flicken', e); }
  // --- Gesicht: Locken, Bart, Augen, Lider
  try { await justin_kopf(); } catch (e) { console.warn('Justin Kopf', e); }
  // --- Mocap (Motifect Daily Life, auf Justins Skelett übertragen): Knien und Aufstehen
  try { const r = await fetch('assets/chars/justin/mocap.json'); if (r.ok) { const D = await r.json(); S.mocap = {}; S.mocapInfo = D.info || {};
      for (const [k, c] of Object.entries(D.clips || {})) S.mocap[k] = THREE.AnimationClip.parse(c);
      if (S.mocap.knien && justin.acts.idle) justin_spurenErgaenzen(S.mocap.knien, justin.acts.idle.getClip());
      if (S.mocap.knien) { const a = justin.mixer.clipAction(S.mocap.knien); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; justin.acts.knien = a; } } } catch (e) { console.warn('Justin Mocap', e); }
  // --- Bewegung: Schrittgeschwindigkeit des Geh-Clips messen (Fußkontakt → keine Gleitschritte)
  try { justin_schrittMessen(); } catch (e) { console.warn('Justin Schritt', e); }
  justin.sp = S.walkV; S.ready = true;
}]);

// Helm: Geometrie in den Kopfknochenraum backen; Dreiecke der Flügel (weit seitlich/oben außerhalb der Schale) entfernen; Visier = Vorderteil unter dem Stirnband
function justin_helmBauen(helm, head) { const S = justin_S; justin.model.updateMatrixWorld(true); helm.skeleton.update();
  const pos = helm.geometry.attributes.position, n = pos.count, out = new Float32Array(n * 3), inv = new THREE.Matrix4().copy(head.matrixWorld).invert(), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) { v.fromBufferAttribute(pos, i); helm.applyBoneTransform(i, v); v.applyMatrix4(helm.matrixWorld).applyMatrix4(inv); out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z; }
  // Achsen des Kopfknochens: oben/vorn in Knochenraum
  const q = head.getWorldQuaternion(new THREE.Quaternion()).invert(), U = new THREE.Vector3(0, 1, 0).applyQuaternion(q).normalize(), F0 = justin_vorn(new THREE.Vector3()).applyQuaternion(q);
  const F = F0.sub(U.clone().multiplyScalar(F0.dot(U))).normalize(), R = new THREE.Vector3().crossVectors(U, F); S.hU = U; S.hF = F; S.hR = R;
  // Mitte der Schale, Radius
  const c = new THREE.Vector3(); for (let i = 0; i < n; i++) c.x += out[i * 3], c.y += out[i * 3 + 1], c.z += out[i * 3 + 2]; c.multiplyScalar(1 / n);
  const co = i => { v.set(out[i * 3] - c.x, out[i * 3 + 1] - c.y, out[i * 3 + 2] - c.z); return [v.dot(R), v.dot(U), v.dot(F)]; };
  const rad = []; for (let i = 0; i < n; i++) { const [r, u, f] = co(i); rad.push(Math.hypot(r, f)); } const srt = rad.slice().sort((a, b) => a - b), med = srt[Math.floor(n * .5)];
  let umin = 1e9, umax = -1e9, fmax = -1e9; for (let i = 0; i < n; i++) { const [, u, f] = co(i); umin = Math.min(umin, u); umax = Math.max(umax, u); fmax = Math.max(fmax, f); }
  const idx = helm.geometry.index ? helm.geometry.index.array : Array.from({ length: n }, (_, i) => i);
  const schale = [], visier = [], weg = i => rad[i] > med * 1.2 || co(i)[1] > umax - (umax - umin) * .02 && rad[i] > med * 1.05;
  const uBand = umin + (umax - umin) * .66; S.helmInfo = { med, umin, umax, fmax, uBand };
  for (let t = 0; t < idx.length; t += 3) { const a = idx[t], b = idx[t + 1], d = idx[t + 2]; if (weg(a) || weg(b) || weg(d)) continue;
    const fa = co(a), fb = co(b), fd = co(d), vorn = [fa, fb, fd].every(x => x[2] > med * .18 && x[1] < uBand && x[1] > umin + (umax - umin) * .04); (vorn ? visier : schale).push(a, b, d); }
  const mkGeo = list => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(out, 3)); for (const k of ['normal', 'uv']) if (helm.geometry.attributes[k]) g.setAttribute(k, helm.geometry.attributes[k]); g.setIndex(list); g.computeVertexNormals(); g.computeBoundingSphere(); return g; };
  const mat = justin_haut(helm.material, { key: 'helm' }); mat.side = THREE.DoubleSide;
  const grp = new THREE.Group(); grp.name = 'JustinHelm'; head.add(grp);
  const shell = new THREE.Mesh(mkGeo(schale), mat); shell.name = 'helm_schale'; shell.castShadow = true; shell.frustumCulled = false; grp.add(shell);
  // Visier dreht um die Achse durch die Schläfen (Höhe Stirnband, Mitte der Schale)
  const piv = c.clone().addScaledVector(U, uBand - .004); const vg = mkGeo(visier); vg.translate(-piv.x, -piv.y, -piv.z);
  const vis = new THREE.Mesh(vg, mat); vis.name = 'helm_visier'; vis.castShadow = true; vis.frustumCulled = false; const vp = new THREE.Group(); vp.position.copy(piv); vp.add(vis); grp.add(vp);
  helm.parent.remove(helm); // das alte Skin-Netz (Flügel, Gold) ist weg; kino_helm findet die neuen Teile über den Namen
  // Spiegelung im blanken Visier (Raum 3, gehalten): Lukes Gesicht mit braunen Augen – Textur aus weiss.js, sonst keine
  { const vv = new THREE.Vector3(); let n2 = 0; const cc = new THREE.Vector3(); for (const i of visier) { vv.set(out[i * 3], out[i * 3 + 1], out[i * 3 + 2]); if (vv.clone().sub(c).dot(F) > fmax - .04) { cc.add(vv); n2++; } }
    if (n2) { cc.multiplyScalar(1 / n2).sub(piv); const sp = new THREE.Mesh(new THREE.PlaneGeometry(.075, .048), new THREE.MeshBasicMaterial({ map: typeof WEISS_TEX !== 'undefined' ? tex(WEISS_TEX.visier(), true) : null, transparent: true, opacity: .45, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
      sp.position.copy(cc).addScaledVector(F, .006); sp.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(R.clone(), U.clone(), F.clone())); sp.visible = false; sp.name = 'visier_spiegel'; vis.add(sp); S.spiegel = sp; } }
  S.helm = { grp, shell, vis, vp, head, R: R.clone(), base: grp.quaternion.clone(), c };
  S.helmN = { schale: schale.length / 3, visier: visier.length / 3 }; }
// Vorwärtsrichtung der Figur in Weltkoordinaten (Modell dreht mit justin.g)
function justin_vorn(v) { return v.set(0, 0, 1).applyQuaternion(justin.g.getWorldQuaternion(_jq3)); }

// Kerbe in der Klinge: Punkte an einer Schneide in einem Band von 3,5 cm um 1,1 cm nach innen (V-Form)
function justin_kerbe(sw) { let mesh = null; sw.traverse(o => { if (!mesh && o.isMesh) mesh = o; }); if (!mesh) return; const g = mesh.geometry = mesh.geometry.clone(); g.computeBoundingBox(); const bb = g.boundingBox, sz = bb.getSize(new THREE.Vector3());
  const ax = sz.x >= sz.y && sz.x >= sz.z ? 'x' : sz.y >= sz.z ? 'y' : 'z', others = ['x', 'y', 'z'].filter(a => a !== ax), wAx = sz[others[0]] > sz[others[1]] ? others[0] : others[1];
  const p = g.attributes.position, L = sz[ax], s = mesh.getWorldScale(new THREE.Vector3())[ax] || 1, mid = bb.min[ax] + L * .58, band = .035 / (s * (justin.model.scale.x || 1)), deep = .011 / (s * (justin.model.scale.x || 1));
  let wmax = -1e9; for (let i = 0; i < p.count; i++) { const a = p.getComponent(i, 'xyz'.indexOf(ax)); if (Math.abs(a - mid) < L * .08) wmax = Math.max(wmax, p.getComponent(i, 'xyz'.indexOf(wAx))); }
  const wi = 'xyz'.indexOf(wAx), ai = 'xyz'.indexOf(ax);
  for (let i = 0; i < p.count; i++) { const a = p.getComponent(i, ai), w = p.getComponent(i, wi); const k = 1 - Math.abs(a - mid) / (band / 2); if (k <= 0 || w < wmax - deep * 1.6) continue; p.setComponent(i, wi, w - deep * k); }
  p.needsUpdate = true; g.computeVertexNormals(); }

// Schwert an die linke Hüfte: Klinge schräg nach unten hinten, Griff am Gürtel (statt quer in der Hand)
function justin_schwertGuertel() { const S = justin_S, pel = S.bones.pelvis; let m = null; justin.sword.traverse(o => { if (!m && o.isMesh) m = o; }); if (!m || !pel) return; justin.model.updateMatrixWorld(true);
  const g = m.geometry; g.computeBoundingBox(); const bb = g.boundingBox, sz = bb.getSize(new THREE.Vector3()), ax = [sz.x, sz.y, sz.z], order = [0, 1, 2].sort((i, j) => ax[j] - ax[i]), ai = order[0], wi = order[1];
  const p = g.attributes.position, L = ax[ai], lo = bb.min.getComponent(ai), wid = f => { let mn = 1e9, mx = -1e9; for (let i = 0; i < p.count; i++) { const a = p.getComponent(i, ai); if (Math.abs(a - (lo + L * f)) < L * .04) { const w = p.getComponent(i, wi); mn = Math.min(mn, w); mx = Math.max(mx, w); } } return mx - mn; };
  const tipHi = wid(.93) < wid(.07); // das spitze Ende ist schmaler als der Knauf
  const a = new THREE.Vector3().setComponent(ai, tipHi ? 1 : -1), w = new THREE.Vector3().setComponent(wi, 1), n = new THREE.Vector3().crossVectors(a, w);
  const griff = new THREE.Vector3((bb.min.x + bb.max.x) / 2, (bb.min.y + bb.max.y) / 2, (bb.min.z + bb.max.z) / 2).setComponent(ai, tipHi ? lo + L * .12 : lo + L * .88);
  const vorn = justin_vorn(new THREE.Vector3()), links = new THREE.Vector3().crossVectors(JUSTIN_UP, vorn).normalize(), hp = pel.getWorldPosition(new THREE.Vector3());
  const D = new THREE.Vector3(0, -1, 0).addScaledVector(vorn, -.42).addScaledVector(links, .08).normalize(), Wd = vorn.clone().sub(D.clone().multiplyScalar(vorn.dot(D))).normalize(), N = new THREE.Vector3().crossVectors(D, Wd);
  const R = new THREE.Matrix4().makeBasis(D, Wd, N).multiply(new THREE.Matrix4().makeBasis(a, w, n).invert()), sc = m.getWorldScale(new THREE.Vector3());
  const pos = hp.clone().addScaledVector(links, .25).addScaledVector(vorn, .06).addScaledVector(JUSTIN_UP, .02);
  const Mw = new THREE.Matrix4().makeTranslation(pos.x, pos.y, pos.z).multiply(R).multiply(new THREE.Matrix4().makeScale(sc.x, sc.y, sc.z)).multiply(new THREE.Matrix4().makeTranslation(-griff.x, -griff.y, -griff.z));
  const Ml = new THREE.Matrix4().copy(pel.matrixWorld).invert().multiply(Mw); Ml.decompose(m.position, m.quaternion, m.scale); pel.add(m); justin.sword = m; }
// Flicken: Ranzenriemen (linker Unterarm), Gürtelschnalle mit Turm (vorn am Gürtel), Bindfaden/Draht (rechter Oberarm), Stundenbuch in der Tasche (links an der Hüfte), Feder im Helmband
function justin_flicken() { const S = justin_S, B = S.bones, M = justin.model; M.updateMatrixWorld(true); const vorn = justin_vorn(new THREE.Vector3()), links = new THREE.Vector3().crossVectors(JUSTIN_UP, vorn);
  const put = (bone, dirW, mesh, off = .004, spin = 0) => { const f = justin_flaeche(bone, dirW, S.skins); if (!f) return null; mesh.position.copy(f.p).addScaledVector(f.n, off);
    mesh.quaternion.setFromUnitVectors(_jv.set(0, 0, 1), f.n); if (spin) mesh.rotateZ(spin); bone.add(mesh); return mesh; };
  // Ranzenriemen als Band um den linken Unterarm (Streifen, der sich an die Armschiene legt)
  if (B.lowerarm_l && B.hand_l) { const a = B.lowerarm_l.getWorldPosition(new THREE.Vector3()), h = B.hand_l.getWorldPosition(new THREE.Vector3()), ax = h.clone().sub(a), len = ax.length(); ax.normalize();
    const ctr = a.clone().addScaledVector(ax, len * .42); const pts = []; const vtmp = new THREE.Vector3();
    for (const m of S.skins) { const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { vtmp.fromBufferAttribute(p, i); m.applyBoneTransform(i, vtmp); vtmp.applyMatrix4(m.matrixWorld); const d = vtmp.clone().sub(ctr), along = d.dot(ax); if (Math.abs(along) < .02) { const r = d.addScaledVector(ax, -along); if (r.length() < .13) pts.push(r); } } }
    const e1 = new THREE.Vector3().crossVectors(ax, JUSTIN_UP).normalize(), e2 = new THREE.Vector3().crossVectors(ax, e1).normalize(), seg = 40, rr = new Array(seg).fill(.045);
    for (const r of pts) { const ang = Math.atan2(r.dot(e2), r.dot(e1)), k = ((Math.round(ang / (Math.PI * 2) * seg) % seg) + seg) % seg; rr[k] = Math.max(rr[k], r.length()); }
    for (let pass = 0; pass < 2; pass++) for (let k = 0; k < seg; k++) rr[k] = Math.max(rr[k], (rr[(k + seg - 1) % seg] + rr[(k + 1) % seg]) / 2 * .98);
    const wdt = .032, pos = [], uv = [], ind = []; const inv = new THREE.Matrix4().copy(B.lowerarm_l.matrixWorld).invert();
    for (let k = 0; k <= seg; k++) { const ang = k / seg * Math.PI * 2, r = rr[k % seg] + .0035; for (const s of [-1, 1]) { const w = ctr.clone().addScaledVector(e1, Math.cos(ang) * r).addScaledVector(e2, Math.sin(ang) * r).addScaledVector(ax, s * wdt / 2 + Math.sin(ang * 3) * .002).applyMatrix4(inv); pos.push(w.x, w.y, w.z); uv.push(k / seg, s < 0 ? 0 : 1); } }
    for (let k = 0; k < seg; k++) { const i = k * 2; ind.push(i, i + 2, i + 1, i + 1, i + 2, i + 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ind); g.computeVertexNormals();
    const rm = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: JUSTIN_TEX.riemen(), roughness: .78, side: THREE.DoubleSide })); rm.castShadow = true; rm.userData.jFlick = true; rm.name = 'riemen_hr'; rm.frustumCulled = false; B.lowerarm_l.add(rm); S.riemen = rm; }
  // Gürtelschnalle, verchromt und stumpf (vorn, Becken)
  const pel = B.pelvis || B.spine_01; if (pel) { const d = justin_decal(JUSTIN_TEX.schnalle(), .075, .056, { rough: .45, metal: .8 }); d.name = 'schnalle_turm'; S.schnalle = put(pel, vorn.clone().addScaledVector(JUSTIN_UP, .15).normalize(), d, .006); }
  // Bindfaden und Draht um den rechten Oberarm
  if (B.upperarm_r) { const d = justin_decal(JUSTIN_TEX.faden(), .07, .07, { alpha: true, rough: .9 }); put(B.upperarm_r, links.clone().negate().addScaledVector(vorn, .5).normalize(), d, .005, .3); }
  // Stundenbuch in der Ledertasche an der linken Hüfte (Scan w_buch, handgroß)
  if (pel && typeof msModel === 'function') msModel('w_buch', 'model.glb').then(o => { const b = o.clone(); const bb = new THREE.Box3().setFromObject(b), sz = bb.getSize(new THREE.Vector3()), s = .15 / Math.max(sz.x, sz.y, sz.z); b.scale.setScalar(s / (justin.model.scale.x || 1));
    const f = justin_flaeche(pel, links.clone().addScaledVector(vorn, .25).addScaledVector(JUSTIN_UP, -.3).normalize(), S.skins, .45); if (!f) return; b.position.copy(f.p).addScaledVector(f.n, .03 / (justin.model.scale.x || 1)); b.quaternion.setFromUnitVectors(_jv.set(0, 0, 1), f.n);
    b.traverse(m => { if (m.isMesh) { m.castShadow = true; m.userData.jFlick = true; m.frustumCulled = false; } }); b.userData.jFlick = true; b.name = 'stundenbuch'; pel.add(b); S.buch = b; }).catch(e => console.warn('Justin Stundenbuch', e));
  // Feder im Helmband: zwei gekreuzte Karten, schräg nach hinten oben
  if (S.helm) { const H = S.helm, ft = JUSTIN_TEX.feder(), fm = new THREE.MeshStandardMaterial({ map: ft, alphaTest: .4, side: THREE.DoubleSide, roughness: .35, metalness: .1, color: 0x9aa0b0 });
    const fg = new THREE.Group(); fg.name = 'feder'; fg.userData.jFlick = false; const s = 1 / (justin.model.scale.x || 1); for (const r of [0, Math.PI / 2]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(.045 * s, .18 * s), fm); p.position.y = .08 * s; p.rotation.y = r; p.castShadow = true; fg.add(p); }
    const hi = S.helmInfo, base = H.c.clone().addScaledVector(S.hU, hi.uBand + (hi.umax - hi.uBand) * .15).addScaledVector(S.hR, hi.med * 1.02).addScaledVector(S.hF, -hi.med * .25);
    fg.position.copy(base); fg.quaternion.setFromUnitVectors(_jv.set(0, 1, 0), S.hU.clone().addScaledVector(S.hF, -.55).addScaledVector(S.hR, .25).normalize()); H.shell.parent.add(fg); S.feder = fg; } }

// Gesicht: Haar (Locken) und Bart aus kopf.glb in den Kopfknochen; Augen drehen im Shader um ihre Mitte; Lider als Form (Morph) am Kopf
async function justin_kopf() { const S = justin_S, B = S.bones; if (!B.head) return;
  let g = null; try { g = await MSL.gl.loadAsync('assets/chars/justin/kopf.glb'); } catch (e) { console.warn('Justin kopf.glb fehlt', e); }
  if (g) { const list = []; g.scene.traverse(o => { if (o.isMesh) list.push(o); });
    for (const o of list) { B.head.add(o); o.position.set(0, 0, 0); o.quaternion.identity(); o.scale.set(1, 1, 1); o.frustumCulled = false; o.castShadow = false; o.receiveShadow = true;
      const haar = /haar|hair|scalp/i.test(o.name); const mats = [].concat(o.material).map(m => justin_haarMat(m, haar ? 'haar' : 'bart')); o.material = mats.length === 1 ? mats[0] : mats;
      (haar ? S.hair : S.beard).push(o); } }
  // Augen: Mitte je Auge im Objektraum des Augen-Netzes
  const E = S.eyeMesh; if (E) { const bindToBone = new THREE.Matrix4(), bi = E.skeleton.bones.indexOf(E.skeleton.bones.find(b => b.name === 'head')); if (bi >= 0) bindToBone.copy(E.skeleton.boneInverses[bi]).multiply(E.bindMatrix);
    const boneToBind = bindToBone.clone().invert(), p = E.geometry.attributes.position, v = new THREE.Vector3(), cL = new THREE.Vector3(), cR = new THREE.Vector3(); let nL = 0, nR = 0; const U = S.hU, F = S.hF, R = S.hR;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(bindToBone); if (v.dot(R) > 0) { cL.add(v); nL++; } else { cR.add(v); nR++; } } cL.multiplyScalar(1 / nL); cR.multiplyScalar(1 / nR);
    // Augapfel-Mitte liegt hinter der Hornhaut: um 1,1 cm nach hinten
    const back = F.clone().multiplyScalar(-.011); cL.add(back); cR.add(back);
    const oL = cL.clone().applyMatrix4(boneToBind), oR = cR.clone().applyMatrix4(boneToBind), splitN = R.clone().transformDirection(boneToBind), splitD = oL.clone().add(oR).multiplyScalar(.5).dot(splitN);
    S.eyes = { rot: { value: new THREE.Matrix3() }, cL: { value: oL }, cR: { value: oR }, sn: { value: splitN }, sd: { value: splitD }, b2o: new THREE.Matrix3().setFromMatrix4(boneToBind), o2b: new THREE.Matrix3().setFromMatrix4(bindToBone), cBoneL: cL, cBoneR: cR };
    for (const m of [].concat(E.material)) { m.onBeforeCompile = sh => { Object.assign(sh.uniforms, { uEyeRot: S.eyes.rot, uEyeL: S.eyes.cL, uEyeR: S.eyes.cR, uEyeN: S.eyes.sn, uEyeD: S.eyes.sd });
        sh.vertexShader = 'uniform mat3 uEyeRot; uniform vec3 uEyeL, uEyeR, uEyeN; uniform float uEyeD;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          { vec3 ec = dot(transformed, uEyeN) > uEyeD ? uEyeL : uEyeR; transformed = ec + uEyeRot * (transformed - ec); }`).replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n objectNormal = uEyeRot * objectNormal;'); };
      m.customProgramCacheKey = () => 'justin_auge'; m.needsUpdate = true; if (m.isMeshStandardMaterial) { m.roughness = Math.min(m.roughness, .08); m.envMapIntensity = 1.4; } } }
  // Lider: Form „blinzeln“ – Oberlid gleitet über den Augapfel, Unterlid hebt sich ein wenig
  const H = S.headSkin; if (H && S.eyes) { const bi = H.skeleton.bones.findIndex(b => b.name === 'head'), b2h = new THREE.Matrix4().copy(H.skeleton.boneInverses[bi]).multiply(H.bindMatrix), h2b = b2h.clone().invert();
    const p = H.geometry.attributes.position, d = new Float32Array(p.count * 3), v = new THREE.Vector3(), dv = new THREE.Vector3(), U = S.hU, F = S.hF, R = S.hR; let n = 0;
    const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(b2h); for (const c of [S.eyes.cBoneL, S.eyes.cBoneR]) { const r = v.clone().sub(c), s = r.dot(R), u = r.dot(U), f = r.dot(F);
        if (f < .004 || Math.abs(s) > .026) continue; const lat = 1 - sm(.014, .025, Math.abs(s)); if (lat <= 0) continue;
        let du = 0, df = 0; if (u > -.001 && u < .02) { const w = (1 - sm(.009, .02, u)) * lat; du = -(u + .0015) * .92 * w; df = .0022 * w * (1 - sm(.0, .012, u)); }
        else if (u <= -.001 && u > -.012) { const w = (1 - sm(-.004, -.012, u)) * lat * .3; du = (-u) * .45 * w; }
        if (du || df) { dv.set(0, 0, 0).addScaledVector(U, du).addScaledVector(F, df).transformDirection(h2b).multiplyScalar(Math.hypot(du, df)); d[i * 3] += dv.x; d[i * 3 + 1] += dv.y; d[i * 3 + 2] += dv.z; n++; } } }
    if (n) { H.geometry = H.geometry.clone(); H.geometry.morphAttributes.position = [new THREE.BufferAttribute(d, 3)]; H.geometry.morphTargetsRelative = true; H.updateMorphTargets(); H.morphTargetInfluences[0] = 0; S.lid = H; } }
}
function justin_haarMat(src, art) { const m = new THREE.MeshStandardMaterial({ map: src.map || null, alphaMap: src.alphaMap || null, normalMap: src.normalMap || null, alphaTest: art === 'haar' ? .42 : .38, side: THREE.DoubleSide, roughness: .5, metalness: 0,
  color: 0xffffff, transparent: false, envMapIntensity: .22 });
  // Farbe: braun (Wurzel dunkel, Spitzen etwas heller); Glanzband quer über den Karten
  m.onBeforeCompile = sh => { sh.uniforms.uFlat = { value: 0 }; sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
    { float l = dot(diffuseColor.rgb, vec3(.3, .59, .11)); vec3 wurzel = vec3(.016, .009, .005), spitze = vec3(.105, .058, .03); diffuseColor.rgb = mix(wurzel, spitze, pow(clamp(l * 1.3, 0., 1.), 1.4))${art === 'bart' ? ' * .92' : ''}; }`); };
  m.customProgramCacheKey = () => 'justin_haar_' + art; return m; }

// Geh-Clip vermessen: Geschwindigkeit des aufgesetzten Fußes = Körpergeschwindigkeit
function justin_schrittMessen() { const S = justin_S, B = S.bones, W = justin.acts.walk; if (!W || !B.foot_l) return; const clip = W.getClip(), mx = new THREE.AnimationMixer(justin.model), a = mx.clipAction(clip); a.play();
  const n = 60, dt = clip.duration / n, ys = [], zs = []; const inv = new THREE.Matrix4(); for (let i = 0; i <= n; i++) { mx.setTime(i * dt); justin.model.updateMatrixWorld(true); inv.copy(justin.model.matrixWorld).invert();
    const p = B.foot_l.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv); ys.push(p.y); zs.push(p.z); }
  mx.stopAllAction(); mx.uncacheRoot(justin.model); justin.mixer.update(0);
  const ymin = Math.min(...ys); let vs = [], sc = justin.model.scale.x || 1; for (let i = 1; i <= n; i++) if (ys[i] < ymin + (Math.max(...ys) - ymin) * .15) vs.push(Math.abs(zs[i] - zs[i - 1]) / dt);
  const vClip = vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length * sc : 1.2; S.vClip = vClip; S.walkV = 1.05; // schwer, langsam (81 §1.11)
  S.footMin = ymin * sc; }

// ---------------------------------------------------------------- Handlungen (Visier, Helm, Brustplatte, Geben, Knien)
function justin_zeit(ms) { return wait(ms); }
// Visier hoch für sek Sekunden, dann zu (UK 4, erstes Gesicht, 02 B1)
async function justin_visier(sek = 2) { const S = justin_S; if (!S.helm) return; S.faceShown++; S.hairFlatZiel = .22; S.visierZiel = 1; justin_klang('visierAuf'); await wait(700 + sek * 1000); S.visierZiel = 0; await wait(520); justin_klang('visierZu'); await wait(200); }
// Helm ab (Raum 3, zweites Gesicht): beide Hände an den Helm, anheben, in die linke Hand, unter den Arm; das Haar richtet sich langsam auf
async function justin_helmAb() { const S = justin_S; if (!S.helm || S.helmZiel === 1) return; S.faceShown++; if (S.spiegel && S.spiegel.material.map) S.spiegel.visible = true; S.helmZiel = 1; S.hairFlat = .12; S.hairFlatZiel = .12; justin_klang('helmAb'); await wait(2300); S.hairFlatZiel = 1; }
async function justin_helmAuf(langsam = false) { const S = justin_S; if (!S.helm || S.helmZiel === 0) return; S.helmLangsam = langsam; S.helmZiel = 0; if (S.spiegel) S.spiegel.visible = false; await wait(langsam ? 3400 : 2200); justin_klang('visierZu'); S.hairFlat = S.hairFlatZiel = .12; }
// Brustplatte (Antwort A): zweimal ziehen, die Nähte werden heller, Whiskey schlägt mit den Flügeln
async function justin_brustZerren() { const S = justin_S; S.zerren = 1; S.zerrT = 0; justin_klang('zerren'); await wait(1700); justin_klang('zerren'); if (typeof whiskey_S !== 'undefined' && whiskey_S.mx && typeof whiskey_play === 'function') try { whiskey_play('Flap', .1); } catch (e) {} await wait(1700); S.zerren = 0; }
// Etwas geben: rechte Hand zu Luke (C: linke Hand auf Lukes Narbe – die Hand geht zu seiner linken Seite)
async function justin_geben() { const S = justin_S; S.geben = 1; await wait(1500); S.geben = 0; await wait(600); }
function justin_knien(an) { const S = justin_S, K = justin.acts.knien, I = S.mocapInfo || {};
  if (!K) { S.knieZiel = an ? 1 : 0; return; }
  if (an) { K.reset(); K.time = I.knienVon || 0; K.timeScale = .85; justin_ueberblend(K, .4); S.kniet = 'runter'; }
  else if (S.kniet) { K.paused = false; K.timeScale = -.8; S.kniet = 'hoch'; } }
// Geräusche: Schritt (Stein auf Stein), Visier, Helm, Zerren – aus vorhandenen Aufnahmen tief gelegt
function justin_klang(k, x, y, z) { if (!Audio.ctx) return; const g = justin.g.position; x = x ?? g.x; y = y ?? 1.6; z = z ?? g.z; const P = (n, o) => Audio.play(n, { x, y, z, ref: 3, ...o });
  if (k === 'schritt') { justin_schabenBuf(); P('justinSchaben', { gain: .5, vary: .06, varyGain: .15, ref: 4 }); return; }
  if (k === 'visierAuf') { P('metalOpen', { gain: .22, rate: .62, dur: .7, lp: 2200 }); P('scrape2', { gain: .12, rate: .5, dur: .5, lp: 1400 }); return; }
  if (k === 'visierZu') { P('metalClose', { gain: .25, rate: .7, dur: .5, lp: 2000 }); return; }
  if (k === 'helmAb') { P('scrape1', { gain: .18, rate: .45, dur: 1.1, lp: 1300 }); P('metalSheet', { gain: .08, rate: .6, dur: .8, lp: 1800, delay: .9 }); return; }
  if (k === 'zerren') { P('scrape3', { gain: .3, rate: .38, dur: 1.2, lp: 900 }); P('stones1', { gain: .15, rate: .5, dur: .6, lp: 800, delay: .4 }); return; } }
// Justins eigenes Schritt-Sample (81 §1.11: kein Klirren, tiefes Schaben, fast wie Stein auf Stein) – einmal aus zwei Aufnahmen gemischt
function justin_schabenBuf() { const A = Audio; if (!A.buf || A.buf.justinSchaben || !A.buf.stones1 || !A.buf.scrape2) return; const ctx = A.ctx, sr = ctx.sampleRate, len = Math.floor(sr * .62), out = ctx.createBuffer(1, len, sr), o = out.getChannelData(0);
  const src = (b, rate, off, gain) => { const d = b.getChannelData(0), f = b.sampleRate / sr * rate; let lp = 0; for (let i = 0; i < len; i++) { const j = Math.floor(off * b.sampleRate + i * f); if (j >= d.length) break; lp += (d[j] - lp) * .08; o[i] += lp * gain; } };
  src(A.buf.stones1, .55, .05, 2.2); src(A.buf.scrape2, .42, .1, 1.4);
  let pk = 0; for (let i = 0; i < len; i++) { const t = i / len, env = Math.min(1, t * 40) * Math.pow(1 - t, 1.6); o[i] *= env; pk = Math.max(pk, Math.abs(o[i])); } if (pk > 0) for (let i = 0; i < len; i++) o[i] *= .9 / pk; A.buf.justinSchaben = out; }

// ---------------------------------------------------------------- Ankunft (UK 4) – ersetzt den alten justinArrives-Inhalt (Basis ruft justin_ankunft)
async function justin_ankunft() {
  const S = justin_S; ch3.met = true; state.talking = true; justin.look = true;
  Audio.stinger(true); lamps.forEach(L => L.mode = 'flicker'); ch3.pillarK = 1; Audio.hum(true); shake = .03;
  subtitle('Am Ende der Straße fällt Licht vom Himmel. Weiß. Lautlos.', 3800);
  const P0 = player.pos, sx = THREE.MathUtils.clamp(P0.x + (P0.x > 20 ? -24 : 24), -62, 62);
  pillar.position.set(sx, 35, 0); pillarLight.position.set(sx, 3, 0);
  jPlace(sx, 0, sx > P0.x ? -PI / 2 : PI / 2); justin.g.visible = true; S.helmZiel = 0; S.visierZiel = 0; await wait(3200);
  lamps.forEach(L => L.mode = 'pulse');
  const P = player.pos, dx = P.x - sx, dz = P.z, d = Math.hypot(dx, dz) || 1, tx = P.x - dx / d * 6, tz = P.z - dz / d * 6;
  subtitle('Jemand tritt aus dem Licht. Groß. Platten, die matt schimmern, nicht wie Stahl, eher wie nasser Schiefer. Metall schabt auf Metall.', 4800);
  await new Promise(r => jWalk(tx, tz, r));
  ch3.pillarK = .35; Audio.hum(false);
  // Luke sieht ihn an (sanft, nicht ruckartig), dann das Visier: zwei Sekunden Gesicht
  justin_augenAufIhn(1.1); await justin_sprich('ank1', { frei: false }); await wait(300);
  const v = justin_visier(2); await wait(900); justin_gedanke(JUSTIN_BANK.ankBlick[0][0], 3600); await v; await wait(700);
  await justin_sprich('ank2', { frei: false });
  justin_blick(justin_laterneNah()); await justin_sprich('ank3', { frei: false }); justin_blick(null);
  // W-06: Whiskey landet auf dem linken Panzerhandschuh (whiskey.js, Station 'handschuh') – Justin hält den Arm ruhig hin
  state.talking = false; S.phase = 'w06'; const t0 = performance.now(); while (performance.now() - t0 < 9000 && !(typeof whiskey_S === 'undefined' || whiskey_S.jAsked)) await wait(250);
  while (state.talking) await wait(200); state.talking = true; S.phase = '';
  await justin_sprich('peter1', { frei: false }); await wait(1400); await justin_sprich('peter2', { frei: false });
  // Der Schokoriegel: Visier bleibt unten, der Helmrand geht einen Fingerbreit hoch
  await justin_sprich('riegel1', { frei: false }); S.visierZiel = .12; justin_klang('visierAuf'); await wait(1600); S.visierZiel = 0; await wait(2600); await justin_sprich('riegel2', { frei: false });
  if (typeof whiskey_S !== 'undefined') whiskey_S.riegelPapier = true;
  story.lore.push({ key: 'c3_justin', title: 'Justin', html: '<span class="hand">Laterne laufen: wach sind nur die Laternen, vor denen sie dieses Jahr einen geholt hat. Vier Augen. Alle vier aus = sie muss runter.\nSie hat einen Namen. Luna. Er hat sie mir nicht wie eine Tote genannt.</span>' });
  state.talking = false; S.phase = 'uk4'; S.uk4 = { t: 0, x: player.pos.x, z: player.pos.z };
  setC3('Justin steht an der Kreuzung. Sprich mit ihm, sieh dich um – oder geh los.');
}
// Pflichtsätze, sobald Luke weitergehen will (oder nach einer Weile)
async function justin_pflicht() { const S = justin_S; if (S.phase !== 'uk4') return; S.phase = 'pflicht'; state.talking = true;
  // F3 Verständlichkeit (Nutzer 01.10.2026): pflicht1 sagt „meine Tochter“; wer die Happen übersprungen hat, hört vorher „herz“ (seine Tochter). Den Namen gibt es nur auf Nachfrage.
  if (!S.said.has('herz')) await justin_sprich('herz', { frei: false });
  await justin_sprich('naeher', { frei: false }); await justin_sprich('siebzehn', { frei: false }); // V-1: Pflicht (schon gesagt → übersprungen)
  await justin_sprich('pflicht1', { frei: false }); await justin_sprich('pflicht2', { frei: false }); await justin_sprich('pflicht3', { frei: false });
  state.talking = false; setC3(typeof KAPITEL3_ZIEL_LATERNEN !== 'undefined' ? KAPITEL3_ZIEL_LATERNEN : 'Der eiserne Kasten an der Kreuzung spricht noch. Und Frau Wendt in Nr. 7 hat alles aufgeschrieben.');
  justin_gedanke(JUSTIN_BANK.ankEnde[0][0], 4600);
  jWalk(1.5, -5.2, () => { justin.look = true; }); ch3.ringing = true; S.phase = 'stadt';
  setTimeout(() => { if (!ch3.callDone) subtitle('Das Telefon an der Kreuzung klingelt.', 3200); }, 9000); }
function justin_laterneNah() { let b = null, bd = 1e9; for (const L of lamps) { const d = Math.hypot(L.wx - justin.g.position.x, L.wz - justin.g.position.z); if (d < bd && d > 4) { bd = d; b = L; } } return b ? new THREE.Vector3(b.wx, 5.1, b.wz) : null; }
// Spielerkamera sanft auf Justins Gesicht richten (nur Blickrichtung, keine Steuerung weggenommen)
function justin_augenAufIhn(sek) { justin_S.camHin = { t: 0, sek }; }

// ---------------------------------------------------------------- Fragen an Justin (Stadt): Auswahl je nach Stand der Nacht; RH-3 zählt
const JUSTIN_FRAGEN = [
  { id: 'name', q: 'Wie heißt sie?', wenn: () => true },
  { id: 'miraUk4', q: 'Was sucht sie?', wenn: () => true, danach: 'miraUk4b' },
  { id: 'ruestung', q: 'Was ist das für ein Metall?', wenn: () => true, danach: 'ruestung2', vor: () => { const b = justin_S.bones.spine_05; if (b) justin_klang('zerren'); } },
  { id: 'rh3', q: 'Und in siebenhundert Jahren hast du sie nie gefunden?', wenn: () => true, danach: 'rh3b', rh: 'RH-3' },
  { id: 'ufo', q: 'Sag jetzt nicht UFO.', wenn: () => true },
  { id: 'ostende', q: 'Warst du das? Am Ende der Straße?', wenn: () => true },
  { id: 'lucy', q: 'Wo ist Lucy?', wenn: () => justin_laternenAus() >= 1 },
  { id: 'zeit', q: 'Siebenhundert Jahre. Du siehst aus wie vierzig.', wenn: () => justin_laternenAus() >= 2 },
  { id: 'zeitSpaeter', q: 'Wird Lucy da drin älter?', wenn: () => justin_S.said.has('zeit') },
  { id: 'luna', q: 'Deine Tochter. Die im Keller. Das war sie?', wenn: () => justin_laternenAus() >= 3, danach: 'lunaWeiter' },
  { id: 'mira', q: 'Und deine Frau?', wenn: () => ch3.lampsOff, danach: 'mira2' },
  { id: 'wise4', q: 'Wie alt ist der eigentlich? Vegas sagt, der saß schon ’75 auf der Laterne.', wenn: () => typeof whiskey_S !== 'undefined' && whiskey_S.jAsked },
  { id: 'geist', q: 'Bist du ein Geist?', wenn: () => true },
  { id: 'jahre', q: 'Was hast du all die Jahre gemacht?', wenn: () => true },
  { id: 'drache', q: 'Ein Ritter. Fehlt nur noch der Drache.', wenn: () => true },
  { id: 'sicher', q: 'Und du bist sicher, dass das klappt?', wenn: () => ch3.radio },
];
function justin_laternenAus() { return (ch3.seq && ch3.seq.length) || (ch3.lampsOff ? 4 : 0); }
function justin_fragen() { const offen = JUSTIN_FRAGEN.filter(f => !justin_S.said.has(f.id) && f.wenn()).slice(0, 6); if (!offen.length) return false; let pick = null;
  openPuzzle(`<h3>JUSTIN</h3><p>Er wartet. Die Platten atmen nicht mit ihm.</p><div class="row" style="flex-direction:column;align-items:center;gap:10px">${offen.map(f => `<button data-k="${f.id}" style="min-width:420px">${f.q}</button>`).join('')}<button data-k="-" style="min-width:420px;opacity:.75">NICHTS</button></div>`, box => {
    box.querySelectorAll('button[data-k]').forEach(b => b.onclick = e => { e.stopPropagation(); pick = b.dataset.k; closeOverlay(); }); });
  ui.onClose = () => setTimeout(async () => { const f = JUSTIN_FRAGEN.find(x => x.id === pick); if (!f) return; if (f.vor) f.vor(); if (f.rh) justin_rh(f.rh);
    state.talking = true; await justin_sprich(f.id, { frei: false }); if (f.danach) { await wait(700); await justin_sprich(f.danach, { frei: false }); } state.talking = false; }, 250);
  return true; }
// jHint (Basis) in der Stadt: erst die Fragen, dann ein Hinweis in seinen Worten
jHint = (o => async function () {
  if (state.talking || !ch3.met || justin_S.gone) return; if (ch3.part !== 'town') return; // drinnen redet er nur, wenn es die Nacht verlangt
  if (ch3.chase !== 'idle') return;
  if (justin_S.phase === 'uk4' || justin_S.phase === 'stadt') { if (justin_fragen()) return; }
  state.talking = true; const L = !ch3.radio ? JUSTIN_BANK.pflicht3 : !ch3.lampsOff ? [JUSTIN_BANK.pflicht2[0]] : [['„Komm.“', 1500, JS]]; await say(L); state.talking = false; })(jHint);

// ---------------------------------------------------------------- Die Wahl: Antwort, letzte Worte, Geschenk, Rüstungs-Hinweise, „Noch eine Runde“ (3.14/3.15, 02 B3)
async function justin_antwort(c) { const S = justin_S; ch3.choice = c; ch3.answer = c; state.talking = true; justin.look = true;
  const DU = { A: '„Dich. Dass du bleibst.“', B: '„Spielen. Sieben Kinder, wie damals.“', C: '„Dass du sie suchst.“' }[c]; await say([[DU, 2400, 'DU']]);
  justin_knien(false); await wait(900);
  if (c === 'A') { await say([['Justin nickt. Er greift an die Schnallen der Brustplatte und zieht. Die Platte gibt nicht nach.', 4200]]); await justin_brustZerren(); await say([['Unter dem Rand der Platte ist die Haut grau, glatt, ohne Linien.', 3600]]);
    await justin_sprich('A1', { frei: false }); await justin_helmAuf(); await justin_sprich('A2', { frei: false }); }
  if (c === 'B') { justin_blick(new THREE.Vector3(X3 + 42, .9, Z3)); await say([['Justin sieht auf die Stühle. Auf Zayn, der Bruno festhält.', 3400]]); await justin_sprich('B1', { frei: false }); justin_blick(null); await wait(900);
    await justin_sprich('B2', { frei: false }); await justin_helmAuf(); }
  if (c === 'C') { await say([['Justin sieht dich lange an. Zum ersten Mal richtig.', 3400]]); await justin_sprich('C1', { frei: false }); await wait(900);
    if (typeof graukind !== 'undefined') justin_blick(graukind.position.clone().setY(1)); await justin_sprich('C2', { frei: false }); justin_blick(null); await justin_sprich('C3', { frei: false }); await justin_helmAuf(true); }
  // Letzte Worte und Geschenk
  await justin_sprich(c + 'letzt', { frei: false }); await wait(500);
  const G = JUSTIN_GABEN[c]; modItem(G[0], G[1], G[2], 'paper');
  if (c === 'A') { await say([['Er löst den Lederriemen von seinem linken Arm und drückt ihn dir in die Hand.', 3600]]); if (S.riemen) S.riemen.visible = false; }
  if (c === 'B') await say([['Er zieht aus der Tasche am Gürtel den zweiten Schokoriegel, halb gegessen, ordentlich in Silberpapier gefaltet.', 4400]]);
  if (c === 'C') { await say([['Er löst die stumpfe Schnalle von seinem Gürtel und legt sie dir in die linke Hand, genau auf die Narbe.', 4200]]); if (S.schnalle) S.schnalle.visible = false; }
  const gb = justin_geben(); await wait(900); addItem(G[0]); ch3.gift = G[0]; await gb;
  await justin_sprich(c + 'geschenk', { frei: false }); if (JUSTIN_BANK[c + 'geschenk2']) { await wait(900); await justin_sprich(c + 'geschenk2', { frei: false }); }
  // Rüstungs-Hinweise ≥ 3: der Flicken (zusätzlich)
  if (justin_rhZahl() >= 3) { await justin_sprich('rhJa', { frei: false }); await say([['Er bricht einen losen Flicken von der Innenseite des rechten Armschutzes, so groß wie eine Münze.', 3800]]); justin_klang('zerren');
    const F = JUSTIN_GABEN.F; modItem(F[0], F[1], F[2], 'paper'); await justin_geben(); addItem(F[0]); await justin_sprich('rhFlicken', { frei: false }); }
  else await say(JUSTIN_BANK.rhNein);
  try { if (typeof saveGame === 'function') saveGame(3); } catch (e) {}
  await justin_runde(); await justin_ende(c); }
// „Noch eine Runde“: er lässt Lukes Hand los, Whiskey hüpft zu Luke, Justin geht in Rüstung ins Dunkel, wird kleiner, bis man nur noch das Schaben hört
async function justin_runde() { const S = justin_S; S.phase = 'runde'; justin.look = true;
  await say([['Justin lässt deine Hand los. Erst jetzt.', 3000]]); if (typeof whiskey_S !== 'undefined') { whiskey_S.jRunde = true; } await wait(1200);
  justin.look = false; const CX = X3 + 42, CZ = Z3, gx = justin.g.position.x, gz = justin.g.position.z, dx = CX - gx, dz = CZ - gz, d = Math.hypot(dx, dz) || 1;
  const L = JUSTIN_BANK.runde; say([L[0]]); await wait(3600); say([L[1]]); await wait(2400);
  jWalk(CX + dx / d * 6.5, CZ + dz / d * 6.5); say([L[2]]); await wait(1500); say([L[3]]); await wait(1500); say([L[4]]); await wait(2400); justin_weg(); state.talking = false; }
function justin_weg() { const S = justin_S; S.gone = true; justin.g.visible = false; justin.path = null; S.helmZiel = S.helmAb = 0; if (S.helm && S.helm.grp.parent !== S.helm.head) { S.helm.head.add(S.helm.grp); S.helm.grp.position.set(0, 0, 0); S.helm.grp.quaternion.copy(S.helm.base); S.helm.grp.scale.set(1, 1, 1); } }
// Nach „Noch eine Runde“: Weißblende, Abspann „Wie jeden Morgen“, Endkarte je Antwort (Texte wie bisher in Basis/weiss.js)
async function justin_ende(c) { $('fade').style.background = '#fff'; await fade(1, 1600); await wait(700);
  if (typeof weiss_vorKino === 'function') await weiss_vorKino('k3' + c.toLowerCase());
  const T = { A: 'Er ist bei ihr geblieben.<br>Sie sieht ihn nicht. Sie hört ihn rufen.<br>Es wird hell.', B: 'Er spielt mit.<br>Sie zählt, und er zählt hinter ihr her.<br>Es wird hell.', C: 'Er sucht jetzt laut.<br>Einmal hat sie ihn gesehen. Durch dich.<br>Es wird hell.' }[c];
  c3Endcard('KAPITEL 3 — ENDE · ICH KOMME', T, 'KAPITEL 4 · SEHEN, BERGEN, SCHWEIGEN'); if (typeof kapEnde === 'function') kapEnde(3); }

// ---------------------------------------------------------------- Nachbild-Klon (figuren.js/weiss.js): jünger, ohne Flicken (Kap. 3 UK 13), ohne Gesicht
function justin_nachbildKlon(o) { const weg = []; o.traverse(m => { if (m.userData && m.userData.jFlick) weg.push(m); if (m.isMesh && /haar|hair|scalp|bart|beard|Chin|Mustache|Stubble/i.test(m.name)) weg.push(m); if (m.name === 'feder') weg.push(m); }); weg.forEach(m => m.parent && m.parent.remove(m)); return o; }

// P2: Überblenden aus den aktuellen Gewichten (Summe bleibt 1: keine Bindepose dazwischen, kein Hochspringen eines halb ausgeblendeten Clips) – ersetzt jPlay (Basis)
function justin_ueberblend(a, fade) { const wA = a.enabled && a.isScheduled() ? a.getEffectiveWeight() : 0; a.enabled = true; a.setEffectiveWeight(1); a.play();
  for (const n in justin.acts) { const b = justin.acts[n]; if (b === a || !b.enabled || !b.isScheduled()) continue; const w = b.getEffectiveWeight(); if (fade > 0 && w > .001) { b.stopFading(); b._scheduleFading(fade, w, 0); } else b.stop(); }
  if (fade > 0) a._scheduleFading(fade, wA, 1); justin.cur = a; }
jPlay = function (k, fade = .35) { const a = justin.acts[k] || justin.acts.idle; if (!a || justin.cur === a) return; if (!(a.enabled && a.isScheduled() && !a.paused && a.getEffectiveWeight() > .02) || a.loop === THREE.LoopOnce) a.reset(); justin_ueberblend(a, fade); };
// Mocap-Clip ohne Spur für manche Knochen (Knien: spine_02/04, neck_02, Drehknochen …): feste Spur aus dem Stand ergänzen – sonst mischt three.js dort die Bindepose hinein
function justin_spurenErgaenzen(clip, ref) { const has = new Set(clip.tracks.map(t => t.name)); for (const t of ref.tracks) { if (has.has(t.name)) continue; const n = t.getValueSize(); clip.tracks.push(new t.constructor(t.name, [0], Array.from(t.values.slice(0, n)))); } }

// ---------------------------------------------------------------- Bewegung: ersetzt jUpdate (Basis) – Gehen mit Fußkontakt, Drehen mit Schritten, Blick, Atmung, IK
jUpdate = function (dt) { const S = justin_S, g = justin.g; if (!justin.model) return;
  if (typeof kino_S !== 'undefined' && kino_S.on) return; // Kinosequenzen bewegen ihn selbst (kino.js; auch „Noch eine Runde“ im Abspann)
  if (S.gone) { g.visible = false; return; }
  let moving = false, turnSpeed = 0;
  if (justin.path) { const dx = justin.path.x - g.position.x, dz = justin.path.z - g.position.z, d = Math.hypot(dx, dz);
    if (d < .12) { justin.path = null; jPlay('idle', .45); const cb = justin.onArrive; justin.onArrive = null; if (cb) cb(); }
    else { // erst drehen (mit Schritten), dann gehen – beschleunigen/abbremsen
      const want = Math.atan2(dx, dz); let da = want - g.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); S.vCur = S.vCur || 0;
      const vZiel = Math.abs(da) > 1.1 ? .25 : justin.sp * Math.min(1, d / 1.2 + .25); S.vCur += (vZiel - S.vCur) * Math.min(1, dt * 2.4);
      const s = Math.min(d, S.vCur * dt); g.position.x += Math.sin(g.rotation.y) * s; g.position.z += Math.cos(g.rotation.y) * s; turnTo(want, dt * 2.6); moving = true;
      const W = justin.acts.walk; if (W) { if (justin.cur !== W) jPlay('walk', .4); W.timeScale = THREE.MathUtils.clamp(S.vCur / (S.vClip || 1.2), .35, 1.4); } } }
  else { S.vCur = 0; if (justin.look && g.position.y > -100 && !S.blickZiel && !S.kniet && S.knieZiel === 0) { const P = player.pos; const want = Math.atan2(P.x - g.position.x, P.z - g.position.z); let da = want - g.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da));
      // kleiner Winkel: nur Oberkörper/Kopf; großer: mit Schritten nachdrehen (kein Drehen auf Kufen)
      if (Math.abs(da) > .75 || S.turnStep > 0) { S.turnStep = Math.abs(da) > .12 ? .5 : Math.max(0, S.turnStep - dt); if (S.turnStep > 0) { turnSpeed = Math.sign(da); turnTo(want, dt * 1.5); } } } }
  // Drehen auf der Stelle: Gehclip langsam, Schritte hörbar
  const W = justin.acts.walk, I = justin.acts.idle;
  if (!moving) { if (turnSpeed && W) { if (justin.cur !== W) jPlay('walk', .3); W.timeScale = .45; } else if (justin.cur === W && !turnSpeed) jPlay('idle', .5); }
  if (justin.mixer) justin.mixer.update(dt);
  justin_schicht(dt, moving || !!turnSpeed); };

// Prozedurale Schicht nach der Mocap-Pose: Atmung, Blick (Kopf/Oberkörper), Augen, Lider, Visier/Helm, Arme (IK), Haare, Schritte
function justin_schicht(dt, geht) { const S = justin_S, B = S.bones, g = justin.g; if (!S.ready || !g.visible) return; const t = performance.now() / 1000;
  justin.model.updateMatrixWorld(true);
  // Schritte: Fuß setzt auf → Schaben am Fuß
  for (const [i, n] of [[0, 'foot_l'], [1, 'foot_r']]) { const f = B[n]; if (!f) continue; f.getWorldPosition(_jv); const y = _jv.y - g.position.y, down = y < (S.footMin || .08) + .035;
    if (geht && down && !S.footDown[i]) justin_klang('schritt', _jv.x, .05, _jv.z); S.footDown[i] = down; }
  // Knien per Mocap: unten halten (Atmung läuft weiter), beim Aufstehen rückwärts bis zum Stand, dann Ruhe
  if (S.kniet) { const K = justin.acts.knien, I = S.mocapInfo || {}; if (S.kniet === 'runter' && K.time >= (I.knienBis || K.getClip().duration)) { K.paused = true; S.kniet = 'unten'; }
    if (S.kniet === 'hoch' && K.time <= (I.knienVon || 0) + .05) { S.kniet = null; jPlay('idle', .5); } }
  // Knien (kein Mocap-Clip vorhanden): Becken sinkt, Oberkörper neigt sich
  S.knie += (S.knieZiel - S.knie) * Math.min(1, dt * 2.2); if (S.knie > .002 && B.pelvis) { justin.model.position.y = (justin.model.userData.y0 ?? (justin.model.userData.y0 = justin.model.position.y)) - S.knie * .42;
    // ein Knie am Boden (links), das rechte aufgestellt – Drehung um Justins Links-Achse in Weltlage (kein Verdrehen der Knochenachsen)
    const k = S.knie * S.knie * (3 - 2 * S.knie), lk = new THREE.Vector3().crossVectors(JUSTIN_UP, justin_vorn(_jv4)).normalize();
    justin_dreh(B.thigh_l, lk, .12 * k); justin_dreh(B.calf_l, lk, 1.5 * k); justin_dreh(B.foot_l, lk, -.35 * k); justin_dreh(B.thigh_r, lk, -1.42 * k); justin_dreh(B.calf_r, lk, 1.4 * k); justin_dreh(B.spine_03, lk, -.1 * k); }
  else if (justin.model.userData.y0 !== undefined) justin.model.position.y = justin.model.userData.y0;
  // Atmung: langsam, schwer (Rüstung) – Brustkorb hebt sich, Schultern gehen mit
  S.atem += dt * (S.redet ? 1.45 : 1.25); const a = Math.sin(S.atem) * .5 + .5;
  if (B.spine_05) B.spine_05.rotateX(-a * .018); if (B.clavicle_l) B.clavicle_l.rotateZ(a * .012); if (B.clavicle_r) B.clavicle_r.rotateZ(-a * .012);
  // Blickziel: Luke (Kamera) oder gesetztes Ziel; Kopf + Oberkörper (mit Helm dreht der ganze Oberkörper, 81 §1.11)
  const ziel = S.blickZiel || (justin.look || state.talking ? camera.position : null); let yaw = 0, pitch = 0;
  if (ziel && B.head) { B.head.getWorldPosition(_jv); _jv2.copy(ziel).sub(_jv); const dir = Math.atan2(_jv2.x, _jv2.z); yaw = Math.atan2(Math.sin(dir - g.rotation.y), Math.cos(dir - g.rotation.y)); pitch = Math.atan2(_jv2.y, Math.hypot(_jv2.x, _jv2.z));
    if (Math.abs(yaw) > 1.9) { yaw = 0; pitch = 0; } // P2: Ziel hinter ihm → Kopf zur Mitte (vorher sprang die Grenze von +63° auf −63° = Kopf schlägt um)
    yaw = THREE.MathUtils.clamp(yaw, -1.1, 1.1); pitch = THREE.MathUtils.clamp(pitch, -.45, .35); }
  // kritisch gedämpfte Feder (kein Rucken)
  const k = 9, sp = (x, v, zz) => { const f = (zz - x) * k * k - 2 * k * v; return [x + (v + f * dt) * dt, v + f * dt]; };
  [S.lookYaw, S.lookV[0]] = sp(S.lookYaw, S.lookV[0], yaw * (S.redet ? 1 : .85)); [S.lookPitch, S.lookV[1]] = sp(S.lookPitch, S.lookV[1], pitch);
  const helmOn = S.helmAb < .5, chain = helmOn ? [['spine_03', .22], ['spine_05', .3], ['neck_01', .22], ['head', .26]] : [['spine_03', .1], ['spine_05', .15], ['neck_01', .3], ['head', .45]];
  for (const [n, w] of chain) { const b = B[n]; if (!b) continue; b.parent.getWorldQuaternion(_jq); _jq2.copy(_jq).multiply(b.quaternion);
    _jq3.setFromAxisAngle(JUSTIN_UP, S.lookYaw * w); _jq2.premultiply(_jq3); justin_vorn(_jv3); _jv4.crossVectors(JUSTIN_UP, _jv3).normalize(); _jq3.setFromAxisAngle(_jv4, -S.lookPitch * w); _jq2.premultiply(_jq3);
    b.quaternion.copy(_jq.invert().multiply(_jq2)); b.updateMatrixWorld(true); }
  // Mikrobewegung des Kopfes beim Reden: kleine Nicker
  if (S.redet && B.head) B.head.rotateX(Math.sin(t * 3.1) * .012 + Math.sin(t * 1.7) * .008);
  // Arme: Helm abnehmen / halten, Brustplatte zerren, geben (Zwei-Knochen-IK über der Pose)
  justin_arme(dt, t);
  // Visier und Helm
  justin_helmTakt(dt);
  // Haar: vom Helm plattgedrückt, richtet sich langsam auf
  S.hairFlat += (S.hairFlatZiel - S.hairFlat) * Math.min(1, dt * (S.hairFlatZiel > S.hairFlat ? .35 : 4));
  for (const h of S.hair) if (h.morphTargetInfluences && h.morphTargetInfluences.length) h.morphTargetInfluences[0] = 1 - S.hairFlat;
  // Augen: sehen Luke an (mit Sakkaden), Lider blinzeln (2–6 s, manchmal doppelt)
  justin_augen(dt, t);
  // Nähte der Brustplatte (Antwort A) klingen ab
  S.naht.value += ((S.zerren ? .4 * (.6 + .4 * Math.sin(t * 5.5)) : 0) - S.naht.value) * Math.min(1, dt * 3); }

function justin_dreh(b, ax, ang) { if (!b || !ang) return; b.parent.updateWorldMatrix(true, false); b.parent.getWorldQuaternion(_jq); _jq2.copy(_jq).multiply(b.quaternion).premultiply(_jq3.setFromAxisAngle(ax, ang)); b.quaternion.copy(_jq.invert().multiply(_jq2)); b.updateMatrixWorld(true); }
function justin_ik(up, lo, ha, target, w, pole) { if (w <= .001) return; up.updateMatrixWorld(true); const a = up.getWorldPosition(_jv), b = lo.getWorldPosition(_jv2), c = ha.getWorldPosition(_jv3);
  const lab = a.distanceTo(b), lcb = b.distanceTo(c), lat = THREE.MathUtils.clamp(a.distanceTo(target), .01, lab + lcb - .01);
  const acn = c.clone().sub(a).normalize(), abn = b.clone().sub(a).normalize(), ban = a.clone().sub(b).normalize(), bcn = c.clone().sub(b).normalize(), atn = target.clone().sub(a).normalize();
  const cl = x => Math.min(1, Math.max(-1, x)); const ac_ab_0 = Math.acos(cl(acn.dot(abn))), ba_bc_0 = Math.acos(cl(ban.dot(bcn))), ac_at_0 = Math.acos(cl(acn.dot(atn)));
  const ac_ab_1 = Math.acos(cl((lcb * lcb - lab * lab - lat * lat) / (-2 * lab * lat))), ba_bc_1 = Math.acos(cl((lat * lat - lab * lab - lcb * lcb) / (-2 * lab * lcb)));
  const axis0 = new THREE.Vector3().crossVectors(acn, abn).normalize(), axis1 = new THREE.Vector3().crossVectors(acn, atn).normalize(); if (!isFinite(axis0.x) || axis0.lengthSq() < .5) return;
  const a_gr = up.getWorldQuaternion(new THREE.Quaternion()), b_gr = lo.getWorldQuaternion(new THREE.Quaternion()), a0 = up.quaternion.clone(), b0 = lo.quaternion.clone();
  // Drehungen in Weltlage: r0 (Schulterwinkel), r1 (Ellbogen), r2 (Kette auf das Ziel) – neue Weltlagen, dann zurück in lokale Lagen
  const r0 = new THREE.Quaternion().setFromAxisAngle(axis0, ac_ab_1 - ac_ab_0), r1 = new THREE.Quaternion().setFromAxisAngle(axis0, ba_bc_1 - ba_bc_0), r2 = axis1.lengthSq() > .5 ? new THREE.Quaternion().setFromAxisAngle(axis1, ac_at_0) : new THREE.Quaternion();
  const aW = r2.clone().multiply(r0).multiply(a_gr), bW = r2.clone().multiply(r0).multiply(r1).multiply(b_gr);
  up.parent.getWorldQuaternion(_jq); up.quaternion.copy(_jq.invert().multiply(aW)); lo.quaternion.copy(aW.clone().invert().multiply(bW));
  up.quaternion.copy(a0.slerp(up.quaternion, w)); lo.quaternion.copy(b0.slerp(lo.quaternion, w)); up.updateMatrixWorld(true); }
function justin_arme(dt, t) { const S = justin_S, B = S.bones, g = justin.g; if (!B.upperarm_l || !B.upperarm_r) return; const vorn = justin_vorn(_jv5).clone(), rechts = new THREE.Vector3().crossVectors(vorn, JUSTIN_UP).normalize();
  const hp = B.head.getWorldPosition(new THREE.Vector3()), brust = (B.spine_05 || B.head).getWorldPosition(new THREE.Vector3());
  // Helm: 0 = auf, 1 = in der linken Hand unter dem Arm; dazwischen greifen beide Hände
  const h = S.helmAb; let wl = 0, wr = 0; const tl = new THREE.Vector3(), tr = new THREE.Vector3();
  if (h > .01 && h < .99 || S.helmZiel !== (h > .5 ? 1 : 0)) { const lift = Math.sin(Math.min(1, h * 1.4) * Math.PI) * .12; tl.copy(hp).addScaledVector(rechts, -.13).addScaledVector(vorn, .04).addScaledVector(JUSTIN_UP, .05 + lift); tr.copy(hp).addScaledVector(rechts, .13).addScaledVector(vorn, .04).addScaledVector(JUSTIN_UP, .05 + lift);
    const hold = new THREE.Vector3().copy(brust).addScaledVector(rechts, -.3).addScaledVector(vorn, .12).addScaledVector(JUSTIN_UP, -.22); if (h > .6) tl.lerp(hold, (h - .6) / .4); wl = Math.sin(Math.min(1, h * 3) * Math.PI / 2); wr = h < .7 ? Math.sin(Math.min(1, h * 3) * Math.PI / 2) : Math.max(0, 1 - (h - .7) / .25); }
  else if (h >= .99) { tl.copy(brust).addScaledVector(rechts, -.3).addScaledVector(vorn, .12).addScaledVector(JUSTIN_UP, -.22); wl = 1; }
  // Brustplatte: beide Hände an die Schnallen, zweimal ziehen
  if (S.zerren || S.zerrW > .01) { S.zerrW = (S.zerrW || 0) + ((S.zerren ? 1 : 0) - (S.zerrW || 0)) * Math.min(1, dt * 4); S.zerrT = (S.zerrT || 0) + dt; const pull = Math.max(0, Math.sin(S.zerrT * 3.6)) * .06;
    tl.copy(brust).addScaledVector(rechts, -.09).addScaledVector(vorn, .2 + pull).addScaledVector(JUSTIN_UP, .02); tr.copy(brust).addScaledVector(rechts, .09).addScaledVector(vorn, .2 + pull).addScaledVector(JUSTIN_UP, .02); wl = Math.max(wl, S.zerrW); wr = Math.max(wr, S.zerrW); }
  // Geben: die Hand geht zu Luke
  S.gebW = (S.gebW || 0) + ((S.geben ? 1 : 0) - (S.gebW || 0)) * Math.min(1, dt * 3.2); if (S.gebW > .01) { const P = camera.position; tr.copy(brust).lerp(_jv4.set(P.x, brust.y - .15, P.z), .55).addScaledVector(JUSTIN_UP, -.1); wr = Math.max(wr, S.gebW); }
  if (wl > .01) justin_ik(B.upperarm_l, B.lowerarm_l, B.hand_l, tl, wl, brust.clone().addScaledVector(rechts, -.6).addScaledVector(JUSTIN_UP, -.6));
  if (wr > .01) justin_ik(B.upperarm_r, B.lowerarm_r, B.hand_r, tr, wr, brust.clone().addScaledVector(rechts, .6).addScaledVector(JUSTIN_UP, -.6)); }
function justin_helmTakt(dt) { const S = justin_S, H = S.helm; if (!H) return;
  // Visier: schwer, am Ende ein kleines Nachfedern
  S.visierV = (S.visierV || 0) + ((S.visierZiel - S.visier) * 38 - (S.visierV || 0) * 9) * dt; S.visier += S.visierV * dt; H.vp.quaternion.setFromAxisAngle(H.R, -S.visier * 1.55);
  // Helm ab/auf (≈ 2,2 s; langsam 3,4 s)
  const sp = 1 / (S.helmLangsam ? 3.4 : 2.2); S.helmAb = THREE.MathUtils.clamp(S.helmAb + Math.sign(S.helmZiel - S.helmAb) * dt * sp, 0, 1); const h = S.helmAb;
  if (h <= .001) { if (H.grp.parent !== H.head) { H.head.add(H.grp); } H.grp.position.set(0, 0, 0); H.grp.quaternion.copy(H.base); return; }
  // zwischen Kopf und linker Hand überblenden (in Weltkoordinaten, dann in den Elternknochen zurück)
  const B = S.bones, hand = B.hand_l; if (!hand) return; const e = h * h * (3 - 2 * h);
  H.head.updateWorldMatrix(true, false); const pA = H.head.getWorldPosition(new THREE.Vector3()), qA = H.head.getWorldQuaternion(new THREE.Quaternion()).multiply(H.base);
  const lift = Math.sin(Math.min(1, h * 1.6) * Math.PI) * .16; pA.addScaledVector(JUSTIN_UP, lift * Math.min(1, h * 3));
  const pB = hand.getWorldPosition(new THREE.Vector3()), vorn = justin_vorn(new THREE.Vector3()), links = new THREE.Vector3().crossVectors(JUSTIN_UP, vorn).normalize();
  pB.addScaledVector(links, .06).addScaledVector(JUSTIN_UP, .06); const qB = new THREE.Quaternion().setFromAxisAngle(JUSTIN_UP, justin.g.rotation.y + Math.PI / 2).multiply(new THREE.Quaternion().setFromAxisAngle(_jv.set(1, 0, 0), .5));
  const qHeadRel = qA.clone(); const k = Math.max(0, (e - .35) / .65);
  const pos = pA.lerp(pB, k), q = qHeadRel.slerp(qB, k);
  if (H.grp.parent !== justin.g.parent) justin.g.parent.add(H.grp); H.grp.position.copy(pos); H.grp.quaternion.copy(q); H.grp.scale.setScalar(justin.model.scale.x || 1); }
function justin_augen(dt, t) { const S = justin_S, E = S.eyes; if (!E) return; const B = S.bones;
  // Blickziel im Kopfknochenraum
  const z = S.blickZiel || camera.position; B.head.updateWorldMatrix(true, false); _jm.copy(B.head.matrixWorld).invert(); const zl = _jv.copy(z).applyMatrix4(_jm); const c = _jv2.copy(E.cBoneL).add(E.cBoneR).multiplyScalar(.5); const d = zl.sub(c).normalize();
  let yaw = Math.atan2(d.dot(S.hR), d.dot(S.hF)), pitch = Math.asin(THREE.MathUtils.clamp(d.dot(S.hU), -1, 1)); yaw = THREE.MathUtils.clamp(yaw, -.45, .45); pitch = THREE.MathUtils.clamp(pitch, -.3, .25);
  S.saccT -= dt; if (S.saccT <= 0) { S.saccT = rand(.4, 2.2); S.sacc.set(rand(-.03, .03), rand(-.02, .02)); }
  S.gaze.x += (yaw + S.sacc.x - S.gaze.x) * Math.min(1, dt * 18); S.gaze.y += (pitch + S.sacc.y - S.gaze.y) * Math.min(1, dt * 18);
  // Drehmatrix im Knochenraum → Objektraum des Netzes
  _jq.setFromAxisAngle(S.hU, S.gaze.x).multiply(_jq2.setFromAxisAngle(S.hR, -S.gaze.y)); const r3 = new THREE.Matrix3().setFromMatrix4(_jm.makeRotationFromQuaternion(_jq)); E.rot.value.copy(E.b2o).multiply(r3).multiply(E.o2b);
  // Blinzeln
  S.blinkT -= dt; if (S.blinkT <= 0 && S.blinkPh === 0) { S.blinkPh = 1; S.blinkT = Math.random() < .15 ? .35 : rand(2, 6); }
  if (S.blinkPh) { S.blinkPh += dt; const p = S.blinkPh - 1; S.blink = p < .075 ? p / .075 : p < .11 ? 1 : Math.max(0, 1 - (p - .11) / .17); if (p > .3) { S.blinkPh = 0; S.blink = 0; } }
  const muede = .12 + (S.redet ? 0 : .06); if (S.lid) S.lid.morphTargetInfluences[0] = Math.max(S.blink, muede + Math.max(0, -S.gaze.y) * .6); }

// ---------------------------------------------------------------- Takt: Happen an Blicke gebunden (UK 4), Pflicht beim Weitergehen, Wîse-Stufen, Glocke, Sichtbarkeit
const JUSTIN_BLICKE = [
  { id: 'senke', p: () => _jv5.set(96, 12, 0) },
  { id: 'sammeln', p: () => typeof whiskey_S !== 'undefined' && whiskey_S.g && whiskey_S.g.visible ? whiskey_S.g.position : null },
  { id: 'herz', p: () => justin_laterneNah() },
  { id: 'kuh', p: () => typeof cowFx !== 'undefined' && cowFx.g && cowFx.g.children.length ? cowFx.g.children[0].getWorldPosition(_jv5) : null },
  { id: 'kerbe', p: () => justin.sword ? justin.sword.getWorldPosition(_jv5) : null, wenn: () => justin_hat('kerbe_stuhl8') || justin_hat('stuhl8_kerbe'), eng: .985, d: 4 },
];
WORLD_TICK.push((dt, t) => { const S = justin_S; if (!S.ready) return;
  // nach Kapitel 3 nie mehr als Figur (Kino-Sequenzen setzen ihn selbst)
  if (typeof kap === 'function' && kap() >= 4 && !(typeof kino_S !== 'undefined' && kino_S.on)) { S.gone = true; if (justin.g.visible) justin.g.visible = false; return; }
  // sanft hinsehen (Ankunft)
  if (S.camHin) { const H = S.camHin; H.t += dt; const hp = S.bones.head.getWorldPosition(_jv); const dx = hp.x - camera.position.x, dy = hp.y - camera.position.y, dz = hp.z - camera.position.z;
    const yaw = Math.atan2(-dx, -dz), pit = Math.atan2(dy, Math.hypot(dx, dz)), k = Math.min(1, dt * 3.2); let da = yaw - player.yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); player.yaw += da * k; player.pitch += (pit - player.pitch) * k; if (H.t > H.sek) S.camHin = null; }
  if (!ch3.on || !justin_da()) return;
  const busy = state.talking || ui.overlay;
  // UK 4: Happen, jeder an einen Blick gebunden; Pflicht, wenn Luke weitergeht (> 11 m) oder nach 70 s
  if (S.phase === 'uk4' && ch3.part === 'town') { S.uk4.t += dt; const P = player.pos, dj = jDist();
    if (!busy) { if (dj > 11 || S.uk4.t > 70) { justin_pflicht(); return; }
      if (dj < 2.4 && !S.said.has('naeher')) { (async () => { await justin_sprich('naeher'); await justin_sprich('siebzehn'); })(); return; }
      if (player.pitch > .55) { S.oben += dt; if (S.oben > 3 && !S.said.has('hinauf')) { justin_sprich('hinauf'); return; } } else S.oben = 0;
      camera.getWorldDirection(_jv); for (const b of JUSTIN_BLICKE) { if (S.said.has(b.id) || (b.wenn && !b.wenn())) continue; const p = b.p(); if (!p) continue; _jv2.copy(p).sub(camera.position); const dd = _jv2.length(); if (b.d && dd > b.d) continue;
        const see = _jv.dot(_jv2.normalize()) > (b.eng || .965); S.blickHold[b.id] = see ? (S.blickHold[b.id] || 0) + dt : 0; if (S.blickHold[b.id] > .8) { justin_blick(p.clone()); justin_sprich(b.id).then(() => justin_blick(null)); return; } } } }
  // Wîse Stufe 3 (nach dem Funk; Whiskey hat geholfen/geklaut) und Stufe 5 (Raum 1, nach einer Weile) / 6 (vor der Wahl, Blick auf den Vogel)
  if (!busy && ch3.part === 'town' && ch3.radio && typeof whiskey_S !== 'undefined' && whiskey_S.jAsked && jDist() < 8 && !S.said.has('wise3')) justin_sprich('wise3');
  if (ch3.part === 'white') { S.wT += dt; if (!busy && !ch3.room1 && S.wT > 45 && player.pos.x > X3 + 8.6 && !S.said.has('wise5')) justin_sprich('wise5').then(() => { S.w5 = player.pos.clone(); });
    if (!busy && S.w5 && !S.said.has('wise5b') && player.pos.distanceTo(S.w5) > 1.2) justin_sprich('wise5b');
    if (!busy && typeof weiss_S !== 'undefined' && weiss_S.phase === 'abgrund' && S.helmAb > .9 && typeof whiskey_S !== 'undefined' && whiskey_S.g && !S.said.has('wise6')) { camera.getWorldDirection(_jv); _jv2.copy(whiskey_S.g.position).sub(camera.position).normalize();
      S.blickHold.w6 = _jv.dot(_jv2) > .992 ? (S.blickHold.w6 || 0) + dt : 0; if (S.blickHold.w6 > .6) justin_sprich('wise6'); } } });
// Glocke „drei, Pause, dreizehn“ (3.7): wenn Justin dabei ist, bleibt Luke stehen und er erklärt es
if (typeof leben_bell3plus13 === 'function') leben_bell3plus13 = (o => function (...a) { const r = o.apply(this, a); if (ch3.on && ch3.part === 'town' && justin_da() && jDist() < 14) setTimeout(() => { if (!state.talking) justin_sprich('glocke'); }, 9000); return r; })(leben_bell3plus13);
// Spielstand: was Justin schon gesagt hat, Visier-/Gesichtszähler, ob er gegangen ist
MOD_SAVE.push(['justin', () => ({ said: [...justin_S.said], face: justin_S.faceShown, gone: justin_S.gone, phase: justin_S.phase === 'uk4' || justin_S.phase === 'pflicht' ? 'stadt' : justin_S.phase }),
  v => { justin_S.said = new Set(Array.isArray(v.said) ? v.said : []); justin_S.faceShown = +v.face || 0; justin_S.gone = !!v.gone; justin_S.phase = typeof v.phase === 'string' ? v.phase : ''; }]);
window.__justin = { S: justin_S, bank: JUSTIN_BANK, sprich: id => justin_sprich(id, { again: true }), visier: s => justin_visier(s), helmAb: () => justin_helmAb(), helmAuf: () => justin_helmAuf(), zerren: () => justin_brustZerren(), geben: () => justin_geben(),
  antwort: c => justin_antwort(c), ankunft: () => justin_ankunft(), knien: a => justin_knien(a), rh: id => justin_rh(id), blick: z => justin_blick(z),
  j: justin, place: (x, z, ry) => jPlace(x, z, ry), walk: (x, z) => jWalk(x, z), cam: fn => setCamOverride(fn), ch3 }; // Testzugriff
