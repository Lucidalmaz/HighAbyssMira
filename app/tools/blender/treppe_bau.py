# Altbautreppe aus Holz (Trittstufen mit Nase, Setzstufen, ausgeschnittene Wangen, Pfosten mit Kappe, gedrechselte Docken, Handlauf, Podest) – eigene Arbeit, Blender.
#   blender -b --factory-startup --python run_prop.py -- treppe_bau.py <ausgabeordner> <name> <n> <lauf_je_stufe> <steigung_je_stufe> <breite> <podest> [textur]
# Koordinaten (glTF): Antritt bei z = 0, die Treppe steigt nach +z, Breite x ∈ [−b/2, +b/2], Geländer auf der +x-Seite, Unterkante y = 0.
#   Steigung: erste Trittstufe liegt bei y = steigung (wie kirchberg_treppe: Stufe i bei y0 + i·rise), Podest bei y = (n+1)·rise.
import bpy, bmesh, math, os, sys, json, time
import numpy as np
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prop_lib.py'), encoding='utf8').read())
NAME = a[1]; N = int(a[2]); RUN = float(a[3]); RISE = float(a[4]); B = float(a[5]); POD = float(a[6]); TEX_ = int(a[7]) if len(a) > 7 else 1024
OUT_ = a[0]
K = []
# Blender: x = x, y = −z_game (vorn), z = oben. Treppe läuft in −y (Blender) = +z (Spiel)
def Y(zg): return -zg
for i in range(1, N + 1):
  y = i * RISE; za = (i - 1) * RUN; zb = i * RUN
  K.append(cube(-B / 2 + .05, B / 2 - .05, Y(zb), Y(za) + .0, y - .04, y, bev=.008, seg=2))                          # Trittstufe (Nase nach vorn: Oberkante bis za − .025)
  K.append(cube(-B / 2 + .05, B / 2 - .05, Y(za) - .0, Y(za) + .022, y - RISE, y - .04, bev=.003, seg=1))              # Setzstufe
  K.append(cube(-B / 2 + .05, B / 2 - .05, Y(za) - .026, Y(za) + .002, y - .04, y, bev=.011, seg=3))                  # Nase
# Podest
if POD > 0:
  yp = (N + 1) * RISE; z0 = N * RUN; K.append(cube(-B / 2 + .05, B / 2 - .05, Y(z0) - .0, Y(z0) + .022, N * RISE, yp - .06, bev=.003, seg=1)); K.append(cube(-B / 2 + .05, B / 2 - .05, Y(z0 + POD), Y(z0), yp - .06, yp, bev=.006, seg=2))
# Wangen: ausgeschnittene Zahnleiste (Prisma) + Deckleiste
def wange(xc):
  ring = []
  for i in range(1, N + 1): ring += [((i - 1) * RUN, i * RISE - .04), (i * RUN, i * RISE - .04)]
  ring += [(N * RUN, N * RISE - .3), (0.0, 0.0)]
  me = bpy.data.meshes.new('w'); o = bpy.data.objects.new('wange', me); scn.collection.objects.link(o)
  bm = bmesh.new(); vs = [bm.verts.new((xc - .025, Y(z), h)) for z, h in ring]
  f = bm.faces.new(vs); res = bmesh.ops.extrude_face_region(bm, geom=[f]); vv = [e for e in res['geom'] if isinstance(e, bmesh.types.BMVert)]
  bmesh.ops.translate(bm, vec=(.05, 0, 0), verts=vv); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
  bm.to_mesh(me); bm.free(); setteil(o, 0.); return o
for xc in (-B / 2 + .03, B / 2 - .03): K.append(wange(xc))
# Pfosten (Antritt / oben), Handlauf, gedrechselte Docken (Geländer rechts, +x)
xg = B / 2 - .03; hl = .9
def pfosten(zg, yb, hgt):
  K.append(cube(xg - .045, xg + .045, Y(zg) - .045, Y(zg) + .045, yb, yb + hgt, bev=.004, seg=2))
  K.append(cube(xg - .055, xg + .055, Y(zg) - .055, Y(zg) + .055, yb + hgt, yb + hgt + .035, bev=.008, seg=2))
  bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=.05, location=(xg, Y(zg), yb + hgt + .07)); s = bpy.context.object; s.scale = (1, 1, .8); bpy.ops.object.transform_apply(scale=True); setteil(s, 0.); K.append(s)
pfosten(.12, 0, hl + .12)
ztop = N * RUN - .1; ytop = N * RISE
pfosten(ztop, ytop - .02, hl + .1)
# Handlauf schräg
za = .12; ya = hl + .12 + RISE * .0; zb_ = ztop; yb_ = ytop + hl
L = math.hypot(zb_ - za, yb_ - ya - .0); ang = math.atan2(yb_ - ya, zb_ - za)
bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=.03, depth=L, location=(xg, Y((za + zb_) / 2), (ya + yb_) / 2))
h = bpy.context.object; h.rotation_euler = (math.atan2(zb_ - za, yb_ - ya), 0, 0)
bpy.ops.object.transform_apply(rotation=True); setteil(h, 1.); K.append(h)
# Docken: je Stufe eine (Drechselform aus drei gestapelten Zylindern + Kugel)
for i in range(1, N, 1):
  zz = (i - .5) * RUN + .0; yy = i * RISE; top = ya + (yb_ - ya) * (zz - za) / (zb_ - za)
  if zz < za + .1 or zz > zb_ - .1: continue
  hh = top - yy - .03
  for (r, d, o) in ((.012, hh * .55, 0.0), (.018, hh * .12, hh * .3), (.012, hh * .33, hh * .6)):
    K.append(cyl(xg, Y(zz), yy + o + d / 2, r, d, 'Z', teil=0., n=10))
PARTS = [join(K, 'treppe')]
bpy.ops.object.shade_smooth()
TEILE = {1: dict(c=(.14, .085, .05), r=.35, rv=.1, dirt=.4, wear=.15)}
finish(PARTS, NAME, TEILE, dict(paint=(.10, .06, .035), wear=.12, rust=0., dirt=1.0, dent=.2), TEX_, OUT_)
