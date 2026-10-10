# Staubtücher über Möbeln (Haus Nr. 1, Wohnzimmer): echtes Tuch per Cloth-Simulation über Möbelkörper gefallen – eigene Arbeit, Blender.
#   blender --background --factory-startup --threads 2 --python run_prop.py -- laken_bau.py <ausgabeordner>
# Drei Teile (Ursprung = Mitte der früheren Box, Boden bei y = −0,425): laken_sofa · laken_sessel · laken_kommode. Nur Geometrie + UV (Meter), das Spiel setzt den Gardinen-Stoff.
import bpy, bmesh, math, os, sys, json, time, random
a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = a[0] if a else os.getcwd(); os.makedirs(OUT, exist_ok=True)
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
scn = bpy.context.scene
FLOOR = -.425
def box(name, x0, x1, gz0, gz1, gy0, gy1, bev=.02):
  # Spiel-Koordinaten (x, y hoch, z) -> Blender (x, −z, y)
  bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, -(gz0 + gz1) / 2, (gy0 + gy1) / 2)); o = bpy.context.object; o.name = name
  o.scale = (x1 - x0, gz1 - gz0, gy1 - gy0); bpy.ops.object.transform_apply(scale=True)
  b = o.modifiers.new('b', 'BEVEL'); b.width = bev; b.segments = 3; bpy.ops.object.modifier_apply(modifier='b')
  o.modifiers.new('Collision', 'COLLISION'); o.collision.thickness_outer = .004; o.collision.thickness_inner = .01; o.collision.use_culling = False
  return o
def drape(name, proxies, sx, sz, top, frames=90, res=.04, seed=1):
  # Boden als Kollision
  bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, FLOOR)); fl = bpy.context.object; fl.name = 'boden'; fl.modifiers.new('Collision', 'COLLISION'); fl.collision.thickness_outer = .004
  # Tuch
  nx, ny = int(sx / res), int(sz / res)
  bpy.ops.mesh.primitive_grid_add(x_subdivisions=nx, y_subdivisions=ny, size=1, location=(0, 0, top + .28)); cl = bpy.context.object; cl.name = name
  cl.scale = (sx, sz, 1); bpy.ops.object.transform_apply(scale=True)
  r = random.Random(seed); cl.rotation_euler[2] = r.uniform(-.08, .08)   # leicht verdreht aufgelegt
  bpy.ops.object.transform_apply(rotation=True)
  m = cl.modifiers.new('Cloth', 'CLOTH'); s = m.settings
  s.quality = 8; s.mass = .25; s.tension_stiffness = 18; s.compression_stiffness = 18; s.shear_stiffness = 12; s.bending_stiffness = 1.2; s.air_damping = 1.6
  c = m.collision_settings; c.use_collision = True; c.distance_min = .012; c.use_self_collision = False; c.collision_quality = 4
  scn.frame_start = 1; scn.frame_end = frames
  for f in range(1, frames + 1): scn.frame_set(f)
  dg = bpy.context.evaluated_depsgraph_get(); ev = cl.evaluated_get(dg); me = bpy.data.meshes.new_from_object(ev)
  out = bpy.data.objects.new(name + '_final', me); scn.collection.objects.link(out)
  bpy.data.objects.remove(cl, do_unlink=True); bpy.data.objects.remove(fl, do_unlink=True)
  for p in proxies: bpy.data.objects.remove(p, do_unlink=True)
  out.name = name
  bpy.context.view_layer.objects.active = out
  # glatt + UV (Draufsicht, Meter)
  for p in me.polygons: p.use_smooth = True
  uv = me.uv_layers.new(name='UVMap')
  for li, l in enumerate(me.loops):
    v = me.vertices[l.vertex_index].co; uv.data[li].uv = (v.x, v.y)
  return out
objs = []
# Sofa: Sitz, Lehne an +x, zwei Armlehnen
px = [box('p1', -.475, .475, -1.1, 1.1, FLOOR, -.005), box('p2', .215, .475, -1.0, 1.0, -.005, .425), box('p3', -.475, .475, -1.1, -.88, -.005, .195), box('p4', -.475, .475, .88, 1.1, -.005, .195)]
objs.append(drape('laken_sofa', px, 1.95, 3.2, .425, seed=1))
# Sessel: Sitz, Lehne an −z, Armlehnen
px = [box('p1', -.45, .45, -.45, .45, FLOOR, -.005), box('p2', -.45, .45, -.45, -.2, -.005, .575), box('p3', -.45, -.27, -.2, .45, -.005, .2), box('p4', .27, .45, -.2, .45, -.005, .2)]
objs.append(drape('laken_sessel', px, 1.9, 1.9, .575, seed=2))
# Kommode (im Spiel nur verdeckt vorhanden)
px = [box('p1', -.7, .7, -.3, .3, FLOOR, .625)]
objs.append(drape('laken_kommode', px, 2.2, 1.5, .625, seed=3))
for o in objs: o.select_set(True)
bpy.ops.object.select_all(action='DESELECT')
for o in objs: o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
for o in objs:
  me = o.data
  print(o.name, len(me.vertices), 'Verts', [round(min(v.co[i] for v in me.vertices), 2) for i in range(3)], [round(max(v.co[i] for v in me.vertices), 2) for i in range(3)], flush=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'laken.glb'), export_format='GLB', use_selection=True, export_yup=True, export_apply=True)
print('FERTIG')
