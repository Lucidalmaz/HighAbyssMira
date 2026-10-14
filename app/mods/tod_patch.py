# tod: Klavier-Rätsel (safeOpen) im Spielstand. safeOpens(quiet) stellt das offene Aktenfach ohne Ton/Untertitel/Zielzeile wieder her.
A1 = "async function safeOpens() {\n  ch2.safeOpen = true; Audio.chime(); Audio.slide(X + 121, Z); setC2Objective('Lies die achte Akte.'); if (typeof amt_safe === 'function') amt_safe();"
N1 = "async function safeOpens(quiet) {\n  ch2.safeOpen = true; if (!quiet) { Audio.chime(); Audio.slide(X + 121, Z); setC2Objective('Lies die achte Akte.'); } if (typeof amt_safe === 'function') amt_safe();"
A2 = "  subtitle('Beim letzten Ton springt ein Aktenfach ohne Griff auf. Darin: eine Akte ohne Namen.', 4000);"
N2 = "  if (!quiet) subtitle('Beim letzten Ton springt ein Aktenfach ohne Griff auf. Darin: eine Akte ohne Namen.', 4000);"


def apply(s):
    assert s.count(A1) == 1, 'tod_patch: safeOpens nicht gefunden'
    assert s.count(A2) == 1, 'tod_patch: Untertitel safeOpens nicht gefunden'
    return s.replace(A1, N1).replace(A2, N2)
