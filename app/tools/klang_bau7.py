# AP „Tier-Klaenge“ (15.10.2026): echte Aufnahmen fuer Ratte (Quieken) und Fliege (Summen, Schleife); Motten bleiben still (wie in Wirklichkeit).
# Quellen: freesound.org, ausschliesslich CC0 („No Rights Reserved“), als HQ-Vorschau ohne Konto geladen (Titel – Nutzer – Nummer):
#   Ratte:  ratSqueak.wav – Zabuhailo – 143125 · ratty squeaks.wav – Reitanna – 217767 · rat-squeak.wav – toefur – 288941 · Creature - Rat - Vocalizations – LandeAudio – 574107
#   Fliege: Single House Fly – Kinoton – 352057 · fly buzzing – cognito perceptu – 721120 · houseflies buzzing flying near mic – cognito perceptu – 476080
# Aufruf (in app/): python tools/klang_bau7.py [ratte|fliege]
import os, sys, json, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from klang_lib import *
D = r'C:\Users\GIGABYTE\HAM_FabDownloads\tier_snd'
def ld(f): x, sr = sf.read(os.path.join(D, f), dtype='float32', always_2d=True); return mono(resample(x.mean(1), sr))
def out(name, x, target=-30, pk=-4, lp=9000, hp=500, a=.004, r=.08):
    x = ffilt(mono(x), chain(HP(hp), LP(lp, 1))); x = fade(x, min(a, len(x) / SR * .2), min(r, len(x) / SR * .4)); save(name, norm(x, target, pk), .9)
def ratte():
    cand = []
    for f, thr in (('rat_143125.mp3', -26), ('rat_217767.mp3', -28), ('rat_288941.mp3', -24), ('rat_574107.mp3', -28)):
        x = ffilt(ld(f), HP(700)); S = segments(x, 6, thr, .08, 1.0, gap=.08, post=.05)
        cand += [(f, s) for s in S if .1 <= len(s) / SR <= .9]
    # je Quelle hoechstens 2, nach Spitzenpegel
    pick = []; cnt = {}
    for f, s in sorted(cand, key=lambda c: -np.abs(c[1]).max()):
        if cnt.get(f, 0) >= 2 or len(pick) >= 6: continue
        cnt[f] = cnt.get(f, 0) + 1; pick.append(s)
    for i, s in enumerate(pick): out(f'fx_ratte_{i + 1}', s, -32, -6, 12000, 900, a=.004, r=.06)
def fliege():
    x = ffilt(ld('fly_352057.mp3'), chain(HP(250))); seg = x[int(4 * SR):int(13 * SR)]
    out_ = loopify(seg[:, None], 2.0)[:, 0]; out_ = ffilt(out_, chain(HP(200), LP(9000, 1))); save('amb_fliege', norm(out_, -34, -6), .9)
JOBS = {'ratte': ratte, 'fliege': fliege}
if __name__ == '__main__':
    for k in (sys.argv[1:] or JOBS):
        print('==', k)
        try: JOBS[k]()
        except Exception: import traceback; traceback.print_exc()
    mf = os.path.join(OUT, 'manifest.json')
    if os.path.exists(mf): manifest.update({**json.load(open(mf)), **manifest})
    json.dump(manifest, open(mf, 'w'), indent=0, sort_keys=True)
