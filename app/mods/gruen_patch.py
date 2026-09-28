# gruen: Weltgrenzen an die neue Karte anpassen (Zeilen bei '// Weltgrenzen').
# - Nord-, Ost- und Westrand des alten Ortskerns fallen weg (die Welt geht dort weiter).
# - Südrand bleibt (dahinter der tote Wald), die Kisten liegen jetzt HINTER dem Zaun statt 0,4 m davor.
# - Neue Außengrenze x -158..158, z -53..98: Kiste direkt hinter dem Weidezaun (Zaun + Wald baut mods/gruen.js).
# - Waldblock im Süden: seitlich (x = +-79,4) ebenfalls Zaun + Kiste auf der Waldseite.

OLD = """// Weltgrenzen
addCol(-80, -4.2, -33, -32); addCol(4.2, 80, -33, -32); addCol(-80, 80, 32, 33); addCol(-81, -80, -33, 33); addCol(80, 81, -33, 33);
addCol(-14, -4.2, -47, -31); addCol(4.2, 14, -47, -31); addCol(-5, 5, -47, -46);"""

NEW = """// Weltgrenzen (gruen: neue Karte – Ortskern-Rand nur noch im Süden, große Außengrenze mit Weidezaun + Wald)
addCol(-79.4, -4.75, -33.4, -32.55); addCol(4.75, 79.4, -33.4, -32.55);
addCol(-79.25, -78.4, -53.4, -32.55); addCol(78.4, 79.25, -53.4, -32.55);
addCol(-14, -4.75, -47, -32.55); addCol(4.75, 14, -47, -32.55); addCol(-5, 5, -47, -46);
addCol(-159.6, 159.6, -54.2, -53.25); addCol(-159.6, 25.6, 98.25, 99.2); addCol(34.4, 159.6, 98.25, 99.2); addCol(-159.6, -158.25, -54.2, 99.2); addCol(158.25, 159.6, -54.2, 99.2);"""


def apply(s):
    assert s.count(OLD) == 1, 'gruen_patch: Weltgrenzen-Zeilen nicht gefunden'
    return s.replace(OLD, NEW)
