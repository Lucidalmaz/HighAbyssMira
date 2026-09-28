"""Kanalstadt fürs Browser-/App-Spiel: jedes verwendete Bauteil einzeln als GLB + alle Platzierungen als JSON.
Umrechnung Unreal -> glTF (wie der Exporter): Position (X, Z, Y) * 0.01, Quaternion (-qx, -qz, -qy, qw), Skalierung (sx, sz, sy)."""
import os, json, unreal
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.abspath(unreal.Paths.project_saved_dir()), 'GameExport', 'canal_parts'); os.makedirs(OUT, exist_ok=True)
LES = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem); EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
LES.load_level('/Game/Singapore_Canal/Map/Singapore_Canal')
SKIP = {'SM_SkySphere', 'SM_Template_Map_Floor'}
inst = {}; paths = {}
def add(mesh, tf):
    n = mesh.get_name()
    if n in SKIP: return
    paths[n] = mesh.get_path_name().split('.')[0]
    l, q, s = tf.translation, tf.rotation, tf.scale3d
    inst.setdefault(n, []).append([round(l.x * .01, 4), round(l.z * .01, 4), round(l.y * .01, 4), round(-q.x, 6), round(-q.z, 6), round(-q.y, 6), round(q.w, 6), round(s.x, 4), round(s.z, 4), round(s.y, 4)])
for a in EAS.get_all_level_actors():
    if isinstance(a, unreal.Light): continue
    for c in a.get_components_by_class(unreal.StaticMeshComponent):
        m = c.get_editor_property('static_mesh')
        if not m or not c.is_visible(): continue
        if isinstance(c, unreal.InstancedStaticMeshComponent):
            for i in range(c.get_instance_count()): add(m, c.get_instance_transform(i, True))
        else: add(m, c.get_world_transform())
o = unreal.GLTFExportOptions()
for k, v in [('export_lights', False), ('export_cameras', False), ('texture_image_format', unreal.GLTFTextureImageFormat.JPEG), ('texture_image_quality', 85), ('export_vertex_colors', False)]:
    try: o.set_editor_property(k, v)
    except Exception as e: unreal.log_warning(f'{k}: {e}')
done = 0
for n, p in paths.items():
    fn = os.path.join(OUT, n + '.glb')
    if os.path.exists(fn): done += 1; continue
    try: unreal.GLTFExporter.export_to_gltf(unreal.load_asset(p), fn, o, set()); done += 1
    except Exception as e: unreal.log_warning(f'{n}: {e}')
json.dump({'instances': inst, 'paths': paths}, open(os.path.join(OUT, 'instances.json'), 'w'))
open(os.path.join(HERE, 'export_log.txt'), 'w').write(f'{done} Bauteile exportiert, {sum(len(v) for v in inst.values())} Platzierungen')
