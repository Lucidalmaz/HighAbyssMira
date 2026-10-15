# AP „Fledermaus-Rufe“ (15.10.2026): echte Aufnahmen von Fledermaus-Ortungs-/Sozialrufen und Jagd-Buzz, hörbar gemacht (Detektor/Zeitdehnung der Quelle), plus leiser Flügelschlag.
# Quellen (Wikimedia Commons, ohne Konto):
#   Hoary_bat_chirp_recording.wav  – Kaldari – CC0           -> fx_fleder_1..4 (Rufreihen)
#   Bat_feeding_buzz.wav           – Kaldari – CC0           -> fx_fleder_jagd_1..2 (Jagd-Buzz)
#   Yannick Dauby – Bats echolocation (CC by).ogg – Yannick Dauby – CC BY 2.5 -> fx_fleder_5..6 (Ortungsrufe, Gruppe)
#   fx_fleder_fluegel_1..2: abgeleitet aus den vorhandenen Flügelschlag-Aufnahmen fx_flug_* (CC0/lizenzfrei, siehe CREDITS.md), höher, kürzer, sehr leise (Hautflügel)
# Aufruf (in app/): python tools/klang_bau6.py
import os, sys, json, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from klang_lib import *
D = r'C:\Users\GIGABYTE\HAM_FabDownloads\bat_snd'
def ld(f): x, sr = sf.read(os.path.join(D, f), dtype='float32', always_2d=True); return mono(resample(x.mean(1), sr))
def out(name, x, target=-30, pk=-4, lp=9000, hp=500, a=.004, r=.08):
    x = ffilt(mono(x), chain(HP(hp), LP(lp, 1))); x = fade(x, min(a, len(x) / SR * .2), min(r, len(x) / SR * .4)); save(name, norm(x, target, pk), .9)
def calls():
    H = ffilt(ld('Hoary_bat_chirp_recording.wav'), HP(500)); S = segments(H, 40, -28, .04, 2.5, gap=.15, post=.1)
    S = [s for s in S if .4 <= len(s) / SR <= 1.2]; S = sorted(S, key=lambda s: -np.abs(s).max())[:4]
    for i, s in enumerate(S): out(f'fx_fleder_{i + 1}', s, -26, -4, 8000, 700)
    Y = ffilt(ld('yannick.ogg'), HP(500)); S = segments(Y, 40, -30, .04, 2.5, gap=.15, post=.1)
    S = [s for s in S if .5 <= len(s) / SR <= 1.4]; S = sorted(S, key=lambda s: -np.abs(s).max())[:2]
    for i, s in enumerate(S): out(f'fx_fleder_{5 + i}', s, -26, -4, 9000, 900)
    B = ffilt(ld('Bat_feeding_buzz.wav'), HP(500)); S = segments(B, 40, -30, .04, 2.5, gap=.15, post=.1)
    S = [s for s in S if len(s) / SR >= .3]; S = sorted(S, key=lambda s: -np.abs(s).max())[:2]
    for i, s in enumerate(S): out(f'fx_fleder_jagd_{i + 1}', s, -26, -4, 8000, 700)
def fluegel():
    for i, n in enumerate(['fx_flug_1', 'fx_flug_2']):
        x, sr = sf.read(os.path.join(OUT, n + '.ogg'), dtype='float32', always_2d=True); x = mono(resample(x.mean(1), sr))
        x = x[:int(.9 * SR)]; y = resample(x, SR, int(SR / 1.45))   # schneller/höher: kleinere, dünnere Flügel
        out(f'fx_fleder_fluegel_{i + 1}', y, -34, -8, 5200, 180, a=.02, r=.15)
JOBS = {'calls': calls, 'fluegel': fluegel}
if __name__ == '__main__':
    for k in (sys.argv[1:] or JOBS):
        print('==', k)
        try: JOBS[k]()
        except Exception: import traceback; traceback.print_exc()
    mf = os.path.join(OUT, 'manifest.json')
    if os.path.exists(mf): manifest.update({**json.load(open(mf)), **manifest})
    json.dump(manifest, open(mf, 'w'), indent=0, sort_keys=True)
