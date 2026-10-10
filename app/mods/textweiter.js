// =====================================================================  TEXT WEITER / ÜBERSPRINGEN (Nutzer 10.10.2026: „Texte lassen sich teils nicht weiterklicken/überspringen“)
// Untertitel und Gedanken (subtitle/say) laufen sonst starr nach Lesezeit. Jetzt:
//   · Enter, Leertaste im Gespräch ausgenommen: Enter oder linke Maustaste auf der Textzeile → nächste Zeile sofort (aktuelle Zeile ausblenden, Warteschlange weiter)
//   · X → alle wartenden Zeilen verwerfen und die laufende say()-Folge sofort beenden
// Gilt nur, solange ein Untertitel sichtbar ist und kein Overlay (Notiz, Keypad, Menü, Pause) offen ist. Bewegen, Lampe, E bleiben unberührt (freeTalk).
// TXW und say() mit überspringbarem Warten: textweiter_patch.py (Basis)
function textweiter_overlay() { try { return !!(ui && ui.overlay) || !!document.querySelector('.overlay.show:not(#start)') || document.body.classList.contains('menu') || (state && (state.paused || state.dead)); } catch (e) { return false; } }
function textweiter_sichtbar() { const el = document.getElementById('subtitle'); return !!el && parseFloat(el.style.opacity || '0') > .05 && el.textContent.trim().length > 0; }
function textweiter(alle) {
  if (!textweiter_sichtbar() || textweiter_overlay()) return false;
  const el = document.getElementById('subtitle');
  gtCancel(subT); subT = null; el.style.opacity = 0;
  if (alle) { TXW.alle = true; subQ.length = 0; if (subQH) { gtCancel(subQH); subQH = null; } }
  const r = TXW.res; TXW.res = null; if (r) r();
  subMin = 0; if (subQ.length && !subQH) subQH = gtAfter(0, subNext);
  return true;
}
window.addEventListener('keydown', e => { if (e.repeat) return; if (e.code === 'Enter' || e.code === 'NumpadEnter') { if (textweiter(false)) e.preventDefault(); } else if (e.code === 'KeyX') textweiter(true); }, true);
window.addEventListener('mousedown', e => { if (e.button === 0 && document.pointerLockElement === null && textweiter_sichtbar() && e.target && e.target.id === 'subtitle') textweiter(false); }, true);
window.__textweiter = { skip: textweiter, say: l => say(l), sichtbar: textweiter_sichtbar };
