// =====================================================================  LWO (Modul „lwo“, Fassung 3 · AP-05 Vertrauen · AP-06 Figuren, Kombi, Sender)
// Quelle: story_final.md „Die Lucid World Organization – Dossier“ (80) §2 Aussehen, §3 Vertrauen/AG-V/Kapitelende/Drohungen, §4 Dialogbänke AG-01…AG-21, §5.6 Funk;
//         Umsetzung AP-05/AP-06, Systeme 5.1. Alle Zeilen wortgleich aus der Bibel (LWO_AG, LWO_V, LWO_ENDE, LWO_DROHUNG, LWO_FUNK).
//
// SCHNITTSTELLE (für die Kapitel-APs; alle Namen mit Präfix lwo_)
//   Vertrauen (verborgen, nie als Zahl sichtbar):  story.lwo = lwo_S = { trust 0–100 (Start 50), seen {}, sender 'none'|'kept'|'thrown', auftrag1, auftrag2 }
//     lwo_trust(delta, key)   einmalig je Schlüssel (key ohne → jedes Mal), geklemmt 0–100; true, wenn verbucht
//     lwo_ereignis(key)       Wert aus LWO_WERT (Tabelle 5.1) verbuchen – Schlüssel und Aufrufer stehen in der Tabelle
//     lwo_stufe()             'hoch' (≥ 70) | 'mittel' (30–69) | 'miserabel' (< 30)
//     lwo_drohung(key)        Drohung ausgesprochen (LWO_DROHUNG) → Folge merken; lwo_drohungOffen(key) fragt ab (Folge innerhalb desselben Kapitels bauen)
//     lwo_kapitelende(kap)    { stufe, hoch|mittel|miserabel-Text } aus LWO_ENDE (3.4) für Abspann/Endkarte (AP-10/AP-14 … AP-24)
//     lwo_vAnker(id, fn)      AG-V mit Ort, den erst ein Kapitel-AP baut (V-04, V-05, V-07, V-08, V-09, V-10, V-11): fn() → true, wenn gespielt
//   Figuren (AP-06): lwo_figur('wolter'|'n11'|'n12'|'b0'…'b6') → Figur { g (Gruppe), zeigen(x,z,ry), weg(), gehe(punkte, tempo), blick(ziel|null), clip(name), lampe(an) … }
//     Wolter 1,80 (Hut nie ab, graue Lederhandschuhe; lwo_hand('bare'|'glove') links ab AG-14), Nachsorge 11 (1,92, dünn, schaut an Luke vorbei),
//     Nachsorge 12 (1,62, breit, kahl, schreibt: Telefon-Pose mit Block), Blechmann (7 Instanzen, stumm, Kettenklirren, Filteratem, Brustlampe).
//     Gesichter (Q-6): Blinzeln über Blendshapes (11 bei t, 12 bei t + 0,7 s – nie gleichzeitig; Wolter eigener Takt), Augen folgen Luke (Augäpfel gedreht,
//     Lider mit), Kopf/Hals drehen weich nach, Atmung im Oberkörper, Mund bei eigener Zeile. Blechmänner sprechen nie (nur Funk aus dem Gerät).
//   Dialog: lwo_szene(id, opts) spielt eine Bank aus LWO_AG an einer übergebenen Stelle (opts.at = { x, z, ry }); Wahl mit Tasten 1–3 (Stil wie Kap. 5).
//     Rückgabe: { wahl: [Indizes], abgebrochen }. Kapitel-eigene Mechanik (Schleichen AG-13, Falle AG-19 …) hängt sich über opts.hook(schritt) ein.
//   Funk: lwo_funk(text, { x, z, ms }) = Kanal 3 (klang_funk: Bandpass, Rauschsperre) + Untertitel „FUNK“.
//   Kombi: lwo_kombi() → { g, zeigen(x,z,ry,{stand, innen, motor}), weg(), fahre(punkte, tempo), fernlicht() } · grauer Kombi mit Magnetschild
//     „Institut für Atmosphärenforschung“ am Heck, Standlicht nur als Leuchtbild/Sprite (kein Licht zur Laufzeit).
//   Sender (02 C3): lwo_senderEinstecken() (AG-09), lwo_senderAnsehen() (Kap. 3, freiwillig → behalten/wegwerfen), lwo_S.sender, Gegenstand ITEMS.sender.
//
// WER RUFT WAS AUF (Tabelle 5.1 → Kapitel-AP; Schlüssel in LWO_WERT). Hier schon angebunden: AG-02 (Kap. 1, spielbar), AG-01 (Kombi an der Sperre bei Lucys Auto),
//   Durchschläge der Akte Abgrund (akte.js ruft lwo_trust(−2, 'akte_' + n)). AG-03 (Kühn, Mailbox) bewegt den Wert nicht (0) – Wortlaut liegt in LWO_AG.
//   Kap. 2 → AP-16 (zimmer7.js Einwilligung, innen_kapitel.js Registratur/Gründungsakte/Kühlregal/Kaffeekasse, AG-05…07 über lwo_szene) ·
//   Kap. 3 → AP-17/18 (AG-08…10, Kombi-Kofferraum, Kassette, Lieferschein, Sender) · Kap. 4 → AP-19/20 (AG-11…14, Nr. 9, DA 10, Auftrag 1, Unzustellbar, Villa) ·
//   Kap. 5 → AP-21/22 (AG-15…17, Brief, Schuppen) · Kap. 6 → AP-23/24 (AG-18…21, Seitenschneider, Funkgerät) · AG-V (Anrufe) → dieses Modul.
// Regeln: keine Lichter zur Laufzeit (ein Scheinwerfer für die Blechmann-Lampe beim Laden mit Intensität 0), keine Allokationen im Takt, Figuren teilen Geometrie.

// ---------------------------------------------------------------- Zustand und Spielstand (Schema AP-03)
const lwo_S = (typeof story !== 'undefined' && story.lwo) || { trust: 50, seen: {}, sender: 'none', auftrag1: null, auftrag2: null };
for (const [k, v] of Object.entries({ trust: 50, seen: {}, sender: 'none', auftrag1: null, auftrag2: null })) if (lwo_S[k] === undefined) lwo_S[k] = v;
story.lwo = lwo_S;
MOD_SAVE.push(['lwo', () => ({ trust: lwo_S.trust, seen: lwo_S.seen, sender: lwo_S.sender, auftrag1: lwo_S.auftrag1, auftrag2: lwo_S.auftrag2 }),
  v => { if (!v || typeof v !== 'object') return; lwo_S.trust = Math.min(100, Math.max(0, Number.isFinite(+v.trust) ? +v.trust : 50)); lwo_S.seen = v.seen && typeof v.seen === 'object' ? v.seen : {};
    lwo_S.sender = ['none', 'kept', 'thrown'].includes(v.sender) ? v.sender : 'none'; lwo_S.auftrag1 = v.auftrag1 ?? null; lwo_S.auftrag2 = v.auftrag2 ?? null; story.lwo = lwo_S; if (typeof lwo_nachLaden === 'function') lwo_nachLaden(); }]);

// ---------------------------------------------------------------- 5.1 / 80 §3.1: Ereignisse (Schlüssel → [Δ, Kapitel, Ereignis, Aufrufer])
const LWO_WERT = {
  ag02_ehrlich: [3, 1, 'AG-02 ehrlich („Brandt. Nummer 1. Ich such meine Schwester.“)', 'lwo.js'], ag02_luege: [-5, 1, 'AG-02 lügen („Nur auf der Durchreise.“)', 'lwo.js'], ag02_gegen: [0, 1, 'AG-02 Gegenfrage', 'lwo.js'],
  akte_1: [-2, 1, 'Durchschlag 1 aufheben', 'akte.js'], akte_2: [-2, 1, 'Durchschlag 2', 'akte.js'], akte_3: [-2, 1, 'Durchschlag 3', 'akte.js'], akte_4: [-2, 1, 'Durchschlag 4', 'akte.js'],
  akte_5: [-2, 3, 'Durchschlag 5', 'akte.js'], akte_6: [-2, 3, 'Durchschlag 6', 'akte.js'], akte_8: [-2, 3, 'Durchschlag 8', 'akte.js'], akte_9: [-2, 6, 'Durchschlag 9', 'akte.js'], akte_10: [-2, 4, 'Durchschlag 10', 'akte.js'],
  zimmer7_einwilligung: [-5, 2, 'Einwilligungen aus Zimmer 7 (Pflicht)', 'AP-16 zimmer7.js'], registratur: [-10, 2, 'Hängeregistratur', 'AP-16 innen_kapitel.js'], gruendungsakte: [-10, 2, 'Gründungsakte 1958', 'AP-16'],
  kuehlregal: [-5, 2, 'Kühlregal (Dosen ∴-1/∴-2)', 'AP-16'], kaffeekasse: [1, 2, 'Ein Euro in die Kaffeekasse', 'AP-16'],
  ag09_tee: [5, 3, 'AG-09 Tee annehmen', 'AP-17 lwo_szene'], ag09_wahr: [3, 3, 'AG-09 Wahrheit über Lucy', 'AP-17'], ag09_luege: [-5, 3, 'AG-09 Lüge über Lucy', 'AP-17'], ag09_hand: [-3, 3, 'AG-09 nach der Hand fragen', 'AP-17'], ag09_kanne: [0, 3, 'AG-09 Thermoskanne mitnehmen', 'AP-17'],
  kombi_kofferraum: [-10, 3, 'Kombi anfassen, Kofferraum (Kap. 3/5)', 'AP-17/AP-21'], kassette_k1: [-3, 3, 'Kassette „Marion · für K-1“', 'AP-18'], lieferschein_ast3: [-5, 3, 'Lieferschein „Außenstelle 3“', 'AP-18'],
  nr9_betreten: [-10, 4, 'Nr. 9 betreten', 'AP-19'], da10: [-5, 4, 'DA 10 mitnehmen', 'AP-19'], auftrag1_echt: [20, 4, 'Auftrag 1: echtes Zählbuch', 'AP-19'], auftrag1_faelschung: [-15, 4, 'Auftrag 1: Fälschung (beim Funk nach dem Archiv)', 'AP-19'],
  auftrag1_ablehnen: [-10, 4, 'Auftrag 1: ablehnen', 'AP-19'], unzustellbar_drohen: [-10, 4, '„Unzustellbar“: Günther drohen', 'AP-20 post.js'], siegel_758: [-3, 4, 'Siegel 7/58 brechen', 'AP-19'],
  subjekt_eisen: [-8, 4, 'Akte „Subjekt EISEN“ mitnehmen', 'AP-19'], bestandsliste: [-5, 4, 'Bestandsliste mitnehmen', 'AP-19'], grete_foto: [-5, 4, 'Grete-Foto (sobald Wolter es vermisst, AG-14)', 'AP-19/20'],
  kuehl_deckel: [-6, 4, 'Kühlraum: Deckel von ∴-1', 'AP-19'], ag13_entdeckt: [-8, 4, 'AG-13 entdeckt', 'AP-19'], ag14_ruhig: [5, 4, 'AG-14 ruhig bleiben', 'AP-19'], ag14_beleidigen: [-5, 4, 'AG-14 beleidigen', 'AP-19'],
  ag14_kanne: [5, 4, 'AG-14 Thermoskanne hinstellen', 'AP-19'], ag14_ring: [0, 4, 'AG-14 Ring wegstecken', 'AP-19'],
  ag15_tee: [2, 5, 'AG-15 Tee', 'AP-21'], ag15_verschwindet: [-2, 5, 'AG-15 „Verschwindet.“', 'AP-21'], ag16_rechnung: [-3, 5, 'AG-16 Steinmetzrechnung', 'AP-21'], ag17_plakat: [-4, 5, 'AG-17 Plakat abreißen', 'AP-21'],
  brief_einwerfen: [-15, 5, 'Brief einwerfen', 'AP-22 post.js'], brief_zurueck: [5, 5, 'Brief Günther zurückgeben', 'AP-22'], brief_behalten: [0, 5, 'Brief behalten', 'AP-22'], schuppen_aufbrechen: [-15, 5, 'Schuppen aufbrechen (Weg c)', 'AP-22'],
  ag18_mit: [10, 6, 'AG-18 mitmachen', 'AP-23'], ag18_ab: [-10, 6, 'AG-18 ablehnen', 'AP-23'], ag18_spaeter: [0, 6, 'AG-18 zusagen, später sabotieren', 'AP-23'], seitenschneider: [-3, 6, 'Seitenschneider', 'AP-23'], heini: [0, 6, 'Polaroid „HEINI“', 'AP-23'],
  ag19_mit: [15, 6, 'AG-19 mitgemacht', 'AP-23'], ag19_sabotage: [-20, 6, 'AG-19 sabotiert (sobald leer zuschnappt)', 'AP-23'], ag19_netz: [-10, 6, 'AG-19 abgelehnt, im Netz', 'AP-23'],
  ag20_kette: [-3, 6, 'AG-20 Kettenrolle', 'AP-23'], ag20_funk: [0, 6, 'AG-20 Funkgerät mitnehmen', 'AP-23'], funk_zurueck: [4, 6, 'Funkgerät am Gitter zurücklegen', 'AP-23'],
  // AG-11 (je Verstoß −4): Schlüssel 'ag11_band_' + n · AG-V: 'agv_auflegen_' + id + '_' + kap (−2) / 'agv_hoeflich_' + id + '_' + kap (+2) – dieses Modul
};
function lwo_trust(delta, key) { delta = +delta || 0; if (key) { if (Object.prototype.hasOwnProperty.call(lwo_S.seen, key)) return false; lwo_S.seen[key] = delta; }
  lwo_S.trust = Math.min(100, Math.max(0, lwo_S.trust + delta)); return true; }
function lwo_ereignis(key) { const e = LWO_WERT[key]; if (!e) { console.warn('LWO: unbekanntes Ereignis', key); return false; } return lwo_trust(e[0], key); }
function lwo_stufe() { return lwo_S.trust >= 70 ? 'hoch' : lwo_S.trust < 30 ? 'miserabel' : 'mittel'; }
function lwo_kap() { return typeof kap === 'function' ? kap() : 1; }

// ---------------------------------------------------------------- 80 §3.5: Drohungen, die nie leer bleiben (Folge im selben Kapitel)
const LWO_DROHUNG = {
  ag02: ['NACHSORGE 11 (AG-02): „Bleiben Sie in der Nähe des Hauses, ne? Nachts läuft man hier nicht weit.“', 'Geht Luke danach zur Südsperre, steht dort der Kombi (AG-01) schon mit laufendem Motor. Er wusste es.'],
  ag09: ['Wolter (AG-09, nur wenn Luke schon Durchschläge hat): „Sie sollten die Umschläge liegen lassen. Papier ist schwer zu tragen.“', 'Der nächste Durchschlag, den Luke findet, liegt nicht mehr da; stattdessen ein Butterbrotpapier: „Abgeholt. (12)“. Der Umschlag taucht in Kap. 4 in der Villa wieder auf, geöffnet.'],
  ag14: ['Wolter (AG-14): „Ihre Schwester ist bei Herrn Vegas. Wir wissen das. Wir sind nur höflich.“', 'Am Abend (Kap. 5) steht der Kombi vor Nr. 3, nicht vor Nr. 1. Vegas ruft an: „Die stehen vor MEINER Tür, Junge.“'],
  ag12: ['11 (AG-12, Ablehnung): „Dann holen wir es uns selbst. Bei Frau Wendt ist ja niemand mehr, ne?“', 'Nr. 7: Hildes Küche durchwühlt, alle Schubladen offen; das Buch steckt in Lukes Jacke, also liegt auf dem Tisch ein Butterbrotpapier: „Nicht da. Dann eben später. (11)“. Die beiden tauchen im Kapitel häufiger auf (Spielplatzzaun, Kombi vor der Tankstelle), in der Villa durchsuchen sie zwei Räume statt einen.'],
  faelschung: ['Funk beim Verlassen des Villa-Archivs (Fälschung entdeckt): „Nachsorge an alle. Das Heft ist falsch. Der Rückläufer hat uns Kassler gegeben.“ Wolter in der Halle (AG-14): „Sie halten uns für dumm. Das ist in Ordnung. Wir halten Sie für gefährlich.“', '−15 wird jetzt verbucht; fällt der Wert unter 30, wird V-07 (umgeparktes Auto) garantiert ausgelöst.'],
  ag18: ['Wolter (AG-18, Ablehnung): „Dann geht der Wald ohne Sie zu. Für alle.“', 'Die Falle am Bus bleibt scharf, niemand sagt Luke, wo der Draht liegt (AG-19: er landet selbst im Netz). Im Abspann ist der Nordzaun mit Ketten verschlossen, daran Wolters Zettel, Schreibmaschine: „Sie hätten helfen können. Das ist bedauerlich. (hw)“'],
  ag19: ['Wolter (AG-19, Sabotage, über Funk): „Sie haben zwei Männer auf dem Gewissen, Herr Brandt. Ich schreibe das auf.“', 'AG-20 zeigt zwei Tote statt einem; der zweite trägt die Dienstmarke „3-4“: der alte Posten, der 1992 die Zellentür aufgemacht hat (02 C6). Pat und Patachon bleiben für Kapitel 7.'],
  v02: ['12 (V-02): „Aggressiv.“', 'Das Handy hat bis zum Kapitelende keinen Empfang mehr (Kap. 3/5); in Kap. 1 liegt am nächsten Fundort ein Butterbrotpapier, auf dem nur Lukes Autokennzeichen steht.'],
};
function lwo_drohung(key) { if (!LWO_DROHUNG[key]) return null; lwo_S.seen['dr:' + key] = lwo_kap(); return LWO_DROHUNG[key][1]; }
function lwo_drohungOffen(key) { const k = lwo_S.seen['dr:' + key], d = lwo_S.seen['drf:' + key]; return k !== undefined && !d; }
function lwo_drohungErfuellt(key) { lwo_S.seen['drf:' + key] = lwo_kap(); }
function lwo_handyTot() { const k = lwo_S.seen['dr:v02']; return k !== undefined && (k === 3 || k === 5) && k === lwo_kap(); } // V-02 „Aggressiv.“: kein Empfang bis Kapitelende

// ---------------------------------------------------------------- 80 §3.4: das eine Detail am Kapitelende (Wortlaut der Kapitel) – Schalter für Abspann/Endkarte
const LWO_ENDE = {
  1: { hoch: 'Im Polaroid-Stapel, den der Kegel herunterweht, liegt ein LWO-Kugelschreiber mit dem Auge („Wir waren hier“).', mittel: null, miserabel: 'Auf der Rückseite der Endkarte, wenn der Spieler die Fibel öffnet, ein Blatt „Dienstplan L. Brandt, Studio, Nachtschicht“, das da nicht hingehört (V-04). Im ersten Durchgang unerreichbar, der Wert startet bei 50.' },
  2: { hoch: null, mittel: null, miserabel: 'Auf der Endkarte unter „03:13.“ eine vierte Zeile in Schreibmaschine: „Protokolliert.“ (Der Klebezettel V-05 kommt schon bei AG-07.)', zeile: { miserabel: 'Protokolliert.' } },
  3: { hoch: 'Im Abspann, Kombi an der Bushaltestelle, Fenster einen Spalt: „Gute Nacht, Luke.“ (Vorname, einmal)', mittel: '„Gute Nacht, Herr Brandt.“', miserabel: '„Gute Nacht, K-3.“ Er merkt es und korrigiert sich nicht. Auf der Endkarte, kleiner, wie ein Stempel: „K-3: nicht geborgen. Noch nicht.“',
    zeile: { hoch: '„Gute Nacht, Luke.“', mittel: '„Gute Nacht, Herr Brandt.“', miserabel: '„Gute Nacht, K-3.“' }, stempel: { miserabel: 'K-3: nicht geborgen. Noch nicht.' } },
  4: { hoch: 'Whiskey hat Wolters Kugelschreiber aufs Kissen gelegt.', mittel: null, miserabel: 'An Lukes Fenster in Nr. 1 klebt von außen Absperrband „GASLECK“; im Abspann steht Nachsorge 12 am Tor und schreibt Lukes Nummernschild ab, obwohl er es längst hat.' },
  5: { hoch: 'Funkfetzen vom Spielplatz: „K-3 geht heim. Nicht eingreifen.“', mittel: null, miserabel: 'Der Kombi steht ohne Licht am Spielplatz; als Luke hinsieht, geht innen kurz die Deckenleuchte an: zwei Gesichter, kauend.', zeile: { hoch: '„K-3 geht heim. Nicht eingreifen.“' } },
  6: { hoch: 'Nachsorge 12 winkt (AG-21) mit einer Stulle in der Hand.', mittel: 'AG-21 wie geplant; er geht rückwärts in den Wald.', miserabel: 'Nachsorge 12 winkt und ruft mit Lukes Stimme: „Freitag frei.“', zeile: { miserabel: '„Freitag frei.“' } },
};
function lwo_kapitelende(k = lwo_kap()) { const s = lwo_stufe(), E = LWO_ENDE[k] || {}; return { kap: k, stufe: s, text: E[s] || null, zeile: E.zeile ? E.zeile[s] || null : null, stempel: E.stempel ? E.stempel[s] || null : null }; }

// ---------------------------------------------------------------- 80 §5.6: Funksprüche (Kanal 3; verzerrt, mit Rauschen) – Anker für alle Kapitel
const LWO_FUNK = {
  2: ['„Bergung zwei an Nachsorge. K-1 nicht im Käfig.“', '„Das ist K-3. Nicht anfassen. Wolter will ihn heil.“'],
  3: ['„Ernte in Position.“', '„Sieben Ketten, sieben Mann. Wir warten auf drei dreizehn.“', '„Kein Kind. Ein Erwachsener. K-3?“ – „Weitergehen.“', '„Die Laternen gehen aus. Wer macht die Laternen aus? … Er macht sie in der falschen Reihenfolge aus. Nein. In der richtigen.“'],
  4: ['„Kreuzung sauber. Polaroids getauscht. Die Katze von der Rieke sitzt wieder da und guckt in die Ecke.“', '„Villa: Nachsorge mit Bergung eins im Haus. Der Vogel ist auch da.“'],
  5: ['„Nummer eins, Küche, Licht an. Nicht von uns. Wir schreiben mit.“', '„Da geht wer aufs Grab zu. Der Steinmetz hat gute Arbeit gemacht, das muss man sagen.“', '„K-3 geht heim. Nicht eingreifen.“'],
  6: ['„Köder bewegt sich nach Norden. Sender aktiv.“', '„Bergung an Nachsorge. Köder in Sichtweite.“', '„Netz eins scharf.“', '„Das geht DURCH das Eisen.“', '„Köder gesichert. Warten auf Kontakt.“', '„Das Signal kommt von HINTEN –“', '„Das ist bedauerlich. Abbruch. Köder bleibt.“', '„Trupp zwei, melden. … Trupp zwei.“'],
  ende6: '„Es hat nie gegen das Licht gewirkt. Das ist bedauerlich.“', // Wolters Stimme, leise, kein Funk mehr, eher zu sich
};

// ---------------------------------------------------------------- 80 §4: Dialog-Bänke AG-01 bis AG-21 (wortgleich)
// Schritt: ['WER', 'Text'] Zeile (WER: N11 N12 W L=Luke spricht LG=Luke denkt F=Funk FW=Wolter über Funk BAND K V J A1 A2) ·
//   { r: 'Regie' } (für den Szenenbauer, wird nicht angezeigt) · { g: 'Gedanke' } · { tu: 'aktion' } (Haken für opts.hook) ·
//   { wahl: [{ t, L (Lüge), key (5.1), dann: [Schritte] }] } · { wenn: 'hoch'|'mittel'|'miserabel'|'durchschlaege'|… , dann: [Schritte] }
// Regeln (80 §4): keine Figur mehr als drei Zeilen ohne Spieleraktion; Lügen markiert (L); je Begegnung genau ein Satz ehrlicher Überzeugung (**fett** → ehrlich: true).
const LWO_AG = {
  'AG-01': { kap: 1, ort: 'Südsperre, neben Lucys Auto', wer: ['kombi'], schritte: [
    { r: 'Kein Dialog. Ablauf: Luke geht auf Lucys Auto zu. Hinter der Betonsperre, im Nebel, ein Motor im Standgas, kein Licht. Ab 20 m: Der Kombi setzt rückwärts, ohne Licht, mit Schwung, und ist weg. Im Matsch: Reifenspuren, ein Kaugummipapier („Lucid Mint“, mit dem Auge).' },
    { tu: 'kombiZurueck' },
    ['L', '„Wer sitzt um Mitternacht an einer gesperrten Straße und macht das Licht aus, wenn jemand kommt? … Ja. Genau so jemand.“'],
    { r: 'Whiskey (wenn schon getauft) stößt einen Laut aus wie einen Motor im Standgas. Er kann das jetzt. Er wird es im schlechtesten Moment wieder tun.' }, { tu: 'whiskeyStandgas' }] },
  'AG-02': { kap: 1, ort: 'Laterne vor Nr. 9', wer: ['n11', 'n12'], schritte: [
    { r: 'Zwei Männer in grauen Mänteln stehen unter der Laterne im Nebel und sehen zu Nr. 7. Der Kurze kaut. Der Lange hebt den Hut.' }, { tu: 'hutheben' },
    ['N11', '„Guten Abend. Schwer, der Nebel heute, ne? Kommt vom Wald her. Kommt immer vom Wald her.“'],
    ['N12', '„Nebel.“', { schreibt: true }],
    ['N11', '„Sind Sie von hier?“'],
    { wahl: [
      { t: '„Brandt. Nummer 1. Ich such meine Schwester.“', key: 'ag02_ehrlich', dann: [['N11', '„Brandt. Ja. Das dachten wir uns.“'], ['N12', '„Sucht Schwester.“', { schreibt: true }], ['N11', '„Hoffentlich findet sie sich, ne. Sie fand sich damals ja auch.“']] },
      { t: '„Nur auf der Durchreise.“', L: true, key: 'ag02_luege', dann: [['N11', '„Auf der Durchreise. Durch Lost Eyengless.“'], ['N12', '„Lügt.“', { schreibt: true, vorlesen: true }], ['N11', '„Er meint das nicht böse. Er schreibt nur auf, was ist.“'], { g: 'Ich hab denen meinen Namen nicht gesagt.', nachher: true }] },
      { t: '„Und Sie? Sind Sie von hier?“', key: 'ag02_gegen', dann: [['N11', '„Wir sind von der Nachsorge.“'], ['N12', '„Elf und zwölf.“'], { tu: 'namen' }, ['N11', '„Er nennt gern die Nummern. Ich finde, das klingt nach Fußball.“'], { g: 'Ich hab denen meinen Namen nicht gesagt.', nachher: true }] }] },
    ['N12', '„Einheimischer. Männlich. Hat Angst.“', { schreibt: true, vorlesen: true }],
    ['L', '„Ich hab keine …“', { ms: 1300 }],
    ['N11', '„Er schreibt nur auf, was ist. Wir sind die, die nachts aufbleiben, damit Sie schlafen können, Herr Brandt. Bleiben Sie in der Nähe des Hauses, ne? Nachts läuft man hier nicht weit.“', { ehrlich: 'Wir sind die, die nachts aufbleiben, damit Sie schlafen können, Herr Brandt.' }],
    { tu: 'drohung:ag02' },
    { r: 'Sie gehen, ohne sich umzudrehen. Der Lange verhakt sich mit dem Schirm am Gartentor von Nr. 9, der Kurze löst es, wortlos, als machten sie das jeden Abend.' }, { tu: 'abgang' },
    { g: 'Elf und zwölf. Die haben Nummern statt Namen. Wie Akten.' }] },
  'AG-03': { kap: 1, ort: 'Lucys Handy · Mailbox', wer: [], schritte: [
    ['K', '„Frau Brandt, Kühn hier, Polizei, ne. Wegen Ihrer Anzeige, äh, wegen Ihrer Mutter und, äh, die Sache mit dem Amt.“'], { r: '(Husten.)' },
    ['K', '„Das ist in Absprache mit den Herren vom Institut eingestellt worden. Da liegt kein Fremdverschulden vor, gell. Rufen Sie nicht mehr an, das … das bringt nichts.“'], { r: '(Pause.)' },
    ['K', '„Und Frau Brandt. Machen Sie die Laterne aus. Die vor Ihrem Haus. Ich weiß, das klingt komisch.“'], { r: 'Klick.' },
    ['L', '„Ein Polizist, der mir sagt, ich soll die Straßenbeleuchtung ausmachen. Und das Institut. Was für ein Institut.“']] },
  'AG-04': { kap: 1, ort: 'Kirchweg-Gasse · Aushang', wer: [], schritte: [
    { r: 'Ein Schaukasten, Glas gesprungen. Text siehe 5.4 (Aushang A).' },
    ['L', '„Bürgersprechstunde. Donnerstags. Von einer Behörde, die seit vierzehn Jahren dicht ist. Und irgendwer hat den Kasten geputzt.“'], { r: 'Pause.' },
    ['L', '„Ahornstraße sieben. Eingang Keller.“'], { r: 'Der Kasten ist innen sauber. Das Datum ist mit Kuli aktualisiert.' }] },
  'AG-05': { kap: 2, ort: 'Lautsprecher im Amt · Wolters Stimme auf Band', wer: [], schritte: [
    ['BAND', '„Guten Tag. Sie befinden sich in der Außenstelle Lost Eyengless der Bundesstelle für Rückführung. Bitte halten Sie Ihre Einwilligung bereit. Begleitpersonen warten im Wartebereich.“'],
    ['BAND', '„Die Nachuntersuchung dauert wenige Minuten. Ihr Kind wird gewogen, gemessen und angehört. Es besteht kein Anlass zur Sorge.“', { pitch: .94 }],
    { tu: 'notstrom' }, ['BAND', '„Notstrom aktiv. Außenstelle Lost Eyengless.“'],
    ['BAND', '„Bitte bringen Sie das Kind barfuß. Bitte bringen Sie das Kind. Bitte bringen Sie … Bruder.“', { pitch: .88, spieluhr: true }],
    ['L', '„Das ist ein Band. Das ist ein Band, das ist eine Schleife, das …“'], ['BAND', '„Ja, Luke.“', { pitch: .8 }],
    { r: 'Spätere Ansagen (verteilt über die Ebene, nach Bedarf): „Zimmer sieben ist heute geschlossen.“ / „Die Kantine bittet um Verständnis.“ / „Wer seine Nummer nicht kennt, wartet bitte, bis er aufgerufen wird. Acht.“' }] },
  'AG-06': { kap: 2, ort: 'Sicherungsraum · Funkgerät', wer: [], schritte: [
    { r: 'Ein Funkgerät auf dem Tisch, Lämpchen an, obwohl kein Strom da ist.' },
    ['F', '„Bergung zwei an Nachsorge. K-1 nicht im Käfig. Wiederhole: K-1 nicht im Käfig. Gitter ist raus.“'],
    ['FW', '„Verstanden. Das ist bedauerlich. Bleiben Sie oben. Er kommt zu dem, der ihn ruft. Und der ist jetzt unten.“'], { r: 'Klick. Luke hört sein eigenes Atmen.' },
    ['L', '„Der, der ihn ruft. Ich hab niemanden gerufen. Ich hab … Onkel Peter?“']] },
  'AG-07': { kap: 2, ort: 'nach der Rauchflucht · hinter den Aktenschränken', wer: ['b0', 'b1'], schritte: [
    { r: 'Zwei Blechmänner, Lampen an, Ketten schleifen, der Vorraum halb voll Rauch. Luke kauert hinter den Schränken. Mechanik (AP-16): Lampe aus, nicht bewegen, Atem anhalten. Todeszeile: „Sie haben dich nicht angefasst. Sie haben nur gewartet, bis jemand kam, der es durfte.“' },
    ['F', '„Bergung zwei. Brand im Gang. K-1 liegt. Verbrannt. Da ist noch jemand hier drin.“'],
    ['F', '„Wissen wir. Das ist K-3. Nicht anfassen. Wolter will ihn heil.“', { von: 'n11' }],
    ['F', '„Ich hab notiert: ‚K-3. Nicht anfassen.‘ Und ‚heil‘. Mit Ausrufezeichen?“', { von: 'n12' }],
    ['F', '„Ohne. Wir sind ein Amt.“', { von: 'n11' }], { tu: 'blechmannNah' },
    ['FW', '„Bergung zwei, die Zeit ist gleich um: Bergen Sie, was von K-1 übrig ist, und gehen Sie.“'], { r: 'Pause.' },
    ['FW', '„Der junge Mann findet den Weg allein, er hat ihn schon einmal gefunden.“', { ehrlich: true }],
    { wenn: 'miserabel', dann: [{ tu: 'blechmannBleibt8s' }, ['F', '„Und wenn er wegläuft: Beine müssen nicht heil sein.“', { von: 'n11' }], { tu: 'v05' }] },
    { wenn: 'hoch', dann: [['F', '„Er ist Gast. Behandeln wie Gast.“', { von: 'n11' }]] },
    { tu: 'abgang' },
    { r: 'Atempause: Vor dem Schrank ein Butterbrotpapier, sauber gefaltet.' }, ['L', '„Die essen hier. Im Rauch. Mit Kapuze. Ich will wissen, wie.“']] },
  'AG-08': { kap: 3, ort: 'Rand des Abgrunds · die Reihe', wer: ['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6'], schritte: [
    { r: 'Kein Dialog. Sieben Blechmänner in einer Reihe am Rand der Senke, Ketten gespannt, Lampen aus. Einer hebt die Hand: die Zahl sieben mit den Fingern. Beobachter raschelt hinter Luke, wagt sich nicht näher.' },
    ['F', '„… Ernte in Position.“', { leise: true }], ['L', '„Ernte. Die nennen es Ernte.“']] },
  'AG-09': { kap: 3, ort: 'Bushaltestelle am Westende · grauer Kombi · Heinrich Wolter (erste Begegnung)', wer: ['wolter', 'kombi'], schritte: [
    { r: 'Der Kombi steht an der Haltestelle, Motor an, Innenlicht an, Scheinwerfer aus, am Heck ein Magnetschild. Ein Mann im grauen Mantel sitzt auf der Bank, Thermoskanne, zwei Blechbecher. Justin bleibt zwanzig Meter zurück im Nebel.' },
    ['W', '„Herr Brandt. Setzen Sie sich einen Moment. Es ist jetzt drei Uhr dreizehn, und das bleibt es noch eine Weile. Tee?“'],
    { wahl: [
      { t: 'Tee nehmen', stumm: true, key: 'ag09_tee', dann: [{ tu: 'tee' }, { tu: 'sender' }, ['W', '„Für den Kreislauf. Man friert leicht in dem Beruf.“'], ['L', '„Was ist das?“'], ['W', '„Lakritz.“']] },
      { t: '„Ich trink nichts von Fremden.“', dann: [['W', '„Wir sind keine Fremden. Wir kennen Sie seit dem fünften August 2009. Sie kennen uns nur noch nicht.“'], { tu: 'sender' }] },
      { t: '„Wer sind Sie?“', dann: [{ tu: 'namenW' }, ['W', '„Wolter. Nachsorge. Heute Nacht bin ich alles, was von der Bundesstelle noch da ist. Und ein wenig vom Institut.“'], { tu: 'sender' }] }] },
    ['W', '„Sie suchen Ihre Schwester. Das ist gut. Das ist richtig. Wo ist sie denn, Ihrer Meinung nach?“'],
    { wahl: [
      { t: '„Ich hab sie noch nicht gefunden.“', key: 'ag09_wahr', dann: [['W', '„Nein. Aber Sie sind nah dran. Näher als die Polizei. Das ist keine Kunst.“']] },
      { t: '„In der Stadt. Sie ist längst in der Stadt.“', L: true, key: 'ag09_luege', dann: [['W', '„Herr Brandt. Ihre Schwester war am dreiundzwanzigsten in Nummer 7. Das wurde gesehen. Lügen Sie mich nicht an, das kostet uns beide Zeit.“']] },
      { t: '„Das wissen Sie doch längst.“', dann: [['W', '„Ja. Aber man hört gern, ob Sie es wissen.“']] }] },
    { wahl: [
      { t: '„Wer ist der Mann in der Rüstung?“', dann: [['W', '„Der Herr ist bei uns aktenkundig. Seit sehr langer Zeit. Er geht jedes Mal mit den Kindern hinein, Herr Brandt, und kommt jedes Mal allein heraus.“'], ['W', '„Ich würde ihm nicht die Hand geben.“']] },
      { t: '„Warum ziehen Sie die Handschuhe nicht aus?“', key: 'ag09_hand', dann: [['W', '„Das ist unhöflich, Herr Brandt.“'], { tu: 'handschuhGlatt' }] },
      { t: 'Nichts fragen.', stumm: true, dann: [] }] },
    ['W', '„Wenn Sie die Laternen ausmachen wollen, machen Sie es wie die Post. Eins, drei, fünf, sieben. Immer der Reihe nach, sonst wird es ungeduldig.“', { luege: true }],
    ['L', '„Und Hilde? Frau Wendt?“'],
    ['W', '„Das ist bedauerlich.“'], { r: '(Pause.)' }, ['W', '„Sie hat siebzehn Jahre gezählt. Man kann nicht ewig zählen.“'],
    { wenn: 'durchschlaege', dann: [['W', '„Sie sollten die Umschläge liegen lassen. Papier ist schwer zu tragen.“'], { tu: 'drohung:ag09' }] },
    { r: 'Whiskey (K3-4, 02 C4): landet auf dem Dach des Kombis.' }, { tu: 'whiskeyKombi' },
    ['W', '„Halten Sie den Vogel bitte von meinem Wagen fern. Er mag mich nicht. Das ist seit langem so.“'], { r: 'Whiskey lässt etwas auf die Windschutzscheibe fallen.' }, ['W', '„… Das ist bedauerlich.“'],
    ['W', '„Ich war sieben, als es meine Schwester genommen hat. Ich habe seitdem jede Nacht wach gelegen, damit es kein anderes nimmt. Sie halten uns für die Bösen. Das ist in Ordnung. Dafür sind wir da.“', { ehrlich: true }],
    { wenn: 'hoch', dann: [['W', '„Wir hätten Sie gern heil, Herr Brandt. Das meine ich, wie ich es sage.“'], { tu: 'kanneStehen' }] },
    { tu: 'einsteigen' }, ['W', '„Wenn Sie hinauswollen, Herr Brandt: Ich fahre gegen sieben. Falls es sieben wird.“'],
    { tu: 'wegfahren' }, { r: 'Auf der Bank bleibt ein Kaugummipapier „Lucid Mint“ mit dem Auge liegen. Whiskey macht das Klack der Blechdose nach.' },
    { r: 'Justin danach: „Den kenne ich. Er stand schon einmal am Rand, mit einem Netz. Dieselbe Kanne.“ – „Das war wann?“ – „Als eure Kutschen noch leiser waren.“' }] },
  'AG-10': { kap: 3, ort: 'Nebel am Ostende · der Blechmann, der ein Ritter ist', wer: ['b0'], schritte: [
    ['L', '„Justin?“'], { tu: 'lampeAn' },
    ['F', '„… kein Kind. Ein Erwachsener. K-3?“'], ['FW', '„Weitergehen.“'], { tu: 'abgang' },
    ['L', '„Nicht Justin. Nur einer, der sich für ihn hält.“'],
    { r: 'Whiskey macht das Kettenschleifen nach. Dann, aus einer ganz anderen Richtung, ein zweites Schleifen, tiefer, Stein auf Stein. Das ist Justin.' },
    ['J', '„Die haben mich gesehen und sich Eisen umgehängt. Sie glauben, es ist dasselbe. Drinnen halten sie so lange, wie ein Mensch die Luft anhält.“']] },
  'AG-11': { kap: 4, ort: 'ganze Ahornstraße · Aufräumkommando', wer: [], schritte: [
    { r: 'Vier Männer in grauen Overalls, ohne Kapuzen, mit Bürsten, Eimern, Absperrband „GASLECK · BETRETEN VERBOTEN“. Sie schrubben die Kreide von der Kreuzung, tauschen die Polaroids gegen leere.' },
    ['A1', '„Bitte hinter dem Band bleiben, der Herr. Gasleck.“'], ['L', '„Gasleck. Ihr habt bei jedem Gasleck Bürsten dabei?“'], ['A1', '„Wir haben bei allem Bürsten dabei.“'],
    ['A2', '„Der ist das. Der von der Liste.“', { leise: true }], ['A1', '„Dann mach die Kreide weg, bevor er sie liest.“'],
    { r: 'Wer unter dem Band durchgeht, wo einer hinsieht: −4 (Schlüssel ag11_band_n) und:' }, { band: ['A1', '„Der Herr. Hinter das Band. Wir schreiben das sonst auf.“'] }] },
  'AG-12': { kap: 4, ort: 'Nr. 3 (Vegas) · Pat und Patachon · Auftrag 1: „Kassler, vier achtzig“', wer: ['n11', 'n12'], schritte: [
    ['N11', '„Herr Vegas. Guten Morgen. Wir sind von der Nachsorge. Es hat einen Stromausfall gegeben.“'],
    ['V', '„Ich hab die Zeitung. Da steht, mir geht’s gut.“'], ['N12', '„Anwohner … Vegas … hat die Zeitung.“', { schreibt: true, vorlesen: true }],
    ['V', '„Hier übernachtet keiner außer dem Hund, und der zählt nicht, der ist gemeldet.“'], ['N12', '„Hund. Gemeldet.“', { schreibt: true }],
    ['N11', '„Herr Brandt. Sie sind das doch. Wir hatten das Vergnügen, unter der Laterne. Sie haben sich gut gehalten heute Nacht.“'],
    ['N12', '„Hat Angst. Steht hier.“', { vorlesen: true }], ['N11', '„Wir würden Sie gern kurz draußen sprechen. Ohne den Hund.“'],
    { r: 'Am Gartentor: 11 hält 12 das Tor auf. Beide richten sich gleichzeitig die Mäntel, blinzeln nie gleichzeitig. 11 beißt in eine Stulle.' }, // Gag-Budget H-1: das Verhaken am Tor nur noch Kap. 1 (Nr. 9) und beim Abgang (S-04)
    ['N11', '„Frau Wendt hat ein Buch geführt. Ein Heft, mit Strichen. Sie wissen, welches. Es liegt bei Ihnen, das wissen wir auch.“'],
    ['N11', '„Wir hätten es gern. Es ist Eigentum der Bundesstelle. Dafür sagen wir Ihnen, in welcher Klinik Ihre Schwester behandelt wird.“'],
    ['N12', '„Schwester. Klinik. Behandelt.“', { vorlesen: true }],
    { wahl: [
      { t: '„Welche Klinik?“', dann: [['N11', '„Das sagen wir, wenn wir das Buch haben. So geht Verwaltung.“']] },
      { t: '„Was wollt ihr mit dem Buch?“', dann: [['N11', '„Frau Wendt hat als Einzige jede Nacht gezählt. Wir müssen wissen, ob es mehr geworden sind. Das ist keine Neugier. Das ist Vorsorge.“', { ehrlich: true }]] },
      { t: '„Sie liegt bei Vegas. Hinter der Tür.“', dann: [['N11', '„Sehen Sie. Und wir wissen das auch. Dann sind wir ja unter uns.“'], ['N12', '„Unter uns.“']] }] },
    { r: 'Entscheidung später (AP-19): Weg 1 echtes Zählbuch (+20), Weg 2 Fälschung Oma Ernas Haushaltsbuch (−15 beim Funk nach dem Archiv), Weg 3 ablehnen (−10). Wortlaut der Wege: LWO_AG12_WEGE.' }] },
  'AG-13': { kap: 4, ort: 'Villa, Obergeschoss, Archiv · Schleichen', wer: ['n11', 'n12', 'b0'], schritte: [
    ['N12', '„Ich häng fest.“', { gedaempft: true }], ['N11', '„Du hängst nicht fest, du bist zu breit.“', { gedaempft: true }],
    { r: 'Mechanik (AP-19): Sichtkegel (Blechmann-Lampe lang und schmal; 11 breit und kurz; 12 nur, was vor seinem Block ist), Verstecke, Atem anhalten.' },
    ['N11', '„Seiler hat alles hier hochgeschleppt. Statt nach unten. Der Mann hat am Ende nicht mehr gewusst, wem er die Treue hält.“'], ['N12', '„Uns.“'],
    ['N11', '„Uns, ja. Wir sind ja auch die, die noch da sind.“'], { r: '(Ein Schrank geht auf, nicht Lukes. Kleiderbügel klappern.)' }, ['N11', '„Der Junge ist hier irgendwo. Er riecht nach Rauch und nach dem Vogel.“'],
    ['N12', '„Wolter will ihn heil.“'],
    ['N11', '„Wolter will ihn heil, ja. Weißt du, was ich glaube? Dass der Junge gar nicht weiß, was er ist. Und dass das das Traurigste an der ganzen Sache ist. Wir tun ihm nichts. Wir holen nur das Kind aus ihm raus, das drinsteckt.“', { ehrlich: true }],
    ['N12', '„Und wenn nichts drinsteckt?“'], ['N11', '„Dann war es eine Falle, und wir haben sie zugemacht. Stullen?“'],
    { r: 'Sie essen im Archiv, zehn Sekunden nur Kauen. Der Blechmann steht in der Tür und atmet durch den Filter.' }, ['N11', '„Weiter. Kühlraum.“'],
    { r: 'Entdeckt (Balken voll): keine Gewalt (−8, ag13_entdeckt):' }, { entdeckt: [['N11', '„Ach, da sind Sie ja.“'], ['N12', '„Gefunden.“', { schreibt: true }]] }] },
  'AG-14': { kap: 4, ort: 'Villa, Halle · Wolter · die Konfrontation', wer: ['wolter'], schritte: [
    { wenn: 'entdeckt', dann: [['W', '„Man hat Sie gefunden. Das ist bedauerlich. Ich hätte Sie lieber selbst kommen sehen.“']] },
    { wenn: 'dunkel', dann: [['W', '„Sie haben das Licht ausgelassen. Das ist rücksichtsvoll. Ich sehe Sie trotzdem.“']] },
    ['W', '„Herr Brandt. Danke fürs Aufschließen. Wir hatten keinen Schlüssel. Seiler war gründlich.“'],
    ['W', '„Sie sind seit dem fünften August 2009 in unserer Obhut. Das ist bedauerlich, aber so ist es.“'],
    { wahl: [
      { t: '„In Ihrer Obhut. Ich hab Sie noch nie gesehen.“', dann: [['W', '„Doch. Auf jedem Foto. Am Rand. Man sieht nur nicht hin.“']] },
      { t: '„Was bin ich?“', dann: [['W', '„Sie sind das, was zurückkam. Ihre Mutter hat es am ersten Morgen gewusst. Sie hat Sie trotzdem behalten. Das war ihr Fehler, und ich habe ihn ihr nie vorgeworfen.“']] },
      { t: 'schweigen', stumm: true, dann: [['W', '„Gut. Dann höre ich mich reden. Das kann ich.“']] }] },
    ['W', '„Da oben ist ein Raubtier. Es nimmt Kinder, weil Kinder leicht zu locken sind. Es gibt uns welche zurück, damit wir aufhören zu suchen.“'],
    ['W', '„Sie sind so eins. Eine Falle mit einem Gesicht.“'],
    { wahl: [
      { t: '„Und wenn Sie sich irren?“', dann: [['W', '„Dann habe ich ein Leben lang wach gelegen für nichts. Das nehme ich in Kauf. Sie nicht?“']] },
      { t: '„Ich bin kein Köder.“', dann: [['W', '„Das würde ein Köder sagen. Das würde auch ein Mensch sagen. Sehen Sie das Problem?“']] },
      { t: '„Meine Mutter ist da hinein, um ihn zu holen. Den echten.“', dann: [['W', '„Ja. Mit einer Laterne. Wir haben zugesehen. Wir sehen immer zu. Das ist das Einzige, was wir können, ohne dass es schlimmer wird.“', { ehrlich: true }]] }] },
    ['W', '„Ich war noch ein Kind, als ich meine Schwester an der Hand hatte. Da drin. Ich habe sie lachen hören. Nicht vor Angst.“'],
    ['W', '„Es lässt sie lachen. Das ist der Trick. Und wenn die Leute das wüssten, Herr Brandt, würden sie ihre Kinder selbst hineintragen. Oder ihre Häuser anzünden. Ich habe beides gesehen.“'],
    ['W', '„Also schreibe ich ‚Gasleck‘. Jemand muss die Liste schreiben. Wollen Sie das machen?“'],
    { wahl: [
      { t: '„Sie haben ein Bett für mich gemacht.“', dann: [['W', '„Ein gutes. Ich habe es selbst ausgesucht.“']] },
      { t: '„Grete.“', nur: 'grete', dann: [{ tu: 'beideAugen' }, ['W', '„Lassen Sie den Namen, wo er ist.“'], { wenn: 'gretefoto', dann: [['W', '„Sie haben etwas aus meiner Dose. Das ist nicht bedauerlich. Das ist unverzeihlich.“'], ['W', '„Es wird zurückgelegt werden.“'], { tu: 'trust:grete_foto' }] }] },
      { t: 'die Thermoskanne hinstellen', nur: 'kanne', stumm: true, key: 'ag14_kanne', dann: [['W', '„Sie haben sie mir aufgehoben.“'], ['W', '„Behalten Sie sie. Sie werden frieren, später.“']] }] },
    { r: 'Das Zählbuch je nach AG-12 (Weg 1/2/3), Wortlaut LWO_AG14_ZAEHLBUCH.' }, { tu: 'zaehlbuch' },
    { wenn: 'miserabel', dann: [['W', '„Sie waren die ganze Nacht mit EISEN unterwegs. Wir haben zugesehen, weil Sie uns wertvoller sind als er. Das sollte Ihnen zu denken geben.“']] },
    ['W', '„Kommen Sie. Ich bringe Sie zu Ihrer Schwester. Wir fahren über die Hauptstraße, das ist schneller.“'], { tu: 'griff' },
    { r: 'Höhepunkt (W-10, Kinosequenz beim Kapitel-4-Autor): Whiskey reißt ihm den Handschuh herunter. Graue, glatte Hand ohne Linien, ohne Nägelmonde, die Finger ein kleines bisschen zu lang.' }, { tu: 'handschuhWeg' },
    ['W', '„Ja. Das kostet es. Ich weiß, was ich bin, Herr Brandt. Wissen Sie es?“'],
    { wahl: [{ t: '„Sie sehen aus wie die da drin.“', dann: [['W', '„Ich weiß.“']] }, { t: 'nichts', stumm: true, dann: [] }] },
    ['W', '„Du hast dich auch nicht verändert.“', { leise: true }], { tu: 'whiskeyHandschuh' },
    ['W', '„Ihre Schwester ist bei Herrn Vegas. Wir wissen das. Wir sind nur höflich.“'], { tu: 'drohung:ag14' },
    ['W', '„Heute nicht. Heute ist Donnerstag, donnerstags haben wir Sprechstunde. Bleiben Sie im Dorf. Freitag früh holen wir Sie ab, dann ist das hier vorbei. Für alle.“'],
    { tu: 'abgang' }, { r: 'Die Thermoskanne bleibt auf dem Buffet. Wer den Tee trinkt: zehn Minuten keine Kälte-Effekte und der Gedanke „Schmeckt nach Zahnarzt. Und nach … nein. Nicht drüber nachdenken.“ Nachsorge 12 winkt durch das Fenster, mit einer Stulle.' },
    { wenn: 'ringWeg', dann: [['W', '„Der Ring von dem Bild. Sie haben ihn. Das ist bedauerlich.“'], { tu: 'trust:ag14_ring' }] }] },
  'AG-15': { kap: 5, ort: 'grauer Kombi vor Nr. 1 · Pat und Patachon', wer: ['n11', 'n12', 'kombi'], schritte: [
    ['N11', '„Wir sind gar nicht da.“'], ['N12', '„Sind wir nicht. Punkt.“', { schreibt: true }], ['N11', '„Leberwurst. Er hat wieder Leberwurst. Ich hab Käse gesagt.“'],
    { wahl: [
      { t: '„Was macht ihr vor meinem Haus?“', dann: [['N11', '„Atmosphärenforschung. Der Nebel, ne.“']] },
      { t: '„Habt ihr Kaffee?“', key: 'ag15_tee', dann: [{ tu: 'becher' }, ['L', '„Danke. Ich glaub.“']] },
      { t: '„Verschwindet.“', key: 'ag15_verschwindet', dann: [['N11', '„Gern. Um Mitternacht. Dann ist es sowieso egal, wo wir stehen.“']] }] },
    ['N11', '„Ihre Küche. Da ist gerade Licht angegangen.“'], ['L', '„Ich weiß.“'],
    ['N12', '„Weiß … er. Licht an. Küche. Nicht von uns.“', { schreibt: true, vorlesen: true }],
    ['N11', '„Wir schreiben das nur auf. Reingehen tun wir nicht. Da drin ist es nicht unsere Aufgabe. Da drin sind Sie es.“', { ehrlich: true }],
    { r: 'Whiskey (K5-2): klopft an die Windschutzscheibe.' }, ['N12', '„Vogel. Schwarz. Beobachtet uns.“', { vorlesen: true }], ['N11', '„Schreib nicht ‚beobachtet‘. Schreib ‚anwesend‘.“'],
    ['WS', '„Das ist bedauerlich.“', { wolterStimme: true }], ['N12', '„Das schreib ich nicht auf.“'],
    { wenn: 'hoch', dann: [['N11', '„Bleiben Sie in der Nähe, ja? Für den Fall.“'], { tu: 'wegfahren' }] },
    { wenn: 'miserabel', dann: [{ r: 'Beim Herauskommen aus Nr. 1 stehen sie links und rechts hinter Luke.' }, ['N12', '„Betreten des Objekts. Verzehr: keiner. Zustand: verweint.“', { vorlesen: true }], ['L', '„Ich hab nicht geweint.“'], ['N12', '„Steht aber hier.“']] }] },
  'AG-16': { kap: 5, ort: 'Friedhof · offenes Grab · Steinmetzrechnung', wer: [], schritte: [
    ['L', '„Ausgehoben vor der Nacht. Rechnung ans Amt. Die haben mein Grab bestellt, bevor ich überhaupt … Schöner Stein. Ehrlich.“'], { r: 'Mitnehmen −3 (ag16_rechnung). Bei miserabel kann V-10 dazukommen.' }] },
  'AG-17': { kap: 5, ort: 'Kirchweg · Vermisstenplakat', wer: [], schritte: [
    ['L', '„Vermisst seit heute. Ich steh hier und les, dass ich weg bin. Die haben sich beeilt.“'], { r: 'Abreißen −4 (ag17_plakat), am Morgen hängt es wieder. Miserabel: zweites Datum mit Kuli. Hoch: halb abgezogen, „bitte melden“.' }] },
  'AG-18': { kap: 6, ort: 'Absperrgitter Nordzaun · Wolter · Auftrag 2: „Köder bleibt“', wer: ['wolter', 'b0', 'kombi'], schritte: [
    ['W', '„Es ist nach zwei, Herr Brandt. Sie sind spät dran. Ich auch. Tee?“'], ['L', '„Sie stehen vor einem Wald mit Verbotsschild und bieten mir Tee an.“'],
    ['W', '„Das Schild wurde von uns aufgestellt. Der Wildschaden ist echt. Er heißt nur anders.“'],
    ['W', '„Da drin läuft seit Jahrzehnten etwas herum, das wir gebaut haben. Ein Amerikaner hat es Wendigo genannt, nach einer Sage. Es wird mit jedem Bissen hungriger.“'],
    { wahl: [{ t: '„Der Hungrige.“', dann: [] }, { t: '„Was frisst es?“', dann: [] }, { t: '„Was hat das mit mir zu tun?“', dann: [] }] },
    ['W', '„Im Dorf sagt man der Hungrige, ja. Es frisst, was das Licht liegen lässt. Und Sie sind das Vollständigste, was das Licht je liegen gelassen hat. Es kommt zu Ihnen. Egal, was Sie tun.“'],
    { wahl: [{ t: '„Sie haben es gebaut?“', dann: [['W', '„Wir haben ihm ein Gesicht gegeben. Gefreiter Hofer hat sich gemeldet, wegen seiner Tochter. Ihm wurde gesagt, es könne ihn zu ihr führen. Das war nicht wahr. Es würde wieder gesagt werden, wenn es das Ding einfängt.“', { ehrlich: true }]] }, { t: 'Nichts fragen.', stumm: true, dann: [] }] },
    ['W', '„Am alten Bus im tiefen Wald steht eine Bergung mit Netzen bereit. Sie gehen dorthin. Wir tun den Rest.“'], ['L', '„Und was hab ich davon?“'],
    ['W', '„Die Wahrheit über den Jungen im Stall. Ein Stück davon. Mehr, als Sie haben.“'],
    { wenn: 'sender:none', dann: [['L', '„Und wie finden Ihre Leute mich da drin?“'], ['W', '„Wir finden Sie, Herr Brandt.“']] },
    { wenn: 'sender:kept', dann: [['W', '„Sie haben unseren kleinen Kasten behalten. Das rechne ich Ihnen an.“'], ['L', '„Ich hab vergessen, dass er da ist.“'], ['W', '„Das tun die meisten.“']] },
    { wenn: 'sender:thrown', dann: [{ tu: 'senderZeigen' }, ['W', '„Der lag im Gully an der Kreuzung. Wir hätten ihn gern wieder in Ihrer Jacke.“']] },
    { wahl: [
      { t: '„Gut. Ich geh.“', key: 'ag18_mit', dann: [['W', '„Das Gehäuse ist Eisen. Das schützt Sie vor dem einen. Vor dem anderen nicht.“'], ['W', '„Der Junge im Stall ist uns seit Jahren bekannt. Wir haben ihn nicht geholt, weil er den Stall nicht verlässt und weil Ihre Mutter bei ihm ist. Sie hat eine Laterne getragen. Das war ihr Wunsch.“']] },
      { t: '„Gut.“ (und später entscheiden)', key: 'ag18_spaeter', dann: [] },
      { t: '„Ich bin kein Köder.“', key: 'ag18_ab', dann: [['W', '„Sie sind es. Mit oder ohne Ihr Einverständnis. Das ist bedauerlich.“'], ['W', '„Dann geht der Wald ohne Sie zu. Für alle.“'], { tu: 'drohung:ag18' }] }] },
    { wenn: 'heini', dann: [['W', '„Ich habe sie gesucht.“', { einzig: true }], ['W', '„Der Junge, der 2009 nicht zurückkam, hat nicht geschrien. Er hat ‚Klar!‘ gesagt. Wir haben es auf Band.“']] },
    { r: 'Whiskey (W-13, K6-1): nimmt den Deckel der Thermoskanne.' },
    ['W', '„Der Vogel steht in unseren Akten, Herr Brandt. Mit Ring. Wir würden ihn gern einmal näher betrachten.“'], ['L', '„Da müssen Sie sich hinten anstellen.“'],
    { r: 'Seitenschneider (−3, seitenschneider): Wolter, ohne sich umzudrehen: „Den bekommen wir zurück, Herr Brandt.“' }] },
  'AG-19': { kap: 6, ort: 'Amtsbus · die Falle', wer: ['b0', 'b1', 'b2', 'b3'], schritte: [
    ['F', '„Bergung an Nachsorge. Köder in Sichtweite.“'], { r: 'Weitere Funkzeilen nach Bedarf: „Köder in Position. Netz eins scharf.“ / „Da ist was. Da ist was Großes.“ / „Das geht durch das Eisen. Das geht einfach DURCH …“' },
    { r: 'Wege (AP-23): mitmachen +15 / sabotieren −20 / abgelehnt −10. Funk und Wolter-Zeilen je Weg: LWO_AG19_WEGE.' }] },
  'AG-20': { kap: 6, ort: 'Weg zur Fraßstelle · der tote Blechmann', wer: ['b0'], schritte: [
    ['L', '„Eisen ist frei. … Nicht vor dem.“'], ['F', '„Trupp zwei, melden. … Trupp zwei.“', { leise: true }],
    { r: 'Merkblatt W: „BfR · Bergung · Merkblatt W / Probe W meidet Lampenlicht über 300 Lumen. Lampe nie senken. / Probe W spricht. Nicht antworten. Es sind nicht Ihre Angehörigen. / Bei Kontakt mit dem Begleitvogel (beringt): Abbruch. Vogel nicht bergen. / Wer hört, dass er beim Namen gerufen wird, meldet sich bei der Nachsorge.“' },
    ['L', '„Nicht antworten. Es sind nicht Ihre Angehörigen. … Wer schreibt so was und geht dann trotzdem hier rein?“']] },
  'AG-21': { kap: 6, ort: 'Abspann/Endkarte · Nachsorge 12', wer: ['n12'], schritte: [
    { r: 'Der Kurze steht am Waldrand, Schiebermütze, Mantel, Stulle in der Hand. Er winkt. Freundlich. Dann dreht sich der Kopf, langsam, weiter, als ein Kopf sich dreht, und der Körper bleibt stehen, die Hand winkt weiter.' }, { tu: 'kopfDrehen' },
    { wenn: 'miserabel', dann: [['LS', '„Freitag frei.“']] },
    { r: 'Ton: bei miserabel Lukes Stimme, sonst nur das Rascheln des Butterbrotpapiers. Beobachter-Zettel danach: „ER FRISST WAS ICH SAMMLE ∴“.' }] },
};
const LWO_AG12_WEGE = {
  echt: [['N12', '„Acht. Acht. Acht. Acht … Neun.“', { vorlesen: true }], { r: '11 legt ihm die Hand auf den Block, nennt eine Klinik zwei Stunden entfernt, samt Zimmernummer.' }],
  faelschung: [['N12', '„Dienstag. Kassler, vier achtzig.“', { vorlesen: true }], ['N11', '„Kassler.“'], ['N12', '„Vier achtzig.“'], ['N11', '„Herr Brandt, Frau Wendt war Vegetarierin.“'], ['N11', '„Wir prüfen das.“'],
    { r: 'Beim Verlassen des Archivs über den Funk des Blechmanns:' }, ['F', '„Nachsorge an alle. Das Heft ist falsch. Der Rückläufer hat uns Kassler gegeben.“'], { tu: 'trust:auftrag1_faelschung' }, { tu: 'drohung:faelschung' }],
  ablehnen: [['L', '„Das Heft gehört Hilde. Und meine Schwester braucht keine Klinik, die braucht Kakao.“'], ['N11', '„Wir sind die, die nachts aufbleiben, damit Sie schlafen können, Herr Brandt. Das vergessen die Leute. Sie werden es auch vergessen.“', { ehrlich: true }],
    ['N12', '„Verweigert. Kakao.“', { schreibt: true, vorlesen: true }], ['N11', '„Dann holen wir es uns selbst. Bei Frau Wendt ist ja niemand mehr, ne?“'], { tu: 'drohung:ag12' }],
  abgang: [['V', '„Das Tor ist geerdet! Ha!“'], ['N12', '„Tor. Widerstand.“', { vorlesen: true }], ['N11', '„Das Tor, Kollege. Nicht der Mann.“'], ['N12', '„Steht beides da.“'], ['V', '„Junge. Was auch immer du denen gegeben hast: Ich hoffe, es war das Kassler.“']],
};
const LWO_AG14_ZAEHLBUCH = {
  echt: [['W', '„‚Immer acht. Zuletzt neun.‘ Danke für das Heft. Frau Wendt konnte gut zählen. Zu gut.“']],
  faelschung: [['W', '„‚Kassler, vier achtzig.‘ Ich habe gelacht, Herr Brandt. Ich lache selten.“'], ['W', '„Sie halten uns für dumm. Das ist in Ordnung. Wir halten Sie für gefährlich.“']],
  ablehnen: [['W', '„‚Zuletzt neun.‘ Frau Wendt hat am Küchenfenster geschrieben, Herr Brandt. Wir hatten eine Kamera gegenüber.“'], ['W', '„Sie war gründlich. Schade um sie.“']],
};
const LWO_AG19_WEGE = {
  mit: [['F', '„Bergung zwei, melden. Bergung zwei.“'], ['FW', '„Das ist bedauerlich. Abbruch. Köder bleibt.“'], ['W', '„Sie haben Wort gehalten. Der Junge im Stall spricht mit niemandem. Außer mit Ihnen. Das haben wir gesehen.“', { handy: true }], ['W', '„Es ist drei.“', { handy: true }]],
  sabotage: [['F', '„Netz eins hängt nicht. Wer hat das Netz … Brandt? BRANDT?“'], ['F', '„Nachsorge, das Signal ist im Wasser.“', { variante: 'weiher' }], ['F', '„… im Wolf.“', { variante: 'wolf' }], ['F', '„Nachsorge, das Signal kommt von hinten. Das Signal kommt von HINTEN –“', { variante: 'wendigo' }],
    ['FW', '„Das ist bedauerlich. Herr Brandt, wenn Sie das hören: Wir wissen jetzt, dass Sie nicht mitspielen. Das wird gespeichert.“'], { tu: 'trust:ag19_sabotage' }, ['FW', '„Sie haben zwei Männer auf dem Gewissen, Herr Brandt. Ich schreibe das auf.“', { spaeter: true }], { tu: 'drohung:ag19' }],
  ablehnen: [['F', '„Köder gesichert. Warten auf Kontakt.“'], { tu: 'trust:ag19_netz' }],
};

// ---------------------------------------------------------------- 80 §3.3: Zufallsbegegnungen AG-V (wortgleich) · stufe 'miserabel' (V-01…V-12) / 'hoch' (V-13…V-16)
const LWO_V = {
  'V-01': { stufe: 'miserabel', kap: [1, 3, 5], ort: 'Ahornstraße, Kirchweg, Landstraße Ost', titel: 'Der Kombi ohne Licht', zeilen: [['L', '„Ich hab Ihre Nummer, ja? … Hab ich nicht. Es ist keine dran.“']] },
  'V-02': { stufe: 'miserabel', kap: [1, 3, 5], ort: 'Tankstelle, Friedhofstor, Bushaltestelle', titel: 'Hinter dir', zeilen: [['N11', '„Nicht erschrecken, Herr Brandt.“'], ['N12', '„Er ist erschrocken.“', { schreibt: true }], ['N11', '„Wir wollten nur sagen: Die Sache mit den Umschlägen. Das ist Behördeneigentum, ne?“'],
    { wahl: [{ t: '„Welche Umschläge?“', dann: [['N11', '„Genau die.“']] }, { t: '„Holt sie euch doch.“', dann: [['N12', '„Aggressiv.“', { vorlesen: true }], { tu: 'drohung:v02' }] }, { t: 'schweigen', stumm: true, dann: [['N11', '„Gut. Schweigen können Sie. Das ist schon mal was.“']] }] }] },
  'V-03': { stufe: 'miserabel', kap: [1, 3, 4, 5, 6], ort: 'überall mit Empfang', titel: 'Der Anruf', zeilen: {
    1: '„Sie sind noch wach, Herr Brandt. Wir auch.“', 3: '„Sie waren am Dienstag um zwei im Studio. Sie sollten schlafen, Herr Brandt.“', 4: '„Sie sind noch wach, Herr Brandt. Wir auch.“',
    5: '„Das Licht in der Küche brennt schon eine Weile. Sie kochen doch gar nicht.“', 6: '„Nördlich vom Zaun haben wir keinen Empfang, Herr Brandt. Sie auch nicht. Nur, damit Sie es wissen.“' } },
  'V-04': { stufe: 'miserabel', kap: [4], ort: 'Briefkasten Nr. 1, Windschutzscheibe von Lukes Auto', titel: 'Der Dienstplan', notiz: ['Ein Zettel, Ausdruck', 'Tonstudio Nordkanal · Schichtplan November · Brandt, L.: Mo–Do Nacht, Fr frei.\n\nHandschriftlich daneben: <span class="hand">„Fr frei. Das passt ja.“</span>'], zeilen: [['L', '„Woher haben die meinen Dienstplan. Woher haben die überhaupt … ach.“']] },
  'V-05': { stufe: 'miserabel', kap: [2], ort: 'Zellentür K-3-Vorbereitung im Amt oder Lukes Versteck nach AG-07', titel: 'Der Klebezettel', notiz: ['Gelber Klebezettel', '<span class="hand">„K-3: nicht anfassen. Freundlich bleiben. (hw)“</span>\n\nDie Tinte ist nicht trocken.'], zeilen: [['L', '„Freundlich. Die haben ‚freundlich‘ auf einen Zettel geschrieben, damit sie’s nicht vergessen.“']] },
  'V-06': { stufe: 'miserabel', kap: [3], ort: 'Nr. 1, Nr. 7, Hof', titel: 'Der Blechmann am Gartentor', zeilen: [['F', '„… Sichtkontakt K-3. Nicht bergen. Wiederhole: nicht bergen. Noch nicht.“']] },
  'V-07': { stufe: 'miserabel', kap: [4], ort: 'Lukes Auto', titel: 'Umgeparkt', notiz: ['Visitenkarte unter dem Scheibenwischer', 'Institut für Atmosphärenforschung · H. Wolter\n\n„Wir haben Ihr Fahrzeug aus der Gefahrenzone (Gasleck) entfernt. Bitte um Verständnis.“'], zeilen: [] },
  'V-08': { stufe: 'miserabel', kap: [4], ort: 'Kirchweg-Gasse, Aushang', titel: 'Die Sprechstunde', notiz: ['Neuer Zettel unter dem Aushang', 'Schreibmaschine:\n\n„Herr Brandt, Sie sind für Donnerstag vorgemerkt. Bitte nüchtern erscheinen.“'], zeilen: [['L', '„Nüchtern. Als hätt ich in dieser Nacht irgendwas geschafft, wovon man nüchtern werden müsste.“']] },
  'V-09': { stufe: 'miserabel', kap: [5], ort: 'Nr. 1, Küche', titel: 'Jemand war in der Küche', notiz: ['Butterbrotpapier, gefaltet', 'Mit Bleistift:\n\n<span class="hand">„Wir haben nichts angefasst. Nur geschaut. Sie haben keine Milch.“</span>'], zeilen: [['L', '„Hatte ich Milch? Ich hatte Milch.“']] },
  'V-10': { stufe: 'miserabel', kap: [5], ort: 'Friedhofstor', titel: 'Blumen', zeilen: [['N11', '„Wir haben schon mal Blumen mitgebracht. Damit es später nicht so eilig wird.“'],
    { wahl: [{ t: '„Für wen?“', dann: [['N11', '„Für die Grabstelle Brandt, L. Wir wissen nur noch nicht, welches L.“']] }, { t: '„Behalten Sie die.“', dann: [['N11', '„Die sind vom Automaten, Herr Brandt. Die nimmt keiner zurück.“']] }] }] },
  'V-11': { stufe: 'pflicht', kap: [6], ort: 'tiefer Wald (Variante A des Senders)', titel: 'Der Köder bewegt sich', zeilen: [['F', '„Köder bewegt sich nach Norden. Sender aktiv.“', { handy: true }], ['L', '„Seit wann. Seit wann ist das da drin.“'], { g: 'Der Tee. Er hat mir die Hand auf die Jacke gelegt.' }] },
  'V-12': { stufe: 'miserabel', kap: [6], ort: 'Wald', titel: 'Die zweite Lampe', zeilen: [] },
  'V-13': { stufe: 'hoch', kap: [1, 3, 4], ort: 'überall', titel: 'Der Gruß', zeilen: [['L', '„Er hat gewunken. Ich werde von einem Amt gegrüßt. Ich weiß nicht, ob das gut ist.“']] },
  'V-14': { stufe: 'hoch', kap: [4], ort: 'Nr. 3 oder Villa-Tor', titel: 'Danke für Ihre Mitarbeit', zeilen: [['N11', '„Herr Brandt. Danke für Ihre Mitarbeit.“'], ['N12', '„Er hat mitgearbeitet.“', { schreibt: true }], ['N11', '„Eine Kleinigkeit.“'], { tu: 'kaugummi' }, ['L', '„Zahnarzt-Geschmack. Passt.“']] },
  'V-15': { stufe: 'hoch', kap: [5], ort: 'Nr. 1, abends', titel: 'Schlafen Sie', zeilen: [['W', '„Herr Brandt. Schlafen Sie ruhig. Wir passen auf das Haus auf.“', { handy: true }], ['W', '„Auf beide.“', { handy: true }]] },
  'V-16': { stufe: 'hoch', kap: [6], ort: 'Zaunlücke oder Hochsitz', titel: 'Die Batterien', zeilen: [['F', '„… Versorgung K-3 erfolgt.“'], ['L', '„Ich bin ein Köder mit Batterieanspruch.“']] },
};

// =====================================================================  FIGUREN (AP-06)
// Modelle aus der Figuren-Werkstatt (tools/forge.html + cast.json; Blechmann: F.buildBlech aus ozk_low.fbx) → game/assets/chars/<id>/model.glb
const LWO_DEF = {
  wolter: { id: 'wolter', speed: .92, stride: 1.34, hunch: .1, seitlich: .8, blinkEigen: true },     // hager, vornübergebeugt, langsam, klein, leise; steht seitlich, sieht mit einem Auge
  n11: { id: 'nachsorge11', sx: .92, speed: 1.28, stride: 1.42, vorbei: true },                        // lang, dünn, lange weiche Schritte; schaut an Luke vorbei
  n12: { id: 'nachsorge12', sx: 1.14, speed: 1.2, stride: 1.08, schreibt: true, kaut: true },          // kurz, breit, kurze schnelle Schritte, leicht wiegend; kaut; schreibt
  b: { id: 'blechmann', speed: .95, stride: 1.3, blech: true },                                         // schwer, gleichmäßig, klirrend, stumm
};
const LWO = { F: {}, ready: false, T: 0, spot: null, spotTgt: null, spotOwner: null, playing: null, kombi: null, pairBlink: 2.5, vNext: 240, vLast: -1e9, vT: 0, trigT: 0,
  vAnker: {}, wahlFin: null, hideQ: [], nachher: [], kapBeginT: 0, ag01: null, v01: null };
const _lv1 = new THREE.Vector3(), _lv2 = new THREE.Vector3(), _lv3 = new THREE.Vector3(), _lq1 = new THREE.Quaternion(), _lq2 = new THREE.Quaternion(), _lq3 = new THREE.Quaternion();
const _lm1 = new THREE.Matrix4(), _lm3 = new THREE.Matrix3(), _le = new THREE.Euler(0, 0, 0, 'YXZ'), _lup = new THREE.Vector3(0, 1, 0), _lrt = new THREE.Vector3();

function lwo_bodenY(x, z) { let g = 0; if (typeof colliders !== 'undefined') for (const c of colliders) if (c.top > g && c.top < .45 && x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) g = c.top;
  try { const s = solidGround(x, .45, z); if (s > g && s < .6) g = s; } catch (e) {} return g; }
function lwo_bone(obj, re) { let b = null; obj.traverse(o => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; }

async function lwo_neueFigur(key, def) {
  if (typeof figuren_load !== 'function') return null;
  const T = await figuren_load(def.id); if (!T) { console.warn('LWO: Modell fehlt', def.id); return null; }
  const sk = await figuren_skc(), obj = sk(T.scene), g = new THREE.Group(); g.name = 'lwo_' + key; g.add(obj); g.visible = false; g.userData.noCol = true; scene.add(g);
  if (def.sx) { obj.scale.x *= def.sx; obj.scale.z *= def.sx; }
  obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
  const mx = new THREE.AnimationMixer(obj), acts = {}; for (const [k, c] of Object.entries(T.clips)) { const a = mx.clipAction(c); a.play(); a.setEffectiveWeight(0); acts[k] = a; }
  if (acts.idle) acts.idle.setEffectiveWeight(1); mx.update(Math.random() * 5);
  const F = { key, def, g, obj, mx, acts, clipK: 'idle', clipW: 0, walkW: 0, path: null, pi: 0, sp: 0, yawV: 0, done: null, blickZiel: null, blick: 'luke', blickW: 0, hy: 0, hp: 0,
    talkUntil: 0, mund: 0, blink: 0, blinkT: 2 + Math.random() * 3, sit: false, lampe: false, phase: 0, gy: 0, gyT: 0, breathT: Math.random() * 9, atemT: 2 + Math.random() * 3, kopfExtra: 0, nick: 0 };
  // Knochen
  F.head = lwo_bone(obj, /^(mixamorig)?:?Head(_\d+)?$|^head$/i); F.neck = lwo_bone(obj, /^(mixamorig)?:?Neck(_\d+)?$|^neck$/i);
  F.spine = lwo_bone(obj, /^(mixamorig)?:?Spine2(_\d+)?$|^spine3$/i) || lwo_bone(obj, /Spine1(_\d+)?$/i); F.spineLow = lwo_bone(obj, /^(mixamorig)?:?Spine(_\d+)?$|^spine2$/i);
  F.handR = lwo_bone(obj, /^(mixamorig)?:?RightHand(_\d+)?$|^wristR$/i);
  F.hips = lwo_bone(obj, /^(mixamorig)?:?Hips(_\d+)?$|^hips$/i); F.sitW = 0; F.seatY = 0; F.vWalk = (T.motion && T.motion.walk && T.motion.walk.speed) || def.stride || 1.2; // P2: Sitzen per Clip, Gehtempo des Mocap-Clips
  // Gesicht (Q-6): Blendshapes (Blinzeln, Lider zur Blickrichtung, Mund), Augäpfel über Shader gedreht
  F.morph = []; F.eyes = null; F.eyeR = { value: new THREE.Matrix3() };
  obj.traverse(o => { if (!o.isMesh || !o.morphTargetDictionary) return; const d = o.morphTargetDictionary; if (d.Eye_Blink_L === undefined && d.V_Open === undefined) return;
    F.morph.push({ m: o, bl: d.Eye_Blink_L, br: d.Eye_Blink_R, lL: [d.Eye_L_Look_L, d.Eye_R_Look_L], lR: [d.Eye_L_Look_R, d.Eye_R_Look_R], up: [d.Eye_L_Look_Up, d.Eye_R_Look_Up], dn: [d.Eye_L_Look_Down, d.Eye_R_Look_Down], open: d.V_Open }); });
  const eyeMeshes = { R: null, L: null }, cornea = []; obj.traverse(o => { if (!o.isSkinnedMesh) return; const n = (o.material && o.material.name) || ''; const m = /Std_Eye_([RL])$/.exec(n); if (m) eyeMeshes[m[1]] = o; else if (/Std_Cornea_[RL]$/.test(n)) cornea.push(o); });
  if (eyeMeshes.R && eyeMeshes.L && F.head) { const cen = {}; for (const s of ['R', 'L']) { const o = eyeMeshes[s]; o.geometry.computeBoundingBox(); cen[s] = o.geometry.boundingBox.getCenter(new THREE.Vector3()); }
    const hi = eyeMeshes.R.skeleton.bones.findIndex(b => b.name === F.head.name);
    const mk = (o, c) => { const src = o.material, m = src.clone(); m.onBeforeCompile = sh => { sh.uniforms.uEC = { value: c }; sh.uniforms.uER = F.eyeR;
        sh.vertexShader = 'uniform vec3 uEC; uniform mat3 uER;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed = uEC + uER * (transformed - uEC);').replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n  objectNormal = uER * objectNormal;'); };
      m.customProgramCacheKey = () => 'lwo_auge'; o.material = m; };
    mk(eyeMeshes.R, cen.R); mk(eyeMeshes.L, cen.L);
    for (const o of cornea) mk(o, /_R$/.test(o.material.name) ? cen.R : cen.L);
    // Augen feucht und glänzend (Hornhaut-Glanz)
    for (const o of cornea) { o.material.roughness = .02; o.material.metalness = 0; o.material.opacity = Math.max(o.material.opacity, .22); o.material.envMapIntensity = 1.6; }
    for (const s of ['R', 'L']) { eyeMeshes[s].material.roughness = .18; }
    F.eyes = { mesh: eyeMeshes.R, hi, mid: cen.R.clone().add(cen.L).multiplyScalar(.5), yaw: 0, pitch: 0, sy: 0, sp: 0, sacT: .5 }; }
  // Wolters Hände: graue Lederhandschuhe (Stoff-Atlas); links ab AG-14 nackt – grau, glatt, ohne Linien (Behaltenen-Haut)
  if (def.id === 'wolter') { F.bare = { value: 0 }; const handL = new Set(); const hb = lwo_bone(obj, /LeftHand(_\d+)?$/i); if (hb) hb.traverse(b => { if (b.isBone) handL.add(b.name); });
    obj.traverse(o => { if (!o.isSkinnedMesh || !o.material || o.material.name !== 'Body') return; const G = o.geometry, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight, a = new Float32Array(SI.count);
      for (let i = 0; i < SI.count; i++) { let w = 0; for (let c = 0; c < 4; c++) if (handL.has(o.skeleton.bones[SI.getComponent(i, c)].name)) w += SW.getComponent(i, c); a[i] = w; }
      G.setAttribute('aBare', new THREE.BufferAttribute(a, 1)); const m = o.material.clone(); m.onBeforeCompile = sh => { sh.uniforms.uBare = F.bare;
        sh.vertexShader = 'attribute float aBare; varying float vBare;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vBare = aBare;');
        sh.fragmentShader = 'uniform float uBare; varying float vBare;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.5, .52, .52), smoothstep(.35, .8, vBare) * uBare);')
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, .38, smoothstep(.35, .8, vBare) * uBare);'); };
      m.customProgramCacheKey = () => 'lwo_hand'; o.material = m; }); }
  // Blechmann: eigene Anzug-Materialien (Brustlampe je Figur), Lichtschein, Kettenrolle hörbar
  if (def.blech) { F.suit = []; obj.traverse(o => { if (o.isMesh && o.material && o.material.name === 'kostum') { o.material = o.material.clone(); o.material.emissiveIntensity = 0; F.suit.push(o.material); } });
    obj.updateMatrixWorld(true); const sp3 = lwo_bone(obj, /^spine3$/) || F.spine; const wp = sp3 ? sp3.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(0, 1.3, 0);
    F.lampLocal = new THREE.Vector3(-.098, wp.y + .088, .17);
    try { lwo_brustLicht(F, obj, g); } catch (e) { console.warn('LWO: Brustlicht', e); } // Q-1: nur das Leuchtbild auf der Brust glüht, nicht der ganze Anzug
    const sm = new THREE.SpriteMaterial({ map: LWO.glareTex, color: 0xdfe8ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }); F.glare = new THREE.Sprite(sm); F.glare.scale.set(.5, .5, 1); F.glare.position.copy(F.lampLocal); F.glare.position.z += .03; g.add(F.glare); }
  // Nachsorge 12: Notizblock an der Schnur (Telefon-Pose mit Block = „Schreiben“)
  if (def.schreibt && F.handR) { try { const b = await msModel('w_buch', 'model.glb'); const blk = msFit(b.clone(true), .15, 'max'); const w = new THREE.Group(); w.add(blk); blk.position.set(0, 0, 0);
      w.position.set(0, .08, .03); w.rotation.set(0, 0, 1.2); const s = 1 / (F.handR.getWorldScale(_lv1).x || 1); w.scale.setScalar(s); F.handR.add(w); w.visible = false; F.block = w; w.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } }); } catch (e) { console.warn('LWO: Block', e); } }
  LWO.F[key] = F; return F;
}
function lwo_figur(k) { return LWO.F[k] || null; }
function lwo_zeigen(F, x, z, ry = 0) { if (!F) return; F.g.position.set(x, lwo_bodenY(x, z), z); F.g.rotation.y = ry; F.g.visible = true; F.path = null; F.sp = 0; F.gyT = 0; }
function lwo_weg(F) { if (!F) return; F.g.visible = false; F.path = null; F.sp = 0; if (F.lampe) lwo_lampe(F, false); if (F.done) { const d = F.done; F.done = null; d(); } }
function lwo_gehe(F, pts, speed) { if (!F) return Promise.resolve(); if (F.done) { const d = F.done; F.done = null; d(); } F.path = pts.map(p => Array.isArray(p) ? new THREE.Vector3(p[0], 0, p[1]) : p); F.pi = 0; F.speedWant = speed || F.def.speed;
  return new Promise(r => { F.done = r; }); }
function lwo_clip(F, k) { if (F && F.acts[k]) F.clipK = k; } // Standbewegung: idle | look | nervous | phone (Schreiben)
function lwo_blick(F, ziel) { if (F) F.blick = ziel; } // 'luke' | Vector3 | null
function lwo_sprich(F, ms) { if (F) F.talkUntil = LWO.T + ms / 1000; }
function lwo_hand(art) { const F = LWO.F.wolter; if (F && F.bare) F.bare.value = art === 'bare' ? 1 : 0; } // Wolter: linker Handschuh ab AG-14 weg
// P2: Figuren mit Mocap-Clip „sit“ sitzen mit laufendem Mischer (Atmen, Gewicht verlagern; Takt setzt das Becken auf seatY). Ohne „sit“: alte Sitzhaltung, Zusatzschicht auf eine feste Grundlage (F.sitQ), sonst summiert sie sich auf.
function lwo_sitzen(F, seatY) { if (!F) return; if (F.acts.sit) { F.sit = true; F.sitW = 1; F.seatY = seatY; F.walkW = 0; return; } if (typeof figuren_seat !== 'function') return; F.g.updateMatrixWorld(true); figuren_seat({ g: F.g, obj: F.obj, mx: F.mx, doll: false, set cur(v) {}, get cur() { return null; } }, seatY); F.sit = true; F.sitProc = true;
  F.sitQ = [F.spineLow, F.spine, F.neck, F.head].filter(Boolean).map(b => [b, b.quaternion.clone()]); }
// Blechmann-Lampe: Leuchtbild auf der Brust (je Figur) + der eine Scheinwerfer (beim Laden angelegt, Intensität 0), immer bei der zuletzt eingeschalteten Lampe; hörbares Klack
// Q-1: Blechmann-Lampe – das Leuchten auf ein Feld um die Brustlampe begrenzen (vorher glühte der ganze Anzug weiß und wirkte im Wald wie ein Geist).
// Je Ecke ein Gewicht (Abstand zur Lampe in der aktuellen Pose, einmal beim Aufbau), der Shader multipliziert das Eigenleuchten damit.
function lwo_brustLicht(F, obj, g) { const L = g.localToWorld(F.lampLocal.clone()), v = new THREE.Vector3(); g.updateMatrixWorld(true);
  obj.traverse(o => { if (!o.isMesh || !F.suit.includes(o.material)) return; const G = o.geometry, n = G.attributes.position.count, a = new Float32Array(n);
    for (let i = 0; i < n; i++) { o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld); const dx = (v.x - L.x), dy = (v.y - L.y) * 1.25, dz = (v.z - L.z), d = Math.hypot(dx, dy, dz); a[i] = 1 - THREE.MathUtils.smoothstep(d, .06, .12); }
    G.setAttribute('aLampe', new THREE.BufferAttribute(a, 1)); const m = o.material; m.onBeforeCompile = sh => {
      sh.vertexShader = 'attribute float aLampe; varying float vLampe;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLampe = aLampe;');
      sh.fragmentShader = 'varying float vLampe;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vLampe * 1.6;'); };
    m.customProgramCacheKey = () => 'lwo_brustlicht'; m.needsUpdate = true; }); }
function lwo_lampe(F, an) { if (!F || !F.def.blech) return; F.lampe = !!an; for (const m of F.suit) m.emissiveIntensity = an ? 3.2 : 0;
  if (typeof Audio !== 'undefined' && Audio.ctx && F.g.visible) Audio.play(an ? 'switch1' : 'switch2', { gain: .5, rate: .8, x: F.g.position.x, y: 1.4, z: F.g.position.z, ref: 2 });
  const S = LWO.spot; if (!S) return;
  if (an) { F.g.add(S); S.position.copy(F.lampLocal); F.g.add(LWO.spotTgt); LWO.spotTgt.position.set(F.lampLocal.x, F.lampLocal.y - .6, 9); S.target = LWO.spotTgt; S.intensity = 55; LWO.spotOwner = F; }
  else if (LWO.spotOwner === F) { S.intensity = 0; LWO.spotOwner = null; } }
// Sichtkegel (für AG-07/AG-13/A-14, AP-16/19): sieht F den Spieler? { weit, winkel (halber Öffnungswinkel), hoehe } – Deckung über Kollisionskörper (2D)
function lwo_sieht(F, { weit = 12, winkel = .45, lampeAus = true } = {}) { if (!F || !F.g.visible) return false; const p = player.pos, g = F.g.position, dx = p.x - g.x, dz = p.z - g.z, d = Math.hypot(dx, dz);
  const w = F.lampe ? weit : weit * (lampeAus ? .45 : 1); if (d > w) return false; const fy = F.g.rotation.y, c = (dx * Math.sin(fy) + dz * Math.cos(fy)) / Math.max(d, 1e-3); if (c < Math.cos(winkel)) return false;
  if (typeof colliders !== 'undefined') for (const k of colliders) { if (k.top < 1 || k.base > 1.6) continue; // Strahl gegen Kasten (Slab-Test in x/z)
    let t0 = 0, t1 = 1; for (const [o, dd, lo, hi] of [[g.x, dx, k.minX, k.maxX], [g.z, dz, k.minZ, k.maxZ]]) { if (Math.abs(dd) < 1e-6) { if (o < lo || o > hi) { t0 = 2; break; } continue; } let a = (lo - o) / dd, b = (hi - o) / dd; if (a > b) { const t = a; a = b; b = t; } t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) break; }
    if (t0 <= t1 && t0 < .98 && t1 > .02) return false; }
  return true; }

// ---------------------------------------------------------------- Takt je Figur (keine Allokationen)
const LWO_STAND = ['idle', 'look', 'nervous', 'phone']; // Standbewegungen (ohne Allokation im Takt)
function lwo_rotW(bone, axis, ang) { if (!bone || !ang) return; bone.parent.getWorldQuaternion(_lq1); _lq2.setFromAxisAngle(axis, ang); _lq3.copy(_lq1).invert().multiply(_lq2).multiply(_lq1); bone.quaternion.premultiply(_lq3); }
function lwo_figTick(F, dt) {
  const g = F.g, def = F.def, t = LWO.T, cam = camera.position;
  // Fortbewegung: Beschleunigen, weich drehen, Schrittlänge passt zur Geschwindigkeit (kein Gleiten)
  let want = 0;
  if (F.path && F.pi < F.path.length) { const p = F.path[F.pi], dx = p.x - g.position.x, dz = p.z - g.position.z, d = Math.hypot(dx, dz);
    if (d < .3) { F.pi++; if (F.pi >= F.path.length) { F.path = null; if (F.done) { const r = F.done; F.done = null; r(); } } }
    else { const yw = Math.atan2(dx, dz); let dy = yw - g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      F.yawV += (Math.sign(dy) * Math.min(Math.abs(dy) * 3, 2.4) - F.yawV) * Math.min(1, dt * 6); g.rotation.y += F.yawV * dt;
      want = (F.speedWant || def.speed) * Math.max(.25, 1 - Math.abs(dy) / 1.6) * Math.min(1, d / 1.1 + .35); } }
  else F.yawV *= Math.max(0, 1 - dt * 5);
  F.sp += Math.sign(want - F.sp) * Math.min(Math.abs(want - F.sp), dt * (want > F.sp ? 1.6 : 2.4));
  if (F.sp > .01) { g.position.x += Math.sin(g.rotation.y) * F.sp * dt; g.position.z += Math.cos(g.rotation.y) * F.sp * dt; if ((F.gyT -= dt) < 0) { F.gyT = .3; F.gy = lwo_bodenY(g.position.x, g.position.z); } g.position.y += (F.gy - g.position.y) * Math.min(1, dt * 8); }
  // Bewegungsgewichte: Gehen ↔ Stehbewegung (Überblendung), Gehtempo aus der Geschwindigkeit
  // P2: Gewichte immer mit Summe 1 (sonst mischt three.js die Bindepose hinein → verdrehte Glieder beim Anhalten); Sitzen = Mocap-Clip „sit“ (Mischer läuft weiter, nichts summiert sich auf);
  // Schrittlänge aus dem Tempo des Mocap-Geh-Clips (F.vWalk, m/s) statt des alten Werts def.stride → kein Gleiten
  if (!F.sitProc) { const A = F.acts, sitT = F.sit && A.sit ? 1 : 0; F.sitW += (sitT - F.sitW) * Math.min(1, dt * 2.5); if (Math.abs(sitT - F.sitW) < .01) F.sitW = sitT;
    const ww = F.sit ? 0 : Math.min(1, F.sp / (def.speed * .45)); F.walkW += (ww - F.walkW) * Math.min(1, dt * 5);
    if (A.walk) { A.walk.setEffectiveWeight(F.walkW * (1 - F.sitW)); A.walk.timeScale = Math.max(.35, Math.min(1.7, F.sp / F.vWalk)) * (F.walkW > .02 ? 1 : 0); }
    if (A.sit) A.sit.setEffectiveWeight(F.sitW);
    let sum = 0; for (const k of LWO_STAND) { const a = A[k]; if (!a) continue; const tw = k === F.clipK ? 1 : 0, cw = a.getEffectiveWeight(); const nw = cw + (tw - cw) * Math.min(1, dt * 3); a.setEffectiveWeight(nw); sum += nw; }
    const rest = (1 - F.walkW) * (1 - F.sitW); if (sum > 1e-4) { for (const k of LWO_STAND) { const a = A[k]; if (a) a.setEffectiveWeight(a.getEffectiveWeight() / sum * rest); } } else if (A.idle) A.idle.setEffectiveWeight(rest);
    if (F.block) F.block.visible = F.clipK === 'phone' && F.walkW < .5;
    F.mx.update(dt);
    if (F.hips && (F.sitW > 0 || F.obj.position.y !== 0)) { F.hips.updateWorldMatrix(true, false); F.hips.getWorldPosition(_lv1); F.obj.position.y = F.sitW > 0 ? F.sitW * (F.seatY + .08 - (_lv1.y - F.obj.position.y)) : 0; } } // Becken auf die Sitzfläche
  else if (!F.sit) { F.sitProc = false; F.obj.position.y = 0; for (const k in F.acts) F.acts[k].play(); } // prozedural gesessen (Figur ohne „sit“): Mischer wieder an
  // (Weltmatrizen: getWorldQuaternion/updateWorldMatrix aktualisieren nur die Kette, die gebraucht wird – kein zweiter Durchlauf über die ganze Figur)
  // Atmung, Haltung (Wolter vornübergebeugt), Blechmann schwerer Oberkörper
  _lrt.set(Math.cos(g.rotation.y), 0, -Math.sin(g.rotation.y));
  const br = Math.sin((t + F.breathT) * 2 * Math.PI / (def.blech ? 4.6 : 4.1)) * (def.blech ? .016 : .012);
  if (F.sitProc && F.sitQ) for (const [b, q] of F.sitQ) b.quaternion.copy(q); // prozedurales Sitzen: Mischer steht → feste Grundlage, sonst dreht sich der Rumpf Bild für Bild weiter
  lwo_rotW(F.spineLow, _lrt, br * .6 + (def.hunch || 0) * .5); lwo_rotW(F.spine, _lrt, -br + (def.hunch || 0) * .5);
  // Blick: Kopf/Hals drehen weich zum Ziel (Luke = Kamera), N11 schaut am Spieler vorbei auf das Haus dahinter, Wolter steht seitlich
  let tx = 0, ty = 0, tz = 0, has = false;
  if (F.blick === 'luke') { tx = cam.x; ty = cam.y; tz = cam.z; has = true;
    if (def.vorbei) { const dx = cam.x - g.position.x, dz = cam.z - g.position.z, d = Math.hypot(dx, dz) || 1; tx += dx / d * 7 - dz / d * 2.2; tz += dz / d * 7 + dx / d * 2.2; ty += 1.4; } }
  else if (F.blick && F.blick.isVector3) { tx = F.blick.x; ty = F.blick.y; tz = F.blick.z; has = true; }
  let hy = 0, hp = 0;
  if (has && F.head) { F.head.getWorldPosition(_lv1); const dx = tx - _lv1.x, dz = tz - _lv1.z, dh = Math.hypot(dx, dz);
    let a = Math.atan2(dx, dz) - g.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(a) < 2) { hy = Math.max(-1.05, Math.min(1.05, a)) * (def.seitlich ? .55 : 1); hp = Math.max(-.35, Math.min(.3, Math.atan2(ty - _lv1.y, dh))); } }
  F.hy += (hy - F.hy) * Math.min(1, dt * 2.6); F.hp += (hp - F.hp) * Math.min(1, dt * 2.6);
  const nick = F.nick > 0 ? Math.sin(F.nick * Math.PI) * .22 : 0; if (F.nick > 0) F.nick = Math.max(0, F.nick - dt * 1.4);
  lwo_rotW(F.neck, _lup, F.hy * .4); lwo_rotW(F.head, _lup, F.hy * .6 + F.kopfExtra); _lrt.set(Math.cos(g.rotation.y + F.hy), 0, -Math.sin(g.rotation.y + F.hy));
  lwo_rotW(F.neck, _lrt, -F.hp * .4); lwo_rotW(F.head, _lrt, -F.hp * .6 - (def.hunch || 0) * .75 + nick + Math.sin(t * .7 + F.breathT) * .015);
  // Augen: folgen dem Ziel (Sakkaden), Lider mit; Blinzeln; Mund bei eigener Zeile
  if (F.eyes && F.head) { const E = F.eyes; F.head.updateWorldMatrix(true, false); const sk = E.mesh.skeleton;
    _lm1.multiplyMatrices(F.head.matrixWorld, sk.boneInverses[E.hi]).multiply(E.mesh.bindMatrix); _lv2.copy(E.mid).applyMatrix4(_lm1);
    let ey = 0, ep = 0; if (has) { _lv3.set(tx - _lv2.x, ty - _lv2.y, tz - _lv2.z); _lm3.setFromMatrix4(_lm1).invert(); _lv3.applyMatrix3(_lm3).normalize(); ey = Math.atan2(_lv3.x, _lv3.z); ep = Math.asin(Math.max(-1, Math.min(1, _lv3.y))); if (Math.abs(ey) > 1.2) { ey = 0; ep = 0; } }
    if ((E.sacT -= dt) < 0) { E.sacT = .35 + Math.random() * 1.6; E.sy = (Math.random() - .5) * .07; E.sp = (Math.random() - .5) * .05; }
    ey = Math.max(-.42, Math.min(.42, ey + E.sy)); ep = Math.max(-.28, Math.min(.25, ep + E.sp));
    E.yaw += (ey - E.yaw) * Math.min(1, dt * 16); E.pitch += (ep - E.pitch) * Math.min(1, dt * 16);
    _le.set(-E.pitch, E.yaw, 0, 'YXZ'); _lm1.makeRotationFromEuler(_le); F.eyeR.value.setFromMatrix4(_lm1); }
  if (!def.blinkEigen && (F.key === 'n11' || F.key === 'n12')) { // Pat und Patachon: 11 bei t, 12 bei t + 0,7 s – nie gleichzeitig
    if (F.key === 'n11' && LWO.pairNow) F.blink = 1e-3; if (F.key === 'n12' && LWO.pairLate) F.blink = 1e-3; }
  else if ((F.blinkT -= dt) < 0) { F.blinkT = 2 + Math.random() * 4; F.blink = 1e-3; }
  let bw = 0; if (F.blink > 0) { F.blink += dt; const b = F.blink; bw = b < .075 ? b / .075 : b < .19 ? 1 - (b - .075) / .115 : 0; if (b >= .19) F.blink = 0; }
  const talk = t < F.talkUntil; F.mund += ((talk ? .12 + .3 * Math.max(0, Math.sin(t * 13.7) * Math.sin(t * 5.3 + 1)) : def.kaut ? .07 * Math.max(0, Math.sin(t * 7.5)) : 0) - F.mund) * Math.min(1, dt * 14);
  for (const M of F.morph) { const I = M.m.morphTargetInfluences; if (!I) continue; if (M.bl !== undefined) { I[M.bl] = bw; I[M.br] = bw; }
    if (F.eyes) { const y = F.eyes.yaw / .42, p = F.eyes.pitch / .25; for (let k = 0; k < 2; k++) { if (M.lL[k] !== undefined) I[M.lL[k]] = Math.max(0, y) * .55; if (M.lR[k] !== undefined) I[M.lR[k]] = Math.max(0, -y) * .55; if (M.up[k] !== undefined) I[M.up[k]] = Math.max(0, p) * .5; if (M.dn[k] !== undefined) I[M.dn[k]] = Math.max(0, -p) * .5; } }
    if (M.open !== undefined) I[M.open] = F.mund; }
  // Blechmann: Schritte schwer, Geflecht klirrt bei jedem Schritt; im Stehen Atem durch den Filter; Lampenschein zur Kamera
  if (def.blech && typeof Audio !== 'undefined' && Audio.ctx) { const dx = cam.x - g.position.x, dz = cam.z - g.position.z, d = Math.hypot(dx, dz);
    if (F.acts.walk && F.walkW > .3 && d < 40) { const ph = (F.acts.walk.time / F.acts.walk.getClip().duration) % 1, st = ph < .5 ? 0 : 1; if (st !== F.phase) { F.phase = st;
        Audio.stepAt(g.position.x, g.position.z, .55); Audio.play(Math.random() < .5 ? 'keys2' : 'keys3', { gain: .1, rate: .5 + Math.random() * .08, hp: 700, x: g.position.x, y: .9, z: g.position.z, ref: 2 }); } }
    else if (F.walkW < .1 && d < 9 && (F.atemT -= dt) < 0) { F.atemT = 4.2 + Math.random() * .8; lwo_filterAtem(g.position.x, 1.6, g.position.z); }
    if (F.glare) { const f = (dx * Math.sin(g.rotation.y) + dz * Math.cos(g.rotation.y)) / Math.max(d, 1e-3); F.glare.material.opacity = F.lampe ? Math.max(0, f) * .9 : 0; F.glare.visible = F.lampe; } }
}
// Filteratem (zwei Kartuschen): gefiltertes Rauschen, Ein- und Ausatmen, langsam
function lwo_filterAtem(x, y, z) { const A = Audio, c = A.ctx; if (!c) return; const d = A.at(x, y, z, 1.6); if (A.cut) return; const t = c.currentTime;
  for (const [t0, len, f, v] of [[0, 1.5, 1100, .07], [1.9, 1.8, 700, .09]]) { const n = A.noise(false), bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 1.8; const g = c.createGain(); g.gain.setValueAtTime(0, t + t0); g.gain.linearRampToValueAtTime(v, t + t0 + len * .4); g.gain.linearRampToValueAtTime(0, t + t0 + len);
    n.connect(bp); bp.connect(g); g.connect(d); n.stop(t + t0 + len + .1); } }

// =====================================================================  KOMBI (grau, Magnetschild, kein Kennzeichen – „Es ist keine dran.“)
function lwo_tex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
// Das Zeichen: Kreis, offenes Auge über einer kleinen Flamme (akte_auge aus akte.js, sonst eigene Zeichnung)
function lwo_auge(c, x, y, r, col) { if (typeof akte_auge === 'function') return akte_auge(c, x, y, r, col); c.save(); c.strokeStyle = c.fillStyle = col; c.lineWidth = Math.max(1.5, r * .12); c.beginPath(); c.arc(x, y, r * 1.35, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(x - r, y); c.quadraticCurveTo(x, y - r * .8, x + r, y); c.quadraticCurveTo(x, y + r * .8, x - r, y); c.stroke(); c.beginPath(); c.arc(x, y, r * .3, 0, 7); c.fill(); c.restore(); }
function lwo_texMagnet() { return lwo_tex(512, 160, (c, w, h) => { c.fillStyle = '#e9e7e0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#27466b'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); lwo_auge(c, 70, 82, 30, '#27466b');
  c.fillStyle = '#27466b'; c.font = 'bold 34px Arial'; c.fillText('Institut für', 128, 66); c.fillText('Atmosphärenforschung', 128, 108); c.font = '18px Arial'; c.fillText('Messstelle Kirchberg', 130, 138);
  for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${Math.random() < .5 ? '80,70,50' : '255,255,255'},${Math.random() * .12})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } c.fillStyle = 'rgba(60,50,40,.25)'; c.fillRect(0, h - 22, w, 22); }); }
function lwo_texKaugummi() { return lwo_tex(192, 128, (c, w, h) => { c.fillStyle = '#d7dfda'; c.fillRect(0, 0, w, h); c.fillStyle = '#6fa39a'; c.fillRect(0, 0, w, 30); c.fillRect(0, h - 22, w, 22); c.fillStyle = '#123'; c.font = 'bold 24px Arial'; c.fillText('Lucid Mint', 28, 72);
  lwo_auge(c, 160, 90, 12, '#1d2e3a'); c.strokeStyle = 'rgba(40,30,20,.5)'; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(Math.random() * w, Math.random() * h); c.lineTo(Math.random() * w, Math.random() * h); c.stroke(); }
  c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(60,45,25,.35)'; c.beginPath(); c.ellipse(60, 100, 70, 30, .3, 0, 7); c.fill(); }); }
function lwo_texButterbrot() { return lwo_tex(256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(236,230,210,.93)'; c.beginPath(); c.moveTo(20, 40); c.lineTo(220, 20); c.lineTo(240, 200); c.lineTo(40, 236); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(150,140,110,.55)'; c.lineWidth = 2; for (let i = 0; i < 14; i++) { c.beginPath(); c.moveTo(20 + Math.random() * 200, 30 + Math.random() * 190); c.lineTo(20 + Math.random() * 200, 30 + Math.random() * 190); c.stroke(); }
  c.fillStyle = 'rgba(190,150,90,.35)'; c.beginPath(); c.ellipse(120, 120, 60, 36, .4, 0, 7); c.fill(); lwo_auge(c, 196, 190, 11, 'rgba(40,50,60,.8)'); }); }
function lwo_texReifen() { return lwo_tex(128, 512, (c, w, h) => { c.clearRect(0, 0, w, h); for (let y = 0; y < h; y += 10) { c.fillStyle = `rgba(20,16,12,${.35 + Math.random() * .25})`; c.fillRect(18, y, 34, 6); c.fillRect(76, y + 4, 34, 6); } }); }
function lwo_decal(tx, w, h, x, y, z, ry = 0, flach = true) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tx, transparent: true, alphaTest: .05, roughness: .95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
  m.position.set(x, y, z); if (flach) { m.rotation.x = -Math.PI / 2; m.rotation.z = ry; } else m.rotation.y = ry; m.receiveShadow = true; m.userData.noCol = true; scene.add(m); return m; }
function lwo_glowTex() { return lwo_tex(128, 128, (c, w) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(255,250,235,.6)'); g.addColorStop(.5, 'rgba(255,240,210,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }); }
async function lwo_kombiLaden() {
  const src = await msFBX('car_amsedan', 'Car.fbx', { Car_base_color: { b: 'Car_color.jpg', color: 0x6d7072, rough: .5, metal: .45 }, Car_detail: { b: 'Car_details.jpg', rough: .8, metal: .1 },
    Glass: { color: 0x0a0d10, rough: .06, metal: .7, transparent: true }, Car_number: { color: 0x3a3a38, rough: .9 }, Car_LightForward: { color: 0xcfcfc8, rough: .15, emissive: 0xfff0d6 }, Car_stopLight: { color: 0x4a0606, rough: .25, emissive: 0x7a0a04 },
    Car_backLight: { color: 0x220505, rough: .25, emissive: 0x6a0804 }, Car_Turnlight_L: { color: 0x5a3208, rough: .3 }, Car_Turnlight_R: { color: 0x5a3208, rough: .3 }, '*': { color: 0x1c1c1c, rough: .7 } });
  const lf = [], stop = []; src.traverse(m => { if (!m.isMesh) return; m.castShadow = true; m.receiveShadow = true; const mats = [].concat(m.material).map(mt => { const c = mt.clone(); if (c.name === 'Glass') c.opacity = .86; if (c.name === 'Car_LightForward') { c.emissiveIntensity = 0; lf.push(c); } if (c.name === 'Car_stopLight' || c.name === 'Car_backLight') { c.emissiveIntensity = 0; stop.push(c); } return c; }); m.material = Array.isArray(m.material) ? mats : mats[0]; });
  src.scale.setScalar(4.7 / 212.53); const inner = msGround(src), g = new THREE.Group(); g.add(inner); g.visible = false; g.name = 'lwo_kombi'; scene.add(g); g.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(inner), K = { g, lf, stop, bb, sp: 0, path: null, pi: 0, rueck: false, motor: null, pan: null, stand: false, fern: 0, done: null };
  // Leuchtbilder: Standlicht vorn (zwei kleine + Dunst), Rücklicht, Deckenleuchte innen (nur Sprites, kein Licht)
  const glow = (x, y, z, s, col, op) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: LWO.glareTex, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op })); sp.position.set(x, y, z); sp.scale.set(s, s, 1); sp.visible = false; g.add(sp); return sp; };
  const fz = bb.max.z - .12, rz = bb.min.z + .1, hw = (bb.max.x - bb.min.x) / 2 - .28;
  K.vorn = [glow(-hw, .72, fz, .32, 0xfff2da, .9), glow(hw, .72, fz, .32, 0xfff2da, .9), glow(0, .75, fz + .5, 2.4, 0xfff0d8, .12)];
  K.hinten = [glow(-hw, .82, rz - .16, .2, 0xff2a10, .75), glow(hw, .82, rz - .16, .2, 0xff2a10, .75)];
  K.fernS = glow(0, .75, fz + .3, 7, 0xfff4e4, 0); K.innen = glow(0, 1.35, (bb.max.z + bb.min.z) / 2 - .1, .9, 0xffe2b0, .35);
  // Magnetschild „Institut für Atmosphärenforschung“ am Heck
  const ms = new THREE.Mesh(new THREE.PlaneGeometry(.62, .2), new THREE.MeshStandardMaterial({ map: lwo_texMagnet(), roughness: .6, metalness: .1, polygonOffset: true, polygonOffsetFactor: -2 })); ms.position.set(0, .98, rz - .02); ms.rotation.y = Math.PI; g.add(ms); K.schild = ms;
  LWO.kombi = K; return K; }
function lwo_kombi() { return LWO.kombi; }
// Transporter vor der Telefonzelle (strasse.js, „Transporter ohne Aufschrift“): Magnetschild am Heck, abnehmbar, schief angesetzt
function lwo_magnetschild(g, heck = -1) { g.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(g), sx = bb.max.x - bb.min.x, sz = bb.max.z - bb.min.z;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.66, .21), new THREE.MeshStandardMaterial({ map: lwo_texMagnet(), roughness: .6, metalness: .1, polygonOffset: true, polygonOffsetFactor: -2 }));
  if (sx > sz) { m.position.set(heck < 0 ? bb.min.x - .012 : bb.max.x + .012, bb.min.y + 1.02, (bb.min.z + bb.max.z) / 2 + .3); m.rotation.y = heck < 0 ? -Math.PI / 2 : Math.PI / 2; }
  else { m.position.set((bb.min.x + bb.max.x) / 2 + .3, bb.min.y + 1.02, heck < 0 ? bb.min.z - .012 : bb.max.z + .012); m.rotation.y = heck < 0 ? Math.PI : 0; }
  m.rotation.z = .025; m.userData.noCol = true; scene.add(m); return m; }
function lwo_kombiZeigen(x, z, ry, { stand = false, innen = false, motor = false, hinten = false } = {}) { const K = LWO.kombi; if (!K) return null; LWO.ag01Aktiv = false; K.g.position.set(x, 0, z); K.g.rotation.y = ry; K.g.visible = true; K.path = null; K.sp = 0;
  lwo_kombiLicht({ stand, innen, hinten }); lwo_kombiMotor(motor); return K; }
function lwo_kombiLicht({ stand = false, innen = false, hinten = stand } = {}) { const K = LWO.kombi; if (!K) return; K.stand = stand; for (const s of K.vorn) s.visible = stand; for (const s of K.hinten) s.visible = hinten; K.innen.visible = innen;
  for (const m of K.lf) m.emissiveIntensity = stand ? 1.6 : 0; for (const m of K.stop) m.emissiveIntensity = hinten ? 1.2 : 0; }
function lwo_kombiMotor(an) { const K = LWO.kombi; if (!K || typeof Audio === 'undefined' || !Audio.ctx) return; if (an && !K.motor) { K.pan = Audio.at(K.g.position.x, .6, K.g.position.z, 3, { obj: K.g, h: .6, dauer: 1e9 }); if (Audio.cut) { K.pan = null; return; } K.motor = Audio.loop('carEngine', { gain: .32, rate: .62, lp: 700, dest: K.pan }); }
  else if (!an && K.motor) { K.motor.stop(.8); K.motor = null; K.pan = null; } }
function lwo_kombiWeg() { const K = LWO.kombi; if (!K) return; K.g.visible = false; lwo_kombiMotor(false); K.path = null; if (K.done) { const d = K.done; K.done = null; d(); } }
function lwo_kombiFahre(pts, speed = 3, rueck = false) { const K = LWO.kombi; if (!K) return Promise.resolve(); K.path = pts.map(p => new THREE.Vector3(p[0], 0, p[1])); K.pi = 0; K.vmax = speed; K.rueck = rueck; return new Promise(r => { K.done = r; }); }
function lwo_kombiFernlicht() { const K = LWO.kombi; if (!K) return; K.fern = 1.2; if (Audio.ctx) Audio.play('switch1', { gain: .25, rate: .6, x: K.g.position.x, y: .8, z: K.g.position.z, ref: 3 }); }
function lwo_kombiTick(dt) { const K = LWO.kombi; if (!K || !K.g.visible) return; const g = K.g;
  if (K.path && K.pi < K.path.length) { const p = K.path[K.pi], dx = p.x - g.position.x, dz = p.z - g.position.z, d = Math.hypot(dx, dz);
    if (d < .5) { K.pi++; if (K.pi >= K.path.length) { K.path = null; if (K.done) { const r = K.done; K.done = null; r(); } } }
    else { const want = Math.min(K.vmax, d * 1.2 + .5); K.sp += Math.sign(want - K.sp) * Math.min(Math.abs(want - K.sp), dt * 3); let yw = Math.atan2(dx, dz) + (K.rueck ? Math.PI : 0), dy = yw - g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); g.rotation.y += dy * Math.min(1, dt * 1.5);
      const s = K.rueck ? -K.sp : K.sp; g.position.x += Math.sin(g.rotation.y) * s * dt; g.position.z += Math.cos(g.rotation.y) * s * dt; } }
  else K.sp = Math.max(0, K.sp - dt * 4);
  if (K.motor) K.motor.src.playbackRate.value = .62 + Math.min(.5, K.sp * .07);
  if (K.fern > 0) { K.fern = Math.max(0, K.fern - dt); K.fernS.visible = true; K.fernS.material.opacity = Math.min(1, K.fern * 2) * .95; for (const m of K.lf) m.emissiveIntensity = 6; } else if (K.fernS.visible) { K.fernS.visible = false; for (const m of K.lf) m.emissiveIntensity = K.stand ? 1.6 : 0; } }

// =====================================================================  DIALOG (Untertitel mit Sprecher, drei Antworten ohne Mauszeiger – Stil wie die Auswahl in Kap. 5)
{ const css = document.createElement('style');
  css.textContent = `#lwoWahl { position: absolute; left: 6%; bottom: 24%; display: none; flex-direction: column; gap: 7px; min-width: 340px; max-width: 64vw; z-index: 6; }
  #lwoWahl.on { display: flex; } #lwoWahl div { font: 18px/1.35 "Cormorant Garamond", Georgia, serif; color: #e9dfc8; text-shadow: 0 0 3px #000, 0 0 12px #000; padding: 5px 14px; background: linear-gradient(90deg, rgba(8,7,6,.62), rgba(8,7,6,.12)); border-left: 1px solid rgba(201,163,106,.55); cursor: pointer; pointer-events: auto; }
  #lwoWahl div:hover { color: #fff4dc; border-left-color: #c9a36a; } #lwoWahl b { display: inline-block; width: 22px; color: #c9a36a; font: 700 14px Georgia; }`;
  document.head.appendChild(css); const w = document.createElement('div'); w.id = 'lwoWahl'; (document.getElementById('hud') || document.body).appendChild(w); LWO.wahlEl = w; }
const LWO_WER = { N11: 'n11', N12: 'n12', W: 'wolter' };
function lwo_label(c) { const k = lwo_kap();
  switch (c) { case 'N11': return lwo_S.seen.namen || k >= 2 ? 'NACHSORGE 11' : 'DER LANGE'; case 'N12': return lwo_S.seen.namen || k >= 2 ? 'NACHSORGE 12' : 'DER KURZE';
    case 'W': return lwo_S.seen.namenW || k >= 4 ? 'WOLTER' : 'DER MANN IM MANTEL'; case 'F': case 'FW': return 'FUNK'; case 'BAND': return 'LAUTSPRECHER'; case 'K': return 'KÜHN'; case 'L': return 'DU'; case 'LG': return 'LUKE';
    case 'V': return 'VEGAS'; case 'J': return 'JUSTIN'; case 'A1': case 'A2': return 'ARBEITER'; case 'WS': return 'WHISKEY'; case 'LS': return ''; default: return c; } }
function lwo_ms(text, ms) { return Math.max(ms || 0, 1300 + text.length * 52); }
async function lwo_zeile(code, text, opt = {}, o = {}) {
  const ms = lwo_ms(text, opt.ms), F = (o.figuren && o.figuren[code]) || LWO.F[LWO_WER[code]];
  if (F && F.g.visible) { lwo_sprich(F, ms * .92); if (opt.schreibt || opt.vorlesen) lwo_clip(F, 'phone'); }
  if (code === 'F' || code === 'FW' || code === 'BAND' || opt.handy || code === 'K') { const at = o.funkAt || (o.figuren && o.figuren.funk) || null; lwo_funkKlang(ms / 1000, at, code === 'BAND' ? 'band' : opt.handy || code === 'K' ? 'handy' : 'funk'); }
  subtitle(text, ms + 250, lwo_label(code)); await wait(ms);
  if (F && opt.schreibt && !opt.vorlesen) setTimeout(() => lwo_clip(F, F.def.schreibt ? 'phone' : 'idle'), 400); }
function lwo_funkKlang(sec, at, art) { if (typeof klang_funk === 'function') return klang_funk(sec, { x: at ? at.x : undefined, z: at ? at.z : undefined, art });
  if (typeof Audio !== 'undefined' && Audio.ctx) Audio.play('static', { gain: .08, dur: Math.min(sec, 3), hp: 400, ...(at ? { x: at.x, y: 1.3, z: at.z, ref: 2.2 } : {}) }); }
function lwo_funk(text, { x, z, ms } = {}) { return lwo_zeile('F', text, { ms }, { funkAt: x !== undefined ? { x, z } : null }); }
// Antwort wählen: Tasten 1 … n (oder Klick). Abbruch (−1), wenn o.abbruch() wahr wird (z. B. Luke geht weg)
function lwo_wahl(opts, o = {}) {
  const el = LWO.wahlEl; el.innerHTML = opts.map((t, i) => `<div data-i="${i}"><b>${i + 1}</b>${typeof trX === 'function' ? trX(t) : t}</div>`).join(''); el.classList.add('on');
  return new Promise(res => { let done = false;
    const fin = v => { if (done) return; done = true; el.classList.remove('on'); el.innerHTML = ''; removeEventListener('keydown', key, true); clearInterval(iv); LWO.wahlFin = null; res(v); };
    const key = e => { const m = /^(Digit|Numpad)([1-9])$/.exec(e.code); if (!m) return; const i = +m[2] - 1; if (i < opts.length) { e.preventDefault(); e.stopImmediatePropagation(); fin(i); } };
    el.onclick = e => { const d = e.target.closest('[data-i]'); if (d) fin(+d.dataset.i); };
    addEventListener('keydown', key, true); LWO.wahlFin = fin;
    const iv = setInterval(() => { if (o.abbruch && o.abbruch()) fin(-1); }, 150); }); }
function lwo_bed(b, o) { const s = lwo_stufe();
  if (b === 'hoch' || b === 'mittel' || b === 'miserabel') return s === b;
  if (b === 'durchschlaege') return typeof akte_n === 'function' ? akte_n() > 0 : Object.keys(lwo_S.seen).some(k => /^akte_/.test(k));
  if (b.startsWith('sender:')) return lwo_S.sender === b.slice(7);
  return !!(o.bed && o.bed(b)); }
async function lwo_tu(name, o, res) {
  if (o.hook) { const r = await o.hook(name, res); if (r === true) return; }
  if (name.startsWith('drohung:')) lwo_drohung(name.slice(8)); else if (name.startsWith('trust:')) lwo_ereignis(name.slice(6));
  else if (name === 'namen') lwo_S.seen.namen = 1; else if (name === 'namenW') lwo_S.seen.namenW = 1; else if (name === 'sender') lwo_senderEinstecken(); }
async function lwo_schritte(list, o, res) {
  for (const s of list) { if (res.abgebrochen) return;
    if (Array.isArray(s)) { await lwo_zeile(s[0], s[1], s[2] || {}, o); if (o.abbruch && o.abbruch()) { res.abgebrochen = true; return; } }
    else if (s.wahl) { const opts = s.wahl.filter(w => !w.nur || lwo_bed(w.nur, o)); if (!opts.length) continue; const i = await lwo_wahl(opts.map(w => w.t), o);
      if (i < 0) { res.abgebrochen = true; return; } const w = opts[i]; res.wahl.push(s.wahl.indexOf(w)); if (!w.stumm) await lwo_zeile('L', w.t, {}, o); if (w.key) lwo_ereignis(w.key); await lwo_schritte(w.dann || [], o, res); }
    else if (s.wenn) { if (lwo_bed(s.wenn, o)) await lwo_schritte(s.dann, o, res); }
    else if (s.tu) await lwo_tu(s.tu, o, res);
    else if (s.g) { if (s.nachher) res.nachher.push(s.g); else { const ms = lwo_ms(s.g); subtitle(s.g, ms + 250, 'LUKE'); await wait(ms); } }
    else if (s.r && o.hook) await o.hook({ r: s.r }, res); } }
// Eine AG-Szene an einer übergebenen Stelle abspielen. opts: { at: {x,z,ry}, figuren: { N11: Figur, … , funk: {x,z} }, radius (Abbruch, wenn Luke weiter weg geht), hook(tu, res), bed(name) }
async function lwo_szene(id, opts = {}) {
  const A = LWO_AG[id]; if (!A || LWO.playing) return null;
  const res = { id, wahl: [], abgebrochen: false, nachher: [] }, o = Object.assign({}, opts);
  if (o.at && o.radius) { const c = o.at; o.abbruch = () => Math.hypot(player.pos.x - c.x, player.pos.z - c.z) > o.radius; }
  LWO.playing = id; state.talking = true;
  try { await lwo_schritte(A.schritte, o, res); } catch (e) { console.error('LWO-Szene ' + id, e); }
  finally { state.talking = false; LWO.playing = null; if (LWO.wahlFin) LWO.wahlFin(-1); }
  lwo_S.seen['ag:' + id] = lwo_kap();
  for (const g of res.nachher) { const ms = lwo_ms(g); subtitle(g, ms + 250, 'LUKE'); await wait(ms + 300); }
  return res; }

// =====================================================================  AG-02 · Kap. 1 · „Sind Sie von hier?“ – Laterne vor Nr. 9 (komplett spielbar)
const LWO_AG02 = { lx: 40, lz: -6.3, n11: [41.15, -5.45], n12: [39.85, -5.05], blickNr7: new THREE.Vector3(22, 1.6, -17), papier: [41.5, -5.95], tor: [47.4, -7.6], osten: [[44, -5.6], [47.1, -6.9], [55, -5.7], [66, -5.5], [80, -5.3]] };
function lwo_ag02Bereit() { return lwo_kap() === 1 && !lwo_S.seen['ag:AG-02'] && !(typeof ch2 !== 'undefined' && ch2.on) && !state.cellarOpen; }
function lwo_ag02Aufbau() { const a = LWO.F.n11, b = LWO.F.n12; if (!a || !b) return;
  const y2n7 = (x, z) => Math.atan2(LWO_AG02.blickNr7.x - x, LWO_AG02.blickNr7.z - z);
  if (lwo_ag02Bereit()) { lwo_zeigen(a, ...LWO_AG02.n11, y2n7(...LWO_AG02.n11)); lwo_zeigen(b, ...LWO_AG02.n12, y2n7(...LWO_AG02.n12) + .25); lwo_blick(a, LWO_AG02.blickNr7); lwo_blick(b, null); lwo_clip(a, 'idle'); lwo_clip(b, 'phone'); }
  else { if (!LWO.praesenz) { lwo_weg(a); lwo_weg(b); } } }
async function lwo_ag02() {
  const a = LWO.F.n11, b = LWO.F.n12; if (!a || !b || LWO.playing) return;
  lwo_blick(a, 'luke'); lwo_blick(b, 'luke'); lwo_clip(b, 'phone');
  // zu Luke drehen (weich, kein Schnappen): kleine Wendung auf der Stelle
  const face = F => { const dx = player.pos.x - F.g.position.x, dz = player.pos.z - F.g.position.z; F.g.userData.zielYaw = Math.atan2(dx, dz); };
  face(a); face(b); LWO.drehen = [a, b];
  const res = await lwo_szene('AG-02', { at: { x: LWO_AG02.lx, z: LWO_AG02.lz }, radius: 17, figuren: { N11: a, N12: b },
    hook: async (tu) => { if (tu === 'hutheben') { a.nick = 1; return true; } if (tu === 'abgang') { lwo_ag02Abgang(); return true; } return false; } });
  LWO.drehen = null;
  if (res && res.abgebrochen) { // Luke geht einfach weiter: sie sehen ihm nach, 11 ruft den einen Satz hinterher, dann gehen sie
    await wait(600); subtitle('„Nachts läuft man hier nicht weit.“', 2800, lwo_label('N11')); lwo_sprich(a, 2400); lwo_drohung('ag02'); await wait(2600); lwo_ag02Abgang(); }
  if (typeof saveGame === 'function') setTimeout(() => { if (!state.talking) saveGame(1); }, 1500); // Speicherpunkt danach
  if (typeof katzen_baerbelPapier === 'function') katzen_baerbelPapier(LWO_AG02.papier[0], LWO_AG02.papier[1]); // Schmunzler (AP-09): BÄRBEL leckt das Butterbrotpapier ab
}
async function lwo_ag02Abgang() { const a = LWO.F.n11, b = LWO.F.n12; if (!a || !b) return;
  lwo_blick(a, null); lwo_blick(b, null); lwo_clip(b, 'idle');
  // nebeneinander, gleicher Schritt, Richtung Osten; der Lange verhakt sich mit dem Schirm am Gartentor von Nr. 9, der Kurze löst es wortlos
  const pa = LWO_AG02.osten.map(p => [p[0], p[1] - .5]), pb = LWO_AG02.osten.map(p => [p[0] - .4, p[1] + .45]);
  const ga = lwo_gehe(a, pa.slice(0, 2), 1.15), gb = lwo_gehe(b, pb.slice(0, 2), 1.15); await Promise.all([ga, gb]);
  lwo_clip(a, 'nervous'); a.kopfExtra = -.5; await wait(700); lwo_clip(b, 'look'); lwo_blick(b, new THREE.Vector3(LWO_AG02.tor[0], .9, LWO_AG02.tor[1] - .3)); await wait(1500);
  if (typeof Audio !== 'undefined' && Audio.ctx) Audio.play('metalHit1', { gain: .12, rate: 1.6, x: LWO_AG02.tor[0], y: .9, z: LWO_AG02.tor[1], ref: 2 });
  a.kopfExtra = 0; lwo_clip(a, 'idle'); lwo_clip(b, 'idle'); lwo_blick(b, null); await wait(500);
  await Promise.all([lwo_gehe(a, pa.slice(2), 1.2), lwo_gehe(b, pb.slice(2), 1.2)]);
  LWO.hideQ.push(a, b); }

// =====================================================================  AG-01 · Kombi an der Sperre bei Lucys Auto (kein Dialog; Kaugummipapier im Matsch)
const LWO_AG01 = { kombi: [1.6, -58.5, 0], papier: [.9, -48.2], zurueck: [[1.6, -70], [1.8, -95]] };
function lwo_ag01Bereit() { return lwo_kap() === 1 && !lwo_S.seen['ag:AG-01'] && LWO.kombi; }
async function lwo_ag01() { const K = LWO.kombi; if (!K || LWO.playing) return; LWO.playing = 'AG-01';
  try { if (lwo_drohungOffen('ag02')) lwo_drohungErfuellt('ag02'); // er wusste es: der Motor läuft schon
    await lwo_kombiFahre(LWO_AG01.zurueck, 9, true); lwo_kombiWeg();
    if (LWO.ag01Papier) LWO.ag01Papier.visible = true; if (LWO.ag01Reifen) LWO.ag01Reifen.visible = true;
    await wait(900); } catch (e) { console.warn('LWO AG-01', e); } finally { LWO.playing = null; }
  lwo_S.seen['ag:AG-01'] = 1; await lwo_zeile('L', '„Wer sitzt um Mitternacht an einer gesperrten Straße und macht das Licht aus, wenn jemand kommt? … Ja. Genau so jemand.“');
  if (typeof whiskey_mimic === 'function') try { whiskey_mimic('standgas'); } catch (e) {} } // W: „Er kann das jetzt“ (AP-08)

// =====================================================================  SENDER (02 C3): Wolter steckt ihn bei AG-09 in die Innentasche; Kap. 3 nur fühlbar; Kap. 6 Variante A/B/C
function lwo_senderItem() { try { ITEMS.sender = { name: 'Grauer Kasten', desc: lwo_S.sender === 'thrown' ? 'Weggeworfen. In den Gully an der Kreuzung.' :
  'Kleiner als eine Streichholzschachtel, ein Gehäuse aus Eisen mit dem Auge. Warm. ' + (lwo_kap() >= 6 ? 'An der Kante blinkt eine winzige rote Lampe.' : 'Er war in der Innentasche. Wo vorher der Schokoriegel war.') }; return true; } catch (e) { return false; } }
function lwo_senderEinstecken() { lwo_S.seen.senderIn = lwo_kap(); }
async function lwo_senderAnsehen() { if (!lwo_S.seen.senderIn || lwo_S.sender !== 'none') return lwo_S.sender; lwo_senderItem();
  openNote('In der Innentasche', 'Ein kleiner grauer Kasten aus Eisen, kleiner als eine Streichholzschachtel. Auf dem Deckel: ein Kreis, ein offenes Auge über einer Flamme. Er ist warm.\n\n<span class="hand">Der Tee. Er hat mir die Hand auf die Jacke gelegt.</span>', 'lwo_sender');
  while (ui.overlay) await wait(200);
  const i = await lwo_wahl(['Behalten.', 'In den Gully werfen.']); lwo_S.sender = i === 1 ? 'thrown' : 'kept'; lwo_senderItem();
  if (lwo_S.sender === 'kept' && typeof addItem === 'function') addItem('sender'); return lwo_S.sender; }
function lwo_senderVariante() { return lwo_S.sender === 'none' ? 'A' : lwo_S.sender === 'kept' ? 'B' : 'C'; } // A Überraschung (V-11) · B behalten · C weggeworfen

// =====================================================================  AG-V · Zufallsbegegnungen (Tick): miserabel V-01…V-12, hoch V-13…V-16 · je Kapitel einmal · ≥ 300 s Abstand ·
// nie während eines Gesprächs, eines Höhepunkts, einer Verfolgung oder der Atempause nach Stufe 3 (spannung: 5 min nach dem letzten Höhepunkt)
function lwo_vAnker(id, fn) { LWO.vAnker[id] = fn; }
function lwo_vFrei() { if (!state.started || state.ending || state.talking || ui.overlay || state.inBasement || LWO.playing || (typeof camOverride !== 'undefined' && camOverride)) return false;
  if (typeof spannung_since === 'function' && spannung_since('peak') < 300) return false; if (typeof spannung_k === 'function' && spannung_k() > .45) return false;
  if (typeof spannung_silent === 'function' && spannung_silent()) return false; return LWO.T - LWO.vLast >= 300 && LWO.T - LWO.kapBeginT > 120; }
function lwo_draussen() { return !(typeof indoorRect === 'function' && indoorRect()) && !state.zone; }
const LWO_VRUN = {
  'V-01': () => { if (!LWO.kombi || !lwo_draussen() || Math.abs(player.pos.z) > 6 || player.pos.x < -75 || player.pos.x > 140) return false; lwo_v01(); return true; },
  'V-02': () => false, // braucht „Luke liest etwas“ an Tankstelle/Friedhofstor/Bushaltestelle → lwo_v02() aus dem Notiz-Haken (siehe Takt)
  'V-03': () => { if (lwo_kap() === 2 || state.zone === 'canal') return false; lwo_v03(); return true; },
  'V-06': () => { const tore = [[22, -8.6], [50, -8.6]]; const t = tore.find(p => Math.hypot(player.pos.x - p[0], player.pos.z - p[1]) < 26 && Math.hypot(player.pos.x - p[0], player.pos.z - p[1]) > 12); if (!t || !LWO.F.b0) return false; lwo_v06(t); return true; },
  'V-12': () => { if (lwo_kap() !== 6 || !LWO.F.b0 || !lwo_draussen()) return false; lwo_v12(); return true; },
  'V-13': () => { if (!LWO.kombi || !lwo_draussen() || Math.abs(player.pos.z) > 7 || player.pos.x < -70 || player.pos.x > 75) return false; lwo_v13(); return true; },
  'V-14': () => false, 'V-15': () => { lwo_v15(); return true; }, 'V-16': () => { if (!LWO.F.b0 || !lwo_draussen()) return false; lwo_v16(); return true; },
};
function lwo_vTick(dt) { if ((LWO.vT -= dt) > 0) return; LWO.vT = 2; if (!lwo_vFrei()) return; const s = lwo_stufe(), k = lwo_kap(); if (s === 'mittel') return;
  const cand = Object.entries(LWO_V).filter(([id, V]) => V.stufe === s && V.kap.includes(k) && !lwo_S.seen['v:' + id + ':' + k]); if (!cand.length) return;
  for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
  for (const [id] of cand) { const run = LWO.vAnker[id] || LWO_VRUN[id]; let ok = false; try { ok = run ? run() : false; } catch (e) { console.warn('LWO ' + id, e); }
    if (ok) { lwo_S.seen['v:' + id + ':' + k] = 1; LWO.vLast = LWO.T; return; } } }
async function lwo_v01() { // Kombi ohne Licht, zwanzig Meter hinter Luke; folgt, hält, wenn Luke hält; nach dreißig Sekunden Fernlicht, dann rückwärts weg
  const dir = Math.sign(Math.sin(player.yaw)) || 1, x0 = player.pos.x + dir * 20; // hinter Luke (Blickrichtung = −sin/−cos)
 lwo_kombiZeigen(x0, 1.8, dir > 0 ? -Math.PI / 2 : Math.PI / 2, { motor: true }); LWO.v01 = { t: 0, dir, gesagt: false }; }
function lwo_v01Tick(dt) { const V = LWO.v01, K = LWO.kombi; if (!V || !K) return; V.t += dt; const g = K.g.position, want = player.pos.x + V.dir * 20;
  if (!V.gesagt) { const dx = g.x - camera.position.x, dz = g.z - camera.position.z, d = Math.hypot(dx, dz), f = (dx * -Math.sin(player.yaw) + dz * -Math.cos(player.yaw)) / d; if (f > .8 && d < 30) { V.gesagt = true; lwo_zeile('L', LWO_V['V-01'].zeilen[0][1]); } }
  if (V.t < 30) { if (Math.abs(want - g.x) > 1.5) { K.path = [new THREE.Vector3(want, 0, 1.8)]; K.pi = 0; K.vmax = 2.2; K.rueck = false; } }
  else if (!V.fern) { V.fern = true; lwo_kombiFernlicht(); setTimeout(() => { lwo_kombiFahre([[g.x + V.dir * 45, 1.8]], 6, true).then(() => lwo_kombiWeg()); }, 1300); }
  if (V.t > 50) { LWO.v01 = null; lwo_kombiWeg(); } }
async function lwo_v02() { const a = LWO.F.n11, b = LWO.F.n12; if (!a || !b) return; const yw = player.yaw, bx = player.pos.x + Math.sin(yw) * 1.3, bz = player.pos.z + Math.cos(yw) * 1.3;
  lwo_zeigen(a, bx, bz, yw + Math.PI); lwo_zeigen(b, bx + Math.cos(yw) * 1, bz - Math.sin(yw) * 1, yw + Math.PI); lwo_blick(a, 'luke'); lwo_blick(b, 'luke'); lwo_clip(b, 'phone');
  if (typeof Audio !== 'undefined') Audio.paper(); state.talking = true; LWO.playing = 'V-02';
  const res = { wahl: [], abgebrochen: false, nachher: [] }; try { await lwo_schritte(LWO_V['V-02'].zeilen, { figuren: { N11: a, N12: b } }, res); } finally { state.talking = false; LWO.playing = null; }
  await Promise.all([lwo_gehe(a, [[bx + Math.sin(yw) * 30, bz + Math.cos(yw) * 30]], 1.2), lwo_gehe(b, [[bx + Math.sin(yw) * 30 + 1, bz + Math.cos(yw) * 30]], 1.2)]); LWO.hideQ.push(a, b);
  lwo_decal(LWO.papierTex, .3, .3, bx, lwo_bodenY(bx, bz) + .02, bz, Math.random() * 6); }
async function lwo_v03() { const k = lwo_kap(), text = LWO_V['V-03'].zeilen[k] || LWO_V['V-03'].zeilen[1]; if (lwo_handyTot()) return;
  state.talking = true; LWO.playing = 'V-03'; const ring = () => { if (Audio.ctx) for (let i = 0; i < 3; i++) Audio.play('buzz', { gain: .3, rate: 1.7, dur: .5, delay: i * .9 }); };
  try { ring(); subtitle('Dein Handy. Unbekannte Nummer.', 2600); const i = await lwo_wahl(['Abnehmen.', 'Wegdrücken.']);
    if (i === 0) { subtitle('… Atmen.', 5000); lwo_funkKlang(5, null, 'handy'); const j = await Promise.race([lwo_wahl(['Auflegen.']), wait(15000).then(() => -2)]);
      if (j === 0) { lwo_trust(-2, 'agv_auflegen_V-03_' + k); } else { if (LWO.wahlFin) LWO.wahlFin(-1); await lwo_zeile('W', text, { handy: true }); lwo_trust(2, 'agv_hoeflich_V-03_' + k); subtitle('Klick.', 1400); } }
    else { lwo_trust(-2, 'agv_auflegen_V-03_' + k); await wait(2500); ring(); subtitle('Es klingelt gleich noch einmal. Auf dem Display steht: MAMA.', 4200); await wait(4200); subtitle('Du nimmst nicht ab.', 2400); }
  } finally { state.talking = false; LWO.playing = null; } }
async function lwo_v06(t) { const B = LWO.F.b0; lwo_zeigen(B, t[0], t[1], Math.atan2(player.pos.x - t[0], player.pos.z - t[1])); lwo_blick(B, 'luke'); await wait(2500);
  await lwo_funk(LWO_V['V-06'].zeilen[0][1], { x: t[0], z: t[1] }); await wait(800); lwo_blick(B, null);
  await lwo_gehe(B, [[t[0] + (t[0] > 30 ? 20 : -20), t[1] + 1]], .9); LWO.hideQ.push(B); }
async function lwo_v12() { const B = LWO.F.b0, yw = player.yaw, x = player.pos.x - Math.sin(yw) * 24, z = player.pos.z - Math.cos(yw) * 24; lwo_zeigen(B, x, z, yw); LWO.v12 = { B, n: 0, last: null, t: 0 }; }
function lwo_v12Tick(dt) { const V = LWO.v12; if (!V) return; V.t += dt; const on = typeof flashlight !== 'undefined' && flashlight.intensity > .05;
  if (V.n < 3 && on !== V.last) { if (V.last !== null && on) V.n++; V.last = on; lwo_lampe(V.B, on || V.n >= 3); }
  if (V.n >= 3 && !V.geht) { V.geht = true; lwo_lampe(V.B, true); const yw = player.yaw; lwo_gehe(V.B, [[player.pos.x + Math.cos(yw) * 2.5, player.pos.z - Math.sin(yw) * 2.5], [player.pos.x + Math.sin(yw) * 30, player.pos.z + Math.cos(yw) * 30]], .95).then(() => { LWO.hideQ.push(V.B); LWO.v12 = null; }); }
  if (V.t > 120 && !V.geht) { lwo_weg(V.B); LWO.v12 = null; } }
async function lwo_v13() { const d = Math.random() < .5 ? 1 : -1, x0 = player.pos.x - d * 45; lwo_kombiZeigen(x0, -1.8 * d, d > 0 ? Math.PI / 2 : -Math.PI / 2, { stand: true, motor: true });
  await lwo_kombiFahre([[player.pos.x - d * 4, -1.8 * d], [player.pos.x + d * 50, -1.8 * d]], 3.2); lwo_kombiWeg(); await lwo_zeile('L', LWO_V['V-13'].zeilen[0][1]); }
async function lwo_v15() { state.talking = true; LWO.playing = 'V-15'; try { if (Audio.ctx) Audio.play('buzz', { gain: .3, rate: 1.7, dur: .5 }); for (const [c, t, o] of LWO_V['V-15'].zeilen) await lwo_zeile(c, t, o); subtitle('Klick.', 1400); lwo_trust(2, 'agv_hoeflich_V-15_5'); }
  finally { state.talking = false; LWO.playing = null; } }
async function lwo_v16() { const B = LWO.F.b0, yw = player.yaw, x = player.pos.x - Math.sin(yw) * 9, z = player.pos.z - Math.cos(yw) * 9; lwo_zeigen(B, x, z, yw); lwo_blick(B, 'luke'); await wait(1800);
  await lwo_funk(LWO_V['V-16'].zeilen[0][1], { x, z }); if (typeof addBattery === 'function') { addBattery(); addBattery(); } toast('Zwei Batterien, in Butterbrotpapier.', 3000);
  await lwo_zeile('L', LWO_V['V-16'].zeilen[1][1]); await lwo_gehe(B, [[x + Math.cos(yw) * 25, z - Math.sin(yw) * 25]], .95); LWO.hideQ.push(B); }
// Präsenz ohne Kontakt (A-04, AP-14/15 ruft auf): Pat und Patachon im Nebel, 25–40 m entfernt; kommt Luke auf 15 m heran, gehen sie nebeneinander im gleichen Schritt weg
function lwo_praesenz(x, z, ry, { nurKurz = false, weg = [[0, 0]] } = {}) { const a = LWO.F.n11, b = LWO.F.n12; if (!a || !b || LWO.playing) return false;
  if (!nurKurz) { lwo_zeigen(a, x, z, ry); lwo_blick(a, 'luke'); } lwo_zeigen(b, x + Math.cos(ry) * .9, z - Math.sin(ry) * .9, ry); lwo_blick(b, 'luke'); lwo_clip(b, nurKurz ? 'phone' : 'idle');
  LWO.praesenz = { x, z, weg, nurKurz }; return true; }
function lwo_praesenzTick() { const P = LWO.praesenz; if (!P) return; if (Math.hypot(player.pos.x - P.x, player.pos.z - P.z) > 15) return; LWO.praesenz = null; const a = LWO.F.n11, b = LWO.F.n12;
  const w = P.weg.map(p => [P.x + p[0], P.z + p[1]]); if (!P.nurKurz) lwo_gehe(a, w, 1.2).then(() => LWO.hideQ.push(a)); lwo_gehe(b, w.map(p => [p[0] + .8, p[1]]), 1.2).then(() => LWO.hideQ.push(b)); }

// =====================================================================  LADEN, TAKT
function lwo_nachLaden() { LWO.kapBeginT = LWO.T; if (LWO.ready) lwo_ag02Aufbau(); }
WORLD_MODS.push(['LWO', async () => {
  LWO.glareTex = lwo_glowTex(); LWO.papierTex = lwo_texButterbrot();
  // der eine Scheinwerfer der Blechmann-Lampen: beim Laden, Intensität 0 (keine Lichter zur Laufzeit)
  const S = new THREE.SpotLight(0xe6eeff, 0, 32, .3, .5, 1.4); S.castShadow = false; LWO.spot = S; LWO.spotTgt = new THREE.Object3D(); scene.add(S); scene.add(LWO.spotTgt); S.target = LWO.spotTgt;
  const jobs = [lwo_neueFigur('wolter', LWO_DEF.wolter), lwo_neueFigur('n11', LWO_DEF.n11), lwo_neueFigur('n12', LWO_DEF.n12)];
  for (let i = 0; i < 7; i++) jobs.push(lwo_neueFigur('b' + i, LWO_DEF.b));
  jobs.push(lwo_kombiLaden().catch(e => console.warn('LWO: Kombi', e)));
  await Promise.all(jobs.map(j => j.catch(e => console.warn('LWO: Figur', e))));
  // AG-02: Butterbrotpapier mit dem Auge auf dem Gehweg; AG-01: Kaugummipapier und Reifenspuren im Matsch hinter der Sperre (erst nach AG-01 sichtbar)
  LWO.ag02Papier = lwo_decal(LWO.papierTex, .26, .26, LWO_AG02.papier[0], lwo_bodenY(...LWO_AG02.papier) + .02, LWO_AG02.papier[1], 2.1);
  LWO.ag01Papier = lwo_decal(lwo_texKaugummi(), .075, .05, LWO_AG01.papier[0], lwo_bodenY(...LWO_AG01.papier) + .025, LWO_AG01.papier[1], .7); LWO.ag01Papier.visible = !!lwo_S.seen['ag:AG-01'];
  LWO.ag01Reifen = lwo_decal(lwo_texReifen(), 1.9, 7, LWO_AG01.kombi[0], .024, LWO_AG01.kombi[1] - 2, 0); LWO.ag01Reifen.visible = !!lwo_S.seen['ag:AG-01'];
  // Shader vorab übersetzen (sonst ruckelt der erste Auftritt): kurz sichtbar unter der Erde
  const all = Object.values(LWO.F); const prev = all.map(F => [F.g.visible, F.g.position.clone()]);
  all.forEach(F => { F.g.visible = true; F.g.position.set(0, -60, 0); }); if (LWO.kombi) { LWO.kombi.g.visible = true; LWO.kombi.g.position.set(0, -60, 0); }
  for (const o of [LWO.F.wolter, LWO.F.n11, LWO.F.n12, LWO.F.b0, LWO.kombi]) if (o) try { await renderer.compileAsync(o.g, camera, scene); } catch (e) {} // nur die eigenen Figuren (je Art eine), Lichter aus der Szene
  all.forEach((F, i) => { F.g.visible = prev[i][0]; F.g.position.copy(prev[i][1]); F.mx.update(.01); }); if (LWO.kombi) LWO.kombi.g.visible = false;
  LWO.ready = true; lwo_ag02Aufbau();
  if (typeof KAP_BEGIN !== 'undefined') for (let k = 1; k <= 6; k++) KAP_BEGIN[k].push(() => { LWO.kapBeginT = LWO.T; lwo_ag02Aufbau(); });
  window.__lwo = { S: lwo_S, LWO, sitzen: lwo_sitzen, trust: lwo_trust, stufe: lwo_stufe, szene: lwo_szene, ag02: lwo_ag02, ag01: lwo_ag01, figur: lwo_figur, zeigen: lwo_zeigen, gehe: lwo_gehe, lampe: lwo_lampe, hand: lwo_hand,
    kombi: lwo_kombiZeigen, kombiLicht: lwo_kombiLicht, kombiWeg: lwo_kombiWeg, blick: lwo_blick, clip: lwo_clip, v: id => (LWO.vAnker[id] || LWO_VRUN[id] || (() => false))(), ende: lwo_kapitelende, sieht: lwo_sieht, AG: LWO_AG, V: LWO_V }; // Testzugriff
}]);
function lwo_tick(dt) {
  LWO.T += dt; if (!LWO.ready) return; if (!LWO.itemOk) LWO.itemOk = lwo_senderItem(); // ITEMS entsteht erst nach den Modulen
  // Blinzeln der beiden: 11 bei t, 12 bei t + 0,7 s (nie gleichzeitig)
  LWO.pairNow = false; LWO.pairLate = false; if ((LWO.pairBlink -= dt) < 0) { LWO.pairBlink = 2 + Math.random() * 4; LWO.pairNow = true; LWO.pairLateT = .7; }
  if (LWO.pairLateT > 0 && (LWO.pairLateT -= dt) <= 0) LWO.pairLate = true;
  if (LWO.drehen) for (const F of LWO.drehen) { const zy = F.g.userData.zielYaw; if (zy === undefined) continue; let d = zy - F.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); F.g.rotation.y += d * Math.min(1, dt * 1.8); }
  const cam = camera.position;
  for (const k in LWO.F) { const F = LWO.F[k]; if (!F.g.visible) continue; const d = Math.hypot(F.g.position.x - cam.x, F.g.position.z - cam.z); if (d > 75 && !F.path) continue;
    // Leistung: Schatten nur in Lukes Nähe (Umschalten kostet keine Shader), ferne Figuren mit halber Bildrate bewegen
    const sch = d < 16; if (F.schatten !== sch) { F.schatten = sch; F.obj.traverse(o => { if (o.isMesh) o.castShadow = sch; }); }
    if (d > 24 && !F.path) { F.dtAcc = (F.dtAcc || 0) + dt; if ((F.odd = !F.odd)) continue; lwo_figTick(F, F.dtAcc); F.dtAcc = 0; } else lwo_figTick(F, dt); }
  lwo_kombiTick(dt); lwo_v01Tick(dt); lwo_v12Tick(dt); lwo_praesenzTick();
  // Wer gegangen ist, verschwindet erst außer Sicht oder im Nebel
  for (let i = LWO.hideQ.length - 1; i >= 0; i--) { const F = LWO.hideQ[i], p = F.g.position, dx = p.x - cam.x, dz = p.z - cam.z, d = Math.hypot(dx, dz), f = (dx * -Math.sin(player.yaw) + dz * -Math.cos(player.yaw)) / Math.max(d, 1e-3);
    if (d > 34 || f < .2) { lwo_weg(F); LWO.hideQ.splice(i, 1); } }
  // Auslöser (4×/s): AG-02 unter der Laterne vor Nr. 9, AG-01 an der Sperre bei Lucys Auto, AG-V
  if ((LWO.trigT -= dt) > 0) return; LWO.trigT = .25;
  if (!state.started || state.ending || state.talking || ui.overlay || LWO.playing) { if (ui.overlay === 'note' && lwo_stufe() === 'miserabel') LWO.notizOffen = true; return; }
  const P = player.pos;
  if (lwo_ag02Bereit() && !state.inBasement && Math.hypot(P.x - LWO_AG02.lx, P.z - (LWO_AG02.lz - 1)) < 12.5 && LWO.F.n11 && LWO.F.n11.g.visible) { lwo_ag02(); return; }
  if (lwo_ag01Bereit() && !state.inBasement) { const K = LWO.kombi, kz = LWO_AG01.kombi;
    if (!K.g.visible && Math.hypot(P.x - 1.9, P.z + 37) < 30 && P.z < -12) { lwo_kombiZeigen(kz[0], kz[1], kz[2], { motor: true }); LWO.ag01Aktiv = true; }
    else if (LWO.ag01Aktiv && K.g.visible && !LWO.playing && Math.hypot(P.x - K.g.position.x, P.z - K.g.position.z) < 20) { LWO.ag01Aktiv = false; lwo_ag01(); return; } }
  // V-02: „Luke liest etwas“ – nach dem Schließen einer Notiz draußen an Tankstelle/Friedhofstor/Bushaltestelle (Anker erweiterbar über LWO.v02Orte)
  if (LWO.notizOffen) { LWO.notizOffen = false; const k = lwo_kap(); if (lwo_stufe() === 'miserabel' && [1, 3, 5].includes(k) && !lwo_S.seen['v:V-02:' + k] && lwo_vFrei() && lwo_draussen() && (LWO.v02Orte || [[110, 22, 22], [10, 53, 14]]).some(o => Math.hypot(P.x - o[0], P.z - o[1]) < o[2])) { lwo_S.seen['v:V-02:' + k] = 1; LWO.vLast = LWO.T; lwo_v02(); return; } }
  lwo_vTick(.25);
}
WORLD_TICK.push(dt => lwo_tick(dt));

// =====================================================================  AG-07 · Kap. 2 · Vorraum des Messraums · „Wolter will ihn heil“ (AP-16, Kap. 2 UK 7)
// Mechanik: Lampe aus, hinter die Aktenschränke (amt_S.versteck), nicht bewegen; steht ein Blechmann nah: Atem anhalten (LEERTASTE halten, ein Balken sinkt).
// Bewegen, Lampe an oder zu frühes Ausatmen: beide Kapuzen drehen sich gleichzeitig – kein Kampf, Neustart (tod.js 'blech'). Wortlaut: LWO_AG['AG-07'] (Kapitelfassung).
// Aufruf: feuer.js nach 30 s Lüftung (lwo_ag07), Takt über feuer.js (lwo_ag07Tick) – dieses Modul behält seinen einen WORLD_TICK.
const LWO_AG07 = { busy: false, done: false, phase: '', t: 0, atem: 1, atemAn: false, halten: false, grace: 0, nah: false, fail: false, next: 0, el: null, bar: null, zettel: false };
{ const css = document.createElement('style'); css.textContent = `#lwoAg07 { position: absolute; left: 50%; bottom: 22%; transform: translateX(-50%); text-align: center; opacity: 0; transition: opacity .5s; pointer-events: none; }
  #lwoAg07.show { opacity: 1; } #lwoAg07 p { margin: 0 0 8px; font: 600 14px "Cormorant Garamond", Georgia, serif; letter-spacing: .32em; color: #e9dfc8; text-shadow: 0 0 2px #000, 0 0 10px #000; }
  #lwoAg07 b { display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 26px; padding: 0 8px; margin-right: 10px; border: 1px solid rgba(201,163,106,.7); border-radius: 3px; background: rgba(8,7,6,.62); color: #f3e7cc; font: 700 12px Georgia, serif; letter-spacing: .1em; }
  #lwoAg07 i { display: block; width: 240px; height: 3px; margin: 6px auto 0; background: rgba(201,163,106,.18); box-shadow: 0 0 6px #000; } #lwoAg07 u { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, #7a9aa8, #d8e6ea); transform-origin: left; }`;
  document.head.appendChild(css); const el = document.createElement('div'); el.id = 'lwoAg07'; el.innerHTML = '<p></p><i><u></u></i>'; (document.getElementById('hud') || document.body).appendChild(el); LWO_AG07.el = el; LWO_AG07.bar = el.querySelector('u'); el.querySelector('i').style.display = 'none'; }
addEventListener('keydown', e => { const G = LWO_AG07; if (!G.busy || e.code !== 'Space') return; e.preventDefault(); e.stopImmediatePropagation(); G.halten = true; if (typeof keys !== 'undefined') keys.Space = false; }, true);
addEventListener('keyup', e => { const G = LWO_AG07; if (e.code !== 'Space') return; G.halten = false; }, true);
addEventListener('keydown', e => { const G = LWO_AG07; if (!G.busy || e.code !== 'KeyF' || e.repeat || !state.talking || ui.overlay || ui.paused) return; flashOn = !flashOn; Audio.beep(true); FLASH.hudT = 2.5; }, true); // AG-07: die Lampe muss auch während des Funkverkehrs ausgehen (sonst sperrt state.talking die Taste F)
function lwo_ag07Hinweis(txt, bar) { const G = LWO_AG07; if (!G.el) return; G.el.querySelector('p').innerHTML = txt || ''; G.el.querySelector('i').style.display = bar ? 'block' : 'none'; G.el.classList.toggle('show', !!txt); }
function lwo_ag07Im() { const V = typeof amt_S !== 'undefined' ? amt_S.versteck : null, P = player.pos; return !!V && P.x > V.x0 && P.x < V.x1 && P.z > V.z0 && P.z < V.z1; }
async function lwo_ag07() { const G = LWO_AG07; if (G.busy || G.done || (typeof amt_S !== 'undefined' && amt_S.ag07) || LWO.T < G.next || !LWO.ready) return;
  const X0 = C2.x, Z0 = C2.z, P = player.pos; if (!(P.x > X0 + 106.1 && P.x < X0 + 110.2 && Math.abs(P.z - Z0) < 8) || state.talking || ui.overlay || (typeof kino_S !== 'undefined' && kino_S.on) || (typeof tod_S !== 'undefined' && tod_S.dying)) return;
  const a = LWO.F.b0, b = LWO.F.b1; if (!a || !b) { G.done = true; if (typeof amt_S !== 'undefined') amt_S.ag07 = true; return; }
  G.busy = true; G.fail = false; G.phase = 'kommen'; G.t = 0; G.atem = 1; G.atemAn = false; G.nah = false; LWO.playing = null;
  try { if (typeof beob_still === 'function') beob_still(90); } catch (e) {}
  const kette = (x, z, v) => { try { Audio.play(Audio.pick('metalHit1', 'metalHit2'), { gain: .22 * v, rate: rand(.5, .7), x, y: .4, z, ref: 3 }); Audio.play('scrape3', { gain: .12 * v, rate: .6, dur: 1.2, x, y: .2, z, ref: 3 }); } catch (e) {} };
  [0, 900, 1700, 2600].forEach((ms, i) => setTimeout(() => kette(X0 + 113, Z0 + 1, .6 + i * .15), ms));
  subtitle('Von der Seite des Bergungsschachts: das Rasseln von Kettenrollen. Zwei grelle Lampen.', 4200); lwo_ag07Hinweis('Lampe aus. Still. Hinter die Schränke.');
  if (!G.zettel) { G.zettel = true; try { if (typeof beobachter_zettel === 'function') beobachter_zettel('B-K2-05', { pos: [X0 + 108.7, 0, Z0 + 6.6] }); } catch (e) {} } // RH-1: im Versteck, auf dem Boden hinter den Schränken
  await wait(5200); if (G.fail || !G.busy) return;
  lwo_zeigen(a, X0 + 112.8, Z0 + .5, -PI / 2); lwo_zeigen(b, X0 + 113.6, Z0 - .5, -PI / 2); lwo_lampe(a, true); lwo_lampe(b, true); lwo_blick(a, null); lwo_blick(b, null); lwo_clip(a, 'look'); lwo_clip(b, 'idle');
  G.phase = 'drin'; lwo_ag07Hinweis(''); const gA = lwo_gehe(a, [[X0 + 110.4, Z0 + .3], [X0 + 108.9, Z0 + 1.6], [X0 + 108.35, Z0 + 3.95]], .9); lwo_gehe(b, [[X0 + 110.4, Z0 - .3], [X0 + 108.2, Z0 - .9]], .85);
  const res = await lwo_szene('AG-07', { figuren: { funk: { x: X0 + 108.6, z: Z0 + 1 } }, abbruch: () => LWO_AG07.fail, hook: async (tu) => {
    if (tu === 'blechmannNah') { await gA; a.g.userData.zielYaw = 0; LWO.drehen = [a]; G.nah = true; G.atemAn = true; G.grace = 1.6; lwo_ag07Hinweis('<b>LEERTASTE</b>Atem anhalten', true); return true; }
    if (tu === 'blechmannBleibt8s') { await wait(8000); return true; }
    if (tu === 'v05') { lwo_ag07V05(); return true; }
    if (tu === 'abgang') { G.atemAn = false; G.nah = false; lwo_ag07Hinweis(''); LWO.drehen = null; G.phase = 'gehen'; await lwo_ag07Abgang(a, b); return true; }
    if (tu && tu.r && /Butterbrotpapier/.test(tu.r)) { if (typeof amt_S !== 'undefined' && amt_S.butterbrot) amt_S.butterbrot.visible = true; return true; }
    return false; } });
  if (G.fail) return; G.busy = false; G.done = true; G.phase = ''; lwo_ag07Hinweis(''); if (typeof amt_S !== 'undefined') amt_S.ag07 = true;
  if (typeof setC2Objective === 'function') setC2Objective('Die Männer sind weg. Weiter in den Messraum.'); if (typeof saveGame === 'function') saveGame(2); void res; }
async function lwo_ag07Abgang(a, b) { const X0 = C2.x, Z0 = C2.z; await Promise.all([lwo_gehe(a, [[X0 + 107.3, Z0 + .6], [X0 + 106.5, Z0 + .2]], .95), lwo_gehe(b, [[X0 + 106.6, Z0 - .4]], .95)]);
  if (typeof chaseDoor !== 'undefined') { chaseDoor.locked = false; chaseDoor.set(true); try { Audio.slide(X0 + 106, Z0); } catch (e) {} }
  await Promise.all([lwo_gehe(a, [[X0 + 101, Z0 + .3]], .95), lwo_gehe(b, [[X0 + 100.2, Z0 - .3]], .95)]);
  lwo_lampe(a, false); lwo_lampe(b, false); lwo_weg(a); lwo_weg(b);
  if (typeof chaseDoor !== 'undefined') { chaseDoor.set(false); chaseDoor.locked = true; chaseDoor.lockedText = 'Dahinter ist es still. Und heiß.'; } }
function lwo_ag07V05() { const V = LWO_V['V-05']; if (!V || lwo_S.seen['v:V-05:2']) return; lwo_S.seen['v:V-05:2'] = 1; const X0 = C2.x, Z0 = C2.z;
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#efe07a'; x.fillRect(4, 4, 120, 120); x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(4, 104, 120, 20); x.fillStyle = '#1f2a55'; x.font = '15px Caveat'; ['K-3: nicht anfassen.', 'Freundlich bleiben.', '(hw)'].forEach((t, i) => x.fillText(t, 12, 36 + i * 26));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.075, .075), new THREE.MeshStandardMaterial({ map: tex(c, true), transparent: true, polygonOffset: true, polygonOffsetFactor: -4, roughness: .9 })); m.position.set(X0 + 108.4, 1.35, Z0 + 4.93); m.rotation.y = PI; m.userData.noCol = true; scene.add(m);
  const h = box(.2, .2, .1, X0 + 108.4, 1.35, Z0 + 4.88, hidden, { cast: false }); interact(h, 'Gelber Klebezettel', () => { openNote(V.notiz[0], V.notiz[1], 'lwo_v05', () => { for (const z of V.zeilen) lwo_zeile(z[0], z[1]); }); }); }
function lwo_ag07Fail(warum) { const G = LWO_AG07; if (G.fail || !G.busy) return; G.fail = true; lwo_ag07Hinweis(''); const a = LWO.F.b0, b = LWO.F.b1;
  for (const F of [a, b]) { if (!F) continue; F.path = null; F.g.userData.zielYaw = Math.atan2(player.pos.x - F.g.position.x, player.pos.z - F.g.position.z); lwo_blick(F, 'luke'); } LWO.drehen = [a, b]; // beide Kapuzen gleichzeitig
  try { Audio.play('metalHit2', { gain: .5, rate: .5, x: a.g.position.x, y: 1.5, z: a.g.position.z, ref: 3 }); } catch (e) {} console.log('[AG-07] entdeckt: ' + warum);
  setTimeout(() => { if (typeof todDie === 'function') todDie('blech'); }, 1100); }
function lwo_ag07Reset() { const G = LWO_AG07; if (!G.busy && !G.fail) return; G.busy = false; G.fail = false; G.phase = ''; G.atemAn = false; G.nah = false; lwo_ag07Hinweis(''); LWO.drehen = null; LWO.playing = null; state.talking = false; if (LWO.wahlFin) LWO.wahlFin(-1);
  for (const F of [LWO.F.b0, LWO.F.b1]) if (F) { lwo_lampe(F, false); lwo_weg(F); } G.next = LWO.T + 6; if (typeof chaseDoor !== 'undefined') { chaseDoor.set(false); chaseDoor.locked = true; } }
setTimeout(() => { try { TOD_RESET.push(() => lwo_ag07Reset()); } catch (e) {} }, 0); // (AP-14, Notbehelf) TOD_RESET steht erst in tod.js (später in ORDER): typeof schützt nicht vor der „temporal dead zone“ – sonst lädt das Spiel nicht
// Takt (aus feuer.js): Versteck, Bewegung, Lampe, Atem
function lwo_ag07Tick(dt) { const G = LWO_AG07; if (!G.busy || G.fail || (G.phase !== 'drin' && G.phase !== 'gehen')) return; const a = LWO.F.b0, b = LWO.F.b1; if (!a || !b) return; G.t += dt;
  const drin = lwo_ag07Im(), v = typeof vel !== 'undefined' ? Math.hypot(vel.x, vel.z) : 0, X0 = C2.x;
  const imRaum = Math.min(a.g.position.x, b.g.position.x) < X0 + 110.3;
  if (imRaum && flashOn && FLASH.charge > .02) return lwo_ag07Fail('Lampe an');
  if (imRaum && drin && v > .45) return lwo_ag07Fail('bewegt');
  if (imRaum && !drin && (lwo_sieht(a, { weit: 11, winkel: .7 }) || lwo_sieht(b, { weit: 11, winkel: .7 }))) return lwo_ag07Fail('gesehen');
  if (G.atemAn) { if (G.grace > 0) G.grace -= dt; if (G.halten) G.atem = Math.max(0, G.atem - dt / 14); else if (G.grace <= 0) return lwo_ag07Fail('ausgeatmet');
    if (G.bar) G.bar.style.transform = `scaleX(${G.atem.toFixed(3)})`; if (G.atem <= 0) return lwo_ag07Fail('keine Luft'); }
  else if (G.atem < 1) { G.atem = Math.min(1, G.atem + dt * .3); } }

// =====================================================================  KAPITEL 3 (AP-17): AG-09 Haltestelle · AG-10 Blechmann am Ostende · AG-08 die Reihe am Rand
// Orte im gebauten Dorf: die Haltestelle liegt am Kirchweg (≈ 10 | 53); „Kein Draußen“ (kapitel3.js) bringt Luke dort aus dem Nebel heraus.
const LWO_K3 = { bank: [11.55, 52.75], wolterRy: -Math.PI / 2, kombi: [3.4, 52.2, 0], weg: [[3.4, 70], [3.1, 100], [2.8, 140]], justinZurueck: [10.4, 72],
  ag10: [52, 1.6], ag10Weg: [[70, 2.2], [100, 3], [130, 4]], reihe: { x0: -92, z0: -58, dx: 2.2, dz: -.4 }, blickVon: [-46, -5.6] };
function lwo_k3Requisit(key, id, s, x, y, z, ry = 0) { const K = LWO.k3 || (LWO.k3 = {}); if (K[key]) { K[key].position.set(x, y, z); K[key].rotation.y = ry; K[key].visible = true; return Promise.resolve(K[key]); }
  return msModel(id, 'model.glb').then(o => { const m = msFit(o.clone(true), s, 'max'); const b = new THREE.Box3().setFromObject(m); m.position.set(x, y - b.min.y, z); m.rotation.y = ry; m.userData.noCol = true; m.traverse(c => { if (c.isMesh) c.castShadow = true; }); scene.add(m); K[key] = m; return m; }).catch(() => null); }
async function lwo_ag09() {
  const W = LWO.F.wolter; if (!W || LWO.playing) return; const B = LWO_K3.bank;
  const K = lwo_kombiZeigen(LWO_K3.kombi[0], LWO_K3.kombi[1], LWO_K3.kombi[2], { innen: true, motor: true }); // Motor an, Innenlicht an, Scheinwerfer aus
  lwo_zeigen(W, B[0], B[1], LWO_K3.wolterRy); lwo_sitzen(W, .46); lwo_blick(W, 'luke'); lwo_clip(W, 'idle');
  const thermos = await lwo_k3Requisit('thermos', 'w_thermos', .3, B[0] + .1, .46, B[1] - .55, .3), b1 = await lwo_k3Requisit('becher1', 'w_becher', .09, B[0] + .05, .46, B[1] - .78, 0), b2 = await lwo_k3Requisit('becher2', 'w_becher', .09, B[0] + .16, .46, B[1] - .86, 1);
  // Justin bleibt zwanzig Meter zurück im Nebel und kommt nicht näher
  if (typeof justin_da === 'function' && justin_da()) { jPlace(LWO_K3.justinZurueck[0], LWO_K3.justinZurueck[1], PI); justin.look = true; }
  while (Math.hypot(player.pos.x - B[0], player.pos.z - B[1]) > 6.5) { await wait(250); if (!ch3.on) return; } // er sieht Luke kommen, seit der um die Ecke ist
  const res = await lwo_szene('AG-09', { figuren: { W },
    hook: async (tu) => {
      if (tu && tu.r) return true;
      if (tu === 'tee') { try { Audio.play('glass1', { gain: .12, rate: .6, x: B[0], y: .8, z: B[1], ref: 2 }); } catch (e) {} lwo_clip(W, 'nervous'); setTimeout(() => lwo_clip(W, 'idle'), 1800); if (b1) b1.visible = false; return true; }
      if (tu === 'sender') { lwo_senderEinstecken(); return true; } // er legt Luke kurz die Hand auf die Jacke, an die Innentasche – der Spieler sieht nichts Besonderes
      if (tu === 'handschuhGlatt') { lwo_clip(W, 'nervous'); setTimeout(() => lwo_clip(W, 'idle'), 1600); return true; }
      if (tu === 'whiskeyKombi') { if (typeof whiskey_setzen === 'function' && K) try { whiskey_setzen(K.g.position.x, 1.62, K.g.position.z - .4); } catch (e) {} lwo_blick(W, K ? new THREE.Vector3(K.g.position.x, 1.8, K.g.position.z) : null); await wait(2200);
        try { Audio.drip(K.g.position.x, 1.3, K.g.position.z + 1.1); } catch (e) {} lwo_blick(W, 'luke'); return true; }
      if (tu === 'kanneStehen') { W.kanne = true; return true; }
      if (tu === 'einsteigen') { W.sit = false; lwo_clip(W, 'idle'); await wait(700); await lwo_gehe(W, [[K.g.position.x + 1.3, K.g.position.z + .6]], .9); try { Audio.play('doorOpen', { gain: .3, x: K.g.position.x, y: 1, z: K.g.position.z, ref: 3 }); } catch (e) {} lwo_weg(W); return true; }
      if (tu === 'wegfahren') { await wait(3400); lwo_kombiLicht({ innen: false }); await lwo_kombiFahre(LWO_K3.weg, 7); lwo_kombiWeg(); return true; }
      return false; } });
  if (!W.kanne && thermos) thermos.visible = false; if (b2) b2.visible = false;
  // danach: Kaugummipapier mit dem Auge auf der Bank, B-K3-03 unter der Bank (dahinter trippelt es), die Bank ist an einer Stelle warm
  try { const t = lwo_texKaugummi(), pap = lwo_decal(t, .08, .055, B[0] - .2, .47, B[1] + .1, .7, true); LWO.k3.papier = pap;
    const hit = box(.35, .25, .35, B[0] - .2, .5, B[1] + .1, hidden, { cast: false }); hit.userData.noCol = true;
    interact(hit, 'Kaugummipapier', () => { uninteract(hit); if (pap) pap.visible = false; if (typeof modItem === 'function') modItem('kaugummipapier', 'Kaugummipapier', 'Lucid Mint. Innen ein Kreis, darin ein offenes Auge über einer Flamme.', 'paper'); if (typeof addItem === 'function') addItem('kaugummipapier');
      openNote('Kaugummipapier', 'Lucid Mint. Auf der Innenseite ein Kreis, darin ein offenes Auge über einer Flamme. Das Zeichen vom Stempel. Der Mann kaut Behördenkaugummi.', 'k3_kaugummi'); });
    if (W.kanne && thermos) { const th = box(.3, .4, .3, thermos.position.x, .6, thermos.position.z, hidden, { cast: false }); th.userData.noCol = true;
      interact(th, 'Thermoskanne', () => { uninteract(th); thermos.visible = false; if (typeof modItem === 'function') modItem('thermoskanne', 'Thermoskanne', 'Wolters Thermoskanne. Noch warm. Riecht nach Pfefferminz und Blech.', 'paper'); if (typeof addItem === 'function') addItem('thermoskanne'); toast('Die Thermoskanne ist noch warm.', 2400); }); }
    const warm = box(.5, .2, .5, B[0] + .2, .5, B[1] - .2, hidden, { cast: false }); warm.userData.noCol = true; interact(warm, 'Die Bank', () => toast('Die Bank ist an einer Stelle warm. Nicht da, wo er saß.', 3000)); } catch (e) { console.warn('AG-09 danach', e); }
  if (typeof beobachter_zettel === 'function') setTimeout(() => { try { beobachter_zettel('B-K3-03', { pos: [B[0] + .1, 0, B[1] - .35] }); } catch (e) {} }, 9000);
  if (typeof whiskey_mimic === 'function') setTimeout(() => { try { whiskey_mimic('standgas'); } catch (e) {} }, 5200); // Whiskey macht den Kombi nach
  // Justin danach: „Den kenne ich. Er stand schon einmal am Rand, mit einem Netz. Dieselbe Kanne.“
  if (typeof justin_da === 'function' && justin_da()) { await new Promise(r => jWalk(player.pos.x + 1.4, player.pos.z + 1.6, r)); if (typeof justin_sprich === 'function') await justin_sprich('wolter'); }
  return res; }
// AG-10: im Nebel am Ostende, auf dem Weg zum Kasten vor Nr. 7 – von weitem ein Ritter
async function lwo_ag10() {
  const F = LWO.F.b0; if (!F || LWO.playing) return; const A = LWO_K3.ag10; lwo_zeigen(F, A[0], A[1], Math.PI / 2); lwo_blick(F, null); lwo_lampe(F, false);
  const iv = setInterval(() => { if (!F.g.visible) return clearInterval(iv); try { Audio.chains(F.g.position.x, .1, F.g.position.z); } catch (e) {} }, 2600); // die Kette schleift auf dem Asphalt
  while (Math.hypot(player.pos.x - F.g.position.x, player.pos.z - F.g.position.z) > 20) { await wait(250); if (!ch3.on || ch3.lampsOff) { clearInterval(iv); lwo_weg(F); return; } }
  F.g.userData.zielYaw = Math.atan2(player.pos.x - F.g.position.x, player.pos.z - F.g.position.z); LWO.drehen = [F];
  const res = await lwo_szene('AG-10', { figuren: { F },
    hook: async (tu) => { if (tu && tu.r) { if (/Kettenschleifen/.test(tu.r)) { try { Audio.chains(player.pos.x + 2, 2, player.pos.z); } catch (e) {} await wait(1600);
          if (typeof justin_da === 'function' && justin_da()) { const P = player.pos; jPlace(P.x - 9, P.z + 3, Math.PI / 2); justin.look = true; } } return true; }
      if (tu === 'lampeAn') { lwo_blick(F, 'luke'); lwo_lampe(F, true); setTimeout(() => lwo_lampe(F, false), 3000); await wait(1200); return true; } // eine grelle, viereckige Lampe, direkt ins Gesicht, drei Sekunden
      if (tu === 'abgang') { LWO.drehen = null; lwo_blick(F, null); lwo_gehe(F, LWO_K3.ag10Weg, .95).then(() => { clearInterval(iv); LWO.hideQ.push(F); }); await wait(1500); return true; }
      return false; } });
  if (typeof whiskey_mimic === 'function') try { whiskey_mimic('ruestung'); } catch (e) {}
  return res; }
// AG-08: nach der dritten Laterne, vom Kasten vor Nr. 1 aus der Blick zur Senke – sieben in einer Reihe, Ketten, Lampen aus
function lwo_ag08Bereit() { const V = LWO_K3.blickVon; return !lwo_S.seen['ag:AG-08'] && !LWO.playing && Math.hypot(player.pos.x - V[0], player.pos.z - V[1]) < 9; }
async function lwo_ag08() {
  if (LWO.playing) return; const R = LWO_K3.reihe, ry = Math.atan2(-130 - R.x0, -60 - R.z0), Fs = [];
  for (let i = 0; i < 7; i++) { const F = LWO.F['b' + i]; if (!F) continue; lwo_zeigen(F, R.x0 + i * R.dx, R.z0 + i * R.dz, ry); lwo_lampe(F, false); lwo_blick(F, null); Fs.push(F); }
  if (typeof beob_still === 'function') try { beob_still(55); } catch (e) {} // hier hört man ihn nicht – zum ersten Mal in dieser Nacht ist hinter Luke Stille
  const res = await lwo_szene('AG-08', { hook: async (tu) => { if (tu && tu.r) { const F = Fs[3]; if (F) { lwo_clip(F, 'look'); setTimeout(() => lwo_clip(F, 'idle'), 2400); } await wait(2600); return true; } return false; } });
  await wait(800);
  state.talking = true; try { await say([['Die stehen da wie Leute am Bahnsteig. Nur dass sie den Zug festhalten wollen.', 4400, 'LUKE']]);
    if (typeof justin_da === 'function' && justin_da() && jDist() < 14) { await say([['„Wenn es aufgeht, fällt etwas ab, wie Schorf. Das sammeln sie. Früher kamen Leute mit Körben. Die hier haben Ketten.“', 5800, JS], ['Wissen die, dass da drin ein Kind ist?', 2400, 'DU'], ['„Sie wissen, dass da drin etwas ist. Für sie ist es ein Wolf.“', 3600, JS]]); } }
  finally { state.talking = false; }
  const weg = () => { if (Math.hypot(player.pos.x - R.x0, player.pos.z - R.z0) > 70 || ch3.lampsOff) { for (const F of Fs) LWO.hideQ.push(F); } else setTimeout(weg, 1500); }; weg();
  return res; }
