# Teil 2 des Klang-Baus: Klangbetten (Schleifen) und Einzelgeräusche aus den Sonniss-Ausschnitten, Stinger/Schreckklänge aus Aufnahmen + VSCO.
from klang_bau import *
def pnorm(x, pk=-6.0): return (x * db(pk) / (np.abs(x).max() + 1e-9)).astype(np.float32)
def bed(name, key, t0=0, L=None, fl=None, xf=3.0, target=-24, mono_=False, q=.9):
    x = st(src(key))[int(t0 * SR):]; x = x[:int(L * SR)] if L else x
    x = loopify(ffilt(x, fl or chain(HP(40), HSH(9000, -3))), xf)
    if mono_: x = mono(x)
    save(name, norm(x, target, -3), q)
def betten():
    bed('amb_regen', 'regen_strasse', 0, 58, chain(HP(45), HSH(8000, -4)))  # Regen auf Asphalt, ferne Autos
    bed('amb_rinne', 'rinne', 0, 58, chain(HP(80), HSH(7000, -3)))  # Wasser im Rinnstein / Fallrohr
    bed('amb_dach', 'dachtropfen', 0, 66, chain(HP(70), HSH(8000, -3)))  # vom Dach platschendes Wasser
    bed('amb_wind', 'wind_fern', 0, 78, chain(HP(55), LP(5000, 1)), xf=5)  # Wind in fernen Bäumen
    bed('amb_leitung', 'leitung', 0, 58, chain(HP(50), LP(6000, 1)), xf=4)  # Stromleitung im Wind
    bed('amb_raum', 'raum_haus', 0, 58, chain(HP(35), HSH(6000, -4)), xf=4)  # Raumton Wohnhaus
    bed('amb_kueche', 'kueche_uhr', 0, 58, chain(HP(35), HSH(7000, -2)), xf=2)  # Küche: Uhr, Gefrierschrank
    bed('amb_regen_innen', 'regen_veranda', 0, 66, chain(HP(50), LP(1600, 2), LSH(200, 2)))  # Regen durch Wand und Fenster
    bed('amb_kuehl', 'kuehlschrank', 0, 43, chain(HP(40), LP(4000, 1)), mono_=True)  # Kühlschrank (Quelle im Raum)
    bed('amb_keller', 'bunker', 0, 40, chain(HP(35), HSH(7000, -3)))  # Keller: Tropfen, Luftzug
    bed('amb_lueftung', 'schule_wc', 0, 68, chain(HP(35), HSH(5000, -5)))  # Amt: pulsierende Lüftung
    bed('amb_tunnel', 'tunnel', 0, 68, chain(HP(30), HSH(6000, -3)), xf=4)  # Amt: Tunnelluft
    bed('amb_brumm', 'hvac_tief', 0, 46, chain(HP(30), LP(3000, 1)), xf=3)  # tiefes Maschinenbrummen
    bed('amb_wald', 'wald_regen', 0, None, chain(HP(50), HSH(8000, -3)), xf=2)  # Regen auf Laub
    bed('amb_weiss', 'weiss_drone', 0, 60, chain(HP(40), HSH(6000, -4)), xf=5)  # Nimmerheim: luftige Fläche
    bed('amb_weiss2', 'weiss_ton', 0, None, chain(HP(40), HSH(6000, -4)), xf=3)
    bed('amb_kanal', 'kanal', 0, None, chain(HP(35), HSH(7000, -3)), xf=2)
    bed('amb_wassertunnel', 'wassertunnel', 0, None, chain(HP(35), HSH(7000, -3)), xf=2)
    bed('amb_ufo', 'ufo', 0, 55, chain(HP(28), LP(5000, 1)), xf=4)
def shots(prefix, key, n, thr=-30, maxl=2.0, fl=None, pk=-6, minl=.08, post=.25):
    x = src(key)
    if fl: x = ffilt(x, fl)
    seg = segments(x, n, thr, minl, maxl, post=post)
    for i, y in enumerate(seg): save(f'{prefix}_{i + 1}', pnorm(mono(y), pk), .9)
    return len(seg)
def mix(parts, dur, wet=.25, sec=2.5, pk=-3, fl=None):
    c = Canvas(dur)
    for y, t, g, pan in parts: c.add(st(y), t, g, pan)
    x = reverb(c.x, sec, wet) if wet else c.x
    if fl: x = ffilt(x, fl)
    return pnorm(fade(x[:int((dur + sec * .6) * SR)], 0, .4), pk)
def einzel():
    shots('fx_tropfen', 'tropfen', 8, -26, .7, HP(150), -8)
    shots('fx_reh', 'reh', 3, -24, 1.6, chain(HP(200), LP(6000, 1)), -8)
    shots('fx_hund', 'hund_schaefer', 3, -22, 1.4, chain(HP(200), LP(3000, 1)), -8)  # fern, durch Wände
    save('fx_hund_4', pnorm(mono(ffilt(src('hund_fern'), chain(HP(250), LP(3500, 1)))), -8), .9)
    k = 0
    for key, n in [('knarr_tuer', 2), ('knarr_schrank', 1), ('knarr_holz', 2), ('knarr_haus', 2)]:
        for y in segments(ffilt(src(key), chain(HP(120), LP(7000, 1))), n, -24, .25, 2.4, post=.3): k += 1; save(f'fx_knarren_{k}', pnorm(mono(y), -8), .9)
    k = 0
    for key, n in [('fluester_a', 3), ('fluester_b', 1), ('atem_ether', 2)]:
        for y in segments(ffilt(src(key), chain(HP(250), LP(8000, 1))), n, -26, .4, 2.6, post=.3): k += 1; save(f'fx_fluester_{k}', pnorm(mono(y), -8), .9)
    save('fx_atem', pnorm(mono(ffilt(src('atem_angst'), HP(150))), -8), .9)
    save('ui_stift', pnorm(mono(fade(src('stift'), .005, .1)), -10), .9); save('ui_seite', pnorm(mono(fade(src('seite'), .005, .1)), -10), .9)
    tel = segments(ffilt(src('telefon'), chain(HP(250), LP(6000, 1))), 2, -20, .3, 2.2, post=.1); save('fx_telefon', pnorm(mono(tel[0]), -6), .9)
    save('fx_rauschen', pnorm(fade(ffilt(src('rauschen')[:int(4 * SR)], chain(HP(300), LP(5000, 1))), .02, .3), -8), .9)
    save('fx_glocke', pnorm(mono(fade(ffilt(src('glocke_muehle'), HP(150)), .002, 1)), -6), .9)
    bd7, bd5 = one('Percussion/BDrumNewhit_v7_rr1_Sum.wav'), one('Percussion/BDrumNewhit_v5_rr1_Sum.wav'); tim = one('Percussion/Timpani/Timpani1_Hit_v3_rr1_Sum.wav')
    gong, gongp = one('Percussion/gongHit_mf.wav'), one('Percussion/gongHit_p.wav'); cym = [one(f'Percussion/susCymb1-bow-{i}.wav') for i in (1, 2, 3, 4)]
    save('fx_tief_1', mix([(bd7, 0, 1, 0), (tim, .005, .6, 0)], 2.5, .2, 2, -4, LP(900, 1)), .9)
    save('fx_tief_2', mix([(gongp, 0, 1, 0), (bd5, 0, .6, 0)], 4, .2, 2, -4, LP(1200, 1)), .9)
    P2 = I('pno2')
    save('st_klein_1', mix([(P2.note(N('A0')), 0, .7, -.2), (P2.note(N('A#0')), .01, .6, .1), (P2.note(N('E1')), .02, .5, .2), (cym[0][:int(2.5 * SR)], .05, .5, .3)], 5, .35, 3.5, -5), .9)
    save('st_klein_2', mix([(src('bass_wal'), 0, 1, 0), (P2.note(N('A1')), 0, .5, -.2)], 4.5, .35, 3.5, -5), .9)
    save('st_klein_3', mix([(src('klavier_saite'), 0, 1, 0), (I('cbt').note(N('A#1'), 3, .6, .05, 1.5), .1, .6, .2)], 5.5, .3, 3.5, -5), .9)
    vt = I('vlnt'); cl = lambda ns, d: sum(vt.note(N(n), d, 1, .02, .8) for n in ns)
    save('st_gross_1', mix([(bd7, 0, 1, 0), (tim, 0, .8, 0), (gong, .02, .6, .1), (cl(['A#5', 'B5'], 2.2), 0, .35, .3), (I('cbt').note(N('A1'), 3, 1, .02, 1.5), 0, .5, -.2)], 6, .35, 4, -3), .9)
    save('st_gross_2', mix([(src('st_low'), 0, 1, 0), (P2.note(N('A0')), 0, .7, -.2), (P2.note(N('A#0')), .01, .6, 0), (P2.note(N('B0')), .02, .5, .2), (bd7, 0, .8, 0)], 6.5, .3, 4, -3), .9)
    sh = src('eis_shriek')
    save('sc_screech', mix([(ffilt(src('bass_screech'), HP(200)), 0, 1, 0), (ffilt(sh[:int(1.6 * SR)], chain(HP(400), LP(7000, 1))), .03, .6, .2), (bd7, 0, .9, 0), (tim, 0, .5, 0)], 3.5, .3, 3, -3), .9)
    save('sc_scream', mix([(src('st_high'), 0, 1, 0), (ffilt(resample(sh[:int(2 * SR)], int(SR * 1.25)), chain(HP(300), LP(6000, 1))), .02, .5, -.2), (bd7, 0, .9, 0)], 4, .3, 3, -3), .9)
    save('sc_violin', mix([(cl(['B5', 'C6', 'C#6'], 1.6), 0, .5, 0), (src('st_string'), 0, .8, .1), (tim, 0, .7, 0)], 3.5, .35, 3.5, -3), .9)
    save('sc_growl', mix([(src('growl'), 0, 1, 0), (src('geist_atem'), .1, .5, .3), (bd7, 0, .9, 0), (I('cbt').note(N('A1'), 2, 1, .02, 1), 0, .5, -.2)], 4, .25, 3, -3, LP(7000, 1)), .9)
    fl = [mono(y) for y in segments(ffilt(src('fluester_a'), HP(250)), 3, -26, .4, 2.4)]
    save('sc_whisper', mix([(fl[0], 0, .8, -.8), (fl[1 % len(fl)], .15, .7, .7), (fl[2 % len(fl)], .35, .6, -.2), (src('atem_ether')[:int(2 * SR)], 0, .5, .3), (src('klavier_saite'), 0, .6, 0)], 3.5, .35, 3.5, -3), .9)
    save('sc_static', mix([(ffilt(src('rauschen')[:int(.9 * SR)], chain(HP(300), LP(5000, 1))), 0, .9, 0), (bd7, 0, 1, 0)], 2.5, .15, 2, -3), .9)
if __name__ == '__main__':
    mf = os.path.join(OUT, 'manifest.json')
    if os.path.exists(mf): manifest.update(json.load(open(mf)))
    for w in sys.argv[1:] or ['betten', 'einzel']: print('==', w); globals()[w]()
    json.dump(manifest, open(mf, 'w'), indent=0, sort_keys=True)
