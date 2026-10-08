# Nahtprüfung der Schleifen (game/audio): Kern = Datei ohne den 0,25-s-Rand (das schneidet das Spiel ab); verglichen werden Ende und Anfang des Kerns
# (Sprung der Sample-Werte am Übergang, Pegel der letzten/ersten 0,25 s). Auffällige Schleifen (Sprung > 4x lokaler Effektivwert oder Pegelunterschied > 10 %)
# werden mit --fix per Kreuzblende (1,5 s) neu gebacken. Aufruf (in app/): python tools/klang_naht.py [--fix]
import sys, os, glob, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from klang_lib import *
LOOPS = sorted(glob.glob(os.path.join(OUT, 'amb_*.ogg'))) + [os.path.join(OUT, n + '.ogg') for n in ('mu_gefahr', 'mu_jagd', 'mu_jagd_hoch', 'fx_katze_schnurr', 'fx_funk_stat')]
fix = '--fix' in sys.argv; bad = []
for f in LOOPS:
    if not os.path.exists(f): continue
    x, sr = sf.read(f, dtype='float32', always_2d=True); k = int(.25 * sr); c = x[k:len(x) - k]; w = int(.25 * sr); m = c.mean(1)
    a, b = np.sqrt(np.mean(m[:w] ** 2)) + 1e-9, np.sqrt(np.mean(m[-w:] ** 2)) + 1e-9; d = abs(a - b) / max(a, b)
    s = int(.005 * sr); loc = np.sqrt(np.mean(np.concatenate([m[:s], m[-s:]]) ** 2)) + 1e-9; jump = abs(m[0] - m[-1]) / loc
    # Vergleich mit der Natur des Materials: Pegelsprung zwischen zwei benachbarten 0,25-s-Fenstern im Inneren (95. Perzentil)
    hop = w; E = np.array([np.sqrt(np.mean(m[i:i + w] ** 2)) + 1e-9 for i in range(0, len(m) - w, hop)]); inner = np.abs(E[1:] - E[:-1]) / np.maximum(E[1:], E[:-1]); lim = np.percentile(inner, 95)
    flag = (d > .10 and d > lim) or jump > 4; name = os.path.basename(f)[:-4]
    print(f'{name:22s} Pegel-Differenz {d * 100:5.1f} %  Sprung {jump:4.1f}x  (innen 95 %: {lim * 100:4.1f} %)  {"<-- Naht" if flag else ""}')
    if flag: bad.append((f, name, c, sr))
if fix:
    for f, name, c, sr in bad:
        y = loopify(st(c), min(1.5, len(c) / sr * .2)); q = norm(y, lufs(c), -1) if False else y
        sf.write(f, y if y.shape[1] == 2 else y, sr, format='OGG', subtype='OPUS', compression_level=.9); print('  gebacken:', name)
