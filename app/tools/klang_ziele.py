# R-17 Ziele/Aufgaben: Aufheben (je Material) und Fibel-Klänge – nur echte Aufnahmen (Sonniss GDC 2017–2019, lizenzfrei; VSCO 2 CE, CC0).
# Quellen holt dieses Skript selbst über HAM_Audio/quellen.py (HTTP-Range, nur die gebrauchten Sekunden) – Schlüssel zl_* (eigene Liste, quellen.py bleibt unberührt).
#   python tools/klang_ziele.py [holen] [bau]      (in app/; ohne Angabe: beides)  → game/audio/pk_*.ogg, ui_*.ogg (+ manifest.json)
# pk_papier/metall/glas/stoff/batterie/schluessel/plastik/glanz (Aufheben) · ui_ziel (Hauptziel: Bleistift + gestrichenes Becken, tief) · ui_neben (Bleistift + Harfe)
# ui_fort (Seite + Bleistift + offene Quarte) · ui_erledigt (Seite + Klavier, löst sich auf) · ui_verpasst (Bleistift streicht durch + Celli, reibend)
# ui_fibel (Seite + Vibraphon) · ui_karte (Bleistiftpunkt auf Karopapier) · ui_speichern (Buch zu + tiefes Klavier) · ui_tasche (Griff in die Jackentasche)
import os, sys, json, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from klang_lib import *
from klang_bau import I, one
Q = {
 'zl_stift':     (2019, '6of8', 'TheWorkRoom Audio Post - Handwriting/HLP004', 0, 16),       # Bleistift auf Papier
 'zl_radier':    (2017, '3of9', 'Parched,drawing,dense,paper,cotton,eraser', 0, 4),
 'zl_papier':    (2017, '8of9', 'Paper_Rustling_Movement_Handling_50', 0, 5),
 'zl_zeitung':   (2017, '8of9', 'Paper_Newspaper_Light_Movement_01', 0, 5),
 'zl_block':     (2019, '6of8', 'NOTEPAD_Page_Turn_4', 0, 3),
 'zl_katalog':   (2019, '6of8', 'CATALOGUE_Page_Turn_9', 0, 3),
 'zl_buchseite': (2019, '3of8', 'PM_BA_BOOK_2_6 Book, Paper, Page Turn', 0, 6),
 'zl_buch_zu':   (2018, '1of8', 'shut_small_book_002', 0, 3),
 'zl_album_zu':  (2019, '6of8', 'PHOTO-ALBUM_Close_4', 0, 3),
 'zl_metall':    (2017, '8of9', 'Various_Metal_Handling_24', 0, 14),
 'zl_muenze':    (2017, '4of9', 'Money,Coins,Handle', 0, 4),
 'zl_glied':     (2017, '3of9', 'Latchlocker,aluminum,link,jostle', 0, 4),
 'zl_klimper':   (2018, '3of8', 'Coins_Hand_Jingle_Movement_Takes_6', 0, 8),
 'zl_flasche':   (2018, '1of8', 'Bottle,Beer,Empty,Remove,Case,Sloppy', 0, 10),
 'zl_glaeser':   (2019, '1of8', 'drinks_glasses_touching_003', 0, 3),
 'zl_tasche':    (2019, '1of8', 'Bag Foley_Canvas bag_Cotton_Grab', 0, 14),
 'zl_tuch':      (2018, '6of8', 'Cloths & Sponges Foley/Cloth 61', 0, 10),
 'zl_batterie':  (2019, '5of8', 'Battery rolling from right to left', 0, 9),
 'zl_klick':     (2018, '3of8', 'Gregor Quendel - Designed Plastic/Clicks 1', 0, 16),
 'zl_kassette':  (2017, '8of9', 'TM_CASSETTE TONE_Tape in out case', 0, 24),
 'zl_windspiel': (2019, '2of8', 'windchimes,mixed,paper,aluminum,tuned,glassclappermini', 0, 14),
 'zl_tinkle':    (2019, '1of8', 'Chime Accent,Tinkle,Fast', 0, 10),
}
def holen():
    sys.path.insert(0, HAM); os.chdir(HAM); import quellen, concurrent.futures as cf
    quellen.Q.update(Q)
    with cf.ThreadPoolExecutor(6) as ex:
        for r in ex.map(quellen.safe, list(Q)): print(r)
# ---------------------------------------------------------------- Bausteine
V = os.path.join(HAM, 'vsco')
def pitch(x, r): return resample(x, SR, int(SR / r))  # r < 1: tiefer
def lay(*parts):
    L = max(int(o * SR) + len(st(x)) for x, o, g in parts); y = np.zeros((L, 2), np.float32)
    for x, o, g in parts: x = st(x); a = int(o * SR); y[a:a + len(x)] += x * g
    return y
def seg(key, n, thr=-30, minl=.06, maxl=1.2, post=.12, fl=None, gap=.12):
    x = src(key); x = x[:, 0] if key == 'zl_windspiel' else x  # Mitte/Seite-Aufnahme: nur die Mitte
    x = ffilt(x, fl) if fl else x; return segments(x, n, thr, minl, maxl, gap=gap, post=post)
def cut(x, a, b): return fade(st(x)[int(a * SR):int(b * SR)], .004, min(.12, (b - a) * .3))
def env_in(x, a): x = st(x).copy(); n = min(len(x), int(a * SR)); x[:n] *= np.linspace(0, 1, n)[:, None] ** 2; return x
def tail(x, sec): x = st(x)[:int(sec * SR)].copy(); n = min(len(x), int(sec * .5 * SR)); x[-n:] *= np.linspace(1, 0, n)[:, None] ** 2; return x
def out(name, x, lufs_=-20, pk=-3, lp=16000, hp=40, wet=0.0, sec=1.6):
    x = ffilt(st(x), chain(HP(hp), LP(lp, 1)))
    if wet: x = reverb(x, sec, wet, pre=.012, bright=4200, damp=1800)
    x = fade(x, .002, .08); save(name, norm(x, lufs_, pk), .9)
def lv(x, l):  # Schicht auf Lautheit l (LUFS) bringen – Mischverhältnisse bewusst, nicht nach Spitze
    x = st(x); return (x * db(l - lufs(x))).astype(np.float32)
def bau():
    # ---- Aufheben: Papier (Zettel, Foto, Akte) – kurzes Knistern beim Greifen (Ausschnitte an verschiedenen Stellen der Aufnahme)
    pp, zz = src('zl_papier'), src('zl_zeitung')
    for i, (x, a) in enumerate([(pp, .05), (pp, .9), (zz, .2)]): out(f'pk_papier_{i + 1}', cut(x, a, a + .55), -21, -4, 11000, 140)
    # Metall (Werkzeug, Thermoskanne, Plombe): Griff ans Metall, kurz, mit leisem Nachklingen
    me = seg('zl_metall', 10, -26, .1, .7, .15) or seg('zl_muenze', 4)
    for i in range(3): out(f'pk_metall_{i + 1}', me[(i * 3) % len(me)], -21, -4, 12000, 80)
    # Glas (Flasche, Glas): Flasche aus dem Kasten heben, ein Hauch Klirren
    gl = seg('zl_flasche', 8, -28, .15, .8, .12); gg = seg('zl_glaeser', 4, -30, .05, .5, .1)
    out('pk_glas_1', gl[0], -21, -4, 13000, 90); out('pk_glas_2', lay((gl[min(2, len(gl) - 1)], 0, 1), (gg[0], .05, .35)), -21, -4, 13000, 90)
    # Stoff (Kinderschuh, Halsband, Lampion): Griff in Stoff
    sto = seg('zl_tasche', 8, -30, .15, .8, .1) + seg('zl_tuch', 4, -30, .15, .7, .1)
    for i in range(2): out(f'pk_stoff_{i + 1}', sto[i * 3 % len(sto)], -22, -5, 10000, 90)
    # Batterie: zylindrisches Klacken (rollt kurz) + Plastikklick
    ba = seg('zl_batterie', 6, -28, .08, .5, .08); kl = seg('zl_klick', 8, -26, .02, .2, .04)
    for i in range(2): out(f'pk_batterie_{i + 1}', lay((ba[i % len(ba)], 0, 1), (kl[(i * 3) % len(kl)], .09 + .02 * i, .55)), -21, -4, 12000, 120)
    # Schlüssel (Bund, Ring): Glieder klimpern, tiefer geschoben (Schlüssel sind schwerer als Münzen)
    gli = seg('zl_glied', 6, -30, .08, .6, .1); kli = seg('zl_klimper', 8, -28, .1, .6, .1)
    for i in range(3): out(f'pk_schluessel_{i + 1}', lay((pitch(kli[i % len(kli)], .82 + .04 * i), 0, 1), (gli[i % len(gli)], .03, .6)), -21, -4, 11000, 140)
    # Plastik (Kassette, Kamera, Funkgerät): Kassette aus der Hülle
    ka = seg('zl_kassette', 10, -28, .08, .6, .08)
    for i in range(2): out(f'pk_plastik_{i + 1}', ka[(i * 4) % len(ka)], -21, -4, 12000, 120)
    # Glänzendes (Whiskeys Ware, Messingschlüssel): feiner kristalliner Glanz – Glasklöppel des Windspiels + Glockenspiel ganz hoch, kein Spielautomat
    ws, tk, gk = src('zl_windspiel')[:, 0], src('zl_tinkle'), I('glock')
    for i, (a, b, n) in enumerate([(.4, 2.6, 'E7'), (3.1, 1.2, 'B6')]):
        ting = ffilt(gk.note(N(n), .05, .5, 0, .9), HP(2500))
        x = lay((lv(ffilt(cut(ws, a, a + 1.3), HP(1800)), -26), 0, 1), (lv(ffilt(cut(tk, b, b + .9), HP(2200)), -30), .03, 1), (lv(ting, -29), .02, 1), (lv(ffilt(me[1 % len(me)], HP(2000)), -33), 0, 1))
        out(f'pk_glanz_{i + 1}', tail(x, 1.6), -22, -5, 15000, 1100, .25, 1.4)
    # ---- Fibel-Klänge. Bleistift: kurze Striche (HB auf Papier), über 9 kHz gedämpft – nah, aber kein Zischen
    stl = [ffilt(s, LP(8500, 2)) for s in seg('zl_stift', 14, -22, .12, .5, .06, gap=.05)]
    kurz = sorted(stl, key=len)
    rad = seg('zl_radier', 4, -32, .1, .8, .05)
    blk = seg('zl_block', 2, -32, .15, 1.0, .1); kat = seg('zl_katalog', 2, -32, .15, 1.0, .1); bs = seg('zl_buchseite', 4, -32, .2, 1.2, .15)
    zu = seg('zl_buch_zu', 2, -30, .05, .8, .2) or seg('zl_album_zu', 2, -30, .05, .8, .2)
    cym = [one('Percussion/susCymb1-bow-%d.wav' % k) for k in (1, 3)]; gong = one('Percussion/gongscrape_pp.wav')
    p = I('pno')
    # Hauptziel: Bleistiftstrich, darunter tief ein gestrichenes Becken (Oktave tiefer, dunkel), Gong-Hauch und ein Kontrabass-Ton – geheimnisvoll, trägt
    for i in range(2):
        bed = env_in(tail(ffilt(pitch(cym[i], .5), chain(LP(1800, 2), HP(70))), 3.8), .35)
        cb = env_in(I('cb').note(N(['A1', 'D2'][i]), 2.8, 1, .3, 1.4), .5); gs = env_in(tail(ffilt(pitch(gong, .7), chain(LP(1200), HP(60))), 3.5), .6)
        x = lay((lv(stl[i * 2], -27), 0, 1), (lv(bed, -24), .06, 1), (lv(ffilt(cb, LP(900)), -25), .12, 1), (lv(gs, -31), .1, 1))
        out(f'ui_ziel_{i + 1}', x, -20, -4, 13000, 35, .3, 2.4)
    # Nebenaufgabe: kurzer Strich + tiefer Harfenton (gedämpft)
    for i in range(2):
        hp_ = ffilt(I('harp').note(N(['A2', 'E3'][i]), 1.8, 1, 0, 1.2), LP(2400))
        out(f'ui_neben_{i + 1}', lay((lv(kurz[i + 2], -27), 0, 1), (lv(hp_, -23), .08, 1)), -21, -4, 12000, 50, .3, 2.0)
    # Fortsetzung: Seite + Strich + offene Quarte (Harfe), bleibt in der Schwebe
    x = lay((lv(blk[0], -29), 0, 1), (lv(kurz[1], -28), .35, 1), (lv(ffilt(I('harp').note(N('D3'), 1.6, 1), LP(2600)), -24), .4, 1), (lv(ffilt(I('harp').note(N('G3'), 1.6, 1), LP(2800)), -25), .66, 1))
    out('ui_fort', x, -21, -4, 12000, 50, .3, 2.0)
    # Erledigt: Seite + Klavier (dyn1, weich): E3+A3 → A2+E3+C4 – kleine Kadenz in Moll, löst sich auf, ohne Triumph
    a1 = lay((p.note(N('E3'), .55, 1, 0, .7), 0, 1), (p.note(N('A3'), .55, .9, 0, .7), 0, 1))
    a2 = lay((p.note(N('A2'), 2.6, 1, 0, 1.8), 0, 1), (p.note(N('E3'), 2.6, .8, 0, 1.8), 0, 1), (p.note(N('C4'), 2.6, .7, 0, 1.8), .03, 1))
    x = lay((lv(kat[0], -29), 0, 1), (lv(a1, -26), .3, 1), (lv(a2, -22), .82, 1)); out('ui_erledigt', tail(x, 4.4), -21, -4, 11000, 40, .32, 2.6)
    # Verpasst/gescheitert: zwei harte Striche (durchgestrichen) + Radiergummi, darunter Celli eng (A2/B♭2), tremolo
    vc = ffilt(lay((I('vct').note(N('A2'), 1.8, 1, .25, 1.0), 0, 1), (I('vct').note(N('Bb2'), 1.8, .9, .3, 1.0), .05, 1)), LP(1800))
    x = lay((lv(stl[3], -26), 0, 1), (lv(stl[5], -27), .2, 1), (lv(rad[0], -32), .48, 1), (lv(vc, -23), .08, 1)); out('ui_verpasst', tail(x, 3.2), -21, -4, 11000, 45, .3, 2.2)
    # Neuer Fibel-Eintrag / Sammelstück: Seite + Vibraphon-Ton (gedämpft), wie ein Lesezeichen
    vib = one('Percussion/vibraring_v1_rr1.wav')
    for i in range(2):
        x = lay((lv([bs, blk][i][0], -28), 0, 1), (lv(ffilt(pitch(vib, [1.0, .89][i]), chain(HP(250), LP(5000))), -24), .22, 1)); out(f'ui_fibel_{i + 1}', tail(x, 3.4), -22, -4, 11000, 60, .3, 2.2)
    # Karte: Bleistiftpunkt + kurzer Strich, Papier leise
    out('ui_karte', lay((lv(kurz[0], -26), 0, 1), (lv(kurz[4], -29), .16, 1), (lv(cut(pp, 1.2, 1.6), -34), .02, 1)), -23, -4, 10000, 120, .12, .9)
    # Speichern: Buch schließen + tiefes Klavier (A1 + E2, Pedal), lang ausklingend
    x = lay((lv(zu[0], -27), 0, 1), (lv(ffilt(p.note(N('A1'), 3.2, 1, 0, 2.2), LP(1400)), -23), .06, 1), (lv(ffilt(p.note(N('E2'), 3.2, .7, 0, 2.2), LP(1600)), -27), .08, 1))
    out('ui_speichern', tail(x, 4.8), -21, -4, 11000, 35, .3, 2.6)
    # Erinnerung danach („Du hast … eingesteckt“): Hand klopft auf die Jackentasche
    out('ui_tasche', sto[1 % len(sto)], -22, -5, 8000, 80)
if __name__ == '__main__':
    a = sys.argv[1:] or ['holen', 'bau']; cwd = os.getcwd()
    if 'holen' in a: holen(); os.chdir(cwd)
    if 'bau' in a:
        bau(); mf = os.path.join(OUT, 'manifest.json')
        if os.path.exists(mf): manifest.update({**json.load(open(mf)), **manifest})
        json.dump(manifest, open(mf, 'w'), indent=0, sort_keys=True)
