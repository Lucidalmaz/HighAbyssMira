// =====================================================================  SAMMELN (Modul „sammeln“, Fassung 3 · AP-11): Sammelsysteme und Fibel-Reiter
// Stundenbuch SB-01…12 (Justin-Dossier §4, Kern §15.1) · „Der Laternenbote“ Z-01…11 (LWO-Dossier §5.2) · Fibel-Reiter „LOSE SEITEN“/„STUNDENBUCH“,
// „LATERNENBOTE“, „DAMALS“ (85 §5), „DAS BIST DU“ (85 §9), „SPIELREGELN“ (85 §5, „Lunas Spielregeln“); Kap.-1-Endkarte „Lose Seiten __ / 3“.
// Schnittstelle für die Kapitel-APs (alles über typeof prüfen):
//   sammeln_sb(nr)            → Seite SB-nr aufheben (Notizfenster mit der Seite als Bild) · sammeln_hatSB(nr)
//   sammeln_z(nr)             → Zeitung Z-nr aufheben (Zeitungsausschnitt) · sammeln_hatZ(nr)
//   sammeln_platz(id, o)      → Fundstück in die Welt legen: id 'SB-04' | 'Z-05', o = { x, y, z, ry, wand: true (an die nächste Wand), ab: Kapitel, label }
//                               (ein schon gelegtes Stück mit derselben id wird verschoben – z. B. SB-01 zu Justins Lager, sobald AP-15 es baut)
//   sammeln_fibel(flag)       → Fibel-Eintrag setzen: 'D-01'…'D-10' (Du-Seite, 85 §9), 'R-K1', 'R-heim', 'R-K2', 'R-K3a'…'R-K3e', 'R-K5a', 'R-K5b', 'R-K6',
//                               'R-ochs', 'R-eisen' (Spielregeln), 'J-15' (Jonas, nach „Vierzig Mal“), 'sb07_strike' (SB-07 durchgestrichen, Raum 3)
//                               Ohne Aufruf zieht der Kapitelfortschritt die Einträge spätestens beim nächsten Kapitel nach (sammeln_auto).
//   sammeln_reiter(key, label, render, visible) → weiterer Fibel-Reiter (z. B. „KARTE“ aus karte.js)
//   sammeln_k1Zeile()         → Zählerzeile der Kap.-1-Endkarte (wird an die Karte in kino.js angehängt)
// Spielstand (AP-03): 'sammeln' = { sb: [nr…], z: [nr…], fibel: [flag…] }
const sammeln_S = { sb: new Set(), z: new Set(), fibel: new Set(), neu: new Set(), orte: {}, img: {}, reiter: [], ready: false, placed: false, k: 0 };
// ---- SB-01…SB-12 (Wortlaut Justin-Dossier §4; Jahr nur auf dem Feld)
const SAMMELN_SB = [
  { nr: 1, jahr: '1329', ort: 'Hof, Scheune', f: { holz: 1 }, desc: 'Eine Seite aus einem kleinen Gebetbuch, am Rand ein Splitter vom Holzdeckel, die Randschrift groß und ungelenk, übertragen.',
    txt: ['Siebzehn Winter hab ich am Rand gewartet. Heut Nacht ging es auf.', 'Ich bin hinein und hab gerufen, bis die Stimme weg war.', 'Sie hat gelacht. Ganz nah, wie hinterm Vorhang.', 'Und ist nicht gekommen.', 'Morgen geh ich wieder. Es gibt kein Morgen da drin. Ich geh trotzdem.'] },
  { nr: 2, jahr: '1618', ort: 'Sühnekreuz', f: { brand: 1 }, desc: 'Die Seite ist an einer Ecke versengt; über dem Gebet ein brauner Fleck, der nach Rauch riecht, übertragen.',
    txt: ['Das Dorf brennt. Reiter, die keiner kennt. Ich hab die Kinder in den Kapellenkeller gebracht, elf Stück.', 'Unter der Erde sieht sie keinen. Dort sind sie sicher.', 'Der Kleinste wollte seine Laterne mitnehmen. Ich hab sie ausgeblasen. Er hat mich gehasst dafür.', 'Ich wünschte, ich könnte auch einmal sicher sein.', 'Oben ist es hell. Ich weiß nicht, ob das Feuer ist oder sie.'] },
  { nr: 3, jahr: '1890', ort: 'Bushaltestelle', f: { tinte: 1 }, desc: 'Die Seite ist mit Tintenfingern angefasst worden, nicht seinen; am Rand steht in fremder Schrift „etwa vierzig“, übertragen.',
    txt: ['Der Lehrer hat mich ausgefragt, drei Stunden, mit Tinte. Er schreibt alles in ein Buch. Er glaubt mir jedes Wort und keins.', 'Er fragt, wie alt ich bin. Ich sag: so alt wie das Dorf. Er schreibt was anderes hin.', 'Hinter dem Wald fährt ein Haus aus Eisen auf zwei Strichen und schreit. Der Lehrer sagt, das sei die Zukunft.', 'Wenn das die Zukunft ist, ist sie laut.', 'Sie war heute leise. Sie hat nur gezählt. Ich hab mitgezählt und wieder bei siebzehn aufgehört.'] },
  { nr: 4, jahr: '2009', ort: 'Messraum, Stuhl 8', f: { holz: 1, falz: 1 }, desc: 'Eine lose Seite mit dem Rest eines Holzdeckels, wasserfleckig, sauber gefaltet, als hätte jemand sie absichtlich hingelegt, übertragen.',
    txt: ['Ich habe einen Knaben herausgeführt. Er hielt meine Hand so fest wie sie damals.', 'Draußen hatte er andere Augen. Ich habe es nicht gemerkt. Es war dunkel, und die Männer in Eisen waren schnell.', 'Sie haben ihn mir am Rand abgenommen. Sie sagten, sie bringen ihn heim. Sie haben gelogen wie ich.', 'Ich bin ihnen nach, unter die Erde. Er saß in ihrer Maschine, festgeschnallt, und hat nicht geweint. Ich hab ihn losgeschnitten. Ihr Eisen war härter als meine Klinge.', 'Wenn ich ihn wiederfinde, schulde ich ihm was. Ich weiß nur nicht, was.'] },
  { nr: 5, jahr: '1975', ort: 'Nr. 4, Peters Zimmer', f: { blume: 1 }, desc: 'Zwischen den Seiten eine gepresste Butterblume, fast durchsichtig; darunter, in Kinderschrift mit Kuli, „MARION“, übertragen.',
    txt: ['Ein Mädchen hat mir eine Butterblume geschenkt. Marion. Sie fragt, ob Ritter weinen dürfen.', 'Ich hab gesagt: nur im Helm. Sie hat gelacht.', 'Ihr Bruder Peter kam an meiner Hand heraus. Er hat meine Augen. Ich hab’s im Haus gesehen, bei Kerzenlicht.', 'Ich hab ihn trotzdem der Mutter gegeben. Was sonst.', 'Die Blume bleibt hier drin. Wenn sie weg ist, hat sie Wîse.'] },
  { nr: 6, jahr: '1941', ort: 'Villa Seiler, Briefkasten', f: { schuh: 1 }, desc: 'Die Seite steckt zwischen Werbung und einer Mahnung; ein Abdruck von einem kleinen Schuh, halb über dem Gebet, übertragen.',
    txt: ['Zwei Jungen an meinen Händen, Theodor und Heinrich. Der eine schweigt, der andere schreit nach seiner Schwester.', 'Grete. Sechs. Sie hat sich auf einen Stuhl gesetzt und wollte nicht mehr aufstehen.', 'Heinrich hat mich getreten. Ich soll zurück. Ich bin zurück. Ich habe sie nicht gefunden.', 'Ich finde nie jemanden. Ich finde nur die, die gefunden werden wollen.', 'Er hat gesagt, er wird groß und holt sie selbst. Ich hab’s ihm geglaubt.'] },
  { nr: 7, jahr: '1312', ort: 'Nimmerheim, Raum 3', f: { doppelt: 1 }, desc: 'Die Seite liegt auf dem Reif und ist nicht nass; die Schrift ist fester als auf den anderen, jeder Buchstabe zweimal nachgezogen, übertragen.',
    txt: ['Martinsnacht. Ich hatte ihre Hand. Am Rand, wo der Tau war.', 'Die Luft ist aufgerissen wie Stoff, und dahinter war nichts.', 'Sie hat losgelassen. Ich hielt, bis das Licht mir die Hand nahm.', 'Der Ring ist in mir drin. Ein halber Mond. Mehr hab ich nicht von ihr.', 'So war es. So schreib ich es. So bleibt es.'] },
  { nr: 8, jahr: '1958', ort: 'Villa, Asservat 7/58', f: { huelle: 1 }, desc: 'In einer Klarsichthülle mit Etikett; neben der Randschrift in grauer Tinte ein einzelnes „W.“, übertragen.',
    txt: ['Männer in grauen Mänteln, mit Netzen aus Eisen. Sie haben zwei von den Kleinen gefangen. Die, die mir die Haut gegeben haben.', 'Ich habe zugesehen. Wieder.', 'Der dritte saß im Gebüsch und hat mich angesehen, als könnt ich was tun.', 'Ein Junge namens Hans blieb drin. Seine Schwester stand mit dem Fahrrad am Zaun, bis es hell war.', 'Das Netz hat mich auch gehalten. Eisen ist Eisen. Ich hab’s durchgeschnitten. Zu spät.'] },
  { nr: 9, jahr: 'Brescia', ort: 'Villa, „Subjekt EISEN“', f: { zitter: 1 }, desc: 'Die Seite trägt kein Jahr, nur oben „Brescia“; sie ist die einzige, auf der die Schrift schief wird, als hätte die Hand gezittert, übertragen.',
    txt: ['Vor der Stadt. Sie hängen sie an die Bäume, damit die drinnen es sehen. Ich steh in der Reihe und halte ein Pferd.', 'Ein Junge hat mich um Wasser gebeten, in seiner Sprache. Ich hatte Wasser.', 'Ich hab mich umgedreht.', 'Mira, wenn du das liest: Ich hab’s nie gesagt. Hier schwör ich’s, wo du es findest. Nie wieder ein Kind, dem ich nicht helfe.', 'Und wenn ich ewig brauch.'] },
  { nr: 10, jahr: '♪', ort: 'Stall am Hof', f: { mira: 1, knick: 1 }, desc: 'Die einzige Seite in einer anderen Schrift: klein, sauber, mit Häkchen über den Wörtern, die wie Noten aussehen und keine sind; die Ecke eingeknickt, wo der Schnabel war; unten eine Zeile von Justins Klötzen, übertragen.',
    txt: ['Schlaf, Kind, im Laternenschein,', 'der Rab hält Wacht, du bist nicht allein.', 'Ich zähl die Schläge, ich zähl die Zeit,', 'und wo du hingehst, bin ich nicht weit.', '(Ihre Hand. Nicht meine. Wîse hat die Seite gebracht. Ich weiß nicht, woher.)'] },
  { nr: 11, jahr: '1992', ort: 'Hochsitz', f: { nagel: 1, regen: 1 }, desc: 'Die Seite ist an einen Nagel gespießt, durch das Gebet hindurch; Regen hat die Tinte laufen lassen, nur die Klötze am Rand halten, übertragen.',
    txt: ['Sie tragen jetzt Eisen wie ich und glauben, es sei dasselbe. Drinnen halten sie so lang wie ein Atemzug.', 'Sie haben etwas aus dem Abgrund gezogen, das nach mir gerochen hat. Es sprach mit meiner Stimme. Es sagte: Such mich, Papa.', 'Ich hab’s beinah geglaubt.', 'Der Pfarrer wollte die Kinder wegbringen. Ich hab ihn zuletzt am Nordzaun gesehen, im Nebel, ohne Laterne. Ein kluger Mann.', 'Wîse war die ganze Nacht still. Das ist neu.'] },
  { nr: 12, jahr: '2026', ort: 'Hochsitz, Epilog', f: { holz: 1, klein: 1 }, desc: 'Die letzte Seite des Buchs, mit dem Rest des Holzdeckels dran; die Schrift ist kleiner als sonst, als hätte er sich Mühe gegeben, übertragen.',
    txt: ['Luke. Ich schreib den Namen, weil ich ihn nicht sagen kann, ohne dass mir was wegbricht.', 'Ich such weiter. Du gib acht auf deine Schwester. Das Weiß in ihren Augen geht weg, wenn man sie lang genug ansieht.', 'Heut Nacht hab ich sie lachen gehört. Zum ersten Mal ganz nah. Nicht hinterm Vorhang.', '@4', 'Wenn Wîse dir das bringt, hat er den Weg. Dann gibt es einen.'],
    var: { A: 'Die Platte auf der Brust geht nicht ab. Ich hab’s jede Runde versucht. Sie lässt sie nicht, oder ich lass sie nicht, ich kann’s nicht unterscheiden.',
      B: 'Ich zähl jetzt mit ihr. Bis siebzehn. Beim nächsten Mal bin ich dran mit Verstecken, hat sie gesagt. Zu niemandem. Aber ich hab’s gehört.',
      C: 'Ich such jetzt laut. Sie hört mich. Wenn sie mich beim nächsten Mal sieht, dann weißt du, wer’s war.' } },
];
// ---- Z-01…Z-11 (Wortlaut LWO-Dossier §5.2)
const SAMMELN_Z = [
  { nr: 1, datum: '1958', titel: 'Wetterballon über dem Hohen Abgrund niedergegangen', hw: 1, foto: 'bergung', fotoText: 'Die Bergung in den frühen Morgenstunden.',
    text: 'Lost Eyengless. In der Nacht zum Dienstag ist über dem Hohen Abgrund ein Wetterballon der Bundesstelle für Rückführung niedergegangen. Die Bergung wurde in den frühen Morgenstunden abgeschlossen. Anwohner, die ein „starkes Leuchten“ beobachtet haben wollen, werden gebeten, sich nicht zu beunruhigen: Die Instrumente des Ballons sind mit Signalfarbe versehen. Die neue Außenstelle der Bundesstelle in der Ahornstraße nimmt am Donnerstag ihren Betrieb auf; Bürgersprechstunde 14–16 Uhr.',
    daneben: 'Kaninchenzuchtverein: Rammler ‚Fritz‘ erneut Kreissieger.', notiz: 'Auf dem Foto der Bergung, am Rand, ein junger Mann im Mantel, der schon aussieht, als hätte er nie geschlafen.' },
  { nr: 2, datum: '1975', titel: 'UFO über dem Abgrund? Experte: Sumpfgas', hw: 1, foto: 'kreuzung', fotoText: 'Kinder auf der Kreuzung am Morgen danach.',
    text: 'Lost Eyengless. Nach dem Sommerfest wollen mehrere Bürger „ein Schiff aus Licht“ über dem Hohen Abgrund gesehen haben. Der Leiter der Bundesstelle für Rückführung, Dr. Th. Seiler, erklärt dazu: „Es handelt sich um Sumpfgas, das sich bei der Witterung selbst entzündet. Ein bekanntes Phänomen im Abgrundtal.“ Sieben Kinder, die in der Nacht im Wald übernachtet hatten, sind wohlauf und wurden ihren Eltern übergeben. Von einer Kuh der Familie Aydın fehlt jede Spur.',
    daneben: 'Schützenfest: Königsschuss um 18 Uhr, Damen frei.', notiz: 'Hinter dem Fotografen, als Schatten in der Scheibe der Telefonzelle: ein Hut.' },
  { nr: 3, datum: '1992', titel: 'Wildschaden: Waldgebiet am Kirchberg gesperrt', hw: 1, laminiert: 1,
    text: 'Lost Eyengless. Wegen erheblicher Wildschäden und Gefahr durch umstürzende Bäume ist das Waldgebiet nördlich des Spielplatzes bis auf Weiteres gesperrt. Das Amt für Rückführung hat im Auftrag der Gemeinde zweisprachige Schilder aufstellen lassen, „damit auch unsere amerikanischen Gäste Bescheid wissen“. Der Förster bittet, keine Tiere anzufassen, die sich „ungewöhnlich verhalten“. Zuwiderhandlungen werden nicht verfolgt.',
    daneben: 'Verloren: Dackel ‚Bruno‘, hört nicht auf seinen Namen. Belohnung.' },
  { nr: 4, datum: '2009', titel: 'Unwetterwarnung: Südstraße bleibt gesperrt', hw: 1,
    text: 'Lost Eyengless. Aufgrund einer amtlichen Unwetterwarnung bleibt die Südstraße bis einschließlich Sonntag gesperrt. Die Bundesstelle für Rückführung bittet die Bevölkerung, im Ort zu bleiben und Fahrten zu verschieben. „Es besteht kein Anlass zur Sorge, aber Anlass zur Vorsicht“, so Amtsarzt Dr. E. Brand. Das Sommerfest findet wie geplant statt; die Lampions werden am Festabend verteilt.',
    daneben: 'Pfandflaschen-Sammelaktion der Jugendfeuerwehr: 611 Flaschen, danke!', kuli: 'Unwetter. Es war der heißeste Juli seit Jahren. (L. V.)' },
  { nr: 5, datum: '2011', titel: 'Gasleck in ehemaliger Behörde: zwei Tote', hw: 1, radiert: 'Zähne',
    text: 'Lost Eyengless. Bei einem Gasleck in den Kellerräumen der Bundesstelle für Rückführung sind in der Nacht zum vierten März zwei Mitarbeiter ums Leben gekommen. Die Leitung spricht von einem „tragischen Unglück durch veraltete Leitungen“. Die Räume wurden versiegelt. Angehörige werden betreut. Der Sprechstundenbetrieb geht am Donnerstag weiter.',
    daneben: 'Katzenausstellung im Gemeindesaal: Frau Rieke stellt siebzehn Tiere aus, alle mit Namen.', notiz: 'Jemand hat über „Gasleck“ mit Bleistift „Zähne“ geschrieben und es wieder ausradiert; man kann es noch lesen.' },
  { nr: 6, datum: '2012', titel: 'Bundesstelle schließt – Dank an die treuen Mitarbeiter', hw: 1, foto: '-', fotoText: 'Frau Hilde Wendt mit Blumenstrauß.',
    text: 'Lost Eyengless. Nach 54 Jahren schließt die Außenstelle der Bundesstelle für Rückführung. Bürgermeister und Leitung dankten den langjährigen Mitarbeitern, darunter Frau Hilde Wendt (26 Jahre Verwaltung), die einen Blumenstrauß erhielt. „Die Aufgabe ist erfüllt“, sagte Dr. Seiler. Die Akten werden „ordnungsgemäß verwahrt“. Ein Institut für Atmosphärenforschung wird künftig die Messstelle am Kirchberg betreiben.',
    notiz: 'Hilde mit Blumen, lächelt nicht. Am Rand ein Mann im Mantel, Mitte vierzig. Derselbe wie 1975. Derselbe wie 1958.' },
  { nr: 7, datum: '2019', titel: 'Früherer Amtsarzt tot in seiner Villa aufgefunden – keine Fremdeinwirkung', hw: 1,
    text: 'Lost Eyengless. Dr. Theodor Seiler, langjähriger Leiter der Bundesstelle für Rückführung, ist im Alter von 85 Jahren in seiner Villa am Westrand tot aufgefunden worden. Die Polizei geht von einer natürlichen Ursache aus. Seiler lebte seit Jahren zurückgezogen. „Er hat dem Ort gedient, wie er es verstand“, sagte ein früherer Mitarbeiter. Die Villa bleibt bis zur Klärung der Erbfolge verschlossen.',
    daneben: 'Laternenfest fällt in diesem Jahr aus (Brandschutz).', notiz: 'Es fällt seit 1958 in jedem siebzehnten Jahr aus. Niemand hat je nachgerechnet.' },
  { nr: 8, datum: '29. Oktober 2026', titel: 'Dritte Vermisste des Jahres – Polizei: kein Fremdverschulden', hw: 1,
    text: 'Lost Eyengless. Seit Freitag wird Lucy B. (26) aus der Ahornstraße vermisst. Polizeiobermeister Kühn: „Es gibt keine Hinweise auf Fremdverschulden. Frau B. hat sich möglicherweise selbständig entfernt.“ Bereits im Juni und Juli galten zwei weitere Bewohner der Ahornstraße als vermisst. Hinweise an die Polizei oder an die Messstelle Kirchberg.',
    daneben: 'Gemeindesaal: Bürgerversammlung ‚Die Lichter über dem Wald‘ entfällt.' },
  { nr: 9, datum: '5. November 2026', titel: 'Stromausfall: Umspannwerk überlastet – alle wohlauf', hw: 1, fuss: 'Redaktionsschluss: Mittwoch, 22 Uhr.',
    text: 'Lost Eyengless. In der Nacht zum Donnerstag fiel im gesamten Ort der Strom aus. Ursache ist nach Auskunft des Instituts für Atmosphärenforschung eine Überlastung des Umspannwerks durch Nebelbildung. Alle Bewohner sind wohlauf. Die Straßenlaternen wurden vorsorglich abgeschaltet. Die Bevölkerung wird gebeten, Kreidespuren auf der Fahrbahn nicht zu beachten; es handelt sich um Vermessungsarbeiten.',
    notiz: 'Der Artikel ist gedruckt, bevor irgendwer nachsehen konnte.' },
  { nr: 10, datum: 'Aus aller Welt', titel: 'Aus aller Welt', welt: [
      ['Ohio', 'Anwohner klagen über Kinderstimmen aus einem Haus, das seit 1947 leer steht. Die Stimmen singen im Kanon. Ein ‚Institut‘ hat das Grundstück gekauft.'],
      ['Nordsee', 'Ölkonzern hält stillgelegte Bohrinsel aus Umweltgründen besetzt. Ein Sprecher: ‚Wir fördern nicht mehr. Wir halten nur dicht.‘'],
      ['Lagune (Mittelmeer)', 'Fischer melden Licht unter dem Wasser. Behörden: Algen. Das Baden ist an der Stelle seit 1961 verboten; die Bojen tragen ein Auge.'],
      ['Ural', 'Bergwerk nach 70 Jahren wieder ‚in Betrieb‘, fördert aber nichts. Nachtschicht meldet Klopfzeichen aus Stollen 3. Die Gewerkschaft hat einen Dolmetscher angefordert. Für was, sagte sie nicht.'],
      ['Irland', 'Moorleiche entpuppt sich als ‚nicht abschließend datierbar‘. Das Fundstück wurde in einen Kühlwagen mit ausländischem Kennzeichen verladen. Es hat, so ein Torfstecher, ‚gezählt‘.'],
      ['Chile', 'Station 4 eines Provinzkrankenhauses seit Jahrzehnten wegen Renovierung geschlossen. Die Nachtschwester bringt weiterhin Essen. Auf die Frage, für wen, lächelt sie.']],
    kuli: 'SIEHST DU? ÜBERALL.' },
  { nr: 11, datum: '1992', titel: 'Pfarrer Voss vermisst – Gemeinde betet', hw: 1,
    text: 'Lost Eyengless. Seit der Nacht zum 22. Juni wird Pfarrer Bernhard Voss (St. Martin) vermisst. Der Geistliche hatte am Vortag angekündigt, mit einer Gruppe von Kindern „für einige Tage in die Berge“ zu fahren; der Bus wurde am Waldrand verlassen aufgefunden, die Kinder wohlbehalten. Das Amt für Rückführung geht davon aus, dass sich der Pfarrer „im Nebel verirrt“ hat. Die Gemeinde trifft sich zum Gebet. Die dreizehnte Predigt der Reihe „Vom Licht“ entfällt.',
    daneben: 'Kirchenchor sucht Tenöre. Auch ungeübte.' },
];
// ---- Fibel: Jonas (85 §5), Du-Seite (85 §9), Spielregeln
const SAMMELN_JONAS = [
  ['J-01', 'DIESE FIBEL GEHÖRT: JONAS (CHEF). LUKE (VIZE). LUCY (NUR WENN SIE NETT IST). ZAYN (<s>NEIN</s> OK WEIL ER GEHEULT HAT).', 'Deckel innen'],
  ['J-02', 'BANDENREGELN. 1 KEINER SAGT WAS, AUCH NICHT MAMA. 2 WER DAS HEFT VERLIERT IST RAUS. 3 DIE LOSUNG WIRD NUR GEFLÜSTERT. 4 WER PUPST MUSS ZÄLEN. 5 ZAYN DARF MIT WENN ER DIE TASCHENLAMPE TRÄGT.'],
  ['J-03', 'HEUTE HABEN WIR DEN GULLY GEFUNDEN. DA UNTEN IST WASSER UND LICHTER. ICH NENN ES ATLANTSCHISS. LUKE SAGT DAS IST KEIN WORT. IST ES JETZT.'],
  ['J-04', 'EXPEDITION GULLY 2: SCHNUR RUNTERGELASSEN. KAM NASS WIEDER. UND WARM. LUCY SAGT DAS IST EKLIG. LUCY HAT RECHT ABER AUCH NICHT.'],
  ['J-05', 'SCHATZ VERGRABEN HINTER DER KAPELLE, 3 SCHRITTE VOM SCHIEFEN KREUZ. INHALT: 2 MARK, 1 FLUMMI, LUCYS WACKELZAHN (GEKLAUT).'],
  ['J-06', 'MUTPROBE: NACHTS BIS ZUR LATERNE VOR NR. 9 UND ZURÜCK. LUKE: GESCHAFFT. LUCY: GESCHAFFT (SCHNELLER). ZAYN: GEHEULT. ICH: MUSSTE AUF ZAYN AUFPASSEN.'],
  ['J-07', 'DER ALTE VEGAS HAT UNS MIT DEM GARTENSCHLAUCH NASS GEMACHT UND GERUFEN DIE LATERNEN HÖREN MIT. WIR HABEN GANZ LEISE GELACHT. FÜR DEN FALL.'],
  ['J-08', 'ZAYN HAT GEFRAGT OB MAN IN ATLANTSCHISS SCHWIMMEN KANN. ICH HAB GESAGT NUR ALS FISCH. ER ISST SEITDEM KEINEN FISCH. AUS SOLIDARITÄT.'],
  ['J-09', 'DIE 7 HABEN LAMPIONS GEKRIEGT. ICH NICHT. ZAYN SCHON. ER GIBT DAMIT AN. ICH HAB GESAGT ICH WILL KEINEN. STIMMT NICHT.', 'Juli 2009'],
  ['J-10', 'ZAYN IST NICHT ZURÜCKGEKOMMEN. MAMA SAGT ER KOMMT SPÄTER. ICH HAB ROTE WOLLE GEHOLT. MAN BINDET SIE AN UND GEHT REIN UND FINDET ZURÜCK. SUCHE NR. 1.'],
  ['J-11', 'LUKE IST KOMISCH SEIT DER NACHT. ER WEISS NICHT MEHR WO UNSER VERSTECK IST. ICH HABS IHM GEZEIGT. ER HAT DANKE GESAGT. LUKE SAGT NIE DANKE.'],
  ['J-12', 'LUKE HAT EINEN RITTER IN DIE FIBEL GEMALT. ICH HAB GESAGT RITTER GIBTS NICHT MEHR. ER HAT GESAGT DER SCHON.'],
  ['J-13', 'LUCY SAGT ES GIBT REGELN. SIE SAGT NICHT WOHER SIE DAS WEISS. ICH SCHREIB SIE HINTEN REIN. DAMIT ZAYN SIE HAT WENN ER SIE BRAUCHT.'],
  ['J-14', 'SUCHE NR. 17. WOLLE ALLE. HAB MAMAS PULLOVER AUFGERIBBELT. SIE HAT NICHTS GESAGT. SIE SAGT ÜBERHAUPT NICHTS MEHR.'],
  ['J-15', 'SUCHE NR. 40. ICH HÖR AUF. NICHT WEIL ICH NICHT WILL. WEIL ICH WEG MUSS. ZAYN WENN DU DAS LIEST: DIE WOLLE HÄNGT NOCH AM ZAUN. HALT DICH FEST.'],
  ['J-16', 'REGEL 4 GILT FÜR IMMER. AUCH FÜR ERWACHSENE.'],
];
const SAMMELN_DU = [ // [Zeile, Flag, durchgestrichen?, daneben]
  ['Name: Luke Brandt.', 'D-04', 'Luke Brandt.', 'K-3?', 'D-08', 'K-3?', 'Luke. Er hat gesagt, ich darf.'],
  ['Alter: 26.', 'D-02', 'Alter: 26.', 'Siebzehn. Seit dem fünften August, 03:13.'],
  ['Augen: braun. (Jonas, du Pflaume.)', 'D-03', '(Jonas, du Pflaume.)', 'Jonas hatte recht.'],
  ['Beruf: Tontechniker, Nachtschicht. Hörbücher, Podcasts, Werbung für Matratzen.'],
  ['Narbe: linke Hand, halbrund. Fahrradunfall, sagt Mama.', 'D-06', 'Fahrradunfall, sagt Mama.', 'Er hat die gleiche.'],
  ['Hund: hatten wir einen. Name? War ja klein.', 'D-05', 'Name? War ja klein.', 'Flocke. Ich hab’s nie gewusst. Sie schon.'],
  ['Früheste Erinnerung: warmer Asphalt, nackte Füße, eine kalte Hand.', 'D-07', null, 'Eisen. Seine.'],
  ['Traum, immer derselbe: Du hast dich versteckt. Keiner kommt dich suchen.', 'D-09', 'Keiner kommt dich suchen.', 'Stimmt nicht. Lucy. Elfmal.'],
  ['Angst vor: nichts. Spinnen nicht mehr.', 'D-10', 'Angst vor: nichts.', 'Vor dem Moment, wenn Whiskey still wird.'],
  ['Schwester: Lucy. Hab seit dem Sommer nichts von ihr gehört.', 'D-01', 'Hab seit dem Sommer nichts von ihr gehört.', 'Sie hat mich elfmal angerufen. Ich bin nicht rangegangen.'],
];
const SAMMELN_REGELN = ['SIE ZÄLT BIS 17. DANN SUCHT SIE. WER GEFUNDEN WIRD MUSS ZÄLEN. (SAGT LUCY)', 'WER EINE LATERNE HAT DEN NIMMT SIE MIT. DARUM HABEN NUR DIE 7 EINEN GEKRIEGT. (UNFAIR. ABER AUCH GUT.)',
  'WENN MAN HINGUCKT BEWEGT ES SICH NICHT. WIE OCHS AM BERG. ICH HAB 1 STUNDE AUFS FENSTER GEGUCKT. ES HAT SICH NICHT BEWEGT. ICH AUCH NICHT.', 'AUGEN ZU DANN SIEHT SIE DICH NICHT. (SAGT DINA. DINA MACHT SIE GAR NICHT MEHR AUF.)',
  'SIE KANN STIMMEN. HAT MICH MIT MAMAS STIMME GERUFEN. MAMA WAR IM BAD.', 'IM KELLER SPIELT SIE NICHT. DAS IST AUS. (ZAYN WOLLTE NIE IN DEN KELLER. WEGEN SPINNEN.)', 'EISEN IST FREI. STEHT AM SPIELPLATZ. OMA ERNA SAGT FRAG NICHT.'];
const SAMMELN_LUKE_REGELN = [ // [Flag, Text] – Lukes Kuli-Zeilen (85 §5), Kapitelfolge; 'R-ochs'/'R-eisen' aus Kap. 1, Nebenaufgabe 12
  ['R-ochs', 'Bewegt sich nur, wenn man nicht hinguckt.'], ['R-eisen', 'Eisen: dann gar nicht.'], ['R-frei', 'Eisen ist frei. Stand da. Stimmt.'],
  ['R-K1', 'Wer einmal drin war, den findet sie wieder.'], ['R-heim', '(Ich hab’s ausprobiert.)'],
  ['R-K2', 'Augen zu hilft nicht, wenn man weiß, was man ist. Sie guckt durch mich durch.'],
  ['R-K3a', 'Laterne laufen: die Straßenlaternen sind ihre Augen. Alle aus = sie muss runter.'], ['R-K3b', 'Sie hat einen Namen. Luna. Er hat sie mir nicht wie eine Tote genannt.'],
  ['R-K3c', 'zu 5: Sie kann nur sagen, was schon mal laut gesagt wurde.'], ['R-K3d', 'zu 7: Eisen ist frei. Aber nicht unsichtbar.'], ['R-K3e', 'An der Hand raus. Nicht loslassen. Nie.'],
  ['R-K5a', 'Wer mitisst, bleibt über Nacht. Ich hab nichts gegessen. Fast nichts.'], ['R-K5b', 'Geschenkt ist geschenkt. Lucy weiß den Namen. Damit ihn noch einer weiß: CLEO.'],
  ['R-K6', 'Regel für den Wald: Sie sieht hier nichts. Aber etwas anderes hört.']];
// Spätester Zeitpunkt je Fibel-Eintrag (falls kein Kapitel-Modul ihn früher setzt): Kapitel, ab dem er steht (7 = nach dem Ende von Kap. 6)
const SAMMELN_AUTO = { 'D-02': 3, 'D-03': 3, 'D-04': 3, 'D-05': 3, 'D-06': 4, 'D-07': 4, 'D-08': 6, 'D-09': 6, 'D-10': 7, 'R-K1': 2, 'R-K2': 3, 'R-K3a': 4, 'R-K3b': 4, 'R-K3c': 4, 'R-K3d': 4, 'R-K3e': 4, 'R-K5a': 6, 'R-K5b': 6, 'R-K6': 7 };
const sammeln_hatSB = n => sammeln_S.sb.has(n), sammeln_hatZ = n => sammeln_S.z.has(n), sammeln_hat = f => sammeln_S.fibel.has(f);
const sammeln_pad = n => String(n).padStart(2, '0');
const sammeln_R = s => { let a = s | 0 || 1; return () => (a = (a * 16807) % 2147483647) / 2147483647; }; // fester Zufall: jede Seite sieht immer gleich aus
function sammeln_fibel(f) { if (sammeln_S.fibel.has(f)) return; sammeln_S.fibel.add(f); sammeln_S.neu.add(f); if (sammeln_S.ready && /^D-/.test(f) && typeof gedanke === 'function') gedanke('sam_du', 'Die Fibel. Da stimmt was nicht mehr, auf meiner Seite.', 1200, 1); }
function sammeln_auto() { // Kapitelfortschritt zieht Einträge nach, die kein Kapitel-Modul gesetzt hat; dazu Belege, die die Basis schon kennt
  const k = kap(), done = (typeof KAP !== 'undefined' && KAP.done) || 0, lore = key => story.lore.some(l => l.key === key);
  for (const [f, ab] of Object.entries(SAMMELN_AUTO)) if (!sammeln_hat(f) && (ab <= 6 ? k >= ab : done >= 6)) sammeln_fibel(f);
  if (lore('phone')) sammeln_fibel('D-01'); if (lore('akte8')) { sammeln_fibel('D-02'); sammeln_fibel('D-03'); }
  for (const q of Object.values(story.side)) if (q && q.title === 'Vierzig Mal' && q.state === 'done') sammeln_fibel('J-15');
}
// ---------------------------------------------------------------------  Bilder: Stundenbuchseite (Canvas, einmal je Seite)
const SAMMELN_LATEIN = 'Domine labia mea aperies et os meum annuntiabit laudem tuam. Deus in adiutorium meum intende. Domine ad adiuvandum me festina. Gloria patri et filio et spiritui sancto sicut erat in principio et nunc et semper et in secula seculorum amen. Venite exultemus domino iubilemus deo salutari nostro preoccupemus faciem eius in confessione et in psalmis iubilemus ei. Quoniam deus magnus dominus et rex magnus super omnes deos quoniam non repellet dominus plebem suam quia in manu eius sunt omnes fines terre et altitudines montium ipse conspicit. Ave maria gratia plena dominus tecum benedicta tu in mulieribus. Memento salutis auctor quod nostri quondam corporis ex illibata virgine nascendo formam sumpseris. Maria mater gratie mater misericordie tu nos ab hoste protege et hora mortis suscipe.'.split(' ');
function sammeln_fleck(x, R, cx, cy, r, a) { // Wasserfleck mit Trockenrand
  const n = 38, pts = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, rr = r * (.78 + .3 * R() + .12 * Math.sin(t * 3 + R() * 6)); pts.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr * (.8 + .2 * R())]); }
  x.save(); x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath();
  x.fillStyle = `rgba(150,110,55,${a * .35})`; x.fill(); x.lineWidth = 5; x.strokeStyle = `rgba(110,72,30,${a})`; x.filter = 'blur(1.5px)'; x.stroke(); x.filter = 'none'; x.lineWidth = 1.2; x.strokeStyle = `rgba(90,58,24,${a * .9})`; x.stroke(); x.restore();
}
function sammeln_kloetze(x, R, text, x0, y0, maxW, size, o = {}) { // Justins eckige Randschrift: große, ungelenke Klötze, nichts durchgestrichen
  let px = x0, py = y0; x.save(); x.fillStyle = o.col || 'rgba(30,20,12,.9)';
  for (const ch of text) { if (ch === ' ') { px += size * .55; if (px > x0 + maxW) { px = x0 + R() * 8; py += size * 1.25; } continue; }
    const s = size * (.86 + R() * .3), rot = (R() - .5) * (o.zitter ? .5 : .16) + (o.zitter ? (py - y0) * .0006 : 0);
    x.save(); x.translate(px, py + (R() - .5) * size * .18); x.rotate(rot); x.scale(1.15, 1); x.font = `700 ${s}px Georgia, serif`; x.fillText(ch, 0, 0);
    if (o.doppelt) { x.globalAlpha = .55; x.fillText(ch, 2.2, 1.4); } x.restore(); px += s * .82 + R() * 3; if (px > x0 + maxW) { px = x0 + R() * 8; py += size * 1.25; } }
  x.restore(); return py;
}
function sammeln_sbBild(nr) {
  if (sammeln_S.img[nr]) return sammeln_S.img[nr];
  const P = SAMMELN_SB[nr - 1], f = P.f, R = sammeln_R(nr * 7919), W = 900, H = 1180, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  // Blattform mit leicht ausgefranstem Rand, Schatten darunter
  const edge = []; const M = 28; for (let i = 0; i <= 40; i++) edge.push([M + (W - 2 * M) * i / 40, M + (R() - .5) * 5]); for (let i = 0; i <= 50; i++) edge.push([W - M + (R() - .5) * 5, M + (H - 2 * M) * i / 50]);
  for (let i = 40; i >= 0; i--) edge.push([M + (W - 2 * M) * i / 40, H - M + (R() - .5) * 6]); for (let i = 50; i >= 0; i--) edge.push([M + (R() - .5) * 4 + (f.holz && i > 3 && i < 47 ? 0 : 0), M + (H - 2 * M) * i / 50]);
  const page = () => { x.beginPath(); edge.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); };
  x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 22; x.shadowOffsetY = 8; page(); x.fillStyle = '#e4d5b2'; x.fill(); x.restore();
  x.save(); page(); x.clip();
  let g = x.createRadialGradient(W * .48, H * .44, 80, W / 2, H / 2, W * .8); g.addColorStop(0, '#efe3c4'); g.addColorStop(.6, '#e2d1aa'); g.addColorStop(1, '#bda476'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 5200; i++) { x.fillStyle = `rgba(${R() < .5 ? '90,65,30' : '255,250,235'},${R() * .06})`; x.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2); }
  x.lineWidth = .8; for (let i = 0; i < 260; i++) { const px = R() * W, py = R() * H, l = 6 + R() * 22, a = R() * 6; x.strokeStyle = `rgba(110,85,50,${.05 + R() * .08})`; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * .5 + 3, py + Math.sin(a) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  for (let i = 0; i < 26; i++) { const px = R() * W, py = R() * H, r = 2 + R() * 7; const gg = x.createRadialGradient(px, py, 0, px, py, r); gg.addColorStop(0, 'rgba(120,70,25,.35)'); gg.addColorStop(1, 'rgba(120,70,25,0)'); x.fillStyle = gg; x.fillRect(px - r, py - r, 2 * r, 2 * r); }
  // Linierung (rötlich, blass) und Gebet in schöner Hand
  const tx0 = 150, tx1 = 690, ty0 = 170, lh = 46, rows = 17;
  x.strokeStyle = 'rgba(150,60,40,.16)'; x.lineWidth = 1; for (const vx of [tx0 - 8, tx1 + 6]) { x.beginPath(); x.moveTo(vx, 70); x.lineTo(vx, H - 70); x.stroke(); }
  for (let r = 0; r < rows; r++) { x.beginPath(); x.moveTo(tx0 - 8, ty0 + r * lh + 8); x.lineTo(tx1 + 6, ty0 + r * lh + 8); x.stroke(); }
  if (f.mira) { // SB-10: Miras kleine, saubere Hand mit Häkchen (keine Noten)
    x.font = 'italic 600 31px "Cormorant Garamond", Georgia, serif'; x.fillStyle = 'rgba(38,26,40,.9)';
    const L = ['Slâf, kint, in lanternen schîn,', 'der raben wachet, du bist niht ein,', 'ich zel die slege, ich zel die zît,', 'unt swâ du gâst, bin ich niht wît.'];
    L.forEach((l, i) => { const yy = ty0 + 60 + i * 110; x.fillText(l, tx0, yy); x.strokeStyle = 'rgba(38,26,40,.75)'; x.lineWidth = 2; let px = tx0 + 6;
      for (const w of l.split(' ')) { const ww = x.measureText(w + ' ').width; x.beginPath(); const hx = px + ww * .3, hy = yy - 34 - R() * 10; x.moveTo(hx - 6, hy + 4); x.lineTo(hx, hy); x.lineTo(hx + 7, hy - 6); x.stroke(); px += ww; } });
  } else {
    let wi = Math.floor(R() * 40); x.fillStyle = 'rgba(46,26,12,.86)';
    // Initiale: rote Lombarde mit blauem Fleuronné
    x.save(); x.font = '600 118px "Cormorant Garamond", Georgia, serif'; x.fillStyle = '#9b2a1c'; x.fillText('D', tx0 - 2, ty0 + 2 * lh + 4); x.strokeStyle = 'rgba(40,60,130,.7)'; x.lineWidth = 1.4;
    for (let k = 0; k < 9; k++) { x.beginPath(); const yy = ty0 - 50 + k * 22; x.moveTo(tx0 - 30, yy); x.bezierCurveTo(tx0 - 60, yy + 8, tx0 - 40, yy + 20, tx0 - 64, yy + 30); x.stroke(); } x.restore();
    for (let r = 0; r < rows; r++) { let px = r < 2 ? tx0 + 92 : tx0; const yy = ty0 + r * lh;
      while (true) { const w = SAMMELN_LATEIN[wi++ % SAMMELN_LATEIN.length]; x.font = `italic 600 ${29 + R() * 2}px "Cormorant Garamond", Georgia, serif`; const ww = x.measureText(w + ' ').width; if (px + ww > tx1) break;
        x.globalAlpha = .55 + R() * .45; if (r % 6 === 5 && px === tx0) { x.fillStyle = 'rgba(150,40,26,.9)'; x.fillText(w, px, yy); x.fillStyle = 'rgba(46,26,12,.86)'; } else x.fillText(w, px, yy); px += ww; } }
    x.globalAlpha = 1;
  }
  // Wasserflecken
  for (let i = 0; i < 2 + (nr % 3); i++) sammeln_fleck(x, R, 120 + R() * (W - 240), 150 + R() * (H - 300), 60 + R() * 150, .12 + R() * .12);
  // Justins Klötze am Rand (übertragen heißt: im Bild unleserlich wie ein alter Dialekt)
  const kl = 'ALSO SPRACH ICH IN DER NACHT UND GIENG HINEIN UND RIEF SI HAT NIT KOMEN ICH GE MORGEN WIDER SIEBZEHN WINTER AM RANT ICH SUCH SI IMMER NOCH'.split(' ');
  let s = ''; for (let i = 0; i < 16; i++) s += kl[Math.floor(R() * kl.length)] + ' ';
  const ko = { doppelt: f.doppelt, zitter: f.zitter, col: f.klein ? 'rgba(30,20,12,.86)' : 'rgba(26,18,10,.92)' };
  x.save(); x.translate(tx1 + 40, 120); x.rotate(.02); sammeln_kloetze(x, R, s.slice(0, 110), 0, 0, 150, f.klein ? 22 : 30, ko); x.restore();
  sammeln_kloetze(x, R, s.slice(40, 150), 80, H - 170, W - 200, f.klein ? 22 : 30, ko);
  if (f.zitter) { x.save(); x.translate(tx0, 105); x.rotate(-.03); sammeln_kloetze(x, R, 'BRESCIA', 0, 0, 400, 44, { zitter: 1 }); x.restore(); }
  if (f.mira) sammeln_kloetze(x, R, 'IR HANT NIT MIN WISE HAT SI BRACHT', tx0, H - 130, W - 260, 26, {});
  // Besonderheiten je Seite
  if (f.brand) { const cx = W - 20, cy = 20; g = x.createRadialGradient(cx, cy, 20, cx, cy, 260); g.addColorStop(0, 'rgba(20,10,4,1)'); g.addColorStop(.35, 'rgba(60,30,10,.9)'); g.addColorStop(.6, 'rgba(120,70,30,.45)'); g.addColorStop(1, 'rgba(120,70,30,0)'); x.fillStyle = g; x.fillRect(W - 300, 0, 300, 300);
    sammeln_fleck(x, R, 420, 120, 70, .35); x.fillStyle = 'rgba(80,45,15,.18)'; x.beginPath(); x.ellipse(420, 118, 60, 38, .2, 0, 7); x.fill(); }
  if (f.tinte) { for (let k = 0; k < 3; k++) { const px = 90 + R() * 700, py = 250 + R() * 700; x.save(); x.translate(px, py); x.rotate(R() * 6); x.strokeStyle = 'rgba(20,20,40,.32)'; x.lineWidth = 1.6; for (let r = 3; r < 26; r += 3.2) { x.beginPath(); x.ellipse(0, 0, r, r * 1.3, 0, .3, 5.9); x.stroke(); } x.restore(); }
    x.save(); x.translate(W - 250, H - 260); x.rotate(-.12); x.font = 'italic 34px "Cormorant Garamond", Georgia, serif'; x.fillStyle = 'rgba(25,22,40,.85)'; x.fillText('etwa vierzig', 0, 0); x.restore(); }
  if (f.falz) { for (const [a, b, c2, d] of [[0, H * .5, W, H * .5 + 6], [W * .5, 0, W * .5 - 4, H]]) { const gl = x.createLinearGradient(a, b, a + (c2 - a === 0 ? 8 : 0), b + (d - b === 0 ? 8 : 0)); x.strokeStyle = 'rgba(90,70,40,.22)'; x.lineWidth = 3; x.beginPath(); x.moveTo(a, b); x.lineTo(c2, d); x.stroke(); x.strokeStyle = 'rgba(255,250,230,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(a + 3, b + 3); x.lineTo(c2 + 3, d + 3); x.stroke(); } }
  if (f.blume) { x.save(); x.translate(560, 640); x.rotate(.4); x.strokeStyle = 'rgba(120,120,40,.55)'; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 20); x.bezierCurveTo(10, 120, -10, 220, 14, 330); x.stroke();
    for (let k = 0; k < 5; k++) { x.save(); x.rotate(k / 5 * 6.283 + .3); g = x.createRadialGradient(0, -34, 2, 0, -34, 40); g.addColorStop(0, 'rgba(235,200,60,.55)'); g.addColorStop(1, 'rgba(225,185,40,.12)'); x.fillStyle = g; x.beginPath(); x.ellipse(0, -34, 22, 36, 0, 0, 7); x.fill(); x.strokeStyle = 'rgba(160,120,20,.35)'; x.lineWidth = 1; x.stroke(); x.restore(); }
    x.fillStyle = 'rgba(190,140,30,.6)'; x.beginPath(); x.arc(0, 0, 11, 0, 7); x.fill(); x.restore();
    x.save(); x.translate(470, 1010); x.rotate(-.05); x.font = '48px Caveat, cursive'; x.fillStyle = 'rgba(30,50,140,.85)'; x.fillText('MARION', 0, 0); x.restore(); }
  if (f.schuh) { x.save(); x.translate(380, 520); x.rotate(-.5); x.fillStyle = 'rgba(60,45,30,.22)'; x.beginPath(); x.ellipse(0, -70, 58, 90, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(0, 90, 44, 58, 0, 0, 7); x.fill();
    x.strokeStyle = 'rgba(40,30,20,.3)'; x.lineWidth = 3; for (let k = -150; k < 150; k += 16) { x.beginPath(); x.moveTo(-50, k); x.lineTo(50, k + 6); x.stroke(); } x.restore(); }
  if (f.huelle) { x.save(); x.fillStyle = 'rgba(40,40,40,.62)'; x.font = 'italic 700 58px Georgia, serif'; x.fillText('W.', tx1 + 70, 620); x.restore(); }
  if (f.nagel) { x.save(); g = x.createRadialGradient(W / 2, 70, 3, W / 2, 70, 40); g.addColorStop(0, 'rgba(20,12,6,1)'); g.addColorStop(.25, 'rgba(90,45,15,.8)'); g.addColorStop(1, 'rgba(140,80,30,0)'); x.fillStyle = g; x.beginPath(); x.arc(W / 2, 70, 40, 0, 7); x.fill();
    x.fillStyle = '#1a120c'; x.beginPath(); x.arc(W / 2, 70, 7, 0, 7); x.fill(); x.restore(); }
  if (f.regen) { for (let k = 0; k < 90; k++) { const px = tx0 + R() * (tx1 - tx0), py = ty0 + R() * 500, l = 60 + R() * 260; g = x.createLinearGradient(0, py, 0, py + l); g.addColorStop(0, 'rgba(46,26,12,.18)'); g.addColorStop(1, 'rgba(46,26,12,0)'); x.fillStyle = g; x.fillRect(px, py, 2 + R() * 4, l); } }
  if (f.knick) { x.save(); x.beginPath(); x.moveTo(W - M, H - 220); x.lineTo(W - 200, H - M); x.lineTo(W - M, H - M); x.closePath(); x.fillStyle = '#1a1510'; x.fill(); x.beginPath(); x.moveTo(W - M, H - 220); x.lineTo(W - 200, H - M); x.lineTo(W - 150, H - 180); x.closePath();
    g = x.createLinearGradient(W - 200, H - 220, W - 120, H - 120); g.addColorStop(0, '#cdb88c'); g.addColorStop(1, '#a8915f'); x.fillStyle = g; x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 12; x.fill(); x.restore(); }
  if (f.holz) { x.save(); x.beginPath(); x.moveTo(0, 0); x.lineTo(62, 0); for (let i = 0; i <= 30; i++) x.lineTo(46 + R() * 22, i / 30 * H); x.lineTo(0, H); x.closePath(); g = x.createLinearGradient(0, 0, 70, 0); g.addColorStop(0, '#3a2414'); g.addColorStop(1, '#6d4526'); x.fillStyle = g; x.fill();
    x.clip(); x.strokeStyle = 'rgba(20,10,5,.45)'; x.lineWidth = 1.4; for (let k = 0; k < 16; k++) { x.beginPath(); const px = 4 + k * 4; x.moveTo(px, 0); for (let y = 0; y < H; y += 40) x.lineTo(px + Math.sin(y * .01 + k) * 3, y); x.stroke(); } x.restore(); }
  // Randschatten (Vergilbung)
  g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(90,60,20,.18)'); g.addColorStop(.08, 'rgba(90,60,20,0)'); g.addColorStop(.92, 'rgba(90,60,20,0)'); g.addColorStop(1, 'rgba(90,60,20,.22)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.restore();
  if (f.brand) { x.save(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(W - 150, 0); for (let i = 0; i <= 14; i++) { const t = i / 14; x.lineTo(W - 150 + t * 150 + (R() - .5) * 18, t * 150 + (R() - .5) * 18); } x.lineTo(W, 0); x.closePath(); x.fill(); x.restore(); }
  if (f.huelle) { x.save(); g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(.35, 'rgba(255,255,255,.22)'); g.addColorStop(.42, 'rgba(255,255,255,.04)'); g.addColorStop(1, 'rgba(255,255,255,.1)'); x.fillStyle = g; x.fillRect(8, 8, W - 16, H - 16);
    x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 3; x.strokeRect(10, 10, W - 20, H - 20); x.fillStyle = '#f2efe6'; x.fillRect(W - 330, H - 120, 270, 64); x.strokeStyle = 'rgba(0,0,0,.3)'; x.lineWidth = 1; x.strokeRect(W - 330, H - 120, 270, 64);
    x.fillStyle = '#222'; x.font = '26px "Special Elite", monospace'; x.fillText('ASSERVAT 7/58', W - 314, H - 78); x.restore(); }
  return (sammeln_S.img[nr] = c.toDataURL('image/jpeg', .86).replace('image/jpeg', 'image/jpeg'));
}
// ---------------------------------------------------------------------  Notizfenster
function sammeln_sbText(nr) {
  const P = SAMMELN_SB[nr - 1]; let L = P.txt.slice();
  if (nr === 12) { const a = (typeof ch3 !== 'undefined' && ch3.answer) || 'A'; L = L.map(l => l === '@4' ? P.var[a] || P.var.A : l); }
  if (nr === 7 && sammeln_hat('sb07_strike')) L = L.map(l => l.replace('Sie hat losgelassen.', '<s class="samBlei">Sie hat losgelassen.</s>'));
  return L;
}
function sammeln_sbHtml(nr) {
  const P = SAMMELN_SB[nr - 1], L = sammeln_sbText(nr);
  return `<img data-sbimg="${nr}" alt="" class="samSB">\n<i class="samDesc">${P.desc}</i>\n<div class="samUeber">${L.map(l => '<p>' + l + '</p>').join('')}</div>` +
    (nr === 7 && sammeln_hat('sb07_strike') ? '\n<span class="hand">Ich hab’s durchgestrichen. Ich weiß nicht, wann.</span>' : '');
}
const sammeln_sbTitel = () => kapAb(4) || sammeln_hatSB(7) ? 'Stundenbuch · lose Seite' : 'Eine lose Seite';
function sammeln_sb(nr, still) {
  const P = SAMMELN_SB[nr - 1]; if (!P) return; const neu = !sammeln_S.sb.has(nr), erst = !sammeln_S.sb.size;
  if (neu) { sammeln_S.sb.add(nr); sammeln_S.neu.add('SB-' + nr); Audio.paper(); if (!still) questPop(kapAb(4) ? `STUNDENBUCH ${sammeln_S.sb.size} / 12` : `LOSE SEITE ${sammeln_S.sb.size}`, P.ort);
    if (!story.lore.some(l => l.key === 'sb_' + nr)) story.lore.push({ key: 'sb_' + nr, title: 'Lose Seite · ' + P.ort, html: `<img data-sbimg="${nr}" alt="" class="samSB">` });
    if (erst && typeof gedanke === 'function') gedanke('sam_lose', 'Gebetbuchseiten. Handschrift. Wer schreibt so was und lässt es liegen?', 1800, 2);
    if (nr === 10 && typeof gedanke === 'function') gedanke('sam_sb10', 'Das ist Lucys Spieluhr.', 2600, 3);
    const o = sammeln_S.orte['SB-' + sammeln_pad(nr)]; if (o) sammeln_weg(o);
    if (typeof saveGame === 'function' && state.started) saveGame(curChapter()); }
  if (!still) openNote(sammeln_sbTitel(), sammeln_sbHtml(nr));
}
function sammeln_zHtml(nr) {
  const Z = SAMMELN_Z[nr - 1], R = sammeln_R(nr * 104729); let clip = ''; for (let i = 0; i <= 10; i++) clip += `${i * 10}% ${(R() * 1.6).toFixed(2)}%,`; for (let i = 0; i <= 10; i++) clip += `${(98.4 + R() * 1.6).toFixed(2)}% ${i * 10}%,`;
  for (let i = 10; i >= 0; i--) clip += `${i * 10}% ${(98.2 + R() * 1.8).toFixed(2)}%,`; for (let i = 10; i >= 0; i--) clip += `${(R() * 1.4).toFixed(2)}% ${i * 10}%${i ? ',' : ''}`;
  const rot = ((R() - .5) * 2.2).toFixed(2), foto = Z.foto ? (Z.foto === '-' ? '<div class="lbFoto lbLeer"></div>' : `<div class="lbFoto"><img src="assets/fotos/${Z.foto}.jpg" alt="" style="width:100%;margin:0;padding:0;background:none;box-shadow:none!important;transform:none;filter:grayscale(1) contrast(1.5) brightness(1.05) sepia(.25)"></div>`) + `<div class="lbFotoText">${Z.fotoText}</div>` : '';
  let body = Z.welt ? Z.welt.map(([o, t]) => `<p><b>${o}.</b> ${t}</p>`).join('') : `<p>${Z.text.replace('Gasleck', Z.radiert ? '<span class="lbRad" data-r="' + Z.radiert + '">Gasleck</span>' : 'Gasleck')}${Z.hw ? ' <span class="lbHw">(hw)</span>' : ''}</p>`;
  if (Z.welt) body = body.replace(/<p>/g, '<p class="lbKreis">');
  return `<div class="lbClip${Z.laminiert ? ' lbLam' : ''}" style="clip-path:polygon(${clip});transform:rotate(${rot}deg)"><div class="lbKopf">DER LATERNENBOTE</div><div class="lbUnter">Heimatzeitung für Lost Eyengless und das Abgrundtal · seit 1890</div>` +
    `<div class="lbDatum">${Z.datum === 'Aus aller Welt' ? 'Vermischtes' : Z.datum}</div><h3>${Z.titel}</h3>${foto}<div class="lbText">${body}</div>` +
    (Z.daneben ? `<div class="lbAnz">${Z.daneben}</div>` : '') + (Z.fuss ? `<div class="lbFuss">${Z.fuss}</div>` : '') + (Z.kuli ? `<div class="lbKuli">${Z.kuli}</div>` : '') + '</div>' +
    (Z.notiz ? `\n<i class="samDesc">${Z.notiz}</i>` : '');
}
function sammeln_z(nr, still) {
  const Z = SAMMELN_Z[nr - 1]; if (!Z) return; const neu = !sammeln_S.z.has(nr);
  if (neu) { sammeln_S.z.add(nr); sammeln_S.neu.add('Z-' + nr); Audio.paper(); if (!still) questPop(`DER LATERNENBOTE ${sammeln_S.z.size} / 11`, Z.titel);
    if (!story.lore.some(l => l.key === 'z_' + nr)) story.lore.push({ key: 'z_' + nr, title: 'Der Laternenbote · ' + Z.titel, html: `<div data-zclip="${nr}"></div>` });
    const o = sammeln_S.orte['Z-' + sammeln_pad(nr)]; if (o) sammeln_weg(o);
    if (typeof saveGame === 'function' && state.started) saveGame(curChapter()); }
  if (!still) openNote('Der Laternenbote', sammeln_zHtml(nr));
}
// openNote: Platzhalter (Seitenbild, Zeitungsausschnitt) beim Anzeigen einsetzen – der Spielstand bleibt klein; Z-08 der Basis (Wohnzimmer Nr. 7) zählt mit
openNote = (o => (title, html, loreKey, onClose) => {
  if (loreKey === 'paper' && typeof html === 'string' && /Dritte Vermisste/.test(html)) { sammeln_z(8, true); title = 'Der Laternenbote'; html = sammeln_zHtml(8); }
  if (typeof html === 'string') { html = html.replace(/<img data-sbimg="(\d+)" alt="" class="samSB">/g, (m, n) => `<img src="${sammeln_sbBild(+n)}" alt="" class="samSB" style="width:100%;padding:0;margin:4px 0 18px;background:none;box-shadow:none!important;transform:rotate(.5deg)">`);
    html = html.replace(/<div data-zclip="(\d+)"><\/div>/g, (m, n) => sammeln_zHtml(+n)); }
  return o(title, html, loreKey, onClose);
})(openNote);
// ---------------------------------------------------------------------  Fundstücke in der Welt
function sammeln_tex(art) { // kleine Papiertextur für das Objekt in der Welt
  return tex(cnv(256, (x, w) => { const R = sammeln_R(art === 'z' ? 3 : 5);
    if (art === 'z') { x.fillStyle = '#cfc8b4'; x.fillRect(0, 0, w, w); x.fillStyle = '#1c1c1c'; x.font = 'bold 26px Georgia'; x.fillText('DER LATERNENBOTE', 12, 36); x.fillRect(10, 44, w - 20, 2);
      for (let r = 0; r < 18; r++) for (let col = 0; col < 3; col++) { x.fillStyle = `rgba(30,30,30,${.3 + R() * .3})`; x.fillRect(12 + col * 80, 62 + r * 10, 60 + R() * 12, 4); }
      x.fillStyle = 'rgba(80,80,80,.6)'; x.fillRect(96, 62, 70, 60); }
    else { const g = x.createLinearGradient(0, 0, w, w); g.addColorStop(0, '#e8d9b5'); g.addColorStop(1, '#c9b183'); x.fillStyle = g; x.fillRect(0, 0, w, w);
      for (let r = 0; r < 14; r++) for (let k = 0; k < 7; k++) { x.fillStyle = `rgba(50,30,15,${.25 + R() * .3})`; x.fillRect(40 + k * 26 + R() * 6, 34 + r * 14, 14 + R() * 10, 3); }
      x.fillStyle = 'rgba(150,40,26,.8)'; x.fillRect(40, 30, 18, 22); for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(20,14,8,.8)'; x.fillRect(206 + R() * 10, 40 + k * 30, 16, 20); }
      x.strokeStyle = 'rgba(110,72,30,.35)'; x.lineWidth = 3; x.beginPath(); x.ellipse(90, 170, 50, 40, .3, 0, 7); x.stroke(); }
  }), true);
}
const sammeln_mat = {};
function sammeln_wand(p) { // nächste Wand um (x, y, z) suchen und das Blatt bündig daran setzen
  if (typeof SOL === 'undefined' || !SOL.items.length) return null; const T = THREE, rc = new T.Raycaster(), o = new T.Vector3(p.x, p.y, p.z), d = new T.Vector3(); let best = null;
  const near = (typeof solidNear === 'function' ? solidNear(p.x, p.z) : []).filter(it => !it.inst && it.o.isMesh && (typeof solidLive !== 'function' || solidLive(it))).map(it => it.o);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; d.set(Math.sin(a), 0, Math.cos(a)); rc.set(o, d); rc.far = 1.6; const h = rc.intersectObjects(near, false)[0];
    if (h && (!best || h.distance < best.distance)) best = h; }
  if (!best || !best.face) return null; const n = best.face.normal.clone().transformDirection(best.object.matrixWorld); n.y = 0; if (n.lengthSq() < .01) return null; n.normalize();
  return { x: best.point.x + n.x * .012, z: best.point.z + n.z * .012, ry: Math.atan2(n.x, n.z) };
}
function sammeln_platz(id, o) {
  const alt = sammeln_S.orte[id]; if (alt) { sammeln_weg(alt, true); delete sammeln_S.orte[id]; }
  const art = id[0] === 'Z' ? 'z' : 'sb', nr = +id.split('-')[1], T = THREE; if (!sammeln_mat[art]) sammeln_mat[art] = new T.MeshStandardMaterial({ map: sammeln_tex(art), roughness: .9, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  const O = { id, art, nr, o, ab: o.ab || 1 }; sammeln_S.orte[id] = O;
  const w = art === 'z' ? .28 : .15, h = art === 'z' ? .36 : .2, m = new T.Mesh(new T.PlaneGeometry(w, h), sammeln_mat[art]); m.userData.noCol = true; m.castShadow = false; m.receiveShadow = true;
  const setPos = () => { if (o.wand) { const s = sammeln_wand(o); if (s) { m.position.set(s.x, o.y, s.z); m.rotation.set(0, s.ry, (Math.random() - .5) * .12); return; } }
    if (o.ry !== undefined && o.stehend) { m.position.set(o.x, o.y, o.z); m.rotation.set(0, o.ry, (Math.random() - .5) * .1); return; }
    const gy = typeof solidGround === 'function' && typeof SOL !== 'undefined' && SOL.items.length ? solidGround(o.x, o.y ?? .5, o.z) : -Infinity; m.position.set(o.x, (gy > -1 ? gy : (o.y ?? 0)) + .014, o.z); m.rotation.set(-Math.PI / 2, 0, o.ry ?? Math.random() * 6); };
  O.setPos = setPos; setPos(); if (!o.unsichtbar) scene.add(m); O.m = m;
  const hy = o.wand || o.stehend ? o.y : (o.y ?? .15); O.hit = box(o.hb || .45, .4, o.hb || .45, o.x, hy, o.z, hidden, { cast: false });
  interact(O.hit, () => o.label || (art === 'z' ? 'Eine Zeitung' : 'Ein loses Blatt'), () => { if (art === 'z') sammeln_z(nr); else sammeln_sb(nr); });
  if (typeof hintAdd === 'function') hintAdd({ id: 'sam_' + id, x: o.x, y: 0, z: o.z, kind: 'geheim', near: 20, open: () => O.on && !(art === 'z' ? sammeln_hatZ(nr) : sammeln_hatSB(nr)) });
  sammeln_sperre(); return O;
}
function sammeln_weg(O, ganz) { if (O.m) O.m.visible = false; uninteract(O.hit); O.on = false; if (ganz && O.m) scene.remove(O.m); }
function sammeln_sperre() { for (const O of Object.values(sammeln_S.orte)) { const hat = O.art === 'z' ? sammeln_hatZ(O.nr) : sammeln_hatSB(O.nr), on = kapAb(O.ab) && !hat;
  O.on = on; if (O.m) O.m.visible = on && !O.o.unsichtbar; const i = interactables.indexOf(O.hit); if (on && i < 0) interactables.push(O.hit); else if (!on && i >= 0) interactables.splice(i, 1); } }
// Fundorte Kap. 1–3, soweit sie schon gebaut sind (Kern §15.1, Kap. 1 Nebenaufgaben 8, 11, 13, 15, 18, 19); die übrigen legen die Kapitel-APs mit sammeln_platz
function sammeln_orte() {
  const barn = typeof OW !== 'undefined' && OW.dbg && OW.dbg.barnRect; // Scheune am Hof: bis AP-15 Justins Lager baut, unter dem Heuboden
  if (barn) sammeln_platz('SB-01', { x: barn.x0 + .35, y: .3, z: (barn.z0 + barn.z1) / 2 + .4, label: 'Ein Blatt im Heu' });
  sammeln_platz('SB-02', { x: -10.05, y: .12, z: 53.45, ry: 1.1, label: 'Loser Sockelstein · ein Blatt' });           // Sühnekreuz, Sockel
  sammeln_platz('SB-03', { x: 12.35, y: .95, z: 52.2, wand: 1, label: 'In der Ritze hinter den Plakaten' });          // Bushaltestelle Kirchberg, Rückwand
  sammeln_platz('Z-02', { x: 115.1, y: 2.05, z: 24.6, wand: 1, label: 'Gerahmter Zeitungsausschnitt' });              // Tankstelle, über dem Nachtschalter
  sammeln_platz('Z-03', { x: 28.3, y: 1.3, z: 99.2, ry: Math.PI, stehend: 1, label: 'Laminierter Zeitungsausschnitt' }); // Nordzaun, am Absperrgitter
  sammeln_platz('Z-04', { x: -1.05, y: .9, z: -42, unsichtbar: 1, hb: .35, label: 'Handschuhfach' });                 // Südsperre, überwachsenes Wrack
  if (typeof Z7 !== 'undefined') sammeln_platz('Z-06', { x: Z7.x0 + .4, y: 1.45, z: (Z7.z0 + Z7.z1) / 2, wand: 1, ab: 2, label: 'Zeitungsausschnitt an der Wand' }); // Zimmer 7
}
// ---------------------------------------------------------------------  J-05: der Schatz am Sühnekreuz (85, Umsetzungsnotizen)
function sammeln_schatz() {
  const x0 = -12.9, z0 = 53.9, T = THREE; const t = tex(cnv(128, (x, w) => { x.clearRect(0, 0, w, w); const R = sammeln_R(55); for (let i = 0; i < 90; i++) { const r = 3 + R() * 9, a = R() * 6.28, d = R() * 44; x.fillStyle = `rgba(${40 + R() * 30},${28 + R() * 20},${16 + R() * 10},${.35 + R() * .4})`; x.beginPath(); x.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, r, 0, 7); x.fill(); } }), true);
  const d = new T.Mesh(new T.PlaneGeometry(.9, .9), new T.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -3 })); d.rotation.x = -Math.PI / 2; d.position.set(x0, .03, z0); d.userData.noCol = true; d.visible = false; scene.add(d);
  const hit = box(.8, .3, .8, x0, .15, z0, hidden, { cast: false }); sammeln_S.schatz = { d, hit };
  interact(hit, () => sammeln_hat('J05_fund') ? 'Aufgewühlte Erde' : 'Drei Schritte vom schiefen Kreuz', () => { if (sammeln_hat('J05_fund')) return toast('Hier war Jonas’ Schatz. Jetzt ist er in deiner Tasche.');
    sammeln_fibel('J05_fund'); d.visible = true; Audio.play('stones1', { gain: .25, rate: .8 }); Audio.paper();
    const html = 'Drei Schritte vom schiefen Kreuz, eine Handbreit unter dem Gras: eine Blechdose, rostig, mit Isolierband zugeklebt.\n\nDrin: ein Flummi, grün, und ein Milchzahn in einem Stück Küchenpapier. Die zwei Mark fehlen.';
    story.lore.push({ key: 'sam_schatz', title: 'Jonas’ Schatz', html }); openNote('Die Blechdose', html); if (typeof gedanke === 'function') gedanke('sam_schatz', 'Lucy. Du hast deinen Zahn nie wiedergekriegt. Jetzt schon.', 1500, 3);
    if (typeof saveGame === 'function' && state.started) saveGame(curChapter()); });
  sammeln_schatzSperre();
}
function sammeln_schatzSperre() { const s = sammeln_S.schatz; if (!s) return; const on = sammeln_hat('J05_gelesen'), i = interactables.indexOf(s.hit); if (on && i < 0) interactables.push(s.hit); else if (!on && i >= 0) interactables.splice(i, 1); s.d.visible = sammeln_hat('J05_fund'); }
// ---------------------------------------------------------------------  Fibel-Reiter (Register am rechten Buchrand)
function sammeln_reiter(key, label, render, visible, farbe) { const R = sammeln_S.reiter.find(r => r.key === key); const o = { key, label, render, visible: visible || (() => true), farbe };
  if (R) Object.assign(R, o); else sammeln_S.reiter.push(o); if (sammeln_S.ready) sammeln_reiterBau(); } // jTab der Basis entsteht erst nach den Modulen
function sammeln_reiterBau() {
  const book = document.querySelector('#journal .book'); if (!book) return; let bar = document.getElementById('samReiter');
  if (!bar) { bar = document.createElement('div'); bar.id = 'samReiter'; book.appendChild(bar); }
  const vis = sammeln_S.reiter.filter(r => { try { return r.visible(); } catch (e) { return false; } });
  bar.innerHTML = vis.map((r, i) => `<button data-t="${r.key}" class="${jTab === r.key ? 'on' : ''}${sammeln_S.neu.size && r.neu && r.neu() ? ' neu' : ''}" style="--rf:${r.farbe || ['#b99a5a', '#8e9b78', '#7f93a6', '#b08278', '#9a8f86', '#a58e62'][i % 6]};--rr:${((i * 37) % 7 - 3) * .35}deg">${typeof r.label === 'function' ? r.label() : r.label}</button>`).join('');
  bar.querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); jTab = b.dataset.t; Audio.play('keys1', { gain: .12, rate: 1.9, dur: .15 }); Audio.paper(); renderJournal(); });
}
renderJournal = (o => () => {
  sammeln_auto(); const R = sammeln_S.reiter.find(r => r.key === jTab);
  if (R) { $('jTabs').querySelectorAll('button').forEach(b => b.classList.remove('on')); const B = $('jBody'); B.classList.add('samSeite'); B.dataset.reiter = R.key;
    try { R.render(B); } catch (e) { console.error('Fibel-Reiter ' + R.key, e); B.innerHTML = '<h2>' + R.key.toUpperCase() + '</h2>'; } }
  else { const B = $('jBody'); B.classList.remove('samSeite'); delete B.dataset.reiter; o(); }
  sammeln_reiterBau();
})(renderJournal);
// ---- Reiter: LOSE SEITEN / STUNDENBUCH
function sammeln_rSB(B) {
  const buch = kapAb(4) || sammeln_hatSB(7), n = sammeln_S.sb.size;
  B.innerHTML = `<h2>${buch ? 'STUNDENBUCH' : 'LOSE SEITEN'} · ${n}${buch ? ' / 12' : ''}</h2><div class="samKlebe hand">Gebetbuchseiten. Handschrift. Wer schreibt so was und lässt es liegen?</div>` +
    `<div class="samFelder">${SAMMELN_SB.map(P => sammeln_hatSB(P.nr) ? `<div class="samFeld has" data-n="${P.nr}"><img src="${sammeln_sbBild(P.nr)}" alt=""><span class="samJahr">${P.jahr}</span>${sammeln_S.neu.has('SB-' + P.nr) ? '<i class="samNeu">neu</i>' : ''}</div>` : '<div class="samFeld"><span class="samEck"></span></div>').join('')}</div>` +
    (buch ? '' : '<p class="samFuss">Die Ränder sind voll mit großen, eckigen Buchstaben. Jemand hat sehr langsam geschrieben.</p>');
  B.querySelectorAll('.samFeld.has').forEach(el => el.onclick = e => { e.stopPropagation(); const nr = +el.dataset.n; sammeln_S.neu.delete('SB-' + nr); $('journal').classList.remove('show'); ui.overlay = null; sammeln_sb(nr); });
}
// ---- Reiter: LATERNENBOTE
function sammeln_rZ(B) {
  B.innerHTML = `<h2>DER LATERNENBOTE · ${sammeln_S.z.size} / 11</h2><div class="samPinn">${SAMMELN_Z.map((Z, i) => sammeln_hatZ(Z.nr) ? `<div class="samAus has" data-n="${Z.nr}" style="--r:${((i * 53) % 9 - 4) * .6}deg"><b>DER LATERNENBOTE</b><small>${Z.datum === 'Aus aller Welt' ? 'Vermischtes' : Z.datum}</small><span>${Z.titel}</span>${sammeln_S.neu.has('Z-' + Z.nr) ? '<i class="samNeu">neu</i>' : ''}</div>` : `<div class="samAus" style="--r:${((i * 53) % 9 - 4) * .6}deg"></div>`).join('')}</div>` +
    '<p class="samFuss">Alle mit demselben Kürzel gezeichnet. (hw).</p>';
  B.querySelectorAll('.samAus.has').forEach(el => el.onclick = e => { e.stopPropagation(); const nr = +el.dataset.n; sammeln_S.neu.delete('Z-' + nr); $('journal').classList.remove('show'); ui.overlay = null; sammeln_z(nr); });
}
// ---- Reiter: DAMALS (Jonas)
function sammeln_rDamals(B) {
  const farben = ['#b8322a', '#2f5fa8', '#3c8a3a', '#d27a1c', '#7a3f9a', '#b8322a', '#2f5fa8', '#3c8a3a', '#d27a1c'];
  const L = SAMMELN_JONAS.filter(j => j[0] !== 'J-15' || sammeln_hat('J-15'));
  B.innerHTML = `<h2>DAMALS</h2><div class="samHeft">${L.map((j, i) => { const rot = +j[0].slice(2) >= 10; return `<div class="samJ${j[0] === 'J-16' ? ' klein' : ''}" style="--c:${rot ? '#b32018' : farben[i % farben.length]};--r:${((i * 29) % 7 - 3) * .4}deg">${j[2] ? `<small>${j[2]}</small>` : ''}<span class="wachs">${j[1]}</span>${j[0] === 'J-12' ? sammeln_ritterSvg() : ''}</div>`; }).join('')}</div>`;
  if (!sammeln_hat('J05_gelesen')) { sammeln_fibel('J05_gelesen'); sammeln_S.neu.delete('J05_gelesen'); sammeln_schatzSperre(); }
}
function sammeln_ritterSvg() { return '<svg class="samRitter" viewBox="0 0 120 150"><g fill="none" stroke="#6b6b6b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M44 30 q16 -22 32 0 v22 h-32z" fill="rgba(110,110,110,.55)"/><path d="M40 56 q20 -8 40 0 l6 50 h-52z" fill="rgba(110,110,110,.55)"/><path d="M46 106 l-6 34 M74 106 l6 34"/><path d="M86 60 l20 -40 M100 24 l12 6"/><path d="M50 40 h20"/></g></svg>'; }
// ---- Reiter: DAS BIST DU
function sammeln_rDu(B) {
  const blau = kapAb(2), neu = [];
  const jonas = `DAS BIST DU: LUKE. VIZE-CHEF. ALTER 9. <span class="samAugen${blau ? ' frei' : ''}">AUGEN: BLAU (WIE DER HIMMEL WENN ER NICHT GRAU IST).</span> ANGST VOR: SPINNEN (GEHEIM!!). KANN: PFEIFEN OHNE FINGER.`;
  const zeilen = SAMMELN_DU.map(z => { let t = z[0]; const add = [];
    const strike = (flag, was, dazu) => { if (!sammeln_hat(flag)) return; const n = !sammeln_hat('seen:' + flag); if (n) neu.push(flag); if (was) t = t.replace(was, `<s class="${n ? 'kratz' : ''}">${was}</s>`); add.push(`<em class="${n ? 'kratz' : ''}">${dazu}</em>`); };
    if (z[1] === 'D-04') { strike('D-04', 'Luke Brandt.', 'K-3?'); if (sammeln_hat('D-08')) { const n = !sammeln_hat('seen:D-08'); if (n) neu.push('D-08'); add[0] = `<s class="${n ? 'kratz' : ''}">K-3?</s>`; add.push(`<em class="${n ? 'kratz' : ''}">Luke. Er hat gesagt, ich darf.</em>`); } }
    else if (z[1]) { strike(z[1], z[2], z[3]); if (z[1] === 'D-06' && kapAb(5)) add.push('<em>Ihr Ring passt.</em>'); }
    return `<li>${t} ${add.join(' ')}</li>`; });
  B.innerHTML = `<h2>DAS BIST DU</h2><div class="samHeft du"><div class="samJ" style="--c:#2f5fa8;--r:-.6deg"><small>Frühjahr 2009</small><span class="wachs">${jonas}</span></div><ul class="samKuli">${zeilen.join('')}</ul></div>`;
  if (blau && !sammeln_hat('seen:augen')) { sammeln_fibel('seen:augen'); sammeln_S.neu.delete('seen:augen'); if (typeof gedanke === 'function') gedanke('sam_blau', 'Blau. Jonas war farbenblind. Glaub ich.', 900, 3); }
  if (neu.length) { Audio.paper(); setTimeout(() => Audio.play('stones1', { gain: .06, rate: 3.2, dur: .35 }), 250); neu.forEach(f => { sammeln_fibel('seen:' + f); sammeln_S.neu.delete('seen:' + f); sammeln_S.neu.delete(f); }); }
}
// ---- Reiter: SPIELREGELN
function sammeln_rRegeln(B) {
  const lunas = kapAb(3), luke = SAMMELN_LUKE_REGELN.filter(r => sammeln_hat(r[0]) || (r[0] === 'R-K1' && sammeln_hat('R-heim'))).filter(r => r[0] !== 'R-heim')
    .map(r => r[0] === 'R-K1' && sammeln_hat('R-heim') ? [r[0], r[1] + ' (Ich hab’s ausprobiert.)'] : r); // „Fahr heim“ trägt Regel 9 ein (Kap. 1)
  B.innerHTML = `<h2>SPIELREGELN</h2><div class="samHeft"><div class="samJ ueber" style="--c:#b32018;--r:-.8deg"><span class="wachs">${lunas ? '<em class="kuli">LUNAS</em> ' : ''}SPIELREGELN ${lunas ? '<s class="kuliS">(VON WEM WEISS KEINER)</s>' : '(VON WEM WEISS KEINER)'}</span></div>` +
    `<ol class="samRegeln">${SAMMELN_REGELN.map(r => `<li><span class="wachs" style="--c:#b32018">${r}</span></li>`).join('')}</ol>` +
    (luke.length ? `<ul class="samKuli regeln">${luke.map(r => `<li>${r[1]}</li>`).join('')}</ul>` : '') + '</div>';
}
// ---- Kap.-1-Endkarte: „Nebenaufgaben __ / 21 · Polaroids __ / 7 · Zettel mit drei Punkten __ / 2 · Lose Seiten __ / 3“
function sammeln_k1Zeile() {
  const neben = Object.values(story.side).filter(q => q && q.state === 'done').length, pola = story.photos ? story.photos.size : 0;
  let zettel = 0; try { if (typeof beob_S !== 'undefined') { const s = beob_S.zettel || beob_S.notes || beob_S.found; if (s) zettel = [...s].filter(k => /K1/.test(String(k))).length; } } catch (e) {}
  const lose = [1, 2, 3].filter(sammeln_hatSB).length;
  return `Nebenaufgaben ${Math.min(21, neben)} / 21 · Polaroids ${pola} / 7 · Zettel mit drei Punkten ${Math.min(2, zettel)} / 2 · Lose Seiten ${lose} / 3`;
}
// ---------------------------------------------------------------------  Aussehen (Q-3: echte Gegenstände – Papier, Wachsmalkreide, Kuli, Klebeband)
(function sammeln_css() {
  const n = cnv(128, (x, w) => { const id = x.createImageData(w, w); for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() < .78 ? 255 : 0; id.data[i] = id.data[i + 1] = id.data[i + 2] = 0; id.data[i + 3] = v; } x.putImageData(id, 0, 0); }).toDataURL();
  const st = document.createElement('style'); st.id = 'samCss'; st.textContent = `
#samReiter { position: absolute; right: -38px; top: 64px; display: flex; flex-direction: column; gap: 5px; z-index: -1; }
#samReiter button { writing-mode: vertical-rl; border: 0; cursor: pointer; padding: 16px 9px 16px 11px; min-height: 92px; border-radius: 0 7px 7px 0; font: 600 13px "Cormorant Garamond", Georgia, serif; letter-spacing: .28em; color: #2a1d10;
  background: linear-gradient(90deg, rgba(0,0,0,.28), rgba(0,0,0,0) 30%), linear-gradient(180deg, rgba(255,255,255,.18), rgba(0,0,0,.08)), var(--rf); box-shadow: 2px 2px 4px rgba(0,0,0,.45), inset -1px 0 0 rgba(255,255,255,.15);
  transform: rotate(var(--rr)) translateX(-6px); transition: transform .18s, filter .18s; text-shadow: 0 1px 0 rgba(255,255,255,.25); position: relative; }
#samReiter button::after { content: ''; position: absolute; inset: 0; -webkit-mask-image: url(${n}); mask-image: url(${n}); background: rgba(80,50,20,.12); border-radius: inherit; pointer-events: none; }
#samReiter button:hover { transform: rotate(var(--rr)) translateX(0); filter: brightness(1.08); }
#samReiter button.on { transform: rotate(0) translateX(4px); filter: brightness(1.12); box-shadow: 3px 2px 6px rgba(0,0,0,.55); }
#samReiter button.neu::before { content: ''; position: absolute; left: 6px; top: 8px; width: 7px; height: 7px; border-radius: 50%; background: #9b1c12; box-shadow: 0 0 0 2px rgba(255,255,255,.35); }
#jBody.samSeite h2 { position: relative; }
.samKlebe { display: inline-block; margin: 0 0 18px; padding: 6px 16px 4px; background: rgba(250,244,220,.72); box-shadow: 0 1px 2px rgba(0,0,0,.18); transform: rotate(-1.2deg); color: #1e2b5c; font: 26px Caveat, cursive; }
.samFelder { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px 14px; }
.samFeld { position: relative; aspect-ratio: 900/1180; border: 1.5px dashed rgba(60,40,20,.38); border-radius: 2px; background: rgba(90,60,28,.05); }
.samFeld .samEck { position: absolute; left: 6px; top: 6px; width: 16px; height: 16px; border-left: 2px solid rgba(60,40,20,.3); border-top: 2px solid rgba(60,40,20,.3); }
.samFeld.has { border: 0; background: none; cursor: pointer; transition: transform .2s; } .samFeld.has:nth-child(odd) { transform: rotate(-1.6deg); } .samFeld.has:nth-child(even) { transform: rotate(1.3deg); }
.samFeld.has:hover { transform: scale(1.07) rotate(0); z-index: 2; }
.samFeld img { width: 100%; height: 100%; object-fit: cover; display: block; filter: drop-shadow(0 3px 4px rgba(0,0,0,.35)); }
.samFeld.has::before { content: ''; position: absolute; left: 30%; top: -7px; width: 40%; height: 16px; background: rgba(235,228,200,.62); transform: rotate(-3deg); box-shadow: 0 1px 1px rgba(0,0,0,.12); z-index: 1; }
.samJahr { position: absolute; left: 50%; bottom: -24px; transform: translateX(-50%) rotate(-2deg); font: 22px Caveat, cursive; color: #1e2b5c; white-space: nowrap; }
.samNeu { position: absolute; right: -6px; top: -8px; font: 600 11px "Special Elite", monospace; color: #9b1c12; border: 1.5px solid #9b1c12; padding: 0 4px; transform: rotate(12deg); background: rgba(240,230,210,.8); }
.samFuss { margin-top: 38px; font: italic 16px "Cormorant Garamond", Georgia, serif; color: var(--pdim); }
.samPinn { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px 18px; }
.samAus { position: relative; min-height: 118px; border: 1.5px dashed rgba(60,40,20,.3); transform: rotate(var(--r)); }
.samAus.has { border: 0; cursor: pointer; padding: 10px 11px 12px; background: linear-gradient(170deg, #ddd6c2, #cbc2a8); box-shadow: 0 2px 3px rgba(0,0,0,.25), 0 8px 16px rgba(60,40,20,.28); color: #1b1b1b; transition: transform .2s; }
.samAus.has:hover { transform: rotate(0) scale(1.05); z-index: 2; }
.samAus.has::before { content: ''; position: absolute; top: -5px; left: 50%; width: 11px; height: 11px; margin-left: -5px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #9fb4d8, #2a4a8a 60%, #10204a); box-shadow: 0 3px 4px rgba(0,0,0,.45); }
.samAus b { display: block; font: 700 12px Georgia, serif; letter-spacing: .06em; border-bottom: 1.5px solid #222; padding-bottom: 3px; }
.samAus small { display: block; font: italic 11px Georgia, serif; color: #555; margin: 3px 0 5px; }
.samAus span { display: block; font: 700 14px/1.2 Georgia, serif; }
.samHeft { position: relative; padding: 4px 6px 10px 50px; background: repeating-linear-gradient(180deg, transparent 0 33px, rgba(60,90,160,.16) 33px 34px); }
.samHeft::before { content: ''; position: absolute; left: 34px; top: -10px; bottom: 0; width: 2px; background: rgba(180,50,40,.35); }
.samJ { position: relative; margin: 0 0 22px; transform: rotate(var(--r)); } .samJ small { display: block; font: 18px Caveat, cursive; color: #6a5a48; margin-bottom: 2px; }
.wachs { font: 25px/1.34 Caveat, cursive; letter-spacing: .04em; color: var(--c); text-shadow: .6px .4px 0 var(--c), -.4px -.3px 0 var(--c), 0 0 1px rgba(0,0,0,.15); -webkit-mask-image: url(${n}); mask-image: url(${n}); -webkit-mask-size: 90px; mask-size: 90px; }
.samJ.klein .wachs { font-size: 18px; } .samJ.ueber .wachs { font-size: 34px; }
.samJ s { text-decoration-thickness: 3px; }
.samRitter { display: block; width: 90px; margin: 4px 0 0 30px; transform: rotate(-4deg); opacity: .85; }
.samAugen { position: relative; } .samAugen:not(.frei) { color: transparent; text-shadow: none; }
.samAugen:not(.frei)::after { content: ''; position: absolute; left: -14px; right: -18px; top: -16px; bottom: -14px; border-radius: 48% 52% 44% 56%;
  background: radial-gradient(ellipse at 45% 50%, rgba(120,72,30,.78), rgba(105,62,24,.86) 62%, rgba(80,45,15,.95) 70%, rgba(120,72,30,.35) 76%, transparent 80%); -webkit-mask-image: none; }
.samKuli { list-style: none; margin: 14px 0 0; padding: 0; } .samKuli li { font: 25px/1.36 Caveat, cursive !important; color: #1e2b5c !important; padding: 0 !important; margin: 0 0 3px !important; transform: rotate(-.3deg); }
.samKuli li::before { display: none; } .samKuli em { font-style: normal; color: #1a2f7a; margin-left: 6px; }
.samKuli s { text-decoration: none; background: linear-gradient(transparent 52%, #1e2b5c 52%, #1e2b5c 60%, transparent 60%) no-repeat; background-size: 100% 100%; }
.samKuli s.kratz { animation: samKratz .9s ease-out both; } .samKuli em.kratz { animation: samDa 1.2s .7s ease-out both; }
@keyframes samKratz { from { background-size: 0 100%; } to { background-size: 100% 100%; } } @keyframes samDa { from { opacity: 0; } to { opacity: 1; } }
.samKuli.regeln { margin-top: 18px; } .samKuli.regeln li { font-size: 24px !important; }
.samRegeln { margin: 0 0 6px 8px; padding-left: 22px; } .samRegeln li { margin-bottom: 6px !important; padding-left: 4px !important; } .samRegeln li::before { display: none; } .samRegeln li::marker { font: 22px Caveat, cursive; color: #b32018; }
em.kuli { font: 32px Caveat, cursive; color: #1e2b5c; font-style: normal; text-shadow: none; } s.kuliS { text-decoration-color: #1e2b5c; text-decoration-thickness: 2.5px; }
#note .samDesc { display: block; font: italic 16px/1.5 "Cormorant Garamond", Georgia, serif; color: #4a3b28; margin: 0 0 10px; }
#note .samUeber p { margin: 0 0 6px; font: 17px/1.55 "Special Elite", monospace; }
#note .samBlei { text-decoration: line-through; text-decoration-color: rgba(60,60,60,.85); text-decoration-thickness: 2px; }
#note .lbClip { position: relative; margin: 6px 4px 20px; padding: 22px 26px 24px; color: #161616; white-space: normal; line-height: 1.38;
  background: radial-gradient(circle at 20% 30%, rgba(120,100,60,.12), transparent 40%), radial-gradient(circle at 80% 75%, rgba(120,100,60,.14), transparent 45%), linear-gradient(175deg, #e1dac6, #cfc6ad);
  box-shadow: 0 6px 14px rgba(0,0,0,.35); filter: drop-shadow(0 3px 6px rgba(0,0,0,.3)); }
#note .lbClip::after { content: ''; position: absolute; inset: 0; -webkit-mask-image: url(${n}); mask-image: url(${n}); -webkit-mask-size: 60px; background: rgba(60,50,30,.1); pointer-events: none; }
#note .lbLam { box-shadow: 0 0 0 7px rgba(240,245,245,.35), 0 6px 14px rgba(0,0,0,.35); }
#note .lbLam::before { content: ''; position: absolute; inset: -7px; background: linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,.35) 42%, rgba(255,255,255,0) 50%); pointer-events: none; }
#note .lbKopf { font: 900 30px/1 Georgia, "Times New Roman", serif; letter-spacing: .03em; text-align: center; border-bottom: 3px double #222; padding-bottom: 6px; }
#note .lbUnter { font: italic 11.5px Georgia, serif; text-align: center; margin: 4px 0 2px; color: #333; }
#note .lbDatum { font: 11px Georgia, serif; letter-spacing: .12em; text-align: center; border-bottom: 1px solid #333; padding-bottom: 4px; margin-bottom: 10px; color: #333; }
#note .lbClip h3 { font: 800 21px/1.18 Georgia, serif; margin: 6px 0 10px; }
#note .lbText { font: 14.5px/1.45 Georgia, "Times New Roman", serif; column-count: 2; column-gap: 20px; column-rule: 1px solid rgba(0,0,0,.25); text-align: justify; hyphens: auto; }
#note .lbText p { margin: 0 0 6px; } #note .lbText p.lbKreis b { border: 2px solid rgba(170,25,20,.8); border-radius: 50%; padding: 0 4px; }
#note .lbHw { font-style: italic; }
#note .lbRad { position: relative; } #note .lbRad::after { content: attr(data-r); position: absolute; left: -2px; top: -15px; font: 15px Caveat, cursive; color: rgba(70,70,70,.35); transform: rotate(-4deg); }
#note .lbFoto { position: relative; margin: 0 0 4px; background: #555; min-height: 120px; overflow: hidden; }
#note .lbFoto::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle, rgba(0,0,0,.35) 38%, transparent 42%) 0 0 / 4px 4px; mix-blend-mode: multiply; }
#note .lbLeer { height: 150px; background: radial-gradient(ellipse at 40% 45%, #9a9a9a, #4a4a4a 60%, #2a2a2a); }
#note .lbFotoText { font: italic 11.5px Georgia, serif; margin-bottom: 10px; color: #333; }
#note .lbAnz { margin-top: 12px; border: 1.5px solid #222; padding: 6px 10px; font: 700 12.5px Georgia, serif; text-align: center; }
#note .lbFuss { margin-top: 10px; font: 10.5px Georgia, serif; text-align: right; color: #444; }
#note .lbKuli { margin-top: 8px; font: 27px Caveat, cursive; color: #1e2b5c; transform: rotate(-3deg); }
`; document.head.appendChild(st);
})();
// ---------------------------------------------------------------------  Aufbau, Tick, Spielstand
sammeln_reiter('sb', () => kapAb(4) || sammeln_hatSB(7) ? 'STUNDENBUCH' : 'LOSE SEITEN', sammeln_rSB, () => sammeln_S.sb.size > 0, '#b99a5a');
sammeln_reiter('bote', 'LATERNENBOTE', sammeln_rZ, () => sammeln_S.z.size > 0, '#9a968a');
sammeln_reiter('damals', 'DAMALS', sammeln_rDamals, null, '#c28f5c');
sammeln_reiter('du', 'DAS BIST DU', sammeln_rDu, null, '#7f93a6');
sammeln_reiter('regeln', 'SPIELREGELN', sammeln_rRegeln, null, '#a8625a');
for (const r of sammeln_S.reiter) r.neu = () => [...sammeln_S.neu].some(k => (r.key === 'sb' && /^SB-/.test(k)) || (r.key === 'bote' && /^Z-/.test(k)) || (r.key === 'du' && /^D-/.test(k)) || (r.key === 'regeln' && /^R-/.test(k)) || (r.key === 'damals' && k === 'J-15'));
WORLD_MODS.push(['Sammeln', async () => {
  try { await Promise.race([Promise.all(['italic 600 30px "Cormorant Garamond"', '30px Caveat', '20px "Special Elite"'].map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
  try { sammeln_orte(); } catch (e) { console.warn('Sammeln: Fundorte', e); }
  try { sammeln_schatz(); } catch (e) { console.warn('Sammeln: Schatz', e); }
  // Kap.-1-Endkarte: Zählerzeile anhängen (kino.js, AP-10: „Zählerzeile: AP-11“)
  if (typeof kino_card === 'function') kino_card = (o => lines => o(lines && lines[0] === 'KAPITEL 1 · KELLER BLEIBT ZU' && lines.length === 4 ? [...lines, sammeln_k1Zeile()] : lines))(kino_card);
  sammeln_S.ready = true; // Reiterleiste baut renderJournal (jTab der Basis steht erst nach den Modulen)
}]);
WORLD_TICK.push(() => { const S = sammeln_S; if (!S.ready) return; const k = kap(); if (k !== S.k) { S.k = k; sammeln_sperre(); sammeln_auto(); }
  if (S.placed || typeof SOL === 'undefined' || !SOL.items.length) return; S.placed = true; for (const O of Object.values(S.orte)) try { O.setPos(); } catch (e) {} sammeln_sperre(); });
MOD_SAVE.push(['sammeln', () => ({ sb: [...sammeln_S.sb], z: [...sammeln_S.z], fibel: [...sammeln_S.fibel] }), v => { const S = sammeln_S; S.sb = new Set((v && v.sb) || []); S.z = new Set((v && v.z) || []); S.fibel = new Set((v && v.fibel) || []); S.neu.clear(); sammeln_sperre(); sammeln_schatzSperre(); }]);
window.__sammeln = { S: sammeln_S, sb: sammeln_sb, z: sammeln_z, fibel: sammeln_fibel, platz: sammeln_platz, k1: () => sammeln_k1Zeile(), bild: sammeln_sbBild }; // Testzugriff
