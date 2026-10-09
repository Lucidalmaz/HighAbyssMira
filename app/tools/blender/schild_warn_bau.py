# Warnschild am Absperrgitter (Dustwoods, gruen.js) – gleiche Bauart wie schild_bau.py (Prüfraum-Schild, QA M-15), 62 x 39 cm, rote Rahmenlinie, Auge halb abgekratzt.
# Vorlage: Prüfraum-Schild (QA M-15): Emailleschild als echtes Modell – Platte mit Fase, Schrift als Geometrie (Arial Bold, 2,5 mm erhaben), Rahmenlinie,
# Abplatzer an den Kanten (Rost/Stahlgrau), vier Schrauben. Kein Canvas, keine Textur: Farben nur über Materialien.
# Ausrichtung: Rückseite bei z = 0 (an der Wand), Vorderseite +z (glTF), Ursprung Mitte der Rückseite, Maße 0,50 × 0,156 m.
#   blender --background --factory-startup --threads 2 --python schild_bau.py -- <ausgabe.glb> [Text1] [Text2]
import bpy, bmesh, sys, math, random
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
OUT = a[0]
W, H, D = .62, .39, .0035
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
rnd = random.Random(11)
def mat(name, col, rough, metal=0.):
  m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
  b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m
M_Rot = mat('M_Rot', (.30, .035, .03), .5); M_E = mat('M_Email', (.70, .66, .56), .22); M_S = mat('M_Schrift', (.02, .021, .02), .55); M_D = mat('M_Dreck', (.50, .46, .37), .7); M_R = mat('M_Rost', (.20, .10, .05), .85); M_St = mat('M_Stahl', (.16, .16, .15), .5, .8)
M_E.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.58, .55, .47, 1)  # Email nach Jahrzehnten Staub: gedämpftes Elfenbein
def link(o, m): o.data.materials.clear(); o.data.materials.append(m); return o
# Platte (Rückseite z=0 .. Vorderseite z=D), abgefaste Kanten
bpy.ops.mesh.primitive_cube_add(size=1); pl = bpy.context.object; pl.name = 'Platte'; pl.scale = (W, H, D); pl.location = (0, 0, D / 2); bpy.ops.object.transform_apply(scale=True)
bv = pl.modifiers.new('f', 'BEVEL'); bv.width = .0016; bv.segments = 2; bpy.ops.object.modifier_apply(modifier='f'); link(pl, M_E)
# Rahmenlinie (erhaben, 2 mm breit, 1 mm hoch)
def box(name, x, y, z, sx, sy, sz, m):
  bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object; o.name = name; o.scale = (sx, sy, sz); o.location = (x, y, z); bpy.ops.object.transform_apply(scale=True); link(o, m); return o
fx, fy, lw = W / 2 - .015, H / 2 - .015, .0045
parts = [pl]
for sgn in (-1, 1):
  parts.append(box('rahmen_h', 0, sgn * fy, D + .0005, 2 * fx + lw, lw, .0010, M_Rot)); parts.append(box('rahmen_v', sgn * fx, 0, D + .0005, lw, 2 * fy, .0010, M_Rot))
# Schrift als Geometrie
def text(s, size, y, font, bold=False):
  cu = bpy.data.curves.new('t', 'FONT'); cu.body = s; cu.size = size; cu.extrude = .00125; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
  cu.font = bpy.data.fonts.load(font); cu.resolution_u = 4
  o = bpy.data.objects.new('t', cu); bpy.context.scene.collection.objects.link(o); o.location = (0, y, D + .0006)
  bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.convert(target='MESH'); link(o, M_S); return o
for (t, sz, y, f) in (('FORBIDDEN DUSTWOODS', .042, .105, 'arialbd'), ('BETRETEN VERBOTEN', .040, .045, 'arialbd'), ('Wildschaden', .036, -.030, 'arial'), ('Gemeinde Lost Eyengless', .027, -.095, 'arial'), ('13.07.1992', .027, -.142, 'arial')):
  parts.append(text(t, sz, y, 'C:/Windows/Fonts/%s.ttf' % f))
# Auge (Umriss + Pupille), rechts unten, halb abgekratzt: ein paar Kratzer in Email-Farbe darüber
bpy.ops.mesh.primitive_torus_add(major_radius=.027, minor_radius=.0019, major_segments=32, minor_segments=6, location=(.215, -.128, D + .0012)); o = bpy.context.object
o.scale = (1, .5, 1); bpy.ops.object.transform_apply(scale=True); link(o, M_S); parts.append(o)
bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=.0048, depth=.0016, location=(.215, -.128, D + .0008)); o = bpy.context.object; link(o, M_S); parts.append(o)
for i in range(14):
  bpy.ops.mesh.primitive_cube_add(size=1, location=(.19 + rnd.uniform(0, .05), -.145 + rnd.uniform(0, .035), D + .0022)); o = bpy.context.object; o.scale = (rnd.uniform(.004, .012), .0016, .0006); o.rotation_euler.z = rnd.uniform(-.7, .7)
  bpy.ops.object.transform_apply(scale=True, rotation=True); link(o, M_E); parts.append(o)
# Abplatzer: flache dunkle Scheiben am Rand (Stahl / Rost), liegen auf dem Email
for i in range(20):
  edge = rnd.random() < .7
  if edge:
    side = rnd.choice('NSEW'); x = rnd.uniform(-W / 2 + .004, W / 2 - .004); y = rnd.uniform(-H / 2 + .004, H / 2 - .004)
    if side == 'N': y = H / 2 - rnd.uniform(.001, .004)
    if side == 'S': y = -H / 2 + rnd.uniform(.001, .004)
    if side == 'E': x = W / 2 - rnd.uniform(.001, .004)
    if side == 'W': x = -W / 2 + rnd.uniform(.001, .004)
  else: x = rnd.uniform(-W / 2 + .02, W / 2 - .02); y = rnd.uniform(-H / 2 + .015, H / 2 - .015)
  r = rnd.uniform(.0025, .0075) * (1.6 if rnd.random() < .2 else 1)
  bpy.ops.mesh.primitive_cylinder_add(vertices=rnd.choice((5, 6, 7, 8)), radius=r, depth=.0007, location=(x, y, D + .0003)); o = bpy.context.object; o.scale = (1, rnd.uniform(.55, 1), 1); o.rotation_euler.z = rnd.uniform(0, 6.28)
  bpy.ops.object.transform_apply(scale=True, rotation=True); link(o, M_St if rnd.random() < .55 else M_R); o.name = 'abplatzer%d' % i; parts.append(o)
# Flecken: großflächige, sehr flache Verschmutzung (Wasserlauf, Nikotin) auf dem Email
for i in range(6):
  x = rnd.uniform(-W / 2 + .05, W / 2 - .05); y = rnd.uniform(-H / 2 + .02, H / 2 - .02); r = rnd.uniform(.012, .035)
  bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=r, depth=.0002, location=(x, y, D + .0001)); o = bpy.context.object; o.scale = (rnd.uniform(.6, 1.6), rnd.uniform(.4, 1.2), 1); o.rotation_euler.z = rnd.uniform(0, 6.28)
  bpy.ops.object.transform_apply(scale=True, rotation=True); link(o, M_D); o.name = 'fleck%d' % i; parts.append(o)
# Schrauben
for sx in (-1, 1):
  for sy in (-1, 1):
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=.0045, depth=.0022, location=(sx * (W / 2 - .02), sy * (H / 2 - .02), D + .0011)); o = bpy.context.object; link(o, M_St); o.name = 'schraube'; parts.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in parts: o.select_set(True)
bpy.context.view_layer.objects.active = pl; bpy.ops.object.join(); o = bpy.context.object; o.name = 'Schild_Warn'
o.rotation_euler.x = math.pi / 2; bpy.ops.object.transform_apply(rotation=True)  # Front +z (Modell) → Blender −y = glTF +z, Höhe → Blender z (oben)
me = o.data
me.polygons.foreach_set('use_smooth', [False] * len(me.polygons))  # flach schattiert: Abplatzer bleiben flache Scherben
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_yup=True, export_apply=True)
print('INFO schild', len(me.polygons), 'Flaechen', OUT)
