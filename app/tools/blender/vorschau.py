# Vorschau eines GLB (prüft den Export): importieren, Clip auf ein Bild stellen, Studio-Licht, EEVEE 800 px.
#   blender --background --factory-startup --threads 2 --python vorschau.py -- <datei.glb> <ausgabe.png> [clip] [bild] [ansicht: 34|seite|oben|nah|vorn] [boden: hell|dunkel]
import bpy, sys, math, os
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
GLB, PNG = a[0], a[1]; CLIP = a[2] if len(a) > 2 else 'walk'; FRS = [int(x) for x in a[3].split(',')] if len(a) > 3 else [5]; FR = FRS[0]; VIEW = a[4] if len(a) > 4 else '34'; FLOOR = a[5] if len(a) > 5 else 'hell'
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scn = bpy.context.scene
arm = next((o for o in scn.objects if o.type == 'ARMATURE'), None)
if arm and arm.animation_data:
  act = bpy.data.actions.get(CLIP)
  for t in arm.animation_data.nla_tracks: t.mute = True
  if act: arm.animation_data.action = act
scn.frame_set(FR)
dg = bpy.context.evaluated_depsgraph_get()
mn_, mx_ = Vector((1e9,) * 3), Vector((-1e9,) * 3)
MESHES = [o for o in scn.objects if o.type == 'MESH' and (o.parent == arm or any(m.type == 'ARMATURE' for m in o.modifiers) or not arm)]
for o in scn.objects:
  if o.type == 'MESH' and o not in MESHES: o.hide_render = True
for o in MESHES:
  e = o.evaluated_get(dg); m = e.to_mesh()
  for v in m.vertices:
    w = o.matrix_world @ v.co; mn_ = Vector(map(min, mn_, w)); mx_ = Vector(map(max, mx_, w))
  e.to_mesh_clear()
c = (mn_ + mx_) / 2; sz = max((mx_ - mn_).x, (mx_ - mn_).y, (mx_ - mn_).z)
bpy.ops.mesh.primitive_plane_add(size=sz * 30, location=(c.x, c.y, mn_.z - sz * .001))
pl = bpy.context.object; pm = bpy.data.materials.new('boden'); pm.use_nodes = True; bp = pm.node_tree.nodes['Principled BSDF']
bp.inputs['Base Color'].default_value = (.22, .21, .2, 1) if FLOOR == 'hell' else (.06, .055, .05, 1); bp.inputs['Roughness'].default_value = .8; pl.data.materials.append(pm)
def light(kind, loc, energy, size, col=(1, 1, 1)):
  ld = bpy.data.lights.new('l', kind); ld.energy = energy; ld.color = col
  if kind == 'AREA': ld.size = size
  lo = bpy.data.objects.new('l', ld); scn.collection.objects.link(lo); lo.location = loc
  d = c - Vector(loc); lo.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); return lo
k = sz
light('AREA', c + Vector((-1.2, -1.0, 1.6)) * k * 2, 6 * k * k * 40, k * 1.5, (1, .96, .9))
light('AREA', c + Vector((1.5, .8, .6)) * k * 2, 2.5 * k * k * 40, k * 2, (.8, .88, 1))
light('AREA', c + Vector((0, 2, 1.2)) * k * 2, 3 * k * k * 40, k, (1, 1, 1))
w = scn.world or bpy.data.worlds.new('w'); scn.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Strength'].default_value = .25
cam_d = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cam_d); scn.collection.objects.link(cam); scn.camera = cam; cam_d.lens = 85
dirs = {'34': Vector((-1.1, 1.3, .9)), 'seite': Vector((-1.6, .1, .35)), 'oben': Vector((0, .02, 1.6)), 'nah': Vector((-.5, 1.4, .45)), 'vorn': Vector((0, 1.6, .25)), 'hinten': Vector((-.3, -1.4, .9))}
ok = False
for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
  try: scn.render.engine = eng; ok = True; break
  except Exception: pass
try: scn.eevee.taa_render_samples = 32
except Exception: pass
scn.render.resolution_x = 800; scn.render.resolution_y = 600; scn.render.film_transparent = False
scn.view_settings.view_transform = 'AgX' if 'AgX' in [i.identifier for i in scn.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'
for VV in VIEW.split(','):
  dv = dirs.get(VV, dirs['34']).normalized(); dist = sz * 2.25 * (85 / 50); tgt = c
  if VV == 'nah' and arm and 'body' in arm.data.bones:
    bc = arm.matrix_world @ arm.data.bones['body'].head_local; ab = arm.matrix_world @ arm.data.bones['abdomen'].tail_local
    ab = arm.matrix_world @ arm.data.bones['abdomen'].head_local; tgt = bc + (bc - ab) * -.6; dist = (ab - bc).length * 5.5 * (85 / 50)
  cam.location = tgt + dv * dist; cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler(); cam_d.clip_start = sz * .01; cam_d.clip_end = sz * 100
  for F in FRS:
    scn.frame_set(F); scn.render.filepath = PNG.replace('.png', '_' + VV + ('_%d' % F if len(FRS) > 1 else '') + '.png'); bpy.ops.render.render(write_still=True)
    print('VORSCHAU', scn.render.filepath, scn.render.engine)
