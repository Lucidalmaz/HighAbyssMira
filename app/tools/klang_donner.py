# Donner (Nutzer 07.10.: „klingt generiert und wiederholt sich“): echte, verschiedene Donner aus den Sonniss-GDC-Bündeln (lizenzfrei, ohne Namensnennung),
# per HAM_Audio/donner_holen.py geladen. Drei Klassen nach Abstand: krach (< 250 m, Reißen + Knall), nah (250–900 m, Schlag + Rollen), fern (> 900 m, weiches Grollen).
#   python app/tools/klang_donner.py
from klang_lib import *
D = os.path.join(HAM, 'donner')
def laden(n, a, b):
    x, sr = sf.read(os.path.join(D, n), dtype='float32'); x = resample(st(x), sr)
    return x[int(a * SR):int(b * SR)]
A_RMS = .3  # alle Donner haben dieselbe Basis: lautester 85-ms-Abschnitt (RMS) = 0,3; Spitzen darüber begrenzt der weiche Limiter. Der Abstand regelt der Spiel-Code.
def pn(x, pk):
    m = mono(x); w = int(.085 * SR); e = max(float(np.sqrt(np.mean(m[i:i + w] ** 2))) for i in range(0, max(1, len(m) - w), w // 2)) + 1e-9
    return softlimit(x * (A_RMS / e), -1.0)
def bau(name, n, a, b, pk, lp=None, out=1.6):
    x = ffilt(laden(n, a, b), chain(HP(24), LP(lp, 2)) if lp else HP(24)); save(name, fade(pn(x, pk), .012, out), .9)
PP = 'thunderstorm_summer_morning_distant_rumble_sparse_approaching_2.wav'
IV = 'rain_shower of rain_steady rain_thunder.wav'
if __name__ == '__main__':
    bau('fx_donner_krach_1', 'thunder_mountainous_big_crack_02.wav', 0, 8.2, -2)
    bau('fx_donner_krach_2', 'Thunder_Very-Close_Rain_08.wav', .6, 8.6, -2)
    bau('fx_donner_krach_3', 'thunder_strike_03.wav', 0, 15.4, -2.5)
    bau('fx_donner_nah_1', 'thunder_clap_04.wav', 0, 14.7, -5)
    bau('fx_donner_nah_2', PP, 39.4, 53, -6, 6000)
    bau('fx_donner_nah_3', 'thunder_strike_03.wav', 7.3, 15.4, -6, 3500)   # das zweite, tiefere Rollen der Aufnahme
    bau('fx_donner_fern_1', 'thunder_mountainous_distant_03.wav', 0, 11.6, -9)
    bau('fx_donner_fern_2', PP, 23.2, 38, -10, 2500)
    bau('fx_donner_fern_3', PP, 3.5, 22.5, -12, 2000, 2.5)
    bau('fx_donner_fern_4', IV, 12.5, 27, -11, 1600)
    json.dump({k: v for k, v in manifest.items()}, open(os.path.join(OUT, 'manifest_donner.json'), 'w'), indent=0, sort_keys=True)
