# Tier-Vorschau (Tier-Audit 15.10.2026): beliebiges GLB/GLTF/FBX importieren, automatisch einrahmen, 3 Ansichten rendern (EEVEE).
#   blender -b --factory-startup -P tier_vorschau.py -- <modell> <ausgabe_praefix> [textur.jpg] [bild]
import bpy, sys, math, os
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = a[0], a[1]; TEX = a[2] if len(a) > 2 and a[2] != '-' else None; FR = int(a[3]) if len(a) > 3 else 1
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
ext = os.path.splitext(SRC)[1].lower()
if ext in ('.glb', '.gltf'): bpy.ops.import_scene.gltf(filepath=SRC)
elif ext == '.fbx': bpy.ops.import_scene.fbx(filepath=SRC)
scn = bpy.context.scene; scn.frame_set(FR); bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get(); pts = []
for o in scn.objects:
    if o.type == 'MESH' and not o.hide_get():
        if TEX:
            m = bpy.data.materials.new('t'); m.use_nodes = True; im = bpy.data.images.load(TEX); n = m.node_tree.nodes.new('ShaderNodeTexImage'); n.image = im
            m.node_tree.links.new(n.outputs[0], m.node_tree.nodes['Principled BSDF'].inputs['Base Color']); o.data.materials.clear(); o.data.materials.append(m)
        e = o.evaluated_get(dg); me = e.to_mesh()
        pts += [o.matrix_world @ v.co for v in me.vertices]; e.to_mesh_clear()
    elif o.type in ('LIGHT', 'CAMERA'): bpy.data.objects.remove(o, do_unlink=True)
def pc(vals, q): vals = sorted(vals); return vals[min(len(vals) - 1, max(0, int(len(vals) * q)))]
mn = Vector((pc([p.x for p in pts], .01), pc([p.y for p in pts], .01), pc([p.z for p in pts], .01))); mx = Vector((pc([p.x for p in pts], .99), pc([p.y for p in pts], .99), pc([p.z for p in pts], .99)))
c = (mn + mx) / 2; sz = max(mx - mn); print('INFO size', tuple(round(v, 3) for v in (mx - mn)), 'tris?', len(pts))
def light(loc, energy, size, col=(1, 1, 1)):
    ld = bpy.data.lights.new('l', 'AREA'); ld.energy = energy; ld.color = col; ld.size = size
    lo = bpy.data.objects.new('l', ld); scn.collection.objects.link(lo); lo.location = loc; lo.rotation_euler = (c - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
d = sz * 2.0
k = (d / 2.0) ** 2
light(c + Vector((-.7, -.9, 1.1)).normalized() * d, 380 * k, d * .6, (1, .95, .88)); light(c + Vector((1.0, .6, .4)).normalized() * d, 120 * k, d * .6, (.8, .88, 1)); light(c + Vector((0, 1.0, 1.0)).normalized() * d, 160 * k, d * .5)
w = bpy.data.worlds.new('w'); scn.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs['Strength'].default_value = .6; bg.inputs['Color'].default_value = (.35, .37, .42, 1)
for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
    try: scn.render.engine = eng; break
    except Exception: pass
scn.render.resolution_x = 800; scn.render.resolution_y = 560; scn.view_settings.view_transform = 'Standard'
cd = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cd); scn.collection.objects.link(cam); scn.camera = cam; cd.lens = 60; cd.clip_start = .001
for name, dv in (('a', (.7, -.8, .45)), ('b', (1, 0, .12)), ('c', (0, -1, .2))):
    dvv = Vector(dv).normalized(); cam.location = c + dvv * sz * 2.0; cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scn.render.filepath = OUT + '_' + name + '.png'; bpy.ops.render.render(write_still=True)
print('INFO fertig')
