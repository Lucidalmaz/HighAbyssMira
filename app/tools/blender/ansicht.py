# Vorschau statischer GLB-Modelle (EEVEE, 800 px): Objekte nebeneinander (reihe) oder wie exportiert (ort).
#   blender -b --factory-startup --threads 2 --python ansicht.py -- <datei.glb> <ausgabe_praefix> <reihe|ort> <ansichten: name=az,el,abstand[,zielz][;...]> [zusatz.glb|fbx ...]
# az/el in Grad (az 0 = von vorn, Blender −y), abstand in Vielfachen der Modellgröße. Zusatzdateien (z. B. Außenhülle) werden mitgerendert.
import bpy, sys, math, os
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT, MODE, VIEWS = a[0], a[1], a[2], a[3]; EXTRA = a[4:]
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=GLB)
mine = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if MODE == 'reihe':
  mine.sort(key=lambda o: o.name); w = 0
  for o in mine:
    bb = [o.matrix_world @ Vector(c) for c in o.bound_box]; w = max(w, max(v.x for v in bb) - min(v.x for v in bb))
  for i, o in enumerate(mine): o.location.x += (i - (len(mine) - 1) / 2) * w * 1.25
for e in EXTRA:
  if e.endswith('.fbx'): bpy.ops.import_scene.fbx(filepath=e)
  else: bpy.ops.import_scene.gltf(filepath=e)
bpy.context.view_layer.update()
mn, mx = Vector((1e9,) * 3), Vector((-1e9,) * 3)
for o in mine:
  for c in o.bound_box: v = o.matrix_world @ Vector(c); mn = Vector(map(min, mn, v)); mx = Vector(map(max, mx, v))
c = (mn + mx) / 2; sz = max(mx - mn)
scn = bpy.context.scene
bpy.ops.mesh.primitive_plane_add(size=sz * 40, location=(c.x, c.y, mn.z - .0005)); pl = bpy.context.object
pm = bpy.data.materials.new('boden'); pm.use_nodes = True; bp = pm.node_tree.nodes['Principled BSDF']; bp.inputs['Base Color'].default_value = (.16, .155, .15, 1); bp.inputs['Roughness'].default_value = .85; pl.data.materials.append(pm)
def light(loc, e, s, col=(1, 1, 1)):
  ld = bpy.data.lights.new('l', 'AREA'); ld.energy = e; ld.size = s; ld.color = col; lo = bpy.data.objects.new('l', ld); scn.collection.objects.link(lo); lo.location = loc
  lo.rotation_euler = (c - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
k = sz
light(c + Vector((-1.3, -1.6, 1.8)) * k, 220 * k * k, k * 1.2, (1, .95, .88)); light(c + Vector((1.8, -.6, .8)) * k, 70 * k * k, k * 1.6, (.85, .9, 1)); light(c + Vector((.2, 2, 1.4)) * k, 110 * k * k, k, (1, 1, 1))
w = scn.world or bpy.data.worlds.new('w'); scn.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (.5, .52, .56, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = .35
for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
  try: scn.render.engine = eng; break
  except Exception: pass
try: scn.eevee.taa_render_samples = 48; scn.eevee.use_shadows = True; scn.eevee.use_raytracing = True
except Exception: pass
scn.render.resolution_x = 800; scn.render.resolution_y = 600
scn.view_settings.view_transform = 'AgX' if 'AgX' in [i.identifier for i in scn.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'
cd = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cd); scn.collection.objects.link(cam); scn.camera = cam; cd.lens = 50
for v in VIEWS.split(';'):
  name, p = v.split('='); q = [float(x) for x in p.split(',')]; az, el, d = math.radians(q[0]), math.radians(q[1]), q[2]
  tgt = Vector((c.x, c.y, q[3] if len(q) > 3 else c.z)) if len(q) <= 4 else Vector((q[4], q[5], q[3]))
  dv = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
  cam.location = tgt + dv * d * sz; cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler(); cd.clip_start = sz * .005; cd.clip_end = sz * 200
  if len(q) > 6: cd.lens = q[6]
  scn.render.filepath = OUT + '_' + name + '.png'; bpy.ops.render.render(write_still=True); print('VORSCHAU', scn.render.filepath)
