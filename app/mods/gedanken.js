// =====================================================================  GEDANKEN (Modul „gedanken“): Lukes Stimme
// Kurze Selbstgespräche, die das Seltsame beim Namen nennen, hinterfragen und fühlen – damit Luke auf das Krasse reagiert und die Geschichte
// verständlicher und persönlicher wird. Regeln gegen Nerven: jeder Gedanke nur einmal, nie während Dialogen/Notizen/anderen Untertiteln,
// Mindestabstand GEDANKEN.gap Sekunden. Hängt lange an einer Aufgabe fest, denkt Luke über den nächsten Schritt nach (Hinweis ohne Textwand).
const GEDANKEN = { gap: 9, stuck: 150, who: 'LUKE' };
MOD_SAVE.push(['gedanken', () => [...gedanken_S.said], v => v.forEach(id => gedanken_S.said.add(id))]);
// H-6: Lucy-Gedanken in Kapitel 1 (der Reihe nach, je einer etwa alle zwanzig Minuten Erkundung)
const GEDANKEN_LUCY = [['k1_lucy1', 'Lucy. Ich sammel hier Katzen, und du bist irgendwo im Dunkeln.'], ['k1_lucy2', 'Elf Anrufe. Und jetzt lauf ich durch dein Dorf und guck in fremde Briefkästen.'],
  ['k1_lucy3', 'Wenn sie jetzt anruft, geh ich ran. Beim ersten Klingeln.'], ['k1_lucy4', 'Du hättest längst einen Plan. Mit Zettel und blauen Pfeilen. Ich hab eine Taschenlampe.'], ['k1_lucy5', '„Großer, du trödelst.“ Ja. Ich weiß.']];
const gedanken_S = { said: new Set(), q: [], cd: 6, obj: '', objT: 0, lastScare: 0, area: new Set(), battEmpty: false, umT: 0, lpx: null, lpz: null, lampStill: 0, katzeTrag: null };
function gedanke(id, text, delay = 0, prio = 1) {
  const S = gedanken_S; if (S.said.has(id)) return; S.said.add(id);
  S.q.push({ id, text, at: performance.now() + delay, until: performance.now() + delay + 25000, prio }); S.q.sort((a, b) => b.prio - a.prio || a.at - b.at);
}
// AP-26 · Atempausen A-01 … A-25 (85 §10; ersetzen GEDANKEN_SCHRECK). Wann eine kommt, entscheidet die Regie (spannung.js: Lacher, Stille oder Ruhe mit Riss, A-28);
// hier steht nur, was Luke sagt. [Kennung, Anlass, Text] – Zeilen mit Anlass nur nach genau diesem Schreck, die anderen frei. Jede einmal. Nie in traurigen Szenen.
const LUKE_ATEM = [
  ['A-01', '', 'Puls auf hundertachtzig. Wenn das ein Podcast wär, würd ich den Atem rausschneiden. Geht nicht. Ist meiner.'], // H-3
  ['A-02', '', 'Ich hab geschrien. Gut, dass keiner mitschneidet. … Hoffentlich schneidet keiner mit.'],
  ['A-03', 'k3kuh', 'Eine Kuh. Vom Himmel. Wenn ich das auf der Arbeit erzähl, krieg ich endlich Urlaub.'],
  ['A-04', '', 'Ich hab mir nicht in die Hose gemacht. Das halt ich fest. Das ist heute mein Erfolg.'],
  ['A-05', '', 'Wenn’s knallt, nicht an den Reglern drehen. Warten, bis der Pegel runtergeht. Pegel geht runter. Pegel geht … runter.'],
  ['A-06', '', 'Lucy, das war kein Quieken. Das war ein Warnruf.'],
  ['A-07', '', 'Ich sag einfach Wörter. Toastbrot. Kabeltrommel. Kassler.'],
  ['A-08', '', 'Das war ein Gesicht, und ich hab ‚Entschuldigung‘ gesagt. Ich hab mich bei einem Gesicht entschuldigt.'],
  ['A-09', '', 'Ich brauch einen Kaffee. Oma hätte gesagt: Kind, du brauchst Kassler.'], // H-3
  ['A-10', '', 'Zwei Hände, zwei Füße, eine Taschenlampe. Alles dran. Inventur abgeschlossen.'],
  ['A-11', '', 'Wenn das vorbei ist, zieh ich in eine Stadt mit Straßenbahn. Straßenbahnen haben Fahrpläne. Da kommt nichts aus dem Himmel.'],
  ['A-12', 'beob', 'Wer da hinten raschelt: Ich hab dich gehört. Du bist nicht leise. Du bist nur klein.'],
  ['A-13', '', 'Mein Tinnitus hat gerade gekündigt. Der will hier auch nicht sein.'], // H-3
  ['A-14', '', 'Notiz an mich: Nachtschicht im Studio ist gar nicht so schlimm. Da fällt nur selten was vom Himmel.'], // H-3
  ['A-15', 'whiskey', 'Du. Hast. Mich. … Ja, putz dich nur. Du hast gewonnen.'],
  ['A-16', 'lampe', 'Die Lampe hat’s überlebt. Wenigstens einer von uns ist robust gebaut.'],
  ['A-17', 'k3blinzeln', 'Blinzeln ist ab jetzt verboten. Trockene Augen als Lebensstil.'],
  ['A-18', '', 'Oma hätte gesagt: Kind, das war der Wind. Oma, der Wind hat keinen Mund.'],
  ['A-19', '', 'Liste der Dinge, die heute Nacht noch passieren dürfen: keine.'],
  ['A-20', 'polaroid', 'Ab jetzt nur noch Tonaufnahmen. Da kann man wenigstens nichts sehen.'],
  ['A-21', '', 'Ich hab ‚Mama‘ gerufen. Ich bin sechsundzwanzig. War mir egal.'],
  ['A-22', '', 'Lauf, hat mein Körper gesagt. Nächstes Mal hör ich auf ihn. Der hat das bessere Gefühl für so was.'],
  ['A-23', 'stillezone', 'Ich hab ‚Hallo‘ gesagt, und der Wald hat es behalten. Unhöflich.'],
  ['A-24', '', 'Gute Nachricht: keine Angst mehr vor Spinnen. Schlechte Nachricht: Ich hab jetzt Vergleiche.'],
  ['A-25', 'patachon', 'Ihr zwei könnt auch mal klopfen. Wie normale Leute. Die klopfen.']
];
function gedanken_atem(anlass) {
  const S = gedanken_S; let e = anlass ? LUKE_ATEM.find(a => a[1] === anlass && !S.said.has('atem_' + a[0])) : null;
  if (!e) { const frei = LUKE_ATEM.filter(a => !a[1] && !S.said.has('atem_' + a[0])); if (!frei.length) return false; e = frei[Math.floor(Math.random() * frei.length)]; }
  gedanke('atem_' + e[0], e[2], 400, 2); return true;
}
// AP-26 · Lukes Untersuchungszeilen U-01 … U-104 und Katzenzeilen KZ-01 … KZ-15 (85 §2) nach Objektart: [Kennung, Unterart, Text, { ab, bis, g }].
// ab/bis: Kapitelsperre über kap() (bis Luke das Wissen hat) · g: gruselig. Unterart '' = frei wählbar.
// gedanken_blick(art, unterart, o) → spricht die passende Zeile genau einmal und gibt den Text zurück; beim zweiten Blick nur das Objektwort (o.wort),
// wo keine Zeile passt: nichts (''). o.delay (ms), o.prio. Generisch angeschlossen (WORLD_MODS/Tick): Klopfen an verschlossene Türen, erste Batterie,
// Stehenbleiben an einer Laterne, Katze tragen, Katze starrt auf eine Beobachter-Spur. Andere Module rufen gedanken_blick(...) mit typeof-Prüfung.
const LUKE_BLICK = {
  tuer: [
    ['U-01', 'zu', 'Zu. Das Dorf hat mehr Schlüssel als Einwohner.'],
    ['U-02', 'knarrt', 'Im Studio heißt das ‚Atmo Altbau, Take drei‘. Hier heißt es wahrscheinlich ‚lauf‘.'],
    ['U-03', 'angelehnt', 'Die war offen. Ich weiß, dass die offen war.', { g: 1 }],
    ['U-05', 'keller7', '‚Keller bleibt zu.‘ Steht jetzt an drei Stellen. Irgendwann glaub ich’s.'],
    ['U-06', 'stahl', 'Brandschutztür, grau, Wirtschaftswunder. Dahinter Akten oder Albträume. Meistens beides.'],
    ['U-07', 'klingelschild', 'Nur ein Tesastreifen, wo mal ein Name war.'],
    ['U-08', 'briefschlitz', 'Wenn da jetzt Finger rauskommen, zieh ich weg. Diesmal richtig.']
  ],
  hufeisen: [
    ['U-04', 'haustuer', 'Offen nach oben, damit das Glück nicht rausfällt. Oder damit was anderes nicht reinkommt.'],
    ['U-73', 'frisch', 'Das hängt nicht aus Tradition. Das hängt aus Angst.'],
    ['U-75', 'matsch', 'Ich steck’s ein. Man weiß ja nie. Doch. Man weiß.', { ab: 3 }]
  ],
  kuehlschrank: [
    ['U-09', 'summt', 'Einziger Strom im Haus, und er verschwendet ihn an ein halbes Glas Gurken.'],
    ['U-10', 'offen', 'Milch von letzter Woche. Oma hätte gesagt: Kind, zumachen. Ich mach zu.'],
    ['U-11', 'magnete', 'Mallorca, Paris, Wanne-Eickel. Hier war nie einer weg. Außer die Kinder.', { ab: 2 }],
    ['U-12', 'zeichnung', 'Sieben Strichmännchen. Eins ohne Mund. Kinder malen ehrlicher, als Erwachsene lügen.', { g: 1 }]
  ],
  kueche: [
    ['U-13', 'spuele', 'Ein Teller, eine Gabel, ein Glas. So sieht allein wohnen aus. Kenn ich.']
  ],
  laterne: [
    ['U-14', 'an', 'Brummt auf fünfzig Hertz, wie jede Laterne. Nur brummt die in meine Richtung.'],
    ['U-15', 'aus', 'Aus. Und warm. Laternen, die aus sind, sind nicht warm.', { g: 1 }],
    ['U-16', 'flackert', 'Die flackert im Takt. Eins, zwei, drei … Ich zähl nicht mit. Hab ich mir versprochen.'],
    ['U-17', 'kreide', 'Haben wir als Kinder gespielt. Ich hab nie gefragt, frei wovon.'],
    ['U-18', 'papier', 'Sonne drauf, Mond drauf, Kerze nie angezündet. Das Laternenfest fällt ja aus. Aus Sicherheitsgründen. Welche Sicherheit, steht nicht drauf.'],
    ['U-19', 'nr9', 'Die ist nicht aus. Die ist ausgeblasen worden. Das ist ein Unterschied, jetzt.', { ab: 3 }],
    ['U-74', 'hand', 'Eisen. Hand drauf. Frei. Wie beim Fangen. Nur hat die Fängerin keinen Mund.', { ab: 3, g: 1 }]
  ],
  auto: [
    ['U-20', 'kombi', 'Innen nichts, nicht mal ein Kaugummipapier. So aufgeräumt ist nur, wer was verbirgt oder einen Dienstwagen fährt.'],
    ['U-21', 'wrack', 'Kindersitz hinten, Koffer drin. Die wollten weg. Die Tür steht offen, als wär einer nur kurz ausgestiegen.', { g: 1 }],
    ['U-22', 'beschlagen', 'Da sitzt keiner drin. Ich schreib nichts drauf, und ich les auch nichts.', { g: 1 }],
    ['U-23', 'traktor', 'Baujahr: als Traktoren noch Gesichter hatten. Der guckt.'],
    ['U-24', 'transporter', 'Sieben Kindersitze. Genau so viele, wie sie damals waren.', { g: 1 }],
    ['U-25', 'postrad', 'Klingel wie ein Rabe. Wer baut so eine Klingel? Wer will so eine?']
  ],
  zeichnung: [
    ['U-26', 'fleck', 'Ein Haus, eine Sonne, ein grauer Fleck am Rand. Der Fleck hat Arme.', { g: 1 }],
    ['U-27', 'tier', 'Pferd. Oder Hund. Oder Tisch. Mit Liebe gemalt und mit zu wenig Beinen.'],
    ['U-28', 'gelb', 'Gelbe Laterne, gelber Himmel, gelbes Kind. Nur die Augen haben sie schwarz gemacht.', { g: 1 }]
  ],
  kreide: [
    ['U-29', 'kreise', 'Kreise ineinander. Dina hat früher so gemalt. Ich dachte, das sind Schnecken.'],
    ['U-30', 'pfeil', 'Lucys Pfeil. Den hat sie auf jede Hausaufgabe gemalt, die sie von mir abgeschrieben hat.']
  ],
  kreuz: [
    ['U-31', 'suehne', 'So schief wie ein Betrunkener nach der Kirmes. Und frische Blumen davor.'],
    ['U-32', 'kerze', 'Kein Mensch weit und breit. Entweder ist das Dorf sehr fromm, oder jemand weiß, dass ich komme.']
  ],
  grab: [
    ['U-33', 'kind', 'Wer vergisst das Sterbedatum auf einem Kindergrab?', { g: 1 }],
    ['U-34', 'kind', 'Man vergisst es nicht. Man lässt es weg, wenn einer nicht tot ist.', { ab: 2 }]
  ],
  kerze: [
    ['U-35', 'foto', 'Kerze neu, Foto alt. Jemand hat jeden Tag eine neue hingestellt. Jahrelang.']
  ],
  papier: [
    ['U-36', 'kreuzwort', '‚Anderes Wort für verschwunden, acht Buchstaben.‘ Keiner hat’s ausgefüllt. Ich auch nicht.'],
    ['U-43', 'laternenbote', 'Die Kaninchenzüchter kriegen einen Namen. Das hier kriegt zwei Buchstaben.']
  ],
  akte: [
    ['U-37', 'rueckfuehrung', 'Rückführung', { ab: 2 }],
    ['U-38', 'geschwaerzt', 'Mehr Schwarz als Text. Da hatte einer was gegen Buchstaben.'],
    ['U-39', 'stempel', 'Behörden stempeln Adler. Die hier stempeln, dass sie zugucken.', { ab: 1, bis: 3 }],
    ['U-40', 'kartei', 'Unter B: Brandt. Ich zieh die nicht raus. … Na gut.'],
    ['U-41', 'einwilligung', 'Zwei Unterschriften. Eine zittert.', { ab: 2 }],
    ['U-42', 'kaffee', 'Irgendwer hat ganz normal Kaffee getrunken, während er das geschrieben hat. Das ist das Schlimmste daran.']
  ],
  briefkasten: [
    ['U-44', 'voll', 'Werbung, Werbung, Laternenbote. Jemand wohnt hier nicht mehr und kriegt trotzdem Angebote für Fensterputzer.']
  ],
  tier: [
    ['U-45', 'bruno', 'Klingt nach dreißig Kilo und null Humor.'],
    ['U-46', 'kuh', 'Kühe gucken immer, als hätten sie was gegen dich in der Hand.', { ab: 1, bis: 2 }],
    ['U-47', 'kauz', 'Das ist echt. Das ist ein Kauz. Ich halt mich jetzt an dem Kauz fest.'],
    ['U-48', 'fuchs', 'Rote Augen im Lampenlicht, dann weg. Der hat’s richtig gemacht.'],
    ['U-49', 'maus', 'Katzenarbeit. Sauber abgelegt, wie ein Geschenk. Danke, glaub ich.'],
    ['U-50', 'koppel', 'Tor zu, Zaun heil. Hufspuren rein, keine raus.', { g: 1 }],
    ['U-51', 'reh', 'Das war ein Reh. Ich guck da nicht noch mal hin.', { ab: 6, g: 1 }],
    ['U-52', 'rabe', 'Noch ein Rabe. Nein. Er guckt beleidigt. Das ist er.'],
    ['U-53', 'napf', 'ANNI. Die Katze heißt wie ein Kind. Warum heißt die Katze wie ein Kind?'],
    ['U-54', 'katzenhaare', 'Ich bin jetzt offiziell adoptiert.'],
    ['U-55', 'katzenecke', 'In der Ecke ist nichts. Ich geh da trotzdem nicht hin.', { g: 1 }]
  ],
  rost: [
    ['U-56', 'fahrrad', 'Alles Rost, nur die Klingel glänzt. Irgendwer putzt nur die Klingel.'],
    ['U-57', 'schaukel', 'Die quietscht bei Wind. Es ist kein Wind.', { g: 1 }],
    ['U-58', 'nagel', 'Tetanus hab ich, glaub ich. Die Impfung. Hoffentlich die Impfung.'],
    ['U-59', 'eimer', 'Man sieht durch den Boden. Hier heißt das wahrscheinlich noch gut.'],
    ['U-60', 'villator', 'Acht Schlösser. Mein Studio hat eins, und da steht Technik für ein Einfamilienhaus drin.']
  ],
  technik: [
    ['U-61', 'revox', 'Dieselbe wie im alten Studio. Wenn ich hier sterbe, dann wenigstens neben guter Technik.'],
    ['U-68', 'fernbedienung', 'Oma-Technik. Wie neu. Der Fernseher ist seit Jahren kaputt.'],
    ['U-69', 'radio', 'Rauschen hat Farben. Rosa, weiß, braun. Das hier ist grau.'],
    ['U-70', 'tonband', 'Gerissen und mit Tesa geflickt. Wer das geflickt hat, wollte es unbedingt noch mal hören.'],
    ['U-71', 'telefonzelle', 'Gelb. Gibt’s eigentlich gar nicht mehr. Der Hörer ist warm.', { g: 1 }],
    ['U-72', 'telefon', 'Mein Klingelton. Das Original. Ich hab den bei Oma aufgenommen, da war ich fünfzehn.']
  ],
  spinne: [
    ['U-62', 'netz', 'Ein Kronleuchter für jemanden mit sehr wenig Budget.'],
    ['U-63', 'gross', 'Ich hab keine Angst vor Spinnen. Hatte ich nie. … Wer hatte eigentlich Angst vor Spinnen? Einer von uns.'],
    ['U-64', 'tuerrahmen', 'Die Spinne baut neu und guckt mich an, als wär ich’s gewesen.']
  ],
  batterie: [
    ['U-65', 'gefunden', 'Das Beste, was einem nachts passieren kann, außer Sonnenaufgang.'],
    ['U-66', 'dreieck', 'Wer legt Batterien hübsch hin?', { g: 1 }],
    ['U-67', 'leer', 'Die Art Mensch, die auch leere Milchtüten zurück in den Kühlschrank stellt.']
  ],
  lwo: [
    ['U-76', 'kaugummi', 'Pfefferminz. Und ein Auge über einer Flamme. Wer druckt ein Auge auf Kaugummi?'],
    ['U-77', 'kuli', 'Werbekuli. Wie von der Messe. Nur gibt’s die Messe nicht.'],
    ['U-78', 'schild', 'Lucid World Organization. Klingt wie ein Energydrink. Zählt Kinder.', { ab: 4 }],
    ['U-79', 'absperrband', 'Riecht nicht nach Gas. Riecht nach Nebel und Kreide.'],
    ['U-80', 'aushang', 'Sprechstunde donnerstags. Die Behörde ist aufgelöst. Die Sprechstunde nicht.'],
    ['U-81', 'thermos', 'Tee. Wer trinkt um diese Zeit draußen Tee?']
  ],
  pfand: [
    ['U-82', 'kiste', 'Das Dorf-Sparbuch. Mit Glück ein Döner.'],
    ['U-83', 'fensterbank', 'Kein Deko, hätte Oma gesagt. Ich stimm zu, Oma.'],
    ['U-84', 'automat', '‚Außer Betrieb‘, handgeschrieben, vor drei Jahren. Hier wird Pfand noch in Würde gehortet.']
  ],
  dorf: [
    ['U-85', 'zwerg', 'Er guckt zur Senke. Alle Gartenzwerge in dieser Straße gucken zur Senke.', { g: 1 }],
    ['U-86', 'plakat', 'Hat keiner abgenommen. Die Band hieß ‚Lampenfieber‘. Na klar.'],
    ['U-87', 'alufolie', 'Glänzende Seite nach außen. Er hat sich Gedanken gemacht.'],
    ['U-88', 'waesche', 'Ausgeblichen bis auf die Streifen. Hängt da seit Jahren. Oder seit gestern.', { g: 1 }]
  ],
  uhr: [
    ['U-89', '0313', 'Wieder. Die Uhren in diesem Dorf haben sich abgesprochen.'],
    ['U-90', 'pendel', 'Das bin ich. Das ist mein Puls. Auch nicht besser.']
  ],
  spiegel: [
    ['U-91', '', 'Sieht müde aus. Dem würd ich nichts leihen.'],
    ['U-92', 'verhaengt', 'Wie bei einer Totenwache. Oder damit einer nicht reinguckt. Oder raus.', { g: 1 }]
  ],
  bett: [
    ['U-93', 'kind', 'So machen Kinder ihre Betten nie. So machen Erwachsene, die warten.']
  ],
  spielzeug: [
    ['U-94', 'puppe', 'Die Augen gehen zu, wenn man sie hinlegt. Sie liegt.', { g: 1 }],
    ['U-95', 'teddy', 'Rote Wolle. Überall rote Wolle in diesem Dorf.'],
    ['U-96', 'dino', 'Aufkleber vom Kinderarzt: ‚Tapfer gewesen!‘ Du auch, Dino.']
  ],
  foto: [
    ['U-97', 'polaroid', 'Da, wo ein Kind sein sollte, ist Hintergrund. Sehr scharfer Hintergrund.', { g: 1 }],
    ['U-98', 'gruppe', 'Sieben Kinder mit Lampions. Am Rand ein Mann mit Hut, unscharf. Auf jedem Foto hier steht einer am Rand.']
  ],
  ort: [
    ['U-99', 'gully', 'Da unten rauscht Wasser. Und da ist Licht. Unter einem Gully ist kein Licht.'],
    ['U-100', 'karussell', 'Wer hat das angeschubst? … Frag nicht, Luke.', { g: 1 }],
    ['U-101', 'heu', 'Riecht nach Sommer. Im November.', { g: 1 }],
    ['U-102', 'hochsitz', 'Nie verstanden, warum man auf einer Leiter wartet, bis was vorbeikommt. Jetzt schon.'],
    ['U-103', 'senke', 'Ein UFO. Ich sag’s einfach mal laut. Geht’s mir besser? Nein.', { ab: 1, bis: 2 }],
    ['U-104', 'senke', 'Lichtschiff, sagen die hier. Klingt schöner als UFO. Macht’s nicht kleiner.', { ab: 3 }]
  ],
  katze: [
    ['KZ-01', '', 'Hallo, Kollege. Nachtschicht? Ich auch. Wir reden nicht drüber.'],
    ['KZ-02', 'ecke', 'Du guckst in die Ecke. Ich guck jetzt auch in die Ecke. Da ist nichts. Oder? Sag was.'],
    ['KZ-03', '', 'Nein, ich hab kein Futter. Ich hab eine Taschenlampe und Probleme. Such dir was aus.'],
    ['KZ-04', 'keiner', 'Du heißt Keiner. Wenn mich jemand fragt, was ich hier mache: Ich such Keiner.'],
    ['KZ-05', 'lucy', 'Ja. Das passt. Das passt leider sehr gut.'],
    ['KZ-06', 'faucht', 'Fauch bitte mich an. An mir vorbei ist schlimmer.', { g: 1 }],
    ['KZ-07', 'tragen', 'Ich trag dich jetzt. Keine Panik. Ich hab auch Panik, wir teilen uns die.'],
    ['KZ-08', '', 'Siebzehn Katzen. Ich kenn Leute mit weniger Freunden. Mich zum Beispiel.'],
    ['KZ-09', 'haenschen', 'Hänschen. Du bist nach einem benannt, der nur kurz Laterne laufen wollte. Ich wollt nur kurz meine Schwester suchen. Wir zwei lernen’s nicht.', { ab: 5 }],
    ['KZ-10', 'flurtuer', 'Du gehst da nicht rein? Okay. Du bist der Klügere von uns beiden.', { ab: 5, g: 1 }],
    ['KZ-11', 'maus', 'Danke. Ich leg sie … da hin. Nicht, weil ich sie nicht mag.'],
    ['KZ-12', 'schnurren', 'Schnurren liegt bei fünfundzwanzig Hertz. Tiefste Stimme im Raum. Und die einzige, die mich beruhigt.'],
    ['KZ-13', 'herd', 'Nicht auf die Herdplatte. Die ist aus. Es geht ums Prinzip.'],
    ['KZ-14', 'whiskey', 'Den nicht. Das ist ein Rabe mit Anwalt. Der frisst eher dich.'],
    ['KZ-15', 'zaun', 'Wenn du den Kleinen hinterm Zaun siehst, sag ihm, ich hab keine Angst. Und guck mich nicht so an.']
  ]
};
const GEDANKEN_WORT = { tuer: 'Tür.', hufeisen: 'Hufeisen.', kuehlschrank: 'Kühlschrank.', kueche: 'Spüle.', laterne: 'Laterne.', auto: 'Auto.', zeichnung: 'Zeichnung.',
  kreide: 'Kreide.', kreuz: 'Kreuz.', grab: 'Grab.', kerze: 'Kerze.', papier: 'Papier.', akte: 'Akte.', briefkasten: 'Briefkasten.', rost: 'Rost.', spinne: 'Spinne.',
  batterie: 'Batterie.', pfand: 'Pfand.', uhr: 'Uhr.', spiegel: 'Spiegel.', bett: 'Bett.', foto: 'Foto.' };
function gedanken_blick(art, sub = '', o = {}) {
  const L = LUKE_BLICK[art], S = gedanken_S; if (!L) return ''; const k = typeof kap === 'function' ? kap() : 1; let best = null, bAb = 0, n = 0;
  for (const e of L) { if (e[1] !== sub || S.said.has('blick_' + e[0])) continue; const x = e[3] || {}, ab = x.ab || 1; if (ab > k || (x.bis && x.bis < k)) continue;
    if (ab > bAb) { best = e; bAb = ab; n = 1; } else if (ab === bAb && Math.random() < 1 / ++n) best = e; } // spätere Kapitelzeile vor früherer, sonst zufällig
  if (best) { gedanke('blick_' + best[0], best[2], o.delay ?? 300, o.prio ?? 1); return best[2]; }
  const w = o.wort && GEDANKEN_WORT[art]; if (w && !state.talking && +document.getElementById('subtitle').style.opacity < .05) { subtitle('<i>' + w + '</i>', 1600, GEDANKEN.who); return w; }
  return '';
}
// Generische Auslöser im Tick (1 s): an einer Laterne stehen bleiben · Katzen
function gedanken_umsehen() {
  const S = gedanken_S, P = player.pos, mv = S.lpx === null ? 0 : Math.hypot(P.x - S.lpx, P.z - S.lpz); S.lpx = P.x; S.lpz = P.z;
  if (typeof katzen_S !== 'undefined' && katzen_S.ok) { const c = katzen_S.carry;
    if (c && c !== S.katzeTrag) { const n = String(c.name || '').toUpperCase(), sub = n === 'KEINER' ? 'keiner' : n === 'LUCY' ? 'lucy' : /^H(Ä|AE)NSCHEN$/.test(n) ? 'haenschen' : 'tragen';
      if (!gedanken_blick('katze', sub, { delay: 900 })) gedanken_blick('katze', '', { delay: 900 }); }
    S.katzeTrag = c || null;
    if (katzen_S.beobOk) for (const k of katzen_S.cats) if (k.on && k.stare && Math.hypot(k.x - P.x, k.z - P.z) < 5) { if (!gedanken_blick('katze', 'ecke', { delay: 600 })) gedanken_blick('katze', 'zaun', { delay: 600 }); break; } } // KZ-02/KZ-15 nur bei Beobachter-Spur
  if (mv > .4) { S.lampStill = 0; return; } if (++S.lampStill < 2 || state.inBasement || state.zone === 'canal' || typeof lamps === 'undefined') return;
  for (const L of lamps) { if (L.wx === undefined || Math.hypot(L.wx - P.x, L.wz - P.z) > 2.6) continue;
    const nr9 = (typeof kap !== 'function' || kap() >= 3) && Math.hypot(L.wx - 50, L.wz + 12) < 14;
    gedanken_blick('laterne', L.mode === 'on' ? 'an' : (L.mode === 'flicker' || L.mode === 'pulse') ? 'flackert' : nr9 ? 'nr9' : 'aus'); return; }
}
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
  ['ort_sperre', 138, 158, -20, 20, () => true, 'Gesperrt. Ausgebrannte Autos. Als hätte jemand versucht, rauszufahren. Und es nicht geschafft.'],
  ['ort_nr9', 44, 56, -12.4, -9.5, () => typeof kap !== 'function' || kap() === 1, 'Ein Glas hinter den Brettern. Es zeigt auf Nr. 7. Nicht auf die Straße. Auf Nr. 7.'], // Kap. 1 (AP-14): das rote Glimmen im Astloch von Nr. 9; Wortlaut offen (Autor)
  // F3 Verständlichkeit, Kap. 1: das Dorf und Nr. 7 beim ersten Hinkommen (Kern §10.1: Hilde = Mutter von Jonas, Lukes bestem Freund)
  ['k1_hotelflur', -50, -36, -8, 8, () => (typeof kap !== 'function' || kap() === 1) && story.main <= 1, 'Lost Eyengless. Hier bist du groß geworden. Warum fühlt sich das an wie ein Hotelflur?'],
  ['ort_nr7', 17, 36, -11, 3, () => (typeof kap !== 'function' || kap() === 1) && story.main <= 1, 'Nr. 7. Frau Wendt. Jonas’ Mutter – bei denen hab ich als Kind öfter gegessen als zu Hause. Was will Lucy in ihrem Keller?']];
// Festhängen: Luke denkt laut über den nächsten Schritt nach (sanft, ohne Rätsellösung)
const GEDANKEN_FADEN = [
  [/Finde Haus Nr\. 7/, 'Nr. 7. Hilde Wendts Haus. Die Straße entlang … ich erkenne es, wenn ich davorstehe.'],
  [/Weg in Haus Nr\. 7/, 'Lucy hat Schlüssel immer irgendwo versteckt, wo man nicht sucht. Was hat sie mir vor der Tür hinterlassen?'],
  [/Durchsuche Haus Nr\. 7/, 'Irgendwo hier muss es einen Hinweis geben. Zettel, Kalender, alles, was Hilde aufgeschrieben hat.'],
  [/Kellertür/, 'Vier Ziffern. Welche Tasten sind abgegriffen? Und was hat Hilde in ihrem Kalender angestrichen?'],
  [/Lucy hinterlassen/, 'Lucy war hier unten. Sie hat etwas für mich liegen lassen. Etwas zum Anhören.'],
  [/Keller von Nr\. 7/, 'Die Wand mit den Zeichnungen. Mit bloßen Händen geht das nicht. Oben war doch eine Werkbank.'],
  [/unter der Erde sieht sie dich nicht/, 'Im Schatten bleiben. Hecken, Mülltonnen, die Veranda von Vegas. Und dem Vogel nach.'],
  [/die Treppe hoch\. Hinterher/, 'Die Haustür. Vorhin war die zu.'],
  [/Gang hinter der Wand|Folge dem Tunnel|Folge dem Gang/, 'Nur ein Weg. Also geh ihn, Luke.'],
  [/Amt über die Kinder|sieben Kinder von 2009/, 'Akten. Irgendwer hier hat alles aufgeschrieben. Die Wahrheit steht bestimmt in einer Schublade.'],
  [/Namen in die richtige Reihenfolge/, 'Wer zuerst zurückkam, steht links. Die Zeiten stehen in den Akten. Lies sie nochmal.'],
  [/Lösch die Laternen/, 'In ihrer Reihenfolge. Hilde hat aufgeschrieben, wann. Und die Einwilligungen sagen, wer zuerst unterschrieben hat.'],
  [/Luke|Leiter/, 'Die Leiter. Nach oben. Nicht umdrehen.'],
  [/Lost Eyengless geschehen/, 'Irgendwer muss wach sein. Der alte Vegas in Nr. 3 hat früher nie geschlafen.'],
  [/./, 'Was hab ich übersehen? In der Fibel steht, was ich weiß. Tab.']];
WORLD_MODS.push(['Gedanken', async () => {
  const S = gedanken_S;
  // Story-Ereignisse: die vorhandenen Funktionen bleiben, Luke reagiert danach (Aufruf per Name → Umhüllung greift überall)
  const after = (orig, fn) => async function (...a) { const r = await orig.apply(this, a); try { fn(...a); } catch (e) {} return r; };
  // Kap. 1 (AP-14): Stromausfall, Hilde auf der Straße und ihr Verschwinden sprechen jetzt kapitel1.js/kino.js mit den Zeilen der Bibel
  cowDrop = after(cowDrop, () => gedanke('kuh', 'Eine Kuh. Vom Himmel. Ich sollte schreien. Warum bin ich so ruhig? … Warum fühlt sich das an, als hätte ich das schon mal gesehen?', 2500, 3));
  // (F3 AP-12: Justins Ankunfts-Gedanke kommt jetzt aus justin.js am Ende der Pflichtsätze)
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
  CH2_BEGIN.push(() => gedanke('ch2_lucy', 'Hilde hat „Lucy“ geschrien. Nicht wie einen Namen. Wie einen Ort. Wenn Lucy irgendwo ist, dann hier unten.', 19000, 3)); // F3 Verständlichkeit: warum Luke hinuntergeht
  // AP-26: generische Untersuchungszeilen (85 §2) – Klopfen an verschlossene Häuser, gefundene Batterie
  if (typeof pickLine === 'function') pickLine = (o => function () { gedanken_blick('tuer', 'zu', { delay: 2600 }); return o.apply(this, arguments); })(pickLine);
  if (typeof addBattery === 'function') addBattery = (o => function () { const r = o.apply(this, arguments); if (state.started && !menu.attract) gedanken_blick('batterie', 'gefunden', { delay: 1600 }); return r; })(addBattery);
  CH2_END.push(() => gedanke('lena_tank', 'Lucy war da drin. „Weißt du es jetzt?“ … Ja. Und ich wünschte, ich wüsste es nicht.', 14000, 3));
}]);
WORLD_TICK.push((dt, t) => {
  const S = gedanken_S; if (!state.started || menu.attract) return; const now = performance.now(), P = player.pos;
  // Schreckmomente: die Atempause danach wählt die Regie (spannung.js → gedanken_atem). Generische Untersuchungszeilen (Laterne, Katzen) einmal je Sekunde:
  S.umT -= dt; if (S.umT < 0) { S.umT = 1; gedanken_umsehen(); }
  // H-6 (Story-Prüfung): in Kapitel 1 etwa alle zwanzig Minuten freier Erkundung ein Gedanke an Lucy – vor dem Tonband, nie in Szenen, Jagden oder traurigen Momenten
  if (curChapter() === 1 && !state.heardTape && !state.talking && !ui.overlay && !scripted && !(typeof hunt !== 'undefined' && hunt.on) && !(typeof spannung_traurig === 'function' && spannung_traurig())) {
    S.lucyT = (S.lucyT || 0) + dt; if (S.lucyT > 1200) { S.lucyT = 0; const L = GEDANKEN_LUCY.find(g => !S.said.has(g[0])); if (L) gedanke(L[0], L[1], 400, 2); } }
  // Orte
  for (const [id, x0, x1, z0, z1, ok, text] of GEDANKEN_ORTE) if (!S.said.has(id) && P.x > x0 && P.x < x1 && P.z > z0 && P.z < z1 && !state.inBasement && ok()) gedanke(id, text, 800, 1);
  if (story.items.includes('brechstange')) gedanke('brechstange', 'Kalk an der Spitze. Frisch. Jemand hat hier vor kurzem etwas aufgebrochen. Oder zugemauert.', 4600, 1);
  if (story.items.includes('drahtschneider')) gedanke('drahtschneider', 'Kinderpflaster auf den Griffen. Wer lässt so was in einem Schuppen liegen? Für wen?', 4600, 1);
  if (FLASH.charge <= 0 && flashOn) gedanke('akku_leer', 'Nein. Nein, nein, nein. Nicht jetzt. Nicht hier im Dunkeln.', 300, 3);
  if (typeof albers_S !== 'undefined') { if (albers_S.talked.has('laternen')) gedanke('albers1', 'Ein alter Mann, der Stimmen in Laternen hört. … Aber sie haben wirklich geatmet.', 1500, 2);
    if (albers_S.talked.has('augen')) gedanke('albers5', 'Blau. Meine Augen waren blau. Er irrt sich. Er muss sich irren.', 1500, 3); }
  // F3 Verständlichkeit: wer Vegas ist – beim ersten Gespräch durch die Tür oder beim ersten Zuruf beim Verstecken (Kap. 1)
  if (!S.said.has('vegas_wer') && ((typeof albers_S !== 'undefined' && albers_S.talked.size) || (typeof K1 !== 'undefined' && K1.v && K1.v.vegas) || (typeof whiskey_S !== 'undefined' && whiskey_S.vegas_taufe))) gedanke('vegas_wer', 'Herr Vegas, Nr. 3. Hatte schon damals Alufolie hinterm Fenster und hat uns mit dem Gartenschlauch vom Rasen gejagt. Und er ist wach.', 2500, 2);
  // Festhängen an einer Aufgabe
  const obj = document.getElementById('objText').textContent; if (obj !== S.obj) { S.obj = obj; S.objT = 0; } else if (!state.talking && !ui.overlay) S.objT += dt;
  if (S.objT > GEDANKEN.stuck) { S.objT = -GEDANKEN.stuck; const f = GEDANKEN_FADEN.find(([re]) => re.test(obj)); if (f) { const id = 'faden_' + obj.slice(0, 30); S.said.delete(id); gedanke(id, f[1], 0, 0); } }
  // Ausgabe: nur wenn nichts anderes läuft
  S.cd -= dt; if (S.cd > 0 || !S.q.length || state.talking || ui.overlay || state.ending) return;
  if (+document.getElementById('subtitle').style.opacity > .05) return;
  S.q = S.q.filter(x => x.until > now); if (typeof spannung_traurig === 'function' && spannung_traurig()) S.q = S.q.filter(x => !x.id.startsWith('atem_'));
  const g = S.q.find(x => x.at <= now && (typeof spannung_gedankenOk !== 'function' || spannung_gedankenOk(x.prio))); if (!g) return; S.q.splice(S.q.indexOf(g), 1);
  const ms = Math.max(3200, Math.min(6800, 1800 + g.text.length * 48)); subtitle('<i>' + g.text + '</i>', ms, GEDANKEN.who); S.cd = ms / 1000 + GEDANKEN.gap;
});
