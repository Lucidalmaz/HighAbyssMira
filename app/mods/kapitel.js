// =====================================================================  KAPITEL (Modul „kapitel“, W2-P0 · F3 AP-01): eine Quelle für die Kapitelnummer 1…7
// Schnittstelle für alle Module (produktion_welle2.md §1.1):
//   kap()          → 1…7 (ab 5 aus KAP.n, sonst aus den Merkern der Basis; curChapter() der Basis ist nur noch ein Wrapper)   kapAb(n) → kap() >= n
//   Kapitel 7 („∴“) ist gesperrt (KAP_GESPERRT): kapStart(7) tut nichts, das Menü zeigt „Fortsetzung folgt“.
//   KAP_BEGIN[n]   → Funktionen beim Start von Kapitel n (auch beim Weiterspielen). Kap. 5/6: über kapStart(n); Kap. 1–4: einmal nach dem
//                    setChapter(n) der Basis (verzögert bis zum Ende des laufenden Aufrufs – Kapitel 4 baut vorher Kapitel 3 auf, dann zählt nur 4)
//   KAP_END[n]     → Funktionen beim Ende von Kapitel n (über kapEnde(n))
//   kapStart(n)    → KAP.n = n, setChapter(n), saveFlag('ch'+n), saveGame(n) (nicht während „Weiterspielen“ lädt), KAP_BEGIN[n]
//   kapEnde(n)     → saveFlag('ch'+(n+1)), KAP.done = max(done, n), KAP_END[n]
//   Spielstand (AP-01/AP-03): 'kapitel' = { kap, ch5, ch6, done } – ältere Stände { n } werden übernommen
//   window.__kap   → { get, ab(n), set(n), start(n), ende(n), save(n), load() } (Testzugriff)
// Das Modul steht vor allen anderen. Basis-Namen, die erst nach der Modul-Marke entstehen (saveFlags, menu …), nur in Funktionen benutzen.
// KAP ist absichtlich var: curChapter() der Basis prüft typeof KAP – auch wenn dieses Modul fehlt oder noch nicht gelaufen ist.
var KAP = { n: 0, laden: false, begun: 0, pend: false, done: 0 };
const KAP_MAX = 7, KAP_GESPERRT = 7;
const KAP_BEGIN = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] }, KAP_END = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
function kap() {
  if (KAP.n >= 5) return Math.min(KAP_MAX, KAP.n);
  const old = (typeof anwesen_S !== 'undefined' && anwesen_S.ch4) ? 4 : ch3.on ? 3 : ch2.on ? 2 : 1; // Kapitel 1–4: Merker der Basis/anwesen
  return Math.min(KAP_MAX, Math.max(story.chapter || 1, old));
}
function kapAb(n) { return kap() >= n; }
function kap_run(list, n, what) { for (const f of list[n] || []) { try { f(n); } catch (e) { console.error(what + ' ' + n, e); } } }
function kapStart(n) {
  if (n >= KAP_GESPERRT) return; // Kapitel 7 ist noch nicht gebaut
  KAP.n = n; setChapter(n); saveFlag('ch' + n);
  if (!KAP.laden) saveGame(n); // beim Weiterspielen steht der Spielstand schon – nicht mit dem Kapitelanfang überschreiben
  KAP.begun = n; kap_run(KAP_BEGIN, n, 'Kapitelbeginn');
}
function kapEnde(n) { saveFlag('ch' + (n + 1)); KAP.done = Math.max(KAP.done || 0, n); kap_run(KAP_END, n, 'Kapitelende'); }
// Kapitel 1–4 setzen ihr Kapitel in der Basis über setChapter(n) → KAP_BEGIN dort einmal je Wechsel nachziehen
setChapter = (o => n => { o(n); if (KAP.pend) return; KAP.pend = true;
  setTimeout(() => { KAP.pend = false; const k = kap(); if (k <= 4 && k !== KAP.begun) { KAP.begun = k; kap_run(KAP_BEGIN, k, 'Kapitelbeginn'); } }, 0); })(setChapter);
MOD_SAVE.push(['kapitel', () => ({ kap: KAP.n, ch5: !!saveFlags.ch5, ch6: !!saveFlags.ch6, done: KAP.done || 0 }),
  v => { KAP.n = Math.min(KAP_MAX - 1, +(v.kap ?? v.n) || 0); KAP.done = Math.max(KAP.done || 0, +v.done || 0); // v.n: Spielstand vor Fassung 3
    if (v.ch5) saveFlag('ch5'); if (v.ch6) saveFlag('ch6'); }]); // Kap. 5/6 nur nach dem Vorgänger (PK-E): ein Stand, der dort war, schaltet sie frei
// ---- Spielstand Fassung 3 (AP-03): neue Schlüssel und ihre Standardzustände (kapitelübergreifend)
// Vorhanden und selbst gespeichert: akte · anwesen · augenzu · ausruestung · beobachter (+ k2seen, lit, dyn) · entdecker · feuer · gedanken · hungrige ·
//   kamera · kapitel · kapitel5 · kapitel6 · lucy3 · schrecken · tiefwald · tod · visionen · whiskey (+ mood, ignored, said, stolen, help, ring, light,
//   vegas_taufe, hatSchluessel, chip) · zimmer7 · Basis 'ch3' (armorHints, answer, gift, bell, side).
// Noch ohne Modul (legen spätere APs an): lwo · sammeln · katzen · kino · villa · kirchberg · post. Bis dahin hält dieses Modul ihren Zustand
//   (KAP_SAVE[name], lwo zusätzlich als story.lwo) und speichert ihn unter demselben Schlüssel. Sobald ein Modul den Schlüssel selbst mit
//   MOD_SAVE.push([name, …]) auf oberster Ebene anlegt, entfällt der Platzhalter automatisch; Startwerte holt es mit kap_saveDefault(name),
//   einen schon geladenen Stand mit KAP_SAVE[name].
const KAP_SAVE_DEFAULT = {
  lwo: () => ({ trust: 50, seen: {}, sender: 'none', auftrag1: null, auftrag2: null }), // Vertrauen 0–100 (Start 50) · sender 'none'|'kept'|'thrown'
  sammeln: () => ({ sb: [], z: [], fibel: [] }),        // Stundenbuch SB-01…12 · Laternenbote Z-01…11 · Fibel-Reiter (DAMALS, DAS BIST DU, SPIELREGELN)
  katzen: () => ({ found: [], kater5: null }),           // eingesammelte Katzen („Siebzehn Näpfe“) · Kater aus Kap. 5
  kino: () => ({ seen: [] }),                            // gesehene Sequenzen (Überspringen erst nach dem ersten Mal)
  villa: () => ({ rooms: [], kuehl: false, zaehlbuch: null, grete: false, kanne: false }),
  kirchberg: () => ({ steps: {} }),                      // Gisela, Pfarrhaus, Kapelle
  post: () => ({ weg: null, briefe: [] }),               // Günther Maas: „Unzustellbar“ Weg a/b/c · zugestellte Briefe
};
const KAP_SAVE = {};
function kap_saveDefault(k) { const f = KAP_SAVE_DEFAULT[k]; return f ? f() : null; }
for (const k of Object.keys(KAP_SAVE_DEFAULT)) KAP_SAVE[k] = kap_saveDefault(k);
if (!story.lwo) story.lwo = KAP_SAVE.lwo;
function kap_saveStubs() { // erst nach allen Modulen (Aufruf im WORLD_MODS-Eintrag): nur Schlüssel, die noch kein Modul speichert
  for (const k of Object.keys(KAP_SAVE_DEFAULT)) if (!MOD_SAVE.some(e => e[0] === k))
    MOD_SAVE.push([k, () => KAP_SAVE[k], v => { KAP_SAVE[k] = Object.assign(kap_saveDefault(k), v && typeof v === 'object' ? v : {}); if (k === 'lwo') story.lwo = KAP_SAVE.lwo; }]);
}
WORLD_MODS.push(['Kapitel', async () => {
  kap_saveStubs();
  window.__kap = { get: kap, ab: kapAb, set(n) { KAP.n = n; story.chapter = n; return kap(); }, start: kapStart, ende: kapEnde, save: c => saveGame(c), load: () => loadSave() }; // Testzugriff
}]);
WORLD_TICK.push(() => {}); // Eintrag für die Messanzeige (ein Tick je Modul)
