# teststand (QA 09.10.2026): Leinwand-Schrift merken – jede Leinwand bekommt canvas.__txt (Liste der geschriebenen Texte, höchstens 40).
# Damit finden die Prüfskripte (Schrift-/Schilder-Audit) alle Schilder, Zettel, Etiketten samt Text – auch die der Basis, die vor den Modulen gezeichnet werden.
# Läuft als erstes Skript vor dem Spielmodul; ändert nichts an der Darstellung.

MARK = '<script type="module">'
HOOK = """<script>/* QA: Leinwand-Schrift merken (canvas.__txt) */ { const P = CanvasRenderingContext2D.prototype; for (const k of ['fillText', 'strokeText']) { const o = P[k]; P[k] = function (t, ...a) { try { const c = this.canvas; if (c && typeof t === 'string' && t.trim() && (c.__txt = c.__txt || []).length < 40 && !c.__txt.includes(t)) c.__txt.push(t); } catch (e) {} return o.call(this, t, ...a); }; } }</script>
"""


def apply(s):
    assert s.count(MARK) == 1, 'teststand_patch: Modul-Skript nicht gefunden'
    return s.replace(MARK, HOOK + MARK)
