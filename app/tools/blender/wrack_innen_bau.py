# Innenraum des Autowracks im Tiefwald (Kap. 6, Coupé „Group002“ aus game/assets/ms/car_rusty) – eigene Arbeit in Blender (bpy).
# Das Coupé wird in die Spielkoordinaten gebracht (nur Group002, msFit 4,3 m, msGround); Armaturenbrett und Teppich werden per Strahl an die
# vorhandene Karosserie angepasst. Inhalt: eingedrücktes, gerissenes Armaturenbrett mit Instrumentenhaube, gesprungenem Instrumentenglas,
# Mittelkonsole mit Kassettenschacht, offenes Handschuhfach (Beifahrerseite), verbogenes Dreispeichen-Lenkrad,
# zwei Schalensitze mit Rissen (Schaumstoff), zerschnittener Gurt, Teppich mit Laub/Moos/Nässe, Scherben, Reste der zersprungenen
# Windschutzscheibe (Verbundglas, Spinnennetz-Sprünge), herabhängender Innenspiegel, Kabel unter dem Armaturenbrett,
# abgerissene verformte Türverkleidung neben der Beifahrertür. Leere Knoten p_handschuhfach, p_beifahrersitz markieren Spielpunkte.
#   blender -b --factory-startup --threads 2 --python wrack_innen_bau.py -- <ausgabe.glb> [textur]
# Koordinaten: Spiel (x quer, +x Fahrerseite; y hoch; z längs, +z vorn) → Blender (x, −z, y).
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hb_lib import *
from mathutils.bvhtree import BVHTree
from mathutils import noise as _mn
def mn_noise(v): return _mn.noise(Vector(v))

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else os.path.join(os.getcwd(), 'wrack_innen.glb'); RES = int(argv[1]) if len(argv) > 1 else 2048
random.seed(23); scn = reset(); world(1)
def G(x, y, z): return Vector((x, -z, y))

# ---------------------------------------------------------------- Karosserie laden (nur das Coupé) und in Spielkoordinaten bringen
bpy.ops.import_scene.gltf(filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'game', 'assets', 'ms', 'car_rusty', 'model.glb'))
def under(o, n):
  p = o
  while p:
    if p.name == n: return True
    p = p.parent
  return False
body = None
for o in list(scn.objects):
  if o.type == 'MESH' and under(o, 'Group002') and o.name == 'Mesh_11': body = o
for o in list(scn.objects):
  if o is not body: bpy.data.objects.remove(o, do_unlink=True)
M = body.matrix_world.copy(); body.parent = None; body.matrix_world = M; apply_all(body)
K2 = 4.3 / 4.059
for v in body.data.vertices: v.co = Vector(((v.co.x + 2.662) * K2, v.co.y * K2, (v.co.z + .044) * K2))
body.data.update(); bvh = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
def ray(o, d, maxd=2.):
  r = bvh.ray_cast(o, d.normalized(), maxd); return r[0]

# ---------------------------------------------------------------- Armaturenbrett, an die vorhandene Form gelegt
XS = [-.66 + 1.32 * i / 30 for i in range(31)]
HS = [.40 + .42 * j / 9 for j in range(10)]
DASH = []
for x in XS:
  row = []
  for h in HS:  # Vorderseite (zum Innenraum)
    p = ray(G(x, h, -.2), G(0, 0, 1)); z = (-p.y if p else .42); z = max(.38, min(z, .62))
    row.append(G(x, h, z - .018))
  ztop0 = -row[-1].y
  for k in range(1, 7):  # Oberseite bis unter die Scheibe
    z = ztop0 + (.64 - ztop0) * k / 6; p = ray(G(x, 1.05, z), G(0, 0, -1)); y = (p.z if p else .82)
    row.append(G(x, min(max(y, .78), .835) + .012, z))
  DASH.append(row)
# Unfall: Fahrerseite eingedrückt (Armaturenbrett nach innen gewölbt, Oberseite angehoben und geknickt)
for i, x in enumerate(XS):
  k = math.exp(-((x - .42) / .2) ** 2)
  for j, p in enumerate(DASH[i]):
    t = j / (len(DASH[i]) - 1); p.y -= .05 * k * math.sin(t * math.pi); p.z += .025 * k * math.sin(t * math.pi * 2) ** 2
    p.x += random.uniform(-.002, .002); p.z += random.uniform(-.002, .002) * k
bm = grid(DASH); bm.normal_update(); bm.faces.ensure_lookup_table()
if bm.faces[len(bm.faces) // 2].normal.y < 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
dash = obj_bm(bm, 'armatur'); mod(dash, 'SOLIDIFY', thickness=.02, offset=-1, use_rim=True)
# Instrumentenhaube (Fahrer) mit drei Rundinstrumenten, Glas gesprungen
haube = box(.44, .2, .11, loc=G(.40, .80, .38), rot=(math.radians(-10), 0, math.radians(-3)), bev=.05, seg=6, name='armatur')
gauges = []
for gx, r in ((.30, .038), (.40, .052), (.50, .038)):
  rot = (math.radians(-90 + 12), 0, 0)
  gauges.append(cyl(r + .007, .03, loc=G(gx, .785, .32), rot=rot, seg=24, name='chrom'))
  gauges.append(cyl(r, .01, loc=G(gx, .785, .31), rot=rot, seg=24, name='ziffer'))
  gauges.append(cyl(r * .98, .003, loc=G(gx, .783, .302), rot=rot, seg=24, name='glas'))
# Mittelkonsole mit Kassettenschacht und Düsen, Schalthebel mit Manschette
kons = [box(.21, .34, .28, loc=G(0, .43, .31), rot=(math.radians(32), 0, 0), bev=.035, seg=4, name='kunststoff'),
        box(.17, .02, .045, loc=G(0, .55, .175), rot=(math.radians(32), 0, 0), bev=.006, seg=2, name='schlitz'),
        box(.15, .02, .01, loc=G(0, .562, .168), rot=(math.radians(32), 0, 0), bev=.002, seg=1, name='chrom'),
        box(.06, .02, .03, loc=G(-.05, .64, .225), rot=(math.radians(32), 0, 0), bev=.006, seg=2, name='schlitz'),
        box(.06, .02, .03, loc=G(.05, .64, .225), rot=(math.radians(32), 0, 0), bev=.006, seg=2, name='schlitz'),
        box(.22, .5, .12, loc=G(0, .34, -.22), bev=.04, seg=3, name='kunststoff')]
kons.append(cyl(.055, .07, loc=G(0, .42, -.08), seg=14, r2=.03, name='leder'))
kons.append(cyl(.007, .16, loc=G(0, .5, -.09), rot=(math.radians(-10), 0, .2), seg=8, name='chrom'))
kons.append(cyl(.022, .04, loc=G(.01, .58, -.10), seg=14, name='kunststoff'))
# Handschuhfach Beifahrerseite: Kasten offen, Deckel hängt nach unten
HF = G(-.40, .60, .37)
hf = [box(.34, .2, .15, loc=HF + G(0, 0, .11), bev=.01, seg=1, name='schlitz'),
      box(.34, .015, .14, loc=HF + G(0, -.11, -.005), rot=(math.radians(-72), 0, 0), bev=.006, seg=2, name='kunststoff'),
      box(.06, .012, .02, loc=HF + G(0, -.17, -.03), rot=(math.radians(-72), 0, 0), bev=.004, seg=1, name='chrom')]
# Lenkrad: Dreispeichen, Kranz verbogen, Säule, herabhängender Airbag
LC = G(.40, .66, .17); ax = G(0, .5, -.866).normalized(); sd = G(1, 0, 0); up = sd.cross(ax).normalized()
kr = []
for i in range(48):
  t = i / 48 * 2 * math.pi; r = .185 * (1 - .12 * math.exp(-((t - 1.2) / .5) ** 2)); off = ax * (.035 * math.exp(-((t - 1.2) / .45) ** 2))
  kr.append(LC + (sd * math.cos(t) * 1.03 + up * math.sin(t) * .97) * r + off)
lenk = [obj_bm(tube(kr, .016, 10, ups=[ax] * 48, closed=True), 'lenkrad')]
for t in (math.radians(0), math.radians(180), math.radians(270)):
  lenk.append(obj_bm(tube([LC + ax * .02, LC + (sd * math.cos(t) + up * math.sin(t)) * .175], .014, 8), 'lenkrad'))
nabe = cyl(.07, .05, loc=LC + ax * .02, seg=20, name='lenkrad'); nabe.rotation_mode = 'QUATERNION'; nabe.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(ax); lenk.append(nabe)
lenk.append(obj_bm(tube([LC - ax * .02, LC - ax * .34], .032, 12), 'kunststoff'))
# (Airbag weggelassen: wirkte als flaches Blatt; das Coupé ist älter als Fahrerairbags)

# ---------------------------------------------------------------- Teppich (folgt dem Boden und dem Tunnel)
TX = [-.64 + 1.28 * i / 26 for i in range(27)]; TZ = [-.62 + 1.08 * j / 22 for j in range(23)]
TP = []
for x in TX:
  row = []
  for z in TZ:
    p = ray(G(x, .7, z), G(0, -1, 0)); y = p.z if p else .25
    if y > .62: y = .27  # Sitze ausnehmen: unter den Sitzen bleibt der Teppich am Boden
    row.append(G(x, y + .012, z))
  TP.append(row)
TP = [[p for p in r] for r in TP]
bm = grid(TP); bm.normal_update(); bm.faces.ensure_lookup_table()
if bm.faces[0].normal.z < 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
teppich = obj_bm(bm, 'teppich')

# ---------------------------------------------------------------- Schalensitze (Kunstleder, gerissen) über den vorhandenen Sitzen
def sitz(x, lehne=-14, kaputt=False):
  P = []
  P.append(box(.48, .44, .12, loc=G(x, .49, -.32), bev=.045, seg=4, name='leder'))
  for sg in (-1, 1): P.append(box(.08, .42, .11, loc=G(x + sg * .215, .54, -.32), rot=(0, sg * .25, 0), bev=.035, seg=3, name='leder'))
  r = math.radians(lehne)
  P.append(box(.48, .12, .46, loc=G(x, .79, -.6), rot=(r, 0, 0), bev=.05, seg=4, name='leder'))
  for sg in (-1, 1): P.append(box(.08, .13, .40, loc=G(x + sg * .225, .77, -.585), rot=(r, 0, sg * -.2), bev=.035, seg=3, name='leder'))
  P.append(box(.30, .11, .17, loc=G(x, 1.0, -.66), rot=(r, 0, 0), bev=.05, seg=4, name='leder'))
  P.append(box(.44, .03, .42, loc=G(x, .78, -.665), rot=(r, 0, 0), bev=.012, seg=2, name='kunststoff'))
  if kaputt:  # aufgerissene Polsterflanke: Schaumstoff quillt heraus
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=2, radius=.034)
    for v in bm.verts: v.co *= 1 + .35 * mn_noise(v.co * 60) ; v.co.x *= .7; v.co.z *= 1.5
    sc = obj_bm(bm, 'schaum'); sc.location = G(x - .205, .565, -.25); sc.rotation_euler = (.3, .2, .4); P.append(sc)
    P.append(box(.09, .07, .005, loc=G(x - .2, .585, -.2), rot=(math.radians(-55), .4, .3), bev=.002, seg=1, name='leder'))
  return P
sitze = sitz(.40, -22, True) + sitz(-.40, -14, True)
# Gurt (zerschnitten) an der B-Säule Fahrerseite
gurt = [obj_bm(ribbon(catmull([G(.66, 1.0, -.72), G(.62, .82, -.66), G(.58, .62, -.55), G(.6, .5, -.45)], 12), [G(-1, 0, 0)] * 12, .046, .002), 'gurt'),
        box(.05, .07, .03, loc=G(.66, 1.02, -.72), bev=.008, seg=2, name='kunststoff')]

# ---------------------------------------------------------------- Windschutzscheibe (Verbundglas, gesprungen, nach innen gedrückt) und Scherben
WS = []
for i in range(17):
  row = []
  for j in range(9):
    x = -.6 + 1.2 * i / 16; t = j / 8; z = .56 - .42 * t; y0 = .815 + .27 * t
    sag = .07 * math.sin(t * math.pi) * math.exp(-((x - .3) / .35) ** 2)
    row.append(G(x, y0 - sag * .45, z - sag))
  WS.append(row)
bm = grid(WS); scheibe = obj_bm(bm, 'scheibe')
# Bruchkante: die Fahrerseite der Scheibe fehlt teilweise
bm = bmesh.new(); bm.from_mesh(scheibe.data); bm.faces.ensure_lookup_table()
kill = [f for f in bm.faces if (lambda c: c.x > .25 and c.z > .95 + .08 * math.sin(c.x * 20))(f.calc_center_median())]
bmesh.ops.delete(bm, geom=kill, context='FACES'); bm.to_mesh(scheibe.data); bm.free()
scherben = []
for k in range(46):
  x, z = random.uniform(-.6, .6), random.uniform(-.55, .45)
  p = ray(G(x, 1.05, z), G(0, -1, 0)); y = p.z if p else .27
  if y > 1.0: continue
  s = random.uniform(.012, .045); bm = bmesh.new()
  pts = [Vector((math.cos(a) * s * random.uniform(.5, 1.2), math.sin(a) * s * random.uniform(.5, 1.2), 0)) for a in sorted(random.uniform(0, 6.28) for _ in range(random.choice((3, 4, 5))))]
  vs = [bm.verts.new(q) for q in pts] + [bm.verts.new(q + Vector((0, 0, .004))) for q in pts]
  n = len(pts); bm.faces.new(vs[:n][::-1]); bm.faces.new(vs[n:])
  for a in range(n): bm.faces.new((vs[a], vs[(a + 1) % n], vs[n + (a + 1) % n], vs[n + a]))
  o = obj_bm(bm, 'scherbe'); o.location = G(x, y + .003, z); o.rotation_euler = (random.uniform(-.25, .25), random.uniform(-.25, .25), random.uniform(0, 6.28)); scherben.append(o)
# Innenspiegel hängt am Kabel
spiegel = [box(.2, .025, .06, loc=G(0, .86, .22), rot=(math.radians(20), .2, .5), bev=.012, seg=3, name='kunststoff'),
           obj_bm(tube(catmull([G(0, 1.08, .28), G(.01, 1.0, .25), G(0, .9, .23)], 8), .003, 6), 'kabel')]
# Kabel unter dem Armaturenbrett
kabel = []
for k, (x0, c) in enumerate(((.15, 0), (.22, 1), (.3, 2), (-.2, 1), (-.28, 0), (.05, 2))):
  p0 = G(x0, .45, .40); p1 = G(x0 + random.uniform(-.08, .08), .30 + random.uniform(0, .08), .30 + random.uniform(-.05, .05)); p2 = G(x0 + random.uniform(-.1, .1), .42, .36)
  kabel.append(obj_bm(tube(catmull([p0, p1, p2], 10), .004, 6), 'kabel_%d' % c))
# abgerissene, verformte Türverkleidung neben der Beifahrertür (lehnt an der Schwelle)
TV = []
for i in range(13):
  row = []
  for j in range(7):
    u = i / 12; v = j / 6; bend = .09 * math.sin(u * math.pi) * (1 - v) + .05 * math.exp(-((u - .65) / .12) ** 2)
    row.append(Vector((u * .95, bend, v * .48)))
  TV.append(row)
bm = grid(TV); tuer = obj_bm(bm, 'tuer'); mod(tuer, 'SOLIDIFY', thickness=.012, offset=0)
tuer.location = G(-1.02, .02, .25); tuer.rotation_euler = (math.radians(-68), 0, math.radians(84))
tur2 = [box(.32, .07, .05, loc=(.55, .03, .22), bev=.02, seg=3, name='tuergriff'), cyl(.07, .01, loc=(.25, .02, .2), rot=(math.pi / 2, 0, 0), seg=18, name='schlitz')]
bpy.context.view_layer.update(); Mt = tuer.matrix_world.copy()
for t in tur2: bpy.context.view_layer.update(); t.matrix_world = Mt @ t.matrix_world

# ---------------------------------------------------------------- Einbaupunkte
def leer(name, loc):
  e = bpy.data.objects.new(name, None); link(e); e.location = loc; return e
EMP = [leer('p_handschuhfach', HF + G(0, 0, .05)), leer('p_beifahrersitz', G(-.40, .62, -.30)), leer('p_lenkrad', LC)]

# ---------------------------------------------------------------- Materialien
def leder_m(nb, base=(.05, .036, .028)):
  P = nb.coord('Object'); grain = nb.vor(P, 700); nz = nb.sep(nb.geo('Normal'))[2]
  crack = nb.mr(nb.vor(P, 26, 'Distance', 'DISTANCE_TO_EDGE'), 0, .005, 1, 0); cm = nb.math('MULTIPLY', crack, nb.mr(nb.noise(P, 5, 3), .45, .6))
  col = nb.mix(nb.mr(grain, 0, .5), base, nb.hsv(base, .5, 1, 1.4)); col = nb.mix(nb.math('MULTIPLY', nb.mr(nz, .1, 1), .3), col, nb.hsv(base, .5, .5, 1.9))
  col = nb.mix(cm, col, (.5, .4, .2))
  mold = nb.math('MULTIPLY', nb.mr(nb.vor(P, 120), 0, .3, 1, 0), nb.mr(nb.noise(P, 7, 3), .52, .62)); col = nb.mix(mold, col, (.11, .13, .07))
  col = nb.mix(nb.math('MULTIPLY', nb.mr(nz, .5, 1), nb.mr(nb.noise(P, 30, 4), .35, .75, .03, .3)), col, (.16, .14, .1))
  return dict(col=col, rough=nb.mix(cm, nb.mix(mold, nb.mr(grain, 0, .5, .45, .62), .85, kind='FLOAT'), .9, kind='FLOAT'), metal=0., height=nb.math('SUBTRACT', nb.math('MULTIPLY', grain, .3), nb.math('MULTIPLY', cm, 1.4)), hs=.45, hd=.0012)
def teppich_m(nb):
  P = nb.coord('Object'); f = nb.noise(P, 600, 2, .7); dirt = nb.mr(nb.noise(P, 4, 5, .6), .35, .7)
  col = nb.mix(nb.mr(f, .3, .7), (.035, .033, .032), (.06, .055, .05)); col = nb.mix(dirt, col, (.11, .085, .055))
  leaf = nb.n('ShaderNodeTexVoronoi', Vector=P, Scale=28, Randomness=1); lm = nb.math('MULTIPLY', nb.mr(leaf.outputs['Distance'], .25, .18, 0, 1), nb.mr(nb.noise(P, 3, 3), .45, .55))
  lc = nb.ramp(leaf.outputs['Color'], [(0, (.19, .09, .03)), (.4, (.33, .17, .05)), (.7, (.12, .07, .03)), (1, (.26, .2, .06))])
  col = nb.mix(lm, col, lc); moss = nb.math('MULTIPLY', nb.mr(nb.noise(P, 9, 5, .65), .6, .7), nb.mr(nb.noise(P, 200, 2), .3, .6)); col = nb.mix(moss, col, (.07, .1, .03))
  wet = nb.mr(nb.noise(nb.vec(P, loc=(4, 2, 0)), 2.5, 3), .55, .65)
  return dict(col=nb.mix(nb.math('MULTIPLY', wet, .5), col, (0, 0, 0), 'MULTIPLY'), rough=nb.mix(wet, nb.mix(lm, .95, .7, kind='FLOAT'), .35, kind='FLOAT'), metal=0., height=nb.math('ADD', f, nb.math('MULTIPLY', lm, 1.5)), hs=.5, hd=.002)
def armatur_m(nb):
  P = nb.coord('Object'); g = nb.vor(P, 900); nz = nb.sep(nb.geo('Normal'))[2]
  crack = nb.math('MULTIPLY', nb.mr(nb.vor(nb.vec(P, scale=(1, 3, 1)), 9, 'Distance', 'DISTANCE_TO_EDGE'), 0, .004, 1, 0), nb.mr(nb.noise(P, 3, 2), .4, .55))
  col = nb.mix(nb.mr(g, 0, .5), (.032, .03, .03), (.05, .047, .045)); col = nb.mix(nb.math('MULTIPLY', nb.mr(nz, .3, 1), .7), col, (.13, .12, .11))
  col = nb.mix(crack, col, (.33, .28, .17)); col = nb.mix(nb.math('MULTIPLY', nb.mr(nz, .3, 1), nb.mr(nb.noise(P, 20, 4), .3, .7, .1, .7)), col, (.2, .19, .15))
  return dict(col=col, rough=nb.mix(crack, .55, .9, kind='FLOAT'), metal=0., height=nb.math('SUBTRACT', nb.math('MULTIPLY', g, .2), nb.math('MULTIPLY', crack, 2)), hs=.5, hd=.0015)
def kunst_m(nb, base=(.03, .03, .032)):
  P = nb.coord('Object'); g = nb.noise(P, 800, 2); nz = nb.sep(nb.geo('Normal'))[2]; pt = nb.mr(nb.geo('Pointiness'), .53, .6, 0, 1)
  col = nb.mix(nb.mr(g, .3, .7), base, nb.hsv(base, .5, 1, 1.3)); col = nb.mix(nb.math('MULTIPLY', pt, .3), col, nb.hsv(base, .5, .7, 1.7))
  col = nb.mix(nb.math('MULTIPLY', nb.mr(nz, .45, 1), nb.mr(nb.noise(P, 25, 4), .4, .75, .03, .3)), col, (.17, .155, .12))
  return dict(col=col, rough=nb.mr(g, 0, 1, .45, .65), metal=0., height=g, hs=.15, hd=.0005)
def chrom_m(nb):
  P = nb.coord('Object'); n = nb.noise(P, 30, 5, .65); rust = nb.mr(n, .55, .7)
  col = nb.mix(rust, (.55, .55, .55), (.25, .1, .04))
  return dict(col=col, rough=nb.mix(rust, .25, .85, kind='FLOAT'), metal=nb.mix(rust, 1., .2, kind='FLOAT'), height=rust, hs=.4, hd=.001)
def ziffer_m(nb):
  P = nb.coord('Object'); x, y, z = nb.sep(P)
  ring = nb.mr(nb.math('ABSOLUTE', nb.math('SINE', nb.math('MULTIPLY', nb.math('ARCTAN2', z, nb.math('SUBTRACT', x, .4)), 15))), .9, .97, 0, 1)
  col = nb.mix(nb.math('MULTIPLY', ring, .6), (.015, .015, .015), (.5, .48, .4)); col = nb.mix(nb.mr(nb.noise(P, 50, 3), .5, .7, 0, .6), col, (.18, .17, .13))
  return dict(col=col, rough=.4, metal=0.)
def glas_m(nb):  # Instrumentenglas: stumpf, verschmutzt
  P = nb.coord('Object'); return dict(col=nb.mix(nb.mr(nb.noise(P, 40, 3), .3, .7), (.06, .065, .06), (.16, .15, .12)), rough=.25, metal=0.)
def schaum_m(nb):
  P = nb.coord('Object'); pores = nb.vor(P, 900); col = nb.mix(nb.mr(pores, 0, .5), (.35, .24, .07), (.62, .48, .18))
  return dict(col=nb.mix(nb.mr(nb.noise(P, 20, 3), .4, .7), col, (.28, .2, .08), 'MULTIPLY'), rough=.95, metal=0., height=pores, hs=.6, hd=.002)
def gurt_m(nb):
  P = nb.coord('Object'); r = nb.noise(P, 600, 2); return dict(col=nb.mix(nb.mr(nb.noise(P, 30, 3), .3, .7), (.05, .05, .055), (.14, .12, .1)), rough=.8, metal=0., height=r, hs=.2, hd=.0005)
def tuer_m(nb):  # Türverkleidung: genarbter Kunststoff/Stoffeinsatz, Wasserflecken, Moos
  P = nb.coord('Object'); g = nb.vor(P, 700); m = nb.mr(nb.noise(P, 6, 4), .55, .68)
  col = nb.mix(nb.mr(g, 0, .5), (.07, .06, .055), (.1, .09, .08)); col = nb.mix(m, col, (.06, .09, .03)); col = nb.mix(nb.mr(nb.noise(P, 3, 3), .5, .65, 0, .6), col, (.16, .12, .08))
  return dict(col=col, rough=.8, metal=0., height=g, hs=.3, hd=.001)
def scherbe_m(nb): return dict(col=(.06, .075, .07), rough=.05, metal=0.)
def kabel_m(c):
  base = [(.4, .03, .02), (.05, .12, .4), (.42, .36, .04)][c]
  def b(nb): return kunst_m(nb, base)
  return b
def schlitz_m(nb): return kunst_m(nb, (.008, .008, .008))
MATS = {'armatur': material('armatur', armatur_m), 'chrom': material('chrom', chrom_m), 'ziffer': material('ziffer', ziffer_m), 'glas': material('glas', glas_m),
        'kunststoff': material('kunststoff', kunst_m), 'schlitz': material('schlitz', schlitz_m), 'leder': material('leder', leder_m), 'lenkrad': material('lenkrad', lambda nb: kunst_m(nb, (.02, .019, .019))),
        'teppich': material('teppich', teppich_m), 'schaum': material('schaum', schaum_m), 'gurt': material('gurt', gurt_m),
        'tuer': material('tuer', tuer_m), 'tuergriff': material('tuergriff', kunst_m), 'scherbe': material('scherbe', scherbe_m), 'kabel': material('kabel', lambda nb: kunst_m(nb, (.02, .02, .02))),
        'kabel_0': material('kabel0', kabel_m(0)), 'kabel_1': material('kabel1', kabel_m(1)), 'kabel_2': material('kabel2', kabel_m(2))}
bpy.data.objects.remove(body, do_unlink=True)
parts = [o for o in scn.objects if o.type == 'MESH' and o.name.split('.')[0] != 'scheibe']
for o in parts:
  key = o.name.split('.')[0]; o.data.materials.clear(); o.data.materials.append(MATS[key if key in MATS else 'kunststoff'])
W = join(parts, 'wrack_innen'); smooth(W, 40)
bm = bmesh.new(); bm.from_mesh(W.data); bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4]); bm.to_mesh(W.data); bm.free()
log('Dreiecke', tris([W]), '+ Scheibe', tris([scheibe]))
uv_smart(W, .003, 62)
STEM = os.environ.get('HAM_BAKE', os.path.dirname(OUT)); os.makedirs(STEM, exist_ok=True)
R = bake(W, RES, ('col', 'rough', 'metal', 'normal', 'ao'), ao_dist=.25)
alb, orm, nrm = compose(R, .75)
if RES > 1024: orm = orm[::2, ::2]; nrm = nrm[::2, ::2]
ia = save_img('w_alb', alb, os.path.join(STEM, 'wrack_alb.png')); io = save_img('w_orm', orm, os.path.join(STEM, 'wrack_orm.png'), False); inr = save_img('w_nrm', nrm, os.path.join(STEM, 'wrack_nrm.png'), False)
set_mat(W, final_material('wrack_innen', ia, io, inr))
# Scheibe: Sprungbild direkt berechnen (Einschlag Fahrerseite oben), RGBA mit Alpha, eigenes Material (durchscheinend)
uv_smart(scheibe, .002, 80)
N = 1024; yy, xx = np.mgrid[0:N, 0:N] / N
bpy.ops.object.select_all(action='DESELECT'); scheibe.select_set(True); bpy.context.view_layer.objects.active = scheibe
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.reset(); bpy.ops.object.mode_set(mode='OBJECT')
# reset: jede Fläche voll → eigene planare Projektion (x, Höhe) statt dessen
uvl = scheibe.data.uv_layers.active.data
for p in scheibe.data.polygons:
  for li in p.loop_indices:
    co = scheibe.data.vertices[scheibe.data.loops[li].vertex_index].co; uvl[li].uv = ((co.x + .62) / 1.24, (co.z - .78) / .36)
cx, cy = (.3 + .62) / 1.24, .7; dx, dy = xx - cx, yy - cy; rr = np.hypot(dx, dy) + 1e-6; an = np.arctan2(dy, dx)
rng = np.random.default_rng(5); crack = np.zeros((N, N), np.float32); A0 = np.sort(rng.uniform(-np.pi, np.pi, 24)); L0 = rng.uniform(.18, .8, 24)
for a0, l0 in zip(A0, L0):  # gerade Radialsprünge (leicht geknickt)
  kn = rng.uniform(.04, .1); aa = a0 + kn * np.clip(rr - .15, 0, None) * rng.choice((-1, 1))
  d = np.abs(np.sin(an - aa)) * rr; crack = np.maximum(crack, np.clip(1 - d / .0016, 0, 1) * (rr < l0) * (np.cos(an - aa) > 0))
for r0 in np.cumsum(rng.uniform(.015, .045, 12)):  # Ringe als gerade Stücke zwischen den Radialsprüngen
  k = np.searchsorted(A0, an) % len(A0); a1 = A0[k - 1]; a2 = A0[k]; w = (a2 - a1) % (2 * np.pi)
  t = ((an - a1) % (2 * np.pi)) / np.maximum(w, 1e-3); rp = r0 * (1 + rng.uniform(-.1, .1)) * (np.cos(w / 2) / np.maximum(np.cos((t - .5) * w), .2))
  keep = rng.random(len(A0))[k] > .35
  crack = np.maximum(crack, np.clip(1 - np.abs(rr - rp) / .0014, 0, 1) * keep)
crack = np.maximum(crack, np.clip(1 - rr / .02, 0, 1))
dirt = np.clip(.15 + .25 * (1 - yy) + .1 * rng.standard_normal((N, N)).astype(np.float32) * 0, 0, 1)
rgba = np.zeros((N, N, 4), np.float32); rgba[..., 0] = .5 + .22 * crack - .25 * dirt; rgba[..., 1] = .55 + .2 * crack - .25 * dirt; rgba[..., 2] = .53 + .2 * crack - .28 * dirt
rgba[..., 3] = np.clip(.14 + .5 * crack + .3 * dirt, 0, 1)
img = bpy.data.images.new('scheibe_rgba', N, N, alpha=True); img.pixels[:] = rgba.ravel(); img.filepath_raw = os.path.join(STEM, 'wrack_scheibe.png'); img.file_format = 'PNG'; img.save()
sm = bpy.data.materials.new('wrack_scheibe'); sm.use_nodes = True; nt = sm.node_tree; bs = nt.nodes['Principled BSDF']; ti = nt.nodes.new('ShaderNodeTexImage'); ti.image = img
nt.links.new(ti.outputs[0], bs.inputs['Base Color']); nt.links.new(ti.outputs['Alpha'], bs.inputs['Alpha']); bs.inputs['Roughness'].default_value = .12
try: sm.surface_render_method = 'BLENDED'
except Exception: pass
try: sm.blend_method = 'BLEND'
except Exception: pass
sm.use_backface_culling = False; set_mat(scheibe, sm); smooth(scheibe, 60)
export(OUT, [W, scheibe] + EMP)
