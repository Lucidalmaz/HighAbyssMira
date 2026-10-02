# Graffiti-Wände für High Abyss Mira: echte freigestellte Sprühfarbe (Fotoscans) + Story-Schriftzüge, physikalisch gesprüht
# (Kern + Sprühnebel aus Einzeltröpfchen + Läufer, Farbe mit echtem Korn aus dem Betonscan). Ausgabe RGBA 2048x1024 (= 2,6 m x 1,3 m).
import numpy as np, os, math, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage as ndi
from skimage.morphology import skeletonize
Image.MAX_IMAGE_PIXELS = None
C = 'C:/Users/GIGABYTE/HAM_FabDownloads/v20_texturen/_cut/'
F = 'C:/Users/GIGABYTE/HighAbyssMira-Repo/app/vendor/fonts/'
OUT = 'C:/Users/GIGABYTE/HighAbyssMira-Repo/game/assets/ms/graffiti_echt/'
W, H = 2048, 1024
G = lambda x, s: ndi.gaussian_filter(x, s)
def ss(x, a, b): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

# echtes Korn aus einer farbfreien Betonstelle des Scans (Hochpass, um 0 zentriert)
_k = Image.open('C:/Users/GIGABYTE/HAM_FabDownloads/v20_texturen/graffiti_rot/textures/RedGraffitiWall.jpg').crop((5800, 2600, 7900, 4700)).convert('L').resize((1024, 1024), Image.LANCZOS)
_k = np.asarray(_k).astype(np.float32) / 255; KORN = _k - G(_k, 6); KORN /= KORN.std() + 1e-6
PORE = ss(-(_k - G(_k, 10)), .05, .16)  # tiefe Poren: dort kommt keine Farbe hin
def tile(a, w, h, ox=0, oy=0): ys = (np.arange(h) + oy) % a.shape[0]; xs = (np.arange(w) + ox) % a.shape[1]; return a[np.ix_(ys, xs)]

class Wand:
    def __init__(s, seed):
        s.rgb = np.zeros((H, W, 3), np.float32); s.a = np.zeros((H, W), np.float32); s.R = np.random.default_rng(seed)
        s.korn = tile(KORN, W, H, *s.R.integers(0, 1024, 2)); s.pore = tile(PORE, W, H, *s.R.integers(0, 1024, 2))
    def over(s, rgb, a):  # Farbe über das Bisherige legen
        a = np.clip(a, 0, 1)[..., None]; out_a = a[..., 0] + s.a * (1 - a[..., 0])
        s.rgb = (rgb * a + s.rgb * s.a[..., None] * (1 - a)) / np.maximum(out_a[..., None], 1e-5); s.a = out_a
    def echt(s, name, x, y, w, alpha=1., rot=0., buff=0.):  # echter Ausschnitt, Breite w px, links oben x,y
        im = Image.open(C + name + '.png').convert('RGBA'); h = int(w * im.height / im.width); im = im.resize((w, h), Image.LANCZOS)
        if rot: im = im.rotate(rot, expand=True, resample=Image.BICUBIC)
        a = np.asarray(im).astype(np.float32) / 255; rgb, al = a[..., :3], a[..., 3]
        al = al * (1 - ss(rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2]), .02, .08))  # Pflanzenreste raus
        L = rgb @ [.299, .587, .114]; det = np.sqrt(np.maximum(G(L * L, 3) - G(L, 3) ** 2, 0)); al = al * ss(det, .008, .03) ** .5  # verschmierte Atlas-Ränder raus
        al *= alpha
        if buff:  # „überstrichen/abgewaschen“: großflächig ungleichmäßig weg
            n = G(s.R.random(al.shape).astype(np.float32), 18); n = (n - n.min()) / (np.ptp(n) + 1e-6); al *= 1 - ss(n, 1 - buff, 1 - buff + .25)
        x0, y0 = max(0, x), max(0, y); x1, y1 = min(W, x + al.shape[1]), min(H, y + al.shape[0])
        if x1 <= x0 or y1 <= y0: return
        fr = np.zeros_like(s.a); fc = np.zeros_like(s.rgb)
        fr[y0:y1, x0:x1] = al[y0 - y:y1 - y, x0 - x:x1 - x]; fc[y0:y1, x0:x1] = rgb[y0 - y:y1 - y, x0 - x:x1 - x]
        s.over(fc, fr)
    def farbe(s, col, a, korn=.12):
        c = np.array(col, np.float32) / 255; k = 1 + korn * s.korn[..., None]; return np.clip(c * k, 0, 1), a * (1 - .9 * s.pore)
    def spray(s, S, col, sig=5., drips=6, os_=1., dichte=3.2, korn=.12):
        """S: Gewichtsbild der Sprühbahn (1 px breite Linien). Kern + Nebel + Läufer."""
        R = s.R; speed = .65 + .7 * ss(G(R.random(S.shape).astype(np.float32), 30) * 9 - 4, 0, 1)  # Handgeschwindigkeit schwankt
        S = S * speed
        core = G(S, sig) * math.sqrt(2 * math.pi) * sig
        a = 1 - np.exp(-dichte * core)
        mist = G(S, sig * 3.6) * math.sqrt(2 * math.pi) * sig * 3.6
        dots = (R.random(S.shape) < np.clip(mist * .22 * os_, 0, .6)).astype(np.float32); dots = G(dots, .55) * 1.6
        a = np.maximum(a, np.clip(dots, 0, 1) * .75) + mist * .05 * os_
        # Läufer: an Stellen mit viel Farbe läuft sie senkrecht nach unten
        if drips:
            ys, xs = np.nonzero((core > 1.1) & (S > 0))
            if len(ys):
                im = Image.new('L', (W * 2, H * 2), 0); d = ImageDraw.Draw(im)
                for i in R.choice(len(ys), min(drips, len(ys)), replace=False):
                    x, y = xs[i] * 2, ys[i] * 2; L = int(min(260, R.exponential(70))) * 2 + 20; w = max(2, sig * (.55 + R.random() * .3)) * 2
                    pts = [(x + math.sin(t * .05 + i) * 1.5, y + t) for t in range(0, L, 4)]
                    for k in range(len(pts) - 1): d.line([pts[k], pts[k + 1]], fill=int(235 * (1 - .4 * k / len(pts))), width=int(w * (1 - .35 * k / len(pts))))
                    ex, ey = pts[-1]; r = w * .62; d.ellipse([ex - r, ey - r * .8, ex + r, ey + r * 1.25], fill=235)
                dr = np.asarray(im.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255; a = np.maximum(a, dr)
        rgb, a = s.farbe(col, np.clip(a, 0, 1), korn); s.over(rgb, a)
    def marker(s, mask, col, al=.92):  # Filzstift/Lackstift: klare Kante, leicht ausgefranst, Tinte zieht in die Poren
        R = s.R; m = G(mask, .7); bleed = G(mask, 2.2) * .18
        a = np.clip(m * al * (.82 + .18 * R.random(mask.shape)) + bleed, 0, 1)
        rgb, a = s.farbe(col, a, .06); s.over(rgb, a)
    def save(s, name, alter=.25):
        R = s.R; n = G(R.random((H, W)).astype(np.float32), 14); n = (n - n.min()) / (np.ptp(n) + 1e-6)
        a = s.a * (1 - alter * ss(n, .45, .8)) * (1 - .5 * s.pore)  # Witterung, Poren
        img = np.dstack([s.rgb, a]); Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), 'RGBA').save(OUT + name + '.png', optimize=True)
        pv = s.rgb * a[..., None] + np.array([.62, .6, .57]) * (1 - a[..., None]); p = Image.fromarray((pv * 255).astype(np.uint8)); p.thumbnail((1400, 700)); p.save(OUT.replace('game/assets/ms/graffiti_echt/', '') + '../_gr_pv_' + name + '.jpg')
        print(name, 'ok')

# ---------- Formen ----------
def text_mask(t, size, font, x, y, rot=0., spacing=0, jitter=0., seed=1):
    """Text als Maske (W x H); jede Glyphe leicht anders gedreht/versetzt (Hand)."""
    R = np.random.default_rng(seed); f = ImageFont.truetype(F + font, size); im = Image.new('L', (W, H), 0)
    cx = x
    for ch in t:
        g = Image.new('L', (size * 2, size * 2), 0); ImageDraw.Draw(g).text((size // 2, size // 3), ch, font=f, fill=255)
        if jitter: g = g.rotate(R.normal(0, jitter * 8), resample=Image.BICUBIC, center=(size, size))
        dy = int(R.normal(0, jitter * size * .05)); im.paste(g, (int(cx - size // 2), int(y - size // 3 + dy)), g)
        cx += f.getlength(ch) * (1 + R.normal(0, jitter * .04)) + spacing
    if rot: im = im.rotate(rot, resample=Image.BICUBIC, center=(x, y))
    return np.asarray(im).astype(np.float32) / 255
def bahn(mask): return skeletonize(mask > .5).astype(np.float32)
def kontur(mask): m = mask > .5; return (m & ~ndi.binary_erosion(m, iterations=2)).astype(np.float32)
def linien(polys, R, wack=2.):  # Hand-Polylinien → 1-px-Bahn
    im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
    for P in polys:
        P = [(px + R.normal(0, wack), py + R.normal(0, wack)) for px, py in P]; d.line(P, fill=255, width=1, joint='curve')
    return np.asarray(im).astype(np.float32) / 255
def ellipse(cx, cy, rx, ry, a0=0, a1=2 * math.pi, n=90, tilt=0.):
    return [(cx + rx * math.cos(t) * math.cos(tilt) - ry * math.sin(t) * math.sin(tilt), cy + rx * math.cos(t) * math.sin(tilt) + ry * math.sin(t) * math.cos(tilt)) for t in np.linspace(a0, a1, n)]
def herz(cx, cy, s): return [(cx + s * 16 * math.sin(t) ** 3 / 16, cy - s * (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) / 16) for t in np.linspace(0, 2 * math.pi, 120)]
def throwup(s, t, size, font, x, y, fill, line, rot=0., seed=1):  # Throw-up: Füllung deckend mit ungleichmäßigem Auftrag + feinem Nebel, Kontur gesprüht
    m = text_mask(t, size, font, x, y, rot, spacing=size * .03, jitter=.5, seed=seed); m = G(ndi.binary_dilation(m > .5, iterations=max(2, int(size * .03))).astype(np.float32), 1.5)
    R = s.R; ung = G(R.random(m.shape).astype(np.float32), size * .08); ung = (ung - ung.min()) / (np.ptp(ung) + 1e-6)
    a = np.clip(m * (.8 + .25 * ung), 0, 1)
    mist = G(m, size * .045); a = np.maximum(a, (R.random(m.shape) < mist * .1).astype(np.float32) * .6)
    rgb, a = s.farbe(fill, a, .16); s.over(rgb, a)
    s.spray(kontur(m), line, sig=size * .014, drips=6, os_=.5, dichte=4.5)
    return m

KAL, COV, GOC = 'kalam-400-latin.woff2', 'covered-by-your-grace-400-latin.woff2', 'gochi-hand-400-latin.woff2'
wahl = sys.argv[1:] or ['nr9', 'tanke', 'villa']

if 'nr9' in wahl:  # Hauswand Nr. 9: Band „SCHIMMEL“, Herz, „J + K“, „NIX WIE WEG“, klein ∴, „Abi 09 ♥“, alter Tag „LE 2011“
    s = Wand(9)
    s.echt('r_tag_gross', 1150, 520, 900, alpha=.55, buff=.35)            # alter echter Tag, halb abgewaschen
    s.echt('r_rot', 1700, 40, 340, alpha=.5, rot=90, buff=.3)
    s.echt('r_tag_links', 40, 60, 260, alpha=.7, buff=.2)
    s.spray(bahn(text_mask('LE 2011', 120, GOC, 330, 110, rot=4, jitter=.8, seed=2)), (128, 130, 132), sig=4, drips=2, os_=.6)
    throwup(s, 'SCHIMMEL', 330, GOC, 330, 300, (206, 207, 200), (22, 22, 24), rot=3, seed=3)
    s.spray(linien([herz(330, 760, 150)], s.R, 2.5), (176, 26, 34), sig=7, drips=6)
    s.marker(text_mask('J + K', 92, COV, 255, 740, rot=-4, jitter=.6, seed=4), (20, 20, 22))
    s.marker(text_mask('NIX WIE WEG', 104, COV, 1180, 760, rot=-7, jitter=.5, seed=5), (24, 24, 26))
    dots = np.zeros((H, W), np.float32)
    for (px, py) in [(1010, 840), (990, 872), (1030, 872)]: dots[py, px] = 1
    s.marker(ss(G(dots, 5) * 160, .25, .6), (18, 18, 20))  # ∴ – klein dazwischen, andere Hand
    s.marker(text_mask('Abi 09', 84, KAL, 1460, 900, rot=-3, jitter=.4, seed=6), (40, 70, 150), .8); s.marker(ss(G(linien([herz(1790, 930, 34)], s.R, .6), 1.6) * 9, .2, .5), (40, 70, 150), .8)
    s.save('wand_nr9', .28)

if 'tanke' in wahl:  # Tankstelle (Beton): UFO mit Verbotszeichen, „HIER LANDEN VERBOTEN“, abgemaltes Auge mit „?“, „KEVIN ♥ JULE“, „NIEMANDSLAND“
    s = Wand(17)
    s.echt('r_tag_oben', 1640, 40, 330, alpha=.8, buff=.2)
    s.echt('a_elefant', 1480, 560, 520, alpha=.55, buff=.45)
    s.echt('r_tag_unten', 40, 620, 330, alpha=.6, buff=.3)
    R = s.R; ufo = [ellipse(520, 330, 260, 70), ellipse(520, 300, 110, 95, math.pi, 2 * math.pi, 50)] + [[(520 + a * 120, 400), (520 + a * 260, 560)] for a in (-.7, 0, .7)]
    s.spray(linien(ufo, R, 2), (24, 24, 24), sig=6, drips=5)
    s.spray(linien([ellipse(520, 330, 300, 290, n=140), [(310, 125), (735, 540)]], R, 3), (178, 30, 30), sig=9, drips=6)
    s.spray(bahn(text_mask('HIER LANDEN VERBOTEN', 118, COV, 150, 690, rot=-2, jitter=.6, seed=7)), (178, 30, 30), sig=4.5, drips=9)
    auge = [ellipse(1280, 300, 190, 95, n=100), ellipse(1280, 300, 70, 70, n=60)]
    s.spray(linien(auge, R, 2), (22, 22, 22), sig=5.5, drips=4)
    s.spray(G(linien([ellipse(1280, 300, 26, 26, n=30)], R, 1), 6) * 25, (22, 22, 22), sig=5, drips=2)
    s.spray(bahn(text_mask('?', 230, COV, 1500, 240, jitter=.4, seed=8)), (22, 22, 22), sig=5, drips=3)
    s.marker(text_mask('KEVIN + JULE', 92, COV, 1150, 560, rot=-5, jitter=.5, seed=9), (196, 58, 138), .85); s.marker(ss(G(linien([herz(1730, 640, 40)], s.R, .6), 1.6) * 9, .2, .5), (196, 58, 138), .85)
    s.spray(bahn(text_mask('NIEMANDSLAND', 112, GOC, 260, 880, rot=1, jitter=.5, seed=10)), (88, 132, 70), sig=5, drips=4, os_=.7)
    s.save('wand_tanke', .32)

if 'villa' in wahl:  # Villenmauer: Mutprobe „SPUKHAUS“, Gespenst, „TIM WAR DRIN 2014“, darunter „LÜGNER“
    s = Wand(23)
    s.echt('r_tag_links', 1700, 520, 300, alpha=.65, buff=.3)
    s.echt('r_tag_unten', 60, 640, 300, alpha=.55, buff=.4)
    throwup(s, 'SPUKHAUS', 300, GOC, 200, 120, (230, 226, 214), (40, 40, 42), rot=-2, seed=21)
    R = s.R; geist = [[(1660, 470), (1660, 250)] + ellipse(1760, 250, 100, 120, math.pi, 2 * math.pi, 40) + [(1860, 250), (1860, 470)] + [(1860 - i * 25, 470 + (25 if i % 2 else 0)) for i in range(9)]]
    s.spray(linien(geist, R, 2), (232, 230, 222), sig=6, drips=4)
    s.spray(G(linien([ellipse(1725, 300, 14, 18, n=20), ellipse(1795, 300, 14, 18, n=20)], R, 1), 2) * 5, (232, 230, 222), sig=3, drips=2)
    s.marker(text_mask('TIM WAR DRIN 2014', 100, COV, 260, 640, rot=-2, jitter=.5, seed=22), (20, 20, 22))
    s.marker(text_mask('LÜGNER', 124, COV, 980, 800, rot=-8, jitter=.6, seed=23), (150, 26, 26), .9)
    s.save('wand_villa', .25)
