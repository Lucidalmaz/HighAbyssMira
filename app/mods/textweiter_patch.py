# textweiter: say() wartet überspringbar (Enter/X, siehe textweiter.js). Nur die Wartezeile der Basis wird ersetzt; Wrapper anderer Module (stimmen.js) bleiben davor.
ALT = "async function say(lines) { for (const l of lines) { const [t, ms, who] = l, d = Math.max(ms, readMs(trX(t))); subtitle(t, d + 250, who); await wait(d); } }"
NEU = "var TXW = { res: null, alle: false }; // Text weiter (textweiter.js)\nasync function say(lines) { TXW.alle = false; for (const l of lines) { if (TXW.alle) break; const [t, ms, who] = l, d = Math.max(ms, readMs(trX(t))); subtitle(t, d + 250, who); await new Promise(res => { TXW.res = res; wait(d).then(() => { if (TXW.res === res) TXW.res = null; res(); }); }); } TXW.alle = false; }"


def apply(s):
    assert s.count(ALT) == 1, 'textweiter_patch: say() nicht gefunden'
    return s.replace(ALT, NEU)
