# Innenausbau des Amts-Fahrdienstbusses (Kap. 6 Tiefwald, Kap. 1 Transporter) – passend zur Außenhülle des Scans game/assets/ms/vans (Object017).
# Eigene Arbeit in Blender (bpy). Die Hülle wird importiert und in die Spielkoordinaten des Wagens gebracht (msFit 5,3 m, msGround);
# Wand-/Dachverkleidung, Heckwand und Türverkleidungen werden per Strahl an die Innenseite der Hülle angepasst (3 cm Abstand).
# Inhalt: Gummiboden mit Riffelung, Radkästen, Seitenverkleidung (Hartfaser, Alu-Leisten), Dachhimmel mit zwei Leuchtstoffleisten (eine Abdeckung zerbrochen),
# Haltestangen, vier Sitzschienen mit Querplatten für sieben Kindersitze, Gurtschlösser, Fahrer- und Beifahrersitz, Motorhaube innen,
# Armaturenbrett mit Instrumenten, Lenkrad, Lenksäule, Handschuhfach, Fahrtenbuch-Halter. Leere Knoten p_sitz_1…7 und p_fahrtenbuch markieren Einbaupunkte.
#   blender -b --factory-startup --threads 2 --python bus_innen_bau.py -- <ausgabe.glb> [textur groß] [textur klein]
# Koordinaten: Spiel (x quer, +x Fahrerseite; y hoch; z längs, +z vorn) → Blender (x, −z, y). Ursprung = Bodenmitte der Hülle (wie msGround).
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hb_lib import *
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else os.path.join(os.getcwd(), 'bus_innen.glb'); RESA = int(argv[1]) if len(argv) > 1 else 2048; RESB = int(argv[2]) if len(argv) > 2 else 1024
random.seed(11); scn = reset(); world(1)
def G(x, y, z): return Vector((x, -z, y))  # Spielkoordinaten → Blender

# ---------------------------------------------------------------- Hülle laden und einpassen
bpy.ops.import_scene.fbx(filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'game', 'assets', 'ms', 'vans', 'model.fbx'))
for o in list(scn.objects):
  if o.name != 'Object017': bpy.data.objects.remove(o, do_unlink=True)
hull = scn.objects['Object017']; apply_all(hull)
K = 5.3 / 377.9; S = K / .0254
for v in hull.data.vertices: v.co = Vector((v.co.x * S, v.co.y * S - 3.05 * K, v.co.z * S - .79 * K))
hull.data.update(); bvh = BVHTree.FromObject(hull, bpy.context.evaluated_depsgraph_get())
def hit(o, d, maxd=3.):
  r = bvh.ray_cast(o, d.normalized(), maxd); return r[0], r[1]
FLOOR = .58; CABF = .40; ZREAR = -2.40; ZB = .70

# ---------------------------------------------------------------- Verkleidung als Ring je Längsschnitt (Strahlen vom Mittelpunkt)
def ring(z, a0, a1, n, cy=1.16, inset=.03, dflt=.93):
  pts = []
  for i in range(n):
    th = math.radians(a0 + (a1 - a0) * i / (n - 1)); d = G(math.cos(th), math.sin(th), 0); o = G(0, cy, z)
    p, nn = hit(o, d)
    if p is None or abs(p.x) < .55 and p.z < 1.5: p = o + d * (dflt / max(.2, abs(math.cos(th))) if abs(math.cos(th)) > .3 else 1.)
    q = p - d.normalized() * inset
    if q.z < FLOOR + .002: q.z = FLOOR + .002
    pts.append(q)
  return pts
def smooth_grid(P, it=3, keep_edges=True):
  nu, nv = len(P), len(P[0])
  for _ in range(it):
    Q = [[p.copy() for p in r] for r in P]
    for i in range(1, nu - 1):
      for j in range(1, nv - 1): Q[i][j] = (P[i][j] * 4 + P[i - 1][j] + P[i + 1][j] + P[i][j - 1] + P[i][j + 1]) / 8
    P = Q
  return P
ZS = [ZREAR + .02 + (ZB - ZREAR - .02) * i / 46 for i in range(47)]
wand = smooth_grid([ring(z, -31, 211, 64) for z in ZS], 4)
bm = grid(wand, flip=False); bm.normal_update()
# Normalen nach innen (zur Wagenmitte)
bm.faces.ensure_lookup_table(); f = bm.faces[len(bm.faces) // 2]
if f.normal.dot(G(0, 1.16, f.calc_center_median().y * -1) - f.calc_center_median()) < 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
verkl = obj_bm(bm, 'verkleidung')
# Dachhimmel über dem Fahrerhaus (nur oben, Seitenfenster bleiben offen)
ZC = [ZB + (1.66 - ZB) * i / 14 for i in range(15)]
dach2 = smooth_grid([ring(z, 38, 142, 30, cy=1.3) for z in ZC], 3)
bm = grid(dach2); bm.normal_update(); bm.faces.ensure_lookup_table(); f = bm.faces[len(bm.faces) // 2]
if f.normal.z > 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
himmel2 = obj_bm(bm, 'himmel_vorn')
# Heckwand (Innenseite der Hecktüren) mit Fensteröffnung
HX = [-.86 + 1.72 * i / 34 for i in range(35)]; HY = [FLOOR + (1.86 - FLOOR) * j / 26 for j in range(27)]
HP = []
for x in HX:
  row = []
  for y in HY:
    p, nn = hit(G(x, y, -1.6), G(0, 0, -1))
    if p is None: p = G(x, y, -2.42)
    row.append(p + G(0, 0, .03))
  HP.append(row)
HP = smooth_grid(HP, 2)
bm = grid(HP); bm.normal_update()
win = [f for f in bm.faces if all(abs(v.co.x) < .675 and 1.30 < v.co.z < 1.82 for v in f.verts)]
bmesh.ops.delete(bm, geom=win, context='FACES'); bm.faces.ensure_lookup_table()
if bm.faces[0].normal.y > 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
heck = obj_bm(bm, 'heckwand')
# Fenstergummi um die Heckscheibe
fr = [G(x, y, 0) for x, y in [(-.675, 1.30), (.675, 1.30), (.675, 1.82), (-.675, 1.82)]]
rim = []
for i in range(4):
  a, b = fr[i], fr[(i + 1) % 4]
  for k in range(8):
    q = a.lerp(b, k / 8); p, nn = hit(Vector((q.x, -1.6 * -1, q.z)) * 0 + G(q.x, q.z, -1.6), G(0, 0, -1)); rim.append((p if p else G(q.x, q.z, -2.4)) + G(0, 0, .022))
gummi = obj_bm(tube(rim, .012, 6, closed=True), 'gummi')
# Türverkleidungen Fahrerhaus (unter der Fensterlinie)
tueren = []
for sg in (1, -1):
  TZ = [.80 + .82 * i / 16 for i in range(17)]; TY = [.48 + .80 * j / 12 for j in range(13)]; TP = []
  for z in TZ:
    row = []
    for y in TY:
      p, nn = hit(G(0, y, z), G(sg, 0, 0)); p = p if p else G(sg * .94, y, z); row.append(p - G(sg * .035, 0, 0))
    TP.append(row)
  TP = smooth_grid(TP, 3); bm = grid(TP); bm.normal_update(); bm.faces.ensure_lookup_table()
  if bm.faces[0].normal.x * sg > 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
  t = obj_bm(bm, 'tuer'); tueren.append(t)
  tueren.append(box(.035, .16, .03, loc=G(sg * .87, 1.0, 1.3), bev=.01, seg=2, name='tuergriff'))
  tueren.append(cyl(.02, .03, loc=G(sg * .885, .82, 1.12), rot=(0, math.pi / 2, 0), seg=12, name='kurbel'))
  tueren.append(box(.02, .09, .016, loc=G(sg * .865, .82, 1.07), bev=.006, seg=2, name='kurbel'))

# ---------------------------------------------------------------- Boden, Radkästen, Stufe, Schienen
boden = box(1.80, ZB - ZREAR, .022, loc=G(0, FLOOR - .011, (ZB + ZREAR) / 2), bev=.006, seg=2, name='boden')
cabb = box(1.84, 1.20, .02, loc=G(0, CABF - .01, ZB + .60), bev=.005, seg=1, name='boden_vorn')
stufe = box(1.80, .03, FLOOR - CABF, loc=G(0, (FLOOR + CABF) / 2, ZB + .012), bev=.004, seg=1, name='stufe')
schwelle = box(1.6, .06, .012, loc=G(0, FLOOR + .006, ZREAR + .03), bev=.003, seg=1, name='alu')
rads = []
for sg in (-1, 1):
  rk = box(.30, .86, .26, loc=G(sg * .79, FLOOR + .11, -1.37), bev=.07, seg=5, name='radkasten'); rads.append(rk)
SCH_X = (-.667, -.222, .222, .667)
schienen = [box(.032, ZB - ZREAR - .18, .013, loc=G(x, FLOOR + .0065, (ZB + ZREAR) / 2 - .02), bev=.002, seg=1, name='alu') for x in SCH_X]
SITZE = [(-.445, -2.08), (0, -2.08), (.445, -2.08), (-.667, -.62), (-.222, -.62), (.222, -.62), (.667, -.62)]
platten = []
for i, (sx, sz) in enumerate(SITZE):
  # Querplatten zwischen den Schienen unter jedem Sitz (vorn und hinten), mit Schrauben
  xs = sorted(SCH_X, key=lambda q: abs(q - sx))[:2]
  if i >= 3: xs = [sx - .2, sx + .2]
  for dz in (-.17, .15):
    platten.append(box(abs(xs[1] - xs[0]) + .06, .05, .008, loc=G((xs[0] + xs[1]) / 2, FLOOR + .017, sz + dz), bev=.002, seg=1, name='stahl'))
    for x in xs: platten.append(cyl(.009, .008, loc=G(x, FLOOR + .024, sz + dz), seg=8, name='schraube'))
# Gurtschlösser (von den ausgebauten Sitzbänken) auf kurzen Gurtstummeln am Boden
schl = []
for (sx, sz) in [(-.222, -.95), (.222, -.95), (0, -1.78), (-.42, -1.78), (.42, -1.78)]:
  p = [G(sx, FLOOR + .005, sz), G(sx + .01, FLOOR + .06, sz - .03), G(sx + .02, FLOOR + .1, sz - .02)]
  schl.append(obj_bm(ribbon(catmull(p, 8), [G(0, 0, 1)] * 8, .035, .002), 'gurt'))
  schl.append(box(.045, .07, .025, loc=G(sx + .025, FLOOR + .14, sz - .01), rot=(math.radians(70), 0, .2), bev=.007, seg=2, name='schloss'))
  schl.append(box(.022, .018, .006, loc=G(sx + .025, FLOOR + .15, sz + .005), rot=(math.radians(70), 0, .2), bev=.002, seg=1, name='knopf'))

# ---------------------------------------------------------------- Haltestangen, Leuchtstoffleisten
stangen = []
for sg in (-1, 1):
  pts = []
  for z in [ZREAR + .15 + i * .1 for i in range(29)]:
    p, nn = hit(G(0, 1.52, z), G(sg, 0, 0)); x = abs(p.x) if p else .9; pts.append(G(sg * (x - .095), 1.52, z))
  stangen.append(obj_bm(tube(pts, .016, 12), 'stange'))
  for z in (ZREAR + .2, -1.4, -.4, ZB - .25):
    p, nn = hit(G(0, 1.52, z), G(sg, 0, 0)); x = abs(p.x) if p else .9
    stangen.append(obj_bm(tube([G(sg * (x - .03), 1.52, z), G(sg * (x - .095), 1.52, z)], .011, 10), 'stange'))
    stangen.append(cyl(.03, .012, loc=G(sg * (x - .035), 1.52, z), rot=(0, math.pi / 2, 0), seg=14, name='stange'))
p1, _ = hit(G(-.6, 1.0, .5), G(0, 1, 0)); top = p1.z - .03 if p1 else 1.86
stangen.append(obj_bm(tube([G(-.6, FLOOR, .5), G(-.6, top + .0, .5)], .018, 12), 'stange'))
for yy in (FLOOR + .006, top - .006): stangen.append(cyl(.04, .014, loc=G(-.6, yy, .5), seg=14, name='stange'))
licht = []
for i, lz in enumerate((-1.55, -.25)):
  p, _ = hit(G(0, 1.4, lz), G(0, 1, 0)); y = (p.z if p else 1.93) - .04
  licht.append(box(.12, 1.05, .045, loc=G(0, y - .022, lz), bev=.01, seg=2, name='leuchte'))
  if i == 0:  # Abdeckung zerbrochen: halbe Wanne fehlt, Röhre liegt frei
    licht.append(box(.11, .5, .03, loc=G(0, y - .055, lz + .26), bev=.012, seg=3, name='opal'))
    licht.append(cyl(.013, 1.0, loc=G(0, y - .05, lz), rot=(math.pi / 2, 0, 0), seg=10, name='roehre'))
    licht.append(box(.07, .2, .012, loc=G(.02, FLOOR + .006, lz - .3), rot=(0, 0, .5), bev=.004, seg=2, name='opal'))  # Scherbe am Boden
  else: licht.append(box(.11, 1.0, .03, loc=G(0, y - .055, lz), bev=.012, seg=3, name='opal'))
# herabhängender Dachhimmel-Lappen (hinten rechts)
lp = []
for i in range(9):
  row = []
  for j in range(7):
    x = -.62 + .34 * j / 6; z = -2.0 + .42 * i / 8; p, _ = hit(G(x, 1.4, z), G(0, 1, 0)); y = (p.z if p else 1.9) - .04
    sag = .22 * (i / 8) ** 1.6 * (.6 + .4 * math.sin(j * .9)); row.append(G(x - sag * .15, y - sag, z + sag * .2))
  lp.append(row)
bm = grid(lp); bm.normal_update(); bm.faces.ensure_lookup_table()
if bm.faces[0].normal.z > 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
lappen = obj_bm(bm, 'lappen'); mod(lappen, 'SOLIDIFY', thickness=.004, offset=0)

# ---------------------------------------------------------------- Fahrerhaus: Motorhaube innen, Sitze, Armaturenbrett, Lenkrad, Fahrtenbuch-Halter
haube = box(.46, .95, .40, loc=G(0, CABF + .2, 1.40), bev=.12, seg=6, name='haube')
def bucket(x):
  P = []
  P.append(box(.48, .50, .12, loc=G(x, CABF + .30, 1.05), bev=.04, seg=4, name='polster'))  # Sitzkissen
  for sg in (-1, 1): P.append(box(.07, .46, .08, loc=G(x + sg * .21, CABF + .38, 1.05), bev=.03, seg=3, name='polster'))  # Seitenwangen
  r = box(.48, .13, .66, loc=G(x, CABF + .70, .77), rot=(math.radians(-14), 0, 0), bev=.05, seg=4, name='polster'); P.append(r)  # Lehne
  for sg in (-1, 1): P.append(box(.06, .1, .5, loc=G(x + sg * .215, CABF + .66, .79), rot=(math.radians(-14), 0, 0), bev=.025, seg=3, name='polster'))
  P.append(box(.44, .03, .56, loc=G(x, CABF + .68, .705), rot=(math.radians(-14), 0, 0), bev=.012, seg=2, name='kunststoff'))  # Rückenschale
  P.append(box(.26, .11, .16, loc=G(x, CABF + 1.12, .69), rot=(math.radians(-10), 0, 0), bev=.04, seg=4, name='polster'))  # Kopfstütze
  for sg in (-1, 1): P.append(cyl(.007, .1, loc=G(x + sg * .07, CABF + 1.02, .70), rot=(math.radians(-10), 0, 0), seg=8, name='chrom'))
  P.append(box(.36, .40, .22, loc=G(x, CABF + .11, 1.05), bev=.01, seg=1, name='stahl'))  # Sitzkasten
  return P
sitze_v = bucket(.45) + bucket(-.45)
# Armaturenbrett: Oberseite unter der Scheibe, Front zum Fahrer, Instrumentenhaube Fahrerseite
dash = []
dash.append(box(1.80, .40, .07, loc=G(0, 1.19, 1.80), rot=(math.radians(-8), 0, 0), bev=.03, seg=4, name='armatur'))
dash.append(box(1.80, .10, .40, loc=G(0, .99, 1.63), rot=(math.radians(12), 0, 0), bev=.035, seg=4, name='armatur'))
dash.append(box(1.80, .30, .18, loc=G(0, .80, 1.74), rot=(math.radians(-35), 0, 0), bev=.03, seg=3, name='armatur'))
dash.append(box(.52, .26, .17, loc=G(.45, 1.22, 1.64), rot=(math.radians(-6), 0, 0), bev=.05, seg=5, name='armatur'))  # Instrumentenhaube
for gx, gr in ((.32, .052), (.45, .075), (.58, .052)):  # Instrumente: Ring, Zifferblatt mit Strichen (ohne Schrift), Zeiger
  dash.append(cyl(gr + .008, .03, loc=G(gx, 1.15, 1.515), rot=(math.radians(-90 + 8), 0, 0), seg=24, name='chrom'))
  dash.append(cyl(gr, .012, loc=G(gx, 1.15, 1.506), rot=(math.radians(-90 + 8), 0, 0), seg=24, name='ziffer'))
  dash.append(box(.004, gr * .8, .003, loc=G(gx + gr * .25, 1.15 + gr * .2, 1.498), rot=(math.radians(-82), 0, math.radians(-50)), name='zeiger'))
dash.append(box(.42, .02, .14, loc=G(-.46, .98, 1.572), rot=(math.radians(12), 0, 0), bev=.008, seg=2, name='kunststoff'))  # Handschuhfach-Deckel
dash.append(box(.08, .012, .02, loc=G(-.46, 1.035, 1.562), rot=(math.radians(12), 0, 0), bev=.004, seg=1, name='chrom'))
dash.append(box(.18, .02, .05, loc=G(.0, 1.02, 1.572), rot=(math.radians(12), 0, 0), bev=.006, seg=2, name='schlitz'))  # Radioschacht (leer)
for vx in (-.75, -.22, .22, .75): dash.append(box(.12, .015, .04, loc=G(vx, 1.15, 1.575), rot=(math.radians(12), 0, 0), bev=.006, seg=1, name='schlitz'))  # Düsen
# Lenkrad: Kranz, zwei Speichen, Nabe, Säule, Schalthebel
LC = G(.45, 1.08, 1.33); ax = G(0, .64, -.77).normalized()  # Radachse (zum Fahrer geneigt)
side = G(1, 0, 0); up = ax.cross(side).normalized()
kranz = [LC + (side * math.cos(t) + up * math.sin(t)) * .2 for t in [i / 40 * 2 * math.pi for i in range(40)]]
lenk = [obj_bm(tube(kranz, .015, 10, ups=[ax] * 40, closed=True), 'lenkrad')]
for t in (math.radians(200), math.radians(-20)):
  lenk.append(obj_bm(tube([LC + ax * .015, LC + (side * math.cos(t) + up * math.sin(t)) * .19], .012, 8), 'lenkrad'))
nabe = cyl(.05, .05, loc=LC - ax * .005, seg=18, name='lenkrad'); nabe.rotation_mode = 'QUATERNION'; nabe.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(ax); lenk.append(nabe)
lenk.append(obj_bm(tube([LC - ax * .03, LC - ax * .38], .035, 12), 'kunststoff'))
lenk.append(obj_bm(tube([LC - ax * .12 + side * .03, LC - ax * .12 + side * .2 + up * .04], .007, 8), 'chrom'))
lenk.append(cyl(.016, .03, loc=LC - ax * .12 + side * .205 + up * .041, seg=12, name='kunststoff'))
# Fahrtenbuch-Halter: Blechplatte mit Federklemme, auf dem Armaturenbrett in der Mitte (Beifahrerseite)
FB = G(-.18, 1.255, 1.72)
halter = [box(.25, .32, .006, loc=FB, rot=(math.radians(-18), 0, math.radians(8)), bev=.004, seg=1, name='blech'),
          box(.11, .025, .018, loc=FB + G(-.005, .035, .14), rot=(math.radians(-18), 0, math.radians(8)), bev=.006, seg=2, name='chrom'),
          box(.2, .04, .03, loc=FB + G(0, -.02, -.165), rot=(math.radians(-18), 0, math.radians(8)), bev=.008, seg=2, name='blech')]
# Sicherheitsgurt Fahrer (B-Säule)
bg = [obj_bm(ribbon(catmull([G(.86, 1.42, .72), G(.78, 1.2, .74), G(.72, .80, .82), G(.66, .62, .9)], 14), [G(-1, 0, 0)] * 14, .045, .002), 'gurt'),
      box(.05, .07, .03, loc=G(.86, 1.45, .72), bev=.008, seg=2, name='kunststoff')]

# ---------------------------------------------------------------- Einbaupunkte
def leer(name, loc, rot=(0, 0, 0)):
  e = bpy.data.objects.new(name, None); link(e); e.location = loc; e.rotation_euler = rot; return e
EMP = [leer('p_sitz_%d' % (i + 1), G(sx, FLOOR + .021, sz)) for i, (sx, sz) in enumerate(SITZE)]
EMP.append(leer('p_fahrtenbuch', FB + G(0, .012, 0), (math.radians(-18 + 90), 0, math.radians(8))))

# ---------------------------------------------------------------- Materialien
def gummi_m(nb):  # Riffelgummi (schwarz), Staub, Laub-/Erdschmutz, Schleifspuren
  P = nb.coord('Object'); x, y, z = nb.sep(P)
  rib = nb.math('ABSOLUTE', nb.math('SINE', nb.math('MULTIPLY', x, 2 * math.pi / .012))); rib = nb.mr(rib, .55, .9, 0, 1)
  dirt = nb.mr(nb.noise(P, 3, 5, .62), .38, .7, 0, 1); grit = nb.noise(P, 300, 2)
  col = nb.mix(dirt, (.018, .018, .019), (.13, .11, .085)); col = nb.mix(nb.math('MULTIPLY', rib, nb.mr(grit, .3, .8, .3, .9)), col, (.2, .18, .15))
  col = nb.mix(nb.mr(nb.noise(nb.vec(P, scale=(6, 1, 1)), 9, 3), .6, .7, 0, .6), col, (.07, .055, .04))
  return dict(col=col, rough=nb.mix(dirt, .62, .92, kind='FLOAT'), metal=0., height=nb.math('ADD', rib, nb.math('MULTIPLY', grit, .15)), hs=.8, hd=.002)
def wand_m(nb):  # Hartfaser mit Kunststoff-Folie (grau-beige), Plattenstöße mit Alu-Leisten, Wasserlaufspuren, Kratzer, Schmutz unten
  P = nb.coord('Object'); x, y, z = nb.sep(P)
  seam = nb.mr(nb.math('ABSOLUTE', nb.math('SUBTRACT', nb.math('FRACT', nb.math('DIVIDE', nb.math('ADD', y, 2.3), .6)), .5)), .47, .485, 0, 1)
  scr = nb.math('MULTIPLY', nb.mr(nb.math('FRACT', nb.math('DIVIDE', nb.math('ADD', y, 2.3), .6)), .02, .03, 1, 0), nb.mr(nb.math('ABSOLUTE', nb.math('SUBTRACT', nb.math('FRACT', nb.math('DIVIDE', z, .3)), .5)), .44, .46, 0, 1))
  grain = nb.noise(P, 400, 3, .6); base = nb.mix(nb.mr(grain, .3, .7), (.30, .285, .255), (.36, .345, .31))
  hgt = nb.mr(z, .58, 1.86, 0, 1); low = nb.mr(z, .58, .9, 1, 0)
  streak = nb.math('MULTIPLY', nb.mr(nb.noise(nb.vec(P, scale=(2, 2, .08)), 20, 4, .7), .55, .7, 0, 1), nb.mr(z, 1.9, 1.0, 1, .1))
  col = nb.mix(nb.math('MULTIPLY', streak, .7), base, (.16, .13, .09), 'MULTIPLY')
  col = nb.mix(nb.math('MULTIPLY', low, nb.mr(nb.noise(P, 8, 4), .3, .7, .3, .9)), col, (.09, .075, .055))
  col = nb.mix(nb.mr(nb.noise(nb.vec(P, scale=(1, 1, 18), rot=(0, .2, 0)), 90, 2), .63, .67, 0, .6), col, (.5, .48, .44))
  col = nb.mix(seam, col, (.42, .43, .44)); col = nb.mix(scr, col, (.05, .05, .05))
  mold = nb.math('MULTIPLY', nb.mr(nb.vor(P, 90), 0, .25, 1, 0), nb.mr(nb.noise(P, 5, 3), .55, .62))
  col = nb.mix(mold, col, (.04, .05, .035))
  return dict(col=col, rough=nb.mix(seam, nb.mr(grain, 0, 1, .55, .75), .35, kind='FLOAT'), metal=nb.math('MULTIPLY', seam, .9), height=nb.math('ADD', nb.math('MULTIPLY', seam, 1.5), nb.math('MULTIPLY', grain, .1)), hs=.6, hd=.002)
def himmel_m(nb):  # perforierter Kunstleder-Himmel, vergilbt, Wasserränder
  P = nb.coord('Object'); x, y, z = nb.sep(P)
  perf = nb.mr(nb.vor(nb.vec(P, scale=(1, 1, 1)), 160, rand=0.), .0, .12, 1, 0); grain = nb.noise(P, 300, 2)
  col = nb.mix(nb.mr(grain, .3, .7), (.40, .385, .345), (.46, .445, .40)); col = nb.mix(nb.math('MULTIPLY', perf, .6), col, (.15, .14, .12))
  st = nb.noise(nb.vec(P, loc=(2, 1, 0)), 3, 4, .6); col = nb.mix(nb.mr(st, .55, .57, 0, .7), col, (.22, .17, .1)); col = nb.mix(nb.mr(st, .57, .75, 0, .45), col, (.33, .27, .17))
  col = nb.mix(nb.math('MULTIPLY', nb.mr(nb.vor(P, 70), 0, .2, 1, 0), nb.mr(nb.noise(P, 4, 3), .6, .66)), col, (.03, .035, .025))
  return dict(col=col, rough=.8, metal=0., height=nb.math('ADD', nb.math('MULTIPLY', perf, -1), nb.math('MULTIPLY', grain, .2)), hs=.4, hd=.0015)
def lack_m(nb, base=(.10, .11, .12)):  # lackiertes Blech mit Rost an Kanten
  P = nb.coord('Object'); pt = nb.mr(nb.geo('Pointiness'), .5, .58, 0, 1); n = nb.noise(P, 18, 5, .65)
  rust = nb.math('MAXIMUM', nb.math('MULTIPLY', pt, nb.mr(n, .35, .6)), nb.mr(n, .68, .72))
  rc = nb.mix(nb.noise(P, 120, 3), (.16, .06, .02), (.32, .14, .05)); col = nb.mix(nb.mr(nb.noise(P, 200, 2), .3, .7), base, nb.hsv(base, .5, 1, 1.3)); col = nb.mix(rust, col, rc)
  nz = nb.sep(nb.geo('Normal'))[2]; col = nb.mix(nb.math('MULTIPLY', nb.mr(nz, .4, 1), nb.mr(nb.noise(P, 30, 3), .3, .7, .1, .55)), col, (.2, .18, .15))
  return dict(col=col, rough=nb.mix(rust, .45, .85, kind='FLOAT'), metal=nb.mix(rust, .25, 0., kind='FLOAT'), height=nb.math('MULTIPLY', rust, .6), hs=.4, hd=.0015)
def alu_m(nb):
  P = nb.coord('Object'); x, y, z = nb.sep(P)
  slot = nb.math('MULTIPLY', nb.mr(nb.math('ABSOLUTE', nb.math('SUBTRACT', nb.math('FRACT', nb.math('DIVIDE', y, .0254)), .5)), .3, .26, 0, 1), nb.mr(z, FLOOR + .009, FLOOR + .0125, 0, 1))
  ox = nb.mr(nb.noise(P, 40, 4), .35, .7, 0, 1); col = nb.mix(ox, (.55, .56, .57), (.32, .31, .29)); col = nb.mix(slot, col, (.02, .02, .02))
  col = nb.mix(nb.mr(nb.noise(P, 6, 3), .5, .7, 0, .6), col, (.12, .1, .08))
  return dict(col=col, rough=nb.mix(ox, .35, .7, kind='FLOAT'), metal=nb.mix(ox, 1., .5, kind='FLOAT'), height=nb.math('MULTIPLY', slot, -2), hs=.6, hd=.002)
def chrom_m(nb):
  P = nb.coord('Object'); n = nb.noise(P, 25, 5, .65); pit = nb.mr(nb.noise(P, 300, 2), .62, .7)
  col = nb.mix(nb.mr(n, .45, .7), (.62, .62, .62), (.25, .2, .16)); col = nb.mix(pit, col, (.18, .09, .04))
  return dict(col=col, rough=nb.mix(nb.mr(n, .45, .7), .18, .55, kind='FLOAT'), metal=nb.mix(pit, 1., .4, kind='FLOAT'), height=pit, hs=.3, hd=.0006)
def vinyl_m(nb, base=(.045, .04, .035)):  # genarbtes Kunstleder (Sitze, Armaturenbrett) mit Rissen, Ausbleichen, Schaumstoff in Rissen
  P = nb.coord('Object'); grain = nb.vor(P, 900); crack = nb.mr(nb.vor(nb.vec(P, scale=(1, 1, 1)), 22, 'Distance', 'DISTANCE_TO_EDGE'), .0, .006, 1, 0)
  cm = nb.math('MULTIPLY', crack, nb.mr(nb.noise(P, 6, 3), .5, .62)); nz = nb.sep(nb.geo('Normal'))[2]
  col = nb.mix(nb.mr(grain, 0, .5), base, nb.hsv(base, .5, 1, 1.5)); col = nb.mix(nb.math('MULTIPLY', nb.mr(nz, .2, 1), .5), col, nb.hsv(base, .5, .5, 2.4))
  col = nb.mix(cm, col, (.48, .38, .2)); col = nb.mix(nb.math('MULTIPLY', nb.mr(nz, .3, 1), nb.mr(nb.noise(P, 40, 4), .35, .7, .05, .5)), col, (.25, .22, .18))
  return dict(col=col, rough=nb.mix(cm, nb.mr(grain, 0, .5, .45, .6), .9, kind='FLOAT'), metal=0., height=nb.math('SUBTRACT', nb.math('MULTIPLY', grain, .3), nb.math('MULTIPLY', cm, 1.2)), hs=.4, hd=.0012)
def kunst_m(nb, base=(.03, .03, .032)):
  P = nb.coord('Object'); g = nb.noise(P, 800, 2); pt = nb.mr(nb.geo('Pointiness'), .5, .56, 0, 1); nz = nb.sep(nb.geo('Normal'))[2]
  col = nb.mix(nb.mr(g, .3, .7), base, nb.hsv(base, .5, 1, 1.3)); col = nb.mix(nb.math('MULTIPLY', pt, .5), col, nb.hsv(base, .5, .6, 2.5))
  col = nb.mix(nb.math('MULTIPLY', nb.mr(nz, .3, 1), nb.mr(nb.noise(P, 30, 4), .35, .7, .05, .55)), col, (.24, .22, .19))
  return dict(col=col, rough=nb.mr(g, 0, 1, .4, .6), metal=0., height=g, hs=.15, hd=.0005)
def ziffer_m(nb):  # Zifferblatt: schwarz, weiße Striche im Kreis (keine Ziffern), vergilbt, Kondenswasser
  P = nb.coord('Object'); x, y, z = nb.sep(P)
  ang = nb.n('ShaderNodeMath', _operation='ARCTAN2'); nb.put(ang.inputs[0], z); nb.put(ang.inputs[1], nb.math('SUBTRACT', x, .45))
  tick = nb.mr(nb.math('ABSOLUTE', nb.math('SUBTRACT', nb.math('FRACT', nb.math('MULTIPLY', ang.outputs[0], 30 / (2 * math.pi))), .5)), .38, .42, 0, 1)
  col = nb.mix(nb.math('MULTIPLY', tick, .8), (.02, .02, .02), (.65, .62, .5)); col = nb.mix(nb.mr(nb.noise(P, 60, 3), .5, .7, 0, .5), col, (.2, .19, .17))
  return dict(col=col, rough=.35, metal=0.)
def opal_m(nb):
  P = nb.coord('Object'); col = nb.mix(nb.mr(nb.noise(P, 20, 4), .4, .7), (.62, .6, .52), (.5, .45, .32))
  col = nb.mix(nb.math('MULTIPLY', nb.mr(nb.vor(P, 40), 0, .06, 1, 0), nb.mr(nb.noise(P, 8, 2), .5, .6)), col, (.03, .03, .02))
  return dict(col=col, rough=.45, metal=0.)
def gurt_m(nb):
  P = nb.coord('Object'); r = nb.noise(P, 600, 2); col = nb.mix(nb.mr(nb.noise(P, 60, 3), .3, .7), (.05, .05, .055), (.1, .1, .1))
  return dict(col=col, rough=.8, metal=0., height=r, hs=.2, hd=.0005)
def rot_m(nb): return kunst_m(nb, (.42, .03, .02))
def blech_m(nb): return lack_m(nb, (.22, .22, .2))
def stahl_m(nb): return lack_m(nb, (.06, .065, .07))
def haube_m(nb): return vinyl_m(nb, (.05, .045, .04))
MATS = {'boden': material('gummi', gummi_m), 'verkleidung': material('wand', wand_m), 'heckwand': material('wand2', wand_m), 'tuer': material('tuer', lambda nb: vinyl_m(nb, (.13, .12, .105))),
        'himmel': material('himmel', himmel_m), 'radkasten': material('radkasten', lambda nb: lack_m(nb, (.07, .075, .08))), 'stahl': material('stahl', stahl_m), 'alu': material('alu', alu_m),
        'chrom': material('chrom', chrom_m), 'polster': material('polster', lambda nb: vinyl_m(nb, (.06, .052, .045))), 'armatur': material('armatur', lambda nb: vinyl_m(nb, (.035, .033, .032))),
        'kunststoff': material('kunststoff', kunst_m), 'ziffer': material('ziffer', ziffer_m), 'opal': material('opal', opal_m), 'gurt': material('gurt', gurt_m), 'knopf': material('knopf', rot_m),
        'blech': material('blech', blech_m), 'schlitz': material('schlitz', lambda nb: kunst_m(nb, (.01, .01, .01))), 'lenkrad': material('lenkrad', lambda nb: kunst_m(nb, (.022, .02, .02))),
        'gummi': material('fgummi', lambda nb: kunst_m(nb, (.012, .012, .012)))}
CAT = {'verkleidung': 'verkleidung', 'heckwand': 'heckwand', 'himmel_vorn': 'himmel', 'lappen': 'himmel', 'tuer': 'tuer', 'tuergriff': 'kunststoff', 'kurbel': 'chrom',
       'boden': 'boden', 'boden_vorn': 'boden', 'stufe': 'alu', 'alu': 'alu', 'radkasten': 'radkasten', 'stahl': 'stahl', 'schraube': 'chrom', 'gurt': 'gurt', 'schloss': 'kunststoff',
       'knopf': 'knopf', 'stange': 'chrom', 'leuchte': 'kunststoff', 'opal': 'opal', 'roehre': 'opal', 'haube': 'polster', 'polster': 'polster', 'chrom': 'chrom', 'armatur': 'armatur',
       'ziffer': 'ziffer', 'zeiger': 'knopf', 'schlitz': 'schlitz', 'lenkrad': 'lenkrad', 'kunststoff': 'kunststoff', 'blech': 'blech', 'gummi': 'gummi'}
GROSS = {'verkleidung', 'heckwand', 'himmel_vorn', 'lappen', 'boden', 'boden_vorn', 'radkasten', 'tuer', 'stufe', 'gummi'}
bpy.data.objects.remove(hull, do_unlink=True)
parts = [o for o in scn.objects if o.type == 'MESH']
# Dachbereich der Verkleidung bekommt den Himmel (Flächen über 1,62 m)
vm = verkl.data; vm.materials.append(MATS['verkleidung']); vm.materials.append(MATS['himmel'])
for p in vm.polygons: p.material_index = 1 if p.center.z > 1.64 else 0
for o in parts:
  if o is verkl: continue
  o.data.materials.clear(); o.data.materials.append(MATS[CAT[o.name.split('.')[0]]])
A = [o for o in parts if o.name.split('.')[0] in GROSS]; B = [o for o in parts if o not in A]
OA = join(A, 'bus_raum'); smooth(OA, 32); OB = join(B, 'bus_einbau'); smooth(OB, 38)
for o in (OA, OB):
  bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4]); bm.to_mesh(o.data); bm.free()
log('Dreiecke', tris([OA]), tris([OB]))
uv_smart(OA, .002, 66); uv_smart(OB, .003, 60)
STEM = os.environ.get('HAM_BAKE', os.path.dirname(OUT)); os.makedirs(STEM, exist_ok=True)
fin = []
for o, res, nm in ((OA, RESA, 'raum'), (OB, RESB, 'einbau')):
  R = bake(o, res, ('col', 'rough', 'metal', 'normal', 'ao'), ao_dist=.35 if nm == 'raum' else .12, samples=None)
  alb, orm, nrm = compose(R, .75)
  if res > 1024:  # ORM und Normal halb so groß (Speicher), Albedo voll
    orm = orm[::2, ::2]; nrm = nrm[::2, ::2]
  ia = save_img(nm + '_alb', alb, os.path.join(STEM, 'bus_' + nm + '_alb.png')); io = save_img(nm + '_orm', orm, os.path.join(STEM, 'bus_' + nm + '_orm.png'), False)
  inr = save_img(nm + '_nrm', nrm, os.path.join(STEM, 'bus_' + nm + '_nrm.png'), False)
  set_mat(o, final_material('bus_' + nm, ia, io, inr)); fin.append(o)
export(OUT, fin + EMP)
