"""Kapelle St. Martin (Foto-Scan, 840 000 Dreiecke) -> vereinfachte Huelle <= 60 000 Dreiecke.
Aufruf: blender-launcher.exe -b --factory-startup -P chapel_lo.py -- <ziel_dreiecke>
Behaelt Materialnamen/UV; schreibt model_lo.fbx neben das Original und chapel_lo_report.json."""
import bpy, sys, os, json

SRC = r'C:\Users\GIGABYTE\HighAbyssMira-Repo\app\game\assets\ms\chapel\model.fbx'
DST = r'C:\Users\GIGABYTE\HighAbyssMira-Repo\app\game\assets\ms\chapel\model_lo.fbx'
REP = r'C:\Users\GIGABYTE\_arch\blender\chapel_lo_report.json'
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
TARGET = int(argv[0]) if argv else 60000

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=SRC)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
rep = {'objects_in': [], 'target': TARGET}


def tris(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons)


for o in meshes:
    rep['objects_in'].append({'name': o.name, 'tris': tris(o), 'mats': [s.material.name if s.material else None for s in o.material_slots],
                              'dim': [round(v, 3) for v in o.dimensions], 'scale': [round(v, 4) for v in o.scale]})
total = sum(tris(o) for o in meshes)
for o in meshes:
    t = tris(o)
    ratio = max(0.005, min(1.0, TARGET * (t / total) / t))
    bpy.context.view_layer.objects.active = o
    for ob in bpy.context.scene.objects:
        ob.select_set(ob == o)
    # Dreiecke vorab (Decimate arbeitet mit Quads schlechter)
    tm = o.modifiers.new('tri', 'TRIANGULATE')
    bpy.ops.object.modifier_apply(modifier=tm.name)
    dm = o.modifiers.new('dec', 'DECIMATE')
    dm.decimate_type = 'COLLAPSE'
    dm.ratio = ratio
    dm.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=dm.name)
    # Normalen glaetten, Verwaiste Punkte weg
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.delete_loose()
    bpy.ops.object.mode_set(mode='OBJECT')
rep['objects_out'] = [{'name': o.name, 'tris': tris(o), 'dim': [round(v, 3) for v in o.dimensions]} for o in meshes]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.fbx(filepath=DST, use_selection=True, object_types={'MESH'}, global_scale=1.0, apply_unit_scale=False,
                         apply_scale_options='FBX_SCALE_NONE', axis_forward='-Z', axis_up='Y', bake_space_transform=False,
                         mesh_smooth_type='FACE', use_mesh_modifiers=True, path_mode='STRIP', embed_textures=False)
rep['size_bytes'] = os.path.getsize(DST)
json.dump(rep, open(REP, 'w'), indent=1)
print('KAPELLE FERTIG', rep['objects_out'])
