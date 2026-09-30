// =====================================================================  TAUSCH (Modul „tausch“, Fassung 3 AP-08 + Nutzerwunsch Q-9): Glänzendes sammeln, mit Whiskey tauschen
// Fundsachen („Glänzendes“) liegen vor allem abseits des Hauptwegs: ein Lichtfunke im Laub, der im Lampenkegel aufblitzt (TAUSCH_FUNDE, je Kapitel neu).
// Whiskey tauscht wortlos (Gesten, Nachahmungen, Stimmung whiskey_S.mood): handel −1, eitel ±0, beleidigt +1, still = kein Handel. Nie unter der Erde,
// nie in Nimmerheim, nach W-13 (Miras Licht) gar nicht mehr. Das Angebot wächst mit den Kapiteln: erst Batterien, Streichhölzer, Kreide – dann Öllampe,
// Lampenöl, Fernglas, Sturmlaterne, Handwärmer. Jede Ware wirkt im vorhandenen System (Taschenlampe FLASH, Angst fear, Graukind pustet aus, Stille-Zonen).
// Die Kanon-Tauschgeschäfte (W-03 Autoschlüssel ↔ Einkaufswagenchip, Giselas Kuli ↔ Dosendeckel, Messingschlüssel ↔ Batterie/Thermosdeckel …) laufen über
// tausch_kanon() im selben Blatt. Licht: EIN virtuelles Licht (VLight), beim Laden mit Intensität 0 angelegt – zur Laufzeit wird nichts angelegt.
// Ressourcen-Regel (Q-9): Hauptweg knapp und gerade ausreichend, Erkunden immer belohnt (TAUSCH_FUNDE mit main: false tragen die meisten Batterien).
// Schnittstelle: tausch_gib(id, n) · tausch_hat(id) · tausch_nimm(id) · tausch_drop(x, y, z, was, text) · tausch_kanon(def) · tausch_offen() · tausch_moeglich() ·
//   tausch_licht() → { an, x, y, z, r, art } (für Wendigo/Graukind-Module: Lampe zählt als Licht) · Karte (X-2): karte_markierung(x, z, 'kreide', text) per typeof.
const tausch_S = { ready: false, tasche: {}, funde: new Set(), gekauft: {}, log: [], oel: 0, oelN: 0, lampe: '', an: false, streich: 0, kreide: 0, marken: [], warmN: 0, warmT: 0, fernglas: false,
  drops: [], nass: false, // Laufzeit ↓
  L: null, flame: 0, match: 0, gustLast: 0, dec: [], decI: 0, glint: [], dropG: [], chk: 0, zoom: 0, vig: null, tex: null, sel: null, hint: {} };
// ---------------------------------------------------------------- Glänzendes (g = Glanz, so viel ist es dem Raben wert; 0 = nimmt er nie)
const TAUSCH_WAREN = {
  kronkorken: { n: 'Kronkorken', d: 'Plattgefahren. „Abgrundbräu“ – die Brauerei gibt es seit 1990 nicht mehr.', g: 1, i: 'kronkorken' },
  knopf: { n: 'Messingknopf', d: 'Von einer Uniformjacke, ein Anker drauf. Keiner hier war je bei der Marine.', g: 1, i: 'knopf' },
  pfennig: { n: 'Zehn Pfennig, 1971', d: 'Grün angelaufen. Jemand hat ein Loch hineingebohrt, für eine Kette.', g: 1, i: 'muenze' },
  fuenfmark: { n: 'Fünfmarkstück, 1975', d: 'Silber. Auf der Rückseite hat jemand mit einer Nadel „L. V.“ eingeritzt.', g: 3, i: 'muenze' },
  murmel: { n: 'Glasmurmel', d: 'Klar, ein roter Faden in der Mitte. Wie ein Auge, das zu lange ins Licht gesehen hat.', g: 1, i: 'murmel' },
  briefschluessel: { n: 'Kleiner Schlüssel', d: 'Für einen Briefkasten, der nicht mehr hängt. Auf dem Anhänger: „2“.', g: 2, i: 'schluessel' },
  loeffel: { n: 'Silberlöffel', d: 'Monogramm „H. W.“. Er liegt hier draußen, als hätte ihn jemand verloren – oder weggeworfen.', g: 2, i: 'loeffel' },
  ring: { n: 'Kaugummiautomaten-Ring', d: 'Goldfarben, roter Plastikstein. Für ein Kind war das ein Verlobungsring.', g: 1, i: 'ring' },
  scherbe: { n: 'Grüne Glasscherbe', d: 'Vom Wasser rund geschliffen. Hält man sie vor die Lampe, wird alles grün und ruhig.', g: 1, i: 'scherbe' },
  lametta: { n: 'Lametta', d: 'Eine Handvoll, verheddert. Vom Weihnachtsbaum, der noch im Januar vor der Tür lag.', g: 1, i: 'lametta' },
  staniol: { n: 'Staniolkugel', d: 'Silberpapier von Schokolade, Schicht für Schicht zusammengedrückt. Ein Kind hat lange daran gearbeitet.', g: 1, i: 'staniol' },
  abzeichen: { n: 'Blechabzeichen', d: '„Laternenfest 1992“, eine Laterne mit Gesicht. Die Nadel ist abgebrochen.', g: 2, i: 'abzeichen' },
  gloeckchen: { n: 'Katzenglöckchen', d: 'Messing, klein. Es klingelt nicht mehr. Irgendwo läuft eine Katze, die man jetzt nicht mehr hört.', g: 1, i: 'gloeckchen' },
  zinnsoldat: { n: 'Zinnsoldat', d: 'Ein Trommler, die Farbe fast ab. Unten eingeritzt: „J.“', g: 2, i: 'soldat' },
  reflektor: { n: 'Speichenreflektor', d: 'Orange, vom Kinderfahrrad. Er fängt jedes Licht und gibt es zurück.', g: 1, i: 'reflektor' },
  medaillon: { n: 'Medaillon', d: 'Aufklappbar, leer. Innen der Abdruck eines Fotos, das jemand herausgenommen hat.', g: 3, i: 'medaillon' },
  plakette: { n: 'Christophorus-Plakette', d: 'Vom Armaturenbrett. „Gute Fahrt“. Die Rückseite ist verbrannt.', g: 2, i: 'plakette' },
  brillenglas: { n: 'Brillenglas', d: 'Rund, ohne Fassung. Wer das verloren hat, sieht seitdem die Hälfte nicht.', g: 1, i: 'glas' },
  spange: { n: 'Haarspange', d: 'Mit Glitzersteinen, zwei fehlen. Kindergröße.', g: 1, i: 'spange' },
  uhrdeckel: { n: 'Deckel einer Taschenuhr', d: 'Graviert: „Für treue Dienste 1958“. Der Rest der Uhr fehlt.', g: 3, i: 'uhr' },
  nadeln: { n: 'Sicherheitsnadeln', d: 'Drei, aneinandergehängt. Eine Kette für ein Kind, das keine Kette hatte.', g: 1, i: 'nadel' },
  draht: { n: 'Kupferdraht', d: 'Eine kleine Rolle, blank. Frisch abgeschnitten.', g: 1, i: 'draht' },
  kugel: { n: 'Christbaumkugel', d: 'Rot, eine Seite eingedrückt. Darin spiegelt sich die Lampe wie ein kleiner Mond.', g: 2, i: 'kugel' },
  // Kanon-Tauschgut (nie im allgemeinen Tausch verbraucht)
  chip: { n: 'Einkaufswagenchip', d: 'Blau, von deinem alten Schlüsselbund. „Markt am Hohen Abgrund“.', g: 0, i: 'chip', kanon: true },
  kaugummipapier: { n: 'Kaugummipapier', d: 'Silbern, zerknittert. Glänzt ein bisschen. Nicht genug.', g: 0, i: 'papier', kanon: true },
  dosendeckel: { n: 'Dosendeckel', d: 'Deckel einer Katzenfutterdose, silbern und scharfkantig.', g: 0, i: 'deckel', kanon: true },
  thermosdeckel: { n: 'Thermoskannendeckel', d: 'Grau, zerkratzt. Wolters. Whiskey hat ihn dir vor die Füße gelegt.', g: 0, i: 'deckel', kanon: true },
  flaschenkapsel: { n: 'Flaschenkapsel', d: 'Glänzend, mit Prägung. Genau das, was einem Raben gefällt.', g: 0, i: 'kronkorken', kanon: true } };
// ---------------------------------------------------------------- Angebot (p = Preis in Glanz je Kapitel; fehlt das Kapitel, gibt es die Ware dort nicht)
const TAUSCH_ANGEBOTE = [
  { id: 'batterie', n: 'Batterie', i: 'batterie', d: 'Eine Mignonzelle. Er dreht sie im Schnabel, bis das Metall glänzt.', w: '+1 Batterie für die Taschenlampe.', p: { 1: 3, 3: 2, 4: 2, 5: 2, 6: 1 }, gib: () => addBattery(1) },
  { id: 'streich', n: 'Streichhölzer', i: 'streich', d: 'Eine Schachtel „Welthölzer“, halb voll. Die Reibfläche ist noch gut.', w: '10 Hölzer. [L] ohne Lampe: ein Streichholz, kurz Licht. Zündet Öllampe und Laterne.', p: { 1: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, gib: () => { tausch_S.streich += 10; } },
  { id: 'kreide', n: 'Straßenmalkreide', i: 'kreide', d: 'Gelb, ein dicker Stummel. Hält auf Asphalt, Holz und Stein.', w: '12 Zeichen. [K] malt einen Pfeil, wohin du siehst – er steht dann auch auf der Karte.', p: { 1: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, gib: () => { tausch_S.kreide += 12; } },
  { id: 'oellampe', n: 'Öllampe', i: 'oellampe', d: 'Messing, grüner Glaszylinder, ein Docht wie eine Zunge. Riecht nach Petroleum und Keller.', w: '[L] an/aus. Warmes Licht rundum, spart Batterien. ~18 min je Füllung. Eine Böe kann sie ausblasen – und das Graukind.', p: { 3: 5, 4: 5, 5: 5, 6: 4 }, einmal: true, nur: () => !tausch_S.lampe, gib: () => { tausch_S.lampe = 'oel'; tausch_S.oel = 1; } },
  { id: 'lampenoel', n: 'Lampenöl', i: 'oel', d: 'Ein Fläschchen Petroleum mit Korken. Auf dem Etikett eine Hand: „nicht trinken“.', w: 'Füllt Öllampe oder Sturmlaterne ganz auf ([L], wenn sie leer ist).', p: { 3: 2, 4: 2, 5: 2, 6: 1 }, nur: () => !!tausch_S.lampe, gib: () => { tausch_S.oelN++; } },
  { id: 'fernglas', n: 'Fernglas', i: 'fernglas', d: 'Militärgrün, 8 × 30, ein Okular klemmt. Am Riemen ein Namensschild, abgerissen.', w: '[V] halten: heranholen. Glänzendes blitzt damit auch von weit auf.', p: { 4: 4, 5: 4, 6: 3 }, einmal: true, gib: () => { tausch_S.fernglas = true; } },
  { id: 'sturmlaterne', n: 'Sturmlaterne', i: 'laterne', d: 'Feuerwehrrot, Drahtbügel, Glas im Schutzkorb. Brennt im Sturm weiter.', w: '[L] an/aus. Heller und weiter als die Öllampe, ~25 min je Füllung, windfest. Pusten ist kein Wind.', p: { 5: 6, 6: 5 }, einmal: true, gib: () => { tausch_S.lampe = 'sturm'; tausch_S.oel = 1; } },
  { id: 'waermer', n: 'Handwärmer', i: 'waermer', d: 'Ein Kissen mit Metallplättchen. Knicken, und es wird warm wie eine Hand.', w: 'Im Inventar knicken: 5 Minuten warme Hände – die Angst kriecht langsamer an dir hoch.', p: { 5: 2, 6: 1 }, gib: () => { tausch_S.warmN++; } }];
const TAUSCH_LAMPE = { oel: { n: 'Öllampe', r: 8, i: 1.55, c: 0xffae5c, life: 1080, wind: .45 }, sturm: { n: 'Sturmlaterne', r: 11, i: 2.2, c: 0xffbd70, life: 1500, wind: 0 }, holz: { r: 4, i: .85, c: 0xff9e48 } };
// ---------------------------------------------------------------- Fundorte (at = Boden; main = am Hauptweg). Je Kapitel: Hauptweg wenig, Nebenwege viel (Q-9)
const TAUSCH_FUNDE = [
  // Kapitel 1 (Nacht, offene Welt)
  { id: 'k1_strasse', k: [1, 1], at: [-68.4, 3.3], w: ['kronkorken'], main: true, t: 'Ein Kronkorken, plattgefahren. Er glänzt im Regen.' },
  { id: 'k1_hydrant', k: [1, 1], at: [13.2, -5.1], w: ['pfennig'], main: true, t: 'Neben dem Hydranten, zwischen den Kreidestrichen: ein Groschen mit Loch.' },
  { id: 'k1_asche', k: [1, 3], at: [-13.8, -10.8], w: ['knopf'], t: 'Am Rand des Aschekreises, halb im Ruß: ein Messingknopf.' },
  { id: 'k1_rutsche', k: [1, 3], at: [24.9, 75.1], w: ['murmel'], bat: 1, t: 'Im Sand unter der Rutsche: eine Murmel. Und eine Batterie, als hätte sie ein Kind vergraben.' },
  { id: 'k1_friedhof', k: [1, 3], at: [-46.2, 78.4], w: ['kugel'], t: 'Unter der Friedhofsbank: eine Christbaumkugel. Grabschmuck vom letzten Winter.' },
  { id: 'k1_bus', k: [1, 3], at: [11.6, 52.7], w: ['staniol'], t: 'Unter der Bank der Haltestelle: eine Staniolkugel, faustgroß fast.' },
  { id: 'k1_brunnen', k: [1, 3], at: [-107.2, 34.6], w: ['loeffel'], bat: 1, t: 'Am Brunnenrand, in einer Blechdose: ein Silberlöffel und eine Batterie.' },
  { id: 'k1_laube', k: [1, 3], at: [-106.1, 23.8], w: ['lametta'], t: 'An der Laubentür hängt Lametta. Silber, verheddert, nass.' },
  { id: 'k1_tanke', k: [1, 3], at: [119.4, 27.0], w: ['reflektor'], bat: 1, t: 'Hinter dem Container: ein Speichenreflektor. Und in einer Tüte eine Batterie.' },
  { id: 'k1_schrott', k: [1, 3], at: [129.4, -11.2], w: ['plakette'], t: 'Im Fußraum des Schrottautos: eine Christophorus-Plakette.' },
  { id: 'k1_sperre', k: [1, 3], at: [2.6, -43.4], w: ['scherbe'], t: 'An der Südsperre: eine grüne Scherbe, rund wie ein Bonbon.' },
  { id: 'k1_hof', k: [1, 3], at: [-130.9, -19.2], w: ['draht'], bat: 1, t: 'Am Trecker, im Werkzeugfach: Kupferdraht und eine Batterie mit Klebeband.' },
  { id: 'k1_zaun', k: [1, 3], at: [24.8, 96.9], w: ['abzeichen'], t: 'Am Nordzaun, im nassen Gras: ein Blechabzeichen. „Laternenfest 1992“.' },
  { id: 'k1_nr9', k: [1, 3], at: [52.2, -6.3], w: ['briefschluessel'], t: 'Unter dem Briefkasten von Nr. 9: ein kleiner Schlüssel mit Anhänger „2“.' },
  { id: 'k1_kirchweg', k: [1, 3], at: [-9.4, 8.1], w: ['gloeckchen'], t: 'Am Wegweiser zum Kirchberg: ein Katzenglöckchen. Es klingelt nicht mehr.' },
  // Kapitel 3 (03:13)
  { id: 'k3_kreuzung', k: [3, 3], at: [3.4, 2.1], w: ['nadeln'], main: true, t: 'Mitten auf der Kreuzung: drei Sicherheitsnadeln, aneinandergehängt.' },
  { id: 'k3_zelle', k: [3, 4], at: [9.3, 6.6], w: ['brillenglas'], t: 'Vor der Telefonzelle: ein Brillenglas ohne Fassung.' },
  { id: 'k3_kapelle', k: [3, 4], at: [-50.6, 78.9], w: ['medaillon'], t: 'Zwischen zwei Gräbern: ein Medaillon. Leer.' },
  { id: 'k3_karussell', k: [3, 4], at: [35.1, 70.2], w: ['zinnsoldat'], bat: 1, t: 'Unter dem Karussell: ein Zinnsoldat und eine Batterie.' },
  { id: 'k3_schrott', k: [3, 4], at: [136.6, -28.6], w: ['uhrdeckel'], t: 'Am Container im Schrott: der Deckel einer Taschenuhr. „Für treue Dienste 1958“.' },
  { id: 'k3_tanke', k: [3, 4], at: [123.4, 22.4], w: ['kronkorken'], bat: 1, t: 'Zwischen den Reifen: ein Kronkorken und eine Batterie.' },
  { id: 'k3_scheuche', k: [3, 4], at: [-120.4, 23.6], w: ['spange'], t: 'Im Beet unter der Vogelscheuche: eine Haarspange mit Glitzersteinen.' },
  { id: 'k3_heu', k: [3, 4], at: [-124.6, -32.4], w: ['pfennig'], bat: 1, t: 'Im Heu an der Remise: ein Groschen und eine Batterie.' },
  { id: 'k3_nr2', k: [3, 4], at: [-58.0, 9.4], w: ['murmel'], t: 'Unter dem Schaukelgestell von Nr. 2: eine Murmel.' },
  { id: 'k3_nr8', k: [3, 4], at: [45.3, 7.2], w: ['knopf'], t: 'Vor dem Briefkasten von Nr. 8: ein Messingknopf.' },
  // Kapitel 4 (Morgen, Villa)
  { id: 'k4_presse', k: [4, 5], at: [-111.0, 64.4], w: ['loeffel'], t: 'Im Kies neben der Presse: ein Silberlöffel.' },
  { id: 'k4_mauer', k: [4, 4], at: [-104.6, 58.2], w: ['brillenglas'], main: true, t: 'An der Gartenmauer der Villa: ein Brillenglas.' },
  { id: 'k4_kreuz', k: [4, 5], at: [-65.8, 77.2], w: ['abzeichen'], t: 'Am Eisenkreuz: ein Blechabzeichen, verrostet.' },
  { id: 'k4_bus', k: [4, 5], at: [8.9, 53.8], w: ['kugel'], t: 'An der Haltestelle: eine Christbaumkugel im Laub.' },
  { id: 'k4_nr4', k: [4, 5], at: [-29.0, 10.6], w: ['pfennig'], bat: 1, t: 'In der Einfahrt von Nr. 4: ein Groschen. Und eine Batterie im Kies.' },
  { id: 'k4_bulli', k: [4, 5], at: [133.6, -23.4], w: ['draht'], bat: 1, t: 'Am Transporter im Schrott: Kupferdraht und eine Batterie.' },
  { id: 'k4_karre', k: [4, 5], at: [-137.0, -19.6], w: ['fuenfmark'], t: 'In der Schubkarre am Hof: ein Fünfmarkstück. „L. V.“' },
  { id: 'k4_laterne', k: [4, 5], at: [-29.6, 55.6], w: ['staniol'], t: 'Unter der Laterne am Kirchberg: eine Staniolkugel.' },
  // Kapitel 5 (Abend)
  { id: 'k5_nr6', k: [5, 5], at: [21.4, 7.4], w: ['lametta'], t: 'Am Briefkasten von Nr. 6: Lametta.' },
  { id: 'k5_bank', k: [5, 5], at: [33.4, 7.8], w: ['knopf'], main: true, t: 'Unter der Bank: ein Messingknopf.' },
  { id: 'k5_steine', k: [5, 5], at: [-22.8, -24.2], w: ['murmel'], bat: 1, t: 'Bei den sieben Steinen hinter Nr. 3: eine Murmel und eine Batterie.' },
  { id: 'k5_tisch', k: [5, 5], at: [-107.6, 12.5], w: ['loeffel'], t: 'Auf dem Picknicktisch in den Gärten: ein Silberlöffel.' },
  { id: 'k5_parzelle', k: [5, 5], at: [-121.8, 35.0], w: ['medaillon'], bat: 1, t: 'Am Schuppen von Parzelle 7: ein Medaillon und eine Batterie.' },
  { id: 'k5_preis', k: [5, 5], at: [100.2, 8.9], w: ['reflektor'], t: 'Unter dem Preisschild der Tankstelle: ein Speichenreflektor.' },
  { id: 'k5_tor', k: [5, 5], at: [-49.6, 66.3], w: ['kugel'], t: 'Am Friedhofstor: eine Christbaumkugel.' },
  { id: 'k5_sport', k: [5, 5], at: [-2.9, -41.2], w: ['plakette'], bat: 1, t: 'Im überwucherten Sportwagen: eine Plakette und eine Batterie.' },
  // Kapitel 6 (Wald, bis W-13)
  { id: 'k6_gitter', k: [6, 6], at: [31.6, 99.8], w: ['kronkorken'], main: true, t: 'Hinter dem Gitter, im Moos: ein Kronkorken.' },
  { id: 'k6_lichtung', k: [6, 6], at: [5.0, 114.4], w: ['scherbe'], t: 'Auf der Lichtung: eine grüne Scherbe.' },
  { id: 'k6_huette', k: [6, 6], at: [57.4, 147.4], w: ['zinnsoldat'], bat: 1, t: 'Vor Zayns Hütte: ein Zinnsoldat. Und eine Batterie in einer Blechdose.' },
  { id: 'k6_fuchs', k: [6, 6], at: [73.4, 128.2], w: ['spange'], t: 'Am Fuchsbau: eine Haarspange. Kindergröße.' },
  { id: 'k6_ring', k: [6, 6], at: [16.0, 229.0], w: ['medaillon'], t: 'Im Steinkreis: ein Medaillon, leer.' },
  { id: 'k6_steg', k: [6, 6], at: [45.2, 249.0], w: ['uhrdeckel'], bat: 1, t: 'Am Steg, zwischen den Brettern: ein Uhrdeckel und eine Batterie.' },
  { id: 'k6_schaukel', k: [6, 6], at: [82.8, 176.3], w: ['gloeckchen'], t: 'Unter der Schaukel im Wald: ein Katzenglöckchen.' }];
// ---------------------------------------------------------------- Bleistiftskizzen (SVG, Strich wie in der Fibel)
const TAUSCH_ICON = {
  kronkorken: '<circle cx="12" cy="12" r="7"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  knopf: '<circle cx="12" cy="12" r="7.5"/><circle cx="10" cy="10" r=".9"/><circle cx="14" cy="10" r=".9"/><circle cx="10" cy="14" r=".9"/><circle cx="14" cy="14" r=".9"/>',
  muenze: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="6" stroke-dasharray="1.5 1.5"/><path d="M10.5 9.5h3M12 9.5v5"/>',
  murmel: '<circle cx="12" cy="12" r="7"/><path d="M8 11c2-3 6-3 8 1M9 14c2 1 5 1 6-1"/><circle cx="9.5" cy="9" r="1"/>',
  schluessel: '<circle cx="7.5" cy="12" r="3.5"/><path d="M11 12h10M17 12v3M20 12v2"/>',
  loeffel: '<ellipse cx="7" cy="8" rx="3.5" ry="4.6" transform="rotate(-40 7 8)"/><path d="M9.5 10.5 20 21"/>',
  ring: '<circle cx="12" cy="14" r="6"/><path d="M9 7.5 12 4l3 3.5-3 1.6z"/>',
  scherbe: '<path d="M5 15 9 5l9 3 1 8-8 4z"/><path d="M9 9l4 1"/>',
  lametta: '<path d="M4 5c3 2 1 5 4 7s1 5 4 7M9 4c3 2 1 5 4 7s1 5 4 7M14 4c3 2 1 5 4 7"/>',
  staniol: '<path d="M7 9l3-3 5 1 3 4-1 5-4 3-5-1-2-4z"/><path d="M10 9l3 2-2 3M14 8l1 4"/>',
  abzeichen: '<circle cx="12" cy="12" r="8"/><path d="M9 8h6l-1 8h-4z"/><path d="M10.5 11h.5M13 11h.5M10.8 13.6c.8.6 1.6.6 2.4 0"/>',
  gloeckchen: '<path d="M7 16c0-6 2-9 5-9s5 3 5 9z"/><path d="M5.5 16h13M12 7V5"/><circle cx="12" cy="18" r="1.2"/>',
  soldat: '<circle cx="12" cy="5" r="2"/><path d="M10 3.2h4M10 8h4l1 7h-6zM10 15l-1 6M14 15l1 6"/><ellipse cx="17.5" cy="12" rx="2" ry="1.4"/>',
  reflektor: '<path d="M12 4l7 4v8l-7 4-7-4V8z"/><path d="M12 4v16M5 8l14 8M19 8 5 16" stroke-width=".7"/>',
  medaillon: '<ellipse cx="12" cy="14" rx="5.5" ry="6.5"/><path d="M12 7.5V3M9 3.5c1 1.5 5 1.5 6 0"/><path d="M9.5 13c1.5-1.5 3.5-1.5 5 0"/>',
  plakette: '<circle cx="12" cy="12" r="7.5"/><path d="M12 7v4M10 9.5h4M9 16c1-2 5-2 6 0"/>',
  glas: '<circle cx="12" cy="12" r="7"/><path d="M8.5 9.5c1-1.5 2.5-2 4-2"/>',
  spange: '<path d="M4 12c4-4 12-4 16 0M4 12c4 2 12 2 16 0"/><circle cx="9" cy="10.6" r=".9"/><circle cx="12" cy="10.2" r=".9"/><circle cx="15" cy="10.6" r=".9"/>',
  uhr: '<circle cx="12" cy="13" r="7"/><path d="M12 6V3.5M10.5 3.5h3M9 12c1.5-2 4.5-2 6 0M9 15h6"/>',
  nadel: '<path d="M4 16h9l3-3-3-3M4 16c-2 0-2-3 0-3h9"/><path d="M13 16h4l3-3-3-3"/>',
  draht: '<ellipse cx="12" cy="12" rx="7" ry="3.5"/><ellipse cx="12" cy="12" rx="5.5" ry="2.6"/><ellipse cx="12" cy="12" rx="4" ry="1.8"/><path d="M19 12l2 4"/>',
  kugel: '<circle cx="12" cy="14" r="6.5"/><path d="M10.5 7.5h3v-2h-3zM12 5.5V4"/><path d="M8.5 12c1-1.5 2.5-2 3.5-2"/>',
  chip: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="6.5" r="1.3"/><path d="M9 13h6M9 15.5h6"/>',
  papier: '<path d="M6 7l5-2 7 3-1 8-6 3-6-4z"/><path d="M9 9l5 2M8 13l4 1"/>',
  deckel: '<ellipse cx="12" cy="12" rx="8" ry="4"/><ellipse cx="12" cy="11" rx="6" ry="2.6"/><path d="M4 12v2c0 2 16 2 16 0v-2"/>',
  batterie: '<rect x="8" y="5" width="8" height="15" rx="1"/><path d="M10 3h4M10 12h4"/>',
  streich: '<rect x="4" y="9" width="16" height="9" rx="1"/><path d="M4 12h16M8 9l3-5M11 4l1.2-.6"/>',
  kreide: '<path d="M5 17l9-9 4 4-9 9H5z"/><path d="M13 9l3 3M6 20l-2 1"/>',
  oellampe: '<path d="M8 19h8l-1-4H9zM10 15V9h4v6"/><path d="M10 9c0-3 4-3 4 0M12 6c.8-1 .8-2 0-3-.8 1-.8 2 0 3z"/>',
  oel: '<path d="M9 21h6V10l-1-2h-4l-1 2z"/><path d="M10.5 8V5h3v3M10 14h4"/>',
  laterne: '<path d="M8 20h8M8 8h8l-1 12H9zM9 8V6h6v2M10 4c1-2 3-2 4 0"/><path d="M12 12c1 1.4 1 2.8 0 4-1-1.2-1-2.6 0-4z"/>',
  fernglas: '<rect x="3" y="9" width="7" height="10" rx="3"/><rect x="14" y="9" width="7" height="10" rx="3"/><path d="M10 12h4M5 9V6h3v3M16 9V6h3v3"/>',
  waermer: '<rect x="5" y="6" width="14" height="12" rx="4"/><path d="M9 12h6M12 9v6"/>' };
function tausch_svg(i) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${TAUSCH_ICON[i] || TAUSCH_ICON.staniol}</svg>`; }
const tausch_sterne = n => n > 0 ? '✶'.repeat(n) : '–';
// ---------------------------------------------------------------- Tasche (Glänzendes)
// Beutel (Modul „beutel“, eigener Helfer): Kapazitätsprüfung je Art – 'glanz', 'batterie', 'streich', 'kreide', 'oel', 'waermer', 'geraet'. Ohne Modul: immer Platz.
function tausch_platz(art, n = 1) { try { return typeof beutel_platz === 'function' ? beutel_platz(art, n) !== false : true; } catch (e) { return true; } }
const TAUSCH_ART = { batterie: 'batterie', streich: 'streich', kreide: 'kreide', lampenoel: 'oel', waermer: 'waermer', oellampe: 'geraet', sturmlaterne: 'geraet', fernglas: 'geraet' };
function tausch_voll() { toast('Kein Platz mehr im Beutel.', 2600); return false; }
function tausch_gib(id, n = 1, still) { const S = tausch_S, W = TAUSCH_WAREN[id]; if (!W) return; S.tasche[id] = (S.tasche[id] || 0) + n; if (!still) questPop('GLÄNZENDES', W.n); }
function tausch_hat(id) { return (tausch_S.tasche[id] || 0) > 0; }
function tausch_nimm(id, n = 1) { const S = tausch_S; if (!S.tasche[id]) return false; S.tasche[id] -= n; if (S.tasche[id] <= 0) delete S.tasche[id]; return true; }
function tausch_glanz() { let s = 0; for (const [k, v] of Object.entries(tausch_S.tasche)) { const W = TAUSCH_WAREN[k]; if (W && !W.kanon) s += W.g * v; } return s; }
function tausch_klaubar() { const S = tausch_S; let best = null; for (const [k, v] of Object.entries(S.tasche)) { const W = TAUSCH_WAREN[k]; if (v > 0 && W && !W.kanon && (!best || W.g > TAUSCH_WAREN[best].g)) best = k; }
  if (!best) return null; tausch_nimm(best); return { ware: best, name: TAUSCH_WAREN[best].n }; } // K1-6: das Glänzendste zuerst
// ---------------------------------------------------------------- Wann kann man tauschen, was kostet es
function tausch_whiskey() { return typeof whiskey_S !== 'undefined' ? whiskey_S : null; }
function tausch_moeglich() {
  const W = tausch_whiskey(), k = typeof kap === 'function' ? kap() : 1; if (!W || !W.ready || !W.g || !W.g.visible || !W.st) return false;
  if ((W.mode !== 'perch' && W.mode !== 'ride') || W.mood === 'still' || W.light || W.hatSchluessel || W.tired) return false;
  if ((typeof whiskey_unten === 'function' && whiskey_unten()) || ch3.part === 'white' || state.talking) return false;
  return TAUSCH_ANGEBOTE.some(a => a.p[k] !== undefined);
}
function tausch_preis(a) { const W = tausch_whiskey(), k = typeof kap === 'function' ? kap() : 1, p = a.p[k]; if (p === undefined) return null;
  return Math.max(1, p + (W && W.mood === 'beleidigt' ? 1 : 0) - (W && W.mood === 'handel' && p > 1 ? 1 : 0)); }
function tausch_frei(a) { const S = tausch_S; if (a.einmal && S.gekauft[a.id]) return false; if (a.nur && !a.nur()) return false; return true; }
// Günstigste Auswahl aus der Tasche, die den Preis deckt (kleine Werte zuerst, möglichst ohne Überzahlung)
function tausch_wahl(preis) { const L = []; for (const [k, v] of Object.entries(tausch_S.tasche)) { const W = TAUSCH_WAREN[k]; if (W && !W.kanon && W.g > 0) for (let i = 0; i < v; i++) L.push(k); }
  L.sort((a, b) => TAUSCH_WAREN[a].g - TAUSCH_WAREN[b].g); const out = []; let s = 0;
  for (const k of L) { if (s >= preis) break; out.push(k); s += TAUSCH_WAREN[k].g; }
  if (s < preis) return null; // Überzahlung klein halten: teuerstes Teil gegen passenderes tauschen, wenn möglich
  for (let i = 0; i < out.length; i++) { const over = s - preis; if (!over) break; const g = TAUSCH_WAREN[out[i]].g; if (g <= over) { s -= g; out.splice(i, 1); i--; } }
  return out; }
const TAUSCH_STIMMUNG = { eitel: 'Er putzt sich. Erst links, dann rechts. Er hat Zeit. Du nicht.', handel: 'Er legt den Kopf schief und sieht auf deine Jackentasche. Er ist in Handelslaune.',
  beleidigt: 'Er dreht dir halb den Rücken zu. Du hast ihn ignoriert. Das kostet jetzt extra.', still: 'Er rührt sich nicht. Jetzt nicht.' };
// ---------------------------------------------------------------- Tauschblatt (Papier, Handschrift, Bleistift)
function tausch_css() { if (document.getElementById('tauschCss')) return; const s = document.createElement('style'); s.id = 'tauschCss';
  s.textContent = `#puzzle .box.tausch { max-width: min(980px, 94vw); min-width: min(760px, 94vw); padding: 34px 40px 28px; text-align: left; color: var(--pink); transform: rotate(-.35deg);
    background: var(--fibre), var(--blot), radial-gradient(circle at 92% 88%, rgba(110,70,28,.04) 28px, rgba(110,70,28,.15) 31px, rgba(110,70,28,.05) 35px, transparent 39px), radial-gradient(140% 100% at 50% 40%, #e3d8bc 0%, #d6c9a8 55%, #bba983 100%);
    background-size: 240px 240px, 1400px 1400px, auto, auto; box-shadow: 0 2px 3px rgba(0,0,0,.35), 0 30px 80px rgba(0,0,0,.85); border: 0; border-radius: 1px; max-height: 86vh; overflow: auto; }
  #puzzle .box.tausch::before { content: ''; position: absolute; left: 46px; top: 0; bottom: 0; width: 1px; background: rgba(170,40,30,.35); pointer-events: none; }
  .tsch-kopf { display: flex; align-items: baseline; justify-content: space-between; gap: 18px; border-bottom: 1px solid rgba(60,40,20,.35); padding: 0 0 10px 26px; margin-bottom: 14px; }
  .tsch-t { font: 20px "Special Elite", monospace; color: #1d150d; letter-spacing: .04em; }
  .tsch-glanz { font: 15px "Special Elite", monospace; color: var(--pred); white-space: nowrap; }
  .tsch-hand { font: 25px/1.25 Caveat, cursive; color: #1e2b5c; text-shadow: 0 0 1px rgba(30,43,92,.3); }
  .tsch-stimmung { padding: 0 0 12px 26px; transform: rotate(-.6deg); }
  .tsch-cols { display: grid; grid-template-columns: 1fr 1.25fr; gap: 26px; padding-left: 26px; }
  .tsch-cols h3 { font: 600 12px "Cormorant Garamond", Georgia, serif; letter-spacing: .4em; color: var(--pred); margin: 0 0 10px; }
  .tsch-tasche { display: flex; flex-wrap: wrap; gap: 8px; align-content: flex-start; }
  .tsch-w { position: relative; width: 84px; padding: 6px 4px 5px; text-align: center; color: #2a2016; background: linear-gradient(180deg, #f1e9d4, #e2d6b8); box-shadow: 0 1px 2px rgba(0,0,0,.25), 0 4px 8px rgba(60,40,20,.2); border-radius: 2px; cursor: default; }
  .tsch-w:nth-child(odd) { transform: rotate(-1.4deg); } .tsch-w:nth-child(even) { transform: rotate(1.1deg); }
  .tsch-w svg { width: 34px; height: 34px; color: #2b2a33; display: block; margin: 0 auto 2px; }
  .tsch-w b { display: block; font: 17px/1.05 Caveat, cursive; font-weight: 500; } .tsch-w i { position: absolute; right: 5px; top: 3px; font: 12px "Special Elite", monospace; color: var(--pred); font-style: normal; }
  .tsch-w small { display: block; font: 11px "Special Elite", monospace; color: #8a6a2c; letter-spacing: .1em; }
  .tsch-w.k { background: linear-gradient(180deg, #e8e2d2, #d6ccb4); } .tsch-w.k small { color: #6a5a48; }
  .tsch-w.off { opacity: .45; } .tsch-w.bieten { cursor: pointer; } .tsch-w.bieten:hover { box-shadow: 0 0 0 2px rgba(124,36,24,.55), 0 6px 12px rgba(60,40,20,.3); transform: rotate(0) translateY(-2px); }
  .tsch-ang { display: flex; flex-direction: column; gap: 10px; }
  .tsch-a { position: relative; display: grid; grid-template-columns: 44px 1fr auto; gap: 4px 12px; align-items: start; padding: 10px 12px 10px 10px; background: rgba(255,250,235,.28); border: 1px solid rgba(60,40,20,.28); border-radius: 2px; }
  .tsch-a svg { width: 40px; height: 40px; color: #2b2a33; grid-row: span 2; }
  .tsch-a b { font: 19px "Special Elite", monospace; color: #1d150d; font-weight: normal; } .tsch-a p { grid-column: 2; margin: 0; font: italic 15px/1.35 "Cormorant Garamond", Georgia, serif; color: #3a2d20; }
  .tsch-a em { grid-column: 2 / span 2; font: 14px/1.4 "Special Elite", monospace; font-style: normal; color: #4a3a28; } .tsch-a .wahl { grid-column: 2 / span 2; font: 19px Caveat, cursive; color: #1e2b5c; }
  .tsch-a .preis { font: 16px "Special Elite", monospace; color: var(--pred); letter-spacing: .12em; text-align: right; white-space: nowrap; }
  .tsch-a button { grid-column: 3; justify-self: end; background: transparent; color: var(--pred); border: 2px solid rgba(124,36,24,.75); padding: 6px 12px 5px; font: 12px "Special Elite", monospace; letter-spacing: .2em; transform: rotate(-1.5deg); cursor: pointer; }
  .tsch-a button:hover:not(:disabled) { background: rgba(124,36,24,.1); } .tsch-a button:disabled { opacity: .35; cursor: default; }
  .tsch-a.weg { opacity: .5; } .tsch-a.weg::after { content: 'GETAUSCHT'; position: absolute; right: 12px; bottom: 10px; font: 13px "Special Elite", monospace; letter-spacing: .2em; color: rgba(150,30,20,.8); border: 2px solid rgba(150,30,20,.7); padding: 2px 8px; transform: rotate(-8deg); }
  .tsch-fuss { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin: 18px 0 0 26px; padding-top: 10px; border-top: 1px dashed rgba(60,40,20,.35); }
  .tsch-fuss .tsch-hand { font-size: 22px; } .tsch-fuss button { background: transparent; border: 0; color: #5a4a35; font: 13px "Special Elite", monospace; letter-spacing: .25em; cursor: pointer; } .tsch-fuss button:hover { color: var(--pred); }
  .tsch-leer { font: italic 17px "Cormorant Garamond", Georgia, serif; color: #5a4a35; }
  #jBody .tsch { margin-top: 30px; } #jBody .tsch .tsch-tasche { gap: 10px; } #jBody .tsch-log { margin-top: 14px; font: 21px/1.3 Caveat, cursive; color: #1e2b5c; }
  #jBody .tsch-gear { display: flex; flex-wrap: wrap; gap: 12px; } #jBody .tsch-gear .tsch-w { width: 118px; } #jBody .tsch-gear .tsch-w button { margin-top: 4px; background: transparent; border: 1px solid rgba(124,36,24,.6); color: var(--pred); font: 11px "Special Elite", monospace; letter-spacing: .15em; padding: 3px 6px; cursor: pointer; }
  #tauschGlas { position: fixed; inset: 0; pointer-events: none; z-index: 6; opacity: 0; transition: opacity .18s; background: radial-gradient(circle at 36% 50%, transparent 0 23vh, rgba(0,0,0,.92) 24.5vh), radial-gradient(circle at 64% 50%, transparent 0 23vh, rgba(0,0,0,.92) 24.5vh); background-blend-mode: multiply; }
  #tauschGlas.on { opacity: 1; } #tauschGlas::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,.35) 70%); }
  @media (max-width: 820px) { .tsch-cols { grid-template-columns: 1fr; } }`;
  document.head.appendChild(s); }
// openPuzzle ist für alle Rätsel da: vor jedem anderen Rätsel die Tausch-Klasse wieder abnehmen
openPuzzle = (o => function (html, init) { const b = $('puzzle').querySelector('.box'); if (b) b.classList.remove('tausch'); return o.call(this, html, init); })(openPuzzle);
function tausch_taschenHtml(bieten, will) {
  const S = tausch_S, L = Object.entries(S.tasche).filter(([k, v]) => v > 0 && TAUSCH_WAREN[k]);
  if (bieten && will === 'batterie' && FLASH.spare > 0) L.unshift(['__batterie', FLASH.spare]);
  if (bieten && story.items.includes('lesebrille')) L.push(['__lesebrille', 1]);
  if (!L.length) return '<div class="tsch-leer">Leere Taschen. Nur Fussel und ein alter Kassenbon.</div>';
  return L.map(([k, v]) => { if (k === '__batterie') return `<div class="tsch-w bieten" data-k="batterie">${tausch_svg('batterie')}<i>×${v}</i><b>Batterie</b><small>glänzt</small></div>`;
    if (k === '__lesebrille') return `<div class="tsch-w bieten" data-k="lesebrille">${tausch_svg('glas')}<b>Hildes Lesebrille</b><small>Perlenkette</small></div>`;
    const W = TAUSCH_WAREN[k]; return `<div class="tsch-w${W.kanon ? ' k' : ''}${bieten ? ' bieten' : ''}" data-k="${k}" title="${W.d}">${tausch_svg(W.i)}${v > 1 ? `<i>×${v}</i>` : ''}<b>${W.n}</b><small>${W.kanon ? '' : tausch_sterne(W.g)}</small></div>`; }).join(''); }
function tausch_offen() {
  if (!tausch_moeglich()) return; tausch_css(); const S = tausch_S, W = tausch_whiskey(), k = kap();
  const render = box => {
    const glanz = tausch_glanz(), A = TAUSCH_ANGEBOTE.filter(a => a.p[k] !== undefined && (tausch_frei(a) || (a.einmal && S.gekauft[a.id])));
    box.innerHTML = `<div class="tsch-kopf"><span class="tsch-t">Tausch mit einem Raben</span><span class="tsch-glanz">IN DER TASCHE: ${glanz} ✶</span></div>
      <div class="tsch-stimmung tsch-hand">${TAUSCH_STIMMUNG[W.mood] || TAUSCH_STIMMUNG.eitel}</div>
      <div class="tsch-cols"><div><h3>IN DEINEN TASCHEN</h3><div class="tsch-tasche">${tausch_taschenHtml(false)}</div></div>
      <div><h3>ER LEGT HIN</h3><div class="tsch-ang">${A.map(a => { const weg = a.einmal && S.gekauft[a.id], pr = tausch_preis(a), wahl = weg ? null : tausch_wahl(pr);
        return `<div class="tsch-a${weg ? ' weg' : ''}" data-a="${a.id}">${tausch_svg(a.i)}<b>${a.n}</b><span class="preis">${'●'.repeat(pr)}</span><p>${a.d}</p><em>${a.w}</em>
          ${weg ? '' : `<span class="wahl">${wahl ? 'Dafür: ' + wahl.map(x => TAUSCH_WAREN[x].n).join(', ') : glanz ? 'Das reicht ihm nicht.' : ''}</span><button ${wahl ? '' : 'disabled'}>HINLEGEN</button>`}</div>`; }).join('')}</div></div></div>
      <div class="tsch-fuss"><span class="tsch-hand">${tausch_notiz()}</span><button class="zu">ZURÜCK</button></div>`;
    box.querySelectorAll('.tsch-a button').forEach(b => b.onclick = e => { e.stopPropagation(); const a = TAUSCH_ANGEBOTE.find(x => x.id === b.closest('.tsch-a').dataset.a); tausch_kaufe(a); });
    box.querySelector('.zu').onclick = e => { e.stopPropagation(); closeOverlay(); };
    box.querySelectorAll('.tsch-w').forEach(el => el.onmouseenter = () => { const Wd = TAUSCH_WAREN[el.dataset.k]; if (Wd) box.querySelector('.tsch-fuss .tsch-hand').textContent = Wd.d; });
  };
  openPuzzle('', box => { box.classList.add('tausch'); render(box); S.render = render; });
  if (W) { W.ignored = 0; whiskey_blick(player.pos.x, camera.position.y - .4, player.pos.z, 6); }
}
function tausch_notiz() { const n = Object.keys(tausch_S.gekauft).length; return n ? 'Er prüft alles mit dem Schnabel. Und er bereut nie.' : 'Ich tausche mit einem Vogel. Ich schreib das besser nicht in die Fibel. … Doch.'; }
async function tausch_kaufe(a) {
  const S = tausch_S, pr = tausch_preis(a), wahl = tausch_wahl(pr); if (!wahl || !tausch_frei(a)) return; if (!tausch_platz(TAUSCH_ART[a.id] || 'geraet', 1)) { closeOverlay(); return tausch_voll(); }
  for (const w of wahl) tausch_nimm(w); S.gekauft[a.id] = (S.gekauft[a.id] || 0) + 1; S.log.push(`K${kap()} · ${wahl.map(x => TAUSCH_WAREN[x].n).join(', ')} → ${a.n}`); if (S.log.length > 40) S.log.shift();
  closeOverlay(); await tausch_pruefen(); a.gib(); questPop('VON WHISKEY', a.n); Audio.play('keys2', { gain: .2, rate: 1.5, dur: .3 });
  const tipp = { streich: 'Streichhölzer: [L], wenn du keine Lampe hast.', kreide: 'Kreide: [K] malt einen Pfeil.', oellampe: 'Öllampe: [L] an und aus.', sturmlaterne: 'Sturmlaterne: [L] an und aus. Windfest.', fernglas: 'Fernglas: [V] halten.', waermer: 'Handwärmer: im Inventar knicken.', lampenoel: 'Lampenöl: [L], wenn die Lampe leer ist.' }[a.id];
  if (tipp && !S.hint[a.id]) { S.hint[a.id] = 1; setTimeout(() => toast(tipp, 4200), 1400); }
  if (Math.random() < .3 && typeof whiskey_mimic === 'function' && kap() !== 3) setTimeout(() => whiskey_mimic('pling'), 2200); // nie bereut
}
function tausch_pruefen() { const W = tausch_whiskey(); if (!W || !W.g) return wait(300); whiskey_play('EatSomething', .08, true, 1.3); // er prüft die Ware mit dem Schnabel
  for (let i = 0; i < 3; i++) Audio.play(i === 2 ? 'metalHit1' : 'woodHit1', { gain: .1, rate: 2.4 + i * .1, delay: i * .32, x: W.g.position.x, y: W.g.position.y, z: W.g.position.z, ref: 2 }); return wait(1100); }
// Kanon-Tausch: EIN Ding, das er will; alles andere prüft er und lehnt ab (Wortlaute: def.ab)
function tausch_kanon(def) {
  if (state.talking) return; tausch_css(); const S = tausch_S;
  const render = (box, msg) => {
    box.innerHTML = `<div class="tsch-kopf"><span class="tsch-t">${def.titel}</span><span class="tsch-glanz">ANBIETEN</span></div>
      <div class="tsch-stimmung tsch-hand">${msg || def.stimmung}</div>
      <div class="tsch-cols"><div><h3>IN DEINEN TASCHEN</h3><div class="tsch-tasche">${tausch_taschenHtml(true, def.will)}</div></div>
      <div><h3>ER HAT</h3><div class="tsch-ang"><div class="tsch-a">${tausch_svg(def.gibt.i)}<b>${def.gibt.n}</b><span class="preis">?</span><p>${def.gibt.d}</p><em>Klick auf etwas aus deinen Taschen, um es ihm hinzuhalten.</em></div></div></div></div>
      <div class="tsch-fuss"><span class="tsch-hand"></span><button class="zu">ZURÜCK</button></div>`;
    box.querySelector('.zu').onclick = e => { e.stopPropagation(); closeOverlay(); };
    box.querySelectorAll('.tsch-w.bieten').forEach(el => el.onclick = async e => { e.stopPropagation(); const k = el.dataset.k;
      if (k === def.will) { if (k === 'batterie') { FLASH.spare--; if (!FLASH.spare) story.items = story.items.filter(x => x !== 'batterie'); } else if (k === 'lesebrille') story.items = story.items.filter(x => x !== 'lesebrille'); else tausch_nimm(k);
        S.log.push(`K${kap()} · ${k === 'batterie' ? 'Batterie' : (TAUSCH_WAREN[k] || { n: k }).n} → ${def.gibt.n}`); closeOverlay(); await tausch_pruefen(); def.ok(); return; }
      const W = tausch_whiskey(); if (W && W.g) { whiskey_play('EatSomething', .08, true, 1.4); Audio.play('woodHit1', { gain: .1, rate: 2.6, x: W.g.position.x, y: W.g.position.y, z: W.g.position.z, ref: 2 }); }
      render(box, (def.ab && def.ab[k]) || def.sonst || 'Er will etwas anderes.'); });
  };
  openPuzzle('', box => { box.classList.add('tausch'); render(box); });
}
// ---------------------------------------------------------------- Fundstücke in der Welt: Lichtfunke, blitzt im Lampenkegel auf
function tausch_glintTex() { return tex(cnv(64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,252,240,1)'); g.addColorStop(.12, 'rgba(255,240,205,.9)'); g.addColorStop(.35, 'rgba(255,225,170,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, w); c.strokeStyle = 'rgba(255,250,235,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(w / 2, 3); c.lineTo(w / 2, w - 3); c.moveTo(3, w / 2); c.lineTo(w - 3, w / 2); c.stroke(); }), true); }
function tausch_glint(x, y, z, label, act) { const S = tausch_S;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: S.tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); sp.position.set(x, y + .06, z); sp.scale.setScalar(.16); sp.visible = false; scene.add(sp);
  const hit = box(.55, .35, .55, x, y + .12, z, hidden, { cast: false }); interact(hit, label, act); uninteract(hit); return { sp, hit, x, y, z, on: false, ph: Math.random() * 6.28 }; }
function tausch_y(x, z) { const g = solidGround(x, .8, z); return g > -1 ? Math.max(0, g) : 0; }
function tausch_finde(F) { const S = tausch_S; if (S.funde.has(F.id)) return; if (!tausch_platz('glanz', F.w.length) || (F.bat && !tausch_platz('batterie', F.bat))) return tausch_voll(); S.funde.add(F.id); const G = F.G; G.sp.visible = false; uninteract(G.hit); G.on = false;
  for (const w of F.w) tausch_gib(w, 1, true); if (F.bat) setTimeout(() => addBattery(F.bat), 700);
  toast(F.t, 4200); questPop('GLÄNZENDES', F.w.map(w => TAUSCH_WAREN[w].n).join(', ')); Audio.play('keys1', { gain: .16, rate: 1.9, dur: .25 });
  if (!story.lore.some(l => l.key === 'tausch_start')) { story.lore.push({ key: 'tausch_start', title: 'Glänzendes', html: '<span class="hand">Ich sammle jetzt Kronkorken. Für einen Raben. Lucy würde sich totlachen.\n\nAber er nimmt nur, was glänzt – und er gibt dafür, was ich brauche.</span>' }); setTimeout(() => toast('Glänzendes liegt in deinen Taschen (Fibel, INVENTAR). Whiskey tauscht es – sprich ihn an.', 5200), 4600); } }
// Etwas, das Whiskey hinlegt (zurückgelegtes Diebesgut, Deckel, nasse Batterie): gespeichert, bis Luke es aufhebt
function tausch_drop(x, y, z, was, text) { const S = tausch_S; if (y === null || y === undefined) y = tausch_y(x, z); const D = { x, y, z, was, text, k: kap() }; S.drops.push(D); tausch_dropMake(D); }
function tausch_dropMake(D) { const S = tausch_S; const G = tausch_glint(D.x, D.y, D.z, 'Etwas glänzt', () => tausch_dropNimm(D)); D.G = G; interactables.push(G.hit); G.on = true; G.sp.visible = true; S.dropG.push(D); }
function tausch_dropNimm(D) { const S = tausch_S, w = D.was; if ((w.ware && !tausch_platz('glanz', 1)) || (w.bat && !tausch_platz('batterie', w.bat))) return tausch_voll(); S.drops = S.drops.filter(x => x !== D); S.dropG = S.dropG.filter(x => x !== D); uninteract(D.G.hit); D.G.sp.visible = false;
  if (w.ware) tausch_gib(w.ware, 1, true); if (w.item && !story.items.includes(w.item)) story.items.push(w.item); if (w.bat) addBattery(w.bat); toast(D.text || 'Aufgehoben.', 3800); Audio.play('keys1', { gain: .15, rate: 1.8, dur: .25 }); }
// ---------------------------------------------------------------- Lampe, Streichholz, Kreide, Fernglas, Handwärmer
function tausch_licht() { const S = tausch_S, L = S.L; return { an: !!(L && L.intensity > .05), x: L ? L.position.x : 0, y: L ? L.position.y : 0, z: L ? L.position.z : 0, r: S.match > 0 ? TAUSCH_LAMPE.holz.r : S.lampe ? TAUSCH_LAMPE[S.lampe].r : 0, art: S.match > 0 ? 'streichholz' : S.lampe }; }
function tausch_feuer() { return story.items.includes('feuerzeug') || tausch_S.streich > 0; }
function tausch_lampeVerboten() { if (ch3.part === 'white') return 'Das Streichholz zündet nicht. Hier drin gilt ein anderes Licht.'; if (typeof K6 !== 'undefined' && K6.on && (K6.lampDead || K6.beat === 'bau')) return 'Die Flamme will nicht. Hier nicht.';
  if (typeof k5 !== 'undefined' && k5.on && k5.pust) return 'Sie hat es ausgepustet. Es bleibt aus.'; return ''; }
function tausch_lampeTaste() {
  const S = tausch_S; if (state.talking || ui.overlay) return; const no = tausch_lampeVerboten();
  if (S.an) { S.an = false; Audio.play('air1', { gain: .12, rate: 1.6, dur: .35 }); return toast(S.lampe === 'sturm' ? 'Du drehst den Docht herunter. Die Laterne ist aus.' : 'Du pustest die Lampe aus.', 2200); }
  if (S.match > 0) { S.match = 0; return; }
  if (no) return toast(no, 3000);
  if (S.lampe) { if (S.oel <= .001) { if (S.oelN > 0) { S.oelN--; S.oel = 1; Audio.play('waterFlow', { gain: .12, rate: 1.6, dur: 1.2 }); toast('Du füllst Lampenöl nach.', 2400); } else return toast('Die Lampe ist leer. Kein Öl mehr.', 2600); }
    if (!tausch_feuer()) return toast('Nichts, um sie anzuzünden. Streichhölzer. Ein Feuerzeug.', 3000);
    if (!story.items.includes('feuerzeug')) S.streich--; S.an = true; S.flame = 0; Audio.play('switch1', { gain: .12, rate: .5 }); Audio.play('air2', { gain: .08, rate: 1.4, dur: .5 }); return; }
  if (S.streich > 0) { S.streich--; S.match = tausch_innen() ? 26 : 16; S.flame = 0; Audio.play('scrape2', { gain: .18, rate: 2.2, dur: .35 }); return; }
  if (!S.hint.L) { S.hint.L = 1; toast('Keine Lampe, keine Streichhölzer. Whiskey tauscht so etwas.', 3200); } }
function tausch_innen() { return typeof state !== 'undefined' && (state.inBasement || (Audio.space && Audio.space(player.pos.x, player.pos.z) !== 'o')); }
const tausch_v1 = new THREE.Vector3(), tausch_v2 = new THREE.Vector3(), tausch_up = new THREE.Vector3(0, 1, 0), tausch_ray = new THREE.Raycaster();
function tausch_kreideTaste() {
  const S = tausch_S; if (state.talking || ui.overlay) return; if (S.kreide <= 0) { if (!S.hint.K) { S.hint.K = 1; toast('Keine Kreide.', 1800); } return; }
  camera.getWorldDirection(tausch_v1); const c = camera.position; let px, py, pz, nx = 0, ny = 1, nz = 0;
  tausch_ray.set(c, tausch_v1); tausch_ray.far = 3.6; const h = tausch_ray.intersectObjects(occluders, false)[0];
  if (h && h.face) { tausch_v2.copy(h.face.normal).transformDirection(h.object.matrixWorld); px = h.point.x; py = h.point.y; pz = h.point.z; nx = tausch_v2.x; ny = tausch_v2.y; nz = tausch_v2.z; }
  else if (tausch_v1.y < -.2) { let g = tausch_y(c.x, c.z), t = (c.y - g) / -tausch_v1.y; g = tausch_y(c.x + tausch_v1.x * t, c.z + tausch_v1.z * t); t = (c.y - g) / -tausch_v1.y; if (t > 4.2) return toast('Zu weit weg für Kreide.', 1600); px = c.x + tausch_v1.x * t; py = g; pz = c.z + tausch_v1.z * t; }
  else return toast('Sieh auf den Boden oder eine Wand.', 1800);
  S.kreide--; const M = [+px.toFixed(2), +py.toFixed(3), +pz.toFixed(2), +nx.toFixed(3), +ny.toFixed(3), +nz.toFixed(3), +Math.atan2(tausch_v1.x, tausch_v1.z).toFixed(3), kap()];
  S.marken.push(M); if (S.marken.length > S.dec.length) S.marken.shift(); tausch_marke(M, S.marken.length - 1);
  Audio.play('scrape1', { gain: .14, rate: 2.6, dur: .5, x: px, y: py, z: pz, ref: 2 });
  if (typeof karte_markierung === 'function') { try { karte_markierung(px, pz, 'kreide', 'Kreide'); } catch (e) {} } } // Karte (X-2): gelber Pfeil
function tausch_marke(M, i) { const S = tausch_S, m = S.dec[i % S.dec.length]; if (!m) return; const [x, y, z, nx, ny, nz, yaw] = M;
  m.position.set(x + nx * .012, y + ny * .012, z + nz * .012); tausch_v2.set(nx, ny, nz);
  if (ny > .7) { m.rotation.set(-PI / 2, 0, yaw + PI); } else { m.lookAt(x + nx, y + ny, z + nz); } m.visible = true; }
function tausch_markenZeigen() { const S = tausch_S; S.dec.forEach(m => m.visible = false); S.marken.forEach((M, i) => tausch_marke(M, i)); }
function tausch_kreideTex() { return tex(cnv(256, (c, w) => { c.clearRect(0, 0, w, w); c.strokeStyle = 'rgba(245,214,96,.92)'; c.lineCap = 'round'; c.lineJoin = 'round';
  for (let p = 0; p < 3; p++) { c.globalAlpha = .45 + p * .2; c.lineWidth = 15 - p * 4; c.beginPath(); c.moveTo(128 + rand(-3, 3), 214); c.lineTo(128 + rand(-3, 3), 58); c.moveTo(80 + rand(-3, 3), 104); c.lineTo(128, 50); c.lineTo(176 + rand(-3, 3), 104); c.stroke(); }
  c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 900; i++) { c.globalAlpha = rand(.2, .7); c.fillRect(rand(0, w), rand(0, w), rand(1, 3), rand(1, 3)); } }), true); }
function tausch_waermer() { const S = tausch_S; if (S.warmN <= 0) return; S.warmN--; S.warmT = 300; Audio.play('keys3', { gain: .12, rate: 2, dur: .3 }); toast('Knack. Das Kissen wird warm. Warm wie eine Hand.', 3200); if (ui.overlay === 'journal') renderJournal(); }
// Angst (Basis fearUpdate): brennende Lampe oder Streichholz zählt als Licht; warme Hände → die Angst steigt langsamer
fearUpdate = (o => function (dt, indoor) { const S = tausch_S, lit = S.L && S.L.intensity > .15;
  if (lit && !(flashOn && FLASH.charge > 0 && state.flashFail <= 0)) { const f = flashOn, c = FLASH.charge, ff = state.flashFail; flashOn = true; FLASH.charge = Math.max(c, .01); state.flashFail = 0; try { o(dt, indoor); } finally { flashOn = f; FLASH.charge = c; state.flashFail = ff; } }
  else o(dt, indoor);
  if (S.warmT > 0) fear.v = Math.max(0, fear.v - dt * .05); })(fearUpdate);
// ---------------------------------------------------------------- Fibel: Inventar-Seite bekommt „Glänzendes“ und „Aus dem Tausch“
renderJournal = (o => () => { o(); if (jTab !== 'inventar') return; tausch_css(); const S = tausch_S, B = $('jBody');
  const gear = [];
  if (S.lampe) gear.push({ i: S.lampe === 'sturm' ? 'laterne' : 'oellampe', n: TAUSCH_LAMPE[S.lampe].n, c: `${Math.round(S.oel * 100)} %`, d: `[L] an/aus. Öl: ${Math.round(S.oel * 100)} %${S.oelN ? ` · ${S.oelN} Fläschchen Lampenöl` : ''}.` });
  if (S.streich) gear.push({ i: 'streich', n: 'Streichhölzer', c: '×' + S.streich, d: 'Zünden Lampe und Laterne. Ohne Lampe: [L], ein Streichholz, kurz Licht.' });
  if (S.kreide) gear.push({ i: 'kreide', n: 'Straßenkreide', c: '×' + S.kreide, d: '[K]: ein gelber Pfeil dahin, wohin du siehst.' });
  if (S.fernglas) gear.push({ i: 'fernglas', n: 'Fernglas', c: '', d: '[V] halten.' });
  if (S.warmN || S.warmT > 0) gear.push({ i: 'waermer', n: 'Handwärmer', c: S.warmN ? '×' + S.warmN : '', d: S.warmT > 0 ? `Noch ${Math.ceil(S.warmT / 60)} min warm.` : 'Knicken: 5 Minuten warme Hände.', b: S.warmN ? 'KNICKEN' : '' });
  const tasche = tausch_taschenHtml(false), el = document.createElement('div'); el.className = 'tsch';
  el.innerHTML = `<h2>GLÄNZENDES · FÜR WHISKEY · ${tausch_glanz()} ✶</h2><div class="tsch-tasche">${tasche}</div>
    ${gear.length ? `<h2 style="margin-top:22px">AUS DEM TAUSCH</h2><div class="tsch-gear">${gear.map(g => `<div class="tsch-w" data-d="${g.d}">${tausch_svg(g.i)}${g.c ? `<i>${g.c}</i>` : ''}<b>${g.n}</b>${g.b ? `<button>${g.b}</button>` : ''}</div>`).join('')}</div>` : ''}
    ${S.log.length ? `<div class="tsch-log">${S.log.slice(-5).map(l => l.replace(/^K(\d) · /, 'Kap. $1: ')).join('<br>')}</div>` : ''}`;
  B.appendChild(el);
  el.querySelectorAll('.tsch-w').forEach(w => w.onmouseenter = () => { const W = TAUSCH_WAREN[w.dataset.k], d = $('invDesc'); if (!d) return; d.innerHTML = W ? `<b>${W.n.toUpperCase()}</b>${W.d}` : `<b>${w.querySelector('b').textContent.toUpperCase()}</b>${w.dataset.d}`; });
  const kb = el.querySelector('.tsch-gear button'); if (kb) kb.onclick = e => { e.stopPropagation(); tausch_waermer(); };
})(renderJournal);
// ---------------------------------------------------------------- Spielstand
MOD_SAVE.push(['tausch', () => { const S = tausch_S; return { tasche: S.tasche, funde: [...S.funde], gekauft: S.gekauft, log: S.log.slice(-40), oel: S.oel, oelN: S.oelN, lampe: S.lampe, streich: S.streich, kreide: S.kreide, marken: S.marken, warmN: S.warmN, warmT: S.warmT, fernglas: S.fernglas, nass: S.nass,
    drops: S.drops.map(d => ({ x: d.x, y: d.y, z: d.z, was: d.was, text: d.text, k: d.k })) }; },
  v => { const S = tausch_S; if (!v || typeof v !== 'object') return; S.tasche = v.tasche && typeof v.tasche === 'object' ? { ...v.tasche } : {}; S.funde = new Set(v.funde || []); S.gekauft = v.gekauft || {}; S.log = Array.isArray(v.log) ? v.log : [];
    S.oel = +v.oel || 0; S.oelN = +v.oelN || 0; S.lampe = v.lampe === 'oel' || v.lampe === 'sturm' ? v.lampe : ''; S.streich = +v.streich || 0; S.kreide = +v.kreide || 0; S.marken = Array.isArray(v.marken) ? v.marken.slice(-24) : []; S.warmN = +v.warmN || 0; S.warmT = +v.warmT || 0; S.fernglas = !!v.fernglas; S.nass = !!v.nass; S.an = false; S.match = 0;
    for (const D of S.dropG) { uninteract(D.G.hit); D.G.sp.visible = false; } S.dropG = []; S.drops = []; for (const d of v.drops || []) { S.drops.push(d); if (S.ready) tausch_dropMake(d); }
    if (S.ready) { tausch_markenZeigen(); tausch_fundeSync(true); } }]);
// Neues Spiel: in Lukes Taschen der Einkaufswagenchip (alter Schlüsselbund) und ein Kaugummipapier (W-03)
beginGame = (o => function (resume) { const r = o.apply(this, arguments); if (!resume && state.started) { const S = tausch_S; S.tasche = { chip: 1, kaugummipapier: 1 }; S.funde.clear(); S.gekauft = {}; S.log = []; S.oel = 0; S.oelN = 0; S.lampe = ''; S.an = false; S.streich = 0; S.kreide = 0; S.marken = []; S.warmN = 0; S.warmT = 0; S.fernglas = false; S.nass = false;
  for (const D of S.dropG) { uninteract(D.G.hit); D.G.sp.visible = false; } S.dropG = []; S.drops = []; if (S.ready) { tausch_markenZeigen(); tausch_fundeSync(true); } } return r; })(beginGame);
// Welche Fundorte gehören ins aktuelle Kapitel (Klickfläche an/aus; nur bei Wechsel)
function tausch_fundeSync(force) { const S = tausch_S, k = kap(); if (!force && S.kSync === k) return; S.kSync = k;
  for (const F of TAUSCH_FUNDE) { const G = F.G; if (!G) continue; const on = k >= F.k[0] && k <= F.k[1] && !S.funde.has(F.id); if (on && !G.on) { if (!interactables.includes(G.hit)) interactables.push(G.hit); } else if (!on && G.on) { uninteract(G.hit); G.sp.visible = false; } G.on = on; } }
WORLD_MODS.push(['Tausch', async () => {
  const S = tausch_S; tausch_css(); S.tex = tausch_glintTex();
  for (const F of TAUSCH_FUNDE) { const y = tausch_y(F.at[0], F.at[1]); F.G = tausch_glint(F.at[0], y, F.at[1], 'Etwas glänzt', () => tausch_finde(F)); }
  // Kreidezeichen: fester Vorrat an Flächen (Decal-Pool), beim Laden angelegt; neue Zeichen ersetzen das älteste
  const km = new THREE.MeshStandardMaterial({ map: tausch_kreideTex(), transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4 });
  for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.55, .55), km); m.visible = false; m.renderOrder = 2; m.userData.noCol = true; scene.add(m); S.dec.push(m); }
  // Das Licht der Öllampe/Sturmlaterne/des Streichholzes: EIN virtuelles Licht (Basis-Pool), jetzt angelegt, zur Laufzeit nur Intensität
  S.L = new VLight(0xffae5c, 0, 8, 2); S.L.position.set(0, -80, 0); scene.add(S.L);
  const v = document.createElement('div'); v.id = 'tauschGlas'; document.body.appendChild(v); S.vig = v;
  KEY_HOOKS.KeyL = () => tausch_lampeTaste(); KEY_HOOKS.KeyK = () => tausch_kreideTaste();
  S.ready = true; tausch_fundeSync(true); tausch_markenZeigen(); for (const d of S.drops) if (!d.G) tausch_dropMake(d);
}]);
const tausch_v3 = new THREE.Vector3(), tausch_v4 = new THREE.Vector3();
WORLD_TICK.push((dt, t, indoor) => {
  const S = tausch_S; if (!S.ready) return; if (!state.started || menu.attract) { if (S.L) S.L.intensity = 0; return; }
  S.chk -= dt; if (S.chk <= 0) { S.chk = 1; tausch_fundeSync(false); }
  // Lampe/Streichholz: Licht in der Hand (rechts unten), unruhige Flamme; Öl brennt ab
  const L = S.L, lamp = S.an && S.lampe ? TAUSCH_LAMPE[S.lampe] : null, no = (S.an || S.match > 0) ? tausch_lampeVerboten() : '';
  if (no) { S.an = false; S.match = 0; if (Audio.flick) Audio.flick(); toast(no.startsWith('Sie hat') ? '„Pust.“ – Die Flamme ist aus. Einfach ausgepustet.' : no, 3000); }
  // Das Graukind pustet jedes Licht aus – auch die Sturmlaterne (Pusten ist kein Wind)
  if ((S.an || S.match > 0) && grey.visible && Math.hypot(grey.position.x - player.pos.x, grey.position.z - player.pos.z) < 16) { S.an = false; S.match = 0; if (Audio.flick) Audio.flick(); subtitle('„Pust.“', 1600, 'DAS KIND'); }
  // Wind: eine Böe draußen kann die Öllampe (nicht die Sturmlaterne) ausblasen – nat.gustT springt beim Windstoß der Basis hoch
  if (typeof nat !== 'undefined') { if (nat.gustT > S.gustLast + 20 && S.an && lamp && lamp.wind && !indoor && Math.random() < lamp.wind) { S.an = false; toast('Eine Böe. Die Flamme duckt sich – und ist weg.', 2800); Audio.play('air1', { gain: .2, rate: .8, dur: .6 }); } S.gustLast = nat.gustT; }
  let want = 0, dist = 0, col = 0xffae5c;
  if (S.an && lamp) { S.oel = Math.max(0, S.oel - dt / lamp.life); if (S.oel <= 0) { S.an = false; toast(S.oelN ? 'Die Lampe ist leer. [L] füllt Öl nach.' : 'Die Lampe ist leer. Kein Öl mehr.', 3000); } S.flame = Math.min(1, S.flame + dt * 1.6); want = lamp.i * S.flame * (S.oel < .08 ? .45 + S.oel * 6 : 1); dist = lamp.r; col = lamp.c; }
  else if (S.match > 0) { S.match -= dt; S.flame = Math.min(1, S.flame + dt * 5); want = TAUSCH_LAMPE.holz.i * S.flame * (S.match < 2 ? S.match / 2 : 1); dist = TAUSCH_LAMPE.holz.r; col = TAUSCH_LAMPE.holz.c; if (S.match <= 0) Audio.play('air1', { gain: .06, rate: 2, dur: .2 }); }
  const fl = (lamp && lamp.wind === 0 ? .96 + .04 * Math.sin(t * 9.1) : .86 + .08 * Math.sin(t * 11.3) + .06 * Math.sin(t * 23.7 + 1.3));
  if (want > 0) { camera.getWorldDirection(tausch_v3); tausch_v2.crossVectors(tausch_v3, tausch_up).normalize(); L.position.copy(camera.position).addScaledVector(tausch_v3, .35).addScaledVector(tausch_v2, .28); L.position.y -= .42; L.distance = dist; L.color.setHex(col); L.intensity = want * fl; }
  else L.intensity = Math.max(0, L.intensity - dt * 6);
  // Handwärmer
  if (S.warmT > 0) { S.warmT -= dt; if (S.warmT <= 0) toast('Der Handwärmer ist kalt.', 2200); }
  // Fernglas: [V] halten (nicht in Szenen)
  const z = S.fernglas && keys.KeyV && !state.talking && !ui.overlay && !camOverride; S.zoom += ((z ? 1 : 0) - S.zoom) * Math.min(1, dt * 10);
  if (S.zoom > .01) { const f = fov + (22 - fov) * S.zoom; if (Math.abs(camera.fov - f) > .05) { camera.fov = f; camera.updateProjectionMatrix(); } S.vig.classList.toggle('on', S.zoom > .5); }
  else if (S.vigOn) { S.vig.classList.remove('on'); if (!camOverride) { camera.fov = fov; camera.updateProjectionMatrix(); } } // nur einmal zurück – andere Module (Kamera, Kino) setzen ihr eigenes Sichtfeld
  S.vigOn = S.zoom > .01;
  // Kapitel 6: einmal eine nasse Batterie aus dem Weiher (83 §4), wenn Luke ohne Ersatz im Dunkeln steht
  if (!S.nass && kap() === 6 && FLASH.spare === 0 && FLASH.charge < .2 && typeof whiskey_S !== 'undefined' && whiskey_S.g && whiskey_S.g.visible && !whiskey_S.light && !state.talking) { S.nass = true; const P = player.pos, f = flatDir();
    tausch_drop(P.x + f.x * 1.2, null, P.z + f.z * 1.2, { bat: 1, name: 'Batterie' }, 'Eine Batterie. Noch nass. Er hat sie aus dem Weiher geholt. Sie funktioniert. Frag nicht.'); whiskey_blick(P.x + f.x * 1.2, .1, P.z + f.z * 1.2, 5); }
  // Funken: sichtbar im Lampenkegel (oder mit dem Fernglas von weit), nah immer ein wenig
  camera.getWorldDirection(tausch_v3); const cam = camera.position, lit = flashOn && FLASH.charge > 0, lampOn = L.intensity > .2;
  for (let i = 0; i < TAUSCH_FUNDE.length + S.dropG.length; i++) { const G = i < TAUSCH_FUNDE.length ? TAUSCH_FUNDE[i].G : S.dropG[i - TAUSCH_FUNDE.length].G; if (!G || !G.on) continue;
    const dx = G.x - cam.x, dz = G.z - cam.z, d = Math.hypot(dx, dz); if (d > 70) { if (G.sp.visible) G.sp.visible = false; continue; }
    tausch_v4.set(dx, G.y + .06 - cam.y, dz).normalize(); const dot = tausch_v3.dot(tausch_v4);
    let k = d < 2.5 ? .35 : 0; if (lit && d < 20 && dot > .92) k = Math.max(k, (dot - .92) / .08 * (1 - d / 22)); if (S.zoom > .5 && d < 65 && dot > .985) k = Math.max(k, .7); if (lampOn && d < TAUSCH_LAMPE[S.lampe || 'holz'].r * .8) k = Math.max(k, .5 * (1 - d / 10));
    G.ph += dt * (2 + (i % 5)); const a = k * (.55 + .45 * Math.abs(Math.sin(G.ph))); G.sp.visible = a > .02; if (G.sp.visible) { G.sp.material.opacity = Math.min(1, a); G.sp.scale.setScalar(.1 + .1 * a + d * .004); } }
});
window.__tausch = { S: tausch_S, W: TAUSCH_WAREN, A: TAUSCH_ANGEBOTE, F: TAUSCH_FUNDE, gib: (id, n) => tausch_gib(id, n), finde: id => tausch_finde(TAUSCH_FUNDE.find(f => f.id === id)), offen: () => tausch_offen(), moeglich: () => tausch_moeglich(),
  preis: id => tausch_preis(TAUSCH_ANGEBOTE.find(a => a.id === id)), kaufe: id => tausch_kaufe(TAUSCH_ANGEBOTE.find(a => a.id === id)), lampe: () => tausch_lampeTaste(), kreide: () => tausch_kreideTaste(), licht: () => tausch_licht(), glanz: () => tausch_glanz() }; // Testzugriff
