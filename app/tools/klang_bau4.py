# Teil 4 (R-7/R-8 Umwelt): Wind, der um Ecken heult und pfeift, Wind in Gras/Kronen, Böen mit nassem Laub (Einzelstöße), Busch-Kontakt,
# Laub beim Rennen, Schaukelketten (Klirren) und Quietschen. Quellen: Sonniss GDC (quellen.py: wind_heulen, wind_gras, wind_strasse, busch, laub_lauf, kette, quietsch).
#   python app/tools/klang_bau4.py [heulen|kronen|boeen|kontakt]
from klang_bau2 import *
def windows(x, n, L, gap=1.0):  # die n kräftigsten, sich nicht überlappenden Fenster (L s) nach RMS – für Böen aus einer Daueraufnahme
    m = mono(x); w = int(L * SR); hop = int(.25 * SR); e = [(np.sum(m[i:i + w] ** 2), i) for i in range(0, len(m) - w, hop)]
    e.sort(reverse=True); out = []
    for _, i in e:
        if all(abs(i - j) > w + gap * SR for j in out): out.append(i)
        if len(out) == n: break
    return [x[i:i + w] for i in sorted(out)]
def heulen(): bed('amb_heulen', 'wind_heulen', 0, 68, chain(HP(90), LP(9000, 1)), xf=6)  # Wind heult/pfeift um Ecken und durch Spalten
def kronen(): bed('amb_kronen', 'wind_gras', 0, 78, chain(HP(70), HSH(8000, -3)), xf=6)  # Böiger Wind in Gras, Büschen und Kronen
def boeen():
    for i, y in enumerate(windows(ffilt(src('wind_strasse'), chain(HP(60), LP(9000, 1))), 4, 6.5)):  # Böe mit nassem Laub, ein Stoß
        save(f'fx_boe_{i + 1}', norm(fade(y, 1.4, 2.6), -22, -3), .9)
def kontakt():
    k = 0
    for y in segments(ffilt(src('busch'), chain(HP(160), LP(11000, 1))), 6, -30, .18, 1.1, post=.12): k += 1; save(f'fx_busch_{k}', norm(mono(y), -24, -4), .9)
    k = 0
    for y in windows(ffilt(src('laub_lauf'), chain(HP(150), LP(11000, 1))), 4, .5, .3): k += 1; y = fade(y, .02, .15); save(f'fx_laub_{k}', norm(mono(y), -24, -4), .9)
    k = 0
    for y in windows(ffilt(src('kette'), chain(HP(250), LP(12000, 1))), 3, .45, .05): k += 1; y = fade(y, .01, .12); save(f'fx_kette_{k}', norm(mono(y), -24, -4), .9)
    k = 0
    for y in windows(ffilt(src('quietsch'), chain(HP(200), LP(9000, 1))), 4, 1.1, .2): k += 1; y = fade(y, .08, .3); save(f'fx_quietsch_{k}', norm(mono(y), -24, -4), .9)
if __name__ == '__main__':
    mf = os.path.join(OUT, 'manifest.json')
    if os.path.exists(mf): manifest.update(json.load(open(mf)))
    for w in sys.argv[1:] or ['heulen', 'kronen', 'boeen', 'kontakt']: print('==', w); globals()[w]()
    json.dump(manifest, open(mf, 'w'), indent=0, sort_keys=True)
