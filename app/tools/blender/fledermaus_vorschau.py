# Vorschau der Fledermaus (Blender, EEVEE): blender -b --factory-startup -P fledermaus_vorschau.py -- <blend> <ausgabe_praefix> <clip> <bild> <ansicht> [nahe]
#   ansicht: oben | vorn | seite | drei | kopf | hinten | unten;  clip: Flap | Glide
import bpy, sys, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
BL, OUT, CLIP, FR, VIEW = a[0], a[1], a[2], int(a[3]), a[4]
bpy.ops.wm.open_mainfile(filepath=BL)
scn = bpy.context.scene
arm = bpy.data.objects['FledermausRig']; arm.animation_data.action = bpy.data.actions[CLIP]
scn.frame_set(FR); bpy.context.view_layer.update()
ob = bpy.data.objects['Fledermaus']; dg = bpy.context.evaluated_depsgraph_get(); e = ob.evaluated_get(dg); m = e.to_mesh()
ps = [ob.matrix_world @ v.co for v in m.vertices]; e.to_mesh_clear()
mn = Vector((min(p.x for p in ps), min(p.y for p in ps), min(p.z for p in ps))); mx = Vector((max(p.x for p in ps), max(p.y for p in ps), max(p.z for p in ps)))
c = (mn + mx) / 2; sz = max(mx - mn)
if VIEW == 'kopf': c = Vector((0, -0.05, 0.01)); sz = 0.09
def light(kind, loc, energy, size, col=(1, 1, 1)):
    ld = bpy.data.lights.new('l', kind); ld.energy = energy; ld.color = col
    if kind == 'AREA': ld.size = size
    lo = bpy.data.objects.new('l', ld); scn.collection.objects.link(lo); lo.location = loc; lo.rotation_euler = (c - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
d = sz * 2.2
light('AREA', c + Vector((-.7, -.9, 1.2)).normalized() * d, 7, d * .5, (1, .93, .85))
light('AREA', c + Vector((1.0, .6, .4)).normalized() * d, 2.5, d * .5, (.7, .8, 1))
light('AREA', c + Vector((0, 1.0, 1.0)).normalized() * d, 4, d * .4)
w = bpy.data.worlds.new('w'); scn.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs['Strength'].default_value = .25; bg.inputs['Color'].default_value = (.12, .13, .16, 1)
for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
    try: scn.render.engine = eng; break
    except Exception: pass
scn.render.resolution_x = 1000; scn.render.resolution_y = 700; scn.view_settings.view_transform = 'Standard'
cd = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cd); scn.collection.objects.link(cam); scn.camera = cam; cd.lens = 70; cd.clip_start = .005
dirs = {'oben': (0, 0.001, 1), 'vorn': (0, -1, .15), 'seite': (1, 0, .15), 'drei': (.7, -.8, .55), 'hinten': (0, 1, .2), 'unten': (0, 0.001, -1), 'kopf': (.55, -.8, .25)}
dv = Vector(dirs[VIEW]).normalized(); dist = sz * (1.5 if VIEW != 'kopf' else 2.0) * (70 / 36.0) / 1.7
cam.location = c + dv * dist; cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler()
scn.render.filepath = OUT + '.png'; bpy.ops.render.render(write_still=True)
print('INFO bild', OUT)
