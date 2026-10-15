# Fledermaus (Grosses Mausohr, Myotis myotis) - anatomischer Eigenbau fuer High Abyss Mira (15.10.2026)
#   blender --background --factory-startup --python fledermaus_bau.py -- <ausgabeordner>
# Ergebnis: fledermaus.glb (Haut + Armatur + Clips Flap/Glide, 1 Material, Textur 1024 Farbe + Normal), fledermaus.blend, Texturen als PNG.
# Entwurfskoordinaten: x seitlich (rechts +), f vorwaerts, z oben (Meter). Blender: Vorwaerts = -Y  ->  glTF +Z (Blickrichtung des Spiels).
# Anatomie (nach Maassen des Grossen Mausohrs): Unterarm 6 cm, Spannweite ca. 40 cm, Koerper 7 cm, Ohr 2,6 cm, Tragus lang und spitz;
# Haut: Propatagium (vor dem Arm), Plagiopatagium (Arm/5. Finger -> Flanke/Bein), Dactylopatagium (zwischen 3.-5. Finger, Hinterrand ausgebuchtet),
# Uropatagium (zwischen den Beinen, Sporn/Kalkar, Schwanz in der Haut), Daumen mit Kralle, vier verlaengerte Finger (Mittelhand + 2 Glieder).
import bpy, bmesh, math, sys, os
import numpy as np
from mathutils import Vector, Quaternion

OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else r'C:\Users\GIGABYTE\HAM_Fledermaus'
os.makedirs(OUT, exist_ok=True)
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
rng = np.random.default_rng(1510)
def Pb(x, f, z): return Vector((float(x), -float(f), float(z)))
def V3(t): return np.array(t, float)

# ------------------------------------------------------------------ Skelettpunkte (rechte Seite)
S_ = V3((0.012, 0.014, 0.003)); E_ = V3((0.046, 0.008, 0.003)); WR = V3((0.103, 0.030, 0.004)); TH = V3((0.112, 0.047, 0.004))
M3 = V3((0.148, 0.030, 0.003)); A3 = V3((0.186, 0.004, 0.002)); T3 = V3((0.208, -0.030, 0.000))
M4 = V3((0.140, 0.010, 0.003)); A4 = V3((0.168, -0.020, 0.002)); T4 = V3((0.180, -0.052, 0.000))
M5 = V3((0.124, -0.002, 0.003)); A5 = V3((0.142, -0.032, 0.002)); T5 = V3((0.150, -0.058, 0.000))
H_ = V3((0.010, -0.020, -0.004)); KN = V3((0.026, -0.038, -0.006)); AN = V3((0.030, -0.058, -0.004)); FT = V3((0.034, -0.070, -0.004))
TT = V3((0.0, -0.090, -0.003))
# Rumpf: (f, z-Mitte, halbe Breite, halbe Hoehe)
SEC = [(-0.036, -0.0010, .0040, .0036), (-0.028, -0.0006, .0075, .0066), (-0.016, 0.0, .0108, .0090), (-0.004, 0.0006, .0132, .0108), (0.008, 0.0012, .0136, .0112),
       (0.018, 0.0016, .0116, .0100), (0.025, 0.0020, .0090, .0084), (0.031, 0.0026, .0092, .0088), (0.038, 0.0028, .0110, .0096), (0.045, 0.0024, .0090, .0080),
       (0.051, 0.0016, .0076, .0068), (0.056, 0.0010, .0060, .0054), (0.060, 0.0005, .0046, .0042), (0.0625, 0.0003, .0026, .0026)]
def _fx(f): return f * 0.88 if f < 0 else (f if f < 0.031 else 0.031 + (f - 0.031) * 0.85)
SEC = [(_fx(f), z, rx, rz) for f, z, rx, rz in SEC]
DF = -0.0075   # Kopf-Verschiebung gegenueber dem ersten Entwurf (Ohren, Augen, Kopfknochen)

bm = bmesh.new(); UVL = bm.loops.layers.uv.new('UVMap'); TAG = bm.verts.layers.int.new('tag')
TAGS = {'body': 1, 'ear': 2, 'wing': 3, 'limb': 4, 'leg': 5, 'eye': 6}
# Atlas: Fell (0..0.5, 0.5..1) | Ohr (0.5..1, 0.5..1) | Flughaut (0..0.75, 0..0.5) | Einzelfarben (0.75..1, 0..0.5)
SOLID = {'dunkel': (0.80, 0.45), 'horn': (0.80, 0.33), 'nase': (0.80, 0.21), 'knochen': (0.80, 0.09), 'fussHaut': (0.90, 0.30)}
def mem_uv(x, f): return (0.02 + 0.71 * min(abs(x) / 0.225, 1.0), 0.5 * min(max((f + 0.105) / 0.185, 0), 1.0))
def addv(p, tag): v = bm.verts.new(Pb(*p)); v[TAG] = TAGS[tag]; return v
def addface(vs, uvs, flip=False):
    if flip: vs = vs[::-1]; uvs = uvs[::-1]
    try: f = bm.faces.new(vs)
    except ValueError: return None
    for l, uv in zip(f.loops, uvs): l[UVL].uv = uv
    return f

def tube(pts, radii, sides, tag, solid, cap_start=False, cap_end=True, ref=(0, 0, 1)):
    pts = [V3(p) for p in pts]; n = len(pts); rings = []
    for i in range(n):
        t = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]); t /= np.linalg.norm(t)
        r = V3(ref)
        if abs(np.dot(t, r)) > .9: r = V3((0, 1, 0))
        nn = np.cross(t, r); nn /= np.linalg.norm(nn); bb = np.cross(t, nn)
        rings.append([addv(pts[i] + radii[i] * (math.cos(2 * math.pi * k / sides) * nn + math.sin(2 * math.pi * k / sides) * bb), tag) for k in range(sides)])
    u, v = SOLID[solid]
    for i in range(n - 1):
        for k in range(sides):
            a, b = rings[i][k], rings[i][(k + 1) % sides]; c, d = rings[i + 1][(k + 1) % sides], rings[i + 1][k]
            addface([a, b, c, d], [(u, v)] * 4)
    if cap_end:
        t = pts[-1] - pts[-2]; t /= np.linalg.norm(t); tip = addv(pts[-1] + t * radii[-1] * 1.4, tag)
        for k in range(sides): addface([rings[-1][k], rings[-1][(k + 1) % sides], tip], [(u, v)] * 3)

# ------------------------------------------------------------------ Rumpf + Kopf (Querschnittsringe)
NSEG = 12
rings = []
for (f, zc, rx, rz) in SEC:
    rings.append([addv((rx * math.sin(2 * math.pi * j / NSEG), f, zc + rz * math.cos(2 * math.pi * j / NSEG)), 'body') for j in range(NSEG)])
f0, f1 = SEC[0][0], SEC[-1][0]
for i in range(len(rings) - 1):
    for j in range(NSEG):
        a, b = rings[i][j], rings[i][(j + 1) % NSEG]; c, d = rings[i + 1][(j + 1) % NSEG], rings[i + 1][j]
        u0, u1 = 0.5 * j / NSEG, 0.5 * (j + 1) / NSEG; va = .5 + .5 * (SEC[i][0] - f0) / (f1 - f0); vb = .5 + .5 * (SEC[i + 1][0] - f0) / (f1 - f0)
        addface([a, b, c, d], [(u0, va), (u1, va), (u1, vb), (u0, vb)], flip=True)
nose = addv((0, f1 + 0.0010, SEC[-1][1]), 'body')
for j in range(NSEG): addface([rings[-1][j], rings[-1][(j + 1) % NSEG], nose], [(.5 * j / NSEG, .99), (.5 * (j + 1) / NSEG, .99), (.25, 1.0)], flip=True)
rump = addv((0, f0 - 0.004, SEC[0][1]), 'body')
for j in range(NSEG): addface([rings[0][(j + 1) % NSEG], rings[0][j], rump], [(.5 * (j + 1) / NSEG, .5), (.5 * j / NSEG, .5), (.25, .5)], flip=True)

# ------------------------------------------------------------------ Ohren + Tragus + Augen
def shell(origin, U, Nn, Wd, Hh, wmax, cup, nA, nB, tag, uvbox=(0.5, 0.5, 1.0, 1.0), wfun=None):
    grid = []
    for ib in range(nB + 1):
        b = ib / nB
        w = wmax * (wfun(b) if wfun else math.sqrt(max(0.0, 1 - ((b - 0.30) / 0.70) ** 2)) ** 0.85)
        row = []
        for ia in range(nA + 1):
            a = -1 + 2 * ia / nA
            row.append(addv(origin + U * (b * Hh) + Wd * (a * w) + Nn * (cup * (a * a) * (0.4 + 0.6 * b) * (1 - 0.4 * b)), tag))
        grid.append(row)
    def uv(ia_, ib_): return (uvbox[0] + (uvbox[2] - uvbox[0]) * (0.05 + 0.9 * ia_ / nA), uvbox[1] + (uvbox[3] - uvbox[1]) * (0.04 + 0.92 * ib_ / nB))
    for ib in range(nB):
        for ia in range(nA):
            addface([grid[ib][ia], grid[ib][ia + 1], grid[ib + 1][ia + 1], grid[ib + 1][ia]], [uv(ia, ib), uv(ia + 1, ib), uv(ia + 1, ib + 1), uv(ia, ib + 1)])
for sgn in (1, -1):
    U = V3((0.40 * sgn, -0.14, 0.90)); U /= np.linalg.norm(U)
    Nn = V3((0.58 * sgn, 0.78, -0.12)); Nn -= U * np.dot(Nn, U); Nn /= np.linalg.norm(Nn)
    Wd = np.cross(Nn, U) * sgn; Wd /= np.linalg.norm(Wd)
    shell(V3((0.0085 * sgn, 0.0455 + DF, 0.0072)), U, Nn, Wd, 0.0285, 0.0082, 0.0034, 6, 10, 'ear', uvbox=(0.5, 0.5, 0.97, 0.97))
    Ut = V3((0.06 * sgn, 0.10, 1.0)); Ut /= np.linalg.norm(Ut); Nt = V3((0.8 * sgn, 0.6, 0)); Nt -= Ut * np.dot(Nt, Ut); Nt /= np.linalg.norm(Nt); Wt = np.cross(Nt, Ut) * sgn
    shell(V3((0.0098 * sgn, 0.0470 + DF, 0.0052)), Ut, Nt, Wt, 0.0105, 0.0016, 0.0006, 2, 4, 'ear', uvbox=(0.52, 0.52, 0.6, 0.6), wfun=lambda b: (1 - b) ** 0.9)
    cen = V3((0.0072 * sgn, 0.0505 + DF, 0.0050)); r = 0.0021; ring_n = 8
    ex = [[addv(cen + V3((r * math.sin(th) * math.cos(ph), r * math.cos(th) * 0.9, r * math.sin(th) * math.sin(ph))), 'eye') for ph in np.linspace(0, 2 * math.pi, ring_n, endpoint=False)] for th in (math.pi * .3, math.pi * .6)]
    cap = addv(cen + V3((0, r * 0.9, 0)), 'eye'); u, v = SOLID['dunkel']
    for k in range(ring_n):
        k2 = (k + 1) % ring_n
        addface([ex[0][k], ex[0][k2], cap], [(u, v)] * 3, flip=(sgn > 0)); addface([ex[0][k], ex[1][k], ex[1][k2], ex[0][k2]], [(u, v)] * 4, flip=(sgn > 0))

# ------------------------------------------------------------------ Flughaut (Felder als Parametergitter)
def lerp(a, b, t): return a + (b - a) * t
def poly_at(pts, s):
    L = [np.linalg.norm(pts[i + 1] - pts[i]) for i in range(len(pts) - 1)]; tot = sum(L); d = s * tot
    for i, l in enumerate(L):
        if d <= l + 1e-12 or i == len(L) - 1: return lerp(pts[i], pts[i + 1], min(1, d / l if l > 0 else 0))
        d -= l
def patch(PA, PB, ns, nt, sag, flipx, tag='wing', camber=0.0010, wrinkle=0.0004, sagpow=1.6):
    PA = [V3(p) for p in PA]; PB = [V3(p) for p in PB]; grid = []
    for i in range(ns + 1):
        s = i / ns; row = []
        for j in range(nt + 1):
            t = j / nt
            sg = s * (1 - sag * math.sin(math.pi * t) * (s ** sagpow))   # Ausbuchtung nach innen am Hinterrand
            p = lerp(poly_at(PA, sg), poly_at(PB, sg), t)
            p[2] += -camber * math.sin(math.pi * t) * math.sin(math.pi * min(1, s)) + wrinkle * math.sin(7 * s + 3 * t) * math.sin(math.pi * t)
            if flipx: p[0] = -p[0]
            row.append(p)
        grid.append(row)
    vg = [[addv(p, tag) for p in row] for row in grid]
    for i in range(ns):
        for j in range(nt):
            q = [vg[i][j], vg[i][j + 1], vg[i + 1][j + 1], vg[i + 1][j]]; pp = [grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]]
            uvs = [mem_uv(p[0], p[1]) for p in pp]
            nrm = np.cross(pp[1] - pp[0], pp[3] - pp[0])[2] + np.cross(pp[2] - pp[1], pp[3] - pp[1])[2]
            if np.linalg.norm(pp[0] - pp[1]) < 1e-6: q = [q[0], q[2], q[3]]; uvs = [uvs[0], uvs[2], uvs[3]]
            addface(q, uvs, flip=(nrm < 0))
for flip in (False, True):
    patch([S_, E_, WR, M5, A5, T5], [V3((0.0125, 0.012, 0.0)), V3((0.0112, -0.006, -0.003)), H_, KN, AN], 16, 6, 0.20, flip, camber=0.0016, sagpow=1.4)   # Plagiopatagium
    patch([WR, M5, A5, T5], [WR, M4, A4, T4], 10, 5, 0.34, flip, sagpow=1.2)                                                                                  # 4.-5. Finger
    patch([WR, M4, A4, T4], [WR, M3, A3, T3], 10, 5, 0.34, flip, sagpow=1.2)                                                                                  # 3.-4. Finger
    patch([S_, E_, WR], [V3((0.0105, 0.031, 0.0035)), V3((0.060, 0.022, 0.004)), V3((0.106, 0.044, 0.0045))], 5, 2, 0.0, flip, camber=0.0004)   # Propatagium
    patch([H_, KN, AN], [V3((0.0, -0.030, -0.003)), V3((0.0, -0.060, -0.003)), TT], 7, 5, 0.20, flip, camber=0.0008)                           # Uropatagium
# ------------------------------------------------------------------ Knochen: Arm, Finger, Daumen, Beine, Schwanz
for sg in (1, -1):
    X = lambda p: V3((p[0] * sg, p[1], p[2]))
    tube([X(S_), X(E_), X(WR)], [.0020, .0018, .0014], 5, 'limb', 'knochen')
    tube([X(WR), X(TH)], [.0012, .0009], 5, 'limb', 'knochen')
    tube([X(TH), X(TH) + V3((0.003 * sg, 0.004, 0.001))], [.0008, .0002], 4, 'limb', 'horn')
    for chain in ((M3, A3, T3), (M4, A4, T4), (M5, A5, T5)):
        tube([X(WR)] + [X(c) for c in chain], [.0012, .0010, .0008, .0004], 5, 'limb', 'knochen')
    tube([X(H_), X(KN), X(AN), X(FT)], [.0026, .0018, .0012, .0010], 5, 'leg', 'knochen')
    for k, (dx, df) in enumerate([(-.004, -.002), (-.002, -.006), (0.0, -.009), (.002, -.008), (.004, -.005)]):
        base = X(FT); b = base + V3((dx * sg, df, 0.0)) + V3((0.0015 * sg, -0.0045, 0))
        tube([base, b], [.0007, .0004], 4, 'leg', 'horn')
    tube([X(AN), V3((0.012 * sg, -0.072, -0.0035)), V3((0.0, -0.089, -0.003))], [.0007, .0005, .0003], 4, 'leg', 'knochen')
tube([V3((0, -0.034, -0.001)), V3((0, -0.060, -0.003)), V3((0, -0.084, -0.003))], [.0030, .0020, .0010], 6, 'leg', 'knochen')

bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='BEAUTY', ngon_method='BEAUTY')
bm.verts.index_update(); VTAGS = [v[TAG] for v in bm.verts]
mesh = bpy.data.meshes.new('Fledermaus'); bm.to_mesh(mesh); bm.free()
ob = bpy.data.objects.new('Fledermaus', mesh); bpy.context.scene.collection.objects.link(ob)
print('INFO Dreiecke', len(mesh.polygons), 'Vertices', len(mesh.vertices))

# ------------------------------------------------------------------ Armatur
arm_d = bpy.data.armatures.new('FledermausRig'); arm = bpy.data.objects.new('FledermausRig', arm_d); bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
BONES = {}
def bone(name, h, t, parent=None):
    eb = arm_d.edit_bones.new(name); eb.head = Pb(*h); eb.tail = Pb(*t)
    if parent: eb.parent = arm_d.edit_bones[parent]
    BONES[name] = (V3(h), V3(t))
bone('root', (0, -0.020, 0), (0, 0.005, 0.001))
bone('spine', (0, 0.005, 0.001), (0, 0.026, 0.002), 'root')
bone('head', (0, 0.026, 0.002), (0, 0.062, 0.0006), 'spine')
bone('tail', (0, -0.020, 0), (0, -0.090, -0.003), 'root')
for sg, n in ((1, 'R'), (-1, 'L')):
    X = lambda p: tuple(V3((p[0] * sg, p[1], p[2])))
    bone('hum_' + n, X(S_), X(E_), 'spine'); bone('fore_' + n, X(E_), X(WR), 'hum_' + n); bone('thumb_' + n, X(WR), X(TH), 'fore_' + n)
    for k, (m, a, t) in zip((3, 4, 5), ((M3, A3, T3), (M4, A4, T4), (M5, A5, T5))):
        bone(f'd{k}m_{n}', X(WR), X(m), 'fore_' + n); bone(f'd{k}a_{n}', X(m), X(a), f'd{k}m_{n}'); bone(f'd{k}b_{n}', X(a), X(t), f'd{k}a_{n}')
    bone('fem_' + n, X(H_), X(KN), 'root'); bone('tib_' + n, X(KN), X(AN), 'fem_' + n); bone('foot_' + n, X(AN), X(FT), 'tib_' + n)
    bone('ear_' + n, (0.0085 * sg, 0.0455 + DF, 0.0072), (0.0155 * sg, 0.0435 + DF, 0.0335), 'head')
bpy.ops.object.mode_set(mode='OBJECT')
body_set = ['root', 'spine', 'head', 'tail']
def seg_dist(p, a, b):
    ab = b - a; t = np.clip(np.dot(p - a, ab) / max(np.dot(ab, ab), 1e-12), 0, 1); return np.linalg.norm(p - (a + ab * t))
ALLOWED = {1: body_set, 2: ['head'] + [k for k in BONES if k.startswith('ear_')], 6: ['head'], 3: list(BONES), 4: list(BONES),
           5: [k for k in BONES if k.split('_')[0] in ('fem', 'tib', 'foot', 'root', 'tail', 'spine')]}
for n in BONES: ob.vertex_groups.new(name=n)
for v in mesh.vertices:
    p = V3((v.co.x, -v.co.y, v.co.z)); tg = VTAGS[v.index]; names = ALLOWED.get(tg, list(BONES))
    if tg == 0: print('WARN ungetaggt', v.index)
    ds = sorted(((seg_dist(p, BONES[n][0], BONES[n][1]), n) for n in names))[:3]
    ws = [1.0 / (d + 0.0015) ** 2.5 for d, n in ds]; s = sum(ws)
    for (d, n), w in zip(ds, ws): ob.vertex_groups[n].add([v.index], w / s, 'REPLACE')
ob.parent = arm; md = ob.modifiers.new('Armature', 'ARMATURE'); md.object = arm
for p in mesh.polygons: p.use_smooth = True

# ------------------------------------------------------------------ Texturen (numpy): Farbe + Normalenkarte, 1024
N = 1024
def smooth(e0, e1, x): t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
def gblur(a, sx, sy):
    fy = np.fft.fftfreq(a.shape[0])[:, None]; fx = np.fft.fftfreq(a.shape[1])[None, :]
    return np.real(np.fft.ifft2(np.fft.fft2(a) * np.exp(-2 * (math.pi ** 2) * ((sx * fx) ** 2 + (sy * fy) ** 2))))
def norm01(a): a = a - a.mean(); return a / (a.std() + 1e-9)
col = np.zeros((N, N, 3), np.float32); hgt = np.zeros((N, N), np.float32)
# Fell 512x512 bei x 0..511, y 512..1023 (y nach oben = v)
FN = 512
strand = norm01(gblur(rng.standard_normal((FN, FN)), .9, 10)); fine = norm01(gblur(rng.standard_normal((FN, FN)), .6, 3)); blotch = norm01(gblur(rng.standard_normal((FN, FN)), 30, 40))
uu = (np.arange(FN) + .5)[None, :] / FN; vv = (np.arange(FN) + .5)[:, None] / FN
dtop = np.minimum(uu, 1 - uu) * 2        # 0 oben (Ruecken) ... 1 unten (Bauch)
mixv = smooth(.30, .80, dtop) * np.ones((FN, 1))
dors = V3((.19, .135, .092)); tipc = V3((.34, .25, .17)); vent = V3((.50, .45, .39))
base = dors[None, None, :] * (1 - mixv[..., None]) + vent[None, None, :] * mixv[..., None]
tip = np.clip(0.5 + .5 * strand, 0, 1) ** 1.5 * (1 - mixv)
fur = base * (1 + .13 * strand[..., None] + .07 * fine[..., None] + .08 * blotch[..., None]) + (tipc - dors)[None, None, :] * tip[..., None] * .35
face = smooth(.80, .88, vv) * np.ones((1, FN)); skinc = V3((.065, .047, .042))
fur = fur * (1 - face[..., None] * .85) + skinc[None, None, :] * face[..., None] * .85 + 0.0
fur = np.clip(fur, 0.01, 1)
col[512:1024, 0:512] = fur; hgt[512:1024, 0:512] = .5 * strand + .25 * fine
# Flughaut 768x512 bei x 0..767, y 0..511
MW, MH = 768, 512
memb = np.ones((MH, MW, 3), np.float32) * V3((.155, .108, .078)); mh = np.zeros((MH, MW), np.float32)
mott = norm01(gblur(rng.standard_normal((MH, MW)), 18, 18)); fn2 = norm01(gblur(rng.standard_normal((MH, MW)), 2.5, 2.5))
memb *= (1 + .07 * mott[..., None] + .04 * fn2[..., None])
def to_px(x, f): u, v = mem_uv(x, f); return u * N, v * N
def stamp_line(img, p0, p1, width, colr, strength=1.0, hmap=None, hval=0.0):
    n = int(max(abs(p1[0] - p0[0]), abs(p1[1] - p0[1])) * 1.6) + 2; r = int(width) + 2
    for k in range(n):
        t = k / (n - 1); x = p0[0] + (p1[0] - p0[0]) * t; y = p0[1] + (p1[1] - p0[1]) * t
        x0, y0 = int(x), int(y)
        if x0 - r < 0 or y0 - r < 0 or x0 + r >= img.shape[1] or y0 + r >= img.shape[0]: continue
        ys, xs = np.mgrid[y0 - r:y0 + r + 1, x0 - r:x0 + r + 1]; wgt = np.exp(-(((xs - x) ** 2 + (ys - y) ** 2) / (2 * (width / 2.2) ** 2))) * strength
        img[y0 - r:y0 + r + 1, x0 - r:x0 + r + 1] = img[y0 - r:y0 + r + 1, x0 - r:x0 + r + 1] * (1 - wgt[..., None]) + V3(colr)[None, None, :] * wgt[..., None]
        if hmap is not None: hmap[y0 - r:y0 + r + 1, x0 - r:x0 + r + 1] += wgt * hval
# Adern: feine helle/dunkle Linien, fuer jede Felderreihe strahlenfoermig vom Handgelenk
wp = to_px(WR[0], WR[1])
for _ in range(110):
    ang = rng.uniform(-math.pi * .95, math.pi * .30); ln = rng.uniform(60, 280)
    a0 = np.array([wp[0] + rng.uniform(-10, 10), wp[1] + rng.uniform(-10, 10)]); p1 = a0 + ln * np.array([math.cos(ang), math.sin(ang)])
    stamp_line(memb, a0, p1, 2.4, (.095, .062, .046), .45, mh, -.25)
# Knochen (Linien, mit hellem Hof)
def bone_line(pts, w):
    P2 = [to_px(*p[:2]) for p in pts]
    for i in range(len(P2) - 1): stamp_line(memb, P2[i], P2[i + 1], w * 2.4, (.235, .165, .115), .55)
    for i in range(len(P2) - 1): stamp_line(memb, P2[i], P2[i + 1], w, (.075, .050, .040), .95, mh, .6)
bone_line([S_, E_, WR], 7); bone_line([WR, TH], 5)
for ch in ((M3, A3, T3), (M4, A4, T4), (M5, A5, T5)): bone_line([WR] + list(ch), 5)
bone_line([H_, KN, AN], 6); bone_line([AN, V3((0.012, -0.072, 0)), TT], 4)
# Flanke: Fellrand zur Koerpernaehe
xs_ = (np.arange(MW) + .5) / N; us = (xs_ - .02) / .71 * .225
fb = smooth(.040, .004, us)[None, :] * np.ones((MH, 1))
memb = memb * (1 - fb[..., None] * .8) + (dors * .8)[None, None, :] * fb[..., None] * .8
col[0:MH, 0:MW] = np.clip(memb, 0.01, 1); hgt[0:MH, 0:MW] = mh + .15 * fn2
# Ohr 512x512 bei x 512..1023, y 512..1023
ear = np.ones((512, 512, 3), np.float32) * V3((.205, .140, .110)); eh = np.zeros((512, 512), np.float32)
ear *= (1 + .10 * norm01(gblur(rng.standard_normal((512, 512)), 14, 14))[..., None])
for k in range(14):  # querlaufende Rippen
    y = 60 + k * 30
    xx = np.arange(512); yy = y + 25 * np.sin(xx / 512 * math.pi) * .5
    for x in range(30, 480, 2):
        yi = int(yy[x]); ear[max(0, yi - 2):yi + 2, x] *= .9; eh[max(0, yi - 2):yi + 2, x] += .3
rimx = np.minimum(np.arange(512), 511 - np.arange(512))[None, :] * np.ones((512, 1))
ear *= (1 - .35 * smooth(40, 0, rimx))[..., None]
ear[0:90] = ear[0:90] * .6 + fur[0:90, 0:512].mean(axis=(0, 1))[None, None, :] * .4   # Ohrgrund behaart
col[512:1024, 512:1024] = np.clip(ear, 0.01, 1); hgt[512:1024, 512:1024] = eh
# Einzelfarben
col[0:512, 768:1024] = V3((.12, .09, .07))
def patch_solid(name, c):
    u, v = SOLID[name]; x, y = int(u * N), int(v * N); col[y - 28:y + 28, x - 40:x + 40] = V3(c)
patch_solid('dunkel', (.008, .008, .010)); patch_solid('horn', (.30, .22, .15)); patch_solid('nase', (.045, .032, .032)); patch_solid('knochen', (.13, .092, .068)); patch_solid('fussHaut', (.12, .085, .065))
hgt[0:512, 768:1024] = 0
# Normalenkarte
gy, gx = np.gradient(gblur(hgt, .7, .7)); k = 6.0
nrm = np.stack([-gx * k, -gy * k, np.ones_like(gx)], -1); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
nimg = (nrm * .5 + .5).astype(np.float32)
import zlib, struct
def write_png(path, arr):
    a8 = (np.clip(arr, 0, 1) * 255 + .5).astype(np.uint8)[::-1]   # Zeile 0 oben
    raw = b''.join(b'\x00' + a8[y].tobytes() for y in range(a8.shape[0]))
    def ch(t, d): c = struct.pack('>I', len(d)) + t + d; return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    with open(path, 'wb') as f: f.write(b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', a8.shape[1], a8.shape[0], 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw, 6)) + ch(b'IEND', b''))
def save_img(name, arr):
    pth = os.path.join(OUT, name + '.png'); write_png(pth, arr); return bpy.data.images.load(pth)
print('INFO col', float(col.mean()), float(col.max()), float(nimg.mean()))
imc = save_img('fledermaus_farbe', col); imn = save_img('fledermaus_normal', nimg)
imc.colorspace_settings.name = 'sRGB'; imn.colorspace_settings.name = 'Non-Color'
imc.pack(); imn.pack()
# Material
mat = bpy.data.materials.new('Fledermaus'); mat.use_nodes = True; nt = mat.node_tree; bsdf = nt.nodes['Principled BSDF']
tc = nt.nodes.new('ShaderNodeTexImage'); tc.image = imc; tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = imn
nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 1.0
nt.links.new(tc.outputs['Color'], bsdf.inputs['Base Color']); nt.links.new(tn.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
bsdf.inputs['Roughness'].default_value = .78; mat.use_backface_culling = False
ob.data.materials.append(mat)

# ------------------------------------------------------------------ Animation
scn = bpy.context.scene; scn.render.fps = 48
bpy.context.view_layer.objects.active = arm
def axis_local(bname, wax):
    M = arm_d.bones[bname].matrix_local.to_3x3(); return (M.inverted() @ Vector(wax)).normalized()
AX_Y, AX_Z, AX_X = (0, 1, 0), (0, 0, 1), (1, 0, 0)
def deg(a): return math.radians(a)
def pose_frame(fr, P):
    """P: dict Knochen -> Liste (Weltachse, Grad) | ('loc', Vektor)"""
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'; q = Quaternion((1, 0, 0, 0)); loc = Vector((0, 0, 0))
        for item in P.get(pb.name, []):
            if item[0] == 'loc': loc = axis_local(pb.name, (0, 0, 0)) if False else (arm_d.bones[pb.name].matrix_local.to_3x3().inverted() @ Vector(item[1]))
            else: q = Quaternion(axis_local(pb.name, item[0]), deg(item[1])) @ q
        pb.rotation_quaternion = q; pb.location = loc
        pb.keyframe_insert('rotation_quaternion', frame=fr); pb.keyframe_insert('location', frame=fr)
def wing_params(mode, ph):
    T = 2 * math.pi; c, s = math.cos(T * ph), math.sin(T * ph); P = {}
    side = {'R': 1, 'L': -1}
    if mode == 'Flap':
        up = 36 * c - 4; F = max(0.0, math.sin(T * (ph - .5))); pitch = 9 * s
        bob = -0.0035 * c
        P['root'] = [('loc', (0, 0, bob)), (AX_X, 2.5 * s)]; P['spine'] = [(AX_X, -3 * s)]
        P['head'] = [(AX_X, 2 * s)]; P['tail'] = [(AX_X, -5 * c)]
        for n, sg in side.items():
            def fl(a): return (AX_Y, -a * sg)       # a > 0: Fluegel nach oben
            def sw(a): return (AX_Z, a * sg)        # a > 0: nach hinten schwenken (Richtung Koerper)
            P['hum_' + n] = [fl(up), (AX_X, pitch), sw(4 * F)]
            lg = lambda k, d=0.0: k * (math.sin(T * (ph - d)) if math.sin(T * (ph - d)) > 0 else .3 * math.sin(T * (ph - d)))   # Nachschwingen: stark beim Abschlag, gering beim Aufwaertsfalten
            P['fore_' + n] = [fl(lg(20) + 16 * F), sw(18 * F)]
            P['thumb_' + n] = [fl(10 * s)]
            for k, (a1, a2, a3, sw1, sw2, sw3) in zip((3, 4, 5), ((14, 18, 22, 30, 20, 16), (12, 15, 18, 24, 18, 14), (10, 12, 14, 16, 14, 12))):
                P[f'd{k}m_{n}'] = [fl(lg(a1, .06) + 4 * F), sw(sw1 * F)]
                P[f'd{k}a_{n}'] = [fl(lg(a2, .12) + 10 * F), sw(sw2 * F)]
                P[f'd{k}b_{n}'] = [fl(lg(a3, .18) + 12 * F), sw(sw3 * F)]
            P['fem_' + n] = [fl(5 * s) if False else (AX_Y, 4 * s * sg)]; P['tib_' + n] = [(AX_Y, 6 * math.sin(T * (ph - .1)) * sg)]
            P['ear_' + n] = [(AX_Y, 3 * c * sg)]
    else:  # Glide: Fluegel ausgebreitet, leichtes Atmen/Zittern, Fingerspitzen etwas nach unten
        T1 = T * ph; sn, cs = math.sin(T1), math.cos(T1)
        P['root'] = [('loc', (0, 0, 0.0008 * sn))]; P['tail'] = [(AX_X, 3 * sn)]; P['head'] = [(AX_X, 2 * cs)]
        for n, sg in side.items():
            fl = lambda a: (AX_Y, -a * sg); sw = lambda a: (AX_Z, a * sg)
            P['hum_' + n] = [fl(10 + 2.5 * sn), sw(2)]; P['fore_' + n] = [fl(-4 + 2 * cs)]
            for k in (3, 4, 5):
                P[f'd{k}m_{n}'] = [fl(-4 + 2 * sn), sw(4)]; P[f'd{k}a_{n}'] = [fl(-9 + 3 * sn), sw(6)]; P[f'd{k}b_{n}'] = [fl(-13 + 3 * cs), sw(6)]
            P['ear_' + n] = [(AX_Y, (5 if ph > .5 else 0) * sg * math.sin(T * ph * 2))]
            P['fem_' + n] = [(AX_Y, 3 * sn * sg)]
    return P
arm.animation_data_create()
ACTS = {}
for name, nfr, step in (('Flap', 12, 1), ('Glide', 48, 4)):
    act = bpy.data.actions.new(name); act.use_fake_user = True; arm.animation_data.action = act
    for fr in range(0, nfr + 1, step): pose_frame(fr, wing_params(name, fr / nfr))
    ACTS[name] = act
for name, act in ACTS.items():
    for fc in act.fcurves:
        for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'
arm.animation_data.action = ACTS['Flap']; scn.frame_start = 0; scn.frame_end = 12
bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'fledermaus.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'fledermaus.glb'), export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='ACTIONS',
                          export_force_sampling=True, export_frame_range=False, export_skins=True, export_normals=True, export_texcoords=True, export_materials='EXPORT',
                          export_yup=True, export_apply=False, export_def_bones=False, export_optimize_animation_size=False)
print('INFO export', os.path.join(OUT, 'fledermaus.glb'))
