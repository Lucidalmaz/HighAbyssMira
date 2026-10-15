# Kuh (Holstein-Friesian) - anatomischer Eigenbau fuer High Abyss Mira (15.10.2026), ersetzt das 3-k-Dreieck-Modell assets/cow/cow.glb
#   blender --background --factory-startup --python kuh_bau.py -- <ausgabeordner>
# Ergebnis: kuh.glb (1 Haut, Armatur mit den Knochennamen des alten Modells: DEF-spine..011, DEF-thigh/shin/foot.L/R, DEF-front_*, DEF-tail*, DEF-ear.*;
#           kino.js/index_base.html knicken diese Knochen fuer den Sturz), 1 Material (Farbe + Normalenkarte 1024), Clips Idle (Atmen, Schwanz, Ohr).
# Entwurfskoordinaten (Meter): x seitlich, f vorwaerts (Kopf +), z oben. Blender: Vorwaerts = -Y -> glTF +Z.
# Anatomie (Hausrind, Widerristhoehe 1,45 m): Becken mit Hueftbuckeln, Wamme, Brustkorb mit Triefel, Hinterbein mit Sprunggelenk (Hacke), Vorderbein mit Karpalgelenk,
# gespaltene Klauen, Euter mit 4 Zitzen, Schwanzquaste, Hornlose Stirn, Flotzmaul mit Nasenloechern, Ohren waagerecht, Fell mit Haarstruktur, Holstein-Scheckung.
import bpy, bmesh, math, sys, os
import numpy as np
from mathutils import Vector, Quaternion

OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else r'C:\Users\GIGABYTE\HAM_Kuh'
os.makedirs(OUT, exist_ok=True)
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
rng = np.random.default_rng(1511)
def MARK(t):
    with open(os.path.join(OUT, 'prog.txt'), 'a') as _f: _f.write(t + chr(10))
def Pb(x, f, z): return Vector((float(x), -float(f), float(z)))
def V3(t): return np.array(t, float)

bm = bmesh.new(); UVL = bm.loops.layers.uv.new('UVMap'); TAG = bm.verts.layers.int.new('tag')
TAGS = {'body': 1, 'head': 2, 'legF': 3, 'legH': 4, 'tail': 5, 'ear': 6, 'misc': 7, 'udder': 8}
# Atlas (v nach oben): Rumpf+Kopf Schleife u 0..1, v 0.30..1 | Beine (4 geteilt) x 0..0.5, v 0..0.30 | Rest x 0.5..1, v 0..0.30
SOLID = {'klaue': (0.58, 0.05), 'euter': (0.66, 0.05), 'dunkel': (0.74, 0.05), 'zitze': (0.82, 0.05), 'schwanz': (0.90, 0.05), 'ohrin': (0.58, 0.20), 'nase': (0.70, 0.20), 'weiss': (0.82, 0.20)}
def addv(p, tag): v = bm.verts.new(Pb(*p)); v[TAG] = TAGS[tag]; return v
def addface(vs, uvs, flip=False):
    if flip: vs = vs[::-1]; uvs = uvs[::-1]
    try: f = bm.faces.new(vs)
    except ValueError: return None
    for l, uv in zip(f.loops, uvs): l[UVL].uv = uv
    return f

def loft(secs, n, tag, uv0, uv1, cap_a=True, cap_b=True, flip=False, solid=None, capcol=None):
    """secs: Liste (f, zc, rx, rz, xc, dz) -> Ringe (Ellipsen), u um den Ring, v entlang."""
    rings = []; L = [0.0]
    for i in range(1, len(secs)): L.append(L[-1] + math.hypot(secs[i][0] - secs[i - 1][0], secs[i][1] - secs[i - 1][1]) + 1e-6)
    for (f, zc, rx, rz, xc) in [s[:5] for s in secs]:
        rings.append([addv((xc + rx * math.sin(2 * math.pi * j / n), f, zc + rz * math.cos(2 * math.pi * j / n)), tag) for j in range(n)])
    for i in range(len(rings) - 1):
        va = uv0[1] + (uv1[1] - uv0[1]) * L[i] / L[-1]; vb = uv0[1] + (uv1[1] - uv0[1]) * L[i + 1] / L[-1]
        for j in range(n):
            a, b = rings[i][j], rings[i][(j + 1) % n]; c, d = rings[i + 1][(j + 1) % n], rings[i + 1][j]
            u0 = uv0[0] + (uv1[0] - uv0[0]) * j / n; u1 = uv0[0] + (uv1[0] - uv0[0]) * (j + 1) / n
            addface([a, b, c, d], [SOLID[solid]] * 4 if solid else [(u0, va), (u1, va), (u1, vb), (u0, vb)], flip=not flip)
    for ring, ex, ci, sgn in ((rings[0], secs[0], 0, -1), (rings[-1], secs[-1], len(secs) - 1, 1)):
        if (ci == 0 and not cap_a) or (ci > 0 and not cap_b): continue
        cen = addv((ex[4], ex[0] + sgn * ex[2] * 0.0 + (ex[5] if len(ex) > 5 else 0.0), ex[1]), tag)
        vv = uv0[1] if ci == 0 else uv1[1]
        for j in range(n):
            u0 = uv0[0] + (uv1[0] - uv0[0]) * j / n; u1 = uv0[0] + (uv1[0] - uv0[0]) * (j + 1) / n
            addface([ring[j], ring[(j + 1) % n], cen], [SOLID[solid]] * 3 if solid else ([SOLID[capcol[0] if ci == 0 else capcol[1]]] * 3 if capcol else [(u0, vv), (u1, vv), ((u0 + u1) / 2, vv)]), flip=(sgn > 0) != flip)
    return rings

def catmull(pts, per=6):
    pts = [V3(p) for p in pts]; out = []
    P = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(per):
            t = k / per; out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(pts[-1]); return out
def lerp_r(keys, per, total_pts):
    """Radien an Schluesselpunkten (je Segment 'per' Proben) interpoliert."""
    r = []
    for i in range(len(keys) - 1):
        for k in range(per): r.append(keys[i] + (keys[i + 1] - keys[i]) * (k / per))
    r.append(keys[-1]); return r
def tube(keypts, keyr, sides, tag, uvrect, per=5, flatx=1.0, cap_end=True, solid=None, cap_start=False):
    pts = catmull(keypts, per); radii = lerp_r(keyr, per, len(pts)); n = len(pts); rings = []
    for i in range(n):
        t = pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]; t = t / np.linalg.norm(t)
        r = V3((0, 1, 0)) if abs(t[1]) < 0.9 else V3((1, 0, 0))
        nn = np.cross(t, r); nn /= np.linalg.norm(nn); bb = np.cross(t, nn)
        rings.append([addv(pts[i] + radii[i] * (math.cos(2 * math.pi * k / sides) * nn * flatx + math.sin(2 * math.pi * k / sides) * bb), tag) for k in range(sides)])
    for i in range(n - 1):
        va = uvrect[1] + (uvrect[3] - uvrect[1]) * i / (n - 1); vb = uvrect[1] + (uvrect[3] - uvrect[1]) * (i + 1) / (n - 1)
        for k in range(sides):
            a, b = rings[i][k], rings[i][(k + 1) % sides]; c, d = rings[i + 1][(k + 1) % sides], rings[i + 1][k]
            if solid: uv = [SOLID[solid]] * 4
            else:
                u0 = uvrect[0] + (uvrect[2] - uvrect[0]) * k / sides; u1 = uvrect[0] + (uvrect[2] - uvrect[0]) * (k + 1) / sides
                uv = [(u0, va), (u1, va), (u1, vb), (u0, vb)]
            addface([a, b, c, d], uv)
    for ring, end, ext in ((rings[-1], pts[-1], pts[-1] - pts[-2]), (rings[0], pts[0], pts[0] - pts[1])):
        if (ring is rings[-1] and not cap_end) or (ring is rings[0] and not cap_start): continue
        ext = ext / np.linalg.norm(ext); r_ = radii[-1] if ring is rings[-1] else radii[0]
        tip = addv(end + ext * r_ * 0.6, tag); uvp = SOLID[solid] if solid else (uvrect[0] + (uvrect[2] - uvrect[0]) / 2, uvrect[3] if ring is rings[-1] else uvrect[1])
        for k in range(sides): addface([ring[k], ring[(k + 1) % sides], tip], [uvp] * 3, flip=(ring is rings[-1]) is False)
    return rings

# ------------------------------------------------------------------ Rumpf + Hals + Kopf (eine Schleife, Ellipsen: f, oben, unten, halbe Breite)
def S(f, top, bot, hw, xc=0.0, dz=0.0): return (f, (top + bot) / 2, hw, (top - bot) / 2, xc, dz)
SEC = [S(-1.12, 1.20, 1.04, .09, 0, -.05), S(-1.07, 1.30, .98, .165), S(-0.97, 1.36, .86, .245), S(-0.84, 1.425, .76, .295), S(-0.62, 1.385, .66, .31), S(-0.36, 1.335, .57, .33),
       S(-0.08, 1.315, .50, .345), S(0.20, 1.325, .52, .335), S(0.46, 1.375, .56, .305), S(0.70, 1.435, .62, .275), S(0.86, 1.475, .70, .235), S(1.02, 1.42, .74, .21),
       S(1.16, 1.355, .84, .175), S(1.32, 1.34, .90, .155), S(1.48, 1.30, .92, .145), S(1.58, 1.28, .90, .145),
       # Kopf: Genick, Stirn, Backen, Nasenruecken, Flotzmaul
       S(1.68, 1.29, .80, .155), S(1.78, 1.28, .75, .155), S(1.88, 1.215, .73, .135), S(1.98, 1.115, .73, .115), S(2.07, 1.03, .73, .105), S(2.15, .975, .74, .10), S(2.205, .945, .76, .082, 0, .035)]
BODY_N = 20
body_rings = loft(SEC, BODY_N, 'body', (0.0, 0.34), (1.0, 1.0), capcol=('weiss', 'nase'))
# Kopf-Hinterteil gehoert zur Kopfgruppe (Gewichte): Ringe ab f >= 1.58 spaeter per Koordinate

# ------------------------------------------------------------------ Beine
LEGX_F, LEGX_H = 0.185, 0.19
def leg(sg, front):
    X = lambda p: (p[0] * sg, p[1], p[2])
    if front:
        keys = [(.18, .72, 1.12), (.17, .70, .78), (.16, .66, .52), (.14, .735, .31), (.142, .745, .135), (.145, .775, .06), (.145, .79, .012)]
        rad = [.130, .105, .082, .062, .052, .058, .052]
        tag = 'legF'
    else:
        keys = [(.20, -.84, 1.12), (.20, -.62, .86), (.18, -.78, .55), (.16, -1.0, .47), (.158, -.97, .27), (.155, -.93, .115), (.155, -.90, .055), (.155, -.87, .012)]
        rad = [.160, .130, .095, .072, .050, .046, .054, .050]
        tag = 'legH'
    rect = (0.0 if front else 0.25, 0.01, 0.25 if front else 0.5, 0.29)
    pts = [X(k) for k in keys]
    tube(pts, rad, 12, tag, rect, per=5, flatx=0.9)
    # Klauen: zwei Keile (gespalten), leicht nach vorn spitz
    bx, bf, bz = pts[-1]
    for dx in (-.0135, .0135):
        base = V3((bx + dx, bf, bz + .045)); tip = V3((bx + dx, bf + .035, bz + .006))
        tube([base, V3((bx + dx, bf + .014, bz + .022)), tip], [.030, .032, .025], 7, 'misc', (0, 0, 0, 0), per=2, solid='klaue')
for sg in (1, -1):
    leg(sg, True); leg(sg, False)

# ------------------------------------------------------------------ Schwanz (Rute mit Quaste)
tube([(0.0, -1.12, 1.27), (0.0, -1.19, 1.20), (0.0, -1.22, 0.98), (0.0, -1.24, 0.72), (0.0, -1.23, 0.50), (0.0, -1.22, 0.36), (0.0, -1.22, 0.14)],
     [.034, .026, .019, .015, .013, .028, .024], 8, 'tail', (0.94, 0.01, 1.0, 0.29), per=4, cap_end=True)

# ------------------------------------------------------------------ Euter mit Zitzen
ud = [S(-0.80, .70, .50, .035, 0, -.03), S(-0.72, .66, .40, .085), S(-0.62, .62, .34, .105), S(-0.52, .62, .38, .095), S(-0.44, .64, .47, .045, 0, .03)]
loft([(f, zc, rx, rz, 0.0, dz) for (f, zc, rx, rz, xc, dz) in ud], 10, 'udder', (0, 0, 0, 0), (0, 0, 0, 0), solid='euter')
# UV der Euterflaeche: auf Einzelfarbe setzen (nachtraeglich unten)
for (xx, ff) in ((.045, -.56), (-.045, -.56), (.045, -.68), (-.045, -.68)):
    tube([(xx, ff, .46), (xx, ff, .40), (xx, ff + .004, .35)], [.016, .014, .011], 6, 'misc', (0, 0, 0, 0), per=2, solid='zitze')

# ------------------------------------------------------------------ Ohren, Augen, Nasenloecher
def shell(origin, U, Nn, Wd, Hh, wmax, cup, nA, nB, tag, uvbox, solid=None):
    grid = []
    for ib in range(nB + 1):
        b = ib / nB; w = wmax * (math.sqrt(max(0.0, 1 - ((b - 0.35) / 0.65) ** 2)) ** 0.8 if b > .35 else (0.55 + 0.45 * b / .35)); row = []
        for ia in range(nA + 1):
            a = -1 + 2 * ia / nA
            row.append(addv(origin + U * (b * Hh) + Wd * (a * w) + Nn * (cup * (a * a) * (0.4 + 0.6 * b)), tag))
        grid.append(row)
    for ib in range(nB):
        for ia in range(nA):
            uv = lambda a_, b_: SOLID[solid] if solid else (uvbox[0] + (uvbox[2] - uvbox[0]) * a_ / nA, uvbox[1] + (uvbox[3] - uvbox[1]) * b_ / nB)
            addface([grid[ib][ia], grid[ib][ia + 1], grid[ib + 1][ia + 1], grid[ib + 1][ia]], [uv(ia, ib), uv(ia + 1, ib), uv(ia + 1, ib + 1), uv(ia, ib + 1)])
for sg in (1, -1):
    U = V3((0.94 * sg, -0.30, -0.10)); U /= np.linalg.norm(U)               # Ohr zeigt waagerecht nach aussen/hinten
    Nn = V3((0.0, 0.2, 1.0)); Nn -= U * np.dot(Nn, U); Nn /= np.linalg.norm(Nn)
    Wd = np.cross(U, Nn); Wd /= np.linalg.norm(Wd)
    shell(V3((0.06 * sg, 1.665, 1.255)), U, Nn, Wd, 0.20, 0.055, 0.018, 5, 8, 'ear', (0.52, 0.09, 0.93, 0.17))
    shell(V3((0.06 * sg, 1.665, 1.255)) + Nn * 0.002, U, -Nn, -Wd, 0.19, 0.050, 0.014, 4, 6, 'misc', None, solid='ohrin')
    # Auge (Kugel) mit Lid
    c = V3((0.128 * sg, 1.845, 1.075)); r = .0245
    ex = [[addv(c + V3((r * math.sin(th) * math.cos(ph) * 0.9, r * math.cos(th) * 0.95, r * math.sin(th) * math.sin(ph))), 'misc') for ph in np.linspace(0, 2 * math.pi, 10, endpoint=False)] for th in (math.pi * .2, math.pi * .45, math.pi * .7)]
    cap = addv(c + V3((0, r * 0.95, 0)), 'misc'); uu = SOLID['dunkel']
    for k in range(10):
        k2 = (k + 1) % 10
        addface([ex[0][k], ex[0][k2], cap], [uu] * 3, flip=(sg > 0)); addface([ex[0][k], ex[1][k], ex[1][k2], ex[0][k2]], [uu] * 4, flip=(sg > 0)); addface([ex[1][k], ex[2][k], ex[2][k2], ex[1][k2]], [uu] * 4, flip=(sg > 0))
    # Nasenloch
    nc = V3((0.036 * sg, 2.20, .885)); rr = .018
    nr = [[addv(nc + V3((rr * math.sin(th) * math.cos(ph) * 0.7, rr * math.cos(th) * 0.5, rr * math.sin(th) * math.sin(ph) * 1.1)), 'misc') for ph in np.linspace(0, 2 * math.pi, 7, endpoint=False)] for th in (math.pi * .3, math.pi * .7)]
    nap = addv(nc + V3((0, rr * .5, 0)), 'misc'); uu = SOLID['nase']
    for k in range(7):
        k2 = (k + 1) % 7; addface([nr[0][k], nr[0][k2], nap], [uu] * 3, flip=(sg > 0)); addface([nr[0][k], nr[1][k], nr[1][k2], nr[0][k2]], [uu] * 4, flip=(sg > 0))

bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='BEAUTY', ngon_method='BEAUTY')
MARK('vor: bm.verts.index_update(); VTAGS')
bm.verts.index_update(); VTAGS = [v[TAG] for v in bm.verts]
mesh = bpy.data.meshes.new('Kuh'); bm.to_mesh(mesh); bm.free()
ob = bpy.data.objects.new('Kuh', mesh); bpy.context.scene.collection.objects.link(ob)
print('INFO Dreiecke', len(mesh.polygons), 'Vertices', len(mesh.vertices))

# ------------------------------------------------------------------ Armatur
arm_d = bpy.data.armatures.new('KuhRig'); arm = bpy.data.objects.new('KuhRig', arm_d); bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
BONES = {}
def bone(name, h, t, parent=None):
    eb = arm_d.edit_bones.new(name); eb.head = Pb(*h); eb.tail = Pb(*t)
    if parent: eb.parent = arm_d.edit_bones[parent]
    BONES[name] = (V3(h), V3(t))
SP = [(-1.02, 1.25), (-0.80, 1.30), (-0.52, 1.33), (-0.20, 1.31), (0.12, 1.33), (0.46, 1.36), (0.80, 1.40), (1.05, 1.38), (1.28, 1.33), (1.50, 1.28), (1.68, 1.24), (1.92, 1.13), (2.20, .96)]
names = ['DEF-spine'] + ['DEF-spine.%03d' % i for i in range(1, 12)]
for i, n in enumerate(names): bone(n, (0, SP[i][0], SP[i][1]), (0, SP[i + 1][0], SP[i + 1][1]), names[i - 1] if i else None)
bone('DEF-pelvis.L', (0.1, -0.86, 1.15), (0.2, -0.84, 1.0), 'DEF-spine.001')
for sg, n in ((1, 'L'), (-1, 'R')):
    X = lambda p: tuple(V3((p[0] * sg, p[1], p[2])))
    bone('DEF-thigh.' + n, X((.20, -.84, 1.12)), X((.20, -.62, .86)), 'DEF-spine.001'); bone('DEF-shin.' + n, X((.20, -.62, .86)), X((.16, -1.0, .47)), 'DEF-thigh.' + n)
    bone('DEF-foot.' + n, X((.16, -1.0, .47)), X((.155, -.87, .012)), 'DEF-shin.' + n)
    bone('DEF-front_thigh.' + n, X((.18, .72, 1.12)), X((.17, .70, .78)), 'DEF-spine.005'); bone('DEF-front_shin.' + n, X((.17, .70, .78)), X((.14, .735, .31)), 'DEF-front_thigh.' + n)
    bone('DEF-front_foot.' + n, X((.14, .735, .31)), X((.145, .79, .012)), 'DEF-front_shin.' + n)
    bone('DEF-ear.' + n, X((.06, 1.665, 1.255)), X((.30, 1.58, 1.22)), 'DEF-spine.009')
tp = [(-1.12, 1.27), (-1.20, 1.20), (-1.22, .98), (-1.24, .72), (-1.23, .50), (-1.22, .12)]
tn = ['DEF-tail', 'DEF-tail.001', 'DEF-tail.002', 'DEF-tail.003', 'DEF-tail.004']
for i, n in enumerate(tn): bone(n, (0, tp[i][0], tp[i][1]), (0, tp[i + 1][0], tp[i + 1][1]), tn[i - 1] if i else 'DEF-spine')
bpy.ops.object.mode_set(mode='OBJECT')
def seg_dist(p, a, b):
    ab = b - a; t = np.clip(np.dot(p - a, ab) / max(np.dot(ab, ab), 1e-12), 0, 1); return np.linalg.norm(p - (a + ab * t))
spineB = [n for n in BONES if n.startswith('DEF-spine')]
def allowed(tag, p):
    if tag in (1, 8): return spineB
    if tag == 2: return [n for n in spineB if n in ('DEF-spine.008', 'DEF-spine.009', 'DEF-spine.010', 'DEF-spine.011', 'DEF-spine.007')]
    if tag == 3: return [n for n in BONES if 'front_' in n and n.endswith('.L' if p[0] > 0 else '.R')] + ['DEF-spine.005', 'DEF-spine.004', 'DEF-spine.006']
    if tag == 4: return [n for n in BONES if n.split('.')[0] in ('DEF-thigh', 'DEF-shin', 'DEF-foot') and n.endswith('.L' if p[0] > 0 else '.R')] + ['DEF-spine', 'DEF-spine.001', 'DEF-spine.002']
    if tag == 5: return tn + ['DEF-spine']
    if tag == 6: return ['DEF-ear.L' if p[0] > 0 else 'DEF-ear.R', 'DEF-spine.009']
    # misc: Euter -> Wirbel, Klauen -> naechstes Bein, Auge/Nase -> Kopf
    if p[1] > 1.5: return ['DEF-spine.009', 'DEF-spine.010', 'DEF-spine.011']
    if p[2] < .2: return [n for n in BONES if ('foot' in n) and n.endswith('.L' if p[0] > 0 else '.R')]
    if p[2] > .8 and p[1] > 1.4: return ['DEF-spine.009']
    return spineB
for n in BONES: ob.vertex_groups.new(name=n)
for v in mesh.vertices:
    p = V3((v.co.x, -v.co.y, v.co.z)); tg = VTAGS[v.index]
    if tg == 1 and p[1] > 1.5: tg = 2        # Genick/Kopf der Schleife
    names_ = allowed(tg, p)
    ds = sorted(((seg_dist(p, BONES[n][0], BONES[n][1]), n) for n in names_))[:3]
    ws = [1.0 / (d + 0.02) ** 3 for d, n in ds]; s = sum(ws)
    for (d, n), w in zip(ds, ws): ob.vertex_groups[n].add([v.index], w / s, 'REPLACE')
ob.parent = arm; md = ob.modifiers.new('Armature', 'ARMATURE'); md.object = arm
for p in mesh.polygons: p.use_smooth = True

MARK('vor: # ----------------------------')
# ------------------------------------------------------------------ Texturen (numpy): Farbe + Normalenkarte, 1024
N = 1024
def smooth(e0, e1, x): t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
def gblur(a, sx, sy):
    fy = np.fft.fftfreq(a.shape[0])[:, None]; fx = np.fft.fftfreq(a.shape[1])[None, :]
    return np.real(np.fft.ifft2(np.fft.fft2(a) * np.exp(-2 * (math.pi ** 2) * ((sx * fx) ** 2 + (sy * fy) ** 2))))
def norm01(a): a = a - a.mean(); return a / (a.std() + 1e-9)
col = np.zeros((N, N, 3), np.float32); hgt = np.zeros((N, N), np.float32)
# --- Rumpf/Kopf: Bildzeilen y = 0..N*0.66 (oben = v 1)  -> v 0.34..1.0 ; als Array-Zeilen von unten gezaehlt: y0 = int(0.34*N)
y0 = int(0.34 * N); H = N - y0; W = N
uu = (np.arange(W) + .5)[None, :] / W; vv = (np.arange(H) + .5)[:, None] / H          # vv 0 = Rumpf hinten, 1 = Nase
# Entlang f: Schleife-Laenge 3,32 m ueber 678 px, um: 2,0 m ueber 1024 px -> Rauschen in Zeilenrichtung gestreckt
big = norm01(gblur(rng.standard_normal((H, W)), 44, 18)); mid = norm01(gblur(rng.standard_normal((H, W)), 10, 4.5)); fine = norm01(gblur(rng.standard_normal((H, W)), 2.2, 1.1))
hair = norm01(gblur(rng.standard_normal((H, W)), 0.9, 2.6)) * .5; hair2 = norm01(gblur(rng.standard_normal((H, W)), 0.6, 1.2))
fld = big * 1.0 + mid * 0.38 + fine * 0.10
dist_top = np.minimum(uu, 1 - uu)                                       # 0 = Rueckenlinie, 0.5 = Bauchlinie
fld = fld - 0.9 * smooth(.30, .5, dist_top) * smooth(.15, .45, vv) * (1 - smooth(.78, .85, vv))      # Bauch weiss
fld += 1.2 * smooth(.84, .90, vv)                                       # Kopf dunkel
blaze = np.exp(-(dist_top / 0.05) ** 2) * smooth(.86, .92, vv) * (1 - smooth(.96, 1.0, vv))
fld -= 3.0 * blaze                                                      # weisse Blesse
fld -= 1.6 * smooth(.93, 1.0, vv) * smooth(.15, .30, dist_top)          # Flotzmaul seitlich heller
fld -= 0.5 * smooth(.0, .06, vv) * 0                                    # (Rumpfende bleibt)
black = smooth(0.02, 0.22, fld)                                         # 1 = schwarz
WHITE = V3((.80, .78, .73)); BLACK = V3((.035, .034, .038)); BRN = V3((.12, .075, .052))
base = WHITE[None, None, :] * (1 - black[..., None]) + BLACK[None, None, :] * black[..., None]
# Fellstruktur: Haare, leichter Braunstich an Fleckenraendern (Sonnenbleiche), Schmutz am Bauch/unten
edge = np.exp(-((fld - 0.24) / 0.10) ** 2)
base = base * (1 + (0.07 * hair + 0.04 * hair2 + 0.04 * fine)[..., None] * (0.5 + 0.8 * (1 - black[..., None] * 0.6)))
base += (BRN - BLACK)[None, None, :] * (edge * .55 * black)[..., None]
dirt = np.clip(0.5 + 0.5 * norm01(gblur(rng.standard_normal((H, W)), 6, 3)), 0, 1) * smooth(.30, .5, dist_top) * 0.45
base = base * (1 - dirt[..., None]) + np.array([.34, .27, .20])[None, None, :] * dirt[..., None] * (1 - black[..., None] * .8) + base * dirt[..., None] * black[..., None]
mz = smooth(.96, 1.0, vv) * smooth(.20, .08, dist_top)                  # Flotzmaul: rosa-grau
mz += 0.0
base = base * (1 - mz[..., None] * .85) + np.array([.30, .20, .19])[None, None, :] * mz[..., None] * .85
col[y0:N, 0:W] = np.clip(base, 0.01, 1); hgt[y0:N, 0:W] = 0.5 * hair + 0.2 * hair2 + 0.15 * fine
# --- Beine: x 0..0.5N (Vorderbein), 0.25..0.5 auch fuer Hinterbein genutzt; Zeilen 0..0.30N, v 0 = Oberschenkel, 1 = Klaue (Array-Zeile 0 = unten = v 0)
LH = int(0.30 * N); LW = N // 2
lu = (np.arange(LW) + .5)[None, :] / LW; lv = (np.arange(LH) + .5)[:, None] / LH
lbig = norm01(gblur(rng.standard_normal((LH, LW)), 16, 5)); lh = norm01(gblur(rng.standard_normal((LH, LW)), 0.7, 2.4)); lf = norm01(gblur(rng.standard_normal((LH, LW)), 1.6, 1.0))
lblack = smooth(0.55, 0.9, lbig - 1.0 * (1 - smooth(.05, .5, lv)) * 0.0 + .6 * (1 - lv) - 0.0) * (1 - smooth(.25, .5, lv))   # nur oben am Oberschenkel schwarz moeglich
leg = WHITE[None, None, :] * (1 - lblack[..., None]) + BLACK[None, None, :] * lblack[..., None]
leg = leg * (1 + (0.10 * lh + 0.05 * lf)[..., None])
mud = np.clip(0.5 + .5 * lbig, 0, 1) * smooth(.45, .95, lv) * .5                                     # Dreck an den Fesseln
leg = leg * (1 - mud[..., None]) + np.array([.30, .24, .18])[None, None, :] * mud[..., None]
col[0:LH, 0:LW] = np.clip(leg, 0.01, 1); hgt[0:LH, 0:LW] = 0.4 * lh + 0.15 * lf
# Einzelfarben und Ohr/Schwanz (x 0.5..1, Zeilen 0..0.30N)
col[0:LH, N // 2:N] = np.array([.10, .09, .09])                    # Ohr aussen dunkel, Einzelfarben
tl = norm01(gblur(rng.standard_normal((LH, N // 16)), 1.0, 3.0))
col[0:LH, int(.94 * N):N] = np.clip(WHITE[None, None, :] * (1 + 0.08 * tl[..., None]), .01, 1)[:, :N - int(.94 * N)]   # Rute weiss mit Haarstruktur
ea = norm01(gblur(rng.standard_normal((LH, N // 2)), 1.0, 2.0)); col[0:LH, N // 2:int(.93 * N)] *= (1 + .10 * ea[:, :int(.93 * N) - N // 2, None])
def patch_solid(name, c):
    u, v = SOLID[name]; x, y = int(u * N), int(v * N); col[max(0, y - 14):y + 14, x - 30:x + 30] = V3(c); hgt[max(0, y - 14):y + 14, x - 30:x + 30] = 0
patch_solid('klaue', (.045, .04, .04)); patch_solid('euter', (.55, .38, .36)); patch_solid('dunkel', (.006, .005, .006)); patch_solid('zitze', (.50, .33, .32))
patch_solid('schwanz', (.80, .78, .73)); patch_solid('ohrin', (.42, .28, .26)); patch_solid('nase', (.05, .03, .03)); patch_solid('weiss', (.8, .78, .73))
# Normalenkarte
gy, gx = np.gradient(gblur(hgt, .6, .6)); k = 2.5
nrm = np.stack([-gx * k, -gy * k, np.ones_like(gx)], -1); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
nimg = (nrm * .5 + .5).astype(np.float32)
import zlib, struct
def write_png(path, arr):
    a8 = (np.clip(arr, 0, 1) * 255 + .5).astype(np.uint8)[::-1]
    raw = b''.join(b'\x00' + a8[y].tobytes() for y in range(a8.shape[0]))
    def ch(t, d): c = struct.pack('>I', len(d)) + t + d; return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    with open(path, 'wb') as f: f.write(b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', a8.shape[1], a8.shape[0], 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw, 6)) + ch(b'IEND', b''))
def save_img(name, arr):
    pth = os.path.join(OUT, name + '.png'); write_png(pth, arr); return bpy.data.images.load(pth)
MARK('vor: imc = save_img')
imc = save_img('kuh_farbe', col); imn = save_img('kuh_normal', nimg)
imc.colorspace_settings.name = 'sRGB'; imn.colorspace_settings.name = 'Non-Color'
imc.pack(); imn.pack()
MARK('vor: mat = bpy.data.materials.new(')
mat = bpy.data.materials.new('Kuh'); mat.use_nodes = True; nt = mat.node_tree; bsdf = nt.nodes['Principled BSDF']
tc = nt.nodes.new('ShaderNodeTexImage'); tc.image = imc; tnn = nt.nodes.new('ShaderNodeTexImage'); tnn.image = imn
nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 1.0
nt.links.new(tc.outputs['Color'], bsdf.inputs['Base Color']); nt.links.new(tnn.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
bsdf.inputs['Roughness'].default_value = .62
ob.data.materials.append(mat)

# ------------------------------------------------------------------ Animation: Idle (Atmen, Schwanzschlag, Ohrzucken, Kopf senken)
scn = bpy.context.scene; scn.render.fps = 30
bpy.context.view_layer.objects.active = arm
def axis_local(bname, wax): M = arm_d.bones[bname].matrix_local.to_3x3(); return (M.inverted() @ Vector(wax)).normalized()
AX_X, AX_Y, AX_Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
def pose_frame(fr, P):
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'; q = Quaternion((1, 0, 0, 0))
        for ax, a in P.get(pb.name, []): q = Quaternion(axis_local(pb.name, ax), math.radians(a)) @ q
        pb.rotation_quaternion = q; pb.location = Vector((0, 0, 0))
        pb.keyframe_insert('rotation_quaternion', frame=fr); pb.keyframe_insert('location', frame=fr)
def idle(ph):
    T = 2 * math.pi; s, c = math.sin(T * ph), math.cos(T * ph); P = {}
    P['DEF-spine.003'] = [(AX_X, 0.8 * s)]; P['DEF-spine.004'] = [(AX_X, 0.8 * s)]
    for i, k in enumerate(('.008', '.009', '.010')): P['DEF-spine' + k] = [(AX_X, 3.0 * math.sin(T * ph - 0.6) * (0.5 if i == 0 else 1.0))]
    for i, n in enumerate(tn): P[n] = [(AX_Y, (6 + 3 * i) * math.sin(T * (ph * 2 - .12 * i)))]
    P['DEF-ear.L'] = [(AX_Z, 4 * math.sin(T * ph * 3))]; P['DEF-ear.R'] = [(AX_Z, -4 * math.sin(T * ph * 3 + 1.1))]
    return P
MARK('vor: arm.animation_data_create()')
arm.animation_data_create()
act = bpy.data.actions.new('Idle'); act.use_fake_user = True; arm.animation_data.action = act
for fr in range(0, 61, 5): pose_frame(fr, idle(fr / 60))
bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
MARK('vor: bpy.ops.wm.save_as_mainfile')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'kuh.blend'))
MARK('vor: bpy.ops.export_scene.gltf')
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'kuh.glb'), export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='ACTIONS',
                          export_force_sampling=True, export_frame_range=False, export_skins=True, export_normals=True, export_texcoords=True, export_materials='EXPORT',
                          export_yup=True, export_apply=False, export_def_bones=False, export_optimize_animation_size=False)
print('INFO export', os.path.join(OUT, 'kuh.glb'))
