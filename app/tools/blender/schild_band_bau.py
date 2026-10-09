# Kioskband der Tankstelle Kranz (ausbau_ost_west.js, QA M-13): Blechband 11,6 x 1,08 m aus Geometrie – Schrift (Arial Bold, rot, 1,2 cm erhaben), Rahmenlinie,
# Abplatzer, Rostläufer, Nieten. Kein Canvas. Rückseite z = 0, Vorderseite +z, Ursprung Mitte der Rückseite (wie schild_bau.py / schild_warn_bau.py).
#   blender --background --factory-startup --threads 2 --python schild_band_bau.py -- <ausgabe.glb>
import bpy, sys, math, random
OUT = sys.argv[sys.argv.index('--') + 1]
W, H, D = 11.6, 1.08, .012
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
rnd = random.Random(31)
def mat(name, col, rough, metal=0.):
  m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
  b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m
M_E = mat('M_Blech', (.55, .52, .44), .45); M_R = mat('M_Rot', (.26, .035, .03), .5); M_St = mat('M_Stahl', (.15, .15, .14), .45, .6); M_Ro = mat('M_Rost', (.20, .10, .05), .85); M_D = mat('M_Dreck', (.38, .34, .27), .75)
def link(o, m): o.data.materials.clear(); o.data.materials.append(m); return o
def box(name, x, y, z, sx, sy, sz, m):
  bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object; o.name = name; o.scale = (sx, sy, sz); o.location = (x, y, z); bpy.ops.object.transform_apply(scale=True); link(o, m); return o
bpy.ops.mesh.primitive_cube_add(size=1); pl = bpy.context.object; pl.name = 'Band'; pl.scale = (W, H, D); pl.location = (0, 0, D / 2); bpy.ops.object.transform_apply(scale=True)
bv = pl.modifiers.new('f', 'BEVEL'); bv.width = .006; bv.segments = 2; bpy.ops.object.modifier_apply(modifier='f'); link(pl, M_E)
parts = [pl]
fx, fy, lw = W / 2 - .08, H / 2 - .08, .03
for sgn in (-1, 1):
  parts.append(box('rahmen_h', 0, sgn * fy, D + .004, 2 * fx + lw, lw, .008, M_R)); parts.append(box('rahmen_v', sgn * fx, 0, D + .004, lw, 2 * fy, .008, M_R))
cu = bpy.data.curves.new('t', 'FONT'); cu.body = 'TANKSTELLE  KRANZ  ·  KFZ'; cu.size = .8; cu.extrude = .012; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
cu.font = bpy.data.fonts.load('C:/Windows/Fonts/arialbd.ttf'); cu.resolution_u = 3
t = bpy.data.objects.new('t', cu); bpy.context.scene.collection.objects.link(t); t.location = (0, -.01, D + .002)
bpy.context.view_layer.objects.active = t; t.select_set(True); bpy.ops.object.convert(target='MESH'); link(t, M_R); parts.append(t)
# Abplatzer (Stahl/Rost) vor allem an Kanten und an den Nieten
for i in range(70):
  edge = rnd.random() < .72; x = rnd.uniform(-W / 2 + .02, W / 2 - .02); y = rnd.uniform(-H / 2 + .02, H / 2 - .02)
  if edge:
    side = rnd.choice('NSEW')
    if side == 'N': y = H / 2 - rnd.uniform(.004, .03)
    if side == 'S': y = -H / 2 + rnd.uniform(.004, .03)
    if side == 'E': x = W / 2 - rnd.uniform(.004, .05)
    if side == 'W': x = -W / 2 + rnd.uniform(.004, .05)
  r = rnd.uniform(.012, .04) * (1.8 if rnd.random() < .15 else 1)
  bpy.ops.mesh.primitive_cylinder_add(vertices=rnd.choice((5, 6, 7, 8)), radius=r, depth=.002, location=(x, y, D + .001)); o = bpy.context.object; o.scale = (1, rnd.uniform(.55, 1), 1); o.rotation_euler.z = rnd.uniform(0, 6.28)
  bpy.ops.object.transform_apply(scale=True, rotation=True); link(o, M_St if rnd.random() < .5 else M_Ro); o.name = 'abplatzer%d' % i; parts.append(o)
# Rostläufer unter den Nieten und Flecken
for i in range(14):
  x = rnd.uniform(-W / 2 + .3, W / 2 - .3); y = rnd.uniform(-H / 2 + .1, H / 2 - .1)
  bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=rnd.uniform(.05, .16), depth=.0008, location=(x, y, D + .0005)); o = bpy.context.object; o.scale = (rnd.uniform(.5, 1.8), rnd.uniform(.5, 1.5), 1)
  bpy.ops.object.transform_apply(scale=True); link(o, M_D if i % 2 else M_Ro); o.name = 'fleck%d' % i; parts.append(o)
for i in range(46):  # Nieten entlang des Rahmens
  x = -W / 2 + .16 + i * (W - .32) / 45
  for sy in (-1, 1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=4, radius=.014, location=(x, sy * (H / 2 - .035), D + .004)); o = bpy.context.object; o.scale = (1, 1, .6); bpy.ops.object.transform_apply(scale=True); link(o, M_St); parts.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in parts: o.select_set(True)
bpy.context.view_layer.objects.active = pl; bpy.ops.object.join(); o = bpy.context.object; o.name = 'Kioskband'
me = o.data; me.polygons.foreach_set('use_smooth', [False] * len(me.polygons))
o.rotation_euler.x = math.pi / 2; bpy.ops.object.transform_apply(rotation=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_yup=True, export_apply=True)
print('INFO band', len(me.polygons))
