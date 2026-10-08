# Spinnen für High Abyss Mira – prozedural in Blender gebaut (eigene Arbeit, bpy). Aufruf (niedrige Priorität, 2 Threads):
#   blender.exe --background --factory-startup --threads 2 --python spinnen_bau.py -- <art> <hd|lo> <ausgabeordner> [texturgröße]
# Arten: nosferatu (Zoropsis spinimana) · huntsman (Riesenkrabbenspinne, Sparassidae) · winkel (Hauswinkelspinne, Eratigena atrica) ·
#        kreuz (Gartenkreuzspinne, Araneus diadematus) · wolf (Wolfsspinne, Lycosidae) · vogel (große Vogelspinne, Theraphosidae)
# Ergebnis: <art>_<res>.glb – ein Skinned Mesh „koerper“ (+ „haar“: Haarkarten, nur hd) mit Skelett (root · body · abdomen · 8 Beine × 7 Glieder
# Coxa–Trochanter–Femur–Patella–Tibia–Metatarsus–Tarsus · Pedipalpen · Cheliceren) und den Clips idle · walk · lauern · zucken.
# Texturen (Albedo/Normal/Rauheit) werden aus einem OSL-Muster je Art gebacken (Zeichnung, Chitin, Haarstriche); Haarkarten aus erzeugten Haarsträhnen.
# Kopf zeigt in Blender nach +Y (glTF: −Z), Boden z = 0, Maße in Prosoma-Längen (CL) und per Objektmaßstab auf echte Größe gebracht.
import bpy, bmesh, math, random, sys, os, json, time
import numpy as np
from mathutils import Vector, Matrix, Quaternion
from mathutils import noise as mn

T0 = time.time()
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ART = argv[0] if len(argv) > 0 else 'winkel'
RES = argv[1] if len(argv) > 1 else 'hd'
OUT = argv[2] if len(argv) > 2 else os.getcwd()
HD = RES == 'hd'; XS = RES == 'xs'
TEXS = int(argv[3]) if len(argv) > 3 else {'hd': 1024, 'lo': 512, 'xs': 256}[RES]
os.makedirs(OUT, exist_ok=True)
SEED = sum(map(ord, ART)) * 7 + 3
random.seed(SEED); np.random.seed(SEED)
R = random.uniform

SEGN = ['coxa', 'troch', 'femur', 'patella', 'tibia', 'meta', 'tarsus']
SEGR = [.115, .10, .088, .082, .072, .054, .042]          # Grundradien je Glied (× thick)
PALPN = ['troch', 'femur', 'patella', 'tibia', 'tarsus']
D = lambda **k: k
SP = {
  'nosferatu': D(id=0, cl=.0075, pro=(.40, .5, .20), abd=(.37, .60, .31), H=.40, abdz=.05, tilt=-.06, legs=(1.0, .95, .86, 1.07),
    seg=(.30, .13, .98, .42, .82, .86, .42), thick=1.0, yaw=(36, 70, 108, 146), fem=(.85, .78, .72, .80), headnar=.30, ceph=.12,
    hair=1.0, hairlen=.9, spines=1.0, eyes='zoropsis', palp=1.0, chel=1.0, shape='oval', cyc=24, stride=.75, lift=.32, hcol=(.26, .2, .14)),
  'huntsman': D(id=1, cl=.0125, pro=(.48, .5, .14), abd=(.38, .56, .19), H=.30, abdz=.0, tilt=0, legs=(1.12, 1.22, 1.0, 1.06),
    seg=(.30, .12, 1.45, .50, 1.42, 1.45, .55), thick=.85, yaw=(50, 76, 102, 126), fem=(.55, .5, .48, .5), headnar=.18, ceph=.05,
    hair=.7, hairlen=.6, spines=1.2, eyes='huntsman', palp=1.0, chel=.9, shape='flat', cyc=16, stride=1.5, lift=.4, hcol=(.2, .15, .1)),
  'winkel': D(id=2, cl=.0080, pro=(.39, .5, .20), abd=(.37, .60, .32), H=.42, abdz=.06, tilt=-.08, legs=(1.05, .95, .88, 1.12),
    seg=(.30, .13, 1.2, .45, 1.15, 1.4, .6), thick=.88, yaw=(36, 70, 108, 146), fem=(.9, .82, .75, .85), headnar=.32, ceph=.10,
    hair=1.0, hairlen=1.1, spines=1.3, eyes='agelenid', palp=1.0, chel=1.0, shape='oval', cyc=18, stride=1.0, lift=.35, hcol=(.15, .1, .065), spinn='long'),
  'kreuz': D(id=3, cl=.0062, pro=(.38, .5, .22), abd=(.62, .72, .62), H=.48, abdz=.22, tilt=.22, legs=(1.10, 1.0, .74, .95),
    seg=(.28, .12, 1.0, .42, .85, .85, .38), thick=.86, yaw=(30, 66, 110, 150), fem=(.95, .85, .8, .9), headnar=.35, ceph=.14,
    hair=.6, hairlen=.6, spines=1.5, eyes='araneus', palp=.9, chel=1.0, shape='globe', cyc=26, stride=.6, lift=.3, hcol=(.3, .2, .11)),
  'wolf': D(id=4, cl=.0095, pro=(.38, .5, .27), abd=(.36, .55, .32), H=.44, abdz=.04, tilt=-.04, legs=(.95, .9, .86, 1.15),
    seg=(.30, .13, .95, .42, .80, .95, .45), thick=1.05, yaw=(38, 70, 108, 146), fem=(.8, .74, .7, .78), headnar=.26, ceph=.22,
    hair=1.1, hairlen=.8, spines=1.0, eyes='wolf', palp=1.0, chel=1.05, shape='oval', cyc=16, stride=.9, lift=.3, hcol=(.22, .17, .12)),
  'vogel': D(id=5, cl=.024, pro=(.45, .5, .19), abd=(.48, .62, .44), H=.40, abdz=.04, tilt=-.02, legs=(1.0, .93, .86, 1.08),
    seg=(.32, .14, .95, .55, .75, .75, .45), thick=1.5, yaw=(32, 68, 110, 148), fem=(.75, .7, .66, .72), headnar=.15, ceph=.06,
    hair=2.2, hairlen=1.5, spines=0, eyes='tarantula', palp=1.25, chel=1.0, shape='oval', cyc=34, stride=.6, lift=.26, hcol=(.3, .16, .08), orth=1),
}
S = SP[ART]
AX, AY, AZ = S['pro']; BX, BY, BZ = S['abd']; H = S['H']; TH = S['thick']
BYC = -(AY + .05 + BY * .95); BZC = H + S['abdz']; TL = S['tilt']

def ss(a, b, x):
  t = min(1., max(0., (x - a) / (b - a))); return t * t * (3 - 2 * t)

# ---------------------------------------------------------------- Formen: Prosoma (Kopfbrust) und Opisthosoma (Hinterleib)
def taper(uy): return 1 - S['headnar'] * ss(-.15, 1.0, uy)
def topmod(ux, uy):
  m = 1 + S['ceph'] * math.exp(-((uy - .45) / .38) ** 2) - .22 * math.exp(-(ux * ux * 3 + (uy + .18) ** 2) / .025)
  if S['eyes'] == 'tarantula': m += .45 * math.exp(-(ux * ux + (uy - .74) ** 2) / .012)
  if S['eyes'] == 'wolf': m += .12 * math.exp(-(ux * ux + (uy - .8) ** 2) / .03)
  if S['eyes'] == 'araneus': m += .1 * math.exp(-(ux * ux + (uy - .86) ** 2) / .01)
  return m
def pro_point(sx, sy, sz):
  x = sx * AX * taper(sy); y = sy * AY
  z = H + AZ * (sz ** .85) * topmod(sx, sy) if sz >= 0 else H - AZ * .55 * ((-sz) ** .8)
  k = 1 + .012 * mn.noise(Vector((sx * 2.3 + 1.7, sy * 2.3, sz * 2.3)))
  return Vector((x * k, y, H + (z - H) * k))
def pro_top(x, y):
  uy = y / AY; ux = x / (AX * taper(uy)); sz = math.sqrt(max(0., 1 - ux * ux - uy * uy)); return H + AZ * (sz ** .85) * topmod(ux, uy)
def abd_local(sx, sy, sz):
  x, y, z = sx * BX, sy * BY, sz * BZ; sh = S['shape']
  if sh == 'oval': x *= 1 + .10 * (-sy) - .10 * max(0., sy) ** 3; z *= 1 + .06 * (-sy) - .08 * max(0., sy) ** 3
  elif sh == 'globe':
    x *= 1 + .05 * (-sy) - .12 * max(0., sy) ** 3
    z += BZ * .18 * sum(math.exp(-((sx - s * .5) ** 2 + (sy - .35) ** 2) / .05) for s in (-1, 1)) * max(0., sz)
  elif sh == 'flat': x *= 1 + .06 * (-sy) - .1 * max(0., sy) ** 3
  if sz < 0: z *= .9
  k = 1 + .028 * mn.noise(Vector((sx * 1.7 + 3.1, sy * 1.7, sz * 1.7))) + .01 * mn.noise(Vector((sx * 5 + 9, sy * 5, sz * 5)))
  return x * k, y * k, z * k
def abd_point(sx, sy, sz):
  lx, ly, lz = abd_local(sx, sy, sz); ct, st = math.cos(TL), math.sin(TL)
  return Vector((lx, BYC + ly * ct - lz * st, BZC + ly * st + lz * ct))

# ---------------------------------------------------------------- Netz-Bausatz (Eckpunkte mit Attributen und Gewichten)
class MB:
  def __init__(s):
    s.V = []; s.F = []; s.A = {k: [] for k in ('part', 'leg', 'seg', 'segt', 'ca', 'sa', 'al', 'rad', 'cid')}; s.W = []; s.N = []; s.UV = []; s.cid = 0
  def v(s, co, part, w, leg=-1, seg=-1, segt=0., ca=1., sa=0., al=0., n=None, rad=0.):
    s.V.append(Vector(co)); A = s.A
    for k, val in (('part', part), ('leg', leg), ('seg', seg), ('segt', segt), ('ca', ca), ('sa', sa), ('al', al), ('rad', rad), ('cid', s.cid)): A[k].append(float(val))
    s.W.append(w); s.N.append(n); return len(s.V) - 1
  def f(s, *ids, uv=None): s.F.append(ids); s.UV.append(uv)

def add_sphere(mb, NU, NV, fpt, part, wfun, leg=-1):
  mb.cid += 1; top = fpt(0, 0, 1); it = mb.v(top, part, wfun(top), leg); rows = []
  for j in range(1, NV):
    th = math.pi * j / NV; row = []
    for i in range(NU):
      ph = 2 * math.pi * i / NU; p = fpt(math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th)); row.append(mb.v(p, part, wfun(p), leg))
    rows.append(row)
  bot = fpt(0, 0, -1); ib = mb.v(bot, part, wfun(bot), leg)
  for i in range(NU): mb.f(it, rows[0][i], rows[0][(i + 1) % NU])
  for j in range(len(rows) - 1):
    for i in range(NU): mb.f(rows[j][i], rows[j + 1][i], rows[j + 1][(i + 1) % NU], rows[j][(i + 1) % NU])
  for i in range(NU): mb.f(rows[-1][i], ib, rows[-1][(i + 1) % NU])

def prof(k, t, nseg):
  p = (1 - .1 * t) * (1 + .07 * math.exp(-((1 - t) / .1) ** 2)) * (1 - .10 * math.exp(-(t / .06) ** 2))
  if k == nseg - 1: p *= 1 - .55 * t ** 1.3
  return p

def leg_chain(base, d, pitches, lengths):
  pts = [base.copy()]; z = Vector((0, 0, 1))
  for p, L in zip(pitches, lengths): pts.append(pts[-1] + (d * math.cos(p) + z * math.sin(p)).normalized() * L)
  return pts

def samples(L, k, nseg):
  if HD: ts = [.06, .16] + list(np.linspace(.3, .86, max(1, int(round(L * 4))))) + [.95]
  elif XS: ts = ([] if L < .5 else [.5]) if k < nseg - 1 else [.6]
  else: ts = [.12] + list(np.linspace(.4, .8, max(1, int(round(L * 1.4))))) + ([.93] if L > .25 else [])
  if k == nseg - 1 and not XS: ts = [t for t in ts if t < .9] + ([.9] if HD else [])
  return sorted(set(round(t, 3) for t in ts))

def add_tube(mb, pts, radii, nrm, sides, part, bones, legi, bow=None, flat=.9, al0=0., tip=True):
  mb.cid += 1; n = len(pts) - 1; T = [(pts[k + 1] - pts[k]).normalized() for k in range(n)]; Ls = [(pts[k + 1] - pts[k]).length for k in range(n)]
  acc = [0.]
  for L in Ls: acc.append(acc[-1] + L)
  rings, info = [], []
  def ring(c, Tv, r, w, seg, segt, al):
    u = Tv.cross(nrm).normalized(); nn = u.cross(Tv).normalized(); ids = []
    if u.z < 0: u = -u
    for i in range(sides):
      a = 2 * math.pi * i / sides; ca, sa = math.cos(a), math.sin(a)
      ids.append(mb.v(c + nn * (ca * r * flat) + u * (sa * r), part, w, legi, seg, segt, ca, sa, al, rad=r))
    return ids
  rings.append(ring(pts[0], T[0], radii[0] * prof(0, 0, n), {bones[0]: 1.}, 0, 0., al0)); info.append((0, 0.))
  for k in range(n):
    u = T[k].cross(nrm).normalized(); u = u if u.z >= 0 else -u
    for t in samples(Ls[k], k, n):
      c = pts[k] + T[k] * (Ls[k] * t)
      if bow and bow[k]: c += u * (bow[k] * Ls[k] * math.sin(math.pi * t))
      rings.append(ring(c, T[k], radii[k] * prof(k, t, n), {bones[k]: 1.}, k, t, al0 + acc[k] + Ls[k] * t)); info.append((k, t))
    if k < n - 1:
      rj = .87 * min(radii[k] * prof(k, 1., n), radii[k + 1] * prof(k + 1, 0., n))
      rings.append(ring(pts[k + 1], (T[k] + T[k + 1]).normalized(), rj, {bones[k]: .5, bones[k + 1]: .5}, k + 1, 0., al0 + acc[k + 1])); info.append((k + 1, 0.))
  for a, b in zip(rings, rings[1:]):
    for i in range(sides): mb.f(a[i], b[i], b[(i + 1) % sides], a[(i + 1) % sides])
  if tip:
    tp = mb.v(pts[-1], part, {bones[-1]: 1.}, legi, n - 1, 1., 1., 0., al0 + acc[-1]); last = rings[-1]
    for i in range(sides): mb.f(last[i], tp, last[(i + 1) % sides])
  return dict(T=T, Ls=Ls, acc=acc)

def add_cone(mb, base, d, r, L, sides, part, w, legi=-1, seg=-1, curve=None, rings=3):
  # dünner gebogener Kegel (Kralle, Stachel, Giftklaue, Spinnwarze)
  mb.cid += 1; d = d.normalized(); a = d.cross(Vector((0, 0, 1))); a = a if a.length > 1e-4 else d.cross(Vector((1, 0, 0))); a.normalize(); b = d.cross(a).normalized()
  prev = None
  for j in range(rings):
    t = j / rings; c = base + d * (L * t) + ((curve or Vector()) * (L * t * t)); rr = r * (1 - t)
    ids = [mb.v(c + (a * math.cos(2 * math.pi * i / sides) + b * math.sin(2 * math.pi * i / sides)) * rr, part, w, legi, seg) for i in range(sides)]
    if prev:
      for i in range(sides): mb.f(prev[i], ids[i], ids[(i + 1) % sides], prev[(i + 1) % sides])
    prev = ids
  tp = mb.v(base + d * L + ((curve or Vector()) * L), part, w, legi, seg)
  for i in range(sides): mb.f(prev[i], tp, prev[(i + 1) % sides])

# ---------------------------------------------------------------- Bau
mb = MB(); hb = MB(); BONES = []      # (name, head, tail, parent, connect, zvec)
LEGS = {}                              # Name → dict(pts, nrm, tip)
BONES.append(('root', Vector((0, 0, 0)), Vector((0, .3, 0)), None, False, Vector((0, 0, 1))))
BONES.append(('body', Vector((0, 0, H)), Vector((0, AY * .7, H)), 'root', False, Vector((0, 0, 1))))
ped0 = Vector((0, -AY * .92, H - AZ * .12)); abdF = abd_point(0, 1, -.1); abdB = abd_point(0, -1, 0)
BONES.append(('abdomen', ped0, Vector((0, BYC, BZC)), 'body', False, Vector((0, 0, 1))))
sides = (10 if TH > 1.3 else 8) if HD else (5 if XS else 6)

# Prosoma und Hinterleib
add_sphere(mb, 34 if HD else (10 if XS else 16), 22 if HD else (6 if XS else 10), pro_point, 0, lambda p: {'body': 1.})
add_sphere(mb, 34 if HD else (10 if XS else 16), 24 if HD else (7 if XS else 12), abd_point, 1, lambda p: {'abdomen': 1.})
# Petiolus (Stielchen)
add_tube(mb, [ped0, abdF], [AZ * .28], Vector((1, 0, 0)), sides, 10, ['abdomen'], -1, tip=False)

# Beine
for s in (-1, 1):
  for i in range(4):
    nm = ('L' if s < 0 else 'R') + str(i + 1); yaw = math.radians(S['yaw'][i]); d = Vector((s * math.sin(yaw), math.cos(yaw), 0))
    ang = math.radians((30, 62, 98, 132)[i]); r0 = .8
    base = Vector((s * math.sin(ang) * AX * r0 * taper(math.cos(ang) * r0), math.cos(ang) * AY * r0, H - AZ * .22))
    lens = [S['seg'][k] * (S['legs'][i] if k >= 2 else 1.) for k in range(7)]
    radii = [SEGR[k] * TH * (1.08 if i == 0 or i == 3 else 1.) for k in range(7)]
    bp = [.30, .45, S['fem'][i], -.12, -.62, -.95, -.55]; wgt = [0, 0, 0, .4, 1, 1, .7]
    def tipz(dl):
      return leg_chain(base, d, [b + dl * w for b, w in zip(bp, wgt)], lens)[-1].z
    lo, hi = -1.4, 1.4
    for _ in range(50):
      mid = (lo + hi) / 2
      if tipz(mid) > radii[6] * .25: hi = mid
      else: lo = mid
    pitches = [b + mid * w for b, w in zip(bp, wgt)]
    pts = leg_chain(base, d, pitches, lens); nrm = d.cross(Vector((0, 0, 1))).normalized()
    bones = [nm + '_' + n for n in SEGN]
    for k in range(7):
      Tk = (pts[k + 1] - pts[k]).normalized(); up = Tk.cross(nrm).normalized(); up = up if up.z >= 0 else -up
      BONES.append((bones[k], pts[k], pts[k + 1], 'body' if k == 0 else bones[k - 1], k > 0, up))
    li = (0 if s < 0 else 4) + i
    info = add_tube(mb, pts, radii, nrm, sides, 2, bones, li, bow=[0, 0, .035, .02, .03, .015, .02])
    LEGS[nm] = dict(pts=pts, nrm=nrm, radii=radii, info=info, bones=bones, li=li, d=d, side=s, i=i)
    # Krallen
    if HD:
      tp = pts[-1]; Tt = (pts[-1] - pts[-2]).normalized()
      for c in (-1, 1): add_cone(mb, tp - Tt * radii[6] * .3 + nrm * (c * radii[6] * .25), Tt + Vector((0, 0, -.6)), radii[6] * .22, radii[6] * 1.2, 3, 9, {bones[-1]: 1.}, li, 6, curve=Vector((0, 0, -.5)) * radii[6], rings=2)

# Pedipalpen
for s in (-1, 1):
  nm = ('L' if s < 0 else 'R') + 'p'; yaw = math.radians(16); d = Vector((s * math.sin(yaw), math.cos(yaw), 0)); pf = S['palp']
  base = Vector((s * AX * .24 * taper(.9), AY * .86, H - AZ * .38))
  lens = [l * pf for l in (.10, .42, .20, .28, .32)]; radii = [r * TH * min(pf, 1.15) for r in (.062, .06, .056, .052, .048)]
  pitches = [.2, .55, -.15, -.65, -1.05] if not S.get('orth') else [.15, .45, -.1, -.5, -.85]
  pts = leg_chain(base, d, pitches, lens); nrm = d.cross(Vector((0, 0, 1))).normalized(); bones = [nm + '_' + n for n in PALPN]
  for k in range(5):
    Tk = (pts[k + 1] - pts[k]).normalized(); up = Tk.cross(nrm).normalized(); up = up if up.z >= 0 else -up
    BONES.append((bones[k], pts[k], pts[k + 1], 'body' if k == 0 else bones[k - 1], k > 0, up))
  add_tube(mb, pts, radii, nrm, 4 if XS else max(5, sides - 2), 3, bones, 8 + (0 if s < 0 else 1), bow=[0, .03, 0, .02, 0])
  LEGS[nm] = dict(pts=pts, nrm=nrm, radii=radii, bones=bones, li=8 + (0 if s < 0 else 1), d=d, side=s, i=-1, palp=True)

# Cheliceren mit Giftklauen
for s in (-1, 1):
  nm = ('L' if s < 0 else 'R') + '_chel'; cf = S['chel']
  if S.get('orth'):
    c = Vector((s * .1, AY * .98, H - AZ * .15)); rad = Vector((.095, .2, .12)) * cf; rot = Matrix.Rotation(-.25, 3, 'X')
  else:
    c = Vector((s * .085 * cf, AY * .92, H - AZ * .45)); rad = Vector((.08, .09, .19)) * cf; rot = Matrix.Rotation(.3, 3, 'X')
  def cp(sx, sy, sz, c=c, rad=rad, rot=rot):
    k = 1 + .04 * mn.noise(Vector((sx * 3 + s, sy * 3, sz * 3)))
    return c + rot @ Vector((sx * rad.x * k, sy * rad.y * k, sz * rad.z * (1 - .15 * max(0., -sz))))
  add_sphere(mb, 14 if HD else (6 if XS else 8), 10 if HD else (4 if XS else 6), cp, 4, lambda p, nm=nm: {nm: 1.})
  top = cp(0, 0, 1); tipp = cp(0, .3, -1) if not S.get('orth') else cp(0, .95, -.3)
  BONES.append((nm, top, tipp, 'body', False, Vector((0, 1, 0))))
  fd = Vector((-s * .9, -.25, -.35)) if not S.get('orth') else Vector((-s * .2, -.3, -1))
  if not XS: add_cone(mb, tipp + Vector((0, .01, .01)), fd, .028 * cf, .17 * cf * (1.25 if S.get('orth') else 1), 4 if HD else 3, 5, {nm: 1.}, curve=Vector((0, -.4, .25)) * .1 * cf, rings=4 if HD else 2)

# Augen
EYES = {
  'zoropsis': [(.10, .94, .034), (.21, .90, .040), (.10, .80, .052), (.25, .84, .040)],
  'huntsman': [(.08, .94, .036), (.19, .93, .042), (.08, .85, .032), (.21, .86, .040)],
  'agelenid': [(.07, .95, .034), (.17, .92, .040), (.08, .85, .036), (.19, .85, .040)],
  'araneus': [(.065, .93, .046), (.065, .83, .046), (.21, .90, .030), (.215, .865, .028)],
  'wolf': [(.05, .97, .026), (.13, .955, .026), (.105, .87, .066), (.16, .74, .055)],
  'tarantula': [(.035, .82, .030), (.085, .79, .028), (.035, .72, .020), (.08, .72, .024)]}
EYEC = []
for (ex, ey, er) in ([] if XS else EYES[S['eyes']]):
  for s in (-1, 1):
    er *= .78; ey -= .03; y = ey * AY; x = s * ex * AX * taper(ey); z = pro_top(x, y); e = 1e-3
    g = Vector(((pro_top(x + e, y) - pro_top(x - e, y)) / (2 * e), (pro_top(x, y + e) - pro_top(x, y - e)) / (2 * e), -1)); nrm = -g.normalized()
    if nrm.z < 0: nrm = -nrm
    c = Vector((x, y, z)) - nrm * er * .3; EYEC.append((c, er))
    add_sphere(mb, 10 if HD else 6, 7 if HD else 4, lambda sx, sy, sz, c=c, er=er: c + Vector((sx, sy, sz)) * er, 6, lambda p: {'body': 1.})

# Spinnwarzen
for s in ((-1, 1) if S.get('spinn') != 'long' else (-1, 1)):
  bpt = abd_point(s * .1, -.94, -.25); dd = (abdB - abd_point(0, -.6, -.1)).normalized() + Vector((s * .15, 0, -.25))
  L = .32 if S.get('spinn') == 'long' else .12
  add_cone(mb, bpt, dd, .05 if S.get('spinn') == 'long' else .045, L, 5 if HD else 3, 8, {'abdomen': 1.}, curve=Vector((0, 0, .15)) * L, rings=3 if HD else (1 if XS else 2))

# Stacheln (Macrosetae) – nur hd
if HD and S['spines'] > 0:
  for nm, Lg in LEGS.items():
    if Lg.get('palp'): continue
    pts, nrm, radii, bones = Lg['pts'], Lg['nrm'], Lg['radii'], Lg['bones']
    for k, cnt in ((2, 3), (3, 1), (4, 4), (5, 4)):
      n = int(round(cnt * S['spines'] * (1 + .3 * (Lg['i'] == 0)))); Tk = (pts[k + 1] - pts[k]).normalized(); u = Tk.cross(nrm).normalized(); u = u if u.z >= 0 else -u
      for j in range(n):
        t = R(.15, .9); a = R(-.6, .6) + (math.pi / 2 if (k == 2 or j % 3 == 0) else -math.pi / 2) + (math.pi * (j % 2) * .5)
        rad = (nrm * math.cos(a) * .9 + u * math.sin(a)).normalized(); r = radii[k] * prof(k, t, 7)
        base = pts[k] + Tk * ((pts[k + 1] - pts[k]).length * t) + rad * r * .85
        dirv = (Tk * math.cos(.5) + rad * math.sin(.5)).normalized()
        add_cone(mb, base, dirv, r * .13, r * R(1.4, 2.3) * (1.2 if ART in ('winkel', 'huntsman') else 1.), 3, 7, {bones[k]: 1.}, Lg['li'], k, rings=1)

# Haarkarten – nur hd
def card(base, dirv, side, L, W, n_out, bone, strip):
  u0 = strip * .25; u1 = u0 + .25
  p0 = base - side * (W / 2); p1 = base + side * (W / 2); p2 = base + dirv * L + side * (W * .4); p3 = base + dirv * L - side * (W * .4)
  w = {bone: 1.}; ids = [hb.v(p, 11, w, n=n_out) for p in (p0, p1, p2, p3)]
  hb.f(*ids, uv=[(u0, 0), (u1, 0), (u1, 1), (u0, 1)])
if HD and S['hair'] > 0:
  for nm, Lg in LEGS.items():
    pts, nrm, radii, bones = Lg['pts'], Lg['nrm'], Lg['radii'], Lg['bones']; nseg = len(pts) - 1
    for k in range(1 if not Lg.get('palp') else 0, nseg):
      Lk = (pts[k + 1] - pts[k]).length; Tk = (pts[k + 1] - pts[k]).normalized(); u = Tk.cross(nrm).normalized(); u = u if u.z >= 0 else -u
      n = int(S['hair'] * 16 * Lk * (1 + TH) * (1.4 if k == nseg - 1 else 1))
      for j in range(n):
        t = R(.04, .97); a = R(0, 2 * math.pi); rad = (nrm * math.cos(a) + u * math.sin(a)).normalized(); r = radii[k] * prof(k, t, nseg)
        base = pts[k] + Tk * (Lk * t) + rad * r * .85; al = R(.22, .6)
        dirv = (Tk * math.cos(al) + rad * math.sin(al)).normalized()
        side = rad.cross(dirv).normalized(); roll = R(-1.2, 1.2); side = (side * math.cos(roll) + rad * math.sin(roll)).normalized()
        L = r * R(.9, 1.7) * S['hairlen']; card(base, dirv, side, L, L * R(.35, .55), rad, bones[k], random.randrange(4))
  for s_ in (-1, 1):
    for j in range(int(S['hair'] * 24)):
      cc = Vector((s_ * .085 * S['chel'], AY * .92, H - AZ * .45)); a = R(-1.2, 1.2); zz = R(-.18, .15)
      p = cc + Vector((s_ * .08 * math.cos(a) * S['chel'], .09 * S['chel'] * math.sin(a) + .02, zz * S['chel'])); nn = (p - cc).normalized()
      dirv = (nn * .5 + Vector((0, .2, -.9))).normalized(); side = nn.cross(dirv).normalized(); L = .07 * S['hairlen'] * R(.6, 1.2)
      card(p - nn * .005, dirv, side, L, L * .5, nn, ('L' if s_ < 0 else 'R') + '_chel', random.randrange(4))
  nb = int(S['hair'] * 260)
  for j in range(nb):
    sx, sy, sz = np.random.normal(size=3); l = math.sqrt(sx * sx + sy * sy + sz * sz); sx, sy, sz = sx / l, sy / l, sz / l
    if sz < -.35: continue
    p = abd_point(sx, sy, sz); c0 = Vector((0, BYC, BZC)); nn = (p - c0).normalized()
    dirv = (Vector((0, -1, 0)) * .85 + nn * R(.12, .4)).normalized(); side = nn.cross(dirv).normalized(); roll = R(-1, 1); side = (side * math.cos(roll) + nn * math.sin(roll)).normalized()
    L = .085 * S['hairlen'] * R(.6, 1.4); card(p - nn * .008, dirv, side, L, L * R(.4, .6), nn, 'abdomen', random.randrange(4))
  for j in range(int(S['hair'] * 55)):
    a = R(0, 2 * math.pi); rr = R(.55, .98); sx, sy = math.cos(a) * rr, math.sin(a) * rr; sz = math.sqrt(max(0., 1 - sx * sx - sy * sy))
    p = pro_point(sx, sy, sz); nn = Vector((sx * .6, sy * .3, 1)).normalized(); dirv = (Vector((sx, sy - .4, 0)).normalized() * .7 + nn * .5).normalized()
    side = nn.cross(dirv).normalized(); L = .08 * S['hairlen'] * R(.6, 1.3); card(p - nn * .005, dirv, side, L, L * .6, nn, 'body', random.randrange(4))

print('Bau', ART, RES, 'Eckpunkte', len(mb.V), 'Flächen', len(mb.F), 'Haar', len(hb.F), '%.1fs' % (time.time() - T0), flush=True)

# ---------------------------------------------------------------- Blender-Objekte
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
scn = bpy.context.scene; coll = scn.collection
arm_d = bpy.data.armatures.new('spinne_' + ART); arm = bpy.data.objects.new('spinne_' + ART, arm_d); coll.objects.link(arm)
bpy.context.view_layer.objects.active = arm; arm.select_set(True); bpy.ops.object.mode_set(mode='EDIT')
for (n, h, t, p, c, z) in BONES:
  b = arm_d.edit_bones.new(n); b.head = h; b.tail = t
  if z is not None: b.align_roll(z)
  if p: b.parent = arm_d.edit_bones[p]; b.use_connect = c
bpy.ops.object.mode_set(mode='OBJECT')

def make_obj(name, m, smooth=True):
  me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in m.V], [], [tuple(f) for f in m.F]); me.update()
  for k, vals in m.A.items():
    if k in ('rad', 'cid'): continue
    at = me.attributes.new(k, 'FLOAT', 'POINT'); at.data.foreach_set('value', vals)
  me.polygons.foreach_set('use_smooth', [smooth] * len(me.polygons))
  ob = bpy.data.objects.new(name, me); coll.objects.link(ob); ob.parent = arm
  groups = {}
  for i, w in enumerate(m.W):
    for bn, wt in w.items():
      g = groups.get(bn) or ob.vertex_groups.new(name=bn); groups[bn] = g; g.add([i], wt, 'REPLACE')
  md = ob.modifiers.new('arm', 'ARMATURE'); md.object = arm
  return ob

body = make_obj('koerper', mb)
bm = bmesh.new(); bm.from_mesh(body.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(body.data); bm.free(); body.data.update()
hair = None
if hb.F:
  hair = make_obj('haar', hb)
  uvl = hair.data.uv_layers.new(name='UVMap')
  for poly, uv in zip(hair.data.polygons, hb.UV):
    for li, c in zip(poly.loop_indices, uv): uvl.data[li].uv = c
  hair.data.normals_split_custom_set_from_vertices([tuple(n) for n in hb.N])

# ---------------------------------------------------------------- UV-Abwicklung des Körpers (eigene: Röhren zylindrisch je Glied, Rest Würfelprojektion)
def face_uvs(m):
  A = m.A; P, CA, SA, AL, RD, SG, CI = A['part'], A['ca'], A['sa'], A['al'], A['rad'], A['seg'], A['cid']
  cen = {}
  for i, c in enumerate(CI): cen.setdefault(c, [Vector(), 0]); cen[c][0] += m.V[i]; cen[c][1] += 1
  cen = {c: v / n for c, (v, n) in cen.items()}
  out = []
  for f in m.F:
    p = int(P[f[0]])
    if p in (2, 3, 10) and all(RD[i] > 0 for i in f):
      ang = [math.atan2(SA[i], CA[i]) for i in f]
      if max(ang) - min(ang) > math.pi: ang = [a + 2 * math.pi if a < 0 else a for a in ang]
      sid = min(SG[i] for i in f); off = 10. * sid
      out.append([(ang[j] * RD[i], AL[i] + off) for j, i in enumerate(f)]); continue
    vs = [m.V[i] for i in f]; nrm = (vs[1] - vs[0]).cross(vs[2] - vs[0]); ctr = sum(vs, Vector()) / len(vs); dc = ctr - cen[CI[f[0]]]
    axi = max(range(3), key=lambda k: abs(nrm[k])); sg = 1 if dc[axi] >= 0 else -1
    k = 1.0
    if p in (0, 1): k = 1.75 if (axi == 2 and sg > 0) else 1.1
    elif p == 6: k = .55
    elif p in (5, 7, 8, 9): k = .7
    if axi == 2: out.append([(v.x * k * sg, v.y * k) for v in vs])
    elif axi == 0: out.append([(v.y * k * sg, v.z * k) for v in vs])
    else: out.append([(v.x * k * sg, v.z * k) for v in vs])
  return out
uvs = face_uvs(mb)
uvl = body.data.uv_layers.new(name='UVMap')
LP = body.data.loops
for pi_, poly in enumerate(body.data.polygons):
  dm = dict(zip(mb.F[pi_], uvs[pi_]))
  for li in poly.loop_indices: uvl.data[li].uv = dm[LP[li].vertex_index]
bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); bpy.context.view_layer.objects.active = body
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
try: bpy.ops.uv.select_all(action='SELECT')
except Exception: pass
try: bpy.ops.uv.pack_islands(rotate=True, margin=.003, scale=True)
except TypeError: bpy.ops.uv.pack_islands(rotate=True, margin=.003)
bpy.ops.object.mode_set(mode='OBJECT')
print('UV fertig %.1fs' % (time.time() - T0), flush=True)

# ---------------------------------------------------------------- Muster (OSL) und Backen
OSL = r'''
#define SPID %(id)d
#define AX %(AX)f
#define AY %(AY)f
#define AZ %(AZ)f
#define HH %(H)f
#define BX %(BX)f
#define BY %(BY)f
#define BZ %(BZ)f
#define BYC %(BYC)f
#define BZC %(BZC)f
#define TL %(TL)f
float fbm(point p, int oct) { float s = 0; float a = .5; point q = p; for (int i = 0; i < oct; i++) { s += a * noise("perlin", q); q = q * 2.07 + point(1.7, 9.2, 3.1); a *= .5; } return s; }
float sd(float a, float b, float x) { return 1 - smoothstep(b, a, x); }
float band(float t, float a, float b, float w) { return smoothstep(a - w, a, t) * (1 - smoothstep(b, b + w, t)); }
float spot(float x, float y, float cx, float cy, float r, float nz) { return 1 - smoothstep(r * .7, r, distance(point(x, y, 0), point(cx, cy, 0)) + nz); }
shader spinne(float part = 0, float leg = -1, float seg = -1, float segt = 0, float ca = 1, float sa = 0, float al = 0,
  output color Col = 0, output float Rough = .5, output float Height = 0)
{
  point Po = transform("object", P); vector Nn = normalize(transform("object", N));
  float ux = Po[0] / AX, uy = Po[1] / AY, uz = (Po[2] - HH) / AZ;
  float dy = Po[1] - BYC, dz = Po[2] - BZC; float ly = dy * cos(TL) + dz * sin(TL), lz = -dy * sin(TL) + dz * cos(TL);
  float vx = Po[0] / BX, vy = ly / BY, vz = lz / BZ;
  float n1 = fbm(Po * 7.0, 4), n2 = fbm(Po * 21.0 + point(5, 1, 2), 3), n3 = noise("perlin", Po * 55.0);
  int ip = (int)floor(part + .5); int sg = (int)floor(seg + .5); int lg = (int)floor(leg + .5);
  float under = sd(.15, -.45, Nn[2]); float ax = fabs(ux), bx = fabs(vx);
  float lr = noise("perlin", point(leg * 3.7, 1.3, 2.1)) * .5 + .5;
  // Haarstriche: an Beinen in Längsrichtung, am Körper nach hinten
  float hl = noise("perlin", point(ca * 30, sa * 30, al * 13 + leg * 3.1)) * .55 + noise("perlin", point(ca * 70, sa * 70, al * 30 + leg)) * .45;
  float hb = noise("perlin", point(Po[0] * 38, Po[1] * 7, Po[2] * 38)) * .6 + noise("perlin", point(Po[0] * 90, Po[1] * 16, Po[2] * 90)) * .4;
  float hair = (ip == 2 || ip == 3) ? hl : hb;
  color c = color(.3, .22, .15); float r = .5; float h = hair * .55 + n3 * .15;
  color pale = color(.5), dark = color(.05), mid = color(.2); float dk = 0; float hairy = .5;
  if (SPID == 0) { pale = color(.20, .13, .07); dark = color(.032, .019, .011); mid = color(.09, .058, .033); hairy = .55; }
  if (SPID == 1) { pale = color(.15, .105, .068); dark = color(.028, .019, .013); mid = color(.072, .05, .032); hairy = .5; }
  if (SPID == 2) { pale = color(.115, .072, .04); dark = color(.022, .014, .009); mid = color(.058, .037, .021); hairy = .6; }
  if (SPID == 3) { pale = color(.28, .14, .045); dark = color(.04, .02, .009); mid = color(.12, .06, .022); hairy = .35; }
  if (SPID == 4) { pale = color(.15, .11, .075); dark = color(.022, .016, .012); mid = color(.065, .047, .033); hairy = .6; }
  if (SPID == 5) { pale = color(.13, .048, .018); dark = color(.011, .009, .008); mid = color(.028, .021, .017); hairy = .7; }
  if (ip == 0) {               // ---- Prosoma
    float rr = sqrt(ux * ux + uy * uy); float ang = atan2(ux, uy + .18);
    float striae = smoothstep(.55, .95, sin(ang * 9.0 + n1 * .8)) * smoothstep(.2, .45, rr) * (1 - smoothstep(.85, .95, rr));
    float rim = smoothstep(.88, .97, rr + n2 * .03);
    if (SPID == 0) {          // Nosferatu: dunkles „Gesicht“ mit hellen Augenhöhlen, dunkle Seitenbänder, heller Rand
      float lat = smoothstep(.42, .52, ax + n1 * .08) * (1 - smoothstep(.78, .86, ax + n1 * .05));
      float fw = .19 + .15 * smoothstep(-.6, .45, uy) - .1 * smoothstep(.55, .9, uy);
      float face = (1 - smoothstep(fw - .03, fw + .03, ax + n1 * .04)) * smoothstep(-.78, -.55, uy) * (1 - smoothstep(.9, .97, uy));
      float holes = spot(ax, uy, .11, .2, .085, n2 * .02) + spot(ax, uy, .05, -.25, .05, n2 * .02) * .7;
      float med = (1 - smoothstep(.018, .04, ax)) * smoothstep(-.75, -.4, uy) * (1 - smoothstep(-.15, .05, uy));
      dk = clamp(max(max(lat, face * (1 - holes)), rim * .8) + striae * .45 * (1 - lat) - med, 0, 1);
    } else if (SPID == 1) {   // Riesenkrabbenspinne: marmoriert, heller Stirnstreifen, dunkle Strahlen
      float mot = smoothstep(.1, .35, n1 + n2 * .5);
      dk = clamp(mot * .55 + striae * .5 + rim * .7 - smoothstep(.8, .9, uy) * .8, 0, 1);
    } else if (SPID == 2) {   // Hauswinkelspinne: zwei dunkle Längsbänder mit Einkerbungen, heller Mittelstreif
      float bnd = smoothstep(.16, .24, ax + n1 * .06) * (1 - smoothstep(.52, .62, ax + n1 * .06 + .08 * sin(uy * 18)));
      dk = clamp(bnd * .9 + rim * .9 + striae * .3, 0, 1);
    } else if (SPID == 3) {   // Kreuzspinne: dunkle Mittellinie, dunkler Rand
      float medl = 1 - smoothstep(.07, .13, ax + n1 * .03); dk = clamp(medl * .85 * smoothstep(-.8, -.5, uy) + rim + striae * .25 + smoothstep(.5, .8, ax) * .5, 0, 1);
    } else if (SPID == 4) {   // Wolfsspinne: helles Mittelband und helle Seitenbänder auf Dunkel
      float mw = .13 + .1 * exp(-pow((uy + .1) / .3, 2)) - .07 * smoothstep(.5, .85, uy);
      float medb = 1 - smoothstep(mw - .02, mw + .02, ax + n1 * .03); float latb = smoothstep(.6, .66, ax + n1 * .04) * (1 - smoothstep(.8, .86, ax));
      dk = clamp(1 - medb - latb * .85 + striae * .2, 0, 1); dk = max(dk, smoothstep(.82, .9, uy) * .9);
    } else {                  // Vogelspinne: fast schwarz, goldene Strahlen und Randhaare
      dk = clamp(1 - striae * .55 - smoothstep(.75, .95, rr) * .45, 0, 1);
    }
    c = mix(pale * (.82 + .35 * n2), dark * (.75 + .5 * n2), dk); c = mix(c, mid * .8, under * .8);
    r = mix(.36, .5, dk) + hairy * .12; h = h * (.5 + hairy * .5) + n2 * .2;
  } else if (ip == 1) {        // ---- Hinterleib
    float top = smoothstep(-.35, .25, vz); float mot = n1 * .5 + .5;
    if (SPID == 0) {          // Nosferatu: helles Grau-Beige, dunkles Herzmal, Fleckenpaare hinten, gefleckte Flanken
      float card = (1 - smoothstep(.07, .11, bx - .07 * sin(clamp((vy - .05) / .9, 0, 1) * 3.1416) + n1 * .03)) * smoothstep(.0, .12, vy);
      float sp = 0; for (int i = 0; i < 4; i++) { float yy = -.05 - i * .22; sp = max(sp, spot(bx, vy, .17 - i * .025, yy, .085 - i * .012, n2 * .03)); }
      float flank = smoothstep(.45, .85, bx) * smoothstep(.1, .4, mot + n2 * .4);
      dk = clamp((card * .95 + sp * .9 + flank * .6) * top + mot * .15, 0, 1);
    } else if (SPID == 1) {
      float arrow = (1 - smoothstep(.12, .2, bx + n1 * .05 - .12 * sd(.3, -.5, vy))) * smoothstep(-.9, -.3, vy);
      dk = clamp(arrow * .6 * top + smoothstep(.2, .55, mot + n3 * .3) * .55 + smoothstep(.3, .6, noise("perlin", Po * 30)) * .2, 0, 1);
    } else if (SPID == 2) {   // Hauswinkelspinne: dunkel mit hellem Fischgrätmuster
      float v = vy + bx * 1.1; float chev = smoothstep(.55, .85, sin(v * 15.0 + n1 * 1.5)) * (1 - smoothstep(.45, .65, bx)) * sd(.25, -.2, vy);
      float medp = (1 - smoothstep(.14, .2, bx + n1 * .04)) * smoothstep(-.1, .1, vy) * (1 - smoothstep(.75, .95, vy)); float card = (1 - smoothstep(.04, .07, bx)) * smoothstep(.15, .3, vy);
      float sp = 0; for (int i = 0; i < 5; i++) sp = max(sp, spot(bx, vy, .22, -.05 - i * .17, .06, n2 * .03));
      dk = clamp(1 - (chev * .8 + medp * .7 + sp * .85) * top + card * .8 + n2 * .1, 0, 1);
    } else if (SPID == 3) {   // Kreuzspinne: Folium (gewellt), weißes Kreuz aus Flecken
      float fol = (1 - smoothstep(.36, .42, bx - .07 * sin(vy * 16.0) + n1 * .05 - .18 * sd(.6, -.6, vy))) * smoothstep(-.95, -.7, vy) * (1 - smoothstep(.6, .8, vy));
      float cr = 0; for (int i = 0; i < 6; i++) cr = max(cr, spot(bx, vy, 0, .62 - i * .12, .055, n2 * .02));
      cr = max(cr, spot(bx, vy, .13, .32, .05, n2 * .02)); cr = max(cr, spot(bx, vy, .25, .32, .045, n2 * .02));
      float edge = 0; for (int i = 0; i < 7; i++) edge = max(edge, spot(bx, vy, .40 - .02 * i + .03 * sin(i * 1.7), .55 - i * .2, .035, n2 * .02));
      dk = clamp(fol * .75 * top + n2 * .15 + (1 - top) * .3, 0, 1); c = mix(pale * (.8 + .4 * n2), dark, dk);
      c = mix(c, color(.55, .5, .4), clamp(cr + edge * .8, 0, 1) * top); r = .38; h = h * .4 + n2 * .2;
    } else if (SPID == 4) {   // Wolfsspinne: dunkel, helles Herzmal (dunkel umrandet), helle Winkel
      float lw = .13 * sin(clamp((vy + .1) / .95, 0, 1) * 3.1416);
      float card = 1 - smoothstep(lw - .02, lw + .01, bx + n1 * .02); float outl = (1 - smoothstep(lw + .01, lw + .06, bx)) * (1 - card);
      float v = vy + bx * .9; float chev = smoothstep(.6, .9, sin(v * 13.0)) * (1 - smoothstep(.35, .55, bx)) * sd(-.05, -.25, vy);
      dk = clamp(1 - (card * .75 + chev * .55 + smoothstep(.45, .85, bx) * smoothstep(.2, .6, mot) * .5) * top + outl * .5, 0, 1);
    } else {                  // Vogelspinne: schwarz, rötlich durchschimmernd
      dk = .85 + n2 * .1; c = mix(pale * .5, dark, dk);
    }
    if (SPID != 3) { c = mix(pale * (.8 + .4 * n2), dark * (.7 + .6 * n2), dk); r = mix(.42, .55, dk) + hairy * .12; }
    c = mix(c, mid * .9 + pale * .2, under * .85); h = h * (.6 + hairy * .5);
  } else if (ip == 2 || ip == 3) { // ---- Beine und Taster: Ringelung je Glied
    float rings = 0; float t = segt;
    if (SPID == 0) rings = (sg == 2 ? band(t, .45, .58, .05) + band(t, .8, 1, .04) : sg == 4 ? band(t, .0, .12, .04) + band(t, .55, .7, .05) : sg == 5 ? band(t, .7, 1, .05) * .7 : sg == 3 ? .6 : 0) + smoothstep(.3, .5, n2) * .35;
    if (SPID == 1) rings = (sg == 2 ? band(t, .75, 1, .05) : sg == 4 ? band(t, .8, 1, .05) : sg == 6 ? .8 : 0) * .7 + smoothstep(.2, .5, noise("perlin", point(ca * 3.5, sa * 3.5, al * 5.5 + leg))) * .55;
    if (SPID == 2) rings = (sg == 2 ? band(t, .6, .75, .06) * .5 : sg == 4 ? band(t, .1, .25, .06) * .5 + band(t, .7, .85, .06) * .5 : 0) + smoothstep(.2, .6, n1) * .2;
    if (SPID == 3) rings = (sg == 2 ? band(t, .65, 1, .03) : sg == 3 ? .9 : sg == 4 ? band(t, 0, .15, .03) + band(t, .6, 1, .03) : sg == 5 ? band(t, .5, 1, .03) : sg == 6 ? band(t, .5, 1, .05) : 0);
    if (SPID == 4) rings = (sg == 2 ? band(t, .5, .7, .08) * .4 : sg == 4 ? band(t, .4, .6, .08) * .4 : 0) + .35 + smoothstep(.2, .6, n1) * .2;
    if (SPID == 5) { rings = 1 - (sg == 3 ? band(t, .05, .95, .05) * .9 : sg == 4 ? band(t, 0, .18, .04) * .8 : 0) * smoothstep(-.2, .5, sa); }
    dk = clamp(rings, 0, 1); c = mix(pale * (.75 + .4 * n2 + .1 * lr), dark * (.8 + .5 * n2), dk);
    if (SPID == 5) c = mix(pale * (1.1 + .3 * n2), dark * (.8 + .5 * n2), dk);
    c *= mix(1, .6, sd(-.1, -.9, sa)) * (1 - .45 * exp(-segt * 28)) * (sg >= 5 ? .8 : 1);
    if (ip == 3 && SPID != 5) c = mix(c, mid, .25);
    c *= .9 + .2 * hl; r = .52 + hairy * .22 - .08 * exp(-segt * 25); h = hl * (.25 + hairy * .3) + n3 * .08;
  } else if (ip == 4) { c = mix(dark * 1.2, mid * .7, smoothstep(.2, .8, n2 + .3) * .5); if (SPID == 1 || SPID == 4) c = dark * .9; c *= .85 + .3 * hb; r = .45 + hairy * .15; h = hb * .5 + n3 * .15;
  } else if (ip == 5) { c = color(.035, .012, .008) + color(.12, .035, .02) * smoothstep(.2, .9, n1 + .5); r = .18; h = 0;
  } else if (ip == 6) { c = color(.006, .005, .005); if (SPID == 4) c = color(.012, .010, .008); r = .03; h = 0;
  } else if (ip == 7) { c = dark * .55; r = .32; h = 0;
  } else if (ip == 8) { c = mid * .9; r = .45; h = hb * .2;
  } else if (ip == 9) { c = color(.02, .015, .012); r = .25; h = 0;
  } else { c = mid * .6; r = .5; }
  Col = clamp(c, color(0), color(1)); Rough = clamp(r, .02, 1); Height = h;
}
'''
osl_src = OSL % dict(id=S['id'], AX=AX, AY=AY, AZ=AZ, H=H, BX=BX, BY=BY, BZ=BZ, BYC=BYC, BZC=BZC, TL=TL)
txt = bpy.data.texts.new('spinne.osl'); txt.from_string(osl_src)
scn.render.engine = 'CYCLES'; scn.cycles.device = 'CPU'; scn.cycles.shading_system = True
scn.render.threads_mode = 'FIXED'; scn.render.threads = 2
scn.cycles.samples = 4; scn.cycles.use_denoising = False

mat = bpy.data.materials.new('spinne_' + ART); mat.use_nodes = True; nt = mat.node_tree; N_ = nt.nodes; L_ = nt.links
for n in list(N_): N_.remove(n)
outn = N_.new('ShaderNodeOutputMaterial'); scr = N_.new('ShaderNodeScript'); scr.mode = 'INTERNAL'; scr.script = txt
try: bpy.ops.node.select_all  # noqa
except Exception: pass
scr.update()
for k in ('part', 'leg', 'seg', 'segt', 'ca', 'sa', 'al'):
  a = N_.new('ShaderNodeAttribute'); a.attribute_type = 'GEOMETRY'; a.attribute_name = k
  if k in scr.inputs: L_.new(a.outputs['Fac'], scr.inputs[k])
print('OSL Eingänge:', [i.name for i in scr.inputs], 'Ausgänge:', [o.name for o in scr.outputs], flush=True)
emi = N_.new('ShaderNodeEmission'); bsdf = N_.new('ShaderNodeBsdfPrincipled'); bump = N_.new('ShaderNodeBump')
bump.inputs['Strength'].default_value = .35 if HD else .3; bump.inputs['Distance'].default_value = .012
L_.new(scr.outputs['Height'], bump.inputs['Height']); L_.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
body.data.materials.append(mat)

def img(name, srgb):
  im = bpy.data.images.new(name, TEXS, TEXS, alpha=False, float_buffer=False); im.colorspace_settings.name = 'sRGB' if srgb else 'Non-Color'; return im
I_alb, I_rgh, I_nrm = img(ART + '_' + RES + '_albedo', True), img(ART + '_' + RES + '_rough', False), img(ART + '_' + RES + '_normal', False)
tnode = N_.new('ShaderNodeTexImage')
def bake(kind, image, src):
  tnode.image = image; N_.active = tnode
  for l in list(outn.inputs['Surface'].links): L_.remove(l)
  if kind == 'EMIT': L_.new(src, emi.inputs['Color']); L_.new(emi.outputs['Emission'], outn.inputs['Surface'])
  else: L_.new(bsdf.outputs['BSDF'], outn.inputs['Surface'])
  bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); bpy.context.view_layer.objects.active = body
  scn.cycles.samples = 1 if kind == 'EMIT' else 6
  t = time.time()
  if kind == 'EMIT': bpy.ops.object.bake(type='EMIT', margin=6, use_clear=True)
  else: bpy.ops.object.bake(type='NORMAL', normal_space='TANGENT', margin=6, use_clear=True)
  print('gebacken', image.name, '%.1fs' % (time.time() - t), flush=True)
for l in list(emi.inputs['Color'].links): L_.remove(l)
bake('EMIT', I_alb, scr.outputs['Col'])
for l in list(emi.inputs['Color'].links): L_.remove(l)
bake('EMIT', I_rgh, scr.outputs['Rough'])
bake('NORMAL', I_nrm, None)
for im in (I_alb, I_rgh, I_nrm):
  im.filepath_raw = os.path.join(OUT, im.name + '.jpg'); im.file_format = 'JPEG'; scn.render.image_settings.quality = 92; im.save()

# Endmaterial: Principled mit den gebackenen Karten
for n in list(N_): N_.remove(n)
outn = N_.new('ShaderNodeOutputMaterial'); bsdf = N_.new('ShaderNodeBsdfPrincipled'); L_.new(bsdf.outputs['BSDF'], outn.inputs['Surface'])
ta = N_.new('ShaderNodeTexImage'); ta.image = I_alb; L_.new(ta.outputs['Color'], bsdf.inputs['Base Color'])
tr = N_.new('ShaderNodeTexImage'); tr.image = I_rgh; sep = N_.new('ShaderNodeSeparateColor'); L_.new(tr.outputs['Color'], sep.inputs['Color']); L_.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
tn = N_.new('ShaderNodeTexImage'); tn.image = I_nrm; nm_ = N_.new('ShaderNodeNormalMap'); L_.new(tn.outputs['Color'], nm_.inputs['Color']); L_.new(nm_.outputs['Normal'], bsdf.inputs['Normal'])
nm_.inputs['Strength'].default_value = 1.0
bsdf.inputs['Metallic'].default_value = 0.0
try: bsdf.inputs['Coat Weight'].default_value = .0
except Exception: pass

# Haarkarten-Textur: Strähnen (verjüngt, leicht gebogen, Spitzen heller), 4 Streifen nebeneinander
if hair:
  W, Hh = 256, 256; hc = np.array(S['hcol'], np.float32); col = np.ones((Hh, W, 3), np.float32) * hc * .8; alp = np.zeros((Hh, W), np.float32); xs = np.arange(W, dtype=np.float32)
  for k in range(int(52 * (1.5 if ART == 'vogel' else 1))):
    x0 = (k % 4) * 64 + R(4, 60); ln = int(Hh * R(.5, 1.0)); cv = R(-14, 14); wb = R(.7, 1.4); br = R(.7, 1.3); y0 = Hh - 1 - int(R(0, 20))
    for yy in range(ln):
      t = yy / ln; xc = x0 + cv * t * t; w = wb * (1 - t) + .35; cov = np.clip(w - np.abs(xs - xc) + .5, 0, 1)
      row = y0 - yy
      if row < 0: break
      a = cov * (1 - t ** 3 * .6); m = a > alp[row]
      alp[row] = np.maximum(alp[row], a); col[row][m] = (hc * br * (.6 + .7 * t))[None, :].repeat(m.sum(), 0)
  rgba = np.concatenate([np.clip(col, 0, 1), alp[..., None]], 2)[::-1].astype(np.float32)   # Blender-Bilder: Zeile 0 unten
  hi = bpy.data.images.new(ART + '_haar', W, Hh, alpha=True); hi.pixels.foreach_set(rgba.ravel()); hi.filepath_raw = os.path.join(OUT, ART + '_haar.png'); hi.file_format = 'PNG'; hi.save()
  hm = bpy.data.materials.new('spinne_haar_' + ART); hm.use_nodes = True; hn = hm.node_tree.nodes; hl_ = hm.node_tree.links; hp = hn.get('Principled BSDF')
  ht = hn.new('ShaderNodeTexImage'); ht.image = hi; hl_.new(ht.outputs['Color'], hp.inputs['Base Color']); hl_.new(ht.outputs['Alpha'], hp.inputs['Alpha'])
  hp.inputs['Roughness'].default_value = .62
  try: hm.blend_method = 'CLIP'
  except Exception: pass
  hair.data.materials.append(hm)

# ---------------------------------------------------------------- Animation: Fußziele (IK) → gebacken auf FK
tips = {nm: Lg['pts'][-1].copy() for nm, Lg in LEGS.items() if not Lg.get('palp')}
EMP = {}
for nm, p in tips.items():
  e = bpy.data.objects.new('T_' + nm, None); e.location = p; coll.objects.link(e); EMP[nm] = e
bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = arm; arm.select_set(True); bpy.ops.object.mode_set(mode='POSE')
for nm in tips:
  for k, sn in enumerate(SEGN):
    pb = arm.pose.bones[nm + '_' + sn]; pb.rotation_mode = 'QUATERNION'; pb.lock_ik_y = True
    if k > 0: pb.lock_ik_z = True
    pb.ik_stretch = 0
  c = arm.pose.bones[nm + '_tarsus'].constraints.new('IK'); c.target = EMP[nm]; c.chain_count = 7; c.use_tail = True; c.use_stretch = False; c.iterations = 300
bpy.ops.object.mode_set(mode='OBJECT')
FPS = 30; scn.render.fps = FPS
RB = {b.name: b.matrix_local.to_3x3() for b in arm.data.bones}
def setb(name, dloc=None, axis_ang=None, local_x=None):
  pb = arm.pose.bones[name]; Rm = RB[name]
  if dloc is not None: pb.location = Rm.inverted() @ Vector(dloc)
  q = Quaternion()
  if axis_ang is not None:
    for ax_, an in axis_ang: q = Quaternion(Vector(ax_), an) @ q
    q = Rm.inverted().to_quaternion() @ q @ Rm.to_quaternion()
  if local_x is not None: q = q @ Quaternion((1, 0, 0), local_x)
  pb.rotation_quaternion = q
def keyb(name, f, loc=True):
  pb = arm.pose.bones[name]
  if loc: pb.keyframe_insert('location', frame=f)
  pb.keyframe_insert('rotation_quaternion', frame=f)
def reset_pose():
  for pb in arm.pose.bones: pb.location = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0); pb.scale = (1, 1, 1)
def fcurves(act):
  out = []
  try:
    for fc in act.fcurves: out.append((act.fcurves, fc))
    if out: return out
  except Exception: pass
  try:
    for layer in act.layers:
      for strip in layer.strips:
        for cb in strip.channelbags:
          for fc in cb.fcurves: out.append((cb.fcurves, fc))
  except Exception as e: print('fcurves', e)
  return out

LEGORDER = ['L1', 'L2', 'L3', 'L4', 'R1', 'R2', 'R3', 'R4']
GROUP_A = {'L1', 'R2', 'L3', 'R4'}
CL_STRIDE = S['stride']; LIFT = S['lift']
def phase(nm): return (0. if nm in GROUP_A else .5) + (4 - int(nm[1])) * .04
CLIPS = []
def clip(name, nfr, foot, extra):
  arm.animation_data_create(); tmp = bpy.data.actions.new('tmp_' + name); arm.animation_data.action = tmp
  for e in EMP.values(): e.animation_data_clear()
  for f in range(nfr + 1):
    tau = f / nfr
    for nm, e in EMP.items(): e.location = foot(nm, tau, f); e.keyframe_insert('location', frame=f)
    reset_pose(); used = extra(tau, f)
    for bn in used: keyb(bn, f, loc=(bn in ('body', 'abdomen')))
  scn.frame_start = 0; scn.frame_end = nfr
  bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = arm; arm.select_set(True); bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.select_all(action='SELECT')
  kw = dict(frame_start=0, frame_end=nfr, step=1, only_selected=False, visual_keying=True, clear_constraints=False, use_current_action=False, bake_types={'POSE'})
  try: bpy.ops.nla.bake(channel_types={'LOCATION', 'ROTATION'}, **kw)
  except TypeError: bpy.ops.nla.bake(**kw)
  bpy.ops.object.mode_set(mode='OBJECT')
  act = arm.animation_data.action; act.name = name; act.use_fake_user = True
  for coll_, fc in fcurves(act):
    dp = fc.data_path
    if dp.endswith('.scale') or (dp.endswith('.location') and not ('"body"' in dp or '"abdomen"' in dp)): coll_.remove(fc)
  arm.animation_data.action = None; bpy.data.actions.remove(tmp); reset_pose(); CLIPS.append((name, act, nfr))
  print('Clip', name, nfr, '%.1fs' % (time.time() - T0), flush=True)

PALPS = [b for b in arm.pose.bones.keys() if b.startswith(('Lp_', 'Rp_'))]
def palps(tau, amp, speed, off=0):
  out = []
  for s, side in (('Lp', 0), ('Rp', 1)):
    ph = 2 * math.pi * (tau * speed + side * .5 + off)
    setb(s + '_femur', local_x=amp * math.sin(ph)); setb(s + '_tibia', local_x=-amp * .6 * math.sin(ph + .6)); out += [s + '_femur', s + '_tibia']
  return out

# walk: abwechselndes Tetrapod-Schema (L1 R2 L3 R4 gegen R1 L2 R3 L4), Fuß in der Stützphase fest am Boden
def foot_walk(nm, tau, f):
  h = tips[nm]; s = (tau - phase(nm)) % 1.0; beta = .55; L = CL_STRIDE * (1.15 if nm[1] in '14' else 1.)
  if s < beta: y = L / 2 - L * (s / beta); z = 0
  else:
    u = (s - beta) / (1 - beta); e = u * u * (3 - 2 * u); y = -L / 2 + L * e; z = LIFT * (1.2 if nm[1] == '1' else 1.) * math.sin(math.pi * u) ** .8
  return h + Vector((0, y, z))
def extra_walk(tau, f):
  w = 2 * math.pi * tau
  setb('body', dloc=(0, 0, .025 * math.cos(2 * w) - .01), axis_ang=[((0, 1, 0), .03 * math.sin(w)), ((0, 0, 1), .025 * math.sin(w + .4))])
  setb('abdomen', dloc=(0, 0, 0), axis_ang=[((1, 0, 0), .035 * math.sin(2 * w + .8)), ((0, 0, 1), -.04 * math.sin(w + 1.2))])
  return ['body', 'abdomen'] + palps(tau, .22, 1)
clip('walk', S['cyc'], foot_walk, extra_walk)

# idle: Atmen (Hinterleib), Taster tasten, Vorderbein tippt einmal
def foot_idle(nm, tau, f):
  h = tips[nm].copy()
  if nm == 'L1': h += Vector((0, .12, .22)) * max(0, math.sin(math.pi * min(1, max(0, (tau - .3) / .22))))
  if nm == 'R1': h += Vector((0, .1, .18)) * max(0, math.sin(math.pi * min(1, max(0, (tau - .7) / .18))))
  return h
def extra_idle(tau, f):
  w = 2 * math.pi * tau
  setb('body', dloc=(0, 0, .006 * math.sin(2 * w)))
  setb('abdomen', dloc=(0, 0, .004 * math.sin(4 * w)), axis_ang=[((1, 0, 0), .02 * math.sin(4 * w))])
  setb('L_chel', local_x=.04 * math.sin(3 * w)); setb('R_chel', local_x=.04 * math.sin(3 * w + 1))
  return ['body', 'abdomen', 'L_chel', 'R_chel'] + palps(tau, .12, 3)
clip('idle', 120, foot_idle, extra_idle)

# lauern: Körper geduckt, Vorderbeine erhoben und gespreizt, Zittern, Taster hoch
def foot_lauern(nm, tau, f):
  h = tips[nm].copy(); w = 2 * math.pi * tau; tr = .012 * math.sin(f * 2.7) * math.sin(f * 1.3)
  if nm[1] == '1': h += Vector((.25 * (1 if nm[0] == 'R' else -1), .15, .55 + .05 * math.sin(w * 2))) + Vector((0, 0, tr))
  if nm[1] == '2': h += Vector((0, .08, .1 + .02 * math.sin(w * 2 + 1)))
  return h
def extra_lauern(tau, f):
  w = 2 * math.pi * tau
  setb('body', dloc=(0, 0, -.09 * (S['H'] / .42) + .005 * math.sin(2 * w)), axis_ang=[((1, 0, 0), -.07)])
  setb('abdomen', axis_ang=[((1, 0, 0), .05 + .02 * math.sin(2 * w))])
  setb('L_chel', local_x=.12 + .05 * math.sin(6 * w)); setb('R_chel', local_x=.12 + .05 * math.sin(6 * w + 1))
  out = ['body', 'abdomen', 'L_chel', 'R_chel']
  for s in ('Lp', 'Rp'):
    setb(s + '_femur', local_x=.35 + .08 * math.sin(4 * w + (s == 'Rp'))); setb(s + '_tibia', local_x=-.25); out += [s + '_femur', s + '_tibia']
  return out
clip('lauern', 90, foot_lauern, extra_lauern)

# zucken: ruckartige Krämpfe einzelner Beine, Körperzucken, Cheliceren schnappen
rng = random.Random(SEED + 5); JERK = [(rng.choice(LEGORDER), rng.uniform(.05, .85), rng.uniform(.5, 1)) for _ in range(9)]
def jerkv(tau, t0, d=.07):
  x = (tau - t0) / d; return math.exp(-x * x * 4) if -1.5 < x < 1.5 else 0
def foot_zucken(nm, tau, f):
  h = tips[nm].copy(); body = Vector((0, 0, H))
  for (l, t0, a) in JERK:
    if l == nm: h = h.lerp(body + (h - body) * .45 + Vector((0, 0, .25)), jerkv(tau, t0) * a)
  return h
def extra_zucken(tau, f):
  k = jerkv(tau, .18, .05) - .8 * jerkv(tau, .52, .04) + .6 * jerkv(tau, .77, .05)
  setb('body', dloc=(0, 0, .03 * k), axis_ang=[((0, 1, 0), .12 * k), ((0, 0, 1), .08 * jerkv(tau, .6, .05))])
  setb('abdomen', axis_ang=[((1, 0, 0), -.08 * jerkv(tau, .2, .06) + .06 * jerkv(tau, .55, .05))])
  ch = .35 * (jerkv(tau, .3, .04) + jerkv(tau, .68, .04)); setb('L_chel', local_x=ch); setb('R_chel', local_x=ch)
  return ['body', 'abdomen', 'L_chel', 'R_chel'] + palps(tau, .3 * (jerkv(tau, .4, .1) + .3), 6)
clip('zucken', 45, foot_zucken, extra_zucken)

# IK und Ziele entfernen, Clips als NLA-Spuren ablegen (Exporter: eine Animation je Spur)
for nm in tips:
  pb = arm.pose.bones[nm + '_tarsus']
  for c in list(pb.constraints): pb.constraints.remove(c)
for e in EMP.values(): bpy.data.objects.remove(e, do_unlink=True)
reset_pose()
for name, act, nfr in CLIPS:
  tr_ = arm.animation_data.nla_tracks.new(); tr_.name = name; tr_.strips.new(name, 0, act)
arm.scale = (S['cl'],) * 3

# ---------------------------------------------------------------- Ausgabe
tris = sum(len(p.vertices) - 2 for p in body.data.polygons); htris = sum(len(p.vertices) - 2 for p in hair.data.polygons) if hair else 0
bpy.ops.object.select_all(action='DESELECT'); arm.select_set(True); body.select_set(True)
if hair: hair.select_set(True)
path = os.path.join(OUT, '%s_%s.glb' % (ART, RES))
kw = dict(filepath=path, export_format='GLB', use_selection=True, export_animations=True, export_skins=True, export_yup=True, export_apply=False,
          export_animation_mode='ACTIONS', export_force_sampling=True, export_optimize_animation_size=True, export_image_format='AUTO', export_normals=True, export_tangents=False)
try: bpy.ops.export_scene.gltf(**kw)
except TypeError as e:
  print('Exportoptionen', e); kw.pop('export_optimize_animation_size', None); bpy.ops.export_scene.gltf(**kw)
info = dict(art=ART, res=RES, tris=tris, haar_tris=htris, bones=len(arm.data.bones), clips=[c[0] for c in CLIPS], tex=TEXS, cl=S['cl'], sekunden=round(time.time() - T0, 1), datei=path, groesse_kb=round(os.path.getsize(path) / 1024))
json.dump(info, open(os.path.join(OUT, '%s_%s.json' % (ART, RES)), 'w'), indent=1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, '%s_%s.blend' % (ART, RES)), compress=True)
print('FERTIG', json.dumps(info), flush=True)
