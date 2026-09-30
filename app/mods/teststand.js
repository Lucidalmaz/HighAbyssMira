// =====================================================================  TESTSTAND (Modul „teststand“): Endpunkt einer spielbaren Zwischenversion
// Nur aktiv, wenn beim Zusammenbau HAM_TESTSTAND=<letztes Kapitel> gesetzt ist (assemble.js schreibt dann window.HAM_TESTSTAND).
// Sobald das Spiel ein Kapitel danach beginnen will (setChapter der Basis, auch über kapStart), erscheint statt dessen die Endtafel
// „Ende der Testversion“; der Knopf lädt das Spiel neu (Titelbild). Ohne HAM_TESTSTAND tut das Modul nichts.
const TESTSTAND_MAX = +(window.HAM_TESTSTAND || 0);
function teststand_ende() {
  if (document.getElementById('teststandEnde')) return;
  try { document.exitPointerLock(); } catch (e) {}
  try { if (Audio.ctx) Audio.ctx.suspend(); } catch (e) {}
  const d = document.createElement('div'); d.id = 'teststandEnde';
  d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#050505;color:#d8d2c4;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:"Special Elite",Georgia,serif;text-align:center;opacity:0;transition:opacity 2.5s';
  d.innerHTML = `<div style="font-size:15px;letter-spacing:.35em;opacity:.55;margin-bottom:26px">HIGH ABYSS MIRA</div>
    <div style="font-size:34px;letter-spacing:.08em;margin-bottom:18px">Ende der Testversion</div>
    <div style="font-size:17px;opacity:.75;max-width:560px;line-height:1.6">Kapitel ${TESTSTAND_MAX + 1} ist noch in Arbeit.<br>Danke fürs Spielen.</div>
    <button id="teststandZurueck" style="margin-top:44px;padding:10px 26px;background:none;border:1px solid #6d665a;color:#d8d2c4;font:inherit;font-size:16px;letter-spacing:.12em;cursor:pointer">ZUM TITEL</button>`;
  document.body.appendChild(d); requestAnimationFrame(() => { d.style.opacity = 1; });
  d.querySelector('#teststandZurueck').onclick = () => location.reload();
}
if (TESTSTAND_MAX) setChapter = (o => n => { if (n > TESTSTAND_MAX) { teststand_ende(); return; } o(n); })(setChapter);
WORLD_MODS.push(['Teststand', async () => {}]);
WORLD_TICK.push(() => {});
