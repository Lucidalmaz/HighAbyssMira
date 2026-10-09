# Rabe, Stufe 3: Körper auf das Skelett der alten Krähe (animal_crow, PROTOFACTOR – 61 Knochen, 17 Clips) setzen, Federn/Beine/Augen bauen.
# Das Skelett und die Clips bleiben unverändert (Knochennamen = alte Namen) → whiskey.js, traum.js (Zehen-Griff), leben.js, hungrige.js laufen ohne Umbau.
#  1. Pose: Kopf um 20° gesenkt (der Scan schaut nach unten); altes Netz in dieser Pose auswerten.
#  2. Gewichte Körper: nächster Punkt auf dem alten Rumpf (ohne Flügel-/Schwanzkarten), baryzentrisch gemischt; Oberschnabel → Kopf, Unterschnabel → Kiefer („Queue-de-cheval“).
#  3. Körper in die Ruhelage zurückrechnen (Umkehr der Hautverformung je Vertex).
#  4. Federn in der Ruhelage (Flügel ausgebreitet) auf die Fläche der alten Flügelkarten legen: Handschwingen, Armschwingen, Schirmfedern, Decken
#     (große, mittlere, kleine, Handdecken), Daumenfittich, Steuerfedern, Ober-/Unterschwanzdecken. Gewichte aus den alten Karten (baryzentrisch).
#  5. Beine (Lauf mit Hornschilden, 3+1 Zehen, Krallen) entlang der Bein-/Zehenknochen, Augen als Kugeln mit Glanz.
#  6. Export: GLB mit Haut (ohne Clips) → rabe_glb.mjs setzt das in die alte Datei (Skelett + Clips unverändert).
#   blender --background --factory-startup --threads 2 --python rabe_bau3_rig.py -- <werk> <whiskey|kraehe> <alte.glb>
import bpy, bmesh, sys, math, json, numpy as np
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform, intersect_point_tri
a = sys.argv[sys.argv.index('--') + 1:]; W = a[0].rstrip('/\\') + '/'; V = a[1]; ALT = a[2]
KR = V == 'kraehe'
bpy.ops.wm.open_mainfile(filepath=W + 'koerper.blend')
body = bpy.data.objects[V]; hoch = bpy.data.objects['hoch']
AUGE = {'L': Vector(hoch['auge_L']), 'R': Vector(hoch['auge_R'])}
for o in list(bpy.data.objects):
  if o is not body: bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=ALT, bone_heuristic='BLENDER')
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE'); old = next(o for o in bpy.data.objects if o.type == 'MESH' and o is not body and o.parent == arm)
for o in list(bpy.data.objects):
  if o.type == 'MESH' and o not in (body, old): bpy.data.objects.remove(o, do_unlink=True)  # Knochenform-Kugel des Importers
arm.animation_data.action = None
for t in arm.animation_data.nla_tracks: t.mute = True
BN = [b.name for b in arm.data.bones]
def bone(n): return next(b for b in BN if b.endswith(n))
HEAD, JAW = bone('-Head'), bone('Queue-de-cheval-1')
RB = {b.name: arm.matrix_world @ b.head_local for b in arm.data.bones}  # Ruhelage, Gelenkpunkte

# ---------------------------------------------------------------- 1. Pose (Kopf gesenkt) und altes Netz darin
for pb in arm.pose.bones: pb.matrix_basis = Matrix()
# Bezugspose = Grundhaltung der Clips (IdleLookAround, Bild 0): Kopf, Kiefer (in allen Clips 39° gegen die Ruhe!) und Flügel stehen dort anders als in der Ruhelage.
# Der Scan wird als diese Haltung gelesen und in die Ruhelage zurückgerechnet → in den Clips sitzt er wieder genau so (Schnabel zu, Flügel angelegt).
arm.animation_data.action = bpy.data.actions['ANIM_Crow_IdleLookAround']; bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()
BASIS = {pb.name: pb.matrix_basis.copy() for pb in arm.pose.bones}; arm.animation_data.action = None
for pb in arm.pose.bones: pb.matrix_basis = BASIS[pb.name]
bpy.context.view_layer.update()
NICK = math.radians(float(a[3]) if len(a) > 3 else 0.)  # zusätzliche Kopfneigung (Grad)
pbh = arm.pose.bones[HEAD]; h0 = pbh.head.copy()
pbh.matrix = Matrix.Translation(h0) @ Matrix.Rotation(NICK, 4, 'X') @ Matrix.Translation(-h0) @ pbh.matrix
bpy.context.view_layer.update()
D = {pb.name: arm.matrix_world @ pb.matrix @ pb.bone.matrix_local.inverted() @ arm.matrix_world.inverted() for pb in arm.pose.bones}
dg = bpy.context.evaluated_depsgraph_get(); ev = old.evaluated_get(dg); pm = ev.to_mesh()
P_pose = [old.matrix_world @ v.co for v in pm.vertices]; ev.to_mesh_clear()
P_rest = [old.matrix_world @ v.co for v in old.data.vertices]
gname = {g.index: g.name for g in old.vertex_groups}
OW = [{gname[g.group]: g.weight for g in v.groups if g.weight > 1e-4} for v in old.data.vertices]
TRI = [tuple(p.vertices) for p in old.data.polygons]
def dom(i): return max(OW[i].items(), key=lambda kv: kv[1])[0] if OW[i] else ''
WING = lambda n: n.startswith('Wing') or n.endswith(('-UpperArm', '-Forearm', '-Hand'))
TAIL = lambda n: n.startswith('CrowTail')
LEG = lambda n: any(n.endswith(s) for s in ('-HorseLink', '-Foot')) or '-Toe' in n
rumpf = [t for t in TRI if not any(WING(dom(i)) or TAIL(dom(i)) or LEG(dom(i)) for i in t)]
karten_f = [t for t in TRI if sum(WING(dom(i)) for i in t) >= 2 and not any(TAIL(dom(i)) or LEG(dom(i)) or dom(i).endswith(('-Head', '-Neck')) for i in t)]
karten_t = [t for t in TRI if all(TAIL(dom(i)) or dom(i).endswith('-Pelvis') for i in t) and sum(TAIL(dom(i)) for i in t) >= 2]
print('INFO alt: rumpf', len(rumpf), 'flügel', len(karten_f), 'schwanz', len(karten_t))
def bvh(P, tris): return BVHTree.FromPolygons([tuple(P[i]) for i in range(len(P))], tris, all_triangles=True)
def mix(P, tris, tree, p):
  loc, nrm, fi, dist = tree.find_nearest(p)
  if loc is None: return {}
  a, b, c = tris[fi]; A, B, C = P[a], P[b], P[c]
  # baryzentrische Anteile
  v0, v1, v2 = B - A, C - A, loc - A; d00, d01, d11, d20, d21 = v0.dot(v0), v0.dot(v1), v1.dot(v1), v2.dot(v0), v2.dot(v1)
  den = d00 * d11 - d01 * d01 or 1e-12; wv = (d11 * d20 - d01 * d21) / den; ww = (d00 * d21 - d01 * d20) / den; wu = 1 - wv - ww
  out = {}
  for i, f in ((a, wu), (b, wv), (c, ww)):
    for n, w in OW[i].items(): out[n] = out.get(n, 0) + w * max(0, f)
  return out
def norm4(w):
  it = sorted(w.items(), key=lambda kv: -kv[1])[:4]; s = sum(x for _, x in it) or 1
  return {n: x / s for n, x in it if x / s > .01}

# ---------------------------------------------------------------- 2. Gewichte Körper (in der Pose)
T_r = bvh(P_pose, rumpf)
gJ = body.vertex_groups.get('JAW'); gU = body.vertex_groups.get('OBERSCHNABEL')
BW = []
for v in body.data.vertices:
  w = mix(P_pose, rumpf, T_r, body.matrix_world @ v.co)
  j = u = 0
  for g in v.groups:
    if gJ and g.group == gJ.index: j = g.weight
    if gU and g.group == gU.index: u = g.weight
  if u > 0: w = {HEAD: 1.0}
  q = w.pop(JAW, 0)  # die alte Krähe hängt die ganze Kehle an den Kiefer → hier nur der Unterschnabel
  if q: w[HEAD] = w.get(HEAD, 0) + q
  if j > 0: w = {k: x * (1 - j) for k, x in w.items()}; w[JAW] = j
  if not w: w = {bone('-Spine'): 1}
  BW.append(norm4(w))

# ---------------------------------------------------------------- 3. Zurück in die Ruhelage
def unpose(p, w):
  M = Matrix(((0, 0, 0, 0),) * 4)
  for n, x in w.items():
    Dn = D[n]
    for r in range(4):
      for c in range(4): M[r][c] += Dn[r][c] * x
  return M.inverted_safe() @ p
for v, w in zip(body.data.vertices, BW): v.co = body.matrix_world.inverted() @ unpose(body.matrix_world @ v.co, w)
body.data.update()
arm.animation_data.action = None
for pb in arm.pose.bones: pb.matrix_basis = Matrix()
bpy.context.view_layer.update()
# Augen in Ruhelage (am Kopf)
for k in AUGE: AUGE[k] = D[HEAD].inverted() @ AUGE[k]
# Krähe: kürzerer, schlankerer Schnabel (Rabenkrähe statt Kolkrabe), Kehle glatter
if KR:
  co = [v.co.copy() for v in body.data.vertices]; idx = [i for i, w in enumerate(BW) if (w.get(HEAD, 0) > .99 and co[i].y < RB[HEAD].y - .03) or w.get(JAW, 0) > .5]
  by = max(co[i].y for i in idx); bz = sum(co[i].z for i in idx) / len(idx)
  for i, v in enumerate(body.data.vertices):
    p = v.co
    if p.y < by + .012 and p.z > RB[HEAD].z - .045:
      k = min(1, max(0, (by + .012 - p.y) / .02))
      if k > 0: p.y = by + (p.y - by) * (1 - .17 * k); p.z = bz + (p.z - bz) * (1 - .1 * k); p.x *= 1 - .08 * k
  body.data.update()

# ---------------------------------------------------------------- Atlas-Bereiche (UV, Blender: v nach oben)
ROW = 1 / 16; CW = (1 - ROW) / 4
UVR = {'hand': (0, 1, 1 - ROW, 1), 'arm': (0, 1, 1 - 2 * ROW, 1 - ROW), 'schwanz': (0, 1, 1 - 3 * ROW, 1 - 2 * ROW),
       'deck0': (0, CW, .75, .75 + ROW), 'deck1': (CW, 2 * CW, .75, .75 + ROW), 'deck2': (2 * CW, 3 * CW, .75, .75 + ROW),
       'schuppen': (3 * CW, 4 * CW, .75, .75 + ROW), 'auge': (1 - ROW, 1, .75, .75 + ROW)}
def uvr(k, s, t):  # s 0..1 Länge, t -1..1 quer (−1 = Außenfahne = oben im Bild)
  u0, u1, v0, v1 = UVR[k]; e = .0015
  return (u0 + e + s * (u1 - u0 - 2 * e), v1 - e - (t + 1) / 2 * (v1 - v0 - 2 * e))

# ---------------------------------------------------------------- Bausteine
G = {'V': [], 'F': [], 'UV': [], 'W': []}  # gebaute Teile (Ruhelage)
def add_quads(grid, uvs, weights, flip=False):
  n0 = len(G['V']); R = len(grid); C = len(grid[0])
  for r in range(R):
    for c in range(C): G['V'].append(grid[r][c]); G['UV'].append(uvs[r][c]); G['W'].append(weights[r][c])
  for r in range(R - 1):
    for c in range(C - 1):
      a_, b_, c_, d_ = n0 + r * C + c, n0 + r * C + c + 1, n0 + (r + 1) * C + c + 1, n0 + (r + 1) * C + c
      G['F'].append((a_, d_, c_, b_) if flip else (a_, b_, c_, d_))
P_r = P_rest; T_f = bvh(P_r, karten_f); T_t = bvh(P_r, karten_t)
def flaeche(tree, p):  # Höhe/Normale der alten Karte unter p
  loc, nrm, fi, d = tree.find_nearest(p); return loc, nrm
import random
RND = random.Random(17 if not KR else 23)
WF = None  # Gewichtsfunktion der gebauten Federn (Flügelkoordinaten bzw. Schwanzwinkel) – ohne: aus den alten Karten
def _flach(v): return Vector((v.x, v.y, 0))
def _seg(p, a_, b_):
  ab = b_ - a_; t = max(0., min(1., (p - a_).dot(ab) / (ab.length_squared or 1e-12))); return t, a_ + ab * t
def _poly(p, pts, bones, scharf=None):
  best = None
  for k in range(len(pts) - 1):
    t, q = _seg(p, pts[k], pts[k + 1]); d = (p - q).length
    if best is None or d < best[0]: best = (d, k, t, q)
  d, k, t, q = best; w = {}
  if scharf:  # Knochen gehört zum Abschnitt, Übergang nur nahe den Gelenken
    o = scharf[k]; w[o] = 1.
    if t > .85 and k + 1 < len(scharf): x = (t - .85) / .15 * .5; w[o] -= x; w[scharf[k + 1]] = w.get(scharf[k + 1], 0) + x
    if t < .15 and k > 0: x = (.15 - t) / .15 * .5; w[o] -= x; w[scharf[k - 1]] = w.get(scharf[k - 1], 0) + x
  else:
    w[bones[k]] = w.get(bones[k], 0) + 1 - t; w[bones[k + 1]] = w.get(bones[k + 1], 0) + t
  return q, w, d
def flgw(sx):
  # Flügelkoordinaten: Knochenlinie (Oberarm/Unterarm/Hand) → Hinterkante (Kontrollknochen D…H) bzw. Vorderkante (A…C), linear nach relativer Lage
  nm = (lambda n: n.replace('Left', 'Right').replace('-L-', '-R-')) if sx < 0 else (lambda n: n)
  B = lambda n: _flach(RB[nm(n)])
  Pb = [B('CROW_-L-UpperArm'), B('CROW_-L-Forearm'), B('CROW_-L-Hand'), B('WingLeftC')]; Ob = [nm('CROW_-L-UpperArm'), nm('CROW_-L-Forearm'), nm('CROW_-L-Hand')]
  Pt = [B('WingLeftD'), B('WingLeftE'), B('WingLeftF'), B('WingLeftG'), B('WingLeftH')]; Bt = [nm('WingLeft' + c) for c in 'DEFGH']
  Pl = [B('CROW_-L-UpperArm'), B('WingLeftA'), B('WingLeftB'), B('WingLeftC')]; Bl = [nm('CROW_-L-UpperArm')] + [nm('WingLeft' + c) for c in 'ABC']
  def wf(p):
    p = _flach(p); b, wb, db = _poly(p, Pb, None, Ob)
    hinten = p.y >= b.y - 1e-6
    q, wq, dq = _poly(p, Pt if hinten else Pl, Bt if hinten else Bl)
    f = db / (db + dq + 1e-9); f = f * f * (3 - 2 * f) * .85 + f * .15
    w = {k: x * (1 - f) for k, x in wb.items()}
    for k, x in wq.items(): w[k] = w.get(k, 0) + x * f
    return norm4(w)
  return wf
def feder(base, tip, width, kind, up, tree, tris, layer, seg=6, across=3, droop=.05, camber=.1, twist=0., side=1, two=False, lift=0.):
  """Eine Feder als gewölbtes Band von base nach tip. up = Flächennormale (oben). side: Richtung der Außenfahne (+1 = links/Spitze)."""
  d = tip - base; L = d.length; dn = d / L
  lat = dn.cross(up).normalized() * side  # zeigt zur Außenfahne
  grid, uvs, wts = [], [], []
  roll = RND.uniform(-.13, .13); dr = RND.uniform(.7, 1.3)  # jede Feder etwas anders gedreht/gebogen (sonst wirkt der Flügel wie eine glatte Platte)
  for i in range(seg + 1):
    s = i / seg; row, ruv, rw = [], [], []
    tw = Matrix.Rotation(twist * s + roll * s, 3, dn)
    for j in range(across):
      t = -1 + 2 * j / (across - 1)
      off = (lat * (-t) * width / 2)  # t=-1 → Außenfahne (lat)
      off = tw @ off
      h = up * (layer + lift * (1 - s) + camber * width * (1 - t * t) - droop * dr * L * s * s)
      p = base + dn * (L * s) + off + h
      row.append(p); ruv.append(uvr(kind, s, t))
      rw.append(WF(p - h) if WF else norm4(mix(P_r, tris, tree, p - h)))
    grid.append(row); uvs.append(ruv); wts.append(rw)
  add_quads(grid, uvs, wts, flip=side > 0)
  if two:  # Unterseite (eigene, umgedrehte Fläche, minimal darunter)
    g2 = [[p - up * .0005 for p in r] for r in grid]; add_quads(g2, uvs, wts, flip=side < 0)

# ---------------------------------------------------------------- 4. Flügel (links gebaut, rechts gespiegelt durch eigene Gewichte)
def lerp(a_, b_, t): return a_ + (b_ - a_) * t
def wing(sx):
  global WF; WF = flgw(sx)
  def B(n):
    q = RB[n.replace('Left', 'Right').replace('-L-', '-R-')] if sx < 0 else RB[n]; return q
  SH, EL, WR = B('CROW_-L-UpperArm'), B('CROW_-L-Forearm'), B('CROW_-L-Hand')
  A_, B_, C_ = B('WingLeftA'), B('WingLeftB'), B('WingLeftC')
  D_, E_, F_, G_, H_ = B('WingLeftD'), B('WingLeftE'), B('WingLeftF'), B('WingLeftG'), B('WingLeftH')
  def up_at(p):
    loc, n = flaeche(T_f, p); n = n if n.z > 0 else -n; return n.normalized()
  seg_r = 3 if KR else 6; acr = 3
  # Handschwingen P1..P10 (P10 außen): proximale liegen oben
  tips = [lerp(F_, G_, .25), lerp(F_, G_, .45), lerp(F_, G_, .65), lerp(F_, G_, .85), lerp(G_, H_, .2), lerp(G_, H_, .45), lerp(G_, H_, .72), H_, lerp(H_, C_, .14), lerp(H_, C_, .3)]
  for i in range(10):
    base = lerp(WR, C_, i / 9 * .92) + (C_ - WR).normalized() * 0 ; tip = tips[i]
    up = up_at(lerp(base, tip, .4)); w = (.036 if i < 6 else .032) * (1 - .1 * (i > 7))
    feder(base, tip, w, 'hand', up, T_f, karten_f, layer=.0003 * (10 - i), seg=seg_r, droop=.035, camber=.08, twist=math.radians(-6 * i / 9) * sx, side=1 if sx > 0 else -1, two=True)
  # Armschwingen S1..S11 (S1 am Handgelenk) + 3 Schirmfedern
  for j in range(11):
    base = lerp(WR, EL, j / 10); tip = lerp(F_, E_, j / 10) + Vector((0, .006 * math.sin(j), 0))
    feder(base, tip, .042, 'arm', up_at(lerp(base, tip, .4)), T_f, karten_f, layer=.0034 + .0003 * j, seg=seg_r, droop=.02, camber=.1, side=1 if sx > 0 else -1, two=True)
  for k, (bt, tt) in enumerate(((.2, .25), (.5, .62), (.8, 1.0))):
    base = lerp(EL, SH, bt); tip = lerp(E_, D_, tt)
    feder(base, tip, .044, 'arm', up_at(lerp(base, tip, .4)), T_f, karten_f, layer=.0068 + .0004 * k, seg=seg_r, droop=.02, camber=.12, side=1 if sx > 0 else -1, two=True)
  # Decken: große Armdecken, Handdecken, mittlere, kleine; Daumenfittich
  segc = 2 if KR else 3
  for j in range(14 if not KR else 7):
    t = j / (13 if not KR else 6); base = lerp(WR, SH, t * .95) + Vector((0, -.006, 0)); tipr = lerp(lerp(F_, D_, t * 1.0), base, .58)
    feder(base, tipr, .03, 'deck%d' % (j % 3), up_at(base), T_f, karten_f, layer=.0085 + .0002 * j, seg=segc, droop=.0, camber=.12, side=1 if sx > 0 else -1)
  for i in range(10 if not KR else 5):
    t = i / (9 if not KR else 4); base = lerp(WR, C_, t * .8); tip = lerp(base, tips[min(9, int(t * 9))], .32)
    feder(base, tip, .026, 'deck%d' % (i % 3), up_at(base), T_f, karten_f, layer=.0080 + .0002 * (10 - i), seg=segc, droop=.0, camber=.1, side=1 if sx > 0 else -1)
  if not KR:
    for j in range(10):
      t = j / 9; base = lerp(lerp(WR, A_, .3), SH, t) + Vector((0, -.012, 0)); tip = base + (lerp(F_, D_, t) - base).normalized() * .045
      feder(base, tip, .024, 'deck%d' % ((j + 1) % 3), up_at(base), T_f, karten_f, layer=.0110 + .0002 * j, seg=2, droop=0, camber=.12, side=1 if sx > 0 else -1)
    lead = [SH, A_, B_, C_]
    for j in range(12):
      t = j / 11 * 2.6; i0 = min(2, int(t)); p = lerp(lead[i0], lead[i0 + 1], t - i0) + Vector((0, .004, 0)); dirn = (lerp(E_, F_, j / 11) - p).normalized()
      feder(p, p + dirn * .03, .018, 'deck%d' % (j % 3), up_at(p), T_f, karten_f, layer=.0128 + .0002 * j, seg=2, droop=0, camber=.14, side=1 if sx > 0 else -1)
    for k in range(3):
      p = lerp(B_, WR, .2 + .15 * k); dirn = (lerp(C_, H_, .3) - p).normalized()
      feder(p, p + dirn * (.05 - .01 * k), .014, 'deck%d' % k, up_at(p), T_f, karten_f, layer=.0136 + .0003 * k, seg=2, droop=.0, camber=.1, side=1 if sx > 0 else -1)
for sx in (1, -1): wing(sx)
WF = None

# ---------------------------------------------------------------- Schwanz: 12 Steuerfedern (Kolkrabe keilförmig, Krähe gerade), Decken
TB = [RB[n] for n in BN if n.startswith('CrowTail')]; tb = sum(TB, Vector()) / len(TB)
up = Vector((0, 0, 1))
kt = [t for t in karten_t]; ys = [P_r[i].y for t in kt for i in t]; ytip = max(ys)
TW = []  # (Winkel der alten Karte, Knochen)
for n in BN:
  if not n.startswith('CrowTail'): continue
  ps_ = [P_r[i] for i in range(len(P_r)) if dom(i) == n]
  if not ps_: continue
  c_ = sum(ps_, Vector()) / len(ps_) - RB[n]; TW.append((math.atan2(c_.x, c_.y), n))
TW.sort(); print('INFO Schwanzknochen', [(round(math.degrees(a_)), n[-6:]) for a_, n in TW])
def schw(phi, rest=0.):
  if phi <= TW[0][0]: w = {TW[0][1]: 1.}
  elif phi >= TW[-1][0]: w = {TW[-1][1]: 1.}
  else:
    k = max(i for i in range(len(TW)) if TW[i][0] <= phi); a0, n0 = TW[k]; a1, n1 = TW[k + 1]; t = (phi - a0) / ((a1 - a0) or 1); w = {n0: 1 - t}; w[n1] = w.get(n1, 0) + t
  if rest: w = {k: x * (1 - rest) for k, x in w.items()}; w[bone('-Pelvis')] = rest
  return norm4(w)
Lc = ytip - tb.y - .005
for i in range(12):
  f = (i - 5.5) / 5.5; ang = math.radians(26) * f
  L = Lc * (1 - (.04 if KR else .2) * abs(f) ** 1.3)
  base = tb + Vector((.012 * f, -.012, .004)); dirn = Vector((math.sin(ang), math.cos(ang), -.03)).normalized()
  WF = (lambda ph: (lambda p: schw(ph)))(math.atan2(dirn.x, dirn.y))
  feder(base, base + dirn * L, .046, 'schwanz', up, T_t, karten_t, layer=.0007 * (6 - abs(i - 5.5)), seg=3 if KR else 5, droop=-.01, camber=.07, side=1 if f > 0 else -1, two=True)
for i in range(6 if not KR else 3):
  f = (i - (2.5 if not KR else 1)) / (2.5 if not KR else 1); base = tb + Vector((.012 * f, -.03, .018)); tip = base + Vector((.02 * f, .085, -.012))
  WF = (lambda ph: (lambda p: schw(ph, .5)))(math.atan2((tip - base).x, (tip - base).y))
  feder(base, tip, .034, 'deck%d' % (i % 3), up, T_t, karten_t, layer=.006, seg=2, droop=.05, camber=.15, side=1 if f > 0 else -1)
for i in range(4 if not KR else 2):
  f = (i - 1.5) / 1.5 if not KR else (i - .5) / .5; base = tb + Vector((.01 * f, -.025, -.012)); tip = base + Vector((.012 * f, .07, .006))
  WF = (lambda ph: (lambda p: schw(ph, .6)))(math.atan2((tip - base).x, (tip - base).y))
  feder(base, tip, .03, 'deck%d' % (i % 3), -up, T_t, karten_t, layer=.0, seg=2, droop=.0, camber=.1, side=-1 if f > 0 else 1)

WF = None
# ---------------------------------------------------------------- 5. Beine und Augen
def tube(pts, radii, wts, kind, u_rng, sides, flat=1.0, fwd=Vector((0, -1, 0))):
  """Röhre entlang pts (Ringe), Querschnitt elliptisch (flat <1: flacher), UV: u entlang, v um den Umfang (0,5 = vorn)."""
  grid, uvs, ww = [], [], []
  for i, p in enumerate(pts):
    d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
    f = (fwd - d * fwd.dot(d)); f = f.normalized() if f.length > 1e-6 else d.orthogonal().normalized(); s = d.cross(f).normalized()
    row, ruv, rw = [], [], []
    for k in range(sides + 1):
      a_ = 2 * math.pi * k / sides; q = p + (f * math.cos(a_) + s * math.sin(a_) * flat) * radii[i]
      row.append(q); s_ = u_rng[0] + (u_rng[1] - u_rng[0]) * i / (len(pts) - 1); ruv.append(uvr(kind, s_, (k / sides - .5) * 2 * .98)); rw.append(wts[i])
    grid.append(row); uvs.append(ruv); ww.append(rw)
  add_quads(grid, uvs, ww, flip=False)
  # Spitze schließen
  n_tip = len(G['V']); G['V'].append(pts[-1] + (pts[-1] - pts[-2]).normalized() * radii[-1] * .6); G['UV'].append(uvr(kind, u_rng[1], 0)); G['W'].append(wts[-1])
  base = n_tip - (sides + 1)
  for k in range(sides): G['F'].append((base + k, base + k + 1, n_tip))
def leg(sd):
  S = 'L' if sd > 0 else 'R'; nm = lambda x: bone('-%s-%s' % (S, x))
  knee, heel, foot = RB[nm('Calf')], RB[nm('HorseLink')], RB[nm('Foot')]
  sides = 5 if KR else 8
  W1 = lambda a_, b_, t: norm4({a_: 1 - t, b_: t})
  pts = [lerp(knee, heel, t) for t in (0, .5, 1)] + [lerp(heel, foot, t) for t in (.2, .45, .7, .9, 1.0)]
  wts = [{nm('Calf'): 1}] * 2 + [W1(nm('Calf'), nm('HorseLink'), .5)] + [{nm('HorseLink'): 1}] * 3 + [W1(nm('HorseLink'), nm('Foot'), .5), {nm('Foot'): 1}]
  rad = [.0062, .0055, .0046, .0042, .0039, .0037, .0036, .0038]
  tube(pts, rad, wts, 'schuppen', (.0, .55), sides, flat=.78)
  global WF; WF = (lambda b_: (lambda p: {b_: 1.}))(nm('Calf'))
  # Federhose: kleine Deckfedern rund um den Unterschenkel, nach unten bis knapp über die Ferse
  dl = (heel - knee).normalized(); fw = Vector((0, -1, 0))
  for k in range(4 if KR else 8):
    ang = 2 * math.pi * k / (4 if KR else 8) + .3; f0 = (fw - dl * fw.dot(dl)).normalized(); s0 = dl.cross(f0)
    out = (f0 * math.cos(ang) + s0 * math.sin(ang)).normalized(); b0 = knee + out * .006 + dl * (-.004)
    feder(b0, heel + out * .0075 + dl * .002, .017, 'deck%d' % (k % 3), out, None, None, layer=0., seg=2, droop=0, camber=.12, side=1)
  WF = None
  # Zehen: drei vorn (gefächert) an der Kette Toe0→Toe01→Toe02, Hinterzehe an Toe1→Toe11→Toe12
  front = [RB[nm('Toe0')], RB[nm('Toe01')], RB[nm('Toe02')]]; back = [RB[nm('Toe1')], RB[nm('Toe11')], RB[nm('Toe12')]]
  bn_f = [nm('Toe0'), nm('Toe01'), nm('Toe02')]; bn_b = [nm('Toe1'), nm('Toe11'), nm('Toe12')]
  zt = Vector((0, 0, 1))
  def toe(chain, bns, splay, length, r0):
    o = foot.copy(); o.z = r0 * .9
    dirn = (chain[-1] - chain[0]); dirn.z = 0; dirn.normalize(); dirn = Matrix.Rotation(splay, 3, 'Z') @ dirn
    P = [o + dirn * length * t + zt * (r0 * .1 * math.sin(t * math.pi)) for t in (0, .25, .5, .72, .88, 1.0)]
    for p in P: p.z = max(p.z, r0 * .8)
    ws = [{bns[0]: 1}, {bns[0]: 1}, W1(bns[0], bns[1], .5), {bns[1]: 1}, W1(bns[1], bns[2], .5), {bns[2]: 1}]
    R = [r0, r0 * .95, r0 * .88, r0 * .8, r0 * .72, r0 * .62]
    tube(P, R, ws, 'schuppen', (.55, .86), 4 if KR else 6, flat=.8, fwd=Vector((0, 0, 1)))
    # Kralle: gebogen nach unten
    c0 = P[-1]; C = [c0 + dirn * .007 * t - zt * (.0055 * t * t) for t in (0, .35, .7, 1.0)]
    tube(C, [R[-1] * .8, R[-1] * .6, R[-1] * .35, R[-1] * .08], [{bns[2]: 1}] * 4, 'schuppen', (.87, 1.0), 4 if KR else 6, flat=.6, fwd=Vector((0, 0, 1)))
  ml = (front[-1] - front[0]).length * 1.75
  toe(front, bn_f, 0, ml, .0029); toe(front, bn_f, math.radians(24 * sd), ml * .8, .0026); toe(front, bn_f, math.radians(-22 * sd), ml * .84, .0026)
  toe(back, bn_b, 0, (back[-1] - back[0]).length * 2.1, .003)
leg(1); leg(-1)
# Augen: Kugeln (vorderer Teil = Augenzelle), etwas in den Kopf gesetzt
for k, c in AUGE.items():
  out = Vector((1 if k == 'L' else -1, -.25, .1)).normalized(); r = .0042; c = c - out * r * .55
  sg, rg = (8, 5) if KR else (16, 9)
  grid, uvs, wts = [], [], []
  for i in range(rg + 1):
    th = math.pi * i / rg; row, ruv, rw = [], [], []
    for j in range(sg + 1):
      ph = 2 * math.pi * j / sg
      loc = Vector((math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th)))
      q = out.to_track_quat('Z', 'Y'); p = c + (q @ loc) * r
      ruv.append(uvr('auge', .5 + .5 * loc.x * .98, loc.y * .98)); row.append(p); rw.append({HEAD: 1})
    grid.append(row); uvs.append(ruv); wts.append(rw)
  add_quads(grid, uvs, wts, flip=True)

# ---------------------------------------------------------------- Zusammenbau: gebaute Teile als Objekt, mit Körper vereinen
me = bpy.data.meshes.new('gebaut'); me.from_pydata([tuple(p) for p in G['V']], [], G['F']); me.update()
uvl = me.uv_layers.new(name='UVMap')
for poly in me.polygons:
  for li in poly.loop_indices: uvl.data[li].uv = G['UV'][me.loops[li].vertex_index]
gb = bpy.data.objects.new('gebaut', me); bpy.context.scene.collection.objects.link(gb)
for n in BN: gb.vertex_groups.new(name=n)
for i, w in enumerate(G['W']):
  for n, x in w.items(): gb.vertex_groups[n].add([i], x, 'REPLACE')
for n in BN:
  if n not in body.vertex_groups: body.vertex_groups.new(name=n)
for v, w in zip(body.data.vertices, BW):
  for n, x in w.items(): body.vertex_groups[n].add([v.index], x, 'REPLACE')
for g in ('JAW', 'OBERSCHNABEL'):
  if g in body.vertex_groups: body.vertex_groups.remove(body.vertex_groups[g])
# Körper-UV als einzige UV-Ebene; Bereichsliste (Schnabel) fürs ORM
bu = body.data.uv_layers.active
for l in list(body.data.uv_layers):
  if l != bu: body.data.uv_layers.remove(l)
bu.name = 'UVMap'
reg = []
uvd = bu.data
for p in body.data.polygons:
  beak = all(BW[i].get(HEAD, 0) > .99 and body.data.vertices[i].co.y < RB[HEAD].y - .03 for i in p.vertices) or all(BW[i].get(JAW, 0) > .9 for i in p.vertices)
  reg.append([[tuple(uvd[li].uv) for li in p.loop_indices], 1 if beak else 0])
json.dump(reg, open(W + V + '_bereiche.json', 'w'))
# Schnabelspalt: Flächen zwischen Ober- und Unterschnabel dehnen sich beim Öffnen → als dunkles Mundinneres färben (UV auf die dunkle Ecke der Augenzelle)
mund = uvr('auge', .03, -.97); nm_ = 0
for p in body.data.polygons:
  jw = [BW[i].get(JAW, 0) for i in p.vertices]
  if max(jw) > .55 and min(jw) < .45 and all(body.data.vertices[i].co.y < RB[HEAD].y - .015 for i in p.vertices):
    for li in p.loop_indices: uvd[li].uv = mund
    nm_ += 1
print('INFO Mundflächen', nm_)
for o in (body, gb):
  for p in o.data.polygons: p.use_smooth = True
bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); gb.select_set(True); bpy.context.view_layer.objects.active = body
bpy.ops.object.join(); rb = body; rb.name = 'Rabe_' + V
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.quads_convert_to_tris(); bpy.ops.object.mode_set(mode='OBJECT')
print('INFO dreiecke', len(rb.data.polygons), 'gebaut', len(G['F']))
# Material (Platzhalter für die Vorschau; das GLB-Material setzt rabe_glb.mjs)
mt = bpy.data.materials.new('M_Rabe'); mt.use_nodes = True; rb.data.materials.clear(); rb.data.materials.append(mt)
# alte Netze weg, an das Skelett hängen
bpy.data.objects.remove(old, do_unlink=True)
rb.parent = arm; rb.matrix_parent_inverse = Matrix(); rb.matrix_world = Matrix()
md = rb.modifiers.new('Armature', 'ARMATURE'); md.object = arm
bpy.ops.wm.save_as_mainfile(filepath=W + 'rabe_' + V + '.blend')
bpy.ops.object.select_all(action='DESELECT'); rb.select_set(True); arm.select_set(True)
bpy.ops.export_scene.gltf(filepath=W + 'rabe_' + V + '_haut.glb', export_format='GLB', use_selection=True, export_animations=False, export_skins=True,
  export_tangents=True, export_normals=True, export_texcoords=True, export_materials='PLACEHOLDER', export_yup=True, export_apply=False, export_def_bones=False)
print('INFO export', W + 'rabe_' + V + '_haut.glb')
