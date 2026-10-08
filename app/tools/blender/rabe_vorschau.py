# Vorschau des fertigen Raben-GLB: Clip/Bild wählen, Studio-Licht, EEVEE 800 px, mehrere Winkel + Nahaufnahme Kopf (+ Fuß).
#   blender --background --factory-startup --threads 2 --python rabe_vorschau.py -- <glb> <ausgabe_präfix> <clip> <bild> <ansichten: 34,seite,vorn,hinten,oben,unten,kopf,kopf2,fuss>
import bpy, sys, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT, CLIP, FR, VIEWS = a[0], a[1], a[2], int(a[3]), a[4].split(',')
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=GLB, bone_heuristic='BLENDER')
scn = bpy.context.scene; arm = next(o for o in scn.objects if o.type == 'ARMATURE'); mo = next(o for o in scn.objects if o.type == 'MESH')
ad = arm.animation_data
for t in ad.nla_tracks: t.mute = True
ad.action = bpy.data.actions.get(CLIP) or bpy.data.actions.get('ANIM_Crow_' + CLIP)
scn.frame_set(FR); dg = bpy.context.evaluated_depsgraph_get(); e = mo.evaluated_get(dg); m = e.to_mesh()
ps = [mo.matrix_world @ v.co for v in m.vertices]; e.to_mesh_clear()
mn = Vector((min(p.x for p in ps), min(p.y for p in ps), min(p.z for p in ps))); mx = Vector((max(p.x for p in ps), max(p.y for p in ps), max(p.z for p in ps)))
c = (mn + mx) / 2; sz = max(mx - mn)
fly = (mx - mn).x > .3
if not fly:
  bpy.ops.mesh.primitive_plane_add(size=sz * 40, location=(c.x, c.y, mn.z - .0005)); pl = bpy.context.object
  pm = bpy.data.materials.new('boden'); pm.use_nodes = True; bp = pm.node_tree.nodes['Principled BSDF']; bp.inputs['Base Color'].default_value = (.3, .29, .27, 1); bp.inputs['Roughness'].default_value = .85; pl.data.materials.append(pm)
def light(kind, loc, energy, size, col=(1, 1, 1)):
  ld = bpy.data.lights.new('l', kind); ld.energy = energy; ld.color = col
  if kind == 'AREA': ld.size = size
  lo = bpy.data.objects.new('l', ld); scn.collection.objects.link(lo); lo.location = loc; lo.rotation_euler = (c - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
k = .5
light('AREA', c + Vector((-1.2, -1.0, 1.6)) * k, 60, .5, (1, .96, .9))
light('AREA', c + Vector((1.5, .8, .6)) * k, 22, .6, (.8, .88, 1))
light('AREA', c + Vector((.2, 1.8, 1.0)) * k, 35, .3, (1, 1, 1))
w = scn.world or bpy.data.worlds.new('w'); scn.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs['Strength'].default_value = .35; bg.inputs['Color'].default_value = (.5, .52, .56, 1)
for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
  try: scn.render.engine = eng; break
  except Exception: pass
try: scn.eevee.taa_render_samples = 48
except Exception: pass
scn.render.resolution_x = 800; scn.render.resolution_y = 600; scn.view_settings.view_transform = 'AgX'
for mt in bpy.data.materials:
  try: mt.blend_method = 'CLIP'
  except Exception: pass
cd = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cd); scn.collection.objects.link(cam); scn.camera = cam; cd.lens = 85; cd.clip_start = .002
hb = next(b for b in arm.pose.bones if b.name.endswith('-Head')); hp = arm.matrix_world @ hb.head
fb = next(b for b in arm.pose.bones if b.name.endswith('-L-Foot')); fp = arm.matrix_world @ fb.head
D = {'34': Vector((-1.1, -1.3, .8)), 'seite': Vector((1.6, -.05, .3)), 'vorn': Vector((.15, -1.6, .3)), 'hinten': Vector((-.4, 1.4, .8)), 'oben': Vector((0, .3, 1.6)), 'unten': Vector((.2, -.3, -1.5)),
     'kopf': Vector((1.0, -1.1, .35)), 'kopf2': Vector((-.9, -.9, .15)), 'fuss': Vector((.9, -1.2, .35))}
for VV in VIEWS:
  dv = D[VV].normalized()
  if VV.startswith('kopf'): tgt = hp + Vector((0, -.04, .005)); dist = .42
  elif VV == 'fuss': tgt = fp + Vector((0, -.01, .01)); dist = .3
  else: tgt = c; dist = sz * 2.0 * (85 / 50)
  cam.location = tgt + dv * dist; cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
  scn.render.filepath = OUT + '_' + VV + '.png'; bpy.ops.render.render(write_still=True); print('BILD', scn.render.filepath)
