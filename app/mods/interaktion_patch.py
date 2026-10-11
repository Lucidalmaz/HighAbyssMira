# interaktion: Anzeige der Beschriftung. Interaktions-Physik (interaktion.js) setzt userData.iapAnz() (z. B. „Schließen“ bei offener Schublade); die Basis zeigt sie vor userData.label.
# userData.label selbst bleibt unverändert: mehrere Module suchen Klickflächen per Textvergleich (anwesen.js, neben3.js, kapitel5.js).
ALT = "if (target && !ui.overlay) { const l = target.userData.label; $('prompt').style.display = 'block'; $('promptText').textContent = trX(typeof l === 'function' ? l() : l);"
NEU = "if (target && !ui.overlay) { let l = target.userData.label; if (target.userData.iapAnz) { const a = target.userData.iapAnz(); if (a) l = a; } $('prompt').style.display = 'block'; $('promptText').textContent = trX(typeof l === 'function' ? l() : l);"


def apply(s):
    assert s.count(ALT) == 1, 'interaktion_patch: updateInteract nicht gefunden'
    return s.replace(ALT, NEU)
