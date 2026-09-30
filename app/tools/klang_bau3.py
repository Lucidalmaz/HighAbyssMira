# Teil 3: die letzten Synth-Stellen durch Aufnahmen ersetzen – Vögel (Amsel, Singvögel), Rabe (Whiskey), Mikrowelle, Wecker, Brandalarm-Glocke,
# „Ohrklingeln“ (schmalbandiges Rauschen statt Sinus), Feuer-Musik (Blech, Pauken, Streicher aus VSCO statt Sägezahn).
from klang_bau2 import *
def glide(inst, f0, semis, dur, v=1.0, a=.3, r=.6):  # Halteton mit Tonhöhenfahrt (Sample mit steigender Abspielrate)
    x = inst.long(f0, (dur + r) * 2 ** (max(0, semis) / 12) + 1, 1, 0, .5); n = int((dur + r) * SR); t = np.arange(n) / SR  # erst lang halten, dann gleitend beschleunigen
    rate = 2 ** (semis * np.minimum(t, dur) / dur / 12); pos = np.cumsum(rate); pos = pos[pos < len(x) - 1]
    i = pos.astype(int); fr = (pos - i)[:, None]; y = x[i] * (1 - fr) + x[i + 1] * fr
    na = int(a * SR); y[:na] *= np.linspace(0, 1, na)[:, None]; nr = min(len(y), int(r * SR)); y[-nr:] *= np.linspace(1, 0, nr)[:, None] ** 2
    return y * v
def feuer():
    tb = Inst('Brass/Tenor Trombone/sus/*', r'_sus_([A-G]#?\d)_', 1); hn = Inst('Brass/F Horn/sus/*', r'_sus_([A-G]#?\d)_', 1)
    bd7 = one('Percussion/BDrumNewhit_v7_rr1_Sum.wav'); tims = [one(os.path.relpath(p, V)) for p in sorted(glob.glob(os.path.join(V, 'Percussion', 'Timpani', '*Hit*')))]
    R = np.random.default_rng(7)
    def TK(c, t, v, big): c.add(bd7 if big else tims[int(R.integers(len(tims)))], t, v * (.9 if big else .7), 0);  big and c.add(tims[0], t, v * .6, 0)
    def BR(c, t, ns, dur, v):  # Blech-Akkord: Posaunen unten, Hörner oben, schneller Einsatz
        for i, n in enumerate(ns): c.add((tb if N(n) < 180 else hn).long(N(n), dur, v, .25, .8), t, 1, (i - len(ns) / 2) * .2)
    def RISE(c, t, ns, dur, v, semi, inst='vlat'):
        for i, n in enumerate(ns): c.add(ffilt(glide(I(inst), N(n), semi, dur, v, dur * .8, .5), LP(5000)), t, 1, (i - .5) * .4)
    A = Canvas(15)
    TK(A, 0, 1, True); TK(A, .03, .8, True); BR(A, .05, ['D2', 'A2', 'D3', 'F3'], 6.5, .5)
    pat = [1, 0, 0, .6, 0, .45]
    for k in range(28):
        t = 1 + k * .2
        if t > 6.4: break
        if pat[k % 6]: TK(A, t, pat[k % 6] * (.42 + k * .014), False)
    RISE(A, 2.2, ['D4', 'D#4', 'A4'], 4.2, .35, 5); BR(A, 3.4, ['D2', 'A1'], 3.2, .45)
    TK(A, 6.6, 1.1, True); TK(A, 6.63, .9, True); BR(A, 6.6, ['A1', 'E2', 'A2', 'C#3'], 1.7, .6)
    A.add(I('vc').long(N('D2'), 6, .35, 1.5, 1.5), 7.1)
    for i, n in enumerate(['E3', 'D3', 'C3', 'B2', 'C3']): A.add(I('vc').note(N(n), 2.6 if i == 4 else 1.25, .6, .15, .5), 7.5 + i * .95, 1, .15)
    x = reverb(A.x, 3.2, .3); save('mu_feuer_a', norm(ffilt(x, chain(HP(35), LP(9000, 1)))[:int(14.5 * SR)], -17, -2), .88)
    B = Canvas(35); ticks = [pnorm(mono(y), -6) for y in segments(ffilt(src('kueche_uhr'), HP(1500)), 4, -20, .01, .08, post=.03)]
    t, k = 0.0, 0
    while t < 30: p = t / 30; TK(B, t, .3 + .45 * p, k % 4 == 0); t += .9 - .48 * p; k += 1
    for s in range(30): B.add(ticks[s % len(ticks)], s + .5, .25, .3)
    for i, n in enumerate(['D3', 'A3']): B.add(ffilt(glide(I('vlat'), N(n), 3, 30, .25, 20, 1.5), LP(4500)), 0, 1, (i - .5) * .5)
    for tt in (8, 16, 24): BR(B, tt, ['D2', 'A2', 'D3'], 1.5, .45)
    BR(B, 27, ['A#1', 'F2', 'A#2'], 3.2, .55); RISE(B, 24, ['E5', 'F5'], 6, .25, 2, 'vlnt')
    x = reverb(B.x, 3.2, .3); save('mu_feuer_b', norm(ffilt(x, chain(HP(35), LP(9000, 1)))[:int(35 * SR)], -18, -2), .88)
def natur():
    k = 0
    for y in segments(ffilt(src('amsel'), chain(HP(1400), LP(9000, 1))), 3, -22, .6, 3.2, post=.3): k += 1; save(f'fx_amsel_{k}', pnorm(mono(y), -8), .9)
    k = 0
    for y in segments(ffilt(src('rotkehl'), chain(HP(1200), LP(9000, 1))), 4, -22, .15, 1.4, post=.2): k += 1; save(f'fx_vogel_{k}', pnorm(mono(y), -8), .9)
    k = 0
    for key, n in (('rabe_a', 3), ('rabe_b', 2)):
        for y in segments(ffilt(src(key), chain(HP(180), LP(8000, 1))), n, -22, .15, 1.6, post=.15): k += 1; save(f'fx_rabe_{k}', pnorm(mono(y), -8), .9)
def geraete():
    seg = segments(ffilt(src('mikrowelle'), HP(300)), 8, -20, .05, 1.5, post=.08)
    seg.sort(key=lambda y: -len(y)); save('fx_mikrowelle', pnorm(mono(seg[0]), -8), .9)  # der längste Ton: „fertig“
    save('fx_wecker', pnorm(mono(fade(ffilt(src('wecker')[:int(2.6 * SR)], HP(300)), .005, .1)), -8), .9)
    # Ohrklingeln: schmalbandiges Rauschen (kein Sinus), weich ein- und ausgeblendet, darüber ein Hauch Oktave
    n = int(7 * SR); z = RNG.standard_normal(n).astype(np.float32)
    band = lambda f0, bw: (lambda f: np.exp(-((f - f0) / bw) ** 2))
    y = ffilt(z, band(3300, 45)) + .25 * ffilt(z, band(6500, 90)); t = np.arange(n) / SR
    env = np.minimum(1, t / 1.4) * np.minimum(1, np.maximum(0, (7 - t) / 3)); y = y * env
    save('fx_ohrklingeln', norm(np.stack([y, y * .97], 1), -30, -12), .9)
    # Brandalarm: elektrische Glocke = Klöppel schlägt ~21-mal je Sekunde auf eine Schale (echte Röhrenglocken-Anschläge, hochgestimmt)
    tb = one('Percussion/TB_hit_C5_v4_rr1.wav'); hit = resample(tb, int(SR / 1.9))[:int(.6 * SR)]; hit = hit * np.exp(-np.arange(len(hit)) / SR / .12)[:, None]
    c = Canvas(3.6); R = np.random.default_rng(3)
    for i in range(int(3.4 * 21)): c.add(hit, i / 21 + R.uniform(0, .003), R.uniform(.6, 1), 0)
    x = ffilt(c.x[:int(3.3 * SR)], chain(HP(500), LP(7000, 1))); save('amb_alarm', norm(mono(loopify(x, .3)), -22, -3), .9)  # amb_: Rand wird beim Laden abgeschnitten
if __name__ == '__main__':
    mf = os.path.join(OUT, 'manifest.json')
    if os.path.exists(mf): manifest.update(json.load(open(mf)))
    for w in sys.argv[1:] or ['natur', 'geraete', 'feuer']: print('==', w); globals()[w]()
    json.dump(manifest, open(mf, 'w'), indent=0, sort_keys=True)
