# Q-1 Wendigo-Laute aus echten Aufnahmen (Sonniss GDC 2017–2019, lizenzfrei; Quellen in HAM_Audio/quellen.py, Schlüssel wd_*) – geschichtet, nie Oszillatoren.
# knochen (Knacken unter Spannung) · schritt (nasse Fleischtritte) · atem (schwer, nass) · knurr (tief) · ruf (verzerrter Hirschruf mit Menschenstöhnen darunter)
# fleisch (Reißen/Quetschen) · schnueff (Spurensuche) · huf (schwerer Tritt mit Knochen) · stoehn
# Aufruf (in app/): python tools/klang_wendigo.py   → game/audio/wd_*.ogg (+ manifest.json)
import os, json, numpy as np
from klang_lib import *
from klang_bau2 import pnorm
R = np.random.default_rng(1992)
def pitch(x, r):  # r < 1: tiefer und länger (wie langsamer abgespielt)
    return resample(x, SR, int(SR / r))
def lay(*parts):  # (Signal, Versatz s, Pegel) übereinander
    L = max(int(o * SR) + len(st(x)) for x, o, g in parts); y = np.zeros((L, 2), np.float32)
    for x, o, g in parts: x = st(x); a = int(o * SR); y[a:a + len(x)] += x * g
    return y
def sat(x, k=2.0): return np.tanh(x * k) / np.tanh(k)
def seg(key, n, thr=-30, minl=.06, maxl=1.2, post=.15, fl=None):
    x = src(key); x = ffilt(x, fl) if fl else x; return segments(x, n, thr, minl, maxl, post=post)
def out(name, x, pk=-4, lp=None, hp=30):
    x = ffilt(st(x), chain(HP(hp), LP(lp or 16000, 1))); save(name, pnorm(fade(x, .003, .06), pk), .9)
def bau():
    kn = seg('wd_knochen', 10, -26, .05, .55, .08) + seg('wd_knacks', 4, -24, .03, .4, .06); kn.sort(key=lambda y: -np.abs(y).max())
    tief = seg('wd_matsch', 2, -24, .05, .4)
    for i in range(6):  # Knacken unter Spannung: Knochen + ein dumpfer, tiefer Körper darunter
        a = kn[i % len(kn)]; b = pitch(tief[i % len(tief)], .55); out(f'wd_knochen_{i + 1}', lay((a, 0, 1), (b, .005, .45)), -3, 9000, 60)
    nass = seg('wd_tomate', 8, -28, .08, .7) + seg('wd_orange', 4, -26, .06, .5); hufe = seg('wd_hufe', 8, -30, .04, .35, .06)
    for i in range(6):  # nasse Schritte: Tritt im Laub + Quetschen darunter, tiefer
        out(f'wd_schritt_{i + 1}', lay((pitch(hufe[i % len(hufe)], .8), 0, .9), (pitch(nass[i % len(nass)], .85 + .05 * (i % 3)), .02, .8)), -6, 6000, 50)
    at = seg('wd_atem_yeti', 6, -30, .5, 1.8, .2) + seg('wd_atem_asmr', 6, -30, .5, 1.6, .2); schl = seg('wd_schleim', 6, -30, .3, 1.5)
    for i in range(3):  # Atem: schwer, ein nasser Rest im Hals
        out(f'wd_atem_{i + 1}', lay((pitch(at[i], .82), 0, 1), (pitch(schl[i], .9), .1, .22)), -8, 7000, 60)
    gr = seg('wd_knurr_mund', 3, -30, .6, 2.2, .2) + seg('wd_troll', 3, -30, .6, 2.2) + seg('wd_zunge', 3, -30, .6, 2.2) + seg('wd_grummel', 2, -30, .4, 1.5)
    for i in range(4):  # Knurren: tief, mit Sub darunter (dieselbe Aufnahme eine Oktave tiefer, leise)
        a = pitch(gr[i * 2 % len(gr)], .78); out(f'wd_knurr_{i + 1}', lay((a, 0, 1), (pitch(a, .5), 0, .35)), -5, 5000, 35)
    ruf = seg('wd_hirschruf', 6, -24, .8, 3.0, .4, chain(HP(80), LP(6000))); st_ = seg('wd_stoehn', 3, -30, .6, 2.5) + seg('wd_bestie', 2, -30, .4, 2)
    for i in range(3):  # Ruf: Hirschröhren tiefer, darunter ein menschliches Stöhnen, leicht verzerrt – zu nah an einer Stimme
        a = pitch(ruf[i], .72); b = pitch(st_[i % len(st_)], .8); y = lay((a, 0, 1), (b, .15, .55), (pitch(a, 1.04), .03, .3)); out(f'wd_ruf_{i + 1}', sat(pnorm(y, -3), 1.8), -3, 7000, 50)
    fl = seg('wd_reiss', 2, -26, .1, 1.0) + seg('wd_quetsch', 3, -28, .3, 1.6) + seg('wd_mutation', 3, -28, .4, 1.8)
    for i in range(3): out(f'wd_fleisch_{i + 1}', lay((fl[i], 0, 1), (pitch(fl[(i + 3) % len(fl)], .8), .05, .6)), -4, 10000, 60)
    sn = seg('wd_schnueff', 4, -30, .2, 1.4)
    for i in range(2): out(f'wd_schnueff_{i + 1}', pitch(sn[i], .9), -8, 9000, 120)
    for i in range(4):  # schwerer Tritt: Huf tief, Boden-Wumms, ein Knochen tickt mit
        out(f'wd_huf_{i + 1}', lay((pitch(hufe[(i + 2) % len(hufe)], .6), 0, 1), (pitch(tief[i % len(tief)], .45), 0, .7), (kn[(i + 5) % len(kn)], .04, .25)), -3, 5000, 35)
    sto = seg('wd_stoehn', 3, -30, .8, 2.6) + seg('wd_zombie', 1, -30, .4, 1.5) + seg('wd_bestie', 1, -30, .4, 2)
    for i in range(3): out(f'wd_stoehn_{i + 1}', pitch(sto[i], .85), -5, 6000, 50)
if __name__ == '__main__':
    bau()
    mf = os.path.join(OUT, 'manifest.json')
    if os.path.exists(mf): manifest.update({**json.load(open(mf)), **manifest})
    json.dump(manifest, open(mf, 'w'), indent=0, sort_keys=True)
