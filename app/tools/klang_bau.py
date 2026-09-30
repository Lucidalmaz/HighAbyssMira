# Klang-Bau: erzeugt game/audio/*.ogg (Opus) – Musik aus echten Instrumenten-Samples (VSCO 2 CE, CC0), Klangbetten und Einzelgeräusche
# aus den Sonniss-GDC-Bündeln (lizenzfrei). Quellen liegen außerhalb des Repos in C:\Users\GIGABYTE\HAM_Audio (vsco/, src/ – siehe quellen.py dort).
#   python app/tools/klang_bau.py [musik] [bank] [betten] [einzel]     (ohne Angabe: alles)
import sys, os, json, glob, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from klang_lib import *
V = os.path.join(HAM, 'vsco')
def one(p, g=1.0):  # einzelnes Sample (Schlagwerk)
    x, sr = sf.read(os.path.join(V, p), dtype='float32'); return resample(st(x), sr) * g
_I = {}
def I(k):
    if k in _I: return _I[k]
    spec = {'pno': ('Keys/Upright Piano/*dyn1*', r'_(\d\d\d)\.wav', 0), 'pno2': ('Keys/Upright Piano/*dyn2*', r'_(\d\d\d)\.wav', 0),
            'vc': ('Strings/Cello Section/susvib/*', r'_([A-G]#?\d)_', 1), 'vct': ('Strings/Cello Section/trem/*', r'_([A-G]#?\d)_', 1),
            'cb': ('Strings/Solo Contrabass/SusNV/*', r'_([A-G]#?\d)_', 1), 'cbt': ('Strings/Solo Contrabass/Trem/*', r'_([A-G]#?\d)_', True),
            'vla': ('Strings/Viola Section/susvib/*', r'_([A-G]#?\d)_', 1), 'vlat': ('Strings/Viola Section/trem/*', r'_([A-G]#?\d)_', True),
            'vln': ('Strings/Violin Section/susVib/*', r'_([A-G]#?\d)_', 1), 'vlnt': ('Strings/Violin Section/Trem/*', r'_([A-G]#?\d)_', True),
            'harp': ('Strings/Harp/*', r'_([A-G]#?\d)_', 0), 'glock': ('Percussion/Glock/*', r'_([A-G]#?\d)\.', 1), 'tb': ('Percussion/TB_hit*', r'_([A-G]#?\d)_', 0)}[k]
    _I[k] = Inst(*spec); return _I[k]
MOTIV = ['E5', 'D5', 'C5', 'B4', 'C5']  # Lucys Spieluhr (E – D – C – H – C)
def box(f, v=1.0, dec=2.0, det=0.0):  # Spieluhr: Glockenspiel-Zinke, kurz ausklingend, leicht verstimmt, ohne Tiefen
    y = I('glock').note(f * 2 ** (det / 1200)); t = np.arange(len(y)) / SR; y = y * np.exp(-t / dec)[:, None]
    return ffilt(y, chain(HP(500), LP(7500, 1))) * v
def pad(c, notes, t, dur, v, inst='vla', a=4, r=5, pan=0):
    for i, n in enumerate(notes): c.add(I(inst).long(N(n), dur, v, a, r), t, 1, pan + (i - len(notes) / 2) * .15)
def master(c, name, wet=.4, sec=4.5, target=-24, lp=None, hp=40, loop=None, q=.86):
    x = c.x
    if loop is None: x = reverb(x, sec, wet)
    x = ffilt(x, chain(HP(hp), LP(lp, 1)) if lp else HP(hp))
    if loop: x = loop(x)
    save(name, norm(x, target, -3), q)
def cyc(render, L, wet=.4, sec=4.5):  # nahtlose Schleife: drei Durchläufe rendern (Halteklänge über die ganze Länge), den mittleren nehmen
    c = Canvas(3 * L + sec + 1); render(c, 3 * L)
    for k in range(3): render(c, None, k * L)
    x = reverb(c.x, sec, wet); return loopify(x[int(L * SR):int((2 * L + 1.5) * SR)], 1.5)  # Ereignisse sind periodisch, Haltetöne nicht: Naht überblenden (+ Rand, siehe loopify)
def musik():
    R = np.random.default_rng(64)
    # ---- Ort (Erkundung, Dorf bei Nacht): ein fernes, weiches Klavier, sehr viel Luft; tiefer Kontrabass-Grund, spät ein Cello
    c = Canvas(78); c.add(ffilt(I('cb').long(N('A1'), 30, .22, 7, 9), LP(380)), 2)
    for n, t in [('A3', 3), ('E4', 8.5), ('C4', 14), ('B3', 19.5), ('A3', 27), ('E4', 34), ('D4', 38.5), ('C4', 42), ('B3', 46), ('C4', 50.5), ('G3', 58), ('A3', 64)]:
        c.add(I('pno').note(N(n)), t + R.uniform(0, .25), .55, R.uniform(-.25, .25))
    c.add(I('vc').long(N('F2'), 20, .12, 6, 7), 36, 1, -.2); c.add(I('vln').long(N('E5'), 14, .035, 5, 6), 45, 1, .3)
    master(c, 'mu_ort', .45, 4.2, lp=6000)
    # ---- Unruhe (überall): Kontrabass A gegen B, Bratschen-Tremolo ganz leise, ein tiefer Klavier-Cluster, gestrichenes Becken, Gong-Kratzen
    c = Canvas(56); c.add(I('cb').long(N('A1'), 46, .34, 6, 6), 0); c.add(I('cb').long(N('A#1'), 32, .22, 7, 6), 6, 1, .2)
    c.add(ffilt(I('vlat').long(N('G4'), 20, .05, 6, 5), LP(3500)), 14, 1, -.3)
    c.add(I('pno2').note(N('A1')), 21, .5, -.1); c.add(I('pno2').note(N('A#1')), 21.03, .4, .1)
    c.add(one('Percussion/susCymb1-bow-3.wav', .35), 28, 1, .4); c.add(one('Percussion/gongscrape_pp.wav', .5), 36, 1, -.3)
    master(c, 'mu_unruhe', .45, 4.8, lp=5000)
    # ---- Friedhof: Streicher-Choräle d-Moll → B → g → A, eine ferne Röhrenglocke, drei Harfentöne
    c = Canvas(66)
    for i, ch in enumerate([['D3', 'F3', 'A3'], ['A#2', 'D3', 'F3'], ['G2', 'A#2', 'D3'], ['A2', 'C#3', 'E3']]):
        pad(c, ch[1:], i * 14, 17, .1, 'vla', 5, 6); c.add(I('vc').long(N(ch[0]), 17, .12, 5, 6), i * 14, 1, -.2)
    for t in (1, 30): c.add(ffilt(I('tb').note(N('D4')), LP(2500)), t, .3, .5)
    for n, t in [('A4', 30), ('F4', 33.5), ('E4', 36)]: c.add(I('harp').note(N(n)), t, .35, -.3)
    master(c, 'mu_friedhof', .5, 5.5, lp=6500)
    # ---- Wald: Grund auf D, Harfe wie Tropfen, gestrichenes Becken, spät ein Cello
    c = Canvas(70); c.add(I('cb').long(N('D1'), 60, .3, 8, 8), 0); c.add(I('vc').long(N('A2'), 34, .1, 8, 8), 10, 1, .2)
    for n, t in [('D5', 12), ('F5', 13.8), ('E5', 15.2), ('C5', 18), ('D5', 34), ('A4', 36.2), ('C5', 38), ('D5', 39.6)]: c.add(I('harp').note(N(n)), t, .32, R.uniform(-.4, .4))
    c.add(one('Percussion/susCymb1-bow-1.wav', .18), 44, 1, -.3); c.add(I('vc').long(N('D3'), 16, .1, 6, 6), 46, 1, -.1)
    master(c, 'mu_wald', .5, 5, lp=6000)
    # ---- Amt: Kontrabass Cis gegen D, gedämpfte Pauken-Reibung als Puls, hohe Geigen-Flageoletts, Gong-Kratzen, einzelne tiefe Klaviertöne
    c = Canvas(58); c.add(I('cb').long(N('C#2'), 52, .28, 6, 5), 0); c.add(I('cb').long(N('D2'), 30, .14, 8, 6), 10, 1, .2)
    rub = sorted(glob.glob(os.path.join(V, 'Percussion', 'bassdrum_rub*.wav')))
    for k, t in enumerate(np.arange(1, 54, 3.6)): c.add(one(os.path.relpath(rub[k % len(rub)], V), .35), t, 1, R.uniform(-.2, .2))
    c.add(ffilt(I('vln').long(N('C#6'), 12, .03, 5, 5), HP(800)), 10, 1, .4); c.add(one('Percussion/gongscrape_mf.wav', .3), 24, 1, -.3)
    for t in (2, 30): c.add(I('pno').note(N('C#2')), t, .5)
    master(c, 'mu_amt', .38, 3.8, lp=5500)
    # ---- Kanal: Grundton A, hohe Harfe mit langem Hall (Wassertropfen), Vibraphon
    c = Canvas(64); c.add(I('cb').long(N('A1'), 58, .22, 8, 8), 0)
    for n, t in [('A5', 4), ('C6', 6.5), ('D6', 9), ('E6', 11.5), ('C6', 15), ('A5', 19), ('G5', 23), ('E5', 27), ('G5', 32), ('A5', 36), ('D6', 42), ('C6', 46), ('A5', 50)]:
        c.add(I('harp').note(N(n) / 2), t, .3, R.uniform(-.5, .5))
    for t in (20, 44): c.add(one('Percussion/vibraring_v1_rr1.wav', .25), t, 1, .3)
    master(c, 'mu_kanal', .55, 6.5, lp=6500)
    # ---- Villa: Harfen-Walzer (3/4, 64 bpm), am Ende die Spieluhr, einen Hauch zu tief
    c = Canvas(58); beat = 60 / 64; t = 1; mel = ['E5', 'D5', 'C5', 'B4', 'C5', None, 'E5', 'A4', None, 'D5', 'C5', 'B4', 'A4', 'G#4', 'A4', None]
    for bar in range(16):
        bass = ['A2', 'E2', 'D2', 'E2'][bar % 4]; c.add(I('harp').note(N(bass)), t, .4, -.3); c.add(I('harp').note(N(bass) * 1.5), t + beat, .2, -.1); c.add(I('harp').note(N(bass) * 2), t + 2 * beat, .18, -.1)
        if mel[bar]: c.add(I('harp').note(N(mel[bar]) * (.985 if bar > 11 else 1)), t + .02, .38, .25)
        t += beat * 3
    for i, n in enumerate(MOTIV): c.add(box(N(n) * 2 * .97, .5, 2.2), t + .5 + i * .7, 1, .1)
    master(c, 'mu_villa', .42, 4, lp=7000)
    # ---- Weiß (Nimmerheim): hohe, stehende Geigen, Bratsche darunter, die Spieluhr langsam wie aus einem anderen Raum
    c = Canvas(60); pad(c, ['A4', 'E5'], 0, 52, .06, 'vln', 8, 8); c.add(I('vla').long(N('E4'), 44, .06, 8, 8), 4, 1, -.3)
    for i, n in enumerate(MOTIV): c.add(box(N(n) * 2, .45, 3), 20 + i * 2.2, 1, R.uniform(-.3, .3))
    master(c, 'mu_weiss', .6, 7, lp=7000, hp=120)
    # ---- Traum (Einstieg): Spieluhr zweimal, Streicherfläche, Kontrabass, am Ende Klavier und Glocke
    c = Canvas(68); pad(c, ['A3', 'E4'], 0, 58, .07, 'vla', 8, 8); c.add(I('vln').long(N('C5'), 50, .04, 10, 8), 6, 1, .3); c.add(I('cb').long(N('A1'), 60, .18, 8, 8), 0)
    t = 6
    for rep in range(2):
        for i, n in enumerate(MOTIV): c.add(box(N(n) * 2 * (1 - rep * .02), .55, 2.4), t, 1, R.uniform(-.2, .2)); t += .9 + i * .1
        t += 9
    c.add(I('pno').note(N('A2')), 50, .5); c.add(ffilt(I('tb').note(N('A4')), LP(3000)), 50.2, .25, .4)
    master(c, 'mu_traum', .5, 6, lp=7000)
    # ---- Menü: Grund, Spieluhr, Klavier-Echo des Motivs, hohe Geigen, das Motiv bricht ab (Schleife)
    c = Canvas(84); c.add(I('cb').long(N('A1'), 80, .2, 8, 6), 0); pad(c, ['A2', 'E3'], 0, 34, .06, 'vc', 8, 8); pad(c, ['F2', 'C3'], 38, 34, .05, 'vc', 8, 8)
    t = 5
    for i, n in enumerate(MOTIV): c.add(box(N(n) * 2, .5, 2.4, R.uniform(-8, 8)), t, 1, .1); t += .75 + i * .08
    for i, n in enumerate(MOTIV): c.add(I('pno').note(N(n) / 2), 28 + i * 1.3, .45, -.15)
    c.add(I('vln').long(N('E5'), 18, .035, 6, 6), 50, 1, .3); c.add(one('Percussion/susCymb1-bow-2.wav', .15), 42, 1, -.4)
    for i, n in enumerate(MOTIV[:3]): c.add(box(N(n) * 2 * .96, .4, 2.4), 64 + i * 1.1, 1, .1)
    master(c, 'mu_menue', .5, 5.5, lp=7000)
    # ---- Lauern (Keller Nr. 7): D gegen Es, Cello, tropfende Harfentöne, ferne Glocke, drei Spieluhrtöne, die abbrechen
    c = Canvas(56); c.add(I('cb').long(N('D1'), 50, .3, 7, 6), 0); c.add(I('cb').long(N('D#2'), 40, .13, 8, 6), 4, 1, .3); c.add(I('vc').long(N('D2'), 40, .1, 6, 6), 4, 1, -.2)
    for t in np.arange(6, 46, 7.3): c.add(I('harp').note(N(['D5', 'D#5', 'A4'][int(t) % 3])), t + R.uniform(0, 2), .18, R.uniform(-.5, .5))
    c.add(ffilt(I('tb').note(N('D#4')), LP(2000)), 14, .25, -.4)
    for i, n in enumerate(MOTIV[:3]): c.add(box(N(n) * 2 * .94, .35, 2), 38 + i * 1.3, 1, .2)
    master(c, 'mu_lauern', .45, 4.5, lp=5500)
    schleifen()
    # ---- Momente (Einzelstücke): Fund, Verlust, Kapitelende
    c = Canvas(10); c.add(I('vc').long(N('A2'), 6, .09, 2, 3), 0)
    for i, n in enumerate(MOTIV[:3]): c.add(I('pno').note(N(n)), .3 + i * .9, .4, .1)
    master(c, 'cue_fund', .5, 4, lp=6500)
    c = Canvas(16); c.add(I('cb').long(N('A1'), 12, .2, 3, 4), 0)
    for i, n in enumerate(['E3', 'D3', 'C3', 'B2', 'A2']): c.add(I('vc').long(N(n), 3.2, .16, .8, 1.2), .5 + i * 2.4, 1, -.1)
    master(c, 'cue_verlust', .45, 4.5, lp=5500)
    c = Canvas(26); pad(c, ['A2', 'E3', 'C4'], 0, 20, .09, 'vla', 6, 6); c.add(I('cb').long(N('A1'), 20, .2, 5, 6), 0)
    t = 2
    for i, n in enumerate(MOTIV * 2): c.add(box(N(n) * 2 * (1 - i * .003), .5, 2.4), t, 1, .1); t += .8 + i * .06
    c.add(I('pno').note(N('A1')), 16, .5)
    master(c, 'cue_ende', .5, 5.5, lp=7000)
    # ---- Spieluhr (Audio.musicBox): die ganze Melodie, die sich langsam abspult
    notes = [659, 587, 523, 494, 523, 587, 659, 659, 587, 523, 494, 440, 494, 523, 494, 440, 392, 440, 494, 440]; c = Canvas(16); t = .1
    for i, f in enumerate(notes): c.add(box(f * 2 * (1 - i * .0025), .6, 2.2, R.uniform(-6, 6)), t, 1, 0); t += .42 + i * .025
    master(c, 'mb_spieluhr', .18, 1.6, target=-20, hp=300)
    # ---- Klaviertöne (Rätsel im Amt: Audio.pianoNote C D E F G A H)
    for k, n in zip('CDEFGAH', ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5']):
        c = Canvas(4.5); c.add(I('pno2').note(N(n), 3.8, 1, 0, .6), 0); master(c, 'pn_' + k, .15, 1.8, target=-18)
def schleifen():  # nahtlose Musik-Schleifen (Gefahr, Verfolgung)
    R = np.random.default_rng(64)
    # ---- Gefahr (Schleife 48 s): Herzschlag aus großer Trommel, Kontrabass/Cello-Tremolo A gegen B, oben Geigen-Tremolo
    bd = [one('Percussion/BDrumNewhit_v5_rr1_Sum.wav'), one('Percussion/BDrumNewhit_v7_rr1_Sum.wav')]
    def gef(c, full, o=0.0):
        if full is not None:
            c.add(I('cbt').long(N('A1'), full, .28, 3, 3), 0); c.add(I('cbt').long(N('A#1'), full, .2, 3, 3), 0, 1, .2)
            c.add(ffilt(I('vct').long(N('E2'), full, .12, 3, 3), LP(2500)), 0, 1, -.2); return
        for k in range(60):
            t = o + k * .8; c.add(bd[k % 2], t, .5 if k % 2 == 0 else .3, 0)
        c.add(ffilt(I('vlnt').long(N('A4'), 22, .045, 7, 4), LP(4500)), o + 20, 1, .35); c.add(ffilt(I('vlnt').long(N('A#4'), 18, .035, 7, 4), LP(4500)), o + 24, 1, -.35)
        c.add(one('Percussion/susCymb1-bow-4.wav', .2), o + 30, 1, .2)
    x = cyc(gef, 48, .35, 3.5); save('mu_gefahr', norm(ffilt(x, chain(HP(35), LP(6000, 1))), -22, -3), .86)
    # ---- Verfolgung (Schleife 32 s, 120 bpm) + obere Schicht (chaseLevel): Trommeln synkopiert, tiefe Tremoli steigen, Klavier-Schläge; oben Geigen-Cluster
    tp = sorted(glob.glob(os.path.join(V, 'Percussion', 'Timpani', '*v4_rr1*')))
    def jagd(c, full, o=0.0):
        if full is not None:
            c.add(I('cbt').long(N('D1') * 2, full, .3, 2, 2), 0); c.add(ffilt(I('vct').long(N('A2'), full, .1, 2, 2), LP(3000)), 0, 1, -.25); return
        b = .5
        for k in range(64):
            t = o + k * b
            if k % 4 in (0, 3): c.add(bd[k % 2], t, .55 if k % 4 == 0 else .35, 0)
            if k % 8 == 6: c.add(bd[1], t + b * .5, .3, 0)
        for k in range(8):
            c.add(one(os.path.relpath(tp[k % len(tp)], V), .5), o + k * 4, 1, (-.3, .3)[k % 2])
            if k % 2 == 0: c.add(I('pno2').note(N('D1')), o + k * 4, .5); c.add(I('pno2').note(N('D#1')), o + k * 4 + .02, .35)
        for i, n in enumerate(['D3', 'D#3', 'E3', 'F3']): c.add(ffilt(I('vlat').long(N(n), 8.2, .06, .5, .6), LP(3500)), o + i * 8, 1, .3)
    x = cyc(jagd, 32, .25, 2.5); save('mu_jagd', norm(ffilt(x, chain(HP(35), LP(6500, 1))), -20, -3), .86)
    def jagd2(c, full, o=0.0):
        if full is not None: c.add(ffilt(I('vlnt').long(N('A#5'), full, .06, 2, 2), LP(5000)), 0, 1, .3); c.add(ffilt(I('vlnt').long(N('B5'), full, .045, 2, 2), LP(5000)), 0, 1, -.3); return
    x = cyc(jagd2, 32, .3, 2.5); save('mu_jagd_hoch', norm(ffilt(x, chain(HP(200), LP(6000, 1))), -26, -6), .88)
def bank():  # Instrumente für Live-Klänge (KI.piano/box/bow/…): wenige Töne, im Spiel per playbackRate verschoben
    for n in ['A2', 'E3', 'A3', 'E4', 'A4', 'E5', 'A5']: c = Canvas(6); c.add(I('pno').note(N(n), 5.5, 1, 0, .4), 0); save('kb_klavier_' + n, norm(fade(c.x, 0, .3), -18, -3), .9)
    for inst, key, ns, L in [('vc', 'cello', ['A2', 'E3'], 7), ('cb', 'bass', ['A1', 'E2'], 7), ('vla', 'bratsche', ['A3', 'E4'], 7), ('vln', 'geige', ['A4', 'E5'], 8)]:
        for n in ns: y = I(inst).note(N(n), L, 1, 0, .5); save(f'kb_{key}_{n}', norm(fade(y, 0, .4), -20, -3), .9)
    for n in ['A2', 'A3', 'A4', 'A5']: y = I('harp').note(N(n), 4, 1, 0, .4); save('kb_harfe_' + n, norm(fade(y, 0, .3), -18, -3), .9)
    for n in ['E6', 'A6']: y = box(N(n), 1, 2.2)[:int(3 * SR)]; save('kb_spieluhr_' + n, norm(fade(y, 0, .2), -18, -3), .9)
    for n in ['D4', 'A4']: y = I('tb').note(N(n), 8, 1, 0, 1)[:int(9 * SR)]; save('kb_glocke_' + n, norm(fade(y, 0, .5), -18, -3), .9)
if __name__ == '__main__':
    what = sys.argv[1:] or ['musik', 'bank', 'betten', 'einzel']
    mf = os.path.join(OUT, 'manifest.json')
    if os.path.exists(mf): manifest.update(json.load(open(mf)))
    for w in what: print('==', w); globals()[w]()
    json.dump(manifest, open(mf, 'w'), indent=0, sort_keys=True)
