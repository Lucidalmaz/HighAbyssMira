# R-10 Peter (Zahn-Mann) und die Flucht im langen Gang – nur echte Aufnahmen (Sonniss GDC 2017–2019, lizenzfrei; Quellen in HAM_Audio/quellen.py, Schlüssel pz_* und wd_*)
# pz_schritt (nackter, nasser Fuß auf Beton) · pz_schlurf (Fuß schleift nach) · pz_zahn (Zähne mahlen, nasser Mund) · pz_atem (rasselnd, menschlich) · pz_lachen (gebrochen, tonlos)
# pz_fall (Körper auf Beton) · pz_herz (ein Herzschlag, Lukes Puls) · pz_keuch (Luke ringt nach Luft) · pz_stoehn (Luke reißt sich los) · pz_stoff (Griff in den Stoff)
# Aufruf (in app/): python tools/klang_peter.py   → game/audio/pz_*.ogg (+ manifest.json)
import os, json, numpy as np
from klang_lib import *
from klang_bau2 import pnorm
def pitch(x, r): return resample(x, SR, int(SR / r))  # r < 1: tiefer und länger
def lay(*parts):
    L = max(int(o * SR) + len(st(x)) for x, o, g in parts); y = np.zeros((L, 2), np.float32)
    for x, o, g in parts: x = st(x); a = int(o * SR); y[a:a + len(x)] += x * g
    return y
def seg(key, n, thr=-30, minl=.06, maxl=1.2, post=.15, fl=None):
    x = src(key); x = ffilt(x, fl) if fl else x; return segments(x, n, thr, minl, maxl, post=post)
def out(name, x, pk=-4, lp=None, hp=30):
    x = ffilt(st(x), chain(HP(hp), LP(lp or 16000, 1))); save(name, pnorm(fade(x, .003, .06), pk), .9)
def bau():
    # Schritte: Flip-Flop-Klatschen (nackte Sohle) + ein Hauch nasses Quetschen, tiefer – ein schwerer Mann, barfuß auf nassem Beton
    fl = seg('pz_flip', 10, -26, .04, .35, .05); nass = seg('wd_tomate', 6, -28, .06, .5)
    for i in range(6): out(f'pz_schritt_{i + 1}', lay((pitch(fl[i % len(fl)], .78 + .03 * (i % 3)), 0, 1), (pitch(nass[i % len(nass)], .9), .012, .35)), -7, 5200, 45)
    sc = seg('pz_scharr', 4, -32, .15, .9, .1)
    for i in range(3): out(f'pz_schlurf_{i + 1}', pitch(sc[i % len(sc)], .8), -12, 6000, 60)
    # Zähne: nasses Kauen/Knirschen, etwas tiefer, dazu ein feines Knacken (Kiefer)
    mu = seg('pz_mund', 6, -30, .12, .9, .08); kn = seg('wd_knacks', 4, -24, .03, .3, .05)
    for i in range(3): out(f'pz_zahn_{i + 1}', lay((pitch(mu[i % len(mu)], .86), 0, 1), (pitch(kn[i % len(kn)], 1.4), .08 + .05 * i, .18)), -9, 7000, 90)
    # Atem: menschliches Ausatmen (ohne Monster-Knurren: tief- und hochgefiltert), darunter nasser Mund
    at = seg('pz_atem', 6, -32, .4, 1.6, .2, chain(HP(140), LP(5200))); wm = seg('wd_atem_asmr', 6, -30, .4, 1.4, .2)
    for i in range(4): out(f'pz_atem_{i + 1}', lay((pitch(at[i % len(at)], [.9, .96, .86, 1.0][i]), 0, 1), (wm[i % len(wm)], .05, .3)), -10, 6000, 80)
    # Lachen: nur die gebrochenen Luftstöße, tiefer, dumpf – kein Comic-Lachen
    la = seg('pz_lachen', 6, -26, .08, .45, .06)
    for i in range(3): out(f'pz_lachen_{i + 1}', lay((pitch(la[i % len(la)], [.74, .7, .79][i]), 0, 1), (pitch(at[(i + 2) % len(at)], .9), .02, .4)), -12, 3200, 90)
    # Körper fällt auf nassen Beton (Peter im Öl, Luke stürzt)
    fa = seg('pz_fall', 2, -30, .05, .9, .3)
    out('pz_fall_1', lay((fa[0], 0, 1), (pitch(nass[0], .7), .01, .5)), -3, 9000, 40)
    out('pz_fall_2', lay((pitch(fa[0], .85), 0, 1), (pitch(nass[1 % len(nass)], .6), .02, .6)), -3, 7000, 35)
    # Herz: einzelne Schläge (lub-dub) aus der Aufnahme, das Spiel taktet sie selbst
    hz = seg('pz_herz', 8, -24, .15, .7, .08, chain(HP(25), LP(900)))
    for i in range(3): out(f'pz_herz_{i + 1}', hz[i * 2 % len(hz)], -3, 1200, 20)
    # Luke: nach Luft schnappen (Hand vor dem Mund passt: ein Gesicht in fremden Händen), sich losreißen
    ke = seg('pz_keuch', 6, -28, .15, .8, .1)
    for i in range(3): out(f'pz_keuch_{i + 1}', ke[i % len(ke)], -9, 9000, 90)
    gr = seg('pz_stoehn', 2, -30, .1, 1.0, .15)
    out('pz_stoehn_1', gr[0], -8, 9000, 80)
    sf_ = seg('pz_stoff', 4, -32, .1, .8, .1)
    for i in range(2): out(f'pz_stoff_{i + 1}', pitch(sf_[i % len(sf_)], [1.0, .88][i]), -11, 10000, 80)
if __name__ == '__main__':
    bau()
    mf = os.path.join(OUT, 'manifest.json')
    if os.path.exists(mf): manifest.update({**json.load(open(mf)), **manifest})
    json.dump(manifest, open(mf, 'w'), indent=0, sort_keys=True)
