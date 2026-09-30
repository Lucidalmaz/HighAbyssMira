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
    lwo_S.sender = ['none', 'kept', 'thrown'].includes(v.sender) ? v.sender : 'none'; lwo_S.auftrag1 = v.auftrag1 ?? null; lwo_S.auftrag2 = v.auftrag2 ?? null; story.lwo = lwo_S; lwo_nachLaden(); }]);

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
