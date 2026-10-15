# Fliege (Fab "Realistic Fly") auf ca. 3500 Dreiecke verkleinern (15.10.2026): gleiche UV/Texturen, 28 k -> 3,5 k Dreiecke (Instanzen an Tonnen und Kuechen)
#   blender -b --factory-startup -P fliege_decimate.py -- <model.fbx> <ausgabe.fbx> [ziel_dreiecke]
import bpy, sys
import os
a = sys.argv[sys.argv.index('--') + 1:]; OUT = a[0]; os.makedirs(OUT, exist_ok=True)
SRC = a[1] if len(a) > 1 else 'C:/Users/GIGABYTE/HighAbyssMira-Repo/game/assets/fly/model.fbx'; DST = os.path.join(OUT, 'model.fbx'); TARGET = int(a[2]) if len(a) > 2 else 1800
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.fbx(filepath=SRC)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
tot = sum(len(o.data.polygons) for o in meshes); print('INFO vorher', tot, [(o.name, len(o.data.polygons)) for o in meshes])
for o in meshes:
    bpy.context.view_layer.objects.active = o
    n = len(o.data.polygons); r = min(1.0, TARGET * n / max(tot, 1) / max(n, 1))
    md = o.modifiers.new('dec', 'DECIMATE'); md.decimate_type = 'COLLAPSE'; md.ratio = r; md.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier='dec')
print('INFO nachher', sum(len(o.data.polygons) for o in meshes))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.fbx(filepath=DST, use_selection=True, path_mode='COPY', embed_textures=False, add_leaf_bones=False)
