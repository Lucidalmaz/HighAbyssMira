# Kindersitz (ECE Gruppe 1, Bauart 1992–2009, Vorbild: Schalensitze mit Untergestell und Fünfpunktgurt wie Römer King / Britax / Storchenmühle).
# Eigene Arbeit in Blender (bpy): Schale als Parameterfläche (Profil Sitzfläche → Lehne, U-Querschnitt mit Seitenwangen und gerolltem Rand),
# gepolsterter Bezug mit Steppnähten und Keder, Gurte als Bänder auf der Bezugsfläche, Schloss, Gurtzunge, Gurtpolster, Zentralversteller,
# Untergestell mit Gurtführungen und Messingschild. Drei Varianten (Stoff/Farbe/Verschleiß) teilen ein Netz; Texturen aus PBR-Shadern gebacken.
#   blender -b --factory-startup --threads 2 --python kindersitz_bau.py -- <ausgabe.glb> [texturgröße]
# Ausgabe: Objekte kindersitz_a (Marine mit Konfetti), kindersitz_b (Karo, ausgeblichen), kindersitz_c (grau, stark verschlissen, Riss mit Schaumstoff).
# Achsen (Blender): x quer, −y vorn (Blickrichtung des Kindes), z oben; Ursprung Mitte Unterkante. Im Spiel (glTF): Blick nach +z.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hb_lib import *

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else os.path.join(os.getcwd(), 'kindersitz.glb'); RES = int(argv[1]) if len(argv) > 1 else 1024
random.seed(7); scn = reset(); world(1)

# ---------------------------------------------------------------- Profil der Sitzfläche (y, z, halbe Innenbreite, Wangenhöhe, Neigung der Wange)
CTRL = [(-.214, .148, .100, .012, 10), (-.205, .194, .124, .030, 10), (-.150, .201, .134, .058, 10), (-.060, .184, .140, .098, 10), (.052, .166, .141, .116, 12),
        (.093, .214, .136, .100, 14), (.118, .300, .131, .084, 14), (.138, .400, .130, .092, 15), (.153, .482, .124, .132, 18), (.164, .560, .119, .168, 20),
        (.170, .622, .112, .128, 20), (.192, .648, .092, .045, 14), (.226, .632, .070, .012, 10)]
DENSE = catmull([(0, y, z) for y, z, *_ in CTRL], 600)
arc = [0.]
for i in range(1, len(DENSE)): arc.append(arc[-1] + (DENSE[i] - DENSE[i - 1]).length)
LEN = arc[-1]; m = len(CTRL) - 1
CARC = [arc[round(i * (len(DENSE) - 1) / m)] for i in range(len(CTRL))]  # Bogenlänge an den Kontrollpunkten
def at_arc(a):
  a = min(max(a, 0), LEN); lo, hi = 0, len(arc) - 1
  while hi - lo > 1:
    mid = (lo + hi) // 2
    if arc[mid] < a: lo = mid
    else: hi = mid
  f = (a - arc[lo]) / max(1e-9, arc[hi] - arc[lo]); p = DENSE[lo].lerp(DENSE[hi], f)
  t = (DENSE[min(hi + 2, len(DENSE) - 1)] - DENSE[max(lo - 2, 0)]).normalized(); nrm = Vector((0, -t.z, t.y)).normalized()
  return p, t, nrm
def _param_lin(a, k):
  for i in range(m):
    if a <= CARC[i + 1] or i == m - 1:
      f = min(1, max(0, (a - CARC[i]) / (CARC[i + 1] - CARC[i]))); return CTRL[i][k] * (1 - f) + CTRL[i + 1][k] * f
# Kontrollgrößen über die Bogenlänge geglättet (Gauß, σ ≈ 3 cm): Wangen laufen weich aus, keine Stufen an Schulter und Kopf
_PA = np.linspace(0, LEN, 400); _PT = {}
for _k in (2, 3, 4):
  raw = np.array([_param_lin(a, _k) for a in _PA]); sm = np.zeros_like(raw)
  for i, a in enumerate(_PA): w = np.exp(-((_PA - a) / .03) ** 2); sm[i] = (w * raw).sum() / w.sum()
  _PT[_k] = sm
def param(a, k): return float(np.interp(a, _PA, _PT[k]))

NFLAT, NFIL, NWALL, NLIP = 7, 4, 3, 5
def half_section(a):
  # Halbquerschnitt (u quer ≥ 0, v entlang Sitznormale) mit 2D-Innennormalen; Index 0 = Mitte
  hw, wh, tilt = param(a, 2), param(a, 3), math.radians(param(a, 4)); rr = .032; lr = .0095
  P, Nn, W = [], [], []
  for k in range(NFLAT + 1):
    u = hw * k / NFLAT; P.append((u, -.007 * (1 - (u / hw) ** 2))); Nn.append((-.014 * u / hw ** 2 * 0, 1)); W.append(0)
  for k in range(1, NFIL + 1):
    an = -math.pi / 2 + (math.pi / 2 - tilt) * k / NFIL; P.append((hw + rr * math.cos(an), rr + rr * math.sin(an))); Nn.append((-math.cos(an), -math.sin(an))); W.append(k / NFIL * .5)
  d = (math.sin(tilt), math.cos(tilt)); no = (math.cos(tilt), -math.sin(tilt)); e0 = P[-1]
  wl = max(.004, wh - lr - e0[1])
  for k in range(1, NWALL + 1):
    P.append((e0[0] + d[0] * wl * k / NWALL, e0[1] + d[1] * wl * k / NWALL)); Nn.append((-no[0], -no[1])); W.append(1)
  e1 = P[-1]
  for k in range(1, NLIP + 1):
    ph = math.pi * k / NLIP; P.append((e1[0] + lr * ((1 - math.cos(ph)) * no[0] + math.sin(ph) * d[0]), e1[1] + lr * ((1 - math.cos(ph)) * no[1] + math.sin(ph) * d[1])))
    Nn.append((-(math.cos(ph) * no[0] - math.sin(ph) * d[0] * 0) * 1, 0)); W.append(1)
  # Lippen-Normalen sauber: vom Rollzentrum weg, nach innen gerichtet = zum Zentrum
  c = (e1[0] + lr * no[0], e1[1] + lr * no[1])
  for k in range(NLIP):
    i = len(P) - NLIP + k; vx, vy = P[i][0] - c[0], P[i][1] - c[1]; l = math.hypot(vx, vy) or 1; Nn[i] = (vx / l, vy / l)
  P.append((P[-1][0] - d[0] * .014, P[-1][1] - d[1] * .014)); Nn.append(Nn[-1]); W.append(1)
  return P, Nn, W

NS = 54
ROWS_A = [LEN * i / (NS - 1) for i in range(NS)]
def section3d(a, upto=None, pad=None):
  p, t, n = at_arc(a); X = Vector((1, 0, 0)); P, Nn, W = half_section(a); K = len(P) if upto is None else upto
  pts, nrm, us, ws = [], [], [], []
  # u-Bogenlänge quer
  ul = [0.]
  for k in range(1, len(P)): ul.append(ul[-1] + math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]))
  for sgn in (-1, 1):
    rng = range(K - 1, 0, -1) if sgn < 0 else range(0, K)
    for k in rng:
      u, v = P[k]; nu, nv = Nn[k]; q = p + X * (sgn * u) + n * v; nn = (X * (sgn * nu) + n * nv).normalized()
      if pad: q = q + nn * pad(a, k, W[k])
      pts.append(q); nrm.append(nn); us.append(sgn * ul[k]); ws.append(W[k])
  return pts, nrm, us, ws

# ---------------------------------------------------------------- Schale
shellP = [section3d(a)[0] for a in ROWS_A]
bm = grid(shellP)
schale = obj_bm(bm, 'schale'); mod(schale, 'SOLIDIFY', thickness=.0085, offset=1, use_even_offset=True, use_rim=True)
apply_all(schale)
bm = bmesh.new(); bm.from_mesh(schale.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
# Normalen müssen zum Kind zeigen: Stichprobe Mitte Sitzfläche
bm.to_mesh(schale.data); bm.free()

# ---------------------------------------------------------------- Bezug (Polster) mit Steppnähten
A_CR = CARC[4]; A_HW = CARC[8]; A_SH = (CARC[7] + CARC[8]) / 2
SEAM_A = [CARC[1] + .012, A_CR, (CARC[6] + CARC[7]) / 2, A_HW, CARC[10] + .01]
def pad(a, k, w):
  base = .026 if a < A_CR else .021
  if k <= NFLAT: th = base
  elif k <= NFLAT + NFIL: th = base * (1 - (k - NFLAT) / NFIL * .35)
  elif k <= NFLAT + NFIL + NWALL: th = .014
  else: th = .014 * (1 - (k - NFLAT - NFIL - NWALL) / NLIP) + .0045
  if a < CARC[1] or a > CARC[10] + .02: th = min(th, .009)
  # Steppnähte: längs an der Kante Fläche/Wange (k == NFLAT) und quer an den SEAM_A-Linien
  sk = 1.
  if k == NFLAT: sk *= .3
  if k in (NFLAT - 1, NFLAT + 1): sk *= .78
  for sa in SEAM_A:
    dd = abs(a - sa)
    if k <= NFLAT + NFIL: sk *= 1 - .7 * math.exp(-(dd / .009) ** 2)
  # Polsterbausch innerhalb der Felder
  puff = 1 + .1 * math.sin(math.pi * min(1, k / NFLAT)) if k <= NFLAT else 1
  return max(.003, th * sk * puff)
KC = NFLAT + NFIL + NWALL + NLIP + 1
cov = [section3d(a, KC, pad) for a in ROWS_A]
bm = grid([c[0] for c in cov]); lu = bm.verts.layers.float.new('ks_u'); la = bm.verts.layers.float.new('ks_a'); lw = bm.verts.layers.float.new('ks_w'); lc = bm.verts.layers.float.new('ks_c')
bm.verts.ensure_lookup_table(); ncol = len(cov[0][0])
for i, c in enumerate(cov):
  for j in range(ncol):
    v = bm.verts[i * ncol + j]; v[lu] = c[2][j]; v[la] = ROWS_A[i]; v[lw] = c[3][j]; v[lc] = 1.
# Ausrichtung: Normale nach außen (zum Kind)
bm.normal_update(); bm.faces.ensure_lookup_table(); f0 = bm.faces[len(bm.faces) // 2]
if f0.normal.dot(cov[NS // 2][1][ncol // 2]) < 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
bezug = obj_bm(bm, 'bezug')
# Keder rund um den Bezugsrand
loop = [c[0][0] for c in cov] + cov[-1][0][1:] + [c[0][-1] for c in cov[::-1]][1:] + cov[0][0][::-1][1:]
loopn = [c[1][0] for c in cov] + cov[-1][1][1:] + [c[1][-1] for c in cov[::-1]][1:] + cov[0][1][::-1][1:]
keder = obj_bm(tube([p - n * .001 for p, n in zip(loop, loopn)], .0036, 6, ups=loopn, closed=True), 'keder')

# Flächenpunkt auf dem Bezug: (a, u) → Punkt, Normale
def surf(a, u):
  i = min(NS - 2, max(0, int(a / LEN * (NS - 1)))); f = a / LEN * (NS - 1) - i
  def rowp(r):
    P, N, U, _ = cov[r]
    for j in range(len(U) - 1):
      if U[j] <= u <= U[j + 1] or j == len(U) - 2:
        g = (u - U[j]) / max(1e-9, U[j + 1] - U[j]); return P[j].lerp(P[j + 1], g), N[j].lerp(N[j + 1], g)
  p0, n0 = rowp(i); p1, n1 = rowp(i + 1); return p0.lerp(p1, f), n0.lerp(n1, f).normalized()

def strap_path(au, lift=.0042, n=40, smooth_it=6, sag=None):
  # au: Liste (a, u)-Stützpunkte → 3D-Pfad auf dem Polster; Glätten schneidet konkave Ecken ab (Gurt spannt über die Kehle)
  pts, ups = [], []
  dens = catmull([(a, u, 0) for a, u in au], n)
  for q in dens: p, nn = surf(q.x, q.y); pts.append(p + nn * lift); ups.append(nn)
  for _ in range(smooth_it):
    pts = [pts[0]] + [(pts[i - 1] + pts[i] * 2 + pts[i + 1]) / 4 for i in range(1, len(pts) - 1)] + [pts[-1]]
  # nicht unter die Fläche sinken
  out = []
  for (q, p, nn) in zip(dens, pts, ups):
    s0, n0 = surf(q.x, q.y); d = (p - s0).dot(n0)
    out.append(p + n0 * max(0, lift - d) if d < lift else p)
  return out, ups

A_BU = A_CR - .125
gurte = []
for sg in (-1, 1):
  p, u = strap_path([(A_SH + .01, sg * .058), (A_SH - .08, sg * .056), (A_CR + .03, sg * .048), (A_CR - .05, sg * .032), (A_BU + .012, sg * .016)])
  gurte.append(obj_bm(ribbon(p, u, .025, .0016), 'schultergurt'))
  # Gurtpolster am Schultergurt (Stoff)
  pp = p[2:15]; uu = u[2:15]
  gurte.append(obj_bm(sweep([q + n * .0016 for q, n in zip(pp, uu)], uu, [(-.024, 0), (.024, 0), (.026, .004), (.022, .011), (0, .0135), (-.022, .011), (-.026, .004)]), 'gurtpolster'))
  p, u = strap_path([(A_CR + .012, sg * .128), (A_CR - .02, sg * .1), (A_CR - .07, sg * .055), (A_BU + .004, sg * .022)], smooth_it=3)
  gurte.append(obj_bm(ribbon(p, u, .025, .0016), 'beckengurt'))
p, u = strap_path([(A_CR - .065, 0), (A_CR - .09, 0), (A_BU - .005, 0)], smooth_it=2)
gurte.append(obj_bm(ribbon(p, u, .028, .0018), 'schrittgurt'))
# Gurtzungen (Metall mit Kunststoffkappe) – stecken im Schloss
pb, nb_ = surf(A_BU - .028, 0); tang = (surf(A_BU - .05, 0)[0] - surf(A_BU, 0)[0]).normalized()
side = tang.cross(nb_).normalized(); rotm = Matrix((side, tang, nb_)).transposed()
def place(o, loc, extra=Matrix.Identity(3)):
  o.matrix_world = Matrix.Translation(loc) @ (rotm @ extra).to_4x4(); return o
schloss = place(box(.046, .064, .02, bev=.006, seg=3, name='schloss'), pb + nb_ * .014)
knopf = place(box(.026, .022, .006, bev=.0025, seg=2, name='knopf'), pb + nb_ * .0245 + tang * .008)
zungen = []
for sg in (-1, 1):
  zungen.append(place(box(.022, .03, .004, bev=.0012, seg=1, name='zunge'), pb + nb_ * .016 + side * sg * .014 - tang * .03, Matrix.Rotation(sg * .35, 3, 'Z')))
  zungen.append(place(box(.03, .022, .009, bev=.003, seg=2, name='zungenkappe'), pb + nb_ * .017 + side * sg * .02 - tang * .047, Matrix.Rotation(sg * .35, 3, 'Z')))
# Zentralversteller: Band tritt vorn am Sitz aus und hängt zum Hebel am Untergestell
pf, nf = surf(.028, 0)
hang = catmull([pf + nf * .004, pf + Vector((0, -.012, -.02)), Vector((0, -.226, .115)), Vector((0, -.236, .085))], 16)
verst = obj_bm(ribbon(hang, [Vector((0, -1, .2)).normalized()] * len(hang), .022, .0016), 'versteller')

# ---------------------------------------------------------------- Untergestell, Unterschale, Rückenplatte, Gurtführungen, Hebel, Messingschild
def taper(o, k):
  apply_all(o); zs = [v.co.z for v in o.data.vertices]; z0, z1 = min(zs), max(zs)
  for v in o.data.vertices: f = (v.co.z - z0) / max(1e-6, z1 - z0); v.co.x *= 1 - k * f; v.co.y *= 1 - k * .4 * f
  return o
base = taper(box(.39, .44, .12, loc=(0, -.02, .06), bev=.028, seg=4, name='gestell'), .1)
for v in base.data.vertices:  # Kufen: Unterseite vorn und hinten leicht angehoben (Liegeverstellung)
  if v.co.z < .02: v.co.z += .012 * ((v.co.y + .02) / .22) ** 2
unter = taper(box(.30, .30, .07, loc=(0, -.06, .14), bev=.02, seg=3, name='unterschale'), .06)
rueck = box(.20, .028, .25, loc=(0, .168, .39), rot=(math.radians(-14), 0, 0), bev=.012, seg=3, name='rueckplatte')
ribs = [box(.012, .02, .2, loc=(x, .186, .385), rot=(math.radians(-14), 0, 0), bev=.004, seg=2, name='rippe') for x in (-.05, 0, .05)]
fuehr = []
for sg in (-1, 1):
  hk = box(.03, .075, .022, loc=(sg * .192, -.13, .128), bev=.008, seg=3, name='gurtfuehrung'); fuehr.append(hk)
  fuehr.append(box(.022, .022, .05, loc=(sg * .199, -.095, .148), bev=.006, seg=2, name='gurtfuehrung'))
hebel = box(.085, .024, .03, loc=(0, -.246, .078), bev=.009, seg=3, name='hebel')
schild = box(.072, .003, .034, loc=(0, -.2465, .05), bev=.001, seg=1, name='messing')
niete = [cyl(.0032, .004, loc=(x, -.248, .05), rot=(math.pi / 2, 0, 0), seg=10, name='niete') for x in (-.03, .03)]

# ---------------------------------------------------------------- Materialien (je Variante), danach alles zu einem Netz
VAR = {'a': dict(wear=.45, shell=(.040, .041, .044), guide=(.42, .035, .03), strap=(.020, .021, .024)),
       'b': dict(wear=.7, shell=(.028, .029, .032), guide=(.03, .11, .38), strap=(.11, .11, .105)),
       'c': dict(wear=1.0, shell=(.105, .104, .10), guide=(.06, .062, .065), strap=(.085, .085, .08))}

def stoff(v):
  W = VAR[v]['wear']
  def b(nb):
    P = nb.coord('Object'); C = nb.attr('ks_c'); uv = nb.n('ShaderNodeCombineXYZ', X=nb.attr('ks_u'), Y=nb.attr('ks_a')).outputs[0]
    Q = nb.mix(C, nb.n('ShaderNodeCombineXYZ', X=nb.sep(P)[0], Y=nb.math('ADD', nb.sep(P)[1], nb.sep(P)[2])).outputs[0], uv, kind='VECTOR')
    wing = nb.attr('ks_w'); qx, qy = nb.sep(Q)[0], nb.sep(Q)[1]
    fuzz = nb.noise(Q, 900, 2, .6); mel = nb.noise(nb.vec(Q, scale=(1, 6, 1)), 260, 3, .7)
    def stripe(x, per, w, off=0.):
      fr = nb.math('FRACT', nb.math('ADD', nb.math('DIVIDE', x, per), off)); return nb.mr(nb.math('ABSOLUTE', nb.math('SUBTRACT', fr, .5)), .5 - w - .02, .5 - w, 0, 1)
    if v == 'a':
      base = nb.mix(mel, (.020, .028, .072), (.032, .042, .10))
      cell = nb.n('ShaderNodeTexVoronoi', Vector=Q, Scale=62, Randomness=1); dot = nb.mr(cell.outputs['Distance'], .16, .2, 1, 0)
      rc = nb.ramp(cell.outputs['Color'], [(0, (.55, .06, .05)), (.3, (.62, .48, .06)), (.55, (.05, .36, .38)), (.8, (.6, .58, .52)), (1, (.55, .06, .05))], 'CONSTANT')
      sel = nb.mr(nb.sep(cell.outputs['Color'])[1], .5, .52, 0, 1); col = nb.mix(nb.math('MULTIPLY', dot, sel), base, rc)
      col = nb.mix(nb.mr(wing, .4, .6), col, (.016, .02, .05))
    elif v == 'b':
      base = nb.mix(mel, (.48, .2, .05), (.56, .26, .07))
      c1 = nb.mix(stripe(qx, .085, .17), base, (.04, .26, .26)); c1 = nb.mix(stripe(qy, .085, .17, .25), c1, nb.mix(.5, c1, (.04, .05, .16)))
      c1 = nb.mix(stripe(qx, .085, .035, .37), c1, (.5, .06, .05)); c1 = nb.mix(stripe(qy, .085, .03, .6), c1, (.62, .52, .12))
      c1 = nb.mix(stripe(qx, .0425, .02, .1), c1, (.08, .1, .3)); col = nb.mix(nb.mr(wing, .4, .6), c1, (.52, .22, .05))
    else:
      base = nb.mix(mel, (.085, .10, .14), (.13, .15, .19)); col = nb.mix(nb.mr(wing, .4, .6), base, (.045, .048, .055))
      col = nb.mix(nb.mr(nb.noise(Q, 1400, 1, .5), .7, .78, 0, .5), col, (.2, .21, .24))
    col = nb.mix(nb.mr(fuzz, .3, .7, -.08, .08), col, (1, 1, 1), 'ADD') if False else col
    # Ausbleichen auf der Sonnenseite (oben), Staub, Flecken, Schimmel
    nz = nb.sep(nb.geo('Normal'))[2]; expo = nb.mr(nz, -.2, .9, 0, 1)
    col = nb.mix(nb.math('MULTIPLY', expo, .35 * W), col, nb.hsv(col, .5, .35, 1.25))
    st = nb.noise(nb.vec(P, loc=(3.1, 1.7, 0)), 7, 3, .6, .4); ring = nb.mr(st, .58, .6, 0, 1); ring2 = nb.mr(st, .6, .63, 1, 0)
    col = nb.mix(nb.math('MULTIPLY', nb.math('MULTIPLY', ring, ring2), .6 * W), col, (.16, .11, .05), 'MULTIPLY')
    col = nb.mix(nb.mr(st, .6, .75, 0, .35 * W), col, (.42, .33, .2), 'MULTIPLY')
    dust = nb.math('MULTIPLY', nb.mr(nz, .3, .95, 0, 1), nb.mr(nb.noise(P, 30, 4, .6), .35, .7, .2 * W, .65 * W))
    col = nb.mix(dust, col, (.33, .3, .25))
    rough = nb.mix(nb.mr(st, .6, .75, 0, .2 * W), nb.mr(fuzz, 0, 1, .88, .97), .7, kind='FLOAT')
    hgt = nb.math('ADD', nb.math('MULTIPLY', fuzz, .35), nb.math('MULTIPLY', mel, .25))
    if v == 'c':
      mold = nb.math('MULTIPLY', nb.mr(nb.vor(P, 160), .0, .3, 1, 0), nb.mr(nb.noise(P, 9, 3, .6), .58, .66))
      col = nb.mix(nb.math('MULTIPLY', mold, .8), col, (.03, .04, .025))
      # Riss im Polster (Sitzfläche vorn links) und an der Kopfwange: gelblicher Schaumstoff mit Poren, ausgefranster Rand
      def riss(u0, a0, ru, ra, sc):
        d = nb.n('ShaderNodeVectorMath', _operation='LENGTH', Vector=nb.n('ShaderNodeCombineXYZ', X=nb.math('DIVIDE', nb.math('SUBTRACT', qx, u0), ru), Y=nb.math('DIVIDE', nb.math('SUBTRACT', qy, a0), ra)).outputs[0]).outputs['Value']
        return nb.math('ADD', d, nb.math('MULTIPLY', nb.math('SUBTRACT', nb.noise(Q, sc, 3, .7), .5), .9))
      rd = nb.math('MINIMUM', riss(-.07, A_CR - .1, .052, .028, 60), riss(.19, A_HW + .03, .03, .05, 70))
      tear = nb.math('MULTIPLY', nb.mr(rd, .95, .9, 0, 1), C); fray = nb.math('MULTIPLY', nb.mr(nb.math('ABSOLUTE', nb.math('SUBTRACT', rd, .97)), .0, .07, 1, 0), C)
      pores = nb.vor(P, 1400); foam = nb.mix(nb.mr(pores, 0, .5, 0, 1), (.36, .26, .08), (.66, .52, .2)); foam = nb.mix(nb.mr(nb.noise(P, 40, 3), .4, .7), foam, (.4, .3, .12), 'MULTIPLY')
      col = nb.mix(tear, col, foam); col = nb.mix(nb.math('MULTIPLY', fray, .75), col, (.05, .045, .04))
      hgt = nb.mix(tear, hgt, nb.math('SUBTRACT', nb.math('MULTIPLY', pores, .9), 1.4), kind='FLOAT'); rough = nb.mix(tear, rough, .97, kind='FLOAT')
    return dict(col=col, rough=rough, metal=0., height=hgt, hs=.35, hd=.0012)
  return b

def plastik(v, kind='shell'):
  W = VAR[v]['wear']
  def b(nb):
    P = nb.coord('Object'); base = VAR[v]['shell'] if kind == 'shell' else VAR[v]['guide'] if kind == 'guide' else (.03, .03, .032) if kind == 'schloss' else (.5, .035, .025)
    grain = nb.noise(P, 1100, 2, .5); col = nb.mix(nb.mr(grain, .3, .7, -.15, .15), base, (1, 1, 1), 'ADD') if False else nb.mix(nb.mr(grain, .3, .7), base, nb.hsv(base, .5, 1, 1.25))
    pt = nb.mr(nb.geo('Pointiness'), .5, .56, 0, 1); sc = nb.mr(nb.noise(nb.vec(P, scale=(1, 1, 22), rot=(0, .4, .3)), 160, 2, .6), .62, .66, 0, 1)
    wearm = nb.math('MAXIMUM', nb.math('MULTIPLY', pt, nb.mr(nb.noise(P, 60, 3), .35, .6)), nb.math('MULTIPLY', sc, .7))
    col = nb.mix(nb.math('MULTIPLY', wearm, .55 * W + .15), col, nb.hsv(base, .5, .6, 2.6))
    nz = nb.sep(nb.geo('Normal'))[2]; dust = nb.math('MULTIPLY', nb.mr(nz, .2, .95), nb.mr(nb.noise(P, 24, 4, .6), .3, .7, .25 * W, .8 * W))
    col = nb.mix(dust, col, (.3, .28, .24))
    if v == 'c' and kind == 'shell': col = nb.mix(nb.mr(nb.noise(nb.vec(P, scale=(1, 1, .15)), 14, 2), .5, .65, 0, .5), col, (.26, .25, .23))
    rough = nb.mix(dust, nb.mix(wearm, nb.mr(grain, 0, 1, .42, .58), .7, kind='FLOAT'), .9, kind='FLOAT')
    if kind == 'knopf': rough = nb.mix(wearm, .38, .6, kind='FLOAT')
    return dict(col=col, rough=rough, metal=0., height=nb.math('ADD', nb.math('MULTIPLY', grain, .2), nb.math('MULTIPLY', sc, -.4)), hs=.2, hd=.0008)
  return b

def gurt(v):
  W = VAR[v]['wear']
  def b(nb):
    P = nb.coord('Object'); base = VAR[v]['strap']; rib = nb.noise(nb.vec(P, scale=(1, 1, 1)), 700, 2, .5)
    col = nb.mix(nb.mr(nb.noise(P, 90, 3), .3, .7), base, nb.hsv(base, .5, .8, 1.5)); nz = nb.sep(nb.geo('Normal'))[2]
    col = nb.mix(nb.math('MULTIPLY', nb.mr(nz, .2, 1), .5 * W), col, (.28, .26, .22))
    col = nb.mix(nb.mr(nb.noise(nb.vec(P, loc=(5, 2, 1)), 11, 3), .6, .72, 0, .55 * W), col, (.14, .1, .05), 'MULTIPLY')
    return dict(col=col, rough=nb.mr(rib, 0, 1, .7, .82), metal=0., height=rib, hs=.3, hd=.0006)
  return b

def metall(v, brass=False):
  W = VAR[v]['wear']
  def b(nb):
    P = nb.coord('Object'); base = (.80, .58, .27) if brass else (.62, .62, .63)
    tarn = nb.mr(nb.noise(P, 120, 4, .65), .35, .62, 0, 1); col = nb.mix(nb.math('MULTIPLY', tarn, .85 if brass else .4 * W), base, (.2, .15, .07) if brass else (.25, .12, .05))
    scr = nb.mr(nb.noise(nb.vec(P, scale=(30, 1, 1)), 300, 2), .6, .66, 0, 1)
    rough = nb.mix(tarn, .28, .62, kind='FLOAT'); rough = nb.mix(scr, rough, .2, kind='FLOAT')
    if brass and v == 'c':  # bis zum Glanz abgekratzt
      blank = nb.mr(nb.noise(nb.vec(P, scale=(1, 1, 1)), 70, 2), .3, .5, 1, 0); col = nb.mix(blank, col, (.93, .74, .42)); rough = nb.mix(blank, rough, .16, kind='FLOAT')
    col = nb.mix(scr, col, nb.hsv(base, .5, .9, 1.15))
    return dict(col=col, rough=rough, metal=nb.mr(tarn, 0, 1, 1, .55) if brass else nb.mr(tarn, 0, 1, 1, .7), height=scr, hs=.15, hd=.0004)
  return b

CATS = {'schale': 'shell', 'unterschale': 'shell', 'gestell': 'shell', 'rueckplatte': 'shell', 'rippe': 'shell', 'hebel': 'guide', 'gurtfuehrung': 'guide',
        'bezug': 'stoff', 'keder': 'keder', 'gurtpolster': 'stoff', 'schultergurt': 'gurt', 'beckengurt': 'gurt', 'schrittgurt': 'gurt', 'versteller': 'gurt',
        'schloss': 'schloss', 'knopf': 'knopf', 'zunge': 'metall', 'zungenkappe': 'schloss', 'messing': 'messing', 'niete': 'messing'}
def matset(v):
  return {'shell': material('schale_' + v, plastik(v)), 'guide': material('fuehrung_' + v, plastik(v, 'guide')), 'stoff': material('stoff_' + v, stoff(v)),
          'keder': material('keder_' + v, plastik(v, 'schloss') if v != 'b' else plastik(v, 'guide')), 'gurt': material('gurt_' + v, gurt(v)),
          'schloss': material('schloss_' + v, plastik(v, 'schloss')), 'knopf': material('knopf_' + v, plastik(v, 'knopf')), 'metall': material('metall_' + v, metall(v)),
          'messing': material('messing_' + v, metall(v, True))}
MS = {v: matset(v) for v in 'abc'}
ORDER = ['shell', 'guide', 'stoff', 'keder', 'gurt', 'schloss', 'knopf', 'metall', 'messing']
parts = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in parts:
  cat = CATS[o.name.split('.')[0]]; o.data.materials.clear()
  for c in ORDER: o.data.materials.append(MS['a'][c])
  idx = ORDER.index(cat)
  for p in o.data.polygons: p.material_index = idx
sitz = join(parts, 'kindersitz'); smooth(sitz, 40)
bm = bmesh.new(); bm.from_mesh(sitz.data); bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4]); bm.to_mesh(sitz.data); bm.free()
log('Dreiecke', tris([sitz]))
uv_smart(sitz, .003, 62)

def use(v):
  for i, c in enumerate(ORDER): sitz.material_slots[i].material = MS[v][c]
TEX = os.path.dirname(OUT); os.makedirs(TEX, exist_ok=True); stem = os.path.join(os.environ.get('HAM_BAKE', TEX), 'ks_')
use('a'); RA = bake(sitz, RES, ('col', 'rough', 'metal', 'normal', 'ao'), ao_dist=.12)
alb_a, orm_a, nrm_a = compose(RA, .7)
res = {'a': (alb_a, orm_a, nrm_a)}
for v in 'bc':
  use(v); R = bake(sitz, RES, ('col', 'rough', 'metal') + (('normal',) if v == 'c' else ())); R['ao'] = RA['ao']
  if 'normal' not in R: R['normal'] = RA['normal']
  res[v] = compose(R, .7)
# Schmutz in Ritzen (AO) leicht bräunlich
outs = []
for v in 'abc':
  alb, orm, nrm = res[v]; ao = RA['ao'][:, :, :1]; alb = alb * (1 - .25 * (1 - ao) * np.array([0, .12, .3])[None, None, :]) if False else alb
  ia = save_img('ks_alb_' + v, alb, stem + 'alb_' + v + '.png'); io = save_img('ks_orm_' + v, orm, stem + 'orm_' + v + '.png', False)
  inr = save_img('ks_nrm_' + v, nrm, stem + 'nrm_' + v + '.png', False) if v != 'b' else bpy.data.images['ks_nrm_a']
  fm = final_material('kindersitz_' + v, ia, io, inr)
  ob = sitz.copy(); ob.data = sitz.data.copy(); link(ob); ob.name = 'kindersitz_' + v; set_mat(ob, fm)
  for nm in ('ks_u', 'ks_a', 'ks_w', 'ks_c'):
    at = ob.data.attributes.get(nm)
    if at: ob.data.attributes.remove(at)
  outs.append(ob)
bpy.data.objects.remove(sitz, do_unlink=True)
export(OUT, outs)
