# AP „Echte Klänge“ (08.10.2026): ersetzt die letzten erzeugten Geräusche durch echte Aufnahmen – nur freie Quellen, Nachweis in CREDITS.md
#   Flügelschläge (Taube/Ente/Adler) · Feuer (Knistern, Knall, Zündung, Brandgeräusch) · Zombie-Röcheln · Öl/Schlamm-Glucksen · Funk (Röhrenempfänger, Squelch)
#   Tastenfeld-Piepen · Relais · Feuerzeug · Katze (Miauen, Fauchen, Schnurren) · Spinnen-/Käferkrabbeln
# Quellen: Sonniss GDC 2016/2018/2019 (lizenzfrei) über HAM_Audio/quellen5.py · freesound.org (nur CC0, Vorschau-MP3 128 kbps ohne Konto) in HAM_Audio/fsdl ·
#          Wikimedia Commons (CC0 / gemeinfrei) in HAM_Audio/commons.  Aufruf (in app/): python tools/klang_bau5.py [flug|feuer|zombie|oel|funk|taste|katze|krabbel|relais]
import os, sys, json, glob, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from klang_lib import *
FS = os.path.join(HAM, 'fsdl'); CM = os.path.join(HAM, 'commons')
def ld(path):  # beliebige Datei (wav/ogg/mp3/flac) -> 48 kHz, (n, 2)
    x, sr = sf.read(path, dtype='float32', always_2d=True); return st(resample(x, sr))
def fsx(id): return ld(glob.glob(os.path.join(FS, str(id).split('_')[0] + '_*-hq.mp3'))[0])
def cmx(key): return ld(glob.glob(os.path.join(CM, key + '.*'))[0])
def pitch(x, r): return resample(x, SR, int(SR / r))  # r < 1: tiefer und länger
def cut(x, a, b): return x[int(a * SR):int(b * SR)]
def seg(x, n, thr=-30, minl=.05, maxl=1.2, post=.12, gap=.08, fl=None):
    y = ffilt(x, fl) if fl else x; return segments(y, n, thr, minl, maxl, gap=gap, post=post)
def out(name, x, target=-23, pk=-3, lp=None, hp=30, mono_=True, q=.9, a=.003, r=.06):
    x = mono(x) if mono_ else st(x); x = ffilt(x, chain(HP(hp), LP(lp, 1)) if lp else HP(hp)); x = fade(x, min(a, len(x) / SR * .2), min(r, len(x) / SR * .4))
    save(name, norm(x, target, pk), q)
def loop(name, x, L, xf=2.0, target=-24, fl=None, q=.9, t0=0):
    x = st(cut(x, t0, t0 + L)); x = ffilt(x, fl or chain(HP(40), HSH(9000, -3))); save(name, mono(norm(loopify(x, xf), target, -3)), q)
def top(segs, n):  # die n lautesten (Spitze) – für Einzelereignisse
    segs = sorted(segs, key=lambda s: -np.abs(s).max()); return segs[:n]

def flug():  # Flügelschläge: Taube (kurz, schnell), Ente (Anlauf), Adler (schwer, lang) – Raben liegen dazwischen, darum leicht tiefer
    out('fx_flug_1', pitch(fsx('153277_2358240'), .92), -23, -3, 9000, 60, a=.01, r=.12)
    out('fx_flug_2', pitch(cut(fsx('414671_6651484'), 0, 1.3), .9), -23, -3, 9000, 60, a=.01, r=.12)
    d = fsx('719107_11244040'); out('fx_flug_3', pitch(cut(d, .9, 2.4), .9), -23, -3, 9000, 60, a=.02, r=.15)
    e = mono(fsx('568810_97550')); w = int(2.6 * SR); best = max(range(int(1 * SR), len(e) - w, int(.2 * SR)), key=lambda i: np.sqrt(np.mean(ffilt(e[i:i + w], chain(HP(60), LP(900))) ** 2)))
    out('fx_flug_4', pitch(e[best:best + w], .95), -23, -3, 7000, 50, a=.03, r=.25)

def feuer():
    ofen, holz, hl = mono(src('feu_ofen')), mono(src('feu_holz')), mono(src('feu_haus_lo'))
    K = []
    for x, thr in [(holz, -24), (ofen, -24), (hl, -26)]:
        K += seg(ffilt(x, HP(300)) * 1.0, 10, thr, .02, .3, .1, .03)
    K = top(K, 8)
    for i in range(6): out(f'fx_feuer_knist_{i + 1}', K[i], -29, -6, 14000, 200, a=.001, r=.05)
    P = []
    for x in (ofen, holz, mono(src('feu_haus_hi'))): P += seg(x, 6, -22, .05, .5, .15, .06, chain(HP(80), LP(2500)))
    P = top(P, 3)
    for i in range(3): out(f'fx_feuer_pop_{i + 1}', P[i], -24, -3, 9000, 60, a=.001, r=.12)
    z = st(src('feu_zuend')); f = st(src('feu_fackel'))
    wuff = np.zeros((int(4 * SR), 2), np.float32); zz = cut(z, 0, 3.6); wuff[:len(zz)] += zz; ff = cut(f, 0, 1.2); wuff[int(.02 * SR):int(.02 * SR) + len(ff)] += ff * .6
    out('fx_feuer_wuff', wuff, -20, -3, 12000, 30, mono_=False, a=.005, r=.5)
    loop('amb_feuer', src('feu_haus_hi'), 24, 2.5, -22, chain(HP(60), HSH(10000, -2)), t0=6)  # Brandgeräusch Hochbrand (lazy)
    loop('amb_feuer_lo', src('feu_haus_lo'), 24, 2.5, -24, chain(HP(60), HSH(10000, -2)), t0=6)  # Glut und Knistern (lazy)

def zombie():
    A = mono(src('zb_allg')); S = seg(A, 6, -32, .5, 3.6, .3, .25, chain(HP(80), LP(6000)))
    S += [mono(src('zb_b')), mono(src('zb_c'))]
    S = sorted(S, key=lambda s: -len(s))[:6]
    for i, s in enumerate(S): out(f'zb_roech_{i + 1}', pitch(s, [.94, .9, 1, .88, .96, .92][i]), -22, -3, 7000, 70, a=.01, r=.2)
    out('zb_zisch', mono(src('wd_zisch')), -22, -3, 9000, 200, a=.005, r=.15)

def oel():  # Öl/Schlamm: Blasen, Gluckser (tiefer gestimmt: zähe Flüssigkeit)
    g = mono(fsx('436905_1860061')); B = seg(g, 6, -26, .12, 1.2, .2, .1, chain(HP(80), LP(3000)))
    B += seg(mono(src('oel_blasen')), 2, -28, .1, 1.0, .15, .08) + seg(mono(src('oel_blub')), 2, -30, .05, .6, .1, .05) + seg(mono(src('oel_gross')), 2, -28, .05, .8, .1, .05)
    B += seg(mono(fsx('456806_9159316')), 3, -26, .12, 1.0, .15, .1, chain(HP(80), LP(3000)))
    B = top(B, 8)
    for i in range(6): out(f'fx_oel_blub_{i + 1}', pitch(B[i], [.8, .7, .85, .75, .9, .7][i]), -24, -4, 2800, 60, a=.004, r=.12)

def funk():
    h = fsx('433881_7872308'); st0 = mono(h)[int(30 * SR):int(60 * SR)]
    loop('fx_funk_stat', st0, 14, 1.5, -26, chain(HP(120), LP(6500, 1)))  # echter Röhrenempfänger (Hallicrafters SX-122) zwischen den Sendern
    S = seg(mono(src('funk_squelch')), 4, -26, .06, .7, .1, .06)
    S = top(S, 3)
    for i in range(3): out(f'fx_funk_klick_{i + 1}', S[i], -23, -3, 7000, 250, a=.002, r=.08)

def taste():
    T = []
    for k in ('867650_18961793', '840450_16786392'): T += seg(mono(fsx(k)), 8, -28, .02, .2, .02, .02)
    T += seg(mono(src('mikrowelle')), 6, -26, .03, .25, .03, .03)
    T = sorted(T, key=lambda s: -np.abs(s).max())[:4]
    for i in range(len(T)): out(f'ui_taste_{i + 1}', T[i], -25, -4, 11000, 150, a=.001, r=.03)

def relais():
    R = seg(st(src('relais')), 6, -28, .01, .12, .02, .02) + seg(mono(fsx('740252_16085440')), 1, -30, .01, .25, .02, .1) + [mono(fsx('384701_1067129'))]
    R = sorted(R, key=lambda s: -np.abs(s).max())[:3]
    for i in range(len(R)): out(f'fx_relais_{i + 1}', R[i], -24, -3, 9000, 60, a=.001, r=.06)
    for i, k in enumerate(['827017_12907331', '827025_12907331', '827019_12907331']): out(f'fx_feuerzeug_{i + 1}', fsx(k), -23, -3, 12000, 80, a=.001, r=.08)

def katze():
    out('fx_katze_miau_1', pitch(cmx('katze_miau1'), 1.0), -22, -3, 10000, 150, a=.005, r=.15)
    out('fx_katze_miau_2', pitch(cmx('katze_miau2'), 1.0), -22, -3, 10000, 150, a=.005, r=.15)
    f = mono(cmx('katze_fauch')); S = seg(f, 3, -30, .3, 2.5, .2, .2, chain(HP(500), LP(9000)))
    S = sorted(S, key=lambda s: -len(s))
    out('fx_katze_fauch_1', S[0], -22, -3, 12000, 300, a=.01, r=.25)
    out('fx_katze_fauch_2', S[1] if len(S) > 1 else pitch(S[0], 1.08), -22, -3, 12000, 300, a=.01, r=.25)
    out('fx_katze_fauch_3', pitch(S[0], .9), -22, -3, 11000, 250, a=.01, r=.25)
    p = mono(cmx('katze_schnurr3')); loop('fx_katze_schnurr', p, min(len(p) / SR - .2, 9.5), 1.0, -24, chain(HP(35), LP(2500, 1)))

def krabbel():  # Spinnen/Käfer: einzelne Schritte und ein Schwarm
    s = fsx('408572_7673623'); X = seg(mono(s), 6, -30, .05, .6, .1, .05, chain(HP(500), LP(9000)))
    X = top(X, 4)
    for i in range(len(X)): out(f'fx_krabbel_{i + 1}', X[i], -26, -5, 12000, 400, a=.002, r=.06)
    loop('amb_krabbel', fsx('380769_1732954'), 18, 2.0, -26, chain(HP(300), LP(11000, 1)), t0=4)  # Schwarm (lazy)

def tiere():  # Waldkauz, Fuchsschrei, Schwein – bisher stumm bzw. erzeugt; jetzt Aufnahmen (freesound CC0)
    o = mono(fsx('745208_8711646')); w = ffilt(o, chain(HP(200), LP(2500)))
    E = seg(o, 6, -30, .5, 3.2, .6, .35, chain(HP(200), LP(2500)))
    E = sorted(E, key=lambda t: -np.abs(t).max())[:3]
    for i in range(len(E)): out(f'fx_eule_{i + 1}', E[i], -24, -4, 3500, 180, a=.02, r=.5)
    f = mono(fsx('634005_13454867')); F = seg(f, 6, -28, .35, 2.5, .4, .2, chain(HP(300), LP(8000)))
    F = sorted(F, key=lambda t: -np.abs(t).max())[:3]
    for i in range(len(F)): out(f'fx_fuchs_{i + 1}', F[i], -22, -3, 9000, 250, a=.01, r=.3)
    P = [mono(fsx('442907_71257')), mono(fsx('536746_1415754'))]
    for i, t in enumerate(P): out(f'fx_schwein_{i + 1}', t, -22, -3, 4500, 70, a=.005, r=.12)
    out('fx_schwein_3', pitch(P[0], .85), -22, -3, 4500, 70, a=.005, r=.12)

def husten():  # Husten und Würgen (Männer), Körperfall
    for i, k in enumerate(['646654_13085623', '646657_13085623', '646653_13085623']): out(f'fx_husten_{i + 1}', fsx(k), -22, -3, 9000, 90, a=.005, r=.12)
    c = mono(fsx('318080_5057106')); W = seg(c, 4, -30, .4, 2.5, .3, .25, chain(HP(100), LP(7000)))
    W = sorted(W, key=lambda t: -len(t))[:2]
    for i in range(len(W)): out(f'fx_wuergen_{i + 1}', W[i], -22, -3, 8000, 90, a=.01, r=.2)

def kamera():  # Kamera (Kap. 5): Verschlussklicks, Blitz lädt auf
    K = seg(mono(src('kam_verschluss')), 4, -26, .01, .5, .05, .02)
    K = sorted(K, key=lambda t: -np.abs(t).max())[:3]
    for i in range(len(K)): out(f'fx_kamera_{i + 1}', K[i], -24, -3, 12000, 100, a=.001, r=.1)
    out('fx_blitz_laden', mono(src('kam_blitz'))[:int(5 * SR)], -26, -4, 12000, 200, a=.01, r=.3)

def nadel():  # Nadeldrucker (Amt, Zimmer 7): Zeilen-Bursts und Wagenvorschub
    N = [mono(src('nadel_a')), mono(src('nadel_b')), mono(src('nadel_kurz'))]
    for i, t in enumerate(N): out(f'fx_nadel_{i + 1}', t, -23, -4, 11000, 150, a=.002, r=.06)
    out('fx_nadel_servo', mono(src('nadel_servo')), -25, -4, 9000, 100, a=.01, r=.15)

def kauen():  # Kauen (Kap. 5, Tiere/Kinder): Bissen und Mahlen
    C = seg(mono(src('kauen')), 5, -30, .15, 1.2, .25, .1, chain(HP(150), LP(6000)))
    m = mono(src('kauen')); C += [cut(m, a, a + 1.1) for a in (1.5, 3.0, 4.5)]
    C = sorted(C, key=lambda t: -np.abs(t).max())[:3]
    for i in range(len(C)): out(f'fx_kauen_{i + 1}', C[i], -26, -4, 7000, 120, a=.005, r=.1)

JOBS = {'flug': flug, 'feuer': feuer, 'zombie': zombie, 'oel': oel, 'funk': funk, 'taste': taste, 'relais': relais, 'katze': katze, 'krabbel': krabbel, 'tiere': tiere, 'husten': husten, 'kamera': kamera, 'nadel': nadel, 'kauen': kauen}
if __name__ == '__main__':
    for k in (sys.argv[1:] or JOBS):
        print('==', k)
        try: JOBS[k]()
        except Exception as e: import traceback; traceback.print_exc()
    mf = os.path.join(OUT, 'manifest.json')
    if os.path.exists(mf): manifest.update({**json.load(open(mf)), **manifest})
    json.dump(manifest, open(mf, 'w'), indent=0, sort_keys=True)
