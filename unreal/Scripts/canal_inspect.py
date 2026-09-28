"""Untersucht die Kanal-Karten: Anzahl Actors, Mesh-Nutzung, Ausdehnung."""
import os, json, unreal
HERE = os.path.dirname(os.path.abspath(__file__))
LES = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem); EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
out = {}
for mp in ['/Game/Singapore_Canal/Map/Night01', '/Game/Singapore_Canal/Map/Singapore_Canal', '/Game/Singapore_Canal/Map/AssetsShowcase']:
    try:
        LES.load_level(mp)
        acts = EAS.get_all_level_actors(); kinds = {}; meshes = {}; lo = [1e9] * 3; hi = [-1e9] * 3; lights = 0
        for a in acts:
            k = a.get_class().get_name(); kinds[k] = kinds.get(k, 0) + 1
            if isinstance(a, unreal.Light): lights += 1
            for c in a.get_components_by_class(unreal.StaticMeshComponent):
                m = c.get_editor_property('static_mesh')
                if not m: continue
                n = m.get_name(); meshes[n] = meshes.get(n, 0) + (c.get_instance_count() if isinstance(c, unreal.InstancedStaticMeshComponent) else 1)
                o, e = a.get_actor_bounds(False)
                for i, v in enumerate([o.x, o.y, o.z]): lo[i] = min(lo[i], v - [e.x, e.y, e.z][i]); hi[i] = max(hi[i], v + [e.x, e.y, e.z][i])
        out[mp] = {'actors': len(acts), 'lights': lights, 'kinds': dict(sorted(kinds.items(), key=lambda x: -x[1])[:15]), 'mesh_types': len(meshes), 'mesh_uses': sum(meshes.values()), 'top_meshes': dict(sorted(meshes.items(), key=lambda x: -x[1])[:25]), 'bounds_cm': [lo, hi]}
    except Exception as e:
        out[mp] = str(e)
json.dump(out, open(os.path.join(HERE, 'canal_inspect.json'), 'w'), indent=1)
