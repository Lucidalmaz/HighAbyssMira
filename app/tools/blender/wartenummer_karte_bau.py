# Wartenummer-Karte „8“ (Pappe mit rotem Farbstreifen und erhabener, aufgedruckter Ziffer) – eigene Arbeit, Blender, ohne Texturen.
#   blender --background --factory-startup --threads 2 --python wartenummer_karte_bau.py -- <ausgabe.glb> [ziffer]
# Ursprung = Mitte der oberen Kante (Teil im Ausgabeschlitz), hängt nach −y (glTF), Vorderseite +z. Maße 4,2 × 7,5 cm, 0,6 mm dick.
import bpy, math, sys
a = sys.argv[sys.argv.index('--') + 1:]
OUT = a[0]; ZIFFER = a[1] if len(a) > 1 else '8'
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
scn = bpy.context.scene
def mat(n, col, r):
  m = bpy.data.materials.new(n); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
  b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = r; return m
M_P = mat('karte_pappe', (.62, .58, .46), .92); M_R = mat('karte_streifen', (.34, .035, .03), .8); M_T = mat('karte_druck', (.025, .024, .022), .6)
def sel(objs):
  bpy.ops.object.select_all(action='DESELECT')
  for o in objs: o.select_set(True)
  bpy.context.view_layer.objects.active = objs[0]
def box(x0, x1, y0, y1, z0, z1, m, bev=0.):
  bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)); o = bpy.context.object
  o.scale = (x1 - x0, y1 - y0, z1 - z0); bpy.ops.object.transform_apply(scale=True)
  if bev:
    b = o.modifiers.new('b', 'BEVEL'); b.width = bev; b.segments = 1; bpy.ops.object.modifier_apply(modifier='b')
  o.data.materials.append(m); return o
W, H, T = .042, .075, .0006   # Blender: x Breite, z Höhe (hängt nach −z), y Dicke (Front −y)
parts = [box(-W / 2, W / 2, -T, 0, -H, 0, M_P, bev=.0002)]
parts.append(box(-W / 2 + .0005, W / 2 - .0005, -T - .00012, -T + .00005, -.016, -.005, M_R))            # Farbstreifen oben
cu = bpy.data.curves.new('z', 'FONT'); cu.body = ZIFFER; cu.size = .036; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.extrude = .0002; cu.offset = 0
cu.materials.append(M_T)
o = bpy.data.objects.new('ziffer', cu); scn.collection.objects.link(o); o.location = (0, -T - .0002, -.047); o.rotation_euler = (math.pi / 2, 0, 0)
sel([o]); bpy.ops.object.convert(target='MESH'); parts.append(bpy.context.object)
sel(parts); bpy.ops.object.join(); k = bpy.context.object; k.name = 'wartenummer_karte'
bpy.ops.object.shade_smooth()
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_yup=True, export_apply=True)
print('FERTIG', len(k.data.polygons), OUT)
