// =====================================================================  KAPITEL (Modul „kapitel“, W2-P0): eine Quelle für die Kapitelnummer 1…6
// Schnittstelle für alle Module (produktion_welle2.md §1.1):
//   kap()          → 1…6 (5/6 aus KAP.n, sonst curChapter() der Basis)      kapAb(n) → kap() >= n
//   KAP_BEGIN[n]   → Funktionen beim Start von Kapitel n (auch beim Weiterspielen). Kap. 5/6: über kapStart(n); Kap. 1–4: einmal nach dem
//                    setChapter(n) der Basis (verzögert bis zum Ende des laufenden Aufrufs – Kapitel 4 baut vorher Kapitel 3 auf, dann zählt nur 4)
//   KAP_END[n]     → Funktionen beim Ende von Kapitel n (über kapEnde(n))
//   kapStart(n)    → KAP.n = n, setChapter(n), saveFlag('ch'+n), saveGame(n) (nicht während „Weiterspielen“ lädt), KAP_BEGIN[n]
//   kapEnde(n)     → saveFlag('ch'+(n+1)), KAP_END[n]
//   window.__kap   → { get, ab(n), set(n), start(n), ende(n), save(n), load() } (Testzugriff)
// Das Modul steht vor allen anderen. Basis-Namen, die erst nach der Modul-Marke entstehen (saveFlags, menu …), nur in Funktionen benutzen.
// KAP ist absichtlich var: curChapter() der Basis prüft typeof KAP – auch wenn dieses Modul fehlt oder noch nicht gelaufen ist.
var KAP = { n: 0, laden: false, begun: 0, pend: false };
const KAP_BEGIN = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }, KAP_END = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
function kap() { return KAP.n >= 5 ? KAP.n : curChapter(); }
function kapAb(n) { return kap() >= n; }
function kap_run(list, n, what) { for (const f of list[n] || []) { try { f(n); } catch (e) { console.error(what + ' ' + n, e); } } }
function kapStart(n) {
  KAP.n = n; setChapter(n); saveFlag('ch' + n);
  if (!KAP.laden) saveGame(n); // beim Weiterspielen steht der Spielstand schon – nicht mit dem Kapitelanfang überschreiben
  KAP.begun = n; kap_run(KAP_BEGIN, n, 'Kapitelbeginn');
}
function kapEnde(n) { saveFlag('ch' + (n + 1)); kap_run(KAP_END, n, 'Kapitelende'); }
// Kapitel 1–4 setzen ihr Kapitel in der Basis über setChapter(n) → KAP_BEGIN dort einmal je Wechsel nachziehen
setChapter = (o => n => { o(n); if (KAP.pend) return; KAP.pend = true;
  setTimeout(() => { KAP.pend = false; const k = kap(); if (k <= 4 && k !== KAP.begun) { KAP.begun = k; kap_run(KAP_BEGIN, k, 'Kapitelbeginn'); } }, 0); })(setChapter);
MOD_SAVE.push(['kapitel', () => ({ n: KAP.n }), v => { KAP.n = v.n || 0; }]);
WORLD_MODS.push(['Kapitel', async () => {
  window.__kap = { get: kap, ab: kapAb, set(n) { KAP.n = n; story.chapter = n; return kap(); }, start: kapStart, ende: kapEnde, save: c => saveGame(c), load: () => loadSave() }; // Testzugriff
}]);
WORLD_TICK.push(() => {}); // Eintrag für die Messanzeige (ein Tick je Modul)
