// =====================================================================  TEXT WEITER / ÜBERSPRINGEN (Nutzer 10.10.2026: „Texte lassen sich teils nicht weiterklicken/überspringen“)
// Untertitel und Gedanken (subtitle/say) laufen sonst starr nach Lesezeit. Jetzt:
//   · Enter, Leertaste im Gespräch ausgenommen: Enter oder linke Maustaste auf der Textzeile → nächste Zeile sofort (aktuelle Zeile ausblenden, Warteschlange weiter)
//   · X → alle wartenden Zeilen verwerfen und die laufende say()-Folge sofort beenden
// Gilt nur, solange ein Untertitel sichtbar ist und kein Overlay (Notiz, Keypad, Menü, Pause) offen ist. Bewegen, Lampe, E bleiben unberührt (freeTalk).
// TXW und say() mit überspringbarem Warten: textweiter_patch.py (Basis)
function textweiter_overlay() { try { return !!(ui && ui.overlay) || !!document.querySelector('.overlay.show:not(#start)') || document.body.classList.contains('menu') || (state && (state.paused || state.dead)); } catch (e) { return false; } }
function textweiter_sichtbar() { const el = document.getElementById('subtitle'); return !!el && parseFloat(el.style.opacity || '0') > .05 && el.textContent.trim().length > 0; }
// 10.10. Toasts (Hinweise) und Aufgaben-Pop-ups: Enter/Klick blendet sie aus, X zusammen mit der Untertitel-Folge
function textweiter_andere() { let did = false; try { const t = document.getElementById('toast'); if (t && parseFloat(t.style.opacity || '0') > .05) { clearTimeout(toastT); t.style.opacity = 0; did = true; }
    const q = document.getElementById('questPop'); if (q && q.classList.contains('show')) { clearTimeout(popT); q.classList.remove('show'); did = true; } } catch (e) {} return did; }
function textweiter(alle) {
  if (textweiter_overlay()) return false;
  if (!textweiter_sichtbar()) return textweiter_andere();
  if (alle) textweiter_andere();
  const el = document.getElementById('subtitle');
  gtCancel(subT); subT = null; el.style.opacity = 0;
  if (alle) { TXW.alle = true; subQ.length = 0; if (subQH) { gtCancel(subQH); subQH = null; } }
  const r = TXW.res; TXW.res = null; if (r) r();
  subMin = 0; if (subQ.length && !subQH) subQH = gtAfter(0, subNext);
  return true;
}
window.addEventListener('keydown', e => { if (e.repeat) return;
  // Notizen, Briefe, Akten (Overlay „note“): Enter, Leertaste und X schließen wie E/Esc
  if (typeof ui !== 'undefined' && ui.overlay === 'note' && (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space' || e.code === 'KeyX')) { e.preventDefault(); e.stopPropagation(); closeOverlay(); return; }
  if (e.code === 'Enter' || e.code === 'NumpadEnter') { if (textweiter(false)) e.preventDefault(); } else if (e.code === 'KeyX') textweiter(true); }, true);
window.addEventListener('mousedown', e => { if (e.button !== 0) return; const gesperrt = document.pointerLockElement !== null;
  if (!gesperrt && textweiter_sichtbar() && e.target && e.target.id === 'subtitle') textweiter(false);
  else if (gesperrt && state && state.started && !(typeof kino_S !== 'undefined' && kino_S.on)) textweiter(false); }, true); // im Spiel (Maus gefangen): Klick = nächste Zeile / Hinweis weg
window.__textweiter = { skip: textweiter, say: l => say(l), sichtbar: textweiter_sichtbar };
