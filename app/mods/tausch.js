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
const TAUSCH_LAMPE = { oel: { n: 'Öllampe', r: 8, i: 2.1, c: 0xffae5c, life: 1080, wind: .45 }, sturm: { n: 'Sturmlaterne', r: 11, i: 2.9, c: 0xffbd70, life: 1500, wind: 0 }, holz: { r: 4, i: .85, c: 0xff9e48 } };
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
  { id: 'k1_laube', k: [1, 3], at: [-108.95, 25.62], haengen: [-108.57, 2.02, 25.62, 0], w: ['lametta'], t: 'An der Laubentür hängt Lametta. Silber, verheddert, nass.' },
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
function tausch_voll(art) { if (typeof beutel_vollHinweis === 'function') { try { beutel_vollHinweis(art); return false; } catch (e) {} } toast('Kein Platz mehr im Beutel.', 2600); return false; }
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
  #tauschGlas { position: fixed; inset: 0; pointer-events: none; z-index: 6; opacity: 0; transition: opacity .18s; background: #000;
    -webkit-mask-image: radial-gradient(circle at 37% 50%, transparent 0 29vh, #000 31vh), radial-gradient(circle at 63% 50%, transparent 0 29vh, #000 31vh); -webkit-mask-composite: source-in;
    mask-image: radial-gradient(circle at 37% 50%, transparent 0 29vh, #000 31vh), radial-gradient(circle at 63% 50%, transparent 0 29vh, #000 31vh); mask-composite: intersect; }
  #tauschGlas.on { opacity: 1; } #tauschGlas::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,.35) 70%); }
  #puzzle .box.tausch h3 { display: block; background: none; box-shadow: none; border: 0; padding: 0; margin: 0 0 10px; text-indent: 0; font: 600 12px "Cormorant Garamond", Georgia, serif; letter-spacing: .4em; color: var(--pred); text-shadow: none; }
  #puzzle .box.tausch h3::before, #puzzle .box.tausch h3::after { display: none; }
  #puzzle .box.tausch p { margin: 0; font: italic 16px/1.35 "Cormorant Garamond", Georgia, serif; color: #3a2d20; }
  #puzzle .box.tausch button { min-width: 0; background: transparent; box-shadow: none; text-shadow: none; border-radius: 0; }
  #puzzle .box.tausch .tsch-a button { color: var(--pred); border: 2px solid rgba(124,36,24,.75); padding: 6px 12px 5px; font: 12px "Special Elite", monospace; letter-spacing: .2em; }
  #puzzle .box.tausch .tsch-a button:hover:not(:disabled) { background: rgba(124,36,24,.1); color: #5a1208; box-shadow: none; }
  #puzzle .box.tausch .tsch-fuss button { border: 0; color: #5a4a35; font: 13px "Special Elite", monospace; letter-spacing: .25em; padding: 4px 6px; }
  #puzzle .box.tausch .tsch-fuss button:hover { color: var(--pred); background: none; box-shadow: none; }
  #puzzle .box.tausch .tsch-w { width: 96px; } #puzzle .box.tausch .tsch-w b { font-size: 16px; overflow-wrap: anywhere; }
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
  const S = tausch_S, pr = tausch_preis(a), wahl = tausch_wahl(pr); if (!wahl || !tausch_frei(a)) return;
  for (const w of wahl) tausch_nimm(w); // erst bezahlen (macht im Beutel Platz), dann prüfen, ob die Ware hineinpasst
  const art = TAUSCH_ART[a.id] || 'geraet', tauscht = a.id === 'sturmlaterne' && S.lampe; if (!tauscht && !tausch_platz(art, 1)) { /* Sturmlaterne ersetzt die Öllampe: kein neues Fach */ for (const w of wahl) tausch_gib(w, 1, true); closeOverlay(); return tausch_voll(art); } S.gekauft[a.id] = (S.gekauft[a.id] || 0) + 1; S.log.push(`K${kap()} · ${wahl.map(x => TAUSCH_WAREN[x].n).join(', ')} → ${a.n}`); if (S.log.length > 40) S.log.shift();
  closeOverlay(); await tausch_pruefen(); a.gib(); questPop('VON WHISKEY', a.n); Audio.play('keys2', { gain: .2, rate: 1.5, dur: .3 });
  const tipp = { streich: 'Streichhölzer: [L], wenn du keine Lampe hast.', kreide: 'Kreide: [K] malt einen Pfeil.', oellampe: 'Öllampe: [L] an und aus.', sturmlaterne: 'Sturmlaterne: [L] an und aus. Windfest.', fernglas: 'Fernglas: [V] halten.', waermer: 'Handwärmer: im Inventar knicken.', lampenoel: 'Lampenöl: [L], wenn die Lampe leer ist.' }[a.id];
  if (tipp && !S.hint[a.id]) { S.hint[a.id] = 1; setTimeout(() => toast(tipp, 4200), 1400); }
  if (Math.random() < .3 && typeof whiskey_mimic === 'function' && kap() !== 3) setTimeout(() => whiskey_mimic('gurren'), 2200); // nie bereut (Gag-Budget H-1: kein Zufalls-Pling)
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
// ---------------------------------------------------------------- Fundstücke als echte kleine Modelle (statt eines gemeinsamen Metallstücks): jede Ware hat ihren Körper, Maße in Metern, Ursprung = Auflagefläche
// Rückgabe: Gruppe, flach liegend, y = 0 an der Unterkante. Prozedural aus mehreren Teilen (Drehkörper, Extrusionen, Röhren) mit Metall-/Glas-/Plastikmaterial.
function tausch_cv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function tausch_met(farbe, rau = .34, met = 1) { return new THREE.MeshStandardMaterial({ color: farbe, metalness: met, roughness: rau, envMapIntensity: 1.3 }); }
function tausch_rs() { tausch_rs.s = ((tausch_rs.s || 7) * 16807) % 2147483647; return tausch_rs.s / 2147483647; }
function tausch_propBau(id) { const T = THREE, g = new T.Group(), add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; g.add(m); return m; };
  const scheibe = (r, h, mat, segs = 28) => new T.CylinderGeometry(r, r, h, segs);
  switch (id) {
    case 'kronkorken': { // plattgefahren: Rand gewellt, Mitte eingedrückt, Aufdruck „Abgrundbräu“
      const tx = tausch_cv(128, 128, (x, w) => { x.fillStyle = '#b8902c'; x.fillRect(0, 0, w, w); x.strokeStyle = '#6a1410'; x.lineWidth = 7; x.beginPath(); x.arc(64, 64, 44, 0, 7); x.stroke(); x.fillStyle = '#6a1410'; x.font = 'bold 15px Georgia'; x.textAlign = 'center'; x.fillText('ABGRUND', 64, 62); x.fillText('BRÄU', 64, 80); for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(40,30,20,${tausch_rs() * .3})`; x.fillRect(tausch_rs() * w, tausch_rs() * w, 3, 2); } });
      const gm = new T.CylinderGeometry(.0165, .0172, .0034, 21, 1), P = gm.attributes.position; for (let i = 0; i < P.count; i++) { const a = Math.atan2(P.getZ(i), P.getX(i)), r = Math.hypot(P.getX(i), P.getZ(i)); if (r > .0150) P.setY(i, P.getY(i) + Math.sin(a * 21) * .0006 * (P.getY(i) > 0 ? 1 : -1)); else P.setY(i, P.getY(i) - .0008); } gm.computeVertexNormals();
      add(gm, [tausch_met(0x8a7a50, .5), new T.MeshStandardMaterial({ map: tx, metalness: .8, roughness: .45 }), tausch_met(0x6a5a40, .5)], 0, .0018, 0, .03, 0, .05); g.children[0].rotation.x = .04; break; }
    case 'knopf': { const m = tausch_met(0xb3892f, .3); add(new T.CylinderGeometry(.0115, .0115, .0022, 28), m, 0, .0015, 0); add(new T.TorusGeometry(.0112, .0011, 8, 28), m, 0, .0026, 0, PI / 2); add(new T.SphereGeometry(.0078, 16, 8, 0, PI * 2, 0, PI / 2), m, 0, .0026, 0).scale.y = .35; for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(new T.CylinderGeometry(.0009, .0009, .0004, 8), tausch_met(0x1a1208, .9, 0), a * .0026, .0034, b * .0026); break; }
    case 'pfennig': case 'fuenfmark': { const f = id === 'fuenfmark', r = f ? .0145 : .0085, sh = new T.Shape(); sh.absarc(0, 0, r, 0, PI * 2, false); const h = new T.Path(); h.absarc(0, r * .55, .0013, 0, PI * 2, true); if (!f) sh.holes.push(h);
      const tx = tausch_cv(128, 128, (x, w) => { x.fillStyle = f ? '#a9acae' : '#6a8f6a'; x.fillRect(0, 0, w, w); x.strokeStyle = f ? '#7c7f82' : '#3c5a40'; x.lineWidth = 5; x.beginPath(); x.arc(64, 64, 52, 0, 7); x.stroke(); x.fillStyle = x.strokeStyle; x.font = 'bold 44px Georgia'; x.textAlign = 'center'; x.fillText(f ? '5' : '10', 64, 80); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${f ? '60,60,60' : '30,70,50'},${tausch_rs() * .3})`; x.beginPath(); x.arc(tausch_rs() * w, tausch_rs() * w, 1 + tausch_rs() * 3, 0, 7); x.fill(); } });
      const eg = new T.ExtrudeGeometry(sh, { depth: f ? .002 : .0013, bevelEnabled: true, bevelSize: .0004, bevelThickness: .0004, bevelSegments: 1, curveSegments: 24 }), uv = eg.attributes.uv; const m = add(eg, [new T.MeshStandardMaterial({ map: tx, metalness: .9, roughness: .4 }), tausch_met(f ? 0x9a9d9f : 0x4f7a5a, .5)], 0, .0006, 0, -PI / 2); break; }
    case 'murmel': { const gl = new T.MeshStandardMaterial({ color: 0xd8f0ee, roughness: .02, transparent: true, opacity: .92, envMapIntensity: 2 }); add(new T.SphereGeometry(.0078, 24, 16), gl, 0, .0078, 0);
      const ptsH = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * PI * 2 * 1.3, y = -.0048 + i / 24 * .0096; ptsH.push(new T.Vector3(Math.cos(a) * .0028, y, Math.sin(a) * .0028)); } add(new T.TubeGeometry(new T.CatmullRomCurve3(ptsH), 40, .0008, 6), new T.MeshStandardMaterial({ color: 0xb02820, roughness: .4 }), 0, .0078, 0); break; }
    case 'briefschluessel': { const m = tausch_met(0xa8aaae, .35), sh = new T.Shape(); sh.moveTo(-.002, -.004); sh.lineTo(-.002, -.026); sh.lineTo(-.005, -.026); sh.lineTo(-.005, -.0285); sh.lineTo(.002, -.0285); sh.lineTo(.002, -.004); sh.absarc(0, .002, .0066, -.3, PI + .3, false); const lo = new T.Path(); lo.absarc(0, .0025, .0026, 0, PI * 2, true); sh.holes.push(lo);
      add(new T.ExtrudeGeometry(sh, { depth: .0016, bevelEnabled: false, curveSegments: 12 }), m, -.003, .0008, .006, PI / 2); const tag = new T.Mesh(new T.PlaneGeometry(.026, .018), new T.MeshStandardMaterial({ map: tausch_cv(128, 96, (x, w, h) => { x.fillStyle = '#c9b88a'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2018'; x.font = 'bold 70px Georgia'; x.textAlign = 'center'; x.fillText('2', w / 2, 72); }), roughness: .9, side: T.DoubleSide })); tag.rotation.x = -PI / 2; tag.position.set(.026, .0012, -.004); tag.rotation.z = .5; g.add(tag);
      add(new T.TorusGeometry(.0075, .0007, 6, 18), m, .0, .0022, .012, PI / 2 - .3, 0, 0); break; }
    case 'loeffel': { const m = tausch_met(0xc8cacc, .24); const bowl = add(new T.SphereGeometry(.0225, 24, 12, 0, PI * 2, 0, PI / 2), m, .074, .0225 * .38, 0); bowl.scale.set(1, .38, .72); bowl.rotation.x = PI; bowl.position.y = .0115; // Laffe (nach oben offen: Halbkugel gedreht)
      const inn = add(new T.CircleGeometry(.0205, 20), tausch_met(0x9a9ca0, .3), .074, .0116, 0, -PI / 2); inn.scale.set(1, .72, 1);
      const st = new T.Shape(); st.moveTo(0, -.005); st.quadraticCurveTo(.045, -.0042, .065, -.012); st.lineTo(.065, .012); st.quadraticCurveTo(.045, .0042, 0, .005); const sg = add(new T.ExtrudeGeometry(st, { depth: .0022, bevelEnabled: true, bevelSize: .0006, bevelThickness: .0006, bevelSegments: 1 }), m, .0, .0012, 0, -PI / 2, 0, 0); sg.rotation.set(-PI / 2, 0, 0); sg.position.set(0, .0014, 0); sg.scale.set(1, 1, 1);
      const gv = new T.Mesh(new T.PlaneGeometry(.022, .008), new T.MeshStandardMaterial({ map: tausch_cv(128, 48, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(40,40,44,.9)'; x.font = 'italic bold 30px Georgia'; x.textAlign = 'center'; x.fillText('H W', w / 2, 34); }), transparent: true, metalness: .6, roughness: .5 })); gv.rotation.x = -PI / 2; gv.position.set(.012, .0042, 0); g.add(gv); break; } // Monogramm „H. W.“
    case 'ring': { const gold = tausch_met(0xc9a23c, .28); add(new T.TorusGeometry(.0092, .0016, 10, 28), gold, 0, .0016, 0, PI / 2); add(new T.CylinderGeometry(.0042, .0032, .004, 8), gold, 0, .0038, -.0094).rotation.x = .3; add(new T.OctahedronGeometry(.0058), new T.MeshStandardMaterial({ color: 0xc02030, roughness: .1, emissive: 0x300008 }), 0, .0072, -.0094).scale.y = .8; g.rotation.y = .6; break; }
    case 'scherbe': { const sh = new T.Shape(); sh.moveTo(-.021, -.007); sh.lineTo(.002, -.0145); sh.lineTo(.0235, -.003); sh.lineTo(.015, .0115); sh.lineTo(-.006, .0125); sh.lineTo(-.018, .0035); sh.lineTo(-.021, -.007);
      add(new T.ExtrudeGeometry(sh, { depth: .0026, bevelEnabled: true, bevelSize: .0008, bevelThickness: .0004, bevelSegments: 1 }), new T.MeshStandardMaterial({ color: 0x6fae7e, roughness: .06, transparent: true, opacity: .9, envMapIntensity: 2 }), 0, .001, 0, -PI / 2, 0, .4); break; }
    case 'lametta': { const m = new T.MeshStandardMaterial({ color: 0xd8dce0, metalness: 1, roughness: .18, side: T.DoubleSide, envMapIntensity: 1.8 }); for (let i = 0; i < 46; i++) { const L = .2 + tausch_rs() * .22, pl = new T.PlaneGeometry(.0034, L, 1, 18), P = pl.attributes.position; for (let k = 0; k < P.count; k++) { const t = (P.getY(k) + L / 2) / L; P.setX(k, P.getX(k) + Math.sin(t * 9 + i) * .004 * (1 - t * .3)); P.setZ(k, Math.cos(t * 7 + i * 1.3) * .004 * t); } pl.computeVertexNormals();
      const s = new T.Mesh(pl, m); s.position.set((tausch_rs() - .5) * .012, -L / 2, (tausch_rs() - .5) * .012); const w = new T.Group(); w.add(s); w.rotation.set(0, tausch_rs() * 6.28, (tausch_rs() - .5) * .14); g.add(w); }
      add(new T.CylinderGeometry(.004, .004, .026, 8), tausch_met(0x6a6a6e, .5), 0, .004, 0, 0, 0, PI / 2); g.userData.haengt = true; break; } // hängt an einem Nagel: Ursprung = Aufhängung
    case 'staniol': { const gm = new T.IcosahedronGeometry(.031, 3), P = gm.attributes.position, v = new T.Vector3(); for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const n = Math.sin(v.x * 190 + v.y * 70) * Math.sin(v.y * 210 + v.z * 80) * .0022 + Math.sin(v.z * 330) * .0012; v.multiplyScalar(1 + n / .031); P.setXYZ(i, v.x, v.y, v.z); } gm.computeVertexNormals();
      add(gm, new T.MeshStandardMaterial({ color: 0xc4c7cb, metalness: 1, roughness: .38, flatShading: true, envMapIntensity: 1.6 }), 0, .03, 0); break; }
    case 'abzeichen': { const tx = tausch_cv(256, 256, (x, w) => { x.fillStyle = '#c8b270'; x.fillRect(0, 0, w, w); x.strokeStyle = '#3a2a14'; x.lineWidth = 8; x.beginPath(); x.arc(128, 128, 112, 0, 7); x.stroke(); x.fillStyle = '#7a1a14'; x.beginPath(); x.moveTo(98, 76); x.lineTo(158, 76); x.lineTo(168, 170); x.lineTo(88, 170); x.closePath(); x.fill(); x.fillStyle = '#e8c860'; x.fillRect(112, 100, 12, 14); x.fillRect(134, 100, 12, 14); x.fillStyle = '#2a1a0a'; x.beginPath(); x.arc(129, 140, 11, 0, PI); x.fill(); x.font = 'bold 22px Georgia'; x.textAlign = 'center'; x.fillStyle = '#2a1a0a'; x.fillText('LATERNENFEST', 128, 204); x.fillText('1992', 128, 232); for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(110,50,20,${tausch_rs() * .35})`; x.beginPath(); x.arc(tausch_rs() * w, tausch_rs() * w, 1 + tausch_rs() * 4, 0, 7); x.fill(); } });
      add(new T.CylinderGeometry(.0165, .0165, .0014, 32), [tausch_met(0x8a7a50, .5), new T.MeshStandardMaterial({ map: tx, metalness: .75, roughness: .5 }), tausch_met(0x6a5a3a, .6)], 0, .0008, 0, 0, 1.2); add(new T.CylinderGeometry(.0006, .0006, .018, 6), tausch_met(0x8a8a8a, .5), .006, .0012, .016, 0, 0, PI / 2 - .5); break; } // Nadel abgebrochen: nur Stumpf
    case 'gloeckchen': { const m = tausch_met(0xb88b38, .32); add(new T.SphereGeometry(.0105, 18, 14), m, 0, .0105, 0); add(new T.TorusGeometry(.0042, .0009, 6, 14), m, 0, .0225, 0).rotation.y = .5; add(new T.BoxGeometry(.0185, .0014, .0014), new T.MeshStandardMaterial({ color: 0x1a1208 }), 0, .0072, .0098).rotation.x = .1; add(new T.SphereGeometry(.0036, 10, 8), tausch_met(0x6a4a18, .5), 0, .0034, 0); g.rotation.z = .25; g.rotation.y = .6; break; }
    case 'zinnsoldat': { const m = new T.MeshStandardMaterial({ color: 0x8a8d90, metalness: .85, roughness: .5 }), rest = new T.MeshStandardMaterial({ color: 0x6a2a24, metalness: .2, roughness: .8 }), blau = new T.MeshStandardMaterial({ color: 0x2a3a6a, metalness: .2, roughness: .8 }); const s = new T.Group();
      const part = (geo, mat, x, y, z) => { const q = new T.Mesh(geo, mat); q.position.set(x, y, z); q.castShadow = true; s.add(q); return q; };
      part(new T.CylinderGeometry(.016, .017, .003, 20), m, 0, .0015, 0); part(new T.BoxGeometry(.0065, .026, .0065), blau, -.005, .0165, 0); part(new T.BoxGeometry(.0065, .026, .0065), blau, .005, .0165, 0); // Sockel, Beine
      part(new T.CylinderGeometry(.0105, .0125, .022, 14), rest, 0, .0385, 0); part(new T.SphereGeometry(.0072, 14, 10), m, 0, .0545, 0); part(new T.CylinderGeometry(.0072, .0085, .011, 14), blau, 0, .0615, 0); // Rumpf, Kopf, Tschako
      const tr = part(new T.CylinderGeometry(.0082, .0082, .0065, 18), new T.MeshStandardMaterial({ color: 0x9a8a60, metalness: .8, roughness: .4 }), 0, .04, .012); tr.rotation.x = PI / 2 - .5; part(new T.CylinderGeometry(.0013, .0013, .028, 6), m, .0085, .043, .017).rotation.z = .6; part(new T.CylinderGeometry(.0013, .0013, .028, 6), m, -.0085, .043, .017).rotation.z = -.6; // Trommel, Schlägel
      s.rotation.z = PI / 2; s.rotation.y = .5; s.position.y = .017; g.add(s); break; } // umgefallen, liegt auf der Seite
    case 'reflektor': { const tx = tausch_cv(128, 128, (x, w) => { x.fillStyle = '#e8721a'; x.fillRect(0, 0, w, w); x.strokeStyle = 'rgba(120,40,0,.5)'; x.lineWidth = 2; for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { x.beginPath(); const cx = 8 + i * 14 + (j % 2) * 7, cy = 8 + j * 14; for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; x.lineTo(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7); } x.closePath(); x.stroke(); } });
      add(new T.CylinderGeometry(.0225, .0225, .007, 28), [new T.MeshStandardMaterial({ color: 0x8a3a0a, roughness: .5 }), new T.MeshStandardMaterial({ map: tx, roughness: .15, emissive: 0x401800, emissiveIntensity: .5 }), new T.MeshStandardMaterial({ color: 0x1a1a1a, roughness: .7 })], 0, .0035, 0); add(new T.BoxGeometry(.03, .004, .008), tausch_met(0x8a8d90, .5), .0, .0008, .0262); break; }
    case 'medaillon': { const gold = tausch_met(0xb99a4c, .3); for (const s of [0, 1]) { const m = add(new T.SphereGeometry(.0165, 22, 12, 0, PI * 2, 0, PI / 2), gold, s ? .0 : .0, s ? .0034 : .0016, s ? -.0006 : 0); m.scale.set(.82, .26, 1.12); if (s) m.rotation.x = PI, m.position.y = .0054; else m.position.z = .0; }
      add(new T.TorusGeometry(.0175, .0013, 8, 30), gold, 0, .0034, 0, PI / 2).scale.set(.82, 1.12, 1); add(new T.TorusGeometry(.0034, .0007, 6, 14), gold, 0, .006, -.0205, PI / 2); const kt = []; for (let i = 0; i < 7; i++) { const a = new T.Mesh(new T.TorusGeometry(.0028, .0005, 5, 10), gold); a.position.set(.004 * Math.sin(i * 1.6), .0012, -.0235 - i * .0044); a.rotation.set(i % 2 ? 0 : PI / 2, 0, i % 2 ? PI / 2 : 0); g.add(a); } g.rotation.y = .7; break; }
    case 'plakette': { const tx = tausch_cv(256, 256, (x, w) => { x.fillStyle = '#b4b6b8'; x.fillRect(0, 0, w, w); x.strokeStyle = '#6a6c70'; x.lineWidth = 8; x.beginPath(); x.arc(128, 128, 112, 0, 7); x.stroke(); x.fillStyle = '#6a6c70'; x.beginPath(); x.arc(128, 78, 22, 0, 7); x.fill(); x.fillRect(116, 98, 24, 80); x.fillRect(80, 118, 96, 12); x.beginPath(); x.moveTo(98, 200); x.quadraticCurveTo(128, 168, 158, 200); x.lineWidth = 7; x.stroke(); });
      add(new T.CylinderGeometry(.0165, .0165, .0016, 30), [tausch_met(0x2a2622, .8, .4), new T.MeshStandardMaterial({ map: tx, metalness: .9, roughness: .35 }), tausch_met(0x1c1a18, .9, .3)], 0, .0008, 0, 0, 0); g.children[0].material[2].color.set(0x3a2a20); break; }
    case 'brillenglas': add(new T.CylinderGeometry(.0225, .0225, .0022, 36), [tausch_met(0xaaaeb2, .2, .3), new T.MeshStandardMaterial({ color: 0xe6f0f0, transparent: true, opacity: .32, roughness: .02, envMapIntensity: 2.4 }), new T.MeshStandardMaterial({ color: 0xe6f0f0, transparent: true, opacity: .32, roughness: .02 })], 0, .0013, 0).scale.set(1, 1, .86); break;
    case 'spange': { const m = tausch_met(0xb9bcc0, .3), cur = new T.CatmullRomCurve3([new T.Vector3(-.028, 0, 0), new T.Vector3(-.014, 0, -.0095), new T.Vector3(.014, 0, -.0095), new T.Vector3(.028, 0, 0)]); add(new T.TubeGeometry(cur, 24, .0018, 8), m, 0, .0022, 0);
      const cur2 = new T.CatmullRomCurve3([new T.Vector3(-.028, 0, 0), new T.Vector3(-.014, 0, .0095), new T.Vector3(.014, 0, .0095), new T.Vector3(.028, 0, 0)]); add(new T.TubeGeometry(cur2, 24, .0016, 8), m, 0, .0022, 0);
      for (let i = 0; i < 7; i++) { const x = -.02 + i * .0066, fehlt = i === 2 || i === 4; if (fehlt) add(new T.CylinderGeometry(.0022, .0022, .0012, 8), tausch_met(0x6a6c70, .6), x, .0042, -.0092 + Math.abs(x) * .06); else add(new T.OctahedronGeometry(.0028), new T.MeshStandardMaterial({ color: [0xe8f0ff, 0xffd0e8, 0xd0e8ff][i % 3], roughness: .04, emissive: 0x101018, envMapIntensity: 2.4 }), x, .0058, -.0092 + Math.abs(x) * .06); } g.rotation.y = .4; break; }
    case 'uhrdeckel': { const tx = tausch_cv(256, 256, (x, w) => { x.fillStyle = '#b8bcbe'; x.fillRect(0, 0, w, w); x.strokeStyle = '#7a7e80'; x.lineWidth = 4; for (let r = 108; r > 40; r -= 12) { x.beginPath(); x.arc(128, 128, r, 0, 7); x.stroke(); } x.fillStyle = '#4a4e50'; x.font = 'italic 21px Georgia'; x.textAlign = 'center'; x.fillText('Für treue', 128, 118); x.fillText('Dienste', 128, 142); x.fillText('1958', 128, 168); for (let i = 0; i < 200; i++) { x.fillStyle = `rgba(60,60,60,${tausch_rs() * .3})`; x.beginPath(); x.arc(tausch_rs() * w, tausch_rs() * w, 1 + tausch_rs() * 3, 0, 7); x.fill(); } });
      add(new T.CylinderGeometry(.026, .026, .0055, 36), [tausch_met(0x9a9ea0, .35), new T.MeshStandardMaterial({ map: tx, metalness: .95, roughness: .34 }), tausch_met(0x6a6e70, .5)], 0, .0028, 0, 0, 1.0); add(new T.CylinderGeometry(.0042, .0042, .007, 12), tausch_met(0x9a9ea0, .35), 0, .0035, -.029).rotation.z = PI / 2; break; }
    case 'nadeln': { const m = tausch_met(0xc4c7ca, .3); for (let k = 0; k < 3; k++) { const P0 = new T.Vector3(-.014, 0, 0), pts = [P0, new T.Vector3(.02, 0, 0), new T.Vector3(.0245, 0, .0035), new T.Vector3(.02, 0, .007), new T.Vector3(-.012, 0, .007), new T.Vector3(-.016, 0, .0035), new T.Vector3(-.012, 0, 0)]; const t = add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 30, .0006, 5), m, 0, .0007, k * .016 - .016, 0, k * .15, 0); const sp = add(new T.TorusGeometry(.0032, .0005, 5, 12, PI), m, -.0165 + k * .006, .0012, k * .016 - .0125, PI / 2, 0, 0); } g.rotation.y = .3; break; }
    case 'draht': { const cu = tausch_met(0xb8663a, .32), pts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * PI * 2 * 9, rr = .034 + Math.sin(i * .5) * .0015; pts.push(new T.Vector3(Math.cos(a) * rr, .0035 + (i / 120) * .012 + Math.sin(i * .3) * .001, Math.sin(a) * rr)); } add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 240, .0012, 6), cu, 0, 0, 0); const frei = [new T.Vector3(.034, .016, 0), new T.Vector3(.06, .006, .02), new T.Vector3(.085, .002, .01)]; add(new T.TubeGeometry(new T.CatmullRomCurve3(frei), 14, .0012, 6), cu); break; }
    case 'kugel': { const gm = new T.SphereGeometry(.04, 32, 24), P = gm.attributes.position, v = new T.Vector3(); for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const d = v.clone().normalize().dot(new T.Vector3(.7, .35, .6).normalize()); if (d > .82) v.multiplyScalar(1 - (d - .82) * .55); P.setXYZ(i, v.x, v.y, v.z); } gm.computeVertexNormals();
      add(gm, new T.MeshStandardMaterial({ color: 0xa8121c, roughness: .08, metalness: .35, envMapIntensity: 2.2 }), 0, .04, 0); add(new T.CylinderGeometry(.0105, .0105, .0075, 14), tausch_met(0xc9a640, .3), 0, .0815, 0); add(new T.TorusGeometry(.0034, .0005, 6, 12), tausch_met(0xc9a640, .3), 0, .0885, 0); g.rotation.z = .4; g.position.y = 0; break; }
    case 'dose': { const m = new T.MeshStandardMaterial({ color: 0x8a7a50, metalness: .85, roughness: .55 }), r1 = new T.Mesh(new T.CylinderGeometry(.052, .05, .1, 30, 1, true), new T.MeshStandardMaterial({ map: tausch_cv(256, 128, (x, w, h) => { x.fillStyle = '#7a3a2a'; x.fillRect(0, 0, w, h); x.fillStyle = '#e0d4a8'; x.fillRect(0, 36, w, 48); x.fillStyle = '#4a2a1a'; x.font = 'bold 30px Georgia'; x.fillText('Butterkeks', 30, 72); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(90,40,20,${tausch_rs() * .5})`; x.fillRect(tausch_rs() * w, tausch_rs() * h, 2 + tausch_rs() * 6, 1 + tausch_rs() * 3); } }), metalness: .6, roughness: .6, side: T.DoubleSide })); r1.position.y = .05; r1.castShadow = true; g.add(r1);
      add(new T.CylinderGeometry(.05, .05, .002, 30), m, 0, .001, 0); const r = add(new T.TorusGeometry(.0515, .003, 6, 30), m, 0, .098, 0, PI / 2); add(new T.CylinderGeometry(.0535, .0535, .014, 30, 1, true), m, 0, .104, 0).material.side = T.DoubleSide; break; } // geöffnete Blechdose, Deckel daneben
    default: return null; }
  g.traverse(m => { if (m.isMesh) m.userData.noCol = true; }); g.userData.noCol = true; return g; }

// Träger und Beigaben der Fundorte (Text: Blechdose, Tüte, Lametta an der Tür …); Batterien als echtes Modell
const TAUSCH_TRAEGER = { k1_brunnen: 'dose', k1_huette: 'dose', k1_tanke: 'tuete', k1_hof: 'band' };
async function tausch_propSetzen(F) { const G = F.G; if (!G) return; const T = THREE, pr = new T.Group(); pr.position.set(G.x, G.y + .004, G.z); pr.rotation.y = tausch_rs() * 6.28; pr.userData.noCol = true; scene.add(pr); F.prop = pr; pr.visible = G.on;
  const ware = F.w || []; let dx = 0, dose = null;
  if (TAUSCH_TRAEGER[F.id] === 'dose') { dose = tausch_propBau('dose'); if (dose) { dose.position.set(-.08, 0, -.04); pr.add(dose); } }
  if (TAUSCH_TRAEGER[F.id] === 'tuete') { try { const b = await kirchberg_mod('trashbag', 'model.gltf', .24, 'max'); if (b) { b.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.78, .8, .84); m.material.roughness = .45; } }); b.position.set(-.16, 0, -.08); b.rotation.y = 1.1; b.userData.noCol = true; pr.add(b); } } catch (e) {} }
  for (const w of ware) { const m = tausch_propBau(w); if (!m) continue; if (w === 'lametta') { const hg = F.haengen; if (hg) { m.position.set(...hg.slice(0, 3).map((v, i) => v - [G.x, G.y + .004, G.z][i])); m.rotation.y = hg[3] || 0; pr.rotation.y = 0; pr.add(m); } else { const st = new T.Mesh(new T.CylinderGeometry(.016, .02, .62, 8), new T.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 })); st.position.y = .31; pr.add(st); m.position.set(.0, .56, .03); pr.add(m); } continue; }
    if (dose && w === 'loeffel') { m.position.set(-.08, .1, -.04); m.rotation.set(0, 0, .62); pr.add(m); continue; }
    if (w === 'zinnsoldat' || w === 'reflektor' || w === 'plakette') { m.position.set(dx + .05, 0, .06); pr.add(m); dx += .09; continue; }
    m.position.set(dx, 0, 0); pr.add(m); dx += .09; }
  if (F.bat) { try { const b = await kirchberg_mod('../ue/batterie', 'model.glb', .05, 'max'); if (b) { b.rotation.z = PI / 2; b.rotation.y = tausch_rs() * 3; b.position.set(dose ? .0 : .08, .012, dose ? .08 : -.06); b.userData.noCol = true; b.traverse(m => { m.userData.noCol = true; }); pr.add(b); } } catch (e) {} }
  if (G.glz) { (G.glz.mit || (G.glz.mit = [])).push(pr); const hide = () => { if (G.glz.key) G.glz.key.visible = false; else setTimeout(hide, 600); }; hide(); }
  pr.traverse(m => { if (m.isMesh) { m.userData.noCol = true; m.castShadow = false; } }); tausch_fundeSync(true); }

// ---------------------------------------------------------------- Fundstücke in der Welt: Lichtfunke, blitzt im Lampenkegel auf
function tausch_glintTex() { return tex(cnv(64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,252,240,1)'); g.addColorStop(.12, 'rgba(255,240,205,.9)'); g.addColorStop(.35, 'rgba(255,225,170,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, w); c.strokeStyle = 'rgba(255,250,235,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(w / 2, 3); c.lineTo(w / 2, w - 3); c.moveTo(3, w / 2); c.lineTo(w - 3, w / 2); c.stroke(); }), true); }
function tausch_glint(x, y, z, label, act) { const S = tausch_S;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: S.tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); sp.position.set(x, y + .06, z); sp.scale.setScalar(.16); sp.visible = false; scene.add(sp);
  const hit = box(.55, .35, .55, x, y + .12, z, hidden, { cast: false }); interact(hit, label, act); uninteract(hit); const G = { sp, hit, x, y, z, on: false, ph: Math.random() * 6.28 };
  if (typeof glanz_neu === 'function') { G.glz = glanz_neu({ size: .09, an: () => G.on, boden: true, mit: [sp, hit] }); G.glz.g.position.set(x, y + .012, z); G.glz.g.visible = false; scene.add(G.glz.g); hit.userData.hl = 'glanz'; hit.userData.hlObj = () => G.glz.key; } // R-2: echtes Metallstück, Glitzern, Schein (hervorhebung.js)
  return G; }
function tausch_y(x, z) { const g = solidGround(x, .8, z); return g > -1 ? Math.max(0, g) : 0; }
function tausch_finde(F) { const S = tausch_S; if (S.funde.has(F.id)) return; if (!tausch_platz('glanz', F.w.length)) return tausch_voll('glanz'); if (F.bat && !tausch_platz('batterie', F.bat)) return tausch_voll('batterie'); S.funde.add(F.id); const G = F.G; G.sp.visible = false; uninteract(G.hit); G.on = false; if (F.prop) F.prop.visible = false;
  for (const w of F.w) tausch_gib(w, 1, true); if (F.bat) setTimeout(() => addBattery(F.bat), 700);
  toast(F.t, 4200); questPop('GLÄNZENDES', F.w.map(w => TAUSCH_WAREN[w].n).join(', ')); if (typeof glanz_klang === 'function') glanz_klang(); else Audio.play('keys1', { gain: .16, rate: 1.9, dur: .25 });
  if (!story.lore.some(l => l.key === 'tausch_start')) { story.lore.push({ key: 'tausch_start', title: 'Glänzendes', html: '<span class="hand">Ich sammle jetzt Kronkorken. Für einen Raben. Lucy würde sich totlachen.\n\nAber er nimmt nur, was glänzt – und er gibt dafür, was ich brauche.</span>' }); setTimeout(() => toast('Glänzendes liegt in deinen Taschen (Fibel, INVENTAR). Whiskey tauscht es – sprich ihn an.', 5200), 4600); } }
// Etwas, das Whiskey hinlegt (zurückgelegtes Diebesgut, Deckel, nasse Batterie): gespeichert, bis Luke es aufhebt
function tausch_drop(x, y, z, was, text) { const S = tausch_S; if (y === null || y === undefined) y = tausch_y(x, z); const D = { x, y, z, was, text, k: kap() }; S.drops.push(D); tausch_dropMake(D); }
function tausch_dropMake(D) { const S = tausch_S; const G = tausch_glint(D.x, D.y, D.z, 'Etwas glänzt', () => tausch_dropNimm(D)); D.G = G; interactables.push(G.hit); G.on = true; G.sp.visible = true; S.dropG.push(D); }
function tausch_dropNimm(D) { const S = tausch_S, w = D.was; if (w.ware && !tausch_platz('glanz', 1)) return tausch_voll('glanz'); if (w.bat && !tausch_platz('batterie', w.bat)) return tausch_voll('batterie'); S.drops = S.drops.filter(x => x !== D); S.dropG = S.dropG.filter(x => x !== D); uninteract(D.G.hit); D.G.sp.visible = false; D.G.on = false;
  if (w.ware) tausch_gib(w.ware, 1, true); if (w.item && !story.items.includes(w.item)) story.items.push(w.item); if (w.bat) addBattery(w.bat); toast(D.text || 'Aufgehoben.', 3800); if (typeof glanz_klang === 'function') glanz_klang(); else Audio.play('keys1', { gain: .15, rate: 1.8, dur: .25 }); }
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
  c.globalAlpha = 1; kreideKorn(c, w, w); }), true); } // echtes Korn statt gestanzter Pünktchen
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
    for (const D of S.dropG) { uninteract(D.G.hit); D.G.sp.visible = false; D.G.on = false; } S.dropG = []; S.drops = []; for (const d of v.drops || []) { S.drops.push(d); if (S.ready) tausch_dropMake(d); }
    if (S.ready) { tausch_markenZeigen(); tausch_fundeSync(true); } }]);
// Neues Spiel: in Lukes Taschen der Einkaufswagenchip (alter Schlüsselbund) und ein Kaugummipapier (W-03)
beginGame = (o => function (resume) { const r = o.apply(this, arguments); if (!resume && state.started) { const S = tausch_S; S.tasche = { chip: 1, kaugummipapier: 1 }; S.funde.clear(); S.gekauft = {}; S.log = []; S.oel = 0; S.oelN = 0; S.lampe = ''; S.an = false; S.streich = 0; S.kreide = 0; S.marken = []; S.warmN = 0; S.warmT = 0; S.fernglas = false; S.nass = false;
  for (const D of S.dropG) { uninteract(D.G.hit); D.G.sp.visible = false; D.G.on = false; } S.dropG = []; S.drops = []; if (S.ready) { tausch_markenZeigen(); tausch_fundeSync(true); } } return r; })(beginGame);
// Welche Fundorte gehören ins aktuelle Kapitel (Klickfläche an/aus; nur bei Wechsel)
function tausch_fundeSync(force) { const S = tausch_S, k = kap(); if (!force && S.kSync === k) return; S.kSync = k;
  for (const F of TAUSCH_FUNDE) { const G = F.G; if (!G) continue; const on = k >= F.k[0] && k <= F.k[1] && !S.funde.has(F.id); if (F.prop) F.prop.visible = on; if (on && !G.on) { if (!interactables.includes(G.hit)) interactables.push(G.hit); } else if (!on && G.on) { uninteract(G.hit); G.sp.visible = false; } G.on = on; } }
WORLD_MODS.push(['Tausch', async () => {
  const S = tausch_S; tausch_css(); S.tex = typeof glanz_tex === 'function' ? glanz_tex() : tausch_glintTex(); // R-2: weicher, runder Lichtfunke statt Kreuz
  for (const F of TAUSCH_FUNDE) { const y = tausch_y(F.at[0], F.at[1]); F.G = tausch_glint(F.at[0], y, F.at[1], 'Etwas glänzt', () => tausch_finde(F)); try { tausch_propSetzen(F); } catch (e) { console.warn('Tausch: Fundstück-Modell', F.id, e); } }
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
